const { User, LoginLog, LoginDevice, LoginRiskReport, OperationLog, Notification } = require('../models')
const { Op } = require('sequelize')
const { getPagination, generateRandomString } = require('../utils/common')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')
const crypto = require('crypto')

const RISK_THRESHOLDS = {
  highFrequency: { perHour: 10, perDay: 50, per5Min: 5 },
  burstLogin: { count: 3, windowSeconds: 30 },
  offsiteLogin: { kmDistance: 300 },
  multiDevice: { maxOnlineDevices: 3 }
}

const RISK_SCORE_RULES = {
  newDevice: 15, newIp: 10, offsite: 25, abroad: 30,
  proxy: 20, vpn: 25, tor: 60, datacenter: 30,
  highFreqHour: 20, highFreqDay: 25, burst: 40,
  multiDevice: 15, selenium: 70, headless: 55, script: 50, forged: 60
}

const SCORE_TO_LEVEL = [
  { min: 0, max: 19, level: 'none' },
  { min: 20, max: 39, level: 'low' },
  { min: 40, max: 59, level: 'medium' },
  { min: 60, max: 79, level: 'high' },
  { min: 80, max: 999, level: 'critical' }
]

const SCRIPT_PATTERNS = [
  'selenium', 'webdriver', 'puppeteer', 'playwright', 'phantomjs',
  'headless', 'phantom', 'ghostdriver', 'navigator.webdriver'
]

class LoginService {
  scoreToLevel(score) {
    for (const r of SCORE_TO_LEVEL) if (score >= r.min && score <= r.max) return r.level
    return 'none'
  }
  scoreToDecision(score) {
    if (score >= 70) return 'block'
    if (score >= 35) return 'verify'
    return 'pass'
  }
  generateDeviceId(fingerprint) {
    return crypto.createHash('md5').update(String(fingerprint || Date.now() + Math.random())).digest('hex')
  }

  detectScript(userAgent, headers, fingerprint) {
    const ua = (userAgent || '').toLowerCase()
    let detected = []
    for (const p of SCRIPT_PATTERNS) {
      if (ua.includes(p)) detected.push(p)
    }
    const h = Object.keys(headers || {}).map(k => String(k).toLowerCase())
    const selenium = h.some(k => k.includes('selenium') || k.includes('webdriver'))
    const headless = ua.includes('headless') || /^mozilla\/5\.0 \(x11;.*linux x86_64.*applewebkit/i.test(ua) && ua.includes('headless')
    if (selenium) detected.push('selenium_header')
    if (fingerprint && (fingerprint.includes('undefined') || fingerprint.length < 10)) detected.push('suspicious_fp')
    return { detected, seleniumDetected: selenium || detected.some(d => d.includes('selenium')), headlessDetected: headless, scriptDetected: detected.length > 0 }
  }

  async getIpInfo(ip) {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0') || ip === '::1') {
      return { country: 'CN', region: 'Local', city: 'Localhost', isp: 'Local', lat: 0, lng: 0, isProxy: false, isVpn: false, isTor: false, isDatacenter: false }
    }
    return { country: 'CN', region: '北京', city: '北京市', isp: '电信', lat: 39.9042, lng: 116.4074, isProxy: false, isVpn: false, isTor: false, isDatacenter: false }
  }

  async computeUserBaseline(userId) {
    const recent = await LoginLog.findAll({
      where: { userId, status: { [Op.in]: ['success', 'verified'] } },
      order: [['createdAt', 'DESC']], limit: 50,
      attributes: ['ip', 'ipLocation', 'deviceId', 'country', 'region', 'city']
    })
    const ips = new Set(), devices = new Set(), locations = new Set()
    for (const r of recent) {
      if (r.ip) ips.add(r.ip); if (r.deviceId) devices.add(r.deviceId)
      if (r.city) locations.add(`${r.country || ''}/${r.region || ''}/${r.city}`)
    }
    return {
      commonIps: [...ips], commonDevices: [...devices], commonLocations: [...locations],
      commonCountry: [...new Set(recent.map(r => r.country).filter(Boolean))],
      commonRegion: [...new Set(recent.map(r => r.region).filter(Boolean))],
      commonCity: [...new Set(recent.map(r => r.city).filter(Boolean))]
    }
  }

