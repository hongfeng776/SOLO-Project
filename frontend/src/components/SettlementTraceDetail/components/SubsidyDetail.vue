<template>
  <div class="subsidy-detail">
    <div class="summary-cards">
      <div class="card hour">
        <div class="icon"><el-icon><Sunrise /></el-icon></div>
        <div class="info">
          <div class="label">时段补贴</div>
          <div class="value">¥{{ (record?.hourSubsidy || 0).toFixed(2) }}</div>
        </div>
      </div>
      <div class="card rating">
        <div class="icon"><el-icon><Medal /></el-icon></div>
        <div class="info">
          <div class="label">星级补贴</div>
          <div class="value">¥{{ (record?.ratingSubsidy || 0).toFixed(2) }}</div>
        </div>
      </div>
      <div class="card holiday">
        <div class="icon"><el-icon><Calendar /></el-icon></div>
        <div class="info">
          <div class="label">节假日补贴</div>
          <div class="value">¥{{ (record?.holidaySubsidy || 0).toFixed(2) }}</div>
        </div>
      </div>
      <div class="card excellent">
        <div class="icon"><el-icon><Crown /></el-icon></div>
        <div class="info">
          <div class="label">优质专属补贴</div>
          <div class="value">¥{{ (record?.excellentSubsidy || 0).toFixed(2) }}</div>
        </div>
      </div>
      <div class="card new">
        <div class="icon"><el-icon><UserFilled /></el-icon></div>
        <div class="info">
          <div class="label">新人补贴</div>
          <div class="value">¥{{ (record?.newDriverSubsidy || 0).toFixed(2) }}</div>
        </div>
      </div>
      <div class="card total">
        <div class="icon"><el-icon><Wallet /></el-icon></div>
        <div class="info">
          <div class="label">补贴合计</div>
          <div class="value">¥{{ (record?.totalSubsidy || totalSubsidy).toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">
        <el-icon><Histogram /></el-icon>
        订单级补贴明细
      </div>
      <el-table :data="items" border stripe size="small" max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单号" prop="orderNo" min-width="160">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单特征" width="180">
          <template #default="{ row }">
            <div class="feature-tags">
              <el-tag v-if="row.isPeakHour" type="warning" size="small">高峰</el-tag>
              <el-tag v-if="row.isHoliday" type="danger" size="small">节假日</el-tag>
              <el-tag v-if="row.isWeekend" type="success" size="small">周末</el-tag>
              <el-tag v-if="row.isPremium" type="info" size="small">溢价</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务星级" width="100" align="center">
          <template #default="{ row }">
            <el-rate :model-value="row.serviceRating" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column label="时段补贴" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ highlight: row.hourSubsidy > 0 }">
              +¥{{ (row.hourSubsidy || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="星级补贴" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ highlight: row.ratingSubsidy > 0 }">
              +¥{{ (row.ratingSubsidy || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="节假日补贴" width="110" align="right">
          <template #default="{ row }">
            <span :class="{ highlight: row.holidaySubsidy > 0 }">
              +¥{{ (row.holidaySubsidy || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="溢价分成" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ highlight: row.premiumIncome > 0 }">
              +¥{{ (row.premiumIncome || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="扣款" width="90" align="right">
          <template #default="{ row }">
            <span class="penalty" v-if="row.penaltyAmount > 0">
              -¥{{ (row.penaltyAmount || 0).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="订单总收益" width="120" align="right">
          <template #default="{ row }">
            <span class="total-income">¥{{ (row.totalIncome || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sunrise, Medal, Calendar, Crown, UserFilled, Wallet, Histogram } from '@element-plus/icons-vue'
import type { SettlementItem, SettlementRecord } from '@/types/driver'

const props = defineProps<{
  items: SettlementItem[]
  record: SettlementRecord | undefined
}>()

const totalSubsidy = computed(() => {
  return props.items.reduce((acc, i) => {
    return acc + (i.hourSubsidy || 0) + (i.ratingSubsidy || 0) + (i.holidaySubsidy || 0)
  }, 0)
})
</script>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.card {
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}

.card.hour {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.card.rating {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
}

.card.holiday {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.card.excellent {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
}

.card.new {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.card.total {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.card .icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.card .info .label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.card .info .value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
}

.order-no {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #0284c7;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.highlight {
  color: #059669;
  font-weight: 600;
}

.penalty {
  color: #dc2626;
  font-weight: 600;
}

.total-income {
  color: #4f46e5;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}
</style>
