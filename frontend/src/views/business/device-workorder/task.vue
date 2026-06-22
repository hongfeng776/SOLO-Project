<template>
  <div class="ccb-business-device-workorder-task">
    <CcbPageHeader
      title="批量运维任务"
      description="批量创建设备运维任务，统一管理多设备运维计划与执行进度"
      icon="List"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">任务总数</span>
            <el-icon class="stat-icon primary-icon"><Files /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-primary">{{ statistics.total_count || 0 }}</span>
          </div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>本月新增：{{ statistics.today_created_count || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">执行中</span>
            <el-icon class="stat-icon primary-icon"><Loading /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-primary">{{ statistics.running_count || 0 }}</span>
          </div>
          <div class="stat-progress">
            <el-progress
              :percentage="runningProgress"
              :stroke-width="6"
              color="#409eff"
              show-text="false"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">已完成</span>
            <el-icon class="stat-icon success-icon"><CircleCheck /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-success">{{ statistics.completed_count || 0 }}</span>
          </div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>本月完成：{{ statistics.today_completed_count || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">完成率</span>
            <el-icon class="stat-icon success-icon"><DataAnalysis /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-success">{{ completionRate }}%</span>
          </div>
          <div class="stat-ring">
            <svg viewBox="0 0 100 100" class="ring-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e4e7ed" stroke-width="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#67c23a" stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="completionRateOffset"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">筛选条件</span>
      </template>
      <el-form :model="queryForm" inline>
        <el-form-item label="关键字">
          <el-input
            v-model="queryForm.keyword"
            placeholder="任务编号/任务名称/备注"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="工单类型">
          <el-select
            v-model="queryForm.order_type"
            placeholder="请选择"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="opt in WORK_ORDER_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="queryForm.task_status"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in TASK_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人">
          <el-input
            v-model="queryForm.assignee_id"
            placeholder="处理人ID/姓名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <div class="card-header-flex">
          <span class="card-title">运维任务列表</span>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              :icon="Plus"
              @click="openCreateDialog"
              v-permission="'business:device-workorder:task-create'"
            >
              创建任务
            </el-button>
            <el-button size="small" :icon="Refresh" @click="refreshData">
              刷新
            </el-button>
            <el-button size="small" :icon="Download" @click="handleExport">
              导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        class="task-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="task_no" label="任务编号" width="180" show-overflow-tooltip />
        <el-table-column prop="task_name" label="任务名称" width="180" show-overflow-tooltip />
        <el-table-column label="工单类型" width="110">
          <template #default="{ row }">
            <el-tag :type="getOrderType(row.order_type)" effect="light" size="small">
              {{ row.order_type_text || getOrderTypeLabel(row.order_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getTaskStatusType(row.task_status)"
              effect="light"
              size="small"
              :class="{ 'blink-tag': row.task_status === 2 }"
            >
              {{ row.task_status_text || getTaskStatusLabel(row.task_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress || 0"
                :stroke-width="10"
                :color="getProgressColor(row.progress)"
                :status="row.task_status === 3 ? 'success' : undefined"
              />
              <span class="progress-text">{{ row.progress || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="完成情况" width="160">
          <template #default="{ row }">
            <div class="count-cell">
              <span class="count-item">
                <span class="count-label">总数</span>
                <span class="count-value text-primary">{{ row.total_count || 0 }}</span>
              </span>
              <span class="count-item">
                <span class="count-label">已完成</span>
                <span class="count-value text-success">{{ row.completed_count || 0 }}</span>
              </span>
              <span class="count-item">
                <span class="count-label">待处理</span>
                <span class="count-value text-warning">{{ row.pending_count || 0 }}</span>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="执行周期" width="220">
          <template #default="{ row }">
            <div class="date-cell">
              <div class="date-start">
                <span class="date-label">开始：</span>
                <span>{{ row.start_date || '-' }}</span>
              </div>
              <div class="date-end">
                <span class="date-label">结束：</span>
                <span>{{ row.end_date || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" effect="light" size="small">
              {{ row.priority_text || getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="处理人" width="100" show-overflow-tooltip />
        <el-table-column prop="creator_name" label="创建人" width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.task_status === 0 || row.task_status === 1"
              type="warning" link size="small"
              @click="handleCancel(row)"
              v-permission="'business:device-workorder:task-cancel'"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="创建批量运维任务"
      width="640px"
      class="create-dialog"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="120px" ref="createFormRef">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="任务名称" required>
          <el-input v-model="createForm.task_name" placeholder="请输入任务名称" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="工单类型" required>
          <el-select v-model="createForm.order_type" placeholder="请选择工单类型" style="width: 100%">
            <el-option v-for="opt in WORK_ORDER_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="createForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="createForm.assignee_id" placeholder="请输入处理人ID" />
        </el-form-item>

        <el-divider content-position="left">设备筛选条件</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备类型">
              <el-select v-model="createForm.device_type" placeholder="请选择设备类型" clearable style="width: 100%">
                <el-option v-for="opt in DEVICE_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属网点">
              <el-input v-model="createForm.org_id" placeholder="请输入网点ID" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="老旧设备">
              <el-select v-model="createForm.is_old_device" placeholder="请选择" clearable style="width: 100%">
                <el-option label="是" :value="1" />
                <el-option label="否" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="故障频次 ≥">
              <el-input-number v-model="createForm.fault_frequency_min" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="使用年限 ≥">
              <el-input-number v-model="createForm.min_usage_years" :min="0" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用年限 ≤">
              <el-input-number v-model="createForm.max_usage_years" :min="0" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">任务时间</el-divider>
        <el-form-item label="任务时间范围" required>
          <el-date-picker
            v-model="createForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="请输入任务备注" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      title="任务详情"
      width="720px"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border class="mb15">
          <el-descriptions-item label="任务编号">{{ currentDetail.task_no }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentDetail.task_name }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">
            <el-tag :type="getOrderType(currentDetail.order_type)" effect="light" size="small">
              {{ currentDetail.order_type_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getTaskStatusType(currentDetail.task_status)" effect="light" size="small">
              {{ currentDetail.task_status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentDetail.priority)" effect="light" size="small">
              {{ currentDetail.priority_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentDetail.assignee_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentDetail.creator_name }}</el-descriptions-item>
          <el-descriptions-item label="归属网点">{{ currentDetail.org_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentDetail.start_date }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentDetail.end_date }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4 class="section-title">执行进度</h4>
          <div class="progress-detail">
            <el-progress
              :percentage="currentDetail.progress || 0"
              :stroke-width="18"
              :color="getProgressColor(currentDetail.progress)"
              :status="currentDetail.task_status === 3 ? 'success' : undefined"
            />
            <div class="progress-stats">
              <div class="progress-stat">
                <span class="stat-label">总设备数</span>
                <span class="stat-value text-primary">{{ currentDetail.total_count || 0 }}</span>
              </div>
              <div class="progress-stat">
                <span class="stat-label">已完成</span>
                <span class="stat-value text-success">{{ currentDetail.completed_count || 0 }}</span>
              </div>
              <div class="progress-stat">
                <span class="stat-label">待处理</span>
                <span class="stat-value text-warning">{{ currentDetail.pending_count || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="currentDetail.remark">
          <h4 class="section-title">任务备注</h4>
          <div class="remark-content">{{ currentDetail.remark }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  Files,
  Loading,
  CircleCheck,
  DataAnalysis,
  TrendCharts,
  Search,
  Plus,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { DEVICE_TYPE_OPTIONS } from '@api/deviceArchive'
import {
  WORK_ORDER_TYPE_OPTIONS,
  TASK_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  type DeviceMaintenanceTaskVO,
  type MaintenanceTaskQueryParams,
  type WorkOrderType,
  type TaskStatus,
  type CreateBatchTaskRequest,
  getMaintenanceTaskListApi,
  getMaintenanceTaskDetailApi,
  createBatchTaskApi
} from '@api/deviceWorkOrder'

const loading = ref(false)
const createLoading = ref(false)

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const currentDetail = ref<DeviceMaintenanceTaskVO | null>(null)

const tableData = ref<DeviceMaintenanceTaskVO[]>([])
const dateRange = ref<string[]>([])

const queryForm = reactive<MaintenanceTaskQueryParams & { keyword?: string }>({
  keyword: '',
  order_type: undefined,
  task_status: undefined,
  assignee_id: undefined
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const statistics = reactive({
  total_count: 0,
  running_count: 0,
  completed_count: 0,
  today_created_count: 0,
  today_completed_count: 0
})

const circumference = 2 * Math.PI * 42

const completionRate = computed(() => {
  if (!statistics.total_count) return 0
  return Math.round((statistics.completed_count / statistics.total_count) * 100)
})

const completionRateOffset = computed(() => {
  return circumference - (completionRate.value / 100) * circumference
})

const runningProgress = computed(() => {
  if (!statistics.total_count) return 0
  return Math.round((statistics.running_count / statistics.total_count) * 100)
})

const createFormRef = ref()
const createForm = reactive({
  task_name: '',
  order_type: 1 as WorkOrderType,
  priority: 2 as number,
  assignee_id: '',
  device_type: undefined as number | undefined,
  org_id: '',
  is_old_device: undefined as number | undefined,
  fault_frequency_min: undefined as number | undefined,
  min_usage_years: undefined as number | undefined,
  max_usage_years: undefined as number | undefined,
  dateRange: [] as string[],
  remark: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: MaintenanceTaskQueryParams = {
      page: pagination.page,
      pageSize: pagination.page_size,
      keyword: queryForm.keyword || undefined,
      order_type: queryForm.order_type,
      task_status: queryForm.task_status,
      assignee_id: queryForm.assignee_id || undefined,
      start_time: dateRange.value?.[0],
      end_time: dateRange.value?.[1]
    }
    const res = await getMaintenanceTaskListApi(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
    fetchStatistics()
  } catch (e) {
    console.error('Failed to fetch maintenance task list:', e)
  } finally {
    loading.value = false
  }
}

const fetchStatistics = async () => {
  try {
    const totalRes = await getMaintenanceTaskListApi({ page: 1, pageSize: 1 })
    statistics.total_count = totalRes.data.total

    const runningRes = await getMaintenanceTaskListApi({ page: 1, pageSize: 1, task_status: 2 })
    statistics.running_count = runningRes.data.total

    const completedRes = await getMaintenanceTaskListApi({ page: 1, pageSize: 1, task_status: 3 })
    statistics.completed_count = completedRes.data.total

    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today} 00:00:00`
    const todayEnd = `${today} 23:59:59`

    const createdRes = await getMaintenanceTaskListApi({ page: 1, pageSize: 1, start_time: todayStart, end_time: todayEnd })
    statistics.today_created_count = createdRes.data.total

    const completedTodayRes = await getMaintenanceTaskListApi({ page: 1, pageSize: 1, task_status: 3, start_time: todayStart, end_time: todayEnd })
    statistics.today_completed_count = completedTodayRes.data.total
  } catch (e) {
    console.error('Failed to fetch statistics:', e)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.keyword = ''
  queryForm.order_type = undefined
  queryForm.task_status = undefined
  queryForm.assignee_id = undefined
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

const handleSizeChange = (size: number) => {
  pagination.page_size = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const getRowClassName = ({ row }: { row: DeviceMaintenanceTaskVO }) => {
  if (row.task_status === 2) {
    return 'row-running'
  }
  if (row.task_status === 3) {
    return 'row-completed'
  }
  return ''
}

const getOrderType = (type: WorkOrderType) => {
  const opt = WORK_ORDER_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.type || 'info'
}

const getOrderTypeLabel = (type: WorkOrderType) => {
  const opt = WORK_ORDER_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getTaskStatusType = (status: TaskStatus) => {
  const opt = TASK_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getTaskStatusLabel = (status: TaskStatus) => {
  const opt = TASK_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getPriorityType = (priority: number) => {
  const opt = PRIORITY_OPTIONS.find(o => o.value === priority)
  return opt?.type || 'info'
}

const getPriorityLabel = (priority: number) => {
  const opt = PRIORITY_OPTIONS.find(o => o.value === priority)
  return opt?.label || '未知'
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#67c23a'
  if (progress >= 70) return '#67c23a'
  if (progress >= 40) return '#409eff'
  if (progress >= 20) return '#e6a23c'
  return '#f56c6c'
}

const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const openCreateDialog = () => {
  Object.assign(createForm, {
    task_name: '',
    order_type: 1,
    priority: 2,
    assignee_id: '',
    device_type: undefined,
    org_id: '',
    is_old_device: undefined,
    fault_frequency_min: undefined,
    min_usage_years: undefined,
    max_usage_years: undefined,
    dateRange: [],
    remark: ''
  })
  showCreateDialog.value = true
}

const submitCreate = async () => {
  if (!createForm.task_name) {
    ElMessage.warning('请填写任务名称')
    return
  }
  if (!createForm.dateRange || createForm.dateRange.length !== 2) {
    ElMessage.warning('请选择任务时间范围')
    return
  }
  createLoading.value = true
  try {
    const requestData: CreateBatchTaskRequest = {
      task_name: createForm.task_name,
      order_type: createForm.order_type,
      device_type: createForm.device_type,
      org_id: createForm.org_id || undefined,
      is_old_device: createForm.is_old_device,
      fault_frequency_min: createForm.fault_frequency_min,
      min_usage_years: createForm.min_usage_years,
      max_usage_years: createForm.max_usage_years,
      start_date: createForm.dateRange[0],
      end_date: createForm.dateRange[1],
      priority: createForm.priority,
      assignee_id: createForm.assignee_id || undefined,
      remark: createForm.remark || undefined
    }
    await createBatchTaskApi(requestData)
    ElMessage.success('批量运维任务创建成功')
    showCreateDialog.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to create batch task:', e)
  } finally {
    createLoading.value = false
  }
}

const handleDetail = async (row: DeviceMaintenanceTaskVO) => {
  try {
    const res = await getMaintenanceTaskDetailApi(row.id)
    currentDetail.value = res.data
    showDetailDialog.value = true
  } catch (e) {
    console.error('Failed to fetch task detail:', e)
  }
}

const handleCancel = async (row: DeviceMaintenanceTaskVO) => {
  try {
    await ElMessageBox.confirm(
      `确认取消任务 ${row.task_name}？`,
      '确认取消',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    ElMessage.success('任务已取消')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to cancel task:', e)
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.ccb-business-device-workorder-task {
  padding: 16px;
}

.stat-card {
  height: 100%;
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.stat-icon {
  font-size: 22px;
}

.primary-icon {
  color: #409eff;
}

.success-icon {
  color: #67c23a;
}

.warning-icon {
  color: #e6a23c;
}

.stat-value-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.stat-progress {
  margin-top: 8px;
}

.stat-ring {
  position: relative;
  width: 60px;
  height: 60px;
  margin-top: 4px;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.card-title {
  font-weight: 600;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  min-width: 40px;
}

.count-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.count-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.count-label {
  color: #909399;
}

.count-value {
  font-weight: 600;
}

.date-cell {
  line-height: 1.6;
  font-size: 12px;
}

.date-label {
  color: #909399;
}

.blink-tag {
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.task-table :deep(.el-table__row.row-running) {
  background-color: #ecf5ff !important;
}

.task-table :deep(.el-table__row.row-completed) {
  background-color: #f0f9eb !important;
}

.mb15 {
  margin-bottom: 15px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.detail-content {
  padding-right: 10px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.progress-detail {
  padding: 10px 0;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.remark-content {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  line-height: 1.6;
}
</style>
