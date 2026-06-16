<template>
  <div class="ccb-risk-violation">
    <CcbPageHeader
      title="违规台账"
      description="违规业务记录查询与处理"
      icon="Warning"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="违规编号" prop="violationNo">
        <el-input v-model="searchForm.violationNo" placeholder="请输入违规编号" clearable />
      </el-form-item>
      <el-form-item label="关联订单号" prop="orderNo">
        <el-input v-model="searchForm.orderNo" placeholder="请输入关联订单号" clearable />
      </el-form-item>
      <el-form-item label="违规类型" prop="violationType">
        <el-select v-model="searchForm.violationType" placeholder="请选择违规类型" clearable>
          <el-option label="大额交易" :value="1" />
          <el-option label="可疑交易" :value="2" />
          <el-option label="身份验证失败" :value="3" />
          <el-option label="黑名单匹配" :value="4" />
          <el-option label="异常操作" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
          <el-option label="高风险" :value="1" />
          <el-option label="中风险" :value="2" />
          <el-option label="低风险" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择处理状态" clearable>
          <el-option label="待处理" :value="0" />
          <el-option label="处理中" :value="1" />
          <el-option label="已处理" :value="2" />
          <el-option label="已忽略" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="违规时间" prop="timeRange">
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
        <el-button type="warning" :icon="Warning" @click="handleBatchProcess">批量处理</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="danger">
          待处理：<el-text type="danger" size="large">{{ pendingCount }}</el-text>
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
      <el-table-column prop="violationNo" label="违规编号" width="200" />
      <el-table-column prop="orderNo" label="关联订单号" width="200" />
      <el-table-column prop="violationTypeName" label="违规类型" width="120" />
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskLevelType(row.riskLevel)" effect="dark" size="small">
            {{ getRiskLevelLabel(row.riskLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="涉及客户" width="120" />
      <el-table-column prop="channelName" label="渠道" width="100" />
      <el-table-column prop="amount" label="涉及金额(元)" width="140" align="right">
        <template #default="{ row }">
          ¥{{ formatMoneyWithComma(row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="处理状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handlerName" label="处理人" width="100" />
      <el-table-column prop="createdAt" label="违规时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            type="warning"
            link
            size="small"
            @click="handleProcess(row)"
          >
            处理
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Warning, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatMoneyWithComma } from '@utils'

interface Violation {
  id: number
  violationNo: string
  orderNo: string
  violationType: number
  violationTypeName: string
  riskLevel: number
  customerName: string
  channelName: string
  amount: number
  status: number
  statusName: string
  handlerId?: number
  handlerName?: string
  handleTime?: string
  handleRemark?: string
  createdAt: string
  updatedAt: string
}

const loading = ref<boolean>(false)
const tableData = ref<Violation[]>([])
const total = ref<number>(0)
const selectedRows = ref<Violation[]>([])

const searchForm = reactive({
  violationNo: '',
  orderNo: '',
  violationType: null as number | null,
  riskLevel: null as number | null,
  status: null as number | null,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const pendingCount = computed<number>(() => {
  return tableData.value.filter((item) => item.status === 0).length
})

const mockViolations: Violation[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  violationNo: `VIO${Date.now()}${String(i).padStart(4, '0')}`,
  orderNo: `TXN${Date.now()}${String(i + 100).padStart(4, '0')}`,
  violationType: i % 5 + 1,
  violationTypeName: ['大额交易', '可疑交易', '身份验证失败', '黑名单匹配', '异常操作'][i % 5],
  riskLevel: i % 3 + 1,
  customerName: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
  channelName: ['柜面渠道', '网上银行', '手机银行', '自助终端', '电话银行'][i % 5],
  amount: (i + 1) * 56800.58,
  status: i % 4,
  statusName: ['待处理', '处理中', '已处理', '已忽略'][i % 4],
  handlerId: i % 4 >= 2 ? 1 : undefined,
  handlerName: i % 4 >= 2 ? '系统管理员' : undefined,
  handleTime: i % 4 >= 2 ? `2024-06-1${i % 6} 10:30:00` : undefined,
  handleRemark: i % 4 === 3 ? '经核查为正常交易' : undefined,
  createdAt: `2024-06-1${i % 6} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
  updatedAt: `2024-06-1${i % 6} ${String(8 + (i % 10)).padStart(2, '0')}:35:00`
}))

const getRiskLevelType = (level: number): string => {
  const types: Record<number, string> = {
    1: 'danger',
    2: 'warning',
    3: 'info'
  }
  return types[level] || ''
}

const getRiskLevelLabel = (level: number): string => {
  const labels: Record<number, string> = {
    1: '高风险',
    2: '中风险',
    3: '低风险'
  }
  return labels[level] || ''
}

const getStatusType = (status: number): string => {
  const types: Record<number, string> = {
    0: 'danger',
    1: 'warning',
    2: 'success',
    3: 'info'
  }
  return types[status] || ''
}

const getStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    0: '待处理',
    1: '处理中',
    2: '已处理',
    3: '已忽略'
  }
  return labels[status] || ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockViolations.slice(start, end)
    total.value = mockViolations.length
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
  selectedRows.value = val as Violation[]
}

const handleView = (row: Violation): void => {
  ElMessage.info(`查看违规详情：${row.violationNo}`)
}

const handleProcess = (row: Violation): void => {
  ElMessage.info(`处理违规记录：${row.violationNo}`)
}

const handleBatchProcess = (): void => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要处理的违规记录')
    return
  }
  ElMessage.success(`已提交 ${selectedRows.value.length} 条违规记录处理`)
}

const handleExport = (): void => {
  ElMessage.success('导出任务已提交，请在任务中心查看')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-risk-violation {
  .ccb-table-toolbar-right {
    font-size: 14px;
  }
}
</style>
