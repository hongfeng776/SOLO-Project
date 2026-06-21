import { daos } from '../dao';
import { Op } from 'sequelize';

export interface ProviderTraceData {
  provider: any;
  qualifications: any[];
  signContracts: any[];
  feeChangeLogs: any[];
  serviceEvaluations: {
    list: any[];
    summary: {
      totalCount: number;
      avgRating: number;
      timelinessAvg: number;
      goodRate: number;
      damageRate: number;
      lossRate: number;
      complaintCount: number;
    };
  };
  operationLogs: any[];
  compliance: ProviderComplianceReport;
}

export interface ProviderComplianceReport {
  overallScore: number;
  scoreLevel: 'excellent' | 'good' | 'normal' | 'warning' | 'danger';
  issues: Array<{
    type: 'qualification' | 'coverage' | 'timeliness' | 'fee' | 'complaint' | 'violation';
    level: 'high' | 'medium' | 'low';
    message: string;
  }>;
  qualificationValid: boolean;
  feeCompliant: boolean;
  noDuplicate: boolean;
  coverageAdequate: boolean;
}

export interface ProviderTraceSummary {
  qualificationCount: number;
  validQualificationCount: number;
  expiredQualificationCount: number;
  contractCount: number;
  effectiveContractCount: number;
  feeChangeCount: number;
  violationFeeChangeCount: number;
  evaluationCount: number;
  avgRating: number;
  operationLogCount: number;
}

class LogisticsProviderTraceService {
  private readonly providerDao = daos.logisticsProviderDao;
  private readonly qualificationDao = daos.logisticsProviderQualificationDao;
  private readonly signContractDao = daos.logisticsSignContractDao;
  private readonly feeChangeLogDao = daos.logisticsFeeChangeLogDao;
  private readonly serviceEvaluationDao = daos.logisticsServiceEvaluationDao;
  private readonly operationLogDao = daos.logisticsProviderOperationLogDao;
  private readonly branchDao = daos.logisticsBranchNetworkDao;

  async getProviderFullTrace(providerId: number): Promise<ProviderTraceData> {
    const provider = await this.providerDao.findById(providerId);
    if (!provider) {
      throw new Error('服务商不存在');
    }

    const [qualifications, signContracts, feeChangeLogs, evaluations, operationLogs] = await Promise.all([
      this.qualificationDao.findAll({
        where: { provider_id: providerId },
        order: [['created_at', 'DESC']],
      }),
      this.signContractDao.findAll({
        where: { provider_id: providerId },
        order: [['created_at', 'DESC']],
      }),
      this.feeChangeLogDao.findAll({
        where: { provider_id: providerId },
        order: [['created_at', 'DESC']],
        limit: 100,
      }),
      this.serviceEvaluationDao.findAll({
        where: { provider_id: providerId },
        order: [['created_at', 'DESC']],
        limit: 200,
      }),
      this.operationLogDao.findAll({
        where: { provider_id: providerId },
        order: [['created_at', 'DESC']],
        limit: 100,
      }),
    ]);

    const evaluationSummary = this.calculateEvaluationSummary(evaluations);
    const compliance = await this.calculateComplianceReport(providerId, qualifications, feeChangeLogs, evaluations);

    return {
      provider: provider.toJSON(),
      qualifications: qualifications.map(q => q.toJSON()),
      signContracts: signContracts.map(c => c.toJSON()),
      feeChangeLogs: feeChangeLogs.map(l => l.toJSON()),
      serviceEvaluations: {
        list: evaluations.map(e => e.toJSON()),
        summary: evaluationSummary,
      },
      operationLogs: operationLogs.map(l => l.toJSON()),
      compliance,
    };
  }

