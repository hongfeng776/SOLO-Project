import { Router } from 'express';
import logisticsProviderValidateController from '../controllers/LogisticsProviderValidateController';

const router = Router();

router.post('/provider-code', logisticsProviderValidateController.validateProviderCode);
router.post('/credit-code', logisticsProviderValidateController.validateCreditCode);
router.post('/business-license', logisticsProviderValidateController.validateBusinessLicense);
router.post('/phone', logisticsProviderValidateController.validatePhone);
router.post('/email', logisticsProviderValidateController.validateEmail);
router.post('/id-card', logisticsProviderValidateController.validateIdCard);
router.post('/date-range', logisticsProviderValidateController.validateDateRange);
router.post('/check-duplicate', logisticsProviderValidateController.checkDuplicateProvider);
router.post('/check-field-edit', logisticsProviderValidateController.checkFieldEditPermission);
router.post('/fee-compliance/:id', logisticsProviderValidateController.checkFeeCompliance);
router.get('/pre-check/:id', logisticsProviderValidateController.runProviderPreCheck);
router.get('/enterprise-qualification/:id', logisticsProviderValidateController.validateEnterpriseQualification);
router.get('/coverage/:id', logisticsProviderValidateController.validateCoverage);
router.get('/timeliness/:id', logisticsProviderValidateController.validateTimeliness);
router.get('/permissions/:id', logisticsProviderValidateController.validatePermissions);

export default router;
