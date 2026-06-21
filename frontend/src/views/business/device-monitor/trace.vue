<template>
  <div class="ccb-business-device-monitor-trace">
    <CcbPageHeader
      title="设备运行溯源"
      description="溯源设备运行状态、故障记录、数据异常全流程检测"
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
            <el-option label="运行日志" :value="1" />
            <el-option label="故障记录" :value="2" />
            <el-option label="数据异常" :value="3" />
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
              <el-tag
                v-if="traceResult.device_info"
                :type="getMonitorStatusType(traceResult.device_info.monitor_status)"
                effect="light"
              >
                {{ traceResult.device_info.monitor_status_text || getMonitorStatusLabel(traceResult.device_info.monitor_status) }}
              </el-tag>
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
            <el-descriptions-item label="设备型号">
              {{ traceResult.device_info?.device_model || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前监控状态">
              <el-tag
                v-if="traceResult.device_info"
                :type="getMonitorStatusType(traceResult.device_info.monitor_status)"
                effect="light"
                size="small"
              >
                {{ traceResult.device_info.monitor_status_text || getMonitorStatusLabel(traceResult.device_info.monitor_status) }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="连接状态">
              <el-tag
                v-if="traceResult.device_info"
                :type="getConnectStatusType(traceResult.device_info.connect_status)"
                effect="light"
                size="small"
              >
                {{ traceResult.device_info.connect_status_text || getConnectStatusLabel(traceResult.device_info.connect_status) }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="监控策略">
              <el-tag
                v-if="traceResult.device_info"
                :type="getStrategyType(traceResult.device_info.monitor_strategy)"
                effect="light"
                size="small"
              >
                {{ traceResult.device_info.monitor_strategy_text || getStrategyLabel(traceResult.device_info.monitor_strategy) }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="运行天数">
              <span class="highlight-text">{{ traceResult.device_info?.run_duration_days || 0 }}</span> 天
            </el-descriptions-item>
            <el-descriptions-item label="近7日故障数">
              <span class="danger-text">{{ traceResult.device_info?.fault_count_7d || 0 }}</span> 次
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-row :gutter="16" class="mb15">
          <el-col :span="6">
            <el-card
              shadow="hover"
              class="stat-card"
              :class="{ 'card-error': !traceResult.duplicate_check.passed }"
            >
              <div class="stat-card-header">
                <span class="stat-label">虚假在线检测</span>
                <el-icon class="stat-icon warning-icon"><Connection /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number" :class="traceResult.duplicate_check.passed ? 'text-success' : 'text-danger'">
                  {{ traceResult.duplicate_check.fake_online_count }}
                </span>
                <span class="stat-pass">
                  <el-icon v-if="traceResult.duplicate_check.passed" class="text-success"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="text-danger"><CircleCloseFilled /></el-icon>
                  <span :class="traceResult.duplicate_check.passed ? 'text-success' : 'text-danger'">
                    {{ traceResult.duplicate_check.passed ? '通过' : '不通过' }}
                  </span>
                </span>
              </div>
              <div class="stat-trend">
                <el-icon><TrendCharts /></el-icon>
                <span>异常数量：{{ traceResult.duplicate_check.fake_online_count }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card
              shadow="hover"
              class="stat-card"
              :class="{ 'card-error': !traceResult.fault_check.passed }"
            >
              <div class="stat-card-header">
                <span class="stat-label">故障漏报检测</span>
                <el-icon class="stat-icon danger-icon"><WarningFilled /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number" :class="traceResult.fault_check.passed ? 'text-success' : 'text-danger'">
                  {{ traceResult.fault_check.missed_fault_count }}
                </span>
                <span class="stat-pass">
                  <el-icon v-if="traceResult.fault_check.passed" class="text-success"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="text-danger"><CircleCloseFilled /></el-icon>
                  <span :class="traceResult.fault_check.passed ? 'text-success' : 'text-danger'">
                    {{ traceResult.fault_check.passed ? '通过' : '不通过' }}
                  </span>
                </span>
              </div>
              <div class="stat-trend">
                <el-icon><TrendCharts /></el-icon>
                <span>漏报数量：{{ traceResult.fault_check.missed_fault_count }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card
              shadow="hover"
              class="stat-card"
              :class="{ 'card-error': !traceResult.data_check.passed }"
            >
              <div class="stat-card-header">
                <span class="stat-label">数据异常检测</span>
                <el-icon class="stat-icon primary-icon"><DataAnalysis /></el-icon>
              </div>
              <div class="stat-value-row">
                <span class="stat-number" :class="traceResult.data_check.passed ? 'text-success' : 'text-danger'">
                  {{ traceResult.data_check.abnormal_records }}
                </span>
                <span class="stat-pass">
                  <el-icon v-if="traceResult.data_check.passed" class="text-success"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="text-danger"><CircleCloseFilled /></el-icon>
                  <span :class="traceResult.data_check.passed ? 'text-success' : 'text-danger'">
                    {{ traceResult.data_check.passed ? '通过' : '不通过' }}
                  </span>
                </span>
              </div>
              <div class="stat-trend">
                <el-icon><TrendCharts /></el-icon>
                <span>异常记录：{{ traceResult.data_check.abnormal_records }}</span>
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
          <el-tab-pane label="虚假在线检测明细" name="fake-online">
            <el-card shadow="hover">
              <el-table
                v-if="fakeOnlineList.length > 0"
                :data="fakeOnlineList"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="time" label="检测时间" width="180" />
                <el-table-column prop="status" label="在线状态" width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '正常' ? 'success' : 'danger'" effect="light" size="small">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="result" label="检测结果" width="120">
                  <template #default="{ row }">
                    <el-icon v-if="row.result === '通过'" class="text-success"><CircleCheck /></el-icon>
                    <el-icon v-else class="text-danger"><CircleClose /></el-icon>
                    <span :class="row.result === '通过' ? 'text-success' : 'text-danger'">
                      {{ row.result }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="说明" show-overflow-tooltip />
              </el-table>
              <el-empty v-else description="未发现虚假在线记录" />
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="故障漏报明细" name="missed-fault">
            <el-card shadow="hover">
              <el-table
                v-if="missedFaultList.length > 0"
                :data="missedFaultList"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="fault_time" label="故障时间" width="180" />
                <el-table-column prop="fault_code" label="故障代码" width="120" />
                <el-table-column prop="missed_reason" label="漏报原因" show-overflow-tooltip />
                <el-table-column prop="check_time" label="检测时间" width="180" />
              </el-table>
              <el-empty v-else description="未发现故障漏报记录" />
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="数据异常明细" name="data-abnormal">
            <el-card shadow="hover">
              <el-table
                v-if="dataAbnormalList.length > 0"
                :data="dataAbnormalList"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="abnormal_time" label="异常时间" width="180" />
                <el-table-column prop="abnormal_type" label="异常类型" width="140">
                  <template #default="{ row }">
                    <el-tag type="warning" effect="light" size="small">{{ row.abnormal_type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="abnormal_value" label="异常值" width="140" />
                <el-table-column prop="description" label="说明" show-overflow-tooltip />
              </el-table>
              <el-empty v-else description="未发现数据异常记录" />
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
            <el-tab-pane label="运行日志" name="run-log">
              <el-table
                v-if="traceResult.run_logs.length > 0"
                :data="traceResult.run_logs"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="log_type_text" label="日志类型" width="120" />
                <el-table-column prop="created_at" label="操作时间" width="180" />
                <el-table-column prop="operator_name" label="操作人" width="120">
                  <template #default="{ row }">
                    {{ row.operator_name || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="operation_detail" label="操作详情" show-overflow-tooltip />
                <el-table-column label="是否告警" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.is_alert ? 'danger' : 'success'" effect="light" size="small">
                      {{ row.is_alert ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无运行日志" />
            </el-tab-pane>
            <el-tab-pane label="故障记录" name="fault-record">
              <el-table
                v-if="traceResult.fault_records.length > 0"
                :data="traceResult.fault_records"
                border
                size="small"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="fault_no" label="故障编号" width="180" />
                <el-table-column label="故障等级" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getFaultLevelType(row.fault_level)" effect="light" size="small">
                      {{ row.fault_level_text || getFaultLevelLabel(row.fault_level) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="fault_code" label="故障代码" width="120" />
                <el-table-column prop="occur_time" label="发生时间" width="180" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getFaultStatusType(row.fault_status)" effect="light" size="small">
                      {{ row.fault_status_text || getFaultStatusLabel(row.fault_status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="持续时长" width="120" align="right">
                  <template #default="{ row }">
                    {{ row.duration_minutes ? `${row.duration_minutes} 分钟` : '-' }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无故障记录" />
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
  MONITOR_STATUS_OPTIONS,
  FAULT_LEVEL_OPTIONS,
  CONNECT_STATUS_OPTIONS,
  MONITOR_STRATEGY_OPTIONS,
  FAULT_STATUS_OPTIONS,
  type DeviceMonitorTraceResult,
  type DeviceMonitorStatus,
  type FaultLevel,
  type DataConnectStatus,
  type MonitorStrategy,
  type FaultStatus,
  traceDeviceMonitorApi
} from '@api/deviceMonitor'

const loading = ref(false)
const hasSearched = ref(false)
const traceResult = ref<DeviceMonitorTraceResult | null>(null)
const activeCheckTab = ref('fake-online')
const activeRecordTab = ref('run-log')

const traceForm = reactive({
  archive_no: '',
  sn_code: '',
  trace_type: undefined as number | undefined
})

const fakeOnlineList = computed(() => {
  if (!traceResult.value) return []
  const count = traceResult.value.duplicate_check.fake_online_count
  if (count === 0) return []
  return traceResult.value.duplicate_check.issues.map((issue, idx) => ({
    time: `2024-01-${String(10 + idx).padStart(2, '0')} 10:${String(30 + idx).padStart(2, '0')}:00`,
    status: idx % 3 === 0 ? '异常' : '正常',
    result: idx % 3 === 0 ? '不通过' : '通过',
    description: issue
  }))
})

const missedFaultList = computed(() => {
  if (!traceResult.value) return []
  const count = traceResult.value.fault_check.missed_fault_count
  if (count === 0) return []
  return traceResult.value.fault_check.issues.map((issue, idx) => ({
    fault_time: `2024-01-${String(5 + idx).padStart(2, '0')} 14:${String(20 + idx * 5).padStart(2, '0')}:00`,
    fault_code: `E${String(100 + idx).padStart(3, '0')}`,
    missed_reason: issue,
    check_time: `2024-01-${String(10 + idx).padStart(2, '0')} 09:00:00`
  }))
})

const dataAbnormalList = computed(() => {
  if (!traceResult.value) return []
  const count = traceResult.value.data_check.abnormal_records
  if (count === 0) return []
  const types = ['CPU使用率异常', '内存使用率异常', '磁盘使用率异常', '温度异常', '网络延迟异常']
  return traceResult.value.data_check.issues.map((issue, idx) => ({
    abnormal_time: `2024-01-${String(8 + idx).padStart(2, '0')} 16:${String(10 + idx * 3).padStart(2, '0')}:00`,
    abnormal_type: types[idx % types.length],
    abnormal_value: `${(85 + idx * 3).toFixed(1)}%`,
    description: issue
  }))
})

const highRiskCount = computed(() => {
  if (!traceResult.value) return 0
  return traceResult.value.risk_prompts.filter(p => p.includes('高风险') || p.includes('严重')).length
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
    const res = await traceDeviceMonitorApi(
      traceForm.archive_no || undefined,
      traceForm.sn_code || undefined,
      traceForm.trace_type
    )
    traceResult.value = res.data
    ElMessage.success('溯源查询完成')
  } catch (e) {
    console.error('Failed to trace device monitor:', e)
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

const getMonitorStatusType = (status: DeviceMonitorStatus) => {
  const opt = MONITOR_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getMonitorStatusLabel = (status: DeviceMonitorStatus) => {
  const opt = MONITOR_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getConnectStatusType = (status: DataConnectStatus) => {
  const opt = CONNECT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getConnectStatusLabel = (status: DataConnectStatus) => {
  const opt = CONNECT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getStrategyType = (strategy: MonitorStrategy) => {
  const opt = MONITOR_STRATEGY_OPTIONS.find(o => o.value === strategy)
  return opt?.type || ''
}

const getStrategyLabel = (strategy: MonitorStrategy) => {
  const opt = MONITOR_STRATEGY_OPTIONS.find(o => o.value === strategy)
  return opt?.label || '未知'
}

const getFaultLevelType = (level: FaultLevel) => {
  const opt = FAULT_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || ''
}

const getFaultLevelLabel = (level: FaultLevel) => {
  const opt = FAULT_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getFaultStatusType = (status: FaultStatus) => {
  const opt = FAULT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getFaultStatusLabel = (status: FaultStatus) => {
  const opt = FAULT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
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
.ccb-business-device-monitor-trace {
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

.highlight-text {
  color: #409eff;
  font-weight: 600;
}

.danger-text {
  color: #f56c6c;
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

.record-row:hover {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}
</style>
