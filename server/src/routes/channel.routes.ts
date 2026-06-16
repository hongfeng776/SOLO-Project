import { Router } from 'express';
import { channelController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', channelController.create);
router.get('/', channelController.findAll);
router.get('/:id', channelController.findById);
router.put('/:id', channelController.update);
router.delete('/:id', channelController.delete);
router.post('/bulk-delete', channelController.bulkDelete);
router.post('/batch-status', channelController.batchUpdateStatus);
router.patch('/:id/status', channelController.updateStatus);

export default router;
