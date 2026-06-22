const express = require('express')
const { success } = require('../utils/result')
const auth = require('../middleware/auth')
const pagination = require('../middleware/pagination')
const { checkOrderRisk, checkInventoryBeforeOrder } = require('../middleware/riskControl')
const orderPermission = require('../middleware/orderPermission')
const { preventDuplicateTrace } = require('../middleware/duplicateRequest')
const paymentValidator = require('../middleware/paymentValidator')

const authController = require('../controllers/AuthController')
const userController = require('../controllers/UserController')
const roleController = require('../controllers/RoleController')
const permissionController = require('../controllers/PermissionController')
const userBehaviorController = require('../controllers/UserBehaviorController')
const benefitController = require('../controllers/BenefitController')
const flightController = require('../controllers/FlightController')
const flightPriceController = require('../controllers/FlightPriceController')
const flightInventoryController = require('../controllers/FlightInventoryController')
const flightFulfillmentController = require('../controllers/FlightFulfillmentController')
const hotelController = require('../controllers/HotelController')
const hotelRoomController = require('../controllers/HotelRoomController')
const hotelRoomPriceController = require('../controllers/HotelRoomPriceController')
const hotelFulfillmentController = require('../controllers/HotelFulfillmentController')
const carController = require('../controllers/CarController')
const ticketController = require('../controllers/TicketController')
const scenicSpotController = require('../controllers/ScenicSpotController')
const ticketTypeController = require('../controllers/TicketTypeController')
const ticketInventoryController = require('../controllers/TicketInventoryController')
const orderController = require('../controllers/OrderController')
const merchantController = require('../controllers/MerchantController')
const businessTravelController = require('../controllers/BusinessTravelController')
const couponController = require('../controllers/CouponController')
const approvalController = require('../controllers/ApprovalController')
const paymentController = require('../controllers/PaymentController')
const afterSaleController = require('../controllers/AfterSaleController')
const afterSaleValidator = require('../middleware/afterSaleValidator')
const orderStatisticsController = require('../controllers/OrderStatisticsController')
const { validateStatisticsParams } = require('../middleware/statisticsValidator')

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
router.get('/users/trace/search', auth(), userController.trace.bind(userController));
router.get('/users/validate/uniqueness', auth(), userController.validateUniqueness.bind(userController));
router.put('/users/:id/status', auth(), userController.updateStatus.bind(userController));
router.post('/users/batch/status', auth(['admin', 'risk_operator']), userController.batchUpdateStatus.bind(userController));
router.post('/users/batch/info', auth(['admin']), userController.batchUpdateInfo.bind(userController));
router.post('/users/batch/freeze', auth(['admin', 'risk_operator']), userController.batchFreeze.bind(userController));
router.post('/users/batch/unfreeze', auth(['admin', 'risk_operator']), userController.batchUnfreeze.bind(userController));

router.get('/permissions/tree', auth(), permissionController.getPermissionTree.bind(permissionController));
router.get('/permissions/templates', auth(), permissionController.getTemplates.bind(permissionController));
router.get('/permissions/user/:userId', auth(), permissionController.getUserPermissions.bind(permissionController));
router.post('/permissions/user/:userId', auth(), permissionController.savePermission.bind(permissionController));
router.post('/permissions/validate', auth(), permissionController.validatePermissions.bind(permissionController));
router.post('/permissions/batch/template', auth(['admin']), permissionController.batchApplyTemplate.bind(permissionController));
router.post('/permissions/batch/toggle', auth(['admin']), permissionController.batchToggle.bind(permissionController));
router.post('/permissions/batch/reset', auth(['admin']), permissionController.batchReset.bind(permissionController));
router.get('/permissions/logs', auth(), pagination, permissionController.getLogs.bind(permissionController));
router.get('/permissions/abnormal/:userId', auth(), permissionController.detectAbnormal.bind(permissionController));
router.post('/permissions/check-expired', auth(['admin']), permissionController.checkExpired.bind(permissionController));

