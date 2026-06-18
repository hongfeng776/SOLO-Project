<template>
  <div class="applied-rules">
    <div class="rules-summary">
      <div class="item">
        <span class="label">应用规则总数</span>
        <span class="value primary">{{ uniqueRuleCount }}条</span>
      </div>
      <div class="item">
        <span class="label">基础分成规则</span>
        <span class="value">{{ countByType(1) }}条</span>
      </div>
      <div class="item">
        <span class="label">补贴规则</span>
        <span class="value success">{{ countByType(2) + countByType(3) + countByType(4) + countByType(6) + countByType(7) }}条</span>
      </div>
      <div class="item">
        <span class="label">互斥规则</span>
        <span class="value warning">0条</span>
      </div>
    </div>

    <el-collapse v-model="activeNames" accordion>
      <el-collapse-item
        v-for="group in ruleGroups"
        :key="group.type"
        :name="group.type"
      >
        <template #title>
          <div class="collapse-title">
            <el-icon><List /></el-icon>
            <span>{{ group.typeLabel }}</span>
            <el-tag size="small" type="info" effect="light">{{ group.items.length }}条</el-tag>
          </div>
        </template>
        <el-table :data="group.items" size="small" border stripe>
          <el-table-column label="订单号" prop="orderNo" min-width="180">
            <template #default="{ row }">
              <span class="order-no">{{ row.orderNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="应用规则" min-width="380">
            <template #default="{ row }">
              <div class="rule-tags">
                <el-tag
                  v-for="ruleId in row.appliedRules"
                  :key="ruleId"
                  :color="getRuleColor(ruleId)"
                  size="small"
                  effect="dark"
                  class="mr-4"
                >
                  {{ row.appliedRuleNames?.[(row.appliedRules || []).indexOf(ruleId)] || `规则#${ruleId}` }}
                </el-tag>
                <span v-if="!row.appliedRules?.length" class="no-rule">
                  未应用特殊规则
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分成比例" width="100" align="center">
            <template #default="{ row }">
              <span class="rate">{{ row.commissionRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="规则详情" min-width="220">
            <template #default="{ row }">
              <div class="calc-detail">
                <div
                  v-for="(step, idx) in row.calculationDetail || []"
                  :key="idx"
                  class="calc-line"
                >
                  <span class="line-name">{{ step.name }}:</span>
                  <span class="line-formula">{{ step.formula }}</span>
                  <span
                    class="line-amount"
                    :class="{ positive: step.amount >= 0, negative: step.amount < 0 }"
                  >
                    {{ step.amount >= 0 ? '+' : '' }}¥{{ step.amount.toFixed(2) }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="规则匹配" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.matchCheckResult?.ruleMatch" type="success" size="small">
                匹配
              </el-tag>
              <el-tag v-else type="warning" size="small">默认规则</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { List } from '@element-plus/icons-vue'
import { SettlementRuleTypeMap, SettlementRuleTypeColorMap } from '@/enums/driver'
import type { SettlementItem } from '@/types/driver'

const props = defineProps<{
  items: SettlementItem[]
}>()

const activeNames = ref([1])

const uniqueRuleCount = computed(() => {
  const set = new Set<number>()
  props.items.forEach(item => {
    item.appliedRules?.forEach(id => set.add(id))
  })
  return set.size
})

const ruleGroups = computed(() => {
  return [
    {
      type: 1,
      typeLabel: '基础分成规则',
      items: props.items.filter(i => i.appliedRules?.length)
    },
    {
      type: 2,
      typeLabel: '补贴/溢价规则',
      items: props.items.filter(i => {
        return (i.hourSubsidy || 0) + (i.ratingSubsidy || 0) + (i.holidaySubsidy || 0) + (i.premiumIncome || 0) > 0
      })
    }
  ]
})

const countByType = (type: number) => {
  return props.items.filter(i => i.appliedRules?.some(() => type === type)).length
}

const getRuleColor = (ruleId: number) => {
  const types = Object.keys(SettlementRuleTypeColorMap).map(Number)
  return SettlementRuleTypeColorMap[types[ruleId % types.length]] || '#60a5fa'
}
</script>

<style scoped>
.rules-summary {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  margin-bottom: 16px;
}

.rules-summary .item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rules-summary .label {
  font-size: 12px;
  color: #64748b;
}

.rules-summary .value {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.rules-summary .value.primary {
  color: #4f46e5;
}

.rules-summary .value.success {
  color: #059669;
}

.rules-summary .value.warning {
  color: #d97706;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.order-no {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #0284c7;
}

.rule-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rate {
  color: #4f46e5;
  font-weight: 600;
}

.calc-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calc-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
}

.line-name {
  color: #475569;
  min-width: 60px;
}

.line-formula {
  color: #94a3b8;
  flex: 1;
}

.line-amount.positive {
  color: #059669;
  font-weight: 600;
}

.line-amount.negative {
  color: #dc2626;
  font-weight: 600;
}

.no-rule {
  color: #94a3b8;
  font-size: 12px;
}

.mr-4 {
  margin-right: 4px;
}
</style>
