import { BaseRepository } from './BaseRepository';
import { Product } from '../models';
import { WhereOptions, Op } from 'sequelize';

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(Product);
  }

  async findByCode(code: string): Promise<Product | null> {
    return await this.model.findOne({ where: { code } });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.code) {
      where.code = { [Op.like]: `%${params.code}%` };
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    return where;
  }
}