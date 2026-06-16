import BaseDAO from './BaseDAO';
import { db } from '../models';
import RolePermission from '../models/RolePermission';

class RolePermissionDAO extends BaseDAO<RolePermission> {
  constructor() {
    super(db.RolePermission);
  }

  async findByRoleId(roleId: number): Promise<RolePermission[]> {
    return this.model.findAll({ where: { role_id: roleId } });
  }

  async findByPermId(permId: number): Promise<RolePermission[]> {
    return this.model.findAll({ where: { perm_id: permId } });
  }
}

export default new RolePermissionDAO();
