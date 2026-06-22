<template>
  <div class="ticket-inventory-ops">
    <div class="page-header">
      <div>
        <h2>分时库存配置</h2>
        <div style="color: #909399; font-size: 13px; margin-top: 4px;">
          统筹各游览时段可售名额与场次智能调度，实时联动前台可购买数量
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="过期场次一键清理">
          <el-button :icon="Refresh" @click="handleCheckExpired" v-ripple>清理过期</el-button>
        </el-tooltip>
        <el-tooltip content="查看库存全流程记录">
          <el-button :icon="Clock" @click="openAllTrace" v-ripple>全流程溯源</el-button>
        </el-tooltip>
        <el-tooltip :content="canAdd ? '新增库存' : '无库存配置权限'">
          <el-button type="primary" :icon="Plus" :disabled="!canAdd" @click="handleAdd" v-ripple>新增库存</el-button>
        </el-tooltip>
      </div>
    </div>

    <el-alert v-if="!hasPermission" type="error" show-icon class="permission-alert"
      title="权限不足" :closable="false"
      description="您当前角色没有访问分时库存配置模块的权限，请联系管理员开通。"
    />

    <template v-else>
      <transition name="toast-fade">
        <div v-if="toastVisible" class="inv-update-toast" :class="toastType">
          <div class="toast-card" :class="toastType">
            <div class="toast-title">
              <el-icon><component :is="toastIcon" /></el-icon>
              {{ toastTitle }}
            </div>
            <div class="toast-msg">{{ toastMessage }}</div>
          </div>
        </div>
      </transition>

      <el-row :gutter="16" class="stats-overview">
        <el-col :span="6" v-for="s in statCards" :key="s.key">
          <div class="stats-card">
            <div class="stats-icon" :class="s.key">
              <el-icon><component :is="s.icon" /></el-icon>
            </div>
            <div>
              <div class="stats-value">{{ s.formatter ? s.formatter(stats[s.key]) : stats[s.key] }}</div>
              <div class="stats-label">{{ s.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-tabs v-model="activeSessionType" type="card" class="session-tabs" @tab-change="onSessionTypeChange">
        <el-tab-pane v-for="c in sessionTypeTabs" :key="c.value" :name="c.value">
          <template #label>
            <el-icon><component :is="c.icon" /></el-icon>
            <span>{{ c.label }}</span>
            <el-badge v-if="getSessionCount(c.value) > 0"
              :value="getSessionCount(c.value)"
              :style="{ background: c.color, marginLeft: '8px' }" />
          </template>
        </el-tab-pane>
      </el-tabs>

      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm" @submit.prevent size="default">
          <el-form-item label="所属景点">
            <el-input v-model="filterForm.scenicSpotName" placeholder="景点名称" clearable style="width: 180px;" />
          </el-form-item>
          <el-form-item label="关联票种">
            <el-input v-model="filterForm.ticketTypeName" placeholder="票种名称" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item label="场次日期">
            <el-date-picker v-model="filterForm.sessionDate" type="date" placeholder="选择日期" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker v-model="filterForm.dateRange" type="daterange"
              range-separator="至" start-placeholder="开始" end-placeholder="结束"
              value-format="YYYY-MM-DD" clearable style="width: 280px;" />
          </el-form-item>
          <el-form-item label="库存状态">
            <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px;">
              <el-option v-for="s in Object.values(InventoryStatusEnum)" :key="s.value"
                :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" v-ripple>查询</el-button>
            <el-button :icon="Refresh" @click="resetFilter" v-ripple>重置</el-button>
            <el-button :icon="Calendar" @click="viewMode = viewMode === 'table' ? 'calendar' : 'table'" v-ripple>
              {{ viewMode === 'table' ? '日历视图' : '列表视图' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <inventory-batch-toolbar
        v-if="selectedIds.length > 0"
        :selected-ids="selectedIds"
        :selected-count="selectedIds.length"
        :session-type="activeSessionType"
        @success="onBatchSuccess"
        @refresh="fetchList"
      />

      <div v-if="viewMode === 'calendar'" class="calendar-view">
        <div class="calendar-header">
          <div class="cal-nav">
            <el-button size="small" :icon="ArrowLeft" circle @click="changeMonth(-1)" />
            <div class="current-month">{{ currentMonthLabel }}</div>
            <el-button size="small" :icon="ArrowRight" circle @click="changeMonth(1)" />
            <el-button size="small" @click="jumpToToday">今天</el-button>
          </div>
          <div class="cal-legend">
            <span class="legend-item"><span class="dot good"></span>库存充足</span>
            <span class="legend-item"><span class="dot warn"></span>库存紧张</span>
            <span class="legend-item"><span class="dot danger"></span>售罄/锁定</span>
            <span class="legend-item"><span class="dot holiday"></span>节假日</span>
          </div>
        </div>
        <div class="calendar-grid">
          <div v-for="(wd, idx) in weekDays" :key="'w'+idx" class="cal-weekday" :class="{ weekend: idx >= 5 }">
            {{ wd }}
          </div>
          <div v-for="(day, idx) in calendarDays" :key="'d'+idx" class="cal-day"
            :class="{
              'other-month': !day.inMonth,
              'selected': filterForm.sessionDate === day.date,
              'today': day.isToday,
              'holiday': day.isHoliday
            }"
            @click="selectCalendarDay(day)"
          >
            <div class="day-num">{{ day.day }}</div>
            <div class="day-stats" v-if="day.invCount > 0">
              <div class="stat-line">
                <span>总：{{ day.totalQuota }}</span>
                <span>余：{{ day.available }}</span>
              </div>
              <div class="sold-rate">
                <div class="rate-inner" :class="getRateClass(day.soldRate)" :style="{ width: day.soldRate + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="session-table-card" v-else>
        <div class="card-title">
          <span>场次库存列表</span>
          <span style="font-size: 13px; color: #8c8c8c; font-weight: normal;">共 {{ total }} 条记录</span>
        </div>

        <el-table :data="tableList" v-loading="loading" class="inventory-table"
          @selection-change="onSelectionChange"
          :row-key="row => row.id"
          :row-class-name="getRowClassName"
          border stripe
        >
          <el-table-column type="selection" width="55" fixed="left" />
          <el-table-column label="场次信息" width="280">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <el-tag size="small" effect="dark" :color="getSessionTypeInfo(row.sessionType).color">
                  {{ getSessionTypeInfo(row.sessionType).label }}
                </el-tag>
                <span style="font-weight: 600;">{{ row.sessionName || row.startTime + '-' + row.endTime }}</span>
              </div>
              <div style="font-size: 12px; color: #8c8c8c;">
                <el-icon><Calendar /></el-icon> {{ row.sessionDate }}
                <el-icon style="margin-left: 10px;"><Clock /></el-icon> {{ row.startTime }} - {{ row.endTime }}
              </div>
              <div style="font-size: 12px; color: #595959; margin-top: 4px;">
                景点：{{ row.scenicSpot?.name || '-' }}
                <span style="margin-left: 8px;">票种：{{ row.ticketType?.name || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="库存配额" width="260">
            <template #default="{ row }">
              <div style="margin-bottom: 8px;">
                <span class="quota-text">总配额</span>
                <span :class="{ 'over-quota': row.isOverQuota }">{{ row.totalQuota }}</span>
                <span v-if="row.isOverQuota" style="color: #ff4d4f; margin-left: 4px; font-size: 12px;">（超额）</span>
                <span v-else-if="row.totalQuota > 0" class="valid-check" style="margin-left: 4px;">
                  <el-icon><CircleCheckFilled /></el-icon>
                </span>
              </div>
              <div class="quota-bar">
                <div class="bar-bg">
                  <div class="bar-fill" :class="getRateClass(row.sellRate)" :style="{ width: row.sellRate + '%' }"></div>
                </div>
                <span class="quota-text">已售 {{ row.sellRate }}%</span>
              </div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 6px;">
                已预约:{{ row.reservedCount }} · 已核销:{{ row.usedCount }} · 锁定:{{ row.lockedCount }} · 可用:<b :class="{ 'over-quota': row.availableCount < 10 }">{{ row.availableCount }}</b>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :class="getStatusTag(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
              <el-tag v-if="row.requiresReview" size="small" type="warning" effect="dark" style="margin-top: 4px;">待复核</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="预约规则" width="180">
            <template #default="{ row }">
              <div style="font-size: 12px; line-height: 1.8;">
                <div>提前{{ row.minAdvanceHours }}小时预约</div>
                <div>最长提前{{ row.maxAdvanceDays }}天</div>
                <div>开场前{{ row.autoCloseMinutes }}分钟关闭</div>
                <div>单订单限{{ row.perOrderLimit }}张</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="预警" width="80" align="center">
            <template #default="{ row }">
              <el-tooltip v-if="row.fakeIndicator" content="虚假库存标记" placement="top">
                <el-icon color="#ff4d4f" style="font-size: 18px;"><WarningFilled /></el-icon>
              </el-tooltip>
              <el-tooltip v-else-if="row.isOverQuota" content="超额配置" placement="top">
                <el-icon color="#faad14" style="font-size: 18px;"><Warning /></el-icon>
              </el-tooltip>
              <el-tooltip v-else-if="row.warningMessage" :content="row.warningMessage" placement="top">
                <el-icon color="#faad14" style="font-size: 18px;"><InfoFilled /></el-icon>
              </el-tooltip>
              <span v-else style="color: #d9d9d9;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link :icon="Edit" @click="handleEdit(row)" v-ripple>调整</el-button>
              <el-button v-if="row.status === 'active'" size="small" type="warning" link :icon="Lock" @click="handleLock(row)" v-ripple>锁定</el-button>
              <el-button v-else-if="row.status === 'locked'" size="small" type="success" link :icon="Unlock" @click="handleUnlock(row)" v-ripple>解锁</el-button>
              <el-button v-if="row.fakeIndicator || row.isOverQuota" size="small" type="danger" link :icon="CircleCheckFilled" @click="handleVerify(row)" v-ripple>审核</el-button>
              <el-button size="small" type="info" link :icon="Clock" @click="openTrace(row)" v-ripple>溯源</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="padding: 16px 0; text-align: right;">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
            :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[15, 30, 50, 100]"
            @current-change="fetchList" @size-change="onSizeChange" />
        </div>
      </div>
    </template>

    <inventory-edit-dialog
      v-model="editDialogVisible"
      :edit-data="currentEditData"
      :session-type="activeSessionType"
      @success="onEditSuccess"
    />

    <inventory-trace-panel
      v-model="traceVisible"
      :inventory-id="currentTraceId"
      :is-global="isGlobalTrace"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Search, Refresh, Clock, Lock, Unlock, Calendar,
  ArrowLeft, ArrowRight, CircleCheckFilled, Warning, WarningFilled, InfoFilled, Bell
} from '@element-plus/icons-vue'
import {
  getTicketInventoryList, getTicketInventoryStats, setInventoryStatus,
  verifyInventory, checkExpiredInventory
} from '@/api/ticketInventory'
import {
  InventorySessionTypeEnum, InventoryStatusEnum
} from '@/utils/enums'
import InventoryEditDialog from './TicketInventoryEditDialog.vue'
import InventoryBatchToolbar from './TicketInventoryBatchToolbar.vue'
import InventoryTracePanel from './TicketInventoryTracePanel.vue'

const hasPermission = ref(true)
const canAdd = ref(true)
const loading = ref(false)
const tableList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)
const stats = reactive({ totalQuota: 0, availableCount: 0, soldOut: 0, locked: 0 })

const viewMode = ref('table')
const activeSessionType = ref('daily')
const selectedIds = ref([])
const highlightIds = ref(new Set())
const refreshRowIds = ref(new Set())

const filterForm = reactive({
  scenicSpotName: '',
  ticketTypeName: '',
  sessionDate: '',
  dateRange: [],
  status: ''
})

const editDialogVisible = ref(false)
const currentEditData = ref(null)
const traceVisible = ref(false)
const currentTraceId = ref(null)
const isGlobalTrace = ref(false)

const toastVisible = ref(false)
const toastType = ref('success')
const toastTitle = ref('')
const toastMessage = ref('')
const toastIcon = computed(() => toastType.value === 'success' ? CircleCheckFilled : (toastType.value === 'warn' ? Warning : WarningFilled))

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const currentMonth = ref(new Date())
const calendarDays = ref([])
const monthlyStats = reactive({})

const sessionTypeTabs = computed(() => Object.values(InventorySessionTypeEnum))
const statCards = [
  { key: 'totalQuota', label: '总配额', icon: 'Tickets', formatter: (v) => v.toLocaleString() },
  { key: 'availableCount', label: '可售库存', icon: 'CircleCheck', formatter: (v) => v.toLocaleString() },
  { key: 'soldOut', label: '售罄场次', icon: 'Warning', formatter: (v) => v },
  { key: 'locked', label: '已锁定', icon: 'Lock', formatter: (v) => v }
]

const currentMonthLabel = computed(() => {
  const d = currentMonth.value
  return `${d.getFullYear()}年 ${d.getMonth() + 1}月`
})

const getSessionTypeInfo = (t) => InventorySessionTypeEnum[t] || {}
const getStatusLabel = (s) => InventoryStatusEnum[s]?.label || s
const getStatusTag = (s) => InventoryStatusEnum[s]?.tagClass || ''
const getSessionCount = (t) => {
  if (!tableList.value.length) return 0
  return tableList.value.filter(r => r.sessionType === t).length
}

const getRateClass = (rate) => {
  if (rate >= 90) return 'high'
  if (rate >= 60) return 'mid'
  return 'low'
}

const getRowClassName = ({ row }) => {
  const classes = []
  if (selectedIds.value.includes(row.id)) classes.push('row-selected')
  if (highlightIds.value.has(row.id)) classes.push('row-highlight')
  if (refreshRowIds.value.has(row.id)) classes.push('partial-refresh')
  return classes.join(' ')
}

const showToast = (type, title, msg, duration = 3000) => {
  toastType.value = type
  toastTitle.value = title
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, duration)
}

const fetchStats = async () => {
  try {
    const params = {}
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.sessionDateFrom = filterForm.dateRange[0]
      params.sessionDateTo = filterForm.dateRange[1]
    }
    const r = await getTicketInventoryStats(params)
    const data = r.data || []
    stats.totalQuota = data.reduce((s, d) => s + (d.totalQuota || 0), 0)
    const available = data.reduce((s, d) => s + ((d.totalQuota || 0) - (d.reservedCount || 0) - (d.usedCount || 0) - (d.lockedCount || 0)), 0)
    stats.availableCount = available
    stats.soldOut = tableList.value.filter(r => r.status === 'sold_out' || r.status === 'closed' || r.status === 'expired').length
    stats.locked = tableList.value.filter(r => r.status === 'locked').length
  } catch (e) { /* ignore */ }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      sessionType: activeSessionType.value !== 'all' ? activeSessionType.value : undefined,
      ...filterForm
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.sessionDateFrom = filterForm.dateRange[0]
      params.sessionDateTo = filterForm.dateRange[1]
      delete params.dateRange
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
    })
    const r = await getTicketInventoryList(params)
    tableList.value = r.data?.list || []
    total.value = r.data?.total || 0
    fetchStats()
    if (viewMode.value === 'calendar') buildCalendar()
  } finally { loading.value = false }
}

