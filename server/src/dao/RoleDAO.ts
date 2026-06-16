import BaseDAO from './BaseDAO';
import { db } from '../models';
import Role from '../models/Role';

class RoleDAO extends BaseDAO<Role> {
  constructor() {
    super(db.Role);
  }

  async findByRoleCode(roleCode: string): Promise<Role | null> {
    return this.model.findOne({ where: { role_code: roleCode } });
  }
}

export default new RoleDAO();
