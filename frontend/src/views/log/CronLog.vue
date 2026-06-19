<template>
  <div class="cron-log-page">
    <div v-if="!hasPermission" class="permission-overlay">
      <div class="permission-content">
        <el-icon :size="64" color="#f56c6c"><Lock /></el-icon>
        <div class="permission-title">权限不足</div>
        <div class="permission-desc">您没有访问定时任务日志的权限，请联系管理员申请</div>
      </div>
    </div>

    <template v-else>
      <div class="stats-section" v-if="statsLoaded">
        <div class="stat-card" v-for="item in statCards" :key="item.key">
          <div class="stat-icon" :class="`stat-${item.key}`">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <div class="period-tabs">
        <div
          v-for="tab in periodTabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: statsPeriod === tab.value }"
          @click="handlePeriodChange(tab.value)"
        >
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>

      <div class="filter-card card-wrapper">
        <el-form :inline="true" :model="filterForm" class="filter-form" ref="filterFormRef">
          <el-form-item label="执行时间" prop="dateRange" :class="{ 'is-error': fieldErrors.dateRange, 'is-shake': fieldShakes.dateRange, 'is-valid': fieldValid.dateRange }">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
              :shortcuts="dateShortcuts" style="width: 280px"
              @focus="handleFieldFocus('dateRange')" @blur="handleFieldBlur('dateRange')" @change="handleFieldChange('dateRange')" />
            <el-icon v-if="fieldValid.dateRange" class="valid-icon"><Check /></el-icon>
          </el-form-item>
          <el-form-item label="任务类型" prop="taskType" :class="{ 'is-error': fieldErrors.taskType, 'is-shake': fieldShakes.taskType, 'is-valid': fieldValid.taskType }">
            <el-select v-model="filterForm.taskType" placeholder="全部" clearable style="width: 140px"
              @focus="handleFieldFocus('taskType')" @blur="handleFieldBlur('taskType')" @change="handleFieldChange('taskType')">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-icon v-if="fieldValid.taskType" class="valid-icon"><Check /></el-icon>
          </el-form-item>
          <el-form-item label="执行状态" prop="status" :class="{ 'is-error': fieldErrors.status, 'is-shake': fieldShakes.status, 'is-valid': fieldValid.status }">
            <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px"
              @focus="handleFieldFocus('status')" @blur="handleFieldBlur('status')" @change="handleStatusFilterChange">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-icon v-if="fieldValid.status" class="valid-icon"><Check /></el-icon>
          </el-form-item>
          <el-form-item label="触发方式" prop="triggerType">
            <el-select v-model="filterForm.triggerType" placeholder="全部" clearable style="width: 140px">
              <el-option v-for="item in triggerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="异常类型" prop="anomalyType">
            <el-select v-model="filterForm.anomalyType" placeholder="全部" clearable style="width: 140px">
              <el-option v-for="item in anomalyTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务名称">
            <el-select v-model="filterForm.taskId" placeholder="选择任务" clearable filterable style="width: 180px">
              <el-option v-for="item in taskList" :key="item.taskId" :label="item.taskName" :value="item.taskId" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filterForm.keyword" placeholder="任务名称/输出" clearable style="width: 180px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            <el-button type="success" :icon="DataAnalysis" @click="openStatsDialog">统计分析</el-button>
            <el-button type="warning" :icon="Warning" @click="openTraceabilityDialog">异常溯源</el-button>
          </el-form-item>
        </el-form>
        <div class="filter-warnings" v-if="warnings.length > 0">
          <el-alert v-for="(warning, idx) in warnings" :key="idx" :title="warning" type="warning" :closable="false" show-icon style="margin-bottom: 8px" />
        </div>
        <div v-if="!validTaskConfig && filterForm.status" class="config-warning">
          <el-alert title="任务配置无效，无法展示查询结果" type="error" :closable="false" show-icon />
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
            border resizable @row-dblclick="handleRowDblclick" class="cron-table">
            <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
            <el-table-column prop="id" label="日志ID" width="80" align="center" />
            <el-table-column prop="taskName" label="任务名称" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tooltip :content="row.taskName" placement="top">
                  <span class="task-name">{{ row.taskName }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="taskType" label="任务类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="getTaskTypeTagType(row.taskType)" size="small">{{ getTaskTypeLabel(row.taskType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="triggerType" label="触发方式" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ getTriggerTypeLabel(row.triggerType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="执行状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small" :class="{ 'error-glow': row.status === 'failed' || row.status === 'killed' || row.anomalyDetected }">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="异常类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.anomalyType && row.anomalyType !== 'none'" :type="getAnomalyTagType(row.anomalyType)" size="small" class="error-glow">
                  {{ getAnomalyTypeLabel(row.anomalyType) }}
                </el-tag>
                <span v-else class="no-anomaly">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="耗时(ms)" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'slow-duration': row.duration >= row.timeoutThreshold }">{{ row.duration || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="retryCount" label="重试次数" width="90" align="center">
              <template #default="{ row }">
                <span v-if="row.retryCount > 0" class="retry-count">{{ row.retryCount }}/{{ row.maxRetries }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="系统资源" width="120" align="center">
              <template #default="{ row }">
                <div class="resource-info">
                  <div class="resource-item">
                    <el-icon :size="12"><Cpu /></el-icon>
                    <span>{{ row.cpuUsage ? row.cpuUsage.toFixed(1) + '%' : '-' }}</span>
                  </div>
                  <div class="resource-item">
                    <el-icon :size="12"><Memory /></el-icon>
                    <span>{{ row.memoryUsageMB ? row.memoryUsageMB + 'MB' : '-' }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="scheduledAt" label="计划执行时间" width="170" align="center">
              <template #default="{ row }">{{ formatDateTime(row.scheduledAt) }}</template>
            </el-table-column>
            <el-table-column prop="createdAt" label="记录时间" width="170" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
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
    </template>

    <el-dialog v-model="detailDialogVisible" :title="`任务执行详情 #${currentLog?.id || ''}`" width="950px"
      class="detail-dialog" :close-on-click-modal="false" @close="closeDetailDialog"
      :class="{ 'failed-dialog': currentLog?.status === 'failed' || currentLog?.status === 'killed' }">
      <div v-if="currentLog" class="log-detail">
        <div v-if="currentLog.status === 'failed' || currentLog.anomalyDetected" class="failure-banner">
          <el-alert :title="currentLog.errorMessage || '任务执行失败'" type="error" :closable="false" show-icon>
            <template #default v-if="currentLog.defaultRetryStrategy">
              <div class="retry-strategy-info">
                <el-icon><Timer /></el-icon>
                <span>系统默认重试策略：{{ currentLog.defaultRetryStrategy.description }}</span>
                <span v-if="currentLog.nextRetryTime" class="next-retry">
                  下次重试时间：{{ formatDateTime(currentLog.nextRetryTime) }}
                </span>
              </div>
            </template>
          </el-alert>
        </div>

        <el-steps :active="detailStep" finish-status="success" simple style="margin-bottom: 24px">
          <el-step title="基本信息" />
          <el-step title="执行结果" />
          <el-step title="异常信息" />
          <el-step title="重试记录" />
        </el-steps>

        <div v-show="detailStep === 0" class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
            <el-descriptions-item label="任务ID"><span class="trace-id">{{ currentLog.taskId }}</span></el-descriptions-item>
            <el-descriptions-item label="任务名称">{{ currentLog.taskName }}</el-descriptions-item>
            <el-descriptions-item label="任务类型"><el-tag :type="getTaskTypeTagType(currentLog.taskType)">{{ getTaskTypeLabel(currentLog.taskType) }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="触发方式"><el-tag type="info">{{ getTriggerTypeLabel(currentLog.triggerType) }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="执行状态"><el-tag :type="getStatusTagType(currentLog.status)" :class="{ 'error-glow': currentLog.status === 'failed' || currentLog.status === 'killed' }">{{ getStatusLabel(currentLog.status) }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="Cron表达式">{{ currentLog.cronExpression || '-' }}</el-descriptions-item>
            <el-descriptions-item label="任务分组">{{ currentLog.taskGroup || '-' }}</el-descriptions-item>
            <el-descriptions-item label="超时阈值">{{ currentLog.timeoutThreshold }} ms</el-descriptions-item>
            <el-descriptions-item label="执行耗时">{{ currentLog.duration || 0 }} ms</el-descriptions-item>
            <el-descriptions-item label="影响记录数">{{ currentLog.affectedRecords || 0 }}</el-descriptions-item>
            <el-descriptions-item label="处理记录数">{{ currentLog.processedRecords || 0 }}</el-descriptions-item>
            <el-descriptions-item label="计划执行时间" :span="2">{{ formatDateTime(currentLog.scheduledAt) }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ currentLog.startedAt ? formatDateTime(currentLog.startedAt) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ currentLog.finishedAt ? formatDateTime(currentLog.finishedAt) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="下次执行时间">{{ currentLog.nextRunAt ? formatDateTime(currentLog.nextRunAt) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行服务器">{{ currentLog.serverName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ currentLog.createdByName || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-show="detailStep === 1" class="detail-section">
          <h4 class="section-title">执行结果</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行状态">
              <el-tag :type="getStatusTagType(currentLog.status)">{{ getStatusLabel(currentLog.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="是否超时">
              <el-tag :type="currentLog.isTimeout ? 'danger' : 'success'">{{ currentLog.isTimeout ? '是' : '否' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="是否重复执行">
              <el-tag :type="currentLog.isDuplicate ? 'warning' : 'success'">{{ currentLog.isDuplicate ? '是' : '否' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="是否漏执行">
              <el-tag :type="currentLog.isMissed ? 'danger' : 'success'">{{ currentLog.isMissed ? '是' : '否' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="异常检测">
              <el-tag :type="currentLog.anomalyDetected ? 'danger' : 'success'">{{ currentLog.anomalyDetected ? '发现异常' : '正常' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="异常类型">
              <el-tag v-if="currentLog.anomalyType && currentLog.anomalyType !== 'none'" :type="getAnomalyTagType(currentLog.anomalyType)" class="error-glow">
                {{ getAnomalyTypeLabel(currentLog.anomalyType) }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="currentLog.resultData" class="json-section">
            <h5 class="sub-title">结果数据</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.resultData, null, 2) }}</pre></div>
          </div>

          <div v-if="currentLog.output" class="json-section">
            <h5 class="sub-title">执行输出</h5>
            <div class="output-text">
              <el-tooltip :content="currentLog.output" placement="top" v-if="currentLog.output.length > 200">
                <pre>{{ currentLog.output.substring(0, 200) }}...</pre>
              </el-tooltip>
              <pre v-else>{{ currentLog.output }}</pre>
            </div>
          </div>

          <div v-if="currentLog.configParams" class="json-section">
            <h5 class="sub-title">配置参数</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.configParams, null, 2) }}</pre></div>
          </div>

          <el-empty v-if="!currentLog.resultData && !currentLog.output && !currentLog.configParams" description="无执行结果数据" />
        </div>

        <div v-show="detailStep === 2" class="detail-section">
          <h4 class="section-title">异常信息</h4>
          <div v-if="currentLog.errorMessage || currentLog.errorStack" class="error-content">
            <el-descriptions :column="1" border v-if="currentLog.errorMessage">
              <el-descriptions-item label="错误信息">
                <span class="error-message-highlight">{{ currentLog.errorMessage }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="错误码" v-if="currentLog.errorCode">{{ currentLog.errorCode }}</el-descriptions-item>
            </el-descriptions>
            <div v-if="currentLog.errorStack" class="stack-section">
              <h5 class="sub-title">错误堆栈</h5>
              <div class="stack-trace error-highlight">
                <pre>{{ currentLog.errorStack }}</pre>
              </div>
            </div>
            <div v-if="currentLog.anomalyMessage" class="anomaly-section">
              <h5 class="sub-title">异常说明</h5>
              <div class="anomaly-message error-highlight">
                <pre>{{ currentLog.anomalyMessage }}</pre>
              </div>
            </div>
          </div>

          <div v-if="currentLog.optimizationSuggestion" class="optimization-section">
            <el-alert :title="currentLog.optimizationSuggestion" type="info" :closable="false" show-icon />
          </div>

          <el-empty v-if="!currentLog.errorMessage && !currentLog.errorStack && !currentLog.anomalyMessage" description="无异常信息" />
        </div>

        <div v-show="detailStep === 3" class="detail-section">
          <h4 class="section-title">重试记录</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="已重试次数">{{ currentLog.retryCount }} / {{ currentLog.maxRetries }}</el-descriptions-item>
            <el-descriptions-item label="重试策略">
              <el-tag type="info">{{ getRetryStrategyLabel(currentLog.retryStrategy) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="重试间隔">{{ currentLog.retryInterval }} ms</el-descriptions-item>
            <el-descriptions-item label="下次重试时间">
              <span v-if="currentLog.nextRetryTime">{{ formatDateTime(currentLog.nextRetryTime) }}</span>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="currentLog.retryLogs && currentLog.retryLogs.length > 0" class="retry-logs-section">
            <h5 class="sub-title">重试日志列表</h5>
            <el-table :data="currentLog.retryLogs" size="small" border>
              <el-table-column prop="attempt" label="重试次数" width="80" align="center" />
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="耗时(ms)" width="100" align="center" />
              <el-table-column prop="startedAt" label="开始时间" width="170" align="center">
                <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
              </el-table-column>
              <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.errorMessage" class="error-message-highlight">{{ row.errorMessage }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="currentLog.retryHistory && currentLog.retryHistory.length > 0" class="retry-history-section">
            <h5 class="sub-title">重试历史</h5>
            <el-table :data="currentLog.retryHistory" size="small" border>
              <el-table-column prop="attempt" label="重试次数" width="80" align="center" />
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="耗时(ms)" width="100" align="center" />
              <el-table-column prop="startedAt" label="开始时间" width="170" align="center">
                <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
              </el-table-column>
              <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.errorMessage" class="error-message-highlight">{{ row.errorMessage }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-if="(!currentLog.retryLogs || currentLog.retryLogs.length === 0) && (!currentLog.retryHistory || currentLog.retryHistory.length === 0)" description="暂无重试记录" />
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

    <el-dialog v-model="statsDialogVisible" title="批量统计分析" width="1100px" class="stats-dialog">
      <div v-if="statsData" class="stats-content">
        <div class="stats-summary">
          <div class="summary-card" v-for="item in summaryCards" :key="item.key">
            <div class="summary-icon" :class="`summary-${item.key}`">
              <el-icon :size="20"><component :is="item.icon" /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-value">{{ item.value }}</div>
              <div class="summary-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <el-tabs v-model="statsTab" class="stats-tabs">
          <el-tab-pane label="任务类型统计" name="byType">
            <div class="type-stats">
              <el-table :data="typeStatsList" border>
                <el-table-column prop="label" label="任务类型" width="120" align="center" />
                <el-table-column prop="total" label="总执行次数" width="120" align="center" />
                <el-table-column prop="success" label="成功次数" width="100" align="center" />
                <el-table-column prop="failed" label="失败次数" width="100" align="center" />
                <el-table-column label="成功率" width="120" align="center">
                  <template #default="{ row }">
                    <el-progress :percentage="row.successRate" :status="row.successRate >= 90 ? 'success' : row.successRate >= 70 ? 'warning' : 'exception'" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="趋势分析" name="trend">
            <div class="trend-stats">
              <el-table :data="statsData.trend" border>
                <el-table-column prop="period" label="统计周期" width="150" align="center" />
                <el-table-column prop="total" label="总执行" width="100" align="center" />
                <el-table-column prop="success" label="成功" width="100" align="center" />
                <el-table-column prop="failed" label="失败" width="100" align="center" />
                <el-table-column prop="timeout" label="超时" width="100" align="center" />
                <el-table-column prop="anomaly" label="异常" width="100" align="center">
                  <template #default="{ row }">
                    <span v-if="row.anomaly > 0" class="error-highlight">{{ row.anomaly }}</span>
                    <span v-else>{{ row.anomaly }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="成功率" width="150" align="center">
                  <template #default="{ row }">
                    <el-progress :percentage="row.total > 0 ? Math.round((row.success / row.total) * 100) : 0" :status="row.total > 0 && (row.success / row.total) >= 0.9 ? 'success' : row.total > 0 && (row.success / row.total) >= 0.7 ? 'warning' : 'exception'" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="异常统计" name="anomaly">
            <div class="anomaly-stats">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="重复执行">
                  <el-tag type="warning">{{ statsData.anomalyStats.duplicate }} 次</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="超时执行">
                  <el-tag type="danger">{{ statsData.anomalyStats.timeout }} 次</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="漏执行">
                  <el-tag type="danger" class="error-glow">{{ statsData.anomalyStats.missed }} 次</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="资源超限">
                  <el-tag type="warning">{{ statsData.anomalyStats.resourceExceeded }} 次</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="配置错误">
                  <el-tag type="danger">{{ statsData.anomalyStats.configError }} 次</el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div class="retry-stats-section" style="margin-top: 16px">
                <h5 class="sub-title">重试统计</h5>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="含重试任务">
                    <el-tag type="info">{{ statsData.retryStats.withRetry }} 个</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="达到最大重试">
                    <el-tag type="danger">{{ statsData.retryStats.maxRetryReached }} 个</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="平均重试次数">
                    <el-tag type="primary">{{ statsData.retryStats.avgRetryCount.toFixed(1) }} 次</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="统计简报" name="brief">
            <div class="stats-brief">
              <el-alert title="统计简报摘要" type="info" :closable="false" show-icon>
                <template #default>
                  <div>统计周期：{{ getPeriodLabel(statsData.period) }}</div>
                  <div>总执行次数：{{ statsData.summary.total }} 次</div>
                  <div>成功率：{{ statsData.summary.successRate.toFixed(1) }}%</div>
                  <div>平均耗时：{{ statsData.summary.avgDuration.toFixed(0) }} ms</div>
                </template>
              </el-alert>

              <div class="brief-content">
                <h5 class="sub-title">按任务类型统计</h5>
                <div class="type-brief-list">
                  <div v-for="(item, key) in statsData.byTaskType" :key="key" class="type-brief-item">
                    <div class="type-brief-header">
                      <el-tag :type="getTaskTypeTagType(key as CronTaskType)">{{ item.label }}</el-tag>
                      <span class="type-brief-rate">成功率 {{ item.successRate.toFixed(1) }}%</span>
                    </div>
                    <div class="type-brief-detail">
                      总执行 {{ item.total }} 次，成功 {{ item.success }} 次，失败 {{ item.failed }} 次
                    </div>
                    <el-progress :percentage="item.successRate" :status="item.successRate >= 90 ? 'success' : item.successRate >= 70 ? 'warning' : 'exception'" :show-text="false" />
                  </div>
                </div>

                <h5 class="sub-title" style="margin-top: 24px">正常任务 vs 异常任务</h5>
                <div class="comparison-stats">
                  <div class="comparison-item normal">
                    <div class="comparison-icon"><el-icon :size="32" color="#67c23a"><Check /></el-icon></div>
                    <div class="comparison-value">{{ statsData.summary.total - statsData.summary.anomalyCount }}</div>
                    <div class="comparison-label">正常任务</div>
                  </div>
                  <div class="comparison-item abnormal">
                    <div class="comparison-icon"><el-icon :size="32" color="#f56c6c"><Warning /></el-icon></div>
                    <div class="comparison-value error-highlight">{{ statsData.summary.anomalyCount }}</div>
                    <div class="comparison-label">异常任务</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <div class="period-selector">
          <span>统计周期：</span>
          <el-radio-group v-model="statsPeriodForDialog" @change="handleStatsPeriodChange">
            <el-radio-button value="daily">按日</el-radio-button>
            <el-radio-button value="weekly">按周</el-radio-button>
            <el-radio-button value="monthly">按月</el-radio-button>
          </el-radio-group>
        </div>
        <el-button @click="closeStatsDialog">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceabilityDialogVisible" title="异常溯源分析" width="1150px" class="traceability-dialog">
      <div v-if="traceabilityResult" class="traceability-content">
        <div class="task-overview">
          <h4 class="section-title">任务概览</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务ID">{{ traceabilityResult.taskOverview.taskId }}</el-descriptions-item>
            <el-descriptions-item label="任务名称">{{ traceabilityResult.taskOverview.taskName }}</el-descriptions-item>
            <el-descriptions-item label="任务类型"><el-tag :type="getTaskTypeTagType(traceabilityResult.taskOverview.taskType)">{{ getTaskTypeLabel(traceabilityResult.taskOverview.taskType) }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="Cron表达式">{{ traceabilityResult.taskOverview.cronExpression || '-' }}</el-descriptions-item>
            <el-descriptions-item label="总执行次数">{{ traceabilityResult.taskOverview.totalExecutions }}</el-descriptions-item>
            <el-descriptions-item label="近期执行次数">{{ traceabilityResult.taskOverview.recentExecutions }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="traceabilityResult.taskOverview.configParams" class="config-params-section">
            <h5 class="sub-title">配置参数</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(traceabilityResult.taskOverview.configParams, null, 2) }}</pre></div>
          </div>
        </div>

        <el-tabs v-model="traceabilityTab" class="traceability-tabs">
          <el-tab-pane label="执行流程" name="flow">
            <div class="execution-flow">
              <el-table :data="traceabilityResult.executionFlow.slice(0, 20)" border size="small">
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="duration" label="耗时(ms)" width="100" align="center" />
                <el-table-column prop="scheduledAt" label="计划时间" width="170" align="center">
                  <template #default="{ row }">{{ formatDateTime(row.scheduledAt) }}</template>
                </el-table-column>
                <el-table-column label="异常" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.anomalyType && row.anomalyType !== 'none'" type="danger" size="small" class="error-glow">
                      {{ getAnomalyTypeLabel(row.anomalyType) }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="系统资源" name="resource">
            <div class="resource-usage">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="CPU 使用率">
                  <div class="resource-detail">
                    <span>平均：{{ traceabilityResult.resourceUsage.cpu.avg.toFixed(1) }}%</span>
                    <span>最高：{{ traceabilityResult.resourceUsage.cpu.max.toFixed(1) }}%</span>
                    <span>最低：{{ traceabilityResult.resourceUsage.cpu.min.toFixed(1) }}%</span>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="内存使用">
                  <div class="resource-detail">
                    <span>平均：{{ traceabilityResult.resourceUsage.memory.avg.toFixed(0) }}%</span>
                    <span>最高：{{ traceabilityResult.resourceUsage.memory.max.toFixed(0) }}%</span>
                    <span>最低：{{ traceabilityResult.resourceUsage.memory.min.toFixed(0) }}%</span>
                  </div>
                </el-descriptions-item>
              </el-descriptions>

              <div class="resource-chart" style="margin-top: 16px">
                <h5 class="sub-title">执行分析</h5>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="总执行次数">{{ traceabilityResult.analysis.total }}</el-descriptions-item>
                  <el-descriptions-item label="成功次数">{{ traceabilityResult.analysis.successCount }}</el-descriptions-item>
                  <el-descriptions-item label="失败次数">{{ traceabilityResult.analysis.failedCount }}</el-descriptions-item>
                  <el-descriptions-item label="超时次数">{{ traceabilityResult.analysis.timeoutCount }}</el-descriptions-item>
                  <el-descriptions-item label="成功率">
                    <el-tag :type="traceabilityResult.analysis.successRate >= 90 ? 'success' : traceabilityResult.analysis.successRate >= 70 ? 'warning' : 'danger'">
                      {{ traceabilityResult.analysis.successRate.toFixed(1) }}%
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="稳定度">
                    <el-tag :type="traceabilityResult.analysis.stabilityScore >= 90 ? 'success' : traceabilityResult.analysis.stabilityScore >= 70 ? 'warning' : 'danger'">
                      {{ traceabilityResult.analysis.stabilityScore.toFixed(1) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="平均耗时">{{ traceabilityResult.analysis.avgDuration.toFixed(0) }} ms</el-descriptions-item>
                  <el-descriptions-item label="最大耗时">{{ traceabilityResult.analysis.maxDuration.toFixed(0) }} ms</el-descriptions-item>
                  <el-descriptions-item label="最小耗时">{{ traceabilityResult.analysis.minDuration.toFixed(0) }} ms</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="异常检测" name="anomaly">
            <div class="anomaly-detection">
              <div v-if="traceabilityResult.anomalies.length === 0" class="empty-state">
                <el-empty description="未检测到异常" />
              </div>
              <div v-else class="anomaly-list">
                <div v-for="(anomaly, idx) in traceabilityResult.anomalies" :key="idx" class="anomaly-item" :class="anomaly.severity">
                  <div class="anomaly-header">
                    <el-tag :type="anomaly.severity === 'error' ? 'danger' : anomaly.severity === 'warning' ? 'warning' : 'info'" size="small">
                      {{ anomaly.type }}
                    </el-tag>
                    <span class="anomaly-log-id">日志ID: #{{ anomaly.logId }}</span>
                    <span class="anomaly-time">{{ formatDateTime(anomaly.scheduledAt) }}</span>
                  </div>
                  <div class="anomaly-message error-highlight">{{ anomaly.message }}</div>
                </div>
              </div>

              <div class="intercepted-tasks" style="margin-top: 24px" v-if="traceabilityResult.anomalies.length > 0">
                <h5 class="sub-title">已自动拦截的异常任务</h5>
                <el-alert type="warning" :closable="false" show-icon>
                  <template #title>系统已自动拦截以下类型的异常任务</template>
                  <ul>
                    <li v-if="getAnomalyCount('duplicate') > 0">重复执行任务：{{ getAnomalyCount('duplicate') }} 次</li>
                    <li v-if="getAnomalyCount('timeout') > 0">超时执行任务：{{ getAnomalyCount('timeout') }} 次</li>
                    <li v-if="getAnomalyCount('missed') > 0">漏执行任务：{{ getAnomalyCount('missed') }} 次</li>
                  </ul>
                </el-alert>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="配置校验" name="config">
            <div class="config-validation">
              <div v-if="traceabilityResult.configIssues.length === 0" class="empty-state">
                <el-empty description="配置校验通过，未发现问题" />
              </div>
              <div v-else class="config-issues">
                <div v-for="(issue, idx) in traceabilityResult.configIssues" :key="idx" class="config-issue-item" :class="issue.severity">
                  <el-icon><Warning /></el-icon>
                  <span class="issue-message">{{ issue.message }}</span>
                  <el-tag :type="issue.severity === 'error' ? 'danger' : issue.severity === 'warning' ? 'warning' : 'info'" size="small">
                    {{ issue.severity === 'error' ? '严重' : issue.severity === 'warning' ? '警告' : '提示' }}
                  </el-tag>
                </div>
              </div>

              <div class="validation-checks" style="margin-top: 24px">
                <h5 class="sub-title">多维度配置校验</h5>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="Cron表达式校验">
                    <el-tag v-if="cronValidation.valid" type="success"><el-icon><Check /></el-icon> 合法</el-tag>
                    <el-tag v-else type="danger"><el-icon><Warning /></el-icon> {{ cronValidation.message }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="超时阈值校验">
                    <el-tag v-if="timeoutValidation.valid" type="success"><el-icon><Check /></el-icon> 合理</el-tag>
                    <el-tag v-else type="warning"><el-icon><Warning /></el-icon> {{ timeoutValidation.message }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="重试策略校验">
                    <el-tag v-if="retryValidation.valid" type="success"><el-icon><Check /></el-icon> 合理</el-tag>
                    <el-tag v-else type="warning"><el-icon><Warning /></el-icon> {{ retryValidation.message }}</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="优化建议" name="optimization">
            <div class="optimization-content">
              <div class="optimization-header">
                <el-alert :title="traceabilityResult.optimization.summary" :type="traceabilityResult.optimization.overallStatus === 'good' ? 'success' : traceabilityResult.optimization.overallStatus === 'warning' ? 'warning' : 'error'" :closable="false" show-icon>
                  <template #title>
                    <div class="overall-status">
                      <span>整体状态：</span>
                      <el-tag :type="traceabilityResult.optimization.overallStatus === 'good' ? 'success' : traceabilityResult.optimization.overallStatus === 'warning' ? 'warning' : 'danger'" size="large">
                        {{ traceabilityResult.optimization.overallStatus === 'good' ? '良好' : traceabilityResult.optimization.overallStatus === 'warning' ? '警告' : '较差' }}
                      </el-tag>
                    </div>
                    <div style="margin-top: 8px">{{ traceabilityResult.optimization.summary }}</div>
                  </template>
                </el-alert>
              </div>

              <div class="suggestion-list">
                <h5 class="sub-title">优化建议报告</h5>
                <div v-for="(suggestion, idx) in traceabilityResult.optimization.suggestions" :key="idx" class="suggestion-item">
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
        <div class="task-selector">
          <span>选择任务：</span>
          <el-select v-model="selectedTaskId" placeholder="请选择任务" style="width: 250px" @change="fetchTraceability">
            <el-option v-for="task in taskList" :key="task.taskId" :label="task.taskName" :value="task.taskId" />
          </el-select>
        </div>
        <el-button @click="closeTraceabilityDialog">关闭</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="showViewHistory" title="查看记录" direction="rtl" size="380px" class="view-history-drawer">
      <div v-if="viewHistory.length === 0" class="empty-history"><el-empty description="暂无查看记录" /></div>
      <div v-else class="history-list">
        <div v-for="record in viewHistory" :key="record.id" class="history-item" @click="quickViewById(record.logId)">
          <div class="history-header">
            <span class="history-time">{{ formatDateTime(record.viewedAt) }}</span>
            <el-tag :type="getStatusTagType(record.status)" size="small">{{ getStatusLabel(record.status) }}</el-tag>
          </div>
          <div class="history-title">{{ record.taskName }}</div>
          <div class="history-meta">
            <span class="meta-type">{{ getTaskTypeLabel(record.taskType) }}</span>
            <span class="meta-id">#{{ record.logId }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search, Refresh, DataAnalysis, View, List, History, Timer, Warning, Clock, Cpu, Memory, Check, Lock, Top
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  validateCronLogParams, getCronLogList, getCronLogDetail, getCronLogStats, getCronLogTraceability,
  getCronLogTypeList, getCronLogStatusList, getCronLogTriggerTypeList, getCronLogAnomalyTypeList,
  getCronLogRetryStrategyList, getCronTaskList
} from '@/api/log'
import type {
  CronLog, CronLogListParams, CronLogStatsData, CronLogTraceabilityResult, CronLogViewRecord,
  CronTaskType, CronStatus, CronTriggerType, CronAnomalyType, StatsPeriod, CronLogTaskInfo
} from '@/types'

const HISTORY_STORAGE_KEY = 'cron_log_view_history'
const MAX_HISTORY = 20

const hasPermission = ref(true)

const loading = ref(false)
const tableData = ref<CronLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<[string, string] | null>(null)
const warnings = ref<string[]>([])
const statsLoaded = ref(false)
const validTaskConfig = ref(true)
const statsData = ref<CronLogStatsData | null>(null)
const statsPeriod = ref<StatsPeriod>('daily')
const statsPeriodForDialog = ref<StatsPeriod>('daily')
const statsTab = ref('byType')

const filterFormRef = ref<FormInstance>()
const filterForm = reactive<CronLogListParams>({
  pageNum: 1,
  pageSize: 20,
  taskId: undefined,
  taskName: undefined,
  taskType: undefined,
  status: undefined,
  triggerType: undefined,
  anomalyType: undefined,
  startDate: undefined,
  endDate: undefined,
  keyword: undefined
})

const fieldErrors = reactive<Record<string, boolean>>({
  dateRange: false, taskType: false, status: false
})
const fieldShakes = reactive<Record<string, boolean>>({
  dateRange: false, taskType: false, status: false
})
const fieldValid = reactive<Record<string, boolean>>({
  dateRange: false, taskType: false, status: false
})
const focusedField = ref<string | null>(null)

const dateShortcuts = [
  { text: '最近7天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 7); return [s, e] as [Date, Date] } },
  { text: '最近15天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 15); return [s, e] as [Date, Date] } },
  { text: '最近30天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 30); return [s, e] as [Date, Date] } }
]

const periodTabs = computed(() => [
  { value: 'daily', label: '按日' },
  { value: 'weekly', label: '按周' },
  { value: 'monthly', label: '按月' }
])

const typeOptions = ref<{ value: string; label: string }[]>([])
const statusOptions = ref<{ value: string; label: string }[]>([])
const triggerTypeOptions = ref<{ value: string; label: string }[]>([])
const anomalyTypeOptions = ref<{ value: string; label: string }[]>([])
const retryStrategyOptions = ref<{ value: string; label: string }[]>([])
const taskList = ref<CronLogTaskInfo[]>([])

const statCards = computed(() => {
  if (!statsData.value) return []
  return [
    { key: 'total', label: '总执行次数', value: statsData.value.summary.total, icon: List },
    { key: 'success', label: '成功次数', value: statsData.value.summary.successCount, icon: Check },
    { key: 'failed', label: '失败次数', value: statsData.value.summary.failedCount, icon: Warning },
    { key: 'rate', label: '成功率', value: `${statsData.value.summary.successRate.toFixed(1)}%`, icon: DataAnalysis },
    { key: 'avg', label: '平均耗时', value: `${statsData.value.summary.avgDuration.toFixed(0)}ms`, icon: Timer }
  ]
})

const summaryCards = computed(() => {
  if (!statsData.value) return []
  return [
    { key: 'total', label: '总执行次数', value: statsData.value.summary.total, icon: List },
    { key: 'success', label: '成功次数', value: statsData.value.summary.successCount, icon: Check },
    { key: 'failed', label: '失败次数', value: statsData.value.summary.failedCount, icon: Warning },
    { key: 'timeout', label: '超时次数', value: statsData.value.summary.timeoutCount, icon: Clock },
    { key: 'anomaly', label: '异常次数', value: statsData.value.summary.anomalyCount, icon: Warning },
    { key: 'rate', label: '成功率', value: `${statsData.value.summary.successRate.toFixed(1)}%`, icon: DataAnalysis }
  ]
})

const typeStatsList = computed(() => {
  if (!statsData.value) return []
  return Object.entries(statsData.value.byTaskType).map(([key, value]) => ({
    type: key,
    ...value
  }))
})

const detailDialogVisible = ref(false)
const detailStep = ref(0)
const currentLog = ref<CronLog | null>(null)

const statsDialogVisible = ref(false)

const traceabilityDialogVisible = ref(false)
const traceabilityTab = ref('flow')
const traceabilityResult = ref<CronLogTraceabilityResult | null>(null)
const selectedTaskId = ref<string>('')

const cronValidation = reactive({ valid: true, message: '' })
const timeoutValidation = reactive({ valid: true, message: '' })
const retryValidation = reactive({ valid: true, message: '' })

const showViewHistory = ref(false)
const viewHistory = ref<CronLogViewRecord[]>([])

const tableRef = ref<any>()
const tableWrapperRef = ref<HTMLElement>()
const showBackToTop = ref(false)

const handleFieldFocus = (field: string) => { focusedField.value = field }
const handleFieldBlur = (field: string) => { if (focusedField.value === field) focusedField.value = null }

const triggerShake = (field: string) => {
  fieldShakes[field] = true
  setTimeout(() => { fieldShakes[field] = false }, 500)
}

const handleFieldChange = async (field: string) => { await validateField(field) }

const validateField = async (field: string): Promise<boolean> => {
  let valid = true
  let errorMsg = ''
  let warningMsg = ''

  if (field === 'dateRange' && dateRange.value) {
    const [s, e] = dateRange.value
    const sd = new Date(s); const ed = new Date(e)
    const diff = Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24))
    if (diff > 30) { valid = false; errorMsg = '查询时间区间不能超过30天' }
    if (diff > 15 && diff <= 30) { warningMsg = `查询时间跨度为${diff}天，可能影响查询性能` }
    if (sd > ed) { valid = false; errorMsg = '开始日期不能晚于结束日期' }
  }
  if (field === 'taskType' && filterForm.taskType) {
    const validTypes = ['data_sync', 'backup', 'cleanup', 'report', 'notification', 'statistics', 'health_check', 'other']
    if (!validTypes.includes(filterForm.taskType)) { valid = false; errorMsg = '请选择有效的任务类型' }
  }
  if (field === 'status' && filterForm.status) {
    const validStatuses = ['pending', 'running', 'success', 'failed', 'timeout', 'skipped', 'killed']
    if (!validStatuses.includes(filterForm.status)) { valid = false; errorMsg = '请选择有效的执行状态' }
  }

  fieldErrors[field] = !valid
  fieldValid[field] = valid && (field === 'dateRange' ? !!dateRange.value : !!filterForm[field as keyof typeof filterForm])

  if (!valid) {
    triggerShake(field)
    ElMessage.warning(errorMsg)
  } else if (warningMsg) {
    ElMessage.warning(warningMsg)
  }
  return valid
}

const validateAllFields = (): boolean => {
  let ok = true
  ;['dateRange', 'taskType', 'status'].forEach(f => { if (!validateField(f)) ok = false })
  return ok
}

const handleStatusFilterChange = async () => {
  await validateField('status')
  if (filterForm.status) {
    try {
      const params = buildQueryParams()
      const res = await validateCronLogParams(params)
      validTaskConfig.value = res.data.validTaskConfig
      if (!res.data.validTaskConfig) {
        ElMessage.error('任务配置无效，无法展示查询结果')
      }
    } catch (e) {
      console.error(e)
    }
  } else {
    validTaskConfig.value = true
  }
  fetchList()
}

const fetchOptions = async () => {
  try {
    const [types, statuses, triggerTypes, anomalyTypes, retryStrategies, tasks] = await Promise.all([
      getCronLogTypeList(),
      getCronLogStatusList(),
      getCronLogTriggerTypeList(),
      getCronLogAnomalyTypeList(),
      getCronLogRetryStrategyList(),
      getCronTaskList()
    ])
    typeOptions.value = types.data
    statusOptions.value = statuses.data
    triggerTypeOptions.value = triggerTypes.data
    anomalyTypeOptions.value = anomalyTypes.data
    retryStrategyOptions.value = retryStrategies.data
    taskList.value = tasks.data
    if (tasks.data.length > 0) {
      selectedTaskId.value = tasks.data[0].taskId
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchStats = async (period?: StatsPeriod) => {
  try {
    const params: {
      period?: StatsPeriod
      startDate?: string
      endDate?: string
      taskType?: string
    } = {
      period: period || statsPeriod.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    if (filterForm.taskType) {
      params.taskType = filterForm.taskType
    }
    const res = await getCronLogStats(params)
    statsData.value = res.data
    statsLoaded.value = true
  } catch (e) {
    console.error(e)
  }
}

const buildQueryParams = (): CronLogListParams => {
  const p: CronLogListParams = {
    pageNum: page.value,
    pageSize: pageSize.value,
    taskId: filterForm.taskId || undefined,
    taskType: filterForm.taskType || undefined,
    status: filterForm.status || undefined,
    triggerType: filterForm.triggerType || undefined,
    anomalyType: filterForm.anomalyType || undefined,
    keyword: filterForm.keyword || undefined
  }
  if (dateRange.value && dateRange.value.length === 2) {
    p.startDate = dateRange.value[0]
    p.endDate = dateRange.value[1]
  }
  return p
}

const fetchList = async () => {
  if (!validateAllFields()) return
  if (filterForm.status && !validTaskConfig.value) {
    tableData.value = []
    total.value = 0
    return
  }
  loading.value = true; warnings.value = []
  try {
    const res = await getCronLogList(buildQueryParams())
    tableData.value = res.data.list; total.value = res.data.total
  } catch (e: any) { ElMessage.error(e.message || '获取日志列表失败') }
  finally { loading.value = false }
}

const handlePeriodChange = (period: string) => {
  statsPeriod.value = period as StatsPeriod
  fetchStats(period as StatsPeriod)
}

const handleStatsPeriodChange = (period: string) => {
  fetchStats(period as StatsPeriod)
}

const handleSearch = () => { page.value = 1; fetchList(); fetchStats() }
const handleReset = () => {
  filterForm.taskId = undefined; filterForm.taskType = undefined; filterForm.status = undefined
  filterForm.triggerType = undefined; filterForm.anomalyType = undefined; filterForm.keyword = undefined
  dateRange.value = null; warnings.value = []; validTaskConfig.value = true
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k as keyof typeof fieldErrors] = false })
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

const getTaskTypeLabel = (type: CronTaskType): string => {
  const labels: Record<CronTaskType, string> = {
    data_sync: '数据同步',
    backup: '数据备份',
    cleanup: '数据清理',
    report: '报表生成',
    notification: '通知推送',
    statistics: '统计计算',
    health_check: '健康检查',
    other: '其他'
  }
  return labels[type] || type
}

const getTaskTypeTagType = (type: CronTaskType): string => {
  const types: Record<CronTaskType, string> = {
    data_sync: 'primary',
    backup: 'success',
    cleanup: 'warning',
    report: 'info',
    notification: 'primary',
    statistics: 'success',
    health_check: 'success',
    other: 'info'
  }
  return types[type] || 'info'
}

const getStatusLabel = (status: CronStatus): string => {
  const labels: Record<CronStatus, string> = {
    pending: '等待中',
    running: '执行中',
    success: '成功',
    failed: '失败',
    timeout: '超时',
    skipped: '已跳过',
    killed: '已终止'
  }
  return labels[status] || status
}

const getStatusTagType = (status: CronStatus): string => {
  const types: Record<CronStatus, string> = {
    pending: 'info',
    running: 'primary',
    success: 'success',
    failed: 'danger',
    timeout: 'warning',
    skipped: 'info',
    killed: 'danger'
  }
  return types[status] || 'info'
}

const getTriggerTypeLabel = (type: CronTriggerType): string => {
  const labels: Record<CronTriggerType, string> = {
    scheduled: '定时触发',
    manual: '手动触发',
    retry: '重试触发',
    api: 'API触发'
  }
  return labels[type] || type
}

const getAnomalyTypeLabel = (type: CronAnomalyType): string => {
  const labels: Record<CronAnomalyType, string> = {
    none: '无',
    duplicate: '重复执行',
    timeout: '超时执行',
    missed: '漏执行',
    resource_exceeded: '资源超限',
    config_error: '配置错误'
  }
  return labels[type] || type
}

const getAnomalyTagType = (type: CronAnomalyType): string => {
  if (type === 'none') return 'info'
  if (type === 'resource_exceeded') return 'warning'
  return 'danger'
}

const getAnomalyCount = (type: string): number => {
  return traceabilityResult.value?.anomalies.filter(a => a.type === type).length || 0
}

const getRetryStrategyLabel = (strategy: string): string => {
  const item = retryStrategyOptions.value.find(o => o.value === strategy)
  return item?.label || strategy
}

const getPeriodLabel = (period: StatsPeriod): string => {
  const labels: Record<StatsPeriod, string> = {
    daily: '按日统计',
    weekly: '按周统计',
    monthly: '按月统计'
  }
  return labels[period] || period
}

const formatDateTime = (d: string) => !d ? '-' : d.replace('T', ' ').substring(0, 19)

const validateCronExpression = (expr: string): { valid: boolean; message: string } => {
  if (!expr) return { valid: true, message: '' }
  const cronRegex = /^(\*|[0-9,-\/]+)\s+(\*|[0-9,-\/]+)\s+(\*|[0-9,-\/]+)\s+(\*|[0-9,-\/]+)\s+(\*|[0-9,-\/]+)\s*(\*|[0-9,-\/]+)?$/
  if (!cronRegex.test(expr)) {
    return { valid: false, message: 'Cron表达式格式不正确' }
  }
  return { valid: true, message: '' }
}

const validateTimeoutThreshold = (threshold: number): { valid: boolean; message: string } => {
  if (threshold <= 0) {
    return { valid: false, message: '超时阈值必须大于0' }
  }
  if (threshold > 3600000) {
    return { valid: false, message: '超时阈值建议不超过1小时' }
  }
  if (threshold < 1000) {
    return { valid: false, message: '超时阈值建议不小于1秒' }
  }
  return { valid: true, message: '' }
}

const validateRetryStrategy = (strategy: string, maxRetries: number, interval: number): { valid: boolean; message: string } => {
  if (maxRetries < 0) {
    return { valid: false, message: '最大重试次数不能为负数' }
  }
  if (maxRetries > 10) {
    return { valid: false, message: '最大重试次数建议不超过10次' }
  }
  if (interval < 0) {
    return { valid: false, message: '重试间隔不能为负数' }
  }
  if (strategy === 'none' && maxRetries > 0) {
    return { valid: false, message: '重试策略为none时，最大重试次数应为0' }
  }
  return { valid: true, message: '' }
}

const viewDetail = async (row: CronLog) => {
  try {
    const res = await getCronLogDetail(row.id)
    currentLog.value = res.data
    detailStep.value = 0
    detailDialogVisible.value = true
    saveViewRecord(row)
  } catch (e: any) { ElMessage.error(e.message || '获取日志详情失败') }
}

const handleRowDblclick = (row: CronLog) => viewDetail(row)

const closeDetailDialog = () => {
  detailDialogVisible.value = false
  currentLog.value = null
}

const openStatsDialog = () => {
  statsPeriodForDialog.value = statsPeriod.value
  statsDialogVisible.value = true
}

const closeStatsDialog = () => {
  statsDialogVisible.value = false
}

const openTraceabilityDialog = () => {
  traceabilityDialogVisible.value = true
  traceabilityTab.value = 'flow'
  if (selectedTaskId.value) {
    fetchTraceability()
  }
}

const closeTraceabilityDialog = () => {
  traceabilityDialogVisible.value = false
  traceabilityResult.value = null
}

const fetchTraceability = async () => {
  if (!selectedTaskId.value) {
    ElMessage.warning('请选择任务')
    return
  }
  try {
    const params: { taskId: string; startDate?: string; endDate?: string } = {
      taskId: selectedTaskId.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getCronLogTraceability(params)
    traceabilityResult.value = res.data

    const taskConfig = res.data.taskOverview
    if (taskConfig.cronExpression) {
      const cronResult = validateCronExpression(taskConfig.cronExpression)
      cronValidation.valid = cronResult.valid
      cronValidation.message = cronResult.message
    } else {
      cronValidation.valid = true
      cronValidation.message = ''
    }

    if (taskConfig.configParams?.timeoutThreshold !== undefined) {
      const timeoutResult = validateTimeoutThreshold(taskConfig.configParams.timeoutThreshold)
      timeoutValidation.valid = timeoutResult.valid
      timeoutValidation.message = timeoutResult.message
    } else {
      timeoutValidation.valid = true
      timeoutValidation.message = ''
    }

    if (taskConfig.configParams?.retryStrategy !== undefined) {
      const retryResult = validateRetryStrategy(
        taskConfig.configParams.retryStrategy,
        taskConfig.configParams.maxRetries || 0,
        taskConfig.configParams.retryInterval || 0
      )
      retryValidation.valid = retryResult.valid
      retryValidation.message = retryResult.message
    } else {
      retryValidation.valid = true
      retryValidation.message = ''
    }
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
    logId: log.id,
    taskId: log.taskId,
    taskName: log.taskName,
    taskType: log.taskType,
    status: log.status,
    viewedAt: new Date().toISOString()
  }
  viewHistory.value.unshift(rec)
  if (viewHistory.value.length > MAX_HISTORY) {
    viewHistory.value = viewHistory.value.slice(0, MAX_HISTORY)
  }
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(viewHistory.value))
}

const quickViewById = async (logId: number) => {
  showViewHistory.value = false
  const log = tableData.value.find(l => l.id === logId)
  if (log) { viewDetail(log); return }
  try {
    const res = await getCronLogDetail(logId)
    currentLog.value = res.data
    detailStep.value = 0
    detailDialogVisible.value = true
  } catch (e: any) { ElMessage.error(e.message || '获取日志详情失败') }
}

onMounted(async () => {
  loadViewHistory()
  await fetchOptions()
  await Promise.all([fetchList(), fetchStats()])
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

@keyframes scaleIn {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes slideOutDown {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}

@keyframes errorGlow {
  0%, 100% { box-shadow: 0 0 4px rgba(245, 108, 108, 0.4); }
  50% { box-shadow: 0 0 8px rgba(245, 108, 108, 0.6); }
}

.cron-log-page {
  position: relative;
  min-height: calc(100vh - 100px);

  .permission-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    .permission-content {
      text-align: center;
      .permission-title {
        font-size: $font-size-extra-large;
        font-weight: 600;
        color: $color-text-primary;
        margin: 16px 0 8px;
      }
      .permission-desc {
        color: $color-text-regular;
        font-size: $font-size-base;
      }
    }
  }

  .stats-section {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    .stat-card {
      flex: 1;
      min-width: 180px;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.stat-total { background: linear-gradient(135deg, #667eea, #764ba2); }
        &.stat-success { background: linear-gradient(135deg, #11998e, #38ef7d); }
        &.stat-failed { background: linear-gradient(135deg, #eb3349, #f45c43); }
        &.stat-rate { background: linear-gradient(135deg, #f093fb, #f5576c); }
        &.stat-avg { background: linear-gradient(135deg, #4facfe, #00f2fe); }
      }

      .stat-info {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: $color-text-primary;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: $color-text-regular;
          margin-top: 4px;
        }
      }
    }
  }

  .period-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    .tab-item {
      padding: 8px 20px;
      border-radius: 6px;
      background: #f5f7fa;
      cursor: pointer;
      font-size: 14px;
      color: $color-text-regular;
      transition: all 0.3s ease;

      &:hover {
        background: $color-primary-light-9;
        color: $color-primary;
      }

      &.active {
        background: $color-primary;
        color: #fff;
      }
    }
  }

  .filter-card {
    .filter-form {
      .el-form-item {
        position: relative;

        .valid-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: $color-success;
          font-size: 16px;
        }

        &.is-valid {
          :deep(.el-input__wrapper),
          :deep(.el-select__wrapper) {
            box-shadow: 0 0 0 1px $color-success inset;
          }
        }

        &.is-error {
          :deep(.el-input__wrapper),
          :deep(.el-select__wrapper) {
            box-shadow: 0 0 0 1px $color-danger inset;
          }
        }

        &.is-shake {
          animation: shake 0.5s ease;
        }

        :deep(.el-input__wrapper),
        :deep(.el-select__wrapper),
        :deep(.el-date-editor) {
          transition: all 0.3s ease;

          &.is-focus {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
          }
        }
      }
    }

    .config-warning {
      margin-top: 12px;
    }
  }

  .table-card {
    margin-top: 16px;

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .table-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: $color-text-primary;
      }
    }

    .table-wrapper {
      position: relative;
      height: calc(100vh - 480px);
      overflow: auto;

      .cron-table {
        :deep(.el-table__row) {
          transition: background-color 0.2s ease;

          &:nth-child(even) {
            background-color: #fafafa;
          }

          &:hover {
            background-color: #f5f7fa !important;
          }
        }

        .task-name {
          font-weight: 500;
        }

        .resource-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;

          .resource-item {
            display: flex;
            align-items: center;
            gap: 4px;
            justify-content: center;
          }
        }

        .retry-count {
          color: $color-warning;
          font-weight: 500;
        }

        .slow-duration {
          color: $color-danger;
          font-weight: 500;
        }

        .no-anomaly {
          color: $color-text-placeholder;
        }

        .error-glow {
          animation: errorGlow 2s ease-in-out infinite;
        }
      }

      .back-to-top {
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: $color-primary;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
        }
      }
    }

    .table-pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  .card-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .filter-warnings {
    margin-top: 12px;
  }

  .error-message-highlight {
    color: $color-danger;
    font-weight: 500;
  }

  .error-highlight {
    color: $color-danger;
    background: rgba(245, 108, 108, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }
}

:deep(.detail-dialog) {
  .failed-dialog {
    .el-dialog {
      animation: scaleIn 0.3s ease-out;
    }

    &.is-close {
      animation: slideOutDown 0.3s ease-in;
    }
  }

  .log-detail {
    .failure-banner {
      margin-bottom: 20px;

      .retry-strategy-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 8px;
        font-size: 13px;

        .next-retry {
          color: $color-warning;
          font-weight: 500;
        }
      }
    }

    .detail-section {
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: $color-text-primary;
        margin: 0 0 16px 0;
        padding-left: 12px;
        border-left: 4px solid $color-primary;
      }

      .sub-title {
        font-size: 14px;
        font-weight: 500;
        color: $color-text-regular;
        margin: 16px 0 8px 0;
      }

      .json-section {
        margin-top: 16px;

        .json-viewer {
          background: #f5f7fa;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;

          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
            color: $color-text-primary;
          }
        }

        .output-text {
          background: #f5f7fa;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;

          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
            color: $color-text-primary;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }

        .stack-trace {
          background: #fef0f0;
          border: 1px solid #fde2e2;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;

          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
            color: $color-danger;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }

        .anomaly-message {
          background: #fef0f0;
          border: 1px solid #fde2e2;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;

          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
            color: $color-danger;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }
      }

      .optimization-section {
        margin-top: 16px;
      }

      .retry-logs-section,
      .retry-history-section {
        margin-top: 16px;
      }
    }

    .trace-id {
      font-family: 'Consolas', 'Monaco', monospace;
      background: #f5f7fa;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

:deep(.stats-dialog) {
  .stats-content {
    .stats-summary {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .summary-card {
        flex: 1;
        min-width: 140px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;

          &.summary-total { background: linear-gradient(135deg, #667eea, #764ba2); }
          &.summary-success { background: linear-gradient(135deg, #11998e, #38ef7d); }
          &.summary-failed { background: linear-gradient(135deg, #eb3349, #f45c43); }
          &.summary-timeout { background: linear-gradient(135deg, #f6d365, #fda085); }
          &.summary-anomaly { background: linear-gradient(135deg, #fa709a, #fee140); }
          &.summary-rate { background: linear-gradient(135deg, #f093fb, #f5576c); }
        }

        .summary-info {
          .summary-value {
            font-size: 20px;
            font-weight: 600;
            color: $color-text-primary;
          }
          .summary-label {
            font-size: 12px;
            color: $color-text-regular;
            margin-top: 2px;
          }
        }
      }
    }

    .stats-tabs {
      .type-stats,
      .trend-stats,
      .anomaly-stats {
        margin-top: 16px;
      }

      .anomaly-stats {
        .retry-stats-section {
          margin-top: 16px;
        }
      }

      .stats-brief {
        margin-top: 16px;

        .brief-content {
          margin-top: 16px;

          .type-brief-list {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .type-brief-item {
              padding: 16px;
              background: #f5f7fa;
              border-radius: 8px;

              .type-brief-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                .type-brief-rate {
                  font-weight: 500;
                  color: $color-text-regular;
                }
              }

              .type-brief-detail {
                font-size: 13px;
                color: $color-text-regular;
                margin-bottom: 8px;
              }
            }
          }

          .comparison-stats {
            display: flex;
            gap: 24px;
            margin-top: 16px;

            .comparison-item {
              flex: 1;
              text-align: center;
              padding: 24px;
              border-radius: 8px;

              &.normal {
                background: rgba(103, 194, 58, 0.1);
              }

              &.abnormal {
                background: rgba(245, 108, 108, 0.1);
              }

              .comparison-icon {
                margin-bottom: 12px;
              }

              .comparison-value {
                font-size: 32px;
                font-weight: 600;
                color: $color-text-primary;
                margin-bottom: 4px;
              }

              .comparison-label {
                font-size: 14px;
                color: $color-text-regular;
              }
            }
          }
        }
      }
    }
  }

  .period-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: auto;
  }
}

:deep(.traceability-dialog) {
  .traceability-content {
    .task-overview {
      margin-bottom: 20px;

      .config-params-section {
        margin-top: 16px;

        .json-viewer {
          background: #f5f7fa;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;

          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
          }
        }
      }
    }

    .traceability-tabs {
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: $color-text-primary;
        margin: 0 0 16px 0;
        padding-left: 12px;
        border-left: 4px solid $color-primary;
      }

      .sub-title {
        font-size: 14px;
        font-weight: 500;
        color: $color-text-regular;
        margin: 16px 0 8px 0;
      }

      .resource-usage {
        .resource-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;

          span {
            color: $color-text-regular;
          }
        }
      }

      .anomaly-detection {
        .anomaly-list {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .anomaly-item {
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid;

            &.error {
              background: rgba(245, 108, 108, 0.1);
              border-color: $color-danger;
            }

            &.warning {
              background: rgba(230, 162, 60, 0.1);
              border-color: $color-warning;
            }

            &.info {
              background: rgba(64, 158, 255, 0.1);
              border-color: $color-primary;
            }

            .anomaly-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;

              .anomaly-log-id {
                font-size: 13px;
                color: $color-text-regular;
              }

              .anomaly-time {
                font-size: 13px;
                color: $color-text-placeholder;
                margin-left: auto;
              }
            }

            .anomaly-message {
              font-size: 14px;
              color: $color-text-primary;
            }
          }
        }

        .intercepted-tasks {
          ul {
            margin: 8px 0 0 0;
            padding-left: 20px;

            li {
              margin-bottom: 4px;
              font-size: 13px;
              color: $color-text-regular;
            }
          }
        }
      }

      .config-validation {
        .config-issues {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .config-issue-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-radius: 6px;

            &.error {
              background: rgba(245, 108, 108, 0.1);
              color: $color-danger;
            }

            &.warning {
              background: rgba(230, 162, 60, 0.1);
              color: $color-warning;
            }

            &.info {
              background: rgba(64, 158, 255, 0.1);
              color: $color-primary;
            }

            .issue-message {
              flex: 1;
              font-size: 14px;
            }
          }
        }

        .validation-checks {
          margin-top: 24px;
        }
      }

      .optimization-content {
        .optimization-header {
          margin-bottom: 20px;

          .overall-status {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
        }

        .suggestion-list {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .suggestion-item {
            padding: 16px;
            background: #f5f7fa;
            border-radius: 8px;

            .suggestion-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;

              .suggestion-category {
                font-size: 13px;
                color: $color-text-regular;
              }

              .suggestion-title {
                font-size: 14px;
                font-weight: 500;
                color: $color-text-primary;
              }
            }

            .suggestion-desc {
              font-size: 13px;
              color: $color-text-regular;
              margin-bottom: 8px;
              line-height: 1.6;
            }

            .suggestion-action {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              color: $color-primary;
            }
          }
        }
      }
    }
  }

  .task-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: auto;
  }
}

:deep(.view-history-drawer) {
  .empty-history {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .history-item {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: $color-primary-light-9;
        transform: translateX(4px);
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .history-time {
          font-size: 12px;
          color: $color-text-placeholder;
        }
      }

      .history-title {
        font-size: 14px;
        font-weight: 500;
        color: $color-text-primary;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .history-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: $color-text-regular;

        .meta-id {
          color: $color-text-placeholder;
          font-family: 'Consolas', 'Monaco', monospace;
        }
      }
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
