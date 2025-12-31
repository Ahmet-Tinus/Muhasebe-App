import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Backup klasörü
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Backup klasörünü oluştur
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Database backup al
export const createBackup = async (): Promise<string> => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `muhasebe_backup_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // PostgreSQL dump komutu
    const dbUrl = process.env.DATABASE_URL || '';
    const urlParts = dbUrl.match(/postgresql:\/\/(.+):(.+)@(.+):(\d+)\/(.+)/);
    
    if (!urlParts) {
      throw new Error('Geçersiz DATABASE_URL');
    }

    const [, user, password, host, port, database] = urlParts;

    // Windows için pg_dump komutu
    const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe';
    
    const command = `"${pgDumpPath}" -h ${host} -p ${port} -U ${user} -d ${database} -F p -f "${filepath}"`;

    // PGPASSWORD environment variable ile şifre gönder
    await execAsync(command, {
      env: { ...process.env, PGPASSWORD: password }
    });

    console.log(`✅ Backup oluşturuldu: ${filename}`);
    return filename;
  } catch (error) {
    console.error('❌ Backup hatası:', error);
    throw error;
  }
};

// Eski backup'ları temizle (7 günden eski)
export const cleanOldBackups = async (): Promise<void> => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > sevenDays) {
        fs.unlinkSync(filepath);
        console.log(`🗑️ Eski backup silindi: ${file}`);
      }
    });
  } catch (error) {
    console.error('❌ Backup temizleme hatası:', error);
  }
};

// Tüm backup'ları listele
export const listBackups = (): string[] => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    return files.filter(f => f.endsWith('.sql')).sort().reverse();
  } catch (error) {
    console.error('❌ Backup listeleme hatası:', error);
    return [];
  }
};