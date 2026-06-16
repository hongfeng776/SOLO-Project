import { Router } from 'express';
import * as userController from '@controllers/UserController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('user:view'), userController.getUserList);
router.get('/:id', checkPermission('user:view'), userController.getUserById);
router.post('/', checkPermission('user:manage'), userController.createUser);
router.put('/:id', checkPermission('user:manage'), userController.updateUser);
router.delete('/:id', checkPermission('user:manage'), userController.deleteUser);
router.post('/:id/roles', checkPermission('user:manage'), userController.assignRoles);

export default router;
