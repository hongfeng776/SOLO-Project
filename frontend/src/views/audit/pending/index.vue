<template>
  <div class="ccb-audit-pending">
    <CcbPageHeader
      title="待审核"
      description="处理待审核的业务申请"
      icon="Clock"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="业务类型" prop="businessType">
        <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable>
          <el-option label="转账汇款" :value="1" />
          <el-option label="理财产品" :value="4" />
          <el-option label="贷款业务" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="提交人" prop="submitterName">
        <el-input v-model="searchForm.submitterName" placeholder="请输入提交人姓名" clearable />
      </el-form-item>
    </CcbSearchForm>

    <CcbBatchOperation :selected-rows="selectedRows" @clear="handleClearSelection">
      <el-button type="primary" size="small" @click="handleBatchApprove">批量通过</el-button>
      <el-button type="danger" size="small" @click="handleBatchReject">批量驳回</el-button>
    </CcbBatchOperation>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-tag type="warning" effect="dark">待审核：{{ total }} 笔</el-tag>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="businessNo" label="业务单号" width="200" />
      <el-table-column prop="businessTypeName" label="业务类型" width="100" />
      <el-table-column prop="amount" label="金额" width="140" align="right">
        <template #default="{ row }">
          <span class="ccb-amount">¥{{ formatMoneyWithComma(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核级别" width="100">
        <template #default="{ row }">
          <el-progress
            :percentage="Math.round((row.currentLevel / row.totalLevel) * 100)"
            :status="row.currentLevel === row.totalLevel ? 'success' : 'warning'"
          >
            {{ row.currentLevel }}/{{ row.totalLevel }}级
          </el-progress>
        </template>
      </el-table-column>
      <el-table-column prop="submitterName" label="提交人" width="100" />
      <el-table-column prop="submitterOrg" label="所属机构" width="150" />
      <el-table-column prop="submitTime" label="提交时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="success" link size="small" @click="handleApprove(row)">通过</el-button>
          <el-button type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <CcbAuditDialog
      v-model="auditDialogVisible"
      :id="currentAuditId"
      :business-info="currentAuditBusiness"
      @approve="handleAuditApprove"
      @reject="handleAuditReject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime, formatMoneyWithComma } from '@utils'
import type { AuditRecord } from '@types/business'

const loading = ref<boolean>(false)
const tableData = ref<AuditRecord[]>([])
const total = ref<number>(0)
const selectedRows = ref<AuditRecord[]>([])

const auditDialogVisible = ref<boolean>(false)
const currentAuditId = ref<number>(0)
const currentAuditBusiness = ref<Record<string, unknown> | null>(null)

const searchForm = reactive({
  businessType: null as number | null,
  submitterName: ''
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const mockAuditRecords: AuditRecord[] = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  businessId: 10000 + i,
  businessType: i % 3 + 1,
  businessTypeName: ['转账汇款', '理财产品', '贷款业务'][i % 3],
  businessNo: `BUS${Date.now()}${String(i).padStart(4, '0')}`,
  amount: (i + 1) * 56800.00,
  currentLevel: i % 3 + 1,
  totalLevel: 3,
  status: 0,
  statusName: '待审核',
  submitterId: i % 10 + 1,
  submitterName: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][i % 8],
  submitterOrg: ['总行营业部', '北京分行', '上海分行', '深圳分行', '广州分行'][i % 5],
  submitTime: `2024-06-1${i % 6} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
  createdAt: `2024-06-1${i % 6} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
  updatedAt: `2024-06-1${i % 6} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`
}))

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockAuditRecords.slice(start, end)
    total.value = mockAuditRecords.length
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as AuditRecord[]
}

const handleClearSelection = (): void => {
  selectedRows.value = []
}

const handleView = (row: AuditRecord): void => {
  ElMessage.info(`查看审核详情：${row.businessNo}`)
}

const handleApprove = (row: AuditRecord): void => {
  currentAuditId.value = row.id
  currentAuditBusiness.value = {
    businessNo: row.businessNo,
    businessTypeName: row.businessTypeName,
    amount: row.amount,
    submitterName: row.submitterName,
    submitterOrg: row.submitterOrg,
    submitTime: row.submitTime,
    currentLevel: row.currentLevel,
    totalLevel: row.totalLevel
  }
  auditDialogVisible.value = true
}

const handleReject = (row: AuditRecord): void => {
  currentAuditId.value = row.id
  currentAuditBusiness.value = {
    businessNo: row.businessNo,
    businessTypeName: row.businessTypeName,
    amount: row.amount,
    submitterName: row.submitterName,
    submitterOrg: row.submitterOrg,
    submitTime: row.submitTime,
    currentLevel: row.currentLevel,
    totalLevel: row.totalLevel
  }
  auditDialogVisible.value = true
}

const handleAuditApprove = ({ id, remark }: { id: number; remark: string }): void => {
  console.log('Approve:', id, remark)
  fetchData()
}

const handleAuditReject = ({ id, remark }: { id: number; remark: string }): void => {
  console.log('Reject:', id, remark)
  fetchData()
}

const handleBatchApprove = (): void => {
  ElMessage.success(`批量通过 ${selectedRows.value.length} 笔审核`)
  handleClearSelection()
  fetchData()
}

const handleBatchReject = (): void => {
  ElMessage.success(`批量驳回 ${selectedRows.value.length} 笔审核`)
  handleClearSelection()
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-audit-pending {
  .ccb-amount {
    font-weight: 600;
    color: #004098;
  }
}
</style>
