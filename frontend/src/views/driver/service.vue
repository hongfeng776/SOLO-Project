<template>
  <div class="driver-service-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><DataLine /></el-icon>
        司机服务数据管控
      </h2>
      <div class="header-actions">
        <el-radio-group v-model="currentPeriod" size="default" @change="handlePeriodChange">
          <el-radio-button value="day">今日</el-radio-button>
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="dashboard-cards">
      <div class="stat-card card-total">
        <div class="card-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ statistics.summary?.driverCount || 0 }}</div>
          <div class="card-label">活跃司机数</div>
        </div>
        <div class="card-trend up">
          <el-icon><Top /></el-icon>
          <span>8.2%</span>
        </div>
      </div>
      <div class="stat-card card-orders">
        <div class="card-icon">
          <el-icon><List /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ statistics.summary?.totalOrders || 0 }}</div>
          <div class="card-label">总接单量</div>
        </div>
        <div class="card-trend up">
          <el-icon><Top /></el-icon>
          <span>12.5%</span>
        </div>
      </div>
      <div class="stat-card card-score">
        <div class="card-icon">
          <el-icon><Star /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ statistics.summary?.avgServiceScore || '0.0' }}</div>
          <div class="card-label">平均服务评分</div>
        </div>
        <div class="card-trend up">
          <el-icon><Top /></el-icon>
          <span>0.3</span>
        </div>
      </div>
      <div class="stat-card card-completion">
        <div class="card-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ statistics.summary?.avgCompletionRate || '0' }}%</div>
          <div class="card-label">平均完单率</div>
        </div>
        <div class="card-trend down">
          <el-icon><Bottom /></el-icon>
          <span>1.2%</span>
        </div>
      </div>
      <div class="stat-card card-complaint">
        <div class="card-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ statistics.summary?.avgComplaintRate || '0' }}%</div>
          <div class="card-label">平均投诉率</div>
        </div>
        <div class="card-trend down">
          <el-icon><Bottom /></el-icon>
          <span>0.5%</span>
        </div>
      </div>
      <div class="stat-card card-income">
        <div class="card-icon">
          <el-icon><Money /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">¥{{ formatNumber(statistics.summary?.totalIncome || 0) }}</div>
          <div class="card-label">总收入</div>
        </div>
        <div class="card-trend up">
          <el-icon><Top /></el-icon>
          <span>15.3%</span>
        </div>
      </div>
      <div class="stat-card card-excellent">
        <div class="card-icon">
          <el-icon><Medal /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value excellent">{{ statistics.levelDistribution?.['优质'] || 0 }}</div>
          <div class="card-label">优质司机</div>
        </div>
      </div>
      <div class="stat-card card-poor">
        <div class="card-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value poor">{{ statistics.levelDistribution?.['劣质'] || 0 }}</div>
          <div class="card-label">劣质司机</div>
        </div>
        <el-tag type="danger" size="small" effect="light" class="warning-tag">
          需关注
        </el-tag>
      </div>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <div class="filter-section">
          <el-form :inline="true" :model="queryForm" class="filter-form">
            <el-form-item label="司机姓名">
              <el-input
                v-model="queryForm.driverName"
                placeholder="请输入姓名"
                clearable
                style="width: 140px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="服务城市">
              <el-select
                v-model="queryForm.city"
                placeholder="全部"
                clearable
                style="width: 120px"
              >
                <el-option label="北京" value="beijing" />
                <el-option label="上海" value="shanghai" />
                <el-option label="广州" value="guangzhou" />
                <el-option label="深圳" value="shenzhen" />
              </el-select>
            </el-form-item>
            <el-form-item label="司机等级">
              <el-select
                v-model="queryForm.driverLevel"
                placeholder="全部等级"
                clearable
                style="width: 120px"
              >
                <el-option label="优质" :value="1" />
                <el-option label="普通" :value="2" />
                <el-option label="待整改" :value="3" />
                <el-option label="劣质" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="最低评分">
              <el-input-number
                v-model="queryForm.minServiceScore"
                :min="0"
                :max="5"
                :step="0.5"
                placeholder="最低"
                style="width: 100px"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item label="最高投诉率">
              <el-input-number
                v-model="queryForm.maxComplaintRate"
                :min="0"
                :max="100"
                :step="1"
                placeholder="%"
                style="width: 100px"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch" class="ripple-btn">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button
              type="success"
              :disabled="selectedRows.length === 0"
              @click="handleBatchUpdateLevel"
              class="ripple-btn"
            >
              <el-icon><Refresh /></el-icon>
              批量更新等级
            </el-button>
            <el-button type="warning" @click="handleExport" class="ripple-btn">
              <el-icon><Download /></el-icon>
              导出报表
            </el-button>
            <el-button @click="loadData" class="ripple-btn">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          <div class="toolbar-right">
            <span class="selected-info" v-if="selectedRows.length > 0">
              已选择 <b>{{ selectedRows.length }}</b> 条
            </span>
          </div>
        </div>

        <div class="table-wrapper">
          <el-table
            v-loading="loading"
            :data="tableData"
            border
            stripe
            @selection-change="handleSelectionChange"
            @row-dblclick="handleRowDblclick"
            :expand-row-keys="expandedRowKeys"
            :row-key="rowKey"
            :row-class-name="getRowClassName"
            style="width: 100%"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column type="expand">
              <template #default="props">
                <ServiceDataDetail :driver-id="props.row.driverId" :period="currentPeriod" />
              </template>
            </el-table-column>
            <el-table-column prop="statDate" label="日期" width="110" />
            <el-table-column label="司机信息" width="180">
              <template #default="{ row }">
                <div class="driver-info" :class="{ 'abnormal-border': row.isAbnormal === 1 }">
                  <el-avatar :size="40" :src="row.driver?.avatar">
                    {{ row.driver?.name?.charAt(0) || '司' }}
                  </el-avatar>
                  <div class="driver-detail">
                    <div class="driver-name">
                      {{ row.driver?.name || '-' }}
                      <el-tag
                        v-if="row.isAbnormal === 1"
                        type="danger"
                        size="small"
                        effect="dark"
                        class="abnormal-tag"
                      >
                        异常
                      </el-tag>
                    </div>
                    <div class="driver-phone">{{ row.driver?.phone || '-' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="服务等级" width="110">
              <template #default="{ row }">
                <el-tag :type="getLevelType(row.driverLevel)" effect="light" size="small">
                  {{ getLevelName(row.driverLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="serviceScore" label="服务评分" width="120" sortable>
              <template #default="{ row }">
                <div class="score-cell">
                  <span class="score-value" :class="getScoreClass(row.serviceScore)">
                    {{ row.serviceScore }}
                  </span>
                  <el-rate
                    :model-value="parseFloat(row.serviceScore)"
                    disabled
                    :size="14"
                    show-score
                    text-color="#ff9900"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="totalOrders" label="接单量" width="90" sortable />
            <el-table-column prop="completedOrders" label="完单量" width="90" sortable />
            <el-table-column prop="completionRate" label="完单率" width="90" sortable>
              <template #default="{ row }">
                <span :class="getCompletionClass(row.completionRate)">
                  {{ row.completionRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="complaintRate" label="投诉率" width="90" sortable>
              <template #default="{ row }">
                <span :class="getComplaintClass(row.complaintRate)">
                  {{ row.complaintRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="totalIncome" label="收入(元)" width="110" sortable>
              <template #default="{ row }">
                ¥{{ row.totalIncome }}
              </template>
            </el-table-column>
            <el-table-column prop="onlineHours" label="在线时长" width="90" sortable>
              <template #default="{ row }">
                {{ row.onlineHours }}h
              </template>
            </el-table-column>
            <el-table-column label="流量权重" width="90">
              <template #default="{ row }">
                <span :class="getWeightClass(row.trafficWeight)">
                  {{ row.trafficWeight }}x
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewTrend(row)">
                  趋势
                </el-button>
                <el-button type="primary" link size="small" @click="handleUpdateLevel(row)">
                  更新等级
                </el-button>
                <el-button type="info" link size="small" @click="toggleExpand(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <div class="right-panel">
        <div v-if="selectedDriverId" class="trend-panel">
          <ServiceTrendChart :driver-id="selectedDriverId" />
        </div>
        <div v-else class="empty-panel">
          <el-empty description="点击左侧司机查看趋势" />
        </div>
      </div>
    </div>

    <ServiceDataExport
      v-model="exportDialogVisible"
      :selected-ids="selectedRows.map(r => r.driverId)"
      user-role="admin"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataLine,
  User,
  List,
  Star,
  CircleCheck,
  Warning,
  Money,
  Medal,
  WarningFilled,
  Top,
  Bottom,
  Search,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import {
  getServiceDataListApi,
  getServiceStatisticsApi,
  updateDriverLevelApi,
  batchUpdateLevelsApi
} from '@/api/driver'
import {
  DriverServiceLevelMap,
  DriverServiceLevelTypeMap
} from '@/enums/driver'
import type { ServiceDataItem, ServiceStatistics } from '@/types/driver'
import ServiceTrendChart from '@/components/ServiceTrendChart/index.vue'
import ServiceDataDetail from '@/components/ServiceDataDetail/index.vue'
import ServiceDataExport from '@/components/ServiceDataExport/index.vue'

const loading = ref(false)
const currentPeriod = ref('day')
const selectedDriverId = ref<number | null>(null)
const expandedRowKeys = ref<number[]>([])
const exportDialogVisible = ref(false)

const statistics = ref<ServiceStatistics>({
  summary: {
    totalOrders: 0,
    completedOrders: 0,
    avgServiceScore: 0,
    avgCompletionRate: 0,
    avgComplaintRate: 0,
    totalIncome: 0,
    driverCount: 0
  },
  levelDistribution: {
    '优质': 0,
    '普通': 0,
    '待整改': 0,
    '劣质': 0
  },
  dateRange: { start: '', end: '' },
  period: 'day'
})

const queryForm = reactive({
  driverName: '',
  city: '',
  driverLevel: null as number | null,
  minServiceScore: null as number | null,
  maxComplaintRate: null as number | null
})

const tableData = ref<ServiceDataItem[]>([])
const selectedRows = ref<ServiceDataItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const rowKey = (row: ServiceDataItem) => row.id

const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 1 ? 'row-striped' : ''
}

const formatNumber = (num: number) => {
  return num.toLocaleString()
}

const getLevelName = (level: number) => {
  return DriverServiceLevelMap[level] || '未知'
}

const getLevelType = (level: number) => {
  return DriverServiceLevelTypeMap[level] || 'info'
}

const getScoreClass = (score: number) => {
  const s = parseFloat(String(score))
  if (s >= 4.8) return 'score-excellent'
  if (s >= 4.2) return 'score-good'
  if (s >= 3.5) return 'score-normal'
  return 'score-poor'
}

const getCompletionClass = (rate: number) => {
  const r = parseFloat(String(rate))
  if (r >= 95) return 'rate-good'
  if (r >= 85) return 'rate-normal'
  return 'rate-poor'
}

const getComplaintClass = (rate: number) => {
  const r = parseFloat(String(rate))
  if (r <= 1) return 'rate-good'
  if (r <= 3) return 'rate-normal'
  return 'rate-poor'
}

const getWeightClass = (weight: number) => {
  const w = parseFloat(String(weight))
  if (w >= 1.2) return 'weight-high'
  if (w >= 0.8) return 'weight-normal'
  return 'weight-low'
}

const loadStatistics = async () => {
  try {
    const res = await getServiceStatisticsApi(currentPeriod.value)
    statistics.value = res.data
  } catch (error) {
    // ElMessage.error('加载统计数据失败')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      period: currentPeriod.value,
      driverName: queryForm.driverName || undefined,
      city: queryForm.city || undefined,
      driverLevel: queryForm.driverLevel,
      minServiceScore: queryForm.minServiceScore,
      maxComplaintRate: queryForm.maxComplaintRate
    }

    const res = await getServiceDataListApi(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handlePeriodChange = () => {
  pagination.page = 1
  loadStatistics()
  loadData()
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  queryForm.driverName = ''
  queryForm.city = ''
  queryForm.driverLevel = null
  queryForm.minServiceScore = null
  queryForm.maxComplaintRate = null
  pagination.page = 1
  loadData()
}

const handleSelectionChange = (rows: ServiceDataItem[]) => {
  selectedRows.value = rows
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const handleViewTrend = (row: ServiceDataItem) => {
  selectedDriverId.value = row.driverId
}

const handleRowDblclick = (row: ServiceDataItem) => {
  toggleExpand(row)
}

const toggleExpand = (row: ServiceDataItem) => {
  const index = expandedRowKeys.value.indexOf(row.id)
  if (index > -1) {
    expandedRowKeys.value.splice(index, 1)
  } else {
    expandedRowKeys.value.push(row.id)
  }
}

const handleUpdateLevel = async (row: ServiceDataItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要重新计算司机【${row.driver?.name}】的服务等级吗？`,
      '更新等级确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await updateDriverLevelApi(row.driverId)
    if (res.data.changed) {
      ElMessage.success('等级更新成功')
      loadData()
      loadStatistics()
    } else {
      ElMessage.info('等级未发生变化')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('等级更新失败')
    }
  }
}

const handleBatchUpdateLevel = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量更新选中的 ${selectedRows.value.length} 名司机的服务等级吗？`,
      '批量更新等级确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedRows.value.map(r => r.driverId)
    const res = await batchUpdateLevelsApi(ids)
    ElMessage.success(`批量更新完成：成功${res.data.successCount}条，等级变化${res.data.changedCount}条`)
    loadData()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量更新失败')
    }
  }
}

const handleExport = () => {
  exportDialogVisible.value = true
}

onMounted(() => {
  loadStatistics()
  loadData()
})
</script>

<style scoped>
.driver-service-page {
  padding: 20px;
  min-height: 100%;
  background: #f0f2f5;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-title .el-icon {
  color: #409eff;
  font-size: 24px;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 18px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  position: absolute;
  right: 15px;
  top: 15px;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  opacity: 0.9;
}

.card-total .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-orders .card-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-score .card-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-completion .card-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-complaint .card-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-income .card-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.card-excellent .card-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.card-poor .card-icon {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.card-info {
  position: relative;
  z-index: 1;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.card-value.excellent {
  color: #67c23a;
}

.card-value.poor {
  color: #f56c6c;
}

.card-label {
  font-size: 13px;
  color: #909399;
}

.card-trend {
  position: absolute;
  bottom: 12px;
  right: 15px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.card-trend.up {
  color: #67c23a;
}

.card-trend.down {
  color: #f56c6c;
}

.warning-tag {
  position: absolute;
  bottom: 12px;
  right: 15px;
}

.main-content {
  display: flex;
  gap: 20px;
}

.left-panel {
  flex: 1;
  min-width: 0;
}

.right-panel {
  width: 450px;
  flex-shrink: 0;
}

.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.table-toolbar {
  background: #fff;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.selected-info {
  font-size: 13px;
  color: #606266;
}

.selected-info b {
  color: #409eff;
  font-size: 14px;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

:deep(.el-table .row-striped) {
  background: #fafafa;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.driver-info.abnormal-border {
  padding: 4px;
  border: 2px solid #f56c6c;
  border-radius: 8px;
  animation: abnormalBorderPulse 2s infinite;
}

@keyframes abnormalBorderPulse {
  0%, 100% { border-color: #f56c6c; }
  50% { border-color: #fecaca; }
}

.driver-detail {
  flex: 1;
  min-width: 0;
}

.driver-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.abnormal-tag {
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.driver-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.score-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-value {
  font-size: 14px;
  font-weight: 600;
}

.score-excellent {
  color: #67c23a;
}

.score-good {
  color: #409eff;
}

.score-normal {
  color: #e6a23c;
}

.score-poor {
  color: #f56c6c;
}

.rate-good {
  color: #67c23a;
  font-weight: 500;
}

.rate-normal {
  color: #606266;
}

.rate-poor {
  color: #f56c6c;
  font-weight: 500;
}

.weight-high {
  color: #67c23a;
  font-weight: 600;
}

.weight-normal {
  color: #606266;
}

.weight-low {
  color: #f56c6c;
  font-weight: 500;
}

.pagination-wrapper {
  margin-top: 15px;
  text-align: right;
}

.trend-panel {
  position: sticky;
  top: 20px;
}

.empty-panel {
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.ripple-btn:active::after {
  width: 300px;
  height: 300px;
}
</style>
