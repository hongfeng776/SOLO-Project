const BaseService = require('./BaseService');
const Role = require('../models/Role');

class RoleService extends BaseService {
  constructor() {
    super(Role);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['name', 'code', 'description']
    });
  }
}

module.exports = new RoleService();
