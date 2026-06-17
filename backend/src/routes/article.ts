import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import articleController from '../controllers/ArticleController';

const router = Router();

router.use(authMiddleware);

router.get('/list', articleController.getArticleList);
router.get('/detail/:id', articleController.getArticleDetail);
router.get('/code/:code', articleController.getArticleByCode);
router.post('/create', articleController.createArticle);
router.put('/update/:id', articleController.updateArticle);
router.delete('/delete/:id', articleController.deleteArticle);
router.post('/batch-delete', articleController.batchDeleteArticles);
router.put('/status/:id', articleController.updateArticleStatus);

export default router;
