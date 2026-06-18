import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getLogisticsTraceByOrderId,
  getLogisticsTraceByShipmentId,
  getLogisticsTraceByLogisticsNo,
  validateLogisticsData,
  checkLogisticsMatch,
  getLogisticsTracks,
  getAbnormalLogs,
} from '../controllers/LogisticsTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/order/:orderId', getLogisticsTraceByOrderId);
router.get('/shipment/:shipmentId', getLogisticsTraceByShipmentId);
router.get('/no/:logisticsNo', getLogisticsTraceByLogisticsNo);
router.get('/validate/:orderId', validateLogisticsData);
router.get('/match/:orderId', checkLogisticsMatch);
router.get('/tracks/:shipmentId', getLogisticsTracks);
router.get('/abnormal/:shipmentId', getAbnormalLogs);

export default router;
