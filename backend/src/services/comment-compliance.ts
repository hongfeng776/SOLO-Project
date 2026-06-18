import { Comment } from '@/models/index'
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

const FREQUENCY_WINDOW = 60
const FREQUENCY_MAX = 5
const DUPLICATE_WINDOW = 300
const DUPLICATE_MAX = 3

interface ComplianceCheckResult {
  passed: boolean
  violations: ComplianceViolation[]
  sensitiveMatches: string[]
  riskLevel: number
  intercepted: boolean
}

interface ComplianceViolation {
  type: string
  typeName: string
  matched: string[]
  level: number
  message: string
}

export const commentComplianceService = {
  checkContent(content: string): {
    sensitiveMatches: string[]
    violationMatches: string[]
    trafficMatches: string[]
    allMatches: string[]
  } {
    const sensitiveMatches: string[] = []
    const violationMatches: string[] = []
    const trafficMatches: string[] = []

    for (const word of SENSITIVE_WORDS) {
      if (content.includes(word)) {
        sensitiveMatches.push(word)
      }
    }

    for (const phrase of VIOLATION_PHRASES) {
      if (content.includes(phrase)) {
        violationMatches.push(phrase)
      }
    }

    for (const keyword of TRAFFIC_KEYWORDS) {
      if (content.includes(keyword)) {
        trafficMatches.push(keyword)
      }
    }

    const allMatches = [...new Set([...sensitiveMatches, ...violationMatches, ...trafficMatches])]

    return { sensitiveMatches, violationMatches, trafficMatches, allMatches }
  },

  async checkFrequency(userId: number): Promise<{
    isHighFrequency: boolean
    count: number
    limit: number
  }> {
    const windowStart = new Date(Date.now() - FREQUENCY_WINDOW * 1000)
    const count = await Comment.count({
      where: {
        userId,
        createTime: { [Op.gte]: windowStart }
      }
    })

    return {
      isHighFrequency: count >= FREQUENCY_MAX,
      count,
      limit: FREQUENCY_MAX
    }
  },

  async checkDuplicate(userId: number, content: string): Promise<{
    isDuplicate: boolean
    duplicateCount: number
    limit: number
  }> {
    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW * 1000)
    const duplicateCount = await Comment.count({
      where: {
        userId,
        content: { [Op.like]: `%${content.substring(0, 50)}%` },
        createTime: { [Op.gte]: windowStart }
      }
    })

    return {
      isDuplicate: duplicateCount >= DUPLICATE_MAX,
      duplicateCount,
      limit: DUPLICATE_MAX
    }
  },

  async checkRelevance(noteId: number, content: string): Promise<{
    isRelevant: boolean
    score: number
  }> {
    const note = await import('@/models/index').then(m => m.Note.findByPk(noteId))
    if (!note) {
      return { isRelevant: false, score: 0 }
    }

    const noteContent = (note.title + ' ' + note.content).toLowerCase()
    const commentWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 1)
    if (commentWords.length === 0) {
      return { isRelevant: true, score: 1 }
    }

    let matchCount = 0
    for (const word of commentWords) {
      if (noteContent.includes(word)) {
        matchCount++
      }
    }

    const score = matchCount / commentWords.length
    return {
      isRelevant: score >= 0.1,
      score: Math.round(score * 100) / 100
    }
  },

  async fullCheck(
    content: string,
    userId: number,
    noteId: number
  ): Promise<ComplianceCheckResult> {
    const violations: ComplianceViolation[] = []
    let maxRiskLevel = 0
    let intercepted = false

    const contentResult = this.checkContent(content)

    if (contentResult.sensitiveMatches.length > 0) {
      violations.push({
        type: 'sensitive_word',
        typeName: '敏感词',
        matched: contentResult.sensitiveMatches,
        level: 3,
        message: `包含敏感词：${contentResult.sensitiveMatches.join('、')}`
      })
      maxRiskLevel = 3
    }

    if (contentResult.violationMatches.length > 0) {
      const level = maxRiskLevel >= 3 ? 3 : 2
      violations.push({
        type: 'violation_phrase',
        typeName: '违规话术',
        matched: contentResult.violationMatches,
        level,
        message: `包含违规话术：${contentResult.violationMatches.join('、')}`
      })
      maxRiskLevel = Math.max(maxRiskLevel, level)
    }

    if (contentResult.trafficMatches.length > 0) {
      const level = maxRiskLevel >= 2 ? maxRiskLevel : 1
      violations.push({
        type: 'traffic_keyword',
        typeName: '引流关键词',
        matched: contentResult.trafficMatches,
        level,
        message: `包含引流关键词：${contentResult.trafficMatches.join('、')}`
      })
      maxRiskLevel = Math.max(maxRiskLevel, 1)
    }

    const frequencyResult = await this.checkFrequency(userId)
    if (frequencyResult.isHighFrequency) {
      violations.push({
        type: 'high_frequency',
        typeName: '高频评论',
        matched: [`${frequencyResult.count}次/${FREQUENCY_WINDOW}秒`],
        level: 2,
        message: `评论频次过高：${frequencyResult.count}次/${FREQUENCY_WINDOW}秒，限制${FREQUENCY_MAX}次`
      })
      maxRiskLevel = Math.max(maxRiskLevel, 2)
    }

    const duplicateResult = await this.checkDuplicate(userId, content)
    if (duplicateResult.isDuplicate) {
      violations.push({
        type: 'duplicate_content',
        typeName: '重复评论',
        matched: [`${duplicateResult.duplicateCount}次/${DUPLICATE_WINDOW}秒`],
        level: 2,
        message: `短时间重复评论：${duplicateResult.duplicateCount}次/${DUPLICATE_WINDOW}秒`
      })
      maxRiskLevel = Math.max(maxRiskLevel, 2)
    }

    const relevanceResult = await this.checkRelevance(noteId, content)
    if (!relevanceResult.isRelevant) {
      violations.push({
        type: 'irrelevant',
        typeName: '无关评论',
        matched: [`相关度${relevanceResult.score}`],
        level: 1,
        message: `评论内容与笔记主题匹配度过低：${relevanceResult.score}`
      })
      maxRiskLevel = Math.max(maxRiskLevel, 1)
    }

    if (maxRiskLevel >= 3) {
      intercepted = true
    } else if (maxRiskLevel >= 2 && frequencyResult.isHighFrequency) {
      intercepted = true
    }

    return {
      passed: violations.length === 0,
      violations,
      sensitiveMatches: contentResult.allMatches,
      riskLevel: maxRiskLevel,
      intercepted
    }
  },

  getSensitiveWords(): string[] {
    return [...SENSITIVE_WORDS]
  },

  getViolationPhrases(): string[] {
    return [...VIOLATION_PHRASES]
  },

  getTrafficKeywords(): string[] {
    return [...TRAFFIC_KEYWORDS]
  },

  highlightContent(content: string, matches: string[]): Array<{ text: string; isSensitive: boolean }> {
    if (matches.length === 0) {
      return [{ text: content, isSensitive: false }]
    }

    const sorted = [...matches].sort((a, b) => b.length - a.length)
    const parts: Array<{ text: string; isSensitive: boolean }> = []
    let remaining = content

    while (remaining.length > 0) {
      let earliestIndex = remaining.length
      let earliestMatch = ''

      for (const match of sorted) {
        const idx = remaining.indexOf(match)
        if (idx !== -1 && idx < earliestIndex) {
          earliestIndex = idx
          earliestMatch = match
        }
      }

      if (earliestMatch === '') {
        parts.push({ text: remaining, isSensitive: false })
        break
      }

      if (earliestIndex > 0) {
        parts.push({ text: remaining.substring(0, earliestIndex), isSensitive: false })
      }

      parts.push({ text: earliestMatch, isSensitive: true })
      remaining = remaining.substring(earliestIndex + earliestMatch.length)
    }

    return parts
  }
}
