<template>
  <FinDialog
    :model-value="visible"
    title="拦截记录详情"
    width="960px"
    :hide-footer="true"
    @update:visible="handleUpdateVisible"
  >
    <div v-if="record" class="detail-dialog" v-loading="loading">
      <div class="detail-header">
        <div class="header-left">
          <div class="status-banner" :class="'banner-' + record.status">
            <el-icon :size="20"><component :is="getStatusIcon(record.status)" /></el-icon>
            <span>{{ getInterceptionStatusLabel(record.status) }}</span>
          </div>
          <div class="no-text">
            拦截编号：<span class="code-text">{{ record.interceptionNo }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="level-badge" :style="{ backgroundColor: getInterceptionLevelBgColor(record.interceptionLevel), color: getInterceptionLevelColor(record.interceptionLevel) }">
            <el-icon><WarningFilled /></el-icon>
            {{ getInterceptionLevelLabel(record.interceptionLevel) }}
          </div>
          <div class="risk-score-box">
            <div class="score-label">风险评分</div>
            <div class="score-value" :style="{ color: getScoreColor(record.riskScore) }">{{ record.riskScore }}</div>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="grid-section customer-section">
          <div class="section-title">
            <el-icon><User /></el-icon>
            客户信息
          </div>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="客户姓名">{{ record.customerName }}</el-descriptions-item>
            <el-descriptions-item label="资金账号">
              <span class="code-text">{{ record.customerAccount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="客户等级">{{ record.customerLevel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="账户状态">
              <el-tag :type="accountRiskTagType" size="small">{{ accountRiskLabel }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="grid-section trade-section">
          <div class="section-title">
            <el-icon><Money /></el-icon>
            交易信息
          </div>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="股票名称">
              <span class="stock-name">{{ record.stockName || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="股票代码">
              <span class="code-text">{{ record.stockCode || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="交易方向">
              <el-tag :type="record.side === 'buy' || record.side === 'BUY' || record.side === '1' ? 'danger' : 'success'" size="small" effect="plain">
                {{ getSideLabel(record.side) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="价格 / 数量">
              {{ record.price?.toFixed(2) }}元 × {{ record.quantity }}股
            </el-descriptions-item>
            <el-descriptions-item label="成交金额" :span="2">
              <span class="amount-highlight">{{ record.amount?.toLocaleString() }} 元</span>
            </el-descriptions-item>
            <el-descriptions-item label="拦截时间" :span="2">
              {{ formatDateTime(record.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <el-icon><Notebook /></el-icon>
          触发规则明细
          <span class="badge-count">{{ record.triggeredRules.length }}</span>
        </div>
        <div class="rules-detail-list">
          <div
            v-for="(rule, idx) in record.triggeredRules"
            :key="idx"
            class="rule-detail-card"
            :class="'severity-' + rule.severity"
          >
            <div class="rule-card-header">
              <div class="rule-card-left">
                <el-tag :type="getSeverityTagType(rule.severity)" effect="dark">
                  {{ rule.ruleName }}
                </el-tag>
                <span class="rule-code">{{ rule.ruleCode }}</span>
              </div>
              <div class="rule-card-right">
                <span class="severity-dot" :class="'dot-' + rule.severity" />
                {{ getSeverityLabel(rule.severity) }}
              </div>
            </div>
            <div class="rule-card-body">
              <div class="rule-reason">{{ rule.triggerReason }}</div>
              <div v-if="rule.thresholdValue !== undefined" class="rule-compare">
                <div class="compare-box threshold">
                  <div class="compare-label">规则阈值</div>
                  <div class="compare-value">{{ rule.thresholdValue }}</div>
                </div>
                <div class="compare-arrow">
                  <el-icon :size="20"><Right /></el-icon>
                </div>
                <div class="compare-box actual">
                  <div class="compare-label">实际值</div>
                  <div class="compare-value">{{ rule.actualValue }}</div>
                </div>
                <div class="compare-result">
                  <el-icon :size="22" color="#F56C6C"><WarningFilled /></el-icon>
                  <span>超限触发</span>
                </div>
              </div>
              <div v-if="rule.ruleDescription" class="rule-desc">
                <el-icon><InfoFilled /></el-icon>
                规则说明：{{ rule.ruleDescription }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <el-icon><Lock /></el-icon>
          冻结与限制措施
        </div>
        <div class="actions-grid">
          <div
            v-for="action in actionLabels"
            :key="action.key"
            class="action-item"
            :class="{ active: action.isActive }"
          >
            <div class="action-icon" :class="{ 'icon-active': action.isActive }">
              <el-icon :size="22"><component :is="action.icon" /></el-icon>
            </div>
            <div class="action-info">
              <div class="action-name">{{ action.label }}</div>
              <div class="action-status">
                <el-icon><component :is="action.isActive ? 'CircleCheckFilled' : 'CircleClose'" /></el-icon>
                {{ action.isActive ? '已生效' : '未触发' }}
              </div>
            </div>
            <div v-if="action.extra" class="action-extra">{{ action.extra }}</div>
          </div>
        </div>

        <div v-if="record.restrictionExpireTime" class="restriction-expire">
          <el-icon><Timer /></el-icon>
          限制到期时间：{{ formatDateTime(record.restrictionExpireTime) }}
        </div>
      </div>

      <div v-if="accountRiskStatus" class="section-card">
        <div class="section-title">
          <el-icon><Monitor /></el-icon>
          账户风险状态
        </div>
        <div class="account-risk-summary">
          <div class="risk-level-badge" :class="'level-' + accountRiskStatus.riskLevel">
            <span class="level-text">{{ accountRiskLevelMap[accountRiskStatus.riskLevel] }}</span>
          </div>
          <div class="risk-info-grid">
            <div class="info-item">
              <span class="info-label">冻结资金</span>
              <span class="info-value danger">{{ accountRiskStatus.frozenFunds?.toLocaleString() }} 元</span>
            </div>
            <div class="info-item">
              <span class="info-label">冻结持仓</span>
              <span class="info-value warning">{{ accountRiskStatus.frozenPositions?.length || 0 }} 只</span>
            </div>
            <div class="info-item">
              <span class="info-label">生效拦截</span>
              <span class="info-value primary">{{ accountRiskStatus.activeInterceptionCount }} 条</span>
            </div>
            <div class="info-item">
              <span class="info-label">最近扫描</span>
              <span class="info-value">{{ formatDateTime(accountRiskStatus.lastRiskScanTime) }}</span>
            </div>
          </div>
        </div>
        <div v-if="accountRiskStatus.restrictions?.length > 0" class="restrictions-list">
          <div class="restrictions-title">当前限制：</div>
          <el-tag v-for="(r, i) in accountRiskStatus.restrictions" :key="i" size="small" type="warning" effect="plain" class="mr-4">
            {{ r }}
          </el-tag>
        </div>
      </div>

      <div class="section-card handle-section">
        <div class="section-title">
          <el-icon><Edit /></el-icon>
          处理操作
        </div>

        <div class="handle-tabs">
          <el-radio-group v-model="handleMode" :disabled="!canHandleNow">
            <el-radio-button value="release">解除拦截</el-radio-button>
            <el-radio-button value="status">变更状态</el-radio-button>
            <el-radio-button value="actions">调整措施</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="handleMode === 'release'" class="handle-content">
          <el-alert type="success" :closable="false" show-icon class="mb-16">
            解除后将自动解冻对应资金和持仓，客户恢复正常交易权限。
          </el-alert>
          <el-form label-width="100px">
            <el-form-item label="解除事由">
              <el-input v-model="handleForm.remark" type="textarea" :rows="2" placeholder="请输入解除事由（必填）" maxlength="200" />
            </el-form-item>
            <el-form-item label="解冻设置">
              <el-checkbox v-model="handleForm.releaseFunds">解冻冻结资金（{{ record.freezeFundAmount?.toLocaleString() || 0 }}元）</el-checkbox>
              <el-checkbox v-model="handleForm.releasePositions" class="ml-20">解冻冻结持仓</el-checkbox>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="handleMode === 'status'" class="handle-content">
          <el-form label-width="100px">
            <el-form-item label="目标状态">
              <el-radio-group v-model="handleForm.targetStatus">
                <el-radio :value="InterceptionStatus.TEMPORARY">临时拦截</el-radio>
                <el-radio :value="InterceptionStatus.PERMANENT">永久拦截</el-radio>
                <el-radio :value="InterceptionStatus.MANUAL_REVIEW">人工复核</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="处理说明">
              <el-input v-model="handleForm.remark" type="textarea" :rows="2" placeholder="请输入状态变更说明（必填）" maxlength="200" />
            </el-form-item>
            <el-form-item label="推送通知">
              <el-checkbox v-model="handleForm.sendAlert">站内消息</el-checkbox>
              <el-checkbox v-model="handleForm.notifyCustomer" class="ml-20">短信通知客户</el-checkbox>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="handleMode === 'actions'" class="handle-content">
          <el-form label-width="120px">
            <el-form-item label="调整措施">
              <el-checkbox-group v-model="handleForm.adjustActions">
                <el-checkbox value="block_trade">禁止交易</el-checkbox>
                <el-checkbox value="freeze_funds">冻结资金</el-checkbox>
                <el-checkbox value="freeze_position">冻结持仓</el-checkbox>
                <el-checkbox value="restrict_operation">限制操作</el-checkbox>
                <el-checkbox value="warn_only">仅警告</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="解冻资金">
              <el-input-number v-model="handleForm.releaseFundAmount" :min="0" :max="record.freezeFundAmount || 0" :precision="2" />
              <span class="form-tip">可分次解冻，当前冻结：{{ record.freezeFundAmount?.toLocaleString() || 0 }} 元</span>
            </el-form-item>
            <el-form-item label="处理说明">
              <el-input v-model="handleForm.remark" type="textarea" :rows="2" placeholder="请输入措施调整说明（必填）" maxlength="200" />
            </el-form-item>
          </el-form>
        </div>

        <div class="handle-actions" :class="{ shake: shouldShake }">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            :ripple="true"
            @click="handleSubmit"
          >
            确认处理
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
  WarningFilled,
  User,
  Money,
  Notebook,
  Lock,
  Monitor,
  Edit,
  Right,
  InfoFilled,
  CircleCheckFilled,
  CircleClose,
  Timer,
  Close,
  Goods,
  Ban,
  Bell,
  Warning,
  Unlock,
  Finished,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/utils/format'
import {
  INTERCEPTION_TYPE_LABELS,
  INTERCEPTION_TYPE_COLORS,
  INTERCEPTION_STATUS_LABELS,
  INTERCEPTION_LEVEL_LABELS,
  INTERCEPTION_LEVEL_COLORS,
  INTERCEPTION_LEVEL_BG_COLORS,
  INTERCEPTION_ACTION_LABELS,
  SIDE_LABELS,
} from '@/constants/dictionaries'
import {
  InterceptionStatus,
  InterceptionLevel,
  InterceptionAction,
} from '@/enums'
import * as interceptionApi from '@/api/interception'
import type {
  IInterceptionRecord,
  IInterceptionHandleData,
  IAccountRiskStatus,
} from '@/types/api'

interface IProps {
  visible: boolean
  interceptionId: number | null
}

const props = withDefaults(defineProps<IProps>(), {
  interceptionId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'action-success': []
}>()

const { hasPerm } = usePermission()

const loading = ref(false)
const submitting = ref(false)
const record = ref<IInterceptionRecord | null>(null)
const accountRiskStatus = ref<IAccountRiskStatus | null>(null)
const handleMode = ref('release')
const shouldShake = ref(false)

const handleForm = reactive({
  targetStatus: InterceptionStatus.TEMPORARY,
  remark: '',
  releaseFunds: true,
  releasePositions: true,
  releaseFundAmount: 0,
  adjustActions: [] as string[],
  sendAlert: true,
  notifyCustomer: false,
})

const accountRiskLevelMap: Record<string, string> = {
  normal: '正常',
  watch: '关注',
  warning: '警告',
  critical: '危急',
}

const canHandleNow = computed(() => {
  if (!record.value) return false
  return !([
    InterceptionStatus.APPEAL_PASSED,
    InterceptionStatus.AUTO_RELEASED,
  ].includes(record.value.status))
})

const actionLabels = computed(() => {
  if (!record.value) return []
  const actions = record.value.actions || []
  return [
    {
      key: 'block_trade',
      label: '禁止交易',
      icon: Ban,
      isActive: actions.includes(InterceptionAction.BLOCK_TRADE),
      extra: '',
    },
    {
      key: 'freeze_funds',
      label: '冻结资金',
      icon: Lock,
      isActive: actions.includes(InterceptionAction.FREEZE_FUNDS),
      extra: record.value.freezeFundAmount ? `${record.value.freezeFundAmount.toLocaleString()}元` : '',
    },
    {
      key: 'freeze_position',
      label: '冻结持仓',
      icon: Goods,
      isActive: actions.includes(InterceptionAction.FREEZE_POSITION),
      extra: record.value.freezePositionCodes?.length ? `${record.value.freezePositionCodes.length}只` : '',
    },
    {
      key: 'restrict_operation',
      label: '限制操作',
      icon: Warning,
      isActive: actions.includes(InterceptionAction.RESTRICT_OPERATION),
      extra: '',
    },
    {
      key: 'warn_only',
      label: '仅警告',
      icon: Bell,
      isActive: actions.includes(InterceptionAction.WARN_ONLY),
      extra: '',
    },
  ]
})

const accountRiskTagType = computed(() => {
  if (!accountRiskStatus.value) return 'info'
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    normal: 'success',
    watch: 'info',
    warning: 'warning',
    critical: 'danger',
  }
  return map[accountRiskStatus.value.riskLevel] || 'info'
})

const accountRiskLabel = computed(() => {
  if (!accountRiskStatus.value) return '未查询'
  if (accountRiskStatus.value.isRestricted) return '已限制'
  return accountRiskLevelMap[accountRiskStatus.value.riskLevel]
})

function getInterceptionStatusLabel(s: string): string {
  return INTERCEPTION_STATUS_LABELS[s as InterceptionStatus] || s
}

function getInterceptionLevelLabel(l: string): string {
  return INTERCEPTION_LEVEL_LABELS[l as InterceptionLevel] || l
}

function getInterceptionLevelColor(l: string): string {
  return INTERCEPTION_LEVEL_COLORS[l as InterceptionLevel] || '#909399'
}

function getInterceptionLevelBgColor(l: string): string {
  return INTERCEPTION_LEVEL_BG_COLORS[l as InterceptionLevel] || 'rgba(144,147,153,0.1)'
}

function getSideLabel(side?: string): string {
  if (!side) return '-'
  return SIDE_LABELS[side] || side
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

function getStatusIcon(s: string): any {
  const map: Record<string, any> = {
    [InterceptionStatus.TEMPORARY]: Timer,
    [InterceptionStatus.PERMANENT]: Ban,
    [InterceptionStatus.MANUAL_REVIEW]: User,
    [InterceptionStatus.APPEALING]: Warning,
    [InterceptionStatus.APPEAL_PASSED]: Finished,
    [InterceptionStatus.APPEAL_REJECTED]: Close,
    [InterceptionStatus.AUTO_RELEASED]: Unlock,
  }
  return map[s] || Warning
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#F56C6C'
  if (score >= 60) return '#E6A23C'
  if (score >= 40) return '#409EFF'
  return '#909399'
}

function handleUpdateVisible(val: boolean) {
  emit('update:visible', val)
}

function handleClose() {
  emit('update:visible', false)
}

async function loadDetail() {
  if (!props.interceptionId) return
  loading.value = true
  try {
    const res = await interceptionApi.getInterceptionById(props.interceptionId)
    if (res.code === 0) {
      record.value = res.data
      handleForm.releaseFundAmount = res.data.freezeFundAmount || 0
      try {
        const riskRes = await interceptionApi.getAccountRiskStatus(res.data.customerId)
        if (riskRes.code === 0) {
          accountRiskStatus.value = riskRes.data
        }
      } catch (e) {
        // 忽略
      }
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

function triggerShake() {
  shouldShake.value = true
  setTimeout(() => {
    shouldShake.value = false
  }, 500)
}

async function handleSubmit() {
  if (!record.value) return
  if (!handleForm.remark || handleForm.remark.trim().length < 4) {
    ElMessage.warning('请输入处理说明（至少4个字符）')
    triggerShake()
    return
  }

  submitting.value = true
  try {
    if (handleMode.value === 'release') {
      const res = await interceptionApi.releaseInterception(record.value.id, handleForm.remark)
      if (res.code === 0) {
        ElMessage.success('解除成功，客户相关权限已恢复')
        ElNotification({
          type: 'success',
          title: '拦截解除通知',
          message: `客户 ${record.value.customerName} 的${INTERCEPTION_TYPE_LABELS[record.value.interceptionType as keyof typeof INTERCEPTION_TYPE_LABELS] || '交易'}拦截已解除`,
          duration: 3500,
        })
        emit('action-success')
        handleUpdateVisible(false)
      } else {
        ElMessage.error(res.message)
        triggerShake()
      }
    } else if (handleMode.value === 'status') {
      const data: IInterceptionHandleData = {
        interceptionId: record.value.id,
        targetStatus: handleForm.targetStatus,
        remark: handleForm.remark,
        sendAlert: handleForm.sendAlert,
        notifyCustomer: handleForm.notifyCustomer,
      }
      const res = await interceptionApi.handleInterception(data)
      if (res.code === 0) {
        ElMessage.success('状态变更成功')
        emit('action-success')
        handleUpdateVisible(false)
      } else {
        ElMessage.error(res.message)
        triggerShake()
      }
    } else {
      const data: IInterceptionHandleData = {
        interceptionId: record.value.id,
        targetStatus: record.value.status,
        action: handleForm.adjustActions as any,
        releaseFundAmount: handleForm.releaseFundAmount,
        remark: handleForm.remark,
      }
      const res = await interceptionApi.handleInterception(data)
      if (res.code === 0) {
        ElMessage.success('措施调整成功')
        emit('action-success')
        handleUpdateVisible(false)
      } else {
        ElMessage.error(res.message)
        triggerShake()
      }
    }
  } catch (e: any) {
    ElMessage.error(e.message || '处理失败')
    triggerShake()
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.visible, props.interceptionId],
  ([visible, id]) => {
    if (visible && id) {
      handleMode.value = 'release'
      handleForm.remark = ''
      handleForm.releaseFunds = true
      handleForm.releasePositions = true
      handleForm.targetStatus = InterceptionStatus.TEMPORARY
      handleForm.adjustActions = []
      handleForm.sendAlert = true
      handleForm.notifyCustomer = false
      nextTick(() => loadDetail())
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.detail-dialog {
  max-height: 72vh;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, rgba(26, 58, 92, 0.06) 0%, rgba(245, 108, 108, 0.06) 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  color: #fff;
  width: fit-content;

  &.banner-temporary { background: linear-gradient(135deg, #E6A23C, #F0C78E); }
  &.banner-permanent { background: linear-gradient(135deg, #D93025, #F56C6C); }
  &.banner-manual_review { background: linear-gradient(135deg, #409EFF, #66B1FF); }
  &.banner-appealing { background: linear-gradient(135deg, #909399, #A6A9AD); }
  &.banner-appeal_passed { background: linear-gradient(135deg, #67C23A, #85CE61); }
  &.banner-appeal_rejected { background: linear-gradient(135deg, #F56C6C, #F78989); }
  &.banner-auto_released { background: linear-gradient(135deg, #606266, #8492A6); }
}

.no-text {
  font-size: 13px;
  color: #606266;
}

.code-text {
  font-family: monospace;
  color: #409EFF;
}

.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;

  .el-icon { font-size: 16px; }
}

.risk-score-box {
  text-align: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
}

.score-label {
  font-size: 11px;
  color: #8492A6;
  margin-bottom: 2px;
}

.score-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'DIN', monospace;
  line-height: 1;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.grid-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #E4E7ED;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #F5F7FA;
  font-size: 14px;
  font-weight: 600;
  color: #1F2D3D;
  border-bottom: 1px solid #E4E7ED;

  .el-icon { color: #409EFF; }
}

.badge-count {
  display: inline-block;
  min-width: 20px;
  padding: 0 6px;
  margin-left: 4px;
  background: #F56C6C;
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 18px;
}

.grid-section :deep(.el-descriptions) {
  padding: 8px 16px 16px;
}

.stock-name {
  font-weight: 600;
  color: #1F2D3D;
}

.amount-highlight {
  font-size: 16px;
  font-weight: 700;
  color: #F56C6C;
}

.section-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #E4E7ED;
  overflow: hidden;
  margin-bottom: 16px;
}

.rules-detail-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-detail-card {
  border: 1px solid #E4E7ED;
  border-left: 4px solid #909399;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;

  &.severity-error {
    border-left-color: #F56C6C;
    background: linear-gradient(90deg, rgba(245, 108, 108, 0.04) 0%, #fff 30%);
  }

  &.severity-warning {
    border-left-color: #E6A23C;
    background: linear-gradient(90deg, rgba(230, 162, 60, 0.04) 0%, #fff 30%);
  }

  &.severity-info {
    border-left-color: #409EFF;
  }
}

.rule-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #FAFBFC;
  border-bottom: 1px solid #F2F6FC;
}

.rule-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-code {
  font-size: 12px;
  color: #8492A6;
  font-family: monospace;
}

.rule-card-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.dot-error { background: #F56C6C; box-shadow: 0 0 6px #F56C6C; }
  &.dot-warning { background: #E6A23C; box-shadow: 0 0 6px #E6A23C; }
  &.dot-info { background: #409EFF; }
}

.rule-card-body {
  padding: 14px 16px;
}

.rule-reason {
  font-size: 14px;
  color: #1F2D3D;
  line-height: 1.6;
  margin-bottom: 12px;
}

.rule-compare {
  display: grid;
  grid-template-columns: 1fr 40px 1fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: #FAFBFC;
  border-radius: 6px;
  margin-bottom: 12px;
}

.compare-box {
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
  background: #fff;
  border: 1px solid #E4E7ED;

  &.actual {
    border-color: #F56C6C;
    background: #FEF0F0;
  }
}

.compare-label {
  font-size: 11px;
  color: #8492A6;
  margin-bottom: 4px;
}

.compare-value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'DIN', monospace;
  color: #1F2D3D;

  .actual & { color: #F56C6C; }
}

.compare-arrow {
  display: flex;
  justify-content: center;
  color: #8492A6;
}

.compare-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #F56C6C;
}

.rule-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  padding: 8px 12px;
  background: #ECF5FF;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 16px;
}

.action-item {
  padding: 14px;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
  background: #FAFBFC;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  transition: all 0.3s ease;

  &.active {
    border-color: #F56C6C;
    background: linear-gradient(180deg, rgba(245, 108, 108, 0.06) 0%, #fff 100%);
  }
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #F5F7FA;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  transition: all 0.3s ease;

  &.icon-active {
    background: rgba(245, 108, 108, 0.12);
    color: #F56C6C;
  }
}

.action-name {
  font-size: 13px;
  font-weight: 500;
  color: #1F2D3D;
}

.action-status {
  font-size: 11px;
  color: #8492A6;
  display: inline-flex;
  align-items: center;
  gap: 3px;

  .action-item.active & { color: #F56C6C; }
}

.action-extra {
  font-size: 12px;
  font-weight: 600;
  color: #F56C6C;
  font-family: 'DIN', monospace;
}

.restriction-expire {
  padding: 0 16px 16px;
  font-size: 13px;
  color: #E6A23C;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.account-risk-summary {
  padding: 16px;
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 20px;
  align-items: center;
}

.risk-level-badge {
  padding: 16px 10px;
  border-radius: 8px;
  text-align: center;
  background: #F5F7FA;
  border: 1px solid #E4E7ED;

  &.level-normal { background: #F0F9EB; border-color: #67C23A; }
  &.level-watch { background: #ECF5FF; border-color: #409EFF; }
  &.level-warning { background: #FDF6EC; border-color: #E6A23C; }
  &.level-critical { background: #FEF0F0; border-color: #F56C6C; }
}

.level-text {
  font-size: 18px;
  font-weight: 700;

  .level-normal & { color: #67C23A; }
  .level-watch & { color: #409EFF; }
  .level-warning & { color: #E6A23C; }
  .level-critical & { color: #F56C6C; }
}

.risk-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.info-item {
  padding: 10px 12px;
  background: #FAFBFC;
  border-radius: 6px;
}

.info-label {
  display: block;
  font-size: 11px;
  color: #8492A6;
  margin-bottom: 4px;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
  font-family: 'DIN', monospace;

  &.danger { color: #F56C6C; }
  &.warning { color: #E6A23C; }
  &.primary { color: #409EFF; }
}

.restrictions-list {
  padding: 0 16px 16px;
}

.restrictions-title {
  font-size: 12px;
  color: #8492A6;
  margin-bottom: 8px;
}

.mr-4 { margin-right: 8px; }
.mb-16 { margin-bottom: 16px; }
.ml-20 { margin-left: 20px; }

.handle-section {
  margin-bottom: 0;
}

.handle-tabs {
  padding: 16px 16px 0;
}

.handle-content {
  padding: 16px;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #8492A6;
}

.handle-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px 20px;
  border-top: 1px solid #F2F6FC;

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
</style>
