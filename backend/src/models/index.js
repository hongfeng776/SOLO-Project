const { User, Role } = require('./User');
const { Content } = require('./Content');
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
Comment.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });

Comment.belongsTo(User, { foreignKey: 'user_id', as: 'commentUser' });
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

Member.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Advertisement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Activity.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  User,
  Role,
  Content,
  ContentStatusLog,
  Copyright,
  Advertisement,
  Activity,
  Comment,
  Member,
  Message,
  OperationLog,
};
