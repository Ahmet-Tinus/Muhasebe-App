import { Router } from 'express';
import { getAylikOzet, getKategoriDagilim } from '../controllers/rapor.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/aylik-ozet', authenticateToken, getAylikOzet);
router.get('/kategori-dagilim', authenticateToken, getKategoriDagilim);

export default router;