import { Router } from 'express';
import { activityLifecycleController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/validate-transition', activityLifecycleController.validateTransition);
router.post('/check-edit-permission', activityLifecycleController.checkEditPermission);
router.post('/validate-compliance', activityLifecycleController.validateCompliance);
router.get('/report', activityLifecycleController.generateReport);
router.post('/batch-pause-expired', activityLifecycleController.batchPauseExpired);
router.post('/batch-cancel-not-started', activityLifecycleController.batchCancelNotStarted);
router.post('/batch-end-expired', activityLifecycleController.batchEndExpired);
router.get('/:id/participation-data', activityLifecycleController.getParticipationData);
router.get('/:id/check-pause', activityLifecycleController.checkPausePreconditions);
router.get('/:id/check-resume', activityLifecycleController.checkResumePreconditions);
router.post('/:id/pause', activityLifecycleController.pauseActivity);
router.post('/:id/resume', activityLifecycleController.resumeActivity);
router.get('/:id/status-change-logs', activityLifecycleController.getStatusChangeLogs);

export default router;
