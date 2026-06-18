<template>
  <el-dialog
    :model-value="modelValue"
    title="资质溯源台账"
    width="700px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="trace-dialog">
      <div class="trace-header">
        <div class="creator-info">
          <el-avatar :size="48" :src="benefitConfig?.creator?.avatar" shape="square">
            {{ benefitConfig?.creator?.name?.charAt(0) }}
          </el-avatar>
          <div class="info-text">
            <div class="creator-name">{{ benefitConfig?.creator?.name || '-' }}</div>
            <div class="identity-status">
              <span class="status-label">身份状态：</span>
              <span
                class="status-value status-transition"
                :style="{ color: identityStatusColor }"
              >
                {{ identityStatusName }}
              </span>
            </div>
          </div>
        </div>
        <div class="benefits-preview">
          <div class="benefits-title">当前权益</div>
          <div class="benefits-list">
            <div
              v-for="benefit in benefitItems"
              :key="benefit.key"
              class="benefit-item"
              :class="{ enabled: benefit.enabled }"
            >
              <el-switch
                :model-value="benefit.enabled"
                disabled
                size="small"
              />
              <span class="benefit-name">{{ benefit.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="trace-timeline">
        <div class="timeline-title">资质变更轨迹</div>
        <el-timeline>
          <el-timeline-item
            v-for="log in logList"
            :key="log.id"
            :timestamp="formatDateTime(log.createTime)"
            :type="getTimelineType(log.logType)"
            placement="top"
          >
            <div class="log-item">
              <div class="log-header">
                <span class="log-type">{{ getLogTypeName(log.logType) }}</span>
                <span v-if="log.operatorName" class="log-operator">
                  操作人：{{ log.operatorName }}
                </span>
              </div>
              <div class="log-remark">{{ log.remark }}</div>
              <div v-if="log.beforeStatus !== undefined || log.afterStatus !== undefined" class="log-status">
                <span v-if="log.beforeStatus !== undefined">
                  {{ QUALIFICATION_APPLY_STATUS_NAMES[log.beforeStatus] }}
                </span>
                <el-icon v-if="log.beforeStatus !== undefined && log.afterStatus !== undefined" class="arrow-icon">
                  <ArrowRight />
                </el-icon>
                <span v-if="log.afterStatus !== undefined" class="after-status">
                  {{ QUALIFICATION_APPLY_STATUS_NAMES[log.afterStatus] }}
                </span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!loading && logList.length === 0" description="暂无溯源记录" />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { formatDateTime } from '@hooks/index'
import {
  getTraceLogs,
  getBenefitConfig,
  getApplyByCreator
} from '@api/creator-qualification'
import {
  QUALIFICATION_APPLY_STATUS_NAMES,
  QUALIFICATION_LOG_TYPE_NAMES,
  CREATOR_IDENTITY_STATUS_NAMES,
  CREATOR_IDENTITY_STATUS_COLORS,
  CREATOR_BENEFIT_NAMES,
  CreatorBenefit
} from '@enums/business'
import type { QualificationLog, BenefitConfig, QualificationApply } from '@api/creator-qualification'

const props = defineProps<{
  modelValue: boolean
  creatorId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loading = ref(false)
const logList = ref<QualificationLog[]>([])
const benefitConfig = ref<BenefitConfig | null>(null)
const applyList = ref<QualificationApply[]>([])

const identityStatusName = computed(() => {
  if (!benefitConfig.value) return '-'
  return CREATOR_IDENTITY_STATUS_NAMES[benefitConfig.value.identityStatus] || '-'
})

const identityStatusColor = computed(() => {
  if (!benefitConfig.value) return '#909399'
  return CREATOR_IDENTITY_STATUS_COLORS[benefitConfig.value.identityStatus] || '#909399'
})

const benefitItems = computed(() => {
  if (!benefitConfig.value) return []
  const benefits = [
    { key: CreatorBenefit.LIVE_STREAMING, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.LIVE_STREAMING], enabled: benefitConfig.value.liveStreamingEnabled === 1 },
    { key: CreatorBenefit.PRODUCT_LINK, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.PRODUCT_LINK], enabled: benefitConfig.value.productLinkEnabled === 1 },
    { key: CreatorBenefit.SHOPPING_CART, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.SHOPPING_CART], enabled: benefitConfig.value.shoppingCartEnabled === 1 },
    { key: CreatorBenefit.BRAND_COOPERATION, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.BRAND_COOPERATION], enabled: benefitConfig.value.brandCooperationEnabled === 1 },
    { key: CreatorBenefit.COMMISSION, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.COMMISSION], enabled: benefitConfig.value.commissionEnabled === 1 },
    { key: CreatorBenefit.DATA_ANALYTICS, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.DATA_ANALYTICS], enabled: benefitConfig.value.dataAnalyticsEnabled === 1 },
    { key: CreatorBenefit.ACTIVITY_PRIORITY, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.ACTIVITY_PRIORITY], enabled: benefitConfig.value.activityPriorityEnabled === 1 },
    { key: CreatorBenefit.CUSTOMER_SERVICE, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.CUSTOMER_SERVICE], enabled: benefitConfig.value.customerServiceEnabled === 1 },
    { key: CreatorBenefit.VERIFIED_BADGE, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.VERIFIED_BADGE], enabled: benefitConfig.value.verifiedBadgeEnabled === 1 },
    { key: CreatorBenefit.FLOW_BOOST, name: CREATOR_BENEFIT_NAMES[CreatorBenefit.FLOW_BOOST], enabled: benefitConfig.value.flowBoostEnabled === 1 }
  ]
  return benefits
})

