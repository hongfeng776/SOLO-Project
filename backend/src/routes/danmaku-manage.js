const express = require('express');
const danmakuManageController = require('../controllers/DanmakuManageController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('danmaku:view'), danmakuManageController.getDanmakuManageList);
router.post('/:id/operate', authenticate, requirePermission('danmaku:edit'), danmakuManageController.operateDanmaku);
router.post('/batch-operate', authenticate, requirePermission('danmaku:edit'), danmakuManageController.batchOperateDanmakus);
router.get('/trace', authenticate, requirePermission('danmaku:view'), danmakuManageController.traceDanmaku);
router.get('/:id/check-duplicate', authenticate, requirePermission('danmaku:view'), danmakuManageController.checkDuplicateOperation);
router.get('/:id/validate', authenticate, requirePermission('danmaku:view'), danmakuManageController.validateOperation);
router.post('/archive-by-content/:contentId', authenticate, requirePermission('danmaku:edit'), danmakuManageController.archiveByContent);

module.exports = router;
