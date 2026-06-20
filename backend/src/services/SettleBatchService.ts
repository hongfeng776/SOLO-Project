import { Op } from 'sequelize';
import { daos } from '../dao';
import { SettleApplyOrder, ApplyStatus as SettleApplyStatus } from '../models/SettleApplyOrder';
import { UserPermission } from '../models/UserPermission';
import { PageResult } from '../dao/BaseDao';
import { settleCalcService } from './SettleCalcService';

export const FINANCE_PERMISSION_CODE = 'FINANCE_SETTLE';
export const BATCH_LIMIT = 200;

export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  messages: string[];
  results: Array<{ id: number; success: boolean; message: string }>;
}

export interface SettleListParams {
  pageNum?: number;
  pageSize?: number;
  applyNo?: string;
  merchantId?: number;
  merchantName?: string;
  merchantType?: number;
  periodType?: number;
  applyStatus?: number;
  startDate?: string;
  endDate?: string;
  periodStart?: string;
  periodEnd?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface BatchApplyParams {
  merchantIds: number[];
  periodType: number;
  startDate: string;
  endDate: string;
  operatorId?: number;
  operatorName?: string;
}

export interface BatchAuditParams {
  applyIds: number[];
  auditPass: boolean;
  rejectReason?: string;
  operatorId?: number;
  operatorName?: string;
}

export interface LedgerExportParams {
  applyIds?: number[];
  merchantId?: number;
  applyStatus?: number;
  periodType?: number;
  startDate?: string;
  endDate?: string;
  fields?: string[];
}

class SettleBatchService {
  readonly merchantDao = daos.merchantDao;
  readonly settleApplyOrderDao = daos.settleApplyOrderDao;
  readonly settleAuditLogDao = daos.settleAuditLogDao;
  readonly settleDeductDetailDao = daos.settleDeductDetailDao;
  readonly settleTransferVoucherDao = daos.settleTransferVoucherDao;

  async checkFinancePermission(userId: number, permissionCode: string = FINANCE_PERMISSION_CODE): Promise<{ hasPermission: boolean; message?: string }> {
    if (!userId) {
      return { hasPermission: false, message: '用户ID不能为空' };
    }

    const permissions = await UserPermission.findAll({
      where: {
        user_id: userId,
        permission_code: permissionCode,
        is_revoked: 0,
      },
    } as any);

    const validPermissions = permissions.filter((p: any) => {
      const expireTime = p.expire_time;
      if (expireTime) {
        return new Date(expireTime) > new Date();
      }
      return true;
    });

    if (validPermissions.length === 0) {
      return { hasPermission: false, message: '无财务结算权限' };
    }

    return { hasPermission: true };
  }

  async batchApplySettle(params: BatchApplyParams): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: params.merchantIds.length,
      successCount: 0,
      failCount: 0,
      messages: [],
      results: [],
    };

    if (params.merchantIds.length > BATCH_LIMIT) {
      result.success = false;
      result.messages.push(`批量申请超过上限${BATCH_LIMIT}条`);
      return result;
    }

    for (const merchantId of params.merchantIds) {
      try {
        const createResult = await settleCalcService.createApplyOrder(
          merchantId,
          params.periodType,
          params.startDate,
          params.endDate,
          params.operatorId,
          params.operatorName
        );

        if (createResult.success && createResult.applyOrder) {
          result.successCount++;
          result.results.push({
            id: createResult.applyOrder.id,
            success: true,
            message: `商家${merchantId}申请成功，单号：${createResult.applyOrder.apply_no}`,
          });
        } else {
          result.failCount++;
          result.results.push({
            id: merchantId,
            success: false,
            message: createResult.message || '申请失败',
          });
          result.messages.push(`商家${merchantId}: ${createResult.message || '申请失败'}`);
        }
      } catch (error) {
        result.failCount++;
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        result.results.push({
          id: merchantId,
          success: false,
          message: errorMsg,
        });
        result.messages.push(`商家${merchantId}: ${errorMsg}`);
      }
    }

