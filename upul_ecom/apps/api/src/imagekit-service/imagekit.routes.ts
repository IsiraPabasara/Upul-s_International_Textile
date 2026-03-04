import { Router } from 'express';
import { getAuthParams } from './imagekit.controller';

const router = Router();

router.get('/auth', getAuthParams);

export default router;