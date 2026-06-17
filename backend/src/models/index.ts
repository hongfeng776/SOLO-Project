import User from './user'
import Role from './role'
import Note from './note'
import Tag from './tag'
import Category from './category'
import TagUsageLog from './tag-usage-log'
import Creator from './creator'
import Activity from './activity'
import Order from './order'
import Comment from './comment'
import ViolationRecord from './violation-record'
import ResourceSlot from './resource-slot'
import OperationLog from './operation-log'
import Notification from './notification'
import Feedback from './feedback'
import Settlement from './settlement'
import NoteBatchRecord from './note-batch-record'
import NoteComplianceLog from './note-compliance-log'
import PublishAbnormalLog from './publish-abnormal-log'
import ReviewLog from './review-log'
import ReviewAbnormalLog from './review-abnormal-log'
import NoteOpsLog from './note-ops-log'
import NoteOpsAbnormalLog from './note-ops-abnormal-log'
import UserAccountLog from './user-account-log'
import UserAbnormalLog from './user-abnormal-log'

const UserRole = User.sequelize!.define('sys_user_role', {}, { tableName: 'sys_user_role', timestamps: false })
const NoteTag = Note.sequelize!.define('biz_note_tag', {}, { tableName: 'biz_note_tag', timestamps: false })

User.belongsToMany(Role, { through: UserRole, as: 'roles', foreignKey: 'user_id' })
Role.belongsToMany(User, { through: UserRole, as: 'users', foreignKey: 'role_id' })

Note.belongsToMany(Tag, { through: NoteTag, as: 'tags', foreignKey: 'note_id' })
Tag.belongsToMany(Note, { through: NoteTag, as: 'notes', foreignKey: 'tag_id' })

Category.hasMany(Tag, { as: 'tags', foreignKey: 'categoryId' })
Tag.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' })

User.hasMany(UserAccountLog, { as: 'accountLogs', foreignKey: 'userId' })
UserAccountLog.belongsTo(User, { as: 'user', foreignKey: 'userId' })

User.hasMany(UserAbnormalLog, { as: 'abnormalLogs', foreignKey: 'userId' })
UserAbnormalLog.belongsTo(User, { as: 'user', foreignKey: 'userId' })

export { User, Role, Note, Tag, Category, TagUsageLog, Creator, Activity, Order, Comment, ViolationRecord, ResourceSlot, OperationLog, Notification, Feedback, Settlement, NoteBatchRecord, NoteComplianceLog, PublishAbnormalLog, ReviewLog, ReviewAbnormalLog, NoteOpsLog, NoteOpsAbnormalLog, UserAccountLog, UserAbnormalLog, UserRole, NoteTag }
