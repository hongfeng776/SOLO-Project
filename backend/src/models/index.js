const { User, Role } = require('./User');
const { Content } = require('./Content');
const { ArticleVersion } = require('./ArticleVersion');
const { ContentStatusLog } = require('./ContentStatusLog');
const { Copyright } = require('./Copyright');
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

Content.belongsTo(Copyright, { foreignKey: 'copyright_id', as: 'copyright' });
Copyright.hasMany(Content, { foreignKey: 'copyright_id', as: 'contents' });

Content.hasMany(Comment, { foreignKey: 'content_id', as: 'comments' });

Advertisement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Activity.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

AuditRule.hasMany(AuditRuleModifyLog, { foreignKey: 'rule_id', as: 'modifyLogs' });
AuditRuleModifyLog.belongsTo(AuditRule, { foreignKey: 'rule_id', as: 'auditRule' });

module.exports = {
  User,
  Role,
  Content,
  ArticleVersion,
  ContentStatusLog,
  Copyright,
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
};
