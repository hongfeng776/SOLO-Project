<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="1100px"
    class="submit-dialog"
    append-to-body
    destroy-on-close
    top="5vh"
  >
    <QualificationSubmit
      v-if="dialogVisible"
      :merchant-id="merchantId || 0"
      :is-resubmit-mode="isResubmit"
      :initial-data="initialData"
      @submitted="onSubmitted"
      @resubmitted="onResubmitted"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QualificationSubmit from '../qualificationSubmit.vue'
import type { MerchantAuditSettleItem } from '@/api/merchantQualification'

const props = defineProps<{
  modelValue: boolean
  merchantId?: number
  initialData?: MerchantAuditSettleItem | null
  isResubmit?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submitted', data: any): void
  (e: 'resubmitted', data: any): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const title = computed(() => props.isResubmit ? '商家资质补传与重新提交' : '商家入驻资质提交')

const onSubmitted = (data: any) => emit('submitted', data)
const onResubmitted = (data: any) => emit('resubmitted', data)
</script>

<style lang="scss" scoped>
.submit-dialog {
  :deep(.el-dialog__body) { padding: 0; max-height: 80vh; overflow-y: auto; }
  :deep(.el-dialog__footer) { padding: 12px 24px; border-top: 1px solid var(--el-border-color-lighter); }
}
</style>
