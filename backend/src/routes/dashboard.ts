import { Router } from 'express';
import { DashboardController } from '../controllers';
import { requireAuth } from '../middlewares';

const router = Router();
const dashboardController = new DashboardController();

router.get('/overview', requireAuth, (req, res, next) => dashboardController.overview(req, res, next));
router.get('/channel', requireAuth, (req, res, next) => dashboardController.channel(req, res, next));
router.get('/trend', requireAuth, (req, res, next) => dashboardController.trend(req, res, next));
router.get('/audit', requireAuth, (req, res, next) => dashboardController.audit(req, res, next));
router.get('/risk', requireAuth, (req, res, next) => dashboardController.risk(req, res, next));
router.get('/org', requireAuth, (req, res, next) => dashboardController.org(req, res, next));
router.get('/customer', requireAuth, (req, res, next) => dashboardController.customer(req, res, next));

export default router;
