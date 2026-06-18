import { Router } from 'express'
import * as riskControlController from '@controllers/risk-control'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/behavior-logs', riskControlController.getBehaviorLogs)
router.get('/list', riskControlController.getRiskControlList)
router.get('/:id/detail', riskControlController.getUserRiskDetail)
router.post('/:id/detect', riskControlController.detectAnomaly)
router.post('/:id/intercept', riskControlController.interceptBehavior)
router.get('/punishment/list', riskControlController.getPunishmentList)
router.post('/:id/punish', riskControlController.applyPunishment)
router.put('/:id/revoke', riskControlController.revokePunishment)
router.post('/batch/handle', riskControlController.batchHandlePunishment)
router.get('/:id/trace', riskControlController.getViolationTrace)
router.post('/:id/validate', riskControlController.validatePunishment)
router.post('/:id/report', riskControlController.generateReviewReport)

export default router
