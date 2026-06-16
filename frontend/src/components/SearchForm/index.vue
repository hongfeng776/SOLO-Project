<template>
  <div class="search-form">
    <el-form :model="form" :inline="true" @submit.prevent="handleSearch">
      <slot />
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';

interface Props {
  defaultParams?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  defaultParams: () => ({}),
});

const emit = defineEmits<{
  (e: 'search', params: Record<string, any>): void;
  (e: 'reset'): void;
}>();

const form = reactive<Record<string, any>>({ ...props.defaultParams });

const handleSearch = () => {
  emit('search', { ...form });
};

const handleReset = () => {
  Object.keys(form).forEach((key) => {
    form[key] = props.defaultParams[key] ?? '';
  });
  emit('reset');
  emit('search', { ...form });
};

defineExpose({ form });
</script>

<style lang="scss" scoped>
.search-form {
  padding: $spacing-base $spacing-lg;
  background: $bg-white;
  border-radius: $border-radius;
  margin-bottom: $spacing-base;

  :deep(.el-form-item) {
    margin-bottom: $spacing-sm;
    margin-right: $spacing-base;
  }
}
</style>
