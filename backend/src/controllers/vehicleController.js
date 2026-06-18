const { Op } = require('sequelize')
const { Vehicle, VehicleAuditLog, Driver, DriverAuditLog } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const { validateVehicle, checkPlateUniqueness, checkVINUniqueness, validatePlateNumber, validateVIN } = require('../services/vehicleValidationService')
const { calculateOperationLevel, syncDriverOrderPermission, getLevelPrivileges } = require('../services/vehicleLevelService')

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
  12: '证件造假拦截'
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
  recalculateLevel
}
