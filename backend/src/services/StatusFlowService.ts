import { AccountOpening, CorporateAccountOpening, StatusChangeLog, User, Customer, Account, Organization } from '../models';
import {
  isValidId,
  throwNotFoundError,
  throwValidationError,
  throwBusinessError,
  throwForbiddenError
} from '../utils';
import dayjs from 'dayjs';
import { Op, Includeable, WhereOptions } from 'sequelize';
import {
  OpeningType,
  OpeningStatus,
  OpeningStatusText,
  OpeningStatusColor,
  OperationType,
  OperationTypeText,
  StatusFlowRules,
  StatusTransitionRequest,
  StatusTransitionResult,
  StatusFlowCheckResult,
  StatusChangeLogVO,
  StatusFlowItemVO,
  BatchStatusRequest,
  BatchStatusResultItem,
  StatusFlowQueryParams,
  StatusTraceRequest,
  StatusTraceVO
} from '../types/statusFlow';
import { PaginatedResult } from '../types/common';

const PERSONAL_ACCOUNT_TYPE_TEXT: Record<number, string> = {
  1: '一类账户(普通)',
  2: '二类账户',
  3: '三类账户'
};

const CORPORATE_ACCOUNT_TYPE_TEXT: Record<number, string> = {
  1: '基本存款账户',
  2: '一般存款账户',
  3: '专用存款账户',
  4: '临时存款账户'
};

const RiskLevelText: Record<number, string> = {
  0: '无风险', 1: '低风险', 2: '中低风险', 3: '中风险', 4: '中高风险', 5: '高风险'
};

const VOID_BLOCKED_STATUSES = [4, 5];

export class StatusFlowService {
  private getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  async checkTransition(data: StatusTransitionRequest, userRoles?: string[]): Promise<StatusFlowCheckResult> {
    if (!isValidId(data.openingId)) throwValidationError('无效的申请ID');
    if (![OpeningType.PERSONAL, OpeningType.CORPORATE].includes(data.openingType)) {
      throwValidationError('无效的开户类型');
    }

    const model: any = data.openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(data.openingId);
    if (!opening) throwNotFoundError('开户申请不存在');

    const currentStatus: number = opening.status;
    const targetStatus = data.targetStatus;
    const reasons: string[] = [];
    const conditions: StatusFlowCheckResult['requiredConditions'] = [];

    const flowRule = StatusFlowRules[currentStatus];
    if (!flowRule) {
      return {
        canTransition: false,
        reasons: ['当前状态不支持任何流转操作'],
        currentStatus,
        currentStatusText: OpeningStatusText[currentStatus],
        targetStatus,
        targetStatusText: OpeningStatusText[targetStatus],
        requiredConditions: conditions
      };
    }

    const statusAllowed = flowRule.allowed.includes(targetStatus);
    conditions.push({
      name: '状态流转合规',
      passed: statusAllowed,
      message: statusAllowed
        ? `允许从[${OpeningStatusText[currentStatus]}]流转至[${OpeningStatusText[targetStatus]}]`
        : `禁止从[${OpeningStatusText[currentStatus]}]流转至[${OpeningStatusText[targetStatus]}]`
    });
    if (!statusAllowed) reasons.push('状态流转不合规，禁止跳转');

    const opAllowed = flowRule.operations.includes(data.operationType);
    conditions.push({
      name: '操作类型匹配',
      passed: opAllowed,
      message: opAllowed
        ? `操作[${OperationTypeText[data.operationType]}]在当前状态下允许执行`
        : `操作[${OperationTypeText[data.operationType]}]在当前状态下被锁定`
    });
    if (!opAllowed) reasons.push('操作类型在当前状态下被锁定');

    if (data.operationType === OperationType.VOID) {
      const voidAllowed = !VOID_BLOCKED_STATUSES.includes(currentStatus);
      conditions.push({
        name: '作废条件校验',
        passed: voidAllowed,
        message: voidAllowed
          ? '当前状态允许作废操作'
          : '已通过终审/已完成开户状态禁止作废'
      });
      if (!voidAllowed) reasons.push('已通过终审/已完成开户状态禁止作废');
    }

    if (currentStatus === OpeningStatus.OPENED) {
      const notModify = data.operationType !== OperationType.OPEN_ACCOUNT;
      conditions.push({
        name: '已开户状态锁定',
        passed: !notModify,
        message: notModify ? '已完成开户禁止任何撤销修改' : ''
      });
      if (notModify) reasons.push('已完成开户状态禁止撤销修改');
    }

    const materialsOk = this._checkMaterialsComplete(opening, data.openingType);
    if (data.operationType === OperationType.SUBMIT && [2, 3].includes(targetStatus)) {
      conditions.push({
        name: '资料完整性',
        passed: materialsOk,
        message: materialsOk ? '开户资料完整' : '开户资料不完整，请补充'
      });
      if (!materialsOk) reasons.push('资料不完整，无法提交');
    }

    const permOk = this._checkOperationPermission(data.operationType, userRoles || []);
    conditions.push({
      name: '操作权限校验',
      passed: permOk,
      message: permOk ? '当前角色具有操作权限' : '当前角色无此操作权限'
    });
    if (!permOk) reasons.push('当前角色无此操作权限');

    const canTransition = conditions.every(c => c.passed);

    return {
      canTransition,
      reasons,
      currentStatus,
      currentStatusText: OpeningStatusText[currentStatus],
      targetStatus,
      targetStatusText: OpeningStatusText[targetStatus],
      requiredConditions: conditions
    };
  }

