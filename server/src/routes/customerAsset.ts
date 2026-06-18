import { Router } from 'express';
import * as customerAssetController from '@controllers/CustomerAssetController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('customer:view'), customerAssetController.getCustomerList);
router.get('/list', checkPermission('customer:view'), customerAssetController.getCustomerSimpleList);
router.get('/export', checkPermission('customer:export'), customerAssetController.exportList);
router.get('/:id', checkPermission('customer:view'), customerAssetController.getCustomerById);
router.get('/:id/audit-trail', checkPermission('customer:view'), customerAssetController.getCustomerAuditTrail);
router.post('/', checkPermission('customer:manage'), customerAssetController.createCustomer);
router.post('/validate', checkPermission('customer:manage'), customerAssetController.validateCustomerData);
router.post('/check-preconditions', checkPermission('customer:manage'), customerAssetController.checkPreconditions);
router.post('/batch-import', checkPermission('customer:manage'), customerAssetController.batchImport);
router.put('/:id', checkPermission('customer:manage'), customerAssetController.updateCustomer);
router.put('/:id/convert-formal', checkPermission('customer:manage'), customerAssetController.convertToFormal);
router.put('/batch-freeze', checkPermission('customer:manage'), customerAssetController.batchFreeze);
router.delete('/:id', checkPermission('customer:manage'), customerAssetController.deleteCustomer);

export default router;
