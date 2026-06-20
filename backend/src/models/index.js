const { User, Role } = require('./User');
const { Content } = require('./Content');
const { ArticleVersion } = require('./ArticleVersion');
const { ContentStatusLog } = require('./ContentStatusLog');
const { Copyright } = require('./Copyright');
const { CopyrightValidity, CopyrightValidityLog, CopyrightValidityTask } = require('./CopyrightValidity');
const { Advertisement } = require('./Advertisement');
const { Activity } = require('./Activity');
const { Comment } = require('./Comment');
const { Member } = require('./Member');
const { Message } = require('./Message');
const { OperationLog } = require('./OperationLog');
const { Topic } = require('./Topic');
const { TopicContent } = require('./TopicContent');
const { AuditRule } = require('./AuditRule');
const { AuditRuleModifyLog } = require('./AuditRuleModifyLog');
const { EndUser, AccountStatusLog } = require('./EndUser');
const { MemberLevel, MemberLevelLog, MemberLevelUpgradeRecord } = require('./MemberLevel');
const { UserSegmentRule, UserSegmentTag, UserSegmentLog, SegmentStrategy,
  SEGMENT_DIMENSION, SEGMENT_LEVEL, SEGMENT_RULE_STATUS, SEGMENT_CHANGE_TYPE,
  STRATEGY_TRIGGER_MODE, STRATEGY_STATUS, STRATEGY_TYPE, BENEFIT_TYPE,
} = require('./UserSegment');
const { FeedbackRecord, FeedbackLog, FeedbackArchive,
  FEEDBACK_TYPE, FEEDBACK_STATUS, FEEDBACK_PRIORITY, FEEDBACK_SOURCE,
  FEEDBACK_BATCH_ACTION, FEEDBACK_TIMELINESS, PRIORITY_TIMEOUT_HOURS,
} = require('./UserFeedback');

Content.belongsTo(Copyright, { foreignKey: 'copyright_id', as: 'copyright' });
Copyright.hasMany(Content, { foreignKey: 'copyright_id', as: 'contents' });

Content.hasMany(Comment, { foreignKey: 'content_id', as: 'comments' });

Advertisement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Activity.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

AuditRule.hasMany(AuditRuleModifyLog, { foreignKey: 'rule_id', as: 'modifyLogs' });
AuditRuleModifyLog.belongsTo(AuditRule, { foreignKey: 'rule_id', as: 'auditRule' });

CopyrightValidity.hasMany(CopyrightValidityLog, { foreignKey: 'config_id', as: 'logs' });
CopyrightValidityLog.belongsTo(CopyrightValidity, { foreignKey: 'config_id', as: 'config' });
CopyrightValidity.hasMany(CopyrightValidityTask, { foreignKey: 'config_id', as: 'tasks' });
CopyrightValidityTask.belongsTo(CopyrightValidity, { foreignKey: 'config_id', as: 'config' });

MemberLevel.hasMany(MemberLevelLog, { foreignKey: 'level_id', as: 'modifyLogs' });
MemberLevelLog.belongsTo(MemberLevel, { foreignKey: 'level_id', as: 'level' });

MemberLevel.hasMany(MemberLevelUpgradeRecord, { foreignKey: 'from_level_tier', sourceKey: 'levelTier', as: 'fromUpgradeRecords' });
MemberLevel.hasMany(MemberLevelUpgradeRecord, { foreignKey: 'to_level_tier', sourceKey: 'levelTier', as: 'toUpgradeRecords' });
MemberLevelUpgradeRecord.belongsTo(MemberLevel, { foreignKey: 'from_level_tier', targetKey: 'levelTier', as: 'fromLevel' });
MemberLevelUpgradeRecord.belongsTo(MemberLevel, { foreignKey: 'to_level_tier', targetKey: 'levelTier', as: 'toLevel' });

MemberLevel.hasMany(EndUser, { foreignKey: 'member_level', sourceKey: 'levelTier', as: 'levelUsers' });
EndUser.belongsTo(MemberLevel, { foreignKey: 'member_level', targetKey: 'levelTier', as: 'memberLevelInfo' });

module.exports = {
  User,
  Role,
  Content,
  ArticleVersion,
  ContentStatusLog,
  Copyright,
  CopyrightValidity,
  CopyrightValidityLog,
  CopyrightValidityTask,
  Advertisement,
  Activity,
  Comment,
  Member,
  Message,
  OperationLog,
  Topic,
  TopicContent,
  AuditRule,
  AuditRuleModifyLog,
  EndUser,
  AccountStatusLog,
  MemberLevel,
  MemberLevelLog,
  MemberLevelUpgradeRecord,
  UserSegmentRule,
  UserSegmentTag,
  UserSegmentLog,
  SegmentStrategy,
  SEGMENT_DIMENSION,
  SEGMENT_LEVEL,
  SEGMENT_RULE_STATUS,
  SEGMENT_CHANGE_TYPE,
  STRATEGY_TRIGGER_MODE,
  STRATEGY_STATUS,
  STRATEGY_TYPE,
  BENEFIT_TYPE,
  FeedbackRecord,
  FeedbackLog,
  FeedbackArchive,
  FEEDBACK_TYPE,
  FEEDBACK_STATUS,
  FEEDBACK_PRIORITY,
  FEEDBACK_SOURCE,
  FEEDBACK_BATCH_ACTION,
  FEEDBACK_TIMELINESS,
  PRIORITY_TIMEOUT_HOURS,
};
