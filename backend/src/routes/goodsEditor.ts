import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import goodsEditorController from '../controllers/GoodsEditorController';

const router = Router();

router.use(authMiddleware);

router.get('/editable-fields/:id', goodsEditorController.getEditableFields);
router.get('/field-config/:id', goodsEditorController.getEditFieldConfig);
router.put('/edit/:id', goodsEditorController.executeEdit);

export default router;
