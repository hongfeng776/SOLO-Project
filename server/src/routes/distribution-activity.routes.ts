import { Router } from 'express';
import { distributionActivityController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', distributionActivityController.createActivity);
router.get('/type-options', distributionActivityController.getMarketingTypeOptions);
router.get('/reward-rule-options', distributionActivityController.getRewardRuleTypeOptions);
router.get('/threshold-options', distributionActivityController.getParticipationThresholdOptions);
router.get('/check-time-conflict', distributionActivityController.checkTimeConflict);
router.get('/submit-token', distributionActivityController.getSubmitToken);
router.post('/validate-reward-rule', distributionActivityController.validateRewardRule);
router.post('/preview-reward', distributionActivityController.previewActivityReward);
router.post('/batch-copy-templates', distributionActivityController.batchCopyTemplates);
router.post('/batch-create-similar', distributionActivityController.batchCreateSimilar);
router.post('/batch-update-times', distributionActivityController.batchUpdateActivityTimes);
router.patch('/:id/sort', distributionActivityController.updateActivitySort);
router.post('/batch-update-sorts', distributionActivityController.batchUpdateSorts);
router.get('/templates', distributionActivityController.getTemplateList);
router.get('/:id/operation-logs', distributionActivityController.getActivityOperationLogs);
router.post('/:id/validate', distributionActivityController.validateActivity);
router.post('/validate', distributionActivityController.validateActivity);
router.get('/:id', distributionActivityController.getActivityDetail);
router.put('/:id', distributionActivityController.updateActivity);

export default router;
