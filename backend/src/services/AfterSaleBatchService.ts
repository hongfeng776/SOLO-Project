import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { AfterSale } from '../models/AfterSale';
import { PageResult } from '../types';

export interface AfterSaleQueryParams {
  pageNum?: number;
  pageSize?: number;
  orderNo?: string;
  afterSaleNo?: string;
  afterSaleType?: number;
  status?: number;
  cancelScene?: number;
  userId?: number;
  merchantId?: number;
  startTime?: string;
  endTime?: string;
  startCompletedAt?: string;
  endCompletedAt?: string;
  afterSaleStatus?: number;
  terminateType?: number;
  refundStatus?: number;
  isOverdue?: number;
}

export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  messages?: string[];
}

class AfterSaleBatchService {
  private readonly afterSaleDao = daos.afterSaleDao;
  private readonly afterSaleOperationLogDao = daos.afterSaleOperationLogDao;
  private readonly orderDao = daos.orderDao;
  private readonly orderLogDao = daos.orderLogDao;

  buildQueryConditions(params: AfterSaleQueryParams): WhereOptions<AfterSale> {
    const where: WhereOptions<AfterSale> = {};

    if (params.orderNo) {
      where.order_no = { [Op.like]: `%${params.orderNo}%` };
    }
    if (params.afterSaleNo) {
      where.after_sale_no = { [Op.like]: `%${params.afterSaleNo}%` };
    }
    if (params.afterSaleType !== undefined) {
      where.type = params.afterSaleType;
    }
    if (params.status !== undefined) {
      where.status = params.status;
    }
    if (params.afterSaleStatus !== undefined) {
      where.status = params.afterSaleStatus;
    }
    if (params.cancelScene !== undefined) {
      where.cancel_scene = params.cancelScene;
    }
    if (params.userId !== undefined) {
      where.user_id = params.userId;
    }
    if (params.merchantId !== undefined) {
      where.merchant_id = params.merchantId;
    }
    if (params.terminateType !== undefined) {
      (where as any).cancel_scene = params.terminateType;
    }
    if (params.refundStatus !== undefined) {
      (where as any).stock_rollback_status = params.refundStatus;
    }
    if (params.isOverdue === 1) {
      (where as any).deadline = { [Op.lt]: new Date() };
    } else if (params.isOverdue === 0) {
      (where as any).deadline = { [Op.gte]: new Date() };
    }

    if (params.startTime || params.endTime) {
      where.created_at = {};
      if (params.startTime) {
        (where.created_at as any)[Op.gte] = new Date(params.startTime);
      }
      if (params.endTime) {
        (where.created_at as any)[Op.lte] = new Date(params.endTime);
      }
    }

    if (params.startCompletedAt || params.endCompletedAt) {
      where.completed_at = {};
      if (params.startCompletedAt) {
        (where.completed_at as any)[Op.gte] = new Date(params.startCompletedAt);
      }
      if (params.endCompletedAt) {
        (where.completed_at as any)[Op.lte] = new Date(params.endCompletedAt);
      }
    }

    return where;
  }

  async getAfterSaleList(params: AfterSaleQueryParams): Promise<PageResult<AfterSale>> {
    const { pageNum = 1, pageSize = 10, ...queryParams } = params;
    const where = this.buildQueryConditions(queryParams);

    const result = await this.afterSaleDao.findPage({
      page: pageNum,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });

    return result;
  }

  async getIdsByQuery(params: AfterSaleQueryParams): Promise<{ ids: number[]; count: number }> {
    const where = this.buildQueryConditions(params);
    const result = await this.afterSaleDao.findAndCountAll({
      where,
      attributes: ['id'],
    });
    return {
      ids: result.rows.map(r => r.id),
      count: result.count,
    };
  }

  checkAfterSalePermission(adminRole: number): boolean {
    return adminRole === 1 || adminRole === 2;
  }

