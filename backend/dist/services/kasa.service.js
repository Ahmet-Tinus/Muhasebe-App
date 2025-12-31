"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kasaKontrol = void 0;
const database_1 = require("../config/database");
const email_service_1 = require("./email.service");
let uyariGonderildi = false;
const kasaKontrol = async () => {
    try {
        const result = await database_1.pool.query('SELECT toplam_tutar FROM kasa WHERE id = 1');
        const kasaTutari = parseFloat(result.rows[0].toplam_tutar);
        const minLimit = parseFloat(process.env.KASA_MINIMUM_LIMIT || '10000');
        console.log(`💰 Kasa Kontrol - Bakiye: ₺${kasaTutari}, Limit: ₺${minLimit}`);
        if (kasaTutari < minLimit && !uyariGonderildi) {
            console.log('\n⚠️⚠️⚠️ KASA UYARISI ⚠️⚠️⚠️');
            console.log(`📉 Mevcut Bakiye: ₺${kasaTutari.toLocaleString('tr-TR')}`);
            console.log(`🔴 Minimum Limit: ₺${minLimit.toLocaleString('tr-TR')}`);
            console.log('📧 Mail gönderilecek adres:', process.env.ALERT_EMAIL);
            console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️\n');
            // Mail göndermeyi dene (hata olursa devam et)
            try {
                await (0, email_service_1.sendKasaUyariMail)(kasaTutari, minLimit);
            }
            catch (error) {
                console.log('ℹ️ Mail gönderilemedi, sadece console\'da uyarı verildi');
            }
            uyariGonderildi = true;
        }
        if (kasaTutari >= minLimit) {
            uyariGonderildi = false;
        }
    }
    catch (error) {
        console.error('Kasa kontrol hatası:', error);
    }
};
exports.kasaKontrol = kasaKontrol;
