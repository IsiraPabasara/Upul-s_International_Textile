import { Router } from 'express';
import { getColors, createColor } from './color.controller';

const router = Router();
router.get('/', getColors);
router.post('/', createColor);

export default router;