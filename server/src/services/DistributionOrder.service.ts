import { distributionOrderDao, distributionOrderQueryLogDao, orderDao } from '../dao';
import { DistributionOrderQueryParams, OrderStatistics } from '../dao/DistributionOrder.dao';
import { PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { OrderStatus, PermissionModule } from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

export interface QueryValidationResult {
  valid: boolean;
  message?: string;
  needsConfirmation?: boolean;
  confirmationType?: 'time_range' | 'large_result';
}

export interface ExportParams extends DistributionOrderQueryParams {
  fields?: string[];
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const HIGH_FREQUENCY_THRESHOLD = {
  USER_WINDOW_MINUTES: 1,
  USER_MAX_QUERIES: 30,
  IP_WINDOW_MINUTES: 5,
  IP_MAX_QUERIES: 100,
};

const EXPORT_PERMISSION_CODES = ['order:export', 'distribution-order:export'];

class DistributionOrderService {
  public validateQueryParams(params: DistributionOrderQueryParams): QueryValidationResult {
    if (params.orderNo && params.orderNo.length > 50) {
      return { valid: false, message: '订单号长度不能超过50个字符' };
    }

    if (params.productId && params.productId.length > 100) {
      return { valid: false, message: '商品ID长度不能超过100个字符' };
    }

    if (params.startTime && params.endTime) {
      const start = new Date(params.startTime);
      const end = new Date(params.endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, message: '时间格式不正确' };
      }
      if (start > end) {
        return { valid: false, message: '开始时间不能晚于结束时间' };
      }
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        return {
          valid: true,
          needsConfirmation: true,
          confirmationType: 'time_range',
          message: `查询时间跨度为${diffDays}天，超过90天可能导致查询缓慢，是否继续？`,
        };
      }
    }

    if (params.status !== undefined) {
      const validStatuses = Object.values(OrderStatus);
      if (Array.isArray(params.status)) {
        for (const s of params.status) {
          if (!validStatuses.includes(s as OrderStatus)) {
            return { valid: false, message: `无效的订单状态: ${s}` };
          }
        }
      } else {
        if (!validStatuses.includes(params.status as OrderStatus)) {
          return { valid: false, message: `无效的订单状态: ${params.status}` };
        }
      }
    }

    if (params.page < 1) {
      return { valid: false, message: '页码不能小于1' };
    }
    if (params.pageSize < 1 || params.pageSize > 500) {
      return { valid: false, message: '每页数量必须在1-500之间' };
    }

    if (params.sortOrder && !['ASC', 'DESC'].includes(params.sortOrder)) {
      return { valid: false, message: '排序方式必须为ASC或DESC' };
    }

    return { valid: true };
  }

  public async checkHighFrequencyQuery(userId: string, ip: string): Promise<boolean> {
    const now = new Date();
    const userWindowStart = new Date(now.getTime() - HIGH_FREQUENCY_THRESHOLD.USER_WINDOW_MINUTES * 60 * 1000);
    const ipWindowStart = new Date(now.getTime() - HIGH_FREQUENCY_THRESHOLD.IP_WINDOW_MINUTES * 60 * 1000);

    const userCount = await distributionOrderQueryLogDao.countByUserInTimeWindow(
      userId,
      userWindowStart,
      now
    );
    if (userCount >= HIGH_FREQUENCY_THRESHOLD.USER_MAX_QUERIES) {
      return true;
    }

    const ipCount = await distributionOrderQueryLogDao.countByIpInTimeWindow(ip, ipWindowStart, now);
    if (ipCount >= HIGH_FREQUENCY_THRESHOLD.IP_MAX_QUERIES) {
      return true;
    }

    return false;
  }

  public async recordQuery(
    userId: string,
    userName: string,
    params: DistributionOrderQueryParams,
    resultCount: number,
    queryDuration: number,
    ip: string,
    userAgent?: string
  ): Promise<void> {
    const conditionsToSave: any = { ...params };
    delete conditionsToSave.page;
    delete conditionsToSave.pageSize;

    await distributionOrderQueryLogDao.create({
      userId,
      userName,
      queryConditions: conditionsToSave,
      resultCount,
      queryDuration,
      ip,
      userAgent,
    });
  }

  public async findAll(
    params: DistributionOrderQueryParams,
    userId: string,
    userName: string,
    ip: string,
    userAgent?: string
  ): Promise<PaginationResult<any>> {
    const startTime = Date.now();

    const validation = this.validateQueryParams(params);
    if (!validation.valid) {
      throw new AppError(validation.message!, BusinessCode.PARAM_ERROR);
    }

    const isHighFrequency = await this.checkHighFrequencyQuery(userId, ip);
    if (isHighFrequency) {
      throw new AppError('查询过于频繁，请稍后再试', BusinessCode.FREQUENCY_LIMIT);
    }

    const cacheKey = `${CacheKey.ORDER_LIST}dist_${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page, pageSize } = params;
    const { rows, count } = await distributionOrderDao.findAllPaged(params);

    const result: PaginationResult<any> = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };

    const queryDuration = Date.now() - startTime;
    try {
      await this.recordQuery(userId, userName, params, count, queryDuration, ip, userAgent);
    } catch (logError) {
      console.error('Failed to record query log:', logError);
    }

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);

    return result;
  }

  public async getStatistics(
    params: DistributionOrderQueryParams
  ): Promise<OrderStatistics> {
    const validation = this.validateQueryParams(params);
    if (!validation.valid) {
      throw new AppError(validation.message!, BusinessCode.PARAM_ERROR);
    }

    return distributionOrderDao.getStatistics(params);
  }

  public async bulkMark(
    ids: string[],
    remark: string,
    operatorId: string,
    operatorName: string
  ): Promise<{ count: number; orders: any[] }> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要标记的订单', BusinessCode.PARAM_ERROR);
    }
    if (ids.length > 1000) {
      throw new AppError('单次批量操作不能超过1000条记录', BusinessCode.PARAM_ERROR);
    }

    const consistency = await distributionOrderDao.validateDataConsistency(ids);
    if (!consistency.valid) {
      throw new AppError(`数据校验失败: ${consistency.issues.join(', ')}`, BusinessCode.ERROR);
    }

    const updateData: any = {};
    if (remark) {
      updateData.remark = remark;
    }

    await distributionOrderDao.bulkMark(ids, updateData);
    await CacheUtils.delPattern(`${CacheKey.ORDER_LIST}*`);

    const orders = await distributionOrderDao.findByIds(ids);

    return { count: ids.length, orders };
  }

  public async checkExportPermission(userPermissions: string[]): Promise<boolean> {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    return EXPORT_PERMISSION_CODES.some((code) => userPermissions.includes(code));
  }

  public async export(
    params: ExportParams,
    userId: string,
    userName: string,
    ip: string,
    userAgent?: string
  ): Promise<any[]> {
    const startTime = Date.now();

    const baseParams: DistributionOrderQueryParams = {
      ...params,
      page: 1,
      pageSize: 99999,
    };

    const validation = this.validateQueryParams(baseParams);
    if (!validation.valid) {
      throw new AppError(validation.message!, BusinessCode.PARAM_ERROR);
    }

    const validFields = [
      'orderNo',
      'productName',
      'productSku',
      'quantity',
      'unitPrice',
      'totalAmount',
      'payAmount',
      'commissionRate',
      'commissionAmount',
      'status',
      'payTime',
      'shipTime',
      'completeTime',
      'cancelTime',
      'remark',
      'receiverName',
      'receiverPhone',
      'receiverAddress',
      'createdAt',
    ];
    let exportFields = params.fields;
    if (exportFields && exportFields.length > 0) {
      exportFields = exportFields.filter((f) => validFields.includes(f));
    }

    const data = await distributionOrderDao.findAllForExport(
      baseParams,
      exportFields,
      params.sortField,
      params.sortOrder
    );

    const queryDuration = Date.now() - startTime;
    try {
      await this.recordQuery(
        userId,
        userName,
        { ...baseParams, fields: exportFields, sortField: params.sortField, sortOrder: params.sortOrder } as any,
        data.length,
        queryDuration,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error('Failed to record export log:', logError);
    }

    return data;
  }

  public async getBatchStatistics(ids: string[]): Promise<{
    totalCount: number;
    totalAmount: number;
    totalCommission: number;
    statusBreakdown: { status: OrderStatus; count: number }[];
    abnormalCount: number;
    unsettledCount: number;
  }> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择订单', BusinessCode.PARAM_ERROR);
    }

    const params: DistributionOrderQueryParams = {
      page: 1,
      pageSize: ids.length,
      ids,
    };

    const stats = await distributionOrderDao.getStatistics(params);

    return {
      totalCount: stats.total,
      totalAmount: stats.totalAmount,
      totalCommission: stats.totalCommission,
      statusBreakdown: stats.statusBreakdown,
      abnormalCount: stats.abnormalCount,
      unsettledCount: stats.unsettledCount,
    };
  }

  public async getQueryLogs(
    page: number,
    pageSize: number,
    userId?: string,
    startTime?: string,
    endTime?: string
  ): Promise<PaginationResult<any>> {
    const { Op } = require('sequelize');
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const offset = (page - 1) * pageSize;
    const { rows, count } = await distributionOrderQueryLogDao.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }
}

export default new DistributionOrderService();
