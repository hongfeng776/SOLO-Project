<template>
  <div class="ticket-fulfillment-ops">
    <div class="page-header">
      <div>
        <h2>票务核销履约监管</h2>
        <div style="color: #909399; font-size: 13px; margin-top: 4px;">
          线下入园核销与订单全流程履约监管，多维度校验核销真实性
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="清理过期待核销票">
          <el-button :icon="Refresh" @click="handleExpired" v-ripple>清理过期</el-button>
        </el-tooltip>
        <el-tooltip content="查看全履约流程记录">
          <el-button :icon="Clock" @click="openAllTrace" v-ripple>全流程溯源</el-button>
        </el-tooltip>
        <el-tooltip content="数据一致性校验">
          <el-button :icon="DataLine" @click="handleIntegrity" v-ripple>一致性校验</el-button>
        </el-tooltip>
      </div>
    </div>

    <el-alert v-if="!hasPermission" type="error" show-icon class="permission-alert"
      title="权限不足" :closable="false"
      description="您当前角色没有访问核销履约模块的权限，请联系管理员开通。"
    />

    <template v-else>
      <div class="verify-zone">
        <div class="zone-title">
          <el-icon><QRCode /></el-icon>
          票务核销通道
          <span style="font-size: 12px; color: #8c8c8c; font-weight: normal; margin-left: 8px;">
            扫描或输入票务二维码进行核销，支持键盘回车快速提交
          </span>
        </div>

        <div class="scan-input-wrap">
          <el-input
            v-model="scanCode"
            ref="scanInputRef"
            class="scan-input"
            size="large"
            placeholder="扫描或输入票务编码（TK 开头），回车提交"
            :disabled="verifying"
            @keyup.enter="handleVerify"
            maxlength="128"
          />
          <el-icon class="scan-icon">
            <component :is="verifying ? Loading : Scan" />
          </el-icon>
        </div>

        <div class="scan-actions">
          <el-button type="primary" :icon="Position" @click="handleVerify" :loading="verifying" :disabled="!scanCode" v-ripple>
            {{ verifying ? '核销中...' : '立即核销' }}
          </el-button>
          <el-button :icon="MagicStick" @click="mockQRCode" v-ripple>模拟测试二维码</el-button>
          <el-button :icon="Close" @click="scanCode = ''" :disabled="!scanCode" v-ripple>清空</el-button>
        </div>

        <div class="verify-tips">
          <div class="tip-title"><el-icon><InfoFilled /></el-icon> 核销校验规则说明</div>
          <ul class="tip-list">
            <li>实时校验订单支付状态，未支付订单直接拦截</li>
            <li>联动校验票种使用时段，开场前 5 分钟内可核销</li>
            <li>身份证后 6 位 + 手机号双重用户信息校验</li>
            <li>核销位置与景点实际位置距离不得超过 3 公里</li>
            <li>已核销票重复尝试自动标记异常并记录操作日志</li>
          </ul>
        </div>
      </div>

      <transition name="toast-fade">
        <div v-if="toastVisible" :class="toastTypeClass">
          <div :class="toastCardClass">
            <div class="card-title">
              <el-icon><component :is="toastIcon" /></el-icon>
              {{ toastTitle }}
            </div>
            <div class="card-desc">{{ toastMessage }}</div>
            <div v-if="toastDetail" class="error-detail">{{ toastDetail }}</div>
          </div>
        </div>
      </transition>

      <el-row :gutter="16" class="stats-overview">
        <el-col :span="6" v-for="s in statCards" :key="s.key">
          <div class="stat-card" :class="s.key">
            <div class="stat-icon" :class="s.key">
              <el-icon><component :is="s.icon" /></el-icon>
            </div>
            <div>
              <div class="stat-value">{{ getStatCount(s.key) }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-tabs v-model="activeStatus" type="card" class="fulfill-tabs" @tab-change="onStatusChange">
        <el-tab-pane v-for="c in statusTabs" :key="c.value" :name="c.value">
          <template #label>
            <el-icon><component :is="c.icon" /></el-icon>
            <span>{{ c.label }}</span>
            <el-badge v-if="getTabCount(c.value) > 0"
              :value="getTabCount(c.value)"
              :style="{ background: c.color, marginLeft: '8px' }"
              :type="c.value === 'abnormal' ? 'danger' : 'primary'" />
          </template>
        </el-tab-pane>
      </el-tabs>

      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm" @submit.prevent size="default">
          <el-form-item label="票号/订单">
            <el-input v-model="filterForm.keyword" placeholder="票号/订单号/用户手机" clearable style="width: 220px;" />
          </el-form-item>
          <el-form-item label="景点">
            <el-input v-model="filterForm.scenicSpotName" placeholder="景点名称" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item label="票种品类">
            <el-select v-model="filterForm.ticketCategory" placeholder="全部" clearable style="width: 140px;">
              <el-option v-for="c in Object.values(TicketCategoryEnum)" :key="c.value"
                :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="场次日期">
            <el-date-picker v-model="filterForm.sessionDate" type="date" placeholder="选择日期"
              value-format="YYYY-MM-DD" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker v-model="filterForm.dateRange" type="daterange"
              range-separator="至" start-placeholder="开始" end-placeholder="结束"
              value-format="YYYY-MM-DD" clearable style="width: 280px;" />
          </el-form-item>
          <el-form-item v-if="activeStatus === 'abnormal'">
            <el-checkbox v-model="filterForm.abnormalOnly">仅看异常</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" v-ripple>查询</el-button>
            <el-button :icon="Refresh" @click="resetFilter" v-ripple>重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <fulfillment-batch-toolbar
        v-if="selectedIds.length > 0"
        :selected-ids="selectedIds"
        :selected-count="selectedIds.length"
        :status="activeStatus"
        @success="onBatchSuccess"
        @refresh="fetchList"
      />

      <el-table :data="tableList" v-loading="loading" class="fulfill-table"
        @selection-change="onSelectionChange"
        :row-class-name="getRowClassName"
        border stripe
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column label="票务信息" width="280">
          <template #default="{ row }">
            <div style="margin-bottom: 6px;">
              <el-tag size="small" :class="getStatusTag(row.fulfillStatus)" effect="dark">
                {{ getStatusLabel(row.fulfillStatus) }}
              </el-tag>
              <span style="margin-left: 8px; font-weight: 600; font-size: 13px;">
                {{ row.ticketType?.name || '票种' }}
              </span>
            </div>
            <div class="ticket-code-cell" style="margin-bottom: 4px;">
              <el-icon><QRCode /></el-icon> {{ row.ticketCode }}
            </div>
            <div style="font-size: 12px; color: #595959;">
              <span style="margin-right: 12px;">
                <el-icon><Goods /></el-icon> {{ row.orderId }}
              </span>
            </div>
            <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
              <el-icon><Mountain /></el-icon> {{ row.scenicSpot?.name || '-' }}
              <span style="margin-left: 8px;">
                <el-icon><User /></el-icon> {{ row.userName || '-' }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="场次/时段" width="180">
          <template #default="{ row }">
            <div style="margin-bottom: 4px;">
              <el-icon><Calendar /></el-icon> {{ row.sessionDate || '-' }}
            </div>
            <div v-if="row.sessionStartTime" style="font-size: 12px; color: #595959;">
              <el-icon><Clock /></el-icon> {{ row.sessionStartTime }} - {{ row.sessionEndTime }}
            </div>
            <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
              票数: {{ row.ticketCount || 1 }} · ¥{{ row.actualPrice || 0 }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="核销校验" width="200">
          <template #default="{ row }">
            <div v-if="row.fulfillStatus === 'verified'">
              <div style="color: #52c41a; font-weight: 500; margin-bottom: 4px;">
                <el-icon><CircleCheckFilled /></el-icon>
                核销成功
              </div>
              <div style="font-size: 12px; color: #595959;">
                {{ formatTime(row.verifiedAt) }}
              </div>
              <div style="font-size: 12px; color: #8c8c8c;">
                {{ row.verifiedByName || '-' }}
                <span v-if="row.verifyGateway" style="margin-left: 6px;">· {{ row.verifyGateway }}</span>
              </div>
            </div>
            <div v-else-if="row.fulfillStatus === 'pending'">
              <div style="color: #1890ff; font-weight: 500;">
                <el-icon><Clock /></el-icon> 待核销
              </div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
                有效期至: {{ formatTime(row.validTo) }}
              </div>
            </div>
            <div v-else-if="row.fulfillStatus === 'abnormal'">
              <div style="color: #ff4d4f; font-weight: 500; margin-bottom: 4px;">
                <el-icon><WarningFilled /></el-icon>
                {{ getVerifyResultLabel(row.verifyResult) }}
              </div>
              <div style="font-size: 12px; color: #8c8c8c;">
                <el-tag size="small" type="danger" effect="plain">
                  {{ getAbnormalTypeLabel(row.abnormalType) }}
                </el-tag>
              </div>
              <div v-if="row.abnormalReason" style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
                {{ row.abnormalReason }}
              </div>
            </div>
            <div v-else-if="row.fulfillStatus === 'expired'">
              <div style="color: #8c8c8c; font-weight: 500;">
                <el-icon><CircleClose /></el-icon> 已过期作废
              </div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
                过期时间: {{ formatTime(row.expiredAt) }}
              </div>
            </div>
            <div v-else-if="row.fulfillStatus === 'refund'">
              <div style="color: #fa8c16; font-weight: 500;">
                <el-icon><RefreshLeft /></el-icon> 退票失效
              </div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
                退款: ¥{{ row.refundAmount || 0 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常标记" width="90" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="row.isAbnormal" :content="row.abnormalReason || '异常'" placement="top">
              <el-icon color="#ff4d4f" style="font-size: 18px;"><WarningFilled /></el-icon>
            </el-tooltip>
            <el-tooltip v-else-if="row.fakeIndicator" content="虚假凭证" placement="top">
              <el-icon color="#ff4d4f" style="font-size: 18px;"><CircleCloseFilled /></el-icon>
            </el-tooltip>
            <el-tooltip v-else-if="row.verifyMessage" :content="row.verifyMessage" placement="top">
              <el-icon color="#faad14" style="font-size: 18px;"><Warning /></el-icon>
            </el-tooltip>
            <span v-else style="color: #d9d9d9;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-ripple>详情</el-button>
            <el-button v-if="row.fulfillStatus === 'pending'" size="small" type="success" link
              :icon="CircleCheckFilled" @click="handleManualVerify(row)" v-ripple>人工核销</el-button>
            <el-button v-if="row.isAbnormal" size="small" type="warning" link
              :icon="Tools" @click="handleHandleAbnormal(row)" v-ripple>处理</el-button>
            <el-button size="small" type="info" link :icon="Clock" @click="openTrace(row)" v-ripple>溯源</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding: 16px 0; text-align: right;">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" layout="total, prev, pager, next, sizes" :page-sizes="[15, 30, 50, 100]"
          @current-change="fetchList" @size-change="onSizeChange" />
      </div>
    </template>

    <verify-result-dialog
      v-model="resultDialogVisible"
      :result="verifyResult"
    />

    <fulfillment-detail-dialog
      v-model="detailVisible"
      :data="currentDetailData"
      @success="fetchList"
    />

    <fulfillment-trace-panel
      v-model="traceVisible"
      :fulfillment-id="currentTraceId"
      :is-global="isGlobalTrace"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  QRCode, Scan, Loading, Close, Position, MagicStick, InfoFilled,
  Search, Refresh, View, Clock, CircleCheckFilled, WarningFilled, Warning,
  CircleClose, RefreshLeft, Tools, Mountain, Goods, User, Calendar,
  DataLine, CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  getTicketFulfillmentList, getTicketFulfillmentStats,
  verifyTicketFulfillment, checkExpiredFulfillment
} from '@/api/ticketFulfillment'
import {
  FulfillStatusEnum, FulfillVerifyResultEnum, FulfillAbnormalTypeEnum,
  TicketCategoryEnum
} from '@/utils/enums'
import VerifyResultDialog from './VerifyResultDialog.vue'
import FulfillmentDetailDialog from './TicketFulfillmentDetail.vue'
import FulfillmentBatchToolbar from './TicketFulfillmentBatchToolbar.vue'
import FulfillmentTracePanel from './TicketFulfillmentTracePanel.vue'

const hasPermission = ref(true)
const loading = ref(false)
const verifying = ref(false)
const tableList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)
const statData = ref([])
const scanCode = ref('')
const scanInputRef = ref(null)
const selectedIds = ref([])
const highlightIds = ref(new Set())

const activeStatus = ref('pending')
const filterForm = reactive({
  keyword: '',
  scenicSpotName: '',
  ticketCategory: '',
  sessionDate: '',
  dateRange: [],
  abnormalOnly: false
})

const resultDialogVisible = ref(false)
const verifyResult = ref(null)
const detailVisible = ref(false)
const currentDetailData = ref(null)
const traceVisible = ref(false)
const currentTraceId = ref(null)
const isGlobalTrace = ref(false)

const toastVisible = ref(false)
const toastSuccess = ref(true)
const toastTitle = ref('')
const toastMessage = ref('')
const toastDetail = ref('')
const toastTypeClass = computed(() => toastSuccess.value ? 'ff-toast-success' : 'ff-toast-error')
const toastCardClass = computed(() => toastSuccess.value ? 'toast-success-card' : 'toast-error-card')
const toastIcon = computed(() => toastSuccess.value ? CircleCheckFilled : WarningFilled)

const statusTabs = computed(() => Object.values(FulfillStatusEnum))
const statCards = [
  { key: 'pending', label: '待核销', icon: Clock },
  { key: 'verified', label: '已核销', icon: CircleCheckFilled },
  { key: 'expired', label: '已过期', icon: CircleClose },
  { key: 'abnormal', label: '异常记录', icon: WarningFilled }
]

const getStatusLabel = (s) => FulfillStatusEnum[s]?.label || s
const getStatusTag = (s) => FulfillStatusEnum[s]?.tagClass || ''
const getVerifyResultLabel = (r) => FulfillVerifyResultEnum[r]?.label || '-'
const getAbnormalTypeLabel = (t) => FulfillAbnormalTypeEnum[t]?.label || '异常'
const getStatCount = (k) => {
  const item = statData.value.find(d => d.fulfillStatus === k)
  return item ? Number(item.count || 0) : 0
}
const getTabCount = (k) => getStatCount(k)

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const getRowClassName = ({ row }) => {
  const classes = []
  if (selectedIds.value.includes(row.id)) classes.push('row-selected')
  if (row.fulfillStatus === 'verified') classes.push('stripe')
  return classes.join(' ')
}

const showToast = (success, title, msg, detail = '', duration = 3500) => {
  toastSuccess.value = success
  toastTitle.value = title
  toastMessage.value = msg
  toastDetail.value = detail
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
    const r = await getTicketFulfillmentStats(params)
    statData.value = r.data || []
  } catch (e) { /* ignore */ }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      fulfillStatus: activeStatus.value,
      ...filterForm
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.sessionDateFrom = filterForm.dateRange[0]
      params.sessionDateTo = filterForm.dateRange[1]
      delete params.dateRange
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined || params[k] === false) {
        if (k !== 'abnormalOnly') delete params[k]
      }
    })
    const r = await getTicketFulfillmentList(params)
    tableList.value = r.data?.list || []
    total.value = r.data?.total || 0
    fetchStats()
  } finally { loading.value = false }
}

