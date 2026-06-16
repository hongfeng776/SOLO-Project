const { Op, QueryTypes } = require('sequelize');
const { NotFoundError } = require('../utils/error');
const { sequelize } = require('../config/db');

const QUERY_TIMEOUT = 30000;

class BaseService {
  constructor(model) {
    this.model = model;
  }

  async getList(params = {}, options = {}) {
    const {
      pageNum = 1,
      pageSize = 10,
      keyword,
      order,
      dateRange,
      ...filters
    } = params;

    const {
      searchFields = [],
      include = [],
      exclude = [],
      fieldMap = {},
      defaultOrder = [['id', 'DESC']]
    } = options;

    const where = {};
    const offset = (pageNum - 1) * pageSize;
    const limit = Math.min(pageSize, 200);

    if (keyword && searchFields.length > 0) {
      where[Op.or] = searchFields.map(field => ({
        [field]: { [Op.like]: `%${keyword}%` }
      }));
    }

    const mappedFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        const dbField = fieldMap[key] || key;
        mappedFilters[dbField] = filters[key];
      }
    });
    Object.assign(where, mappedFilters);

    if (dateRange) {
      const dateField = fieldMap.dateField || 'createdAt';
      if (dateRange.startTime && dateRange.endTime) {
        where[dateField] = {
          [Op.between]: [new Date(dateRange.startTime), new Date(dateRange.endTime)]
        };
      } else if (dateRange.startTime) {
        where[dateField] = { [Op.gte]: new Date(dateRange.startTime) };
      } else if (dateRange.endTime) {
        where[dateField] = { [Op.lte]: new Date(dateRange.endTime) };
      }
    }

    const orderOption = this._parseOrder(order, defaultOrder);

    const useDeferredJoin = pageNum > 50 && limit > 0;

    if (useDeferredJoin) {
      return this._deferredJoinQuery(where, orderOption, offset, limit, include, exclude, pageNum, pageSize);
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      include,
      offset,
      limit,
      order: orderOption,
      attributes: { exclude },
      timeout: QUERY_TIMEOUT
    });

    return {
      list: rows,
      total: count,
      pageNum,
      pageSize
    };
  }

  async _deferredJoinQuery(where, orderOption, offset, limit, include, exclude, pageNum, pageSize) {
    const tableName = this.model.getTableName();
    const idList = await this.model.findAll({
      where,
      attributes: ['id'],
      order: orderOption,
      offset,
      limit,
      raw: true,
      timeout: QUERY_TIMEOUT
    });

    if (idList.length === 0) {
      return { list: [], total: 0, pageNum, pageSize };
    }

    const ids = idList.map(item => item.id);

    const countResult = await this.model.count({ where, timeout: QUERY_TIMEOUT });

    const rows = await this.model.findAll({
      where: { id: { [Op.in]: ids } },
      include,
      order: orderOption,
      attributes: { exclude },
      timeout: QUERY_TIMEOUT
    });

    return {
      list: rows,
      total: countResult,
      pageNum,
      pageSize
    };
  }

  _parseOrder(order, defaultOrder) {
    if (!order) return defaultOrder;

    if (typeof order === 'string') {
      const parts = order.split(',');
      const result = [];
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes(' ')) {
          const [field, direction] = trimmed.split(' ');
          result.push([field, direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
        } else {
          result.push([trimmed, 'DESC']);
        }
      }
      return result.length > 0 ? result : defaultOrder;
    }

    if (Array.isArray(order)) {
      return order.map(item => {
        if (typeof item === 'string') {
          return [item, 'DESC'];
        }
        return item;
      });
    }

    return defaultOrder;
  }

  async getById(id, options = {}) {
    const { include = [], exclude = [] } = options;
    const record = await this.model.findByPk(id, {
      include,
      attributes: { exclude },
      timeout: QUERY_TIMEOUT
    });

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
