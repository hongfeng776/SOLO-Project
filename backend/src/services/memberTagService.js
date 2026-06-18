const { User, Member, TagDefinition, MemberLevelLog, MemberTagLog, OperationLog, Notification, Resource } = require('../models')
const { Op } = require('sequelize')
const { getPagination, generateRandomString } = require('../utils/common')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')

const memberLevelService = require('./memberLevelService')

class MemberTagService {
  async validateTagName(name, excludeId = null) {
    const where = { name }
    if (excludeId) where.id = { [Op.ne]: excludeId }
    const exists = await TagDefinition.count({ where })
    if (exists > 0) return { valid: false, reason: `标签名称"${name}"已存在，请使用其他名称` }
    if (!name || name.length < 1 || name.length > 20) return { valid: false, reason: '标签名称长度1-20字符' }
    return { valid: true }
  }

  validateApplicableLevels(levels) {
    const allowed = TagDefinition.USER_LEVELS
    if (!levels || !Array.isArray(levels) || levels.length === 0) return { valid: false, reason: '请至少选择一个适用人群层级' }
    const invalid = levels.filter((l) => !allowed.includes(l))
    if (invalid.length) return { valid: false, reason: `无效的层级: ${invalid.join(',')}` }
    return { valid: true }
  }

  async createTagDefinition(data, operatorInfo = {}) {
    const nameCheck = this.validateTagName(data.name)
    if (!nameCheck.valid) throw ApiError.badRequest(nameCheck.reason)
    const levelCheck = this.validateApplicableLevels(data.applicableLevels)
    if (!levelCheck.valid) throw ApiError.badRequest(levelCheck.reason)

    const tag = await TagDefinition.create({
      name: data.name,
      color: data.color || '#67C23A',
      icon: data.icon || null,
      dimension: data.dimension || 'composite',
      applicableLevels: data.applicableLevels || [],
      minConsumeAmount: data.minConsumeAmount || 0,
      minActiveHours: data.minActiveHours || 0,
      minCreateCount: data.minCreateCount || 0,
      description: data.description || '',
      createdById: operatorInfo.id,
      createdByName: operatorInfo.username,
      status: 'active'
    })
    return tag
  }

  async updateTagDefinition(id, data, operatorInfo = {}) {
    const tag = await TagDefinition.findByPk(id)
    if (!tag) throw ApiError.notFound('标签定义不存在')
    if (data.name !== undefined) {
      const nameCheck = this.validateTagName(data.name, id)
      if (!nameCheck.valid) throw ApiError.badRequest(nameCheck.reason)
    }
    if (data.applicableLevels !== undefined) {
      const levelCheck = this.validateApplicableLevels(data.applicableLevels)
      if (!levelCheck.valid) throw ApiError.badRequest(levelCheck.reason)
    }
    await tag.update(data)
    return tag
  }

