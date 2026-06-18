<template>
  <div class="order-list">
    <div class="summary-bar">
      <div class="item">
        <span class="label">订单总数</span>
        <span class="value">{{ items.length }}单</span>
      </div>
      <div class="item">
        <span class="label">异常订单</span>
        <span class="value danger">{{ abnormalCount }}单</span>
      </div>
      <div class="item">
        <span class="label">平均收益</span>
        <span class="value accent">¥{{ avgIncome }}</span>
      </div>
    </div>

    <el-table :data="items" stripe border size="small">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="订单号" prop="orderNo" min-width="180">
        <template #default="{ row }">
          <div class="order-no-cell">
            <el-icon><Tickets /></el-icon>
            <span>{{ row.orderNo }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          {{ OrderTypeMap[row.orderType] || '--' }}
        </template>
      </el-table-column>
      <el-table-column label="来源" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" effect="light">
            {{ OrderSourceMap[row.orderSource] || '--' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" min-width="160" prop="orderStartTime" />
      <el-table-column label="订单特征" width="220">
        <template #default="{ row }">
          <div class="tags-cell">
            <el-tag
              v-if="row.isPeakHour"
              type="warning"
              size="small"
              effect="dark"
              class="peak-tag"
            >
              <el-icon><Sunrise /></el-icon>
              高峰
            </el-tag>
            <el-tag v-if="row.isHoliday" type="danger" size="small" effect="light">
              <el-icon><Calendar /></el-icon>
              节假日
            </el-tag>
            <el-tag v-if="row.isWeekend" type="success" size="small" effect="light">
              <el-icon><Sunny /></el-icon>
              周末
            </el-tag>
            <el-tag v-if="row.isPremium" type="info" size="small" effect="light">
              <el-icon><Top /></el-icon>
              溢价
            </el-tag>
            <span v-if="!row.isPeakHour && !row.isHoliday && !row.isWeekend && !row.isPremium" class="no-tag">
              普通
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="星级" width="110" align="center">
        <template #default="{ row }">
          <el-rate :model-value="row.serviceRating" disabled size="small" />
        </template>
      </el-table-column>
      <el-table-column label="订单金额" width="100" align="right" prop="orderAmount">
        <template #default="{ row }">
          ¥{{ (row.orderAmount || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="收益" width="110" align="right">
        <template #default="{ row }">
          <span class="income-value">¥{{ (row.totalIncome || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="row.isAbnormal"
            type="danger"
            effect="dark"
            class="abnormal-tag pulse-tag"
          >
            {{ AbnormalTypeMap[row.abnormalType] || '异常' }}
          </el-tag>
          <el-tag v-else type="success" effect="light">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            link
            @click="$emit('viewCalc', row)"
          >
            <el-icon><View /></el-icon>
            核算
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tickets, Sunrise, Calendar, Sunny, Top, View } from '@element-plus/icons-vue'
import { OrderTypeMap, OrderSourceMap, AbnormalTypeMap } from '@/enums/driver'
import type { SettlementItem } from '@/types/driver'

const props = defineProps<{
  items: SettlementItem[]
}>()

defineEmits(['viewCalc'])

const abnormalCount = computed(() => props.items.filter(i => i.isAbnormal).length)
const avgIncome = computed(() => {
  if (!props.items.length) return '0.00'
  const sum = props.items.reduce((acc, i) => acc + (i.totalIncome || 0), 0)
  return (sum / props.items.length).toFixed(2)
})
</script>

<style scoped>
.summary-bar {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 12px;
}

.summary-bar .item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-bar .label {
  font-size: 12px;
  color: #64748b;
}

.summary-bar .value {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.summary-bar .value.danger {
  color: #dc2626;
}

.summary-bar .value.accent {
  color: #4f46e5;
}

.order-no-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0284c7;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.peak-tag {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.income-value {
  color: #059669;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.abnormal-tag.pulse-tag {
  animation: pulse-danger 2s infinite;
}

.no-tag {
  color: #94a3b8;
  font-size: 12px;
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}
</style>
