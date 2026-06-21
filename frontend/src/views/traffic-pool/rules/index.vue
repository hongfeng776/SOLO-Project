<template>
  <div class="page-container">
    <el-card shadow="never" class="stats-card-row">
      <div class="stats-grid">
        <div class="stat-card stat-total">
          <div class="stat-label">权重规则总数</div>
          <div class="stat-value">{{ stats.total }}</div>
          <el-progress
            type="dashboard"
            :percentage="totalPercent"
            :color="'#409eff'"
            :width="72"
            :stroke-width="8"
            :show-text="false"
            class="stat-ring"
          />
        </div>
        <div class="stat-card stat-enabled">
          <div class="stat-label">已启用</div>
          <div class="stat-value">{{ stats.enabled }}</div>
          <el-progress
            :percentage="enabledPercent"
            :color="'#67c23a'"
            :stroke-width="10"
            :show-text="false"
            class="stat-bar"
          />
        </div>
        <div class="stat-card stat-disabled">
          <div class="stat-label">已停用</div>
          <div class="stat-value">{{ stats.disabled }}</div>
          <el-progress
            :percentage="disabledPercent"
            :color="'#909399'"
            :stroke-width="10"
            :show-text="false"
            class="stat-bar"
          />
        </div>
        <div class="stat-card stat-scene">
          <div class="stat-label">日常 / 活动 规则数</div>
          <div class="stat-values">
            <span class="scene daily">日常 {{ stats.daily }}</span>
            <el-divider direction="vertical" />
            <span class="scene activity">活动 {{ stats.activity }}</span>
          </div>
          <div class="scene-bar-wrap">
            <div class="scene-bar">
              <div class="scene-bar-seg daily" :style="{ width: dailyScenePercent + '%' }"></div>
              <div class="scene-bar-seg activity" :style="{ width: activityScenePercent + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-block">
          <div class="stat-label">今日拦截操作</div>
          <div class="stat-value warn">{{ stats.blockedToday }}</div>
          <div class="recent-block">
            <template v-if="stats.recentLogs && stats.recentLogs.length">
              <el-tooltip
                v-for="log in stats.recentLogs.slice(0, 3)"
                :key="log.id"
                :content="log.blockDetail || log.estimatedImpact || ''"
                placement="top"
              >
                <el-tag
                  size="small"
                  effect="dark"
                  type="danger"
                  class="block-tag"
                >
                  {{ WEIGHT_RULE_BLOCK_REASON_NAMES[log.blockReason || ''] || '拦截' }}
                </el-tag>
              </el-tooltip>
            </template>
            <span v-else class="muted">暂无拦截</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="规则名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="生效场景">
          <el-select
            v-model="queryParams.sceneType"
            placeholder="全部场景"
            clearable
            style="width: 130px"
          >
            <el-option label="日常时段" value="daily" />
            <el-option label="活动时段" value="activity" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已停用" :value="0" />
            <el-option label="已启用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">流量权重规则</span>
          <div class="header-actions">
            <BatchActions
              v-if="permission.canBatch"
              :selected-count="selectedCount"
              :permission="permission"
              @batch-enable="handleBatchEnable"
              @batch-disable="handleBatchDisable"
              @batch-adjust="handleBatchAdjust"
            />
            <el-button
              v-if="permission.canCreate"
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >新建规则</el-button>
          </div>
        </div>
      </template>

      <BatchProgress
        v-if="batchRunning"
        :progress="batchProgress"
        :operation="batchOperationText"
      />

      <div class="table-wrapper">
        <el-table
          :data="dataList"
          :loading="loading"
          border
          stripe
          @selection-change="handleSelectionChange"
          row-key="id"
        >
          <el-table-column type="selection" width="50" align="center" fixed />
          <el-table-column type="index" label="序号" width="60" align="center" fixed />
          <el-table-column label="规则信息" min-width="220" fixed="left">
            <template #default="{ row }">
              <div class="rule-info">
                <div class="rule-name-row">
                  <span class="rule-name" :class="{ enabled: row.status === 1 }">{{ row.ruleName }}</span>
                  <el-tag
                    size="small"
                    effect="light"
                    :color="WEIGHT_RULE_STATUS_COLORS[row.status]"
                    style="color: #fff; margin-left: 6px;"
                    :class="{ 'status-glow': statusTransitions[row.id] }"
                  >
                    {{ WEIGHT_RULE_STATUS_NAMES[row.status] }}
                  </el-tag>
                </div>
                <div class="rule-meta">
                  <span class="muted">编码：</span>
                  <span class="mono">{{ row.ruleCode }}</span>
                  <el-tag
                    size="small"
                    effect="plain"
                    :color="WEIGHT_RULE_SCENE_COLORS[row.sceneType]"
                    style="margin-left: 6px"
                  >
                    {{ WEIGHT_RULE_SCENE_NAMES[row.sceneType] }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="多维权重配比" min-width="340">
            <template #default="{ row }">
              <div class="weights-row">
                <div
                  v-for="(dim, key) in weightDimensions"
                  :key="key"
                  class="weight-dim"
                  :class="{ invalid: row._invalidDim === key }"
                >
                  <div class="dim-head">
                    <span class="dim-name" :style="{ color: dim.color }">{{ dim.name }}</span>
                    <span class="dim-val">{{ (row as any)[weightFieldMap[key]] }}%</span>
                  </div>
                  <div class="dim-bar">
                    <div
                      class="dim-bar-inner"
                      :style="{ width: ((row as any)[weightFieldMap[key]]) + '%', background: dim.color }"
                    ></div>
                  </div>
                </div>
                <div class="weight-sum" :class="{ ok: getTotal(row) === 100, err: getTotal(row) !== 100 }">
                  <el-icon v-if="getTotal(row) === 100" color="#67c23a"><CircleCheckFilled /></el-icon>
                  <el-icon v-else color="#f56c6c"><CircleCloseFilled /></el-icon>
                  <span>合计 {{ getTotal(row) }}%</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="90" align="center">
            <template #default="{ row }">
              <span class="priority">{{ row.priority }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生效影响" min-width="180">
            <template #default="{ row }">
              <div class="impact-cell">
                <div class="impact-line">
                  <span class="muted">影响内容：</span>
                  <span class="imp-val">{{ formatNumber(row.affectedContentCount) }} 条</span>
                </div>
                <div v-if="row.avgWeightScore" class="impact-line">
                  <span class="muted">均值得分：</span>
                  <span class="imp-val" :class="scoreClass(row.avgWeightScore)">{{ row.avgWeightScore }}</span>
                </div>
                <div v-if="row.lastRecalcTime" class="impact-line">
                  <span class="muted">最近重算：</span>
                  <span class="muted">{{ formatDateTime(row.lastRecalcTime) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">
              <span class="time-cell">{{ formatDateTime(row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right" align="center">
            <template #default="{ row }">
              <template v-if="row.status === 0">
                <el-button
                  v-if="permission.canToggle"
                  type="success"
                  size="small"
                  link
                  :class="{ 'btn-highlight': statusTransitions[row.id] }"
                  @click="handleToggle(row, true)"
                >启用</el-button>
              </template>
              <template v-else>
                <el-button
                  v-if="permission.canToggle"
                  type="warning"
                  size="small"
                  link
                  :class="{ 'btn-highlight': statusTransitions[row.id] }"
                  @click="handleToggle(row, false)"
                >停用</el-button>
              </template>
              <el-button
                v-if="permission.canEdit"
                type="primary"
                size="small"
                link
                @click="handleEdit(row)"
              >编辑</el-button>
              <el-button
                v-if="permission.canAdjust"
                size="small"
                link
                @click="handleEdit(row)"
              >调整权重</el-button>
              <el-button
                v-if="permission.canRecalc"
                size="small"
                link
                @click="handleRecalc(row)"
              >重算队列</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <WeightRuleDialog
      v-model="ruleDialogVisible"
      :edit-data="currentEditData"
      @success="handleRuleSuccess"
    />

    <BatchAdjustDialog
      v-if="adjustDialogVisible"
      v-model="adjustDialogVisible"
      :selected-ids="selectedIds"
      :dimension-list="weightDimensionList"
      @success="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineAsyncComponent } from 'vue'
import {
  Search, Refresh, Plus, CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime, formatNumber } from '@hooks/index'
import {
  getTrafficWeightRuleList,
  getTrafficWeightRuleStats,
  enableTrafficWeightRule,
  disableTrafficWeightRule,
  recalcTrafficWeightRule,
  batchTrafficWeightRule
} from '@api/traffic-weight-rule'
import type { TrafficWeightRule, TrafficWeightRulePermission, WeightRuleStats } from '@/types/business'
import {
  WEIGHT_RULE_STATUS_NAMES,
  WEIGHT_RULE_STATUS_COLORS,
  WEIGHT_RULE_SCENE_NAMES,
  WEIGHT_RULE_SCENE_COLORS,
  WEIGHT_DIMENSION_NAMES,
  WEIGHT_DIMENSION_COLORS,
  WEIGHT_RULE_BLOCK_REASON_NAMES
} from '@/enums/business'
import WeightRuleDialog from './components/WeightRuleDialog.vue'

const BatchActions = defineAsyncComponent(() => import('./components/BatchActions.vue'))
const BatchProgress = defineAsyncComponent(() => import('./components/BatchProgress.vue'))
const BatchAdjustDialog = defineAsyncComponent(() => import('./components/BatchAdjustDialog.vue'))

const userStore = useUserStore()

const permission = reactive<TrafficWeightRulePermission>({
  canView: false, canCreate: false, canEdit: false, canToggle: false,
  canBatch: false, canAdjust: false, canViewTrace: false, canRecalc: false
})

const computePermission = () => {
  const has = (r: string) => userStore.hasRole(r)
  permission.canView = has('admin') || has('operation_admin') || has('senior_operator') || has('operator') || has('auditor')
  permission.canCreate = has('admin') || has('operation_admin') || has('senior_operator')
  permission.canEdit = has('admin') || has('operation_admin') || has('senior_operator')
  permission.canToggle = has('admin') || has('operation_admin') || has('senior_operator') || has('operator')
  permission.canBatch = has('admin') || has('operation_admin')
  permission.canAdjust = has('admin') || has('operation_admin')
  permission.canViewTrace = has('admin') || has('operation_admin') || has('senior_operator') || has('auditor')
  permission.canRecalc = has('admin') || has('operation_admin') || has('senior_operator')
}

const weightFieldMap: Record<string, string> = {
  content_quality: 'contentQualityWeight',
  user_activity: 'userActivityWeight',
  interaction: 'interactionWeight',
  compliance: 'complianceWeight'
}
const weightDimensions = computed(() => ({
  content_quality: { name: WEIGHT_DIMENSION_NAMES.content_quality, color: WEIGHT_DIMENSION_COLORS.content_quality },
  user_activity: { name: WEIGHT_DIMENSION_NAMES.user_activity, color: WEIGHT_DIMENSION_COLORS.user_activity },
  interaction: { name: WEIGHT_DIMENSION_NAMES.interaction, color: WEIGHT_DIMENSION_COLORS.interaction },
  compliance: { name: WEIGHT_DIMENSION_NAMES.compliance, color: WEIGHT_DIMENSION_COLORS.compliance }
}))
const weightDimensionList = computed(() => Object.keys(weightDimensions.value).map(k => {
  const dim = weightDimensions.value[k as keyof typeof weightDimensions.value]
  return {
    key: k,
    field: weightFieldMap[k],
    name: dim.name,
    color: dim.color
  }
}))

const getTotal = (row: TrafficWeightRule) => {
  return (row.contentQualityWeight || 0) + (row.userActivityWeight || 0) + (row.interactionWeight || 0) + (row.complianceWeight || 0)
}
const scoreClass = (s: number) => (s >= 70 ? 'high' : s >= 50 ? 'mid' : 'low')

const stats = ref<WeightRuleStats>({
  total: 0, enabled: 0, disabled: 0, daily: 0, activity: 0, blockedToday: 0, recentLogs: []
})
const totalPercent = computed(() => stats.value.total > 0 ? 100 : 0)
const enabledPercent = computed(() => stats.value.total ? Math.round(stats.value.enabled / stats.value.total * 100) : 0)
const disabledPercent = computed(() => stats.value.total ? Math.round(stats.value.disabled / stats.value.total * 100) : 0)
const dailyScenePercent = computed(() => {
  const total = stats.value.daily + stats.value.activity
  return total > 0 ? Math.round(stats.value.daily / total * 100) : 50
})
const activityScenePercent = computed(() => 100 - dailyScenePercent.value)

const queryParams = reactive({
  page: 1, pageSize: 20,
  keyword: '', sceneType: '', status: undefined as number | undefined
})

const { loading, dataList, total, fetchData, handleSearch: doSearch, handleReset: doReset } =
  useFetchList<TrafficWeightRule>({
    fetchApi: getTrafficWeightRuleList,
    defaultParams: queryParams,
    immediate: false
  })

const fetchStats = async () => {
  try {
    const r = await getTrafficWeightRuleStats()
    stats.value = r as any
  } catch (e) {}
}

const handleSearch = () => { doSearch(); fetchStats() }
const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 20
  queryParams.keyword = ''
  queryParams.sceneType = ''
  queryParams.status = undefined
  doReset(); fetchStats()
}

const ruleDialogVisible = ref(false)
const currentEditData = ref<TrafficWeightRule | null>(null)
const statusTransitions = reactive<Record<number, boolean>>({})

const transitionStatusLocally = (row: TrafficWeightRule, nextStatus: number) => {
  statusTransitions[row.id] = true
  setTimeout(() => {
    ;(row as any).status = nextStatus
    setTimeout(() => {
      statusTransitions[row.id] = false
    }, 300)
  }, 150)
}

const handleCreate = () => {
  currentEditData.value = null
  ruleDialogVisible.value = true
}

const handleEdit = (row: TrafficWeightRule) => {
  currentEditData.value = row
  ruleDialogVisible.value = true
}

const handleRuleSuccess = () => {
  fetchData()
  fetchStats()
}

const handleToggle = async (row: TrafficWeightRule, enable: boolean) => {
  try {
    await ElMessageBox.confirm(
      `确认${enable ? '启用' : '停用'}规则【${row.ruleName}】？${enable ? '启用后将自动重算流量分发队列' : ''}`,
      '状态变更确认',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch { return }

  const prevStatus = row.status
  transitionStatusLocally(row, enable ? 1 : 0)

  try {
    const fn = enable ? enableTrafficWeightRule : disableTrafficWeightRule
    const r = await fn(row.id, '状态切换')
    if (r.success) {
      ElMessage.success((enable ? '启用' : '停用') + '成功')
      fetchStats()
      if (r.affectedContentCount !== undefined) {
        ElMessage.info(`已联动重算 ${formatNumber(r.affectedContentCount)} 条内容权重`)
      }
    } else {
      ;(row as any).status = prevStatus
      ElMessage.error(r.errors?.[0] || r.blockDetail || '操作失败')
    }
  } catch (e: any) {
    ;(row as any).status = prevStatus
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleRecalc = async (row: TrafficWeightRule) => {
  try {
    const r = await recalcTrafficWeightRule(row.id)
    if (r.success) {
      ElMessage.success(`队列重算完成，耗时 ${r.cost || 0}ms，覆盖 ${formatNumber(r.count || 0)} 条内容`)
      fetchData()
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '重算失败')
  }
}

const selectedIds = ref<number[]>([])
const selectedCount = computed(() => selectedIds.value.length)
const handleSelectionChange = (rows: TrafficWeightRule[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const batchRunning = ref(false)
const batchProgress = ref(0)
const batchOperationText = ref('')

const runBatch = async (operation: 'enable' | 'disable' | 'adjust', label: string, targetWeights?: Record<string, number>) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择规则')
    return
  }
  try {
    await ElMessageBox.confirm(
      `对选中的 ${selectedIds.value.length} 条规则执行【${label}】？此操作仅超级运营权限可执行，请确认。`,
      '批量操作二次确认',
      { type: 'warning', confirmButtonText: '确认执行', cancelButtonText: '取消' }
    )
  } catch { return }

  batchRunning.value = true
  batchProgress.value = 0
  batchOperationText.value = label
  const total = selectedIds.value.length
  let step = 0
  const timer = setInterval(() => {
    step += 1
    batchProgress.value = Math.min(step / total / 20 * 100, batchProgress.value + (1 / total / 20 * 100))
  }, 50)

  try {
    const r = await batchTrafficWeightRule({ operation, ids: [...selectedIds.value], targetWeights, reason: `批量${label}` })
    clearInterval(timer)
    batchProgress.value = 100
    ElMessage.success(`批量${label}完成：成功 ${r.successCount} 条，拦截 ${r.blockedCount} 条`)
    setTimeout(() => {
      batchRunning.value = false
      fetchData()
      fetchStats()
    }, 500)
  } catch (e: any) {
    clearInterval(timer)
    batchRunning.value = false
    ElMessage.error(e?.message || '批量操作失败')
  }
}

const handleBatchEnable = () => runBatch('enable', '启用')
const handleBatchDisable = () => runBatch('disable', '停用')

const adjustDialogVisible = ref(false)
const handleBatchAdjust = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择规则')
    return
  }
  adjustDialogVisible.value = true
}

onMounted(() => {
  computePermission()
  if (permission.canView) {
    fetchData()
    fetchStats()
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  .stats-card-row {
    margin-bottom: 20px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
  .stat-card {
    position: relative;
    padding: 16px 20px;
    border-radius: 6px;
    background: linear-gradient(135deg, #fbfcfe 0%, #f5f7fb 100%);
    border: 1px solid $border-color;
    overflow: hidden;

    .stat-label {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 8px;
    }
    .stat-value {
      font-family: 'DIN', monospace;
      font-size: 28px;
      font-weight: 700;
      color: $text-primary;
    }
    .stat-values {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 2px 0 10px 0;

      .scene {
        font-family: 'DIN', monospace;
        font-size: 18px;
        font-weight: 700;
        &.daily { color: $primary-color; }
        &.activity { color: #e6a23c; }
      }
    }
    .stat-ring { position: absolute; right: 14px; top: 14px; }
    .stat-bar {
      margin-top: 12px;
      max-width: 160px;
    }
    .scene-bar-wrap {
      margin-top: 4px;
      .scene-bar {
        display: flex;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        max-width: 220px;
        .scene-bar-seg {
          height: 100%;
          transition: width 0.4s ease;
          &.daily { background: $primary-color; }
          &.activity { background: #e6a23c; }
        }
      }
    }
    .stat-value.warn { color: #e6a23c; }
    .recent-block {
      margin-top: 8px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      .block-tag { cursor: pointer; }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .rule-info {
    .rule-name-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      .rule-name {
        font-size: 14px;
        font-weight: 600;
        color: $text-secondary;
        transition: color 0.3s ease;
        &.enabled { color: $text-primary; }
      }
    }
    .rule-meta {
      font-size: 12px;
      display: flex;
      align-items: center;
      .mono { font-family: 'Consolas', monospace; color: $text-secondary; }
    }
    .status-glow {
      animation: status-pulse 0.3s ease-out;
    }
  }

  .weights-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    align-items: start;

    .weight-dim {
      padding: 6px 8px;
      border-radius: 4px;
      transition: background 0.3s;
      &.invalid { background: rgba(245, 108, 108, 0.08); }

      .dim-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        margin-bottom: 3px;
        .dim-name { font-weight: 500; }
        .dim-val {
          font-family: 'DIN', monospace;
          font-weight: 700;
          color: $text-primary;
        }
      }
      .dim-bar {
        height: 6px;
        background: $border-color-light;
        border-radius: 3px;
        overflow: hidden;
        .dim-bar-inner {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      }
    }
  }
  .weight-sum {
    grid-column: span 4;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed $border-color-light;
    font-size: 12px;
    font-weight: 600;
    &.ok { color: #67c23a; }
    &.err { color: #f56c6c; }
  }

  .priority {
    font-family: 'DIN', monospace;
    font-weight: 600;
  }

  .impact-cell {
    font-size: 12px;
    .impact-line { margin-bottom: 3px; display: flex; align-items: center; gap: 4px; }
    .imp-val { font-family: 'DIN', monospace; font-weight: 600; color: $text-primary;
      &.high { color: #67c23a; }
      &.mid { color: #e6a23c; }
      &.low { color: #f56c6c; }
    }
  }

  .time-cell {
    font-size: 12px;
    color: $text-secondary;
  }

  .btn-highlight {
    animation: btn-float 0.3s ease-out;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}

@keyframes status-pulse {
  0% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.6); }
  50% { box-shadow: 0 0 0 6px rgba(103, 194, 58, 0); }
  100% { transform: scale(1); }
}

@keyframes btn-float {
  0% { transform: translateY(0); opacity: 1; }
  30% { transform: translateY(-4px); opacity: 0.85; }
  100% { transform: translateY(0); opacity: 1; }
}
</style>
