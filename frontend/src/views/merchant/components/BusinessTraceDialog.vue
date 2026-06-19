<template>
  <el-dialog
    v-model="dialogVisible"
    title="经营数据全链路溯源"
    width="1200px"
    top="4vh"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="business-trace-wrapper">
      <template v-if="fullTrace.basic">
        <div class="business-banner">
          <div class="bb-left">
            <el-avatar :size="60" :src="fullTrace.basic.shop_logo">{{ (fullTrace.basic.shop_name || fullTrace.basic.merchant_name || '').slice(0, 1) }}</el-avatar>
            <div class="bb-info">
              <div class="bb-name">
                <h3>{{ fullTrace.basic.shop_name || fullTrace.basic.merchant_name }}</h3>
                <el-tag :type="getDataStatusTagType(fullTrace.basic.data_status)" class="ml8">
                  {{ getDataStatusLabel(fullTrace.basic.data_status) }}
                </el-tag>
              </div>
              <div class="bb-meta">
                <span class="mr16">商家：{{ fullTrace.basic.merchant_name }}</span>
                <span class="mr16">周期：{{ fullTrace.basic.stat_period_text }}</span>
                <span class="mr16">{{ fullTrace.basic.stat_start_date }} ~ {{ fullTrace.basic.stat_end_date }}</span>
                <span>类目：{{ fullTrace.basic.shop_category || '-' }}</span>
              </div>
              <div class="bb-tags mt4">
                <el-tag :type="getRiskTagType(fullTrace.basic.risk_level)" size="small" class="mr6" effect="dark">
                  {{ getRiskLabel(fullTrace.basic.risk_level) }}
                </el-tag>
                <el-tag :type="getQualityTagType(fullTrace.basic.quality_level)" size="small" class="mr6" effect="dark">
                  {{ getQualityLabel(fullTrace.basic.quality_level) }}
                </el-tag>
                <el-tag v-if="fullTrace.basic.abnormal_flag" type="danger" size="small" effect="dark" class="mr6">
                  异常{{ fullTrace.basic.abnormal_count || 1 }}项
                </el-tag>
              </div>
            </div>
          </div>
          <div class="bb-right">
            <el-alert
              v-if="!fullTrace.accuracy_check.passed"
              :title="`准确性得分：${fullTrace.accuracy_check.score}分，检测到 ${fullTrace.accuracy_check.issues.length} 项问题`"
              type="warning" show-icon :closable="false" />
            <el-alert v-else :title="`准确性校验通过，得分：${fullTrace.accuracy_check.score}分`" type="success" show-icon :closable="false" />
            <div class="bb-issues mt8" v-if="fullTrace.accuracy_check.issues.length">
              <div v-for="(issue, idx) in fullTrace.accuracy_check.issues.slice(0, 3)" :key="idx" class="issue-item">
                <el-tag :type="issue.level === 'high' ? 'danger' : issue.level === 'medium' ? 'warning' : 'info'" size="small">
                  {{ issue.level === 'high' ? '高风险' : issue.level === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
                <span class="ml8">{{ getFieldLabel(issue.field) }}：{{ issue.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="mt16">
          <el-tab-pane label="经营数据档案" name="profile">
            <el-descriptions :column="3" border size="default">
              <el-descriptions-item label="店铺名称">{{ fullTrace.basic.shop_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="商家名称">{{ fullTrace.basic.merchant_name }}</el-descriptions-item>
              <el-descriptions-item label="统计周期">{{ fullTrace.basic.stat_period_text }}</el-descriptions-item>
              <el-descriptions-item label="开始日期">{{ fullTrace.basic.stat_start_date }}</el-descriptions-item>
              <el-descriptions-item label="结束日期">{{ fullTrace.basic.stat_end_date }}</el-descriptions-item>
              <el-descriptions-item label="经营类目">{{ fullTrace.basic.shop_category || '-' }}</el-descriptions-item>
              <el-descriptions-item label="订单数">
                <span class="num-text">{{ formatNumber(fullTrace.basic.order_count) }}</span> 单
              </el-descriptions-item>
              <el-descriptions-item label="有效订单数">
                <span class="num-text">{{ formatNumber(fullTrace.basic.valid_order_count) }}</span> 单
              </el-descriptions-item>
              <el-descriptions-item label="销售额">
                <span class="amount-text">¥{{ formatNumber(fullTrace.basic.sales_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="有效销售额">
                <span class="amount-text">¥{{ formatNumber(fullTrace.basic.valid_sales_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="已结算金额">
                <span class="success-text">¥{{ formatNumber(fullTrace.basic.settled_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="待结算金额">
                <span class="warning-text">¥{{ formatNumber(fullTrace.basic.pending_settlement_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="退款金额">
                <span class="danger-text">¥{{ formatNumber(fullTrace.basic.refund_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="客单价">
                ¥{{ formatNumber(fullTrace.basic.avg_order_amount, 2) }}
              </el-descriptions-item>
              <el-descriptions-item label="新客订单数">
                {{ formatNumber(fullTrace.basic.new_customer_order_count) }} 单
              </el-descriptions-item>
              <el-descriptions-item label="复购订单数">
                {{ formatNumber(fullTrace.basic.repeat_order_count) }} 单
              </el-descriptions-item>
              <el-descriptions-item label="好评数">
                <span class="success-text">{{ formatNumber(fullTrace.basic.positive_review_count) }}</span> 条
              </el-descriptions-item>
              <el-descriptions-item label="差评数">
                <span class="danger-text">{{ formatNumber(fullTrace.basic.negative_review_count) }}</span> 条
              </el-descriptions-item>
              <el-descriptions-item label="总评价数">
                {{ formatNumber(fullTrace.basic.total_review_count) }} 条
              </el-descriptions-item>
              <el-descriptions-item label="好评率" :span="3">
                <el-progress
                  :percentage="Number((fullTrace.basic.positive_review_rate * 100).toFixed(1))"
                  :stroke-width="12"
                  :color="fullTrace.basic.positive_review_rate >= 0.9 ? '#67C23A' : fullTrace.basic.positive_review_rate >= 0.7 ? '#E6A23C' : '#F56C6C'" />
              </el-descriptions-item>
              <el-descriptions-item label="数据状态">
                <el-tag :type="getDataStatusTagType(fullTrace.basic.data_status)">{{ getDataStatusLabel(fullTrace.basic.data_status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="getRiskTagType(fullTrace.basic.risk_level)">{{ getRiskLabel(fullTrace.basic.risk_level) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="质量等级">
                <el-tag :type="getQualityTagType(fullTrace.basic.quality_level)">{{ getQualityLabel(fullTrace.basic.quality_level) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间" :span="2">{{ fullTrace.basic.created_at }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ fullTrace.basic.updated_at }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="数据修正日志" name="correct">
            <el-table :data="fullTrace.correct_logs" border stripe>
              <el-table-column prop="operated_at" label="修正时间" width="180" align="center" sortable />
              <el-table-column label="字段名" width="140" align="center">
                <template #default="{ row }">
                  <el-tag type="info" size="small">{{ row.field_label || row.field_name }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="修正前值" width="160" align="right">
                <template #default="{ row }">
                  <span class="old-val">{{ formatAnyValue(row.value_before, row.field_name) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="修正后值" width="160" align="right">
                <template #default="{ row }">
                  <span class="new-val">{{ formatAnyValue(row.value_after, row.field_name) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="差值" width="120" align="right">
                <template #default="{ row }">
                  <span :class="Number(row.diff_value) > 0 ? 'success-text' : Number(row.diff_value) < 0 ? 'danger-text' : ''">
                    {{ formatAnyValue(row.diff_value, row.field_name, true) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="差异%" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.diff_percent !== null && row.diff_percent !== undefined" :type="getDiffTagType(row.diff_percent)" size="small">
                    {{ row.diff_percent > 0 ? '+' : '' }}{{ Number(row.diff_percent).toFixed(2) }}%
                  </el-tag>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="一致性校验" width="110" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.consistency_check" type="success" size="small">通过</el-tag>
                  <el-tag v-else type="warning" size="small">{{ row.consistency_warning || '异常' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="100" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="180" show-overflow-tooltip prop="remark">
                <template #default="{ row }">
                  <span v-if="row.remark">{{ row.remark }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && fullTrace.correct_logs.length === 0" description="暂无修正记录" />
          </el-tab-pane>

          <el-tab-pane label="等级评定记录" name="level">
            <el-table :data="fullTrace.level_records" border stripe>
              <el-table-column prop="operated_at" label="评定时间" width="180" align="center" sortable />
              <el-table-column label="等级变化" width="240" align="center">
                <template #default="{ row }">
                  <el-tag :type="getQualityTagType(row.old_level)" size="small">{{ getQualityLabel(row.old_level) }}</el-tag>
                  <span class="mx8">→</span>
                  <el-tag :type="getQualityTagType(row.new_level)" size="small">{{ getQualityLabel(row.new_level) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="排名变化" width="120" align="center">
                <template #default="{ row }">
                  <span :class="row.rank_change > 0 ? 'success-text' : row.rank_change < 0 ? 'danger-text' : ''">
                    {{ row.rank_change > 0 ? '↑' : row.rank_change < 0 ? '↓' : '-' }}
                    {{ Math.abs(row.rank_change) || 0 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="预估结算变化" width="160" align="right">
                <template #default="{ row }">
                  <span :class="row.estimated_settlement_change > 0 ? 'success-text' : row.estimated_settlement_change < 0 ? 'danger-text' : ''">
                    {{ row.estimated_settlement_change > 0 ? '+' : '' }}¥{{ formatNumber(row.estimated_settlement_change, 2) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="评定依据" min-width="260" show-overflow-tooltip prop="reason" />
              <el-table-column label="操作人" width="100" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && fullTrace.level_records.length === 0" description="暂无等级评定记录" />
          </el-tab-pane>

          <el-tab-pane label="异常波动记录" name="abnormal">
            <el-table :data="fullTrace.abnormal_records" border stripe>
              <el-table-column prop="detected_at" label="检测时间" width="180" align="center" sortable />
              <el-table-column label="异常字段" width="140" align="center">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.field_label || row.field_name }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="当前值" width="140" align="right">
                <template #default="{ row }">
                  <span class="num-text">{{ formatAnyValue(row.current_value, row.field_name) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="历史均值" width="140" align="right">
                <template #default="{ row }">
                  <span class="text-muted">{{ formatAnyValue(row.historical_avg, row.field_name) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="偏差%" width="120" align="center">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">
                    {{ row.deviation_percent > 0 ? '+' : '' }}{{ Number(row.deviation_percent).toFixed(2) }}%
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="异常类型" width="120" align="center">
                <template #default="{ row }">
                  {{ getAbnormalTypeLabel(row.abnormal_type) }}
                </template>
              </el-table-column>
              <el-table-column label="处理状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getAbnormalCheckTagType(row.check_status)" size="small">
                    {{ getAbnormalCheckLabel(row.check_status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="处理人" width="100" align="center">
                <template #default="{ row }">{{ row.handler_name || '-' }}</template>
              </el-table-column>
              <el-table-column label="处理备注" min-width="180" show-overflow-tooltip prop="handle_remark">
                <template #default="{ row }">
                  <span v-if="row.handle_remark">{{ row.handle_remark }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loading && fullTrace.abnormal_records.length === 0" description="暂无异常波动记录" />
          </el-tab-pane>

          <el-tab-pane label="关联订单明细" name="order">
            <el-table :data="fullTrace.order_details" border stripe>
              <el-table-column prop="order_no" label="订单号" min-width="200" />
              <el-table-column label="订单金额" width="160" align="right" sortable prop="amount">
                <template #default="{ row }">
                  <span class="amount-text">¥{{ formatNumber(row.amount, 2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="订单状态" width="120" align="center" prop="status">
                <template #default="{ row }">
                  <el-tag :type="row.status === 3 ? 'success' : row.status === 4 ? 'danger' : row.status === 2 ? 'info' : 'primary'" size="small">
                    {{ getOrderStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="completed_at" label="完成时间" width="180" align="center" sortable />
            </el-table>
            <el-empty v-if="!loading && fullTrace.order_details.length === 0" description="暂无关联订单" />
          </el-tab-pane>

          <el-tab-pane label="全链路时间轴" name="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(ev, idx) in fullTrace.timeline"
                :key="idx"
                :timestamp="ev.timestamp"
                :type="getTimelineType(ev.type)"
                placement="top">
                <div class="timeline-item-card">
                  <h5>{{ ev.title }}</h5>
                  <div class="timeline-type">{{ getTimelineTypeLabel(ev.type) }}</div>
                  <div class="timeline-operator mt4" v-if="ev.operator">操作人：{{ ev.operator }}</div>
                  <div class="timeline-content mt4" v-if="ev.content">{{ ev.content }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-if="!loading && fullTrace.timeline.length === 0" description="暂无时间轴记录" />
          </el-tab-pane>
        </el-tabs>
      </template>

      <el-empty v-if="!loading && !fullTrace.basic" description="暂无数据" />
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { formatNumber } from '@/utils/common'
import {
  getBusinessFullTrace,
  DATA_STATUS_OPTIONS, RISK_LEVEL_OPTIONS, QUALITY_LEVEL_OPTIONS,
  ABNORMAL_TYPE_OPTIONS, ABNORMAL_CHECK_STATUS_OPTIONS, BUSINESS_FIELD_OPTIONS,
} from '@/api/merchantBusiness'

const props = defineProps<{
  modelValue: boolean
  businessId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const loading = ref(false)
const activeTab = ref('profile')
const fullTrace = ref<any>({
  basic: null,
  correct_logs: [],
  level_records: [],
  abnormal_records: [],
  order_details: [],
  timeline: [],
  accuracy_check: { score: 100, passed: true, issues: [] },
})

const FIELD_LABEL_MAP: Record<string, string> = {}
const FIELD_UNIT_MAP: Record<string, string> = {}
BUSINESS_FIELD_OPTIONS.forEach(f => {
  FIELD_LABEL_MAP[f.value] = f.label
  FIELD_UNIT_MAP[f.value] = f.unit || ''
})

const getFieldLabel = (field: string) => FIELD_LABEL_MAP[field] || field

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getDataStatusLabel = (s?: number) => DATA_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getDataStatusTagType = (s?: number): TagType => {
  const o = DATA_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getRiskLabel = (r?: number) => RISK_LEVEL_OPTIONS.find(o => o.value === r)?.label || '-'
const getRiskTagType = (r?: number): TagType => {
  const o = RISK_LEVEL_OPTIONS.find(x => x.value === r)
  return (o?.type as TagType) || 'info'
}
const getQualityLabel = (q?: number) => QUALITY_LEVEL_OPTIONS.find(o => o.value === q)?.label || '-'
const getQualityTagType = (q?: number): TagType => {
  const o = QUALITY_LEVEL_OPTIONS.find(x => x.value === q)
  return (o?.type as TagType) || 'info'
}
const getAbnormalTypeLabel = (t?: number) => ABNORMAL_TYPE_OPTIONS.find(o => o.value === t)?.label || '-'
const getAbnormalCheckLabel = (s?: number) => ABNORMAL_CHECK_STATUS_OPTIONS.find(o => o.value === s)?.label || '-'
const getAbnormalCheckTagType = (s?: number): TagType => {
  const o = ABNORMAL_CHECK_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}

const getOrderStatusLabel = (s: number) => {
  const map: Record<number, string> = {
    0: '待支付', 1: '待发货', 2: '已发货', 3: '已完成', 4: '已取消'
  }
  return map[s] || '未知'
}

const formatAnyValue = (val: any, field?: string, withSign = false) => {
  if (val === null || val === undefined || val === '') return '-'
  const unit = field ? (FIELD_UNIT_MAP[field] || '') : ''
  const num = Number(val)
  if (!isNaN(num) && unit !== '%') {
    const decimals = unit === '元' ? 2 : 0
    const sign = withSign && num > 0 ? '+' : ''
    if (unit === '元') return `${sign}¥${formatNumber(num, decimals)}`
    return `${sign}${formatNumber(num, decimals)}${unit ? ' ' + unit : ''}`
  }
  if (unit === '%' && !isNaN(num)) {
    return `${(num * 100).toFixed(2)}%`
  }
  return String(val)
}

const getDiffTagType = (percent: number): TagType => {
  const abs = Math.abs(percent)
  if (abs >= 50) return 'danger'
  if (abs >= 20) return 'warning'
  return 'success'
}

const getTimelineType = (type: string): TagType => {
  const map: Record<string, TagType> = {
    create: 'primary',
    correct: 'warning',
    level: 'success',
    abnormal: 'danger',
    order_complete: 'info',
  }
  return map[type] || 'primary'
}

const getTimelineTypeLabel = (type: string) => ({
  create: '数据创建',
  correct: '数据修正',
  level: '等级评定',
  abnormal: '异常检测',
  order_complete: '订单完成',
}[type] || '操作记录')

const loadTrace = async () => {
  if (!props.businessId) return
  loading.value = true
  try {
    const res = await getBusinessFullTrace(props.businessId)
    fullTrace.value = res.data.data
  } finally {
    loading.value = false
  }
}

watch(() => [props.modelValue, props.businessId], ([visible, id]) => {
  if (visible && id) loadTrace()
})

onMounted(() => {
  if (props.modelValue && props.businessId) loadTrace()
})
</script>

<style scoped lang="scss">
.business-trace-wrapper { min-height: 400px; }
.ml4 { margin-left: 4px; }
.ml8 { margin-left: 8px; }
.mr6 { margin-right: 6px; }
.mr8 { margin-right: 8px; }
.mr16 { margin-right: 16px; }
.mt4 { margin-top: 4px; }
.mt8 { margin-top: 8px; }
.mt16 { margin-top: 16px; }
.mx8 { margin: 0 8px; }
.text-muted { color: var(--el-text-color-secondary); }
.success-text { color: var(--el-color-success); font-weight: 600; }
.warning-text { color: var(--el-color-warning); font-weight: 600; }
.danger-text { color: var(--el-color-danger); font-weight: 600; }
.amount-text { color: var(--el-color-primary); font-weight: 600; }
.num-text { font-weight: 600; color: var(--el-text-color-primary); }
.old-val { color: var(--el-color-danger); text-decoration: line-through; }
.new-val { color: var(--el-color-success); font-weight: 600; }
.business-banner {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 24px; padding: 16px 20px; border-radius: 10px;
  background: linear-gradient(135deg, #ecf5ff 0%, #fdf6ec 50%, #fef0f0 100%);
  border: 1px solid var(--el-border-color-lighter);
  .bb-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
  .bb-info { flex: 1; min-width: 0; }
  .bb-name { h3 { margin: 0; display: inline-block; } }
  .bb-meta { font-size: 13px; color: var(--el-text-color-regular); margin-top: 4px; line-height: 1.6; }
  .bb-tags { display: flex; gap: 4px; flex-wrap: wrap; }
  .bb-right { width: 440px; }
  .bb-issues {
    max-height: 96px; overflow: auto;
    .issue-item { font-size: 12px; line-height: 1.8; display: flex; align-items: center; }
  }
}
.timeline-item-card {
  padding: 10px 14px; background: var(--el-fill-color-lighter); border-radius: 6px;
  h5 { margin: 0 0 4px 0; color: var(--el-text-color-primary); font-size: 14px; }
  .timeline-type { font-size: 12px; color: var(--el-text-color-secondary); }
  .timeline-operator { font-size: 12px; color: var(--el-text-color-regular); }
  .timeline-content { font-size: 13px; color: var(--el-text-color-regular); line-height: 1.6; }
}
</style>
