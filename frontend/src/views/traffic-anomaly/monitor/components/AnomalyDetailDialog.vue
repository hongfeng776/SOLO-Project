<template>
  <el-dialog
    v-model="dialogVisible"
    title="异常详情"
    width="800px"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="anomaly-detail">
      <div v-if="detailData" class="detail-content">
        <div class="section-title">基础信息</div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="异常ID">
            {{ detailData.id }}
          </el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag
              size="small"
              :color="TRAFFIC_ANOMALY_TYPE_COLORS[detailData.anomalyType]"
              effect="light"
              style="color: #fff;"
            >
              {{ TRAFFIC_ANOMALY_TYPE_NAMES[detailData.anomalyType] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag
              size="small"
              :type="TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES[detailData.riskLevel]"
            >
              {{ TRAFFIC_ANOMALY_RISK_LEVEL_NAMES[detailData.riskLevel] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处置状态">
            <el-tag
              size="small"
              :type="TRAFFIC_ANOMALY_STATUS_TAG_TYPES[detailData.status]"
            >
              {{ TRAFFIC_ANOMALY_STATUS_NAMES[detailData.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ TRAFFIC_ANOMALY_SOURCE_NAMES[detailData.source] }}
          </el-descriptions-item>
          <el-descriptions-item label="置信度">
            {{ ((detailData.confidence || 0) * 100).toFixed(1) }}%
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ detailData.userName }} (ID: {{ detailData.userId }})
          </el-descriptions-item>
          <el-descriptions-item label="内容标题" :span="2">
            {{ detailData.contentTitle || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            <span class="mono-text">{{ detailData.ipAddress || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="IP归属地">
            {{ detailData.ipLocation || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户来源">
            {{ detailData.userSource || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检测时间">
            {{ formatDateTime(detailData.detectTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ detailData.handledAt ? formatDateTime(detailData.handledAt) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ detailData.operatorName || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">流量数据</div>
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="总曝光量">
            <span :class="{ 'danger-text': detailData.exposureCount && detailData.exposureCount > 10000 }">
              {{ formatNumber(detailData.exposureCount || 0) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="曝光频次/小时">
            <span :class="{ 'danger-text': detailData.exposureFrequency && detailData.exposureFrequency > 1000 }">
              {{ detailData.exposureFrequency || 0 }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="独立用户">
            {{ formatNumber(detailData.uniqueUserCount || 0) }}
          </el-descriptions-item>
          <el-descriptions-item label="独立IP">
            {{ formatNumber(detailData.uniqueIpCount || 0) }}
          </el-descriptions-item>
          <el-descriptions-item label="独立设备">
            {{ formatNumber(detailData.uniqueDeviceCount || 0) }}
          </el-descriptions-item>
          <el-descriptions-item label="影响内容">
            {{ formatNumber(detailData.affectedContentCount || 0) }} 条
          </el-descriptions-item>
          <el-descriptions-item label="影响用户">
            {{ formatNumber(detailData.affectedUserCount || 0) }} 人
          </el-descriptions-item>
          <el-descriptions-item label="预估损失">
            ¥{{ formatNumber(detailData.estimatedLoss || 0) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="validation" class="section-title">
          数据校验评分
          <el-tag size="small" :type="validation.isValid ? 'success' : 'danger'" style="margin-left: 8px;">
            {{ validation.isValid ? '合规' : '不合规' }}
          </el-tag>
        </div>
        <div v-if="validation" class="score-cards">
          <div class="score-card">
            <div class="score-label">真实性评分</div>
            <div class="score-value" :class="scoreClass(validation.authenticityScore)">
              {{ validation.authenticityScore.toFixed(1) }}
            </div>
            <el-progress
              :percentage="validation.authenticityScore"
              :color="scoreColor(validation.authenticityScore)"
              :stroke-width="6"
            />
          </div>
          <div class="score-card">
            <div class="score-label">合规性评分</div>
            <div class="score-value" :class="scoreClass(validation.complianceScore)">
              {{ validation.complianceScore.toFixed(1) }}
            </div>
            <el-progress
              :percentage="validation.complianceScore"
              :color="scoreColor(validation.complianceScore)"
              :stroke-width="6"
            />
          </div>
        </div>

        <div v-if="validation && validation.errors.length > 0" class="validation-errors">
          <div class="error-title"><el-icon><Warning /></el-icon> 校验错误</div>
          <ul>
            <li v-for="(err, idx) in validation.errors" :key="idx">
              {{ err }}
            </li>
          </ul>
        </div>

        <div v-if="validation && validation.warnings.length > 0" class="validation-warnings">
          <div class="warning-title"><el-icon><InfoFilled /></el-icon> 校验警告</div>
          <ul>
            <li v-for="(warn, idx) in validation.warnings" :key="idx">
              {{ warn }}
            </li>
          </ul>
        </div>

        <div v-if="validation && validation.blockReason" class="block-info">
          <el-alert
            :title="'拦截原因：' + TRAFFIC_ANOMALY_BLOCK_REASON_NAMES[validation.blockReason]"
            type="error"
            :closable="false"
          >
            <div v-if="validation.blockDetail" class="block-detail">
              <pre>{{ JSON.stringify(validation.blockDetail, null, 2) }}</pre>
            </div>
          </el-alert>
        </div>

        <div v-if="detailData.deviceInfo || detailData.behaviorDetail || detailData.traceData || detailData.frequencyData" class="section-title">
          详细数据
        </div>
        <div v-if="detailData.deviceInfo" class="data-section">
          <div class="data-label">设备信息</div>
          <pre class="formatted-data">{{ formatJson(detailData.deviceInfo) }}</pre>
        </div>
        <div v-if="detailData.behaviorDetail" class="data-section">
          <div class="data-label">行为详情</div>
          <pre class="formatted-data">{{ formatJson(detailData.behaviorDetail) }}</pre>
        </div>
        <div v-if="detailData.traceData" class="data-section">
          <div class="data-label">溯源轨迹</div>
          <pre class="formatted-data">{{ formatJson(detailData.traceData) }}</pre>
        </div>
        <div v-if="detailData.frequencyData" class="data-section">
          <div class="data-label">频次数据</div>
          <pre class="formatted-data">{{ formatJson(detailData.frequencyData) }}</pre>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Warning, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { getTrafficAnomalyDetail } from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_TYPE_COLORS,
  TRAFFIC_ANOMALY_RISK_LEVEL_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES,
  TRAFFIC_ANOMALY_STATUS_NAMES,
  TRAFFIC_ANOMALY_STATUS_TAG_TYPES,
  TRAFFIC_ANOMALY_SOURCE_NAMES,
  TRAFFIC_ANOMALY_BLOCK_REASON_NAMES
} from '@/enums/business'
import { formatDateTime, formatNumber } from '@hooks/index'
import type { TrafficAnomalyRecord, AnomalyValidationResult, TrafficAnomalyHandleLog, TrafficAnomalyPermission } from '@/types/business'

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
const detailData = ref<TrafficAnomalyRecord | null>(null)
const validation = ref<AnomalyValidationResult | null>(null)
const handleLogs = ref<TrafficAnomalyHandleLog[]>([])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fetchDetail = async () => {
  if (!props.anomalyId) return
  loading.value = true
  try {
    const res = await getTrafficAnomalyDetail(props.anomalyId)
    detailData.value = res.anomaly
    validation.value = res.validation
    handleLogs.value = res.handleLogs
  } finally {
    loading.value = false
  }
}

const formatJson = (str: string) => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch (_e) {
    return str
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
  detailData.value = null
  validation.value = null
  handleLogs.value = []
}

watch(() => [props.modelValue, props.anomalyId], ([visible, id]) => {
  if (visible && id) {
    computePermission()
    fetchDetail()
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.anomaly-detail {
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 20px 0 12px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }

  .mono-text {
    font-family: 'Courier New', monospace;
    color: #606266;
  }

  .danger-text {
    color: #f56c6c;
    font-weight: 500;
  }

  .score-cards {
    display: flex;
    gap: 24px;
    margin: 16px 0;
  }

  .score-card {
    flex: 1;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    text-align: center;

    .score-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }
    .score-value {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
      &.high { color: #67c23a; }
      &.mid { color: #e6a23c; }
      &.low { color: #f56c6c; }
    }
  }

  .validation-errors, .validation-warnings {
    margin: 16px 0;
    padding: 12px 16px;
    border-radius: 4px;

    ul {
      margin: 8px 0 0 16px;
      padding: 0;
      li {
        font-size: 13px;
        line-height: 1.8;
      }
    }
  }

  .validation-errors {
    background: #fef0f0;
    .error-title {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f56c6c;
      font-weight: 500;
    }
    li {
      color: #f56c6c;
    }
  }

  .validation-warnings {
    background: #fdf6ec;
    .warning-title {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #e6a23c;
      font-weight: 500;
    }
    li {
      color: #e6a23c;
    }
  }

  .block-info {
    margin-top: 16px;
    .block-detail {
      margin-top: 8px;
      pre {
        background: rgba(0, 0, 0, 0.04);
        padding: 12px;
        border-radius: 4px;
        font-size: 12px;
        max-height: 200px;
        overflow: auto;
      }
    }
  }

  .data-section {
    margin-bottom: 16px;
    .data-label {
      font-size: 13px;
      color: #606266;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .formatted-data {
      background: #f4f4f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      max-height: 300px;
      overflow: auto;
      margin: 0;
    }
  }
}
</style>
