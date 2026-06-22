import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import channelRoutes from './channel.routes';
import promoterRoutes from './promoter.routes';
import orderRoutes from './order.routes';
import commissionRoutes from './commission.routes';
import marketingRoutes from './marketing.routes';
import withdrawRoutes from './withdraw.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import operationLogRoutes from './operation-log.routes';
import commissionRuleRoutes from './commission-rule.routes';
import permissionChangeLogRoutes from './permission-change-log.routes';
import promoterAuditRoutes from './promoter-audit.routes';
import promoterManageRoutes from './promoter-manage.routes';
import promoterLevelRoutes from './promoter-level.routes';
import promoterRiskRoutes from './promoter-risk.routes';
import channelAuditRoutes from './channel-audit.routes';
import productRoutes from './product.routes';
import distributionOrderRoutes from './distribution-order.routes';
import distributionActivityRoutes from './distribution-activity.routes';
import activityLifecycleRoutes from './activity-lifecycle.routes';
import participationRiskControlRoutes from './participation-risk-control.routes';
import rewardWriteOffRoutes from './reward-write-off.routes';
import ResponseUtils from '../utils/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  ResponseUtils.success(res, { status: 'ok', timestamp: Date.now() }, 'Server is healthy');
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/channels', channelRoutes);
router.use('/channel-audits', channelAuditRoutes);
router.use('/promoters', promoterRoutes);
router.use('/promoter-audits', promoterAuditRoutes);
router.use('/promoter-manage', promoterManageRoutes);
router.use('/promoter-levels', promoterLevelRoutes);
router.use('/promoter-risk', promoterRiskRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/commissions', commissionRoutes);
router.use('/marketings', marketingRoutes);
router.use('/withdraws', withdrawRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/operation-logs', operationLogRoutes);
router.use('/commission-rules', commissionRuleRoutes);
router.use('/permission-change-logs', permissionChangeLogRoutes);
router.use('/distribution-orders', distributionOrderRoutes);
router.use('/distribution-activities', distributionActivityRoutes);
router.use('/activity-lifecycle', activityLifecycleRoutes);
router.use('/participation-risk-control', participationRiskControlRoutes);

export default router;
