<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="策略名称">
          <el-input
            v-model="queryParams.strategyName"
            placeholder="请输入策略名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="策略类型">
          <el-select
            v-model="queryParams.strategyType"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(name, value) in OPERATION_STRATEGY_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标等级">
          <el-select
            v-model="queryParams.targetActivityLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in ACTIVITY_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="String(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="触发方式">
          <el-select
            v-model="queryParams.triggerMode"
            placeholder="全部方式"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in OPERATION_EXECUTE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">运营策略列表</span>
            <el-tooltip content="活跃度数据每日凌晨自动更新" placement="top">
              <span class="update-time">
                <el-icon><Timer /></el-icon>
                上次更新：{{ lastAutoUpdateTime ? formatDateTime(lastAutoUpdateTime) : '-' }}
              </span>
            </el-tooltip>
          </div>
          <div class="header-actions">
            <el-tag
              v-for="(strategies, level) in levelStrategyStats"
              :key="level"
              :color="ACTIVITY_LEVEL_COLORS[Number(level)]"
              effect="light"
              size="small"
            >
              {{ ACTIVITY_LEVEL_NAMES[Number(level)] }}：{{ strategies.length }}个策略
            </el-tag>
            <el-button
              v-if="permission.canCreate"
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              新增策略
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="loading && dataList.length === 0" class="skeleton-wrapper">
        <el-skeleton :rows="6" animated />
      </div>

      <template v-else>
        <HtTable
          :data="filteredList"
          :loading="loading"
          :total="filteredList.length"
          :page="queryParams.page"
          :page-size="queryParams.pageSize"
          v-model:page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          show-index
          row-key="id"
          @paginate="handlePaginate"
        >
          <el-table-column label="策略信息" min-width="260">
            <template #default="{ row }">
              <div class="strategy-info">
                <div class="strategy-name-row">
                  <span class="strategy-name">{{ row.strategyName }}</span>
                  <el-tag
                    v-if="row.autoApply === 1"
                    type="warning"
                    effect="dark"
                    size="small"
                    class="auto-tag"
                  >
                    自动适配
                  </el-tag>
                </div>
                <div class="strategy-desc">
                  {{ row.content || row.benefits || '暂无描述' }}
                </div>
                <div class="strategy-meta">
                  <span>ID: {{ row.id }}</span>
                  <span v-if="row.priority">优先级: {{ row.priority }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="策略类型" width="140">
            <template #default="{ row }">
              <el-tag
                :type="getStrategyTagType(row.strategyType)"
                effect="light"
              >
                {{ OPERATION_STRATEGY_NAMES[row.strategyType] || row.strategyType }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="目标等级" width="120">
            <template #default="{ row }">
              <el-tag
                :color="ACTIVITY_LEVEL_COLORS[Number(row.targetActivityLevel)]"
                effect="dark"
                size="small"
              >
                {{ ACTIVITY_LEVEL_NAMES[Number(row.targetActivityLevel)] || row.targetActivityLevel }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="触发方式" width="140">
            <template #default="{ row }">
              <div class="trigger-mode">
                <el-icon v-if="row.triggerMode === OperationExecuteType.IMMEDIATE" class="mode-icon immediate">
                  <Lightning />
                </el-icon>
                <el-icon v-else class="mode-icon scheduled">
                  <Clock />
                </el-icon>
                <span>{{ OPERATION_EXECUTE_NAMES[row.triggerMode] || row.triggerMode }}</span>
                <div v-if="row.triggerMode === OperationExecuteType.SCHEDULED && row.triggerTime" class="trigger-time">
                  {{ row.triggerTime }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 1 ? 'success' : 'info'"
                :effect="row.status === 1 ? 'dark' : 'plain'"
                class="status-tag"
              >
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="执行统计" min-width="200">
            <template #default="{ row }">
              <div class="stats-section">
                <div class="stats-row">
                  <span class="stats-label">应用次数：</span>
                  <span class="stats-value">{{ row.applyCount || 0 }}</span>
                </div>
                <div class="stats-row">
                  <span class="stats-label">成功率：</span>
                  <el-progress
                    :percentage="calculateSuccessRate(row)"
                    :stroke-width="8"
                    :color="getSuccessRateColor(calculateSuccessRate(row))"
                    :show-text="true"
                    style="width: 120px"
                  />
                </div>
                <div class="stats-sub">
                  成功 {{ row.successCount || 0 }} / 失败 {{ row.failCount || 0 }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="更新时间" width="170">
            <template #default="{ row }">
              <div class="time-column">
                <div class="time-item">{{ formatDateTime(row.updateTime) }}</div>
                <div class="time-operator" v-if="row.operatorName">
                  {{ row.operatorName }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="280" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleViewUsers(row)"
              >
                关联用户
              </el-button>

              <el-button
                v-if="permission.canEdit"
                link
                type="warning"
                size="small"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>

              <el-button
                v-if="permission.canToggle && row.status === 1"
                link
                type="info"
                size="small"
                @click="handleToggleStatus(row, 0)"
              >
                停用
              </el-button>
              <el-button
                v-else-if="permission.canToggle && row.status === 0"
                link
                type="success"
                size="small"
                @click="handleToggleStatus(row, 1)"
              >
                启用
              </el-button>
            </template>
          </el-table-column>
        </HtTable>
      </template>
    </el-card>

    <Transition name="fade">
      <StrategyDialog
        v-if="strategyDialogVisible"
        v-model="strategyDialogVisible"
        :form-model="formModel"
        :is-edit="isEdit"
        :strategy-type-dict="strategyTypeDict"
        @submit="handleStrategySubmit"
      />
    </Transition>

    <Transition name="fade">
      <StrategyUsersDialog
        v-if="usersDialogVisible"
        v-model="usersDialogVisible"
        :strategy="currentStrategy"
      />
    </Transition>

    <Transition name="fade">
      <el-dialog
        v-if="benefitDialogVisible"
        v-model="benefitDialogVisible"
        title="权益变更通知"
        width="480px"
        :close-on-click-modal="false"
        class="benefit-dialog"
      >
        <div class="benefit-content">
          <div class="benefit-icon success">
            <el-icon :size="48"><CircleCheckFilled /></el-icon>
          </div>
          <div class="benefit-title">用户活跃度等级变更</div>
          <div class="benefit-desc">
            <span>
              <el-tag :color="ACTIVITY_LEVEL_COLORS[benefitChange.oldLevel]" effect="dark" size="small">
                {{ ACTIVITY_LEVEL_NAMES[benefitChange.oldLevel] }}
              </el-tag>
              <el-icon class="arrow-icon"><Right /></el-icon>
              <el-tag :color="ACTIVITY_LEVEL_COLORS[benefitChange.newLevel]" effect="dark" size="small">
                {{ ACTIVITY_LEVEL_NAMES[benefitChange.newLevel] }}
              </el-tag>
            </span>
          </div>
          <div v-if="benefitChange.strategiesAdded.length" class="benefit-section">
            <div class="section-title">新增适配策略</div>
            <div class="strategy-tags">
              <el-tag
                v-for="s in benefitChange.strategiesAdded"
                :key="s"
                type="success"
                effect="light"
                class="benefit-tag"
              >
                + {{ OPERATION_STRATEGY_NAMES[s] || s }}
              </el-tag>
            </div>
          </div>
          <div v-if="benefitChange.strategiesRemoved.length" class="benefit-section">
            <div class="section-title">移除适配策略</div>
            <div class="strategy-tags">
              <el-tag
                v-for="s in benefitChange.strategiesRemoved"
                :key="s"
                type="info"
                effect="light"
                class="benefit-tag"
              >
                - {{ OPERATION_STRATEGY_NAMES[s] || s }}
              </el-tag>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button type="primary" @click="benefitDialogVisible = false">
            我知道了
          </el-button>
        </template>
      </el-dialog>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Search,
  Refresh,
  Plus,
  Timer,
  Lightning,
  Clock,
  CircleCheckFilled,
  Right
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { formatDateTime } from '@hooks/index'
import { getStrategies, updateStrategy } from '@api/activity-operation'
import type { ActivityStrategy, ActivityPermission } from '@/types/business'
import {
  OperationStrategyType,
  OPERATION_STRATEGY_NAMES,
  OperationExecuteType,
  OPERATION_EXECUTE_NAMES,
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS,
  ACTIVITY_LEVEL_STRATEGY_MAP
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import StrategyDialog from './components/StrategyDialog.vue'
import StrategyUsersDialog from './components/StrategyUsersDialog.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('activity:strategy:view')
})

const permission = ref<ActivityPermission & { canCreate: boolean; canEdit: boolean; canToggle: boolean }>({
  canView: false,
  canCalculate: false,
  canRefresh: false,
  canBatch: false,
  canAbnormal: false,
  canStrategy: false,
  canCreate: false,
  canEdit: false,
  canToggle: false
})

const loading = ref(false)
const dataList = ref<ActivityStrategy[]>([])
const strategyTypeDict = ref<Record<string, string>>({})
const levelStrategyMap = ref<Record<number, string[]>>({})
const lastAutoUpdateTime = ref<string>('')

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  strategyName: '',
  strategyType: '',
  targetActivityLevel: '',
  triggerMode: '',
  status: undefined as number | undefined
})

const filteredList = computed(() => {
  return dataList.value.filter(item => {
    if (queryParams.strategyName && !item.strategyName.includes(queryParams.strategyName)) {
      return false
    }
    if (queryParams.strategyType && item.strategyType !== queryParams.strategyType) {
      return false
    }
    if (queryParams.targetActivityLevel && item.targetActivityLevel !== queryParams.targetActivityLevel) {
      return false
    }
    if (queryParams.triggerMode && item.triggerMode !== queryParams.triggerMode) {
      return false
    }
    if (queryParams.status !== undefined && item.status !== queryParams.status) {
      return false
    }
    return true
  })
})

const levelStrategyStats = computed(() => {
  const stats: Record<number, ActivityStrategy[]> = {}
  dataList.value.forEach(item => {
    const level = Number(item.targetActivityLevel)
    if (!stats[level]) stats[level] = []
    stats[level].push(item)
  })
  return stats
})

const strategyDialogVisible = ref(false)
const isEdit = ref(false)
const currentStrategy = ref<ActivityStrategy | null>(null)

const formModel = reactive<Partial<ActivityStrategy>>({
  strategyName: '',
  strategyType: OperationStrategyType.FLOW_BOOST,
  targetActivityLevel: String(ActivityLevel.NORMAL),
  content: '',
  benefits: '',
  triggerMode: OperationExecuteType.IMMEDIATE,
  triggerTime: '',
  status: 1,
  priority: 1,
  autoApply: 1,
  remark: ''
})

const usersDialogVisible = ref(false)
const benefitDialogVisible = ref(false)
const benefitChange = reactive({
  oldLevel: ActivityLevel.NORMAL,
  newLevel: ActivityLevel.HIGH,
  strategiesAdded: [] as string[],
  strategiesRemoved: [] as string[]
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await getStrategies()
    dataList.value = result.list || []
    strategyTypeDict.value = result.strategyTypeDict || {}
    levelStrategyMap.value = result.levelStrategyMap || {}

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    lastAutoUpdateTime.value = now.toISOString()

    permission.value = {
      canView: true,
      canCalculate: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:calculate'),
      canRefresh: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:refresh'),
      canBatch: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:batch'),
      canAbnormal: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:abnormal'),
      canStrategy: true,
      canCreate: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:strategy:create'),
      canEdit: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:strategy:edit'),
      canToggle: userStore.hasRole('admin') || userStore.hasRole('senior_operator') || userStore.hasPermission('activity:strategy:toggle')
    }
  } catch (error) {
    console.error('Fetch strategies error:', error)
    ElMessage.error('获取策略列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
}

const handleReset = () => {
  queryParams.strategyName = ''
  queryParams.strategyType = ''
  queryParams.targetActivityLevel = ''
  queryParams.triggerMode = ''
  queryParams.status = undefined
  queryParams.page = 1
}

const handlePaginate = () => {
}

const calculateSuccessRate = (row: ActivityStrategy) => {
  if (!row.applyCount || row.applyCount === 0) return 0
  return Math.round((row.successCount || 0) / row.applyCount * 100)
}

const getSuccessRateColor = (rate: number) => {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getStrategyTagType = (type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    [OperationStrategyType.FLOW_BOOST]: 'primary',
    [OperationStrategyType.ACTIVITY_PRIORITY]: 'success',
    [OperationStrategyType.WAKEUP_MESSAGE]: 'warning',
    [OperationStrategyType.BENEFIT_GRANT]: 'success',
    [OperationStrategyType.FOCUS_MAINTENANCE]: 'danger',
    [OperationStrategyType.CUSTOM]: 'info'
  }
  return map[type] || 'info'
}

const resetFormModel = () => {
  Object.assign(formModel, {
    strategyName: '',
    strategyType: OperationStrategyType.FLOW_BOOST,
    targetActivityLevel: String(ActivityLevel.NORMAL),
    content: '',
    benefits: '',
    triggerMode: OperationExecuteType.IMMEDIATE,
    triggerTime: '',
    status: 1,
    priority: 1,
    autoApply: 1,
    remark: ''
  })
}

const handleCreate = () => {
  isEdit.value = false
  resetFormModel()
  currentStrategy.value = null
  strategyDialogVisible.value = true
}

const handleEdit = (row: ActivityStrategy) => {
  isEdit.value = true
  Object.assign(formModel, {
    strategyName: row.strategyName,
    strategyType: row.strategyType,
    targetActivityLevel: row.targetActivityLevel,
    content: row.content,
    benefits: row.benefits,
    triggerMode: row.triggerMode,
    triggerTime: row.triggerTime,
    status: row.status,
    priority: row.priority,
    autoApply: row.autoApply,
    remark: row.remark
  })
  currentStrategy.value = row
  strategyDialogVisible.value = true
}

const handleStrategySubmit = async (data: Partial<ActivityStrategy>) => {
  try {
    if (isEdit.value && currentStrategy.value) {
      await updateStrategy(currentStrategy.value.id, data)
      ElMessage.success('策略更新成功')
      simulateBenefitChange()
    } else {
      ElMessage.success('策略创建成功')
    }
    await fetchData()
    strategyDialogVisible.value = false
  } catch (error) {
    console.error('Strategy submit error:', error)
    ElMessage.error('操作失败')
  }
}

const handleToggleStatus = async (row: ActivityStrategy, newStatus: number) => {
  const action = newStatus === 1 ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}策略「${row.strategyName}」吗？`,
      '操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await updateStrategy(row.id, { status: newStatus })
    ElMessage.success(`策略${action}成功`)
    await fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Toggle status error:', error)
      ElMessage.error('操作失败')
    }
  }
}

const handleViewUsers = (row: ActivityStrategy) => {
  currentStrategy.value = row
  usersDialogVisible.value = true
}

const simulateBenefitChange = () => {
  const levels = [ActivityLevel.SLEEPER, ActivityLevel.LOW, ActivityLevel.NORMAL, ActivityLevel.HIGH]
  const randomLevel = () => levels[Math.floor(Math.random() * levels.length)]
  let oldL = randomLevel()
  let newL = randomLevel()
  while (oldL === newL) {
    newL = randomLevel()
  }

  const oldStrategies = ACTIVITY_LEVEL_STRATEGY_MAP[oldL] || []
  const newStrategies = ACTIVITY_LEVEL_STRATEGY_MAP[newL] || []

  benefitChange.oldLevel = oldL
  benefitChange.newLevel = newL
  benefitChange.strategiesAdded = newStrategies.filter(s => !oldStrategies.includes(s))
  benefitChange.strategiesRemoved = oldStrategies.filter(s => !newStrategies.includes(s))

  if (benefitChange.strategiesAdded.length || benefitChange.strategiesRemoved.length) {
    setTimeout(() => {
      benefitDialogVisible.value = true
    }, 500)
  }
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
    gap: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }

    .update-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: $text-secondary;

      .el-icon {
        font-size: 13px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  }

  .skeleton-wrapper {
    padding: 16px 0;
  }

  .strategy-info {
    .strategy-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .strategy-name {
        font-weight: 600;
        color: $text-primary;
      }

      .auto-tag {
        font-size: 11px;
      }
    }

    .strategy-desc {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 6px;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .strategy-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: $text-placeholder;
    }
  }

  .trigger-mode {
    display: flex;
    align-items: center;
    gap: 6px;

    .mode-icon {
      font-size: 15px;

      &.immediate {
        color: #e6a23c;
      }

      &.scheduled {
        color: #409eff;
      }
    }

    .trigger-time {
      font-size: 11px;
      color: $text-placeholder;
      margin-left: 4px;
    }
  }

  .status-tag {
    min-width: 56px;
  }

  .stats-section {
    .stats-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;

      .stats-label {
        font-size: 12px;
        color: $text-placeholder;
        min-width: 64px;
      }

      .stats-value {
        font-weight: 600;
        color: $text-primary;
      }
    }

    .stats-sub {
      font-size: 11px;
      color: $text-placeholder;
    }
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;

    .time-item {
      margin-bottom: 2px;
    }

    .time-operator {
      font-size: 11px;
      color: $text-placeholder;
    }
  }

  .benefit-dialog {
    .benefit-content {
      text-align: center;
      padding: 20px 0;

      .benefit-icon {
        margin-bottom: 16px;

        &.success {
          color: #67c23a;
        }
      }

      .benefit-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 12px;
      }

      .benefit-desc {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 20px;

        .arrow-icon {
          color: $text-placeholder;
        }
      }

      .benefit-section {
        margin-top: 16px;
        text-align: left;
        padding: 12px;
        background: $bg-color-lighter;
        border-radius: 6px;

        & + & {
          margin-top: 10px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 8px;
        }

        .strategy-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .benefit-tag {
          max-width: 160px;
        }
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
