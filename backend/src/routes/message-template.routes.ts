import { Router } from 'express';
import messageTemplateController from '../controllers/message-template.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, messageTemplateController.getList);
router.get('/scene-configs', authMiddleware, messageTemplateController.getSceneConfigs);
router.get('/enabled/scene/:scene', authMiddleware, messageTemplateController.getEnabledByScene);
router.get('/:id', authMiddleware, messageTemplateController.getDetail);
router.post('/validate', authMiddleware, messageTemplateController.validateTemplate);
router.post('/:id/check-duplicate', authMiddleware, messageTemplateController.checkDuplicate);
router.post('/', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.update);
router.put('/:id/enable', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.enable);
router.put('/:id/disable', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.disable);
router.put('/:id/testing', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.setTesting);
router.post('/:id/test', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.testTemplate);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.delete);
router.post('/batch/enable', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.batchEnable);
router.post('/batch/disable', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.batchDisable);
router.post('/batch/standardize', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.batchStandardize);
router.post('/batch/adjust-weight', authMiddleware, roleMiddleware(UserRole.ADMIN), messageTemplateController.batchAdjustWeight);
router.get('/change-logs/list', authMiddleware, messageTemplateController.getTemplateLogs);
router.get('/:templateId/change-logs', authMiddleware, messageTemplateController.getTemplateLogsByTemplateId);

export default router;
