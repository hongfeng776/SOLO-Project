import { BaseRepository } from './BaseRepository';
import { AccountOpening } from '../models';
import { WhereOptions, Op, Includeable, fn, col } from 'sequelize';
import { Customer, Organization, User } from '../models';
import dayjs from 'dayjs';

export class AccountOpeningRepository extends BaseRepository<AccountOpening> {
  constructor() {
    super(AccountOpening);
  }

  async findByOpeningNo(openingNo: string): Promise<AccountOpening | null> {
    return await this.model.findOne({ where: { opening_no: openingNo } });
  }

  async findByIdCardNo(idCardNo: string): Promise<AccountOpening[]> {
    return await this.model.findAll({ where: { id_card_no: idCardNo } });
  }

  async countRecentByIdCard(idCardNo: string, days = 30): Promise<number> {
    const since = dayjs().subtract(days, 'day').toDate();
    return await this.model.count({
      where: {
        id_card_no: idCardNo,
        created_at: { [Op.gte]: since },
        status: { [Op.ne]: 7 }
      }
    });
  }

  async generateOpeningNo(): Promise<string> {
    const prefix = 'AO';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${datePart}${random}`;
  }

  async aggregateByStatus(): Promise<any[]> {
    return await this.model.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
  }

  async aggregateByAccountType(): Promise<any[]> {
    return await this.model.findAll({
      attributes: [
        'account_type',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['account_type'],
      raw: true
    });
  }

  async aggregateByDay(days: number = 7): Promise<any[]> {
    const since = dayjs().subtract(days - 1, 'day').startOf('day').toDate();
    return await this.model.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: since }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { opening_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { id_card_no: { [Op.like]: `%${params.keyword}%` } },
        { mobile: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.opening_no) {
      where.opening_no = { [Op.like]: `%${params.opening_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.id_card_no) {
      where.id_card_no = { [Op.like]: `%${params.id_card_no}%` };
    }

    if (params.account_type !== undefined) {
      where.account_type = params.account_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.channel_code) {
      where.channel_code = params.channel_code;
    }

    if (params.is_isolated !== undefined) {
      where.is_isolated = params.is_isolated;
    }

    if (params.submit_org_id) {
      where.submit_org_id = params.submit_org_id;
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
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

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'risk_level']
    };
  }

  getTargetOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'target_org',
      required: false,
      attributes: ['id', 'name']
    };
  }

  getSubmitOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'submit_org',
      required: false,
      attributes: ['id', 'name']
    };
  }

  getSubmitterInclude(): Includeable {
    return {
      model: User,
      as: 'submitter',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }
}
