const express = require('express');
const EndUserController = require('../controllers/EndUserController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('endUser:view'), EndUserController.getList);
router.get('/stats', authenticate, requirePermission('endUser:view'), EndUserController.getStats);
router.get('/status-logs', authenticate, requirePermission('endUser:view'), EndUserController.getStatusLogs);
router.get('/validate-duplicate', authenticate, requirePermission('endUser:view'), EndUserController.validateDuplicate);
router.get('/uid/:uid', authenticate, requirePermission('endUser:view'), EndUserController.getByUid);
router.get('/:id/validate-change', authenticate, requirePermission('endUser:update'), EndUserController.validateChange);
router.get('/:id', authenticate, requirePermission('endUser:view'), EndUserController.getById);
router.post('/', authenticate, requirePermission('endUser:create'), EndUserController.create);
router.put('/:id', authenticate, requirePermission('endUser:update'), EndUserController.update);
router.put('/:id/status', authenticate, requirePermission('endUser:manage'), EndUserController.changeStatus);
router.post('/batch-operation', authenticate, requirePermission('endUser:batch'), EndUserController.batchOperation);

module.exports = router;
