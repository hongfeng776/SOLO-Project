import {
  DeviceWorkOrderRepository,
  DeviceArchiveRepository,
  UserRepository,
  OrganizationRepository
} from '../repositories';
import {
  WorkOrderType,
  WorkOrderStatus,
  MaintenanceLevel,
  AcceptanceStatus,
  TaskStatus,
  WorkOrderLogType,
  WarrantyStatus,
  WorkOrderTypeText,
  WorkOrderStatusText,
  MaintenanceLevelText,
  AcceptanceStatusText,
  TaskStatusText,
  WorkOrderLogTypeText,
  WarrantyStatusText,
  WORK_ORDER_TYPE_CONFIG,
  MAINTENANCE_FREQUENCY_CONFIG,
  type WorkOrderPreCheckRequest,
  type WorkOrderPreCheckResult,
  type CreateWorkOrderRequest,
  type WorkOrderQueryParams,
  type DeviceWorkOrderVO,
  type WorkOrderUpdateRequest,
  type WorkOrderBatchTaskRequest,
  type MaintenanceTaskQueryParams,
  type DeviceMaintenanceTaskVO,
  type DeviceWorkOrderLogVO,
  type WorkOrderTraceRequest,
  type WorkOrderTraceResult,
  type WorkOrderStatistics
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { DeviceWorkOrderLog, DeviceWorkOrder, DeviceMaintenanceTask, DeviceArchive, DeviceFaultRecord } from '../models';
import { DeviceTypeText } from '../types/onlinePayment';

const PriorityText: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
  4: '紧急'
};

export class DeviceWorkOrderService {
  private deviceWorkOrderRepository: DeviceWorkOrderRepository;
  private deviceArchiveRepository: DeviceArchiveRepository;
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.deviceWorkOrderRepository = new DeviceWorkOrderRepository();
    this.deviceArchiveRepository = new DeviceArchiveRepository();
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async getWorkOrderConfig(): Promise<any> {
    return {
      order_types: Object.entries(WORK_ORDER_TYPE_CONFIG).map(([value, config]) => ({
        value: Number(value),
        label: config.order_type_text,
        maintenance_level: config.maintenance_level,
        maintenance_level_text: config.maintenance_level_text,
        standard_process: config.standard_process,
        acceptance_standard: config.acceptance_standard,
        cost_calculation_rule: config.cost_calculation_rule,
        estimated_hours: config.estimated_hours,
        required_qualifications: config.required_qualifications
      })),
      maintenance_levels: Object.entries(MaintenanceLevelText).map(([value, label]) => ({ value: Number(value), label })),
      statuses: Object.entries(WorkOrderStatusText).map(([value, label]) => ({ value: Number(value), label })),
      acceptance_statuses: Object.entries(AcceptanceStatusText).map(([value, label]) => ({ value: Number(value), label })),
      task_statuses: Object.entries(TaskStatusText).map(([value, label]) => ({ value: Number(value), label })),
      log_types: Object.entries(WorkOrderLogTypeText).map(([value, label]) => ({ value: Number(value), label })),
      warranty_statuses: Object.entries(WarrantyStatusText).map(([value, label]) => ({ value: Number(value), label })),
      priorities: Object.entries(PriorityText).map(([value, label]) => ({ value: Number(value), label })),
      maintenance_frequency_config: MAINTENANCE_FREQUENCY_CONFIG
    };
  }

