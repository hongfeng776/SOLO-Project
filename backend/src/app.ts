import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { errors as celebrateErrors } from 'celebrate'
import { config } from '@config/index'
import { errorHandler } from '@utils/response'
import sequelize from '@config/database'

import authRoutes from '@routes/auth'
import userRoutes from '@routes/user'
import contentRoutes from '@routes/content'
import creatorRoutes from '@routes/creator'
import activityRoutes from '@routes/activity'
import systemRoutes from '@routes/system'
import uploadRoutes from '@routes/upload'

const app = express()

app.use(helmet())
app.use(compression())
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('dev'))

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { code: 429, message: '请求过于频繁，请稍后重试', data: null }
}))

app.use('/uploads', express.static(path.resolve(config.app.uploadDir)))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/creator', creatorRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/upload', uploadRoutes)

app.use(celebrateErrors())
app.use(errorHandler)

const PORT = config.app.port

async function startServer() {
  try {
    await sequelize.authenticate()
    console.log('[DB] 数据库连接成功')

    await sequelize.sync({ alter: config.app.env === 'development' })
    console.log('[DB] 数据库同步完成')

    app.listen(PORT, () => {
      console.log(`[Server] 红途管理后台服务已启动: http://localhost:${PORT}`)
      console.log(`[Server] 运行环境: ${config.app.env}`)
    })
  } catch (error) {
    console.error('[Server] 启动失败:', error)
    process.exit(1)
  }
}

startServer()

process.on('unhandledRejection', (reason) => {
  console.error('[Server] 未处理的Promise拒绝:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[Server] 未捕获的异常:', error)
  process.exit(1)
})

export default app
