const { User, Member, UserEditLog, AccountComplianceLog, OperationLog } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateRandomString } = require('../utils/common')
const { hashPassword, comparePassword } = require('../utils/auth')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')

const PHONE_REGEX = /^1[3-9]\d{9}$/

const SENSITIVE_WORDS = User.SENSITIVE_WORDS || []

const VIP_LEVELS = ['gold', 'platinum']

class AccountService {
  async validatePhone(phone, excludeUserId = null) {
    if (!phone) return { valid: true, errors: [] }

    const errors = []

    if (!PHONE_REGEX.test(phone)) {
      errors.push('手机号格式不正确，请输入11位有效手机号')
    }

    const where = { phone }
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId }
    }
    const existing = await User.findOne({ where })

    if (existing) {
      errors.push('该手机号已被其他账号使用')
    }

    return { valid: errors.length === 0, errors }
  }

  async validateNickname(nickname, excludeUserId = null) {
    if (!nickname) return { valid: true, errors: [] }

    const errors = []

    const matchedWords = SENSITIVE_WORDS.filter((word) =>
      nickname.toLowerCase().includes(word.toLowerCase())
    )
    if (matchedWords.length > 0) {
      errors.push(`昵称包含敏感词: ${matchedWords.join('、')}`)
    }

    const where = { nickname }
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId }
    }
    const existing = await User.findOne({ where })

    if (existing) {
      errors.push('该昵称已被其他账号使用')
    }

    return { valid: errors.length === 0, errors }
  }

  async validateUid(uid, excludeUserId = null) {
    if (!uid) return { valid: true, errors: [] }

    const errors = []

    const where = { uid }
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId }
    }
    const existing = await User.findOne({ where })

    if (existing) {
      errors.push('该UID已被其他账号使用')
    }

    return { valid: errors.length === 0, errors }
  }

  async validateAccount(data, excludeUserId = null) {
    const results = {
      valid: true,
      phone: { valid: true, errors: [] },
      nickname: { valid: true, errors: [] },
      uid: { valid: true, errors: [] }
    }

    if (data.phone) {
      results.phone = await this.validatePhone(data.phone, excludeUserId)
    }

    if (data.nickname) {
      results.nickname = await this.validateNickname(data.nickname, excludeUserId)
    }

    if (data.uid) {
      results.uid = await this.validateUid(data.uid, excludeUserId)
    }

    results.valid = results.phone.valid && results.nickname.valid && results.uid.valid

    return results
  }

  generateUid() {
    const datePart = dayjs().format('YYYYMMDD')
    const randomPart = generateRandomString(8).toUpperCase()
    return `U${datePart}${randomPart}`
  }

  async createAccount(data, operatorInfo = {}) {
    const validation = await this.validateAccount(data)
    if (!validation.valid) {
      const allErrors = [
        ...validation.phone.errors,
        ...validation.nickname.errors,
        ...validation.uid.errors
      ]
      throw ApiError.badRequest(allErrors.join('; '))
    }

    if (!data.uid) {
      data.uid = this.generateUid()
    }

    const existingUser = await User.findOne({ where: { username: data.username } })
    if (existingUser) {
      throw ApiError.badRequest('用户名已存在')
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await User.create({
      ...data,
      password: hashedPassword,
      tags: data.tags || [],
      permissionGroup: data.permissionGroup || 'default'
    })

    if (user.role === 'member' || !data.role || data.role === 'member') {
      await Member.create({
        userId: user.id,
        username: user.username,
        level: 'normal',
        points: 0,
        balance: 0
      })
    }

    await AccountComplianceLog.create({
      userId: user.id,
      uid: user.uid,
      checkType: 'create',
      checkResult: 'pass',
      checkItems: validation,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username
    })

    await OperationLog.create({
      userId: operatorInfo.id,
      username: operatorInfo.username,
      module: 'user',
      action: 'create_account',
      target: user.username,
      targetId: user.id,
      detail: JSON.stringify({ uid: user.uid, role: user.role }),
      ip: operatorInfo.ip,
      result: 'success'
    })

    const result = user.toJSON()
    delete result.password

    return result
  }

  async editWithVerification(id, data, operatorInfo = {}, verifyPassword = null) {
    const user = await User.findByPk(id)
    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    const coreFields = ['phone', 'password']
    const isCoreEdit = coreFields.some((f) => data[f] !== undefined)

    if (['frozen', 'banned'].includes(user.status) && isCoreEdit) {
      throw ApiError.badRequest(`账号处于${user.status === 'frozen' ? '冻结' : '封禁'}状态，禁止修改手机号、登录密码等核心字段`)
    }

    if (isCoreEdit && verifyPassword) {
      const isValid = await comparePassword(verifyPassword, user.password)
      if (!isValid) {
        throw ApiError.badRequest('二次身份校验失败，密码不正确')
      }
    } else if (isCoreEdit) {
      throw ApiError.badRequest('修改核心字段需进行二次身份校验')
    }

    const validation = await this.validateAccount(
      { phone: data.phone, nickname: data.nickname, uid: data.uid },
      id
    )
    if (!validation.valid) {
      const allErrors = [
        ...validation.phone.errors,
        ...validation.nickname.errors,
        ...validation.uid.errors
      ]
      throw ApiError.badRequest(allErrors.join('; '))
    }

    const editLogs = []
    const changedFields = Object.keys(data).filter((k) => !['id', 'verifyPassword'].includes(k))

    for (const field of changedFields) {
      const oldValue = user[field]
      let newValue = data[field]

      if (field === 'password') {
        newValue = await hashPassword(newValue)
      }

      if (JSON.stringify(oldValue) !== JSON.stringify(data[field])) {
        const log = await UserEditLog.create({
          userId: id,
          editorId: operatorInfo.id,
          editorName: operatorInfo.username,
          field,
          oldValue: field === 'password' ? '******' : JSON.stringify(oldValue),
          newValue: field === 'password' ? '******' : JSON.stringify(data[field]),
          editStep: data.editStep || 1,
          verified: isCoreEdit && verifyPassword ? true : false,
          ip: operatorInfo.ip
        })
        editLogs.push(log)
      }
    }

    if (data.password) {
      data.password = await hashPassword(data.password)
    }

    await user.update(data)

    await AccountComplianceLog.create({
      userId: id,
      uid: user.uid,
      checkType: 'edit',
      checkResult: validation.valid ? 'pass' : 'fail',
      checkItems: validation,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username
    })

    const result = user.toJSON()
    delete result.password

    return { user: result, editLogs }
  }

  async getEditLogs(userId, params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = { userId }

    if (params.field) {
      where.field = params.field
    }

    const { count, rows } = await UserEditLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async batchUpdate(ids, data, operatorInfo = {}) {
    if (!ids || ids.length === 0) {
      throw ApiError.badRequest('请选择需要操作的用户')
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: ids } },
      include: [{ model: Member, as: 'member' }]
    })

    if (users.length === 0) {
      throw ApiError.notFound('未找到指定用户')
    }

    const results = {
      successIds: [],
      failedItems: [],
      updated: 0
    }

    for (const user of users) {
      const failReasons = []

      const memberLevel = user.member ? user.member.level : 'normal'
      const isVip = VIP_LEVELS.includes(memberLevel)

      if (isVip && data.tags) {
        failReasons.push('VIP用户核心标签禁止批量修改')
      }

      if (['frozen', 'banned'].includes(user.status)) {
        if (data.permissionGroup) {
          failReasons.push(`${user.status === 'frozen' ? '冻结' : '封禁'}账号禁止修改权限分组`)
        }
      }

      if (failReasons.length > 0) {
        results.failedItems.push({
          id: user.id,
          username: user.username,
          reasons: failReasons
        })
        continue
      }

      const updateData = {}

      if (data.nicknameSuffix && user.nickname) {
        updateData.nickname = user.nickname + data.nicknameSuffix
      }

      if (data.tags && !isVip) {
        const currentTags = user.tags || []
        updateData.tags = [...new Set([...currentTags, ...data.tags])]
      }

      if (data.permissionGroup && !['frozen', 'banned'].includes(user.status)) {
        updateData.permissionGroup = data.permissionGroup
      }

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData)
        results.successIds.push(user.id)
        results.updated++

        await UserEditLog.create({
          userId: user.id,
          editorId: operatorInfo.id,
          editorName: operatorInfo.username,
          field: 'batch_update',
          oldValue: JSON.stringify({
            nickname: user.nickname,
            tags: user.tags,
            permissionGroup: user.permissionGroup
          }),
          newValue: JSON.stringify(updateData),
          editStep: 1,
          verified: false,
          ip: operatorInfo.ip
        })
      }
    }

    await AccountComplianceLog.create({
      checkType: 'batch',
      checkResult: results.failedItems.length > 0 ? 'warning' : 'pass',
      checkItems: {
        totalRequested: ids.length,
        successCount: results.updated,
        failCount: results.failedItems.length
      },
      inconsistencies: results.failedItems,
      operatorId: operatorInfo.id,
      operatorName: operatorInfo.username
    })

    return results
  }

  async traceAccount(params = {}) {
    const where = {}

    if (params.uid) {
      where.uid = params.uid
    }
    if (params.phone) {
      where.phone = params.phone
    }
    if (params.username) {
      where.username = params.username
    }

    if (params.registerTimeStart && params.registerTimeEnd) {
      where.createdAt = {
        [Op.between]: [params.registerTimeStart, params.registerTimeEnd]
      }
    } else if (params.registerTimeStart) {
      where.createdAt = {
        [Op.gte]: params.registerTimeStart
      }
    }

    if (Object.keys(where).length === 0) {
      throw ApiError.badRequest('请提供至少一个检索条件(UID/手机号/用户名/注册时间)')
    }

    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      attributes: { exclude: ['password'] },
      include: [
        { model: Member, as: 'member' },
        { model: UserEditLog, as: 'editLogs', limit: 50, order: [['createdAt', 'DESC']] }
      ],
      order: [['createdAt', 'DESC']]
    })

    const traceResults = []

    for (const user of rows) {
      const inconsistencies = []
      const editLogs = user.editLogs || []

      const phoneEdits = editLogs.filter((log) => log.field === 'phone')
      if (phoneEdits.length > 0) {
        const lastEdit = phoneEdits[0]
        if (lastEdit.oldValue && lastEdit.newValue) {
          inconsistencies.push({
            field: 'phone',
            type: 'phone_modified',
            description: `手机号从 ${lastEdit.oldValue} 修改为 ${lastEdit.newValue}`,
            severity: 'warning'
          })
        }
      }

      const loginAnomaly = !user.lastLoginTime && user.createdAt
        && dayjs().diff(dayjs(user.createdAt), 'day') > 30
      if (loginAnomaly) {
        inconsistencies.push({
          field: 'lastLoginTime',
          type: 'no_login_record',
          description: '注册超过30天但无登录记录，疑似虚假注册',
          severity: 'high'
        })
      }

      const rapidEdits = editLogs.filter(
        (log) =>
          dayjs(log.createdAt).diff(dayjs(user.createdAt), 'minute') < 5
          && log.createdAt !== user.createdAt
      )
      if (rapidEdits.length > 3) {
        inconsistencies.push({
          field: 'editLogs',
          type: 'rapid_edits',
          description: `注册5分钟内进行了${rapidEdits.length}次编辑，疑似信息篡改`,
          severity: 'high'
        })
      }

      const checkResult = inconsistencies.length === 0 ? 'pass'
        : inconsistencies.some((i) => i.severity === 'high') ? 'fail' : 'warning'

      await AccountComplianceLog.create({
        userId: user.id,
        uid: user.uid,
        checkType: 'trace',
        checkResult,
        checkItems: {
          editLogCount: editLogs.length,
          phoneEdits: phoneEdits.length,
          loginAnomaly,
          rapidEdits: rapidEdits.length
        },
        inconsistencies,
        operatorId: params.operatorId,
        operatorName: params.operatorName
      })

      traceResults.push({
        user: user.toJSON(),
        member: user.member ? user.member.toJSON() : null,
        editLogs: editLogs.map((l) => l.toJSON()),
        consistencyCheck: {
          consistent: inconsistencies.length === 0,
          inconsistencies
        }
      })
    }

    delete rows

    return {
      list: traceResults,
      total: count,
      page,
      pageSize
    }
  }

  async getComplianceLogs(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.userId) {
      where.userId = params.userId
    }
    if (params.uid) {
      where.uid = params.uid
    }
    if (params.checkType) {
      where.checkType = params.checkType
    }
    if (params.checkResult) {
      where.checkResult = params.checkResult
    }

    const { count, rows } = await AccountComplianceLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }
}

module.exports = new AccountService()
