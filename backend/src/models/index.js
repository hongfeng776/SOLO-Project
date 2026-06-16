const User = require('./User')
const Role = require('./Role')
const Order = require('./Order')
const Driver = require('./Driver')
const Passenger = require('./Passenger')
const Vehicle = require('./Vehicle')
const CapacityType = require('./CapacityType')
const FinanceStatement = require('./FinanceStatement')
const FinanceSettlement = require('./FinanceSettlement')

Driver.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' })
Vehicle.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })

Order.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })
Order.belongsTo(Passenger, { foreignKey: 'passengerId', as: 'passenger' })
Order.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' })

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

FinanceSettlement.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })

module.exports = {
  User,
  Role,
  Order,
  Driver,
  Passenger,
  Vehicle,
  CapacityType,
  FinanceStatement,
  FinanceSettlement
}
