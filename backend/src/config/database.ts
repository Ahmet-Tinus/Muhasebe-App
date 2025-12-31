import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL bağlantı havuzu
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Bağlantıyı test et
pool.on("connect", () => {
  console.log("✅ PostgreSQL veritabanına bağlandı");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL bağlantı hatası:", err);
});

// Tabloları oluştur
export const initDatabase = async () => {
  try {
    // Kategoriler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kategoriler (
        id SERIAL PRIMARY KEY,
        ad VARCHAR(100) NOT NULL,
        tip VARCHAR(10) CHECK(tip IN ('gelir', 'gider')) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // İşlemler tablosu
    // İşlemler tablosu
    await pool.query(`
  CREATE TABLE IF NOT EXISTS islemler (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER REFERENCES kategoriler(id),
    tutar DECIMAL(15, 2) NOT NULL,
    aciklama TEXT,
    tip VARCHAR(10) CHECK(tip IN ('gelir', 'gider')) NOT NULL,
    gelir_tipi VARCHAR(10) CHECK(gelir_tipi IN ('normal', 'pos')) DEFAULT 'normal',
    tarih DATE NOT NULL,
    kasa_yansima_tarihi DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    // Kasa durumu tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kasa (
        id SERIAL PRIMARY KEY,
        toplam_tutar DECIMAL(15, 2) DEFAULT 0,
        son_guncelleme TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // İlk kasa kaydını oluştur
    const kasaCheck = await pool.query("SELECT * FROM kasa WHERE id = 1");
    if (kasaCheck.rows.length === 0) {
      await pool.query("INSERT INTO kasa (toplam_tutar) VALUES (0)");
    }

    console.log("✅ Veritabanı tabloları oluşturuldu");
  } catch (error) {
    console.error("❌ Tablo oluşturma hatası:", error);
  }
};
