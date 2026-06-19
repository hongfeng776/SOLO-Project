<template>
  <div class="flight-manage">
    <div class="main-tabs">
      <el-tabs v-model="activeModule" type="card" @tab-change="handleModuleChange">
        <el-tab-pane label="航班资源管控" name="flight">
          <template #label>
            <div class="tab-label">
              <el-icon><Airplane /></el-icon>
              <span>航班资源管控</span>
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="价格体系管理" name="price">
          <template #label>
            <div class="tab-label">
              <el-icon><Money /></el-icon>
              <span>价格体系管理</span>
              <el-badge :value="priceStats.total || 0" :max="999" class="tab-badge" />
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div v-show="activeModule === 'flight'">
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
        <h2>航班资源列表</h2>
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
    </div>

    <div v-show="activeModule === 'price'">
      <div class="stats-row">
        <div class="stat-card price-stat">
          <div class="stat-label">价格配置总数</div>
          <div class="stat-value" style="color: #1890ff">{{ priceStats.total || 0 }}</div>
        </div>
        <div class="stat-card price-stat">
          <div class="stat-label">平均价格</div>
          <div class="stat-value" style="color: #52c41a">¥{{ priceStats.avgPrice?.toFixed(2) || '0.00' }}</div>
        </div>
        <div class="stat-card price-stat">
          <div class="stat-label">最低价格</div>
          <div class="stat-value" style="color: #13c2c2">¥{{ priceStats.minPrice?.toFixed(2) || '0.00' }}</div>
        </div>
        <div class="stat-card price-stat">
          <div class="stat-label">最高价格</div>
          <div class="stat-value" style="color: #ff4d4f">¥{{ priceStats.maxPrice?.toFixed(2) || '0.00' }}</div>
        </div>
      </div>

      <div class="type-tabs">
        <el-tabs v-model="activeCabinClass" @tab-change="handleCabinClassChange">
          <el-tab-pane label="全部舱位" name="all">
            <span class="type-tab-badge">{{ priceStats.total || 0 }}</span>
          </el-tab-pane>
          <el-tab-pane
            v-for="(cabin, key) in CabinClassEnum"
            :key="key"
            :label="cabin.label"
            :name="cabin.value"
          >
            <span class="type-tab-badge" :style="{ background: cabin.color + '30', color: cabin.color }">
              {{ priceStats.byCabinClass?.[cabin.value]?.count || 0 }}
            </span>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="page-header">
        <h2>价格配置列表</h2>
        <div>
          <el-button type="primary" :icon="Plus" @click="handleAddPrice">新增价格</el-button>
          <el-button :icon="Setting" @click="handleOpenRuleDialog">
            动态定价规则
          </el-button>
          <el-button :icon="Refresh" style="margin-left: 8px" @click="fetchPriceData">刷新</el-button>
        </div>
      </div>

      <div class="search-form">
        <el-form :inline="true" :model="priceSearchForm" @submit.prevent>
          <el-form-item label="航班号">
            <el-input v-model="priceSearchForm.flightNo" placeholder="请输入航班号" clearable />
          </el-form-item>
          <el-form-item label="价格来源">
            <el-select v-model="priceSearchForm.priceSource" placeholder="请选择" clearable style="width: 140px">
              <el-option
                v-for="(item, key) in FlightPriceSourceEnum"
                :key="key"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="生效状态">
            <el-select v-model="priceSearchForm.isActive" placeholder="请选择" clearable style="width: 120px">
              <el-option label="已生效" :value="1" />
              <el-option label="未生效" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="生效时间段">
            <el-date-picker
              v-model="priceSearchForm.effectiveTime"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 280px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handlePriceSearch">搜索</el-button>
            <el-button :icon="RefreshRight" @click="handlePriceReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="price-toolbar">
        <div class="toolbar-left">
          <el-button
            type="primary"
            :icon="DataAnalysis"
            :disabled="priceSelectedIds.length === 0"
            @click="handleOpenBatchDialog"
          >
            批量调整 ({{ priceSelectedIds.length }})
          </el-button>
          <el-button
            :icon="Upload"
            :disabled="priceSelectedIds.length === 0"
            @click="handleBatchDisplayStatus(1)"
          >
            批量启用
          </el-button>
          <el-button
            :icon="Download"
            :disabled="priceSelectedIds.length === 0"
            @click="handleBatchDisplayStatus(0)"
          >
            批量停用
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tag type="info" size="small">
            已选择 {{ priceSelectedIds.length }} 条价格配置
          </el-tag>
        </div>
      </div>

      <div class="table-container" :class="{ 'table-fade-refresh': isPriceRefreshing }">
        <el-table
          ref="priceTableRef"
          :data="priceTableData"
          v-loading="priceLoading"
          border
          stripe
          class="sticky-table-header price-table"
          @selection-change="handlePriceSelectionChange"
          :row-class-name="priceTableRowClassName"
        >
          <el-table-column type="selection" width="50" fixed="left" />
          <el-table-column prop="id" label="ID" width="70" fixed="left" />
          <el-table-column label="航班信息" width="200" fixed="left">
            <template #default="{ row }">
              <div>
                <div style="font-weight: 600; font-size: 14px">{{ row.flightNo }}</div>
                <div style="font-size: 12px; color: #909399; margin-top: 2px">
                  {{ row.flight?.departureAirportCode }} → {{ row.flight?.arrivalAirportCode }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="舱位" width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :style="{ background: getCabinColor(row.cabinClass) + '20', color: getCabinColor(row.cabinClass), borderColor: getCabinColor(row.cabinClass) }"
              >
                {{ getCabinLabel(row.cabinClass) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="基准票价" width="120">
            <template #default="{ row }">
              <div style="color: #909399; text-decoration: line-through">¥{{ row.basePrice?.toFixed(2) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="当前售价" width="140">
            <template #default="{ row }">
              <div class="current-price-cell">
                <span class="price-value">¥{{ row.currentPrice?.toFixed(2) }}</span>
                <el-tag
                  v-if="row.discount < 100"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  {{ row.discount }}折
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="税费" width="110">
            <template #default="{ row }">
              <div style="color: #faad14">¥{{ row.taxAmount?.toFixed(2) || '0.00' }}</div>
              <div style="font-size: 11px; color: #909399">税率: {{ row.taxRate }}%</div>
            </template>
          </el-table-column>
          <el-table-column label="总价" width="120">
            <template #default="{ row }">
              <div style="font-weight: 600; color: #ff4d4f; font-size: 15px">
                ¥{{ ((row.currentPrice || 0) + (row.taxAmount || 0)).toFixed(2) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格来源" width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :style="{ color: getPriceSourceColor(row.priceSource) }"
                effect="plain"
              >
                {{ getPriceSourceLabel(row.priceSource) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生效时间" width="220">
            <template #default="{ row }">
              <div style="font-size: 12px">
                <div>{{ formatDateTime(row.effectiveStartTime) }}</div>
                <div style="color: #909399">至 {{ formatDateTime(row.effectiveEndTime) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-switch
                :model-value="row.isActive === 1"
                @change="(val) => handleTogglePriceStatus(row, val)"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewPriceLogs(row)">
                日志
              </el-button>
              <el-button type="primary" link size="small" @click="handleEditPrice(row)">
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDeletePrice(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pricePagination.page"
            v-model:page-size="pricePagination.pageSize"
            :total="pricePagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchPriceData"
            @current-change="fetchPriceData"
          />
        </div>
      </div>
    </div>

    <FlightEditDialog
      v-model="editDialogVisible"
      :flight-data="currentEditFlight"
      @success="handleFlightSuccess"
    />

    <FlightDetailDialog
      v-model="detailDialogVisible"
      :flight-id="currentDetailFlightId"
    />

    <FlightPriceEditDialog
      v-model="priceEditDialogVisible"
      :edit-id="currentEditPriceId"
      :default-flight-id="defaultFlightId"
      :default-cabin-class="activeCabinClass === 'all' ? 'economy' : activeCabinClass"
      @success="handlePriceSuccess"
    />

    <FlightPriceBatchDialog
      v-model="priceBatchDialogVisible"
      :selected-prices="selectedPriceItems"
      :flight-ids="selectedFlightIds"
      :cabin-class="activeCabinClass === 'all' ? 'economy' : activeCabinClass"
      :has-special-permission="hasSpecialPermission"
      @success="handlePriceSuccess"
    />

    <FlightPriceRuleDialog
      v-model="priceRuleDialogVisible"
      :cabin-class="activeCabinClass === 'all' ? 'economy' : activeCabinClass"
      @success="handleRuleSave"
    />

    <el-dialog
      v-model="priceLogDialogVisible"
      title="价格调整日志"
      width="900px"
      class="price-log-dialog"
      :close-on-click-modal="false"
    >
      <FlightPriceLogPanel :price-id="currentLogPriceId" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
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
  Connection,
  Money,
  Setting,
  DataAnalysis,
  Upload,
  Download
} from '@element-plus/icons-vue'
import {
  getFlightList,
  deleteFlight,
  getFlightStats,
  updateFlightDisplayStatus,
  updateFlightOperationStatus,
  getFlightPriceList,
  getFlightPriceStats,
  deleteFlightPrice,
  updateFlightPriceDisplayStatus,
  batchUpdateFlightPriceDisplayStatus
} from '@/api/flight'
import {
  FlightTypeEnum,
  FlightOperationStatusEnum,
  CabinClassEnum,
  FlightPriceSourceEnum
} from '@/utils/enums'
import FlightBatchToolbar from '@/components/Flight/FlightBatchToolbar.vue'
import FlightEditDialog from '@/components/Flight/FlightEditDialog.vue'
import FlightDetailDialog from '@/components/Flight/FlightDetailDialog.vue'
import FlightPriceEditDialog from '@/components/Flight/FlightPriceEditDialog.vue'
import FlightPriceBatchDialog from '@/components/Flight/FlightPriceBatchDialog.vue'
import FlightPriceRuleDialog from '@/components/Flight/FlightPriceRuleDialog.vue'
import FlightPriceLogPanel from '@/components/Flight/FlightPriceLogPanel.vue'

const activeModule = ref('flight')

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

const priceLoading = ref(false)
const isPriceRefreshing = ref(false)
const priceTableRef = ref(null)
const priceSelectedIds = ref([])
const priceStats = ref({
  total: 0,
  avgPrice: 0,
  minPrice: 0,
  maxPrice: 0,
  byCabinClass: {}
})

const activeCabinClass = ref('all')

const priceSearchForm = reactive({
  flightNo: '',
  priceSource: null,
  isActive: null,
  effectiveTime: null,
  startDate: '',
  endDate: ''
})

const pricePagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const priceTableData = ref([])
const priceEditDialogVisible = ref(false)
const currentEditPriceId = ref(null)
const defaultFlightId = ref(null)
const priceBatchDialogVisible = ref(false)
const priceRuleDialogVisible = ref(false)
const priceLogDialogVisible = ref(false)
const currentLogPriceId = ref(null)

const hasSpecialPermission = ref(true)

const selectedPriceItems = computed(() => {
  return priceTableData.value.filter(p => priceSelectedIds.value.includes(p.id))
})

const selectedFlightIds = computed(() => {
  return [...new Set(selectedPriceItems.value.map(p => p.flightId))]
})

const handleModuleChange = (val) => {
  if (val === 'price') {
    fetchPriceData()
    fetchPriceStats()
  } else {
    fetchData()
    fetchStats()
  }
}

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

const priceTableRowClassName = ({ row }) => {
  if (priceSelectedIds.value.includes(row.id)) {
    return 'selected-row-shadow'
  }
  return ''
}

const getCabinColor = (cabinClass) => {
  const cabin = Object.values(CabinClassEnum).find(c => c.value === cabinClass)
  return cabin ? cabin.color : '#909399'
}

const getCabinLabel = (cabinClass) => {
  const cabin = Object.values(CabinClassEnum).find(c => c.value === cabinClass)
  return cabin ? cabin.label : cabinClass
}

const getPriceSourceColor = (source) => {
  const item = Object.values(FlightPriceSourceEnum).find(i => i.value === source)
  return item ? item.color : '#909399'
}

const getPriceSourceLabel = (source) => {
  const item = Object.values(FlightPriceSourceEnum).find(i => i.value === source)
  return item ? item.label : source
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

const formatDateTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleTypeChange = () => {
  pagination.page = 1
  fetchData()
}

const handleCabinClassChange = () => {
  pricePagination.page = 1
  fetchPriceData()
  fetchPriceStats()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handlePriceSearch = () => {
  if (priceSearchForm.effectiveTime && priceSearchForm.effectiveTime.length === 2) {
    priceSearchForm.startDate = priceSearchForm.effectiveTime[0]
    priceSearchForm.endDate = priceSearchForm.effectiveTime[1]
  } else {
    priceSearchForm.startDate = ''
    priceSearchForm.endDate = ''
  }
  pricePagination.page = 1
  fetchPriceData()
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

const handlePriceReset = () => {
  priceSearchForm.flightNo = ''
  priceSearchForm.priceSource = null
  priceSearchForm.isActive = null
  priceSearchForm.effectiveTime = null
  priceSearchForm.startDate = ''
  priceSearchForm.endDate = ''
  pricePagination.page = 1
  fetchPriceData()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(r => r.id)
  selectedCount.value = selection.length
}

const handlePriceSelectionChange = (selection) => {
  priceSelectedIds.value = selection.map(r => r.id)
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

const triggerPriceFadeRefresh = () => {
  isPriceRefreshing.value = true
  setTimeout(() => {
    isPriceRefreshing.value = false
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

const fetchPriceData = async () => {
  priceLoading.value = true
  try {
    const params = {
      page: pricePagination.page,
      pageSize: pricePagination.pageSize,
      flightNo: priceSearchForm.flightNo,
      priceSource: priceSearchForm.priceSource,
      isActive: priceSearchForm.isActive,
      startDate: priceSearchForm.startDate,
      endDate: priceSearchForm.endDate
    }
    if (activeCabinClass.value !== 'all') {
      params.cabinClass = activeCabinClass.value
    }
    const res = await getFlightPriceList(params)
    priceTableData.value = res.items || []
    pricePagination.total = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    priceLoading.value = false
  }
}

const fetchPriceStats = async () => {
  try {
    const params = {}
    if (activeCabinClass.value !== 'all') {
      params.cabinClass = activeCabinClass.value
    }
    const res = await getFlightPriceStats(params)
    priceStats.value = res || priceStats.value
  } catch (e) {
    console.error(e)
  }
}

const handleAddPrice = () => {
  currentEditPriceId.value = null
  priceEditDialogVisible.value = true
}

const handleEditPrice = (row) => {
  currentEditPriceId.value = row.id
  priceEditDialogVisible.value = true
}

const handleDeletePrice = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除航班 "${row.flightNo}" 的${getCabinLabel(row.cabinClass)}价格配置吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    await deleteFlightPrice(row.id)
    ElMessage.success('删除成功')
    triggerPriceFadeRefresh()
    fetchPriceData()
    fetchPriceStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

const handleTogglePriceStatus = async (row, val) => {
  try {
    await updateFlightPriceDisplayStatus(row.id, val ? 1 : 0)
    ElMessage.success(val ? '启用成功' : '停用成功')
    row.isActive = val ? 1 : 0
    triggerPriceFadeRefresh()
    fetchPriceStats()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
    row.isActive = row.isActive
  }
}

const handleBatchDisplayStatus = async (isActive) => {
  if (priceSelectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要${isActive ? '启用' : '停用'}选中的 ${priceSelectedIds.value.length} 条价格配置吗？`,
      '确认操作',
      { type: 'warning' }
    )
    await batchUpdateFlightPriceDisplayStatus(priceSelectedIds.value, isActive)
    ElMessage.success(`批量${isActive ? '启用' : '停用'}成功`)
    if (priceTableRef.value) {
      priceTableRef.value.clearSelection()
    }
    priceSelectedIds.value = []
    triggerPriceFadeRefresh()
    fetchPriceData()
    fetchPriceStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  }
}

const handleOpenBatchDialog = () => {
  if (priceSelectedIds.value.length === 0) {
    ElMessage.warning('请先选择要调整的价格配置')
    return
  }
  priceBatchDialogVisible.value = true
}

const handleOpenRuleDialog = () => {
  priceRuleDialogVisible.value = true
}

const handleViewPriceLogs = (row) => {
  currentLogPriceId.value = row.id
  priceLogDialogVisible.value = true
}

const handleFlightSuccess = () => {
  triggerFadeRefresh()
  fetchData()
  fetchStats()
}

const handlePriceSuccess = () => {
  triggerPriceFadeRefresh()
  fetchPriceData()
  fetchPriceStats()
  if (priceTableRef.value) {
    priceTableRef.value.clearSelection()
  }
  priceSelectedIds.value = []
}

const handleRuleSave = (rules) => {
  console.log('动态定价规则已保存:', rules)
  ElMessage.success('动态定价规则已更新')
}

onMounted(() => {
  fetchData()
  fetchStats()
})
</script>

<style lang="scss" scoped>
.flight-manage {
  .main-tabs {
    margin-bottom: 20px;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;

      .tab-badge {
        margin-left: 4px;
      }
    }
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      &.price-stat {
        .stat-value {
          font-size: 24px;
        }
      }

      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
      }
    }
  }

  .type-tabs {
    background: #fff;
    border-radius: 8px;
    padding: 0 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    :deep(.el-tabs__item) {
      font-size: 14px;
    }

    .type-tab-badge {
      display: inline-block;
      min-width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      padding: 0 6px;
      background: #f0f0f0;
      color: #606266;
      border-radius: 10px;
      font-size: 12px;
      margin-left: 6px;
      font-weight: 500;
    }
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: #303133;
    }
  }

  .search-form {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 16px;
    }
  }

  .price-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .toolbar-left {
      display: flex;
      gap: 12px;
    }
  }

  .table-container {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: opacity 0.3s ease;

    &.table-fade-refresh {
      animation: fadeRefresh 0.4s ease;
    }

    .current-price-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .price-value {
        font-size: 16px;
        font-weight: 700;
        color: #ff4d4f;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .price-log-dialog {
    :deep(.el-dialog__body) {
      padding: 0;
    }
  }

  @keyframes fadeRefresh {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
}
</style>