const buildCalendar = () => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekDay = firstDay.getDay() || 7
  const daysInMonth = lastDay.getDate()

  const days = []
  const today = new Date()
  const todayStr = formatDate(today)

  for (let i = startWeekDay - 1; i > 0; i--) {
    const d = new Date(year, month, -i + 1)
    days.push({ date: formatDate(d), day: d.getDate(), inMonth: false, isToday: false, isHoliday: false, invCount: 0, totalQuota: 0, available: 0, soldRate: 0 })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDate(d)
    const inv = tableList.value.find(r => r.sessionDate === dateStr) || {}
    const totalQuota = inv.totalQuota || 0
    const reserved = inv.reservedCount || 0
    const used = inv.usedCount || 0
    const locked = inv.lockedCount || 0
    const available = totalQuota - reserved - used - locked
    const soldRate = totalQuota > 0 ? Math.round(((reserved + used) / totalQuota) * 100) : 0

    days.push({
      date: dateStr,
      day: i,
      inMonth: true,
      isToday: dateStr === todayStr,
      isHoliday: d.getDay() === 0 || d.getDay() === 6 || isKnownHoliday(dateStr),
      invCount: inv.id ? 1 : 0,
      totalQuota,
      available,
      soldRate
    })
  }

  const remain = 42 - days.length
  for (let i = 1; i <= remain; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: formatDate(d), day: i, inMonth: false, isToday: false, isHoliday: false, invCount: 0, totalQuota: 0, available: 0, soldRate: 0 })
  }

  calendarDays.value = days
}

