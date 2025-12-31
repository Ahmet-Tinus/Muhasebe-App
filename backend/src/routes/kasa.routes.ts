import { Router } from 'express';
import { getKasa, getVarlik, getBekleyenPos } from '../controllers/kasa.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/varlik', authenticateToken, getVarlik);
router.get('/bekleyen-pos', authenticateToken, getBekleyenPos);
router.get('/', authenticateToken, getKasa);

export default router;