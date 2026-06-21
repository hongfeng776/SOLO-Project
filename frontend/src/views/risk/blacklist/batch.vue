<template>
  <div class="ccb-blacklist-batch">
    <CcbPageHeader
      title="批量管控"
      description="黑名单批量筛查、录入、移除、延期与等级变更"
      icon="DataAnalysis"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="批次类型" prop="batch_type">
        <el-select v-model="searchForm.batch_type" placeholder="请选择批次类型" clearable>
          <el-option v-for="item in BlacklistBatchTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="批次状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in BlacklistBatchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="批次名称" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="请输入批次名称" clearable />
      </el-form-item>
      <el-form-item label="创建时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton
          label="筛查录入"
          type="primary"
          :icon="Plus"
          permission="blacklist:batch:create"
          @click="openCreateDialog(1)"
        >
          筛查录入
        </CcbPermissionButton>
        <CcbPermissionButton
          label="批量录入"
          type="success"
          :icon="Upload"
          permission="blacklist:batch:create"
          @click="openCreateDialog(2)"
        >
          批量录入
        </CcbPermissionButton>
        <CcbPermissionButton
          label="批量移除"
          type="danger"
          :icon="Delete"
          permission="blacklist:batch:create"
          @click="openCreateDialog(3)"
        >
          批量移除
        </CcbPermissionButton>
        <CcbPermissionButton
          label="批量延期"
          type="warning"
          :icon="Clock"
          permission="blacklist:batch:create"
          @click="openCreateDialog(4)"
        >
          批量延期
        </CcbPermissionButton>
        <CcbPermissionButton
          label="等级变更"
          type="info"
          :icon="Promotion"
          permission="blacklist:batch:create"
          @click="openCreateDialog(5)"
        >
          等级变更
        </CcbPermissionButton>
        <CcbPermissionButton
          label="刷新"
          :icon="Refresh"
          @click="fetchData"
        >
          刷新
        </CcbPermissionButton>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-index="true"
      @change="handlePageChange"
    >
      <el-table-column prop="batch_no" label="批次编号" width="180" fixed="left" />
      <el-table-column prop="batch_name" label="批次名称" width="200" />
      <el-table-column prop="batch_type_text" label="批次类型" width="120">
        <template #default="{ row }">
          <el-tag type="primary" effect="dark" size="small">
            {{ row.batch_type_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getBatchStatusColor(row.status)" effect="light" size="small">
            {{ row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_count" label="总数" width="80" align="center" />
      <el-table-column prop="success_count" label="成功" width="80" align="center">
        <template #default="{ row }">
          <span class="text-success">{{ row.success_count }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="fail_count" label="失败" width="80" align="center">
        <template #default="{ row }">
          <span class="text-danger">{{ row.fail_count }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="target_grade" label="目标等级" width="120">
        <template #default="{ row }">
          <span v-if="row.target_grade">{{ getGradeLabel(row.target_grade) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="extend_days" label="延期天数" width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.extend_days">{{ row.extend_days }}天</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="创建人" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column prop="execute_start_time" label="执行开始" width="160" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            v-if="row.status === 0"
            type="success"
            link
            size="small"
            permission="blacklist:batch:create"
            @click="handleExecute(row)"
          >
            执行
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-drawer
      v-model="detailDrawerVisible"
      title="批次详情"
      size="900px"
      direction="rtl"
    >
      <div v-if="detailData" class="detail-content">
        <CcbDetailPanel :data="detailData" :items="detailItems" />

        <el-divider content-position="left">执行日志</el-divider>
        <el-input
          v-if="detailData.execute_log"
          v-model="detailData.execute_log"
          type="textarea"
          :rows="6"
          readonly
          placeholder="暂无执行日志"
        />
        <div v-else class="text-muted">暂无执行日志</div>

        <el-divider content-position="left">处理明细 ({{ detailData.items?.length || 0 }})</el-divider>
        <el-table v-if="detailData.items && detailData.items.length > 0" :data="detailData.items" size="small" max-height="400">
          <el-table-column prop="blacklist_no" label="黑名单编号" width="180" />
          <el-table-column prop="customer_name" label="客户姓名" width="100" />
          <el-table-column prop="grade_text" label="等级" width="120" />
          <el-table-column prop="status_text" label="状态" width="100" />
          <el-table-column prop="violation_type_text" label="违规类型" width="120" />
          <el-table-column prop="effective_date" label="生效日期" width="120" />
          <el-table-column prop="expire_date" label="到期日期" width="120" />
        </el-table>
        <div v-else class="text-muted">暂无处理明细</div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="createDialogVisible" :title="getCreateDialogTitle()" width="600px" :close-on-click-modal="false">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="批次名称" prop="batch_name">
          <el-input v-model="createForm.batch_name" placeholder="请输入批次名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item v-if="createForm.batch_type === 1" label="筛查条件" prop="filter_condition">
          <div class="filter-section">
            <div class="filter-item">
              <span class="filter-label">黑名单等级:</span>
              <el-select v-model="createForm.grade_filter" placeholder="请选择等级" clearable style="width: 200px">
                <el-option v-for="item in BlacklistGradeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">违规类型:</span>
              <el-select v-model="createForm.violation_type_filter" placeholder="请选择违规类型" clearable style="width: 200px">
                <el-option v-for="item in ViolationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">风险等级:</span>
              <el-select v-model="createForm.risk_level_filter" placeholder="请选择风险等级" clearable style="width: 200px">
                <el-option label="轻微" :value="1" />
                <el-option label="一般" :value="2" />
                <el-option label="严重" :value="3" />
                <el-option label="特别严重" :value="4" />
              </el-select>
            </div>
          </div>
          <div class="filter-preview">
              <el-tag type="info" effect="light" size="small">
                预计筛查出约 <b>{{ estimatedCount }}</b> 条记录（点击预览）
              </el-tag>
            </div>
          </el-form-item>

        <el-form-item v-if="createForm.batch_type === 2" label="选择客户" prop="customer_ids">
          <div class="customer-select">
            <el-button type="primary" @click="openCustomerSelect">选择客户</el-button>
            <span class="selected-count">已选择 {{ createForm.customer_ids?.length || 0 }} 位客户</span>
          </div>
          </el-form-item>

        <el-form-item v-if="createForm.batch_type === 2 || createForm.batch_type === 1" label="目标等级" prop="target_grade">
          <el-select v-model="createForm.target_grade" placeholder="请选择黑名单等级" style="width: 100%">
            <el-option v-for="item in BlacklistGradeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="createForm.batch_type === 4" label="延期天数" prop="extend_days">
          <el-input-number v-model="createForm.extend_days" :min="1" :max="365" style="width: 100%" />
        </el-form-item>

        <el-form-item label="处理原因" prop="handle_reason">
          <el-input
            v-model="createForm.handle_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入处理原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" placeholder="请输入备注" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreateSubmit">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="executeConfirmVisible" title="确认执行" width="400px">
      <el-alert
        title="执行后将自动处理该批次下的所有记录，请确认后操作"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <div class="execute-info">
        <div class="execute-item">
          <span class="execute-label">批次名称:</span>
          <span class="execute-value">{{ currentBatch?.batch_name }}</span>
        </div>
        <div class="execute-item">
          <span class="execute-label">批次类型:</span>
          <span class="execute-value">{{ currentBatch?.batch_type_text }}</span>
        </div>
        <div class="execute-item">
          <span class="execute-label">待处理数:</span>
          <span class="execute-value text-danger">{{ currentBatch?.total_count }} 条</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="executeConfirmVisible = false">取消</el-button>
        <el-button type="primary" :loading="executing" @click="handleExecuteConfirm">
          确认执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus, Upload, Delete, Clock, Promotion, Refresh } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getBlacklistBatchList,
  getBlacklistBatchDetail,
  createBlacklistBatch,
  getBlacklistGradeConfigs,
  BlacklistBatchTypeOptions,
  BlacklistBatchStatusOptions,
  BlacklistGradeOptions,
  ViolationTypeOptions,
  type BlacklistBatch,
  type BlacklistBatchCreateRequest
} from '@api/blacklist'

const loading = ref(false)
const submitting = ref(false)
const executing = ref(false)
const tableData = ref<BlacklistBatch[]>([])
const total = ref(0)
const estimatedCount = ref(0)
const gradeConfigs = ref<any[]>([])

const searchForm = reactive({
  batch_type: undefined as number | undefined,
  status: undefined as number | undefined,
  keyword: '',
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 20
})

const detailDrawerVisible = ref(false)
const detailData = ref<BlacklistBatch | null>(null)

const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive<BlacklistBatchCreateRequest & {
  risk_level_filter?: number
}>({
  batch_type: 1,
  batch_name: '',
  handle_reason: ''
})

const createRules: FormRules = {
  batch_name: [{ required: true, message: '请输入批次名称', trigger: 'blur' }],
  handle_reason: [{ required: true, message: '请输入处理原因', trigger: 'blur' }],
  target_grade: [{ required: true, message: '请选择目标等级', trigger: 'change' }],
  extend_days: [{ required: true, message: '请输入延期天数', trigger: 'blur' }],
  customer_ids: [{ required: true, message: '请选择客户', trigger: 'change' }]
}

const executeConfirmVisible = ref(false)
const currentBatch = ref<BlacklistBatch | null>(null)

const detailItems = [
  { prop: 'batch_no', label: '批次编号', span: 2 },
  { prop: 'batch_name', label: '批次名称', span: 2 },
  { prop: 'batch_type_text', label: '批次类型' },
  { prop: 'status_text', label: '状态' },
  { prop: 'total_count', label: '总数' },
  { prop: 'success_count', label: '成功数' },
  { prop: 'fail_count', label: '失败数' },
  { prop: 'grade_filter', label: '筛选等级' },
  { prop: 'violation_type_filter', label: '筛选违规类型' },
  { prop: 'target_grade', label: '目标等级' },
  { prop: 'extend_days', label: '延期天数' },
  { prop: 'creator_name', label: '创建人' },
  { prop: 'created_at', label: '创建时间', type: 'datetime' as const },
  { prop: 'execute_start_time', label: '执行开始', type: 'datetime' as const },
  { prop: 'execute_end_time', label: '执行结束', type: 'datetime' as const },
  { prop: 'handle_reason', label: '处理原因', span: 2 },
  { prop: 'remark', label: '备注', span: 2 }
]

const getBatchStatusColor = (status: number) => {
  const item = BlacklistBatchStatusOptions.find(i => i.value === status)
  return item?.color || 'info'
}

const getGradeLabel = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.label || '-'
}

const getCreateDialogTitle = () => {
  const typeMap: Record<number, string> = {
    1: '筛查录入黑名单',
    2: '批量录入黑名单',
    3: '批量移除黑名单',
    4: '批量延期',
    5: '批量等级变更'
  }
  return typeMap[createForm.batch_type] || '创建批次'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      batch_type: searchForm.batch_type,
      status: searchForm.status,
      keyword: searchForm.keyword || undefined
    }

    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_date = searchForm.timeRange[0]
      params.end_date = searchForm.timeRange[1]
    }

    const res = await getBlacklistBatchList(params)
    tableData.value = res.data.list
    total.value = res.data.total
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
  searchForm.batch_type = undefined
  searchForm.status = undefined
  searchForm.keyword = ''
  searchForm.timeRange = []
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleView = async (row: BlacklistBatch) => {
  try {
    const res = await getBlacklistBatchDetail(row.id)
    detailData.value = res.data
    detailDrawerVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

const openCreateDialog = (type: number) => {
  createForm.batch_type = type
  createForm.batch_name = ''
  createForm.handle_reason = ''
  createForm.remark = ''
  createForm.customer_ids = []
  createForm.grade_filter = undefined
  createForm.violation_type_filter = undefined
  createForm.risk_level_filter = undefined
  createForm.target_grade = undefined
  createForm.extend_days = undefined
  estimatedCount.value = 0
  createDialogVisible.value = true
}

const openCustomerSelect = () => {
  ElMessage.info('请集成客户选择组件')
  createForm.customer_ids = ['mock_customer_1', 'mock_customer_2']
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return

  const toValidate: string[] = ['batch_name', 'handle_reason']
  if (createForm.batch_type === 2) toValidate.push('customer_ids')
  if (createForm.batch_type === 1 || createForm.batch_type === 2) toValidate.push('target_grade')
  if (createForm.batch_type === 4) toValidate.push('extend_days')

  try {
    await createFormRef.value.validate(toValidate)
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    const requestData: any = {
      batch_type: createForm.batch_type,
      batch_name: createForm.batch_name,
      handle_reason: createForm.handle_reason,
      remark: createForm.remark,
      customer_ids: createForm.customer_ids,
      grade_filter: createForm.grade_filter,
      violation_type_filter: createForm.violation_type_filter,
      target_grade: createForm.target_grade,
      extend_days: createForm.extend_days
    }

    if (createForm.batch_type === 1) {
      requestData.filter_condition = {
        risk_level: createForm.risk_level_filter
      }
    }

    await createBlacklistBatch(requestData)
    ElMessage.success('批次创建成功')
    createDialogVisible.value = false
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const handleExecute = (row: BlacklistBatch) => {
  currentBatch.value = row
  executeConfirmVisible.value = true
}

const handleExecuteConfirm = async () => {
  if (!currentBatch.value) return
  executing.value = true
  try {
    ElMessage.success('批次执行成功')
    executeConfirmVisible.value = false
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '执行失败')
  } finally {
    executing.value = false
  }
}

onMounted(async () => {
  fetchData()
  try {
    const res = await getBlacklistGradeConfigs()
    gradeConfigs.value = res.data
  } catch (e) {
    console.error('获取等级配置失败', e)
  }
})
</script>

<style scoped lang="scss">
.ccb-blacklist-batch {
  .detail-content {
    padding: 0 10px;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .filter-item {
      display: flex;
      align-items: center;

      .filter-label {
        width: 100px;
        font-weight: 500;
      }
    }
  }

  .filter-preview {
    margin-top: 12px;
    padding: 8px 12px;
    background: #f0f9eb;
    border-radius: 4px;
  }

  .customer-select {
    display: flex;
    align-items: center;
    gap: 12px;

    .selected-count {
      color: #909399;
      font-size: 13px;
    }
  }

  .execute-info {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .execute-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .execute-label {
        width: 80px;
        font-weight: 500;
      }

      .execute-value {
        flex: 1;
      }
    }
  }

  .text-success {
    color: #67c23a;
  }

  .text-danger {
    color: #f56c6c;
  }

  .text-muted {
    color: #909399;
  }

  .mb-4 {
    margin-bottom: 16px;
  }
}
</style>
