import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import regularizationDao from '../dao/regularization.dao';
import regularizationApprovalNodeDao from '../dao/regularization-approval-node.dao';
import regularizationOperationLogDao from '../dao/regularization-operation-log.dao';
import probationDao from '../dao/probation.dao';
import probationAssessmentIndicatorDao from '../dao/probation-assessment-indicator.dao';
import onboardLedgerDao from '../dao/onboard-ledger.dao';
import probationService from './probation.service';
import RegularizationModel, { RegularizationAttributes } from '../models/regularization.model';
import ProbationModel, { ProbationAttributes } from '../models/probation.model';
import {
  Regularization,
  Probation,
  OnboardLedger,
  RegularizationApprovalNodeRecord,
} from '../models';
import {
  ParamError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  BadRequestError,
} from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import {
  UserRole,
  ProbationStatus,
  RegularizationStatus,
  RegularizationOperationAction,
  RegularizationApprovalNode,
  RegularizationApprovalNodeLabel,
  DEFAULT_APPROVAL_FLOW,
  REGULARIZATION_PREREQUISITE_DAYS,
  REGULARIZATION_REQUIRED_ASSESSMENT_COUNT,
  RegularizationComplianceIssue,
  RegularizationComplianceIssueLabel,
  JobCategoryLabel,
} from '../constants/recruitment.enum';

export interface IUserContext {
  id: number;
  realName?: string;
  username?: string;
  role: UserRole;
  department?: string;
  ip?: string;
  userAgent?: string;
}

export interface IBatchResult {
  success: number;
  failed: number;
  results: Array<{
    index: number;
    success: boolean;
    id?: number;
    name?: string;
    error?: string;
  }>;
}

export interface IApprovalFlowNode {
  nodeKey: RegularizationApprovalNode;
  nodeName: string;
  nodeIndex: number;
  nodeStatus: 'pending' | 'approved' | 'rejected' | 'skipped';
}

export interface IComplianceCheckResult {
  compliant: boolean;
  issues: Array<{
    type: RegularizationComplianceIssue;
    message: string;
  }>;
}

export interface IRecruitmentFitResult {
  grade: 'A' | 'B' | 'C' | 'D';
  score: number;
  description: string;
}

export interface IApprovalProgress {
  currentNodeIndex: number;
  totalNodes: number;
  progressPercent: number;
  currentNode?: {
    nodeKey: string;
    nodeName: string;
    nodeStatus: string;
  };
  approvedNodes: any[];
  pendingNodes: any[];
}

function diffDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function parseJobLevel(level: string): { type: 'P' | 'M' | 'OTHER'; num: number } {
  if (!level) return { type: 'OTHER', num: 0 };
  const match = level.match(/^([PpMm])(\d+)/);
  if (!match) return { type: 'OTHER', num: 0 };
  return {
    type: match[1].toUpperCase() as 'P' | 'M',
    num: parseInt(match[2], 10),
  };
}

class RegularizationService {
  async checkPrerequisites(probationId: number): Promise<ProbationModel> {
    const probation = await probationDao.findById(probationId);
    if (!probation) {
      throw new ParamError(`试用期记录ID=${probationId}不存在`);
    }

    const fields: string[] = [];
    const details: any = {};

    const now = new Date();
    const endDate = new Date(probation.endDate);
    const daysLeft = diffDays(now, endDate);
    const validStatuses = [
      ProbationStatus.EXPIRING_SOON,
      ProbationStatus.PASSED,
      ProbationStatus.FAILED,
    ];
    if (!validStatuses.includes(probation.status as ProbationStatus) && daysLeft > REGULARIZATION_PREREQUISITE_DAYS) {
      fields.push('status');
      details['status'] = `当前状态=${probation.status}，距离结束还有${daysLeft}天，需状态为EXPIRING_SOON/PASSED/FAILED或endDate-now<=${REGULARIZATION_PREREQUISITE_DAYS}天`;
    }

    const indicators = await probationAssessmentIndicatorDao.findByProbationId(probationId);
    if (indicators.length < REGULARIZATION_REQUIRED_ASSESSMENT_COUNT) {
      fields.push('assessmentCount');
      details['assessmentCount'] = `考核指标数量=${indicators.length}，要求>=${REGULARIZATION_REQUIRED_ASSESSMENT_COUNT}`;
    }

    if (!probation.assessmentFinalScore && !probation.assessmentStandardCheck) {
      fields.push('assessment');
      details['assessment'] = '需存在考核综合分(assessmentFinalScore)或考核标准校验通过(assessmentStandardCheck=true)';
    }

    const hasActive = await regularizationDao.hasActiveRegularization(probationId);
    if (hasActive) {
      fields.push('duplicate');
      details['duplicate'] = '已存在审批中(IN_APPROVAL)的转正申请，不能重复发起';
    }

    if (fields.length > 0) {
      throw new ValidationError('前置条件校验失败', fields, details);
    }

    return probation;
  }

