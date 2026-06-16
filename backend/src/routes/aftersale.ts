import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getAfterSaleList,
  getAfterSaleDetail,
  createAfterSale,
  updateAfterSale,
  deleteAfterSale,
  batchDeleteAfterSale,
  updateAfterSaleStatus,
} from '../controllers/AfterSaleController';

const router = Router();

router.use(authMiddleware);

router.get('/list', getAfterSaleList);
router.get('/:id', getAfterSaleDetail);
router.post('/create', createAfterSale);
router.put('/:id', updateAfterSale);
router.delete('/:id', deleteAfterSale);
router.post('/batchDelete', batchDeleteAfterSale);
router.put('/:id/status', updateAfterSaleStatus);

export default router;
