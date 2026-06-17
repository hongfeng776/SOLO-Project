import { AccountOpening, CorporateAccountOpening, OpeningReviewLog, User, Organization } from '../models';
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
  OpeningReviewItemVO,
  ReviewLogVO,
  OpeningReviewDetailVO,
  ReviewSubmitRequest,
  OpeningReviewBatchRequest,
  OpeningReviewBatchResultItem,
  ReviewTraceRequest,
  ReviewTraceVO,
  ReviewPreCheckVO,
  ReviewQueryParams,
  OpeningType,
  ReviewLevel,
  ReviewResult,
  ReviewStage,
  OpeningTypeText,
  ReviewLevelText,
  ReviewResultText,
  ReviewStageText,
  RiskLevelText,
  ChannelText,
  RejectReasonText
} from '../types/openingReview';
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

const OPENING_STATUS_TEXT: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝'
};

const REQUIRED_PERSONAL_MATERIALS = [
  { name: '身份证正面', field: 'id_front' },
  { name: '身份证反面', field: 'id_back' },
  { name: '人脸照片', field: 'face_photo' },
  { name: '手持身份证照', field: 'handheld_photo' }
];

const REQUIRED_CORPORATE_MATERIALS = [
  { name: '营业执照正本', field: 'license' },
  { name: '法人身份证正面', field: 'legal_id_front' },
  { name: '法人身份证反面', field: 'legal_id_back' },
  { name: '开户授权书', field: 'authorization' },
  { name: '经办人身份证', field: 'agent_id' }
];

export class OpeningReviewService {
  private getReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  private getSubmitterInclude(): Includeable {
    return {
      model: User,
      as: 'submitter',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  private getSubmitOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'submit_org',
      required: false,
      attributes: ['id', 'name']
    };
  }

