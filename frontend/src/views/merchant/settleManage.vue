<template>
  <div class="page-container">
    <el-card shadow="never" class="mb16">
      <el-form :inline="true" :model="searchForm" class="search-bar">
        <el-form-item label="结算周期">
          <el-radio-group v-model="searchForm.period_type" @change="handleSearch">
            <el-radio v-for="p in SETTLE_PERIOD_OPTIONS" :key="p.value" :label="p.value">{{ p.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange" type="daterange" start-placeholder="开始" end-placeholder="结束"
            value-format="YYYY-MM-DD" style="width: 260px" @change="handleSearch" />
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select
            v-model="searchForm.status_list" multiple placeholder="全部" clearable style="width: 240px"
            @change="handleSearch">
            <el-option v-for="s in APPLY_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value">
              <el-tag :type="s.type" size="small">{{ s.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商家类型">
          <el-select
            v-model="searchForm.merchant_type" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option label="个人商家" :value="1" />
            <el-option label="企业商家" :value="2" />
            <el-option label="旗舰商家" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="申请单号/商家名称" class="focus-glow" clearable style="width: 200px" @change="handleSearch" />
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="searchForm.sort_field" placeholder="排序字段" style="width: 140px" @change="handleSearch">
            <el-option v-for="f in SORT_FIELD_OPTIONS" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
          <el-radio-group v-model="searchForm.sort_order" style="margin-left: 8px" @change="handleSearch">
            <el-radio-button label="asc">升序</el-radio-button>
            <el-radio-button label="desc">降序</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="12" class="stat-quick-cards">
        <el-col v-for="(c, idx) in statusCards" :key="'s_' + idx" :span="4">
          <div
            :class="['stat-card', { active: c.active }]"
            :style="{ borderLeftColor: c.color }"
            @click="toggleCardFilter(c)">
            <div class="stat-num" :style="{ color: c.color }">{{ formatNumber(c.count) }}</div>
            <div class="stat-label">{{ c.label }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card amount-card">
            <div class="amount-card-title">金额总览</div>
            <div class="amount-card-grid">
              <div class="amount-item">
                <div class="amount-label">待审核</div>
                <div class="amount-value warning-text">¥{{ formatNumber(amountOverview.pending, 2) }}</div>
              </div>
              <div class="amount-item">
                <div class="amount-label">打款中</div>
                <div class="amount-value info-text">¥{{ formatNumber(amountOverview.paying, 2) }}</div>
              </div>
              <div class="amount-item">
                <div class="amount-label">已到账</div>
                <div class="amount-value success-text">¥{{ formatNumber(amountOverview.paid, 2) }}</div>
              </div>
              <div class="amount-item">
                <div class="amount-label">本月累计</div>
                <div class="amount-value primary-text">¥{{ formatNumber(amountOverview.monthTotal, 2) }}</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <div>
            <el-checkbox v-model="isAllSelected" :indeterminate="isIndeterminate" @change="(v: any) => toggleAllSelect(Boolean(v))">全选</el-checkbox>
            <span class="ml16">已选 <b>{{ selectedIds.length }}</b> 项</span>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" :disabled="!financeAllowed || selectedIds.length === 0" @click="openBatchApplyDialog">
              <el-icon><Plus /></el-icon>批量申请
            </el-button>
            <el-button type="success" :disabled="!financeAllowed || selectedIds.length === 0" @click="openBatchAuditDialog(2)">
              <el-icon><Checked /></el-icon>批量通过
            </el-button>
            <el-button type="danger" :disabled="!financeAllowed || selectedIds.length === 0" @click="openBatchAuditDialog(3)">
              <el-icon><Close /></el-icon>批量驳回
            </el-button>
            <el-button type="warning" :disabled="!financeAllowed || selectedIds.length === 0" @click="openExportDialog">
              <el-icon><Download /></el-icon>导出台账
            </el-button>
            <el-button @click="refreshTable">刷新</el-button>
          </div>
        </div>
        <el-alert
          v-if="!financeAllowed"
          type="warning"
          show-icon
          :closable="false"
          title="当前账号无财务权限，批量操作按钮已禁用，请联系管理员开通"
          class="mt8" />
      </template>

      <template v-if="loading">
        <el-skeleton :rows="8" animated />
      </template>
      <template v-else>
        <el-table
          ref="tableRef"
          :data="tableData"
          border
          stripe
          @selection-change="onSelectionChange"
          @header-dragend="onHeaderDragend"
          style="width: 100%">
          <el-table-column type="selection" width="50" align="center" :reserve-selection="true" />
          <el-table-column label="申请单号" min-width="200" fixed="left" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip :content="row.apply_no" placement="top">
                <el-link type="primary" @click="openTraceDialog(row as any)">{{ row.apply_no }}</el-link>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="商家信息" min-width="200">
            <template #default="{ row }">
              <div class="merchant-cell">
                <div class="merchant-name">{{ row.merchant_name }}</div>
                <div class="shop-name text-xs mt2">{{ row.shop_name }}</div>
                <el-tag
                  v-if="row.certification_status === 2"
                  size="small" type="success" effect="dark" class="mt2">已认证</el-tag>
                <el-tag
                  v-else-if="row.certification_status === 1"
                  size="small" type="warning" effect="dark" class="mt2">认证中</el-tag>
                <el-tag
                  v-else
                  size="small" type="info" class="mt2">未认证</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="结算周期" width="160" align="center">
            <template #default="{ row }">
              <div>
                <div>{{ getPeriodLabel(row.period_type) }}</div>
                <div class="text-muted text-xs mt2">{{ row.period_start }} ~ {{ row.period_end }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="基础金额" width="120" align="right" sortable prop="base_amount">
            <template #default="{ row }">
              <span>¥{{ formatNumber(row.base_amount, 2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="扣减合计" align="center" width="260">
            <el-table-column label="手续费" width="80" align="right">
              <template #default="{ row }">
                <span class="text-primary">¥{{ formatNumber(row.platform_fee, 2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="售后" width="80" align="right">
              <template #default="{ row }">
                <span class="warning-text">-¥{{ formatNumber(row.aftersale_deduct, 2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="罚款" width="80" align="right">
              <template #default="{ row }">
                <span class="danger-text">-¥{{ formatNumber(row.violation_fine, 2) }}</span>
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="实际结算" width="130" align="right" sortable prop="actual_amount">
            <template #default="{ row }">
              <span class="actual-amount">¥{{ formatNumber(row.actual_amount, 2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center" sortable prop="status">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="银行卡信息" width="160">
            <template #default="{ row }">
              <div class="text-xs">
                <div>{{ row.bank_name }}</div>
                <div class="mt2">**** **** **** {{ row.bank_account_no?.slice(-4) || '----' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="申请时间" width="160" align="center" sortable prop="apply_time">
            <template #default="{ row }">
              <span class="text-xs">{{ formatDateTime(row.apply_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="到账时间" width="160" align="center" sortable prop="arrive_time">
            <template #default="{ row }">
              <span v-if="row.arrive_time" class="text-xs">{{ formatDateTime(row.arrive_time) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openViewDialog(row as any)">查看</el-button>
              <el-button
                v-if="row.status === 1"
                link type="warning" @click="openAuditDialog(row as any)">审核</el-button>
              <el-button link type="success" @click="openTraceDialog(row as any)">溯源</el-button>
              <el-button
                v-if="row.status === 6"
                link type="danger" @click="handleRetryPay(row as any)">重试打款</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <el-pagination
        class="mt16 paginator"
        :current-page="pagination.pageNum"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="p => { pagination.pageNum = p; fetchData() }"
        @size-change="s => { pagination.pageSize = s; pagination.pageNum = 1; fetchData() }"
      />
    </el-card>

    <SettleTraceDialog v-model="traceDialogVisible" :settle-id="currentSettleId" />

    <el-dialog
      v-model="auditDialogVisible"
      title="结算审核"
      width="640px"
      :close-on-click-modal="false"
      custom-class="dialog-zoom-in">
      <div class="audit-dialog">
        <div class="audit-header">
          <div class="mr16">申请单号：<b>{{ currentRow?.apply_no }}</b></div>
          <div>商家：<b>{{ currentRow?.merchant_name }}</b></div>
        </div>
        <div class="audit-compare mt16">
          <div class="compare-item">
            <div class="compare-label">基础金额</div>
            <div class="compare-value">¥{{ formatNumber(currentRow?.base_amount || 0, 2) }}</div>
          </div>
          <div class="compare-item">
            <div class="compare-label">扣减合计</div>
            <div class="compare-value danger-text">-¥{{ formatNumber(currentRow?.total_deduct || 0, 2) }}</div>
          </div>
          <div class="compare-item">
            <div class="compare-label">实际结算</div>
            <div class="compare-value actual-amount">¥{{ formatNumber(currentRow?.actual_amount || 0, 2) }}</div>
          </div>
        </div>
        <el-form label-width="100px" class="mt16">
          <el-form-item label="审核结果">
            <el-radio-group v-model="auditForm.action">
              <el-radio :value="2">审核通过</el-radio>
              <el-radio :value="3">审核驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="驳回原因" v-if="auditForm.action === 3">
            <el-input
              v-model="auditForm.reject_reason"
              type="textarea"
              :rows="4"
              placeholder="请输入驳回原因"
              class="focus-glow" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="auditForm.remark"
              type="textarea"
              :rows="2"
              placeholder="选填"
              class="focus-glow" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button :type="auditForm.action === 2 ? 'success' : 'danger'" @click="submitAudit">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchApplyDialogVisible"
      title="批量申请结算"
      width="560px"
      :close-on-click-modal="false"
      custom-class="dialog-zoom-in">
      <el-form label-width="100px">
        <el-form-item label="结算周期">
          <el-radio-group v-model="batchApplyForm.period_type">
            <el-radio v-for="p in SETTLE_PERIOD_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="起止日期">
          <el-date-picker
            v-model="batchApplyForm.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="申请数量">
          <el-tag type="primary">{{ selectedIds.length }} 个商家</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchApplyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchApply">确认申请</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchAuditDialogVisible"
      :title="`批量${batchAuditForm.action === 2 ? '审核通过' : '审核驳回'}`"
      width="520px"
      :close-on-click-modal="false"
      custom-class="dialog-zoom-in">
      <el-form label-width="100px">
        <el-form-item label="驳回原因" v-if="batchAuditForm.action === 3">
          <el-input
            v-model="batchAuditForm.reject_reason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
            class="focus-glow" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="batchAuditForm.remark"
            type="textarea"
            :rows="2"
            placeholder="选填"
            class="focus-glow" />
        </el-form-item>
        <el-form-item label="处理数量">
          <el-tag :type="batchAuditForm.action === 2 ? 'success' : 'danger'">{{ selectedIds.length }} 条记录</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchAuditDialogVisible = false">取消</el-button>
        <el-button :type="batchAuditForm.action === 2 ? 'success' : 'danger'" @click="submitBatchAudit">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="exportDialogVisible"
      title="导出台账"
      width="580px"
      :close-on-click-modal="false"
      custom-class="dialog-zoom-in">
      <el-form label-width="100px">
        <el-form-item label="导出字段">
          <el-checkbox-group v-model="exportForm.fields">
            <el-checkbox v-for="f in EXPORT_FIELD_OPTIONS" :key="f.value" :label="f.value">{{ f.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序字段">
          <el-select v-model="exportForm.sort_field" placeholder="默认按申请时间" style="width: 220px" clearable>
            <el-option v-for="f in SORT_FIELD_OPTIONS" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
          <el-radio-group v-model="exportForm.sort_order" style="margin-left: 8px">
            <el-radio-button label="asc">升序</el-radio-button>
            <el-radio-button label="desc">降序</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出数量">
          <el-tag type="info">{{ selectedIds.length }} 条记录</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Checked, Close, Download } from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/common'
import {
  SETTLE_PERIOD_OPTIONS, APPLY_STATUS_OPTIONS, BANK_VERIFY_OPTIONS, APPLY_SOURCE_OPTIONS,
  getSettleList, batchApplySettle, batchAuditSettle, batchExportSettleLedger, checkFinancePermission,
  changeSettleStatus,
  type SettleApplyItem, type SettleQueryParams
} from '@/api/merchantSettle'
import SettleTraceDialog from './components/SettleTraceDialog.vue'

const tableRef = ref<any>()
const loading = ref(false)
const tableData = ref<SettleApplyItem[]>([])
const selectedIds = ref<number[]>([])
const selectedRows = ref<SettleApplyItem[]>([])
const financeAllowed = ref(true)
const currentSettleId = ref<number>(0)
const currentRow = ref<SettleApplyItem | null>(null)

const SORT_FIELD_OPTIONS = [
  { label: '申请时间', value: 'apply_time' },
  { label: '基础金额', value: 'base_amount' },
  { label: '实际结算', value: 'actual_amount' },
  { label: '到账时间', value: 'arrive_time' },
]

const EXPORT_FIELD_OPTIONS = [
  { label: '申请单号', value: 'apply_no' },
  { label: '商家名称', value: 'merchant_name' },
  { label: '店铺名称', value: 'shop_name' },
  { label: '结算周期', value: 'period_info' },
  { label: '基础金额', value: 'base_amount' },
  { label: '平台手续费', value: 'platform_fee' },
  { label: '售后扣减', value: 'aftersale_deduct' },
  { label: '违规罚款', value: 'violation_fine' },
  { label: '扣减合计', value: 'total_deduct' },
  { label: '实际结算', value: 'actual_amount' },
  { label: '状态', value: 'status' },
  { label: '银行信息', value: 'bank_info' },
  { label: '申请时间', value: 'apply_time' },
  { label: '到账时间', value: 'arrive_time' },
]

const searchForm = reactive<SettleQueryParams & { dateRange?: string[] }>({
  pageNum: 1,
  pageSize: 10,
  period_type: undefined,
  dateRange: [] as string[],
  status_list: [] as number[],
  merchant_type: undefined,
  keyword: '',
  sort_field: 'apply_time',
  sort_order: 'desc',
})

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const isAllSelected = ref(false)
const isIndeterminate = ref(false)
const colWidths = ref<Record<string, number>>({})
const activeCardFilter = ref<string | null>(null)

const statusCards = computed(() => {
  const list = tableData.value
  return APPLY_STATUS_OPTIONS.map(s => ({
    label: s.label,
    count: list.filter(r => r.status === s.value).length,
    color: s.color,
    key: `status_${s.value}`,
    active: activeCardFilter.value === `status_${s.value}`,
  }))
})

const amountOverview = computed(() => {
  const list = tableData.value
  return {
    pending: list.filter(r => r.status === 1).reduce((s, r) => s + r.actual_amount, 0),
    paying: list.filter(r => r.status === 4).reduce((s, r) => s + r.actual_amount, 0),
    paid: list.filter(r => r.status === 5).reduce((s, r) => s + r.actual_amount, 0),
    monthTotal: list.reduce((s, r) => s + r.actual_amount, 0),
  }
})

const traceDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const batchApplyDialogVisible = ref(false)
const batchAuditDialogVisible = ref(false)
const exportDialogVisible = ref(false)

const auditForm = reactive({ action: 2, reject_reason: '', remark: '' })
const batchApplyForm = reactive({ period_type: 3, dateRange: [] as string[] })
const batchAuditForm = reactive({ action: 2, reject_reason: '', remark: '' })
const exportForm = reactive({
  fields: EXPORT_FIELD_OPTIONS.map(f => f.value),
  sort_field: 'apply_time',
  sort_order: 'desc' as 'asc' | 'desc',
})

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getPeriodLabel = (t?: number) => SETTLE_PERIOD_OPTIONS.find(o => o.value === t)?.label || '-'
const getStatusLabel = (s?: number) => APPLY_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getStatusTagType = (s?: number): TagType => {
  const o = APPLY_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}

const formatDateTime = (t?: string) => {
  if (!t) return '-'
  return t.replace('T', ' ').slice(0, 19)
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.period_type = undefined
  searchForm.dateRange = []
  searchForm.status_list = []
  searchForm.merchant_type = undefined
  searchForm.keyword = ''
  searchForm.sort_field = 'apply_time'
  searchForm.sort_order = 'desc'
  activeCardFilter.value = null
  handleSearch()
}

const toggleCardFilter = (c: any) => {
  if (activeCardFilter.value === c.key) {
    activeCardFilter.value = null
    searchForm.status_list = []
  } else {
    activeCardFilter.value = c.key
    const statusVal = Number(c.key.split('_')[1])
    searchForm.status_list = [statusVal]
  }
  pagination.pageNum = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: SettleQueryParams = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      period_type: searchForm.period_type,
      status_list: searchForm.status_list?.length ? searchForm.status_list : undefined,
      merchant_type: searchForm.merchant_type,
      keyword: searchForm.keyword || undefined,
      sort_field: searchForm.sort_field,
      sort_order: searchForm.sort_order,
      start_date: searchForm.dateRange?.[0],
      end_date: searchForm.dateRange?.[1],
    }
    const res = await getSettleList(params)
    tableData.value = res.data.data.list as any
    pagination.total = res.data.data.total
    await nextTick()
    applyColWidths()
  } finally {
    loading.value = false
  }
}

const applyColWidths = () => {
  if (!tableRef.value) return
  const columns = (tableRef.value as any).store?.states?.columns || []
  for (const col of columns) {
    if (col.property && colWidths.value[col.property]) {
      col.width = colWidths.value[col.property]
    }
  }
}

const onHeaderDragend = (newWidth: number, _oldWidth: number, column: any) => {
  if (column?.property) colWidths.value[column.property] = newWidth
}

const onSelectionChange = (rows: any[]) => {
  selectedRows.value = rows as SettleApplyItem[]
  selectedIds.value = (rows as any[]).map((r: any) => r.id)
  if (rows.length === 0) {
    isAllSelected.value = false
    isIndeterminate.value = false
  } else if (rows.length === tableData.value.length) {
    isAllSelected.value = true
    isIndeterminate.value = false
  } else {
    isAllSelected.value = false
    isIndeterminate.value = true
  }
}

const toggleAllSelect = (val: boolean) => {
  if (!tableRef.value) return
  if (val) tableRef.value.toggleAllSelection()
  else tableRef.value.clearSelection()
}

const refreshTable = () => fetchData()

const openViewDialog = (row: SettleApplyItem) => {
  currentSettleId.value = row.id
  traceDialogVisible.value = true
}

const openTraceDialog = (row: SettleApplyItem) => {
  currentSettleId.value = row.id
  traceDialogVisible.value = true
}

const openAuditDialog = (row: SettleApplyItem) => {
  currentRow.value = row
  auditForm.action = 2
  auditForm.reject_reason = ''
  auditForm.remark = ''
  auditDialogVisible.value = true
}

const submitAudit = async () => {
  if (!currentRow.value) return
  if (auditForm.action === 3 && !auditForm.reject_reason) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const actionText = auditForm.action === 2 ? '通过' : '驳回'
  await ElMessageBox.confirm(`确定${actionText}该结算申请？`, '审核心确认', { type: 'warning' })
  const res = await batchAuditSettle({
    settle_apply_ids: [currentRow.value.id],
    action: auditForm.action,
    reject_reason: auditForm.reject_reason || undefined,
    remark: auditForm.remark || undefined,
  })
  ElMessage.success(`审核${actionText}成功：${res.data.data.success_count}条`)
  auditDialogVisible.value = false
  fetchData()
}

const handleRetryPay = async (row: SettleApplyItem) => {
  await ElMessageBox.confirm(`确定重试打款？申请单号：${row.apply_no}`, '重试确认', { type: 'warning' })
  const res = await changeSettleStatus({ id: row.id, target_status: 4, remark: '重试打款' })
  ElMessage.success(res.data.data.message || '重试打款已提交')
  fetchData()
}

const openBatchApplyDialog = () => {
  batchApplyForm.period_type = 3
  batchApplyForm.dateRange = []
  batchApplyDialogVisible.value = true
}

const openBatchAuditDialog = (action: number) => {
  batchAuditForm.action = action
  batchAuditForm.reject_reason = ''
  batchAuditForm.remark = ''
  batchAuditDialogVisible.value = true
}

const openExportDialog = () => {
  exportForm.fields = EXPORT_FIELD_OPTIONS.map(f => f.value)
  exportForm.sort_field = searchForm.sort_field || 'apply_time'
  exportForm.sort_order = searchForm.sort_order || 'desc'
  exportDialogVisible.value = true
}

const submitBatchApply = async () => {
  if (batchApplyForm.dateRange.length !== 2) {
    ElMessage.warning('请选择起止日期')
    return
  }
  await ElMessageBox.confirm(`确定为已选 ${selectedIds.value.length} 个商家批量申请结算？`, '批量申请确认', { type: 'warning' })
  const merchantIds = selectedRows.value.map(r => r.merchant_id)
  const res = await batchApplySettle({
    merchant_ids: merchantIds,
    period_type: batchApplyForm.period_type,
    period_start: batchApplyForm.dateRange[0],
    period_end: batchApplyForm.dateRange[1],
  })
  ElMessage.success(`申请成功：${res.data.data.success_count}条，失败：${res.data.data.fail_count}条`)
  batchApplyDialogVisible.value = false
  fetchData()
}

const submitBatchAudit = async () => {
  if (batchAuditForm.action === 3 && !batchAuditForm.reject_reason) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const actionText = batchAuditForm.action === 2 ? '通过' : '驳回'
  await ElMessageBox.confirm(`确定批量${actionText}已选 ${selectedIds.value.length} 条记录？`, '批量审核确认', { type: 'warning' })
  const res = await batchAuditSettle({
    settle_apply_ids: selectedIds.value,
    action: batchAuditForm.action,
    reject_reason: batchAuditForm.reject_reason || undefined,
    remark: batchAuditForm.remark || undefined,
  })
  ElMessage.success(`审核${actionText}成功：${res.data.data.success_count}条，失败：${res.data.data.fail_count}条`)
  batchAuditDialogVisible.value = false
  fetchData()
}

const submitExport = async () => {
  if (exportForm.fields.length === 0) {
    ElMessage.warning('请至少选择一个导出字段')
    return
  }
  const res = await batchExportSettleLedger({
    settle_apply_ids: selectedIds.value,
    export_fields: exportForm.fields,
    sort_field: exportForm.sort_field,
    sort_order: exportForm.sort_order,
  })
  ElMessage.success(`导出任务已创建，共 ${res.data.data.total_count} 条记录`)
  exportDialogVisible.value = false
}

const loadFinancePermission = async () => {
  try {
    const res = await checkFinancePermission()
    financeAllowed.value = res.data.data.allowed
  } catch {
    financeAllowed.value = false
  }
}

onMounted(() => {
  loadFinancePermission()
  fetchData()
})
</script>

<style scoped lang="scss">
@keyframes dialog-zoom-in {
  0% { transform: scale(.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.dialog-zoom-in {
  animation: dialog-zoom-in 0.25s ease-out;
}

.focus-glow {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    transition: box-shadow 0.2s ease;
    &:focus, &.is-focus {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.25);
    }
  }
}

.page-container { padding: 16px; }
.mb16 { margin-bottom: 16px; }
.mt2 { margin-top: 2px; }
.mt8 { margin-top: 8px; }
.mt16 { margin-top: 16px; }
.ml8 { margin-left: 8px; }
.ml16 { margin-left: 16px; }
.mr8 { margin-right: 8px; }
.mr16 { margin-right: 16px; }
.text-xs { font-size: 12px; }
.text-muted { color: var(--el-text-color-secondary); }
.success-text { color: var(--el-color-success); font-weight: 600; }
.warning-text { color: var(--el-color-warning); font-weight: 600; }
.danger-text { color: var(--el-color-danger); font-weight: 600; }
.info-text { color: var(--el-color-info); font-weight: 600; }
.primary-text { color: var(--el-color-primary); font-weight: 600; }
.text-primary { color: var(--el-color-primary); }
.search-bar { margin-bottom: 0; }
.stat-quick-cards { margin-top: 8px; }
.stat-card {
  padding: 12px 16px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid var(--el-color-primary);
  background: var(--el-bg-color);
  transition: all 0.2s;
  &:hover, &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  .stat-num { font-size: 22px; font-weight: 700; line-height: 1.2; }
  .stat-label { margin-top: 6px; font-size: 13px; color: var(--el-text-color-regular); }
}
.amount-card {
  cursor: default;
  border-left-color: #409EFF;
  padding: 12px 16px;
  &:hover { background: var(--el-bg-color); border-color: var(--el-border-color-lighter); }
  .amount-card-title { font-size: 13px; color: var(--el-text-color-primary); font-weight: 600; margin-bottom: 8px; }
  .amount-card-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;
    .amount-item {
      .amount-label { font-size: 12px; color: var(--el-text-color-secondary); }
      .amount-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
    }
  }
}
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.toolbar-right { display: flex; gap: 8px; }
.merchant-cell {
  .merchant-name { font-weight: 600; color: var(--el-text-color-primary); }
  .shop-name { color: var(--el-text-color-regular); }
}
.actual-amount { font-weight: 700; color: var(--el-color-primary); font-size: 14px; }
.paginator { display: flex; justify-content: flex-end; }
.audit-dialog {
  .audit-header { font-size: 14px; padding: 8px 0; }
  .audit-compare {
    display: flex; gap: 16px; padding: 16px;
    background: var(--el-fill-color-light); border-radius: 8px;
    .compare-item {
      flex: 1; text-align: center;
      .compare-label { font-size: 12px; color: var(--el-text-color-secondary); }
      .compare-value { font-size: 18px; font-weight: 700; margin-top: 6px; }
    }
  }
}
</style>
