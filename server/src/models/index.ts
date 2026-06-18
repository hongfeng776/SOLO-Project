import User from './User.model';
import Channel from './Channel.model';
import Promoter from './Promoter.model';
import Order from './Order.model';
import Commission from './Commission.model';
import Marketing from './Marketing.model';
import Withdraw from './Withdraw.model';
import Role from './Role.model';
import Permission from './Permission.model';
import RolePermission from './RolePermission.model';
import UserRole from './UserRole.model';
import OperationLog from './OperationLog.model';
import ChannelExtension from './ChannelExtension.model';
import CommissionRule from './CommissionRule.model';
import RoleDeletionLog from './RoleDeletionLog.model';
import PromoterBlacklist from './PromoterBlacklist.model';
import PromoterAuditLog from './PromoterAuditLog.model';
import PromoterChangeLog from './PromoterChangeLog.model';
import PromoterQualification from './PromoterQualification.model';
import PromoterLevelRule from './PromoterLevelRule.model';
import PromoterLevelAdjustRequest from './PromoterLevelAdjustRequest.model';
import PromoterLevelChangeLog from './PromoterLevelChangeLog.model';
import PromoterRiskRecord from './PromoterRiskRecord.model';
import PromoterRiskRelease from './PromoterRiskRelease.model';
import PromoterRiskBehavior from './PromoterRiskBehavior.model';
import PromoterRiskWarning from './PromoterRiskWarning.model';

const models = {
  User,
  Channel,
  Promoter,
  Order,
  Commission,
  Marketing,
  Withdraw,
  Role,
  Permission,
  RolePermission,
  UserRole,
  OperationLog,
  ChannelExtension,
  CommissionRule,
  RoleDeletionLog,
  PromoterBlacklist,
  PromoterAuditLog,
  PromoterChangeLog,
  PromoterQualification,
  PromoterLevelRule,
  PromoterLevelAdjustRequest,
  PromoterLevelChangeLog,
  PromoterRiskRecord,
  PromoterRiskRelease,
  PromoterRiskBehavior,
  PromoterRiskWarning,
};

const associate = (): void => {
  Channel.hasMany(Promoter, { foreignKey: 'channelId', as: 'promoters' });
  Channel.hasMany(Order, { foreignKey: 'channelId', as: 'orders' });
  Channel.hasMany(ChannelExtension, { foreignKey: 'channelId', as: 'extensions' });

  ChannelExtension.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Promoter.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Promoter.hasMany(Order, { foreignKey: 'promoterId', as: 'orders' });
  Promoter.hasMany(Commission, { foreignKey: 'promoterId', as: 'commissions' });
  Promoter.hasMany(Withdraw, { foreignKey: 'promoterId', as: 'withdraws' });
  Promoter.hasMany(Promoter, { foreignKey: 'parentId', as: 'children' });
  Promoter.belongsTo(Promoter, { foreignKey: 'parentId', as: 'parent' });
  Promoter.hasMany(PromoterAuditLog, { foreignKey: 'promoterId', as: 'auditLogs' });
  Promoter.hasMany(PromoterChangeLog, { foreignKey: 'promoterId', as: 'changeLogs' });
  Promoter.hasMany(PromoterQualification, { foreignKey: 'promoterId', as: 'qualifications' });
  Promoter.belongsTo(User, { foreignKey: 'firstAuditorId', as: 'firstAuditor' });
  Promoter.belongsTo(User, { foreignKey: 'secondAuditorId', as: 'secondAuditor' });

  Order.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Order.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Order.hasOne(Commission, { foreignKey: 'orderId', as: 'commission' });

  Commission.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  Commission.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  Commission.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles' });

  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });

  PromoterAuditLog.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterChangeLog.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterQualification.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });

  Promoter.hasMany(PromoterLevelAdjustRequest, { foreignKey: 'promoterId', as: 'levelAdjustRequests' });
  Promoter.hasMany(PromoterLevelChangeLog, { foreignKey: 'promoterId', as: 'levelChangeLogs' });
  Promoter.hasMany(PromoterRiskRecord, { foreignKey: 'promoterId', as: 'riskRecords' });
  Promoter.hasMany(PromoterRiskRelease, { foreignKey: 'promoterId', as: 'riskReleases' });
  Promoter.hasMany(PromoterRiskBehavior, { foreignKey: 'promoterId', as: 'riskBehaviors' });
  Promoter.hasMany(PromoterRiskWarning, { foreignKey: 'promoterId', as: 'riskWarnings' });
  PromoterLevelAdjustRequest.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterLevelChangeLog.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterRiskRecord.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterRiskRelease.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterRiskBehavior.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  PromoterRiskWarning.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
};

export { associate };
export { User, Channel, Promoter, Order, Commission, Marketing, Withdraw, Role, Permission, RolePermission, UserRole, OperationLog, ChannelExtension, CommissionRule, RoleDeletionLog, PromoterBlacklist, PromoterAuditLog, PromoterChangeLog, PromoterQualification, PromoterLevelRule, PromoterLevelAdjustRequest, PromoterLevelChangeLog, PromoterRiskRecord, PromoterRiskRelease, PromoterRiskBehavior, PromoterRiskWarning };
export default models;
