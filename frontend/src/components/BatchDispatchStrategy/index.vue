<template>
  <el-dialog
    v-model="visible"
    title="批量调度策略操作"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-dispatch-strategy">
      <el-tabs v-model="activeTab" class="strategy-tabs">
        <el-tab-pane name="dispatch_to_gap">
          <template #label>
            <span class="tab-label">
              <el-icon><Promotion /></el-icon>
              批量调度至缺口区域
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator dispatch-indicator">
              <el-icon><Promotion /></el-icon>
              <span>将空闲司机批量调度至运力缺口区域</span>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">缺口区域列表</span>
                <div class="section-actions">
                  <el-button size="small" type="primary" link @click="selectAllShortageAreas">
                    全选紧缺区域
                  </el-button>
                  <el-button size="small" link @click="clearSelectedAreas">清空</el-button>
                </div>
              </div>
              <div class="area-list">
                <div
                  v-for="area in abnormalAreas"
                  :key="area.id"
                  class="area-item"
                  :class="{ selected: selectedAreaIds.includes(area.id) }"
                  @click="toggleArea(area.id)"
                >
                  <el-checkbox :model-value="selectedAreaIds.includes(area.id)" @stop />
                  <div class="area-info">
                    <div class="area-name">
                      {{ area.district }}
                      <el-tag size="small" type="danger" effect="dark" class="shortage-tag">
                        缺口{{ area.gap > 0 ? '+' : '' }}{{ area.gap }}
                      </el-tag>
                    </div>
                    <div class="area-detail">
                      {{ area.city }} · 在线{{ area.onlineCount }}人 · 订单{{ area.orderCount }}
                    </div>
                  </div>
                </div>
                <el-empty v-if="abnormalAreas.length === 0" description="暂无缺口区域" :image-size="60" />
              </div>
            </div>

            <div class="dispatch-config">
              <el-form label-width="100px">
                <el-form-item label="调度人数">
                  <el-input-number
                    v-model="dispatchCount"
                    :min="1"
                    :max="500"
                    :step="10"
                    controls-position="right"
                    style="width: 200px"
                  />
                </el-form-item>
                <el-form-item label="调度消息">
                  <el-input
                    v-model="dispatchMessage"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入调度消息内容，如：请立即前往指定区域接单"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="action-bar">
              <el-button
                type="primary"
                :loading="operating"
                :disabled="selectedAreaIds.length === 0 || !canDispatch"
                @click="handleDispatchToGap"
              >
                <el-icon><Promotion /></el-icon>
                执行调度
              </el-button>
              <span v-if="selectedAreaIds.length > 0" class="action-hint">
                已选择 {{ selectedAreaIds.length }} 个缺口区域
              </span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="adjust_weight">
          <template #label>
            <span class="tab-label">
              <el-icon><Setting /></el-icon>
              批量调整调度权重
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator weight-indicator">
              <el-icon><Setting /></el-icon>
              <span>调整各区域调度权重及时段策略</span>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">区域权重配置</span>
              </div>
              <el-table :data="weightTableData" size="small" border class="weight-table">
                <el-table-column prop="areaName" label="区域" min-width="140" />
                <el-table-column prop="city" label="城市" width="100" />
                <el-table-column label="当前权重" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.currentWeight.toFixed(1) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="新权重" min-width="200">
                  <template #default="{ row }">
                    <el-slider
                      v-model="row.newWeight"
                      :min="0.5"
                      :max="3.0"
                      :step="0.1"
                      :format-tooltip="(v: number) => v.toFixed(1)"
                      show-input
                      input-size="small"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">时段策略配置</span>
              </div>
              <div class="period-strategy-list">
                <div
                  v-for="(strategy, index) in periodStrategies"
                  :key="index"
                  class="period-strategy-item"
                >
                  <div class="period-label">
                    <el-icon><Timer /></el-icon>
                    {{ strategy.period }}
                  </div>
                  <div class="period-controls">
                    <div class="control-item">
                      <span class="control-label">权重倍数</span>
                      <el-input-number
                        v-model="strategy.weightMultiplier"
                        :min="0.5"
                        :max="5.0"
                        :step="0.1"
                        :precision="1"
                        size="small"
                        style="width: 120px"
                      />
                    </div>
                    <div class="control-item">
                      <span class="control-label">调度半径(km)</span>
                      <el-input-number
                        v-model="strategy.dispatchRadius"
                        :min="1"
                        :max="50"
                        :step="1"
                        size="small"
                        style="width: 120px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="action-bar">
              <el-button
                type="primary"
                :loading="operating"
                :disabled="!hasWeightChanges || !canDispatch"
                @click="handleAdjustWeight"
              >
                <el-icon><Setting /></el-icon>
                保存权重
              </el-button>
              <span v-if="!hasWeightChanges" class="action-hint text-warning">
                权重未变更
              </span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="cancel_invalid">
          <template #label>
            <span class="tab-label">
              <el-icon><Delete /></el-icon>
              批量取消无效任务
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator cancel-indicator">
              <el-icon><Delete /></el-icon>
              <span>筛选并取消无效、重复及跨区域调度任务</span>
            </div>

            <div class="filter-bar">
              <el-checkbox-group v-model="taskFilters">
                <el-checkbox value="invalid">无效任务</el-checkbox>
                <el-checkbox value="repeated">重复任务</el-checkbox>
                <el-checkbox value="cross_region">跨区域任务</el-checkbox>
              </el-checkbox-group>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">
                  近期调度任务
                  <el-tag size="small" type="info">{{ filteredTasks.length }}条</el-tag>
                </span>
                <div class="section-actions">
                  <el-checkbox
                    v-model="allTasksSelected"
                    :indeterminate="isTaskIndeterminate"
                    @change="handleToggleAllTasks"
                  >
                    全选
                  </el-checkbox>
                </div>
              </div>
              <div class="task-list">
                <div
                  v-for="task in filteredTasks"
                  :key="task.taskId"
                  class="task-item"
                  :class="{ selected: selectedTaskIds.includes(task.taskId) }"
                  @click="toggleTask(task.taskId)"
                >
                  <el-checkbox :model-value="selectedTaskIds.includes(task.taskId)" @stop />
                  <div class="task-info">
                    <div class="task-header">
                      <span class="task-id">{{ task.taskId }}</span>
                      <el-tag
                        size="small"
                        :type="getTaskStatusType(task)"
                        effect="plain"
                      >
                        {{ getTaskStatusLabel(task) }}
                      </el-tag>
                    </div>
                    <div class="task-detail">
                      {{ task.targetArea }} · {{ task.targetCity }} ·
                      <span v-if="task.matchedDriverName">{{ task.matchedDriverName }}</span>
                      <span v-else class="text-muted">无匹配司机</span>
                    </div>
                    <div class="task-time">{{ task.triggerTime }}</div>
                  </div>
                  <div class="task-flags">
                    <el-tag v-if="task.isInvalid" size="small" type="danger">无效</el-tag>
                    <el-tag v-if="task.isRepeated" size="small" type="warning">重复</el-tag>
                    <el-tag v-if="task.isCrossRegion" size="small" type="info">跨区域</el-tag>
                  </div>
                </div>
                <el-empty v-if="filteredTasks.length === 0" description="暂无符合条件的任务" :image-size="60" />
              </div>
            </div>

            <div class="cancel-config">
              <el-form label-width="100px">
                <el-form-item label="取消原因">
                  <el-input
                    v-model="cancelReason"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入批量取消原因"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="action-bar">
              <el-button
                type="danger"
                :loading="operating"
                :disabled="selectedTaskIds.length === 0 || !canDispatch"
                @click="handleCancelInvalid"
              >
                <el-icon><Delete /></el-icon>
                批量取消
              </el-button>
              <span v-if="selectedTaskIds.length > 0" class="action-hint text-danger">
                已选择 {{ selectedTaskIds.length }} 个任务
              </span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>

    <el-dialog
      v-model="resultVisible"
      title="操作结果"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="operation-result">
        <div class="result-stats">
          <div class="stat-item success">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult?.successCount || 0 }}</div>
              <div class="stat-label">成功</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item skipped">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult?.skippedCount || 0 }}</div>
              <div class="stat-label">跳过</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item failed">
            <div class="stat-icon"><el-icon><CircleClose /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult?.failedCount || 0 }}</div>
              <div class="stat-label">失败</div>
            </div>
          </div>
        </div>

        <div v-if="operationResult?.details?.length" class="result-details">
          <div class="details-header">操作详情</div>
          <el-table :data="operationResult.details.slice(0, 20)" size="small">
            <el-table-column prop="targetName" label="目标" min-width="120" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'">
                  {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '跳过' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="120" />
            <el-table-column v-if="operationResult?.operation === 'dispatch_to_gap'" label="影响司机" width="90" align="center">
              <template #default="{ row }">
                {{ row.affectedDrivers ?? '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="handleResultClose">确认</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion, Delete, Setting, Timer, Warning, CircleCheck, CircleClose, Select } from '@element-plus/icons-vue'
import { batchSmartDispatchApi } from '@/api/capacity'
import type { BatchSmartDispatchResult, AbnormalArea } from '@/types/capacity'
import { BatchOperationType, BatchOperationTypeMap, TIME_PERIODS } from '@/enums/capacity'
import { getDispatchTraceApi } from '@/api/capacity'
import type { DispatchTraceRecord } from '@/types/capacity'

interface Props {
  modelValue: boolean
  abnormalAreas: AbnormalArea[]
  canDispatch: boolean
}

const props = withDefaults(defineProps<Props>(), {
  abnormalAreas: () => [],
  canDispatch: false
})

const emit = defineEmits(['update:modelValue', 'dispatch-completed'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('dispatch_to_gap')
const operating = ref(false)
const resultVisible = ref(false)
const operationResult = ref<BatchSmartDispatchResult | null>(null)

const selectedAreaIds = ref<string[]>([])
const dispatchCount = ref(10)
const dispatchMessage = ref('')

interface WeightRow {
  areaId: string
  areaName: string
  city: string
  currentWeight: number
  newWeight: number
}

const weightTableData = ref<WeightRow[]>([])

interface PeriodStrategy {
  period: string
  weightMultiplier: number
  dispatchRadius: number
}

const periodStrategies = ref<PeriodStrategy[]>(
  TIME_PERIODS.map(period => ({
    period,
    weightMultiplier: 1.0,
    dispatchRadius: 10
  }))
)

const taskList = ref<DispatchTraceRecord[]>([])
const taskFilters = ref<string[]>(['invalid', 'repeated', 'cross_region'])
const selectedTaskIds = ref<string[]>([])
const cancelReason = ref('')

const filteredTasks = computed(() => {
  if (taskFilters.value.length === 0) return taskList.value
  return taskList.value.filter(task => {
    if (taskFilters.value.includes('invalid') && task.isInvalid) return true
    if (taskFilters.value.includes('repeated') && task.isRepeated) return true
    if (taskFilters.value.includes('cross_region') && task.isCrossRegion) return true
    return false
  })
})

const allTasksSelected = computed(() =>
  filteredTasks.value.length > 0 && selectedTaskIds.value.length === filteredTasks.value.length
)

const isTaskIndeterminate = computed(() =>
  selectedTaskIds.value.length > 0 && selectedTaskIds.value.length < filteredTasks.value.length
)

const hasWeightChanges = computed(() =>
  weightTableData.value.some(row => row.newWeight !== row.currentWeight)
)

const toggleArea = (id: string) => {
  const index = selectedAreaIds.value.indexOf(id)
  if (index > -1) {
    selectedAreaIds.value.splice(index, 1)
  } else {
    selectedAreaIds.value.push(id)
  }
}

const selectAllShortageAreas = () => {
  selectedAreaIds.value = props.abnormalAreas
    .filter(a => a.status === 'shortage')
    .map(a => a.id)
}

const clearSelectedAreas = () => {
  selectedAreaIds.value = []
}

const toggleTask = (taskId: string) => {
  const index = selectedTaskIds.value.indexOf(taskId)
  if (index > -1) {
    selectedTaskIds.value.splice(index, 1)
  } else {
    selectedTaskIds.value.push(taskId)
  }
}

const handleToggleAllTasks = (val: boolean) => {
  if (val) {
    selectedTaskIds.value = filteredTasks.value.map(t => t.taskId)
  } else {
    selectedTaskIds.value = []
  }
}

const getTaskStatusType = (task: DispatchTraceRecord) => {
  if (task.executionResult === 'success') return 'success'
  if (task.executionResult === 'failed') return 'danger'
  if (task.executionResult === 'cancelled') return 'warning'
  return 'info'
}

const getTaskStatusLabel = (task: DispatchTraceRecord) => {
  const map: Record<string, string> = {
    success: '成功',
    failed: '失败',
    cancelled: '已取消',
    intercepted: '已拦截'
  }
  return map[task.executionResult] || task.executionResult
}

const loadTaskData = async () => {
  try {
    const res = await getDispatchTraceApi()
    taskList.value = res.data.traces
  } catch (e: any) {
    console.error('获取调度任务列表失败', e)
  }
}

const buildWeightTable = () => {
  weightTableData.value = props.abnormalAreas.map(area => ({
    areaId: area.id,
    areaName: area.district,
    city: area.city,
    currentWeight: parseFloat((1.0 + Math.random() * 0.5).toFixed(1)),
    newWeight: parseFloat((1.0 + Math.random() * 0.5).toFixed(1))
  }))
}

const handleDispatchToGap = async () => {
  if (selectedAreaIds.value.length === 0) {
    ElMessage.warning('请选择至少一个缺口区域')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认向 ${selectedAreaIds.value.length} 个缺口区域调度 ${dispatchCount.value} 名司机？`,
      '执行调度确认',
      { type: 'warning', confirmButtonText: '确认执行', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  operating.value = true
  try {
    const res = await batchSmartDispatchApi({
      operation: BatchOperationType.DISPATCH_TO_GAP,
      targetAreaIds: selectedAreaIds.value
    })
    operationResult.value = res.data
    resultVisible.value = true
    ElMessage.success(`调度完成：成功${res.data.successCount}，失败${res.data.failedCount}`)
    emit('dispatch-completed', res.data.refreshedAreas)
  } catch (e: any) {
    ElMessage.error(e.message || '调度操作失败')
  } finally {
    operating.value = false
  }
}

const handleAdjustWeight = async () => {
  if (!hasWeightChanges.value) {
    ElMessage.warning('权重未发生变更')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确认保存权重调整？调整后将立即生效。',
      '保存权重确认',
      { type: 'warning', confirmButtonText: '确认保存', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  operating.value = true
  try {
    const targetAreaIds = weightTableData.value.map(row => row.areaId)
    const weightParams = weightTableData.value.map(row => ({
      areaId: row.areaId,
      weight: row.newWeight
    }))
    const res = await batchSmartDispatchApi({
      operation: BatchOperationType.ADJUST_WEIGHT,
      targetAreaIds,
      weightParams,
      periodStrategies: periodStrategies.value.map(s => ({
        period: s.period,
        weightMultiplier: s.weightMultiplier,
        dispatchRadius: s.dispatchRadius
      }))
    })
    operationResult.value = res.data
    resultVisible.value = true
    ElMessage.success(`权重调整完成：成功${res.data.successCount}，失败${res.data.failedCount}`)
    emit('dispatch-completed', res.data.refreshedAreas)
  } catch (e: any) {
    ElMessage.error(e.message || '权重调整失败')
  } finally {
    operating.value = false
  }
}

const handleCancelInvalid = async () => {
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning('请选择至少一个任务')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认批量取消 ${selectedTaskIds.value.length} 个任务？此操作不可恢复。`,
      '批量取消确认',
      { type: 'error', confirmButtonText: '确认取消', cancelButtonText: '返回' }
    )
  } catch {
    return
  }

  operating.value = true
  try {
    const res = await batchSmartDispatchApi({
      operation: BatchOperationType.CANCEL_INVALID,
      targetAreaIds: selectedTaskIds.value,
      cancelReason: cancelReason.value
    })
    operationResult.value = res.data
    resultVisible.value = true
    ElMessage.success(`取消完成：成功${res.data.successCount}，跳过${res.data.skippedCount}，失败${res.data.failedCount}`)
    emit('dispatch-completed', res.data.refreshedAreas)
  } catch (e: any) {
    ElMessage.error(e.message || '批量取消失败')
  } finally {
    operating.value = false
  }
}

const handleResultClose = () => {
  resultVisible.value = false
  operationResult.value = null
}

const handleClose = () => {
  if (!operating.value) {
    visible.value = false
  }
}

const resetForm = () => {
  activeTab.value = 'dispatch_to_gap'
  selectedAreaIds.value = []
  dispatchCount.value = 10
  dispatchMessage.value = ''
  weightTableData.value = []
  periodStrategies.value = TIME_PERIODS.map(period => ({
    period,
    weightMultiplier: 1.0,
    dispatchRadius: 10
  }))
  taskList.value = []
  selectedTaskIds.value = []
  cancelReason.value = ''
  taskFilters.value = ['invalid', 'repeated', 'cross_region']
  operationResult.value = null
  resultVisible.value = false
}

watch(visible, (val) => {
  if (val) {
    buildWeightTable()
    loadTaskData()
  } else {
    resetForm()
  }
})

watch(() => props.abnormalAreas, () => {
  if (visible.value) {
    buildWeightTable()
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.batch-dispatch-strategy {
  .strategy-tabs {
    .tab-label {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .tab-content {
    padding: 10px 0;
    min-height: 300px;
  }

  .operation-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    color: #fff;
    transition: all 0.3s;

    .el-icon {
      font-size: 20px;
    }

    &.dispatch-indicator {
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    }

    &.weight-indicator {
      background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    }

    &.cancel-indicator {
      background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    }
  }

  .section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }

      .section-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  .area-list {
    max-height: 280px;
    overflow-y: auto;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 8px;
  }

  .area-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.25s;
    border: 1px solid transparent;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f5f7fa;
    }

    &.selected {
      background: #fef0f0;
      border-color: #f56c6c;
    }

    .area-info {
      flex: 1;

      .area-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .area-detail {
        font-size: 12px;
        color: #909399;
      }
    }

    .shortage-tag {
      animation: pulse 2s infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .weight-table {
    margin-bottom: 16px;
  }

  .period-strategy-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 12px;
  }

  .period-strategy-item {
    padding: 14px 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border-radius: 8px;
    border: 1px solid #ebeef5;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .period-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .period-controls {
      display: flex;
      gap: 16px;

      .control-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .control-label {
          font-size: 13px;
          color: #606266;
          white-space: nowrap;
        }
      }
    }
  }

  .filter-bar {
    margin-bottom: 16px;
    padding: 10px 16px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  .task-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 8px;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.25s;
    border: 1px solid transparent;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f5f7fa;
    }

    &.selected {
      background: #fef0f0;
      border-color: #f56c6c;
    }

    .task-info {
      flex: 1;

      .task-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .task-id {
          font-size: 13px;
          font-weight: 600;
          color: #303133;
          font-family: 'Courier New', monospace;
        }
      }

      .task-detail {
        font-size: 12px;
        color: #606266;
        margin-bottom: 2px;
      }

      .task-time {
        font-size: 11px;
        color: #909399;
      }
    }

    .task-flags {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-end;
    }
  }

  .dispatch-config,
  .cancel-config {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }

  .action-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .action-hint {
      font-size: 13px;
      color: #909399;
    }
  }
}

.operation-result {
  .result-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-radius: 12px;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
        }
      }

      &.success {
        background: #f0f9eb;

        .stat-icon { background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%); }
        .stat-value { color: #67c23a; }
      }

      &.skipped {
        background: #fdf6ec;

        .stat-icon { background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%); }
        .stat-value { color: #e6a23c; }
      }

      &.failed {
        background: #fef0f0;

        .stat-icon { background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%); }
        .stat-value { color: #f56c6c; }
      }
    }

    .stat-divider {
      width: 1px;
      height: 60px;
      background: #ebeef5;
    }
  }

  .result-details {
    .details-header {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }
  }
}

.text-muted {
  color: #c0c4cc;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}
</style>
