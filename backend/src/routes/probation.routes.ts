import { Router } from 'express';
import probationController from '../controllers/probation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/list', authMiddleware, probationController.getList);
router.get('/expiring', authMiddleware, probationController.getExpiringList);
router.get('/prerequisites/check', authMiddleware, probationController.checkPrerequisites);
router.get('/default-matching', authMiddleware, probationController.getDefaultMatching);
router.get('/stats/pass-rate', authMiddleware, probationController.getPassRateReport);

router.get('/:id', authMiddleware, probationController.getById);
router.get('/:id/detail', authMiddleware, probationController.getDetail);

router.post('/validate-duration', authMiddleware, probationController.validateDuration);
router.post('/', authMiddleware, probationController.createProbation);
router.post('/batch/set-assessments', authMiddleware, probationController.batchSetAssessments);
router.post('/batch/update-status', authMiddleware, probationController.batchUpdateStatus);
router.post('/sync-status', authMiddleware, probationController.syncExpiringStatus);

router.put('/:id/duration', authMiddleware, probationController.updateDuration);
router.put('/:id/assessments', authMiddleware, probationController.setAssessments);
router.put('/:id/pass', authMiddleware, probationController.passProbation);
router.put('/:id/fail', authMiddleware, probationController.failProbation);
router.put('/:id/extend', authMiddleware, probationController.extendProbation);

export default router;
