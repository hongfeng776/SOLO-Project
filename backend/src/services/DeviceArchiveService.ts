import {
  DeviceArchiveRepository,
  OrganizationRepository,
  UserRepository
} from '../repositories';
import {
  DeviceArchiveType,
  DeviceArchiveStatus,
  ControlLevel,
  QualificationStatus,
  DeviceArchiveTypeText,
  DeviceArchiveStatusText,
  ControlLevelText,
  QualificationStatusText,
  DEVICE_TYPE_CONFIG,
  OLD_DEVICE_THRESHOLD_YEARS,
  DevicePreCheckRequest,
  DevicePreCheckResult,
  CreateDeviceArchiveRequest,
  DeviceArchiveQueryParams,
  DeviceArchiveVO,
  BatchDeviceArchiveItem,
  BatchDeviceArchiveRequest,
  BatchDeviceArchiveResultItem,
  DeviceTraceRequest,
  DeviceTraceResult,
  DeviceQualificationItem
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { DeviceArchiveTraceLog } from '../models/DeviceArchiveTraceLog';
import { DeviceArchive as DeviceArchiveModel, Organization, User, DeviceArchiveBatch } from '../models';

export class DeviceArchiveService {
  private deviceArchiveRepository: DeviceArchiveRepository;
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.deviceArchiveRepository = new DeviceArchiveRepository();
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
  }

  async getDeviceArchiveConfig(): Promise<any> {
    return {
      device_types: Object.entries(DeviceArchiveTypeText).map(([value, label]) => ({ value: Number(value), label })),
      statuses: Object.entries(DeviceArchiveStatusText).map(([value, label]) => ({ value: Number(value), label })),
      control_levels: Object.entries(ControlLevelText).map(([value, label]) => ({ value: Number(value), label })),
      qualification_statuses: Object.entries(QualificationStatusText).map(([value, label]) => ({ value: Number(value), label })),
      device_type_config: DEVICE_TYPE_CONFIG
    };
  }

  async preCheckDevice(request: DevicePreCheckRequest, currentUserId?: string): Promise<DevicePreCheckResult> {
    const { sn_code, device_type, device_model, org_id, install_location, usage_scene, procurement_date } = request;
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';

    if (!sn_code) {
      throwValidationError('SN码不能为空');
    }

    let snUnique = true;
    const existingDevice = await this.deviceArchiveRepository.findOne({ sn_code });
    if (existingDevice) {
      snUnique = false;
      blocked = true;
      blockReason = `SN码已存在，重复建档被阻止（已有档案编号：${(existingDevice as any).archive_no}）`;
    }

    let modelCompliant = true;
    let modelCompliantDetail: string | undefined;
    if (!device_model) {
      modelCompliant = false;
      modelCompliantDetail = '设备型号不能为空';
      blocked = true;
      blockReason = '设备型号不能为空';
    }

    const typeConfig = DEVICE_TYPE_CONFIG[device_type];
    let qualificationComplete = true;
    const missingQualifications: string[] = [];

    if (typeConfig) {
      const required = typeConfig.qualification_required || [];
      for (const qual of required) {
        missingQualifications.push(qual);
      }
      if (required.length > 0) {
        qualificationComplete = false;
        if (!blocked) {
          warnings.push(`设备类型【${DeviceArchiveTypeText[device_type]}】需要以下资质：${required.join('、')}，当前尚未提交`);
        }
      }
    }

    let orgMatched = true;
    let orgMatchDetail: string | undefined;
    if (org_id) {
      const org = await this.organizationRepository.findById(org_id);
      if (!org) {
        orgMatched = false;
        orgMatchDetail = '指定的归属网点不存在';
        blocked = true;
        blockReason = '指定的归属网点不存在';
      }
    }

    let locationMatched = true;
    let locationMatchDetail: string | undefined;
    if (!install_location && org_id) {
      locationMatched = true;
      locationMatchDetail = '未提供安装位置，默认通过';
      warnings.push('未提供安装位置信息，建议补充');
    }

    let sceneMatched = true;
    let sceneMatchDetail: string | undefined;
    if (usage_scene && typeConfig) {
      const idealSceneMap: Record<number, string[]> = {
        1: ['outdoor', 'lobby'],
        2: ['lobby', 'counter'],
        3: ['counter'],
        4: ['mobile']
      };
      const idealScenes = idealSceneMap[device_type] || [];
      if (idealScenes.length > 0 && !idealScenes.includes(usage_scene)) {
        sceneMatched = false;
        sceneMatchDetail = `设备类型【${DeviceArchiveTypeText[device_type]}】的理想使用场景为：${idealScenes.join('、')}，当前场景【${usage_scene}】可能不匹配`;
        warnings.push(sceneMatchDetail);
      }
    }

    let isOldDevice = false;
    if (procurement_date) {
      const procurementDayjs = dayjs(procurement_date);
      const yearsSinceProcurement = dayjs().diff(procurementDayjs, 'year');
      if (yearsSinceProcurement >= OLD_DEVICE_THRESHOLD_YEARS) {
        isOldDevice = true;
        warnings.push(`设备采购已超过${OLD_DEVICE_THRESHOLD_YEARS}年，判定为老旧设备`);
      }
    }

    let controlLevel: ControlLevel = typeConfig ? typeConfig.control_level : 1;
    if (isOldDevice && controlLevel < 3) {
      controlLevel = (controlLevel + 1) as ControlLevel;
    }

    return {
      passed: !blocked,
      blocked,
      block_reason: blockReason || undefined,
      warnings,
      sn_unique: snUnique,
      model_compliant: modelCompliant,
      model_compliant_detail: modelCompliantDetail,
      qualification_complete: qualificationComplete,
      missing_qualifications: missingQualifications,
      org_matched: orgMatched,
      org_match_detail: orgMatchDetail,
      location_matched: locationMatched,
      location_match_detail: locationMatchDetail,
      scene_matched: sceneMatched,
      scene_match_detail: sceneMatchDetail,
      device_type_config: typeConfig,
      is_old_device: isOldDevice,
      control_level: controlLevel,
      control_level_text: ControlLevelText[controlLevel] || '未知'
    };
  }

  async getDeviceArchiveList(params: DeviceArchiveQueryParams, currentUserId?: string, userOrgId?: string): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.deviceArchiveRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      { model: Organization, required: false, attributes: ['id', 'name'] },
      { model: User, as: 'creator', required: false, attributes: ['id', 'username', 'real_name'] },
      { model: DeviceArchiveBatch, required: false, attributes: ['id', 'batch_no', 'batch_name'] }
    ];

    const result = await this.deviceArchiveRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: DeviceArchiveVO[] = result.list.map(d => this.convertToVO(d));

    return { ...result, list };
  }

  async getDeviceArchiveById(id: string): Promise<DeviceArchiveVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的设备档案ID');
    }

    const device = await this.deviceArchiveRepository.findById(id, {
      include: [
        { model: Organization, required: false, attributes: ['id', 'name'] },
        { model: User, as: 'creator', required: false, attributes: ['id', 'username', 'real_name'] },
        { model: DeviceArchiveBatch, required: false, attributes: ['id', 'batch_no', 'batch_name'] }
      ]
    });

    if (!device) {
      throwNotFoundError('设备档案不存在');
    }

    return this.convertToVO(device);
  }

  async createDeviceArchive(request: CreateDeviceArchiveRequest, operatorId: string, orgId?: string): Promise<DeviceArchiveVO> {
    const preCheckResult = await this.preCheckDevice({
      sn_code: request.sn_code,
      device_type: request.device_type,
      device_model: request.device_model,
      org_id: request.org_id || orgId,
      install_location: request.install_location,
      usage_scene: request.usage_scene,
      purchase_batch: request.purchase_batch,
      procurement_date: request.procurement_date
    }, operatorId);

    if (preCheckResult.blocked) {
      throwBusinessError(preCheckResult.block_reason || '前置校验未通过');
    }

    const archiveNo = await this.deviceArchiveRepository.generateArchiveNo();

    const typeConfig = DEVICE_TYPE_CONFIG[request.device_type];
    const controlLevel = preCheckResult.control_level;
    const operationCycleDays = typeConfig ? typeConfig.operation_cycle_days : 90;

    let isOldDevice = preCheckResult.is_old_device ? 1 : 0;
    let isKeyOperation = 0;

    if (isOldDevice === 1) {
      isKeyOperation = 1;
    }

    if (typeConfig && isOldDevice === 0) {
      const threshold = typeConfig.key_operation_threshold_years;
      if (request.procurement_date) {
        const years = dayjs().diff(dayjs(request.procurement_date), 'year');
        if (years >= threshold) {
          isKeyOperation = 1;
        }
      }
    }

    let qualificationStatus: QualificationStatus = 0;
    if (request.qualifications && request.qualifications.length > 0) {
      const allValid = request.qualifications.every(q => {
        if (q.expire_date) {
          return dayjs(q.expire_date).isAfter(dayjs());
        }
        return true;
      });
      qualificationStatus = allValid ? 1 : 2;
    }

    const device = await this.deviceArchiveRepository.create({
      archive_no: archiveNo,
      sn_code: request.sn_code,
      device_type: request.device_type,
      device_model: request.device_model,
      manufacturer: request.manufacturer,
      production_date: request.production_date ? dayjs(request.production_date).toDate() : undefined,
      procurement_date: request.procurement_date ? dayjs(request.procurement_date).toDate() : undefined,
      purchase_batch: request.purchase_batch,
      org_id: request.org_id || orgId,
      org_name: request.org_name,
      install_location: request.install_location,
      usage_scene: request.usage_scene,
      network_date: request.network_date ? dayjs(request.network_date).toDate() : undefined,
      control_level: controlLevel,
      operation_cycle_days: operationCycleDays,
      qualification_status: qualificationStatus,
      qualifications: request.qualifications ? JSON.stringify(request.qualifications) : undefined,
      is_old_device: isOldDevice,
      is_key_operation: isKeyOperation,
      status: 1,
      creator_id: operatorId,
      remark: request.remark
    });

    await DeviceArchiveTraceLog.create({
      device_id: device.id,
      archive_no: archiveNo,
      trace_type: 3,
      operator_id: operatorId,
      operation_detail: JSON.stringify({
        sn_code: request.sn_code,
        device_type: request.device_type,
        device_model: request.device_model
      }),
      before_status: 0,
      after_status: 1,
      before_control_level: controlLevel,
      after_control_level: controlLevel,
      is_compliant: preCheckResult.passed ? 1 : 0,
      remark: '建档操作'
    } as any);

    return this.getDeviceArchiveById(device.id);
  }

  async batchDeviceArchive(request: BatchDeviceArchiveRequest, operatorId: string, userRoles: string[] = []): Promise<{ success_count: number; fail_count: number; details: BatchDeviceArchiveResultItem[] }> {
    const { items } = request;

    if (!items || items.length === 0) {
      throwValidationError('请选择要建档的设备');
    }

    const details: BatchDeviceArchiveResultItem[] = [];
    let success = 0;
    let fail = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = i + 1;

      try {
        const preCheckResult = await this.preCheckDevice({
          sn_code: item.sn_code,
          device_type: item.device_type,
          device_model: item.device_model,
          org_id: item.org_id,
          install_location: item.install_location,
          usage_scene: item.usage_scene,
          purchase_batch: request.purchase_batch,
          procurement_date: item.procurement_date
        }, operatorId);

        if (preCheckResult.blocked) {
          fail++;
          details.push({
            index,
            success: false,
            error: preCheckResult.block_reason || '前置校验未通过',
            pre_check_result: preCheckResult
          });
          continue;
        }

        const warningText = preCheckResult.warnings.length > 0 ? preCheckResult.warnings.join('；') : undefined;

        const typeConfig = DEVICE_TYPE_CONFIG[item.device_type];
        const controlLevel = preCheckResult.control_level;
        const operationCycleDays = typeConfig ? typeConfig.operation_cycle_days : 90;

        let isOldDevice = preCheckResult.is_old_device ? 1 : 0;
        let isKeyOperation = 0;

        if (isOldDevice === 1) {
          isKeyOperation = 1;
        }

        const archiveNo = await this.deviceArchiveRepository.generateArchiveNo();

        const device = await this.deviceArchiveRepository.create({
          archive_no: archiveNo,
          sn_code: item.sn_code,
          device_type: item.device_type,
          device_model: item.device_model,
          manufacturer: item.manufacturer,
          production_date: item.production_date ? dayjs(item.production_date).toDate() : undefined,
          procurement_date: item.procurement_date ? dayjs(item.procurement_date).toDate() : undefined,
          purchase_batch: request.purchase_batch,
          org_id: item.org_id,
          install_location: item.install_location,
          usage_scene: item.usage_scene,
          control_level: controlLevel,
          operation_cycle_days: operationCycleDays,
          qualification_status: 0,
          is_old_device: isOldDevice,
          is_key_operation: isKeyOperation,
          status: 1,
          creator_id: operatorId,
          remark: item.remark || request.remark
        });

        await DeviceArchiveTraceLog.create({
          device_id: device.id,
          archive_no: archiveNo,
          trace_type: 3,
          operator_id: operatorId,
          operation_detail: JSON.stringify({
            sn_code: item.sn_code,
            device_type: item.device_type,
            device_model: item.device_model,
            batch: true
          }),
          before_status: 0,
          after_status: 1,
          before_control_level: controlLevel,
          after_control_level: controlLevel,
          is_compliant: preCheckResult.passed ? 1 : 0,
          remark: '批量建档操作'
        } as any);

        success++;
        details.push({
          index,
          success: true,
          archive_id: device.id,
          archive_no: archiveNo,
          warning: warningText,
          is_old_device: preCheckResult.is_old_device,
          pre_check_result: preCheckResult
        });
      } catch (err: any) {
        fail++;
        details.push({
          index,
          success: false,
          error: err?.message || '建档失败'
        });
      }
    }

    return { success_count: success, fail_count: fail, details };
  }

  async traceDeviceArchive(request: DeviceTraceRequest): Promise<DeviceTraceResult> {
    const { sn_code, archive_no, org_id, device_type, start_time, end_time } = request;

    if (!sn_code && !archive_no && !org_id) {
      throwValidationError('请至少提供SN码、档案编号或归属网点中的一项');
    }

    const where: any = {};
    if (sn_code) where.sn_code = sn_code;
    if (archive_no) where.archive_no = archive_no;
    if (org_id) where.org_id = org_id;
    if (device_type !== undefined) where.device_type = device_type;
    if (start_time) {
      where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(start_time).startOf('day').toDate() };
    }
    if (end_time) {
      where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(end_time).endOf('day').toDate() };
    }

    const include = [
      { model: Organization, required: false, attributes: ['id', 'name'] },
      { model: User, as: 'creator', required: false, attributes: ['id', 'username', 'real_name'] },
      { model: DeviceArchiveBatch, required: false, attributes: ['id', 'batch_no', 'batch_name'] }
    ];

    const devices = await this.deviceArchiveRepository.findByWhere(where, {
      include,
      order: [['created_at', 'DESC']]
    });

    if (devices.length === 0) {
      return {
        query_params: request,
        total_count: 0,
        records: [],
        duplicate_check: { has_duplicate: false, duplicates: [] },
        fake_device_check: { has_fake: false, fakes: [] },
        qualification_check: { has_expired: false, expired_items: [] },
        validation_passed: true,
        risk_prompts: ['未找到匹配的设备档案记录']
      };
    }

    const deviceVOs = devices.map(d => this.convertToVO(d));

    const duplicates: any[] = [];
    const snMap = new Map<string, any[]>();
    deviceVOs.forEach(d => {
      const key = d.sn_code;
      if (!snMap.has(key)) snMap.set(key, []);
      snMap.get(key)!.push(d);
    });
    snMap.forEach((group, key) => {
      if (group.length > 1) {
        group.forEach((d, idx) => {
          if (idx > 0) {
            duplicates.push({
              archive_no: d.archive_no,
              sn_code: d.sn_code,
              device_type: d.device_type,
              create_time: dayjs(d.created_at).format('YYYY-MM-DD HH:mm:ss')
            });
          }
        });
      }
    });

    const fakes: any[] = [];
    deviceVOs.forEach(d => {
      const issues: string[] = [];
      if (!d.manufacturer) issues.push('生产厂家为空');
      if (!d.device_model) issues.push('设备型号为空');
      if (issues.length > 0) {
        fakes.push({
          archive_no: d.archive_no,
          sn_code: d.sn_code,
          issue: issues.join('、'),
          detail: `设备档案【${d.archive_no}】存在信息不完整：${issues.join('、')}，可能为虚假设备`
        });
      }
    });

    const expiredItems: any[] = [];
    const now = dayjs();
    deviceVOs.forEach(d => {
      const qualStr = (d as any).qualifications;
      if (qualStr) {
        try {
          const quals: DeviceQualificationItem[] = typeof qualStr === 'string' ? JSON.parse(qualStr) : qualStr;
          if (Array.isArray(quals)) {
            quals.forEach(q => {
              if (q.expire_date) {
                const expireDay = dayjs(q.expire_date);
                if (expireDay.isBefore(now)) {
                  expiredItems.push({
                    archive_no: d.archive_no,
                    sn_code: d.sn_code,
                    qualification_type: q.qualification_type,
                    qualification_name: q.qualification_name,
                    expire_date: expireDay.format('YYYY-MM-DD'),
                    overdue_days: now.diff(expireDay, 'day')
                  });
                }
              }
            });
          }
        } catch (e) {
        }
      }
    });

    const riskPrompts: string[] = [];
    if (duplicates.length > 0) {
      riskPrompts.push(`检测到 ${duplicates.length} 条疑似重复建档记录，请核实`);
    }
    if (fakes.length > 0) {
      riskPrompts.push(`检测到 ${fakes.length} 条疑似虚假设备记录，请核实`);
    }
    if (expiredItems.length > 0) {
      riskPrompts.push(`检测到 ${expiredItems.length} 项过期资质，请及时更新`);
    }

    const validationPassed = duplicates.length === 0 && fakes.length === 0 && expiredItems.length === 0;

    return {
      query_params: request,
      total_count: deviceVOs.length,
      records: deviceVOs,
      duplicate_check: {
        has_duplicate: duplicates.length > 0,
        duplicates
      },
      fake_device_check: {
        has_fake: fakes.length > 0,
        fakes
      },
      qualification_check: {
        has_expired: expiredItems.length > 0,
        expired_items: expiredItems
      },
      validation_passed: validationPassed,
      risk_prompts: riskPrompts
    };
  }

  private convertToVO(d: any): DeviceArchiveVO {
    const data = d.toJSON ? d.toJSON() : d;
    const vo: DeviceArchiveVO = { ...data };

    if (data.organization) {
      vo.org_name_resolved = data.organization.name;
    }

    if (data.creator) {
      vo.creator_name = data.creator.real_name || data.creator.username;
    }

    vo.device_type_text = DeviceArchiveTypeText[data.device_type] || '未知';
    vo.status_text = DeviceArchiveStatusText[data.status] || '未知';
    vo.control_level_text = ControlLevelText[data.control_level] || '未知';
    vo.qualification_status_text = QualificationStatusText[data.qualification_status] || '未知';

    if (data.operation_cycle_days && data.network_date) {
      const networkDay = dayjs(data.network_date);
      const nextOperationDay = networkDay.add(data.operation_cycle_days, 'day');
      vo.remaining_operation_days = Math.max(0, nextOperationDay.diff(dayjs(), 'day'));
    }

    if (data.qualifications) {
      try {
        const quals = typeof data.qualifications === 'string' ? JSON.parse(data.qualifications) : data.qualifications;
        vo.qualification_items = Array.isArray(quals) ? quals : undefined;
      } catch (e) {
        vo.qualification_items = undefined;
      }
    }

    return vo;
  }
}
