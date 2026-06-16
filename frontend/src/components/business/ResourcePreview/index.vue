<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @open="handleOpen"
  >
    <div class="resource-preview">
      <div class="preview-content">
        <div class="preview-image" v-if="resource?.fileType === 'image' || !resource?.fileType">
          <el-image
            :src="resource?.coverUrl || resource?.fileUrl"
            :preview-src-list="previewList"
            fit="contain"
            style="width: 100%; max-height: 500px"
          />
        </div>
        <div class="preview-video" v-else-if="resource?.fileType === 'video'">
          <video
            :src="resource?.fileUrl"
            controls
            style="width: 100%; max-height: 500px"
          ></video>
        </div>
      </div>

      <div class="preview-info" v-if="resource">
        <h3 class="info-title">{{ resource.title }}</h3>
        <div class="info-list">
          <div class="info-item">
            <span class="label">资源ID：</span>
            <span class="value">{{ resource.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件类型：</span>
            <span class="value">{{ fileTypeLabel }}</span>
          </div>
          <div class="info-item" v-if="resource.fileSize">
            <span class="label">文件大小：</span>
            <span class="value">{{ formatFileSize(resource.fileSize) }}</span>
          </div>
          <div class="info-item" v-if="resource.width && resource.height">
            <span class="label">尺寸：</span>
            <span class="value">{{ resource.width }} × {{ resource.height }}</span>
          </div>
          <div class="info-item" v-if="resource.duration">
            <span class="label">时长：</span>
            <span class="value">{{ formatDuration(resource.duration) }}</span>
          </div>
          <div class="info-item">
            <span class="label">分类：</span>
            <span class="value">{{ resource.categoryName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态：</span>
            <span class="value">
              <span :class="['status-tag', resource.status]">{{ statusLabel }}</span>
            </span>
          </div>
          <div class="info-item">
            <span class="label">作者：</span>
            <span class="value">{{ resource.authorName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">浏览量：</span>
            <span class="value">{{ resource.viewCount || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="label">下载量：</span>
            <span class="value">{{ resource.downloadCount || 0 }}</span>
          </div>
          <div class="info-item" v-if="resource.tags && resource.tags.length">
            <span class="label">标签：</span>
            <span class="value">
              <el-tag
                v-for="tag in resource.tags"
                :key="tag"
                size="small"
                style="margin-right: 4px"
              >
                {{ tag }}
              </el-tag>
            </span>
          </div>
          <div class="info-item" v-if="resource.description">
            <span class="label">描述：</span>
            <span class="value description">{{ resource.description }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ resource.createdAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <slot name="footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleDownload" v-if="showDownload">下载</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ResourceStatusLabel, FileTypeLabel } from '@/constants'
import type { ImageResource } from '@/types'

interface Props {
  visible: boolean
  resource?: ImageResource | null
  title?: string
  showDownload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  resource: null,
  title: '资源预览',
  showDownload: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
  'download': [resource: ImageResource]
}>()

const previewList = computed(() => {
  if (props.resource?.fileUrl) {
    return [props.resource.fileUrl]
  }
  if (props.resource?.coverUrl) {
    return [props.resource.coverUrl]
  }
  return []
})

const statusLabel = computed(() => {
  const status = props.resource?.status as keyof typeof ResourceStatusLabel
  return status ? ResourceStatusLabel[status] : '-'
})

const fileTypeLabel = computed(() => {
  const type = props.resource?.fileType as keyof typeof FileTypeLabel
  return type ? FileTypeLabel[type] : '-'
})

const handleVisibleChange = (val: boolean) => {
  emit('update:visible', val)
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleOpen = () => {
}

const handleDownload = () => {
  if (props.resource) {
    emit('download', props.resource)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.resource-preview {
  display: flex;
  gap: 20px;

  .preview-content {
    flex: 1;
    background: $bg-color;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  .preview-info {
    width: 280px;
    flex-shrink: 0;

    .info-title {
      font-size: $font-size-large;
      font-weight: 600;
      margin-bottom: 16px;
      color: $text-primary;
    }

    .info-list {
      .info-item {
        display: flex;
        margin-bottom: 12px;
        font-size: $font-size-base;

        .label {
          color: $text-secondary;
          flex-shrink: 0;
          width: 72px;
        }

        .value {
          color: $text-regular;
          flex: 1;
          word-break: break-all;

          &.description {
            line-height: 1.6;
          }
        }
      }
    }
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: $border-radius;
  font-size: $font-size-extra-small;
  line-height: 1.5;

  &.draft {
    color: $image-status-draft;
    background: rgba($image-status-draft, 0.1);
  }

  &.pending {
    color: $image-status-pending;
    background: rgba($image-status-pending, 0.1);
  }

  &.approved {
    color: $image-status-approved;
    background: rgba($image-status-approved, 0.1);
  }

  &.rejected {
    color: $image-status-rejected;
    background: rgba($image-status-rejected, 0.1);
  }

  &.published {
    color: $image-status-published;
    background: rgba($image-status-published, 0.1);
  }

  &.offline {
    color: $image-status-offline;
    background: rgba($image-status-offline, 0.1);
  }
}
</style>
