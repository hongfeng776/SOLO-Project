const express = require('express');
const config = require('../config');

const router = express.Router();

router.use(`${config.apiPrefix}/auth`, require('./auth'));
router.use(`${config.apiPrefix}/users`, require('./user'));
router.use(`${config.apiPrefix}/roles`, require('./role'));
router.use(`${config.apiPrefix}/contents`, require('./content'));
router.use(`${config.apiPrefix}/copyrights`, require('./copyright'));
router.use(`${config.apiPrefix}/advertisements`, require('./advertisement'));
router.use(`${config.apiPrefix}/activities`, require('./activity'));
router.use(`${config.apiPrefix}/common`, require('./common'));

module.exports = router;
