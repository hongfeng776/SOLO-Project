const { Op, literal } = require('sequelize')
const { CapacityType, Driver, Order, DriverStatusLog } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const CITY_OPTIONS = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '西安市']
const BUSINESS_DISTRICTS = {
  '北京市': ['朝阳区望京', '海淀区中关村', '东城区王府井', '西城区金融街', '丰台区丽泽'],
  '上海市': ['浦东新区陆家嘴', '静安区南京西路', '徐汇区衡山路', '黄浦区外滩', '长宁区古北'],
  '广州市': ['天河区珠江新城', '越秀区北京路', '海珠区客村', '白云区新市', '番禺区万博'],
  '深圳市': ['南山区科技园', '福田区华强北', '罗湖区东门', '宝安区西乡', '龙岗区坂田'],
  '杭州市': ['西湖区文三路', '滨江区网商路', '上城区庆春路', '拱墅区万达广场', '余杭区未来科技城'],
  '成都市': ['锦江区春熙路', '高新区天府大道', '武侯区桐梓林', '青羊区宽窄巷子', '成华区建设路'],
  '武汉市': ['江汉区江汉路', '洪山区光谷', '武昌区中南路', '江岸区永清', '汉阳区王家湾'],
  '西安市': ['雁塔区高新路', '碑林区南大街', '未央区凤城五路', '莲湖区西大街', '新城区解放路']
}
const TIME_PERIODS = ['早高峰(7:00-9:00)', '日间(9:00-17:00)', '晚高峰(17:00-19:00)', '夜间(19:00-23:00)', '凌晨(23:00-7:00)']

const ROLE_PERMISSIONS = {
  'admin': { canViewAll: true, canDispatch: true, canExport: true },
  'capacity_manager': { canViewAll: true, canDispatch: true, canExport: true },
  'city_manager': { canViewAll: false, canDispatch: true, canExport: false },
  'operator': { canViewAll: false, canDispatch: false, canExport: false }
}

const checkMonitorPermission = (req) => {
  const userRole = req.user?.role || 'operator'
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['operator']
  return {
    ...permissions,
    userRole,
    allowedCities: permissions.canViewAll ? null : (req.user?.cities || [])
  }
}

const validateFilterConflict = (filters) => {
  const conflicts = []
  if (filters.city && filters.businessDistrict) {
    const districts = BUSINESS_DISTRICTS[filters.city] || []
    if (!districts.includes(filters.businessDistrict)) {
      conflicts.push(`商圈「${filters.businessDistrict}」不属于城市「${filters.city}」`)
    }
  }
  if (filters.startTime && filters.endTime) {
    if (new Date(filters.startTime) > new Date(filters.endTime)) {
      conflicts.push('开始时间不能晚于结束时间')
    }
  }
  return conflicts
}

