import { Router } from 'express';
import marketingProductAdmissionController from '../controllers/MarketingProductAdmissionController';

const router = Router();

router.post('/validate/apply', marketingProductAdmissionController.validateApply);
router.post('/apply', marketingProductAdmissionController.applyGoods);
router.post('/audit-pass/:id', marketingProductAdmissionController.auditPass);
router.post('/audit-reject/:id', marketingProductAdmissionController.auditReject);
router.post('/offline/:id', marketingProductAdmissionController.offlineProduct);
router.post('/online/:id', marketingProductAdmissionController.onlineProduct);
router.delete('/remove/:id', marketingProductAdmissionController.removeProduct);
router.post('/check-duplicate', marketingProductAdmissionController.checkDuplicateApply);

export default router;
