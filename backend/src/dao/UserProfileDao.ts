import { BaseDao } from './BaseDao';
import { UserProfile } from '../models/UserProfile';

export class UserProfileDao extends BaseDao<UserProfile> {
  constructor() {
    super(UserProfile);
  }
}

export default UserProfileDao;
