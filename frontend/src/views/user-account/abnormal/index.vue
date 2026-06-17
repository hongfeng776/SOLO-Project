<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card high">
            <div class="stat-icon">
              <el-icon :size="28"><WarningFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-count">{{ stats.total }}</div>
              <div class="stat-label">异常总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card danger">
            <div class="stat-icon">
              <el-icon :size="28"><CircleCloseFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-count">{{ stats.high }}</div>
              <div class="stat-label">高危异常</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-icon">
              <el-icon :size="28"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-count">{{ stats.medium }}</div>
              <div class="stat-label">中危异常</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-icon">
              <el-icon :size="28"><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-count">{{ stats.handled }}</div>
              <div class="stat-label">已处理</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="异常类型">
          <el-select
            v-model="queryParams.abnormalType"
            placeholder="全部类型"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="(name, value) in USER_ABNORMAL_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select
            v-model="queryParams.severity"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option label="高危" :value="3" />
            <el-option label="中危" :value="2" />
            <el-option label="低危" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="queryParams.handled"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="待处理" :value="0" />
            <el-option label="已处理" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="检测时间">
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
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-tooltip
            v-if="!canExport"
            content="无权限导出"
            placement="top"
          >
            <el-button :icon="Download" disabled>导出台账</el-button>
          </el-tooltip>
          <el-button
            v-else
            type="success"
            :icon="Download"
            @click="handleExport"
          >
            导出台账
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">异常台账</span>
          <span class="tip">共 {{ total }} 条记录，双击查看详情</span>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        highlight-current-row
        row-key="id"
        @paginate="handlePaginate"
        @row-dblclick="handleRowDoubleClick"
        :row-class-name="getRowClassName"
      >
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <div class="avatar-wrapper">
                <el-avatar :size="44" :src="row.user?.avatar">{{ row.user?.nickname?.charAt(0) }}</el-avatar>
              </div>
              <div class="info-text">
                <div class="user-name">
                  {{ row.user?.nickname }}
                  <el-tag
                    class="abnormal-tag"
                    :type="getAbnormalTagType(row.severity)"
                    effect="dark"
                    size="small"
                  >
                    {{ row.severity === 3 ? '高危' : row.severity === 2 ? '中危' : '低危' }}
                  </el-tag>
                </div>
                <div class="user-extra">
                  <span class="user-uid">UID: {{ row.userId }}</span>
                  <span>{{ row.user?.username }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="abnormalType" label="异常类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getAbnormalTagType(row.severity)" effect="light" size="small">
              {{ USER_ABNORMAL_TYPE_NAMES[row.abnormalType] || row.abnormalType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="abnormalDetail" label="异常描述" min-width="240" show-overflow-tooltip />

        <el-table-column label="信息完整度" width="140">
          <template #default="{ row }">
            <el-progress
              :percentage="row.user?.infoCompleteness || 0"
              :stroke-width="8"
              :color="(row.user?.infoCompleteness || 0) >= 80 ? '#67c23a' : (row.user?.infoCompleteness || 0) >= 60 ? '#e6a23c' : '#f56c6c'"
              style="width: 100%"
            />
          </template>
        </el-table-column>

        <el-table-column label="检测时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.detectedTime) }}</template>
        </el-table-column>

        <el-table-column label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.handled === 1 ? 'success' : 'warning'"
              effect="light"
              size="small"
            >
              {{ row.handled === 1 ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="处理人" width="100">
          <template #default="{ row }">{{ row.handlerName || '-' }}</template>
        </el-table-column>

        <el-table-column label="处理结果" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.handleResult || '-' }}</template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewTrace(row)"
            >
              溯源详情
            </el-button>
            <el-button
              v-if="row.handled !== 1"
              link
              type="success"
              size="small"
              @click="handleMarkHandled(row)"
            >
              标记处理
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              @click="handleViewUser(row)"
            >
              用户详情
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <TraceDetailDialog
      v-model="traceDialogVisible"
      :log-id="currentLogId"
      @handled="handleDataUpdated"
    />

    <HandleAbnormalDialog
      v-model="handleDialogVisible"
      :log-id="currentLogId"
      @handled="handleDataUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Download,
  Warning,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { useFetchList, formatDateTime } from '@/hooks/index'
import { getAbnormalUsers } from '@api/user-account'
import type { UserAbnormalLog } from '@/types/business'
import { USER_ABNORMAL_TYPE_NAMES } from '@/enums/business'
import HtTable from '@/components/HtTable/index.vue'
import TraceDetailDialog from '../trace/components/TraceDetailDialog.vue'
import HandleAbnormalDialog from '../trace/components/HandleAbnormalDialog.vue'

const userStore = useUserStore()

const dateRange = ref<string[]>([])

const canExport = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasPermission('user:account:export')
})

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<UserAbnormalLog, Record<string, unknown>>({
  fetchApi: async (params) => {
    const result = await getAbnormalUsers(params)
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    abnormalType: '',
    severity: undefined,
    handled: undefined,
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20
  }
})

const stats = reactive({
  total: 0,
  high: 0,
  medium: 0,
  handled: 0
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

const traceDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const currentLogId = ref<number | null>(null)

const handleReset = () => {
  dateRange.value = []
  baseHandleReset()
}

const getAbnormalTagType = (severity: number) => {
  switch (severity) {
    case 3: return 'danger'
    case 2: return 'warning'
    default: return 'info'
  }
}

const getRowClassName = ({ row }: { row: UserAbnormalLog }) => {
  if (row.handled !== 1) {
    if (row.severity === 3) return 'abnormal-row-high'
    if (row.severity === 2) return 'abnormal-row-medium'
    return 'abnormal-row-low'
  }
  return ''
}

const handleViewTrace = (row: UserAbnormalLog) => {
  currentLogId.value = row.id
  traceDialogVisible.value = true
}

const handleRowDoubleClick = (row: UserAbnormalLog) => {
  handleViewTrace(row)
}

const handleMarkHandled = (row: UserAbnormalLog) => {
  currentLogId.value = row.id
  handleDialogVisible.value = true
}

const handleViewUser = (row: UserAbnormalLog) => {
  window.open(`/user-account/list?uid=${row.userId}`, '_blank')
}

const handleDataUpdated = () => {
  fetchData()
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const loadStats = async () => {
  try {
    const result = await getAbnormalUsers({ page: 1, pageSize: 1 })
    stats.total = result.stats.reduce((sum: number, s: any) => sum + s.count, 0)
    const highStat = result.stats.find((s: any) => s.abnormalType === 'fake_info' || s.abnormalType === 'duplicate_binding')
    stats.high = highStat?.count || 0
    stats.medium = result.stats.reduce((sum: number, s: any) => sum + s.count, 0) - stats.high
    stats.handled = result.total * 0.3
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
  loadStats()
})
</script>

<style lang="scss" scoped>
.page-container {
  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;
    color: #fff;

    &.high {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.danger {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.warning {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    &.success {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-content {
      .stat-count {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 13px;
        opacity: 0.9;
      }
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

  .tip {
    font-size: 12px;
    color: $text-placeholder;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-wrapper {
      position: relative;
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

        .abnormal-tag {
          animation: glow 1.5s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(245, 108, 108, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(245, 108, 108, 0.8);
          }
        }
      }

      .user-extra {
        font-size: 12px;
        color: $text-secondary;
        display: flex;
        gap: 10px;
      }
    }
  }

  :deep(.abnormal-row-high) {
    background: rgba(245, 108, 108, 0.08) !important;

    &:hover > td {
      background: rgba(245, 108, 108, 0.12) !important;
    }
  }

  :deep(.abnormal-row-medium) {
    background: rgba(230, 162, 60, 0.08) !important;

    &:hover > td {
      background: rgba(230, 162, 60, 0.12) !important;
    }
  }

  :deep(.abnormal-row-low) {
    background: rgba(64, 158, 255, 0.08) !important;

    &:hover > td {
      background: rgba(64, 158, 255, 0.12) !important;
    }
  }
}
</style>
