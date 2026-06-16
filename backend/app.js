require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')

const { errorHandler, notFound } = require('./src/middleware/errorHandler')
const { authenticate } = require('./src/middleware/auth')
const routes = require('./src/routes')
const { sequelize, testConnection } = require('./src/config/database')

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('dev'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
})
app.use(limiter)

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

app.use('/auth', routes.auth)
app.use(authenticate)
app.use('/order', routes.order)
app.use('/driver', routes.driver)
app.use('/vehicle', routes.vehicle)
app.use('/passenger', routes.passenger)
app.use('/capacity', routes.capacity)
app.use('/finance', routes.finance)
app.use('/system', routes.system)
app.use('/dashboard', routes.dashboard)

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  try {
    await testConnection()
    console.log('数据库连接成功')
    
    await sequelize.sync({ alter: false })
    console.log('数据库模型同步完成')
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`)
      console.log(`环境: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app
