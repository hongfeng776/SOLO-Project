<template>
  <div class="stock-page">
    <el-alert
      v-if="dataSourceAlertVisible"
      :title="dataSourceAlertTitle"
      type="warning"
      show-icon
      :closable="true"
      @close="dataSourceAlertVisible = false"
      class="top-alert"
    />

    <div class="status-banner">
      <div class="banner-item">
        <span class="banner-label">交易状态：</span>
        <el-badge
          :value="tradingSession.currentPeriod || '--'"
          :type="tradingSession.inSession ? 'success' : 'info'"
          :class="tradingSession.inSession ? 'badge-pulse' : ''"
        />
        <span v-if="tradingSession.isWeekend" class="banner-tip">（周末）</span>
        <span v-else-if="tradingSession.isHoliday" class="banner-tip">（节假日）</span>
      </div>

      <div class="banner-item">
        <span class="banner-label">下一交易时段：</span>
        <span class="banner-value">{{ tradingSession.nextSessionAt || '--' }}</span>
      </div>

      <div class="banner-item data-sources">
        <span class="banner-label">数据源：</span>
        <div
          v-for="source in dataSourceStatus.sources"
          :key="source.name"
          class="source-indicator"
          :title="`${source.name} - 延迟: ${source.latencyMs}ms`"
        >
          <span
            class="status-indicator"
            :class="source.status === 'healthy' ? 'indicator-green' : 'indicator-red'"
          />
          <span class="source-name">{{ source.name }}</span>
          <span class="source-latency">{{ source.latencyMs }}ms</span>
        </div>
      </div>

      <div class="banner-item auto-refresh-switch">
        <el-switch
          v-model="autoRefreshEnabled"
          active-text="自动刷新"
          inactive-text="手动刷新"
          inline-prompt
          @change="handleRefreshModeChange"
        />
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button v-if="hasPerm('stock:manage')" type="primary" :icon="Plus" @click="handleQuoteEntry">
        录入行情
      </el-button>
      <el-button v-if="hasPerm('stock:manage')" :icon="Upload" @click="handleQuoteImport">
        批量导入
      </el-button>
      <el-button v-if="hasPerm('stock:add')" :icon="Plus" @click="handleAdd">
        新增
      </el-button>
      <el-button
        v-if="hasPerm('stock:batchDelete')"
        type="danger"
        :icon="Delete"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
      <el-button :icon="Download" @click="handleExport">
        导出
      </el-button>

      <div class="toolbar-right">
        <el-dropdown trigger="click">
          <el-button :icon="CaretBottom">
            快捷榜单
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="ranking-dropdown">
              <el-dropdown-item disabled>
                <strong>📈 涨跌幅榜 (Top 10)</strong>
              </el-dropdown-item>
              <el-scrollbar max-height="200px">
                <el-dropdown-item
                  v-for="(stock, idx) in changeRateRanking"
                  :key="'cr-' + stock.id"
                  @click="handleQuickView(stock)"
                >
                  <span class="ranking-index">{{ idx + 1 }}</span>
                  <span class="ranking-code">{{ stock.stockCode }}</span>
                  <span class="ranking-name">{{ stock.stockName }}</span>
                  <span :class="stock.changeRate >= 0 ? 'fin-rise' : 'fin-fall'">
                    {{ stock.changeRate > 0 ? '+' : '' }}{{ formatChangeRate(stock.changeRate) }}
                  </span>
                </el-dropdown-item>
              </el-scrollbar>

              <el-dropdown-item disabled>
                <strong>📊 成交量榜 (Top 10)</strong>
              </el-dropdown-item>
              <el-scrollbar max-height="200px">
                <el-dropdown-item
                  v-for="(stock, idx) in volumeRanking"
                  :key="'vol-' + stock.id"
                  @click="handleQuickView(stock)"
                >
                  <span class="ranking-index">{{ idx + 1 }}</span>
                  <span class="ranking-code">{{ stock.stockCode }}</span>
                  <span class="ranking-name">{{ stock.stockName }}</span>
                  <span>{{ formatVolume(stock.volume) }}</span>
                </el-dropdown-item>
              </el-scrollbar>

              <el-dropdown-item disabled>
                <strong>🔥 热门榜</strong>
              </el-dropdown-item>
              <el-scrollbar max-height="200px">
                <el-dropdown-item
                  v-for="(stock, idx) in hotRanking"
                  :key="'hot-' + stock.id"
                  @click="handleQuickView(stock)"
                >
                  <span class="ranking-index">{{ idx + 1 }}</span>
                  <span class="stock-tag-hot">🔥</span>
                  <span class="ranking-code">{{ stock.stockCode }}</span>
                  <span class="ranking-name">{{ stock.stockName }}</span>
                  <span class="fin-rise">+{{ formatChangeRate(stock.changeRate) }}</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="hotRanking.length === 0" disabled>
                  <span class="ranking-empty">暂无热门股票</span>
                </el-dropdown-item>
              </el-scrollbar>

              <el-dropdown-item disabled>
                <strong>⚠️ 风险榜</strong>
              </el-dropdown-item>
              <el-scrollbar max-height="200px">
                <el-dropdown-item
                  v-for="(stock, idx) in riskRanking"
                  :key="'risk-' + stock.id"
                  @click="handleQuickView(stock)"
                >
                  <span class="ranking-index">{{ idx + 1 }}</span>
                  <span class="stock-tag-risk">⚠️</span>
                  <span class="ranking-code">{{ stock.stockCode }}</span>
                  <span class="ranking-name">{{ stock.stockName }}</span>
                  <span class="fin-fall">{{ formatChangeRate(stock.changeRate) }}</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="riskRanking.length === 0" disabled>
                  <span class="ranking-empty">暂无风险股票</span>
                </el-dropdown-item>
              </el-scrollbar>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button type="success" :icon="Refresh" class="ripple-btn" @click="handleManualRefresh">
          刷新数据
          <span v-if="lastRefreshTime" class="refresh-time">
            ({{ formatRefreshTime(lastRefreshTime) }})
          </span>
        </el-button>
      </div>
    </div>

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading || pollingLoading"
      :pagination="pagination"
      :selection="hasPerm('stock:batchDelete')"
      :showIndex="true"
      :rowClassName="tableRowClassName"
      :editable="hasPerm('stock:edit')"
      :editableColumns="editableColumns"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @cell-dbl-click="handleCellDblClick"
    >
      <template #stockCode="{ row }">
        <div class="stock-code-cell">
          <span v-if="row.isHot" class="stock-tag-hot">🔥</span>
          <span v-if="row.isRisk" class="stock-tag-risk">⚠️</span>
          <span class="code-text">{{ row.stockCode }}</span>
          <el-tag
            v-if="row.status"
            size="small"
            :style="getStockTagStyle(row.status)"
            class="status-tag"
          >
            {{ STOCK_STATUS_LABELS[row.status as keyof typeof STOCK_STATUS_LABELS] }}
          </el-tag>
        </div>
      </template>

      <template #stockName="{ row }">
        <div class="stock-name-cell">
          <span
            class="sector-dot"
            :style="{ backgroundColor: SECTOR_COLORS[row.sector] || '#909399' }"
          />
          <span class="name-text">{{ row.stockName }}</span>
          <span class="change-icons">
            <template v-if="row.status === 'trading'">
              <span v-if="row.changeRate > 5" class="icon-hot">🔥</span>
              <span v-else-if="row.changeRate > 3" class="icon-up">↑</span>
              <span v-else-if="row.changeRate < -5" class="icon-risk">⚠️</span>
              <span v-else-if="row.changeRate < -3" class="icon-down">↓</span>
            </template>
          </span>
        </div>
      </template>

      <template #market="{ row }">
        {{ MARKET_LABELS[row.market as keyof typeof MARKET_LABELS] || row.market }}
      </template>

      <template #currentPrice="{ row }">
        <span
          :class="[getChangeClass(row.changeAmount), 'price-animated', getPriceChangeClass(row.id)]"
        >
          {{ formatPrice(row.currentPrice) }}
        </span>
      </template>

      <template #changeAmount="{ row }">
        <span :class="[getChangeClass(row.changeAmount), 'price-animated']">
          {{ row.status === 'suspended' ? '--' : formatMoney(row.changeAmount, 2) }}
        </span>
      </template>

      <template #changeRate="{ row }">
        <div
          :class="['change-rate-cell', row.isHot ? 'hot-highlight' : '', row.isRisk ? 'risk-highlight' : '']"
        >
          <span :class="[getChangeClass(row.changeRate), 'price-animated']">
            {{ row.status === 'suspended' ? '--' : formatChangeRate(row.changeRate) }}
          </span>
        </div>
      </template>

      <template #sector="{ row }">
        <el-tag
          v-if="row.sector"
          size="small"
          effect="plain"
          :style="getSectorTagStyle(row.sector)"
        >
          {{ row.sector }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #volume="{ row }">
        {{ formatVolume(row.volume) }}
      </template>

      <template #turnover="{ row }">
        {{ formatVolume(row.turnover) }}
      </template>

      <template #totalMarketCap="{ row }">
        {{ formatMarketCap(row.totalMarketCap) }}
      </template>

      <template #tradingPeriod="{ row }">
        <span
          v-if="getTradingPeriodInfo(row.lastSyncAt)"
          class="period-badge"
          :class="getTradingPeriodInfo(row.lastSyncAt)?.class"
        >
          {{ getTradingPeriodInfo(row.lastSyncAt)?.label }}
        </span>
        <span v-else>--</span>
      </template>

      <template #action="{ row }">
        <template v-if="row.status !== 'delisted'">
          <el-button type="primary" link :icon="View" @click="handleView(row)">查看</el-button>
          <el-button
            v-if="hasPerm('stock:view')"
            type="success"
            link
            :icon="Tickets"
            @click="handleAuditTrail(row)"
          >
            溯源
          </el-button>
          <el-button
            v-if="hasPerm('stock:edit') && row.status === 'trading'"
            type="primary"
            link
            :icon="Edit"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasPerm('stock:delete')"
            type="danger"
            link
            :icon="Delete"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
        <span v-else class="delisted-hint">--</span>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      :loading="dialogLoading"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="isView"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="股票代码" prop="stockCode">
              <el-input v-model="formData.stockCode" placeholder="请输入股票代码" @blur="handleValidateCode">
                <template #suffix>
                  <el-icon v-if="codeValidating" class="is-loading"><Loading /></el-icon>
                  <el-icon v-else-if="codeValidation.valid" style="color: #67C23A"><CircleCheckFilled /></el-icon>
                  <el-icon v-else-if="formData.stockCode && !codeValidation.valid" style="color: #F56C6C"><CircleCloseFilled /></el-icon>
                </template>
              </el-input>
              <div v-if="formData.stockCode && !codeValidation.valid && !codeValidating" class="validate-error">
                股票代码格式不正确
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="股票名称" prop="stockName">
              <el-input v-model="formData.stockName" placeholder="请输入股票名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市场" prop="market">
              <el-select v-model="formData.market" placeholder="请选择市场" style="width: 100%">
                <el-option
                  v-for="(label, value) in MARKET_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="板块" prop="sector">
              <el-select v-model="formData.sector" placeholder="请选择板块" style="width: 100%">
                <el-option v-for="sector in MARKET_SECTOR_LIST" :key="sector" :label="sector" :value="sector" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option
                  v-for="(label, value) in STOCK_STATUS_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交易日期" prop="tradeDate">
              <el-date-picker
                v-model="formData.tradeDate"
                type="date"
                placeholder="请选择交易日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现价" prop="currentPrice">
              <el-input-number
                v-model="formData.currentPrice"
                :min="0"
                :precision="2"
                :controls="false"
                :disabled="formData.status !== 'trading'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="涨跌额" prop="changeAmount">
              <el-input-number
                v-model="formData.changeAmount"
                :precision="2"
                :controls="false"
                :disabled="formData.status === 'suspended'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="涨跌幅(%)" prop="changeRate">
              <el-input-number
                v-model="formData.changeRate"
                :precision="2"
                :controls="false"
                :disabled="formData.status === 'suspended'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开盘价" prop="openPrice">
              <el-input-number
                v-model="formData.openPrice"
                :min="0"
                :precision="2"
                :controls="false"
                :disabled="formData.status !== 'trading'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收盘价" prop="closePrice">
              <el-input-number
                v-model="formData.closePrice"
                :min="0"
                :precision="2"
                :controls="false"
                :disabled="formData.status !== 'trading'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高价" prop="highPrice">
              <el-input-number
                v-model="formData.highPrice"
                :min="0"
                :precision="2"
                :controls="false"
                :disabled="formData.status !== 'trading'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低价" prop="lowPrice">
              <el-input-number
                v-model="formData.lowPrice"
                :min="0"
                :precision="2"
                :controls="false"
                :disabled="formData.status !== 'trading'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成交量" prop="volume">
              <el-input-number
                v-model="formData.volume"
                :min="0"
                :precision="0"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成交额" prop="turnover">
              <el-input-number
                v-model="formData.turnover"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市盈率" prop="peRatio">
              <el-input-number
                v-model="formData.peRatio"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市净率" prop="pbRatio">
              <el-input-number
                v-model="formData.pbRatio"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总市值" prop="totalMarketCap">
              <el-input-number
                v-model="formData.totalMarketCap"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </FinDialog>

    <QuoteEntryDialog
      v-model:visible="quoteEntryVisible"
      mode="create"
      @success="handleQuoteEntrySuccess"
      @refresh="fetchData"
    />

    <QuoteImportDialog
      v-model:visible="quoteImportVisible"
      @success="handleQuoteImportSuccess"
      @refresh="fetchData"
    />

    <el-dialog
      v-model="quickEditVisible"
      :title="`编辑 ${quickEditColumnLabel}`"
      width="420px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="quickEditFormRef" :model="quickEditForm" :rules="quickEditRules" label-width="90px">
        <el-form-item label="股票代码">
          <span>{{ quickEditRow?.stockCode }}</span>
          <el-tag size="small" style="margin-left: 8px">{{ quickEditRow?.stockName }}</el-tag>
        </el-form-item>
        <el-form-item label="原值">
          <span class="original-value">{{ formatQuickEditValue(quickEditColumn, quickEditOriginalValue) }}</span>
        </el-form-item>
        <el-form-item :label="quickEditColumnLabel" prop="newValue">
          <el-input-number
            v-model="quickEditForm.newValue"
            :min="getQuickEditMin()"
            :precision="getQuickEditPrecision()"
            :step="getQuickEditStep()"
            :controls="false"
            style="width: 100%"
            @blur="handleQuickEditValidate"
          />
        </el-form-item>
        <el-form-item v-if="quickEditWarning" label="波动提示">
          <el-alert :title="quickEditWarning" type="warning" show-icon :closable="false" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleQuickEditCancel">取消</el-button>
        <el-button type="primary" :loading="quickEditLoading" @click="handleQuickEditConfirm">
          确定
        </el-button>
      </template>
    </el-dialog>

    <QuoteAuditTrailDialog
      v-model:visible="auditTrailVisible"
      :stock-id="currentAuditStockId"
      :stock-code="currentAuditStockCode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type FormItemRule } from 'element-plus'
import {
  Plus,
  Delete,
  Download,
  View,
  Edit,
  Refresh,
  Loading,
  CircleCheckFilled,
  CircleCloseFilled,
  ArrowDown,
  CaretBottom,
  Upload,
  Tickets,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { usePermission } from '@/hooks/usePermission'
import { usePolling } from '@/hooks/usePolling'
import {
  MARKET_LABELS,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_COLORS,
  SECTOR_COLORS,
  MARKET_SECTOR_LIST,
  FIELD_LABELS,
  TRADING_PERIOD_LABELS,
} from '@/constants/dictionaries'
import { HOT_RISE_THRESHOLD, RISK_FALL_THRESHOLD } from '@/enums'
import { formatMoney, formatVolume, formatMarketCap, formatChangeRate } from '@/utils/format'
import * as stockApi from '@/api/stockQuote'
import QuoteEntryDialog from './QuoteEntryDialog.vue'
import QuoteImportDialog from './QuoteImportDialog.vue'
import QuoteAuditTrailDialog from './QuoteAuditTrailDialog.vue'
import type {
  IStockQuote,
  IPaginatedData,
  ITradingSession,
  IDataSourceStatus,
  IStockValidation,
} from '@/types/api'
import type { ITableColumn } from '@/types/components'

const { hasPerm } = usePermission()

const loading = ref(false)
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const isView = ref(false)
const selectedIds = ref<number[]>([])
const lastRefreshTime = ref<Date | null>(null)
const autoRefreshEnabled = ref(false)
const pollingLoading = ref(false)
const dataSourceAlertVisible = ref(false)
const dataSourceAlertTitle = ref('')
const codeValidating = ref(false)
const codeValidation = reactive<IStockValidation>({ valid: true, format: '', market: '' })

const quoteEntryVisible = ref(false)
const quoteImportVisible = ref(false)

const auditTrailVisible = ref(false)
const currentAuditStockId = ref<number | null>(null)
const currentAuditStockCode = ref('')

const quickEditVisible = ref(false)
const quickEditLoading = ref(false)
const quickEditFormRef = ref<FormInstance>()
const quickEditRow = ref<IStockQuote | null>(null)
const quickEditColumn = ref('')
const quickEditOriginalValue = ref<number>(0)
const quickEditWarning = ref('')
const quickEditForm = reactive<{ newValue: number | null }>({ newValue: null })

const editableColumns = ['currentPrice', 'changeAmount', 'changeRate', 'volume', 'turnover']

const priceChangeMap = reactive<Record<number, 'up' | 'down' | ''>>({})

const tradingSession = reactive<ITradingSession>({
  inSession: false,
  currentPeriod: '',
  nextSessionAt: '',
  isWeekend: false,
  isHoliday: false,
})

const dataSourceStatus = reactive<IDataSourceStatus>({
  overallStatus: 'healthy',
  healthyCount: 0,
  totalCount: 0,
  sources: [],
})

const tableData = ref<IStockQuote[]>([])
const cachedTableData = ref<IStockQuote[]>([])

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchParams = reactive<Record<string, any>>({})

const dialogType = ref<'add' | 'edit' | 'view'>('add')
const dialogTitle = computed(() => {
  const titles = { add: '新增股票', edit: '编辑股票', view: '查看股票' }
  return titles[dialogType.value]
})
const dialogWidth = '900px'

const formRef = ref<FormInstance>()
const formData = reactive<Partial<IStockQuote>>({
  stockCode: '',
  stockName: '',
  market: '',
  sector: '',
  status: 'trading',
  tradeDate: '',
  currentPrice: 0,
  changeAmount: 0,
  changeRate: 0,
  openPrice: 0,
  closePrice: 0,
  highPrice: 0,
  lowPrice: 0,
  volume: 0,
  turnover: 0,
  peRatio: 0,
  pbRatio: 0,
  totalMarketCap: 0,
})

const formRules: FormRules = {
  stockCode: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  stockName: [{ required: true, message: '请输入股票名称', trigger: 'blur' }],
  market: [{ required: true, message: '请选择市场', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  tradeDate: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  currentPrice: [{ required: true, message: '请输入现价', trigger: 'blur' }],
}

const quickEditColumnLabel = computed(() => FIELD_LABELS[quickEditColumn.value] || quickEditColumn.value)

const quickEditRules: FormRules = {
  newValue: [
    { required: true, message: '请输入新值', trigger: 'blur' } as FormItemRule,
    {
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || isNaN(Number(value))) {
          callback(new Error('请输入有效的数值'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    } as FormItemRule,
  ],
}

const filterConfig = [
  { prop: 'keyword', label: '股票代码/名称', type: 'input' as const, placeholder: '请输入股票代码或名称' },
  {
    prop: 'market',
    label: '市场',
    type: 'select' as const,
    options: Object.entries(MARKET_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select' as const,
    options: Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'sector',
    label: '板块',
    type: 'select' as const,
    options: MARKET_SECTOR_LIST.map(s => ({ value: s, label: s })),
  },
  { prop: 'tradeDate', label: '交易日期', type: 'date' as const },
]

const tableColumns: ITableColumn[] = [
  { prop: 'stockCode', label: '股票代码', width: 170, fixed: 'left' as const, slot: 'stockCode' },
  { prop: 'stockName', label: '股票名称', width: 210, fixed: 'left' as const, slot: 'stockName' },
  { prop: 'sector', label: '板块', width: 100, slot: 'sector' },
  { prop: 'market', label: '市场', width: 100, slot: 'market' },
  { prop: 'currentPrice', label: '现价', width: 110, slot: 'currentPrice', sortable: true },
  { prop: 'changeAmount', label: '涨跌额', width: 110, slot: 'changeAmount', sortable: true },
  { prop: 'changeRate', label: '涨跌幅', width: 130, slot: 'changeRate', sortable: true },
  { prop: 'openPrice', label: '开盘价', width: 100, type: 'money' as const },
  { prop: 'closePrice', label: '收盘价', width: 100, type: 'money' as const },
  { prop: 'highPrice', label: '最高价', width: 100, type: 'money' as const },
  { prop: 'lowPrice', label: '最低价', width: 100, type: 'money' as const },
  { prop: 'volume', label: '成交量', width: 120, slot: 'volume', sortable: true },
  { prop: 'turnover', label: '成交额', width: 120, slot: 'turnover', sortable: true },
  { prop: 'peRatio', label: '市盈率', width: 100, type: 'money' as const, precision: 2 },
  { prop: 'pbRatio', label: '市净率', width: 100, type: 'money' as const, precision: 2 },
  { prop: 'totalMarketCap', label: '总市值', width: 130, slot: 'totalMarketCap', sortable: true },
  { prop: 'tradeDate', label: '交易日期', width: 120, type: 'date' as const },
  { prop: 'tradingPeriod', label: '时段', width: 90, slot: 'tradingPeriod' },
  { prop: 'action', label: '操作', width: 260, fixed: 'right' as const, slot: 'action' },
]

const allStockData = computed(() => tableData.value)

const changeRateRanking = computed(() =>
  [...allStockData.value]
    .filter(s => s.status === 'trading')
    .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate))
    .slice(0, 10),
)

const volumeRanking = computed(() =>
  [...allStockData.value]
    .filter(s => s.status === 'trading')
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10),
)

const hotRanking = computed(() =>
  [...allStockData.value]
    .filter(s => s.status === 'trading' && s.changeRate >= HOT_RISE_THRESHOLD)
    .sort((a, b) => b.changeRate - a.changeRate)
    .slice(0, 10),
)

const riskRanking = computed(() =>
  [...allStockData.value]
    .filter(s => s.status === 'trading' && s.changeRate <= RISK_FALL_THRESHOLD)
    .sort((a, b) => a.changeRate - b.changeRate)
    .slice(0, 10),
)

function getStockTagStyle(status: string) {
  const color = STOCK_STATUS_COLORS[status as keyof typeof STOCK_STATUS_COLORS]
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

function getSectorTagStyle(sector: string) {
  const color = SECTOR_COLORS[sector] || '#909399'
  return {
    borderColor: `${color}50`,
    color,
  }
}

function formatPrice(value: number): string {
  if (value === null || value === undefined || value === 0) return '--'
  return formatMoney(value, 2)
}

function formatRefreshTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

function getChangeClass(value: number): string {
  if (value > 0) return 'fin-rise'
  if (value < 0) return 'fin-fall'
  return ''
}

function getPriceChangeClass(id: number): string {
  const change = priceChangeMap[id]
  if (change === 'up') return 'price-change-up'
  if (change === 'down') return 'price-change-down'
  return ''
}

function tableRowClassName({ row }: { row: IStockQuote }): string {
  const classes = ['row-hover-shadow']
  if (row.status) {
    classes.push(`row-${row.status}`)
  }
  return classes.join(' ')
}

function markHotAndRisk(stocks: IStockQuote[]): IStockQuote[] {
  return stocks.map(stock => {
    const isHot = stock.changeRate >= HOT_RISE_THRESHOLD
    const isRisk = stock.changeRate <= RISK_FALL_THRESHOLD
    return { ...stock, isHot, isRisk }
  })
}

function detectPriceChanges(oldList: IStockQuote[], newList: IStockQuote[]) {
  const oldMap = new Map(oldList.map(s => [s.id, s.currentPrice]))
  newList.forEach(stock => {
    const oldPrice = oldMap.get(stock.id)
    if (oldPrice !== undefined && oldPrice !== stock.currentPrice) {
      priceChangeMap[stock.id] = stock.currentPrice > oldPrice ? 'up' : 'down'
      setTimeout(() => {
        priceChangeMap[stock.id] = ''
      }, 800)
    }
  })
}

async function fetchTradingSession() {
  try {
    const res = await stockApi.getTradingSession()
    Object.assign(tradingSession, res.data)
  } catch (error) {
    console.error('获取交易时段失败:', error)
    Object.assign(tradingSession, {
      inSession: true,
      currentPeriod: '盘中',
      nextSessionAt: '下一交易日 09:30',
      isWeekend: false,
      isHoliday: false,
    })
  }
}

async function fetchDataSourceStatus() {
  try {
    const res = await stockApi.getDataSourceStatus()
    Object.assign(dataSourceStatus, res.data)
    if (dataSourceStatus.overallStatus !== 'healthy') {
      dataSourceAlertTitle.value = `数据源异常：${dataSourceStatus.healthyCount}/${dataSourceStatus.totalCount} 个可用`
      dataSourceAlertVisible.value = true
    }
  } catch (error) {
    console.error('获取数据源状态失败:', error)
    Object.assign(dataSourceStatus, {
      overallStatus: 'healthy',
      healthyCount: 3,
      totalCount: 3,
      sources: [
        { name: '上交所', status: 'healthy', latencyMs: 45 },
        { name: '深交所', status: 'healthy', latencyMs: 52 },
        { name: '港交所', status: 'healthy', latencyMs: 128 },
      ],
    })
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    const res = await stockApi.getList(params)
    const data = res.data as IPaginatedData<IStockQuote>
    const oldData = [...tableData.value]
    const enriched = markHotAndRisk(data.list)
    detectPriceChanges(oldData, enriched)
    tableData.value = enriched
    cachedTableData.value = enriched
    pagination.total = data.total
  } catch (error) {
    console.error('获取股票列表失败:', error)
    if (cachedTableData.value.length > 0) {
      tableData.value = cachedTableData.value
      ElMessage.warning('网络请求失败，已显示缓存数据')
    } else {
      ElMessage.error('获取股票列表失败')
    }
  } finally {
    loading.value = false
    lastRefreshTime.value = new Date()
  }
}

async function pollingRefresh() {
  pollingLoading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    const res = await stockApi.getList(params)
    const data = res.data as IPaginatedData<IStockQuote>
    const oldData = [...tableData.value]
    const enriched = markHotAndRisk(data.list)
    detectPriceChanges(oldData, enriched)
    tableData.value = enriched
    cachedTableData.value = enriched
    pagination.total = data.total
    lastRefreshTime.value = new Date()
  } catch (error) {
    console.error('自动刷新失败:', error)
  } finally {
    pollingLoading.value = false
  }
}

const { pause: pausePolling, resume: resumePolling, refresh: forceRefresh } = usePolling(
  pollingRefresh,
  10000,
  { immediate: false, enabled: false },
)

function handleRefreshModeChange(val: boolean) {
  if (val) {
    resumePolling()
    ElMessage.success('已开启自动刷新（每10秒）')
  } else {
    pausePolling()
    ElMessage.info('已切换为手动刷新模式')
  }
}

async function handleManualRefresh(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  target.classList.add('ripple-active')
  setTimeout(() => target.classList.remove('ripple-active'), 600)

  try {
    await stockApi.refreshAllPrices()
    if (autoRefreshEnabled.value) {
      await forceRefresh()
    } else {
      await fetchData()
    }
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('刷新失败:', error)
    await fetchData()
    ElMessage.warning('直接刷新数据成功')
  }
}

async function handleValidateCode() {
  if (!formData.stockCode) {
    codeValidation.valid = true
    return
  }
  codeValidating.value = true
  try {
    const res = await stockApi.validateCode(formData.stockCode, formData.market || '')
    Object.assign(codeValidation, res.data)
  } catch (error) {
    codeValidation.valid = /^\d{6}$/.test(formData.stockCode)
  } finally {
    codeValidating.value = false
  }
}

function handleQuickView(stock: IStockQuote) {
  handleView(stock)
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete searchParams[key]
  })
  pagination.page = 1
  fetchData()
}

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map(item => item.id)
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

function handleQuoteEntry() {
  quoteEntryVisible.value = true
}

function handleQuoteImport() {
  quoteImportVisible.value = true
}

function handleQuoteEntrySuccess() {
  fetchData()
}

function handleQuoteImportSuccess() {
  fetchData()
}

function handleAdd() {
  dialogType.value = 'add'
  isView.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: IStockQuote) {
  dialogType.value = 'edit'
  isView.value = false
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleView(row: IStockQuote) {
  dialogType.value = 'view'
  isView.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleDelete(row: IStockQuote) {
  try {
    await ElMessageBox.confirm(`确定要删除股票"${row.stockName}"吗？`, '删除确认', {
      type: 'warning',
    })
    await stockApi.delete(row.id as number)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条股票数据吗？`,
      '批量删除确认',
      { type: 'warning' },
    )
    await stockApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

async function handleExport() {
  try {
    const params = { ...searchParams }
    const res = await stockApi.exportStock(params)
    const blob = new Blob([res.data as BlobPart], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `股票行情数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

async function handleDialogConfirm() {
  if (!formRef.value) return
  if (isView.value) {
    dialogVisible.value = false
    return
  }

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (dialogType.value === 'add') {
    if (checkDuplicateRecord(formData.stockCode || '', formData.tradeDate || '')) {
      return
    }
  } else {
    if (checkDuplicateRecord(formData.stockCode || '', formData.tradeDate || '', formData.id as number)) {
      return
    }
  }

  try {
    dialogLoading.value = true

    if (dialogType.value === 'add') {
      await stockApi.create(formData)
      ElMessage.success('新增成功')
    } else {
      await stockApi.update(formData.id as number, formData)
      ElMessage.success('编辑成功')
    }

    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    dialogLoading.value = false
  }
}

function handleDialogCancel() {
  dialogVisible.value = false
  resetForm()
}

function resetForm() {
  Object.assign(formData, {
    stockCode: '',
    stockName: '',
    market: '',
    sector: '',
    status: 'trading',
    tradeDate: '',
    currentPrice: 0,
    changeAmount: 0,
    changeRate: 0,
    openPrice: 0,
    closePrice: 0,
    highPrice: 0,
    lowPrice: 0,
    volume: 0,
    turnover: 0,
    peRatio: 0,
    pbRatio: 0,
    totalMarketCap: 0,
  })
  codeValidation.valid = true
  formRef.value?.resetFields()
}

function getTradingPeriodInfo(lastSyncAt?: string): { label: string; class: string } | null {
  if (!lastSyncAt) return null
  const time = dayjs(lastSyncAt)
  const hourMinute = time.format('HH:mm')
  if (hourMinute >= '09:30' && hourMinute <= '11:30') {
    return { label: '早盘', class: 'early-morning' }
  }
  if (hourMinute >= '13:00' && hourMinute <= '15:00') {
    return { label: '午盘', class: 'midday' }
  }
  if (hourMinute > '15:00') {
    return { label: '盘后', class: 'after-close' }
  }
  const keys = Object.keys(TRADING_PERIOD_LABELS).sort()
  for (const key of keys) {
    if (hourMinute <= key) {
      return TRADING_PERIOD_LABELS[key]
    }
  }
  return { label: '盘后', class: 'after-close' }
}

function handleAuditTrail(row: IStockQuote) {
  currentAuditStockId.value = row.id || null
  currentAuditStockCode.value = row.stockCode || ''
  auditTrailVisible.value = true
}

function checkDuplicateRecord(stockCode: string, tradeDate: string, excludeId?: number): boolean {
  const exists = tableData.value.some(
    item =>
      item.stockCode === stockCode &&
      item.tradeDate === tradeDate &&
      (excludeId === undefined || item.id !== excludeId),
  )
  if (exists) {
    ElMessage.warning('已存在相同交易日数据，详情请查看溯源')
    return true
  }
  return false
}

function handleCellDblClick(row: IStockQuote, column: ITableColumn, _cell: HTMLElement | undefined, _event: Event) {
  if (!hasPerm('stock:edit') || row.status !== 'trading') return
  if (!editableColumns.includes(column.prop)) return
  if (row.status === 'delisted' || row.status === 'suspended') return

  const val = row[column.prop as keyof IStockQuote]
  if (typeof val !== 'number') return

  quickEditRow.value = { ...row }
  quickEditColumn.value = column.prop
  quickEditOriginalValue.value = val
  quickEditForm.newValue = val
  quickEditWarning.value = ''
  nextTick(() => {
    quickEditVisible.value = true
  })
}

function formatQuickEditValue(column: string, value: number): string {
  if (value === null || value === undefined) return '--'
  if (column === 'changeRate') {
    const result = formatChangeRate(value)
    return result.text
  }
  if (column === 'volume') return formatVolume(value)
  if (column === 'turnover') return formatMarketCap(value)
  return formatMoney(value, 2, '')
}

function getQuickEditMin(): number {
  if (quickEditColumn.value === 'changeRate' || quickEditColumn.value === 'changeAmount') {
    return -Infinity
  }
  return 0
}

function getQuickEditPrecision(): number {
  if (quickEditColumn.value === 'volume') return 0
  return 2
}

function getQuickEditStep(): number {
  if (quickEditColumn.value === 'volume') return 100
  if (quickEditColumn.value === 'turnover') return 1000
  return 0.01
}

async function handleQuickEditValidate() {
  if (!quickEditRow.value || quickEditForm.newValue === null) return
  try {
    const res = await stockApi.checkFluctuation(
      quickEditRow.value.id as number,
      quickEditColumn.value,
      quickEditForm.newValue,
    )
    if (res.data && res.data.warning) {
      quickEditWarning.value = res.data.warning
    } else {
      quickEditWarning.value = ''
    }
  } catch {
    quickEditWarning.value = ''
  }
}

async function handleQuickEditConfirm() {
  if (!quickEditFormRef.value || !quickEditRow.value) return
  try {
    await quickEditFormRef.value.validate()
  } catch {
    return
  }

  const updateData: Partial<IStockQuote> = {
    [quickEditColumn.value]: quickEditForm.newValue,
  }

  try {
    const validateRes = await stockApi.validateRecord({ ...quickEditRow.value, ...updateData })
    if (validateRes.data && !validateRes.data.valid && validateRes.data.errors?.length) {
      ElMessage.error(validateRes.data.errors[0])
      return
    }
  } catch {
    // 忽略校验错误继续执行
  }

  try {
    quickEditLoading.value = true
    await stockApi.update(quickEditRow.value.id as number, updateData)

    const idx = tableData.value.findIndex(item => item.id === quickEditRow.value?.id)
    if (idx !== -1 && quickEditForm.newValue !== null) {
      const field = quickEditColumn.value as keyof IStockQuote
      tableData.value[idx] = {
        ...tableData.value[idx],
        [field]: quickEditForm.newValue,
      }
    }

    ElMessage.success('编辑成功')
    quickEditVisible.value = false
  } catch (error) {
    console.error('快速编辑失败:', error)
    ElMessage.error('编辑失败')
  } finally {
    quickEditLoading.value = false
  }
}

function handleQuickEditCancel() {
  quickEditVisible.value = false
  quickEditRow.value = null
  quickEditWarning.value = ''
}

onMounted(async () => {
  await Promise.all([fetchTradingSession(), fetchDataSourceStatus()])
  await fetchData()
})
</script>

<style lang="scss" scoped>
.stock-page {
  padding: 20px;

  .top-alert {
    margin-bottom: 16px;
  }

  .status-banner {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #e4e9f2;

    .banner-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .banner-label {
        color: #606266;
        font-weight: 500;
      }

      .banner-value {
        color: #1f2d3d;
        font-weight: 600;
      }

      .banner-tip {
        color: #909399;
        font-size: 12px;
      }
    }

    .data-sources {
      gap: 16px;
      flex: 1;
      flex-wrap: wrap;

      .source-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #ebeef5;

        .source-name {
          color: #606266;
          font-size: 12px;
        }

        .source-latency {
          color: #909399;
          font-size: 11px;
          font-family: monospace;
        }
      }
    }

    .auto-refresh-switch {
      margin-left: auto;
    }
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;

    &.indicator-green {
      background: #67C23A;
      box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
    }

    &.indicator-red {
      background: #F56C6C;
      box-shadow: 0 0 6px rgba(245, 108, 108, 0.6);
    }
  }

  .badge-pulse {
    :deep(.el-badge__content) {
      animation: pulse-dot 2s infinite;
    }
  }

  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
    align-items: center;

    .toolbar-right {
      margin-left: auto;
      display: flex;
      gap: 8px;
      align-items: center;

      .refresh-time {
        font-size: 12px;
        color: #909399;
        margin-left: 4px;
      }
    }
  }

  .ranking-dropdown {
    max-height: 500px;
    overflow: hidden;

    .ranking-index {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      text-align: center;
      background: #f0f2f5;
      border-radius: 4px;
      margin-right: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #606266;
    }

    .ranking-code {
      font-family: monospace;
      margin-right: 10px;
      font-weight: 500;
    }

    .ranking-name {
      margin-right: 12px;
      color: #606266;
    }

    .ranking-empty {
      color: #c0c4cc;
      font-size: 12px;
      padding: 8px 0;
    }
  }

  .stock-code-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .code-text {
      font-family: 'Consolas', 'Monaco', monospace;
      font-weight: 600;
      color: #1f2d3d;
    }

    .status-tag {
      margin-left: 4px;
      font-size: 11px;
      padding: 0 6px;
      height: 18px;
      line-height: 16px;
    }
  }

  .stock-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .sector-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .name-text {
      font-weight: 500;
      color: #1f2d3d;
    }

    .change-icons {
      display: inline-flex;
      gap: 2px;

      .icon-hot {
        animation: pulse 1s infinite;
      }

      .icon-up {
        color: #f56c6c;
        font-weight: bold;
      }

      .icon-risk {
        animation: shake 0.8s infinite;
      }

      .icon-down {
        color: #67c23a;
        font-weight: bold;
      }
    }
  }

  .change-rate-cell {
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;

    &.hot-highlight {
      background: rgba(245, 108, 108, 0.1);
    }

    &.risk-highlight {
      background: rgba(230, 162, 60, 0.1);
    }
  }

  .price-animated {
    display: inline-block;
    transition: all 0.3s ease;
  }

  .price-change-up {
    animation: priceUp 0.8s ease;
  }

  .price-change-down {
    animation: priceDown 0.8s ease;
  }

  .delisted-hint {
    color: #c0c4cc;
  }

  .validate-error {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;
  }

  .stock-tag-hot {
    display: inline-block;
    animation: pulse 1.2s infinite;
    font-size: 14px;
  }

  .stock-tag-risk {
    display: inline-block;
    animation: shake 0.8s infinite;
    font-size: 14px;
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    &.ripple-active::after {
      animation: ripple 0.6s ease-out forwards;
    }
  }
}

:deep(.el-table) {
  .row-hover-shadow {
    transition: all 0.3s ease-out;
    background-color: transparent;
  }

  .row-hover-shadow:hover {
    box-shadow: 0 4px 16px rgba(26, 58, 92, 0.12);
    background-color: rgba(248, 250, 252, 0.8);
    position: relative;
    z-index: 1;
  }

  .row-trading {
    & .el-table__cell {
      color: #1f2d3d;
    }
  }

  .row-holiday {
    opacity: 0.55;

    & .el-table__cell {
      background-color: #f5f7fa !important;
      color: #909399;
    }
  }

  .row-suspended {
    & .el-table__cell {
      background-color: #fdf6ec !important;
      border-top: 1px solid #e6a23c40;
      border-bottom: 1px solid #e6a23c40;

      &:first-child {
        border-left: 2px solid #E6A23C;
      }

      &:last-child {
        border-right: 2px solid #E6A23C;
      }
    }
  }

  .row-delisted {
    opacity: 0.4;

    & .el-table__cell {
      background-color: #f0f2f5 !important;
      color: #c0c4cc;
    }
  }
}

.fin-rise {
  color: var(--fin-danger, #f56c6c);
  font-weight: 500;
}

.fin-fall {
  color: var(--fin-success, #67c23a);
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.8;
  }
}

@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(103, 194, 58, 0);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-1px);
  }
  75% {
    transform: translateX(1px);
  }
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.6;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

@keyframes priceUp {
  0% {
    color: inherit;
    transform: translateY(0);
  }
  30% {
    color: #f56c6c;
    background-color: rgba(245, 108, 108, 0.15);
    border-radius: 4px;
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes priceDown {
  0% {
    color: inherit;
    transform: translateY(0);
  }
  30% {
    color: #67c23a;
    background-color: rgba(103, 194, 58, 0.15);
    border-radius: 4px;
    transform: translateY(2px);
  }
  100% {
    transform: translateY(0);
  }
}

.original-value {
  display: inline-block;
  padding: 2px 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-weight: 500;
  color: #606266;
}
</style>
