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
  UserStatusLog
}
