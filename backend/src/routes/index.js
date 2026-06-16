const authRouter = require('./auth')
const orderRouter = require('./order')
const driverRouter = require('./driver')
const vehicleRouter = require('./vehicle')
const passengerRouter = require('./passenger')
const capacityRouter = require('./capacity')
const financeRouter = require('./finance')
const systemRouter = require('./system')
const dashboardRouter = require('./dashboard')

module.exports = {
  auth: authRouter,
  order: orderRouter,
  driver: driverRouter,
  vehicle: vehicleRouter,
  passenger: passengerRouter,
  capacity: capacityRouter,
  finance: financeRouter,
  system: systemRouter,
  dashboard: dashboardRouter
}