router.get('/behaviors', auth(), pagination, userBehaviorController.list.bind(userBehaviorController));
router.get('/behaviors/stats/summary', auth(), userBehaviorController.stats.bind(userBehaviorController));
router.get('/behaviors/trace/:userId', auth(), userBehaviorController.trace.bind(userBehaviorController));
router.post('/behaviors/detect-risk/:userId', auth(['admin', 'risk_operator']), userBehaviorController.detectRisk.bind(userBehaviorController));
router.get('/behaviors/risks/list', auth(), pagination, userBehaviorController.riskList.bind(userBehaviorController));
router.post('/behaviors/batch/mark', auth(['admin', 'risk_operator']), userBehaviorController.batchMark.bind(userBehaviorController));
router.post('/behaviors/batch/warning', auth(['admin', 'risk_operator']), userBehaviorController.batchWarning.bind(userBehaviorController));
router.post('/behaviors/batch/restrict', auth(['admin']), userBehaviorController.batchRestrict.bind(userBehaviorController));

router.get('/benefits', auth(), pagination, benefitController.getList.bind(benefitController));
router.get('/benefits/stats/summary', auth(), benefitController.getStats.bind(benefitController));
router.post('/benefits/validate', auth(), benefitController.validate.bind(benefitController));
router.post('/benefits/grant', auth(['admin', 'operator']), benefitController.grant.bind(benefitController));
router.post('/benefits/:id/reissue', auth(['admin', 'operator']), benefitController.reissue.bind(benefitController));
router.post('/benefits/:id/void', auth(['admin', 'operator']), benefitController.voidBenefit.bind(benefitController));
router.post('/benefits/:id/extend', auth(['admin', 'operator']), benefitController.extend.bind(benefitController));
router.post('/benefits/:id/recycle', auth(['admin']), benefitController.recycle.bind(benefitController));
router.post('/benefits/batch/grant', auth(['admin', 'operator']), benefitController.batchGrant.bind(benefitController));
router.post('/benefits/batch/extend', auth(['admin', 'operator']), benefitController.batchExtend.bind(benefitController));
router.post('/benefits/batch/recycle', auth(['admin']), benefitController.batchRecycle.bind(benefitController));
router.get('/benefits/trace/:userId', auth(), benefitController.trace.bind(benefitController));
router.post('/benefits/check-expired', auth(['admin']), benefitController.checkExpired.bind(benefitController));
registerCrudRoutes('roles', roleController);
registerCrudRoutes('flights', flightController);
router.post('/flights/validate', auth(), flightController.validate.bind(flightController));
router.get('/flights/validate/field', auth(), flightController.validateField.bind(flightController));
router.put('/flights/:id/operation-status', auth(), flightController.updateOperationStatus.bind(flightController));
router.put('/flights/:id/display-status', auth(), flightController.updateDisplayStatus.bind(flightController));
router.post('/flights/batch/time', auth(['admin', 'operator']), flightController.batchUpdateTime.bind(flightController));
router.post('/flights/batch/display-status', auth(['admin', 'operator']), flightController.batchUpdateDisplayStatus.bind(flightController));
router.post('/flights/batch/offline-abnormal', auth(['admin', 'operator', 'international_operator']), flightController.batchOfflineAbnormal.bind(flightController));
router.get('/flights/:id/logs', auth(), pagination, flightController.getLogs.bind(flightController));
router.get('/flights/stats/summary', auth(), flightController.getStats.bind(flightController));