const formatDate = (d) => {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const isKnownHoliday = (dateStr) => {
  const simpleHolidays = ['2026-01-01', '2026-02-17', '2026-04-06', '2026-05-01', '2026-06-19', '2026-10-01']
  return simpleHolidays.includes(dateStr)
}

const changeMonth = (delta) => {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + delta)
  currentMonth.value = d
  buildCalendar()
}

const jumpToToday = () => {
  currentMonth.value = new Date()
  buildCalendar()
}

const selectCalendarDay = (day) => {
  filterForm.sessionDate = day.date
  viewMode.value = 'table'
  fetchList()
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    scenicSpotName: '',
    ticketTypeName: '',
    sessionDate: '',
    dateRange: [],
    status: ''
  })
  page.value = 1
  fetchList()
}

const onSessionTypeChange = (val) => {
  activeSessionType.value = val
  page.value = 1
  fetchList()
}

const onSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  fetchList()
}

const onSelectionChange = (rows) => {
  selectedIds.value = rows.map(r => r.id)
}

const triggerRowRefresh = (id) => {
  refreshRowIds.value.add(id)
  setTimeout(() => refreshRowIds.value.delete(id), 1200)
}

const triggerRowHighlight = (id) => {
  highlightIds.value.add(id)
  setTimeout(() => highlightIds.value.delete(id), 3000)
}

