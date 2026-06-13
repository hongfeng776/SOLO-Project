const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.get('/', authMiddleware, checkPermission('system:role:list'), roleController.getRoles);

router.get('/:id', authMiddleware, checkPermission('system:role:view'), roleController.getRoleById);

router.post('/', authMiddleware, checkPermission('system:role:add'), roleController.createRole);

router.put('/:id', authMiddleware, checkPermission('system:role:edit'), roleController.updateRole);

router.delete('/:id', authMiddleware, checkPermission('system:role:delete'), roleController.deleteRole);

router.post('/:id/permissions', authMiddleware, checkPermission('system:role:assign'), roleController.assignPermissions);

router.get('/:id/permissions', authMiddleware, checkPermission('system:role:view'), roleController.getRolePermissions);

module.exports = router;
