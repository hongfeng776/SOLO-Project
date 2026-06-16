import { Router } from 'express';
import { commissionController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', commissionController.create);
router.get('/', commissionController.findAll);
router.get('/summary', commissionController.summary);
router.post('/settle', commissionController.settle);
router.post('/deduct', commissionController.deduct);
router.get('/:id', commissionController.findById);
router.put('/:id', commissionController.update);
router.delete('/:id', commissionController.delete);

export default router;
