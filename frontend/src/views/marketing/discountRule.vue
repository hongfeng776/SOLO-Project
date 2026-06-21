<template>
  <div ref="pageContainerRef" class="discount-rule-page page-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="选择活动">
          <el-select
            v-model="filterForm.marketingId"
            placeholder="请选择活动"
            style="width: 260px"
            clearable
            @change="handleMarketingChange"
          >
            <el-option
              v-for="item in marketingList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <ProTable
      ref="proTableRef"
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchList"
      :stripe="true"
      :highlight-current-row="true"
      :show-batch-delete="false"
      :actions-width="260"
      @add="handleAdd"
    >
      <template #toolbar-left>
        <el-button type="primary" @click="handleAdd" :disabled="!filterForm.marketingId">
          <el-icon><Plus /></el-icon>新建优惠规则
        </el-button>
        <el-button
          type="warning"
          @click="handleBatchAdjustThreshold"
          :disabled="!filterForm.marketingId"
        >
          <el-icon><Money /></el-icon>批量调整阈值
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchClearQuota"
          :disabled="!filterForm.marketingId"
        >
          <el-icon><RefreshLeft /></el-icon>批量清零过期配额
        </el-button>
      </template>

      <template #batch-actions="{ rows }">
        <el-button link type="success" @click="handleBatchEnable(rows)" :disabled="!canBatchEnable(rows)">
          <el-icon><VideoPlay /></el-icon>批量启用
        </el-button>
        <el-button link type="warning" @click="handleBatchDisable(rows)" :disabled="!canBatchDisable(rows)">
          <el-icon><VideoPause /></el-icon>批量禁用
        </el-button>
      </template>

      <template #ruleName="{ row }">
        <div class="rule-name-cell">
          <span class="rule-name">{{ row.ruleName }}</span>
          <el-tag v-if="row.budgetUsed && row.budgetTotal && row.budgetUsed / row.budgetTotal >= 0.9" size="small" type="danger" class="ml-8">
            预算预警
          </el-tag>
        </div>
      </template>

      <template #discountType="{ row }">
        <el-tag :type="DiscountTypeMap[row.discountType]?.type">
          {{ DiscountTypeMap[row.discountType]?.label }}
        </el-tag>
      </template>

      <template #discountValue="{ row }">
        <template v-if="row.discountType === DiscountType.FULL_REDUCTION">
          满 ¥{{ row.minAmount?.toFixed(2) || '0.00' }} 减 ¥{{ row.discountValue?.toFixed(2) || '0.00' }}
        </template>
        <template v-else-if="row.discountType === DiscountType.DISCOUNT">
          {{ row.discountValue ? (row.discountValue * 10).toFixed(1) : '-' }}折
        </template>
        <template v-else-if="row.discountType === DiscountType.COUPON">
          满 ¥{{ row.minAmount?.toFixed(2) || '0.00' }} 可用 ¥{{ row.discountValue?.toFixed(2) || '0.00' }}券
        </template>
      </template>

      <template #stackable="{ row }">
        <span v-if="row.stackable === 1" class="text-success">可叠加（最多{{ row.stackLimit }}张）</span>
        <span v-else class="text-grey">不可叠加</span>
      </template>

      <template #effectiveStatus="{ row }">
        <el-tag :type="DiscountEffectiveStatusMap[row.effectiveStatus ?? 0]?.type">
          {{ DiscountEffectiveStatusMap[row.effectiveStatus ?? 0]?.label }}
        </el-tag>
      </template>

      <template #budgetUsed="{ row }">
        <div class="budget-cell">
          <el-progress
            :percentage="getBudgetPercent(row)"
            :status="getBudgetStatus(row)"
            :stroke-width="6"
          />
          <span class="budget-text">¥{{ row.budgetUsed?.toFixed(2) || '0.00' }}/¥{{ row.budgetTotal?.toFixed(2) || '0.00' }}</span>
        </div>
      </template>

      <template #quotaUsed="{ row }">
        <div class="quota-cell">
          <span>{{ row.quotaUsed ?? 0 }}</span>
          <span class="text-grey"> / {{ row.quotaTotal ?? 0 }}</span>
        </div>
      </template>

      <template #validTime="{ row }">
        <div class="valid-time">
          <div>{{ formatDateTime(row.startTime) }}</div>
          <div class="text-grey">至</div>
          <div>{{ formatDateTime(row.endTime) }}</div>
        </div>
      </template>

      <template #actions="{ row }">
        <el-button link type="primary" @click="handleTrace(row)">溯源</el-button>
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button
          v-if="row.effectiveStatus !== DiscountEffectiveStatus.ACTIVE"
          link
          type="success"
          @click="handleEnable(row)"
        >启用</el-button>
        <el-button
          v-if="row.effectiveStatus === DiscountEffectiveStatus.ACTIVE"
          link
          type="warning"
          @click="handleDisable(row)"
        >禁用</el-button>
      </template>
    </ProTable>

    <DiscountRuleFormDialog
      v-model="formDialogVisible"
      :marketing-id="filterForm.marketingId || 0"
      :rule-id="currentRuleId"
      @success="handleFormSuccess"
    />

    <DiscountRuleTraceDialog
      v-model="traceDialogVisible"
      :rule-id="currentRuleId"
    />

    <el-dialog v-model="adjustDialogVisible" title="批量调整优惠阈值" width="480px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="调整字段" required>
          <el-select v-model="adjustForm.field" placeholder="请选择调整字段">
            <el-option label="使用门槛金额" value="minAmount" />
            <el-option label="优惠值" value="discountValue" />
            <el-option label="预算总额" value="budgetTotal" />
            <el-option label="优惠总额度" value="quotaTotal" />
            <el-option label="每用户使用上限" value="quotaPerUser" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整值" required>
          <el-input-number v-model="adjustForm.value" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdjust">确定调整</el-button>
      </template>
    </el-dialog>

    <el-backtop v-if="showBackTop" :target="() => pageContainerRef" :visibility-height="500" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  VideoPlay,
  VideoPause,
  Money,
  RefreshLeft
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import DiscountRuleFormDialog from './components/DiscountRuleFormDialog.vue'
import DiscountRuleTraceDialog from './components/DiscountRuleTraceDialog.vue'
import {
  DiscountType,
  DiscountTypeMap,
  DiscountEffectiveStatus,
  DiscountEffectiveStatusMap
} from '@/types/business'
import type { MarketingDiscountRule } from '@/types/business'
import {
  getDiscountRuleList,
  enableDiscountRule,
  disableDiscountRule,
  batchEnableDiscountRules,
  batchDisableDiscountRules,
  batchAdjustDiscountThreshold,
  batchClearExpiredDiscountQuota,
  getMarketingList,
  type DiscountRuleQueryParams
} from '@/api/marketing'
import type { PageResult } from '@/types/api'
import { formatDateTime } from '@/utils/date'

