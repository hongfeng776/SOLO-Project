import { BaseRepository } from './BaseRepository';
import { AbnormalTransaction, MonitorRule, MonitorAlertBatch, MonitorTraceLog } from '../models';
import { Customer, User, Organization } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class AbnormalTransactionRepository extends BaseRepository<AbnormalTransaction> {
  constructor() {
    super(AbnormalTransaction);
  }

  async findByAlertNo(alertNo: string): Promise<AbnormalTransaction | null> {
    return await this.model.findOne({ where: { alert_no: alertNo } });
  }

  async findByTransactionId(transactionId: string): Promise<AbnormalTransaction[]> {
    return await this.model.findAll({
      where: { transaction_id: transactionId },
      order: [['created_at', 'DESC']]
    });
  }

  async findByCustomerId(customerId: string): Promise<AbnormalTransaction[]> {
    return await this.model.findAll({
      where: { customer_id: customerId },
      order: [['created_at', 'DESC']]
    });
  }

  async findByBatchId(batchId: string): Promise<AbnormalTransaction[]> {
    return await this.model.findAll({ where: { batch_id: batchId } });
  }

  async generateAlertNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ATM${now}${random}`;
  }

  async countPendingByCustomerId(customerId: string): Promise<number> {
    return await this.model.count({
      where: { customer_id: customerId, status: 0 }
    });
  }

  async countByAlertType(alertType: number, startTime?: string, endTime?: string): Promise<number> {
    const where: any = { alert_type: alertType };
    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = dayjs(startTime).startOf('day').toDate();
      if (endTime) where.created_at[Op.lte] = dayjs(endTime).endOf('day').toDate();
    }
    return await this.model.count({ where });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { alert_no: { [Op.like]: `%${params.keyword}%` } },
        { transaction_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.alert_no) {
      where.alert_no = { [Op.like]: `%${params.alert_no}%` };
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.alert_type !== undefined) {
      where.alert_type = params.alert_type;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.intercept_status !== undefined) {
      where.intercept_status = params.intercept_status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.batch_id) {
      where.batch_id = params.batch_id;
    }

    if (params.is_false_positive !== undefined) {
      where.is_false_positive = params.is_false_positive;
    }

    if (params.min_amount !== undefined) {
      where.transaction_amount = { ...where.transaction_amount, [Op.gte]: params.min_amount };
    }

    if (params.max_amount !== undefined) {
      where.transaction_amount = { ...where.transaction_amount, [Op.lte]: params.max_amount };
    }

    if (params.start_time) {
      where.transaction_time = {
        ...where.transaction_time,
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.transaction_time = {
        ...where.transaction_time,
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'risk_level', 'status']
    };
  }

  getHandlerInclude(): Includeable {
    return {
      model: User,
      as: 'handler',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }

  getBatchInclude(): Includeable {
    return {
      model: MonitorAlertBatch,
      required: false,
      attributes: ['id', 'batch_no', 'batch_name', 'batch_type', 'status']
    };
  }
}

export class MonitorRuleRepository extends BaseRepository<MonitorRule> {
  constructor() {
    super(MonitorRule);
  }

  async findByRuleCode(ruleCode: string): Promise<MonitorRule | null> {
    return await this.model.findOne({ where: { rule_code: ruleCode } });
  }

  async findAllEnabled(): Promise<MonitorRule[]> {
    return await this.model.findAll({
      where: { is_enabled: 1, status: 1 },
      order: [['priority', 'DESC'], ['sort_order', 'ASC']]
    });
  }

  async findByRuleType(ruleType: number): Promise<MonitorRule[]> {
    return await this.model.findAll({
      where: { rule_type: ruleType, is_enabled: 1, status: 1 },
      order: [['priority', 'DESC'], ['sort_order', 'ASC']]
    });
  }

  async findRequiredRules(): Promise<MonitorRule[]> {
    return await this.model.findAll({
      where: { is_required: 1, status: 1 },
      order: [['sort_order', 'ASC']]
    });
  }

  async incrementTriggerCount(ruleId: string): Promise<void> {
    await this.model.increment('trigger_count', { by: 1, where: { id: ruleId } });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { rule_code: { [Op.like]: `%${params.keyword}%` } },
        { rule_name: { [Op.like]: `%${params.keyword}%` } },
        { description: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.rule_type !== undefined) {
      where.rule_type = params.rule_type;
    }

    if (params.dimension !== undefined) {
      where.dimension = params.dimension;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.is_enabled !== undefined) {
      where.is_enabled = params.is_enabled;
    }

    return where;
  }
}

export class MonitorAlertBatchRepository extends BaseRepository<MonitorAlertBatch> {
  constructor() {
    super(MonitorAlertBatch);
  }

  async findByBatchNo(batchNo: string): Promise<MonitorAlertBatch | null> {
    return await this.model.findOne({ where: { batch_no: batchNo } });
  }

  async generateBatchNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MAB${now}${random}`;
  }

  async findPendingBatches(): Promise<MonitorAlertBatch[]> {
    return await this.model.findAll({
      where: { status: { [Op.in]: [0, 1] } },
      order: [['created_at', 'ASC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { batch_no: { [Op.like]: `%${params.keyword}%` } },
        { batch_name: { [Op.like]: `%${params.keyword}%` } },
        { remark: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.batch_type !== undefined) {
      where.batch_type = params.batch_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.start_time) {
      where.created_at = {
        ...where.created_at,
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...where.created_at,
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCreatorInclude(): Includeable {
    return {
      model: User,
      as: 'creator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }
}

export class MonitorTraceLogRepository extends BaseRepository<MonitorTraceLog> {
  constructor() {
    super(MonitorTraceLog);
  }

  async findByAlertId(alertId: string): Promise<MonitorTraceLog[]> {
    return await this.model.findAll({
      where: { alert_id: alertId },
      order: [['created_at', 'DESC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.alert_id) {
      where.alert_id = params.alert_id;
    }

    if (params.trace_type !== undefined) {
      where.trace_type = params.trace_type;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.start_time) {
      where.created_at = {
        ...where.created_at,
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...where.created_at,
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getAlertInclude(): Includeable {
    return {
      model: AbnormalTransaction,
      required: false,
      attributes: ['id', 'alert_no', 'transaction_no', 'customer_name', 'alert_type', 'risk_level', 'status']
    };
  }

  getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getRuleInclude(): Includeable {
    return {
      model: MonitorRule,
      required: false,
      attributes: ['id', 'rule_code', 'rule_name', 'rule_type']
    };
  }
}
