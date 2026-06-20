import { BaseRepository } from './BaseRepository';
import { CustomerPrivacyRule, CustomerPrivacyLog, Organization, Customer, CorporateProfile } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class CustomerPrivacyRuleRepository extends BaseRepository<CustomerPrivacyRule> {
  constructor() {
    super(CustomerPrivacyRule);
  }

  async findByRuleCode(ruleCode: string): Promise<CustomerPrivacyRule | null> {
    return await this.model.findOne({ where: { rule_code: ruleCode } });
  }

  async findMatchingRule(
    customerLevel: number,
    sensitivityLevel: number,
    operatorPosition: number,
    sceneType: number
  ): Promise<CustomerPrivacyRule | null> {
    return await this.model.findOne({
      where: {
        status: 1,
        sensitivity_level: { [Op.lte]: sensitivityLevel },
        scene_type: sceneType,
        [Op.and]: [
          {
            [Op.or]: [
              { customer_level: 0 },
              { customer_level: customerLevel }
            ]
          },
          {
            [Op.or]: [
              { operator_position: 0 },
              { operator_position: operatorPosition }
            ]
          },
          {
            [Op.or]: [
              { is_global: 1 },
              { effective_time: { [Op.lte]: new Date() } }
            ]
          },
          {
            [Op.or]: [
              { expire_time: null },
              { expire_time: { [Op.gte]: new Date() } }
            ]
          }
        ]
      },
      order: [
        ['is_global', 'DESC'],
        ['customer_level', 'DESC'],
        ['sensitivity_level', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
  }

  async findGlobalRules(): Promise<CustomerPrivacyRule[]> {
    return await this.model.findAll({
      where: { is_global: 1, status: 1 },
      order: [['sensitivity_level', 'DESC'], ['customer_level', 'DESC']]
    });
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

    if (params.rule_code) {
      where.rule_code = { [Op.like]: `%${params.rule_code}%` };
    }

    if (params.rule_name) {
      where.rule_name = { [Op.like]: `%${params.rule_name}%` };
    }

    if (params.customer_level !== undefined && params.customer_level !== null) {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { customer_level: 0 },
        { customer_level: params.customer_level }
      ];
    }

    if (params.sensitivity_level !== undefined && params.sensitivity_level !== null) {
      where.sensitivity_level = params.sensitivity_level;
    }

    if (params.operator_position !== undefined && params.operator_position !== null) {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { operator_position: 0 },
        { operator_position: params.operator_position }
      ];
    }

    if (params.scene_type !== undefined && params.scene_type !== null) {
      where.scene_type = params.scene_type;
    }

    if (params.is_global !== undefined && params.is_global !== null) {
      where.is_global = params.is_global;
    }

    if (params.status !== undefined && params.status !== null) {
      where.status = params.status;
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

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }
}

export class CustomerPrivacyLogRepository extends BaseRepository<CustomerPrivacyLog> {
  constructor() {
    super(CustomerPrivacyLog);
  }

  async findByLogNo(logNo: string): Promise<CustomerPrivacyLog | null> {
    return await this.model.findOne({ where: { log_no: logNo } });
  }

  async findByCustomerId(customerId: string, startTime?: string, endTime?: string): Promise<CustomerPrivacyLog[]> {
    const where: any = { customer_id: customerId };
    if (startTime) {
      where.operation_time = { [Op.gte]: dayjs(startTime).startOf('day').toDate() };
    }
    if (endTime) {
      where.operation_time = {
        ...(where.operation_time || {}),
        [Op.lte]: dayjs(endTime).endOf('day').toDate()
      };
    }
    return await this.model.findAll({
      where,
      order: [['operation_time', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async findByCorporateId(corporateId: string, startTime?: string, endTime?: string): Promise<CustomerPrivacyLog[]> {
    const where: any = { corporate_id: corporateId };
    if (startTime) {
      where.operation_time = { [Op.gte]: dayjs(startTime).startOf('day').toDate() };
    }
    if (endTime) {
      where.operation_time = {
        ...(where.operation_time || {}),
        [Op.lte]: dayjs(endTime).endOf('day').toDate()
      };
    }
    return await this.model.findAll({
      where,
      order: [['operation_time', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async findByOperatorId(operatorId: string, startTime?: string, endTime?: string): Promise<CustomerPrivacyLog[]> {
    const where: any = { operator_id: operatorId };
    if (startTime) {
      where.operation_time = { [Op.gte]: dayjs(startTime).startOf('day').toDate() };
    }
    if (endTime) {
      where.operation_time = {
        ...(where.operation_time || {}),
        [Op.lte]: dayjs(endTime).endOf('day').toDate()
      };
    }
    return await this.model.findAll({
      where,
      order: [['operation_time', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async countHighFrequencyOperations(
    operatorId: string,
    startTime: Date,
    endTime: Date,
    threshold: number = 50
  ): Promise<number> {
    return await this.model.count({
      where: {
        operator_id: operatorId,
        operation_time: { [Op.between]: [startTime, endTime] },
        is_blocked: 0
      }
    });
  }

  async countMaliciousExports(
    operatorId: string,
    startTime: Date,
    endTime: Date,
    threshold: number = 100
  ): Promise<number> {
    return await this.model.count({
      where: {
        operator_id: operatorId,
        operation_type: 2,
        operation_time: { [Op.between]: [startTime, endTime] },
        view_count: { [Op.gte]: threshold },
        is_blocked: 0
      }
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { log_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { operator_name: { [Op.like]: `%${params.keyword}%` } },
        { operation_purpose: { [Op.like]: `%${params.keyword}%` } },
        { block_reason: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.log_no) {
      where.log_no = { [Op.like]: `%${params.log_no}%` };
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.corporate_id) {
      where.corporate_id = params.corporate_id;
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.customer_type !== undefined && params.customer_type !== null) {
      where.customer_type = params.customer_type;
    }

    if (params.customer_level !== undefined && params.customer_level !== null) {
      where.customer_level = params.customer_level;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.operator_name) {
      where.operator_name = { [Op.like]: `%${params.operator_name}%` };
    }

    if (params.operator_position !== undefined && params.operator_position !== null) {
      where.operator_position = params.operator_position;
    }

    if (params.scene_type !== undefined && params.scene_type !== null) {
      where.scene_type = params.scene_type;
    }

    if (params.operation_type !== undefined && params.operation_type !== null) {
      where.operation_type = params.operation_type;
    }

    if (params.is_blocked !== undefined && params.is_blocked !== null) {
      where.is_blocked = params.is_blocked;
    }

    if (params.block_type !== undefined && params.block_type !== null) {
      where.block_type = params.block_type;
    }

    if (params.is_unauthorized !== undefined && params.is_unauthorized !== null) {
      where.is_unauthorized = params.is_unauthorized;
    }

    if (params.is_violation !== undefined && params.is_violation !== null) {
      where.is_violation = params.is_violation;
    }

    if (params.is_risk_alert !== undefined && params.is_risk_alert !== null) {
      where.is_risk_alert = params.is_risk_alert;
    }

    if (params.rule_id) {
      where.rule_id = params.rule_id;
    }

    if (params.rule_code) {
      where.rule_code = params.rule_code;
    }

    if (params.start_time) {
      where.operation_time = {
        ...(where.operation_time || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.operation_time = {
        ...(where.operation_time || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'mobile', 'id_card_no']
    };
  }

  getCorporateInclude(): Includeable {
    return {
      model: CorporateProfile,
      required: false,
      attributes: ['id', 'profile_no', 'enterprise_name', 'credit_code', 'legal_representative']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name'],
      as: 'operator_organization'
    };
  }
}
