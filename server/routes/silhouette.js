const express = require('express');
const router = express.Router();
const silhouetteController = require('../controllers/silhouetteController');
const authMiddleware = require('../middleware/auth');
const { upload, multerErrorHandler } = require('../middleware/upload');
const { logMeta } = require('../middleware/operationLog');

router.get('/', authMiddleware, silhouetteController.getSilhouetteList);
router.get('/categories', authMiddleware, silhouetteController.getCategoryList);
router.post(
  '/',
  authMiddleware,
  logMeta({ module: 'silhouette', operation: 'create', description: '新增剪影素材' }),
  upload.single('cover'),
  multerErrorHandler,
  silhouetteController.createSilhouette
);
router.put(
  '/:id',
  authMiddleware,
  logMeta({ module: 'silhouette', operation: 'update', description: '编辑剪影素材' }),
  upload.single('cover'),
  multerErrorHandler,
  silhouetteController.updateSilhouette
);
router.delete(
  '/:id',
  authMiddleware,
  logMeta({ module: 'silhouette', operation: 'delete', description: '删除剪影素材' }),
  silhouetteController.deleteSilhouette
);
router.post(
  '/batch-delete',
  authMiddleware,
  logMeta({ module: 'silhouette', operation: 'delete', description: '批量删除剪影素材' }),
  silhouetteController.batchDeleteSilhouette
);
router.put(
  '/:id/status',
  authMiddleware,
  logMeta({ module: 'silhouette', operation: 'update', description: '切换素材状态' }),
  silhouetteController.updateStatus
);
router.post(
  '/batch-status',
  authMiddleware,
  logMeta({ module: 'silhouette', operation: 'update', description: '批量切换素材状态' }),
  silhouetteController.batchUpdateStatus
);

module.exports = router;
