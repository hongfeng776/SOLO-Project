import { Router } from 'express';
import * as userPermissionController from '../controllers/UserPermissionController';

const router = Router();

router.get('/system-permissions', userPermissionController.getSystemPermissions);
router.get('/filtered-permissions', userPermissionController.getFilteredPermissions);
router.post('/validate/:userId', userPermissionController.validatePermissionGrant);
router.get('/:userId/permissions', userPermissionController.getUserPermissions);
router.post('/:userId/grant', userPermissionController.grantPermissions);
router.post('/:userId/revoke', userPermissionController.revokePermissions);
router.post('/:userId/reset', userPermissionController.resetPermissions);
router.put('/:userId/status', userPermissionController.changeUserStatus);
router.post('/batch-grant', userPermissionController.batchGrantPermissions);
router.post('/batch-revoke', userPermissionController.batchRevokePermissions);
router.post('/batch-reset', userPermissionController.batchResetPermissions);
router.get('/:userId/trace', userPermissionController.getPermissionTrace);
router.get('/:userId/logs', userPermissionController.getPermissionLogs);
router.get('/:userId/compliance', userPermissionController.checkPermissionCompliance);

export default router;