  async checkFrequency(userId, ip, now = new Date()) {
    const hourAgo = dayjs(now).subtract(1, 'hour').toDate()
    const dayAgo = dayjs(now).subtract(1, 'day').toDate()
    const fiveMinAgo = dayjs(now).subtract(5, 'minute').toDate()
    const window30sAgo = dayjs(now).subtract(30, 'second').toDate()

    const [hourCount, dayCount, fiveMinCount, window30sCount] = await Promise.all([
      LoginLog.count({ where: { [Op.or]: [{ userId }, { ip }], createdAt: { [Op.gte]: hourAgo } } }),
      LoginLog.count({ where: { [Op.or]: [{ userId }, { ip }], createdAt: { [Op.gte]: dayAgo } } }),
      LoginLog.count({ where: { [Op.or]: [{ userId }, { ip }], createdAt: { [Op.gte]: fiveMinAgo } } }),
      LoginLog.count({ where: { [Op.or]: [{ userId }, { ip }], createdAt: { [Op.gte]: window30sAgo } } })
    ])

    const violations = []
    let flag = 'normal'
    if (hourCount >= RISK_THRESHOLDS.highFrequency.perHour) { violations.push({ type: 'high_hour', count: hourCount, limit: RISK_THRESHOLDS.highFrequency.perHour }); flag = 'high_hour' }
    if (dayCount >= RISK_THRESHOLDS.highFrequency.perDay) { violations.push({ type: 'high_day', count: dayCount, limit: RISK_THRESHOLDS.highFrequency.perDay }); flag = 'high_day' }
    if (window30sCount >= RISK_THRESHOLDS.burstLogin.count) { violations.push({ type: 'burst', count: window30sCount, limit: RISK_THRESHOLDS.burstLogin.count, windowSeconds: RISK_THRESHOLDS.burstLogin.windowSeconds }); flag = 'burst' }
    if (fiveMinCount >= RISK_THRESHOLDS.highFrequency.per5Min && flag === 'normal') flag = 'high_hour'

    return { flag, violations, stats: { lastHour: hourCount, lastDay: dayCount, last5Min: fiveMinCount, last30s: window30sCount } }
  }

  async checkMultiDevice(userId, currentDeviceId, now = new Date()) {
    const tenMinAgo = dayjs(now).subtract(10, 'minute').toDate()
    const activeDevices = await LoginDevice.findAll({
      where: { userId, isOnline: true, lastOnlineAt: { [Op.gte]: tenMinAgo }, deviceId: { [Op.ne]: currentDeviceId } },
      attributes: ['deviceId', 'deviceName']
    })
    const ids = activeDevices.map(d => d.deviceId).filter(Boolean)
    return {
      isMultiDevice: ids.length >= RISK_THRESHOLDS.multiDevice.maxOnlineDevices,
      count: ids.length,
      maxAllowed: RISK_THRESHOLDS.multiDevice.maxOnlineDevices,
      otherDeviceIds: ids,
      otherDevices: activeDevices
    }
  }

