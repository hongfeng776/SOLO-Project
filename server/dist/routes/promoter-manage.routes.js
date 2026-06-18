"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.default);
router.get('/level-configs', controllers_1.promoterManageController.getLevelConfigs);
router.get('/:id/detail', controllers_1.promoterManageController.getPromoterDetail);
router.get('/:id/change-logs', controllers_1.promoterManageController.getChangeLogs);
router.get('/:id/change-logs/:logId', controllers_1.promoterManageController.getChangeDiff);
router.post('/:id/check-permission', controllers_1.promoterManageController.checkEditPermission);
router.post('/validate-field', controllers_1.promoterManageController.validateField);
router.post('/check-uniqueness', controllers_1.promoterManageController.checkUniqueness);
router.put('/:id/info', controllers_1.promoterManageController.updatePromoterInfo);
router.post('/qualification/validate', controllers_1.promoterManageController.validateQualification);
router.post('/:id/qualification', controllers_1.promoterManageController.submitQualification);
router.put('/qualification/:qualificationId/review', controllers_1.promoterManageController.reviewQualification);
router.post('/batch/level', controllers_1.promoterManageController.batchUpdateLevel);
router.post('/batch/promote-status', controllers_1.promoterManageController.batchUpdatePromoteStatus);
router.post('/batch/settle-status', controllers_1.promoterManageController.batchUpdateSettleStatus);
exports.default = router;
//# sourceMappingURL=promoter-manage.routes.js.map