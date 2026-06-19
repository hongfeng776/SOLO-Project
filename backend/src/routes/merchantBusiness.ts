import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getBusinessDataList,
  getBusinessDataDetail,
  autoCalculateBusinessData,
  manualCreateBusinessData,
  validateStatPeriod,
  validateDataConsistency,
  validateAll,
  checkDuplicateStat,
} from '../controllers/MerchantBusinessController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getBusinessDataList);
router.get('/detail/:id', getBusinessDataDetail);
router.post('/autoCalculate', autoCalculateBusinessData);
router.post('/manualCreate', manualCreateBusinessData);
router.get('/validate/statPeriod', validateStatPeriod);
router.post('/validate/dataConsistency', validateDataConsistency);
router.post('/validate/all', validateAll);
router.get('/validate/duplicateStat', checkDuplicateStat);

export default router;
