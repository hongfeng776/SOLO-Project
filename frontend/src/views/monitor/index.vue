<template>
  <div class="monitor-page">
    <el-row :gutter="20" class="system-status">
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">CPU使用率</div>
          <el-progress type="dashboard" :percentage="systemMetrics.cpu" :color="getProgressColor(systemMetrics.cpu)">
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
            </template>
          </el-progress>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">内存使用率</div>
          <el-progress type="dashboard" :percentage="systemMetrics.memory" :color="getProgressColor(systemMetrics.memory)">
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
            </template>
          </el-progress>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">数据库连接数</div>
          <div class="metric-value">{{ systemMetrics.dbConnections }}</div>
          <div class="metric-sub">最大连接数: 200</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">在线用户数</div>
          <div class="metric-value">{{ systemMetrics.onlineUsers }}</div>
          <div class="metric-sub">今日登录: {{ systemMetrics.todayLogins }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="api-metrics">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>API指标</span>
          </template>
          <el-row :gutter="20" class="api-stats">
            <el-col :span="8">
              <div class="api-stat-item">
                <div class="api-stat-value">{{ apiMetrics.requestCount }}</div>
                <div class="api-stat-label">请求量/分钟</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="api-stat-item">
                <div class="api-stat-value">{{ apiMetrics.avgResponseTime }}ms</div>
                <div class="api-stat-label">平均响应时间</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="api-stat-item">
                <div class="api-stat-value error-rate">{{ apiMetrics.errorRate }}%</div>
                <div class="api-stat-label">错误率</div>
              </div>
            </el-col>
          </el-row>
          <el-table :data="slowApis" size="small" class="slow-api-table">
            <el-table-column prop="path" label="接口路径" />
            <el-table-column prop="method" label="请求方法" width="100" align="center" />
            <el-table-column prop="avgTime" label="平均耗时(ms)" width="120" align="right" />
            <el-table-column prop="maxTime" label="最大耗时(ms)" width="120" align="right" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>最新告警</span>
          </template>
          <el-table :data="alertList" size="small">
            <el-table-column prop="level" label="级别" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.level >= 3 ? 'danger' : row.level === 2 ? 'warning' : 'info'" size="small">
                  {{ AlertLevelMap[row.level] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="告警信息" show-overflow-tooltip />
            <el-table-column prop="time" label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.time) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="operation-log-card">
      <template #header>
        <span>操作日志</span>
      </template>
      <CommonTable
        ref="logTableRef"
        :loading="logLoading"
        :data="logData"
        :total="logTotal"
        :page="logQueryParams.page"
        :page-size="logQueryParams.pageSize"
        :show-search="true"
        :search-fields="logSearchFields"
        @search="handleLogSearch"
        @reset="handleLogReset"
        @page-change="handleLogPageChange"
        @size-change="handleLogSizeChange"
      >
        <el-table-column prop="username" label="操作人" width="100" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="operation" label="操作" width="120" />
        <el-table-column prop="method" label="请求方法" width="100" align="center" />
        <el-table-column prop="path" label="请求路径" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(ms)" width="100" align="right" />
        <el-table-column prop="createTime" label="操作时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
      </CommonTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import { AlertLevelMap } from '@/enums/monitor'
import { formatDate } from '@/utils/format'

const systemMetrics = reactive({
  cpu: 45,
  memory: 62,
  dbConnections: 86,
  onlineUsers: 128,
  todayLogins: 256
})

const apiMetrics = reactive({
  requestCount: 1250,
  avgResponseTime: 86,
  errorRate: 0.12
})

const slowApis = ref([
  { path: '/api/order/list', method: 'GET', avgTime: 520, maxTime: 1200 },
  { path: '/api/driver/list', method: 'GET', avgTime: 480, maxTime: 980 },
  { path: '/api/risk/check-order', method: 'POST', avgTime: 350, maxTime: 860 },
  { path: '/api/finance/statement', method: 'GET', avgTime: 320, maxTime: 750 },
  { path: '/api/vehicle/audit', method: 'PUT', avgTime: 280, maxTime: 680 },
  { path: '/api/passenger/list', method: 'GET', avgTime: 260, maxTime: 590 },
  { path: '/api/coupon/distribute', method: 'POST', avgTime: 240, maxTime: 530 },
  { path: '/api/ticket/handle', method: 'PUT', avgTime: 220, maxTime: 480 },
  { path: '/api/driver/status', method: 'PUT', avgTime: 190, maxTime: 420 },
  { path: '/api/order/dispatch', method: 'POST', avgTime: 180, maxTime: 380 }
])

const alertList = ref([
  { id: 1, level: 4, message: '数据库连接池使用率超过80%', time: '2024-01-15 14:30:00' },
  { id: 2, level: 3, message: '订单服务响应时间超过阈值', time: '2024-01-15 14:20:00' },
  { id: 3, level: 2, message: 'Redis内存使用率较高', time: '2024-01-15 14:10:00' },
  { id: 4, level: 2, message: '司机服务CPU使用率上升', time: '2024-01-15 13:50:00' },
  { id: 5, level: 1, message: '日志磁盘空间不足20%', time: '2024-01-15 13:30:00' }
])

const logTableRef = ref()
const logLoading = ref(false)
const logData = ref<any[]>([])
const logTotal = ref(0)

const logQueryParams = reactive({
  page: 1,
  pageSize: 10,
  module: '',
  username: '',
  status: undefined as number | undefined,
  timeRange: null as string[] | null
})

const logSearchFields = [
  { prop: 'module', label: '模块', type: 'input' },
  { prop: 'username', label: '操作人', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 1, label: '成功' },
    { value: 0, label: '失败' }
  ]},
  { prop: 'timeRange', label: '时间范围', type: 'daterange' }
]

