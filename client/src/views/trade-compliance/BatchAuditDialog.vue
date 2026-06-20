<template>
  <FinDialog
    v-model:visible="dialogVisible"
    title="批量审核"
    width="700px"
    :loading="loading"
    @confirm="handleConfirm"
  >
    <div v-if="preview" class="batch-preview">
      <el-descriptions :column="3" border size="small" class="preview-desc">
        <el-descriptions-item label="已选数量">{{ preview.totalSelected }}</el-descriptions-item>
        <el-descriptions-item label="可批量通过">{{ preview.canBatchApprove }}</el-descriptions-item>
        <el-descriptions-item label="可批量驳回">{{ preview.canBatchReject }}</el-descriptions-item>
      </el-descriptions>

      <div class="batch-distribution">
        <h4>分类分布</h4>
        <el-row :gutter="12">
          <el-col :span="8">
            <div class="dist-item">
              <span class="dist-label">按金额</span>
              <div v-for="(count, range) in preview.byAmount" :key="range" class="dist-row">
                <span>{{ range }}</span>
                <span>{{ count }} 笔</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="dist-item">
              <span class="dist-label">按交易类型</span>
              <div v-for="(count, type) in preview.byTradeType" :key="type" class="dist-row">
                <span>{{ type === 'buy' ? '买入' : '卖出' }}</span>
                <span>{{ count }} 笔</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="dist-item">
              <span class="dist-label">按风险等级</span>
              <div v-for="(count, cat) in preview.byRiskCategory" :key="cat" class="dist-row">
                <span>{{ getRiskCategoryLabel(cat) }}</span>
                <span>{{ count }} 笔</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div v-if="preview.blockedItems.length > 0" class="blocked-list">
        <el-alert type="warning" :closable="false" title="以下订单不可批量审核：">
          <div v-for="item in preview.blockedItems" :key="item.id" class="blocked-item">
            {{ item.tradeNo }} - {{ item.reason }}
          </div>
        </el-alert>
      </div>
    </div>

    <el-form :model="form" label-width="100px" class="batch-form">
      <el-form-item label="审核结果" required>
        <el-radio-group v-model="form.auditStatus">
          <el-radio value="approved">批量通过</el-radio>
          <el-radio value="rejected">批量驳回</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.auditStatus === 'rejected'" label="违规类型" required>
        <el-select v-model="form.violationTypes" multiple placeholder="请选择违规类型" class="full-width">
          <el-option
            v-for="item in violationTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.auditStatus === 'rejected'" label="违规原因" required>
        <el-input v-model="form.violationReason" type="textarea" :rows="2" placeholder="请标注具体违规原因" />
      </el-form-item>
      <el-form-item label="审核意见" required>
        <el-input v-model="form.opinion" type="textarea" :rows="3" placeholder="请输入审核意见" />
      </el-form-item>
    </el-form>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import FinDialog from '@/components/common/FinDialog.vue'
import { TRADE_RISK_CATEGORY_LABELS, VIOLATION_TYPE_LABELS } from '@/constants/dictionaries'
import { TradeRiskCategory, ViolationType } from '@/enums'
import { batchPreviewTradeCompliance, batchAuditTradeCompliance } from '@/api/tradeCompliance'
import type { ITradeComplianceAudit, ITradeComplianceBatchPreview } from '@/types/api'

const props = defineProps<{
  visible: boolean
  selectedRows: ITradeComplianceAudit[]
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  confirm: [result: any]
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const preview = ref<ITradeComplianceBatchPreview | null>(null)

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    loadPreview()
    form.auditStatus = 'approved'
    form.violationTypes = []
    form.violationReason = ''
    form.opinion = ''
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const form = reactive({
  auditStatus: 'approved' as 'approved' | 'rejected',
  violationTypes: [] as string[],
  violationReason: '',
  opinion: '',
})

const violationTypeOptions = Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))

function getRiskCategoryLabel(cat: string): string {
  return TRADE_RISK_CATEGORY_LABELS[cat as TradeRiskCategory] || cat
}

async function loadPreview() {
  const ids = props.selectedRows.map(r => r.id)
  if (ids.length === 0) return
  try {
    const res = await batchPreviewTradeCompliance(ids)
    if (res.code === 0) {
      preview.value = res.data
    }
  } catch { /* ignore */ }
}

async function handleConfirm() {
  if (!form.opinion.trim()) {
    ElMessage.warning('请输入审核意见')
    return
  }
  if (form.auditStatus === 'rejected') {
    if (form.violationTypes.length === 0) {
      ElMessage.warning('请选择违规类型')
      return
    }
    if (!form.violationReason.trim()) {
      ElMessage.warning('请标注具体违规原因')
      return
    }
  }

  try {
    await ElMessageBox.confirm(
      `确认批量${form.auditStatus === 'approved' ? '通过' : '驳回'} ${props.selectedRows.length} 条审核记录？此操作不可撤销。`,
      '二次确认',
      { confirmButtonText: '确认执行', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const ids = props.selectedRows.map(r => r.id)
    const params: any = {
      ids,
      auditStatus: form.auditStatus,
      opinion: form.opinion,
    }
    if (form.auditStatus === 'rejected') {
      params.violationTypes = form.violationTypes
      params.violationReasons = [form.violationReason]
    }
    const res = await batchAuditTradeCompliance(params)
    if (res.code === 0) {
      emit('confirm', res.data)
      dialogVisible.value = false
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('批量审核失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.batch-preview {
  margin-bottom: 16px;

  .preview-desc {
    margin-bottom: 16px;
  }

  .batch-distribution {
    h4 {
      font-size: 14px;
      color: var(--fin-text-primary);
      margin: 0 0 8px;
    }

    .dist-item {
      padding: 8px 12px;
      background: #F8FAFC;
      border-radius: 4px;

      .dist-label {
        font-weight: 500;
        font-size: 12px;
        color: var(--fin-text-secondary);
        display: block;
        margin-bottom: 4px;
      }

      .dist-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--fin-text-regular);
        padding: 2px 0;
      }
    }
  }

  .blocked-list {
    margin-top: 12px;

    .blocked-item {
      font-size: 12px;
      padding: 2px 0;
    }
  }
}

.batch-form {
  .full-width {
    width: 100%;
  }
}
</style>
