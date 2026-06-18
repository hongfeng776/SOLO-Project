import { Router } from 'express'
import * as merchantOnboardingController from '@controllers/merchant-onboarding'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', merchantOnboardingController.list)
router.get('/stats', merchantOnboardingController.stats)
router.get('/:id', merchantOnboardingController.detail)
router.get('/:id/logs', merchantOnboardingController.getLogs)
router.get('/:id/credit', merchantOnboardingController.getCreditArchive)
router.get('/credit/:licenseNo', merchantOnboardingController.getCreditArchiveByLicense)

router.post('/pre-check', merchantOnboardingController.preCheck)
router.post('/', merchantOnboardingController.create)
router.post('/detect-duplicate', merchantOnboardingController.detectDuplicate)

router.use(roleMiddleware('admin', 'operation_manager'))

router.post('/:id/initial-audit', merchantOnboardingController.initialAudit)
router.post('/:id/final-audit', merchantOnboardingController.finalAudit)
router.post('/:id/return', merchantOnboardingController.returnApply)
router.post('/:id/promote-final', merchantOnboardingController.promoteToFinal)
router.post('/batch-audit', merchantOnboardingController.batchAudit)

export default router
