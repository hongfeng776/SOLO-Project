import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getPaymentTrace,
  getPaymentTraceByOrderId,
  getPaymentTraceByFlowNo,
  getPaymentTraceByTransactionId,
  validatePaymentData,
  getReconcileList,
  getSettlementList,
  getRiskAlerts,
  getEnumNames,
} from '../controllers/PaymentTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/flow/:flowId', getPaymentTrace);
router.get('/order/:orderId', getPaymentTraceByOrderId);
router.get('/flow-no/:flowNo', getPaymentTraceByFlowNo);
router.get('/transaction/:transactionId', getPaymentTraceByTransactionId);
router.get('/validate/:flowId', validatePaymentData);
router.get('/reconciles/:flowId', getReconcileList);
router.get('/settlements/:flowId', getSettlementList);
router.get('/risk-alerts/:orderId', getRiskAlerts);
router.get('/enum-names', getEnumNames);

export default router;
