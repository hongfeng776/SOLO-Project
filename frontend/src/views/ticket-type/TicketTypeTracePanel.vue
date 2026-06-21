<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:visible', v)"
    :title="isGlobal ? '票种规则全流程溯源' : '票种操作溯源记录'"
    width="980px"
    class="ticket-type-ops trace-panel"
    @open="onOpen"
  >
    <div v-loading="loading" class="trace-table">
      <div class="filter-bar" v-if="isGlobal" style="padding: 16px 24px 0;">
        <el-form :inline="true" :model="filterForm" size="default" @submit.prevent>
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.operationType" placeholder="全部" clearable style="width: 160px;">
              <el-option v-for="lt in Object.values(TicketLogTypeEnum)" :key="lt.value"
                :label="lt.label" :value="lt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="票种品类">
            <el-select v-model="filterForm.ticketCategory" placeholder="全部" clearable style="width: 140px;">
              <el-option v-for="c in Object.values(TicketCategoryEnum)" :key="c.value"
                :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="filterForm.operatorName" placeholder="姓名/ID" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="fetchLogs">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div style="padding: 0 24px;">
        <div class="col-resize-hint">
          <el-icon><DArrowLeft /></el-icon>
          拖拽表格列分隔线可调整列宽 · 双击行查看完整明细
          <el-icon><DArrowRight /></el-icon>
        </div>

        <el-table :data="logList"
          ref="tableRef"
          v-loading="loading"
          border
          stripe
          style="width: 100%;"
          :header-cell-style="{ background: '#fafafa', fontWeight: 600 }"
          @row-dblclick="handleRowDblclick"
          @header-dragend="onColResize"
          @cell-mouse-enter="onCellHover"
        >
          <el-table-column type="index" label="#" width="55" fixed="left" align="center" />
          <el-table-column prop="operationType" label="操作类型" :width="colWidths.operationType || 140" min-width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="light" :color="getLogColor(row.operationType)" style="color: #fff; border: none;">
                <el-icon style="margin-right: 4px;"><component :is="getLogIcon(row.operationType)" /></el-icon>
                {{ getLogLabel(row.operationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="isGlobal" prop="ticketNameCache" label="票种" :width="colWidths.ticketNameCache || 200" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 6px;">
                <el-tag size="small" :class="getCategoryTag(row.ticketCategory)" effect="plain" style="flex-shrink: 0;">
                  {{ getCategoryLabel(row.ticketCategory) }}
                </el-tag>
                <span>{{ row.ticketNameCache || '（已删除）' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" :width="colWidths.operatorName || 120" min-width="100" />
          <el-table-column prop="operatorRole" label="角色" :width="colWidths.operatorRole || 140" min-width="120" />
          <el-table-column prop="verifyResult" label="校验结果" :width="colWidths.verifyResult || 100" min-width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.verifyResult === 'pass'" style="color: #52c41a; font-weight: 500;">
                <el-icon><CircleCheckFilled /></el-icon> 通过
              </span>
              <span v-else-if="row.verifyResult === 'warning'" style="color: #faad14; font-weight: 500;">
                <el-icon><Warning /></el-icon> 存疑
              </span>
              <span v-else-if="row.verifyResult === 'block'" style="color: #ff4d4f; font-weight: 500;">
                <el-icon><CircleCloseFilled /></el-icon> 拦截
              </span>
              <span v-else style="color: #bfbfbf;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="orderSyncStatus" label="用户通知" :width="colWidths.orderSyncStatus || 100" min-width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.orderSyncStatus === 'processing' || row.orderSyncStatus === 'success'" size="small" type="primary" effect="plain">
                {{ row.orderSyncCount || 0 }}人
              </el-tag>
              <span v-else-if="row.orderSyncStatus === 'failed'" style="color: #ff4d4f;">
                <el-icon><WarningFilled /></el-icon>失败
              </span>
              <span v-else style="color: #bfbfbf;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因/备注" :width="colWidths.reason || 220" min-width="160" show-overflow-tooltip />
          <el-table-column prop="ip" label="IP" :width="colWidths.ip || 130" min-width="120" />
          <el-table-column prop="createdAt" label="操作时间" :width="colWidths.createdAt || 170" min-width="160" fixed="right" align="center" />
        </el-table>
      </div>

      <div v-if="total > pageSize" style="padding: 16px 24px 20px; text-align: right;">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" layout="prev, pager, next" @current-change="fetchLogs" />
      </div>

      <el-empty v-if="!loading && logList.length === 0" description="暂无操作记录" />
    </div>

    <teleport to="body">
      <div v-if="hoverHint"
        class="double-click-hint"
        :style="{ left: hoverHint.x + 'px', top: hoverHint.y + 'px' }">
        <el-icon><Pointer /></el-icon>
        双击查看完整明细
      </div>
    </teleport>

    <el-dialog v-model="detailVisible" :title="'日志明细 #' + (currentLog?.id || '')" width="680px">
      <div v-if="currentLog" class="log-modal">
        <div class="log-modal-header">
          <div class="title">
            <el-tag size="small" effect="light" :color="getLogColor(currentLog.operationType)" style="color: #fff; border: none;">
              {{ getLogLabel(currentLog.operationType) }}
            </el-tag>
            <span style="margin-left: 10px; font-weight: 500;">{{ currentLog.ticketNameCache }}</span>
          </div>
          <el-button size="small" link @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="log-modal-body">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="票种品类">{{ getCategoryLabel(currentLog.ticketCategory) }}</el-descriptions-item>
            <el-descriptions-item label="操作时间">{{ formatTime(currentLog.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{ currentLog.operatorName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作角色">{{ currentLog.operatorRole || '-' }}</el-descriptions-item>
            <el-descriptions-item label="校验结果">
              <span :style="{ color: getVerifyColor(currentLog.verifyResult), fontWeight: 500; }">
                {{ getVerifyLabel(currentLog.verifyResult) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="用户通知">
              {{ currentLog.orderSyncStatus === 'processing' || currentLog.orderSyncStatus === 'success'
                ? `已同步${currentLog.orderSyncCount || 0}人`
                : (currentLog.orderSyncStatus === 'failed' ? '失败' : '无需同步') }}
            </el-descriptions-item>
            <el-descriptions-item label="批次号" v-if="currentLog.batchId">{{ currentLog.batchId }}</el-descriptions-item>
            <el-descriptions-item label="IP / UA" v-if="currentLog.ip">
              {{ currentLog.ip }}
              <div v-if="currentLog.userAgent" style="font-size: 11px; color: #909399; margin-top: 4px; word-break: break-all;">
                {{ currentLog.userAgent }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="操作原因/备注" :span="2" v-if="currentLog.reason">
              <div style="line-height: 1.6;">{{ currentLog.reason }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="校验不通过原因" :span="2" v-if="currentLog.verifyMessage">
              <div style="color: #ff4d4f; line-height: 1.6;">{{ currentLog.verifyMessage }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="冲突规则" :span="2" v-if="currentLog.conflictRules && currentLog.conflictRules.length">
              <div v-for="(c, i) in currentLog.conflictRules" :key="i" style="color: #fa8c16; line-height: 1.8;">
                · [{{ c.field }}] {{ c.message }}（冲突票种ID：{{ c.conflictingTicketId }}）
              </div>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider v-if="currentLog.changes && currentLog.changes.length" content-position="left">
            <span style="font-weight: 600;">字段变更明细</span>
          </el-divider>

          <el-table v-if="currentLog.changes && currentLog.changes.length"
            :data="currentLog.changes" border size="small" style="margin-top: 12px;">
            <el-table-column prop="fieldLabel" label="字段" width="160" />
            <el-table-column label="变更前">
              <template #default="{ row }">
                <span style="color: #ff4d4f; text-decoration: line-through;">{{ formatVal(row.oldValue) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="变更后">
              <template #default="{ row }">
                <span style="color: #52c41a; font-weight: 500;">{{ formatVal(row.newValue) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  Search, Refresh, DArrowLeft, DArrowRight, Pointer, Close,
  Warning, CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import { getTicketTypeLogs, getAllTicketTypeLogs } from '@/api/ticketType'
import { TicketLogTypeEnum, TicketCategoryEnum, TicketVerifyResultEnum } from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  ticketId: { type: [Number, String], default: null },
  isGlobal: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible'])

const loading = ref(false)
const logList = ref([])
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)
const tableRef = ref(null)

const filterForm = reactive({
  operationType: '',
  ticketCategory: '',
  operatorName: ''
})

const colWidths = reactive({})
const LS_KEY = 'tt_trace_col_widths'
const loadColWidths = () => {
  try {
    const s = localStorage.getItem(LS_KEY)
    if (s) Object.assign(colWidths, JSON.parse(s))
  } catch (e) { /* ignore */ }
}
const saveColWidths = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(colWidths)) } catch (e) {}
}
const onColResize = (newW, oldW, col) => {
  const key = col.property || col.prop
  if (key) {
    colWidths[key] = newW
    saveColWidths()
  }
}

const hoverHint = ref(null)
const detailVisible = ref(false)
const currentLog = ref(null)

const getLogLabel = (t) => TicketLogTypeEnum[t]?.label || t
const getLogColor = (t) => TicketLogTypeEnum[t]?.color || '#909399'
const getLogIcon = (t) => TicketLogTypeEnum[t]?.icon || 'InfoFilled'
const getCategoryLabel = (c) => TicketCategoryEnum[c]?.label || c
const getCategoryTag = (c) => TicketCategoryEnum[c]?.tagClass || ''
const getVerifyLabel = (r) => TicketVerifyResultEnum[r]?.label || '-'
const getVerifyColor = (r) => TicketVerifyResultEnum[r] === 'pass' ? '#52c41a'
  : (r === 'warning' ? '#faad14' : (r === 'block' ? '#ff4d4f' : '#bfbfbf'))

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const formatVal = (v) => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (typeof v === 'object') return JSON.stringify(v, null, 0)
  return String(v)
}

const onCellHover = (row, col, cell, ev) => {
  const rect = ev.target.getBoundingClientRect()
  hoverHint.value = {
    x: rect.right + 10,
    y: rect.top - 28
  }
  clearTimeout(onCellHover._t)
  onCellHover._t = setTimeout(() => { hoverHint.value = null }, 1200)
}

const handleRowDblclick = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...filterForm }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
    })
    const r = props.isGlobal
      ? await getAllTicketTypeLogs(params)
      : await getTicketTypeLogs(props.ticketId, params)
    logList.value = r.data?.list || []
    total.value = r.data?.total || 0
  } finally { loading.value = false }
}

const resetFilter = () => {
  Object.assign(filterForm, { operationType: '', ticketCategory: '', operatorName: '' })
  page.value = 1
  fetchLogs()
}

const onOpen = () => {
  loadColWidths()
  page.value = 1
  logList.value = []
  fetchLogs()
}
</script>
