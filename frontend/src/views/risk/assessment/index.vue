<template>
  <div class="ccb-risk-assessment">
    <CcbPageHeader
      title="客户风险等级评定"
      description="客户风险等级的评定、复核与管理"
      icon="UserFilled"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="客户编号" prop="customerNo">
        <el-input v-model="searchForm.customerNo" placeholder="请输入客户编号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
          <el-option v-for="item in RiskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="评定类型" prop="assessmentType">
        <el-select v-model="searchForm.assessmentType" placeholder="请选择评定类型" clearable>
          <el-option v-for="item in AssessmentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="评定状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择评定状态" clearable>
          <el-option v-for="item in AssessmentStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="数据同步状态" prop="dataSyncStatus">
        <el-select v-model="searchForm.dataSyncStatus" placeholder="请选择同步状态" clearable>
          <el-option v-for="item in DataSyncStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="评定时间" prop="timeRange">
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
        <el-button type="primary" :icon="Plus" @click="handleCreate">新建评定</el-button>
        <el-button type="success" :icon="Refresh" @click="handleRefresh">刷新数据</el-button>
        <el-button type="warning" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <div class="risk-stats">
          <el-tag type="success" effect="dark" class="stat-tag">低风险: {{ stats.lowRisk }}</el-tag>
          <el-tag type="warning" effect="dark" class="stat-tag">中风险: {{ stats.mediumRisk }}</el-tag>
          <el-tag type="danger" effect="dark" class="stat-tag">较高风险: {{ stats.highMediumRisk }}</el-tag>
          <el-tag type="danger" effect="dark" class="stat-tag">高风险: {{ stats.highRisk }}</el-tag>
        </div>
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
      <el-table-column prop="assessment_no" label="评定编号" width="180" />
      <el-table-column prop="customer_no" label="客户编号" width="140" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="assessment_type_text" label="评定类型" width="100" />
      <el-table-column prop="risk_level" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskLevelType(row.risk_level)" effect="dark" size="small">
            {{ row.risk_level_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_score" label="综合评分" width="100" align="center">
        <template #default="{ row }">
          <span :class="getScoreClass(row.total_score)">{{ row.total_score }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="data_sync_status_text" label="数据同步" width="100">
        <template #default="{ row }">
          <el-tag :type="getSyncStatusType(row.data_sync_status)" effect="light" size="small">
            {{ row.data_sync_status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status_text" label="评定状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_illegal_downgrade" label="违规调整" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_illegal_downgrade === 1" type="danger" effect="dark" size="small">是</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="operator_name" label="操作人" width="100" />
      <el-table-column prop="assessment_time" label="评定时间" width="160" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            v-if="row.status === 2"
            type="warning"
            link
            size="small"
            @click="handleReview(row)"
          >
            复核
          </el-button>
          <el-button type="info" link size="small" @click="handleTrace(row)">溯源</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <CreateDialog
      v-model="createDialogVisible"
      @success="handleCreateSuccess"
    />

    <ReviewDialog
      v-model="reviewDialogVisible"
      :assessment-id="currentAssessmentId"
      @success="handleReviewSuccess"
    />

    <el-drawer
      v-model="detailDrawerVisible"
      title="风险评定详情"
      size="900px"
      direction="rtl"
    >
      <DetailDrawer v-if="detailDrawerVisible" :assessment-id="currentAssessmentId" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getRiskAssessmentListApi,
  RiskLevelOptions,
  AssessmentTypeOptions,
  AssessmentStatusOptions,
  DataSyncStatusOptions,
  type RiskAssessment
} from '@api/riskAssessment'

const router = useRouter()

const loading = ref<boolean>(false)
const tableData = ref<RiskAssessment[]>([])
const total = ref<number>(0)
const selectedRows = ref<RiskAssessment[]>([])

const createDialogVisible = ref<boolean>(false)
const reviewDialogVisible = ref<boolean>(false)
const detailDrawerVisible = ref<boolean>(false)
const currentAssessmentId = ref<string>('')

const stats = reactive({
  lowRisk: 0,
  mediumRisk: 0,
  highMediumRisk: 0,
  highRisk: 0
})

const searchForm = reactive({
  customerNo: '',
  customerName: '',
  riskLevel: undefined as number | undefined,
  assessmentType: undefined as number | undefined,
  status: undefined as number | undefined,
  dataSyncStatus: undefined as number | undefined,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 20
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      customer_no: searchForm.customerNo || undefined,
      customer_name: searchForm.customerName || undefined,
      risk_level: searchForm.riskLevel,
      assessment_type: searchForm.assessmentType,
      status: searchForm.status,
      data_sync_status: searchForm.dataSyncStatus
    }

    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }

    const res = await getRiskAssessmentListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total

    stats.lowRisk = tableData.value.filter(item => item.risk_level === 1).length
    stats.mediumRisk = tableData.value.filter(item => item.risk_level === 2).length
    stats.highMediumRisk = tableData.value.filter(item => item.risk_level === 3).length
    stats.highRisk = tableData.value.filter(item => item.risk_level === 4).length
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.customerNo = ''
  searchForm.customerName = ''
  searchForm.riskLevel = undefined
  searchForm.assessmentType = undefined
  searchForm.status = undefined
  searchForm.dataSyncStatus = undefined
  searchForm.timeRange = []
  pageParams.page = 1
  fetchData()
}

const handleRefresh = () => {
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (rows: RiskAssessment[]) => {
  selectedRows.value = rows
}

const handleCreate = () => {
  createDialogVisible.value = true
}

const handleCreateSuccess = () => {
  createDialogVisible.value = false
  fetchData()
  ElMessage.success('创建评定成功')
}

const handleView = (row: RiskAssessment) => {
  currentAssessmentId.value = row.id
  detailDrawerVisible.value = true
}

const handleReview = (row: RiskAssessment) => {
  currentAssessmentId.value = row.id
  reviewDialogVisible.value = true
}

const handleReviewSuccess = () => {
  reviewDialogVisible.value = false
  fetchData()
  ElMessage.success('复核成功')
}

const handleTrace = (row: RiskAssessment) => {
  router.push({
    path: '/risk/assessment/trace',
    query: { customerId: row.customer_id }
  })
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const getRiskLevelType = (level: number) => {
  const option = RiskLevelOptions.find(item => item.value === level)
  return option?.color || 'info'
}

const getSyncStatusType = (status: number) => {
  const option = DataSyncStatusOptions.find(item => item.value === status)
  return option?.color || 'info'
}

const getStatusType = (status: number) => {
  const option = AssessmentStatusOptions.find(item => item.value === status)
  return option?.color || 'info'
}

const getScoreClass = (score: number) => {
  if (score >= 70) return 'text-success font-bold'
  if (score >= 50) return 'text-warning font-bold'
  if (score >= 30) return 'text-orange font-bold'
  return 'text-danger font-bold'
}

onMounted(() => {
  fetchData()
})
</script>

<script lang="ts">
import CreateDialog from './components/CreateDialog.vue'
import ReviewDialog from './components/ReviewDialog.vue'
import DetailDrawer from './components/DetailDrawer.vue'

export default {
  components: {
    CreateDialog,
    ReviewDialog,
    DetailDrawer
  }
}
</script>

<style scoped lang="scss">
.ccb-risk-assessment {
  .risk-stats {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .stat-tag {
    margin: 0;
  }

  .text-success {
    color: var(--el-color-success);
  }

  .text-warning {
    color: var(--el-color-warning);
  }

  .text-orange {
    color: var(--el-color-warning);
  }

  .text-danger {
    color: var(--el-color-danger);
  }

  .font-bold {
    font-weight: 600;
    font-size: 14px;
  }
}
</style>
