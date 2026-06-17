import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import categoryValidateController from '../controllers/CategoryValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/validate-create', categoryValidateController.validateCreate);
router.get('/can-submit-create', categoryValidateController.canSubmitCreate);
router.get('/qualification-rules', categoryValidateController.getLevelQualificationRules);
router.get('/check-code', categoryValidateController.checkCodeUnique);
router.get('/check-name', categoryValidateController.checkNameUnique);

export default router;
