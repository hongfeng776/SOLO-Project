<template>
  <el-dialog
    :model-value="visible"
    title="智能审核面板"
    width="640px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="audit-panel-body" v-loading="loading">
      <div class="resource-preview" v-if="resource">
        <div class="resource-cover">
          <el-image
            :src="resource.coverUrl || resource.fileUrl"
            fit="cover"
            style="width: 100%; height: 120px; border-radius: 4px"
          />
        </div>
        <div class="resource-detail">
          <h4 class="resource-title text-ellipsis">{{ resource.title }}</h4>
          <p class="resource-meta">
            <el-tag size="small" type="info">{{ fileTypeLabel }}</el-tag>
          </p>
          <p class="resource-author">提交者：{{ resource.authorName || '-' }}</p>
        </div>
      </div>

      <el-alert
        v-if="resource?.isBlocked"
        title="风控拦截"
        type="error"
        :closable="false"
        show-icon
        class="risk-alert"
      >
        <template #default>
          <span>该资源已被风控系统拦截，{{ resource.blockReason || '请谨慎审核' }}</span>
        </template>
      </el-alert>

      <div v-if="(resource?.violationCount ?? 0) > 0" class="violation-history">
        <el-alert
          :title="`违规记录：累计 ${resource?.violationCount ?? 0} 次违规`"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>

      <el-divider />

      <el-form :model="form" label-width="80px">
        <el-form-item label="审核层级">
          <el-radio-group v-model="form.auditLevel">
            <el-radio :value="1">一级审核</el-radio>
            <el-radio :value="2">二级审核</el-radio>
            <el-radio :value="3">三级审核</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="审核结果">
          <el-radio-group v-model="form.result">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="审核意见">
          <el-input
            v-model="form.opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <template v-if="form.result === 'rejected'">
          <el-form-item label="违规类型">
            <el-select v-model="form.violationType" placeholder="请选择违规类型" style="width: 100%">
              <el-option
                v-for="(label, key) in ViolationTypeLabel"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="违规等级">
            <el-radio-group v-model="form.violationLevel">
              <el-radio
                v-for="(label, key) in ViolationLevelLabel"
                :key="key"
                :value="key"
              >
                {{ label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <template #footer>
      <div class="audit-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="success" :loading="loading" @click="handleQuickSubmit('approved')">
          快捷通过
        </el-button>
        <el-button type="danger" :loading="loading" @click="handleQuickSubmit('rejected')">
          快捷拒绝
        </el-button>
        <el-button type="primary" :loading="loading" :disabled="!canSubmit" @click="handleSubmit">
          确认提交
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ViolationTypeLabel, ViolationLevelLabel, FileTypeLabel } from '@/constants'
import type { ImageResource } from '@/types'

interface Props {
  visible: boolean
  resource?: ImageResource | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  resource: null,
  loading: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'submit': [data: {
    result: string
    opinion: string
    auditLevel: number
    violationType?: string
    violationLevel?: string
  }]
  'close': []
}>()

const form = ref({
  result: 'approved',
  opinion: '',
  auditLevel: 1,
  violationType: '',
  violationLevel: ''
})

const fileTypeLabel = computed(() => {
  const type = props.resource?.fileType as keyof typeof FileTypeLabel
  return type ? FileTypeLabel[type] : '-'
})

const canSubmit = computed(() => {
  if (!form.value.result) return false
  if (form.value.result === 'rejected') {
    return form.value.violationType && form.value.violationLevel
  }
  return true
})

watch(() => props.resource, (val) => {
  if (val) {
    form.value = {
      result: 'approved',
      opinion: '',
      auditLevel: 1,
      violationType: '',
      violationLevel: ''
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  if (!canSubmit.value) return
  emit('submit', {
    result: form.value.result,
    opinion: form.value.opinion,
    auditLevel: form.value.auditLevel,
    violationType: form.value.result === 'rejected' ? form.value.violationType : undefined,
    violationLevel: form.value.result === 'rejected' ? form.value.violationLevel : undefined
  })
}

const handleQuickSubmit = (result: string) => {
  form.value.result = result
  if (result === 'approved') {
    emit('submit', {
      result: 'approved',
      opinion: form.value.opinion || '审核通过',
      auditLevel: form.value.auditLevel
    })
  } else {
    if (form.value.violationType && form.value.violationLevel) {
      emit('submit', {
        result: 'rejected',
        opinion: form.value.opinion || '审核拒绝',
        auditLevel: form.value.auditLevel,
        violationType: form.value.violationType,
        violationLevel: form.value.violationLevel
      })
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.audit-panel-body {
  .resource-preview {
    display: flex;
    gap: 16px;
    padding: 12px;
    background: $bg-color;
    border-radius: $border-radius;
    margin-bottom: 16px;

    .resource-cover {
      width: 160px;
      flex-shrink: 0;
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

      .resource-meta {
        margin-bottom: 8px;
      }

      .resource-author {
        font-size: $font-size-small;
        color: $text-secondary;
      }
    }
  }

  .risk-alert {
    margin-bottom: 12px;
  }

  .violation-history {
    margin-bottom: 12px;
  }
}

.audit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
