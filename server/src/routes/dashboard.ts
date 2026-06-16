import { Router } from 'express';
import * as dashboardController from '@controllers/DashboardController';
import { authenticate } from '@middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/recent-flows', dashboardController.getRecentFlows);
router.get('/recent-alerts', dashboardController.getRecentAlerts);
router.get('/asset-trend', dashboardController.getAssetTrend);

export default router;
