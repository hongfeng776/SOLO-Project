<template>
  <el-dialog
    :model-value="modelValue"
    title="商家入驻申请详情"
    width="860px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="detail-container">
      <div class="section">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申请编号">{{ detail.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="商家名称">{{ detail.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="店铺名称">{{ detail.storeName }}</el-descriptions-item>
          <el-descriptions-item label="商家类型">
            <el-tag
              :type="detail.merchantType === MerchantType.BRAND ? 'warning' : 'info'"
              size="small"
              effect="plain"
            >
              {{ MERCHANT_TYPE_NAMES[detail.merchantType as MerchantType] || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请状态">
            <el-tag
              :type="MERCHANT_APPLY_STATUS_TAG_TYPES[detail.status] as any"
              size="small"
              effect="light"
            >
              {{ MERCHANT_APPLY_STATUS_NAMES[detail.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(detail.submitTime || detail.createTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="section">
        <div class="section-title">法人信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="法人姓名">{{ detail.legalPersonName }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ maskIdCard(detail.legalPersonIdCard) }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.legalPersonPhone }}</el-descriptions-item>
        </el-descriptions>
        <div class="id-card-images">
          <div class="image-item">
            <div class="image-label">身份证正面</div>
            <div class="image-wrapper">
              <el-image
                v-if="detail.legalPersonIdCardFront"
                :src="detail.legalPersonIdCardFront"
                fit="cover"
                :preview-src-list="[detail.legalPersonIdCardFront]"
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
                v-if="detail.legalPersonIdCardBack"
                :src="detail.legalPersonIdCardBack"
                fit="cover"
                :preview-src-list="[detail.legalPersonIdCardBack]"
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

      <div class="section">
        <div class="section-title">营业执照</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="执照编号">{{ detail.businessLicenseNo || '-' }}</el-descriptions-item>
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

      <div class="section">
        <div class="section-title">行业资质</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="行业类目">{{ detail.industryCategory || '-' }}</el-descriptions-item>
          <el-descriptions-item label="资质编号">{{ detail.industryQualificationNo || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="single-image">
          <div class="image-wrapper large">
            <el-image
              v-if="detail.industryQualification"
              :src="detail.industryQualification"
              fit="contain"
              :preview-src-list="[detail.industryQualification]"
            />
            <div v-else class="image-placeholder">未上传</div>
          </div>
          <div class="verify-status success">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>行业资质校验通过</span>
          </div>
        </div>
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
            v-for="key in preCheckKeys"
            :key="key"
            :class="{ passed: preCheckResult[key].passed, failed: !preCheckResult[key].passed }"
          >
            <div class="item-header">
              <el-icon class="item-icon">
                <CircleCheckFilled v-if="preCheckResult[key].passed" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span class="item-label">{{ preCheckLabelMap[key] }}</span>
            </div>
            <div class="item-progress">
              <el-progress
                :percentage="preCheckResult[key].passed ? 100 : 0"
                :status="preCheckResult[key].passed ? 'success' : 'exception'"
                :stroke-width="8"
              />
            </div>
            <div class="item-message">{{ preCheckResult[key].message }}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">权限状态</div>
        <div class="permission-grid">
          <div class="permission-item">
            <span class="permission-label">店铺开通</span>
            <el-switch :model-value="detail.storeOpened === 1" disabled />
          </div>
          <div class="permission-item">
            <span class="permission-label">上架权限</span>
            <el-switch :model-value="detail.listingEnabled === 1" disabled />
          </div>
          <div class="permission-item">
            <span class="permission-label">营销权限</span>
            <el-switch :model-value="detail.marketingEnabled === 1" disabled />
          </div>
        </div>
      </div>

      <div class="section" v-if="detail.status === MerchantApplyStatus.REJECTED && detail.rejectReason">
        <div class="section-title">驳回原因</div>
        <div class="reason-block reject">{{ detail.rejectReason }}</div>
      </div>

      <div class="section" v-if="detail.status === MerchantApplyStatus.RETURNED && detail.returnReason">
        <div class="section-title">退回原因</div>
        <div class="reason-block return">{{ detail.returnReason }}</div>
      </div>

      <div class="section" v-if="logs.length > 0">
        <div class="section-title">操作日志</div>
        <el-timeline>
          <el-timeline-item
            v-for="log in logs"
            :key="log.id"
            :timestamp="formatDateTime(log.createTime)"
            placement="top"
          >
            <div class="log-item">
              <span class="log-operator">{{ log.operatorName }}</span>
              <el-tag size="small" effect="plain" class="ml-8">
                {{ MERCHANT_ONBOARDING_LOG_TYPE_NAMES[log.logType as MerchantOnboardingLogType] || log.logType }}
              </el-tag>
              <span class="log-remark" v-if="log.remark">{{ log.remark }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
        v-if="detail.status === MerchantApplyStatus.PENDING_INITIAL"
        type="success"
        @click="handleAudit('initial_pass')"
      >
        初审通过
      </el-button>
      <el-button
        v-if="detail.status === MerchantApplyStatus.PENDING_INITIAL"
        type="danger"
        @click="handleAudit('initial_reject')"
      >
        初审驳回
      </el-button>
      <el-button
        v-if="detail.status === MerchantApplyStatus.PENDING_FINAL"
        type="success"
        @click="handleAudit('final_pass')"
      >
        终审通过
      </el-button>
      <el-button
        v-if="detail.status === MerchantApplyStatus.PENDING_FINAL"
        type="danger"
        @click="handleAudit('final_reject')"
      >
        终审驳回
      </el-button>
      <el-button
        v-if="[MerchantApplyStatus.PENDING_INITIAL, MerchantApplyStatus.PENDING_FINAL].includes(detail.status)"
        type="warning"
        @click="handleAudit('return')"
      >
        退回
      </el-button>
    </template>

    <MerchantAuditDialog
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
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { formatDateTime } from '@hooks/index'
import {
  getMerchantOnboardingDetail,
  getMerchantOnboardingLogs
} from '@api/merchant-onboarding'
import {
  MerchantApplyStatus,
  MERCHANT_APPLY_STATUS_NAMES,
  MERCHANT_APPLY_STATUS_TAG_TYPES,
  MerchantType,
  MERCHANT_TYPE_NAMES,
  MerchantOnboardingLogType,
  MERCHANT_ONBOARDING_LOG_TYPE_NAMES
} from '@enums/business'
import type { MerchantOnboardingApply, MerchantOnboardingLog, PreCheckResult } from '@api/merchant-onboarding'
import MerchantAuditDialog from './MerchantAuditDialog.vue'

const props = defineProps<{
  modelValue: boolean
  applyId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}>()

const loading = ref(false)
const detail = ref<MerchantOnboardingApply>({} as MerchantOnboardingApply)
const logs = ref<MerchantOnboardingLog[]>([])
const auditDialogVisible = ref(false)
const currentAuditType = ref<'initial_pass' | 'initial_reject' | 'final_pass' | 'final_reject' | 'return'>('initial_pass')

const preCheckKeys = ['businessLicense', 'legalPersonInfo', 'industryQualification', 'storeNameUniqueness', 'industryRisk', 'qualificationExpiry'] as const

const preCheckLabelMap: Record<string, string> = {
  businessLicense: '营业执照校验',
  legalPersonInfo: '法人信息校验',
  industryQualification: '行业资质校验',
  storeNameUniqueness: '店铺名称唯一性',
  industryRisk: '行业风险评估',
  qualificationExpiry: '资质有效期校验'
}

const preCheckResult = computed<PreCheckResult | null>(() => {
  if (!detail.value.preCheckResult) return null
  try {
    return JSON.parse(detail.value.preCheckResult)
  } catch {
    return null
  }
})

const maskIdCard = (idCard: string) => {
  if (!idCard) return '-'
  if (idCard.length <= 8) return idCard
  return idCard.slice(0, 4) + '********' + idCard.slice(-4)
}

const loadDetail = async () => {
  if (!props.applyId) return
  loading.value = true
  try {
    const data = await getMerchantOnboardingDetail(props.applyId)
    detail.value = data
  } catch (error) {
    console.error('获取详情失败', error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const loadLogs = async () => {
  if (!props.applyId) return
  try {
    const data = await getMerchantOnboardingLogs(props.applyId)
    logs.value = data
  } catch (error) {
    console.error('获取日志失败', error)
  }
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleAudit = (type: 'initial_pass' | 'initial_reject' | 'final_pass' | 'final_reject' | 'return') => {
  currentAuditType.value = type
  auditDialogVisible.value = true
}

const handleAuditSuccess = () => {
  ElMessage.success('审核完成')
  emit('refresh')
  loadDetail()
  loadLogs()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.applyId) {
      loadDetail()
      loadLogs()
    }
  }
)

watch(
  () => props.applyId,
  (val) => {
    if (val && props.modelValue) {
      loadDetail()
      loadLogs()
    }
  }
)
</script>

<style lang="scss" scoped>
.detail-container {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;

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

  .permission-grid {
    display: flex;
    gap: 32px;
  }

  .permission-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .permission-label {
      font-size: 14px;
      color: $text-regular;
    }
  }

  .reason-block {
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.6;

    &.reject {
      background: #fef0f0;
      color: #f56c6c;
    }

    &.return {
      background: #fdf6ec;
      color: #e6a23c;
    }
  }

  .log-item {
    display: flex;
    align-items: center;
    gap: 4px;

    .log-operator {
      font-weight: 500;
      color: $text-primary;
    }

    .log-remark {
      margin-left: 8px;
      font-size: 12px;
      color: $text-secondary;
    }
  }
}

.ml-8 {
  margin-left: 8px;
}

.ml-10 {
  margin-left: 10px;
}
</style>
