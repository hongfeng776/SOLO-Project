const express = require('express');
const AuditRuleController = require('../controllers/AuditRuleController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.getList);
router.get('/:id', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.getDetail);
router.post('/', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.createRule);
router.put('/:id', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.updateRule);
router.post('/:id/enable', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.enableRule);
router.post('/:id/disable', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.disableRule);
router.delete('/:id', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.deleteRule);
router.get('/conflicts/check', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.checkConflicts);
router.get('/consistency/check', authenticate, requirePermission('audit:qc', 'rule:manage'), AuditRuleController.checkConsistency);
router.post('/batch-action', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.batchAction);
router.get('/trace/:ruleCode', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.getTraceRecord);
router.get('/:ruleId/history', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.getModifyHistory);
router.get('/dynamic-fields/meta', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.getDynamicFields);
router.post('/export', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.exportRules);
router.get('/core-default/list', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.getCoreDefaultRules);
router.post('/:id/sync', authenticate, requirePermission('system:config', 'rule:manage'), AuditRuleController.syncRule);

module.exports = router;
