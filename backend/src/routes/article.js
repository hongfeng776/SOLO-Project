const express = require('express');
const ArticleController = require('../controllers/ArticleController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, ArticleController.getList);
router.get('/check-title', authenticate, ArticleController.checkTitle);
router.get('/check-content', authenticate, ArticleController.checkContent);
router.post('/batch-top', authenticate, requirePermission('content:update'), ArticleController.batchTop);
router.post('/batch-offline', authenticate, requirePermission('content:delete'), ArticleController.batchOffline);
router.post('/batch-classify', authenticate, requirePermission('content:update'), ArticleController.batchClassify);
router.get('/:id', authenticate, ArticleController.getDetail);
router.get('/:id/versions', authenticate, ArticleController.getVersionList);
router.get('/:id/report', authenticate, ArticleController.generateReport);
router.get('/versions/:versionId', authenticate, ArticleController.getVersionDetail);
router.post('/', authenticate, requirePermission('content:create'), ArticleController.create);
router.put('/:id', authenticate, requirePermission('content:update'), ArticleController.update);
router.post('/:id/publish', authenticate, requirePermission('content:publish'), ArticleController.publishVersion);

module.exports = router;
