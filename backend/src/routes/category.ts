import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import categoryTreeController from '../controllers/CategoryTreeController';

const router = Router();

router.use(authMiddleware);

router.get('/tree', categoryTreeController.getCategoryTree);
router.get('/', categoryTreeController.getCategoryList);
router.get('/:id', categoryTreeController.getCategoryDetail);
router.get('/logs/:id', categoryTreeController.getCategoryLogs);
router.post('/', categoryTreeController.createCategory);
router.put('/:id', categoryTreeController.updateCategory);
router.delete('/:id', categoryTreeController.deleteCategory);

export default router;
