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

export default router;
