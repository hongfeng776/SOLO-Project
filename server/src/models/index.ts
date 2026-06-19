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
import ChannelAudit from './ChannelAudit.model';
import ChannelAuditLog from './ChannelAuditLog.model';
import ChannelBlacklist from './ChannelBlacklist.model';
import ChannelQualification from './ChannelQualification.model';
import Product from './Product.model';
import ProductAuditLog from './ProductAuditLog.model';
import ProductEditApproval from './ProductEditApproval.model';
import ProductScheduleRule from './ProductScheduleRule.model';
import ProductListingLog from './ProductListingLog.model';

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
  ChannelAudit,
  ChannelAuditLog,
  ChannelBlacklist,
  ChannelQualification,
  Product,
  ProductAuditLog,
  ProductEditApproval,
  ProductScheduleRule,
  ProductListingLog,
};

const associate = (): void => {
  Channel.hasMany(Promoter, { foreignKey: 'channelId', as: 'promoters' });
  Channel.hasMany(Order, { foreignKey: 'channelId', as: 'orders' });
  Channel.hasMany(ChannelExtension, { foreignKey: 'channelId', as: 'extensions' });
  Channel.hasMany(ChannelAudit, { foreignKey: 'channelId', as: 'channelAudits' });

  ChannelExtension.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  ChannelAudit.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  ChannelAudit.hasMany(ChannelAuditLog, { foreignKey: 'channelAuditId', as: 'auditLogs' });
  ChannelAudit.hasMany(ChannelQualification, { foreignKey: 'channelAuditId', as: 'qualifications' });
  ChannelAudit.belongsTo(User, { foreignKey: 'dataAuditorId', as: 'dataAuditor' });
  ChannelAudit.belongsTo(User, { foreignKey: 'qualificationAuditorId', as: 'qualificationAuditor' });
  ChannelAudit.belongsTo(User, { foreignKey: 'permissionAuditorId', as: 'permissionAuditor' });

  ChannelAuditLog.belongsTo(ChannelAudit, { foreignKey: 'channelAuditId', as: 'channelAudit' });
  ChannelQualification.belongsTo(ChannelAudit, { foreignKey: 'channelAuditId', as: 'channelAudit' });

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

  Product.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Product.belongsTo(User, { foreignKey: 'submitterId', as: 'submitter' });
  Product.belongsTo(User, { foreignKey: 'auditorId', as: 'auditor' });
  Product.belongsTo(User, { foreignKey: 'listerId', as: 'lister' });
  Product.belongsTo(User, { foreignKey: 'delisterId', as: 'delister' });
  Product.hasMany(ProductAuditLog, { foreignKey: 'productId', as: 'auditLogs' });

  ProductAuditLog.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  ProductAuditLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });

  Product.hasMany(ProductEditApproval, { foreignKey: 'productId', as: 'editApprovals' });
  ProductEditApproval.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  ProductEditApproval.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
  ProductEditApproval.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

  Product.hasMany(ProductScheduleRule, { foreignKey: 'productId', as: 'scheduleRules' });
  ProductScheduleRule.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  ProductScheduleRule.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

  Product.hasMany(ProductListingLog, { foreignKey: 'productId', as: 'listingLogs' });
  ProductListingLog.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  ProductListingLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
};

export { associate };
export { User, Channel, Promoter, Order, Commission, Marketing, Withdraw, Role, Permission, RolePermission, UserRole, OperationLog, ChannelExtension, CommissionRule, RoleDeletionLog, PromoterBlacklist, PromoterAuditLog, PromoterChangeLog, PromoterQualification, PromoterLevelRule, PromoterLevelAdjustRequest, PromoterLevelChangeLog, PromoterRiskRecord, PromoterRiskRelease, PromoterRiskBehavior, PromoterRiskWarning, ChannelAudit, ChannelAuditLog, ChannelBlacklist, ChannelQualification, Product, ProductAuditLog, ProductEditApproval, ProductScheduleRule, ProductListingLog };
export default models;
