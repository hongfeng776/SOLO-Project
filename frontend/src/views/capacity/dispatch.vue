<template>
  <div class="capacity-dispatch">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><TrendCharts /></el-icon>
          运力调度管理
        </h2>
        <span class="update-time" v-if="lastUpdate">
          <el-icon><Timer /></el-icon>
          最后更新：{{ formatDateTime(lastUpdate) }}
        </span>
      </div>
      <div class="header-right">
        <el-switch
          v-model="autoRefresh"
          :active-text="'自动刷新'"
          :inactive-text="'手动刷新'"
          @change="toggleAutoRefresh"
        />
        <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadData">
          刷新数据
        </el-button>
        <el-button
          type="success"
          :icon="Promotion"
          :disabled="!canDispatch"
          @click="openBatchDispatch"
        >
          批量调度
        </el-button>
        <el-button
          type="warning"
          :icon="Document"
          :disabled="!canExport"
          @click="openGenerateReport"
        >
          生成报表
        </el-button>
      </div>
    </div>

    <el-card v-if="warnings.length > 0" class="warning-card" shadow="never">
      <div class="warning-list">
        <div
          v-for="warning in warnings"
          :key="warning.id"
          class="warning-item"
          :class="`warning-${warning.type}`"
        >
          <div class="warning-icon">
            <el-icon v-if="warning.type === 'danger'"><CircleClose /></el-icon>
            <el-icon v-else><Warning /></el-icon>
          </div>
          <div class="warning-content">
            <div class="warning-title">{{ warning.title }}</div>
            <div class="warning-message">{{ warning.message }}</div>
          </div>
          <el-button
            v-if="warning.autoDispatch && canDispatch"
            type="danger"
            size="small"
            :icon="Promotion"
            @click="handleQuickDispatch(warning)"
          >
            立即调度
          </el-button>
          <div class="warning-time">{{ formatTime(warning.timestamp) }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="filter-card" shadow="never">
      <div class="filter-header">
        <span class="filter-title">
          <el-icon><Filter /></el-icon>
          筛选条件
        </span>
        <el-tag v-if="!canViewAll" type="info" size="small">
          仅可查看权限范围内数据
        </el-tag>
      </div>
      <div class="filter-content">
        <el-form :model="filters" inline>
          <el-form-item label="城市">
            <el-select
              v-model="filters.city"
              placeholder="请选择城市"
              clearable
              style="width: 180px"
              @change="handleCityChange"
            >
              <el-option
                v-for="city in filterOptions.cities || []"
                :key="city"
                :label="city"
                :value="city"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="商圈">
            <el-select
              v-model="filters.businessDistrict"
              placeholder="请选择商圈"
              clearable
              style="width: 200px"
              :disabled="!filters.city"
            >
              <el-option
                v-for="district in filterOptions.businessDistricts"
                :key="district"
                :label="district"
                :value="district"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时段">
            <el-select
              v-model="filters.timePeriod"
              placeholder="请选择时段"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="period in filterOptions.timePeriods"
                :key="period"
                :label="period"
                :value="period"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 360px"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleFilter">查询</el-button>
            <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-alert
        v-if="conflicts.length > 0"
        :title="'筛选条件存在冲突：' + conflicts.join('；')"
        type="error"
        show-icon
        :closable="false"
        class="conflict-alert"
      >
        <template #default>
          <el-button type="text" @click="handleReset">点击重置筛选条件</el-button>
        </template>
      </el-alert>
    </el-card>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card online-card">
          <div class="stat-icon">
            <el-icon size="28"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ monitorData.summary?.totalOnline || 0 }}</div>
            <div class="stat-label">在线司机</div>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            12%
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card order-card">
          <div class="stat-icon">
            <el-icon size="28"><Van /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ monitorData.summary?.totalInOrder || 0 }}</div>
            <div class="stat-label">接单中</div>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            8%
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card idle-card">
          <div class="stat-icon">
            <el-icon size="28"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ monitorData.summary?.totalIdle || 0 }}</div>
            <div class="stat-label">空闲运力</div>
          </div>
          <div class="stat-trend down">
            <el-icon><Bottom /></el-icon>
            5%
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card status-card" :class="`status-${currentStatus?.code}`">
          <div class="stat-icon">
            <el-icon size="28">
              <CircleCheck v-if="currentStatus?.code === 'normal'" />
              <Warning v-else-if="currentStatus?.code === 'saturated'" />
              <CircleClose v-else-if="currentStatus?.code === 'shortage'" />
              <InfoFilled v-else />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="status-badge" :class="`badge-${currentStatus?.code}`">
              {{ currentStatus?.label || '未知' }}
            </div>
            <div class="stat-label">运力利用率：{{ monitorData.summary?.utilizationRate || 0 }}%</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="main-content">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>运力类型分布</span>
              <el-radio-group v-model="chartView" size="small">
                <el-radio-button value="pie">饼图</el-radio-button>
                <el-radio-button value="bar">柱状图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>

        <el-card class="table-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>区域运力分布</span>
              <div class="header-actions">
                <el-tag size="small" type="danger" v-if="shortageCount > 0">
                  紧缺区域：{{ shortageCount }}
                </el-tag>
                <el-tag size="small" type="warning" v-if="saturatedCount > 0">
                  饱和区域：{{ saturatedCount }}
                </el-tag>
                <el-tag size="small" type="info" v-if="surplusCount > 0">
                  过剩区域：{{ surplusCount }}
                </el-tag>
              </div>
            </div>
          </template>
          <el-table :data="areaTableData" size="small" stripe>
            <el-table-column prop="city" label="城市" width="100" fixed />
            <el-table-column prop="area" label="商圈" width="150" />
            <el-table-column prop="onlineCount" label="在线司机" width="100" align="right" />
            <el-table-column prop="orderCount" label="订单数" width="100" align="right" />
            <el-table-column prop="idleCount" label="空闲运力" width="100" align="right" />
            <el-table-column label="供需比" width="120" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.onlineCount / Math.max(1, row.orderCount / 3)) * 100)"
                  :stroke-width="8"
                  :color="getSupplyColor(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="运力状态" width="120" align="center">
              <template #default="{ row }">
                <span
                  class="capacity-status-tag"
                  :class="`tag-${row.status}`"
                >
                  {{ getStatusLabel(row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  :disabled="!canDispatch || row.status === 'normal'"
                  @click="handleAreaDispatch(row)"
                >
                  调度
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="side-card">
          <template #header>
            <span>运力异常区域</span>
          </template>
          <div class="abnormal-list">
            <div
              v-for="area in abnormalAreas"
              :key="area.id"
              class="abnormal-item"
              :class="`abnormal-${area.status}`"
            >
              <div class="abnormal-header">
                <span class="abnormal-area">{{ area.district }}</span>
                <el-tag size="small" :type="area.status === 'shortage' ? 'danger' : 'info'">
                  {{ area.status === 'shortage' ? '紧缺' : '过剩' }}
                </el-tag>
              </div>
              <div class="abnormal-stats">
                <span>缺口：<strong :class="area.status === 'shortage' ? 'text-danger' : 'text-info'">
                  {{ area.gap > 0 ? '+' : '' }}{{ area.gap }}
                </strong> 人</span>
                <span class="trend" :class="area.trend">
                  <el-icon v-if="area.trend === 'rising'"><TrendCharts /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  {{ area.trend === 'rising' ? '上升' : '稳定' }}
                </span>
              </div>
              <div class="abnormal-detail">
                订单：{{ area.orderCount }} | 在线：{{ area.onlineCount }} | 空闲：{{ area.idleCount }}
              </div>
            </div>
            <el-empty v-if="abnormalAreas.length === 0" description="暂无异常区域" :image-size="80" />
          </div>
        </el-card>

        <el-card class="side-card" style="margin-top: 20px">
          <template #header>
            <span>运力缺口时段</span>
          </template>
          <div class="period-list">
            <div
              v-for="(period, index) in abnormalPeriods"
              :key="index"
              class="period-item"
              :class="`period-${period.status}`"
            >
              <div class="period-header">
                <span class="period-name">{{ period.period }}</span>
                <span class="period-gap" :class="`gap-${period.status}`">
                  缺口 {{ period.gap }} 人
                </span>
              </div>
              <div class="period-bar">
                <div
                  class="bar-fill"
                  :style="{ width: `${Math.min(100, (period.onlineCount / Math.max(1, period.orderCount / 3)) * 100)}%` }"
                  :class="`fill-${period.status}`"
                ></div>
              </div>
              <div class="period-stats">
                <span>订单：{{ period.orderCount }}</span>
                <span>在线：{{ period.onlineCount }}</span>
              </div>
            </div>
            <el-empty v-if="abnormalPeriods.length === 0" description="暂无缺口时段" :image-size="80" />
          </div>
        </el-card>

        <el-card class="side-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>数据趋势</span>
              <el-select v-model="timeRange" size="small" style="width: 120px">
                <el-option label="近24小时" value="24h" />
                <el-option label="近7天" value="7d" />
                <el-option label="近30天" value="30d" />
              </el-select>
            </div>
          </template>
          <div ref="trendChartRef" class="trend-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <BatchDispatchDialog
      v-model="batchDispatchVisible"
      :selected-areas="selectedAreas"
      :selected-periods="selectedPeriods"
      :permission="{ canDispatch }"
      @success="handleDispatchSuccess"
    />

    <GenerateReportDialog
      v-model="reportVisible"
      :can-export="canExport"
      @success="handleReportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  TrendCharts,
  Timer,
  Refresh,
  Promotion,
  Document,
  Filter,
  Search,
  RefreshRight,
  Connection,
  Van,
  Clock,
  CircleCheck,
  Warning,
  CircleClose,
  InfoFilled,
  Top,
  Bottom,
  Minus
} from '@element-plus/icons-vue'
import {
  getCapacityMonitorApi,
  getCapacityStatusDetailApi,
  getCapacityTrendApi,
  batchDispatchApi
} from '@/api/capacity'
import {
  CapacityStatusLabelMap,
  CapacityStatusColorMap,
  BUSINESS_DISTRICTS,
  TIME_PERIODS
} from '@/enums/capacity'
import { formatDateTime, formatTime } from '@/utils/format'
import type {
  CapacityMonitorData,
  CapacityStatusDetail,
  CapacityWarning,
  AbnormalArea,
  AbnormalPeriod,
  MonitorFilters,
  AreaDistrict,
  CapacityTrendData
} from '@/types/capacity'
import BatchDispatchDialog from '@/components/CapacityBatchDispatch/index.vue'
import GenerateReportDialog from '@/components/CapacityGenerateReport/index.vue'

const loading = ref(false)
const autoRefresh = ref(true)
const lastUpdate = ref('')
const conflicts = ref<string[]>([])
const dateRange = ref<string[]>([])
const chartView = ref('pie')
const timeRange = ref('7d')

const batchDispatchVisible = ref(false)
const reportVisible = ref(false)
const selectedAreas = ref<string[]>([])
const selectedPeriods = ref<string[]>([])

let typeChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let refreshTimer: number | null = null

const typeChartRef = ref<HTMLDivElement>()
const trendChartRef = ref<HTMLDivElement>()

const monitorData = reactive<CapacityMonitorData>({
  summary: {
    totalOnline: 0,
    totalInOrder: 0,
    totalIdle: 0,
    totalOrders: 0,
    utilizationRate: 0,
    currentStatus: { code: 'normal', label: '运力正常', severity: 'success', color: '#67c23a' },
    permission: { canViewAll: false, canDispatch: false, canExport: false, userRole: 'operator' }
  },
  typeDistribution: [],
  areaDistribution: [],
  filterOptions: {
    cities: [],
    businessDistricts: [],
    timePeriods: TIME_PERIODS
  },
  timestamp: ''
})

const statusDetail = reactive<CapacityStatusDetail>({
  currentStatus: { code: 'normal', label: '运力正常', severity: 'success', color: '#67c23a' },
  abnormalAreas: [],
  abnormalPeriods: [],
  warnings: [],
  statistics: { totalOrders: 0, totalOnline: 0, totalIdle: 0, shortageAreas: 0, surplusAreas: 0 }
})

const trendData = reactive<CapacityTrendData>({
  trendData: [],
  suspiciousData: [],
  validationResult: {
    totalRecords: 0,
    suspiciousRecords: 0,
    abnormalDrivers: 0,
    validationPassed: true,
    checks: []
  },
  gapPoints: [],
  surplusPoints: [],
  summary: { avgOnline: 0, avgOrders: 0, peakHour: '', valleyHour: '', maxGap: 0, maxSurplus: 0 }
})

const filters = reactive<MonitorFilters>({
  city: '',
  businessDistrict: '',
  timePeriod: '',
  startTime: '',
  endTime: ''
})

const canViewAll = computed(() => monitorData.summary.permission.canViewAll)
const canDispatch = computed(() => monitorData.summary.permission.canDispatch)
const canExport = computed(() => monitorData.summary.permission.canExport)
const currentStatus = computed(() => monitorData.summary.currentStatus)
const warnings = computed(() => statusDetail.warnings)
const abnormalAreas = computed(() => statusDetail.abnormalAreas)
const abnormalPeriods = computed(() => statusDetail.abnormalPeriods)

const filterOptions = computed(() => ({
  cities: monitorData.filterOptions.cities || [],
  businessDistricts: filters.city ? (BUSINESS_DISTRICTS[filters.city] || []) : [],
  timePeriods: TIME_PERIODS
}))

const areaTableData = computed(() => {
  const data: Array<AreaDistrict & { city: string }> = []
  monitorData.areaDistribution.forEach(cityData => {
    cityData.districts.forEach(district => {
      data.push({
        city: cityData.city,
        ...district
      })
    })
  })
  return data
})

const shortageCount = computed(() => areaTableData.value.filter(d => d.status === 'shortage').length)
const saturatedCount = computed(() => areaTableData.value.filter(d => d.status === 'saturated').length)
const surplusCount = computed(() => areaTableData.value.filter(d => d.status === 'surplus').length)

const getStatusLabel = (status: string) => CapacityStatusLabelMap[status] || status

const getSupplyColor = (row: any) => {
  if (row.status === 'shortage') return '#f56c6c'
  if (row.status === 'saturated') return '#e6a23c'
  if (row.status === 'surplus') return '#909399'
  return '#67c23a'
}

const handleCityChange = () => {
  filters.businessDistrict = ''
}

const handleFilter = () => {
  if (dateRange.value?.length === 2) {
    filters.startTime = dateRange.value[0]
    filters.endTime = dateRange.value[1]
  }
  loadData()
}

const handleReset = () => {
  filters.city = ''
  filters.businessDistrict = ''
  filters.timePeriod = ''
  filters.startTime = ''
  filters.endTime = ''
  dateRange.value = []
  conflicts.value = []
  loadData()
}

const initTypeChart = () => {
  if (!typeChartRef.value) return

  if (typeChart) {
    typeChart.dispose()
  }

  typeChart = echarts.init(typeChartRef.value)

  const updateChart = () => {
    const data = monitorData.typeDistribution.map(item => ({
      value: chartView.value === 'pie' ? item.onlineCount : item.saturationRate,
      name: item.typeName,
      itemStyle: { color: CapacityStatusColorMap[item.saturationRate > 80 ? 'shortage' : item.saturationRate > 50 ? 'saturated' : 'normal'] }
    }))

    const option = chartView.value === 'pie'
      ? {
          tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
          legend: { bottom: '5%', left: 'center' },
          series: [{
            name: '在线司机',
            type: 'pie',
            radius: ['40%', '70%'],
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            data
          }]
        }
      : {
          tooltip: { trigger: 'axis' },
          legend: { data: ['在线', '接单中', '空闲', '订单数'] },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', data: monitorData.typeDistribution.map(d => d.typeName) },
          yAxis: { type: 'value' },
          series: [
            { name: '在线', type: 'bar', data: monitorData.typeDistribution.map(d => d.onlineCount), itemStyle: { color: '#409eff' } },
            { name: '接单中', type: 'bar', data: monitorData.typeDistribution.map(d => d.inOrderCount), itemStyle: { color: '#67c23a' } },
            { name: '空闲', type: 'bar', data: monitorData.typeDistribution.map(d => d.idleCount), itemStyle: { color: '#e6a23c' } },
            { name: '订单数', type: 'bar', data: monitorData.typeDistribution.map(d => d.orderCount), itemStyle: { color: '#f56c6c' } }
          ]
        }

    typeChart?.setOption(option as any)
  }

  updateChart()

  const handleResize = () => typeChart?.resize()
  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
}

const initTrendChart = () => {
  if (!trendChartRef.value) return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(trendChartRef.value)

  const updateChart = () => {
    const data = trendData.trendData.slice(-20)
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['在线司机', '订单数', '空闲运力'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(d => {
          const date = new Date(d.timestamp)
          return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
        })
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '在线司机',
          type: 'line',
          smooth: true,
          data: data.map(d => d.onlineCount),
          areaStyle: { opacity: 0.3 },
          lineStyle: { color: '#409eff' },
          itemStyle: { color: '#409eff' }
        },
        {
          name: '订单数',
          type: 'line',
          smooth: true,
          data: data.map(d => d.orderCount),
          areaStyle: { opacity: 0.3 },
          lineStyle: { color: '#f56c6c' },
          itemStyle: { color: '#f56c6c' }
        },
        {
          name: '空闲运力',
          type: 'line',
          smooth: true,
          data: data.map(d => d.idleCount),
          areaStyle: { opacity: 0.3 },
          lineStyle: { color: '#e6a23c' },
          itemStyle: { color: '#e6a23c' }
        }
      ]
    }

    trendChart?.setOption(option)
  }

  updateChart()

  const handleResize = () => trendChart?.resize()
  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const [monitorRes, statusRes] = await Promise.all([
      getCapacityMonitorApi(filters),
      getCapacityStatusDetailApi()
    ])

    if (monitorRes.code === 400 && monitorRes.conflicts) {
      conflicts.value = monitorRes.conflicts
      return
    }

    conflicts.value = []
    Object.assign(monitorData, monitorRes.data)
    Object.assign(statusDetail, statusRes.data)
    lastUpdate.value = monitorRes.data.timestamp

    await loadTrendData()

    nextTick(() => {
      initTypeChart()
      initTrendChart()
    })
  } catch (e: any) {
    ElMessage.error(e.message || '获取运力数据失败')
  } finally {
    loading.value = false
  }
}

