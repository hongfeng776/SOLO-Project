import { DirectMessage, DmConversation, User, PunishmentRecord } from '@models/index'
import { Op } from 'sequelize'

const SENSITIVE_WORDS: string[] = [
  '色情', '裸体', '淫秽', '卖淫', '嫖娼',
  '赌博', '博彩', '下注', '投注',
  '毒品', '大麻', '冰毒', '摇头丸',
  '枪支', '弹药', '爆炸物',
  '法轮', '反动', '颠覆',
  '杀人', '自杀', '暴力',
  '诈骗', '传销', '非法集资',
  '代孕', '器官买卖',
  '政治敏感', '分裂',
  '侮辱', '歧视', '种族'
]

const VIOLATION_PHRASES: string[] = [
  '加我微信', '加我VX', '加我QQ',
  '私聊赚钱', '带你赚钱', '日入过万',
  '月入十万', '轻松月入', '躺赚',
  '免费领取', '扫码领取', '限量免费',
  '点击链接领取', '下载APP领取',
  '代开发票', '出售账号', '出租账号',
  '刷单', '刷好评', '代刷',
  '色情直播', '成人直播',
  '代孕服务', '买卖器官',
  '黑客服务', '破解密码',
  '贷款无需审核', '黑户贷款',
  '赌博平台', '下注返利',
  '政治谣言', '恶意造谣',
  '人身攻击', '恶意辱骂'
]

const TRAFFIC_KEYWORDS: string[] = [
  '加微', '加V', '加Q', '加QQ',
  '私聊', '私信我', '详聊',
  '兼职', '赚钱', '日赚', '月赚',
  '免费领', '扫码', '红包返',
  '领红包', '返利', '佣金',
  '微信搜索', '公众号', '小程序码',
  '淘宝搜索', '抖音搜索',
  '进群', '拉群', '群号',
  '客服微信', '咨询微信',
  '低价出售', '清仓处理',
  '招代理', '招募代理',
  '项目合作', '商务合作私聊'
]

const HARASSMENT_PHRASES: string[] = [
  '在吗', '美女', '帅哥',
  '约吗', '有空吗', '出来玩',
  '骚扰', '滚蛋', '不要脸',
  '傻逼', '脑残', '智障'
]

const FREQUENCY_WINDOW = 60
const FREQUENCY_MAX = 10
const DAILY_LIMIT = 100
const DUPLICATE_WINDOW = 600
const DUPLICATE_MAX = 5

export interface DmComplianceViolation {
  type: string
  typeName: string
  matched: string[]
  level: number
  message: string
}

export interface DmComplianceCheckResult {
  passed: boolean
  canSend: boolean
  violations: DmComplianceViolation[]
  sensitiveMatches: string[]
  riskLevel: number
  intercepted: boolean
  senderStatus: {
    isBanned: boolean
    isFlowLimited: boolean
    isDmRestricted: boolean
    dailyCount: number
    dailyLimit: number
  }
  recommendedPunishment?: {
    type: string
    typeName: string
    duration: number
    reason: string
  }
}

