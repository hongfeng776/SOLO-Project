<script setup lang="ts">
import { CONTENT_AUDIT_STATUS, getEnumItem } from '@/constants/enums'

interface Props {
  id?: number | string
  title: string
  coverImage?: string
  category?: number
  auditStatus?: number
  description?: string
  director?: string
  actors?: string
  releaseYear?: number
  duration?: number
  rating?: number
}

defineProps<Props>()
</script>

<template>
  <div class="qy-content-preview">
    <div class="preview-header">
      <el-image
        v-if="coverImage"
        :src="coverImage"
        fit="cover"
        class="preview-cover"
        lazy
      >
        <template #error>
          <div class="preview-cover-placeholder">
            <el-icon :size="48" color="#c0c4cc"><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div class="preview-info">
        <div class="preview-title-row">
          <h3 class="preview-title text-ellipsis">{{ title }}</h3>
          <el-tag
            v-if="auditStatus !== undefined"
            :type="getEnumItem(CONTENT_AUDIT_STATUS, auditStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumItem(CONTENT_AUDIT_STATUS, auditStatus)?.label || '未知' }}
          </el-tag>
        </div>
        <div class="preview-meta">
          <span v-if="director" class="meta-item">
            <span class="meta-label">导演：</span>{{ director }}
          </span>
          <span v-if="actors" class="meta-item">
            <span class="meta-label">主演：</span>{{ actors }}
          </span>
          <span v-if="releaseYear" class="meta-item">
            <span class="meta-label">年份：</span>{{ releaseYear }}
          </span>
          <span v-if="duration" class="meta-item">
            <span class="meta-label">时长：</span>{{ duration }} 分钟
          </span>
          <span v-if="rating" class="meta-item">
            <span class="meta-label">评分：</span>
            <span class="rating">{{ rating }}</span>
          </span>
        </div>
        <div v-if="description" class="preview-desc">
          <span class="meta-label">简介：</span>
          <p>{{ description }}</p>
        </div>
      </div>
    </div>
    <div class="preview-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.qy-content-preview {
  .preview-header {
    display: flex;
    gap: 20px;
  }

  .preview-cover {
    width: 180px;
    height: 240px;
    border-radius: $radius-md;
    flex-shrink: 0;
    background: $bg-color;
  }

  .preview-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-color;
  }

  .preview-info {
    flex: 1;
    min-width: 0;
  }

  .preview-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .preview-title {
    font-size: $font-xl;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
    flex: 1;
  }

  .preview-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin-bottom: 16px;
  }

  .meta-item {
    font-size: $font-sm;
    color: $text-regular;
  }

  .meta-label {
    color: $text-secondary;
  }

  .rating {
    color: $warning-color;
    font-weight: 600;
  }

  .preview-desc {
    font-size: $font-sm;
    color: $text-regular;
    line-height: 1.8;

    p {
      display: inline;
      margin: 0;
    }
  }

  .preview-footer {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid $border-lighter;
  }
}
</style>
