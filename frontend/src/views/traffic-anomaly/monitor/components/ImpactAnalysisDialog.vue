<template>
  <el-dialog
    v-model="dialogVisible"
    title="异常溯源分析"
    width="900px"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="impact-analysis">
      <div v-if="impactData" class="analysis-content">
        <el-row :gutter="16" style="margin-bottom: 16px;">
          <el-col :span="8">
            <div class="overview-card anomaly-card">
              <div class="card-label">异常类型</div>
              <div class="card-value">
                <el-tag
                  size="small"
                  :color="TRAFFIC_ANOMALY_TYPE_COLORS[impactData.anomaly.anomalyType]"
                  effect="light"
                  style="color: #fff;"
                >
                  {{ TRAFFIC_ANOMALY_TYPE_NAMES[impactData.anomaly.anomalyType] }}
                </el-tag>
              </div>
              <div class="card-sub">{{ impactData.anomaly.userName }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="overview-card success-card">
              <div class="card-label">处置记录</div>
              <div class="card-value">{{ impactData.handleLogs.length }}</div>
              <div class="card-sub">条操作日志</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="overview-card block-card">
              <div class="card-label">拦截次数</div>
              <div class="card-value">
                {{ impactData.blockReasonStats.reduce((sum, item) => sum + item.count, 0) }}
              </div>
              <div class="card-sub">次拦截触发</div>
            </div>
          </el-col>
        </el-row>

        <div class="section-title">校验评分</div>
        <el-row :gutter="24" style="margin-bottom: 20px;">
          <el-col :span="12">
            <div class="score-item">
              <div class="score-header">
                <span class="score-label">真实性评分</span>
                <span
                  class="score-number"
                  :class="scoreClass(impactData.validation.authenticityScore)"
                >
                  {{ impactData.validation.authenticityScore.toFixed(1) }}
                </span>
              </div>
              <el-progress
                :percentage="impactData.validation.authenticityScore"
                :color="scoreColor(impactData.validation.authenticityScore)"
                :stroke-width="10"
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="score-item">
              <div class="score-header">
                <span class="score-label">合规性评分</span>
                <span
                  class="score-number"
                  :class="scoreClass(impactData.validation.complianceScore)"
                >
                  {{ impactData.validation.complianceScore.toFixed(1) }}
                </span>
              </div>
              <el-progress
                :percentage="impactData.validation.complianceScore"
                :color="scoreColor(impactData.validation.complianceScore)"
                :stroke-width="10"
              />
            </div>
          </el-col>
        </el-row>

        <div class="section-title">拦截原因分布</div>
        <div v-if="impactData.blockReasonStats.length > 0" class="reason-dist">
          <div
            v-for="item in impactData.blockReasonStats"
            :key="item.blockReason"
            class="reason-row"
          >
            <div class="reason-label">
              {{ TRAFFIC_ANOMALY_BLOCK_REASON_NAMES[item.blockReason] }}
            </div>
            <div class="reason-bar-wrapper">
              <div
                class="reason-bar"
                :style="{
                  width: ((item.count / totalBlockCount) * 100).toFixed(1) + '%',
                  background: reasonGradient
                }"
              />
            </div>
            <div class="reason-count">{{ item.count }} 次</div>
          </div>
        </div>
        <div v-else class="empty-reason">
          <el-empty description="暂无拦截记录" :image-size="60" />
        </div>

        <div class="section-title">
          溯源数据
          <el-button size="small" type="primary" link @click="fetchImpactData">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>

        <el-row :gutter="16">
          <el-col :span="12">
            <div v-if="impactData.traceData" class="data-block">
              <div class="data-block-title">溯源轨迹</div>
              <pre class="data-block-content">{{ formatJson(impactData.traceData) }}</pre>
            </div>
            <div v-if="impactData.frequencyData" class="data-block">
              <div class="data-block-title">频次数据</div>
              <pre class="data-block-content">{{ formatJson(impactData.frequencyData) }}</pre>
            </div>
          </el-col>
          <el-col :span="12">
            <div v-if="impactData.behaviorDetail" class="data-block">
              <div class="data-block-title">行为详情</div>
              <pre class="data-block-content">{{ formatJson(impactData.behaviorDetail) }}</pre>
            </div>
            <div v-if="impactData.deviceInfo" class="data-block">
              <div class="data-block-title">设备信息</div>
              <pre class="data-block-content">{{ formatJson(impactData.deviceInfo) }}</pre>
            </div>
          </el-col>
        </el-row>

        <div class="section-title">最近处置日志</div>
        <div class="logs-table-wrapper">
          <el-table :data="impactData.recentLogs" border size="small">
            <el-table-column prop="id" label="ID" width="70" align="center" />
            <el-table-column label="处置类型" width="120">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :color="TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS[row.handleType]"
                  effect="light"
                  style="color: #fff;"
                >
                  {{ TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[row.handleType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.handleStatus === 1 ? 'success' : row.handleStatus === 2 ? 'danger' : 'warning'">
                  {{ TRAFFIC_ANOMALY_HANDLE_STATUS_NAMES[row.handleStatus] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handleReason" label="原因" show-overflow-tooltip />
            <el-table-column label="耗时" width="90" align="center">
              <template #default="{ row }">
                {{ row.handleCost || 0 }} ms
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
            <el-table-column label="时间" width="170" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="impactData.validation && !impactData.validation.isValid" style="margin-top: 20px;">
          <el-alert
            title="数据校验不通过"
            type="error"
            :closable="false"
          >
            <ul>
              <li v-for="(err, idx) in impactData.validation.errors" :key="idx">
                {{ err }}
              </li>
            </ul>
          </el-alert>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { getTrafficAnomalyImpactAnalysis } from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_TYPE_COLORS,
  TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS,
  TRAFFIC_ANOMALY_HANDLE_STATUS_NAMES,
  TRAFFIC_ANOMALY_BLOCK_REASON_NAMES
} from '@/enums/business'
import { formatDateTime } from '@hooks/index'
import type { TrafficAnomalyImpactAnalysis, TrafficAnomalyPermission } from '@/types/business'

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

const props = defineProps<{
  modelValue: boolean
  anomalyId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loading = ref(false)
const impactData = ref<TrafficAnomalyImpactAnalysis | null>(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const totalBlockCount = computed(() => {
  if (!impactData.value) return 1
  const sum = impactData.value.blockReasonStats.reduce((s, item) => s + item.count, 0)
  return sum || 1
})

const reasonGradient = 'linear-gradient(90deg, #f56c6c 0%, #e6a23c 100%)'

const fetchImpactData = async () => {
  if (!props.anomalyId) return
  loading.value = true
  try {
    const res = await getTrafficAnomalyImpactAnalysis(props.anomalyId)
    impactData.value = res
  } finally {
    loading.value = false
  }
}

const formatJson = (obj: Record<string, unknown> | Record<string, number> | null) => {
  if (!obj) return '{}'
  try {
    return JSON.stringify(obj, null, 2)
  } catch (_e) {
    return String(obj)
  }
}

const scoreClass = (score: number) => {
  if (score >= 70) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

const scoreColor = (score: number) => {
  if (score >= 70) return '#67c23a'
  if (score >= 50) return '#e6a23c'
  return '#f56c6c'
}

const handleClosed = () => {
  impactData.value = null
}

watch(() => [props.modelValue, props.anomalyId], ([visible, id]) => {
  if (visible && id) {
    computePermission()
    fetchImpactData()
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.impact-analysis {
  .overview-card {
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    color: #fff;

    .card-label {
      font-size: 13px;
      opacity: 0.85;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .card-sub {
      font-size: 12px;
      opacity: 0.75;
    }
  }
  .anomaly-card {
    background: linear-gradient(135deg, #f56c6c 0%, #c45656 100%);
  }
  .success-card {
    background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  }
  .block-card {
    background: linear-gradient(135deg, #e6a23c 0%, #b88230 100%);
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 20px 0 12px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .score-item {
    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .score-label {
      font-size: 13px;
      color: #606266;
    }
    .score-number {
      font-size: 22px;
      font-weight: 600;
      &.high { color: #67c23a; }
      &.mid { color: #e6a23c; }
      &.low { color: #f56c6c; }
    }
  }

  .reason-dist {
    margin-top: 12px;
  }
  .reason-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 12px;
  }
  .reason-label {
    width: 120px;
    font-size: 13px;
    color: #606266;
    flex-shrink: 0;
  }
  .reason-bar-wrapper {
    flex: 1;
    height: 20px;
    background: #f4f4f5;
    border-radius: 10px;
    overflow: hidden;
  }
  .reason-bar {
    height: 100%;
    border-radius: 10px;
    transition: width 0.6s ease;
  }
  .reason-count {
    width: 60px;
    text-align: right;
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  .empty-reason {
    padding: 20px 0;
  }

  .data-block {
    margin-bottom: 16px;
    .data-block-title {
      font-size: 13px;
      font-weight: 500;
      color: #606266;
      margin-bottom: 6px;
    }
    .data-block-content {
      background: #f4f4f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      max-height: 200px;
      overflow: auto;
      margin: 0;
    }
  }

  .logs-table-wrapper {
    max-height: 320px;
    overflow: auto;
    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 2;
    }
  }
}
</style>
