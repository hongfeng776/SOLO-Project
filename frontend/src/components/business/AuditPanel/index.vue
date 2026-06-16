<template>
  <div class="audit-panel">
    <div class="audit-header">
      <h3 class="title">审核面板</h3>
      <el-tag :type="levelTagType" size="small">{{ auditLevelLabel }}</el-tag>
    </div>

    <div class="audit-content">
      <div class="resource-info" v-if="resource">
        <div class="resource-cover">
          <el-image
            :src="resource.coverUrl || resource.fileUrl"
            fit="cover"
            style="width: 100%; height: 120px; border-radius: 4px"
          />
        </div>
        <div class="resource-detail">
          <h4 class="resource-title text-ellipsis">{{ resource.title }}</h4>
          <p class="resource-type">
            <el-tag size="small" type="info">{{ fileTypeLabel }}</el-tag>
          </p>
          <p class="resource-author">提交者：{{ resource.authorName || '-' }}</p>
        </div>
      </div>

      <el-divider />

      <div class="audit-form">
        <el-form :model="form" label-width="80px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="form.result" :disabled="disabled">
              <el-radio label="approved">通过</el-radio>
              <el-radio label="rejected">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="审核意见">
            <el-input
              v-model="form.opinion"
              type="textarea"
              :rows="4"
              placeholder="请输入审核意见"
              :disabled="disabled"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item v-if="!disabled && quickOptions.length">
            <div class="quick-options">
              <span class="quick-label">快捷选项：</span>
              <el-tag
                v-for="(option, index) in quickOptions"
                :key="index"
                class="quick-tag"
                effect="plain"
                @click="applyQuickOption(option)"
              >
                {{ option }}
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="audit-footer">
      <el-button @click="handleCancel" :disabled="disabled">取消</el-button>
      <el-button type="primary" :loading="loading" :disabled="disabled || !canSubmit" @click="handleSubmit">
        确认审核
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AuditLevelLabel, FileTypeLabel } from '@/constants'
import type { ImageResource } from '@/types'

interface Props {
  resource?: ImageResource | null
  auditLevel?: number
  disabled?: boolean
  loading?: boolean
  quickOptions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  resource: null,
  auditLevel: 1,
  disabled: false,
  loading: false,
  quickOptions: () => ['内容合规', '质量达标', '信息完整', '涉嫌违规', '质量不达标', '信息缺失']
})

const emit = defineEmits<{
  'submit': [data: { result: string; opinion: string; level: number }]
  'cancel': []
}>()

const form = ref({
  result: 'approved',
  opinion: ''
})

const auditLevelLabel = computed(() => {
  return AuditLevelLabel[props.auditLevel as keyof typeof AuditLevelLabel] || '审核'
})

const levelTagType = computed(() => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'warning',
    3: 'danger'
  }
  return types[props.auditLevel] || 'info'
})

const fileTypeLabel = computed(() => {
  const type = props.resource?.fileType as keyof typeof FileTypeLabel
  return type ? FileTypeLabel[type] : '-'
})

const canSubmit = computed(() => {
  return form.value.result && (form.value.result === 'approved' || form.value.opinion.trim())
})

watch(() => props.resource, () => {
  form.value = {
    result: 'approved',
    opinion: ''
  }
})

const applyQuickOption = (option: string) => {
  if (props.disabled) return
  form.value.opinion = option
}

const handleSubmit = () => {
  if (!canSubmit.value) return
  emit('submit', {
    result: form.value.result,
    opinion: form.value.opinion,
    level: props.auditLevel
  })
}

const handleCancel = () => {
  emit('cancel')
}

defineExpose({
  form
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.audit-panel {
  background: $bg-color-ffffff;
  border-radius: $border-radius-large;
  border: 1px solid $border-color-lighter;

  .audit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $border-color-extra-light;

    .title {
      font-size: $font-size-medium;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .audit-content {
    padding: 20px;

    .resource-info {
      display: flex;
      gap: 16px;

      .resource-cover {
        width: 160px;
        flex-shrink: 0;
        background: $bg-color;
        border-radius: $border-radius;
        overflow: hidden;
      }

      .resource-detail {
        flex: 1;
        min-width: 0;

        .resource-title {
          font-size: $font-size-medium;
          font-weight: 500;
          color: $text-primary;
          margin-bottom: 8px;
        }

        .resource-type {
          margin-bottom: 8px;
        }

        .resource-author {
          font-size: $font-size-small;
          color: $text-secondary;
        }
      }
    }
  }

  .quick-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .quick-label {
      font-size: $font-size-small;
      color: $text-secondary;
    }

    .quick-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
    }
  }

  .audit-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid $border-color-extra-light;
  }
}
</style>
