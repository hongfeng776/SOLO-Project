<template>
  <div class="ccb-business-device-monitor-fault">
    <CcbPageHeader
      title="设备故障管理"
      description="设备故障监控、告警处理与故障记录全生命周期管理"
      icon="Warning"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card card-pending">
          <div class="stat-label">待处理故障</div>
          <div class="stat-value text-danger">
            {{ statistics.pending_count }}
            <el-tag v-if="statistics.urgent_count > 0" type="danger" effect="dark" size="small" class="urgent-tag">
              紧急 {{ statistics.urgent_count }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">处理中故障</div>
          <div class="stat-value text-warning">{{ statistics.processing_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日故障数</div>
          <div class="stat-value text-primary">{{ statistics.today_fault_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日修复数 / 修复率</div>
          <div class="stat-value">
            <span class="text-success">{{ statistics.today_recovered_count }}</span>
            <span class="stat-divider">/</span>
            <span class="text-info">{{ repairRate }}%</span>
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
            placeholder="故障编号/档案号/SN码/故障代码"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select
            v-model="queryForm.device_type"
            placeholder="请选择"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="opt in DEVICE_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="故障等级">
          <el-select
            v-model="queryForm.fault_level"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in FAULT_LEVEL_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="故障状态">
          <el-select
            v-model="queryForm.fault_status"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in FAULT_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="故障代码">
          <el-input
            v-model="queryForm.fault_code"
            placeholder="请输入"
            clearable
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="归属网点">
          <el-input
            v-model="queryForm.org_id"
            placeholder="请输入"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="是否误报">
          <el-select
            v-model="queryForm.is_false_alarm"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="发生时间">
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
          <span class="card-title">故障记录列表</span>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="selectedRows.length === 0"
              @click="openBatchHandleDialog"
            >
              批量处理
            </el-button>
            <el-button
              type="warning"
              size="small"
              :disabled="selectedRows.length === 0"
              @click="handleBatchFalseAlarm"
            >
              批量标记误报
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
        class="fault-table"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="fault_no" label="故障编号" width="160" show-overflow-tooltip />
        <el-table-column prop="archive_no" label="档案编号" width="160" show-overflow-tooltip />
        <el-table-column prop="sn_code" label="SN码" width="160" show-overflow-tooltip />
        <el-table-column prop="device_type_text" label="设备类型" width="110" />
        <el-table-column prop="fault_level_text" label="故障等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getFaultLevelType(row.fault_level)"
              effect="light"
              size="small"
              :class="{ 'blink-tag': row.fault_level >= 3 }"
            >
              {{ row.fault_level_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fault_code" label="故障代码" width="110" />
        <el-table-column prop="fault_description" label="故障描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="fault_status_text" label="故障状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getFaultStatusType(row.fault_status)"
              effect="light"
              size="small"
            >
              {{ row.fault_status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occur_time" label="发生时间" width="170" />
        <el-table-column prop="duration_minutes" label="持续时长" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.duration_minutes !== undefined && row.duration_minutes !== null">
              {{ formatDuration(row.duration_minutes) }}
            </span>
            <span v-else class="text-info">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_auto_recovered" label="自动恢复" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_auto_recovered ? 'success' : 'info'" effect="light" size="small">
              {{ row.is_auto_recovered ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_false_alarm" label="是否误报" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_false_alarm ? 'warning' : 'success'" effect="light" size="small">
              {{ row.is_false_alarm ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="org_name" label="归属网点" width="120" show-overflow-tooltip />
        <el-table-column prop="handler_name" label="处理人" width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetailDrawer(row)">
              详情
            </el-button>
            <el-button
              v-if="row.fault_status === 0 || row.fault_status === 1"
              type="success"
              link
              size="small"
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
            <el-button
              v-if="!row.is_false_alarm"
              type="warning"
              link
              size="small"
              @click="handleMarkFalseAlarm(row)"
            >
              标记误报
            </el-button>
            <el-button
              v-if="row.fault_status === 0"
              type="info"
              link
              size="small"
              @click="handleIgnore(row)"
            >
              忽略
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
      v-model="handleDialogVisible"
      title="故障处理"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="handleForm" label-width="100px" v-if="currentFault">
        <el-divider content-position="left">故障信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="故障编号">
              <el-text>{{ currentFault.fault_no }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="故障等级">
              <el-tag :type="getFaultLevelType(currentFault.fault_level)" effect="light" size="small">
                {{ currentFault.fault_level_text }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备类型">
              <el-text>{{ currentFault.device_type_text }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="故障代码">
              <el-text>{{ currentFault.fault_code }}</el-text>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="故障描述">
          <el-text>{{ currentFault.fault_description }}</el-text>
        </el-form-item>
        <el-form-item label="发生时间">
          <el-text>{{ currentFault.occur_time }}</el-text>
        </el-form-item>

        <el-divider content-position="left">处理操作</el-divider>
        <el-form-item label="处理状态" required>
          <el-select
            v-model="handleForm.fault_status"
            placeholder="请选择处理状态"
            style="width: 100%"
          >
            <el-option
              v-for="opt in handleStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input
            v-model="handleForm.handle_remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmHandle">
          确认
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawerVisible"
      title="故障详情"
      direction="rtl"
      size="600px"
    >
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detailData">
          <el-divider content-position="left">故障信息</el-divider>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="故障编号">{{ detailData.fault_no }}</el-descriptions-item>
            <el-descriptions-item label="故障状态">
              <el-tag :type="getFaultStatusType(detailData.fault_status)" effect="light" size="small">
                {{ detailData.fault_status_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="故障等级">
              <el-tag :type="getFaultLevelType(detailData.fault_level)" effect="light" size="small">
                {{ detailData.fault_level_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="故障代码">{{ detailData.fault_code }}</el-descriptions-item>
            <el-descriptions-item label="发生时间" :span="2">{{ detailData.occur_time }}</el-descriptions-item>
            <el-descriptions-item label="恢复时间" :span="2">{{ detailData.recover_time || '-' }}</el-descriptions-item>
            <el-descriptions-item label="持续时长">
              {{ detailData.duration_minutes ? formatDuration(detailData.duration_minutes) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="自动恢复">
              {{ detailData.is_auto_recovered ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="是否误报">
              {{ detailData.is_false_alarm ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="处理人">{{ detailData.handler_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="故障描述" :span="2">{{ detailData.fault_description }}</el-descriptions-item>
            <el-descriptions-item label="处理备注" :span="2">{{ detailData.handle_remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">设备信息</el-divider>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="档案编号">{{ detailData.archive_no }}</el-descriptions-item>
            <el-descriptions-item label="SN码">{{ detailData.sn_code }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ detailData.device_type_text }}</el-descriptions-item>
            <el-descriptions-item label="归属网点">{{ detailData.org_name || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">处理记录</el-divider>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in handleLogs"
              :key="index"
              :timestamp="log.created_at"
              :type="log.type"
            >
              <el-card shadow="never" class="log-card">
                <h4>{{ log.title }}</h4>
                <p>{{ log.content }}</p>
                <el-text type="info" size="small">操作人：{{ log.operator }}</el-text>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-divider content-position="left">关联监控日志</el-divider>
          <el-table :data="monitorLogs" border size="small" v-loading="logsLoading">
            <el-table-column prop="log_type_text" label="日志类型" width="120" />
            <el-table-column prop="operation_detail" label="操作详情" min-width="200" show-overflow-tooltip />
            <el-table-column prop="operator_name" label="操作人" width="100" />
            <el-table-column prop="created_at" label="时间" width="170" />
          </el-table>
        </template>
        <el-empty v-else description="加载中..." />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Warning } from '@element-plus/icons-vue'
import { DEVICE_TYPE_OPTIONS } from '@api/deviceArchive'
import {
  FAULT_LEVEL_OPTIONS,
  FAULT_STATUS_OPTIONS,
  type DeviceFaultRecordVO,
  type DeviceFaultQueryParams,
  type FaultStatus,
  type DeviceMonitorLogVO,
  getDeviceFaultListApi,
  getDeviceFaultDetailApi,
  handleDeviceFaultApi,
  getDeviceMonitorLogListApi
} from '@api/deviceMonitor'

const loading = ref(false)
const submitting = ref(false)
const logsLoading = ref(false)
const detailLoading = ref(false)

const tableData = ref<DeviceFaultRecordVO[]>([])
const selectedRows = ref<DeviceFaultRecordVO[]>([])

const queryForm = reactive<DeviceFaultQueryParams & { keyword?: string }>({
  keyword: '',
  device_type: undefined as unknown as DeviceFaultQueryParams['device_type'],
  fault_level: undefined as unknown as DeviceFaultQueryParams['fault_level'],
  fault_status: undefined as unknown as DeviceFaultQueryParams['fault_status'],
  fault_code: '',
  org_id: '',
  is_false_alarm: undefined as unknown as DeviceFaultQueryParams['is_false_alarm']
})

const dateRange = ref<string[]>([])

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const statistics = reactive({
  pending_count: 0,
  processing_count: 0,
  today_fault_count: 0,
  today_recovered_count: 0,
  urgent_count: 0
})

const repairRate = computed(() => {
  if (statistics.today_fault_count === 0) return 0
  return ((statistics.today_recovered_count / statistics.today_fault_count) * 100).toFixed(1)
})

const handleDialogVisible = ref(false)
const currentFault = ref<DeviceFaultRecordVO | null>(null)
const handleForm = reactive({
  fault_status: undefined as unknown as FaultStatus,
  handle_remark: ''
})

const handleStatusOptions = computed(() => {
  return FAULT_STATUS_OPTIONS.filter(opt => opt.value !== 0)
})

const detailDrawerVisible = ref(false)
const detailData = ref<DeviceFaultRecordVO | null>(null)
const handleLogs = ref<Array<{
  title: string
  content: string
  operator: string
  created_at: string
  type: string
}>>([])
const monitorLogs = ref<DeviceMonitorLogVO[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const params: DeviceFaultQueryParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: queryForm.keyword || undefined,
      device_type: queryForm.device_type,
      fault_level: queryForm.fault_level,
      fault_status: queryForm.fault_status,
      fault_code: queryForm.fault_code || undefined,
      org_id: queryForm.org_id || undefined,
      is_false_alarm: queryForm.is_false_alarm,
      start_time: dateRange.value?.[0],
      end_time: dateRange.value?.[1]
    }

    const res = await getDeviceFaultListApi(params)
    tableData.value = res.data.list
    pagination.total = res.data.total

    await fetchStatistics()
  } catch (e) {
    console.error('Failed to fetch fault list:', e)
  } finally {
    loading.value = false
  }
}

const fetchStatistics = async () => {
  try {
    const pendingRes = await getDeviceFaultListApi({
      page: 1,
      page_size: 1,
      fault_status: 0
    })
    statistics.pending_count = pendingRes.data.total

    const urgentRes = await getDeviceFaultListApi({
      page: 1,
      page_size: 1,
      fault_status: 0,
      fault_level: 4
    })
    statistics.urgent_count = urgentRes.data.total

    const processingRes = await getDeviceFaultListApi({
      page: 1,
      page_size: 1,
      fault_status: 1
    })
    statistics.processing_count = processingRes.data.total

    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today} 00:00:00`
    const todayEnd = `${today} 23:59:59`

    const todayFaultRes = await getDeviceFaultListApi({
      page: 1,
      page_size: 1,
      start_time: todayStart,
      end_time: todayEnd
    })
    statistics.today_fault_count = todayFaultRes.data.total

    const todayRecoveredRes = await getDeviceFaultListApi({
      page: 1,
      page_size: 1,
      fault_status: 2,
      start_time: todayStart,
      end_time: todayEnd
    })
    statistics.today_recovered_count = todayRecoveredRes.data.total
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
  queryForm.device_type = undefined as unknown as DeviceFaultQueryParams['device_type']
  queryForm.fault_level = undefined as unknown as DeviceFaultQueryParams['fault_level']
  queryForm.fault_status = undefined as unknown as DeviceFaultQueryParams['fault_status']
  queryForm.fault_code = ''
  queryForm.org_id = ''
  queryForm.is_false_alarm = undefined as unknown as DeviceFaultQueryParams['is_false_alarm']
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

const handleSelectionChange = (selection: DeviceFaultRecordVO[]) => {
  selectedRows.value = selection
}

const getFaultLevelType = (level: number) => {
  const opt = FAULT_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || 'info'
}

const getFaultStatusType = (status: number) => {
  const opt = FAULT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getRowClassName = ({ row }: { row: DeviceFaultRecordVO }) => {
  if (row.fault_level === 4 && row.fault_status === 0) {
    return 'row-urgent'
  }
  if (row.fault_level === 3 && row.fault_status === 0) {
    return 'row-serious'
  }
  if (row.is_false_alarm) {
    return 'row-false-alarm'
  }
  return ''
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
  }
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return `${days}天${remainHours > 0 ? remainHours + '小时' : ''}`
}

const openHandleDialog = (row: DeviceFaultRecordVO) => {
  currentFault.value = row
  handleForm.fault_status = undefined as unknown as FaultStatus
  handleForm.handle_remark = ''
  handleDialogVisible.value = true
}

const openBatchHandleDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要处理的故障记录')
    return
  }
  currentFault.value = null
  handleForm.fault_status = undefined as unknown as FaultStatus
  handleForm.handle_remark = ''
  handleDialogVisible.value = true
}

const confirmHandle = async () => {
  if (handleForm.fault_status === undefined || handleForm.fault_status === null) {
    ElMessage.warning('请选择处理状态')
    return
  }

  try {
    if (currentFault.value) {
      await ElMessageBox.confirm(
        `确认将故障 ${currentFault.value.fault_no} 标记为 ${FAULT_STATUS_OPTIONS.find(o => o.value === handleForm.fault_status)?.label}？`,
        '确认处理',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
      )

      submitting.value = true
      await handleDeviceFaultApi(
        currentFault.value.id,
        handleForm.fault_status,
        handleForm.handle_remark
      )
      ElMessage.success('处理成功')
    } else {
      await ElMessageBox.confirm(
        `确认批量处理 ${selectedRows.value.length} 条故障记录？`,
        '确认批量处理',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
      )

      submitting.value = true
      const promises = selectedRows.value.map(row =>
        handleDeviceFaultApi(row.id, handleForm.fault_status, handleForm.handle_remark)
      )
      await Promise.all(promises)
      ElMessage.success('批量处理成功')
    }

    handleDialogVisible.value = false
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('Failed to handle fault:', e)
    }
  } finally {
    submitting.value = false
  }
}

const handleMarkFalseAlarm = async (row: DeviceFaultRecordVO) => {
  try {
    await ElMessageBox.confirm(
      `确认将故障 ${row.fault_no} 标记为误报？`,
      '确认标记',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )

    await handleDeviceFaultApi(row.id, 3, '标记为误报')
    ElMessage.success('标记成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to mark false alarm:', e)
    }
  }
}

const handleBatchFalseAlarm = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要标记的故障记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${selectedRows.value.length} 条故障标记为误报？`,
      '确认批量标记',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )

    const promises = selectedRows.value.map(row =>
      handleDeviceFaultApi(row.id, 3, '批量标记为误报')
    )
    await Promise.all(promises)
    ElMessage.success('批量标记成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to batch mark false alarm:', e)
    }
  }
}

const handleIgnore = async (row: DeviceFaultRecordVO) => {
  try {
    await ElMessageBox.confirm(
      `确认忽略故障 ${row.fault_no}？`,
      '确认忽略',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )

    await handleDeviceFaultApi(row.id, 3, '忽略故障')
    ElMessage.success('已忽略')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to ignore fault:', e)
    }
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const openDetailDrawer = async (row: DeviceFaultRecordVO) => {
  detailDrawerVisible.value = true
  detailData.value = null
  handleLogs.value = []
  monitorLogs.value = []
  detailLoading.value = true

  try {
    const res = await getDeviceFaultDetailApi(row.id)
    detailData.value = res.data

    handleLogs.value = [
      {
        title: '故障上报',
        content: `故障代码：${res.data.fault_code}，描述：${res.data.fault_description}`,
        operator: '系统',
        created_at: res.data.occur_time,
        type: 'danger'
      }
    ]

    if (res.data.fault_status === 2 || res.data.fault_status === 3) {
      handleLogs.value.push({
        title: res.data.fault_status === 2 ? '故障修复' : '故障忽略',
        content: res.data.handle_remark || '无备注',
        operator: res.data.handler_name || '系统',
        created_at: res.data.recover_time || res.data.created_at || '',
        type: res.data.fault_status === 2 ? 'success' : 'info'
      })
    }

    fetchMonitorLogs(res.data.device_id)
  } catch (e) {
    console.error('Failed to fetch fault detail:', e)
  } finally {
    detailLoading.value = false
  }
}

const fetchMonitorLogs = async (deviceId: string) => {
  logsLoading.value = true
  try {
    const res = await getDeviceMonitorLogListApi({
      device_id: deviceId,
      page: 1,
      page_size: 10
    })
    monitorLogs.value = res.data.list
  } catch (e) {
    console.error('Failed to fetch monitor logs:', e)
  } finally {
    logsLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.fault-table :deep(.el-table__row:hover) {
  transform: scale(1.002);
  transition: transform 0.2s ease;
}

.fault-table :deep(.el-table__row.row-urgent) {
  background-color: #fef0f0 !important;
}

.fault-table :deep(.el-table__row.row-serious) {
  background-color: #fdf6ec !important;
}

.fault-table :deep(.el-table__row.row-false-alarm) {
  background-color: #f4f4f5 !important;
  opacity: 0.7;
}

.blink-tag {
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stat-card {
  height: 100%;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-divider {
  font-size: 16px;
  color: #dcdfe6;
}

.urgent-tag {
  font-size: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(245, 108, 108, 0); }
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

.text-danger {
  color: #f56c6c;
}

.text-info {
  color: #909399;
}

.card-pending {
  border-left: 4px solid #f56c6c;
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

.log-card {
  margin-bottom: 10px;
}

.log-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.log-card p {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #606266;
}
</style>
