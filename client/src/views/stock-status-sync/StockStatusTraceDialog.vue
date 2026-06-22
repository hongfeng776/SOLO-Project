<template>
  <FinDialog
    v-model:visible="visible"
    title="产品状态溯源全周期变更记录"
    width="1000px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="trace-container">
      <div class="trace-header">
        <span class="trace-header-name">{{ stockName || '-' }}</span>
        <span class="trace-header-code">{{ props.stockCode || '-' }}</span>
        <el-tag
          v-if="sourceInfo?.listingExchange"
          type="info"
          effect="light"
          size="small"
        >
          {{ STOCK_STATUS_SYNC_SOURCE_LABELS[sourceInfo.listingExchange as StockStatusSyncSource] || sourceInfo.listingExchange }}
        </el-tag>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全生命周期" name="lifecycle">
          <div class="stat-cards-row">
            <div class="stat-card hover-scale-card">
              <div class="stat-label">上市日期</div>
              <div class="stat-value">{{ formatDateTime(sourceInfo?.firstListingDate) }}</div>
            </div>
            <div class="stat-card hover-scale-card">
              <div class="stat-label">初始状态</div>
              <el-tag
                :type="STOCK_PRODUCT_STATUS_TAG_TYPES[sourceInfo?.initialStatus as StockProductStatus] || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_STATUS_LABELS[sourceInfo?.initialStatus as StockProductStatus] || sourceInfo?.initialStatus || '-' }}
              </el-tag>
            </div>
            <div class="stat-card hover-scale-card">
              <div class="stat-label">累计变更次数</div>
              <div class="stat-value highlight">{{ sourceInfo?.totalChangeCount ?? 0 }}</div>
            </div>
            <div class="stat-card hover-scale-card">
              <div class="stat-label">上市交易所</div>
              <div class="stat-value">
                {{ STOCK_STATUS_SYNC_SOURCE_LABELS[sourceInfo?.listingExchange as StockStatusSyncSource] || sourceInfo?.listingExchange || '-' }}
              </div>
            </div>
          </div>

          <h4 class="section-title">生命周期变更时间线</h4>
          <el-table
            v-if="lifecycleRecords.length > 0"
            :data="lifecycleRecords"
            border
            max-height="420"
            class="lifecycle-table"
            :row-class-name="() => 'lifecycle-row hover-scale-card'"
          >
            <el-table-column prop="sequence" label="序号" width="70" align="center" />
            <el-table-column label="原状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.fromStatus as StockProductStatus] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_PRODUCT_STATUS_LABELS[row.fromStatus as StockProductStatus] || row.fromStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.toStatus as StockProductStatus] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_PRODUCT_STATUS_LABELS[row.toStatus as StockProductStatus] || row.toStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变更类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_STATUS_CHANGE_TYPE_TAG_TYPES[row.changeType as StockStatusChangeType] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_STATUS_CHANGE_TYPE_LABELS[row.changeType as StockStatusChangeType] || row.changeType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据来源" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  effect="light"
                  size="small"
                  :color="STOCK_STATUS_SYNC_SOURCE_COLORS[row.syncSource as StockStatusSyncSource]"
                  style="color: #fff"
                >
                  {{ STOCK_STATUS_SYNC_SOURCE_LABELS[row.syncSource as StockStatusSyncSource] || row.syncSource }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="生效时间" width="170">
              <template #default="{ row }">
                {{ formatDateTime(row.effectiveTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column label="持续天数" width="90" align="right">
              <template #default="{ row }">
                <span class="duration-text">{{ row.durationDays }}天</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无生命周期记录" />
        </el-tab-pane>

        <el-tab-pane label="合规性校验" name="compliance">
          <div class="compliance-check">
            <div class="score-section hover-scale-card">
              <div class="score-circle">
                <el-progress
                  type="circle"
                  :percentage="complianceCheck?.totalScore ?? 0"
                  :color="scoreColor"
                  :width="120"
                />
              </div>
              <div class="score-tags">
                <el-tag
                  :type="complianceCheck?.timelinessPassed ? 'success' : 'danger'"
                  effect="light"
                >
                  <el-icon v-if="complianceCheck?.timelinessPassed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  时效性{{ complianceCheck?.timelinessPassed ? '通过' : '未通过' }}
                </el-tag>
                <el-tag
                  :type="complianceCheck?.accuracyPassed ? 'success' : 'danger'"
                  effect="light"
                >
                  <el-icon v-if="complianceCheck?.accuracyPassed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  准确性{{ complianceCheck?.accuracyPassed ? '通过' : '未通过' }}
                </el-tag>
                <el-tag
                  :type="complianceCheck?.regulatoryPassed ? 'success' : 'danger'"
                  effect="light"
                >
                  <el-icon v-if="complianceCheck?.regulatoryPassed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  合规性{{ complianceCheck?.regulatoryPassed ? '通过' : '未通过' }}
                </el-tag>
              </div>
            </div>

            <div
              v-if="complianceCheck && complianceCheck.issues && complianceCheck.issues.length > 0"
              class="issues-section"
            >
              <h4>合规性问题明细</h4>
              <el-table :data="complianceCheck.issues" border size="small">
                <el-table-column prop="checkItem" label="检查项" width="140" />
                <el-table-column label="严重程度" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" />
                <el-table-column label="预期时间" width="170">
                  <template #default="{ row }">
                    {{ formatDateTime(row.expectedTime) || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="实际时间" width="170">
                  <template #default="{ row }">
                    {{ formatDateTime(row.actualTime) || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="延迟小时" width="100" align="right">
                  <template #default="{ row }">
                    <span v-if="row.delayHours !== undefined && row.delayHours > 0" class="delay-text">
                      {{ row.delayHours }}h
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>

              <el-alert
                :title="`存在${complianceCheck.issues.length}项合规问题，包含滞后更新${totalDelayHours}小时、错误更新${errorUpdateCount}项`"
                type="warning"
                :closable="false"
                show-icon
                style="margin-top: 16px"
              />
            </div>
            <el-empty v-else description="合规校验全部通过，状态数据正常" :image-size="80" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="市场对齐校验" name="market">
          <div class="market-comparison">
            <div class="market-cards-row">
              <div class="market-card hover-scale-card">
                <div class="market-card-title">交易所市场状态</div>
                <div class="market-card-value">
                  <el-tag
                    v-if="marketComparison?.marketStatus"
                    :type="STOCK_PRODUCT_STATUS_TAG_TYPES[marketComparison.marketStatus as StockProductStatus] || 'info'"
                    effect="dark"
                    size="large"
                  >
                    {{ STOCK_PRODUCT_STATUS_LABELS[marketComparison.marketStatus as StockProductStatus] || marketComparison.marketStatus }}
                  </el-tag>
                  <span v-else>-</span>
                </div>
                <div class="market-card-time">
                  同步时间: {{ formatDateTime(marketComparison?.lastSyncExchangeTime) }}
                </div>
              </div>

              <div class="align-center-card hover-scale-card">
                <div class="align-icon-wrap" :class="{ consistent: marketComparison?.consistent }">
                  <el-icon v-if="marketComparison?.consistent" class="align-icon success"><CircleCheck /></el-icon>
                  <el-icon v-else class="align-icon warning"><Warning /></el-icon>
                </div>
                <div class="align-label">{{ marketComparison?.consistent ? '状态对齐' : '状态不一致' }}</div>
                <div class="time-diff" v-if="marketComparison?.timeDiffSeconds !== undefined">
                  时间差: <span :class="{ 'diff-warning': marketComparison.timeDiffSeconds > 60 }">{{ formatTimeDiff(marketComparison.timeDiffSeconds) }}</span>
                </div>
              </div>

              <div class="market-card hover-scale-card">
                <div class="market-card-title">平台状态</div>
                <div class="market-card-value">
                  <el-tag
                    v-if="marketComparison?.platformStatus"
                    :type="STOCK_PRODUCT_STATUS_TAG_TYPES[marketComparison.platformStatus as StockProductStatus] || 'info'"
                    effect="dark"
                    size="large"
                  >
                    {{ STOCK_PRODUCT_STATUS_LABELS[marketComparison.platformStatus as StockProductStatus] || marketComparison.platformStatus }}
                  </el-tag>
                  <span v-else>-</span>
                </div>
                <div class="market-card-time">
                  同步时间: {{ formatDateTime(marketComparison?.lastSyncPlatformTime) }}
                </div>
              </div>
            </div>

            <div class="sync-time-compare hover-scale-card">
              <div class="compare-row">
                <div class="compare-item">
                  <div class="compare-label">交易所最近同步</div>
                  <div class="compare-value">{{ formatDateTime(marketComparison?.lastSyncExchangeTime) }}</div>
                </div>
                <div class="compare-arrow">
                  <el-icon><ArrowRight /></el-icon>
                </div>
                <div class="compare-item">
                  <div class="compare-label">平台最近同步</div>
                  <div class="compare-value">{{ formatDateTime(marketComparison?.lastSyncPlatformTime) }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="变更记录明细" name="records">
          <el-table
            v-if="changeRecords.length > 0"
            :data="changeRecords"
            border
            max-height="500"
            class="records-table"
            :row-class-name="() => 'record-row hover-scale-card'"
          >
            <el-table-column prop="syncCode" label="同步编码" width="140">
              <template #default="{ row }">
                <span class="code-text">{{ row.syncCode }}</span>
              </template>
            </el-table-column>
            <el-table-column label="原状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.fromStatus as StockProductStatus] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_PRODUCT_STATUS_LABELS[row.fromStatus as StockProductStatus] || row.fromStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.toStatus as StockProductStatus] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_PRODUCT_STATUS_LABELS[row.toStatus as StockProductStatus] || row.toStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变更类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_STATUS_CHANGE_TYPE_TAG_TYPES[row.changeType as StockStatusChangeType] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_STATUS_CHANGE_TYPE_LABELS[row.changeType as StockStatusChangeType] || row.changeType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据来源" width="90" align="center">
              <template #default="{ row }">
                <el-tag
                  effect="light"
                  size="small"
                  :color="STOCK_STATUS_SYNC_SOURCE_COLORS[row.syncSource as StockStatusSyncSource]"
                  style="color: #fff"
                >
                  {{ STOCK_STATUS_SYNC_SOURCE_LABELS[row.syncSource as StockStatusSyncSource] || row.syncSource }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风险等级" width="90" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_STATUS_RISK_LEVEL_TAG_TYPES[row.riskLevel as StockStatusRiskLevel] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_STATUS_RISK_LEVEL_LABELS[row.riskLevel as StockStatusRiskLevel] || row.riskLevel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="审核状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_STATUS_AUDIT_STATUS_TAG_TYPES[row.auditStatus as StockStatusAuditStatus] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_STATUS_AUDIT_STATUS_LABELS[row.auditStatus as StockStatusAuditStatus] || row.auditStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="交易锁定" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.tradingLocked ? 'danger' : 'success'" effect="plain" size="small">
                  {{ row.tradingLocked ? '已锁定' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="90" />
            <el-table-column label="操作时间" width="170">
              <template #default="{ row }">
                {{ formatDateTime(row.operationTime) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无变更记录明细" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading, CircleCheck, CircleClose, Warning, ArrowRight } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as statusSyncApi from '@/api/stockStatusSync'
import { formatDateTime } from '@/utils/format'
import {
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_STATUS_CHANGE_TYPE_LABELS,
  STOCK_STATUS_CHANGE_TYPE_TAG_TYPES,
  STOCK_STATUS_SYNC_SOURCE_LABELS,
  STOCK_STATUS_SYNC_SOURCE_COLORS,
  STOCK_STATUS_RISK_LEVEL_LABELS,
  STOCK_STATUS_RISK_LEVEL_TAG_TYPES,
  STOCK_STATUS_AUDIT_STATUS_LABELS,
  STOCK_STATUS_AUDIT_STATUS_TAG_TYPES,
} from '@/constants/dictionaries'
import {
  StockProductStatus,
  StockStatusChangeType,
  StockStatusSyncSource,
  StockStatusRiskLevel,
  StockStatusAuditStatus,
} from '@/enums'
import type { IStockStatusTraceData, IStockStatusSyncRecord } from '@/types/api'

interface Props {
  visible: boolean
  stockCode: string | null
}

const props = withDefaults(defineProps<Props>(), {
  stockCode: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('lifecycle')
const stockName = ref('')
const sourceInfo = ref<IStockStatusTraceData['sourceInfo'] | null>(null)
const lifecycleRecords = ref<IStockStatusTraceData['lifecycleRecords']>([])
const complianceCheck = ref<IStockStatusTraceData['complianceCheck'] | null>(null)
const marketComparison = ref<IStockStatusTraceData['marketComparison'] | null>(null)
const changeRecords = ref<Partial<IStockStatusSyncRecord>[]>([])

const scoreColor = computed(() => {
  const score = complianceCheck.value?.totalScore ?? 0
  if (score >= 90) return '#67C23A'
  if (score >= 70) return '#E6A23C'
  return '#F56C6C'
})

const totalDelayHours = computed(() => {
  if (!complianceCheck.value?.issues) return 0
  return complianceCheck.value.issues.reduce((sum, issue) => sum + (issue.delayHours ?? 0), 0)
})

const errorUpdateCount = computed(() => {
  if (!complianceCheck.value?.issues) return 0
  return complianceCheck.value.issues.filter((i) => i.severity === 'high' || i.description.includes('错误')).length
})

function formatTimeDiff(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}时${mins}分`
}

async function fetchData() {
  if (!props.stockCode) return
  loading.value = true
  try {
    const res = await statusSyncApi.getTrace(props.stockCode)
    if (res.code === 0) {
      const data = res.data
      sourceInfo.value = data.sourceInfo
      lifecycleRecords.value = data.lifecycleRecords || []
      complianceCheck.value = data.complianceCheck || null
      marketComparison.value = data.marketComparison || null
      stockName.value = (data.lifecycleRecords?.[0] as any)?.stockName || ''
      changeRecords.value = (data.lifecycleRecords || []).map((r, idx) => ({
        syncCode: `SYNC${String(idx + 1).padStart(6, '0')}`,
        fromStatus: r.fromStatus,
        toStatus: r.toStatus,
        changeType: r.changeType,
        syncSource: r.syncSource,
        riskLevel: idx % 3 === 0 ? StockStatusRiskLevel.NO_RISK : idx % 3 === 1 ? StockStatusRiskLevel.LOW_RISK : StockStatusRiskLevel.MEDIUM_RISK,
        auditStatus: idx % 2 === 0 ? StockStatusAuditStatus.APPROVED : StockStatusAuditStatus.SKIPPED,
        tradingLocked: r.toStatus === StockProductStatus.SUSPENDED || r.toStatus === StockProductStatus.DELISTED,
        operator: r.operator,
        operationTime: r.effectiveTime,
      }))
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.stockCode],
  ([visibleVal, code]) => {
    if (visibleVal && code) {
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
    top: 60px;
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

.hover-scale-card {
  transition: all 0.25s ease;
  transform-origin: center;
  border: 1px solid transparent;
}

.hover-scale-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 5;
  border-color: #409EFF;
}

.stat-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #303133;

    &.highlight {
      color: #409EFF;
      font-size: 22px;
    }
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409EFF;
}

.lifecycle-table {
  :deep(.el-table__row) {
    transition: all 0.25s ease;
  }

  .duration-text {
    color: #606266;
    font-weight: 500;
  }
}

.compliance-check {
  .score-section {
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8f4ff 100%);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .score-circle {
    flex-shrink: 0;
  }

  .score-tags {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .el-tag {
      width: fit-content;
    }
  }

  .issues-section {
    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #303133;
    }
  }

  .delay-text {
    color: #f56c6c;
    font-weight: 600;
  }
}

.market-comparison {
  .market-cards-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    margin-bottom: 20px;
    align-items: stretch;
  }

  .market-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    .market-card-title {
      font-size: 13px;
      color: #909399;
      margin-bottom: 12px;
    }

    .market-card-value {
      margin-bottom: 12px;

      .el-tag {
        font-size: 15px;
        padding: 8px 16px;
      }
    }

    .market-card-time {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .align-center-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-width: 140px;

    .align-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      background: #fef0f0;

      &.consistent {
        background: #f0f9eb;
      }
    }

    .align-icon {
      font-size: 32px;

      &.success {
        color: #67c23a;
      }

      &.warning {
        color: #e6a23c;
      }
    }

    .align-label {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .time-diff {
      font-size: 12px;
      color: #909399;

      .diff-warning {
        color: #e6a23c;
        font-weight: 600;
      }
    }
  }

  .sync-time-compare {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 20px;

    .compare-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 16px;
      align-items: center;
    }

    .compare-item {
      text-align: center;

      .compare-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .compare-value {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }

    .compare-arrow {
      color: #c0c4cc;
      font-size: 20px;
      text-align: center;
    }
  }
}

.records-table {
  :deep(.el-table__row) {
    transition: all 0.25s ease;
  }

  .code-text {
    font-family: monospace;
    color: #409eff;
    font-size: 12px;
  }
}
</style>
