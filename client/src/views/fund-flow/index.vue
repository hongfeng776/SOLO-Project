<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

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
      <template #flowStatus="{ row }">
        <el-tag :type="getFlowStatusType(row.flowStatus)" effect="light">
          {{ getFlowStatusLabel(row.flowStatus) }}
        </el-tag>
      </template>

      <template #flowType="{ row }">
        {{ getFlowTypeLabel(row.flowType) }}
      </template>

      <template #channel="{ row }">
        {{ getFlowChannelLabel(row.channel) }}
      </template>

      <template #amount="{ row }">
        <span :class="getAmountClass(row.flowType)">
          {{ getAmountPrefix(row.flowType) }}{{ formatMoney(row.amount) }}
        </span>
      </template>

      <template #balanceAfter="{ row }">
        <span class="fin-money">
          {{ formatMoney(row.balanceAfter) }}
        </span>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="资金流水详情"
      width="700px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="流水号">
          {{ currentDetail.flowNo }}
        </el-descriptions-item>
        <el-descriptions-item label="客户ID">
          {{ currentDetail.customerId }}
        </el-descriptions-item>
        <el-descriptions-item label="资产ID">
          {{ currentDetail.assetId }}
        </el-descriptions-item>
        <el-descriptions-item label="流水类型">
          {{ getFlowTypeLabel(currentDetail.flowType) }}
        </el-descriptions-item>
        <el-descriptions-item label="交易金额">
          <span :class="getAmountClass(currentDetail.flowType)">
            {{ getAmountPrefix(currentDetail.flowType) }}{{ formatMoney(currentDetail.amount) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="交易后余额">
          <span class="fin-money">
            {{ formatMoney(currentDetail.balanceAfter) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="流水状态">
          <el-tag :type="getFlowStatusType(currentDetail.flowStatus)" effect="light">
            {{ getFlowStatusLabel(currentDetail.flowStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交易渠道">
          {{ getFlowChannelLabel(currentDetail.channel) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentDetail.remark || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="交易时间" :span="2">
          {{ formatDateTime(currentDetail.tradeTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatMoney, formatDateTime } from '@/utils/format'
import {
  FLOW_TYPE_LABELS,
  FLOW_STATUS_LABELS,
  FLOW_STATUS_COLORS,
  FLOW_CHANNEL_LABELS
} from '@/constants/dictionaries'
import { FlowType, FlowStatus, FlowChannel } from '@/enums'
import * as fundFlowApi from '@/api/fundFlow'
import type { IFundFlow } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const loading = ref(false)
const tableData = ref<IFundFlow[]>([])
const detailDialogVisible = ref(false)
const currentDetail = ref<IFundFlow | null>(null)
const searchParams = reactive<Record<string, any>>({})

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES
})

const filterConfig = [
  {
    prop: 'flowNo',
    label: '流水号',
    type: 'input' as const,
    placeholder: '请输入流水号'
  },
  {
    prop: 'customerId',
    label: '客户ID',
    type: 'input' as const,
    placeholder: '请输入客户ID'
  },
  {
    prop: 'flowType',
    label: '流水类型',
    type: 'select' as const,
    options: [
      { label: '充值', value: FlowType.DEPOSIT },
      { label: '提现', value: FlowType.WITHDRAW },
      { label: '买入', value: FlowType.BUY },
      { label: '卖出', value: FlowType.SELL },
      { label: '分红', value: FlowType.DIVIDEND },
      { label: '手续费', value: FlowType.FEE }
    ]
  },
  {
    prop: 'flowStatus',
    label: '流水状态',
    type: 'select' as const,
    options: [
      { label: '处理中', value: FlowStatus.PENDING },
      { label: '成功', value: FlowStatus.SUCCESS },
      { label: '失败', value: FlowStatus.FAILED },
      { label: '已撤销', value: FlowStatus.CANCELLED }
    ]
  },
  {
    prop: 'channel',
    label: '交易渠道',
    type: 'select' as const,
    options: [
      { label: '线上', value: FlowChannel.ONLINE },
      { label: '线下', value: FlowChannel.OFFLINE },
      { label: 'API', value: FlowChannel.API }
    ],
    advanced: true
  },
  {
    prop: 'tradeTime',
    label: '交易日期',
    type: 'daterange' as const,
    advanced: true
  },
  {
    prop: 'amount',
    label: '金额范围',
    type: 'numberrange' as const,
    min: 0,
    precision: 2,
    advanced: true
  }
]

const tableColumns = [
  { prop: 'flowNo', label: '流水号', minWidth: 180 },
  { prop: 'customerId', label: '客户ID', minWidth: 100, align: 'center' },
  { prop: 'assetId', label: '资产ID', minWidth: 100, align: 'center' },
  { prop: 'flowType', label: '流水类型', minWidth: 100, slot: 'flowType', align: 'center' },
  { prop: 'amount', label: '交易金额', minWidth: 140, slot: 'amount' },
  { prop: 'balanceAfter', label: '交易后余额', minWidth: 140, slot: 'balanceAfter' },
  { prop: 'flowStatus', label: '流水状态', minWidth: 100, slot: 'flowStatus', align: 'center' },
  { prop: 'channel', label: '交易渠道', minWidth: 100, slot: 'channel', align: 'center' },
  { prop: 'remark', label: '备注', minWidth: 150, showOverflowTooltip: true },
  { prop: 'tradeTime', label: '交易时间', minWidth: 160, type: 'datetime' as const }
]

const positiveFlowTypes = [FlowType.DEPOSIT, FlowType.BUY, FlowType.DIVIDEND]
const negativeFlowTypes = [FlowType.WITHDRAW, FlowType.SELL, FlowType.FEE]

function getFlowTypeLabel(type: string): string {
  return FLOW_TYPE_LABELS[type as FlowType] || type
}

function getFlowStatusLabel(status: string): string {
  return FLOW_STATUS_LABELS[status as FlowStatus] || status
}

function getFlowStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (FLOW_STATUS_COLORS[status as FlowStatus] as 'success' | 'danger' | 'info' | 'warning') || 'info'
}

function getFlowChannelLabel(channel: string): string {
  return FLOW_CHANNEL_LABELS[channel as FlowChannel] || channel
}

function getAmountClass(flowType: string): string {
  const classes = ['fin-money']
  if (positiveFlowTypes.includes(flowType as FlowType)) {
    classes.push('fin-rise')
  } else if (negativeFlowTypes.includes(flowType as FlowType)) {
    classes.push('fin-fall')
  }
  return classes.join(' ')
}

function getAmountPrefix(flowType: string): string {
  if (positiveFlowTypes.includes(flowType as FlowType)) {
    return '+'
  } else if (negativeFlowTypes.includes(flowType as FlowType)) {
    return '-'
  }
  return ''
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    const res = await fundFlowApi.getList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
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

async function handleView(row: IFundFlow) {
  try {
    const res = await fundFlowApi.getById(row.flowNo)
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

function handleRefresh() {
  fetchData()
  ElMessage.success('刷新成功')
}

async function handleExport() {
  try {
    const blob = await fundFlowApi.exportList(searchParams)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `资金流水列表_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
