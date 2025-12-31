import { Router } from 'express';
import { login, register, getCurrentUser, getAllUsers, deleteUser, updateUser } from '../controllers/auth.controller';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, requireSuperAdmin, register);  // ← Sadece süper admin
router.get('/me', authenticateToken, getCurrentUser);
router.get('/users', authenticateToken, requireSuperAdmin, getAllUsers);  // ← Sadece süper admin
router.delete('/users/:id', authenticateToken, requireSuperAdmin, deleteUser);
router.put('/users/:id', authenticateToken, requireSuperAdmin, updateUser);

export default router;