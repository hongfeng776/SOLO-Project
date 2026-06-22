const User = require('./User')
const Category = require('./Category')
const Resource = require('./Resource')
const Template = require('./Template')
const AuditRecord = require('./AuditRecord')
const Member = require('./Member')
const Violation = require('./Violation')
const Appeal = require('./Appeal')
const Notification = require('./Notification')
const OperationLog = require('./OperationLog')
const Recycle = require('./Recycle')
const UserEditLog = require('./UserEditLog')
const AccountComplianceLog = require('./AccountComplianceLog')
const UserStatusLog = require('./UserStatusLog')
const TagDefinition = require('./TagDefinition')
const MemberLevelLog = require('./MemberLevelLog')
const MemberTagLog = require('./MemberTagLog')
const LoginLog = require('./LoginLog')
const LoginDevice = require('./LoginDevice')
const LoginRiskReport = require('./LoginRiskReport')
const Role = require('./Role')
const PermissionMenu = require('./PermissionMenu')
const RolePermission = require('./RolePermission')
const RolePermissionLog = require('./RolePermissionLog')
const AccountPermission = require('./AccountPermission')
const AccountPermissionLog = require('./AccountPermissionLog')
const SystemLog = require('./SystemLog')
const CronLog = require('./CronLog')
const ServerMonitor = require('./ServerMonitor')
const FilterEffect = require('./FilterEffect')
const FilterEditLog = require('./FilterEditLog')
const FilterCategoryAdapt = require('./FilterCategoryAdapt')
const FilterWeightLog = require('./FilterWeightLog')
const FeaturedWork = require('./FeaturedWork')
const FeaturedWorkLog = require('./FeaturedWorkLog')
const ResourceVisibilityLog = require('./ResourceVisibilityLog')
const QualityAssessmentLog = require('./QualityAssessmentLog')
const QualityReviewLog = require('./QualityReviewLog')
const ResourceDataSnapshot = require('./ResourceDataSnapshot')
const DataQueryLog = require('./DataQueryLog')

User.hasMany(Resource, { foreignKey: 'authorId', as: 'resources' })
Resource.belongsTo(User, { foreignKey: 'authorId', as: 'author' })

Category.hasMany(Resource, { foreignKey: 'categoryId', as: 'resources' })
Resource.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

Category.hasMany(Template, { foreignKey: 'categoryId', as: 'templates' })
Template.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

User.hasMany(AuditRecord, { foreignKey: 'auditorId', as: 'auditRecords' })
AuditRecord.belongsTo(User, { foreignKey: 'auditorId', as: 'auditor' })

User.hasOne(Member, { foreignKey: 'userId', as: 'member' })
Member.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' })
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' })

Resource.hasMany(Violation, { foreignKey: 'resourceId', as: 'violations' })
Violation.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })

User.hasMany(Violation, { foreignKey: 'authorId', as: 'violations' })
Violation.belongsTo(User, { foreignKey: 'authorId', as: 'author' })

Violation.hasOne(Appeal, { foreignKey: 'violationId', as: 'appeal' })
Appeal.belongsTo(Violation, { foreignKey: 'violationId', as: 'violation' })

Resource.hasMany(Appeal, { foreignKey: 'resourceId', as: 'appeals' })
Appeal.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })

User.hasMany(Appeal, { foreignKey: 'appellantId', as: 'appeals' })
Appeal.belongsTo(User, { foreignKey: 'appellantId', as: 'appellant' })

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' })
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(OperationLog, { foreignKey: 'userId', as: 'operationLogs' })
OperationLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Resource.hasMany(Recycle, { foreignKey: 'resourceId', as: 'recycles' })
Recycle.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })

User.hasMany(UserEditLog, { foreignKey: 'userId', as: 'editLogs' })
UserEditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(AccountComplianceLog, { foreignKey: 'userId', as: 'complianceLogs' })
AccountComplianceLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(UserStatusLog, { foreignKey: 'userId', as: 'statusLogs' })
UserStatusLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasOne(MemberLevelLog, { foreignKey: 'userId', as: 'memberLevelLogs' })
MemberLevelLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(MemberTagLog, { foreignKey: 'userId', as: 'memberTagLogs' })
MemberTagLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(LoginLog, { foreignKey: 'userId', as: 'loginLogs' })
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(LoginDevice, { foreignKey: 'userId', as: 'loginDevices' })
LoginDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(LoginRiskReport, { foreignKey: 'userId', as: 'loginRiskReports' })
LoginRiskReport.belongsTo(User, { foreignKey: 'userId', as: 'user' })

