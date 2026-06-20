const express = require('express');
const memberLevelController = require('../controllers/MemberLevelController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('memberLevel:view'), memberLevelController.getLevelList);
router.get('/stats', authenticate, requirePermission('memberLevel:view'), memberLevelController.getLevelStats);
router.get('/trace', authenticate, requirePermission('memberLevel:view'), memberLevelController.getTraceInfo);
router.get('/upgrade-records', authenticate, requirePermission('memberLevel:view'), memberLevelController.getUpgradeRecords);
router.get('/check-conflicts', authenticate, requirePermission('memberLevel:view'), memberLevelController.checkConflicts);
router.get('/:id', authenticate, requirePermission('memberLevel:view'), memberLevelController.getLevelDetail);
router.get('/:levelId/history', authenticate, requirePermission('memberLevel:view'), memberLevelController.getModifyHistory);

router.post('/', authenticate, requirePermission('memberLevel:create'), memberLevelController.createLevel);
router.post('/batch-action', authenticate, requirePermission('memberLevel:manage'), memberLevelController.batchAction);
router.post('/:id/enable', authenticate, requirePermission('memberLevel:edit'), memberLevelController.enableLevel);
router.post('/:id/disable', authenticate, requirePermission('memberLevel:manage'), memberLevelController.disableLevel);

router.put('/:id', authenticate, requirePermission('memberLevel:edit'), memberLevelController.updateLevel);

module.exports = router;
