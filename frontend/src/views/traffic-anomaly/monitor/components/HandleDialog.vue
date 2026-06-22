<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" v-if="detailData" class="handle-form">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 16px;">
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
        <el-descriptions-item label="用户">
          {{ detailData.userName }}
        </el-descriptions-item>
        <el-descriptions-item label="置信度">
          {{ ((detailData.confidence || 0) * 100).toFixed(0) }}%
        </el-descriptions-item>
        <el-descriptions-item label="当前状态" :span="2">
          <el-tag
            size="small"
            :type="TRAFFIC_ANOMALY_STATUS_TAG_TYPES[detailData.status]"
          >
            {{ TRAFFIC_ANOMALY_STATUS_NAMES[detailData.status] }}
          </el-tag>
          <el-icon class="arrow-icon"><Right /></el-icon>
          <el-tag
            size="small"
            :type="targetStatusTagType"
            style="margin-left: 4px;"
          >
            {{ targetStatusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="影响内容" v-if="detailData.affectedContentCount">
          {{ detailData.affectedContentCount }} 条
        </el-descriptions-item>
        <el-descriptions-item label="影响用户" v-if="detailData.affectedUserCount">
          {{ detailData.affectedUserCount }} 人
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="80px">
        <el-form-item label="处置类型">
          <el-tag
            :color="TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS[handleType]"
            effect="light"
            style="color: #fff;"
          >
            {{ TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[handleType] }}
          </el-tag>
        </el-form-item>
        <el-form-item label="处置原因" required>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="3"
            placeholder="请输入处置原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm" :disabled="!permission.canHandle">
        确认处置
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Right } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { handleTrafficAnomaly, getTrafficAnomalyDetail } from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_TYPE_COLORS,
  TRAFFIC_ANOMALY_RISK_LEVEL_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES,
  TRAFFIC_ANOMALY_STATUS_NAMES,
  TRAFFIC_ANOMALY_STATUS_TAG_TYPES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS,
  TrafficAnomalyStatusCode,
  TrafficAnomalyHandleTypeCode
} from '@/enums/business'
import type { TrafficAnomalyRecord, TrafficAnomalyPermission } from '@/types/business'

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
  id: number
  handleType: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'handleSuccess', anomaly: TrafficAnomalyRecord): void
}>()

const detailData = ref<TrafficAnomalyRecord | null>(null)
const loading = ref(false)

const reason = ref('')
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  return `处置：${TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[props.handleType as keyof typeof TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES] || ''}`
})

const handleStatusMap: Record<string, number> = {
  [TrafficAnomalyHandleTypeCode.INTERCEPT_FLOW]: TrafficAnomalyStatusCode.INTERCEPTED,
  [TrafficAnomalyHandleTypeCode.CONTENT_FLOW_LIMIT]: TrafficAnomalyStatusCode.FLOW_LIMITED,
  [TrafficAnomalyHandleTypeCode.ACCOUNT_DOWNGRADE]: TrafficAnomalyStatusCode.ACCOUNT_DOWNGRADED,
  [TrafficAnomalyHandleTypeCode.PERMANENT_BAN]: TrafficAnomalyStatusCode.PERMANENT_BANNED,
  [TrafficAnomalyHandleTypeCode.CLEAN_DATA]: TrafficAnomalyStatusCode.INTERCEPTED,
  [TrafficAnomalyHandleTypeCode.RELEASE_CONTROL]: TrafficAnomalyStatusCode.RELEASED
}

const targetStatusName = computed(() => {
  const status = handleStatusMap[props.handleType]
  return status !== undefined ? TRAFFIC_ANOMALY_STATUS_NAMES[status] : '-'
})

const targetStatusTagType = computed(() => {
  const status = handleStatusMap[props.handleType]
  return status !== undefined
    ? TRAFFIC_ANOMALY_STATUS_TAG_TYPES[status as keyof typeof TRAFFIC_ANOMALY_STATUS_TAG_TYPES]
    : 'info'
})

const fetchDetail = async () => {
  if (!props.id) return
  loading.value = true
  try {
    const res = await getTrafficAnomalyDetail(props.id)
    detailData.value = res.anomaly
  } finally {
    loading.value = false
  }
}

const handleConfirm = async () => {
  if (!reason.value.trim()) {
    ElMessage.warning('请输入处置原因')
    return
  }
  if (!detailData.value) return

  submitting.value = true
  try {
    const res = await handleTrafficAnomaly(props.id, {
      handleType: props.handleType,
      reason: reason.value.trim()
    })
    detailData.value = res.anomaly
    ElMessage.success('处置成功')
    emit('handleSuccess', res.anomaly)
    dialogVisible.value = false
  } catch (err) {
    const error = err instanceof Error ? err.message : '处置失败'
    ElMessage.error(error)
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  reason.value = ''
  detailData.value = null
}

watch(() => [props.modelValue, props.id], ([visible, id]) => {
  if (visible && id) {
    computePermission()
    fetchDetail()
    reason.value = ''
  }
})
</script>

<style scoped lang="scss">
.handle-form {
  .arrow-icon {
    margin: 0 8px;
    color: #909399;
  }
}
</style>