  async generateLoginRiskReport(params) {
    const { userId, username, ip, deviceId, deviceInfo = {}, userAgent = '', headers = {}, fingerprint = '', now = new Date() } = params
    const [ipInfo, baseline, frequency, multiDevice, scriptCheck] = await Promise.all([
      this.getIpInfo(ip),
      userId ? this.computeUserBaseline(userId) : Promise.resolve({ commonIps: [], commonDevices: [], commonLocations: [] }),
      userId ? this.checkFrequency(userId, ip, now) : this.checkFrequency(-1, ip, now),
      userId && deviceId ? this.checkMultiDevice(userId, deviceId, now) : Promise.resolve({ isMultiDevice: false, count: 0, maxAllowed: 3, otherDeviceIds: [], otherDevices: [] }),
      Promise.resolve(this.detectScript(userAgent, headers, fingerprint))
    ])

    const isNewDevice = userId ? deviceId && !baseline.commonDevices.includes(deviceId) : true
    const isNewIp = userId ? ip && !baseline.commonIps.includes(ip) : true
    const isOffsite = userId && baseline.commonCity.length > 0 && ipInfo.city !== 'Localhost' && !baseline.commonCity.includes(ipInfo.city)
    const isAbroad = ipInfo.country && ipInfo.country !== 'CN'

    const rulesTriggered = []
    const scoreDetails = []
    let total = 0

    const addScore = (key, desc, apply) => {
      const score = apply ? (RISK_SCORE_RULES[key] || 0) : 0
      if (apply) rulesTriggered.push({ rule: key, description: desc, score })
      scoreDetails.push({ key, description: desc, score, applied: apply })
      total += score
    }

    addScore('newDevice', '新设备首次登录', isNewDevice)
    addScore('newIp', '新IP地址登录', isNewIp)
    addScore('offsite', `异地登录(常用地:${baseline.commonCity.slice(0, 3).join(',') || '无'}, 当前:${ipInfo.city})`, isOffsite)
    addScore('abroad', `境外登录(${ipInfo.country})`, isAbroad)
    addScore('proxy', '代理IP登录', ipInfo.isProxy)
    addScore('vpn', 'VPN登录', ipInfo.isVpn)
    addScore('tor', 'Tor网络登录', ipInfo.isTor)
    addScore('datacenter', '机房IP登录', ipInfo.isDatacenter)
    addScore('multiDevice', `多设备同时在线(${multiDevice.count}/${multiDevice.maxAllowed})`, multiDevice.isMultiDevice)

    if (frequency.flag !== 'normal') {
      const v = frequency.violations[0] || {}
      if (frequency.flag === 'burst') addScore('burst', `30s内突发登录${v.count}次`, true)
      else if (frequency.flag === 'high_day') addScore('highFreqDay', `24h内高频登录${v.count}次`, true)
      else addScore('highFreqHour', `1h内高频登录${v.count}次`, true)
    }

    addScore('selenium', 'Selenium自动化检测', scriptCheck.seleniumDetected)
    addScore('headless', '无头浏览器检测', scriptCheck.headlessDetected)
    addScore('script', `脚本检测: ${scriptCheck.detected.join(',')}`, scriptCheck.scriptDetected)

    const riskLevel = this.scoreToLevel(total)
    const finalDecision = this.scoreToDecision(total)

    const suggestion = finalDecision === 'block'
      ? '建议直接拦截登录，锁定账号或设备'
      : finalDecision === 'verify'
        ? `建议二次验证(${riskLevel === 'medium' ? '短信/邮箱验证码' : '安全问题或强制短信'})`
        : '通过，正常登录'

    const report = LoginRiskReport.build({
      userId, username, ip, deviceId,
      overallScore: Math.min(100, total),
      riskLevel, finalDecision, suggestion,
      deviceChecks: { isNewDevice, deviceName: deviceInfo.deviceName, os: deviceInfo.os, browser: deviceInfo.browser },
      ipChecks: { ...ipInfo, isNewIp, isOffsite, isAbroad },
      frequencyChecks: { flag: frequency.flag, stats: frequency.stats, violations: frequency.violations },
      behaviorChecks: scriptCheck,
      geoChecks: { userCommonLocations: baseline.commonLocations.slice(0, 5), currentLocation: `${ipInfo.country}/${ipInfo.region}/${ipInfo.city}` },
      riskRulesTriggered: rulesTriggered,
      riskScoreDetails: scoreDetails,
      deviceRiskScore: scoreDetails.filter(s => ['newDevice', 'multiDevice', 'selenium', 'headless', 'script'].includes(s.key)).reduce((a, b) => a + b.score, 0),
      ipRiskScore: scoreDetails.filter(s => ['newIp', 'offsite', 'abroad', 'proxy', 'vpn', 'tor', 'datacenter'].includes(s.key)).reduce((a, b) => a + b.score, 0),
      frequencyRiskScore: scoreDetails.filter(s => ['highFreqHour', 'highFreqDay', 'burst'].includes(s.key)).reduce((a, b) => a + b.score, 0),
      behaviorRiskScore: scoreDetails.filter(s => ['selenium', 'headless', 'script'].includes(s.key)).reduce((a, b) => a + b.score, 0),
      geoRiskScore: scoreDetails.filter(s => ['offsite', 'abroad'].includes(s.key)).reduce((a, b) => a + b.score, 0),
      userBaseline: baseline
    })
    await report.save()
    return {
      report,
      checks: { isNewDevice, isNewIp, isOffsite, isAbroad, ...ipInfo, ...scriptCheck, frequencyFlag: frequency.flag, frequencyStats: frequency.stats, isMultiDevice: multiDevice.isMultiDevice, otherDeviceIds: multiDevice.otherDeviceIds },
      finalDecision, riskLevel, totalScore: Math.min(100, total)
    }
  }

