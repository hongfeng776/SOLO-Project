const express = require('express');
const CopyrightController = require('../controllers/CopyrightController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, CopyrightController.getList);
router.get('/:id', authenticate, CopyrightController.getById);
router.post('/check-conflict', authenticate, CopyrightController.checkConflict);
router.post('/verify-qualification', authenticate, CopyrightController.verifyQualification);
router.post('/', authenticate, requirePermission('copyright:create'), CopyrightController.create);
router.put('/:id', authenticate, requirePermission('copyright:update'), CopyrightController.update);
router.delete('/:id', authenticate, requirePermission('copyright:delete'), CopyrightController.delete);
router.post('/batch/import', authenticate, requirePermission('copyright:batch'), CopyrightController.batchImport);
router.post('/batch/renew', authenticate, requirePermission('copyright:batch'), CopyrightController.batchRenew);
router.post('/batch/invalid', authenticate, requirePermission('copyright:batch'), CopyrightController.batchInvalid);
router.get('/trace/list', authenticate, CopyrightController.traceCopyright);
router.post('/:id/sync-modules', authenticate, CopyrightController.syncToModules);

module.exports = router;
