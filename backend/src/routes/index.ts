import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import jobRoutes from './job.routes';
import resumeRoutes from './resume.routes';
import interviewRoutes from './interview.routes';
import onboardRoutes from './onboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRoutes);
router.use('/onboards', onboardRoutes);

export default router;
