<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="110px" inline @submit.prevent>
        <el-form-item label="任务编号">
          <el-input
            v-model="queryParams.taskId"
            placeholder="输入任务ID/编号关键词"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="笔记ID">
          <el-input
            v-model="queryParams.noteId"
            placeholder="笔记ID"
            clearable
            style="width: 140px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="事件类型">
          <el-select
            v-model="queryParams.eventType"
            placeholder="全部事件"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(name, val) in PUSH_TRACE_EVENT_TYPE_NAMES"
              :key="val"
              :label="name"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select
            v-model="queryParams.anomalyType"
            placeholder="全部异常"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, val) in PUSH_TRACE_ANOMALY_TYPE_NAMES"
              :key="val"
              :label="name"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否拦截">
          <el-select
            v-model="queryParams.isBlocked"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="已拦截" :value="1" />
            <el-option label="未拦截" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">推送链路事件日志</span>
          <div class="header-tip">
            <el-icon color="#e6a23c"><InfoFilled /></el-icon>
            <span>双击任意行可查看对应推送任务的全链路数据</span>
          </div>
        </div>
      </template>

      <div class="table-wrapper resizable-table">
        <el-table
          :data="dataList"
          :loading="loading"
          border
          stripe
          :row-class-name="getRowClassName"
          @row-dblclick="handleRowDblClick"
          @header-dragend="() => {}"
        >
          <el-table-column type="index" label="序号" width="60" align="center" fixed />
          <el-table-column label="链路ID" width="170" :resizable="true">
            <template #default="{ row }">
              <span class="trace-id" @click="handleCopy(row.traceId, '链路ID')">
                {{ row.traceId }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="任务信息" min-width="260" :resizable="true">
            <template #default="{ row }">
              <div class="task-cell">
                <div class="task-no-row">
                  <span class="label">任务：</span>
                  <el-link
                    type="primary"
                    :icon="Aim"
                    :underline="false"
                    size="small"
                    @click="openFullChain(row.taskId)"
                  >
                    查看全链路
                  </el-link>
                </div>
                <div class="ids-row">
                  <span>任务ID: {{ row.taskId }}</span>
                  <span class="dot">·</span>
                  <span>笔记ID: {{ row.noteId }}</span>
                  <span v-if="row.userId" class="dot">·</span>
                  <span v-if="row.userId">用户: {{ row.userId }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="事件类型" width="130" align="center" :resizable="true">
            <template #default="{ row }">
              <el-tag
                size="small"
                effect="light"
                :color="PUSH_TRACE_EVENT_TYPE_COLORS[row.eventType] || '#909399'"
                style="color: #fff"
              >
                {{ PUSH_TRACE_EVENT_TYPE_NAMES[row.eventType] || row.eventType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="曝光" width="110" align="right" :resizable="true">
            <template #default="{ row }">
              <span v-if="row.exposureAmount" class="number-format exp">
                +{{ formatNumber(row.exposureAmount) }}
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="点击" width="100" align="right" :resizable="true">
            <template #default="{ row }">
              <span v-if="row.clickAmount" class="number-format click">
                +{{ formatNumber(row.clickAmount) }}
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="互动" width="100" align="right" :resizable="true">
            <template #default="{ row }">
              <span v-if="row.interactAmount" class="number-format interact">
                +{{ formatNumber(row.interactAmount) }}
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="异常信息" min-width="220" :resizable="true" show-overflow-tooltip>
            <template #default="{ row }">
              <template v-if="row.anomalyType || row.isBlocked === 1">
                <div class="anomaly-cell">
                  <div class="anomaly-tags">
                    <el-tag
                      v-if="row.anomalyType"
                      type="warning"
                      size="small"
                      effect="light"
                    >
                      {{ PUSH_TRACE_ANOMALY_TYPE_NAMES[row.anomalyType] || row.anomalyType }}
                    </el-tag>
                    <el-tag
                      v-if="row.isBlocked === 1"
                      type="danger"
                      size="small"
                      effect="dark"
                    >
                      已拦截
                    </el-tag>
                  </div>
                  <el-tooltip
                    v-if="row.anomalyScore"
                    :content="'异常分：' + row.anomalyScore + ' / 100'"
                    placement="top"
                  >
                    <div class="anomaly-score-bar">
                      <el-progress
                        :percentage="Number(row.anomalyScore || 0)"
                        :color="row.anomalyScore >= 80 ? '#f56c6c' : '#e6a23c'"
                        :stroke-width="4"
                        :show-text="false"
                      />
                      <span class="score-val" :class="{ high: (row.anomalyScore || 0) >= 80 }">
                        {{ row.anomalyScore }}
                      </span>
                    </div>
                  </el-tooltip>
                  <div v-if="row.anomalyDetail" class="anomaly-detail muted">
                    {{ row.anomalyDetail }}
                  </div>
                </div>
              </template>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="IP / 设备" width="180" :resizable="true" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="ip-cell">
                <div v-if="row.ipAddress" class="ip-item">
                  <el-icon><Connection /></el-icon>
                  <span class="mono">{{ row.ipAddress }}</span>
                </div>
                <el-tooltip
                  v-if="row.deviceId"
                  :content="row.deviceId"
                  placement="top"
                  effect="dark"
                >
                  <div class="device-item">
                    <el-icon><Monitor /></el-icon>
                    <span class="mono short">{{ (row.deviceId || '').slice(0, 16) }}{{ (row.deviceId || '').length > 16 ? '...' : '' }}</span>
                  </div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作人" width="120" :resizable="true">
            <template #default="{ row }">
              <span>{{ row.operatorName || '系统' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170" :resizable="true" fixed="right">
            <template #default="{ row }">
              <span class="time-cell">{{ formatDateTime(row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <FullChainDialog
      v-model="chainDialogVisible"
      :task-id="currentChainTaskId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  Search, Refresh, Aim, InfoFilled, Connection, Monitor
} from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime, formatNumber, useCopy } from '@hooks/index'
import { getContentPushTraces } from '@api/content-push'
import type { ContentPushTrace } from '@/types/business'
import {
  PUSH_TRACE_EVENT_TYPE_NAMES,
  PUSH_TRACE_EVENT_TYPE_COLORS,
  PUSH_TRACE_ANOMALY_TYPE_NAMES
} from '@/enums/business'
import FullChainDialog from './components/FullChainDialog.vue'

const userStore = useUserStore()
const { handleCopy } = useCopy()

const canView = computed(() => {
  return (
    userStore.hasRole('admin') ||
    userStore.hasRole('operation_admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('auditor')
  )
})

const dateRange = ref<string[]>([])

const queryParams = reactive({
  page: 1, pageSize: 20,
  taskId: '' as string | number,
  noteId: '' as string | number,
  eventType: '',
  anomalyType: '',
  isBlocked: undefined as number | undefined,
  startDate: '',
  endDate: '',
  keyword: ''
})

const { loading, dataList, total, fetchData, handleSearch: doSearch, handleReset: doReset } =
  useFetchList<ContentPushTrace>({
    fetchApi: getContentPushTraces,
    defaultParams: queryParams,
    immediate: false
  })

const chainDialogVisible = ref(false)
const currentChainTaskId = ref<number | null>(null)

watch(dateRange, (val) => {
  if (val && val.length === 2) {
    queryParams.startDate = val[0]
    queryParams.endDate = val[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
})

const handleSearch = () => {
  const p: any = { ...queryParams }
  if (!p.taskId) {
    if (p.taskId === '' || p.taskId === null || p.taskId === undefined) {
      delete p.taskId
    }
  } else {
    const asNum = Number(p.taskId)
    if (!isNaN(asNum) && asNum > 0) {
      p.taskId = asNum
    } else {
      p.keyword = String(p.taskId)
      delete p.taskId
    }
  }
  if (!p.noteId) delete p.noteId
  else p.noteId = Number(p.noteId) || undefined
  doSearch()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 20
  queryParams.taskId = ''
  queryParams.noteId = ''
  queryParams.eventType = ''
  queryParams.anomalyType = ''
  queryParams.isBlocked = undefined
  queryParams.startDate = ''
  queryParams.endDate = ''
  queryParams.keyword = ''
  dateRange.value = []
  doReset()
}

const getRowClassName = ({ row }: { row: ContentPushTrace }) => {
  if (row.isBlocked === 1) return 'row-blocked'
  if (row.anomalyType) return 'row-anomaly'
  return ''
}

const openFullChain = (taskId: number) => {
  currentChainTaskId.value = taskId
  chainDialogVisible.value = true
}

const handleRowDblClick = (row: ContentPushTrace) => {
  openFullChain(row.taskId)
}

onMounted(() => {
  if (canView.value) fetchData()
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
  .header-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $text-secondary;
  }

  .table-wrapper {
    :deep(.el-table) {
      th {
        background: #fafafa !important;
        font-weight: 600;
      }

      .trace-id {
        font-family: 'Consolas', monospace;
        font-size: 12px;
        color: #409eff;
        cursor: pointer;
        text-decoration: underline dotted;
      }

      .task-cell {
        .task-no-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .label {
            font-size: 12px;
            color: $text-secondary;
          }
        }
        .ids-row {
          font-size: 11px;
          color: $text-secondary;
          font-family: 'Consolas', monospace;
          display: flex;
          align-items: center;
          gap: 4px;
          .dot { color: $border-color-dark; }
        }
      }

      .number-format {
        font-family: 'DIN', monospace;
        font-weight: 600;
        &.exp { color: #409eff; }
        &.click { color: #67c23a; }
        &.interact { color: #e6a23c; }
      }

      .anomaly-cell {
        .anomaly-tags {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .anomaly-score-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          max-width: 140px;

          .el-progress {
            flex: 1;
          }

          .score-val {
            font-family: 'DIN', monospace;
            font-weight: 600;
            font-size: 12px;
            color: #e6a23c;
            width: 28px;
            text-align: right;

            &.high { color: #f56c6c; }
          }
        }

        .anomaly-detail {
          font-size: 11px;
          margin-top: 2px;
          line-height: 1.4;
        }
      }

      .ip-cell {
        font-size: 11px;
        .mono { font-family: 'Consolas', monospace; }

        .ip-item, .device-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: $text-secondary;
          margin-bottom: 2px;
        }

        .el-icon {
          font-size: 12px;
          color: $text-placeholder;
        }
      }

      .time-cell {
        font-size: 12px;
        color: $text-secondary;
      }

      .muted { color: $text-placeholder; }
    }

    :deep(.row-blocked) {
      background-color: rgba(245, 108, 108, 0.06) !important;
      td { background-color: transparent !important; }
    }
    :deep(.row-anomaly) {
      background-color: rgba(230, 162, 60, 0.04) !important;
      td { background-color: transparent !important; }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
