import { Router } from 'express';
import { promoterAuditController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/pre-check', promoterAuditController.preCheck);
router.post('/apply', promoterAuditController.submitApply);
router.get('/list', promoterAuditController.getAuditList);
router.get('/statistics', promoterAuditController.getStatistics);
router.get('/reject-reasons', promoterAuditController.getRejectReasons);
router.get('/logs', promoterAuditController.searchAuditLogs);
router.get('/:id', promoterAuditController.getAuditDetail);

router.put('/:id/first-pass', promoterAuditController.firstAuditPass);
router.put('/:id/first-reject', promoterAuditController.firstAuditReject);
router.put('/:id/second-pass', promoterAuditController.secondAuditPass);
router.put('/:id/second-reject', promoterAuditController.secondAuditReject);

router.post('/batch-first-pass', promoterAuditController.batchFirstPass);
router.post('/batch-second-pass', promoterAuditController.batchSecondPass);
router.post('/batch-first-reject', promoterAuditController.batchFirstReject);
router.post('/batch-second-reject', promoterAuditController.batchSecondReject);

export default router;
