const express = require('express');
const CopyrightValidityController = require('../controllers/CopyrightValidityController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/configs', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.getConfigList);
router.post('/configs', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.createConfig);
router.put('/configs/:id', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.updateConfig);
router.delete('/configs/:id', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.deleteConfig);
router.post('/configs/:id/scan', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.triggerScan);

router.get('/dashboard-stats', authenticate, requirePermission('copyright:view'), CopyrightValidityController.getDashboardStats);

router.post('/status/:id/change', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.changeStatus);
router.get('/status/:id/history', authenticate, requirePermission('copyright:view'), CopyrightValidityController.getStatusHistory);

router.post('/batch/execute', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.batchExecute);
router.get('/batch/tasks', authenticate, requirePermission('copyright:view'), CopyrightValidityController.getTaskList);
router.get('/batch/tasks/:id', authenticate, requirePermission('copyright:view'), CopyrightValidityController.getTaskDetail);

router.get('/trace/events', authenticate, requirePermission('copyright:view'), CopyrightValidityController.traceEvents);
router.get('/trace/exceptions', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.traceExceptions);
router.post('/trace/check-integrity', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.checkIntegrity);

router.post('/warnings/:id/handle', authenticate, requirePermission('copyright:manage'), CopyrightValidityController.handleWarning);

module.exports = router;
