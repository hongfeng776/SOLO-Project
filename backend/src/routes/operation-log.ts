import { Router } from 'express'
import * as operationLogController from '@controllers/operation-log'
import { authMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', operationLogController.list)
router.get('/:id', operationLogController.detail)
router.delete('/:id', operationLogController.remove)
router.post('/batch-delete', operationLogController.batchDelete)
router.post('/clean', operationLogController.clean)

export default router
