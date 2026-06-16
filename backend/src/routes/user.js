const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, UserController.getList);
router.get('/:id', authenticate, UserController.getById);
router.post('/', authenticate, requirePermission('user:create'), UserController.create);
router.put('/:id', authenticate, requirePermission('user:update'), UserController.update);
router.delete('/:id', authenticate, requirePermission('user:delete'), UserController.delete);
router.post('/batch-delete', authenticate, requirePermission('user:delete'), UserController.batchDelete);
router.put('/:id/status', authenticate, requirePermission('user:update'), UserController.updateStatus);

module.exports = router;
