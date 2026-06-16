import { Router } from 'express';
import { marketingController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', marketingController.create);
router.get('/', marketingController.findAll);
router.get('/:id', marketingController.findById);
router.put('/:id', marketingController.update);
router.delete('/:id', marketingController.delete);
router.post('/bulk-delete', marketingController.bulkDelete);
router.post('/batch-status', marketingController.batchUpdateStatus);
router.post('/auto-end', marketingController.autoEnd);
router.patch('/:id/status', marketingController.updateStatus);

export default router;
