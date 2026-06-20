<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="流量池">
          <el-input
            v-model="queryParams.keyword"
            placeholder="名称/编码"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="等级">
          <el-select
            v-model="queryParams.poolLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in TRAFFIC_POOL_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select
            v-model="queryParams.contentAdaptType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in CONTENT_ADAPT_TYPE_NAMES"
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
            <el-option label="已启用" :value="1" />
            <el-option label="已停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button :icon="Select" @click="handleSelectAll">全选</el-button>
          <el-button :icon="Close" @click="handleClearSelection">清除选择</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mb-20">
      <template #header>
        <div class="card-header">
          <span class="card-title">批量运营操作</span>
          <div class="header-actions">
            <span class="selected-count">
              已选择 <span class="count-num">{{ selectedRows.length }}</span> 个流量池
            </span>
          </div>
        </div>
      </template>
      <div class="batch-actions">
        <div class="action-group">
          <div class="group-title">配额调整</div>
          <div class="group-content">
            <el-input-number
              v-model="batchForm.dailyQuota"
              :min="0"
              :max="PLATFORM_TOTAL_FLOW_QUOTA"
              :step="10000"
              placeholder="日流量配额"
              style="width: 220px"
            />
            <el-button
              type="primary"
              :icon="DataLine"
              :loading="submitting"
              :disabled="selectedRows.length === 0"
              @click="handleBatchQuota"
              class="ripple-btn"
            >
              批量调整配额
            </el-button>
          </div>
        </div>

        <el-divider direction="vertical" />

        <div class="action-group">
          <div class="group-title">准入规则</div>
          <div class="group-content">
            <el-input-number
              v-model="batchForm.minContentScore"
              :min="0"
              :max="100"
              :step="5"
              placeholder="最低质量分"
              style="width: 150px"
            />
            <el-input-number
              v-model="batchForm.maxViolationCount"
              :min="0"
              :max="10"
              :step="1"
              placeholder="最大违规次数"
              style="width: 150px"
            />
            <el-button
              type="warning"
              :icon="Setting"
              :loading="submitting"
              :disabled="selectedRows.length === 0"
              @click="handleBatchRules"
              class="ripple-btn"
            >
              批量修改规则
            </el-button>
          </div>
        </div>

        <el-divider direction="vertical" />

        <div class="action-group">
          <div class="group-title">启停控制</div>
          <div class="group-content">
            <el-button
              type="success"
              :icon="VideoPlay"
              :loading="submitting"
              :disabled="selectedRows.length === 0 || !permission.canBatchStartStop"
              @click="handleBatchToggle(1)"
              class="ripple-btn"
            >
              批量启用
            </el-button>
            <el-button
              type="danger"
              :icon="VideoPause"
              :loading="submitting"
              :disabled="selectedRows.length === 0 || !permission.canBatchStartStop"
              @click="handleBatchToggle(0)"
              class="ripple-btn"
            >
              批量停用
            </el-button>
            <el-tooltip
              v-if="!permission.canBatchStartStop"
              content="需高级权限账号方可执行批量启停操作"
              placement="top"
            >
              <el-icon class="help-icon"><Warning /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">流量池选择</span>
        </div>
      </template>
      <HtTable
        ref="tableRef"
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @selection-change="handleSelectionChange"
        @paginate="handlePaginate"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="流量池信息" min-width="220">
          <template #default="{ row }">
            <div class="pool-info">
              <div class="pool-name-row">
                <span class="pool-name">{{ row.poolName }}</span>
                <el-tag
                  class="level-tag"
                  :color="TRAFFIC_POOL_LEVEL_COLORS[row.poolLevel]"
                  effect="dark"
                  size="small"
                >
                  {{ TRAFFIC_POOL_LEVEL_NAMES[row.poolLevel] }}
                </el-tag>
              </div>
              <div class="pool-code">编码：{{ row.poolCode }}</div>
              <div class="pool-status">
                <el-tag
                  :type="row.status === 1 ? 'success' : 'danger'"
                  effect="plain"
                  size="small"
                >
                  {{ row.status === 1 ? '已启用' : '已停用' }}
                </el-tag>
                <el-tag size="small" type="info" effect="plain">
                  {{ CONTENT_ADAPT_TYPE_NAMES[row.contentAdaptType] }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="当前配置" min-width="260">
          <template #default="{ row }">
            <div class="current-config">
              <div class="config-item">
                <span class="config-label">日配额：</span>
                <span class="config-value">{{ formatNumber(row.dailyQuota) }}</span>
              </div>
              <div class="config-item">
                <span class="config-label">权重：</span>
                <span class="config-value weight-value">x{{ Number(row.weightMultiplier).toFixed(2) }}</span>
              </div>
              <div class="config-item">
                <span class="config-label">准入：</span>
                <span class="config-value">
                  质量分≥{{ row.minContentScore }}，违规≤{{ row.maxViolationCount }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="池内数据" min-width="160">
          <template #default="{ row }">
            <div class="pool-stats">
              <div>内容数：<b>{{ formatNumber(row.contentCount) }}</b></div>
              <div>均曝光：<b>{{ formatNumber(row.avgExposure) }}</b></div>
            </div>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <BatchResultDialog
      v-model="resultDialogVisible"
      :result="batchResult"
      :operation-type="currentOperationType"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  Search,
  Refresh,
  Select,
  Close,
  DataLine,
  Setting,
  VideoPlay,
  VideoPause,
  Warning
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatNumber } from '@hooks/index'
import {
  getTrafficPoolList,
  batchUpdateTrafficPoolQuota,
  batchUpdateTrafficPoolRules,
  batchToggleTrafficPoolStatus
} from '@api/traffic-pool'
import type { TrafficPool, TrafficPoolPermission, BatchOperationResult } from '@/types/business'
import {
  TRAFFIC_POOL_LEVEL_NAMES,
  TRAFFIC_POOL_LEVEL_COLORS,
  CONTENT_ADAPT_TYPE_NAMES,
  PLATFORM_TOTAL_FLOW_QUOTA
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import BatchResultDialog from './components/BatchResultDialog.vue'

const userStore = useUserStore()
const tableRef = ref()

const canView = computed(() => {
  return (
    userStore.hasRole('admin') ||
    userStore.hasRole('operation_admin') ||
    userStore.hasRole('senior_operator')
  )
})

const permission = ref<TrafficPoolPermission>({
  canView: false,
  canCreate: false,
  canEdit: false,
  canBatch: false,
  canBatchStartStop: false,
  canViewLogs: false
})

const selectedRows = ref<TrafficPool[]>([])

const batchForm = reactive({
  dailyQuota: 1000000,
  minContentScore: 60,
  maxViolationCount: 3
})

const submitting = ref(false)
const resultDialogVisible = ref(false)
const batchResult = ref<BatchOperationResult | null>(null)
const currentOperationType = ref<'quota' | 'rules' | 'enable' | 'disable'>('quota')

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<TrafficPool, Record<string, unknown>>({
  fetchApi: async (params) => {
    const result = await getTrafficPoolList(params)
    permission.value = result.permission
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    keyword: '',
    poolLevel: undefined,
    contentAdaptType: '',
    status: undefined
  }
})

const getRowClassName = ({ row }: { row: TrafficPool }) => {
  if (selectedRows.value.some((s) => s.id === row.id)) {
    return 'row-selected-highlight'
  }
  return ''
}

const handleSelectionChange = (rows: unknown[]) => {
  selectedRows.value = rows as TrafficPool[]
  nextTick(() => {
    tableRef.value?.updateSelectedHighlight?.()
  })
}

const handleSelectAll = () => {
  tableRef.value?.getTableRef()?.toggleAllSelection(true)
}

const handleClearSelection = () => {
  tableRef.value?.getTableRef()?.clearSelection()
  selectedRows.value = []
}

const showReasonDialog = async (title: string, hasContent: boolean) => {
  if (hasContent) {
    const { value } = await ElMessageBox.prompt(
      '部分流量池内包含内容，请输入操作原因：',
      title,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入操作原因',
        inputValidator: (v) => (v && v.trim() ? true : '请输入操作原因'),
        type: 'warning'
      }
    )
    return value
  }
  await ElMessageBox.confirm(`确认执行${title}吗？`, '确认操作', {
    type: 'warning',
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
  return ''
}

const handleBatchQuota = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择流量池')
    return
  }
  currentOperationType.value = 'quota'
  try {
    await ElMessageBox.confirm(
      `将 ${selectedRows.value.length} 个流量池的日配额统一调整为 ${formatNumber(batchForm.dailyQuota)}，确认继续？`,
      '批量调整配额',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
    submitting.value = true
    const result = await batchUpdateTrafficPoolQuota({
      ids: selectedRows.value.map((r) => r.id),
      dailyQuota: batchForm.dailyQuota
    })
    batchResult.value = result
    resultDialogVisible.value = true
    fetchData()
    handleClearSelection()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleBatchRules = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择流量池')
    return
  }
  currentOperationType.value = 'rules'
  try {
    await ElMessageBox.confirm(
      `将 ${selectedRows.value.length} 个流量池准入规则统一设置为：质量分≥${batchForm.minContentScore}，违规≤${batchForm.maxViolationCount}次，确认继续？`,
      '批量修改规则',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
    submitting.value = true
    const result = await batchUpdateTrafficPoolRules({
      ids: selectedRows.value.map((r) => r.id),
      minContentScore: batchForm.minContentScore,
      maxViolationCount: batchForm.maxViolationCount
    })
    batchResult.value = result
    resultDialogVisible.value = true
    fetchData()
    handleClearSelection()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleBatchToggle = async (status: number) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择流量池')
    return
  }
  if (!permission.value.canBatchStartStop) {
    ElMessage.error('需高级权限账号方可执行批量启停操作')
    return
  }
  const actionName = status === 1 ? '启用' : '停用'
  currentOperationType.value = status === 1 ? 'enable' : 'disable'
  const hasContent = selectedRows.value.some((r) => Number(r.contentCount) > 0)
  try {
    const reason = await showReasonDialog(`批量${actionName}`, status === 0 && hasContent)
    submitting.value = true
    const result = await batchToggleTrafficPoolStatus({
      ids: selectedRows.value.map((r) => r.id),
      status,
      reason: reason || undefined
    })
    batchResult.value = result
    resultDialogVisible.value = true
    fetchData()
    handleClearSelection()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '操作失败')
    }
  } finally {
    submitting.value = false
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
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-actions {
    .selected-count {
      font-size: 13px;
      color: $text-secondary;

      .count-num {
        color: #409eff;
        font-weight: 600;
        font-size: 16px;
        margin: 0 4px;
      }
    }
  }

  .batch-actions {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    padding: 8px 0;
    flex-wrap: wrap;

    .action-group {
      flex: 1;
      min-width: 260px;

      .group-title {
        font-size: 13px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 12px;
        padding-left: 8px;
        border-left: 3px solid #409eff;
      }

      .group-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
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
        transition: width 0.4s, height 0.4s;
      }

      &:active::after {
        width: 300px;
        height: 300px;
        transition: 0s;
      }
    }

    .help-icon {
      color: #e6a23c;
      font-size: 18px;
      cursor: help;
    }
  }

  .pool-info {
    .pool-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .pool-name {
        font-weight: 600;
        color: $text-primary;
      }

      .level-tag {
        font-size: 11px;
      }
    }

    .pool-code {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 6px;
    }

    .pool-status {
      display: flex;
      gap: 6px;
    }
  }

  .current-config {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;

    .config-item {
      display: flex;

      .config-label {
        color: $text-secondary;
        min-width: 64px;
      }

      .config-value {
        color: $text-primary;
        font-weight: 500;

        &.weight-value {
          color: #e6a23c;
          font-family: 'DIN', monospace;
        }
      }
    }
  }

  .pool-stats {
    font-size: 12px;
    color: $text-secondary;
    line-height: 1.8;

    b {
      color: $text-primary;
      font-family: 'DIN', monospace;
    }
  }

  :deep(.row-selected-highlight) {
    background-color: rgba(64, 158, 255, 0.08) !important;

    td {
      background-color: transparent !important;
    }
  }
}
</style>
