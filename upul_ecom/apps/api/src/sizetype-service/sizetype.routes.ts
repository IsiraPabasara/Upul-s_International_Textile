import { Router } from 'express';
import { getSizeTypes, createSizeType, deleteSizeType , updateSizeType } from './sizetype.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.get('/', getSizeTypes);

router.use(isAuthenticated , isAdmin);

router.post('/', createSizeType);
router.delete('/:id', deleteSizeType);
router.put('/:id', updateSizeType);

export default router;