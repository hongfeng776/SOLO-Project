import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  changeStatus,
  getStatusLogs,
} from '../controllers/ShopStatusController';

const router = Router();

router.use(authMiddleware);

router.post('/change', changeStatus);
router.get('/logs/:merchant_id', getStatusLogs);
router.get('/logs', getStatusLogs);

export default router;
