<template>
  <FinDialog
    v-model:visible="visible"
    title="费率溯源全周期变更记录"
    width="980px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="trace-container">
      <div class="trace-header">
        <span class="trace-header-name">{{ sourceInfo?.feeName || '-' }}</span>
        <span class="trace-header-code">{{ sourceInfo?.feeCode || '-' }}</span>
        <el-tag
          :color="STOCK_FEE_RATE_TYPE_COLORS[feeInfo?.feeRateType as StockFeeRateType] || '#909399'"
          effect="light"
          size="small"
        >
          {{ STOCK_FEE_RATE_TYPE_LABELS[feeInfo?.feeRateType as StockFeeRateType] || feeInfo?.feeRateType || '-' }}
        </el-tag>
        <el-tag
          :type="(STOCK_FEE_RATE_STATUS_TAG_TYPES[feeInfo?.feeRateStatus as StockFeeRateStatus] as any) || 'info'"
          effect="light"
          size="small"
        >
          {{ STOCK_FEE_RATE_STATUS_LABELS[feeInfo?.feeRateStatus as StockFeeRateStatus] || feeInfo?.feeRateStatus || '-' }}
        </el-tag>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="建档溯源" name="source">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="建档人">
              {{ sourceInfo?.createdBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="建档时间">
              {{ formatDateTime(sourceInfo?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="费率编码">
              <span class="code-text">{{ sourceInfo?.feeCode || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="费率名称">
              {{ sourceInfo?.feeName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="费率类型">
              {{ STOCK_FEE_RATE_TYPE_LABELS[feeInfo?.feeRateType as StockFeeRateType] || feeInfo?.feeRateType || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="客户等级">
              {{ STOCK_FEE_CUSTOMER_LEVEL_LABELS[feeInfo?.customerLevel as StockFeeCustomerLevel] || feeInfo?.customerLevel || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="交易场景">
              {{ STOCK_FEE_TRADE_SCENE_LABELS[feeInfo?.tradeScene as StockFeeTradeScene] || feeInfo?.tradeScene || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="生效范围">
              {{ STOCK_FEE_SCOPE_TYPE_LABELS[feeInfo?.scopeType as StockFeeScopeType] || feeInfo?.scopeType || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="费率值">
              <el-tooltip placement="top" :show-after="300">
                <template #content>
                  <div class="fee-tooltip-detail">
                    <div class="tooltip-title">扣费计算明细</div>
                    <div class="tooltip-row"><span>交易金额:</span><span>¥100,000</span></div>
                    <div class="tooltip-row"><span>费率:</span><span>{{ feeRateValue }}{{ feeRateUnit }}</span></div>
                    <div class="tooltip-row"><span>基础费用:</span><span>¥{{ baseFee }}</span></div>
                    <div class="tooltip-row"><span>最低费用:</span><span>¥{{ minFee || '无' }}</span></div>
                    <div class="tooltip-row"><span>最高费用:</span><span>¥{{ maxFee || '无' }}</span></div>
                    <div class="tooltip-row final"><span>最终扣费:</span><span>¥{{ finalFee }}</span></div>
                  </div>
                </template>
                <span class="fee-value-text">{{ feeRateValue }}{{ feeRateUnit }}</span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item label="最低费用">
              {{ minFee ? '¥' + minFee : '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="最高费用">
              {{ maxFee ? '¥' + maxFee : '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="版本历史" name="version">
          <el-table
            v-if="versionHistory.length > 0"
            :data="versionHistory"
            border
            max-height="400"
          >
            <el-table-column prop="version" label="版本号" width="80" align="center" />
            <el-table-column prop="feeRateValue" label="费率值" width="140">
              <template #default="{ row }">
                <el-tooltip placement="top" :show-after="300">
                  <template #content>
                    <div class="fee-tooltip-detail">
                      <div class="tooltip-title">扣费计算明细</div>
                      <div class="tooltip-row"><span>交易金额:</span><span>¥100,000</span></div>
                      <div class="tooltip-row"><span>费率:</span><span>{{ row.feeRateValue }}{{ feeRateUnit }}</span></div>
                      <div class="tooltip-row"><span>基础费用:</span><span>¥{{ calculateBaseFee(row.feeRateValue) }}</span></div>
                      <div class="tooltip-row"><span>最低费用:</span><span>¥{{ minFee || '无' }}</span></div>
                      <div class="tooltip-row"><span>最高费用:</span><span>¥{{ maxFee || '无' }}</span></div>
                      <div class="tooltip-row final"><span>最终扣费:</span><span>¥{{ calculateFinalFee(row.feeRateValue) }}</span></div>
                    </div>
                  </template>
                  <span class="fee-value-text">{{ row.feeRateValue }}{{ feeRateUnit }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="生效开始时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.effectiveStartTime) }}
              </template>
            </el-table-column>
            <el-table-column label="生效结束时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.effectiveEndTime) || '长期有效' }}
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column label="操作时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.operationTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" />
          </el-table>
          <el-empty v-else description="暂无版本历史" />
        </el-tab-pane>

        <el-tab-pane label="合规性校验" name="compliance">
          <div class="compliance-check">
            <el-alert
              title="系统自动校验费率合规性与行业标准匹配度"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            />
            <el-descriptions :column="2" border>
              <el-descriptions-item label="合规校验结果">
                <el-tag
                  :type="complianceCheck?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  <el-icon v-if="complianceCheck?.passed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ complianceCheck?.passed ? '通过' : '未通过' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="行业标准匹配">
                <el-tag
                  :type="complianceCheck?.industryStandardMatch ? 'success' : 'warning'"
                  effect="light"
                >
                  <el-icon v-if="complianceCheck?.industryStandardMatch"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ complianceCheck?.industryStandardMatch ? '匹配' : '不匹配' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div
              v-if="complianceCheck && complianceCheck.issues && complianceCheck.issues.length > 0"
              class="issues-section"
            >
              <h4>合规性问题</h4>
              <el-table :data="complianceCheck.issues" border size="small">
                <el-table-column prop="type" label="类型" width="140" />
                <el-table-column prop="severity" label="严重程度" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="描述" />
                <el-table-column label="标准值" width="120" align="right">
                  <template #default="{ row }">
                    {{ row.standardValue !== undefined ? row.standardValue : '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="实际值" width="120" align="right">
                  <template #default="{ row }">
                    {{ row.actualValue !== undefined ? row.actualValue : '-' }}
                  </template>
                </el-table-column>
              </el-table>

              <el-alert
                v-if="exceedIndustryStandardPercent > 0"
                :title="`该费率超出行业标准${exceedIndustryStandardPercent}%，可能存在合规风险`"
                type="warning"
                :closable="false"
                show-icon
                style="margin-top: 16px"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="计算逻辑核对" name="calculation">
          <div class="calculation-verification">
            <div class="accuracy-display">
              <div class="accuracy-label">计算逻辑准确率</div>
              <div class="accuracy-value">{{ overallAccuracy }}%</div>
            </div>

            <el-table
              v-if="sampleTrades.length > 0"
              :data="sampleTrades"
              border
              max-height="400"
            >
              <el-table-column prop="tradeId" label="交易ID" width="100" align="center" />
              <el-table-column label="交易金额" width="140" align="right">
                <template #default="{ row }">
                  ¥{{ row.tradeAmount.toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column label="预期费用" width="140" align="right">
                <template #default="{ row }">
                  ¥{{ row.expectedFee.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="实际费用" width="140" align="right">
                <template #default="{ row }">
                  ¥{{ row.actualFee.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="校验结果" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.passed ? 'success' : 'danger'" size="small" effect="light">
                    {{ row.passed ? '通过' : '未通过' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无核对数据" />

            <el-alert
              v-if="failedTradeCount > 0"
              :title="`存在${failedTradeCount}笔交易扣费计算偏差，请检查费率配置逻辑`"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 16px"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockFeeApi from '@/api/stockFeeRate'
import { formatDateTime } from '@/utils/format'
import {
  STOCK_FEE_RATE_TYPE_LABELS,
  STOCK_FEE_RATE_TYPE_COLORS,
  STOCK_FEE_RATE_STATUS_LABELS,
  STOCK_FEE_RATE_STATUS_TAG_TYPES,
  STOCK_FEE_CUSTOMER_LEVEL_LABELS,
  STOCK_FEE_TRADE_SCENE_LABELS,
  STOCK_FEE_SCOPE_TYPE_LABELS,
} from '@/constants/dictionaries'
import {
  StockFeeRateType,
  StockFeeRateStatus,
  StockFeeCustomerLevel,
  StockFeeTradeScene,
  StockFeeScopeType,
} from '@/enums'
import type { IStockFeeRateTraceData, IStockFeeRate } from '@/types/api'

interface Props {
  visible: boolean
  feeId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  feeId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('source')
const sourceInfo = ref<IStockFeeRateTraceData['sourceInfo'] | null>(null)
const feeInfo = ref<Partial<IStockFeeRate> | null>(null)
const versionHistory = ref<IStockFeeRateTraceData['versionHistory']>([])
const complianceCheck = ref<IStockFeeRateTraceData['complianceCheck'] | null>(null)
const calculationVerification = ref<IStockFeeRateTraceData['calculationVerification'] | null>(null)

const feeRateValue = computed(() => feeInfo.value?.feeRateValue ?? 0)
const feeRateUnit = computed(() => feeInfo.value?.feeRateUnit || '')
const minFee = computed(() => feeInfo.value?.minFee)
const maxFee = computed(() => feeInfo.value?.maxFee)

const baseFee = computed(() => {
  const tradeAmount = 100000
  return (tradeAmount * feeRateValue.value).toFixed(2)
})

const finalFee = computed(() => {
  const base = parseFloat(baseFee.value)
  let final = base
  if (minFee.value !== undefined && final < minFee.value) {
    final = minFee.value
  }
  if (maxFee.value !== undefined && final > maxFee.value) {
    final = maxFee.value
  }
  return final.toFixed(2)
})

const overallAccuracy = computed(() => {
  return calculationVerification.value?.overallAccuracy?.toFixed(2) ?? '0.00'
})

const sampleTrades = computed(() => {
  return calculationVerification.value?.sampleTrades || []
})

const failedTradeCount = computed(() => {
  return sampleTrades.value.filter((t) => !t.passed).length
})

const exceedIndustryStandardPercent = computed(() => {
  if (!complianceCheck.value?.issues) return 0
  const exceedIssue = complianceCheck.value.issues.find(
    (i) => i.type === 'industry_standard_exceed' || i.message.includes('超出行业标准')
  )
  if (exceedIssue && exceedIssue.standardValue !== undefined) {
    const diff = ((exceedIssue.actualValue - exceedIssue.standardValue) / exceedIssue.standardValue) * 100
    return Math.round(diff)
  }
  return 0
})

function calculateBaseFee(rateValue: number): string {
  return (100000 * rateValue).toFixed(2)
}

function calculateFinalFee(rateValue: number): string {
  const base = 100000 * rateValue
  let final = base
  if (minFee.value !== undefined && final < minFee.value) {
    final = minFee.value
  }
  if (maxFee.value !== undefined && final > maxFee.value) {
    final = maxFee.value
  }
  return final.toFixed(2)
}

async function fetchData() {
  if (!props.feeId) return
  loading.value = true
  try {
    const res = await stockFeeApi.getTrace(props.feeId)
    if (res.code === 0) {
      const data = res.data
      sourceInfo.value = data.sourceInfo
      feeInfo.value = data.sourceInfo?.originalData || {}
      versionHistory.value = data.versionHistory || []
      complianceCheck.value = data.complianceCheck || null
      calculationVerification.value = data.calculationVerification || null
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.feeId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      fetchData()
    }
  }
)
</script>

<style lang="scss" scoped>
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 8px;
  color: #909399;
}

.trace-container {
  :deep(.el-tabs__header) {
    position: sticky;
    top: 64px;
    z-index: 10;
    background: #fff;
  }
}

.trace-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 12px;

  .trace-header-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .trace-header-code {
    font-family: monospace;
    font-size: 13px;
    color: #909399;
  }
}

.code-text {
  font-family: monospace;
  color: #409eff;
}

.fee-value-text {
  color: #409eff;
  cursor: help;
  font-weight: 600;
}

.fee-tooltip-detail {
  min-width: 220px;
  padding: 8px;

  .tooltip-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #303133;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 4px;
  }

  .tooltip-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;

    span:first-child {
      color: #909399;
    }

    span:last-child {
      color: #303133;
      font-weight: 500;
    }

    &.final {
      font-weight: 600;
      color: #f56c6c;
      border-top: 1px solid #ebeef5;
      margin-top: 4px;
      padding-top: 8px;

      span:last-child {
        color: #f56c6c;
      }
    }
  }
}

.compliance-check,
.calculation-verification {
  .issues-section {
    margin-top: 16px;

    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #303133;
    }
  }
}

.accuracy-display {
  text-align: center;
  padding: 24px 0;
  margin-bottom: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  .accuracy-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .accuracy-value {
    font-size: 48px;
    font-weight: 700;
    color: #67c23a;
    line-height: 1;
  }
}
</style>
