const User = require('./User')
const Role = require('./Role')
const Order = require('./Order')
const Driver = require('./Driver')
const Passenger = require('./Passenger')
const Vehicle = require('./Vehicle')
const CapacityType = require('./CapacityType')
const FinanceStatement = require('./FinanceStatement')
const FinanceSettlement = require('./FinanceSettlement')
const Coupon = require('./Coupon')
const Ticket = require('./Ticket')
const RiskRule = require('./RiskRule')
const RiskRecord = require('./RiskRecord')
const Notification = require('./Notification')
const OperationLog = require('./OperationLog')
const MarketingCampaign = require('./MarketingCampaign')
const OrderStatusLog = require('./OrderStatusLog')
const OrderTraceHistory = require('./OrderTraceHistory')
const TransitionViolation = require('./TransitionViolation')
const PricingRule = require('./PricingRule')
const PricingChangeLog = require('./PricingChangeLog')

Driver.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' })
Vehicle.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })

Order.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })
Order.belongsTo(Passenger, { foreignKey: 'passengerId', as: 'passenger' })
Order.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' })
Order.hasMany(OrderStatusLog, { foreignKey: 'orderId', as: 'statusLogs' })
Order.hasMany(Ticket, { foreignKey: 'orderId', as: 'tickets' })
Order.hasMany(FinanceStatement, { foreignKey: 'orderNo', sourceKey: 'orderNo', as: 'statements' })
Order.hasMany(TransitionViolation, { foreignKey: 'orderId', as: 'violations' })
Order.hasMany(PricingChangeLog, { foreignKey: 'orderId', as: 'pricingLogs' })

User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleInfo' })

FinanceSettlement.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })

OrderStatusLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
OrderTraceHistory.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
TransitionViolation.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
PricingChangeLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
PricingChangeLog.belongsTo(PricingRule, { foreignKey: 'ruleId', as: 'pricingRule' })

module.exports = {
  User,
  Role,
  Order,
  Driver,
  Passenger,
  Vehicle,
  CapacityType,
  FinanceStatement,
  FinanceSettlement,
  Coupon,
  Ticket,
  RiskRule,
  RiskRecord,
  Notification,
  OperationLog,
  MarketingCampaign,
  OrderStatusLog,
  OrderTraceHistory,
  TransitionViolation,
  PricingRule,
  PricingChangeLog
}