registerCrudRoutes('flight-prices', flightPriceController);
router.get('/flight-prices', auth(), pagination, flightPriceController.getPriceList.bind(flightPriceController));
router.get('/flight-prices/:id', auth(), flightPriceController.getPriceById.bind(flightPriceController));
router.post('/flight-prices', auth(), flightPriceController.createPrice.bind(flightPriceController));
router.put('/flight-prices/:id', auth(), flightPriceController.updatePrice.bind(flightPriceController));
router.delete('/flight-prices/:id', auth(), flightPriceController.deletePrice.bind(flightPriceController));
router.post('/flight-prices/validate', auth(), flightPriceController.validatePrice.bind(flightPriceController));
router.get('/flight-prices/validate/field', auth(), flightPriceController.validateField.bind(flightPriceController));
router.put('/flight-prices/:id/display-status', auth(), flightPriceController.updateDisplayStatus.bind(flightPriceController));
router.post('/flight-prices/batch/time', auth(['admin', 'operator', 'price_manager']), flightPriceController.batchUpdateTime.bind(flightPriceController));
router.post('/flight-prices/batch/price', auth(['admin', 'operator', 'price_manager']), flightPriceController.batchUpdatePrice.bind(flightPriceController));
router.post('/flight-prices/batch/display-status', auth(['admin', 'operator', 'price_manager']), flightPriceController.batchUpdateDisplayStatus.bind(flightPriceController));
router.get('/flight-prices/:id/logs', auth(), pagination, flightPriceController.getPriceLogs.bind(flightPriceController));
router.get('/flight-prices/stats/summary', auth(), flightPriceController.getPriceStats.bind(flightPriceController));

router.get('/flight-inventories', auth(), pagination, flightInventoryController.getInventoryList.bind(flightInventoryController));
router.get('/flight-inventories/:id', auth(), flightInventoryController.getInventoryById.bind(flightInventoryController));
router.post('/flight-inventories', auth(), flightInventoryController.createInventory.bind(flightInventoryController));
router.put('/flight-inventories/:id', auth(), flightInventoryController.updateInventory.bind(flightInventoryController));
router.delete('/flight-inventories/:id', auth(), flightInventoryController.deleteInventory.bind(flightInventoryController));
router.post('/flight-inventories/validate', auth(), flightInventoryController.validateInventory.bind(flightInventoryController));
router.get('/flight-inventories/validate/field', auth(), flightInventoryController.validateField.bind(flightInventoryController));
router.put('/flight-inventories/:id/active-status', auth(), flightInventoryController.updateActiveStatus.bind(flightInventoryController));
router.put('/flight-inventories/:id/lock', auth(), flightInventoryController.lockInventory.bind(flightInventoryController));
router.put('/flight-inventories/:id/unlock', auth(), flightInventoryController.unlockInventory.bind(flightInventoryController));
router.post('/flight-inventories/batch/lock', auth(['admin', 'inventory_manager', 'holiday_inventory']), flightInventoryController.batchLockInventory.bind(flightInventoryController));
router.post('/flight-inventories/batch/unlock', auth(['admin', 'inventory_manager', 'holiday_inventory']), flightInventoryController.batchUnlockInventory.bind(flightInventoryController));
router.post('/flight-inventories/batch/release-reservations', auth(['admin', 'inventory_manager']), flightInventoryController.batchReleaseReservations.bind(flightInventoryController));
router.post('/flight-inventories/batch/supplement', auth(['admin', 'inventory_manager', 'inventory_supplement']), flightInventoryController.batchSupplementInventory.bind(flightInventoryController));
router.post('/flight-inventories/batch/active-status', auth(['admin', 'inventory_manager']), flightInventoryController.batchUpdateActiveStatus.bind(flightInventoryController));
router.get('/flight-inventories/:id/logs', auth(), pagination, flightInventoryController.getInventoryLogs.bind(flightInventoryController));
router.get('/flight-inventories/logs/all', auth(), pagination, flightInventoryController.getInventoryLogs.bind(flightInventoryController));
router.get('/flight-inventories/stats/summary', auth(), flightInventoryController.getInventoryStats.bind(flightInventoryController));
router.post('/flight-inventories/release-expired', auth(['admin', 'inventory_manager']), flightInventoryController.releaseExpiredReservations.bind(flightInventoryController));
router.get('/flight-inventories/warnings/low-stock', auth(), flightInventoryController.checkLowStockWarning.bind(flightInventoryController));

