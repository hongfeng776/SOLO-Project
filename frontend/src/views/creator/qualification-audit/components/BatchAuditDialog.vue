<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div class="batch-audit-dialog">
      <div class="batch-tip" :class="auditType">
        <el-icon class="tip-icon">
          <CircleCheckFilled v-if="auditType === 'pass'" />
          <Warning v-else />
        </el-icon>
        <div class="tip-text">
          <div class="tip-title">
            {{ auditType === 'pass' ? '确认批量通过选中的资质申请？' : '确认批量驳回选中的资质申请？' }}
          </div>
          <div class="tip-desc">
            共选中 <b>{{ ids.length }}</b> 项申请
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

      <el-alert
        title="温馨提示"
        type="info"
        :closable="false"
        class="mt-20"
        show-icon
      >
        <template #default>
          <div>批量操作将同时处理所有选中的申请，仅已审核状态的申请会被处理。</div>
        </template>
      </el-alert>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        :type="auditType === 'pass' ? 'success' : 'danger'"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认批量{{ auditType === 'pass' ? '通过' : '驳回' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Warning } from '@element-plus/icons-vue'
import { batchAuditQualification } from '@api/creator-qualification'

const props = defineProps<{
  modelValue: boolean
  ids: number[]
  auditType: 'pass' | 'reject'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const rejectReason = ref('')

const dialogTitle = computed(() => {
  return props.auditType === 'pass' ? '批量审核通过' : '批量审核驳回'
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

  if (props.ids.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }

  submitting.value = true
  try {
    const status = props.auditType === 'pass' ? 2 : 3
    const result = await batchAuditQualification(props.ids, status, rejectReason.value)
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
      rejectReason.value = ''
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

      b {
        color: $text-primary;
      }
    }
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
