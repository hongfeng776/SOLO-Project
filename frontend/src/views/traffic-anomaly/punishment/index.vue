<template>
  <div class="traffic-anomaly-punishment">
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6" v-for="item in statusTabs" :key="item.value">
        <el-card
          shadow="hover"
          class="tab-card"
          :class="{ active: activeTab === item.value }"
          @click="activeTab = item.value"
        >
          <div class="tab-content">
            <div class="tab-icon" :style="{ background: item.color }">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="tab-info">
              <div class="tab-value" :style="{ color: item.color }">{{ item.count }}</div>
              <div class="tab-label">{{ item.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索用户名/内容标题/IP"
          clearable
          style="width: 240px; margin-right: 12px;"
          @keyup.enter="fetchData"
        />
        <el-select
          v-model="queryParams.anomalyType"
          placeholder="异常类型"
          clearable
          style="width: 160px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, type) in TRAFFIC_ANOMALY_TYPE_NAMES"
            :key="type"
            :label="name"
            :value="type"
          />
        </el-select>
        <el-select
          v-model="queryParams.riskLevel"
          placeholder="风险等级"
          clearable
          style="width: 140px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, level) in TRAFFIC_ANOMALY_RISK_LEVEL_NAMES"
            :key="level"
            :label="name"
            :value="Number(level)"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="margin-right: 12px;"
        />
        <el-button type="primary" :icon="Search" @click="fetchData">查询</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="异常信息" min-width="200">
          <template #default="{ row }">
            <div class="anomaly-info">
              <div class="anomaly-title">
                <el-tag
                  size="small"
                  :type="TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES[row.riskLevel]"
                  effect="light"
                  style="margin-right: 8px;"
                >
                  {{ TRAFFIC_ANOMALY_RISK_LEVEL_NAMES[row.riskLevel] }}
                </el-tag>
                <span class="type-name">
                  {{ TRAFFIC_ANOMALY_TYPE_NAMES[row.anomalyType] }}
                </span>
              </div>
              <div class="anomaly-user">
                用户：{{ row.userName }}
              </div>
              <div class="anomaly-content" v-if="row.contentTitle">
                内容：{{ row.contentTitle }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="处置状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="TRAFFIC_ANOMALY_STATUS_TAG_TYPES[row.status]"
              effect="light"
              :key="row.status"
            >
              {{ TRAFFIC_ANOMALY_STATUS_NAMES[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处置结果" min-width="200">
          <template #default="{ row }">
            <div class="handle-result" v-if="row.handleResult">
              {{ row.handleResult }}
            </div>
            <div v-else class="no-result">
              待处置
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="handledAt" label="处置时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.handledAt ? formatDateTime(row.handledAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
        <el-table-column prop="detectTime" label="检测时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.detectTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="permission?.canHandle">
              <el-dropdown
                trigger="click"
                @command="(cmd: string) => handleSingle(row, cmd)"
                :disabled="row.status === 5"
              >
                <el-button size="small" type="primary">
                  处置
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="intercept_flow" :disabled="row.status === 1">
                      拦截流量
                    </el-dropdown-item>
                    <el-dropdown-item command="content_flow_limit" :disabled="row.status === 2">
                      内容限流
                    </el-dropdown-item>
                    <el-dropdown-item command="account_downgrade" :disabled="row.status === 3">
                      账号降权
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="permission?.canBan"
                      command="permanent_ban"
                      :disabled="row.status === 5"
                      divided
                    >
                      永久封禁
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="permission?.canRelease"
                      command="release_control"
                      :disabled="row.status === 4"
                      divided
                    >
                      解除风控
                    </el-dropdown-item>
                    <el-dropdown-item command="clean_data">
                      清理异常数据
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button size="small" type="primary" link @click="handleViewImpact(row)">
                溯源
              </el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="handleViewImpact(row)">溯源</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

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

    <HandleDialog
      v-model="handleDialogVisible"
      :id="currentAnomalyId"
      :handle-type="currentHandleType"
      @handle-success="handleHandleSuccess"
    />

    <ImpactAnalysisDialog
      v-model="impactDialogVisible"
      :anomaly-id="currentAnomalyId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent, watch } from 'vue'
import { Search, Refresh, ArrowDown, Clock, CircleCheck, Warning, View } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { formatDateTime } from '@hooks/index'
import {
  getTrafficAnomalyList,
  getTrafficAnomalyStats
} from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES,
  TRAFFIC_ANOMALY_STATUS_NAMES,
  TRAFFIC_ANOMALY_STATUS_TAG_TYPES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES
} from '@/enums/business'
import type { TrafficAnomalyRecord, TrafficAnomalyPermission } from '@/types/business'

const HandleDialog = defineAsyncComponent(() => import('../monitor/components/HandleDialog.vue'))
const ImpactAnalysisDialog = defineAsyncComponent(() => import('../monitor/components/ImpactAnalysisDialog.vue'))

const userStore = useUserStore()

const permission = reactive<TrafficAnomalyPermission>({
  canView: false, canHandle: false, canBatch: false,
  canRelease: false, canBan: false, canViewTrace: false, canExportReport: false
})

const computePermission = () => {
  const has = (r: string) => userStore.hasRole(r)
  permission.canView = has('admin') || has('risk_admin') || has('senior_operator') || has('operator')
  permission.canHandle = has('admin') || has('risk_admin') || has('senior_operator')
  permission.canBatch = has('admin') || has('risk_admin')
  permission.canRelease = has('admin') || has('risk_admin')
  permission.canBan = has('admin') || has('risk_admin')
  permission.canViewTrace = has('admin') || has('risk_admin') || has('senior_operator') || has('operator')
  permission.canExportReport = has('admin') || has('risk_admin')
}

const tableData = ref<TrafficAnomalyRecord[]>([])
const total = ref(0)
const loading = ref(false)
const stats = ref<any>({})
const dateRange = ref<string[]>([])

const activeTab = ref<number | undefined>(undefined)

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  anomalyType: '',
  riskLevel: undefined as number | undefined,
  status: undefined as number | undefined,
  startTime: '',
  endTime: ''
})

const handleDialogVisible = ref(false)
const impactDialogVisible = ref(false)
const currentAnomaly = ref<TrafficAnomalyRecord | null>(null)
const currentAnomalyId = ref<number>(0)
const currentHandleType = ref('')

const statusTabs = computed(() => [
  { value: undefined, label: '全部', count: stats.value.total || 0, color: '#409eff', icon: View },
  { value: 0, label: '待处置', count: stats.value.pending || 0, color: '#e6a23c', icon: Clock },
  { value: 1, label: '已拦截', count: stats.value.intercepted || 0, color: '#f56c6c', icon: Warning },
  { value: 4, label: '已解封', count: stats.value.released || 0, color: '#67c23a', icon: CircleCheck }
])

const fetchStats = async () => {
  try {
    const res = await getTrafficAnomalyStats()
    stats.value = res
  } catch (_err) {
    // ignore
  }
}

const fetchData = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }

  queryParams.status = activeTab.value

  const params: Record<string, unknown> = { ...queryParams }
  if (params.anomalyType === '') delete params.anomalyType
  if (params.status === undefined) delete params.status

  loading.value = true
  try {
    const res = await getTrafficAnomalyList(params as any)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.anomalyType = ''
  queryParams.riskLevel = undefined
  dateRange.value = []
  activeTab.value = undefined
  fetchData()
}

const handleSingle = async (row: TrafficAnomalyRecord, handleType: string) => {
  try {
    await ElMessageBox.confirm(
      `确定对 ${row.userName} 执行「${TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[handleType as keyof typeof TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES]}」操作吗？`,
      '操作确认',
      { type: 'warning' }
    )
  } catch (_err) {
    return
  }

  currentAnomaly.value = row
  currentAnomalyId.value = row.id
  currentHandleType.value = handleType
  handleDialogVisible.value = true
}

const handleViewImpact = (row: TrafficAnomalyRecord) => {
  currentAnomalyId.value = row.id
  impactDialogVisible.value = true
}

const handleRowDblclick = (row: TrafficAnomalyRecord) => {
  handleViewImpact(row)
}

const handleHandleSuccess = () => {
  fetchData()
  fetchStats()
}

watch(activeTab, () => {
  queryParams.page = 1
  fetchData()
})

onMounted(() => {
  computePermission()
  fetchStats()
  fetchData()
})
</script>

<style scoped lang="scss">
.traffic-anomaly-punishment {
  .tab-card {
    cursor: pointer;
    transition: all 0.3s ease;
    &.active {
      box-shadow: 0 0 0 2px #409eff;
    }
    &:hover {
      transform: translateY(-2px);
    }
  }
  .tab-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .tab-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
  }
  .tab-value {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }
  .tab-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 16px;
    gap: 8px;
  }

  .anomaly-info {
    .anomaly-title {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      .type-name {
        font-weight: 500;
      }
    }
    .anomaly-user, .anomaly-content {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .handle-result {
    font-size: 13px;
    color: #303133;
    line-height: 1.5;
  }
  .no-result {
    font-size: 13px;
    color: #c0c4cc;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
