<template>
  <el-dialog :model-value="modelValue" @update:model-value="handleClose"
    title="⚠️ 核心参数变更 - 二次确认" width="780px"
    :close-on-click-modal="false" class="second-confirm-dialog"
    destroy-on-close>
    <div class="confirm-wrap">
      <el-alert type="warning" :closable="false" show-icon
        title="正在修改已合作生效服务商的核心参数"
        description="以下参数修改将直接影响平台物流匹配规则、订单路由、结算费用，需由有权限人员进行二次确认后方可生效。修改完成后，系统将自动同步更新物流匹配规则引擎。">
      </el-alert>

      <div class="provider-info-bar" v-if="providerInfo">
        <div class="info-item">
          <span class="label">服务商</span>
          <span class="value"><strong>{{ providerInfo.providerName }}</strong> ({{ providerInfo.providerCode }})</span>
        </div>
        <div class="info-item">
          <span class="label">当前合作状态</span>
          <el-tag size="small" type="success">合作中</el-tag>
        </div>
      </div>

      <div class="compare-section">
        <h4 class="section-title">变更内容对比（{{ coreFields.length }} 项核心参数）</h4>
        <el-table :data="compareRows" border stripe size="default" style="width: 100%">
          <el-table-column label="字段名称" prop="label" width="160" align="center"
            :cell-style="{ background: '#fafbfc', fontWeight: 600 }" />
          <el-table-column label="变更前" align="center">
            <template #default="{ row }">
              <span class="value-before">{{ row.beforeDisplay }}</span>
            </template>
          </el-table-column>
          <el-table-column label="方向" width="80" align="center">
            <template #default>
              <el-icon :size="20" color="#409EFF"><Right /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="变更后" align="center">
            <template #default="{ row }">
              <span class="value-after">{{ row.afterDisplay }}</span>
            </template>
          </el-table-column>
          <el-table-column label="影响范围" width="150" align="center">
            <template #default="{ row }">
              <el-tag v-for="tag in row.impacts" :key="tag" size="small" class="impact-tag" :type="getImpactTagType(tag)">
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="impact-analysis">
        <h4 class="section-title">系统影响分析</h4>
        <el-row :gutter="12">
          <el-col :span="8">
            <div class="impact-card match-rule">
              <div class="icon"><el-icon><SetUp /></el-icon></div>
              <div class="info">
                <div class="title">匹配规则</div>
                <div class="value">将自动更新</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="impact-card settlement">
              <div class="icon"><el-icon><Wallet /></el-icon></div>
              <div class="info">
                <div class="title">费用结算</div>
                <div class="value">新订单按新资费</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="impact-card route">
              <div class="icon"><el-icon><Connection /></el-icon></div>
              <div class="info">
                <div class="title">路由调度</div>
                <div class="value">优先级重新计算</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-form label-width="110px" class="confirm-form">
        <el-form-item label="变更原因" required>
          <el-input v-model="changeReason" type="textarea" :rows="2" placeholder="请详细填写本次核心参数变更的原因说明" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="二次确认人" required>
          <el-select v-model="confirmerName" placeholder="选择有权限的二次确认人" filterable style="width: 100%">
            <el-option label="运营总监 - 王总" value="运营总监-王总" />
            <el-option label="物流经理 - 李经理" value="物流经理-李经理" />
            <el-option label="财务主管 - 张主管" value="财务主管-张主管" />
          </el-select>
        </el-form-item>
        <el-form-item label="安全密码" required>
          <el-input v-model="securePassword" type="password" placeholder="请输入您的操作安全密码" show-password maxlength="32" />
        </el-form-item>
      </el-form>

      <div class="rule-summary">
        <el-icon color="#409EFF"><InfoFilled /></el-icon>
        <span>系统将记录操作日志：操作人、二次确认人、确认时间、变更前后快照，并自动触发物流匹配规则同步。</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消修改</el-button>
        <el-button @click="handleBackEdit">
          <el-icon><ArrowLeft /></el-icon> 返回编辑
        </el-button>
        <el-button type="primary" @click="handleConfirm" :loading="confirming" :disabled="!canConfirm">
          <el-icon><Key /></el-icon> 确认提交变更
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Right, SetUp, Wallet, Connection, InfoFilled, Key, ArrowLeft } from '@element-plus/icons-vue'
import { updateProvider } from '@/api/logisticsProvider'
import type { ProviderUpdateData } from '@/api/logisticsProvider'

