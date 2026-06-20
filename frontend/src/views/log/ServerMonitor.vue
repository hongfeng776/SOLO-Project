<template>
  <div class="server-monitor-page">
    <div v-if="!hasPermission" class="permission-overlay">
      <div class="permission-content" :class="{ 'shake-animation': showPermissionShake }">
        <el-icon :size="64" color="#f56c6c"><Warning /></el-icon>
        <div class="permission-title">权限不足</div>
        <div class="permission-desc">您没有访问服务器监控的权限，仅超级运维人员(super_ops)可查看</div>
        <div class="permission-hint">如需访问，请联系管理员申请权限</div>
      </div>
    </div>

    <template v-else>
      <div v-if="!apiConnected" class="api-warning">
        <el-alert title="监控接口连接异常，当前监控数据可能失效" type="error" :closable="false" show-icon>
          <template #icon>
            <el-icon><Connection /></el-icon>
          </template>
        </el-alert>
      </div>

      <div class="stats-section" v-if="statsLoaded">
        <div class="stat-card monitor-card" v-for="item in statCards" :key="item.key" tabindex="0">
          <div class="stat-icon" :class="`stat-${item.key}`">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" :class="{ 'blink-warning': item.isAlert }">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
          <div v-if="item.isAlert" class="alert-badge" @click="viewAlertDetail(item.alertRecord)">
            <el-icon><Bell /></el-icon>
            <span>预警</span>
          </div>
        </div>
      </div>

      <div class="filter-card card-wrapper">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="服务器">
            <el-select v-model="filterForm.serverId" placeholder="全部服务器" clearable filterable style="width: 200px">
              <el-option v-for="server in serverList" :key="server.serverId"
                :label="`${server.serverName} (${server.serverIp})`" :value="server.serverId" />
            </el-select>
          </el-form-item>
          <el-form-item label="环境">
            <el-select v-model="filterForm.environment" placeholder="全部环境" clearable style="width: 140px">
              <el-option v-for="item in environmentOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="预警类型">
            <el-select v-model="filterForm.alertType" placeholder="全部类型" clearable style="width: 140px">
              <el-option v-for="item in alertTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="预警级别">
            <el-select v-model="filterForm.alertLevel" placeholder="全部级别" clearable style="width: 140px">
              <el-option v-for="item in alertLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间区间">
            <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至"
              start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss"
              :shortcuts="dateShortcuts" style="width: 340px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">查询</el-button>
            <el-button :icon="Refresh" @click="handleRefresh" :class="{ 'ripple-animation': refreshing }" :loading="refreshing">
              刷新
            </el-button>
            <el-button type="success" :icon="Download" @click="openExportDialog">导出数据</el-button>
            <el-button type="warning" :icon="TrendCharts" @click="openTraceabilityDialog">异常溯源</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="tabs-card card-wrapper">
        <el-tabs v-model="dataMode" class="monitor-tabs">
          <el-tab-pane label="实时数据" name="realtime">
            <template #label>
              <span class="tab-label">
                <el-icon><Monitor /></el-icon>
                <span>实时数据</span>
                <el-tag v-if="realtimeData.length > 0" type="success" size="small" style="margin-left: 6px">
                  {{ realtimeData.length }}台
                </el-tag>
              </span>
            </template>
            <div class="realtime-grid">
              <div v-for="monitor in realtimeData" :key="monitor.id"
                class="realtime-card monitor-card" tabindex="0"
                :class="{ 'has-alert': monitor.hasAlert }"
                @click="monitor.hasAlert && viewAlertDetail(monitor)">
                <div class="card-header">
                  <div class="server-name">
                    <el-icon><DataLine /></el-icon>
                    <span>{{ monitor.serverName }}</span>
                    <el-tag size="small" :type="getEnvTagType(monitor.environment)">
                      {{ getEnvLabel(monitor.environment) }}
                    </el-tag>
                  </div>
                  <div class="server-ip">{{ monitor.serverIp }}</div>
                </div>
                <div class="metric-grid">
                  <div class="metric-item" :class="{ 'is-warning': monitor.cpuUsage > 90 }">
                    <div class="metric-header">
                      <el-icon><Cpu /></el-icon>
                      <span>CPU</span>
                    </div>
                    <el-progress :percentage="Math.round(monitor.cpuUsage)"
                      :status="monitor.cpuUsage > 90 ? 'exception' : monitor.cpuUsage > 70 ? 'warning' : undefined" />
                    <div class="metric-value" :class="{ 'blink-warning': monitor.cpuUsage > 90 }">
                      {{ formatNumber(monitor.cpuUsage.toFixed(1)) }}%
                    </div>
                  </div>
                  <div class="metric-item" :class="{ 'is-warning': monitor.memoryUsage > 90 }">
                    <div class="metric-header">
                      <el-icon><Memory /></el-icon>
                      <span>内存</span>
                    </div>
                    <el-progress :percentage="Math.round(monitor.memoryUsage)"
                      :status="monitor.memoryUsage > 90 ? 'exception' : monitor.memoryUsage > 70 ? 'warning' : undefined" />
                    <div class="metric-value" :class="{ 'blink-warning': monitor.memoryUsage > 90 }">
                      {{ formatNumber(monitor.memoryUsage.toFixed(1)) }}%
                    </div>
                  </div>
                  <div class="metric-item" :class="{ 'is-warning': monitor.diskUsage > 90 }">
                    <div class="metric-header">
                      <el-icon><HardDisk /></el-icon>
                      <span>磁盘</span>
                    </div>
                    <el-progress :percentage="Math.round(monitor.diskUsage)"
                      :status="monitor.diskUsage > 90 ? 'exception' : monitor.diskUsage > 70 ? 'warning' : undefined" />
                    <div class="metric-value" :class="{ 'blink-warning': monitor.diskUsage > 90 }">
                      {{ formatNumber(monitor.diskUsage.toFixed(1)) }}%
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>接口负载</span>
                    </div>
                    <el-tag :type="getLoadLevelTagType(monitor.apiLoadLevel)" size="small">
                      {{ getLoadLevelLabel(monitor.apiLoadLevel) }}
                    </el-tag>
                    <div class="metric-value">
                      QPS: {{ formatNumber(monitor.apiQps.toFixed(0)) }}
                    </div>
                  </div>
                </div>
                <div v-if="monitor.hasAlert" class="alert-info">
                  <el-tag :type="getAlertLevelTagType(monitor.alertLevel)" size="small" effect="dark" class="blink-warning">
                    <el-icon><Warning /></el-icon>
                    {{ getAlertTypeLabel(monitor.alertType) }}: {{ monitor.alertMessage }}
                  </el-tag>
                </div>
                <div class="card-footer">
                  <span>更新时间: {{ formatDateTime(monitor.createdAt) }}</span>
                  <span>运行: {{ formatNumber(Math.floor(monitor.uptime / 3600)) }}小时</span>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="历史时段数据" name="history">
            <template #label>
              <span class="tab-label">
                <el-icon><History /></el-icon>
                <span>历史时段数据</span>
              </span>
            </template>
            <div class="table-wrapper">
              <el-table :data="historyData" v-loading="loadingHistory" height="500" border stripe>
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="serverName" label="服务器" width="140" align="center" />
                <el-table-column label="CPU" width="120" align="center">
                  <template #default="{ row }">
                    <span :class="{ 'blink-warning text-danger': row.cpuUsage > 90 }">
                      {{ formatNumber(row.cpuUsage.toFixed(1)) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="内存" width="120" align="center">
                  <template #default="{ row }">
                    <span :class="{ 'blink-warning text-danger': row.memoryUsage > 90 }">
                      {{ formatNumber(row.memoryUsage.toFixed(1)) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="磁盘" width="120" align="center">
                  <template #default="{ row }">
                    <span :class="{ 'blink-warning text-danger': row.diskUsage > 90 }">
                      {{ formatNumber(row.diskUsage.toFixed(1)) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="接口QPS" width="120" align="center">
                  <template #default="{ row }">{{ formatNumber(row.apiQps.toFixed(0)) }}</template>
                </el-table-column>
                <el-table-column label="平均响应" width="120" align="center">
                  <template #default="{ row }">{{ formatNumber(row.apiAvgResponseTime.toFixed(0)) }}ms</template>
                </el-table-column>
                <el-table-column label="预警" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.hasAlert" :type="getAlertLevelTagType(row.alertLevel)" size="small" effect="dark"
                      class="blink-warning" @click="viewAlertDetail(row)" style="cursor: pointer">
                      {{ getAlertTypeLabel(row.alertType) }}
                    </el-tag>
                    <span v-else class="no-alert">-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="时间" width="170" align="center">
                  <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="峰值数据" name="peak">
            <template #label>
              <span class="tab-label">
                <el-icon><TrendCharts /></el-icon>
                <span>峰值数据</span>
              </span>
            </template>
            <div v-if="peakStats" class="peak-summary">
              <div class="peak-card monitor-card" tabindex="0" v-for="(value, key) in peakDisplayItems" :key="key">
                <div class="peak-icon" :class="`peak-${key}`">
                  <el-icon :size="20"><component :is="peakIcons[key]" /></el-icon>
                </div>
                <div class="peak-info">
                  <div class="peak-label">{{ peakLabels[key] }}</div>
                  <div class="peak-value" :class="{ 'blink-warning text-danger': value! > 90 && ['cpu', 'memory', 'disk'].includes(key) }">
                    {{ formatNumber(value!.toFixed(1)) }}{{ ['cpu', 'memory', 'disk'].includes(key) ? '%' : '' }}
                  </div>
                </div>
              </div>
            </div>
            <div class="table-wrapper" style="margin-top: 16px">
              <el-table :data="peakData" v-loading="loadingPeak" height="400" border stripe>
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="serverName" label="服务器" width="140" align="center" />
                <el-table-column label="峰值类型" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag type="warning" size="small">{{ peakTypeLabels[row.peakType] || row.peakType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="峰值CPU" width="120" align="center">
                  <template #default="{ row }">
                    <span :class="{ 'blink-warning text-danger': row.cpuUsage > 90 }">
                      {{ formatNumber(row.cpuUsage.toFixed(1)) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="峰值内存" width="120" align="center">
                  <template #default="{ row }">
                    <span :class="{ 'blink-warning text-danger': row.memoryUsage > 90 }">
                      {{ formatNumber(row.memoryUsage.toFixed(1)) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="峰值磁盘" width="120" align="center">
                  <template #default="{ row }">
                    <span :class="{ 'blink-warning text-danger': row.diskUsage > 90 }">
                      {{ formatNumber(row.diskUsage.toFixed(1)) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="峰值QPS" width="120" align="center">
                  <template #default="{ row }">{{ formatNumber(row.apiQps.toFixed(0)) }}</template>
                </el-table-column>
                <el-table-column prop="createdAt" label="峰值时间" width="170" align="center">
                  <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <el-dialog v-model="alertDetailVisible" title="预警详情" width="700px" class="alert-detail-dialog">
      <div v-if="currentAlert" class="alert-detail">
        <div class="alert-header" :class="`level-${currentAlert.alertLevel}`">
          <el-icon :size="32"><Warning /></el-icon>
          <div>
            <div class="alert-title">
              {{ getAlertTypeLabel(currentAlert.alertType) }}预警
              <el-tag :type="getAlertLevelTagType(currentAlert.alertLevel)" size="small" effect="dark" style="margin-left: 8px">
                {{ getAlertLevelLabel(currentAlert.alertLevel) }}
              </el-tag>
            </div>
            <div class="alert-server">{{ currentAlert.serverName }} ({{ currentAlert.serverIp }})</div>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin-top: 16px">
          <el-descriptions-item label="服务器ID">{{ currentAlert.serverId }}</el-descriptions-item>
          <el-descriptions-item label="环境">{{ getEnvLabel(currentAlert.environment) }}</el-descriptions-item>
          <el-descriptions-item label="预警类型">{{ getAlertTypeLabel(currentAlert.alertType) }}</el-descriptions-item>
          <el-descriptions-item label="预警级别">{{ getAlertLevelLabel(currentAlert.alertLevel) }}</el-descriptions-item>
          <el-descriptions-item label="预警值">{{ currentAlert.alertValue || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预警时间">{{ formatDateTime(currentAlert.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="预警消息" :span="2">{{ currentAlert.alertMessage || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="alert-metrics" v-if="currentAlert">
          <h4 class="section-title">异常时段指标数据</h4>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="metric-box">
                <div class="metric-label">CPU使用率</div>
                <div class="metric-num" :class="{ 'text-danger': currentAlert.cpuUsage > 90 }">
                  {{ formatNumber(currentAlert.cpuUsage.toFixed(1)) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-box">
                <div class="metric-label">内存使用率</div>
                <div class="metric-num" :class="{ 'text-danger': currentAlert.memoryUsage > 90 }">
                  {{ formatNumber(currentAlert.memoryUsage.toFixed(1)) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-box">
                <div class="metric-label">磁盘使用率</div>
                <div class="metric-num" :class="{ 'text-danger': currentAlert.diskUsage > 90 }">
                  {{ formatNumber(currentAlert.diskUsage.toFixed(1)) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-box">
                <div class="metric-label">接口QPS</div>
                <div class="metric-num">{{ formatNumber(currentAlert.apiQps.toFixed(0)) }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div v-if="currentAlert.anomalyPeriod && currentAlert.anomalyPeriod.length > 0" class="anomaly-period">
          <h4 class="section-title">异常时段详细数据</h4>
          <el-table :data="currentAlert.anomalyPeriod" size="small" border max-height="250">
            <el-table-column prop="createdAt" label="时间" width="170" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="CPU" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.cpuUsage > 90 }">{{ formatNumber(row.cpuUsage.toFixed(1)) }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="内存" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.memoryUsage > 90 }">{{ formatNumber(row.memoryUsage.toFixed(1)) }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="磁盘" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.diskUsage > 90 }">{{ formatNumber(row.diskUsage.toFixed(1)) }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="QPS" width="100" align="center">
              <template #default="{ row }">{{ formatNumber(row.apiQps.toFixed(0)) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="exportDialogVisible" title="导出监控数据" width="560px" class="export-dialog">
      <div class="export-content">
        <el-form :model="exportForm" label-width="100px">
          <el-form-item label="时间范围">
            <el-date-picker v-model="exportDateRange" type="datetimerange" range-separator="至"
              start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%" />
          </el-form-item>
          <el-form-item label="服务器">
            <el-select v-model="exportForm.serverId" placeholder="留空则导出全部" clearable style="width: 100%">
              <el-option v-for="server in serverList" :key="server.serverId"
                :label="`${server.serverName} (${server.serverIp})`" :value="server.serverId" />
            </el-select>
          </el-form-item>
          <el-form-item label="包含预警">
            <el-switch v-model="exportForm.includeAlerts" />
          </el-form-item>
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportForm.format">
              <el-radio-button value="json">JSON</el-radio-button>
              <el-radio-button value="csv">CSV</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <div v-if="exporting" class="export-progress">
          <el-progress :percentage="exportProgress" :status="exportProgress === 100 ? 'success' : undefined" :stroke-width="16" />
          <div class="progress-text">
            正在导出：{{ exportProcessed }} / {{ exportTotal }} 条
            <span v-if="exportFiltered > 0" class="filtered-text">(已过滤空值数据 {{ exportFiltered }} 条)</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false" :disabled="exporting">取消</el-button>
        <el-button type="primary" :icon="exporting ? Refresh : Download" @click="handleExport" :loading="exporting">
          {{ exporting ? '导出中...' : '开始导出' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceabilityDialogVisible" title="异常溯源复盘" width="1200px" class="traceability-dialog">
      <div v-if="traceabilityResult" class="traceability-content">
        <div class="server-overview">
          <h4 class="section-title">服务器概览</h4>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="服务器名称">{{ traceabilityResult.serverOverview.serverName }}</el-descriptions-item>
            <el-descriptions-item label="IP地址">{{ traceabilityResult.serverOverview.serverIp }}</el-descriptions-item>
            <el-descriptions-item label="环境">{{ getEnvLabel(traceabilityResult.serverOverview.environment) }}</el-descriptions-item>
            <el-descriptions-item label="分析时段">{{ traceabilityResult.serverOverview.analysisPeriod }}</el-descriptions-item>
            <el-descriptions-item label="记录总数">{{ formatNumber(traceabilityResult.serverOverview.totalRecords) }}</el-descriptions-item>
            <el-descriptions-item label="区域">{{ traceabilityResult.serverOverview.region || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-tabs v-model="traceabilityTab" class="traceability-tabs">
          <el-tab-pane label="资源分析" name="resource">
            <div class="resource-analysis">
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="analysis-card monitor-card" tabindex="0">
                    <h5 class="card-title"><el-icon><Cpu /></el-icon> CPU使用分析</h5>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="平均值">{{ formatNumber(traceabilityResult.resourceAnalysis.cpu.avg.toFixed(1)) }}%</el-descriptions-item>
                      <el-descriptions-item label="最大值" :class="{ 'text-danger': traceabilityResult.resourceAnalysis.cpu.max > 90 }">
                        {{ formatNumber(traceabilityResult.resourceAnalysis.cpu.max.toFixed(1)) }}%
                      </el-descriptions-item>
                      <el-descriptions-item label="最小值">{{ formatNumber(traceabilityResult.resourceAnalysis.cpu.min.toFixed(1)) }}%</el-descriptions-item>
                      <el-descriptions-item label="P95值">{{ formatNumber(traceabilityResult.resourceAnalysis.cpu.p95.toFixed(1)) }}%</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="analysis-card monitor-card" tabindex="0">
                    <h5 class="card-title"><el-icon><Memory /></el-icon> 内存使用分析</h5>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="平均值">{{ formatNumber(traceabilityResult.resourceAnalysis.memory.avg.toFixed(1)) }}%</el-descriptions-item>
                      <el-descriptions-item label="最大值" :class="{ 'text-danger': traceabilityResult.resourceAnalysis.memory.max > 90 }">
                        {{ formatNumber(traceabilityResult.resourceAnalysis.memory.max.toFixed(1)) }}%
                      </el-descriptions-item>
                      <el-descriptions-item label="最小值">{{ formatNumber(traceabilityResult.resourceAnalysis.memory.min.toFixed(1)) }}%</el-descriptions-item>
                      <el-descriptions-item label="P95值">{{ formatNumber(traceabilityResult.resourceAnalysis.memory.p95.toFixed(1)) }}%</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-col>
                <el-col :span="12" style="margin-top: 16px">
                  <div class="analysis-card monitor-card" tabindex="0">
                    <h5 class="card-title"><el-icon><HardDisk /></el-icon> 磁盘使用分析</h5>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="平均值">{{ formatNumber(traceabilityResult.resourceAnalysis.disk.avg.toFixed(1)) }}%</el-descriptions-item>
                      <el-descriptions-item label="最大值" :class="{ 'text-danger': traceabilityResult.resourceAnalysis.disk.max > 90 }">
                        {{ formatNumber(traceabilityResult.resourceAnalysis.disk.max.toFixed(1)) }}%
                      </el-descriptions-item>
                      <el-descriptions-item label="最小值">{{ formatNumber(traceabilityResult.resourceAnalysis.disk.min.toFixed(1)) }}%</el-descriptions-item>
                      <el-descriptions-item label="P95值">{{ formatNumber(traceabilityResult.resourceAnalysis.disk.p95.toFixed(1)) }}%</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-col>
                <el-col :span="12" style="margin-top: 16px">
                  <div class="analysis-card monitor-card" tabindex="0">
                    <h5 class="card-title"><el-icon><TrendCharts /></el-icon> 接口负载分析</h5>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="平均QPS">{{ formatNumber(traceabilityResult.resourceAnalysis.api.avgQps.toFixed(0)) }}</el-descriptions-item>
                      <el-descriptions-item label="峰值QPS">{{ formatNumber(traceabilityResult.resourceAnalysis.api.maxQps.toFixed(0)) }}</el-descriptions-item>
                      <el-descriptions-item label="平均响应">{{ formatNumber(traceabilityResult.resourceAnalysis.api.avgResponseTime.toFixed(0)) }}ms</el-descriptions-item>
                      <el-descriptions-item label="P95响应">{{ formatNumber(traceabilityResult.resourceAnalysis.api.p95ResponseTime.toFixed(0)) }}ms</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="异常检测" name="anomaly">
            <div class="anomaly-detection">
              <div class="anomaly-summary">
                <el-descriptions :column="4" border>
                  <el-descriptions-item label="异常总数">
                    <el-tag type="danger" size="large">{{ formatNumber(traceabilityResult.anomalyDetection.totalAnomalies) }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="严重异常">
                    <el-tag type="danger" effect="dark" size="large">{{ formatNumber(traceabilityResult.anomalyDetection.criticalCount) }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="警告异常">
                    <el-tag type="warning" size="large">{{ formatNumber(traceabilityResult.anomalyDetection.warningCount) }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="负载匹配度">
                    <el-tag :type="traceabilityResult.loadMatching.avgMatchScore >= 80 ? 'success' : traceabilityResult.loadMatching.avgMatchScore >= 60 ? 'warning' : 'danger'" size="large">
                      {{ formatNumber(traceabilityResult.loadMatching.avgMatchScore.toFixed(1)) }}%
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div class="anomaly-types" style="margin-top: 16px">
                <h5 class="sub-title">异常类型分布</h5>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="CPU过载">
                    <el-tag :type="traceabilityResult.anomalyDetection.byType.cpu_overload > 0 ? 'danger' : 'info'" size="small">
                      {{ formatNumber(traceabilityResult.anomalyDetection.byType.cpu_overload) }} 次
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="内存过载">
                    <el-tag :type="traceabilityResult.anomalyDetection.byType.memory_overload > 0 ? 'danger' : 'info'" size="small">
                      {{ formatNumber(traceabilityResult.anomalyDetection.byType.memory_overload) }} 次
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="磁盘过载">
                    <el-tag :type="traceabilityResult.anomalyDetection.byType.disk_overload > 0 ? 'danger' : 'info'" size="small">
                      {{ formatNumber(traceabilityResult.anomalyDetection.byType.disk_overload) }} 次
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="接口过载">
                    <el-tag :type="traceabilityResult.anomalyDetection.byType.api_overload > 0 ? 'warning' : 'info'" size="small">
                      {{ formatNumber(traceabilityResult.anomalyDetection.byType.api_overload) }} 次
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="接口超时">
                    <el-tag :type="traceabilityResult.anomalyDetection.byType.api_timeout > 0 ? 'warning' : 'info'" size="small">
                      {{ formatNumber(traceabilityResult.anomalyDetection.byType.api_timeout) }} 次
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="系统崩溃">
                    <el-tag :type="traceabilityResult.anomalyDetection.byType.system_crash > 0 ? 'danger' : 'info'" size="small" effect="dark">
                      {{ formatNumber(traceabilityResult.anomalyDetection.byType.system_crash) }} 次
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div v-if="traceabilityResult.anomalyDetection.anomalies.length > 0" class="anomaly-list" style="margin-top: 16px">
                <h5 class="sub-title">异常明细</h5>
                <el-table :data="traceabilityResult.anomalyDetection.anomalies.slice(0, 20)" size="small" border max-height="300">
                  <el-table-column prop="time" label="时间" width="170" align="center">
                    <template #default="{ row }">{{ formatDateTime(row.time) }}</template>
                  </el-table-column>
                  <el-table-column label="级别" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.severity === 'critical' ? 'danger' : 'warning'" size="small" effect="dark">
                        {{ row.severity === 'critical' ? '严重' : '警告' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" width="120" align="center" />
                  <el-table-column prop="message" label="异常描述" min-width="250" show-overflow-tooltip />
                  <el-table-column label="数值" width="120" align="center">
                    <template #default="{ row }">{{ row.value }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="负载匹配" name="load">
            <div class="load-matching">
              <el-alert v-if="traceabilityResult.loadMatching.valid" title="服务器负载与业务访问量匹配性校验通过" type="success" :closable="false" show-icon />
              <el-alert v-else :title="traceabilityResult.loadMatching.message || '负载与业务量存在不匹配'" type="warning" :closable="false" show-icon />
              <div v-if="traceabilityResult.loadMatching.mismatchedPeriods.length > 0" class="mismatch-list" style="margin-top: 16px">
                <h5 class="sub-title">不匹配时段明细 (共 {{ formatNumber(traceabilityResult.loadMatching.totalMismatches) }} 处)</h5>
                <el-table :data="traceabilityResult.loadMatching.mismatchedPeriods" size="small" border>
                  <el-table-column prop="time" label="时段" width="170" align="center">
                    <template #default="{ row }">{{ formatDateTime(row.time) }}</template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" width="140" align="center" />
                  <el-table-column prop="businessVolume" label="业务量" width="120" align="center">
                    <template #default="{ row }">{{ formatNumber(row.businessVolume) }}</template>
                  </el-table-column>
                  <el-table-column prop="avgLoad" label="平均负载" width="120" align="center" />
                  <el-table-column prop="message" label="说明" min-width="250" show-overflow-tooltip />
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="风险预判" name="risk">
            <div class="risk-prediction">
              <div class="risk-overview">
                <el-alert :title="'整体风险等级: ' + getRiskLevelLabel(traceabilityResult.riskPrediction.overallRisk)"
                  :type="traceabilityResult.riskPrediction.overallRisk === 'critical' || traceabilityResult.riskPrediction.overallRisk === 'high' ? 'error' : traceabilityResult.riskPrediction.overallRisk === 'medium' ? 'warning' : 'success'"
                  :closable="false" show-icon>
                  <template #default>
                    <div>预测窗口: {{ traceabilityResult.riskPrediction.predictionWindow }}</div>
                    <div v-if="traceabilityResult.riskPrediction.message">{{ traceabilityResult.riskPrediction.message }}</div>
                  </template>
                </el-alert>
              </div>
              <div v-if="traceabilityResult.riskPrediction.risks.length > 0" class="risk-list" style="margin-top: 16px">
                <el-table :data="traceabilityResult.riskPrediction.risks" border>
                  <el-table-column label="优先级" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.level === 'critical' ? 'danger' : row.level === 'high' ? 'danger' : row.level === 'medium' ? 'warning' : 'info'" size="small" effect="dark">
                        {{ getRiskLevelLabel(row.level) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="风险类型" width="140" align="center" />
                  <el-table-column prop="title" label="风险标题" width="180" />
                  <el-table-column prop="description" label="风险描述" min-width="250" show-overflow-tooltip />
                  <el-table-column prop="suggestion" label="优化建议" min-width="250" show-overflow-tooltip />
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="优化建议" name="optimization">
            <div class="optimization-content">
              <div class="optimization-summary">
                <el-alert :title="traceabilityResult.optimizationSuggestions.summary"
                  :type="traceabilityResult.optimizationSuggestions.overallStatus === 'low' ? 'success' : traceabilityResult.optimizationSuggestions.overallStatus === 'medium' ? 'warning' : 'error'"
                  :closable="false" show-icon>
                  <template #title>
                    <div class="overall-status">
                      <span>整体状态：</span>
                      <el-tag :type="traceabilityResult.optimizationSuggestions.overallStatus === 'low' ? 'success' : traceabilityResult.optimizationSuggestions.overallStatus === 'medium' ? 'warning' : 'danger'" size="large">
                        {{ getRiskLevelLabel(traceabilityResult.optimizationSuggestions.overallStatus) }}
                      </el-tag>
                    </div>
                    <div style="margin-top: 8px">{{ traceabilityResult.optimizationSuggestions.summary }}</div>
                  </template>
                </el-alert>
              </div>
              <div class="suggestion-list" style="margin-top: 16px">
                <div v-for="(suggestion, idx) in traceabilityResult.optimizationSuggestions.suggestions" :key="idx" class="suggestion-item">
                  <div class="suggestion-header">
                    <el-tag :type="suggestion.priority === 'high' ? 'danger' : suggestion.priority === 'medium' ? 'warning' : 'info'" size="small">
                      {{ suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级' }}
                    </el-tag>
                    <span class="suggestion-category">[{{ suggestion.category }}]</span>
                    <span class="suggestion-title">{{ suggestion.title }}</span>
                  </div>
                  <div class="suggestion-desc">{{ suggestion.description }}</div>
                  <div class="suggestion-action">
                    <el-icon><Clock /></el-icon>
                    <span>建议操作：{{ suggestion.action }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <div class="server-selector">
          <span>选择服务器：</span>
          <el-select v-model="selectedServerId" placeholder="请选择服务器" style="width: 280px" @change="fetchTraceability">
            <el-option v-for="server in serverList" :key="server.serverId"
              :label="`${server.serverName} (${server.serverIp})`" :value="server.serverId" />
          </el-select>
        </div>
        <el-button @click="traceabilityDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search, Refresh, Download, List, History, Cpu, Memory, HardDisk,
  Monitor, Warning, Connection, DataLine, TrendCharts, Bell, Clock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getServerMonitorPermission, validateServerMonitorParams,
  getServerMonitorRealtime, getServerMonitorHistory, getServerMonitorPeak,
  getServerMonitorStats, getServerMonitorAlertDetail, exportServerMonitorData,
  getServerMonitorTraceability, getServerList, getServerMonitorAlertTypeList,
  getServerMonitorAlertLevelList, getServerMonitorEnvironmentList,
  getServerMonitorApiLoadLevelList, getServerMonitorRiskLevelList
} from '@/api/log'
import type {
  ServerMonitor, ServerMonitorListParams,
  ServerMonitorStatsData, ServerMonitorTraceabilityResult, ServerMonitorAlertRecord,
  AlertLevel, AlertType, ApiLoadLevel, RiskLevel, ServerEnvironment
} from '@/types'

const ALERT_HISTORY_KEY = 'server_monitor_alert_history'

const hasPermission = ref(true)
const showPermissionShake = ref(false)
const apiConnected = ref(true)

const loading = ref(false)
const refreshing = ref(false)
const statsLoaded = ref(false)
const statsData = ref<ServerMonitorStatsData | null>(null)

const dataMode = ref<'realtime' | 'history' | 'peak'>('realtime')
const realtimeData = ref<ServerMonitor[]>([])
const historyData = ref<ServerMonitor[]>([])
const loadingHistory = ref(false)
const peakData = ref<ServerMonitor[]>([])
const peakStats = ref<{ cpu: number; memory: number; disk: number; network: number; api: number } | null>(null)
const loadingPeak = ref(false)

const filterForm = reactive<ServerMonitorListParams>({
  serverId: undefined,
  environment: undefined,
  alertType: undefined,
  alertLevel: undefined,
  startDate: undefined,
  endDate: undefined
})
const dateRange = ref<[string, string] | null>(null)

const serverList = ref<{ serverId: string; serverName: string; serverIp: string; environment: ServerEnvironment; region?: string }[]>([])
const alertTypeOptions = ref<{ value: string; label: string }[]>([])
const alertLevelOptions = ref<{ value: string; label: string }[]>([])
const environmentOptions = ref<{ value: string; label: string }[]>([])
const loadLevelOptions = ref<{ value: string; label: string }[]>([])
const riskLevelOptions = ref<{ value: string; label: string }[]>([])

const alertDetailVisible = ref(false)
const currentAlert = ref<ServerMonitor | null>(null)

const exportDialogVisible = ref(false)
const exportDateRange = ref<[string, string] | null>(null)
const exportForm = reactive({
  serverId: undefined as string | undefined,
  includeAlerts: true,
  format: 'json' as 'json' | 'csv'
})
const exporting = ref(false)
const exportProgress = ref(0)
const exportProcessed = ref(0)
const exportTotal = ref(0)
const exportFiltered = ref(0)

const traceabilityDialogVisible = ref(false)
const traceabilityTab = ref('resource')
const traceabilityResult = ref<ServerMonitorTraceabilityResult | null>(null)
const selectedServerId = ref<string>('')

const dateShortcuts = [
  { text: '最近1小时', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000); return [s, e] as [Date, Date] } },
  { text: '最近6小时', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 6); return [s, e] as [Date, Date] } },
  { text: '最近24小时', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24); return [s, e] as [Date, Date] } },
  { text: '最近7天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 7); return [s, e] as [Date, Date] } }
]

const peakIcons: Record<string, any> = {
  cpu: Cpu, memory: Memory, disk: HardDisk, network: DataLine, api: TrendCharts
}
const peakLabels: Record<string, string> = {
  cpu: 'CPU峰值', memory: '内存峰值', disk: '磁盘峰值', network: '网络峰值', api: '接口QPS峰值'
}
const peakTypeLabels: Record<string, string> = {
  none: '无', cpu: 'CPU峰值', memory: '内存峰值', disk: '磁盘峰值', network: '网络峰值', api: '接口峰值'
}

const statCards = computed(() => {
  if (!statsData.value) return []
  const s = statsData.value.summary
  const isAlert = (val: number) => val > 90
  return [
    { key: 'cpu', label: '平均CPU使用率', value: `${formatNumber(s.avgCpu.toFixed(1))}%`, icon: Cpu, isAlert: isAlert(s.avgCpu), alertRecord: null as any },
    { key: 'memory', label: '平均内存使用率', value: `${formatNumber(s.avgMemory.toFixed(1))}%`, icon: Memory, isAlert: isAlert(s.avgMemory), alertRecord: null as any },
    { key: 'disk', label: '平均磁盘使用率', value: `${formatNumber(s.avgDisk.toFixed(1))}%`, icon: HardDisk, isAlert: isAlert(s.avgDisk), alertRecord: null as any },
    { key: 'qps', label: '平均接口QPS', value: formatNumber(s.avgQps.toFixed(0)), icon: TrendCharts, isAlert: false, alertRecord: null as any },
    { key: 'records', label: '监控记录数', value: formatNumber(s.totalRecords), icon: List, isAlert: false, alertRecord: null as any },
    { key: 'alerts', label: '预警次数', value: formatNumber(s.alertCount), icon: Bell, isAlert: s.alertCount > 0, alertRecord: null as any }
  ]
})

const peakDisplayItems = computed(() => {
  if (!peakStats.value) return {}
  return {
    cpu: peakStats.value.cpu,
    memory: peakStats.value.memory,
    disk: peakStats.value.disk,
    network: peakStats.value.network,
    api: peakStats.value.api
  }
})

const formatNumber = (num: string | number): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return String(num)
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

const formatDateTime = (d: string): string => {
  if (!d) return '-'
  return d.replace('T', ' ').substring(0, 19)
}

const getEnvLabel = (env: ServerEnvironment): string => {
  const map: Record<ServerEnvironment, string> = {
    production: '生产环境', staging: '预发布环境', testing: '测试环境', development: '开发环境'
  }
  return map[env] || env
}

const getEnvTagType = (env: ServerEnvironment): string => {
  const map: Record<ServerEnvironment, string> = {
    production: 'danger', staging: 'warning', testing: 'primary', development: 'info'
  }
  return map[env] || 'info'
}

const getAlertTypeLabel = (type: AlertType): string => {
  const map: Record<AlertType, string> = {
    none: '无', cpu: 'CPU预警', memory: '内存预警', disk: '磁盘预警',
    network: '网络预警', api: '接口预警', system: '系统预警'
  }
  return map[type] || type
}

const getAlertLevelLabel = (level: AlertLevel): string => {
  const map: Record<AlertLevel, string> = {
    none: '无', info: '提示', warning: '警告', critical: '严重'
  }
  return map[level] || level
}

const getAlertLevelTagType = (level: AlertLevel): string => {
  const map: Record<AlertLevel, string> = {
    none: 'info', info: 'info', warning: 'warning', critical: 'danger'
  }
  return map[level] || 'info'
}

const getLoadLevelLabel = (level: ApiLoadLevel): string => {
  const map: Record<ApiLoadLevel, string> = {
    low: '低负载', normal: '正常', medium: '中负载', high: '高负载', overload: '过载'
  }
  return map[level] || level
}

const getLoadLevelTagType = (level: ApiLoadLevel): string => {
  const map: Record<ApiLoadLevel, string> = {
    low: 'success', normal: 'success', medium: 'warning', high: 'warning', overload: 'danger'
  }
  return map[level] || 'info'
}

const getRiskLevelLabel = (level: RiskLevel): string => {
  const map: Record<RiskLevel, string> = {
    none: '无风险', low: '低风险', medium: '中风险', high: '高风险', critical: '严重风险'
  }
  return map[level] || level
}

const saveAlertHistory = (record: ServerMonitor) => {
  try {
    const history: ServerMonitorAlertRecord[] = JSON.parse(localStorage.getItem(ALERT_HISTORY_KEY) || '[]')
    const alertRecord: ServerMonitorAlertRecord = {
      id: `ALERT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      recordId: record.id,
      serverId: record.serverId,
      serverName: record.serverName,
      alertType: record.alertType,
      alertLevel: record.alertLevel,
      alertMessage: record.alertMessage,
      viewedAt: new Date().toISOString()
    }
    history.unshift(alertRecord)
    if (history.length > 100) history.length = 100
    localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('保存预警记录失败', e)
  }
}

const checkPermission = async () => {
  try {
    const res = await getServerMonitorPermission()
    hasPermission.value = res.data.canViewMonitor
    if (!hasPermission.value) {
      showPermissionShake.value = true
      setTimeout(() => { showPermissionShake.value = false }, 500)
    }
  } catch (e) {
    hasPermission.value = false
  }
}

const fetchOptions = async () => {
  try {
    const [servers, types, levels, envs, loads, risks] = await Promise.all([
      getServerList(),
      getServerMonitorAlertTypeList(),
      getServerMonitorAlertLevelList(),
      getServerMonitorEnvironmentList(),
      getServerMonitorApiLoadLevelList(),
      getServerMonitorRiskLevelList()
    ])
    serverList.value = servers.data
    alertTypeOptions.value = types.data
    alertLevelOptions.value = levels.data
    environmentOptions.value = envs.data
    loadLevelOptions.value = loads.data
    riskLevelOptions.value = risks.data
  } catch (e) {
    console.error('获取选项失败', e)
  }
}

const fetchRealtime = async () => {
  try {
    const res = await getServerMonitorRealtime({
      serverIds: filterForm.serverId,
      environment: filterForm.environment
    })
    realtimeData.value = res.data.data
    apiConnected.value = res.data.connectivity.connected
    if (!apiConnected.value) {
      ElMessage.warning('监控接口连接异常')
    }
  } catch (e) {
    apiConnected.value = false
    console.error('获取实时数据失败', e)
  }
}

const fetchHistory = async () => {
  loadingHistory.value = true
  try {
    const params: any = { serverId: filterForm.serverId || serverList.value[0]?.serverId || '' }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getServerMonitorHistory(params)
    historyData.value = res.data.data
  } catch (e) {
    console.error('获取历史数据失败', e)
  } finally {
    loadingHistory.value = false
  }
}

const fetchPeak = async () => {
  loadingPeak.value = true
  try {
    const params: any = { serverId: filterForm.serverId || undefined }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getServerMonitorPeak(params)
    peakData.value = res.data.data
    peakStats.value = res.data.peakStats
  } catch (e) {
    console.error('获取峰值数据失败', e)
  } finally {
    loadingPeak.value = false
  }
}

const fetchStats = async () => {
  try {
    const params: any = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (filterForm.environment) params.environment = filterForm.environment
    if (filterForm.serverId) params.serverId = filterForm.serverId
    const res = await getServerMonitorStats(params)
    statsData.value = res.data
    statsLoaded.value = true
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

const validateParams = async (): Promise<boolean> => {
  try {
    const params: ServerMonitorListParams = { ...filterForm }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await validateServerMonitorParams(params)
    if (!res.data.valid && res.data.errors.length > 0) {
      ElMessage.warning(res.data.errors[0])
      return false
    }
    return true
  } catch (e) {
    return true
  }
}

const handleSearch = async () => {
  if (!(await validateParams())) return
  loading.value = true
  try {
    await Promise.all([fetchRealtime(), fetchHistory(), fetchPeak(), fetchStats()])
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([fetchRealtime(), fetchStats()])
    if (dataMode.value === 'history') await fetchHistory()
    if (dataMode.value === 'peak') await fetchPeak()
    ElMessage.success('数据刷新成功')
  } catch (e) {
    ElMessage.error('数据刷新失败')
  } finally {
    setTimeout(() => { refreshing.value = false }, 600)
  }
}

const viewAlertDetail = async (row: ServerMonitor) => {
  saveAlertHistory(row)
  try {
    const res = await getServerMonitorAlertDetail(row.id)
    currentAlert.value = res.data
    alertDetailVisible.value = true
  } catch (e) {
    currentAlert.value = row
    alertDetailVisible.value = true
  }
}

const openExportDialog = () => {
  exportDateRange.value = dateRange.value
  exportForm.serverId = filterForm.serverId
  exporting.value = false
  exportProgress.value = 0
  exportDialogVisible.value = true
}

const handleExport = async () => {
  if (!exportDateRange.value || exportDateRange.value.length !== 2) {
    ElMessage.warning('请选择导出的时间范围')
    return
  }
  exporting.value = true
  exportProgress.value = 0
  exportProcessed.value = 0
  try {
    for (let i = 10; i <= 90; i += 10) {
      await new Promise(r => setTimeout(r, 100))
      exportProgress.value = i
    }
    const params = {
      startDate: exportDateRange.value[0],
      endDate: exportDateRange.value[1],
      serverId: exportForm.serverId,
      includeAlerts: exportForm.includeAlerts,
      format: exportForm.format
    }
    const res = await exportServerMonitorData(params)
    exportProgress.value = 100
    exportTotal.value = res.data.exportInfo.totalRecords
    exportProcessed.value = res.data.exportInfo.validRecords
    exportFiltered.value = res.data.exportInfo.emptyRecords

    let content: string
    let mimeType: string
    let extension: string

    if (exportForm.format === 'csv') {
      const headers = ['ID', '服务器', 'IP', '环境', 'CPU%', '内存%', '磁盘%', 'QPS', '预警', '时间']
      const rows = res.data.data.map(item => [
        item.id, item.serverName, item.serverIp, getEnvLabel(item.environment),
        item.cpuUsage, item.memoryUsage, item.diskUsage, item.apiQps,
        item.hasAlert ? `${getAlertTypeLabel(item.alertType)}:${item.alertMessage || ''}` : '无',
        formatDateTime(item.createdAt)
      ])
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      mimeType = 'text/csv;charset=utf-8'
      extension = 'csv'
    } else {
      content = JSON.stringify(res.data, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    }

    const blob = new Blob(['\ufeff' + content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `server_monitor_${Date.now()}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success(`导出成功，有效数据 ${res.data.exportInfo.validRecords} 条`)
    setTimeout(() => { exportDialogVisible.value = false; exporting.value = false }, 1000)
  } catch (e: any) {
    ElMessage.error(e.message || '导出失败')
    exporting.value = false
  }
}

const openTraceabilityDialog = async () => {
  if (serverList.value.length > 0) {
    selectedServerId.value = serverList.value[0].serverId
    await fetchTraceability()
  }
  traceabilityDialogVisible.value = true
}

const fetchTraceability = async () => {
  if (!selectedServerId.value) return
  try {
    const params: any = { serverId: selectedServerId.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getServerMonitorTraceability(params)
    traceabilityResult.value = res.data
  } catch (e) {
    console.error('获取溯源数据失败', e)
  }
}

onMounted(async () => {
  await checkPermission()
  if (hasPermission.value) {
    await fetchOptions()
    await Promise.all([fetchRealtime(), fetchHistory(), fetchPeak(), fetchStats()])
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.server-monitor-page {
  position: relative;

  .permission-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border-radius: $border-radius-large;

    .permission-content {
      background: $bg-color-ffffff;
      border-radius: $border-radius-large;
      padding: 48px 64px;
      text-align: center;
      box-shadow: $shadow-heavy;

      .permission-title {
        font-size: 20px;
        font-weight: 600;
        color: $danger-color;
        margin: 16px 0 8px;
      }

      .permission-desc {
        font-size: $font-size-base;
        color: $text-regular;
        margin-bottom: 8px;
      }

      .permission-hint {
        font-size: $font-size-small;
        color: $text-secondary;
      }
    }

    .shake-animation {
      animation: shake 0.5s ease-in-out;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .api-warning {
    margin-bottom: 16px;
  }

  .stats-section {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .stat-card, .monitor-card {
    background: $bg-color-ffffff;
    border-radius: $border-radius-large;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: $shadow-light;
    transition: all 0.3s ease;
    border: 1px solid $border-color-extra-light;
    position: relative;
    outline: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-medium;
    }

    &:focus-within {
      box-shadow: 0 0 8px rgba(64, 158, 255, 0.6);
      border-color: #409eff;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #fff;

      &.stat-cpu { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.stat-memory { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.stat-disk { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      &.stat-qps { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
      &.stat-records { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
      &.stat-alerts { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); }
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 26px;
        font-weight: 600;
        color: $text-primary;
        line-height: 1.2;

        &.blink-warning {
          animation: blinkWarning 1s infinite;
          color: $danger-color;
        }
      }

      .stat-label {
        font-size: $font-size-small;
        color: $text-secondary;
        margin-top: 4px;
      }
    }

    .alert-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: $danger-color;
      color: #fff;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: $font-size-extra-small;
      display: flex;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      animation: blinkWarning 1.5s infinite;
    }
  }

  @keyframes blinkWarning {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .ripple-animation {
    animation: ripple 0.6s ease-out;
  }

  @keyframes ripple {
    0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4); }
    100% { box-shadow: 0 0 0 15px rgba(64, 158, 255, 0); }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .tabs-card {
    .monitor-tabs {
      .tab-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }
    }

    .realtime-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .realtime-card {
      flex-direction: column;
      align-items: stretch;
      padding: 16px;

      &.has-alert {
        border-color: $danger-color;
        background: rgba(245, 108, 108, 0.02);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .server-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: $text-primary;

          .el-icon {
            color: $primary-color;
          }

          .el-tag {
            margin-left: 6px;
          }
        }

        .server-ip {
          font-size: $font-size-small;
          color: $text-secondary;
          font-family: monospace;
        }
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 12px;

        .metric-item {
          padding: 12px;
          background: $bg-color-page;
          border-radius: $border-radius;

          &.is-warning {
            background: rgba(245, 108, 108, 0.06);
          }

          .metric-header {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: $font-size-small;
            color: $text-secondary;
            margin-bottom: 8px;
          }

          .metric-value {
            font-size: $font-size-base;
            font-weight: 600;
            color: $text-primary;
            margin-top: 4px;

            &.blink-warning {
              animation: blinkWarning 1s infinite;
              color: $danger-color;
            }
          }
        }
      }

      .alert-info {
        margin-bottom: 12px;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid $border-color-extra-light;
        font-size: $font-size-small;
        color: $text-secondary;
      }
    }

    .peak-summary {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;

      .peak-card {
        flex-direction: row;
        padding: 16px;

        .peak-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          color: #fff;

          &.peak-cpu { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          &.peak-memory { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          &.peak-disk { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
          &.peak-network { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
          &.peak-api { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        }

        .peak-info {
          .peak-label {
            font-size: $font-size-small;
            color: $text-secondary;
            margin-bottom: 2px;
          }

          .peak-value {
            font-size: 22px;
            font-weight: 600;
            color: $text-primary;

            &.blink-warning {
              animation: blinkWarning 1s infinite;
            }
          }
        }
      }
    }
  }

  .text-danger {
    color: $danger-color;
  }

  .alert-detail-dialog {
    .alert-detail {
      .alert-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: $border-radius;
        margin-bottom: 8px;

        &.level-critical {
          background: rgba(245, 108, 108, 0.1);
          color: $danger-color;
        }

        &.level-warning {
          background: rgba(230, 162, 60, 0.1);
          color: $warning-color;
        }

        &.level-info {
          background: rgba(64, 158, 255, 0.1);
          color: $primary-color;
        }

        &.level-none {
          background: $bg-color-page;
          color: $text-primary;
        }

        .alert-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .alert-server {
          font-size: $font-size-small;
          opacity: 0.8;
        }
      }

      .section-title {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin: 20px 0 12px;
        padding-left: 10px;
        border-left: 3px solid $primary-color;
      }

      .alert-metrics {
        .metric-box {
          background: $bg-color-page;
          padding: 16px;
          border-radius: $border-radius;
          text-align: center;

          .metric-label {
            font-size: $font-size-small;
            color: $text-secondary;
            margin-bottom: 6px;
          }

          .metric-num {
            font-size: 22px;
            font-weight: 600;
            color: $text-primary;
          }
        }
      }

      .anomaly-period {
        margin-top: 16px;
      }
    }
  }

  .export-dialog {
    .export-progress {
      margin-top: 16px;

      .progress-text {
        margin-top: 8px;
        font-size: $font-size-small;
        color: $text-secondary;
        text-align: center;

        .filtered-text {
          color: $warning-color;
          margin-left: 8px;
        }
      }
    }
  }

  .traceability-dialog {
    .traceability-content {
      .section-title {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 12px;
        padding-left: 10px;
        border-left: 3px solid $primary-color;
      }

      .sub-title {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-regular;
        margin-bottom: 12px;
      }

      .server-overview {
        margin-bottom: 16px;
      }

      .traceability-tabs {
        margin-top: 8px;
      }

      .analysis-card {
        flex-direction: column;
        align-items: stretch;
        padding: 16px;
        height: 100%;

        .card-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: $font-size-base;
          font-weight: 600;
          color: $text-primary;
          margin: 0 0 12px;

          .el-icon {
            color: $primary-color;
          }
        }
      }

      .overall-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .suggestion-item {
        background: $bg-color-page;
        padding: 16px;
        border-radius: $border-radius;
        margin-bottom: 12px;
        border-left: 3px solid $primary-color;

        .suggestion-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;

          .suggestion-category {
            color: $text-secondary;
            font-weight: 500;
          }

          .suggestion-title {
            font-weight: 600;
            color: $text-primary;
          }
        }

        .suggestion-desc {
          font-size: $font-size-base;
          color: $text-regular;
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .suggestion-action {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: $font-size-small;
          color: $primary-color;

          .el-icon {
            color: $primary-color;
          }
        }
      }

      .server-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: auto;
      }
    }
  }

  .no-alert {
    color: $text-secondary;
  }

  .table-wrapper {
    width: 100%;
  }

  .card-wrapper {
    background: $bg-color-ffffff;
    border-radius: $border-radius-large;
    padding: 16px;
    box-shadow: $shadow-light;
    margin-bottom: 16px;
  }
}
</style>