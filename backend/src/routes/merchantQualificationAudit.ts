import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import MerchantQualificationAuditController from '../controllers/MerchantQualificationAuditController';

const router = Router();

router.use(authMiddleware);

router.get('/merchant/list', MerchantQualificationAuditController.getSettleMerchantList);
router.get('/merchant/:merchant_id/detail', MerchantQualificationAuditController.getAuditDetail);
router.post('/approve', MerchantQualificationAuditController.approveAudit);
router.post('/reject', MerchantQualificationAuditController.rejectAudit);
router.post('/review', MerchantQualificationAuditController.reviewQualification);
router.post('/processExpired', MerchantQualificationAuditController.processExpiredQualifications);

export default router;
