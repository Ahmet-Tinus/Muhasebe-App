import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Islem } from '../types';
import { kasaKontrol } from '../services/kasa.service';
import { createAuditLog } from '../services/audit.service';

// Tüm işlemleri getir
export const getIslemler = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM islemler ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('İşlemler getirilirken hata:', error);
    res.status(500).json({ error: 'İşlemler getirilemedi' });
  }
};

// Yeni işlem ekle
export const addIslem = async (req: Request, res: Response) => {
  try {
    const { kategori_id, tutar, aciklama, tip, gelir_tipi, tarih } = req.body;

    // Tutar validasyonu
    const parsedTutar = parseFloat(parseFloat(tutar.toString()).toFixed(2));
    if (isNaN(parsedTutar) || parsedTutar <= 0) {
      return res.status(400).json({ error: 'Geçerli bir tutar giriniz' });
    }

    // İşlem tipine göre kasa yansıma tarihini hesapla
    let kasaYansimaTarihi = null;
    if (tip === 'gelir' && gelir_tipi === 'pos') {
      const islemTarihi = new Date(tarih);
      islemTarihi.setDate(islemTarihi.getDate() + 13);
      kasaYansimaTarihi = islemTarihi.toISOString().split('T')[0];
    }

    // İşlemi ekle
    const result = await pool.query(
      `INSERT INTO islemler (kategori_id, tutar, aciklama, tip, gelir_tipi, tarih, kasa_yansima_tarihi) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [kategori_id || null, parsedTutar, aciklama, tip, gelir_tipi || null, tarih, kasaYansimaTarihi]
    );

    const yeniIslem = result.rows[0];

    // Audit log ekle
    await createAuditLog({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'CREATE',
      tableName: 'islemler',
      recordId: yeniIslem.id,
      newData: yeniIslem,
      ipAddress: req.ip,
    });

    // Kasayı güncelle
    await kasaKontrol();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('İşlem ekleme hatası:', error);
    res.status(500).json({ error: 'İşlem eklenemedi' });
  }
};

// İşlem sil
export const deleteIslem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Önce işlemi al (audit log için)
    const islemResult = await pool.query('SELECT * FROM islemler WHERE id = $1', [id]);
    
    if (islemResult.rows.length === 0) {
      return res.status(404).json({ error: 'İşlem bulunamadı' });
    }

    const silinecekIslem = islemResult.rows[0];

    // İşlemi sil
    await pool.query('DELETE FROM islemler WHERE id = $1', [id]);

    // Audit log ekle
    await createAuditLog({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'DELETE',
      tableName: 'islemler',
      recordId: parseInt(id),
      oldData: silinecekIslem,
      ipAddress: req.ip,
    });

    // Kasayı güncelle
    await kasaKontrol();

    res.json({ message: 'İşlem silindi' });
  } catch (error) {
    console.error('İşlem silme hatası:', error);
    res.status(500).json({ error: 'İşlem silinemedi' });
  }
};