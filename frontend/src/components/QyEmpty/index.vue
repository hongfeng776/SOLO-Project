<script setup lang="ts">
import { Empty } from '@element-plus/icons-vue'

interface Props {
  description?: string
  image?: string
  imageSize?: number
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  imageSize: 200,
})

defineEmits(['action'])
</script>

<template>
  <div class="qy-empty-wrapper">
    <el-empty
      :description="description"
      :image="image || undefined"
      :image-size="imageSize"
    >
      <template #image v-if="!image">
        <el-icon :size="imageSize / 2" color="#dcdfe6">
          <Empty />
        </el-icon>
      </template>
      <slot name="description" :description="description">
        <span class="qy-empty-text">{{ description }}</span>
      </slot>
      <slot name="action">
        <el-button type="primary" @click="$emit('action')">
          重新加载
        </el-button>
      </slot>
    </el-empty>
  </div>
</template>

<style lang="scss" scoped>
.qy-empty-wrapper {
  width: 100%;
  padding: 60px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qy-empty-text {
  color: $text-secondary;
  font-size: $font-base;
}
</style>
