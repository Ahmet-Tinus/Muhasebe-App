import { Router } from 'express';
import { getKategoriler, addKategori, deleteKategori } from '../controllers/kategori.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getKategoriler); // Herkes görebilir
router.post('/', authenticateToken, requireAdmin, addKategori); // Sadece admin ekleyebilir
router.delete('/:id', authenticateToken, requireAdmin, deleteKategori); // Sadece admin silebilir

export default router;