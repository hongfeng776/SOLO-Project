import { Router } from 'express'
import * as userLevelController from '@controllers/user-level'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/list', userLevelController.getLevelList)
router.get('/:id/detail', userLevelController.getUserLevelDetail)
router.get('/:id/precheck', userLevelController.preCheckUser)
router.get('/:id/calculate-score', userLevelController.calculateLevelScore)
router.post('/:id/auto-calculate', userLevelController.autoCalculateLevel)
router.post('/:id/validate-adjustment', userLevelController.validateLevelAdjustment)
router.put('/:id/adjust', userLevelController.adjustLevel)

router.post('/batch/adjust', userLevelController.batchAdjustLevel)

router.get('/logs/list', userLevelController.getLevelLogs)
router.get('/logs/:logId/analyze/:userId', userLevelController.analyzeLevelChange)

router.get('/config/list', userLevelController.getLevelConfigs)
router.put('/config/:id', userLevelController.updateLevelConfig)

export default router
