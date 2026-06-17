import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import articleBatchController from '../controllers/ArticleBatchController';

const router = Router();

router.use(authMiddleware);

router.post('/batch-top', articleBatchController.batchTopArticles);
router.post('/batch-offline', articleBatchController.batchOfflineArticles);
router.post('/batch-assign-topic', articleBatchController.batchAssignTopic);
router.get('/operable-scope', articleBatchController.getOperableScope);
router.post('/advanced-filter', articleBatchController.advancedFilter);
router.post('/ability-list', articleBatchController.abilityList);

export default router;