  async executeTransition(
    data: StatusTransitionRequest,
    operatorId: string,
    userRoles?: string[]
  ): Promise<StatusTransitionResult> {
    const checkResult = await this.checkTransition(data, userRoles);
    if (!checkResult.canTransition) {
      const complianceCheck = data.operationType === OperationType.VOID && VOID_BLOCKED_STATUSES.includes(checkResult.currentStatus) ? 2 : 0;

      await StatusChangeLog.create({
        opening_type: data.openingType,
        opening_id: data.openingId,
        opening_no: await this._getOpeningNo(data.openingType, data.openingId),
        status_before: checkResult.currentStatus,
        status_before_text: checkResult.currentStatusText,
        status_after: data.targetStatus,
        status_after_text: OpeningStatusText[data.targetStatus],
        operation_type: data.operationType,
        operation_type_text: OperationTypeText[data.operationType],
        operator_id: operatorId,
        operator_name: await this._getUserName(operatorId),
        operator_role: userRoles?.join(','),
        compliance_check: complianceCheck,
        violation_details: checkResult.reasons.join('；'),
        remark: data.remark
      } as any);

      throwBusinessError(`状态流转不合规：${checkResult.reasons.join('；')}`);
    }

    const model: any = data.openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(data.openingId);
    if (!opening) throwNotFoundError('开户申请不存在');

    const openingData: any = opening.toJSON();
    const statusBefore = openingData.status;
    const openingNo = openingData.opening_no;

    const updateData: any = { status: data.targetStatus };

    if (data.operationType === OperationType.CANCEL) {
      updateData.remark = data.remark || openingData.remark;
    } else if (data.operationType === OperationType.VOID) {
      updateData.status = OpeningStatus.CANCELLED;
      updateData.remark = data.remark || '开户作废';
    } else if (data.operationType === OperationType.RESUBMIT) {
      updateData.status = OpeningStatus.FILLING;
      updateData.reject_reason = null;
    } else if (data.operationType === OperationType.SUPPLEMENT) {
      updateData.status = OpeningStatus.FILLING;
    } else if (data.operationType === OperationType.REVIEW_APPROVE) {
      updateData.reviewer_id = operatorId;
      updateData.review_time = new Date();
    } else if (data.operationType === OperationType.REVIEW_REJECT) {
      updateData.reviewer_id = operatorId;
      updateData.review_time = new Date();
      updateData.reject_reason = data.remark || '审核驳回';
    } else if (data.operationType === OperationType.OPEN_ACCOUNT) {
      updateData.reviewer_id = operatorId;
      updateData.review_time = new Date();
    }

    await model.update(updateData, { where: { id: data.openingId } });

    const syncResult = await this._syncRelatedStatus(data.openingType, data.openingId, data.targetStatus, data.operationType);

    const operatorName = await this._getUserName(operatorId);
    const log = await StatusChangeLog.create({
      opening_type: data.openingType,
      opening_id: data.openingId,
      opening_no: openingNo,
      status_before: statusBefore,
      status_before_text: OpeningStatusText[statusBefore],
      status_after: data.operationType === OperationType.VOID ? OpeningStatus.CANCELLED : data.targetStatus,
      status_after_text: data.operationType === OperationType.VOID
        ? OpeningStatusText[OpeningStatus.CANCELLED]
        : OpeningStatusText[data.targetStatus],
      operation_type: data.operationType,
      operation_type_text: OperationTypeText[data.operationType],
      operator_id: operatorId,
      operator_name: operatorName,
      operator_role: userRoles?.join(','),
      compliance_check: 1,
      sync_result: syncResult ? JSON.stringify(syncResult) : undefined,
      remark: data.remark,
      operation_node: this._getOperationNode(statusBefore, data.targetStatus)
    } as any);

    return {
      success: true,
      openingId: data.openingId,
      openingNo,
      statusBefore,
      statusBeforeText: OpeningStatusText[statusBefore],
      statusAfter: data.operationType === OperationType.VOID ? OpeningStatus.CANCELLED : data.targetStatus,
      statusAfterText: data.operationType === OperationType.VOID
        ? OpeningStatusText[OpeningStatus.CANCELLED]
        : OpeningStatusText[data.targetStatus],
      operationType: data.operationType,
      operationTypeText: OperationTypeText[data.operationType],
      complianceCheck: 1,
      syncResult,
      logId: log.id
    };
  }