const props = defineProps<{
  modelValue: boolean
  originalData: Record<string, any>
  newData: Record<string, any>
  coreFields: string[]
  providerId: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirmed': []
  'back-edit': []
}>()

const changeReason = ref('')
const confirmerName = ref('')
const securePassword = ref('')
const confirming = ref(false)
const providerInfo = ref<any>(null)

const fieldLabelMap: Record<string, { label: string; impacts: string[]; format?: (v: any) => string }> = {
  firstWeightFee: { label: '首重资费(元/kg)', impacts: ['费用结算', '匹配规则'], format: v => v != null ? '¥' + Number(v).toFixed(2) : '-' },
  additionalWeightFee: { label: '续重资费(元/kg)', impacts: ['费用结算', '匹配规则'], format: v => v != null ? '¥' + Number(v).toFixed(2) : '-' },
  baseServiceFee: { label: '基础服务费(元/单)', impacts: ['费用结算'], format: v => v != null ? '¥' + Number(v).toFixed(2) : '-' },
  cooperationStatus: {
    label: '合作状态', impacts: ['路由调度', '匹配规则', '结算'],
    format: v => ({ 0: '未合作', 1: '合作中', 2: '合作暂停', 3: '合作终止' }[v as any] || v)
  },
  level: {
    label: '服务商等级', impacts: ['匹配优先级', '服务承诺'],
    format: v => ({ 1: '入门级', 2: '青铜', 3: '白银', 4: '黄金', 5: '铂金' }[v as any] || v)
  },
  matchPriority: { label: '匹配优先级', impacts: ['匹配规则', '路由调度'], format: v => v ?? '-' },
  serviceProvince: { label: '服务覆盖省份', impacts: ['路由调度', '订单分配'], format: v => v || '-' },
  dailyOrderLimit: { label: '日单量合作额度', impacts: ['订单分配', '限流策略'], format: v => (v ?? '-') + ' 单' },
}

const compareRows = computed(() => {
  return (props.coreFields || []).map(field => {
    const config = fieldLabelMap[field] || { label: field, impacts: ['系统规则'] }
    const before = props.originalData?.[field]
    const after = props.newData?.[field]
    return {
      field,
      label: config.label,
      beforeDisplay: config.format ? config.format(before) : (before ?? '-'),
      afterDisplay: config.format ? config.format(after) : (after ?? '-'),
      impacts: config.impacts,
      changed: JSON.stringify(before) !== JSON.stringify(after),
    }
  })
})

const canConfirm = computed(() =>
  changeReason.value.trim().length >= 8 &&
  !!confirmerName.value &&
  securePassword.value.length >= 4
)

const getImpactTagType = (tag: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const m: Record<string, any> = { '费用结算': 'danger', '匹配规则': 'warning', '路由调度': 'primary', '订单分配': 'success', '限流策略': 'info', '结算': 'danger', '服务承诺': 'warning', '优先级': 'primary' }
  return m[tag] || 'info'
}

const handleClose = () => {
  if (confirming.value) return
  emit('update:modelValue', false)
}

const handleBackEdit = () => {
  emit('back-edit')
  emit('update:modelValue', false)
}

