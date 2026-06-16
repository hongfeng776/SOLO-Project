<template>
  <div class="ccb-business-transaction">
    <CcbPageHeader
      title="交易流水"
      description="全渠道交易流水查询与管理"
      icon="List"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable />
      </el-form-item>
      <el-form-item label="渠道" prop="channelCode">
        <el-select v-model="searchForm.channelCode" placeholder="请选择渠道" clearable>
          <el-option label="柜面渠道" value="counter" />
          <el-option label="网上银行" value="ebank" />
          <el-option label="手机银行" value="mobile" />
          <el-option label="自助终端" value="atm" />
          <el-option label="电话银行" value="phone" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" prop="businessType">
        <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable>
          <el-option label="转账汇款" :value="1" />
          <el-option label="活期存款" :value="2" />
          <el-option label="定期存款" :value="3" />
          <el-option label="理财产品" :value="4" />
          <el-option label="贷款业务" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="交易状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="待处理" :value="0" />
          <el-option label="处理中" :value="1" />
          <el-option label="成功" :value="2" />
          <el-option label="失败" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="auditStatus">
        <el-select v-model="searchForm.auditStatus" placeholder="请选择审核状态" clearable>
          <el-option label="待审核" :value="0" />
          <el-option label="审核中" :value="1" />
          <el-option label="审核通过" :value="2" />
          <el-option label="审核驳回" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="交易时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          交易金额合计：<el-text type="primary" size="large">¥{{ formatMoneyWithComma(totalAmount) }}</el-text>
        </el-text>
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
      <el-table-column prop="orderNo" label="订单号" width="200" />
      <el-table-column prop="channelName" label="渠道" width="100" />
      <el-table-column prop="businessTypeName" label="业务类型" width="100" />
      <el-table-column prop="amount" label="交易金额" width="140" align="right">
        <template #default="{ row }">
          <span class="ccb-amount" :class="row.amount >= 0 ? 'positive' : 'negative'">
            {{ row.amount >= 0 ? '+' : '' }}¥{{ formatMoneyWithComma(row.amount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="payerName" label="付款方" width="120" />
      <el-table-column prop="payerAccount" label="付款账号" width="180">
        <template #default="{ row }">
          {{ maskPhone(row.payerAccount) }}
        </template>
      </el-table-column>
      <el-table-column prop="payeeName" label="收款方" width="120" />
      <el-table-column prop="payeeAccount" label="收款账号" width="180">
        <template #default="{ row }">
          {{ maskPhone(row.payeeAccount) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="交易状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getAuditStatusType(row.auditStatus)" effect="light" size="small">
            {{ getAuditStatusLabel(row.auditStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="交易时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            v-if="row.auditStatus === 0"
            type="warning"
            link
            size="small"
            @click="handleAudit(row)"
          >
            审核
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { maskPhone, formatDateTime, formatMoneyWithComma } from '@utils'
import type { Transaction } from '@types/business'

const loading = ref<boolean>(false)
const tableData = ref<Transaction[]>([])
const total = ref<number>(0)
const selectedRows = ref<Transaction[]>([])

const searchForm = reactive({
  orderNo: '',
  channelCode: '',
  businessType: null as number | null,
  status: null as number | null,
  auditStatus: null as number | null,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const totalAmount = computed<number>(() => {
  return tableData.value.reduce((sum, item) => sum + item.amount, 0)
})

const mockTransactions: Transaction[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  orderNo: `TXN${Date.now()}${String(i).padStart(4, '0')}`,
  channelCode: ['counter', 'ebank', 'mobile', 'atm', 'phone'][i % 5],
  channelName: ['柜面渠道', '网上银行', '手机银行', '自助终端', '电话银行'][i % 5],
  businessType: i % 5 + 1,
  businessTypeName: ['转账汇款', '活期存款', '定期存款', '理财产品', '贷款业务'][i % 5],
  amount: (i + 1) * 15680.58,
  payerAccount: `6222021000${String(1000000 + i).padStart(7, '0')}`,
  payeeAccount: `6227002000${String(2000000 + i).padStart(7, '0')}`,
  payerName: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
  payeeName: ['孙八', '周九', '吴十', '郑十一', '冯十二'][i % 5],
  status: i % 5,
  statusName: ['待处理', '处理中', '成功', '失败', '已取消'][i % 5],
  auditStatus: i % 4,
  auditStatusName: ['待审核', '审核中', '审核通过', '审核驳回'][i % 4],
  auditorId: i % 4 === 2 ? 1 : undefined,
  auditorName: i % 4 === 2 ? '系统管理员' : undefined,
  auditTime: i % 4 === 2 ? '2024-06-16 10:00:00' : undefined,
  auditRemark: i % 4 === 3 ? '资料不全' : undefined,
  createdAt: `2024-06-1${i % 6} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
  updatedAt: `2024-06-1${i % 6} ${String(8 + (i % 10)).padStart(2, '0')}:35:00`
}))

const getStatusType = (status: number): string => {
  const types: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'info'
  }
  return types[status] || ''
}

const getStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    0: '待处理',
    1: '处理中',
    2: '成功',
    3: '失败',
    4: '已取消'
  }
  return labels[status] || ''
}

const getAuditStatusType = (status: number): string => {
  const types: Record<number, string> = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'danger'
  }
  return types[status] || ''
}

const getAuditStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    0: '待审核',
    1: '审核中',
    2: '审核通过',
    3: '审核驳回'
  }
  return labels[status] || ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockTransactions.slice(start, end)
    total.value = mockTransactions.length
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
  selectedRows.value = val as Transaction[]
}

const handleView = (row: Transaction): void => {
  ElMessage.info(`查看交易详情：${row.orderNo}`)
}

const handleAudit = (row: Transaction): void => {
  ElMessage.info(`审核交易：${row.orderNo}`)
}

const handleExport = (): void => {
  ElMessage.success('导出任务已提交，请在任务中心查看')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-business-transaction {
  .ccb-amount {
    font-weight: 600;

    &.positive {
      color: #52c41a;
    }

    &.negative {
      color: #f5222d;
    }
  }

  .ccb-table-toolbar-right {
    font-size: 14px;
  }
}
</style>
