import { Router } from 'express';
import { TransactionController, ProductController, CustomerController, RiskController, AccountOpeningController } from '../controllers';
import { requirePermission, requireAuth } from '../middlewares';

const router = Router();
const transactionController = new TransactionController();
const productController = new ProductController();
const customerController = new CustomerController();
const riskController = new RiskController();
const accountOpeningController = new AccountOpeningController();

router.get('/channel/list', requirePermission('business:channel:query'), (req, res, next) => productController.channelList(req, res, next));

router.get('/transaction/list', requirePermission('business:transaction:query'), (req, res, next) => transactionController.list(req, res, next));
router.get('/transaction/statistics', requirePermission('business:transaction:query'), (req, res, next) => transactionController.statistics(req, res, next));
router.get('/transaction/:id', requirePermission('business:transaction:query'), (req, res, next) => transactionController.detail(req, res, next));
router.post('/transaction', requirePermission('business:transaction:create'), (req, res, next) => transactionController.create(req, res, next));
router.put('/transaction/:id', requirePermission('business:transaction:update'), (req, res, next) => transactionController.update(req, res, next));
router.post('/transaction/:id/cancel', requirePermission('business:transaction:update'), (req, res, next) => transactionController.cancel(req, res, next));
router.post('/transaction/:id/freeze', requirePermission('business:transaction:update'), (req, res, next) => transactionController.freeze(req, res, next));
router.post('/transaction/:id/reverse', requirePermission('business:transaction:reverse'), (req, res, next) => transactionController.reverse(req, res, next));
router.post('/transaction/batch', requirePermission('business:transaction:update'), (req, res, next) => transactionController.batch(req, res, next));
router.post('/transaction/sync', requirePermission('business:transaction:create'), (req, res, next) => transactionController.sync(req, res, next));

router.get('/customer/list', requirePermission('business:customer:query'), (req, res, next) => customerController.list(req, res, next));
router.get('/customer/all', requirePermission('business:customer:query'), (req, res, next) => customerController.all(req, res, next));
router.get('/customer/:id', requirePermission('business:customer:query'), (req, res, next) => customerController.detail(req, res, next));
router.post('/customer', requirePermission('business:customer:create'), (req, res, next) => customerController.create(req, res, next));
router.put('/customer/:id', requirePermission('business:customer:update'), (req, res, next) => customerController.update(req, res, next));
router.post('/customer/:id/status', requirePermission('business:customer:update'), (req, res, next) => customerController.updateStatus(req, res, next));
router.delete('/customer/:id', requirePermission('business:customer:delete'), (req, res, next) => customerController.delete(req, res, next));

router.get('/product/list', (req, res, next) => productController.list(req, res, next));
router.get('/product/:id', (req, res, next) => productController.detail(req, res, next));
router.post('/product', requirePermission('business:product:create'), (req, res, next) => productController.create(req, res, next));
router.put('/product/:id', requirePermission('business:product:update'), (req, res, next) => productController.update(req, res, next));
router.delete('/product/:id', requirePermission('business:product:delete'), (req, res, next) => productController.delete(req, res, next));

router.post('/opening/precheck', requireAuth, (req, res, next) => accountOpeningController.precheck(req, res));
router.post('/opening/trace', requireAuth, (req, res, next) => accountOpeningController.traceCheck(req, res));
router.get('/opening/list', requirePermission('business:opening:query'), (req, res, next) => accountOpeningController.list(req, res));
router.get('/opening/:id', requirePermission('business:opening:query'), (req, res, next) => accountOpeningController.detail(req, res));
router.post('/opening', requirePermission('business:opening:create'), (req, res, next) => accountOpeningController.create(req, res));
router.put('/opening/:id', requirePermission('business:opening:update'), (req, res, next) => accountOpeningController.update(req, res));
router.post('/opening/:id/cancel', requirePermission('business:opening:update'), (req, res, next) => accountOpeningController.cancel(req, res));
router.post('/opening/:id/review', requirePermission('business:opening:review'), (req, res, next) => accountOpeningController.review(req, res));
router.post('/opening/:id/open', requirePermission('business:opening:open'), (req, res, next) => accountOpeningController.openAccount(req, res));
router.post('/opening/:id/refresh', requirePermission('business:opening:query'), (req, res, next) => accountOpeningController.refresh(req, res));
router.post('/opening/batch/import', requirePermission('business:opening:create'), (req, res, next) => accountOpeningController.batchImport(req, res));
router.post('/opening/batch/review', requirePermission('business:opening:review'), (req, res, next) => accountOpeningController.batchReview(req, res));

router.get('/account/list', requirePermission('business:account:query'), (req, res, next) => accountOpeningController.accountList(req, res));
router.get('/account/:id', requirePermission('business:account:query'), (req, res, next) => accountOpeningController.accountDetail(req, res));
router.get('/account/customer/:customerId', requirePermission('business:account:query'), (req, res, next) => accountOpeningController.accountByCustomer(req, res));
router.post('/account/:id/status', requirePermission('business:account:update'), (req, res, next) => accountOpeningController.accountUpdateStatus(req, res));

router.get('/risk/evaluate/:transactionId', requireAuth, (req, res, next) => riskController.evaluateTransaction(req, res, next));
router.get('/risk/anomaly', requirePermission('risk:anomaly:query'), (req, res, next) => riskController.detectAnomaly(req, res, next));
router.get('/risk/violation/list', requirePermission('risk:violation:query'), (req, res, next) => riskController.violationList(req, res, next));
router.get('/risk/violation/:id', requirePermission('risk:violation:query'), (req, res, next) => riskController.violationDetail(req, res, next));
router.post('/risk/violation', requirePermission('risk:violation:create'), (req, res, next) => riskController.violationCreate(req, res, next));
router.post('/risk/violation/:id/handle', requirePermission('risk:violation:update'), (req, res, next) => riskController.violationHandle(req, res, next));
router.get('/risk/statistics', requirePermission('risk:violation:query'), (req, res, next) => riskController.statistics(req, res, next));

export default router;
