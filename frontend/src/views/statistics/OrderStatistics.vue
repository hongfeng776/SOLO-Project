<template>
  <div class="order-statistics-page">
    <div class="page-header">
      <h2>
        <el-icon><DataLine /></el-icon>
        订单数据统计
      </h2>
      <p class="page-desc">多维度订单数据分析与导出，支持周期筛选、自定义条件过滤</p>
    </div>

    <el-tabs v-model="period" class="period-tabs" @tab-change="handlePeriodChange">
      <el-tab-pane :label="StatsPeriodEnum.DAY.label" :name="StatsPeriodEnum.DAY.value" />
      <el-tab-pane :label="StatsPeriodEnum.WEEK.label" :name="StatsPeriodEnum.WEEK.value" />
      <el-tab-pane :label="StatsPeriodEnum.MONTH.label" :name="StatsPeriodEnum.MONTH.value" />
      <el-tab-pane :label="StatsPeriodEnum.CUSTOM.label" :name="StatsPeriodEnum.CUSTOM.value" />
    </el-tabs>

    <div v-if="period === StatsPeriodEnum.CUSTOM.value" class="custom-date-range" :class="customDateError ? 'stats-filter-shake' : ''">
      <el-icon style="color: #1890ff"><Calendar /></el-icon>
      <span style="font-size: 13px; color: #666;">选择自定义周期：</span>
      <el-date-picker
        v-model="customDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        class="stats-filter-hover"
        :class="customDateError ? 'stats-filter-shake' : ''"
        @change="handleCustomDateChange"
      />
      <el-button type="primary" size="small" @click="applyCustomDate">应用</el-button>
    </div>

    <el-row :gutter="20" class="stats-cards-row">
      <el-col :span="6" v-for="card in statCards" :key="card.key + '_' + cardRefreshKey[card.key]">
        <div class="stats-card-item">
          <div class="stat-card stats-card-float">
            <el-icon class="stat-icon" :style="{ color: card.color }">
              <component :is="card.icon" />
            </el-icon>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value stats-number-format">
              <span :style="{ color: card.color }">{{ card.formatter(card.value) }}</span>
              <span class="stat-unit">{{ card.unit }}</span>
            </div>
            <div class="stat-trend" :class="card.trend >= 0 ? 'up' : 'down'">
              <el-icon v-if="card.trend >= 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              <span>{{ Math.abs(card.trend) }}% 较上周期</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="dimension-switch stats-dim-switch">
      <div class="dimension-label">
        <el-icon><TrendCharts /></el-icon>
        统计维度
      </div>
      <el-radio-group v-model="dimension" @change="handleDimensionChange">
        <el-radio-button v-for="dim in Object.values(StatsDimensionEnum)" :key="dim.value" :value="dim.value">
          {{ dim.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16" class="chart-col">
        <div class="chart-card stats-panel-slide">
          <div class="chart-header">
            <h3 class="chart-title">
              <el-icon><TrendCharts /></el-icon>
              {{ trendChartTitle }}
            </h3>
            <div class="chart-legend">
              <div v-for="ds in trendDatasets" :key="ds.label" class="legend-item">
                <span class="legend-dot" :style="{ backgroundColor: ds.color }"></span>
                {{ ds.label }}
              </div>
            </div>
          </div>
          <LineChart :labels="trendLabels" :datasets="trendDatasets" :height="320" />
        </div>
      </el-col>
      <el-col :span="8" class="chart-col">
        <div class="chart-card stats-panel-slide slide-left">
          <div class="chart-header">
            <h3 class="chart-title">
              <el-icon><PieChartIcon /></el-icon>
              {{ pieChartTitle }}
            </h3>
          </div>
          <PieChart :data="pieData" :height="320" />
        </div>
      </el-col>
    </el-row>

    <el-collapse v-model="filterCollapse" class="filter-panel">
      <el-collapse-item name="filter">
        <template #title>
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon><CollectionTag /></el-icon>
            筛选条件
            <el-tag v-if="activeFilterCount > 0" type="primary" size="small" effect="dark">{{ activeFilterCount }}</el-tag>
          </div>
        </template>
        <div class="filter-content stats-panel-slide">
          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="订单状态" class="filter-form-item">
              <el-select
                v-model="filterForm.status"
                placeholder="全部状态"
                clearable
                multiple
                collapse-tags
                class="stats-filter-hover"
                :class="fieldErrors.status ? 'stats-filter-shake' : ''"
                style="width: 220px"
              >
                <el-option v-for="item in getEnumOptions(OrderStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="用户等级" class="filter-form-item">
              <el-select
                v-model="filterForm.userLevel"
                placeholder="全部等级"
                clearable
                multiple
                collapse-tags
                class="stats-filter-hover"
                :class="fieldErrors.userLevel ? 'stats-filter-shake' : ''"
                style="width: 200px"
              >
                <el-option v-for="item in getEnumOptions(UserLevelEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="商家类型" class="filter-form-item" :class="{ 'has-permission-issue': !isAdmin }">
              <div :class="{ 'stats-data-hidden': !isAdmin }" style="position: relative;">
                <el-tooltip v-if="!isAdmin" content="权限不足，仅管理员可查看" placement="top">
                  <el-select
                    v-model="filterForm.merchantType"
                    placeholder="全部类型"
                    clearable
                    multiple
                    collapse-tags
                    disabled
                    style="width: 200px"
                  >
                    <el-option v-for="item in getEnumOptions(MerchantTypeEnum)" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-tooltip>
                <el-select
                  v-else
                  v-model="filterForm.merchantType"
                  placeholder="全部类型"
                  clearable
                  multiple
                  collapse-tags
                  class="stats-filter-hover"
                  :class="fieldErrors.merchantType ? 'stats-filter-shake' : ''"
                  style="width: 200px"
                >
                  <el-option v-for="item in getEnumOptions(MerchantTypeEnum)" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
            </el-form-item>

            <el-form-item label="支付渠道" class="filter-form-item">
              <el-select
                v-model="filterForm.paymentChannel"
                placeholder="全部渠道"
                clearable
                multiple
                collapse-tags
                class="stats-filter-hover"
                :class="fieldErrors.paymentChannel ? 'stats-filter-shake' : ''"
                style="width: 200px"
              >
                <el-option v-for="item in getEnumOptions(PaymentChannelEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="订单品类" class="filter-form-item">
              <el-select
                v-model="filterForm.category"
                placeholder="全部品类"
                clearable
                multiple
                collapse-tags
                class="stats-filter-hover"
                :class="fieldErrors.category ? 'stats-filter-shake' : ''"
                style="width: 180px"
              >
                <el-option v-for="item in getEnumOptions(TravelCategoryEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="金额区间" class="filter-form-item">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-input-number
                  v-model="filterForm.minAmount"
                  :min="0"
                  :precision="2"
                  placeholder="最低"
                  controls-position="right"
                  style="width: 110px"
                  class="stats-filter-hover"
                  :class="fieldErrors.amountRange ? 'stats-filter-shake' : ''"
                />
                <span style="color: #999;">-</span>
                <el-input-number
                  v-model="filterForm.maxAmount"
                  :min="0"
                  :precision="2"
                  placeholder="最高"
                  controls-position="right"
                  style="width: 110px"
                  class="stats-filter-hover"
                  :class="fieldErrors.amountRange ? 'stats-filter-shake' : ''"
                />
              </div>
            </el-form-item>

            <el-form-item label="下单日期" class="filter-form-item">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD"
                class="stats-filter-hover"
                style="width: 260px"
              />
            </el-form-item>
          </el-form>
          <div class="filter-actions">
            <el-button @click="resetFilter">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
            <el-button type="primary" @click="applyFilter">
              <el-icon><Search /></el-icon>
              应用筛选
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <div class="result-table-container">
      <div class="stats-tags-sticky filter-tags-bar" v-if="activeFilterTags.length > 0">
        <span class="tags-label">
          <el-icon><CollectionTag /></el-icon>
          已选条件：
        </span>
        <el-tag
          v-for="tag in activeFilterTags"
          :key="tag.key"
          :type="tag.type || 'info'"
          closable
          size="small"
          @close="removeFilterTag(tag.key)"
        >
          {{ tag.label }}
        </el-tag>
        <el-button link type="danger" size="small" class="clear-all-btn" @click="resetFilter">清空全部</el-button>
      </div>

      <div class="table-header">
        <div class="table-title">
          <el-icon><List /></el-icon>
          筛选结果
          <span class="total-count">(共 {{ pagination.total }} 条)</span>
        </div>
        <div class="export-btn-wrap">
          <el-button
            type="primary"
            :icon="Download"
            :loading="exportStatus === ExportStatusEnum.PROCESSING.value"
            class="stats-export-progress"
            :disabled="pagination.total === 0 || exportStatus === ExportStatusEnum.PROCESSING.value"
            @click="handleExport"
          >
            <div class="progress-fill-inside" :style="{ width: exportProgress + '%' }" v-if="exportStatus === ExportStatusEnum.PROCESSING.value"></div>
            {{ exportBtnText }}
            <span v-if="exportStatus === ExportStatusEnum.PROCESSING.value" class="export-progress-text">{{ exportProgress }}%</span>
          </el-button>
          <span v-if="exportStatus === ExportStatusEnum.SUCCESS.value" class="stats-export-success">
            <el-icon><CircleCheckFilled /></el-icon>
            导出成功
          </span>
        </div>
      </div>

      <el-table
        :data="pagedTableData"
        stripe
        border
        v-loading="tableLoading"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="orderNo" label="订单号" min-width="160">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="品类" width="90">
          <template #default="{ row }">{{ getEnumLabel(TravelCategoryEnum, row.category) }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="buyer" label="购买人" width="100" />
        <el-table-column prop="userLevel" label="用户等级" width="90">
          <template #default="{ row }">
            <el-tag
              v-if="row.userLevel"
              size="small"
              effect="plain"
              :style="{ borderColor: getEnumColor(UserLevelEnum, row.userLevel), color: getEnumColor(UserLevelEnum, row.userLevel) }"
            >
              {{ getEnumLabel(UserLevelEnum, row.userLevel) }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentChannel" label="支付渠道" width="110">
          <template #default="{ row }">
            <span v-if="row.paymentChannel">{{ getEnumLabel(PaymentChannelEnum, row.paymentChannel) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :style="{ background: getEnumColor(OrderStatusEnum, row.status), borderColor: getEnumColor(OrderStatusEnum, row.status) }"
              effect="dark"
              size="small"
            >
              {{ getEnumLabel(OrderStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="170" />
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataLine, Calendar, Top, Bottom,
  TrendCharts, PieChart as PieChartIcon, CollectionTag,
  RefreshLeft, Search, List, Download, CircleCheckFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import {
  getOrderStatistics,
  filterOrders,
  exportOrders
} from '@/api/statistics'
import {
  StatsPeriodEnum,
  StatsDimensionEnum,
  UserLevelEnum,
  MerchantTypeEnum,
  ExportStatusEnum,
  OrderStatusEnum,
  TravelCategoryEnum,
  PaymentChannelEnum,
  getEnumLabel,
  getEnumOptions,
  getEnumColor
} from '@/utils/enums'
import {
  formatThousand,
  formatPercent,
  formatCurrency,
  generateExportFilename
} from '@/utils/format'
import LineChart from '@/components/Charts/LineChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.roles.includes('admin'))

const period = ref(StatsPeriodEnum.DAY.value)
const dimension = ref(StatsDimensionEnum.OVERVIEW.value)
const customDateRange = ref([])
const customDateError = ref(false)
const filterCollapse = ref(['filter'])

const cacheMap = new Map()
const CACHE_TTL = 5 * 60 * 1000

const getCacheKey = (prefix, params) => {
  return `${prefix}_${JSON.stringify(params)}`
}

const setCache = (key, data) => {
  cacheMap.set(key, {
    data,
    timestamp: Date.now()
  })
}

const getCache = (key) => {
  const cached = cacheMap.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cacheMap.delete(key)
    return null
  }
  return cached.data
}

const fieldErrors = reactive({
  status: false,
  userLevel: false,
  merchantType: false,
  paymentChannel: false,
  category: false,
  amountRange: false
})

const triggerFieldError = (field) => {
  fieldErrors[field] = true
  setTimeout(() => {
    fieldErrors[field] = false
  }, 600)
}

const filterForm = reactive({
  status: [],
  userLevel: [],
  merchantType: [],
  paymentChannel: [],
  category: [],
  minAmount: null,
  maxAmount: null,
  dateRange: []
})

const cardRefreshKey = reactive({
  totalOrders: 0,
  totalAmount: 0,
  refundRate: 0,
  fulfillmentRate: 0
})

const refreshCardKey = (key) => {
  cardRefreshKey[key] = Date.now()
}

const statCards = reactive([
  { key: 'totalOrders', label: '订单总量', value: 0, unit: '单', trend: 12.5, color: '#1890ff', icon: 'List', formatter: formatThousand },
  { key: 'totalAmount', label: '成交金额', value: 0, unit: '', trend: 8.3, color: '#52c41a', icon: 'Wallet', formatter: formatCurrency },
  { key: 'refundRate', label: '退款率', value: 0, unit: '', trend: -2.1, color: '#ff4d4f', icon: 'Warning', formatter: (v) => formatPercent(v, 1) },
  { key: 'fulfillmentRate', label: '履约率', value: 0, unit: '', trend: 3.5, color: '#722ed1', icon: 'CircleCheck', formatter: (v) => formatPercent(v, 1) }
])

const trendLabels = ref([])
const trendDatasets = ref([])
const pieData = ref([])

const trendChartTitle = computed(() => {
  const titles = {
    [StatsDimensionEnum.OVERVIEW.value]: '订单量与金额趋势',
    [StatsDimensionEnum.CATEGORY.value]: '各品类订单趋势',
    [StatsDimensionEnum.PAYMENT.value]: '各支付渠道趋势',
    [StatsDimensionEnum.STATUS.value]: '各状态订单趋势'
  }
  return titles[dimension.value] || '趋势图'
})

const pieChartTitle = computed(() => {
  const titles = {
    [StatsDimensionEnum.OVERVIEW.value]: '订单品类分布',
    [StatsDimensionEnum.CATEGORY.value]: '品类订单占比',
    [StatsDimensionEnum.PAYMENT.value]: '支付渠道占比',
    [StatsDimensionEnum.STATUS.value]: '订单状态分布'
  }
  return titles[dimension.value] || '分布图'
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filterForm.status.length > 0) count++
  if (filterForm.userLevel.length > 0) count++
  if (filterForm.merchantType.length > 0) count++
  if (filterForm.paymentChannel.length > 0) count++
  if (filterForm.category.length > 0) count++
  if (filterForm.minAmount !== null || filterForm.maxAmount !== null) count++
  if (filterForm.dateRange.length > 0) count++
  return count
})

const activeFilterTags = computed(() => {
  const tags = []
  if (filterForm.status.length > 0) {
    tags.push({
      key: 'status',
      label: `状态：${filterForm.status.map(v => getEnumLabel(OrderStatusEnum, v)).join('、')}`,
      type: 'primary'
    })
  }
  if (filterForm.userLevel.length > 0) {
    tags.push({
      key: 'userLevel',
      label: `用户等级：${filterForm.userLevel.map(v => getEnumLabel(UserLevelEnum, v)).join('、')}`
    })
  }
  if (filterForm.merchantType.length > 0) {
    tags.push({
      key: 'merchantType',
      label: `商家类型：${filterForm.merchantType.map(v => getEnumLabel(MerchantTypeEnum, v)).join('、')}`
    })
  }
  if (filterForm.paymentChannel.length > 0) {
    tags.push({
      key: 'paymentChannel',
      label: `支付渠道：${filterForm.paymentChannel.map(v => getEnumLabel(PaymentChannelEnum, v)).join('、')}`
    })
  }
  if (filterForm.category.length > 0) {
    tags.push({
      key: 'category',
      label: `品类：${filterForm.category.map(v => getEnumLabel(TravelCategoryEnum, v)).join('、')}`
    })
  }
  if (filterForm.minAmount !== null || filterForm.maxAmount !== null) {
    const min = filterForm.minAmount ?? 0
    const max = filterForm.maxAmount ?? '不限'
    tags.push({
      key: 'amountRange',
      label: `金额：¥${min} - ${max === '不限' ? max : '¥' + max}`,
      type: 'warning'
    })
  }
  if (filterForm.dateRange.length > 0) {
    tags.push({
      key: 'dateRange',
      label: `日期：${filterForm.dateRange[0]} 至 ${filterForm.dateRange[1]}`,
      type: 'success'
    })
  }
  return tags
})

const removeFilterTag = (key) => {
  if (key === 'status') filterForm.status = []
  else if (key === 'userLevel') filterForm.userLevel = []
  else if (key === 'merchantType') filterForm.merchantType = []
  else if (key === 'paymentChannel') filterForm.paymentChannel = []
  else if (key === 'category') filterForm.category = []
  else if (key === 'amountRange') {
    filterForm.minAmount = null
    filterForm.maxAmount = null
  } else if (key === 'dateRange') filterForm.dateRange = []
  fetchTableData()
}

const tableLoading = ref(false)
const rawTableData = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const pagedTableData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return rawTableData.value.slice(start, end)
})

const handlePageChange = () => {
}

const exportStatus = ref(ExportStatusEnum.IDLE.value)
const exportProgress = ref(0)
let exportTimer = null

const exportBtnText = computed(() => {
  const map = {
    [ExportStatusEnum.IDLE.value]: '导出数据',
    [ExportStatusEnum.PROCESSING.value]: '正在导出',
    [ExportStatusEnum.SUCCESS.value]: '已导出',
    [ExportStatusEnum.FAILED.value]: '导出失败'
  }
  return map[exportStatus.value]
})

const mockTrendData = () => {
  let labels = []
  if (period.value === StatsPeriodEnum.DAY.value) {
    labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
  } else if (period.value === StatsPeriodEnum.WEEK.value) {
    labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  } else if (period.value === StatsPeriodEnum.MONTH.value) {
    labels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  } else {
    const len = Math.min(7, customDateRange.value.length || 7)
    labels = Array.from({ length: len }, (_, i) => `D${i + 1}`)
  }

  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96']
  let datasets = []

  if (dimension.value === StatsDimensionEnum.OVERVIEW.value) {
    datasets = [
      {
        label: '订单量',
        color: colors[0],
        data: labels.map(() => Math.floor(Math.random() * 500) + 100)
      },
      {
        label: '金额(百)',
        color: colors[1],
        data: labels.map(() => Math.floor(Math.random() * 800) + 200)
      }
    ]
  } else if (dimension.value === StatsDimensionEnum.CATEGORY.value) {
    const categories = ['机票', '酒店', '租车', '文旅']
    datasets = categories.map((name, i) => ({
      label: name,
      color: colors[i],
      data: labels.map(() => Math.floor(Math.random() * 200) + 50)
    }))
  } else if (dimension.value === StatsDimensionEnum.PAYMENT.value) {
    const channels = ['微信', '支付宝', '银联', '余额']
    datasets = channels.map((name, i) => ({
      label: name,
      color: colors[i],
      data: labels.map(() => Math.floor(Math.random() * 300) + 50)
    }))
  } else if (dimension.value === StatsDimensionEnum.STATUS.value) {
    const statuses = ['已完成', '已支付', '待支付', '退款']
    datasets = statuses.map((name, i) => ({
      label: name,
      color: colors[i],
      data: labels.map(() => Math.floor(Math.random() * 200) + 30)
    }))
  }

  trendLabels.value = labels
  trendDatasets.value = datasets
}

const mockPieData = () => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2']
  let data = []

  if (dimension.value === StatsDimensionEnum.OVERVIEW.value || dimension.value === StatsDimensionEnum.CATEGORY.value) {
    data = [
      { name: '机票', value: 38, color: colors[0] },
      { name: '酒店', value: 28, color: colors[1] },
      { name: '租车', value: 18, color: colors[2] },
      { name: '文旅票务', value: 16, color: colors[3] }
    ]
  } else if (dimension.value === StatsDimensionEnum.PAYMENT.value) {
    data = [
      { name: '微信支付', value: 42, color: colors[0] },
      { name: '支付宝', value: 32, color: colors[1] },
      { name: '银联支付', value: 14, color: colors[2] },
      { name: '余额支付', value: 8, color: colors[3] },
      { name: '信用卡', value: 4, color: colors[4] }
    ]
  } else if (dimension.value === StatsDimensionEnum.STATUS.value) {
    data = [
      { name: '已完成', value: 48, color: colors[1] },
      { name: '已支付', value: 22, color: colors[0] },
      { name: '待支付', value: 12, color: colors[2] },
      { name: '退款中', value: 8, color: colors[4] },
      { name: '已退款', value: 6, color: colors[3] },
      { name: '已取消', value: 4, color: '#909399' }
    ]
  }

  pieData.value = data
}

const mockStatCards = () => {
  statCards[0].value = Math.floor(Math.random() * 5000) + 1000
  statCards[1].value = Math.random() * 500000 + 100000
  statCards[2].value = Math.random() * 10
  statCards[3].value = 85 + Math.random() * 10
  statCards[0].trend = (Math.random() * 20 - 5).toFixed(1)
  statCards[1].trend = (Math.random() * 20 - 5).toFixed(1)
  statCards[2].trend = (Math.random() * 10 - 5).toFixed(1)
  statCards[3].trend = (Math.random() * 10 - 2).toFixed(1)

  Object.keys(cardRefreshKey).forEach(key => refreshCardKey(key))
}

const mockTableData = () => {
  const buyers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
  const products = [
    '北京-上海 经济舱 往返机票',
    '希尔顿酒店 豪华大床房 含双早',
    '丰田凯美瑞 舒适版 日租',
    '故宫博物院 成人门票',
    '上海-深圳 商务舱 单程机票',
    '万豪酒店 行政套房 含双早',
    '宝马5系 豪华版 日租'
  ]
  const channels = ['wechat', 'alipay', 'unionpay', 'credit_card', 'balance', null]
  const data = []
  const statuses = [1, 2, 3, 4, 5, 6]
  const categories = [1, 2, 3, 4]
  const userLevels = [1, 2, 3, 4, 5]

  for (let i = 1; i <= 68; i++) {
    const now = new Date()
    now.setHours(now.getHours() - i * 2)
    data.push({
      id: i,
      orderNo: `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(i).padStart(4, '0')}`,
      category: categories[i % categories.length],
      productName: products[i % products.length],
      buyer: buyers[i % buyers.length],
      userLevel: userLevels[i % userLevels.length],
      paymentChannel: channels[i % channels.length],
      amount: Math.floor(Math.random() * 5000) + 100,
      status: statuses[i % statuses.length],
      createTime: now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    })
  }
  return data
}

const fetchStatistics = async () => {
  const params = { period: period.value, dimension: dimension.value, customDateRange: customDateRange.value }
  const cacheKey = getCacheKey('stats', params)
  const cached = getCache(cacheKey)

  if (cached) {
    statCards[0].value = cached.totalOrders
    statCards[1].value = cached.totalSales
    statCards[2].value = cached.refundRate
    statCards[3].value = cached.fulfillRate
    Object.keys(cardRefreshKey).forEach(key => refreshCardKey(key))
    return
  }

  try {
    const res = await getOrderStatistics(params)
    const data = res.data

    statCards[0].value = data.totalOrders
    statCards[1].value = data.totalSales
    statCards[2].value = data.refundRate
    statCards[3].value = data.fulfillRate

    Object.keys(cardRefreshKey).forEach(key => refreshCardKey(key))

    setCache(cacheKey, {
      totalOrders: data.totalOrders,
      totalSales: data.totalSales,
      refundRate: data.refundRate,
      fulfillRate: data.fulfillRate
    })
  } catch (err) {
    statCards[0].value = 0
    statCards[1].value = 0
    statCards[2].value = '0.00'
    statCards[3].value = '0.00'
    ElMessage.error('统计数据加载失败')
  }
}

const fetchTableData = async () => {
  const params = { ...filterForm, period: period.value }
  const cacheKey = getCacheKey('filter', params)
  const cached = getCache(cacheKey)

  tableLoading.value = true

  if (cached) {
    setTimeout(() => {
      rawTableData.value = cached
      pagination.total = cached.length
      tableLoading.value = false
    }, 200)
    return
  }

  try {
    await filterOrders(params)
    setTimeout(() => {
      const data = mockTableData()
      rawTableData.value = data
      pagination.total = data.length
      tableLoading.value = false
      setCache(cacheKey, data)
    }, 400)
  } catch (err) {
    setTimeout(() => {
      const data = mockTableData()
      rawTableData.value = data
      pagination.total = data.length
      tableLoading.value = false
    }, 400)
  }
}

const handlePeriodChange = () => {
  if (period.value === StatsPeriodEnum.CUSTOM.value && customDateRange.value.length === 0) {
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    customDateRange.value = [
      weekAgo.toISOString().slice(0, 10),
      today.toISOString().slice(0, 10)
    ]
  }
  fetchStatistics()
  mockTrendData()
  mockPieData()
  fetchTableData()
}

const handleDimensionChange = () => {
  mockTrendData()
  mockPieData()
}

const handleCustomDateChange = () => {
  customDateError.value = false
}

const applyCustomDate = () => {
  if (!customDateRange.value || customDateRange.value.length !== 2) {
    customDateError.value = true
    setTimeout(() => { customDateError.value = false }, 600)
    ElMessage.warning('请选择完整的日期范围')
    return
  }
  fetchStatistics()
  mockTrendData()
  mockPieData()
  fetchTableData()
  ElMessage.success('自定义周期已应用')
}

const validateFilter = () => {
  let valid = true
  const errorMessages = []

  if (filterForm.status && filterForm.status.length > 0) {
    const validStatuses = [0, 1, 2, 3, 4, 5, 6]
    const invalid = filterForm.status.some((s) => !validStatuses.includes(Number(s)))
    if (invalid) {
      triggerFieldError('status')
      errorMessages.push('订单状态包含无效值')
      valid = false
    }
  }

  if (filterForm.userLevel && filterForm.userLevel.length > 0) {
    const validLevels = [1, 2, 3, 4, 5]
    const invalid = filterForm.userLevel.some((l) => !validLevels.includes(Number(l)))
    if (invalid) {
      triggerFieldError('userLevel')
      errorMessages.push('用户等级包含无效值')
      valid = false
    }
  }

  if (filterForm.merchantType && filterForm.merchantType.length > 0) {
    if (!isAdmin.value) {
      triggerFieldError('merchantType')
      errorMessages.push('您无权限按商家类型筛选')
      valid = false
    } else {
      const validTypes = [1, 2, 3, 4]
      const invalid = filterForm.merchantType.some((t) => !validTypes.includes(Number(t)))
      if (invalid) {
        triggerFieldError('merchantType')
        errorMessages.push('商家类型包含无效值')
        valid = false
      }
    }
  }

  if (filterForm.paymentChannel && filterForm.paymentChannel.length > 0) {
    const validChannels = ['wechat', 'alipay', 'unionpay', 'credit_card', 'balance']
    const invalid = filterForm.paymentChannel.some((c) => !validChannels.includes(c))
    if (invalid) {
      triggerFieldError('paymentChannel')
      errorMessages.push('支付渠道包含无效值')
      valid = false
    }
  }

  if (filterForm.category && filterForm.category.length > 0) {
    const validCategories = ['flight', 'hotel', 'car', 'ticket', 'business_travel']
    const invalid = filterForm.category.some((c) => !validCategories.includes(c))
    if (invalid) {
      triggerFieldError('category')
      errorMessages.push('品类包含无效值')
      valid = false
    }
  }

  if (filterForm.minAmount !== null && filterForm.maxAmount !== null) {
    if (filterForm.minAmount < 0) {
      triggerFieldError('amountRange')
      errorMessages.push('金额最小值不能为负数')
      valid = false
    } else if (filterForm.maxAmount < 0) {
      triggerFieldError('amountRange')
      errorMessages.push('金额最大值不能为负数')
      valid = false
    } else if (filterForm.minAmount > filterForm.maxAmount) {
      triggerFieldError('amountRange')
      errorMessages.push('金额区间最小值不能大于最大值')
      valid = false
    }
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const start = new Date(filterForm.dateRange[0])
    const end = new Date(filterForm.dateRange[1])
    if (start > end) {
      triggerFieldError('amountRange')
      errorMessages.push('开始日期不能晚于结束日期')
      valid = false
    }
  }

  if (!valid && errorMessages.length > 0) {
    ElMessage.warning(errorMessages[0])
  }

  return valid
}

const applyFilter = () => {
  if (!validateFilter()) {
    return
  }
  pagination.page = 1
  fetchTableData()
  ElMessage.success('筛选条件已应用')
}

const resetFilter = () => {
  filterForm.status = []
  filterForm.userLevel = []
  filterForm.merchantType = []
  filterForm.paymentChannel = []
  filterForm.category = []
  filterForm.minAmount = null
  filterForm.maxAmount = null
  filterForm.dateRange = []
  pagination.page = 1
  fetchTableData()
}

const handleExport = async () => {
  if (pagination.total === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  if (pagination.total > 10000) {
    ElMessage.warning(`导出数据量过大（${pagination.total}条），单次最多导出10000条，请缩小筛选范围`)
    return
  }

  exportStatus.value = ExportStatusEnum.PROCESSING.value
  exportProgress.value = 0

  exportTimer = setInterval(() => {
    if (exportProgress.value < 70) {
      exportProgress.value += Math.floor(Math.random() * 10) + 5
    }
  }, 200)

  try {
    const params = { ...filterForm, period: period.value, customDateRange: customDateRange.value }
    const response = await exportOrders(params)
    const blobData = response.data

    clearInterval(exportTimer)
    exportProgress.value = 100

    const disposition = response.headers['content-disposition']
    let filename = disposition
      ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, '') || '')
      : generateExportFilename(period.value)

    if (!filename) {
      filename = generateExportFilename(period.value)
    }

    const total = response.headers['x-total-count']
    const abnormal = response.headers['x-abnormal-count']
    const exported = response.headers['x-exported-count']

    const blob = new Blob([blobData], { type: 'text/csv; charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

      setTimeout(() => {
        exportStatus.value = ExportStatusEnum.SUCCESS.value
        setTimeout(() => {
          exportStatus.value = ExportStatusEnum.IDLE.value
        }, 3000)
      }, 300)
    }, 800)
  } catch (err) {
    clearInterval(exportTimer)
    exportStatus.value = ExportStatusEnum.FAILED.value
    ElMessage.error('导出失败，请稍后重试')
    setTimeout(() => {
      exportStatus.value = ExportStatusEnum.IDLE.value
    }, 2000)
  }
}

onMounted(() => {
  fetchStatistics()
  mockTrendData()
  mockPieData()
  fetchTableData()
})

watch([period, dimension], () => {
  cacheMap.clear()
})
</script>

<style lang="scss" scoped>
.text-muted {
  color: #c0c4cc;
}
</style>
