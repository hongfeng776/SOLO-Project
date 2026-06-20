const express = require('express');
const memberPrivilegeController = require('../controllers/MemberPrivilegeController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.getPrivilegeList);
router.get('/stats', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.getPrivilegeStats);
router.get('/trace', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.getTraceInfo);
router.get('/redemptions', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.getRedemptionRecords);
router.get('/check-conflicts', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.checkConflicts);
router.get('/:id', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.getPrivilegeDetail);
router.get('/:privilegeId/history', authenticate, requirePermission('memberPrivilege:view'), memberPrivilegeController.getModifyHistory);

router.post('/', authenticate, requirePermission('memberPrivilege:create'), memberPrivilegeController.createPrivilege);
router.post('/batch-action', authenticate, requirePermission('memberPrivilege:manage'), memberPrivilegeController.batchAction);
router.post('/:id/status', authenticate, requirePermission('memberPrivilege:edit'), memberPrivilegeController.changeStatus);

router.put('/:id', authenticate, requirePermission('memberPrivilege:edit'), memberPrivilegeController.updatePrivilege);

module.exports = router;
