import { Router } from 'express';
import { TransactionController, ProductController, CustomerController, RiskController, AccountOpeningController, CorporateAccountOpeningController, OpeningReviewController, StatusFlowController, DepositController, LoanController, LoanApprovalController, LoanRepaymentController, SettlementController, CustomerProfileController, CorporateProfileController, CustomerTagController, CustomerPrivacyController } from '../controllers';
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
const loanApprovalController = new LoanApprovalController();
const loanRepaymentController = new LoanRepaymentController();
const settlementController = new SettlementController();
const customerProfileController = new CustomerProfileController();
const corporateProfileController = new CorporateProfileController();
const customerTagController = new CustomerTagController();
const customerPrivacyController = new CustomerPrivacyController();

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

// ========== 贷款审批流转管理 ==========
// 功能点1：审批前置校验
router.post('/loan/approval/precheck', requirePermission('loan:approval:precheck'), (req, res, next) => loanApprovalController.preCheck(req, res, next));
// 功能点1：审批详情（联动展示征信、负债、资料、预审结论）
router.get('/loan/approval/:id', requirePermission('loan:approval:query'), (req, res, next) => loanApprovalController.detail(req, res, next));
// 功能点2：执行审批（单级/多级审批）
router.post('/loan/approval/approve', requirePermission('loan:approval:submit'), (req, res, next) => loanApprovalController.approve(req, res, next));
// 功能点2：生成贷款合同
router.post('/loan/approval/contract', requirePermission('loan:approval:contract'), (req, res, next) => loanApprovalController.generateContract(req, res, next));
// 功能点3：待审批列表
router.get('/loan/approval/pending/list', requirePermission('loan:approval:query'), (req, res, next) => loanApprovalController.pendingList(req, res, next));
// 功能点3：批量审批
router.post('/loan/approval/batch', requirePermission('loan:approval:batch'), (req, res, next) => loanApprovalController.batchApprove(req, res, next));
// 功能点4：审批溯源查询
router.post('/loan/approval/trace', requirePermission('loan:approval:trace'), (req, res, next) => loanApprovalController.trace(req, res, next));

// ========== 贷后还款风控管理 ==========
// 功能点1：还款前置校验
router.post('/loan/repayment/precheck', requirePermission('loan:repayment:precheck'), (req, res, next) => loanRepaymentController.preCheck(req, res));
// 功能点1和2：还款详情（含账单、余额、逾期信息）
router.get('/loan/repayment/:id', requirePermission('loan:repayment:query'), (req, res, next) => loanRepaymentController.getDetail(req, res));
// 功能点2：执行还款（按期/提前/逾期/分期）
router.post('/loan/repayment', requirePermission('loan:repayment:submit'), (req, res, next) => loanRepaymentController.doRepayment(req, res));
// 功能点3：代扣列表
router.get('/loan/repayment/withhold/list', requirePermission('loan:repayment:withhold'), (req, res, next) => loanRepaymentController.getWithholdList(req, res));
// 功能点3：批量代扣
router.post('/loan/repayment/withhold/batch', requirePermission('loan:repayment:batch'), (req, res, next) => loanRepaymentController.batchWithhold(req, res));
// 功能点4：还款溯源
router.post('/loan/repayment/trace', requirePermission('loan:repayment:trace'), (req, res, next) => loanRepaymentController.traceRepayment(req, res));
// 生成代扣记录（定时任务用）
router.post('/loan/repayment/generate-withhold', requirePermission('loan:repayment:manage'), (req, res, next) => loanRepaymentController.generateWithholdRecords(req, res));

