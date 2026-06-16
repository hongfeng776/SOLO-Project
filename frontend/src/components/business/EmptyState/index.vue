<template>
  <div class="empty-state" :class="{ 'is-loading': loading }">
    <div class="empty-icon" v-loading="loading">
      <el-icon v-if="!loading" :size="iconSize" :color="iconColor">
        <component :is="icon" />
      </el-icon>
    </div>
    <p class="empty-text">{{ description }}</p>
    <div class="empty-action" v-if="$slots.default">
      <slot></slot>
    </div>
    <div class="empty-action" v-else-if="showAction">
      <el-button type="primary" @click="handleAction">{{ actionText }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Picture,
  VideoCamera,
  Document,
  User,
  Search,
  Warning,
  CircleCheck
} from '@element-plus/icons-vue'

interface Props {
  type?: 'image' | 'video' | 'data' | 'user' | 'search' | 'warning' | 'success'
  description?: string
  iconSize?: number
  iconColor?: string
  showAction?: boolean
  actionText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'data',
  description: '',
  iconSize: 64,
  iconColor: '#c0c4cc',
  showAction: false,
  actionText: '立即添加',
  loading: false
})

const emit = defineEmits<{
  'action': []
}>()

const iconMap: Record<string, any> = {
  image: Picture,
  video: VideoCamera,
  data: Document,
  user: User,
  search: Search,
  warning: Warning,
  success: CircleCheck
}

const icon = computed(() => iconMap[props.type] || Document)

const defaultDescription = computed(() => {
  const descriptions: Record<string, string> = {
    image: '暂无图片资源',
    video: '暂无视频资源',
    data: '暂无数据',
    user: '暂无用户',
    search: '未找到相关内容',
    warning: '出现异常',
    success: '操作成功'
  }
  return descriptions[props.type] || '暂无数据'
})

const description = computed(() => props.description || defaultDescription.value)

const handleAction = () => {
  emit('action')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .empty-icon {
    margin-bottom: 16px;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-text {
    font-size: $font-size-base;
    color: $text-secondary;
    margin-bottom: 20px;
  }

  .empty-action {
    margin-top: 4px;
  }

  &.is-loading {
    .empty-icon {
      width: 80px;
      height: 80px;
    }
  }
}
</style>
