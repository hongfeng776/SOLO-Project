import { Router } from 'express'
import * as creatorController from '@controllers/creator'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', creatorController.list)
router.get('/:id', creatorController.detail)
router.post('/', creatorController.create)
router.put('/:id', creatorController.update)
router.post('/:id/qualification', creatorController.auditQualification)
router.delete('/:id', creatorController.remove)

export default router
