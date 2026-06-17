import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import categoryLinkageController from '../controllers/CategoryLinkageController';

const router = Router();

router.use(authMiddleware);

router.post('/update/:id', categoryLinkageController.updateCategoryWithLinkage);
router.post('/confirm/:id', categoryLinkageController.confirmUpdate);
router.get('/permission-type/:id', categoryLinkageController.getEditPermissionType);
router.get('/preview/:id', categoryLinkageController.getCategoryPreview);

export default router;
