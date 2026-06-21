import { Router } from 'express';
import logisticsLinkMatchController from '../controllers/LogisticsLinkMatchController';

const router = Router();

router.post('/start', logisticsLinkMatchController.startLinkMatch);
router.get('/progress/:match_no', logisticsLinkMatchController.getMatchProgress);
router.get('/result/:match_no', logisticsLinkMatchController.getMatchResult);
router.post('/select-provider', logisticsLinkMatchController.selectProvider);

export default router;
