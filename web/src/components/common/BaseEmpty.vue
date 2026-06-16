<template>
  <div class="base-empty">
    <el-empty :description="finalDescription" :image="image || undefined">
      <template #image v-if="image">
        <el-image :src="image" :style="{ width: imageSize + 'px', height: imageSize + 'px' }" fit="contain" />
      </template>
      <template #default v-if="$slots.default">
        <slot />
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type EmptyType = 'data' | 'search' | 'network'

interface Props {
  description?: string
  image?: string
  imageSize?: number
  type?: EmptyType
}

const props = withDefaults(defineProps<Props>(), {
  imageSize: 170,
  type: 'data',
})

const typeDescriptions: Record<EmptyType, string> = {
  data: '暂无数据',
  search: '未找到相关结果',
  network: '网络连接失败，请稍后重试',
}

const finalDescription = computed(() => {
  if (props.description) {
    return props.description
  }
  return typeDescriptions[props.type]
})
</script>

<style scoped lang="scss">
.base-empty {
  padding: 40px 0;
}
</style>
