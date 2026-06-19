<template>
  <div class="page-container">
    <el-card shadow="never" class="mb16">
      <el-form :inline="true" :model="searchForm" class="search-bar">
        <el-form-item label="统计周期">
          <el-radio-group v-model="searchForm.stat_period_type" @change="handleSearch">
            <el-radio v-for="p in STAT_PERIOD_OPTIONS" :key="p.value" :label="p.value">{{ p.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange" type="daterange" start-placeholder="开始" end-placeholder="结束"
            value-format="YYYY-MM-DD" style="width: 260px" @change="handleSearch" />
        </el-form-item>
        <el-form-item label="数据状态">
          <el-select
            v-model="searchForm.data_status_list" multiple placeholder="全部" clearable style="width: 200px"
            @change="handleSearch">
            <el-option v-for="s in DATA_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value">
              <el-tag :type="s.type" size="small">{{ s.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="searchForm.risk_level_list" multiple placeholder="全部" clearable style="width: 180px"
            @change="handleSearch">
            <el-option v-for="r in RISK_LEVEL_OPTIONS" :key="r.value" :label="r.label" :value="r.value">
              <el-tag :type="r.type" size="small">{{ r.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="经营类目">
          <el-select
            v-model="searchForm.shop_category" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option v-for="c in SHOP_CATEGORY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺等级">
          <el-select
            v-model="searchForm.shop_level" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option v-for="lv in SHOP_LEVEL_OPTIONS" :key="lv.value" :label="lv.label" :value="lv.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售额区间">
          <el-input-number v-model="searchForm.sales_amount_min" :min="0" :controls="false" size="default" placeholder="最小" style="width: 120px" />
          <span class="mx6">~</span>
          <el-input-number v-model="searchForm.sales_amount_max" :min="0" :controls="false" size="default" placeholder="最大" style="width: 120px" />
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
        <el-col v-for="(c, idx) in statCards" :key="idx" :span="3">
          <div
            :class="['stat-card', { active: c.active }]"
            :style="{ borderLeftColor: c.color }"
            @click="toggleCardFilter(c)">
            <div class="stat-num" :style="{ color: c.color }">{{ formatNumber(c.count) }}</div>
            <div class="stat-label">{{ c.label }}</div>
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
            <el-button type="primary" :disabled="selectedIds.length === 0" @click="openBatchExportDialog">
              <el-icon><Download /></el-icon>批量导出
            </el-button>
            <el-button type="warning" :disabled="selectedIds.length === 0" @click="openBatchCalibrateDialog">
              <el-icon><Refresh /></el-icon>批量校准
            </el-button>
            <el-button type="success" :disabled="selectedIds.length === 0" @click="openBatchMarkQualityDialog(1)">
              <el-icon><Star /></el-icon>标记优质
            </el-button>
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="openBatchMarkQualityDialog(3)">
              <el-icon><Warning /></el-icon>标记劣质
            </el-button>
            <el-button @click="refreshTable">刷新</el-button>
          </div>
        </div>
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
          :row-class-name="rowClassName"
          style="width: 100%">
          <el-table-column type="selection" width="50" align="center" :reserve-selection="true" />
          <el-table-column label="商家信息" min-width="220" fixed="left">
            <template #default="{ row }">
              <div class="shop-name-cell">
                <el-avatar :size="36" :src="row.shop_logo">{{ (row.shop_name || row.merchant_name || '').slice(0, 1) }}</el-avatar>
                <div class="shop-info">
                  <div class="shop-name">{{ row.shop_name || '未设置' }}</div>
                  <div class="shop-merchant">{{ row.merchant_name }}</div>
                  <div class="shop-tags mt2">
                    <el-tag v-if="row.shop_category" size="small" type="info" class="mr4">{{ row.shop_category }}</el-tag>
                    <el-tag
                      v-if="row.shop_level"
                      size="small"
                      :style="{ borderColor: getLevelColor(row.shop_level), color: getLevelColor(row.shop_level) }">
                      {{ getLevelLabel(row.shop_level) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="统计周期" width="160" align="center" sortable prop="stat_period_text">
            <template #default="{ row }">
              <div>
                <div>{{ row.stat_period_text }}</div>
                <div class="text-muted text-xs mt2">{{ row.stat_start_date }} ~ {{ row.stat_end_date }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="销售额" width="130" align="right" sortable prop="sales_amount">
            <template #default="{ row }">
              <span class="amount-text">¥{{ formatNumber(row.sales_amount, 2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效销售额" width="130" align="right" sortable prop="valid_sales_amount">
            <template #default="{ row }">
              <span class="amount-text">¥{{ formatNumber(row.valid_sales_amount, 2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已结算/待结算" width="180" align="center">
            <template #default="{ row }">
              <div>
                <div class="success-text">¥{{ formatNumber(row.settled_amount, 2) }}</div>
                <div class="warning-text text-xs mt2">¥{{ formatNumber(row.pending_settlement_amount, 2) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="订单数" width="130" align="center" sortable prop="order_count">
            <template #default="{ row }">
              <div>
                <div>{{ formatNumber(row.valid_order_count) }} / {{ formatNumber(row.order_count) }}</div>
                <div class="text-muted text-xs">有效/总计</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="客单价" width="110" align="right" sortable prop="avg_order_amount">
            <template #default="{ row }">
              <span>¥{{ formatNumber(row.avg_order_amount, 2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="好评率" width="100" align="center" sortable prop="positive_review_rate">
            <template #default="{ row }">
              <el-progress
                :percentage="Number((row.positive_review_rate * 100).toFixed(1))"
                :stroke-width="8"
                :color="row.positive_review_rate >= 0.9 ? '#67C23A' : row.positive_review_rate >= 0.7 ? '#E6A23C' : '#F56C6C'" />
            </template>
          </el-table-column>
          <el-table-column label="数据状态" width="100" align="center" sortable prop="data_status">
            <template #default="{ row }">
              <el-tag :type="getDataStatusTagType(row.data_status)">{{ getDataStatusLabel(row.data_status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="100" align="center" sortable prop="risk_level">
            <template #default="{ row }">
              <el-tag :type="getRiskTagType(row.risk_level)">{{ getRiskLabel(row.risk_level) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="异常" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.abnormal_flag" type="danger" size="small" effect="dark">
                {{ row.abnormal_count || 1 }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDataEntry(row as any)">录入</el-button>
              <el-button link type="warning" @click="openCorrectDialog(row as any)">修正</el-button>
              <el-button link type="success" @click="openTraceDialog(row as any)">溯源</el-button>
              <el-button link type="info" @click="handleCalibrate(row as any)" v-if="(row as any).data_status === 3">校准</el-button>
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

    <BusinessTraceDialog v-model="traceDialogVisible" :business-id="currentBusinessId" />

    <el-dialog v-model="correctDialogVisible" title="数据修正" width="820px" :close-on-click-modal="false">
      <div class="correct-dialog">
        <div class="correct-header">
          <span class="mr8">店铺：<b>{{ currentRow?.shop_name }}</b></span>
          <span>周期：<b>{{ currentRow?.stat_period_text }}</b></span>
        </div>
        <el-alert
          v-if="consistencyWarnings.length > 0"
          type="warning"
          :closable="false"
          show-icon
          :title="`检测到 ${consistencyWarnings.length} 项逻辑一致性问题，请确认`">
          <template #default>
            <ul>
              <li v-for="(w, i) in consistencyWarnings" :key="i">{{ w }}</li>
            </ul>
          </template>
        </el-alert>
        <el-table :data="correctFieldList" border stripe size="default" class="mt16">
          <el-table-column label="字段名" width="140" prop="label" align="center" />
          <el-table-column label="修正前值" width="160" align="right">
            <template #default="{ row }">
              <span class="old-val">{{ formatFieldValue(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="修正后值" width="180" align="center">
            <template #default="{ row }">
              <el-input-number
                v-if="row.isNumber"
                v-model="row.newValue"
                :min="0"
                :precision="row.decimals || 0"
                size="small"
                style="width: 140px"
                @change="calcDiff(row)" />
              <el-input v-else v-model="row.newValue" size="small" style="width: 140px" />
            </template>
          </el-table-column>
          <el-table-column label="差值" width="120" align="right">
            <template #default="{ row }">
              <span :class="getDiffClass(row)">{{ formatDiff(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="差异%" width="120" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.diffPercent !== null" :type="getDiffTagType(row.diffPercent)" size="small">
                {{ row.diffPercent > 0 ? '+' : '' }}{{ row.diffPercent.toFixed(2) }}%
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.remark" size="small" placeholder="修正备注" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="correctDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCorrect">确认修正</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchExportDialogVisible" title="批量导出数据" width="620px">
      <el-form label-width="100px">
        <el-form-item label="导出字段">
          <el-checkbox-group v-model="batchExportForm.fields">
            <el-checkbox v-for="f in BUSINESS_FIELD_OPTIONS" :key="f.value" :label="f.value">{{ f.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序字段">
          <el-select v-model="batchExportForm.sort_field" placeholder="默认按创建时间" style="width: 220px" clearable>
            <el-option v-for="f in SORT_FIELD_OPTIONS" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
          <el-radio-group v-model="batchExportForm.sort_order" style="margin-left: 8px">
            <el-radio-button label="asc">升序</el-radio-button>
            <el-radio-button label="desc">降序</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出数量">
          <el-tag type="info">{{ selectedIds.length }} 条记录</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchExportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchExport">确认导出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchCalibrateDialogVisible" title="批量校准数据" width="500px">
      <el-form label-width="100px">
        <el-form-item label="校准说明">
          <el-input v-model="batchCalibrateForm.remark" type="textarea" :rows="3" placeholder="请说明校准原因" />
        </el-form-item>
        <el-form-item label="校准数量">
          <el-tag type="warning">{{ selectedIds.length }} 条记录</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchCalibrateDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="submitBatchCalibrate">确认校准</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchMarkQualityDialogVisible" :title="`批量标记${batchMarkForm.target_level === 1 ? '优质' : '劣质'}`" width="500px">
      <el-form label-width="100px">
        <el-form-item label="标记说明" required>
          <el-input v-model="batchMarkForm.remark" type="textarea" :rows="3" placeholder="请说明标记原因" />
        </el-form-item>
        <el-form-item label="标记数量">
          <el-tag :type="batchMarkForm.target_level === 1 ? 'success' : 'danger'">{{ selectedIds.length }} 条记录</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchMarkQualityDialogVisible = false">取消</el-button>
        <el-button :type="batchMarkForm.target_level === 1 ? 'success' : 'danger'" @click="submitBatchMarkQuality">
          确认标记
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, Star, Warning } from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/common'
import {
  getBusinessList, correctBusiness, batchExportBusiness, batchCalibrateBusiness, batchMarkQuality,
  STAT_PERIOD_OPTIONS, DATA_STATUS_OPTIONS, RISK_LEVEL_OPTIONS, QUALITY_LEVEL_OPTIONS, BUSINESS_FIELD_OPTIONS,
  type BusinessDataItem
} from '@/api/merchantBusiness'
import { SHOP_CATEGORY_OPTIONS, SHOP_LEVEL_OPTIONS } from '@/api/shopInfo'
import BusinessTraceDialog from './components/BusinessTraceDialog.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tableRef = ref<any>()
const loading = ref(false)
const tableData = ref<BusinessDataItem[]>([])
const selectedIds = ref<number[]>([])
const selectedRows = ref<BusinessDataItem[]>([])

const SORT_FIELD_OPTIONS = [
  { label: '销售额', value: 'sales_amount' },
  { label: '订单数', value: 'order_count' },
  { label: '客单价', value: 'avg_order_amount' },
  { label: '好评率', value: 'positive_review_rate' },
  { label: '创建时间', value: 'created_at' },
]

const searchForm = reactive<any>({
  stat_period_type: 3,
  dateRange: [] as string[],
  data_status_list: [] as number[],
  risk_level_list: [] as number[],
  shop_category: '',
  shop_level: undefined,
  sales_amount_min: undefined,
  sales_amount_max: undefined,
  sort_field: 'created_at',
  sort_order: 'desc' as 'asc' | 'desc',
})

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const isAllSelected = ref(false)
const isIndeterminate = ref(false)
const colWidths = ref<Record<string, number>>({})
const activeCardFilter = ref<string | null>(null)

const statCards = computed(() => {
  const list = tableData.value
  const counts = {
    total: list.length,
    normal: list.filter(r => r.data_status === 1).length,
    corrected: list.filter(r => r.data_status === 2).length,
    abnormal: list.filter(r => r.data_status === 3).length,
    calibrated: list.filter(r => r.data_status === 4).length,
    risk_none: list.filter(r => r.risk_level === 0).length,
    risk_medium: list.filter(r => r.risk_level === 2).length,
    risk_high: list.filter(r => r.risk_level === 3).length,
  }
  return [
    { label: '总计', count: pagination.total || counts.total, color: '#409EFF', key: 'total', active: false },
    { label: '正常数据', count: counts.normal, color: '#67C23A', key: 'data_1', active: activeCardFilter.value === 'data_1' },
    { label: '已修正', count: counts.corrected, color: '#409EFF', key: 'data_2', active: activeCardFilter.value === 'data_2' },
    { label: '异常数据', count: counts.abnormal, color: '#F56C6C', key: 'data_3', active: activeCardFilter.value === 'data_3' },
    { label: '已校准', count: counts.calibrated, color: '#909399', key: 'data_4', active: activeCardFilter.value === 'data_4' },
    { label: '无风险', count: counts.risk_none, color: '#67C23A', key: 'risk_0', active: activeCardFilter.value === 'risk_0' },
    { label: '中风险', count: counts.risk_medium, color: '#E6A23C', key: 'risk_2', active: activeCardFilter.value === 'risk_2' },
    { label: '高风险', count: counts.risk_high, color: '#F56C6C', key: 'risk_3', active: activeCardFilter.value === 'risk_3' },
  ]
})

const traceDialogVisible = ref(false)
const correctDialogVisible = ref(false)
const batchExportDialogVisible = ref(false)
const batchCalibrateDialogVisible = ref(false)
const batchMarkQualityDialogVisible = ref(false)
const currentBusinessId = ref<number>(0)
const currentRow = ref<BusinessDataItem | null>(null)

const correctFieldList = ref<any[]>([])
const consistencyWarnings = ref<string[]>([])

const batchExportForm = reactive({
  fields: BUSINESS_FIELD_OPTIONS.map(f => f.value),
  sort_field: 'created_at',
  sort_order: 'desc' as 'asc' | 'desc',
})
const batchCalibrateForm = reactive({ remark: '' })
const batchMarkForm = reactive({ target_level: 1, remark: '' })

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getLevelLabel = (lv?: number) => SHOP_LEVEL_OPTIONS.find(o => o.value === lv)?.label || '-'
const getLevelColor = (lv?: number) => SHOP_LEVEL_OPTIONS.find(o => o.value === lv)?.color || '#909399'
const getDataStatusLabel = (s?: number) => DATA_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getDataStatusTagType = (s?: number): TagType => {
  const o = DATA_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getRiskLabel = (r?: number) => RISK_LEVEL_OPTIONS.find(o => o.value === r)?.label || '-'
const getRiskTagType = (r?: number): TagType => {
  const o = RISK_LEVEL_OPTIONS.find(x => x.value === r)
  return (o?.type as TagType) || 'info'
}

const rowClassName = ({ row }: { row: BusinessDataItem }) => {
  if (row.data_status === 3 || row.abnormal_flag) return 'abnormal-row'
  return ''
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.stat_period_type = 3
  searchForm.dateRange = []
  searchForm.data_status_list = []
  searchForm.risk_level_list = []
  searchForm.shop_category = ''
  searchForm.shop_level = undefined
  searchForm.sales_amount_min = undefined
  searchForm.sales_amount_max = undefined
  searchForm.sort_field = 'created_at'
  searchForm.sort_order = 'desc'
  activeCardFilter.value = null
  handleSearch()
}

const toggleCardFilter = (c: any) => {
  if (activeCardFilter.value === c.key) {
    activeCardFilter.value = null
    searchForm.data_status_list = []
    searchForm.risk_level_list = []
  } else {
    activeCardFilter.value = c.key
    if (c.key.startsWith('data_')) {
      searchForm.data_status_list = [Number(c.key.split('_')[1])]
      searchForm.risk_level_list = []
    } else if (c.key.startsWith('risk_')) {
      searchForm.risk_level_list = [Number(c.key.split('_')[1])]
      searchForm.data_status_list = []
    }
  }
  pagination.pageNum = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      stat_period_type: searchForm.stat_period_type,
      start_date: searchForm.dateRange?.[0],
      end_date: searchForm.dateRange?.[1],
      data_status_list: searchForm.data_status_list.length ? searchForm.data_status_list : undefined,
      risk_level_list: searchForm.risk_level_list.length ? searchForm.risk_level_list : undefined,
      shop_category: searchForm.shop_category || undefined,
      shop_level: searchForm.shop_level,
      sales_amount_min: searchForm.sales_amount_min,
      sales_amount_max: searchForm.sales_amount_max,
      sort_field: searchForm.sort_field,
      sort_order: searchForm.sort_order,
    }
    const res = await getBusinessList(params)
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
  selectedRows.value = rows as BusinessDataItem[]
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

const openDataEntry = (row: BusinessDataItem) => {
  router.push({ path: '/merchant/businessData', query: { id: String(row.id), merchant_id: String(row.merchant_id) } })
}

const openTraceDialog = (row: BusinessDataItem) => {
  currentBusinessId.value = row.id
  traceDialogVisible.value = true
}

const openCorrectDialog = (row: BusinessDataItem) => {
  currentRow.value = row
  correctFieldList.value = BUSINESS_FIELD_OPTIONS
    .filter(f => !['positive_review_rate', 'avg_order_amount'].includes(f.value))
    .map(f => {
      const val = (row as any)[f.value] ?? 0
      const isNumber = f.unit !== '%'
      return {
        field: f.value,
        label: f.label,
        unit: f.unit,
        isNumber,
        decimals: f.unit === '元' ? 2 : 0,
        oldValue: val,
        newValue: val,
        diffValue: 0,
        diffPercent: null as number | null,
        remark: '',
      }
    })
  consistencyWarnings.value = []
  correctDialogVisible.value = true
}

const formatFieldValue = (row: any) => {
  if (row.unit === '元') return `¥${formatNumber(row.oldValue, 2)}`
  if (row.unit === '%') return `${(row.oldValue * 100).toFixed(2)}%`
  return formatNumber(row.oldValue)
}

const calcDiff = (row: any) => {
  if (!row.isNumber) return
  row.diffValue = Number(row.newValue) - Number(row.oldValue)
  if (Number(row.oldValue) === 0) {
    row.diffPercent = row.newValue > 0 ? 100 : 0
  } else {
    row.diffPercent = (row.diffValue / Number(row.oldValue)) * 100
  }
  checkConsistency()
}

const checkConsistency = () => {
  const warnings: string[] = []
  const map: Record<string, any> = {}
  correctFieldList.value.forEach(f => { map[f.field] = f.newValue })
  if (map.valid_order_count > map.order_count) {
    warnings.push('有效订单数不能大于订单总数')
  }
  if (map.valid_sales_amount > map.sales_amount) {
    warnings.push('有效销售额不能大于销售总额')
  }
  if (map.settled_amount + map.pending_settlement_amount > map.sales_amount) {
    warnings.push('已结算+待结算金额不能大于销售总额')
  }
  if (map.positive_review_count + map.negative_review_count > map.total_review_count) {
    warnings.push('好评数+差评数不能大于总评价数')
  }
  consistencyWarnings.value = warnings
}

const getDiffClass = (row: any) => {
  if (!row.isNumber || row.diffValue === 0) return ''
  return row.diffValue > 0 ? 'success-text' : 'danger-text'
}

const formatDiff = (row: any) => {
  if (!row.isNumber) return '-'
  if (row.unit === '元') return `${row.diffValue > 0 ? '+' : ''}¥${formatNumber(row.diffValue, 2)}`
  return `${row.diffValue > 0 ? '+' : ''}${formatNumber(row.diffValue)}`
}

const getDiffTagType = (percent: number): TagType => {
  const abs = Math.abs(percent)
  if (abs >= 50) return 'danger'
  if (abs >= 20) return 'warning'
  return 'success'
}

const submitCorrect = async () => {
  if (!currentRow.value) return
  const changed = correctFieldList.value.filter(f => Number(f.newValue) !== Number(f.oldValue))
  if (changed.length === 0) {
    ElMessage.warning('请至少修改一个字段')
    return
  }
  if (consistencyWarnings.value.length > 0) {
    try {
      await ElMessageBox.confirm(
        `检测到 ${consistencyWarnings.value.length} 项逻辑一致性问题，是否仍提交修正？`,
        '修正确认',
        { type: 'warning', confirmButtonText: '确认提交', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }
  const payload = {
    business_data_id: currentRow.value.id,
    corrections: changed.map(f => ({
      field_name: f.field,
      value_after: f.newValue,
      remark: f.remark,
    })),
  }
  const res = await correctBusiness(payload as any)
  ElMessage.success(res.data.data.message || '修正成功')
  correctDialogVisible.value = false
  fetchData()
}

const handleCalibrate = async (row: BusinessDataItem) => {
  await ElMessageBox.confirm(`确定校准该条经营数据？`, '校准确认', { type: 'warning' })
  const res = await batchCalibrateBusiness({ business_data_ids: [row.id] })
  ElMessage.success(`校准成功：${res.data.data.success_count}条`)
  fetchData()
}

const openBatchExportDialog = () => {
  batchExportForm.fields = BUSINESS_FIELD_OPTIONS.map(f => f.value)
  batchExportForm.sort_field = searchForm.sort_field || 'created_at'
  batchExportForm.sort_order = searchForm.sort_order || 'desc'
  batchExportDialogVisible.value = true
}

const openBatchCalibrateDialog = () => {
  batchCalibrateForm.remark = ''
  batchCalibrateDialogVisible.value = true
}

const openBatchMarkQualityDialog = (level: number) => {
  batchMarkForm.target_level = level
  batchMarkForm.remark = ''
  batchMarkQualityDialogVisible.value = true
}

const submitBatchExport = async () => {
  if (batchExportForm.fields.length === 0) { ElMessage.warning('请至少选择一个导出字段'); return }
  const res = await batchExportBusiness({
    business_data_ids: selectedIds.value,
    export_fields: batchExportForm.fields,
    sort_field: batchExportForm.sort_field,
    sort_order: batchExportForm.sort_order,
  })
  ElMessage.success(`导出任务已创建，共 ${res.data.data.total_count} 条记录`)
  batchExportDialogVisible.value = false
}

const submitBatchCalibrate = async () => {
  await ElMessageBox.confirm(`确定校准已选 ${selectedIds.value.length} 条数据？`, '批量校准', { type: 'warning' })
  const res = await batchCalibrateBusiness({ business_data_ids: selectedIds.value, remark: batchCalibrateForm.remark })
  ElMessage.success(`校准成功：${res.data.data.success_count}条，失败：${res.data.data.fail_count}条`)
  batchCalibrateDialogVisible.value = false
  fetchData()
}

const submitBatchMarkQuality = async () => {
  if (!batchMarkForm.remark) { ElMessage.warning('请填写标记说明'); return }
  const label = batchMarkForm.target_level === 1 ? '优质' : '劣质'
  await ElMessageBox.confirm(`确定将已选 ${selectedIds.value.length} 条数据标记为「${label}」？`, '批量标记', { type: 'warning' })
  const res = await batchMarkQuality({
    business_data_ids: selectedIds.value,
    target_quality_level: batchMarkForm.target_level,
    remark: batchMarkForm.remark,
  })
  ElMessage.success(`标记成功：${res.data.data.success_count}条，失败：${res.data.data.fail_count}条`)
  batchMarkQualityDialogVisible.value = false
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.page-container { padding: 16px; }
.mb16 { margin-bottom: 16px; }
.mt2 { margin-top: 2px; }
.mt16 { margin-top: 16px; }
.mt8 { margin-top: 8px; }
.ml8 { margin-left: 8px; }
.ml16 { margin-left: 16px; }
.mr4 { margin-right: 4px; }
.mr8 { margin-right: 8px; }
.mx6 { margin: 0 6px; }
.text-xs { font-size: 12px; }
.text-muted { color: var(--el-text-color-secondary); }
.success-text { color: var(--el-color-success); }
.warning-text { color: var(--el-color-warning); }
.danger-text { color: var(--el-color-danger); }
.old-val { color: var(--el-color-danger); text-decoration: line-through; }
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
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.toolbar-right { display: flex; gap: 8px; }
.shop-name-cell { display: flex; align-items: center; gap: 10px; }
.shop-info {
  .shop-name { font-weight: 600; color: var(--el-text-color-primary); }
  .shop-merchant { font-size: 12px; color: var(--el-text-color-regular); margin-top: 2px; }
  .shop-tags { display: flex; gap: 4px; flex-wrap: wrap; }
}
.amount-text { font-weight: 600; color: var(--el-color-primary); }
.paginator { display: flex; justify-content: flex-end; }
:deep(.abnormal-row) { background-color: #fef0f0 !important; }
:deep(.abnormal-row:hover > td) { background-color: #fde2e2 !important; }
.correct-dialog {
  .correct-header { padding: 8px 0 12px; font-size: 14px; }
  ul { padding-left: 18px; margin: 6px 0; li { line-height: 1.8; } }
}
</style>
