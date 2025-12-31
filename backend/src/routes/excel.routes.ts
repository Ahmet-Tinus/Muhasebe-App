import { Router } from 'express';
import { exportIslemler, exportAylikRapor } from '../controllers/excel.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/islemler', authenticateToken, requireAdmin, exportIslemler); // Sadece admin
router.get('/aylik-rapor', authenticateToken, requireAdmin, exportAylikRapor); // Sadece admin

export default router;