  async verifyAndRecordLogin(params, operatorInfo = {}) {
    const { userId, username, passwordValid = true, loginData = {}, twoFaPassed = false, captchaPassed = false } = params
    const now = new Date()
    const user = userId ? await User.findByPk(userId) : null
    const deviceInfo = loginData.deviceInfo || {}
    let deviceId = loginData.deviceId
    if (!deviceId) deviceId = this.generateDeviceId(loginData.fingerprint)

    if (!passwordValid) {
      await LoginLog.create({
        userId: user?.id, uid: user?.uid, username, status: 'failed', riskLevel: 'low',
        failReason: '用户名或密码错误', ip: loginData.ip || operatorInfo.ip,
        deviceId, deviceName: deviceInfo.deviceName, os: deviceInfo.os, browser: deviceInfo.browser,
        userAgent: loginData.userAgent, fingerprint: loginData.fingerprint
      })
      return { success: false, reason: '用户名或密码错误', status: 'failed' }
    }

    const risk = await this.generateLoginRiskReport({
      userId: user?.id, username, ip: loginData.ip || operatorInfo.ip,
      deviceId, deviceInfo, userAgent: loginData.userAgent,
      headers: loginData.headers || {}, fingerprint: loginData.fingerprint, now
    })

    let status = 'success'
    let failReason = null
    const checks = risk.checks

    if (risk.finalDecision === 'block' && !twoFaPassed) {
      status = 'blocked'
      failReason = `风控拦截：${risk.report.suggestion}，风险分${risk.totalScore}`
    } else if (risk.finalDecision === 'verify' && !twoFaPassed && !captchaPassed) {
      status = 'pending'
      failReason = `需要二次验证(风险分${risk.totalScore})`
    } else if (twoFaPassed || captchaPassed) {
      status = 'verified'
    }

    const log = await LoginLog.create({
      userId: user?.id, uid: user?.uid, username, status, riskLevel: risk.riskLevel, failReason,
      ip: loginData.ip || operatorInfo.ip, ipv6: loginData.ipv6,
      ipLocation: `${checks.country}/${checks.region}/${checks.city}/${checks.isp}`,
      country: checks.country, region: checks.region, city: checks.city, isp: checks.isp,
      lat: checks.lat, lng: checks.lng, isProxy: checks.isProxy, isVpn: checks.isVpn, isTor: checks.isTor, isDatacenter: checks.isDatacenter,
      deviceId, deviceName: deviceInfo.deviceName, deviceBrand: deviceInfo.deviceBrand, deviceModel: deviceInfo.deviceModel,
      os: deviceInfo.os, osVersion: deviceInfo.osVersion, browser: deviceInfo.browser, browserVersion: deviceInfo.browserVersion,
      screenSize: deviceInfo.screenSize, deviceLanguage: deviceInfo.deviceLanguage, timezone: deviceInfo.timezone,
      userAgent: loginData.userAgent, fingerprint: loginData.fingerprint,
      isNewDevice: checks.isNewDevice, isNewIp: checks.isNewIp, isAbroad: checks.isAbroad, isOffsite: checks.isOffsite,
      isMultiDevice: checks.isMultiDevice, multiDeviceIds: checks.otherDeviceIds || [],
      frequencyFlag: checks.frequencyFlag,
      scriptDetected: checks.scriptDetected, forgedDetected: checks.scriptDetected && checks.headlessDetected,
      seleniumDetected: checks.seleniumDetected, headlessDetected: checks.headlessDetected,
      captchaPassed, twoFaPassed, twoFaMethod: loginData.twoFaMethod,
      sessionId: loginData.sessionId, loginEndpoint: loginData.endpoint, referer: loginData.referer,
      riskReportId: risk.report.id
    })

    if (status === 'success' || status === 'verified') {
      if (user) {
        const update = { lastLoginAt: now, lastLoginIp: loginData.ip || operatorInfo.ip, isOnline: true }
        if (loginData.tokenId) update.currentToken = loginData.tokenId
        await user.update(update)
      }
      let device = await LoginDevice.findOne({ where: { userId: user.id, deviceId } })
      const nowDate = new Date()
      if (!device) {
        device = await LoginDevice.create({
          userId: user.id, uid: user.uid, deviceId,
          deviceName: deviceInfo.deviceName, deviceBrand: deviceInfo.deviceBrand, deviceModel: deviceInfo.deviceModel,
          os: deviceInfo.os, osVersion: deviceInfo.osVersion, browser: deviceInfo.browser, browserVersion: deviceInfo.browserVersion,
          fingerprint: loginData.fingerprint, screenSize: deviceInfo.screenSize,
          firstLoginAt: nowDate, lastLoginAt: nowDate, lastLoginIp: loginData.ip || operatorInfo.ip,
          lastLoginLocation: `${checks.country}/${checks.region}/${checks.city}`,
          totalLoginCount: 1, totalSuccessCount: 1, isOnline: true, lastOnlineAt: nowDate,
          activeIpList: [loginData.ip || operatorInfo.ip], status: risk.riskLevel === 'none' ? 'normal' : 'restricted'
        })
      } else {
        const ipList = [...(device.activeIpList || [])]
        if (loginData.ip && !ipList.includes(loginData.ip)) { ipList.push(loginData.ip); if (ipList.length > 20) ipList.shift() }
        await device.update({
          lastLoginAt: nowDate, lastLoginIp: loginData.ip || operatorInfo.ip,
          lastLoginLocation: `${checks.country}/${checks.region}/${checks.city}`,
          totalLoginCount: device.totalLoginCount + 1, totalSuccessCount: device.totalSuccessCount + 1,
          isOnline: true, lastOnlineAt: nowDate, activeIpList: ipList
        })
      }
    } else {
      if (user) {
        let device = await LoginDevice.findOne({ where: { userId: user.id, deviceId } })
        if (device) await device.update({ totalLoginCount: device.totalLoginCount + 1, totalFailCount: device.totalFailCount + 1, riskCount: device.riskCount + 1 })
      }
    }

    if (status === 'blocked' && user) {
      await Notification.create({
        userId: user.id, title: '登录安全预警', type: 'security',
        content: `您的账号在${checks.country}/${checks.city}发生高风险登录尝试，已被系统自动拦截。IP: ${loginData.ip || operatorInfo.ip}，设备: ${deviceInfo.deviceName || '未知'}。如非本人操作，请及时修改密码。`
      })
    }

    return {
      log,
      report: risk.report,
      success: status === 'success' || status === 'verified',
      status,
      needTwoFa: status === 'pending',
      blocked: status === 'blocked',
      failReason,
      riskLevel: risk.riskLevel,
      riskScore: risk.totalScore,
      needTwoFaMethod: risk.riskLevel === 'high' || risk.riskLevel === 'critical' ? 'sms' : 'any',
      checks
    }
  }