router.get('/flight-fulfillments', auth(), pagination, flightFulfillmentController.getList.bind(flightFulfillmentController));
router.get('/flight-fulfillments/:id', auth(), flightFulfillmentController.getById.bind(flightFulfillmentController));
router.post('/flight-fulfillments/validate', auth(), flightFulfillmentController.validateFulfillment.bind(flightFulfillmentController));
router.get('/flight-fulfillments/validate/field', auth(), flightFulfillmentController.validateField.bind(flightFulfillmentController));
router.post('/flight-fulfillments/:orderId', auth(['admin', 'fulfillment_audit', 'fulfillment_operator']), flightFulfillmentController.createFulfillment.bind(flightFulfillmentController));
router.put('/flight-fulfillments/:id/audit', auth(['admin', 'fulfillment_audit']), flightFulfillmentController.auditFulfillment.bind(flightFulfillmentController));
router.put('/flight-fulfillments/:id/issue-ticket', auth(['admin', 'fulfillment_audit', 'fulfillment_operator']), flightFulfillmentController.issueTicket.bind(flightFulfillmentController));
router.put('/flight-fulfillments/:id/flight-change', auth(['admin', 'fulfillment_audit', 'fulfillment_operator']), flightFulfillmentController.handleFlightChange.bind(flightFulfillmentController));
router.put('/flight-fulfillments/:id/terminate', auth(['admin', 'fulfillment_audit']), flightFulfillmentController.terminateFulfillment.bind(flightFulfillmentController));
router.put('/flight-fulfillments/:id/mark-abnormal', auth(['admin', 'fulfillment_audit', 'risk_operator']), flightFulfillmentController.markAbnormal.bind(flightFulfillmentController));
router.put('/flight-fulfillments/:id/handle-abnormal', auth(['admin', 'fulfillment_audit', 'risk_operator']), flightFulfillmentController.handleAbnormal.bind(flightFulfillmentController));
router.post('/flight-fulfillments/batch/issue', auth(['admin', 'fulfillment_audit']), flightFulfillmentController.batchIssueTickets.bind(flightFulfillmentController));
router.post('/flight-fulfillments/batch/flight-change', auth(['admin', 'fulfillment_audit', 'fulfillment_operator']), flightFulfillmentController.batchHandleFlightChanges.bind(flightFulfillmentController));
router.post('/flight-fulfillments/batch/mark-abnormal', auth(['admin', 'fulfillment_audit', 'risk_operator']), flightFulfillmentController.batchMarkAbnormal.bind(flightFulfillmentController));
router.get('/flight-fulfillments/:fulfillmentId/logs', auth(), pagination, flightFulfillmentController.getLogs.bind(flightFulfillmentController));
router.get('/flight-fulfillments/logs/all', auth(), pagination, flightFulfillmentController.getLogs.bind(flightFulfillmentController));
router.get('/flight-fulfillments/stats/summary', auth(), flightFulfillmentController.getStats.bind(flightFulfillmentController));
router.post('/flight-fulfillments/check-timeout', auth(['admin', 'fulfillment_audit']), flightFulfillmentController.checkTicketTimeout.bind(flightFulfillmentController));

registerCrudRoutes('hotels', hotelController);
router.get('/hotels/ops/permission', auth(), hotelController.checkPermission.bind(hotelController));
router.put('/hotels/:id/ops/status', auth(), hotelController.changeStatus.bind(hotelController));
router.post('/hotels/ops/batch', auth(['admin', 'hotel_operator', 'senior_hotel_operator']), hotelController.batchOperation.bind(hotelController));
router.get('/hotels/:id/ops/logs', auth(), pagination, hotelController.getLogs.bind(hotelController));
router.get('/hotels/ops/logs/all', auth(), pagination, hotelController.getAllLogs.bind(hotelController));
router.post('/hotels/:id/ops/verify', auth(['admin', 'senior_hotel_operator', 'hotel_auditor']), hotelController.verifyHotel.bind(hotelController));

