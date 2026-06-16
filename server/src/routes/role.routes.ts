import { Router } from 'express';
import { roleController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', roleController.create);
router.get('/', roleController.findAll);
router.get('/:id', roleController.findById);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);
router.post('/bulk-delete', roleController.bulkDelete);
router.patch('/:id/status', roleController.updateStatus);
router.post('/:id/permissions', roleController.assignPermissions);
router.get('/:id/permissions', roleController.getPermissions);

export default router;
