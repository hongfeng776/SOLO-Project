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

export default router;
