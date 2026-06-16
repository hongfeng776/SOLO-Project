import { Router } from 'express';
import { PermissionController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const permissionController = new PermissionController();

router.get('/tree', requirePermission('system:permission:query'), (req, res, next) => permissionController.tree(req, res, next));
router.get('/list', requirePermission('system:permission:query'), (req, res, next) => permissionController.list(req, res, next));
router.get('/:id', requirePermission('system:permission:query'), (req, res, next) => permissionController.detail(req, res, next));
router.post('/', requirePermission('system:permission:create'), (req, res, next) => permissionController.create(req, res, next));
router.put('/:id', requirePermission('system:permission:update'), (req, res, next) => permissionController.update(req, res, next));
router.delete('/:id', requirePermission('system:permission:delete'), (req, res, next) => permissionController.delete(req, res, next));

export default router;
