import { BaseDao } from './BaseDao';
import { User } from '../models/User';

export class UserDao extends BaseDao<User> {
  constructor() {
    super(User);
  }
}

export default UserDao;