const handleAdd = () => {
  currentEditData.value = null
  editDialogVisible.value = true
}

const handleEdit = (row) => {
  currentEditData.value = row
  editDialogVisible.value = true
}

const handleLock = async (row) => {
  try {
    await ElMessageBox.confirm(`确定锁定场次 "${row.sessionName || row.startTime + '-' + row.endTime}" 吗？锁定后将停止对外售卖。`, '提示', { type: 'warning' })
    await setInventoryStatus(row.id, 'locked', '人工锁定')
    triggerRowRefresh(row.id)
    triggerRowHighlight(row.id)
    showToast('success', '场次已锁定', '库存状态已更新，前台将停止该场次售卖')
    fetchList()
  } catch (e) { /* ignore cancel */ }
}

const handleUnlock = async (row) => {
  try {
    await ElMessageBox.confirm(`确定解锁场次 "${row.sessionName || row.startTime + '-' + row.endTime}" 吗？解锁后将恢复对外售卖。`, '提示', { type: 'warning' })
    await setInventoryStatus(row.id, 'active', '人工解锁')
    triggerRowRefresh(row.id)
    triggerRowHighlight(row.id)
    showToast('success', '场次已解锁', '库存状态已更新，前台将恢复该场次售卖')
    fetchList()
  } catch (e) { /* ignore cancel */ }
}

