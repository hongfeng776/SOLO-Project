import { Router } from 'express';
import { orderController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', orderController.create);
router.get('/', orderController.findAll);
router.get('/export', orderController.export);
router.get('/:id', orderController.findById);
router.put('/:id', orderController.update);
router.delete('/:id', orderController.delete);
router.post('/bulk-update', orderController.bulkUpdate);
router.put('/:id/status', orderController.updateStatus);

export default router;
