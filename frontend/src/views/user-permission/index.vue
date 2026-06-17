<template>
  <div class="user-permission-page">
    <PageContainer title="账号权限管理">
      <template #toolbar>
        <el-button type="primary" @click="handleAdd" v-if="canManage">
          <el-icon><Plus /></el-icon>
          <span>新建子账号</span>
        </el-button>
        <el-button type="warning" @click="handleBatchFreeze" :disabled="selectedIds.length === 0" v-if="canManage">
          <el-icon><Lock /></el-icon>
          <span>批量冻结</span>
        </el-button>
        <el-button @click="handleBatchAssign" :disabled="selectedIds.length === 0" v-if="canManage">
          <el-icon><Setting /></el-icon>
          <span>批量分配权限</span>
        </el-button>
        <el-button @click="handleViewPermissionLogs">
          <el-icon><Document /></el-icon>
          <span>权限日志</span>
        </el-button>
        <el-button @click="handleViewLoginLogs">
          <el-icon><Monitor /></el-icon>
          <span>登录日志</span>
        </el-button>
      </template>

      <SearchForm :fields="searchFields" v-model="searchParams" @search="handleSearch" @reset="handleReset" />

      <div class="anomaly-banner" v-if="anomalyCount > 0" @click="showOnlyAnomaly = !showOnlyAnomaly">
        <el-icon><WarningFilled /></el-icon>
        <span>检测到 <strong>{{ anomalyCount }}</strong> 个异常登录账号，点击查看</span>
        <el-icon class="arrow-icon"><ArrowDown v-if="!showOnlyAnomaly" /><ArrowUp v-else /></el-icon>
      </div>

      <ProTable
        :data="userList"
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
        <template #accountStatus="{ row }">
          <el-tag :type="accountStatusType[row.accountStatus]" effect="light">
            {{ accountStatusLabel[row.accountStatus] }}
          </el-tag>
        </template>

        <template #role="{ row }">
          <el-tag size="small">{{ userRoleLabel[row.role as keyof typeof userRoleLabel] || row.role }}</el-tag>
        </template>

        <template #anomaly="{ row }">
          <div class="anomaly-cell">
            <el-icon v-if="row.isAnomalyLogin" color="#e6a23c" class="pulse-icon">
              <WarningFilled />
            </el-icon>
            <el-tooltip v-if="row.isAnomalyLogin && row.anomalyReason" :content="row.anomalyReason" placement="top">
              <span class="anomaly-text">异常</span>
            </el-tooltip>
            <span v-else-if="!row.isAnomalyLogin" class="normal-text">正常</span>
          </div>
        </template>

        <template #operationCount="{ row }">
          <span>{{ row.operationCount || 0 }}</span>
        </template>

        <template #remark="{ row }">
          <el-tooltip v-if="row.remark && row.remark.length > 15" :content="row.remark" placement="top">
            <span class="remark-text">{{ row.remark.slice(0, 15) }}...</span>
          </el-tooltip>
          <span v-else>{{ row.remark || '-' }}</span>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.accountStatus === 'normal'"
            type="warning"
            link
            size="small"
            @click="handleFreeze(row)"
          >
            冻结
          </el-button>
          <el-button
            v-else-if="row.accountStatus === 'frozen'"
            type="success"
            link
            size="small"
            @click="handleUnfreeze(row)"
          >
            解冻
          </el-button>
          <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button type="info" link size="small" @click="handleViewUserLogs(row)">日志</el-button>
        </template>
      </ProTable>
    </PageContainer>

    <el-dialog
      v-model="editDialogVisible"
      :title="isEdit ? '编辑账号' : '新建子账号'"
      width="720px"
      class="zoom-dialog"
      :close-on-click-modal="false"
      @open="handleDialogOpen"
    >
      <el-alert
        v-if="!qualificationApproved && !isEdit"
        title="企业资质未通过审核，无法创建子账号"
        type="error"
        :closable="false"
        show-icon
        class="qualification-alert"
      />

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="account-form"
        :disabled="(!qualificationApproved && !isEdit) || submitting"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username" :ref="(el: any) => setFieldRef('username', el)">
              <el-input
                v-model="formData.username"
                placeholder="请输入用户名"
                @blur="handleUsernameBlur"
                @focus="handleInputFocus('username')"
                :class="{ 'shake-animation': shakeFields.username }"
              />
              <div class="field-error" v-if="fieldErrors.username">{{ fieldErrors.username }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password" v-if="!isEdit">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                show-password
                @focus="handleInputFocus('password')"
                @blur="handleInputBlur('password')"
                :class="{ 'shake-animation': shakeFields.password }"
              />
              <div class="field-hint">密码需8位以上，包含大小写字母和数字</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input
                v-model="formData.realName"
                placeholder="请输入真实姓名"
                @focus="handleInputFocus('realName')"
                @blur="handleInputBlur('realName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
                @focus="handleInputFocus('phone')"
                @blur="handleInputBlur('phone')"
                :class="{ 'shake-animation': shakeFields.phone }"
              />
              <div class="field-error" v-if="fieldErrors.phone">{{ fieldErrors.phone }}</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                @focus="handleInputFocus('email')"
                @blur="handleInputBlur('email')"
                :class="{ 'shake-animation': shakeFields.email }"
              />
              <div class="field-error" v-if="fieldErrors.email">{{ fieldErrors.email }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号角色" prop="role">
              <el-select
                v-model="formData.role"
                placeholder="请选择角色"
                style="width: 100%"
                @change="handleRoleChange"
              >
                <el-option
                  v-for="opt in roleOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门" prop="department">
              <el-input
                v-model="formData.department"
                placeholder="请输入所属部门"
                @focus="handleInputFocus('department')"
                @blur="handleInputBlur('department')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input
                v-model="formData.position"
                placeholder="请输入职位"
                @focus="handleInputFocus('position')"
                @blur="handleInputBlur('position')"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据范围" prop="dataScope">
              <el-select
                v-model="formData.dataScope"
                placeholder="请选择数据范围"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in dataScopeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expireAt">
              <el-date-picker
                v-model="formData.expireAt"
                type="datetime"
                placeholder="选择过期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="操作权限">
          <div class="permission-list">
            <el-tag
              v-for="perm in currentRolePermissions"
              :key="perm"
              size="small"
              type="info"
              effect="plain"
              class="perm-tag"
            >
              {{ formatPermission(perm) }}
            </el-tag>
          </div>
          <div class="form-tip">选择角色后自动匹配对应操作权限</div>
        </el-form-item>

        <el-form-item label="账号备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入账号备注（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="(!qualificationApproved && !isEdit) || !canSubmit"
          @click="handleSubmit"
        >
          {{ isEdit ? '保存修改' : '创建账号' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="statusConfirmVisible"
      title="状态确认"
      width="420px"
      class="zoom-dialog"
    >
      <div class="confirm-content">
        <el-icon :size="32" color="#e6a23c"><Lock /></el-icon>
        <div class="confirm-text">
          <p>确定要将该账号 <strong>{{ targetAction === 'freeze' ? '冻结' : '解冻' }}</strong> 吗？</p>
          <p class="tip" v-if="targetAction === 'freeze'">冻结后账号将无法登录且所有操作权限被锁定</p>
          <p class="tip" v-else>解冻后账号将恢复正常登录和操作权限</p>
        </div>
      </div>
      <el-form v-if="targetAction === 'freeze'" label-width="80px" class="freeze-reason-form">
        <el-form-item label="备注">
          <el-input
            v-model="freezeRemark"
            type="textarea"
            :rows="2"
            placeholder="请输入冻结原因（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusConfirmVisible = false">取消</el-button>
        <el-button
          :type="targetAction === 'freeze' ? 'warning' : 'success'"
          :loading="statusLoading"
          @click="confirmStatusChange"
        >
          确认{{ targetAction === 'freeze' ? '冻结' : '解冻' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="账号详情"
      width="640px"
      class="zoom-dialog"
    >
      <el-descriptions v-if="currentUser" :column="2" border>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag>{{ userRoleLabel[currentUser.role as keyof typeof userRoleLabel] || currentUser.role }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="accountStatusType[currentUser.accountStatus]">
            {{ accountStatusLabel[currentUser.accountStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ currentUser.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ currentUser.position || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数据范围">{{ dataScopeLabel[currentUser.dataScope as keyof typeof dataScopeLabel] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ currentUser.expireAt || '永久有效' }}</el-descriptions-item>
        <el-descriptions-item label="操作次数">{{ currentUser.operationCount || 0 }} 次</el-descriptions-item>
        <el-descriptions-item label="登录次数">{{ currentUser.loginCount || 0 }} 次</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ currentUser.lastLoginTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录IP">{{ currentUser.lastLoginIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="异常登录">
          <el-tag v-if="currentUser.isAnomalyLogin" type="warning">是</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentUser.created_at }}</el-descriptions-item>
        <el-descriptions-item label="账号备注" :span="2">
          <div class="detail-remark">{{ currentUser.remark || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchAssignVisible"
      title="批量分配权限"
      width="500px"
      class="zoom-dialog"
    >
      <el-alert
        :title="`将为选中的 ${selectedIds.length} 个账号分配权限`"
        type="info"
        :closable="false"
        show-icon
        class="batch-alert"
      />
      <el-form label-width="100px" class="batch-form">
        <el-form-item label="账号角色">
          <el-select v-model="batchAssignData.role" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="opt in roleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="batchAssignData.dataScope" placeholder="请选择数据范围" style="width: 100%">
            <el-option
              v-for="opt in dataScopeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="batchResult" class="batch-result">
        <el-alert
          :title="`操作完成：成功 ${batchResult.success} 个，失败 ${batchResult.failed} 个`"
          :type="batchResult.failed > 0 ? 'warning' : 'success'"
          :closable="false"
          show-icon
        />
      </div>
      <template #footer>
        <el-button @click="batchAssignVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="confirmBatchAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="logsDialogVisible"
      :title="logsDialogTitle"
      width="900px"
      class="zoom-dialog"
    >
      <div class="log-tabs">
        <div
          :class="['log-tab', { active: activeLogTab === 'permission' }]"
          @click="activeLogTab = 'permission'"
        >
          权限变更日志
        </div>
        <div
          :class="['log-tab', { active: activeLogTab === 'login' }]"
          @click="activeLogTab = 'login'"
        >
          登录日志
        </div>
      </div>

      <div v-show="activeLogTab === 'permission'" class="log-content">
        <div class="log-search">
          <el-date-picker
            v-model="permissionLogSearch.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            style="width: 260px"
          />
          <el-input
            v-model="permissionLogSearch.keyword"
            placeholder="操作人/用户名"
            clearable
            size="small"
            style="width: 180px"
          />
          <el-button type="primary" size="small" @click="loadPermissionLogs">查询</el-button>
        </div>
        <el-table :data="permissionLogs" height="380" v-loading="logsLoading">
          <el-table-column prop="created_at" label="操作时间" width="170" />
          <el-table-column prop="username" label="用户" width="110" />
          <el-table-column label="操作类型" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ permissionLogActionLabel[row.action as keyof typeof permissionLogActionLabel] || row.action }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="changeType" label="变更类型" width="120" />
          <el-table-column prop="operatorName" label="操作人" width="90" />
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showPermissionLogDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-show="activeLogTab === 'login'" class="log-content">
        <div class="log-search">
          <el-date-picker
            v-model="loginLogSearch.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            style="width: 260px"
          />
          <el-select v-model="loginLogSearch.status" placeholder="登录状态" size="small" clearable style="width: 120px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="异常" value="anomaly" />
          </el-select>
          <el-button type="primary" size="small" @click="loadLoginLogs">查询</el-button>
        </div>
        <el-table :data="loginLogs" height="380" v-loading="logsLoading">
          <el-table-column prop="loginTime" label="登录时间" width="170" />
          <el-table-column prop="username" label="用户名" width="110" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="loginStatusType[row.status as keyof typeof loginStatusType]" size="small">
                {{ loginStatusLabel[row.status as keyof typeof loginStatusLabel] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="loginIp" label="登录IP" width="130" />
          <el-table-column prop="loginLocation" label="登录地点" width="120" />
          <el-table-column prop="loginDevice" label="登录设备" width="140">
            <template #default="{ row }">
              <el-tooltip :content="row.userAgent || '-'">
                <span>{{ row.loginDevice || '-' }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="异常" width="70" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.isAnomaly" color="#e6a23c"><WarningFilled /></el-icon>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog
      v-model="logDetailVisible"
      title="权限变更详情"
      width="560px"
      append-to-body
      class="zoom-dialog"
    >
      <div v-if="currentPermissionLog" class="log-detail">
        <div class="log-detail-grid">
          <div class="log-detail-item">
            <label>操作类型</label>
            <span>{{ permissionLogActionLabel[currentPermissionLog.action as keyof typeof permissionLogActionLabel] || currentPermissionLog.action }}</span>
          </div>
          <div class="log-detail-item">
            <label>操作人</label>
            <span>{{ currentPermissionLog.operatorName || '-' }}</span>
          </div>
          <div class="log-detail-item">
            <label>变更类型</label>
            <span>{{ currentPermissionLog.changeType || '-' }}</span>
          </div>
          <div class="log-detail-item">
            <label>操作时间</label>
            <span>{{ currentPermissionLog.created_at }}</span>
          </div>
        </div>
        <div class="log-compare">
          <div class="log-compare-item log-old">
            <div class="log-compare-title">变更前</div>
            <pre v-if="currentPermissionLog.oldValue">{{ formatJson(currentPermissionLog.oldValue) }}</pre>
            <span v-else class="empty-text">无</span>
          </div>
          <div class="log-compare-item log-new">
            <div class="log-compare-title">变更后</div>
            <pre v-if="currentPermissionLog.newValue">{{ formatJson(currentPermissionLog.newValue) }}</pre>
            <span v-else class="empty-text">无</span>
          </div>
        </div>
        <div v-if="currentPermissionLog.operationRemark" class="log-detail-item">
          <label>操作备注：</label>
          <span>{{ currentPermissionLog.operationRemark }}</span>
        </div>
      </div>
    </el-dialog>

    <div class="success-toast" v-if="showSuccessCheck">
      <el-icon :size="48" color="#67c23a"><CircleCheckFilled /></el-icon>
      <span>操作成功</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Plus, Lock, Setting, Document, Monitor, WarningFilled,
  ArrowDown, ArrowUp, CircleCheckFilled,
} from '@element-plus/icons-vue';
import PageContainer from '@/components/PageContainer/index.vue';
import SearchForm from '@/components/SearchForm/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import { useUserStore } from '@/store/modules/user';
import {
  getUserPermissionListApi,
  createSubAccountApi,
  updateUserPermissionApi,
  freezeAccountApi,
  unfreezeAccountApi,
  checkCompanyQualificationApi,
  checkUsernameApi,
  getRolePermissionsApi,
  batchAssignPermissionsApi,
  batchFreezeAccountsApi,
  getPermissionLogsApi,
  getLoginLogsApi,
  getPermissionLogsByUserIdApi,
  type UserPermissionItem,
  type PermissionLogItem,
  type LoginLogItem,
  type BatchPermissionResult,
} from '@/api/user-permission';
import {
  AccountStatus,
  AccountStatusLabel,
  AccountStatusType,
  PermissionLogAction,
  PermissionLogActionLabel,
  LoginStatus,
  LoginStatusLabel,
  LoginStatusType,
  DataScope,
  DataScopeLabel,
  ROLE_OPTIONS,
  DATA_SCOPE_OPTIONS,
  ROLE_PERMISSIONS,
  UserRole,
} from '@/constants/recruitment';

const userStore = useUserStore();

const loading = ref(false);
const submitting = ref(false);
const statusLoading = ref(false);
const logsLoading = ref(false);
const batchLoading = ref(false);

const userList = ref<UserPermissionItem[]>([]);
const anomalyCount = ref(0);
const showOnlyAnomaly = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchParams = reactive({
  keyword: '',
  role: '',
  accountStatus: '',
  minOperationCount: undefined as number | undefined,
  isAnomalyLogin: undefined as boolean | undefined,
});

const searchFields = [
  { key: 'keyword', label: '关键词', type: 'input', placeholder: '用户名/姓名/手机' },
  { key: 'role', label: '角色', type: 'select', options: [
    { label: '全部', value: '' },
    ...ROLE_OPTIONS,
  ]},
  { key: 'accountStatus', label: '账号状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '正常', value: 'normal' },
    { label: '冻结', value: 'frozen' },
    { label: '过期', value: 'expired' },
  ]},
  { key: 'minOperationCount', label: '操作频次', type: 'select', options: [
    { label: '不限', value: '' },
    { label: '50次以上', value: 50 },
    { label: '100次以上', value: 100 },
    { label: '200次以上', value: 200 },
  ]},
];

const tableColumns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'username', label: '用户名', width: 120, fixed: 'left' },
  { prop: 'realName', label: '真实姓名', width: 100 },
  { prop: 'role', label: '角色', width: 100, slot: 'role' },
  { prop: 'accountStatus', label: '状态', width: 100, slot: 'accountStatus' },
  { prop: 'department', label: '部门', width: 100 },
  { prop: 'position', label: '职位', width: 100 },
  { prop: 'operationCount', label: '操作次数', width: 100, slot: 'operationCount' },
  { prop: 'isAnomalyLogin', label: '异常登录', width: 100, slot: 'anomaly' },
  { prop: 'remark', label: '备注', width: 140, slot: 'remark' },
  { prop: 'lastLoginTime', label: '最后登录', width: 160 },
  { label: '操作', width: 220, slot: 'action', fixed: 'right' },
];

const selectedIds = ref<number[]>([]);
const currentRow = ref<UserPermissionItem | null>(null);
const currentUser = ref<UserPermissionItem | null>(null);

const accountStatusLabel = AccountStatusLabel;
const accountStatusType = AccountStatusType;
const permissionLogActionLabel = PermissionLogActionLabel;
const loginStatusLabel = LoginStatusLabel;
const loginStatusType = LoginStatusType;
const dataScopeLabel = DataScopeLabel;
const roleOptions = ROLE_OPTIONS;
const dataScopeOptions = DATA_SCOPE_OPTIONS;

const userRoleLabel: Record<string, string> = {
  admin: '超级管理员',
  hr: 'HR专员',
  interviewer: '面试官',
};

const canManage = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'hr';
});

const editDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<any>(null);
const qualificationApproved = ref(true);

const formData = reactive({
  username: '',
  password: '',
  realName: '',
  phone: '',
  email: '',
  role: 'hr',
  department: '',
  position: '',
  dataScope: 'dept',
  expireAt: undefined as any,
  remark: '',
});

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

const shakeFields = reactive<Record<string, boolean>>({});
const fieldErrors = reactive<Record<string, string>>({});
const fieldRefs = reactive<Record<string, any>>({});

const currentRolePermissions = computed(() => {
  return ROLE_PERMISSIONS[formData.role] || [];
});

const canSubmit = computed(() => {
  if (!formData.username) return false;
  if (!isEdit.value && !formData.password) return false;
  if (!formData.role) return false;
  if (fieldErrors.username || fieldErrors.phone || fieldErrors.email) return false;
  return true;
});

const statusConfirmVisible = ref(false);
const targetAction = ref<'freeze' | 'unfreeze'>('freeze');
const targetUserId = ref<number | null>(null);
const freezeRemark = ref('');

const detailDialogVisible = ref(false);

const batchAssignVisible = ref(false);
const batchAssignData = reactive({
  role: 'hr',
  dataScope: 'dept',
});
const batchResult = ref<BatchPermissionResult | null>(null);

const logsDialogVisible = ref(false);
const logsDialogTitle = ref('');
const activeLogTab = ref<'permission' | 'login'>('permission');
const permissionLogs = ref<PermissionLogItem[]>([]);
const loginLogs = ref<LoginLogItem[]>([]);
const currentPermissionLog = ref<PermissionLogItem | null>(null);
const logDetailVisible = ref(false);

const permissionLogSearch = reactive({
  dateRange: [] as any,
  keyword: '',
});

const loginLogSearch = reactive({
  dateRange: [] as any,
  status: '',
});

const showSuccessCheck = ref(false);

function setFieldRef(name: string, el: any) {
  fieldRefs[name] = el;
}

function triggerShake(field: string) {
  shakeFields[field] = true;
  setTimeout(() => {
    shakeFields[field] = false;
  }, 500);
}

function handleInputFocus(field: string) {
  const input = document.querySelector(`.account-form .el-form-item__content .el-input__wrapper`) as HTMLElement;
  if (input && field === 'username') {
    // 聚焦效果由CSS处理
  }
}

function handleInputBlur(field: string) {
  // 失焦恢复
}

function formatPermission(perm: string): string {
  const map: Record<string, string> = {
    '*': '全部权限',
    'company:view': '查看企业',
    'company:edit': '编辑企业',
    'job:view': '查看岗位',
    'job:create': '创建岗位',
    'job:edit': '编辑岗位',
    'job:delete': '删除岗位',
    'resume:view': '查看简历',
    'resume:review': '审核简历',
    'interview:view': '查看面试',
    'interview:arrange': '安排面试',
    'interview:evaluate': '评价面试',
    'onboard:view': '查看入职',
    'onboard:manage': '管理入职',
    'qualification:view': '查看资质',
    'recruitment_config:view': '查看配置',
    'recruitment_config:edit': '编辑配置',
  };
  return map[perm] || perm;
}

async function loadUserList() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    };
    if (showOnlyAnomaly.value) {
      params.isAnomalyLogin = true;
    }
    const result = await getUserPermissionListApi(params);
    userList.value = result.list;
    pagination.total = result.total;
    anomalyCount.value = userList.value.filter(u => u.isAnomalyLogin).length;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadUserList();
}

function handleReset() {
  searchParams.keyword = '';
  searchParams.role = '';
  searchParams.accountStatus = '';
  searchParams.minOperationCount = undefined;
  searchParams.isAnomalyLogin = undefined;
  pagination.page = 1;
  loadUserList();
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadUserList();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.page = 1;
  loadUserList();
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
  const companyId = userStore.companyId;
  if (companyId) {
    try {
      const result = await checkCompanyQualificationApi(companyId);
      qualificationApproved.value = result.approved;
    } catch {
      qualificationApproved.value = false;
    }
  }
  editDialogVisible.value = true;
}

async function handleEdit(row: UserPermissionItem) {
  isEdit.value = true;
  currentUser.value = row;
  qualificationApproved.value = true;

  try {
    const detail = await getUserPermissionDetailApi ? await getUserPermissionDetailApi(row.id) : row;
    Object.assign(formData, {
      username: detail.username,
      password: '',
      realName: detail.realName || '',
      phone: detail.phone || '',
      email: detail.email || '',
      role: detail.role,
      department: detail.department || '',
      position: detail.position || '',
      dataScope: detail.dataScope || 'dept',
      expireAt: detail.expireAt,
      remark: detail.remark || '',
    });
  } catch {
    Object.assign(formData, {
      username: row.username,
      password: '',
      realName: row.realName || '',
      phone: row.phone || '',
      email: row.email || '',
      role: row.role,
      department: (row as any).department || '',
      position: (row as any).position || '',
      dataScope: (row as any).dataScope || 'dept',
      expireAt: (row as any).expireAt,
      remark: (row as any).remark || '',
    });
  }

  editDialogVisible.value = true;
}

function handleDetail(row: UserPermissionItem) {
  currentUser.value = row;
  detailDialogVisible.value = true;
}

function handleFreeze(row: UserPermissionItem) {
  targetUserId.value = row.id;
  targetAction.value = 'freeze';
  freezeRemark.value = '';
  statusConfirmVisible.value = true;
}

function handleUnfreeze(row: UserPermissionItem) {
  targetUserId.value = row.id;
  targetAction.value = 'unfreeze';
  statusConfirmVisible.value = true;
}

async function confirmStatusChange() {
  if (!targetUserId.value) return;
  statusLoading.value = true;
  try {
    if (targetAction.value === 'freeze') {
      await freezeAccountApi(targetUserId.value, freezeRemark.value);
      ElMessage.success('冻结成功');
    } else {
      await unfreezeAccountApi(targetUserId.value);
      ElMessage.success('解冻成功');
    }
    showSuccessToast();
    statusConfirmVisible.value = false;
    loadUserList();
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败');
  } finally {
    statusLoading.value = false;
  }
}

function handleUsernameBlur() {
  handleInputBlur('username');
  checkUsernameUnique();
}

async function checkUsernameUnique() {
  if (!formData.username || formData.username.length < 3) return;
  try {
    const result = await checkUsernameApi(
      formData.username,
      isEdit.value && currentUser.value ? currentUser.value.id : undefined
    );
    if (!result.available) {
      fieldErrors.username = '用户名已存在';
      triggerShake('username');
    } else {
      fieldErrors.username = '';
    }
  } catch {
    // ignore
  }
}

function handleRoleChange() {
  // 角色变更时自动更新权限
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    if (isEdit.value && currentUser.value) {
      await updateUserPermissionApi(currentUser.value.id, formData);
      ElMessage.success('修改成功');
    } else {
      await createSubAccountApi(formData);
      ElMessage.success('创建成功');
    }
    showSuccessToast();
    editDialogVisible.value = false;
    loadUserList();
  } catch (err: any) {
    const msg = err.message || '提交失败';
    if (msg.includes('用户名')) {
      fieldErrors.username = msg;
      triggerShake('username');
    } else if (msg.includes('手机号') || msg.includes('phone')) {
      fieldErrors.phone = msg.replace('phone：', '').replace('手机号：', '');
      triggerShake('phone');
    } else if (msg.includes('邮箱') || msg.includes('email')) {
      fieldErrors.email = msg.replace('email：', '').replace('邮箱：', '');
      triggerShake('email');
    }
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
}

function handleBatchFreeze() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的账号');
    return;
  }
  ElMessage.warning('批量冻结功能开发中');
}

function handleBatchAssign() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的账号');
    return;
  }
  batchAssignData.role = 'hr';
  batchAssignData.dataScope = 'dept';
  batchResult.value = null;
  batchAssignVisible.value = true;
}

