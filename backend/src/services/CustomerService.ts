import { CustomerRepository, OrganizationRepository } from '../repositories';
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerQueryParams,
  PaginatedResult,
  CustomerVO
} from '../types';
import {
  throwNotFoundError,
  throwConflictError,
  throwValidationError
} from '../utils';
import { isValidId, isValidPhone } from '../utils/validate';
import * as _ from 'lodash';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

const idTypeMap: Record<number, string> = {
  1: '身份证',
  2: '护照',
  3: '军官证',
  4: '营业执照'
};

const customerTypeMap: Record<number, string> = {
  1: '个人',
  2: '企业'
};

const customerLevelMap: Record<number, string> = {
  1: '普通',
  2: '银卡',
  3: '金卡',
  4: '白金',
  5: '钻石'
};

const riskLevelMap: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

const customerStatusMap: Record<number, string> = {
  0: '冻结',
  1: '正常',
  2: '销户'
};

export class CustomerService {
  private customerRepository: CustomerRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async getCustomerList(params: CustomerQueryParams): Promise<PaginatedResult<CustomerVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.customerRepository.buildQuery(queryParams);

    if (queryParams.id_card_no) {
      where.id_card_no = { [Op.like]: `%${queryParams.id_card_no}%` };
    }

    const include = [this.customerRepository.getOrganizationInclude()];

    const result = await this.customerRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: CustomerVO[] = result.list.map(customer => this.convertToVO(customer));

    return { ...result, list };
  }

  async getCustomerById(id: string): Promise<CustomerVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的客户ID');
    }

    const customer = await this.customerRepository.findById(id, {
      include: [this.customerRepository.getOrganizationInclude()]
    });
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    return this.convertToVO(customer);
  }

  async createCustomer(request: CreateCustomerRequest): Promise<CustomerVO> {
    const { org_id, id_card_no, mobile, ...customerData } = request;

    const customerNo = this.generateCustomerNo();

    if (id_card_no) {
      const existingCustomer = await this.customerRepository.findByIdCardNo(id_card_no);
      if (existingCustomer) {
        throwConflictError('证件号已存在');
      }
    }

    if (mobile && !isValidPhone(mobile)) {
      throwValidationError('手机号格式不正确');
    }

    if (org_id) {
      if (!isValidId(org_id)) {
        throwValidationError('无效的机构ID');
      }
      const org = await this.organizationRepository.findById(org_id);
      if (!org) {
        throwNotFoundError('机构不存在');
      }
    }

    if (customerData.id_type !== undefined && !idTypeMap[customerData.id_type]) {
      throwValidationError('证件类型无效');
    }

    if (customerData.customer_type !== undefined && !customerTypeMap[customerData.customer_type]) {
      throwValidationError('客户类型无效');
    }

    if (customerData.customer_level !== undefined && !customerLevelMap[customerData.customer_level]) {
      throwValidationError('客户等级无效');
    }

    if (customerData.risk_level !== undefined && !riskLevelMap[customerData.risk_level]) {
      throwValidationError('风险等级无效');
    }

    if (customerData.status !== undefined && !customerStatusMap[customerData.status]) {
      throwValidationError('客户状态无效');
    }

    let openDate: Date | undefined;
    if (customerData.open_date) {
      openDate = dayjs(customerData.open_date as any).toDate();
    }

    const customer = await this.customerRepository.create({
      ...customerData,
      customer_no: customerNo,
      id_card_no,
      mobile,
      org_id,
      status: customerData.status ?? 1,
      open_date: openDate
    });

    return this.getCustomerById(customer.id);
  }

  async updateCustomer(id: string, request: UpdateCustomerRequest): Promise<CustomerVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的客户ID');
    }

    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    const { org_id, id_card_no, mobile, ...updateData } = request;

    if (id_card_no && id_card_no !== customer.id_card_no) {
      const existingCustomer = await this.customerRepository.findByIdCardNo(id_card_no);
      if (existingCustomer) {
        throwConflictError('证件号已存在');
      }
    }

    if (mobile && !isValidPhone(mobile)) {
      throwValidationError('手机号格式不正确');
    }

    if (org_id) {
      if (!isValidId(org_id)) {
        throwValidationError('无效的机构ID');
      }
      const org = await this.organizationRepository.findById(org_id);
      if (!org) {
        throwNotFoundError('机构不存在');
      }
    }

    if (updateData.id_type !== undefined && !idTypeMap[updateData.id_type]) {
      throwValidationError('证件类型无效');
    }

    if (updateData.customer_type !== undefined && !customerTypeMap[updateData.customer_type]) {
      throwValidationError('客户类型无效');
    }

    if (updateData.customer_level !== undefined && !customerLevelMap[updateData.customer_level]) {
      throwValidationError('客户等级无效');
    }

    if (updateData.risk_level !== undefined && !riskLevelMap[updateData.risk_level]) {
      throwValidationError('风险等级无效');
    }

    if (updateData.status !== undefined && !customerStatusMap[updateData.status]) {
      throwValidationError('客户状态无效');
    }

    const finalUpdateData: any = { ...updateData };
    if (id_card_no !== undefined) {
      finalUpdateData.id_card_no = id_card_no;
    }
    if (mobile !== undefined) {
      finalUpdateData.mobile = mobile;
    }
    if (org_id !== undefined) {
      finalUpdateData.org_id = org_id;
    }
    if (updateData.open_date) {
      finalUpdateData.open_date = dayjs(updateData.open_date as any).toDate();
    }

    if (Object.keys(finalUpdateData).length > 0) {
      await this.customerRepository.update(id, finalUpdateData);
    }

    return this.getCustomerById(id);
  }

  async updateCustomerStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的客户ID');
    }

    if (!customerStatusMap[status]) {
      throwValidationError('状态值无效');
    }

    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    await this.customerRepository.update(id, { status });
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的客户ID');
    }

    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    await this.customerRepository.delete(id);
  }

  async batchDeleteCustomers(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要删除的客户');
    }

    for (const id of ids) {
      if (!isValidId(id)) {
        throwValidationError('无效的客户ID');
      }
    }

    await this.customerRepository.deleteByWhere({ id: { [Op.in]: ids } });
  }

  async getAllCustomers(options?: { org_id?: string; status?: number }): Promise<CustomerVO[]> {
    const where: any = {};

    if (options?.org_id) {
      where.org_id = options.org_id;
    }

    if (options?.status !== undefined) {
      where.status = options.status;
    } else {
      where.status = 1;
    }

    const customers = await this.customerRepository.findAll({
      where,
      order: [['customer_name', 'ASC'], ['createdAt', 'ASC']]
    });

    return customers.map(customer => this.convertToVO(customer));
  }

  private generateCustomerNo(): string {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CUS${timestamp}${random}`;
  }

  private convertToVO(customer: any): CustomerVO {
    const data = customer.toJSON ? customer.toJSON() : customer;
    const vo: CustomerVO = _.omit(data, []) as CustomerVO;

    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    vo.id_type_text = data.id_type ? idTypeMap[data.id_type] : undefined;
    vo.customer_type_text = data.customer_type ? customerTypeMap[data.customer_type] : undefined;
    vo.customer_level_text = data.customer_level ? customerLevelMap[data.customer_level] : undefined;
    vo.risk_level_text = data.risk_level !== undefined && data.risk_level !== null ? riskLevelMap[data.risk_level] : undefined;
    vo.status_text = customerStatusMap[data.status] || undefined;

    return vo;
  }
}
