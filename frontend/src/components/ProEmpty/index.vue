<template>
  <div class="pro-empty">
    <el-empty :description="description" :image-size="imageSize">
      <template v-if="$slots.image" #image>
        <slot name="image" />
      </template>
      <template v-if="$slots.default">
        <slot />
      </template>
      <template v-else-if="showAction">
        <el-button type="primary" size="small" @click="$emit('action')">
          {{ actionText }}
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
interface ProEmptyProps {
  description?: string
  imageSize?: number
  showAction?: boolean
  actionText?: string
}

withDefaults(defineProps<ProEmptyProps>(), {
  description: '暂无数据',
  imageSize: 160,
  showAction: false,
  actionText: '重新加载'
})

defineEmits<{
  (e: 'action'): void
}>()
</script>

<style lang="scss" scoped>
.pro-empty {
  width: 100%;
  padding: 40px 0;
}
</style>
