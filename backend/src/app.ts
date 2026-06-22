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
import commentRoutes from '@routes/comment'
import violationRoutes from '@routes/violation'
import resourceSlotRoutes from '@routes/resource-slot'
import operationLogRoutes from '@routes/operation-log'
import notificationRoutes from '@routes/notification'
import feedbackRoutes from '@routes/feedback'
import settlementRoutes from '@routes/settlement'
import statsRoutes from '@routes/stats'
import userAccountRoutes from '@routes/user-account'
import noteComplianceRoutes from '@routes/note-compliance'
import notePublishRoutes from '@routes/note-publish'
import noteBatchRoutes from '@routes/note-batch'
import reviewRoutes from '@routes/review'
import reviewLogRoutes from '@routes/review-log'
import reviewComplianceRoutes from '@routes/review-compliance'
import noteOpsRoutes from '@routes/note-ops'
import noteOpsLogRoutes from '@routes/note-ops-log'
import categoryRoutes from '@routes/category'
import tagManagementRoutes from '@routes/tag-management'
import userLevelRoutes from '@routes/user-level'
import riskControlRoutes from '@routes/risk-control'
import activityOperationRoutes from '@routes/activity-operation'
import creatorQualificationRoutes from '@routes/creator-qualification'
import merchantOnboardingRoutes from '@routes/merchant-onboarding'
import directMessageRoutes from '@routes/direct-message'
import interactionOpsRoutes from '@routes/interaction-ops'
import hotCommentRoutes from '@routes/hot-comment'
import trafficPoolRoutes from '@routes/traffic-pool'
import contentPushRoutes from '@routes/content-push'
import trafficWeightRuleRoutes from '@routes/traffic-weight-rule'
import trafficAnomalyControlRoutes from '@routes/traffic-anomaly-control'
import activityParticipationRoutes from '@routes/activity-participation'
import activityRewardRoutes from '@routes/activity-reward'
import activityStatsRoutes from '@routes/activity-stats'

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
app.use('/api/comments', commentRoutes)
app.use('/api/violations', violationRoutes)
app.use('/api/resource-slots', resourceSlotRoutes)
app.use('/api/operation-logs', operationLogRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/feedbacks', feedbackRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/user-account', userAccountRoutes)
app.use('/api/note-compliance', noteComplianceRoutes)
app.use('/api/note-publish', notePublishRoutes)
app.use('/api/note-batch', noteBatchRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/review-logs', reviewLogRoutes)
app.use('/api/review-compliance', reviewComplianceRoutes)
app.use('/api/note-ops', noteOpsRoutes)
app.use('/api/note-ops-logs', noteOpsLogRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagManagementRoutes)
app.use('/api/user-level', userLevelRoutes)
app.use('/api/risk-control', riskControlRoutes)
app.use('/api/activity-operation', activityOperationRoutes)
app.use('/api/creator-qualification', creatorQualificationRoutes)
app.use('/api/merchant-onboarding', merchantOnboardingRoutes)
app.use('/api/dm', directMessageRoutes)
app.use('/api/interaction-ops', interactionOpsRoutes)
app.use('/api/hot-comment', hotCommentRoutes)
app.use('/api/traffic-pool', trafficPoolRoutes)
app.use('/api/content-push', contentPushRoutes)
app.use('/api/traffic-weight-rule', trafficWeightRuleRoutes)
app.use('/api/traffic-anomaly-control', trafficAnomalyControlRoutes)
app.use('/api/activity-participation', activityParticipationRoutes)
app.use('/api/activity-reward', activityRewardRoutes)
app.use('/api/activity-stats', activityStatsRoutes)

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
