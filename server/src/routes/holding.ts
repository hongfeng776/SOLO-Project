import { Router } from 'express';
import * as customerHoldingController from '@controllers/CustomerHoldingController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('holding:view'), customerHoldingController.getHoldingList);
router.get('/customer/:customerId', checkPermission('holding:view'), customerHoldingController.getHoldingsByCustomerId);

export default router;
