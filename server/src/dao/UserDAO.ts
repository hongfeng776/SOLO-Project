import bcrypt from 'bcryptjs';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import User from '../models/User';

class UserDAO extends BaseDAO<User> {
  constructor() {
    super(db.User);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.model.findOne({ where: { username } });
  }

  async findByUsernameAndPassword(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }
}

export default new UserDAO();
