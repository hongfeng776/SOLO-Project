const express = require('express');
const CopyrightController = require('../controllers/CopyrightController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, CopyrightController.getList);
router.get('/:id', authenticate, CopyrightController.getById);
router.post('/', authenticate, requirePermission('copyright:create'), CopyrightController.create);
router.put('/:id', authenticate, requirePermission('copyright:update'), CopyrightController.update);
router.delete('/:id', authenticate, requirePermission('copyright:delete'), CopyrightController.delete);

module.exports = router;
