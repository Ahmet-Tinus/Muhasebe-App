"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendKasaUyariMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Email transporter oluştur
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// Kasa uyarı maili gönder
const sendKasaUyariMail = async (kasaTutari, minLimit) => {
    try {
        const info = await transporter.sendMail({
            from: `"Muhasebe Sistemi" <${process.env.SMTP_USER}>`,
            to: process.env.ALERT_EMAIL,
            subject: '⚠️ KASA UYARISI - Düşük Bakiye',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #dc2626;">⚠️ Kasa Bakiye Uyarısı</h2>
          <p>Kasa bakiyesi minimum limite ulaştı!</p>
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Mevcut Bakiye:</strong> ₺${kasaTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
            <p style="margin: 5px 0;"><strong>Minimum Limit:</strong> ₺${minLimit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
          </div>
          <p>Lütfen gerekli önlemleri alın.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Bu otomatik bir mesajdır. Muhasebe Sistemi tarafından gönderilmiştir.
          </p>
        </div>
      `,
        });
        console.log('✅ Uyarı maili gönderildi:', info.messageId);
        return true;
    }
    catch (error) {
        console.error('❌ Mail gönderme hatası:', error);
        return false;
    }
};
exports.sendKasaUyariMail = sendKasaUyariMail;
