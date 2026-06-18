const BaseService = require('./BaseService');
const Merchant = require('../models/Merchant');
const MerchantQualification = require('../models/MerchantQualification');
const MerchantAuditLog = require('../models/MerchantAuditLog');
const { Op } = require('sequelize');

class MerchantService extends BaseService {
  constructor() {
    super(Merchant);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['name', 'contact', 'phone', 'address', 'email', 'unifiedCreditCode'],
      include: [{ model: MerchantQualification, as: 'qualifications', attributes: ['id', 'category', 'name', 'auditResult'] }]
    });
  }

  async getDetail(id) {
    return await this.model.findByPk(id, {
      include: [
        { model: MerchantQualification, as: 'qualifications' },
        { model: MerchantAuditLog, as: 'auditLogs', limit: 50, order: [['id', 'DESC']] }
      ]
    });
  }

  async getQualifications(merchantId) {
    return await MerchantQualification.findAll({
      where: { merchantId },
      order: [['category', 'ASC']]
    });
  }

  async saveQualifications(merchantId, qualifications) {
    const t = await require('../config/db').sequelize.transaction();
    try {
      await MerchantQualification.destroy({ where: { merchantId }, force: true, transaction: t });
      const data = qualifications.map(q => ({
        ...q,
        merchantId
      }));
      if (data.length > 0) {
        await MerchantQualification.bulkCreate(data, { transaction: t });
      }
      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async getStats() {
    const total = await Merchant.count();
    const pending = await Merchant.count({ where: { auditStatus: { [Op.in]: [0, 3, 4, 6, 7] } } });
    const approved = await Merchant.count({ where: { auditStatus: 1 } });
    const rejected = await Merchant.count({ where: { auditStatus: 2 } });
    const expired = await Merchant.count({ where: { auditStatus: 5 } });
    const highRisk = await Merchant.count({ where: { merchantCategory: 2, auditStatus: { [Op.in]: [0, 3, 6, 7] } } });
    return { total, pending, approved, rejected, expired, highRisk };
  }
}

module.exports = new MerchantService();