router.get('/hotel-rooms', auth(), pagination, hotelRoomController.list.bind(hotelRoomController));
router.get('/hotel-rooms/:id', auth(), hotelRoomController.get.bind(hotelRoomController));
router.post('/hotel-rooms', auth(), hotelRoomController.create.bind(hotelRoomController));
router.put('/hotel-rooms/:id', auth(), hotelRoomController.update.bind(hotelRoomController));
router.get('/hotel-rooms/ops/permission', auth(), hotelRoomController.checkPermission.bind(hotelRoomController));
router.post('/hotel-rooms/:id/ops/verify', auth(), hotelRoomController.verifyParams.bind(hotelRoomController));
router.put('/hotel-rooms/:id/ops/maintain-status', auth(), hotelRoomController.changeMaintainStatus.bind(hotelRoomController));
router.post('/hotel-rooms/ops/batch', auth(['admin', 'hotel_operator', 'senior_hotel_operator']), hotelRoomController.batchOperation.bind(hotelRoomController));
router.get('/hotel-rooms/:id/ops/logs', auth(), pagination, hotelRoomController.getLogs.bind(hotelRoomController));
router.get('/hotel-rooms/ops/logs/all', auth(), pagination, hotelRoomController.getAllLogs.bind(hotelRoomController));

router.get('/hotel-room-prices', auth(), pagination, hotelRoomPriceController.list.bind(hotelRoomPriceController));
router.get('/hotel-room-prices/:id', auth(), hotelRoomPriceController.get.bind(hotelRoomPriceController));
router.post('/hotel-room-prices', auth(), hotelRoomPriceController.create.bind(hotelRoomPriceController));
router.put('/hotel-room-prices/:id', auth(), hotelRoomPriceController.update.bind(hotelRoomPriceController));
router.get('/hotel-room-prices/ops/permission', auth(), hotelRoomPriceController.checkPermission.bind(hotelRoomPriceController));
router.post('/hotel-room-prices/:id/ops/verify', auth(), hotelRoomPriceController.verifyParams.bind(hotelRoomPriceController));
router.put('/hotel-room-prices/:id/ops/status', auth(), hotelRoomPriceController.changeStatus.bind(hotelRoomPriceController));
router.post('/hotel-room-prices/ops/batch', auth(['admin','hotel_operator','senior_hotel_operator','price_manager']), hotelRoomPriceController.batchOperation.bind(hotelRoomPriceController));
router.get('/hotel-room-prices/:id/ops/logs', auth(), pagination, hotelRoomPriceController.getLogs.bind(hotelRoomPriceController));
router.get('/hotel-room-prices/ops/logs/all', auth(), pagination, hotelRoomPriceController.getAllLogs.bind(hotelRoomPriceController));
router.get('/hotel-room-prices/:id/ops/purchases', auth(), pagination, hotelRoomPriceController.getPurchaseDetails.bind(hotelRoomPriceController));

router.get('/hotel-fulfillments', auth(), pagination, hotelFulfillmentController.list.bind(hotelFulfillmentController));
router.get('/hotel-fulfillments/:id', auth(), hotelFulfillmentController.get.bind(hotelFulfillmentController));
router.get('/hotel-fulfillments/ops/permission', auth(), hotelFulfillmentController.checkPermission.bind(hotelFulfillmentController));
router.post('/hotel-fulfillments/:id/ops/verify', auth(), hotelFulfillmentController.verifyCheckIn.bind(hotelFulfillmentController));
router.put('/hotel-fulfillments/:id/ops/checkout', auth(), hotelFulfillmentController.checkout.bind(hotelFulfillmentController));
router.put('/hotel-fulfillments/:id/ops/extend', auth(), hotelFulfillmentController.extendStay.bind(hotelFulfillmentController));
router.put('/hotel-fulfillments/:id/ops/noshow', auth(), hotelFulfillmentController.markNoShow.bind(hotelFulfillmentController));
router.post('/hotel-fulfillments/ops/batch', auth(['admin','hotel_operator','senior_hotel_operator','fulfillment_auditor']), hotelFulfillmentController.batchOperation.bind(hotelFulfillmentController));
router.get('/hotel-fulfillments/:id/ops/logs', auth(), pagination, hotelFulfillmentController.getLogs.bind(hotelFulfillmentController));
router.get('/hotel-fulfillments/ops/logs/all', auth(), pagination, hotelFulfillmentController.getAllLogs.bind(hotelFulfillmentController));

