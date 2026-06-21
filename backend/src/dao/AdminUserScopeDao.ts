import { BaseDao } from './BaseDao';
import { AdminUserScope } from '../models/AdminUserScope';

export class AdminUserScopeDao extends BaseDao<AdminUserScope> {
  constructor() {
    super(AdminUserScope);
  }
}

export default AdminUserScopeDao;