const handleConfirm = async () => {
  if (!canConfirm.value) {
    ElMessage.warning('请完整填写变更原因、选择确认人并输入安全密码')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认提交 ${props.coreFields.length} 项核心参数变更？此操作将同步更新物流匹配规则并产生日志留痕。`,
      '最终确认',
      { confirmButtonText: '已核对无误，确认变更', cancelButtonText: '再检查一下', type: 'warning' }
    )
  } catch { return }

  confirming.value = true
  try {
    const payload: ProviderUpdateData = {
      id: props.providerId,
      data: { ...props.newData },
      isCoreChange: true,
      confirmedByName: confirmerName.value,
      changeReason: changeReason.value,
    }
    await updateProvider(payload)
    ElMessage.success('核心参数变更已提交，正在同步更新物流匹配规则...')
    await nextTick()
    emit('confirmed')
    emit('update:modelValue', false)
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    confirming.value = false
  }
}

watch(() => props.modelValue, v => {
  if (v) {
    providerInfo.value = props.originalData
    changeReason.value = ''
    confirmerName.value = ''
    securePassword.value = ''
  }
})
</script>

<style lang="scss" scoped>
.second-confirm-dialog {
  :deep(.el-dialog) {
    animation: dialogZoomFadeIn 0.35s cubic-bezier(0.3, 0, 0.7, 1);
    border-radius: 12px;
    overflow: hidden;
    border-top: 4px solid #e6a23c;
  }
  @keyframes dialogZoomFadeIn {
    0% { opacity: 0; transform: scale(0.92) translateY(-16px); }
    60% { opacity: 1; transform: scale(1.01); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  .confirm-wrap { padding: 0 8px; }

  .provider-info-bar {
    display: flex; gap: 24px; flex-wrap: wrap;
    margin-top: 16px; padding: 10px 14px;
    background: #f8fafc; border-radius: 6px;
    border: 1px solid #ebeef5;

    .info-item { display: flex; align-items: center; gap: 8px; font-size: 13px;
      .label { color: #909399; }
      .value { color: #303133; }
    }
  }

  .compare-section { margin-top: 16px; }
  .impact-analysis { margin-top: 16px; }

  .section-title {
    font-size: 14px; font-weight: 600; color: #303133;
    margin: 0 0 10px; padding-left: 8px;
    border-left: 3px solid #409EFF;
  }

  .value-before {
    padding: 3px 8px; background: #fef0f0; border-radius: 4px; color: #f56c6c;
    font-family: Consolas, monospace; font-weight: 500;
  }
  .value-after {
    padding: 3px 8px; background: #f0f9eb; border-radius: 4px; color: #67c23a;
    font-family: Consolas, monospace; font-weight: 500;
  }

  .impact-tag { margin-right: 4px; }

  .impact-card {
    padding: 12px 14px; border-radius: 8px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);

    .icon {
      width: 44px; height: 44px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .info {
      .title { font-size: 13px; color: #909399; }
      .value { font-size: 14px; font-weight: 600; color: #303133; margin-top: 2px; }
    }

    &.match-rule {
      background: linear-gradient(135deg, #ecf5ff, #f0f9ff);
      .icon { background: rgba(64,158,255,0.15); color: #409EFF; }
    }
    &.settlement {
      background: linear-gradient(135deg, #fef0f0, #fff4f0);
      .icon { background: rgba(245,108,108,0.15); color: #f56c6c; }
    }
    &.route {
      background: linear-gradient(135deg, #f0f9eb, #f4fff0);
      .icon { background: rgba(103,194,58,0.15); color: #67c23a; }
    }
  }

  .confirm-form {
    margin-top: 16px; padding: 14px 16px;
    background: #fafbfc; border-radius: 8px;
    border: 1px solid #ebeef5;
  }

  .rule-summary {
    margin-top: 14px; padding: 10px 14px;
    background: #ecf5ff; border-radius: 6px;
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 12px; color: #409EFF; line-height: 1.6;
  }

  .dialog-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 4px 12px 10px;
  }
}
</style>
