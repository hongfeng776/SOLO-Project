import { Router } from 'express';
import * as replayController from '@controllers/ReplayController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

const perm = checkPermission('stock:replay:view');

router.post('/validate-time', perm, replayController.validateTime);
router.post('/validate-code', perm, replayController.validateCode);
router.get('/sessions', perm, replayController.getSessions);
router.post('/sessions', perm, replayController.createSession);
router.get('/sessions/:id', perm, replayController.getSessionDetail);
router.post('/sessions/:id/conclusion', perm, replayController.generateConclusion);
router.get('/query', perm, replayController.queryHistory);
router.get('/volatility/:stockCode', perm, replayController.matchVolatility);
router.get('/completeness/:stockCode', perm, replayController.checkCompleteness);
router.get('/sector-comparison', perm, replayController.getSectorComparison);
router.post('/export', perm, replayController.exportData);

export default router;
