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
import ResponseUtils from '../utils/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  ResponseUtils.success(res, { status: 'ok', timestamp: Date.now() }, 'Server is healthy');
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/channels', channelRoutes);
router.use('/promoters', promoterRoutes);
router.use('/orders', orderRoutes);
router.use('/commissions', commissionRoutes);
router.use('/marketings', marketingRoutes);
router.use('/withdraws', withdrawRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);

export default router;
