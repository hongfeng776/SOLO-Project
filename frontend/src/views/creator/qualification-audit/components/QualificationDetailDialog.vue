<template>
  <el-dialog
    :model-value="modelValue"
    title="资质申请详情"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="detail-container">
      <div class="section">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申请编号">{{ detail.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(detail.submitTime || detail.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="资质类型">
            {{ QUALIFICATION_TYPE_NAMES[detail.qualificationType] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="资质状态">
            <el-tag :type="QUALIFICATION_APPLY_TAG_TYPES[detail.status]" size="small">
              {{ QUALIFICATION_APPLY_STATUS_NAMES[detail.status] }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="section">
        <div class="section-title">达人信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="达人名称">{{ detail.creator?.name }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ detail.creator?.platform }}</el-descriptions-item>
          <el-descriptions-item label="粉丝数">{{ formatNumber(detail.creator?.followers || 0) }}</el-descriptions-item>
          <el-descriptions-item label="所属类目">{{ detail.creator?.category || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="section">
        <div class="section-title">
          前置校验结果
          <el-tag
            :type="detail.preCheckPassed === 1 ? 'success' : 'danger'"
            size="small"
            effect="light"
            class="ml-10"
          >
            {{ detail.preCheckPassed === 1 ? '校验通过' : '校验未通过' }}
          </el-tag>
        </div>
        <div class="precheck-list" v-if="preCheckResult">
          <div
            class="precheck-item"
            v-for="(item, key) in preCheckResult"
            :key="key"
            :class="{ passed: item.passed, failed: !item.passed }"
          >
            <div class="item-header">
              <el-icon class="item-icon">
                <CircleCheckFilled v-if="item.passed" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span class="item-label">{{ getItemLabel(key as string) }}</span>
            </div>
            <div class="item-progress">
              <el-progress
                :percentage="getProgressValue(item)"
                :status="item.passed ? 'success' : 'exception'"
                :stroke-width="8"
              />
            </div>
            <div class="item-message">{{ item.message }}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">身份信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="真实姓名">{{ detail.realName }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ maskIdCard(detail.idCard) }}</el-descriptions-item>
        </el-descriptions>
        <div class="id-card-images">
          <div class="image-item">
            <div class="image-label">身份证正面</div>
            <div class="image-wrapper" :class="{ error: false }">
              <el-image
                v-if="detail.idCardFront"
                :src="detail.idCardFront"
                fit="cover"
                :preview-src-list="[detail.idCardFront]"
              />
              <div v-else class="image-placeholder">未上传</div>
            </div>
            <div class="verify-status success">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>校验通过</span>
            </div>
          </div>
          <div class="image-item">
            <div class="image-label">身份证反面</div>
            <div class="image-wrapper">
              <el-image
                v-if="detail.idCardBack"
                :src="detail.idCardBack"
                fit="cover"
                :preview-src-list="[detail.idCardBack]"
              />
              <div v-else class="image-placeholder">未上传</div>
            </div>
            <div class="verify-status success">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>校验通过</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section" v-if="detail.qualificationType === 'business_license'">
        <div class="section-title">营业执照</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="执照编号">
            {{ detail.businessLicenseNo || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ detail.industryCategory || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="single-image">
          <div class="image-wrapper large">
            <el-image
              v-if="detail.businessLicense"
              :src="detail.businessLicense"
              fit="contain"
              :preview-src-list="[detail.businessLicense]"
            />
            <div v-else class="image-placeholder">未上传</div>
          </div>
          <div class="verify-status success">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>资质校验通过</span>
          </div>
        </div>
      </div>

      <div class="section" v-if="detail.qualificationType === 'industry_cert'">
        <div class="section-title">行业资质</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="资质证书编号">
            {{ detail.industryCertNo || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ detail.industryCategory || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="single-image">
          <div class="image-wrapper large">
            <el-image
              v-if="detail.industryCert"
              :src="detail.industryCert"
              fit="contain"
              :preview-src-list="[detail.industryCert]"
            />
            <div v-else class="image-placeholder">未上传</div>
          </div>
          <div class="verify-status success">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>行业资质校验通过</span>
          </div>
        </div>
      </div>

      <div class="section" v-if="detail.status === QualificationApplyStatus.REJECTED">
        <div class="section-title">驳回原因</div>
        <div class="reject-reason">{{ detail.rejectReason || '资质不符合要求' }}</div>
      </div>

      <div class="section" v-if="detail.auditorName">
        <div class="section-title">审核信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="审核人">{{ detail.auditorName }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">
            {{ formatDateTime(detail.auditTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
        v-if="detail.status === QualificationApplyStatus.UNDER_REVIEW"
        type="success"
        @click="handleAudit(2)"
      >
        通过
      </el-button>
      <el-button
        v-if="detail.status === QualificationApplyStatus.UNDER_REVIEW"
        type="danger"
        @click="handleAudit(3)"
      >
        驳回
      </el-button>
    </template>

    <AuditDialog
      v-model="auditDialogVisible"
      :apply-id="applyId"
      :audit-type="currentAuditType"
      @success="handleAuditSuccess"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getQualificationDetail,
  auditQualification
} from '@api/creator-qualification'
import {
  QualificationApplyStatus,
  QUALIFICATION_APPLY_STATUS_NAMES,
  QUALIFICATION_APPLY_TAG_TYPES,
  QUALIFICATION_TYPE_NAMES
} from '@enums/business'
import type { QualificationApply, PreCheckResult } from '@api/creator-qualification'
import AuditDialog from './AuditDialog.vue'

const props = defineProps<{
  modelValue: boolean
  applyId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const { formatNumber } = useNumberFormat()

const loading = ref(false)
const detail = ref<QualificationApply>({} as QualificationApply)
const auditDialogVisible = ref(false)
const currentAuditType = ref<'pass' | 'reject'>('pass')

const preCheckResult = computed<PreCheckResult | null>(() => {
  if (!detail.value.preCheckResult) return null
  try {
    return JSON.parse(detail.value.preCheckResult)
  } catch {
    return null
  }
})

const labelMap: Record<string, string> = {
  followers: '粉丝量',
  contentVerticality: '内容垂直度',
  complianceRecord: '合规记录',
  realNameVerified: '实名认证'
}

const getItemLabel = (key: string) => labelMap[key] || key

const getProgressValue = (item: any) => {
  if (item.value === true || item.value === false) {
    return item.passed ? 100 : 0
  }
  if (typeof item.value === 'number' && item.required) {
    return Math.min(Math.floor((item.value / item.required) * 100), 100)
  }
  return item.passed ? 100 : 0
}

const maskIdCard = (idCard: string) => {
  if (!idCard) return '-'
  if (idCard.length <= 8) return idCard
  return idCard.slice(0, 4) + '********' + idCard.slice(-4)
}

const loadDetail = async () => {
  if (!props.applyId) return
  loading.value = true
  try {
    const data = await getQualificationDetail(props.applyId)
    detail.value = data
  } catch (error) {
    console.error('获取详情失败', error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleAudit = (status: number) => {
  currentAuditType.value = status === 2 ? 'pass' : 'reject'
  auditDialogVisible.value = true
}

const handleAuditSuccess = () => {
  ElMessage.success('审核完成')
  emit('refresh')
  loadDetail()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.applyId) {
      loadDetail()
    }
  }
)

watch(
  () => props.applyId,
  (val) => {
    if (val && props.modelValue) {
      loadDetail()
    }
  }
)
</script>

<style lang="scss" scoped>
.detail-container {
  .section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid $theme-color;
  }

  .precheck-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .precheck-item {
    padding: 16px;
    border-radius: 8px;
    background: #f5f7fa;
    transition: all 0.3s ease;

    &.passed {
      background: #f0f9eb;
    }

    &.failed {
      background: #fef0f0;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .item-icon {
      font-size: 20px;

      .passed & {
        color: #67c23a;
      }

      .failed & {
        color: #f56c6c;
      }
    }

    .item-label {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
    }

    .item-progress {
      margin-bottom: 8px;
    }

    .item-message {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .id-card-images {
    display: flex;
    gap: 20px;
    margin-top: 12px;
  }

  .image-item {
    flex: 1;

    .image-label {
      font-size: 13px;
      color: $text-regular;
      margin-bottom: 8px;
      text-align: center;
    }

    .image-wrapper {
      width: 100%;
      height: 120px;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      overflow: hidden;
      background: #f5f7fa;
      transition: all 0.3s ease;

      &.error {
        border-color: #f56c6c;
        background: #fef0f0;

        .upload-progress {
          background: #f56c6c;
        }
      }

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;
      font-size: 13px;
    }

    .verify-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;

      &.success {
        color: #67c23a;
      }

      &.error {
        color: #f56c6c;
      }
    }
  }

  .single-image {
    margin-top: 12px;

    .image-wrapper.large {
      width: 100%;
      max-width: 300px;
      height: 200px;
      margin: 0 auto;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      overflow: hidden;
      background: #f5f7fa;

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;
      font-size: 13px;
    }

    .verify-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: 12px;
      font-size: 13px;

      &.success {
        color: #67c23a;
      }
    }
  }

  .reject-reason {
    padding: 12px 16px;
    background: #fef0f0;
    border-radius: 6px;
    color: #f56c6c;
    font-size: 13px;
    line-height: 1.6;
  }
}

.ml-10 {
  margin-left: 10px;
}
</style>
