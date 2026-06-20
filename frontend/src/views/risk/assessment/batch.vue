<template>
  <div class="ccb-risk-assessment-batch">
    <CcbPageHeader
      title="批量风险等级复评"
      description="批量风险等级复评管理，支持创建复评批次、查看批次进度、批次详情"
      icon="Files"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="批次名称" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="请输入批次名称" clearable />
      </el-form-item>
      <el-form-item label="批次类型" prop="batch_type">
        <el-select v-model="searchForm.batch_type" placeholder="请选择批次类型" clearable>
          <el-option v-for="item in BatchTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in BatchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-button type="primary" :icon="Plus" @click="handleCreate">新建批次</el-button>
        <el-button type="success" :icon="Refresh" @click="handleRefresh">刷新</el-button>
        <el-button type="warning" :icon="Download" @click="handleExport">导出</el-button>
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
      <el-table-column prop="batch_type_text" label="批次类型" width="140" />
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
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 2"
            type="success"
            link
            size="small"
            @click="handleViewResult(row)"
          >
            查看结果
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="createDialogVisible"
      title="新建复评批次"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-form-item label="批次名称" prop="batch_name">
          <el-input v-model="createForm.batch_name" placeholder="请输入批次名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="批次类型" prop="batch_type">
          <el-select v-model="createForm.batch_type" placeholder="请选择批次类型" style="width: 100%">
            <el-option v-for="item in BatchTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="复评策略" prop="review_frequency_strategy">
          <el-select v-model="createForm.review_frequency_strategy" placeholder="请选择复评策略" style="width: 100%">
            <el-option v-for="item in ReviewFrequencyStrategyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选条件" prop="filter_condition">
          <el-input
            v-model="createForm.filter_condition"
            type="textarea"
            :rows="3"
            placeholder="请输入筛选条件，如：风险等级为中高风险以上、近30天有异常交易等"
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
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="批次编号">{{ detailData.batch_no }}</el-descriptions-item>
          <el-descriptions-item label="批次名称">{{ detailData.batch_name }}</el-descriptions-item>
          <el-descriptions-item label="批次类型">{{ detailData.batch_type_text }}</el-descriptions-item>
          <el-descriptions-item label="复评策略">{{ detailData.review_frequency_strategy_text }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getBatchStatusType(detailData.status)" effect="light" size="small">
              {{ detailData.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="执行进度">
            <el-progress
              :percentage="detailData.progress || 0"
              :status="detailData.status === 2 ? 'success' : detailData.status === 4 ? 'exception' : ''"
              :stroke-width="8"
            />
          </el-descriptions-item>
          <el-descriptions-item label="总数">{{ detailData.total_count }}</el-descriptions-item>
          <el-descriptions-item label="成功数">
            <span class="text-success">{{ detailData.success_count }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败数">
            <span class="text-danger" v-if="detailData.fail_count > 0">{{ detailData.fail_count }}</span>
            <span v-else>{{ detailData.fail_count }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detailData.creator_name }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailData.created_at }}</el-descriptions-item>
          <el-descriptions-item label="执行开始时间">{{ detailData.execute_start_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行结束时间">{{ detailData.execute_end_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="筛选条件" :span="2">
            {{ detailData.filter_condition || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ detailData.remark || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">执行日志</el-divider>
        <el-input
          v-model="detailData.execute_log"
          type="textarea"
          :rows="8"
          readonly
          placeholder="暂无执行日志"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Download } from '@element-plus/icons-vue'
import {
  BatchTypeOptions,
  BatchStatusOptions,
  ReviewFrequencyStrategyOptions,
  type RiskAssessmentBatch,
  type RiskAssessmentBatchQueryParams,
  type BatchRiskAssessmentRequest,
  getBatchAssessmentListApi,
  getBatchAssessmentDetailApi,
  createBatchAssessmentApi
} from '@api/riskAssessment'

const router = useRouter()

const loading = ref(false)
const tableData = ref<RiskAssessmentBatch[]>([])
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
  review_frequency_strategy: undefined as number | undefined,
  filter_condition: '',
  remark: ''
})

const createRules: FormRules = {
  batch_name: [{ required: true, message: '请输入批次名称', trigger: 'blur' }],
  batch_type: [{ required: true, message: '请选择批次类型', trigger: 'change' }]
}

const detailDrawerVisible = ref(false)
const detailData = ref<RiskAssessmentBatch | null>(null)

function getBatchStatusType(status: number): string {
  const option = BatchStatusOptions.find(o => o.value === status)
  return option?.color || 'info'
}

async function loadList() {
  loading.value = true
  try {
    const params: RiskAssessmentBatchQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      batch_type: searchForm.batch_type,
      status: searchForm.status,
      start_time: searchForm.timeRange?.[0],
      end_time: searchForm.timeRange?.[1]
    }

    const result = await getBatchAssessmentListApi(params)
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

function handleExport() {
  ElMessage.info('导出功能开发中')
}

function handleCreate() {
  createForm.batch_name = ''
  createForm.batch_type = undefined
  createForm.review_frequency_strategy = undefined
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
    '确定要创建该复评批次吗？创建后系统将自动执行复评任务。',
    '创建确认',
    {
      confirmButtonText: '确认创建',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    submitting.value = true
    try {
      const request: BatchRiskAssessmentRequest = {
        batch_name: createForm.batch_name,
        batch_type: createForm.batch_type!,
        review_frequency_strategy: createForm.review_frequency_strategy,
        filter_condition: createForm.filter_condition || undefined,
        remark: createForm.remark || undefined
      }

      await createBatchAssessmentApi(request)
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

async function handleViewDetail(row: RiskAssessmentBatch) {
  try {
    const result = await getBatchAssessmentDetailApi(row.id)
    detailData.value = result
    detailDrawerVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  }
}

function handleViewResult(row: RiskAssessmentBatch) {
  router.push({
    path: '/risk/assessment',
    query: { batch_id: row.id }
  })
}

onMounted(() => {
  loadList()
})
</script>

<style lang="scss" scoped>
.ccb-risk-assessment-batch {
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
