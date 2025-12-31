import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAuditLog } from '../services/audit.service';
// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }

    // Kullanıcıyı bul
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

    const user = result.rows[0];

    // Şifre kontrolü
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }

// JWT token oluştur (is_super_admin ekle)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        isSuperAdmin: user.is_super_admin || false
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Login log'u ekle (BURAYA EKLE)
    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      tableName: 'users',
      recordId: user.id,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSuperAdmin: user.is_super_admin || false
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSuperAdmin: user.is_super_admin || false  // ← EKLE
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
};

// Register (sadece admin ekleyebilir)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, şifre ve isim gerekli' });
    }

    // Email kontrolü
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Bu email zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluştur
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role || 'viewer']
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Register hatası:', error);
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
  }
};

// Mevcut kullanıcı bilgisi
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [req.user?.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('User fetch hatası:', error);
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı' });
  }
};

// Tüm kullanıcıları listele (sadece admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Users fetch hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar listelenemedi' });
  }
};

// Kullanıcı sil (sadece süper admin)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Kendini silmeye çalışıyor mu?
    if (req.user?.userId === parseInt(id)) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }

    // Silinecek kullanıcıyı kontrol et
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const userToDelete = userCheck.rows[0];

    // Süper admin'i silmeye çalışıyor mu?
    if (userToDelete.is_super_admin) {
      return res.status(400).json({ error: 'Süper admin kullanıcısı silinemez' });
    }

    // Kullanıcıyı sil
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
};

// Kullanıcı güncelle (sadece süper admin)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, name, role } = req.body;

    // Kullanıcıyı kontrol et
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const existingUser = userCheck.rows[0];

    // Süper admin'i güncellemeye çalışıyor mu?
    if (existingUser.is_super_admin && req.user?.userId !== parseInt(id)) {
      return res.status(400).json({ error: 'Süper admin kullanıcısı güncellenemez' });
    }

    // Email değişiyorsa, başka kullanıcı kullanıyor mu kontrol et
    if (email && email !== existingUser.email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Bu email zaten kullanılıyor' });
      }
    }

    // Güncellenecek alanları hazırla
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (role && !existingUser.is_super_admin) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    // Güncelle
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role`;
    const result = await pool.query(query, values);

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
  }
};