  async listTagDefinitions(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.status) where.status = params.status
    if (params.dimension) where.dimension = params.dimension
    if (params.keyword) where.name = { [Op.like]: `%${params.keyword}%` }
    const { count, rows } = await TagDefinition.findAndCountAll({ where, offset, limit, order: [['id', 'DESC']] })
    return { list: rows, total: count, page, pageSize }
  }

  async checkUserTagMatch(userId, tagName) {
    const member = await memberLevelService.getOrCreateMember(userId)
    const user = await User.findByPk(userId)
    const displayLevel = memberLevelService.getDisplayLevel(member.level)
    const tag = await TagDefinition.findOne({ where: { name: tagName, status: 'active' } })

    if (!tag) {
      return { matched: false, custom: true, reason: '自定义标签，无适配规则', valid: true }
    }

    if (!tag.applicableLevels.includes(displayLevel)) {
      return { matched: false, reason: `标签仅限${tag.applicableLevels.join('、')}层级用户使用，当前为${displayLevel}`, dimension: tag.dimension }
    }

    const consume = parseFloat(member.totalConsume || 0)
    const hours = parseInt(member.totalActiveHours || 0)
    const count = parseInt(member.totalCreateCount || 0)
    const needConsume = parseFloat(tag.minConsumeAmount || 0)
    const needHours = parseInt(tag.minActiveHours || 0)
    const needCount = parseInt(tag.minCreateCount || 0)

    const missing = []
    if (needConsume > 0 && consume < needConsume) missing.push(`消费不足${needConsume}元`)
    if (needHours > 0 && hours < needHours) missing.push(`活跃不足${needHours}小时`)
    if (needCount > 0 && count < needCount) missing.push(`创作不足${needCount}件`)

    if (missing.length) {
      return { matched: false, reason: missing.join('；'), dimension: tag.dimension, tagId: tag.id }
    }

    return { matched: true, dimension: tag.dimension, tagId: tag.id, userSnapshot: { displayLevel, consume, hours, count } }
  }

  async addTagsToUser(userId, tagNames, operatorInfo = {}, reason = '') {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const oldTags = [...(user.tags || [])]

    const duplicates = []
    const mismatches = []
    const added = []
    const matchResults = {}

    for (const t of tagNames) {
      if (oldTags.includes(t)) {
        duplicates.push(t)
        continue
      }
      const match = await this.checkUserTagMatch(userId, t)
      matchResults[t] = match
      if (!match.custom && !match.matched) {
        mismatches.push({ name: t, reason: match.reason })
        continue
      }
      added.push(t)
    }

    const newTags = [...oldTags, ...added]
    await user.update({ tags: newTags })

    const log = await MemberTagLog.create({
      userId,
      uid: user.uid,
      username: user.username,
      changeType: 'add',
      oldTags,
      newTags,
      addedTags: added,
      removedTags: [],
      matchValidation: matchResults,
      duplicates,
      mismatches,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username,
      operatorRole: operatorInfo.role,
      reason,
      ip: operatorInfo.ip
    })

    return { user: { id: user.id, tags: newTags }, log, added, duplicates, mismatches }
  }

  async removeTagsFromUser(userId, tagNames, operatorInfo = {}, reason = '') {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const oldTags = [...(user.tags || [])]
    const removed = []
    for (const t of tagNames) {
      if (oldTags.includes(t)) removed.push(t)
    }
    const newTags = oldTags.filter((t) => !removed.includes(t))
    await user.update({ tags: newTags })
    const log = await MemberTagLog.create({
      userId, uid: user.uid, username: user.username,
      changeType: 'remove', oldTags, newTags, addedTags: [], removedTags: removed,
      operatorId: operatorInfo.id, operatorName: operatorInfo.username, operatorRole: operatorInfo.role,
      reason, ip: operatorInfo.ip
    })
    return { user: { id: user.id, tags: newTags }, log, removed }
  }

  async batchApplyTags(params, operatorInfo = {}) {
    const {
      userIds = [],
      tagNames = [],
      filterBy = null,
      activeRange = null,
      consumeLevel = null
    } = params

    if (tagNames.length === 0) throw ApiError.badRequest('请至少选择一个标签')

    let targetIds = [...userIds]
    const additionalWhere = {}
    if (consumeLevel) {
      if (consumeLevel === 'high') additionalWhere.totalConsume = { [Op.gte]: 1000 }
      else if (consumeLevel === 'mid') additionalWhere.totalConsume = { [Op.and]: [{ [Op.gte]: 100 }, { [Op.lt]: 1000 }] }
      else if (consumeLevel === 'low') additionalWhere.totalConsume = { [Op.lt]: 100 }
    }

    let memberWhere = { ...additionalWhere }
    if (targetIds.length > 0) memberWhere.userId = { [Op.in]: targetIds }

    let members = await Member.findAll({ where: memberWhere, attributes: ['userId'] })
    let candidateUserIds = members.map((m) => m.userId)

    if (activeRange) {
      const [min, max] = activeRange
      const activeWhere = { userId: { [Op.in]: candidateUserIds } }
      if (min !== null && min !== undefined) activeWhere.totalActiveHours = { [Op.gte]: min }
      if (max !== null && max !== undefined) activeWhere.totalActiveHours = { [Op.lte]: max }
      members = await Member.findAll({ where: activeWhere, attributes: ['userId'] })
      candidateUserIds = members.map((m) => m.userId)
    }

    if (filterBy === 'vip_only') {
      const displayMap = { bronze: 'vip', silver: 'vip', gold: 'vip', platinum: 'premium_vip', normal: 'normal' }
      const vipMembers = await Member.findAll({
        where: { userId: { [Op.in]: candidateUserIds } },
        attributes: ['userId', 'level']
      })
      candidateUserIds = vipMembers.filter((m) => displayMap[m.level] !== 'normal').map((m) => m.userId)
    } else if (filterBy === 'premium_only') {
      const pm = await Member.findAll({ where: { userId: { [Op.in]: candidateUserIds }, level: 'platinum' }, attributes: ['userId'] })
      candidateUserIds = pm.map((m) => m.userId)
    }

    const batchId = 'T' + Date.now().toString().slice(-8) + generateRandomString(4).toUpperCase()
    const total = candidateUserIds.length
    const success = []
    const failed = []
    const skipped = []

    for (let i = 0; i < total; i++) {
      const uid = candidateUserIds[i]
      try {
        const result = await this.addTagsToUser(uid, tagNames, { ...operatorInfo, batchId }, `批量配置[${batchId}]`)
        if (result.added.length === 0) {
          skipped.push({ userId: uid, username: result.user.username || '', duplicates: result.duplicates, mismatches: result.mismatches })
        } else {
          success.push({ userId: uid, username: result.log.username, added: result.added })
        }
      } catch (err) {
        failed.push({ userId: uid, reason: err.message || String(err) })
      }
    }

    return { batchId, total, successCount: success.length, failedCount: failed.length, skippedCount: skipped.length, success, failed, skipped }
  }

  async getTagLogs(userId, params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = { userId }
    if (params.changeType) where.changeType = params.changeType
    const { count, rows } = await MemberTagLog.findAndCountAll({ where, offset, limit, order: [['createdAt', 'DESC']] })
    return { list: rows, total: count, page, pageSize }
  }

  async getTagTrace(userId) {
    const user = await User.findByPk(userId)
    if (!user) throw ApiError.notFound('用户不存在')
    const member = await memberLevelService.getOrCreateMember(userId)
    const currentTags = user.tags || []

    const tagLogs = await MemberTagLog.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 })
    const levelLogs = await MemberLevelLog.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 20 })

    const allTagNamesEver = new Set(currentTags)
    for (const log of tagLogs) {
      for (const t of (log.newTags || [])) allTagNamesEver.add(t)
      for (const t of (log.oldTags || [])) allTagNamesEver.add(t)
    }

    const definitions = await TagDefinition.findAll({ where: { name: { [Op.in]: [...allTagNamesEver] } } })
    const defMap = {}
    for (const d of definitions) defMap[d.name] = d

    const duplicateCheck = {}
    for (const t of currentTags) {
      duplicateCheck[t] = (duplicateCheck[t] || 0) + 1
    }
    const duplicates = Object.keys(duplicateCheck).filter((t) => duplicateCheck[t] > 1)

    const mismatches = []
    const cleanedSuggestions = []
    for (const t of currentTags) {
      const def = defMap[t]
      if (def) {
        const match = await this.checkUserTagMatch(userId, t)
        if (!match.matched) {
          mismatches.push({ name: t, reason: match.reason, dimension: def.dimension })
          cleanedSuggestions.push(t)
        }
      } else {
        const logOccurrence = tagLogs.filter((l) => (l.newTags || []).includes(t)).length
        if (logOccurrence === 0 && !['VIP用户', '高级VIP', '尊享用户'].includes(t)) {
          cleanedSuggestions.push(t)
        }
      }
    }

    return {
      user: { id: user.id, uid: user.uid, username: user.username, displayLevel: memberLevelService.getDisplayLevel(member.level), currentTags },
      member: { totalConsume: parseFloat(member.totalConsume || 0), totalActiveHours: parseInt(member.totalActiveHours || 0), totalCreateCount: parseInt(member.totalCreateCount || 0) },
      tagLogs,
      levelLogs,
      validation: { duplicates, mismatches, cleanedSuggestions },
      tagDefinitions: definitions
    }
  }

  async cleanRedundantTags(userId, operatorInfo = {}) {
    const trace = await this.getTagTrace(userId)
    const toRemove = [...new Set([...trace.validation.duplicates, ...trace.validation.cleanedSuggestions])]
    if (toRemove.length === 0) {
      return { cleaned: [], removed: [], user: { id: userId, tags: trace.user.currentTags } }
    }
    const result = await this.removeTagsFromUser(userId, toRemove, operatorInfo, `冗余标签清理：重复/错配/无效`)
    const log = await MemberTagLog.findByPk(result.log.id)
    if (log) {
      log.changeType = 'auto_clean'
      await log.save()
    }
    return { cleaned: toRemove, removed: result.removed, user: result.user, log: result.log }
  }

  async getTagMeta() {
    return {
      dimensions: TagDefinition.DIMENSIONS,
      userLevels: TagDefinition.USER_LEVELS,
      consumeLevels: [
        { value: 'low', label: '低消费(<100元)' },
        { value: 'mid', label: '中消费(100-999元)' },
        { value: 'high', label: '高消费(≥1000元)' }
      ],
      filterOptions: [
        { value: null, label: '全部用户' },
        { value: 'vip_only', label: '仅VIP及以上' },
        { value: 'premium_only', label: '仅高级VIP' }
      ]
    }
  }
}

module.exports = new MemberTagService()
