const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config')
const { testConnection, syncDatabase } = require('./models/db')
const routes = require('./routes')
const { notFoundHandler, errorHandler } = require('./middlewares/error')

const app = express()

app.use(cors(config.cors))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/uploads', express.static(path.join(__dirname, '..', '..', config.upload.dir)))

app.use('/api', routes)

app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '影创智修后台管理系统 API',
    version: '1.0.0',
    timestamp: Date.now()
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

const startServer = async () => {
  try {
    await testConnection()

    await syncDatabase(false)

    app.listen(config.app.port, () => {
      console.log(`\n========================================`)
      console.log(`🚀 服务器启动成功!`)
      console.log(`📍 服务地址: http://localhost:${config.app.port}`)
      console.log(`🌐 环境: ${config.app.env}`)
      console.log(`📚 API前缀: /api`)
      console.log(`========================================\n`)
    })
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app
