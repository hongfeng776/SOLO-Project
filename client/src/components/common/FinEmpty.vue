<template>
  <div class="fin-empty">
    <el-empty
      :image="imageSrc"
      :image-size="imageSize"
      :description="displayDescription"
    >
      <slot name="image" />
      <slot name="description" />
      <slot name="action" />
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type EmptyType = 'no-data' | 'no-permission' | 'network-error'

interface IProps {
  type?: EmptyType
  description?: string
  image?: string
  imageSize?: number
}

const props = withDefaults(defineProps<IProps>(), {
  type: 'no-data',
  imageSize: 120
})

const typeConfig: Record<EmptyType, { icon: string; description: string }> = {
  'no-data': {
    icon: '📊',
    description: '暂无数据'
  },
  'no-permission': {
    icon: '🔒',
    description: '暂无访问权限'
  },
  'network-error': {
    icon: '📡',
    description: '网络连接失败'
  }
}

const imageSrc = computed(() => {
  if (props.image) return props.image
  return ''
})

const displayDescription = computed(() => {
  if (props.description) return props.description
  return typeConfig[props.type]?.description || '暂无数据'
})
</script>

<style lang="scss" scoped>
.fin-empty {
  padding: 60px 20px;

  :deep(.el-empty) {
    --el-empty-description-color: var(--fin-text-secondary);
  }

  :deep(.el-empty__image) {
    margin-bottom: 16px;
  }

  :deep(.el-empty__description) {
    font-size: 14px;
    color: var(--fin-text-secondary);
  }

  :deep(.el-empty__image svg) {
    width: 120px;
    height: 120px;
  }
}
</style>
