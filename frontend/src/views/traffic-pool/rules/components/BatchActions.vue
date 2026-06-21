<template>
  <div class="batch-actions">
    <el-button
      type="success"
      size="small"
      :icon="VideoPlay"
      plain
      :disabled="selectedCount === 0"
      @click="$emit('batch-enable')"
    >
      批量启用
    </el-button>
    <el-button
      type="info"
      size="small"
      :icon="VideoPause"
      plain
      :disabled="selectedCount === 0"
      @click="$emit('batch-disable')"
    >
      批量停用
    </el-button>
    <el-button
      v-if="permission?.canAdjust"
      type="warning"
      size="small"
      :icon="Odometer"
      plain
      :disabled="selectedCount === 0"
      @click="$emit('batch-adjust')"
    >
      批量调整权重
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, VideoPause, Odometer } from '@element-plus/icons-vue'
import type { TrafficWeightRulePermission } from '@/types/business'

defineProps<{
  selectedCount: number
  permission: TrafficWeightRulePermission
}>()

defineEmits<{
  'batch-enable': []
  'batch-disable': []
  'batch-adjust': []
}>()
</script>

<style lang="scss" scoped>
.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
