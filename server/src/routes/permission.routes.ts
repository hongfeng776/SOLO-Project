import { Router } from 'express';
import { permissionController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', permissionController.createPermission);
router.get('/tree', permissionController.findTree);
router.post('/batch-status', permissionController.updateStatusBatch);
router.post('/batch-sort', permissionController.batchSort);
router.get('/idle', permissionController.findIdlePermissions);
router.get('/module/:module', permissionController.findByModule);
router.get('/:id/dependencies', permissionController.checkDeleteDependencies);
router.get('/:id', permissionController.findById);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);
router.post('/bulk-delete', permissionController.bulkDelete);
router.patch('/:id/status', permissionController.updateStatus);

export default router;
