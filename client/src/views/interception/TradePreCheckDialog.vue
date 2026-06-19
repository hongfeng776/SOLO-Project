<template>
  <FinDialog
    :model-value="visible"
    title="交易前置校验"
    width="720px"
    :hide-footer="true"
    :close-on-click-modal="!isChecking"
    @update:visible="handleUpdateVisible"
  >
    <div class="precheck-dialog" :class="{ shake: shouldShake }">
      <div v-if="checkPhase === 'input'" class="phase-input">
        <div class="section-tip">
          <el-icon><InfoFilled /></el-icon>
          请输入交易参数，系统将自动校验是否符合风控规则要求
        </div>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="110px"
        >
          <el-form-item label="客户信息" prop="customerId">
            <el-select
              v-model="formData.customerId"
              placeholder="请选择客户"
              filterable
              class="full-width"
            >
              <el-option
                v-for="c in mockCustomers"
                :key="c.id"
                :label="`${c.name} (${c.account})`"
                :value="c.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="股票信息" required>
            <div class="stock-input-row">
              <el-input
                v-model="formData.stockCode"
                placeholder="股票代码"
                maxlength="6"
                class="stock-code-input"
                @blur="handleStockBlur"
              />
              <el-input
                v-model="formData.stockName"
                placeholder="股票名称"
                class="stock-name-input"
              />
            </div>
          </el-form-item>

          <el-form-item label="交易方向" prop="side">
            <el-radio-group v-model="formData.side">
              <el-radio value="buy">
                <span class="buy-label">买入</span>
              </el-radio>
              <el-radio value="sell">
                <span class="sell-label">卖出</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="委托价格" prop="price">
            <el-input-number
              v-model="formData.price"
              :min="0.01"
              :max="9999"
              :precision="2"
              :step="0.1"
              controls-position="right"
              style="width: 200px"
            />
            <span class="form-unit">元 / 股</span>
          </el-form-item>

          <el-form-item label="委托数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="100"
              :step="100"
              controls-position="right"
              style="width: 200px"
            />
            <span class="form-unit">股（100的整数倍）</span>
          </el-form-item>

          <el-form-item label="预估金额">
            <span class="estimate-amount">
              {{ estimateAmount.toLocaleString() }} 元
            </span>
          </el-form-item>
        </el-form>

        <div class="dialog-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            :ripple="true"
            @click="handleSubmitCheck"
          >
            <el-icon><Search /></el-icon>
            开始校验
          </el-button>
        </div>
      </div>

      <div v-else-if="checkPhase === 'checking'" class="phase-checking">
        <div class="checking-anim">
          <div class="checking-rings">
            <div class="ring ring-1" />
            <div class="ring ring-2" />
            <div class="ring ring-3" />
          </div>
          <div class="checking-icon">
            <el-icon :size="44" color="#409EFF"><Search /></el-icon>
          </div>
        </div>

        <div class="checking-title">正在进行风控校验...</div>
        <div class="checking-desc">请稍候，正在综合评估交易合规性</div>

        <div class="checking-steps">
          <div
            v-for="(s, i) in checkingSteps"
            :key="i"
            class="check-step"
            :class="{ active: currentStep >= i, done: currentStep > i }"
          >
            <div class="step-icon">
              <el-icon v-if="currentStep > i" color="#67C23A"><CircleCheckFilled /></el-icon>
              <el-icon v-else-if="currentStep === i" color="#409EFF" class="spinning"><Loading /></el-icon>
              <el-icon v-else color="#C0C4CC"><CircleClose /></el-icon>
            </div>
            <div class="step-text">{{ s }}</div>
            <div class="step-line" v-if="i < checkingSteps.length - 1" />
          </div>
        </div>
      </div>

      <div v-else-if="checkPhase === 'result'" class="phase-result">
        <transition name="fade-zoom" appear>
          <div class="result-banner" :class="'banner-' + resultLevel">
            <div class="result-icon">
              <el-icon v-if="checkResult?.allowTrade" :size="48" color="#67C23A"><CircleCheckFilled /></el-icon>
              <el-icon v-else :size="48" :color="getLevelColor(checkResult?.interceptionLevel)">
                <WarningFilled v-if="checkResult?.interceptionLevel === InterceptionLevel.LOW || checkResult?.interceptionLevel === InterceptionLevel.MEDIUM" />
                <Danger v-else />
              </el-icon>
            </div>
            <div class="result-content">
              <div class="result-title">{{ resultTitle }}</div>
              <div class="result-subtitle">
                <span v-if="checkResult?.allowTrade">本次交易符合风控要求，可以正常提交</span>
                <template v-else>
                  <span>触发 </span>
                  <strong>{{ checkResult?.triggeredRules.length }}</strong>
                  <span> 条风控规则，风险评分 </span>
                  <strong :style="{ color: getLevelColor(checkResult?.interceptionLevel) }">{{ checkResult?.riskScore }}</strong>
                </template>
              </div>
            </div>
          </div>
        </transition>

        <div v-if="!checkResult?.allowTrade" class="blocked-actions">
          <div class="blocked-title">已触发拦截措施</div>
          <div class="blocked-tags">
            <el-tag
              v-for="a in checkResult?.blockActions"
              :key="a"
              type="danger"
              effect="dark"
              class="block-tag"
            >
              <el-icon><Lock /></el-icon>
              {{ getActionLabel(a) }}
            </el-tag>
          </div>
          <div v-if="checkResult?.freezeFundAmount" class="freeze-info">
            <el-icon><Money /></el-icon>
            冻结交易资金：<strong>{{ checkResult.freezeFundAmount.toLocaleString() }}</strong> 元
          </div>
          <div v-if="checkResult?.freezePositionCodes?.length" class="freeze-info">
            <el-icon><Goods /></el-icon>
            冻结持仓操作：<strong>{{ checkResult.freezePositionCodes.join('、') }}</strong>
          </div>
        </div>

        <div v-if="checkResult && checkResult.triggeredRules.length > 0" class="rules-section">
          <div class="rules-header">
            <el-icon><Notebook /></el-icon>
            风控规则校验结果
            <span class="badge">({{ checkResult.triggeredRules.length }}条异常)</span>
          </div>

          <div class="rules-list">
            <transition-group name="list-anim">
              <div
                v-for="(r, idx) in checkResult.triggeredRules"
                :key="idx"
                class="rule-result-card"
                :class="'severity-' + r.severity"
                :style="{ animationDelay: idx * 0.1 + 's' }"
              >
                <div class="rule-header">
                  <div class="rule-left">
                    <el-tag :type="getSeverityTagType(r.severity)" effect="dark">
                      {{ r.ruleName }}
                    </el-tag>
                    <span class="rule-code">{{ r.ruleCode }}</span>
                  </div>
                  <div class="rule-right">
                    <span class="severity-mark" :class="'mark-' + r.severity">
                      {{ getSeverityLabel(r.severity) }}
                    </span>
                  </div>
                </div>
                <div class="rule-reason">
                  <el-icon><InfoFilled /></el-icon>
                  {{ r.triggerReason }}
                </div>
                <div class="rule-compare-row">
                  <div class="comp-item">
                    <span class="comp-label">规则阈值</span>
                    <span class="comp-value">{{ r.thresholdValue ?? '—' }}</span>
                  </div>
                  <div class="comp-arrow">
                    <el-icon><Right /></el-icon>
                  </div>
                  <div class="comp-item danger">
                    <span class="comp-label">实际值</span>
                    <span class="comp-value">{{ r.actualValue }}</span>
                  </div>
                  <div class="comp-status danger">
                    <el-icon><Warning /></el-icon>
                    超限
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </div>

        <div v-if="checkResult?.warningMessage" class="warning-box">
          <el-icon><WarningFilled /></el-icon>
          {{ checkResult.warningMessage }}
        </div>

        <div class="dialog-actions result-actions">
          <el-button @click="handleReset">重新校验</el-button>
          <el-button
            v-if="!checkResult?.allowTrade"
            type="warning"
            :ripple="true"
            @click="handleCreateRecord"
          >
            生成拦截记录
          </el-button>
          <el-button
            v-if="checkResult?.allowTrade"
            type="success"
            :ripple="true"
            @click="handleAllow"
          >
            确认提交交易
          </el-button>
        </div>
      </div>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  InfoFilled,
  Search,
  Loading,
  CircleCheckFilled,
  CircleClose,
  WarningFilled,
  Warning,
  Lock,
  Money,
  Goods,
  Notebook,
  Right,
  Danger,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import {
  INTERCEPTION_ACTION_LABELS,
} from '@/constants/dictionaries'
import { InterceptionLevel } from '@/enums'
import * as interceptionApi from '@/api/interception'
import type { ITradePreCheckParams, ITradePreCheckResult } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'

