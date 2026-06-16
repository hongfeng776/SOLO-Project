import { Router } from 'express';
import { RoleController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const roleController = new RoleController();

router.get('/list', requirePermission('system:role:query'), (req, res, next) => roleController.list(req, res, next));
router.get('/all', requirePermission('system:role:query'), (req, res, next) => roleController.all(req, res, next));
router.get('/options', requirePermission('system:role:query'), (req, res, next) => roleController.options(req, res, next));
router.get('/:id', requirePermission('system:role:query'), (req, res, next) => roleController.detail(req, res, next));
router.post('/', requirePermission('system:role:create'), (req, res, next) => roleController.create(req, res, next));
router.put('/:id', requirePermission('system:role:update'), (req, res, next) => roleController.update(req, res, next));
router.delete('/:id', requirePermission('system:role:delete'), (req, res, next) => roleController.delete(req, res, next));
router.post('/batchDelete', requirePermission('system:role:delete'), (req, res, next) => roleController.batchDelete(req, res, next));

export default router;
