<template>
  <div class="abnormal-check">
    <div class="stats-bar">
      <div class="stat-card overall" :class="{ ok: !hasAbnormal }">
        <div class="icon">
          <el-icon><ShieldCheck v-if="!hasAbnormal" /><WarningFilled v-else /></el-icon>
        </div>
        <div class="info">
          <div class="label">整体检测结果</div>
          <div class="value">
            {{ hasAbnormal ? '存在异常' : '全部正常' }}
          </div>
        </div>
      </div>
      <div class="stat-card danger" v-for="stat in abnormalStats" :key="stat.type">
        <div class="mini-icon">{{ stat.icon }}</div>
        <div class="info">
          <div class="label">{{ stat.label }}</div>
          <div class="value">{{ stat.count }}笔</div>
        </div>
      </div>
    </div>

    <div v-if="hasAbnormal" class="abnormal-section">
      <div class="section-title">
        <el-icon><Warning /></el-icon>
        异常订单详情
        <el-tag type="danger" effect="dark" size="small" class="pulse-tag">
          {{ abnormalItems.length }}笔异常
        </el-tag>
      </div>

      <el-table :data="abnormalItems" border stripe size="small">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单号" prop="orderNo" min-width="160">
          <template #default="{ row }">
            <div class="abnormal-order-no">
              <el-icon><Tickets /></el-icon>
              <span>{{ row.orderNo }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常类型" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="danger" effect="dark" size="small" class="pulse-tag">
              {{ AbnormalTypeMap[row.abnormalType || ''] || '未知异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="异常原因" min-width="240" prop="abnormalReason" />
        <el-table-column label="订单金额" width="100" align="right" prop="orderAmount">
          <template #default="{ row }">¥{{ row.orderAmount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="核算收益" width="110" align="right">
          <template #default="{ row }">
            <span class="amount-danger">¥{{ row.totalIncome?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="多维校验" min-width="320">
          <template #default="{ row }">
            <div class="check-grid">
              <div class="check-item" :class="{ ok: row.matchCheckResult?.orderMatch, fail: !row.matchCheckResult?.orderMatch }">
                <el-icon><CircleCheckFilled v-if="row.matchCheckResult?.orderMatch" /><CircleCloseFilled v-else /></el-icon>
                订单匹配
              </div>
              <div class="check-item" :class="{ ok: row.matchCheckResult?.ruleMatch, fail: !row.matchCheckResult?.ruleMatch }">
                <el-icon><CircleCheckFilled v-if="row.matchCheckResult?.ruleMatch" /><CircleCloseFilled v-else /></el-icon>
                规则匹配
              </div>
              <div class="check-item" :class="{ ok: row.matchCheckResult?.amountMatch, fail: !row.matchCheckResult?.amountMatch }">
                <el-icon><CircleCheckFilled v-if="row.matchCheckResult?.amountMatch" /><CircleCloseFilled v-else /></el-icon>
                金额一致
              </div>
              <div class="check-item" :class="{ ok: row.matchCheckResult?.subsidyMatch, fail: !row.matchCheckResult?.subsidyMatch }">
                <el-icon><CircleCheckFilled v-if="row.matchCheckResult?.subsidyMatch" /><CircleCloseFilled v-else /></el-icon>
                补贴合规
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="normal-section">
      <div class="section-title">
        <el-icon><CircleCheckFilled /></el-icon>
        多维度校验说明
      </div>
      <div class="check-desc">
        <div class="desc-item">
          <div class="desc-head">
            <span class="dot ok"></span>
            <strong>订单匹配校验</strong>
          </div>
          <p>校验订单是否真实存在、订单状态是否为已完成、司机ID与订单归属一致</p>
        </div>
        <div class="desc-item">
          <div class="desc-head">
            <span class="dot ok"></span>
            <strong>规则匹配校验</strong>
          </div>
          <p>校验应用规则是否与司机等级/城市/车型/订单类型匹配、互斥规则是否叠加</p>
        </div>
        <div class="desc-item">
          <div class="desc-head">
            <span class="dot ok"></span>
            <strong>金额一致校验</strong>
          </div>
          <p>校验各分项金额之和是否等于总金额、单笔收益是否超出订单金额{{ ComplianceConfig.maxSingleIncomeMultiplier }}倍阈值</p>
        </div>
        <div class="desc-item">
          <div class="desc-head">
            <span class="dot ok"></span>
            <strong>补贴合规校验</strong>
          </div>
          <p>校验补贴是否超出订单金额{{ ComplianceConfig.maxDailySubsidyMultiplier }}倍、优质专属补贴与普通补贴是否互斥</p>
        </div>
      </div>

      <div v-if="!hasAbnormal" class="all-ok">
        <el-icon><CircleCheckFilled class="ok-icon" /></el-icon>
        <div class="ok-text">
          <h3>所有结算数据校验通过</h3>
          <p>{{ items.length }}笔订单的多维度校验结果全部正常</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ShieldCheck,
  WarningFilled,
  Warning,
  Tickets,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { AbnormalTypeMap, ComplianceConfig } from '@/enums/driver'
import type { SettlementItem, SettlementRecord } from '@/types/driver'

const props = defineProps<{
  items: SettlementItem[]
  record: SettlementRecord | undefined
}>()

const abnormalItems = computed(() => props.items.filter(i => i.isAbnormal))
const hasAbnormal = computed(() => abnormalItems.value.length > 0 || props.record?.isAbnormal)

const abnormalStats = computed(() => {
  const stats: Record<string, number> = {}
  abnormalItems.value.forEach(i => {
    const t = i.abnormalType || 'unknown'
    stats[t] = (stats[t] || 0) + 1
  })
  return [
    { type: 'repeat_settlement', label: '重复结算', count: stats['repeat_settlement'] || 0, icon: '🔄' },
    { type: 'over_settlement', label: '超额结算', count: stats['over_settlement'] || 0, icon: '💸' },
    { type: 'illegal_subsidy', label: '违规补贴', count: stats['illegal_subsidy'] || 0, icon: '⚠️' },
    { type: 'mismatch', label: '数据不匹配', count: stats['mismatch'] || 0, icon: '❌' }
  ]
})
</script>

<style scoped>
.stats-bar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.stat-card.overall {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
}

.stat-card.overall.ok {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1px solid #6ee7b7;
}

.stat-card.overall .icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #dc2626;
  flex-shrink: 0;
}

.stat-card.overall.ok .icon {
  background: rgba(16, 185, 129, 0.2);
  color: #059669;
}

.stat-card.danger {
  background: #fff7ed;
  border-color: #fed7aa;
}

.stat-card.danger .mini-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(249, 115, 22, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-card .info .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-card .info .value {
  font-size: 18px;
  font-weight: 700;
  color: #334155;
}

.stat-card.overall .info .value {
  font-size: 22px;
  color: #dc2626;
}

.stat-card.overall.ok .info .value {
  color: #059669;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
}

.section-title :deep(.pulse-tag) {
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.abnormal-section {
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.abnormal-order-no {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #0284c7;
}

.amount-danger {
  color: #dc2626;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.check-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
}

.check-item.ok {
  background: #dcfce7;
  color: #166534;
}

.check-item.fail {
  background: #fee2e2;
  color: #991b1b;
}

.normal-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.check-desc {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.desc-item {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid #60a5fa;
}

.desc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: #1e40af;
}

.dot.ok {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.desc-item p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.all-ok {
  text-align: center;
  padding: 32px 16px;
}

.ok-icon {
  font-size: 64px;
  color: #22c55e;
  margin-bottom: 16px;
  animation: pop-in 0.5s ease;
}

@keyframes pop-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.ok-text h3 {
  margin: 0 0 8px;
  color: #059669;
  font-size: 20px;
}

.ok-text p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}
</style>
