<template>
  <div class="vehicle-batch-maintenance">
    <div class="operation-header">
      <div class="selection-info">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="info-text">
          已选择 <strong class="text-primary">{{ selectedRows.length }}</strong> 辆车辆，
          <strong class="text-warning">{{ pendingCount }}</strong> 辆待检修，
          <strong class="text-danger">{{ urgentCount }}</strong> 辆紧急
        </span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="operation-tabs">
      <el-tab-pane label="批量预约检修" name="schedule">
        <div class="tab-description">
          <el-alert title="批量预约检修：为选中车辆预约检修时间，系统自动计算优先级" type="info" :closable="false" show-icon />
        </div>
        <div class="filter-section">
          <span class="section-label">筛选条件：</span>
          <div class="filter-row">
            <el-select v-model="scheduleForm.maintenanceType" placeholder="检修类型" style="width: 150px">
              <el-option label="常规保养" :value="1" />
              <el-option label="年检" :value="2" />
              <el-option label="大修" :value="3" />
              <el-option label="事故维修" :value="4" />
              <el-option label="更换零件" :value="5" />
            </el-select>
            <el-date-picker v-model="scheduleForm.scheduledDate" type="date" placeholder="预约日期" style="width: 180px" />
          </div>
        </div>
        <div class="action-section">
          <el-input v-model="scheduleForm.maintenanceStation" placeholder="检修站点" style="width: 200px; margin-right: 12px" />
          <el-button type="primary" :loading="operating" :disabled="selectedRows.length === 0 || !scheduleForm.scheduledDate" @click="handleBatchSchedule">
            <el-icon><SetUp /></el-icon>
            批量预约检修
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量更新状态" name="update-status">
        <div class="tab-description">
          <el-alert title="批量更新检修状态：将选中车辆的检修记录批量更新状态" type="warning" :closable="false" show-icon />
        </div>
        <div class="filter-section">
          <span class="section-label">更新为：</span>
          <el-select v-model="newStatus" placeholder="目标状态" style="width: 150px">
            <el-option label="开始检修" :value="1" />
            <el-option label="完成检修" :value="2" />
            <el-option label="取消检修" :value="3" />
          </el-select>
        </div>
        <div class="action-section">
          <el-button type="warning" :loading="operating" :disabled="selectedRows.length === 0 || newStatus === undefined" @click="handleBatchUpdateStatus">
            <el-icon><Edit /></el-icon>
            批量更新状态
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="检修成本统计" name="cost-stats">
        <div class="tab-description">
          <el-alert title="检修成本统计：统计选中车辆的检修成本数据" type="success" :closable="false" show-icon />
        </div>
        <div class="filter-section">
          <span class="section-label">统计区间：</span>
          <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px" />
        </div>
        <div class="action-section">
          <el-button type="success" :loading="operating" :disabled="selectedRows.length === 0" @click="handleCostStats">
            <el-icon><DataAnalysis /></el-icon>
            统计检修成本
          </el-button>
        </div>

        <div v-if="costStats" class="cost-stats-display">
          <div class="stats-summary">
            <div class="stat-item total">
              <div class="stat-value">¥{{ Number(costStats.totalCost).toFixed(2) }}</div>
              <div class="stat-label">总费用</div>
            </div>
            <div class="stat-item avg">
              <div class="stat-value">¥{{ Number(costStats.avgCost).toFixed(2) }}</div>
              <div class="stat-label">平均费用</div>
            </div>
          </div>
          <div class="stats-by-type">
            <div class="type-item"><span class="type-label">常规保养</span><span class="type-value">¥{{ Number(costStats.byType.routine).toFixed(2) }}</span></div>
            <div class="type-item"><span class="type-label">年检</span><span class="type-value">¥{{ Number(costStats.byType.annual).toFixed(2) }}</span></div>
            <div class="type-item"><span class="type-label">大修</span><span class="type-value">¥{{ Number(costStats.byType.major).toFixed(2) }}</span></div>
            <div class="type-item"><span class="type-label">事故维修</span><span class="type-value">¥{{ Number(costStats.byType.accident).toFixed(2) }}</span></div>
            <div class="type-item"><span class="type-label">更换零件</span><span class="type-value">¥{{ Number(costStats.byType.parts).toFixed(2) }}</span></div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="resultDialogVisible" title="批量操作结果" width="600px">
      <div class="result-summary">
        <div class="result-stat success"><div class="stat-value">{{ batchResult.success.length }}</div><div class="stat-label">成功</div></div>
        <div class="result-stat failed"><div class="stat-value">{{ batchResult.failed.length }}</div><div class="stat-label">失败</div></div>
        <div class="result-stat total"><div class="stat-value">{{ batchResult.total }}</div><div class="stat-label">总计</div></div>
      </div>
      <el-table v-if="batchResult.failed.length" :data="batchResult.failed" stripe max-height="300" size="small">
        <el-table-column prop="plateNumber" label="车牌号" width="130" />
        <el-table-column prop="error" label="失败原因" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, SetUp, Edit, DataAnalysis } from '@element-plus/icons-vue'
