<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div class="batch-audit-dialog">
      <template v-if="loading">
        <div class="skeleton-wrapper">
          <div class="skeleton-block" v-for="i in 3" :key="i">
            <div class="skeleton-line wide" />
            <div class="skeleton-line narrow" />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="batch-tip" :class="tipClass">
          <el-icon class="tip-icon">
            <CircleCheckFilled v-if="action === 'pass'" />
            <RefreshLeft v-else-if="action === 'return'" />
            <Warning v-else />
          </el-icon>
          <div class="tip-text">
            <div class="tip-title">{{ tipTitle }}</div>
            <div class="tip-desc">
              共选中 <b>{{ ids.length }}</b> 项申请
            </div>
          </div>
        </div>

        <el-alert
          v-if="hasBrandMerchant"
          title="品牌商家提醒"
          type="warning"
          :closable="false"
          class="mt-20"
          show-icon
        >
          <template #default>
            <div>选中的申请中包含品牌商家，批量操作可能影响品牌合作关系，请谨慎操作。</div>
          </template>
        </el-alert>

        <el-form v-if="needsReason" label-width="100px" class="mt-20">
          <el-form-item :label="reasonLabel" required>
            <el-input
              v-model="reason"
              type="textarea"
              :rows="4"
              :placeholder="reasonPlaceholder"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <el-alert
          title="温馨提示"
          type="info"
          :closable="false"
          class="mt-20"
          show-icon
        >
          <template #default>
            <div>批量操作将同时处理所有选中的申请，仅符合当前审核状态的申请会被处理。</div>
          </template>
        </el-alert>
      </template>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-popconfirm
        :title="confirmText"
        confirm-button-text="确认"
        cancel-button-text="取消"
        @confirm="handleSubmit"
      >
        <template #reference>
          <el-button
            :type="action === 'pass' ? 'success' : action === 'return' ? 'warning' : 'danger'"
            :loading="submitting"
            :disabled="loading"
          >
            确认批量{{ actionLabel }}
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Warning, RefreshLeft } from '@element-plus/icons-vue'
import { batchAuditMerchant, getMerchantOnboardingDetail } from '@api/merchant-onboarding'

const props = defineProps<{
  modelValue: boolean
  ids: number[]
  action: 'pass' | 'reject' | 'return'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const loading = ref(false)
const reason = ref('')
const hasBrandMerchant = ref(false)

const needsReason = computed(() => props.action === 'reject' || props.action === 'return')

const tipClass = computed(() => {
  if (props.action === 'pass') return 'pass'
  if (props.action === 'return') return 'return'
  return 'reject'
})

const dialogTitle = computed(() => {
  const map: Record<string, string> = {
    pass: '批量审核通过',
    reject: '批量审核驳回',
    return: '批量退回'
  }
  return map[props.action]
})

const tipTitle = computed(() => {
  const map: Record<string, string> = {
    pass: '确认批量通过选中的申请？',
    reject: '确认批量驳回选中的申请？',
    return: '确认批量退回选中的申请？'
  }
  return map[props.action]
})

const reasonLabel = computed(() => props.action === 'return' ? '退回原因' : '驳回原因')

const reasonPlaceholder = computed(() => props.action === 'return' ? '请输入退回原因' : '请输入驳回原因')

const actionLabel = computed(() => {
  const map: Record<string, string> = {
    pass: '通过',
    reject: '驳回',
    return: '退回'
  }
  return map[props.action]
})

const confirmText = computed(() => {
  return `确认对 ${props.ids.length} 项申请执行批量${actionLabel.value}操作？此操作不可撤销。`
})

const checkBrandMerchant = async () => {
  if (props.ids.length === 0) {
    hasBrandMerchant.value = false
    return
  }
  loading.value = true
  try {
    for (const id of props.ids.slice(0, 10)) {
      const detail = await getMerchantOnboardingDetail(id)
      if (detail.merchantType === 'brand') {
        hasBrandMerchant.value = true
        break
      }
    }
  } catch {
    hasBrandMerchant.value = false
  } finally {
    loading.value = false
  }
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (needsReason.value && !reason.value.trim()) {
    ElMessage.warning(reasonLabel.value + '不能为空')
    return
  }

  if (props.ids.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }

  submitting.value = true
  try {
    const result = await batchAuditMerchant(props.ids, props.action, reason.value)
    ElMessage.success(
      `批量审核完成，成功处理 ${result.successCount} 项，共 ${result.totalCount} 项`
    )
    emit('success')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('批量审核失败', error)
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      reason.value = ''
      hasBrandMerchant.value = false
      checkBrandMerchant()
    }
  }
)
</script>

<style lang="scss" scoped>
.batch-audit-dialog {
  .batch-tip {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;

    &.pass {
      background: #f0f9eb;
    }

    &.reject {
      background: #fef0f0;
    }

    &.return {
      background: #fdf6ec;
    }

    .tip-icon {
      font-size: 32px;
      flex-shrink: 0;

      .pass & {
        color: #67c23a;
      }

      .reject & {
        color: #f56c6c;
      }

      .return & {
        color: #e6a23c;
      }
    }

    .tip-text {
      flex: 1;
    }

    .tip-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 6px;

      .pass & {
        color: #67c23a;
      }

      .reject & {
        color: #f56c6c;
      }

      .return & {
        color: #e6a23c;
      }
    }

    .tip-desc {
      font-size: 13px;
      color: $text-regular;

      b {
        color: $text-primary;
      }
    }
  }

  .skeleton-wrapper {
    .skeleton-block {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .skeleton-line {
      height: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
      background-size: 400% 100%;
      animation: skeleton-loading 1.4s ease infinite;

      &.wide {
        width: 80%;
        margin-bottom: 10px;
      }

      &.narrow {
        width: 50%;
      }
    }
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
