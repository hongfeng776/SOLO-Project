import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import userTraceController from '../controllers/UserTraceController';

const router = Router();

router.use(authMiddleware);

router.get('/full-trace/:id', userTraceController.getUserTrace);
router.get('/register-log/:id', userTraceController.getRegisterLog);
router.get('/profile-logs/:id', userTraceController.getProfileLogs);
router.get('/login-traces/:id', userTraceController.getLoginTraces);
router.get('/consumption-ledgers/:id', userTraceController.getConsumptionLedgers);
router.get('/compliance/:id', userTraceController.checkCompliance);
router.get('/duplicate-users/:id', userTraceController.getDuplicateUsers);

export default router;
