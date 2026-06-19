<template>
  <el-dialog
    v-model="visible"
    title="批量价格调整"
    width="800px"
    class="flight-price-batch-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
      <el-icon color="#722ed1"><DataAnalysis /></el-icon>
      <span class="title">批量价格调整</span>
      <span class="count-badge">已选择 {{ selectedCount }} 条价格配置</span>
    </div>
    </template>

    <div class="batch-content">
      <div class="selected-info">
        <el-alert
        :title="`将对以下范围的价格配置进行批量调整`"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
        <div class="info-detail">
          <div class="info-item">
            <span class="label">航班范围：</span>
            <el-tag size="small" type="primary">{{ flightRangeLabel }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">舱位类型：</span>
            <el-tag :type="currentCabinTagType">{{ currentCabinLabel }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">操作类型：</span>
            <span class="value" :style="{ color: selectedOperation?.color }">
              <el-icon><component :is="selectedOperation?.icon" /></el-icon>
              {{ selectedOperation?.label }}
            </span>
          </div>
        </div>
        </template>
      </el-alert>
      </div>

      <div class="operation-cards">
        <div
          v-for="(operation, key) in FlightPriceBatchOperationEnum"
          :key="key"
          class="operation-card"
          :class="{
            active: selectedOperationType === operation.value,
            disabled: operation.value === 'reset' && cabinClass === 'special' && !hasSpecialPermission
          }"
          :style="{ '--card-color': operation.color }"
          @click="handleSelectOperation(operation)"
        >
          <div class="card-ripple" v-if="showRipple === operation.value"></div>
          <div class="card-icon">
            <el-icon><component :is="operation.icon" /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-title">{{ operation.label }}</div>
            <div class="card-desc" v-if="operation.value === 'discount'">将选中航班统一设置为指定折扣</div>
            <div class="card-desc" v-else-if="operation.value === 'increase'">按固定金额上浮票价</div>
            <div class="card-desc" v-else-if="operation.value === 'decrease'">按固定金额下调票价</div>
            <div class="card-desc" v-else-if="operation.value === 'percentageIncrease'">按百分比上浮票价</div>
            <div class="card-desc" v-else-if="operation.value === 'percentageDecrease'">按百分比下调票价</div>
            <div class="card-desc" v-else-if="operation.value === 'reset'">将所有价格恢复至基准价格</div>
          </div>
          <div class="card-check" v-if="selectedOperationType === operation.value">
            <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="selectedOperationType && selectedOperationType !== 'reset'" class="value-input-section">
        <el-divider content-position="left">调整参数</el-divider>
        <div class="value-input-wrapper">
          <el-form :model="form" label-width="120px">
            <el-form-item label="调整数值">
              <div class="value-input-group">
                <el-input-number
                  v-model="form.adjustValue"
                  :min="getMinValue()"
                  :max="getMaxValue()"
                  :step="getStepValue()"
                  :controls="true"
                  size="large"
                  class="large-input"
                />
                <span class="value-unit">{{ selectedOperation?.unit }}</span>
              </div>
              <div class="value-preview" v-if="form.adjustValue !== null">
                <el-icon color="#1890ff"><InfoFilled /></el-icon>
                <span>预计调整幅度：{{ getPreviewText() }}</span>
              </div>
            </el-form-item>

            <el-form-item label="生效时间">
              <el-radio-group v-model="form.effectiveMode">
                <el-radio value="immediate">立即生效</el-radio>
                <el-radio value="scheduled">定时生效</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="form.effectiveMode === 'scheduled'" label="生效时间">
              <el-date-picker
                v-model="form.effectiveTime"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 400px"
              />
            </el-form-item>

            <el-form-item label="调整原因">
              <el-input
                v-model="form.priceReason"
                type="textarea"
                :rows="2"
                placeholder="请输入价格调整原因（必填）"
                maxlength="500"
                show-word-limit
                style="width: 400px"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-if="selectedOperationType" class="preview-section">
        <el-divider content-position="left">价格预览</el-divider>
        <div class="preview-cards">
          <div class="preview-card">
            <div class="preview-label">当前均价</div>
            <div class="preview-value current">¥{{ currentAvgPrice.toFixed(2) }}</div>
          </div>
          <div class="preview-arrow">
            <el-icon :color="priceChangeDirection === 'up' ? '#faad14' : '#52c41a'">
              <component :is="priceChangeDirection === 'up' ? 'Top' : 'Bottom'" />
            </el-icon>
          </div>
          <div class="preview-card">
            <div class="preview-label">预计均价</div>
            <div class="preview-value target" :class="priceChangeDirection">¥{{ targetAvgPrice.toFixed(2) }}</div>
          </div>
          <div class="preview-card">
            <div class="preview-label">变动幅度</div>
            <div class="preview-value change" :class="priceChangeDirection">
              {{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>

      <div v-if="cabinClass === 'special'" class="special-warning">
        <el-alert
          title="特惠舱权限提示"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            特惠舱价格调整需要价格管理员权限，低权限人员无法修改。
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        <template #icon>
          <el-icon v-if="!submitting"><Check /></el-icon>
        </template>
        确认批量调整
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis, CircleCheckFilled, InfoFilled, Check, Top, Bottom
} from '@element-plus/icons-vue'
import { CabinClassEnum, FlightPriceBatchOperationEnum } from '@/utils/enums'
import { batchUpdateFlightPrice } from '@/api/flight'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  selectedPrices: { type: Array, default: () => [] },
  flightIds: { type: Array, default: () => [] },
  cabinClass: { type: String, default: 'economy' },
  hasSpecialPermission: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedCount = computed(() => props.selectedPrices.length)

const selectedOperationType = ref(null)
const selectedOperation = computed(() => {
  return Object.values(FlightPriceBatchOperationEnum).find(o => o.value === selectedOperationType.value)
})

const showRipple = ref(null)

const form = reactive({
  adjustValue: null,
  effectiveMode: 'immediate',
  effectiveTime: null,
  priceReason: ''
})

const submitting = ref(false)

const flightRangeLabel = computed(() => {
  if (props.flightIds.length === 0) return '全部航班'
  if (props.flightIds.length === 1) return '单航班'
  return `多航班 (${props.flightIds.length}个)'
})

const currentCabinLabel = computed(() => {
  const cabin = Object.values(CabinClassEnum).find(c => c.value === props.cabinClass)
  return cabin ? cabin.label : '未知舱位'
})

const currentCabinTagType = computed(() => {
  const typeMap = {
    economy: 'info',
    business: 'warning',
    first: '',
    special: 'success'
  }
  return typeMap[props.cabinClass] || 'info'
})

const currentAvgPrice = computed(() => {
  if (props.selectedPrices.length === 0) return 0
  const total = props.selectedPrices.reduce((sum, p) => sum + parseFloat(p.currentPrice || 0), 0)
  return total / props.selectedPrices.length
})

const targetAvgPrice = computed(() => {
  if (!selectedOperationType.value || form.adjustValue === null) return currentAvgPrice.value
  const base = currentAvgPrice.value
  switch (selectedOperationType.value) {
    case 'discount':
      return base * (form.adjustValue / 100)
    case 'increase':
      return base + form.adjustValue
    case 'decrease':
      return Math.max(0, base - form.adjustValue)
    case 'percentageIncrease':
      return base * (1 + form.adjustValue / 100)
    case 'percentageDecrease':
      return base * (1 - form.adjustValue / 100)
    case 'reset':
      return props.selectedPrices.reduce((sum, p) => sum + parseFloat(p.basePrice || 0), 0) / props.selectedPrices.length
    default:
      return base
  }
})

const priceChangeDirection = computed(() => {
  const diff = targetAvgPrice.value - currentAvgPrice.value
  if (Math.abs(diff) < 0.01) return 'flat'
  return diff > 0 ? 'up' : 'down'
})

const priceChangePercent = computed(() => {
  if (currentAvgPrice.value === 0) return 0
  return ((targetAvgPrice.value - currentAvgPrice.value) / currentAvgPrice.value * 100
})

const canSubmit = computed(() => {
  if (!selectedOperationType.value) return false
  if (selectedOperationType.value === 'reset') {
    if (props.cabinClass === 'special' && !props.hasSpecialPermission) return false
    return !!form.priceReason
  }
  if (form.adjustValue === null || form.adjustValue <= 0) return false
  if (!form.priceReason) return false
  if (form.effectiveMode === 'scheduled' && (!form.effectiveTime) return false
  return true
})

const handleSelectOperation = (operation) => {
  if (operation.value === 'reset' && props.cabinClass === 'special' && !props.hasSpecialPermission) {
    ElMessage.warning('无权限调整特惠舱价格')
    return
  }
  selectedOperationType.value = operation.value
  showRipple.value = operation.value
  setTimeout(() => {
    showRipple.value = null
  }, 600)
  if (operation.value === 'reset') {
    form.adjustValue = null
  }
}

const getMinValue = () => {
  if (selectedOperationType.value === 'discount') return 30
  return 0
}

const getMaxValue = () => {
  if (selectedOperationType.value === 'discount') return 100
  if (selectedOperationType.value?.includes('percentage')) return 100
  return 10000
}

const getStepValue = () => {
  if (selectedOperationType.value?.includes('percentage') || selectedOperationType.value === 'discount') return 1
  return 10
}

const getPreviewText = () => {
  if (!selectedOperation.value || form.adjustValue === null) return ''
  const op = selectedOperation.value
  if (op === 'discount') return `所有票价将调整至 ${form.adjustValue} 折'
  if (op === 'increase') return `所有票价将上浮 ¥${form.adjustValue}`
  if (op === 'decrease') return `所有票价将下调 ¥${form.adjustValue}`
  if (op === 'percentageIncrease') return `所有票价将上浮 ${form.adjustValue}%`
  if (op === 'percentageDecrease') return `所有票价将下调 ${form.adjustValue}%`
  if (op === 'reset') return '所有票价将恢复至基准价格'
  return ''
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    await ElMessageBox.confirm(
      `确认执行"${selectedOperation.value?.label}"操作吗？此操作将影响 ${selectedCount.value} 条价格配置。`,
      '批量操作确认',
      {
        confirmButtonText: '确认执行',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const submitData = {
      flightIds: props.flightIds,
      cabinClass: props.cabinClass,
      operationType: selectedOperationType.value,
      value: form.adjustValue,
      priceReason: form.priceReason
    }

    if (form.effectiveMode === 'scheduled' && form.effectiveTime) {
      submitData.effectiveStartTime = form.effectiveTime[0]
      submitData.effectiveEndTime = form.effectiveTime[1]
    }

    const res = await batchUpdateFlightPrice(submitData)
    ElMessage.success(`批量调整成功，共更新 ${res.updatedCount}/${res.totalCount} 条价格配置`)
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '批量调整失败')
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedOperationType.value = null
    form.adjustValue = null
    form.effectiveMode = 'immediate'
    form.effectiveTime = null
    form.priceReason = ''
  }
})
</script>

<style lang="scss" scoped>
.flight-price-batch-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
      flex: 1;
    }

    .count-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .selected-info {
    margin-bottom: 24px;

    .info-detail {
      display: flex;
      gap: 24px;
      margin-top: 8px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          color: #909399;
          font-size: 14px;
        }

        .value {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
      }
    }
  }

  .operation-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .operation-card {
      position: relative;
      display: flex;
      padding: 20px;
      border: 2px solid #e8e8e8;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      background: #fff;

      &:hover:not(.disabled) {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        border-color: var(--card-color);

        .card-icon {
          transform: scale(1.1);
        }
      }

      &.active {
        border-color: var(--card-color);
        background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(114, 46, 209, 0.05) 100%);
        box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f5f5f5;
      }

      .card-ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        background: var(--card-color);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: ripple 0.6s ease-out;
        opacity: 0.3;
        pointer-events: none;
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--card-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
        margin-right: 16px;
        flex-shrink: 0;
        transition: transform 0.3s ease;
      }

      .card-content {
        flex: 1;

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 12px;
          color: #909399;
          line-height: 1.5;
        }
      }

      .card-check {
        position: absolute;
        top: 12px;
        right: 12px;
        font-size: 20px;
        animation: checkIn 0.3s ease;
      }
    }
  }

  .value-input-section {
    background: #fafafa;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;

    .large-input {
      width: 200px;

      :deep(.el-input-number) {
        height: 48px;
        font-size: 20px;
      }
    }

    .value-input-group {
      display: flex;
      align-items: center;
      gap: 12px;

      .value-unit {
        font-size: 18px;
        font-weight: 600;
        color: #606266;
      }
    }

    .value-preview {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 12px;
      background: #e6f7ff;
      border-radius: 4px;
      color: #1890ff;
      font-size: 13px;
    }
  }

  .preview-section {
    .preview-cards {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
      border-radius: 12px;
      margin-bottom: 24px;

      .preview-card {
        flex: 1;
        text-align: center;
        padding: 16px;
        background: #fff;
        border-radius: 8px;

        .preview-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }

        .preview-value {
          font-size: 24px;
          font-weight: 700;

          &.current {
            color: #606266;
          }

          &.target {
            &.up {
              color: #faad14;
            }
            &.down {
              color: #52c41a;
            }
          }

          &.change {
            font-size: 20px;
            &.up {
              color: #faad14;
            }
            &.down {
              color: #52c41a;
            }
          }
        }
      }

      .preview-arrow {
        font-size: 24px;
        color: #909399;
      }
    }
  }

  .special-warning {
    margin-bottom: 16px;
  }

  @keyframes ripple {
    0% {
      width: 20px;
      height: 20px;
      opacity: 0.5;
    }
    100% {
      width: 300px;
      height: 300px;
      opacity: 0;
    }
  }

  @keyframes checkIn {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}
</style>
