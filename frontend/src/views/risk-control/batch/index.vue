<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="formModel.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="违规类型">
          <el-select
            v-model="formModel.violationType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in VIOLATION_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="queryParams.riskLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in RISK_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="记录时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="拦截状态">
          <el-select
            v-model="formModel.intercepted"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="已拦截" :value="1" />
            <el-option label="未拦截" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
            class="ripple-btn"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset" class="ripple-btn">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">批量风控处理</span>
          <div class="header-actions">
            <el-tag v-if="isRiskAdmin" type="danger" effect="light">风控管理员</el-tag>
          </div>
        </div>
      </template>

      <div v-if="isRiskAdmin" class="batch-toolbar">
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
          <el-button
            type="warning"
            :icon="Unlock"
            :disabled="selectedIds.length === 0"
            @click="handleBatchRelease"
            class="ripple-btn"
          >
            批量解除轻微违规
          </el-button>
          <el-button
            type="danger"
            :icon="Lock"
            :disabled="selectedIds.length === 0"
            @click="handleBatchBan"
            class="ripple-btn"
          >
            批量封禁重度违规
          </el-button>
        </div>
      </div>

      <el-skeleton :loading="loading" :rows="8" animated>
        <template #default>
          <HtTable
            :data="dataList"
            :loading="loading"
            :total="total"
            v-model:page="queryParams.page"
            v-model:page-size="queryParams.pageSize"
            show-index
            row-key="id"
            @paginate="handlePaginate"
            @selection-change="handleSelectionChange"
          >
            <el-table-column v-if="isRiskAdmin" type="selection" width="55" align="center" />

            <el-table-column label="用户信息" min-width="180">
              <template #default="{ row }">
                <div class="user-info">
                  <div class="info-text">
                    <div class="user-name">
                      {{ row.userName }}
                      <span class="user-uid">UID: {{ row.userId }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="违规类型" min-width="120">
              <template #default="{ row }">
                <el-tag effect="plain" size="small">
                  {{ VIOLATION_TYPE_NAMES[row.violationType] || row.violationType }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="风险等级" min-width="100">
              <template #default="{ row }">
                <el-tag
                  :color="RISK_LEVEL_COLORS[row.riskLevel]"
                  effect="dark"
                  size="small"
                >
                  {{ RISK_LEVEL_NAMES[row.riskLevel] }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="行为详情" min-width="160">
              <template #default="{ row }">
                <span class="detail-text">{{ row.behaviorDetail || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="拦截状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.intercepted === 1 ? 'danger' : 'info'" size="small" effect="light">
                  {{ row.intercepted === 1 ? '已拦截' : '未拦截' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="处理方式" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.autoHandled === 1" type="warning" size="small" effect="light">自动</el-tag>
                <el-tag v-else type="info" size="small" effect="light">人工</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="处理结果" min-width="140">
              <template #default="{ row }">
                <span class="detail-text">{{ row.handleResult || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="记录时间" width="180">
              <template #default="{ row }">
                <div class="time-column">
                  {{ formatDateTime(row.createTime) }}
                </div>
              </template>
            </el-table-column>
          </HtTable>
        </template>
      </el-skeleton>
    </el-card>

    <el-dialog
      v-model="progressVisible"
      title="批量处理结果"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="operating" class="progress-content">
        <div class="progress-header">
          <span class="progress-title">正在执行批量{{ batchAction === 'release_minor' ? '解除' : '封禁' }}...</span>
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
          <span>成功：{{ progressSuccess }}</span>
          <span>失败：{{ progressFail }}</span>
        </div>
        <div class="progress-detail">
          <div
            v-for="result in processedResults"
            :key="result.userId"
            class="result-item"
            :class="{ success: result.success, error: !result.success }"
          >
            <el-icon v-if="result.success" class="result-icon success">
              <CircleCheckFilled />
            </el-icon>
            <el-icon v-else class="result-icon error">
              <CircleCloseFilled />
            </el-icon>
            <span class="result-user">UID: {{ result.userId }}</span>
            <span v-if="!result.success" class="result-error">{{ result.error }}</span>
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
        <el-table v-if="progressFail > 0" :data="failResults" max-height="200">
          <el-table-column prop="userId" label="用户ID" width="100" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Unlock,
  Lock,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getRiskControlList, batchHandlePunishment } from '@api/risk-control'
import type { RiskControlLog, RiskControlPermission } from '@/types/business'
import {
  RISK_LEVEL_NAMES,
  RISK_LEVEL_COLORS,
  VIOLATION_TYPE_NAMES
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'

const userStore = useUserStore()

const isRiskAdmin = computed(() => {
  return userStore.hasRole('risk_control_admin') ||
    userStore.hasPermission('risk:control:batch:handle')
})

const permission = ref<RiskControlPermission>({
  canView: false,
  canHandle: false,
  canBatchHandle: false,
  canIntercept: false,
  canRevoke: false
})

const dateRange = ref<string[]>([])
const selectedIds = ref<number[]>([])
const batchAction = ref<'release_minor' | 'ban_severe'>('release_minor')

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<RiskControlLog>({
  fetchApi: async (params) => {
    const result = await getRiskControlList(params)
    permission.value = result.permission
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: '',
    violationType: '',
    riskLevel: undefined as number | undefined,
    intercepted: undefined as number | undefined,
    startDate: '',
    endDate: ''
  }
})

const formModel = computed({
  get: () => queryParams as Record<string, any>,
  set: () => {}
})

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.startDate = newVal[0]
    queryParams.endDate = newVal[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
})

const operating = ref(false)
const progressVisible = ref(false)
const progressPercent = ref(0)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressSuccess = ref(0)
const progressFail = ref(0)
const processedResults = ref<Array<{ userId: number; success: boolean; error?: string }>>([])
const failResults = ref<Array<{ userId: number; success: boolean; error?: string }>>([])

const handleSelectionChange = (selection: unknown[]) => {
  selectedIds.value = (selection as RiskControlLog[]).map(item => item.id)
}

const handleSelectAll = () => {
  selectedIds.value = dataList.value.map(item => item.id)
}

const handleClearSelection = () => {
  selectedIds.value = []
}

const handleReset = () => {
  dateRange.value = []
  selectedIds.value = []
  baseHandleReset()
}

const handleBatchRelease = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量解除 ${selectedIds.value.length} 条轻微违规记录的处罚吗？此操作不可撤销。`,
      '批量解除轻微违规',
      {
        confirmButtonText: '确认解除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    batchAction.value = 'release_minor'
    await executeBatch('release_minor')
  } catch {
    // cancelled
  }
}

const handleBatchBan = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量封禁 ${selectedIds.value.length} 个重度违规账号吗？此操作将导致账号无法使用，请谨慎操作。`,
      '批量封禁重度违规',
      {
        confirmButtonText: '确认封禁',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    batchAction.value = 'ban_severe'
    await executeBatch('ban_severe')
  } catch {
    // cancelled
  }
}

const executeBatch = async (action: 'release_minor' | 'ban_severe') => {
  progressVisible.value = true
  operating.value = true
  progressPercent.value = 0
  progressCurrent.value = 0
  progressTotal.value = selectedIds.value.length
  progressSuccess.value = 0
  progressFail.value = 0
  processedResults.value = []
  failResults.value = []

  try {
    const result = await batchHandlePunishment({
      userIds: selectedIds.value,
      action,
      reason: action === 'release_minor' ? '批量解除轻微违规处罚' : '批量封禁重度违规账号'
    })

    progressTotal.value = result.total
    await simulateProgress(result)

    ElMessage.success('批量操作完成')
    selectedIds.value = []
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    operating.value = false
  }
}

const simulateProgress = (
  result: { total: number; success: number; fail: number; results: Array<{ userId: number; success: boolean; error?: string }> }
) => {
  return new Promise<void>((resolve) => {
    let index = 0
    const total = result.results.length
    const interval = setInterval(() => {
      if (index < total) {
        const item = result.results[index]
        processedResults.value.push(item)
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
    }, 200)
  })
}

const handleCloseProgress = () => {
  progressVisible.value = false
  processedResults.value = []
}

onMounted(() => {
  fetchData()
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

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

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
    }
  }

  .detail-text {
    font-size: 12px;
    color: $text-secondary;
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;
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
  }

  .progress-detail {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;

    .result-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: #f5f7fa;
      border-radius: 4px;
      font-size: 12px;

      &.success {
        border-left: 3px solid #67c23a;
      }

      &.error {
        border-left: 3px solid #f56c6c;
      }

      .result-icon {
        font-size: 16px;
        flex-shrink: 0;

        &.success {
          color: #67c23a;
        }

        &.error {
          color: #f56c6c;
        }
      }

      .result-user {
        color: $text-primary;
        font-weight: 500;
      }

      .result-error {
        color: #f56c6c;
        margin-left: auto;
      }
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

.ripple-btn {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  &:active::after {
    width: 200px;
    height: 200px;
    animation: ripple-animation 0.6s ease-out;
  }
}

@keyframes ripple-animation {
  0% {
    width: 0;
    height: 0;
    opacity: 0.6;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}
</style>
