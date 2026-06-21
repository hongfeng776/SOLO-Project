<template>
  <el-dialog :model-value="modelValue" @update:model-value="handleClose"
    :title="dialogTitle" width="720px" :close-on-click-modal="false"
    class="batch-operation-dialog" destroy-on-close>
    <div class="batch-wrap">
      <!-- 统计信息 -->
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          <span>本次批量操作共选中 <b class="count-num">{{ selectedIds.length }}</b> 家服务商</span>
        </template>
      </el-alert>

      <!-- 预览选中的服务商 -->
      <div class="selected-preview">
        <div class="preview-head">
          <span class="preview-title">📋 操作对象预览</span>
          <el-button size="small" link type="primary" @click="showFullList = !showFullList">
            {{ showFullList ? '收起' : `展开全部(${selectedIds.length})` }}
          </el-button>
        </div>
        <div class="preview-tags" :class="{ 'preview-tags-expanded': showFullList }">
          <el-tag v-for="p in displayProviders" :key="p.id" size="small" class="provider-tag"
            :type="getPreviewTagType(p)" effect="light">
            {{ p.providerName }}（{{ p.providerCode }}）
            <span class="sub-info">
              {{ ProviderLevelMap[p.level]?.label || '' }} / {{ CooperationStatusMap[p.cooperationStatus]?.label || '' }}
            </span>
          </el-tag>
        </div>
        <div class="preview-more" v-if="!showFullList && providerList.length > 6">
          ... 还有 {{ providerList.length - 6 }} 家，点击上方"展开全部"查看
        </div>
      </div>

      <el-divider />

      <!-- 操作表单 -->
      <!-- 批量启用/禁用 -->
      <template v-if="operationType === 'enable' || operationType === 'disable'">
        <el-alert :type="operationType === 'enable' ? 'success' : 'warning'" :closable="false" show-icon
          :title="operationType === 'enable' ? '启用前将逐条执行前置校验（企业资质、网点覆盖、时效承诺）' : '禁用将暂停该服务商所有订单分配路由'">
        </el-alert>
        <el-form label-width="110px" class="batch-form" style="margin-top: 14px">
          <el-form-item :label="operationType === 'enable' ? '启用原因' : '禁用原因'" required>
            <el-input v-model="form.reason" type="textarea" :rows="2" maxlength="200" show-word-limit
              :placeholder="operationType === 'enable' ? '请说明批量启用的理由或依据' : '请说明批量禁用的具体原因'" />
          </el-form-item>
          <el-form-item label="执行策略">
            <el-radio-group v-model="form.strategy">
              <el-radio value="skip">跳过不合规项，其他继续执行</el-radio>
              <el-radio value="stop">任一项校验不通过则全部停止</el-radio>
              <el-radio value="force" :disabled="operationType === 'disable'">强制执行（忽略前置校验）</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>

      <!-- 批量更新资费 -->
      <template v-if="operationType === 'fee'">
        <el-alert type="warning" :closable="false" show-icon
          title="批量更新资费将影响所有选中服务商的计费规则。若包含【合作中】服务商，将触发二次确认流程。">
        </el-alert>
        <el-form label-width="140px" class="batch-form" style="margin-top: 14px">
          <el-form-item label="调整模式" required>
            <el-radio-group v-model="form.feeMode">
              <el-radio value="set">统一设置为</el-radio>
              <el-radio value="increase">按金额增加(+)</el-radio>
              <el-radio value="decrease">按金额减少(-)</el-radio>
              <el-radio value="percent">按百分比调整(%)</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="首重资费(元/kg)">
            <div class="field-row">
              <el-input-number v-model="form.firstWeightFee" :precision="2" :step="0.5" :min="0" />
              <el-tag size="small" v-if="form.feeMode === 'percent'" type="info">%</el-tag>
            </div>
            <div class="field-tip" v-if="!form.firstWeightFee">留空则不修改此项</div>
          </el-form-item>
          <el-form-item label="续重资费(元/kg)">
            <div class="field-row">
              <el-input-number v-model="form.additionalWeightFee" :precision="2" :step="0.5" :min="0" />
              <el-tag size="small" v-if="form.feeMode === 'percent'" type="info">%</el-tag>
            </div>
            <div class="field-tip" v-if="!form.additionalWeightFee">留空则不修改此项</div>
          </el-form-item>
          <el-form-item label="基础服务费(元/单)">
            <div class="field-row">
              <el-input-number v-model="form.baseServiceFee" :precision="2" :step="0.1" :min="0" />
              <el-tag size="small" v-if="form.feeMode === 'percent'" type="info">%</el-tag>
            </div>
          </el-form-item>
          <el-form-item label="变更原因" required>
            <el-input v-model="form.changeReason" type="textarea" :rows="2" maxlength="300" show-word-limit
              placeholder="资费调整原因说明，如：季度调价、成本变动、战略协议更新等" />
          </el-form-item>
          <el-form-item label="合作中服务商" v-if="hasCooperatingProvider">
            <el-tag type="danger" size="small">
              ⚠️ 选中包含 {{ cooperatingCount }} 家合作生效服务商，需二次确认
            </el-tag>
            <div class="confirmer-wrap" style="margin-top: 8px">
              <span>二次确认人：</span>
              <el-select v-model="form.confirmedByName" placeholder="选择二次确认人" filterable style="width: 220px">
                <el-option label="运营总监 - 王总" value="运营总监-王总" />
                <el-option label="物流经理 - 李经理" value="物流经理-李经理" />
                <el-option label="财务主管 - 张主管" value="财务主管-张主管" />
              </el-select>
            </div>
          </el-form-item>
        </el-form>
      </template>

      <!-- 批量调整优先级 -->
      <template v-if="operationType === 'priority'">
        <el-alert type="primary" :closable="false" show-icon
          title="匹配优先级越高，平台在自动分配物流商时权重越大。建议铂金/黄金级服务商设置较高优先级。">
        </el-alert>
        <el-form label-width="140px" class="batch-form" style="margin-top: 14px">
          <el-form-item label="调整模式" required>
            <el-radio-group v-model="form.priorityMode">
              <el-radio value="increase">按数值增加(+)</el-radio>
              <el-radio value="decrease">按数值减少(-)</el-radio>
              <el-radio value="set">统一设置为</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="优先级数值" required>
            <el-input-number v-model="form.priorityValue" :min="0" :max="999" :step="5" />
            <span class="field-tip" style="margin-left: 10px">数值范围 0 - 999</span>
          </el-form-item>
          <el-form-item label="调整原因">
            <el-input v-model="form.changeReason" type="textarea" :rows="2" maxlength="200" />
          </el-form-item>
        </el-form>
      </template>

      <!-- 批量调整等级 -->
      <template v-if="operationType === 'level'">
        <el-alert type="warning" :closable="false" show-icon
          title="服务商等级直接影响匹配优先级、合作额度、资费折扣等核心权益，请谨慎调整。">
        </el-alert>
        <el-form label-width="140px" class="batch-form" style="margin-top: 14px">
          <el-form-item label="目标等级" required>
            <el-radio-group v-model="form.targetLevel">
              <el-radio v-for="(item, key) in ProviderLevelMap" :key="key" :value="Number(key)">
                <el-tag :type="item.type" size="small">{{ item.label }}</el-tag>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="调整依据" required>
            <el-input v-model="form.changeReason" type="textarea" :rows="2" maxlength="300" show-word-limit
              placeholder="请填写等级调整依据：季度考核结果、年度合作规模、服务质量提升、战略合作伙伴升级等" />
          </el-form-item>
        </el-form>
      </template>

      <!-- 预期影响预览 -->
      <div class="impact-preview">
        <div class="ip-title">📊 预期影响预览</div>
        <el-row :gutter="10">
          <el-col :span="8">
            <div class="ip-card">
              <div class="ip-label">受影响服务商</div>
              <div class="ip-value primary">{{ selectedIds.length }} 家</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="ip-card">
              <div class="ip-label">其中 合作生效中</div>
              <div class="ip-value danger">{{ cooperatingCount }} 家</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="ip-card">
              <div class="ip-label">预估同步更新规则</div>
              <div class="ip-value warning">{{ Math.ceil(selectedIds.length * 1.5) }} 条</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" :disabled="!canSubmit">
          <el-icon><Select /></el-icon> 确认执行批量操作
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Select } from '@element-plus/icons-vue'
import { ProviderLevelMap, CooperationStatusMap } from '@/api/logisticsProvider'
import type { LogisticsProvider } from '@/types/business'
import { getRefreshListData, batchEnable, batchDisable, batchUpdateFees, batchAdjustPriority, batchUpdateLevel } from '@/api/logisticsProviderBatch'

