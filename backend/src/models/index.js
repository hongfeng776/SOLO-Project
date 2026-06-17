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

Content.belongsTo(Copyright, { foreignKey: 'copyright_id', as: 'copyright' });
Copyright.hasMany(Content, { foreignKey: 'copyright_id', as: 'contents' });

Content.hasMany(Comment, { foreignKey: 'content_id', as: 'comments' });

Advertisement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Activity.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

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
};
