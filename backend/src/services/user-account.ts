import { User, UserAccountLog, UserAbnormalLog, ViolationRecord, Role } from '@models/index'
import { AppError } from '@utils/response'
import { Op } from 'sequelize'
import { RealNameStatus, UserAbnormalType, UserFilterType, UserAccountLogType, BatchOperationScope } from '@/enums/business'
import sequelize from '@config/database'

const SENSITIVE_FIELDS = ['idCard', 'phone', 'realName', 'email']
const BASIC_FIELDS = ['id', 'username', 'nickname', 'avatar', 'status', 'realNameVerified', 'registerSource', 'phoneVerified', 'isAbnormal', 'abnormalType', 'infoCompleteness', 'lastActiveTime', 'createTime']

const VALID_NICKNAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/
const VALID_PHONE_REGEX = /^1[3-9]\d{9}$/
const SENSITIVE_WORDS = ['管理员', '官方', '客服', 'admin', 'system', '色情', '赌博', '暴力', '恐怖']

interface OperatorInfo {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
}

interface QueryParams {
  page: number
  pageSize: number
  uid?: number
  phone?: string
  nickname?: string
  registerSource?: string
  realNameVerified?: number
  phoneVerified?: number
  registerStartDate?: string
  registerEndDate?: string
  filterType?: string
}

