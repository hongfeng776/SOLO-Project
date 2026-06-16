import { BaseDao } from './BaseDao';
import { Admin } from '../models/Admin';
import { FindOptions, WhereOptions } from 'sequelize';

export class AdminDao extends BaseDao<Admin> {
  constructor() {
    super(Admin);
  }

  async findByUsername(username: string, options?: Omit<FindOptions<Admin>, 'where'>): Promise<Admin | null> {
    return this.model.findOne({
      where: { username } as WhereOptions<Admin>,
      ...options,
    });
  }
}

export default AdminDao;
