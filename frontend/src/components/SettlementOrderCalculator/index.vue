<template>
  <el-dialog
    v-model="visible"
    :title="`单笔收益核算 - ${orderNo}`"
    width="720px"
    :close-on-click-modal="false"
    class="calc-dialog"
  >
    <div v-loading="loading" class="calc-container">
      <div class="branch-banner">
        <el-icon><Money /></el-icon>
        <span>多因素分支自动核算</span>
      </div>

      <div class="order-section">
        <div class="section-title">
          <el-icon><List /></el-icon>
          订单基本信息
        </div>
        <div class="order-grid">
          <div class="order-item">
            <span class="label">订单号</span>
            <span class="value">{{ result?.orderInfo?.orderNo || '--' }}</span>
          </div>
          <div class="order-item">
            <span class="label">订单类型</span>
            <span class="value">{{ getOrderTypeLabel(result?.orderInfo?.orderType) }}</span>
          </div>
          <div class="order-item">
            <span class="label">订单来源</span>
            <span class="value">{{ OrderSourceMap[result?.orderInfo?.orderSource] || '--' }}</span>
          </div>
          <div class="order-item">
            <span class="label">下单时间</span>
            <span class="value">{{ result?.orderInfo?.orderStartTime || '--' }}</span>
          </div>
          <div class="order-item">
            <span class="label">订单金额</span>
            <span class="value primary">¥{{ result?.orderInfo?.orderAmount || 0 }}</span>
          </div>
          <div class="order-item">
            <span class="label">溢价金额</span>
            <span class="value" :class="{ highlight: result?.orderInfo?.isPremium }">
              ¥{{ result?.orderInfo?.premiumAmount || 0 }}
            </span>
          </div>
          <div class="order-item tag-item">
            <span class="label">时段</span>
            <el-tag v-if="result?.orderInfo?.isPeakHour" type="warning" effect="light">
              <el-icon><Sunrise /></el-icon>
              高峰时段
            </el-tag>
            <el-tag v-else>平峰时段</el-tag>
          </div>
          <div class="order-item tag-item">
            <span class="label">日期</span>
            <el-tag v-if="result?.orderInfo?.isHoliday" type="danger" effect="light">
              <el-icon><Calendar /></el-icon>
              节假日
            </el-tag>
            <el-tag v-else-if="result?.orderInfo?.isWeekend" type="success" effect="light">
              <el-icon><Sunny /></el-icon>
              周末
            </el-tag>
            <el-tag v-else>工作日</el-tag>
          </div>
          <div class="order-item tag-item">
            <span class="label">服务星级</span>
            <el-rate :model-value="result?.orderInfo?.serviceRating || 0" disabled size="small" />
          </div>
          <div class="order-item">
            <span class="label">分成比例</span>
            <span class="value accent">{{ result?.income?.commissionRate || 0 }}%</span>
          </div>
        </div>
      </div>

      <div class="rules-section">
        <div class="section-title">
          <el-icon><SetUp /></el-icon>
          匹配的计算规则
          <span class="tag-secondary">{{ result?.matchedRules?.length || 0 }}条</span>
        </div>
        <div v-if="result?.matchedRules?.length" class="rules-list">
          <div v-for="rule in result.matchedRules" :key="rule.id" class="rule-card">
            <div class="rule-header">
              <el-tag
                :color="SettlementRuleTypeColorMap[rule.ruleType]"
                effect="dark"
                size="small"
                class="rule-type"
              >
                {{ SettlementRuleTypeMap[rule.ruleType] }}
              </el-tag>
              <span class="rule-name">{{ rule.ruleName }}</span>
              <el-tag v-if="rule.isExclusive" type="warning" effect="light" size="small">
                互斥
              </el-tag>
            </div>
            <div class="rule-body">
              <span v-if="rule.commissionRate">分成: {{ rule.commissionRate }}%</span>
              <span v-if="rule.subsidyPercent">比例补贴: +{{ rule.subsidyPercent }}%</span>
              <span v-if="rule.subsidyAmount">固定补贴: +¥{{ rule.subsidyAmount }}</span>
              <span v-if="rule.priority !== undefined">优先级: {{ rule.priority }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无匹配规则" :image-size="60" />
      </div>

      <div class="calc-section">
        <div class="section-title">
          <el-icon><Calculator /></el-icon>
          收益计算过程
        </div>
        <div class="calc-steps">
          <div
            v-for="(step, idx) in result?.calculationProcess || []"
            :key="idx"
            class="calc-step"
            :class="step.type"
          >
            <div class="step-index">
              {{ idx + 1 }}
            </div>
            <div class="step-info">
              <div class="step-name">{{ step.name }}</div>
              <div class="step-formula">{{ step.formula }}</div>
            </div>
            <div class="step-amount">
              <span :class="{ positive: step.amount >= 0, negative: step.amount < 0 }">
                {{ step.amount >= 0 ? '+' : '' }}¥{{ step.amount.toFixed(2) }}
              </span>
            </div>
          </div>
          <div v-if="!result?.calculationProcess?.length" class="empty-calc">
            <el-empty description="计算过程暂不可用" :image-size="60" />
          </div>
        </div>
      </div>

      <div class="result-section">
        <div class="section-title">
          <el-icon><CircleCheckFilled /></el-icon>
          最终收益汇总
        </div>
        <div class="income-grid">
          <div class="income-item">
            <span class="label">基础分成</span>
            <span class="value">¥{{ (result?.income?.baseIncome || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">时段补贴</span>
            <span class="value plus">+¥{{ (result?.income?.hourSubsidy || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">星级补贴</span>
            <span class="value plus">+¥{{ (result?.income?.ratingSubsidy || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">节假日补贴</span>
            <span class="value plus">+¥{{ (result?.income?.holidaySubsidy || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">溢价分成</span>
            <span class="value plus">+¥{{ (result?.income?.premiumIncome || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">优质专属补贴</span>
            <span class="value excellent">+¥{{ (result?.income?.excellentSubsidy || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">新人补贴</span>
            <span class="value plus">+¥{{ (result?.income?.newDriverSubsidy || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">扣款</span>
            <span class="value minus">-¥{{ (result?.income?.penaltyAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="divider-row"></div>
          <div class="income-item">
            <span class="label">司机总收益</span>
            <span class="value total">¥{{ (result?.income?.totalIncome || 0).toFixed(2) }}</span>
          </div>
          <div class="income-item">
            <span class="label">平台抽佣</span>
            <span class="value platform">¥{{ (result?.income?.platformCommission || 0).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div v-if="voucherNo" class="voucher-section">
        <div class="section-title">
          <el-icon><Ticket /></el-icon>
          结算凭证
        </div>
        <div class="voucher-box">
          <div class="voucher-code">
            <el-icon><CreditCard /></el-icon>
            <span>{{ voucherNo }}</span>
          </div>
          <div class="voucher-desc">
            此凭证为结算唯一标识，请妥善保存
          </div>
          <div class="voucher-qrcode" ref="qrcodeRef">
            <el-icon><Picture /></el-icon>
            <span>凭证二维码</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleConfirm">
        确认核算结果
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Money,
  List,
  Sunrise,
  Calendar,
  Sunny,
  SetUp,
  Calculator,
  CircleCheckFilled,
  Ticket,
  CreditCard,
  Picture
} from '@element-plus/icons-vue'
import {
  OrderSourceMap,
  SettlementRuleTypeMap,
  SettlementRuleTypeColorMap
} from '@/enums/driver'
import { calculateOrderIncomeApi, generateVoucherApi } from '@/api/settlement'
import type { CalculateIncomeResult } from '@/types/driver'
import { OrderTypeMap } from '@/enums/driver'

const props = defineProps<{
  modelValue: boolean
  driverId: number
  orderId: number
  orderNo?: string
}>()

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const loading = ref(false)
const result = ref<CalculateIncomeResult | null>(null)
const voucherNo = ref('')

const getOrderTypeLabel = (type?: number) => {
  return OrderTypeMap[type as number] || '--'
}

const fetchData = async () => {
  if (!props.driverId || !props.orderId) return

  loading.value = true
  try {
    const res = await calculateOrderIncomeApi(props.driverId, props.orderId)
    result.value = res.data

    const voucherRes = await generateVoucherApi()
    voucherNo.value = voucherRes.data.voucherNo

    nextTick(() => {
      animateSteps()
    })
  } catch (e: any) {
    ElMessage.error(e.message || '核算失败')
  } finally {
    loading.value = false
  }
}

const animateSteps = () => {
  const steps = document.querySelectorAll('.calc-step')
  steps.forEach((el, idx) => {
    const stepEl = el as HTMLElement
    stepEl.style.opacity = '0'
    stepEl.style.transform = 'translateX(-20px)'
    setTimeout(() => {
      stepEl.style.transition = 'all 0.4s ease'
      stepEl.style.opacity = '1'
      stepEl.style.transform = 'translateX(0)'
    }, idx * 100)
  })
}

const handleConfirm = () => {
  if (!result.value) {
    ElMessage.warning('请先完成核算')
    return
  }
  emit('confirm', result.value)
  ElMessage.success('核算结果已确认')
}

watch(
  () => [props.modelValue, props.driverId, props.orderId],
  ([val]) => {
    if (val) {
      fetchData()
    }
  },
  { immediate: false }
)
</script>

<style scoped>
.calc-dialog :deep(.el-dialog__body) {
  padding-top: 0;
  max-height: 65vh;
  overflow-y: auto;
}

.branch-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 -20px 20px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 600;
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

.tag-secondary {
  margin-left: 8px;
  font-size: 12px;
  color: #64748b;
  font-weight: normal;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

.order-section,
.rules-section,
.calc-section,
.result-section,
.voucher-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  margin-bottom: 16px;
}

.order-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.order-item .label {
  font-size: 13px;
  color: #64748b;
}

.order-item .value {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.order-item .value.primary {
  color: #0284c7;
  font-size: 15px;
}

.order-item .value.highlight {
  color: #d97706;
}

.order-item .value.accent {
  color: #7c3aed;
  font-weight: 600;
}

.tag-item .label {
  margin-right: 12px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-card {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid #60a5fa;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.rule-type {
  font-size: 12px;
}

.rule-name {
  flex: 1;
  font-weight: 500;
  color: #334155;
}

.rule-body {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #64748b;
}

.calc-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calc-step {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid #60a5fa;
}

.calc-step.subsidy {
  border-left-color: #34d399;
}

.calc-step.base {
  border-left-color: #60a5fa;
}

.step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.calc-step.subsidy .step-index {
  background: #10b981;
}

.step-info {
  flex: 1;
}

.step-name {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 2px;
}

.step-formula {
  font-size: 12px;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

.step-amount {
  font-size: 15px;
  font-weight: 600;
}

.step-amount .positive {
  color: #059669;
}

.step-amount .negative {
  color: #dc2626;
}

.empty-calc {
  padding: 16px 0;
}

.income-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 24px;
}

.income-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
}

.income-item .label {
  font-size: 13px;
  color: #64748b;
}

.income-item .value {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.income-item .value.plus {
  color: #059669;
}

.income-item .value.excellent {
  color: #0891b2;
}

.income-item .value.minus {
  color: #dc2626;
}

.divider-row {
  grid-column: span 2;
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.income-item .value.total {
  color: #d97706;
  font-size: 18px;
  font-weight: 700;
}

.income-item .value.platform {
  color: #6366f1;
  font-size: 15px;
  font-weight: 600;
}

.voucher-box {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  padding: 20px;
  border: 2px dashed #f59e0b;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.voucher-code {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #92400e;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
}

.voucher-desc {
  grid-column: 1;
  font-size: 12px;
  color: #a16207;
}

.voucher-qrcode {
  grid-row: span 2;
  width: 80px;
  height: 80px;
  background: #fff;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 10px;
  gap: 4px;
}

.voucher-qrcode .el-icon {
  font-size: 28px;
  color: #475569;
}
</style>
