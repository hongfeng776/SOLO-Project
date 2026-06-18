<template>
  <div class="basic-info">
    <div class="info-card">
      <div class="card-header">
        <el-icon><Van /></el-icon>
        <span>司机信息</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">姓名</span>
          <span class="value">{{ record?.driver?.name || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="label">手机号</span>
          <span class="value">{{ record?.driver?.phone || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务城市</span>
          <span class="value">{{ record?.driver?.city || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="label">车型</span>
          <span class="value">{{ record?.driver?.vehicleType || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="label">司机等级</span>
          <el-tag v-if="record?.driver?.driverLevel" :type="DriverLevelTagMap[record.driver.driverLevel]">
            {{ DriverLevelMap[record.driver.driverLevel] }}
          </el-tag>
          <span v-else>--</span>
        </div>
      </div>
    </div>

    <div class="info-card">
      <div class="card-header">
        <el-icon><Document /></el-icon>
        <span>结算信息</span>
        <el-tag
          v-if="record"
          :type="SettlementStatusTypeMap[record.settleStatus]"
          effect="light"
          class="ml-8"
        >
          {{ SettlementStatusMap[record.settleStatus] }}
        </el-tag>
        <el-tag
          v-if="record?.isPosted"
          type="success"
          effect="dark"
          size="small"
          class="ml-8"
        >
          <el-icon><Lock /></el-icon>
          已入账 不可修改
        </el-tag>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">结算单号</span>
          <span class="value accent">{{ record?.settlementNo || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="label">结算周期</span>
          <span class="value">{{ record?.periodStart?.slice(0, 10) || '--' }} ~ {{ record?.periodEnd?.slice(0, 10) || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="label">订单数</span>
          <span class="value">{{ record?.totalOrders || 0 }}单</span>
        </div>
        <div class="info-item">
          <span class="label">订单总额</span>
          <span class="value">¥{{ (record?.totalOrderAmount || 0).toFixed(2) }}</span>
        </div>
        <div class="info-item">
          <span class="label">凭证号</span>
          <span class="value" :class="{ highlight: record?.voucherNo }">
            {{ record?.voucherNo || '未生成' }}
          </span>
        </div>
      </div>
    </div>

    <div class="info-card">
      <div class="card-header">
        <el-icon><Wallet /></el-icon>
        <span>金额汇总</span>
      </div>
      <div class="amount-grid">
        <div class="amount-item">
          <div class="label">基础分成</div>
          <div class="value">¥{{ (record?.baseIncome || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">时段补贴</div>
          <div class="value plus">+¥{{ (record?.hourSubsidy || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">星级补贴</div>
          <div class="value plus">+¥{{ (record?.ratingSubsidy || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">节假日补贴</div>
          <div class="value plus">+¥{{ (record?.holidaySubsidy || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">优质专属</div>
          <div class="value plus excellent">+¥{{ (record?.excellentSubsidy || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">新人补贴</div>
          <div class="value plus">+¥{{ (record?.newDriverSubsidy || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">扣款</div>
          <div class="value minus">-¥{{ (record?.penaltyAmount || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">司机收益</div>
          <div class="value total">¥{{ (record?.totalIncome || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item">
          <div class="label">平台佣金</div>
          <div class="value platform">¥{{ (record?.platformCommission || 0).toFixed(2) }}</div>
        </div>
        <div class="amount-item main">
          <div class="label">实际结算</div>
          <div class="value final">¥{{ (record?.actualSettleAmount || 0).toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Van, Document, Lock, Wallet } from '@element-plus/icons-vue'
import {
  DriverLevelMap,
  DriverLevelTagMap,
  SettlementStatusMap,
  SettlementStatusTypeMap
} from '@/enums/driver'
import type { SettlementRecord } from '@/types/driver'

defineProps<{
  record: SettlementRecord | undefined
}>()
</script>

<style scoped>
.basic-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 20px;
  padding: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.info-item .label {
  font-size: 13px;
  color: #64748b;
}

.info-item .value {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.info-item .value.accent {
  color: #4f46e5;
  font-family: 'Courier New', monospace;
}

.info-item .value.highlight {
  color: #d97706;
  font-weight: 600;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 16px;
}

.amount-item {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.amount-item.main {
  grid-column: span 2;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.amount-item .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.amount-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  font-family: 'Courier New', monospace;
}

.amount-item .value.plus {
  color: #059669;
}

.amount-item .value.excellent {
  color: #0891b2;
}

.amount-item .value.minus {
  color: #dc2626;
}

.amount-item .value.total {
  color: #0284c7;
  font-size: 18px;
}

.amount-item .value.platform {
  color: #6366f1;
}

.amount-item .value.final {
  color: #d97706;
  font-size: 24px;
}

.ml-8 {
  margin-left: 8px;
}
</style>
