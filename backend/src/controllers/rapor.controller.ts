import { Request, Response } from 'express';
import { pool } from '../config/database';

// Aylık özet rapor
export const getAylikOzet = async (req: Request, res: Response) => {
  try {
    const { yil, ay } = req.query;
    
    // Varsayılan: Bu ay
    const tarih = new Date();
    const secilenYil = yil ? parseInt(yil as string) : tarih.getFullYear();
    const secilenAy = ay ? parseInt(ay as string) : tarih.getMonth() + 1;
    
    // Ayın ilk ve son günü
    const ayBaslangic = `${secilenYil}-${String(secilenAy).padStart(2, '0')}-01`;
    const sonrakiAy = secilenAy === 12 ? 1 : secilenAy + 1;
    const sonrakiYil = secilenAy === 12 ? secilenYil + 1 : secilenYil;
    const ayBitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01`;
    
    // Toplam gelir
    const gelirResult = await pool.query(
      `SELECT COALESCE(SUM(tutar), 0) as toplam 
       FROM islemler 
       WHERE tip = 'gelir' 
       AND tarih >= $1 
       AND tarih < $2`,
      [ayBaslangic, ayBitis]
    );
    
    // Toplam gider
    const giderResult = await pool.query(
      `SELECT COALESCE(SUM(tutar), 0) as toplam 
       FROM islemler 
       WHERE tip = 'gider' 
       AND tarih >= $1 
       AND tarih < $2`,
      [ayBaslangic, ayBitis]
    );
    
    // İşlem sayıları
    const islemSayisiResult = await pool.query(
      `SELECT tip, COUNT(*) as adet 
       FROM islemler 
       WHERE tarih >= $1 
       AND tarih < $2 
       GROUP BY tip`,
      [ayBaslangic, ayBitis]
    );
    
    const toplamGelir = parseFloat(gelirResult.rows[0].toplam);
    const toplamGider = parseFloat(giderResult.rows[0].toplam);
    
    const gelirAdedi = islemSayisiResult.rows.find(r => r.tip === 'gelir')?.adet || 0;
    const giderAdedi = islemSayisiResult.rows.find(r => r.tip === 'gider')?.adet || 0;
    
    res.json({
      yil: secilenYil,
      ay: secilenAy,
      toplam_gelir: toplamGelir,
      toplam_gider: toplamGider,
      net: toplamGelir - toplamGider,
      gelir_adedi: parseInt(gelirAdedi),
      gider_adedi: parseInt(giderAdedi),
    });
  } catch (error) {
    console.error('Aylık özet hatası:', error);
    res.status(500).json({ error: 'Rapor oluşturulamadı' });
  }
};

// Kategorilere göre dağılım
export const getKategoriDagilim = async (req: Request, res: Response) => {
  try {
    const { yil, ay } = req.query;
    
    const tarih = new Date();
    const secilenYil = yil ? parseInt(yil as string) : tarih.getFullYear();
    const secilenAy = ay ? parseInt(ay as string) : tarih.getMonth() + 1;
    
    const ayBaslangic = `${secilenYil}-${String(secilenAy).padStart(2, '0')}-01`;
    const sonrakiAy = secilenAy === 12 ? 1 : secilenAy + 1;
    const sonrakiYil = secilenAy === 12 ? secilenYil + 1 : secilenYil;
    const ayBitis = `${sonrakiYil}-${String(sonrakiAy).padStart(2, '0')}-01`;
    
    const result = await pool.query(
      `SELECT 
        k.id,
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
    
    res.json(result.rows);
  } catch (error) {
    console.error('Kategori dağılım hatası:', error);
    res.status(500).json({ error: 'Rapor oluşturulamadı' });
  }
};