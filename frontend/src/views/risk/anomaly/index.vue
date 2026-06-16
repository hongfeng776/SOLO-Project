<template>
  <div class="ccb-risk-anomaly">
    <CcbPageHeader
      title="可疑交易"
      description="可疑交易监测与识别"
      icon="View"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
          <el-option label="高风险" :value="1" />
          <el-option label="中风险" :value="2" />
          <el-option label="低风险" :value="3" />
        </el-select>
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
        <el-button type="warning" :icon="Warning" @click="handleBatchReview">批量复核</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="danger">
          高风险交易：<el-text type="danger" size="large">{{ highRiskCount }}</el-text>
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
      <el-table-column prop="transactionNo" label="交易号" width="200" />
      <el-table-column prop="channelName" label="渠道" width="100" />
      <el-table-column prop="customerName" label="客户" width="120" />
      <el-table-column prop="amount" label="金额(元)" width="140" align="right">
        <template #default="{ row }">
          ¥{{ formatMoneyWithComma(row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskLevelType(row.riskLevel)" effect="dark" size="small">
            {{ getRiskLevelLabel(row.riskLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="riskTags" label="风险标签" min-width="180">
        <template #default="{ row }">
          <el-tag
            v-for="(tag, index) in row.riskTags"
            :key="index"
            :type="getRiskTagType(tag)"
            effect="light"
            size="small"
            style="margin-right: 4px"
          >
            {{ tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="warning" link size="small" @click="handleReview(row)">复核</el-button>
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

interface AnomalyTransaction {
  id: number
  transactionNo: string
  channelCode: string
  channelName: string
  customerName: string
  amount: number
  riskLevel: number
  riskTags: string[]
  createdAt: string
}

const loading = ref<boolean>(false)
const tableData = ref<AnomalyTransaction[]>([])
const total = ref<number>(0)
const selectedRows = ref<AnomalyTransaction[]>([])

const searchForm = reactive({
  riskLevel: null as number | null,
  channelCode: '',
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const highRiskCount = computed<number>(() => {
  return tableData.value.filter((item) => item.riskLevel === 1).length
})

const riskTagPool = ['大额交易', '频繁交易', '异地交易', '异常时段', '对手异常', '金额异常']

const mockAnomalies: AnomalyTransaction[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  transactionNo: `TXN${Date.now()}${String(i).padStart(4, '0')}`,
  channelCode: ['counter', 'ebank', 'mobile', 'atm', 'phone'][i % 5],
  channelName: ['柜面渠道', '网上银行', '手机银行', '自助终端', '电话银行'][i % 5],
  customerName: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
  amount: (i + 1) * 86800.58,
  riskLevel: i % 3 + 1,
  riskTags: riskTagPool.slice(0, (i % 3) + 1),
  createdAt: `2024-06-1${i % 6} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`
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

const getRiskTagType = (tag: string): string => {
  const types: Record<string, string> = {
    '大额交易': 'danger',
    '频繁交易': 'warning',
    '异地交易': 'primary',
    '异常时段': 'info',
    '对手异常': 'warning',
    '金额异常': 'danger'
  }
  return types[tag] || 'info'
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockAnomalies.slice(start, end)
    total.value = mockAnomalies.length
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
  selectedRows.value = val as AnomalyTransaction[]
}

const handleView = (row: AnomalyTransaction): void => {
  ElMessage.info(`查看可疑交易详情：${row.transactionNo}`)
}

const handleReview = (row: AnomalyTransaction): void => {
  ElMessage.info(`复核可疑交易：${row.transactionNo}`)
}

const handleBatchReview = (): void => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要复核的交易记录')
    return
  }
  ElMessage.success(`已提交 ${selectedRows.value.length} 条可疑交易复核`)
}

const handleExport = (): void => {
  ElMessage.success('导出任务已提交，请在任务中心查看')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-risk-anomaly {
  .ccb-table-toolbar-right {
    font-size: 14px;
  }
}
</style>
