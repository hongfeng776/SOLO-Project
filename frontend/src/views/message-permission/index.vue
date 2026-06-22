<template>
  <div class="message-permission-page" ref="pageContainerRef">
    <PageContainer title="消息权限管理">
      <template #toolbar>
        <el-button type="primary" @click="handleAdd" v-if="isAdmin">
          <el-icon><Plus /></el-icon>
          <span>新建配置</span>
        </el-button>
        <el-button type="success" @click="handleBatchByRole" v-if="isAdmin">
          <el-icon><UserFilled /></el-icon>
          <span>按角色批量配置</span>
        </el-button>
        <el-button type="warning" @click="handleBatchByDept" v-if="isAdmin">
          <el-icon><OfficeBuilding /></el-icon>
          <span>按部门批量配置</span>
        </el-button>
        <el-button @click="handleBatchStandardize" v-if="isAdmin">
          <el-icon><MagicStick /></el-icon>
          <span>批量标准化</span>
        </el-button>
        <el-button type="danger" @click="handleBatchDisableRedundant" v-if="isAdmin">
          <el-icon><Close /></el-icon>
          <span>关闭冗余推送</span>
        </el-button>
        <el-button @click="handleViewLogs">
          <el-icon><Document /></el-icon>
          <span>变更记录</span>
        </el-button>
      </template>

      <div class="stats-cards">
        <el-card class="stats-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon total">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-label">总配置数</div>
              <div class="card-value">{{ permissionStats?.totalCount || 0 }}</div>
            </div>
          </div>
        </el-card>
        <el-card class="stats-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-label">全权接收</div>
              <div class="card-value text-success">{{ permissionStats?.fullReceiveCount || 0 }}</div>
            </div>
          </div>
        </el-card>
        <el-card class="stats-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon warning">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-label">部分接收</div>
              <div class="card-value text-warning">{{ permissionStats?.partialReceiveCount || 0 }}</div>
            </div>
          </div>
        </el-card>
        <el-card class="stats-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon danger">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-label">禁止接收</div>
              <div class="card-value text-danger">{{ permissionStats?.noReceiveCount || 0 }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <SearchForm :fields="searchFields" v-model="searchParams" @search="handleSearch" @reset="handleReset" />

      <ProTable
        :data="permissionList"
        :loading="loading"
        :pagination="pagination"
        :columns="tableColumns"
        :selectable="true"
        :highlight-current-row="true"
        :row-key="row => row.id"
        ref="tableRef"
        @selection-change="handleSelectionChange"
        @current-change="handleCurrentChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #userRole="{ row }">
          <el-tag :type="userRoleType[row.userRole] || 'info'" effect="light" size="small">
            {{ userRoleLabel[row.userRole] || row.userRole }}
          </el-tag>
        </template>
        <template #permissionStatus="{ row }">
          <el-tag
            :type="permissionStatusType[row.permissionStatus] || 'info'"
            effect="light"
            size="small"
          >
            {{ permissionStatusLabel[row.permissionStatus] || row.permissionStatus }}
          </el-tag>
        </template>
        <template #scenes="{ row }">
          <div class="scene-tags">
            <el-tag
              v-for="scene in parseScenes(row.allowedScenes, row.userRole)"
              :key="scene"
              type="primary"
              effect="plain"
              size="small"
            >
              {{ ROLE_MESSAGE_SCENE_LABELS[scene] || scene }}
            </el-tag>
          </div>
        </template>
        <template #blockedScenes="{ row }">
          <div class="scene-tags" v-if="row.blockedScenes">
            <el-tag
              v-for="scene in parseJSON(row.blockedScenes)"
              :key="scene"
              type="danger"
              effect="plain"
              size="small"
            >
              {{ ROLE_MESSAGE_SCENE_LABELS[scene] || scene }}
            </el-tag>
          </div>
          <span v-else class="text-muted">无</span>
        </template>
        <template #isEnabled="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'" effect="light" size="small">
            {{ row.isEnabled ? '已启用' : '已停用' }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            @click="handleEdit(row)"
            v-if="isAdmin"
          >
            编辑
          </el-button>
          <el-button
            :type="row.isEnabled ? 'warning' : 'success'"
            link
            size="small"
            @click="row.isEnabled ? handleDisable(row) : handleEnable(row)"
            v-if="isAdmin"
          >
            {{ row.isEnabled ? '停用' : '启用' }}
          </el-button>
          <el-button
            type="info"
            link
            size="small"
            @click="handleViewPermissionLogs(row)"
          >
            日志
          </el-button>
        </template>
      </ProTable>
    </PageContainer>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
      class="permission-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="permission-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户" prop="userId" required>
              <el-select
                v-model="formData.userId"
                placeholder="请选择用户"
                filterable
                remote
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                @change="handleUserChange"
                :disabled="isEdit"
                style="width: 100%"
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="`${user.username} (${user.realName || user.username})`"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="userRole">
              <el-select v-model="formData.userRole" placeholder="请选择角色" disabled style="width: 100%">
                <el-option
                  v-for="role in userRoleOptions"
                  :key="role.value"
                  :label="role.label"
                  :value="role.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-input
                v-model="formData.department"
                placeholder="请输入部门"
                :class="{ 'input-focus': inputFocus === 'department' }"
                @focus="inputFocus = 'department'"
                @blur="inputFocus = ''"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input
                v-model="formData.position"
                placeholder="请输入职位"
                :class="{ 'input-focus': inputFocus === 'position' }"
                @focus="inputFocus = 'position'"
                @blur="inputFocus = ''"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="权限状态" prop="permissionStatus">
          <el-radio-group v-model="formData.permissionStatus" @change="handlePermissionStatusChange">
            <el-radio-button value="full_receive">
              <el-icon><CircleCheck /></el-icon>
              <span>全权接收</span>
            </el-radio-button>
            <el-radio-button value="partial_receive">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>部分接收</span>
            </el-radio-button>
            <el-radio-button value="no_receive">
              <el-icon><CircleClose /></el-icon>
              <span>禁止接收</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-if="formData.permissionStatus !== 'no_receive'" class="scenes-section">
          <el-form-item label="允许场景" prop="allowedScenes">
            <el-checkbox-group v-model="allowedScenesList">
              <el-checkbox
                v-for="scene in getAvailableScenesForRole()"
                :key="scene.value"
                :label="scene.value"
              >
                {{ scene.label }}
              </el-checkbox>
            </el-checkbox-group>
            <el-alert
              v-if="formData.permissionStatus === 'partial_receive' && allowedScenesList.length === 0"
              type="warning"
              :closable="false"
              size="small"
              title="部分接收模式必须至少选择一个场景"
              show-icon
              style="margin-top: 8px"
            />
          </el-form-item>

          <el-form-item label="禁止场景">
            <el-checkbox-group v-model="blockedScenesList">
              <el-checkbox
                v-for="scene in getAvailableScenesForRole()"
                :key="scene.value"
                :label="scene.value"
              >
                {{ scene.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="禁止渠道">
            <el-checkbox-group v-model="blockedChannelsList">
              <el-checkbox
                v-for="channel in channelOptions"
                :key="channel.value"
                :label="channel.value"
              >
                {{ channel.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </div>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="查看敏感消息" prop="canViewSensitiveMessages">
              <el-switch v-model="formData.canViewSensitiveMessages" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="接收系统消息" prop="canReceiveSystemMessages">
              <el-switch v-model="formData.canReceiveSystemMessages" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="接收风控消息" prop="canReceiveRiskMessages">
              <el-switch v-model="formData.canReceiveRiskMessages" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效时间" prop="effectiveTime">
              <el-date-picker
                v-model="formData.effectiveTime"
                type="datetime"
                placeholder="选择生效时间"
                style="width: 100%"
                :class="{ 'input-focus': inputFocus === 'effectiveTime' }"
                @focus="inputFocus = 'effectiveTime'"
                @blur="inputFocus = ''"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expiryTime">
              <el-date-picker
                v-model="formData.expiryTime"
                type="datetime"
                placeholder="选择过期时间"
                style="width: 100%"
                :class="{ 'input-focus': inputFocus === 'expiryTime' }"
                @focus="inputFocus = 'expiryTime'"
                @blur="inputFocus = ''"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="每日限额" prop="messageQuota">
          <el-input-number
            v-model="formData.messageQuota"
            :min="0"
            :max="1000"
            placeholder="留空表示不限制"
            clearable
          />
          <span class="form-tip">每日最多接收消息数量，0表示不限制</span>
        </el-form-item>

        <el-form-item label="是否启用" prop="isEnabled">
          <el-switch v-model="formData.isEnabled" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
            :class="{ 'input-focus': inputFocus === 'remark' }"
            @focus="inputFocus = 'remark'"
            @blur="inputFocus = ''"
          />
        </el-form-item>

        <el-alert
          v-if="validationResult && !validationResult.valid"
          type="error"
          :closable="false"
          show-icon
        >
          <template #title>
            <div>配置校验失败</div>
          </template>
          <div v-for="(error, idx) in validationResult?.errors" :key="`e-${idx}`" class="error-item">
            · {{ error }}
          </div>
          <div v-for="(conflict, idx) in validationResult?.conflicts" :key="`c-${idx}`" class="conflict-item">
            ⚠️ {{ conflict }}
          </div>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleValidate" :loading="validating">校验配置</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchRoleDialogVisible"
      title="按角色批量配置"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="目标角色" required>
          <el-select v-model="batchRoleForm.userRole" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in userRoleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限状态">
          <el-select v-model="batchRoleForm.permissionStatus" placeholder="选择权限状态" clearable style="width: 100%">
            <el-option
              v-for="item in MESSAGE_PERMISSION_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="batchRoleForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBatchByRole" :loading="batchLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchDeptDialogVisible"
      title="按部门批量配置"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="目标部门" required>
          <el-input v-model="batchDeptForm.department" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="权限状态">
          <el-select v-model="batchDeptForm.permissionStatus" placeholder="选择权限状态" clearable style="width: 100%">
            <el-option
              v-for="item in MESSAGE_PERMISSION_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="batchDeptForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDeptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBatchByDept" :loading="batchLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="redundantDialogVisible"
      title="关闭冗余消息推送"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="关闭场景">
          <el-checkbox-group v-model="redundantForm.scenes">
            <el-checkbox label="interview">面试</el-checkbox>
            <el-checkbox label="onboard">入职</el-checkbox>
            <el-checkbox label="approval">审批</el-checkbox>
            <el-checkbox label="risk_control">风控</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="关闭渠道">
          <el-checkbox-group v-model="redundantForm.channels">
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="email">邮件</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="redundantDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRedundant" :loading="batchLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="logsDialogVisible"
      title="权限变更记录"
      width="900px"
    >
      <el-table :data="permissionLogs" :loading="logsLoading" border stripe>
        <el-table-column prop="action" label="操作类型" width="140">
          <template #default="{ row }">
            <el-tag type="info" effect="light" size="small">
              {{ MessagePermissionActionLabel[row.action as keyof typeof MessagePermissionActionLabel] || row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="目标用户" width="120" />
        <el-table-column prop="actionDetail" label="操作详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="operatorRole" label="操作人角色" width="100">
          <template #default="{ row }">
            <el-tag :type="userRoleType[row.operatorRole] || 'info'" effect="light" size="small">
              {{ userRoleLabel[row.operatorRole] || row.operatorRole }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180" />
        <el-table-column label="变更对比" width="80">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showLogDetail(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="logDetailVisible" title="变更详情" width="800px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="操作类型">
          {{ MessagePermissionActionLabel[currentLog.action as keyof typeof MessagePermissionActionLabel] || currentLog.action }}
        </el-descriptions-item>
        <el-descriptions-item label="操作详情">{{ currentLog.actionDetail }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operatorName }} ({{ currentLog.operatorRole }})</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.created_at }}</el-descriptions-item>
        <el-descriptions-item label="权限状态变更" v-if="currentLog.oldPermissionStatus || currentLog.newPermissionStatus">
          <span v-if="currentLog.oldPermissionStatus">{{ permissionStatusLabel[currentLog.oldPermissionStatus] || currentLog.oldPermissionStatus }}</span>
          <span v-if="currentLog.oldPermissionStatus && currentLog.newPermissionStatus"> → </span>
          <span v-if="currentLog.newPermissionStatus">{{ permissionStatusLabel[currentLog.newPermissionStatus] || currentLog.newPermissionStatus }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="变更字段" v-if="currentLog.changedFields">
          <el-tag
            v-for="field in parseJSON(currentLog.changedFields)"
            :key="field"
            size="small"
            type="info"
            effect="plain"
            style="margin-right: 4px"
          >
            {{ field }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="变更前值" v-if="currentLog.oldValues">
          <pre class="json-display">{{ formatJSON(currentLog.oldValues) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="变更后值" v-if="currentLog.newValues">
          <pre class="json-display">{{ formatJSON(currentLog.newValues) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-button
      v-if="showBackToTop"
      class="back-to-top-btn"
      type="primary"
      circle
      @click="scrollToTop"
    >
      <el-icon><Top /></el-icon>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, User, UserFilled, OfficeBuilding, MagicStick, Close, Document, CircleCheck, CircleCheckFilled, CircleClose, Top } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import {
  MessagePermissionStatus,
  MessagePermissionStatusLabel,
  MessagePermissionStatusType,
  MessagePermissionActionLabel,
  MESSAGE_PERMISSION_STATUS_OPTIONS,
  MESSAGE_PERMISSION_BATCH_LIMIT,
  ROLE_MESSAGE_SCENE_MAP,
  ROLE_MESSAGE_SCENE_LABELS,
  UserRole,
  MessageTemplateSceneLabel,
  MessagePushChannelLabel,
  type PermissionValidationResult,
  type BatchOperationResult,
  type MessagePermissionStats,
} from '../../constants/recruitment';
import {
  getPermissionList,
  getPermissionStats,
  getPermissionById,
  createPermission,
  updatePermission,
  enablePermission,
  disablePermission,
  validatePermissionConfig,
  batchUpdateByRole,
  batchUpdateByDepartment,
  batchStandardize,
  batchDisableRedundant,
  getPermissionLogsByPermissionId,
  type MessagePermissionData,
} from '../../api/message-permission';
import { getUserList } from '../../api/user';

const router = useRouter();
const userStore = useUserStore();

const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);

const pageContainerRef = ref<HTMLElement | null>(null);
const tableRef = ref<any>(null);
const formRef = ref<FormInstance>();

const loading = ref(false);
const submitting = ref(false);
const validating = ref(false);
const logsLoading = ref(false);
const batchLoading = ref(false);
const userSearchLoading = ref(false);

const searchParams = reactive({
  page: 1,
  pageSize: 20,
  userRole: '',
  department: '',
  permissionStatus: '',
  keyword: '',
  isEnabled: undefined as boolean | undefined,
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
});

const permissionList = ref<any[]>([]);
const permissionStats = ref<MessagePermissionStats | null>(null);
const selectedIds = ref<number[]>([]);
const currentRow = ref<any>(null);
const showBackToTop = ref(false);

const dialogVisible = ref(false);
const dialogTitle = ref('新建权限配置');
const isEdit = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive<Partial<MessagePermissionData>>({
  userId: undefined,
  username: '',
  userRole: '',
  department: '',
  position: '',
  permissionStatus: MessagePermissionStatus.FULL_RECEIVE,
  allowedScenes: JSON.stringify([]),
  blockedScenes: JSON.stringify([]),
  allowedChannels: JSON.stringify(['in_app', 'sms', 'email', 'wechat']),
  blockedChannels: JSON.stringify([]),
  allowedNotificationTypes: JSON.stringify([]),
  blockedNotificationTypes: JSON.stringify([]),
  canViewSensitiveMessages: false,
  canReceiveSystemMessages: true,
  canReceiveRiskMessages: false,
  messageQuota: undefined,
  effectiveTime: undefined,
  expiryTime: undefined,
  isEnabled: true,
  remark: '',
});

const allowedScenesList = ref<string[]>([]);
const blockedScenesList = ref<string[]>([]);
const blockedChannelsList = ref<string[]>([]);

const inputFocus = ref('');
const validationResult = ref<PermissionValidationResult | null>(null);

const batchRoleDialogVisible = ref(false);
const batchDeptDialogVisible = ref(false);
const redundantDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const logDetailVisible = ref(false);

const batchRoleForm = reactive({
  userRole: '',
  permissionStatus: '',
  remark: '',
});

const batchDeptForm = reactive({
  department: '',
  permissionStatus: '',
  remark: '',
});

const redundantForm = reactive({
  scenes: [] as string[],
  channels: [] as string[],
});

const permissionLogs = ref<any[]>([]);
const currentLog = ref<any>(null);

const userOptions = ref<any[]>([]);

const userRoleLabel: Record<string, string> = {
  admin: '超级管理员',
  hr: 'HR专员',
  interviewer: '面试官',
  dept_head: '部门负责人',
  recruiter: '招聘专员',
};

const userRoleType: Record<string, string> = {
  admin: 'danger',
  hr: 'primary',
  interviewer: 'success',
  dept_head: 'warning',
  recruiter: 'info',
};

const userRoleOptions = [
  { label: '超级管理员', value: 'admin' },
  { label: 'HR专员', value: 'hr' },
  { label: '面试官', value: 'interviewer' },
];

const channelOptions = [
  { label: '短信', value: 'sms' },
  { label: '邮件', value: 'email' },
  { label: '站内信', value: 'in_app' },
  { label: '微信', value: 'wechat' },
];

const permissionStatusLabel = MessagePermissionStatusLabel;
const permissionStatusType = MessagePermissionStatusType;

const formRules: FormRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  permissionStatus: [{ required: true, message: '请选择权限状态', trigger: 'change' }],
};

const searchFields = [
  { key: 'userRole', label: '角色', type: 'select', options: userRoleOptions },
  { key: 'permissionStatus', label: '权限状态', type: 'select', options: MESSAGE_PERMISSION_STATUS_OPTIONS },
  { key: 'department', label: '部门', type: 'input', placeholder: '请输入部门' },
  { key: 'keyword', label: '关键词', type: 'input', placeholder: '用户名/职位/备注' },
  { key: 'isEnabled', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '已启用', value: 'true' },
    { label: '已停用', value: 'false' },
  ]},
];

const tableColumns = [
  { key: 'id', label: 'ID', width: 70 },
  { key: 'username', label: '用户名', width: 120 },
  { key: 'userRole', label: '角色', width: 100, slot: 'userRole' },
  { key: 'department', label: '部门', width: 120 },
  { key: 'position', label: '职位', width: 120 },
  { key: 'permissionStatus', label: '权限状态', width: 100, slot: 'permissionStatus' },
  { key: 'scenes', label: '允许场景', minWidth: 200, slot: 'scenes' },
  { key: 'blockedScenes', label: '禁止场景', width: 150, slot: 'blockedScenes' },
  { key: 'isEnabled', label: '状态', width: 80, slot: 'isEnabled' },
  { key: 'created_at', label: '创建时间', width: 180 },
  { key: 'action', label: '操作', width: 180, slot: 'action', fixed: 'right' },
];

const fetchPermissionList = async () => {
  loading.value = true;
  try {
    const params: any = {
      ...searchParams,
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    };
    if (params.isEnabled === 'true') params.isEnabled = true;
    else if (params.isEnabled === 'false') params.isEnabled = false;

    const result = await getPermissionList(params);
    permissionList.value = result.rows || result.data?.rows || [];
    pagination.total = result.count || result.data?.count || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchPermissionStats = async () => {
  try {
    const result = await getPermissionStats();
    permissionStats.value = result.data || result;
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  fetchPermissionList();
};

const handleReset = () => {
  searchParams.userRole = '';
  searchParams.department = '';
  searchParams.permissionStatus = '';
  searchParams.keyword = '';
  searchParams.isEnabled = undefined;
  pagination.currentPage = 1;
  fetchPermissionList();
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  fetchPermissionList();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchPermissionList();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleCurrentChange = (row: any) => {
  currentRow.value = row;
};

const parseJSON = (str: string): any[] => {
  try {
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
};

const parseScenes = (allowedScenes: string, userRole: string): string[] => {
  if (formData.permissionStatus === MessagePermissionStatus.FULL_RECEIVE) {
    return ROLE_MESSAGE_SCENE_MAP[userRole] || [];
  }
  return parseJSON(allowedScenes);
};

const getAvailableScenesForRole = () => {
  const role = formData.userRole || 'hr';
  const scenes = ROLE_MESSAGE_SCENE_MAP[role] || [];
  return scenes.map((scene: string) => ({
    value: scene,
    label: ROLE_MESSAGE_SCENE_LABELS[scene] || scene,
  }));
};

const handleAdd = () => {
  isEdit.value = false;
  editingId.value = null;
  dialogTitle.value = '新建权限配置';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = async (row: any) => {
  isEdit.value = true;
  editingId.value = row.id;
  dialogTitle.value = '编辑权限配置';
  resetForm();

  try {
    const result = await getPermissionById(row.id);
    const data = result.data || result;

    Object.assign(formData, {
      userId: data.userId,
      username: data.username,
      userRole: data.userRole,
      department: data.department,
      position: data.position,
      permissionStatus: data.permissionStatus,
      allowedScenes: data.allowedScenes,
      blockedScenes: data.blockedScenes,
      allowedChannels: data.allowedChannels,
      blockedChannels: data.blockedChannels,
      allowedNotificationTypes: data.allowedNotificationTypes,
      blockedNotificationTypes: data.blockedNotificationTypes,
      canViewSensitiveMessages: data.canViewSensitiveMessages,
      canReceiveSystemMessages: data.canReceiveSystemMessages,
      canReceiveRiskMessages: data.canReceiveRiskMessages,
      messageQuota: data.messageQuota,
      effectiveTime: data.effectiveTime,
      expiryTime: data.expiryTime,
      isEnabled: data.isEnabled,
      remark: data.remark,
    });

    allowedScenesList.value = parseJSON(data.allowedScenes || '[]');
    blockedScenesList.value = parseJSON(data.blockedScenes || '[]');
    blockedChannelsList.value = parseJSON(data.blockedChannels || '[]');
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败');
    return;
  }

  dialogVisible.value = true;
};

const resetForm = () => {
  Object.assign(formData, {
    userId: undefined,
    username: '',
    userRole: '',
    department: '',
    position: '',
    permissionStatus: MessagePermissionStatus.FULL_RECEIVE,
    allowedScenes: JSON.stringify([]),
    blockedScenes: JSON.stringify([]),
    allowedChannels: JSON.stringify(['in_app', 'sms', 'email', 'wechat']),
    blockedChannels: JSON.stringify([]),
    allowedNotificationTypes: JSON.stringify([]),
    blockedNotificationTypes: JSON.stringify([]),
    canViewSensitiveMessages: false,
    canReceiveSystemMessages: true,
    canReceiveRiskMessages: false,
    messageQuota: undefined,
    effectiveTime: undefined,
    expiryTime: undefined,
    isEnabled: true,
    remark: '',
  });
  allowedScenesList.value = [];
  blockedScenesList.value = [];
  blockedChannelsList.value = [];
  validationResult.value = null;
  userOptions.value = [];
};

const searchUsers = async (query: string) => {
  if (!query) return;
  userSearchLoading.value = true;
  try {
    const result = await getUserList({ keyword: query, pageSize: 20 });
    userOptions.value = result.rows || result.data?.rows || [];
  } catch (error: any) {
    console.error('搜索用户失败:', error);
  } finally {
    userSearchLoading.value = false;
  }
};

const handleUserChange = async (userId: number) => {
  const user = userOptions.value.find(u => u.id === userId);
  if (user) {
    formData.username = user.username;
    formData.userRole = user.role;
    formData.department = user.department || '';
    formData.position = user.position || '';
    allowedScenesList.value = ROLE_MESSAGE_SCENE_MAP[user.role] || [];
    blockedScenesList.value = [];
    blockedChannelsList.value = [];
  }
};

const handlePermissionStatusChange = () => {
  validationResult.value = null;
  if (formData.permissionStatus === MessagePermissionStatus.FULL_RECEIVE && formData.userRole) {
    allowedScenesList.value = ROLE_MESSAGE_SCENE_MAP[formData.userRole] || [];
  }
};

const handleValidate = async () => {
  validating.value = true;
  try {
    const data = {
      ...formData,
      allowedScenes: JSON.stringify(allowedScenesList.value),
      blockedScenes: JSON.stringify(blockedScenesList.value),
      blockedChannels: JSON.stringify(blockedChannelsList.value),
    };
    const result = await validatePermissionConfig(data);
    validationResult.value = result.data || result;

    if (validationResult.value.valid) {
      ElMessage.success('配置校验通过');
    }
  } catch (error: any) {
    validationResult.value = {
      valid: false,
      errors: [error.message || '校验失败'],
      warnings: [],
      conflicts: [],
    };
  } finally {
    validating.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    ElMessage.warning('请完善表单信息');
    return;
  }

  const submitData = {
    ...formData,
    allowedScenes: JSON.stringify(allowedScenesList.value),
    blockedScenes: JSON.stringify(blockedScenesList.value),
    blockedChannels: JSON.stringify(blockedChannelsList.value),
  };

  submitting.value = true;
  try {
    if (isEdit.value && editingId.value) {
      await updatePermission(editingId.value, submitData);
      ElMessage.success('更新成功');
    } else {
      await createPermission(submitData as MessagePermissionData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleEnable = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定启用 [${row.username}] 的权限配置吗？`, '提示', {
      type: 'warning',
    });
    await enablePermission(row.id);
    ElMessage.success('启用成功');
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  }
};

const handleDisable = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定停用 [${row.username}] 的权限配置吗？`, '提示', {
      type: 'warning',
    });
    await disablePermission(row.id);
    ElMessage.success('停用成功');
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  }
};

const handleBatchByRole = () => {
  batchRoleForm.userRole = '';
  batchRoleForm.permissionStatus = '';
  batchRoleForm.remark = '';
  batchRoleDialogVisible.value = true;
};

const handleBatchByDept = () => {
  batchDeptForm.department = '';
  batchDeptForm.permissionStatus = '';
  batchDeptForm.remark = '';
  batchDeptDialogVisible.value = true;
};

const handleSubmitBatchByRole = async () => {
  if (!batchRoleForm.userRole) {
    ElMessage.warning('请选择目标角色');
    return;
  }
  batchLoading.value = true;
  try {
    const updateData: any = {};
    if (batchRoleForm.permissionStatus) {
      updateData.permissionStatus = batchRoleForm.permissionStatus;
    }
    if (batchRoleForm.remark) {
      updateData.remark = batchRoleForm.remark;
    }
    const result = await batchUpdateByRole(batchRoleForm.userRole, updateData);
    const data: BatchOperationResult = result.data || result;
    ElMessage.success(`批量操作完成：成功 ${data.successCount} 条，失败 ${data.failCount} 条`);
    if (data.errors.length > 0) {
      console.error('批量操作错误:', data.errors);
    }
    batchRoleDialogVisible.value = false;
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    ElMessage.error(error.message || '批量操作失败');
  } finally {
    batchLoading.value = false;
  }
};

const handleSubmitBatchByDept = async () => {
  if (!batchDeptForm.department) {
    ElMessage.warning('请输入目标部门');
    return;
  }
  batchLoading.value = true;
  try {
    const updateData: any = {};
    if (batchDeptForm.permissionStatus) {
      updateData.permissionStatus = batchDeptForm.permissionStatus;
    }
    if (batchDeptForm.remark) {
      updateData.remark = batchDeptForm.remark;
    }
    const result = await batchUpdateByDepartment(batchDeptForm.department, updateData);
    const data: BatchOperationResult = result.data || result;
    ElMessage.success(`批量操作完成：成功 ${data.successCount} 条，失败 ${data.failCount} 条`);
    if (data.errors.length > 0) {
      console.error('批量操作错误:', data.errors);
    }
    batchDeptDialogVisible.value = false;
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    ElMessage.error(error.message || '批量操作失败');
  } finally {
    batchLoading.value = false;
  }
};

const handleBatchStandardize = async () => {
  try {
    await ElMessageBox.confirm(
      '确定将所有权限配置重置为各角色默认配置吗？此操作不可恢复。',
      '批量标准化确认',
      { type: 'warning' }
    );
    batchLoading.value = true;
    const result = await batchStandardize();
    const data: BatchOperationResult = result.data || result;
    ElMessage.success(`批量标准化完成：成功 ${data.successCount} 条，失败 ${data.failCount} 条`);
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    batchLoading.value = false;
  }
};

const handleBatchDisableRedundant = () => {
  redundantForm.scenes = [];
  redundantForm.channels = [];
  redundantDialogVisible.value = true;
};

const handleSubmitRedundant = async () => {
  if (redundantForm.scenes.length === 0 && redundantForm.channels.length === 0) {
    ElMessage.warning('请至少选择一个场景或渠道');
    return;
  }
  batchLoading.value = true;
  try {
    const result = await batchDisableRedundant({
      scenes: redundantForm.scenes,
      channels: redundantForm.channels,
    });
    const data: BatchOperationResult = result.data || result;
    ElMessage.success(`批量关闭完成：成功 ${data.successCount} 条，失败 ${data.failCount} 条`);
    redundantDialogVisible.value = false;
    fetchPermissionList();
    fetchPermissionStats();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    batchLoading.value = false;
  }
};

const handleViewLogs = () => {
  if (currentRow.value) {
    handleViewPermissionLogs(currentRow.value);
  } else {
    ElMessage.warning('请先选择一条记录');
  }
};

const handleViewPermissionLogs = async (row: any) => {
  logsLoading.value = true;
  try {
    const result = await getPermissionLogsByPermissionId(row.id, 1, 50);
    permissionLogs.value = result.rows || result.data?.rows || [];
    logsDialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '获取日志失败');
  } finally {
    logsLoading.value = false;
  }
};

const showLogDetail = (row: any) => {
  currentLog.value = row;
  logDetailVisible.value = true;
};

const formatJSON = (str: string): string => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str || '';
  }
};

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  showBackToTop.value = scrollTop > 500;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch(allowedScenesList, (newVal) => {
  formData.allowedScenes = JSON.stringify(newVal);
}, { deep: true });

watch(blockedScenesList, (newVal) => {
  formData.blockedScenes = JSON.stringify(newVal);
}, { deep: true });

watch(blockedChannelsList, (newVal) => {
  formData.blockedChannels = JSON.stringify(newVal);
}, { deep: true });

onMounted(() => {
  fetchPermissionList();
  fetchPermissionStats();
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style lang="scss" scoped>
.message-permission-page {
  position: relative;
  min-height: 100vh;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  .stats-card {
    border-radius: 8px;

    .card-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;

        &.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        &.success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        &.warning {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        &.danger {
          background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        }
      }

      .card-info {
        .card-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 4px;
        }
        .card-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;

          &.text-success {
            color: #67c23a;
          }
          &.text-warning {
            color: #e6a23c;
          }
          &.text-danger {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

.scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.text-muted {
  color: #909399;
}

.permission-form {
  .input-focus {
    .el-input__wrapper {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
      border-color: #409eff !important;
      transition: all 0.3s ease;
    }
  }

  :deep(.el-radio-button__inner) {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .scenes-section {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .form-tip {
    color: #909399;
    font-size: 12px;
    margin-left: 8px;
  }

  .error-item {
    color: #f56c6c;
    font-size: 12px;
  }

  .conflict-item {
    color: #e6a23c;
    font-size: 12px;
  }
}

.back-to-top-btn {
  position: fixed;
  right: 40px;
  bottom: 40px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.json-display {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
}

:deep(.el-table__row.current-row) {
  background-color: #ecf5ff !important;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
