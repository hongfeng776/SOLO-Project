const express = require('express');
const commentController = require('../controllers/CommentController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('comment:view'), commentController.getCommentList);
router.get('/stats', authenticate, requirePermission('comment:view'), commentController.getCommentStats);
router.get('/:id', authenticate, requirePermission('comment:view'), commentController.getCommentById);
router.post('/', commentController.createComment);
router.put('/:id', authenticate, requirePermission('comment:edit'), commentController.updateComment);
router.delete('/:id', authenticate, requirePermission('comment:delete'), commentController.deleteComment);
router.post('/batch-delete', authenticate, requirePermission('comment:delete'), commentController.batchDeleteComments);
router.post('/:id/audit', authenticate, requirePermission('comment:audit'), commentController.auditComment);
router.post('/batch-audit', authenticate, requirePermission('comment:audit'), commentController.batchAuditComments);

module.exports = router;
