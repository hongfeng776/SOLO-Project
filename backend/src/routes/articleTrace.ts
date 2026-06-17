import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import articleTraceController from '../controllers/ArticleTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/full-trace/:id', articleTraceController.getArticleFullTrace);
router.post('/check-duplicate', articleTraceController.checkDuplicate);
router.get('/quality-report/:id', articleTraceController.validateQuality);

export default router;