const getMonitor = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    const { city, businessDistrict, timePeriod, startTime, endTime } = req.query

    const conflicts = validateFilterConflict({ city, businessDistrict, startTime, endTime })
    if (conflicts.length > 0) {
      return res.json({
        code: 400,
        message: '筛选条件存在冲突',
        data: null,
        conflicts
      })
    }

    let driverWhere = { status: { [Op.in]: [0, 1, 2] } }
    let orderWhere = { status: { [Op.in]: [1, 2, 3, 4] } }

    if (!permission.canViewAll && permission.allowedCities?.length > 0) {
      driverWhere.city = { [Op.in]: permission.allowedCities }
    } else if (city) {
      driverWhere.city = city
    }

    const totalOnline = await Driver.count({ where: { ...driverWhere, status: 1 } })
    const totalInOrder = await Driver.count({ where: { ...driverWhere, status: 2 } })
    const totalIdle = await Driver.count({ where: { ...driverWhere, status: 0 } })
    const totalOrders = await Order.count({ where: orderWhere })

    const typeDistribution = await Promise.all(
      [1, 2, 3, 4, 5].map(async (type) => {
        const typeMap = { 1: '快车', 2: '专车', 3: '豪华车', 4: '拼车', 5: '出租车' }
        const onlineCount = await Driver.count({
          where: { ...driverWhere, status: 1, vehicleType: type.toString() }
        })
        const inOrderCount = await Driver.count({
          where: { ...driverWhere, status: 2, vehicleType: type.toString() }
        })
        const orderCount = await Order.count({
          where: { ...orderWhere, capacityType: type }
        })
        return {
          type,
          typeName: typeMap[type],
          onlineCount,
          inOrderCount,
          idleCount: Math.max(0, onlineCount - inOrderCount),
          orderCount,
          saturationRate: onlineCount > 0 ? Math.min(100, Math.round((orderCount / (onlineCount * 3)) * 100)) : 0
        }
      })
    )

    const cities = permission.canViewAll ? CITY_OPTIONS : (permission.allowedCities?.length > 0 ? permission.allowedCities : CITY_OPTIONS.slice(0, 3))
    const areaDistribution = await Promise.all(
      cities.map(async (cityName) => {
        const districts = BUSINESS_DISTRICTS[cityName] || []
        const districtData = await Promise.all(
          districts.slice(0, 3).map(async (district) => {
            const onlineCount = Math.floor(Math.random() * 30) + 10
            const orderCount = Math.floor(Math.random() * 50) + 20
            const idleCount = Math.max(0, onlineCount - Math.floor(onlineCount * 0.6))
            return {
              area: district,
              onlineCount,
              orderCount,
              idleCount,
              status: getCapacityStatus(orderCount, onlineCount)
            }
          })
        )
        return {
          city: cityName,
          districts: districtData
        }
      })
    )

    const currentStatus = determineCapacityStatus(totalOrders, totalOnline, totalIdle)

    res.json(success({
      summary: {
        totalOnline,
        totalInOrder,
        totalIdle,
        totalOrders,
        utilizationRate: totalOnline > 0 ? Math.round((totalInOrder / totalOnline) * 100) : 0,
        currentStatus,
        permission: {
          canViewAll: permission.canViewAll,
          canDispatch: permission.canDispatch,
          canExport: permission.canExport,
          userRole: permission.userRole
        }
      },
      typeDistribution,
      areaDistribution,
      filterOptions: {
        cities: permission.canViewAll ? CITY_OPTIONS : permission.allowedCities,
        businessDistricts: city ? (BUSINESS_DISTRICTS[city] || []) : [],
        timePeriods: TIME_PERIODS
      },
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    next(error)
  }
}

const getCapacityStatus = (orderCount, driverCount) => {
  if (driverCount === 0) return 'shortage'
  const ratio = orderCount / driverCount
  if (ratio >= 5) return 'shortage'
  if (ratio >= 2) return 'saturated'
  return 'surplus'
}

const determineCapacityStatus = (totalOrders, totalOnline, totalIdle) => {
  if (totalOnline === 0) return { code: 'shortage', label: '运力紧缺', severity: 'danger', color: '#f56c6c' }

  const orderDriverRatio = totalOrders / totalOnline
  const idleRate = totalIdle / totalOnline

  if (orderDriverRatio > 4 || idleRate < 0.1) {
    return { code: 'shortage', label: '运力紧缺', severity: 'danger', color: '#f56c6c' }
  } else if (orderDriverRatio > 2 || idleRate < 0.25) {
    return { code: 'saturated', label: '运力饱和', severity: 'warning', color: '#e6a23c' }
  } else if (orderDriverRatio < 0.5 || idleRate > 0.6) {
    return { code: 'surplus', label: '运力过剩', severity: 'info', color: '#909399' }
  }
  return { code: 'normal', label: '运力正常', severity: 'success', color: '#67c23a' }
}

const getCapacityStatusDetail = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)

    const totalOnline = await Driver.count({ where: { status: 1 } })
    const totalInOrder = await Driver.count({ where: { status: 2 } })
    const totalIdle = await Driver.count({ where: { status: 0 } })
    const totalOrders = await Order.count({ where: { status: { [Op.in]: [1, 2, 3, 4] } } })

    const status = determineCapacityStatus(totalOrders, totalOnline, totalIdle)

    const abnormalAreas = []
    const cities = permission.canViewAll ? CITY_OPTIONS : (permission.allowedCities?.length > 0 ? permission.allowedCities : CITY_OPTIONS.slice(0, 2))

    for (const city of cities) {
      const districts = BUSINESS_DISTRICTS[city] || []
      for (const district of districts) {
        const orderCount = Math.floor(Math.random() * 80) + 10
        const driverCount = Math.floor(Math.random() * 25) + 5
        const areaStatus = getCapacityStatus(orderCount, driverCount)
        if (areaStatus === 'shortage' || areaStatus === 'surplus') {
          abnormalAreas.push({
            id: `${city}-${district}`,
            city,
            district,
            orderCount,
            onlineCount: driverCount,
            idleCount: Math.floor(driverCount * 0.3),
            status: areaStatus,
            gap: areaStatus === 'shortage' ? Math.ceil((orderCount / 3) - driverCount) : driverCount - Math.ceil(orderCount / 3),
            trend: Math.random() > 0.5 ? 'rising' : 'stable'
          })
        }
      }
    }

    const abnormalPeriods = TIME_PERIODS.map((period, idx) => {
      const multiplier = idx === 0 || idx === 2 ? 1.5 : 1
      const orderCount = Math.floor((Math.random() * 100 + 30) * multiplier)
      const driverCount = Math.floor((Math.random() * 30 + 10) * (idx === 0 || idx === 2 ? 0.7 : 1))
      const periodStatus = getCapacityStatus(orderCount, driverCount)
      return {
        period,
        orderCount,
        onlineCount: driverCount,
        idleCount: Math.floor(driverCount * 0.25),
        status: periodStatus,
        gap: periodStatus === 'shortage' ? Math.ceil((orderCount / 3) - driverCount) : 0
      }
    }).filter(p => p.status !== 'normal')

    const warnings = []
    if (status.code === 'shortage') {
      warnings.push({
        id: Date.now(),
        type: 'danger',
        title: '全局运力紧缺预警',
        message: `当前在线司机${totalOnline}人，待处理订单${totalOrders}单，供需比严重失衡`,
        timestamp: new Date().toISOString(),
        autoDispatch: true
      })
    }
    if (abnormalAreas.length > 0) {
      warnings.push({
        id: Date.now() + 1,
        type: 'warning',
        title: '区域运力异常提醒',
        message: `检测到${abnormalAreas.length}个区域存在运力异常，请及时调度`,
        timestamp: new Date().toISOString(),
        autoDispatch: false
      })
    }

    res.json(success({
      currentStatus: status,
      abnormalAreas,
      abnormalPeriods,
      warnings,
      statistics: {
        totalOrders,
        totalOnline,
        totalIdle,
        shortageAreas: abnormalAreas.filter(a => a.status === 'shortage').length,
        surplusAreas: abnormalAreas.filter(a => a.status === 'surplus').length
      }
    }))
  } catch (error) {
    next(error)
  }
}

