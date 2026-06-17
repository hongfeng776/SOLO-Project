import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import articleValidateController from '../controllers/ArticleValidateController';

const router = Router();

router.use(authMiddleware);

router.post('/validate-create', articleValidateController.validateCreate);
router.get('/channel-template/:channel', articleValidateController.getChannelTemplate);
router.post('/scan-sensitive', articleValidateController.scanSensitiveWords);
router.post('/check-image-resolution', articleValidateController.checkImageResolution);
router.post('/validate-links', articleValidateController.validateLinks);

export default router;
