import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import articleEditorController from '../controllers/ArticleEditorController';

const router = Router();

router.use(authMiddleware);

router.get('/edit-mode/:id', articleEditorController.getEditMode);
router.put('/incremental/:id', articleEditorController.incrementalEdit);
router.put('/full/:id', articleEditorController.fullEdit);
router.put('/draft/:id', articleEditorController.draftSave);
router.post('/submit-review/:id/:version', articleEditorController.submitReview);

export default router;
