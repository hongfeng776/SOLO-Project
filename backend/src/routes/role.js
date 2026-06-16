const express = require('express');
const RoleController = require('../controllers/RoleController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/all', authenticate, RoleController.getAll);
router.get('/', authenticate, RoleController.getList);
router.get('/:id', authenticate, RoleController.getById);
router.post('/', authenticate, requirePermission('role:create'), RoleController.create);
router.put('/:id', authenticate, requirePermission('role:update'), RoleController.update);
router.delete('/:id', authenticate, requirePermission('role:delete'), RoleController.delete);

module.exports = router;
