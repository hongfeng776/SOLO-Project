import { Router } from 'express';
import commissionRuleController from '../controllers/CommissionRule.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.post('/', commissionRuleController.create);
router.get('/', commissionRuleController.findAll);
router.get('/:id', commissionRuleController.findById);
router.put('/:id', commissionRuleController.update);
router.delete('/:id', commissionRuleController.delete);
router.put('/:id/toggle', commissionRuleController.toggleEnabled);
export default router;
