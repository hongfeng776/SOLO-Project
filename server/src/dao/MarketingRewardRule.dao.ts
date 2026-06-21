import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import MarketingRewardRule, { MarketingRewardRuleAttributes, MarketingRewardRuleCreationAttributes } from '../models/MarketingRewardRule.model';

class MarketingRewardRuleDao {
  public async create(data: MarketingRewardRuleCreationAttributes, options?: CreateOptions): Promise<MarketingRewardRule> {
    return MarketingRewardRule.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<MarketingRewardRule | null> {
    return MarketingRewardRule.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<MarketingRewardRule | null> {
    return MarketingRewardRule.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<MarketingRewardRule[]> {
    return MarketingRewardRule.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: MarketingRewardRule[]; count: number }> {
    return MarketingRewardRule.findAndCountAll(options);
  }

  public async update(data: Partial<MarketingRewardRuleAttributes>, options: UpdateOptions): Promise<[number, MarketingRewardRule[]]> {
    return MarketingRewardRule.update(data, options) as unknown as Promise<[number, MarketingRewardRule[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return MarketingRewardRule.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return MarketingRewardRule.count(options);
  }

  public async findById(id: string): Promise<MarketingRewardRule | null> {
    return this.findByPk(id);
  }

  public async findByMarketingId(marketingId: string): Promise<MarketingRewardRule | null> {
    return this.findOne({ where: { marketingId } });
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }
}

export default new MarketingRewardRuleDao();