  async preCheckWorkOrder(request: WorkOrderPreCheckRequest): Promise<WorkOrderPreCheckResult> {
    const { archive_no, sn_code, order_type, operator_id } = request;
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';

    if (!archive_no && !sn_code) {
      throwValidationError('设备档案号或SN码不能为空');
    }

    let device: DeviceArchive | null = null;
    if (archive_no) {
      device = await this.deviceArchiveRepository.findByArchiveNo(archive_no);
    } else if (sn_code) {
      device = await this.deviceArchiveRepository.findBySnCode(sn_code);
    }

    let faultChecked = false;
    let hasActiveFault = false;
    let faultDescription: string | undefined;

    let permissionChecked = false;
    let hasPermission = true;

    let qualificationChecked = false;
    let hasValidQualification = true;
    const missingQualifications: string[] = [];

    let warrantyChecked = false;
    let warrantyStatus: WarrantyStatus = 0;
    let warrantyExpireDate: string | undefined;

    let bannedChecked = false;
    let isBanned = false;
    let banReason: string | undefined;

    let normalDeviceBlocked = false;
    let normalDeviceDetail: string | undefined;

    const orderTypeConfig = WORK_ORDER_TYPE_CONFIG[order_type];

    if (!device) {
      blocked = true;
      blockReason = '设备档案不存在';
      warnings.push('设备档案不存在');
    } else {
      const deviceData = device.toJSON();

      faultChecked = true;
      const activeFaults = await DeviceFaultRecord.findAll({
        where: {
          archive_no: deviceData.archive_no,
          fault_status: { [Op.in]: [0, 1] }
        }
      });
      if (activeFaults.length > 0) {
        hasActiveFault = true;
        faultDescription = activeFaults.map(f => (f as any).fault_description || (f as any).fault_code).join('、');
        warnings.push(`设备存在${activeFaults.length}条未处理故障：${faultDescription}`);
      }

      permissionChecked = true;

      qualificationChecked = true;
      if (orderTypeConfig && orderTypeConfig.required_qualifications.length > 0) {
        missingQualifications.push(...orderTypeConfig.required_qualifications);
        hasValidQualification = false;
        warnings.push(`该工单类型需要资质：${orderTypeConfig.required_qualifications.join('、')}，请确认处理人持有有效资质`);
      }

      const warrantyResult = this.calcWarrantyStatus(deviceData);
      warrantyChecked = true;
      warrantyStatus = warrantyResult.status;
      warrantyExpireDate = warrantyResult.expire_date;
      if (warrantyStatus === 2) {
        warnings.push('设备保修即将到期，请尽快处理');
      } else if (warrantyStatus === 0) {
        warnings.push('设备已不在保修期，可能产生额外费用');
      }

      bannedChecked = true;
      if (deviceData.status === 0 || deviceData.status === 3) {
        isBanned = true;
        banReason = deviceData.status === 0 ? '设备已停用' : '设备已报废';
        blocked = true;
        blockReason = banReason;
        warnings.push(banReason);
      }

      if (order_type === 2 && !hasActiveFault && deviceData.status === 1) {
        normalDeviceBlocked = true;
        normalDeviceDetail = '设备运行正常，无未处理故障，建议使用日常保养或定期检修工单类型';
        warnings.push(normalDeviceDetail);
      }
    }

    return {
      passed: !blocked,
      blocked,
      block_reason: blockReason || undefined,
      warnings,
      fault_checked: faultChecked,
      has_active_fault: hasActiveFault,
      fault_description: faultDescription,
      permission_checked: permissionChecked,
      has_permission: hasPermission,
      qualification_checked: qualificationChecked,
      has_valid_qualification: hasValidQualification,
      missing_qualifications: missingQualifications,
      warranty_checked: warrantyChecked,
      warranty_status: warrantyStatus,
      warranty_status_text: WarrantyStatusText[warrantyStatus] || '未知',
      warranty_expire_date: warrantyExpireDate,
      banned_checked: bannedChecked,
      is_banned: isBanned,
      ban_reason: banReason,
      normal_device_blocked: normalDeviceBlocked,
      normal_device_detail: normalDeviceDetail,
      order_type_config: orderTypeConfig
    };
  }

