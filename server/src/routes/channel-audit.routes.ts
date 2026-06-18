import { Router } from 'express';
import { channelAuditController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/pre-check', channelAuditController.preCheck);
router.post('/apply', channelAuditController.submitApply);
router.get('/', channelAuditController.findAll);
router.get('/statistics', channelAuditController.getStatistics);
router.get('/logs', channelAuditController.getAuditLogs);
router.get('/:id', channelAuditController.findById);

router.post('/:id/data-pass', channelAuditController.dataReviewPass);
router.post('/:id/data-reject', channelAuditController.dataReviewReject);
router.post('/:id/qualification-pass', channelAuditController.qualificationVerifyPass);
router.post('/:id/qualification-reject', channelAuditController.qualificationVerifyReject);
router.post('/:id/permission-pass', channelAuditController.permissionActivatePass);
router.post('/:id/permission-reject', channelAuditController.permissionActivateReject);

router.post('/batch/data-pass', channelAuditController.batchDataPass);
router.post('/batch/qualification-pass', channelAuditController.batchQualificationPass);
router.post('/batch/permission-pass', channelAuditController.batchPermissionPass);
router.post('/batch/data-reject', channelAuditController.batchDataReject);
router.post('/batch/qualification-reject', channelAuditController.batchQualificationReject);
router.post('/batch/permission-reject', channelAuditController.batchPermissionReject);

export default router;
