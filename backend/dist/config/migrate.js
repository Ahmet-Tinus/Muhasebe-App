"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const database_1 = require("./database");
const runMigrations = async () => {
    try {
        // gelir_tipi kolonunu ekle
        await database_1.pool.query(`
      ALTER TABLE islemler 
      ADD COLUMN IF NOT EXISTS gelir_tipi VARCHAR(10) CHECK(gelir_tipi IN ('normal', 'pos')) DEFAULT 'normal'
    `);
        // kasa_yansima_tarihi kolonunu ekle
        await database_1.pool.query(`
      ALTER TABLE islemler 
      ADD COLUMN IF NOT EXISTS kasa_yansima_tarihi DATE
    `);
        // Mevcut kayıtlar için varsayılan değerleri ayarla
        await database_1.pool.query(`
      UPDATE islemler 
      SET gelir_tipi = 'normal', 
          kasa_yansima_tarihi = tarih 
      WHERE gelir_tipi IS NULL
    `);
        console.log('✅ Migration tamamlandı');
    }
    catch (error) {
        console.error('❌ Migration hatası:', error);
    }
};
exports.runMigrations = runMigrations;