const loadTrendData = async () => {
  try {
    const res = await getCapacityTrendApi({ city: filters.city, timeRange: timeRange.value })
    Object.assign(trendData, res.data)
  } catch (e: any) {
    console.error('获取趋势数据失败', e)
  }
}

const toggleAutoRefresh = (val: boolean) => {
  if (val) {
    refreshTimer = window.setInterval(() => {
      loadData()
    }, 30000)
    ElMessage.success('已开启自动刷新，每30秒刷新一次')
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    ElMessage.info('已关闭自动刷新')
  }
}

const openBatchDispatch = () => {
  selectedAreas.value = abnormalAreas.value.filter(a => a.status === 'shortage').map(a => a.id)
  selectedPeriods.value = abnormalPeriods.value.filter(p => p.status === 'shortage').map(p => p.period)
  batchDispatchVisible.value = true
}

const openGenerateReport = () => {
  reportVisible.value = true
}

const handleQuickDispatch = async (warning: CapacityWarning) => {
  try {
    await ElMessageBox.confirm(
      `确定要对「${warning.title}」执行紧急调度吗？将向空闲司机推送上线提醒。`,
      '确认调度',
      { type: 'warning', confirmButtonText: '确认调度', cancelButtonText: '取消' }
    )

    const res = await batchDispatchApi({
      operationType: 'online_reminder',
      message: warning.message,
      targetCities: filters.city ? [filters.city] : undefined
    })

    ElMessage.success(`调度成功：已向${res.data.results.successCount}名司机推送提醒`)
    loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '调度失败')
    }
  }
}

