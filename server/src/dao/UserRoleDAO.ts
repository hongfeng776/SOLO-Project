import BaseDAO from './BaseDAO';
import { db } from '../models';
import UserRole from '../models/UserRole';

class UserRoleDAO extends BaseDAO<UserRole> {
  constructor() {
    super(db.UserRole);
  }

  async findByUserId(userId: number): Promise<UserRole[]> {
    return this.model.findAll({ where: { user_id: userId } });
  }

  async findByRoleId(roleId: number): Promise<UserRole[]> {
    return this.model.findAll({ where: { role_id: roleId } });
  }
}

export default new UserRoleDAO();
