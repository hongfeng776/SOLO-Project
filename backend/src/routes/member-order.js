const express = require('express');
const memberOrderController = require('../controllers/MemberOrderController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('memberOrder:view'), memberOrderController.getOrderList);
router.get('/stats', authenticate, requirePermission('memberOrder:view'), memberOrderController.getOrderStats);
router.get('/trace', authenticate, requirePermission('memberOrder:view'), memberOrderController.getTraceInfo);
router.get('/:id', authenticate, requirePermission('memberOrder:view'), memberOrderController.getOrderDetail);
router.get('/:orderId/logs', authenticate, requirePermission('memberOrder:view'), memberOrderController.getOrderLogs);
router.get('/:id/consistency', authenticate, requirePermission('memberOrder:view'), memberOrderController.checkConsistency);

router.post('/batch-action', authenticate, requirePermission('memberOrder:manage'), memberOrderController.batchAction);
router.post('/:id/verify', authenticate, requirePermission('memberOrder:edit'), memberOrderController.verifyOrder);
router.post('/:id/cancel', authenticate, requirePermission('memberOrder:edit'), memberOrderController.cancelOrder);
router.post('/:id/refund', authenticate, requirePermission('memberOrder:manage'), memberOrderController.refundOrder);
router.post('/:id/appeal', authenticate, requirePermission('memberOrder:edit'), memberOrderController.appealOrder);
router.post('/:id/resolve-abnormal', authenticate, requirePermission('memberOrder:manage'), memberOrderController.resolveAbnormal);

module.exports = router;
