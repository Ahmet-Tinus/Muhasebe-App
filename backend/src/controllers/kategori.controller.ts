import { Request, Response } from 'express';
import { pool } from '../config/database';
import type { Kategori } from '../types';
import { createAuditLog } from '../services/audit.service';

// Tüm kategorileri getir
export const getKategoriler = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM kategoriler ORDER BY tip, ad'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    res.status(500).json({ error: 'Kategoriler getirilemedi' });
  }
};

// Yeni kategori ekle
export const addKategori = async (req: Request, res: Response) => {
  try {
    const { ad, tip } = req.body;

    const result = await pool.query(
      'INSERT INTO kategoriler (ad, tip) VALUES ($1, $2) RETURNING *',
      [ad, tip]
    );

    const yeniKategori = result.rows[0];

    // Audit log ekle
    await createAuditLog({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'CREATE',
      tableName: 'kategoriler',
      recordId: yeniKategori.id,
      newData: yeniKategori,
      ipAddress: req.ip,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Kategori ekleme hatası:', error);
    res.status(500).json({ error: 'Kategori eklenemedi' });
  }
};

// Kategori sil
export const deleteKategori = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Önce kategoriyi al
    const kategoriResult = await pool.query('SELECT * FROM kategoriler WHERE id = $1', [id]);
    
    if (kategoriResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    const silinecekKategori = kategoriResult.rows[0];

    // Kategoriye bağlı işlem var mı kontrol et
    const islemKontrol = await pool.query(
      'SELECT COUNT(*) as count FROM islemler WHERE kategori_id = $1',
      [id]
    );

    if (parseInt(islemKontrol.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Bu kategoriye bağlı işlemler var. Önce işlemleri silmelisiniz.' 
      });
    }

    // Kategoriyi sil
    await pool.query('DELETE FROM kategoriler WHERE id = $1', [id]);

    // Audit log ekle
    await createAuditLog({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'DELETE',
      tableName: 'kategoriler',
      recordId: parseInt(id),
      oldData: silinecekKategori,
      ipAddress: req.ip,
    });

    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({ error: 'Kategori silinemedi' });
  }
};