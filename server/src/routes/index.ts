import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import roleRoutes from './role';
import permissionRoutes from './permission';
import stockQuoteRoutes from './stockQuote';
import assetProductRoutes from './assetProduct';
import customerAssetRoutes from './customerAsset';
import fundFlowRoutes from './fundFlow';
import complianceAuditRoutes from './complianceAudit';
import tradeRoutes from './trade';
import holdingRoutes from './holding';
import riskAlertRoutes from './riskAlert';
import operationLogRoutes from './operationLog';
import dashboardRoutes from './dashboard';
import thresholdRoutes from './threshold';
import replayRoutes from './replay';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/stocks', stockQuoteRoutes);
router.use('/products', assetProductRoutes);
router.use('/customers', customerAssetRoutes);
router.use('/fund-flows', fundFlowRoutes);
router.use('/compliance-audits', complianceAuditRoutes);
router.use('/trades', tradeRoutes);
router.use('/holdings', holdingRoutes);
router.use('/risk-alerts', riskAlertRoutes);
router.use('/operation-logs', operationLogRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/thresholds', thresholdRoutes);
router.use('/replay', replayRoutes);

export default router;