const handleVerify = async (row) => {
  try {
    const { value: verifyType } = await ElMessageBox({
      title: '库存审核',
      message: `请选择对场次 "${row.sessionName || row.startTime + '-' + row.endTime}" 的审核结论：`,
      confirmButtonText: '通过',
      cancelButtonText: '驳回',
      distinguishCancelAndClose: true,
      showInput: true,
      inputPlaceholder: '请输入审核意见',
      type: 'warning'
    })
    await verifyInventory(row.id, 'pass', verifyType)
    triggerRowRefresh(row.id)
    showToast('success', '审核完成', '库存状态已更新')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') {
      try {
        await verifyInventory(row.id, 'block', e)
        showToast('warn', '已驳回', '库存已强制锁定')
        fetchList()
      } catch (e2) { /* ignore */ }
    }
  }
}

const handleCheckExpired = async () => {
  try {
    await ElMessageBox.confirm('确定清理所有已过期场次吗？系统将自动标记过期场次状态并同步至前台。', '提示', { type: 'warning' })
    const r = await checkExpiredInventory()
    showToast('success', '清理完成', `已处理 ${r.data?.updatedCount || 0} 条过期场次`)
    fetchList()
  } catch (e) { /* ignore */ }
}

const onEditSuccess = (data) => {
  fetchList()
  if (data && data.id) {
    triggerRowRefresh(data.id)
    triggerRowHighlight(data.id)
  }
  const msg = currentEditData.value ? '库存调整已生效' : '库存创建成功'
  showToast('success', msg, '前台可购买数量、预约状态已同步更新')
}

const onBatchSuccess = (data) => {
  fetchList()
  showToast('success', '批量操作完成', `成功 ${data.success} 条，失败 ${data.failed} 条，已同步更新前台展示`)
  selectedIds.value = []
}

const openTrace = (row) => {
  currentTraceId.value = row.id
  isGlobalTrace.value = false
  traceVisible.value = true
}

const openAllTrace = () => {
  currentTraceId.value = null
  isGlobalTrace.value = true
  traceVisible.value = true
}

onMounted(() => {
  fetchList()
})
</script>