const props = defineProps<{
  modelValue: boolean
  operationType: 'enable' | 'disable' | 'fee' | 'priority' | 'level'
  selectedIds: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': [{ type: string; result: boolean; idsNeedRefresh: number[] }]
}>()

const submitting = ref(false)
const showFullList = ref(false)
const providerList = ref<LogisticsProvider[]>([])

const form = reactive<any>({
  reason: '',
  strategy: 'skip',
  feeMode: 'set',
  firstWeightFee: undefined as number | undefined,
  additionalWeightFee: undefined as number | undefined,
  baseServiceFee: undefined as number | undefined,
  changeReason: '',
  confirmedByName: '',
  priorityMode: 'increase',
  priorityValue: 10,
  targetLevel: 3,
})

const opTitles: Record<string, string> = {
  enable: '批量启用物流服务商',
  disable: '批量禁用物流服务商',
  fee: '批量更新物流资费',
  priority: '批量调整匹配优先级',
  level: '批量调整服务商等级',
}

const dialogTitle = computed(() => opTitles[props.operationType] || '批量操作')

const cooperatingCount = computed(() =>
  providerList.value.filter(p => p.cooperationStatus === 1).length
)
const hasCooperatingProvider = computed(() => cooperatingCount.value > 0)

const displayProviders = computed(() =>
  showFullList.value ? providerList.value : providerList.value.slice(0, 6)
)

