import { Router } from 'express';
import { handlePayHereNotify } from './payhere.controller';

const router = Router();

router.post('/notify', handlePayHereNotify);

export default router;