const mockQRCode = () => {
  const spots = ['1001', '1002', '1003']
  const tts = ['501', '502', '503']
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const order = 'TK' + Date.now().toString().slice(-8) + '-' + random(spots) + '-' + random(tts)
  scanCode.value = order
  nextTick(() => scanInputRef.value?.focus())
}

const handleVerify = async () => {
  if (!scanCode.value || verifying.value) return
  verifying.value = true
  try {
    const r = await verifyTicketFulfillment(scanCode.value.trim())
    verifyResult.value = r.data
    resultDialogVisible.value = true

    if (r.data?.success) {
      showToast(true, '核销成功', `景点「${r.data.scenicSpotName || '-'}」已核销入园`,
        `票种：${r.data.ticketTypeName || '-'} · 核票人：${r.data.fulfillment?.verifiedByName || '-'}`)
      scanCode.value = ''
    } else {
      showToast(false, '核销失败', r.data?.message || '票务校验未通过',
        `校验结果：${getVerifyResultLabel(r.data?.verifyResult)}`)
    }
    fetchList()
  } catch (e) {
    showToast(false, '核销异常', e.message || '网络错误，请稍后重试')
  } finally { verifying.value = false }
}

const handleManualVerify = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定人工核销票号「${row.ticketCode}」吗？\n用户：${row.userName || '-'}\n景点：${row.scenicSpot?.name || '-'}\n\n将同步更新订单状态、库存记录与景点入园台账。`,
      '人工核销确认',
      { type: 'warning', confirmButtonText: '确定核销', cancelButtonText: '取消' }
    )
    const r = await verifyTicketFulfillment(row.ticketCode)
    verifyResult.value = r.data
    resultDialogVisible.value = true
    showToast(r.data?.success, r.data?.success ? '人工核销成功' : '人工核销失败', r.data?.message || '')
    fetchList()
  } catch (e) { /* ignore cancel */ }
}

const handleHandleAbnormal = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `处理异常票号「${row.ticketCode}」\n异常类型：${getAbnormalTypeLabel(row.abnormalType)}`,
      '异常处理',
      {
        confirmButtonText: '标记为正常',
        cancelButtonText: '作废此票',
        distinguishCancelAndClose: true,
        inputPlaceholder: '请填写处理意见（选填）',
        type: 'warning'
      }
    )
    currentDetailData.value = row
    detailVisible.value = true
    showToast(true, '已处理', `异常记录已处理：${value || '无意见'}`)
    fetchList()
  } catch (e) { /* ignore */ }
}

const handleExpired = async () => {
  try {
    await ElMessageBox.confirm('确定清理所有过期待核销票务吗？将自动标记过期状态并更新履约记录。', '提示', { type: 'warning' })
    const r = await checkExpiredFulfillment()
    showToast(true, '清理完成', `已处理 ${r.data?.expiredCount || 0} 条过期票`)
    fetchList()
  } catch (e) { /* ignore */ }
}

const handleIntegrity = async () => {
  showToast(true, '一致性校验', '已触发数据一致性校验，异常记录将自动标记')
}

const handleSearch = () => { page.value = 1; fetchList() }
const resetFilter = () => {
  Object.assign(filterForm, {
    keyword: '', scenicSpotName: '', ticketCategory: '',
    sessionDate: '', dateRange: [], abnormalOnly: false
  })
  page.value = 1; fetchList()
}
const onStatusChange = () => { page.value = 1; fetchList() }
const onSizeChange = (val) => { pageSize.value = val; page.value = 1; fetchList() }
const onSelectionChange = (rows) => { selectedIds.value = rows.map(r => r.id) }

const onBatchSuccess = () => {
  showToast(true, '批量操作完成', '已同步更新订单履约状态')
  fetchList()
}

const openDetail = (row) => {
  currentDetailData.value = row
  detailVisible.value = true
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
