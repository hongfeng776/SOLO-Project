const express = require('express');
const TopicController = require('../controllers/TopicController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, TopicController.getList);
router.get('/check-title-unique', authenticate, TopicController.checkTitleUnique);
router.get('/check-time-overlap', authenticate, TopicController.checkTimeOverlap);
router.get('/check-content-mounted', authenticate, TopicController.checkContentMounted);
router.post('/batch-enable', authenticate, requirePermission('content:update'), TopicController.batchEnable);
router.post('/batch-disable', authenticate, requirePermission('content:update'), TopicController.batchDisable);
router.post('/batch-supplement', authenticate, requirePermission('content:update'), TopicController.batchSupplement);
router.post('/batch-update-weight', authenticate, requirePermission('content:update'), TopicController.batchUpdateWeight);
router.get('/:id', authenticate, TopicController.getDetail);
router.post('/', authenticate, requirePermission('content:create'), TopicController.create);
router.put('/:id', authenticate, requirePermission('content:update'), TopicController.update);
router.post('/:id/status', authenticate, requirePermission('content:update'), TopicController.changeStatus);
router.post('/:id/mount-content', authenticate, requirePermission('content:update'), TopicController.mountContent);
router.post('/:id/unmount-content', authenticate, requirePermission('content:update'), TopicController.unmountContent);
router.post('/:id/reorder-contents', authenticate, requirePermission('content:update'), TopicController.reorderContents);

module.exports = router;
