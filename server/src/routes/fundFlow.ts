import { Router } from 'express';
import * as fundFlowController from '@controllers/FundFlowController';
import { authenticate, checkPermission } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('fund-flow:view'), fundFlowController.getFlowList);
router.get('/no/:flowNo', checkPermission('fund-flow:view'), fundFlowController.getFlowByNo);
router.get('/:id', checkPermission('fund-flow:view'), fundFlowController.getFlowById);
router.post('/', checkPermission('fund-flow:manage'), fundFlowController.createFlow);
router.put('/:id', checkPermission('fund-flow:manage'), fundFlowController.updateFlow);
router.delete('/:id', checkPermission('fund-flow:manage'), fundFlowController.deleteFlow);

export default router;
