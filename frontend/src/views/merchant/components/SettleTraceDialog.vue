<template>
  <el-dialog
    v-model="dialogVisible"
    title="结算全链路溯源"
    width="1240px"
    top="4vh"
    :close-on-click-modal="false"
    destroy-on-close>
    <div v-loading="loading" class="settle-trace-wrapper">
      <template v-if="fullTrace.basic">
        <div class="trace-banner">
          <div class="banner-left">
            <div class="banner-row">
              <el-tag type="primary" effect="dark" size="large" class="mr12">{{ fullTrace.basic.apply_no }}</el-tag>
              <el-tag :type="getStatusTagType(fullTrace.basic.status)" effect="dark" size="large">
                {{ getStatusLabel(fullTrace.basic.status) }}
              </el-tag>
            </div>
            <div class="banner-row mt8">
              <el-icon><Shop /></el-icon>
              <span class="ml6 merchant-name">{{ fullTrace.basic.merchant_name }}</span>
              <el-tag v-if="fullTrace.basic.certification_status === 2" type="success" size="small" class="ml8">已认证</el-tag>
              <el-tag v-else size="small" type="info" class="ml8">未认证</el-tag>
            </div>
            <div class="banner-row mt8">
              <el-icon><Location /></el-icon>
              <span class="ml6 text-sm">{{ fullTrace.basic.shop_name }}</span>
              <el-tag class="ml8" size="small" type="info">{{ getPeriodLabel(fullTrace.basic.period_type) }}</el-tag>
              <span class="ml8 text-sm text-muted">{{ fullTrace.basic.period_start }} ~ {{ fullTrace.basic.period_end }}</span>
            </div>
          </div>
          <div class="banner-right">
            <div class="amount-row">
              <div class="amount-label">实际结算金额</div>
              <div class="amount-value">¥{{ formatNumber(fullTrace.basic.actual_amount, 2) }}</div>
            </div>
            <div class="bank-row mt8">
              <el-icon><Wallet /></el-icon>
              <span class="ml6">{{ fullTrace.basic.bank_name }} · {{ fullTrace.basic.bank_account_no?.slice(-4) || '----' }}</span>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="mt16">
          <el-tab-pane label="申请单档案" name="profile">
            <el-descriptions :column="3" border size="default">
              <el-descriptions-item label="申请单号" :span="2">{{ fullTrace.basic.apply_no }}</el-descriptions-item>
              <el-descriptions-item label="申请来源">
                {{ getApplySourceLabel(fullTrace.basic.apply_source) }}
              </el-descriptions-item>
              <el-descriptions-item label="商家名称">{{ fullTrace.basic.merchant_name }}</el-descriptions-item>
              <el-descriptions-item label="店铺名称">{{ fullTrace.basic.shop_name }}</el-descriptions-item>
              <el-descriptions-item label="认证状态">
                <el-tag v-if="fullTrace.basic.certification_status === 2" type="success">已认证</el-tag>
                <el-tag v-else-if="fullTrace.basic.certification_status === 1" type="warning">认证中</el-tag>
                <el-tag v-else type="info">未认证</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="结算周期">{{ getPeriodLabel(fullTrace.basic.period_type) }}</el-descriptions-item>
              <el-descriptions-item label="周期起始">{{ fullTrace.basic.period_start }}</el-descriptions-item>
              <el-descriptions-item label="周期结束">{{ fullTrace.basic.period_end }}</el-descriptions-item>
              <el-descriptions-item label="基础金额">
                <span class="num-text">¥{{ formatNumber(fullTrace.basic.base_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="平台手续费">
                <span class="primary-text">-¥{{ formatNumber(fullTrace.basic.platform_fee, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="售后扣减">
                <span class="warning-text">-¥{{ formatNumber(fullTrace.basic.aftersale_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="违规罚款">
                <span class="danger-text">-¥{{ formatNumber(fullTrace.basic.violation_fine, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="保证金">
                <span class="info-text">-¥{{ formatNumber(fullTrace.basic.deposit_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="其他扣减">
                <span>-¥{{ formatNumber(fullTrace.basic.other_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="扣减合计">
                <span class="danger-text">-¥{{ formatNumber(fullTrace.basic.total_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="实际结算" :span="2">
                <span class="actual-amount">¥{{ formatNumber(fullTrace.basic.actual_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="申请状态">
                <el-tag :type="getStatusTagType(fullTrace.basic.status)">{{ getStatusLabel(fullTrace.basic.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开户银行">{{ fullTrace.basic.bank_name }}</el-descriptions-item>
              <el-descriptions-item label="开户支行">{{ fullTrace.basic.bank_branch }}</el-descriptions-item>
              <el-descriptions-item label="开户名">{{ fullTrace.basic.bank_account_name }}</el-descriptions-item>
              <el-descriptions-item label="银行账号">
                **** **** **** {{ fullTrace.basic.bank_account_no?.slice(-4) || '----' }}
              </el-descriptions-item>
              <el-descriptions-item label="认证状态">
                <el-tag :type="getBankVerifyTagType(fullTrace.basic.bank_verify_status)">
                  {{ getBankVerifyLabel(fullTrace.basic.bank_verify_status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="申请时间" :span="2">{{ formatDateTime(fullTrace.basic.apply_time) }}</el-descriptions-item>
              <el-descriptions-item label="审核时间">{{ fullTrace.basic.audit_time ? formatDateTime(fullTrace.basic.audit_time) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="打款时间">{{ fullTrace.basic.pay_time ? formatDateTime(fullTrace.basic.pay_time) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="到账时间">{{ fullTrace.basic.arrive_time ? formatDateTime(fullTrace.basic.arrive_time) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="驳回原因" v-if="fullTrace.basic.reject_reason" :span="3">
                <span class="danger-text">{{ fullTrace.basic.reject_reason }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="打款失败原因" v-if="fullTrace.basic.pay_fail_reason" :span="3">
                <span class="danger-text">{{ fullTrace.basic.pay_fail_reason }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="备注" v-if="fullTrace.basic.remark" :span="3">
                {{ fullTrace.basic.remark }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="扣减明细" name="deduct">
            <el-table :data="fullTrace.deduct_details" border stripe show-summary :summary-method="getDeductSummaries">
              <el-table-column label="序号" type="index" width="60" align="center" />
              <el-table-column label="扣减类型" width="140" align="center">
                <template #default="{ row }">
                  <el-tag :style="{ borderColor: getDeductColor(row.deduct_type), color: getDeductColor(row.deduct_type) }" size="small">
                    {{ getDeductLabel(row.deduct_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="所属分类" width="120" align="center">
                <template #default="{ row }">
                  {{ getDeductBranchLabel(row.deduct_branch) }}
                </template>
              </el-table-column>
              <el-table-column label="关联单号" width="200" prop="related_no" show-overflow-tooltip />
              <el-table-column label="扣减金额" width="140" align="right">
                <template #default="{ row }">
                  <span class="danger-text">-¥{{ formatNumber(row.deduct_amount, 2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="说明" prop="description" show-overflow-tooltip />
              <el-table-column label="操作人" width="110" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
              <el-table-column label="创建时间" width="170" align="center">
                <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && fullTrace.deduct_details.length === 0" description="暂无扣减记录" />
          </el-tab-pane>

          <el-tab-pane label="审核日志" name="audit">
            <el-table :data="fullTrace.audit_logs" border stripe>
              <el-table-column label="操作时间" width="170" align="center" prop="created_at" sortable>
                <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="操作类型" width="130" align="center">
                <template #default="{ row }">
                  <el-tag :type="getAuditTagType(row.action)" size="small">
                    {{ getAuditActionLabel(row.action) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态流转" width="240" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.status_before)">{{ getStatusLabel(row.status_before) }}</el-tag>
                  <span class="mx8">→</span>
                  <el-tag size="small" :type="getStatusTagType(row.status_after)">{{ getStatusLabel(row.status_after) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="110" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="200" show-overflow-tooltip prop="remark">
                <template #default="{ row }">
                  <span v-if="row.remark">{{ row.remark }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && fullTrace.audit_logs.length === 0" description="暂无审核记录" />
          </el-tab-pane>

          <el-tab-pane label="到账凭证" name="voucher">
            <template v-if="fullTrace.pay_voucher">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="银行流水号">{{ fullTrace.pay_voucher.bank_serial_no }}</el-descriptions-item>
                <el-descriptions-item label="打款金额">
                  <span class="actual-amount">¥{{ formatNumber(fullTrace.pay_voucher.pay_amount, 2) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="付款银行">{{ fullTrace.pay_voucher.pay_bank_name }}</el-descriptions-item>
                <el-descriptions-item label="收款银行">{{ fullTrace.pay_voucher.receive_bank_name }}</el-descriptions-item>
                <el-descriptions-item label="打款时间" :span="2">
                  {{ formatDateTime(fullTrace.pay_voucher.pay_time) }}
                </el-descriptions-item>
              </el-descriptions>
              <div class="voucher-preview mt16" v-if="fullTrace.pay_voucher.voucher_image">
                <div class="preview-title">凭证预览</div>
                <el-image
                  :src="fullTrace.pay_voucher.voucher_image"
                  :preview-src-list="[fullTrace.pay_voucher.voucher_image]"
                  fit="contain"
                  class="voucher-image" />
              </div>
            </template>
            <el-empty v-else description="暂无到账凭证记录" />
          </el-tab-pane>

          <el-tab-pane label="关联订单" name="orders">
            <el-table :data="fullTrace.related_orders" border stripe show-summary :summary-method="getOrderSummaries">
              <el-table-column label="序号" type="index" width="60" align="center" />
              <el-table-column label="订单号" width="200" prop="order_no" show-overflow-tooltip />
              <el-table-column label="订单金额" width="140" align="right">
                <template #default="{ row }">
                  <span>¥{{ formatNumber(row.order_amount, 2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="结算金额" width="140" align="right">
                <template #default="{ row }">
                  <span class="success-text">¥{{ formatNumber(row.settle_amount, 2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="完成时间" width="170" align="center">
                <template #default="{ row }">{{ formatDateTime(row.completed_at) }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && fullTrace.related_orders.length === 0" description="暂无关联订单" />
          </el-tab-pane>

          <el-tab-pane label="一致性校验" name="consistency">
            <div class="consistency-header">
              <div class="pass-rate-bar">
                <el-progress
                  :percentage="Math.round(fullTrace.consistency_check.pass_rate)"
                  :stroke-width="18"
                  :color="fullTrace.consistency_check.failed_items === 0 ? '#67C23A' : '#E6A23C'" />
              </div>
              <div class="check-stats">
                <el-tag type="success" size="large">通过 {{ fullTrace.consistency_check.passed_items }} 项</el-tag>
                <el-tag v-if="fullTrace.consistency_check.failed_items > 0" type="danger" size="large" class="ml12">
                  失败 {{ fullTrace.consistency_check.failed_items }} 项
                </el-tag>
                <el-tag type="info" size="large" class="ml12">共 {{ fullTrace.consistency_check.total_items }} 项</el-tag>
              </div>
            </div>
            <el-table :data="fullTrace.consistency_check.results" border stripe class="mt16">
              <el-table-column label="序号" type="index" width="60" align="center" />
              <el-table-column label="校验项" width="180" prop="name" />
              <el-table-column label="结果" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.passed" type="success" size="small">
                    <el-icon class="mr4"><CircleCheckFilled /></el-icon>通过
                  </el-tag>
                  <el-tag v-else type="danger" size="small">
                    <el-icon class="mr4"><CircleCloseFilled /></el-icon>失败
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="说明" min-width="200" prop="message">
                <template #default="{ row }">
                  <span v-if="row.message" :class="row.passed ? '' : 'danger-text'">{{ row.message }}</span>
                  <span v-else class="text-muted">校验通过</span>
                </template>
              </el-table-column>
              <el-table-column label="期望值" width="160">
                <template #default="{ row }">
                  <span v-if="row.expected">{{ row.expected }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="实际值" width="160">
                <template #default="{ row }">
                  <span v-if="row.actual" :class="row.passed ? '' : 'danger-text'">{{ row.actual }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="全链路时间轴" name="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(item, idx) in fullTrace.timeline"
                :key="idx"
                :timestamp="formatDateTime(item.timestamp)"
                :type="getTimelineType(item.type)"
                placement="top">
                <div class="timeline-item">
                  <div class="timeline-title">
                    <el-icon><component :is="getTimelineIcon(item.type)" /></el-icon>
                    <span class="ml6">{{ item.title }}</span>
                  </div>
                  <div v-if="item.content" class="timeline-content mt4 text-sm">{{ item.content }}</div>
                  <div v-if="item.operator" class="timeline-operator mt4 text-xs text-muted">
                    操作人：{{ item.operator }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-if="!loading && fullTrace.timeline.length === 0" description="暂无时间轴记录" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Shop, Location, Wallet,
  CircleCheckFilled, CircleCloseFilled,
  Document, EditPen, CreditCard, Money, Box, Promotion
} from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/common'
import {
  SETTLE_PERIOD_OPTIONS, APPLY_STATUS_OPTIONS, DEDUCT_TYPE_OPTIONS, AUDIT_ACTION_OPTIONS,
  APPLY_SOURCE_OPTIONS, BANK_VERIFY_OPTIONS, DEDUCT_BRANCH_LABEL,
  getSettleFullTrace,
  type SettleApplyItem, type SettleDeductItem, type SettleAuditItem
} from '@/api/merchantSettle'

const props = defineProps<{
  modelValue: boolean
  settleId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const loading = ref(false)
const activeTab = ref('profile')
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const fullTrace = reactive<{
  basic: Partial<SettleApplyItem>
  deduct_details: SettleDeductItem[]
  audit_logs: SettleAuditItem[]
  pay_voucher?: {
    id: number
    bank_serial_no: string
    pay_amount: number
    pay_bank_name: string
    receive_bank_name: string
    voucher_image?: string
    pay_time: string
  }
  related_orders: Array<{
    id: number
    order_no: string
    order_amount: number
    settle_amount: number
    completed_at: string
  }>
  consistency_check: {
    total_items: number
    passed_items: number
    failed_items: number
    pass_rate: number
    results: Array<{
      name: string
      passed: boolean
      message?: string
      expected?: string
      actual?: string
    }>
  }
  timeline: Array<{
    id: number
    timestamp: string
    title: string
    type: 'apply' | 'audit' | 'pay' | 'arrive' | 'deduct' | 'voucher' | 'retry'
    content?: string
    operator?: string
    type_color?: string
  }>
}>({
  basic: {},
  deduct_details: [],
  audit_logs: [],
  related_orders: [],
  consistency_check: {
    total_items: 0, passed_items: 0, failed_items: 0, pass_rate: 0, results: [],
  },
  timeline: [],
})

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const getPeriodLabel = (t?: number) => SETTLE_PERIOD_OPTIONS.find(o => o.value === t)?.label || '-'
const getStatusLabel = (s?: number) => APPLY_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getStatusTagType = (s?: number): TagType => {
  const o = APPLY_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getDeductLabel = (t?: number) => DEDUCT_TYPE_OPTIONS.find(o => o.value === t)?.label || '-'
const getDeductColor = (t?: number) => DEDUCT_TYPE_OPTIONS.find(o => o.value === t)?.color || '#909399'
const getDeductBranchLabel = (b?: number) => DEDUCT_BRANCH_LABEL[b || 1] || '-'
const getAuditActionLabel = (a?: number) => AUDIT_ACTION_OPTIONS.find(o => o.value === a)?.label || '-'
const getApplySourceLabel = (s?: number) => APPLY_SOURCE_OPTIONS.find(o => o.value === s)?.label || '-'
const getBankVerifyLabel = (s?: number) => BANK_VERIFY_OPTIONS.find(o => o.value === s)?.label || '未知'
const getBankVerifyTagType = (s?: number): TagType => {
  const o = BANK_VERIFY_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}

const getAuditTagType = (action?: number): TagType => {
  const map: Record<number, TagType> = {
    1: 'primary', 2: 'success', 3: 'danger', 4: 'info', 5: 'success', 6: 'danger', 7: 'warning',
  }
  return map[action || 0] || 'info'
}

const getTimelineType = (type: string): TagType => {
  const map: Record<string, TagType> = {
    apply: 'primary', audit: 'warning', pay: 'info', arrive: 'success',
    deduct: 'danger', voucher: 'success', retry: 'warning',
  }
  return map[type] || 'primary'
}

const getTimelineIcon = (type: string) => {
  const map: Record<string, any> = {
    apply: EditPen, audit: Document, pay: CreditCard, arrive: Money,
    deduct: Promotion, voucher: Box, retry: Promotion,
  }
  return map[type] || Document
}

const formatDateTime = (t?: string) => {
  if (!t) return '-'
  return t.replace('T', ' ').slice(0, 19)
}

const getDeductSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((col: any, idx: number) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (col.label === '扣减金额') {
      const total = data.reduce((s: number, r: SettleDeductItem) => s + Number(r.deduct_amount || 0), 0)
      sums[idx] = `-¥${formatNumber(total, 2)}`
      return
    }
    sums[idx] = ''
  })
  return sums
}

const getOrderSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((col: any, idx: number) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (col.label === '订单金额') {
      const total = data.reduce((s: number, r: any) => s + Number(r.order_amount || 0), 0)
      sums[idx] = `¥${formatNumber(total, 2)}`
      return
    }
    if (col.label === '结算金额') {
      const total = data.reduce((s: number, r: any) => s + Number(r.settle_amount || 0), 0)
      sums[idx] = `¥${formatNumber(total, 2)}`
      return
    }
    sums[idx] = ''
  })
  return sums
}

const loadFullTrace = async () => {
  if (!props.settleId) return
  loading.value = true
  try {
    const res = await getSettleFullTrace(props.settleId)
    Object.assign(fullTrace, res.data.data)
  } finally {
    loading.value = false
  }
}

watch(() => [props.modelValue, props.settleId], ([visible, id]) => {
  if (visible && id) {
    activeTab.value = 'profile'
    loadFullTrace()
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.mt4 { margin-top: 4px; }
.mt8 { margin-top: 8px; }
.mt16 { margin-top: 16px; }
.ml6 { margin-left: 6px; }
.ml8 { margin-left: 8px; }
.ml12 { margin-left: 12px; }
.mr4 { margin-right: 4px; }
.mr8 { margin-right: 8px; }
.mr12 { margin-right: 12px; }
.mx8 { margin: 0 8px; }
.text-sm { font-size: 13px; }
.text-xs { font-size: 12px; }
.text-muted { color: var(--el-text-color-secondary); }
.num-text { font-weight: 600; color: var(--el-text-color-primary); }
.primary-text { color: var(--el-color-primary); font-weight: 600; }
.warning-text { color: var(--el-color-warning); font-weight: 600; }
.danger-text { color: var(--el-color-danger); font-weight: 600; }
.info-text { color: var(--el-color-info); font-weight: 600; }
.success-text { color: var(--el-color-success); font-weight: 600; }
.actual-amount { font-weight: 700; color: var(--el-color-primary); font-size: 16px; }

.settle-trace-wrapper {
  .trace-banner {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 20px 24px; border-radius: 12px;
    background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
    color: #fff;
    .banner-left {
      flex: 1;
      .banner-row { display: flex; align-items: center; flex-wrap: wrap; }
      .merchant-name { font-size: 16px; font-weight: 600; }
      :deep(.el-tag) { --el-tag-border-color: rgba(255,255,255,.3); }
      .text-muted { color: rgba(255,255,255,.8); }
    }
    .banner-right {
      text-align: right; min-width: 280px;
      .amount-row {
        .amount-label { font-size: 13px; opacity: .9; }
        .amount-value { font-size: 32px; font-weight: 700; margin-top: 4px; line-height: 1.1; }
      }
      .bank-row {
        padding: 6px 12px; background: rgba(255,255,255,.15); border-radius: 20px;
        display: inline-flex; align-items: center; font-size: 13px;
      }
    }
  }

  .consistency-header {
    display: flex; align-items: center; gap: 24px; padding: 16px 20px;
    background: var(--el-fill-color-light); border-radius: 8px;
    .pass-rate-bar { flex: 1; max-width: 480px; }
    .check-stats { display: flex; flex-wrap: wrap; }
  }

  .voucher-preview {
    padding: 16px; background: var(--el-fill-color-light); border-radius: 8px;
    .preview-title { font-weight: 600; margin-bottom: 12px; }
    .voucher-image {
      width: 100%; max-height: 420px; background: #fff;
      border: 1px solid var(--el-border-color-lighter); border-radius: 6px;
    }
  }

  .timeline-item {
    .timeline-title { display: flex; align-items: center; font-weight: 600; font-size: 14px; }
  }
}
</style>
