"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.RolePermission = exports.Permission = exports.Role = exports.Withdraw = exports.Marketing = exports.Commission = exports.Order = exports.Promoter = exports.Channel = exports.User = exports.associate = void 0;
const User_model_1 = __importDefault(require("./User.model"));
exports.User = User_model_1.default;
const Channel_model_1 = __importDefault(require("./Channel.model"));
exports.Channel = Channel_model_1.default;
const Promoter_model_1 = __importDefault(require("./Promoter.model"));
exports.Promoter = Promoter_model_1.default;
const Order_model_1 = __importDefault(require("./Order.model"));
exports.Order = Order_model_1.default;
const Commission_model_1 = __importDefault(require("./Commission.model"));
exports.Commission = Commission_model_1.default;
const Marketing_model_1 = __importDefault(require("./Marketing.model"));
exports.Marketing = Marketing_model_1.default;
const Withdraw_model_1 = __importDefault(require("./Withdraw.model"));
exports.Withdraw = Withdraw_model_1.default;
const Role_model_1 = __importDefault(require("./Role.model"));
exports.Role = Role_model_1.default;
const Permission_model_1 = __importDefault(require("./Permission.model"));
exports.Permission = Permission_model_1.default;
const RolePermission_model_1 = __importDefault(require("./RolePermission.model"));
exports.RolePermission = RolePermission_model_1.default;
const UserRole_model_1 = __importDefault(require("./UserRole.model"));
exports.UserRole = UserRole_model_1.default;
const models = {
    User: User_model_1.default,
    Channel: Channel_model_1.default,
    Promoter: Promoter_model_1.default,
    Order: Order_model_1.default,
    Commission: Commission_model_1.default,
    Marketing: Marketing_model_1.default,
    Withdraw: Withdraw_model_1.default,
    Role: Role_model_1.default,
    Permission: Permission_model_1.default,
    RolePermission: RolePermission_model_1.default,
    UserRole: UserRole_model_1.default,
};
const associate = () => {
    Channel_model_1.default.hasMany(Promoter_model_1.default, { foreignKey: 'channelId', as: 'promoters' });
    Channel_model_1.default.hasMany(Order_model_1.default, { foreignKey: 'channelId', as: 'orders' });
    Promoter_model_1.default.belongsTo(Channel_model_1.default, { foreignKey: 'channelId', as: 'channel' });
    Promoter_model_1.default.hasMany(Order_model_1.default, { foreignKey: 'promoterId', as: 'orders' });
    Promoter_model_1.default.hasMany(Commission_model_1.default, { foreignKey: 'promoterId', as: 'commissions' });
    Promoter_model_1.default.hasMany(Withdraw_model_1.default, { foreignKey: 'promoterId', as: 'withdraws' });
    Promoter_model_1.default.hasMany(Promoter_model_1.default, { foreignKey: 'parentId', as: 'children' });
    Promoter_model_1.default.belongsTo(Promoter_model_1.default, { foreignKey: 'parentId', as: 'parent' });
    Order_model_1.default.belongsTo(Channel_model_1.default, { foreignKey: 'channelId', as: 'channel' });
    Order_model_1.default.belongsTo(Promoter_model_1.default, { foreignKey: 'promoterId', as: 'promoter' });
    Order_model_1.default.belongsTo(User_model_1.default, { foreignKey: 'userId', as: 'user' });
    Order_model_1.default.hasOne(Commission_model_1.default, { foreignKey: 'orderId', as: 'commission' });
    Commission_model_1.default.belongsTo(Order_model_1.default, { foreignKey: 'orderId', as: 'order' });
    Commission_model_1.default.belongsTo(Promoter_model_1.default, { foreignKey: 'promoterId', as: 'promoter' });
    Commission_model_1.default.belongsTo(Channel_model_1.default, { foreignKey: 'channelId', as: 'channel' });
    Role_model_1.default.belongsToMany(Permission_model_1.default, { through: RolePermission_model_1.default, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
    Permission_model_1.default.belongsToMany(Role_model_1.default, { through: RolePermission_model_1.default, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles' });
    User_model_1.default.belongsToMany(Role_model_1.default, { through: UserRole_model_1.default, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
    Role_model_1.default.belongsToMany(User_model_1.default, { through: UserRole_model_1.default, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });
};
exports.associate = associate;
exports.default = models;
//# sourceMappingURL=index.js.map