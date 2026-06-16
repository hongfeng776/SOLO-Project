const { User, Role } = require('./User');
const { Content } = require('./Content');
const { Copyright } = require('./Copyright');
const { Advertisement } = require('./Advertisement');
const { Activity } = require('./Activity');

Content.belongsTo(Copyright, { foreignKey: 'copyright_id', as: 'copyright' });
Copyright.hasMany(Content, { foreignKey: 'copyright_id', as: 'contents' });

module.exports = {
  User,
  Role,
  Content,
  Copyright,
  Advertisement,
  Activity,
};
