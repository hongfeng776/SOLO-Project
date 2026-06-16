<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button
        v-if="hasPerm('customer:create')"
        type="primary"
        @click="handleCreate"
      >
        <el-icon><Plus /></el-icon>
        新增
      </el-button>
      <el-button
        v-if="hasPerm('customer:batchFreeze')"
        :disabled="selectedIds.length === 0"
        type="warning"
        @click="handleBatchFreeze"
      >
        <el-icon><Lock /></el-icon>
        批量冻结
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #riskLevel="{ row }">
        <el-tag :color="getRiskLevelColor(row.riskLevel)" effect="light">
          {{ getRiskLevelLabel(row.riskLevel) }}
        </el-tag>
      </template>

      <template #status="{ row }">
        <el-tag :type="getCustomerStatusType(row.status)" effect="light">
          {{ getCustomerStatusLabel(row.status) }}
        </el-tag>
      </template>

      <template #customerType="{ row }">
        {{ getCustomerTypeLabel(row.customerType) }}
      </template>

      <template #totalAsset="{ row }">
        <span :class="getMoneyClass(row.totalAsset)">
          {{ formatMoney(row.totalAsset) }}
        </span>
      </template>

      <template #totalProfit="{ row }">
        <span :class="getMoneyClass(row.totalProfit)">
          {{ formatMoney(row.totalProfit) }}
        </span>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
        <el-button
          v-if="hasPerm('customer:update')"
          type="primary"
          link
          @click="handleEdit(row)"
        >
          编辑
        </el-button>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="客户详情"
      width="700px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="客户名称">
          {{ currentDetail.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="证件号码">
          {{ currentDetail.idCard }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentDetail.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="客户类型">
          {{ getCustomerTypeLabel(currentDetail.customerType) }}
        </el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :color="getRiskLevelColor(currentDetail.riskLevel)" effect="light">
            {{ getRiskLevelLabel(currentDetail.riskLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户状态">
          <el-tag :type="getCustomerStatusType(currentDetail.status)" effect="light">
            {{ getCustomerStatusLabel(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总资产">
          <span :class="getMoneyClass(currentDetail.totalAsset)">
            {{ formatMoney(currentDetail.totalAsset) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="可用金额">
          {{ formatMoney(currentDetail.availableAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="冻结金额">
          {{ formatMoney(currentDetail.frozenAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="总收益">
          <span :class="getMoneyClass(currentDetail.totalProfit)">
            {{ formatMoney(currentDetail.totalProfit) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="总成本">
          {{ formatMoney(currentDetail.totalCost) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(currentDetail.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Lock, Download } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatMoney, formatDateTime } from '@/utils/format'
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS
} from '@/constants/dictionaries'
import { RiskLevel, CustomerType, CustomerStatus } from '@/enums'
import * as customerApi from '@/api/customerAsset'
import type { ICustomerAsset } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<ICustomerAsset[]>([])
const selectedIds = ref<number[]>([])
const detailDialogVisible = ref(false)
const currentDetail = ref<ICustomerAsset | null>(null)
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
    prop: 'keyword',
    label: '客户名称/证件号',
    type: 'input' as const,
    placeholder: '请输入客户名称或证件号'
  },
  {
    prop: 'customerType',
    label: '客户类型',
    type: 'select' as const,
    options: [
      { label: '个人', value: CustomerType.INDIVIDUAL },
      { label: '机构', value: CustomerType.INSTITUTION }
    ]
  },
  {
    prop: 'riskLevel',
    label: '风险等级',
    type: 'select' as const,
    options: [
      { label: 'R1-低风险', value: RiskLevel.R1 },
      { label: 'R2-中低风险', value: RiskLevel.R2 },
      { label: 'R3-中风险', value: RiskLevel.R3 },
      { label: 'R4-中高风险', value: RiskLevel.R4 },
      { label: 'R5-高风险', value: RiskLevel.R5 }
    ]
  },
  {
    prop: 'status',
    label: '客户状态',
    type: 'select' as const,
    options: [
      { label: '正常', value: CustomerStatus.NORMAL },
      { label: '已冻结', value: CustomerStatus.FROZEN },
      { label: '已销户', value: CustomerStatus.CLOSED }
    ]
  }
]

const tableColumns = [
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'idCard', label: '证件号码', minWidth: 180 },
  { prop: 'phone', label: '联系电话', minWidth: 120 },
  { prop: 'totalAsset', label: '总资产', minWidth: 120, slot: 'totalAsset' },
  { prop: 'availableAmount', label: '可用金额', minWidth: 120, type: 'money' as const },
  { prop: 'frozenAmount', label: '冻结金额', minWidth: 120, type: 'money' as const },
  { prop: 'totalProfit', label: '总收益', minWidth: 120, slot: 'totalProfit' },
  { prop: 'totalCost', label: '总成本', minWidth: 120, type: 'money' as const },
  { prop: 'riskLevel', label: '风险等级', minWidth: 120, slot: 'riskLevel', align: 'center' },
  { prop: 'customerType', label: '客户类型', minWidth: 100, slot: 'customerType', align: 'center' },
  { prop: 'status', label: '客户状态', minWidth: 100, slot: 'status', align: 'center' },
  { prop: 'createdAt', label: '创建时间', minWidth: 160, type: 'datetime' as const }
]

function getRiskLevelLabel(level: string): string {
  return RISK_LEVEL_LABELS[level as RiskLevel] || level
}

function getRiskLevelColor(level: string): string {
  return RISK_LEVEL_COLORS[level as RiskLevel] || '#909399'
}

function getCustomerTypeLabel(type: string): string {
  return CUSTOMER_TYPE_LABELS[type as CustomerType] || type
}

function getCustomerStatusLabel(status: string): string {
  return CUSTOMER_STATUS_LABELS[status as CustomerStatus] || status
}

function getCustomerStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (CUSTOMER_STATUS_COLORS[status as CustomerStatus] as 'success' | 'danger' | 'info' | 'warning') || 'info'
}

function getMoneyClass(value: number): string {
  const classes = ['fin-money']
  if (value > 0) {
    classes.push('fin-rise')
  } else if (value < 0) {
    classes.push('fin-fall')
  }
  return classes.join(' ')
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    const res = await customerApi.getList(params)
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

function handleSelectionChange(selection: ICustomerAsset[]) {
  selectedIds.value = selection.map(item => item.id)
}

async function handleView(row: ICustomerAsset) {
  try {
    const res = await customerApi.getById(row.id)
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

function handleCreate() {
  ElMessage.info('新增功能待实现')
}

function handleEdit(row: ICustomerAsset) {
  ElMessage.info(`编辑客户: ${row.customerName}`)
}

async function handleBatchFreeze() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要冻结的客户')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要冻结选中的 ${selectedIds.value.length} 个客户吗？`,
      '批量冻结确认',
      { type: 'warning' }
    )
    const res = await customerApi.batchFreeze(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success('批量冻结成功')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量冻结失败')
    }
  }
}

async function handleExport() {
  try {
    const blob = await customerApi.exportList(searchParams)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `客户资产列表_${Date.now()}.xlsx`
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
