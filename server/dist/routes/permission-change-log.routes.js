"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PermissionChangeLog_controller_1 = __importDefault(require("../controllers/PermissionChangeLog.controller"));
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.default);
router.get('/', PermissionChangeLog_controller_1.default.findAll);
router.get('/anomalies', PermissionChangeLog_controller_1.default.detectAnomalies);
router.get('/:id', PermissionChangeLog_controller_1.default.getDetail);
router.post('/export', PermissionChangeLog_controller_1.default.exportLogs);
exports.default = router;
//# sourceMappingURL=permission-change-log.routes.js.map