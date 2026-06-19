const { Op } = require('sequelize')
const { Vehicle, VehicleAuditLog, Driver, DriverAuditLog } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const { validateVehicle, checkPlateUniqueness, checkVINUniqueness, validatePlateNumber, validateVIN } = require('../services/vehicleValidationService')
const { calculateOperationLevel, syncDriverOrderPermission, getLevelPrivileges } = require('../services/vehicleLevelService')
const { validateStatusChange, determineMaintenanceWarning, autoDetermineOperationStatus, checkAbnormalStatus, syncCapacityAndSchedule } = require('../services/vehicleStatusService')
const { performComplianceCheck, detectFakeCompliance, detectMissedChecks, generateComplianceReport, getCityTier, getComplianceStandards, calculateComplianceLevel, batchComplianceCheck } = require('../services/vehicleComplianceService')
const { VehicleMaintenance, VehicleViolation, VehicleStatusLog, VehicleComplianceCheck, VehicleRectification } = require('../models')

const OPERATION_TYPE_NAMES = {
  1: '新增备案',
  2: '修改备案',
  3: '审核通过',
  4: '审核驳回',
  5: '批量复核',
  6: '标记过期',
  7: '车辆锁定',
  8: '车辆解锁',
  9: '资料复核',
  10: '虚假备案拦截',
  11: '重复备案拦截',
  12: '证件造假拦截',
  13: '运营状态变更',
  14: '发起检修',
  15: '违规记录',
  16: '批量恢复运营',
  17: '批量发起检修',
  18: '批量提醒换证',
  19: '异常拦截',
  20: '自动状态判定',
  21: '合规校验',
  22: '批量合规校验',
  23: '合规整改',
  24: '合规报告导出',
  25: '虚假合规拦截',
  26: '漏审检测'
}

const createAuditLog = async (vehicle, operationType, extraData = {}, operatorId = null, operatorName = null) => {
  const logData = {
    vehicleId: vehicle.id,
    plateNumber: vehicle.plateNumber,
    operationType,
    operationTypeName: OPERATION_TYPE_NAMES[operationType] || '未知操作',
    oldAuditStatus: vehicle.auditStatus,
    newAuditStatus: extraData.newAuditStatus !== undefined ? extraData.newAuditStatus : vehicle.auditStatus,
    oldStatus: vehicle.status,
    newStatus: extraData.newStatus !== undefined ? extraData.newStatus : vehicle.status,
    oldOperationLevel: vehicle.operationLevel,
    newOperationLevel: extraData.newOperationLevel !== undefined ? extraData.newOperationLevel : vehicle.operationLevel,
    remark: extraData.remark || '',
    validationResult: extraData.validationResult || null,
    changedFields: extraData.changedFields || null,
    riskLevel: extraData.riskLevel || vehicle.riskLevel,
    operatorId,
    operatorName
  }

  return await VehicleAuditLog.create(logData)
}

const getList = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      plateNumber,
      brand,
      capacityType,
      status,
      auditStatus,
      operationLevel,
      city,
      isLocked,
      vin
    } = req.query

    const where = {}

    if (plateNumber) where.plateNumber = { [Op.like]: `%${plateNumber}%` }
    if (brand) where.brand = { [Op.like]: `%${brand}%` }
    if (vin) where.vin = { [Op.like]: `%${vin}%` }
    if (capacityType) where.capacityType = capacityType
    if (status !== undefined && status !== '') where.status = status
    if (auditStatus !== undefined && auditStatus !== '') where.auditStatus = auditStatus
    if (operationLevel !== undefined && operationLevel !== '') where.operationLevel = operationLevel
    if (city) where.city = city
    if (isLocked !== undefined && isLocked !== '') where.isLocked = isLocked

    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const vehicle = await Vehicle.findByPk(id, {
      include: [
        { model: VehicleAuditLog, as: 'auditLogs', separate: true, order: [['createTime', 'DESC']], limit: 20 }
      ]
    })
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)
    
    const levelPrivileges = getLevelPrivileges(vehicle.operationLevel)
    
    res.json(success({
      ...vehicle.toJSON(),
      levelPrivileges
    }))
  } catch (error) {
    next(error)
  }
}

