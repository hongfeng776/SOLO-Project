import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { channelGradeController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/rules', channelGradeController.getAllRules);
router.put('/rules', channelGradeController.saveLevelRule);
router.post('/validate-rule', channelGradeController.validateRuleParams);
router.post('/validate/:level', channelGradeController.validateThresholds);
router.post('/adjust-request', channelGradeController.requestManualAdjust);
router.put('/adjust-request/:id/review', channelGradeController.reviewAdjust);
router.get('/adjust-requests', channelGradeController.getAdjustRequests);
router.post('/batch-level', channelGradeController.batchAdjustLevels);
router.post('/batch-resource', channelGradeController.batchAdjustResources);
router.get('/statistics', channelGradeController.getStatistics);
router.get('/:channelId/change-logs', channelGradeController.getChangeLogs);

export default router;
