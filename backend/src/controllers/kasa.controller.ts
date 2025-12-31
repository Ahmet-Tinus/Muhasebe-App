import { Request, Response } from 'express';
import { pool } from '../config/database';

// Kasa durumunu getir
export const getKasa = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM kasa WHERE id = 1');
    const kasa = result.rows[0];
    
    res.json({
      id: kasa.id,
      toplam_tutar: parseFloat(kasa.toplam_tutar).toFixed(2),
      son_guncelleme: kasa.son_guncelleme
    });
  } catch (error) {
    console.error('Kasa durumu getirilirken hata:', error);
    res.status(500).json({ error: 'Kasa durumu getirilemedi' });
  }
};

// Varlık durumunu getir
export const getVarlik = async (req: Request, res: Response) => {
  try {
    // Toplam gelirler
    const gelirResult = await pool.query(
      `SELECT COALESCE(SUM(tutar), 0) as toplam FROM islemler WHERE tip = 'gelir'`
    );
    
    // Toplam giderler
    const giderResult = await pool.query(
      `SELECT COALESCE(SUM(tutar), 0) as toplam FROM islemler WHERE tip = 'gider'`
    );

    // Bekleyen POS işlemleri
    const bugun = new Date().toISOString().split('T')[0];
    const bekleyenPosResult = await pool.query(
      `SELECT COALESCE(SUM(tutar), 0) as toplam 
       FROM islemler 
       WHERE tip = 'gelir' 
       AND gelir_tipi = 'pos' 
       AND kasa_yansima_tarihi > $1`,
      [bugun]
    );

    const toplamGelir = parseFloat(gelirResult.rows[0].toplam);
    const toplamGider = parseFloat(giderResult.rows[0].toplam);
    const bekleyenPos = parseFloat(bekleyenPosResult.rows[0].toplam);
    
    const toplamVarlik = toplamGelir - toplamGider;
    const gerceklesen = toplamVarlik - bekleyenPos;

    res.json({
      toplam_tutar: toplamVarlik.toFixed(2),
      bekleyen_pos: bekleyenPos.toFixed(2),
      gerceklesen: gerceklesen.toFixed(2)
    });
  } catch (error) {
    console.error('Varlık durumu getirilirken hata:', error);
    res.status(500).json({ error: 'Varlık durumu getirilemedi' });
  }
};

// Bekleyen POS ödemelerini getir
export const getBekleyenPos = async (req: Request, res: Response) => {
  try {
    const bugun = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT 
        id,
        tutar,
        aciklama,
        tarih,
        kasa_yansima_tarihi,
        CAST(DATE(kasa_yansima_tarihi) - DATE($1) AS INTEGER) as kalan_gun
      FROM islemler
      WHERE tip = 'gelir' 
        AND gelir_tipi = 'pos' 
        AND kasa_yansima_tarihi > $1
      ORDER BY kasa_yansima_tarihi ASC
      LIMIT 10`,
      [bugun]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Bekleyen POS getirilirken hata:', error);
    res.status(500).json({ error: 'Bekleyen POS getirilemedi' });
  }
};