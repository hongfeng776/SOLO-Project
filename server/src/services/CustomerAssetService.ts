import { Op } from 'sequelize';
import customerAssetDAO from '@dao/CustomerAssetDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

class CustomerAssetService {
  async getCustomerList(params: { page: number; pageSize: number; riskLevel?: string; customerType?: string; status?: string; keyword?: string }) {
    const { page, pageSize, riskLevel, customerType, status, keyword } = params;
    const where: any = {};

    if (riskLevel) {
      where.risk_level = riskLevel;
    }

    if (customerType) {
      where.customer_type = customerType;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where[Op.or] = [
        { customer_name: { [Op.like]: `%${keyword}%` } },
        { id_card: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.CustomerAsset.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getCustomerById(id: number) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    return customer;
  }

  async createCustomer(data: any) {
    const existing = await customerAssetDAO.findByIdCard(data.id_card);
    if (existing) {
      throw new AppError(409, 'ID card already exists');
    }
    return db.CustomerAsset.create(data);
  }

  async updateCustomer(id: number, data: any) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    await db.CustomerAsset.update(data, { where: { id } });
    return db.CustomerAsset.findByPk(id);
  }

  async deleteCustomer(id: number) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    await db.CustomerAsset.destroy({ where: { id } });
  }
}

export default new CustomerAssetService();
