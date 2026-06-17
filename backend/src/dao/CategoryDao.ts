import { BaseDao } from './BaseDao';
import { Category } from '../models/Category';
import { Op, WhereOptions } from 'sequelize';

export class CategoryDao extends BaseDao<Category> {
  constructor() {
    super(Category);
  }

  async findByParentId(parentId: number): Promise<Category[]> {
    return this.model.findAll({
      where: { parent_id: parentId } as any,
      order: [['sort', 'ASC']],
    });
  }

  async findByLevel(level: number): Promise<Category[]> {
    return this.model.findAll({
      where: { level } as any,
      order: [['sort', 'ASC']],
    });
  }

  async findByCode(code: string): Promise<Category | null> {
    return this.model.findOne({
      where: { code } as any,
    });
  }

  async findSiblings(parentId: number): Promise<Category[]> {
    return this.model.findAll({
      where: { parent_id: parentId } as any,
      order: [['sort', 'ASC']],
    });
  }

  async findAllDescendants(parentId: number): Promise<Category[]> {
    const result: Category[] = [];
    const queue: number[] = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.findByParentId(currentId);
      for (const child of children) {
        result.push(child);
        queue.push(child.id);
      }
    }

    return result;
  }

  async findAllIdsDescendants(parentId: number): Promise<number[]> {
    const descendants = await this.findAllDescendants(parentId);
    return descendants.map((d) => d.id);
  }

  async updateProductCount(_categoryId: number): Promise<number> {
    return 0;
  }

  async updateHasChildren(categoryId: number, hasChildren: number): Promise<number> {
    const [affectedCount] = await this.model.update(
      { has_children: hasChildren },
      { where: { id: categoryId } as WhereOptions }
    );
    return affectedCount;
  }

  async findByParentAndName(parentId: number, name: string, excludeId?: number): Promise<Category | null> {
    const where: Record<string, unknown> = {
      parent_id: parentId,
      name,
    } as Record<string, unknown>;
    if (excludeId !== undefined) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.model.findOne({
      where: where as WhereOptions,
    });
  }

  async findByCodes(codes: string[]): Promise<Category[]> {
    return this.model.findAll({
      where: { code: { [Op.in]: codes } } as any,
    });
  }

  async findByIds(ids: number[]): Promise<Category[]> {
    return this.model.findAll({
      where: { id: { [Op.in]: ids } } as any,
      order: [['sort', 'ASC']],
    });
  }
}

export default CategoryDao;
