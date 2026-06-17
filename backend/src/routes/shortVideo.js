const express = require('express');
const ShortVideoController = require('../controllers/ShortVideoController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, ShortVideoController.getList);
router.get('/check-fingerprint', authenticate, ShortVideoController.checkFingerprint);
router.post('/batch-reset-tags', authenticate, requirePermission('content:update'), ShortVideoController.batchResetTags);
router.post('/batch-restore', authenticate, requirePermission('content:update'), ShortVideoController.batchRestore);
router.post('/batch-archive', authenticate, requirePermission('content:delete'), ShortVideoController.batchArchive);
router.get('/:id', authenticate, ShortVideoController.getDetail);
router.get('/:id/status-logs', authenticate, ShortVideoController.getStatusLogs);
router.post('/', authenticate, requirePermission('content:create'), ShortVideoController.create);
router.put('/:id', authenticate, requirePermission('content:update'), ShortVideoController.update);
router.post('/:id/status', authenticate, requirePermission('content:update'), ShortVideoController.changeStatus);

module.exports = router;
