import { Router } from 'express';
import * as permissionController from '@controllers/PermissionController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/tree', checkPermission('permission:view'), permissionController.getPermissionTree);
router.get('/', checkPermission('permission:view'), permissionController.getPermissionList);
router.get('/:id', checkPermission('permission:view'), permissionController.getPermissionById);
router.post('/', checkPermission('permission:manage'), permissionController.createPermission);
router.put('/:id', checkPermission('permission:manage'), permissionController.updatePermission);
router.delete('/:id', checkPermission('permission:manage'), permissionController.deletePermission);

export default router;