const canSubmit = computed(() => {
  const t = props.operationType
  if (t === 'enable' || t === 'disable') return form.reason.trim().length >= 2
  if (t === 'fee') {
    return form.changeReason.trim().length >= 4 &&
      (form.firstWeightFee != null || form.additionalWeightFee != null || form.baseServiceFee != null) &&
      (!hasCooperatingProvider.value || !!form.confirmedByName)
  }
  if (t === 'priority') return form.priorityValue != null
  if (t === 'level') return form.targetLevel != null && form.changeReason.trim().length >= 4
  return true
})

const getPreviewTagType = (p: any): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<number, any> = { 1: 'success', 2: 'warning', 3: 'danger' }
  return typeMap[p.cooperationStatus] || 'info'
}

const handleClose = () => {
  if (submitting.value) return
  emit('update:modelValue', false)
}

const loadProviderList = async () => {
  if (!props.selectedIds.length) return
  try {
    const res = await getRefreshListData(props.selectedIds)
    providerList.value = res.data || []
  } catch {
    // fallback: basic info only
  }
}

const handleSubmit = async () => {
  let tipMsg = ''
  const t = props.operationType
  if (t === 'enable') tipMsg = `确认批量启用 ${props.selectedIds.length} 家服务商？启用前将执行前置校验。`
  else if (t === 'disable') tipMsg = `⚠️ 确认批量禁用 ${props.selectedIds.length} 家服务商？将暂停所有新订单分配！`
  else if (t === 'fee') tipMsg = `确认批量更新资费？若包含合作生效服务商，需确认人【${form.confirmedByName || '未选择'}】二次确认。`
  else if (t === 'priority') tipMsg = `确认批量调整优先级（${form.priorityMode === 'set' ? '设置为' : form.priorityMode === 'increase' ? '+' : '-'}${form.priorityValue}）？`
  else if (t === 'level') tipMsg = `⚠️ 确认批量调整服务商等级为【${ProviderLevelMap[form.targetLevel]?.label || ''}】？将直接影响服务商权益！`

  try {
    await ElMessageBox.confirm(tipMsg, '批量操作最终确认', {
      type: t === 'disable' || t === 'level' ? 'error' : 'warning',
      confirmButtonText: '确认执行', cancelButtonText: '再检查一下'
    })
  } catch { return }

  submitting.value = true
  try {
    let success = false
    let idsNeedRefresh: number[] = []

    if (t === 'enable') {
      const res = await batchEnable(props.selectedIds)
      success = res.data?.success || false
      ElMessage.success(`批量启用完成：成功 ${res.data?.successCount || 0} / ${res.data?.total || 0}，失败 ${res.data?.failCount || 0}`)
      idsNeedRefresh = (res.data?.results || []).filter((r: any) => r.success).map((r: any) => r.id)
    } else if (t === 'disable') {
      const res = await batchDisable(props.selectedIds, form.reason)
      success = res.data?.success || false
      ElMessage.success(`批量禁用完成：成功 ${res.data?.successCount || 0} / ${res.data?.total || 0}`)
      idsNeedRefresh = (res.data?.results || []).filter((r: any) => r.success).map((r: any) => r.id)
    } else if (t === 'fee') {
      const payload = {
        ids: props.selectedIds, firstWeightFee: form.firstWeightFee,
        additionalWeightFee: form.additionalWeightFee, baseServiceFee: form.baseServiceFee,
        changeReason: form.changeReason, isCoreChange: hasCooperatingProvider.value,
        confirmedByName: form.confirmedByName
      }
      const res = await batchUpdateFees(payload)
      success = res.data?.success || false
      ElMessage.success(`批量资费更新完成：成功 ${res.data?.successCount || 0} / ${res.data?.total || 0}`)
      idsNeedRefresh = (res.data?.results || []).filter((r: any) => r.success).map((r: any) => r.id)
    } else if (t === 'priority') {
      const res = await batchAdjustPriority({
        ids: props.selectedIds, adjustMode: form.priorityMode,
        value: form.priorityValue, changeReason: form.changeReason
      })
      success = res.data?.success || false
      ElMessage.success(`批量优先级调整：成功 ${res.data?.successCount || 0} / ${res.data?.total || 0}`)
      idsNeedRefresh = (res.data?.results || []).filter((r: any) => r.success).map((r: any) => r.id)
    } else if (t === 'level') {
      const res = await batchUpdateLevel({
        ids: props.selectedIds, level: form.targetLevel, changeReason: form.changeReason
      })
      success = res.data?.success || false
      ElMessage.success(`批量等级调整：成功 ${res.data?.successCount || 0} / ${res.data?.total || 0}`)
      idsNeedRefresh = (res.data?.results || []).filter((r: any) => r.success).map((r: any) => r.id)
    }

    emit('submitted', { type: t, result: success, idsNeedRefresh })
    emit('update:modelValue', false)
  } catch (e: any) {
    ElMessage.error(e?.message || '批量操作失败')
  } finally {
    submitting.value = false
  }
}

