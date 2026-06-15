const express = require('express');
const router = express.Router();
const visualTemplateController = require('../controllers/visualTemplateController');
const authMiddleware = require('../middleware/auth');
const { upload, multerErrorHandler } = require('../middleware/upload');
const { logMeta } = require('../middleware/operationLog');

router.get('/', authMiddleware, visualTemplateController.getTemplateList);
router.get('/style-types', authMiddleware, visualTemplateController.getStyleTypeList);
router.get('/check-name', authMiddleware, visualTemplateController.checkNameUnique);
router.get('/export', authMiddleware, visualTemplateController.exportTemplate);
router.get('/:id', authMiddleware, visualTemplateController.getTemplateDetail);
router.post(
  '/',
  authMiddleware,
  logMeta({ module: 'visualTemplate', operation: 'create', description: '新增视觉模板' }),
  upload.single('cover'),
  multerErrorHandler,
  visualTemplateController.createTemplate
);
router.put(
  '/:id',
  authMiddleware,
  logMeta({ module: 'visualTemplate', operation: 'update', description: '编辑视觉模板' }),
  upload.single('cover'),
  multerErrorHandler,
  visualTemplateController.updateTemplate
);
router.delete(
  '/:id',
  authMiddleware,
  logMeta({ module: 'visualTemplate', operation: 'delete', description: '删除视觉模板' }),
  visualTemplateController.deleteTemplate
);
router.post(
  '/batch-delete',
  authMiddleware,
  logMeta({ module: 'visualTemplate', operation: 'delete', description: '批量删除视觉模板' }),
  visualTemplateController.batchDeleteTemplate
);
router.put(
  '/:id/status',
  authMiddleware,
  logMeta({ module: 'visualTemplate', operation: 'update', description: '切换模板状态' }),
  visualTemplateController.updateStatus
);
router.post(
  '/batch-status',
  authMiddleware,
  logMeta({ module: 'visualTemplate', operation: 'update', description: '批量切换模板状态' }),
  visualTemplateController.batchUpdateStatus
);

module.exports = router;
