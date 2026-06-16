const express = require('express');
const operationLogController = require('../controllers/OperationLogController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('log:view'), operationLogController.getOperationLogList);
router.get('/stats', authenticate, requirePermission('log:view'), operationLogController.getOperationStats);
router.get('/export', authenticate, requirePermission('log:export'), operationLogController.exportLogs);
router.get('/:id', authenticate, requirePermission('log:view'), operationLogController.getOperationLogById);

module.exports = router;
