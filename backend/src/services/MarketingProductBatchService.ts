import { daos } from '../dao';
import { MarketingProductAdmissionService } from './MarketingProductAdmissionService';
import { Op } from 'sequelize';

const {
  marketingProductDao,
} = daos;

const marketingProductAdmissionService = new MarketingProductAdmissionService();

export interface BatchFilterParams {
  marketingId: number;
  admissionStatus?: number;
  keyword?: string;
  categoryId?: number;
  merchantId?: number;
  minStock?: number;
  maxStock?: number;
  isAbnormal?: boolean;
}

export interface BatchOperationResult {
  total: number;
  success: number;
  failed: number;
  results: { id: number; success: boolean; message: string }[];
}

export class MarketingProductBatchService {
  async batchAuditPass(
    ids: number[],
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await marketingProductAdmissionService.auditPass(id, operatorId, operatorName, remark);
        success++;
        results.push({ id, success: true, message: '审核通过' });
      } catch (err) {
        failed++;
        results.push({ id, success: false, message: (err as Error).message });
      }
    }

    return { total: ids.length, success, failed, results };
  }

  async batchAuditReject(
    ids: number[],
    operatorId: number,
    operatorName: string,
    remark: string
  ): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await marketingProductAdmissionService.auditReject(id, operatorId, operatorName, remark);
        success++;
        results.push({ id, success: true, message: '审核驳回' });
      } catch (err) {
        failed++;
        results.push({ id, success: false, message: (err as Error).message });
      }
    }

    return { total: ids.length, success, failed, results };
  }

  async batchOffline(
    ids: number[],
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await marketingProductAdmissionService.offlineProduct(id, operatorId, operatorName, remark);
        success++;
        results.push({ id, success: true, message: '已下架' });
      } catch (err) {
        failed++;
        results.push({ id, success: false, message: (err as Error).message });
      }
    }

    return { total: ids.length, success, failed, results };
  }

  async batchOnline(
    ids: number[],
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await marketingProductAdmissionService.onlineProduct(id, operatorId, operatorName, remark);
        success++;
        results.push({ id, success: true, message: '已上架' });
      } catch (err) {
        failed++;
        results.push({ id, success: false, message: (err as Error).message });
      }
    }

    return { total: ids.length, success, failed, results };
  }

  async batchRemove(
    ids: number[],
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await marketingProductAdmissionService.removeProduct(id, operatorId, operatorName, remark);
        success++;
        results.push({ id, success: true, message: '已移除' });
      } catch (err) {
        failed++;
        results.push({ id, success: false, message: (err as Error).message });
      }
    }

    return { total: ids.length, success, failed, results };
  }

  async filterAndOperate(
    filterParams: BatchFilterParams,
    operation: 'audit_pass' | 'audit_reject' | 'offline' | 'online' | 'remove',
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<BatchOperationResult> {
    const where = this.buildFilterWhere(filterParams);

    const products = await marketingProductDao.findAll({ where });
    const ids = products.map(p => p.id);

    if (ids.length === 0) {
      return { total: 0, success: 0, failed: 0, results: [] };
    }

    switch (operation) {
      case 'audit_pass':
        return this.batchAuditPass(ids, operatorId, operatorName, remark);
      case 'audit_reject':
        return this.batchAuditReject(ids, operatorId, operatorName, remark || '批量驳回');
      case 'offline':
        return this.batchOffline(ids, operatorId, operatorName, remark);
      case 'online':
        return this.batchOnline(ids, operatorId, operatorName, remark);
      case 'remove':
        return this.batchRemove(ids, operatorId, operatorName, remark);
      default:
        throw new Error(`不支持的操作类型: ${operation}`);
    }
  }

  private buildFilterWhere(filterParams: BatchFilterParams): any {
    const where: any = {
      marketing_id: filterParams.marketingId,
    };

    if (filterParams.admissionStatus !== undefined && filterParams.admissionStatus !== null) {
      where.admission_status = filterParams.admissionStatus;
    }

    if (filterParams.keyword) {
      where.goods_name = { [Op.like]: `%${filterParams.keyword}%` };
    }

    if (filterParams.categoryId) {
      where.category_id = filterParams.categoryId;
    }

    if (filterParams.merchantId) {
      where.merchant_id = filterParams.merchantId;
    }

    if (filterParams.minStock !== undefined && filterParams.minStock !== null) {
      where.stock = { ...where.stock, [Op.gte]: filterParams.minStock };
    }

    if (filterParams.maxStock !== undefined && filterParams.maxStock !== null) {
      where.stock = { ...where.stock, [Op.lte]: filterParams.maxStock };
    }

    return where;
  }

  async batchImportApply(
    marketingId: number,
    goodsList: {
      goodsId: number;
      goodsName?: string;
      activityPrice?: number;
      stock?: number;
      sortOrder?: number;
    }[],
    operatorId: number,
    operatorName: string
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    results: { goodsId: number; goodsName?: string; success: boolean; message: string }[];
  }> {
    const results: { goodsId: number; goodsName?: string; success: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const goods of goodsList) {
      try {
        const applyResult = await marketingProductAdmissionService.applyGoods(
          {
            marketingId,
            goodsIds: [goods.goodsId],
            activityPrice: goods.activityPrice,
            stock: goods.stock,
            sortOrder: goods.sortOrder,
          },
          operatorId,
          operatorName
        );

        const itemResult = applyResult.results[0];
        if (itemResult.passed) {
          success++;
        } else {
          failed++;
        }
        results.push({
          goodsId: goods.goodsId,
          goodsName: goods.goodsName,
          success: itemResult.passed,
          message: itemResult.message,
        });
      } catch (err) {
        failed++;
        results.push({
          goodsId: goods.goodsId,
          goodsName: goods.goodsName,
          success: false,
          message: (err as Error).message,
        });
      }
    }

    return { total: goodsList.length, success, failed, results };
  }

  async batchAddCompliantGoods(
    marketingId: number,
    categoryIds?: number[],
    merchantIds?: number[],
    limit: number = 100,
    operatorId: number = 1,
    operatorName: string = '系统'
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    results: { goodsId: number; goodsName: string; success: boolean; message: string }[];
  }> {
    const { marketingDao, goodsDao } = daos;

    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new Error('营销活动不存在');
    }

    const goodsWhere: any = {
      status: 1,
      compliance_rating: { [Op.lte]: 3 },
    };

    if (categoryIds && categoryIds.length > 0) {
      goodsWhere.category_id = { [Op.in]: categoryIds };
    }

    if (merchantIds && merchantIds.length > 0) {
      goodsWhere.merchant_id = { [Op.in]: merchantIds };
    }

    const goodsList = await goodsDao.findAll({
      where: goodsWhere,
      limit,
      order: [['sales', 'DESC']],
    });

    if (goodsList.length === 0) {
      return { total: 0, success: 0, failed: 0, results: [] };
    }

    const goodsIds = goodsList.map(g => g.id);
    const applyResult = await marketingProductAdmissionService.applyGoods(
      { marketingId, goodsIds },
      operatorId,
      operatorName
    );

    return {
      total: goodsList.length,
      success: applyResult.success,
      failed: applyResult.failed,
      results: applyResult.results.map(r => {
        const goods = goodsList.find(g => g.id === r.goodsId);
        return {
          goodsId: r.goodsId,
          goodsName: goods?.name || '',
          success: r.passed,
          message: r.message,
        };
      }),
    };
  }
}

export const marketingProductBatchService = new MarketingProductBatchService();

export default MarketingProductBatchService;
