const { User, Member, TagDefinition, MemberLevelLog, MemberTagLog, OperationLog, Notification } = require('../models')
const { Op } = require('sequelize')
const { getPagination, generateRandomString } = require('../utils/common')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')

const INTERNAL_TO_DISPLAY = {
  normal: 'normal',
  bronze: 'vip',
  silver: 'vip',
  gold: 'vip',
  platinum: 'premium_vip'
}

const DISPLAY_LEVEL_ORDER = { normal: 1, vip: 2, premium_vip: 3 }
const INTERNAL_LEVEL_ORDER = { normal: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 }

const DISPLAY_TO_MIN_INTERNAL = {
  normal: 'normal',
  vip: 'bronze',
  premium_vip: 'platinum'
}

const LEVEL_UPGRADE_CRITERIA = {
  vip: { minConsume: 100.00, minActiveHours: 10, minCreateCount: 3 },
  premium_vip: { minConsume: 1000.00, minActiveHours: 100, minCreateCount: 20 }
}

const LEVEL_BENEFITS = {
  normal: [
    { key: 'basic_download', label: '基础下载(5次/天)', value: true },
    { key: 'watermark', label: '下载带水印', value: true }
  ],
  vip: [
    { key: 'basic_download', label: '基础下载(50次/天)', value: true },
    { key: 'hd_download', label: '高清下载', value: true },
    { key: 'no_watermark', label: '无水印下载', value: true },
    { key: 'vip_template', label: 'VIP模板专区', value: true }
  ],
  premium_vip: [
    { key: 'basic_download', label: '无限次下载', value: true },
    { key: 'hd_download', label: '高清/4K下载', value: true },
    { key: 'no_watermark', label: '无水印下载', value: true },
    { key: 'vip_template', label: '全模板专区', value: true },
    { key: 'priority_audit', label: '优先审核通道', value: true },
    { key: 'exclusive_service', label: '专属客服', value: true },
    { key: 'marketing_priority', label: '营销活动优先权', value: true }
  ]
}

const LEVEL_AUTO_TAGS = {
  vip: ['VIP用户'],
  premium_vip: ['高级VIP', '尊享用户']
}

class MemberLevelService {
  getDisplayLevel(internalLevel) {
    return INTERNAL_TO_DISPLAY[internalLevel] || 'normal'
  }

  compareDisplayLevel(l1, l2) {
    return (DISPLAY_LEVEL_ORDER[l1] || 0) - (DISPLAY_LEVEL_ORDER[l2] || 0)
  }

  compareInternalLevel(l1, l2) {
    return (INTERNAL_LEVEL_ORDER[l1] ?? -1) - (INTERNAL_LEVEL_ORDER[l2] ?? -1)
  }

  async getOrCreateMember(userId) {
    let member = await Member.findOne({ where: { userId } })
    if (!member) {
      const user = await User.findByPk(userId)
      if (!user) throw ApiError.notFound('用户不存在')
      member = await Member.create({ userId, username: user.username, level: 'normal' })
    }
    return member
  }

  validateLevelCriteria(member, targetDisplayLevel) {
    const criteria = LEVEL_UPGRADE_CRITERIA[targetDisplayLevel]
    if (!criteria) return { allPass: true, consumePass: true, activePass: true, createPass: true, missing: [] }

    const consume = parseFloat(member.totalConsume || 0)
    const hours = parseInt(member.totalActiveHours || 0)
    const count = parseInt(member.totalCreateCount || 0)

    const consumePass = consume >= criteria.minConsume
    const activePass = hours >= criteria.minActiveHours
    const createPass = count >= criteria.minCreateCount

    const missing = []
    if (!consumePass) missing.push(`累计消费金额不足，当前${consume}元，需≥${criteria.minConsume}元`)
    if (!activePass) missing.push(`活跃时长不足，当前${hours}小时，需≥${criteria.minActiveHours}小时`)
    if (!createPass) missing.push(`创作数量不足，当前${count}件，需≥${criteria.minCreateCount}件`)

    return {
      allPass: consumePass && activePass && createPass,
      consumePass,
      activePass,
      createPass,
      missing,
      snapshot: { totalConsume: consume, totalActiveHours: hours, totalCreateCount: count },
      criteria
    }
  }