const pageContainerRef = ref<HTMLElement | null>(null)
const showBackTop = ref(false)
const proTableRef = ref<InstanceType<typeof ProTable>>()
const formDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const currentRuleId = ref<number>(0)
const marketingList = ref<any[]>([])

const filterForm = reactive({
  marketingId: 0
})

const adjustForm = reactive({
  field: 'minAmount',
  value: 0
})

const searchColumns = [
  { prop: 'keyword', label: '规则名称', type: 'input' as const },
  { prop: 'discountType', label: '优惠类型', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '满减', value: 1 },
    { label: '折扣', value: 2 },
    { label: '优惠券', value: 3 }
  ]},
  { prop: 'effectiveStatus', label: '生效状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '未生效', value: 0 },
    { label: '生效中', value: 1 },
    { label: '已失效', value: 2 },
    { label: '已禁用', value: 3 }
  ]},
  { prop: 'minAmountMin', label: '最小门槛', type: 'number' as const, min: 0, precision: 2 },
  { prop: 'minAmountMax', label: '最大门槛', type: 'number' as const, min: 0, precision: 2 }
] as const

const tableColumns = [
  { prop: 'ruleName', label: '规则名称', minWidth: 180, slot: 'ruleName' },
  { prop: 'discountType', label: '优惠类型', width: 100, align: 'center', slot: 'discountType' },
  { prop: 'discountValue', label: '优惠内容', minWidth: 220, slot: 'discountValue' },
  { prop: 'stackable', label: '叠加规则', width: 140, align: 'center', slot: 'stackable' },
  { prop: 'effectiveStatus', label: '生效状态', width: 100, align: 'center', slot: 'effectiveStatus' },
  { prop: 'budgetUsed', label: '预算使用', width: 180, slot: 'budgetUsed' },
  { prop: 'quotaUsed', label: '配额使用', width: 120, align: 'center', slot: 'quotaUsed' },
  { prop: 'validTime', label: '有效时间', width: 180, align: 'center', slot: 'validTime' }
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<MarketingDiscountRule>> => {
  if (!filterForm.marketingId) {
    return { list: [], total: 0, pageNum: 1, pageSize: 20 }
  }

  const queryParams = {
    ...params,
    marketingId: filterForm.marketingId
  } as DiscountRuleQueryParams

  const res = await getDiscountRuleList(queryParams)
  return res.data
}

const loadMarketingList = async () => {
  const res = await getMarketingList({ pageNum: 1, pageSize: 100 })
  marketingList.value = res.data.list
  if (res.data.list.length > 0 && !filterForm.marketingId) {
    filterForm.marketingId = res.data.list[0].id
  }
}

const handleMarketingChange = () => {
  proTableRef.value?.fetchData()
}

const handleAdd = () => {
  if (!filterForm.marketingId) {
    ElMessage.warning('请先选择活动')
    return
  }
  currentRuleId.value = 0
  formDialogVisible.value = true
}

const handleEdit = (row: Record<string, unknown>) => {
  currentRuleId.value = row.id as number
  formDialogVisible.value = true
}

const handleTrace = (row: Record<string, unknown>) => {
  currentRuleId.value = row.id as number
  traceDialogVisible.value = true
}

const handleFormSuccess = () => {
  proTableRef.value?.fetchData()
}

const handleEnable = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要启用该优惠规则吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await enableDiscountRule(row.id as number)
    ElMessage.success('启用成功')
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleDisable = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要禁用该优惠规则吗？禁用后将不再生效。', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await disableDiscountRule(row.id as number)
    ElMessage.success('禁用成功')
    proTableRef.value?.fetchData()
  } catch {
  }
}

