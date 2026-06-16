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

export default router;
