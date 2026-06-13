const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.get('/', authMiddleware, checkPermission('system:permission:list'), permissionController.getPermissions);

router.get('/tree', authMiddleware, checkPermission('system:permission:list'), permissionController.getPermissionTree);

router.get('/:id', authMiddleware, checkPermission('system:permission:view'), permissionController.getPermissionById);

router.post('/', authMiddleware, checkPermission('system:permission:add'), permissionController.createPermission);

router.put('/:id', authMiddleware, checkPermission('system:permission:edit'), permissionController.updatePermission);

router.delete('/:id', authMiddleware, checkPermission('system:permission:delete'), permissionController.deletePermission);

module.exports = router;