  async getTraceSummary(providerId: number): Promise<ProviderTraceSummary> {
    const [qualifications, signContracts, feeChangeLogs, evaluations, operationLogs] = await Promise.all([
      this.qualificationDao.findAndCountAll({ where: { provider_id: providerId } }),
      this.signContractDao.findAndCountAll({ where: { provider_id: providerId } }),
      this.feeChangeLogDao.findAndCountAll({ where: { provider_id: providerId } }),
      this.serviceEvaluationDao.findAndCountAll({ where: { provider_id: providerId } }),
      this.operationLogDao.findAndCountAll({ where: { provider_id: providerId } }),
    ]);

    const validQualificationCount = qualifications.rows.filter(q => q.status === 1).length;
    const expiredQualificationCount = qualifications.rows.filter(q => q.status === 2).length;
    const effectiveContractCount = signContracts.rows.filter(c => c.status === 2).length;
    const violationFeeChangeCount = feeChangeLogs.rows.filter(l => l.is_violation).length;
    const avgRating = evaluations.rows.length > 0
      ? evaluations.rows.reduce((sum, e) => sum + Number(e.rating), 0) / evaluations.rows.length
      : 0;

    return {
      qualificationCount: qualifications.count,
      validQualificationCount,
      expiredQualificationCount,
      contractCount: signContracts.count,
      effectiveContractCount,
      feeChangeCount: feeChangeLogs.count,
      violationFeeChangeCount,
      evaluationCount: evaluations.count,
      avgRating: Math.round(avgRating * 10) / 10,
      operationLogCount: operationLogs.count,
    };
  }

  private calculateEvaluationSummary(evaluations: any[]) {
    const totalCount = evaluations.length;
    const avgRating = totalCount > 0
      ? Math.round(evaluations.reduce((s, e) => s + Number(e.rating), 0) / totalCount * 10) / 10
      : 0;
    const timelinessAvg = evaluations.filter(e => e.timeliness_score !== undefined && e.timeliness_score !== null).length > 0
      ? evaluations.reduce((s, e) => s + (Number(e.timeliness_score) || 0), 0) / evaluations.filter(e => e.timeliness_score !== undefined).length
      : 0;
    const goodRate = totalCount > 0
      ? Math.round(evaluations.filter(e => e.rating >= 4).length / totalCount * 1000) / 10
      : 0;
    const damageRate = evaluations.filter(e => e.has_damage).length;
    const lossRate = evaluations.filter(e => e.has_loss).length;
    const complaintCount = evaluations.filter(e => e.evaluation_type === 'complaint').length;

    return {
      totalCount,
      avgRating,
      timelinessAvg,
      goodRate,
      damageRate,
      lossRate,
      complaintCount,
    };
  }

