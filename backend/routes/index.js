const express = require('express');
const { success } = require('../utils/result');
const auth = require('../middleware/auth');
const pagination = require('../middleware/pagination');
const { checkOrderRisk, checkInventoryBeforeOrder } = require('../middleware/riskControl');
const orderPermission = require('../middleware/orderPermission');
const { preventDuplicateTrace } = require('../middleware/duplicateRequest');

const authController = require('../controllers/AuthController');
const userController = require('../controllers/UserController');
const roleController = require('../controllers/RoleController');
const flightController = require('../controllers/FlightController');
const hotelController = require('../controllers/HotelController');
const carController = require('../controllers/CarController');
const ticketController = require('../controllers/TicketController');
const orderController = require('../controllers/OrderController');
const merchantController = require('../controllers/MerchantController');
const businessTravelController = require('../controllers/BusinessTravelController');
const couponController = require('../controllers/CouponController');
const approvalController = require('../controllers/ApprovalController');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(success({
    project: '智慧出行管理后台',
    version: '1.0.0',
    description: '后端API服务'
  }));
});

const registerCrudRoutes = (path, controller) => {
  router.get(`/${path}`, auth(), pagination, controller.list.bind(controller));
  router.get(`/${path}/:id`, auth(), controller.get.bind(controller));
  router.post(`/${path}`, auth(), controller.create.bind(controller));
  router.put(`/${path}/:id`, auth(), controller.update.bind(controller));
  router.delete(`/${path}/:id`, auth(), controller.remove.bind(controller));
  router.delete(`/${path}/batch`, auth(), controller.batchRemove.bind(controller));
};

router.post('/auth/login', authController.login);
router.get('/auth/userinfo', auth(), authController.getUserInfo);
router.post('/auth/logout', auth(), authController.logout);

registerCrudRoutes('users', userController);
registerCrudRoutes('roles', roleController);
registerCrudRoutes('flights', flightController);
registerCrudRoutes('hotels', hotelController);
registerCrudRoutes('cars', carController);
registerCrudRoutes('tickets', ticketController);

router.get('/orders', auth(), pagination, orderController.list.bind(orderController));
router.get('/orders/:id', auth(), orderController.get.bind(orderController));
router.post('/orders', auth(), checkOrderRisk, checkInventoryBeforeOrder, orderController.create.bind(orderController));
router.put('/orders/:id', auth(), orderController.update.bind(orderController));
router.delete('/orders/:id', auth(), orderController.remove.bind(orderController));
router.delete('/orders/batch', auth(), orderController.batchRemove.bind(orderController));
router.get('/orders/:id/logs', auth(), orderController.getOrderLogs.bind(orderController));
router.post('/orders/:id/cancel', auth(), orderController.cancelOrder.bind(orderController));
router.post('/orders/:id/refund', auth(), orderController.refundOrder.bind(orderController));
router.post('/orders/batch-export', auth(), orderController.batchExport.bind(orderController));

router.get('/orders/:id/edit', auth(), orderPermission.checkOrderEditPermission, orderController.getEditDetail.bind(orderController));
router.post('/orders/:id/validate', auth(), orderPermission.checkOrderEditPermission, orderController.validateEdit.bind(orderController));
router.put('/orders/:id/info', auth(), orderPermission.checkOrderEditPermission, orderController.updateOrderInfo.bind(orderController));

router.put('/orders/:id/status', auth(), orderPermission.checkOrderStatusPermission, orderController.updateOrderStatus.bind(orderController));
router.put('/orders/:id/reset', auth(['admin']), orderPermission.checkOrderStatusPermission, orderController.resetOrderStatus.bind(orderController));

router.post('/orders/batch/confirm', auth(['admin', 'operator']), orderPermission.checkBatchOperationPermission, orderController.batchConfirmFulfill.bind(orderController));
router.post('/orders/batch/abnormal', auth(['admin', 'risk_operator']), orderPermission.checkBatchOperationPermission, orderController.batchMarkAbnormal.bind(orderController));
router.post('/orders/batch/archive', auth(['admin']), orderPermission.checkBatchOperationPermission, orderController.batchArchive.bind(orderController));

router.get('/orders/trace', auth(), preventDuplicateTrace, orderController.traceOrder.bind(orderController));

router.post('/business-travel', auth(), businessTravelController.create.bind(businessTravelController));
router.get('/business-travel', auth(), pagination, businessTravelController.list.bind(businessTravelController));
router.get('/business-travel/:id', auth(), businessTravelController.get.bind(businessTravelController));
router.put('/business-travel/:id', auth(), businessTravelController.update.bind(businessTravelController));
router.post('/business-travel/:id/confirm', auth(), businessTravelController.confirm.bind(businessTravelController));
router.post('/business-travel/:id/cancel', auth(), businessTravelController.cancel.bind(businessTravelController));

registerCrudRoutes('coupons', couponController);
router.post('/coupons/:id/issue', auth(), couponController.issue.bind(couponController));
router.post('/coupons/batch-issue', auth(), couponController.batchIssue.bind(couponController));
router.post('/coupons/:id/revoke', auth(), couponController.revoke.bind(couponController));

registerCrudRoutes('approvals', approvalController);
router.post('/approvals/:id/approve', auth(), approvalController.approve.bind(approvalController));
router.post('/approvals/:id/reject', auth(), approvalController.reject.bind(approvalController));

router.post('/merchants/:id/audit', auth(), merchantController.auditMerchant.bind(merchantController));
router.get('/merchants/:id/orders', auth(), pagination, merchantController.getMerchantOrders.bind(merchantController));
router.put('/merchants/:id/violation', auth(), merchantController.updateViolation.bind(merchantController));

module.exports = router;
