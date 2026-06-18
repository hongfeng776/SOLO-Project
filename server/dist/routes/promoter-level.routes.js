"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.default);
router.get('/rules', controllers_1.promoterLevelController.getAllRules);
router.put('/rules', controllers_1.promoterLevelController.saveLevelRule);
router.post('/validate/:level', controllers_1.promoterLevelController.validateThresholds);
router.post('/batch-reevaluate', controllers_1.promoterLevelController.batchReEvaluate);
router.post('/adjust-request', controllers_1.promoterLevelController.requestManualAdjust);
router.put('/adjust-request/:id/review', controllers_1.promoterLevelController.reviewAdjust);
router.get('/adjust-requests', controllers_1.promoterLevelController.getAdjustRequests);
router.post('/batch-reset', controllers_1.promoterLevelController.batchResetLevels);
router.get('/:promoterId/change-logs', controllers_1.promoterLevelController.getChangeLogs);
router.get('/iteration/statistics', controllers_1.promoterLevelController.getIterationStats);
exports.default = router;
//# sourceMappingURL=promoter-level.routes.js.map