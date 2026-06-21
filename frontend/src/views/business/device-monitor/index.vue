<template>
  <div class="ccb-business-device-monitor">
    <CcbPageHeader
      title="设备实时监控"
      description="全品类线下终端设备统一监控底座"
      icon="Monitor"
    />

    <div class="stat-card-container">
      <div class="stat-card total-card">
        <div class="stat-card-header">
          <span class="stat-card-title">设备总数</span>
          <el-icon class="stat-card-icon"><Monitor /></el-icon>
        </div>
        <div class="stat-card-body">
          <div class="stat-card-number">{{ statistics.total_count || 0 }}</div>
          <div class="stat-card-ring">
            <svg viewBox="0 0 100 100" class="ring-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e4e7ed" stroke-width="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#409eff" stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="onlineRateOffset"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="ring-center">
              <span class="ring-value">{{ onlineRate }}%</span>
              <span class="ring-label">在线率</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card online-card">
        <div class="stat-card-header">
          <span class="stat-card-title">在线设备</span>
          <el-icon class="stat-card-icon success-icon"><CircleCheck /></el-icon>
        </div>
        <div class="stat-card-body">
          <div class="stat-card-number success-text">{{ statistics.online_count || 0 }}</div>
          <div class="stat-card-sub">
            占比：<span class="highlight-text">{{ onlineRatio }}%</span>
          </div>
          <div class="stat-card-trend">
            <el-icon><Top /></el-icon>
            <span>较昨日 +2.3%</span>
          </div>
        </div>
      </div>

      <div class="stat-card fault-card">
        <div class="stat-card-header">
          <span class="stat-card-title">故障告警</span>
          <el-icon class="stat-card-icon danger-icon"><Warning /></el-icon>
        </div>
        <div class="stat-card-body">
          <div class="stat-card-number danger-text">
            {{ statistics.fault_count || 0 }}
            <span v-if="statistics.today_fault_count" class="today-badge pulse-badge">
              +{{ statistics.today_fault_count }}
            </span>
          </div>
          <div class="stat-card-sub">
            今日新增：<span class="danger-text">{{ statistics.today_fault_count || 0 }}</span>
          </div>
          <div class="stat-card-trend warning-trend">
            <el-icon><Warning /></el-icon>
            <span>待处理 {{ statistics.fault_count || 0 }} 条</span>
          </div>
        </div>
      </div>

      <div class="stat-card key-card">
        <div class="stat-card-header">
          <span class="stat-card-title">重点设备</span>
          <el-icon class="stat-card-icon warning-icon"><Star /></el-icon>
        </div>
        <div class="stat-card-body">
          <div class="stat-card-number warning-text">{{ statistics.key_device_count || 0 }}</div>
          <div class="stat-card-sub">
            在线数：<span class="success-text">{{ statistics.key_device_online_count || 0 }}</span>
          </div>
          <div class="stat-card-progress">
            <el-progress
              :percentage="keyDeviceOnlineRate"
              :stroke-width="6"
              color="#e6a23c"
              show-text="false"
            />
          </div>
        </div>
      </div>
    </div>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="档案编号/SN码/设备型号" clearable />
      </el-form-item>
      <el-form-item label="设备类型" prop="device_type">
        <el-select v-model="searchForm.device_type" placeholder="请选择设备类型" clearable>
          <el-option v-for="item in DEVICE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="监控状态" prop="monitor_status">
        <el-select v-model="monitorStatusList" placeholder="请选择监控状态" multiple clearable>
          <el-option v-for="item in MONITOR_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="故障等级" prop="fault_level">
        <el-select v-model="searchForm.fault_level" placeholder="请选择故障等级" clearable>
          <el-option v-for="item in FAULT_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="连接状态" prop="connect_status">
        <el-select v-model="searchForm.connect_status" placeholder="请选择连接状态" clearable>
          <el-option v-for="item in CONNECT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="归属网点" prop="org_id">
        <el-input v-model="searchForm.org_id" placeholder="请输入归属网点" clearable />
      </el-form-item>
      <el-form-item label="重点设备" prop="is_key_device">
        <el-select v-model="searchForm.is_key_device" placeholder="请选择" clearable>
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="warning" :icon="Setting" @click="openBatchAdjust" :disabled="selection.length === 0" v-permission="'business:device-monitor:batch-update'">
          批量状态调整
        </el-button>
        <el-button type="primary" :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button type="success" :icon="Download" @click="handleExport" v-permission="'business:device-monitor:export'">导出</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          共 <el-text type="primary" size="large">{{ total }}</el-text> 条记录
        </el-text>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      :row-class-name="getRowClassName"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="archive_no" label="档案编号" width="200" />
      <el-table-column prop="sn_code" label="SN码" width="160" />
      <el-table-column label="设备类型" width="110">
        <template #default="{ row }">
          <el-tag type="info" effect="light" size="small">{{ row.device_type_text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="device_model" label="设备型号" width="150" />
      <el-table-column label="监控状态" width="110">
        <template #default="{ row }">
          <el-tag
            :type="getMonitorStatusType(row.monitor_status)"
            effect="light"
            size="small"
            :class="{ 'pulse-tag': row.monitor_status === 3 }"
          >
            {{ row.monitor_status_text || getMonitorStatusLabel(row.monitor_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="故障等级" width="90">
        <template #default="{ row }">
          <el-tag
            v-if="row.fault_level"
            :type="getFaultLevelType(row.fault_level)"
            effect="light"
            size="small"
          >
            {{ row.fault_level_text || getFaultLevelLabel(row.fault_level) }}
          </el-tag>
          <span v-else class="text-placeholder">-</span>
        </template>
      </el-table-column>
      <el-table-column label="连接状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getConnectStatusType(row.connect_status)" effect="light" size="small">
            {{ row.connect_status_text || getConnectStatusLabel(row.connect_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="监控策略" width="100">
        <template #default="{ row }">
          <el-tag :type="getStrategyType(row.monitor_strategy)" effect="light" size="small">
            {{ row.monitor_strategy_text || getStrategyLabel(row.monitor_strategy) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="运行参数" width="240">
        <template #default="{ row }">
          <div class="runtime-params">
            <div class="param-item">
              <span class="param-label">CPU</span>
              <el-progress :percentage="row.cpu_usage || 0" :stroke-width="6" :color="getParamColor(row.cpu_usage)" show-text="false" />
              <span class="param-value">{{ row.cpu_usage || 0 }}%</span>
            </div>
            <div class="param-item">
              <span class="param-label">内存</span>
              <el-progress :percentage="row.memory_usage || 0" :stroke-width="6" :color="getParamColor(row.memory_usage)" show-text="false" />
              <span class="param-value">{{ row.memory_usage || 0 }}%</span>
            </div>
            <div class="param-item">
              <span class="param-label">磁盘</span>
              <el-progress :percentage="row.disk_usage || 0" :stroke-width="6" :color="getParamColor(row.disk_usage)" show-text="false" />
              <span class="param-value">{{ row.disk_usage || 0 }}%</span>
            </div>
            <div class="param-item">
              <span class="param-label">温度</span>
              <el-progress :percentage="row.temperature || 0" :stroke-width="6" :color="getTempColor(row.temperature)" :max="100" show-text="false" />
              <span class="param-value">{{ row.temperature || 0 }}°C</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="last_data_time" label="最后数据时间" width="170" />
      <el-table-column label="归属网点" width="120">
        <template #default="{ row }">
          {{ row.org_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="重点设备" width="90" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.is_key_device" class="star-icon"><StarFilled /></el-icon>
          <span v-else class="text-placeholder">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.monitor_status === 3"
            type="danger" link size="small"
            @click="handleFaultProcess(row)"
            v-permission="'business:device-monitor:fault-handle'"
          >故障处理</el-button>
          <el-button
            type="warning" link size="small"
            @click="handleStatusAdjust(row)"
            v-permission="'business:device-monitor:update'"
          >状态调整</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showDetail"
      title="设备监控详情"
      width="780px"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border class="mb20">
          <el-descriptions-item label="档案编号">{{ currentDetail.archive_no }}</el-descriptions-item>
          <el-descriptions-item label="SN码">{{ currentDetail.sn_code }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ currentDetail.device_type_text }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ currentDetail.device_model }}</el-descriptions-item>
          <el-descriptions-item label="监控状态">
            <el-tag :type="getMonitorStatusType(currentDetail.monitor_status)" effect="light" size="small">
              {{ currentDetail.monitor_status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障等级">
            <el-tag v-if="currentDetail.fault_level" :type="getFaultLevelType(currentDetail.fault_level)" effect="light" size="small">
              {{ currentDetail.fault_level_text }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="连接状态">
            <el-tag :type="getConnectStatusType(currentDetail.connect_status)" effect="light" size="small">
              {{ currentDetail.connect_status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="监控策略">
            <el-tag :type="getStrategyType(currentDetail.monitor_strategy)" effect="light" size="small">
              {{ currentDetail.monitor_strategy_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="归属网点">{{ currentDetail.org_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安装位置">{{ currentDetail.install_location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后数据时间">{{ currentDetail.last_data_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运行天数">{{ currentDetail.run_duration_days || 0 }} 天</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4 class="section-title">运行参数趋势</h4>
          <div class="param-trend-grid">
            <div class="param-trend-card">
              <div class="param-trend-header">
                <span class="param-trend-label">CPU 使用率</span>
                <span class="param-trend-value" :class="{ 'danger-text': (currentDetail.cpu_usage || 0) > 80 }">
                  {{ currentDetail.cpu_usage || 0 }}%
                </span>
              </div>
              <el-progress :percentage="currentDetail.cpu_usage || 0" :stroke-width="8" :color="getParamColor(currentDetail.cpu_usage)" />
            </div>
            <div class="param-trend-card">
              <div class="param-trend-header">
                <span class="param-trend-label">内存使用率</span>
                <span class="param-trend-value" :class="{ 'danger-text': (currentDetail.memory_usage || 0) > 85 }">
                  {{ currentDetail.memory_usage || 0 }}%
                </span>
              </div>
              <el-progress :percentage="currentDetail.memory_usage || 0" :stroke-width="8" :color="getParamColor(currentDetail.memory_usage)" />
            </div>
            <div class="param-trend-card">
              <div class="param-trend-header">
                <span class="param-trend-label">磁盘使用率</span>
                <span class="param-trend-value" :class="{ 'warning-text': (currentDetail.disk_usage || 0) > 70 }">
                  {{ currentDetail.disk_usage || 0 }}%
                </span>
              </div>
              <el-progress :percentage="currentDetail.disk_usage || 0" :stroke-width="8" :color="getParamColor(currentDetail.disk_usage)" />
            </div>
            <div class="param-trend-card">
              <div class="param-trend-header">
                <span class="param-trend-label">设备温度</span>
                <span class="param-trend-value" :class="{ 'danger-text': (currentDetail.temperature || 0) > 75 }">
                  {{ currentDetail.temperature || 0 }}°C
                </span>
              </div>
              <el-progress :percentage="currentDetail.temperature || 0" :stroke-width="8" :color="getTempColor(currentDetail.temperature)" :max="100" />
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">近期故障记录</h4>
          <el-table :data="recentFaultRecords" size="small" border>
            <el-table-column prop="fault_code" label="故障代码" width="120" />
            <el-table-column prop="fault_level_text" label="故障等级" width="90">
              <template #default="{ row }">
                <el-tag :type="getFaultLevelType(row.fault_level)" effect="light" size="small">
                  {{ row.fault_level_text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fault_description" label="故障描述" show-overflow-tooltip />
            <el-table-column prop="fault_status_text" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getFaultStatusType(row.fault_status)" effect="light" size="small">
                  {{ row.fault_status_text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="occur_time" label="发生时间" width="170" />
          </el-table>
        </div>

        <div class="detail-section">
          <h4 class="section-title">监控日志摘要</h4>
          <el-table :data="monitorLogs" size="small" border>
            <el-table-column prop="log_type_text" label="日志类型" width="100" />
            <el-table-column prop="operation_detail" label="操作详情" show-overflow-tooltip />
            <el-table-column prop="operator_name" label="操作人" width="100" />
            <el-table-column prop="created_at" label="时间" width="170" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showStatusAdjust"
      title="状态调整"
      width="480px"
      class="adjust-dialog"
      destroy-on-close
    >
      <el-form :model="adjustForm" label-width="100px" class="adjust-form">
        <el-form-item label="目标状态">
          <el-select v-model="adjustForm.target_status" placeholder="请选择目标状态" style="width: 100%">
            <el-option v-for="item in MONITOR_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="adjustForm.target_status === 3" label="故障等级">
          <el-select v-model="adjustForm.fault_level" placeholder="请选择故障等级" style="width: 100%">
            <el-option v-for="item in FAULT_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="adjustForm.target_status === 3" label="故障代码">
          <el-input v-model="adjustForm.fault_code" placeholder="请输入故障代码" />
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input v-model="adjustForm.operation_remark" type="textarea" :rows="3" placeholder="请输入操作备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusAdjust = false">取消</el-button>
        <el-button type="primary" :loading="adjustLoading" @click="submitStatusAdjust">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showBatchAdjust"
      title="批量状态调整"
      width="480px"
      class="adjust-dialog"
      destroy-on-close
    >
      <div class="batch-info mb15">
        <el-alert
          :title="`已选择 ${selection.length} 台设备进行状态调整`"
          type="info"
          show-icon
          :closable="false"
        />
      </div>
      <el-form :model="batchAdjustForm" label-width="100px" class="adjust-form">
        <el-form-item label="目标状态">
          <el-select v-model="batchAdjustForm.target_status" placeholder="请选择目标状态" style="width: 100%">
            <el-option v-for="item in MONITOR_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchAdjustForm.target_status === 3" label="故障等级">
          <el-select v-model="batchAdjustForm.fault_level" placeholder="请选择故障等级" style="width: 100%">
            <el-option v-for="item in FAULT_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchAdjustForm.target_status === 3" label="故障代码">
          <el-input v-model="batchAdjustForm.fault_code" placeholder="请输入故障代码" />
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input v-model="batchAdjustForm.operation_remark" type="textarea" :rows="3" placeholder="请输入操作备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchAdjust = false">取消</el-button>
        <el-button type="primary" :loading="batchAdjustLoading" @click="submitBatchAdjust">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showFaultProcess"
      title="故障处理"
      width="520px"
      class="fault-dialog"
      destroy-on-close
    >
      <div v-if="currentFaultDevice" class="fault-info">
        <el-descriptions :column="2" border size="small" class="mb15">
          <el-descriptions-item label="档案编号">{{ currentFaultDevice.archive_no }}</el-descriptions-item>
          <el-descriptions-item label="SN码">{{ currentFaultDevice.sn_code }}</el-descriptions-item>
          <el-descriptions-item label="故障等级">
            <el-tag v-if="currentFaultDevice.fault_level" :type="getFaultLevelType(currentFaultDevice.fault_level)" effect="light" size="small">
              {{ currentFaultDevice.fault_level_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障代码">{{ currentFaultDevice.fault_code || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form :model="faultProcessForm" label-width="100px">
        <el-form-item label="处理状态">
          <el-radio-group v-model="faultProcessForm.fault_status">
            <el-radio :value="2">已修复</el-radio>
            <el-radio :value="3">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="faultProcessForm.handle_remark" type="textarea" :rows="4" placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFaultProcess = false">取消</el-button>
        <el-button type="primary" :loading="faultLoading" @click="submitFaultProcess">确认处理</el-button>
      </template>
    </el-dialog>

    <transition name="fault-notification">
      <div v-if="showFaultAlert" class="fault-alert-drawer" @click="handleFaultAlertClick">
        <div class="fault-alert-header">
          <el-icon class="fault-alert-icon pulse-icon"><Warning /></el-icon>
          <span class="fault-alert-title">新故障告警</span>
          <el-icon class="fault-alert-close" @click.stop="closeFaultAlert"><Close /></el-icon>
        </div>
        <div class="fault-alert-body">
          <div class="fault-alert-item">
            <span class="fault-alert-label">设备：</span>
            <span class="fault-alert-value">{{ faultAlertDevice?.archive_no }}</span>
          </div>
          <div class="fault-alert-item">
            <span class="fault-alert-label">故障等级：</span>
            <el-tag v-if="faultAlertDevice?.fault_level" :type="getFaultLevelType(faultAlertDevice.fault_level)" effect="dark" size="small">
              {{ faultAlertDevice.fault_level_text }}
            </el-tag>
          </div>
          <div class="fault-alert-item">
            <span class="fault-alert-label">故障代码：</span>
            <span class="fault-alert-value">{{ faultAlertDevice?.fault_code || '-' }}</span>
          </div>
          <div class="fault-alert-item">
            <span class="fault-alert-label">发生时间：</span>
            <span class="fault-alert-value">{{ faultAlertDevice?.last_fault_time }}</span>
          </div>
        </div>
        <div class="fault-alert-footer">
          <el-button size="small" type="danger" @click.stop="handleQuickProcess">快速处理</el-button>
          <el-button size="small" @click.stop="closeFaultAlert">忽略</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, CircleCheck, Warning, Star, StarFilled, Refresh, Download, Setting, Top, Close } from '@element-plus/icons-vue'
import {
  DEVICE_TYPE_OPTIONS,
  MONITOR_STATUS_OPTIONS,
  FAULT_LEVEL_OPTIONS,
  CONNECT_STATUS_OPTIONS,
  MONITOR_STRATEGY_OPTIONS,
  FAULT_STATUS_OPTIONS,
  type DeviceMonitorVO,
  type DeviceMonitorQueryParams,
  type DeviceMonitorStatistics,
  type DeviceMonitorStatus,
  type FaultLevel,
  type DeviceFaultRecordVO,
  type DeviceMonitorLogVO,
  type FaultStatus,
  getDeviceMonitorListApi,
  getDeviceMonitorStatisticsApi,
  getDeviceMonitorDetailApi,
  updateDeviceMonitorApi,
  batchUpdateMonitorApi,
  getDeviceFaultListApi,
  getDeviceMonitorLogListApi,
  handleDeviceFaultApi
} from '@api/deviceMonitor'

const loading = ref(false)
const adjustLoading = ref(false)
const batchAdjustLoading = ref(false)
const faultLoading = ref(false)
const showDetail = ref(false)
const showStatusAdjust = ref(false)
const showBatchAdjust = ref(false)
const showFaultProcess = ref(false)
const showFaultAlert = ref(false)

const currentDetail = ref<DeviceMonitorVO | null>(null)
const currentAdjustDevice = ref<DeviceMonitorVO | null>(null)
const currentFaultDevice = ref<DeviceMonitorVO | null>(null)
const faultAlertDevice = ref<DeviceMonitorVO | null>(null)

const tableData = ref<DeviceMonitorVO[]>([])
const total = ref(0)
const selection = ref<DeviceMonitorVO[]>([])
const statistics = reactive<DeviceMonitorStatistics>({
  total_count: 0,
  online_count: 0,
  offline_count: 0,
  fault_count: 0,
  normal_ratio: 0,
  fault_ratio: 0,
  offline_ratio: 0,
  today_fault_count: 0,
  today_recovered_count: 0,
  key_device_count: 0,
  key_device_online_count: 0,
  avg_online_rate: 0
})

const recentFaultRecords = ref<DeviceFaultRecordVO[]>([])
const monitorLogs = ref<DeviceMonitorLogVO[]>([])

const searchForm = reactive<DeviceMonitorQueryParams & { keyword?: string }>({
  page: 1,
  pageSize: 10,
  keyword: '',
  device_type: undefined,
  monitor_status: undefined,
  fault_level: undefined,
  connect_status: undefined,
  org_id: undefined,
  is_key_device: undefined
})

const monitorStatusList = ref<DeviceMonitorStatus[]>([])

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const adjustForm = reactive({
  target_status: undefined as DeviceMonitorStatus | undefined,
  fault_level: undefined as FaultLevel | undefined,
  fault_code: '',
  operation_remark: ''
})

const batchAdjustForm = reactive({
  target_status: undefined as DeviceMonitorStatus | undefined,
  fault_level: undefined as FaultLevel | undefined,
  fault_code: '',
  operation_remark: ''
})

const faultProcessForm = reactive({
  fault_status: 2 as FaultStatus,
  handle_remark: ''
})

const circumference = 2 * Math.PI * 42

const onlineRate = computed(() => {
  if (!statistics.total_count) return 0
  return Math.round((statistics.online_count / statistics.total_count) * 100)
})

const onlineRateOffset = computed(() => {
  return circumference - (onlineRate.value / 100) * circumference
})

const onlineRatio = computed(() => {
  if (!statistics.total_count) return 0
  return Math.round((statistics.online_count / statistics.total_count) * 100)
})

const keyDeviceOnlineRate = computed(() => {
  if (!statistics.key_device_count) return 0
  return Math.round((statistics.key_device_online_count / statistics.key_device_count) * 100)
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: DeviceMonitorQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (monitorStatusList.value.length > 0) {
      params.monitor_status = monitorStatusList.value[0]
    }
    const res = await getDeviceMonitorListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch device monitor list:', e)
  } finally {
    loading.value = false
  }
}

const fetchStatistics = async () => {
  try {
    const res = await getDeviceMonitorStatisticsApi()
    Object.assign(statistics, res.data)
  } catch (e) {
    console.error('Failed to fetch device monitor statistics:', e)
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.device_type = undefined
  searchForm.fault_level = undefined
  searchForm.connect_status = undefined
  searchForm.org_id = undefined
  searchForm.is_key_device = undefined
  monitorStatusList.value = []
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: DeviceMonitorVO[]) => {
  selection.value = val
}

const getRowClassName = ({ row }: { row: DeviceMonitorVO }) => {
  if (row.monitor_status === 3) {
    return 'fault-row'
  }
  return ''
}

const getMonitorStatusType = (status: DeviceMonitorStatus) => {
  const opt = MONITOR_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getMonitorStatusLabel = (status: DeviceMonitorStatus) => {
  const opt = MONITOR_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getFaultLevelType = (level: FaultLevel) => {
  const opt = FAULT_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || ''
}

const getFaultLevelLabel = (level: FaultLevel) => {
  const opt = FAULT_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getConnectStatusType = (status: number) => {
  const opt = CONNECT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getConnectStatusLabel = (status: number) => {
  const opt = CONNECT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getStrategyType = (strategy: number) => {
  const opt = MONITOR_STRATEGY_OPTIONS.find(o => o.value === strategy)
  return opt?.type || ''
}

const getStrategyLabel = (strategy: number) => {
  const opt = MONITOR_STRATEGY_OPTIONS.find(o => o.value === strategy)
  return opt?.label || '未知'
}

const getFaultStatusType = (status: FaultStatus) => {
  const opt = FAULT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getParamColor = (value: number | undefined) => {
  if (!value) return '#67c23a'
  if (value >= 90) return '#f56c6c'
  if (value >= 80) return '#e6a23c'
  return '#67c23a'
}

const getTempColor = (value: number | undefined) => {
  if (!value) return '#67c23a'
  if (value >= 80) return '#f56c6c'
  if (value >= 70) return '#e6a23c'
  return '#67c23a'
}

const refreshData = () => {
  fetchData()
  fetchStatistics()
  ElMessage.success('数据已刷新')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const handleDetail = async (row: DeviceMonitorVO) => {
  try {
    const res = await getDeviceMonitorDetailApi(row.id)
    currentDetail.value = res.data
    showDetail.value = true
    fetchRecentFaults(row.id)
    fetchMonitorLogs(row.id)
  } catch (e) {
    console.error('Failed to fetch device detail:', e)
  }
}

const fetchRecentFaults = async (deviceId: string) => {
  try {
    const res = await getDeviceFaultListApi({
      page: 1,
      pageSize: 5,
      device_id: deviceId as any
    })
    recentFaultRecords.value = res.data.list
  } catch (e) {
    console.error('Failed to fetch recent faults:', e)
  }
}

const fetchMonitorLogs = async (deviceId: string) => {
  try {
    const res = await getDeviceMonitorLogListApi({
      page: 1,
      pageSize: 5,
      device_id: deviceId
    })
    monitorLogs.value = res.data.list
  } catch (e) {
    console.error('Failed to fetch monitor logs:', e)
  }
}

const handleStatusAdjust = (row: DeviceMonitorVO) => {
  currentAdjustDevice.value = row
  adjustForm.target_status = row.monitor_status
  adjustForm.fault_level = row.fault_level
  adjustForm.fault_code = row.fault_code || ''
  adjustForm.operation_remark = ''
  showStatusAdjust.value = true
}

const submitStatusAdjust = async () => {
  if (!currentAdjustDevice.value || !adjustForm.target_status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  adjustLoading.value = true
  try {
    await updateDeviceMonitorApi(
      currentAdjustDevice.value.archive_no,
      adjustForm.target_status,
      adjustForm.fault_level,
      adjustForm.fault_code || undefined,
      undefined,
      adjustForm.operation_remark || undefined
    )
    ElMessage.success('状态调整成功')
    showStatusAdjust.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to adjust status:', e)
  } finally {
    adjustLoading.value = false
  }
}

const openBatchAdjust = () => {
  batchAdjustForm.target_status = undefined
  batchAdjustForm.fault_level = undefined
  batchAdjustForm.fault_code = ''
  batchAdjustForm.operation_remark = ''
  showBatchAdjust.value = true
}

const submitBatchAdjust = async () => {
  if (selection.value.length === 0) {
    ElMessage.warning('请先选择设备')
    return
  }
  if (!batchAdjustForm.target_status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  batchAdjustLoading.value = true
  try {
    const archiveNos = selection.value.map(item => item.archive_no)
    const res = await batchUpdateMonitorApi(
      archiveNos,
      batchAdjustForm.target_status,
      batchAdjustForm.fault_level,
      batchAdjustForm.fault_code || undefined,
      batchAdjustForm.operation_remark || undefined
    )
    ElMessage.success(`批量调整成功：成功 ${res.data.success_count} 条，失败 ${res.data.fail_count} 条`)
    showBatchAdjust.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to batch adjust:', e)
  } finally {
    batchAdjustLoading.value = false
  }
}

const handleFaultProcess = (row: DeviceMonitorVO) => {
  currentFaultDevice.value = row
  faultProcessForm.fault_status = 2
  faultProcessForm.handle_remark = ''
  showFaultProcess.value = true
}

const submitFaultProcess = async () => {
  if (!currentFaultDevice.value) return
  faultLoading.value = true
  try {
    const faultId = currentFaultDevice.value.id
    await handleDeviceFaultApi(
      faultId,
      faultProcessForm.fault_status,
      faultProcessForm.handle_remark || undefined
    )
    ElMessage.success('故障处理成功')
    showFaultProcess.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to process fault:', e)
  } finally {
    faultLoading.value = false
  }
}

const handleFaultAlertClick = () => {
  if (faultAlertDevice.value) {
    handleDetail(faultAlertDevice.value)
    closeFaultAlert()
  }
}

const handleQuickProcess = () => {
  if (faultAlertDevice.value) {
    handleFaultProcess(faultAlertDevice.value)
    closeFaultAlert()
  }
}

const closeFaultAlert = () => {
  showFaultAlert.value = false
  faultAlertDevice.value = null
}

const simulateFaultAlert = () => {
  const faultDevices = tableData.value.filter(d => d.monitor_status === 3)
  if (faultDevices.length > 0) {
    faultAlertDevice.value = faultDevices[0]
    showFaultAlert.value = true
    setTimeout(() => {
      closeFaultAlert()
    }, 8000)
  }
}

let refreshTimer: any = null

onMounted(() => {
  fetchData()
  fetchStatistics()

  refreshTimer = setInterval(() => {
    fetchStatistics()
  }, 30000)

  setTimeout(() => {
    simulateFaultAlert()
  }, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.ccb-business-device-monitor {
  padding: 16px;
}

.stat-card-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-card-title {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.stat-card-icon {
  font-size: 24px;
}

.success-icon {
  color: #67c23a;
}

.danger-icon {
  color: #f56c6c;
}

.warning-icon {
  color: #e6a23c;
}

.stat-card-body {
  position: relative;
}

.stat-card-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 8px;
}

.success-text {
  color: #67c23a;
}

.danger-text {
  color: #f56c6c;
}

.warning-text {
  color: #e6a23c;
}

.highlight-text {
  color: #409eff;
  font-weight: 600;
}

.stat-card-sub {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #67c23a;
}

.warning-trend {
  color: #e6a23c;
}

.stat-card-ring {
  position: relative;
  width: 80px;
  height: 80px;
  margin-top: 8px;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ring-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.ring-label {
  font-size: 12px;
  color: #909399;
}

.today-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  font-weight: 500;
}

.pulse-badge {
  animation: pulse 2s infinite;
}

.stat-card-progress {
  margin-top: 12px;
}

.runtime-params {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  width: 36px;
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.param-item .el-progress {
  flex: 1;
  margin: 0;
}

.param-value {
  width: 50px;
  font-size: 12px;
  color: #606266;
  text-align: right;
  flex-shrink: 0;
}

.star-icon {
  color: #e6a23c;
  font-size: 16px;
}

.text-placeholder {
  color: #c0c4cc;
}

.fault-row {
  background-color: #fef0f0 !important;
}

.fault-row:hover > td {
  background-color: #fde2e2 !important;
}

.pulse-tag {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.ccb-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ccb-table-toolbar-left {
  display: flex;
  gap: 8px;
}

.ccb-table-toolbar-right {
  display: flex;
  align-items: center;
}

.detail-content {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.param-trend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.param-trend-card {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.param-trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.param-trend-label {
  font-size: 13px;
  color: #606266;
}

.param-trend-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.fault-alert-drawer {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(245, 108, 108, 0.3);
  border: 1px solid #fde2e2;
  z-index: 3000;
  cursor: pointer;
  overflow: hidden;
}

.fault-alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: #fff;
}

.fault-alert-icon {
  font-size: 20px;
}

.pulse-icon {
  animation: pulse 1s infinite;
}

.fault-alert-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}

.fault-alert-close {
  cursor: pointer;
  font-size: 16px;
  transition: opacity 0.2s;
}

.fault-alert-close:hover {
  opacity: 0.8;
}

.fault-alert-body {
  padding: 16px;
}

.fault-alert-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  font-size: 13px;
}

.fault-alert-item:last-child {
  margin-bottom: 0;
}

.fault-alert-label {
  color: #909399;
  flex-shrink: 0;
  width: 70px;
}

.fault-alert-value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.fault-alert-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.fault-notification-enter-active,
.fault-notification-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fault-notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.fault-notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.mb15 {
  margin-bottom: 15px;
}

.mb20 {
  margin-bottom: 20px;
}

.batch-info {
  margin-bottom: 15px;
}

.detail-dialog :deep(.el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}

@media screen and (max-width: 1400px) {
  .stat-card-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .stat-card-container {
    grid-template-columns: 1fr;
  }

  .param-trend-grid {
    grid-template-columns: 1fr;
  }
}
</style>
