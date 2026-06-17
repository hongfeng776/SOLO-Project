import { Router } from 'express';
import recruitmentConfigController from '../controllers/recruitment-config.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, recruitmentConfigController.getList);
router.get('/:id', authMiddleware, recruitmentConfigController.getDetail);
router.get('/company/:companyId', authMiddleware, recruitmentConfigController.getByCompanyId);
router.get('/company/:companyId/completeness', authMiddleware, recruitmentConfigController.checkInfoCompleteness);
router.get('/matching/tags', authMiddleware, recruitmentConfigController.getMatchingTags);
router.get('/matching/welfare-by-industry', authMiddleware, recruitmentConfigController.getMatchingWelfareByIndustry);
router.post('/validate', authMiddleware, recruitmentConfigController.validateConfig);
router.post('/:id/check-duplicate', authMiddleware, recruitmentConfigController.checkDuplicate);
router.post('/company/:companyId', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.update);
router.put('/:id/enable', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.enable);
router.put('/:id/disable', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.disable);
router.post('/batch/enable', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.batchEnable);
router.post('/batch/disable', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.batchDisable);
router.post('/batch/replace-welfare', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), recruitmentConfigController.batchReplaceWelfare);
router.get('/change-logs/list', authMiddleware, recruitmentConfigController.getConfigLogs);
router.get('/:configId/change-logs', authMiddleware, recruitmentConfigController.getConfigLogsByConfigId);

export default router;
