import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import userPermissionController from '../controllers/UserPermissionController';

const router = Router();

router.use(authMiddleware);

router.get('/configs', userPermissionController.getPermissionConfigs);
router.get('/user/:userId', userPermissionController.getUserPermissions);
router.get('/available/:userId', userPermissionController.getAvailablePermissions);
router.post('/grant', userPermissionController.grantPermission);
router.post('/revoke', userPermissionController.revokePermission);
router.post('/reset', userPermissionController.resetPermissions);
router.post('/batch-grant', userPermissionController.batchGrant);
router.post('/batch-revoke', userPermissionController.batchRevoke);
router.post('/batch-reset', userPermissionController.batchReset);
router.get('/logs/:userId', userPermissionController.getPermissionLogs);
router.post('/status-change', userPermissionController.updateUserStatusWithPermission);

export default router;
