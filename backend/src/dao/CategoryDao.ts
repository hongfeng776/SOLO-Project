import { BaseDao } from './BaseDao';
import { Category } from '../models/Category';

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
}

export default CategoryDao;
