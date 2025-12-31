import { Router } from 'express';
import { getLogs } from '../controllers/audit.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Sadece admin logları görebilir
router.get('/logs', authenticateToken, requireAdmin, getLogs);

export default router;