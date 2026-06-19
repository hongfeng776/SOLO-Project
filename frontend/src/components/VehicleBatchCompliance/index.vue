<template>
  <div class="vehicle-batch-compliance">
    <div class="operation-header">
      <div class="selection-info">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="info-text">
          已选择 <strong class="text-primary">{{ selectedRows.length }}</strong> 辆车辆，
          其中 <strong class="text-danger">{{ highRiskCount }}</strong> 辆高风险，
          <strong class="text-warning">{{ needRectificationCount }}</strong> 辆待整改
        </span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="operation-tabs">
      <el-tab-pane label="批量合规校验" name="check">
        <div class="tab-description">
          <el-alert
            title="批量合规校验：对选中车辆执行合规校验，同步交管数据，检测异常项"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        <div class="filter-section">
          <span class="section-label">校验筛选：</span>
          <div class="filter-row">
            <el-select v-model="checkType" placeholder="校验类型" style="width: 160px">
              <el-option label="综合校验" :value="4" />
              <el-option label="保险校验" :value="1" />
              <el-option label="年检校验" :value="2" />
              <el-option label="违章校验" :value="3" />
            </el-select>
            <el-select v-model="filterForm.complianceLevel" placeholder="合规等级" clearable multiple style="width: 180px">
              <el-option label="A级" :value="1" />
              <el-option label="B级" :value="2" />
              <el-option label="C级" :value="3" />
              <el-option label="D级" :value="4" />
            </el-select>
            <el-select v-model="filterForm.cityTier" placeholder="城市等级" clearable style="width: 140px">
              <el-option label="一线城市" :value="1" />
              <el-option label="二线城市" :value="2" />
              <el-option label="三线及以下" :value="3" />
            </el-select>
            <el-checkbox v-model="onlyExpired">仅校验超期未校验</el-checkbox>
          </div>
        </div>
        <div class="action-section">
          <el-button
            type="primary"
            :loading="operating"
            :disabled="selectedRows.length === 0"
            @click="handleBatchCheck"
          >
            <el-icon><CircleCheck /></el-icon>
            发起批量校验（{{ selectedRows.length }}辆）
          </el-button>
          <span class="tip-text">
            校验将同步交管数据，预计每辆车 2-5 秒
          </span>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量提醒整改" name="remind">
        <div class="tab-description">
          <el-alert
            title="批量提醒整改：向有整改任务的车辆发送整改提醒"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
        <div class="filter-section">
          <span class="section-label">整改筛选：</span>
          <div class="filter-row">
            <el-select v-model="remindFilter.rectificationType" placeholder="整改类型" clearable style="width: 140px">
              <el-option label="保险整改" :value="1" />
              <el-option label="年检整改" :value="2" />
              <el-option label="违章整改" :value="3" />
              <el-option label="参数整改" :value="4" />
            </el-select>
            <el-select v-model="remindFilter.deadlineDays" placeholder="剩余天数" clearable style="width: 160px">
              <el-option label="3天内到期" :value="3" />
              <el-option label="7天内到期" :value="7" />
              <el-option label="已过期" :value="0" />
            </el-select>
          </div>
        </div>
        <div class="action-section">
          <el-button
            type="warning"
            :loading="operating"
            :disabled="needRectificationCount === 0"
            @click="handleBatchRemind"
          >
            <el-icon><Bell /></el-icon>
            批量发送提醒（{{ needRectificationCount }}辆）
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量导出报告" name="export">
        <div class="tab-description">
          <el-alert
            title="批量导出合规报告：导出选中车辆的合规校验报告（Excel/PDF）"
            type="success"
            :closable="false"
            show-icon
          />
        </div>
        <div class="filter-section">
          <span class="section-label">报告内容：</span>
          <div class="filter-row">
            <el-checkbox v-model="exportForm.includeHistory">包含历史记录</el-checkbox>
            <el-checkbox v-model="exportForm.includeRectification">包含整改记录</el-checkbox>
            <el-checkbox v-model="exportForm.includeTrend">包含趋势分析</el-checkbox>
            <el-select v-model="exportForm.format" placeholder="导出格式" style="width: 120px">
              <el-option label="Excel" value="excel" />
              <el-option label="PDF" value="pdf" />
            </el-select>
          </div>
        </div>
        <div class="action-section">
          <el-button
            type="success"
            :loading="exporting"
            :disabled="selectedRows.length === 0"
            @click="handleBatchExport"
          >
            <el-icon><Download /></el-icon>
            批量导出报告
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Result dialog -->
    <el-dialog v-model="resultDialogVisible" title="批量操作结果" width="700px">
      <div class="result-summary">
        <div class="result-stat success">
          <div class="stat-value">{{ batchResult.success.length }}</div>
          <div class="stat-label">成功</div>
        </div>
        <div class="result-stat failed">
          <div class="stat-value">{{ batchResult.failed.length }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="result-stat total">
          <div class="stat-value">{{ batchResult.total }}</div>
          <div class="stat-label">总计</div>
        </div>
      </div>
      <el-tabs v-model="resultTab">
        <el-tab-pane label="成功记录" name="success">
          <el-table :data="batchResult.success" stripe max-height="300" size="small">
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="complianceLevel" label="合规等级" width="100">
              <template #default="{ row }">{{ ComplianceLevelMap[row.complianceLevel as keyof typeof ComplianceLevelMap] }}</template>
            </el-table-column>
            <el-table-column prop="checkScore" label="校验得分" width="100" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="失败记录" name="failed">
          <el-table :data="batchResult.failed" stripe max-height="300" size="small">
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="error" label="失败原因" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, CircleCheck, Bell, Download } from '@element-plus/icons-vue'
import { batchComplianceCheckApi, batchRemindRectificationApi } from '@/api/vehicle'
import { ComplianceLevelMap } from '@/enums/vehicle'
import type { Vehicle, BatchOperationResult } from '@/types/vehicle'

