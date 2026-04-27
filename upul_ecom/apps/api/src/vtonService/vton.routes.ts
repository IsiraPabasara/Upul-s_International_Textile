import { Router } from 'express';
import { processVirtualTryOn , processFashionStudio } from './vton.controller';

const vtonRouter = Router();

// Define the POST route: e.g., /api/vton/generate
vtonRouter.post('/generate', processVirtualTryOn);
vtonRouter.post('/studio', processFashionStudio)

export default vtonRouter;