  async getWorkOrderList(params: WorkOrderQueryParams, currentUserId?: string, userOrgId?: string): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceWorkOrderRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.deviceWorkOrderRepository.getOrganizationInclude(),
      this.deviceWorkOrderRepository.getCreatorInclude(),
      this.deviceWorkOrderRepository.getAssigneeInclude(),
      this.deviceWorkOrderRepository.getAcceptanceUserInclude()
    ];

    const result = await this.deviceWorkOrderRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: DeviceWorkOrderVO[] = result.list.map(o => this.convertWorkOrderToVO(o));

    return { ...result, list };
  }

  async getWorkOrderStatistics(params?: any): Promise<WorkOrderStatistics> {
    const where: any = params?.org_id ? { org_id: params.org_id } : {};

    const totalCount = await this.deviceWorkOrderRepository.count(where);
    const pendingCount = await this.deviceWorkOrderRepository.count({ ...where, status: 1 });
    const processingCount = await this.deviceWorkOrderRepository.count({ ...where, status: { [Op.in]: [2, 3] } });
    const acceptanceCount = await this.deviceWorkOrderRepository.count({ ...where, status: 4 });
    const completedCount = await this.deviceWorkOrderRepository.count({ ...where, status: 5 });
    const cancelledCount = await this.deviceWorkOrderRepository.count({ ...where, status: 6 });
    const overdueCount = await this.deviceWorkOrderRepository.count({ ...where, is_overdue: 1 });

    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayCreatedCount = await this.deviceWorkOrderRepository.count({
      ...where,
      created_at: { [Op.between]: [todayStart, todayEnd] }
    });

    const todayCompletedCount = await this.deviceWorkOrderRepository.count({
      ...where,
      status: 5,
      actual_finish_time: { [Op.between]: [todayStart, todayEnd] }
    });

    const completedOrders = await this.deviceWorkOrderRepository.findByWhere({
      ...where,
      status: 5,
      actual_finish_time: { [Op.not]: null },
      created_at: { [Op.not]: null }
    });

    let avgProcessingHours = 0;
    if (completedOrders.length > 0) {
      const totalHours = completedOrders.reduce((sum, order) => {
        const data = (order as any).toJSON ? (order as any).toJSON() : order;
        if (data.created_at && data.actual_finish_time) {
          const diff = dayjs(data.actual_finish_time).diff(dayjs(data.created_at), 'hour');
          return sum + diff;
        }
        return sum;
      }, 0);
      avgProcessingHours = Number((totalHours / completedOrders.length).toFixed(2));
    }

    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();

    const monthlyOrders = await this.deviceWorkOrderRepository.findByWhere({
      ...where,
      status: 5,
      actual_finish_time: { [Op.between]: [monthStart, monthEnd] }
    });

    let monthlyCost = 0;
    monthlyOrders.forEach(order => {
      const data = (order as any).toJSON ? (order as any).toJSON() : order;
      if (data.cost_actual) {
        monthlyCost += Number(data.cost_actual);
      }
    });
    monthlyCost = Number(monthlyCost.toFixed(2));

    const typeDistribution: Record<number, number> = {};
    for (let i = 1; i <= 4; i++) {
      typeDistribution[i] = await this.deviceWorkOrderRepository.count({ ...where, order_type: i });
    }

    return {
      total_count: totalCount,
      pending_count: pendingCount,
      processing_count: processingCount,
      acceptance_count: acceptanceCount,
      completed_count: completedCount,
      cancelled_count: cancelledCount,
      overdue_count: overdueCount,
      today_created_count: todayCreatedCount,
      today_completed_count: todayCompletedCount,
      avg_processing_hours: avgProcessingHours,
      monthly_cost: monthlyCost,
      type_distribution: typeDistribution
    };
  }

  async getWorkOrderById(id: string): Promise<DeviceWorkOrderVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的工单ID');
    }

    const order = await this.deviceWorkOrderRepository.findById(id, {
      include: [
        this.deviceWorkOrderRepository.getOrganizationInclude(),
        this.deviceWorkOrderRepository.getCreatorInclude(),
        this.deviceWorkOrderRepository.getAssigneeInclude(),
        this.deviceWorkOrderRepository.getAcceptanceUserInclude(),
        this.deviceWorkOrderRepository.getLogsInclude()
      ]
    });

    if (!order) {
      throwNotFoundError('工单不存在');
    }

    return this.convertWorkOrderToVO(order);
  }

  async createWorkOrder(request: CreateWorkOrderRequest, operatorId: string, operatorName: string): Promise<DeviceWorkOrderVO> {
    const preCheckResult = await this.preCheckWorkOrder({
      archive_no: request.archive_no,
      sn_code: request.sn_code,
      order_type: request.order_type,
      operator_id: operatorId
    });

    if (preCheckResult.blocked) {
      throwBusinessError(preCheckResult.block_reason || '前置校验未通过');
    }

    const orderNo = await this.deviceWorkOrderRepository.generateOrderNo();

    const typeConfig = WORK_ORDER_TYPE_CONFIG[request.order_type];
    const maintenanceLevel = request.maintenance_level || typeConfig?.maintenance_level || 1;

    let device: DeviceArchive | null = null;
    if (request.archive_no) {
      device = await this.deviceArchiveRepository.findByArchiveNo(request.archive_no);
    } else if (request.sn_code) {
      device = await this.deviceArchiveRepository.findBySnCode(request.sn_code);
    }

    const deviceData = device ? (device as any).toJSON() : {};
    const warrantyStatus = preCheckResult.warranty_status;

    const order = await this.deviceWorkOrderRepository.create({
      order_no: orderNo,
      archive_no: request.archive_no,
      sn_code: request.sn_code,
      device_type: request.device_type,
      device_model: deviceData.device_model || '',
      manufacturer: deviceData.manufacturer || '',
      order_type: request.order_type,
      maintenance_level: maintenanceLevel,
      status: 1,
      fault_description: request.fault_description,
      fault_code: request.fault_code,
      acceptance_status: 0,
      assignee_id: request.assignee_id,
      assignee_name: request.assignee_name,
      creator_id: operatorId,
      creator_name: operatorName,
      org_id: request.org_id,
      org_name: deviceData.org_name,
      install_location: deviceData.install_location,
      priority: request.priority || 2,
      expected_finish_time: request.expected_finish_time ? dayjs(request.expected_finish_time).toDate() : undefined,
      cost_estimate: request.cost_estimate,
      is_overdue: 0,
      warranty_status: warrantyStatus,
      remark: request.remark
    } as any);

    await DeviceWorkOrderLog.create({
      order_id: order.id,
      order_no: orderNo,
      log_type: 1,
      before_status: 0,
      after_status: 1,
      operation_detail: JSON.stringify({
        order_type: request.order_type,
        maintenance_level: maintenanceLevel,
        archive_no: request.archive_no,
        sn_code: request.sn_code
      }),
      operator_id: operatorId,
      operator_name: operatorName,
      operation_remark: '工单创建'
    } as any);

    return this.getWorkOrderById(order.id);
  }

  async updateWorkOrder(request: WorkOrderUpdateRequest, operatorId: string, operatorName: string): Promise<DeviceWorkOrderVO> {
    if (!isValidId(request.id)) {
      throwValidationError('无效的工单ID');
    }

    const order = await this.deviceWorkOrderRepository.findById(request.id);
    if (!order) {
      throwNotFoundError('工单不存在');
    }

    const orderData = (order as any).toJSON();
    const beforeStatus = orderData.status as WorkOrderStatus;
    const afterStatus = request.status;

    const updateData: any = {};

    if (request.status !== undefined) {
      updateData.status = request.status;
    }

    if (request.maintenance_content !== undefined) {
      updateData.maintenance_content = request.maintenance_content;
    }

    if (request.maintenance_result !== undefined) {
      updateData.maintenance_result = request.maintenance_result;
    }

    if (request.acceptance_status !== undefined) {
      updateData.acceptance_status = request.acceptance_status;
      updateData.acceptance_remark = request.acceptance_remark;
      if (request.acceptance_status === 1 || request.acceptance_status === 2) {
        updateData.acceptance_time = new Date();
        updateData.acceptance_by = operatorId;
        updateData.acceptance_by_name = operatorName;
      }
    }

    if (request.cost_actual !== undefined) {
      updateData.cost_actual = request.cost_actual;
    }

    if (request.used_parts !== undefined) {
      updateData.used_parts = request.used_parts;
    }

    if (request.maintenance_hours !== undefined) {
      updateData.maintenance_hours = request.maintenance_hours;
    }

    if (request.assignee_id !== undefined) {
      updateData.assignee_id = request.assignee_id;
      updateData.assignee_name = request.assignee_name;
    }

    if (request.remark !== undefined) {
      updateData.remark = request.remark;
    }

    if (afterStatus === 5) {
      updateData.actual_finish_time = new Date();
      if (!updateData.cost_actual && orderData.cost_estimate) {
        updateData.cost_actual = orderData.cost_estimate;
      }
    }

    await this.deviceWorkOrderRepository.update(request.id, updateData);

    let logType: WorkOrderLogType = 1;
    if (afterStatus === 1 && beforeStatus !== 1) {
      logType = 1;
    } else if (afterStatus === 2 && beforeStatus !== 2) {
      logType = 2;
    } else if (afterStatus === 3 && beforeStatus !== 3) {
      logType = 3;
    } else if (afterStatus === 4 && beforeStatus !== 4) {
      logType = 4;
    } else if (afterStatus === 5 && beforeStatus !== 5) {
      logType = 5;
    } else if (afterStatus === 6 && beforeStatus !== 6) {
      logType = 7;
    }

    if (request.acceptance_status === 1) {
      logType = 5;
    } else if (request.acceptance_status === 2) {
      logType = 6;
    }

    await DeviceWorkOrderLog.create({
      order_id: request.id,
      order_no: orderData.order_no,
      log_type: logType,
      before_status: beforeStatus,
      after_status: afterStatus,
      operation_detail: JSON.stringify({
        before_status: beforeStatus,
        after_status: afterStatus,
        acceptance_status: request.acceptance_status,
        maintenance_content: request.maintenance_content,
        maintenance_result: request.maintenance_result,
        cost_actual: request.cost_actual
      }),
      operator_id: operatorId,
      operator_name: operatorName,
      operation_remark: request.remark
    } as any);

    return this.getWorkOrderById(request.id);
  }

  async getMaintenanceTaskList(params: MaintenanceTaskQueryParams, currentUserId?: string, userOrgId?: string): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceWorkOrderRepository.buildTaskQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.deviceWorkOrderRepository.getTaskOrganizationInclude(),
      this.deviceWorkOrderRepository.getTaskCreatorInclude(),
      this.deviceWorkOrderRepository.getTaskAssigneeInclude()
    ];

    const { count, rows } = await DeviceMaintenanceTask.findAndCountAll({
      where,
      include,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']]
    });

    const list: DeviceMaintenanceTaskVO[] = rows.map(t => this.convertTaskToVO(t));

    return {
      list,
      total: count,
      page,
      pageSize
    };
  }

  async getMaintenanceTaskById(id: string): Promise<DeviceMaintenanceTaskVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的任务ID');
    }

    const task = await DeviceMaintenanceTask.findByPk(id, {
      include: [
        this.deviceWorkOrderRepository.getTaskOrganizationInclude(),
        this.deviceWorkOrderRepository.getTaskCreatorInclude(),
        this.deviceWorkOrderRepository.getTaskAssigneeInclude()
      ]
    });

    if (!task) {
      throwNotFoundError('运维任务不存在');
    }

    return this.convertTaskToVO(task);
  }

  async createBatchTask(request: WorkOrderBatchTaskRequest, operatorId: string, operatorName: string): Promise<DeviceMaintenanceTaskVO> {
    const {
      order_type,
      device_type,
      org_id,
      is_old_device,
      fault_frequency_min,
      min_usage_years,
      max_usage_years,
      start_date,
      end_date,
      priority,
      assignee_id,
      assignee_name,
      remark
    } = request;

    if (!start_date || !end_date) {
      throwValidationError('任务起止日期不能为空');
    }

    if (dayjs(start_date).isAfter(dayjs(end_date))) {
      throwValidationError('任务开始日期不能晚于结束日期');
    }

    const deviceWhere: any = {};
    if (device_type !== undefined) {
      deviceWhere.device_type = device_type;
    }
    if (org_id) {
      deviceWhere.org_id = org_id;
    }
    if (is_old_device !== undefined) {
      deviceWhere.is_old_device = is_old_device;
    }

    if (min_usage_years !== undefined || max_usage_years !== undefined) {
      const now = dayjs();
      if (min_usage_years !== undefined) {
        const maxProcureDate = now.subtract(min_usage_years, 'year').toDate();
        deviceWhere.procurement_date = {
          ...(deviceWhere.procurement_date || {}),
          [Op.lte]: maxProcureDate
        };
      }
      if (max_usage_years !== undefined) {
        const minProcureDate = now.subtract(max_usage_years, 'year').toDate();
        deviceWhere.procurement_date = {
          ...(deviceWhere.procurement_date || {}),
          [Op.gte]: minProcureDate
        };
      }
    }

    deviceWhere.status = 1;

    const devices = await this.deviceArchiveRepository.findByWhere(deviceWhere);

    if (devices.length === 0) {
      throwBusinessError('没有符合筛选条件的设备');
    }

    const taskNo = await this.deviceWorkOrderRepository.generateTaskNo();
    const orderTypeConfig = WORK_ORDER_TYPE_CONFIG[order_type];
    const taskName = `${orderTypeConfig?.order_type_text || '运维任务'}-${dayjs(start_date).format('YYYYMMDD')}`;

    const org = org_id ? await this.organizationRepository.findById(org_id) : null;
    const orgName = org ? (org as any).name : undefined;

    const task = await DeviceMaintenanceTask.create({
      task_no: taskNo,
      task_name: taskName,
      order_type,
      task_status: 1,
      total_count: devices.length,
      completed_count: 0,
      pending_count: devices.length,
      progress: 0,
      start_date: dayjs(start_date).toDate(),
      end_date: dayjs(end_date).toDate(),
      priority: priority || 2,
      assignee_id,
      assignee_name,
      creator_id: operatorId,
      creator_name: operatorName,
      org_id,
      org_name: orgName,
      is_old_device_filter: is_old_device || 0,
      fault_frequency_min,
      min_usage_years,
      max_usage_years,
      remark,
      device_list: devices.map(d => (d as any).id)
    } as any);

    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const deviceData = (device as any).toJSON();
      const orderNo = await this.deviceWorkOrderRepository.generateOrderNo();
      const warrantyResult = this.calcWarrantyStatus(deviceData);

      await this.deviceWorkOrderRepository.create({
        order_no: orderNo,
        archive_no: deviceData.archive_no,
        sn_code: deviceData.sn_code,
        device_type: deviceData.device_type,
        device_model: deviceData.device_model,
        manufacturer: deviceData.manufacturer,
        order_type,
        maintenance_level: orderTypeConfig?.maintenance_level || 1,
        status: 1,
        acceptance_status: 0,
        assignee_id,
        assignee_name,
        creator_id: operatorId,
        creator_name: operatorName,
        org_id: deviceData.org_id || org_id,
        org_name: deviceData.org_name || orgName,
        install_location: deviceData.install_location,
        priority: priority || 2,
        expected_finish_time: dayjs(end_date).toDate(),
        is_overdue: 0,
        warranty_status: warrantyResult.status,
        remark: `批量任务：${taskName}`
      } as any);
    }

    return this.getMaintenanceTaskById(task.id);
  }

  async getWorkOrderLogList(params: any): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceWorkOrderRepository.buildLogQuery(queryParams);

    const { count, rows } = await DeviceWorkOrderLog.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']]
    });

    const list: DeviceWorkOrderLogVO[] = rows.map(l => this.convertLogToVO(l));

    return {
      list,
      total: count,
      page,
      pageSize
    };
  }

  async traceWorkOrder(request: WorkOrderTraceRequest): Promise<WorkOrderTraceResult> {
    const { archive_no, sn_code } = request;

    if (!archive_no && !sn_code) {
      throwValidationError('请至少提供设备档案号或SN码中的一项');
    }

    const orderWhere: any = {};
    if (archive_no) {
      orderWhere.archive_no = archive_no;
    }
    if (sn_code) {
      orderWhere.sn_code = sn_code;
    }

    const include = [
      this.deviceWorkOrderRepository.getOrganizationInclude(),
      this.deviceWorkOrderRepository.getCreatorInclude(),
      this.deviceWorkOrderRepository.getAssigneeInclude()
    ];

    const orders = await this.deviceWorkOrderRepository.findByWhere(orderWhere, {
      include,
      order: [['created_at', 'DESC']],
      limit: 100
    });

    if (orders.length === 0) {
      return {
        fake_maintenance_check: {
          passed: false,
          issues: ['未找到匹配的工单记录'],
          fake_count: 0
        },
        violation_check: {
          passed: false,
          issues: ['未找到匹配的工单记录'],
          violation_count: 0
        },
        acceptance_check: {
          passed: false,
          issues: ['未找到匹配的工单记录'],
          perfunctory_count: 0
        },
        risk_prompts: ['未找到匹配的工单记录'],
        work_order_history: [],
        maintenance_logs: []
      };
    }

    const orderIds = orders.map(o => (o as any).id);
    const logs = await DeviceWorkOrderLog.findAll({
      where: { order_id: { [Op.in]: orderIds } },
      order: [['created_at', 'DESC']]
    });

    const fakeMaintenanceResult = this.checkFakeMaintenance(orders, logs);
    const violationResult = this.checkViolation(orders, logs);
    const acceptanceResult = this.checkAcceptancePerfunctory(orders);

    const riskPrompts: string[] = [];
    if (fakeMaintenanceResult.issues.length > 0) {
      riskPrompts.push(...fakeMaintenanceResult.issues);
    }
    if (violationResult.issues.length > 0) {
      riskPrompts.push(...violationResult.issues);
    }
    if (acceptanceResult.issues.length > 0) {
      riskPrompts.push(...acceptanceResult.issues);
    }

    const orderVOs = orders.map(o => this.convertWorkOrderToVO(o));
    const logVOs = logs.map(l => this.convertLogToVO(l));

    const firstOrder = orders[0];
    const firstOrderData = (firstOrder as any).toJSON ? (firstOrder as any).toJSON() : firstOrder;

    let deviceInfo: WorkOrderTraceResult['device_info'] | undefined;
    const device = archive_no
      ? await this.deviceArchiveRepository.findByArchiveNo(archive_no)
      : sn_code ? await this.deviceArchiveRepository.findBySnCode(sn_code) : null;

    if (device) {
      const deviceData = (device as any).toJSON();
      const usageYears = deviceData.procurement_date
        ? dayjs().diff(dayjs(deviceData.procurement_date), 'year')
        : 0;

      const faultRecords = await DeviceFaultRecord.findAll({
        where: { archive_no: deviceData.archive_no }
      });

      const maintenanceOrders = orders.filter(o => {
        const data = (o as any).toJSON ? (o as any).toJSON() : o;
        return data.status === 5;
      });

      let avgRecoveryHours = 0;
      if (maintenanceOrders.length > 0) {
        const totalHours = maintenanceOrders.reduce((sum, order) => {
          const data = (order as any).toJSON ? (order as any).toJSON() : order;
          if (data.created_at && data.actual_finish_time) {
            return sum + dayjs(data.actual_finish_time).diff(dayjs(data.created_at), 'hour');
          }
          return sum;
        }, 0);
        avgRecoveryHours = Number((totalHours / maintenanceOrders.length).toFixed(2));
      }

      deviceInfo = {
        archive_no: deviceData.archive_no,
        sn_code: deviceData.sn_code,
        device_type: deviceData.device_type,
        device_type_text: DeviceTypeText[deviceData.device_type] || '未知',
        usage_years: usageYears,
        fault_count_total: faultRecords.length,
        maintenance_count_total: maintenanceOrders.length,
        avg_recovery_hours: avgRecoveryHours
      };
    }

    return {
      device_info: deviceInfo,
      fake_maintenance_check: {
        passed: fakeMaintenanceResult.issues.length === 0,
        issues: fakeMaintenanceResult.issues,
        fake_count: fakeMaintenanceResult.fake_count
      },
      violation_check: {
        passed: violationResult.issues.length === 0,
        issues: violationResult.issues,
        violation_count: violationResult.violation_count
      },
      acceptance_check: {
        passed: acceptanceResult.issues.length === 0,
        issues: acceptanceResult.issues,
        perfunctory_count: acceptanceResult.perfunctory_count
      },
      risk_prompts: riskPrompts,
      work_order_history: orderVOs,
      maintenance_logs: logVOs
    };
  }

  private convertWorkOrderToVO(order: any): DeviceWorkOrderVO {
    const data = order.toJSON ? order.toJSON() : order;
    const vo: any = { ...data };

    vo.device_type_text = DeviceTypeText[data.device_type] || '未知';
    vo.order_type_text = WorkOrderTypeText[data.order_type] || '未知';
    vo.maintenance_level_text = MaintenanceLevelText[data.maintenance_level] || '未知';
    vo.status_text = WorkOrderStatusText[data.status] || '未知';
    vo.acceptance_status_text = AcceptanceStatusText[data.acceptance_status] || '未知';
    vo.warranty_status_text = WarrantyStatusText[data.warranty_status] || '未知';
    vo.priority_text = PriorityText[data.priority] || '未知';

    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    if (data.creator) {
      vo.creator_name = data.creator.real_name || data.creator.username;
    }

    if (data.assignee) {
      vo.assignee_name = data.assignee.real_name || data.assignee.username;
    }

    if (data.acceptanceUser) {
      vo.acceptance_by_name = data.acceptanceUser.real_name || data.acceptanceUser.username;
    }

    if (data.expected_finish_time) {
      vo.expected_finish_time = dayjs(data.expected_finish_time).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.actual_finish_time) {
      vo.actual_finish_time = dayjs(data.actual_finish_time).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.acceptance_time) {
      vo.acceptance_time = dayjs(data.acceptance_time).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.created_at) {
      vo.created_at = dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.updated_at) {
      vo.updated_at = dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.used_parts && typeof data.used_parts === 'object') {
      vo.used_parts = JSON.stringify(data.used_parts);
    }

    return vo as DeviceWorkOrderVO;
  }

  private convertTaskToVO(task: any): DeviceMaintenanceTaskVO {
    const data = task.toJSON ? task.toJSON() : task;
    const vo: any = { ...data };

    vo.order_type_text = WorkOrderTypeText[data.order_type] || '未知';
    vo.task_status_text = TaskStatusText[data.task_status] || '未知';
    vo.priority_text = PriorityText[data.priority] || '未知';

    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    if (data.creator) {
      vo.creator_name = data.creator.real_name || data.creator.username;
    }

    if (data.assignee) {
      vo.assignee_name = data.assignee.real_name || data.assignee.username;
    }

    if (data.start_date) {
      vo.start_date = dayjs(data.start_date).format('YYYY-MM-DD');
    }

    if (data.end_date) {
      vo.end_date = dayjs(data.end_date).format('YYYY-MM-DD');
    }

    if (data.created_at) {
      vo.created_at = dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.updated_at) {
      vo.updated_at = dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.device_list && typeof data.device_list === 'object') {
      vo.device_list = JSON.stringify(data.device_list);
    }

    return vo as DeviceMaintenanceTaskVO;
  }

  private convertLogToVO(log: any): DeviceWorkOrderLogVO {
    const data = log.toJSON ? log.toJSON() : log;
    const vo: any = { ...data };

    vo.log_type_text = WorkOrderLogTypeText[data.log_type] || '未知';

    if (data.before_status !== undefined && data.before_status !== null) {
      vo.before_status_text = WorkOrderStatusText[data.before_status] || '未知';
    }

    if (data.after_status !== undefined && data.after_status !== null) {
      vo.after_status_text = WorkOrderStatusText[data.after_status] || '未知';
    }

    if (data.created_at) {
      vo.created_at = dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss');
    }

    return vo as DeviceWorkOrderLogVO;
  }

  private calcWarrantyStatus(device: any): { status: WarrantyStatus; expire_date?: string } {
    if (!device.procurement_date) {
      return { status: 0 };
    }

    const procurementDate = dayjs(device.procurement_date);
    const warrantyYears = device.warranty_years || 1;
    const expireDate = procurementDate.add(warrantyYears, 'year');
    const now = dayjs();
    const daysToExpire = expireDate.diff(now, 'day');

    let status: WarrantyStatus = 0;
    if (daysToExpire > 30) {
      status = 1;
    } else if (daysToExpire > 0 && daysToExpire <= 30) {
      status = 2;
    } else {
      status = 0;
    }

    return {
      status,
      expire_date: expireDate.format('YYYY-MM-DD')
    };
  }

  private checkFakeMaintenance(orders: DeviceWorkOrder[], logs: DeviceWorkOrderLog[]): { issues: string[]; fake_count: number } {
    const issues: string[] = [];
    let fakeCount = 0;

    const logByOrderId = new Map<string, DeviceWorkOrderLog[]>();
    logs.forEach(log => {
      const logData = (log as any).toJSON ? (log as any).toJSON() : log;
      const orderId = logData.order_id;
      if (!logByOrderId.has(orderId)) {
        logByOrderId.set(orderId, []);
      }
      logByOrderId.get(orderId)!.push(log);
    });

    orders.forEach(order => {
      const orderData = (order as any).toJSON ? (order as any).toJSON() : order;
      const orderLogs = logByOrderId.get(orderData.id) || [];

      if ((orderData.status === 3 || orderData.status === 5) && orderLogs.length === 0) {
        fakeCount++;
        issues.push(`工单【${orderData.order_no}】状态已变更但无操作日志，疑似虚假运维`);
      }

      if (orderData.created_at && orderData.actual_finish_time) {
        const durationMinutes = dayjs(orderData.actual_finish_time).diff(dayjs(orderData.created_at), 'minute');
        if (durationMinutes < 10 && orderData.status === 5) {
          fakeCount++;
          issues.push(`工单【${orderData.order_no}】处理时长仅${durationMinutes}分钟，异常短促，疑似虚假运维`);
        }
      }

      if (orderData.status === 5 && orderData.acceptance_by && orderData.creator_id === orderData.acceptance_by) {
        const sameAcceptanceOrders = orders.filter(o => {
          const oData = (o as any).toJSON ? (o as any).toJSON() : o;
          return oData.status === 5
            && oData.acceptance_by === orderData.acceptance_by
            && oData.id !== orderData.id;
        });
        if (sameAcceptanceOrders.length >= 3) {
          fakeCount++;
          issues.push(`处理人【${orderData.acceptance_by_name || orderData.acceptance_by}】存在${sameAcceptanceOrders.length + 1}次自我验收记录，疑似重复验收走过场`);
        }
      }
    });

    return { issues, fake_count: fakeCount };
  }

  private checkViolation(orders: DeviceWorkOrder[], logs: DeviceWorkOrderLog[]): { issues: string[]; violation_count: number } {
    const issues: string[] = [];
    let violationCount = 0;

    const logByOrderId = new Map<string, DeviceWorkOrderLog[]>();
    logs.forEach(log => {
      const logData = (log as any).toJSON ? (log as any).toJSON() : log;
      const orderId = logData.order_id;
      if (!logByOrderId.has(orderId)) {
        logByOrderId.set(orderId, []);
      }
      logByOrderId.get(orderId)!.push(log);
    });

    orders.forEach(order => {
      const orderData = (order as any).toJSON ? (order as any).toJSON() : order;
      const orderLogs = logByOrderId.get(orderData.id) || [];

      if (orderLogs.length > 0) {
        const sortedLogs = [...orderLogs].sort((a, b) => {
          const aData = (a as any).toJSON ? (a as any).toJSON() : a;
          const bData = (b as any).toJSON ? (b as any).toJSON() : b;
          return dayjs(aData.created_at).valueOf() - dayjs(bData.created_at).valueOf();
        });

        const expectedFlow = [1, 2, 3, 4, 5];
        const actualFlow = sortedLogs
          .map(l => {
            const lData = (l as any).toJSON ? (l as any).toJSON() : l;
            return lData.after_status;
          })
          .filter((s: any) => s !== undefined && s !== null);

        for (let i = 1; i < actualFlow.length; i++) {
          const prevIdx = expectedFlow.indexOf(actualFlow[i - 1]);
          const currIdx = expectedFlow.indexOf(actualFlow[i]);
          if (prevIdx !== -1 && currIdx !== -1 && currIdx < prevIdx) {
            violationCount++;
            issues.push(`工单【${orderData.order_no}】存在状态回退现象，疑似流程跳步`);
            break;
          }
          if (currIdx - prevIdx > 1) {
            violationCount++;
            issues.push(`工单【${orderData.order_no}】状态从${WorkOrderStatusText[actualFlow[i - 1]] || '未知'}直接跳转到${WorkOrderStatusText[actualFlow[i]] || '未知'}，疑似流程跳步`);
            break;
          }
        }
      }

      const orderTypeConfig = WORK_ORDER_TYPE_CONFIG[orderData.order_type];
      if (orderTypeConfig && orderTypeConfig.required_qualifications.length > 0 && orderData.assignee_id) {
        violationCount++;
        issues.push(`工单【${orderData.order_no}】类型需要资质【${orderTypeConfig.required_qualifications.join('、')}】，需确认处理人是否持有有效资质`);
      }
    });

    return { issues, violation_count: violationCount };
  }

  private checkAcceptancePerfunctory(orders: DeviceWorkOrder[]): { issues: string[]; perfunctory_count: number } {
    const issues: string[] = [];
    let perfunctoryCount = 0;

    const acceptedOrders = orders.filter(o => {
      const data = (o as any).toJSON ? (o as any).toJSON() : o;
      return data.acceptance_status === 1 || data.acceptance_status === 2;
    });

    acceptedOrders.forEach(order => {
      const orderData = (order as any).toJSON ? (order as any).toJSON() : order;

      if (orderData.acceptance_status === 1 && (!orderData.acceptance_remark || orderData.acceptance_remark.trim().length === 0)) {
        perfunctoryCount++;
        issues.push(`工单【${orderData.order_no}】验收通过但无验收备注，疑似验收走过场`);
      }

      if (orderData.acceptance_time && orderData.actual_finish_time) {
        const acceptanceDurationMinutes = dayjs(orderData.acceptance_time).diff(dayjs(orderData.actual_finish_time), 'minute');
        if (acceptanceDurationMinutes < 5 && acceptanceDurationMinutes >= 0) {
          perfunctoryCount++;
          issues.push(`工单【${orderData.order_no}】验收时长仅${acceptanceDurationMinutes}分钟，疑似验收走过场`);
        }
      }
    });

    const deviceRejectCount = new Map<string, number>();
    orders.forEach(order => {
      const orderData = (order as any).toJSON ? (order as any).toJSON() : order;
      if (orderData.acceptance_status === 2) {
        const key = orderData.archive_no || orderData.sn_code;
        if (key) {
          deviceRejectCount.set(key, (deviceRejectCount.get(key) || 0) + 1);
        }
      }
    });

    deviceRejectCount.forEach((count, key) => {
      if (count >= 3) {
        perfunctoryCount++;
        issues.push(`设备【${key}】存在${count}次验收不通过记录，需重点关注`);
      }
    });

    return { issues, perfunctory_count: perfunctoryCount };
  }
}