const getTimelineType = (logType: string) => {
  const typeMap: Record<string, string> = {
    submit: 'primary',
    pre_check: 'info',
    audit_pass: 'success',
    audit_reject: 'danger',
    batch_pass: 'success',
    batch_reject: 'danger',
    expire: 'warning',
    renew: 'success',
    fake_detect: 'danger',
    status_change: 'primary',
    benefit_change: 'success'
  }
  return typeMap[logType] || 'info'
}

const getLogTypeName = (logType: string) => {
  return QUALIFICATION_LOG_TYPE_NAMES[logType] || logType
}

const loadData = async () => {
  if (!props.creatorId) return
  loading.value = true
  try {
    const [logs, benefits, applies] = await Promise.all([
      getTraceLogs(props.creatorId),
      getBenefitConfig(props.creatorId),
      getApplyByCreator(props.creatorId)
    ])
    logList.value = logs
    benefitConfig.value = benefits
    applyList.value = applies
  } catch (error) {
    console.error('加载溯源数据失败', error)
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

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.creatorId) {
      loadData()
    }
  }
)

watch(
  () => props.creatorId,
  (val) => {
    if (val && props.modelValue) {
      loadData()
    }
  }
)
</script>

<style lang="scss" scoped>
.trace-dialog {
  .trace-header {
    .creator-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .info-text {
      .creator-name {
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 4px;
      }

      .identity-status {
        font-size: 13px;
        color: $text-regular;

        .status-label {
          color: $text-secondary;
        }

        .status-value {
          font-weight: 500;
        }
      }
    }

    .status-transition {
      display: inline-block;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    .benefits-preview {
      margin-top: 16px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;

      .benefits-title {
        font-size: 13px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 12px;
      }

      .benefits-list {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
      }

      .benefit-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: #fff;
        border-radius: 4px;
        font-size: 12px;
        color: #c0c4cc;
        transition: all 0.3s ease;

        &.enabled {
          color: #67c23a;
          background: #f0f9eb;
        }

        .benefit-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .trace-timeline {
    .timeline-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 16px;
    }

    .log-item {
      .log-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;

        .log-type {
          font-size: 14px;
          font-weight: 500;
          color: $text-primary;
        }

        .log-operator {
          font-size: 12px;
          color: $text-secondary;
        }
      }

      .log-remark {
        font-size: 13px;
        color: $text-regular;
        margin-bottom: 6px;
      }

      .log-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: $text-secondary;

        .arrow-icon {
          font-size: 12px;
        }

        .after-status {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
