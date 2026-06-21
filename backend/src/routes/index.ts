import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import jobRoutes from './job.routes';
import resumeRoutes from './resume.routes';
import interviewRoutes from './interview.routes';
import onboardRoutes from './onboard.routes';
import probationRoutes from './probation.routes';
import regularizationRoutes from './regularization.routes';
import qualificationRoutes from './qualification.routes';
import recruitmentConfigRoutes from './recruitment-config.routes';
import userPermissionRoutes from './user-permission.routes';
import operationLogRoutes from './operation-log.routes';
import statsRoutes from './stats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRoutes);
router.use('/onboards', onboardRoutes);
router.use('/probations', probationRoutes);
router.use('/regularizations', regularizationRoutes);
router.use('/qualifications', qualificationRoutes);
router.use('/recruitment-configs', recruitmentConfigRoutes);
router.use('/user-permissions', userPermissionRoutes);
router.use('/operation-logs', operationLogRoutes);
router.use('/stats', statsRoutes);

export default router;