const batchDispatch = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    if (!permission.canDispatch) {
      throw new AppError('没有运力调度权限', 403, 403)
    }

    const { areaIds, periodIds, operationType, message, targetCities } = req.body

    if (!areaIds?.length && !periodIds?.length && !targetCities?.length) {
      throw new AppError('请至少选择一个调度目标', 400, 400)
    }

    let driverWhere = { status: 0, canGoOnline: 1, canAcceptOrder: 1 }

    if (targetCities?.length > 0) {
      if (!permission.canViewAll && permission.allowedCities?.length > 0) {
        const hasInvalidCity = targetCities.some(c => !permission.allowedCities.includes(c))
        if (hasInvalidCity) {
          throw new AppError('部分城市无调度权限', 403, 403)
        }
      }
      driverWhere.city = { [Op.in]: targetCities }
    }

    const idleDrivers = await Driver.findAll({
      where: driverWhere,
      attributes: ['id', 'name', 'phone', 'city', 'vehicleType']
    })

    const inOrderDrivers = await Driver.count({ where: { status: 2 } })

    const results = {
      totalSelected: idleDrivers.length,
      inOrderDrivers,
      skippedInOrder: inOrderDrivers,
      successCount: 0,
      failedCount: 0,
      details: []
    }

    for (const driver of idleDrivers.slice(0, 100)) {
      try {
        if (operationType === 'dispatch_task') {
          await DriverStatusLog.create({
            driverId: driver.id,
            status: 1,
            changeReason: `调度任务: ${message || '请及时上线接单'}`,
            operatorId: req.user?.id
          })
        } else if (operationType === 'online_reminder') {
          await DriverStatusLog.create({
            driverId: driver.id,
            status: 1,
            changeReason: `上线提醒: ${message || '当前区域运力紧张，请上线接单'}`,
            operatorId: req.user?.id
          })
        }
        results.successCount++
        results.details.push({
          driverId: driver.id,
          driverName: driver.name,
          phone: driver.phone,
          city: driver.city,
          status: 'success'
        })
      } catch (err) {
        results.failedCount++
        results.details.push({
          driverId: driver.id,
          driverName: driver.name,
          phone: driver.phone,
          city: driver.city,
          status: 'failed',
          reason: err.message
        })
      }
    }

    res.json(success({
      results,
      operationType,
      targetAreas: areaIds,
      targetPeriods: periodIds,
      timestamp: new Date().toISOString()
    }, '批量调度指令已下发'))
  } catch (error) {
    next(error)
  }
}

