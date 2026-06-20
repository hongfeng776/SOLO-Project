import { Router } from 'express';
import { productController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/category-configs', productController.getCategoryConfigs);
router.get('/import-template', productController.getImportTemplate);

router.post('/validate', productController.validateProduct);
router.post('/check-duplicate', productController.checkDuplicate);

router.get('/', productController.getProductList);
router.get('/:id', productController.getProductDetail);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProductInfo);

router.post('/:id/submit-audit', productController.submitForAudit);
router.put('/:id/audit', productController.auditProduct);

router.put('/:id/list', productController.listProduct);
router.put('/:id/delist', productController.delistProduct);
router.put('/:id/offline', productController.offlineProduct);

router.post('/batch/import', productController.batchImport);
router.post('/batch/list', productController.batchList);

router.get('/:id/audit-logs', productController.getAuditLogs);
router.get('/:id/traceability', productController.getTraceability);

router.post('/process-expired', productController.processExpiredProducts);

router.get('/edit/field-config', productController.getEditFieldConfig);
router.post('/:id/edit/diff', productController.getFieldDiff);
router.put('/:id/edit', productController.updateProductInfo);
router.put('/:id/adjust-commission', productController.adjustCommission);
router.post('/batch/edit', productController.batchEdit);
router.get('/:id/edit-history', productController.getEditHistory);

router.get('/edit-approvals', productController.getEditApprovalList);
router.get('/edit-approvals/:approvalId', productController.getEditApprovalDetail);
router.put('/edit-approvals/:approvalId/approve', productController.approveEdit);
router.put('/edit-approvals/:approvalId/reject', productController.rejectEdit);

router.put('/:id/manual-list', productController.manualList);
router.put('/:id/manual-delist', productController.manualDelist);
router.get('/:id/delist-precondition', productController.checkDelistPrecondition);

router.post('/schedule-rules', productController.createScheduleRule);
router.put('/schedule-rules/:ruleId', productController.updateScheduleRule);
router.put('/schedule-rules/:ruleId/cancel', productController.cancelScheduleRule);
router.get('/schedule-rules', productController.getScheduleRuleList);
router.get('/schedule-rules/:ruleId', productController.getScheduleRuleDetail);
router.post('/schedule-rules/process', productController.processScheduleRules);

router.post('/batch/delist', productController.batchDelist);

router.get('/listing-history', productController.getListingHistory);
router.get('/:id/listing-stats', productController.getListingStats);

router.get('/risk/config', productController.getRiskConfig);
router.get('/risk/default-rules', productController.getDefaultRiskRules);

router.get('/risk/rules', productController.getRiskRuleList);
router.post('/risk/rules', productController.createRiskRule);
router.get('/risk/rules/:ruleId', productController.getRiskRuleDetail);
router.put('/risk/rules/:ruleId', productController.updateRiskRule);
router.put('/risk/rules/:ruleId/toggle', productController.toggleRiskRule);
router.delete('/risk/rules/:ruleId', productController.deleteRiskRule);

router.get('/risk/records', productController.getRiskRecordList);
router.get('/risk/records/:recordId', productController.getRiskRecordDetail);
router.put('/risk/records/:recordId/resolve', productController.resolveProductRisk);

router.get('/risk/statistics', productController.getRiskStatistics);
router.post('/risk/reset-daily', productController.resetDailyRiskData);

router.post('/:id/risk/check', productController.checkAndTriggerRisk);
router.post('/:id/risk/mark', productController.markProductRisk);
router.get('/:id/risk/status', productController.getProductRiskStatus);
router.get('/:id/risk/history', productController.getProductRiskHistory);

router.post('/risk/batch/scan', productController.batchScanRiskProducts);
router.post('/risk/batch/resolve', productController.batchResolveRisk);
router.post('/risk/batch/ban', productController.batchBanProducts);

export default router;
