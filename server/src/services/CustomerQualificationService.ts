import { Op } from 'sequelize';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import customerQualificationDAO from '@dao/CustomerQualificationDAO';

const EXPIRE_WARNING_DAYS = 7;
const QUALIFICATION_VALIDITY_YEARS = 2;

const REQUIRED_DOCS_INDIVIDUAL = ['id_card', 'bank_card', 'risk_assessment'];
const REQUIRED_DOCS_INSTITUTION = ['business_license', 'tax_cert', 'org_code_cert', 'legal_rep_id', 'bank_card', 'investor_profile'];

const LEVEL_PERMISSIONS: Record<string, string[]> = {
  basic: ['trade:view', 'trade:cash_buy', 'trade:stock_buy'],
  standard: ['trade:view', 'trade:cash_buy', 'trade:stock_buy', 'trade:margin', 'product:view', 'product:purchase'],
  premium: ['trade:view', 'trade:cash_buy', 'trade:stock_buy', 'trade:margin', 'trade:option', 'product:view', 'product:purchase', 'private:access'],
  institution: ['trade:view', 'trade:cash_buy', 'trade:stock_buy', 'trade:margin', 'trade:option', 'trade:large', 'product:view', 'product:purchase', 'private:access', 'institutional:special'],
};

const REGULATORY_DIMENSIONS = [
  { dimension: '个人投资者适当性管理办法', checkFn: (docs: any[], customerType: string) => customerType !== 'individual' || docs.some(d => d.type === 'risk_assessment') },
  { dimension: '证券账户实名制规定', checkFn: (docs: any[]) => docs.some(d => d.type === 'id_card' && d.verified) },
  { dimension: '反洗钱客户身份识别', checkFn: (docs: any[]) => docs.some(d => d.type === 'bank_card' && d.verified) },
  { dimension: '机构投资者开户管理办法', checkFn: (docs: any[], customerType: string) => customerType !== 'institution' || (docs.some(d => d.type === 'business_license' && d.verified) && docs.some(d => d.type === 'legal_rep_id' && d.verified)) },
];

function generateQualificationNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CQ${dateStr}${random}`;
}

function calculateEffectiveDate(): Date {
  return new Date();
}

function calculateExpiryDate(): Date {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + QUALIFICATION_VALIDITY_YEARS);
  return expiry;
}

function runAuthenticityCheck(qualification: any): {
  passed: boolean;
  overallScore: number;
  documentResults: Record<string, any>;
  regulatoryMatch: Array<{ dimension: string; compliant: boolean; detail: string }>;
} {
  const docs: any[] = qualification.documents || [];
  const documentResults: Record<string, any> = {};
  let totalScore = 0;
  let docCount = 0;

  docs.forEach((doc: any) => {
    const issues: string[] = [];
    let passed = true;

    if (!doc.verified) {
      issues.push('文档未通过系统核验');
      passed = false;
    }

    if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
      issues.push('文档已过期');
      passed = false;
    }

    if (doc.name && doc.name.length < 2) {
      issues.push('文档名称不完整');
      passed = false;
    }

    const docScore = passed ? (doc.authenticityVerified ? 100 : 70) : 30;
    totalScore += docScore;
    docCount++;

    documentResults[doc.type] = { passed, score: docScore, verified: !!doc.verified, issues };
  });

  const overallScore = docCount > 0 ? Math.round(totalScore / docCount) : 0;

  const regulatoryMatch = REGULATORY_DIMENSIONS.map(rule => {
    const compliant = rule.checkFn(docs, qualification.customer_type);
    return {
      dimension: rule.dimension,
      compliant,
      detail: compliant ? '符合监管要求' : '未满足该监管维度要求',
    };
  });

  const allRegulatoryPassed = regulatoryMatch.every(r => r.compliant);
  const passed = overallScore >= 70 && allRegulatoryPassed;

  return { passed, overallScore, documentResults, regulatoryMatch };
}

function checkDocumentCompleteness(qualification: any): {
  complete: boolean;
  missingDocuments: string[];
  expiredDocuments: string[];
  fakeSuspiciousDocuments: string[];
  integrityScore: number;
} {
  const docs: any[] = qualification.documents || [];
  const customerType = qualification.customer_type || 'individual';
  const required = customerType === 'institution' ? REQUIRED_DOCS_INSTITUTION : REQUIRED_DOCS_INDIVIDUAL;

  const docTypes = docs.map(d => d.type);
  const missingDocuments = required.filter(t => !docTypes.includes(t));

  const expiredDocuments = docs
    .filter(d => d.expiryDate && new Date(d.expiryDate) < new Date())
    .map(d => d.type);

  const fakeSuspiciousDocuments = docs
    .filter(d => !d.authenticityVerified || !d.verified)
    .map(d => d.type);

  const totalRequired = required.length;
  const foundRequired = required.filter(t => docTypes.includes(t)).length;
  const integrityScore = Math.round((foundRequired / totalRequired) * 100);
  const complete = missingDocuments.length === 0 && expiredDocuments.length === 0 && fakeSuspiciousDocuments.length === 0;

  return { complete, missingDocuments, expiredDocuments, fakeSuspiciousDocuments, integrityScore };
}

class CustomerQualificationService {
  async getQualificationList(params: any) {
    const { page = 1, pageSize = 20, qualificationNo, customerName, customerType, qualificationStatus, reviewType, qualificationLevel, tradingAllowed } = params;
    const where: any = {};

    if (qualificationNo) where.qualification_no = { [Op.like]: `%${qualificationNo}%` };
    if (customerName) where.customer_name = { [Op.like]: `%${customerName}%` };
    if (customerType) where.customer_type = customerType;
    if (qualificationStatus) where.qualification_status = qualificationStatus;
    if (reviewType) where.review_type = reviewType;
    if (qualificationLevel) where.qualification_level = qualificationLevel;
    if (tradingAllowed !== undefined) where.trading_allowed = tradingAllowed;

    const { count, rows } = await db.CustomerQualification.findAndCountAll({
      where,
      order: [
        ['qualification_status', 'ASC'],
        ['expiry_date', 'ASC'],
        ['created_at', 'DESC'],
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getQualificationById(id: number) {
    const qualification = await customerQualificationDAO.findById(id);
    if (!qualification) throw new AppError(404, '资质审核记录不存在');
    return qualification;
  }

  async getQualificationLogs(qualificationId: number) {
    const logs = await db.CustomerQualificationLog.findAll({
      where: { qualification_id: qualificationId },
      order: [['created_at', 'ASC']],
    });
    return logs;
  }

  async preCheck(id: number, permissions: string[]) {
    const qualification = await this.getQualificationById(id);
    const messages: string[] = [];
    const warnings: string[] = [];

    const permissionValid = permissions.includes('compliance:qualification:approve') || permissions.includes('compliance:manage');
    if (!permissionValid) {
      messages.push('当前用户无资质审核权限');
    }

    const docCheck = checkDocumentCompleteness(qualification);
    const docsComplete = docCheck.complete;
    const docsValid = docCheck.expiredDocuments.length === 0;
    const docsAuthentic = docCheck.fakeSuspiciousDocuments.length === 0;

    if (docCheck.missingDocuments.length > 0) {
      messages.push(`缺少必要资料：${docCheck.missingDocuments.join(', ')}`);
    }
    if (docCheck.expiredDocuments.length > 0) {
      messages.push(`资料已过期：${docCheck.expiredDocuments.join(', ')}`);
    }
    if (docCheck.fakeSuspiciousDocuments.length > 0) {
      warnings.push(`存在未验证资料（疑似造假）：${docCheck.fakeSuspiciousDocuments.join(', ')}`);
    }

    const blocked = !permissionValid || !docsComplete || !docsValid;
    const canReview = permissionValid && !blocked;

    if (qualification.qualification_status === 'approved') {
      warnings.push('该资质已审核通过，将发起复核流程');
    }
    if (qualification.qualification_status === 'rejected') {
      warnings.push('该资质已被驳回，将重新审核');
    }

    return {
      canReview,
      permissionValid,
      documentsComplete: docsComplete,
      documentsValid: docsValid,
      documentsAuthentic: docsAuthentic,
      expiredDocuments: docCheck.expiredDocuments,
      missingDocuments: docCheck.missingDocuments,
      fakeSuspiciousDocuments: docCheck.fakeSuspiciousDocuments,
      blocked,
      messages,
      warnings,
      documentIntegrityScore: docCheck.integrityScore,
    };
  }

  async createQualification(data: any, operatorId: number, operatorName: string) {
    const qualificationNo = generateQualificationNo();
    const effectiveDate = calculateEffectiveDate();
    const expiryDate = calculateExpiryDate();

    const docCheck = checkDocumentCompleteness(data);

    const qualification = await db.CustomerQualification.create({
      qualification_no: qualificationNo,
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_type: data.customerType,
      qualification_status: 'pending',
      review_type: data.reviewType || 'new_customer',
      qualification_level: data.qualificationLevel || 'basic',
      documents: data.documents || [],
      missing_documents: docCheck.missingDocuments,
      expired_documents: docCheck.expiredDocuments,
      fake_suspicious_documents: docCheck.fakeSuspiciousDocuments,
      issue_types: [],
      issue_reasons: [],
      effective_date: effectiveDate,
      expiry_date: expiryDate,
      expire_warning_sent: false,
      permissions: [],
      trading_allowed: false,
      customer_profile_synced: false,
      authenticity_check_passed: false,
      regulatory_compliance_score: docCheck.integrityScore,
      recheck_count: 0,
    } as any);

    await db.CustomerQualificationLog.create({
      qualification_id: qualification.id,
      qualification_no: qualificationNo,
      action: 'submit',
      operator_id: operatorId,
      operator_name: operatorName,
      detail: { reviewType: data.reviewType || 'new_customer', customerType: data.customerType, docIntegrityScore: docCheck.integrityScore },
      created_at: new Date(),
    } as any);

    return qualification;
  }

  async approveQualification(id: number, data: any, operatorId: number, operatorName: string, permissions: string[]) {
    const qualification = await this.getQualificationById(id);

    const authenticityCheck = runAuthenticityCheck(qualification);
    const fakeIntercepted = !authenticityCheck.passed;

    if (fakeIntercepted && !permissions.includes('compliance:manage')) {
      throw new AppError(403, '资质真实性校验未通过，存在疑似造假资料，禁止审核通过');
    }

    const level = data.qualificationLevel || qualification.qualification_level || 'basic';
    const grantedPermissions = LEVEL_PERMISSIONS[level] || LEVEL_PERMISSIONS.basic;
    const now = new Date();

    await qualification.update({
      qualification_status: 'approved',
      qualification_level: level,
      reviewer_id: operatorId,
      reviewer_name: operatorName,
      review_opinion: data.reviewOpinion || '资质审核通过',
      review_at: now,
      permissions: grantedPermissions,
      trading_allowed: true,
      customer_profile_synced: true,
      authenticity_check_passed: authenticityCheck.passed,
      regulatory_compliance_score: authenticityCheck.overallScore,
      missing_documents: [],
      expired_documents: [],
      fake_suspicious_documents: [],
      issue_types: [],
      issue_reasons: [],
    } as any);

    await db.CustomerQualificationLog.create({
      qualification_id: id,
      qualification_no: qualification.qualification_no,
      action: 'approve',
      operator_id: operatorId,
      operator_name: operatorName,
      detail: { opinion: data.reviewOpinion, qualificationLevel: level, grantedPermissions, fromStatus: qualification.qualification_status },
      authenticity_check: authenticityCheck,
      fake_intercepted: fakeIntercepted,
      intercept_message: fakeIntercepted ? '真实性校验存在问题，但管理员权限已覆盖' : undefined,
      created_at: now,
    } as any);

    await db.CustomerQualificationLog.create({
      qualification_id: id,
      qualification_no: qualification.qualification_no,
      action: 'permission_update',
      operator_id: 0,
      operator_name: 'system',
      detail: { grantedPermissions, tradingAllowed: true },
      created_at: now,
    } as any);

    return qualification;
  }

  async rejectQualification(id: number, data: any, operatorId: number, operatorName: string) {
    const qualification = await this.getQualificationById(id);

    if (!data.issueTypes || data.issueTypes.length === 0) {
      throw new AppError(400, '驳回必须标注具体问题类型');
    }
    if (!data.reviewOpinion) {
      throw new AppError(400, '驳回必须填写审核意见');
    }

    const now = new Date();

    await qualification.update({
      qualification_status: 'rejected',
      reviewer_id: operatorId,
      reviewer_name: operatorName,
      review_opinion: data.reviewOpinion,
      review_at: now,
      issue_types: data.issueTypes,
      issue_reasons: data.rejectReasons || [],
      trading_allowed: false,
      customer_profile_synced: true,
    } as any);

    await db.CustomerQualificationLog.create({
      qualification_id: id,
      qualification_no: qualification.qualification_no,
      action: 'reject',
      operator_id: operatorId,
      operator_name: operatorName,
      detail: {
        opinion: data.reviewOpinion,
        issueTypes: data.issueTypes,
        rejectReasons: data.rejectReasons || [],
      },
      created_at: now,
    } as any);

    return qualification;
  }

  async initiateRecheck(id: number, operatorId: number, operatorName: string) {
    const qualification = await this.getQualificationById(id);
    const now = new Date();

    await qualification.update({
      qualification_status: 'pending',
      review_type: 'recheck',
      reviewer_id: null,
      reviewer_name: null,
      review_opinion: null,
      review_at: null,
      last_recheck_at: now,
      recheck_count: (qualification.recheck_count || 0) + 1,
    } as any);

    await db.CustomerQualificationLog.create({
      qualification_id: id,
      qualification_no: qualification.qualification_no,
      action: 'recheck_initiate',
      operator_id: operatorId,
      operator_name: operatorName,
      detail: { recheckCount: qualification.recheck_count, previousStatus: qualification.qualification_status },
      created_at: now,
    } as any);

    return qualification;
  }

  async batchOperation(params: any, operatorId: number, operatorName: string) {
    const { ids, action, qualificationLevel, rejectReasons, issueTypes, reviewOpinion } = params;
    const results: { success: boolean; id: number; qualificationNo: string; customerName: string; message?: string }[] = [];
    const now = new Date();

    for (const id of ids) {
      try {
        const qualification = await customerQualificationDAO.findById(id);
        if (!qualification) {
          results.push({ success: false, id, qualificationNo: 'N/A', customerName: 'N/A', message: '资质记录不存在' });
          continue;
        }

        if (action === 'approve') {
          const level = qualificationLevel || qualification.qualification_level || 'basic';
          const grantedPermissions = LEVEL_PERMISSIONS[level] || LEVEL_PERMISSIONS.basic;
          await qualification.update({
            qualification_status: 'approved',
            qualification_level: level,
            reviewer_id: operatorId,
            reviewer_name: operatorName,
            review_opinion: reviewOpinion || '批量审核通过',
            review_at: now,
            permissions: grantedPermissions,
            trading_allowed: true,
            customer_profile_synced: true,
            missing_documents: [],
            expired_documents: [],
            fake_suspicious_documents: [],
            issue_types: [],
            issue_reasons: [],
          } as any);
          results.push({ success: true, id, qualificationNo: qualification.qualification_no, customerName: qualification.customer_name });
        } else if (action === 'reject') {
          await qualification.update({
            qualification_status: 'rejected',
            reviewer_id: operatorId,
            reviewer_name: operatorName,
            review_opinion: reviewOpinion || '批量驳回',
            review_at: now,
            issue_types: issueTypes || ['incomplete'],
            issue_reasons: rejectReasons || [],
            trading_allowed: false,
            customer_profile_synced: true,
          } as any);
          results.push({ success: true, id, qualificationNo: qualification.qualification_no, customerName: qualification.customer_name });
        } else if (action === 'initiate_recheck') {
          await qualification.update({
            qualification_status: 'pending',
            review_type: 'recheck',
            reviewer_id: null,
            reviewer_name: null,
            review_opinion: null,
            review_at: null,
            last_recheck_at: now,
            recheck_count: (qualification.recheck_count || 0) + 1,
          } as any);
          results.push({ success: true, id, qualificationNo: qualification.qualification_no, customerName: qualification.customer_name });
        }
      } catch (err: any) {
        results.push({ success: false, id, qualificationNo: 'N/A', customerName: 'N/A', message: err.message });
      }
    }

    const logAction = action === 'approve' ? 'batch_approve' : action === 'reject' ? 'batch_reject' : 'batch_recheck_initiate';
    await db.CustomerQualificationLog.create({
      qualification_id: 0,
      qualification_no: 'BATCH',
      action: logAction,
      operator_id: operatorId,
      operator_name: operatorName,
      detail: { totalCount: ids.length, successCount: results.filter(r => r.success).length, results },
      created_at: now,
    } as any);

    return { total: ids.length, successCount: results.filter(r => r.success).length, results };
  }

  async batchPreview(ids: number[]) {
    const qualifications = await db.CustomerQualification.findAll({ where: { id: { [Op.in]: ids } } });
    const byCustomerType: Record<string, number> = {};
    const byQualificationLevel: Record<string, number> = {};
    const byRegistrationYear: Record<string, number> = {};
    const blockReasons: Array<{ id: number; qualificationNo: string; customerName: string; reason: string }> = [];
    let simpleApprovableCount = 0;

    qualifications.forEach((q: any) => {
      byCustomerType[q.customer_type] = (byCustomerType[q.customer_type] || 0) + 1;
      byQualificationLevel[q.qualification_level] = (byQualificationLevel[q.qualification_level] || 0) + 1;
      const year = new Date(q.created_at).getFullYear().toString();
      byRegistrationYear[year] = (byRegistrationYear[year] || 0) + 1;

      const docCheck = checkDocumentCompleteness(q);
      if (docCheck.complete && (q.fake_suspicious_documents || []).length === 0) {
        simpleApprovableCount++;
      }
      if (!docCheck.complete) {
        const reasons: string[] = [];
        if (docCheck.missingDocuments.length > 0) reasons.push(`缺少资料:${docCheck.missingDocuments.join(',')}`);
        if (docCheck.expiredDocuments.length > 0) reasons.push(`过期资料:${docCheck.expiredDocuments.join(',')}`);
        if (docCheck.fakeSuspiciousDocuments.length > 0) reasons.push(`未验证:${docCheck.fakeSuspiciousDocuments.join(',')}`);
        blockReasons.push({ id: q.id, qualificationNo: q.qualification_no, customerName: q.customer_name, reason: reasons.join('; ') });
      }
    });

    return {
      byCustomerType,
      byQualificationLevel,
      byRegistrationYear,
      blockReasons,
      simpleApprovableCount,
      totalCount: qualifications.length,
    };
  }

  async checkExpireWarning() {
    const now = new Date();
    const threshold = new Date(now.getTime() + EXPIRE_WARNING_DAYS * 24 * 60 * 60 * 1000);
    const toWarn = await db.CustomerQualification.findAll({
      where: {
        qualification_status: 'approved',
        expire_warning_sent: false,
        expiry_date: { [Op.lte]: threshold, [Op.gt]: now },
      },
    });

    const updated: any[] = [];
    for (const q of toWarn) {
      await q.update({ expire_warning_sent: true, expire_warning_at: now, qualification_status: 'expire_soon' } as any);
      await db.CustomerQualificationLog.create({
        qualification_id: q.id,
        qualification_no: q.qualification_no,
        action: 'expire_remind',
        operator_id: 0,
        operator_name: 'system',
        detail: { message: `资质将于${EXPIRE_WARNING_DAYS}日内到期，请及时发起复核`, expiryDate: q.expiry_date },
        created_at: now,
      } as any);
      updated.push(q);
    }

    const expired = await db.CustomerQualification.findAll({
      where: { qualification_status: { [Op.in]: ['approved', 'expire_soon'] }, expiry_date: { [Op.lt]: now } },
    });
    for (const q of expired) {
      await q.update({ qualification_status: 'expired', trading_allowed: false } as any);
      await db.CustomerQualificationLog.create({
        qualification_id: q.id,
        qualification_no: q.qualification_no,
        action: 'expire_remind',
        operator_id: 0,
        operator_name: 'system',
        detail: { message: '资质已过期，交易权限已关闭', expiryDate: q.expiry_date },
        created_at: now,
      } as any);
    }

    return { warnedCount: updated.length, expiredCount: expired.length };
  }

  async getStats() {
    const [totalPending, totalApproved, totalRejected, totalExpired, totalExpireSoon, totalRevoked] = await Promise.all([
      db.CustomerQualification.count({ where: { qualification_status: 'pending' } }),
      db.CustomerQualification.count({ where: { qualification_status: 'approved' } }),
      db.CustomerQualification.count({ where: { qualification_status: 'rejected' } }),
      db.CustomerQualification.count({ where: { qualification_status: 'expired' } }),
      db.CustomerQualification.count({ where: { qualification_status: 'expire_soon' } }),
      db.CustomerQualification.count({ where: { qualification_status: 'revoked' } }),
    ]);

    const allApproved = await db.CustomerQualification.findAll({
      where: { qualification_status: 'approved' },
      attributes: ['regulatory_compliance_score', 'authenticity_check_passed', 'customer_type', 'qualification_level', 'issue_types'],
    });

    const totalWithScore = allApproved.filter((q: any) => q.regulatory_compliance_score > 0);
    const avgComplianceScore = totalWithScore.length > 0
      ? Math.round(totalWithScore.reduce((sum, q: any) => sum + Number(q.regulatory_compliance_score), 0) / totalWithScore.length)
      : 0;

    const totalAuthenticChecked = allApproved.filter((q: any) => q.authenticity_check_passed !== null);
    const authenticityPassRate = totalAuthenticChecked.length > 0
      ? Math.round((allApproved.filter((q: any) => q.authenticity_check_passed).length / totalAuthenticChecked.length) * 100)
      : 0;

    const byCustomerType: Record<string, number> = {};
    const byQualificationLevel: Record<string, number> = {};
    const byIssueType: Record<string, number> = {};

    allApproved.forEach((q: any) => {
      byCustomerType[q.customer_type] = (byCustomerType[q.customer_type] || 0) + 1;
      byQualificationLevel[q.qualification_level] = (byQualificationLevel[q.qualification_level] || 0) + 1;
    });

    const allWithIssues = await db.CustomerQualification.findAll({ where: { qualification_status: { [Op.in]: ['rejected', 'revoked'] } } });
    allWithIssues.forEach((q: any) => {
      (q.issue_types || []).forEach((t: string) => {
        byIssueType[t] = (byIssueType[t] || 0) + 1;
      });
    });

    return {
      totalPending,
      totalApproved,
      totalRejected,
      totalExpired,
      totalExpireSoon,
      totalRevoked,
      avgComplianceScore,
      authenticityPassRate,
      byCustomerType,
      byQualificationLevel,
      byIssueType,
    };
  }
}

export default new CustomerQualificationService();
