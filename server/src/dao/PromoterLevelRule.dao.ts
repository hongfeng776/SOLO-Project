import { FindOptions, CreateOptions, Op } from 'sequelize';
import PromoterLevelRule, { PromoterLevelRuleAttributes, PromoterLevelRuleCreationAttributes } from '../models/PromoterLevelRule.model';
import { PromoterLevel } from '../constants/enum';

class PromoterLevelRuleDao {
  public async create(data: PromoterLevelRuleCreationAttributes, options?: CreateOptions): Promise<PromoterLevelRule> {
    return PromoterLevelRule.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterLevelRule | null> {
    return PromoterLevelRule.findByPk(id, options);
  }

  public async findByLevel(level: PromoterLevel, options?: FindOptions): Promise<PromoterLevelRule | null> {
    return PromoterLevelRule.findOne({
      ...options,
      where: {
        ...(options?.where || {}),
        level,
      },
    });
  }

  public async findAllActive(atDate?: Date, options?: FindOptions): Promise<PromoterLevelRule[]> {
    const now = atDate || new Date();
    const where: any = {
      ...(options?.where || {}),
      [Op.or]: [
        { effectiveFrom: { [Op.lte]: now } },
        { effectiveFrom: null },
      ],
      [Op.and]: [
        {
          [Op.or]: [
            { effectiveTo: { [Op.gte]: now } },
            { effectiveTo: null },
          ],
        },
      ],
    };
    return PromoterLevelRule.findAll({
      ...options,
      where,
      order: [['level', 'ASC']],
    });
  }

  public async findAll(options?: FindOptions): Promise<PromoterLevelRule[]> {
    return PromoterLevelRule.findAll({
      ...options,
      order: [['level', 'ASC']],
    });
  }

  public async update(id: string, data: Partial<PromoterLevelRuleAttributes>): Promise<[number, PromoterLevelRule[]]> {
    return PromoterLevelRule.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return PromoterLevelRule.destroy({
      where: { id },
    });
  }
}

export default new PromoterLevelRuleDao();
