import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import RiskController from '../controllers/RiskController';

const router = Router();

router.use(authMiddleware);

router.post('/rules', RiskController.createRule);
router.get('/rules', RiskController.getRuleList);
router.get('/rules/:id', RiskController.getRuleDetail);
router.put('/rules/:id', RiskController.updateRule);
router.delete('/rules/:id', RiskController.deleteRule);
router.get('/alerts', RiskController.getAlertList);
router.post('/alerts/:id/handle', RiskController.handleAlert);
router.post('/checkOrder', RiskController.checkOrder);

export default router;
