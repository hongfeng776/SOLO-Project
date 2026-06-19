<template>
  <div class="vehicle-batch-status-operation">
    <div class="operation-header">
      <div class="selection-info">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="info-text">
          已选择 <strong class="text-primary">{{ selectedRows.length }}</strong> 辆车辆，
          其中 <strong class="text-danger">{{ permBannedCount }}</strong> 辆永久封禁将禁止恢复，
          实际可操作 <strong class="text-success">{{ validCount }}</strong> 辆
        </span>
      </div>
      <el-alert
        v-if="permBannedCount > 0"
        :title="`${permBannedCount} 辆永久封禁车辆禁止任何恢复操作`"
        type="error"
        show-icon
        :closable="false"
        class="filter-alert"
      />
    </div>

    <el-tabs v-model="activeTab" class="operation-tabs">
      <el-tab-pane label="批量恢复运营" name="restore">
        <div class="tab-description">
          <el-alert title="批量恢复运营：将选中的停运/过期/封禁车辆恢复为正常运营状态" type="info" :closable="false" show-icon />
        </div>
        <div class="filter-section">
          <span class="section-label">筛选可恢复车辆：</span>
          <div class="filter-row">
            <el-select v-model="filterForm.operationStatus" placeholder="运营状态" clearable multiple style="width: 260px">
              <el-option label="停运检修" :value="2" />
              <el-option label="证件过期" :value="3" />
              <el-option label="违规封禁(临时)" :value="4" />
            </el-select>
            <el-select v-model="filterForm.city" placeholder="备案城市" clearable style="width: 150px">
              <el-option v-for="city in cityOptions" :key="city" :label="city" :value="city" />
            </el-select>
            <el-button type="primary" @click="filterSelected">筛选</el-button>
          </div>
        </div>
        <div class="action-section">
          <el-button
            type="success"
            :loading="operating"
            :disabled="validCount === 0"
            @click="handleBatchRestore"
          >
            <el-icon><CircleCheck /></el-icon>
            批量恢复运营（{{ validCount }}辆）
          </el-button>
          <el-input
            v-model="restoreRemark"
            placeholder="恢复原因（选填）"
            style="width: 300px; margin-left: 12px"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量发起检修" name="maintenance">
        <div class="tab-description">
          <el-alert title="批量发起检修：将选中车辆转入停运检修状态" type="info" :closable="false" show-icon />
        </div>
        <div class="action-section">
          <el-button
            type="warning"
            :loading="operating"
            :disabled="selectedRows.length === 0"
            @click="handleBatchMaintenance"
          >
            <el-icon><SetUp /></el-icon>
            批量发起检修（{{ selectedRows.length }}辆）
          </el-button>
          <el-select v-model="maintenanceType" placeholder="检修类型" style="width: 150px; margin-left: 12px">
            <el-option label="常规保养" :value="1" />
            <el-option label="年检" :value="2" />
            <el-option label="大修" :value="3" />
            <el-option label="事故维修" :value="4" />
            <el-option label="更换零件" :value="5" />
          </el-select>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量提醒换证" name="renewal">
        <div class="tab-description">
          <el-alert title="批量提醒换证：向证件即将过期的车辆发送换证提醒" type="info" :closable="false" show-icon />
        </div>
        <div class="filter-section">
          <span class="section-label">筛选条件：</span>
          <div class="filter-row">
            <el-select v-model="renewalFilter.daysThreshold" placeholder="过期天数" style="width: 150px">
              <el-option label="7天内过期" :value="7" />
              <el-option label="15天内过期" :value="15" />
              <el-option label="30天内过期" :value="30" />
              <el-option label="60天内过期" :value="60" />
            </el-select>
          </div>
        </div>
        <div class="action-section">
          <el-button
            type="primary"
            :loading="operating"
            :disabled="selectedRows.length === 0"
            @click="handleBatchRemindRenewal"
          >
            <el-icon><Bell /></el-icon>
            批量发送换证提醒
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="resultDialogVisible" title="批量操作结果" width="600px">
      <div class="result-summary">
        <div class="result-stat success">
          <div class="stat-value">{{ batchResult.success.length }}</div>
          <div class="stat-label">操作成功</div>
        </div>
        <div class="result-stat failed">
          <div class="stat-value">{{ batchResult.failed.length }}</div>
          <div class="stat-label">操作失败</div>
        </div>
        <div class="result-stat total">
          <div class="stat-value">{{ batchResult.total }}</div>
          <div class="stat-label">总计</div>
        </div>
      </div>
      <el-table v-if="batchResult.failed.length" :data="batchResult.failed" stripe max-height="300">
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
import { InfoFilled, CircleCheck, SetUp, Bell } from '@element-plus/icons-vue'
import { batchRestoreOperationApi, batchInitiateMaintenanceApi, batchRemindRenewalApi } from '@/api/vehicle'
import type { Vehicle, BatchOperationResult } from '@/types/vehicle'

