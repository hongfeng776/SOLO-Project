<template>
  <div class="passenger-travel-risk">
    <div class="risk-overview">
      <div class="risk-level-section">
        <div
          class="risk-badge"
          :style="{
            background: `linear-gradient(135deg, ${TravelRiskLevelColorMap[currentRiskLevel]} 0%, ${adjustColor(TravelRiskLevelColorMap[currentRiskLevel], -20)} 100%)`,
            boxShadow: `0 0 24px ${TravelRiskLevelColorMap[currentRiskLevel]}66`
          }"
        >
          <div class="risk-badge-icon">
            <el-icon>
              <component :is="getRiskLevelIcon(currentRiskLevel)" />
            </el-icon>
          </div>
          <div class="risk-badge-text">
            <span class="risk-level-label">风险等级</span>
            <span class="risk-level-value">{{ TravelRiskLevelMap[currentRiskLevel] }}</span>
          </div>
        </div>
      </div>

      <div class="risk-score-section">
        <svg viewBox="0 0 200 200" class="gauge-svg">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :style="{ stopColor: getScoreGradientColor(0) }" />
              <stop offset="50%" :style="{ stopColor: getScoreGradientColor(50) }" />
              <stop offset="100%" :style="{ stopColor: getScoreGradientColor(100) }" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#ebeef5"
            stroke-width="14"
          />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="url(#scoreGradient)"
            stroke-width="14"
            stroke-linecap="round"
            :stroke-dasharray="`${currentRiskScore / 100 * 502.65} 502.65`"
            transform="rotate(-90 100 100)"
            filter="url(#glow)"
            class="score-progress"
          />
          <text x="100" y="85" text-anchor="middle" class="score-value" :fill="getScoreColor(currentRiskScore)">
            {{ currentRiskScore }}
          </text>
          <text x="100" y="110" text-anchor="middle" class="score-label">风险评分</text>
          <text x="100" y="130" text-anchor="middle" class="score-sub">满分 100</text>
        </svg>
      </div>

      <div class="restriction-section">
        <div class="restriction-card">
          <div class="restriction-card-header">
            <el-icon><Lock /></el-icon>
            <span>权益限制状态</span>
          </div>
          <div class="restriction-item">
            <div class="restriction-info">
              <span class="restriction-label">临时下单</span>
              <span class="restriction-desc">风险等级≥4时限制</span>
            </div>
            <el-tag
              :color="localPassengerInfo?.isOrderRestricted ? '#f56c6c' : '#67c23a'"
              effect="dark"
              size="small"
            >
              {{ localPassengerInfo?.isOrderRestricted ? '已限制' : '正常' }}
            </el-tag>
          </div>
          <div class="restriction-item">
            <div class="restriction-info">
              <span class="restriction-label">溢价减免</span>
              <span class="restriction-desc">风险等级≥3时限制</span>
            </div>
            <el-tag
              :color="localPassengerInfo?.isPremiumDiscountRestricted ? '#f56c6c' : '#67c23a'"
              effect="dark"
              size="small"
            >
              {{ localPassengerInfo?.isPremiumDiscountRestricted ? '已限制' : '正常' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="risk-indicators">
      <div class="indicator-card">
        <div class="indicator-icon cancel">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="indicator-content">
          <div class="indicator-header">
            <span class="indicator-label">取消率</span>
            <span class="indicator-value">{{ (localPassengerInfo?.cancelRate || 0).toFixed(1) }}%</span>
          </div>
          <el-progress
            :percentage="localPassengerInfo?.cancelRate || 0"
            :stroke-width="8"
            :color="getCancelRateColor(localPassengerInfo?.cancelRate || 0)"
            show-text="false"
          />
        </div>
      </div>

      <div class="indicator-card">
        <div class="indicator-icon late">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="indicator-content">
          <div class="indicator-header">
            <span class="indicator-label">迟到次数</span>
            <span class="indicator-value">{{ localPassengerInfo?.lateCount || 0 }} 次</span>
          </div>
          <div class="indicator-bar-bg">
            <div
              class="indicator-bar"
              :style="{
                width: `${Math.min((localPassengerInfo?.lateCount || 0) / 10 * 100, 100)}%`,
                background: (localPassengerInfo?.lateCount || 0) >= 5 ? '#f56c6c' : '#e6a23c'
              }"
            />
          </div>
        </div>
      </div>

      <div class="indicator-card">
        <div class="indicator-icon complaint">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="indicator-content">
          <div class="indicator-header">
            <span class="indicator-label">恶意投诉</span>
            <span class="indicator-value">{{ localPassengerInfo?.maliciousComplaintCount || 0 }} 次</span>
          </div>
          <div class="indicator-bar-bg">
            <div
              class="indicator-bar"
              :style="{
                width: `${Math.min((localPassengerInfo?.maliciousComplaintCount || 0) / 5 * 100, 100)}%`,
                background: (localPassengerInfo?.maliciousComplaintCount || 0) >= 3 ? '#f56c6c' : '#9c27b0'
              }"
            />
          </div>
        </div>
      </div>

      <div class="indicator-card">
        <div class="indicator-icon orders">
          <el-icon><Document /></el-icon>
        </div>
        <div class="indicator-content">
          <div class="indicator-header">
            <span class="indicator-label">近30天订单</span>
            <span class="indicator-value">{{ localPassengerInfo?.totalOrders || 0 }} 单</span>
          </div>
          <div class="indicator-bar-bg">
            <div
              class="indicator-bar success"
              :style="{ width: `${Math.min((localPassengerInfo?.totalOrders || 0) / 100 * 100, 100)}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="recalculate-section">
      <el-button type="primary" size="large" :loading="calculating" @click="calculateRisk">
        <el-icon><Refresh /></el-icon>
        重新计算风险等级
      </el-button>
    </div>

    <div class="benefits-info">
      <el-alert type="info" show-icon :closable="false" title="权益联动规则说明">
        <template #default>
          <div class="benefits-rules">
            <div class="rule-item">
              <el-tag color="#67c23a" effect="dark" size="small">等级 1-2</el-tag>
              <span>正常/关注：所有权益正常使用</span>
            </div>
            <div class="rule-item">
              <el-tag color="#e6a23c" effect="dark" size="small">等级 3</el-tag>
              <span>警告：限制溢价减免权益</span>
            </div>
            <div class="rule-item">
              <el-tag color="#f56c6c" effect="dark" size="small">等级 4-5</el-tag>
              <span>限制/封禁：限制临时下单 + 溢价减免权益</span>
            </div>
            <div class="rule-item">
              <el-tag color="#409eff" effect="dark" size="small">解除条件</el-tag>
              <span>持续良好出行行为，风险等级自动下降后恢复对应权益</span>
            </div>
          </div>
        </template>
      </el-alert>
    </div>

    <div class="risk-records-section">
      <div class="records-header">
        <h4>
          <el-icon><List /></el-icon>
          风险记录列表
        </h4>
      </div>

      <div class="filter-section">
        <div class="filter-item">
          <span class="filter-label">风险类型：</span>
          <el-select
            v-model="filters.riskType"
            placeholder="全部类型"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="(label, value) in TravelRiskTypeMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">风险等级：</span>
          <el-select
            v-model="filters.severity"
            placeholder="全部等级"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="(label, value) in RiskSeverityLevelMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">状态：</span>
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="(label, value) in TravelRiskStatusMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </div>

      <div v-loading="tableLoading" class="table-container">
        <el-table :data="riskRecords" border stripe style="width: 100%">
          <el-table-column label="风险类型" width="120">
            <template #default="{ row }">
              <el-tag
                :color="TravelRiskTypeColorMap[row.riskType]"
                effect="dark"
                size="small"
              >
                {{ TravelRiskTypeMap[row.riskType] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag
                :color="RiskSeverityLevelColorMap[row.riskLevel]"
                effect="dark"
                size="small"
              >
                {{ RiskSeverityLevelMap[row.riskLevel] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="orderNo" label="关联订单号" width="180">
            <template #default="{ row }">
              <span v-if="row.orderNo" class="order-no">{{ row.orderNo }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="是否拦截" width="100" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.isBlocked" class="text-danger">
                <CircleClose />
              </el-icon>
              <el-icon v-else class="text-success">
                <CircleCheck />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :color="TravelRiskStatusColorMap[row.status]"
                effect="dark"
                size="small"
              >
                {{ TravelRiskStatusMap[row.status] || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Search,
  RefreshLeft,
  Document,
  Clock,
  Warning,
  CircleClose,
  CircleCheck,
  Lock,
  List,
  Shield,
  View,
  WarningFilled,
  Lock as LockIcon,
  CloseBold
} from '@element-plus/icons-vue'
import { calculateTravelRiskApi, getTravelRiskListApi } from '@/api/passenger'
import {
  TravelRiskLevelMap,
  TravelRiskLevelColorMap,
  TravelRiskTypeMap,
  TravelRiskTypeColorMap,
  RiskSeverityLevelMap,
  RiskSeverityLevelColorMap,
  TravelRiskStatusMap,
  TravelRiskStatusColorMap,
  TravelRiskLevel
} from '@/enums/passenger'
import { formatDate } from '@/utils/format'
import type { Passenger, PassengerTravelRisk, TravelRiskCalcResult } from '@/types/passenger'

interface Props {
  passengerId: number
  passengerInfo: Passenger
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'refresh-passenger': []
}>()

const calculating = ref(false)
const tableLoading = ref(false)
const riskRecords = ref<PassengerTravelRisk[]>([])
const localPassengerInfo = ref<Passenger | null>(props.passengerInfo)

const currentRiskLevel = computed(() => localPassengerInfo.value?.travelRiskLevel || TravelRiskLevel.NORMAL)
const currentRiskScore = computed(() => localPassengerInfo.value?.travelRiskScore || 0)

const filters = reactive({
  riskType: null as number | null,
  severity: null as number | null,
  status: null as number | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getRiskLevelIcon = (level: number) => {
  switch (level) {
    case TravelRiskLevel.NORMAL:
      return Shield
    case TravelRiskLevel.WATCH:
      return View
    case TravelRiskLevel.WARNING:
      return WarningFilled
    case TravelRiskLevel.RESTRICT:
      return LockIcon
    case TravelRiskLevel.BANNED:
      return CloseBold
    default:
      return Shield
  }
}

const adjustColor = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount))
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const getScoreColor = (score: number): string => {
  if (score < 30) return '#67c23a'
  if (score < 60) return '#e6a23c'
  if (score < 80) return '#f56c6c'
  return '#9c27b0'
}

const getScoreGradientColor = (percent: number): string => {
  if (percent < 30) return '#67c23a'
  if (percent < 60) return '#e6a23c'
  if (percent < 80) return '#f56c6c'
  return '#9c27b0'
}

const getCancelRateColor = (rate: number): string => {
  if (rate < 10) return '#67c23a'
  if (rate < 25) return '#e6a23c'
  return '#f56c6c'
}

const buildQueryParams = (): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  if (filters.riskType !== null && filters.riskType !== undefined) {
    params.riskType = filters.riskType
  }
  if (filters.severity !== null && filters.severity !== undefined) {
    params.severity = filters.severity
  }
  if (filters.status !== null && filters.status !== undefined) {
    params.status = filters.status
  }
  return params
}

const loadRiskRecords = async () => {
  tableLoading.value = true
  try {
    const params = buildQueryParams()
    const res = await getTravelRiskListApi(props.passengerId, params)
    const list = res.data?.list || res.data?.records || res.data || []
    riskRecords.value = Array.isArray(list) ? list : []
    pagination.total = res.data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载风险记录失败')
    riskRecords.value = []
  } finally {
    tableLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadRiskRecords()
}

const handleReset = () => {
  filters.riskType = null
  filters.severity = null
  filters.status = null
  pagination.page = 1
  loadRiskRecords()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadRiskRecords()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadRiskRecords()
}

const calculateRisk = async () => {
  calculating.value = true
  try {
    const res = await calculateTravelRiskApi(props.passengerId)
    const result: TravelRiskCalcResult = res.data

    if (localPassengerInfo.value) {
      localPassengerInfo.value.travelRiskLevel = result.newRiskLevel
      localPassengerInfo.value.travelRiskScore = result.riskScore
      localPassengerInfo.value.cancelRate = result.cancelRate
      localPassengerInfo.value.maliciousComplaintCount = result.maliciousComplaints
      localPassengerInfo.value.isOrderRestricted = result.isOrderRestricted
      localPassengerInfo.value.isPremiumDiscountRestricted = result.isPremiumDiscountRestricted
    }

    const messages: string[] = []

    if (result.oldRiskLevel !== result.newRiskLevel) {
      const oldLevel = TravelRiskLevelMap[result.oldRiskLevel]
      const newLevel = TravelRiskLevelMap[result.newRiskLevel]
      const direction = result.newRiskLevel > result.oldRiskLevel ? '提升' : '降低'
      messages.push(`风险等级${direction}：${oldLevel} → ${newLevel}`)
    }

    if (result.restrictionsChanged && result.restrictionsChanged.length > 0) {
      messages.push(`权益变更：${result.restrictionsChanged.join('、')}`)
    }

    if (messages.length > 0) {
      ElMessage.success(messages.join(' | '))
    } else {
      ElMessage.success('风险等级计算完成，暂无变化')
    }

    loadRiskRecords()
    emit('refresh-passenger')
  } catch (error: any) {
    ElMessage.error(error.message || '计算风险等级失败')
  } finally {
    calculating.value = false
  }
}

watch(() => props.passengerInfo, (val) => {
  localPassengerInfo.value = val
}, { immediate: true, deep: true })

watch(() => props.passengerId, () => {
  pagination.page = 1
  loadRiskRecords()
}, { immediate: false })

onMounted(() => {
  loadRiskRecords()
})

defineExpose({
  calculateRisk
})
</script>

<style lang="scss" scoped>
.passenger-travel-risk {
  .risk-overview {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  .risk-level-section {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .risk-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 32px;
    border-radius: 16px;
    color: #fff;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }

    .risk-badge-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }

    .risk-badge-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .risk-level-label {
        font-size: 13px;
        opacity: 0.9;
      }

      .risk-level-value {
        font-size: 26px;
        font-weight: 700;
      }
    }
  }

  .risk-score-section {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border-radius: 16px;
    padding: 16px;

    .gauge-svg {
      width: 200px;
      height: 200px;

      .score-progress {
        transition: stroke-dasharray 0.8s ease;
      }

      .score-value {
        font-size: 42px;
        font-weight: 700;
      }

      .score-label {
        font-size: 14px;
        fill: #909399;
      }

      .score-sub {
        font-size: 11px;
        fill: #c0c4cc;
      }
    }
  }

  .restriction-section {
    .restriction-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border-radius: 16px;
      padding: 24px;
      height: 100%;

      .restriction-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 20px;

        .el-icon {
          color: #409eff;
          font-size: 18px;
        }
      }

      .restriction-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .restriction-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .restriction-label {
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }

          .restriction-desc {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .risk-indicators {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .indicator-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #ebeef5;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .indicator-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;
        flex-shrink: 0;

        &.cancel {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }

        &.late {
          background: linear-gradient(135deg, #e6a23c, #f0c78a);
        }

        &.complaint {
          background: linear-gradient(135deg, #9c27b0, #ba68c8);
        }

        &.orders {
          background: linear-gradient(135deg, #409eff, #64b5f6);
        }
      }

      .indicator-content {
        flex: 1;
        min-width: 0;

        .indicator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .indicator-label {
            font-size: 13px;
            color: #909399;
          }

          .indicator-value {
            font-size: 18px;
            font-weight: 700;
            color: #303133;
          }
        }

        .indicator-bar-bg {
          height: 6px;
          background: #ebeef5;
          border-radius: 3px;
          overflow: hidden;

          .indicator-bar {
            height: 100%;
            border-radius: 3px;
            transition: width 0.6s ease;

            &.success {
              background: #67c23a;
            }
          }
        }
      }
    }
  }

  .recalculate-section {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;

    .el-button {
      padding: 12px 32px;
      font-size: 15px;
    }
  }

  .benefits-info {
    margin-bottom: 24px;

    .benefits-rules {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;

      .rule-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .risk-records-section {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #ebeef5;

    .records-header {
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          color: #409eff;
        }
      }
    }

    .filter-section {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 16px;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .filter-label {
          font-size: 13px;
          color: #606266;
          white-space: nowrap;
        }

        .filter-select {
          width: 140px;
        }
      }

      .filter-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
    }

    .table-container {
      .order-no {
        font-family: 'Courier New', monospace;
        color: #606266;
      }

      .text-muted {
        color: #c0c4cc;
      }

      .text-success {
        color: #67c23a;
        font-size: 18px;
      }

      .text-danger {
        color: #f56c6c;
        font-size: 18px;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}

@media (max-width: 1200px) {
  .passenger-travel-risk {
    .risk-overview {
      grid-template-columns: 1fr;
    }

    .risk-indicators {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 600px) {
  .passenger-travel-risk {
    .risk-indicators {
      grid-template-columns: 1fr;
    }
  }
}
</style>