  async batchAuditApply(
    ids: number[],
    status: number,
    remark: string,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const afterSale = await this.afterSaleDao.findById(id);
        if (!afterSale) {
          result.failCount++;
          result.messages?.push(`售后ID:${id} 不存在`);
          continue;
        }

        if (afterSale.status !== 0) {
          result.failCount++;
          result.messages?.push(`售后ID:${id} 当前状态不可审核（状态：${this.getStatusName(afterSale.status)}）`);
          continue;
        }

        const oldStatus = afterSale.status;
        await this.afterSaleDao.update(id, {
          status,
          audited_at: new Date(),
          operator_id: operatorId,
          operator_name: operatorName,
          remark: remark || afterSale.remark,
        });

        const actionName = status === 1 ? 'audit_pass' : 'audit_reject';
        const actionDesc = status === 1 ? '审核通过' : '审核拒绝';

        await this.afterSaleOperationLogDao.create({
          after_sale_id: id,
          after_sale_no: afterSale.after_sale_no,
          order_id: afterSale.order_id,
          order_no: afterSale.order_no,
          action: actionName,
          action_desc: actionDesc,
          old_status: oldStatus,
          new_status: status,
          operator_id: operatorId,
          operator_name: operatorName,
          operator_type: 1,
          remark: remark || '',
        });

        await this.orderLogDao.create({
          order_id: afterSale.order_id,
          operator_id: operatorId,
          operator_type: 1,
          action: `售后${actionDesc}`,
          remark: `操作人员：${operatorName}，售后单号：${afterSale.after_sale_no}，${actionDesc}${remark ? '，备注：' + remark : ''}`,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`售后ID:${id} 审核失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return result;
  }

  async batchCloseInvalid(
    ids: number[],
    reason: string,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const afterSale = await this.afterSaleDao.findById(id);
        if (!afterSale) {
          result.failCount++;
          result.messages?.push(`售后ID:${id} 不存在`);
          continue;
        }

        if (afterSale.status === 3 || afterSale.status === 6) {
          result.failCount++;
          result.messages?.push(`售后ID:${id} 已完成或已关闭，不可重复关闭`);
          continue;
        }

        const oldStatus = afterSale.status;
        await this.afterSaleDao.update(id, {
          status: 6,
          handle_remark: reason,
          operator_id: operatorId,
          operator_name: operatorName,
        });

        await this.afterSaleOperationLogDao.create({
          after_sale_id: id,
          after_sale_no: afterSale.after_sale_no,
          order_id: afterSale.order_id,
          order_no: afterSale.order_no,
          action: 'close',
          action_desc: '关闭售后工单',
          old_status: oldStatus,
          new_status: 6,
          operator_id: operatorId,
          operator_name: operatorName,
          operator_type: 1,
          remark: reason,
        });

        await this.orderLogDao.create({
          order_id: afterSale.order_id,
          operator_id: operatorId,
          operator_type: 1,
          action: '关闭售后',
          remark: `操作人员：${operatorName}，售后单号：${afterSale.after_sale_no}，关闭原因：${reason}`,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`售后ID:${id} 关闭失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return result;
  }

  async batchArchiveTerminated(
    params: AfterSaleQueryParams,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: true,
      total: 0,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    const archiveParams: AfterSaleQueryParams = {
      ...params,
      status: 5,
    };

    const { ids } = await this.getIdsByQuery(archiveParams);
    result.total = ids.length;

    for (const id of ids) {
      try {
        const afterSale = await this.afterSaleDao.findById(id);
        if (!afterSale) {
          result.failCount++;
          result.messages?.push(`售后ID:${id} 不存在`);
          continue;
        }

        await this.orderDao.update(afterSale.order_id, {
          is_archived: 1,
        });

        await this.afterSaleOperationLogDao.create({
          after_sale_id: id,
          after_sale_no: afterSale.after_sale_no,
          order_id: afterSale.order_id,
          order_no: afterSale.order_no,
          action: 'archive',
          action_desc: '归档终止订单',
          old_status: afterSale.status,
          new_status: afterSale.status,
          operator_id: operatorId,
          operator_name: operatorName,
          operator_type: 1,
          remark: '批量归档终止订单',
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`售后ID:${id} 归档失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return result;
  }

  getStatusName(status?: number): string {
    const names: Record<number, string> = {
      0: '待审核',
      1: '审核通过',
      2: '处理中',
      3: '已完成',
      4: '已拒绝',
      5: '已取消',
      6: '已关闭',
    };
    return names[status || 0] || '未知';
  }

  getAfterSaleTypeName(type?: number): string {
    const names: Record<number, string> = {
      1: '退款',
      2: '退货退款',
      3: '换货',
      4: '维修',
    };
    return names[type || 0] || '未知';
  }

  getCancelSceneName(scene?: number): string {
    const names: Record<number, string> = {
      0: '非取消',
      1: '主动取消',
      2: '超时取消',
      3: '违规取消',
    };
    return names[scene || 0] || '未知';
  }
}

export const afterSaleBatchService = new AfterSaleBatchService();
export default afterSaleBatchService;
