const express = require('express');
const commentManageController = require('../controllers/CommentManageController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('comment:view'), commentManageController.getCommentManageList);
router.post('/:id/operate', authenticate, requirePermission('comment:edit'), commentManageController.operateComment);
router.post('/batch-operate', authenticate, requirePermission('comment:edit'), commentManageController.batchOperateComments);
router.get('/trace', authenticate, requirePermission('comment:view'), commentManageController.traceComment);
router.get('/:id/check-duplicate', authenticate, requirePermission('comment:view'), commentManageController.checkDuplicateOperation);
router.get('/:id/validate', authenticate, requirePermission('comment:view'), commentManageController.validateOperation);

module.exports = router;
