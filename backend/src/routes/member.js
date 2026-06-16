const express = require('express');
const memberController = require('../controllers/MemberController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('member:view'), memberController.getMemberList);
router.get('/stats', authenticate, requirePermission('member:view'), memberController.getMemberStats);
router.get('/:id', authenticate, requirePermission('member:view'), memberController.getMemberById);
router.post('/', authenticate, requirePermission('member:create'), memberController.createMember);
router.put('/:id', authenticate, requirePermission('member:edit'), memberController.updateMember);
router.post('/:id/renew', authenticate, requirePermission('member:edit'), memberController.renewMember);
router.post('/:id/upgrade', authenticate, requirePermission('member:edit'), memberController.upgradeMember);
router.post('/:id/freeze', authenticate, requirePermission('member:edit'), memberController.freezeMember);
router.post('/:id/unfreeze', authenticate, requirePermission('member:edit'), memberController.unfreezeMember);

module.exports = router;
