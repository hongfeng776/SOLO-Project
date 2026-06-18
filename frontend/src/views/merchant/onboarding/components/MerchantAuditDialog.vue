<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div class="audit-dialog">
      <transition name="fade">
        <div class="audit-tip" :class="tipClass">
          <el-icon class="tip-icon">
            <CircleCheckFilled v-if="isPassType" />
            <RefreshLeft v-else-if="auditType === 'return'" />
            <Warning v-else />
          </el-icon>
          <div class="tip-text">
            <div class="tip-title">{{ tipTitle }}</div>
            <div class="tip-desc">{{ tipDesc }}</div>
          </div>
        </div>
      </transition>

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
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        :type="isPassType ? 'success' : auditType === 'return' ? 'warning' : 'danger'"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认{{ actionLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Warning, RefreshLeft } from '@element-plus/icons-vue'
import {
  initialAuditMerchant,
  finalAuditMerchant,
  returnMerchantApply
} from '@api/merchant-onboarding'

const props = defineProps<{
  modelValue: boolean
  applyId: number
  auditType: 'initial_pass' | 'initial_reject' | 'final_pass' | 'final_reject' | 'return'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const reason = ref('')

const isPassType = computed(() => props.auditType === 'initial_pass' || props.auditType === 'final_pass')

const needsReason = computed(() => props.auditType !== 'initial_pass' && props.auditType !== 'final_pass')

const tipClass = computed(() => {
  if (isPassType.value) return 'pass'
  if (props.auditType === 'return') return 'return'
  return 'reject'
})

const dialogTitle = computed(() => {
  const map: Record<string, string> = {
    initial_pass: '初审通过',
    initial_reject: '初审驳回',
    final_pass: '终审通过',
    final_reject: '终审驳回',
    return: '退回补充'
  }
  return map[props.auditType]
})

const tipTitle = computed(() => {
  const map: Record<string, string> = {
    initial_pass: '确认初审通过该申请？',
    initial_reject: '确认初审驳回该申请？',
    final_pass: '确认终审通过该申请？',
    final_reject: '确认终审驳回该申请？',
    return: '确认退回该申请？'
  }
  return map[props.auditType]
})

const tipDesc = computed(() => {
  const map: Record<string, string> = {
    initial_pass: '初审通过后申请将进入终审环节',
    initial_reject: '初审驳回后将通知商家并关闭申请流程',
    final_pass: '终审通过后将自动开通商家店铺及相关权限',
    final_reject: '终审驳回后将通知商家并关闭申请流程',
    return: '退回后商家需补充材料重新提交'
  }
  return map[props.auditType]
})

const reasonLabel = computed(() => props.auditType === 'return' ? '退回原因' : '驳回原因')

const reasonPlaceholder = computed(() => props.auditType === 'return' ? '请输入退回原因' : '请输入驳回原因')

const actionLabel = computed(() => {
  const map: Record<string, string> = {
    initial_pass: '初审通过',
    initial_reject: '初审驳回',
    final_pass: '终审通过',
    final_reject: '终审驳回',
    return: '退回'
  }
  return map[props.auditType]
})

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

  submitting.value = true
  try {
    switch (props.auditType) {
      case 'initial_pass':
        await initialAuditMerchant(props.applyId, 'pass', '')
        break
      case 'initial_reject':
        await initialAuditMerchant(props.applyId, 'reject', reason.value)
        break
      case 'final_pass':
        await finalAuditMerchant(props.applyId, 'pass', '')
        break
      case 'final_reject':
        await finalAuditMerchant(props.applyId, 'reject', reason.value)
        break
      case 'return':
        await returnMerchantApply(props.applyId, reason.value)
        break
    }
    ElMessage.success(actionLabel.value + '成功')
    emit('success')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('审核操作失败', error)
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      reason.value = ''
    }
  }
)
</script>

<style lang="scss" scoped>
.audit-dialog {
  .audit-tip {
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
      line-height: 1.6;
    }
  }
}

.fade-enter-active {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
