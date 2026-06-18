import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op } from 'sequelize';
import { PageResult } from '../dao/BaseDao';
import { MerchantSettleStatus } from '../models/Merchant';
import {
  QualificationStatus,
} from '../models/MerchantQualification';
import {
  LedgerOperationType,
} from '../models/MerchantQualificationLedger';
import { MerchantAuditStatus } from './MerchantAuditService';
import { Goods } from '../models/Goods';

export interface AuditApprovePayload {
  merchant_id: number;
  auditor_id?: number;
  auditor_name?: string;
  reason?: string;
  qualification_opinions?: Array<{
    qualification_id: number;
    audit_opinion?: string;
    missing_flag?: number;
    violation_flag?: number;
    status?: number;
  }>;
}

export interface AuditRejectPayload {
  merchant_id: number;
  auditor_id?: number;
  auditor_name?: string;
  reason: string;
  missing_materials?: string[];
  violation_points?: string[];
  need_resubmit?: number;
  resubmit_deadline?: string;
  qualification_opinions?: Array<{
    qualification_id: number;
    audit_opinion?: string;
    missing_flag?: number;
    violation_flag?: number;
    status?: number;
  }>;
}

export interface MerchantSettleQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  phone?: string;
  settle_status?: number;
  settle_status_list?: number[];
  credit_code?: string;
  license_expire_start?: string;
  license_expire_end?: string;
  industry_type?: string;
  has_expired_qualification?: number;
  has_abnormal_qualification?: number;
  startDate?: string;
  endDate?: string;
}

class MerchantQualificationAuditService {
  private readonly merchantDao = daos.merchantDao;
  private readonly merchantAuditDao = daos.merchantAuditDao;
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly merchantQualificationLedgerDao = daos.merchantQualificationLedgerDao;
  private readonly qualificationChangeLogDao = daos.qualificationChangeLogDao;

