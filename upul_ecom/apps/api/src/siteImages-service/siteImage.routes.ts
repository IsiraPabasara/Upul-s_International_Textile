import { Router } from 'express';
import { 
  getSiteImages, 
  createSiteImage, 
  deleteSiteImage, 
  updateSiteImage 
} from './siteImage.controller'; 
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.get('/', getSiteImages);

router.use(isAuthenticated , isAdmin);

router.post('/', createSiteImage);
router.delete('/:id', deleteSiteImage);
router.put('/:id', updateSiteImage);

export default router;