registerCrudRoutes('cars', carController);
registerCrudRoutes('tickets', ticketController);

registerCrudRoutes('scenic-spots', scenicSpotController);
router.get('/scenic-spots/ops/permission', auth(), scenicSpotController.checkPermission.bind(scenicSpotController));
router.put('/scenic-spots/:id/ops/status', auth(), scenicSpotController.changeStatus.bind(scenicSpotController));
router.post('/scenic-spots/ops/batch', auth(['admin', 'scenic_operator', 'senior_scenic_operator']), scenicSpotController.batchOperation.bind(scenicSpotController));
router.get('/scenic-spots/:id/ops/logs', auth(), pagination, scenicSpotController.getLogs.bind(scenicSpotController));
router.get('/scenic-spots/ops/logs/all', auth(), pagination, scenicSpotController.getAllLogs.bind(scenicSpotController));
router.post('/scenic-spots/:id/ops/verify', auth(['admin', 'senior_scenic_operator', 'scenic_auditor']), scenicSpotController.verifySpot.bind(scenicSpotController));

registerCrudRoutes('ticket-types', ticketTypeController);
router.get('/ticket-types/ops/permission', auth(), ticketTypeController.checkPermission.bind(ticketTypeController));
router.put('/ticket-types/:id/ops/status', auth(), ticketTypeController.changeStatus.bind(ticketTypeController));
router.put('/ticket-types/:id/ops/enabled', auth(), ticketTypeController.setEnabled.bind(ticketTypeController));
router.post('/ticket-types/ops/batch', auth(['admin', 'senior_ticket_operator']), ticketTypeController.batchOperation.bind(ticketTypeController));
router.post('/ticket-types/:id/ops/verify', auth(['admin', 'senior_ticket_operator', 'ticket_auditor']), ticketTypeController.verifyTicket.bind(ticketTypeController));
router.get('/ticket-types/:id/ops/logs', auth(), pagination, ticketTypeController.getLogs.bind(ticketTypeController));
router.get('/ticket-types/ops/logs/all', auth(), pagination, ticketTypeController.getAllLogs.bind(ticketTypeController));

registerCrudRoutes('ticket-inventory', ticketInventoryController);
router.get('/ticket-inventory/ops/stats', auth(), ticketInventoryController.getStats.bind(ticketInventoryController));
router.get('/ticket-inventory/ops/permission', auth(), ticketInventoryController.checkPermission.bind(ticketInventoryController));
router.put('/ticket-inventory/:id/ops/status', auth(), ticketInventoryController.setStatus.bind(ticketInventoryController));
router.post('/ticket-inventory/ops/batch', auth(['admin', 'senior_ticket_operator']), ticketInventoryController.batchOperation.bind(ticketInventoryController));
router.post('/ticket-inventory/:id/ops/verify', auth(['admin', 'senior_ticket_operator', 'inventory_auditor']), ticketInventoryController.verifyInventory.bind(ticketInventoryController));
router.post('/ticket-inventory/ops/check-expired', auth(['admin']), ticketInventoryController.checkExpired.bind(ticketInventoryController));
router.get('/ticket-inventory/:id/ops/logs', auth(), pagination, ticketInventoryController.getLogs.bind(ticketInventoryController));
router.get('/ticket-inventory/ops/logs/all', auth(), pagination, ticketInventoryController.getAllLogs.bind(ticketInventoryController));

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

