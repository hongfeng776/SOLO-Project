import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Op } from 'sequelize';
import { MERCHANT_SETTLE_STATUS_MAP } from '../models/Merchant';
import { MERCHANT_AUDIT_STEP_MAP } from '../models/MerchantAudit';
import { QUALIFICATION_TYPE_MAP, QUALIFICATION_STATUS_MAP } from '../models/MerchantQualification';
import { LEDGER_OPERATION_TYPE_MAP } from '../models/MerchantQualificationLedger';

export interface TraceQueryParams {
  merchant_id: number;
  qualification_id?: number;
  operation_type?: string;
  start_time?: string;
  end_time?: string;
}

export interface UniquenessCheckParams {
  credit_code?: string;
  business_license_no?: string;
  legal_id_card?: string;
  phone?: string;
  name?: string;
  exclude_merchant_id?: number;
}

export interface UniquenessCheckResult {
  is_unique: boolean;
  duplicates: Array<{
    field: string;
    value: string;
    merchant_ids: number[];
    merchant_names: string[];
    message: string;
  }>;
}

export interface FraudCheckParams {
  merchant_id?: number;
  credit_code?: string;
  business_license_no?: string;
  certificate_nos?: string[];
}

export interface FraudCheckResult {
  is_fraud: boolean;
  risk_points: Array<{
    level: 'low' | 'medium' | 'high';
    field: string;
    value?: string;
    message: string;
  }>;
  suggestion: string;
}

class MerchantQualificationTraceService {
  private readonly merchantDao = daos.merchantDao;
  private readonly merchantAuditDao = daos.merchantAuditDao;
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly merchantQualificationLedgerDao = daos.merchantQualificationLedgerDao;
  private readonly qualificationChangeLogDao = daos.qualificationChangeLogDao;

  async getFullTrace(merchantId: number): Promise<any> {
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

    const changeLogs = await this.qualificationChangeLogDao.findByMerchantId(merchantId);

    return {
      merchant: {
        ...merchant.toJSON(),
        settle_status_text: MERCHANT_SETTLE_STATUS_MAP[merchant.settle_status ?? 0] || '',
      },
      qualifications: qualifications.map(q => ({
        ...(q as any).toJSON(),
        qualification_type_text: QUALIFICATION_TYPE_MAP[(q as any).qualification_type] || (q as any).qualification_type,
        status_text: QUALIFICATION_STATUS_MAP[(q as any).status ?? 2] || '',
      })),
      audits: audits.map(a => ({
        ...(a as any).toJSON(),
        audit_step_text: MERCHANT_AUDIT_STEP_MAP[(a as any).audit_step] || (a as any).audit_step,
        status_text: ['待审核', '审核通过', '审核拒绝'][(a as any).status ?? 0] || '',
      })),
      ledgers: ledgers.map(l => ({
        ...(l as any).toJSON(),
        operation_type_text: LEDGER_OPERATION_TYPE_MAP[(l as any).operation_type] || (l as any).operation_type,
      })),
      change_logs: changeLogs,
      timeline: this.buildTimeline(qualifications, audits, ledgers, changeLogs),
    };
  }

  private buildTimeline(
    qualifications: any[],
    audits: any[],
    ledgers: any[],
    changeLogs: any[]
  ): any[] {
    const events: any[] = [];

    for (const q of qualifications) {
      events.push({
        time: q.created_at,
        type: 'qualification',
        action: 'SUBMIT',
        title: `提交资质材料：${QUALIFICATION_TYPE_MAP[q.qualification_type] || q.qualification_type}`,
        detail: q,
      });
      if (q.updated_at && q.updated_at !== q.created_at) {
        events.push({
          time: q.updated_at,
          type: 'qualification',
          action: 'UPDATE',
          title: `更新资质材料：${QUALIFICATION_TYPE_MAP[q.qualification_type] || q.qualification_type}`,
          detail: q,
        });
      }
    }

    for (const a of audits) {
      const statusMap = ['待审核', '审核通过', '审核拒绝'];
      events.push({
        time: a.created_at,
        type: 'audit',
        action: a.audit_step?.toUpperCase() || 'AUDIT',
        title: `审核操作：${statusMap[a.status ?? 0] || ''} - ${MERCHANT_AUDIT_STEP_MAP[a.audit_step] || ''}`,
        detail: a,
      });
    }

    for (const l of ledgers) {
      events.push({
        time: l.created_at,
        type: 'ledger',
        action: l.operation_type?.toUpperCase() || 'LEDGER',
        title: `台账记录：${LEDGER_OPERATION_TYPE_MAP[l.operation_type] || l.operation_type}`,
        detail: l,
      });
    }

    for (const c of changeLogs) {
      events.push({
        time: c.created_at,
        type: 'change',
        action: 'CHANGE',
        title: `变更字段：${c.change_field}`,
        detail: c,
      });
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return events;
  }

  async getQualificationValidityLedger(
    params?: {
      page?: number;
      pageSize?: number;
      merchant_id?: number;
      operation_type?: string;
      start_time?: string;
      end_time?: string;
    }
  ): Promise<any> {
    const { page = 1, pageSize = 20, merchant_id, operation_type, start_time, end_time } = params || {};

    const where: any = {};
    if (merchant_id !== undefined) where.merchant_id = merchant_id;
    if (operation_type) where.operation_type = operation_type;
    if (start_time || end_time) {
      where.created_at = {};
      if (start_time) where.created_at[Op.gte] = new Date(start_time);
      if (end_time) where.created_at[Op.lte] = new Date(end_time);
    }

    const result = await this.merchantQualificationLedgerDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });

