import { BaseRepository } from './BaseRepository';
import { DeviceArchive } from '../models';
import { DeviceArchiveBatch, Organization, User } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class DeviceArchiveRepository extends BaseRepository<DeviceArchive> {
  constructor() {
    super(DeviceArchive);
  }

  async findByArchiveNo(archiveNo: string): Promise<DeviceArchive | null> {
    return await this.model.findOne({ where: { archive_no: archiveNo } });
  }

  async findBySnCode(snCode: string): Promise<DeviceArchive | null> {
    return await this.model.findOne({ where: { sn_code: snCode } });
  }

  async checkDuplicateSnCode(snCode: string, excludeId?: string): Promise<DeviceArchive | null> {
    const where: any = { sn_code: snCode };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return await this.model.findOne({ where });
  }

  async generateArchiveNo(): Promise<string> {
    const prefix = 'DEV';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { archive_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(3, '0');
    }
    return finalNo;
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

    if (params.device_model) {
      where.device_model = { [Op.like]: `%${params.device_model}%` };
    }

    if (params.manufacturer) {
      where.manufacturer = { [Op.like]: `%${params.manufacturer}%` };
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.control_level !== undefined) {
      where.control_level = params.control_level;
    }

    if (params.qualification_status !== undefined) {
      where.qualification_status = params.qualification_status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.purchase_batch) {
      where.purchase_batch = params.purchase_batch;
    }

    if (params.is_old_device !== undefined) {
      where.is_old_device = params.is_old_device;
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

  getBatchInclude(): Includeable {
    return {
      model: DeviceArchiveBatch,
      required: false,
      attributes: ['id', 'batch_no', 'batch_name', 'status']
    };
  }
}