  async queryLoginLogs(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = {}
    if (params.userId) where.userId = params.userId
    if (params.username) where.username = { [Op.like]: `%${params.username}%` }
    if (params.status) where.status = params.status
    if (params.riskLevel) where.riskLevel = params.riskLevel
    if (params.ip) where.ip = { [Op.like]: `%${params.ip}%` }
    if (params.deviceId) where.deviceId = params.deviceId
    if (params.os) where.os = { [Op.like]: `%${params.os}%` }
    if (params.browser) where.browser = { [Op.like]: `%${params.browser}%` }
    if (params.country) where.country = params.country
    if (params.city) where.city = { [Op.like]: `%${params.city}%` }
    if (params.isMarkedRisk !== undefined) where.isMarkedRisk = params.isMarkedRisk
    if (params.isCleared !== undefined) where.isCleared = params.isCleared
    if (params.startTime || params.endTime) {
      where.createdAt = {}
      if (params.startTime) where.createdAt[Op.gte] = params.startTime
      if (params.endTime) where.createdAt[Op.lte] = params.endTime
    }
    const order = [[params.orderBy || 'createdAt', params.orderDir || 'DESC']]
    const { count, rows } = await LoginLog.findAndCountAll({ where, offset, limit, order })
    return { list: rows, total: count, page, pageSize }
  }

  async getLoginDetail(loginId) {
    const log = await LoginLog.findByPk(loginId)
    if (!log) throw ApiError.notFound('登录记录不存在')
    const report = log.riskReportId ? await LoginRiskReport.findByPk(log.riskReportId) : null
    const device = log.userId && log.deviceId ? await LoginDevice.findOne({ where: { userId: log.userId, deviceId: log.deviceId } }) : null
    return { log, report, device }
  }