  async getFlowList(
    params: StatusFlowQueryParams,
    userId?: string,
    orgId?: string,
    userRoles?: string[]
  ): Promise<PaginatedResult<StatusFlowItemVO>> {
    const { page, pageSize, ...queryParams } = params;
    const pageNum = page || 1;
    const size = pageSize || 10;

    const isAdmin = userRoles?.includes('admin');

    const personalList = await this._queryFlowOpenings(
      AccountOpening, OpeningType.PERSONAL, queryParams, orgId, isAdmin
    );
    const corporateList = await this._queryFlowOpenings(
      CorporateAccountOpening, OpeningType.CORPORATE, queryParams, orgId, isAdmin
    );

    const combined = [...personalList, ...corporateList].sort((a: any, b: any) =>
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );

    const total = combined.length;
    const start = (pageNum - 1) * size;
    const paged = combined.slice(start, start + size);

    const list: StatusFlowItemVO[] = paged.map((item: any) =>
      this._toFlowItem(item, item._openingType)
    );

    return { list, total, page: pageNum, pageSize: size };
  }

  private async _queryFlowOpenings(
    model: any,
    openingType: number,
    params: any,
    orgId?: string,
    isAdmin?: boolean
  ): Promise<any[]> {
    const where: any = {};

    if (params.openingType !== undefined && params.openingType !== openingType) {
      where.id = { [Op.eq]: '__exclude_all__' };
      return [];
    }

    if (params.status !== undefined) where.status = params.status;
    if (params.keyword) {
      const nameField = openingType === OpeningType.PERSONAL ? 'customer_name' : 'enterprise_name';
      const idField = openingType === OpeningType.PERSONAL ? 'id_card_no' : 'credit_code';
      where[Op.or] = [
        { opening_no: { [Op.like]: `%${params.keyword}%` } },
        { [nameField]: { [Op.like]: `%${params.keyword}%` } },
        { [idField]: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.startTime) {
      where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(params.startTime).startOf('day').toDate() };
    }
    if (params.endTime) {
      where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(params.endTime).endOf('day').toDate() };
    }

    if (orgId && !isAdmin) where.submit_org_id = orgId;

    const rows = await model.findAll({ where, order: [['created_at', 'DESC']] } as any);
    return rows.map((r: any) => {
      const json = r.toJSON();
      json._openingType = openingType;
      return json;
    });
  }

