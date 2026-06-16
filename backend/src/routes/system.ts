import { Router } from 'express'
import * as roleController from '@controllers/role'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)
router.use(roleMiddleware('admin'))

router.get('/roles', roleController.list)
router.get('/roles/all', roleController.all)
router.post('/roles', roleController.create)
router.put('/roles/:id', roleController.update)
router.delete('/roles/:id', roleController.remove)

export default router
