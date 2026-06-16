const BaseService = require('./BaseService');
const BusinessTravel = require('../models/BusinessTravel');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const Approval = require('../models/Approval');
const { ValidationError } = require('../utils/error');

const STATUS_MAP = {
  0: '待确认',
  1: '方案设计中',
  2: '待审批',
  3: '已确认',
  4: '已取消',
  5: '已完成'
};

const VALID_TRANSITIONS = {
  0: [1, 4],
  1: [2, 4],
  2: [3, 4],
  3: [5, 4],
  4: [],
  5: []
};

class BusinessTravelService extends BaseService {
  constructor() {
    super(BusinessTravel);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['title', 'contactName', 'departureCity', 'arrivalCity'],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ]
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] }
      ]
    });
  }

  async create(data) {
    const record = await super.create(data);
    await Approval.create({
      type: 'business_travel',
      businessId: record.id,
      title: `商旅定制审批: ${record.title}`,
      applicantId: data.userId,
      applicantName: data.contactName,
      status: 0
    });
    return record;
  }

  validateStatusTransition(fromStatus, toStatus) {
    const allowed = VALID_TRANSITIONS[fromStatus];
    if (!allowed || !allowed.includes(toStatus)) {
      throw new ValidationError(
        `状态不允许从"${STATUS_MAP[fromStatus]}"变更为"${STATUS_MAP[toStatus]}"`
      );
    }
  }

  async confirm(id) {
    const record = await this.getById(id);
    this.validateStatusTransition(record.status, 3);
    return await record.update({ status: 3 });
  }

  async cancel(id) {
    const record = await this.getById(id);
    this.validateStatusTransition(record.status, 4);
    return await record.update({ status: 4 });
  }
}

module.exports = new BusinessTravelService();