  private getTargetOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'target_org',
      required: false,
      attributes: ['id', 'name']
    };
  }

  async preCheckEnterConditions(
    openingType: number,
    openingId: string
  ): Promise<ReviewPreCheckVO> {
    if (!isValidId(openingId)) {
      throwValidationError('无效的申请ID');
    }
    if (![OpeningType.PERSONAL, OpeningType.CORPORATE].includes(openingType)) {
      throwValidationError('无效的开户类型');
    }

    const model: any = openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(openingId);
    if (!opening) {
      throwNotFoundError('开户申请不存在');
    }

    const data: any = opening.toJSON();
    const checklist: ReviewPreCheckVO['checklist'] = [];
    const reasons: string[] = [];

    const statusOk = data.status >= 3;
    checklist.push({
      name: '申请提交完成',
      passed: statusOk,
      message: statusOk ? `当前状态：${OPENING_STATUS_TEXT[data.status]}` : `当前状态：${OPENING_STATUS_TEXT[data.status]}，需先完成提交`
    });
    if (!statusOk) reasons.push('申请尚未完成提交');

    let materialsOk = false;
    if (openingType === OpeningType.PERSONAL) {
      const urls = data.image_urls ? data.image_urls.split(',').filter((u: string) => u.trim()) : [];
      materialsOk = urls.length >= 3;
    } else {
      let materials: any[] = [];
      if (data.supporting_materials) {
        try {
          materials = typeof data.supporting_materials === 'string'
            ? JSON.parse(data.supporting_materials)
            : data.supporting_materials;
        } catch { materials = []; }
      }
      materialsOk = Array.isArray(materials) && materials.length >= 3;
    }
    checklist.push({
      name: '资料影像上传',
      passed: materialsOk,
      message: materialsOk ? '开户资料已完整上传' : '开户资料影像不完整，请补充上传'
    });
    if (!materialsOk) reasons.push('资料影像不完整');

    const precheckOk = data.precheck_result === 1 && data.risk_level !== undefined && data.risk_level <= 3;
    checklist.push({
      name: '基础风控预审',
      passed: precheckOk,
      message: precheckOk
        ? `预审通过，风险等级：${RiskLevelText[data.risk_level] || '未知'}`
        : data.precheck_result !== 1
          ? '基础风控预审未通过'
          : `风险等级过高：${RiskLevelText[data.risk_level] || '未知'}`
    });
    if (!precheckOk) reasons.push('基础风控预审不达标');

    return {
      canEnter: checklist.every(c => c.passed),
      reasons,
      checklist
    };
  }

  async getPendingReviewList(
    params: ReviewQueryParams,
    userId?: string,
    orgId?: string,
    userRoles?: string[]
  ): Promise<PaginatedResult<OpeningReviewItemVO>> {
    const { page, pageSize, ...queryParams } = params;
    const pageNum = page || 1;
    const size = pageSize || 10;

    const isAdmin = userRoles?.includes('admin');
    const isManager = userRoles?.includes('manager') || isAdmin;
    const isOperator = userRoles?.includes('operator') || isManager;

    let allowedStages: number[] = [];
    if (isAdmin) {
      allowedStages = [ReviewStage.PENDING, ReviewStage.IN_REVIEW, ReviewStage.FIRST_PASS, ReviewStage.SECOND_PASS];
    } else if (isManager) {
      allowedStages = [ReviewStage.PENDING, ReviewStage.IN_REVIEW, ReviewStage.FIRST_PASS, ReviewStage.SECOND_PASS];
    } else if (isOperator) {
      allowedStages = [ReviewStage.PENDING, ReviewStage.IN_REVIEW];
    }

    const personalList = await this._queryOpenings(
      AccountOpening,
      OpeningType.PERSONAL,
      queryParams,
      orgId,
      isAdmin,
      allowedStages
    );

    const corporateList = await this._queryOpenings(
      CorporateAccountOpening,
      OpeningType.CORPORATE,
      queryParams,
      orgId,
      isAdmin,
      allowedStages
    );

    const combined = [...personalList, ...corporateList].sort((a: any, b: any) =>
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );

    const total = combined.length;
    const start = (pageNum - 1) * size;
    const paged = combined.slice(start, start + size);

    const list: OpeningReviewItemVO[] = paged.map((item: any) =>
      this._toReviewStage(item, item._openingType)
    );

    return { list, total, page: pageNum, pageSize: size };
  }

  private async _queryOpenings(
    model: any,
    openingType: number,
    params: any,
    orgId?: string,
    isAdmin?: boolean,
    allowedStages?: number[]
  ): Promise<any[]> {
    const where: WhereOptions = this._buildOpeningQuery(params, openingType, orgId, isAdmin);

    if (allowedStages && allowedStages.length > 0) {
      const statusConditions: any = {};
      if (allowedStages.includes(ReviewStage.PENDING) || allowedStages.includes(ReviewStage.IN_REVIEW)) {
        statusConditions[Op.or] = [
          { status: 3 },
          { status: { [Op.in]: [0, 1, 2] } }
        ];
      }
      Object.assign(where, statusConditions);
    }

    const include = [
      this.getSubmitterInclude(),
      this.getSubmitOrgInclude(),
      this.getTargetOrgInclude()
    ];

    const rows = await model.findAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      raw: false
    } as any);

    return rows.map((r: any) => {
      const json = r.toJSON();
      json._openingType = openingType;
      return json;
    });
  }

  private _buildOpeningQuery(
    params: any,
    openingType: number,
    orgId?: string,
    isAdmin?: boolean
  ): WhereOptions {
    const where: any = {};

    if (params.openingType !== undefined && params.openingType !== openingType) {
      where.id = { [Op.eq]: '__exclude_all__' };
      return where;
    }

    if (params.keyword) {
      const nameField = openingType === OpeningType.PERSONAL ? 'customer_name' : 'enterprise_name';
      const idField = openingType === OpeningType.PERSONAL ? 'id_card_no' : 'credit_code';
      where[Op.or] = [
        { opening_no: { [Op.like]: `%${params.keyword}%` } },
        { [nameField]: { [Op.like]: `%${params.keyword}%` } },
        { [idField]: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.channelCode) {
      where.channel_code = params.channelCode;
    }

    if (params.accountType !== undefined) {
      where.account_type = params.accountType;
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    if (orgId && !isAdmin) {
      where.submit_org_id = orgId;
    }

    return where;
  }

  async getReviewDetail(
    openingType: number,
    openingId: string
  ): Promise<OpeningReviewDetailVO> {
    if (!isValidId(openingId)) throwValidationError('无效的申请ID');
    if (![OpeningType.PERSONAL, OpeningType.CORPORATE].includes(openingType)) {
      throwValidationError('无效的开户类型');
    }

    const model: any = openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(openingId, {
      include: [
        this.getSubmitterInclude(),
        this.getSubmitOrgInclude(),
        this.getTargetOrgInclude()
      ]
    } as any);
    if (!opening) throwNotFoundError('开户申请不存在');

    const data: any = opening.toJSON();
    const reviewLogs = await this._getReviewLogs(openingType, openingId);

    const requiredMaterials = openingType === OpeningType.PERSONAL
      ? REQUIRED_PERSONAL_MATERIALS
      : REQUIRED_CORPORATE_MATERIALS;

    let uploadedUrls: string[] = [];
    if (openingType === OpeningType.PERSONAL) {
      uploadedUrls = data.image_urls ? data.image_urls.split(',').filter((u: string) => u.trim()) : [];
    } else {
      if (data.supporting_materials) {
        try {
          const parsed = typeof data.supporting_materials === 'string'
            ? JSON.parse(data.supporting_materials)
            : data.supporting_materials;
          uploadedUrls = Array.isArray(parsed) ? parsed : [];
        } catch { uploadedUrls = []; }
      }
    }

    const materials = requiredMaterials.map((m, idx) => {
      const url = uploadedUrls[idx];
      const uploaded = !!url;
      return {
        name: m.name,
        uploaded,
        url: url || undefined,
        missing: !uploaded
      };
    });
    const missingMaterials = materials.filter(m => m.missing).map(m => m.name);

    let precheckItems: { name: string; passed: boolean; message: string }[] = [];
    if (data.precheck_reasons) {
      try {
        const parsed = typeof data.precheck_reasons === 'string'
          ? JSON.parse(data.precheck_reasons)
          : data.precheck_reasons;
        if (Array.isArray(parsed)) {
          precheckItems = parsed.map((p: any) => ({
            name: p.name || '检查项',
            passed: !!p.passed,
            message: p.message || ''
          }));
        }
      } catch { /* ignore */ }
    }

    const stageInfo = this._calculateStageInfo(data, openingType, reviewLogs);

    return {
      baseInfo: this._buildBaseInfo(data, openingType),
      materials,
      precheckResult: {
        passed: data.precheck_result === 1,
        riskLevel: data.risk_level || 0,
        riskLevelText: RiskLevelText[data.risk_level] || '未知',
        overallScore: precheckItems.length > 0
          ? Math.floor((precheckItems.filter(i => i.passed).length / precheckItems.length) * 100)
          : undefined,
        items: precheckItems.length > 0 ? precheckItems : [
          { name: '预审状态', passed: data.precheck_result === 1, message: data.precheck_result === 1 ? '已通过预审' : '未通过预审' }
        ]
      },
      currentReview: {
        currentLevel: stageInfo.currentLevel,
        currentLevelText: ReviewLevelText[stageInfo.currentLevel] || '未知',
        nextLevel: stageInfo.nextLevel,
        requiredLevel: stageInfo.requiredLevel,
        canReview: stageInfo.canReview,
        hasConflict: reviewLogs.some((l: ReviewLogVO) => l.conflictFlag === 1)
      },
      reviewLogs
    };
  }

  private _buildBaseInfo(data: any, openingType: number): OpeningReviewDetailVO['baseInfo'] {
    const submitterName = data.submitter?.real_name || data.submitter?.username;
    const submitOrgName = data.submit_org?.name;
    const targetOrgName = data.target_org?.name;

    if (openingType === OpeningType.PERSONAL) {
      return {
        id: data.id,
        openingNo: data.opening_no,
        openingType,
        openingTypeText: OpeningTypeText[openingType],
        customerName: data.customer_name,
        idCardNo: data.id_card_no,
        accountType: data.account_type,
        accountTypeText: this._convertAccountType(openingType, data.account_type),
        channelCode: data.channel_code,
        channelText: ChannelText[data.channel_code] || data.channel_code || '未知',
        status: data.status,
        statusText: OPENING_STATUS_TEXT[data.status] || '未知',
        submitTime: data.submit_time ? dayjs(data.submit_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
        submitterName,
        submitOrgName,
        targetOrgName,
        openPurpose: data.open_purpose,
        mobile: data.mobile,
        registeredAddress: data.residential_address,
        riskLevel: data.risk_level || 0,
        riskLevelText: RiskLevelText[data.risk_level] || '未知',
        riskTags: data.risk_tags
      };
    }

    return {
      id: data.id,
      openingNo: data.opening_no,
      openingType,
      openingTypeText: OpeningTypeText[openingType],
      customerName: data.enterprise_name,
      idCardNo: data.credit_code,
      accountType: data.account_type,
      accountTypeText: this._convertAccountType(openingType, data.account_type),
      channelCode: data.channel_code,
      channelText: ChannelText[data.channel_code] || data.channel_code || '未知',
      status: data.status,
      statusText: OPENING_STATUS_TEXT[data.status] || '未知',
      submitTime: data.submit_time ? dayjs(data.submit_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      submitterName,
      submitOrgName,
      targetOrgName,
      openPurpose: data.open_purpose,
      businessAddress: data.business_address,
      registeredAddress: data.registered_address,
      enterpriseName: data.enterprise_name,
      creditCode: data.credit_code,
      legalRepresentative: data.legal_representative,
      legalIdCardNo: data.legal_id_card_no,
      agentName: data.agent_name,
      agentIdCardNo: data.agent_id_card_no,
      riskLevel: data.risk_level || 0,
      riskLevelText: RiskLevelText[data.risk_level] || '未知',
      riskTags: data.risk_tags
    };
  }

  private _calculateStageInfo(
    data: any,
    openingType: number,
    reviewLogs: ReviewLogVO[]
  ): {
    currentLevel: number;
    nextLevel: number;
    requiredLevel: number;
    canReview: boolean;
  } {
    const approvalLevel = this._getRequiredApprovalLevel(data.account_type, openingType);
    const approveLogs = reviewLogs.filter(l => l.reviewResult === ReviewResult.APPROVED);
    const rejectLogs = reviewLogs.filter(l => l.reviewResult === ReviewResult.REJECTED);
    const cancelLogs = reviewLogs.filter(l => l.reviewResult === ReviewResult.CANCELLED);

    if (cancelLogs.length > 0 || data.status === 7) {
      return { currentLevel: 0, nextLevel: 1, requiredLevel: approvalLevel, canReview: false };
    }
    if (rejectLogs.length > 0 || data.status === 6) {
      return { currentLevel: 0, nextLevel: 1, requiredLevel: approvalLevel, canReview: false };
    }
    if (data.status === 4 || data.status === 5) {
      return { currentLevel: approvalLevel, nextLevel: 0, requiredLevel: approvalLevel, canReview: false };
    }

    const currentLevel = approveLogs.length + 1;
    const nextLevel = currentLevel < approvalLevel ? currentLevel + 1 : 0;

    return {
      currentLevel: Math.min(currentLevel, approvalLevel),
      nextLevel,
      requiredLevel: approvalLevel,
      canReview: approveLogs.length < approvalLevel
    };
  }

  private _getRequiredApprovalLevel(accountType: number, openingType: number): number {
    if (openingType === OpeningType.CORPORATE) {
      const map: Record<number, number> = { 1: 3, 2: 2, 3: 2, 4: 1 };
      return map[accountType] || 2;
    }
    const map: Record<number, number> = { 1: 2, 2: 1, 3: 1 };
    return map[accountType] || 1;
  }

  private async _getReviewLogs(openingType: number, openingId: string): Promise<ReviewLogVO[]> {
    const logs = await OpeningReviewLog.findAll({
      where: { opening_type: openingType, opening_id: openingId },
      include: [this.getReviewerInclude()],
      order: [['created_at', 'ASC']]
    } as any);
    return logs.map((l: any) => this._convertReviewLogVO(l));
  }

  private _convertReviewLogVO(log: any): ReviewLogVO {
    const data: any = log.toJSON ? log.toJSON() : log;
    let supportingFiles: any = data.supporting_files;
    if (typeof supportingFiles === 'string') {
      try { supportingFiles = JSON.parse(supportingFiles); } catch { supportingFiles = undefined; }
    }

    return {
      id: data.id,
      openingType: data.opening_type,
      openingId: data.opening_id,
      openingNo: data.opening_no,
      reviewLevel: data.review_level,
      reviewLevelText: ReviewLevelText[data.review_level] || '未知',
      reviewerId: data.reviewer_id,
      reviewerName: data.reviewer?.real_name || data.reviewer?.username || data.reviewer_name,
      reviewResult: data.review_result,
      reviewResultText: ReviewResultText[data.review_result] || '未知',
      reviewComment: data.review_comment,
      rejectReason: data.reject_reason
        ? (RejectReasonText[data.reject_reason] || data.reject_reason)
        : undefined,
      rejectDetails: data.reject_details,
      supportingFiles,
      preApprovedAmount: data.pre_approved_amount,
      riskLevelBefore: data.risk_level_before,
      riskLevelAfter: data.risk_level_after,
      consistencyCheck: data.consistency_check,
      conflictFlag: data.conflict_flag || 0,
      nextRequiredLevel: data.next_required_level,
      createdAt: data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
    };
  }

  async submitReview(
    data: ReviewSubmitRequest,
    reviewerId: string,
    userRoles?: string[]
  ): Promise<ReviewLogVO> {
    if (!isValidId(data.openingId)) throwValidationError('无效的申请ID');
    if (![OpeningType.PERSONAL, OpeningType.CORPORATE].includes(data.openingType)) {
      throwValidationError('无效的开户类型');
    }
    if (![ReviewLevel.FIRST, ReviewLevel.SECOND, ReviewLevel.FINAL].includes(data.level)) {
      throwValidationError('无效的审核级别');
    }
    if (![ReviewResult.APPROVED, ReviewResult.REJECTED, ReviewResult.CANCELLED].includes(data.result)) {
      throwValidationError('无效的审核结果');
    }

    if (!this._checkPermission(data.level, userRoles || [])) {
      throwForbiddenError(`无${ReviewLevelText[data.level]}权限`);
    }

    const model: any = data.openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(data.openingId);
    if (!opening) throwNotFoundError('开户申请不存在');

    const existingLogs = await OpeningReviewLog.findAll({
      where: { opening_type: data.openingType, opening_id: data.openingId },
      order: [['created_at', 'ASC']]
    });
    const approvalsCount = existingLogs.filter(l => l.review_result === ReviewResult.APPROVED).length;
    const approvalLevel = this._getRequiredApprovalLevel((opening as any).account_type, data.openingType);

    const expectedLevel = approvalsCount + 1;
    if (data.result !== ReviewResult.CANCELLED && data.level !== expectedLevel) {
      throwBusinessError(`审核级别不匹配，当前应为${ReviewLevelText[expectedLevel]}`);
    }
    if (approvalsCount >= approvalLevel && data.result !== ReviewResult.CANCELLED) {
      throwBusinessError('该申请已完成全部审核');
    }

    if (data.result === ReviewResult.REJECTED && !data.rejectReason) {
      throwValidationError('驳回操作必须填写驳回原因');
    }

    const reviewer = await User.findByPk(reviewerId);
    const reviewerName = reviewer
      ? (reviewer as any).real_name || (reviewer as any).username
      : '未知审核员';

    const openingData: any = opening.toJSON();
    const riskBefore = openingData.risk_level;
    let riskAfter = riskBefore;
    let conflictFlag = 0;
    let consistencyCheck = 2;

    if (approvalsCount > 0) {
      const prevApproved = approvalsCount > 0;
      if (prevApproved && data.result === ReviewResult.REJECTED) {
        conflictFlag = 1;
        consistencyCheck = 0;
      } else if (prevApproved && data.result === ReviewResult.APPROVED) {
        consistencyCheck = 1;
      }
    }

    let nextRequiredLevel: number | undefined;
    let updateData: any = {};

    if (data.result === ReviewResult.APPROVED) {
      const newApprovalsCount = approvalsCount + 1;
      if (newApprovalsCount >= approvalLevel) {
        updateData = {
          status: 4,
          reviewer_id: reviewerId,
          review_time: new Date()
        };
        nextRequiredLevel = 0;
        await this._syncArchiveMaterials(data.openingType, data.openingId);
      } else {
        nextRequiredLevel = data.level + 1;
      }
    } else if (data.result === ReviewResult.REJECTED) {
      updateData = {
        status: 6,
        reviewer_id: reviewerId,
        review_time: new Date(),
        reject_reason: data.rejectReason
      };
      nextRequiredLevel = 0;
    } else if (data.result === ReviewResult.CANCELLED) {
      updateData = {
        status: 3
      };
      nextRequiredLevel = 1;
    }

    const log = await OpeningReviewLog.create({
      opening_type: data.openingType,
      opening_id: data.openingId,
      opening_no: openingData.opening_no,
      review_level: data.result === ReviewResult.CANCELLED ? expectedLevel : data.level,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      review_result: data.result,
      review_comment: data.comment,
      reject_reason: data.rejectReason,
      reject_details: data.rejectDetails,
      supporting_files: data.supportingFiles ? JSON.stringify(data.supportingFiles) : undefined,
      pre_approved_amount: openingData.registered_capital || null,
      risk_level_before: riskBefore,
      risk_level_after: riskAfter,
      consistency_check: consistencyCheck,
      conflict_flag: conflictFlag,
      next_required_level: nextRequiredLevel
    } as any);

    if (Object.keys(updateData).length > 0) {
      await model.update(updateData, { where: { id: data.openingId } });
    }

    const logWithReviewer = await OpeningReviewLog.findByPk(log.id, {
      include: [this.getReviewerInclude()]
    } as any);
    return this._convertReviewLogVO(logWithReviewer || log);
  }

  async batchReview(
    data: OpeningReviewBatchRequest,
    reviewerId: string,
    userRoles?: string[]
  ): Promise<OpeningReviewBatchResultItem[]> {
    if (!data.ids || data.ids.length === 0) {
      throwValidationError('请选择要审核的申请');
    }
    if (![OpeningType.PERSONAL, OpeningType.CORPORATE].includes(data.openingType)) {
      throwValidationError('无效的开户类型');
    }

    if (data.level === ReviewLevel.FINAL && !userRoles?.includes('admin')) {
      throwForbiddenError('仅管理员可批量终审');
    }

    const results: OpeningReviewBatchResultItem[] = [];
    const model: any = data.openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;

    for (const id of data.ids) {
      try {
        const opening = await model.findByPk(id);
        const openingNo = opening ? (opening as any).opening_no : id;

        const result = await this.submitReview({
          openingType: data.openingType,
          openingId: id,
          level: data.level,
          result: data.result,
          comment: data.comment,
          rejectReason: data.rejectReason
        }, reviewerId, userRoles);

        results.push({
          id,
          openingNo,
          success: true
        });
      } catch (e: any) {
        let openingNo = id;
        try {
          const opening = await model.findByPk(id);
          if (opening) openingNo = (opening as any).opening_no;
        } catch { /* ignore */ }

        results.push({
          id,
          openingNo,
          success: false,
          message: e.message || '审核失败'
        });
      }
    }

    return results;
  }

  async traceReview(params: ReviewTraceRequest): Promise<ReviewTraceVO> {
    const { openingNo, idCardNo, creditCode } = params;

    if (!openingNo && !idCardNo && !creditCode) {
      throwValidationError('请至少提供一个查询条件（流水号/证件号/信用代码）');
    }

    const openingList: any[] = [];
    const allOpeningIds: { openingType: number; openingId: string; openingNo: string }[] = [];

    const personalWhere: any = {};
    if (openingNo) personalWhere.opening_no = { [Op.like]: `%${openingNo}%` };
    if (idCardNo) personalWhere.id_card_no = { [Op.like]: `%${idCardNo}%` };
    if (creditCode) personalWhere.id = { [Op.eq]: '__exclude__' };

    if (Object.keys(personalWhere).length > 0 && !personalWhere.id) {
      const personalOpenings = await AccountOpening.findAll({
        where: personalWhere,
        include: [this.getSubmitterInclude(), this.getSubmitOrgInclude()],
        order: [['created_at', 'DESC']],
        limit: 50
      } as any);
      for (const o of personalOpenings) {
        const json = (o as any).toJSON();
        json._openingType = OpeningType.PERSONAL;
        openingList.push(json);
        allOpeningIds.push({
          openingType: OpeningType.PERSONAL,
          openingId: json.id,
          openingNo: json.opening_no
        });
      }
    }

    const corporateWhere: any = {};
    if (openingNo) corporateWhere.opening_no = { [Op.like]: `%${openingNo}%` };
    if (creditCode) corporateWhere.credit_code = { [Op.like]: `%${creditCode}%` };
    if (idCardNo) {
      corporateWhere[Op.or] = [
        { legal_id_card_no: { [Op.like]: `%${idCardNo}%` } },
        { agent_id_card_no: { [Op.like]: `%${idCardNo}%` } }
      ];
    }

    if (Object.keys(corporateWhere).length > 0) {
      const corporateOpenings = await CorporateAccountOpening.findAll({
        where: corporateWhere,
        include: [this.getSubmitterInclude(), this.getSubmitOrgInclude()],
        order: [['created_at', 'DESC']],
        limit: 50
      } as any);
      for (const o of corporateOpenings) {
        const json = (o as any).toJSON();
        json._openingType = OpeningType.CORPORATE;
        openingList.push(json);
        allOpeningIds.push({
          openingType: OpeningType.CORPORATE,
          openingId: json.id,
          openingNo: json.opening_no
        });
      }
    }

    openingList.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

    const allReviewLogs: ReviewLogVO[] = [];
    for (const info of allOpeningIds) {
      const logs = await this._getReviewLogs(info.openingType, info.openingId);
      allReviewLogs.push(...logs);
    }
    allReviewLogs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const consistencyReport = this._generateConsistencyReport(openingList, allReviewLogs);

    return {
      openingList: openingList.map(item => this._toReviewStage(item, item._openingType)),
      reviewLogs: allReviewLogs,
      consistencyReport
    };
  }

  private _generateConsistencyReport(
    openingList: any[],
    reviewLogs: ReviewLogVO[]
  ): ReviewTraceVO['consistencyReport'] {
    const totalReviewCount = reviewLogs.length;
    const conflictCount = reviewLogs.filter(l => l.conflictFlag === 1).length;
    const infoInconsistencies: string[] = [];
    const suggestions: string[] = [];

    if (openingList.length >= 2) {
      const personalOpenings = openingList.filter(o => o._openingType === OpeningType.PERSONAL);
      if (personalOpenings.length >= 2) {
        const names = new Set(personalOpenings.map((o: any) => o.customer_name));
        if (names.size > 1) {
          infoInconsistencies.push(`同一身份证号存在多个姓名记录：${Array.from(names).join('、')}`);
          suggestions.push('建议核实客户身份信息一致性');
        }
      }

      const corporateOpenings = openingList.filter(o => o._openingType === OpeningType.CORPORATE);
      if (corporateOpenings.length >= 2) {
        const names = new Set(corporateOpenings.map((o: any) => o.enterprise_name));
        if (names.size > 1) {
          infoInconsistencies.push(`同一信用代码存在多个企业名称：${Array.from(names).join('、')}`);
          suggestions.push('建议核实企业工商信息一致性');
        }

        const legalNames = new Set(
          corporateOpenings
            .map((o: any) => o.legal_representative)
            .filter(Boolean)
        );
        if (legalNames.size > 1) {
          infoInconsistencies.push(`同一企业法人姓名前后不一致：${Array.from(legalNames).join('、')}`);
          suggestions.push('建议核实法人变更记录');
        }
      }

      if (openingList.length >= 5) {
        const recent30 = openingList.filter((o: any) =>
          dayjs(o.created_at).isAfter(dayjs().subtract(30, 'day'))
        );
        if (recent30.length >= 5) {
          infoInconsistencies.push(`近30天内开户申请频次异常：${recent30.length}次`);
          suggestions.push('高频开户建议加强尽职调查');
        }
      }
    }

    const groupedByOpening = new Map<string, ReviewLogVO[]>();
    for (const log of reviewLogs) {
      const key = `${log.openingType}-${log.openingId}`;
      if (!groupedByOpening.has(key)) groupedByOpening.set(key, []);
      groupedByOpening.get(key)!.push(log);
    }

    for (const [key, logs] of groupedByOpening) {
      const approved = logs.filter(l => l.reviewResult === ReviewResult.APPROVED);
      const rejected = logs.filter(l => l.reviewResult === ReviewResult.REJECTED);
      if (approved.length > 0 && rejected.length > 0) {
        const no = logs[0].openingNo;
        infoInconsistencies.push(`申请[${no}]存在审核意见冲突：${approved.length}次通过/${rejected.length}次驳回`);
      }

      if (logs.length >= 2) {
        for (let i = 1; i < logs.length; i++) {
          const prev = logs[i - 1];
          const curr = logs[i];
          if (prev.riskLevelBefore !== undefined && curr.riskLevelBefore !== undefined) {
            if (Math.abs(curr.riskLevelBefore - prev.riskLevelBefore) >= 2) {
              infoInconsistencies.push(
                `申请[${logs[0].openingNo}]风险等级波动较大：` +
                `${RiskLevelText[prev.riskLevelBefore]} → ${RiskLevelText[curr.riskLevelBefore]}`
              );
              suggestions.push('建议核实风控模型稳定性');
              break;
            }
          }
        }
      }
    }

    if (conflictCount > 0) {
      suggestions.push(`存在${conflictCount}条审核冲突记录，建议人工复核`);
    }
    if (infoInconsistencies.length === 0) {
      suggestions.push('全链路数据一致性良好');
    }

    return {
      totalReviewCount,
      conflictCount,
      infoInconsistencies,
      suggestions
    };
  }

  _toReviewStage(item: any, type: number): OpeningReviewItemVO {
    const data: any = item.toJSON ? item.toJSON() : item;
    const openingType = type || data._openingType;
    const approvalLevel = this._getRequiredApprovalLevel(data.account_type, openingType);

    let reviewStage = ReviewStage.PENDING;
    let currentLevel = 1;
    let nextLevel = approvalLevel > 1 ? 2 : 0;

    if (data.status === 6) {
      reviewStage = ReviewStage.ALL_REJECTED;
      currentLevel = 0;
      nextLevel = 0;
    } else if (data.status === 7) {
      reviewStage = ReviewStage.CANCELLED;
      currentLevel = 0;
      nextLevel = 0;
    } else if (data.status === 4 || data.status === 5) {
      reviewStage = ReviewStage.FINAL_PASS;
      currentLevel = approvalLevel;
      nextLevel = 0;
    } else if (data.status === 3 || data.status === 2) {
      const logs = (data._reviewLogs as ReviewLogVO[]) || [];
      const approvals = logs.filter(l => l.reviewResult === ReviewResult.APPROVED).length;
      currentLevel = approvals + 1;

      if (approvals === 0) {
        reviewStage = ReviewStage.IN_REVIEW;
        nextLevel = approvalLevel > 1 ? 2 : 0;
      } else if (approvals === 1) {
        reviewStage = ReviewStage.FIRST_PASS;
        nextLevel = approvalLevel > 2 ? 3 : 0;
      } else if (approvals === 2) {
        reviewStage = ReviewStage.SECOND_PASS;
        nextLevel = approvalLevel > 3 ? 4 : 0;
      }
    }

    let materialsOk = false;
    let missingMaterials: string[] = [];
    if (openingType === OpeningType.PERSONAL) {
      const urls = data.image_urls ? data.image_urls.split(',').filter((u: string) => u.trim()) : [];
      materialsOk = urls.length >= 3;
      const required = REQUIRED_PERSONAL_MATERIALS;
      for (let i = 0; i < required.length; i++) {
        if (!urls[i]) missingMaterials.push(required[i].name);
      }
    } else {
      let materials: any[] = [];
      if (data.supporting_materials) {
        try {
          materials = typeof data.supporting_materials === 'string'
            ? JSON.parse(data.supporting_materials)
            : data.supporting_materials;
        } catch { materials = []; }
      }
      materialsOk = Array.isArray(materials) && materials.length >= 3;
      const required = REQUIRED_CORPORATE_MATERIALS;
      for (let i = 0; i < required.length; i++) {
        if (!materials[i]) missingMaterials.push(required[i].name);
      }
    }

    const customerName = openingType === OpeningType.PERSONAL
      ? data.customer_name
      : data.enterprise_name;
    const idCardNo = openingType === OpeningType.PERSONAL
      ? data.id_card_no
      : data.credit_code;

    return {
      id: data.id,
      openingType,
      openingNo: data.opening_no,
      customerName,
      idCardNo,
      accountTypeText: this._convertAccountType(openingType, data.account_type),
      riskLevelText: RiskLevelText[data.risk_level] || '未知',
      channelCode: data.channel_code,
      submitTime: data.submit_time ? dayjs(data.submit_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      submitterName: data.submitter?.real_name || data.submitter?.username,
      reviewStage,
      reviewStageText: ReviewStageText[reviewStage] || '未知',
      currentLevel: Math.min(currentLevel, approvalLevel),
      nextLevel,
      requiredLevel: approvalLevel,
      precheckPassed: data.precheck_result === 1,
      materialsUploaded: materialsOk,
      riskPrechecked: data.precheck_result === 1 && (data.risk_level || 0) <= 3,
      missingMaterials,
      hasConflict: (data._reviewLogs as ReviewLogVO[] || []).some(l => l.conflictFlag === 1),
      createdAt: data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : ''
    };
  }

  async _syncArchiveMaterials(openingType: number, openingId: string): Promise<void> {
    const model: any = openingType === OpeningType.PERSONAL ? AccountOpening : CorporateAccountOpening;
    const opening = await model.findByPk(openingId);
    if (!opening) return;

    const data: any = opening.toJSON();
    let archiveNote = `[自动归档] ${dayjs().format('YYYY-MM-DD HH:mm:ss')} 审核通过，资料已归档`;

    const existingRemark = data.remark || '';
    const newRemark = existingRemark
      ? `${existingRemark}\n${archiveNote}`
      : archiveNote;

    await model.update(
      { remark: newRemark } as any,
      { where: { id: openingId } }
    );
  }

  _checkPermission(level: number, roles: string[]): boolean {
    const isAdmin = roles.includes('admin');
    const isManager = roles.includes('manager') || isAdmin;
    const isOperator = roles.includes('operator') || isManager;

    switch (level) {
      case ReviewLevel.FIRST:
        return isOperator;
      case ReviewLevel.SECOND:
        return isManager;
      case ReviewLevel.FINAL:
        return isAdmin;
      default:
        return false;
    }
  }

  _convertAccountType(openingType: number, accountType: number): string {
    if (openingType === OpeningType.PERSONAL) {
      return PERSONAL_ACCOUNT_TYPE_TEXT[accountType] || '未知账户类型';
    }
    return CORPORATE_ACCOUNT_TYPE_TEXT[accountType] || '未知账户类型';
  }
}
