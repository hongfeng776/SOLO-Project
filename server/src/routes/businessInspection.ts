import { Router } from 'express';
import * as businessInspectionController from '@controllers/BusinessInspectionController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', checkPermission('compliance:view'), businessInspectionController.getStats);
router.get('/', checkPermission('compliance:view'), businessInspectionController.getInspectionList);
router.get('/issues', checkPermission('compliance:view'), businessInspectionController.getIssueList);
router.post('/', checkPermission('compliance:inspection:manage'), businessInspectionController.createInspection);
router.post('/pre-check', checkPermission('compliance:inspection:manage'), businessInspectionController.preCheck);
router.post('/batch-preview', checkPermission('compliance:inspection:batch'), businessInspectionController.batchPreviewIssues);
router.post('/batch-process', checkPermission('compliance:inspection:batch'), businessInspectionController.batchProcessIssues);
router.get('/:id', checkPermission('compliance:view'), businessInspectionController.getInspectionById);
router.get('/:id/logs', checkPermission('compliance:view'), businessInspectionController.getInspectionLogs);
router.put('/:id/start', checkPermission('compliance:inspection:manage'), businessInspectionController.startInspection);

export default router;
