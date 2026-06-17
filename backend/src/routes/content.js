const express = require('express');
const ContentController = require('../controllers/ContentController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, ContentController.getList);
router.get('/check-title-unique', authenticate, ContentController.checkTitleUnique);
router.get('/check-copyright-unique', authenticate, ContentController.checkCopyrightUnique);
router.get('/:id', authenticate, ContentController.getById);
router.post('/', authenticate, requirePermission('content:create'), ContentController.create);
router.put('/:id', authenticate, requirePermission('content:update'), ContentController.update);
router.delete('/:id', authenticate, requirePermission('content:delete'), ContentController.delete);
router.post('/batch-delete', authenticate, requirePermission('content:delete'), ContentController.batchDelete);
router.post('/batch-offline', authenticate, requirePermission('content:update'), ContentController.batchOffline);
router.post('/batch-top', authenticate, requirePermission('content:update'), ContentController.batchTop);
router.post('/batch-update-category', authenticate, requirePermission('content:update'), ContentController.batchUpdateCategory);
router.post('/:id/audit', authenticate, requirePermission('content:audit'), ContentController.audit);
router.post('/batch-audit', authenticate, requirePermission('content:audit'), ContentController.batchAudit);

module.exports = router;
