<template>
  <el-dialog
    v-model="dialogVisible"
    title="优惠规则溯源"
    width="960px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" v-loading="loading">
      <el-tab-pane label="基本信息" name="basic">
        <div v-if="traceData && traceData.basicInfo" class="info-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="规则名称">
              {{ traceData.basicInfo.ruleName }}
            </el-descriptions-item>
            <el-descriptions-item label="优惠类型">
              <el-tag :type="DiscountTypeMap[traceData.basicInfo.discountType]?.type">
                {{ DiscountTypeMap[traceData.basicInfo.discountType]?.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="使用门槛">
              ¥{{ traceData.basicInfo.minAmount?.toFixed(2) || '0.00' }}
            </el-descriptions-item>
            <el-descriptions-item label="优惠值">
              <template v-if="traceData.basicInfo.discountType === 2">
                {{ traceData.basicInfo.discountValue ? (traceData.basicInfo.discountValue * 10).toFixed(1) : '-' }}折
              </template>
              <template v-else>
                ¥{{ traceData.basicInfo.discountValue?.toFixed(2) || '0.00' }}
              </template>
            </el-descriptions-item>
            <el-descriptions-item label="叠加规则">
              <span v-if="traceData.basicInfo.stackable === 1">可叠加（最多{{ traceData.basicInfo.stackLimit }}张）</span>
              <span v-else>不可叠加</span>
            </el-descriptions-item>
            <el-descriptions-item label="生效状态">
              <el-tag :type="effectiveStatusMap[traceData.basicInfo.effectiveStatus ?? 0]?.type">
                {{ effectiveStatusMap[traceData.basicInfo.effectiveStatus ?? 0]?.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户等级范围">
              {{ traceData.basicInfo.userLevelMin }} - {{ traceData.basicInfo.userLevelMax }}
            </el-descriptions-item>
            <el-descriptions-item label="每人使用上限">
              {{ traceData.basicInfo.quotaPerUser }} 次
            </el-descriptions-item>
            <el-descriptions-item label="预算使用">
              <el-progress
                :percentage="traceData.usageStats?.budgetUsageRate || 0"
                :status="getBudgetStatus(traceData.usageStats?.budgetUsageRate)"
                :stroke-width="8"
              />
              <span class="text-grey">
                ¥{{ traceData.basicInfo.budgetUsed?.toFixed(2) || '0.00' }}
                /
                ¥{{ traceData.basicInfo.budgetTotal?.toFixed(2) || '0.00' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="配额使用">
              <el-progress
                :percentage="traceData.usageStats?.quotaUsageRate || 0"
                :status="getBudgetStatus(traceData.usageStats?.quotaUsageRate)"
                :stroke-width="8"
              />
              <span class="text-grey">
                {{ traceData.basicInfo.quotaUsed ?? 0 }} / {{ traceData.basicInfo.quotaTotal ?? 0 }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="生效时间">
              {{ formatDateTime(traceData.basicInfo.startTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="失效时间">
              {{ formatDateTime(traceData.basicInfo.endTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="总使用次数">
              <span class="text-primary">{{ traceData.usageStats?.totalUsed || 0 }} 次</span>
            </el-descriptions-item>
            <el-descriptions-item label="总优惠金额">
              <span class="text-danger">¥{{ (traceData.usageStats?.totalDiscountAmount || 0).toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="操作人">
              {{ traceData.basicInfo.operatorName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注">
              {{ traceData.basicInfo.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="规则匹配校验" name="match">
        <div v-if="traceData && traceData.ruleMatchDetails" class="rules-section">
          <el-alert
            v-if="traceData.usageStats && traceData.usageStats.budgetUsageRate >= 90"
            title="预算使用率超过90%，请注意预算预警"
            type="warning"
            show-icon
            :closable="false"
            class="mb-12"
          />
          <el-table :data="traceData.ruleMatchDetails" border stripe>
            <el-table-column prop="field" label="校验字段" width="160" />
            <el-table-column prop="ruleValue" label="规则阈值" width="160" align="center" />
            <el-table-column label="校验结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                  {{ row.passed ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="300" show-overflow-tooltip />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="配置日志" name="logs">
        <div class="logs-section">
          <el-table :data="traceData?.configLogs || []" border stripe>
            <el-table-column prop="operatorName" label="操作人" width="120" align="center" />
            <el-table-column prop="operationType" label="操作类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getOpType(row.operationType)">
                  {{ getOpLabel(row.operationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="说明" min-width="200" show-overflow-tooltip />
            <el-table-column prop="createdTime" label="操作时间" width="170" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="优惠使用记录" name="usage">
        <div class="usage-section">
          <el-table :data="traceData?.usageRecords || []" border stripe>
            <el-table-column prop="userName" label="用户" width="120" align="center" />
            <el-table-column prop="orderNo" label="订单号" width="180" />
            <el-table-column prop="originalAmount" label="订单金额" width="120" align="right">
              <template #default="{ row }">¥{{ row.originalAmount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="discountAmount" label="优惠金额" width="120" align="right">
              <template #default="{ row }">
                <span class="text-danger">-¥{{ row.discountAmount?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="finalAmount" label="实付金额" width="120" align="right">
              <template #default="{ row }">¥{{ row.finalAmount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="createdTime" label="使用时间" width="170" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="叠加冲突记录" name="conflicts">
        <div class="conflicts-section">
          <el-alert
            v-if="!traceData?.stackConflicts || traceData.stackConflicts.length === 0"
            title="暂无叠加冲突记录"
            type="success"
            show-icon
            :closable="false"
          />
          <el-table
            v-else
            :data="traceData.stackConflicts"
            border
            stripe
          >
            <el-table-column prop="conflictType" label="冲突类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="conflictTypeMap[row.conflictType]?.type" size="small">
                  {{ conflictTypeMap[row.conflictType]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="冲突规则ID" width="160" align="center">
              <template #default="{ row }">
                #{{ row.ruleIdA }} ↔ #{{ row.ruleIdB }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="冲突说明" min-width="280" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.resolved === 1 ? 'success' : 'warning'" size="small">
                  {{ row.resolved === 1 ? '已处理' : '待处理' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdTime" label="发生时间" width="170" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="预算消耗台账" name="budget">
        <div class="budget-section">
          <el-table :data="traceData?.budgetLedger || []" border stripe>
            <el-table-column prop="ledgerType" label="台账类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="ledgerTypeMap[row.ledgerType]?.type" size="small">
                  {{ ledgerTypeMap[row.ledgerType]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变动金额" width="130" align="right">
              <template #default="{ row }">
                <span :class="row.amount >= 0 ? 'text-success' : 'text-danger'">
                  {{ row.amount >= 0 ? '+' : '' }}¥{{ row.amount?.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="变动前余额" width="130" align="right">
              <template #default="{ row }">¥{{ row.beforeAmount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="变动后余额" width="130" align="right">
              <template #default="{ row }">¥{{ row.afterAmount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="orderNo" label="关联订单" width="160" show-overflow-tooltip />
            <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column prop="createdTime" label="发生时间" width="170" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getDiscountRuleTrace } from '@/api/marketing'
import {
  DiscountTypeMap,
  DiscountEffectiveStatusMap,
  BudgetLedgerTypeMap,
  StackConflictTypeMap
} from '@/types/business'
import type { DiscountRuleTraceData } from '@/types/business'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  ruleId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

import { computed } from 'vue'

const loading = ref(false)
const activeTab = ref('basic')
const traceData = ref<DiscountRuleTraceData | null>(null)

const discountTypeMap = DiscountTypeMap
const effectiveStatusMap = DiscountEffectiveStatusMap
const ledgerTypeMap = BudgetLedgerTypeMap
const conflictTypeMap = StackConflictTypeMap

const loadData = async () => {
  if (!props.ruleId) return
  loading.value = true
  try {
    const res = await getDiscountRuleTrace(props.ruleId)
    traceData.value = res.data
  } finally {
    loading.value = false
  }
}

const getBudgetStatus = (rate?: number): '' | 'success' | 'warning' | 'exception' => {
  if (!rate) return ''
  if (rate >= 90) return 'exception'
  if (rate >= 70) return 'warning'
  return 'success'
}

const getOpLabel = (t?: number) => {
  const m: Record<number, string> = { 1: '创建', 2: '修改', 3: '启用', 4: '禁用', 5: '调整阈值' }
  return m[t ?? 0] || '未知'
}

const getOpType = (t?: number) => {
  const m: Record<number, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
    1: 'success',
    2: 'primary',
    3: 'success',
    4: 'warning',
    5: 'warning'
  }
  return m[t ?? 0] || 'info'
}

watch(() => [props.modelValue, props.ruleId], ([v]) => {
  if (v) {
    activeTab.value = 'basic'
    loadData()
  }
})
</script>

<style lang="scss" scoped>
.info-section,
.rules-section,
.logs-section,
.usage-section,
.conflicts-section,
.budget-section {
  padding: 8px 0;
}

.mb-12 {
  margin-bottom: 12px;
}

.text-grey {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.text-primary {
  color: var(--el-color-primary);
  font-weight: 600;
}

.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}
</style>
