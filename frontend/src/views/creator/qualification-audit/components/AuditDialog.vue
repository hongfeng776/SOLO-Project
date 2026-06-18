<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div class="audit-dialog">
      <div class="audit-tip" :class="auditType">
        <el-icon class="tip-icon">
          <CircleCheckFilled v-if="auditType === 'pass'" />
          <Warning v-else />
        </el-icon>
        <div class="tip-text">
          <div class="tip-title">
            {{ auditType === 'pass' ? '确认通过该资质申请？' : '确认驳回该资质申请？' }}
          </div>
          <div class="tip-desc">
            {{ auditType === 'pass' ? '审核通过后将自动解锁达人专属权益与功能权限' : '审核驳回后将锁定相关权限并通知申请人' }}
          </div>
        </div>
      </div>

      <el-form v-if="auditType === 'reject'" label-width="100px" class="mt-20">
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        :type="auditType === 'pass' ? 'success' : 'danger'"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认{{ auditType === 'pass' ? '通过' : '驳回' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Warning } from '@element-plus/icons-vue'
import { auditQualification } from '@api/creator-qualification'

const props = defineProps<{
  modelValue: boolean
  applyId: number
  auditType: 'pass' | 'reject'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const rejectReason = ref('')

const dialogTitle = computed(() => {
  return props.auditType === 'pass' ? '资质审核通过' : '资质审核驳回'
})

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (props.auditType === 'reject' && !rejectReason.value.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }

  submitting.value = true
  try {
    const status = props.auditType === 'pass' ? 2 : 3
    await auditQualification(props.applyId, status, rejectReason.value)
    ElMessage.success(props.auditType === 'pass' ? '审核通过成功' : '审核驳回成功')
    emit('success')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('审核失败', error)
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      rejectReason.value = ''
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

    .tip-icon {
      font-size: 32px;
      flex-shrink: 0;

      .pass & {
        color: #67c23a;
      }

      .reject & {
        color: #f56c6c;
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
    }

    .tip-desc {
      font-size: 13px;
      color: $text-regular;
      line-height: 1.6;
    }
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
