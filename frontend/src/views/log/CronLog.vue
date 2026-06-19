<template>
  <div class="cron-log-page">
    <div class="stats-section" v-if="statsLoaded">
      <div class="stat-card stat-card-zoom" v-for="item in statCards" :key="item.key">
        <div class="stat-icon" :class="`stat-${item.key}`">
          <el-icon :size="24"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form" ref="filterFormRef">
        <el-form-item label="任务名称" prop="taskName" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-input v-model="filterForm.taskName" placeholder="任务名称" clearable style="width: 160px"
              class="focus-zoom"
              @focus="handleFieldFocus('taskName')" @blur="handleFieldBlur('taskName')" @change="handleFieldChange('taskName')" />
            <span v-if="fieldValid.taskName" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-select v-model="filterForm.taskType" placeholder="全部" clearable style="width: 140px"
              class="focus-zoom"
              @focus="handleFieldFocus('taskType')" @blur="handleFieldBlur('taskType')" @change="handleFieldChange('taskType')">
              <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <span v-if="fieldValid.taskType" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="执行状态" prop="executeStatus" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-select v-model="filterForm.executeStatus" placeholder="全部" clearable style="width: 140px"
              class="focus-zoom"
              @focus="handleFieldFocus('executeStatus')" @blur="handleFieldBlur('executeStatus')" @change="handleFieldChange('executeStatus')">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <span v-if="fieldValid.executeStatus" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="触发类型" prop="triggerType" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-select v-model="filterForm.triggerType" placeholder="全部" clearable style="width: 130px"
              class="focus-zoom"
              @focus="handleFieldFocus('triggerType')" @blur="handleFieldBlur('triggerType')" @change="handleFieldChange('triggerType')">
              <el-option v-for="item in triggerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <span v-if="fieldValid.triggerType" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="任务分组" prop="taskGroup" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-select v-model="filterForm.taskGroup" placeholder="全部" clearable style="width: 130px"
              class="focus-zoom"
              @focus="handleFieldFocus('taskGroup')" @blur="handleFieldBlur('taskGroup')" @change="handleFieldChange('taskGroup')">
              <el-option v-for="item in taskGroupOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <span v-if="fieldValid.taskGroup" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="时间区间" prop="dateRange" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
              :shortcuts="dateShortcuts" style="width: 280px"
              class="focus-zoom"
              @focus="handleFieldFocus('dateRange')" @blur="handleFieldBlur('dateRange')" @change="handleFieldChange('dateRange')" />
            <span v-if="fieldValid.dateRange" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="最低耗时(ms)" prop="minDuration" class="focus-zoom-wrap">
          <div class="field-with-check">
            <el-input v-model="filterForm.minDuration" placeholder="ms" clearable style="width: 120px" type="number"
              class="focus-zoom"
              @focus="handleFieldFocus('minDuration')" @blur="handleFieldBlur('minDuration')" @change="handleFieldChange('minDuration')" />
            <span v-if="fieldValid.minDuration" class="valid-check">✓</span>
          </div>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="搜索关键词" clearable style="width: 180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="warning" :icon="DataAnalysis" @click="openBatchStatsDialog">批量统计</el-button>
          <el-button type="danger" :icon="Warning" @click="openTraceabilityDrawer">异常溯源</el-button>
        </el-form-item>
      </el-form>
      <div class="filter-warnings" v-if="warnings.length > 0">
        <el-alert v-for="(warning, idx) in warnings" :key="idx" :title="warning" type="warning" :closable="false" show-icon style="margin-bottom: 8px" />
      </div>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-header">
        <div class="table-title">
          <el-icon><List /></el-icon>
          <span>定时任务日志列表</span>
          <el-tag type="info" size="small" style="margin-left: 8px">共 {{ total }} 条</el-tag>
        </div>
        <div class="table-actions">
          <el-tooltip content="查看记录">
            <el-button :icon="History" circle @click="showViewHistory = true" />
          </el-tooltip>
        </div>
      </div>

      <div class="table-wrapper" ref="tableWrapperRef" @scroll="handleTableScroll">
        <el-table ref="tableRef" :data="tableData" v-loading="loading" height="100%"
          stripe border @row-dblclick="viewDetail" class="cron-table alternating-row">
          <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
          <el-table-column prop="taskName" label="任务名称" min-width="180" show-overflow-tooltip fixed="left" />
          <el-table-column prop="taskTypeLabel" label="任务类型" width="110" align="center" show-overflow-tooltip />
          <el-table-column label="执行状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.executeStatus)" size="small" :class="{ 'running-pulse': row.executeStatus === 'running' }">
                {{ row.executeStatusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="triggerTypeLabel" label="触发类型" width="100" align="center" show-overflow-tooltip />
          <el-table-column label="耗时" width="110" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <span :class="{ 'slow-duration': row.duration >= row.timeoutThreshold }">{{ formatDuration(row.duration) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" width="170" align="center" show-overflow-tooltip>
            <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
          </el-table-column>
          <el-table-column label="重试次数" width="90" align="center">
            <template #default="{ row }">
              <span :class="{ 'retry-warning': row.retryCount > 0 }">{{ row.retryCount }}/{{ row.maxRetries }}</span>
            </template>
          </el-table-column>
          <el-table-column label="异常标记" width="120" align="center">
            <template #default="{ row }">
              <div class="anomaly-tags">
                <el-tag v-if="row.isDuplicate" type="warning" size="small" effect="dark">重复</el-tag>
                <el-tag v-if="row.isOvertime" type="danger" size="small" effect="dark">超时</el-tag>
                <el-tag v-if="row.isMissed" type="info" size="small" effect="dark">漏执行</el-tag>
                <span v-if="!row.isDuplicate && !row.isOvertime && !row.isMissed" class="no-anomaly">-</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="View" @click="viewDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="back-to-top" v-show="showBackToTop" @click="scrollToTop">
          <el-icon :size="20"><Top /></el-icon>
        </div>
      </div>

      <div class="table-pagination">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20, 50, 100, 200]"
          :total="total" layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" :title="`任务详情 #${currentLog?.id || ''}`" width="900px"
      custom-class="zoom-fade-in-dialog" :close-on-click-modal="false" @close="closeDetailDialog">
      <div v-if="currentLog" class="cron-detail">
        <el-steps :active="detailStep" finish-status="success" simple style="margin-bottom: 24px">
          <el-step title="基本信息" />
          <el-step title="执行结果" />
          <el-step title="重试记录" />
          <el-step title="资源使用" />
        </el-steps>

        <div v-show="detailStep === 0" class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
            <el-descriptions-item label="任务名称">{{ currentLog.taskName }}</el-descriptions-item>
            <el-descriptions-item label="任务类型">
              <el-tag size="small">{{ currentLog.taskTypeLabel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="任务分组">{{ currentLog.taskGroup || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Cron表达式">
              <span class="cron-expression">{{ currentLog.cronExpression || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="触发类型">{{ currentLog.triggerTypeLabel }}</el-descriptions-item>
            <el-descriptions-item label="触发人">{{ currentLog.triggerBy || '-' }}</el-descriptions-item>
            <el-descriptions-item label="服务器">{{ currentLog.serverName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="进程ID">{{ currentLog.processId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDateTime(currentLog.startedAt) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDateTime(currentLog.finishedAt) }}</el-descriptions-item>
            <el-descriptions-item label="执行耗时">{{ formatDuration(currentLog.duration) }}</el-descriptions-item>
            <el-descriptions-item label="超时阈值">{{ formatDuration(currentLog.timeoutThreshold) }}</el-descriptions-item>
            <el-descriptions-item label="影响行数">{{ currentLog.affectRows ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="任务配置有效">
              <el-tag :type="currentLog.isTaskValid ? 'success' : 'danger'" size="small">{{ currentLog.isTaskValid ? '有效' : '无效' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="无效原因" v-if="!currentLog.isTaskValid" :span="2">
              <span class="error-highlight-inline">{{ currentLog.invalidReason || '-' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-show="detailStep === 1" class="detail-section">
          <h4 class="section-title">执行结果</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行状态">
              <el-tag :type="getStatusTagType(currentLog.executeStatus)" size="small">{{ currentLog.executeStatusLabel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行耗时">{{ formatDuration(currentLog.duration) }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="currentLog.executeResult" class="json-section">
            <h5 class="sub-title">执行结果数据</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.executeResult, null, 2) }}</pre></div>
          </div>
          <div v-if="currentLog.executeStatus === 'failed' || currentLog.executeStatus === 'timeout'" class="error-section">
            <div class="error-highlight">
              <div class="error-title">
                <el-icon color="#ff9800"><Warning /></el-icon>
                <span>{{ currentLog.executeStatus === 'timeout' ? '超时错误' : '执行失败' }}</span>
              </div>
              <div class="error-message" v-if="currentLog.errorMessage">{{ currentLog.errorMessage }}</div>
              <div class="error-stack" v-if="currentLog.errorStack">
                <pre>{{ currentLog.errorStack }}</pre>
              </div>
            </div>
            <div v-if="currentLog.defaultRetryStrategy" class="retry-strategy-section">
              <h5 class="sub-title">系统默认重试策略</h5>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="最大重试次数">{{ currentLog.defaultRetryStrategy.maxRetries }}</el-descriptions-item>
                <el-descriptions-item label="重试策略">{{ currentLog.defaultRetryStrategy.strategyLabel }}</el-descriptions-item>
                <el-descriptions-item label="重试间隔" :span="2">{{ currentLog.defaultRetryStrategy.intervals?.join(', ') || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
          <el-empty v-if="!currentLog.executeResult && currentLog.executeStatus !== 'failed' && currentLog.executeStatus !== 'timeout'" description="无执行结果数据" />
        </div>

        <div v-show="detailStep === 2" class="detail-section">
          <h4 class="section-title">重试记录</h4>
          <el-descriptions :column="2" border style="margin-bottom: 16px">
            <el-descriptions-item label="重试次数">{{ currentLog.retryCount }}</el-descriptions-item>
            <el-descriptions-item label="最大重试">{{ currentLog.maxRetries }}</el-descriptions-item>
            <el-descriptions-item label="重试策略">{{ currentLog.retryStrategyLabel }}</el-descriptions-item>
            <el-descriptions-item label="下次重试">{{ formatDateTime(currentLog.nextRetryAt) }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="currentLog.retryRecords && currentLog.retryRecords.length > 0" class="retry-records">
            <el-table :data="currentLog.retryRecords" size="small" border>
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="retryAt" label="重试时间" width="170" align="center">
                <template #default="{ row }">{{ formatDateTime(row.retryAt) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">{{ row.statusLabel || row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="耗时" width="100" align="center">
                <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
              </el-table-column>
              <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
          <el-empty v-else description="无重试记录" />
        </div>

        <div v-show="detailStep === 3" class="detail-section">
          <h4 class="section-title">资源使用</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="CPU使用率">
              <span :class="{ 'resource-high': currentLog.cpuUsage > 80 }">{{ currentLog.cpuUsage ? `${currentLog.cpuUsage}%` : '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="内存使用">
              <span :class="{ 'resource-high': currentLog.memoryUsage > 80 }">{{ currentLog.memoryUsage ? formatMemory(currentLog.memoryUsage) : '-' }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="currentLog.diskIo" class="json-section">
            <h5 class="sub-title">磁盘IO</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.diskIo, null, 2) }}</pre></div>
          </div>
          <div v-if="currentLog.networkIo" class="json-section">
            <h5 class="sub-title">网络IO</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.networkIo, null, 2) }}</pre></div>
          </div>
          <div v-if="currentLog.taskConfig" class="json-section">
            <h5 class="sub-title">任务配置</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.taskConfig, null, 2) }}</pre></div>
          </div>
          <div v-if="currentLog.outputData" class="json-section">
            <h5 class="sub-title">输出数据</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.outputData, null, 2) }}</pre></div>
          </div>
          <el-empty v-if="!currentLog.cpuUsage && !currentLog.memoryUsage && !currentLog.diskIo && !currentLog.networkIo && !currentLog.taskConfig" description="无资源使用数据" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="detailStep > 0" @click="detailStep--">上一步</el-button>
          <el-button v-if="detailStep < 3" type="primary" @click="detailStep++">下一步</el-button>
          <el-button @click="closeDetailDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="batchStatsDialogVisible" title="批量统计" width="1100px" custom-class="zoom-fade-in-dialog" @close="closeBatchStatsDialog">
      <div v-if="batchStatsData" class="batch-stats-content">
        <div class="period-selector">
          <el-radio-group v-model="batchStatsPeriod" @change="fetchBatchStats">
            <el-radio-button value="daily">按天</el-radio-button>
            <el-radio-button value="weekly">按周</el-radio-button>
            <el-radio-button value="monthly">按月</el-radio-button>
          </el-radio-group>
        </div>
        <div class="batch-summary">
          <div class="stat-card stat-card-zoom" v-for="item in batchSummaryCards" :key="item.key">
            <div class="stat-icon" :class="`stat-${item.key}`">
              <el-icon :size="20"><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
        <div class="chart-section">
          <h4 class="section-title">趋势数据</h4>
          <el-table :data="batchStatsData.chartData" size="small" border stripe class="alternating-row">
            <el-table-column prop="period" label="周期" width="140" align="center" />
            <el-table-column prop="total" label="总任务" width="90" align="center" />
            <el-table-column prop="success" label="成功" width="80" align="center">
              <template #default="{ row }"><span style="color: #67c23a">{{ row.success }}</span></template>
            </el-table-column>
            <el-table-column prop="failed" label="失败" width="80" align="center">
              <template #default="{ row }"><span style="color: #f56c6c">{{ row.failed }}</span></template>
            </el-table-column>
            <el-table-column prop="timeout" label="超时" width="80" align="center">
              <template #default="{ row }"><span style="color: #e6a23c">{{ row.timeout }}</span></template>
            </el-table-column>
            <el-table-column label="成功率" width="100" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.successRate" :stroke-width="6" :color="row.successRate >= 90 ? '#67c23a' : row.successRate >= 70 ? '#e6a23c' : '#f56c6c'" />
              </template>
            </el-table-column>
            <el-table-column prop="taskCount" label="任务数" width="90" align="center" />
          </el-table>
        </div>
        <div class="breakdown-section" v-if="batchStatsData.taskBreakdown.length > 0">
          <h4 class="section-title">任务分解</h4>
          <el-table :data="batchStatsData.taskBreakdown" size="small" border stripe class="alternating-row">
            <el-table-column prop="taskName" label="任务名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="total" label="总次数" width="90" align="center" />
            <el-table-column prop="success" label="成功" width="80" align="center" />
            <el-table-column prop="failed" label="失败" width="80" align="center" />
            <el-table-column prop="timeout" label="超时" width="80" align="center" />
            <el-table-column label="平均耗时" width="110" align="center">
              <template #default="{ row }">{{ formatDuration(row.avgDuration) }}</template>
            </el-table-column>
            <el-table-column label="成功率" width="100" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.successRate" :stroke-width="6" :color="row.successRate >= 90 ? '#67c23a' : row.successRate >= 70 ? '#e6a23c' : '#f56c6c'" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <el-drawer v-model="traceabilityDrawerVisible" title="异常溯源分析" direction="rtl" size="720px" class="traceability-drawer">
      <div v-if="traceabilityResult" class="traceability-content">
        <div class="anomaly-stats-section">
          <h4 class="section-title">异常统计</h4>
          <div class="anomaly-overview-cards">
            <div class="stat-card stat-card-zoom" v-for="item in anomalyOverviewCards" :key="item.key">
              <div class="stat-icon" :class="`stat-${item.key}`">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ item.value }}</div>
                <div class="stat-label">{{ item.label }}</div>
              </div>
            </div>
          </div>
          <el-table v-if="traceabilityResult.statistics.byAnomalyType.length > 0" :data="traceabilityResult.statistics.byAnomalyType" size="small" border stripe class="alternating-row" style="margin-top: 16px">
            <el-table-column prop="label" label="异常类型" min-width="120" show-overflow-tooltip />
            <el-table-column prop="count" label="数量" width="100" align="center" />
          </el-table>
        </div>

        <div class="resource-analysis-section">
          <h4 class="section-title">资源分析</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="高资源占用数">{{ traceabilityResult.resourceAnalysis.highResourceCount }}</el-descriptions-item>
            <el-descriptions-item label="平均CPU使用率">{{ traceabilityResult.resourceAnalysis.avgCpuUsage?.toFixed(1) || 0 }}%</el-descriptions-item>
            <el-descriptions-item label="平均内存使用">{{ formatMemory(traceabilityResult.resourceAnalysis.avgMemoryUsage) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="config-analysis-section" v-if="traceabilityResult.configAnalysis.length > 0">
          <h4 class="section-title">配置分析</h4>
          <el-table :data="traceabilityResult.configAnalysis" size="small" border stripe class="alternating-row">
            <el-table-column prop="taskName" label="任务名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="配置有效" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.configValid ? 'success' : 'danger'" size="small">{{ row.configValid ? '有效' : '无效' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="invalidReason" label="无效原因" min-width="160" show-overflow-tooltip />
            <el-table-column prop="cronExpression" label="Cron表达式" width="120" show-overflow-tooltip />
            <el-table-column label="超时阈值" width="100" align="center">
              <template #default="{ row }">{{ formatDuration(row.timeoutThreshold) }}</template>
            </el-table-column>
            <el-table-column prop="maxRetries" label="最大重试" width="90" align="center" />
          </el-table>
        </div>

        <div class="optimization-section" v-if="traceabilityResult.optimizationSuggestions.length > 0">
          <h4 class="section-title">优化建议</h4>
          <div class="suggestion-list">
            <div v-for="(suggestion, idx) in traceabilityResult.optimizationSuggestions" :key="idx" class="suggestion-item">
              <div class="suggestion-header">
                <el-tag :type="getPriorityTagType(suggestion.priority)" size="small">{{ getPriorityLabel(suggestion.priority) }}</el-tag>
                <span class="suggestion-type">{{ suggestion.type }}</span>
                <span class="suggestion-count">x{{ suggestion.count }}</span>
              </div>
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-desc">{{ suggestion.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="showViewHistory" title="查看记录" direction="rtl" size="380px" class="view-history-drawer">
      <div v-if="viewHistory.length === 0" class="empty-history"><el-empty description="暂无查看记录" /></div>
      <div v-else class="history-list">
        <div v-for="record in viewHistory" :key="record.id" class="history-item" @click="quickViewById(record)">
          <div class="history-header">
            <span class="history-time">{{ formatDateTime(record.viewedAt) }}</span>
            <el-tag :type="getStatusTagType(record.executeStatus)" size="small">{{ record.executeStatus }}</el-tag>
          </div>
          <div class="history-title">{{ record.taskName }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh, DataAnalysis, View, List, History, Timer, Warning, Top } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  getCronLogList, getCronLogDetail, getCronLogStats,
  getCronLogBatchStats, getCronLogTraceability, getCronTaskTypeList,
  getCronStatusList, getCronTriggerTypeList, getCronTaskGroupList
} from '@/api/log'
import type {
  CronLog, CronLogListParams, CronLogStatsData, CronLogBatchStatsData,
  CronLogTraceabilityResult, CronLogOption, CronLogViewRecord
} from '@/types'
import dayjs from 'dayjs'

const HISTORY_STORAGE_KEY = 'cron_log_view_history'
const MAX_HISTORY = 20

const loading = ref(false)
const tableData = ref<CronLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<[string, string] | null>(null)
const warnings = ref<string[]>([])
const statsLoaded = ref(false)
const stats = ref<CronLogStatsData>({
  totalCount: 0, successCount: 0, failedCount: 0, timeoutCount: 0, runningCount: 0,
  anomalyCounts: { duplicate: 0, missed: 0, overtime: 0 },
  successRate: 0, failureRate: 0, todayCount: 0, todaySuccessRate: 0,
  avgDuration: 0, maxDuration: 0,
  byType: [], byStatus: [], last7Days: [], topFailedTasks: []
})

const filterFormRef = ref<FormInstance>()
const filterForm = reactive<CronLogListParams>({
  page: 1, pageSize: 20,
  taskName: undefined, taskType: undefined, taskGroup: undefined,
  executeStatus: undefined, triggerType: undefined,
  minDuration: undefined, keyword: undefined,
  startDate: undefined, endDate: undefined
})

const focusedField = ref<string | null>(null)
const fieldValid = reactive<Record<string, boolean>>({
  taskName: false, taskType: false, executeStatus: false,
  triggerType: false, taskGroup: false, dateRange: false, minDuration: false
})

const dateShortcuts = [
  { text: '最近7天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 7); return [s, e] as [Date, Date] } },
  { text: '最近30天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 30); return [s, e] as [Date, Date] } }
]

const taskTypeOptions = ref<CronLogOption[]>([])
const statusOptions = ref<CronLogOption[]>([])
const triggerTypeOptions = ref<CronLogOption[]>([])
const taskGroupOptions = ref<CronLogOption[]>([])

const statCards = computed(() => [
  { key: 'total', label: '总任务数', value: stats.value.totalCount, icon: List },
  { key: 'success', label: '成功率', value: `${stats.value.successRate.toFixed(1)}%`, icon: DataAnalysis },
  { key: 'today', label: '今日执行', value: stats.value.todayCount, icon: Timer },
  { key: 'avg', label: '平均耗时', value: formatDuration(stats.value.avgDuration), icon: History }
])

const detailDialogVisible = ref(false)
const detailStep = ref(0)
const currentLog = ref<CronLog | null>(null)

const batchStatsDialogVisible = ref(false)
const batchStatsPeriod = ref('daily')
const batchStatsData = ref<CronLogBatchStatsData | null>(null)

const batchSummaryCards = computed(() => {
  if (!batchStatsData.value) return []
  const s = batchStatsData.value.summary
  return [
    { key: 'periods', label: '统计周期数', value: s.totalPeriods, icon: Timer },
    { key: 'success', label: '整体成功率', value: `${s.overallSuccessRate.toFixed(1)}%`, icon: DataAnalysis },
    { key: 'normal', label: '正常任务', value: s.normalTaskCount, icon: List },
    { key: 'abnormal', label: '异常任务', value: s.abnormalTaskCount, icon: Warning }
  ]
})

const traceabilityDrawerVisible = ref(false)
const traceabilityResult = ref<CronLogTraceabilityResult | null>(null)

const anomalyOverviewCards = computed(() => {
  if (!traceabilityResult.value) return []
  const s = traceabilityResult.value.statistics
  return [
    { key: 'total', label: '异常总数', value: s.totalAbnormal, icon: Warning },
    { key: 'duplicate', label: '重复执行', value: traceabilityResult.value.resourceAnalysis.highResourceCount, icon: DataAnalysis },
    { key: 'tasks', label: '影响任务', value: s.byTask.length, icon: List },
    { key: 'types', label: '异常类型', value: s.byAnomalyType.length, icon: Warning }
  ]
})

const showViewHistory = ref(false)
const viewHistory = ref<CronLogViewRecord[]>([])

const tableRef = ref<any>()
const tableWrapperRef = ref<HTMLElement>()
const showBackToTop = ref(false)

const formatDateTime = (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
const formatDuration = (ms: number) => ms >= 60000 ? `${(ms / 60000).toFixed(1)}min` : `${ms}ms`
const formatMemory = (bytes: number) => bytes >= 1073741824 ? `${(bytes / 1073741824).toFixed(1)}GB` : bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${(bytes / 1024).toFixed(1)}KB`

const getStatusTagType = (status: string) => ({
  pending: 'info', running: 'primary', success: 'success', failed: 'danger',
  timeout: 'warning', skipped: 'info', retrying: 'warning'
}[status] || 'info')

const getPriorityTagType = (priority: string) => ({ high: 'danger', medium: 'warning', low: 'info' }[priority] || 'info')
const getPriorityLabel = (priority: string) => ({ high: '高优先级', medium: '中优先级', low: '低优先级' }[priority] || priority)

const handleFieldFocus = (field: string) => { focusedField.value = field }
const handleFieldBlur = (field: string) => { if (focusedField.value === field) focusedField.value = null }

const handleFieldChange = async (field: string) => { await validateField(field) }

const validateField = async (field: string): Promise<boolean> => {
  let valid = false
  let errorMsg = ''

  if (field === 'taskName') {
    valid = !!filterForm.taskName && filterForm.taskName.trim().length > 0
  } else if (field === 'taskType') {
    valid = !!filterForm.taskType
  } else if (field === 'executeStatus') {
    valid = !!filterForm.executeStatus
  } else if (field === 'triggerType') {
    valid = !!filterForm.triggerType
  } else if (field === 'taskGroup') {
    valid = !!filterForm.taskGroup
  } else if (field === 'dateRange') {
    if (dateRange.value && dateRange.value.length === 2) {
      const [s, e] = dateRange.value
      const sd = new Date(s)
      const ed = new Date(e)
      const diff = Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24))
      if (diff > 30) {
        valid = false
        errorMsg = '查询时间区间不能超过30天，请分段查询'
        dateRange.value = null
        ElMessage.warning(errorMsg)
      } else {
        valid = true
      }
    } else {
      valid = false
    }
  } else if (field === 'minDuration') {
    if (filterForm.minDuration !== undefined && filterForm.minDuration !== null) {
      const dur = Number(filterForm.minDuration)
      valid = !isNaN(dur) && dur >= 0
      if (!valid) errorMsg = '请输入有效的耗时值'
    } else {
      valid = false
    }
  }

  fieldValid[field] = valid
  if (errorMsg) ElMessage.warning(errorMsg)
  return valid
}

const validateAllFields = async (): Promise<boolean> => {
  let ok = true
  if (dateRange.value && dateRange.value.length === 2) {
    const [s, e] = dateRange.value
    const diff = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24))
    if (diff > 30) {
      ok = false
      warnings.value.push('查询时间区间不能超过30天，请分段查询')
      dateRange.value = null
    }
  }
  if (filterForm.executeStatus && !filterForm.taskType) {
    const validStatuses = statusOptions.value.map(o => o.value)
    if (!validStatuses.includes(filterForm.executeStatus)) {
      ok = false
      ElMessage.warning('当前任务配置无效，请先选择任务类型')
    }
  }
  return ok
}

const fetchOptions = async () => {
  try {
    const [types, statuses, triggers, groups] = await Promise.all([
      getCronTaskTypeList(),
      getCronStatusList(),
      getCronTriggerTypeList(),
      getCronTaskGroupList()
    ])
    taskTypeOptions.value = types.data
    statusOptions.value = statuses.data
    triggerTypeOptions.value = triggers.data
    taskGroupOptions.value = groups.data
  } catch (e) { console.error(e) }
}

const fetchStats = async () => {
  try {
    const params: any = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (filterForm.taskType) params.taskType = filterForm.taskType
    if (filterForm.taskGroup) params.taskGroup = filterForm.taskGroup
    const res = await getCronLogStats(params)
    stats.value = res.data
    statsLoaded.value = true
  } catch (e) { console.error(e) }
}

const buildQueryParams = (): CronLogListParams => {
  const p: CronLogListParams = {
    page: page.value, pageSize: pageSize.value,
    taskName: filterForm.taskName || undefined,
    taskType: filterForm.taskType || undefined,
    taskGroup: filterForm.taskGroup || undefined,
    executeStatus: filterForm.executeStatus || undefined,
    triggerType: filterForm.triggerType || undefined,
    minDuration: filterForm.minDuration ? Number(filterForm.minDuration) : undefined,
    keyword: filterForm.keyword || undefined
  }
  if (dateRange.value && dateRange.value.length === 2) {
    p.startDate = dateRange.value[0]
    p.endDate = dateRange.value[1]
  }
  return p
}

const fetchList = async () => {
  if (!(await validateAllFields())) return
  loading.value = true
  warnings.value = []
  try {
    const res = await getCronLogList(buildQueryParams())
    tableData.value = res.data.list
    total.value = res.data.total
    if (res.data.warnings && res.data.warnings.length > 0) warnings.value = res.data.warnings
  } catch (e: any) { ElMessage.error(e.message || '获取日志列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { page.value = 1; fetchList(); fetchStats() }
const handleReset = () => {
  filterForm.taskName = undefined; filterForm.taskType = undefined
  filterForm.taskGroup = undefined; filterForm.executeStatus = undefined
  filterForm.triggerType = undefined; filterForm.minDuration = undefined
  filterForm.keyword = undefined; dateRange.value = null; warnings.value = []
  Object.keys(fieldValid).forEach(k => { fieldValid[k as keyof typeof fieldValid] = false })
  page.value = 1; fetchList(); fetchStats()
}
const handlePageChange = () => fetchList()
const handleSizeChange = () => { page.value = 1; fetchList() }

const handleTableScroll = (e: Event) => {
  const target = e.target as HTMLElement
  showBackToTop.value = target.scrollTop > 500
}

const scrollToTop = () => {
  if (tableWrapperRef.value) {
    tableWrapperRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const viewDetail = async (row: CronLog) => {
  try {
    const res = await getCronLogDetail(row.id)
    currentLog.value = res.data
    detailStep.value = 0
    detailDialogVisible.value = true
    if (row.executeStatus === 'failed' || row.executeStatus === 'timeout') {
      detailStep.value = 1
    }
    saveViewRecord(row)
  } catch (e: any) { ElMessage.error(e.message || '获取任务详情失败') }
}

const closeDetailDialog = () => { detailDialogVisible.value = false; currentLog.value = null }

const openBatchStatsDialog = () => {
  batchStatsPeriod.value = 'daily'
  batchStatsDialogVisible.value = true
  fetchBatchStats()
}

const fetchBatchStats = async () => {
  try {
    const params: any = { period: batchStatsPeriod.value }
    if (filterForm.taskType) params.taskType = filterForm.taskType
    if (filterForm.taskGroup) params.taskGroup = filterForm.taskGroup
    const res = await getCronLogBatchStats(params)
    batchStatsData.value = res.data
  } catch (e: any) { ElMessage.error(e.message || '获取批量统计失败') }
}

const closeBatchStatsDialog = () => { batchStatsDialogVisible.value = false; batchStatsData.value = null }

const openTraceabilityDrawer = async () => {
  traceabilityDrawerVisible.value = true
  try {
    const params: any = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (filterForm.taskType) params.taskType = filterForm.taskType
    if (filterForm.taskGroup) params.taskGroup = filterForm.taskGroup
    const res = await getCronLogTraceability(params)
    traceabilityResult.value = res.data
  } catch (e: any) { ElMessage.error(e.message || '获取溯源信息失败') }
}

const loadViewHistory = () => {
  try {
    const s = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (s) viewHistory.value = JSON.parse(s)
  } catch (e) { console.error(e) }
}

const saveViewRecord = (log: CronLog) => {
  const rec: CronLogViewRecord = {
    id: `VIEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    taskName: log.taskName,
    executeStatus: log.executeStatus,
    viewedAt: new Date().toISOString()
  }
  viewHistory.value.unshift(rec)
  if (viewHistory.value.length > MAX_HISTORY) viewHistory.value = viewHistory.value.slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(viewHistory.value))
}

const quickViewById = async (record: CronLogViewRecord) => {
  showViewHistory.value = false
  try {
    const log = tableData.value.find(l => l.taskName === record.taskName)
    if (log) { viewDetail(log); return }
    const res = await getCronLogDetail(parseInt(record.id.replace('VIEW_', '').split('_')[0]) || 0)
    currentLog.value = res.data
    detailStep.value = 0
    detailDialogVisible.value = true
  } catch (e: any) { ElMessage.error(e.message || '获取任务详情失败') }
}

onMounted(async () => {
  loadViewHistory()
  await fetchOptions()
  await Promise.all([fetchList(), fetchStats()])
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.cron-log-page {
  position: relative;
  min-height: calc(100vh - 100px);

  .stats-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .stat-card-zoom {
      background: $bg-color-ffffff;
      border-radius: $border-radius-large;
      padding: 20px;
      display: flex;
      align-items: center;
      box-shadow: $shadow-light;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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

        &.stat-total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.stat-success { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        &.stat-today { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.stat-avg { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        &.stat-periods { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.stat-normal { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        &.stat-abnormal { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        &.stat-duplicate { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.stat-tasks { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        &.stat-types { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
      }

      .stat-info {
        .stat-value { font-size: 28px; font-weight: 600; color: $text-primary; line-height: 1.2; }
        .stat-label { font-size: $font-size-small; color: $text-secondary; margin-top: 4px; }
      }
    }
  }

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
        margin-right: 0;
        transition: all 0.3s ease;
      }
    }

    .focus-zoom-wrap {
      :deep(.el-form-item__content) {
        .field-with-check {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }
    }

    .focus-zoom {
      transition: all 0.3s ease;

      &:focus-within {
        transform: scale(1.02);
        :deep(.el-input__wrapper),
        :deep(.el-select__wrapper),
        :deep(.el-date-editor.el-input__wrapper) {
          box-shadow: 0 0 0 1px $primary-color inset, 0 0 0 3px rgba(64, 158, 255, 0.1);
        }
      }
    }

    .valid-check {
      color: $success-color;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
      animation: checkAppear 0.3s ease-out;
    }

    @keyframes checkAppear {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    .filter-warnings { margin-top: 12px; }
  }

  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .table-title {
        display: flex;
        align-items: center;
        font-size: $font-size-medium;
        font-weight: 600;
        color: $text-primary;

        .el-icon { margin-right: 6px; color: $primary-color; }
      }
    }

    .table-wrapper {
      position: relative;
      height: calc(100vh - 460px);
      overflow: auto;

      .back-to-top {
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 40px;
        height: 40px;
        background: $primary-color;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: $shadow-medium;
        transition: all 0.3s ease;
        z-index: 10;

        &:hover { transform: translateY(-2px); box-shadow: $shadow-dark; }
      }
    }

    .cron-table {
      :deep(.el-table__row) {
        cursor: pointer;
        transition: background-color 0.2s ease;
        &:hover { background-color: rgba(64, 158, 255, 0.04); }
      }

      .slow-duration { color: $danger-color; font-weight: 600; }
      .retry-warning { color: $warning-color; font-weight: 600; }
      .no-anomaly { color: $text-secondary; }
      .anomaly-tags { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }
      .content-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .running-pulse {
        animation: runningPulse 2s ease-in-out infinite;
      }

      @keyframes runningPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    }

    .alternating-row {
      :deep(.el-table__row:nth-child(even)) {
        background-color: #fafafa;
      }
    }

    .table-pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}

@keyframes zoomFadeIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

:global(.zoom-fade-in-dialog) {
  animation: zoomFadeIn 0.3s ease-out;
}

.detail-dialog,
.zoom-fade-in-dialog {
  :deep(.el-dialog) {
    border-radius: $border-radius-large;
    overflow: hidden;
  }

  .cron-detail {
    .section-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 16px;
      padding-left: 10px;
      border-left: 3px solid $primary-color;
    }

    .sub-title {
      font-size: $font-size-small;
      font-weight: 600;
      color: $text-regular;
      margin: 16px 0 8px;
    }

    .cron-expression {
      font-family: monospace;
      font-size: $font-size-small;
      background: $bg-color;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .error-highlight {
      background: #fff3e0;
      border-left: 3px solid #ff9800;
      padding: 16px;
      border-radius: $border-radius;
      margin-top: 16px;

      .error-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: $font-size-base;
        font-weight: 600;
        color: $warning-color;
        margin-bottom: 8px;
      }

      .error-message {
        font-size: $font-size-small;
        color: $text-regular;
        margin-bottom: 8px;
      }

      .error-stack {
        background: #1e1e1e;
        border-radius: $border-radius;
        padding: 12px;
        max-height: 200px;
        overflow: auto;

        pre {
          margin: 0;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: $font-size-extra-small;
          line-height: 1.6;
          color: #d4d4d4;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }

    .error-highlight-inline {
      color: $danger-color;
      font-weight: 500;
    }

    .retry-strategy-section {
      margin-top: 16px;
    }

    .resource-high {
      color: $danger-color;
      font-weight: 600;
    }

    .json-section {
      margin-top: 16px;
    }

    .json-viewer {
      background: #f8f9fa;
      border-radius: $border-radius;
      padding: 16px;
      max-height: 300px;
      overflow: auto;

      pre {
        margin: 0;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: $font-size-small;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

.batch-stats-content {
  .period-selector {
    margin-bottom: 20px;
  }

  .batch-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    .stat-card-zoom {
      background: $bg-color-ffffff;
      border-radius: $border-radius-large;
      padding: 16px;
      display: flex;
      align-items: center;
      box-shadow: $shadow-light;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: #fff;

        &.stat-periods { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.stat-success { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        &.stat-normal { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        &.stat-abnormal { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
      }

      .stat-info {
        .stat-value { font-size: 22px; font-weight: 600; color: $text-primary; line-height: 1.2; }
        .stat-label { font-size: $font-size-extra-small; color: $text-secondary; margin-top: 2px; }
      }
    }
  }

  .section-title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 12px;
    padding-left: 10px;
    border-left: 3px solid $primary-color;
  }

  .chart-section { margin-bottom: 24px; }
  .breakdown-section { margin-top: 24px; }

  .alternating-row {
    :deep(.el-table__row:nth-child(even)) {
      background-color: #fafafa;
    }
  }
}

.traceability-drawer {
  .traceability-content {
    .section-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 16px;
      padding-left: 10px;
      border-left: 3px solid $primary-color;
    }

    .anomaly-stats-section {
      margin-bottom: 24px;

      .anomaly-overview-cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .stat-card-zoom {
          background: $bg-color-ffffff;
          border-radius: $border-radius;
          padding: 16px;
          display: flex;
          align-items: center;
          box-shadow: $shadow-light;
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }

          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            color: #fff;

            &.stat-total { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
            &.stat-duplicate { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            &.stat-tasks { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
            &.stat-types { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          }

          .stat-info {
            .stat-value { font-size: 22px; font-weight: 600; color: $text-primary; line-height: 1.2; }
            .stat-label { font-size: $font-size-extra-small; color: $text-secondary; margin-top: 2px; }
          }
        }
      }

      .alternating-row {
        :deep(.el-table__row:nth-child(even)) {
          background-color: #fafafa;
        }
      }
    }

    .resource-analysis-section {
      margin-bottom: 24px;
    }

    .config-analysis-section {
      margin-bottom: 24px;

      .alternating-row {
        :deep(.el-table__row:nth-child(even)) {
          background-color: #fafafa;
        }
      }
    }

    .optimization-section {
      .suggestion-list {
        .suggestion-item {
          background: $bg-color-ffffff;
          border-radius: $border-radius;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: $shadow-light;

          .suggestion-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;

            .suggestion-type {
              font-size: $font-size-base;
              font-weight: 600;
              color: $text-primary;
            }

            .suggestion-count {
              font-size: $font-size-small;
              color: $text-secondary;
              margin-left: auto;
            }
          }

          .suggestion-title {
            font-size: $font-size-base;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 6px;
          }

          .suggestion-desc {
            font-size: $font-size-small;
            color: $text-regular;
            line-height: 1.6;
          }
        }
      }
    }
  }
}

.view-history-drawer {
  .empty-history { padding: 40px 0; }

  .history-list {
    .history-item {
      padding: 12px;
      border-radius: $border-radius;
      cursor: pointer;
      margin-bottom: 8px;
      background: $bg-color-page;
      transition: all 0.2s ease;
      border: 1px solid transparent;

      &:hover {
        background: rgba(64, 158, 255, 0.06);
        border-color: rgba(64, 158, 255, 0.2);
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .history-time { font-size: $font-size-extra-small; color: $text-secondary; }
      }

      .history-title {
        font-size: $font-size-small;
        color: $text-primary;
        font-weight: 500;
      }
    }
  }
}
</style>