export const dmComplianceService = {
  checkContent(content: string): {
    sensitiveMatches: string[]
    violationMatches: string[]
    trafficMatches: string[]
    harassmentMatches: string[]
    allMatches: string[]
  } {
    const sensitiveMatches: string[] = []
    const violationMatches: string[] = []
    const trafficMatches: string[] = []
    const harassmentMatches: string[] = []

    for (const word of SENSITIVE_WORDS) {
      if (content.includes(word)) sensitiveMatches.push(word)
    }
    for (const phrase of VIOLATION_PHRASES) {
      if (content.includes(phrase)) violationMatches.push(phrase)
    }
    for (const keyword of TRAFFIC_KEYWORDS) {
      if (content.includes(keyword)) trafficMatches.push(keyword)
    }
    for (const phrase of HARASSMENT_PHRASES) {
      if (content.includes(phrase)) harassmentMatches.push(phrase)
    }

    const allMatches = [...new Set([...sensitiveMatches, ...violationMatches, ...trafficMatches, ...harassmentMatches])]
    return { sensitiveMatches, violationMatches, trafficMatches, harassmentMatches, allMatches }
  },

  async checkSenderStatus(senderId: number): Promise<{
    isBanned: boolean
    isFlowLimited: boolean
    isDmRestricted: boolean
    banExpireTime?: Date | null
    flowLimitExpireTime?: Date | null
    dmRestrictExpireTime?: Date | null
    violationCount: number
    riskLevel: number
    recentViolationsCount: number
    activeDmPunishment: any | null
  }> {
    const user = await User.findByPk(senderId)
    if (!user) return {
      isBanned: true, isFlowLimited: false, isDmRestricted: false,
      violationCount: 0, riskLevel: 3, recentViolationsCount: 0, activeDmPunishment: null
    }

    const now = new Date()
    const isBanned = user.isPermanentBanned === 1
      || (user.status === 0)
      || (user.banExpireTime && user.banExpireTime > now)
    const isFlowLimited = !isBanned && user.flowLimitExpireTime && user.flowLimitExpireTime > now

    const activeDmPunishment = await PunishmentRecord.findOne({
      where: {
        userId: senderId,
        status: 0,
        punishmentType: { [Op.in]: ['temp_restrict_dm', 'temp_ban_dm', 'permanent_ban_dm'] },
        [Op.or]: [
          { endTime: null },
          { endTime: { [Op.gt]: now } }
        ]
      },
      order: [['createTime', 'DESC']]
    })

    const isDmRestricted = !!activeDmPunishment
      || activeDmPunishment?.punishmentType === 'permanent_ban_dm'

    const recentViolationsCount = await PunishmentRecord.count({
      where: {
        userId: senderId,
        createTime: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }
    })

    return {
      isBanned,
      isFlowLimited,
      isDmRestricted,
      banExpireTime: user.banExpireTime,
      flowLimitExpireTime: user.flowLimitExpireTime,
      dmRestrictExpireTime: activeDmPunishment?.endTime,
      violationCount: user.violationCount || 0,
      riskLevel: user.riskLevel || 0,
      recentViolationsCount,
      activeDmPunishment
    }
  },

  async checkFrequency(userId: number): Promise<{
    isHighFrequency: boolean
    count: number
    limit: number
    window: number
    dailyCount: number
    dailyLimit: number
    exceedsDailyLimit: boolean
  }> {
    const windowStart = new Date(Date.now() - FREQUENCY_WINDOW * 1000)
    const count = await DirectMessage.count({
      where: { senderId: userId, createTime: { [Op.gte]: windowStart } }
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const dailyCount = await DirectMessage.count({
      where: { senderId: userId, createTime: { [Op.gte]: todayStart } }
    })

    return {
      isHighFrequency: count >= FREQUENCY_MAX,
      count,
      limit: FREQUENCY_MAX,
      window: FREQUENCY_WINDOW,
      dailyCount,
      dailyLimit: DAILY_LIMIT,
      exceedsDailyLimit: dailyCount >= DAILY_LIMIT
    }
  },

  async checkDuplicate(userId: number, content: string): Promise<{
    isDuplicate: boolean
    duplicateCount: number
    limit: number
  }> {
    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW * 1000)
    const contentFragment = content.substring(0, Math.min(100, content.length))
    const duplicateCount = await DirectMessage.count({
      where: {
        senderId: userId,
        content: { [Op.like]: `%${contentFragment}%` },
        createTime: { [Op.gte]: windowStart }
      }
    })
    return { isDuplicate: duplicateCount >= DUPLICATE_MAX, duplicateCount, limit: DUPLICATE_MAX }
  },

  async checkConversationRestriction(senderId: number, receiverId: number): Promise<{
    canSend: boolean
    isBlocked: boolean
    isConversationRestricted: boolean
    restrictionReason?: string
  }> {
    const [minId, maxId] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId]
    const conversation = await DmConversation.findOne({
      where: { participantAId: minId, participantBId: maxId }
    })

    if (!conversation) return { canSend: true, isBlocked: false, isConversationRestricted: false }

    const senderIsA = senderId === minId
    const isBlockedByReceiver = senderIsA ? conversation.isBlockedByB === 1 : conversation.isBlockedByA === 1
    const isRestricted = conversation.status === 0 || conversation.status === 2

    const restrictionReason = isBlockedByReceiver
      ? '您已被对方拉黑，无法发送私信'
      : (conversation.status === 0 ? '会话已被系统封禁'
        : (conversation.status === 2 ? '会话已被限制私信' : undefined))

    return {
      canSend: !isBlockedByReceiver && !isRestricted,
      isBlocked: isBlockedByReceiver,
      isConversationRestricted: isRestricted,
      restrictionReason
    }
  },

  determinePunishment(
    riskLevel: number,
    violationCount: number,
    recentViolationsCount: number
  ): {
    type: string
    typeName: string
    duration: number
    reason: string
  } | undefined {
    if (riskLevel >= 3) {
      if (recentViolationsCount >= 3 || violationCount >= 5) {
        return { type: 'permanent_ban_dm', typeName: '永久封禁私信', duration: 0, reason: '重度违规或多次违规，永久封禁私信功能' }
      }
      return { type: 'temp_ban_dm', typeName: '临时封禁私信', duration: 7 * 24 * 60, reason: '重度内容违规，临时封禁私信功能7天' }
    }
    if (riskLevel >= 2) {
      if (recentViolationsCount >= 2) {
        return { type: 'temp_ban_dm', typeName: '临时封禁私信', duration: 3 * 24 * 60, reason: '中度违规且屡犯，临时封禁私信3天' }
      }
      return { type: 'temp_restrict_dm', typeName: '限制私信功能', duration: 24 * 60, reason: '中度内容违规，限制私信功能24小时' }
    }
    if (riskLevel >= 1 && recentViolationsCount >= 1) {
      return { type: 'warning', typeName: '弹窗预警', duration: 0, reason: '轻微违规，弹窗预警提醒' }
    }
    return undefined
  },

  async fullCheck(
    content: string,
    senderId: number,
    receiverId: number
  ): Promise<DmComplianceCheckResult> {
    const violations: DmComplianceViolation[] = []
    let maxRiskLevel = 0
    let intercepted = false

    const senderStatus = await this.checkSenderStatus(senderId)
    if (senderStatus.isBanned) {
      violations.push({
        type: 'account_banned', typeName: '账号封禁',
        matched: [], level: 3, message: '账号已被封禁，禁止发送私信'
      })
      maxRiskLevel = 3; intercepted = true
    } else if (senderStatus.isDmRestricted) {
      const exp = senderStatus.dmRestrictExpireTime
      violations.push({
        type: 'dm_restricted', typeName: '私信受限',
        matched: exp ? [`到期时间:${exp.toLocaleString()}`] : ['永久限制'],
        level: 3, message: '私信功能已被限制，请联系客服解封'
      })
      maxRiskLevel = 3; intercepted = true
    } else if (senderStatus.isFlowLimited) {
      violations.push({
        type: 'flow_limited', typeName: '账号限流',
        matched: [], level: 2, message: '账号处于限流状态，私信发送受限'
      })
      maxRiskLevel = 2
    }

    if (!intercepted) {
      const convResult = await this.checkConversationRestriction(senderId, receiverId)
      if (!convResult.canSend) {
        violations.push({
          type: 'conversation_restricted', typeName: '会话受限',
          matched: convResult.isBlocked ? ['被对方拉黑'] : ['会话状态异常'],
          level: 3, message: convResult.restrictionReason || '当前会话无法发送私信'
        })
        maxRiskLevel = Math.max(maxRiskLevel, 3); intercepted = true
      }
    }

    if (!intercepted) {
      const contentResult = this.checkContent(content)
      if (contentResult.sensitiveMatches.length > 0) {
        violations.push({
          type: 'sensitive_word', typeName: '敏感词',
          matched: contentResult.sensitiveMatches, level: 3,
          message: `包含敏感词：${contentResult.sensitiveMatches.join('、')}`
        })
        maxRiskLevel = 3
      }
      if (contentResult.violationMatches.length > 0) {
        const level = maxRiskLevel >= 3 ? 3 : 2
        violations.push({
          type: 'violation_phrase', typeName: '违规话术',
          matched: contentResult.violationMatches, level,
          message: `包含违规话术：${contentResult.violationMatches.join('、')}`
        })
        maxRiskLevel = Math.max(maxRiskLevel, level)
      }
      if (contentResult.trafficMatches.length > 0) {
        const level = maxRiskLevel >= 2 ? maxRiskLevel : 1
        violations.push({
          type: 'traffic_keyword', typeName: '引流关键词',
          matched: contentResult.trafficMatches, level,
          message: `包含引流关键词：${contentResult.trafficMatches.join('、')}`
        })
        maxRiskLevel = Math.max(maxRiskLevel, 1)
      }
      if (contentResult.harassmentMatches.length > 0) {
        violations.push({
          type: 'harassment', typeName: '骚扰话术',
          matched: contentResult.harassmentMatches, level: 1,
          message: `包含疑似骚扰话术：${contentResult.harassmentMatches.join('、')}`
        })
        maxRiskLevel = Math.max(maxRiskLevel, 1)
      }

      const freqResult = await this.checkFrequency(senderId)
      if (freqResult.exceedsDailyLimit) {
        violations.push({
          type: 'daily_limit_exceeded', typeName: '日发送超限',
          matched: [`${freqResult.dailyCount}条/日`], level: 2,
          message: `今日私信发送数已达上限（${freqResult.dailyCount}/${freqResult.dailyLimit}）`
        })
        maxRiskLevel = Math.max(maxRiskLevel, 2); intercepted = true
      } else if (freqResult.isHighFrequency) {
        violations.push({
          type: 'high_frequency', typeName: '高频发送',
          matched: [`${freqResult.count}次/${freqResult.window}秒`], level: 2,
          message: `发送频率过高：${freqResult.count}次/${freqResult.window}秒，限制${freqResult.limit}次`
        })
        maxRiskLevel = Math.max(maxRiskLevel, 2)
      }

      const dupResult = await this.checkDuplicate(senderId, content)
      if (dupResult.isDuplicate) {
        violations.push({
          type: 'duplicate_content', typeName: '重复内容',
          matched: [`${dupResult.duplicateCount}次/${DUPLICATE_WINDOW}秒`], level: 2,
          message: `短时间重复发送内容：${dupResult.duplicateCount}次/${DUPLICATE_WINDOW}秒`
        })
        maxRiskLevel = Math.max(maxRiskLevel, 2)
      }

      if (maxRiskLevel >= 3) {
        intercepted = true
      } else if (maxRiskLevel >= 2 && (freqResult.isHighFrequency || dupResult.isDuplicate)) {
        intercepted = true
      }
    }

    const passed = violations.length === 0
    const canSend = !intercepted && passed

    const recommendedPunishment = passed && maxRiskLevel === 0
      ? undefined
      : this.determinePunishment(maxRiskLevel, senderStatus.violationCount, senderStatus.recentViolationsCount)

    return {
      passed,
      canSend,
      violations,
      sensitiveMatches: this.checkContent(content).allMatches,
      riskLevel: maxRiskLevel,
      intercepted,
      senderStatus: {
        isBanned: senderStatus.isBanned,
        isFlowLimited: senderStatus.isFlowLimited,
        isDmRestricted: senderStatus.isDmRestricted,
        dailyCount: (await this.checkFrequency(senderId)).dailyCount,
        dailyLimit: DAILY_LIMIT
      },
      recommendedPunishment
    }
  },

  getSensitiveWords(): string[] { return [...SENSITIVE_WORDS] },
  getViolationPhrases(): string[] { return [...VIOLATION_PHRASES] },
  getTrafficKeywords(): string[] { return [...TRAFFIC_KEYWORDS] },
  getHarassmentPhrases(): string[] { return [...HARASSMENT_PHRASES] },

  highlightContent(content: string, matches: string[]): Array<{ text: string; isSensitive: boolean }> {
    if (matches.length === 0) return [{ text: content, isSensitive: false }]
    const sorted = [...matches].sort((a, b) => b.length - a.length)
    const parts: Array<{ text: string; isSensitive: boolean }> = []
    let remaining = content
    while (remaining.length > 0) {
      let earliestIndex = remaining.length
      let earliestMatch = ''
      for (const match of sorted) {
        const idx = remaining.indexOf(match)
        if (idx !== -1 && idx < earliestIndex) { earliestIndex = idx; earliestMatch = match }
      }
      if (earliestMatch === '') { parts.push({ text: remaining, isSensitive: false }); break }
      if (earliestIndex > 0) parts.push({ text: remaining.substring(0, earliestIndex), isSensitive: false })
      parts.push({ text: earliestMatch, isSensitive: true })
      remaining = remaining.substring(earliestIndex + earliestMatch.length)
    }
    return parts
  }
}
