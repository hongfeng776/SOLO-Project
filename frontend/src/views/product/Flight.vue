<template>
  <div class="flight-manage">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">航班总数</div>
        <div class="stat-value">{{ stats.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已上架</div>
        <div class="stat-value" style="color: #52c41a">{{ stats.online || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">可售中</div>
        <div class="stat-value" style="color: #52c41a">{{ stats.onSale || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">延误航班</div>
        <div class="stat-value" style="color: #faad14">{{ stats.delayed || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">取消航班</div>
        <div class="stat-value" style="color: #ff4d4f">{{ stats.cancelled || 0 }}</div>
      </div>
    </div>

    <div class="type-tabs">
      <el-tabs v-model="activeType" @tab-change="handleTypeChange">
        <el-tab-pane label="全部航班" name="all">
          <span class="type-tab-badge">{{ stats.total || 0 }}</span>
        </el-tab-pane>
        <el-tab-pane label="国内航班" name="1">
          <span class="type-tab-badge">{{ stats.typeStats?.domestic || 0 }}</span>
        </el-tab-pane>
        <el-tab-pane label="国际航班" name="2">
          <span class="type-tab-badge">{{ stats.typeStats?.international || 0 }}</span>
        </el-tab-pane>
        <el-tab-pane label="中转航班" name="3">
          <span class="type-tab-badge">{{ stats.typeStats?.transfer || 0 }}</span>
        </el-tab-pane>
        <el-tab-pane label="包机航班" name="4">
          <span class="type-tab-badge">{{ stats.typeStats?.charter || 0 }}</span>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="page-header">
      <h2>航班资源管控</h2>
      <div>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增航班</el-button>
        <el-button :icon="Refresh" style="margin-left: 8px" @click="fetchData">刷新</el-button>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="航班号">
          <el-input v-model="searchForm.flightNo" placeholder="请输入航班号" clearable />
        </el-form-item>
        <el-form-item label="航线编码">
          <el-input v-model="searchForm.routeCode" placeholder="请输入航线编码" clearable />
        </el-form-item>
        <el-form-item label="出发机场">
          <el-input v-model="searchForm.departureAirportCode" placeholder="三字码，如PEK" clearable />
        </el-form-item>
        <el-form-item label="到达机场">
          <el-input v-model="searchForm.arrivalAirportCode" placeholder="三字码，如SHA" clearable />
        </el-form-item>
        <el-form-item label="运营状态">
          <el-select v-model="searchForm.operationStatus" placeholder="请选择" clearable style="width: 140px">
            <el-option
              v-for="(item, key) in FlightOperationStatusEnum"
              :key="key"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="展示状态">
          <el-select v-model="searchForm.displayStatus" placeholder="请选择" clearable style="width: 120px">
            <el-option label="已上架" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker
            v-model="searchForm.departureDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <FlightBatchToolbar
      :selected-ids="selectedIds"
      :selected-count="selectedCount"
      @refresh="fetchData"
      @clear="clearSelection"
    />

    <div class="table-container" :class="{ 'table-fade-refresh': isRefreshing }">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        border
        stripe
        class="sticky-table-header"
        @selection-change="handleSelectionChange"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="selection" width="50" fixed="left" />
        <el-table-column prop="id" label="ID" width="70" fixed="left" />
        <el-table-column label="航班号" width="130" fixed="left">
          <template #default="{ row }">
            <div style="font-weight: 600; font-size: 15px">{{ row.flightNo }}</div>
            <div style="font-size: 11px; color: #909399">{{ row.airline }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <span
              class="flight-type-tag"
              :style="{ backgroundColor: getFlightTypeInfo(row.flightType).color + '20', color: getFlightTypeInfo(row.flightType).color }"
            >
              <el-icon><component :is="getFlightTypeInfo(row.flightType).icon" /></el-icon>
              {{ getFlightTypeInfo(row.flightType).label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="航线信息" min-width="260">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 12px">
              <div>
                <div style="font-weight: 600">{{ row.departureAirportCode }}</div>
                <div style="font-size: 12px; color: #909399">{{ row.departure }}</div>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center">
                <div style="font-size: 11px; color: #909399; margin-bottom: 2px">
                  {{ formatDuration(row.flightDuration) }}
                </div>
                <div style="width: 100%; height: 1px; background-color: #dcdfe6; position: relative">
                  <el-icon style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background-color: #fff; color: #1890ff; padding: 0 4px">
                    <Promotion />
                  </el-icon>
                </div>
                <div style="font-size: 11px; color: #909399; margin-top: 2px">
                  {{ row.routeCode }}
                </div>
              </div>
              <div style="text-align: right">
                <div style="font-weight: 600">{{ row.arrivalAirportCode }}</div>
                <div style="font-size: 12px; color: #909399">{{ row.arrival }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="起降时间" width="180">
          <template #default="{ row }">
            <div>
              <div style="color: #303133; font-size: 13px">
                {{ formatTime(row.departureTime) }} → {{ formatTime(row.arrivalTime) }}
              </div>
              <div style="font-size: 11px; color: #909399; margin-top: 2px">
                {{ formatShortDate(row.departureTime) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="机型" width="110">
          <template #default="{ row }">
            {{ row.aircraftType }}
          </template>
        </el-table-column>
        <el-table-column label="价格/库存" width="140">
          <template #default="{ row }">
            <div>
              <div style="color: #ff4d4f; font-weight: 600">¥{{ row.price }}</div>
              <div style="font-size: 12px; color: #909399; margin-top: 2px">
                余票: <span :style="{ color: row.seats <= 10 ? '#ff4d4f' : '#606266', fontWeight: row.seats <= 10 ? 600 : 400 }">
                  {{ row.seats }}
                </span> / {{ row.seatCount }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="运营状态" width="110">
          <template #default="{ row }">
            <div class="operation-status-tag" :class="getOperationStatusClass(row.operationStatus)">
              <span class="status-dot" :style="{ backgroundColor: getOperationStatusInfo(row.operationStatus).color }"></span>
              {{ getOperationStatusInfo(row.operationStatus).label }}
              <span v-if="row.operationStatus === 2 && row.delayMinutes" style="font-size: 11px">
                +{{ row.delayMinutes }}m
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="展示状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.displayStatus === 1"
              @change="(val) => handleToggleDisplayStatus(row, val)"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleStatusCommand(cmd, row)">
              <el-button type="warning" link size="small">
                变更状态<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ status: 1, row }">恢复正常</el-dropdown-item>
                  <el-dropdown-item :command="{ status: 2, row }">标记延误</el-dropdown-item>
                  <el-dropdown-item :command="{ status: 3, row }">取消航班</el-dropdown-item>
                  <el-dropdown-item :command="{ status: 4, row }">标记备降</el-dropdown-item>
                  <el-dropdown-item :command="{ status: 5, row }">标记返航</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <FlightEditDialog
      v-model="editDialogVisible"
      :flight-data="currentEditFlight"
      @success="fetchData"
    />

    <FlightDetailDialog
      v-model="detailDialogVisible"
      :flight-id="currentDetailFlightId"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  RefreshRight,
  Promotion,
  ArrowDown,
  Airplane,
  Global,
  Connection
} from '@element-plus/icons-vue'
import {
  getFlightList,
  deleteFlight,
  getFlightStats,
  updateFlightDisplayStatus,
  updateFlightOperationStatus
} from '@/api/flight'
import {
  FlightTypeEnum,
  FlightOperationStatusEnum
} from '@/utils/enums'
import FlightBatchToolbar from '@/components/Flight/FlightBatchToolbar.vue'
import FlightEditDialog from '@/components/Flight/FlightEditDialog.vue'
import FlightDetailDialog from '@/components/Flight/FlightDetailDialog.vue'

const loading = ref(false)
const isRefreshing = ref(false)
const tableRef = ref(null)
const selectedIds = ref([])
const selectedCount = ref(0)

const stats = ref({
  total: 0,
  online: 0,
  onSale: 0,
  delayed: 0,
  cancelled: 0,
  typeStats: { domestic: 0, international: 0, transfer: 0, charter: 0 }
})

const activeType = ref('all')

const searchForm = reactive({
  flightNo: '',
  routeCode: '',
  departureAirportCode: '',
  arrivalAirportCode: '',
  operationStatus: null,
  displayStatus: null,
  departureDate: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const editDialogVisible = ref(false)
const currentEditFlight = ref(null)
const detailDialogVisible = ref(false)
const currentDetailFlightId = ref(null)

const getFlightTypeInfo = (type) => {
  const key = Object.keys(FlightTypeEnum).find(k => FlightTypeEnum[k].value === type)
  const info = FlightTypeEnum[key] || FlightTypeEnum.DOMESTIC
  const iconMap = { 1: Airplane, 2: Global, 3: Connection, 4: Promotion }
  return { ...info, icon: iconMap[type] || Airplane }
}

const getOperationStatusInfo = (status) => {
  const key = Object.keys(FlightOperationStatusEnum).find(k => FlightOperationStatusEnum[k].value === status)
  return FlightOperationStatusEnum[key] || FlightOperationStatusEnum.NORMAL
}

const getOperationStatusClass = (status) => {
  const map = { 1: 'normal', 2: 'delayed', 3: 'cancelled', 4: '', 5: '' }
  return map[status] || ''
}

const tableRowClassName = ({ row }) => {
  if (selectedIds.value.includes(row.id)) {
    return 'selected-row-shadow'
  }
  return ''
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatShortDate = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m}m`
}

const handleTypeChange = () => {
  pagination.page = 1
  fetchData()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.flightNo = ''
  searchForm.routeCode = ''
  searchForm.departureAirportCode = ''
  searchForm.arrivalAirportCode = ''
  searchForm.operationStatus = null
  searchForm.displayStatus = null
  searchForm.departureDate = ''
  pagination.page = 1
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(r => r.id)
  selectedCount.value = selection.length
}

const clearSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  selectedIds.value = []
  selectedCount.value = 0
}

const handleAdd = () => {
  currentEditFlight.value = null
  editDialogVisible.value = true
}

const handleEdit = (row) => {
  currentEditFlight.value = { ...row }
  editDialogVisible.value = true
}

const handleDetail = (row) => {
  currentDetailFlightId.value = row.id
  detailDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除航班 "${row.flightNo}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    await deleteFlight(row.id)
    ElMessage.success('删除成功')
    fetchData()
    fetchStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

const handleToggleDisplayStatus = async (row, val) => {
  try {
    await updateFlightDisplayStatus(row.id, val ? 1 : 0)
    ElMessage.success(val ? '上架成功' : '下架成功')
    row.displayStatus = val ? 1 : 0
    row.status = val ? 1 : 0
    fetchStats()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
    row.displayStatus = row.displayStatus
  }
}

const handleStatusCommand = async (cmd) => {
  const { status, row } = cmd
  const statusInfo = getOperationStatusInfo(status)
  let extraData = {}

  try {
    if (status === 2) {
      const { value } = await ElMessageBox.prompt(
        `请输入延误时长（分钟）`,
        `标记航班 ${row.flightNo} 为延误`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /^\d+$/,
          inputErrorMessage: '请输入有效的分钟数'
        }
      )
      extraData.delayMinutes = Number(value)
    } else if (status === 3) {
      const { value } = await ElMessageBox.prompt(
        `请输入取消原因`,
        `取消航班 ${row.flightNo}`,
        {
          confirmButtonText: '确定取消',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入取消原因'
        }
      )
      extraData.cancelReason = value
    } else {
      await ElMessageBox.confirm(
        `确定要将航班 ${row.flightNo} 状态变更为「${statusInfo.label}」吗？`,
        '确认操作',
        { type: 'warning' }
      )
    }

    await updateFlightOperationStatus(row.id, status, extraData)
    ElMessage.success('状态更新成功')
    triggerFadeRefresh()
    fetchData()
    fetchStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  }
}

const triggerFadeRefresh = () => {
  isRefreshing.value = true
  setTimeout(() => {
    isRefreshing.value = false
  }, 400)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    if (activeType.value !== 'all') {
      params.flightType = Number(activeType.value)
    }
    const res = await getFlightList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getFlightStats()
    stats.value = res.data || stats.value
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
  fetchStats()
})
</script>