export const userAccountService = {
  async checkPermission(operator: OperatorInfo, operation: string): Promise<{ allowed: boolean; reason?: string; isSenior: boolean }> {
    const isSenior = operator.roles.includes('admin') || operator.roles.includes('senior_operator') || operator.permissions.includes('user:account:view_private')
    const isBasic = operator.roles.includes('operator') || operator.permissions.includes('user:account:view_basic')

    if (operation === 'view_private' && !isSenior) {
      return { allowed: false, reason: '无权限查看隐私信息，请联系高级运营', isSenior: false }
    }
    if (operation === 'view_basic' && !isSenior && !isBasic) {
      return { allowed: false, reason: '无权限查询用户信息', isSenior: false }
    }
    if (operation === 'edit' && !isSenior) {
      return { allowed: false, reason: '无权限编辑用户信息，请联系高级运营', isSenior: false }
    }
    if (operation === 'batch' && !isSenior) {
      return { allowed: false, reason: '无权限执行批量操作，请联系高级运营', isSenior: false }
    }

    return { allowed: true, isSenior }
  },

  async preCheckUser(userId: number): Promise<{ valid: boolean; issues: string[]; data?: any }> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      return { valid: false, issues: ['用户不存在'] }
    }

    const issues: string[] = []

    if (!user.registerSource) {
      issues.push('注册来源未知')
    }
    if (user.realNameVerified !== RealNameStatus.VERIFIED) {
      const statusMap: Record<number, string> = {
        [RealNameStatus.UNVERIFIED]: '未实名认证',
        [RealNameStatus.PENDING]: '实名认证审核中',
        [RealNameStatus.REJECTED]: '实名认证已拒绝'
      }
      issues.push(statusMap[user.realNameVerified ?? 0] || '实名认证状态异常')
    }
    if (!user.phoneVerified || !user.phone) {
      issues.push('未绑定手机号')
    }

    return { valid: issues.length === 0, issues, data: user }
  },

  async getUserDetail(userId: number, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const preCheck = await this.preCheckUser(userId)
    if (!preCheck.data) {
      throw new AppError('用户不存在', 404)
    }

    const user = preCheck.data
    const userData = user.toJSON()

    if (!permCheck.isSenior) {
      SENSITIVE_FIELDS.forEach(field => {
        delete userData[field]
      })
    }

    const derivedData = await this.getDerivedData(userId)

    return {
      user: userData,
      preCheck: preCheck,
      permission: {
        canViewSensitive: permCheck.isSenior,
        canEdit: permCheck.isSenior,
        canBatch: permCheck.isSenior
      },
      derivedData
    }
  },

  async getDerivedData(userId: number) {
    const [violations, accountLogs, abnormalLogs] = await Promise.all([
      ViolationRecord.findAll({
        where: { targetId: userId, targetType: 'user' },
        order: [['createTime', 'DESC']],
        limit: 10
      }),
      UserAccountLog.findAll({
        where: { userId },
        order: [['createTime', 'DESC']],
        limit: 10
      }),
      UserAbnormalLog.findAll({
        where: { userId },
        order: [['createTime', 'DESC']],
        limit: 10
      })
    ])

    const accountStatus = await this.calculateInfoCompleteness(userId)

    return {
      recentViolations: violations,
      recentAccountLogs: accountLogs,
      recentAbnormalLogs: abnormalLogs,
      infoCompleteness: accountStatus.completeness,
      missingFields: accountStatus.missingFields
    }
  },

  async calculateInfoCompleteness(userId: number): Promise<{ completeness: number; missingFields: string[] }> {
    const user = await User.findByPk(userId)
    if (!user) {
      return { completeness: 0, missingFields: ['用户不存在'] }
    }

    const fields = [
      { key: 'nickname', value: user.nickname, weight: 15 },
      { key: 'avatar', value: user.avatar, weight: 10 },
      { key: 'phone', value: user.phone, weight: 20 },
      { key: 'email', value: user.email, weight: 10 },
      { key: 'realName', value: user.realName, weight: 20 },
      { key: 'idCard', value: user.idCard, weight: 25 }
    ]

    let completeness = 0
    const missingFields: string[] = []

    fields.forEach(field => {
      if (field.value) {
        completeness += field.weight
      } else {
        missingFields.push(field.key)
      }
    })

    return { completeness, missingFields }
  },

  async queryUsers(params: QueryParams, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { page, pageSize, uid, phone, nickname, registerSource, realNameVerified, phoneVerified, registerStartDate, registerEndDate, filterType } = params

    const where: any = {}

    if (uid) {
      where.id = uid
    }
    if (phone) {
      where.phone = { [Op.like]: `%${phone}%` }
    }
    if (nickname) {
      where.nickname = { [Op.like]: `%${nickname}%` }
    }
    if (registerSource) {
      where.registerSource = registerSource
    }
    if (realNameVerified !== undefined) {
      where.realNameVerified = realNameVerified
    }
    if (phoneVerified !== undefined) {
      where.phoneVerified = phoneVerified
    }
    if (registerStartDate) {
      where.createTime = { ...where.createTime, [Op.gte]: new Date(registerStartDate) }
    }
    if (registerEndDate) {
      where.createTime = { ...where.createTime, [Op.lte]: new Date(registerEndDate) }
    }

    if (filterType) {
      const now = new Date()
      switch (filterType) {
        case UserFilterType.NEW_REGISTERED:
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          where.createTime = { [Op.gte]: sevenDaysAgo }
          break
        case UserFilterType.NOT_VERIFIED:
          where.realNameVerified = { [Op.ne]: RealNameStatus.VERIFIED }
          break
        case UserFilterType.LOW_ACTIVITY:
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          where[Op.or] = [
            { lastActiveTime: { [Op.lt]: thirtyDaysAgo } },
            { lastActiveTime: null }
          ]
          break
        case UserFilterType.NO_PHONE:
          where.phoneVerified = 0
          break
        case UserFilterType.ABNORMAL:
          where.isAbnormal = 1
          break
      }
    }

    const attributes = permCheck.isSenior ? { exclude: ['password'] } : BASIC_FIELDS

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes,
      include: [{ model: Role, as: 'roles', attributes: ['id', 'code', 'name'] }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      permission: {
        canViewSensitive: permCheck.isSenior,
        canEdit: permCheck.isSenior,
        canBatch: permCheck.isSenior
      }
    }
  },

  async validatePhone(phone: string): Promise<{ valid: boolean; message?: string }> {
    if (!phone) {
      return { valid: false, message: '手机号不能为空' }
    }
    if (!VALID_PHONE_REGEX.test(phone)) {
      return { valid: false, message: '手机号格式不正确' }
    }
    return { valid: true }
  },

  async validateNickname(nickname: string, excludeUserId?: number): Promise<{ valid: boolean; message?: string; suggestions?: string[] }> {
    if (!nickname) {
      return { valid: false, message: '昵称不能为空' }
    }
    if (!VALID_NICKNAME_REGEX.test(nickname)) {
      return { valid: false, message: '昵称只能包含中文、字母、数字和下划线，长度2-20位' }
    }

    for (const word of SENSITIVE_WORDS) {
      if (nickname.toLowerCase().includes(word.toLowerCase())) {
        return { valid: false, message: `昵称包含敏感词：${word}` }
      }
    }

    const where: any = { nickname }
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId }
    }
    const existing = await User.findOne({ where })
    if (existing) {
      const suggestions = [
        nickname + Math.floor(Math.random() * 1000),
        nickname + '_' + Math.floor(Math.random() * 100),
        nickname + Date.now().toString().slice(-4)
      ]
      return { valid: false, message: '该昵称已被使用', suggestions }
    }

    return { valid: true }
  },

  async validateAvatar(avatarUrl: string): Promise<{ valid: boolean; message?: string }> {
    if (!avatarUrl) {
      return { valid: true }
    }

    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i
    if (!urlPattern.test(avatarUrl)) {
      return { valid: false, message: '头像URL格式不正确，仅支持jpg、jpeg、png、gif、webp、svg格式' }
    }

    if (avatarUrl.length > 500) {
      return { valid: false, message: '头像URL长度不能超过500字符' }
    }

    return { valid: true }
  },

  async updateUserInfo(userId: number, data: { nickname?: string; avatar?: string; phone?: string; email?: string; reason?: string }, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'edit')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const updates: any = {}
    const logs: Array<{ fieldName: string; oldValue: string; newValue: string; logType: string }> = []

    if (data.nickname !== undefined && data.nickname !== user.nickname) {
      const nicknameCheck = await this.validateNickname(data.nickname, userId)
      if (!nicknameCheck.valid) {
        throw new AppError(nicknameCheck.message!, 400)
      }
      logs.push({ fieldName: 'nickname', oldValue: user.nickname, newValue: data.nickname, logType: UserAccountLogType.NICKNAME_CHANGE })
      updates.nickname = data.nickname
    }

    if (data.avatar !== undefined && data.avatar !== user.avatar) {
      const avatarCheck = await this.validateAvatar(data.avatar)
      if (!avatarCheck.valid) {
        throw new AppError(avatarCheck.message!, 400)
      }
      logs.push({ fieldName: 'avatar', oldValue: user.avatar || '', newValue: data.avatar, logType: UserAccountLogType.AVATAR_CHANGE })
      updates.avatar = data.avatar
    }

    if (data.phone !== undefined && data.phone !== user.phone) {
      const phoneCheck = await this.validatePhone(data.phone)
      if (!phoneCheck.valid) {
        throw new AppError(phoneCheck.message!, 400)
      }
      const existingPhone = await User.findOne({ where: { phone: data.phone, id: { [Op.ne]: userId } } })
      if (existingPhone) {
        throw new AppError('该手机号已被其他用户绑定', 400)
      }
      logs.push({ fieldName: 'phone', oldValue: user.phone || '', newValue: data.phone, logType: UserAccountLogType.PHONE_CHANGE })
      updates.phone = data.phone
      updates.phoneVerified = data.phone ? 1 : 0
    }

    if (data.email !== undefined && data.email !== user.email) {
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new AppError('邮箱格式不正确', 400)
      }
      logs.push({ fieldName: 'email', oldValue: user.email || '', newValue: data.email || '', logType: UserAccountLogType.INFO_UPDATE })
      updates.email = data.email
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: '没有需要更新的内容' }
    }

    const t = await sequelize.transaction()

    try {
      await user.update(updates, { transaction: t })

      const completeness = await this.calculateInfoCompleteness(userId)
      await user.update({ infoCompleteness: completeness.completeness }, { transaction: t })

      for (const log of logs) {
        await UserAccountLog.create({
          userId,
          userName: user.username,
          operatorId: operator.userId,
          operatorName: operator.username,
          logType: log.logType,
          fieldName: log.fieldName,
          oldValue: log.oldValue,
          newValue: log.newValue,
          reason: data.reason || '',
          ip: '',
          userAgent: '',
          status: 1
        } as any, { transaction: t })
      }

      await t.commit()

      return {
        success: true,
        message: '更新成功',
        updatedFields: logs.map(l => l.fieldName),
        user: {
          id: user.id,
          nickname: updates.nickname || user.nickname,
          avatar: updates.avatar || user.avatar,
          phone: updates.phone || user.phone,
          email: updates.email || user.email,
          infoCompleteness: completeness.completeness
        }
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getFilteredUserIds(filterType: string, customWhere?: any): Promise<number[]> {
    const where: any = customWhere || {}
    const now = new Date()

    switch (filterType) {
      case UserFilterType.NEW_REGISTERED:
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        where.createTime = { [Op.gte]: sevenDaysAgo }
        break
      case UserFilterType.NOT_VERIFIED:
        where.realNameVerified = { [Op.ne]: RealNameStatus.VERIFIED }
        break
      case UserFilterType.LOW_ACTIVITY:
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        where[Op.or] = [
          { lastActiveTime: { [Op.lt]: thirtyDaysAgo } },
          { lastActiveTime: null }
        ]
        break
      case UserFilterType.NO_PHONE:
        where.phoneVerified = 0
        break
      case UserFilterType.ABNORMAL:
        where.isAbnormal = 1
        break
    }

    const users = await User.findAll({ where, attributes: ['id'] })
    return users.map(u => u.id)
  },

  async batchUpdateUsers(params: {
    userIds?: number[]
    filterType?: string
    scope: string
    updates: { nickname?: string; avatar?: string; phone?: string; email?: string; realName?: string }
    reason?: string
  }, operator: OperatorInfo, onProgress?: (current: number, total: number) => void) {
    const permCheck = await this.checkPermission(operator, 'batch')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    let userIds: number[] = []

    switch (params.scope) {
      case BatchOperationScope.SELECTED:
        userIds = params.userIds || []
        break
      case BatchOperationScope.FILTERED:
        if (!params.filterType) {
          throw new AppError('请指定筛选类型', 400)
        }
        userIds = await this.getFilteredUserIds(params.filterType)
        break
      case BatchOperationScope.ALL:
        const allUsers = await User.findAll({ attributes: ['id'] })
        userIds = allUsers.map(u => u.id)
        break
      default:
        throw new AppError('无效的操作范围', 400)
    }

    if (userIds.length === 0) {
      return { total: 0, success: 0, fail: 0, results: [] }
    }

    const results: Array<{ userId: number; success: boolean; error?: string }> = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]
      try {
        await this.updateUserInfo(userId, params.updates, operator)
        successCount++
        results.push({ userId, success: true })
      } catch (error: any) {
        failCount++
        results.push({ userId, success: false, error: error.message })
      }

      if (onProgress) {
        onProgress(i + 1, userIds.length)
      }

      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return {
      total: userIds.length,
      success: successCount,
      fail: failCount,
      results
    }
  },

  async batchResetConfig(params: {
    userIds?: number[]
    filterType?: string
    scope: string
    resetItems: string[]
    reason?: string
  }, operator: OperatorInfo, onProgress?: (current: number, total: number) => void) {
    const permCheck = await this.checkPermission(operator, 'batch')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    let userIds: number[] = []

    switch (params.scope) {
      case BatchOperationScope.SELECTED:
        userIds = params.userIds || []
        break
      case BatchOperationScope.FILTERED:
        if (!params.filterType) {
          throw new AppError('请指定筛选类型', 400)
        }
        userIds = await this.getFilteredUserIds(params.filterType)
        break
      case BatchOperationScope.ALL:
        const allUsers = await User.findAll({ attributes: ['id'] })
        userIds = allUsers.map(u => u.id)
        break
      default:
        throw new AppError('无效的操作范围', 400)
    }

    if (userIds.length === 0) {
      return { total: 0, success: 0, fail: 0, results: [] }
    }

    const resetMap: Record<string, any> = {
      avatar: '',
      email: '',
      reviewLevel: 0,
      reviewCount: 0,
      opsCount: 0,
      isSeniorReviewer: 0
    }

    const updates: any = {}
    params.resetItems.forEach(item => {
      if (resetMap[item] !== undefined) {
        updates[item] = resetMap[item]
      }
    })

    if (Object.keys(updates).length === 0) {
      throw new AppError('没有需要重置的配置项', 400)
    }

    const results: Array<{ userId: number; success: boolean; error?: string }> = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]
      try {
        const user = await User.findByPk(userId)
        if (user) {
          await user.update(updates)

          for (const field of Object.keys(updates)) {
            await UserAccountLog.create({
              userId,
              userName: user.username,
              operatorId: operator.userId,
              operatorName: operator.username,
              logType: UserAccountLogType.BATCH_RESET,
              fieldName: field,
              oldValue: String((user as any)[field] || ''),
              newValue: String(updates[field] || ''),
              reason: params.reason || '批量重置',
              ip: '',
              userAgent: '',
              status: 1
            } as any)
          }

          successCount++
          results.push({ userId, success: true })
        }
      } catch (error: any) {
        failCount++
        results.push({ userId, success: false, error: error.message })
      }

      if (onProgress) {
        onProgress(i + 1, userIds.length)
      }

      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return {
      total: userIds.length,
      success: successCount,
      fail: failCount,
      results
    }
  },

  async traceUserAccount(userId: number, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } })
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const traces: any[] = []
    const anomalies: any[] = []

    traces.push({
      type: 'account_create',
      title: '账号创建',
      time: user.createTime,
      data: {
        uid: user.id,
        username: user.username,
        registerSource: user.registerSource
      }
    })

    if (user.phone) {
      const samePhoneUsers = await User.findAll({
        where: { phone: user.phone, id: { [Op.ne]: userId } },
        attributes: ['id', 'username', 'createTime']
      })
      if (samePhoneUsers.length > 0) {
        anomalies.push({
          type: UserAbnormalType.DUPLICATE_BINDING,
          severity: 2,
          title: '手机号重复绑定',
          detail: `该手机号已被 ${samePhoneUsers.length} 个其他账号绑定`,
          relatedUsers: samePhoneUsers.map(u => ({ id: u.id, username: u.username }))
        })
      }
    }

    if (user.idCard) {
      const sameIdCardUsers = await User.findAll({
        where: { idCard: user.idCard, id: { [Op.ne]: userId } },
        attributes: ['id', 'username', 'createTime']
      })
      if (sameIdCardUsers.length > 0) {
        anomalies.push({
          type: UserAbnormalType.DUPLICATE_BINDING,
          severity: 3,
          title: '身份证重复绑定',
          detail: `该身份证已被 ${sameIdCardUsers.length} 个其他账号绑定`,
          relatedUsers: sameIdCardUsers.map(u => ({ id: u.id, username: u.username }))
        })
      }
    }

    if (user.realNameVerified === RealNameStatus.VERIFIED && user.idCard) {
      const idCardValid = this.validateIdCard(user.idCard)
      if (!idCardValid.valid) {
        anomalies.push({
          type: UserAbnormalType.FAKE_INFO,
          severity: 3,
          title: '虚假身份信息',
          detail: idCardValid.message
        })
      }
    }

    const infoStatus = await this.calculateInfoCompleteness(userId)
    if (infoStatus.completeness < 60) {
      anomalies.push({
        type: UserAbnormalType.INCOMPLETE_INFO,
        severity: 1,
        title: '信息不完整',
        detail: `信息完整度仅 ${infoStatus.completeness}%，缺少字段：${infoStatus.missingFields.join('、')}`,
        missingFields: infoStatus.missingFields
      })
    }

    if (user.loginCount > 0 && user.lastLoginTime) {
      traces.push({
        type: 'login_activity',
        title: '登录活动',
        time: user.lastLoginTime,
        data: {
          loginCount: user.loginCount,
          lastActiveTime: user.lastActiveTime
        }
      })
    }

    const [logs, abnormalLogs, violations] = await Promise.all([
      UserAccountLog.findAll({ where: { userId }, order: [['createTime', 'DESC']], limit: 50 }),
      UserAbnormalLog.findAll({ where: { userId }, order: [['createTime', 'DESC']], limit: 50 }),
      ViolationRecord.findAll({ where: { targetId: userId, targetType: 'user' }, order: [['createTime', 'DESC']], limit: 50 })
    ])

    logs.forEach(log => {
      traces.push({
        type: log.logType,
        title: log.fieldName ? `修改${log.fieldName}` : '账号变更',
        time: log.createTime,
        data: {
          fieldName: log.fieldName,
          oldValue: log.oldValue,
          newValue: log.newValue,
          operator: log.operatorName,
          reason: log.reason
        }
      })
    })

    abnormalLogs.forEach(log => {
      traces.push({
        type: 'abnormal_detect',
        title: '异常检测',
        time: log.createTime,
        data: {
          abnormalType: log.abnormalType,
          abnormalDetail: log.abnormalDetail,
          severity: log.severity,
          handled: log.handled
        }
      })
    })

    violations.forEach(v => {
      traces.push({
        type: 'violation',
        title: '违规记录',
        time: v.createTime,
        data: {
          violationType: v.violationType,
          violationLevel: v.violationLevel,
          description: v.description,
          handleResult: v.handleResult
        }
      })
    })

    traces.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    const integrityCheck = await this.checkUserIntegrity(userId)

    return {
      user: permCheck.isSenior ? user.toJSON() : (() => {
        const data = user.toJSON() as Record<string, any>
        SENSITIVE_FIELDS.forEach(field => delete data[field])
        return data
      })(),
      traces,
      anomalies,
      integrityCheck,
      permission: {
        canViewSensitive: permCheck.isSenior,
        canEdit: permCheck.isSenior,
        canBatch: permCheck.isSenior
      }
    }
  },

  validateIdCard(idCard: string): { valid: boolean; message?: string } {
    if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
      return { valid: false, message: '身份证号格式不正确' }
    }

    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    let sum = 0

    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i]
    }

    const checkCode = checkCodes[sum % 11]
    if (idCard[17].toUpperCase() !== checkCode) {
      return { valid: false, message: '身份证号校验位不正确' }
    }

    return { valid: true }
  },

  async checkUserIntegrity(userId: number) {
    const user = await User.findByPk(userId)
    if (!user) {
      return { valid: false, issues: ['用户不存在'] }
    }

    const checks: Array<{ name: string; passed: boolean; message?: string }> = []

    checks.push({
      name: 'UID格式',
      passed: Number.isInteger(userId) && userId > 0,
      message: Number.isInteger(userId) && userId > 0 ? undefined : 'UID格式异常'
    })

    if (user.phone) {
      const phoneCheck = await this.validatePhone(user.phone)
      checks.push({
        name: '手机号格式',
        passed: phoneCheck.valid,
        message: phoneCheck.message
      })
    }

    if (user.idCard) {
      const idCardCheck = this.validateIdCard(user.idCard)
      checks.push({
        name: '身份证格式',
        passed: idCardCheck.valid,
        message: idCardCheck.message
      })
    }

    const nicknameCheck = await this.validateNickname(user.nickname, userId)
    checks.push({
      name: '昵称合规性',
      passed: nicknameCheck.valid,
      message: nicknameCheck.message
    })

    if (user.email) {
      checks.push({
        name: '邮箱格式',
        passed: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email),
        message: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ? undefined : '邮箱格式不正确'
      })
    }

    const completeness = await this.calculateInfoCompleteness(userId)
    checks.push({
      name: '信息完整性',
      passed: completeness.completeness >= 60,
      message: completeness.completeness >= 60 ? undefined : `信息完整度${completeness.completeness}%，建议完善`
    })

    const failedChecks = checks.filter(c => !c.passed)

    if (failedChecks.length > 0) {
      await User.update(
        {
          isAbnormal: 1,
          abnormalType: failedChecks[0].name.includes('身份证') || failedChecks[0].name.includes('手机号') ? UserAbnormalType.FAKE_INFO : UserAbnormalType.INCOMPLETE_INFO,
          abnormalReason: failedChecks.map(c => c.message).join('；')
        },
        { where: { id: userId } }
      )

      await UserAbnormalLog.create({
        userId,
        userName: user.username,
        abnormalType: failedChecks.some(c => c.name.includes('格式')) ? UserAbnormalType.FAKE_INFO : UserAbnormalType.INCOMPLETE_INFO,
        abnormalDetail: JSON.stringify(failedChecks),
        severity: failedChecks.some(c => c.name.includes('身份证')) ? 3 : failedChecks.some(c => c.name.includes('格式')) ? 2 : 1,
        traceData: JSON.stringify({ checks, completeness }),
        detectedTime: new Date(),
        handled: 0
      } as any)
    }

    return {
      valid: failedChecks.length === 0,
      checks,
      completeness: completeness.completeness,
      issues: failedChecks.map(c => c.message!)
    }
  },

  async getAbnormalUsers(params: { page: number; pageSize: number; abnormalType?: string; handled?: number }, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { page, pageSize, abnormalType, handled } = params
    const where: any = {}

    if (abnormalType) {
      where.abnormalType = abnormalType
    }
    if (handled !== undefined) {
      where.handled = handled
    }

    const { count, rows } = await UserAbnormalLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: permCheck.isSenior ? ['id', 'username', 'nickname', 'avatar', 'phone', 'isAbnormal', 'abnormalType'] : ['id', 'username', 'nickname', 'avatar', 'isAbnormal', 'abnormalType']
      }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    const statsRaw = await UserAbnormalLog.findAll({
      attributes: ['abnormalType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['abnormalType'],
      raw: true
    }) as unknown as Array<{ abnormalType: string; count: number }>

    const stats = statsRaw.map(s => ({ abnormalType: s.abnormalType, count: Number(s.count) }))

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      stats,
      permission: {
        canViewSensitive: permCheck.isSenior,
        canEdit: permCheck.isSenior,
        canBatch: permCheck.isSenior
      }
    }
  },

  async handleAbnormalLog(logId: number, data: { handleResult: string; handled?: number }, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'edit')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const log = await UserAbnormalLog.findByPk(logId)
    if (!log) {
      throw new AppError('异常记录不存在', 404)
    }

    await log.update({
      handled: data.handled ?? 1,
      handlerId: operator.userId,
      handlerName: operator.username,
      handleTime: new Date(),
      handleResult: data.handleResult
    })

    return { success: true, message: '处理成功' }
  },

  async getAccountLogs(params: { page: number; pageSize: number; userId?: number; logType?: string }, operator: OperatorInfo) {
    const permCheck = await this.checkPermission(operator, 'view_basic')
    if (!permCheck.allowed) {
      throw new AppError(permCheck.reason!, 403)
    }

    const { page, pageSize, userId, logType } = params
    const where: any = {}

    if (userId) {
      where.userId = userId
    }
    if (logType) {
      where.logType = logType
    }

    const { count, rows } = await UserAccountLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  },

  async checkPublishEligibility(userId: number) {
    const reasons: string[] = []
    const [user, recentViolations] = await Promise.all([
      User.findByPk(userId),
      this.getRecentViolations(userId, 7)
    ])

    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const isBanned = user.status === 0 && (!user.banExpireTime || user.banExpireTime > now)
    const isFlowLimited = !!user.flowLimitExpireTime && user.flowLimitExpireTime > now
    const realNameVerified = user.realNameVerified ?? 0

    if (user.status !== 1 && !isBanned) {
      reasons.push('账号状态异常')
    }

    if (isBanned) {
      reasons.push(user.banExpireTime ? `账号已被封禁，解禁时间：${user.banExpireTime.toLocaleString()}` : '账号已被永久封禁')
    }

    if (realNameVerified !== RealNameStatus.VERIFIED) {
      const verifiedMap: Record<number, string> = { 0: '未实名认证', 1: '实名认证审核中', 3: '实名认证已被拒绝' }
      reasons.push(verifiedMap[realNameVerified] || '实名认证状态异常')
    }

    const handledViolations = recentViolations.filter(
      (v: any) => v.status === 2 && v.violationLevel >= 2
    )
    const recentViolationsCount = handledViolations.length

    if (recentViolationsCount >= 3) {
      reasons.push(`近7天内存在${recentViolationsCount}次违规记录，暂时无法发布`)
    }

    const eligible = reasons.length === 0

    return {
      eligible,
      reasons,
      accountStatus: {
        status: user.status,
        realNameVerified,
        isBanned,
        isFlowLimited,
        recentViolations: recentViolationsCount
      }
    }
  },

  async checkAccountStatus(userId: number) {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    const now = new Date()
    const isBanned = user.status === 0 && (!user.banExpireTime || user.banExpireTime > now)
    const isFlowLimited = !!user.flowLimitExpireTime && user.flowLimitExpireTime > now

    let statusDesc = 'normal'
    if (isBanned) statusDesc = 'banned'
    else if (isFlowLimited) statusDesc = 'flowLimited'
    else if (user.status !== 1) statusDesc = 'inactive'

    return {
      status: user.status,
      statusDesc,
      isBanned,
      isFlowLimited,
      banExpireTime: user.banExpireTime,
      flowLimitExpireTime: user.flowLimitExpireTime,
      realNameVerified: user.realNameVerified ?? 0
    }
  },

  async getRecentViolations(userId: number, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return await ViolationRecord.findAll({
      where: {
        targetId: userId,
        createTime: { [Op.gte]: startDate }
      },
      order: [['createTime', 'DESC']]
    })
  },

  async getAbnormalLogs(params: {
    page: number
    pageSize: number
    userId?: number
    abnormalType?: string
  }) {
    const { page, pageSize, userId, abnormalType } = params
    const where: any = {}

    if (userId !== undefined) {
      where.userId = userId
    }
    if (abnormalType) {
      where.abnormalType = abnormalType
    }

    const { count, rows } = await UserAbnormalLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createTime', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  },

  async recordPublishAbnormal(data: {
    userId: number
    userName: string
    abnormalType: string
    abnormalDetail: string
    ip?: string
    userAgent?: string
  }) {
    const severityMap: Record<string, number> = {
      account_inactive: 3,
      not_verified: 2,
      too_many_violations: 2,
      other: 1
    }

    await UserAbnormalLog.create({
      userId: data.userId,
      userName: data.userName,
      abnormalType: data.abnormalType,
      abnormalDetail: data.abnormalDetail,
      severity: severityMap[data.abnormalType] || 1,
      traceData: JSON.stringify({ ip: data.ip, userAgent: data.userAgent }),
      detectedTime: new Date(),
      handled: 0
    } as any)

    await User.update(
      {
        isAbnormal: 1,
        abnormalType: data.abnormalType,
        abnormalReason: data.abnormalDetail
      },
      { where: { id: data.userId } }
    )
  }
}
