import { AccountRepository, CustomerRepository, OrganizationRepository, UserRepository } from '../repositories';
import {
  AccountVO, AccountStatus, AccountStatusText, AccountTypeText, AccountTypeConfig
} from '../types';
import { Account } from '../models';
import { isValidId, isValidAmount, throwNotFoundError, throwValidationError, throwBusinessError } from '../utils';
import dayjs from 'dayjs';
import { PaginatedResult } from '../types/common';

export class AccountService {
  private accountRepository: AccountRepository;
  private customerRepository: CustomerRepository;
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.accountRepository = new AccountRepository();
    this.customerRepository = new CustomerRepository();
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
  }

  private maskIdCard(id: string): string {
    if (!id || id.length < 8) return id || '';
    return id.slice(0, 4) + '*'.repeat(id.length - 8) + id.slice(-4);
  }

  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 7) return mobile || '';
    return mobile.slice(0, 3) + '****' + mobile.slice(-4);
  }

  async getAccountList(params: any, userId?: string, orgId?: string): Promise<PaginatedResult<AccountVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.accountRepository.buildQuery(queryParams);
    if (orgId) {
      where.open_org_id = orgId;
    }

    const include = [
      this.accountRepository.getCustomerInclude(),
      this.accountRepository.getOrganizationInclude(),
      this.accountRepository.getOperatorInclude()
    ];

    const result = await this.accountRepository.findPaginated(
      { page: page || 1, pageSize: pageSize || 10 },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: AccountVO[] = result.list.map((a: any) => this.convertToVO(a));
    return { ...result, list };
  }

  async getAccountById(id: string): Promise<AccountVO> {
    if (!isValidId(id)) throwValidationError('无效的账户ID');
    const account = await this.accountRepository.findById(id, {
      include: [
        this.accountRepository.getCustomerInclude(),
        this.accountRepository.getOrganizationInclude(),
        this.accountRepository.getOperatorInclude()
      ]
    });
    if (!account) throwNotFoundError('账户不存在');
    return this.convertToVO(account);
  }

  async getAccountsByCustomerId(customerId: string): Promise<AccountVO[]> {
    if (!isValidId(customerId)) throwValidationError('无效的客户ID');
    const list = await this.accountRepository.findByCustomerId(customerId);
    return list.map((a: any) => this.convertToVO(a));
  }

  async updateAccountStatus(id: string, status: number, operatorId: string, remark?: string): Promise<AccountVO> {
    if (!isValidId(id)) throwValidationError('无效的账户ID');
    if (![0, 1, 2, 3, 4].includes(status)) throwValidationError('无效的账户状态');

    const account = await this.accountRepository.findById(id);
    if (!account) throwNotFoundError('账户不存在');

    if (account.status === status) {
      throwBusinessError('账户状态未变更');
    }

    if (status === 0 && Number(account.balance) > 0) {
      throwBusinessError('账户余额不为零，无法注销');
    }

    const updateData: any = { status };
    if (status === 0) {
      updateData.close_date = new Date();
    }
    if (remark) {
      updateData.remark = remark;
    }

    await this.accountRepository.update(id, updateData);
    const updated = await this.accountRepository.findById(id, {
      include: [
        this.accountRepository.getCustomerInclude(),
        this.accountRepository.getOrganizationInclude(),
        this.accountRepository.getOperatorInclude()
      ]
    });
    return this.convertToVO(updated!);
  }

  private convertToVO(account: Account): AccountVO {
    const data: any = account.toJSON ? account.toJSON() : account;
    return {
      id: data.id,
      account_no: data.account_no,
      customer_id: data.customer_id,
      customer_no: data.customer_no,
      customer_name: data.customer?.customer_name,
      account_type: data.account_type,
      account_type_text: AccountTypeText[data.account_type] || '未知',
      alias: data.alias,
      currency: data.currency,
      balance: Number(data.balance),
      available_balance: Number(data.available_balance),
      frozen_amount: Number(data.frozen_amount),
      daily_limit: Number(data.daily_limit),
      single_limit: Number(data.single_limit),
      annual_fee: Number(data.annual_fee),
      open_purpose: data.open_purpose,
      function_permissions: data.function_permissions,
      open_org_id: data.open_org_id,
      open_org_name: data.organization?.name,
      open_operator_id: data.open_operator_id,
      open_operator_name: data.operator?.real_name || data.operator?.username,
      status: data.status,
      status_text: AccountStatusText[data.status] || '未知',
      open_date: data.open_date ? dayjs(data.open_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
      close_date: data.close_date ? dayjs(data.close_date).format('YYYY-MM-DD HH:mm:ss') : undefined,
      opening_id: data.opening_id,
      remark: data.remark,
      created_at: data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: data.updated_at ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }
}
