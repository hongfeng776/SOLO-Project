<template>
  <div class="system-log-page">
    <div v-if="!hasPermission" class="permission-overlay">
      <div class="permission-content">
        <el-icon :size="64" color="#f56c6c"><Lock /></el-icon>
        <div class="permission-title">权限不足</div>
        <div class="permission-desc">您没有访问系统运行日志的权限，请联系管理员申请</div>
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

      <div class="status-tabs">
        <div
          v-for="tab in statusTabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeStatus === tab.value }"
          @click="handleStatusChange(tab.value)"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-count">{{ tab.count }}</span>
          <span class="tab-percent" v-if="tab.percent !== undefined">{{ tab.percent.toFixed(1) }}%</span>
        </div>
      </div>

      <div class="filter-card card-wrapper">
        <el-form :inline="true" :model="filterForm" class="filter-form" ref="filterFormRef">
          <el-form-item label="日志类型" prop="logType" :class="{ 'is-error': fieldErrors.logType, 'is-shake': fieldShakes.logType }">
            <el-select v-model="filterForm.logType" placeholder="全部" clearable style="width: 140px"
              @focus="handleFieldFocus('logType')" @blur="handleFieldBlur('logType')" @change="handleFieldChange('logType')">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属模块" prop="module" :class="{ 'is-error': fieldErrors.module, 'is-shake': fieldShakes.module }">
            <el-select v-model="filterForm.module" placeholder="全部" clearable style="width: 140px"
              @focus="handleFieldFocus('module')" @blur="handleFieldBlur('module')" @change="handleFieldChange('module')">
              <el-option v-for="item in moduleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="响应状态" prop="responseStatus" :class="{ 'is-error': fieldErrors.responseStatus, 'is-shake': fieldShakes.responseStatus }">
            <el-input v-model="filterForm.responseStatus" placeholder="状态码" clearable style="width: 120px" type="number"
              @focus="handleFieldFocus('responseStatus')" @blur="handleFieldBlur('responseStatus')" @change="handleFieldChange('responseStatus')" />
          </el-form-item>
          <el-form-item label="最慢耗时" prop="durationMin" :class="{ 'is-error': fieldErrors.durationMin, 'is-shake': fieldShakes.durationMin }">
            <el-input v-model="filterForm.durationMin" placeholder="ms" clearable style="width: 100px" type="number"
              @focus="handleFieldFocus('durationMin')" @blur="handleFieldBlur('durationMin')" @change="handleFieldChange('durationMin')" />
          </el-form-item>
          <el-form-item label="仅高危">
            <el-switch v-model="filterForm.isHighRisk" active-text="开" inactive-text="关" />
          </el-form-item>
          <el-form-item label="时间区间" prop="dateRange" :class="{ 'is-error': fieldErrors.dateRange, 'is-shake': fieldShakes.dateRange }">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
              :shortcuts="dateShortcuts" style="width: 280px"
              @focus="handleFieldFocus('dateRange')" @blur="handleFieldBlur('dateRange')" @change="handleFieldChange('dateRange')" />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filterForm.keyword" placeholder="标题/内容/IP" clearable style="width: 180px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            <el-button type="success" :icon="Download" @click="openBackupDialog" :disabled="!permission?.canBackup">备份日志</el-button>
            <el-button type="danger" :icon="Delete" @click="openCleanupDialog" :disabled="!permission?.canCleanup">清理日志</el-button>
            <el-button type="warning" :icon="DataAnalysis" @click="openTraceabilityDialog" :disabled="!permission?.canViewTraceability">异常溯源</el-button>
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
            <span>系统日志列表</span>
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
            stripe border resizable @row-dblclick="handleRowDblclick" class="log-table">
            <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
            <el-table-column prop="id" label="日志ID" width="80" align="center" />
            <el-table-column prop="logTypeLabel" label="类型" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getTypeTagType(row.logType)" size="small">{{ row.logTypeLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="logLevelLabel" label="级别" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.logLevel)" size="small" :class="{ 'error-glow': row.logLevel === 'error' || row.logLevel === 'critical' }">
                  {{ row.logLevelLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="moduleLabel" label="模块" width="110" align="center" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column label="请求信息" width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="request-method" :class="row.requestMethod">{{ row.requestMethod }}</span>
                <span class="request-url">{{ row.requestUrl || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="响应状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getResponseStatusType(row.responseStatus)" size="small">{{ row.responseStatus || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="耗时(ms)" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'slow-duration': row.duration >= 3000 }">{{ row.duration || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="风险" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isHighRisk" type="danger" size="small" effect="dark"><el-icon><Warning /></el-icon>高危</el-tag>
                <span v-else class="no-risk">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="130" align="center" />
            <el-table-column prop="username" label="用户" width="100" align="center" />
            <el-table-column prop="createdAt" label="时间" width="170" align="center">
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

    <el-dialog v-model="detailDialogVisible" :title="`日志详情 #${currentLog?.id || ''}`" width="900px"
      class="detail-dialog" :close-on-click-modal="false" @close="closeDetailDialog">
      <div v-if="currentLog" class="log-detail">
        <el-steps :active="detailStep" finish-status="success" simple style="margin-bottom: 24px">
          <el-step title="基本信息" />
          <el-step title="请求信息" />
          <el-step title="响应数据" />
          <el-step title="错误堆栈" />
        </el-steps>

        <div v-show="detailStep === 0" class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
            <el-descriptions-item label="追踪ID"><span class="trace-id">{{ currentLog.traceId || '-' }}</span></el-descriptions-item>
            <el-descriptions-item label="日志类型"><el-tag :type="getTypeTagType(currentLog.logType)">{{ currentLog.logTypeLabel }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="日志级别"><el-tag :type="getLevelTagType(currentLog.logLevel)">{{ currentLog.logLevelLabel }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="所属模块">{{ currentLog.moduleLabel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="标题">{{ currentLog.title || '-' }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ currentLog.duration || 0 }} ms</el-descriptions-item>
            <el-descriptions-item label="高危风险"><el-tag :type="currentLog.isHighRisk ? 'danger' : 'success'">{{ currentLog.isHighRisk ? '是' : '否' }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="服务器">{{ currentLog.serverName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="进程ID">{{ currentLog.processId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="线程ID">{{ currentLog.threadId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户">{{ currentLog.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="IP地址">{{ currentLog.ip || '-' }}</el-descriptions-item>
            <el-descriptions-item label="记录时间" :span="2">{{ formatDateTime(currentLog.createdAt) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-show="detailStep === 1" class="detail-section">
          <h4 class="section-title">请求信息</h4>
          <el-descriptions :column="2" border v-if="currentLog.requestMethod || currentLog.requestUrl">
            <el-descriptions-item label="请求方法"><el-tag :type="getMethodTagType(currentLog.requestMethod)">{{ currentLog.requestMethod || '-' }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="请求URL">{{ currentLog.requestUrl || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="currentLog.requestParams" class="json-section">
            <h5 class="sub-title">请求参数</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.requestParams, null, 2) }}</pre></div>
          </div>
          <div v-if="currentLog.requestBody" class="json-section">
            <h5 class="sub-title">请求体</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.requestBody, null, 2) }}</pre></div>
          </div>
          <div v-if="currentLog.userAgent" class="json-section">
            <h5 class="sub-title">User-Agent</h5>
            <div class="ua-text">{{ currentLog.userAgent }}</div>
          </div>
          <el-empty v-if="!currentLog.requestMethod && !currentLog.requestUrl && !currentLog.requestParams && !currentLog.requestBody" description="无请求信息" />
        </div>

        <div v-show="detailStep === 2" class="detail-section">
          <h4 class="section-title">响应数据</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="响应状态">
              <el-tag :type="getResponseStatusType(currentLog.responseStatus)">{{ currentLog.responseStatus || '-' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="错误码">{{ currentLog.errorCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="错误名称">{{ currentLog.errorName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ currentLog.duration || 0 }} ms</el-descriptions-item>
          </el-descriptions>
          <div v-if="currentLog.responseData" class="json-section">
            <h5 class="sub-title">响应内容</h5>
            <div class="json-viewer"><pre>{{ JSON.stringify(currentLog.responseData, null, 2) }}</pre></div>
          </div>
          <el-empty v-if="!currentLog.responseData && !currentLog.responseStatus" description="无响应数据" />
        </div>

        <div v-show="detailStep === 3" class="detail-section">
          <h4 class="section-title">错误堆栈</h4>
          <div v-if="currentLog.stackTrace" class="stack-trace">
            <pre>{{ currentLog.stackTrace }}</pre>
          </div>
          <div v-else-if="currentLog.content" class="log-content">
            <pre>{{ currentLog.content }}</pre>
          </div>
          <el-empty v-else description="无错误堆栈信息" />
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

    <el-dialog v-model="backupDialogVisible" title="备份日志" width="520px" class="backup-dialog" @close="closeBackupDialog">
      <div class="backup-content">
        <el-form :model="backupForm" ref="backupFormRef" label-width="100px">
          <el-form-item label="备份范围">
            <el-radio-group v-model="backupForm.scope">
              <el-radio value="range">按时间范围</el-radio>
              <el-radio value="all">全部日志</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="时间范围" v-if="backupForm.scope === 'range'">
            <el-date-picker v-model="backupDateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
          <el-form-item label="日志类型">
            <el-select v-model="backupForm.logType" placeholder="全部类型" clearable style="width: 100%">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属模块">
            <el-select v-model="backupForm.module" placeholder="全部模块" clearable style="width: 100%">
              <el-option v-for="item in moduleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <div v-if="backingUp" class="backup-progress">
          <el-progress :percentage="backupProgress" :status="backupProgress === 100 ? 'success' : undefined" :stroke-width="14" />
          <div class="progress-text">
            正在备份：{{ backupProcessed }} / {{ backupTotal }} 条
          </div>
        </div>
        <div v-if="backupSuccess" class="backup-success">
          <el-alert type="success" :closable="false" show-icon>
            <template #title>
              备份成功！共备份 {{ backupResult?.backedUp || 0 }} 条日志
            </template>
            <div class="backup-file-info">
              <div>备份文件：{{ backupResult?.backupFile }}</div>
              <div>存储路径：{{ backupResult?.backupPath }}</div>
            </div>
          </el-alert>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeBackupDialog" :disabled="backingUp">取消</el-button>
        <el-button type="primary" :icon="backingUp ? Loading : Download" @click="handleBackup" :loading="backingUp">
          {{ backingUp ? '备份中...' : '开始备份' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cleanupDialogVisible" title="清理日志" width="520px" class="cleanup-dialog" @close="closeCleanupDialog">
      <div class="cleanup-content">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>清理说明</template>
          系统将自动保留错误和高危日志，仅清理正常日志。已备份的日志将被标记为已清理。
        </el-alert>
        <el-form :model="cleanupForm" ref="cleanupFormRef" label-width="100px">
          <el-form-item label="清理方式">
            <el-radio-group v-model="cleanupForm.mode">
              <el-radio value="days">按天数</el-radio>
              <el-radio value="range">按时间范围</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="清理天数" v-if="cleanupForm.mode === 'days'">
            <el-input-number v-model="cleanupForm.days" :min="1" :max="365" style="width: 100%" />
            <div class="form-tip">将清理 {{ cleanupForm.days }} 天前的日志</div>
          </el-form-item>
          <el-form-item label="时间范围" v-if="cleanupForm.mode === 'range'">
            <el-date-picker v-model="cleanupDateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
          <el-form-item label="日志类型">
            <el-select v-model="cleanupForm.logType" placeholder="全部类型" clearable style="width: 100%">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属模块">
            <el-select v-model="cleanupForm.module" placeholder="全部模块" clearable style="width: 100%">
              <el-option v-for="item in moduleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <div v-if="cleaningUp" class="cleanup-progress">
          <el-progress :percentage="cleanupProgress" :status="cleanupProgress === 100 ? 'success' : undefined" :stroke-width="14" />
          <div class="progress-text">
            正在清理：{{ cleanupProcessed }} / {{ cleanupTotal }} 条
            <span v-if="cleanupResult?.protectedCount" class="protected-text">(已保护 {{ cleanupResult.protectedCount }} 条高危/错误日志)</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeCleanupDialog" :disabled="cleaningUp">取消</el-button>
        <el-button type="danger" :icon="cleaningUp ? Loading : Delete" @click="handleCleanup" :loading="cleaningUp">
          {{ cleaningUp ? '清理中...' : '开始清理' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceabilityDialogVisible" title="异常溯源分析" width="1100px" class="traceability-dialog" @close="closeTraceabilityDialog">
      <div v-if="traceabilityResult" class="traceability-content">
        <div class="stability-section">
          <div class="stability-score">
            <div class="score-circle" :class="stabilityScore.level">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#ebeef5" stroke-width="8" />
                <circle cx="60" cy="60" r="54" fill="none" :stroke="stabilityScore.color" stroke-width="8"
                  stroke-linecap="round" :stroke-dasharray="`${stabilityScore.score * 3.3929} 339.29`"
                  transform="rotate(-90 60 60)" class="score-progress" />
              </svg>
              <div class="score-inner">
                <div class="score-value">{{ stabilityScore.score }}</div>
                <div class="score-label" :style="{ color: stabilityScore.color }">{{ stabilityScore.levelLabel }}</div>
              </div>
            </div>
            <div class="stability-info">
              <div class="info-row"><span class="info-label">总日志数</span><span class="info-value">{{ stabilityScore.totalLogs }}</span></div>
              <div class="info-row"><span class="info-label">错误日志</span><span class="info-value error">{{ stabilityScore.errorLogs }}</span></div>
              <div class="info-row"><span class="info-label">警告日志</span><span class="info-value warning">{{ stabilityScore.warningLogs }}</span></div>
              <div class="info-row"><span class="info-label">慢接口</span><span class="info-value slow">{{ stabilityScore.slowApiLogs }}</span></div>
              <div class="info-row"><span class="info-label">高危日志</span><span class="info-value danger">{{ stabilityScore.highRiskLogs }}</span></div>
            </div>
          </div>
        </div>

        <el-tabs v-model="traceabilityTab" class="traceability-tabs">
          <el-tab-pane label="异常概览" name="overview">
            <div class="overview-section">
              <div class="overview-stats">
                <div class="overview-card" v-for="item in overviewStats" :key="item.key">
                  <el-icon :size="20" :color="item.color"><component :is="item.icon" /></el-icon>
                  <div class="overview-count">{{ item.count }}</div>
                  <div class="overview-label">{{ item.label }}</div>
                </div>
              </div>
              <div class="abnormal-list">
                <h4 class="list-title">异常日志列表</h4>
                <el-table :data="traceabilityResult.abnormalLogs.slice(0, 10)" size="small" border>
                  <el-table-column prop="id" label="ID" width="70" align="center" />
                  <el-table-column prop="logLevelLabel" label="级别" width="90" align="center">
                    <template #default="{ row }">
                      <el-tag :type="getLevelTagType(row.logLevel)" size="small">{{ row.logLevelLabel }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
                  <el-table-column prop="moduleLabel" label="模块" width="100" align="center" />
                  <el-table-column prop="createdAt" label="时间" width="160" align="center">
                    <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="高频错误" name="errors">
            <div class="errors-section">
              <div v-if="traceabilityResult.statistics.errorTypes.length === 0" class="empty-state">
                <el-empty description="暂无高频错误数据" />
              </div>
              <div v-else class="error-type-list">
                <div v-for="(error, idx) in traceabilityResult.statistics.errorTypes" :key="idx" class="error-type-item">
                  <div class="error-header">
                    <el-tag type="danger" size="small">{{ error.count }}次</el-tag>
                    <span class="error-name">{{ error.name }}</span>
                    <span class="error-code" v-if="error.errorCode">{{ error.errorCode }}</span>
                    <span class="error-module">{{ error.module }}</span>
                  </div>
                  <div class="error-time">
                    <span>首次出现：{{ formatDateTime(error.firstOccur) }}</span>
                    <span>最近出现：{{ formatDateTime(error.lastOccur) }}</span>
                  </div>
                  <div class="error-samples" v-if="error.samples && error.samples.length > 0">
                    <el-collapse>
                      <el-collapse-item title="查看错误样例" :name="`sample-${idx}`">
                        <div v-for="(sample, sIdx) in error.samples" :key="sIdx" class="error-sample">
                          <div class="sample-time">#{{ sample.id }} - {{ formatDateTime(sample.createdAt) }}</div>
                          <pre class="sample-stack">{{ sample.stackTrace }}</pre>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="慢接口分析" name="slow">
            <div class="slow-section">
              <div v-if="traceabilityResult.statistics.slowApis.length === 0" class="empty-state">
                <el-empty description="暂无慢接口数据" />
              </div>
              <div v-else class="slow-api-list">
                <div v-for="(api, idx) in traceabilityResult.statistics.slowApis" :key="idx" class="slow-api-item">
                  <div class="api-header">
                    <span class="api-method" :class="api.method">{{ api.method }}</span>
                    <span class="api-url">{{ api.url }}</span>
                  </div>
                  <div class="api-stats">
                    <el-tag type="danger" size="small">{{ api.duration }}ms</el-tag>
                    <span class="api-count">调用 {{ api.count }} 次</span>
                    <span class="api-last">最近：{{ formatDateTime(api.lastOccur) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="优化建议" name="optimization">
            <div class="optimization-section">
              <div class="optimization-summary" v-if="traceabilityResult.optimizationReport">
                <el-alert type="info" :closable="false" show-icon>
                  <template #title>分析报告摘要</template>
                  {{ traceabilityResult.optimizationReport.summary }}
                  <div class="report-meta">
                    <span>统计周期：{{ traceabilityResult.optimizationReport.period }}</span>
                    <span>生成时间：{{ formatDateTime(traceabilityResult.optimizationReport.generatedAt) }}</span>
                  </div>
                </el-alert>
              </div>
              <div class="optimization-issues">
                <h4 class="list-title">发现问题 ({{ traceabilityResult.optimizationReport?.issues.length || 0 }})</h4>
                <div v-if="!traceabilityResult.optimizationReport?.issues.length" class="empty-state">
                  <el-empty description="未发现明显问题" :image-size="80" />
                </div>
                <div v-else class="issue-list">
                  <div v-for="(issue, idx) in traceabilityResult.optimizationReport.issues" :key="idx" class="issue-item">
                    <div class="issue-header">
                      <el-tag :type="getSeverityTagType(issue.severity)" size="small">{{ getSeverityLabel(issue.severity) }}</el-tag>
                      <span class="issue-type">{{ issue.type }}</span>
                    </div>
                    <div class="issue-desc">{{ issue.description }}</div>
                    <ul class="issue-details" v-if="issue.details && issue.details.length">
                      <li v-for="(detail, dIdx) in issue.details" :key="dIdx">{{ detail }}</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="optimization-suggestions">
                <h4 class="list-title">优化建议 ({{ traceabilityResult.optimizationReport?.suggestions.length || 0 }})</h4>
                <div v-if="!traceabilityResult.optimizationReport?.suggestions.length" class="empty-state">
                  <el-empty description="暂无优化建议" :image-size="80" />
                </div>
                <div v-else class="suggestion-list">
                  <div v-for="(suggestion, idx) in traceabilityResult.optimizationReport.suggestions" :key="idx" class="suggestion-item">
                    <div class="suggestion-header">
                      <el-tag :type="getPriorityTagType(suggestion.priority)" size="small">{{ getPriorityLabel(suggestion.priority) }}</el-tag>
                      <span class="suggestion-title">{{ suggestion.title }}</span>
                    </div>
                    <div class="suggestion-desc">{{ suggestion.description }}</div>
                    <div class="suggestion-affected">影响范围：{{ suggestion.affected }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <el-drawer v-model="showViewHistory" title="查看记录" direction="rtl" size="380px" class="view-history-drawer">
      <div v-if="viewHistory.length === 0" class="empty-history"><el-empty description="暂无查看记录" /></div>
      <div v-else class="history-list">
        <div v-for="record in viewHistory" :key="record.id" class="history-item" @click="quickViewById(record.logId)">
          <div class="history-header">
            <span class="history-time">{{ formatDateTime(record.viewedAt) }}</span>
            <el-tag :type="getLevelTagType(record.logLevel)" size="small">{{ record.logLevel }}</el-tag>
          </div>
          <div class="history-title">{{ record.logTitle }}</div>
          <div class="history-meta">
            <span class="meta-type">{{ record.logType }}</span>
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
  Search, Refresh, Download, Delete, DataAnalysis, View, List, History,
  Document, Sunny, Warning, Timer, Lock, Top, Loading
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  getSystemLogPermission, getSystemLogList, getSystemLogDetail, getSystemLogStats,
  getSystemLogTypeList, getSystemLogLevelList, getSystemLogModuleList,
  getSystemLogTraceability, backupSystemLogs, cleanupSystemLogs
} from '@/api/log'
import type {
  SystemLog, SystemLogListParams, SystemLogStatsData, SystemLogPermission,
  SystemLogBackupParams, SystemLogBackupResult, SystemLogCleanupParams,
  SystemLogCleanupResult, SystemLogTraceabilityResult, SystemLogViewRecord,
  SystemLogOption, SystemLogType, SystemLogLevel
} from '@/types'

const HISTORY_STORAGE_KEY = 'system_log_view_history'
const MAX_HISTORY = 20

const hasPermission = ref(true)
const permission = ref<SystemLogPermission | null>(null)

const loading = ref(false)
const tableData = ref<SystemLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<[string, string] | null>(null)
const warnings = ref<string[]>([])
const statsLoaded = ref(false)
const stats = ref<SystemLogStatsData>({
  totalCount: 0, todayCount: 0, highRiskCount: 0, slowApiCount: 0,
  byType: [], byLevel: [], levelCounts: { info: 0, warning: 0, error: 0, critical: 0 },
  levelPercentages: { info: 0, warning: 0, error: 0, critical: 0 },
  last7Days: [], topErrorModules: [], peakHours: []
})

const filterFormRef = ref<FormInstance>()
const filterForm = reactive<SystemLogListParams>({
  page: 1, pageSize: 20,
  logType: undefined, logLevel: undefined, module: undefined,
  responseStatus: undefined, durationMin: undefined, isHighRisk: undefined,
  startDate: undefined, endDate: undefined, keyword: undefined
})

const activeStatus = ref('all')

const fieldErrors = reactive<Record<string, boolean>>({
  logType: false, module: false, responseStatus: false, durationMin: false, dateRange: false
})
const fieldShakes = reactive<Record<string, boolean>>({
  logType: false, module: false, responseStatus: false, durationMin: false, dateRange: false
})
const focusedField = ref<string | null>(null)

const dateShortcuts = [
  { text: '最近7天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 7); return [s, e] as [Date, Date] } },
  { text: '最近30天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 30); return [s, e] as [Date, Date] } }
]

const typeOptions = ref<SystemLogOption[]>([])
const levelOptions = ref<SystemLogOption[]>([])
const moduleOptions = ref<SystemLogOption[]>([])

const statCards = computed(() => [
  { key: 'total', label: '总日志数', value: stats.value.totalCount, icon: Document },
  { key: 'today', label: '今日日志', value: stats.value.todayCount, icon: Sunny },
  { key: 'risk', label: '高危日志', value: stats.value.highRiskCount, icon: Warning },
  { key: 'slow', label: '慢接口', value: stats.value.slowApiCount, icon: Timer }
])

const statusTabs = computed(() => {
  const total = stats.value.levelCounts.info + stats.value.levelCounts.warning + stats.value.levelCounts.error + stats.value.levelCounts.critical
  return [
    { value: 'all', label: '全部', count: total, percent: 100 },
    { value: 'info', label: '正常', count: stats.value.levelCounts.info, percent: stats.value.levelPercentages.info },
    { value: 'warning', label: '警告', count: stats.value.levelCounts.warning, percent: stats.value.levelPercentages.warning },
    { value: 'error', label: '错误', count: stats.value.levelCounts.error + stats.value.levelCounts.critical, percent: stats.value.levelPercentages.error + stats.value.levelPercentages.critical }
  ]
})

const detailDialogVisible = ref(false)
const detailStep = ref(0)
const currentLog = ref<SystemLog | null>(null)

const backupDialogVisible = ref(false)
const backupFormRef = ref<FormInstance>()
const backupDateRange = ref<[string, string] | null>(null)
const backupForm = reactive({
  scope: 'range',
  logType: undefined as SystemLogType | undefined,
  module: undefined as string | undefined
})
const backingUp = ref(false)
const backupProgress = ref(0)
const backupProcessed = ref(0)
const backupTotal = ref(0)
const backupSuccess = ref(false)
const backupResult = ref<SystemLogBackupResult | null>(null)

const cleanupDialogVisible = ref(false)
const cleanupFormRef = ref<FormInstance>()
const cleanupDateRange = ref<[string, string] | null>(null)
const cleanupForm = reactive({
  mode: 'days',
  days: 30,
  logType: undefined as SystemLogType | undefined,
  module: undefined as string | undefined
})
const cleaningUp = ref(false)
const cleanupProgress = ref(0)
const cleanupProcessed = ref(0)
const cleanupTotal = ref(0)
const cleanupResult = ref<SystemLogCleanupResult | null>(null)

const traceabilityDialogVisible = ref(false)
const traceabilityTab = ref('overview')
const traceabilityResult = ref<SystemLogTraceabilityResult | null>(null)

const stabilityScore = computed(() => {
  const score = traceabilityResult.value?.stabilityScore
  if (!score) return { score: 0, level: 'poor', levelLabel: '较差', color: '#f56c6c', totalLogs: 0, errorLogs: 0, warningLogs: 0, slowApiLogs: 0, highRiskLogs: 0 }
  const colorMap = { excellent: '#67c23a', good: '#409eff', fair: '#e6a23c', poor: '#f56c6c' }
  return {
    ...score,
    color: colorMap[score.level]
  }
})

const overviewStats = computed(() => {
  const stats = traceabilityResult.value?.statistics
  if (!stats) return []
  return [
    { key: 'total', label: '异常总数', count: stats.totalAbnormal, icon: Warning, color: '#f56c6c' },
    { key: 'errors', label: '错误类型', count: stats.errorTypes.length, icon: Document, color: '#e6a23c' },
    { key: 'slow', label: '慢接口数', count: stats.slowApis.length, icon: Timer, color: '#f56c6c' },
    { key: 'modules', label: '影响模块', count: stats.byModule.length, icon: List, color: '#409eff' }
  ]
})

const showViewHistory = ref(false)
const viewHistory = ref<SystemLogViewRecord[]>([])

const tableRef = ref<any>()
const tableWrapperRef = ref<HTMLElement>()
const showBackToTop = ref(false)

const checkPermission = async () => {
  try {
    const res = await getSystemLogPermission()
    permission.value = res.data
    hasPermission.value = res.data.canViewSystem || res.data.canViewApi || res.data.canViewError
  } catch (e: any) {
    hasPermission.value = false
    ElMessage.error(e.message || '获取权限失败')
  }
}

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
  if (field === 'dateRange' && dateRange.value) {
    const [s, e] = dateRange.value
    const sd = new Date(s); const ed = new Date(e)
    const diff = Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24))
    if (diff > 30) { valid = false; errorMsg = '查询时间区间不能超过30天' }
    if (sd > ed) { valid = false; errorMsg = '开始日期不能晚于结束日期' }
  }
  if (field === 'responseStatus' && filterForm.responseStatus) {
    const status = Number(filterForm.responseStatus)
    if (isNaN(status) || status < 100 || status > 599) { valid = false; errorMsg = '请输入有效的HTTP状态码' }
  }
  if (field === 'durationMin' && filterForm.durationMin) {
    const duration = Number(filterForm.durationMin)
    if (isNaN(duration) || duration < 0) { valid = false; errorMsg = '请输入有效的耗时值' }
  }
  fieldErrors[field] = !valid
  if (!valid) { triggerShake(field); ElMessage.warning(errorMsg) }
  return valid
}

const validateAllFields = (): boolean => {
  let ok = true
  ;['logType', 'module', 'responseStatus', 'durationMin', 'dateRange'].forEach(f => { if (!validateField(f)) ok = false })
  return ok
}

const fetchOptions = async () => {
  try {
    const [types, levels, modules] = await Promise.all([
      getSystemLogTypeList(),
      getSystemLogLevelList(),
      getSystemLogModuleList()
    ])
    typeOptions.value = types.data
    levelOptions.value = levels.data
    moduleOptions.value = modules.data
  } catch (e) { console.error(e) }
}

const fetchStats = async () => {
  try {
    const params = dateRange.value && dateRange.value.length === 2
      ? { startDate: dateRange.value[0], endDate: dateRange.value[1] }
      : undefined
    const res = await getSystemLogStats(params)
    stats.value = res.data
    statsLoaded.value = true
  } catch (e) { console.error(e) }
}

const buildQueryParams = (): SystemLogListParams => {
  const p: SystemLogListParams = {
    page: page.value, pageSize: pageSize.value,
    logType: filterForm.logType,
    logLevel: activeStatus.value === 'all' ? filterForm.logLevel : activeStatus.value as SystemLogLevel,
    module: filterForm.module || undefined,
    responseStatus: filterForm.responseStatus ? Number(filterForm.responseStatus) : undefined,
    durationMin: filterForm.durationMin ? Number(filterForm.durationMin) : undefined,
    isHighRisk: filterForm.isHighRisk || undefined,
    keyword: filterForm.keyword || undefined
  }
  if (dateRange.value && dateRange.value.length === 2) { p.startDate = dateRange.value[0]; p.endDate = dateRange.value[1] }
  return p
}

const fetchList = async () => {
  if (!validateAllFields()) return
  loading.value = true; warnings.value = []
  try {
    const res = await getSystemLogList(buildQueryParams())
    tableData.value = res.data.list; total.value = res.data.total
    if (res.data.warnings && res.data.warnings.length > 0) warnings.value = res.data.warnings
  } catch (e: any) { ElMessage.error(e.message || '获取日志列表失败') }
  finally { loading.value = false }
}

const handleStatusChange = (status: string) => {
  activeStatus.value = status
  page.value = 1
  fetchList()
}

const handleSearch = () => { page.value = 1; fetchList(); fetchStats() }
const handleReset = () => {
  filterForm.logType = undefined; filterForm.logLevel = undefined; filterForm.module = undefined
  filterForm.responseStatus = undefined; filterForm.durationMin = undefined; filterForm.isHighRisk = undefined
  filterForm.keyword = undefined; dateRange.value = null; warnings.value = []
  activeStatus.value = 'all'
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k as keyof typeof fieldErrors] = false })
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

const getTypeTagType = (type: string) => ({
  system: 'info', api: 'primary', error: 'danger', performance: 'warning', security: 'danger', cron: 'info'
}[type] || 'info')

const getLevelTagType = (level: string) => ({
  debug: 'info', info: 'success', warning: 'warning', error: 'danger', critical: 'danger'
}[level] || 'info')

const getMethodTagType = (method: string) => ({
  GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger', PATCH: 'info'
}[method] || 'info')

const getResponseStatusType = (status: number) => {
  if (!status) return 'info'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'danger'
}

const getSeverityTagType = (severity: string) => ({ high: 'danger', medium: 'warning', low: 'info' }[severity] || 'info')
const getSeverityLabel = (severity: string) => ({ high: '高', medium: '中', low: '低' }[severity] || severity)
const getPriorityTagType = (priority: string) => ({ high: 'danger', medium: 'warning', low: 'info' }[priority] || 'info')
const getPriorityLabel = (priority: string) => ({ high: '高优先级', medium: '中优先级', low: '低优先级' }[priority] || priority)

const formatDateTime = (d: string) => !d ? '-' : d.replace('T', ' ').substring(0, 19)

const viewDetail = async (row: SystemLog) => {
  try {
    const res = await getSystemLogDetail(row.id)
    currentLog.value = res.data; detailStep.value = 0; detailDialogVisible.value = true
    saveViewRecord(row)
  } catch (e: any) { ElMessage.error(e.message || '获取日志详情失败') }
}

const handleRowDblclick = (row: SystemLog) => viewDetail(row)
const closeDetailDialog = () => { detailDialogVisible.value = false; currentLog.value = null }

const openBackupDialog = () => {
  backupDateRange.value = dateRange.value
  backupForm.logType = filterForm.logType
  backupForm.module = filterForm.module
  backingUp.value = false; backupProgress.value = 0; backupSuccess.value = false; backupResult.value = null
  backupDialogVisible.value = true
}
const closeBackupDialog = () => { if (backingUp.value) return; backupDialogVisible.value = false }

const handleBackup = async () => {
  if (backupForm.scope === 'range' && (!backupDateRange.value || backupDateRange.value.length !== 2)) {
    ElMessage.warning('请选择备份的时间范围'); return
  }
  const params: SystemLogBackupParams = backupForm.scope === 'all'
    ? { startDate: '2000-01-01', endDate: new Date().toISOString().split('T')[0], logType: backupForm.logType, module: backupForm.module }
    : { startDate: backupDateRange.value![0], endDate: backupDateRange.value![1], logType: backupForm.logType, module: backupForm.module }
  backingUp.value = true; backupProgress.value = 0; backupProcessed.value = 0; backupSuccess.value = false
  try {
    for (let i = 1; i <= 90; i += 10) {
      await new Promise(r => setTimeout(r, 80))
      backupProgress.value = i; backupProcessed.value = Math.floor((i / 100) * stats.value.totalCount)
    }
    const res = await backupSystemLogs(params)
    backupProgress.value = 100; backupResult.value = res.data
    backupTotal.value = res.data.total; backupProcessed.value = res.data.backedUp; backupSuccess.value = true
    ElMessage.success(`备份成功，共备份 ${res.data.backedUp} 条日志`)
    setTimeout(() => { fetchStats() }, 500)
  } catch (e: any) { ElMessage.error(e.message || '备份失败'); backingUp.value = false }
}

const openCleanupDialog = () => {
  cleanupDateRange.value = dateRange.value
  cleanupForm.logType = filterForm.logType
  cleanupForm.module = filterForm.module
  cleaningUp.value = false; cleanupProgress.value = 0; cleanupResult.value = null
  cleanupDialogVisible.value = true
}
const closeCleanupDialog = () => { if (cleaningUp.value) return; cleanupDialogVisible.value = false }

const handleCleanup = async () => {
  let params: SystemLogCleanupParams
  if (cleanupForm.mode === 'days') {
    params = { days: cleanupForm.days, logType: cleanupForm.logType, module: cleanupForm.module }
  } else {
    if (!cleanupDateRange.value || cleanupDateRange.value.length !== 2) {
      ElMessage.warning('请选择清理的时间范围'); return
    }
    params = { startDate: cleanupDateRange.value[0], endDate: cleanupDateRange.value[1], logType: cleanupForm.logType, module: cleanupForm.module }
  }
  cleaningUp.value = true; cleanupProgress.value = 0; cleanupProcessed.value = 0
  try {
    for (let i = 1; i <= 90; i += 10) {
      await new Promise(r => setTimeout(r, 80))
      cleanupProgress.value = i; cleanupProcessed.value = Math.floor((i / 100) * stats.value.totalCount)
    }
    const res = await cleanupSystemLogs(params)
    cleanupProgress.value = 100; cleanupResult.value = res.data
    cleanupTotal.value = res.data.total; cleanupProcessed.value = res.data.cleaned
    ElMessage.success(`清理成功，共清理 ${res.data.cleaned} 条日志，已保护 ${res.data.protectedCount} 条高危/错误日志`)
    setTimeout(() => { fetchList(); fetchStats() }, 500)
    setTimeout(() => { cleanupDialogVisible.value = false; cleaningUp.value = false }, 1500)
  } catch (e: any) { ElMessage.error(e.message || '清理失败'); cleaningUp.value = false }
}

const openTraceabilityDialog = async () => {
  traceabilityDialogVisible.value = true
  traceabilityTab.value = 'overview'
  try {
    const params = dateRange.value && dateRange.value.length === 2
      ? { startDate: dateRange.value[0], endDate: dateRange.value[1], module: filterForm.module, logType: filterForm.logType }
      : { module: filterForm.module, logType: filterForm.logType }
    const res = await getSystemLogTraceability(params)
    traceabilityResult.value = res.data
  } catch (e: any) { ElMessage.error(e.message || '获取溯源信息失败') }
}
const closeTraceabilityDialog = () => { traceabilityDialogVisible.value = false; traceabilityResult.value = null }

const loadViewHistory = () => {
  try { const s = localStorage.getItem(HISTORY_STORAGE_KEY); if (s) viewHistory.value = JSON.parse(s) } catch (e) { console.error(e) }
}
const saveViewRecord = (log: SystemLog) => {
  const rec: SystemLogViewRecord = {
    id: `VIEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    logId: log.id, logTitle: log.title, logType: log.logType, logLevel: log.logLevel,
    viewedAt: new Date().toISOString()
  }
  viewHistory.value.unshift(rec)
  if (viewHistory.value.length > MAX_HISTORY) viewHistory.value = viewHistory.value.slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(viewHistory.value))
}
const quickViewById = async (logId: number) => {
  showViewHistory.value = false
  const log = tableData.value.find(l => l.id === logId)
  if (log) { viewDetail(log); return }
  try {
    const res = await getSystemLogDetail(logId)
    currentLog.value = res.data; detailStep.value = 0; detailDialogVisible.value = true
  } catch (e: any) { ElMessage.error(e.message || '获取日志详情失败') }
}

onMounted(async () => {
  loadViewHistory()
  await checkPermission()
  if (hasPermission.value) {
    await fetchOptions()
    await Promise.all([fetchList(), fetchStats()])
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.system-log-page {
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
      animation: floatUp 0.6s ease-out;
      .permission-title {
        font-size: $font-size-extra-large;
        font-weight: 600;
        color: $text-primary;
        margin: 16px 0 8px;
      }
      .permission-desc {
        font-size: $font-size-base;
        color: $text-secondary;
      }
    }
  }

  @keyframes floatUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .stats-section {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
    .stat-card {
      background: $bg-color-ffffff; border-radius: $border-radius-large; padding: 20px;
      display: flex; align-items: center; box-shadow: $shadow-light; transition: all 0.3s ease;
      &:hover { transform: translateY(-2px); box-shadow: $shadow-medium; }
      .stat-icon {
        width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center;
        justify-content: center; margin-right: 16px; color: #fff;
        &.stat-total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.stat-today { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.stat-risk { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        &.stat-slow { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      }
      .stat-info { .stat-value { font-size: 28px; font-weight: 600; color: $text-primary; line-height: 1.2; }
        .stat-label { font-size: $font-size-small; color: $text-secondary; margin-top: 4px; } }
    }
  }

  .status-tabs {
    display: flex; gap: 12px; margin-bottom: 16px;
    .tab-item {
      flex: 1;
      background: $bg-color-ffffff;
      border-radius: $border-radius;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      box-shadow: $shadow-light;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { box-shadow: $shadow-medium; }
      &.active {
        border-color: $primary-color;
        box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
      }
      .tab-label { font-size: $font-size-base; font-weight: 500; color: $text-regular; }
      .tab-count { font-size: $font-size-large; font-weight: 600; color: $text-primary; }
      .tab-percent { font-size: $font-size-small; color: $text-secondary; }
    }
  }

  .filter-card {
    margin-bottom: 16px;
    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 0; margin-right: 0; transition: all 0.3s ease;
        &.is-error {
          :deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor.el-input__wrapper) {
            box-shadow: 0 0 0 1px $danger-color inset;
          }
        }
        &.is-shake { animation: shake 0.4s ease-in-out; }
        :deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor.el-input__wrapper) {
          transition: all 0.3s ease;
          &:hover { box-shadow: 0 0 0 1px $primary-color inset; }
          &.is-focus { box-shadow: 0 0 0 1px $primary-color inset, 0 0 0 3px rgba(64, 158, 255, 0.1); }
        }
      }
    }
    .filter-warnings { margin-top: 12px; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }

  .table-card {
    .table-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
      .table-title { display: flex; align-items: center; font-size: $font-size-medium; font-weight: 600; color: $text-primary;
        .el-icon { margin-right: 6px; color: $primary-color; } }
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
    .log-table {
      :deep(.el-table__row) { cursor: pointer; transition: background-color 0.2s ease; &:hover { background-color: rgba(64, 158, 255, 0.04); } }
      .request-method {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: $font-size-extra-small;
        font-weight: 600;
        margin-right: 6px;
        &.GET { background: #f0f9eb; color: $success-color; }
        &.POST { background: #ecf5ff; color: $primary-color; }
        &.PUT { background: #fdf6ec; color: $warning-color; }
        &.DELETE { background: #fef0f0; color: $danger-color; }
        &.PATCH { background: #f4f4f5; color: $info-color; }
      }
      .request-url { font-family: monospace; font-size: $font-size-small; color: $text-regular; }
      .slow-duration { color: $danger-color; font-weight: 600; }
      .no-risk { color: $text-secondary; }
      .error-glow {
        animation: errorGlow 2s ease-in-out infinite;
      }
    }
    @keyframes errorGlow {
      0%, 100% { box-shadow: 0 0 5px rgba(245, 108, 108, 0.5); }
      50% { box-shadow: 0 0 15px rgba(245, 108, 108, 0.8); }
    }
    .table-pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
  }
}

.detail-dialog {
  :deep(.el-dialog) { border-radius: $border-radius-large; overflow: hidden; }
  :deep(.dialog-fade-enter-active) { animation: dialogFadeIn 0.3s ease-out; }
  :deep(.dialog-fade-leave-active) { animation: dialogFadeOut 0.3s ease-in; }
  @keyframes dialogFadeIn { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes dialogFadeOut { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(30px) scale(0.95); } }
  .log-detail {
    .section-title { font-size: $font-size-base; font-weight: 600; color: $text-primary; margin-bottom: 16px; padding-left: 10px; border-left: 3px solid $primary-color; }
    .sub-title { font-size: $font-size-small; font-weight: 600; color: $text-regular; margin: 16px 0 8px; }
    .trace-id { font-family: monospace; font-size: $font-size-small; background: $bg-color; padding: 2px 8px; border-radius: 4px; }
    .json-section { margin-top: 16px; }
    .json-viewer {
      background: #f8f9fa; border-radius: $border-radius; padding: 16px; max-height: 300px; overflow: auto;
      pre { margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: $font-size-small; line-height: 1.6; color: #333; white-space: pre-wrap; word-break: break-all; }
    }
    .stack-trace, .log-content {
      background: #1e1e1e; border-radius: $border-radius; padding: 16px; max-height: 400px; overflow: auto;
      pre { margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: $font-size-small; line-height: 1.6; color: #d4d4d4; white-space: pre-wrap; word-break: break-all; }
    }
    .ua-text { font-family: monospace; font-size: $font-size-small; color: $text-regular; word-break: break-all; line-height: 1.5; background: $bg-color; padding: 12px; border-radius: $border-radius; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 8px; }
  }
}

.backup-dialog, .cleanup-dialog {
  .backup-content, .cleanup-content {
    .form-tip { font-size: $font-size-extra-small; color: $text-secondary; margin-top: 4px; }
    .backup-progress, .cleanup-progress { margin-top: 16px;
      .progress-text { margin-top: 8px; font-size: $font-size-small; color: $text-regular; text-align: center;
        .protected-text { color: $success-color; margin-left: 8px; }
      }
    }
    .backup-success { margin-top: 16px;
      .backup-file-info { margin-top: 8px; font-size: $font-size-small; color: $text-regular;
        div { margin-bottom: 4px; }
      }
    }
  }
}

.traceability-dialog {
  .traceability-content {
    .stability-section { margin-bottom: 24px;
      .stability-score { display: flex; align-items: center; gap: 40px; padding: 24px; background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%); border-radius: $border-radius-large;
        .score-circle { position: relative; width: 160px; height: 160px;
          svg { width: 100%; height: 100%; transform: rotate(-90deg); }
          .score-progress { transition: stroke-dasharray 1s ease-out; }
          .score-inner { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
            .score-value { font-size: 36px; font-weight: 700; color: $text-primary; line-height: 1; }
            .score-label { font-size: $font-size-base; font-weight: 500; margin-top: 4px; }
          }
        }
        .stability-info { flex: 1;
          .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px dashed $border-color-lighter;
            &:last-child { border-bottom: none; }
            .info-label { color: $text-secondary; font-size: $font-size-base; }
            .info-value { font-size: $font-size-medium; font-weight: 600; color: $text-primary;
              &.error { color: $danger-color; }
              &.warning { color: $warning-color; }
              &.slow { color: $warning-color; }
              &.danger { color: $danger-color; }
            }
          }
        }
      }
    }
    .traceability-tabs {
      .overview-section {
        .overview-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
          .overview-card { background: $bg-color-ffffff; border-radius: $border-radius; padding: 20px; text-align: center; box-shadow: $shadow-light;
            .overview-count { font-size: $font-size-extra-large; font-weight: 700; color: $text-primary; margin: 8px 0; }
            .overview-label { font-size: $font-size-small; color: $text-secondary; }
          }
        }
        .abnormal-list {
          .list-title { font-size: $font-size-base; font-weight: 600; color: $text-primary; margin-bottom: 12px; }
        }
      }
      .errors-section {
        .empty-state { padding: 40px 0; }
        .error-type-list {
          .error-type-item { background: $bg-color-ffffff; border-radius: $border-radius; padding: 16px; margin-bottom: 12px; box-shadow: $shadow-light;
            .error-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
              .error-name { font-size: $font-size-base; font-weight: 600; color: $text-primary; }
              .error-code { font-family: monospace; background: $bg-color; padding: 2px 8px; border-radius: 4px; color: $danger-color; font-size: $font-size-small; }
              .error-module { margin-left: auto; color: $text-secondary; font-size: $font-size-small; }
            }
            .error-time { display: flex; gap: 24px; font-size: $font-size-small; color: $text-secondary; margin-bottom: 12px; }
            .error-samples {
              .error-sample {
                .sample-time { font-size: $font-size-extra-small; color: $text-secondary; margin-bottom: 8px; }
                .sample-stack { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: $border-radius; font-family: 'Consolas', 'Monaco', monospace; font-size: $font-size-extra-small; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow: auto; }
              }
            }
          }
        }
      }
      .slow-section {
        .empty-state { padding: 40px 0; }
        .slow-api-list {
          .slow-api-item { background: $bg-color-ffffff; border-radius: $border-radius; padding: 16px; margin-bottom: 12px; box-shadow: $shadow-light;
            .api-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
              .api-method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: $font-size-extra-small; font-weight: 600;
                &.GET { background: #f0f9eb; color: $success-color; }
                &.POST { background: #ecf5ff; color: $primary-color; }
                &.PUT { background: #fdf6ec; color: $warning-color; }
                &.DELETE { background: #fef0f0; color: $danger-color; }
              }
              .api-url { font-family: monospace; font-size: $font-size-small; color: $text-regular; }
            }
            .api-stats { display: flex; align-items: center; gap: 16px; font-size: $font-size-small;
              .api-count, .api-last { color: $text-secondary; }
            }
          }
        }
      }
      .optimization-section {
        .optimization-summary { margin-bottom: 24px;
          .report-meta { margin-top: 8px; display: flex; gap: 24px; font-size: $font-size-small; color: $text-secondary; }
        }
        .list-title { font-size: $font-size-base; font-weight: 600; color: $text-primary; margin: 20px 0 12px; }
        .empty-state { padding: 40px 0; }
        .issue-list, .suggestion-list {
          .issue-item, .suggestion-item { background: $bg-color-ffffff; border-radius: $border-radius; padding: 16px; margin-bottom: 12px; box-shadow: $shadow-light;
            .issue-header, .suggestion-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
              .issue-type, .suggestion-title { font-size: $font-size-base; font-weight: 600; color: $text-primary; }
            }
            .issue-desc, .suggestion-desc { font-size: $font-size-small; color: $text-regular; margin-bottom: 8px; line-height: 1.6; }
            .issue-details { margin: 8px 0 0 0; padding-left: 20px;
              li { font-size: $font-size-small; color: $text-secondary; margin-bottom: 4px; }
            }
            .suggestion-affected { font-size: $font-size-extra-small; color: $text-secondary; margin-top: 8px; }
          }
        }
      }
    }
  }
}

.view-history-drawer {
  .empty-history { padding: 40px 0; }
  .history-list { .history-item {
    padding: 12px; border-radius: $border-radius; cursor: pointer; margin-bottom: 8px;
    background: $bg-color-page; transition: all 0.2s ease; border: 1px solid transparent;
    &:hover { background: rgba(64, 158, 255, 0.06); border-color: rgba(64, 158, 255, 0.2); }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
      .history-time { font-size: $font-size-extra-small; color: $text-secondary; }
    }
    .history-title { font-size: $font-size-small; color: $text-primary; margin-bottom: 6px; font-weight: 500; }
    .history-meta { display: flex; gap: 8px; font-size: $font-size-extra-small; color: $text-secondary;
      .meta-type, .meta-id { background: $bg-color-ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid $border-color-lighter; }
    }
  } }
}
</style>