watch(() => [props.modelValue, props.selectedIds], ([v]) => {
  if (v) {
    showFullList.value = false
    loadProviderList()
    // reset form
    form.reason = ''; form.strategy = 'skip'
    form.feeMode = 'set'
    form.firstWeightFee = undefined; form.additionalWeightFee = undefined; form.baseServiceFee = undefined
    form.changeReason = ''; form.confirmedByName = ''
    form.priorityMode = 'increase'; form.priorityValue = 10
    form.targetLevel = 3
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.batch-operation-dialog {
  :deep(.el-dialog) {
    animation: batchZoomIn 0.3s cubic-bezier(0.3, 0, 0.7, 1);
    border-radius: 12px;
    overflow: hidden;
    border-top: 4px solid #409EFF;
  }
  @keyframes batchZoomIn {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }

  .batch-wrap { padding: 0 4px; }

  .count-num {
    font-size: 18px; font-weight: 700; color: #409EFF;
    font-family: Consolas, monospace;
    padding: 0 4px;
  }

  .selected-preview {
    margin-top: 14px;
    .preview-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
      .preview-title { font-size: 13px; font-weight: 600; color: #303133; }
    }
    .preview-tags {
      display: flex; gap: 6px; flex-wrap: wrap;
      max-height: 96px; overflow: hidden;
      transition: max-height 0.3s;

      &.preview-tags-expanded { max-height: none; }
    }
    .provider-tag {
      font-size: 12px;
      .sub-info { font-size: 10px; color: #909399; margin-left: 4px; opacity: 0.8; }
    }
    .preview-more {
      font-size: 11px; color: #409EFF; margin-top: 6px; cursor: pointer;
    }
  }

  .batch-form { padding: 4px 8px; }
  .field-row { display: flex; align-items: center; gap: 8px; }
  .field-tip { font-size: 11px; color: #909399; margin-top: 4px; }

  .confirmer-wrap {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #606266;
  }

  .impact-preview {
    margin-top: 16px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #fafcff, #f5f9ff);
    border-radius: 8px; border: 1px solid #e0e8f2;

    .ip-title {
      font-size: 13px; font-weight: 600; color: #303133;
      margin-bottom: 10px;
    }
    .ip-card {
      padding: 10px 12px; border-radius: 6px;
      background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      text-align: center;
      .ip-label { font-size: 11px; color: #909399; }
      .ip-value { font-size: 20px; font-weight: 700; margin-top: 4px; font-family: Consolas, monospace;
        &.primary { color: #409EFF; }
        &.danger { color: #f56c6c; }
        &.warning { color: #e6a23c; }
      }
    }
  }

  .dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 12px 4px; }
}
</style>