  diffBenefits(oldDisplay, newDisplay) {
    const oldKeys = new Set((LEVEL_BENEFITS[oldDisplay] || []).map((b) => b.key))
    const newBenefits = LEVEL_BENEFITS[newDisplay] || []
    const unlocked = []
    const recovered = []
    for (const b of newBenefits) {
      if (!oldKeys.has(b.key)) unlocked.push(b)
    }
    const oldBenefits = LEVEL_BENEFITS[oldDisplay] || []
    const newKeys = new Set(newBenefits.map((b) => b.key))
    for (const b of oldBenefits) {
      if (!newKeys.has(b.key)) recovered.push(b)
    }
    return { unlocked, recovered }
  }

  async getLevelPreview(userId, targetDisplayLevel, force = false) {
    const member = await this.getOrCreateMember(userId)
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')

    const oldInternal = member.level
    const oldDisplay = this.getDisplayLevel(oldInternal)
    const newInternal = DISPLAY_TO_MIN_INTERNAL[targetDisplayLevel]

    const compare = this.compareDisplayLevel(oldDisplay, targetDisplayLevel)
    const isUpgrade = compare < 0
    const changeType = compare === 0 ? 'same' : isUpgrade ? 'upgrade' : 'downgrade'

    const criteriaResult = isUpgrade
      ? this.validateLevelCriteria(member, targetDisplayLevel)
      : { allPass: true, consumePass: true, activePass: true, createPass: true, missing: [], snapshot: { totalConsume: parseFloat(member.totalConsume || 0), totalActiveHours: parseInt(member.totalActiveHours || 0), totalCreateCount: parseInt(member.totalCreateCount || 0) }, criteria: null }

    const canChange = force || changeType !== 'upgrade' || criteriaResult.allPass

    const { unlocked, recovered } = this.diffBenefits(oldDisplay, targetDisplayLevel)

    let autoSyncedTags = []
    if (LEVEL_AUTO_TAGS[targetDisplayLevel]) {
      autoSyncedTags = [...LEVEL_AUTO_TAGS[targetDisplayLevel]]
    }

    return {
      userId,
      username: user.username,
      oldLevel: oldInternal,
      newLevel: newInternal,
      oldDisplayLevel: oldDisplay,
      newDisplayLevel: targetDisplayLevel,
      changeType,
      criteria: criteriaResult,
      canChange,
      unlockedBenefits: unlocked,
      recoveredBenefits: recovered,
      autoSyncedTags,
      currentTags: user.tags || []
    }
  }

