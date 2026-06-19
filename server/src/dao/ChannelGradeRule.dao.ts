import { FindOptions, CreateOptions, Op } from 'sequelize';
import ChannelGradeRule, { ChannelGradeRuleAttributes, ChannelGradeRuleCreationAttributes } from '../models/ChannelGradeRule.model';
import { ChannelLevel } from '../constants/enum';

class ChannelGradeRuleDao {
  public async create(data: ChannelGradeRuleCreationAttributes, options?: CreateOptions): Promise<ChannelGradeRule> {
    return ChannelGradeRule.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelGradeRule | null> {
    return ChannelGradeRule.findByPk(id, options);
  }

  public async findByLevel(level: ChannelLevel, options?: FindOptions): Promise<ChannelGradeRule | null> {
    return ChannelGradeRule.findOne({
      ...options,
      where: {
        ...(options?.where || {}),
        level,
      },
    });
  }

  public async findAllActive(atDate?: Date, options?: FindOptions): Promise<ChannelGradeRule[]> {
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
    return ChannelGradeRule.findAll({
      ...options,
      where,
      order: [['level', 'ASC']],
    });
  }

  public async findAll(options?: FindOptions): Promise<ChannelGradeRule[]> {
    return ChannelGradeRule.findAll({
      ...options,
      order: [['level', 'ASC']],
    });
  }

  public async update(id: string, data: Partial<ChannelGradeRuleAttributes>): Promise<[number, ChannelGradeRule[]]> {
    return ChannelGradeRule.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async delete(id: string): Promise<number> {
    return ChannelGradeRule.destroy({
      where: { id },
    });
  }
}

export default new ChannelGradeRuleDao();
