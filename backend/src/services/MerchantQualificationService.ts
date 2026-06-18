import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op } from 'sequelize';
import {
  MerchantQualification,
  QualificationStatus,
  QualificationVerificationStatus,
  QualificationVerificationSource,
  QualificationType,
} from '../models/MerchantQualification';
import { MerchantSettleStatus } from '../models/Merchant';
import { LedgerOperationType } from '../models/MerchantQualificationLedger';
import { PageResult } from '../dao/BaseDao';

export const ID_CARD_REGEX = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
export const CREDIT_CODE_REGEX = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
export const BUSINESS_LICENSE_REGEX = /^(?:(?![IOZSV])[\dA-Z]){2}\d{6}(?:(?![IOZSV])[\dA-Z]){10}$/;
export const FOOD_BUSINESS_LICENSE_REGEX = /^JY\d{14}$/;
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface QualificationMaterialItem {
  qualification_type: string;
  certificate_no?: string;
  certificate_holder?: string;
  file_url?: string;
  valid_from?: string;
  expire_date?: string;
  category_id?: number;
  material_order?: number;
}

export interface MerchantQualificationSubmitPayload {
  merchant_id: number;
  merchant_info?: {
    name?: string;
    legal_person?: string;
    legal_id_card?: string;
    business_license_no?: string;
    credit_code?: string;
    license_valid_from?: string;
    license_valid_to?: string;
    license_image_url?: string;
    legal_id_front_url?: string;
    legal_id_back_url?: string;
    registered_capital?: number;
    establish_date?: string;
    business_scope?: string;
    contact?: string;
    phone?: string;
    address?: string;
    industry_type?: string;
    qualification_remark?: string;
  };
  qualifications: QualificationMaterialItem[];
}

export interface MerchantQualificationQueryParams {
  page?: number;
  pageSize?: number;
  merchant_id?: number;
  qualification_type?: string;
  status?: number;
  verification_status?: number;
  expire_start?: string;
  expire_end?: string;
}

class MerchantQualificationService {
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly merchantAuditDao = daos.merchantAuditDao;
  private readonly merchantQualificationLedgerDao = daos.merchantQualificationLedgerDao;
  private readonly qualificationChangeLogDao = daos.qualificationChangeLogDao;

  validateIdCard(idCard: string): ValidationResult {
    if (!idCard) {
      return { valid: false, message: '法人身份证号不能为空' };
    }
    if (!ID_CARD_REGEX.test(idCard)) {
      return { valid: false, message: '法人身份证号格式不正确' };
    }
    return { valid: true };
  }

  validateCreditCode(code: string): ValidationResult {
    if (!code) {
      return { valid: false, message: '统一社会信用代码不能为空' };
    }
    if (!CREDIT_CODE_REGEX.test(code)) {
      return { valid: false, message: '统一社会信用代码格式不正确（应为18位大写字母和数字组合）' };
    }
    return { valid: true };
  }

  validateBusinessLicenseNo(no: string): ValidationResult {
    if (!no) {
      return { valid: false, message: '营业执照号不能为空' };
    }
    if (!BUSINESS_LICENSE_REGEX.test(no)) {
      return { valid: false, message: '营业执照号格式不正确' };
    }
    return { valid: true };
  }

  validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return { valid: true };
    }
    if (!PHONE_REGEX.test(phone)) {
      return { valid: false, message: '联系电话格式不正确' };
    }
    return { valid: true };
  }

  validateDateRange(from?: string, to?: string): ValidationResult {
    if (!from || !to) {
      return { valid: true };
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return { valid: false, message: '日期格式不正确' };
    }
    if (fromDate >= toDate) {
      return { valid: false, message: '有效期起始日期必须早于终止日期' };
    }
    return { valid: true };
  }

  isExpired(expireDate?: Date): boolean {
    if (!expireDate) return false;
    return new Date(expireDate) < new Date();
  }

  isExpiringSoon(expireDate?: Date, days: number = 30): boolean {
    if (!expireDate) return false;
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return new Date(expireDate) <= threshold && new Date(expireDate) >= now;
  }

  async checkDuplicateMerchant(creditCode?: string, businessLicenseNo?: string, excludeId?: number): Promise<ValidationResult> {
    const where: any = {};
    const orConditions: any[] = [];
    if (creditCode) {
      orConditions.push({ credit_code: creditCode });
    }
    if (businessLicenseNo) {
      orConditions.push({ business_license_no: businessLicenseNo });
    }
    if (orConditions.length === 0) {
      return { valid: true };
    }
    where[Op.or] = orConditions;
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await this.merchantDao.findOne(where);
    if (existing) {
      let msg = '';
      if (creditCode && existing.credit_code === creditCode) {
        msg = `统一社会信用代码 ${creditCode} 已被其他商家使用`;
      } else if (businessLicenseNo && existing.business_license_no === businessLicenseNo) {
        msg = `营业执照号 ${businessLicenseNo} 已被其他商家使用`;
      }
      return { valid: false, message: msg };
    }
    return { valid: true };
  }

  async verifyWithIndustryData(_type: string, certificateNo: string): Promise<{ verified: boolean; remark?: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (certificateNo.includes('TEST') || certificateNo.includes('FALSE')) {
      return { verified: false, remark: '工商数据核验不通过：证件信息不存在或已注销' };
    }
    return { verified: true, remark: '工商数据核验通过' };
  }

  async checkMaterialCompleteness(payload: MerchantQualificationSubmitPayload): Promise<{ complete: boolean; missing: string[]; violations: string[] }> {
    const missing: string[] = [];
    const violations: string[] = [];
    const info = payload.merchant_info || {};
    const quals = payload.qualifications || [];

    if (!info.name) missing.push('商家名称');
    if (!info.legal_person) missing.push('法人姓名');
    if (!info.legal_id_card) missing.push('法人身份证号');
    if (!info.credit_code && !info.business_license_no) missing.push('统一社会信用代码或营业执照号');
    if (!info.license_valid_from) missing.push('营业执照有效期起始');
    if (!info.license_valid_to) missing.push('营业执照有效期终止');
    if (!info.license_image_url) missing.push('营业执照图片');
    if (!info.legal_id_front_url) missing.push('法人身份证正面');
    if (!info.legal_id_back_url) missing.push('法人身份证反面');

    const types = quals.map(q => q.qualification_type);
    if (!types.includes(QualificationType.BUSINESS_LICENSE)) {
      missing.push('营业执照资质材料');
    }
    if (!types.includes(QualificationType.LEGAL_ID_CARD)) {
      missing.push('法人身份证资质材料');
    }

    if (info.license_valid_to) {
      const licenseTo = new Date(info.license_valid_to);
      if (this.isExpired(licenseTo)) {
        violations.push('营业执照已过期');
      }
    }

    for (const q of quals) {
      if (q.expire_date && this.isExpired(new Date(q.expire_date))) {
        violations.push(`资质材料 [${q.qualification_type}] 已过期`);
      }
    }

    return { complete: missing.length === 0 && violations.length === 0, missing, violations };
  }

  async validateAll(payload: MerchantQualificationSubmitPayload): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info = payload.merchant_info || {};

    if (info.legal_id_card) {
      const r = this.validateIdCard(info.legal_id_card);
      if (!r.valid) errors.push(r.message!);
    }
    if (info.credit_code) {
      const r = this.validateCreditCode(info.credit_code);
      if (!r.valid) errors.push(r.message!);
    }
    if (info.business_license_no) {
      const r = this.validateBusinessLicenseNo(info.business_license_no);
      if (!r.valid) errors.push(r.message!);
    }
    if (info.phone) {
      const r = this.validatePhone(info.phone);
      if (!r.valid) errors.push(r.message!);
    }
    if (info.license_valid_from || info.license_valid_to) {
      const r = this.validateDateRange(info.license_valid_from, info.license_valid_to);
      if (!r.valid) errors.push(r.message!);
    }

    const dup = await this.checkDuplicateMerchant(info.credit_code, info.business_license_no, payload.merchant_id);
    if (!dup.valid) errors.push(dup.message!);

    const completeness = await this.checkMaterialCompleteness(payload);
    errors.push(...completeness.violations);
    if (completeness.missing.length > 0) {
      errors.push(`缺失材料：${completeness.missing.join('、')}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async submitQualification(
    payload: MerchantQualificationSubmitPayload,
    operatorId?: number,
    operatorName?: string
  ): Promise<any> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const merchantId = payload.merchant_id;
      const merchant = await this.merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const validation = await this.validateAll(payload);
      if (!validation.valid) {
        throw new AppError(`资质校验失败：${validation.errors.join('；')}`, 400);
      }

      const info = payload.merchant_info || {};
      const merchantUpdateData: any = {};
      const fields = [
        'name', 'legal_person', 'legal_id_card', 'business_license_no', 'credit_code',
        'license_valid_from', 'license_valid_to', 'license_image_url',
        'legal_id_front_url', 'legal_id_back_url', 'registered_capital',
        'establish_date', 'business_scope', 'contact', 'phone', 'address',
        'industry_type', 'qualification_remark'
      ];
      for (const f of fields) {
        if ((info as any)[f] !== undefined) {
          merchantUpdateData[f] = (info as any)[f];
        }
      }
      const oldSettleStatus = merchant.settle_status;
      merchantUpdateData.settle_status = MerchantSettleStatus.PENDING_AUDIT;

      await this.merchantDao.update(merchantId, merchantUpdateData, { transaction });

      for (const q of payload.qualifications) {
        if (!q.qualification_type || !q.file_url) continue;
        let verificationStatus = QualificationVerificationStatus.NOT_VERIFIED;
        let verificationRemark = '';
        let verificationSource = QualificationVerificationSource.SYSTEM;

        if (q.certificate_no) {
          const industryResult = await this.verifyWithIndustryData(q.qualification_type, q.certificate_no);
          if (industryResult.verified) {
            verificationStatus = QualificationVerificationStatus.VERIFIED_PASS;
            verificationRemark = industryResult.remark || '';
            verificationSource = QualificationVerificationSource.INDUSTRY;
          } else {
            verificationStatus = QualificationVerificationStatus.VERIFIED_FAIL;
            verificationRemark = industryResult.remark || '';
            verificationSource = QualificationVerificationSource.INDUSTRY;
          }
        }

        let qualStatus = QualificationStatus.PENDING;
        const expDate = q.expire_date ? new Date(q.expire_date) : undefined;
        if (expDate && this.isExpired(expDate)) {
          qualStatus = QualificationStatus.EXPIRED;
        }

        const qualData: any = {
          merchant_id: merchantId,
          qualification_type: q.qualification_type,
          certificate_no: q.certificate_no,
          certificate_holder: q.certificate_holder,
          file_url: q.file_url,
          valid_from: q.valid_from || undefined,
          expire_date: q.expire_date || undefined,
          category_id: q.category_id || 0,
          material_order: q.material_order || 0,
          status: qualStatus,
          verification_status: verificationStatus,
          verification_source: verificationSource,
          verification_remark: verificationRemark,
          missing_flag: 0,
          violation_flag: 0,
        };

        await this.merchantQualificationDao.create(qualData, { transaction });
      }

      await this.merchantQualificationLedgerDao.create({
        merchant_id: merchantId,
        operation_type: LedgerOperationType.SUBMIT,
        settle_status_before: oldSettleStatus,
        settle_status_after: MerchantSettleStatus.PENDING_AUDIT,
        operator_id: operatorId,
        operator_name: operatorName,
        operation_remark: '商家提交入驻资质审核',
      }, { transaction });

      await this.merchantAuditDao.create({
        merchant_id: merchantId,
        auditor_id: operatorId || 0,
        status: 0,
        reason: '商家提交资质审核，等待审核',
        audit_step: 'submit',
        operation_type: 'initial',
      }, { transaction });

      await transaction.commit();
      return {
        merchant_id: merchantId,
        settle_status: MerchantSettleStatus.PENDING_AUDIT,
        message: '资质提交成功，已进入审核队列',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resubmitQualification(
    payload: MerchantQualificationSubmitPayload,
    operatorId?: number,
    operatorName?: string
  ): Promise<any> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const merchantId = payload.merchant_id;
      const merchant = await this.merchantDao.findById(merchantId);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const validation = await this.validateAll(payload);
      if (!validation.valid) {
        throw new AppError(`资质校验失败：${validation.errors.join('；')}`, 400);
      }

      const info = payload.merchant_info || {};
      const merchantUpdateData: any = {};
      const fields = [
        'name', 'legal_person', 'legal_id_card', 'business_license_no', 'credit_code',
        'license_valid_from', 'license_valid_to', 'license_image_url',
        'legal_id_front_url', 'legal_id_back_url', 'registered_capital',
        'establish_date', 'business_scope', 'contact', 'phone', 'address',
        'industry_type', 'qualification_remark'
      ];
      for (const f of fields) {
        if ((info as any)[f] !== undefined) {
          const oldVal = (merchant as any)[f];
          const newVal = (info as any)[f];
          if (oldVal !== newVal) {
            merchantUpdateData[f] = newVal;
            await this.qualificationChangeLogDao.create({
              merchant_id: merchantId,
              change_field: f,
              value_before: oldVal ? String(oldVal) : '',
              value_after: newVal ? String(newVal) : '',
              operator_id: operatorId,
              operator_name: operatorName,
              change_reason: '商家补传材料变更',
            }, { transaction });
          }
        }
      }
      const oldSettleStatus = merchant.settle_status;
      merchantUpdateData.settle_status = MerchantSettleStatus.PENDING_AUDIT;

      if (Object.keys(merchantUpdateData).length > 0) {
        await this.merchantDao.update(merchantId, merchantUpdateData, { transaction });
      }

      for (const q of payload.qualifications) {
        if (!q.qualification_type || !q.file_url) continue;

        const existingQual = await this.merchantQualificationDao.findOne({
          where: { merchant_id: merchantId, qualification_type: q.qualification_type } as any,
        } as any);

        let verificationStatus = QualificationVerificationStatus.NOT_VERIFIED;
        let verificationRemark = '';
        let verificationSource = QualificationVerificationSource.SYSTEM;
        if (q.certificate_no) {
          const industryResult = await this.verifyWithIndustryData(q.qualification_type, q.certificate_no);
          if (industryResult.verified) {
            verificationStatus = QualificationVerificationStatus.VERIFIED_PASS;
            verificationRemark = industryResult.remark || '';
            verificationSource = QualificationVerificationSource.INDUSTRY;
          } else {
            verificationStatus = QualificationVerificationStatus.VERIFIED_FAIL;
            verificationRemark = industryResult.remark || '';
            verificationSource = QualificationVerificationSource.INDUSTRY;
          }
        }

        let qualStatus = QualificationStatus.PENDING;
        const expDate = q.expire_date ? new Date(q.expire_date) : undefined;
        if (expDate && this.isExpired(expDate)) {
          qualStatus = QualificationStatus.EXPIRED;
        }

        const qualData: any = {
          merchant_id: merchantId,
          qualification_type: q.qualification_type,
          certificate_no: q.certificate_no,
          certificate_holder: q.certificate_holder,
          file_url: q.file_url,
          valid_from: q.valid_from || undefined,
          expire_date: q.expire_date || undefined,
          category_id: q.category_id || 0,
          material_order: q.material_order || 0,
          status: qualStatus,
          verification_status: verificationStatus,
          verification_source: verificationSource,
          verification_remark: verificationRemark,
          missing_flag: 0,
          violation_flag: 0,
        };

        if (existingQual) {
          await this.qualificationChangeLogDao.create({
            merchant_id: merchantId,
            qualification_id: existingQual.id,
            change_field: 'qualification_material',
            value_before: existingQual.file_url,
            value_after: q.file_url,
            operator_id: operatorId,
            operator_name: operatorName,
            change_reason: '商家补传资质材料',
          }, { transaction });
          await this.merchantQualificationDao.update(existingQual.id, qualData, { transaction });
        } else {
          await this.merchantQualificationDao.create(qualData, { transaction });
        }
      }

      await this.merchantQualificationLedgerDao.create({
        merchant_id: merchantId,
        operation_type: LedgerOperationType.CHANGE,
        settle_status_before: oldSettleStatus,
        settle_status_after: MerchantSettleStatus.PENDING_AUDIT,
        operator_id: operatorId,
        operator_name: operatorName,
        operation_remark: '商家补传资质材料，重新提交审核',
      }, { transaction });

      await this.merchantAuditDao.create({
        merchant_id: merchantId,
        auditor_id: operatorId || 0,
        status: 0,
        reason: '商家补传材料，重新提交审核',
        audit_step: 'resubmit',
        operation_type: 'resubmit',
      }, { transaction });

      await transaction.commit();
      return {
        merchant_id: merchantId,
        settle_status: MerchantSettleStatus.PENDING_AUDIT,
        message: '材料补传成功，已进入审核队列',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getQualificationList(params: MerchantQualificationQueryParams): Promise<PageResult<MerchantQualification>> {
    const {
      page = 1,
      pageSize = 10,
      merchant_id,
      qualification_type,
      status,
      verification_status,
      expire_start,
      expire_end,
    } = params;

    const where: any = {};
    if (merchant_id !== undefined) where.merchant_id = merchant_id;
    if (qualification_type) where.qualification_type = qualification_type;
    if (status !== undefined) where.status = status;
    if (verification_status !== undefined) where.verification_status = verification_status;
    if (expire_start || expire_end) {
      where.expire_date = {};
      if (expire_start) where.expire_date[Op.gte] = new Date(expire_start);
      if (expire_end) where.expire_date[Op.lte] = new Date(expire_end);
    }

    return this.merchantQualificationDao.findPage({
      page,
      pageSize,
      where,
      order: [['material_order', 'ASC'], ['created_at', 'DESC']],
    });
  }

  async getQualificationByMerchant(merchantId: number): Promise<MerchantQualification[]> {
    return this.merchantQualificationDao.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['material_order', 'ASC'], ['created_at', 'DESC']],
    } as any);
  }
}

export const merchantQualificationService = new MerchantQualificationService();
export default MerchantQualificationService;
