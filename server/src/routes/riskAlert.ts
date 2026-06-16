import { Router } from 'express';
import * as riskAlertController from '@controllers/RiskAlertController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('alert:view'), riskAlertController.getAlertList);
router.get('/:id', checkPermission('alert:view'), riskAlertController.getAlertById);
router.post('/', checkPermission('alert:manage'), riskAlertController.createAlert);
router.put('/:id/confirm', checkPermission('alert:manage'), riskAlertController.confirmAlert);
router.put('/:id/resolve', checkPermission('alert:manage'), riskAlertController.resolveAlert);
router.put('/:id/ignore', checkPermission('alert:manage'), riskAlertController.ignoreAlert);

export default router;
