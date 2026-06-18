import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  validateDocumentFormat,
  validateDateRange,
  checkDuplicate,
  verifyWithIndustry,
  checkMaterialCompleteness,
  submitQualification,
  resubmitQualification,
  getQualificationList,
  getQualificationByMerchant,
} from '../controllers/MerchantQualificationController';

const router = Router();

router.use(authMiddleware);

router.post('/validate/document', validateDocumentFormat);
router.post('/validate/dateRange', validateDateRange);
router.post('/validate/duplicate', checkDuplicate);
router.post('/validate/industry', verifyWithIndustry);
router.post('/validate/completeness', checkMaterialCompleteness);

router.post('/submit', submitQualification);
router.post('/resubmit', resubmitQualification);

router.get('/list', getQualificationList);
router.get('/merchant/:merchant_id', getQualificationByMerchant);

export default router;
