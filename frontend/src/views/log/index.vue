<template>
  <div class="log-page">
    <el-tabs v-model="activeTab" class="log-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="操作日志" name="operation">
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="系统日志" name="system">
        <template #label>
          <span class="tab-label">
            <el-icon><Monitor /></el-icon>
            <span>系统日志</span>
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <div v-if="activeTab === 'operation'">
      <div class="log-stats" v-if="statsLoaded">
      <div class="stat-card">
        <div class="stat-icon stat-total"><el-icon :size="24"><Document /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalCount }}</div>
          <div class="stat-label">总操作数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-today"><el-icon :size="24"><Sunny /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayCount }}</div>
          <div class="stat-label">今日操作</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-success"><el-icon :size="24"><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ successCount }}</div>
          <div class="stat-label">成功操作</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-risk"><el-icon :size="24"><Warning /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.maliciousCount }}</div>
          <div class="stat-label">风险操作</div>
        </div>
      </div>
    </div>

    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form" ref="filterFormRef">
        <el-form-item label="操作人员" prop="username" :class="{ 'is-error': fieldErrors.username, 'is-shake': fieldShakes.username }">
          <el-select
            v-model="filterForm.username" placeholder="请选择操作人员" clearable filterable remote
            :remote-method="searchOperators" :loading="operatorLoading" style="width: 180px"
            @focus="handleFieldFocus('username')" @blur="handleFieldBlur('username')" @change="handleFieldChange('username')"
          >
            <el-option v-for="item in operatorOptions" :key="item.userId"
              :label="`${item.username} (${item.operationCount}次)`" :value="item.username" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块" prop="module" :class="{ 'is-error': fieldErrors.module, 'is-shake': fieldShakes.module }">
          <el-select v-model="filterForm.module" placeholder="全部" clearable style="width: 140px"
            @focus="handleFieldFocus('module')" @blur="handleFieldBlur('module')" @change="handleFieldChange('module')">
            <el-option v-for="item in moduleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作动作" prop="action" :class="{ 'is-error': fieldErrors.action, 'is-shake': fieldShakes.action }">
          <el-select v-model="filterForm.action" placeholder="全部" clearable style="width: 140px"
            @focus="handleFieldFocus('action')" @blur="handleFieldBlur('action')" @change="handleFieldChange('action')">
            <el-option v-for="item in actionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作结果" prop="result">
          <el-select v-model="filterForm.result" placeholder="全部" clearable style="width: 120px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="filterForm.riskLevel" placeholder="全部" clearable style="width: 120px">
            <el-option label="无风险" value="none" />
            <el-option label="低风险" value="low" />
            <el-option label="中风险" value="medium" />
            <el-option label="高风险" value="high" />
            <el-option label="严重风险" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间区间" prop="dateRange" :class="{ 'is-error': fieldErrors.dateRange, 'is-shake': fieldShakes.dateRange }">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts" style="width: 280px"
            @focus="handleFieldFocus('dateRange')" @blur="handleFieldBlur('dateRange')" @change="handleFieldChange('dateRange')" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="操作人/目标/IP" clearable style="width: 180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch" :loading="loading">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Download" @click="openExportDialog" :disabled="tableData.length === 0">导出日志</el-button>
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
          <span>操作日志列表</span>
          <el-tag type="info" size="small" style="margin-left: 8px">共 {{ total }} 条</el-tag>
        </div>
        <div class="table-actions">
          <el-tooltip content="查询记录">
            <el-button :icon="History" circle @click="showQueryHistory = true" />
          </el-tooltip>
        </div>
      </div>

      <el-table ref="tableRef" :data="tableData" v-loading="loading" height="calc(100vh - 420px)"
        stripe border resizable @row-dblclick="handleRowDblclick" class="log-table">
        <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
        <el-table-column prop="id" label="日志ID" width="80" align="center" />
        <el-table-column prop="username" label="操作人" width="110" align="center">
          <template #default="{ row }">
            <div class="operator-cell">
              <el-avatar :size="24" style="margin-right: 6px">{{ (row.username || '?').charAt(0).toUpperCase() }}</el-avatar>
              <span>{{ row.username || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userRole" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.userRole)" size="small">{{ getRoleLabel(row.userRole) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ moduleLabel[row.module] || row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)" size="small">{{ actionLabel[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作目标" min-width="160" show-overflow-tooltip />
        <el-table-column label="变更字段" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.changedFields && row.changedFields.length > 0" class="changed-badge">
              <el-tag type="warning" size="small" effect="dark">{{ row.changedFields.length }}个字段</el-tag>
            </span>
            <span v-else class="no-change">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作结果" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small" effect="light">
              <el-icon v-if="row.result === 'success'" style="margin-right: 2px"><CircleCheck /></el-icon>
              <el-icon v-else style="margin-right: 2px"><CircleClose /></el-icon>
              {{ row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isMalicious" type="danger" size="small" effect="dark"><el-icon><Warning /></el-icon>恶意</el-tag>
            <el-tag v-else-if="row.riskLevel && row.riskLevel !== 'none'" :type="getRiskTagType(row.riskLevel)" size="small">
              {{ getRiskLabel(row.riskLevel) }}
            </el-tag>
            <span v-else class="no-risk">-</span>
          </template>
        </el-table-column>
        <el-table-column label="完整性" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.integrityVerified === false" type="danger" size="small">已篡改</el-tag>
            <el-tag v-else type="success" size="small" plain>正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" align="center" />
        <el-table-column prop="ipLocation" label="归属地" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="os" label="系统" width="100" align="center" show-overflow-tooltip />
        <el-table-column prop="browser" label="浏览器" width="100" align="center" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="操作时间" width="170" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="viewDetail(row)">详情</el-button>
            <el-button type="success" link :icon="Connection" @click="viewTrace(row)" v-if="row.traceId">溯源</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20, 50, 100, 200]"
          :total="total" layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </div>
    </div>

    <SystemLog v-if="activeTab === 'system'" />

    <el-dialog v-model="detailDialogVisible" :title="`日志详情 #${currentLog?.id || ''}`" width="900px"
      class="detail-dialog" :close-on-click-modal="false" @close="closeDetailDialog">
      <div v-if="currentLog" class="log-detail">
        <el-steps :active="detailStep" finish-status="success" simple style="margin-bottom: 24px">
          <el-step title="基本信息" />
          <el-step title="操作内容" />
          <el-step title="数据变更" />
          <el-step title="设备信息" />
        </el-steps>

        <div v-show="detailStep === 0" class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
            <el-descriptions-item label="追踪ID">
              <span class="trace-id">{{ currentLog.traceId || '-' }}</span>
              <el-button link type="primary" size="small" @click="viewTrace(currentLog)" v-if="currentLog.traceId">
                <el-icon><Connection /></el-icon>全链路
              </el-button>
            </el-descriptions-item>
            <el-descriptions-item label="操作人">
              <el-avatar :size="20" style="margin-right: 6px">{{ (currentLog.username || '?').charAt(0).toUpperCase() }}</el-avatar>
              {{ currentLog.username || '-' }}
              <el-tag :type="getRoleTagType(currentLog.userRole)" size="small" style="margin-left: 6px">{{ getRoleLabel(currentLog.userRole) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ currentLog.userId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作模块"><el-tag type="info">{{ moduleLabel[currentLog.module] || currentLog.module }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="操作动作"><el-tag :type="getActionTagType(currentLog.action)">{{ actionLabel[currentLog.action] || currentLog.action }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="操作目标">{{ currentLog.target || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目标ID">{{ currentLog.targetId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作结果"><el-tag :type="currentLog.result === 'success' ? 'success' : 'danger'">{{ currentLog.result === 'success' ? '成功' : '失败' }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="耗时">{{ currentLog.duration || 0 }} ms</el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag v-if="currentLog.riskLevel && currentLog.riskLevel !== 'none'" :type="getRiskTagType(currentLog.riskLevel)">{{ getRiskLabel(currentLog.riskLevel) }}</el-tag>
              <span v-else>无风险</span>
            </el-descriptions-item>
            <el-descriptions-item label="恶意操作"><el-tag :type="currentLog.isMalicious ? 'danger' : 'success'" size="small">{{ currentLog.isMalicious ? '是' : '否' }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="完整性校验"><el-tag :type="currentLog.integrityVerified === false ? 'danger' : 'success'" size="small">{{ currentLog.integrityVerified === false ? '已篡改' : '正常' }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="操作时间" :span="2">{{ formatDateTime(currentLog.createdAt) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-show="detailStep === 1" class="detail-section">
          <h4 class="section-title">操作内容</h4>
          <div v-if="currentLog.detail" class="json-viewer"><pre>{{ JSON.stringify(currentLog.detail, null, 2) }}</pre></div>
          <el-empty v-else description="无操作详情" />
          <div v-if="currentLog.failReason" class="fail-reason" style="margin-top: 16px">
            <el-alert :title="`失败原因：${currentLog.failReason}`" type="error" :closable="false" show-icon />
          </div>
        </div>

        <div v-show="detailStep === 2" class="detail-section">
          <h4 class="section-title">
            数据变更对比
            <el-tag v-if="currentLog.changedFields && currentLog.changedFields.length > 0" type="warning" size="small" style="margin-left: 8px">
              {{ currentLog.changedFields.length }}个字段变更
            </el-tag>
          </h4>
          <div v-if="currentLog.beforeData || currentLog.afterData" class="data-compare">
            <div class="compare-col">
              <div class="compare-header before-header"><el-icon><ArrowLeft /></el-icon>变更前</div>
              <div class="compare-content">
                <div v-for="(value, key) in currentLog.beforeData || {}" :key="key" class="compare-item" :class="{ 'is-changed': isFieldChanged(String(key)) }">
                  <span class="field-name">{{ key }}:</span>
                  <span class="field-value">{{ formatValue(value) }}</span>
                </div>
                <el-empty v-if="!currentLog.beforeData || Object.keys(currentLog.beforeData).length === 0" description="无数据" :image-size="60" />
              </div>
            </div>
            <div class="compare-arrow"><el-icon :size="32" color="#409eff"><Right /></el-icon></div>
            <div class="compare-col">
              <div class="compare-header after-header"><el-icon><ArrowRight /></el-icon>变更后</div>
              <div class="compare-content">
                <div v-for="(value, key) in currentLog.afterData || {}" :key="key" class="compare-item" :class="{ 'is-changed': isFieldChanged(String(key)) }">
                  <span class="field-name">{{ key }}:</span>
                  <span class="field-value">{{ formatValue(value) }}</span>
                  <el-tag v-if="isFieldChanged(String(key))" type="warning" size="small" effect="dark" style="margin-left: 6px">已变更</el-tag>
                </div>
                <el-empty v-if="!currentLog.afterData || Object.keys(currentLog.afterData).length === 0" description="无数据" :image-size="60" />
              </div>
            </div>
          </div>
          <el-empty v-else description="无数据变更记录" />
        </div>

        <div v-show="detailStep === 3" class="detail-section">
          <h4 class="section-title">设备与网络信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="IP地址">{{ currentLog.ip || '-' }}</el-descriptions-item>
            <el-descriptions-item label="IP归属地">{{ currentLog.ipLocation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作系统">{{ currentLog.os || '-' }}</el-descriptions-item>
            <el-descriptions-item label="浏览器">{{ currentLog.browser || '-' }}</el-descriptions-item>
            <el-descriptions-item label="User-Agent" :span="2"><div class="ua-text">{{ currentLog.userAgent || '-' }}</div></el-descriptions-item>
            <el-descriptions-item label="设备详情" :span="2" v-if="currentLog.deviceInfo">
              <div class="json-viewer small"><pre>{{ JSON.stringify(currentLog.deviceInfo, null, 2) }}</pre></div>
            </el-descriptions-item>
            <el-descriptions-item label="凭证哈希" :span="2"><span class="hash-text">{{ currentLog.evidenceHash || '-' }}</span></el-descriptions-item>
          </el-descriptions>
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

    <el-dialog v-model="traceDialogVisible" title="全链路溯源" width="1100px" class="trace-dialog" @close="closeTraceDialog">
      <div v-if="traceResult" class="trace-content">
        <div class="trace-summary">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="追踪ID"><span class="trace-id">{{ traceResult.traceId }}</span></el-descriptions-item>
            <el-descriptions-item label="操作步骤">{{ traceResult.totalSteps }}步</el-descriptions-item>
            <el-descriptions-item label="总耗时">{{ traceResult.totalDuration }}ms</el-descriptions-item>
            <el-descriptions-item label="一致性">
              <el-tag :type="traceResult.consistency.isConsistent ? 'success' : 'danger'" size="small">
                {{ traceResult.consistency.isConsistent ? '通过' : '异常' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-if="traceResult.consistency.issues.length > 0" class="trace-alerts">
          <el-alert v-for="(issue, idx) in traceResult.consistency.issues" :key="idx"
            :title="issue.message"
            :type="issue.severity === 'critical' || issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'"
            :closable="false" show-icon style="margin-bottom: 8px" />
        </div>
        <div class="trace-timeline">
          <el-timeline>
            <el-timeline-item v-for="(log, idx) in traceResult.logs" :key="log.id"
              :timestamp="formatDateTime(log.createdAt)" :type="getTimelineType(log)"
              :icon="getTimelineIcon(log)" :hollow="log.isMalicious">
              <div class="timeline-card" :class="{ 'is-malicious': log.isMalicious }" @click="quickViewLog(log)">
                <div class="timeline-header">
                  <span class="step-tag">步骤 {{ idx + 1 }}</span>
                  <el-tag :type="getActionTagType(log.action)" size="small">{{ actionLabel[log.action] || log.action }}</el-tag>
                  <el-tag type="info" size="small">{{ moduleLabel[log.module] || log.module }}</el-tag>
                  <el-tag v-if="log.result === 'success'" type="success" size="small">成功</el-tag>
                  <el-tag v-else type="danger" size="small">失败</el-tag>
                  <span class="timeline-operator">{{ log.username }}</span>
                </div>
                <div class="timeline-body">
                  <div class="timeline-row"><span class="row-label">目标：</span><span>{{ log.target || '-' }}</span></div>
                  <div class="timeline-row" v-if="log.changedFields && log.changedFields.length > 0">
                    <span class="row-label">变更字段：</span>
                    <el-tag v-for="field in log.changedFields.slice(0, 5)" :key="field" type="warning" size="small" effect="plain" style="margin-right: 4px">{{ field }}</el-tag>
                    <span v-if="log.changedFields.length > 5">等{{ log.changedFields.length }}个</span>
                  </div>
                  <div class="timeline-row" v-if="log.failReason">
                    <span class="row-label">失败原因：</span><span class="text-danger">{{ log.failReason }}</span>
                  </div>
                </div>
                <div class="timeline-footer">
                  <span class="duration-tag">耗时 {{ log.duration || 0 }}ms</span>
                  <span class="ip-tag">{{ log.ip }}</span>
                  <el-tag v-if="!traceResult.consistency.allVerified && !log.integrityVerified" type="danger" size="small">完整性异常</el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div class="trace-evidence">
          <el-collapse>
            <el-collapse-item title="溯源凭证信息" name="evidence">
              <div class="evidence-hash">
                <div class="hash-item"><span class="hash-label">链路哈希：</span><span class="hash-value">{{ traceResult.evidence.chainHash }}</span></div>
                <div v-for="item in traceResult.evidence.evidenceHashes" :key="item.logId" class="hash-item">
                  <span class="hash-label">日志#{{ item.logId }}：</span><span class="hash-value">{{ item.hash }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="exportDialogVisible" title="导出日志" width="520px" class="export-dialog" @close="closeExportDialog">
      <div class="export-content">
        <el-form :model="exportForm" ref="exportFormRef" label-width="100px">
          <el-form-item label="时间范围">
            <el-date-picker v-model="exportDateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="exportForm.username" placeholder="留空则导出全部" clearable />
          </el-form-item>
          <el-form-item label="操作模块">
            <el-select v-model="exportForm.module" placeholder="全部" clearable style="width: 100%">
              <el-option v-for="item in moduleOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作动作">
            <el-select v-model="exportForm.action" placeholder="全部" clearable style="width: 100%">
              <el-option v-for="item in actionOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作结果">
            <el-select v-model="exportForm.result" placeholder="全部" clearable style="width: 100%">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="fail" />
            </el-select>
          </el-form-item>
          <el-form-item label="导出字段">
            <el-checkbox-group v-model="exportForm.exportFields">
              <el-checkbox label="id">日志ID</el-checkbox>
              <el-checkbox label="username">操作人</el-checkbox>
              <el-checkbox label="module">模块</el-checkbox>
              <el-checkbox label="action">动作</el-checkbox>
              <el-checkbox label="target">目标</el-checkbox>
              <el-checkbox label="result">结果</el-checkbox>
              <el-checkbox label="ip">IP</el-checkbox>
              <el-checkbox label="createdAt">时间</el-checkbox>
              <el-checkbox label="detail">详情</el-checkbox>
              <el-checkbox label="beforeData">变更前</el-checkbox>
              <el-checkbox label="afterData">变更后</el-checkbox>
              <el-checkbox label="changedFields">变更字段</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        <div v-if="exporting" class="export-progress">
          <el-progress :percentage="exportProgress" :status="exportProgress === 100 ? 'success' : undefined" :stroke-width="14" />
          <div class="progress-text">
            正在导出：{{ exportProcessed }} / {{ exportTotal }} 条
            <span v-if="exportFiltered > 0" class="filtered-text">(已过滤空日志 {{ exportFiltered }} 条)</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeExportDialog" :disabled="exporting">取消</el-button>
        <el-button type="primary" :icon="exporting ? Loading : Download" @click="handleExport" :loading="exporting">
          {{ exporting ? '导出中...' : '开始导出' }}
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="showQueryHistory" title="查询记录" direction="rtl" size="380px">
      <div v-if="queryHistory.length === 0" class="empty-history"><el-empty description="暂无查询记录" /></div>
      <div v-else class="history-list">
        <div v-for="record in queryHistory" :key="record.id" class="history-item" @click="applyHistoryRecord(record)">
          <div class="history-header">
            <span class="history-time">{{ formatDateTime(record.viewedAt) }}</span>
            <el-tag size="small" type="info">{{ record.count }}条</el-tag>
          </div>
          <div class="history-params">
            <span v-if="record.params.username" class="param-tag"><el-icon><User /></el-icon>{{ record.params.username }}</span>
            <span v-if="record.params.module" class="param-tag">{{ moduleLabel[record.params.module] }}</span>
            <span v-if="record.params.action" class="param-tag">{{ actionLabel[record.params.action] }}</span>
            <span v-if="record.params.startDate && record.params.endDate" class="param-tag">
              <el-icon><Calendar /></el-icon>{{ record.params.startDate }} ~ {{ record.params.endDate }}
            </span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search, Refresh, Download, View, Connection, List, History, Document, Sunny,
  CircleCheck, Warning, CircleClose, ArrowLeft, ArrowRight, Right, Loading, User, Calendar,
  Monitor
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  getLogList, getLogDetail, getLogStats, getLogOperators, getLogModuleList,
  getLogActionList, getLogTraceByLogId, exportLogs
} from '@/api/log'
import type {
  OperationLog, LogListParams, LogStatsData, LogTraceResult, LogOperator,
  LogModuleOption, LogActionOption, LogExportParams, LogQueryRecord
} from '@/types'
import { UserRoleLabel } from '@/constants'
import SystemLog from './SystemLog.vue'

const HISTORY_STORAGE_KEY = 'log_query_history'
const MAX_HISTORY = 20

const activeTab = ref<'operation' | 'system'>('operation')
const handleTabChange = (tab: string) => {
  activeTab.value = tab as 'operation' | 'system'
}

const loading = ref(false)
const tableData = ref<OperationLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<[string, string] | null>(null)
const warnings = ref<string[]>([])
const statsLoaded = ref(false)
const stats = ref<LogStatsData>({
  totalCount: 0, todayCount: 0, maliciousCount: 0,
  byModule: [], byAction: [], byResult: [], byRiskLevel: [], last7Days: []
})

const filterFormRef = ref<FormInstance>()
const filterForm = reactive({
  username: '', module: '', action: '', result: '', riskLevel: '', keyword: ''
})

const fieldErrors = reactive<Record<string, boolean>>({
  username: false, module: false, action: false, dateRange: false
})
const fieldShakes = reactive<Record<string, boolean>>({
  username: false, module: false, action: false, dateRange: false
})
const focusedField = ref<string | null>(null)

const dateShortcuts = [
  { text: '最近7天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 7); return [s, e] as [Date, Date] } },
  { text: '最近30天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 30); return [s, e] as [Date, Date] } },
  { text: '最近90天', value: () => { const e = new Date(); const s = new Date(); s.setTime(s.getTime() - 3600 * 1000 * 24 * 90); return [s, e] as [Date, Date] } }
]

const operatorLoading = ref(false)
const operatorOptions = ref<LogOperator[]>([])
const moduleOptions = ref<LogModuleOption[]>([])
const actionOptions = ref<LogActionOption[]>([])

const moduleLabel = computed(() => {
  const map: Record<string, string> = {}
  moduleOptions.value.forEach(m => { map[m.value] = m.label })
  return map
})
const actionLabel = computed(() => {
  const map: Record<string, string> = {}
  actionOptions.value.forEach(a => { map[a.value] = a.label })
  return map
})
const successCount = computed(() => stats.value.byResult.find(r => r.result === 'success')?.count || 0)

const detailDialogVisible = ref(false)
const detailStep = ref(0)
const currentLog = ref<OperationLog | null>(null)

const traceDialogVisible = ref(false)
const traceResult = ref<LogTraceResult | null>(null)

const exportDialogVisible = ref(false)
const exportFormRef = ref<FormInstance>()
const exportDateRange = ref<[string, string] | null>(null)
const exportForm = reactive<LogExportParams>({
  startDate: '', endDate: '', username: '', module: '', action: '', result: '',
  exportFields: ['id', 'username', 'module', 'action', 'target', 'result', 'ip', 'createdAt', 'detail']
})
const exporting = ref(false)
const exportProgress = ref(0)
const exportProcessed = ref(0)
const exportTotal = ref(0)
const exportFiltered = ref(0)

const showQueryHistory = ref(false)
const queryHistory = ref<LogQueryRecord[]>([])

const tableRef = ref()

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
    if (diff > 90) { valid = false; errorMsg = '查询时间区间不能超过90天' }
    if (sd > ed) { valid = false; errorMsg = '开始日期不能晚于结束日期' }
  }
  if (field === 'username' && filterForm.username) {
    if (filterForm.username.length > 50) { valid = false; errorMsg = '操作人员名称过长' }
  }
  if (field === 'module' && filterForm.module) {
    if (!moduleOptions.value.map(m => m.value).includes(filterForm.module)) { valid = false; errorMsg = '操作模块不合法' }
  }
  if (field === 'action' && filterForm.action) {
    if (!actionOptions.value.map(a => a.value).includes(filterForm.action)) { valid = false; errorMsg = '操作动作不合法' }
  }
  if (filterForm.module && filterForm.action) {
    const mmap: Record<string, string[]> = {
      resource: ['create', 'update', 'delete', 'export', 'import', 'restore', 'discard'],
      audit: ['approve', 'reject', 'review', 'handle'], user: ['create', 'update', 'delete', 'batch'],
      violation: ['handle', 'review', 'update'], appeal: ['approve', 'reject', 'review'],
      system: ['update', 'export'], template: ['create', 'update', 'delete'],
      notification: ['create', 'update', 'delete'], log: ['export'], permission: ['update', 'batch']
    }
    if (mmap[filterForm.module] && !mmap[filterForm.module].includes(filterForm.action)) {
      const w = `模块"${moduleLabel.value[filterForm.module]}"下通常不包含"${actionLabel.value[filterForm.action]}"操作`
      if (!warnings.value.includes(w)) warnings.value.push(w)
    }
  }
  fieldErrors[field] = !valid
  if (!valid) { triggerShake(field); ElMessage.warning(errorMsg) }
  return valid
}

const validateAllFields = (): boolean => {
  let ok = true
  ;['username', 'module', 'action', 'dateRange'].forEach(f => { if (!validateField(f)) ok = false })
  return ok
}

const searchOperators = async (keyword: string) => {
  operatorLoading.value = true
  try {
    const res = await getLogOperators({ keyword: keyword || undefined })
    operatorOptions.value = res.data
  } catch (e) { console.error(e) } finally { operatorLoading.value = false }
}

const fetchOptions = async () => {
  try {
    const [ms, acts, ops] = await Promise.all([getLogModuleList(), getLogActionList(), getLogOperators()])
    moduleOptions.value = ms.data; actionOptions.value = acts.data; operatorOptions.value = ops.data
  } catch (e) { console.error(e) }
}

const fetchStats = async () => {
  try { const res = await getLogStats(); stats.value = res.data; statsLoaded.value = true } catch (e) { console.error(e) }
}

const buildQueryParams = (): LogListParams => {
  const p: LogListParams = {
    page: page.value, pageSize: pageSize.value,
    keyword: filterForm.keyword || undefined, username: filterForm.username || undefined,
    module: filterForm.module || undefined, action: filterForm.action || undefined,
    result: filterForm.result || undefined, riskLevel: filterForm.riskLevel || undefined
  }
  if (dateRange.value && dateRange.value.length === 2) { p.startDate = dateRange.value[0]; p.endDate = dateRange.value[1] }
  return p
}

const fetchList = async () => {
  if (!validateAllFields()) return
  loading.value = true; warnings.value = []
  try {
    const res = await getLogList(buildQueryParams())
    tableData.value = res.data.list; total.value = res.data.total
    if (res.data.warnings && res.data.warnings.length > 0) warnings.value = res.data.warnings
  } catch (e: any) { ElMessage.error(e.message || '获取日志列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { page.value = 1; fetchList() }
const handleReset = () => {
  filterForm.username = ''; filterForm.module = ''; filterForm.action = ''
  filterForm.result = ''; filterForm.riskLevel = ''; filterForm.keyword = ''
  dateRange.value = null; warnings.value = []
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k] = false })
  page.value = 1; fetchList()
}
const handlePageChange = () => fetchList()
const handleSizeChange = () => { page.value = 1; fetchList() }

const getRoleLabel = (r?: string) => !r ? '-' : ((UserRoleLabel as Record<string, string>)[r] || r)
const getRoleTagType = (r?: string) => ({ super_admin: 'danger', admin: 'warning', auditor: 'primary', operator: 'success', member: 'info' }[r || ''] || 'info')
const getActionTagType = (a?: string) => ({
  create: 'success', update: 'primary', delete: 'danger', approve: 'success', reject: 'danger',
  handle: 'warning', review: 'primary', login: 'info', export: 'info', import: 'info',
  batch: 'warning', restore: 'success', discard: 'danger'
}[a || ''] || 'info')
const getRiskTagType = (l: string) => ({ none: 'info', low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }[l] || 'info')
const getRiskLabel = (l: string) => ({ none: '无风险', low: '低风险', medium: '中风险', high: '高风险', critical: '严重风险' }[l] || l)

const formatDateTime = (d: string) => !d ? '-' : d.replace('T', ' ').substring(0, 19)
const formatValue = (v: any): string => {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
const isFieldChanged = (key: string): boolean => currentLog.value?.changedFields?.includes(key) || false

const viewDetail = async (row: OperationLog) => {
  try {
    const res = await getLogDetail(row.id)
    currentLog.value = res.data; detailStep.value = 0; detailDialogVisible.value = true
    saveQueryRecord([row.id])
  } catch (e: any) { ElMessage.error(e.message || '获取日志详情失败') }
}
const handleRowDblclick = (row: OperationLog) => viewDetail(row)
const quickViewLog = (log: OperationLog) => { currentLog.value = log; detailStep.value = 0; detailDialogVisible.value = true }
const closeDetailDialog = () => { detailDialogVisible.value = false; currentLog.value = null }

const viewTrace = async (row: OperationLog) => {
  try { const res = await getLogTraceByLogId(row.id); traceResult.value = res.data; traceDialogVisible.value = true }
  catch (e: any) { ElMessage.error(e.message || '获取溯源信息失败') }
}
const closeTraceDialog = () => { traceDialogVisible.value = false; traceResult.value = null }

const getTimelineType = (log: OperationLog) => {
  if (log.isMalicious) return 'danger'
  if (log.result === 'fail') return 'warning'
  if (log.riskLevel === 'high' || log.riskLevel === 'critical') return 'danger'
  if (log.riskLevel === 'medium') return 'warning'
  return 'primary'
}
const getTimelineIcon = (log: OperationLog) => log.isMalicious ? Warning : log.result === 'fail' ? CircleClose : CircleCheck

const openExportDialog = () => {
  exportDateRange.value = dateRange.value
  exportForm.username = filterForm.username; exportForm.module = filterForm.module
  exportForm.action = filterForm.action; exportForm.result = filterForm.result
  exporting.value = false; exportProgress.value = 0; exportDialogVisible.value = true
}
const closeExportDialog = () => { if (exporting.value) return; exportDialogVisible.value = false }

const handleExport = async () => {
  if (!exportDateRange.value || exportDateRange.value.length !== 2) { ElMessage.warning('请选择导出的时间范围'); return }
  const params: LogExportParams = {
    startDate: exportDateRange.value[0], endDate: exportDateRange.value[1],
    username: exportForm.username || undefined, module: exportForm.module || undefined,
    action: exportForm.action || undefined, result: exportForm.result || undefined,
    exportFields: exportForm.exportFields
  }
  exporting.value = true; exportProgress.value = 0; exportProcessed.value = 0
  try {
    for (let i = 1; i <= 90; i += 10) {
      await new Promise(r => setTimeout(r, 80))
      exportProgress.value = i; exportProcessed.value = Math.floor((i / 100) * total.value)
    }
    const res = await exportLogs(params)
    exportProgress.value = 100; exportTotal.value = res.data.total
    exportProcessed.value = res.data.exportedCount; exportFiltered.value = res.data.filteredEmpty
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `operation_logs_${Date.now()}.json`
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
    ElMessage.success(`导出成功，共导出 ${res.data.exportedCount} 条日志`)
    setTimeout(() => { exportDialogVisible.value = false; exporting.value = false }, 1000)
  } catch (e: any) { ElMessage.error(e.message || '导出失败'); exporting.value = false }
}

const loadQueryHistory = () => {
  try { const s = localStorage.getItem(HISTORY_STORAGE_KEY); if (s) queryHistory.value = JSON.parse(s) } catch (e) { console.error(e) }
}
const saveQueryRecord = (viewedLogIds: number[]) => {
  const rec: LogQueryRecord = {
    id: `QRY_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    params: buildQueryParams(), count: total.value, viewedAt: new Date().toISOString(), viewedLogIds
  }
  queryHistory.value.unshift(rec)
  if (queryHistory.value.length > MAX_HISTORY) queryHistory.value = queryHistory.value.slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(queryHistory.value))
}
const applyHistoryRecord = (rec: LogQueryRecord) => {
  filterForm.username = rec.params.username || ''; filterForm.module = rec.params.module || ''
  filterForm.action = rec.params.action || ''; filterForm.result = rec.params.result || ''
  filterForm.riskLevel = rec.params.riskLevel || ''; filterForm.keyword = rec.params.keyword || ''
  if (rec.params.startDate && rec.params.endDate) dateRange.value = [rec.params.startDate, rec.params.endDate]
  else dateRange.value = null
  page.value = 1; showQueryHistory.value = false; fetchList()
}

onMounted(async () => { loadQueryHistory(); await fetchOptions(); await Promise.all([fetchList(), fetchStats()]) })
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
.log-page {
  .log-tabs {
    margin-bottom: 16px;
    background: $bg-color-ffffff;
    border-radius: $border-radius-large;
    padding: 4px 16px 0;
    box-shadow: $shadow-light;
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }
    .tab-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }
  }
  .log-stats {
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
        &.stat-success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        &.stat-risk { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
      }
      .stat-info { .stat-value { font-size: 28px; font-weight: 600; color: $text-primary; line-height: 1.2; }
        .stat-label { font-size: $font-size-small; color: $text-secondary; margin-top: 4px; } }
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
    .log-table {
      :deep(.el-table__row) { cursor: pointer; transition: background-color 0.2s ease; &:hover { background-color: rgba(64, 158, 255, 0.04); } }
      .operator-cell { display: flex; align-items: center; justify-content: center; }
      .changed-badge { animation: pulse 2s infinite; }
      .no-change, .no-risk { color: $text-secondary; }
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
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
    .trace-id { font-family: monospace; font-size: $font-size-small; background: $bg-color; padding: 2px 8px; border-radius: 4px; }
    .json-viewer {
      background: #f8f9fa; border-radius: $border-radius; padding: 16px; max-height: 400px; overflow: auto;
      &.small { max-height: 200px; padding: 12px; }
      pre { margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: $font-size-small; line-height: 1.6; color: #333; white-space: pre-wrap; word-break: break-all; }
    }
    .data-compare {
      display: flex; align-items: stretch; gap: 12px;
      .compare-col { flex: 1; border: 1px solid $border-color-lighter; border-radius: $border-radius; overflow: hidden;
        .compare-header { padding: 10px 16px; font-weight: 600; display: flex; align-items: center; gap: 6px;
          &.before-header { background: #fef0f0; color: $danger-color; }
          &.after-header { background: #f0f9eb; color: $success-color; }
        }
        .compare-content {
          padding: 12px 16px; max-height: 300px; overflow: auto;
          .compare-item {
            padding: 6px 0; border-bottom: 1px dashed $border-color-extra-light; font-size: $font-size-small;
            display: flex; align-items: center; flex-wrap: wrap; &:last-child { border-bottom: none; }
            &.is-changed { background: rgba(230, 162, 60, 0.08); margin: 0 -16px; padding: 6px 16px; border-radius: 4px; }
            .field-name { font-weight: 600; color: $text-regular; min-width: 100px; }
            .field-value { color: $text-primary; font-family: monospace; }
          }
        }
      }
      .compare-arrow { display: flex; align-items: center; justify-content: center; }
    }
    .ua-text { font-family: monospace; font-size: $font-size-small; color: $text-regular; word-break: break-all; line-height: 1.5; }
    .hash-text { font-family: monospace; font-size: $font-size-small; color: $text-secondary; word-break: break-all; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 8px; }
  }
}
.trace-dialog {
  .trace-content {
    .trace-summary { margin-bottom: 16px; }
    .trace-alerts { margin-bottom: 16px; }
    .trace-id { font-family: monospace; font-size: $font-size-small; background: $bg-color; padding: 2px 8px; border-radius: 4px; }
    .trace-timeline {
      max-height: 500px; overflow: auto; padding-right: 8px;
      .timeline-card {
        background: $bg-color-page; border-radius: $border-radius; padding: 12px 16px; cursor: pointer;
        transition: all 0.2s ease; border: 1px solid transparent;
        &:hover { background: rgba(64, 158, 255, 0.06); border-color: rgba(64, 158, 255, 0.2); }
        &.is-malicious { background: rgba(245, 108, 108, 0.08); border-color: rgba(245, 108, 108, 0.2); }
        .timeline-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;
          .step-tag { font-weight: 600; color: $primary-color; font-size: $font-size-small; }
          .timeline-operator { margin-left: auto; font-size: $font-size-small; color: $text-secondary; }
        }
        .timeline-body { .timeline-row { font-size: $font-size-small; color: $text-regular; margin-bottom: 4px;
          .row-label { color: $text-secondary; margin-right: 4px; }
          .text-danger { color: $danger-color; }
        } }
        .timeline-footer { display: flex; gap: 12px; margin-top: 8px; font-size: $font-size-extra-small; color: $text-secondary;
          .duration-tag, .ip-tag { background: $bg-color; padding: 2px 8px; border-radius: 4px; }
        }
      }
    }
    .trace-evidence { margin-top: 16px;
      .evidence-hash { .hash-item { padding: 6px 0; border-bottom: 1px dashed $border-color-extra-light;
        &:last-child { border-bottom: none; }
        .hash-label { color: $text-secondary; margin-right: 8px; font-size: $font-size-small; }
        .hash-value { font-family: monospace; font-size: $font-size-extra-small; color: $text-regular; word-break: break-all; }
      } }
    }
  }
}
.export-dialog {
  .export-content {
    .export-progress { margin-top: 16px;
      .progress-text { margin-top: 8px; font-size: $font-size-small; color: $text-regular; text-align: center;
        .filtered-text { color: $warning-color; margin-left: 8px; }
      }
    }
  }
}
.empty-history { padding: 40px 0; }
.history-list { .history-item {
  padding: 12px; border-radius: $border-radius; cursor: pointer; margin-bottom: 8px;
  background: $bg-color-page; transition: all 0.2s ease; border: 1px solid transparent;
  &:hover { background: rgba(64, 158, 255, 0.06); border-color: rgba(64, 158, 255, 0.2); }
  .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    .history-time { font-size: $font-size-extra-small; color: $text-secondary; }
  }
  .history-params { display: flex; flex-wrap: wrap; gap: 6px;
    .param-tag { display: inline-flex; align-items: center; gap: 2px; font-size: $font-size-extra-small;
      background: $bg-color-ffffff; padding: 2px 8px; border-radius: 4px; color: $text-regular;
      border: 1px solid $border-color-lighter; .el-icon { font-size: 12px; }
    }
  }
} }
.card-wrapper { background: $bg-color-ffffff; border-radius: $border-radius-large; padding: 20px; box-shadow: $shadow-light; }
</style>