// ========== 支付结算模块 ==========
// 配置枚举
router.get('/settlement/config', requireAuth, (req, res, next) => settlementController.config(req, res, next));
// 前置校验
router.post('/settlement/precheck', requirePermission('business:settlement:create'), (req, res, next) => settlementController.preCheck(req, res, next));
// 列表查询
router.get('/settlement/list', requirePermission('business:settlement:query'), (req, res, next) => settlementController.list(req, res, next));
// 详情查询
router.get('/settlement/:id', requirePermission('business:settlement:query'), (req, res, next) => settlementController.detail(req, res, next));
// 创建转账
router.post('/settlement', requirePermission('business:settlement:create'), (req, res, next) => settlementController.create(req, res, next));
// 撤销转账
router.post('/settlement/:id/cancel', requirePermission('business:settlement:update'), (req, res, next) => settlementController.cancel(req, res, next));
// 复核转账
router.post('/settlement/:id/review', requirePermission('business:settlement:review'), (req, res, next) => settlementController.review(req, res, next));
// 创建批量转账
router.post('/settlement/batch', requirePermission('business:settlement:batch'), (req, res, next) => settlementController.batch(req, res, next));
// 批量列表
router.get('/settlement/batch/list', requirePermission('business:settlement:query'), (req, res, next) => settlementController.batchList(req, res, next));
// 批量详情
router.get('/settlement/batch/:id', requirePermission('business:settlement:query'), (req, res, next) => settlementController.batchDetail(req, res, next));
// 批量复核
router.post('/settlement/batch/:id/review', requirePermission('business:settlement:review'), (req, res, next) => settlementController.batchReview(req, res, next));
// 批量进度
router.get('/settlement/batch/:id/progress', requirePermission('business:settlement:query'), (req, res, next) => settlementController.batchProgress(req, res, next));
// 溯源查询
router.post('/settlement/trace', requirePermission('business:settlement:trace'), (req, res, next) => settlementController.trace(req, res, next));

// ========== 个人客户档案建档管控 ==========
// 功能点1：前置校验（证件有效性、人脸核验、信息完整性、公安备案校验）
router.post('/customer-profile/precheck', requireAuth, (req, res, next) => customerProfileController.precheck(req, res, next));
// 档案列表查询
router.get('/customer-profile/list', requirePermission('customer:profile:query'), (req, res, next) => customerProfileController.list(req, res, next));
// 档案详情
router.get('/customer-profile/:id', requirePermission('customer:profile:query'), (req, res, next) => customerProfileController.detail(req, res, next));
// 功能点1和2：新建客户档案（含等级自动判定）
router.post('/customer-profile', requirePermission('customer:profile:create'), (req, res, next) => customerProfileController.create(req, res, next));
// 更新档案信息
router.put('/customer-profile/:id', requirePermission('customer:profile:update'), (req, res, next) => customerProfileController.update(req, res, next));
// 档案变更日志
router.get('/customer-profile/:id/logs', requirePermission('customer:profile:query'), (req, res, next) => customerProfileController.logs(req, res, next));
// 功能点4：依托证件号码溯源客户历史建档、变更、销户记录
router.post('/customer-profile/trace', requirePermission('customer:profile:trace'), (req, res, next) => customerProfileController.trace(req, res, next));
// 功能点4：异常档案复核
router.post('/customer-profile/review-abnormal', requirePermission('customer:profile:review'), (req, res, next) => customerProfileController.reviewAbnormal(req, res, next));

// 功能点3：批量导入个人客户基础信息建档
router.post('/customer-profile/batch/import', requirePermission('customer:profile:batch'), (req, res, next) => customerProfileController.batchImport(req, res, next));
// 批量导入批次列表
router.get('/customer-profile/batch/list', requirePermission('customer:profile:batch'), (req, res, next) => customerProfileController.batchList(req, res, next));
// 批量导入明细列表
router.get('/customer-profile/batch/items', requirePermission('customer:profile:batch'), (req, res, next) => customerProfileController.batchItemList(req, res, next));

// ========== 对公客户信息运维路由 ==========
router.post('/corporate-profile/precheck', requireAuth, (req, res, next) => corporateProfileController.precheck(req, res, next));
router.post('/corporate-profile/adapt-type', requireAuth, (req, res, next) => corporateProfileController.adaptType(req, res, next));
router.get('/corporate-profile/list', requirePermission('corporate:profile:query'), (req, res, next) => corporateProfileController.list(req, res, next));
router.get('/corporate-profile/:id', requirePermission('corporate:profile:query'), (req, res, next) => corporateProfileController.detail(req, res, next));
router.post('/corporate-profile', requirePermission('corporate:profile:create'), (req, res, next) => corporateProfileController.create(req, res, next));
router.put('/corporate-profile/:id', requirePermission('corporate:profile:update'), (req, res, next) => corporateProfileController.update(req, res, next));
router.get('/corporate-profile/:id/logs', requirePermission('corporate:profile:query'), (req, res, next) => corporateProfileController.logs(req, res, next));
router.post('/corporate-profile/trace', requirePermission('corporate:profile:trace'), (req, res, next) => corporateProfileController.trace(req, res, next));
router.post('/corporate-profile/review-abnormal', requirePermission('corporate:profile:review'), (req, res, next) => corporateProfileController.reviewAbnormal(req, res, next));
router.post('/corporate-profile/batch/update', requirePermission('corporate:profile:batch'), (req, res, next) => corporateProfileController.batchUpdate(req, res, next));
router.get('/corporate-profile/batch/list', requirePermission('corporate:profile:batch'), (req, res, next) => corporateProfileController.batchList(req, res, next));
router.get('/corporate-profile/batch/items', requirePermission('corporate:profile:batch'), (req, res, next) => corporateProfileController.batchItemList(req, res, next));

