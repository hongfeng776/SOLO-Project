<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button
        v-if="hasPerm('riskRule:create')"
        type="primary"
        @click="handleCreate"
      >
        <el-icon><Plus /></el-icon>
        新增规则
      </el-button>
      <el-button
        v-if="hasPerm('riskRule:batch')"
        type="success"
        :disabled="selectedIds.length === 0"
        @click="handleBatchEnable"
      >
        <el-icon><CircleCheck /></el-icon>
        批量启用
      </el-button>
      <el-button
        v-if="hasPerm('riskRule:batch')"
        type="warning"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDisable"
      >
        <el-icon><CircleClose /></el-icon>
        批量禁用
      </el-button>
      <el-button
        v-if="hasPerm('riskRule:reset') && hasRole('admin')"
        type="danger"
        :disabled="selectedIds.length === 0"
        @click="handleBatchReset"
      >
        <el-icon><RefreshRight /></el-icon>
        批量重置
      </el-button>
      <el-button type="primary" plain @click="handleSyncControls">
        <el-icon><Refresh /></el-icon>
        同步风控管控
      </el-button>
    </div>

    <div class="stats-cards">
      <div
        v-for="stat in statsData"
        :key="stat.key"
        class="stat-card"
        :class="stat.cardClass"
        @click="handleFilterByStatus(stat.status)"
      >
        <div class="stat-icon">
          <el-icon :size="28"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="rule-cards-grid" v-loading="loading" element-loading-text="加载中...">
      <transition-group name="card-list">
        <div
          v-for="rule in tableData"
          :key="rule.id"
          class="rule-card"
          :class="{ 'is-selected': selectedIds.includes(rule.id) }"
          @click="handleCardClick(rule)"
        >
          <div class="card-header">
            <div class="card-title-area">
              <el-checkbox
                :model-value="selectedIds.includes(rule.id)"
                @change="(val: boolean) => handleSelectionChange(rule, val)"
                @click.stop
              />
              <div class="rule-type-badge" :style="{ backgroundColor: getRuleTypeColor(rule.ruleType) + '20', color: getRuleTypeColor(rule.ruleType) }">
                <el-icon><component :is="getRuleTypeIcon(rule.ruleType)" /></el-icon>
                {{ getRuleTypeLabel(rule.ruleType) }}
              </div>
              <span class="rule-name" :title="rule.ruleName">{{ rule.ruleName }}</span>
            </div>
            <div class="card-status-area">
              <el-switch
                v-if="hasPerm('riskRule:manage')"
                :model-value="rule.status === RiskRuleStatus.ENABLED"
                :loading="statusChangingId === rule.id"
                :disabled="rule.status === RiskRuleStatus.EXPIRED"
                @change="(val: boolean) => handleToggleStatus(rule, val)"
                @click.stop
              />
              <el-tag
                :type="getRuleStatusType(rule.status)"
                effect="light"
                class="status-tag"
              >
                {{ getRuleStatusLabel(rule.status) }}
              </el-tag>
            </div>
          </div>

          <div class="card-body">
            <div class="card-row">
              <span class="card-label">规则编码：</span>
              <span class="code-text">{{ rule.ruleCode }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">生效模式：</span>
              <el-tag size="small" type="info" effect="plain">{{ getEffectModeLabel(rule.effectMode) }}</el-tag>
              <span v-if="rule.effectMode === EffectMode.SCHEDULED && rule.scheduledTime" class="scheduled-time">
                <el-icon><Clock /></el-icon>
                {{ rule.scheduledTime }}
              </span>
            </div>
            <div class="card-row">
              <span class="card-label">适用客户：</span>
              <div class="level-tags">
                <el-tag
                  v-for="level in rule.customerLevels"
                  :key="level"
                  size="small"
                  effect="plain"
                  :style="{ borderColor: getLevelColor(level), color: getLevelColor(level) }"
                >
                  {{ getLevelLabel(level) }}
                </el-tag>
              </div>
            </div>
            <div class="card-row card-desc" :title="rule.description">
              <span class="card-label">规则描述：</span>
              <span class="desc-text">{{ rule.description || '暂无描述' }}</span>
            </div>
            <div class="card-row time-range">
              <span class="card-label">有效期：</span>
              <span>{{ rule.effectiveStart }} ~ {{ rule.effectiveEnd || '长期有效' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="card-meta">
              <span>版本：v{{ rule.version }}</span>
              <span>优先级：{{ rule.priority }}</span>
              <span>创建人：{{ rule.createdByName || '-' }}</span>
            </div>
            <div class="card-actions" @click.stop>
              <el-button type="primary" link size="small" @click="handleView(rule)">
                详情
              </el-button>
              <el-button
                v-if="hasPerm('riskRule:manage')"
                type="primary"
                link
                size="small"
                @click="handleEdit(rule)"
              >
                编辑
              </el-button>
              <el-button type="info" link size="small" @click="handleHistory(rule)">
                溯源
              </el-button>
              <el-button
                v-if="hasPerm('riskRule:reset') && hasRole('admin')"
                type="warning"
                link
                size="small"
                @click="handleReset(rule)"
              >
                重置
              </el-button>
            </div>
          </div>
        </div>
      </transition-group>

      <FinEmpty v-if="!loading && tableData.length === 0" description="暂无风控规则数据" />
    </div>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <RiskRuleConfigDialog
      v-model:visible="configDialogVisible"
      :edit-data="currentEditData"
      @success="handleConfigSuccess"
    />

    <RiskRuleHistoryDialog
      v-model:visible="historyDialogVisible"
      :rule-id="currentHistoryId"
    />

    <RiskRuleBatchProgress
      v-model:visible="batchProgressVisible"
      :progress="batchProgress"
    />

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="风控规则详情"
      width="900px"
      :hide-footer="true"
    >
      <div v-if="currentDetail" class="rule-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="规则编码">
            <span class="code-text">{{ currentDetail.ruleCode }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="规则名称">
            {{ currentDetail.ruleName }}
          </el-descriptions-item>
          <el-descriptions-item label="规则类型">
            <el-tag :color="getRuleTypeColor(currentDetail.ruleType) + '20'" effect="light" :style="{ color: getRuleTypeColor(currentDetail.ruleType) }">
              {{ getRuleTypeLabel(currentDetail.ruleType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则状态">
            <el-tag :type="getRuleStatusType(currentDetail.status)" effect="light">
              {{ getRuleStatusLabel(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="生效模式">
            {{ getEffectModeLabel(currentDetail.effectMode) }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            {{ currentDetail.priority }}
          </el-descriptions-item>
          <el-descriptions-item label="版本号">
            v{{ currentDetail.version }}
          </el-descriptions-item>
          <el-descriptions-item label="全局规则">
            {{ currentDetail.isGlobal ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="适用客户等级" :span="2">
            <div class="level-tags">
              <el-tag
                v-for="level in currentDetail.customerLevels"
                :key="level"
                effect="plain"
                :style="{ borderColor: getLevelColor(level), color: getLevelColor(level) }"
              >
                {{ getLevelLabel(level) }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="有效期" :span="2">
            {{ currentDetail.effectiveStart }} ~ {{ currentDetail.effectiveEnd || '长期有效' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.scheduledTime" label="定时生效时间" :span="2">
            {{ currentDetail.scheduledTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.scopeSectors?.length" label="适用板块" :span="2">
            <el-tag v-for="sector in currentDetail.scopeSectors" :key="sector" size="small" class="mr-4">
              {{ sector }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则描述" :span="2">
            {{ currentDetail.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ currentDetail.createdByName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(currentDetail.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后修改人">
            {{ currentDetail.updatedByName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后修改时间">
            {{ formatDateTime(currentDetail.updatedAt) || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="params-section">
          <div class="section-title">
            <el-icon><Setting /></el-icon>
            分级参数配置
          </div>
          <el-table :data="currentDetail.levelParams" border size="small">
            <el-table-column label="客户等级" prop="customerLevel" width="120">
              <template #default="{ row }">
                <el-tag
                  effect="plain"
                  :style="{ borderColor: getLevelColor(row.customerLevel), color: getLevelColor(row.customerLevel) }"
                >
                  {{ getLevelLabel(row.customerLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <template v-if="currentDetail.ruleType === RiskRuleType.TRADE_LIMIT">
              <el-table-column label="单笔最小金额(元)" prop="minTradeAmount" />
              <el-table-column label="单笔最大金额(元)" prop="maxTradeAmount" />
              <el-table-column label="日累计限额(元)" prop="dailyTradeLimit" />
            </template>
            <template v-else-if="currentDetail.ruleType === RiskRuleType.POSITION_LIMIT">
              <el-table-column label="最大持仓金额(元)" prop="maxPositionAmount" />
              <el-table-column label="最大持仓比例(%)" prop="maxPositionRatio" />
              <el-table-column label="单票持仓上限(%)" prop="singleStockPositionLimit" />
            </template>
            <template v-else-if="currentDetail.ruleType === RiskRuleType.VOLATILITY_RISK">
              <el-table-column label="日最大波动率(%)" prop="maxDailyVolatility" />
              <el-table-column label="单次最大波动(%)" prop="maxSingleVolatility" />
              <el-table-column label="熔断阈值(%)" prop="circuitBreakerThreshold" />
            </template>
            <template v-else-if="currentDetail.ruleType === RiskRuleType.FREQUENCY_RISK">
              <el-table-column label="日最大交易笔数" prop="maxDailyTrades" />
              <el-table-column label="每分钟交易笔数" prop="maxTradesPerMinute" />
              <el-table-column label="同票单日最大笔数" prop="maxSameStockTrades" />
              <el-table-column label="冷却期(秒)" prop="coolDownPeriod" />
            </template>
          </el-table>
        </div>

        <div v-if="currentDetail.remark" class="remark-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            备注信息
          </div>
          <div class="remark-content">{{ currentDetail.remark }}</div>
        </div>
      </div>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  CircleCheck,
  CircleClose,
  RefreshRight,
  Refresh,
  Clock,
  Setting,
  Document,
  Money,
  Goods,
  TrendCharts,
  Timer,
} from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinEmpty from '@/components/common/FinEmpty.vue'
import RiskRuleConfigDialog from './RiskRuleConfigDialog.vue'
import RiskRuleHistoryDialog from './RiskRuleHistoryDialog.vue'
import RiskRuleBatchProgress from './RiskRuleBatchProgress.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/utils/format'
import {
  RISK_RULE_TYPE_LABELS,
  RISK_RULE_TYPE_COLORS,
  RISK_RULE_STATUS_LABELS,
  RISK_RULE_STATUS_COLORS,
  EFFECT_MODE_LABELS,
  CUSTOMER_LEVEL_LABELS,
  CUSTOMER_LEVEL_COLORS,
  MARKET_SECTOR_LIST,
} from '@/constants/dictionaries'
import {
  RiskRuleType,
  RiskRuleStatus,
  EffectMode,
  CustomerLevel,
  BatchOperationType,
} from '@/enums'
import * as riskRuleApi from '@/api/riskRule'
import type { IRiskRule, IBatchOperationProgress } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const { hasPerm, hasRole } = usePermission()

const loading = ref(false)
const tableData = ref<IRiskRule[]>([])
const selectedIds = ref<number[]>([])
const statusChangingId = ref<number | null>(null)

const configDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const batchProgressVisible = ref(false)

const currentEditData = ref<IRiskRule | null>(null)
const currentHistoryId = ref<number | null>(null)
const currentDetail = ref<IRiskRule | null>(null)

const searchParams = reactive<Record<string, any>>({})
const batchProgress = ref<IBatchOperationProgress | null>(null)

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const statsData = computed(() => {
  const data = tableData.value
  return [
    {
      key: 'total',
      label: '规则总数',
      value: pagination.total || data.length,
      icon: 'Document',
      cardClass: 'stat-total',
      status: null as any,
    },
    {
      key: 'enabled',
      label: '已启用',
      value: data.filter((r) => r.status === RiskRuleStatus.ENABLED).length,
      icon: 'CircleCheck',
      cardClass: 'stat-enabled',
      status: RiskRuleStatus.ENABLED,
    },
    {
      key: 'disabled',
      label: '已禁用',
      value: data.filter((r) => r.status === RiskRuleStatus.DISABLED).length,
      icon: 'CircleClose',
      cardClass: 'stat-disabled',
      status: RiskRuleStatus.DISABLED,
    },
    {
      key: 'pending',
      label: '待生效',
      value: data.filter((r) => r.status === RiskRuleStatus.PENDING).length,
      icon: 'Clock',
      cardClass: 'stat-pending',
      status: RiskRuleStatus.PENDING,
    },
  ]
})

const filterConfig = [
  {
    prop: 'keyword',
    label: '规则名称/编码',
    type: 'input' as const,
    placeholder: '请输入规则名称或编码',
  },
  {
    prop: 'ruleType',
    label: '规则类型',
    type: 'select' as const,
    options: [
      { label: '交易限额', value: RiskRuleType.TRADE_LIMIT },
      { label: '持仓限额', value: RiskRuleType.POSITION_LIMIT },
      { label: '波动风控', value: RiskRuleType.VOLATILITY_RISK },
      { label: '频次风控', value: RiskRuleType.FREQUENCY_RISK },
    ],
  },
  {
    prop: 'status',
    label: '规则状态',
    type: 'select' as const,
    options: [
      { label: '已启用', value: RiskRuleStatus.ENABLED },
      { label: '已禁用', value: RiskRuleStatus.DISABLED },
      { label: '待生效', value: RiskRuleStatus.PENDING },
      { label: '已过期', value: RiskRuleStatus.EXPIRED },
    ],
  },
  {
    prop: 'customerLevel',
    label: '客户等级',
    type: 'select' as const,
    options: [
      { label: '普通客户', value: CustomerLevel.NORMAL },
      { label: '白银客户', value: CustomerLevel.SILVER },
      { label: '黄金客户', value: CustomerLevel.GOLD },
      { label: '铂金客户', value: CustomerLevel.PLATINUM },
      { label: '钻石客户', value: CustomerLevel.DIAMOND },
    ],
  },
  {
    prop: 'effectMode',
    label: '生效模式',
    type: 'select' as const,
    options: [
      { label: '即时生效', value: EffectMode.IMMEDIATE },
      { label: '定时生效', value: EffectMode.SCHEDULED },
    ],
  },
]

function getRuleTypeLabel(type: string): string {
  return RISK_RULE_TYPE_LABELS[type as RiskRuleType] || type || '-'
}

function getRuleTypeColor(type: string): string {
  return RISK_RULE_TYPE_COLORS[type as RiskRuleType] || '#909399'
}

function getRuleTypeIcon(type: string): any {
  const iconMap: Record<string, any> = {
    [RiskRuleType.TRADE_LIMIT]: Money,
    [RiskRuleType.POSITION_LIMIT]: Goods,
    [RiskRuleType.VOLATILITY_RISK]: TrendCharts,
    [RiskRuleType.FREQUENCY_RISK]: Timer,
  }
  return iconMap[type] || Setting
}

function getRuleStatusLabel(status: string): string {
  return RISK_RULE_STATUS_LABELS[status as RiskRuleStatus] || status || '-'
}

function getRuleStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (RISK_RULE_STATUS_COLORS[status as RiskRuleStatus] as any) || 'info'
}

function getEffectModeLabel(mode: string): string {
  return EFFECT_MODE_LABELS[mode as EffectMode] || mode || '-'
}

function getLevelLabel(level: string): string {
  return CUSTOMER_LEVEL_LABELS[level as CustomerLevel] || level || '-'
}

function getLevelColor(level: string): string {
  return CUSTOMER_LEVEL_COLORS[level as CustomerLevel] || '#909399'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    const res = await riskRuleApi.getRiskRuleList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取风控规则列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  selectedIds.value = []
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach((key) => {
    delete searchParams[key]
  })
  pagination.page = 1
  selectedIds.value = []
  fetchData()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

function handleFilterByStatus(status: RiskRuleStatus | null) {
  if (status === null) {
    handleReset()
  } else {
    searchParams.status = status
    pagination.page = 1
    fetchData()
  }
}

function handleCardClick(rule: IRiskRule) {
  handleView(rule)
}

function handleSelectionChange(rule: IRiskRule, val: boolean) {
  if (val) {
    if (!selectedIds.value.includes(rule.id)) {
      selectedIds.value.push(rule.id)
    }
  } else {
    const idx = selectedIds.value.indexOf(rule.id)
    if (idx > -1) {
      selectedIds.value.splice(idx, 1)
    }
  }
}

async function handleView(row: IRiskRule) {
  try {
    const res = await riskRuleApi.getRiskRuleById(row.id)
    if (res.code === 0) {
      currentDetail.value = res.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取规则详情失败')
  }
}

function handleCreate() {
  if (!hasPerm('riskRule:create')) {
    ElMessage.warning('您没有新增风控规则的权限')
    return
  }
  currentEditData.value = null
  configDialogVisible.value = true
}

function handleEdit(row: IRiskRule) {
  if (!hasPerm('riskRule:manage')) {
    ElMessage.warning('您没有编辑风控规则的权限')
    return
  }
  currentEditData.value = row
  configDialogVisible.value = true
}

function handleHistory(row: IRiskRule) {
  currentHistoryId.value = row.id
  historyDialogVisible.value = true
}

async function handleToggleStatus(rule: IRiskRule, val: boolean) {
  if (!hasPerm('riskRule:manage')) {
    ElMessage.warning('您没有操作权限')
    return
  }
  statusChangingId.value = rule.id
  try {
    const action = val ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定${action}风控规则 "${rule.ruleName}" 吗？`,
      `${action}确认`,
      { type: 'warning' },
    )
    const api = val ? riskRuleApi.enableRiskRule : riskRuleApi.disableRiskRule
    const res = await api(rule.id)
    if (res.code === 0) {
      ElMessage.success(`${action}成功，已同步更新客户风控管控`)
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    } else {
      fetchData()
    }
  } finally {
    setTimeout(() => {
      statusChangingId.value = null
    }, 300)
  }
}

async function handleReset(rule: IRiskRule) {
  if (!hasPerm('riskRule:reset') || !hasRole('admin')) {
    ElMessage.warning('仅管理员可执行重置操作')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定重置风控规则 "${rule.ruleName}" 吗？此操作将恢复至系统默认配置，且不可撤销！`,
      '重置确认',
      { type: 'warning', confirmButtonText: '确定重置', cancelButtonText: '取消' },
    )
    const res = await riskRuleApi.resetRiskRule(rule.id)
    if (res.code === 0) {
      ElMessage.success('重置成功，已同步更新客户风控管控')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败')
    }
  }
}

async function handleBatchEnable() {
  if (!hasPerm('riskRule:batch')) return
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的规则')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定批量启用选中的 ${selectedIds.value.length} 条风控规则吗？`,
      '批量启用确认',
      { type: 'warning' },
    )
    await executeBatchOperation(BatchOperationType.ENABLE)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量启用失败')
    }
  }
}

async function handleBatchDisable() {
  if (!hasPerm('riskRule:batch')) return
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的规则')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定批量禁用选中的 ${selectedIds.value.length} 条风控规则吗？`,
      '批量禁用确认',
      { type: 'warning' },
    )
    await executeBatchOperation(BatchOperationType.DISABLE)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量禁用失败')
    }
  }
}

async function handleBatchReset() {
  if (!hasPerm('riskRule:reset') || !hasRole('admin')) {
    ElMessage.warning('仅管理员可执行全局重置操作')
    return
  }
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要重置的规则')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定批量重置选中的 ${selectedIds.value.length} 条风控规则吗？此操作将恢复至系统默认配置，且不可撤销！`,
      '批量重置确认',
      { type: 'warning', confirmButtonText: '确定重置', cancelButtonText: '取消' },
    )
    await executeBatchOperation(BatchOperationType.RESET)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量重置失败')
    }
  }
}

async function executeBatchOperation(operationType: BatchOperationType) {
  const ids = [...selectedIds.value]
  const operationLabelMap: Record<BatchOperationType, string> = {
    [BatchOperationType.ENABLE]: '批量启用',
    [BatchOperationType.DISABLE]: '批量禁用',
    [BatchOperationType.RESET]: '批量重置',
  }

  batchProgress.value = {
    operationType,
    operationTypeLabel: operationLabelMap[operationType],
    total: ids.length,
    current: 0,
    percent: 0,
    status: 'processing',
    successCount: 0,
    failedCount: 0,
    failedItems: [],
    startTime: new Date().toISOString(),
  }
  batchProgressVisible.value = true

  const apiMap: Record<BatchOperationType, Function> = {
    [BatchOperationType.ENABLE]: riskRuleApi.batchEnableRiskRules,
    [BatchOperationType.DISABLE]: riskRuleApi.batchDisableRiskRules,
    [BatchOperationType.RESET]: riskRuleApi.batchResetRiskRules,
  }

  try {
    for (let i = 0; i < ids.length; i++) {
      try {
        const res = await apiMap[operationType]([ids[i]])
        if (res.code === 0) {
          batchProgress.value.successCount++
        } else {
          batchProgress.value.failedCount++
          const rule = tableData.value.find((r) => r.id === ids[i])
          batchProgress.value.failedItems.push({
            id: ids[i],
            ruleName: rule?.ruleName || `规则#${ids[i]}`,
            reason: res.message,
          })
        }
      } catch (e: any) {
        batchProgress.value.failedCount++
        const rule = tableData.value.find((r) => r.id === ids[i])
        batchProgress.value.failedItems.push({
          id: ids[i],
          ruleName: rule?.ruleName || `规则#${ids[i]}`,
          reason: e.message || '执行异常',
        })
      }
      batchProgress.value.current = i + 1
      batchProgress.value.percent = Math.round(((i + 1) / ids.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    batchProgress.value.status = batchProgress.value.failedCount === 0 ? 'success' : (batchProgress.value.successCount === 0 ? 'failed' : 'success')
    batchProgress.value.endTime = new Date().toISOString()
    selectedIds.value = []
    fetchData()
  } catch (error) {
    batchProgress.value.status = 'failed'
    batchProgress.value.endTime = new Date().toISOString()
  }
}

async function handleSyncControls() {
  try {
    await ElMessageBox.confirm(
      '确定立即同步全量客户风控管控逻辑吗？此操作可能需要一些时间。',
      '同步确认',
      { type: 'info' },
    )
    const res = await riskRuleApi.syncCustomerRiskControls()
    if (res.code === 0) {
      ElMessage.success(`同步成功：已更新 ${res.data.ruleCount} 条规则，覆盖 ${res.data.syncedCustomerCount} 位客户`)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败')
    }
  }
}

function handleConfigSuccess() {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.stat-total {
    .stat-icon {
      background: linear-gradient(135deg, #1A3A5C 0%, #2C5F8A 100%);
    }
  }

  &.stat-enabled {
    .stat-icon {
      background: linear-gradient(135deg, #0F9B58 0%, #67C23A 100%);
    }
    &:hover {
      border-color: #67C23A;
    }
  }

  &.stat-disabled {
    .stat-icon {
      background: linear-gradient(135deg, #606266 0%, #909399 100%);
    }
    &:hover {
      border-color: #909399;
    }
  }

  &.stat-pending {
    .stat-icon {
      background: linear-gradient(135deg, #E8A838 0%, #F0C78E 100%);
    }
    &:hover {
      border-color: #E6A23C;
    }
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1F2D3D;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #8492A6;
}

.rule-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 16px;
  margin-top: 16px;
  min-height: 400px;
}

.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.4s ease;
}

.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.card-list-move {
  transition: transform 0.4s ease;
}

.rule-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #E4E7ED;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #409EFF;
    box-shadow: 0 8px 24px rgba(26, 58, 92, 0.12);
    transform: translateY(-2px);
  }

  &.is-selected {
    border-color: #409EFF;
    background: linear-gradient(180deg, rgba(64, 158, 255, 0.03) 0%, #fff 100%);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F2F6FC;
  background: linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%);
}

.card-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.rule-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.rule-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.card-status-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.status-tag {
  min-width: 72px;
  text-align: center;
}

.card-body {
  padding: 16px 20px;
}

.card-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.6;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-label {
  color: #8492A6;
  flex-shrink: 0;
  width: 84px;
}

.desc-text {
  color: #4A5568;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-desc {
  min-height: 42px;
}

.time-range {
  color: #4A5568;
}

.level-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.scheduled-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  color: #E6A23C;
  font-size: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #F2F6FC;
  background: #FAFBFC;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8492A6;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.code-text {
  font-family: monospace;
  font-size: 12px;
  color: #409EFF;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.rule-detail {
  :deep(.el-descriptions__label) {
    width: 120px;
  }
}

.params-section,
.remark-section {
  margin-top: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.remark-content {
  padding: 12px 16px;
  background: #F5F7FA;
  border-radius: 4px;
  color: #4A5568;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.mr-4 {
  margin-right: 8px;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .rule-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
