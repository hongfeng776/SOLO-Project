<template>
  <div class="page-container replay-page">
    <div class="page-header">
      <h2>行情历史复盘</h2>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <el-table
      v-loading="loading"
      :data="tableData"
      border
      stripe
      highlight-current-row
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="stockCode" label="股票代码" width="120" />
      <el-table-column prop="stockName" label="股票名称" width="120" />
      <el-table-column prop="tradeDate" label="交易日期" width="120" />
      <el-table-column prop="openPrice" label="开盘价" width="100" align="right">
        <template #default="{ row }">{{ formatMoney(row.openPrice, 2) }}</template>
      </el-table-column>
      <el-table-column prop="closePrice" label="收盘价" width="100" align="right">
        <template #default="{ row }">{{ formatMoney(row.closePrice, 2) }}</template>
      </el-table-column>
      <el-table-column prop="highPrice" label="最高价" width="100" align="right">
        <template #default="{ row }">{{ formatMoney(row.highPrice, 2) }}</template>
      </el-table-column>
      <el-table-column prop="lowPrice" label="最低价" width="100" align="right">
        <template #default="{ row }">{{ formatMoney(row.lowPrice, 2) }}</template>
      </el-table-column>
      <el-table-column prop="changeRate" label="涨跌幅" width="110" align="right">
        <template #default="{ row }">
          <span :style="{ color: row.changeRate >= 0 ? '#F56C6C' : '#67C23A' }">
            {{ row.changeRate >= 0 ? '+' : '' }}{{ row.changeRate.toFixed(2) }}%
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="volume" label="成交量" width="110" align="right">
        <template #default="{ row }">{{ formatVolume(row.volume) }}</template>
      </el-table-column>
      <el-table-column prop="replayStatus" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="replayStatusType(row.replayStatus)"
            size="small"
          >
            {{ replayStatusLabel(row.replayStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="toggleConclusion(row)"
          >
            {{ expandedRowId === row.id ? '收起' : '分析' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <Transition name="slide-expand">
      <div v-if="expandedRowId !== null" class="conclusion-drawer">
        <ReplayConclusionPanel
          :stock-code="conclusionProps.stockCode"
          :stock-name="conclusionProps.stockName"
          :start-date="conclusionProps.startDate"
          :end-date="conclusionProps.endDate"
          :sector="conclusionProps.sector"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { queryHistoryData } from '@/api/replay'
import { formatMoney, formatVolume } from '@/utils/format'
import { MARKET_SECTOR_LIST } from '@/constants/dictionaries'
import ReplayConclusionPanel from './ReplayConclusionPanel.vue'
import type { IHistoryRecord, IReplayQueryParams } from '@/types/api'

const loading = ref(false)
const tableData = ref<IHistoryRecord[]>([])
const expandedRowId = ref<number | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchParams = reactive<Partial<IReplayQueryParams>>({})

const conclusionProps = reactive({
  stockCode: '',
  stockName: '',
  startDate: '',
  endDate: '',
  sector: '',
})

const filterConfig = [
  { prop: 'stockCode', label: '股票代码', type: 'input' as const, placeholder: '请输入股票代码' },
  {
    prop: 'sector',
    label: '板块',
    type: 'select' as const,
    options: MARKET_SECTOR_LIST.map(s => ({ value: s, label: s })),
  },
  { prop: 'startDate', label: '开始日期', type: 'date' as const, valueFormat: 'YYYY-MM-DD' },
  { prop: 'endDate', label: '结束日期', type: 'date' as const, valueFormat: 'YYYY-MM-DD' },
]

function replayStatusType(status: string): 'success' | 'warning' | 'danger' {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    normal: 'success',
    abnormal: 'warning',
    suspended: 'danger',
  }
  return map[status] || 'success'
}

function replayStatusLabel(status: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    abnormal: '异常',
    suspended: '停牌',
  }
  return map[status] || status
}

async function fetchData() {
  loading.value = true
  try {
    const params: IReplayQueryParams = {
      startDate: searchParams.startDate || '',
      endDate: searchParams.endDate || '',
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...(searchParams.stockCode ? { stockCode: searchParams.stockCode } : {}),
      ...(searchParams.sector ? { sector: searchParams.sector } : {}),
    }
    const res = await queryHistoryData(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取历史复盘数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch(params: Record<string, unknown>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  expandedRowId.value = null
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete (searchParams as Record<string, unknown>)[key]
  })
  pagination.page = 1
  expandedRowId.value = null
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

function toggleConclusion(row: IHistoryRecord) {
  if (expandedRowId.value === row.id) {
    expandedRowId.value = null
    return
  }
  expandedRowId.value = row.id
  conclusionProps.stockCode = row.stockCode
  conclusionProps.stockName = row.stockName
  conclusionProps.startDate = searchParams.startDate || row.tradeDate
  conclusionProps.endDate = searchParams.endDate || row.tradeDate
  conclusionProps.sector = searchParams.sector || ''
}

fetchData()
</script>

<style lang="scss" scoped>
.replay-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--fin-text-primary);
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
