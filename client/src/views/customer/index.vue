<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button
        v-if="hasPerm('customer:create')"
        type="primary"
        @click="handleCreate"
      >
        <el-icon><Plus /></el-icon>
        新增建档
      </el-button>
      <el-button
        v-if="hasPerm('customer:manage')"
        type="success"
        @click="handleBatchImport"
      >
        <el-icon><Upload /></el-icon>
        批量导入
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
      @row-dblclick="handleRowDblClick"
      class="customer-table"
    >
      <template #archiveStatus="{ row }">
        <el-tag :type="getArchiveStatusType(row.archiveStatus)" effect="light">
          {{ getArchiveStatusLabel(row.archiveStatus) }}
        </el-tag>
      </template>

      <template #filingStatus="{ row }">
        <el-tag :type="getFilingStatusType(row.filingStatus)" effect="light">
          {{ getFilingStatusLabel(row.filingStatus) }}
        </el-tag>
      </template>

      <template #accountStatus="{ row }">
        <el-tag :type="getAccountStatusType(row.accountStatus)" effect="light">
          {{ getAccountStatusLabel(row.accountStatus) }}
        </el-tag>
      </template>

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

      <template #assetAccountNo="{ row }">
        <span class="code-text">{{ row.assetAccountNo || '-' }}</span>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          详情
        </el-button>
        <el-button
          v-if="hasPerm('customer:manage')"
          type="primary"
          link
          @click.stop="handleEdit(row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="hasPerm('customer:manage') && row.archiveStatus === 'temporary'"
          type="success"
          link
          @click.stop="handleConvertFormal(row)"
        >
          转正式
        </el-button>
        <el-button type="info" link @click.stop="handleAuditTrail(row)">
          溯源
        </el-button>
      </template>
    </FinTable>

    <CustomerArchiveDialog
      v-model:visible="archiveDialogVisible"
      :edit-data="currentEditData"
      @success="fetchData"
    />

    <CustomerBatchImportDialog
      v-model:visible="importDialogVisible"
      @success="fetchData"
    />

    <CustomerAuditTrailDialog
      v-model:visible="auditTrailVisible"
      :customer-id="currentAuditId"
    />

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="客户详情"
      width="800px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="资产账户编号">
          <span class="code-text">{{ currentDetail.assetAccountNo || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="交易账户编号">
          <span class="code-text">{{ currentDetail.tradeAccountNo || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">
          {{ currentDetail.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="证件号码">
          {{ currentDetail.idCard }}
        </el-descriptions-item>
        <el-descriptions-item label="客户类型">
          {{ getCustomerTypeLabel(currentDetail.customerType) }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentDetail.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="电子邮箱">
          {{ currentDetail.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="建档状态">
          <el-tag :type="getArchiveStatusType(currentDetail.archiveStatus)" effect="light">
            {{ getArchiveStatusLabel(currentDetail.archiveStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备案状态">
          <el-tag :type="getFilingStatusType(currentDetail.filingStatus)" effect="light">
            {{ getFilingStatusLabel(currentDetail.filingStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账户状态">
          <el-tag :type="getAccountStatusType(currentDetail.accountStatus)" effect="light">
            {{ getAccountStatusLabel(currentDetail.accountStatus) }}
          </el-tag>
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
        <el-descriptions-item label="初始存款">
          {{ formatMoney(currentDetail.initialDeposit) }}
        </el-descriptions-item>
        <el-descriptions-item label="开户日期">
          {{ currentDetail.accountOpenDate || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="建档时间" :span="2">
          {{ formatDateTime(currentDetail.archiveTime) || formatDateTime(currentDetail.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Lock, Download, Upload } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import CustomerArchiveDialog from './CustomerArchiveDialog.vue'
import CustomerBatchImportDialog from './CustomerBatchImportDialog.vue'
import CustomerAuditTrailDialog from './CustomerAuditTrailDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatMoney, formatDateTime } from '@/utils/format'
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
  ARCHIVE_STATUS_LABELS,
  ARCHIVE_STATUS_COLORS,
  FILING_STATUS_LABELS,
  FILING_STATUS_COLORS,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_COLORS,
} from '@/constants/dictionaries'
import { RiskLevel, CustomerType, CustomerStatus, ArchiveStatus, FilingStatus, AccountStatus } from '@/enums'
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

const archiveDialogVisible = ref(false)
const importDialogVisible = ref(false)
const auditTrailVisible = ref(false)
const currentEditData = ref<ICustomerAsset | null>(null)
const currentAuditId = ref<number | null>(null)

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const filterConfig = [
  {
    prop: 'keyword',
    label: '客户名称/证件号/账户号',
    type: 'input' as const,
    placeholder: '请输入客户名称、证件号或资产账户号',
  },
  {
    prop: 'customerType',
    label: '客户类型',
    type: 'select' as const,
    options: [
      { label: '个人', value: CustomerType.INDIVIDUAL },
      { label: '机构', value: CustomerType.INSTITUTION },
    ],
  },
  {
    prop: 'archiveStatus',
    label: '建档状态',
    type: 'select' as const,
    options: [
      { label: '正式建档', value: ArchiveStatus.FORMAL },
      { label: '临时建档', value: ArchiveStatus.TEMPORARY },
      { label: '已失效', value: ArchiveStatus.EXPIRED },
    ],
  },
  {
    prop: 'filingStatus',
    label: '备案状态',
    type: 'select' as const,
    options: [
      { label: '未备案', value: FilingStatus.NOT_FILED },
      { label: '备案中', value: FilingStatus.FILING },
      { label: '已备案', value: FilingStatus.FILED },
      { label: '备案驳回', value: FilingStatus.REJECTED },
    ],
  },
  {
    prop: 'accountStatus',
    label: '账户状态',
    type: 'select' as const,
    options: [
      { label: '未开户', value: AccountStatus.NOT_OPENED },
      { label: '开户中', value: AccountStatus.OPENING },
      { label: '已开户', value: AccountStatus.OPENED },
      { label: '已销户', value: AccountStatus.CLOSED },
    ],
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
      { label: 'R5-高风险', value: RiskLevel.R5 },
    ],
  },
  {
    prop: 'status',
    label: '客户状态',
    type: 'select' as const,
    options: [
      { label: '正常', value: CustomerStatus.NORMAL },
      { label: '已冻结', value: CustomerStatus.FROZEN },
      { label: '已销户', value: CustomerStatus.CLOSED },
    ],
  },
]

const tableColumns = [
  { prop: 'assetAccountNo', label: '资产账户号', minWidth: 160, slot: 'assetAccountNo' },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'idCard', label: '证件号码', minWidth: 180 },
  { prop: 'customerType', label: '客户类型', minWidth: 90, slot: 'customerType', align: 'center' },
  { prop: 'archiveStatus', label: '建档状态', minWidth: 100, slot: 'archiveStatus', align: 'center' },
  { prop: 'filingStatus', label: '备案状态', minWidth: 100, slot: 'filingStatus', align: 'center' },
  { prop: 'accountStatus', label: '账户状态', minWidth: 100, slot: 'accountStatus', align: 'center' },
  { prop: 'totalAsset', label: '总资产', minWidth: 120, slot: 'totalAsset' },
  { prop: 'availableAmount', label: '可用金额', minWidth: 120, type: 'money' as const },
  { prop: 'frozenAmount', label: '冻结金额', minWidth: 120, type: 'money' as const },
  { prop: 'totalProfit', label: '总收益', minWidth: 120, slot: 'totalProfit' },
  { prop: 'riskLevel', label: '风险等级', minWidth: 100, slot: 'riskLevel', align: 'center' },
  { prop: 'status', label: '客户状态', minWidth: 90, slot: 'status', align: 'center' },
  { prop: 'createdAt', label: '创建时间', minWidth: 160, type: 'datetime' as const },
  { prop: 'action', label: '操作', minWidth: 220, slot: 'action', align: 'center', fixed: 'right' as const },
]

function getRiskLevelLabel(level: string): string {
  return RISK_LEVEL_LABELS[level as RiskLevel] || level || '-'
}

function getRiskLevelColor(level: string): string {
  return RISK_LEVEL_COLORS[level as RiskLevel] || '#909399'
}

function getCustomerTypeLabel(type: string): string {
  return CUSTOMER_TYPE_LABELS[type as CustomerType] || type || '-'
}

function getCustomerStatusLabel(status: string): string {
  return CUSTOMER_STATUS_LABELS[status as CustomerStatus] || status || '-'
}

function getCustomerStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (CUSTOMER_STATUS_COLORS[status as CustomerStatus] as 'success' | 'danger' | 'info' | 'warning') || 'info'
}

function getArchiveStatusLabel(status: string): string {
  return ARCHIVE_STATUS_LABELS[status as ArchiveStatus] || status || '-'
}

function getArchiveStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (ARCHIVE_STATUS_COLORS[status as ArchiveStatus] as 'success' | 'danger' | 'info' | 'warning') || 'info'
}

function getFilingStatusLabel(status: string): string {
  return FILING_STATUS_LABELS[status as FilingStatus] || status || '-'
}

function getFilingStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (FILING_STATUS_COLORS[status as FilingStatus] as 'success' | 'danger' | 'info' | 'warning') || 'info'
}

function getAccountStatusLabel(status: string): string {
  return ACCOUNT_STATUS_LABELS[status as AccountStatus] || status || '-'
}

function getAccountStatusType(status: string): 'success' | 'danger' | 'info' | 'warning' {
  return (ACCOUNT_STATUS_COLORS[status as AccountStatus] as 'success' | 'danger' | 'info' | 'warning') || 'info'
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
      ...searchParams,
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
  Object.keys(searchParams).forEach((key) => {
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
  selectedIds.value = selection.map((item) => item.id)
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
  currentEditData.value = null
  archiveDialogVisible.value = true
}

function handleEdit(row: ICustomerAsset) {
  currentEditData.value = row
  archiveDialogVisible.value = true
}

function handleRowDblClick(row: ICustomerAsset) {
  if (hasPerm('customer:manage')) {
    handleEdit(row)
  } else {
    handleView(row)
  }
}

async function handleConvertFormal(row: ICustomerAsset) {
  try {
    await ElMessageBox.confirm(
      `确定将客户 "${row.customerName}" 转为正式建档吗？`,
      '转为正式建档确认',
      { type: 'warning' },
    )
    const res = await customerApi.convertToFormal(row.id)
    if (res.code === 0) {
      ElMessage.success('已转为正式建档')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

function handleAuditTrail(row: ICustomerAsset) {
  currentAuditId.value = row.id
  auditTrailVisible.value = true
}

function handleBatchImport() {
  importDialogVisible.value = true
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
      { type: 'warning' },
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
    link.download = `客户资产列表_${Date.now()}.json`
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

.customer-table {
  :deep(.el-table__row) {
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.code-text {
  font-family: monospace;
  font-size: 12px;
  color: #409eff;
}
</style>
