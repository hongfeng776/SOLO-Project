import { sequelize } from '../config/database';
import User from './User';
import Role from './Role';
import Permission from './Permission';
import UserRole from './UserRole';
import RolePermission from './RolePermission';
import StockQuote from './StockQuote';
import StockQuoteHistory from './StockQuoteHistory';
import QuoteAuditTrail from './QuoteAuditTrail';
import AssetProduct from './AssetProduct';
import CustomerAsset from './CustomerAsset';
import FundFlow from './FundFlow';
import ComplianceAudit from './ComplianceAudit';
import Trade from './Trade';
import CustomerHolding from './CustomerHolding';
import RiskAlert from './RiskAlert';
import OperationLog from './OperationLog';
import QuoteThreshold from './QuoteThreshold';
import QuoteThresholdHistory from './QuoteThresholdHistory';
import ReplaySession from './ReplaySession';
import ReplayConclusion from './ReplayConclusion';

const db = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  StockQuote,
  StockQuoteHistory,
  QuoteAuditTrail,
  AssetProduct,
  CustomerAsset,
  FundFlow,
  ComplianceAudit,
  Trade,
  CustomerHolding,
  RiskAlert,
  OperationLog,
  QuoteThreshold,
  QuoteThresholdHistory,
  ReplaySession,
  ReplayConclusion,
};

const setupAssociations = () => {
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'perm_id', as: 'permissions' });
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'perm_id', otherKey: 'role_id', as: 'roles' });
  QuoteThreshold.hasMany(QuoteThresholdHistory, { foreignKey: 'threshold_id', as: 'history' });
  QuoteThresholdHistory.belongsTo(QuoteThreshold, { foreignKey: 'threshold_id', as: 'threshold' });
  ReplaySession.hasMany(ReplayConclusion, { as: 'conclusions', foreignKey: 'session_id' });
  ReplayConclusion.belongsTo(ReplaySession, { foreignKey: 'session_id', as: 'session' });
};

setupAssociations();

export { db };
