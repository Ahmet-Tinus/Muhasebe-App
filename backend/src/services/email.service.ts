import nodemailer from 'nodemailer';

// Mail transporter oluştur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Mail gönderme fonksiyonu
export const sendKasaUyarisi = async (kasaTutari: number) => {
  try {
    const minLimit = parseFloat(process.env.KASA_MINIMUM_LIMIT || '10000');
    
    const mailOptions = {
      from: `"Muhasebe Uygulaması" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: '⚠️ KASA UYARISI - Minimum Limit Altında',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #f59e0b; border-radius: 10px; background-color: #fffbeb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d97706; margin: 0;">⚠️ KASA UYARISI</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">
              Kasa bakiyesi minimum limitin altına düştü!
            </p>
            
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 5px 0; color: #991b1b;">
                <strong>Mevcut Kasa:</strong> <span style="font-size: 20px;">₺${kasaTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
              <p style="margin: 5px 0; color: #991b1b;">
                <strong>Minimum Limit:</strong> <span style="font-size: 20px;">₺${minLimit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
              Lütfen kasa durumunu kontrol edin ve gerekli önlemleri alın.
            </p>
          </div>
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px;">
            <p>Bu otomatik bir bildirimdir. Muhasebe Uygulaması</p>
            <p>${new Date().toLocaleString('tr-TR')}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Kasa uyarı maili gönderildi:', process.env.ALERT_EMAIL);
    return true;
  } catch (error) {
    console.error('❌ Mail gönderme hatası:', error);
    return false;
  }
};

// Mail ayarlarını test et
export const testEmail = async () => {
  try {
    const mailOptions = {
      from: `"Muhasebe Uygulaması" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: '✅ Test Maili - Mail Servisi Çalışıyor',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">✅ Mail Servisi Başarıyla Çalışıyor!</h2>
          <p>Bu bir test mailidir. Mail servisi doğru şekilde yapılandırılmış.</p>
          <p><strong>Gönderim Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Test maili gönderildi');
    return true;
  } catch (error) {
    console.error('❌ Test mail hatası:', error);
    return false;
  }
};