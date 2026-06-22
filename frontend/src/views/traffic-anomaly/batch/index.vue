<template>
  <div class="traffic-anomaly-batch">
    <el-card shadow="never">
      <div class="page-title">
        <el-icon size="20" color="#f56c6c"><Warning /></el-icon>
        <span>批量处置异常流量</span>
        <el-tag type="warning" size="small" style="margin-left: 12px;">
          仅超级管理员 / 风控管理员 可操作
        </el-tag>
      </div>

      <el-divider />

      <el-form :model="batchForm" label-width="120px">
        <el-form-item label="处置方式" required>
          <el-radio-group v-model="batchForm.handleType" style="display: flex; gap: 24px;">
            <el-radio
              v-for="item in handleOptions"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled"
            >
              <span :style="{ color: item.color }">{{ item.label }}</span>
              <span style="color: #909399; font-size: 12px; margin-left: 4px;">({{ item.desc }})</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="筛选条件">
          <el-select
            v-model="batchForm.riskLevel"
            placeholder="风险等级（可选）"
            clearable
            style="width: 180px; margin-right: 12px;"
          >
            <el-option
              v-for="(name, level) in TRAFFIC_ANOMALY_RISK_LEVEL_NAMES"
              :key="level"
              :label="name"
              :value="Number(level)"
            />
          </el-select>
          <el-select
            v-model="batchForm.anomalyType"
            placeholder="异常类型（可选）"
            clearable
            style="width: 180px;"
          >
            <el-option
              v-for="(name, type) in TRAFFIC_ANOMALY_TYPE_NAMES"
              :key="type"
              :label="name"
              :value="type"
            />
          </el-select>
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            提示：不选择筛选项将对所有符合条件的记录进行批量处置，请谨慎操作
          </div>
        </el-form-item>

        <el-form-item label="手动选择ID" prop="ids">
          <el-select
            v-model="batchForm.ids"
            multiple
            filterable
            allow-create
            placeholder="输入异常记录ID，回车添加"
            style="width: 100%;"
          >
            <el-option
              v-for="id in batchForm.ids"
              :key="id"
              :label="String(id)"
              :value="id"
            />
          </el-select>
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            提示：也可手动输入ID进行指定记录的批量处置
          </div>
        </el-form-item>

        <el-form-item label="处置原因" required>
          <el-input
            v-model="batchForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入处置原因，将作为操作留痕"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            执行批量处置
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider v-if="previewCount > 0" />

      <div v-if="previewCount > 0" class="preview-section">
        <div class="preview-title">
          <el-icon><InfoFilled /></el-icon>
          处置预览
        </div>
        <el-alert
          :title="`预计将对 ${previewCount} 条记录执行「${currentHandleName}」操作`"
          :type="previewType"
          show-icon
          :closable="false"
        />

        <div v-if="resultData" class="result-section">
          <el-row :gutter="24">
            <el-col :span="8">
              <div class="result-card success-card">
                <div class="result-label">成功</div>
                <div class="result-value">{{ resultData.success }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="result-card failed-card">
                <div class="result-label">失败</div>
                <div class="result-value">{{ resultData.failed }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="result-card total-card">
                <div class="result-label">总计</div>
                <div class="result-value">{{ resultData.total }}</div>
              </div>
            </el-col>
          </el-row>

          <div v-if="resultData.results && resultData.results.length > 0" class="result-detail">
            <el-table :data="resultData.results" border size="small" max-height="300">
              <el-table-column prop="id" label="记录ID" width="120" align="center" />
              <el-table-column label="结果" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.success ? 'success' : 'danger'">
                    {{ row.success ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="error" label="错误信息" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Warning, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { batchHandleTrafficAnomalies, getTrafficAnomalyStats } from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_NAMES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES,
  TrafficAnomalyHandleTypeCode
} from '@/enums/business'
import type { TrafficAnomalyBatchResult, TrafficAnomalyPermission } from '@/types/business'

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

const stats = ref<any>({})
const submitting = ref(false)
const resultData = ref<TrafficAnomalyBatchResult | null>(null)

const batchForm = reactive({
  handleType: '',
  riskLevel: undefined as number | undefined,
  anomalyType: '',
  ids: [] as number[],
  reason: ''
})

const handleOptions = [
  { value: TrafficAnomalyHandleTypeCode.BATCH_CLEAN, label: '批量清理数据', desc: '清理异常流量数据', color: '#67c23a', disabled: false },
  { value: TrafficAnomalyHandleTypeCode.BATCH_RELEASE, label: '批量解除风控', desc: '解除轻微异常的风控限制', color: '#67c23a', disabled: false },
  { value: TrafficAnomalyHandleTypeCode.BATCH_BAN, label: '批量封禁账号', desc: '永久封禁重度异常账号', color: '#c45656', disabled: false }
]

const canSubmit = computed(() => {
  if (!batchForm.handleType) return false
  if (!batchForm.reason.trim()) return false
  if (batchForm.ids.length > 0) return true
  if (batchForm.riskLevel !== undefined || batchForm.anomalyType) return true
  return false
})

const currentHandleName = computed(() => {
  return TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[batchForm.handleType as keyof typeof TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES] || ''
})

const previewCount = computed(() => {
  if (batchForm.ids.length > 0) return batchForm.ids.length
  if (!batchForm.handleType) return 0
  let count = stats.value.total || 0
  if (batchForm.riskLevel !== undefined) {
    const level = batchForm.riskLevel
    if (level === 3) count = stats.value.highRisk || 0
  }
  return count
})

const previewType = computed(() => {
  if (batchForm.handleType === TrafficAnomalyHandleTypeCode.BATCH_BAN) return 'error'
  if (batchForm.handleType === TrafficAnomalyHandleTypeCode.BATCH_RELEASE) return 'success'
  return 'warning'
})

const fetchStats = async () => {
  try {
    const res = await getTrafficAnomalyStats()
    stats.value = res
  } catch (_err) {
    // ignore
  }
}

const handleSubmit = async () => {
  if (!permission.canBatch) {
    ElMessage.error('无权限执行批量处置')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定对 ${previewCount.value} 条记录执行「${currentHandleName.value}」吗？\n\n此操作不可恢复，请谨慎操作！`,
      '批量处置二次确认',
      {
        type: 'warning',
        confirmButtonText: '确认执行',
        cancelButtonText: '取消'
      }
    )
  } catch (_err) {
    return
  }

  submitting.value = true
  resultData.value = null

  try {
    const params: any = {
      handleType: batchForm.handleType,
      reason: batchForm.reason.trim()
    }

    if (batchForm.ids.length > 0) {
      params.ids = batchForm.ids
    } else {
      if (batchForm.riskLevel !== undefined) params.riskLevel = batchForm.riskLevel
      if (batchForm.anomalyType) params.anomalyType = batchForm.anomalyType
    }

    const res = await batchHandleTrafficAnomalies(params)
    resultData.value = res

    if (res.failed === 0) {
      ElMessage.success(`批量操作完成：成功 ${res.success} 条`)
    } else {
      ElMessage.warning(`批量操作完成：成功 ${res.success} 条，失败 ${res.failed} 条`)
    }

    fetchStats()
  } catch (err) {
    const error = err instanceof Error ? err.message : '操作失败'
    ElMessage.error(error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  batchForm.handleType = ''
  batchForm.riskLevel = undefined
  batchForm.anomalyType = ''
  batchForm.ids = []
  batchForm.reason = ''
  resultData.value = null
}

onMounted(() => {
  computePermission()
  fetchStats()
})
</script>

<style scoped lang="scss">
.traffic-anomaly-batch {
  .page-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    gap: 8px;
  }

  .preview-section {
    margin-top: 16px;
    .preview-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      margin-bottom: 12px;
      color: #303133;
    }
  }

  .result-section {
    margin-top: 20px;
  }

  .result-card {
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    color: #fff;
    .result-label {
      font-size: 13px;
      opacity: 0.85;
      margin-bottom: 8px;
    }
    .result-value {
      font-size: 32px;
      font-weight: 600;
    }
  }
  .success-card {
    background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  }
  .failed-card {
    background: linear-gradient(135deg, #f56c6c 0%, #c45656 100%);
  }
  .total-card {
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  }

  .result-detail {
    margin-top: 20px;
  }
}
</style>
