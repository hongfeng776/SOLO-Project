<template>
  <div class="marketing-batch-operation">
    <div class="batch-header">
      <div class="selected-info">
        <el-tag type="primary" effect="dark" size="large">
          <el-icon><Select /></el-icon>
          已选择 {{ selectedCount }} 个活动
        </el-tag>
        <span class="hint">仅草稿、待生效状态的活动支持批量操作</span>
      </div>
      <el-button
        size="large"
        :disabled="selectedCount === 0"
        @click="visible = true"
      >
        <el-icon><Operation /></el-icon>
        批量操作
      </el-button>
    </div>

    <el-dialog
      v-model="visible"
      title="批量操作"
      width="720px"
      :close-on-click-modal="false"
      custom-class="batch-dialog"
    >
      <el-steps :active="currentStep" align-center finish-status="success">
        <el-step title="选择操作" />
        <el-step title="配置参数" />
        <el-step title="确认执行" />
      </el-steps>

      <div class="step-content">
        <div v-if="currentStep === 0" class="operation-cards">
          <div
            v-for="op in operationTypes"
            :key="op.value"
            class="op-card"
            :class="{ active: selectedOp === op.value, disabled: !canUseOp(op.value) }"
            @click="selectOp(op)"
          >
            <div class="op-icon" :style="{ background: op.gradient }">
              <el-icon><component :is="op.icon" /></el-icon>
            </div>
            <div class="op-info">
              <h4>{{ op.label }}</h4>
              <p>{{ op.desc }}</p>
            </div>
            <el-radio
              v-if="canUseOp(op.value)"
              :model-value="selectedOp"
              :value="op.value"
              size="large"
            />
            <el-tag v-else type="info" size="small">不适用</el-tag>
          </div>
        </div>

        <div v-else-if="currentStep === 1" class="config-section">
          <template v-if="selectedOp === 'batch_online' || selectedOp === 'batch_offline'">
            <div class="config-card">
              <div class="card-title">
                <el-icon><VideoPlay v-if="selectedOp === 'batch_online'" />
                <VideoPause v-else /></el-icon>
                {{ selectedOp === 'batch_online' ? '批量上线设置' : '批量下线设置' }}
              </div>
              <el-form label-width="120px">
                <el-form-item label="生效状态">
                  <el-radio-group v-model="config.status">
                    <el-radio :value="1">待生效（到时间自动上线）</el-radio>
                    <el-radio :value="2">立即生效</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-alert
                  type="warning"
                  :closable="false"
                  :title="`将对 ${selectedCount} 个活动执行${selectedOp === 'batch_online' ? '上线' : '下线'}操作，系统将自动校验每个活动的配置合规性`"
                />
              </el-form>
            </div>
          </template>

          <template v-else-if="selectedOp === 'batch_copy'">
            <div class="config-card">
              <div class="card-title">
                <el-icon><Documents /></el-icon>
                批量复制设置
              </div>
              <el-form label-width="120px">
                <el-form-item label="名称后缀">
                  <el-input v-model="config.nameSuffix" placeholder="_副本" />
                </el-form-item>
                <el-form-item label="状态">
                  <el-radio-group v-model="config.newStatus">
                    <el-radio :value="0">保存为草稿</el-radio>
                    <el-radio :value="1">提交待生效</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>
          </template>

          <template v-else-if="selectedOp === 'batch_update'">
            <div class="config-card">
              <div class="card-title">
                <el-icon><EditPen /></el-icon>
                批量修改设置
              </div>
              <div class="field-selector">
                <span class="label">选择修改字段：</span>
                <el-checkbox-group v-model="selectedFields">
                  <el-checkbox
                    v-for="f in editableFields"
                    :key="f.key"
                    :value="f.key"
                  >
                    {{ f.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <el-form label-width="120px" class="update-fields" v-if="selectedFields.length">
                <el-form-item v-if="selectedFields.includes('endTime')" label="结束时间">
                  <el-date-picker
                    v-model="config.updateFields.endTime"
                    type="datetime"
                    placeholder="选择结束时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 280px"
                  />
                </el-form-item>
                <el-form-item v-if="selectedFields.includes('dailyBudget')" label="每日预算">
                  <el-input-number
                    v-model="config.updateFields.dailyBudget"
                    :min="0"
                    :precision="2"
                    :step="100"
                  />
                  <span class="unit">元</span>
                </el-form-item>
                <el-form-item v-if="selectedFields.includes('perUserLimit')" label="每人限领">
                  <el-input-number
                    v-model="config.updateFields.perUserLimit"
                    :min="1"
                    :max="100"
                  />
                  <span class="unit">次</span>
                </el-form-item>
                <el-form-item v-if="selectedFields.includes('perDayLimit')" label="每日限领">
                  <el-input-number
                    v-model="config.updateFields.perDayLimit"
                    :min="0"
                    :max="20"
                  />
                  <span class="unit">次（0不限）</span>
                </el-form-item>
                <el-form-item v-if="selectedFields.includes('cities')" label="适用城市">
                  <el-select
                    v-model="config.cities"
                    multiple
                    collapse-tags
                    placeholder="不选则为全部城市"
                    style="width: 360px"
                  >
                    <el-option
                      v-for="c in allCities"
                      :key="c"
                      :label="c"
                      :value="c"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </template>

          <template v-else-if="selectedOp === 'batch_city_tier'">
            <div class="config-card">
              <div class="card-title">
                <el-icon><LocationFilled /></el-icon>
                城市圈层差异化配置
              </div>
              <div class="tier-configs">
                <div v-for="tier in tierList" :key="tier.key" class="tier-row">
                  <div class="tier-label" :class="`tier-${tier.key}`">
                    <el-icon><MapLocation /></el-icon>
                    {{ tier.label }}
                  </div>
                  <div class="tier-fields">
                    <div class="tier-field">
                      <label>补贴金额</label>
                      <el-input-number
                        v-model="config.tierConfigs[tier.key].subsidyAmount"
                        :min="0"
                        :precision="2"
                        size="small"
                      />
                      <span class="unit-sm">元</span>
                    </div>
                    <div class="tier-field">
                      <label>封顶金额</label>
                      <el-input-number
                        v-model="config.tierConfigs[tier.key].maxSubsidyPerOrder"
                        :min="0"
                        :precision="2"
                        size="small"
                      />
                      <span class="unit-sm">元</span>
                    </div>
                    <div class="tier-field">
                      <label>折扣率</label>
                      <el-input-number
                        v-model="config.tierConfigs[tier.key].discountRate"
                        :min="0"
                        :max="10"
                        :precision="1"
                        size="small"
                      />
                      <span class="unit-sm">折</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-else-if="currentStep === 2" class="confirm-section">
          <div class="confirm-card">
            <div class="confirm-header">
              <el-icon><Warning /></el-icon>
              <span>操作确认</span>
            </div>
            <div class="confirm-body">
              <div class="confirm-row">
                <span class="label">操作类型：</span>
                <el-tag :type="currentOpType?.tagType" effect="dark">
                  {{ currentOpType?.label }}
                </el-tag>
              </div>
              <div class="confirm-row">
                <span class="label">活动数量：</span>
                <b>{{ selectedCount }} 个</b>
              </div>
              <div v-if="selectedPreviewList.length" class="selected-preview">
                <span class="label">活动列表：</span>
                <div class="preview-tags">
                  <el-tag
                    v-for="item in selectedPreviewList"
                    :key="item.id"
                    type="info"
                    closable
                    @close="removeFromSelection(item.id)"
                  >
                    {{ item.name }}
                  </el-tag>
                  <span v-if="selectedCount > 5" class="more">
                    ...还有 {{ selectedCount - 5 }} 个活动
                  </span>
                </div>
              </div>
              <div v-if="JSON.stringify(config.summary) !== '{}'" class="config-summary">
                <span class="label">配置摘要：</span>
                <div class="summary-list">
                  <div v-for="(val, key) in config.summary" :key="key" class="summary-item">
                    <span>{{ getFieldLabel(String(key)) }}：</span>
                    <b>{{ formatSummaryValue(String(key), val) }}</b>
                  </div>
                </div>
              </div>
              <el-alert
                v-if="selectedOp === 'batch_online' || selectedOp === 'batch_copy'"
                type="warning"
                :closable="false"
                title="系统将对每个活动自动进行合规性校验，不通过的活动将跳过并在结果中提示"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
          <el-button @click="visible = false">取消</el-button>
          <el-button
            v-if="currentStep < 2"
            type="primary"
            :disabled="!canNext"
            @click="nextStep"
          >
            下一步
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="executing"
            @click="executeOperation"
          >
            <el-icon><Check /></el-icon>
            确认执行
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resultVisible"
      title="批量操作结果"
      width="560px"
      custom-class="batch-result-dialog"
    >
      <div class="result-summary">
        <div class="result-card success">
          <el-icon><CircleCheck /></el-icon>
          <div>
            <h3>{{ operationResult?.success.length || 0 }}</h3>
            <span>成功</span>
          </div>
        </div>
        <div class="result-card failed">
          <el-icon><CircleClose /></el-icon>
          <div>
            <h3>{{ operationResult?.failed.length || 0 }}</h3>
            <span>失败</span>
          </div>
        </div>
      </div>
      <div v-if="operationResult?.failed.length" class="failed-list">
        <div class="list-header">
          <el-icon><WarningFilled /></el-icon>
          <span>失败详情</span>
        </div>
        <div class="list-content">
          <div
            v-for="(f, idx) in operationResult.failed"
            :key="idx"
            class="failed-item"
          >
            <span class="failed-id">ID: {{ f.id }}</span>
            <span class="failed-reason">{{ f.reason }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleCloseAndRefresh">完成并刷新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Select, Operation, VideoPlay, VideoPause, Documents, EditPen,
  LocationFilled, MapLocation, Warning, Check, CircleCheck,
  CircleClose, WarningFilled
} from '@element-plus/icons-vue'
import {
  batchCopyCampaignApi,
  batchUpdateCampaignApi,
  batchUpdateStatusApi,
  batchUpdateCityTierApi
} from '@/api/marketing'
import { AllCities, CampaignStatus } from '@/enums/marketing'
import type { MarketingCampaign, BatchOperationResult } from '@/types/marketing'

const props = defineProps<{
  selectedItems: MarketingCampaign[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'update:selected-items', items: MarketingCampaign[]): void
}>()

const selectedCount = computed(() => props.selectedItems.length)
const visible = ref(false)
const resultVisible = ref(false)
const currentStep = ref(0)
const selectedOp = ref('')
const executing = ref(false)
const operationResult = ref<BatchOperationResult | null>(null)
const selectedFields = ref<string[]>([])
const allCities = AllCities

const operationTypes = [
  {
    value: 'batch_online',
    label: '批量上线',
    desc: '将待生效活动批量上线运行',
    icon: 'VideoPlay',
    tagType: 'success',
    gradient: 'linear-gradient(135deg, #67c23a, #85ce61)',
    allowedStatuses: [CampaignStatus.DRAFT, CampaignStatus.PENDING]
  },
  {
    value: 'batch_offline',
    label: '批量下线',
    desc: '将运行中活动批量下线',
    icon: 'VideoPause',
    tagType: 'info',
    gradient: 'linear-gradient(135deg, #909399, #a6a9ad)',
    allowedStatuses: [CampaignStatus.PENDING, CampaignStatus.RUNNING, CampaignStatus.PAUSED]
  },
  {
    value: 'batch_copy',
    label: '批量复制',
    desc: '复制选中活动为新的草稿',
    icon: 'Documents',
    tagType: 'warning',
    gradient: 'linear-gradient(135deg, #e6a23c, #f0c78a)',
    allowedStatuses: [0, 1, 2, 3, 4, 5]
  },
  {
    value: 'batch_update',
    label: '批量修改',
    desc: '统一修改活动基础参数',
    icon: 'EditPen',
    tagType: 'primary',
    gradient: 'linear-gradient(135deg, #409eff, #66b1ff)',
    allowedStatuses: [CampaignStatus.DRAFT, CampaignStatus.PENDING, CampaignStatus.PAUSED]
  },
  {
    value: 'batch_city_tier',
    label: '圈层配置',
    desc: '差异化配置各城市力度',
    icon: 'MapLocation',
    tagType: '',
    gradient: 'linear-gradient(135deg, #f56c6c, #f78989)',
    allowedStatuses: [CampaignStatus.DRAFT, CampaignStatus.PENDING]
  }
]

const editableFields = [
  { key: 'endTime', label: '结束时间' },
  { key: 'dailyBudget', label: '每日预算' },
  { key: 'perUserLimit', label: '每人限领' },
  { key: 'perDayLimit', label: '每日限领' },
  { key: 'cities', label: '适用城市' }
]

const tierList = [
  { key: 'tier1', label: '一线城市' },
  { key: 'tier2', label: '二线城市' },
  { key: 'tier3', label: '三线城市' },
  { key: 'tier4', label: '四线及以下' }
]

const defaultTierConfig = () => ({
  subsidyAmount: 0,
  maxSubsidyPerOrder: 0,
  discountRate: 0,
  perUserLimit: 0
})

const config = reactive<any>({
  status: 1,
  nameSuffix: '_副本',
  newStatus: 0,
  updateFields: {},
  cities: [] as string[],
  tierConfigs: {
    tier1: defaultTierConfig(),
    tier2: defaultTierConfig(),
    tier3: defaultTierConfig(),
    tier4: defaultTierConfig()
  },
  summary: {} as Record<string, any>
})

const currentOpType = computed(() => operationTypes.find(o => o.value === selectedOp.value))

const selectedPreviewList = computed(() => props.selectedItems.slice(0, 5))

const canUseOp = (opValue: string) => {
  const op = operationTypes.find(o => o.value === opValue)
  if (!op) return false
  return props.selectedItems.every(item => op.allowedStatuses.includes(item.status))
}

const canNext = computed(() => {
  if (currentStep.value === 0) return !!selectedOp.value
  if (currentStep.value === 1) {
    if (selectedOp.value === 'batch_update') return selectedFields.value.length > 0
    if (selectedOp.value === 'batch_city_tier') return true
    return true
  }
  return true
})

const selectOp = (op: any) => {
  if (!canUseOp(op.value)) return
  selectedOp.value = op.value
}

const nextStep = () => {
  if (currentStep.value === 1) buildConfigSummary()
  currentStep.value++
}

const prevStep = () => {
  currentStep.value--
}

const buildConfigSummary = () => {
  config.summary = {}
  if (selectedOp.value === 'batch_online' || selectedOp.value === 'batch_offline') {
    config.summary.状态 = config.status === 1 ? '待生效' : '立即生效'
  }
  if (selectedOp.value === 'batch_copy') {
    config.summary.名称后缀 = config.nameSuffix || '_副本'
    config.summary.新活动状态 = config.newStatus === 0 ? '草稿' : '待生效'
  }
  if (selectedOp.value === 'batch_update') {
    selectedFields.value.forEach(f => {
      const field = editableFields.find(ef => ef.key === f)
      if (field) {
        if (f === 'cities') {
          config.summary[field.label] = config.cities.length > 0 ? `${config.cities.length}个城市` : '全部城市'
        } else {
          config.summary[field.label] = (config.updateFields as any)[f] ?? '未设置'
        }
      }
    })
  }
  if (selectedOp.value === 'batch_city_tier') {
    config.summary['城市圈层'] = '自定义配置'
  }
}

const getFieldLabel = (key: string) => key

const formatSummaryValue = (key: string, val: any) => {
  if (typeof val === 'number' && (key.includes('预算') || key.includes('金额'))) return `¥${val}`
  return String(val)
}

const removeFromSelection = (id: number) => {
  const newItems = props.selectedItems.filter(i => i.id !== id)
  emit('update:selected-items', newItems)
}

const executeOperation = async () => {
  executing.value = true
  try {
    const ids = props.selectedItems.map(i => i.id)
    let result: any

    switch (selectedOp.value) {
      case 'batch_online':
      case 'batch_offline': {
        const status = selectedOp.value === 'batch_online'
          ? (config.status === 1 ? CampaignStatus.PENDING : CampaignStatus.RUNNING)
          : CampaignStatus.OFFLINE
        result = await batchUpdateStatusApi({ ids, status })
        break
      }
      case 'batch_copy':
        result = await batchCopyCampaignApi({ ids, nameSuffix: config.nameSuffix })
        break
      case 'batch_update': {
        const updateFields: Record<string, any> = { ...config.updateFields }
        if (selectedFields.value.includes('cities')) {
          updateFields.cities = config.cities.length > 0 ? config.cities : null
        }
        result = await batchUpdateCampaignApi({ ids, updateFields })
        break
      }
      case 'batch_city_tier':
        result = await batchUpdateCityTierApi({ ids, tierConfigs: config.tierConfigs })
        break
    }

    operationResult.value = result.data
    resultVisible.value = true
    ElMessage.success('批量操作已完成')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    executing.value = false
  }
}

const handleClose = () => {
  resultVisible.value = false
  visible.value = false
  resetState()
}

const handleCloseAndRefresh = () => {
  resultVisible.value = false
  visible.value = false
  emit('refresh')
  resetState()
}

const resetState = () => {
  currentStep.value = 0
  selectedOp.value = ''
  selectedFields.value = []
  Object.assign(config, {
    status: 1,
    nameSuffix: '_副本',
    newStatus: 0,
    updateFields: {},
    cities: [],
    tierConfigs: {
      tier1: defaultTierConfig(),
      tier2: defaultTierConfig(),
      tier3: defaultTierConfig(),
      tier4: defaultTierConfig()
    },
    summary: {}
  })
}

watch(visible, (val) => {
  if (!val) resetState()
})
</script>

<style lang="scss" scoped>
.marketing-batch-operation {
  .batch-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
    border-radius: 10px;
    border: 1px solid #d9ecff;
    margin-bottom: 16px;

    .selected-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .hint {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .batch-dialog {
    :deep(.el-dialog) {
      border-radius: 14px;
      animation: dialogFadeIn 0.3s ease;
    }

    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      margin: 0;
      padding: 18px 24px;

      .el-dialog__title {
        color: #fff;
        font-weight: 600;
      }

      .el-dialog__close {
        color: #fff;
      }
    }

    :deep(.el-dialog__body) {
      padding: 24px;
    }

    :deep(.el-step__title.is-process) {
      color: #409eff;
      font-weight: 600;
    }
  }

  .batch-result-dialog {
    :deep(.el-dialog) {
      border-radius: 14px;
    }
  }

  @keyframes dialogFadeIn {
    0% { opacity: 0; transform: translateY(-20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .step-content {
    margin-top: 24px;
    min-height: 360px;
  }

  .operation-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .op-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
      background: #fff;
      border: 2px solid #ebeef5;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s;

      &:hover:not(.disabled) {
        border-color: #409eff;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(64, 158, 255, 0.15);
      }

      &.active {
        border-color: #409eff;
        background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f5f7fa;
      }

      .op-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 22px;
        flex-shrink: 0;
      }

      .op-info {
        flex: 1;
        h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: #303133;
        }
        p {
          margin: 0;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .config-section, .confirm-section {
    .config-card, .confirm-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #ebeef5;
      overflow: hidden;

      .card-title, .confirm-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 18px;
        background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
        border-bottom: 1px solid #ebeef5;
        font-size: 14px;
        font-weight: 600;
        color: #303133;

        .el-icon { color: #409eff; }
      }

      .confirm-header {
        color: #e6a23c;
        .el-icon { color: #e6a23c; font-size: 18px; }
      }
    }

    :deep(.el-form) {
      padding: 20px;
    }

    .field-selector {
      padding: 16px 20px 0;
      display: flex;
      align-items: flex-start;
      gap: 10px;

      .label {
        flex-shrink: 0;
        font-size: 14px;
        color: #606266;
        line-height: 28px;
      }
    }

    .update-fields {
      padding-top: 8px !important;
      .unit { margin-left: 8px; color: #909399; }
    }

    .tier-configs {
      padding: 16px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .tier-row {
        display: flex;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        overflow: hidden;

        .tier-label {
          width: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;

          &.tier-tier1 { background: linear-gradient(135deg, #f56c6c, #f78989); }
          &.tier-tier2 { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
          &.tier-tier3 { background: linear-gradient(135deg, #409eff, #66b1ff); }
          &.tier-tier4 { background: linear-gradient(135deg, #909399, #a6a9ad); }
        }

        .tier-fields {
          flex: 1;
          padding: 10px 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;

          .tier-field {
            display: flex;
            align-items: center;
            gap: 6px;

            label {
              width: 60px;
              font-size: 12px;
              color: #606266;
              flex-shrink: 0;
            }

            :deep(.el-input-number) { width: 110px; }
            .unit-sm { font-size: 12px; color: #909399; }
          }
        }
      }
    }
  }

  .confirm-body {
    padding: 20px;

    .confirm-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;

      .label {
        width: 100px;
        color: #909399;
        font-size: 13px;
        flex-shrink: 0;
      }
    }

    .selected-preview {
      margin-bottom: 14px;
      display: flex;
      gap: 10px;

      .preview-tags {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;

        .more {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .config-summary {
      margin-bottom: 14px;

      .summary-list {
        background: #f5f7fa;
        border-radius: 8px;
        padding: 12px 16px;

        .summary-item {
          font-size: 13px;
          line-height: 1.8;
          color: #606266;

          b { color: #409eff; }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .result-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .result-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-radius: 12px;

      &.success {
        background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);

        .el-icon {
          width: 56px;
          height: 56px;
          font-size: 32px;
          border-radius: 50%;
          background: #67c23a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 { color: #67c23a; }
      }

      &.failed {
        background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);

        .el-icon {
          width: 56px;
          height: 56px;
          font-size: 32px;
          border-radius: 50%;
          background: #f56c6c;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 { color: #f56c6c; }
      }

      h3 {
        margin: 0 0 4px 0;
        font-size: 32px;
        font-weight: 700;
      }

      span {
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .failed-list {
    .list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fdf6ec;
      color: #e6a23c;
      border-radius: 8px 8px 0 0;
      font-size: 13px;
      font-weight: 600;
    }

    .list-content {
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid #fdf6ec;
      border-top: none;
      border-radius: 0 0 8px 8px;

      .failed-item {
        display: flex;
        padding: 10px 14px;
        border-bottom: 1px solid #fdf6ec;
        font-size: 13px;

        &:last-child { border-bottom: none; }

        .failed-id {
          width: 80px;
          color: #909399;
          flex-shrink: 0;
        }

        .failed-reason {
          flex: 1;
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
