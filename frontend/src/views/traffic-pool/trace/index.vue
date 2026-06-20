<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="流量池">
          <el-select
            v-model="queryParams.poolId"
            placeholder="全部流量池"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="pool in poolOptions"
              :key="pool.id"
              :label="pool.poolName"
              :value="pool.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="queryParams.logType"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(name, value) in TRAFFIC_POOL_LOG_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in TRAFFIC_POOL_LOG_STATUS_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input
            v-model="queryParams.keyword"
            placeholder="操作人/流量池"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="操作时间">
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
          <span class="card-title">配置变更历史</span>
          <div class="header-actions">
            <el-tag v-if="blockedCount > 0" type="danger" effect="light">
              已拦截操作：{{ blockedCount }}
            </el-tag>
          </div>
        </div>
      </template>

      <div class="table-wrapper resizable-table" ref="tableWrapperRef">
        <el-table
          ref="tableRef"
          :data="dataList"
          :loading="loading"
          border
          stripe
          :row-class-name="getRowClassName"
          @header-dragend="handleHeaderDragEnd"
        >
          <el-table-column type="index" label="序号" width="60" align="center" fixed />
          <el-table-column
            prop="poolName"
            label="流量池"
            min-width="160"
            :resizable="true"
          >
            <template #default="{ row }">
              <div class="pool-cell">
                <span class="pool-name">{{ row.poolName }}</span>
                <el-tag size="small" type="info" effect="plain">#{{ row.poolId }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="logType"
            label="操作类型"
            width="130"
            :resizable="true"
            align="center"
          >
            <template #default="{ row }">
              <el-tag size="small" effect="light">
                {{ TRAFFIC_POOL_LOG_TYPE_NAMES[row.logType] || row.logType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="执行状态"
            width="100"
            :resizable="true"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="TRAFFIC_POOL_LOG_STATUS_TAG_TYPES[row.status]"
                effect="light"
              >
                {{ TRAFFIC_POOL_LOG_STATUS_NAMES[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="oldDailyQuota"
            label="原配额"
            width="140"
            :resizable="true"
            align="right"
          >
            <template #default="{ row }">
              <span v-if="row.oldDailyQuota !== undefined && row.oldDailyQuota !== null" class="number-cell">
                {{ formatNumber(row.oldDailyQuota) }}
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="newDailyQuota"
            label="新配额"
            width="140"
            :resizable="true"
            align="right"
          >
            <template #default="{ row }">
              <span
                v-if="row.newDailyQuota !== undefined && row.newDailyQuota !== null"
                class="number-cell"
                :class="{
                  'highlight-increase':
                    row.oldDailyQuota !== undefined &&
                    row.oldDailyQuota !== null &&
                    Number(row.newDailyQuota) > Number(row.oldDailyQuota),
                  'highlight-decrease':
                    row.oldDailyQuota !== undefined &&
                    row.oldDailyQuota !== null &&
                    Number(row.newDailyQuota) < Number(row.oldDailyQuota)
                }"
              >
                {{ formatNumber(row.newDailyQuota) }}
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="权重变化"
            width="130"
            :resizable="true"
            align="center"
          >
            <template #default="{ row }">
              <div v-if="row.oldWeightMultiplier !== undefined && row.newWeightMultiplier !== undefined">
                <span class="weight-old">x{{ Number(row.oldWeightMultiplier).toFixed(2) }}</span>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                <span
                  class="weight-new"
                  :class="{
                    'highlight-increase': Number(row.newWeightMultiplier) > Number(row.oldWeightMultiplier),
                    'highlight-decrease': Number(row.newWeightMultiplier) < Number(row.oldWeightMultiplier)
                  }"
                >
                  x{{ Number(row.newWeightMultiplier).toFixed(2) }}
                </span>
              </div>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="affectedContentCount"
            label="影响内容数"
            width="120"
            :resizable="true"
            align="right"
          >
            <template #default="{ row }">
              <span class="number-cell">{{ formatNumber(row.affectedContentCount) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="blockReason"
            label="拦截/说明"
            min-width="180"
            :resizable="true"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span v-if="row.blockReason" class="block-reason">{{ row.blockReason }}</span>
              <span v-else-if="row.reason" class="reason-text">{{ row.reason }}</span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="operatorName"
            label="操作人"
            width="120"
            :resizable="true"
          >
            <template #default="{ row }">
              <div class="operator-cell">
                <span>{{ row.operatorName || '系统' }}</span>
                <el-tag v-if="row.operatorRole" size="small" type="info" effect="plain">
                  {{ row.operatorRole }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="createTime"
            label="操作时间"
            width="170"
            :resizable="true"
          >
            <template #default="{ row }">
              <span class="time-cell">{{ formatDateTime(row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleAnalyze(row)">
                分析
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <LogAnalyzeDialog
      v-model="analyzeDialogVisible"
      :log-id="currentLogId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Refresh, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { formatDateTime, formatNumber } from '@hooks/index'
import {
  getTrafficPoolLogs,
  getTrafficPoolList
} from '@api/traffic-pool'
import type { TrafficPoolLog } from '@/types/business'
import {
  TRAFFIC_POOL_LOG_TYPE_NAMES,
  TRAFFIC_POOL_LOG_STATUS_NAMES,
  TRAFFIC_POOL_LOG_STATUS_TAG_TYPES,
  TrafficPoolLogStatus
} from '@/enums/business'
import LogAnalyzeDialog from './components/LogAnalyzeDialog.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return (
    userStore.hasRole('admin') ||
    userStore.hasRole('operation_admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator')
  )
})

const tableRef = ref()
const tableWrapperRef = ref()

const dateRange = ref<string[]>([])
const poolOptions = ref<Array<{ id: number; poolName: string }>>([])

const queryParams = ref({
  page: 1,
  pageSize: 20,
  poolId: undefined as number | undefined,
  logType: '',
  status: undefined as number | undefined,
  keyword: '',
  startDate: '',
  endDate: ''
})

const loading = ref(false)
const dataList = ref<TrafficPoolLog[]>([])
const total = ref(0)

const blockedCount = computed(() => {
  return dataList.value.filter((l) => l.status === TrafficPoolLogStatus.BLOCKED).length
})

const analyzeDialogVisible = ref(false)
const currentLogId = ref<number | null>(null)

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.value.startDate = newVal[0]
    queryParams.value.endDate = newVal[1]
  } else {
    queryParams.value.startDate = ''
    queryParams.value.endDate = ''
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await getTrafficPoolLogs(queryParams.value)
    dataList.value = result.list
    total.value = result.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchPoolOptions = async () => {
  try {
    const result = await getTrafficPoolList({ page: 1, pageSize: 100 })
    poolOptions.value = result.list.map((p) => ({ id: p.id, poolName: p.poolName }))
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = () => {
  queryParams.value.page = 1
  fetchData()
}

const handleReset = () => {
  queryParams.value = {
    page: 1,
    pageSize: 20,
    poolId: undefined,
    logType: '',
    status: undefined,
    keyword: '',
    startDate: '',
    endDate: ''
  }
  dateRange.value = []
  fetchData()
}

const getRowClassName = ({ row }: { row: TrafficPoolLog }) => {
  if (row.status === TrafficPoolLogStatus.BLOCKED) {
    return 'row-blocked'
  }
  if (row.status === TrafficPoolLogStatus.FAILED) {
    return 'row-failed'
  }
  return ''
}

const handleHeaderDragEnd = (_newWidth: number, _oldWidth: number, _column: any, _event: any) => {
}

const handleAnalyze = (row: TrafficPoolLog) => {
  currentLogId.value = row.id
  analyzeDialogVisible.value = true
}

onMounted(() => {
  if (canView.value) {
    fetchData()
    fetchPoolOptions()
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

  .table-wrapper {
    :deep(.el-table) {
      .resizable {
        position: relative;
      }

      th {
        background: #fafafa !important;
        font-weight: 600;
        color: $text-primary;
      }

      .number-cell {
        font-family: 'DIN', monospace;
        font-weight: 500;
        color: $text-primary;

        &.highlight-increase {
          color: #67c23a;
          font-weight: 600;
        }

        &.highlight-decrease {
          color: #f56c6c;
          font-weight: 600;
        }
      }

      .weight-old {
        color: $text-secondary;
        font-family: 'DIN', monospace;
      }

      .weight-new {
        font-family: 'DIN', monospace;
        font-weight: 600;
        color: $text-primary;

        &.highlight-increase {
          color: #67c23a;
        }

        &.highlight-decrease {
          color: #f56c6c;
        }
      }

      .arrow-icon {
        color: $text-placeholder;
        font-size: 12px;
        margin: 0 4px;
      }

      .pool-cell {
        display: flex;
        align-items: center;
        gap: 8px;

        .pool-name {
          font-weight: 500;
          color: $text-primary;
        }
      }

      .operator-cell {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .block-reason {
        color: #f56c6c;
        font-size: 12px;
      }

      .reason-text {
        color: $text-secondary;
        font-size: 12px;
      }

      .muted {
        color: $text-placeholder;
      }

      .time-cell {
        font-size: 12px;
        color: $text-secondary;
      }
    }

    :deep(.row-blocked) {
      background-color: rgba(245, 108, 108, 0.05) !important;

      td {
        background-color: transparent !important;
      }
    }

    :deep(.row-failed) {
      background-color: rgba(230, 162, 60, 0.05) !important;

      td {
        background-color: transparent !important;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
