const { Copyright, Content } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class CopyrightService {
  async getCopyrightList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['copyright_code', 'copyright_name', 'supplier_name', 'contract_no']);

    const where = { ...search };

    if (query.type) where.copyright_type = query.type;
    if (query.status !== undefined) where.status = query.status;

    const { count, rows } = await Copyright.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((item) => ({
        id: item.id,
        code: item.copyright_code,
        name: item.copyright_name,
        type: item.copyright_type,
        supplierName: item.supplier_name,
        supplierContact: item.supplier_contact,
        supplierPhone: item.supplier_phone,
        contractNo: item.contract_no,
        startDate: item.start_date,
        endDate: item.end_date,
        territories: item.territories,
        licenseFee: item.license_fee,
        paymentStatus: item.payment_status,
        contentCount: item.content_count,
        description: item.copyright_description,
        status: item.status,
        remark: item.remark,
        createdAt: item.created_at,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getCopyrightById(id) {
    const copyright = await Copyright.findByPk(id, {
      include: [{ model: Content, as: 'contents', limit: 10, attributes: ['id', 'content_title'] }],
    });
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }
    return {
      id: copyright.id,
      code: copyright.copyright_code,
      name: copyright.copyright_name,
      type: copyright.copyright_type,
      supplierName: copyright.supplier_name,
      supplierContact: copyright.supplier_contact,
      supplierPhone: copyright.supplier_phone,
      contractNo: copyright.contract_no,
      contractFile: copyright.contract_file,
      authorizationFile: copyright.authorization_file,
      startDate: copyright.start_date,
      endDate: copyright.end_date,
      territories: copyright.territories,
      licenseFee: copyright.license_fee,
      currency: copyright.currency,
      paymentStatus: copyright.payment_status,
      contentCount: copyright.content_count,
      description: copyright.copyright_description,
      attachments: copyright.attachments,
      status: copyright.status,
      remark: copyright.remark,
      relatedContents: copyright.contents || [],
    };
  }

  async createCopyright(data, operatorId) {
    const exist = await Copyright.findOne({ where: { copyright_code: data.code } });
    if (exist) {
      throw new ConflictError('版权编号已存在');
    }
    const copyright = await Copyright.create({
      copyright_code: data.code,
      copyright_name: data.name,
      copyright_type: data.type,
      supplier_name: data.supplierName,
      supplier_contact: data.supplierContact,
      supplier_phone: data.supplierPhone,
      contract_no: data.contractNo,
      contract_file: data.contractFile,
      authorization_file: data.authorizationFile,
      start_date: data.startDate,
      end_date: data.endDate,
      territories: data.territories,
      license_fee: data.licenseFee,
      currency: data.currency,
      payment_status: data.paymentStatus ?? 0,
      copyright_description: data.description,
      attachments: data.attachments,
      status: data.status ?? 1,
      remark: data.remark,
      created_by: operatorId,
    });
    return copyright.id;
  }

  async updateCopyright(id, data, operatorId) {
    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }
    if (data.code && data.code !== copyright.copyright_code) {
      const exist = await Copyright.findOne({ where: { copyright_code: data.code, id: { [Op.ne]: id } } });
      if (exist) {
        throw new ConflictError('版权编号已存在');
      }
    }
    await Copyright.update({
      copyright_code: data.code,
      copyright_name: data.name,
      copyright_type: data.type,
      supplier_name: data.supplierName,
      supplier_contact: data.supplierContact,
      supplier_phone: data.supplierPhone,
      contract_no: data.contractNo,
      contract_file: data.contractFile,
      authorization_file: data.authorizationFile,
      start_date: data.startDate,
      end_date: data.endDate,
      territories: data.territories,
      license_fee: data.licenseFee,
      currency: data.currency,
      payment_status: data.paymentStatus,
      copyright_description: data.description,
      attachments: data.attachments,
      status: data.status,
      remark: data.remark,
      updated_by: operatorId,
    }, { where: { id } });
    return true;
  }

  async deleteCopyright(id) {
    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }
    const contentCount = await Content.count({ where: { copyright_id: id } });
    if (contentCount > 0) {
      throw new BadRequestError('该版权下存在关联内容，无法删除');
    }
    await copyright.destroy();
    return true;
  }
}

module.exports = new CopyrightService();