registerCrudRoutes('merchants', merchantController);
router.post('/merchants/:id/audit', auth(), merchantController.auditMerchant.bind(merchantController))
router.get('/merchants/:id/orders', auth(), pagination, merchantController.getMerchantOrders.bind(merchantController))
router.put('/merchants/:id/violation', auth(), merchantController.updateViolation.bind(merchantController))
router.get('/merchants/audit/stats', auth(), merchantController.getAuditStats.bind(merchantController))
router.get('/merchants/audit/pending', auth(), pagination, merchantController.getPendingAuditList.bind(merchantController))
router.get('/merchants/:id/audit/detail', auth(), merchantController.getAuditDetail.bind(merchantController))
router.get('/merchants/:id/audit/precheck', auth(), merchantController.preAuditCheck.bind(merchantController))
router.post('/merchants/:id/audit/pass', auth(['admin', 'merchant_auditor', 'senior_auditor']), merchantController.submitAuditPass.bind(merchantController))
router.post('/merchants/:id/audit/reject', auth(['admin', 'merchant_auditor', 'senior_auditor']), merchantController.submitAuditReject.bind(merchantController))
router.post('/merchants/:id/audit/temporary', auth(['admin', 'merchant_auditor', 'senior_auditor']), merchantController.submitAuditTemporary.bind(merchantController))
router.post('/merchants/batch/audit-pass', auth(['admin', 'merchant_auditor', 'senior_auditor']), merchantController.batchAuditPass.bind(merchantController))
router.post('/merchants/batch/audit-reject', auth(['admin', 'merchant_auditor', 'senior_auditor']), merchantController.batchAuditReject.bind(merchantController))
router.post('/merchants/batch/audit-temporary', auth(['admin', 'merchant_auditor', 'senior_auditor']), merchantController.batchAuditTemporary.bind(merchantController))
router.post('/merchants/audit/check-expired', auth(['admin']), merchantController.checkExpiredAudits.bind(merchantController))
router.get('/merchants/:id/audit/trace', auth(), pagination, merchantController.getAuditTrace.bind(merchantController))
router.get('/merchants/:id/qualifications', auth(), merchantController.getQualifications.bind(merchantController))
router.put('/merchants/:id/qualifications', auth(), merchantController.saveQualifications.bind(merchantController))

router.get('/merchants/ops/stats', auth(), merchantController.getOpsStats.bind(merchantController))
router.get('/merchants/ops/list', auth(), pagination, merchantController.getOpsMerchantList.bind(merchantController))
router.get('/merchants/ops/verify-unique', auth(), merchantController.verifyFieldUnique.bind(merchantController))
router.get('/merchants/:id/ops/detail', auth(), merchantController.getOpsDetail.bind(merchantController))
router.get('/merchants/:id/ops/precheck', auth(), merchantController.preOpsCheck.bind(merchantController))

router.put('/merchants/:id/ops/basic-info', auth(['admin', 'merchant_operator', 'senior_operator']), merchantController.updateBasicInfo.bind(merchantController))
router.put('/merchants/:id/ops/business-info', auth(['admin', 'senior_operator']), merchantController.updateBusinessInfo.bind(merchantController))
router.put('/merchants/:id/ops/contact-info', auth(['admin', 'merchant_operator', 'senior_operator']), merchantController.updateContactInfo.bind(merchantController))
router.put('/merchants/:id/ops/settlement-info', auth(['admin', 'finance_operator', 'senior_operator']), merchantController.updateSettlementInfo.bind(merchantController))
router.put('/merchants/:id/ops/business-status', auth(['admin', 'senior_operator']), merchantController.updateBusinessStatus.bind(merchantController))
router.put('/merchants/:id/ops/operation-status', auth(['admin', 'senior_operator']), merchantController.updateOperationStatus.bind(merchantController))

