import { Router } from 'express';
import * as customerAssetController from '@controllers/CustomerAssetController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('customer:view'), customerAssetController.getCustomerList);
router.get('/list', checkPermission('customer:view'), customerAssetController.getCustomerSimpleList);
router.get('/:id', checkPermission('customer:view'), customerAssetController.getCustomerById);
router.post('/', checkPermission('customer:manage'), customerAssetController.createCustomer);
router.put('/:id', checkPermission('customer:manage'), customerAssetController.updateCustomer);
router.delete('/:id', checkPermission('customer:manage'), customerAssetController.deleteCustomer);

export default router;
