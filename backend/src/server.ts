import { initDatabase,pool } from './config/database';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import islemRoutes from './routes/islem.routes';
import kasaRoutes from './routes/kasa.routes';
import { runMigrations } from './config/migrate';
import kategoriRoutes from './routes/kategori.routes';
import raporRoutes from './routes/rapor.routes';
import excelRoutes from './routes/excel.routes';
import { testEmail } from './services/email.service';
import { startBackupScheduler } from './services/scheduler.service';
import authRoutes from './routes/auth.routes';
import auditRoutes from './routes/audit.routes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/islemler', islemRoutes);
app.use('/api/kasa', kasaRoutes);
app.use('/api/kategoriler', kategoriRoutes);
app.use('/api/raporlar', raporRoutes);
app.use('/api/excel', excelRoutes);
// Test route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Muhasebe API çalışıyor',
    timestamp: new Date().toISOString()
  });
});
// Mail test endpoint - BURAYA EKLE
app.get('/api/test-email', async (req, res) => {
  const success = await testEmail();
  res.json({ success, message: success ? 'Mail gönderildi' : 'Mail gönderilemedi' });
});

// Kullanıcı oluşturma endpoint (BURAYA EKLE)
app.get('/api/setup-users', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Admin şifresi hash'le
    const adminHash = await bcrypt.hash('admin123', 10);
    
    // Viewer şifresi hash'le
    const viewerHash = await bcrypt.hash('viewer123', 10);
    
    // Users tablosunu temizle
    await pool.query('DELETE FROM users');
    
    // Admin kullanıcı ekle
    await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
      ['admin@muhasebe.com', adminHash, 'Admin User', 'admin']
    );
    
    // Viewer kullanıcı ekle
    await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
      ['viewer@muhasebe.com', viewerHash, 'Viewer User', 'viewer']
    );
    
    res.json({ success: true, message: 'Kullanıcılar oluşturuldu' });
  } catch (error) {
    console.error('Setup users hatası:', error);
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
  }
});

// Server başlat
app.listen(PORT, async () => {
  console.log(`🚀 Server 5001 portunda çalışıyor`);
  console.log(`📍 http://localhost:${PORT}`);
  
  try {
    // Database'i başlat
    await initDatabase();
    console.log('✅ Server hazır ve çalışıyor');

        // Backup scheduler'ı başlat
    startBackupScheduler();
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
  }
}).on('error', (error) => {
  console.error('❌ Server hatası:', error);
});

// Manuel backup endpoint
app.get('/api/backup/create', async (req, res) => {
  try {
    const { createBackup } = await import('./services/backup.service');
    const filename = await createBackup();
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Backup oluşturulamadı' });
  }
});