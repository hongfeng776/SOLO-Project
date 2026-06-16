import User from './User.model';
import Channel from './Channel.model';
import Promoter from './Promoter.model';
import Order from './Order.model';
import Commission from './Commission.model';
import Marketing from './Marketing.model';
import Withdraw from './Withdraw.model';
import Role from './Role.model';
import Permission from './Permission.model';
import RolePermission from './RolePermission.model';
import UserRole from './UserRole.model';
import OperationLog from './OperationLog.model';
import ChannelExtension from './ChannelExtension.model';
import CommissionRule from './CommissionRule.model';

const models = {
  User,
  Channel,
  Promoter,
  Order,
  Commission,
  Marketing,
  Withdraw,
  Role,
  Permission,
  RolePermission,
  UserRole,
  OperationLog,
  ChannelExtension,
  CommissionRule,
};

const associate = (): void => {
  Channel.hasMany(Promoter, { foreignKey: 'channelId', as: 'promoters' });
  Channel.hasMany(Order, { foreignKey: 'channelId', as: 'orders' });
  Channel.hasMany(ChannelExtension, { foreignKey: 'channelId', as: 'extensions' });

  ChannelExtension.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Promoter.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Promoter.hasMany(Order, { foreignKey: 'promoterId', as: 'orders' });
  Promoter.hasMany(Commission, { foreignKey: 'promoterId', as: 'commissions' });
  Promoter.hasMany(Withdraw, { foreignKey: 'promoterId', as: 'withdraws' });
  Promoter.hasMany(Promoter, { foreignKey: 'parentId', as: 'children' });
  Promoter.belongsTo(Promoter, { foreignKey: 'parentId', as: 'parent' });

  Order.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Order.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Order.hasOne(Commission, { foreignKey: 'orderId', as: 'commission' });

  Commission.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
  Commission.belongsTo(Promoter, { foreignKey: 'promoterId', as: 'promoter' });
  Commission.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles' });

  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });
};

export { associate };
export { User, Channel, Promoter, Order, Commission, Marketing, Withdraw, Role, Permission, RolePermission, UserRole, OperationLog, ChannelExtension, CommissionRule };
export default models;
