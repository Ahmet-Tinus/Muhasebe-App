"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// PostgreSQL bağlantı havuzu
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// Bağlantıyı test et
exports.pool.on("connect", () => {
    console.log("✅ PostgreSQL veritabanına bağlandı");
});
exports.pool.on("error", (err) => {
    console.error("❌ PostgreSQL bağlantı hatası:", err);
});
// Tabloları oluştur
const initDatabase = async () => {
    try {
        // Kategoriler tablosu
        await exports.pool.query(`
      CREATE TABLE IF NOT EXISTS kategoriler (
        id SERIAL PRIMARY KEY,
        ad VARCHAR(100) NOT NULL,
        tip VARCHAR(10) CHECK(tip IN ('gelir', 'gider')) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // İşlemler tablosu
        // İşlemler tablosu
        await exports.pool.query(`
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
        await exports.pool.query(`
      CREATE TABLE IF NOT EXISTS kasa (
        id SERIAL PRIMARY KEY,
        toplam_tutar DECIMAL(15, 2) DEFAULT 0,
        son_guncelleme TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // İlk kasa kaydını oluştur
        const kasaCheck = await exports.pool.query("SELECT * FROM kasa WHERE id = 1");
        if (kasaCheck.rows.length === 0) {
            await exports.pool.query("INSERT INTO kasa (toplam_tutar) VALUES (0)");
        }
        console.log("✅ Veritabanı tabloları oluşturuldu");
    }
    catch (error) {
        console.error("❌ Tablo oluşturma hatası:", error);
    }
};
exports.initDatabase = initDatabase;