  private _toFlowItem(item: any, type: number): StatusFlowItemVO {
    const data: any = item.toJSON ? item.toJSON() : item;
    const openingType = type || data._openingType;
    const currentStatus = data.status;
    const flowRule = StatusFlowRules[currentStatus];

    const customerName = openingType === OpeningType.PERSONAL ? data.customer_name : data.enterprise_name;
    const idCardNo = openingType === OpeningType.PERSONAL ? data.id_card_no : data.credit_code;
    const accountTypeText = openingType === OpeningType.PERSONAL
      ? PERSONAL_ACCOUNT_TYPE_TEXT[data.account_type] || '未知'
      : CORPORATE_ACCOUNT_TYPE_TEXT[data.account_type] || '未知';

    const materialsComplete = this._checkMaterialsComplete(data, openingType);
    const reviewProgress = this._getReviewProgress(currentStatus, data.account_type, openingType);

    return {
      id: data.id,
      openingType,
      openingNo: data.opening_no,
      customerName,
      idCardNo,
      currentStatus,
      currentStatusText: OpeningStatusText[currentStatus],
      statusColor: OpeningStatusColor[currentStatus],
      accountTypeText,
      riskLevelText: RiskLevelText[data.risk_level] || '未知',
      canSubmit: flowRule?.operations.includes('submit') || false,
      canReview: flowRule?.operations.includes('review_approve') || flowRule?.operations.includes('review_reject') || false,
      canCancel: flowRule?.operations.includes('cancel') || false,
      canVoid: flowRule?.operations.includes('void') || (flowRule?.operations.length > 0 && !VOID_BLOCKED_STATUSES.includes(currentStatus) && currentStatus !== OpeningStatus.OPENED),
      canResubmit: flowRule?.operations.includes('resubmit') || false,
      canSupplement: flowRule?.operations.includes('supplement') || false,
      materialsComplete,
      reviewProgress,
      lastOperationTime: data.updated_at ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : undefined,
      lastOperator: data.submitter?.real_name || data.reviewer_id ? '审核员' : undefined
    };
  }

  async batchOperation(
    data: BatchStatusRequest,
    operatorId: string,
    userRoles?: string[]
  ): Promise<BatchStatusResultItem[]> {
    if (!data.ids || data.ids.length === 0) throwValidationError('请选择要操作的申请');
    if (![OpeningType.PERSONAL, OpeningType.CORPORATE].includes(data.openingType)) {
      throwValidationError('无效的开户类型');
    }

    if (data.operationType === OperationType.VOID && !userRoles?.includes('admin')) {
      throwForbiddenError('仅管理员可执行批量作废操作');
    }

    const model: any = data.openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const results: BatchStatusResultItem[] = [];

    for (const id of data.ids) {
      try {
        const opening = await model.findByPk(id);
        if (!opening) {
          results.push({ id, openingNo: id, success: false, message: '申请不存在' });
          continue;
        }

        const openingData: any = opening.toJSON();

        if ([OpeningStatus.OPENED, OpeningStatus.REJECTED].includes(openingData.status) &&
          [OperationType.CANCEL, OperationType.VOID, OperationType.RESUBMIT].includes(data.operationType as OperationType)) {
          results.push({
            id,
            openingNo: openingData.opening_no,
            success: false,
            message: `状态[${OpeningStatusText[openingData.status]}]已锁定，不可操作`
          });
          continue;
        }

        const targetStatus = this._inferTargetStatus(openingData.status, data.operationType as OperationType);
        if (targetStatus === null) {
          results.push({
            id,
            openingNo: openingData.opening_no,
            success: false,
            message: '当前状态不支持该操作'
          });
          continue;
        }

        await this.executeTransition({
          openingType: data.openingType,
          openingId: id,
          targetStatus,
          operationType: data.operationType,
          remark: data.remark
        }, operatorId, userRoles);

        results.push({ id, openingNo: openingData.opening_no, success: true });
      } catch (e: any) {
        let openingNo = id;
        try {
          const opening = await model.findByPk(id);
          if (opening) openingNo = (opening as any).opening_no;
        } catch { /* ignore */ }
        results.push({ id, openingNo, success: false, message: e.message || '操作失败' });
      }
    }

    return results;
  }