  async markRiskLog(loginId, reason, operatorInfo = {}) {
    const log = await LoginLog.findByPk(loginId)
    if (!log) throw ApiError.notFound('记录不存在')
    const detail = await this.getLoginDetail(loginId)
    await log.update({
      isMarkedRisk: true, riskMarkedById: operatorInfo.id, riskMarkedByName: operatorInfo.username,
      riskMarkedAt: new Date(), riskMarkedReason: reason, riskLevel: log.riskLevel === 'none' ? 'medium' : log.riskLevel, status: 'risk'
    })
    if (detail.device) {
      await detail.device.update({ status: 'blocked', isLocked: true, lockedById: operatorInfo.id, lockedByName: operatorInfo.username, lockedAt: new Date(), lockReason: `关联风险登录: ${reason}`, riskCount: detail.device.riskCount + 1, statusUpdatedAt: new Date() })
    }
    await OperationLog.create({
      userId: operatorInfo.id, username: operatorInfo.username, module: 'login', action: 'mark_risk', target: `Login#${loginId}`, targetId: loginId,
      detail: JSON.stringify({ reason, lockedDevice: !!detail.device }), ip: operatorInfo.ip, result: 'success'
    })
    return { log: { ...log.toJSON(), status: 'risk' }, deviceLocked: !!detail.device }
  }

  async clearRiskLog(loginId, reason, operatorInfo = {}) {
    const log = await LoginLog.findByPk(loginId)
    if (!log) throw ApiError.notFound('记录不存在')
    await log.update({
      isMarkedRisk: false, isCleared: true, clearedById: operatorInfo.id, clearedByName: operatorInfo.username,
      clearedAt: new Date(), riskLevel: 'none'
    })
    if (log.status === 'risk') await log.update({ status: 'success' })
    await OperationLog.create({
      userId: operatorInfo.id, username: operatorInfo.username, module: 'login', action: 'clear_risk', target: `Login#${loginId}`, targetId: loginId,
      detail: JSON.stringify({ reason }), ip: operatorInfo.ip, result: 'success'
    })
    return log
  }

  async batchProcessLoginLogs(params = {}, operatorInfo = {}) {
    const { ids = [], action = 'mark', reason = '', lockDevices = false } = params
    if (!ids.length) throw ApiError.badRequest('请选择要处理的记录')

    const success = [], failed = [], logs = []
    for (const id of ids) {
      try {
        let res
        if (action === 'mark') {
          res = await this.markRiskLog(id, reason || '批量标记风险', operatorInfo)
          logs.push(res.log)
          success.push({ id, type: 'mark', deviceLocked: res.deviceLocked })
        } else if (action === 'clear') {
          const log = await this.clearRiskLog(id, reason || '批量清除标记', operatorInfo)
          logs.push(log)
          success.push({ id, type: 'clear' })
        } else if (action === 'delete') {
          await LoginLog.destroy({ where: { id } })
          success.push({ id, type: 'delete' })
        } else {
          throw new Error('无效操作类型')
        }
      } catch (err) {
        failed.push({ id, reason: err.message || String(err) })
      }
    }
    if (lockDevices && action === 'mark') {
      const markedLogs = logs.filter(l => l.userId && l.deviceId)
      const devKeys = new Set()
      for (const l of markedLogs) {
        const k = `${l.userId}_${l.deviceId}`
        if (!devKeys.has(k)) {
          devKeys.add(k)
          try {
            await LoginDevice.update(
              { status: 'blocked', isLocked: true, lockedById: operatorInfo.id, lockedByName: operatorInfo.username, lockedAt: new Date(), lockReason: `批量锁定: ${reason || '关联风险登录'}`, statusUpdatedAt: new Date() },
              { where: { userId: l.userId, deviceId: l.deviceId } }
            )
          } catch (_) {}
        }
      }
    }
    return { success, failed, total: ids.length, successCount: success.length, failedCount: failed.length }
  }

