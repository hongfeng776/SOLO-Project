const express = require('express');
const AdvertisementController = require('../controllers/AdvertisementController');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, AdvertisementController.getList);
router.get('/:id', authenticate, AdvertisementController.getById);
router.post('/', authenticate, requirePermission('ad:create'), AdvertisementController.create);
router.put('/:id', authenticate, requirePermission('ad:update'), AdvertisementController.update);
router.delete('/:id', authenticate, requirePermission('ad:delete'), AdvertisementController.delete);
router.post('/batch-delete', authenticate, requirePermission('ad:delete'), AdvertisementController.batchDelete);

module.exports = router;
