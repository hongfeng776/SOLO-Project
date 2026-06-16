const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/error');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  async getList(params = {}, options = {}) {
    const { pageNum = 1, pageSize = 10, keyword, ...filters } = params;
    const { searchFields = [], include = [], exclude = [] } = options;

    const where = {};
    const offset = (pageNum - 1) * pageSize;
    const limit = pageSize;

    if (keyword && searchFields.length > 0) {
      where[Op.or] = searchFields.map(field => ({
        [field]: { [Op.like]: `%${keyword}%` }
      }));
    }

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        where[key] = filters[key];
      }
    });

    const { count, rows } = await this.model.findAndCountAll({
      where,
      include,
      offset,
      limit,
      order: [['id', 'DESC']],
      attributes: { exclude }
    });

    return {
      list: rows,
      total: count,
      pageNum,
      pageSize
    };
  }

  async getById(id, options = {}) {
    const { include = [], exclude = [] } = options;
    const record = await this.model.findByPk(id, { include, attributes: { exclude } });
    
    if (!record) {
      throw new NotFoundError(`${this.model.name} 不存在`);
    }
    
    return record;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const record = await this.getById(id);
    return await record.update(data);
  }

  async remove(id) {
    const record = await this.getById(id);
    await record.destroy();
    return true;
  }

  async batchRemove(ids) {
    await this.model.destroy({ where: { id: ids } });
    return true;
  }
}

module.exports = BaseService;
