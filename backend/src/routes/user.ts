import { Router } from 'express';
import { UserController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const userController = new UserController();

router.get('/list', requirePermission('system:user:query'), (req, res, next) => userController.list(req, res, next));
router.get('/:id', requirePermission('system:user:query'), (req, res, next) => userController.detail(req, res, next));
router.post('/', requirePermission('system:user:create'), (req, res, next) => userController.create(req, res, next));
router.put('/:id', requirePermission('system:user:update'), (req, res, next) => userController.update(req, res, next));
router.delete('/:id', requirePermission('system:user:delete'), (req, res, next) => userController.delete(req, res, next));
router.post('/batchDelete', requirePermission('system:user:delete'), (req, res, next) => userController.batchDelete(req, res, next));
router.put('/:id/status', requirePermission('system:user:update'), (req, res, next) => userController.updateStatus(req, res, next));
router.put('/:id/resetPassword', requirePermission('system:user:reset'), (req, res, next) => userController.resetPassword(req, res, next));

export default router;