    const list = result.list.map(l => ({
      ...(l as any).toJSON(),
      operation_type_text: LEDGER_OPERATION_TYPE_MAP[(l as any).operation_type] || (l as any).operation_type,
    }));

    return { ...result, list };
  }

  async checkUniqueness(params: UniquenessCheckParams): Promise<UniquenessCheckResult> {
    const duplicates: UniquenessCheckResult['duplicates'] = [];
    const excludeId = params.exclude_merchant_id;

    if (params.credit_code) {
      const where: any = { credit_code: params.credit_code };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const found = await this.merchantDao.findAll({ where } as any);
      if (found && found.length > 0) {
        duplicates.push({
          field: 'credit_code',
          value: params.credit_code,
          merchant_ids: found.map(m => (m as any).id),
          merchant_names: found.map(m => (m as any).name),
          message: `统一社会信用代码已被 ${found.length} 家商家使用`,
        });
      }
    }

    if (params.business_license_no) {
      const where: any = { business_license_no: params.business_license_no };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const found = await this.merchantDao.findAll({ where } as any);
      if (found && found.length > 0) {
        duplicates.push({
          field: 'business_license_no',
          value: params.business_license_no,
          merchant_ids: found.map(m => (m as any).id),
          merchant_names: found.map(m => (m as any).name),
          message: `营业执照号已被 ${found.length} 家商家使用`,
        });
      }
    }

    if (params.legal_id_card) {
      const where: any = { legal_id_card: params.legal_id_card };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const found = await this.merchantDao.findAll({ where } as any);
      if (found && found.length > 0) {
        duplicates.push({
          field: 'legal_id_card',
          value: params.legal_id_card,
          merchant_ids: found.map(m => (m as any).id),
          merchant_names: found.map(m => (m as any).name),
          message: `法人身份证已被 ${found.length} 家商家使用`,
        });
      }
    }

    if (params.name) {
      const where: any = { name: params.name };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const found = await this.merchantDao.findAll({ where } as any);
      if (found && found.length > 0) {
        duplicates.push({
          field: 'name',
          value: params.name,
          merchant_ids: found.map(m => (m as any).id),
          merchant_names: found.map(m => (m as any).name),
          message: `商家名称已被 ${found.length} 家商家使用`,
        });
      }
    }

    return {
      is_unique: duplicates.length === 0,
      duplicates,
    };
  }

  async checkFraud(params: FraudCheckParams): Promise<FraudCheckResult> {
    const risk_points: FraudCheckResult['risk_points'] = [];

    if (params.merchant_id) {
      const merchant = await this.merchantDao.findById(params.merchant_id);
      if (merchant) {
        const audits = await this.merchantAuditDao.findByMerchantId(params.merchant_id);
        const rejectCount = audits.filter(a => a.status === 2).length;
        if (rejectCount >= 3) {
          risk_points.push({
            level: 'high',
            field: 'audit_reject_count',
            message: `该商家累计被驳回 ${rejectCount} 次，存在较高虚假材料风险`,
          });
        }

        const quals = await this.merchantQualificationDao.findAll({
          where: { merchant_id: params.merchant_id } as any,
        } as any);
        const verifyFailCount = quals.filter(q => (q as any).verification_status === 2).length;
        if (verifyFailCount > 0) {
          risk_points.push({
            level: 'high',
            field: 'verification_fail',
            message: `该商家有 ${verifyFailCount} 项资质核验未通过`,
          });
        }
      }
    }

    if (params.certificate_nos && params.certificate_nos.length > 0) {
      for (const certNo of params.certificate_nos) {
        if (certNo.includes('TEST') || certNo.includes('FALSE') || certNo.includes('FAKE')) {
          risk_points.push({
            level: 'high',
            field: 'certificate_no',
            value: certNo,
            message: `证件号码 [${certNo}] 包含可疑字符，疑似伪造`,
          });
        }

        const where: any = { certificate_no: certNo };
        if (params.merchant_id) {
          where.merchant_id = { [Op.ne]: params.merchant_id };
        }
        const dupQuals = await this.merchantQualificationDao.findAll({ where } as any);
        if (dupQuals && dupQuals.length > 1) {
          risk_points.push({
            level: 'medium',
            field: 'duplicate_certificate',
            value: certNo,
            message: `证件号码 [${certNo}] 被多个商家重复使用`,
          });
        }
      }
    }

    let suggestion = '经综合校验，资质材料风险较低，可正常审核';
    if (risk_points.length > 0) {
      const hasHigh = risk_points.some(r => r.level === 'high');
      const hasMedium = risk_points.some(r => r.level === 'medium');
      if (hasHigh) {
        suggestion = '检测到高风险点，建议人工重点审核，必要时请驳回并要求补充真实材料';
      } else if (hasMedium) {
        suggestion = '检测到中风险点，建议人工复核确认后再进行审核操作';
      } else {
        suggestion = '检测到少量低风险点，建议关注即可';
      }
    }

    return {
      is_fraud: risk_points.some(r => r.level === 'high'),
      risk_points,
      suggestion,
    };
  }

  async getMaterialChangeLogs(merchantId: number, qualificationId?: number): Promise<any[]> {
    const where: any = { merchant_id: merchantId };
    if (qualificationId !== undefined) where.qualification_id = qualificationId;

    const logs = await this.qualificationChangeLogDao.findAll({
      where,
      order: [['created_at', 'DESC']],
    } as any);

    return logs;
  }
}

export const merchantQualificationTraceService = new MerchantQualificationTraceService();
export default MerchantQualificationTraceService;
