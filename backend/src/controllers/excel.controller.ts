import { Request, Response } from 'express';
import { pool } from '../config/database';
import ExcelJS from 'exceljs';

// İşlemleri Excel'e aktar
export const exportIslemler = async (req: Request, res: Response) => {
  try {
    const { baslangic, bitis } = req.query;

    // İşlemleri çek
    let query = `
      SELECT 
        i.id,
        i.tarih,
        i.tip,
        i.gelir_tipi,
        i.tutar,
        i.aciklama,
        i.kasa_yansima_tarihi,
        k.ad as kategori_ad
      FROM islemler i
      LEFT JOIN kategoriler k ON i.kategori_id = k.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (baslangic) {
      conditions.push(`i.tarih >= $${params.length + 1}`);
      params.push(baslangic);
    }

    if (bitis) {
      conditions.push(`i.tarih <= $${params.length + 1}`);
      params.push(bitis);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY i.tarih DESC, i.created_at DESC';

    const result = await pool.query(query, params);

    // Excel oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('İşlemler');

    // Başlıklar
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tarih', key: 'tarih', width: 15 },
      { header: 'Tip', key: 'tip', width: 10 },
      { header: 'Gelir Tipi', key: 'gelir_tipi', width: 12 },
      { header: 'Tutar', key: 'tutar', width: 15 },
      { header: 'Kategori', key: 'kategori', width: 20 },
      { header: 'Açıklama', key: 'aciklama', width: 30 },
      { header: 'Kasaya Yansıma', key: 'kasa_yansima', width: 15 },
    ];

    // Başlık satırını stillendir
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Verileri ekle
    result.rows.forEach((islem: any) => {
      worksheet.addRow({
        id: islem.id,
        tarih: new Date(islem.tarih).toLocaleDateString('tr-TR'),
        tip: islem.tip.toUpperCase(),
        gelir_tipi: islem.gelir_tipi ? islem.gelir_tipi.toUpperCase() : '-',
        tutar: parseFloat(islem.tutar),
        kategori: islem.kategori_ad || 'Kategorisiz',
        aciklama: islem.aciklama || '-',
        kasa_yansima: islem.kasa_yansima_tarihi 
          ? new Date(islem.kasa_yansima_tarihi).toLocaleDateString('tr-TR')
          : '-'
      });
    });

    // Tutar kolonunu para formatında göster
    worksheet.getColumn('tutar').numFmt = '₺#,##0.00';

    // Dosyayı gönder
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=islemler_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export hatası:', error);
    res.status(500).json({ error: 'Excel oluşturulamadı' });
  }
};

// Aylık raporu Excel'e aktar
export const exportAylikRapor = async (req: Request, res: Response) => {
  try {
    const { yil, ay } = req.query;
    
    const secilenYil = yil ? parseInt(yil as string) : new Date().getFullYear();
    const secilenAy = ay ? parseInt(ay as string) : new Date().getMonth() + 1;
    
    const ayBaslangic = `${secilenYil}-${String(secilenAy).padStart(2, '0')}-01`;
    const sonrakiAy = secilenAy === 12 ? 1 : secilenAy + 1;
    const sonrakiYil = secilenAy === 12 ? secilenYil + 1 : secilenYil;
    const ayBitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01`;

    // Özet verileri çek
    const gelirResult = await pool.query(
      'SELECT COALESCE(SUM(tutar), 0) as toplam FROM islemler WHERE tip = $1 AND tarih >= $2 AND tarih < $3',
      ['gelir', ayBaslangic, ayBitis]
    );

    const giderResult = await pool.query(
      'SELECT COALESCE(SUM(tutar), 0) as toplam FROM islemler WHERE tip = $1 AND tarih >= $2 AND tarih < $3',
      ['gider', ayBaslangic, ayBitis]
    );

    // Kategori dağılımı
    const kategoriResult = await pool.query(
      `SELECT 
        k.ad,
        k.tip,
        COALESCE(SUM(i.tutar), 0) as toplam,
        COUNT(i.id) as adet
       FROM kategoriler k
       LEFT JOIN islemler i ON k.id = i.kategori_id 
         AND i.tarih >= $1 
         AND i.tarih < $2
       GROUP BY k.id, k.ad, k.tip
       ORDER BY toplam DESC`,
      [ayBaslangic, ayBitis]
    );

    // Excel oluştur
    const workbook = new ExcelJS.Workbook();
    
    // Özet sayfası
    const ozetSheet = workbook.addWorksheet('Özet');
    
    const ayAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    ozetSheet.mergeCells('A1:B1');
    ozetSheet.getCell('A1').value = `${ayAdlari[secilenAy - 1]} ${secilenYil} Raporu`;
    ozetSheet.getCell('A1').font = { size: 16, bold: true };
    ozetSheet.getCell('A1').alignment = { horizontal: 'center' };
    
    ozetSheet.addRow([]);
    ozetSheet.addRow(['Toplam Gelir', parseFloat(gelirResult.rows[0].toplam)]);
    ozetSheet.addRow(['Toplam Gider', parseFloat(giderResult.rows[0].toplam)]);
    ozetSheet.addRow(['Net', parseFloat(gelirResult.rows[0].toplam) - parseFloat(giderResult.rows[0].toplam)]);
    
    ozetSheet.getColumn(1).width = 20;
    ozetSheet.getColumn(2).width = 20;
    ozetSheet.getColumn(2).numFmt = '₺#,##0.00';

    // Kategori dağılımı sayfası
    const kategoriSheet = workbook.addWorksheet('Kategori Dağılımı');
    
    kategoriSheet.columns = [
      { header: 'Kategori', key: 'kategori', width: 25 },
      { header: 'Tip', key: 'tip', width: 10 },
      { header: 'Tutar', key: 'tutar', width: 15 },
      { header: 'İşlem Sayısı', key: 'adet', width: 15 },
    ];

    kategoriSheet.getRow(1).font = { bold: true };
    kategoriSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    kategoriSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    kategoriResult.rows.forEach((k: any) => {
      if (parseFloat(k.toplam) > 0) {
        kategoriSheet.addRow({
          kategori: k.ad,
          tip: k.tip.toUpperCase(),
          tutar: parseFloat(k.toplam),
          adet: parseInt(k.adet)
        });
      }
    });

    kategoriSheet.getColumn('tutar').numFmt = '₺#,##0.00';

    // Dosyayı gönder
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=rapor_${secilenYil}_${String(secilenAy).padStart(2, '0')}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Rapor export hatası:', error);
    res.status(500).json({ error: 'Rapor oluşturulamadı' });
  }
};