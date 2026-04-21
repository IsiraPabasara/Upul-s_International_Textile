import { Router } from 'express';
import { getAuthParams , deleteFile} from './imagekit.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.use(isAuthenticated , isAdmin)

router.get('/auth', getAuthParams);
router.delete('/:fileId', deleteFile);

export default router;