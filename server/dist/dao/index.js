"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionChangeLogDao = exports.operationLogDao = exports.permissionDao = exports.roleDao = exports.withdrawDao = exports.marketingDao = exports.commissionDao = exports.orderDao = exports.promoterDao = exports.channelDao = exports.userDao = void 0;
const User_dao_1 = __importDefault(require("./User.dao"));
exports.userDao = User_dao_1.default;
const Channel_dao_1 = __importDefault(require("./Channel.dao"));
exports.channelDao = Channel_dao_1.default;
const Promoter_dao_1 = __importDefault(require("./Promoter.dao"));
exports.promoterDao = Promoter_dao_1.default;
const Order_dao_1 = __importDefault(require("./Order.dao"));
exports.orderDao = Order_dao_1.default;
const Commission_dao_1 = __importDefault(require("./Commission.dao"));
exports.commissionDao = Commission_dao_1.default;
const Marketing_dao_1 = __importDefault(require("./Marketing.dao"));
exports.marketingDao = Marketing_dao_1.default;
const Withdraw_dao_1 = __importDefault(require("./Withdraw.dao"));
exports.withdrawDao = Withdraw_dao_1.default;
const Role_dao_1 = __importDefault(require("./Role.dao"));
exports.roleDao = Role_dao_1.default;
const Permission_dao_1 = __importDefault(require("./Permission.dao"));
exports.permissionDao = Permission_dao_1.default;
const OperationLog_dao_1 = __importDefault(require("./OperationLog.dao"));
exports.operationLogDao = OperationLog_dao_1.default;
const PermissionChangeLog_dao_1 = __importDefault(require("./PermissionChangeLog.dao"));
exports.permissionChangeLogDao = PermissionChangeLog_dao_1.default;
//# sourceMappingURL=index.js.map