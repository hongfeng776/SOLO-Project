import { Router } from 'express';
import { TransactionController, ProductController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const transactionController = new TransactionController();
const productController = new ProductController();

router.get('/channel/list', requirePermission('business:channel:query'), (req, res, next) => productController.channelList(req, res, next));

router.get('/transaction/list', requirePermission('business:transaction:query'), (req, res, next) => transactionController.list(req, res, next));
router.get('/transaction/:id', requirePermission('business:transaction:query'), (req, res, next) => transactionController.detail(req, res, next));

router.get('/product/list', (req, res, next) => productController.list(req, res, next));
router.get('/product/:id', (req, res, next) => productController.detail(req, res, next));
router.post('/product', requirePermission('business:product:create'), (req, res, next) => productController.create(req, res, next));
router.put('/product/:id', requirePermission('business:product:update'), (req, res, next) => productController.update(req, res, next));
router.delete('/product/:id', requirePermission('business:product:delete'), (req, res, next) => productController.delete(req, res, next));

export default router;
