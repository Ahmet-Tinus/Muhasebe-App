import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  isSuperAdmin?: boolean; 
}

// Request'e user ekle
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Token doğrula
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Geçersiz token' });
  }
};

// Admin kontrolü
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetkiniz yok (Admin gerekli)' });
  }
  next();
};

// Viewer veya Admin kontrolü
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Giriş yapmalısınız' });
  }
  next();
};

// Süper Admin kontrolü
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Yetkiniz yok (Süper Admin gerekli)' });
  }
  next();
};