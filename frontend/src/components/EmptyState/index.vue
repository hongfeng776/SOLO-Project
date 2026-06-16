<template>
  <div class="empty-state-wrapper">
    <el-empty
      :description="description"
      :image-size="imageSize"
    >
      <template #image>
        <el-icon class="empty-icon" :size="iconSize">
          <component :is="icon" />
        </el-icon>
      </template>
      <el-button v-if="showAction" type="primary" @click="handleAction">
        {{ actionText }}
      </el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'data' | 'search' | 'network' | 'error' | 'permission'
  description?: string
  imageSize?: number
  showAction?: boolean
  actionText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'data',
  imageSize: 100,
  showAction: false,
  actionText: '去添加'
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

const iconMap: Record<string, string> = {
  data: 'DataLine',
  search: 'Search',
  network: 'Connection',
  error: 'Warning',
  permission: 'Lock'
}

const descMap: Record<string, string> = {
  data: '暂无数据',
  search: '未找到相关数据',
  network: '网络连接失败',
  error: '加载出错了',
  permission: '暂无访问权限'
}

const icon = computed(() => iconMap[props.type] || iconMap.data)
const description = computed(() => props.description || descMap[props.type])
const iconSize = computed(() => props.imageSize)

const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.empty-state-wrapper {
  padding: $spacing-xxl 0;

  .empty-icon {
    color: $border-color-light;
    margin-bottom: $spacing-base;
  }

  :deep(.el-empty__description) {
    color: $text-secondary;
    margin-bottom: $spacing-lg;
  }
}
</style>