    result.success = result.failCount === 0;
    return result;
  }

  async batchAuditSettle(params: BatchAuditParams): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: params.applyIds.length,
      successCount: 0,
      failCount: 0,
      messages: [],
      results: [],
    };

    if (params.applyIds.length > BATCH_LIMIT) {
      result.success = false;
      result.messages.push(`批量审核超过上限${BATCH_LIMIT}条`);
      return result;
    }

    if (params.operatorId) {
      const permCheck = await this.checkFinancePermission(params.operatorId);
      if (!permCheck.hasPermission) {
        result.success = false;
        result.messages.push(permCheck.message || '无财务结算权限');
        return result;
      }
    }

    const targetStatus = params.auditPass ? SettleApplyStatus.AUDIT_APPROVED : SettleApplyStatus.AUDIT_REJECTED;

    for (const applyId of params.applyIds) {
      try {
        const statusResult = await settleCalcService.changeApplyStatus(
          applyId,
          targetStatus,
          params.operatorId,
          params.operatorName,
          { rejectReason: params.rejectReason }
        );

        if (statusResult.success) {
          result.successCount++;
          result.results.push({
            id: applyId,
            success: true,
            message: `申请单${applyId}${params.auditPass ? '审核通过' : '审核驳回'}成功`,
          });
        } else {
          result.failCount++;
          result.results.push({
            id: applyId,
            success: false,
            message: statusResult.message || '审核失败',
          });
          result.messages.push(`申请单${applyId}: ${statusResult.message || '审核失败'}`);
        }
      } catch (error) {
        result.failCount++;
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        result.results.push({
          id: applyId,
          success: false,
          message: errorMsg,
        });
        result.messages.push(`申请单${applyId}: ${errorMsg}`);
      }
    }

    result.success = result.failCount === 0;
    return result;
  }

  async batchExportLedger(params: LedgerExportParams): Promise<{ csv: string; headers: string[]; rows: any[]; filename: string }> {
    const defaultFields = [
      'apply_no', 'merchant_id', 'merchant_name', 'settle_period_type',
      'period_start_date', 'period_end_date', 'total_settle_base', 'total_order_count',
      'aftersale_deduct_amount', 'penalty_deduct_amount', 'platform_fee_amount',
      'actual_settle_amount', 'apply_status',
      'bank_account_name', 'bank_account_no', 'bank_name',
      'created_at', 'audit_time', 'transfer_time',
    ];

    const fields = params.fields && params.fields.length > 0 ? params.fields : defaultFields;

    const where: any = {};

    if (params.applyIds && params.applyIds.length > 0) {
      where.id = { [Op.in]: params.applyIds };
    }
    if (params.merchantId !== undefined) {
      where.merchant_id = params.merchantId;
    }
    if (params.applyStatus !== undefined) {
      where.apply_status = params.applyStatus;
    }
    if (params.periodType !== undefined) {
      where.settle_period_type = params.periodType;
    }
    if (params.startDate || params.endDate) {
      where.created_at = {} as any;
      if (params.startDate) {
        where.created_at[Op.gte] = new Date(params.startDate);
      }
      if (params.endDate) {
        where.created_at[Op.lte] = new Date(params.endDate);
      }
    }

    const applyOrders = await this.settleApplyOrderDao.findAll({ where, order: [['created_at', 'DESC']] } as any);
    const merchantMap: Record<number, any> = {};
    for (const order of applyOrders) {
      const mid = (order as any).merchant_id;
      if (!merchantMap[mid]) {
        const m = await this.merchantDao.findById(mid);
        merchantMap[mid] = m;
      }
    }

    const headerMap: Record<string, string> = {
      apply_no: '结算申请单号',
      merchant_id: '商家ID',
      merchant_name: '商家名称',
      settle_period_type: '周期类型',
      period_start_date: '周期开始日期',
      period_end_date: '周期结束日期',
      total_settle_base: '订单总金额',
      total_order_count: '订单数量',
      aftersale_deduct_amount: '售后扣减金额',
      penalty_deduct_amount: '违规罚款金额',
      platform_fee_amount: '平台手续费',
      actual_settle_amount: '实际结算金额',
      apply_status: '申请状态',
      bank_account_name: '开户名',
      bank_account_no: '银行账号',
      bank_name: '开户行',
      created_at: '申请时间',
      audit_time: '审核时间',
      auditor_name: '审核人',
      transfer_time: '转账时间',
      reject_reason: '驳回原因',
      remark: '备注',
    };

    const headers = fields.map(f => headerMap[f] || f);

    const rows = applyOrders.map(order => {
      const row: any = {};
      const o = order as any;
      const merchant = merchantMap[o.merchant_id];
      const bankSnapshot = o.bank_snapshot || {};
      for (const field of fields) {
        let value: any = '';
        if (field === 'merchant_name') {
          value = merchant ? (merchant as any).name || merchant.merchant_name || '' : '';
        } else if (field === 'bank_account_name') {
          value = bankSnapshot.bank_account_name || '';
        } else if (field === 'bank_account_no') {
          value = bankSnapshot.bank_account_no || '';
        } else if (field === 'bank_name') {
          value = bankSnapshot.bank_name || '';
        } else if (field === 'settle_period_type') {
          value = this.getPeriodTypeName(o.settle_period_type);
        } else if (field === 'apply_status') {
          value = this.getStatusName(o.apply_status);
        } else if (o[field] instanceof Date) {
          value = o[field].toISOString().split('T')[0];
        } else {
          value = o[field] ?? '';
        }
        row[field] = value;
      }
      return row;
    });

    const csvLines: string[] = [];
    csvLines.push(headers.join(','));
    for (const row of rows) {
      csvLines.push(fields.map(f => {
        const val = String(row[f] ?? '');
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(','));
    }
    const csv = '\uFEFF' + csvLines.join('\n');

    const now = new Date();
    const filename = `settle_ledger_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;

    return { csv, headers, rows, filename };
  }

  async getSettleList(params: SettleListParams): Promise<PageResult<SettleApplyOrder>> {
    const { pageNum = 1, pageSize = 10, ...queryParams } = params;

    const where: any = {};

    if (queryParams.applyNo) {
      where.apply_no = { [Op.like]: `%${queryParams.applyNo}%` };
    }
    if (queryParams.merchantId !== undefined) {
      where.merchant_id = queryParams.merchantId;
    }
    if (queryParams.merchantName) {
      const merchants = await this.merchantDao.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${queryParams.merchantName}%` } } as any,
            { merchant_name: { [Op.like]: `%${queryParams.merchantName}%` } } as any,
          ],
        },
        attributes: ['id'],
      } as any);
      const merchantIds = merchants.map(m => m.id);
      if (merchantIds.length === 0 && queryParams.merchantName) {
        return { list: [], total: 0, page: pageNum, pageSize, totalPages: 0 };
      }
      if (merchantIds.length > 0) {
        where.merchant_id = { [Op.in]: merchantIds };
      }
    }
    if (queryParams.periodType !== undefined) {
      where.settle_period_type = queryParams.periodType;
    }
    if (queryParams.applyStatus !== undefined) {
      where.apply_status = queryParams.applyStatus;
    }
    if (queryParams.periodStart) {
      where.period_start_date = { [Op.gte]: new Date(queryParams.periodStart) };
    }
    if (queryParams.periodEnd) {
      where.period_end_date = { [Op.lte]: new Date(queryParams.periodEnd) };
    }
    if (queryParams.startDate || queryParams.endDate) {
      where.created_at = {} as any;
      if (queryParams.startDate) {
        where.created_at[Op.gte] = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        const end = new Date(queryParams.endDate);
        end.setDate(end.getDate() + 1);
        where.created_at[Op.lt] = end;
      }
    }
    if (queryParams.minAmount !== undefined) {
      where.actual_settle_amount = { [Op.gte]: queryParams.minAmount };
    }
    if (queryParams.maxAmount !== undefined) {
      if (!where.actual_settle_amount) {
        where.actual_settle_amount = {} as any;
      }
      where.actual_settle_amount[Op.lte] = queryParams.maxAmount;
    }

    if (queryParams.merchantType !== undefined) {
      const merchants = await this.merchantDao.findAll({
        where: { shop_level: queryParams.merchantType },
        attributes: ['id'],
      } as any);
      const merchantIds = merchants.map(m => m.id);
      if (merchantIds.length === 0) {
        return { list: [], total: 0, page: pageNum, pageSize, totalPages: 0 };
      }
      where.merchant_id = { [Op.in]: merchantIds };
    }

    const result = await this.settleApplyOrderDao.findPage({
      page: pageNum,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    } as any);

    return result;
  }

  getStatusName(status?: number): string {
    const names: Record<number, string> = {
      1: '待审核',
      2: '审核通过',
      3: '审核驳回',
      4: '打款中',
      5: '已到账',
      6: '打款失败',
    };
    return names[status || 0] || '未知';
  }

  getPeriodTypeName(type?: number): string {
    const names: Record<number, string> = {
      1: '日结',
      2: '周结',
      3: '月结',
      4: '季结',
    };
    return names[type || 0] || '未知';
  }
}

export const settleBatchService = new SettleBatchService();
export default settleBatchService;
