import { Router } from 'express';
import statsController from '../controllers/stats.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/overview', authMiddleware, statsController.getOverview);
router.get('/efficiency', authMiddleware, statsController.getEfficiency);
router.get('/status-distribution', authMiddleware, statsController.getStatusDistribution);
router.get('/monthly-trend', authMiddleware, statsController.getMonthlyTrend);
router.get('/channel-stats', authMiddleware, statsController.getChannelStats);
router.get('/department-stats', authMiddleware, statsController.getDepartmentStats);
router.get('/all', authMiddleware, statsController.getAllStats);
router.get(
  '/match/resume/:resumeId/job/:jobId',
  authMiddleware,
  statsController.getMatchScore
);
router.get('/match/jobs/:jobId/resumes', authMiddleware, statsController.getMatchedResumes);
router.get('/match/resumes/:resumeId/jobs', authMiddleware, statsController.getMatchedJobs);

export default router;
