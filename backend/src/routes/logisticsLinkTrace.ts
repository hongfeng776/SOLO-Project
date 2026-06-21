import { Router } from 'express';
import logisticsLinkTraceController from '../controllers/LogisticsLinkTraceController';

const router = Router();

router.get('/full-trace/:shipment_id', logisticsLinkTraceController.getFullLinkTrace);
router.post('/check-duplicate', logisticsLinkTraceController.checkDuplicateNode);
router.post('/check-fake', logisticsLinkTraceController.checkFakeTrack);
router.post('/verify-node', logisticsLinkTraceController.verifyNode);
router.post('/add-extension', logisticsLinkTraceController.addNodeExtension);

export default router;
