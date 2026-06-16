const express = require('express');
const { success } = require('../utils/response');
const enums = require('../constants/enums');

const router = express.Router();

router.get('/enums', (req, res) => {
  const data = {
    auditStatus: enums.getEnumOptions(enums.CONTENT_AUDIT_STATUS),
    copyrightType: enums.getEnumOptions(enums.COPYRIGHT_TYPE),
    memberLevel: enums.getEnumOptions(enums.MEMBER_LEVEL),
    contentCategory: enums.getEnumOptions(enums.CONTENT_CATEGORY),
    adStatus: enums.getEnumOptions(enums.AD_STATUS),
    adType: enums.getEnumOptions(enums.AD_TYPE),
    activityStatus: enums.getEnumOptions(enums.ACTIVITY_STATUS),
    activityType: enums.getEnumOptions(enums.ACTIVITY_TYPE),
    userStatus: enums.getEnumOptions(enums.USER_STATUS),
    commentStatus: enums.getEnumOptions(enums.COMMENT_STATUS),
    memberStatus: enums.getEnumOptions(enums.MEMBER_STATUS),
    messageType: enums.getEnumOptions(enums.MESSAGE_TYPE),
    operationType: enums.getEnumOptions(enums.OPERATION_TYPE),
    violationLevel: enums.getEnumOptions(enums.VIOLATION_LEVEL),
    messagePriority: enums.getEnumOptions(enums.MESSAGE_PRIORITY),
    operationModule: enums.getEnumOptions(enums.OPERATION_MODULE),
    roleCode: Object.keys(enums.ROLE_CODE).map((k) => ({ value: enums.ROLE_CODE[k], label: k })),
  };
  return success(res, data);
});

router.get('/health', (req, res) => {
  return success(res, {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

module.exports = router;
