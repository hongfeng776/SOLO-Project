import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

export default router;
