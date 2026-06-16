import { BaseDao } from './BaseDao';
import { AfterSaleAudit } from '../models/AfterSaleAudit';
import { WhereOptions } from 'sequelize';

export class AfterSaleAuditDao extends BaseDao<AfterSaleAudit> {
  constructor() {
    super(AfterSaleAudit);
  }

  async findByAfterSaleId(aftersaleId: number): Promise<AfterSaleAudit[]> {
    return this.model.findAll({
      where: {
        aftersale_id: aftersaleId,
      } as WhereOptions<AfterSaleAudit>,
      order: [['level', 'ASC'], ['created_at', 'ASC']],
    });
  }

  async findByAfterSaleAndLevel(aftersaleId: number, level: number): Promise<AfterSaleAudit | null> {
    return this.model.findOne({
      where: {
        aftersale_id: aftersaleId,
        level,
      } as WhereOptions<AfterSaleAudit>,
    });
  }

  async findLatestByAfterSale(aftersaleId: number): Promise<AfterSaleAudit | null> {
    return this.model.findOne({
      where: {
        aftersale_id: aftersaleId,
      } as WhereOptions<AfterSaleAudit>,
      order: [['created_at', 'DESC']],
    });
  }
}

export default AfterSaleAuditDao;
