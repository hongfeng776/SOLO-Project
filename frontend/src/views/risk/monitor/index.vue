<template>
  <div class="ccb-abnormal-monitor">
    <CcbPageHeader
      title="异常交易监控"
      description="异常交易告警的监控、处理与管理"
      icon="Warning"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="告警类型" prop="alert_type">
        <el-select v-model="searchForm.alert_type" placeholder="请选择告警类型" clearable>
          <el-option v-for="item in AlertTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="risk_level">
        <el-select v-model="searchForm.risk_level" placeholder="请选择风险等级" clearable>
          <el-option v-for="item in AlertRiskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="告警状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择告警状态" clearable>
          <el-option v-for="item in AlertStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="拦截状态" prop="intercept_status">
        <el-select v-model="searchForm.intercept_status" placeholder="请选择拦截状态" clearable>
          <el-option v-for="item in InterceptStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="告警时间" prop="timeRange">
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
        <CcbPermissionButton
          label="刷新数据"
          type="success"
          :icon="Refresh"
          @click="handleRefresh"
        />
        <CcbPermissionButton
          label="导出数据"
          type="warning"
          :icon="Download"
          @click="handleExport"
        />
      </div>
      <div class="ccb-table-toolbar-right">
        <div class="alert-stats">
          <el-tag type="info" effect="dark" class="stat-tag">待处理: {{ stats.pending }}</el-tag>
          <el-tag type="warning" effect="dark" class="stat-tag">处理中: {{ stats.processing }}</el-tag>
          <el-tag type="danger" effect="dark" class="stat-tag">高风险: {{ stats.highRisk }}</el-tag>
          <el-tag type="success" effect="dark" class="stat-tag">已处理: {{ stats.handled }}</el-tag>
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
      <el-table-column prop="alert_no" label="告警编号" width="180" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="alert_type_text" label="告警类型" width="100" />
      <el-table-column prop="risk_level" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskLevelType(row.risk_level)" effect="dark" size="small">
            {{ row.risk_level_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="transaction_amount" label="交易金额" width="120" align="right">
        <template #default="{ row }">
          <span class="money-text">¥{{ formatAmount(row.transaction_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status_text" label="告警状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getAlertStatusType(row.status)" effect="light" size="small">
            {{ row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="intercept_status_text" label="拦截状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getInterceptStatusType(row.intercept_status)" effect="light" size="small">
            {{ row.intercept_status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="transaction_time" label="交易时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            type="warning"
            link
            size="small"
            @click="handleAlert(row)"
          >
            处理
          </el-button>
          <el-button type="info" link size="small" @click="handleTrace(row)">追踪</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-drawer
      v-model="detailDrawerVisible"
      title="告警详情"
      size="800px"
      direction="rtl"
    >
      <div v-if="detailData" class="detail-content">
        <CcbDetailPanel :data="detailData" :items="detailItems" />

        <el-divider content-position="left">关联追踪记录</el-divider>
        <el-table :data="traceData" size="small" max-height="300">
          <el-table-column prop="trace_type_text" label="类型" width="100" />
          <el-table-column prop="operator_name" label="操作人" width="100" />
          <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="trace_time" label="时间" width="160" />
        </el-table>
      </div>
    </el-drawer>

    <el-dialog
      v-model="handleDialogVisible"
      title="处理告警"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="handleForm" :rules="handleRules" ref="handleFormRef" label-width="100px">
        <el-form-item label="告警编号">
          <span>{{ currentAlert?.alert_no }}</span>
        </el-form-item>
        <el-form-item label="客户姓名">
          <span>{{ currentAlert?.customer_name }}</span>
        </el-form-item>
        <el-form-item label="处理方式" prop="action">
          <el-select v-model="handleForm.action" placeholder="请选择处理方式" style="width: 100%">
            <el-option v-for="item in AlertActionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注" prop="remark">
          <el-input
            v-model="handleForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAlertSubmit">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getAlertListApi,
  getAlertDetailApi,
  handleAlertApi,
  getAlertTraceApi,
  AlertTypeOptions,
  AlertRiskLevelOptions,
  AlertStatusOptions,
  InterceptStatusOptions,
  AlertActionOptions,
  type AbnormalTransaction,
  type MonitorTraceVO
} from '@api/abnormalMonitor'

const router = useRouter()

const loading = ref(false)
const tableData = ref<AbnormalTransaction[]>([])
const total = ref(0)
const selectedRows = ref<AbnormalTransaction[]>([])
const submitting = ref(false)

const detailDrawerVisible = ref(false)
const detailData = ref<AbnormalTransaction | null>(null)
const traceData = ref<MonitorTraceVO[]>([])

const handleDialogVisible = ref(false)
const currentAlert = ref<AbnormalTransaction | null>(null)
const handleFormRef = ref<FormInstance>()
const handleForm = reactive({
  action: undefined as number | undefined,
  remark: ''
})

const handleRules: FormRules = {
  action: [{ required: true, message: '请选择处理方式', trigger: 'change' }]
}

const stats = reactive({
  pending: 0,
  processing: 0,
  highRisk: 0,
  handled: 0
})

const searchForm = reactive({
  alert_type: undefined as number | undefined,
  risk_level: undefined as number | undefined,
  status: undefined as number | undefined,
  intercept_status: undefined as number | undefined,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 20
})

const detailItems = [
  { prop: 'alert_no', label: '告警编号', span: 2 },
  { prop: 'customer_no', label: '客户编号' },
  { prop: 'customer_name', label: '客户姓名' },
  { prop: 'alert_type_text', label: '告警类型' },
  { prop: 'risk_level', label: '风险等级', type: 'tag' as const, dict: AlertRiskLevelOptions },
  { prop: 'transaction_amount', label: '交易金额', type: 'money' as const },
  { prop: 'status_text', label: '告警状态' },
  { prop: 'intercept_status_text', label: '拦截状态' },
  { prop: 'trigger_rule_name', label: '触发规则' },
  { prop: 'transaction_time', label: '交易时间', type: 'datetime' as const },
  { prop: 'description', label: '描述', span: 2 },
  { prop: 'operator_name', label: '处理人' },
  { prop: 'handle_time', label: '处理时间', type: 'datetime' as const },
  { prop: 'handle_remark', label: '处理备注', span: 2 }
]

const formatAmount = (amount: number) => {
  if (!amount && amount !== 0) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      alert_type: searchForm.alert_type,
      risk_level: searchForm.risk_level,
      status: searchForm.status,
      intercept_status: searchForm.intercept_status
    }

    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }

    const res = await getAlertListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total

    stats.pending = tableData.value.filter(item => item.status === 0).length
    stats.processing = tableData.value.filter(item => item.status === 1).length
    stats.highRisk = tableData.value.filter(item => item.risk_level >= 3).length
    stats.handled = tableData.value.filter(item => item.status === 4).length
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
  searchForm.alert_type = undefined
  searchForm.risk_level = undefined
  searchForm.status = undefined
  searchForm.intercept_status = undefined
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

const handleSelectionChange = (rows: AbnormalTransaction[]) => {
  selectedRows.value = rows
}

const handleView = async (row: AbnormalTransaction) => {
  try {
    const res = await getAlertDetailApi(row.id)
    detailData.value = res.data
    detailDrawerVisible.value = true

    const traceRes = await getAlertTraceApi(row.id)
    traceData.value = traceRes.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

const handleAlert = (row: AbnormalTransaction) => {
  currentAlert.value = row
  handleForm.action = undefined
  handleForm.remark = ''
  handleDialogVisible.value = true
}

const handleAlertSubmit = async () => {
  if (!handleFormRef.value) return

  try {
    await handleFormRef.value.validate()
  } catch (e) {
    return
  }

  if (!currentAlert.value) return

  submitting.value = true
  try {
    await handleAlertApi(currentAlert.value.id, {
      action: handleForm.action!,
      remark: handleForm.remark || undefined
    })
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    submitting.value = false
  }
}

const handleTrace = (row: AbnormalTransaction) => {
  router.push({
    path: '/risk/monitor/trace',
    query: { alertId: row.id }
  })
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const getRiskLevelType = (level: number) => {
  const option = AlertRiskLevelOptions.find(item => item.value === level)
  return option?.color || 'info'
}

const getAlertStatusType = (status: number) => {
  const option = AlertStatusOptions.find(item => item.value === status)
  return option?.color || 'info'
}

const getInterceptStatusType = (status: number) => {
  const option = InterceptStatusOptions.find(item => item.value === status)
  return option?.color || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.ccb-abnormal-monitor {
  .alert-stats {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .stat-tag {
    margin: 0;
  }

  .money-text {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .detail-content {
    padding: 10px 0;
  }
}
</style>
