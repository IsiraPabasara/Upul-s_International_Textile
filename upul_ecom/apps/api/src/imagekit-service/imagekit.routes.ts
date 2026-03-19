import { Router } from 'express';
import { getAuthParams , deleteFile} from './imagekit.controller';

const router = Router();

router.get('/auth', getAuthParams);
router.delete('/:fileId', deleteFile);

export default router;