// ========== 客户等级标签管理路由 ==========
router.post('/customer-tag/precheck', requireAuth, (req, res, next) => customerTagController.precheck(req, res, next));
router.post('/customer-tag/adapt', requireAuth, (req, res, next) => customerTagController.adaptTag(req, res, next));
router.get('/customer-tag/list', requirePermission('customer:tag:query'), (req, res, next) => customerTagController.list(req, res, next));
router.get('/customer-tag/:id', requirePermission('customer:tag:query'), (req, res, next) => customerTagController.detail(req, res, next));
router.post('/customer-tag', requirePermission('customer:tag:create'), (req, res, next) => customerTagController.create(req, res, next));
router.put('/customer-tag/:id', requirePermission('customer:tag:update'), (req, res, next) => customerTagController.update(req, res, next));
router.post('/customer-tag/adjust', requirePermission('customer:tag:update'), (req, res, next) => customerTagController.adjust(req, res, next));
router.delete('/customer-tag/:id', requirePermission('customer:tag:update'), (req, res, next) => customerTagController.remove(req, res, next));
router.get('/customer-tag/:id/logs', requirePermission('customer:tag:query'), (req, res, next) => customerTagController.logs(req, res, next));
router.post('/customer-tag/trace', requirePermission('customer:tag:trace'), (req, res, next) => customerTagController.trace(req, res, next));
router.post('/customer-tag/batch', requirePermission('customer:tag:batch'), (req, res, next) => customerTagController.batchUpdate(req, res, next));
router.get('/customer-tag/batch/list', requirePermission('customer:tag:batch'), (req, res, next) => customerTagController.batchList(req, res, next));
router.get('/customer-tag/batch/items', requirePermission('customer:tag:batch'), (req, res, next) => customerTagController.batchItemList(req, res, next));

// ========== 客户信息隐私防护路由 ==========
// 功能点1：前置校验
router.post('/customer-privacy/precheck', requireAuth, (req, res, next) => customerPrivacyController.precheck(req, res, next));
router.post('/customer-privacy/view', requirePermission('customer:privacy:query'), (req, res, next) => customerPrivacyController.viewCustomer(req, res, next));
router.post('/customer-privacy/export', requirePermission('customer:privacy:export'), (req, res, next) => customerPrivacyController.exportCustomer(req, res, next));

// 功能点2：场景适配
router.post('/customer-privacy/adapt-scene', requireAuth, (req, res, next) => customerPrivacyController.adaptScene(req, res, next));

// 功能点3：隐私规则管理
router.get('/customer-privacy/rule/list', requirePermission('customer:privacy:config'), (req, res, next) => customerPrivacyController.ruleList(req, res, next));
router.get('/customer-privacy/rule/:id', requirePermission('customer:privacy:config'), (req, res, next) => customerPrivacyController.ruleDetail(req, res, next));
router.post('/customer-privacy/rule', requirePermission('customer:privacy:config'), (req, res, next) => customerPrivacyController.createRule(req, res, next));
router.put('/customer-privacy/rule/:id', requirePermission('customer:privacy:config'), (req, res, next) => customerPrivacyController.updateRule(req, res, next));
router.delete('/customer-privacy/rule/:id', requirePermission('customer:privacy:config'), (req, res, next) => customerPrivacyController.deleteRule(req, res, next));

// 功能点3：批量配置
router.post('/customer-privacy/batch-config', requirePermission('customer:privacy:config'), (req, res, next) => customerPrivacyController.batchConfig(req, res, next));

// 功能点4：操作日志与溯源
router.get('/customer-privacy/log/list', requirePermission('customer:privacy:trace'), (req, res, next) => customerPrivacyController.logList(req, res, next));
router.get('/customer-privacy/log/:id', requirePermission('customer:privacy:trace'), (req, res, next) => customerPrivacyController.logDetail(req, res, next));
router.post('/customer-privacy/trace', requirePermission('customer:privacy:trace'), (req, res, next) => customerPrivacyController.trace(req, res, next));

export default router;
