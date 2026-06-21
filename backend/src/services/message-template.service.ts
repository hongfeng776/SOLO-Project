import { Op } from 'sequelize';
import messageTemplateDao from '../dao/message-template.dao';
import messageTemplateLogDao from '../dao/message-template-log.dao';
import { NotFoundError, ForbiddenError, ParamError, ConflictError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import MessageTemplateModel from '../models/message-template.model';
import MessageTemplateLogModel from '../models/message-template-log.model';
import {
  UserRole,
  MessageTemplateScene,
  MessageTemplateStatus,
  MessageNotificationType,
  MessageRecipientType,
  MessagePushChannel,
  MessageTemplateLogAction,
  SCENE_TEMPLATE_FIELDS,
  SCENE_NOTIFICATION_TYPES,
  SCENE_RECIPIENT_TYPES,
  SCENE_PUSH_CHANNELS,
  MESSAGE_TEMPLATE_COMPLIANCE_KEYWORDS,
  MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGE_TITLE_MAX_LENGTH,
  DEFAULT_TEMPLATE_WEIGHT,
  TemplateFieldConfig,
} from '../constants/recruitment.enum';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
}

interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  violationKeywords: string[];
}

interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: { templateId: number; templateName: string; message: string }[];
}

interface SceneFieldConfig {
  scene: string;
  sceneLabel: string;
  notificationTypes: { value: string; label: string }[];
  recipientTypes: { value: string; label: string }[];
  pushChannels: { value: string; label: string }[];
  templateFields: TemplateFieldConfig[];
}

