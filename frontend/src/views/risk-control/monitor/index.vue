<template>
  <div class="page-container" :class="{ 'shake-active': isShaking }">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="formModel.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="行为类型">
          <el-select
            v-model="formModel.behaviorType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in BEHAVIOR_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="formModel.riskLevel"
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
        <el-form-item label="是否异常">
          <el-select
            v-model="formModel.isAbnormal"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="异常" :value="1" />
            <el-option label="正常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时段">
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
          <span class="card-title">
            <el-icon class="title-icon"><Monitor /></el-icon>
            行为风控监控
          </span>
          <div class="header-actions">
            <el-tag v-if="permission.canIntercept" type="danger" effect="light">可拦截</el-tag>
            <el-tag v-if="permission.canHandle" type="warning" effect="light">可处理</el-tag>
          </div>
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
      >
        <el-table-column label="用户信息" min-width="160">
          <template #default="{ row }">
            <div class="user-info">
              <span class="user-name">{{ row.userName }}</span>
              <span class="user-uid">UID: {{ row.userId }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="行为类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ BEHAVIOR_TYPE_NAMES[row.behaviorType] || row.behaviorType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="行为内容" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.content">{{ row.content }}</span>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>

        <el-table-column label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.riskLevel > RiskLevel.NONE"
              class="risk-tag"
              :color="RISK_LEVEL_COLORS[row.riskLevel]"
              size="small"
              effect="dark"
            >
              {{ RISK_LEVEL_NAMES[row.riskLevel] }}
            </el-tag>
            <el-tag v-else size="small" effect="plain" type="success">
              {{ RISK_LEVEL_NAMES[row.riskLevel] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="违规类型" width="120" align="center">
          <template #default="{ row }">
            <template v-if="row.abnormalType">
              <el-tag
                class="violation-tag"
                type="danger"
                size="small"
                effect="light"
              >
                {{ VIOLATION_TYPE_NAMES[row.abnormalType] || row.abnormalType }}
              </el-tag>
            </template>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>

        <el-table-column label="频次" width="80" align="center">
          <template #default="{ row }">
            <span :class="{ 'high-frequency': row.frequency > 20 }">{{ row.frequency }}</span>
          </template>
        </el-table-column>

        <el-table-column label="时段" width="120">
          <template #default="{ row }">
            <span v-if="row.timePeriod">{{ row.timePeriod }}</span>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>

        <el-table-column label="IP" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.ip">{{ row.ip }}</span>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>

        <el-table-column label="拦截" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.intercepted === 1" type="danger" size="small" effect="light">已拦截</el-tag>
            <el-tag v-else type="info" size="small" effect="plain">未拦截</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="permission.canHandle"
              link
              type="warning"
              size="small"
              :icon="Warning"
              :loading="detectingMap[row.id]"
              @click="handleDetect(row)"
            >
              检测异常
            </el-button>
            <el-button
              v-if="row.isAbnormal === 1 && row.intercepted === 0 && permission.canIntercept"
              link
              type="danger"
              size="small"
              @click="handleIntercept(row)"
            >
              拦截
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="anomalyDialogVisible"
      title="异常检测结果"
      width="640px"
      destroy-on-close
    >
      <template v-if="anomalyResult">
        <el-alert
          :title="anomalyResult.hasAnomaly ? '检测到异常行为' : '未检测到异常'"
          :type="anomalyResult.hasAnomaly ? 'error' : 'success'"
          show-icon
          :closable="false"
          class="mb-16"
        />

        <template v-if="anomalyResult.hasAnomaly">
          <el-descriptions :column="2" border class="mb-16">
            <el-descriptions-item label="风险等级">
              <el-tag
                class="risk-tag"
                :color="RISK_LEVEL_COLORS[anomalyResult.riskLevel]"
                size="small"
                effect="dark"
              >
                {{ RISK_LEVEL_NAMES[anomalyResult.riskLevel] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="违规类型数量">
              {{ anomalyResult.violationTypes.length }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="violation-section" v-if="anomalyResult.violationTypes.length">
            <div class="section-title">违规类型</div>
            <div class="violation-tags">
              <el-tag
                v-for="vType in anomalyResult.violationTypes"
                :key="vType"
                class="violation-tag"
                type="danger"
                effect="light"
              >
                {{ VIOLATION_TYPE_NAMES[vType] || vType }}
              </el-tag>
            </div>
          </div>

          <div class="frequency-section" v-if="Object.keys(anomalyResult.frequencyData).length">
            <div class="section-title">频次数据</div>
            <el-table :data="frequencyTableData" border size="small">
              <el-table-column prop="name" label="行为" />
              <el-table-column prop="count" label="实际次数" width="100" align="center" />
              <el-table-column prop="limit" label="限制次数" width="100" align="center" />
              <el-table-column label="超标比例" width="100" align="center">
                <template #default="{ row }">
                  <span :class="{ 'high-frequency': row.ratio > 1 }">
                    {{ (row.ratio * 100).toFixed(0) }}%
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </template>

      <template #footer>
        <el-button @click="anomalyDialogVisible = false">关闭</el-button>
        <el-button
          v-if="anomalyResult?.hasAnomaly && permission.canIntercept"
          type="danger"
          @click="handleInterceptFromDialog"
        >
          立即拦截
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Warning, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getBehaviorLogs, detectAnomaly, interceptBehavior } from '@api/risk-control'
import type { BehaviorLog, AnomalyDetectResult, RiskControlPermission } from '@/types/business'
import {
  BEHAVIOR_TYPE_NAMES,
  RiskLevel,
  RISK_LEVEL_NAMES,
  RISK_LEVEL_COLORS,
  VIOLATION_TYPE_NAMES
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('risk:control:view')
})

const permission = ref<RiskControlPermission>({
  canView: false,
  canHandle: false,
  canBatchHandle: false,
  canIntercept: false,
  canRevoke: false
})

const dateRange = ref<string[]>([])

const isShaking = ref(false)

const detectingMap = reactive<Record<number, boolean>>({})

const anomalyDialogVisible = ref(false)
const anomalyResult = ref<AnomalyDetectResult | null>(null)
const anomalyTargetUser = ref<{ userId: number; userName: string } | null>(null)

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<BehaviorLog>({
  fetchApi: async (params) => {
    const result = await getBehaviorLogs(params)
    if (result.permission) {
      permission.value = result.permission
    }
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: '',
    behaviorType: '',
    riskLevel: undefined as number | undefined,
    violationType: '',
    isAbnormal: undefined as number | undefined,
    startDate: '',
    endDate: ''
  },
  immediate: false
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

const statCards = ref([
  { key: 'total', label: '行为总数', value: 0, icon: Monitor, color: '#409eff' },
  { key: 'abnormal', label: '异常行为', value: 0, icon: Warning, color: '#f56c6c' },
  { key: 'intercepted', label: '已拦截', value: 0, icon: Warning, color: '#e6a23c' },
  { key: 'highRisk', label: '高风险', value: 0, icon: Warning, color: '#c45656' }
])

const updateStatsFromData = () => {
  const totalVal = total.value
  const abnormalCount = dataList.value.filter(r => r.isAbnormal === 1).length
  const interceptedCount = dataList.value.filter(r => r.intercepted === 1).length
  const highRiskCount = dataList.value.filter(r => r.riskLevel >= RiskLevel.HIGH).length
  statCards.value[0].value = totalVal
  statCards.value[1].value = abnormalCount
  statCards.value[2].value = interceptedCount
  statCards.value[3].value = highRiskCount
}

const triggerShake = () => {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 600)
}

const frequencyTableData = computed(() => {
  if (!anomalyResult.value?.frequencyData) return []
  return Object.entries(anomalyResult.value.frequencyData).map(([key, data]) => ({
    key,
    name: BEHAVIOR_TYPE_NAMES[key] || key,
    count: data.count,
    limit: data.limit,
    ratio: data.ratio
  }))
})

const handleDetect = async (row: BehaviorLog) => {
  detectingMap[row.id] = true
  try {
    const result = await detectAnomaly(row.userId, {
      behaviorType: row.behaviorType
    })
    anomalyResult.value = result
    anomalyTargetUser.value = { userId: row.userId, userName: row.userName }
    anomalyDialogVisible.value = true

    if (result.hasAnomaly) {
      triggerShake()
    }

    fetchData()
  } catch (error) {
    console.error(error)
  } finally {
    detectingMap[row.id] = false
  }
}

const handleIntercept = async (row: BehaviorLog) => {
  try {
    await ElMessageBox.confirm(
      `确认拦截用户「${row.userName}」的后续操作吗？`,
      '拦截确认',
      {
        confirmButtonText: '确定拦截',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await interceptBehavior(row.userId, {
      behaviorType: row.behaviorType,
      reason: row.abnormalType
        ? `${VIOLATION_TYPE_NAMES[row.abnormalType] || row.abnormalType} - 自动拦截`
        : '风控拦截'
    })
    ElMessage.success('拦截成功')
    triggerShake()
    fetchData()
  } catch {
    // canceled
  }
}

const handleInterceptFromDialog = async () => {
  if (!anomalyTargetUser.value || !anomalyResult.value) return
  try {
    await ElMessageBox.confirm(
      `确认拦截用户「${anomalyTargetUser.value.userName}」的后续操作吗？`,
      '拦截确认',
      {
        confirmButtonText: '确定拦截',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const violationType = anomalyResult.value.violationTypes[0] || ''
    await interceptBehavior(anomalyTargetUser.value.userId, {
      behaviorType: violationType,
      reason: violationType
        ? `${VIOLATION_TYPE_NAMES[violationType] || violationType} - 异常拦截`
        : '风控拦截'
    })
    ElMessage.success('拦截成功')
    triggerShake()
    anomalyDialogVisible.value = false
    fetchData()
  } catch {
    // canceled
  }
}

const handleReset = () => {
  dateRange.value = []
  baseHandleReset()
}

onMounted(() => {
  if (canView.value) {
    fetchData().then(updateStatsFromData)
  }
})
</script>

<style lang="scss" scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes breathing {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 4px currentColor;
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 12px currentColor;
  }
}

.page-container {
  &.shake-active {
    animation: shake 0.6s ease-in-out;
  }

  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
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
    display: flex;
    align-items: center;
    gap: 6px;

    .title-icon {
      font-size: 18px;
      color: $color-primary;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      font-weight: 600;
      color: $text-primary;
    }

    .user-uid {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .risk-tag {
    animation: breathing 2s ease-in-out infinite;
  }

  .violation-tag {
    animation: breathing 1.5s ease-in-out infinite;
  }

  .high-frequency {
    color: $color-danger;
    font-weight: 600;
  }

  .text-empty {
    color: $text-placeholder;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .violation-section,
  .frequency-section {
    margin-top: 16px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 8px;
    }
  }

  .violation-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
