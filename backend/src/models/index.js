const User = require('./User')
const Category = require('./Category')
const Resource = require('./Resource')
const Template = require('./Template')
const AuditRecord = require('./AuditRecord')
const Member = require('./Member')

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

module.exports = {
  User,
  Category,
  Resource,
  Template,
  AuditRecord,
  Member
}
