import { Router } from 'express';
import { permissionController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', permissionController.create);
router.get('/tree', permissionController.findTree);
router.get('/:id', permissionController.findById);
router.put('/:id', permissionController.update);
router.delete('/:id', permissionController.delete);
router.post('/bulk-delete', permissionController.bulkDelete);
router.patch('/:id/status', permissionController.updateStatus);

export default router;
