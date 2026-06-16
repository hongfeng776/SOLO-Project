import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getMerchantList,
  getMerchantDetail,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  batchDeleteMerchant,
  updateMerchantStatus,
} from '../controllers/MerchantController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getMerchantList);
router.get('/:id', getMerchantDetail);
router.post('/create', createMerchant);
router.put('/:id', updateMerchant);
router.delete('/:id', deleteMerchant);
router.post('/batchDelete', batchDeleteMerchant);
router.put('/:id/status', updateMerchantStatus);

export default router;
