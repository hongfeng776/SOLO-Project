<template>
  <div class="ccb-page-header">
    <div class="ccb-page-header-main">
      <div v-if="$slots.icon || icon" class="ccb-page-header-icon">
        <slot name="icon">
          <el-icon :size="20"><component :is="icon" /></el-icon>
        </slot>
      </div>
      <div class="ccb-page-header-content">
        <div class="ccb-page-title">{{ title }}</div>
        <div v-if="description || $slots.description" class="ccb-page-description">
          <slot name="description">{{ description }}</slot>
        </div>
      </div>
      <div v-if="$slots.extra" class="ccb-page-header-extra">
        <slot name="extra" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  icon: ''
})
</script>

<style lang="scss" scoped>
.ccb-page-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  .ccb-page-header-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ccb-page-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #004098 0%, #1e63c4 100%);
    border-radius: 8px;
    color: #fff;
  }

  .ccb-page-header-content {
    flex: 1;
  }

  .ccb-page-title {
    font-size: 18px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 4px;
  }

  .ccb-page-description {
    font-size: 14px;
    color: #8c8c8c;
  }

  .ccb-page-header-extra {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
