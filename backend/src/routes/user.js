const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.get('/', authMiddleware, checkPermission('system:user:list'), userController.getUsers);

router.get('/:id', authMiddleware, checkPermission('system:user:view'), userController.getUserById);

router.post('/', authMiddleware, checkPermission('system:user:add'), userController.createUser);

router.put('/:id', authMiddleware, checkPermission('system:user:edit'), userController.updateUser);

router.delete('/:id', authMiddleware, checkPermission('system:user:delete'), userController.deleteUser);

router.post('/:id/roles', authMiddleware, checkPermission('system:user:assign'), userController.assignRoles);

router.get('/:id/roles', authMiddleware, checkPermission('system:user:view'), userController.getUserRoles);

router.post('/:id/reset-password', authMiddleware, checkPermission('system:user:edit'), userController.resetPassword);

module.exports = router;
