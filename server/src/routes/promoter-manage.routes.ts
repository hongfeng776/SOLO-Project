import { Router } from 'express';
import { promoterManageController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/level-configs', promoterManageController.getLevelConfigs);
router.get('/:id/detail', promoterManageController.getPromoterDetail);
router.get('/:id/change-logs', promoterManageController.getChangeLogs);
router.get('/:id/change-logs/:logId', promoterManageController.getChangeDiff);

router.post('/:id/check-permission', promoterManageController.checkEditPermission);
router.post('/validate-field', promoterManageController.validateField);
router.post('/check-uniqueness', promoterManageController.checkUniqueness);

router.put('/:id/info', promoterManageController.updatePromoterInfo);

router.post('/qualification/validate', promoterManageController.validateQualification);
router.post('/:id/qualification', promoterManageController.submitQualification);
router.put('/qualification/:qualificationId/review', promoterManageController.reviewQualification);

router.post('/batch/level', promoterManageController.batchUpdateLevel);
router.post('/batch/promote-status', promoterManageController.batchUpdatePromoteStatus);
router.post('/batch/settle-status', promoterManageController.batchUpdateSettleStatus);

export default router;
