<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <div class="quota-stats">
        <div class="stat-card total-card">
          <div class="stat-label">平台总流量配额</div>
          <div class="stat-value">{{ formatNumber(quotaStats.platformMax) }}</div>
          <div class="stat-sub">使用率 {{ quotaStats.usageRate?.toFixed(2) }}%</div>
        </div>
        <div
          v-for="(stat, level) in quotaStats.byLevel"
          :key="level"
          class="stat-card"
          :style="{ borderLeftColor: TRAFFIC_POOL_LEVEL_COLORS[Number(level)] }"
        >
          <div class="stat-label" :style="{ color: TRAFFIC_POOL_LEVEL_COLORS[Number(level)] }">
            {{ TRAFFIC_POOL_LEVEL_NAMES[Number(level)] }}
          </div>
          <div class="stat-value">{{ formatNumber(stat.quota) }}</div>
          <div class="stat-progress">
            <el-progress
              :percentage="quotaStats.levelRatios?.[Number(level)]?.usageRate || 0"
              :stroke-width="6"
              :color="TRAFFIC_POOL_LEVEL_COLORS[Number(level)]"
              show-text
            />
          </div>
          <div class="stat-sub">已用 {{ formatNumber(stat.used) }}</div>
        </div>
      </div>
    </el-card>

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
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">流量池列表</span>
          <div class="header-actions">
            <el-tag
              v-if="permission.canBatchStartStop"
              type="success"
              effect="light"
              class="permission-tag"
            >
              批量启停权限
            </el-tag>
            <el-button
              v-if="permission.canCreate"
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              新建流量池
            </el-button>
            <BatchActions
              v-model:selected-rows="selectedRows"
              :actions="batchActions"
              @action="handleBatchAction"
            />
          </div>
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
        <el-table-column label="流量池信息" min-width="240">
          <template #default="{ row }">
            <div class="pool-info">
              <div class="pool-name-row">
                <span class="pool-name">{{ row.poolName }}</span>
                <el-tag
                  class="level-tag"
                  :type="TRAFFIC_POOL_LEVEL_TAG_TYPES[row.poolLevel]"
                  :color="TRAFFIC_POOL_LEVEL_COLORS[row.poolLevel]"
                  effect="dark"
                  size="small"
                >
                  {{ TRAFFIC_POOL_LEVEL_NAMES[row.poolLevel] }}
                </el-tag>
              </div>
              <div class="pool-code">编码：{{ row.poolCode }}</div>
              <div class="pool-adapt">
                <el-tag size="small" type="info" effect="plain">
                  {{ CONTENT_ADAPT_TYPE_NAMES[row.contentAdaptType] }}
                </el-tag>
                <el-tag
                  v-if="row.status === TrafficPoolStatus.ENABLED"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  已启用
                </el-tag>
                <el-tag v-else size="small" type="danger" effect="plain">已停用</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="配额情况" min-width="220">
          <template #default="{ row }">
            <div class="quota-info">
              <div class="quota-header">
                <span class="quota-label">日配额</span>
                <span class="quota-total">{{ formatNumber(row.dailyQuota) }}</span>
              </div>
              <el-progress
                :percentage="row.dailyQuota > 0 ? Math.min(100, (row.usedQuota / row.dailyQuota) * 100) : 0"
                :stroke-width="8"
                :color="getQuotaColor(row)"
              />
              <div class="quota-detail">
                <span>已用 {{ formatNumber(row.usedQuota) }}</span>
                <span>剩余 {{ formatNumber(row.remainingQuota) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分发权重" width="140" align="center">
          <template #default="{ row }">
            <div
              class="weight-value"
              :class="{ 'weight-highlight': row.weightMultiplier > 1.5 }"
            >
              x{{ Number(row.weightMultiplier).toFixed(2) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="准入规则" min-width="180">
          <template #default="{ row }">
            <div class="admission-rules">
              <div class="rule-item">
                <span class="rule-label">质量分≥</span>
                <span class="rule-value">{{ row.minContentScore }}</span>
              </div>
              <div class="rule-item">
                <span class="rule-label">违规≤</span>
                <span class="rule-value">{{ row.maxViolationCount }}次</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="池内数据" min-width="180">
          <template #default="{ row }">
            <div class="pool-stats">
              <div class="stat-item">
                <span class="stat-label">内容数</span>
                <span class="stat-num">{{ formatNumber(row.contentCount) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">均曝光</span>
                <span class="stat-num">{{ formatNumber(row.avgExposure) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">点击率</span>
                <span class="stat-num">{{ (Number(row.clickRate) * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">
            <div class="time-column">{{ formatDateTime(row.updateTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="permission.canEdit"
              link
              type="warning"
              size="small"
              @click="handleEdit(row)"
            >
              配置
            </el-button>
            <el-button
              v-if="permission.canEdit && row.status === TrafficPoolStatus.ENABLED"
              link
              type="info"
              size="small"
              @click="handleToggleStatus(row, TrafficPoolStatus.DISABLED)"
            >
              停用
            </el-button>
            <el-button
              v-if="permission.canEdit && row.status === TrafficPoolStatus.DISABLED"
              link
              type="success"
              size="small"
              @click="handleToggleStatus(row, TrafficPoolStatus.ENABLED)"
            >
              启用
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <TrafficPoolDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :pool-data="currentPool"
      :quota-stats="quotaStats"
      @saved="handleDataUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime, formatNumber } from '@hooks/index'
import {
  getTrafficPoolList,
  getTrafficPoolQuotaStats,
  updateTrafficPool,
  batchToggleTrafficPoolStatus
} from '@api/traffic-pool'
import type { TrafficPool, TrafficPoolPermission } from '@/types/business'
import {
  TRAFFIC_POOL_LEVEL_NAMES,
  TRAFFIC_POOL_LEVEL_COLORS,
  TRAFFIC_POOL_LEVEL_TAG_TYPES,
  TrafficPoolStatus,
  CONTENT_ADAPT_TYPE_NAMES
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'
import TrafficPoolDialog from './components/TrafficPoolDialog.vue'

const userStore = useUserStore()
const tableRef = ref()

const canView = computed(() => {
  return (
    userStore.hasRole('admin') ||
    userStore.hasRole('operation_admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator')
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

const quotaStats = ref<any>({
  platformMax: 0,
  totalQuota: 0,
  totalUsed: 0,
  totalRemaining: 0,
  usageRate: 0,
  byLevel: {},
  levelRatios: {}
})

const selectedRows = ref<TrafficPool[]>([])

const batchActions = computed(() => {
  const actions: Array<{ key: string; label: string; type: string; permission?: boolean }> = []
  if (permission.value.canBatch) {
    actions.push({ key: 'enable', label: '批量启用', type: 'success', permission: permission.value.canBatchStartStop })
    actions.push({ key: 'disable', label: '批量停用', type: 'danger', permission: permission.value.canBatchStartStop })
  }
  return actions.filter((a) => a.permission !== false)
})

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

watch(selectedRows, () => {
  nextTick(() => {
    if (tableRef.value) {
      tableRef.value.updateSelectedHighlight?.()
    }
  })
})

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const currentPool = ref<TrafficPool | null>(null)

const fetchQuotaStats = async () => {
  try {
    quotaStats.value = await getTrafficPoolQuotaStats()
  } catch (e) {
    console.error(e)
  }
}

const getQuotaColor = (row: TrafficPool) => {
  const ratio = row.dailyQuota > 0 ? row.usedQuota / row.dailyQuota : 0
  if (ratio >= 0.9) return '#f56c6c'
  if (ratio >= 0.7) return '#e6a23c'
  return TRAFFIC_POOL_LEVEL_COLORS[row.poolLevel] || '#409eff'
}

const getRowClassName = ({ row }: { row: TrafficPool }) => {
  if (selectedRows.value.some((s) => s.id === row.id)) {
    return 'row-selected-highlight'
  }
  return ''
}

const handleSelectionChange = (rows: unknown[]) => {
  selectedRows.value = rows as TrafficPool[]
}

const handleCreate = () => {
  dialogMode.value = 'create'
  currentPool.value = null
  dialogVisible.value = true
}

const handleEdit = (row: TrafficPool) => {
  dialogMode.value = 'edit'
  currentPool.value = { ...row }
  dialogVisible.value = true
}

const handleViewDetail = (row: TrafficPool) => {
  dialogMode.value = 'view'
  currentPool.value = { ...row }
  dialogVisible.value = true
}

const handleToggleStatus = async (row: TrafficPool, status: number) => {
  const actionName = status === TrafficPoolStatus.ENABLED ? '启用' : '停用'
  try {
    if (status === TrafficPoolStatus.DISABLED && Number(row.contentCount) > 0) {
      const { value } = await ElMessageBox.prompt(
        `该流量池内有${formatNumber(row.contentCount)}条内容，停用将影响内容曝光。请输入停用原因：`,
        `确认${actionName}`,
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入停用原因',
          inputValidator: (v) => (v && v.trim() ? true : '请输入停用原因'),
          type: 'warning'
        }
      )
      await updateTrafficPool(row.id, { status, reason: value })
    } else {
      await ElMessageBox.confirm(
        `确认${actionName}流量池【${row.poolName}】吗？`,
        `确认${actionName}`,
        { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
      )
      await updateTrafficPool(row.id, { status })
    }
    ElMessage.success(`${actionName}成功，配置已即时生效`)
    handleDataUpdated()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || `${actionName}失败`)
    }
  }
}

const handleBatchAction = async (actionKey: string) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择流量池')
    return
  }
  const ids = selectedRows.value.map((r) => r.id)
  let status = TrafficPoolStatus.ENABLED
  let actionName = '启用'
  if (actionKey === 'disable') {
    status = TrafficPoolStatus.DISABLED
    actionName = '停用'
  }

  const hasContent = selectedRows.value.some((r) => Number(r.contentCount) > 0)

  try {
    if (status === TrafficPoolStatus.DISABLED && hasContent) {
      const { value } = await ElMessageBox.prompt(
        `选中的流量池中包含内容，批量停用将影响曝光。请输入停用原因：`,
        `确认批量${actionName}`,
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入停用原因',
          inputValidator: (v) => (v && v.trim() ? true : '请输入停用原因'),
          type: 'warning'
        }
      )
      await batchToggleTrafficPoolStatus({ ids, status, reason: value })
    } else {
      await ElMessageBox.confirm(
        `确认批量${actionName}选中的 ${ids.length} 个流量池吗？`,
        `确认批量${actionName}`,
        { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
      )
      await batchToggleTrafficPoolStatus({ ids, status })
    }
    ElMessage.success(`批量${actionName}操作完成`)
    handleDataUpdated()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || `批量${actionName}失败`)
    }
  }
}

const handleDataUpdated = () => {
  fetchData()
  fetchQuotaStats()
  selectedRows.value = []
}

onMounted(() => {
  if (canView.value) {
    fetchData()
    fetchQuotaStats()
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  .quota-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    .stat-card {
      flex: 1;
      min-width: 180px;
      padding: 16px 20px;
      background: #fafbfc;
      border-radius: 8px;
      border-left: 3px solid #409eff;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      &.total-card {
        border-left-color: #303133;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        .stat-label,
        .stat-value,
        .stat-sub {
          color: #fff !important;
        }
      }
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .stat-progress {
      margin: 6px 0;
    }

    .stat-sub {
      font-size: 12px;
      color: #909399;
    }
  }

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

    .permission-tag {
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%,
      100% {
        box-shadow: 0 0 5px rgba(103, 194, 58, 0.3);
      }
      50% {
        box-shadow: 0 0 12px rgba(103, 194, 58, 0.6);
      }
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
        font-size: 14px;
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

    .pool-adapt {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
  }

  .quota-info {
    .quota-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .quota-label {
        font-size: 12px;
        color: $text-secondary;
      }

      .quota-total {
        font-weight: 600;
        color: $text-primary;
      }
    }

    .quota-detail {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .weight-value {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    font-family: 'DIN', monospace;
    transition: all 0.4s;

    &.weight-highlight {
      color: #e6a23c;
      text-shadow: 0 0 8px rgba(230, 162, 60, 0.4);
      animation: weight-pulse 1.5s ease-in-out infinite;
    }

    @keyframes weight-pulse {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
  }

  .admission-rules {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .rule-item {
      display: flex;
      gap: 8px;
      font-size: 13px;

      .rule-label {
        color: $text-secondary;
        min-width: 56px;
      }

      .rule-value {
        font-weight: 600;
        color: $text-primary;
      }
    }
  }

  .pool-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .stat-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;

      .stat-label {
        color: $text-secondary;
      }

      .stat-num {
        font-weight: 600;
        color: $text-primary;
        font-family: 'DIN', monospace;
      }
    }
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;
  }

  :deep(.row-selected-highlight) {
    background-color: rgba(64, 158, 255, 0.08) !important;

    td {
      background-color: transparent !important;
    }
  }
}
</style>
