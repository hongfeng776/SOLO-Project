import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op, WhereOptions } from 'sequelize';
import { goodsAuditValidateService } from '../services/GoodsAuditValidateService';
import { goodsAuditReviewService } from '../services/GoodsAuditReviewService';
import { goodsAuditTraceService } from '../services/GoodsAuditTraceService';

const goodsAuditMainDao = daos.goodsAuditMainDao;
const goodsAuditItemDao = daos.goodsAuditItemDao;
const goodsAuditResubmitDao = daos.goodsAuditResubmitDao;

export const submitAudit = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id, timeout_hours } = req.body;

  if (!goods_id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const duplicateCheck = await goodsAuditTraceService.checkDuplicateSubmit(goods_id);
  if (duplicateCheck.is_duplicate) {
    badRequest(res, '该商品存在待审核的记录，不可重复提交');
    return;
  }

  const validateResult = await goodsAuditValidateService.validatePreSubmit(goods_id);

  const transaction: Transaction = await sequelize.transaction();

  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayCount = await goodsAuditMainDao.countTodayAuditNo();
    const seq = String(todayCount + 1).padStart(4, '0');
    const auditNo = `AUD${dateStr}${seq}`;

    const goods = await daos.goodsDao.findById(goods_id);
    const goodsData = goods ? ((goods as any).toJSON ? (goods as any).toJSON() : goods) : {};
    const merchantId = goodsData.merchant_id;

    let merchantCreditScore = 0;
    if (merchantId) {
      const merchant = await daos.merchantDao.findById(merchantId);
      if (merchant) {
        const merchantData = (merchant as any).toJSON ? (merchant as any).toJSON() : merchant;
        merchantCreditScore = merchantData.credit_score ?? 100;
      }
    }

    const riskLevel = await goodsAuditReviewService.getRiskLevel(goods_id);

    const audit = await goodsAuditMainDao.create(
      {
        goods_id,
        audit_no: auditNo,
        merchant_id: merchantId,
        risk_level: riskLevel,
        merchant_credit_score: merchantCreditScore,
        status: 0,
        submit_at: new Date(),
        timeout_hours: timeout_hours || 48,
      } as any,
      { transaction }
    );

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
    const auditId = auditData.id;

    const allItems: any[] = [];
    for (const condition of validateResult.conditions) {
      for (const item of condition.items) {
        allItems.push({
          audit_id: auditId,
          category: condition.category,
          item_name: item.name,
          item_code: item.item_code,
          check_result: item.result,
          required: 1,
          detail: item.detail || null,
          suggestion: item.suggestion || null,
        });
      }
    }

    if (allItems.length > 0) {
      await goodsAuditItemDao.batchCreate(allItems);
    }

    await goodsAuditValidateService.autoInitialReview(auditId);

    await transaction.commit();

    const finalAudit = await goodsAuditMainDao.findById(auditId);
    ok(res, finalAudit, '提交审核成功');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const withdrawAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const audit = await goodsAuditMainDao.findById(parseInt(id, 10));
  if (!audit) {
    throw new AppError('审核记录不存在', 404);
  }

  const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
  if (![0, 1, 5].includes(auditData.status)) {
    throw new AppError('当前状态不允许撤回', 400);
  }

  await goodsAuditMainDao.update(parseInt(id, 10), { status: 7 } as any);
  ok(res, null, '撤回成功');
});

export const getAuditDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const audit = await goodsAuditMainDao.findById(parseInt(id, 10));
  if (!audit) {
    throw new AppError('审核记录不存在', 404);
  }

  const items = await goodsAuditItemDao.findByAuditId(parseInt(id, 10));
  const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;

  ok(res, { ...auditData, items }, '获取审核详情成功');
});

export const getAuditList = asyncHandler(async (req: Request, res: Response) => {
  const {
    page,
    pageSize,
    goods_id,
    merchant_id,
    status,
    risk_level,
    audit_no,
    start_time,
    end_time,
  } = req.query;

  const where: WhereOptions = {};

  if (goods_id) (where as any).goods_id = parseInt(goods_id as string, 10);
  if (merchant_id) (where as any).merchant_id = parseInt(merchant_id as string, 10);
  if (status !== undefined) (where as any).status = parseInt(status as string, 10);
  if (risk_level !== undefined) (where as any).risk_level = parseInt(risk_level as string, 10);
  if (audit_no) (where as any).audit_no = audit_no;
  if (start_time || end_time) {
    (where as any).submit_at = {};
    if (start_time) (where as any).submit_at[Op.gte] = new Date(start_time as string);
    if (end_time) (where as any).submit_at[Op.lte] = new Date(end_time as string);
  }

  const result = await goodsAuditMainDao.findPage({
    page: page ? parseInt(page as string, 10) : 1,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : 10,
    where,
    order: [['submit_at', 'DESC']],
  });

  ok(res, result, '获取审核列表成功');
});

export const resubmitAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { change_fields, supplement_materials_json } = req.body;

  const audit = await goodsAuditMainDao.findById(parseInt(id, 10));
  if (!audit) {
    throw new AppError('审核记录不存在', 404);
  }

  const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
  if (![2, 4, 5].includes(auditData.status)) {
    throw new AppError('当前状态不允许重提', 400);
  }

  const canResubmit = await goodsAuditValidateService.canResubmit(parseInt(id, 10));
  if (!canResubmit.can_resubmit) {
    throw new AppError(canResubmit.reason || '不可重提', 400);
  }

  const resubmitCount = await goodsAuditResubmitDao.countByAuditId(parseInt(id, 10));

  const transaction: Transaction = await sequelize.transaction();

  try {
    await goodsAuditResubmitDao.create(
      {
        audit_id: parseInt(id, 10),
        goods_id: auditData.goods_id,
        resubmit_no: resubmitCount + 1,
        previous_status: auditData.status,
        change_fields: change_fields || [],
        supplement_materials_json: supplement_materials_json || [],
        submitter_id: req.user?.id,
        submit_at: new Date(),
      } as any,
      { transaction }
    );

    await goodsAuditMainDao.update(
      parseInt(id, 10),
      {
        status: 0,
        submit_at: new Date(),
        initial_reviewer_id: null,
        initial_result: null,
        initial_remark: null,
        initial_reviewed_at: null,
        final_reviewer_id: null,
        final_result: null,
        final_remark: null,
        final_reviewed_at: null,
        reject_reasons_json: null,
        timeout_flag: 0,
      } as any,
      { transaction }
    );

    await transaction.commit();
    ok(res, null, '重提成功');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export default {
  submitAudit,
  withdrawAudit,
  getAuditDetail,
  getAuditList,
  resubmitAudit,
};
