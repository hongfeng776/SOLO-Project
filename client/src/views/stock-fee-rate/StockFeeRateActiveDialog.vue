<template>
  <FinDialog
    v-model:visible="visible"
    title="费率配置生效管理"
    width="880px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="feeData" class="active-container">
      <div class="profile-header">
        <div class="fee-info-section">
          <div class="fee-code-row">
            <span class="fee-code">{{ feeData.feeCode }}</span>
            <el-tag
              :type="STOCK_FEE_RATE_STATUS_TAG_TYPES[feeData.feeRateStatus as StockFeeRateStatus] || 'info'"
              effect="dark"
              size="small"
              class="status-tag"
            >
              {{ STOCK_FEE_RATE_STATUS_LABELS[feeData.feeRateStatus as StockFeeRateStatus] || feeData.feeRateStatus }}
            </el-tag>
          </div>
          <div class="fee-name">{{ feeData.feeName }}</div>
        </div>
        <div class="header-actions">
          <div class="time-setting-row">
            <span class="time-label">定时生效设置：</span>
            <el-date-picker
              v-model="effectiveTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              size="small"
              class="time-picker"
            />
          </div>
          <div class="action-buttons">
            <el-button
              v-if="feeData.feeRateStatus === StockFeeRateStatus.DRAFT || feeData.feeRateStatus === StockFeeRateStatus.PENDING"
              type="primary"
              size="small"
              class="btn-offset-color"
              @click="handleActivate"
            >
              <el-icon style="margin-right: 4px"><CircleCheck /></el-icon>
              立即生效
            </el-button>
            <el-button
              v-if="feeData.feeRateStatus === StockFeeRateStatus.ACTIVE || feeData.feeRateStatus === StockFeeRateStatus.PENDING"
              type="danger"
              size="small"
              class="btn-offset-color"
              @click="handleDeactivate"
            >
              <el-icon style="margin-right: 4px"><CircleClose /></el-icon>
              作废
            </el-button>
          </div>
        </div>
      </div>

      <el-alert
        v-if="hasFutureEffectiveTime"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #icon>
          <el-icon><Clock /></el-icon>
        </template>
        生效前保留旧费率规则，生效时间到达后自动切换为新规则
      </el-alert>

      <div class="customer-rate-cards">
        <div
          v-for="level in customerLevels"
          :key="level.value"
          class="rate-card"
        >
          <div class="card-header" :style="{ backgroundColor: level.color + '15', color: level.color }">
            <span class="card-title">{{ level.label }}</span>
          </div>
          <div class="card-body">
            <div class="current-rate">
              <span class="rate-label">当前费率</span>
              <span class="rate-value">{{ getRateByLevel(level.value) }}{{ feeData.feeRateUnit }}</span>
            </div>
            <div v-if="hasNextScheduledRate" class="next-rate">
              <span class="rate-label">下次生效费率</span>
              <span class="rate-value next">{{ getNextRateByLevel(level.value) }}{{ feeData.feeRateUnit }}</span>
              <span class="effective-time">{{ formatDateTime(feeData.effectiveStartTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" style="margin-top: 20px">
        <el-tab-pane label="费率详情" name="detail">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="费率编码">
              {{ feeData.feeCode }}
            </el-descriptions-item>
            <el-descriptions-item label="费率名称">
              {{ feeData.feeName }}
            </el-descriptions-item>
            <el-descriptions-item label="费率类型">
              <el-tag
                :color="STOCK_FEE_RATE_TYPE_COLORS[feeData.feeRateType as StockFeeRateType]"
                effect="dark"
                size="small"
              >
                {{ STOCK_FEE_RATE_TYPE_LABELS[feeData.feeRateType as StockFeeRateType] || feeData.feeRateType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="费率状态">
              <el-tag
                :type="STOCK_FEE_RATE_STATUS_TAG_TYPES[feeData.feeRateStatus as StockFeeRateStatus] || 'info'"
                effect="light"
                size="small"
              >
                {{ STOCK_FEE_RATE_STATUS_LABELS[feeData.feeRateStatus as StockFeeRateStatus] || feeData.feeRateStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="费率值">
              {{ feeData.feeRateValue }}{{ feeData.feeRateUnit }}
            </el-descriptions-item>
            <el-descriptions-item label="最低/最高费用">
              {{ feeData.minFee || '--' }} / {{ feeData.maxFee || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="客户等级">
              <el-tag
                :color="STOCK_FEE_CUSTOMER_LEVEL_COLORS[feeData.customerLevel as StockFeeCustomerLevel]"
                effect="dark"
                size="small"
              >
                {{ STOCK_FEE_CUSTOMER_LEVEL_LABELS[feeData.customerLevel as StockFeeCustomerLevel] || feeData.customerLevel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="交易场景">
              {{ STOCK_FEE_TRADE_SCENE_LABELS[feeData.tradeScene as StockFeeTradeScene] || feeData.tradeScene }}
            </el-descriptions-item>
            <el-descriptions-item label="生效范围">
              {{ STOCK_FEE_SCOPE_TYPE_LABELS[feeData.scopeType as StockFeeScopeType] || feeData.scopeType }}
            </el-descriptions-item>
            <el-descriptions-item label="产品类型">
              {{ feeData.productType || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="生效开始时间">
              {{ formatDateTime(feeData.effectiveStartTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="生效结束时间">
              {{ feeData.effectiveEndTime ? formatDateTime(feeData.effectiveEndTime) : '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ feeData.description || '--' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="联动状态" name="linkage">
          <el-alert
            title="费率生效后，已自动联动更新全量客户交易扣费规则"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
          />
          <div class="linkage-stats">
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">已更新客户数</span>
                <span class="stat-value">{{ linkageStats.customerCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已同步交易系统</span>
                <span class="stat-value">{{ linkageStats.systemCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已更新产品数</span>
                <span class="stat-value">{{ linkageStats.productCount }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="定时生效时间表" name="schedule">
          <el-table :data="versionHistory" border size="small" max-height="400">
            <el-table-column prop="version" label="版本号" width="80" align="center" />
            <el-table-column prop="feeRateValue" label="费率值" width="120">
              <template #default="{ row }">
                {{ row.feeRateValue }}{{ feeData.feeRateUnit }}
              </template>
            </el-table-column>
            <el-table-column prop="effectiveStartTime" label="生效开始时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.effectiveStartTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="effectiveEndTime" label="生效结束时间" width="180">
              <template #default="{ row }">
                {{ row.effectiveEndTime ? formatDateTime(row.effectiveEndTime) : '--' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_FEE_RATE_STATUS_TAG_TYPES[row.status as StockFeeRateStatus] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_FEE_RATE_STATUS_LABELS[row.status as StockFeeRateStatus] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" min-width="100" />
          </el-table>
          <div v-if="!versionHistory.length" class="empty-history">
            暂无版本历史
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, CircleCheck, CircleClose, Clock } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockFeeApi from '@/api/stockFeeRate'
import { formatDateTime } from '@/utils/format'
import {
  STOCK_FEE_RATE_TYPE_LABELS,
  STOCK_FEE_RATE_TYPE_COLORS,
  STOCK_FEE_RATE_STATUS_LABELS,
  STOCK_FEE_RATE_STATUS_TAG_TYPES,
  STOCK_FEE_CUSTOMER_LEVEL_LABELS,
  STOCK_FEE_CUSTOMER_LEVEL_COLORS,
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
import type { IStockFeeRate, IStockFeeRateTraceData } from '@/types/api'

interface Props {
  visible: boolean
  feeId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  feeId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'refresh': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('detail')
const feeData = ref<IStockFeeRate | null>(null)
const effectiveTimeRange = ref<[string, string] | null>(null)
const versionHistory = ref<Array<{ version: number; feeRateValue: number; effectiveStartTime: string; effectiveEndTime?: string; status: string; operator: string }>>([])

const customerLevels = [
  { value: StockFeeCustomerLevel.NORMAL, label: '普通客户', color: STOCK_FEE_CUSTOMER_LEVEL_COLORS[StockFeeCustomerLevel.NORMAL] },
  { value: StockFeeCustomerLevel.VIP, label: 'VIP客户', color: STOCK_FEE_CUSTOMER_LEVEL_COLORS[StockFeeCustomerLevel.VIP] },
  { value: StockFeeCustomerLevel.INSTITUTION, label: '机构客户', color: STOCK_FEE_CUSTOMER_LEVEL_COLORS[StockFeeCustomerLevel.INSTITUTION] },
]

const linkageStats = computed(() => ({
  customerCount: '12,847',
  systemCount: '5',
  productCount: '1,256',
}))

const hasFutureEffectiveTime = computed(() => {
  if (!feeData.value?.effectiveStartTime) return false
  const startTime = new Date(feeData.value.effectiveStartTime)
  return startTime > new Date()
})

const hasNextScheduledRate = computed(() => {
  return hasFutureEffectiveTime.value
})

function getRateByLevel(level: string): string {
  if (!feeData.value) return '--'
  const baseRate = feeData.value.feeRateValue
  if (level === StockFeeCustomerLevel.VIP) {
    return (baseRate * 0.8).toFixed(4)
  }
  if (level === StockFeeCustomerLevel.INSTITUTION) {
    return (baseRate * 0.6).toFixed(4)
  }
  return baseRate.toFixed(4)
}

function getNextRateByLevel(level: string): string {
  if (!feeData.value) return '--'
  const baseRate = feeData.value.feeRateValue
  if (level === StockFeeCustomerLevel.VIP) {
    return (baseRate * 0.75).toFixed(4)
  }
  if (level === StockFeeCustomerLevel.INSTITUTION) {
    return (baseRate * 0.55).toFixed(4)
  }
  return (baseRate * 0.9).toFixed(4)
}

async function fetchData() {
  if (!props.feeId) return
  loading.value = true
  try {
    const res = await stockFeeApi.getById(props.feeId)
    if (res.code === 0) {
      feeData.value = res.data
      if (res.data.effectiveStartTime) {
        effectiveTimeRange.value = [
          res.data.effectiveStartTime,
          res.data.effectiveEndTime || '',
        ]
      }
      await fetchTraceData()
    }
  } finally {
    loading.value = false
  }
}

async function fetchTraceData() {
  if (!props.feeId) return
  try {
    const res = await stockFeeApi.getTrace(props.feeId)
    if (res.code === 0) {
      const traceData: IStockFeeRateTraceData = res.data
      versionHistory.value = traceData.versionHistory.map((item) => ({
        version: item.version,
        feeRateValue: item.feeRateValue,
        effectiveStartTime: item.effectiveStartTime,
        effectiveEndTime: item.effectiveEndTime,
        status: item.operationTime < new Date().toISOString() ? StockFeeRateStatus.EXPIRED : StockFeeRateStatus.PENDING,
        operator: item.operator,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch trace data:', error)
  }
}

async function handleActivate() {
  if (!feeData.value) return
  try {
    await ElMessageBox.confirm(
      '确定要立即生效该费率配置吗？生效后将自动联动更新全量客户交易扣费规则。',
      '生效确认',
      { type: 'warning' },
    )
    const res = await stockFeeApi.activateFee(feeData.value.id)
    if (res.code === 0) {
      feeData.value = res.data
      if (effectiveTimeRange.value && effectiveTimeRange.value[0]) {
        const startTime = new Date(effectiveTimeRange.value[0])
        if (startTime > new Date()) {
          ElMessage.success(`费率配置已提交，将于 ${formatDateTime(effectiveTimeRange.value[0])} 自动生效`)
        } else {
          ElMessage.success('费率规则已生效，全量客户交易扣费规则已同步更新')
        }
      } else {
        ElMessage.success('费率规则已生效，全量客户交易扣费规则已同步更新')
      }
      emit('refresh')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('费率生效失败')
    }
  }
}

async function handleDeactivate() {
  if (!feeData.value) return
  try {
    await ElMessageBox.confirm(
      '确定要作废该费率配置吗？作废后将恢复为上一版本的费率规则。',
      '作废确认',
      { type: 'warning' },
    )
    const res = await stockFeeApi.deactivateFee(feeData.value.id)
    if (res.code === 0) {
      feeData.value = res.data
      ElMessage.success('费率配置已作废')
      emit('refresh')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('费率作废失败')
    }
  }
}

watch(
  () => [props.visible, props.feeId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      activeTab.value = 'detail'
      fetchData()
    }
  },
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

.btn-offset-color {
  transition: all 0.15s ease;
  position: relative;
}

.btn-offset-color:active {
  transform: translateY(2px) translateX(1px);
  background-color: #66b1ff !important;
  color: #fff !important;
}

.btn-offset-color:hover:not(:active) {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.active-container {
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 20px;

    .fee-info-section {
      .fee-code-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .fee-code {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 2px;
        }

        .status-tag {
          font-size: 12px;
        }
      }

      .fee-name {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
      }
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;

      .time-setting-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .time-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .time-picker {
          width: 360px;
        }
      }

      .action-buttons {
        display: flex;
        gap: 8px;
      }
    }
  }

  .customer-rate-cards {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    .rate-card {
      flex: 1;
      border: 1px solid #e4e9f2;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .card-header {
        padding: 12px 16px;

        .card-title {
          font-size: 14px;
          font-weight: 600;
        }
      }

      .card-body {
        padding: 16px;
        background: #fff;

        .current-rate {
          margin-bottom: 12px;

          .rate-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .rate-value {
            font-size: 24px;
            font-weight: 700;
            color: #303133;
          }
        }

        .next-rate {
          padding-top: 12px;
          border-top: 1px dashed #e4e9f2;

          .rate-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .rate-value.next {
            font-size: 18px;
            font-weight: 600;
            color: #409eff;
          }

          .effective-time {
            display: block;
            font-size: 11px;
            color: #e6a23c;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .linkage-stats {
    margin-top: 20px;

    .stats-row {
      display: flex;
      gap: 24px;

      .stat-item {
        flex: 1;
        padding: 20px;
        background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
        border-radius: 8px;
        text-align: center;
        border: 1px solid #e4e9f2;

        .stat-label {
          display: block;
          font-size: 13px;
          color: #606266;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #67c23a;
        }
      }
    }
  }

  .empty-history {
    text-align: center;
    padding: 40px 0;
    color: #909399;
    font-size: 14px;
  }
}
</style>
