"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVarlik = exports.getKasa = void 0;
const database_1 = require("../config/database");
// Kasa durumunu getir
const getKasa = async (req, res) => {
    try {
        const result = await database_1.pool.query('SELECT * FROM kasa WHERE id = 1');
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Kasa durumu getirilirken hata:', error);
        res.status(500).json({ error: 'Kasa durumu getirilemedi' });
    }
};
exports.getKasa = getKasa;
// Varlık durumunu getir
const getVarlik = async (req, res) => {
    try {
        // Toplam gelirler
        const gelirResult = await database_1.pool.query(`SELECT COALESCE(SUM(tutar), 0) as toplam FROM islemler WHERE tip = 'gelir'`);
        // Toplam giderler
        const giderResult = await database_1.pool.query(`SELECT COALESCE(SUM(tutar), 0) as toplam FROM islemler WHERE tip = 'gider'`);
        // Bekleyen POS işlemleri
        const bugun = new Date().toISOString().split('T')[0];
        const bekleyenPosResult = await database_1.pool.query(`SELECT COALESCE(SUM(tutar), 0) as toplam 
       FROM islemler 
       WHERE tip = 'gelir' 
       AND gelir_tipi = 'pos' 
       AND kasa_yansima_tarihi > $1`, [bugun]);
        const toplamGelir = parseFloat(gelirResult.rows[0].toplam);
        const toplamGider = parseFloat(giderResult.rows[0].toplam);
        const bekleyenPos = parseFloat(bekleyenPosResult.rows[0].toplam);
        const toplamVarlik = toplamGelir - toplamGider;
        const gerceklesen = toplamVarlik - bekleyenPos;
        res.json({
            toplam_tutar: toplamVarlik,
            bekleyen_pos: bekleyenPos,
            gerceklesen: gerceklesen
        });
    }
    catch (error) {
        console.error('Varlık durumu getirilirken hata:', error);
        res.status(500).json({ error: 'Varlık durumu getirilemedi' });
    }
};
exports.getVarlik = getVarlik;
