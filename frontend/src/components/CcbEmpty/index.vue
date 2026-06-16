<template>
  <div class="ccb-empty">
    <el-empty :description="description" :image-size="imageSize">
      <template v-if="$slots.image" #image>
        <slot name="image" />
      </template>
      <template v-if="$slots.default || actionText" #description>
        <div class="ccb-empty-description">
          <slot>{{ description }}</slot>
        </div>
      </template>
      <template v-if="$slots.action || actionText" #bottom>
        <div class="ccb-empty-action">
          <slot name="action">
            <el-button type="primary" @click="handleAction">{{ actionText }}</el-button>
          </slot>
        </div>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
interface Props {
  description?: string
  imageSize?: number
  actionText?: string
}

interface Emits {
  (e: 'action'): void
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  imageSize: 100,
  actionText: ''
})

const emit = defineEmits<Emits>()

const handleAction = (): void => {
  emit('action')
}
</script>

<style lang="scss" scoped>
.ccb-empty {
  padding: 40px 0;

  .ccb-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }

  .ccb-empty-action {
    margin-top: 16px;
  }
}
</style>
