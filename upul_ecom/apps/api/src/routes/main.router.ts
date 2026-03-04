import express, { Router } from 'express';
import { authRouter } from '../auth-service/routes/auth.router';


const router: Router = express.Router();

router.use("/auth", authRouter);

export default router;