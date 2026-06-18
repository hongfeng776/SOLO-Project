<template>
  <el-dialog
    v-model="dialogVisible"
    title="资质全链路溯源"
    width="1100px"
    class="trace-dialog"
    append-to-body
    destroy-on-close
    top="5vh"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="trace-content">
      <div v-if="traceData" class="trace-main">
        <div class="merchant-summary">
          <div class="summary-header">
            <div class="avatar-wrap">
              <el-avatar :size="56" shape="square" style="background: linear-gradient(135deg,#667eea,#764ba2);">
                <span style="color:#fff;font-size:22px;font-weight:700;">{{ traceData.merchant.name?.slice(0,1) || '商' }}</span>
              </el-avatar>
            </div>
            <div class="info-wrap">
              <div class="name-row">
                <h3 class="m-name">{{ traceData.merchant.name }}</h3>
                <el-tag :type="getSettleTagType(traceData.merchant.settle_status)" size="default" effect="light">
                  {{ traceData.merchant.settle_status_text }}
                </el-tag>
              </div>
              <div class="meta-row">
                <span><el-icon><User /></el-icon> {{ traceData.merchant.legal_person || '-' }}</span>
                <span><el-icon><Phone /></el-icon> {{ traceData.merchant.phone || '-' }}</span>
                <span><el-icon><Tickets /></el-icon> {{ traceData.merchant.credit_code || traceData.merchant.business_license_no || '-' }}</span>
                <span><el-icon><OfficeBuilding /></el-icon> {{ traceData.merchant.industry_type || '-' }}</span>
              </div>
            </div>
            <div class="permission-wrap">
              <div class="perm-item">
                <div class="perm-label">店铺</div>
                <el-tag :type="traceData.merchant.shop_open_status === 1 ? 'success' : 'info'" size="small">
                  {{ traceData.merchant.shop_open_status === 1 ? '已开通' : '未开通' }}
                </el-tag>
              </div>
              <div class="perm-item">
                <div class="perm-label">上架</div>
                <el-tag :type="traceData.merchant.goods_publish_permission === 1 ? 'success' : 'info'" size="small">
                  {{ traceData.merchant.goods_publish_permission === 1 ? '有权限' : '无权限' }}
                </el-tag>
              </div>
            </div>
          </div>

          <el-tooltip
            v-if="traceData.merchant.qualification_remark && traceData.merchant.qualification_remark.length > 50"
            effect="dark"
            placement="bottom"
            :show-after="300"
          >
            <template #content>
              <div class="remark-full-tip">{{ traceData.merchant.qualification_remark }}</div>
            </template>
            <div class="long-remark-row">
              <el-icon><InfoFilled /></el-icon>
              <span>资质备注：</span>
              <span class="remark-text">{{ traceData.merchant.qualification_remark.slice(0, 50) }}...</span>
              <span class="expand-hint"><el-icon><ArrowDown /></el-icon> 悬浮查看完整内容</span>
            </div>
          </el-tooltip>
          <div v-else-if="traceData.merchant.qualification_remark" class="long-remark-row">
            <el-icon><InfoFilled /></el-icon>
            <span>资质备注：</span>
            <span class="remark-text">{{ traceData.merchant.qualification_remark }}</span>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="trace-tabs">
          <el-tab-pane name="materials">
            <template #label>
              <el-icon><Document /></el-icon> 资质材料档案
              <el-badge v-if="traceData.qualifications?.length" :value="traceData.qualifications.length" class="tab-badge" />
            </template>
            <div class="materials-grid">
              <div v-for="(q, idx) in traceData.qualifications" :key="q.id || idx" class="material-card" :class="{ 'card-invalid': q.status === 0 || q.verification_status === 2 }">
                <div class="mc-header">
                  <el-tag size="small" type="primary" effect="light">{{ getQualType(q.qualification_type) }}</el-tag>
                  <div class="mc-status">
                    <el-tag v-if="q.status === 1" size="small" type="success" effect="plain">有效</el-tag>
                    <el-tag v-else-if="q.status === 0" size="small" type="danger" effect="plain">已过期</el-tag>
                    <el-tag v-else size="small" type="warning" effect="plain">待审核</el-tag>
                  </div>
                </div>
                <div class="mc-body">
                  <div class="info-row"><span class="lb">证件编号</span><span>{{ q.certificate_no || '-' }}</span></div>
                  <div class="info-row"><span class="lb">持有人</span><span>{{ q.certificate_holder || '-' }}</span></div>
                  <div class="info-row">
                    <span class="lb">有效期</span>
                    <span :class="{ 'text-expired': q.status === 0 }">{{ q.valid_from || '-' }} ~ {{ q.expire_date || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="lb">核验结果</span>
                    <span>
                      <el-tag size="small" :type="q.verification_status === 1 ? 'success' : q.verification_status === 2 ? 'danger' : q.verification_status === 3 ? 'warning' : 'info'" effect="plain">
                        {{ ['未核验','核验通过','核验不通过','核验异常'][q.verification_status ?? 0] }}
                      </el-tag>
                      <span style="margin-left:6px;font-size:12px;color:#909399;">{{ getVerifySource(q.verification_source) }}</span>
                    </span>
                  </div>
                  <div v-if="q.missing_flag || q.violation_flag" class="flag-row">
                    <el-tag v-if="q.missing_flag" size="small" type="warning" effect="dark">缺失</el-tag>
                    <el-tag v-if="q.violation_flag" size="small" type="danger" effect="dark">违规</el-tag>
                  </div>
                  <div v-if="q.audit_opinion || q.verification_remark" class="remark-block">
                    <div v-if="q.audit_opinion" class="rb-item"><b>审核意见：</b>{{ q.audit_opinion }}</div>
                    <div v-if="q.verification_remark" class="rb-item"><b>核验备注：</b>{{ q.verification_remark }}</div>
                  </div>
                  <div v-if="q.file_url" class="file-row">
                    <el-link :href="q.file_url" target="_blank" type="primary" :icon="View">
                      查看材料文件
                    </el-link>
                  </div>
                </div>
                <div class="mc-footer">
                  <span style="color:#909399;font-size:12px;">提交：{{ q.created_at?.slice(0,19).replace('T',' ') || '-' }}</span>
                  <span v-if="q.updated_at && q.updated_at !== q.created_at" style="color:#909399;font-size:12px;">
                    更新：{{ q.updated_at?.slice(0,19).replace('T',' ') || '-' }}
                  </span>
                </div>
              </div>
              <el-empty v-if="!traceData.qualifications?.length" description="暂无资质材料记录" :image-size="80" />
            </div>
          </el-tab-pane>

          <el-tab-pane name="audits">
            <template #label>
              <el-icon><Stamp /></el-icon> 审核操作日志
            </template>
            <el-timeline class="audit-timeline">
              <el-timeline-item
                v-for="(a, idx) in traceData.audits"
                :key="a.id || idx"
                :timestamp="a.created_at?.slice(0,19).replace('T',' ')"
                :type="a.status === 1 ? 'success' : a.status === 2 ? 'danger' : 'warning'"
                placement="top"
              >
                <el-card shadow="never" class="timeline-card">
                  <div class="ac-header">
                    <el-tag :type="a.status === 1 ? 'success' : a.status === 2 ? 'danger' : 'warning'" effect="light">
                      {{ ['待审核','审核通过','审核拒绝'][a.status ?? 0] }}
                    </el-tag>
                    <el-tag size="small" type="info" effect="plain">{{ getStep(a.audit_step) }}</el-tag>
                    <span class="ac-op">操作类型：{{ getOpType(a.operation_type) }}</span>
                  </div>
                  <div class="ac-reason">
                    <b>审核意见：</b>{{ a.reason }}
                  </div>
                  <div v-if="a.missing_materials?.length" class="ac-detail">
                    <b>缺失材料：</b>
                    <el-tag v-for="(m,i) in a.missing_materials" :key="i" size="small" type="warning" effect="plain" style="margin:2px;">{{ m }}</el-tag>
                  </div>
                  <div v-if="a.violation_points?.length" class="ac-detail">
                    <b>违规点：</b>
                    <el-tag v-for="(v,i) in a.violation_points" :key="i" size="small" type="danger" effect="plain" style="margin:2px;">{{ v }}</el-tag>
                  </div>
                  <div v-if="a.need_resubmit" class="ac-detail">
                    <b>补传要求：</b>
                    <el-tag size="small" type="warning" effect="dark">需要补传</el-tag>
                    <span v-if="a.resubmit_deadline" style="margin-left:8px;">
                      截止日期：{{ a.resubmit_deadline?.slice(0,10) }}
                    </span>
                  </div>
                </el-card>
              </el-timeline-item>
              <el-empty v-if="!traceData.audits?.length" description="暂无审核记录" />
            </el-timeline>
          </el-tab-pane>

          <el-tab-pane name="ledgers">
            <template #label>
              <el-icon><Notebook /></el-icon> 资质有效期台账
            </template>
            <el-table :data="traceData.ledgers || []" size="small" border stripe>
              <el-table-column label="时间" width="170">
                <template #default="{ row }">{{ row.created_at?.slice(0,19).replace('T',' ') }}</template>
              </el-table-column>
              <el-table-column label="操作类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="getLedgerTypeColor(row.operation_type)" effect="plain">
                    {{ getLedgerOp(row.operation_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="入驻状态变更" width="220">
                <template #default="{ row }">
                  <span v-if="row.settle_status_before !== undefined">{{ getSettleLabel(row.settle_status_before) }}</span>
                  <span v-else>-</span>
                  <el-icon style="margin:0 6px;color:#909399;"><Right /></el-icon>
                  <b>{{ getSettleLabel(row.settle_status_after) }}</b>
                </template>
              </el-table-column>
              <el-table-column label="资质状态变更" width="200">
                <template #default="{ row }">
                  <span v-if="row.status_before !== undefined">{{ row.status_before === 0 ? '过期' : row.status_before === 1 ? '有效' : '待审' }}</span>
                  <span v-else>-</span>
                  <el-icon style="margin:0 6px;color:#909399;"><Right /></el-icon>
                  <b>{{ row.status_after === 0 ? '过期' : row.status_after === 1 ? '有效' : '待审' }}</b>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="120">
                <template #default="{ row }">{{ row.operator_name || '系统自动' }}</template>
              </el-table-column>
              <el-table-column label="操作备注" min-width="260">
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.operation_remark && row.operation_remark.length > 40"
                    effect="dark"
                    placement="top"
                  >
                    <template #content>
                      <div style="max-width:420px;white-space:pre-wrap;">{{ row.operation_remark }}</div>
                    </template>
                    <span class="ledger-remark">{{ row.operation_remark.slice(0, 40) }}...</span>
                  </el-tooltip>
                  <span v-else>{{ row.operation_remark || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="changes">
            <template #label>
              <el-icon><EditPen /></el-icon> 材料变更记录
            </template>
            <el-table :data="traceData.change_logs || []" size="small" border stripe>
              <el-table-column label="时间" width="170">
                <template #default="{ row }">{{ row.created_at?.slice(0,19).replace('T',' ') }}</template>
              </el-table-column>
              <el-table-column prop="change_field" label="变更字段" width="160" />
              <el-table-column label="变更前" min-width="180">
                <template #default="{ row }">
                  <span class="val-before">{{ row.value_before || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="变更后" min-width="180">
                <template #default="{ row }">
                  <span class="val-after">{{ row.value_after || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="120">
                <template #default="{ row }">{{ row.operator_name || '-' }}</template>
              </el-table-column>
              <el-table-column label="变更原因" min-width="200">
                <template #default="{ row }">{{ row.change_reason || '-' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="timeline">
            <template #label>
              <el-icon><Clock /></el-icon> 全链路时间轴
            </template>
            <el-timeline class="global-timeline">
              <el-timeline-item
                v-for="(ev, idx) in traceData.timeline"
                :key="'tl'+idx"
                :timestamp="ev.time?.slice(0,19).replace('T',' ')"
                :type="getTimelineType(ev)"
                :hollow="ev.type === 'change'"
              >
                <div class="tl-item">
                  <div class="tl-type">
                    <el-tag size="small" effect="dark" :type="getTimelineType(ev)">
                      {{ ev.action }}
                    </el-tag>
                    <span class="tl-cat">{{ getTimelineCat(ev.type) }}</span>
                  </div>
                  <div class="tl-title">{{ ev.title }}</div>
                  <div class="tl-detail">
                    <template v-if="ev.type === 'audit'">
                      <div v-if="ev.detail?.reason"><b>意见：</b>{{ ev.detail.reason }}</div>
                    </template>
                    <template v-else-if="ev.type === 'ledger'">
                      <div v-if="ev.detail?.operation_remark">
                        <el-tooltip
                          v-if="ev.detail.operation_remark.length > 60"
                          effect="dark"
                          placement="top"
                        >
                          <template #content>
                            <div style="max-width:420px;white-space:pre-wrap;">{{ ev.detail.operation_remark }}</div>
                          </template>
                          <span>{{ ev.detail.operation_remark.slice(0, 60) }}...</span>
                        </el-tooltip>
                        <span v-else>{{ ev.detail.operation_remark }}</span>
                      </div>
                    </template>
                    <template v-else-if="ev.type === 'change'">
                      <div><b>{{ ev.detail?.change_field }}</b>：
                        <span class="val-before">{{ ev.detail?.value_before || '-' }}</span>
                        <el-icon style="margin:0 4px;"><Right /></el-icon>
                        <span class="val-after">{{ ev.detail?.value_after || '-' }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div v-if="ev.detail?.certificate_no">证件号：{{ ev.detail.certificate_no }}</div>
                      <div v-if="ev.detail?.expire_date">有效期至：{{ ev.detail.expire_date }}</div>
                    </template>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User, Phone, Tickets, OfficeBuilding, Document, InfoFilled, ArrowDown, View,
  Stamp, Notebook, EditPen, Clock, Right
} from '@element-plus/icons-vue'
import {
  SETTLE_STATUS_OPTIONS, QUALIFICATION_TYPE_OPTIONS,
  getFullTrace,
} from '@/api/merchantQualification'

const props = defineProps<{
  modelValue: boolean
  merchantId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const activeTab = ref('materials')
const traceData = ref<any>(null)

const fetchTrace = async () => {
  if (!props.merchantId) return
  loading.value = true
  try {
    const res = await getFullTrace(props.merchantId)
    traceData.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || '加载溯源数据失败')
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  traceData.value = null
  activeTab.value = 'materials'
}

watch(() => [props.modelValue, props.merchantId], ([vis, mid]) => {
  if (vis && mid) fetchTrace()
}, { immediate: true })

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined;
const getSettleTagType = (s: number): TagType => {
  const o = SETTLE_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getSettleLabel = (s: number) => {
  const o = SETTLE_STATUS_OPTIONS.find(x => x.value === s)
  return o?.label || `状态(${s})`
}
const getQualType = (t: string) => {
  const o = QUALIFICATION_TYPE_OPTIONS.find(x => x.value === t)
  return o?.label || t
}
const getVerifySource = (s: string) => {
  return { system: '系统正则', manual: '人工核验', industry: '工商数据' }[s || 'system'] || s
}
const getStep = (s: string) => ({ submit: '提交', approve: '通过', reject: '驳回', resubmit: '补传', review: '复核' }[s || ''] || s)
const getOpType = (s: string) => ({ initial: '首次提交', resubmit: '补传材料', review: '资质复核' }[s || ''] || s)
const getLedgerOp = (s: string) => ({ submit: '资质提交', approve: '审核通过', reject: '审核驳回', expire: '自动过期', change: '材料变更', freeze: '权限冻结', unfreeze: '权限解冻' }[s || ''] || s)
const getLedgerTypeColor = (s: string): TagType => {
  const m: Record<string, TagType> = {
    submit: 'warning', approve: 'success', reject: 'danger',
    expire: 'info', change: undefined, freeze: 'danger', unfreeze: 'success'
  }
  return m[s || ''] || 'info'
}
const getTimelineType = (ev: any): TagType => {
  if (ev.action === 'APPROVE') return 'success'
  if (ev.action === 'REJECT' || ev.action === 'FREEZE') return 'danger'
  if (ev.action === 'SUBMIT' || ev.action === 'UPDATE' || ev.action === 'REVIEW' || ev.action === 'RESUBMIT') return 'warning'
  if (ev.type === 'ledger') return undefined
  return 'primary'
}
const getTimelineCat = (t: string) => ({
  qualification: '[资质材料]', audit: '[审核操作]',
  ledger: '[台账记录]', change: '[变更记录]'
}[t || ''] || '')
</script>

<style lang="scss" scoped>
.trace-dialog {
  :deep(.el-dialog__body) { padding: 10px 24px 20px; }

  .trace-content { min-height: 480px; }

  .merchant-summary {
    padding: 20px; margin-bottom: 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #fef3ff 100%);
    border-radius: 12px; border: 1px solid #e4e7ed;
    .summary-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 12px;
      .info-wrap { flex: 1;
        .name-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px;
          .m-name { margin: 0; font-size: 20px; font-weight: 600; }
        }
        .meta-row { display: flex; gap: 18px; font-size: 13px; color: #606266;
          span { display: flex; align-items: center; gap: 4px; }
        }
      }
      .permission-wrap { display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
        .perm-item { display: flex; align-items: center; gap: 8px;
          .perm-label { font-size: 12px; color: #909399; }
        }
      }
    }
    .long-remark-row {
      margin-top: 10px; padding: 8px 12px; background: #fff; border-radius: 6px;
      font-size: 13px; display: flex; gap: 6px; align-items: flex-start; color: #606266;
      .expand-hint { color: var(--el-color-primary); margin-left: auto; font-size: 12px; display: flex; align-items: center; gap: 2px; }
    }
  }
  .remark-full-tip { max-width: 520px; white-space: pre-wrap; }

  .trace-tabs { margin-top: 8px; }

  .materials-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px;
    .material-card {
      border: 1px solid var(--el-border-color-lighter); border-radius: 8px; overflow: hidden;
      transition: all .2s; background: #fff;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
      &.card-invalid { border-color: #fbc4c4; background: #fef0f0; }
      .mc-header { padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--el-border-color-lighter); }
      .mc-body { padding: 12px 14px;
        .info-row { display: flex; margin-bottom: 6px; font-size: 13px;
          .lb { width: 68px; color: #909399; flex-shrink: 0; }
          .text-expired { color: var(--el-color-danger); font-weight: 600; }
        }
        .flag-row { margin: 8px 0; display: flex; gap: 6px; }
        .remark-block { margin-top: 8px; padding: 8px; background: #fafafa; border-radius: 4px; font-size: 12px;
          .rb-item:not(:last-child) { margin-bottom: 4px; }
        }
        .file-row { margin-top: 8px; }
      }
      .mc-footer { padding: 8px 14px; display: flex; justify-content: space-between; background: #fafafa; border-top: 1px solid var(--el-border-color-lighter); }
    }
  }

  .audit-timeline { padding: 8px; }
  .timeline-card { :deep(.el-card__body) { padding: 12px 16px; }
    .ac-header { display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
      .ac-op { margin-left: auto; color: #909399; font-size: 12px; }
    }
    .ac-reason { font-size: 13px; color: #606266; margin-bottom: 6px; }
    .ac-detail { margin-top: 6px; font-size: 12px; }
  }
  .global-timeline { padding: 8px 16px; }
  .tl-item {
    .tl-type { display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
      .tl-cat { color: #909399; font-size: 12px; }
    }
    .tl-title { font-weight: 600; margin-bottom: 4px; color: #303133; }
    .tl-detail { font-size: 12px; color: #606266; }
  }
  .val-before { color: #909399; text-decoration: line-through; }
  .val-after { color: var(--el-color-success); font-weight: 500; }
  .ledger-remark { cursor: help; color: #606266; }
  .tab-badge { margin-left: 8px; }
}
</style>
