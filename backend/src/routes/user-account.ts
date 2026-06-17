import { Router } from 'express'
import * as userAccountController from '@controllers/user-account'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/query', userAccountController.queryUsers)
router.get('/:id/detail', userAccountController.getUserDetail)
router.get('/:id/precheck', userAccountController.preCheckUser)
router.get('/:id/trace', userAccountController.traceUserAccount)
router.get('/:id/integrity', userAccountController.checkUserIntegrity)

router.post('/validate/phone', userAccountController.validatePhone)
router.post('/validate/nickname', userAccountController.validateNickname)
router.post('/validate/avatar', userAccountController.validateAvatar)

router.put('/:id/info', userAccountController.updateUserInfo)

router.post('/batch/update', userAccountController.batchUpdateUsers)
router.post('/batch/reset', userAccountController.batchResetConfig)

router.get('/abnormal/list', userAccountController.getAbnormalUsers)
router.put('/abnormal/:id/handle', userAccountController.handleAbnormalLog)
router.get('/logs/list', userAccountController.getAccountLogs)

router.get('/publish-eligibility', userAccountController.checkPublishEligibility)
router.get('/status', userAccountController.getAccountStatus)
router.get('/abnormal-logs', userAccountController.getAbnormalLogs)

export default router
