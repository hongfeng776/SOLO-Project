import { sequelize } from '../config/database';
import User from './User';
import Role from './Role';
import Permission from './Permission';
import UserRole from './UserRole';
import RolePermission from './RolePermission';
import StockQuote from './StockQuote';
import StockQuoteHistory from './StockQuoteHistory';
import AssetProduct from './AssetProduct';
import CustomerAsset from './CustomerAsset';
import FundFlow from './FundFlow';
import ComplianceAudit from './ComplianceAudit';
import Trade from './Trade';
import CustomerHolding from './CustomerHolding';
import RiskAlert from './RiskAlert';
import OperationLog from './OperationLog';

const db = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  StockQuote,
  StockQuoteHistory,
  AssetProduct,
  CustomerAsset,
  FundFlow,
  ComplianceAudit,
  Trade,
  CustomerHolding,
  RiskAlert,
  OperationLog,
};

const setupAssociations = () => {
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'perm_id', as: 'permissions' });
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'perm_id', otherKey: 'role_id', as: 'roles' });
};

setupAssociations();

export { db };
