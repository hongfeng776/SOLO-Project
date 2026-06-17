import { Op, FindOptions, WhereOptions } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import QuoteThreshold, { ThresholdType, ScopeType } from '../models/QuoteThreshold';

class QuoteThresholdDAO extends BaseDAO<QuoteThreshold> {
  constructor() {
    super(db.QuoteThreshold);
  }

  async findActiveByTypeAndSector(
    type: ThresholdType,
    sector: string,
  ): Promise<QuoteThreshold | null> {
    const now = new Date();
    const where: WhereOptions = {
      threshold_type: type,
      sector,
      config_status: { [Op.ne]: 'expired' },
      effective_start: { [Op.lte]: now },
      [Op.or]: [
        { effective_end: null },
        { effective_end: { [Op.gte]: now } },
      ],
    };

    return this.model.findOne({
      where,
      order: [['version', 'DESC']],
    });
  }

  async findAllLatestByScope(scope: ScopeType): Promise<QuoteThreshold[]> {
    const where: WhereOptions = {
      scope_type: scope,
    };

    const results = await this.model.findAll({
      where,
      order: [
        ['threshold_type', 'ASC'],
        ['sector', 'ASC'],
        ['version', 'DESC'],
      ],
    });

    const seen = new Set<string>();
    const latest: QuoteThreshold[] = [];
    for (const item of results) {
      const key = `${item.threshold_type}_${item.sector}`;
      if (!seen.has(key)) {
        seen.add(key);
        latest.push(item);
      }
    }

    return latest;
  }

  async checkConflicts(
    type: ThresholdType,
    sector: string,
    min: number,
    max: number,
    excludeId?: number,
  ): Promise<QuoteThreshold[]> {
    const where: WhereOptions = {
      threshold_type: type,
      sector,
      config_status: { [Op.ne]: 'expired' },
      [Op.and]: [
        { min_value: { [Op.lte]: max } },
        { max_value: { [Op.gte]: min } },
      ],
    };

    if (excludeId !== undefined) {
      where.id = { [Op.ne]: excludeId };
    }

    return this.model.findAll({ where });
  }

  async findByThresholdIdWithHistory(
    id: number,
    options?: Omit<FindOptions, 'where'>,
  ): Promise<QuoteThreshold | null> {
    return this.model.findByPk(id, {
      ...options,
      include: [
        {
          association: 'history',
          as: 'history',
          order: [['created_at', 'DESC']],
          limit: 50,
          ...(options?.include ? (Array.isArray(options.include) ? options.include : [options.include]) : []),
        },
      ],
    });
  }

  async findExpiredTemporary(): Promise<QuoteThreshold[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        config_status: 'temporary',
        effective_end: { [Op.lt]: now },
      },
    });
  }

  async findLatestVersion(type: ThresholdType, scope: ScopeType, sector: string): Promise<number> {
    const result = await this.model.findOne({
      where: {
        threshold_type: type,
        scope_type: scope,
        sector,
      },
      order: [['version', 'DESC']],
      attributes: ['version'],
    });

    return result ? result.version + 1 : 1;
  }
}

export default new QuoteThresholdDAO();
