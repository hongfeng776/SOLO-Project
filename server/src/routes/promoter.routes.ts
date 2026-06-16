import { Router } from 'express';
import { promoterController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', promoterController.create);
router.get('/', promoterController.findAll);
router.get('/:id', promoterController.findById);
router.put('/:id', promoterController.update);
router.delete('/:id', promoterController.delete);
router.post('/bulk-delete', promoterController.bulkDelete);
router.patch('/:id/status', promoterController.updateStatus);

export default router;