  async getSettleMerchantList(params: MerchantSettleQueryParams): Promise<PageResult<any>> {
    const {
      page = 1,
      pageSize = 10,
      name,
      phone,
      settle_status,
      settle_status_list,
      credit_code,
      license_expire_start,
      license_expire_end,
      industry_type,
      startDate,
      endDate,
    } = params;

    const where: any = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (phone) where.phone = { [Op.like]: `%${phone}%` };
    if (settle_status !== undefined) where.settle_status = settle_status;
    if (settle_status_list && settle_status_list.length > 0) {
      where.settle_status = { [Op.in]: settle_status_list };
    }
    if (credit_code) where.credit_code = { [Op.like]: `%${credit_code}%` };
    if (industry_type) where.industry_type = industry_type;
    if (license_expire_start || license_expire_end) {
      where.license_valid_to = {};
      if (license_expire_start) where.license_valid_to[Op.gte] = new Date(license_expire_start);
      if (license_expire_end) where.license_valid_to[Op.lte] = new Date(license_expire_end);
    }
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const result = await this.merchantDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });

    const records = result.list.map(m => {
      const obj = (m as any).toJSON ? (m as any).toJSON() : { ...m };
      const now = new Date();
      let hasExpiredQualification = false;
      if (obj.license_valid_to && new Date(obj.license_valid_to) < now) {
        hasExpiredQualification = true;
      }
      return {
        ...obj,
        settle_status_text: MerchantSettleStatus[obj.settle_status as number] || '',
        has_expired_qualification: hasExpiredQualification,
      };
    });

    return { list: records, total: result.total, page, pageSize, totalPages: Math.ceil(result.total / pageSize) };
  }

  async getAuditDetail(merchantId: number): Promise<any> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }

    const qualifications = await this.merchantQualificationDao.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['material_order', 'ASC'], ['created_at', 'DESC']],
    } as any);

    const audits = await this.merchantAuditDao.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
    } as any);

    const ledgers = await this.merchantQualificationLedgerDao.findByMerchantId(merchantId);

    return {
      merchant: merchant.toJSON(),
      qualifications,
      audits,
      ledgers,
    };
  }

  async approve(payload: AuditApprovePayload): Promise<any> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const merchantId = payload.merchant_id;
      const merchant = await this.merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const latestAudit = await this.merchantAuditDao.findLatestByMerchantId(merchantId);
      if (latestAudit && latestAudit.status === MerchantAuditStatus.APPROVED) {
        throw new AppError('该商家已审核通过，无需重复审核', 400);
      }

      const oldSettleStatus = merchant.settle_status;

      await this.merchantDao.update(merchantId, {
        settle_status: MerchantSettleStatus.AUDIT_APPROVED,
        shop_open_status: 1,
        goods_publish_permission: 1,
        audit_reason: payload.reason || '审核通过，资质材料完整有效',
        last_audit_time: new Date(),
      }, { transaction });

      if (payload.qualification_opinions && payload.qualification_opinions.length > 0) {
        for (const op of payload.qualification_opinions) {
          const updateData: any = {};
          if (op.audit_opinion) updateData.audit_opinion = op.audit_opinion;
          if (op.missing_flag !== undefined) updateData.missing_flag = op.missing_flag;
          if (op.violation_flag !== undefined) updateData.violation_flag = op.violation_flag;
          if (op.status !== undefined) updateData.status = op.status;
          else updateData.status = QualificationStatus.VALID;

          await this.merchantQualificationDao.update(op.qualification_id, updateData, { transaction });

          await this.qualificationChangeLogDao.create({
            merchant_id: merchantId,
            qualification_id: op.qualification_id,
            change_field: 'audit_status',
            value_before: String(oldSettleStatus),
            value_after: String(MerchantSettleStatus.AUDIT_APPROVED),
            operator_id: payload.auditor_id,
            operator_name: payload.auditor_name,
            change_reason: '审核通过，资质状态更新',
          }, { transaction });
        }
      } else {
        const allQuals = await this.merchantQualificationDao.findAll({
          where: { merchant_id: merchantId } as any,
        } as any);
        for (const q of allQuals) {
          await this.merchantQualificationDao.update(q.id, {
            status: QualificationStatus.VALID,
            missing_flag: 0,
            violation_flag: 0,
            audit_opinion: payload.reason || '审核通过',
          }, { transaction });
        }
      }

      const audit = await this.merchantAuditDao.create({
        merchant_id: merchantId,
        auditor_id: payload.auditor_id || 0,
        status: MerchantAuditStatus.APPROVED,
        reason: payload.reason || '审核通过，资质符合要求',
        audit_step: 'approve',
        operation_type: 'initial',
      }, { transaction });

      await this.merchantQualificationLedgerDao.create({
        merchant_id: merchantId,
        operation_type: LedgerOperationType.APPROVE,
        settle_status_before: oldSettleStatus,
        settle_status_after: MerchantSettleStatus.AUDIT_APPROVED,
        operator_id: payload.auditor_id,
        operator_name: payload.auditor_name,
        operation_remark: payload.reason || '审核通过，开通店铺权限和商品上架权限',
      }, { transaction });

      await transaction.commit();
      return { audit_id: audit.id, message: '审核通过成功，已开通店铺及商品上架权限' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reject(payload: AuditRejectPayload): Promise<any> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const merchantId = payload.merchant_id;
      const merchant = await this.merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const oldSettleStatus = merchant.settle_status;

      await this.merchantDao.update(merchantId, {
        settle_status: MerchantSettleStatus.AUDIT_REJECTED,
        shop_open_status: 0,
        goods_publish_permission: 0,
        audit_reason: payload.reason,
        last_audit_time: new Date(),
      }, { transaction });

      await (Goods as any).update(
        { status: 0 },
        {
          where: { merchant_id: merchantId, status: 1 },
          transaction,
        }
      );

      if (payload.qualification_opinions && payload.qualification_opinions.length > 0) {
        for (const op of payload.qualification_opinions) {
          const updateData: any = {};
          if (op.audit_opinion) updateData.audit_opinion = op.audit_opinion;
          if (op.missing_flag !== undefined) updateData.missing_flag = op.missing_flag;
          if (op.violation_flag !== undefined) updateData.violation_flag = op.violation_flag;
          if (op.status !== undefined) updateData.status = op.status;
          else updateData.status = QualificationStatus.PENDING;

          await this.merchantQualificationDao.update(op.qualification_id, updateData, { transaction });
        }
      }

      const audit = await this.merchantAuditDao.create({
        merchant_id: merchantId,
        auditor_id: payload.auditor_id || 0,
        status: MerchantAuditStatus.REJECTED,
        reason: payload.reason,
        audit_step: 'reject',
        missing_materials: payload.missing_materials || [],
        violation_points: payload.violation_points || [],
        need_resubmit: payload.need_resubmit ? 1 : 0,
        resubmit_deadline: payload.resubmit_deadline ? new Date(payload.resubmit_deadline) : undefined,
        operation_type: 'initial',
      }, { transaction });

      await this.merchantQualificationLedgerDao.create({
        merchant_id: merchantId,
        operation_type: LedgerOperationType.REJECT,
        settle_status_before: oldSettleStatus,
        settle_status_after: MerchantSettleStatus.AUDIT_REJECTED,
        operator_id: payload.auditor_id,
        operator_name: payload.auditor_name,
        operation_remark: `审核驳回：${payload.reason}${payload.missing_materials && payload.missing_materials.length > 0 ? `；缺失材料：${payload.missing_materials.join('、')}` : ''}${payload.violation_points && payload.violation_points.length > 0 ? `；违规点：${payload.violation_points.join('、')}` : ''}`,
      }, { transaction });

      await transaction.commit();
      return { audit_id: audit.id, message: '审核驳回成功，已同步更新商家台账' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async review(payload: AuditApprovePayload): Promise<any> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const merchantId = payload.merchant_id;
      const merchant = await this.merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const oldSettleStatus = merchant.settle_status;

      await this.merchantDao.update(merchantId, {
        settle_status: MerchantSettleStatus.PENDING_AUDIT,
        audit_reason: payload.reason || '发起资质复核',
        last_audit_time: new Date(),
      }, { transaction });

      const audit = await this.merchantAuditDao.create({
        merchant_id: merchantId,
        auditor_id: payload.auditor_id || 0,
        status: MerchantAuditStatus.PENDING,
        reason: payload.reason || '发起资质复核',
        audit_step: 'review',
        operation_type: 'review',
      }, { transaction });

      await this.merchantQualificationLedgerDao.create({
        merchant_id: merchantId,
        operation_type: LedgerOperationType.CHANGE,
        settle_status_before: oldSettleStatus,
        settle_status_after: MerchantSettleStatus.PENDING_AUDIT,
        operator_id: payload.auditor_id,
        operator_name: payload.auditor_name,
        operation_remark: payload.reason || '发起资质复核',
      }, { transaction });

      await transaction.commit();
      return { audit_id: audit.id, message: '资质复核发起成功' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async processExpiredQualifications(): Promise<{ updated: number }> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const now = new Date();
      let updated = 0;

      const expiredQuals = await this.merchantQualificationDao.findAll({
        where: {
          expire_date: { [Op.lt]: now },
          status: { [Op.ne]: QualificationStatus.EXPIRED },
        } as any,
      } as any);

      const merchantIds: Set<number> = new Set();
      for (const q of expiredQuals) {
        await this.merchantQualificationDao.update(q.id, { status: QualificationStatus.EXPIRED }, { transaction });
        merchantIds.add(q.merchant_id);
        updated++;

        await this.merchantQualificationLedgerDao.create({
          merchant_id: q.merchant_id,
          qualification_id: q.id,
          operation_type: LedgerOperationType.EXPIRE,
          status_before: q.status,
          status_after: QualificationStatus.EXPIRED,
          operator_id: 0,
          operator_name: '系统自动',
          operation_remark: `资质自动过期：[${q.qualification_type}]`,
        }, { transaction });
      }

      for (const mid of Array.from(merchantIds)) {
        const merchant = await this.merchantDao.findById(mid);
        if (!merchant) continue;
        const oldSettle = merchant.settle_status;
        await this.merchantDao.update(mid, {
          settle_status: MerchantSettleStatus.QUALIFICATION_EXPIRED,
          shop_open_status: 0,
          goods_publish_permission: 0,
        }, { transaction });

        await this.merchantQualificationLedgerDao.create({
          merchant_id: mid,
          operation_type: LedgerOperationType.EXPIRE,
          settle_status_before: oldSettle,
          settle_status_after: MerchantSettleStatus.QUALIFICATION_EXPIRED,
          operator_id: 0,
          operator_name: '系统自动',
          operation_remark: '资质过期，自动冻结店铺及商品上架权限',
        }, { transaction });
      }

      await transaction.commit();
      return { updated };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const merchantQualificationAuditService = new MerchantQualificationAuditService();
export default MerchantQualificationAuditService;