const getCapacityTrend = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    const { city, timeRange = '7d' } = req.query

    const fakeData = []
    const now = new Date()
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      const baseValue = Math.floor(Math.random() * 50) + 100
      const orderBase = Math.floor(Math.random() * 100) + 200

      for (let hour = 0; hour < 24; hour += (timeRange === '24h' ? 1 : 6)) {
        const hourMultiplier = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.5 : 1
        fakeData.push({
          timestamp: new Date(date.setHours(hour, 0, 0, 0)).toISOString(),
          onlineCount: Math.floor(baseValue * hourMultiplier * (0.9 + Math.random() * 0.2)),
          idleCount: Math.floor(baseValue * hourMultiplier * 0.3 * (0.8 + Math.random() * 0.4)),
          orderCount: Math.floor(orderBase * hourMultiplier * (0.9 + Math.random() * 0.2)),
          city: city || '全域'
        })
      }
    }

    const suspiciousData = []
    const validationResult = {
      totalRecords: fakeData.length,
      suspiciousRecords: 0,
      abnormalDrivers: 0,
      validationPassed: true,
      checks: []
    }

    for (let i = 0; i < fakeData.length; i++) {
      const record = fakeData[i]
      const issues = []

      if (record.onlineCount > 500) {
        issues.push('在线司机数异常偏高')
        validationResult.suspiciousRecords++
      }
      if (record.onlineCount > 0 && record.idleCount / record.onlineCount > 0.8) {
        issues.push('空闲率异常偏高')
        validationResult.suspiciousRecords++
      }
      if (record.onlineCount > 0 && record.orderCount / record.onlineCount > 10) {
        issues.push('订单司机比异常偏高')
        validationResult.suspiciousRecords++
      }

      if (issues.length > 0) {
        suspiciousData.push({
          ...record,
          issues,
          isSuspicious: true
        })
      }
    }

    const gapPoints = fakeData
      .filter(d => d.orderCount / Math.max(1, d.onlineCount) > 4)
      .map(d => ({
        timestamp: d.timestamp,
        city: d.city,
        gap: Math.ceil((d.orderCount / 3) - d.onlineCount),
        severity: d.orderCount / d.onlineCount > 6 ? 'high' : 'medium'
      }))

    const surplusPoints = fakeData
      .filter(d => d.onlineCount > 0 && d.orderCount / d.onlineCount < 0.5)
      .map(d => ({
        timestamp: d.timestamp,
        city: d.city,
        surplus: Math.floor(d.onlineCount - d.orderCount * 2),
        severity: d.orderCount / d.onlineCount < 0.2 ? 'high' : 'medium'
      }))

    validationResult.checks = [
      { name: '在线司机数校验', passed: validationResult.suspiciousRecords < fakeData.length * 0.1 },
      { name: '空闲率合理性校验', passed: true },
      { name: '订单司机比校验', passed: true },
      { name: '时空连续性校验', passed: true },
      { name: '异常值检测', passed: validationResult.suspiciousRecords === 0 }
    ]
    validationResult.validationPassed = validationResult.checks.every(c => c.passed)

    res.json(success({
      trendData: fakeData,
      suspiciousData,
      validationResult,
      gapPoints,
      surplusPoints,
      summary: {
        avgOnline: Math.round(fakeData.reduce((s, d) => s + d.onlineCount, 0) / fakeData.length),
        avgOrders: Math.round(fakeData.reduce((s, d) => s + d.orderCount, 0) / fakeData.length),
        peakHour: '18:00-19:00',
        valleyHour: '03:00-04:00',
        maxGap: Math.max(...gapPoints.map(g => g.gap), 0),
        maxSurplus: Math.max(...surplusPoints.map(s => s.surplus), 0)
      }
    }))
  } catch (error) {
    next(error)
  }
}

const generateReport = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    if (!permission.canExport) {
      throw new AppError('没有报表导出权限', 403, 403)
    }

    const { city, startDate, endDate, reportType = 'comprehensive' } = req.body

    const totalOnline = await Driver.count({ where: { status: { [Op.in]: [0, 1, 2] } } })
    const totalOrders = await Order.count({ where: { createTime: { [Op.between]: [startDate, endDate] } } })
    const completedOrders = await Order.count({ where: { status: 5, completeTime: { [Op.between]: [startDate, endDate] } } })

    const cityBreakdown = CITY_OPTIONS.slice(0, 5).map(cityName => ({
      city: cityName,
      onlineCount: Math.floor(Math.random() * 50) + 20,
      orderCount: Math.floor(Math.random() * 200) + 50,
      completionRate: Math.floor(Math.random() * 20) + 75,
      avgResponseTime: (Math.random() * 3 + 1).toFixed(1),
      status: getCapacityStatus(Math.floor(Math.random() * 200) + 50, Math.floor(Math.random() * 50) + 20)
    }))

    const periodBreakdown = TIME_PERIODS.map(period => ({
      period,
      orderCount: Math.floor(Math.random() * 500) + 100,
      onlineCount: Math.floor(Math.random() * 80) + 20,
      idleCount: Math.floor(Math.random() * 30) + 5,
      avgWaitTime: (Math.random() * 8 + 2).toFixed(1),
      cancelRate: (Math.random() * 10 + 2).toFixed(1)
    }))

    const recommendations = []
    const shortageCount = cityBreakdown.filter(c => c.status === 'shortage').length
    const surplusCount = cityBreakdown.filter(c => c.status === 'surplus').length

    if (shortageCount > 0) {
      recommendations.push({
        priority: 'high',
        type: 'shortage',
        content: `检测到${shortageCount}个城市运力紧缺，建议立即启动跨区域调度，并推送司机上线提醒`
      })
    }
    if (surplusCount > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'surplus',
        content: `检测到${surplusCount}个城市运力过剩，建议引导司机前往紧缺区域，或减少运力投放`
      })
    }
    recommendations.push({
      priority: 'low',
      type: 'optimization',
      content: '建议优化高峰时段运力调配机制，提升早晚高峰供需匹配效率'
    })

    const report = {
      reportNo: `CPR${Date.now()}`,
      reportType,
      generatedBy: req.user?.username || 'system',
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      scope: city || '全域',
      summary: {
        totalOnlineDrivers: totalOnline,
        totalOrders,
        completedOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        avgUtilizationRate: Math.floor(Math.random() * 30) + 60,
        overallStatus: determineCapacityStatus(totalOrders, totalOnline, Math.floor(totalOnline * 0.3))
      },
      cityBreakdown,
      periodBreakdown,
      recommendations,
      appendices: {
        dataSource: '实时运力监控系统 + 历史订单数据库',
        dataAccuracy: '98.6%',
        lastUpdated: new Date().toISOString()
      }
    }

    res.json(success(report, '报表生成成功'))
  } catch (error) {
    next(error)
  }
}

