import { BaseRepository } from './BaseRepository';
import { AuditRecord, AuditRule } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { User } from '../models';
import { Organization } from '../models';
import dayjs from 'dayjs';

export class AuditRecordRepository extends BaseRepository<AuditRecord> {
  constructor() {
    super(AuditRecord);
  }

  async findByBiz(bizType: string, bizId: string): Promise<AuditRecord | null> {
    return await this.model.findOne({
      where: { biz_type: bizType, biz_id: bizId }
    });
  }

  async findPendingByAuditor(auditorId: string): Promise<AuditRecord[]> {
    return await this.model.findAll({
      where: {
        status: { [Op.in]: [0, 1] },
        [Op.or]: [
          { auditor_id: auditorId },
          { next_auditor_id: auditorId }
        ]
      },
      order: [['submit_time', 'DESC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { biz_no: { [Op.like]: `%${params.keyword}%` } },
        { biz_type: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.biz_type) {
      where.biz_type = params.biz_type;
    }

    if (params.type !== undefined) {
      where.type = params.type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.result !== undefined) {
      where.result = params.result;
    }

    if (params.level !== undefined) {
      where.level = params.level;
    }

    if (params.auditor_id) {
      where[Op.or] = [
        { auditor_id: params.auditor_id },
        { next_auditor_id: params.auditor_id }
      ];
    }

    if (params.submitter_id) {
      where.submitter_id = params.submitter_id;
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

  getSubmitterInclude(): Includeable {
    return {
      model: User,
      as: 'submitter',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getAuditorInclude(): Includeable {
    return {
      model: User,
      as: 'auditor',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }
}

export class AuditRuleRepository extends BaseRepository<AuditRule> {
  constructor() {
    super(AuditRule);
  }

  async findByCode(code: string): Promise<AuditRule | null> {
    return await this.model.findOne({ where: { code } });
  }

  async findMatchingRules(bizType: string, amount: number): Promise<AuditRule[]> {
    return await this.model.findAll({
      where: {
        biz_type: bizType,
        status: 1,
        [Op.or]: [
          {
            min_amount: { [Op.lte]: amount },
            max_amount: { [Op.gte]: amount }
          },
          {
            min_amount: { [Op.lte]: amount },
            max_amount: 0
          },
          {
            rule_type: 2,
            condition_expression: { [Op.ne]: null }
          }
        ]
      },
      order: [['sort', 'ASC'], ['audit_level', 'ASC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.biz_type) {
      where.biz_type = params.biz_type;
    }

    if (params.rule_type !== undefined) {
      where.rule_type = params.rule_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.audit_level !== undefined) {
      where.audit_level = params.audit_level;
    }

    return where;
  }
}