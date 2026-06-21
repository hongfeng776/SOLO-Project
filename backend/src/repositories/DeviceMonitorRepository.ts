import { BaseRepository } from './BaseRepository';
import { DeviceMonitor, Organization, User, DeviceMonitorLog, DeviceFaultRecord } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class DeviceMonitorRepository extends BaseRepository<DeviceMonitor> {
  constructor() {
    super(DeviceMonitor);
  }

  async findByArchiveNo(archiveNo: string): Promise<DeviceMonitor | null> {
    return await this.model.findOne({ where: { archive_no: archiveNo } });
  }

  async findBySnCode(snCode: string): Promise<DeviceMonitor | null> {
    return await this.model.findOne({ where: { sn_code: snCode } });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { archive_no: { [Op.like]: `%${params.keyword}%` } },
        { sn_code: { [Op.like]: `%${params.keyword}%` } },
        { device_model: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.archive_no) {
      where.archive_no = { [Op.like]: `%${params.archive_no}%` };
    }

    if (params.sn_code) {
      where.sn_code = { [Op.like]: `%${params.sn_code}%` };
    }

    if (params.device_type !== undefined) {
      where.device_type = params.device_type;
    }

    if (params.monitor_status !== undefined) {
      where.monitor_status = params.monitor_status;
    }

    if (params.fault_level !== undefined) {
      where.fault_level = params.fault_level;
    }

    if (params.connect_status !== undefined) {
      where.connect_status = params.connect_status;
    }

    if (params.monitor_strategy !== undefined) {
      where.monitor_strategy = params.monitor_strategy;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.is_key_device !== undefined) {
      where.is_key_device = params.is_key_device;
    }

    if (params.has_fault !== undefined) {
      if (params.has_fault === 1) {
        where.fault_code = { [Op.ne]: null };
      } else {
        where.fault_code = null;
      }
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  buildFaultQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { fault_no: { [Op.like]: `%${params.keyword}%` } },
        { archive_no: { [Op.like]: `%${params.keyword}%` } },
        { sn_code: { [Op.like]: `%${params.keyword}%` } },
        { fault_description: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.fault_no) {
      where.fault_no = { [Op.like]: `%${params.fault_no}%` };
    }

    if (params.archive_no) {
      where.archive_no = { [Op.like]: `%${params.archive_no}%` };
    }

    if (params.sn_code) {
      where.sn_code = { [Op.like]: `%${params.sn_code}%` };
    }

    if (params.device_type !== undefined) {
      where.device_type = params.device_type;
    }

    if (params.fault_level !== undefined) {
      where.fault_level = params.fault_level;
    }

    if (params.fault_status !== undefined) {
      where.fault_status = params.fault_status;
    }

    if (params.fault_code) {
      where.fault_code = params.fault_code;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.is_false_alarm !== undefined) {
      where.is_false_alarm = params.is_false_alarm;
    }

    if (params.start_time) {
      where.occur_time = {
        ...(where.occur_time || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.occur_time = {
        ...(where.occur_time || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  buildLogQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.device_id) {
      where.device_id = params.device_id;
    }

    if (params.archive_no) {
      where.archive_no = params.archive_no;
    }

    if (params.log_type !== undefined) {
      where.log_type = params.log_type;
    }

    if (params.is_alert !== undefined) {
      where.is_alert = params.is_alert;
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }

  getCreatorInclude(): Includeable {
    return {
      model: User,
      as: 'creator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getMonitorLogsInclude(limit?: number): Includeable {
    const include: any = {
      model: DeviceMonitorLog,
      required: false,
      order: [['created_at', 'DESC']]
    };
    if (limit) {
      include.limit = limit;
    }
    return include;
  }

  getFaultRecordsInclude(limit?: number): Includeable {
    const include: any = {
      model: DeviceFaultRecord,
      required: false,
      order: [['occur_time', 'DESC']]
    };
    if (limit) {
      include.limit = limit;
    }
    return include;
  }
}
