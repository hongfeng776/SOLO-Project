<template>
  <div class="page-container">
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statCards" :key="index">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">
              {{ formatStatValue(item.value, item.type) }}
            </div>
            <div class="stat-unit" v-if="item.unit">{{ item.unit }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :show-index="true"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #floatingProfit="{ row }">
        <span :class="getProfitClass(row.floatingProfit)">
          {{ row.floatingProfit > 0 ? '+' : '' }}{{ formatMoney(row.floatingProfit) }}
        </span>
      </template>

      <template #floatingProfitRate="{ row }">
        <span :class="getProfitClass(row.floatingProfitRate)">
          {{ row.floatingProfitRate > 0 ? '+' : '' }}{{ formatPercent(row.floatingProfitRate) }}
        </span>
      </template>

      <template #holdingRatio="{ row }">
        <el-progress
          :percentage="Math.min(row.holdingRatio ? row.holdingRatio * 100 : 0, 100)"
          :stroke-width="8"
          :show-text="true"
        />
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
        <el-button type="primary" link @click="handleViewRecords(row)">
          持仓明细
        </el-button>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="持仓详情"
      width="700px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="客户">
          {{ currentDetail.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="股票代码">
          {{ currentDetail.stockCode }}
        </el-descriptions-item>
        <el-descriptions-item label="股票名称" :span="2">
          {{ currentDetail.stockName }}
        </el-descriptions-item>
        <el-descriptions-item label="持仓数量" align="right">
          {{ currentDetail.totalQuantity.toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="可用数量" align="right">
          {{ currentDetail.availableQuantity.toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="冻结数量" align="right">
          {{ currentDetail.frozenQuantity.toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="成本价" align="right">
          {{ formatMoney(currentDetail.costPrice) }}
        </el-descriptions-item>
        <el-descriptions-item label="现价" align="right">
          {{ formatMoney(currentDetail.currentPrice) }}
        </el-descriptions-item>
        <el-descriptions-item label="市值" align="right">
          <span class="amount-value">{{ formatMoney(currentDetail.marketValue) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="浮动盈亏" align="right">
          <span :class="getProfitClass(currentDetail.floatingProfit)">
            {{ currentDetail.floatingProfit > 0 ? '+' : '' }}{{ formatMoney(currentDetail.floatingProfit) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="盈亏比例" align="right">
          <span :class="getProfitClass(currentDetail.floatingProfitRate)">
            {{ currentDetail.floatingProfitRate > 0 ? '+' : '' }}{{ formatPercent(currentDetail.floatingProfitRate) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="首次买入日期">
          {{ formatDate(currentDetail.firstBuyDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后交易日期">
          {{ currentDetail.lastTradeDate ? formatDate(currentDetail.lastTradeDate) : '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <el-divider v-if="currentDetail?.profitTrend?.length">盈亏趋势</el-divider>
      <div v-if="currentDetail?.profitTrend?.length" class="profit-trend">
        <div
          v-for="(trend, idx) in currentDetail.profitTrend"
          :key="idx"
          class="trend-item"
        >
          <div class="trend-date">{{ trend.date }}</div>
          <div class="trend-bar-wrapper">
            <div
              class="trend-bar"
              :class="trend.profit >= 0 ? 'profit' : 'loss'"
              :style="{ width: getTrendBarWidth(trend.profit) + '%' }"
            ></div>
          </div>
          <div class="trend-value" :class="getProfitClass(trend.profit)">
            {{ trend.profit > 0 ? '+' : '' }}{{ formatMoney(trend.profit) }}
          </div>
        </div>
      </div>
    </FinDialog>

    <FinDialog
      v-model:visible="recordsDialogVisible"
      title="持仓明细"
      width="800px"
      :hide-footer="true"
    >
      <el-table :data="holdingRecords" v-loading="recordsLoading" stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="tradeDate" label="交易日期" width="120" />
        <el-table-column prop="tradeType" label="交易类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.tradeType === 'buy' ? 'danger' : 'success'" size="small" effect="dark">
              {{ row.tradeType === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tradePrice" label="成交价格" width="120" align="right">
          <template #default="{ row }">
            {{ formatMoney(row.tradePrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="tradeQuantity" label="成交数量" width="120" align="right" />
        <el-table-column prop="tradeAmount" label="成交金额" width="140" align="right">
          <template #default="{ row }">
            {{ formatMoney(row.tradeAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="balanceQuantity" label="持仓余额" width="120" align="right" />
      </el-table>
      <FinEmpty v-if="!recordsLoading && holdingRecords.length === 0" description="暂无持仓明细" />
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Wallet, TrendCharts, Goods, DataAnalysis } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinEmpty from '@/components/common/FinEmpty.vue'
import { formatMoney, formatDate, formatPercent } from '@/utils/format'
import * as holdingApi from '@/api/holding'
import type { ICustomerHolding, IHoldingDetail } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const loading = ref(false)
const statsLoading = ref(false)
const recordsLoading = ref(false)
const tableData = ref<ICustomerHolding[]>([])
const searchParams = reactive<Record<string, any>>({})
const detailDialogVisible = ref(false)
const recordsDialogVisible = ref(false)
const currentDetail = ref<IHoldingDetail | null>(null)
const currentHolding = ref<ICustomerHolding | null>(null)
const holdingRecords = ref<any[]>([])

const holdingStats = reactive({
  totalMarketValue: 0,
  totalFloatingProfit: 0,
  totalProfitRate: 0,
  stockCount: 0
})

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES
})

const statCards = computed(() => [
  {
    label: '总持仓市值',
    value: holdingStats.totalMarketValue,
    type: 'money',
    unit: '元',
    icon: Wallet,
    color: '#1A3A5C',
    bgColor: 'rgba(26, 58, 92, 0.1)'
  },
  {
    label: '总浮动盈亏',
    value: holdingStats.totalFloatingProfit,
    type: 'money',
    unit: '元',
    icon: TrendCharts,
    color: holdingStats.totalFloatingProfit >= 0 ? '#0F9B58' : '#F56C6C',
    bgColor: holdingStats.totalFloatingProfit >= 0 ? 'rgba(15, 155, 88, 0.1)' : 'rgba(245, 108, 108, 0.1)'
  },
  {
    label: '总盈亏比例',
    value: holdingStats.totalProfitRate,
    type: 'percent',
    unit: '',
    icon: DataAnalysis,
    color: holdingStats.totalProfitRate >= 0 ? '#0F9B58' : '#F56C6C',
    bgColor: holdingStats.totalProfitRate >= 0 ? 'rgba(15, 155, 88, 0.1)' : 'rgba(245, 108, 108, 0.1)'
  },
  {
    label: '持仓股票数量',
    value: holdingStats.stockCount,
    type: 'number',
    unit: '只',
    icon: Goods,
    color: '#2C5F8A',
    bgColor: 'rgba(44, 95, 138, 0.1)'
  }
])

const filterConfig = [
  {
    prop: 'customerName',
    label: '客户名称',
    type: 'input' as const,
    placeholder: '请输入客户名称'
  },
  {
    prop: 'keyword',
    label: '股票代码/名称',
    type: 'input' as const,
    placeholder: '请输入股票代码或名称'
  },
  {
    prop: 'profitStatus',
    label: '盈亏状态',
    type: 'select' as const,
    options: [
      { label: '全部', value: 'all' },
      { label: '盈利', value: 'profit' },
      { label: '亏损', value: 'loss' }
    ]
  }
]

const tableColumns = [
  { prop: 'customerName', label: '客户', minWidth: 120 },
  { prop: 'stockCode', label: '股票代码', minWidth: 100 },
  { prop: 'stockName', label: '股票名称', minWidth: 120 },
  { prop: 'totalQuantity', label: '持仓数量', minWidth: 100, align: 'right' },
  { prop: 'availableQuantity', label: '可用数量', minWidth: 100, align: 'right' },
  { prop: 'frozenQuantity', label: '冻结数量', minWidth: 100, align: 'right' },
  { prop: 'costPrice', label: '成本价', minWidth: 100, type: 'money' as const },
  { prop: 'currentPrice', label: '现价', minWidth: 100, type: 'money' as const },
  { prop: 'marketValue', label: '市值', minWidth: 120, type: 'money' as const },
  { prop: 'floatingProfit', label: '浮动盈亏', minWidth: 120, slot: 'floatingProfit', align: 'right' },
  { prop: 'floatingProfitRate', label: '盈亏比例', minWidth: 110, slot: 'floatingProfitRate', align: 'right' },
  { prop: 'holdingRatio', label: '持仓占比', minWidth: 140, slot: 'holdingRatio', align: 'center' },
  { prop: 'firstBuyDate', label: '首次买入日期', minWidth: 120, type: 'date' as const },
  { prop: 'lastTradeDate', label: '最后交易日期', minWidth: 120, type: 'date' as const }
]

function formatStatValue(value: number, type: string): string {
  if (type === 'money') {
    return formatMoney(value)
  }
  if (type === 'percent') {
    return formatPercent(value)
  }
  if (type === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

function getProfitClass(value: number): string {
  const classes = ['fin-money']
  if (value > 0) {
    classes.push('fin-rise')
  } else if (value < 0) {
    classes.push('fin-fall')
  }
  return classes.join(' ')
}

function getTrendBarWidth(value: number): number {
  const maxAbs = Math.max(...(currentDetail.value?.profitTrend?.map(t => Math.abs(t.profit)) || [1]))
  return Math.min(Math.abs(value) / maxAbs * 100, 100)
}

async function fetchStats() {
  statsLoading.value = true
  try {
    const res = await holdingApi.getHoldingStats()
    if (res.code === 0) {
      Object.assign(holdingStats, res.data)
    }
  } catch (error) {
    // ignore
  } finally {
    statsLoading.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    const res = await holdingApi.getHoldingList(params)
    if (res.code === 0) {
      tableData.value = res.data.list.map((item: any) => ({
        ...item,
        holdingRatio: item.marketValue && holdingStats.totalMarketValue
          ? item.marketValue / holdingStats.totalMarketValue
          : 0
      }))
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete searchParams[key]
  })
  pagination.page = 1
  fetchData()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

async function handleView(row: ICustomerHolding) {
  try {
    const res = await holdingApi.getHoldingById(row.id)
    if (res.code === 0) {
      currentDetail.value = res.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

async function handleViewRecords(row: ICustomerHolding) {
  currentHolding.value = row
  recordsDialogVisible.value = true
  recordsLoading.value = true
  try {
    const res = await holdingApi.getHoldingRecords(row.id)
    if (res.code === 0) {
      holdingRecords.value = res.data
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取持仓明细失败')
  } finally {
    recordsLoading.value = false
  }
}

onMounted(async () => {
  await fetchStats()
  fetchData()
})
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--fin-primary);
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-label {
      font-size: 12px;
      color: var(--fin-text-secondary);
      margin-bottom: 2px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.2;
      font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
    }

    .stat-unit {
      font-size: 11px;
      color: var(--fin-text-secondary);
      margin-top: 2px;
    }
  }
}

.amount-value {
  color: var(--fin-primary);
  font-weight: 600;
}

.profit-trend {
  margin-top: 8px;

  .trend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;

    .trend-date {
      width: 100px;
      font-size: 12px;
      color: var(--fin-text-secondary);
      flex-shrink: 0;
    }

    .trend-bar-wrapper {
      flex: 1;
      height: 20px;
      background-color: var(--fin-border-light);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        background-color: var(--fin-border);
      }
    }

    .trend-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;

      &.profit {
        background-color: var(--fin-success);
      }

      &.loss {
        background-color: var(--fin-danger);
      }
    }

    .trend-value {
      width: 120px;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }
  }
}
</style>
