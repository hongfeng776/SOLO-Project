import { Router } from 'express';
import { TransactionController, ProductController, CustomerController, RiskController, AccountOpeningController, CorporateAccountOpeningController, OpeningReviewController, StatusFlowController, DepositController, LoanController } from '../controllers';
import { requirePermission, requireAuth } from '../middlewares';

const router = Router();
const transactionController = new TransactionController();
const productController = new ProductController();
const customerController = new CustomerController();
const riskController = new RiskController();
const accountOpeningController = new AccountOpeningController();
const corporateOpeningController = new CorporateAccountOpeningController();
const openingReviewController = new OpeningReviewController();
const statusFlowController = new StatusFlowController();
const depositController = new DepositController();
const loanController = new LoanController();

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

router.get('/corporate/config', requireAuth, (req, res, next) => corporateOpeningController.getConfig(req, res));
router.post('/corporate/precheck', requireAuth, (req, res, next) => corporateOpeningController.precheck(req, res));
router.post('/corporate/trace', requireAuth, (req, res, next) => corporateOpeningController.traceCheck(req, res));
router.get('/corporate/list', requirePermission('business:corporate:query'), (req, res, next) => corporateOpeningController.list(req, res));
router.get('/corporate/:id', requirePermission('business:corporate:query'), (req, res, next) => corporateOpeningController.detail(req, res));
router.post('/corporate', requirePermission('business:corporate:create'), (req, res, next) => corporateOpeningController.create(req, res));
router.put('/corporate/:id', requirePermission('business:corporate:update'), (req, res, next) => corporateOpeningController.update(req, res));
router.post('/corporate/:id/cancel', requirePermission('business:corporate:update'), (req, res, next) => corporateOpeningController.cancel(req, res));
router.post('/corporate/:id/review', requirePermission('business:corporate:review'), (req, res, next) => corporateOpeningController.review(req, res));
router.post('/corporate/:id/open', requirePermission('business:corporate:open'), (req, res, next) => corporateOpeningController.openAccount(req, res));
router.post('/corporate/:id/refresh', requirePermission('business:corporate:query'), (req, res, next) => corporateOpeningController.refresh(req, res));
router.post('/corporate/batch/import', requirePermission('business:corporate:create'), (req, res, next) => corporateOpeningController.batchImport(req, res));
router.post('/corporate/batch/review', requirePermission('business:corporate:review'), (req, res, next) => corporateOpeningController.batchReview(req, res));

// ========== 开户资料审核 ==========
// 功能点1：前置校验 + 详情
router.get('/opening/review/precheck', requireAuth, (req, res, next) => openingReviewController.preconditions(req, res));
router.get('/opening/review/list', requirePermission('opening:review:query'), (req, res, next) => openingReviewController.getList(req, res));
router.get('/opening/review/detail', requirePermission('opening:review:query'), (req, res, next) => openingReviewController.getDetail(req, res));

// 功能点2：提交审核（单条）
router.post('/opening/review/submit', requirePermission('opening:review:submit'), (req, res, next) => openingReviewController.submitReview(req, res));

// 功能点3：批量审核（权限控制更严）
router.post('/opening/review/batch', requirePermission('opening:review:batch'), (req, res, next) => openingReviewController.batchReview(req, res));

// 功能点4：溯源查询
router.post('/opening/review/trace', requirePermission('opening:review:trace'), (req, res, next) => openingReviewController.trace(req, res));

// 配置枚举
router.get('/opening/review/config', requireAuth, (req, res, next) => openingReviewController.getConfig(req, res));

// ========== 开户状态流转管控 ==========
router.get('/status-flow/config', requireAuth, (req, res, next) => statusFlowController.getStatusConfig(req, res));
router.post('/status-flow/check', requireAuth, (req, res, next) => statusFlowController.checkTransition(req, res));
router.post('/status-flow/execute', requirePermission('status:flow:operate'), (req, res, next) => statusFlowController.executeTransition(req, res));
router.get('/status-flow/list', requirePermission('status:flow:query'), (req, res, next) => statusFlowController.getFlowList(req, res));
router.post('/status-flow/batch', requirePermission('status:flow:batch'), (req, res, next) => statusFlowController.batchOperation(req, res));
router.post('/status-flow/trace', requirePermission('status:flow:trace'), (req, res, next) => statusFlowController.traceStatusChange(req, res));

// ========== 存款业务办理管控 ==========
// 配置枚举
router.get('/deposit/config', requireAuth, (req, res, next) => depositController.config(req, res, next));
// 前置校验
router.post('/deposit/precheck', requirePermission('business:deposit:create'), (req, res, next) => depositController.preCheck(req, res, next));
// 列表查询
router.get('/deposit/list', requirePermission('business:deposit:query'), (req, res, next) => depositController.list(req, res, next));
// 详情查询
router.get('/deposit/:id', requirePermission('business:deposit:query'), (req, res, next) => depositController.detail(req, res, next));
// 办理存款
router.post('/deposit', requirePermission('business:deposit:create'), (req, res, next) => depositController.create(req, res, next));
// 撤销存款
router.post('/deposit/:id/cancel', requirePermission('business:deposit:update'), (req, res, next) => depositController.cancel(req, res, next));
// 确认入账
router.post('/deposit/:id/confirm', requirePermission('business:deposit:confirm'), (req, res, next) => depositController.confirm(req, res, next));
// 批量存款
router.post('/deposit/batch', requirePermission('business:deposit:batch'), (req, res, next) => depositController.batch(req, res, next));
// 批量审核
router.post('/deposit/batch/review', requirePermission('business:deposit:review'), (req, res, next) => depositController.batchReview(req, res, next));
// 溯源查询
router.post('/deposit/trace', requirePermission('business:deposit:trace'), (req, res, next) => depositController.trace(req, res, next));

// ========== 贷款申请受理管控 ==========
// 配置枚举
router.get('/loan/config', requireAuth, (req, res, next) => loanController.config(req, res, next));
// 前置校验
router.post('/loan/precheck', requirePermission('business:loan:create'), (req, res, next) => loanController.preCheck(req, res, next));
// 列表查询
router.get('/loan/list', requirePermission('business:loan:query'), (req, res, next) => loanController.list(req, res, next));
// 详情查询
router.get('/loan/:id', requirePermission('business:loan:query'), (req, res, next) => loanController.detail(req, res, next));
// 申请贷款
router.post('/loan', requirePermission('business:loan:create'), (req, res, next) => loanController.create(req, res, next));
// 撤销申请
router.post('/loan/:id/cancel', requirePermission('business:loan:update'), (req, res, next) => loanController.cancel(req, res, next));
// 预审
router.post('/loan/:id/preapprove', requirePermission('business:loan:preapprove'), (req, res, next) => loanController.preApprove(req, res, next));
// 终审
router.post('/loan/:id/finalapprove', requirePermission('business:loan:finalapprove'), (req, res, next) => loanController.finalApprove(req, res, next));
// 批量预审校验
router.post('/loan/batch/precheck', requirePermission('business:loan:batch'), (req, res, next) => loanController.batchPreCheck(req, res, next));
// 批量贷款申请
router.post('/loan/batch', requirePermission('business:loan:batch'), (req, res, next) => loanController.batch(req, res, next));
// 批量复核
router.post('/loan/batch/review', requirePermission('business:loan:review'), (req, res, next) => loanController.batchReview(req, res, next));
// 溯源查询
router.post('/loan/trace', requirePermission('business:loan:trace'), (req, res, next) => loanController.trace(req, res, next));

export default router;
