import { Router } from 'express';
import jobController from '../controllers/job.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, jobController.getList);
router.get('/:id', authMiddleware, jobController.getDetail);
router.post('/', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.create);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.update);
router.delete('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.remove);
router.post('/batch-remove', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchRemove);

router.put('/:id/submit-audit', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.submitAudit);
router.put('/:id/approve', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.approve);
router.put('/:id/reject', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.reject);

router.put('/:id/publish', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.publish);
router.put('/:id/close', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.close);

router.post('/batch-create', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchCreate);
router.post('/batch-submit-audit', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchSubmitAudit);
router.post('/batch-approve', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.batchApprove);

router.get('/:id/operation-logs', authMiddleware, jobController.getOperationLogs);
router.get('/:id/validate-submit', authMiddleware, jobController.validateForSubmit);
router.get('/pre-check/:companyId', authMiddleware, jobController.getPreCheckInfo);
router.get('/batch-fill/config', authMiddleware, jobController.getBatchFillConfig);

router.get('/:id/edit-permission', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.checkEditPermission);
router.put('/:id/update-job', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.updateJob);
router.put('/:id/approve-change', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.approveChange);
router.put('/:id/reject-change', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.rejectChange);
router.put('/:id/cancel-change', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.cancelChange);
router.get('/:id/version-diff', authMiddleware, jobController.getVersionDiff);
router.get('/:id/edit-history', authMiddleware, jobController.getEditHistory);
router.post('/batch-update', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchUpdate);
router.put('/:id/rollback', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.rollbackVersion);
router.post('/calculate-match-weight', authMiddleware, jobController.calculateMatchWeight);
router.post('/validate-industry-norm', authMiddleware, jobController.validateIndustryNorm);

router.get('/:id/online-permission', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.checkOnlinePermission);
router.get('/:id/offline-permission', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.checkOfflinePermission);
router.put('/:id/online', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.onlineJob);
router.put('/:id/offline', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.offlineJob);

router.post('/batch-online', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchOnline);
router.post('/batch-offline', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), jobController.batchOffline);

router.get('/:id/online-offline-history', authMiddleware, jobController.getOnlineOfflineHistory);
router.put('/:id/risk-warning', authMiddleware, roleMiddleware(UserRole.ADMIN), jobController.updateRiskWarning);
router.get('/stats/online-offline', authMiddleware, jobController.getOnlineOfflineStats);

export default router;
