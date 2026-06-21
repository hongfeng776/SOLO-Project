import { DeviceMonitorRepository, UserRepository, OrganizationRepository } from '../repositories';
import {
  DeviceMonitorStatus,
  FaultLevel,
  MonitorStrategy,
  DataConnectStatus,
  FaultStatus,
  MonitorLogType,
  DeviceMonitorStatusText,
  FaultLevelText,
  MonitorStrategyText,
  DataConnectStatusText,
  FaultStatusText,
  MonitorLogTypeText,
  MONITOR_STATUS_CONFIG,
  DEVICE_MONITOR_STRATEGY,
  FAULT_CODE_PATTERNS,
  type DeviceDataCheckRequest,
  type DeviceDataCheckResult,
  type DeviceMonitorQueryParams,
  type DeviceMonitorVO,
  type DeviceMonitorUpdateRequest,
  type DeviceFaultRecordVO,
  type DeviceFaultQueryParams,
  type DeviceMonitorLogVO,
  type DeviceMonitorLogQueryParams,
  type DeviceMonitorTraceRequest,
  type DeviceMonitorTraceResult,
  type DeviceMonitorStatistics,
  type BatchMonitorUpdateRequest,
  type BatchMonitorUpdateResult
} from '../types';
import { throwBusinessError, throwNotFoundError, throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { DeviceMonitorLog, DeviceFaultRecord, DeviceMonitor } from '../models';
import { DeviceTypeText } from '../types/onlinePayment';

export class DeviceMonitorService {
  private deviceMonitorRepository: DeviceMonitorRepository;
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.deviceMonitorRepository = new DeviceMonitorRepository();
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async getMonitorConfig(): Promise<any> {
    return {
      statuses: Object.entries(MONITOR_STATUS_CONFIG).map(([value, config]) => ({
        value: Number(value),
        label: config.status_text,
        color: config.color,
        polling_interval_seconds: config.polling_interval_seconds,
        is_alert: config.is_alert
      })),
      fault_levels: Object.entries(FaultLevelText).map(([value, label]) => ({ value: Number(value), label })),
      monitor_strategies: Object.entries(MonitorStrategyText).map(([value, label]) => ({ value: Number(value), label })),
      connect_statuses: Object.entries(DataConnectStatusText).map(([value, label]) => ({ value: Number(value), label })),
      fault_statuses: Object.entries(FaultStatusText).map(([value, label]) => ({ value: Number(value), label })),
      log_types: Object.entries(MonitorLogTypeText).map(([value, label]) => ({ value: Number(value), label })),
      device_monitor_strategy: DEVICE_MONITOR_STRATEGY,
      fault_code_patterns: FAULT_CODE_PATTERNS
    };
  }

  async checkDeviceData(request: DeviceDataCheckRequest): Promise<DeviceDataCheckResult> {
    const { archive_no, sn_code, device_type } = request;
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';

    if (!archive_no && !sn_code) {
      throwValidationError('设备档案号或SN码不能为空');
    }

    let connectChecked = false;
    let connectStatus: DataConnectStatus = 0;
    let timelinessChecked = false;
    let lastDataTime: string | undefined;
    let dataDelaySeconds: number | undefined;
    let paramComplete = true;
    const missingParams: string[] = [];
    const faultCodes: string[] = [];
    let onlineStatus: DeviceMonitorStatus = 1;

    let device: DeviceMonitor | null = null;
    if (archive_no) {
      device = await this.deviceMonitorRepository.findByArchiveNo(archive_no);
    } else if (sn_code) {
      device = await this.deviceMonitorRepository.findBySnCode(sn_code);
    }

    if (!device) {
      connectChecked = false;
      blocked = true;
      blockReason = '设备不存在监控记录，连通性校验未通过';
      warnings.push('设备未接入监控系统');
    } else {
      connectChecked = true;
      onlineStatus = device.monitor_status as DeviceMonitorStatus;

      if (device.last_data_time) {
        timelinessChecked = true;
        lastDataTime = dayjs(device.last_data_time).format('YYYY-MM-DD HH:mm:ss');
        const now = dayjs();
        const lastData = dayjs(device.last_data_time);
        dataDelaySeconds = now.diff(lastData, 'second');

        const strategyConfig = DEVICE_MONITOR_STRATEGY[device_type] || DEVICE_MONITOR_STRATEGY[1];
        const timeoutSeconds = strategyConfig.data_timeout_seconds;

        if (dataDelaySeconds > timeoutSeconds * 3) {
          connectStatus = 0;
          blocked = true;
          blockReason = `数据中断，最后数据时间：${lastDataTime}，已超过超时阈值的3倍`;
          warnings.push(`数据中断超过${Math.floor(timeoutSeconds * 3 / 60)}分钟`);
        } else if (dataDelaySeconds > timeoutSeconds) {
          connectStatus = 2;
          warnings.push(`数据延迟${Math.floor(dataDelaySeconds / 60)}分钟`);
        } else {
          connectStatus = 1;
        }
      } else {
        connectStatus = 0;
        blocked = true;
        blockReason = '设备从未上报过数据';
        warnings.push('设备无数据上报记录');
      }

      const paramsToCheck = ['cpu_usage', 'memory_usage', 'disk_usage', 'temperature'];
      const deviceData = device.toJSON();
      for (const param of paramsToCheck) {
        if ((deviceData as any)[param] === null || (deviceData as any)[param] === undefined) {
          missingParams.push(param);
        }
      }
      if (missingParams.length > 0) {
        paramComplete = false;
        warnings.push(`运行参数不完整，缺失：${missingParams.join('、')}`);
      }

      if (device.fault_code) {
        faultCodes.push(device.fault_code);
        const faultPattern = FAULT_CODE_PATTERNS[device.fault_code];
        if (faultPattern) {
          warnings.push(`存在未处理故障：${device.fault_code} - ${faultPattern.description}`);
        } else {
          warnings.push(`存在未知故障代码：${device.fault_code}`);
        }
      }
    }

    const strategyConfig = DEVICE_MONITOR_STRATEGY[device_type];

    return {
      passed: !blocked,
      blocked,
      block_reason: blockReason || undefined,
      warnings,
      connect_checked: connectChecked,
      connect_status: connectStatus,
      connect_status_text: DataConnectStatusText[connectStatus] || '未知',
      timeliness_checked: timelinessChecked,
      last_data_time: lastDataTime,
      data_delay_seconds: dataDelaySeconds,
      param_complete: paramComplete,
      missing_params: missingParams,
      fault_codes: faultCodes,
      online_status: onlineStatus,
      online_status_text: DeviceMonitorStatusText[onlineStatus] || '未知',
      monitor_strategy: strategyConfig
    };
  }

  async getMonitorList(params: DeviceMonitorQueryParams, currentUserId?: string, userOrgId?: string): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceMonitorRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.deviceMonitorRepository.getOrganizationInclude()
    ];

    const result = await this.deviceMonitorRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: DeviceMonitorVO[] = result.list.map(d => this.convertMonitorToVO(d));

    return { ...result, list };
  }

  async getMonitorStatistics(params?: any): Promise<DeviceMonitorStatistics> {
    const where: any = params?.org_id ? { org_id: params.org_id } : {};

    const totalCount = await this.deviceMonitorRepository.count(where);

    const onlineWhere = { ...where, monitor_status: { [Op.in]: [1, 2] } };
    const onlineCount = await this.deviceMonitorRepository.count(onlineWhere);

    const offlineWhere = { ...where, connect_status: 0 };
    const offlineCount = await this.deviceMonitorRepository.count(offlineWhere);

    const faultWhere = { ...where, monitor_status: 3 };
    const faultCount = await this.deviceMonitorRepository.count(faultWhere);

    const normalRatio = totalCount > 0 ? Number(((onlineCount / totalCount) * 100).toFixed(2)) : 0;
    const faultRatio = totalCount > 0 ? Number(((faultCount / totalCount) * 100).toFixed(2)) : 0;
    const offlineRatio = totalCount > 0 ? Number(((offlineCount / totalCount) * 100).toFixed(2)) : 0;

    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayFaultCount = await DeviceFaultRecord.count({
      where: {
        ...(params?.org_id ? { org_id: params.org_id } : {}),
        occur_time: { [Op.between]: [todayStart, todayEnd] }
      }
    });

    const todayRecoveredCount = await DeviceFaultRecord.count({
      where: {
        ...(params?.org_id ? { org_id: params.org_id } : {}),
        fault_status: 2,
        recover_time: { [Op.between]: [todayStart, todayEnd] }
      }
    });

    const keyDeviceWhere = { ...where, is_key_device: 1 };
    const keyDeviceCount = await this.deviceMonitorRepository.count(keyDeviceWhere);

    const keyDeviceOnlineWhere = { ...keyDeviceWhere, monitor_status: { [Op.in]: [1, 2] } };
    const keyDeviceOnlineCount = await this.deviceMonitorRepository.count(keyDeviceOnlineWhere);

    let avgOnlineRate = 0;
    if (totalCount > 0) {
      avgOnlineRate = Number(((onlineCount / totalCount) * 100).toFixed(2));
    }

    return {
      total_count: totalCount,
      online_count: onlineCount,
      offline_count: offlineCount,
      fault_count: faultCount,
      normal_ratio: normalRatio,
      fault_ratio: faultRatio,
      offline_ratio: offlineRatio,
      today_fault_count: todayFaultCount,
      today_recovered_count: todayRecoveredCount,
      key_device_count: keyDeviceCount,
      key_device_online_count: keyDeviceOnlineCount,
      avg_online_rate: avgOnlineRate
    };
  }

  async getMonitorById(id: string): Promise<DeviceMonitorVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的监控ID');
    }

    const device = await this.deviceMonitorRepository.findById(id, {
      include: [
        this.deviceMonitorRepository.getOrganizationInclude()
      ]
    });

    if (!device) {
      throwNotFoundError('设备监控记录不存在');
    }

    return this.convertMonitorToVO(device);
  }

  async updateMonitorStatus(request: DeviceMonitorUpdateRequest, operatorId: string): Promise<DeviceMonitorVO> {
    const { archive_no, monitor_status, fault_level, fault_code, fault_description, operation_remark, ...dataParams } = request;

    if (!archive_no) {
      throwValidationError('设备档案号不能为空');
    }

    const device = await this.deviceMonitorRepository.findByArchiveNo(archive_no);
    if (!device) {
      throwNotFoundError('设备监控记录不存在');
    }

    const beforeStatus = device.monitor_status;
    const beforeFaultLevel = device.fault_level;
    const beforeFaultCode = device.fault_code;

    const updateData: any = {
      monitor_status,
      ...dataParams
    };

    if (monitor_status === 3) {
      updateData.fault_level = fault_level || 2;
      updateData.fault_code = fault_code || 'E999';
      updateData.last_fault_time = new Date();
    } else if (monitor_status === 1 || monitor_status === 2) {
      updateData.fault_level = null;
      updateData.fault_code = null;
    }

    if (fault_level !== undefined) {
      updateData.fault_level = fault_level;
    }
    if (fault_code !== undefined) {
      updateData.fault_code = fault_code;
    }

    await this.deviceMonitorRepository.update(device.id, updateData);

    if (monitor_status === 3 && (beforeStatus !== 3 || beforeFaultCode !== fault_code)) {
      const faultPattern = fault_code ? FAULT_CODE_PATTERNS[fault_code] : null;
      await DeviceFaultRecord.create({
        device_id: device.id,
        archive_no: device.archive_no,
        sn_code: device.sn_code,
        device_type: device.device_type,
        fault_level: fault_level || 2,
        fault_code: fault_code || 'E999',
        fault_description: fault_description || faultPattern?.description || '设备故障',
        fault_status: 0,
        occur_time: new Date(),
        org_id: device.org_id,
        org_name: device.org_name
      } as any);
    }

    const operator = await this.userRepository.findById(operatorId);
    const operatorName = operator ? ((operator as any).real_name || (operator as any).username) : '';

    let logType: MonitorLogType = 1;
    if (monitor_status === 3 && beforeStatus !== 3) {
      logType = 2;
    } else if (monitor_status === 4 && beforeStatus !== 4) {
      logType = 6;
    }

    const isAlert = MONITOR_STATUS_CONFIG[monitor_status]?.is_alert ? 1 : 0;

    await DeviceMonitorLog.create({
      device_id: device.id,
      archive_no: device.archive_no,
      log_type: logType,
      before_status: beforeStatus,
      after_status: monitor_status,
      fault_level: updateData.fault_level,
      fault_code: updateData.fault_code,
      operation_detail: JSON.stringify({
        before_status: beforeStatus,
        after_status: monitor_status,
        before_fault_level: beforeFaultLevel,
        after_fault_level: updateData.fault_level,
        before_fault_code: beforeFaultCode,
        after_fault_code: updateData.fault_code
      }),
      operator_id: operatorId,
      operator_name: operatorName,
      operation_remark: operation_remark,
      is_alert: isAlert
    } as any);

    return this.getMonitorById(device.id);
  }

  async batchUpdateMonitor(request: BatchMonitorUpdateRequest, operatorId: string): Promise<BatchMonitorUpdateResult> {
    const { archive_nos, target_status, fault_level, fault_code, operation_remark } = request;

    if (!archive_nos || archive_nos.length === 0) {
      throwValidationError('请选择要操作的设备');
    }

    const details: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const archiveNo of archive_nos) {
      try {
        const device = await this.deviceMonitorRepository.findByArchiveNo(archiveNo);
        if (!device) {
          failCount++;
          details.push({
            archive_no: archiveNo,
            sn_code: '',
            success: false,
            error_message: '设备监控记录不存在',
            before_status: 0,
            after_status: target_status
          });
          continue;
        }

        const beforeStatus = device.monitor_status as DeviceMonitorStatus;

        await this.updateMonitorStatus({
          archive_no: archiveNo,
          monitor_status: target_status,
          fault_level,
          fault_code,
          operation_remark
        }, operatorId);

        successCount++;
        details.push({
          archive_no: archiveNo,
          sn_code: device.sn_code,
          success: true,
          before_status: beforeStatus,
          after_status: target_status
        });
      } catch (err: any) {
        failCount++;
        const device = await this.deviceMonitorRepository.findByArchiveNo(archiveNo);
        details.push({
          archive_no: archiveNo,
          sn_code: device?.sn_code || '',
          success: false,
          error_message: err?.message || '操作失败',
          before_status: device?.monitor_status || 0,
          after_status: target_status
        });
      }
    }

    return {
      success_count: successCount,
      fail_count: failCount,
      details
    };
  }

  async getFaultList(params: DeviceFaultQueryParams, currentUserId?: string, userOrgId?: string): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceMonitorRepository.buildFaultQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const { count, rows } = await DeviceFaultRecord.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['occur_time', 'DESC']]
    });

    const list: DeviceFaultRecordVO[] = rows.map(f => this.convertFaultToVO(f));

    return {
      list,
      total: count,
      page,
      pageSize
    };
  }

  async getFaultById(id: string): Promise<DeviceFaultRecordVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的故障记录ID');
    }

    const fault = await DeviceFaultRecord.findByPk(id);
    if (!fault) {
      throwNotFoundError('故障记录不存在');
    }

    return this.convertFaultToVO(fault);
  }

  async handleFault(id: string, faultStatus: FaultStatus, handleRemark: string, handlerId: string): Promise<DeviceFaultRecordVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的故障记录ID');
    }

    const fault = await DeviceFaultRecord.findByPk(id);
    if (!fault) {
      throwNotFoundError('故障记录不存在');
    }

    const handler = await this.userRepository.findById(handlerId);
    const handlerName = handler ? ((handler as any).real_name || (handler as any).username) : '';

    const updateData: any = {
      fault_status: faultStatus,
      handler_id: handlerId,
      handler_name: handlerName,
      handle_remark: handleRemark
    };

    let durationMinutes: number | undefined;
    if (faultStatus === 2 || faultStatus === 3) {
      updateData.recover_time = new Date();
      const occurTime = dayjs(fault.occur_time);
      const recoverTime = dayjs();
      durationMinutes = recoverTime.diff(occurTime, 'minute');
      updateData.duration_minutes = durationMinutes;

      if (faultStatus === 2) {
        const device = await this.deviceMonitorRepository.findById(fault.device_id);
        if (device) {
          const beforeStatus = device.monitor_status;
          await this.deviceMonitorRepository.update(device.id, {
            monitor_status: 1,
            fault_level: null,
            fault_code: null
          });

          await DeviceMonitorLog.create({
            device_id: device.id,
            archive_no: device.archive_no,
            log_type: 6,
            before_status: beforeStatus,
            after_status: 1,
            operation_detail: JSON.stringify({
              fault_id: id,
              fault_no: fault.fault_no,
              action: 'fault_handled'
            }),
            operator_id: handlerId,
            operator_name: handlerName,
            operation_remark: handleRemark,
            is_alert: 0
          } as any);
        }
      }
    }

    await DeviceFaultRecord.update(updateData, {
      where: { id },
      individualHooks: true
    });

    return this.getFaultById(id);
  }

  async getMonitorLogList(params: DeviceMonitorLogQueryParams): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceMonitorRepository.buildLogQuery(queryParams);

    const { count, rows } = await DeviceMonitorLog.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']]
    });

    const list: DeviceMonitorLogVO[] = rows.map(l => this.convertLogToVO(l));

    return {
      list,
      total: count,
      page,
      pageSize
    };
  }

  async traceDeviceMonitor(request: DeviceMonitorTraceRequest): Promise<DeviceMonitorTraceResult> {
    const { archive_no, sn_code } = request;

    if (!archive_no && !sn_code) {
      throwValidationError('请至少提供设备档案号或SN码中的一项');
    }

    let device: DeviceMonitor | null = null;
    if (archive_no) {
      device = await this.deviceMonitorRepository.findByArchiveNo(archive_no);
    } else if (sn_code) {
      device = await this.deviceMonitorRepository.findBySnCode(sn_code);
    }

    if (!device) {
      return {
        duplicate_check: {
          passed: false,
          issues: ['未找到匹配的设备监控记录'],
          has_fake_online: false,
          fake_online_count: 0
        },
        fault_check: {
          passed: false,
          issues: ['未找到匹配的设备监控记录'],
          missed_fault_count: 0,
          false_alarm_count: 0
        },
        data_check: {
          passed: false,
          issues: ['未找到匹配的设备监控记录'],
          data_tampering_count: 0,
          abnormal_records: 0
        },
        risk_prompts: ['未找到匹配的设备监控记录'],
        run_logs: [],
        fault_records: []
      };
    }

    const deviceVO = this.convertMonitorToVO(device);

    const faultRecords = await DeviceFaultRecord.findAll({
      where: { device_id: device.id },
      order: [['occur_time', 'DESC']],
      limit: 50
    });

    const runLogs = await DeviceMonitorLog.findAll({
      where: { device_id: device.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    const fakeOnlineResult = this.checkFakeOnline(device);
    const missedFaultResult = this.checkMissedFault(device, faultRecords);
    const dataAbnormalResult = this.checkDataAbnormal(runLogs);

    const riskPrompts: string[] = [];
    if (fakeOnlineResult.issues.length > 0) {
      riskPrompts.push(...fakeOnlineResult.issues);
    }
    if (missedFaultResult.issues.length > 0) {
      riskPrompts.push(...missedFaultResult.issues);
    }
    if (dataAbnormalResult.issues.length > 0) {
      riskPrompts.push(...dataAbnormalResult.issues);
    }

    const faultRecordVOs = faultRecords.map(f => this.convertFaultToVO(f));
    const runLogVOs = runLogs.map(l => this.convertLogToVO(l));

    return {
      device_info: deviceVO,
      duplicate_check: {
        passed: fakeOnlineResult.issues.length === 0,
        issues: fakeOnlineResult.issues,
        has_fake_online: fakeOnlineResult.has_fake_online,
        fake_online_count: fakeOnlineResult.fake_online_count
      },
      fault_check: {
        passed: missedFaultResult.issues.length === 0,
        issues: missedFaultResult.issues,
        missed_fault_count: missedFaultResult.missed_fault_count,
        false_alarm_count: missedFaultResult.false_alarm_count
      },
      data_check: {
        passed: dataAbnormalResult.issues.length === 0,
        issues: dataAbnormalResult.issues,
        data_tampering_count: dataAbnormalResult.data_tampering_count,
        abnormal_records: dataAbnormalResult.abnormal_records
      },
      risk_prompts: riskPrompts,
      run_logs: runLogVOs,
      fault_records: faultRecordVOs
    };
  }

  private convertMonitorToVO(device: any): DeviceMonitorVO {
    const data = device.toJSON ? device.toJSON() : device;
    const vo: any = { ...data };

    vo.device_type_text = DeviceTypeText[data.device_type] || '未知';
    vo.monitor_status_text = DeviceMonitorStatusText[data.monitor_status] || '未知';
    vo.connect_status_text = DataConnectStatusText[data.connect_status] || '未知';
    vo.monitor_strategy_text = MonitorStrategyText[data.monitor_strategy] || '未知';

    if (data.fault_level) {
      vo.fault_level_text = FaultLevelText[data.fault_level] || '未知';
    }

    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    if (data.last_data_time) {
      vo.last_data_time = dayjs(data.last_data_time).format('YYYY-MM-DD HH:mm:ss');
    }

    if (data.last_fault_time) {
      vo.last_fault_time = dayjs(data.last_fault_time).format('YYYY-MM-DD HH:mm:ss');
    }

    return vo as DeviceMonitorVO;
  }

  private convertFaultToVO(fault: any): DeviceFaultRecordVO {
    const data = fault.toJSON ? fault.toJSON() : fault;
    const vo: any = { ...data };

    vo.device_type_text = DeviceTypeText[data.device_type] || '未知';
    vo.fault_level_text = FaultLevelText[data.fault_level] || '未知';
    vo.fault_status_text = FaultStatusText[data.fault_status] || '未知';
    vo.occur_time = dayjs(data.occur_time).format('YYYY-MM-DD HH:mm:ss');

    if (data.recover_time) {
      vo.recover_time = dayjs(data.recover_time).format('YYYY-MM-DD HH:mm:ss');
    }

    return vo as DeviceFaultRecordVO;
  }

  private convertLogToVO(log: any): DeviceMonitorLogVO {
    const data = log.toJSON ? log.toJSON() : log;
    const vo: any = { ...data };

    vo.log_type_text = MonitorLogTypeText[data.log_type] || '未知';

    if (data.before_status) {
      vo.before_status_text = DeviceMonitorStatusText[data.before_status] || '未知';
    }
    if (data.after_status) {
      vo.after_status_text = DeviceMonitorStatusText[data.after_status] || '未知';
    }
    if (data.fault_level) {
      vo.fault_level_text = FaultLevelText[data.fault_level] || '未知';
    }

    return vo as DeviceMonitorLogVO;
  }

  private checkFakeOnline(device: DeviceMonitor): { issues: string[]; has_fake_online: boolean; fake_online_count: number } {
    const issues: string[] = [];
    let hasFakeOnline = false;
    let fakeOnlineCount = 0;

    const deviceData = device.toJSON();

    if (deviceData.monitor_status === 1 || deviceData.monitor_status === 2) {
      if (!deviceData.last_data_time) {
        hasFakeOnline = true;
        fakeOnlineCount++;
        issues.push('设备显示在线但从未上报过数据，疑似虚假在线');
      } else {
        const strategyConfig = DEVICE_MONITOR_STRATEGY[deviceData.device_type] || DEVICE_MONITOR_STRATEGY[1];
        const timeoutSeconds = strategyConfig.data_timeout_seconds * 3;
        const now = dayjs();
        const lastData = dayjs(deviceData.last_data_time);
        const delaySeconds = now.diff(lastData, 'second');

        if (delaySeconds > timeoutSeconds && deviceData.connect_status !== 0) {
          hasFakeOnline = true;
          fakeOnlineCount++;
          issues.push(`设备显示在线但数据已中断超过${Math.floor(timeoutSeconds / 60)}分钟，疑似虚假在线`);
        }
      }
    }

    if (deviceData.monitor_status === 3 && !deviceData.fault_code) {
      hasFakeOnline = true;
      fakeOnlineCount++;
      issues.push('设备状态为故障但无故障代码，状态异常');
    }

    return { issues, has_fake_online: hasFakeOnline, fake_online_count: fakeOnlineCount };
  }

  private checkMissedFault(device: DeviceMonitor, faultRecords: DeviceFaultRecord[]): { issues: string[]; missed_fault_count: number; false_alarm_count: number } {
    const issues: string[] = [];
    let missedFaultCount = 0;
    let falseAlarmCount = 0;

    const deviceData = device.toJSON();

    if (deviceData.monitor_status === 3 && deviceData.fault_code) {
      const matchingFault = faultRecords.find(
        f => (f as any).fault_code === deviceData.fault_code && (f as any).fault_status !== 2 && (f as any).fault_status !== 3
      );
      if (!matchingFault) {
        missedFaultCount++;
        issues.push(`设备当前有故障代码【${deviceData.fault_code}】但无对应的未处理故障记录，疑似故障漏报`);
      }
    }

    const pendingFaults = faultRecords.filter(f => (f as any).fault_status === 0 || (f as any).fault_status === 1);
    if (pendingFaults.length > 0 && deviceData.monitor_status !== 3) {
      for (const fault of pendingFaults) {
        const faultData = (fault as any).toJSON ? (fault as any).toJSON() : fault;
        if (faultData.is_false_alarm === 1) {
          falseAlarmCount++;
        } else {
          missedFaultCount++;
        }
      }
      if (missedFaultCount > 0) {
        issues.push(`存在${missedFaultCount}条未处理故障但设备状态非故障，疑似故障记录未同步`);
      }
    }

    const falseAlarms = faultRecords.filter(f => (f as any).is_false_alarm === 1);
    falseAlarmCount += falseAlarms.length;
    if (falseAlarms.length > 0) {
      issues.push(`存在${falseAlarms.length}条误报故障记录`);
    }

    return { issues, missed_fault_count: missedFaultCount, false_alarm_count: falseAlarmCount };
  }

  private checkDataAbnormal(logs: DeviceMonitorLog[]): { issues: string[]; data_tampering_count: number; abnormal_records: number } {
    const issues: string[] = [];
    let dataTamperingCount = 0;
    let abnormalRecords = 0;

    if (logs.length < 2) {
      return { issues, data_tampering_count: dataTamperingCount, abnormal_records: abnormalRecords };
    }

    for (let i = 1; i < logs.length; i++) {
      const curr = (logs[i] as any).toJSON();
      const prev = (logs[i - 1] as any).toJSON();

      const currTime = dayjs(curr.created_at);
      const prevTime = dayjs(prev.created_at);

      if (currTime.isAfter(prevTime)) {
        dataTamperingCount++;
        abnormalRecords++;
      }

      const diffMinutes = prevTime.diff(currTime, 'minute');
      if (diffMinutes < 0 && Math.abs(diffMinutes) > 60) {
        dataTamperingCount++;
        abnormalRecords++;
      }
    }

    if (dataTamperingCount > 0) {
      issues.push(`检测到${dataTamperingCount}条时间戳异常记录，疑似数据篡改`);
    }

    const abnormalLogs = logs.filter(l => {
      const logData = (l as any).toJSON();
      return logData.log_type === 5 || logData.is_alert === 1;
    });
    abnormalRecords += abnormalLogs.length;

    if (abnormalLogs.length > 0) {
      issues.push(`检测到${abnormalLogs.length}条参数异常或告警日志记录`);
    }

    return { issues, data_tampering_count: dataTamperingCount, abnormal_records: abnormalRecords };
  }
}