  async lockDevice(userId, deviceId, params = {}, operatorInfo = {}) {
    const device = await LoginDevice.findOne({ where: { userId, deviceId } })
    if (!device) throw ApiError.notFound('设备不存在')
    const now = new Date()
    await device.update({
      status: params.level === 'permanent' ? 'locked' : 'blocked',
      isLocked: true, lockedById: operatorInfo.id, lockedByName: operatorInfo.username, lockedAt: now,
      lockReason: params.reason || '人工锁定', lockExpireAt: params.lockHours ? dayjs(now).add(params.lockHours, 'hour').toDate() : null,
      statusUpdatedAt: now, isOnline: false
    })
    await OperationLog.create({
      userId: operatorInfo.id, username: operatorInfo.username, module: 'login', action: 'lock_device',
      target: `Device#${deviceId}@U${userId}`, targetId: userId,
      detail: JSON.stringify({ level: params.level || 'temporary', reason: params.reason, hours: params.lockHours }), ip: operatorInfo.ip, result: 'success'
    })
    return device
  }

  async unlockDevice(userId, deviceId, operatorInfo = {}) {
    const device = await LoginDevice.findOne({ where: { userId, deviceId } })
    if (!device) throw ApiError.notFound('设备不存在')
    await device.update({ status: 'normal', isLocked: false, lockExpireAt: null, statusUpdatedAt: new Date() })
    return device
  }

  async listDevices(userId, params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = { userId }
    if (params.status) where.status = params.status
    if (params.isLocked !== undefined) where.isLocked = params.isLocked
    if (params.isOnline !== undefined) where.isOnline = params.isOnline
    const { count, rows } = await LoginDevice.findAndCountAll({ where, offset, limit, order: [['lastLoginAt', 'DESC']] })
    return { list: rows, total: count, page, pageSize }
  }

  async getRiskSummary(userId, params = {}) {
    const where = { userId }
    if (params.startTime) where.createdAt = { [Op.gte]: params.startTime }
    if (params.endTime) where.createdAt = { ...where.createdAt, [Op.lte]: params.endTime }
    const [total, success, failed, blocked, risksByLevel, freq, riskLogs, devices] = await Promise.all([
      LoginLog.count({ where }),
      LoginLog.count({ where: { ...where, status: { [Op.in]: ['success', 'verified'] } } }),
      LoginLog.count({ where: { ...where, status: 'failed' } }),
      LoginLog.count({ where: { ...where, status: { [Op.in]: ['blocked', 'risk'] } } }),
      LoginLog.findAll({ where, attributes: ['riskLevel', [LoginLog.sequelize.fn('COUNT', LoginLog.sequelize.col('id')), 'cnt']], group: ['riskLevel'] }),
      LoginLog.findAll({ where, attributes: [[LoginLog.sequelize.fn('DATE', LoginLog.sequelize.col('createdAt')), 'date'], [LoginLog.sequelize.fn('COUNT', '*'), 'cnt']], group: [LoginLog.sequelize.fn('DATE', LoginLog.sequelize.col('createdAt'))], limit: 30, order: [[LoginLog.sequelize.fn('DATE', LoginLog.sequelize.col('createdAt')), 'DESC']] }),
      LoginLog.findAll({ where: { ...where, riskLevel: { [Op.ne]: 'none' } }, order: [['createdAt', 'DESC']], limit: 10 }),
      LoginDevice.findAll({ where: { userId }, order: [['lastLoginAt', 'DESC']], limit: 20 })
    ])
    const riskMap = {}
    for (const r of risksByLevel) riskMap[r.riskLevel] = parseInt(r.getDataValue('cnt') || 0)
    const freqMap = {}
    for (const f of freq) freqMap[f.getDataValue('date')] = parseInt(f.getDataValue('cnt') || 0)
    return {
      totalCount: total, successCount: success, failCount: failed, blockOrRiskCount: blocked,
      byLevel: riskMap, frequencyTrend: freqMap,
      recentRiskLogs: riskLogs, devices,
      riskCount: Object.values(riskMap).reduce((a, b) => a + b, 0)
    }
  }

  async getThresholdsMeta() {
    return {
      riskThresholds: RISK_THRESHOLDS,
      riskScoreRules: RISK_SCORE_RULES,
      scoreLevelMapping: SCORE_TO_LEVEL,
      logStatuses: LoginLog.STATUSES,
      riskLevels: LoginLog.RISK_LEVELS,
      deviceStatuses: LoginDevice.STATUSES,
      decisions: LoginRiskReport.DECISIONS
    }
  }
}

module.exports = new LoginService()
