const authRouter = require('./auth')
const orderRouter = require('./order')
const driverRouter = require('./driver')
const vehicleRouter = require('./vehicle')
const passengerRouter = require('./passenger')
const capacityRouter = require('./capacity')
const financeRouter = require('./finance')
const systemRouter = require('./system')
const dashboardRouter = require('./dashboard')
const riskRouter = require('./risk')
const ticketRouter = require('./ticket')
const couponRouter = require('./coupon')
const marketingRouter = require('./marketing')
const notificationRouter = require('./notification')
const analyticsRouter = require('./analytics')
const monitorRouter = require('./monitor')
const pricingRouter = require('./pricing')
const afterSaleRouter = require('./after-sale')

module.exports = {
  auth: authRouter,
  order: orderRouter,
  driver: driverRouter,
  vehicle: vehicleRouter,
  passenger: passengerRouter,
  capacity: capacityRouter,
  finance: financeRouter,
  system: systemRouter,
  dashboard: dashboardRouter,
  risk: riskRouter,
  ticket: ticketRouter,
  coupon: couponRouter,
  marketing: marketingRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  monitor: monitorRouter,
  pricing: pricingRouter,
  afterSale: afterSaleRouter
}
