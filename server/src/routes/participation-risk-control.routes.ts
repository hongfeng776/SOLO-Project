import { Router } from 'express';
import { participationRiskControlController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/check-eligibility', participationRiskControlController.checkEligibility);
router.post('/register', participationRiskControlController.registerParticipation);
router.get('/:marketingId/stats', participationRiskControlController.getParticipationStats);
router.get('/:marketingId/detect-anomalies', participationRiskControlController.detectAnomalies);
router.get('/:marketingId/list', participationRiskControlController.getParticipationList);
router.post('/batch-approve', participationRiskControlController.batchApprove);
router.post('/batch-revoke', participationRiskControlController.batchRevoke);
router.post('/:id/approve', participationRiskControlController.approveParticipation);
router.post('/:id/reject', participationRiskControlController.rejectParticipation);
router.post('/:id/flag-anomaly', participationRiskControlController.flagAnomaly);
router.post('/:id/restrict', participationRiskControlController.restrictUser);
router.post('/:id/resolve-anomaly', participationRiskControlController.resolveAnomaly);
router.get('/:id/detail', participationRiskControlController.getParticipationDetail);
router.get('/:id/logs', participationRiskControlController.getParticipationLogs);
router.post('/:id/verify', participationRiskControlController.verifyAuthenticity);
router.post('/:id/block-fake', participationRiskControlController.blockFakeParticipation);

export default router;
