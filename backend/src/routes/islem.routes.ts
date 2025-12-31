import { Router } from 'express';
import { getIslemler, addIslem, deleteIslem } from '../controllers/islem.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getIslemler); // Herkes görebilir
router.post('/', authenticateToken, requireAdmin, addIslem); // Sadece admin ekleyebilir
router.delete('/:id', authenticateToken, requireAdmin, deleteIslem); // Sadece admin silebilir

export default router;