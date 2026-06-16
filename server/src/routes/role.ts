import { Router } from 'express';
import * as roleController from '@controllers/RoleController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('role:view'), roleController.getRoleList);
router.get('/:id', checkPermission('role:view'), roleController.getRoleById);
router.post('/', checkPermission('role:manage'), roleController.createRole);
router.put('/:id', checkPermission('role:manage'), roleController.updateRole);
router.delete('/:id', checkPermission('role:manage'), roleController.deleteRole);
router.post('/:id/permissions', checkPermission('role:manage'), roleController.assignPermissions);

export default router;
