<template>
  <div class="login-logs-container" ref="containerRef">
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="filterForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="登录时间">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="设备">
          <el-input
            v-model="filterForm.loginDevice"
            placeholder="请输入设备信息"
            clearable
          />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input
            v-model="filterForm.loginIp"
            placeholder="请输入IP地址"
            clearable
          />
        </el-form-item>
        <el-form-item label="登录状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="登录成功" value="success" />
            <el-option label="登录失败" value="failed" />
            <el-option label="异常登录" value="anomaly" />
            <el-option label="待验证" value="pending_verify" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="filterForm.riskLevel" placeholder="全部等级" clearable>
            <el-option label="低风险" value="low" />
            <el-option label="中风险" value="medium" />
            <el-option label="高风险" value="high" />
            <el-option label="极高风险" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleGenerateReport" :loading="generatingReport">
            <el-icon><Document /></el-icon>
            生成风控报告
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <div class="batch-actions" v-if="selectedIds.length > 0">
          <span class="selected-count">已选择 {{ selectedIds.length }} 条记录</span>
          <el-button
            type="danger"
            size="small"
            @click="handleBatchMarkRisk"
            :loading="batchLoading"
          >
            <el-icon><Warning /></el-icon>
            批量标记风险
          </el-button>
          <el-button
            type="warning"
            size="small"
            @click="handleBatchClearRisk"
            :loading="batchLoading"
          >
            <el-icon><CircleCheck /></el-icon>
            批量清除风险
          </el-button>
          <el-button
            type="info"
            size="small"
            @click="handleBatchClearNormal"
            :loading="batchLoading"
          >
            <el-icon><Delete /></el-icon>
            批量清除正常记录
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleBatchLockDevices"
            :loading="batchLoading"
          >
            <el-icon><Lock /></el-icon>
            批量锁定设备
          </el-button>
        </div>
        <div class="stats-info">
          <el-tag type="success">今日登录: {{ stats.todayLogins }}</el-tag>
          <el-tag type="danger">异常登录: {{ stats.anomalyLogins }}</el-tag>
          <el-tag type="warning">待处理风险: {{ stats.pendingRisks }}</el-tag>
        </div>
      </div>

      <div class="table-wrapper" ref="tableWrapperRef" @scroll="handleTableScroll">
        <el-table
          :data="tableData"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          :row-class-name="getRowClassName"
          height="100%"
          class="login-logs-table"
        >
          <el-table-column type="selection" width="50" fixed="left" />
          <el-table-column prop="id" label="ID" width="70" fixed="left" />
          <el-table-column prop="username" label="用户名" width="120" fixed="left" />
          <el-table-column prop="loginTime" label="登录时间" width="170" fixed="left" />
          <el-table-column prop="loginIp" label="IP地址" width="130" />
          <el-table-column prop="loginLocation" label="登录地点" width="120" />
          <el-table-column prop="loginDevice" label="登录设备" width="150" />
          <el-table-column label="浏览器/系统" width="180">
            <template #default="{ row }">
              <div class="browser-info">
                <span>{{ row.browserInfo }}</span>
                <span class="os-info">{{ row.osInfo }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.riskLevel" :type="getRiskTagType(row.riskLevel)" size="small" effect="dark">
                {{ getRiskLevelLabel(row.riskLevel) }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="riskScore" label="风险评分" width="90">
            <template #default="{ row }">
              <span :class="getRiskScoreClass(row.riskScore)">
                {{ row.riskScore ?? '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="异常标记" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.markedRisk" type="danger" size="small">已标记</el-tag>
              <el-tag v-else-if="row.isAnomaly" type="warning" size="small">异常</el-tag>
              <span v-else class="text-muted">正常</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                详情
              </el-button>
              <el-button type="primary" link size="small" @click="handleViewTraceability(row)">
                溯源
              </el-button>
              <el-button
                v-if="!row.markedRisk"
                type="danger"
                link
                size="small"
                @click="handleMarkRisk(row)"
              >
                标记风险
              </el-button>
              <el-button
                v-else
                type="success"
                link
                size="small"
                @click="handleClearRisk(row)"
              >
                清除风险
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-button
      v-show="showBackTop"
      class="back-top-btn"
      type="primary"
      circle
      @click="handleBackTop"
    >
      <el-icon><Top /></el-icon>
    </el-button>

    <el-dialog
      v-model="showDetailDialog"
      title="登录日志详情"
      width="700px"
      class="detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="currentLog" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ currentLog.username }}</el-descriptions-item>
          <el-descriptions-item label="登录时间">{{ currentLog.loginTime }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.loginIp }}</el-descriptions-item>
          <el-descriptions-item label="登录地点">{{ currentLog.loginLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录设备">{{ currentLog.loginDevice }}</el-descriptions-item>
          <el-descriptions-item label="浏览器">{{ currentLog.browserInfo }}</el-descriptions-item>
          <el-descriptions-item label="操作系统">{{ currentLog.osInfo }}</el-descriptions-item>
          <el-descriptions-item label="屏幕分辨率">{{ currentLog.screenResolution || '-' }}</el-descriptions-item>
          <el-descriptions-item label="时区">{{ currentLog.timezone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="语言">{{ currentLog.language || '-' }}</el-descriptions-item>
          <el-descriptions-item label="网络类型">{{ currentLog.networkType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="ISP">{{ currentLog.isp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录状态">
            <el-tag :type="getStatusTagType(currentLog.status)" size="small">
              {{ getStatusLabel(currentLog.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag v-if="currentLog.riskLevel" :type="getRiskTagType(currentLog.riskLevel)" size="small" effect="dark">
              {{ getRiskLevelLabel(currentLog.riskLevel) }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="风险评分" v-if="currentLog.riskScore !== undefined">
            <span :class="getRiskScoreClass(currentLog.riskScore)">
              {{ currentLog.riskScore }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="是否异常">
            <el-tag :type="currentLog.isAnomaly ? 'danger' : 'success'" size="small">
              {{ currentLog.isAnomaly ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常类型" v-if="currentLog.anomalyType">
            {{ getAnomalyTypeLabel(currentLog.anomalyType) }}
          </el-descriptions-item>
          <el-descriptions-item label="异常详情" v-if="currentLog.anomalyDetail" :span="2">
            {{ currentLog.anomalyDetail }}
          </el-descriptions-item>
          <el-descriptions-item label="代理检测">
            <el-tag :type="currentLog.proxyDetected ? 'danger' : 'success'" size="small">
              {{ currentLog.proxyDetected ? '检测到' : '未检测到' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="VPN检测">
            <el-tag :type="currentLog.vpnDetected ? 'danger' : 'success'" size="small">
              {{ currentLog.vpnDetected ? '检测到' : '未检测到' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备指纹" :span="2">
            <span class="monospace-text">{{ currentLog.deviceFingerprint }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="二次验证" v-if="currentLog.requireTwoFactor">
            <el-tag :type="currentLog.twoFactorVerified ? 'success' : 'warning'" size="small">
              {{ currentLog.twoFactorVerified ? '已验证' : '待验证' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="验证类型" v-if="currentLog.twoFactorType">
            {{ getTwoFactorTypeLabel(currentLog.twoFactorType) }}
          </el-descriptions-item>
          <el-descriptions-item label="风险标记">
            <el-tag v-if="currentLog.markedRisk" type="danger" size="small">已标记</el-tag>
            <span v-else>未标记</span>
          </el-descriptions-item>
          <el-descriptions-item label="设备锁定">
            <el-tag v-if="currentLog.deviceLocked" type="danger" size="small">已锁定</el-tag>
            <span v-else>未锁定</span>
          </el-descriptions-item>
          <el-descriptions-item label="标记原因" v-if="currentLog.markedRiskReason" :span="2">
            {{ currentLog.markedRiskReason }}
          </el-descriptions-item>
          <el-descriptions-item label="标记时间" v-if="currentLog.markedRiskTime">
            {{ currentLog.markedRiskTime }}
          </el-descriptions-item>
          <el-descriptions-item label="失败原因" v-if="currentLog.failReason" :span="2">
            {{ currentLog.failReason }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button
          v-if="currentLog && !currentLog.markedRisk"
          type="danger"
          @click="handleMarkRisk(currentLog)"
        >
          标记风险
        </el-button>
        <el-button
          v-if="currentLog && currentLog.markedRisk"
          type="success"
          @click="handleClearRisk(currentLog)"
        >
          清除风险
        </el-button>
        <el-button type="primary" @click="handleViewTraceability(currentLog)">
          查看溯源
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showTraceabilityDialog"
      title="登录行为全链路溯源"
      width="900px"
      class="traceability-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="traceabilityInfo" class="traceability-content">
        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#409eff"><User /></el-icon>
            用户信息
          </h3>
          <el-descriptions :column="3" size="small" border>
            <el-descriptions-item label="用户名">{{ traceabilityInfo.user.username }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ traceabilityInfo.user.realName }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ traceabilityInfo.user.role }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="traceabilityInfo.user.accountStatus === 'normal' ? 'success' : 'danger'" size="small">
                {{ traceabilityInfo.user.accountStatus === 'normal' ? '正常' : '异常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="在线状态">
              <el-tag :type="traceabilityInfo.user.onlineStatus === 'online' ? 'success' : 'info'" size="small">
                {{ getOnlineStatusLabel(traceabilityInfo.user.onlineStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="登录次数">{{ traceabilityInfo.user.loginCount }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#e6a23c"><Monitor /></el-icon>
            设备信息
          </h3>
          <el-descriptions :column="3" size="small" border>
            <el-descriptions-item label="设备">{{ traceabilityInfo.deviceInfo.device }}</el-descriptions-item>
            <el-descriptions-item label="浏览器">{{ traceabilityInfo.deviceInfo.browser }}</el-descriptions-item>
            <el-descriptions-item label="操作系统">{{ traceabilityInfo.deviceInfo.os }}</el-descriptions-item>
            <el-descriptions-item label="分辨率">{{ traceabilityInfo.deviceInfo.screenResolution }}</el-descriptions-item>
            <el-descriptions-item label="时区">{{ traceabilityInfo.deviceInfo.timezone }}</el-descriptions-item>
            <el-descriptions-item label="语言">{{ traceabilityInfo.deviceInfo.language }}</el-descriptions-item>
            <el-descriptions-item label="设备指纹" :span="3">
              <span class="monospace-text">{{ traceabilityInfo.deviceInfo.deviceFingerprint }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#67c23a"><Connection /></el-icon>
            网络信息
          </h3>
          <el-descriptions :column="3" size="small" border>
            <el-descriptions-item label="IP地址">{{ traceabilityInfo.networkInfo.ip }}</el-descriptions-item>
            <el-descriptions-item label="位置">{{ traceabilityInfo.networkInfo.location }}</el-descriptions-item>
            <el-descriptions-item label="ISP">{{ traceabilityInfo.networkInfo.isp || '-' }}</el-descriptions-item>
            <el-descriptions-item label="网络类型">{{ traceabilityInfo.networkInfo.networkType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经纬度">
              {{ traceabilityInfo.networkInfo.latitude }}, {{ traceabilityInfo.networkInfo.longitude }}
            </el-descriptions-item>
            <el-descriptions-item label="代理/VPN">
              <el-tag
                :type="traceabilityInfo.networkInfo.proxyDetected || traceabilityInfo.networkInfo.vpnDetected ? 'danger' : 'success'"
                size="small"
              >
                {{ traceabilityInfo.networkInfo.proxyDetected || traceabilityInfo.networkInfo.vpnDetected ? '检测到' : '正常' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#f56c6c"><Warning /></el-icon>
            风险信息
          </h3>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="是否异常">
              <el-tag :type="traceabilityInfo.riskInfo.isAnomaly ? 'danger' : 'success'" size="small">
                {{ traceabilityInfo.riskInfo.isAnomaly ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskTagType(traceabilityInfo.riskInfo.riskLevel)" size="small" effect="dark">
                {{ getRiskLevelLabel(traceabilityInfo.riskInfo.riskLevel) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="异常类型">{{ getAnomalyTypeLabel(traceabilityInfo.riskInfo.anomalyType) }}</el-descriptions-item>
            <el-descriptions-item label="是否标记风险">
              <el-tag :type="traceabilityInfo.riskInfo.markedRisk ? 'danger' : 'success'" size="small">
                {{ traceabilityInfo.riskInfo.markedRisk ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="异常详情" :span="2">
              {{ traceabilityInfo.riskInfo.anomalyDetail || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#909399"><Key /></el-icon>
            验证信息
          </h3>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="是否需要二次验证">
              <el-tag :type="traceabilityInfo.verificationInfo.requireTwoFactor ? 'warning' : 'success'" size="small">
                {{ traceabilityInfo.verificationInfo.requireTwoFactor ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="是否已验证">
              <el-tag :type="traceabilityInfo.verificationInfo.twoFactorVerified ? 'success' : 'info'" size="small">
                {{ traceabilityInfo.verificationInfo.twoFactorVerified ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="验证类型" v-if="traceabilityInfo.verificationInfo.twoFactorType">
              {{ getTwoFactorTypeLabel(traceabilityInfo.verificationInfo.twoFactorType) }}
            </el-descriptions-item>
            <el-descriptions-item label="验证时间" v-if="traceabilityInfo.verificationInfo.twoFactorVerifyTime">
              {{ traceabilityInfo.verificationInfo.twoFactorVerifyTime }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#409eff"><Histogram /></el-icon>
            真实性校验
            <el-button
              type="primary"
              size="small"
              :loading="verifyingAuthenticity"
              @click="handleVerifyAuthenticity"
              style="margin-left: 16px"
            >
              开始校验
            </el-button>
          </h3>
          <div v-if="authenticityResult" class="authenticity-result">
            <div class="authenticity-score">
              <div class="score-circle" :class="getAuthenticityScoreClass(authenticityResult.score)">
                <span class="score-value">{{ authenticityResult.score }}</span>
                <span class="score-label">分</span>
              </div>
              <div class="authenticity-status">
                <el-tag :type="authenticityResult.authentic ? 'success' : 'danger'" size="large">
                  {{ authenticityResult.authentic ? '登录行为真实' : '登录行为可疑' }}
                </el-tag>
              </div>
            </div>
            <div v-if="authenticityResult.issues.length > 0" class="authenticity-issues">
              <h4>发现问题：</h4>
              <ul>
                <li v-for="(issue, index) in authenticityResult.issues" :key="index">
                  <el-icon color="#f56c6c"><Warning /></el-icon>
                  {{ issue }}
                </li>
              </ul>
            </div>
            <div v-if="authenticityResult.recommendations.length > 0" class="authenticity-recommendations">
              <h4>建议：</h4>
              <ul>
                <li v-for="(rec, index) in authenticityResult.recommendations" :key="index">
                  <el-icon color="#409eff"><InfoFilled /></el-icon>
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="trace-section">
          <h3 class="section-title">
            <el-icon color="#909399"><Clock /></el-icon>
            最近登录记录
          </h3>
          <el-table :data="traceabilityInfo.recentLogins" size="small" max-height="200">
            <el-table-column prop="loginTime" label="登录时间" width="170" />
            <el-table-column prop="loginIp" label="IP地址" width="130" />
            <el-table-column prop="loginLocation" label="地点" width="120" />
            <el-table-column prop="loginDevice" label="设备" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTraceabilityDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showReportDialog"
      title="用户登录风控报告"
      width="1000px"
      class="report-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="riskReport" class="report-content">
        <div class="report-header">
          <h2>用户登录风控报告</h2>
          <p class="report-info">
            生成时间：{{ riskReport.generatedAt }} |
            生成人：{{ riskReport.generatedBy }} |
            时间范围：{{ riskReport.timeRange.startTime || '不限' }} - {{ riskReport.timeRange.endTime || '不限' }}
          </p>
        </div>

        <div class="report-summary">
          <h3>统计概览</h3>
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-value">{{ riskReport.summary.totalLogins }}</div>
              <div class="card-label">总登录次数</div>
            </div>
            <div class="summary-card success">
              <div class="card-value">{{ riskReport.summary.successLogins }}</div>
              <div class="card-label">成功登录</div>
            </div>
            <div class="summary-card danger">
              <div class="card-value">{{ riskReport.summary.failedLogins }}</div>
              <div class="card-label">失败登录</div>
            </div>
            <div class="summary-card warning">
              <div class="card-value">{{ riskReport.summary.anomalyLogins }}</div>
              <div class="card-label">异常登录</div>
            </div>
            <div class="summary-card danger">
              <div class="card-value">{{ riskReport.summary.markedRisks }}</div>
              <div class="card-label">标记风险</div>
            </div>
            <div class="summary-card warning">
              <div class="card-value">{{ riskReport.summary.pendingVerifications }}</div>
              <div class="card-label">待验证</div>
            </div>
            <div class="summary-card success">
              <div class="card-value">{{ riskReport.summary.successRate }}</div>
              <div class="card-label">成功率</div>
            </div>
            <div class="summary-card danger">
              <div class="card-value">{{ riskReport.summary.anomalyRate }}</div>
              <div class="card-label">异常率</div>
            </div>
            <div class="summary-card warning">
              <div class="card-value">{{ riskReport.summary.avgRiskScore }}</div>
              <div class="card-label">平均风险分</div>
            </div>
          </div>
        </div>

        <div class="report-section">
          <h3>异常类型分布</h3>
          <div class="distribution-chart">
            <div
              v-for="item in riskReport.anomalyDistribution"
              :key="item.type"
              class="distribution-item"
            >
              <span class="item-label">{{ item.label }}</span>
              <div class="item-bar">
                <div
                  class="bar-fill"
                  :style="{ width: getBarWidth(item.count, riskReport.summary.anomalyLogins) }"
                ></div>
              </div>
              <span class="item-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <div class="report-section">
          <h3>风险等级分布</h3>
          <div class="risk-distribution">
            <div
              v-for="item in riskReport.riskDistribution"
              :key="item.level"
              class="risk-item"
            >
              <div class="risk-bar" :style="{ backgroundColor: item.color }">
                <div class="risk-bar-fill" :style="{ height: getBarHeight(item.count, riskReport.summary.totalLogins) }">
                  <span class="risk-count">{{ item.count }}</span>
                </div>
              </div>
              <div class="risk-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <div class="report-section">
          <h3>高频登录IP TOP10</h3>
          <el-table :data="riskReport.topIps" size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="count" label="登录次数" width="120">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="report-section">
          <h3>高频登录设备 TOP10</h3>
          <el-table :data="riskReport.topDevices" size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="device" label="设备指纹">
              <template #default="{ row }">
                <span class="monospace-text">{{ row.device }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="登录次数" width="120">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="report-section">
          <h3>活跃用户 TOP10</h3>
          <el-table :data="riskReport.topUsers" size="small">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="count" label="登录次数" width="120">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showReportDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleExportReport">导出报告</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showMarkRiskDialog"
      title="标记风险记录"
      width="480px"
    >
      <el-form :model="markRiskForm" label-width="100px">
        <el-form-item label="风险原因" required>
          <el-input
            v-model="markRiskForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入风险原因说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMarkRiskDialog = false">取消</el-button>
        <el-button type="danger" :loading="markingRisk" @click="confirmMarkRisk">
          确认标记
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showClearRiskDialog"
      title="清除风险标记"
      width="480px"
    >
      <el-form :model="clearRiskForm" label-width="100px">
        <el-form-item label="处理备注">
          <el-input
            v-model="clearRiskForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showClearRiskDialog = false">取消</el-button>
        <el-button type="success" :loading="clearingRisk" @click="confirmClearRisk">
          确认清除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Refresh,
  Document,
  Warning,
  CircleCheck,
  Delete,
  Lock,
  Top,
  User,
  Monitor,
  Connection,
  Key,
  Histogram,
  Clock,
  InfoFilled,
} from '@element-plus/icons-vue';
import type { LoginLogItem, LoginTraceabilityInfo, AuthenticityVerifyResult, RiskReportData } from '@/api/user-permission';
import {
  getLoginLogsApi,
  getLoginLogDetailApi,
  markLoginRiskApi,
  clearLoginRiskApi,
  batchMarkRiskApi,
  batchClearRiskApi,
  batchClearNormalRecordsApi,
  batchLockDevicesApi,
  getLoginTraceabilityApi,
  verifyLoginAuthenticityApi,
  generateRiskReportApi,
} from '@/api/user-permission';

const containerRef = ref<HTMLElement>();
const tableWrapperRef = ref<HTMLElement>();
const loading = ref(false);
const batchLoading = ref(false);
const generatingReport = ref(false);
const verifyingAuthenticity = ref(false);
const markingRisk = ref(false);
const clearingRisk = ref(false);
const showBackTop = ref(false);
const showDetailDialog = ref(false);
const showTraceabilityDialog = ref(false);
const showReportDialog = ref(false);
const showMarkRiskDialog = ref(false);
const showClearRiskDialog = ref(false);

const filterForm = reactive({
  username: '',
  timeRange: [] as string[],
  loginDevice: '',
  loginIp: '',
  status: '',
  riskLevel: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref<LoginLogItem[]>([]);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<LoginLogItem[]>([]);
const currentLog = ref<LoginLogItem | null>(null);
const traceabilityInfo = ref<LoginTraceabilityInfo | null>(null);
const authenticityResult = ref<AuthenticityVerifyResult | null>(null);
const riskReport = ref<RiskReportData | null>(null);

const markRiskForm = reactive({
  reason: '',
});

const clearRiskForm = reactive({
  remark: '',
});

const stats = reactive({
  todayLogins: 0,
  anomalyLogins: 0,
  pendingRisks: 0,
});

let pendingMarkRow: LoginLogItem | null = null;
let pendingClearRow: LoginLogItem | null = null;

const fetchData = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm,
    };

    if (filterForm.timeRange && filterForm.timeRange.length === 2) {
      params.startTime = filterForm.timeRange[0];
      params.endTime = filterForm.timeRange[1];
    }

    const res = await getLoginLogsApi(params);
    tableData.value = res.list || [];
    pagination.total = res.total || 0;

    stats.todayLogins = tableData.value.filter(
      (item) => new Date(item.loginTime).toDateString() === new Date().toDateString()
    ).length;
    stats.anomalyLogins = tableData.value.filter((item) => item.isAnomaly).length;
    stats.pendingRisks = tableData.value.filter((item) => item.markedRisk).length;
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

const handleReset = () => {
  filterForm.username = '';
  filterForm.timeRange = [];
  filterForm.loginDevice = '';
  filterForm.loginIp = '';
  filterForm.status = '';
  filterForm.riskLevel = '';
  pagination.page = 1;
  fetchData();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchData();
};

const handleSelectionChange = (selection: LoginLogItem[]) => {
  selectedRows.value = selection;
  selectedIds.value = selection.map((item) => item.id);
};

const getRowClassName = ({ row }: { row: LoginLogItem }) => {
  if (selectedIds.value.includes(row.id)) {
    return 'row-selected';
  }
  if (row.markedRisk) {
    return 'row-risk-marked';
  }
  if (row.isAnomaly) {
    return 'row-anomaly';
  }
  return '';
};

const getStatusTagType = (status: string) => {
  const typeMap: Record<string, any> = {
    success: 'success',
    failed: 'danger',
    anomaly: 'warning',
    pending_verify: 'warning',
  };
  return typeMap[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    anomaly: '异常',
    pending_verify: '待验证',
  };
  return labelMap[status] || status;
};

const getRiskTagType = (level: string) => {
  const typeMap: Record<string, any> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };
  return typeMap[level] || 'info';
};

const getRiskLevelLabel = (level: string) => {
  const labelMap: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险',
  };
  return labelMap[level] || level;
};

const getRiskScoreClass = (score?: number) => {
  if (score === undefined || score === null) return 'text-muted';
  if (score >= 80) return 'risk-score-critical';
  if (score >= 60) return 'risk-score-high';
  if (score >= 30) return 'risk-score-medium';
  return 'risk-score-low';
};

const getAnomalyTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    abnormal_location: '异地登录',
    abnormal_device: '异常设备',
    abnormal_time: '异常时间',
    abnormal_frequency: '高频登录',
    abnormal_multi_device: '多设备同时在线',
    suspicious_script: '可疑脚本',
    forged_login: '伪造登录',
    credential_stuffing: '撞库攻击',
    abnormal_ip: '违规IP',
    high_risk_device: '高风险设备',
  };
  return labelMap[type] || type;
};

const getTwoFactorTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    sms: '短信验证',
    email: '邮箱验证',
    totp: '动态口令',
    question: '安全问题',
  };
  return labelMap[type] || type;
};

const getOnlineStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    busy: '忙碌',
    away: '离开',
  };
  return labelMap[status] || status;
};

const handleTableScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  showBackTop.value = target.scrollTop > 500;
};

const handleBackTop = () => {
  if (tableWrapperRef.value) {
    tableWrapperRef.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handleViewDetail = async (row: LoginLogItem) => {
  try {
    const res = await getLoginLogDetailApi(row.id);
    currentLog.value = res;
    showDetailDialog.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败');
  }
};

const handleViewTraceability = async (row: LoginLogItem) => {
  try {
    const res = await getLoginTraceabilityApi(row.id);
    traceabilityInfo.value = res;
    authenticityResult.value = null;
    showDetailDialog.value = false;
    showTraceabilityDialog.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '获取溯源信息失败');
  }
};

const handleVerifyAuthenticity = async () => {
  if (!currentLog.value) return;
  verifyingAuthenticity.value = true;
  try {
    const res = await verifyLoginAuthenticityApi(currentLog.value.id);
    authenticityResult.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || '校验失败');
  } finally {
    verifyingAuthenticity.value = false;
  }
};

const getAuthenticityScoreClass = (score: number) => {
  if (score >= 80) return 'score-good';
  if (score >= 60) return 'score-medium';
  return 'score-bad';
};

const handleMarkRisk = (row: LoginLogItem) => {
  pendingMarkRow = row;
  markRiskForm.reason = '';
  showDetailDialog.value = false;
  showMarkRiskDialog.value = true;
};

const confirmMarkRisk = async () => {
  if (!markRiskForm.reason.trim()) {
    ElMessage.warning('请输入风险原因');
    return;
  }
  markingRisk.value = true;
  try {
    if (pendingMarkRow && pendingMarkRow.id > 0) {
      await markLoginRiskApi(pendingMarkRow.id, markRiskForm.reason.trim());
      ElMessage.success('标记成功');
    } else if (selectedIds.value.length > 0) {
      const res = await batchMarkRiskApi(selectedIds.value, markRiskForm.reason.trim());
      ElMessage.success(`成功标记 ${res.success} 条，失败 ${res.failed} 条`);
      selectedIds.value = [];
    }
    showMarkRiskDialog.value = false;
    pendingMarkRow = null;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || '标记失败');
  } finally {
    markingRisk.value = false;
  }
};

const handleClearRisk = (row: LoginLogItem) => {
  pendingClearRow = row;
  clearRiskForm.remark = '';
  showDetailDialog.value = false;
  showClearRiskDialog.value = true;
};

const confirmClearRisk = async () => {
  if (!pendingClearRow) return;
  clearingRisk.value = true;
  try {
    await clearLoginRiskApi(pendingClearRow.id, clearRiskForm.remark.trim() || '清除风险标记');
    ElMessage.success('清除成功');
    showClearRiskDialog.value = false;
    pendingClearRow = null;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || '清除失败');
  } finally {
    clearingRisk.value = false;
  }
};

const handleBatchMarkRisk = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要标记的记录');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 条记录标记为风险吗？`,
      '批量标记风险',
      { type: 'warning' }
    );
    pendingMarkRow = { id: 0 } as LoginLogItem;
    markRiskForm.reason = '';
    showMarkRiskDialog.value = true;
  } catch {
    // 用户取消
  }
};

const handleBatchClearRisk = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要清除的记录');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要清除选中的 ${selectedIds.value.length} 条记录的风险标记吗？`,
      '批量清除风险',
      { type: 'warning' }
    );
    batchLoading.value = true;
    const res = await batchClearRiskApi(selectedIds.value, '批量清除风险标记');
    ElMessage.success(`成功清除 ${res.success} 条，失败 ${res.failed} 条`);
    fetchData();
    selectedIds.value = [];
  } catch (error: any) {
    ElMessage.error(error.message || '批量清除失败');
  } finally {
    batchLoading.value = false;
  }
};

const handleBatchClearNormal = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要清除的记录');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要清除选中的 ${selectedIds.value.length} 条正常登录记录吗？此操作仅清除风险标记，不会删除记录。`,
      '批量清除正常记录',
      { type: 'warning' }
    );
    batchLoading.value = true;
    const res = await batchClearNormalRecordsApi(selectedIds.value);
    ElMessage.success(`成功清除 ${res.success} 条，失败 ${res.failed} 条`);
    fetchData();
    selectedIds.value = [];
  } catch (error: any) {
    ElMessage.error(error.message || '批量清除失败');
  } finally {
    batchLoading.value = false;
  }
};

const handleBatchLockDevices = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要锁定设备的记录');
    return;
  }
  const deviceMap = new Map<number, Set<string>>();
  selectedRows.value.forEach((row) => {
    if (row.deviceFingerprint && row.userId) {
      if (!deviceMap.has(row.userId)) {
        deviceMap.set(row.userId, new Set());
      }
      deviceMap.get(row.userId)!.add(row.deviceFingerprint);
    }
  });

  if (deviceMap.size === 0) {
    ElMessage.warning('选中记录中没有有效的设备指纹');
    return;
  }

  try {
    const deviceCount = Array.from(deviceMap.values()).reduce((sum, set) => sum + set.size, 0);
    await ElMessageBox.confirm(
      `确定要锁定选中记录涉及的 ${deviceCount} 台设备吗？`,
      '批量锁定设备',
      { type: 'warning' }
    );
    batchLoading.value = true;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const [userId, devices] of deviceMap) {
      const res = await batchLockDevicesApi(Array.from(devices), userId);
      totalSuccess += res.success;
      totalFailed += res.failed;
    }

    ElMessage.success(`成功锁定 ${totalSuccess} 台，失败 ${totalFailed} 台`);
    fetchData();
    selectedIds.value = [];
  } catch (error: any) {
    ElMessage.error(error.message || '批量锁定失败');
  } finally {
    batchLoading.value = false;
  }
};

const handleGenerateReport = async () => {
  generatingReport.value = true;
  try {
    const params: any = {};
    if (filterForm.timeRange && filterForm.timeRange.length === 2) {
      params.startTime = filterForm.timeRange[0];
      params.endTime = filterForm.timeRange[1];
    }
    const res = await generateRiskReportApi(params);
    riskReport.value = res;
    showReportDialog.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '生成报告失败');
  } finally {
    generatingReport.value = false;
  }
};

const getBarWidth = (count: number, total: number) => {
  if (total === 0) return '0%';
  return `${(count / total) * 100}%`;
};

const getBarHeight = (count: number, total: number) => {
  if (total === 0) return '0%';
  return `${Math.max((count / total) * 100, 5)}%`;
};

const handleExportReport = () => {
  ElMessage.success('报告导出功能开发中');
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.login-logs-container {
  padding: 16px;
  position: relative;
  min-height: 100%;
}

.filter-card {
  margin-bottom: 16px;

  :deep(.el-form-item) {
    margin-bottom: 16px;
    margin-right: 0;
  }
}

.table-card {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .batch-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .selected-count {
        font-size: 14px;
        color: $text-secondary;
        margin-right: 8px;
      }
    }

    .stats-info {
      display: flex;
      gap: 12px;
    }
  }

  .table-wrapper {
    height: calc(100vh - 380px);
    overflow: auto;
    position: relative;

    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 10;
    }
  }

  .pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.login-logs-table {
  :deep(.el-table__row) {
    &.row-selected {
      background-color: #ecf5ff !important;

      > td {
        background-color: #ecf5ff !important;
      }
    }

    &.row-risk-marked {
      background-color: #fef0f0 !important;

      > td {
        background-color: #fef0f0 !important;
        color: #f56c6c;
      }
    }

    &.row-anomaly {
      background-color: #fdf6ec !important;

      > td {
        background-color: #fdf6ec !important;
      }
    }
  }

  :deep(.el-table__row--striped) {
    &.row-selected {
      background-color: #ecf5ff !important;
    }
    &.row-risk-marked {
      background-color: #fef0f0 !important;
    }
    &.row-anomaly {
      background-color: #fdf6ec !important;
    }
  }

  :deep(.el-table__body tr:hover) {
    > td {
      background-color: #f5f7fa !important;
    }

    &.row-selected > td {
      background-color: #ecf5ff !important;
    }
    &.row-risk-marked > td {
      background-color: #fef0f0 !important;
    }
    &.row-anomaly > td {
      background-color: #fdf6ec !important;
    }
  }
}

.browser-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .os-info {
    font-size: 12px;
    color: $text-placeholder;
  }
}

.text-muted {
  color: $text-placeholder;
}

.monospace-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

.risk-score-low {
  color: #67c23a;
  font-weight: 600;
}

.risk-score-medium {
  color: #e6a23c;
  font-weight: 600;
}

.risk-score-high {
  color: #f56c6c;
  font-weight: 600;
}

.risk-score-critical {
  color: #c00000;
  font-weight: 600;
}

.back-top-btn {
  position: fixed;
  right: 40px;
  bottom: 40px;
  z-index: 1000;
  transition: all 0.3s ease;
}

.detail-dialog {
  :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
  }
}

.traceability-dialog {
  :deep(.el-dialog__body) {
    max-height: 80vh;
    overflow-y: auto;
  }

  .trace-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid $border-color;
    }
  }

  .authenticity-result {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .authenticity-score {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 16px;

      .score-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: bold;

        &.score-good {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        }
        &.score-medium {
          background: linear-gradient(135deg, #e6a23c 0%, #f0c070 100%);
        }
        &.score-bad {
          background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
        }

        .score-value {
          font-size: 32px;
          line-height: 1;
        }
        .score-label {
          font-size: 14px;
          opacity: 0.9;
        }
      }

      .authenticity-status {
        flex: 1;
      }
    }

    .authenticity-issues,
    .authenticity-recommendations {
      h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 8px;
      }

      ul {
        margin: 0;
        padding-left: 0;
        list-style: none;

        li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 4px 0;
          font-size: 14px;
          color: $text-secondary;
        }
      }
    }
  }
}

.report-dialog {
  :deep(.el-dialog__body) {
    max-height: 85vh;
    overflow-y: auto;
  }

  .report-header {
    text-align: center;
    padding-bottom: 16px;
    margin-bottom: 24px;
    border-bottom: 2px solid $border-color;

    h2 {
      margin: 0 0 8px;
      color: $text-primary;
    }

    .report-info {
      color: $text-secondary;
      font-size: 14px;
      margin: 0;
    }
  }

  .report-summary {
    margin-bottom: 24px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;

      .summary-card {
        padding: 20px;
        background: #f5f7fa;
        border-radius: 8px;
        text-align: center;
        border-left: 4px solid #909399;

        &.success {
          border-left-color: #67c23a;
        }
        &.danger {
          border-left-color: #f56c6c;
        }
        &.warning {
          border-left-color: #e6a23c;
        }

        .card-value {
          font-size: 28px;
          font-weight: bold;
          color: $text-primary;
          margin-bottom: 8px;
        }

        .card-label {
          font-size: 14px;
          color: $text-secondary;
        }
      }
    }
  }

  .report-section {
    margin-bottom: 24px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px;
    }
  }

  .distribution-chart {
    .distribution-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .item-label {
        width: 120px;
        font-size: 14px;
        color: $text-secondary;
      }

      .item-bar {
        flex: 1;
        height: 24px;
        background: #f0f2f5;
        border-radius: 4px;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
      }

      .item-count {
        width: 50px;
        text-align: right;
        font-weight: 600;
      }
    }
  }

  .risk-distribution {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    height: 200px;
    padding: 20px 0;

    .risk-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .risk-bar {
        width: 60px;
        height: 160px;
        border-radius: 4px 4px 0 0;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        opacity: 0.8;

        .risk-bar-fill {
          width: 100%;
          background: rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: height 0.5s ease;

          .risk-count {
            color: #fff;
            font-weight: bold;
            font-size: 14px;
          }
        }
      }

      .risk-label {
        font-size: 14px;
        color: $text-secondary;
      }
    }
  }
}

.detail-dialog,
.traceability-dialog,
.report-dialog {
  &.v-enter-active {
    animation: dialogZoomIn 0.3s ease;
  }

  &.v-leave-active {
    animation: dialogZoomOut 0.2s ease;
  }
}

@keyframes dialogZoomIn {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes dialogZoomOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>