const checkPlate = async (req, res, next) => {
  try {
    const { plateNumber, excludeId } = req.query
    const formatResult = validatePlateNumber(plateNumber)
    if (!formatResult.valid) {
      return res.json(success({ ...formatResult, unique: false }))
    }
    const result = await checkPlateUniqueness(plateNumber, excludeId)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const checkVIN = async (req, res, next) => {
  try {
    const { vin, excludeId } = req.query
    const formatResult = validateVIN(vin)
    if (!formatResult.valid) {
      return res.json(success({ ...formatResult, unique: false }))
    }
    const result = await checkVINUniqueness(vin, excludeId)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const validateVehicleData = async (req, res, next) => {
  try {
    const data = req.body
    const { excludeId } = req.query
    const result = await validateVehicle(data, excludeId)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    const data = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const validationResult = await validateVehicle(data)
    
    if (validationResult.risks.some(r => r.level === 'high')) {
      await createAuditLog(
        { ...data, id: 0 },
        data.vin ? 12 : 10,
        {
          remark: validationResult.failed.map(f => f.message).join('; '),
          validationResult,
          riskLevel: 3
        },
        operatorId,
        operatorName
      )
      throw new AppError('备案申请已被拦截：检测到高风险问题', 400, 400)
    }

    if (!validationResult.valid) {
      throw new AppError(`车辆信息校验不通过：${validationResult.failed[0]?.message}`, 400, 400)
    }

    const levelResult = calculateOperationLevel(data)
    
    const createData = {
      ...data,
      operationLevel: levelResult.level,
      orderScope: levelResult.orderScope,
      premiumPermission: levelResult.premiumPermission,
      operationTimeLimit: levelResult.operationTimeLimit,
      validationResult,
      riskLevel: validationResult.risks.some(r => r.level === 'high') ? 3 : 
                 validationResult.risks.some(r => r.level === 'medium') ? 2 : 1,
      auditStatus: 0
    }

    if (data.plateNumber) {
      createData.plateNumber = data.plateNumber.toUpperCase().replace(/\s/g, '')
    }
    if (data.vin) {
      createData.vin = data.vin.toUpperCase().replace(/\s/g, '')
    }
    if (data.engineNo) {
      createData.engineNo = data.engineNo.toUpperCase().replace(/\s/g, '')
    }

    const vehicle = await Vehicle.create(createData)

    await createAuditLog(
      vehicle,
      1,
      {
        remark: '新增车辆备案申请',
        validationResult,
        newOperationLevel: levelResult.level
      },
      operatorId,
      operatorName
    )

    res.json(success({
      ...vehicle.toJSON(),
      levelBreakdown: levelResult.breakdown,
      totalScore: levelResult.totalScore
    }, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    if (vehicle.isLocked === 1) {
      throw new AppError('车辆已被锁定，无法修改', 400, 400)
    }

    const validationResult = await validateVehicle(data, id)
    
    if (validationResult.risks.some(r => r.level === 'high')) {
      await createAuditLog(
        vehicle,
        12,
        {
          remark: validationResult.failed.map(f => f.message).join('; '),
          validationResult,
          riskLevel: 3
        },
        operatorId,
        operatorName
      )
      throw new AppError('修改申请已被拦截：检测到高风险问题', 400, 400)
    }

    if (!validationResult.valid) {
      throw new AppError(`车辆信息校验不通过：${validationResult.failed[0]?.message}`, 400, 400)
    }

    const levelResult = calculateOperationLevel(data)
    
    const updateData = {
      ...data,
      operationLevel: levelResult.level,
      orderScope: levelResult.orderScope,
      premiumPermission: levelResult.premiumPermission,
      operationTimeLimit: levelResult.operationTimeLimit,
      validationResult,
      riskLevel: validationResult.risks.some(r => r.level === 'high') ? 3 : 
                 validationResult.risks.some(r => r.level === 'medium') ? 2 : 1,
      auditStatus: 0
    }

    if (data.plateNumber) {
      updateData.plateNumber = data.plateNumber.toUpperCase().replace(/\s/g, '')
    }
    if (data.vin) {
      updateData.vin = data.vin.toUpperCase().replace(/\s/g, '')
    }
    if (data.engineNo) {
      updateData.engineNo = data.engineNo.toUpperCase().replace(/\s/g, '')
    }

    const changedFields = {}
    Object.keys(updateData).forEach(key => {
      if (vehicle[key] !== undefined && updateData[key] !== undefined && vehicle[key] !== updateData[key]) {
        changedFields[key] = { old: vehicle[key], new: updateData[key] }
      }
    })

    const oldAuditStatus = vehicle.auditStatus
    const oldOperationLevel = vehicle.operationLevel

    await vehicle.update(updateData)

    await createAuditLog(
      vehicle,
      2,
      {
        oldAuditStatus,
        newAuditStatus: 0,
        oldOperationLevel,
        newOperationLevel: levelResult.level,
        remark: '修改车辆备案信息，重新进入审核',
        validationResult,
        changedFields
      },
      operatorId,
      operatorName
    )

    if (vehicle.driverId && (oldAuditStatus !== vehicle.auditStatus || oldOperationLevel !== vehicle.operationLevel)) {
      await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
    }

    res.json(success({
      ...vehicle.toJSON(),
      levelBreakdown: levelResult.breakdown,
      totalScore: levelResult.totalScore
    }, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    await createAuditLog(
      vehicle,
      4,
      {
        newAuditStatus: 2,
        remark: '删除车辆备案信息'
      },
      operatorId,
      operatorName
    )

    if (vehicle.driverId) {
      const tempVehicle = { ...vehicle.toJSON(), auditStatus: 2 }
      await syncDriverOrderPermission(tempVehicle, Driver, DriverAuditLog, operatorId, operatorName)
    }

    await vehicle.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, remark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const oldStatus = vehicle.status
    await vehicle.update({ status })

    const operationType = status === 4 ? 7 : status === 0 ? 8 : 2
    await createAuditLog(
      vehicle,
      operationType,
      {
        oldStatus,
        newStatus: status,
        remark: remark || `车辆状态变更为${status === 0 ? '空闲' : status === 1 ? '运营中' : status === 2 ? '维修中' : status === 3 ? '已报废' : '已锁定'}`
      },
      operatorId,
      operatorName
    )

    if (vehicle.driverId) {
      await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
    }

    res.json(success(null, '状态更新成功'))
  } catch (error) {
    next(error)
  }
}

const audit = async (req, res, next) => {
  try {
    const { id } = req.params
    const { auditStatus, remark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const oldAuditStatus = vehicle.auditStatus
    const now = new Date()

    await vehicle.update({
      auditStatus,
      auditRemark: remark,
      auditTime: now,
      auditorId: operatorId
    })

    const operationType = auditStatus === 1 ? 3 : auditStatus === 2 ? 4 : auditStatus === 3 ? 6 : 9
    await createAuditLog(
      vehicle,
      operationType,
      {
        oldAuditStatus,
        newAuditStatus: auditStatus,
        remark: remark || (auditStatus === 1 ? '车辆备案审核通过' : auditStatus === 2 ? '车辆备案审核驳回' : auditStatus === 3 ? '车辆备案已过期' : '车辆资料需复核')
      },
      operatorId,
      operatorName
    )

    if (vehicle.driverId) {
      await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
    }

    res.json(success(null, '审核成功'))
  } catch (error) {
    next(error)
  }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    const where = { vehicleId }

    const { count, rows } = await VehicleAuditLog.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const batchImport = async (req, res, next) => {
  try {
    const { vehicles } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = {
      success: [],
      failed: [],
      warnings: [],
      total: vehicles.length
    }

    const requiredFields = ['plateNumber', 'vin', 'brand', 'model', 'color', 'seats', 'drivingLicenseDate', 'inspectionDate', 'insuranceDate']
    const templateFields = ['plateNumber', 'vin', 'engineNo', 'brand', 'model', 'color', 'capacityType', 'seats', 'displacement', 'emissionStandard', 'vehicleType', 'registrationDate', 'drivingLicenseDate', 'inspectionDate', 'insuranceDate', 'city', 'driverName']

    for (let i = 0; i < vehicles.length; i++) {
      const vehicleData = vehicles[i]
      const rowNum = i + 2

      const templateErrors = []
      requiredFields.forEach(field => {
        if (!vehicleData[field] || vehicleData[field].toString().trim() === '') {
          templateErrors.push(`缺少必填字段：${field}`)
        }
      })

      Object.keys(vehicleData).forEach(field => {
        if (!templateFields.includes(field)) {
          templateErrors.push(`未知字段：${field}`)
        }
      })

      if (templateErrors.length > 0) {
        results.failed.push({
          row: rowNum,
          data: vehicleData,
          errors: templateErrors,
          type: 'template_error'
        })
        continue
      }

      try {
        const validationResult = await validateVehicle(vehicleData)
        
        if (validationResult.risks.some(r => r.level === 'high')) {
          results.failed.push({
            row: rowNum,
            data: vehicleData,
            errors: validationResult.failed.map(f => f.message),
            risks: validationResult.risks,
            type: 'high_risk'
          })
          continue
        }

        if (!validationResult.valid) {
          results.failed.push({
            row: rowNum,
            data: vehicleData,
            errors: validationResult.failed.map(f => f.message),
            type: 'validation_error'
          })
          continue
        }

        if (validationResult.warnings.length > 0) {
          results.warnings.push({
            row: rowNum,
            plateNumber: vehicleData.plateNumber,
            warnings: validationResult.warnings.map(w => w.message)
          })
        }

        const levelResult = calculateOperationLevel(vehicleData)
        
        const createData = {
          ...vehicleData,
          operationLevel: levelResult.level,
          orderScope: levelResult.orderScope,
          premiumPermission: levelResult.premiumPermission,
          operationTimeLimit: levelResult.operationTimeLimit,
          validationResult,
          riskLevel: validationResult.risks.some(r => r.level === 'high') ? 3 : 
                     validationResult.risks.some(r => r.level === 'medium') ? 2 : 1,
          auditStatus: 0
        }

        if (createData.plateNumber) {
          createData.plateNumber = createData.plateNumber.toUpperCase().replace(/\s/g, '')
        }
        if (createData.vin) {
          createData.vin = createData.vin.toUpperCase().replace(/\s/g, '')
        }
        if (createData.engineNo) {
          createData.engineNo = createData.engineNo.toUpperCase().replace(/\s/g, '')
        }

        const vehicle = await Vehicle.create(createData)

        await createAuditLog(
          vehicle,
          1,
          {
            remark: '批量导入新增备案',
            validationResult,
            newOperationLevel: levelResult.level
          },
          operatorId,
          operatorName
        )

        results.success.push({
          row: rowNum,
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
          level: levelResult.levelName,
          score: levelResult.totalScore
        })
      } catch (error) {
        results.failed.push({
          row: rowNum,
          data: vehicleData,
          errors: [error.message],
          type: 'system_error'
        })
      }
    }

    res.json(success(results, `批量导入完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const batchReview = async (req, res, next) => {
  try {
    const { ids, auditStatus, remark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = {
      success: [],
      failed: [],
      total: ids.length
    }

    for (const id of ids) {
      try {
        const vehicle = await Vehicle.findByPk(id)
        if (!vehicle) {
          results.failed.push({ id, error: '车辆不存在' })
          continue
        }

        if (vehicle.isLocked === 1) {
          results.failed.push({ id, plateNumber: vehicle.plateNumber, error: '车辆已锁定' })
          continue
        }

        const oldAuditStatus = vehicle.auditStatus
        await vehicle.update({
          auditStatus,
          auditRemark: remark,
          auditTime: new Date(),
          auditorId: operatorId
        })

        const operationType = auditStatus === 1 ? 3 : auditStatus === 2 ? 4 : 5
        await createAuditLog(
          vehicle,
          operationType,
          {
            oldAuditStatus,
            newAuditStatus: auditStatus,
            remark: remark || `批量复核${auditStatus === 1 ? '通过' : auditStatus === 2 ? '驳回' : '标记'}`
          },
          operatorId,
          operatorName
        )

        if (vehicle.driverId) {
          await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
        }

        results.success.push({ id, plateNumber: vehicle.plateNumber })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量复核完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const batchMarkExpired = async (req, res, next) => {
  try {
    const { filter, remark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const where = { auditStatus: 1 }
    
    if (filter?.city) where.city = filter.city
    if (filter?.capacityType) where.capacityType = filter.capacityType
    if (filter?.status !== undefined) where.status = filter.status

    const now = new Date()
    where[Op.or] = [
      { drivingLicenseDate: { [Op.lt]: now } },
      { inspectionDate: { [Op.lt]: now } },
      { insuranceDate: { [Op.lt]: now } }
    ]

    const vehicles = await Vehicle.findAll({ where })
    
    const results = {
      success: [],
      failed: [],
      total: vehicles.length
    }

    for (const vehicle of vehicles) {
      try {
        const oldAuditStatus = vehicle.auditStatus
        await vehicle.update({
          auditStatus: 3,
          auditRemark: remark || '证件已过期，自动标记',
          auditTime: now,
          auditorId: operatorId
        })

        await createAuditLog(
          vehicle,
          6,
          {
            oldAuditStatus,
            newAuditStatus: 3,
            remark: remark || '批量标记过期车辆'
          },
          operatorId,
          operatorName
        )

        if (vehicle.driverId) {
          await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
        }

        results.success.push({ id: vehicle.id, plateNumber: vehicle.plateNumber })
      } catch (error) {
        results.failed.push({ id: vehicle.id, plateNumber: vehicle.plateNumber, error: error.message })
      }
    }

    res.json(success(results, `批量标记完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const batchLock = async (req, res, next) => {
  try {
    const { ids, lockReason } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = {
      success: [],
      failed: [],
      total: ids.length
    }

    for (const id of ids) {
      try {
        const vehicle = await Vehicle.findByPk(id)
        if (!vehicle) {
          results.failed.push({ id, error: '车辆不存在' })
          continue
        }

        const oldStatus = vehicle.status
        await vehicle.update({
          isLocked: 1,
          lockReason,
          status: 4
        })

        await createAuditLog(
          vehicle,
          7,
          {
            oldStatus,
            newStatus: 4,
            remark: lockReason || '批量锁定异常车辆'
          },
          operatorId,
          operatorName
        )

        if (vehicle.driverId) {
          await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
        }

        results.success.push({ id, plateNumber: vehicle.plateNumber })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量锁定完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const getImportTemplate = async (req, res, next) => {
  try {
    const template = {
      fields: [
        { key: 'plateNumber', label: '车牌号', required: true, example: '京A12345', description: '7-8位车牌号，不含空格' },
        { key: 'vin', label: '车架号', required: true, example: 'LSVAM4183GC012345', description: '17位车辆识别代码，不含I/O/Q' },
        { key: 'engineNo', label: '发动机号', required: false, example: 'AB1234567', description: '6-20位发动机编号' },
        { key: 'brand', label: '品牌', required: true, example: '大众', description: '车辆品牌名称' },
        { key: 'model', label: '型号', required: true, example: '帕萨特', description: '车辆具体型号' },
        { key: 'color', label: '颜色', required: true, example: '黑色', description: '车身颜色' },
        { key: 'capacityType', label: '运力类型', required: true, example: '1', description: '1快车 2专车 3豪华车 4拼车 5出租车' },
        { key: 'seats', label: '座位数', required: true, example: '5', description: '2-9座' },
        { key: 'displacement', label: '排量', required: false, example: '1.8', description: '0.8-6.0L' },
        { key: 'emissionStandard', label: '排放标准', required: false, example: '5', description: '1国一 2国二 3国三 4国四 5国五 6国六' },
        { key: 'vehicleType', label: '车辆类型', required: false, example: '轿车', description: '轿车 SUV 面包车 货车' },
        { key: 'registrationDate', label: '注册日期', required: false, example: '2020-01-15', description: 'YYYY-MM-DD格式' },
        { key: 'drivingLicenseDate', label: '行驶证有效期', required: true, example: '2026-12-31', description: 'YYYY-MM-DD格式' },
        { key: 'inspectionDate', label: '年检有效期', required: true, example: '2025-06-30', description: 'YYYY-MM-DD格式' },
        { key: 'insuranceDate', label: '保险有效期', required: true, example: '2025-12-31', description: 'YYYY-MM-DD格式' },
        { key: 'city', label: '备案城市', required: false, example: '北京', description: '车辆运营城市' },
        { key: 'driverName', label: '绑定司机', required: false, example: '张三', description: '司机姓名（可选）' }
      ],
      example: {
        plateNumber: '京A12345',
        vin: 'LSVAM4183GC012345',
        engineNo: 'AB1234567',
        brand: '大众',
        model: '帕萨特',
        color: '黑色',
        capacityType: '1',
        seats: '5',
        displacement: '1.8',
        emissionStandard: '5',
        vehicleType: '轿车',
        registrationDate: '2020-01-15',
        drivingLicenseDate: '2026-12-31',
        inspectionDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        city: '北京',
        driverName: '张三'
      }
    }

    res.json(success(template))
  } catch (error) {
    next(error)
  }
}

const recalculateLevel = async (req, res, next) => {
  try {
    const { id } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const levelResult = calculateOperationLevel(vehicle)
    const oldOperationLevel = vehicle.operationLevel

    if (oldOperationLevel !== levelResult.level) {
      await vehicle.update({
        operationLevel: levelResult.level,
        orderScope: levelResult.orderScope,
        premiumPermission: levelResult.premiumPermission,
        operationTimeLimit: levelResult.operationTimeLimit
      })

      await createAuditLog(
        vehicle,
        9,
        {
          oldOperationLevel,
          newOperationLevel: levelResult.level,
          remark: '重新计算运营等级'
        },
        operatorId,
        operatorName
      )

      if (vehicle.driverId) {
        await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
      }
    }

    res.json(success({
      level: levelResult.level,
      levelName: levelResult.levelName,
      totalScore: levelResult.totalScore,
      breakdown: levelResult.breakdown,
      privileges: getLevelPrivileges(levelResult.level),
      levelChanged: oldOperationLevel !== levelResult.level
    }))
  } catch (error) {
    next(error)
  }
}

const changeOperationStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { operationStatus, bannedType, bannedReason, bannedExpireDate, remark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const oldOperationStatus = vehicle.operationStatus

    const validation = await validateStatusChange(vehicle, operationStatus, operatorId, operatorName)
    if (!validation.valid) {
      throw new AppError(`运营状态变更校验不通过：${validation.errors.join('; ')}`, 400, 400)
    }

    const anomalyResult = await checkAbnormalStatus(vehicle, operationStatus, oldOperationStatus)

    const updateData = { operationStatus }
    if (operationStatus === 4) {
      if (bannedType !== undefined) updateData.bannedType = bannedType
      if (bannedReason !== undefined) updateData.bannedReason = bannedReason
      if (bannedExpireDate !== undefined) updateData.bannedExpireDate = bannedExpireDate
    }
    if (operationStatus === 1) {
      updateData.bannedType = 0
    }

    await vehicle.update(updateData)

    await VehicleStatusLog.create({
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      changeType: 1,
      oldOperationStatus,
      newOperationStatus: operationStatus,
      triggerType: 1,
      triggerReason: remark || '手动变更运营状态',
      validationResults: validation,
      maintenanceCheck: validation.checks.maintenance,
      documentCheck: validation.checks.documents,
      violationCheck: validation.checks.violations,
      alertLevel: anomalyResult.alertLevel,
      alertMessage: anomalyResult.alertMessage,
      isAnomaly: anomalyResult.isAnomaly ? 1 : 0,
      anomalyType: anomalyResult.anomalyType,
      remark: remark || '',
      operatorId,
      operatorName
    })

    if (anomalyResult.isAnomaly) {
      await VehicleStatusLog.create({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        changeType: 6,
        oldOperationStatus,
        newOperationStatus: operationStatus,
        triggerType: 1,
        triggerReason: `异常拦截：${anomalyResult.alertMessage}`,
        alertLevel: anomalyResult.alertLevel,
        alertMessage: anomalyResult.alertMessage,
        isAnomaly: 1,
        anomalyType: anomalyResult.anomalyType,
        remark: '系统自动记录异常拦截',
        operatorId,
        operatorName
      })
    }

    const capacityResult = syncCapacityAndSchedule(vehicle, oldOperationStatus, operationStatus)

    if (vehicle.driverId) {
      await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
    }

    res.json(success({
      validation,
      anomalyDetected: anomalyResult.isAnomaly,
      anomalyResult,
      capacityImpact: capacityResult.capacityImpact,
      scheduleImpact: capacityResult.scheduleImpact
    }, '运营状态变更成功'))
  } catch (error) {
    next(error)
  }
}

const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const { page = 1, pageSize = 10, maintenanceType, maintenanceStatus } = req.query

    const where = { vehicleId }
    if (maintenanceType !== undefined && maintenanceType !== '') where.maintenanceType = maintenanceType
    if (maintenanceStatus !== undefined && maintenanceStatus !== '') where.maintenanceStatus = maintenanceStatus

    const { count, rows } = await VehicleMaintenance.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const createMaintenanceRecord = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(vehicleId)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const data = {
      ...req.body,
      vehicleId,
      plateNumber: vehicle.plateNumber,
      operatorId,
      operatorName
    }

    const record = await VehicleMaintenance.create(data)

    if (data.maintenanceStatus === 0 || data.maintenanceStatus === 1) {
      const oldOperationStatus = vehicle.operationStatus
      await vehicle.update({ operationStatus: 2 })

      await VehicleStatusLog.create({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        changeType: 2,
        oldOperationStatus,
        newOperationStatus: 2,
        triggerType: 1,
        triggerReason: `发起检修：${record.maintenanceType}`,
        maintenanceCheck: { maintenanceId: record.id, maintenanceType: record.maintenanceType, maintenanceStatus: record.maintenanceStatus },
        remark: '发起检修，车辆进入停运检修状态',
        operatorId,
        operatorName
      })
    }

    res.json(success(record, '检修记录创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateMaintenanceRecord = async (req, res, next) => {
  try {
    const { id, recordId } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const record = await VehicleMaintenance.findByPk(recordId)
    if (!record) throw new AppError('检修记录不存在', 404, 404)

    const oldStatus = record.maintenanceStatus
    await record.update(req.body)

    if (req.body.maintenanceStatus === 2 && oldStatus !== 2) {
      const vehicle = await Vehicle.findByPk(record.vehicleId)
      if (vehicle) {
        const updateData = {
          lastMaintenanceMileage: record.mileageAtMaintenance || vehicle.mileage,
          lastMaintenanceDate: record.endDate || new Date(),
          nextMaintenanceDate: record.nextMaintenanceDate
        }

        const warningResult = determineMaintenanceWarning({ ...vehicle.toJSON(), ...updateData })
        updateData.maintenanceWarningLevel = warningResult.level

        await vehicle.update(updateData)

        const otherPending = await VehicleMaintenance.count({
          where: {
            vehicleId: vehicle.id,
            maintenanceStatus: { [Op.in]: [0, 1] },
            id: { [Op.ne]: recordId }
          }
        })

        if (otherPending === 0) {
          const autoResult = await autoDetermineOperationStatus(vehicle)
          if (autoResult.status !== vehicle.operationStatus) {
            const oldOpStatus = vehicle.operationStatus
            await vehicle.update({ operationStatus: autoResult.status })

            await VehicleStatusLog.create({
              vehicleId: vehicle.id,
              plateNumber: vehicle.plateNumber,
              changeType: 2,
              oldOperationStatus: oldOpStatus,
              newOperationStatus: autoResult.status,
              triggerType: 2,
              triggerReason: `检修完成，自动判定运营状态：${autoResult.reasons.join('; ')}`,
              remark: '检修完成，系统自动判定运营状态',
              operatorId,
              operatorName
            })
          }
        }
      }
    }

    res.json(success(record, '检修记录更新成功'))
  } catch (error) {
    next(error)
  }
}

const getViolationRecords = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const { page = 1, pageSize = 10, violationType, violationStatus } = req.query

    const where = { vehicleId }
    if (violationType !== undefined && violationType !== '') where.violationType = violationType
    if (violationStatus !== undefined && violationStatus !== '') where.violationStatus = violationStatus

    const { count, rows } = await VehicleViolation.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const createViolationRecord = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(vehicleId)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const data = {
      ...req.body,
      vehicleId,
      plateNumber: vehicle.plateNumber,
      operatorId,
      operatorName
    }

    const record = await VehicleViolation.create(data)

    await vehicle.update({ violationCount: vehicle.violationCount + 1 })

    if (data.penaltyType === 4 || data.penaltyType === 5) {
      const oldOperationStatus = vehicle.operationStatus
      const bannedType = data.penaltyType === 5 ? 2 : 1
      await vehicle.update({
        operationStatus: 4,
        bannedType,
        bannedReason: data.description || `违规处罚：${data.violationType}`
      })

      await VehicleStatusLog.create({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        changeType: 3,
        oldOperationStatus,
        newOperationStatus: 4,
        triggerType: 1,
        triggerReason: `违规处罚：${data.penaltyType === 5 ? '永久封禁' : '临时封禁'}`,
        violationCheck: { violationId: record.id, violationType: data.violationType, penaltyType: data.penaltyType },
        remark: '违规处罚，车辆进入封禁状态',
        operatorId,
        operatorName
      })

      if (vehicle.driverId) {
        await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
      }
    }

    res.json(success(record, '违规记录创建成功'))
  } catch (error) {
    next(error)
  }
}

const getStatusLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const { page = 1, pageSize = 10, changeType, triggerType, alertLevel, isAnomaly } = req.query

    const where = { vehicleId }
    if (changeType !== undefined && changeType !== '') where.changeType = changeType
    if (triggerType !== undefined && triggerType !== '') where.triggerType = triggerType
    if (alertLevel !== undefined && alertLevel !== '') where.alertLevel = alertLevel
    if (isAnomaly !== undefined && isAnomaly !== '') where.isAnomaly = isAnomaly

    const { count, rows } = await VehicleStatusLog.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const batchRestoreOperation = async (req, res, next) => {
  try {
    const { ids } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = { success: [], failed: [], total: ids.length }

    for (const id of ids) {
      try {
        const vehicle = await Vehicle.findByPk(id)
        if (!vehicle) {
          results.failed.push({ id, error: '车辆不存在' })
          continue
        }

        if (vehicle.bannedType === 2) {
          results.failed.push({ id, plateNumber: vehicle.plateNumber, error: '车辆已被永久封禁，禁止恢复' })
          continue
        }

        const validation = await validateStatusChange(vehicle, 1, operatorId, operatorName)
        if (!validation.valid) {
          results.failed.push({ id, plateNumber: vehicle.plateNumber, error: validation.errors.join('; ') })
          continue
        }

        const oldOperationStatus = vehicle.operationStatus
        await vehicle.update({ operationStatus: 1, bannedType: 0 })

        await VehicleStatusLog.create({
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          changeType: 1,
          oldOperationStatus,
          newOperationStatus: 1,
          triggerType: 1,
          triggerReason: '批量恢复运营',
          validationResults: validation,
          remark: '批量恢复运营',
          operatorId,
          operatorName
        })

        if (vehicle.driverId) {
          await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
        }

        results.success.push({ id, plateNumber: vehicle.plateNumber })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量恢复运营完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const batchInitiateMaintenance = async (req, res, next) => {
  try {
    const { ids, maintenanceType, maintenanceItems, maintenanceStation, remark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = { success: [], failed: [], total: ids.length }

    for (const id of ids) {
      try {
        const vehicle = await Vehicle.findByPk(id)
        if (!vehicle) {
          results.failed.push({ id, error: '车辆不存在' })
          continue
        }

        const record = await VehicleMaintenance.create({
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          maintenanceType: maintenanceType || 1,
          maintenanceStatus: 0,
          maintenanceItems: maintenanceItems || [],
          maintenanceStation: maintenanceStation || '',
          remark: remark || '批量发起检修',
          operatorId,
          operatorName
        })

        const oldOperationStatus = vehicle.operationStatus
        await vehicle.update({ operationStatus: 2 })

        await VehicleStatusLog.create({
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          changeType: 2,
          oldOperationStatus,
          newOperationStatus: 2,
          triggerType: 1,
          triggerReason: '批量发起检修',
          maintenanceCheck: { maintenanceId: record.id, maintenanceType: record.maintenanceType },
          remark: '批量发起检修，车辆进入停运检修状态',
          operatorId,
          operatorName
        })

        results.success.push({ id, plateNumber: vehicle.plateNumber, maintenanceId: record.id })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量发起检修完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const batchRemindRenewal = async (req, res, next) => {
  try {
    const { ids } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = { success: [], failed: [], total: ids.length }
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    for (const id of ids) {
      try {
        const vehicle = await Vehicle.findByPk(id)
        if (!vehicle) {
          results.failed.push({ id, error: '车辆不存在' })
          continue
        }

        const expiringDocs = []
        if (vehicle.drivingLicenseDate && new Date(vehicle.drivingLicenseDate) <= thirtyDaysLater && new Date(vehicle.drivingLicenseDate) > now) {
          expiringDocs.push('行驶证')
        }
        if (vehicle.inspectionDate && new Date(vehicle.inspectionDate) <= thirtyDaysLater && new Date(vehicle.inspectionDate) > now) {
          expiringDocs.push('年检')
        }
        if (vehicle.insuranceDate && new Date(vehicle.insuranceDate) <= thirtyDaysLater && new Date(vehicle.insuranceDate) > now) {
          expiringDocs.push('保险')
        }

        if (expiringDocs.length === 0) {
          results.failed.push({ id, plateNumber: vehicle.plateNumber, error: '无即将过期的证件' })
          continue
        }

        await VehicleStatusLog.create({
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          changeType: 5,
          triggerType: 1,
          triggerReason: `批量提醒换证：${expiringDocs.join('、')}即将到期`,
          documentCheck: { expiringDocs },
          alertLevel: 1,
          alertMessage: `${expiringDocs.join('、')}即将到期，请及时换证`,
          remark: '批量提醒换证',
          operatorId,
          operatorName
        })

        results.success.push({ id, plateNumber: vehicle.plateNumber, expiringDocs })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量提醒换证完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const autoCheckStatus = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({ where: { operationStatus: 1 } })

    const summary = {
      totalChecked: vehicles.length,
      statusChanged: [],
      warningUpdated: []
    }

    for (const vehicle of vehicles) {
      try {
        const autoResult = await autoDetermineOperationStatus(vehicle)

        if (autoResult.status !== vehicle.operationStatus) {
          const oldOperationStatus = vehicle.operationStatus
          await vehicle.update({ operationStatus: autoResult.status })

          await VehicleStatusLog.create({
            vehicleId: vehicle.id,
            plateNumber: vehicle.plateNumber,
            changeType: 7,
            oldOperationStatus,
            newOperationStatus: autoResult.status,
            triggerType: 3,
            triggerReason: autoResult.reasons.join('; '),
            remark: '定时任务自动判定运营状态',
            operatorId: null,
            operatorName: '系统'
          })

          summary.statusChanged.push({
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            from: oldOperationStatus,
            to: autoResult.status,
            reasons: autoResult.reasons
          })
        }

        const warningResult = determineMaintenanceWarning(vehicle)
        if (warningResult.level !== vehicle.maintenanceWarningLevel) {
          await vehicle.update({ maintenanceWarningLevel: warningResult.level })
          summary.warningUpdated.push({
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            from: vehicle.maintenanceWarningLevel,
            to: warningResult.level,
            message: warningResult.message
          })
        }
      } catch (error) {
        summary.statusChanged.push({
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
          error: error.message
        })
      }
    }

    res.json(success(summary, `自动检查完成：共检查${summary.totalChecked}辆，状态变更${summary.statusChanged.filter(s => !s.error).length}辆`))
  } catch (error) {
    next(error)
  }
}

const getCapacityDashboard = async (req, res, next) => {
  try {
    const allVehicles = await Vehicle.findAll({
      attributes: ['city', 'capacityType', 'operationStatus']
    })

    const total = allVehicles.length
    const normal = allVehicles.filter(v => v.operationStatus === 1).length
    const maintenance = allVehicles.filter(v => v.operationStatus === 2).length
    const expired = allVehicles.filter(v => v.operationStatus === 3).length
    const banned = allVehicles.filter(v => v.operationStatus === 4).length

    const groupMap = {}
    for (const v of allVehicles) {
      const key = `${v.city || '未知'}_${v.capacityType || '未知'}`
      if (!groupMap[key]) {
        groupMap[key] = {
          city: v.city || '未知',
          capacityType: v.capacityType || '未知',
          total: 0,
          normal: 0,
          maintenance: 0,
          expired: 0,
          banned: 0
        }
      }
      groupMap[key].total++
      if (v.operationStatus === 1) groupMap[key].normal++
      else if (v.operationStatus === 2) groupMap[key].maintenance++
      else if (v.operationStatus === 3) groupMap[key].expired++
      else if (v.operationStatus === 4) groupMap[key].banned++
    }

    res.json(success({
      total,
      normal,
      maintenance,
      expired,
      banned,
      groups: Object.values(groupMap)
    }))
  } catch (error) {
    next(error)
  }
}

const performCheck = async (req, res, next) => {
  try {
    const { id } = req.params
    const { checkType } = req.body || req.query
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(id)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const checkResult = await performComplianceCheck(vehicle, checkType)

    const checkRecord = await VehicleComplianceCheck.create({
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      checkType: checkType || 1,
      checkStatus: checkResult.passed ? 1 : 2,
      complianceLevel: checkResult.complianceLevel,
      complianceScore: checkResult.complianceScore,
      checkItems: checkResult.checkItems,
      issues: checkResult.issues,
      warnings: checkResult.warnings,
      fakeComplianceDetected: checkResult.fakeComplianceDetected ? 1 : 0,
      missedChecks: checkResult.missedChecks,
      operatorId,
      operatorName
    })

    const updateData = {
      complianceLevel: checkResult.complianceLevel,
      complianceScore: checkResult.complianceScore,
      lastComplianceCheckDate: new Date(),
      nextComplianceCheckDate: checkResult.nextCheckDate,
      complianceStatus: checkResult.passed ? 1 : 2,
      complianceWarning: checkResult.warnings && checkResult.warnings.length > 0 ? 1 : 0
    }

    if (checkResult.fakeComplianceDetected) {
      updateData.fakeComplianceDetected = 1
      updateData.isLocked = 1
      updateData.status = 4
      updateData.lockReason = '虚假合规检测'
    }

    if (checkResult.complianceLevel === 'D' || (checkResult.issues && checkResult.issues.some(i => i.severity === 'major'))) {
      updateData.isLocked = 1
      updateData.status = 4
      if (!updateData.lockReason) {
        updateData.lockReason = '合规校验不通过'
      }
    }

    await vehicle.update(updateData)

    if (vehicle.driverId && (updateData.isLocked || updateData.complianceStatus !== vehicle.complianceStatus)) {
      await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
    }

    const auditType = checkResult.fakeComplianceDetected ? 25 : 21
    await createAuditLog(
      vehicle,
      auditType,
      {
        remark: checkResult.fakeComplianceDetected ? '虚假合规检测，车辆已锁定' : `合规校验完成，等级：${checkResult.complianceLevel}`,
        validationResult: checkResult
      },
      operatorId,
      operatorName
    )

    res.json(success({
      checkRecord,
      checkResult,
      vehicleUpdated: true
    }, '合规校验完成'))
  } catch (error) {
    next(error)
  }
}

const getComplianceChecks = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const { page = 1, pageSize = 10, checkType, checkStatus, complianceLevel } = req.query

    const where = { vehicleId }
    if (checkType !== undefined && checkType !== '') where.checkType = checkType
    if (checkStatus !== undefined && checkStatus !== '') where.checkStatus = checkStatus
    if (complianceLevel !== undefined && complianceLevel !== '') where.complianceLevel = complianceLevel

    const { count, rows } = await VehicleComplianceCheck.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const createRectification = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(vehicleId)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const data = {
      ...req.body,
      vehicleId,
      plateNumber: vehicle.plateNumber,
      rectificationStatus: 0,
      operatorId,
      operatorName
    }

    const record = await VehicleRectification.create(data)

    const rectificationCount = (vehicle.rectificationCount || 0) + 1
    const updateData = { rectificationCount }

    if (data.issueType && data.issueType === 'compliance') {
      updateData.complianceStatus = 3
    }

    await vehicle.update(updateData)

    await createAuditLog(
      vehicle,
      23,
      {
        remark: `创建合规整改记录：${data.description || '整改'}`
      },
      operatorId,
      operatorName
    )

    res.json(success(record, '整改记录创建成功'))
  } catch (error) {
    next(error)
  }
}

const getRectifications = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const { page = 1, pageSize = 10, rectificationStatus, issueType } = req.query

    const where = { vehicleId }
    if (rectificationStatus !== undefined && rectificationStatus !== '') where.rectificationStatus = rectificationStatus
    if (issueType !== undefined && issueType !== '') where.issueType = issueType

    const { count, rows } = await VehicleRectification.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const reviewRectification = async (req, res, next) => {
  try {
    const { id, rectId } = req.params
    const { reviewResult, reviewRemark } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const record = await VehicleRectification.findByPk(rectId)
    if (!record) throw new AppError('整改记录不存在', 404, 404)

    const vehicle = await Vehicle.findByPk(record.vehicleId)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const oldStatus = record.rectificationStatus
    const status = reviewResult === 'pass' ? 1 : 2

    await record.update({
      rectificationStatus: status,
      reviewResult,
      reviewRemark,
      reviewerId: operatorId,
      reviewerName: operatorName,
      reviewTime: new Date()
    })

    if (status === 1 && oldStatus !== 1) {
      const newCount = Math.max(0, (vehicle.rectificationCount || 0) - 1)
      const vehicleUpdate = { rectificationCount: newCount }

      if (newCount === 0 && vehicle.complianceStatus === 3) {
        vehicleUpdate.complianceStatus = 1
      }

      await vehicle.update(vehicleUpdate)

      if (vehicle.driverId) {
        await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
      }
    }

    res.json(success(record, '整改审核完成'))
  } catch (error) {
    next(error)
  }
}

const batchComplianceCheckHandler = async (req, res, next) => {
  try {
    const { ids, checkType } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = {
      total: ids.length,
      success: [],
      failed: [],
      results: []
    }

    for (const id of ids) {
      try {
        const vehicle = await Vehicle.findByPk(id)
        if (!vehicle) {
          results.failed.push({ id, error: '车辆不存在' })
          continue
        }

        const checkResult = await performComplianceCheck(vehicle, checkType)

        await VehicleComplianceCheck.create({
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          checkType: checkType || 1,
          checkStatus: checkResult.passed ? 1 : 2,
          complianceLevel: checkResult.complianceLevel,
          complianceScore: checkResult.complianceScore,
          checkItems: checkResult.checkItems,
          issues: checkResult.issues,
          warnings: checkResult.warnings,
          fakeComplianceDetected: checkResult.fakeComplianceDetected ? 1 : 0,
          missedChecks: checkResult.missedChecks,
          operatorId,
          operatorName
        })

        const updateData = {
          complianceLevel: checkResult.complianceLevel,
          complianceScore: checkResult.complianceScore,
          lastComplianceCheckDate: new Date(),
          nextComplianceCheckDate: checkResult.nextCheckDate,
          complianceStatus: checkResult.passed ? 1 : 2,
          complianceWarning: checkResult.warnings && checkResult.warnings.length > 0 ? 1 : 0
        }

        if (checkResult.fakeComplianceDetected) {
          updateData.fakeComplianceDetected = 1
          updateData.isLocked = 1
          updateData.status = 4
          updateData.lockReason = '虚假合规检测'
        }

        if (checkResult.complianceLevel === 'D' || (checkResult.issues && checkResult.issues.some(i => i.severity === 'major'))) {
          updateData.isLocked = 1
          updateData.status = 4
          if (!updateData.lockReason) {
            updateData.lockReason = '合规校验不通过'
          }
        }

        await vehicle.update(updateData)

        if (vehicle.driverId) {
          await syncDriverOrderPermission(vehicle, Driver, DriverAuditLog, operatorId, operatorName)
        }

        results.success.push({
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
          complianceLevel: checkResult.complianceLevel,
          complianceScore: checkResult.complianceScore,
          passed: checkResult.passed
        })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量合规校验完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const batchRemindRectification = async (req, res, next) => {
  try {
    const { ids } = req.body
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const results = {
      total: ids.length,
      success: [],
      failed: []
    }

    for (const id of ids) {
      try {
        const record = await VehicleRectification.findByPk(id)
        if (!record) {
          results.failed.push({ id, error: '整改记录不存在' })
          continue
        }

        const remindCount = (record.remindCount || 0) + 1
        await record.update({ remindCount, lastRemindTime: new Date() })

        results.success.push({ id, remindCount })
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    res.json(success(results, `批量提醒完成：成功${results.success.length}条，失败${results.failed.length}条`))
  } catch (error) {
    next(error)
  }
}

const exportComplianceReport = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const operatorId = req.user?.id
    const operatorName = req.user?.name

    const vehicle = await Vehicle.findByPk(vehicleId)
    if (!vehicle) throw new AppError('车辆不存在', 404, 404)

    const report = await generateComplianceReport(vehicle)

    await createAuditLog(
      vehicle,
      24,
      {
        remark: '导出合规报告'
      },
      operatorId,
      operatorName
    )

    res.json(success(report, '报告生成成功'))
  } catch (error) {
    next(error)
  }
}

const getComplianceStandardsByCity = async (req, res, next) => {
  try {
    const { city } = req.query

    const cityTier = getCityTier(city)
    const standards = getComplianceStandards(cityTier)

    res.json(success({
      city,
      cityTier,
      standards
    }))
  } catch (error) {
    next(error)
  }
}

const validateComplianceField = async (req, res, next) => {
  try {
    const { field, value, vehicleId } = req.body

    const vehicle = vehicleId ? await Vehicle.findByPk(vehicleId) : null

    const result = calculateComplianceLevel([{ field, value, status: 'valid' }])

    const isHighlighted = result.level === 'D' || result.level === 'C'

    res.json(success({
      field,
      value,
      valid: true,
      highlighted: isHighlighted,
      status: isHighlighted ? 'warning' : 'normal',
      complianceLevel: result.level
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getDetail,
  checkPlate,
  checkVIN,
  validateVehicleData,
  create,
  update,
  delete: deleteVehicle,
  updateStatus,
  audit,
  getAuditLogs,
  batchImport,
  batchReview,
  batchMarkExpired,
  batchLock,
  getImportTemplate,
  recalculateLevel,
  changeOperationStatus,
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getViolationRecords,
  createViolationRecord,
  getStatusLogs,
  batchRestoreOperation,
  batchInitiateMaintenance,
  batchRemindRenewal,
  autoCheckStatus,
  getCapacityDashboard,
  performCheck,
  getComplianceChecks,
  createRectification,
  getRectifications,
  reviewRectification,
  batchComplianceCheck: batchComplianceCheckHandler,
  batchRemindRectification,
  exportComplianceReport,
  getComplianceStandardsByCity,
  validateComplianceField
}
