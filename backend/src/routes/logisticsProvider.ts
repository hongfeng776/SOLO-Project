import { Router } from 'express';
import logisticsProviderController from '../controllers/LogisticsProviderController';

const router = Router();

router.get('/list', logisticsProviderController.getProviderList);
router.get('/detail/:id', logisticsProviderController.getProviderDetail);
router.get('/full-info/:id', logisticsProviderController.getProviderFullInfo);
router.get('/statistics', logisticsProviderController.getStatistics);
router.get('/generate-code', logisticsProviderController.generateProviderCode);
router.get('/edit-permission/:id', logisticsProviderController.getEditPermission);
router.post('/validate-before-create', logisticsProviderController.validateBeforeCreate);
router.post('/create', logisticsProviderController.createProvider);
router.put('/update/:id', logisticsProviderController.updateProvider);
router.delete('/delete/:id', logisticsProviderController.deleteProvider);
router.post('/archive/:id', logisticsProviderController.archiveProvider);
router.put('/status/:id', logisticsProviderController.updateStatus);
router.put('/cooperation-status/:id', logisticsProviderController.updateCooperationStatus);

export default router;