  generateApprovalFlow(jobLevel?: string, department?: string): IApprovalFlowNode[] {
    const nodes: RegularizationApprovalNode[] = [...DEFAULT_APPROVAL_FLOW];

    const levelInfo = parseJobLevel(jobLevel || '');

    if (levelInfo.type === 'P' && levelInfo.num >= 6) {
      const hrIdx = nodes.indexOf(RegularizationApprovalNode.HR);
      if (hrIdx !== -1) {
        nodes.splice(hrIdx, 1);
      }
    }

    if (levelInfo.type === 'M') {
      const financeIdx = nodes.indexOf(RegularizationApprovalNode.ADMIN);
      if (financeIdx !== -1) {
        nodes.splice(financeIdx, 0, RegularizationApprovalNode.FINANCE);
      } else {
        nodes.push(RegularizationApprovalNode.FINANCE);
      }
    }

    return nodes.map((nodeKey, idx) => ({
      nodeKey,
      nodeName: RegularizationApprovalNodeLabel[nodeKey],
      nodeIndex: idx,
      nodeStatus: 'pending',
    }));
  }

  validateApprovalPermission(
    regularization: RegularizationAttributes,
    userId: number,
    userRole: UserRole,
    department?: string
  ): { allowed: boolean; reason?: string } {
    const currentIndex = regularization.currentNodeIndex ?? 0;
    const nodes = (regularization as any).approvalNodes || [];
    const currentNode = nodes[currentIndex];

    if (!currentNode) {
      return { allowed: false, reason: '当前没有待审批节点' };
    }

    const nodeKey = currentNode.nodeKey;

    if (nodeKey === RegularizationApprovalNode.DEPT_HEAD) {
      if (department && regularization.department === department) {
        return { allowed: true };
      }
      return { allowed: false, reason: `部门负责人仅可审批本部门(${regularization.department})申请` };
    }

    if (nodeKey === RegularizationApprovalNode.HR) {
      if (userRole === UserRole.HR || userRole === UserRole.ADMIN) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'HR节点仅HR角色或管理员可审批' };
    }

