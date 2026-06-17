import { Router } from 'express';
import { roleController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', roleController.create);
router.post('/batch-copy', roleController.batchCopyRoles);
router.post('/batch-status', roleController.batchUpdateStatus);
router.post('/bulk-delete', roleController.bulkDelete);
router.get('/', roleController.findAll);
router.get('/deletion-logs', roleController.searchDeletionLogs);
router.get('/:id', roleController.findById);
router.get('/:id/dependencies', roleController.checkRoleDependencies);
router.get('/:id/bound-count', roleController.getBoundUserCount);
router.get('/:id/permissions', roleController.getPermissions);
router.put('/:id', roleController.update);
router.patch('/:id/status', roleController.updateStatus);
router.post('/:id/permissions', roleController.assignPermissions);
router.delete('/:id', roleController.delete);

export default router;
