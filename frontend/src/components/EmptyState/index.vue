<template>
  <div class="empty-state">
    <el-empty :description="description" :image="image">
      <template #image>
        <slot name="image">
          <el-icon v-if="!image" :size="60" class="empty-icon">
            <Document />
          </el-icon>
        </slot>
      </template>
      <template #description>
        <span>{{ description }}</span>
      </template>
      <template #bottom>
        <slot>
          <el-button v-if="showButton" type="primary" @click="handleClick">
            {{ buttonText }}
          </el-button>
        </slot>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'

const props = defineProps({
  description: {
    type: String,
    default: '暂无数据'
  },
  image: {
    type: String,
    default: ''
  },
  showButton: {
    type: Boolean,
    default: false
  },
  buttonText: {
    type: String,
    default: '新增数据'
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>

<style scoped lang="scss">
.empty-state {
  padding: 60px 0;

  .empty-icon {
    color: #c0c4cc;
  }
}
</style>
