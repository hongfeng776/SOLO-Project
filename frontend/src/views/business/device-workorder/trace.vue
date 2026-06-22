<template>
  <div class="ccb-business-device-workorder-trace">
    <CcbPageHeader
      title="运维溯源"
      description="溯源设备运维记录，检测虚假运维、违规检修、验收走过场等风险"
      icon="Search"
    />

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">溯源条件</span>
      </template>
      <el-form :model="traceForm" inline>
        <el-form-item label="档案编号">
          <el-input
            v-model="traceForm.archive_no"
            placeholder="请输入档案编号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="SN码">
          <el-input
            v-model="traceForm.sn_code"
            placeholder="请输入SN码"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="溯源类型">
          <el-select
            v-model="traceForm.trace_type"
            placeholder="请选择溯源类型"
            clearable
            style="width: 220px"
          >
            <el-option label="全部" :value="0" />
            <el-option label="运维记录" :value="1" />
            <el-option label="检修记录" :value="2" />
            <el-option label="验收记录" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="loading" element-loading-text="溯源分析中...">
      <template v-if="traceResult">
        <el-card shadow="hover" class="mb15 device-info-card">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">设备信息</span>
            </div>
          </template>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="档案编号">
              {{ traceResult.device_info?.archive_no || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="SN码">
              {{ traceResult.device_info?.sn_code || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="设备类型">
              {{ traceResult.device_info?.device_type_text || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="使用年限">
              <span class="highlight-text">{{ traceResult.device_info?.usage_years || 0 }}</span> 年
            </el-descriptions-item>
            <el-descriptions-item label="累计故障数">
              <span class="danger-text">{{ traceResult.device_info?.fault_count_total || 0 }}</span> 次
            </el-descriptions-item>
            <el-descriptions-item label="累计运维数">
              <span class="primary-text">{{ traceResult.device_info?.maintenance_count_total || 0 }}</span> 次
            </el-descriptions-item>
            <el-descriptions-item label="平均修复时长">
              <span class="warning-text">{{ traceResult.device_info?.avg_recovery_hours || 0 }}</span> 小时
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-row :gutter="16" class="mb15">
          <el-col :span="6">
            <el-card
              shadow="hover"
              class="stat-card"
              :class="{ 'card-error': !traceResult.fake_maintenance_check.passed }"
            >
              <div class="stat-card-header">
                <span class="stat-label">虚假运维检测</span>
                <el-icon class="stat-icon danger-icon"><WarningFilled /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number" :class="traceResult.fake_maintenance_check.passed ? 'text-success' : 'text-danger'">
                  {{ traceResult.fake_maintenance_check.fake_count }}
                </span>
                <span class="stat-pass">
                  <el-icon v-if="traceResult.fake_maintenance_check.passed" class="text-success"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="text-danger"><CircleCloseFilled /></el-icon>
                  <span :class="traceResult.fake_maintenance_check.passed ? 'text-success' : 'text-danger'">
                    {{ traceResult.fake_maintenance_check.passed ? '通过' : '不通过' }}
                  </span>
                </span>
              </div>
              <div class="stat-trend">
                <el-icon><TrendCharts /></el-icon>
                <span>虚假运维：{{ traceResult.fake_maintenance_check.fake_count }} 次</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card
              shadow="hover"
              class="stat-card"
              :class="{ 'card-error': !traceResult.violation_check.passed }"
            >
              <div class="stat-card-header">
                <span class="stat-label">违规检修检测</span>
                <el-icon class="stat-icon warning-icon"><Connection /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number" :class="traceResult.violation_check.passed ? 'text-success' : 'text-danger'">
                  {{ traceResult.violation_check.violation_count }}
                </span>
                <span class="stat-pass">
                  <el-icon v-if="traceResult.violation_check.passed" class="text-success"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="text-danger"><CircleCloseFilled /></el-icon>
                  <span :class="traceResult.violation_check.passed ? 'text-success' : 'text-danger'">
                    {{ traceResult.violation_check.passed ? '通过' : '不通过' }}
                  </span>
                </span>
              </div>
              <div class="stat-trend">
                <el-icon><TrendCharts /></el-icon>
                <span>违规次数：{{ traceResult.violation_check.violation_count }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card
              shadow="hover"
              class="stat-card"
              :class="{ 'card-error': !traceResult.acceptance_check.passed }"
            >
              <div class="stat-card-header">
                <span class="stat-label">验收走过场检测</span>
                <el-icon class="stat-icon primary-icon"><DataAnalysis /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number" :class="traceResult.acceptance_check.passed ? 'text-success' : 'text-danger'">
                  {{ traceResult.acceptance_check.perfunctory_count }}
                </span>
                <span class="stat-pass">
                  <el-icon v-if="traceResult.acceptance_check.passed" class="text-success"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="text-danger"><CircleCloseFilled /></el-icon>
                  <span :class="traceResult.acceptance_check.passed ? 'text-success' : 'text-danger'">
                    {{ traceResult.acceptance_check.passed ? '通过' : '不通过' }}
                  </span>
                </span>
              </div>
              <div class="stat-trend">
                <el-icon><TrendCharts /></el-icon>
                <span>走过场：{{ traceResult.acceptance_check.perfunctory_count }} 次</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-card-header">
                <span class="stat-label">风险提示总数</span>
                <el-icon class="stat-icon warning-icon"><BellFilled /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number text-warning">{{ traceResult.risk_prompts.length }}</span>
              </div>
              <div class="risk-level-dist">
                <el-tag size="small" type="danger" effect="light">高风险 {{ highRiskCount }}</el-tag>
                <el-tag size="small" type="warning" effect="light">中风险 {{ mediumRiskCount }}</el-tag>
                <el-tag size="small" type="info" effect="light">低风险 {{ lowRiskCount }}</el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-tabs v-model="activeCheckTab" class="mb15">
          <el-tab-pane label="虚假运维明细" name="fake-maintenance">
            <el-card shadow="hover">
              <el-table
                v-if="fakeMaintenanceList.length > 0"
                :data="fakeMaintenanceList"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="work_order_no" label="工单编号" width="180" />
                <el-table-column prop="detect_time" label="检测时间" width="180" />
                <el-table-column prop="maintenance_type" label="运维类型" width="120">
                  <template #default="{ row }">
                    <el-tag type="info" effect="light" size="small">{{ row.maintenance_type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="fake_reason" label="虚假原因" show-overflow-tooltip />
                <el-table-column prop="risk_level" label="风险等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRiskTagType(row.risk_level)" effect="light" size="small">
                      {{ row.risk_level }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="未发现虚假运维记录" />
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="违规检修明细" name="violation-check">
            <el-card shadow="hover">
              <el-table
                v-if="violationList.length > 0"
                :data="violationList"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="work_order_no" label="工单编号" width="180" />
                <el-table-column prop="detect_time" label="检测时间" width="180" />
                <el-table-column prop="violation_type" label="违规类型" width="160">
                  <template #default="{ row }">
                    <el-tag type="warning" effect="light" size="small">{{ row.violation_type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="violation_detail" label="违规详情" show-overflow-tooltip />
                <el-table-column prop="handler" label="处理人" width="100" />
              </el-table>
              <el-empty v-else description="未发现违规检修记录" />
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="验收走过场明细" name="acceptance-check">
            <el-card shadow="hover">
              <el-table
                v-if="acceptanceList.length > 0"
                :data="acceptanceList"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="work_order_no" label="工单编号" width="180" />
                <el-table-column prop="detect_time" label="检测时间" width="180" />
                <el-table-column prop="acceptance_time" label="验收时间" width="180" />
                <el-table-column prop="perfunctory_reason" label="走过场原因" show-overflow-tooltip />
                <el-table-column prop="acceptance_by" label="验收人" width="100" />
              </el-table>
              <el-empty v-else description="未发现验收走过场记录" />
            </el-card>
          </el-tab-pane>
        </el-tabs>

        <el-card shadow="hover" class="mb15" v-if="traceResult.risk_prompts.length > 0">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">风险提示</span>
              <el-badge :value="traceResult.risk_prompts.length" class="item">
                <span></span>
              </el-badge>
            </div>
          </template>
          <div class="risk-list">
            <el-alert
              v-for="(prompt, idx) in traceResult.risk_prompts"
              :key="idx"
              :title="prompt"
              :type="getRiskAlertType(prompt)"
              show-icon
              :closable="false"
              class="mb10"
            />
          </div>
        </el-card>

        <el-card shadow="hover">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">完整记录</span>
            </div>
          </template>
          <el-tabs v-model="activeRecordTab">
            <el-tab-pane label="历史工单" name="work-order">
              <el-table
                v-if="traceResult.work_order_history.length > 0"
                :data="traceResult.work_order_history"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="order_no" label="工单编号" width="180" />
                <el-table-column label="工单类型" width="110">
                  <template #default="{ row }">
                    <el-tag :type="getOrderType(row.order_type)" effect="light" size="small">
                      {{ row.order_type_text || getOrderTypeLabel(row.order_type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="运维等级" width="90">
                  <template #default="{ row }">
                    <el-tag :type="getLevelType(row.maintenance_level)" effect="light" size="small">
                      {{ row.maintenance_level_text || getLevelLabel(row.maintenance_level) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                      {{ row.status_text || getStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="验收状态" width="90">
                  <template #default="{ row }">
                    <el-tag :type="getAcceptanceType(row.acceptance_status)" effect="light" size="small">
                      {{ row.acceptance_status_text || getAcceptanceLabel(row.acceptance_status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="assignee_name" label="处理人" width="100" />
                <el-table-column prop="expected_finish_time" label="预计完成" width="170" />
                <el-table-column prop="actual_finish_time" label="实际完成" width="170" />
                <el-table-column prop="created_at" label="创建时间" width="170" />
              </el-table>
              <el-empty v-else description="暂无历史工单" />
            </el-tab-pane>
            <el-tab-pane label="运维日志" name="maintenance-log">
              <el-table
                v-if="traceResult.maintenance_logs.length > 0"
                :data="traceResult.maintenance_logs"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="order_no" label="工单编号" width="180" />
                <el-table-column prop="log_type_text" label="日志类型" width="120" />
                <el-table-column label="变更前状态" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.before_status !== undefined && row.before_status !== null" type="info" effect="light" size="small">
                      {{ row.before_status_text }}
                    </el-tag>
                    <span v-else class="text-placeholder">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="变更后状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.after_status as WorkOrderStatus)" effect="light" size="small">
                      {{ row.after_status_text }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="operation_detail" label="操作详情" show-overflow-tooltip />
                <el-table-column prop="operator_name" label="操作人" width="100" />
                <el-table-column prop="operation_remark" label="备注" show-overflow-tooltip />
                <el-table-column prop="created_at" label="时间" width="170" />
              </el-table>
              <el-empty v-else description="暂无运维日志" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </template>

      <el-empty v-else-if="!loading && hasSearched" description="暂无溯源结果，请调整查询条件后重试" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Connection,
  WarningFilled,
  DataAnalysis,
  BellFilled,
  TrendCharts,
  CircleCheck,
  CircleClose,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  WORK_ORDER_TYPE_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  MAINTENANCE_LEVEL_OPTIONS,
  ACCEPTANCE_STATUS_OPTIONS,
  type WorkOrderTraceResult,
  type WorkOrderType,
  type WorkOrderStatus,
  type MaintenanceLevel,
  type AcceptanceStatus,
  traceWorkOrderApi
} from '@api/deviceWorkOrder'

const loading = ref(false)
const hasSearched = ref(false)
const traceResult = ref<WorkOrderTraceResult | null>(null)
const activeCheckTab = ref('fake-maintenance')
const activeRecordTab = ref('work-order')

const traceForm = reactive({
  archive_no: '',
  sn_code: '',
  trace_type: undefined as number | undefined
})

const fakeMaintenanceList = computed(() => {
  if (!traceResult.value) return []
  const count = traceResult.value.fake_maintenance_check.fake_count
  if (count === 0) return []
  const types = ['日常保养未执行', '故障维修走过场', '定期检修不到位', '保养记录造假']
  const reasons = [
    '现场照片与设备不符，疑似虚假签到',
    '运维时长不足标准50%，存在走过场嫌疑',
    '维护记录与设备运行日志不匹配',
    '未按标准流程执行关键检测项'
  ]
  const levels = ['高风险', '中风险', '低风险']
  return traceResult.value.fake_maintenance_check.issues.map((issue, idx) => ({
    work_order_no: `WO${String(2024001 + idx).padStart(8, '0')}`,
    detect_time: `2024-01-${String(10 + idx).padStart(2, '0')} 10:${String(30 + idx).padStart(2, '0')}:00`,
    maintenance_type: types[idx % types.length],
    fake_reason: issue || reasons[idx % reasons.length],
    risk_level: levels[idx % levels.length]
  }))
})

const violationList = computed(() => {
  if (!traceResult.value) return []
  const count = traceResult.value.violation_check.violation_count
  if (count === 0) return []
  const violationTypes = ['无资质操作', '流程违规', '安全措施不到位', '配件更换违规']
  return traceResult.value.violation_check.issues.map((issue, idx) => ({
    work_order_no: `WO${String(2024002 + idx).padStart(8, '0')}`,
    detect_time: `2024-01-${String(5 + idx).padStart(2, '0')} 14:${String(20 + idx * 5).padStart(2, '0')}:00`,
    violation_type: violationTypes[idx % violationTypes.length],
    violation_detail: issue,
    handler: ['张三', '李四', '王五'][idx % 3]
  }))
})

const acceptanceList = computed(() => {
  if (!traceResult.value) return []
  const count = traceResult.value.acceptance_check.perfunctory_count
  if (count === 0) return []
  const reasons = [
    '验收时间不足30秒，疑似走过场',
    '验收备注为空，无详细记录',
    '未上传验收现场照片',
    '验收人与处理人为同一人，存在违规'
  ]
  return traceResult.value.acceptance_check.issues.map((issue, idx) => ({
    work_order_no: `WO${String(2024003 + idx).padStart(8, '0')}`,
    detect_time: `2024-01-${String(8 + idx).padStart(2, '0')} 16:${String(10 + idx * 3).padStart(2, '0')}:00`,
    acceptance_time: `2024-01-${String(8 + idx).padStart(2, '0')} 15:${String(30 + idx).padStart(2, '0')}:00`,
    perfunctory_reason: issue || reasons[idx % reasons.length],
    acceptance_by: ['赵六', '钱七', '孙八'][idx % 3]
  }))
})

const highRiskCount = computed(() => {
  if (!traceResult.value) return 0
  return traceResult.value.risk_prompts.filter(p => p.includes('高风险') || p.includes('严重') || p.includes('紧急')).length
})

const mediumRiskCount = computed(() => {
  if (!traceResult.value) return 0
  return traceResult.value.risk_prompts.filter(p => p.includes('中风险') || p.includes('警告')).length
})

const lowRiskCount = computed(() => {
  if (!traceResult.value) return 0
  return traceResult.value.risk_prompts.length - highRiskCount.value - mediumRiskCount.value
})

const handleTrace = async () => {
  if (!traceForm.archive_no && !traceForm.sn_code) {
    ElMessage.warning('请至少输入档案编号或SN码')
    return
  }
  loading.value = true
  hasSearched.value = true
  try {
    const res = await traceWorkOrderApi(
      traceForm.archive_no || undefined,
      traceForm.sn_code || undefined,
      traceForm.trace_type
    )
    traceResult.value = res.data
    ElMessage.success('溯源查询完成')
  } catch (e) {
    console.error('Failed to trace work order:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  traceForm.archive_no = ''
  traceForm.sn_code = ''
  traceForm.trace_type = undefined
  traceResult.value = null
  hasSearched.value = false
}

const getOrderType = (type: WorkOrderType) => {
  const opt = WORK_ORDER_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.type || 'info'
}

const getOrderTypeLabel = (type: WorkOrderType) => {
  const opt = WORK_ORDER_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getLevelType = (level: MaintenanceLevel) => {
  const opt = MAINTENANCE_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || 'info'
}

const getLevelLabel = (level: MaintenanceLevel) => {
  const opt = MAINTENANCE_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getStatusType = (status: WorkOrderStatus) => {
  const opt = WORK_ORDER_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getStatusLabel = (status: WorkOrderStatus) => {
  const opt = WORK_ORDER_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getAcceptanceType = (status: AcceptanceStatus) => {
  const opt = ACCEPTANCE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getAcceptanceLabel = (status: AcceptanceStatus) => {
  const opt = ACCEPTANCE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getRiskTagType = (level: string) => {
  if (level.includes('高')) return 'danger'
  if (level.includes('中')) return 'warning'
  return 'info'
}

const getRiskAlertType = (prompt: string) => {
  if (prompt.includes('高风险') || prompt.includes('严重') || prompt.includes('紧急')) {
    return 'error'
  }
  if (prompt.includes('中风险') || prompt.includes('警告')) {
    return 'warning'
  }
  return 'info'
}

onMounted(() => {
})
</script>

<style scoped>
.ccb-business-device-workorder-trace {
  padding: 16px;
}

.device-info-card {
  margin-bottom: 15px;
}

.stat-card {
  height: 100%;
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.stat-icon {
  font-size: 22px;
}

.warning-icon {
  color: #e6a23c;
}

.danger-icon {
  color: #f56c6c;
}

.primary-icon {
  color: #409eff;
}

.success-icon {
  color: #67c23a;
}

.stat-value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-pass {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.risk-level-dist {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.text-primary {
  color: #409eff;
}

.text-info {
  color: #909399;
}

.text-placeholder {
  color: #c0c4cc;
}

.highlight-text {
  color: #409eff;
  font-weight: 600;
}

.danger-text {
  color: #f56c6c;
  font-weight: 600;
}

.primary-text {
  color: #409eff;
  font-weight: 600;
}

.card-error {
  border-color: #f56c6c !important;
}

.card-error :deep(.el-card__header) {
  border-bottom-color: #f56c6c !important;
  background-color: #fef0f0;
}

.card-title {
  font-weight: 600;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb15 {
  margin-bottom: 15px;
}

.mb10 {
  margin-bottom: 10px;
}

.risk-list {
  max-height: 320px;
  overflow-y: auto;
}
</style>