async function confirmBatchAssign() {
  if (!batchAssignData.role) {
    ElMessage.warning('请选择角色');
    return;
  }
  batchLoading.value = true;
  try {
    const result = await batchAssignPermissionsApi(
      selectedIds.value,
      batchAssignData.role,
      batchAssignData.dataScope
    );
    batchResult.value = result;
    if (result.failed === 0) {
      showSuccessToast();
    }
    loadUserList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量分配失败');
  } finally {
    batchLoading.value = false;
  }
}

function handleViewPermissionLogs() {
  logsDialogTitle.value = '权限变更日志';
  activeLogTab.value = 'permission';
  loadPermissionLogs();
  logsDialogVisible.value = true;
}

function handleViewLoginLogs() {
  logsDialogTitle.value = '登录日志';
  activeLogTab.value = 'login';
  loadLoginLogs();
  logsDialogVisible.value = true;
}

function handleViewUserLogs(row: UserPermissionItem) {
  logsDialogTitle.value = `${row.username} - 操作日志`;
  currentUser.value = row;
  activeLogTab.value = 'permission';
  loadUserPermissionLogs(row.id);
  logsDialogVisible.value = true;
}

async function loadPermissionLogs() {
  logsLoading.value = true;
  try {
    const params: any = { page: 1, pageSize: 50 };
    if (permissionLogSearch.keyword) {
      params.keyword = permissionLogSearch.keyword;
    }
    const result = await getPermissionLogsApi(params);
    permissionLogs.value = result.list;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

async function loadUserPermissionLogs(userId: number) {
  logsLoading.value = true;
  try {
    const result = await getPermissionLogsByUserIdApi(userId);
    permissionLogs.value = result.list;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

async function loadLoginLogs() {
  logsLoading.value = true;
  try {
    const params: any = { page: 1, pageSize: 50 };
    if (loginLogSearch.status) {
      params.status = loginLogSearch.status;
    }
    const result = await getLoginLogsApi(params);
    loginLogs.value = result.list;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

function showPermissionLogDetail(row: PermissionLogItem) {
  currentPermissionLog.value = row;
  logDetailVisible.value = true;
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function resetForm() {
  formData.username = '';
  formData.password = '';
  formData.realName = '';
  formData.phone = '';
  formData.email = '';
  formData.role = 'hr';
  formData.department = '';
  formData.position = '';
  formData.dataScope = 'dept';
  formData.expireAt = undefined;
  formData.remark = '';
  fieldErrors.username = '';
  fieldErrors.phone = '';
  fieldErrors.email = '';
  batchResult.value = null;
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

// 获取用户详情API
async function getUserPermissionDetailApi(id: number) {
  const { get } = await import('@/utils/request');
  return get(`/user-permissions/${id}`);
}

onMounted(() => {
  loadUserList();
});
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.user-permission-page {
  .zoom-dialog :deep(.el-dialog) {
    animation: dialogZoomIn 0.3s ease-out;
    transform-origin: center center;
  }

  @keyframes dialogZoomIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }

  .anomaly-banner {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-base;
    background: rgba(230, 162, 60, 0.1);
    border: 1px solid rgba(230, 162, 60, 0.3);
    border-radius: $border-radius;
    margin-bottom: $spacing-base;
    cursor: pointer;
    color: #b88230;
    font-size: $font-size-sm;
    transition: all 0.2s;

    &:hover {
      background: rgba(230, 162, 60, 0.15);
    }

    strong {
      color: #d97706;
    }

    .arrow-icon {
      margin-left: auto;
    }

    .pulse-icon {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  }

  .anomaly-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    .anomaly-text {
      color: #e6a23c;
      font-size: $font-size-sm;
    }

    .normal-text {
      color: $text-placeholder;
      font-size: $font-size-sm;
    }
  }

  .remark-text {
    color: $text-secondary;
    cursor: help;
  }

  .qualification-alert {
    margin-bottom: $spacing-base;
  }

  .account-form {
    .field-error {
      font-size: $font-size-xs;
      color: $danger-color;
      margin-top: $spacing-xs;
    }

    .field-hint {
      font-size: $font-size-xs;
      color: $text-placeholder;
      margin-top: $spacing-xs;
    }

    .permission-list {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-xs;

      .perm-tag {
        margin: 0;
      }
    }

    .form-tip {
      font-size: $font-size-xs;
      color: $text-placeholder;
      margin-top: $spacing-xs;
    }

    .shake-animation {
      animation: shake 0.5s ease-in-out;

      :deep(.el-input__wrapper) {
        border-color: $danger-color;
        box-shadow: 0 0 0 1px $danger-color inset;
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
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

        &.tip {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
  }

  .freeze-reason-form {
    margin-top: $spacing-base;
  }

  .detail-remark {
    line-height: 1.6;
    color: $text-primary;
    white-space: pre-wrap;
  }

  .batch-alert {
    margin-bottom: $spacing-base;
  }

  .batch-form {
    margin-top: $spacing-base;
  }

  .batch-result {
    margin-top: $spacing-base;
  }

  .log-tabs {
    display: flex;
    border-bottom: 1px solid $border-color;
    margin-bottom: $spacing-base;

    .log-tab {
      padding: $spacing-sm $spacing-lg;
      cursor: pointer;
      font-size: $font-size-base;
      color: $text-secondary;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;

      &:hover {
        color: $primary-color;
      }

      &.active {
        color: $primary-color;
        border-bottom-color: $primary-color;
        font-weight: 500;
      }
    }
  }

  .log-content {
    .log-search {
      display: flex;
      gap: $spacing-sm;
      margin-bottom: $spacing-base;
    }
  }

  .log-detail {
    .log-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $spacing-sm $spacing-base;
      margin-bottom: $spacing-base;
    }

    .log-detail-item {
      display: flex;
      font-size: $font-size-sm;

      label {
        width: 80px;
        flex-shrink: 0;
        color: $text-secondary;
      }

      span {
        flex: 1;
        color: $text-primary;
      }
    }

    .log-compare {
      display: flex;
      gap: $spacing-base;
      margin: $spacing-base 0;

      .log-compare-item {
        flex: 1;
        padding: $spacing-sm;
        border-radius: $border-radius-sm;
        background: rgba(243, 244, 246, 0.5);

        &.log-old {
          border-left: 3px solid $warning-color;
        }

        &.log-new {
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

        .empty-text {
          font-size: $font-size-sm;
          color: $text-placeholder;
        }
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
}
</style>
