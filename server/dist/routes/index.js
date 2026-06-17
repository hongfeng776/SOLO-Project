"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const channel_routes_1 = __importDefault(require("./channel.routes"));
const promoter_routes_1 = __importDefault(require("./promoter.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const commission_routes_1 = __importDefault(require("./commission.routes"));
const marketing_routes_1 = __importDefault(require("./marketing.routes"));
const withdraw_routes_1 = __importDefault(require("./withdraw.routes"));
const role_routes_1 = __importDefault(require("./role.routes"));
const permission_routes_1 = __importDefault(require("./permission.routes"));
const operation_log_routes_1 = __importDefault(require("./operation-log.routes"));
const commission_rule_routes_1 = __importDefault(require("./commission-rule.routes"));
const permission_change_log_routes_1 = __importDefault(require("./permission-change-log.routes"));
const response_1 = __importDefault(require("../utils/response"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    response_1.default.success(res, { status: 'ok', timestamp: Date.now() }, 'Server is healthy');
});
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/channels', channel_routes_1.default);
router.use('/promoters', promoter_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/commissions', commission_routes_1.default);
router.use('/marketings', marketing_routes_1.default);
router.use('/withdraws', withdraw_routes_1.default);
router.use('/roles', role_routes_1.default);
router.use('/permissions', permission_routes_1.default);
router.use('/operation-logs', operation_log_routes_1.default);
router.use('/commission-rules', commission_rule_routes_1.default);
router.use('/permission-change-logs', permission_change_log_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map