  async changeLevel(userId, targetDisplayLevel, params = {}, operatorInfo = {}) {
    const { force = false, reason = '' } = params
    const preview = await this.getLevelPreview(userId, targetDisplayLevel, force)

    if (!preview.canChange) {
      throw ApiError.badRequest('未达到升级标准：' + preview.criteria.missing.join('；'))
    }

    const member = await this.getOrCreateMember(userId)
    const user = await User.findByPk(userId)
    const oldInternal = member.level
    const oldDisplay = preview.oldDisplayLevel
    const newInternal = DISPLAY_TO_MIN_INTERNAL[targetDisplayLevel]
    const changeType = preview.changeType

    await member.update({ level: newInternal, levelUpdatedAt: new Date() })

    const finalTags = [...(user.tags || [])]
    for (const t of preview.autoSyncedTags) {
      if (!finalTags.includes(t)) finalTags.push(t)
    }
    if (changeType === 'downgrade') {
      const removedAutoTags = []
      for (const l of Object.keys(LEVEL_AUTO_TAGS)) {
        if (this.compareDisplayLevel(l, targetDisplayLevel) > 0) {
          removedAutoTags.push(...LEVEL_AUTO_TAGS[l])
        }
      }
      for (const t of removedAutoTags) {
        const idx = finalTags.indexOf(t)
        if (idx >= 0) finalTags.splice(idx, 1)
      }
    }
    await user.update({ tags: finalTags })

    const log = await MemberLevelLog.create({
      userId,
      uid: user.uid,
      username: user.username,
      oldLevel: oldInternal,
      newLevel: newInternal,
      oldDisplayLevel: oldDisplay,
      newDisplayLevel: targetDisplayLevel,
      changeType: changeType === 'same' ? 'manual' : changeType,
      criteriaSnapshot: preview.criteria.snapshot,
      criteriaResult: {
        consumePass: preview.criteria.consumePass,
        activePass: preview.criteria.activePass,
        createPass: preview.criteria.createPass,
        allPass: preview.criteria.allPass,
        missing: preview.criteria.missing
      },
      unlockedBenefits: preview.unlockedBenefits,
      recoveredBenefits: preview.recoveredBenefits,
      autoSyncedTags: preview.autoSyncedTags,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      reason,
      ip: operatorInfo.ip
    })

    await MemberTagLog.create({
      userId,
      uid: user.uid,
      username: user.username,
      changeType: 'auto_sync',
      oldTags: user.tags || [],
      newTags: finalTags,
      addedTags: preview.autoSyncedTags.filter((t) => !(user.tags || []).includes(t)),
      removedTags: changeType === 'downgrade' ? Object.values(LEVEL_AUTO_TAGS).flat().filter((t) => (user.tags || []).includes(t) && !finalTags.includes(t)) : [],
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      reason: '层级变更自动同步',
      ip: operatorInfo.ip
    })

    await OperationLog.create({
      userId: operatorInfo.id,
      username: operatorInfo.username,
      module: 'member',
      action: 'change_level',
      target: user.username,
      targetId: user.id,
      detail: JSON.stringify({ from: oldDisplay, to: targetDisplayLevel, unlocked: preview.unlockedBenefits.map((b) => b.label) }),
      ip: operatorInfo.ip,
      result: 'success'
    })

    let notifyContent = `您的会员层级已变更：${oldDisplay} → ${targetDisplayLevel}`
    if (preview.unlockedBenefits.length) notifyContent += `，新增权益：${preview.unlockedBenefits.map((b) => b.label).join('、')}`
    if (preview.recoveredBenefits.length) notifyContent += `，回收权益：${preview.recoveredBenefits.map((b) => b.label).join('、')}`
    await Notification.create({ userId, title: '会员层级变更通知', content: notifyContent, type: 'member' })

    return {
      member,
      user: { id: user.id, tags: finalTags },
      levelLog: log,
      unlockedBenefits: preview.unlockedBenefits,
      recoveredBenefits: preview.recoveredBenefits,
      autoSyncedTags: preview.autoSyncedTags
    }
  }

  async getLevelLogs(userId, params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = { userId }
    if (params.changeType) where.changeType = params.changeType
    const { count, rows } = await MemberLevelLog.findAndCountAll({ where, offset, limit, order: [['createdAt', 'DESC']] })
    return { list: rows, total: count, page, pageSize }
  }

  async getCriteriaMeta() {
    return {
      displayLevels: Object.keys(DISPLAY_LEVEL_ORDER),
      levelOrder: DISPLAY_LEVEL_ORDER,
      upgradeCriteria: LEVEL_UPGRADE_CRITERIA,
      levelBenefits: LEVEL_BENEFITS,
      autoTags: LEVEL_AUTO_TAGS,
      internalToDisplay: INTERNAL_TO_DISPLAY
    }
  }
}

module.exports = new MemberLevelService()