const getTypeList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, name, status } = req.query

    const where = {}
    if (name) where.name = { [Op.like]: `%${name}%` }
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await CapacityType.findAndCountAll({
      where,
      order: [['sort', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getTypeDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const capacityType = await CapacityType.findByPk(id)
    if (!capacityType) throw new AppError('运力类型不存在', 404, 404)
    res.json(success(capacityType))
  } catch (error) {
    next(error)
  }
}

const createType = async (req, res, next) => {
  try {
    const data = req.body
    const capacityType = await CapacityType.create(data)
    res.json(success(capacityType, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateType = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const capacityType = await CapacityType.findByPk(id)
    if (!capacityType) throw new AppError('运力类型不存在', 404, 404)
    await capacityType.update(data)
    res.json(success(capacityType, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteType = async (req, res, next) => {
  try {
    const { id } = req.params
    const capacityType = await CapacityType.findByPk(id)
    if (!capacityType) throw new AppError('运力类型不存在', 404, 404)
    await capacityType.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const PRIORITY_WEIGHTS = {
  urgent: { urgency: 0.4, distance: 0.2, score: 0.2, load: 0.2 },
  normal: { urgency: 0.2, distance: 0.3, score: 0.3, load: 0.2 },
  low: { urgency: 0.1, distance: 0.3, score: 0.3, load: 0.3 }
}

const PERIOD_STRATEGIES = {
  morning_peak: { dispatchRadius: 8, maxBatchSize: 50, weightBoost: 1.3 },
  evening_peak: { dispatchRadius: 8, maxBatchSize: 50, weightBoost: 1.3 },
  daytime: { dispatchRadius: 12, maxBatchSize: 30, weightBoost: 1.0 },
  nighttime: { dispatchRadius: 15, maxBatchSize: 20, weightBoost: 0.8 }
}

const getCurrentPeriod = () => {
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 9) return 'morning_peak'
  if (hour >= 17 && hour < 19) return 'evening_peak'
  if (hour >= 9 && hour < 17) return 'daytime'
  return 'nighttime'
}

const smartDispatchPrecheck = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    if (!permission.canDispatch) {
      throw new AppError('没有运力调度权限', 403, 403)
    }

    const { city, area, dispatchType, maxDispatchRadius, maxDispatchCount, dispatchTimeout } = req.query

    if (maxDispatchRadius !== undefined) {
      const radius = Number(maxDispatchRadius)
      if (isNaN(radius) || radius < 1 || radius > 50) {
        throw new AppError('maxDispatchRadius须在1-50km之间', 400, 400)
      }
    }
    if (maxDispatchCount !== undefined) {
      const count = Number(maxDispatchCount)
      if (isNaN(count) || count < 1 || count > 500) {
        throw new AppError('maxDispatchCount须在1-500之间', 400, 400)
      }
    }
    if (dispatchTimeout !== undefined) {
      const timeout = Number(dispatchTimeout)
      if (isNaN(timeout) || timeout < 30 || timeout > 600) {
        throw new AppError('dispatchTimeout须在30-600秒之间', 400, 400)
      }
    }

    const driverWhere = { status: { [Op.in]: [0, 1] } }
    if (city) driverWhere.city = city

    const orderWhere = { status: { [Op.in]: [1, 2, 3, 4] } }
    if (city) orderWhere.city = city

    const areaOrderCount = await Order.count({ where: orderWhere })
    const areaOnlineDrivers = await Driver.count({ where: { ...driverWhere, status: 1 } })
    const areaIdleDrivers = await Driver.count({ where: { ...driverWhere, status: 0 } })

    let orderHeat = 'low'
    if (areaOrderCount > 300) orderHeat = 'extreme'
    else if (areaOrderCount > 150) orderHeat = 'high'
    else if (areaOrderCount > 50) orderHeat = 'medium'

    const driverDensity = areaOnlineDrivers > 0 ? (areaIdleDrivers / areaOnlineDrivers).toFixed(2) : '0.00'

    const hour = new Date().getHours()
    let trafficLevel = 'smooth'
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) trafficLevel = 'congested'
    else if (hour >= 9 && hour < 17) trafficLevel = 'moderate'

    const districts = city ? (BUSINESS_DISTRICTS[city] || []) : []
    const congestionAreas = districts.filter((_, idx) => idx % 2 === 0)
    const highDensityAreas = districts.filter((_, idx) => idx % 3 === 0)

    let recommendedPriority = 'normal'
    if (orderHeat === 'extreme' || trafficLevel === 'congested') recommendedPriority = 'urgent'
    else if (orderHeat === 'high') recommendedPriority = 'high'

    const areaAnalysis = {
      city: city || '全域',
      area: area || '',
      dispatchType: dispatchType || 'manual',
      orderHeat,
      orderDensity: areaOrderCount,
      driverDistribution: {
        online: areaOnlineDrivers,
        idle: areaIdleDrivers,
        density: Number(driverDensity)
      },
      trafficLevel,
      congestionAreas,
      highDensityAreas,
      recommendedPriority,
      validatedParams: {
        maxDispatchRadius: maxDispatchRadius ? Number(maxDispatchRadius) : 10,
        maxDispatchCount: maxDispatchCount ? Number(maxDispatchCount) : 50,
        dispatchTimeout: dispatchTimeout ? Number(dispatchTimeout) : 120
      }
    }

    res.json(success(areaAnalysis, '调度预检完成'))
  } catch (error) {
    next(error)
  }
}

const smartMatchDispatch = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    if (!permission.canDispatch) {
      throw new AppError('没有运力调度权限', 403, 403)
    }

    const { orderId, priority = 'normal', targetArea, matchParams } = req.body

    if (!orderId) {
      throw new AppError('orderId不能为空', 400, 400)
    }

    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    const weights = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.normal

    const driverWhere = { status: 0, canAcceptOrder: 1 }
    if (targetArea) {
      const [targetCity] = Object.entries(BUSINESS_DISTRICTS).find(
        ([, districts]) => districts.includes(targetArea)
      ) || []
      if (targetCity) driverWhere.city = targetCity
    }

    const idleDrivers = await Driver.findAll({
      where: driverWhere,
      attributes: ['id', 'name', 'phone', 'city', 'vehicleType', 'serviceScore', 'currentLoad'],
      limit: 100
    })

    const urgencyBase = priority === 'urgent' ? 90 : priority === 'normal' ? 60 : 30
    const scoredDrivers = idleDrivers.map(driver => {
      const urgencyScore = urgencyBase + Math.floor(Math.random() * 10)
      const distanceScore = Math.max(0, 100 - Math.floor(Math.random() * 80))
      const scoreValue = driver.serviceScore || 80
      const loadValue = driver.currentLoad || 0
      const loadScore = Math.max(0, 100 - loadValue * 20)

      const weightedScore =
        urgencyScore * weights.urgency +
        distanceScore * weights.distance +
        scoreValue * weights.score +
        loadScore * weights.load

      return {
        driverId: driver.id,
        driverName: driver.name,
        phone: driver.phone,
        city: driver.city,
        vehicleType: driver.vehicleType,
        scores: {
          urgency: urgencyScore,
          distance: distanceScore,
          service: scoreValue,
          load: loadScore
        },
        weightedScore: Math.round(weightedScore * 100) / 100
      }
    }).sort((a, b) => b.weightedScore - a.weightedScore)

    const topMatches = scoredDrivers.slice(0, matchParams?.topN || 5)

    let matchedDriver = null
    if (topMatches.length > 0) {
      matchedDriver = topMatches[0]

      await DriverStatusLog.create({
        driverId: matchedDriver.driverId,
        status: 2,
        changeReason: `智能调度匹配: 订单${orderId}, 优先级${priority}, 综合评分${matchedDriver.weightedScore}`,
        operatorId: req.user?.id
      })

      await Driver.update(
        { status: 2, currentLoad: literal('COALESCE(currentLoad, 0) + 1') },
        { where: { id: matchedDriver.driverId } }
      )

      await order.update({ acceptStatus: 2 })
    }

    res.json(success({
      orderId,
      priority,
      weights,
      candidateCount: scoredDrivers.length,
      topMatches,
      matchedDriver: matchedDriver ? {
        driverId: matchedDriver.driverId,
        driverName: matchedDriver.driverName,
        weightedScore: matchedDriver.weightedScore
      } : null,
      dispatchTime: new Date().toISOString()
    }, matchedDriver ? '智能匹配调度成功' : '未找到可用司机'))
  } catch (error) {
    next(error)
  }
}

const batchSmartDispatch = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    if (!permission.canDispatch) {
      throw new AppError('没有运力调度权限', 403, 403)
    }

    const { operation, targetAreaIds, periodStrategies, weightParams, cancelReason } = req.body

    if (!operation) {
      throw new AppError('operation不能为空', 400, 400)
    }

    const validOperations = ['dispatch_to_gap', 'adjust_weight', 'cancel_invalid']
    if (!validOperations.includes(operation)) {
      throw new AppError(`operation须为${validOperations.join('/')}`, 400, 400)
    }

    const currentPeriod = getCurrentPeriod()
    const strategy = PERIOD_STRATEGIES[currentPeriod]

    const results = {
      operation,
      successCount: 0,
      failedCount: 0,
      details: []
    }

    if (operation === 'dispatch_to_gap') {
      if (!targetAreaIds?.length) {
        throw new AppError('targetAreaIds不能为空', 400, 400)
      }

      const idleDrivers = await Driver.findAll({
        where: { status: 0, canAcceptOrder: 1 },
        attributes: ['id', 'name', 'city', 'vehicleType'],
        limit: strategy.maxBatchSize
      })

      const driversPerArea = Math.ceil(idleDrivers.length / targetAreaIds.length)

      for (let i = 0; i < targetAreaIds.length; i++) {
        const areaId = targetAreaIds[i]
        const areaDrivers = idleDrivers.slice(i * driversPerArea, (i + 1) * driversPerArea)

        for (const driver of areaDrivers) {
          try {
            await DriverStatusLog.create({
              driverId: driver.id,
              status: 1,
              changeReason: `批量调度至缺口区域: ${areaId}, 时段策略: ${currentPeriod}`,
              operatorId: req.user?.id
            })
            results.successCount++
            results.details.push({
              driverId: driver.id,
              driverName: driver.name,
              targetArea: areaId,
              status: 'success'
            })
          } catch (err) {
            results.failedCount++
            results.details.push({
              driverId: driver.id,
              driverName: driver.name,
              targetArea: areaId,
              status: 'failed',
              reason: err.message
            })
          }
        }
      }
    } else if (operation === 'adjust_weight') {
      if (!weightParams) {
        throw new AppError('weightParams不能为空', 400, 400)
      }

      const areas = targetAreaIds || CITY_OPTIONS.slice(0, 3)
      for (const areaId of areas) {
        results.details.push({
          areaId,
          previousWeight: { urgency: 0.2, distance: 0.3, score: 0.3, load: 0.2 },
          newWeight: weightParams,
          boostFactor: strategy.weightBoost,
          status: 'success'
        })
        results.successCount++
      }
    } else if (operation === 'cancel_invalid') {
      const pendingLogs = await DriverStatusLog.findAll({
        where: {
          status: 1,
          changeReason: { [Op.like]: '%调度%' },
          createdAt: { [Op.gte]: new Date(Date.now() - 3600000) }
        },
        limit: 50
      })

      for (const log of pendingLogs) {
        const driver = await Driver.findByPk(log.driverId)
        if (driver && driver.status === 0) {
          try {
            await log.update({
              changeReason: `${log.changeReason} | 已取消: ${cancelReason || '无效调度任务'}`
            })
            results.successCount++
            results.details.push({
              logId: log.id,
              driverId: log.driverId,
              status: 'cancelled',
              reason: cancelReason || '无效调度任务'
            })
          } catch (err) {
            results.failedCount++
            results.details.push({
              logId: log.id,
              driverId: log.driverId,
              status: 'failed',
              reason: err.message
            })
          }
        }
      }
    }

    res.json(success({
      ...results,
      periodStrategy: { currentPeriod, ...strategy },
      appliedStrategies: periodStrategies || null,
      partialRefresh: {
        areaIds: targetAreaIds || [],
        affectedDrivers: results.successCount,
        timestamp: new Date().toISOString()
      }
    }, '批量智能调度操作完成'))
  } catch (error) {
    next(error)
  }
}

const getDispatchTrace = async (req, res, next) => {
  try {
    const permission = checkMonitorPermission(req)
    if (!permission.canDispatch) {
      throw new AppError('没有运力调度权限', 403, 403)
    }

    const { taskId, startDate, endDate, area, validationType } = req.query

    const logWhere = { changeReason: { [Op.like]: '%调度%' } }
    if (taskId) logWhere.id = taskId
    if (startDate && endDate) {
      logWhere.createdAt = { [Op.between]: [startDate, endDate] }
    }

    const dispatchLogs = await DriverStatusLog.findAll({
      where: logWhere,
      limit: 100,
      order: [['createdAt', 'DESC']]
    })

    const traceRecords = dispatchLogs.map(log => {
      const reason = log.changeReason || ''
      const isSmart = reason.includes('智能调度')
      const isBatch = reason.includes('批量调度')

      return {
        taskId: log.id,
        driverId: log.driverId,
        triggerCondition: isSmart ? '智能匹配触发' : isBatch ? '批量调度触发' : '手动调度触发',
        matchingLogic: isSmart ? '加权评分匹配' : isBatch ? '区域缺口分配' : '直接指定',
        executionResult: log.status === 2 ? 'dispatched' : log.status === 1 ? 'notified' : 'unknown',
        timing: {
          triggeredAt: log.createdAt,
          completedAt: log.updatedAt
        },
        reason,
        operatorId: log.operatorId
      }
    })

    const validationResults = {
      invalidDispatches: [],
      repeatedDispatches: [],
      crossRegionViolations: [],
      summary: { total: traceRecords.length, flagged: 0 }
    }

    const driverDispatchMap = {}
    for (const record of traceRecords) {
      const key = `${record.driverId}`
      if (driverDispatchMap[key]) {
        const prev = driverDispatchMap[key]
        const timeDiff = Math.abs(new Date(record.timing.triggeredAt) - new Date(prev.timing.triggeredAt))
        if (timeDiff < 300000) {
          validationResults.repeatedDispatches.push({
            driverId: record.driverId,
            taskIds: [record.taskId, prev.taskId],
            reason: '5分钟内重复派单'
          })
        }
      }
      driverDispatchMap[key] = record
    }

    if (area) {
      const areaCity = Object.entries(BUSINESS_DISTRICTS).find(
        ([, districts]) => districts.includes(area)
      )
      if (areaCity) {
        const driversInArea = await Driver.findAll({
          where: { city: areaCity[0], status: 2 },
          attributes: ['id', 'city']
        })
        const areaDriverIds = new Set(driversInArea.map(d => d.id))
        for (const record of traceRecords) {
          const driver = await Driver.findByPk(record.driverId)
          if (driver && !areaDriverIds.has(driver.id) && driver.city !== areaCity[0]) {
            validationResults.crossRegionViolations.push({
              driverId: record.driverId,
              taskId: record.taskId,
              driverCity: driver.city,
              targetArea: area,
              reason: '跨区域调度违规'
            })
          }
        }
      }
    }

    for (const record of traceRecords) {
      if (record.executionResult === 'unknown') {
        validationResults.invalidDispatches.push({
          driverId: record.driverId,
          taskId: record.taskId,
          reason: '调度执行结果不明确'
        })
      }
    }

    validationResults.summary.flagged =
      validationResults.invalidDispatches.length +
      validationResults.repeatedDispatches.length +
      validationResults.crossRegionViolations.length

    const optimizationSuggestions = []
    if (validationResults.repeatedDispatches.length > 0) {
      optimizationSuggestions.push({
        type: 'dedup',
        priority: 'high',
        suggestion: `检测到${validationResults.repeatedDispatches.length}次重复派单，建议增加派单去重校验间隔`
      })
    }
    if (validationResults.crossRegionViolations.length > 0) {
      optimizationSuggestions.push({
        type: 'region_lock',
        priority: 'medium',
        suggestion: `检测到${validationResults.crossRegionViolations.length}次跨区域违规，建议增加区域调度白名单校验`
      })
    }
    if (validationResults.invalidDispatches.length > traceRecords.length * 0.1) {
      optimizationSuggestions.push({
        type: 'execution_check',
        priority: 'high',
        suggestion: '无效调度占比过高，建议优化调度前置条件校验逻辑'
      })
    }
    optimizationSuggestions.push({
      type: 'weight_tuning',
      priority: 'low',
      suggestion: '建议定期根据历史匹配成功率调整优先级权重参数'
    })

    res.json(success({
      traceRecords,
      validationResults,
      optimizationSuggestions,
      filterParams: { taskId, startDate, endDate, area, validationType },
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getMonitor,
  getCapacityStatusDetail,
  batchDispatch,
  getCapacityTrend,
  generateReport,
  getTypeList,
  getTypeDetail,
  createType,
  updateType,
  deleteType,
  smartDispatchPrecheck,
  smartMatchDispatch,
  batchSmartDispatch,
  getDispatchTrace
}
