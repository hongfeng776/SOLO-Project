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
        <el-form-item label="手机号">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="注册时间">
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
        <el-form-item label="异常类型">
          <el-select
            v-model="queryParams.abnormalType"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(name, value) in USER_ABNORMAL_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="queryParams.handled"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="未处理" :value="0" />
            <el-option label="已处理" :value="1" />
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

    <el-card shadow="never" class="mb-20" v-if="stats.length > 0">
      <el-row :gutter="16">
        <el-col :span="6" v-for="stat in stats" :key="stat.abnormalType">
          <div class="stat-card" :class="getSeverityClass(stat.abnormalType)">
            <div class="stat-count">{{ stat.count }}</div>
            <div class="stat-name">{{ USER_ABNORMAL_TYPE_NAMES[stat.abnormalType] || stat.abnormalType }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">账号溯源列表</span>
          <span class="tip">双击条目查看完整溯源日志</span>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
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
                <el-tag
                  v-if="row.user?.isAbnormal === 1"
                  class="abnormal-tag"
                  :type="getAbnormalTagType(row.severity)"
                  effect="dark"
                  size="small"
                >
                  异常
                </el-tag>
              </div>
              <div class="info-text">
                <div class="user-name">
                  {{ row.user?.nickname }}
                  <span class="user-uid">UID: {{ row.userId }}</span>
                </div>
                <div class="user-extra">
                  <span>{{ row.user?.username }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="异常信息" min-width="200">
          <template #default="{ row }">
            <div class="abnormal-info">
              <div class="abnormal-type">
                <el-tag
                  :type="getAbnormalTagType(row.severity)"
                  effect="light"
                  size="small"
                >
                  {{ USER_ABNORMAL_TYPE_NAMES[row.abnormalType] || row.abnormalType }}
                </el-tag>
                <el-tag
                  v-if="row.severity === 3"
                  type="danger"
                  effect="dark"
                  size="small"
                >
                  高危
                </el-tag>
                <el-tag v-else-if="row.severity === 2" type="warning" effect="light" size="small">
                  中危
                </el-tag>
                <el-tag v-else type="info" effect="plain" size="small">低危</el-tag>
              </div>
              <div class="abnormal-detail" :title="row.abnormalDetail">
                {{ row.abnormalDetail }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="检测时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.detectedTime) }}</template>
        </el-table-column>

        <el-table-column label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.handled === 1 ? 'success' : 'warning'" effect="light" size="small">
              {{ row.handled === 1 ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="处理人" width="100">
          <template #default="{ row }">{{ row.handlerName || '-' }}</template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
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
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { useFetchList, formatDateTime } from '@/hooks/index'
import { getAbnormalUsers } from '@api/user-account'
import type { UserAbnormalLog } from '@/types/business'
import { USER_ABNORMAL_TYPE_NAMES } from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import TraceDetailDialog from './components/TraceDetailDialog.vue'
import HandleAbnormalDialog from './components/HandleAbnormalDialog.vue'

const route = useRoute()

const dateRange = ref<string[]>([])

const stats = ref<Array<{ abnormalType: string; count: number }>>([])

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
    stats.value = result.stats
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: undefined,
    phone: '',
    abnormalType: '',
    handled: undefined,
    registerStartDate: '',
    registerEndDate: ''
  }
})

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.registerStartDate = newVal[0]
    queryParams.registerEndDate = newVal[1]
  } else {
    queryParams.registerStartDate = ''
    queryParams.registerEndDate = ''
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

const getSeverityClass = (type: string) => {
  if (type === 'fake_info' || type === 'duplicate_binding') return 'high'
  if (type === 'suspicious_activity') return 'medium'
  return 'low'
}

const getRowClassName = ({ row }: { row: UserAbnormalLog }) => {
  if (row.user?.isAbnormal === 1 && row.handled !== 1) {
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

onMounted(() => {
  const uid = route.query.uid
  if (uid) {
    queryParams.uid = Number(uid)
  }
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

  .tip {
    font-size: 12px;
    color: $text-placeholder;
  }

  .stat-card {
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;

    &.high {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.medium {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    &.low {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-count {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-name {
      font-size: 13px;
      opacity: 0.9;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-wrapper {
      position: relative;

      .abnormal-tag {
        position: absolute;
        top: -6px;
        right: -6px;
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
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .abnormal-info {
    .abnormal-type {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .abnormal-detail {
      font-size: 12px;
      color: $text-secondary;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
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
