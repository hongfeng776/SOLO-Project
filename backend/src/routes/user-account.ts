import { Router } from 'express'
import * as userAccountController from '@controllers/user-account'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/publish-eligibility', userAccountController.checkPublishEligibility)
router.get('/status', userAccountController.getAccountStatus)
router.get('/abnormal-logs', userAccountController.getAbnormalLogs)

export default router