LoginRiskReport.belongsTo(LoginLog, { foreignKey: 'loginLogId', as: 'loginLog' })

Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' })
RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })
PermissionMenu.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'rolePermissions' })
RolePermission.belongsTo(PermissionMenu, { foreignKey: 'permissionId', as: 'permission' })
PermissionMenu.hasMany(PermissionMenu, { foreignKey: 'parentId', as: 'children' })
PermissionMenu.belongsTo(PermissionMenu, { foreignKey: 'parentId', as: 'parent' })
Role.hasMany(RolePermissionLog, { foreignKey: 'roleId', as: 'permissionLogs' })
RolePermissionLog.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

User.hasMany(AccountPermission, { foreignKey: 'userId', as: 'accountPermissions' })
AccountPermission.belongsTo(User, { foreignKey: 'userId', as: 'user' })
AccountPermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })
AccountPermission.belongsTo(PermissionMenu, { foreignKey: 'permissionId', as: 'permission' })
User.hasMany(AccountPermissionLog, { foreignKey: 'userId', as: 'accountPermLogs' })
AccountPermissionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' })
AccountPermissionLog.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

CronLog.belongsTo(CronLog, { foreignKey: 'parentLogId', as: 'parentLog' })
CronLog.hasMany(CronLog, { foreignKey: 'parentLogId', as: 'retryLogs' })

User.hasMany(FilterEffect, { foreignKey: 'authorId', as: 'filterEffects' })
FilterEffect.belongsTo(User, { foreignKey: 'authorId', as: 'author' })
Category.hasMany(FilterEffect, { foreignKey: 'categoryId', as: 'filterEffects' })
FilterEffect.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
FilterEffect.hasMany(FilterEditLog, { foreignKey: 'filterId', as: 'editLogs' })
FilterEditLog.belongsTo(FilterEffect, { foreignKey: 'filterId', as: 'filter' })
FilterEffect.hasMany(FilterCategoryAdapt, { foreignKey: 'filterId', as: 'categoryAdapts' })
FilterCategoryAdapt.belongsTo(FilterEffect, { foreignKey: 'filterId', as: 'filter' })
Category.hasMany(FilterCategoryAdapt, { foreignKey: 'categoryId', as: 'filterAdapts' })
FilterCategoryAdapt.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
FilterEffect.hasMany(FilterWeightLog, { foreignKey: 'filterId', as: 'weightLogs' })
FilterWeightLog.belongsTo(FilterEffect, { foreignKey: 'filterId', as: 'filter' })

Resource.hasOne(FeaturedWork, { foreignKey: 'resourceId', as: 'featuredWork' })
FeaturedWork.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })
FeaturedWork.belongsTo(User, { foreignKey: 'authorId', as: 'author' })
FeaturedWork.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
FeaturedWork.hasMany(FeaturedWorkLog, { foreignKey: 'featuredId', as: 'operationLogs' })
FeaturedWorkLog.belongsTo(FeaturedWork, { foreignKey: 'featuredId', as: 'featuredWork' })
FeaturedWorkLog.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })

Resource.hasMany(ResourceVisibilityLog, { foreignKey: 'resourceId', as: 'visibilityLogs' })
ResourceVisibilityLog.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })
ResourceVisibilityLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' })

Resource.hasMany(QualityAssessmentLog, { foreignKey: 'resourceId', as: 'qualityAssessmentLogs' })
QualityAssessmentLog.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })
QualityAssessmentLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' })

Resource.hasMany(QualityReviewLog, { foreignKey: 'resourceId', as: 'qualityReviewLogs' })
QualityReviewLog.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })
QualityReviewLog.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' })
QualityReviewLog.belongsTo(QualityAssessmentLog, { foreignKey: 'assessmentLogId', as: 'assessmentLog' })

Resource.hasMany(ResourceDataSnapshot, { foreignKey: 'resourceId', as: 'dataSnapshots' })
ResourceDataSnapshot.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' })

DataQueryLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' })

module.exports = {
  User,
  Category,
  Resource,
  Template,
  AuditRecord,
  Member,
  Violation,
  Appeal,
  Notification,
  OperationLog,
  Recycle,
  UserEditLog,
  AccountComplianceLog,
  UserStatusLog,
  TagDefinition,
  MemberLevelLog,
  MemberTagLog,
  LoginLog,
  LoginDevice,
  LoginRiskReport,
  Role,
  PermissionMenu,
  RolePermission,
  RolePermissionLog,
  AccountPermission,
  AccountPermissionLog,
  SystemLog,
  CronLog,
  ServerMonitor,
  FilterEffect,
  FilterEditLog,
  FilterCategoryAdapt,
  FilterWeightLog,
  FeaturedWork,
  FeaturedWorkLog,
  ResourceVisibilityLog,
  QualityAssessmentLog,
  QualityReviewLog,
  ResourceDataSnapshot,
  DataQueryLog
}
