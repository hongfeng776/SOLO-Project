import { Router } from 'express'
import * as userController from '@controllers/user'
import { authMiddleware, roleMiddleware } from '@middlewares/auth'

const router = Router()

router.use(authMiddleware)
router.use(roleMiddleware('admin'))

router.get('/', userController.list)
router.post('/', userController.create)
router.put('/:id', userController.update)
router.delete('/:id', userController.remove)

export default router
