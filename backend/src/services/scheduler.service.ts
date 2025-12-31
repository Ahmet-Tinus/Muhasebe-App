import cron from 'node-cron';
import { createBackup, cleanOldBackups } from './backup.service';

// Her gece saat 02:00'de otomatik backup
export const startBackupScheduler = () => {
  // Her gece 02:00
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Otomatik backup başlatılıyor...');
    try {
      await createBackup();
      await cleanOldBackups();
      console.log('✅ Otomatik backup tamamlandı');
    } catch (error) {
      console.error('❌ Otomatik backup hatası:', error);
    }
  });

  console.log('📅 Backup zamanlayıcı başlatıldı (Her gece 02:00)');
};