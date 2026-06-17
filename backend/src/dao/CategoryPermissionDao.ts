import { BaseDao } from './BaseDao';
import { CategoryPermission } from '../models/CategoryPermission';
import { WhereOptions } from 'sequelize';

export class CategoryPermissionDao extends BaseDao<CategoryPermission> {
  constructor() {
    super(CategoryPermission);
  }

  async findByCategoryId(categoryId: number): Promise<CategoryPermission[]> {
    return this.model.findAll({
      where: { category_id: categoryId, status: 1 } as any,
      order: [['role_id', 'ASC']],
    });
  }

  async findByCategoryAndRole(categoryId: number, roleId: number): Promise<CategoryPermission | null> {
    return this.model.findOne({
      where: { category_id: categoryId, role_id: roleId, status: 1 } as any,
    });
  }

  async findByRoleId(roleId: number): Promise<CategoryPermission[]> {
    return this.model.findAll({
      where: { role_id: roleId, status: 1 } as any,
      order: [['category_id', 'ASC']],
    });
  }

  async findByPermissionType(permissionType: number): Promise<CategoryPermission[]> {
    return this.model.findAll({
      where: { permission_type: permissionType, status: 1 } as any,
    });
  }

  async batchDeleteByCategoryId(categoryId: number): Promise<number> {
    return this.model.destroy({
      where: { category_id: categoryId } as WhereOptions,
    });
  }
}

export default CategoryPermissionDao;
