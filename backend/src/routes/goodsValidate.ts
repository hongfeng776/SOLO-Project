import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import goodsValidateController from '../controllers/GoodsValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/validate-create', goodsValidateController.validateCreate);
router.get('/category-fields/:categoryId', goodsValidateController.getCategoryRequiredFields);
router.get('/check-sku', goodsValidateController.validateSkuUniqueness);
router.get('/check-brand-category', goodsValidateController.validateBrandCategoryCombo);

export default router;