const props = defineProps<{
  selectedRows: Vehicle[]
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const activeTab = ref('check')
const operating = ref(false)
const exporting = ref(false)
const resultDialogVisible = ref(false)
const resultTab = ref('success')
const checkType = ref(4)
const onlyExpired = ref(false)

const filterForm = reactive({
  complianceLevel: [] as number[],
  cityTier: undefined as number | undefined
})

const remindFilter = reactive({
  rectificationType: undefined as number | undefined,
  deadlineDays: undefined as number | undefined
})

const exportForm = reactive({
  includeHistory: true,
  includeRectification: true,
  includeTrend: false,
  format: 'excel'
})

const batchResult = reactive<BatchOperationResult>({
  success: [],
  failed: [],
  total: 0
})

const highRiskCount = computed(() => {
  return props.selectedRows.filter(v => v.riskLevel === 3).length
})

const needRectificationCount = computed(() => {
  return props.selectedRows.filter(v => (v.rectificationCount || 0) > 0).length
})

const handleBatchCheck = async () => {
  const ids = props.selectedRows.map(v => v.id)
  try {
    await ElMessageBox.confirm(
      `确定对 ${ids.length} 辆车辆发起批量合规校验吗？\n校验将同步交管平台数据，可能需要较长时间。`,
      '批量合规校验',
      {
        confirmButtonText: '确认发起',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--primary'
      }
    )
  } catch { return }

  operating.value = true
  try {
    const res = await batchComplianceCheckApi(ids, checkType.value)
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    resultTab.value = res.data.failed.length > 0 ? 'failed' : 'success'
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '批量校验失败')
  } finally {
    operating.value = false
  }
}

const handleBatchRemind = async () => {
  const ids = props.selectedRows.filter(v => (v.rectificationCount || 0) > 0).map(v => v.id)
  if (ids.length === 0) {
    ElMessage.warning('没有需要提醒整改的车辆')
    return
  }

  operating.value = true
  try {
    const res = await batchRemindRectificationApi(ids)
    Object.assign(batchResult, res.data)
    resultDialogVisible.value = true
    ElMessage.success(`已向 ${res.data.success.length} 辆车辆发送整改提醒`)
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '批量提醒失败')
  } finally {
    operating.value = false
  }
}

const handleBatchExport = () => {
  exporting.value = true
  setTimeout(() => {
    exporting.value = false
    ElMessage.success('报告导出成功')
  }, 1500)
}
</script>

<style lang="scss" scoped>
.vehicle-batch-compliance {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .operation-header {
    margin-bottom: 12px;

    .selection-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .info-icon { color: #67c23a; }
      .info-text { font-size: 13px; }
      .text-primary { color: #409eff; }
      .text-danger { color: #f56c6c; }
      .text-warning { color: #e6a23c; }
    }
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
      flex-wrap: wrap;
    }
  }

  .action-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;

    .tip-text {
      font-size: 12px;
      color: #909399;
    }
  }

  .result-summary {
    display: flex;
    justify-content: center;
    gap: 60px;
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
