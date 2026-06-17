import { BaseDao } from './BaseDao';
import { CategoryLog } from '../models/CategoryLog';
import { Op, WhereOptions } from 'sequelize';

export class CategoryLogDao extends BaseDao<CategoryLog> {
  constructor() {
    super(CategoryLog);
  }

  async findByCategoryId(categoryId: number, limit: number = 100): Promise<CategoryLog[]> {
    return this.model.findAll({
      where: { category_id: categoryId } as any,
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  async findByAction(action: string, startTime?: Date, endTime?: Date): Promise<CategoryLog[]> {
    const where: Record<string, unknown> = { action } as Record<string, unknown>;
    if (startTime || endTime) {
      where.created_at = {} as Record<string, unknown>;
      if (startTime) {
        (where.created_at as Record<string, unknown>)[Op.gte as unknown as string] = startTime;
      }
      if (endTime) {
        (where.created_at as Record<string, unknown>)[Op.lte as unknown as string] = endTime;
      }
    }
    return this.model.findAll({
      where: where as WhereOptions,
      order: [['created_at', 'DESC']],
    });
  }

  async findHierarchyLogs(categoryId: number): Promise<CategoryLog[]> {
    return this.model.findAll({
      where: {
        category_id: categoryId,
        action: { [Op.in]: ['move', 'sort'] },
      } as any,
      order: [['created_at', 'DESC']],
    });
  }
}

export default CategoryLogDao;
