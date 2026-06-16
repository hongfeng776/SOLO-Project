import { Router } from 'express';
import { withdrawController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', withdrawController.create);
router.post('/apply', withdrawController.apply);
router.get('/', withdrawController.findAll);
router.get('/:id', withdrawController.findById);
router.put('/:id', withdrawController.update);
router.delete('/:id', withdrawController.delete);
router.post('/:id/audit', withdrawController.audit);
router.post('/:id/pay', withdrawController.pay);

export default router;