const canBatchEnable = (rows: Record<string, unknown>[]) => {
  return rows.some(r => r.effectiveStatus !== DiscountEffectiveStatus.ACTIVE)
}

const canBatchDisable = (rows: Record<string, unknown>[]) => {
  return rows.some(r => r.effectiveStatus === DiscountEffectiveStatus.ACTIVE)
}

const handleBatchEnable = async (rows: Record<string, unknown>[]) => {
  const ids = rows.filter(r => r.effectiveStatus !== DiscountEffectiveStatus.ACTIVE).map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择可启用的规则')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要批量启用选中的 ${ids.length} 个优惠规则吗？`, '二次确认', {
      type: 'warning',
      confirmButtonText: '确定启用',
      cancelButtonText: '取消'
    })
    const res = await batchEnableDiscountRules(ids)
    ElMessage.success(`批量启用：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchDisable = async (rows: Record<string, unknown>[]) => {
  const ids = rows.filter(r => r.effectiveStatus === DiscountEffectiveStatus.ACTIVE).map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择生效中的规则')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要批量禁用选中的 ${ids.length} 个优惠规则吗？禁用后将不再生效。`, '二次确认', {
      type: 'warning',
      confirmButtonText: '确定禁用',
      cancelButtonText: '取消'
    })
    const res = await batchDisableDiscountRules(ids)
    ElMessage.success(`批量禁用：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchAdjustThreshold = () => {
  if (!filterForm.marketingId) {
    ElMessage.warning('请先选择活动')
    return
  }
  adjustForm.field = 'minAmount'
  adjustForm.value = 0
  adjustDialogVisible.value = true
}

const confirmAdjust = async () => {
  if (!adjustForm.field || adjustForm.value === undefined) {
    ElMessage.warning('请设置调整字段和值')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将当前活动下所有规则的「${adjustForm.field}」批量调整为 ${adjustForm.value} 吗？此操作会覆盖原配置。`,
      '二次确认',
      {
        type: 'warning',
        confirmButtonText: '确定调整',
        cancelButtonText: '取消'
      }
    )

    const ids = proTableRef.value?.getSelectedRows?.().map((r: any) => r.id as number) || []
    if (ids.length === 0) {
      ElMessage.warning('请先在表格中勾选要调整的规则')
      return
    }

    const res = await batchAdjustDiscountThreshold(ids, adjustForm.field, adjustForm.value)
    ElMessage.success(`批量调整：${res.data.success}个成功，${res.data.failed}个失败`)
    adjustDialogVisible.value = false
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchClearQuota = async () => {
  if (!filterForm.marketingId) {
    ElMessage.warning('请先选择活动')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定要批量清零当前活动下已过期优惠规则的剩余配额吗？该操作不会影响已产生的订单。',
      '二次确认',
      {
        type: 'warning',
        confirmButtonText: '确定清零',
        cancelButtonText: '取消'
      }
    )
    const res = await batchClearExpiredDiscountQuota(filterForm.marketingId)
    ElMessage.success(`批量清零：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.fetchData()
  } catch {
  }
}

const getBudgetPercent = (row: Record<string, unknown>) => {
  const total = row.budgetTotal as number || 0
  const used = row.budgetUsed as number || 0
  if (total <= 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

const getBudgetStatus = (row: Record<string, unknown>): '' | 'success' | 'warning' | 'exception' => {
  const percent = getBudgetPercent(row)
  if (percent >= 90) return 'exception'
  if (percent >= 70) return 'warning'
  return 'success'
}

const handleScroll = () => {
  if (pageContainerRef.value) {
    showBackTop.value = pageContainerRef.value.scrollTop > 500
  }
}

onMounted(() => {
  loadMarketingList()
  pageContainerRef.value?.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  pageContainerRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
.discount-rule-page {
  height: 100%;
  overflow-y: auto;
}

.filter-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 4px;
}

.rule-name-cell {
  display: flex;
  align-items: center;

  .rule-name {
    font-weight: 500;
  }

  .ml-8 {
    margin-left: 8px;
  }
}

.budget-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .budget-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.quota-cell {
  font-size: 14px;

  .text-grey {
    color: var(--el-text-color-secondary);
  }
}

.valid-time {
  font-size: 12px;
  line-height: 1.6;
  text-align: center;

  .text-grey {
    color: var(--el-text-color-secondary);
  }
}

.text-success {
  color: var(--el-color-success);
}

.text-grey {
  color: var(--el-text-color-secondary);
}
</style>