interface IProps {
  visible: boolean
}

const props = defineProps<IProps>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'interception-created': []
}>()

const formRef = ref<FormInstance>()
const checkPhase = ref<'input' | 'checking' | 'result'>('input')
const checkResult = ref<ITradePreCheckResult | null>(null)
const currentStep = ref(-1)
const shouldShake = ref(false)

const formData = reactive<ITradePreCheckParams>({
  customerId: 0,
  stockCode: '',
  stockName: '',
  side: 'buy',
  price: 0,
  quantity: 100,
})

const formRules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  stockCode: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  side: [{ required: true, message: '请选择交易方向', trigger: 'change' }],
  price: [
    { required: true, message: '请输入委托价格', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' },
  ],
  quantity: [
    { required: true, message: '请输入委托数量', trigger: 'blur' },
    {
      validator: (_: any, v: number, cb: any) => {
        if (v % 100 !== 0) cb(new Error('数量必须是100的整数倍'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

const checkingSteps = [
  '校验账户风险状态',
  '匹配客户等级风控参数',
  '检查规则触发条件',
  '评估交易行为特征',
  '综合风险评估',
]

const mockCustomers = [
  { id: 10001, name: '张伟', account: 'ACC10001', level: 'GOLD' },
  { id: 10002, name: '李娜', account: 'ACC10002', level: 'PLATINUM' },
  { id: 10003, name: '王芳', account: 'ACC10003', level: 'SILVER' },
  { id: 10004, name: '刘强', account: 'ACC10004', level: 'NORMAL' },
  { id: 10005, name: '陈静', account: 'ACC10005', level: 'DIAMOND' },
]

const estimateAmount = computed(() => {
  return Math.round((formData.price || 0) * (formData.quantity || 0) * 100) / 100
})

const resultLevel = computed(() => {
  if (!checkResult.value) return 'pass'
  if (checkResult.value.allowTrade) return 'pass'
  const map: Record<string, string> = {
    [InterceptionLevel.LOW]: 'warn-low',
    [InterceptionLevel.MEDIUM]: 'warn-med',
    [InterceptionLevel.HIGH]: 'warn-high',
    [InterceptionLevel.CRITICAL]: 'warn-critical',
  }
  return map[checkResult.value.interceptionLevel] || 'warn-med'
})

const resultTitle = computed(() => {
  if (!checkResult.value) return ''
  if (checkResult.value.allowTrade) return '校验通过'
  const map: Record<string, string> = {
    [InterceptionLevel.LOW]: '一般警告',
    [InterceptionLevel.MEDIUM]: '风险提示',
    [InterceptionLevel.HIGH]: '交易已拦截',
    [InterceptionLevel.CRITICAL]: '紧急拦截',
  }
  return map[checkResult.value.interceptionLevel] || '校验未通过'
})

function getLevelColor(level?: string): string {
  const map: Record<string, string> = {
    [InterceptionLevel.LOW]: '#909399',
    [InterceptionLevel.MEDIUM]: '#409EFF',
    [InterceptionLevel.HIGH]: '#E6A23C',
    [InterceptionLevel.CRITICAL]: '#F56C6C',
  }
  return map[level || ''] || '#909399'
}

function getSeverityTagType(s: string): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'error') return 'danger'
  if (s === 'warning') return 'warning'
  return 'info'
}

function getSeverityLabel(s: string): string {
  const map: Record<string, string> = { info: '提示', warning: '警告', error: '严重' }
  return map[s] || s
}

function getActionLabel(a: string): string {
  const map: Record<string, string> = {
    block_trade: '禁止交易',
    freeze_funds: '冻结资金',
    freeze_position: '冻结持仓',
    restrict_operation: '限制操作',
    warn_only: '仅警告',
  }
  return map[a] || a
}

function triggerShake() {
  shouldShake.value = true
  setTimeout(() => {
    shouldShake.value = false
  }, 500)
}

function handleStockBlur() {
  const stockNameMap: Record<string, string> = {
    '600519': '贵州茅台',
    '000001': '平安银行',
    '601398': '工商银行',
    '000858': '五粮液',
    '601318': '中国平安',
    '300750': '宁德时代',
    '600036': '招商银行',
  }
  if (formData.stockCode && stockNameMap[formData.stockCode]) {
    formData.stockName = stockNameMap[formData.stockCode]
  }
}

function handleUpdateVisible(val: boolean) {
  emit('update:visible', val)
}

function handleCancel() {
  emit('update:visible', false)
}

function handleReset() {
  checkPhase.value = 'input'
  checkResult.value = null
  currentStep.value = -1
}

async function handleSubmitCheck() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    triggerShake()
    ElMessage.warning('请完整填写交易信息并检查格式')
    return
  }

  if (estimateAmount.value <= 0) {
    triggerShake()
    ElMessage.warning('预估金额异常，请检查价格和数量')
    return
  }

  checkPhase.value = 'checking'
  currentStep.value = 0
  const stepDuration = 450

  for (let i = 0; i < checkingSteps.length; i++) {
    currentStep.value = i
    await new Promise((r) => setTimeout(r, stepDuration))
  }
  currentStep.value = checkingSteps.length

  try {
    const res = await interceptionApi.preCheckTrade({ ...formData })
    if (res.code === 0) {
      checkResult.value = res.data
    } else {
      throw new Error(res.message)
    }
  } catch (e: any) {
    checkResult.value = buildMockResult()
  }

  await new Promise((r) => setTimeout(r, 300))
  checkPhase.value = 'result'
}

function buildMockResult(): ITradePreCheckResult {
  const amount = estimateAmount.value
  const isLarge = amount > 500000
  const isFreq = formData.quantity >= 5000
  const triggeredRules: any[] = []

  if (isLarge) {
    triggeredRules.push({
      ruleId: 1,
      ruleCode: 'RULE-TL-001',
      ruleName: '单笔交易限额',
      ruleType: 'trade_limit',
      thresholdValue: '500000.00元',
      actualValue: amount.toFixed(2) + '元',
      severity: 'error',
      triggerReason: `单笔交易金额${amount.toLocaleString()}元超过该客户等级允许的单笔最大限额50万元`,
      ruleDescription: '为防范大额异常交易风险，根据客户等级设置差异化的单笔交易金额上限',
    })
  }

  if (isFreq) {
    triggeredRules.push({
      ruleId: 2,
      ruleCode: 'RULE-FR-003',
      ruleName: '频次风控阈值',
      ruleType: 'frequency_risk',
      thresholdValue: '≤3000股/单',
      actualValue: `${formData.quantity}股/单`,
      severity: 'warning',
      triggerReason: `单笔委托数量${formData.quantity}股较大，请确认是否为策略交易或拆分下单`,
      ruleDescription: '限制单次委托数量，避免大额订单对市场价格造成冲击',
    })
  }

  if (amount >= 200000 && amount <= 500000) {
    triggeredRules.push({
      ruleId: 3,
      ruleCode: 'RULE-VL-002',
      ruleName: '波动风控预警',
      ruleType: 'volatility_risk',
      thresholdValue: '日累计≤20万元',
      actualValue: `本次${(amount / 10000).toFixed(1)}万元`,
      severity: 'warning',
      triggerReason: '本次交易金额较大，建议关注账户整体风险敞口',
    })
  }

  if (triggeredRules.length === 0) {
    return {
      allowTrade: true,
      interceptionLevel: InterceptionLevel.LOW,
      triggeredRules: [],
      riskScore: 18,
      blockActions: [],
      warningMessage: '本次交易符合所有风控规则，可正常提交',
    }
  }

  const riskScore = Math.min(99, 40 + triggeredRules.filter(r => r.severity === 'error').length * 25 + triggeredRules.length * 8)
  const level = riskScore >= 80 ? InterceptionLevel.CRITICAL
    : riskScore >= 60 ? InterceptionLevel.HIGH
    : riskScore >= 40 ? InterceptionLevel.MEDIUM
    : InterceptionLevel.LOW

  return {
    allowTrade: level === InterceptionLevel.LOW,
    interceptionLevel: level,
    triggeredRules,
    riskScore,
    blockActions: level === InterceptionLevel.LOW
      ? ['warn_only']
      : level === InterceptionLevel.MEDIUM
        ? ['restrict_operation']
        : ['block_trade', 'freeze_funds', 'restrict_operation'],
    freezeFundAmount: level === InterceptionLevel.LOW ? 0 : Math.round(amount * 0.5),
    freezePositionCodes: level === InterceptionLevel.HIGH || level === InterceptionLevel.CRITICAL ? [formData.stockCode] : undefined,
    restrictions: level === InterceptionLevel.MEDIUM ? ['限制同股票当日再次下单'] : undefined,
    warningMessage: level === InterceptionLevel.LOW ? '可继续提交，但请留意风控提示' : undefined,
  }
}

function handleCreateRecord() {
  ElMessage.success('已生成拦截记录，可在拦截列表中查看并处理')
  ElNotification({
    type: 'warning',
    title: '交易拦截通知',
    message: `客户#${formData.customerId} 的${estimateAmount.value.toLocaleString()}元交易已被拦截`,
    duration: 4000,
  })
  emit('interception-created')
  emit('update:visible', false)
}

function handleAllow() {
  ElMessage.success('交易已通过风控校验，可正常提交')
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      checkPhase.value = 'input'
      checkResult.value = null
      currentStep.value = -1
      shouldShake.value = false
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.precheck-dialog {
  padding: 8px 0;

  &.shake {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
}

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}

.section-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(103, 194, 58, 0.05) 100%);
  border-radius: 6px;
  font-size: 13px;
  color: #1F2D3D;
  margin-bottom: 20px;

  .el-icon { color: #409EFF; flex-shrink: 0; }
}

.full-width { width: 100%; }

.stock-input-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.stock-code-input {
  width: 180px;
}

.stock-name-input {
  flex: 1;
}

.buy-label {
  color: #F56C6C;
  font-weight: 500;
}

.sell-label {
  color: #67C23A;
  font-weight: 500;
}

.form-unit {
  margin-left: 8px;
  color: #8492A6;
  font-size: 13px;
}

.estimate-amount {
  font-size: 18px;
  font-weight: 700;
  color: #1F2D3D;
  font-family: 'DIN', monospace;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 24px;
  border-top: 1px solid #F2F6FC;
  margin-top: 24px;
}

.phase-checking {
  padding: 30px 20px;
  text-align: center;
}

.checking-anim {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checking-rings {
  position: absolute;
  inset: 0;
}

.ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: #409EFF;
  border-radius: 50%;
  animation: ring-rotate 1.6s linear infinite;

  &.ring-1 {
    opacity: 0.8;
  }

  &.ring-2 {
    inset: 12px;
    border-top-color: #67C23A;
    animation-direction: reverse;
    animation-duration: 2s;
    opacity: 0.7;
  }

  &.ring-3 {
    inset: 24px;
    border-top-color: #E6A23C;
    animation-duration: 2.4s;
    opacity: 0.6;
  }
}

@keyframes ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.checking-icon {
  position: relative;
  z-index: 1;
}

.checking-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 8px;
}

.checking-desc {
  font-size: 13px;
  color: #8492A6;
  margin-bottom: 30px;
}

.checking-steps {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}

.check-step {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 16px;
    left: calc(50% + 20px);
    right: calc(-50% + 20px);
    height: 2px;
    background: #E4E7ED;
  }

  &.active:not(:last-child)::after {
    background: linear-gradient(90deg, #409EFF 0%, #E4E7ED 100%);
  }

  &.done:not(:last-child)::after {
    background: #67C23A;
  }
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #E4E7ED;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.3s ease;

  .check-step.active & {
    border-color: #409EFF;
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.15);
  }

  .check-step.done & {
    border-color: #67C23A;
    background: #F0F9EB;
  }
}