import { batchScheduleMaintenanceApi, batchUpdateMaintenanceStatusApi, batchMaintenanceCostStatsApi } from '@/api/vehicle'
import type { Vehicle, BatchOperationResult, MaintenanceCostStatistics } from '@/types/vehicle'

const props = defineProps<{ selectedRows: Vehicle[] }>()
const emit = defineEmits<{ (e: 'success'): void }>()

const activeTab = ref('schedule')
const operating = ref(false)
const resultDialogVisible = ref(false)
const newStatus = ref<number | undefined>(undefined)
const dateRange = ref<[Date, Date] | null>(null)
const costStats = ref<MaintenanceCostStatistics | null>(null)

const scheduleForm = reactive({
  maintenanceType: 1,
  scheduledDate: undefined as string | undefined,
  maintenanceStation: ''
})

const batchResult = reactive<BatchOperationResult>({ success: [], failed: [], total: 0 })

const pendingCount = computed(() => props.selectedRows.filter(v => v.maintenanceWarningLevel >= 2).length)
const urgentCount = computed(() => props.selectedRows.filter(v => v.maintenanceWarningLevel >= 3).length)

const handleBatchSchedule = async () => {
  const ids = props.selectedRows.map(v => v.id)
  if (!scheduleForm.scheduledDate) { ElMessage.warning('请选择预约日期'); return }
  try {
    await ElMessageBox.confirm(`确定预约 ${ids.length} 辆车辆的检修吗？`, '批量预约检修', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  operating.value = true
  try {
    const res = await batchScheduleMaintenanceApi(ids, { scheduledDate: scheduleForm.scheduledDate, maintenanceType: scheduleForm.maintenanceType, maintenanceStation: scheduleForm.maintenanceStation })
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    emit('success')
  } catch (error: any) { ElMessage.error(error.message || '批量预约失败') }
  finally { operating.value = false }
}

const handleBatchUpdateStatus = async () => {
  const ids = props.selectedRows.map(v => v.id)
  operating.value = true
  try {
    const res = await batchUpdateMaintenanceStatusApi(ids, newStatus.value!)
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    emit('success')
  } catch (error: any) { ElMessage.error(error.message || '批量更新失败') }
  finally { operating.value = false }
}

const handleCostStats = async () => {
  const ids = props.selectedRows.map(v => v.id)
  operating.value = true
  try {
    const dateRangeParam = dateRange.value ? { startDate: dateRange.value[0].toISOString(), endDate: dateRange.value[1].toISOString() } : undefined
    const res = await batchMaintenanceCostStatsApi(ids, dateRangeParam)
    costStats.value = res.data
  } catch (error: any) { ElMessage.error(error.message || '统计失败') }
  finally { operating.value = false }
}
</script>

<style lang="scss" scoped>
.vehicle-batch-maintenance {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .operation-header {
    margin-bottom: 12px;
    .selection-info {
      display: flex; align-items: center; gap: 8px;
      .info-icon { color: #e6a23c; }
      .info-text { font-size: 13px; }
      .text-primary { color: #409eff; }
      .text-warning { color: #e6a23c; }
      .text-danger { color: #f56c6c; }
    }
  }

  .tab-description { margin-bottom: 12px; }
  .filter-section {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
    .section-label { font-size: 13px; color: #606266; white-space: nowrap; }
    .filter-row { display: flex; align-items: center; gap: 8px; }
  }
  .action-section {
    display: flex; align-items: center; gap: 12px; padding: 12px 0;
  }

  .cost-stats-display {
    margin-top: 16px;
    background: #f5f7fa; border-radius: 8px; padding: 16px;
    .stats-summary {
      display: flex; gap: 40px; margin-bottom: 16px;
      .stat-item {
        text-align: center;
        .stat-value { font-size: 24px; font-weight: 700; color: #303133; }
        .stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
      }
    }
    .stats-by-type {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
      .type-item {
        display: flex; flex-direction: column; align-items: center;
        .type-label { font-size: 12px; color: #909399; }
        .type-value { font-size: 14px; font-weight: 600; color: #303133; margin-top: 4px; }
      }
    }
  }

  .result-summary {
    display: flex; justify-content: center; gap: 60px; margin-bottom: 16px;
    .result-stat {
      text-align: center;
      .stat-value { font-size: 28px; font-weight: 700; }
      .stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
      &.success .stat-value { color: #67c23a; }
      &.failed .stat-value { color: #f56c6c; }
      &.total .stat-value { color: #409eff; }
    }
  }
}
</style>
