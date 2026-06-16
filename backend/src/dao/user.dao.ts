import { BaseDao } from './base.dao';
import { User } from '../models';
import UserModel from '../models/user.model';

class UserDao extends BaseDao<UserModel> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string) {
    return this.findOne({ where: { username } });
  }
}

export default new UserDao();