  async traceStatusChange(params: StatusTraceRequest): Promise<StatusTraceVO> {
    const where: any = {};

    if (params.openingNo) where.opening_no = { [Op.like]: `%${params.openingNo}%` };
    if (params.operatorName) where.operator_name = { [Op.like]: `%${params.operatorName}%` };
    if (params.startTime) where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(params.startTime).startOf('day').toDate() };
    if (params.endTime) where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(params.endTime).endOf('day').toDate() };

    const logs = await StatusChangeLog.findAll({
      where,
      include: [this.getOperatorInclude()],
      order: [['created_at', 'DESC']],
      limit: 100
    } as any);

    const changeLogs: StatusChangeLogVO[] = logs.map((l: any) => this._convertLogVO(l));
    const complianceCount = changeLogs.filter(l => l.complianceCheck === 1).length;
    const violationCount = changeLogs.filter(l => l.complianceCheck === 0).length;
    const overreachCount = changeLogs.filter(l => l.complianceCheck === 2).length;

    const violations = changeLogs
      .filter(l => l.complianceCheck !== 1 && l.violationDetails)
      .map(l => ({
        id: l.id,
        openingNo: l.openingNo,
        violationDetails: l.violationDetails!,
        operatorName: l.operatorName,
        createdAt: l.createdAt
      }));

    return {
      changeLogs,
      statistics: {
        totalCount: changeLogs.length,
        complianceCount,
        violationCount,
        overreachCount
      },
      violations
    };
  }

  async getStatusConfig() {
    const statusList = Object.entries(OpeningStatusText).map(([value, label]) => ({
      value: Number(value),
      label,
      color: OpeningStatusColor[Number(value)],
      operations: StatusFlowRules[Number(value)]?.operations || [],
      allowedTransitions: StatusFlowRules[Number(value)]?.allowed || []
    }));

    const operationList = Object.entries(OperationTypeText).map(([value, label]) => ({
      value,
      label
    }));

    return { statusList, operationList, flowRules: StatusFlowRules };
  }

  private async _syncRelatedStatus(
    openingType: number,
    openingId: string,
    targetStatus: number,
    operationType: string
  ): Promise<StatusTransitionResult['syncResult']> {
    let customerStatusSynced = false;
    let accountStatusSynced = false;
    let riskFilingSynced = false;

    const model: any = openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(openingId);
    if (!opening) return { customerStatusSynced, accountStatusSynced, riskFilingSynced };

    const data: any = opening.toJSON();

    if (targetStatus === OpeningStatus.OPENED || operationType === OperationType.OPEN_ACCOUNT) {
      if (data.customer_id) {
        try {
          await Customer.update(
            { customer_status: 1, updated_at: new Date() } as any,
            { where: { id: data.customer_id } }
          );
          customerStatusSynced = true;
        } catch { /* ignore */ }
      }

      if (data.account_id) {
        try {
          await Account.update(
            { account_status: 1, updated_at: new Date() } as any,
            { where: { id: data.account_id } }
          );
          accountStatusSynced = true;
        } catch { /* ignore */ }
      }

      riskFilingSynced = true;
    }

    if (targetStatus === OpeningStatus.CANCELLED || operationType === OperationType.VOID) {
      if (data.customer_id) {
        try {
          await Customer.update(
            { customer_status: 3, updated_at: new Date() } as any,
            { where: { id: data.customer_id } }
          );
          customerStatusSynced = true;
        } catch { /* ignore */ }
      }
      riskFilingSynced = true;
    }

    if (targetStatus === OpeningStatus.REJECTED) {
      riskFilingSynced = true;
    }

    return { customerStatusSynced, accountStatusSynced, riskFilingSynced };
  }

  private _checkMaterialsComplete(opening: any, openingType: number): boolean {
    const data: any = opening.toJSON ? opening.toJSON() : opening;
    if (openingType === OpeningType.PERSONAL) {
      const urls = data.image_urls ? data.image_urls.split(',').filter((u: string) => u.trim()) : [];
      return urls.length >= 3;
    }
    let materials: any[] = [];
    if (data.supporting_materials) {
      try {
        materials = typeof data.supporting_materials === 'string'
          ? JSON.parse(data.supporting_materials)
          : data.supporting_materials;
      } catch { materials = []; }
    }
    return Array.isArray(materials) && materials.length >= 3;
  }

  private _getReviewProgress(status: number, accountType: number, openingType: number): string {
    if (status === 0 || status === 1) return '未进入审核';
    if (status === 2) return '资料录入中';
    if (status === 3) return '待审核';
    if (status === 4) return '审核通过';
    if (status === 5) return '已开户';
    if (status === 6) return '审核驳回';
    if (status === 7) return '已取消';
    if (status === 8) return '已拒绝';
    return '未知';
  }

  private _inferTargetStatus(currentStatus: number, operationType: OperationType): number | null {
    const rule = StatusFlowRules[currentStatus];
    if (!rule) return null;
    if (!rule.operations.includes(operationType)) return null;

    if (operationType === OperationType.SUBMIT) {
      if (currentStatus === 0) return 1;
      if (currentStatus === 1) return 2;
      if (currentStatus === 2) return 3;
    }
    if (operationType === OperationType.REVIEW_APPROVE) return 4;
    if (operationType === OperationType.REVIEW_REJECT) return 6;
    if (operationType === OperationType.CANCEL) return 7;
    if (operationType === OperationType.VOID) return 7;
    if (operationType === OperationType.RESUBMIT) return 2;
    if (operationType === OperationType.SUPPLEMENT) return 2;
    if (operationType === OperationType.OPEN_ACCOUNT) return 5;

    return rule.allowed[0] ?? null;
  }

  private _checkOperationPermission(operationType: string, roles: string[]): boolean {
    const isAdmin = roles.includes('admin');
    const isManager = roles.includes('manager') || isAdmin;
    const isOperator = roles.includes('operator') || isManager;
    const isAuditor = roles.includes('auditor') || isManager;

    switch (operationType) {
      case OperationType.SUBMIT:
      case OperationType.SUPPLEMENT:
        return isOperator;
      case OperationType.REVIEW_APPROVE:
      case OperationType.REVIEW_REJECT:
        return isAuditor;
      case OperationType.CANCEL:
        return isManager;
      case OperationType.VOID:
        return isAdmin;
      case OperationType.RESUBMIT:
        return isOperator;
      case OperationType.OPEN_ACCOUNT:
        return isManager;
      default:
        return false;
    }
  }

  private _getOperationNode(statusBefore: number, statusAfter: number): string {
    if (statusAfter === 5) return '开户完成';
    if (statusAfter === 4) return '审核通过';
    if (statusAfter === 6) return '审核驳回';
    if (statusAfter === 7) return '撤销/作废';
    if (statusAfter === 3) return '提交审核';
    if (statusAfter === 2) return '资料录入';
    return '状态变更';
  }

  private async _getOpeningNo(openingType: number, openingId: string): Promise<string> {
    const model: any = openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(openingId);
    return opening ? (opening as any).opening_no : openingId;
  }

  private async _getUserName(userId: string): Promise<string> {
    const user = await User.findByPk(userId);
    return user ? (user as any).real_name || (user as any).username : '未知';
  }

  private _convertLogVO(log: any): StatusChangeLogVO {
    const data: any = log.toJSON ? log.toJSON() : log;
    let syncResult: any = data.sync_result;
    if (typeof syncResult === 'string') {
      try { syncResult = JSON.parse(syncResult); } catch { syncResult = undefined; }
    }

    return {
      id: data.id,
      openingType: data.opening_type,
      openingId: data.opening_id,
      openingNo: data.opening_no,
      statusBefore: data.status_before,
      statusBeforeText: data.status_before_text,
      statusAfter: data.status_after,
      statusAfterText: data.status_after_text,
      operationType: data.operation_type,
      operationTypeText: data.operation_type_text,
      operatorId: data.operator_id,
      operatorName: data.operator?.real_name || data.operator_name,
      operatorRole: data.operator_role,
      complianceCheck: data.compliance_check,
      violationDetails: data.violation_details,
      syncResult,
      remark: data.remark,
      operationNode: data.operation_node,
      createdAt: data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
    };
  }
}