const getLogList = async () => {
  logLoading.value = true
  try {
    logData.value = []
    logTotal.value = 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取操作日志失败')
  } finally {
    logLoading.value = false
  }
}

const handleLogSearch = (params: any) => {
  Object.assign(logQueryParams, params)
  getLogList()
}

const handleLogReset = () => {
  logQueryParams.page = 1
  logQueryParams.pageSize = 10
  logQueryParams.module = ''
  logQueryParams.username = ''
  logQueryParams.status = undefined
  logQueryParams.timeRange = null
  getLogList()
}

const handleLogPageChange = (page: number) => {
  logQueryParams.page = page
  getLogList()
}

const handleLogSizeChange = (size: number) => {
  logQueryParams.pageSize = size
  logQueryParams.page = 1
  getLogList()
}

const getProgressColor = (percentage: number) => {
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

let timer: ReturnType<typeof setInterval> | null = null

const refreshMetrics = () => {
  systemMetrics.cpu = Math.floor(30 + Math.random() * 40)
  systemMetrics.memory = Math.floor(50 + Math.random() * 30)
  systemMetrics.dbConnections = Math.floor(70 + Math.random() * 50)
  systemMetrics.onlineUsers = Math.floor(100 + Math.random() * 80)
  apiMetrics.requestCount = Math.floor(1000 + Math.random() * 500)
  apiMetrics.avgResponseTime = Math.floor(60 + Math.random() * 80)
  apiMetrics.errorRate = parseFloat((Math.random() * 0.5).toFixed(2))
}

onMounted(() => {
  getLogList()
  timer = setInterval(refreshMetrics, 5000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style lang="scss" scoped>
.monitor-page {
  .system-status {
    margin-bottom: 20px;
  }

  .metric-card {
    text-align: center;
    padding: 10px;

    .metric-title {
      font-size: 14px;
      color: #909399;
      margin-bottom: 16px;
    }

    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #303133;
    }

    .metric-sub {
      font-size: 12px;
      color: #909399;
      margin-top: 8px;
    }

    .percentage-value {
      font-size: 18px;
      font-weight: bold;
    }
  }

  .api-metrics {
    margin-bottom: 20px;

    .api-stats {
      margin-bottom: 20px;
    }

    .api-stat-item {
      text-align: center;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;

      .api-stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 8px;

        &.error-rate {
          color: #f56c6c;
        }
      }

      .api-stat-label {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .operation-log-card {
    margin-bottom: 20px;
  }
}
</style>
