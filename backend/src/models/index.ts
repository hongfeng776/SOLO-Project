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
import CommentAuditLog from './comment-audit-log'
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
import UserLevelLog from './user-level-log'
import UserLevelConfig from './user-level-config'
import BehaviorLog from './behavior-log'
import RiskControlLog from './risk-control-log'
import PunishmentRecord from './punishment-record'
import ActivityScoreLog from './activity-score-log'
import ActivityOperationStrategy from './activity-operation-strategy'
import ActivityOperationRecord from './activity-operation-record'
import CreatorQualificationApply from './creator-qualification-apply'
import CreatorQualificationLog from './creator-qualification-log'
import CreatorBenefitConfig from './creator-benefit-config'
import MerchantOnboardingApply from './merchant-onboarding-apply'
import MerchantOnboardingLog from './merchant-onboarding-log'
import MerchantCreditArchive from './merchant-credit-archive'
import DirectMessage from './direct-message'
import DmConversation from './dm-conversation'
import DmAuditLog from './dm-audit-log'
import InteractionData from './interaction-data'
import InteractionAnomalyLog from './interaction-anomaly-log'
import HotComment from './hot-comment'
import HotCommentLog from './hot-comment-log'
import TrafficPool from './traffic-pool'
import TrafficPoolLog from './traffic-pool-log'
import ContentPushTask from './content-push-task'
import ContentPushTrace from './content-push-trace'
import TrafficWeightRule from './traffic-weight-rule'
import TrafficWeightRuleLog from './traffic-weight-rule-log'
import TrafficAnomalyRecord from './traffic-anomaly-record'
import TrafficAnomalyHandleLog from './traffic-anomaly-handle-log'
import ActivityAuditLog from './activity-audit-log'
import ActivityTemplate from './activity-template'

ActivityTemplate.hasMany(Activity, { as: 'activities', foreignKey: 'templateId' })
Activity.belongsTo(ActivityTemplate, { as: 'template', foreignKey: 'templateId' })

Activity.hasMany(ActivityAuditLog, { as: 'auditLogs', foreignKey: 'activityId' })
ActivityAuditLog.belongsTo(Activity, { as: 'activity', foreignKey: 'activityId' })

TrafficPool.hasMany(TrafficPoolLog, { as: 'logs', foreignKey: 'poolId' })
TrafficPoolLog.belongsTo(TrafficPool, { as: 'pool', foreignKey: 'poolId' })

TrafficPool.hasMany(ContentPushTask, { as: 'pushTasks', foreignKey: 'poolId' })
ContentPushTask.belongsTo(TrafficPool, { as: 'pool', foreignKey: 'poolId' })
Note.hasMany(ContentPushTask, { as: 'pushTasks', foreignKey: 'noteId' })
ContentPushTask.belongsTo(Note, { as: 'note', foreignKey: 'noteId' })
ContentPushTask.hasMany(ContentPushTrace, { as: 'traces', foreignKey: 'taskId' })
ContentPushTrace.belongsTo(ContentPushTask, { as: 'task', foreignKey: 'taskId' })

TrafficWeightRule.hasMany(TrafficWeightRuleLog, { as: 'logs', foreignKey: 'ruleId' })
TrafficWeightRuleLog.belongsTo(TrafficWeightRule, { as: 'rule', foreignKey: 'ruleId' })

TrafficAnomalyRecord.hasMany(TrafficAnomalyHandleLog, { as: 'handleLogs', foreignKey: 'anomalyId' })
TrafficAnomalyHandleLog.belongsTo(TrafficAnomalyRecord, { as: 'anomaly', foreignKey: 'anomalyId' })

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

User.hasMany(UserLevelLog, { as: 'levelLogs', foreignKey: 'userId' })
UserLevelLog.belongsTo(User, { as: 'user', foreignKey: 'userId' })

User.hasMany(BehaviorLog, { as: 'behaviorLogs', foreignKey: 'userId' })
BehaviorLog.belongsTo(User, { as: 'user', foreignKey: 'userId' })

User.hasMany(RiskControlLog, { as: 'riskControlLogs', foreignKey: 'userId' })
RiskControlLog.belongsTo(User, { as: 'user', foreignKey: 'userId' })

User.hasMany(PunishmentRecord, { as: 'punishmentRecords', foreignKey: 'userId' })
PunishmentRecord.belongsTo(User, { as: 'user', foreignKey: 'userId' })

User.hasMany(ActivityScoreLog, { as: 'activityScoreLogs', foreignKey: 'userId' })
ActivityScoreLog.belongsTo(User, { as: 'user', foreignKey: 'userId' })

User.hasMany(ActivityOperationRecord, { as: 'activityOperationRecords', foreignKey: 'userId' })
ActivityOperationRecord.belongsTo(User, { as: 'user', foreignKey: 'userId' })

Creator.hasMany(CreatorQualificationApply, { as: 'qualificationApplies', foreignKey: 'creatorId' })
CreatorQualificationApply.belongsTo(Creator, { as: 'creator', foreignKey: 'creatorId' })