const handleAreaDispatch = (row: any) => {
  selectedAreas.value = [`${row.city}-${row.area}`]
  selectedPeriods.value = []
  batchDispatchVisible.value = true
}

const handleDispatchSuccess = () => {
  loadData()
}

const handleReportSuccess = () => {
  ElMessage.success('报表生成成功')
}

watch(chartView, () => {
  nextTick(() => initTypeChart())
})

watch(timeRange, () => {
  loadTrendData()
  nextTick(() => initTrendChart())
})

onMounted(() => {
  loadData()
  if (autoRefresh.value) {
    refreshTimer = window.setInterval(() => {
      loadData()
    }, 30000)
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  if (typeChart) {
    typeChart.dispose()
  }
  if (trendChart) {
    trendChart.dispose()
  }
})
</script>

<style lang="scss" scoped>
.capacity-dispatch {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .page-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 20px;
        color: #303133;
      }

      .update-time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #909399;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .warning-card {
    margin-bottom: 20px;
    background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);

    .warning-list {
      .warning-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 12px;
        animation: warningPulse 2s ease-in-out infinite;

        &:last-child {
          margin-bottom: 0;
        }

        &.warning-danger {
          background: linear-gradient(90deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.02) 100%);
          border-left: 4px solid #f56c6c;
        }

        &.warning-warning {
          background: linear-gradient(90deg, rgba(230, 162, 60, 0.1) 0%, rgba(230, 162, 60, 0.02) 100%);
          border-left: 4px solid #e6a23c;
        }

        .warning-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;

          .warning-danger & {
            background: #fef0f0;
            color: #f56c6c;
            animation: iconBlink 1.5s ease-in-out infinite;
          }

          .warning-warning & {
            background: #fdf6ec;
            color: #e6a23c;
          }
        }

        .warning-content {
          flex: 1;

          .warning-title {
            font-size: 15px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 4px;
          }

          .warning-message {
            font-size: 13px;
            color: #606266;
          }
        }

        .warning-time {
          font-size: 12px;
          color: #909399;
          flex-shrink: 0;
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .filter-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }
    }

    .conflict-alert {
      margin-top: 16px;
    }
  }

  .stat-cards {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s;
      border: 1px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: #fff;
        flex-shrink: 0;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 4px;
          animation: gradientShift 3s ease infinite;
          background-size: 200% 200%;

          &.badge-normal {
            background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%, #67c23a 0%);
          }

          &.badge-saturated {
            background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%, #e6a23c 0%);
            animation: warningBlink 1.5s ease-in-out infinite;
          }

          &.badge-shortage {
            background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%, #f56c6c 0%);
            animation: dangerBlink 1s ease-in-out infinite;
          }

          &.badge-surplus {
            background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%, #909399 0%);
          }
        }
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 12px;
        font-weight: 500;

        &.up {
          color: #67c23a;
        }

        &.down {
          color: #f56c6c;
        }
      }

      &.online-card {
        .stat-icon {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
      }

      &.order-card {
        .stat-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      }

      &.idle-card {
        .stat-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
      }

      &.status-card {
        &.status-shortage {
          border-color: #fbc4c4;
          animation: cardPulse 2s ease-in-out infinite;
        }

        &.status-saturated {
          border-color: #faecd8;
          animation: cardPulseWarning 2.5s ease-in-out infinite;
        }

        .stat-icon {
          background: linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%);
          color: #606266;

          .status-normal & {
            background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
            color: #fff;
          }

          .status-saturated & {
            background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
            color: #fff;
          }

          .status-shortage & {
            background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
            color: #fff;
          }

          .status-surplus & {
            background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
            color: #fff;
          }
        }
      }
    }
  }

  .main-content {
    .chart-card,
    .table-card,
    .side-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    .chart-container {
      height: 300px;
    }

    .trend-chart {
      height: 250px;
    }

    .capacity-status-tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;

      &.tag-normal {
        background: #f0f9eb;
        color: #67c23a;
      }

      &.tag-saturated {
        background: #fdf6ec;
        color: #e6a23c;
      }

      &.tag-shortage {
        background: #fef0f0;
        color: #f56c6c;
      }

      &.tag-surplus {
        background: #f4f4f5;
        color: #909399;
      }
    }

    .abnormal-list {
      max-height: 320px;
      overflow-y: auto;

      .abnormal-item {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        transition: all 0.3s;

        &:last-child {
          margin-bottom: 0;
        }

        &.abnormal-shortage {
          background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
          border-left: 3px solid #f56c6c;
        }

        &.abnormal-surplus {
          background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
          border-left: 3px solid #909399;
        }

        .abnormal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .abnormal-area {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
          }
        }

        .abnormal-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 13px;
          color: #606266;

          .trend {
            display: flex;
            align-items: center;
            gap: 2px;

            &.rising {
              color: #f56c6c;
            }
          }

          .text-danger {
            color: #f56c6c;
          }

          .text-info {
            color: #909399;
          }
        }

        .abnormal-detail {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .period-list {
      max-height: 300px;
      overflow-y: auto;

      .period-item {
        padding: 12px;
        margin-bottom: 12px;
        border-radius: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        &.period-shortage {
          background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
        }

        &.period-saturated {
          background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
        }

        .period-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .period-name {
            font-size: 13px;
            font-weight: 500;
            color: #303133;
          }

          .period-gap {
            font-size: 12px;
            font-weight: 500;

            &.gap-shortage {
              color: #f56c6c;
            }

            &.gap-saturated {
              color: #e6a23c;
            }
          }
        }

        .period-bar {
          height: 8px;
          background: #ebeef5;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;

          .bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s;

            &.fill-shortage {
              background: linear-gradient(90deg, #f56c6c 0%, #f78989 100%);
            }

            &.fill-saturated {
              background: linear-gradient(90deg, #e6a23c 0%, #f0c78a 100%);
            }
          }
        }

        .period-stats {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .text-danger {
    color: #f56c6c;
  }

  .text-info {
    color: #909399;
  }
}

@keyframes warningPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes iconBlink {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(245, 108, 108, 0);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes warningBlink {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.4);
  }
  50% {
    opacity: 0.85;
    box-shadow: 0 0 0 6px rgba(230, 162, 60, 0);
  }
}

@keyframes dangerBlink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
}

@keyframes cardPulse {
  0%, 100% {
    box-shadow: 0 2px 12px rgba(245, 108, 108, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(245, 108, 108, 0.3);
  }
}

@keyframes cardPulseWarning {
  0%, 100% {
    box-shadow: 0 2px 12px rgba(230, 162, 60, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(230, 162, 60, 0.3);
  }
}
</style>
