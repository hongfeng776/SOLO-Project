import { Router } from 'express';
import marketingValidateController from '../controllers/MarketingValidateController';

const router = Router();

router.post('/validate/create', marketingValidateController.validateCreate);
router.post('/validate/edit/:id', marketingValidateController.validateEdit);
router.get('/edit-permissions', marketingValidateController.getEditPermissions);

export default router;
