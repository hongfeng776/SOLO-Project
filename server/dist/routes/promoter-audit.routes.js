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
router.post('/pre-check', controllers_1.promoterAuditController.preCheck);
router.post('/apply', controllers_1.promoterAuditController.submitApply);
router.get('/list', controllers_1.promoterAuditController.getAuditList);
router.get('/statistics', controllers_1.promoterAuditController.getStatistics);
router.get('/reject-reasons', controllers_1.promoterAuditController.getRejectReasons);
router.get('/logs', controllers_1.promoterAuditController.searchAuditLogs);
router.get('/:id', controllers_1.promoterAuditController.getAuditDetail);
router.put('/:id/first-pass', controllers_1.promoterAuditController.firstAuditPass);
router.put('/:id/first-reject', controllers_1.promoterAuditController.firstAuditReject);
router.put('/:id/second-pass', controllers_1.promoterAuditController.secondAuditPass);
router.put('/:id/second-reject', controllers_1.promoterAuditController.secondAuditReject);
router.post('/batch-first-pass', controllers_1.promoterAuditController.batchFirstPass);
router.post('/batch-second-pass', controllers_1.promoterAuditController.batchSecondPass);
router.post('/batch-first-reject', controllers_1.promoterAuditController.batchFirstReject);
router.post('/batch-second-reject', controllers_1.promoterAuditController.batchSecondReject);
exports.default = router;
//# sourceMappingURL=promoter-audit.routes.js.map