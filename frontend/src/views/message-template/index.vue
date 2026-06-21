<template>
  <div class="message-template-page">
    <PageContainer title="消息模板管理">
      <template #toolbar>
        <el-button type="primary" @click="handleAdd" v-if="isAdmin">
          <el-icon><Plus /></el-icon>
          <span>新建模板</span>
        </el-button>
        <el-button type="success" @click="handleBatchEnable" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><VideoPlay /></el-icon>
          <span>批量启用</span>
        </el-button>
        <el-button type="warning" @click="handleBatchDisable" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><VideoPause /></el-icon>
          <span>批量停用</span>
        </el-button>
        <el-button @click="handleBatchStandardize" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><MagicStick /></el-icon>
          <span>批量标准化</span>
        </el-button>
        <el-button @click="handleBatchAdjustWeight" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><Sort /></el-icon>
          <span>批量调权重</span>
        </el-button>
        <el-button @click="handleViewLogs">
          <el-icon><Document /></el-icon>
          <span>变更记录</span>
        </el-button>
      </template>

      <SearchForm :fields="searchFields" v-model="searchParams" @search="handleSearch" @reset="handleReset" />

      <div class="scene-tabs">
        <div
          v-for="tab in sceneTabs"
          :key="tab.value"
          class="scene-tab-item"
          :class="{ active: currentScene === tab.value }"
          @click="handleSceneChange(tab.value)"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
          <el-tag size="small" type="info" class="tab-count">{{ tab.count }}</el-tag>
        </div>
      </div>

      <ProTable
        :data="templateList"
        :loading="loading"
        :pagination="pagination"
        :columns="tableColumns"
        :selectable="true"
        :highlight-current-row="true"
        @selection-change="handleSelectionChange"
        @current-change="handleCurrentChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #scene="{ row }">
          <el-tag :type="sceneTagType[row.scene] || 'info'" effect="light" size="small">
            {{ sceneLabelMap[row.scene] || row.scene }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag
            :type="templateStatusType[row.templateStatus] || 'info'"
            effect="light"
            size="small"
            class="status-tag"
            :class="{ 'status-shake': row.shake }"
          >
            {{ templateStatusLabel[row.templateStatus] || row.templateStatus }}
          </el-tag>
        </template>
        <template #notificationType="{ row }">
          <el-tag :type="notificationTypeTagType[row.notificationType] || 'info'" effect="plain" size="small">
            {{ notificationTypeLabel[row.notificationType] || row.notificationType }}
          </el-tag>
        </template>
        <template #channel="{ row }">
          <div class="channel-list">
            <el-tooltip :content="pushChannelLabel[row.pushChannel] || row.pushChannel" placement="top">
              <el-icon class="channel-icon"><component :is="channelIconMap[row.pushChannel] || 'Bell'" /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <template #content="{ row }">
          <div class="content-preview" :class="{ 'long-content': row.content.length > 50 }">
            <el-tooltip v-if="row.content.length > 50" placement="top" :show-after="300">
              <template #content>
                <div class="tooltip-content">{{ row.content }}</div>
              </template>
              <span class="content-text">{{ row.content.slice(0, 50) }}...</span>
            </el-tooltip>
            <span v-else class="content-text">{{ row.content }}</span>
          </div>
        </template>
        <template #weight="{ row }">
          <div class="weight-display">
            <el-progress :percentage="row.weight" :stroke-width="6" :color="getWeightColor(row.weight)" :show-text="false" style="width: 60px" />
            <span class="weight-text">{{ row.weight }}</span>
          </div>
        </template>
        <template #compliance="{ row }">
          <el-tooltip :content="row.isComplianceChecked ? '合规校验通过' : '存在合规问题'" placement="top">
            <el-icon :color="row.isComplianceChecked ? '#67c23a' : '#f56c6c'" class="compliance-icon">
              <component :is="row.isComplianceChecked ? 'CircleCheckFilled' : 'WarningFilled'" />
            </el-icon>
          </el-tooltip>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="isAdmin">编辑</el-button>
          <el-button v-if="row.templateStatus === 'disabled' && isAdmin" type="success" link size="small" @click="handleToggleStatus(row, 'enabled')" class="action-btn">启用</el-button>
          <el-button v-else-if="row.templateStatus === 'enabled' && isAdmin" type="warning" link size="small" @click="handleToggleStatus(row, 'disabled')" class="action-btn">停用</el-button>
          <el-button v-if="row.templateStatus !== 'testing' && isAdmin" type="info" link size="small" @click="handleSetTesting(row)" class="action-btn">测试</el-button>
          <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button type="info" link size="small" @click="handleViewTemplateLogs(row)">日志</el-button>
        </template>
      </ProTable>
    </PageContainer>

    <el-dialog v-model="editDialogVisible" :title="isEdit ? '编辑消息模板' : '新建消息模板'" width="800px" class="zoom-dialog" :close-on-click-modal="false" @open="handleDialogOpen">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="template-form" :disabled="!isAdmin">
        <div class="form-section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>

        <el-form-item label="业务场景" prop="scene">
          <el-select v-model="formData.scene" placeholder="请选择业务场景" style="width: 100%" :disabled="isEdit" @change="handleSceneSelectChange">
            <el-option v-for="scene in sceneOptions" :key="scene.value" :label="scene.label" :value="scene.value" />
          </el-select>
          <div class="form-tip">选择场景后将自动匹配对应的通知类型、接收对象和推送渠道</div>
        </el-form-item>

        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="formData.templateName" placeholder="请输入模板名称" maxlength="50" show-word-limit :class="{ 'input-error': errorFields.includes('templateName') }" />
        </el-form-item>

        <el-form-item label="模板编码" prop="templateCode">
          <el-input v-model="formData.templateCode" placeholder="请输入模板编码（英文+数字）" maxlength="30" :disabled="isEdit" @blur="handleTemplateCodeBlur" :class="{ 'input-error': errorFields.includes('templateCode') }" />
          <div class="form-tip" v-if="codeCheckResult">
            <span :class="codeCheckResult.isDuplicate ? 'text-error' : 'text-success'">{{ codeCheckResult.message }}</span>
          </div>
        </el-form-item>

        <div class="form-section-title">
          <el-icon><Setting /></el-icon>
          <span>通知配置</span>
        </div>

        <el-form-item label="通知类型" prop="notificationType">
          <el-select v-model="formData.notificationType" placeholder="请选择通知类型" style="width: 100%">
            <el-option v-for="type in currentNotificationTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="接收对象" prop="recipientType">
          <el-select v-model="formData.recipientType" placeholder="请选择接收对象" style="width: 100%">
            <el-option v-for="type in currentRecipientTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="推送渠道" prop="pushChannel">
          <el-select v-model="formData.pushChannel" placeholder="请选择推送渠道" style="width: 100%">
            <el-option v-for="channel in currentPushChannels" :key="channel.value" :label="channel.label" :value="channel.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="推送权重">
          <el-slider v-model="formData.weight" :min="0" :max="100" :step="5" :show-tooltip="true" style="width: 80%" />
          <span class="weight-value">{{ formData.weight }}</span>
          <div class="form-tip">权重越高，优先级越靠前，默认50</div>
        </el-form-item>

        <div class="form-section-title">
          <el-icon><Edit /></el-icon>
          <span>消息内容</span>
        </div>

        <el-form-item label="消息标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入消息标题" :maxlength="MESSAGE_TITLE_MAX_LENGTH" show-word-limit :class="{ 'input-error': errorFields.includes('title') }" @input="handleContentInput" />
        </el-form-item>

        <el-form-item label="消息内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="6" placeholder="请输入消息内容，使用{{字段名}}作为变量占位符" :maxlength="MESSAGE_CONTENT_MAX_LENGTH" show-word-limit :class="{ 'input-error': errorFields.includes('content') }" @input="handleContentInput" />
          <div class="form-tip">
            可用变量：
            <span v-for="field in currentTemplateFields" :key="field.key" class="variable-tag" :class="{ required: field.required }" @click="insertVariable(field.key)" :title="field.description">
              {{ field.label }}
              <el-tag v-if="field.required" type="danger" size="small" class="required-tag">必填</el-tag>
            </span>
          </div>
        </el-form-item>

        <div class="form-section-title">
          <el-icon><View /></el-icon>
          <span>内容预览</span>
        </div>

        <div class="preview-section">
          <div class="preview-card">
            <div class="preview-title">{{ formData.title || '消息标题预览' }}</div>
            <div class="preview-content" v-html="renderPreviewContent()"></div>
          </div>
        </div>

        <div v-if="validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)" class="validation-section">
          <el-alert v-if="validationResult.errors.length > 0" :title="`检测到 ${validationResult.errors.length} 项错误`" type="error" :closable="false" show-icon class="validation-alert">
            <template #default>
              <div v-for="(err, idx) in validationResult.errors" :key="idx" class="validation-item error">
                <el-icon><CircleCloseFilled /></el-icon>
                <span>{{ err }}</span>
              </div>
            </template>
          </el-alert>
          <el-alert v-if="validationResult.warnings.length > 0" :title="`检测到 ${validationResult.warnings.length} 项警告`" type="warning" :closable="false" show-icon class="validation-alert">
            <template #default>
              <div v-for="(warn, idx) in validationResult.warnings" :key="idx" class="validation-item warning">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ warn }}</span>
              </div>
            </template>
          </el-alert>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="!canSubmit" @click="handleSubmit" class="submit-btn">
          {{ isEdit ? '保存修改' : '创建模板' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusConfirmVisible" title="状态确认" width="420px" class="zoom-dialog">
      <div class="confirm-content">
        <el-icon :size="32" :color="statusIconColor"><component :is="statusIcon" /></el-icon>
        <div class="confirm-text">
          <p>确定要将该模板 <strong>{{ statusActionLabel }}</strong> 吗？</p>
          <p class="tip" v-if="targetStatus === 'disabled'">停用后，该场景的消息推送将暂停使用此模板</p>
          <p class="tip" v-else-if="targetStatus === 'testing'">测试状态下，仅管理员可看到测试效果，不会正式推送业务消息</p>
          <p class="tip" v-else-if="targetStatus === 'enabled'">启用后，该模板将正式用于业务消息推送</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="statusConfirmVisible = false">取消</el-button>
        <el-button :type="statusButtonType" :loading="statusLoading" @click="confirmToggleStatus">
          确认{{ statusActionLabel }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="模板详情" width="650px" class="zoom-dialog">
      <el-descriptions v-if="currentTemplate" :column="2" border>
        <el-descriptions-item label="模板名称" :span="2">{{ currentTemplate.templateName }}</el-descriptions-item>
        <el-descriptions-item label="模板编码">{{ currentTemplate.templateCode }}</el-descriptions-item>
        <el-descriptions-item label="版本号">v{{ currentTemplate.version }}</el-descriptions-item>
        <el-descriptions-item label="业务场景">
          <el-tag size="small">{{ sceneLabelMap[currentTemplate.scene] || currentTemplate.scene }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模板状态">
          <el-tag :type="templateStatusType[currentTemplate.templateStatus]">
            {{ templateStatusLabel[currentTemplate.templateStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="通知类型">{{ notificationTypeLabel[currentTemplate.notificationType] || currentTemplate.notificationType }}</el-descriptions-item>
        <el-descriptions-item label="接收对象">{{ recipientTypeLabel[currentTemplate.recipientType] || currentTemplate.recipientType }}</el-descriptions-item>
        <el-descriptions-item label="推送渠道">{{ pushChannelLabel[currentTemplate.pushChannel] || currentTemplate.pushChannel }}</el-descriptions-item>
        <el-descriptions-item label="推送权重">
          <div class="weight-display-inline">
            <el-progress :percentage="currentTemplate.weight" :stroke-width="6" style="width: 80px" />
            <span>{{ currentTemplate.weight }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="合规校验">
          <el-icon :color="currentTemplate.isComplianceChecked ? '#67c23a' : '#f56c6c'">
            <component :is="currentTemplate.isComplianceChecked ? 'CircleCheckFilled' : 'WarningFilled'" />
          </el-icon>
          <span class="ml-2">{{ currentTemplate.isComplianceChecked ? '已通过' : '存在问题' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="消息标题" :span="2">{{ currentTemplate.title }}</el-descriptions-item>
        <el-descriptions-item label="消息内容" :span="2">
          <div class="detail-content">{{ currentTemplate.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="发送成功率">{{ currentTemplate.successRate !== undefined ? currentTemplate.successRate + '%' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="累计发送">{{ currentTemplate.sendCount || 0 }} 次</el-descriptions-item>
        <el-descriptions-item label="最近启用时间">{{ currentTemplate.activatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最近停用时间">{{ currentTemplate.deactivatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentTemplate.createdByName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新人">{{ currentTemplate.updatedByName || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail" v-if="isAdmin">编辑模板</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsDialogVisible" title="模板变更记录" width="900px" class="zoom-dialog">
      <div class="log-search-bar">
        <el-date-picker v-model="logSearchParams.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px" @change="handleLogSearch" />
        <el-select v-model="logSearchParams.action" placeholder="操作类型" clearable style="width: 160px" @change="handleLogSearch">
          <el-option label="全部" value="" />
          <el-option v-for="(label, key) in logActionLabel" :key="key" :label="label" :value="key" />
        </el-select>
        <el-input v-model="logSearchParams.operator" placeholder="操作人" clearable style="width: 160px" @keyup.enter="handleLogSearch" />
      </div>
      <div class="log-list-container">
        <el-table :data="templateLogList" height="400" style="width: 100%" v-loading="logsLoading">
          <el-table-column prop="created_at" label="操作时间" width="180" />
          <el-table-column prop="templateName" label="模板名称" width="160" />
          <el-table-column label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ logActionLabel[row.action] || row.action }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态变更" width="160">
            <template #default="{ row }">
              <span v-if="row.statusBefore && row.statusAfter">
                <el-tag size="small" type="info">{{ templateStatusLabel[row.statusBefore] }}</el-tag>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                <el-tag size="small" type="success">{{ templateStatusLabel[row.statusAfter] }}</el-tag>
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" />
          <el-table-column label="合规" width="80" align="center">
            <template #default="{ row }">
              <el-icon :color="row.isComplianceChecked ? '#67c23a' : '#e6a23c'">
                <component :is="row.isComplianceChecked ? 'CircleCheckFilled' : 'WarningFilled'" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showLogDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="logDetailVisible" title="变更详情" width="600px" append-to-body class="zoom-dialog">
        <div v-if="currentLog" class="log-detail">
          <div class="log-detail-item"><label>操作类型：</label><span>{{ logActionLabel[currentLog.action] || currentLog.action }}</span></div>
          <div class="log-detail-item"><label>操作人：</label><span>{{ currentLog.operatorName || '-' }}</span></div>
          <div class="log-detail-item"><label>操作人角色：</label><span>{{ userRoleLabel[currentLog.operatorRole] || currentLog.operatorRole || '-' }}</span></div>
          <div class="log-detail-item" v-if="currentLog.weightBefore !== undefined && currentLog.weightAfter !== undefined">
            <label>权重变更：</label><span>{{ currentLog.weightBefore }} → {{ currentLog.weightAfter }}</span>
          </div>
          <div class="log-compare" v-if="currentLog.oldValues || currentLog.newValues">
            <div class="log-compare-item log-old" v-if="currentLog.oldValues">
              <div class="log-compare-title">变更前 (v{{ currentLog.versionBefore || 0 }})</div>
              <pre>{{ formatJson(currentLog.oldValues) }}</pre>
            </div>
            <div class="log-compare-item log-new" v-if="currentLog.newValues">
              <div class="log-compare-title">变更后 (v{{ currentLog.versionAfter || 0 }})</div>
              <pre>{{ formatJson(currentLog.newValues) }}</pre>
            </div>
          </div>
          <div v-if="currentLog.operationRemark" class="log-detail-item">
            <label>操作备注：</label><span>{{ currentLog.operationRemark }}</span>
          </div>
        </div>
      </el-dialog>
    </el-dialog>

    <el-dialog v-model="batchWeightVisible" title="批量调整权重" width="450px" class="zoom-dialog">
      <el-form label-width="100px">
        <el-form-item label="选中数量">
          <el-tag type="info">已选择 {{ selectedIds.length }} 个模板</el-tag>
        </el-form-item>
        <el-form-item label="目标权重">
          <el-slider v-model="batchWeightValue" :min="0" :max="100" :step="5" :show-tooltip="true" style="width: 70%" />
          <span class="weight-value">{{ batchWeightValue }}</span>
        </el-form-item>
      </el-form>
      <div v-if="batchResult" class="batch-result">
        <el-alert :title="`批量操作完成：成功 ${batchResult.success} 个，失败 ${batchResult.failed} 个`" :type="batchResult.failed > 0 ? 'warning' : 'success'" :closable="false" show-icon>
          <template #default>
            <div v-if="batchResult.errors.length > 0" class="batch-errors">
              <div v-for="(err, idx) in batchResult.errors" :key="idx" class="batch-error-item">{{ err.templateName }}：{{ err.message }}</div>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="batchWeightVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="confirmBatchAdjustWeight">确认调整</el-button>
      </template>
    </el-dialog>

    <div class="success-toast" v-if="showSuccessCheck">
      <el-icon :size="48" color="#67c23a"><CircleCheckFilled /></el-icon>
      <span>操作成功</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, VideoPlay, VideoPause, MagicStick, Sort, Document,
  InfoFilled, Setting, Edit, View, CircleCheckFilled, CircleCloseFilled,
  WarningFilled, ArrowRight, Bell, Iphone, Message, ChatDotRound
} from '@element-plus/icons-vue';
import PageContainer from '@/components/PageContainer/index.vue';
import SearchForm from '@/components/SearchForm/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import { useUserStore } from '@/store/modules/user';
import {
  getMessageTemplateListApi,
  getMessageTemplateDetailApi,
  getSceneConfigsApi,
  validateTemplateApi,
  checkDuplicateTemplateApi,
  createMessageTemplateApi,
  updateMessageTemplateApi,
  enableTemplateApi,
  disableTemplateApi,
  setTestingTemplateApi,
  batchEnableTemplateApi,
  batchDisableTemplateApi,
  batchStandardizeTemplateApi,
  batchAdjustWeightApi,
  getTemplateLogsApi,
  getTemplateLogsByTemplateIdApi,
  type MessageTemplateItem,
  type MessageTemplateLogItem,
  type TemplateValidateResult,
  type BatchTemplateResult,
} from '@/api/message-template';
import {
  MessageTemplateScene,
  MessageTemplateSceneLabel,
  MessageTemplateStatus,
  MessageTemplateStatusLabel,
  MessageTemplateStatusType,
  MessageNotificationType,
  MessageNotificationTypeLabel,
  MessageRecipientType,
  MessageRecipientTypeLabel,
  MessagePushChannel,
  MessagePushChannelLabel,
  MessageTemplateLogAction,
  MessageTemplateLogActionLabel,
  MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGE_TITLE_MAX_LENGTH,
  DEFAULT_TEMPLATE_WEIGHT,
  UserRole,
  UserRoleLabel,
  type SceneFieldConfig,
  type TemplateFieldConfig,
} from '@/constants/recruitment';

const userStore = useUserStore();

const loading = ref(false);
const submitLoading = ref(false);
const statusLoading = ref(false);
const logsLoading = ref(false);
const batchLoading = ref(false);

const templateList = ref<MessageTemplateItem[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchParams = reactive({
  templateName: '',
  templateCode: '',
  scene: '',
  templateStatus: '',
  notificationType: '',
  pushChannel: '',
  isComplianceChecked: '',
  weightMin: undefined as number | undefined,
});

const currentScene = ref('');

const sceneTabs = computed(() => {
  const tabs = [
    { value: '', label: '全部', icon: 'Files', color: '#909399', count: pagination.total },
    { value: MessageTemplateScene.INTERVIEW, label: '面试通知', icon: 'ChatDotRound', color: '#409eff', count: getSceneCount(MessageTemplateScene.INTERVIEW) },
    { value: MessageTemplateScene.ONBOARD, label: '入职通知', icon: 'UserFilled', color: '#67c23a', count: getSceneCount(MessageTemplateScene.ONBOARD) },
    { value: MessageTemplateScene.APPROVAL, label: '审批通知', icon: 'Stamp', color: '#e6a23c', count: getSceneCount(MessageTemplateScene.APPROVAL) },
    { value: MessageTemplateScene.RISK_CONTROL, label: '风控预警', icon: 'Warning', color: '#f56c6c', count: getSceneCount(MessageTemplateScene.RISK_CONTROL) },
  ];
  return tabs;
});

function getSceneCount(scene: string): number {
  if (!templateList.value || templateList.value.length === 0) return 0;
  return templateList.value.filter(t => t.scene === scene).length;
}

const searchFields = [
  { key: 'templateName', label: '模板名称', type: 'input', placeholder: '请输入模板名称' },
  { key: 'templateCode', label: '模板编码', type: 'input', placeholder: '请输入模板编码' },
  { key: 'templateStatus', label: '模板状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '已启用', value: 'enabled' },
    { label: '已停用', value: 'disabled' },
    { label: '测试中', value: 'testing' },
  ]},
  { key: 'notificationType', label: '通知类型', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '通知', value: 'info' },
    { label: '提醒', value: 'reminder' },
    { label: '警告', value: 'warning' },
    { label: '紧急', value: 'emergency' },
  ]},
  { key: 'pushChannel', label: '推送渠道', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '短信', value: 'sms' },
    { label: '邮件', value: 'email' },
    { label: '站内信', value: 'in_app' },
    { label: '微信', value: 'wechat' },
  ]},
  { key: 'isComplianceChecked', label: '合规状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '已通过', value: 'true' },
    { label: '未通过', value: 'false' },
  ]},
];

const tableColumns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'templateName', label: '模板名称', width: 140, fixed: 'left' },
  { prop: 'scene', label: '业务场景', width: 110, slot: 'scene' },
  { prop: 'templateStatus', label: '状态', width: 90, slot: 'status' },
  { prop: 'notificationType', label: '通知类型', width: 90, slot: 'notificationType' },
  { prop: 'recipientType', label: '接收对象', width: 100 },
  { prop: 'pushChannel', label: '渠道', width: 60, slot: 'channel' },
  { prop: 'title', label: '消息标题', width: 150 },
  { prop: 'content', label: '消息内容', width: 220, slot: 'content' },
  { prop: 'weight', label: '权重', width: 110, slot: 'weight' },
  { prop: 'isComplianceChecked', label: '合规', width: 60, slot: 'compliance', align: 'center' },
  { prop: 'version', label: '版本', width: 70 },
  { prop: 'updatedByName', label: '更新人', width: 90 },
  { prop: 'updated_at', label: '更新时间', width: 170 },
  { label: '操作', width: 280, slot: 'action', fixed: 'right' },
];

const selectedIds = ref<number[]>([]);
const currentRow = ref<MessageTemplateItem | null>(null);

const sceneLabelMap = MessageTemplateSceneLabel;
const templateStatusLabel = MessageTemplateStatusLabel;
const templateStatusType = MessageTemplateStatusType;
const notificationTypeLabel = MessageNotificationTypeLabel;
const recipientTypeLabel = MessageRecipientTypeLabel;
const pushChannelLabel = MessagePushChannelLabel;
const logActionLabel = MessageTemplateLogActionLabel;
const userRoleLabel = UserRoleLabel;

const sceneTagType: Record<string, string> = {
  [MessageTemplateScene.INTERVIEW]: 'primary',
  [MessageTemplateScene.ONBOARD]: 'success',
  [MessageTemplateScene.APPROVAL]: 'warning',
  [MessageTemplateScene.RISK_CONTROL]: 'danger',
};

const notificationTypeTagType: Record<string, string> = {
  [MessageNotificationType.INFO]: 'info',
  [MessageNotificationType.REMINDER]: 'primary',
  [MessageNotificationType.WARNING]: 'warning',
  [MessageNotificationType.EMERGENCY]: 'danger',
};

const channelIconMap: Record<string, string> = {
  [MessagePushChannel.SMS]: 'Iphone',
  [MessagePushChannel.EMAIL]: 'Message',
  [MessagePushChannel.IN_APP]: 'Bell',
  [MessagePushChannel.WECHAT]: 'ChatDotRound',
};

const sceneOptions = computed(() => {
  return Object.entries(MessageTemplateSceneLabel).map(([value, label]) => ({ label, value }));
});

const sceneConfigs = ref<SceneFieldConfig[]>([]);

const currentSceneConfig = computed(() => {
  if (!formData.scene) return null;
  return sceneConfigs.value.find(c => c.scene === formData.scene) || null;
});

const currentNotificationTypes = computed(() => currentSceneConfig.value?.notificationTypes || []);
const currentRecipientTypes = computed(() => currentSceneConfig.value?.recipientTypes || []);
const currentPushChannels = computed(() => currentSceneConfig.value?.pushChannels || []);
const currentTemplateFields = computed(() => currentSceneConfig.value?.templateFields || []);

const editDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<any>(null);
const currentTemplate = ref<MessageTemplateItem | null>(null);

const formData = reactive({
  templateName: '',
  templateCode: '',
  scene: '',
  notificationType: '',
  recipientType: '',
  pushChannel: '',
  title: '',
  content: '',
  weight: DEFAULT_TEMPLATE_WEIGHT,
  remark: '',
});

const formRules = {
  scene: [{ required: true, message: '请选择业务场景', trigger: 'change' }],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  templateCode: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
  notificationType: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  recipientType: [{ required: true, message: '请选择接收对象', trigger: 'change' }],
  pushChannel: [{ required: true, message: '请选择推送渠道', trigger: 'change' }],
  title: [{ required: true, message: '请输入消息标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }],
};

const errorFields = ref<string[]>([]);
const codeCheckResult = ref<{ isDuplicate: boolean; message: string } | null>(null);
const validationResult = ref<TemplateValidateResult | null>(null);

const statusConfirmVisible = ref(false);
const targetStatus = ref<string>('');
const targetTemplateId = ref<number | null>(null);

const statusIcon = computed(() => {
  switch (targetStatus.value) {
    case 'enabled': return 'VideoPlay';
    case 'disabled': return 'VideoPause';
    case 'testing': return 'Cpu';
    default: return 'InfoFilled';
  }
});

const statusIconColor = computed(() => {
  switch (targetStatus.value) {
    case 'enabled': return '#67c23a';
    case 'disabled': return '#e6a23c';
    case 'testing': return '#909399';
    default: return '#909399';
  }
});

const statusButtonType = computed(() => {
  switch (targetStatus.value) {
    case 'enabled': return 'success';
    case 'disabled': return 'warning';
    case 'testing': return 'info';
    default: return 'primary';
  }
});

const statusActionLabel = computed(() => {
  switch (targetStatus.value) {
    case 'enabled': return '启用';
    case 'disabled': return '停用';
    case 'testing': return '设为测试';
    default: return '操作';
  }
});

const detailDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const logDetailVisible = ref(false);

const templateLogList = ref<MessageTemplateLogItem[]>([]);
const currentLog = ref<MessageTemplateLogItem | null>(null);
const logSearchParams = reactive({
  dateRange: [] as any,
  action: '',
  operator: '',
});

const batchWeightVisible = ref(false);
const batchWeightValue = ref(50);
const batchResult = ref<BatchTemplateResult | null>(null);

const showSuccessCheck = ref(false);

const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);

const canSubmit = computed(() => {
  if (!formData.scene) return false;
  if (!formData.templateName) return false;
  if (!formData.templateCode) return false;
  if (!formData.title) return false;
  if (!formData.content) return false;
  if (!formData.notificationType) return false;
  if (!formData.recipientType) return false;
  if (!formData.pushChannel) return false;
  if (validationResult.value && validationResult.value.errors.length > 0) return false;
  return true;
});

function getWeightColor(weight: number): string {
  if (weight >= 80) return '#67c23a';
  if (weight >= 50) return '#409eff';
  if (weight >= 30) return '#e6a23c';
  return '#909399';
}

function handleSceneChange(scene: string) {
  currentScene.value = scene;
  searchParams.scene = scene;
  pagination.page = 1;
  loadTemplateList();
}

async function loadTemplateList() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    };
    const result = await getMessageTemplateListApi(params);
    templateList.value = result.list;
    pagination.total = result.total;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function loadSceneConfigs() {
  try {
    const result = await getSceneConfigsApi();
    sceneConfigs.value = result;
  } catch (err: any) {
    console.error('加载场景配置失败', err);
  }
}

function handleSearch() {
  pagination.page = 1;
  loadTemplateList();
}

function handleReset() {
  searchParams.templateName = '';
  searchParams.templateCode = '';
  searchParams.scene = '';
  searchParams.templateStatus = '';
  searchParams.notificationType = '';
  searchParams.pushChannel = '';
  searchParams.isComplianceChecked = '';
  searchParams.weightMin = undefined;
  currentScene.value = '';
  pagination.page = 1;
  loadTemplateList();
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadTemplateList();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.page = 1;
  loadTemplateList();
}

function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map(r => r.id);
}

function handleCurrentChange(row: any) {
  currentRow.value = row;
}

async function handleAdd() {
  isEdit.value = false;
  resetForm();
  editDialogVisible.value = true;
  await loadSceneConfigs();
}

async function handleEdit(row: MessageTemplateItem) {
  isEdit.value = true;
  currentTemplate.value = row;
  await loadTemplateDetail(row.id);
  editDialogVisible.value = true;
}

function handleEditFromDetail() {
  detailDialogVisible.value = false;
  if (currentTemplate.value) {
    handleEdit(currentTemplate.value);
  }
}

async function loadTemplateDetail(id: number) {
  try {
    await loadSceneConfigs();
    const template = await getMessageTemplateDetailApi(id);
    currentTemplate.value = template;
    Object.assign(formData, {
      templateName: template.templateName,
      templateCode: template.templateCode,
      scene: template.scene,
      notificationType: template.notificationType,
      recipientType: template.recipientType,
      pushChannel: template.pushChannel,
      title: template.title,
      content: template.content,
      weight: template.weight,
      remark: template.remark || '',
    });
    validateTemplateContent();
  } catch (err: any) {
    ElMessage.error(err.message || '加载模板详情失败');
  }
}

function resetForm() {
  formData.templateName = '';
  formData.templateCode = '';
  formData.scene = '';
  formData.notificationType = '';
  formData.recipientType = '';
  formData.pushChannel = '';
  formData.title = '';
  formData.content = '';
  formData.weight = DEFAULT_TEMPLATE_WEIGHT;
  formData.remark = '';
  errorFields.value = [];
  codeCheckResult.value = null;
  validationResult.value = null;
}

function handleSceneSelectChange() {
  formData.notificationType = '';
  formData.recipientType = '';
  formData.pushChannel = '';
  validateTemplateContent();
}

async function handleTemplateCodeBlur() {
  if (!formData.templateCode) {
    codeCheckResult.value = null;
    return;
  }
  try {
    const result = await checkDuplicateTemplateApi(isEdit.value && currentTemplate.value ? currentTemplate.value.id : null, formData.templateCode);
    codeCheckResult.value = result;
  } catch (err: any) {
    console.error('校验编码失败', err);
  }
}

function handleContentInput() {
  validateTemplateContent();
}

async function validateTemplateContent() {
  if (!formData.scene) {
    validationResult.value = null;
    return;
  }
  try {
    const result = await validateTemplateApi(formData);
    validationResult.value = result;
    if (result.errors.length > 0) {
      errorFields.value = [];
      if (result.missingFields && result.missingFields.length > 0) {
        errorFields.value.push('content');
      }
    } else {
      errorFields.value = [];
    }
  } catch (err: any) {
    console.error('校验模板失败', err);
  }
}

function insertVariable(key: string) {
  const placeholder = `{{${key}}}`;
  formData.content += placeholder;
  nextTick(() => {
    validateTemplateContent();
  });
}

function renderPreviewContent(): string {
  if (!formData.content) return '<span class="preview-placeholder">消息内容预览区域</span>';
  let content = formData.content;
  for (const field of currentTemplateFields.value) {
    const placeholder = `{{${field.key}}}`;
    const value = `<span class="preview-variable">[${field.label}]</span>';
    content = content.replace(new RegExp(placeholder, 'g'), value);
  }
  return content;
}

async function handleSubmit() {
  if (!canSubmit.value) {
    triggerFormShake();
    return;
  }

  submitLoading.value = true;
  try {
    if (isEdit.value && currentTemplate.value) {
      await updateMessageTemplateApi(currentTemplate.value.id, formData);
      ElMessage.success('修改成功');
    } else {
      await createMessageTemplateApi(formData);
      ElMessage.success('创建成功');
    }

    showSuccessToast();
    editDialogVisible.value = false;
    loadTemplateList();
  } catch (err: any) {
    ElMessage.error(err.message || '提交失败');
    triggerFormShake();
  } finally {
    submitLoading.value = false;
  }
}

function triggerFormShake() {
  const dialog = document.querySelector('.template-form');
  if (dialog) {
    dialog.classList.add('form-shake');
    setTimeout(() => {
      dialog.classList.remove('form-shake');
    }, 500);
  }
}

function handleToggleStatus(row: MessageTemplateItem, status: string) {
  targetTemplateId.value = row.id;
  targetStatus.value = status;
  statusConfirmVisible.value = true;
}

function handleSetTesting(row: MessageTemplateItem) {
  targetTemplateId.value = row.id;
  targetStatus.value = 'testing';
  statusConfirmVisible.value = true;
}

async function confirmToggleStatus() {
  if (!targetTemplateId.value) return;
  statusLoading.value = true;
  try {
    if (targetStatus.value === 'enabled') {
      await enableTemplateApi(targetTemplateId.value);
      ElMessage.success('启用成功');
    } else if (targetStatus.value === 'disabled') {
      await disableTemplateApi(targetTemplateId.value);
      ElMessage.success('停用成功');
    } else if (targetStatus.value === 'testing') {
      await setTestingTemplateApi(targetTemplateId.value);
      ElMessage.success('已设置为测试状态');
    }
    showSuccessToast();
    statusConfirmVisible.value = false;
    loadTemplateList();
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败');
  } finally {
    statusLoading.value = false;
  }
}

function handleDetail(row: MessageTemplateItem) {
  currentTemplate.value = row;
  detailDialogVisible.value = true;
}

async function handleViewLogs() {
  logsLoading.value = true;
  try {
    const result = await getTemplateLogsApi({ page: 1, pageSize: 50 });
    templateLogList.value = result.list;
    logsDialogVisible.value = true;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

async function handleViewTemplateLogs(row: MessageTemplateItem) {
  logsLoading.value = true;
  try {
    const result = await getTemplateLogsByTemplateIdApi(row.id);
    templateLogList.value = result.list;
    logsDialogVisible.value = true;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

function handleLogSearch() {
  loadTemplateLogs();
}

async function loadTemplateLogs() {
  logsLoading.value = true;
  try {
    const params: any = { page: 1, pageSize: 50 };
    if (logSearchParams.action) {
      params.action = logSearchParams.action;
    }
    if (logSearchParams.operator) {
      params.operatorName = logSearchParams.operator;
    }
    const result = await getTemplateLogsApi(params);
    templateLogList.value = result.list;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

function showLogDetail(row: MessageTemplateLogItem) {
  currentLog.value = row;
  logDetailVisible.value = true;
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

async function handleBatchEnable() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的模板');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量启用选中的 ${selectedIds.value.length} 个模板吗？`,
      '批量启用确认',
      { type: 'success' }
    );
  } catch {
    return;
  }

  try {
    const result = await batchEnableTemplateApi(selectedIds.value);
    if (result.failed > 0) {
      ElMessage.warning(`批量启用完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
    } else {
      showSuccessToast();
      ElMessage.success('批量启用成功');
    }
    loadTemplateList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量操作失败');
  }
}

async function handleBatchDisable() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的模板');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量停用选中的 ${selectedIds.value.length} 个模板吗？停用后将暂停相关消息推送。`,
      '批量停用确认',
      { type: 'warning' }
    );
  } catch {
    return;
  }

  try {
    const result = await batchDisableTemplateApi(selectedIds.value);
    if (result.failed > 0) {
      ElMessage.warning(`批量停用完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
    } else {
      showSuccessToast();
      ElMessage.success('批量停用成功');
    }
    loadTemplateList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量操作失败');
  }
}

async function handleBatchStandardize() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的模板');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量标准化选中的 ${selectedIds.value.length} 个模板吗？将统一规范化内容格式。`,
      '批量标准化确认',
      { type: 'info' }
    );
  } catch {
    return;
  }

  try {
    const result = await batchStandardizeTemplateApi(selectedIds.value);
    if (result.failed > 0) {
      ElMessage.warning(`批量标准化完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
    } else {
      showSuccessToast();
      ElMessage.success('批量标准化成功');
    }
    loadTemplateList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量操作失败');
  }
}

function handleBatchAdjustWeight() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的模板');
    return;
  }
  batchWeightValue.value = 50;
  batchResult.value = null;
  batchWeightVisible.value = true;
}

async function confirmBatchAdjustWeight() {
  batchLoading.value = true;
  try {
    const result = await batchAdjustWeightApi(selectedIds.value, batchWeightValue.value);
    batchResult.value = result;
    if (result.failed === 0) {
      showSuccessToast();
    }
    loadTemplateList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量调整失败');
  } finally {
    batchLoading.value = false;
  }
}

function handleDialogOpen() {
  nextTick(() => {
    formRef.value?.clearValidate?.();
  });
}

function showSuccessToast() {
  showSuccessCheck.value = true;
  setTimeout(() => {
    showSuccessCheck.value = false;
  }, 1500);
}

onMounted(() => {
  loadTemplateList();
  loadSceneConfigs();
});
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.message-template-page {
  .zoom-dialog :deep(.el-dialog) {
    animation: dialogZoomIn 0.3s ease-out;
    transform-origin: center center;
  }

  @keyframes dialogZoomIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }

  .scene-tabs {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-base;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-light;

    .scene-tab-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-sm $spacing-base;
      border-radius: $border-radius;
      cursor: pointer;
      font-size: $font-size-sm;
      color: $text-secondary;
      background: $bg-light;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;

      &:hover {
        background: rgba($primary-color, 0.05);
        color: $text-primary;
        transform: translateY(-1px);
      }

      &.active {
        background: rgba($primary-color, 0.1);
        color: $primary-color;
        border-left-color: $primary-color;
        font-weight: 500;
      }

      .tab-count { margin-left: $spacing-xs; }
      .el-icon { font-size: 16px; }
    }
  }

  .template-form {
    .form-section-title {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin: $spacing-lg 0 $spacing-base 0;
      padding-bottom: $spacing-sm;
      border-bottom: 1px solid $border-light;
      &:first-of-type { margin-top: 0; }
      .el-icon { color: $primary-color; }
    }

    .form-tip {
      font-size: $font-size-xs;
      color: $text-placeholder;
      margin-top: $spacing-xs;
      &.text-success { color: $success-color; }
      &.text-error { color: $danger-color; }
    }

    .variable-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      margin: 2px 4px 2px 0;
      background: $bg-light;
      border: 1px solid $border-light;
      border-radius: $border-radius-sm;
      font-size: $font-size-xs;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba($primary-color, 0.1);
        border-color: $primary-color;
        color: $primary-color;
        transform: translateY(-1px);
      }

      &.required {
        border-color: rgba($danger-color, 0.3);
        background: rgba($danger-color, 0.05);
      }

      .required-tag { margin-left: 2px; }
    }

    .input-error :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px $danger-color inset;
      animation: inputShake 0.4s ease;
    }

    @keyframes inputShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }

    .form-shake { animation: formShake 0.5s ease; }

    @keyframes formShake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .weight-value {
      margin-left: $spacing-sm;
      font-weight: 600;
      color: $primary-color;
    }
  }

  .preview-section .preview-card {
    padding: $spacing-base;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
    border-radius: $border-radius;
    border: 1px solid $border-light;

    .preview-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }

    .preview-content {
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.6;
      white-space: pre-wrap;

      .preview-variable {
        display: inline;
        background: rgba($primary-color, 0.15);
        color: $primary-color;
        padding: 1px 4px;
        border-radius: $border-radius-sm;
        font-size: $font-size-xs;
      }

      .preview-placeholder {
        color: $text-placeholder;
        font-style: italic;
      }
    }
  }

  .validation-section {
    margin-top: $spacing-base;
    .validation-alert {
      margin-bottom: $spacing-xs;
      &:last-child { margin-bottom: 0; }
    }
    .validation-item {
      display: flex;
      align-items: flex-start;
      gap: $spacing-xs;
      margin-top: $spacing-xs;
      font-size: $font-size-sm;
      &.error { color: $danger-color; }
      &.warning { color: $warning-color; }
      .el-icon { flex-shrink: 0; margin-top: 2px; }
    }
  }

  .status-tag.status-shake { animation: tagShake 0.4s ease; }

  @keyframes tagShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }

  .content-preview .content-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: 1.4;
  }
  .content-preview.long-content { cursor: help; }

  .tooltip-content {
    max-width: 400px;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: $font-size-sm;
    line-height: 1.5;
  }

  .weight-display {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    .weight-text { font-size: $font-size-xs; color: $text-secondary; min-width: 24px; }
  }

  .weight-display-inline {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
  }

  .compliance-icon { font-size: 18px; }

  .channel-list .channel-icon { font-size: 18px; color: $text-secondary; }

  .action-btn {
    transition: all 0.2s ease;
    &:hover { transform: translateY(-1px); }
    &:active { transform: translateY(1px); }
  }

  .confirm-content {
    display: flex;
    align-items: flex-start;
    gap: $spacing-base;
    .confirm-text {
      flex: 1;
      p {
        margin: 0 0 $spacing-sm 0;
        color: $text-primary;
        &.tip { font-size: $font-size-sm; color: $text-secondary; }
      }
    }
  }

  .detail-content {
    line-height: 1.6;
    color: $text-primary;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
    padding: $spacing-sm;
    background: $bg-light;
    border-radius: $border-radius-sm;
  }

  .log-search-bar {
    display: flex;
    gap: $spacing-base;
    margin-bottom: $spacing-base;
  }

  .log-list-container .arrow-icon {
    margin: 0 4px;
    color: $text-placeholder;
    font-size: 12px;
  }

  .log-detail {
    .log-detail-item {
      display: flex;
      margin-bottom: $spacing-sm;
      label { width: 80px; flex-shrink: 0; color: $text-secondary; }
      span { flex: 1; color: $text-primary; }
    }

    .log-compare {
      display: flex;
      gap: $spacing-base;
      margin: $spacing-base 0;

      .log-compare-item {
        flex: 1;
        padding: $spacing-sm;
        border-radius: $border-radius-sm;

        &.log-old {
          background: rgba(230, 162, 60, 0.05);
          border-left: 3px solid $warning-color;
        }

        &.log-new {
          background: rgba(16, 185, 129, 0.05);
          border-left: 3px solid $success-color;
        }

        .log-compare-title {
          font-size: $font-size-sm;
          font-weight: 500;
          color: $text-secondary;
          margin-bottom: $spacing-xs;
        }

        pre {
          margin: 0;
          padding: $spacing-xs;
          background: $bg-white;
          border-radius: $border-radius-sm;
          font-size: $font-size-xs;
          max-height: 200px;
          overflow: auto;
          white-space: pre-wrap;
        }
      }
    }
  }

  .batch-result {
    margin-top: $spacing-base;
    .batch-errors {
      margin-top: $spacing-sm;
      .batch-error-item {
        font-size: $font-size-xs;
        color: $text-secondary;
        margin-bottom: $spacing-xs;
      }
    }
  }

  .success-toast {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xl $spacing-2xl;
    background: rgba(0, 0, 0, 0.7);
    border-radius: $border-radius-lg;
    color: $bg-white;
    animation: fadeInScale 0.3s ease-out;
  }

  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
}
</style>
