<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div class="content-preview">
      <div v-if="data?.coverImage" class="preview-cover">
        <el-image :src="data.coverImage" fit="cover" class="cover-img" :preview-src-list="[data.coverImage]" />
      </div>
      <div class="preview-info">
        <h3 class="preview-title">{{ data?.title }}</h3>
        <div class="preview-meta">
          <el-tag size="small">{{ statusMap[data?.status ?? -1] || '未知' }}</el-tag>
          <span class="meta-author">{{ data?.authorName }}</span>
          <span class="meta-time">{{ data?.publishTime || data?.createTime }}</span>
        </div>
        <el-divider />
        <div class="preview-content" v-html="data?.content" />
        <div v-if="data?.tags?.length" class="preview-tags">
          <el-tag
            v-for="tag in data.tags"
            :key="tag.id"
            size="small"
            type="info"
            class="tag-item"
          >
            {{ tag.name }}
          </el-tag>
        </div>
        <div v-if="data?.status === 3" class="preview-reject">
          <el-alert title="拒绝原因" :description="data.rejectReason" type="error" :closable="false" show-icon />
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <slot name="actions" :data="data" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Note } from '@/types/business'
import { NoteStatus } from '@enums/business'

interface Props {
  modelValue: boolean
  data?: Note | null
  title?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '内容预览',
  width: '720px'
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const visible = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
  },
  { immediate: true }
)

const statusMap: Record<number, string> = {
  [NoteStatus.DRAFT]: '草稿',
  [NoteStatus.PENDING_REVIEW]: '待审核',
  [NoteStatus.PUBLISHED]: '已发布',
  [NoteStatus.REJECTED]: '已拒绝',
  [NoteStatus.OFF_SHELF]: '已下架'
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.content-preview {
  max-height: 60vh;
  overflow-y: auto;
}

.preview-cover {
  margin-bottom: 16px;
  border-radius: $border-radius;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  max-height: 300px;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 12px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: $text-secondary;
  font-size: 13px;
}

.preview-content {
  font-size: 14px;
  line-height: 1.8;
  color: $text-regular;
  word-break: break-word;
}

.preview-tags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-reject {
  margin-top: 16px;
}
</style>