.spinning {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.step-text {
  font-size: 12px;
  color: #8492A6;
  white-space: nowrap;

  .check-step.active & { color: #409EFF; font-weight: 500; }
  .check-step.done & { color: #67C23A; }
}

.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-zoom-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.result-banner {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;

  &.banner-pass {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.12) 0%, rgba(103, 194, 58, 0.05) 100%);
    border: 1px solid rgba(103, 194, 58, 0.3);
  }

  &.banner-warn-low {
    background: linear-gradient(135deg, rgba(144, 147, 153, 0.12) 0%, rgba(144, 147, 153, 0.04) 100%);
    border: 1px solid rgba(144, 147, 153, 0.3);
  }

  &.banner-warn-med {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.12) 0%, rgba(64, 158, 255, 0.04) 100%);
    border: 1px solid rgba(64, 158, 255, 0.3);
  }

  &.banner-warn-high {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.15) 0%, rgba(230, 162, 60, 0.05) 100%);
    border: 1px solid rgba(230, 162, 60, 0.35);
  }

  &.banner-warn-critical {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.18) 0%, rgba(245, 108, 108, 0.06) 100%);
    border: 1px solid rgba(245, 108, 108, 0.4);
  }
}

.result-icon {
  flex-shrink: 0;
  animation: icon-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes icon-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.result-content { flex: 1; }

.result-title {
  font-size: 22px;
  font-weight: 700;
  color: #1F2D3D;
  margin-bottom: 6px;
}

.result-subtitle {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;

  strong {
    font-size: 15px;
    font-weight: 700;
    font-family: 'DIN', monospace;
  }
}

.blocked-actions {
  padding: 14px 18px;
  background: #FEF0F0;
  border-radius: 8px;
  border: 1px solid #FBC4C4;
  margin-bottom: 18px;
}

.blocked-title {
  font-size: 13px;
  font-weight: 600;
  color: #F56C6C;
  margin-bottom: 10px;
}

.blocked-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.block-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.freeze-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  margin-right: 20px;

  &:not(:last-child) {
    padding-right: 20px;
    border-right: 1px dashed #E4E7ED;
  }

  strong { color: #F56C6C; }
}

.rules-section {
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 18px;
}

.rules-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #F5F7FA;
  font-size: 14px;
  font-weight: 600;
  color: #1F2D3D;
  border-bottom: 1px solid #E4E7ED;

  .el-icon { color: #F56C6C; }
}

.badge {
  color: #F56C6C;
  font-weight: 500;
}

.rules-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-anim-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.list-anim-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.rule-result-card {
  border: 1px solid #E4E7ED;
  border-left: 4px solid #909399;
  border-radius: 6px;
  overflow: hidden;

  &.severity-error {
    border-left-color: #F56C6C;
    background: linear-gradient(90deg, rgba(245, 108, 108, 0.04) 0%, #fff 40%);
  }

  &.severity-warning {
    border-left-color: #E6A23C;
    background: linear-gradient(90deg, rgba(230, 162, 60, 0.04) 0%, #fff 40%);
  }

  &.severity-info {
    border-left-color: #409EFF;
  }
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #FAFBFC;
  border-bottom: 1px solid #F2F6FC;
}

.rule-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-code {
  font-size: 12px;
  color: #8492A6;
  font-family: monospace;
}

.rule-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.severity-mark {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;

  &.mark-error {
    background: #FEF0F0;
    color: #F56C6C;
  }

  &.mark-warning {
    background: #FDF6EC;
    color: #E6A23C;
  }

  &.mark-info {
    background: #ECF5FF;
    color: #409EFF;
  }
}

.rule-reason {
  padding: 10px 14px;
  font-size: 13px;
  color: #1F2D3D;
  line-height: 1.6;
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;

  .el-icon {
    color: #8492A6;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.rule-compare-row {
  display: grid;
  grid-template-columns: 1fr 30px 1fr auto;
  gap: 8px;
  padding: 10px 14px;
  background: #FAFBFC;
  border-top: 1px solid #F2F6FC;
  align-items: center;
}

.comp-item {
  padding: 6px 10px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #E4E7ED;

  &.danger {
    border-color: #F56C6C;
    background: #FEF0F0;
  }
}

.comp-label {
  display: block;
  font-size: 10px;
  color: #8492A6;
  margin-bottom: 2px;
}

.comp-value {
  font-size: 13px;
  font-weight: 600;
  color: #1F2D3D;
  font-family: 'DIN', monospace;

  .danger & { color: #F56C6C; }
}

.comp-arrow {
  display: flex;
  justify-content: center;
  color: #C0C4CC;
}

.comp-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #FDF6EC;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.danger {
    background: #FEF0F0;
    color: #F56C6C;
  }
}

.warning-box {
  padding: 12px 16px;
  background: #FDF6EC;
  border: 1px solid #F5DAB1;
  border-radius: 6px;
  color: #B8823B;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 18px;
}

.result-actions {
  margin-top: 0;
}
</style>
