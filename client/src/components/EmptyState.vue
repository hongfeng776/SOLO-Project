<template>
  <div class="empty-state">
    <el-empty :description="description" :image-size="imageSize">
      <template #image>
        <div class="empty-icon-wrap">
          <el-icon :size="80" color="#c0c4cc">
            <component :is="iconComponent" />
          </el-icon>
        </div>
      </template>
      <template #default>
        <slot>
          <p class="empty-desc">{{ description }}</p>
          <el-button v-if="showAction" type="primary" size="small" @click="$emit('action')">
            {{ actionText }}
          </el-button>
        </slot>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  description?: string;
  icon?: string;
  imageSize?: number;
  showAction?: boolean;
  actionText?: string;
}>(), {
  description: '暂无数据',
  icon: 'Picture',
  imageSize: 120,
  showAction: false,
  actionText: '去添加'
});

defineEmits<{
  (e: 'action'): void;
}>();

const iconComponent = computed(() => {
  const icons: Record<string, any> = ElementPlusIconsVue;
  return icons[props.icon] || icons.Picture;
});
</script>

<style scoped>
.empty-state {
  padding: 60px 0;
  text-align: center;
}

.empty-icon-wrap {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
}

.empty-desc {
  color: #909399;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
