const express = require('express');
const config = require('../config');

const router = express.Router();

router.use(`${config.apiPrefix}/auth`, require('./auth'));
router.use(`${config.apiPrefix}/users`, require('./user'));
router.use(`${config.apiPrefix}/roles`, require('./role'));
router.use(`${config.apiPrefix}/contents`, require('./content'));
router.use(`${config.apiPrefix}/short-videos`, require('./shortVideo'));
router.use(`${config.apiPrefix}/articles`, require('./article'));
router.use(`${config.apiPrefix}/topics`, require('./topic'));
router.use(`${config.apiPrefix}/copyrights`, require('./copyright'));
router.use(`${config.apiPrefix}/advertisements`, require('./advertisement'));
router.use(`${config.apiPrefix}/activities`, require('./activity'));
router.use(`${config.apiPrefix}/common`, require('./common'));
router.use(`${config.apiPrefix}/comments`, require('./comment'));
router.use(`${config.apiPrefix}/members`, require('./member'));
router.use(`${config.apiPrefix}/messages`, require('./message'));
router.use(`${config.apiPrefix}/operation-logs`, require('./operationLog'));
router.use(`${config.apiPrefix}/dashboard`, require('./dashboard'));
router.use(`${config.apiPrefix}/topics`, require('./topic'));
router.use(`${config.apiPrefix}/audit`, require('./audit'));
router.use(`${config.apiPrefix}/article-audit`, require('./article-audit'));
router.use(`${config.apiPrefix}/comment-audit`, require('./comment-audit'));
router.use(`${config.apiPrefix}/audit-rules`, require('./audit-rule'));
router.use(`${config.apiPrefix}/copyright-validity`, require('./copyrightValidity'));
router.use(`${config.apiPrefix}/end-users`, require('./end-user'));
router.use(`${config.apiPrefix}/user-segment`, require('./user-segment'));
router.use(`${config.apiPrefix}/user-feedback`, require('./user-feedback'));

module.exports = router;
