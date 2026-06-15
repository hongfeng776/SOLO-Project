const express = require('express');
const router = express.Router();
const workController = require('../controllers/workController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

router.get('/', authMiddleware, checkPermission('content:work:list'), workController.getWorks);

router.get('/:id', authMiddleware, checkPermission('content:work:view'), workController.getWorkById);

router.post('/', authMiddleware, checkPermission('content:work:add'), workController.createWork);

router.put('/:id', authMiddleware, checkPermission('content:work:edit'), workController.updateWork);

router.delete('/:id', authMiddleware, checkPermission('content:work:delete'), workController.deleteWork);

router.post('/batch-delete', authMiddleware, checkPermission('content:work:delete'), workController.batchDeleteWork);

module.exports = router;
