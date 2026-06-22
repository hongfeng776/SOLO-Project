import { BaseRepository } from './BaseRepository';
import { DeviceWorkOrder, DeviceWorkOrderLog, DeviceMaintenanceTask, Organization, User } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class DeviceWorkOrderRepository extends BaseRepository<DeviceWorkOrder> {
  constructor() {
    super(DeviceWorkOrder);
  }

  async findByOrderNo(orderNo: string): Promise<DeviceWorkOrder | null> {
    return await this.model.findOne({ where: { order_no: orderNo } });
  }

  async generateOrderNo(): Promise<string> {
    const prefix = 'WO';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { order_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(3, '0');
    }
    return finalNo;
  }

  async generateTaskNo(): Promise<string> {
    const prefix = 'MT';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await DeviceMaintenanceTask.count({ where: { task_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(3, '0');
    }
    return finalNo;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { order_no: { [Op.like]: `%${params.keyword}%` } },
        { archive_no: { [Op.like]: `%${params.keyword}%` } },
        { sn_code: { [Op.like]: `%${params.keyword}%` } },
        { fault_code: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.order_no) {
      where.order_no = { [Op.like]: `%${params.order_no}%` };
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

    if (params.order_type !== undefined) {
      where.order_type = params.order_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.maintenance_level !== undefined) {
      where.maintenance_level = params.maintenance_level;
    }

    if (params.acceptance_status !== undefined) {
      where.acceptance_status = params.acceptance_status;
    }

    if (params.assignee_id) {
      where.assignee_id = params.assignee_id;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.is_overdue !== undefined) {
      where.is_overdue = params.is_overdue;
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

  buildTaskQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { task_no: { [Op.like]: `%${params.keyword}%` } },
        { task_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.task_no) {
      where.task_no = { [Op.like]: `%${params.task_no}%` };
    }

    if (params.order_type !== undefined) {
      where.order_type = params.order_type;
    }

    if (params.task_status !== undefined) {
      where.task_status = params.task_status;
    }

    if (params.assignee_id) {
      where.assignee_id = params.assignee_id;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
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

  buildLogQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.order_id) {
      where.order_id = params.order_id;
    }

    if (params.order_no) {
      where.order_no = { [Op.like]: `%${params.order_no}%` };
    }

    if (params.log_type !== undefined) {
      where.log_type = params.log_type;
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

  getAssigneeInclude(): Includeable {
    return {
      model: User,
      as: 'assignee',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getAcceptanceUserInclude(): Includeable {
    return {
      model: User,
      as: 'acceptanceUser',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getLogsInclude(): Includeable {
    return {
      model: DeviceWorkOrderLog,
      required: false,
      order: [['created_at', 'DESC']]
    };
  }

  getTaskOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }

  getTaskCreatorInclude(): Includeable {
    return {
      model: User,
      as: 'creator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getTaskAssigneeInclude(): Includeable {
    return {
      model: User,
      as: 'assignee',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }
}
