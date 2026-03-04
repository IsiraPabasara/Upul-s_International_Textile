import { Router } from 'express';
import { getSizeTypes, createSizeType, deleteSizeType } from './sizetype.controller';

const router = Router();

router.get('/', getSizeTypes);
router.post('/', createSizeType);
router.delete('/:id', deleteSizeType);

export default router;