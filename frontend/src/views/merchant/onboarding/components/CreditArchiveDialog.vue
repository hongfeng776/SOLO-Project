<template>
  <el-dialog
    :model-value="modelValue"
    title="商家信用档案"
    width="640px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="credit-container">
      <template v-if="archive">
        <div class="credit-header">
          <div class="header-info">
            <div class="merchant-name">
              <el-tooltip :content="archive.merchantName" placement="top" :disabled="!isOverflow(archive.merchantName, 20)">
                <span>{{ archive.merchantName }}</span>
              </el-tooltip>
            </div>
            <div class="license-no">
              <el-tooltip :content="archive.businessLicenseNo" placement="top" :disabled="!isOverflow(archive.businessLicenseNo, 24)">
                <span>执照编号：{{ archive.businessLicenseNo }}</span>
              </el-tooltip>
            </div>
          </div>
          <div class="credit-score-block">
            <div class="score-value" :style="{ color: scoreColor }">{{ archive.creditScore }}</div>
            <div class="score-label">信用评分</div>
          </div>
        </div>

        <div class="credit-level-row">
          <span class="level-label">信用等级</span>
          <el-tag
            :color="MERCHANT_CREDIT_LEVEL_COLORS[archive.creditLevel]"
            effect="dark"
            size="large"
            class="level-badge"
            style="border: none"
          >
            {{ archive.creditLevel }}
          </el-tag>
        </div>

        <div class="section">
          <div class="section-title">统计指标</div>
          <div class="stats-grid">
            <div class="stat-card" v-for="item in statItems" :key="item.key">
              <el-tooltip :content="item.label + '：' + formatNumber(archive[item.key as keyof typeof archive] as number)" placement="top">
                <div class="stat-value" :class="{ warning: item.isWarning && (archive[item.key as keyof typeof archive] as number) > 0 }">
                  {{ formatNumber(archive[item.key as keyof typeof archive] as number) }}
                </div>
              </el-tooltip>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <div class="section" v-if="creditTimeline.length > 0">
          <div class="section-title">信用记录</div>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in creditTimeline"
              :key="index"
              :timestamp="item.time"
              placement="top"
            >
              <div class="timeline-content">
                <el-tooltip :content="item.content" placement="top" :disabled="!isOverflow(item.content, 40)">
                  <span>{{ item.content }}</span>
                </el-tooltip>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>

      <el-empty v-else-if="!loading" description="暂无信用档案数据" />
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useNumberFormat } from '@hooks/useFormat'
import { getMerchantCreditArchive } from '@api/merchant-onboarding'
import { MERCHANT_CREDIT_LEVEL_COLORS } from '@enums/business'
import type { MerchantCreditArchive } from '@api/merchant-onboarding'

const props = defineProps<{
  modelValue: boolean
  applyId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { formatNumber } = useNumberFormat()

const loading = ref(false)
const archive = ref<MerchantCreditArchive | null>(null)

const statItems = [
  { key: 'onboardingCount', label: '入驻次数', isWarning: false },
  { key: 'violationCount', label: '违规次数', isWarning: true },
  { key: 'fakeQualificationCount', label: '虚假资质', isWarning: true },
  { key: 'crossIndustryCount', label: '跨行业违规', isWarning: true },
  { key: 'duplicateApplyCount', label: '重复申请', isWarning: true }
]

const scoreColor = computed(() => {
  if (!archive.value) return '#909399'
  const score = archive.value.creditScore
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#409eff'
  if (score >= 40) return '#e6a23c'
  return '#f56c6c'
})

const creditTimeline = computed(() => {
  if (!archive.value?.creditDetail) return []
  try {
    return JSON.parse(archive.value.creditDetail)
  } catch {
    return []
  }
})

const isOverflow = (text: string, maxLen: number) => {
  return text && text.length > maxLen
}

const loadArchive = async () => {
  if (!props.applyId) return
  loading.value = true
  try {
    const data = await getMerchantCreditArchive(props.applyId)
    archive.value = data
  } catch (error) {
    console.error('获取信用档案失败', error)
    ElMessage.error('获取信用档案失败')
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
    if (val && props.applyId) {
      loadArchive()
    }
  }
)

watch(
  () => props.applyId,
  (val) => {
    if (val && props.modelValue) {
      loadArchive()
    }
  }
)
</script>

<style lang="scss" scoped>
.credit-container {
  .credit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
    border-radius: 10px;
    margin-bottom: 20px;

    .header-info {
      flex: 1;
      min-width: 0;

      .merchant-name {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 320px;
      }

      .license-no {
        margin-top: 6px;
        font-size: 13px;
        color: $text-secondary;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 320px;
      }
    }

    .credit-score-block {
      text-align: center;
      flex-shrink: 0;
      margin-left: 20px;

      .score-value {
        font-size: 42px;
        font-weight: 700;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }

      .score-label {
        margin-top: 4px;
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .credit-level-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .level-label {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
    }

    .level-badge {
      min-width: 40px;
      text-align: center;
      font-size: 16px;
      font-weight: 700;
    }
  }

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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }

  .stat-card {
    text-align: center;
    padding: 16px 8px;
    background: #f5f7fa;
    border-radius: 8px;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: $text-primary;
      font-variant-numeric: tabular-nums;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.warning {
        color: #f56c6c;
      }
    }

    .stat-label {
      margin-top: 6px;
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .timeline-content {
    font-size: 13px;
    color: $text-regular;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
  }
}
</style>
