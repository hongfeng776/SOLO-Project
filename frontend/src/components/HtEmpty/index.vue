<template>
  <div class="empty-state flex-center" :style="{ minHeight }">
    <el-empty :description="description" :image-size="imageSize">
      <template v-if="$slots.image" #image>
        <slot name="image" />
      </template>
      <template v-if="$slots.default" #description>
        <slot />
      </template>
      <template v-if="$slots.action">
        <el-button type="primary" size="small" class="empty-action">
          <slot name="action" />
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
interface Props {
  description?: string
  imageSize?: number
  minHeight?: string
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  imageSize: 120,
  minHeight: '300px'
})
</script>

<style lang="scss" scoped>
.empty-state {
  padding: 40px 0;
  flex-direction: column;
  background-color: $bg-container;
  border-radius: $border-radius;
}

.empty-action {
  margin-top: 16px;
}
</style>