  private async calculateComplianceReport(
    providerId: number,
    qualifications: any[],
    feeChangeLogs: any[],
    evaluations: any[]
  ): Promise<ProviderComplianceReport> {
    const issues: ProviderComplianceReport['issues'] = [];
    let score = 100;
    const provider = await this.providerDao.findById(providerId);

    const expiredQualCount = qualifications.filter(q => q.status === 2
      || (q.expire_date && new Date(q.expire_date) < new Date())).length;
    const pendingQualCount = qualifications.filter(q => q.status === 0 || q.status === 4).length;
    const qualificationValid = expiredQualCount === 0 && pendingQualCount === 0;

    if (!qualificationValid) {
      if (expiredQualCount > 0) {
        issues.push({ type: 'qualification', level: 'high', message: `存在${expiredQualCount}项已过期资质` });
        score -= expiredQualCount * 10;
      }
      if (pendingQualCount > 0) {
        issues.push({ type: 'qualification', level: 'medium', message: `存在${pendingQualCount}项待审核资质` });
        score -= pendingQualCount * 3;
      }
    }

    const violationFeeCount = feeChangeLogs.filter(l => l.is_violation).length;
    const feeCompliant = violationFeeCount === 0;
    if (!feeCompliant) {
      issues.push({ type: 'fee', level: 'high', message: `存在${violationFeeCount}条违规资费配置记录` });
      score -= violationFeeCount * 8;
    }

    const duplicate = await this.checkDuplicateRecord(providerId, provider);
    if (duplicate.duplicated) {
      issues.push({ type: 'qualification', level: 'high', message: duplicate.message! });
      score -= 20;
    }
    const noDuplicate = !duplicate.duplicated;

    const branches = await this.branchDao.findAll({ where: { provider_id: providerId, status: 1 } });
    const cities = new Set(branches.map(b => b.city).filter(Boolean));
    const coverageAdequate = cities.size >= 5 && branches.length >= 10;
    if (!coverageAdequate) {
      issues.push({ type: 'coverage', level: 'medium', message: `网点覆盖不足（当前${branches.length}个网点/${cities.size}个城市）` });
      score -= Math.min(20, 20 - cities.size * 2);
    }

    if (provider && Number(provider.on_time_rate) > 0 && Number(provider.on_time_rate) < 0.9) {
      issues.push({ type: 'timeliness', level: 'medium', message: `准时率偏低：${(Number(provider.on_time_rate) * 100).toFixed(1)}%` });
      score -= Math.round((0.9 - Number(provider.on_time_rate)) * 100);
    }

    if (provider && Number(provider.damage_rate) > 0.01) {
      issues.push({ type: 'complaint', level: 'high', message: `破损率偏高：${(Number(provider.damage_rate) * 100).toFixed(2)}%` });
      score -= Math.round(Number(provider.damage_rate) * 1000);
    }

    const complaintCount = evaluations.filter(e => e.evaluation_type === 'complaint').length;
    if (complaintCount > 5) {
      issues.push({ type: 'complaint', level: 'high', message: `累计投诉${complaintCount}次，请关注服务质量` });
      score -= Math.min(15, complaintCount);
    }

    score = Math.max(0, Math.min(100, score));

    let scoreLevel: ProviderComplianceReport['scoreLevel'] = 'normal';
    if (score >= 90) scoreLevel = 'excellent';
    else if (score >= 80) scoreLevel = 'good';
    else if (score >= 60) scoreLevel = 'normal';
    else if (score >= 40) scoreLevel = 'warning';
    else scoreLevel = 'danger';

    return {
      overallScore: score,
      scoreLevel,
      issues,
      qualificationValid,
      feeCompliant,
      noDuplicate,
      coverageAdequate,
    };
  }

  private async checkDuplicateRecord(providerId: number, provider: any): Promise<{ duplicated: boolean; message?: string }> {
    if (!provider) return { duplicated: false };

    if (provider.credit_code) {
      const existing = await this.providerDao.findOne({
        where: {
          credit_code: provider.credit_code,
          id: { [Op.ne]: providerId },
        },
      });
      if (existing) {
        return {
          duplicated: true,
          message: `统一社会信用代码与服务商「${existing.provider_name}」重复`,
        };
      }
    }

    if (provider.business_license_no) {
      const existing = await this.providerDao.findOne({
        where: {
          business_license_no: provider.business_license_no,
          id: { [Op.ne]: providerId },
        },
      });
      if (existing) {
        return {
          duplicated: true,
          message: `营业执照注册号与服务商「${existing.provider_name}」重复`,
        };
      }
    }

    return { duplicated: false };
  }

  async getQualificationList(providerId: number) {
    return this.qualificationDao.findAll({
      where: { provider_id: providerId },
      order: [['status', 'ASC'], ['created_at', 'DESC']],
    });
  }

  async getContractList(providerId: number) {
    return this.signContractDao.findAll({
      where: { provider_id: providerId },
      order: [['created_at', 'DESC']],
    });
  }

  async getFeeChangeLogs(providerId: number, page: number = 1, pageSize: number = 20) {
    return this.feeChangeLogDao.findPage({
      page,
      pageSize,
      where: { provider_id: providerId },
      order: [['created_at', 'DESC']],
    });
  }

  async getEvaluationList(providerId: number, evaluationType?: string, page: number = 1, pageSize: number = 20) {
    const where: any = { provider_id: providerId };
    if (evaluationType) {
      where.evaluation_type = evaluationType;
    }
    return this.serviceEvaluationDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getOperationLogs(providerId: number, changeType?: string, page: number = 1, pageSize: number = 20) {
    const where: any = { provider_id: providerId };
    if (changeType) {
      where.change_type = changeType;
    }
    return this.operationLogDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }
}

export const logisticsProviderTraceService = new LogisticsProviderTraceService();
export default LogisticsProviderTraceService;
