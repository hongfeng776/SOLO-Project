import { Op } from 'sequelize';
import companyDao from '../dao/company.dao';
import { NotFoundError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import CompanyModel from '../models/company.model';

class CompanyService {
  async getList(params: any): Promise<IPaginationResult<CompanyModel>> {
    const { name, status, ...rest } = params;
    const where: any = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (status !== undefined) {
      where.status = status;
    }

    return companyDao.paginate(rest, {
      where,
      order: [['sort', 'ASC'], ['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<CompanyModel | null> {
    const company = await companyDao.findById(id);
    if (!company) {
      throw new NotFoundError('企业不存在');
    }
    return company;
  }

  async create(data: any): Promise<CompanyModel> {
    return companyDao.create(data);
  }

  async update(id: number, data: any): Promise<[number, CompanyModel[]]> {
    await this.getById(id);
    return companyDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return companyDao.destroyById(id);
  }

  async batchRemove(ids: number[]): Promise<number> {
    return companyDao.destroy({ where: { id: ids } });
  }
}

export default new CompanyService();
