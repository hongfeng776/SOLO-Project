import { Router } from 'express'
import * as statsController from '@controllers/stats'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/overview', statsController.overview)
router.get('/content', statsController.contentStats)
router.get('/creator', statsController.creatorStats)
router.get('/order', statsController.orderStats)
router.get('/trend', statsController.trendStats)

export default router
