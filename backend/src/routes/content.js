const express = require('express');
const ContentController = require('../controllers/ContentController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, ContentController.getList);
router.get('/:id', authenticate, ContentController.getById);
router.post('/', authenticate, requirePermission('content:create'), ContentController.create);
router.put('/:id', authenticate, requirePermission('content:update'), ContentController.update);
router.delete('/:id', authenticate, requirePermission('content:delete'), ContentController.delete);
router.post('/batch-delete', authenticate, requirePermission('content:delete'), ContentController.batchDelete);
router.post('/:id/audit', authenticate, requirePermission('content:audit'), ContentController.audit);
router.post('/batch-audit', authenticate, requirePermission('content:audit'), ContentController.batchAudit);

module.exports = router;
