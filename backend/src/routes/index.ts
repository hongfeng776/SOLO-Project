import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { authController, userController, configController } from '@/controllers';
import responseUtil from '@/utils/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  responseUtil.success(res, { status: 'ok', timestamp: new Date().toISOString() }, '服务正常');
});

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/me', authMiddleware(true), (req: AuthRequest, res: Response) => authController.me(req, res));

router.get('/users', authMiddleware(true), userController.list);
router.post('/users', authMiddleware(true), userController.create);
router.put('/users/:id', authMiddleware(true), userController.update);
router.delete('/users/:id', authMiddleware(true), userController.remove);

router.get('/configs', authMiddleware(true), configController.list);
router.post('/configs', authMiddleware(true), configController.create);
router.put('/configs/:id', authMiddleware(true), configController.update);
router.delete('/configs/:id', authMiddleware(true), configController.remove);

export default router;
