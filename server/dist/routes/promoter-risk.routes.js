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
router.get('/records', controllers_1.promoterRiskController.getRiskList);
router.get('/records/:id', controllers_1.promoterRiskController.getRiskDetail);
router.get('/profile/:promoterId', controllers_1.promoterRiskController.getRiskProfile);
router.get('/analysis/:promoterId', controllers_1.promoterRiskController.getRiskAnalysis);
router.post('/mark', controllers_1.promoterRiskController.markRisk);
router.put('/records/:id/cancel', controllers_1.promoterRiskController.cancelRisk);
router.get('/releases', controllers_1.promoterRiskController.getReleaseList);
router.post('/release', controllers_1.promoterRiskController.submitRelease);
router.put('/releases/:id/review', controllers_1.promoterRiskController.reviewRelease);
router.post('/batch/mark', controllers_1.promoterRiskController.batchMarkRisk);
router.post('/batch/cancel', controllers_1.promoterRiskController.batchCancelRisk);
router.get('/trace/:promoterId', controllers_1.promoterRiskController.getBehaviorTrace);
router.get('/warnings', controllers_1.promoterRiskController.getWarningList);
router.put('/warnings/:id/handle', controllers_1.promoterRiskController.handleWarning);
router.get('/statistics', controllers_1.promoterRiskController.getStatistics);
exports.default = router;
//# sourceMappingURL=promoter-risk.routes.js.map