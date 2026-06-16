import BaseDAO from './BaseDAO';
import { db } from '../models';
import Permission from '../models/Permission';

class PermissionDAO extends BaseDAO<Permission> {
  constructor() {
    super(db.Permission);
  }

  async findByPermCode(permCode: string): Promise<Permission | null> {
    return this.model.findOne({ where: { perm_code: permCode } });
  }
}

export default new PermissionDAO();