    if (nodeKey === RegularizationApprovalNode.HR_SUPER) {
      if (userRole === UserRole.HR || userRole === UserRole.ADMIN) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'HR主管节点仅HR角色或管理员可审批' };
    }

    if (nodeKey === RegularizationApprovalNode.FINANCE) {
      if (userRole === UserRole.ADMIN) {
        return { allowed: true };
      }
      return { allowed: false, reason: '财务节点仅管理员可审批' };
    }

    if (nodeKey === RegularizationApprovalNode.ADMIN) {
      if (userRole === UserRole.ADMIN) {
        return { allowed: true };
      }
      return { allowed: false, reason: '终审节点仅管理员可审批' };
    }

    return { allowed: false, reason: '未知审批节点类型' };
  }

  checkCompliance(
    probation: ProbationAttributes,
    regularization?: Partial<RegularizationAttributes>
  ): IComplianceCheckResult {
    const issues: IComplianceCheckResult['issues'] = [];
    const now = new Date();
    const endDate = new Date(probation.endDate);
    const daysLeft = diffDays(now, endDate);

    if (daysLeft > REGULARIZATION_PREREQUISITE_DAYS) {
      issues.push({
        type: RegularizationComplianceIssue.EARLY_APPLY,
        message: `提前转正拦截：剩余天数${daysLeft}天 > ${REGULARIZATION_PREREQUISITE_DAYS}天（${RegularizationComplianceIssueLabel[RegularizationComplianceIssue.EARLY_APPLY]}）`,
      });
    }

    if (!probation.assessmentFinalScore && !probation.assessmentStandardCheck) {
      issues.push({
        type: RegularizationComplianceIssue.NO_ASSESSMENT,
        message: '无有效考核记录（综合分或标准校验缺失）',
      });
    }

    if (regularization?.finalScore !== undefined && probation.assessmentFinalScore !== undefined) {
      const scoreDiff = Math.abs(Number(regularization.finalScore) - Number(probation.assessmentFinalScore));
      if (scoreDiff > 5) {
        issues.push({
          type: RegularizationComplianceIssue.DATA_MISMATCH,
          message: `数据不一致：试用期综合分(${probation.assessmentFinalScore})与转正申请分(${regularization.finalScore})差异超过5分`,
        });
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  calcRecruitmentFitScore(
    probation: ProbationAttributes,
    regularization?: Partial<RegularizationAttributes>
  ): IRecruitmentFitResult {
    const finalScore = Number(
      regularization?.finalScore ?? probation.assessmentFinalScore ?? 0
    );
    let grade: 'A' | 'B' | 'C' | 'D';
    let description: string;

    if (finalScore >= 90) {
      grade = 'A';
      description = `招聘适配度A级（优秀）：综合分${finalScore}分，高度匹配岗位要求，建议作为核心骨干培养`;
    } else if (finalScore >= 80) {
      grade = 'B';
      description = `招聘适配度B级（良好）：综合分${finalScore}分，较好匹配岗位要求，可重点培养`;
    } else if (finalScore >= 70) {
      grade = 'C';
      description = `招聘适配度C级（合格）：综合分${finalScore}分，基本满足岗位要求，需持续关注成长`;
    } else {
      grade = 'D';
      description = `招聘适配度D级（待提升）：综合分${finalScore}分，与岗位期望存在差距，建议制定改进计划`;
    }

    return {
      grade,
      score: finalScore,
      description,
    };
  }

  async createApply(
    probationId: number,
    applyData: {
      applyRemark?: string;
      applyAttachments?: any;
      finalScore?: number;
      newSalaryBase?: string;
      newSalaryPerformance?: string;
      newSalaryTotal?: string;
    },
    user: IUserContext
  ): Promise<RegularizationModel> {
    const transaction = await sequelize.transaction();
    try {
      const probation = await this.checkPrerequisites(probationId);

      const existing = await regularizationDao.findActiveByProbationId(probationId);
      if (existing && existing.status === RegularizationStatus.IN_APPROVAL) {
        throw new ValidationError(
          '合规校验失败',
          ['duplicate'],
          { duplicate: RegularizationComplianceIssueLabel[RegularizationComplianceIssue.DUPLICATE_APPLY] }
        );
      }

      const finalScore = applyData.finalScore ?? Number(probation.assessmentFinalScore ?? 85);
      const compliance = this.checkCompliance(probation.toJSON() as ProbationAttributes, {
        ...applyData,
        finalScore,
      });

      if (
        compliance.issues.some(
          (i) => i.type === RegularizationComplianceIssue.DUPLICATE_APPLY
        )
      ) {
        throw new ValidationError(
          '合规校验失败',
          compliance.issues.map((i) => i.type),
          Object.fromEntries(compliance.issues.map((i) => [i.type, i.message]))
        );
      }

      const approvalFlow = this.generateApprovalFlow(
        probation.jobLevel,
        probation.department
      );

      const fitResult = this.calcRecruitmentFitScore(
        probation.toJSON() as ProbationAttributes,
        { ...applyData, finalScore }
      );

      const createData: Partial<RegularizationAttributes> = {
        probationId: probation.id,
        onboardId: probation.onboardId,
        resumeId: probation.resumeId,
        jobId: probation.jobId,
        employeeNo: probation.employeeNo,
        name: probation.name,
        gender: probation.gender,
        phone: probation.phone,
        department: probation.department,
        position: probation.position,
        jobLevel: probation.jobLevel,
        jobCategory: probation.jobCategory,
        onboardBatch: probation.onboardBatch,
        applyDate: new Date(),
        applyRemark: applyData.applyRemark,
        applyAttachments: applyData.applyAttachments,
        finalScore,
        recruitmentFitGrade: fitResult.grade,
        recruitmentFitScore: fitResult.score,
        newSalaryBase: applyData.newSalaryBase,
        newSalaryPerformance: applyData.newSalaryPerformance,
        newSalaryTotal: applyData.newSalaryTotal,
        status: RegularizationStatus.IN_APPROVAL,
        currentNodeIndex: 0,
        totalNodes: approvalFlow.length,
        approvalStartTime: new Date(),
        resubmitCount: 0,
        hrOperatorId: user.id,
        hrOperatorName: user.realName || user.username,
        version: 1,
      };

      if (!compliance.compliant) {
        createData.remark = compliance.issues.map((i) => i.message).join('；');
      }

      const regularization = await regularizationDao.create(createData, { transaction });

      await regularizationApprovalNodeDao.bulkCreateForRegularization(
        regularization.id,
        approvalFlow,
        transaction
      );

      await this._recordOperationLog(
        regularization.id,
        RegularizationOperationAction.CREATE_APPLY,
        user,
        null,
        regularization.toJSON(),
        Object.keys(createData),
        `创建转正申请：员工=${probation.name}，岗位=${probation.position}，综合分=${finalScore}，适配度=${fitResult.grade}级${compliance.compliant ? '' : '，合规警告：' + compliance.issues.map(i => i.type).join(',')}`,
        transaction
      );

      await this._pushNotification(
        user.id,
        'regularization_created',
        `转正申请已创建：${probation.name} - ${probation.position}`
      );

      await transaction.commit();
      return regularization;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async approveNode(
    id: number,
    opinion: string,
    attachments: any,
    user: IUserContext
  ): Promise<RegularizationModel> {
    const transaction = await sequelize.transaction();
    try {
      const regularization = await regularizationDao.findDetailById(id);
      if (!regularization) {
        throw new NotFoundError('转正申请不存在');
      }
      if (regularization.status !== RegularizationStatus.IN_APPROVAL) {
        throw new BadRequestError(`当前状态="${regularization.status}"不允许审批操作，仅审批中(IN_APPROVAL)状态可操作`);
      }

      const permission = this.validateApprovalPermission(
        regularization.toJSON() as RegularizationAttributes,
        user.id,
        user.role,
        user.department
      );
      if (!permission.allowed) {
        throw new ForbiddenError(permission.reason || '无审批权限');
      }

      const beforeData = regularization.toJSON();
      const approvalNodes = (regularization as any).approvalNodes || [];
      const currentIndex = regularization.currentNodeIndex ?? 0;
      const currentNode = approvalNodes[currentIndex];

      if (!currentNode) {
        throw new BadRequestError('当前没有待审批节点');
      }

      const now = new Date();

      await regularizationApprovalNodeDao.updateNodeWithVersion(
        currentNode.id,
        {
          nodeStatus: 'approved',
          approverId: user.id,
          approverName: user.realName || user.username,
          approverRole: user.role,
          approveTime: now,
          opinion,
          attachments,
        },
        currentNode.version || 1,
        transaction
      );

      const isLastNode = currentIndex >= approvalNodes.length - 1;
      const updateData: any = {};
      const changedFields: string[] = [];

      if (isLastNode) {
        updateData.status = RegularizationStatus.APPROVED;
        updateData.approvalEndTime = now;
        updateData.approvedBy = user.realName || user.username;
        updateData.salaryAdjusted = true;
        updateData.salaryAdjustDate = now;
        updateData.syncedToProbation = true;
        changedFields.push('status', 'approvalEndTime', 'approvedBy', 'salaryAdjusted', 'salaryAdjustDate', 'syncedToProbation');

        try {
          await probationService.passProbation(
            regularization.probationId,
            Number(regularization.finalScore),
            opinion,
            { id: 0, role: UserRole.ADMIN, username: 'SYSTEM' }
          );
        } catch (e) {}

        try {
          const ledger = await onboardLedgerDao.findByOnboardId(regularization.onboardId);
          if (ledger && (regularization.newSalaryBase || regularization.newSalaryPerformance)) {
            const ledgerUpdate: any = {};
            if (regularization.newSalaryBase) {
              const baseNum = parseFloat(String(regularization.newSalaryBase).replace(/[^0-9.]/g, ''));
              if (!isNaN(baseNum)) ledgerUpdate.salaryBase = baseNum;
            }
            if (regularization.newSalaryPerformance) {
              const perfNum = parseFloat(String(regularization.newSalaryPerformance).replace(/[^0-9.]/g, ''));
              if (!isNaN(perfNum)) ledgerUpdate.salaryPerformance = perfNum;
            }
            if (Object.keys(ledgerUpdate).length > 0) {
              await OnboardLedger.update(
                ledgerUpdate,
                { where: { id: ledger.id }, transaction }
              );
              updateData.syncedToLedger = true;
              changedFields.push('syncedToLedger');
            }
          }
        } catch (e) {}
      } else {
        updateData.currentNodeIndex = currentIndex + 1;
        changedFields.push('currentNodeIndex');
      }

      updateData.version = (regularization.version || 1) + 1;
      changedFields.push('version');

      const [count] = await regularizationDao.updateWithVersion(
        id,
        updateData,
        regularization.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      const action = isLastNode
        ? RegularizationOperationAction.APPROVE_FINAL
        : RegularizationOperationAction.APPROVE_NODE;
      const nodeKey = currentNode.nodeKey as keyof typeof RegularizationApprovalNodeLabel;
      const remark = isLastNode
        ? `终审通过：${opinion || '无意见'}，员工=${regularization.name}，转正生效`
        : `节点审批通过：${RegularizationApprovalNodeLabel[nodeKey]}，意见：${opinion || '无意见'}`;

      await this._recordOperationLog(
        id,
        action,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        remark,
        transaction
      );

      await this._pushNotification(
        regularization.hrOperatorId || user.id,
        isLastNode ? 'regularization_approved' : 'regularization_node_approved',
        remark
      );

      await transaction.commit();
      return (await regularizationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rejectNode(
    id: number,
    opinion: string,
    user: IUserContext
  ): Promise<RegularizationModel> {
    const transaction = await sequelize.transaction();
    try {
      const regularization = await regularizationDao.findDetailById(id);
      if (!regularization) {
        throw new NotFoundError('转正申请不存在');
      }
      if (regularization.status !== RegularizationStatus.IN_APPROVAL) {
        throw new BadRequestError(`当前状态="${regularization.status}"不允许驳回操作，仅审批中(IN_APPROVAL)状态可操作`);
      }

      const permission = this.validateApprovalPermission(
        regularization.toJSON() as RegularizationAttributes,
        user.id,
        user.role,
        user.department
      );
      if (!permission.allowed) {
        throw new ForbiddenError(permission.reason || '无审批权限');
      }

      const beforeData = regularization.toJSON();
      const approvalNodes = (regularization as any).approvalNodes || [];
      const currentIndex = regularization.currentNodeIndex ?? 0;
      const currentNode = approvalNodes[currentIndex];

      if (!currentNode) {
        throw new BadRequestError('当前没有待审批节点');
      }

      const now = new Date();

      await regularizationApprovalNodeDao.updateNodeWithVersion(
        currentNode.id,
        {
          nodeStatus: 'rejected',
          approverId: user.id,
          approverName: user.realName || user.username,
          approverRole: user.role,
          approveTime: now,
          opinion,
        },
        currentNode.version || 1,
        transaction
      );

      const updateData: any = {
        status: RegularizationStatus.REJECTED,
        approvalEndTime: now,
        rejectedBy: user.realName || user.username,
        rejectReason: opinion,
        version: (regularization.version || 1) + 1,
      };
      const changedFields = ['status', 'approvalEndTime', 'rejectedBy', 'rejectReason', 'version'];

      const [count] = await regularizationDao.updateWithVersion(
        id,
        updateData,
        regularization.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      await this._recordOperationLog(
        id,
        RegularizationOperationAction.REJECT_NODE,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        `审批驳回：${RegularizationApprovalNodeLabel[currentNode.nodeKey as keyof typeof RegularizationApprovalNodeLabel]}，原因：${opinion || '未说明'}`,
        transaction
      );

      await this._pushNotification(
        regularization.hrOperatorId || user.id,
        'regularization_rejected',
        `转正申请被驳回：${regularization.name} - ${opinion || '未说明原因'}`
      );

      await transaction.commit();
      return (await regularizationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resubmit(
    id: number,
    modifyData: {
      applyRemark?: string;
      applyAttachments?: any;
    },
    user: IUserContext
  ): Promise<RegularizationModel> {
    const transaction = await sequelize.transaction();
    try {
      const regularization = await regularizationDao.findById(id);
      if (!regularization) {
        throw new NotFoundError('转正申请不存在');
      }
      if (regularization.status !== RegularizationStatus.REJECTED) {
        throw new BadRequestError(`当前状态="${regularization.status}"不允许重新提交，仅驳回(REJECTED)状态可操作`);
      }

      const probation = await probationDao.findById(regularization.probationId);
      if (!probation) {
        throw new NotFoundError('关联试用期记录不存在');
      }

      const beforeData = regularization.toJSON();

      const newApprovalFlow = this.generateApprovalFlow(
        probation.jobLevel,
        probation.department
      );

      await regularizationApprovalNodeDao.deleteByRegularizationId(id, transaction);
      await regularizationApprovalNodeDao.bulkCreateForRegularization(
        id,
        newApprovalFlow,
        transaction
      );

      const updateData: any = {
        status: RegularizationStatus.IN_APPROVAL,
        currentNodeIndex: 0,
        totalNodes: newApprovalFlow.length,
        approvalStartTime: new Date(),
        resubmitCount: (regularization.resubmitCount || 0) + 1,
        lastResubmitTime: new Date(),
        version: (regularization.version || 1) + 1,
      };
      const changedFields = [
        'status',
        'currentNodeIndex',
        'totalNodes',
        'approvalStartTime',
        'resubmitCount',
        'lastResubmitTime',
        'version',
      ];

      if (modifyData.applyRemark !== undefined) {
        updateData.applyRemark = modifyData.applyRemark;
        changedFields.push('applyRemark');
      }
      if (modifyData.applyAttachments !== undefined) {
        updateData.applyAttachments = modifyData.applyAttachments;
        changedFields.push('applyAttachments');
      }

      const [count] = await regularizationDao.updateWithVersion(
        id,
        updateData,
        regularization.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      await this._recordOperationLog(
        id,
        RegularizationOperationAction.RESUBMIT,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        `重新提交审批：第${updateData.resubmitCount}次提交${modifyData.applyRemark ? '，备注：' + modifyData.applyRemark : ''}`,
        transaction
      );

      await this._pushNotification(
        user.id,
        'regularization_resubmitted',
        `转正申请已重新提交：${regularization.name}`
      );

      await transaction.commit();
      return (await regularizationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async syncPendingStatus(): Promise<{
    synced: number;
    created: number;
    list: number[];
  }> {
    const transaction = await sequelize.transaction();
    try {
      const now = new Date();
      const warningDate = new Date();
      warningDate.setDate(now.getDate() + REGULARIZATION_PREREQUISITE_DAYS);

      const allProbations = await probationDao.findAll({
        where: {
          status: {
            [Op.in]: [
              ProbationStatus.IN_PROBATION,
              ProbationStatus.EXPIRING_SOON,
              ProbationStatus.EXTENDED,
            ],
          },
          endDate: {
            [Op.lte]: warningDate,
          },
          archived: false,
        },
      });

      const syncedList: number[] = [];
      let syncedCount = 0;
      let createdCount = 0;

      for (const probation of allProbations) {
        const existing = await regularizationDao.findByProbationId(probation.id);
        if (!existing) {
          const indicators = await probationAssessmentIndicatorDao.findByProbationId(probation.id);
          const hasAssessment =
            probation.assessmentFinalScore !== undefined ||
            probation.assessmentStandardCheck === true;
          const assessmentReady =
            indicators.length >= REGULARIZATION_REQUIRED_ASSESSMENT_COUNT && hasAssessment;

          const createData: Partial<RegularizationAttributes> = {
            probationId: probation.id,
            onboardId: probation.onboardId,
            resumeId: probation.resumeId,
            jobId: probation.jobId,
            employeeNo: probation.employeeNo,
            name: probation.name,
            gender: probation.gender,
            phone: probation.phone,
            department: probation.department,
            position: probation.position,
            jobLevel: probation.jobLevel,
            jobCategory: probation.jobCategory,
            onboardBatch: probation.onboardBatch,
            finalScore: Number(probation.assessmentFinalScore),
            status: assessmentReady
              ? RegularizationStatus.PENDING_APPLY
              : RegularizationStatus.PENDING_APPLY,
            remark: assessmentReady
              ? '系统自动生成：可发起转正申请'
              : '系统自动生成：考核待完善',
            resubmitCount: 0,
            version: 1,
          };

          const regularization = await regularizationDao.create(createData, { transaction });
          syncedList.push(regularization.id);
          createdCount++;
          syncedCount++;
        } else {
          syncedList.push(existing.id);
          syncedCount++;
        }
      }

      await transaction.commit();
      return { synced: syncedCount, created: createdCount, list: syncedList };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchFilterEligible(filters: {
    onboardBatch?: string;
    jobCategory?: string;
    department?: string;
    assessmentMinCount?: number;
    includeNoAssessment?: boolean;
  }): Promise<{
    total: number;
    eligible: number;
    ineligible: number;
    list: any[];
    reasons: string[];
  }> {
    const where: any = {};
    if (filters.onboardBatch) where.onboardBatch = filters.onboardBatch;
    if (filters.jobCategory) where.jobCategory = filters.jobCategory;
    if (filters.department) where.department = { [Op.like]: `%${filters.department}%` };

    where.status = {
      [Op.in]: [
        ProbationStatus.IN_PROBATION,
        ProbationStatus.EXPIRING_SOON,
        ProbationStatus.EXTENDED,
      ],
    };
    where.archived = false;

    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() + REGULARIZATION_PREREQUISITE_DAYS);
    where.endDate = { [Op.lte]: cutoffDate };

    const probations = await probationDao.findAll({ where });
    const minCount = filters.assessmentMinCount ?? REGULARIZATION_REQUIRED_ASSESSMENT_COUNT;

    const result: any[] = [];
    let eligibleCount = 0;
    let ineligibleCount = 0;
    const reasonSet = new Set<string>();

    for (const probation of probations) {
      const indicators = await probationAssessmentIndicatorDao.findByProbationId(probation.id);
      const hasActiveRegularization = await regularizationDao.hasActiveRegularization(probation.id);
      const hasScore =
        probation.assessmentFinalScore !== undefined ||
        probation.assessmentStandardCheck === true;
      const assessmentReady = indicators.length >= minCount && hasScore;

      const reasons: string[] = [];
      if (indicators.length < minCount) {
        reasons.push(`考核指标不足(${indicators.length}/${minCount})`);
      }
      if (!hasScore) {
        reasons.push('缺少综合考核分');
      }
      if (hasActiveRegularization) {
        reasons.push('已有审批中申请');
      }

      const isEligible = reasons.length === 0 || filters.includeNoAssessment;
      if (isEligible) {
        eligibleCount++;
      } else {
        ineligibleCount++;
        reasons.forEach((r) => reasonSet.add(r));
      }

      result.push({
        probationId: probation.id,
        name: probation.name,
        department: probation.department,
        position: probation.position,
        jobLevel: probation.jobLevel,
        jobCategory: probation.jobCategory
          ? JobCategoryLabel[probation.jobCategory as keyof typeof JobCategoryLabel]
          : undefined,
        onboardBatch: probation.onboardBatch,
        endDate: probation.endDate,
        assessmentCount: indicators.length,
        finalScore: probation.assessmentFinalScore,
        eligible: isEligible,
        reasons,
      });
    }

    return {
      total: result.length,
      eligible: eligibleCount,
      ineligible: ineligibleCount,
      list: result,
      reasons: Array.from(reasonSet),
    };
  }

  async batchApply(
    ids: number[],
    applyRemark: string,
    user: IUserContext
  ): Promise<IBatchResult> {
    if (user.role !== UserRole.HR && user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅HR或管理员可批量发起转正申请');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ParamError('ID列表不能为空');
    }

    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const created = await this.createApply(
          id,
          { applyRemark: applyRemark || '批量发起转正申请' },
          user
        );
        result.success++;
        result.results.push({
          index: i,
          success: true,
          id: created.id,
          name: created.name,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index: i,
          success: false,
          id,
          error: error.message || '未知错误',
        });
      }
    }

    return result;
  }

  async batchApprove(
    ids: number[],
    opinion: string,
    user: IUserContext
  ): Promise<IBatchResult> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可批量审批');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ParamError('ID列表不能为空');
    }

    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const approved = await this.approveNode(id, opinion || '批量审批通过', null, user);
        result.success++;
        result.results.push({
          index: i,
          success: true,
          id: approved.id,
          name: approved.name,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index: i,
          success: false,
          id,
          error: error.message || '未知错误',
        });
      }
    }

    return result;
  }

  async getApprovalFlowProgress(id: number): Promise<IApprovalProgress> {
    const regularization = await regularizationDao.findDetailById(id);
    if (!regularization) {
      throw new NotFoundError('转正申请不存在');
    }

    const approvalNodes = (regularization as any).approvalNodes || [];
    const currentIndex = regularization.currentNodeIndex ?? 0;
    const totalNodes = regularization.totalNodes || approvalNodes.length;

    const approvedNodes = approvalNodes.filter(
      (n: any) => n.nodeStatus === 'approved'
    );
    const pendingNodes = approvalNodes.filter(
      (n: any) => n.nodeStatus === 'pending'
    );
    const currentNode = approvalNodes[currentIndex];

    const progressPercent =
      totalNodes > 0
        ? Math.round((approvedNodes.length / totalNodes) * 100)
        : 0;

    return {
      currentNodeIndex: currentIndex,
      totalNodes,
      progressPercent,
      currentNode: currentNode
        ? {
            nodeKey: currentNode.nodeKey,
            nodeName: currentNode.nodeName,
            nodeStatus: currentNode.nodeStatus,
          }
        : undefined,
      approvedNodes: approvedNodes.map((n: any) => ({
        nodeKey: n.nodeKey,
        nodeName: n.nodeName,
        nodeIndex: n.nodeIndex,
        nodeStatus: n.nodeStatus,
        approverName: n.approverName,
        approveTime: n.approveTime,
        opinion: n.opinion,
      })),
      pendingNodes: pendingNodes.map((n: any) => ({
        nodeKey: n.nodeKey,
        nodeName: n.nodeName,
        nodeIndex: n.nodeIndex,
        nodeStatus: n.nodeStatus,
      })),
    };
  }

  async getPassRateReport(filters: {
    department?: string;
    jobCategory?: string;
    onboardBatch?: string;
    recruiterHrId?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<any> {
    const stats = await regularizationDao.getPassRateStats({
      department: filters.department,
      jobCategory: filters.jobCategory,
      onboardBatch: filters.onboardBatch,
      recruiterHrId: filters.recruiterHrId,
    });

    return {
      filters,
      ...stats,
      generatedAt: new Date().toISOString(),
    };
  }

  async getList(params: any): Promise<IPaginationResult<RegularizationModel>> {
    const {
      status,
      department,
      jobCategory,
      onboardBatch,
      name,
      currentNodeIndex,
      hrOperatorId,
      applyDateStart,
      applyDateEnd,
      ...rest
    } = params;

    const where: any = {};

    if (status) where.status = status;
    if (department) where.department = { [Op.like]: `%${department}%` };
    if (jobCategory) where.jobCategory = jobCategory;
    if (onboardBatch) where.onboardBatch = onboardBatch;
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (currentNodeIndex !== undefined) where.currentNodeIndex = Number(currentNodeIndex);
    if (hrOperatorId) where.hrOperatorId = Number(hrOperatorId);

    if (applyDateStart || applyDateEnd) {
      where.applyDate = {};
      if (applyDateStart) where.applyDate[Op.gte] = new Date(applyDateStart);
      if (applyDateEnd) where.applyDate[Op.lte] = new Date(applyDateEnd);
    }

    return regularizationDao.paginateWithRelations(rest, { where });
  }

  async getPendingList(params: any = {}): Promise<any> {
    const { department, jobCategory, onboardBatch, name, ...rest } = params;
    const where: any = {
      status: RegularizationStatus.PENDING_APPLY,
    };

    if (department) where.department = { [Op.like]: `%${department}%` };
    if (jobCategory) where.jobCategory = jobCategory;
    if (onboardBatch) where.onboardBatch = onboardBatch;
    if (name) where.name = { [Op.like]: `%${name}%` };

    return regularizationDao.paginateWithRelations(rest, { where });
  }

  async getById(id: number): Promise<RegularizationModel> {
    const regularization = await regularizationDao.findById(id);
    if (!regularization) {
      throw new NotFoundError('转正申请不存在');
    }
    return regularization;
  }

  async getDetail(id: number): Promise<any> {
    const regularization = await regularizationDao.findDetailById(id);
    if (!regularization) {
      throw new NotFoundError('转正申请不存在');
    }
    const progress = await this.getApprovalFlowProgress(id);

    let probationData = null;
    try {
      probationData = await probationDao.findById(regularization.probationId);
    } catch (e) {}

    return {
      ...regularization.toJSON(),
      progress,
      probation: probationData ? probationData.toJSON() : null,
    };
  }

  private async _recordOperationLog(
    regularizationId: number,
    action: RegularizationOperationAction,
    operator: IUserContext,
    before: any,
    after: any,
    changed: string[],
    remark?: string,
    transaction?: Transaction
  ) {
    return regularizationOperationLogDao.createLog(
      {
        regularizationId,
        action,
        operatorId: operator.id,
        operatorName: operator.realName || operator.username || `User#${operator.id}`,
        operatorRole: operator.role,
        beforeData: before,
        afterData: after,
        changedFields: changed,
        remark,
        ipAddress: operator.ip,
        userAgent: operator.userAgent,
      },
      transaction ? { transaction } : undefined
    );
  }

  private async _pushNotification(
    userId: number | undefined,
    type: string,
    content: string
  ) {
    console.log(`[NOTIFICATION] user=${userId}, type=${type}, content=${content}`);
    return Promise.resolve();
  }
}

export default new RegularizationService();