class MessageTemplateService {
  checkEditable(currentUser: CurrentUser): void {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('只有超级管理员可以编辑消息模板');
    }
  }

  async getList(params: any, currentUser: CurrentUser): Promise<IPaginationResult<MessageTemplateModel>> {
    return messageTemplateDao.getList(params);
  }

  async getById(id: number, currentUser: CurrentUser): Promise<MessageTemplateModel> {
    const template = await messageTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('消息模板不存在');
    }
    return template;
  }

  async getSceneConfigs(): Promise<SceneFieldConfig[]> {
    const scenes = Object.values(MessageTemplateScene);
    return scenes.map(scene => ({
      scene,
      sceneLabel: this.getSceneLabel(scene),
      notificationTypes: SCENE_NOTIFICATION_TYPES[scene as MessageTemplateScene].map(t => ({
        value: t,
        label: this.getNotificationTypeLabel(t),
      })),
      recipientTypes: SCENE_RECIPIENT_TYPES[scene as MessageTemplateScene].map(r => ({
        value: r,
        label: this.getRecipientTypeLabel(r),
      })),
      pushChannels: SCENE_PUSH_CHANNELS[scene as MessageTemplateScene].map(c => ({
        value: c,
        label: this.getPushChannelLabel(c),
      })),
      templateFields: SCENE_TEMPLATE_FIELDS[scene as MessageTemplateScene],
    }));
  }

  private getSceneLabel(scene: string): string {
    const labels: Record<string, string> = {
      [MessageTemplateScene.INTERVIEW]: '面试通知',
      [MessageTemplateScene.ONBOARD]: '入职通知',
      [MessageTemplateScene.APPROVAL]: '审批通知',
      [MessageTemplateScene.RISK_CONTROL]: '风控预警',
    };
    return labels[scene] || scene;
  }

  private getNotificationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      [MessageNotificationType.INFO]: '通知',
      [MessageNotificationType.REMINDER]: '提醒',
      [MessageNotificationType.WARNING]: '警告',
      [MessageNotificationType.EMERGENCY]: '紧急',
    };
    return labels[type] || type;
  }

  private getRecipientTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      [MessageRecipientType.CANDIDATE]: '候选人',
      [MessageRecipientType.INTERVIEWER]: '面试官',
      [MessageRecipientType.HR]: 'HR专员',
      [MessageRecipientType.ADMIN]: '管理员',
      [MessageRecipientType.DEPT_HEAD]: '部门负责人',
    };
    return labels[type] || type;
  }

  private getPushChannelLabel(channel: string): string {
    const labels: Record<string, string> = {
      [MessagePushChannel.SMS]: '短信',
      [MessagePushChannel.EMAIL]: '邮件',
      [MessagePushChannel.IN_APP]: '站内信',
      [MessagePushChannel.WECHAT]: '微信',
    };
    return labels[channel] || channel;
  }

  validateTemplate(data: any): ValidateResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    const violationKeywords: string[] = [];

    const { scene, templateName, templateCode, title, content, notificationType, recipientType, pushChannel, weight } = data;

    if (!scene) {
      errors.push('请选择业务场景');
    }
    if (!templateName || templateName.trim() === '') {
      errors.push('请输入模板名称');
    }
    if (!templateCode || templateCode.trim() === '') {
      errors.push('请输入模板编码');
    }
    if (!title || title.trim() === '') {
      errors.push('请输入消息标题');
    } else if (title.length > MESSAGE_TITLE_MAX_LENGTH) {
      errors.push(`消息标题不能超过${MESSAGE_TITLE_MAX_LENGTH}字`);
    }
    if (!content || content.trim() === '') {
      errors.push('请输入消息内容');
    } else if (content.length > MESSAGE_CONTENT_MAX_LENGTH) {
      errors.push(`消息内容不能超过${MESSAGE_CONTENT_MAX_LENGTH}字`);
    }
    if (!notificationType) {
      errors.push('请选择通知类型');
    }
    if (!recipientType) {
      errors.push('请选择接收对象');
    }
    if (!pushChannel) {
      errors.push('请选择推送渠道');
    }

    if (weight !== undefined && (weight < 0 || weight > 100)) {
      errors.push('推送权重必须在0-100之间');
    }

    if (scene) {
      const sceneFields = SCENE_TEMPLATE_FIELDS[scene as MessageTemplateScene] || [];
      const requiredFields = sceneFields.filter(f => f.required);

      for (const field of requiredFields) {
        const placeholder = `{{${field.key}}}`;
        if (!content || !content.includes(placeholder)) {
          missingFields.push(field.label);
        }
      }

      if (missingFields.length > 0) {
        errors.push(`缺少必填关键字段：${missingFields.join('、')}`);
      }

      const allowedNotificationTypes = SCENE_NOTIFICATION_TYPES[scene as MessageTemplateScene] || [];
      if (notificationType && !allowedNotificationTypes.includes(notificationType as MessageNotificationType)) {
        errors.push(`该场景不支持此通知类型`);
      }

      const allowedRecipientTypes = SCENE_RECIPIENT_TYPES[scene as MessageTemplateScene] || [];
      if (recipientType && !allowedRecipientTypes.includes(recipientType as MessageRecipientType)) {
        errors.push(`该场景不支持此接收对象`);
      }

      const allowedPushChannels = SCENE_PUSH_CHANNELS[scene as MessageTemplateScene] || [];
      if (pushChannel && !allowedPushChannels.includes(pushChannel as MessagePushChannel)) {
        errors.push(`该场景不支持此推送渠道`);
      }
    }

    const allTexts = `${title} ${content} ${templateName || ''}`;
    for (const keyword of MESSAGE_TEMPLATE_COMPLIANCE_KEYWORDS) {
      if (allTexts.includes(keyword)) {
        violationKeywords.push(keyword);
      }
    }

    if (violationKeywords.length > 0) {
      errors.push(`包含违规关键词：${violationKeywords.join('、')}`);
    }

    if (content && content.length > 200) {
      warnings.push('消息内容较长，建议精简以提升阅读体验');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingFields,
      violationKeywords,
    };
  }

  async checkDuplicate(id: number | null, templateCode: string): Promise<{ isDuplicate: boolean; message: string }> {
    const isDuplicate = await messageTemplateDao.checkDuplicateCode(id, templateCode);
    return {
      isDuplicate,
      message: isDuplicate ? '模板编码已存在，请使用其他编码' : '模板编码可用',
    };
  }

  async create(data: any, currentUser: CurrentUser): Promise<MessageTemplateModel> {
    this.checkEditable(currentUser);

    const validation = this.validateTemplate(data);
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    const duplicate = await this.checkDuplicate(null, data.templateCode);
    if (duplicate.isDuplicate) {
      throw new ConflictError(duplicate.message);
    }

    const templateData = {
      ...data,
      weight: data.weight || DEFAULT_TEMPLATE_WEIGHT,
      isComplianceChecked: validation.violationKeywords.length === 0,
      complianceIssues: validation.violationKeywords.length > 0 ? JSON.stringify(validation.violationKeywords) : undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.username,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    const template = await messageTemplateDao.create(templateData);

    await this.createLog(
      template.id,
      template.templateName,
      MessageTemplateLogAction.CREATE,
      currentUser,
      null,
      templateData,
      1,
      1,
      '创建消息模板'
    );

    return template;
  }

  async update(id: number, data: any, currentUser: CurrentUser): Promise<MessageTemplateModel> {
    this.checkEditable(currentUser);

    const template = await messageTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('消息模板不存在');
    }

    const validation = this.validateTemplate(data);
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    if (data.templateCode && data.templateCode !== template.templateCode) {
      const duplicate = await this.checkDuplicate(id, data.templateCode);
      if (duplicate.isDuplicate) {
        throw new ConflictError(duplicate.message);
      }
    }

    const oldData = template.toJSON();
    const newVersion = template.version + 1;

    const updateData = {
      ...data,
      version: newVersion,
      isComplianceChecked: validation.violationKeywords.length === 0,
      complianceIssues: validation.violationKeywords.length > 0 ? JSON.stringify(validation.violationKeywords) : undefined,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    await messageTemplateDao.updateById(id, updateData);

    const diffs = this.getFieldDiffs(oldData, updateData);
    const changedFields = diffs.map(d => d.field).join(',');

    await this.createLog(
      id,
      updateData.templateName || template.templateName,
      MessageTemplateLogAction.UPDATE,
      currentUser,
      oldData,
      updateData,
      template.version,
      newVersion,
      `修改模板：${changedFields || '无变更'}`,
      changedFields
    );

    const updatedTemplate = await messageTemplateDao.findById(id);
    return updatedTemplate!;
  }

  private getFieldDiffs(oldData: any, newData: any): FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const compareFields = [
      'templateName', 'templateCode', 'scene', 'notificationType',
      'recipientType', 'pushChannel', 'title', 'content', 'weight', 'remark',
    ];

    for (const field of compareFields) {
      if (oldData[field] !== newData[field]) {
        diffs.push({
          field,
          oldValue: oldData[field],
          newValue: newData[field],
        });
      }
    }

    return diffs;
  }

  async updateStatus(id: number, status: string, currentUser: CurrentUser, remark?: string): Promise<MessageTemplateModel> {
    this.checkEditable(currentUser);

    const template = await messageTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('消息模板不存在');
    }

    const oldStatus = template.templateStatus;
    if (oldStatus === status) {
      return template;
    }

    const statusAction = this.getStatusAction(status);
    const now = new Date();
    const updateData: any = {
      templateStatus: status,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    if (status === MessageTemplateStatus.ENABLED) {
      updateData.activatedAt = now;
      const validation = this.validateTemplate(template.toJSON());
      if (!validation.valid) {
        throw new ParamError(`模板验证失败，无法启用：${validation.errors.join('；')}`);
      }
    } else if (status === MessageTemplateStatus.DISABLED) {
      updateData.deactivatedAt = now;
    } else if (status === MessageTemplateStatus.TESTING) {
      updateData.lastTestedAt = now;
    }

    await messageTemplateDao.updateById(id, updateData);

    await this.createLog(
      id,
      template.templateName,
      statusAction,
      currentUser,
      { templateStatus: oldStatus },
      { templateStatus: status },
      template.version,
      template.version,
      remark || `${this.getStatusLabel(oldStatus)} → ${this.getStatusLabel(status)}`,
      undefined,
      oldStatus,
      status
    );

    const updatedTemplate = await messageTemplateDao.findById(id);
    return updatedTemplate!;
  }

  private getStatusAction(status: string): string {
    switch (status) {
      case MessageTemplateStatus.ENABLED:
        return MessageTemplateLogAction.ENABLE;
      case MessageTemplateStatus.DISABLED:
        return MessageTemplateLogAction.DISABLE;
      case MessageTemplateStatus.TESTING:
        return MessageTemplateLogAction.TEST;
      default:
        return MessageTemplateLogAction.UPDATE;
    }
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      [MessageTemplateStatus.ENABLED]: '已启用',
      [MessageTemplateStatus.DISABLED]: '已停用',
      [MessageTemplateStatus.TESTING]: '测试中',
    };
    return labels[status] || status;
  }

  async batchEnable(ids: number[], currentUser: CurrentUser): Promise<BatchResult> {
    return this.batchUpdateStatus(ids, MessageTemplateStatus.ENABLED, currentUser);
  }

  async batchDisable(ids: number[], currentUser: CurrentUser): Promise<BatchResult> {
    return this.batchUpdateStatus(ids, MessageTemplateStatus.DISABLED, currentUser);
  }

  async batchUpdateStatus(ids: number[], status: string, currentUser: CurrentUser): Promise<BatchResult> {
    this.checkEditable(currentUser);

    const templates = await messageTemplateDao.getByIds(ids);
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const now = new Date();
    const updateData: any = {
      templateStatus: status,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    if (status === MessageTemplateStatus.ENABLED) {
      updateData.activatedAt = now;
    } else if (status === MessageTemplateStatus.DISABLED) {
      updateData.deactivatedAt = now;
    } else if (status === MessageTemplateStatus.TESTING) {
      updateData.lastTestedAt = now;
    }

    const successIds: number[] = [];
    for (const template of templates) {
      try {
        if (status === MessageTemplateStatus.ENABLED) {
          const validation = this.validateTemplate(template.toJSON());
          if (!validation.valid) {
            throw new Error(validation.errors.join('；'));
          }
        }
        successIds.push(template.id);
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          templateId: template.id,
          templateName: template.templateName,
          message: err.message,
        });
      }
    }

    if (successIds.length > 0) {
      await messageTemplateDao.batchUpdateStatus(successIds, status, updateData);
      result.success = successIds.length;

      const action = status === MessageTemplateStatus.ENABLED
        ? MessageTemplateLogAction.BATCH_ENABLE
        : MessageTemplateLogAction.BATCH_DISABLE;

      for (const template of templates.filter(t => successIds.includes(t.id))) {
        await this.createLog(
          template.id,
          template.templateName,
          action,
          currentUser,
          { templateStatus: template.templateStatus },
          { templateStatus: status },
          template.version,
          template.version,
          `批量${status === MessageTemplateStatus.ENABLED ? '启用' : '停用'}`,
          undefined,
          template.templateStatus,
          status
        );
      }
    }

    return result;
  }

  async batchStandardize(ids: number[], currentUser: CurrentUser): Promise<BatchResult> {
    this.checkEditable(currentUser);

    const templates = await messageTemplateDao.getByIds(ids);
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const successIds: number[] = [];
    for (const template of templates) {
      try {
        const oldData = template.toJSON();
        let content = template.content;
        let title = template.title;

        content = content.replace(/\s+/g, ' ').trim();
        title = title.trim();

        const updateData: any = {
          title,
          content,
          version: template.version + 1,
          updatedBy: currentUser.id,
          updatedByName: currentUser.username,
        };

        await messageTemplateDao.updateById(template.id, updateData);
        successIds.push(template.id);

        await this.createLog(
          template.id,
          template.templateName,
          MessageTemplateLogAction.BATCH_STANDARDIZE,
          currentUser,
          oldData,
          updateData,
          template.version,
          template.version + 1,
          '批量标准化格式'
        );
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          templateId: template.id,
          templateName: template.templateName,
          message: err.message,
        });
      }
    }

    result.success = successIds.length;
    return result;
  }

  async batchAdjustWeight(ids: number[], weight: number, currentUser: CurrentUser): Promise<BatchResult> {
    this.checkEditable(currentUser);

    if (weight < 0 || weight > 100) {
      throw new ParamError('推送权重必须在0-100之间');
    }

    const templates = await messageTemplateDao.getByIds(ids);
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const updateData = {
      weight,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    const successIds = templates.map(t => t.id);
    await messageTemplateDao.batchUpdateWeight(successIds, weight);
    result.success = successIds.length;

    for (const template of templates) {
      await this.createLog(
        template.id,
        template.templateName,
        MessageTemplateLogAction.BATCH_ADJUST_WEIGHT,
        currentUser,
        { weight: template.weight },
        { weight },
        template.version,
        template.version,
        `批量调整权重：${template.weight} → ${weight}`,
        undefined,
        undefined,
        undefined,
        template.weight,
        weight
      );
    }

    return result;
  }

  async getTemplateLogs(params: any, currentUser: CurrentUser): Promise<IPaginationResult<MessageTemplateLogModel>> {
    return messageTemplateLogDao.getList(params);
  }

  async getTemplateLogsByTemplateId(templateId: number, currentUser: CurrentUser): Promise<IPaginationResult<MessageTemplateLogModel>> {
    const template = await messageTemplateDao.findById(templateId);
    if (!template) {
      throw new NotFoundError('消息模板不存在');
    }
    return messageTemplateLogDao.getByTemplateId(templateId);
  }

  private async createLog(
    templateId: number,
    templateName: string,
    action: string,
    currentUser: CurrentUser,
    oldValues: any | null,
    newValues: any | null,
    versionBefore: number,
    versionAfter: number,
    remark?: string,
    changedFields?: string,
    statusBefore?: string,
    statusAfter?: string,
    weightBefore?: number,
    weightAfter?: number
  ): Promise<MessageTemplateLogModel> {
    const logData = {
      templateId,
      templateName,
      action,
      changedFields: changedFields || '',
      oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
      newValues: newValues ? JSON.stringify(newValues) : undefined,
      versionBefore,
      versionAfter,
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
      operationRemark: remark,
      isComplianceChecked: true,
      statusBefore,
      statusAfter,
      weightBefore,
      weightAfter,
    };

    return messageTemplateLogDao.createLog(logData);
  }

  async testTemplate(id: number, testData: any, currentUser: CurrentUser): Promise<{ success: boolean; message: string; preview: string }> {
    const template = await messageTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('消息模板不存在');
    }

    let preview = template.content;
    const sceneFields = SCENE_TEMPLATE_FIELDS[template.scene as MessageTemplateScene] || [];

    for (const field of sceneFields) {
      const placeholder = `{{${field.key}}}`;
      const value = testData[field.key] || `[${field.label}]`;
      preview = preview.replace(new RegExp(placeholder, 'g'), value);
    }

    const titlePreview = template.title;

    await this.updateStatus(id, MessageTemplateStatus.TESTING, currentUser, '测试模板');

    return {
      success: true,
      message: '模板测试成功',
      preview: `${titlePreview}\n\n${preview}`,
    };
  }

  async getEnabledTemplatesByScene(scene: string): Promise<MessageTemplateModel[]> {
    return messageTemplateDao.getBySceneAndStatus(scene, MessageTemplateStatus.ENABLED);
  }

  async delete(id: number, currentUser: CurrentUser): Promise<void> {
    this.checkEditable(currentUser);

    const template = await messageTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('消息模板不存在');
    }

    await messageTemplateDao.destroyById(id);
  }
}

export default new MessageTemplateService();
