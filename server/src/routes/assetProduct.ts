import { Router } from 'express';
import * as assetProductController from '@controllers/AssetProductController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('product:view'), assetProductController.getProductList);
router.get('/code/:productCode', checkPermission('product:view'), assetProductController.getProductByCode);
router.get('/:id', checkPermission('product:view'), assetProductController.getProductById);
router.post('/', checkPermission('product:manage'), assetProductController.createProduct);
router.put('/:id', checkPermission('product:manage'), assetProductController.updateProduct);
router.delete('/:id', checkPermission('product:manage'), assetProductController.deleteProduct);

export default router;
