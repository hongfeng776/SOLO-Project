import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { authController, userController, configController, categoryController, tagController, contentController, uploadController } from '@/controllers';
import responseUtil from '@/utils/response';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'));
    }
  },
});

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

router.get('/categories', authMiddleware(true), categoryController.list);
router.get('/categories/:id', authMiddleware(true), categoryController.detail);
router.post('/categories', authMiddleware(true), categoryController.create);
router.put('/categories/:id', authMiddleware(true), categoryController.update);
router.delete('/categories/:id', authMiddleware(true), categoryController.remove);

router.get('/tags', authMiddleware(true), tagController.list);
router.get('/tags/:id', authMiddleware(true), tagController.detail);
router.post('/tags', authMiddleware(true), tagController.create);
router.put('/tags/:id', authMiddleware(true), tagController.update);
router.delete('/tags/:id', authMiddleware(true), tagController.remove);

router.get('/contents', authMiddleware(true), contentController.list);
router.get('/contents/:id', authMiddleware(true), contentController.detail);
router.post('/contents', authMiddleware(true), contentController.create);
router.put('/contents/:id', authMiddleware(true), contentController.update);
router.delete('/contents/:id', authMiddleware(true), contentController.remove);

router.post('/upload/image', authMiddleware(true), upload.single('file'), uploadController.image);

export default router;