router.post('/merchants/batch/ops/update-tags', auth(['admin', 'senior_operator']), merchantController.batchUpdateTags.bind(merchantController))
router.post('/merchants/batch/ops/update-notice', auth(['admin', 'senior_operator']), merchantController.batchUpdateNotice.bind(merchantController))
router.post('/merchants/batch/ops/lock-accounts', auth(['admin']), merchantController.batchLockAccounts.bind(merchantController))

router.get('/merchants/:id/ops/change-logs', auth(), pagination, merchantController.getChangeLogs.bind(merchantController))
router.get('/merchants/:id/ops/complete-trace', auth(), merchantController.getCompleteTrace.bind(merchantController))

router.post('/payments/initiate', auth(), paymentValidator.checkPaymentPreconditions, paymentValidator.validatePaymentParams, paymentController.initiatePayment.bind(paymentController))
router.put('/payments/:flowId/confirm', auth(), paymentController.confirmPayment.bind(paymentController))
router.put('/payments/:flowId/fail', auth(), paymentController.failPayment.bind(paymentController))

router.post('/payments/batch/remind', auth(['admin', 'operator']), orderPermission.checkBatchOperationPermission, paymentController.batchRemindPayment.bind(paymentController))
router.post('/payments/batch/cancel-timeout', auth(['admin']), orderPermission.checkBatchOperationPermission, paymentController.batchCancelTimeout.bind(paymentController))
router.post('/payments/batch/exempt-timeout', auth(['admin']), orderPermission.checkBatchOperationPermission, paymentController.batchExemptTimeout.bind(paymentController))

router.get('/payments/trace', auth(), preventDuplicateTrace, paymentController.tracePaymentFlows.bind(paymentController))
router.get('/payments/:flowId', auth(), paymentController.getFlowDetail.bind(paymentController))
router.get('/payments/order/:orderId', auth(), paymentController.getOrderFlows.bind(paymentController))

router.post('/after-sales/apply', auth(), afterSaleValidator.checkAfterSalePreconditions, afterSaleValidator.validateAfterSaleParams, afterSaleController.apply.bind(afterSaleController))
router.put('/after-sales/:id/approve', auth(['admin', 'operator']), afterSaleController.approve.bind(afterSaleController))
router.put('/after-sales/:id/reject', auth(['admin', 'operator']), afterSaleController.reject.bind(afterSaleController))
router.put('/after-sales/:id/postpone', auth(['admin', 'operator']), afterSaleController.postpone.bind(afterSaleController))
router.post('/after-sales/:id/execute-refund', auth(['admin']), afterSaleController.executeRefund.bind(afterSaleController))

router.post('/after-sales/batch/approve', auth(['admin', 'operator']), orderPermission.checkBatchOperationPermission, afterSaleController.batchApprove.bind(afterSaleController))
router.post('/after-sales/batch/reject', auth(['admin', 'operator']), orderPermission.checkBatchOperationPermission, afterSaleController.batchReject.bind(afterSaleController))
router.post('/after-sales/batch/postpone', auth(['admin', 'operator']), orderPermission.checkBatchOperationPermission, afterSaleController.batchPostpone.bind(afterSaleController))

router.get('/after-sales/trace', auth(), pagination, preventDuplicateTrace, afterSaleController.trace.bind(afterSaleController))
router.get('/after-sales/:id', auth(), afterSaleController.getDetail.bind(afterSaleController))
router.get('/after-sales', auth(), pagination, afterSaleController.list.bind(afterSaleController))

router.get('/order-statistics', auth(), validateStatisticsParams, orderStatisticsController.getOrderStatistics.bind(orderStatisticsController))
router.get('/order-filter', auth(), pagination, validateStatisticsParams, orderStatisticsController.filterOrders.bind(orderStatisticsController))
router.post('/order-export', auth(), validateStatisticsParams, orderStatisticsController.exportOrders.bind(orderStatisticsController))

module.exports = router;
