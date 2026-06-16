const express = require('express');
const ActivityController = require('../controllers/ActivityController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, ActivityController.getList);
router.get('/:id', authenticate, ActivityController.getById);
router.post('/', authenticate, requirePermission('activity:create'), ActivityController.create);
router.put('/:id', authenticate, requirePermission('activity:update'), ActivityController.update);
router.delete('/:id', authenticate, requirePermission('activity:delete'), ActivityController.delete);

module.exports = router;