Creator.hasMany(CreatorQualificationLog, { as: 'qualificationLogs', foreignKey: 'creatorId' })
CreatorQualificationLog.belongsTo(Creator, { as: 'creator', foreignKey: 'creatorId' })

CreatorQualificationApply.hasMany(CreatorQualificationLog, { as: 'logs', foreignKey: 'applyId' })
CreatorQualificationLog.belongsTo(CreatorQualificationApply, { as: 'apply', foreignKey: 'applyId' })

Creator.hasOne(CreatorBenefitConfig, { as: 'benefitConfig', foreignKey: 'creatorId' })
CreatorBenefitConfig.belongsTo(Creator, { as: 'creator', foreignKey: 'creatorId' })

MerchantOnboardingApply.hasMany(MerchantOnboardingLog, { as: 'logs', foreignKey: 'applyId' })
MerchantOnboardingLog.belongsTo(MerchantOnboardingApply, { as: 'apply', foreignKey: 'applyId' })

MerchantOnboardingApply.hasOne(MerchantCreditArchive, { as: 'creditArchive', foreignKey: 'applyId' })
MerchantCreditArchive.belongsTo(MerchantOnboardingApply, { as: 'apply', foreignKey: 'applyId' })

Note.hasMany(Comment, { as: 'comments', foreignKey: 'noteId' })
Comment.belongsTo(Note, { as: 'note', foreignKey: 'noteId' })

Comment.hasMany(CommentAuditLog, { as: 'auditLogs', foreignKey: 'commentId' })
CommentAuditLog.belongsTo(Comment, { as: 'comment', foreignKey: 'commentId' })

DmConversation.hasMany(DirectMessage, { as: 'messages', foreignKey: 'conversationId' })
DirectMessage.belongsTo(DmConversation, { as: 'conversation', foreignKey: 'conversationId' })

DirectMessage.hasMany(DmAuditLog, { as: 'auditLogs', foreignKey: 'messageId' })
DmAuditLog.belongsTo(DirectMessage, { as: 'message', foreignKey: 'messageId' })

DmConversation.hasMany(DmAuditLog, { as: 'conversationAuditLogs', foreignKey: 'conversationId' })
DmAuditLog.belongsTo(DmConversation, { as: 'dmConversation', foreignKey: 'conversationId' })

Note.hasMany(InteractionData, { as: 'interactionData', foreignKey: 'noteId' })
InteractionData.belongsTo(Note, { as: 'note', foreignKey: 'noteId' })

InteractionData.hasMany(InteractionAnomalyLog, { as: 'anomalyLogs', foreignKey: 'interactionDataId' })
InteractionAnomalyLog.belongsTo(InteractionData, { as: 'interactionData', foreignKey: 'interactionDataId' })

Note.hasMany(InteractionAnomalyLog, { as: 'interactionAnomalyLogs', foreignKey: 'noteId' })
InteractionAnomalyLog.belongsTo(Note, { as: 'note', foreignKey: 'noteId' })

Comment.hasOne(HotComment, { as: 'hotComment', foreignKey: 'commentId' })
HotComment.belongsTo(Comment, { as: 'comment', foreignKey: 'commentId' })
Note.hasMany(HotComment, { as: 'hotComments', foreignKey: 'noteId' })
HotComment.belongsTo(Note, { as: 'note', foreignKey: 'noteId' })
HotComment.hasMany(HotCommentLog, { as: 'logs', foreignKey: 'hotCommentId' })
HotCommentLog.belongsTo(HotComment, { as: 'hotComment', foreignKey: 'hotCommentId' })
Comment.hasMany(HotCommentLog, { as: 'hotLogs', foreignKey: 'commentId' })
HotCommentLog.belongsTo(Comment, { as: 'comment', foreignKey: 'commentId' })

export { User, Role, Note, Tag, Category, TagUsageLog, Creator, Activity, Order, Comment, CommentAuditLog, ViolationRecord, ResourceSlot, OperationLog, Notification, Feedback, Settlement, NoteBatchRecord, NoteComplianceLog, PublishAbnormalLog, ReviewLog, ReviewAbnormalLog, NoteOpsLog, NoteOpsAbnormalLog, UserAccountLog, UserAbnormalLog, UserLevelLog, UserLevelConfig, BehaviorLog, RiskControlLog, PunishmentRecord, ActivityScoreLog, ActivityOperationStrategy, ActivityOperationRecord, CreatorQualificationApply, CreatorQualificationLog, CreatorBenefitConfig, MerchantOnboardingApply, MerchantOnboardingLog, MerchantCreditArchive, DirectMessage, DmConversation, DmAuditLog, InteractionData, InteractionAnomalyLog, HotComment, HotCommentLog, TrafficPool, TrafficPoolLog, ContentPushTask, ContentPushTrace, TrafficWeightRule, TrafficWeightRuleLog, TrafficAnomalyRecord, TrafficAnomalyHandleLog, ActivityAuditLog, ActivityTemplate, UserRole, NoteTag }
