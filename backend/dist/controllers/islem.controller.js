"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIslem = exports.addIslem = exports.getIslemler = void 0;
const database_1 = require("../config/database");
const kasa_service_1 = require("../services/kasa.service");
// Tüm işlemleri getir
const getIslemler = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT * FROM islemler ORDER BY tarih DESC, created_at DESC');
        res.json(result.rows);
    }
    catch (error) {
        console.error('İşlemler getirilirken hata:', error);
        res.status(500).json({ error: 'İşlemler getirilemedi' });
    }
};
exports.getIslemler = getIslemler;
// Yeni işlem ekle
const addIslem = async (req, res) => {
    try {
        const { kategori_id, tutar, aciklama, tip, gelir_tipi, tarih } = req.body;
        // Tarih kontrolü - açıkça string tipini belirt
        const tarihValue = tarih || new Date().toISOString().split('T')[0];
        const gelirTipiValue = gelir_tipi || 'normal';
        // Kasa yansıma tarihini hesapla
        let kasaYansimaTarihi = tarihValue;
        if (tip === 'gelir' && gelir_tipi === 'pos') {
            // POS ise 13 gün sonra
            const date = new Date(tarihValue);
            date.setDate(date.getDate() + 13);
            kasaYansimaTarihi = date.toISOString().split('T')[0];
        }
        // İşlemi ekle
        const result = await database_1.pool.query(`INSERT INTO islemler (kategori_id, tutar, aciklama, tip, gelir_tipi, tarih, kasa_yansima_tarihi) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [kategori_id, tutar, aciklama, tip, gelirTipiValue, tarihValue, kasaYansimaTarihi]);
        // Kasayı güncelle (sadece bugün veya önceki tarihlerde yansıyanlar)
        const bugun = new Date().toISOString().split('T')[0];
        if (tip === 'gelir' && kasaYansimaTarihi <= bugun) {
            await database_1.pool.query('UPDATE kasa SET toplam_tutar = toplam_tutar + $1, son_guncelleme = CURRENT_TIMESTAMP WHERE id = 1', [tutar]);
        }
        else if (tip === 'gider') {
            await database_1.pool.query('UPDATE kasa SET toplam_tutar = toplam_tutar - $1, son_guncelleme = CURRENT_TIMESTAMP WHERE id = 1', [tutar]);
        }
        // Kasa durumunu kontrol et
        await (0, kasa_service_1.kasaKontrol)();
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('İşlem eklenirken hata:', error);
        res.status(500).json({ error: 'İşlem eklenemedi' });
    }
};
exports.addIslem = addIslem;
// İşlem sil
const deleteIslem = async (req, res) => {
    try {
        const { id } = req.params;
        // Önce işlemi getir (kasayı güncellemek için)
        const islemResult = await database_1.pool.query('SELECT * FROM islemler WHERE id = $1', [id]);
        if (islemResult.rows.length === 0) {
            return res.status(404).json({ error: 'İşlem bulunamadı' });
        }
        const islem = islemResult.rows[0];
        // İşlemi sil
        await database_1.pool.query('DELETE FROM islemler WHERE id = $1', [id]);
        // Kasayı güncelle (ters işlem yap)
        if (islem.tip === 'gelir') {
            await database_1.pool.query('UPDATE kasa SET toplam_tutar = toplam_tutar - $1, son_guncelleme = CURRENT_TIMESTAMP WHERE id = 1', [islem.tutar]);
        }
        else {
            await database_1.pool.query('UPDATE kasa SET toplam_tutar = toplam_tutar + $1, son_guncelleme = CURRENT_TIMESTAMP WHERE id = 1', [islem.tutar]);
        }
        // Kasa durumunu kontrol et
        await (0, kasa_service_1.kasaKontrol)();
        res.json({ message: 'İşlem silindi' });
    }
    catch (error) {
        console.error('İşlem silinirken hata:', error);
        res.status(500).json({ error: 'İşlem silinemedi' });
    }
};
exports.deleteIslem = deleteIslem;
