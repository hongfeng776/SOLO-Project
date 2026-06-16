import { Router } from 'express';
import authRouter from './auth';
import goodsRouter from './goods';
import orderRouter from './order';
import userRouter from './user';
import marketingRouter from './marketing';
import afterSaleRouter from './aftersale';
import merchantRouter from './merchant';

const router = Router();

router.use('/auth', authRouter);
router.use('/goods', goodsRouter);
router.use('/order', orderRouter);
router.use('/user', userRouter);
router.use('/marketing', marketingRouter);
router.use('/aftersale', afterSaleRouter);
router.use('/merchant', merchantRouter);

export default router;
