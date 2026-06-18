<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="queryParams.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="活跃度">
          <el-select
            v-model="queryParams.activityLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in ACTIVITY_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活跃分值">
          <el-input
            v-model="queryParams.minActivityScore"
            placeholder="最低分"
            clearable
            style="width: 100px"
            type="number"
          />
          <span style="margin: 0 8px">-</span>
          <el-input
            v-model="queryParams.maxActivityScore"
            placeholder="最高分"
            clearable
            style="width: 100px"
            type="number"
          />
        </el-form-item>
        <el-form-item label="重点运维">
          <el-select
            v-model="queryParams.isFocusMaintenance"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="最后活跃">
          <el-date-picker
            v-model="lastActiveRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
            class="action-btn"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset" class="action-btn">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">批量运营操作</span>
          <div class="header-actions">
            <el-tag v-if="canBatchOps" type="success" effect="light">可批量运营</el-tag>
          </div>
        </div>
      </template>

      <div class="batch-toolbar">
        <div class="toolbar-left">
          <span class="selected-count">
            已选择 <span class="count">{{ selectedIds.length }}</span> / {{ total }} 项
          </span>
          <el-button
            v-if="selectedIds.length > 0"
            size="small"
            type="primary"
            link
            @click="handleSelectAll"
          >
            全选当前页
          </el-button>
          <el-button
            v-if="selectedIds.length > 0"
            size="small"
            type="info"
            link
            @click="handleClearSelection"
          >
            清空选择
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip
            v-if="!canBatchOps"
            content="仅operation_admin/admin角色可执行"
            placement="top"
          >
            <el-button
              type="info"
              :icon="Bell"
              :disabled="selectedIds.length === 0 || !canBatchOps"
              @click="showOperationDialog(ActivityBatchType.WAKE_UP_SLEEPING)"
              class="action-btn"
            >
              批量唤醒
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="info"
            :icon="Bell"
            :disabled="selectedIds.length === 0 || !canBatchOps"
            @click="showOperationDialog(ActivityBatchType.WAKE_UP_SLEEPING)"
            class="action-btn"
          >
            批量唤醒
          </el-button>

          <el-tooltip
            v-if="!canBatchOps"
            content="仅operation_admin/admin角色可执行"
            placement="top"
          >
            <el-button
              type="success"
              :icon="Gift"
              :disabled="selectedIds.length === 0 || !canBatchOps"
              @click="showOperationDialog(ActivityBatchType.GRANT_BENEFIT_HIGH)"
              class="action-btn"
            >
              发放权益
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="success"
            :icon="Gift"
            :disabled="selectedIds.length === 0 || !canBatchOps"
            @click="showOperationDialog(ActivityBatchType.GRANT_BENEFIT_HIGH)"
            class="action-btn"
          >
            发放权益
          </el-button>

          <el-tooltip
            v-if="!canBatchOps"
            content="仅operation_admin/admin角色可执行"
            placement="top"
          >
            <el-button
              type="warning"
              :icon="Star"
              :disabled="selectedIds.length === 0 || !canBatchOps"
              @click="showOperationDialog(ActivityBatchType.MARK_FOCUS_LOW)"
              class="action-btn"
            >
              重点运维
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="warning"
            :icon="Star"
            :disabled="selectedIds.length === 0 || !canBatchOps"
            @click="showOperationDialog(ActivityBatchType.MARK_FOCUS_LOW)"
            class="action-btn"
          >
            重点运维
          </el-button>
        </div>
      </div>

      <div v-if="skeletonLoading" class="skeleton-wrapper">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <el-skeleton :rows="1" animated />
        </div>
      </div>

      <HtTable
        v-else
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
        @selection-change="handleSelectionChange"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="selection" width="55" align="center" />

        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-info">
              <div class="avatar-wrapper">
                <el-avatar :size="44" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
                <el-tag
                  class="activity-tag"
                  :color="ACTIVITY_LEVEL_COLORS[row.activityLevel]"
                  size="small"
                  effect="dark"
                >
                  {{ ACTIVITY_LEVEL_NAMES[row.activityLevel] }}
                </el-tag>
              </div>
              <div class="info-text">
                <div class="user-name">
                  {{ row.nickname }}
                  <span class="user-uid">UID: {{ row.id }}</span>
                </div>
                <div class="user-extra">
                  <span>{{ row.username }}</span>
                  <el-tag
                    v-if="row.isFocusMaintenance === 1"
                    type="warning"
                    size="small"
                    effect="plain"
                  >
                    重点运维
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="活跃分值" min-width="200">
          <template #default="{ row }">
            <div class="score-section">
              <div class="score-header">
                <span class="score-value" :style="{ color: getActivityScoreColor(row.activityScore) }">
                  {{ row.activityScore }}
                </span>
                <span class="score-max">/ 100</span>
              </div>
              <el-progress
                :percentage="row.activityScore || 0"
                :stroke-width="8"
                :color="getActivityScoreColor(row.activityScore)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="活跃指标" min-width="260">
          <template #default="{ row }">
            <div class="activity-metrics">
              <div class="metric-row">
                <div class="metric-item">
                  <span class="metric-label">周登录:</span>
                  <span class="metric-value">{{ row.weeklyLoginCount }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">月登录:</span>
                  <span class="metric-value">{{ row.monthlyLoginCount }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">周发布:</span>
                  <span class="metric-value">{{ row.weeklyPublishCount }}</span>
                </div>
              </div>
              <div class="metric-row">
                <div class="metric-item">
                  <span class="metric-label">周评论:</span>
                  <span class="metric-value">{{ row.weeklyCommentCount }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">周点赞:</span>
                  <span class="metric-value">{{ row.weeklyLikeCount }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">周互动:</span>
                  <span class="metric-value">{{ row.weeklyInteractionCount }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="关联策略" min-width="180">
          <template #default="{ row }">
            <div class="strategy-tags">
              <template v-if="row.activityStrategies && row.activityStrategies.length > 0">
                <el-tag
                  v-for="s in row.activityStrategies.slice(0, 2)"
                  :key="s"
                  size="small"
                  effect="light"
                  style="margin-right: 4px"
                >
                  {{ s }}
                </el-tag>
                <el-tag
                  v-if="row.activityStrategies.length > 2"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  +{{ row.activityStrategies.length - 2 }}
                </el-tag>
              </template>
              <span v-else class="empty-text">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="最后活跃" width="180">
          <template #default="{ row }">
            <div class="time-column">
              {{ row.lastActiveTime ? formatDateTime(row.lastActiveTime) : '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            <div class="time-column">
              {{ row.lastActivityUpdateTime ? formatDateTime(row.lastActivityUpdateTime) : '-' }}
            </div>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="operationDialogVisible"
      :title="operationDialogTitle"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form :model="formModel" label-width="110px">
        <el-form-item label="操作类型">
          <el-tag :type="operationTypeTagType" effect="light">
            {{ ACTIVITY_BATCH_TYPE_NAMES[currentBatchType] }}
          </el-tag>
        </el-form-item>
        <el-form-item label="操作人数">
          <span class="count-highlight">{{ selectedIds.length }}</span> 人
        </el-form-item>
        <el-form-item label="生效方式" required>
          <el-radio-group v-model="formModel.executeType">
            <el-radio :value="OperationExecuteType.IMMEDIATE">
              {{ OPERATION_EXECUTE_NAMES[OperationExecuteType.IMMEDIATE] }}
            </el-radio>
            <el-radio :value="OperationExecuteType.SCHEDULED">
              {{ OPERATION_EXECUTE_NAMES[OperationExecuteType.SCHEDULED] }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="formModel.executeType === OperationExecuteType.SCHEDULED"
          label="定时时间"
          required
        >
          <el-date-picker
            v-model="formModel.scheduledTime"
            type="datetime"
            placeholder="请选择执行时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disablePastDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="关联策略">
          <el-select
            v-model="formModel.strategyIds"
            multiple
            placeholder="选择关联策略（可选）"
            style="width: 100%"
            :loading="strategiesLoading"
          >
            <el-option
              v-for="s in strategyList"
              :key="s.id"
              :label="s.strategyName"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input
            v-model="formModel.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入操作备注（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="operationDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!validateOperationForm()"
          @click="handleConfirmOperation"
          class="action-btn"
        >
          确认执行
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="confirmDialogVisible"
      title="二次确认"
      width="460px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <el-alert
          :title="confirmWarningTitle"
          type="warning"
          :description="confirmWarningDesc"
          show-icon
          :closable="false"
        />
        <div class="confirm-info">
          <div class="info-item">
            <span class="info-label">操作类型：</span>
            <el-tag :type="operationTypeTagType" effect="light">
              {{ ACTIVITY_BATCH_TYPE_NAMES[currentBatchType] }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">生效方式：</span>
            <span class="info-value">
              {{ OPERATION_EXECUTE_NAMES[formModel.executeType] }}
            </span>
          </div>
          <div
            v-if="formModel.executeType === OperationExecuteType.SCHEDULED"
            class="info-item"
          >
            <span class="info-label">执行时间：</span>
            <span class="info-value">{{ formModel.scheduledTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">操作人数：</span>
            <span class="info-value count-highlight">{{ selectedIds.length }} 人</span>
          </div>
          <div v-if="formModel.strategyIds && formModel.strategyIds.length > 0" class="info-item">
            <span class="info-label">关联策略：</span>
            <span class="info-value">{{ formModel.strategyIds.length }} 个</span>
          </div>
          <div v-if="formModel.remark" class="info-item">
            <span class="info-label">操作备注：</span>
            <span class="info-value">{{ formModel.remark }}</span>
          </div>
        </div>
        <div class="confirm-input">
          <el-form :model="confirmFormModel" label-width="130px">
            <el-form-item label="请输入操作确认">
              <el-input
                v-model="confirmFormModel.confirmText"
                placeholder='请输入"确认批量运营"'
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="confirmFormModel.confirmText !== '确认批量运营'"
          @click="handleExecuteBatch"
          class="action-btn"
        >
          确定执行
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="progressVisible"
      title="批量运营执行进度"
      width="560px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="operating" class="progress-content">
        <div class="progress-header">
          <span class="progress-title">正在执行{{ ACTIVITY_BATCH_TYPE_NAMES[currentBatchType] }}...</span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="12"
          :text-inside="false"
          status="success"
        />
        <div class="progress-info">
          <span>已处理：{{ progressCurrent }} / {{ progressTotal }}</span>
          <span class="success-text">成功：{{ progressSuccess }}</span>
          <span class="error-text">失败：{{ progressFail }}</span>
        </div>
        <div class="skeleton-progress">
          <div v-for="i in 3" :key="i" class="skeleton-item">
            <el-skeleton :rows="1" animated />
          </div>
        </div>
      </div>
      <div v-else class="result-content">
        <div class="result-icon-wrapper" :class="{ success: progressFail === 0, error: progressFail > 0 }">
          <el-icon v-if="progressFail === 0" :size="60" color="#67c23a">
            <CircleCheckFilled />
          </el-icon>
          <el-icon v-else :size="60" color="#f56c6c">
            <WarningFilled />
          </el-icon>
          <div class="result-title">{{ progressFail === 0 ? '操作全部完成' : '操作部分完成' }}</div>
        </div>
        <div class="result-stats">
          <div class="stat-item">
            <div class="stat-value">{{ progressTotal }}</div>
            <div class="stat-label">总计</div>
          </div>
          <div class="stat-item success">
            <div class="stat-value">{{ progressSuccess }}</div>
            <div class="stat-label">成功</div>
          </div>
          <div class="stat-item error">
            <div class="stat-value">{{ progressFail }}</div>
            <div class="stat-label">失败</div>
          </div>
        </div>
        <el-table v-if="progressFail > 0" :data="failResults" max-height="220">
          <el-table-column prop="userId" label="用户ID" width="100" />
          <el-table-column prop="userName" label="用户名" width="140" />
          <el-table-column prop="error" label="失败原因" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="handleCloseProgress" v-if="!operating">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Bell,
  Gift,
  Star,
  CircleCheckFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getActivityList, batchExecuteOperation, getStrategies } from '@api/activity-operation'
import type {
  ActivityListUser,
  BatchActivityOperationResult,
  ActivityPermission,
  ActivityStrategy
} from '@types/business'
import {
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS,
  ActivityBatchType,
  ACTIVITY_BATCH_TYPE_NAMES,
  OperationExecuteType,
  OPERATION_EXECUTE_NAMES,
  OperationStatus,
  OPERATION_STATUS_NAMES
} from '@enums/business'
import HtTable from '@components/HtTable/index.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('operation_admin') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('activity:view')
})

const canBatchOps = computed(() => {
  return permission.value.canBatch &&
    (userStore.hasRole('admin') ||
    userStore.hasRole('operation_admin'))
})

const permission = ref<ActivityPermission>({
  canView: false,
  canCalculate: false,
  canRefresh: false,
  canBatch: false,
  canAbnormal: false,
  canStrategy: false
})

const lastActiveRange = ref<string[]>([])
const selectedIds = ref<number[]>([])
const skeletonLoading = ref(false)

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<ActivityListUser, Record<string, unknown>>({
  fetchApi: async (params) => {
    const result = await getActivityList(params)
    permission.value = result.permission
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: undefined,
    nickname: '',
    activityLevel: undefined,
    minActivityScore: undefined,
    maxActivityScore: undefined,
    isFocusMaintenance: undefined,
    lastActiveStartDate: '',
    lastActiveEndDate: ''
  }
})

watch(lastActiveRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.lastActiveStartDate = newVal[0]
    queryParams.lastActiveEndDate = newVal[1]
  } else {
    queryParams.lastActiveStartDate = ''
    queryParams.lastActiveEndDate = ''
  }
})

const operationDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const currentBatchType = ref<ActivityBatchType>(ActivityBatchType.WAKE_UP_SLEEPING)

const formModel = reactive({
  executeType: OperationExecuteType.IMMEDIATE,
  scheduledTime: '',
  strategyIds: [] as number[],
  remark: ''
})

const confirmFormModel = reactive({
  confirmText: ''
})

const strategyList = ref<ActivityStrategy[]>([])
const strategiesLoading = ref(false)

const operationDialogTitle = computed(() => {
  return ACTIVITY_BATCH_TYPE_NAMES[currentBatchType.value]
})

const operationTypeTagType = computed(() => {
  switch (currentBatchType.value) {
    case ActivityBatchType.WAKE_UP_SLEEPING:
      return 'info'
    case ActivityBatchType.GRANT_BENEFIT_HIGH:
      return 'success'
    case ActivityBatchType.MARK_FOCUS_LOW:
      return 'warning'
    default:
      return ''
  }
})

const confirmWarningTitle = computed(() => {
  return `您即将执行${ACTIVITY_BATCH_TYPE_NAMES[currentBatchType.value]}操作`
})

const confirmWarningDesc = computed(() => {
  const count = selectedIds.value.length
  const typeName = ACTIVITY_BATCH_TYPE_NAMES[currentBatchType.value]
  if (formModel.executeType === OperationExecuteType.IMMEDIATE) {
    return `将对 ${count} 名用户立即执行${typeName}，此操作将即时生效，请谨慎操作。`
  }
  return `将对 ${count} 名用户于 ${formModel.scheduledTime} 执行${typeName}，请确认执行时间。`
})

const operating = ref(false)
const progressVisible = ref(false)
const progressPercent = ref(0)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressSuccess = ref(0)
const progressFail = ref(0)
const failResults = ref<BatchActivityOperationResult['results']>([])

const getActivityScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 50) return '#409eff'
  if (score >= 20) return '#e6a23c'
  return '#909399'
}

const getRowClassName = ({ row }: { row: ActivityListUser }) => {
  if (selectedIds.value.includes(row.id)) {
    return 'row-selected-highlight'
  }
  return ''
}

const handleSelectionChange = (selection: unknown[]) => {
  selectedIds.value = (selection as ActivityListUser[]).map(item => item.id)
}

const handleSelectAll = () => {
  selectedIds.value = dataList.value.map(item => item.id)
}

const handleClearSelection = () => {
  selectedIds.value = []
}

const handleReset = () => {
  lastActiveRange.value = []
  selectedIds.value = []
  baseHandleReset()
}

const loadStrategies = async () => {
  if (strategyList.value.length > 0) return
  strategiesLoading.value = true
  try {
    const result = await getStrategies()
    strategyList.value = result.list
  } catch (e) {
    console.error(e)
  } finally {
    strategiesLoading.value = false
  }
}

const showOperationDialog = (batchType: ActivityBatchType) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }
  currentBatchType.value = batchType
  formModel.executeType = OperationExecuteType.IMMEDIATE
  formModel.scheduledTime = ''
  formModel.strategyIds = []
  formModel.remark = ''
  loadStrategies()
  operationDialogVisible.value = true
}

const disablePastDate = (date: Date) => {
  return date.getTime() < Date.now() - 86400000
}

const validateOperationForm = () => {
  if (formModel.executeType === OperationExecuteType.SCHEDULED) {
    if (!formModel.scheduledTime) return false
  }
  return true
}

const handleConfirmOperation = () => {
  if (formModel.executeType === OperationExecuteType.SCHEDULED && !formModel.scheduledTime) {
    ElMessage.warning('请选择定时执行时间')
    return
  }
  operationDialogVisible.value = false
  confirmFormModel.confirmText = ''
  confirmDialogVisible.value = true
}

const handleExecuteBatch = async () => {
  confirmDialogVisible.value = false
  progressVisible.value = true
  operating.value = true
  skeletonLoading.value = true
  progressPercent.value = 0
  progressCurrent.value = 0
  progressTotal.value = selectedIds.value.length
  progressSuccess.value = 0
  progressFail.value = 0
  failResults.value = []

  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    skeletonLoading.value = false

    const result = await batchExecuteOperation({
      operationType: currentBatchType.value,
      userIds: selectedIds.value,
      executeType: formModel.executeType,
      strategyIds: formModel.strategyIds.length > 0 ? formModel.strategyIds : undefined,
      scheduledTime: formModel.executeType === OperationExecuteType.SCHEDULED ? formModel.scheduledTime : undefined,
      remark: formModel.remark || undefined
    })

    await simulateProgress(result)

    ElMessage.success('批量操作完成')
    handleReset()
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    operating.value = false
    skeletonLoading.value = false
  }
}

const simulateProgress = (result: BatchActivityOperationResult) => {
  return new Promise<void>((resolve) => {
    let index = 0
    const total = result.results.length
    const interval = setInterval(() => {
      if (index < total) {
        const item = result.results[index]
        progressCurrent.value = index + 1
        if (item.success) {
          progressSuccess.value++
        } else {
          progressFail.value++
          failResults.value.push(item)
        }
        progressPercent.value = Math.round(((index + 1) / total) * 100)
        index++
      } else {
        clearInterval(interval)
        resolve()
      }
    }, 180)
  })
}

const handleCloseProgress = () => {
  progressVisible.value = false
  failResults.value = []
}

onMounted(() => {
  if (canView.value) {
    fetchData()
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .batch-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid $border-color-lighter;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .selected-count {
        font-size: 13px;
        color: $text-secondary;

        .count {
          font-size: 16px;
          font-weight: 600;
          color: $color-primary;
          margin: 0 4px;
        }
      }
    }

    .toolbar-right {
      display: flex;
      gap: 12px;
    }
  }

  .skeleton-wrapper {
    padding: 12px 0;

    .skeleton-row {
      margin-bottom: 12px;
      padding: 0 12px;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-wrapper {
      position: relative;

      .activity-tag {
        position: absolute;
        top: -6px;
        right: -6px;
      }
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .user-name {
        font-weight: 600;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px;

        .user-uid {
          font-size: 12px;
          color: $text-secondary;
          font-weight: normal;
        }
      }

      .user-extra {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .score-section {
    .score-header {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 6px;

      .score-value {
        font-size: 18px;
        font-weight: 600;
      }

      .score-max {
        font-size: 12px;
        color: $text-placeholder;
      }
    }
  }

  .activity-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .metric-row {
      display: flex;
      gap: 12px;
    }

    .metric-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      flex: 1;

      .metric-label {
        color: $text-secondary;
        flex-shrink: 0;
      }

      .metric-value {
        font-weight: 600;
        color: $text-primary;
      }
    }
  }

  .strategy-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    .empty-text {
      color: $text-placeholder;
      font-size: 12px;
    }
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;
  }

  .count-highlight {
    font-size: 18px;
    font-weight: 600;
    color: $color-primary;
  }

  .confirm-content {
    .confirm-info {
      margin-top: 16px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;

      .info-item {
        display: flex;
        align-items: center;
        padding: 6px 0;
        font-size: 13px;

        .info-label {
          color: $text-secondary;
          width: 90px;
          flex-shrink: 0;
        }

        .info-value {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }

    .confirm-input {
      margin-top: 16px;
    }
  }

  .progress-content,
  .result-content {
    padding: 20px 0;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .progress-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }

    .progress-percent {
      font-size: 20px;
      font-weight: 600;
      color: #67c23a;
    }
  }

  .progress-info {
    display: flex;
    justify-content: space-around;
    margin: 16px 0;
    font-size: 13px;
    color: $text-secondary;

    .success-text {
      color: #67c23a;
      font-weight: 500;
    }

    .error-text {
      color: #f56c6c;
      font-weight: 500;
    }
  }

  .skeleton-progress {
    margin-top: 12px;

    .skeleton-item {
      margin-bottom: 10px;
    }
  }

  .result-icon-wrapper {
    text-align: center;
    margin-bottom: 20px;

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }

    .result-title {
      font-size: 18px;
      font-weight: 600;
      margin-top: 12px;
      color: $text-primary;
    }
  }

  .result-stats {
    display: flex;
    justify-content: space-around;
    margin: 24px 0;
    padding: 16px 0;
    background: #f5f7fa;
    border-radius: 8px;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
      }

      .stat-label {
        font-size: 13px;
        color: $text-secondary;
        margin-top: 4px;
      }

      &.success .stat-value {
        color: #67c23a;
      }

      &.error .stat-value {
        color: #f56c6c;
      }
    }
  }
}

:deep(.el-table .row-selected-highlight) {
  background-color: rgba(64, 158, 255, 0.12) !important;

  td {
    background-color: transparent !important;
  }

  &:hover > td {
    background-color: rgba(64, 158, 255, 0.18) !important;
  }
}

.action-btn {
  transition: all 0.15s ease;
  cursor: pointer;
  transform-origin: center;

  &:active {
    transform: translateY(1px) scale(0.97);
    filter: brightness(0.92) saturate(1.1);
  }

  &:focus {
    outline: none;
  }
}
</style>
