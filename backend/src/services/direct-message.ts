import {
  DirectMessage, DmConversation, DmAuditLog, User, PunishmentRecord
} from '@models/index'
import { AppError } from '@utils/response'
import { Op, literal } from 'sequelize'
import { dmComplianceService, type DmComplianceCheckResult } from './dm-compliance'
import sequelize from '@config/database'

export interface SendDmData {
  senderId: number
  senderName?: string
  senderAvatar?: string
  receiverId: number
  receiverName?: string
  receiverAvatar?: string
  content: string
  contentType?: number
  ip?: string
  deviceInfo?: string
  userAgent?: string
}

export interface PunishmentData {
  type: string
  typeName: string
  duration: number
  reason: string
}

export const directMessageService = {
  async getOrCreateConversation(
    userId1: number,
    userId2: number,
    user1Name?: string,
    user2Name?: string,
    user1Avatar?: string,
    user2Avatar?: string
  ): Promise<DmConversation> {
    const [minId, maxId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]
    const [minName, maxName] = userId1 < userId2
      ? [user1Name || '用户' + userId1, user2Name || '用户' + userId2]
      : [user2Name || '用户' + userId2, user1Name || '用户' + userId1]
    const [minAvatar, maxAvatar] = userId1 < userId2
      ? [user1Avatar || '', user2Avatar || '']
      : [user2Avatar || '', user1Avatar || '']

    const [conv] = await DmConversation.findOrCreate({
      where: { participantAId: minId, participantBId: maxId },
      defaults: {
        participantAId: minId, participantBId: maxId,
        participantAName: minName, participantBName: maxName,
        participantAAvatar: minAvatar, participantBAvatar: maxAvatar
      }
    })
    return conv
  },

  async listMessages(params: {
    page: number
    pageSize: number
    conversationId?: number
    senderId?: number
    receiverId?: number
    keyword?: string
    status?: number
    riskLevel?: number
    violationType?: string
    intercepted?: number
    isReported?: number
    startTime?: string
    endTime?: string
  }) {
    const { page, pageSize, conversationId, senderId, receiverId, keyword,
      status, riskLevel, violationType, intercepted, isReported, startTime, endTime } = params
    const where: any = {}
    if (conversationId !== undefined) where.conversationId = conversationId
    if (senderId !== undefined) where.senderId = senderId
    if (receiverId !== undefined) where.receiverId = receiverId
    if (keyword) where.content = { [Op.like]: `%${keyword}%` }
    if (status !== undefined) where.status = status
    if (riskLevel !== undefined) where.riskLevel = riskLevel
    if (violationType) where.violationType = { [Op.like]: `%${violationType}%` }
    if (intercepted !== undefined) where.intercepted = intercepted
    if (isReported !== undefined) where.isReported = isReported
    if (startTime) where.createTime = { ...(where.createTime || {}), [Op.gte]: new Date(startTime) }
    if (endTime) where.createTime = { ...(where.createTime || {}), [Op.lte]: new Date(endTime) }

    const { count, rows } = await DirectMessage.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  },

  async listConversations(params: {
    page: number
    pageSize: number
    riskLevel?: number
    status?: number
    violationMin?: number
    keyword?: string
  }) {
    const { page, pageSize, riskLevel, status, violationMin, keyword } = params
    const where: any = {}
    if (riskLevel !== undefined) where.riskLevel = riskLevel
    if (status !== undefined) where.status = status
    if (violationMin !== undefined) where.violationCount = { [Op.gte]: violationMin }
    if (keyword) {
      where[Op.or] = [
        { participantAName: { [Op.like]: `%${keyword}%` } },
        { participantBName: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { count, rows } = await DmConversation.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['last_message_time', 'DESC']]
    })
    return { list: rows, total: count, page, pageSize }
  },

  async detail(id: number) {
    const msg = await DirectMessage.findByPk(id)
    if (!msg) throw new AppError('私信消息不存在', 404)
    return msg
  },

  async conversationDetail(id: number) {
    const conv = await DmConversation.findByPk(id)
    if (!conv) throw new AppError('会话不存在', 404)
    return conv
  },

  async getConversationMessages(conversationId: number, page = 1, pageSize = 50) {
    const { count, rows } = await DirectMessage.findAndCountAll({
      where: {
        conversationId,
        [Op.or]: [
          { deletedBySender: 0 },
          { deletedByReceiver: 0 }
        ]
      },
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['create_time', 'ASC']]
    })
    return { list: rows, total: count, page, pageSize }
  },

  async send(data: SendDmData): Promise<{
    message?: DirectMessage
    intercepted: boolean
    complianceResult: DmComplianceCheckResult
    punishment?: PunishmentData
  }> {
    const { senderId, receiverId, content } = data

    if (!senderId || !receiverId) throw new AppError('发送者和接收者不能为空', 400)
    if (senderId === receiverId) throw new AppError('不能给自己发送私信', 400)
    if (!content || !content.trim()) throw new AppError('消息内容不能为空', 400)

    const sender = await User.findByPk(senderId)
    const receiver = await User.findByPk(receiverId)
    if (!sender || !receiver) throw new AppError('用户不存在', 404)

    const complianceResult = await dmComplianceService.fullCheck(content, senderId, receiverId)

    const conv = await this.getOrCreateConversation(
      senderId, receiverId,
      sender.nickname, receiver.nickname,
      sender.avatar, receiver.avatar
    )

    const t = await sequelize.transaction()
    try {
      const status = complianceResult.intercepted ? 2
        : (complianceResult.passed ? 1 : 0)
      const violationTypes = complianceResult.violations.map(v => v.typeName).join(',')
      const violationDetail = complianceResult.violations.map(v => v.message).join(';')

      const message = await DirectMessage.create({
        conversationId: conv.id,
        senderId, senderName: sender.nickname, senderAvatar: sender.avatar || '',
        receiverId, receiverName: receiver.nickname, receiverAvatar: receiver.avatar || '',
        content, contentType: data.contentType || 1,
        status, riskLevel: complianceResult.riskLevel,
        violationType: violationTypes, violationDetail,
        sensitiveWords: complianceResult.sensitiveMatches.join(','),
        intercepted: complianceResult.intercepted ? 1 : 0,
        ip: data.ip || '', deviceInfo: data.deviceInfo || '', userAgent: data.userAgent || ''
      } as any, { transaction: t })

      const convUpdates: any = {
        lastMessageId: message.id,
        lastMessageContent: content.substring(0, 100),
        lastMessageTime: message.createTime,
        messageCount: literal('message_count + 1'),
      }
      const senderIsA = senderId < receiverId
      if (senderIsA) {
        convUpdates.unreadCountB = literal('unread_count_b + 1')
      } else {
        convUpdates.unreadCountA = literal('unread_count_a + 1')
      }
      if (status !== 1) {
        convUpdates.violationCount = literal('violation_count + 1')
        if (complianceResult.riskLevel > (conv.riskLevel || 0)) {
          convUpdates.riskLevel = complianceResult.riskLevel
        }
      }
      await conv.update(convUpdates, { transaction: t })

      const logAction = complianceResult.intercepted ? 0 : (complianceResult.passed ? 1 : 0)
      await DmAuditLog.create({
        messageId: message.id, conversationId: conv.id,
        senderId, senderName: sender.nickname,
        receiverId, receiverName: receiver.nickname,
        content, action: logAction,
        violationType: violationTypes, violationDetail,
        sensitiveWords: complianceResult.sensitiveMatches.join(','),
        ip: data.ip || '', deviceInfo: data.deviceInfo || ''
      } as any, { transaction: t })

      let punishment: PunishmentData | undefined
      if (complianceResult.recommendedPunishment
        && (complianceResult.intercepted || complianceResult.riskLevel >= 2)) {
        punishment = complianceResult.recommendedPunishment
        await this.applyPunishment(
          senderId, sender.nickname,
          punishment,
          { messageId: message.id, conversationId: conv.id, violationType: violationTypes },
          undefined,
          t
        )
      }

      await t.commit()
      return { message, intercepted: complianceResult.intercepted, complianceResult, punishment }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async applyPunishment(
    userId: number, userName: string,
    punishment: PunishmentData,
    related: { messageId?: number, conversationId?: number, violationType?: string },
    operator?: { userId: number; username: string },
    transaction?: any
  ) {
    const now = new Date()
    const endTime = punishment.duration > 0
      ? new Date(now.getTime() + punishment.duration * 60 * 1000)
      : null

    const record = await PunishmentRecord.create({
      userId, userName,
      punishmentType: punishment.type,
      riskLevel: punishment.type.includes('permanent') ? 3 : 2,
      violationType: related.violationType || '私信违规',
      reason: punishment.reason,
      reasonDetail: JSON.stringify(related),
      status: 0, startTime: now, endTime,
      duration: punishment.duration,
      operatorId: operator?.userId,
      operatorName: operator?.username
    } as any, { transaction })

    await DmAuditLog.create({
      messageId: related.messageId,
      conversationId: related.conversationId,
      senderId: userId, senderName: userName,
      receiverId: 0, receiverName: '系统',
      content: '',
      action: 3,
      violationType: related.violationType,
      violationDetail: punishment.reason,
      punishmentType: punishment.type,
      punishmentDuration: punishment.duration,
      handlerId: operator?.userId,
      handlerName: operator?.username || '系统'
    } as any, { transaction })

    await User.increment('violationCount', {
      by: 1,
      where: { id: userId },
      transaction
    })
    await User.update(
      { lastViolationTime: now },
      { where: { id: userId }, transaction }
    )

    return record
  },

  async removeMessage(id: number, operator?: { userId: number; username: string }) {
    const msg = await DirectMessage.findByPk(id)
    if (!msg) throw new AppError('消息不存在', 404)

    const t = await sequelize.transaction()
    try {
      await DmAuditLog.create({
        messageId: id, conversationId: msg.conversationId,
        senderId: msg.senderId, senderName: msg.senderName,
        receiverId: msg.receiverId, receiverName: msg.receiverName,
        content: msg.content, action: 2,
        violationType: msg.violationType, violationDetail: msg.violationDetail,
        sensitiveWords: msg.sensitiveWords,
        handlerId: operator?.userId, handlerName: operator?.username || '系统'
      } as any, { transaction: t })

      await msg.update({ status: 4 }, { transaction: t })

      if (msg.conversationId) {
        await DmConversation.decrement('messageCount', {
          by: 1, where: { id: msg.conversationId }, transaction: t
        })
      }

      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async batchRemove(ids: number[], operator?: { userId: number; username: string }) {
    const messages = await DirectMessage.findAll({ where: { id: { [Op.in]: ids } } })
    if (messages.length === 0) return { total: 0, success: 0 }

    const t = await sequelize.transaction()
    try {
      const convIdSet = new Set<number>()
      const logs = messages.map(m => {
        if (m.conversationId) convIdSet.add(m.conversationId)
        return {
          messageId: m.id, conversationId: m.conversationId,
          senderId: m.senderId, senderName: m.senderName,
          receiverId: m.receiverId, receiverName: m.receiverName,
          content: m.content, action: 4,
          violationType: m.violationType, violationDetail: m.violationDetail,
          sensitiveWords: m.sensitiveWords,
          handlerId: operator?.userId, handlerName: operator?.username || '系统'
        }
      })
      await DmAuditLog.bulkCreate(logs as any, { transaction: t })
      await DirectMessage.update({ status: 4 }, { where: { id: { [Op.in]: ids } }, transaction: t })

      for (const cid of convIdSet) {
        const cnt = messages.filter(m => m.conversationId === cid).length
        await DmConversation.decrement('messageCount', {
          by: cnt, where: { id: cid }, transaction: t
        })
      }
      await t.commit()
      return { total: ids.length, success: messages.length }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async punishAccount(
    userId: number,
    punishment: PunishmentData,
    related: { messageId?: number; conversationId?: number; violationType?: string; reason?: string } = {},
    operator?: { userId: number; username: string }
  ) {
    const user = await User.findByPk(userId)
    if (!user) throw new AppError('用户不存在', 404)

    return await this.applyPunishment(userId, user.nickname, punishment, related, operator)
  },

  async batchBanAccounts(
    userIds: number[],
    punishment: PunishmentData,
    violationType: string,
    operator?: { userId: number; username: string }
  ) {
    const users = await User.findAll({ where: { id: { [Op.in]: userIds } } })
    if (users.length === 0) return { total: 0, success: 0 }

    const t = await sequelize.transaction()
    try {
      const results = []
      for (const user of users) {
        const record = await this.applyPunishment(
          user.id, user.nickname, punishment,
          { violationType }, operator, t
        )
        results.push(record)
      }
      await DmAuditLog.create({
        messageId: 0, conversationId: 0,
        senderId: 0, senderName: '批量操作',
        receiverId: 0, receiverName: '-',
        content: `批量封禁用户数:${users.length} 处罚:${punishment.typeName}`,
        action: 5, violationType,
        violationDetail: `用户ID:${userIds.join(',')} 原因:${punishment.reason}`,
        punishmentType: punishment.type, punishmentDuration: punishment.duration,
        handlerId: operator?.userId, handlerName: operator?.username || '系统'
      } as any, { transaction: t })

      await t.commit()
      return { total: userIds.length, success: results.length }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async restrictConversation(
    conversationId: number,
    restrict: boolean,
    reason: string,
    operator?: { userId: number; username: string }
  ) {
    const conv = await DmConversation.findByPk(conversationId)
    if (!conv) throw new AppError('会话不存在', 404)

    const t = await sequelize.transaction()
    try {
      const newStatus = restrict ? 0 : 1
      await conv.update({ status: newStatus }, { transaction: t })
      await DmAuditLog.create({
        messageId: 0, conversationId,
        senderId: conv.participantAId, senderName: conv.participantAName,
        receiverId: conv.participantBId, receiverName: conv.participantBName,
        content: reason, action: restrict ? 6 : 7,
        violationType: '会话限制', violationDetail: reason,
        handlerId: operator?.userId, handlerName: operator?.username || '系统'
      } as any, { transaction: t })

      await t.commit()
      return { conversationId, restricted: restrict, reason }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getMessageTrace(id: number) {
    const msg = await DirectMessage.findByPk(id)
    if (!msg) throw new AppError('消息不存在', 404)

    const conv = await DmConversation.findByPk(msg.conversationId)
    const sender = await User.findByPk(msg.senderId)
    const receiver = await User.findByPk(msg.receiverId)

    const now = Date.now()
    const day24Ago = new Date(now - 24 * 60 * 60 * 1000)
    const hour1Ago = new Date(now - 60 * 60 * 1000)

    const [user24hCount, sameContentCount, sameIpCount, sameSenderToReceiverCount,
      reportedByReceiver, otherUserReportsCount] = await Promise.all([
      DirectMessage.count({ where: { senderId: msg.senderId, createTime: { [Op.gte]: day24Ago } } }),
      DirectMessage.count({
        where: {
          senderId: msg.senderId,
          content: { [Op.like]: `%${msg.content.substring(0, Math.min(50, msg.content.length))}%` },
          createTime: { [Op.gte]: day24Ago }
        }
      }),
      msg.ip ? DirectMessage.count({
        where: { ip: msg.ip, createTime: { [Op.gte]: day24Ago } }
      }) : Promise.resolve(0),
      DirectMessage.count({
        where: { senderId: msg.senderId, receiverId: msg.receiverId, createTime: { [Op.gte]: hour1Ago } }
      }),
      DirectMessage.count({ where: { receiverId: msg.receiverId, senderId: msg.senderId, isReported: 1 } }),
      DirectMessage.count({ where: { senderId: msg.senderId, isReported: 1 } })
    ])

    const reasons: string[] = []
    let riskLevel = msg.riskLevel || 0
    if (msg.intercepted === 1) { reasons.push('消息已被系统自动拦截') }
    if (user24hCount >= 80) { reasons.push('24小时内私信发送量异常偏高'); riskLevel = Math.max(riskLevel, 2) }
    if (sameContentCount >= 5) { reasons.push(`存在${sameContentCount}条相同内容消息，疑似机器刷评`); riskLevel = Math.max(riskLevel, 2) }
    if (sameIpCount >= 20) { reasons.push(`同IP发送${sameIpCount}条私信，疑似批量操作`); riskLevel = Math.max(riskLevel, 2) }
    if (sameSenderToReceiverCount >= 10) { reasons.push(`1小时内对同一用户发送${sameSenderToReceiverCount}条私信，疑似恶意骚扰`); riskLevel = Math.max(riskLevel, 2) }
    if (reportedByReceiver > 0) { reasons.push(`接收方已举报该发送方${reportedByReceiver}次`) }
    if (otherUserReportsCount >= 3) { reasons.push(`该发送方累计被举报${otherUserReportsCount}次`) }

    const auditLogs = await DmAuditLog.findAll({
      where: { messageId: id },
      order: [['create_time', 'ASC']]
    })

    return {
      message: msg.toJSON(),
      conversation: conv ? conv.toJSON() : null,
      sender: sender ? {
        id: sender.id, nickname: sender.nickname, username: sender.username,
        avatar: sender.avatar, status: sender.status,
        riskLevel: sender.riskLevel, violationCount: sender.violationCount,
        isPermanentBanned: sender.isPermanentBanned
      } : null,
      receiver: receiver ? {
        id: receiver.id, nickname: receiver.nickname, username: receiver.username,
        avatar: receiver.avatar
      } : null,
      riskAnalysis: {
        isAbnormal: reasons.length > 0,
        user24hMessageCount: user24hCount,
        sameContentCount,
        sameIpCount,
        sameSenderToReceiver1h: sameSenderToReceiverCount,
        reportedByReceiver,
        senderTotalReported: otherUserReportsCount,
        finalRiskLevel: riskLevel,
        reasons
      },
      auditLogs: auditLogs.map(l => l.toJSON()),
      device: {
        ip: msg.ip || '',
        deviceInfo: msg.deviceInfo || '',
        userAgent: msg.userAgent || '',
        sendTime: msg.createTime
      }
    }
  },

  async getConversationTrace(conversationId: number) {
    const conv = await DmConversation.findByPk(conversationId)
    if (!conv) throw new AppError('会话不存在', 404)

    const messages = await DirectMessage.findAll({
      where: { conversationId },
      order: [['create_time', 'ASC']],
      limit: 200
    })

    const interceptionCount = messages.filter(m => m.intercepted === 1).length
    const riskMsgCount = messages.filter(m => (m.riskLevel || 0) >= 2).length
    const userA = await User.findByPk(conv.participantAId)
    const userB = await User.findByPk(conv.participantBId)

    const uniqueIps = new Set(messages.filter(m => m.ip).map(m => m.ip))
    const freqHours: Record<string, number> = {}
    messages.forEach(m => {
      const h = m.createTime?.toISOString().substring(0, 13) || ''
      if (h) freqHours[h] = (freqHours[h] || 0) + 1
    })
    const maxHourly = Object.values(freqHours).reduce((a, b) => Math.max(a, b), 0)

    const flags: string[] = []
    if (interceptionCount >= 3) flags.push(`会话中${interceptionCount}条消息被系统拦截`)
    if (riskMsgCount >= 5) flags.push(`会话中${riskMsgCount}条高风险消息`)
    if (uniqueIps.size >= 5) flags.push(`发送涉及${uniqueIps.size}个不同IP，可能存在异常`)
    if (maxHourly >= 30) flags.push(`最高时发送${maxHourly}条，疑似机器刷屏`)
    if ((conv.violationCount || 0) >= 10) flags.push(`会话累计违规${conv.violationCount}次`)

    return {
      conversation: conv.toJSON(),
      participants: {
        userA: userA ? {
          id: userA.id, nickname: userA.nickname, avatar: userA.avatar,
          riskLevel: userA.riskLevel, violationCount: userA.violationCount
        } : null,
        userB: userB ? {
          id: userB.id, nickname: userB.nickname, avatar: userB.avatar,
          riskLevel: userB.riskLevel, violationCount: userB.violationCount
        } : null
      },
      messages: messages.map(m => m.toJSON()),
      stats: {
        totalMessages: messages.length,
        interceptionCount,
        riskMsgCount,
        uniqueIps: uniqueIps.size,
        maxHourly,
        avgPerHour: messages.length / Math.max(1, Object.keys(freqHours).length)
      },
      riskFlags: flags,
      timeline: messages.map(m => ({
        id: m.id, time: m.createTime, senderId: m.senderId,
        status: m.status, riskLevel: m.riskLevel, preview: m.content.substring(0, 50)
      }))
    }
  },

  async getStats() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const day7Start = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [total, todayNew, intercepted, pending, riskHigh, reported, conversations, riskConversations] =
      await Promise.all([
        DirectMessage.count(),
        DirectMessage.count({ where: { createTime: { [Op.gte]: todayStart } } }),
        DirectMessage.count({ where: { intercepted: 1 } }),
        DirectMessage.count({ where: { status: 0 } }),
        DirectMessage.count({ where: { riskLevel: { [Op.gte]: 3 } } }),
        DirectMessage.count({ where: { isReported: 1 } }),
        DmConversation.count(),
        DmConversation.count({ where: { [Op.or]: [{ riskLevel: { [Op.gte]: 2 } }, { violationCount: { [Op.gte]: 5 } }] } })
      ])

    return {
      total, todayNew, intercepted, pending, riskHigh, reported,
      conversations, riskConversations,
      interceptionRate: total > 0 ? +((intercepted / total) * 100).toFixed(2) : 0,
      riskRate: total > 0 ? +((riskHigh / total) * 100).toFixed(2) : 0
    }
  },

  async checkCompliance(content: string, senderId: number, receiverId: number) {
    return await dmComplianceService.fullCheck(content, senderId, receiverId)
  },
  async getSensitiveWords() { return dmComplianceService.getSensitiveWords() },
  async highlightContent(content: string) {
    const matches = dmComplianceService.checkContent(content).allMatches
    return dmComplianceService.highlightContent(content, matches)
  },
  async getAuditLogs(messageId: number) {
    return await DmAuditLog.findAll({
      where: { messageId }, order: [['create_time', 'DESC']]
    })
  },
  async getConversationAuditLogs(conversationId: number) {
    return await DmAuditLog.findAll({
      where: { conversationId }, order: [['create_time', 'DESC']]
    })
  }
}
