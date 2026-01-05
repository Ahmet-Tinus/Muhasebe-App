import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL bağlantı havuzu (Neon SSL desteği ile)
const isProduction = process.env.NODE_ENV === "production";
const useSSL = process.env.DATABASE_URL?.includes("neon.tech") || isProduction;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
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
    // Users tablosu (auth için gerekli)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) CHECK(role IN ('admin', 'viewer')) DEFAULT 'viewer',
        is_super_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs tablosu (işlem takibi için)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action VARCHAR(20) CHECK(action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN')) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id INTEGER,
        old_data JSONB,
        new_data JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
