import { BaseRepository } from './BaseRepository';
import { OperationLog } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Organization } from '../models';
import dayjs from 'dayjs';

export class OperationLogRepository extends BaseRepository<OperationLog> {
  constructor() {
    super(OperationLog);
  }

  async createLog(data: Partial<OperationLog>): Promise<OperationLog> {
    return await this.model.create(data);
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${params.keyword}%` } },
        { module: { [Op.like]: `%${params.keyword}%` } },
        { operation: { [Op.like]: `%${params.keyword}%` } },
        { ip: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.module) {
      where.module = params.module;
    }

    if (params.operation) {
      where.operation = params.operation;
    }

    if (params.user_id) {
      where.user_id = params.user_id;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.log_type !== undefined) {
      where.log_type = params.log_type;
    }

    if (params.start_time) {
      where.createdAt = {
        ...(where.createdAt || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.createdAt = {
        ...(where.createdAt || {}),
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
}