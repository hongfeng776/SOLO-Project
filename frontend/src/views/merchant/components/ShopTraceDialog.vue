<template>
  <el-dialog
    v-model="dialogVisible"
    title="店铺全链路溯源"
    width="1200px"
    top="4vh"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="shop-trace-wrapper">
      <template v-if="fullTrace.merchant">
        <div class="merchant-banner">
          <div class="mb-left">
            <el-avatar :size="60" :src="fullTrace.merchant.shop_logo">{{ (fullTrace.merchant.shop_name || fullTrace.merchant.name || '').slice(0, 1) }}</el-avatar>
            <div class="mb-info">
              <div class="mb-name">
                <h3>{{ fullTrace.merchant.shop_name || fullTrace.merchant.name }}</h3>
                <el-tag type="success" class="ml8" v-if="fullTrace.merchant.shop_status === 1">正常营业</el-tag>
                <el-tag type="warning" class="ml8" v-else-if="fullTrace.merchant.shop_status === 2">停业整顿</el-tag>
                <el-tag type="warning" class="ml8" v-else-if="fullTrace.merchant.shop_status === 3">违规整改</el-tag>
                <el-tag type="danger" class="ml8" v-else>平台封禁</el-tag>
              </div>
              <div class="mb-meta">
                <span class="mr16">商家：{{ fullTrace.merchant.name }}</span>
                <span class="mr16">经营类目：{{ fullTrace.merchant.shop_category || '-' }}</span>
                <span class="mr16">等级：{{ getLevelLabel(fullTrace.merchant.shop_level) }}</span>
                <span>开店时长：{{ fullTrace.merchant.shop_operation_duration_days || 0 }}天</span>
              </div>
              <div class="mb-perms mt4">
                <el-tag :type="fullTrace.merchant.order_accept_permission ? 'success' : 'danger'" size="small" class="mr6">接单{{ fullTrace.merchant.order_accept_permission ? '允许' : '禁止' }}</el-tag>
                <el-tag :type="fullTrace.merchant.marketing_participate_permission ? 'success' : 'danger'" size="small" class="mr6">营销{{ fullTrace.merchant.marketing_participate_permission ? '有资格' : '无资格' }}</el-tag>
                <el-tag :type="fullTrace.merchant.settlement_permission ? 'success' : 'danger'" size="small">结算{{ fullTrace.merchant.settlement_permission ? '开启' : '关闭' }}</el-tag>
              </div>
            </div>
          </div>
          <div class="mb-right">
            <el-alert
              v-if="!fullTrace.compliance_check.is_compliant"
              :title="`检测到 ${fullTrace.compliance_check.issues.length} 项合规问题`"
              type="warning" show-icon :closable="false" />
            <el-alert v-else title="合规检查通过" type="success" show-icon :closable="false" />
            <div class="mb-issues mt8" v-if="fullTrace.compliance_check.issues.length">
              <div v-for="(issue, idx) in fullTrace.compliance_check.issues.slice(0, 3)" :key="idx" class="issue-item">
                <el-tag :type="issue.level === 'high' ? 'danger' : issue.level === 'medium' ? 'warning' : 'info'" size="small">
                  {{ issue.level === 'high' ? '高风险' : issue.level === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
                <span class="ml8">{{ issue.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="mt16">
          <el-tab-pane label="店铺档案" name="profile">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="店铺名称">{{ fullTrace.merchant.shop_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="商家名称">{{ fullTrace.merchant.name }}</el-descriptions-item>
              <el-descriptions-item label="店铺等级">{{ getLevelLabel(fullTrace.merchant.shop_level) }}</el-descriptions-item>
              <el-descriptions-item label="经营类目">{{ fullTrace.merchant.shop_category || '-' }} / {{ fullTrace.merchant.shop_sub_category || '-' }}</el-descriptions-item>
              <el-descriptions-item label="店铺状态">
                <el-tag :type="getStatusTagType(fullTrace.merchant.shop_status)">{{ getStatusLabel(fullTrace.merchant.shop_status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="入驻状态">{{ fullTrace.merchant.settle_status_text || '-' }}</el-descriptions-item>
              <el-descriptions-item label="客服电话">{{ fullTrace.merchant.customer_service_phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="客服时间">{{ fullTrace.merchant.customer_service_hours || '-' }}</el-descriptions-item>
              <el-descriptions-item label="开店日期">{{ fullTrace.merchant.shop_open_date || '-' }}</el-descriptions-item>
              <el-descriptions-item label="店铺地址" :span="2">
                {{ [fullTrace.merchant.shop_province, fullTrace.merchant.shop_city, fullTrace.merchant.shop_district, fullTrace.merchant.shop_address].filter(Boolean).join(' / ') || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="信用分">{{ fullTrace.merchant.credit_score || 100 }}</el-descriptions-item>
              <el-descriptions-item label="店铺标签" :span="3">
                <template v-if="fullTrace.merchant.shop_tags">
                  <el-tag v-for="t in fullTrace.merchant.shop_tags.split(',').filter(Boolean)" :key="t" size="small" class="mr4">{{ t }}</el-tag>
                </template>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="店铺简介" :span="3">
                <template v-if="fullTrace.merchant.shop_intro">
                  <el-tooltip :content="fullTrace.merchant.shop_intro as any" :show-after="300" placement="top" :show-tooltip="(fullTrace.merchant.shop_intro || '').length > 60">
                    <div class="intro-tooltip">
                      {{ fullTrace.merchant.shop_intro.length > 60 ? fullTrace.merchant.shop_intro.slice(0, 60) + '...（悬浮查看完整内容）' : fullTrace.merchant.shop_intro }}
                    </div>
                  </el-tooltip>
                </template>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="信息修改日志" name="info">
            <el-table :data="fullTrace.info_change_logs" border stripe>
              <el-table-column prop="created_at" label="修改时间" width="180" align="center" sortable />
              <el-table-column label="修改字段" width="140">
                <template #default="{ row }">
                  <el-tag type="info" size="small">{{ row.field_label_text || row.change_field }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="修改前值" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.value_before as any" :show-after="300" v-if="row.value_before && String(row.value_before).length > 30">
                    <span class="old-val">{{ String(row.value_before).slice(0, 30) }}...</span>
                  </el-tooltip>
                  <span v-else-if="row.value_before">{{ row.value_before }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="修改后值" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.value_after as any" :show-after="300" v-if="row.value_after && String(row.value_after).length > 30">
                    <span class="new-val">{{ String(row.value_after).slice(0, 30) }}...</span>
                  </el-tooltip>
                  <span v-else-if="row.value_after">{{ row.value_after }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="风险" width="90" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.risk_level >= 2" type="danger" size="small">高</el-tag>
                  <el-tag v-else-if="row.risk_level === 1" type="warning" size="small">中</el-tag>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="命中敏感词" min-width="200">
                <template #default="{ row }">
                  <el-tag v-for="w in (row.sensitive_words || [])" :key="w" type="danger" size="small" class="mr4">{{ w }}</el-tag>
                  <span v-if="!row.sensitive_words || row.sensitive_words.length === 0" class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="operator_name" label="操作人" width="100" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="状态变更记录" name="status">
            <el-table :data="fullTrace.status_change_logs" border stripe>
              <el-table-column prop="created_at" label="变更时间" width="180" align="center" sortable />
              <el-table-column label="状态变化" width="240" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status_before)" size="small">{{ row.status_before_text }}</el-tag>
                  <span class="mx8">→</span>
                  <el-tag :type="getStatusTagType(row.status_after)" size="small">{{ row.status_after_text }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变更来源" width="110" align="center">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.status_source_text }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变更原因" min-width="240" show-overflow-tooltip prop="change_reason" />
              <el-table-column label="联动商品" width="90" align="center" prop="affected_goods_count" />
              <el-table-column label="接单权限" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.order_permission_after ? 'success' : 'danger'" size="small">{{ row.order_permission_after ? '允许' : '禁止' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="营销资格" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.marketing_permission_after ? 'success' : 'danger'" size="small">{{ row.marketing_permission_after ? '有' : '无' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="结算功能" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.settlement_permission_after ? 'success' : 'danger'" size="small">{{ row.settlement_permission_after ? '开启' : '关闭' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operator_name" label="操作人" width="100" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="经营台账" name="ledger">
            <el-table :data="fullTrace.operation_ledgers" border stripe>
              <el-table-column prop="created_at" label="时间" width="180" align="center" sortable />
              <el-table-column label="操作类型" width="140" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="primary">{{ row.operation_type_text }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="标题" min-width="220" prop="operation_title" />
              <el-table-column label="详情" min-width="300" show-overflow-tooltip prop="operation_detail" />
              <el-table-column label="涉及金额" width="120" align="right" prop="amount">
                <template #default="{ row }">
                  <span v-if="row.amount">{{ Number(row.amount).toFixed(2) }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="商品/订单" width="110" align="center">
                <template #default="{ row }">
                  <div>
                    <div v-if="row.goods_count">商品：{{ row.goods_count }}</div>
                    <div v-if="row.order_count">订单：{{ row.order_count }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="operator_name" label="操作人" width="100" align="center">
                <template #default="{ row }">{{ row.operator_name || '系统' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="全链路时间轴" name="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(ev, idx) in fullTrace.timeline"
                :key="idx"
                :timestamp="ev.time"
                :type="ev.level === 'danger' ? 'danger' : ev.level === 'success' ? 'success' : ev.level === 'warning' ? 'warning' : 'primary'"
                placement="top">
                <div class="timeline-item-card">
                  <h5>{{ ev.title }}</h5>
                  <div class="timeline-type">{{ getTimelineTypeLabel(ev.type) }}</div>
                  <el-descriptions v-if="ev.detail" :column="1" size="small" border class="mt8">
                    <template v-if="ev.type === 'status_change'">
                      <el-descriptions-item label="变更来源">{{ ev.detail.status_source_text || ev.detail.status_source }}</el-descriptions-item>
                      <el-descriptions-item label="变更原因">{{ ev.detail.change_reason }}</el-descriptions-item>
                      <el-descriptions-item label="操作人">{{ ev.detail.operator_name || '系统' }}</el-descriptions-item>
                    </template>
                    <template v-else-if="ev.type === 'info_change'">
                      <el-descriptions-item label="字段">{{ ev.detail.field_label_text || ev.detail.change_field }}</el-descriptions-item>
                      <el-descriptions-item label="变更前">{{ ev.detail.value_before || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="变更后">{{ ev.detail.value_after || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="操作人">{{ ev.detail.operator_name || '系统' }}</el-descriptions-item>
                    </template>
                    <template v-else>
                      <el-descriptions-item label="详情">
                        <div class="ledger-detail">
                          <div v-if="ev.detail.operation_detail">{{ ev.detail.operation_detail }}</div>
                          <div v-if="ev.detail.amount" class="mt4">金额：¥{{ Number(ev.detail.amount).toFixed(2) }}</div>
                        </div>
                      </el-descriptions-item>
                    </template>
                  </el-descriptions>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </template>

      <el-empty v-if="!loading && !fullTrace.merchant" description="暂无数据" />
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getShopFullTrace, SHOP_STATUS_OPTIONS, SHOP_LEVEL_OPTIONS } from '@/api/shopInfo'

const props = defineProps<{
  modelValue: boolean
  merchantId?: number
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
  merchant: null,
  info_change_logs: [],
  status_change_logs: [],
  operation_ledgers: [],
  timeline: [],
  compliance_check: { is_compliant: true, issues: [] },
})

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getStatusLabel = (s?: number) => SHOP_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getStatusTagType = (s?: number): TagType => {
  const o = SHOP_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getLevelLabel = (lv?: number) => SHOP_LEVEL_OPTIONS.find(o => o.value === lv)?.label || '-'
const getTimelineTypeLabel = (t: string) => ({
  info_change: '信息修改',
  status_change: '状态变更',
  operation: '经营记录',
}[t] || '操作记录')

const loadTrace = async () => {
  if (!props.merchantId) return
  loading.value = true
  try {
    const res = await getShopFullTrace(props.merchantId)
    fullTrace.value = res.data.data
  } finally {
    loading.value = false
  }
}

watch(() => [props.modelValue, props.merchantId], ([visible, id]) => {
  if (visible && id) loadTrace()
})

onMounted(() => {
  if (props.modelValue && props.merchantId) loadTrace()
})
</script>

<style scoped lang="scss">
.shop-trace-wrapper { min-height: 400px; }
.ml4 { margin-left: 4px; }
.ml8 { margin-left: 8px; }
.mr4 { margin-right: 4px; }
.mr6 { margin-right: 6px; }
.mr16 { margin-right: 16px; }
.mt4 { margin-top: 4px; }
.mt8 { margin-top: 8px; }
.mt16 { margin-top: 16px; }
.mx8 { margin: 0 8px; }
.text-muted { color: var(--el-text-color-secondary); }
.old-val { color: var(--el-color-danger); text-decoration: line-through; }
.new-val { color: var(--el-color-success); font-weight: 600; }
.intro-tooltip { line-height: 1.5; color: var(--el-text-color-regular); }
.merchant-banner {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 24px; padding: 16px 20px; border-radius: 10px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9eb 100%);
  border: 1px solid var(--el-border-color-lighter);
  .mb-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
  .mb-info { flex: 1; min-width: 0; }
  .mb-name { h3 { margin: 0; display: inline-block; } }
  .mb-meta { font-size: 13px; color: var(--el-text-color-regular); margin-top: 4px; line-height: 1.6; }
  .mb-right { width: 420px; }
  .mb-issues {
    max-height: 90px; overflow: auto;
    .issue-item { font-size: 12px; line-height: 1.8; display: flex; align-items: center; }
  }
}
.timeline-item-card {
  padding: 10px 14px; background: var(--el-fill-color-lighter); border-radius: 6px;
  h5 { margin: 0 0 4px 0; color: var(--el-text-color-primary); font-size: 14px; }
  .timeline-type { font-size: 12px; color: var(--el-text-color-secondary); }
  .ledger-detail { font-size: 12px; color: var(--el-text-color-regular); }
}
</style>
