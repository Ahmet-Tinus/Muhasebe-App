import { pool } from '../config/database';
import { sendKasaUyarisi } from './email.service';

let uyariGonderildi = false;

export const kasaKontrol = async () => {
  try {
    const result = await pool.query('SELECT toplam_tutar FROM kasa WHERE id = 1');
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
        await sendKasaUyarisi(kasaTutari);
      } catch (error) {
        console.log('ℹ️ Mail gönderilemedi, sadece console\'da uyarı verildi');
      }
      
      uyariGonderildi = true;
    }

    if (kasaTutari >= minLimit) {
      uyariGonderildi = false;
    }
  } catch (error) {
    console.error('Kasa kontrol hatası:', error);
  }
};