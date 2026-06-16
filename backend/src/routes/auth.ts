import { Router } from 'express'
import * as authController from '@controllers/auth'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.post('/login', authController.login)
router.get('/info', authMiddleware, authController.getUserInfo)
router.post('/logout', authMiddleware, authController.logout)
router.post('/refresh', authMiddleware, authController.refreshToken)

export default router
