<template>
  <div class="ccb-alert-batch">
    <CcbPageHeader
      title="批量告警处理"
      description="批量处理异常交易告警，支持创建批次、查看进度与批次详情"
      icon="Files"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="批次名称" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="请输入批次名称" clearable />
      </el-form-item>
      <el-form-item label="批次类型" prop="batch_type">
        <el-select v-model="searchForm.batch_type" placeholder="请选择批次类型" clearable>
          <el-option v-for="item in AlertBatchTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in AlertBatchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="timeRange">
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
          label="新建批次"
          type="primary"
          :icon="Plus"
          @click="handleCreate"
        />
        <CcbPermissionButton
          label="刷新"
          type="success"
          :icon="Refresh"
          @click="handleRefresh"
        />
      </div>
      <div class="ccb-table-toolbar-right">
        <div class="batch-stats">
          <el-tag type="info" effect="dark" class="stat-tag">待执行: {{ stats.pending }}</el-tag>
          <el-tag type="warning" effect="dark" class="stat-tag">执行中: {{ stats.executing }}</el-tag>
          <el-tag type="success" effect="dark" class="stat-tag">已完成: {{ stats.completed }}</el-tag>
          <el-tag type="danger" effect="dark" class="stat-tag">执行失败: {{ stats.failed }}</el-tag>
        </div>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="false"
      :show-index="true"
      @change="handlePageChange"
    >
      <el-table-column prop="batch_no" label="批次编号" width="180" />
      <el-table-column prop="batch_name" label="批次名称" width="160" show-overflow-tooltip />
      <el-table-column prop="batch_type_text" label="批次类型" width="120" />
      <el-table-column prop="status_text" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getBatchStatusType(row.status)" effect="light" size="small">
            {{ row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_count" label="总数" width="80" align="center" />
      <el-table-column prop="success_count" label="成功数" width="80" align="center">
        <template #default="{ row }">
          <span class="text-success">{{ row.success_count }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="fail_count" label="失败数" width="80" align="center">
        <template #default="{ row }">
          <span class="text-danger" v-if="row.fail_count > 0">{{ row.fail_count }}</span>
          <span v-else>{{ row.fail_count }}</span>
        </template>
      </el-table-column>
      <el-table-column label="进度" width="150">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress || 0"
            :status="row.status === 2 ? 'success' : row.status === 4 ? 'exception' : ''"
            :stroke-width="8"
          />
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="创建人" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="createDialogVisible"
      title="新建批量处理"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-form-item label="批次名称" prop="batch_name">
          <el-input v-model="createForm.batch_name" placeholder="请输入批次名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="批次类型" prop="batch_type">
          <el-select v-model="createForm.batch_type" placeholder="请选择批次类型" style="width: 100%">
            <el-option v-for="item in AlertBatchTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选条件" prop="filter_condition">
          <el-input
            v-model="createForm.filter_condition"
            type="textarea"
            :rows="3"
            placeholder="请输入筛选条件，如：告警类型=高频交易、风险等级≥3等"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreateSubmit">
          创建批次
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawerVisible"
      title="批次详情"
      size="800px"
      direction="rtl"
    >
      <div v-if="detailData" class="detail-content">
        <CcbDetailPanel :data="detailData" :items="detailItems" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  AlertBatchTypeOptions,
  AlertBatchStatusOptions,
  type AlertBatch,
  type AlertBatchQueryParams,
  type CreateAlertBatchRequest,
  getBatchListApi,
  getBatchDetailApi,
  createBatchHandleApi
} from '@api/abnormalMonitor'

const loading = ref(false)
const tableData = ref<AlertBatch[]>([])
const total = ref(0)
const submitting = ref(false)

const stats = reactive({
  pending: 0,
  executing: 0,
  completed: 0,
  failed: 0
})

const searchForm = reactive({
  keyword: '',
  batch_type: undefined as number | undefined,
  status: undefined as number | undefined,
  timeRange: [] as string[]
})

const pageParams = reactive({ page: 1, pageSize: 20 })

const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  batch_name: '',
  batch_type: undefined as number | undefined,
  filter_condition: '',
  remark: ''
})

const createRules: FormRules = {
  batch_name: [{ required: true, message: '请输入批次名称', trigger: 'blur' }],
  batch_type: [{ required: true, message: '请选择批次类型', trigger: 'change' }]
}

const detailDrawerVisible = ref(false)
const detailData = ref<AlertBatch | null>(null)

const detailItems = [
  { prop: 'batch_no', label: '批次编号', span: 2 },
  { prop: 'batch_name', label: '批次名称' },
  { prop: 'batch_type_text', label: '批次类型' },
  { prop: 'status_text', label: '状态' },
  { prop: 'total_count', label: '总数' },
  { prop: 'success_count', label: '成功数' },
  { prop: 'fail_count', label: '失败数' },
  { prop: 'creator_name', label: '创建人' },
  { prop: 'created_at', label: '创建时间', type: 'datetime' as const },
  { prop: 'execute_start_time', label: '执行开始时间', type: 'datetime' as const },
  { prop: 'execute_end_time', label: '执行结束时间', type: 'datetime' as const },
  { prop: 'remark', label: '备注', span: 2 }
]

function getBatchStatusType(status: number): string {
  const option = AlertBatchStatusOptions.find(o => o.value === status)
  return option?.color || 'info'
}

async function loadList() {
  loading.value = true
  try {
    const params: AlertBatchQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      batch_type: searchForm.batch_type,
      status: searchForm.status,
      start_time: searchForm.timeRange?.[0],
      end_time: searchForm.timeRange?.[1]
    }

    const result = await getBatchListApi(params)
    tableData.value = result.list
    total.value = result.total

    stats.pending = result.list.filter(r => r.status === 0).length
    stats.executing = result.list.filter(r => r.status === 1).length
    stats.completed = result.list.filter(r => r.status === 2 || r.status === 3).length
    stats.failed = result.list.filter(r => r.status === 4).length
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.batch_type = undefined
  searchForm.status = undefined
  searchForm.timeRange = []
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

function handleRefresh() {
  loadList()
  ElMessage.success('刷新成功')
}

function handleCreate() {
  createForm.batch_name = ''
  createForm.batch_type = undefined
  createForm.filter_condition = ''
  createForm.remark = ''
  createDialogVisible.value = true
}

async function handleCreateSubmit() {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()
  } catch (e) {
    return
  }

  ElMessageBox.confirm(
    '确定要创建该批量处理批次吗？创建后系统将自动执行批量处理任务。',
    '创建确认',
    {
      confirmButtonText: '确认创建',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    submitting.value = true
    try {
      const request: CreateAlertBatchRequest = {
        batch_name: createForm.batch_name,
        batch_type: createForm.batch_type!,
        filter_condition: createForm.filter_condition || undefined,
        remark: createForm.remark || undefined
      }

      await createBatchHandleApi(request)
      ElMessage.success('批次创建成功')
      createDialogVisible.value = false
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || '创建失败')
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

async function handleViewDetail(row: AlertBatch) {
  try {
    const result = await getBatchDetailApi(row.id)
    detailData.value = result
    detailDrawerVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  }
}

onMounted(() => {
  loadList()
})
</script>

<style lang="scss" scoped>
.ccb-alert-batch {
  .batch-stats {
    display: flex;
    gap: 10px;

    .stat-tag {
      margin-right: 0;
    }
  }

  .text-success {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .text-danger {
    color: var(--el-color-danger);
    font-weight: 600;
  }

  .detail-content {
    padding: 10px 0;
  }
}
</style>
