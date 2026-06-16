const BaseService = require('./BaseService');
const User = require('../models/User');
const Role = require('../models/Role');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['username', 'nickname'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code'] }],
      exclude: ['password']
    });
  }

  async getById(id) {
    return super.getById(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code'] }],
      exclude: ['password']
    });
  }

  async getByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  async create(data) {
    const user = await super.create(data);
    return this.getById(user.id);
  }

  async update(id, data) {
    await super.update(id, data);
    return this.getById(id);
  }
}

module.exports = new UserService();
