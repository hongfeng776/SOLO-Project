import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getAfterSaleTrace,
  getAfterSaleTraceByOrderId,
  getAfterSaleTraceByNo,
  validateAfterSaleData,
  getOperationLogs,
  getLedger,
} from '../controllers/AfterSaleTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/:afterSaleId', getAfterSaleTrace);
router.get('/order/:orderId', getAfterSaleTraceByOrderId);
router.get('/no/:afterSaleNo', getAfterSaleTraceByNo);
router.get('/validate/:afterSaleId', validateAfterSaleData);
router.get('/logs/:afterSaleId', getOperationLogs);
router.get('/ledger/:afterSaleId', getLedger);

export default router;
