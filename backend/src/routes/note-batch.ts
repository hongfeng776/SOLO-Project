import { Router } from 'express'
import * as noteBatchController from '@controllers/note-batch'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', noteBatchController.list)
router.get('/:id', noteBatchController.detail)
router.post('/:id/retry', noteBatchController.retry)

export default router