const props = defineProps<{
  selectedRows: Vehicle[]
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const activeTab = ref('restore')
const operating = ref(false)
const resultDialogVisible = ref(false)
const restoreRemark = ref('')
const maintenanceType = ref(1)
const cityOptions = ref<string[]>([])

const filterForm = reactive({
  operationStatus: [] as number[],
  city: ''
})

const renewalFilter = reactive({
  daysThreshold: 30
})

const batchResult = reactive<BatchOperationResult>({
  success: [],
  failed: [],
  total: 0
})

const permBannedCount = computed(() => {
  return props.selectedRows.filter(v => v.bannedType === 2).length
})

const validCount = computed(() => {
  return props.selectedRows.filter(v => v.bannedType !== 2).length
})

const filterSelected = () => {
  // Filtering is visual-only; actual filtering happens at API level
}

const handleBatchRestore = async () => {
  const ids = props.selectedRows.filter(v => v.bannedType !== 2).map(v => v.id)
  if (ids.length === 0) {
    ElMessage.warning('没有可恢复的车辆')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要恢复 ${ids.length} 辆车辆的运营状态吗？恢复后车辆将可以正常接单。`,
      '批量恢复运营',
      { confirmButtonText: '确认恢复', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  operating.value = true
  try {
    const res = await batchRestoreOperationApi(ids, restoreRemark.value)
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '批量恢复失败')
  } finally {
    operating.value = false
  }
}

const handleBatchMaintenance = async () => {
  const ids = props.selectedRows.map(v => v.id)
  try {
    await ElMessageBox.confirm(
      `确定要为 ${ids.length} 辆车辆发起检修吗？车辆将转入停运检修状态。`,
      '批量发起检修',
      { confirmButtonText: '确认发起', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  operating.value = true
  try {
    const res = await batchInitiateMaintenanceApi(ids, { maintenanceType: maintenanceType.value } as any)
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '批量发起检修失败')
  } finally {
    operating.value = false
  }
}

const handleBatchRemindRenewal = async () => {
  const ids = props.selectedRows.map(v => v.id)
  operating.value = true
  try {
    const res = await batchRemindRenewalApi(ids)
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '批量提醒失败')
  } finally {
    operating.value = false
  }
}
</script>

<style lang="scss" scoped>
.vehicle-batch-status-operation {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .operation-header {
    margin-bottom: 12px;

    .selection-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .info-icon { color: #409eff; }
      .info-text { font-size: 13px; }
      .text-primary { color: #409eff; }
      .text-danger { color: #f56c6c; }
      .text-success { color: #67c23a; }
    }

    .filter-alert { margin-top: 8px; }
  }

  .tab-description { margin-bottom: 12px; }

  .filter-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .section-label {
      font-size: 13px;
      color: #606266;
      white-space: nowrap;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .action-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
  }

  .result-summary {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 16px;

    .result-stat {
      text-align: center;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }

      &.success .stat-value { color: #67c23a; }
      &.failed .stat-value { color: #f56c6c; }
      &.total .stat-value { color: #409eff; }
    }
  }
}
</style>
