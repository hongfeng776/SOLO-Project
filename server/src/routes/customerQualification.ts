import { Router } from 'express';
import * as customerQualificationController from '@controllers/CustomerQualificationController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', checkPermission('compliance:view'), customerQualificationController.getStats);
router.get('/', checkPermission('compliance:view'), customerQualificationController.getQualificationList);
router.post('/', checkPermission('compliance:manage'), customerQualificationController.createQualification);
router.post('/batch-preview', checkPermission('compliance:qualification:batch'), customerQualificationController.batchPreview);
router.post('/batch-operation', checkPermission('compliance:qualification:batch'), customerQualificationController.batchOperation);
router.post('/check-expire-warning', checkPermission('compliance:manage'), customerQualificationController.checkExpireWarning);
router.get('/:id', checkPermission('compliance:view'), customerQualificationController.getQualificationById);
router.get('/:id/logs', checkPermission('compliance:view'), customerQualificationController.getQualificationLogs);
router.post('/:id/pre-check', checkPermission('compliance:qualification:approve'), customerQualificationController.preCheck);
router.put('/:id/approve', checkPermission('compliance:qualification:approve'), customerQualificationController.approveQualification);
router.put('/:id/reject', checkPermission('compliance:qualification:reject'), customerQualificationController.rejectQualification);
router.put('/:id/recheck', checkPermission('compliance:qualification:approve'), customerQualificationController.initiateRecheck);

export default router;
