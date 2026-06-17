<template>
  <div class="permission-trace-page">
    <el-card class="tabs-card" shadow="never">
      <el-tabs v-model="activeTraceType" class="main-tabs">
        <el-tab-pane label="权限溯源" name="permission">
        </el-tab-pane>
        <el-tab-pane label="推客审核溯源" name="promoter">
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <template v-if="activeTraceType === 'permission'">
      <el-card class="search-card" shadow="never">
        <el-form :model="searchForm" inline label-width="80px" @submit.prevent>
          <el-form-item label="操作人">
            <el-input
              v-model="searchForm.operatorName"
              placeholder="请输入操作人姓名"
              clearable
              class="input-item glow-input"
            />
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="searchForm.action" placeholder="请选择" clearable class="input-item">
              <el-option
                v-for="item in CHANGE_ACTION_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标类型">
            <el-select v-model="searchForm.targetType" placeholder="请选择" clearable class="input-item">
              <el-option
                v-for="item in CHANGE_TARGET_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="权限模块">
            <el-select v-model="searchForm.module" placeholder="请选择" clearable class="input-item">
              <el-option
                v-for="item in PERMISSION_MODULE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="操作时间">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              @change="handleDateChange"
              class="date-picker"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索名称/原因"
              clearable
              class="input-item glow-input"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :loading="loading">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="warning" @click="showExportDialog = true">
              <el-icon><Download /></el-icon>导出
            </el-button>
            <el-button type="danger" @click="showAnomalyPanel = !showAnomalyPanel">
              <el-icon><Warning /></el-icon>{{ showAnomalyPanel ? '隐藏' : '查看' }}异常分析
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card v-if="showAnomalyPanel" class="anomaly-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span><el-icon class="danger-icon"><Warning /></el-icon>异常权限操作检测</span>
            <div class="header-actions">
              <span style="margin-right: 10px">检测阈值：</span>
              <el-select v-model="anomalyThreshold" size="small" style="width: 140px" @change="handleAnomalyDetect">
                <el-option
                  v-for="item in ANOMALY_THRESHOLD_OPTIONS"
                  :key="item.label"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button
                type="primary"
                size="small"
                style="margin-left: 10px"
                :loading="anomalyLoading"
                @click="handleAnomalyDetect"
              >
                开始检测
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="anomalyLoading" class="anomaly-loading">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="anomalyResult" class="anomaly-content">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-statistic
                title="高频操作簇"
                :value="anomalyResult.highFrequencyCount"
                value-style="color: var(--el-color-warning)"
              >
                <template #suffix>个</template>
              </el-statistic>
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="高风险操作"
                :value="anomalyResult.anomalyCount"
                value-style="color: var(--el-color-danger)"
              >
                <template #suffix>次</template>
              </el-statistic>
            </el-col>
            <el-col :span="8">
              <el-statistic
                title="可疑账号"
                :value="anomalyResult.suspiciousAccounts.length"
                value-style="color: var(--el-color-primary)"
              >
                <template #suffix>个</template>
              </el-statistic>
            </el-col>
          </el-row>

          <el-divider />

          <div v-if="anomalyResult.suspiciousAccounts.length > 0">
            <h4 style="margin-bottom: 12px">可疑账号列表</h4>
            <el-table :data="anomalyResult.suspiciousAccounts" size="small" border>
              <el-table-column prop="operatorName" label="操作人" width="120" />
              <el-table-column prop="ip" label="IP地址" width="140">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.ip }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="userAgent" label="设备信息" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.userAgent" placement="top" :show-after="300">
                    <span class="truncate-text">{{ row.userAgent }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="operationCount" label="操作次数" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.operationCount }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="latestOperationTime" label="最近操作" width="160">
                <template #default="{ row }">
                  {{ formatTime(row.latestOperationTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="highRiskActions" label="高危操作" min-width="150">
                <template #default="{ row }">
                  <el-tag
                    v-for="action in row.highRiskActions"
                    :key="action"
                    type="danger"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ CHANGE_ACTION_MAP[action]?.label || action }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="searchForm.operatorId = row.operatorId; handleSearch()"
                  >
                    查看记录
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="anomalyResult.highFrequencyOperations.length > 0" style="margin-top: 20px">
            <h4 style="margin-bottom: 12px">高频操作簇</h4>
            <el-table :data="anomalyResult.highFrequencyOperations" size="small" border>
              <el-table-column prop="operatorName" label="操作人" width="100" />
              <el-table-column label="时间段" width="320">
                <template #default="{ row }">
                  {{ formatTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="count" label="操作频次" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="warning" size="small">{{ row.count }} 次</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="ips" label="涉及IP" width="150">
                <template #default="{ row }">
                  <el-tag
                    v-for="ip in row.ips.slice(0, 2)"
                    :key="ip"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ ip }}
                  </el-tag>
                  <span v-if="row.ips.length > 2" style="color: #909399">+{{ row.ips.length - 2 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="actions" label="操作类型" min-width="150">
                <template #default="{ row }">
                  <el-tag
                    v-for="action in row.actions"
                    :key="action"
                    :type="(CHANGE_ACTION_MAP[action]?.type as any) || 'info'"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ CHANGE_ACTION_MAP[action]?.label || action }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-if="anomalyResult.suspiciousAccounts.length === 0 && anomalyResult.highFrequencyOperations.length === 0" description="未检测到异常操作" />
        </div>
      </el-card>

      <el-card class="table-card" shadow="never">
        <div v-loading="loading" element-loading-skeleton="true" element-loading-background="transparent">
          <el-table
            :data="tableData"
            v-loading="loading"
            stripe
            border
            @row-dblclick="handleViewDetail"
          >
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="操作时间" prop="createdAt" width="160" sortable="custom">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作人" prop="operatorName" width="110" />
            <el-table-column label="目标类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.targetType === 'role' ? 'primary' : row.targetType === 'permission' ? 'success' : 'warning'">
                  {{ CHANGE_TARGET_TYPE_MAP[row.targetType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标名称" prop="targetName" min-width="140">
              <template #default="{ row }">
                <el-tooltip :content="row.targetName" placement="top" :show-after="500">
                  <span class="target-name">{{ row.targetName || '-' }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="操作类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="(CHANGE_ACTION_MAP[row.action]?.type as any) || 'info'">
                  {{ CHANGE_ACTION_MAP[row.action]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="所属模块" width="110" align="center">
              <template #default="{ row }">
                <span v-if="row.module">{{ PERMISSION_MODULE_MAP[row.module] }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="变更原因" prop="reason" min-width="150" show-overflow-tooltip />
            <el-table-column label="影响账号" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.affectedUserCount && row.affectedUserCount > 0">
                  {{ formatNumber(row.affectedUserCount) }} 个
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="IP地址" prop="ip" width="130" />
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewDetail(row as PermissionChangeLogItem)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="PAGE_SIZE_OPTIONS as unknown as number[]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-card>
    </template>

    <template v-if="activeTraceType === 'promoter'">
      <el-card class="search-card" shadow="never">
        <el-form :model="promoterSearchForm" inline label-width="80px" @submit.prevent>
          <el-form-item label="手机号">
            <el-input
              v-model="promoterSearchForm.phone"
              placeholder="精准检索手机号"
              clearable
              class="input-item glow-input"
            />
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input
              v-model="promoterSearchForm.idCard"
              placeholder="精准检索身份证号"
              clearable
              class="input-item-long glow-input"
            />
          </el-form-item>
          <el-form-item label="推客编号">
            <el-input
              v-model="promoterSearchForm.promoterId"
              placeholder="推客ID/编号"
              clearable
              class="input-item glow-input"
            />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="promoterDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="date-picker"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handlePromoterSearch" :loading="promoterLoading">
              <el-icon><Search /></el-icon>检索溯源
            </el-button>
            <el-button @click="handlePromoterReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card v-if="promoterDetail" class="promoter-info-card" shadow="never">
        <template #header>
          <div class="card-header with-risk">
            <span>
              <el-icon><User /></el-icon>
              推客信息
              <el-tag
                v-if="promoterDetail.riskFlagged"
                type="danger"
                size="small"
                style="margin-left: 8px"
                effect="dark"
              >
                <el-icon><Warning /></el-icon> 风险标记
              </el-tag>
              <el-tag
                v-if="promoterDetail.isLocked"
                type="warning"
                size="small"
                style="margin-left: 4px"
              >
                <el-icon><Lock /></el-icon> 账号锁定
              </el-tag>
            </span>
            <div class="header-meta">
              申请次数：<strong>{{ promoterDetail.applyCount || 1 }}</strong> 次
            </div>
          </div>
        </template>
        <el-descriptions :column="4" border size="default">
          <el-descriptions-item label="推客编号">{{ promoterDetail.code }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ promoterDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ promoterDetail.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ maskIdCard(promoterDetail.idCard) }}</el-descriptions-item>
          <el-descriptions-item label="微信号">{{ promoterDetail.wechatId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属渠道">{{ promoterDetail.channelName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="等级">
            <el-tag :type="PROMOTER_LEVEL_MAP[Number(promoterDetail.level)]?.type || 'info'">
              {{ PROMOTER_LEVEL_MAP[Number(promoterDetail.level)]?.label || promoterDetail.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核阶段">
            <el-tag :type="AUDIT_STAGE_MAP[promoterDetail.auditStage]?.type || 'info'">
              {{ AUDIT_STAGE_MAP[promoterDetail.auditStage]?.label || promoterDetail.auditStage }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="AUDIT_STATUS_MAP[promoterDetail.auditStatus]?.type || 'info'">
              {{ AUDIT_STATUS_MAP[promoterDetail.auditStatus]?.label || promoterDetail.auditStatus }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剩余锁定时间" v-if="promoterDetail.isLocked">
            <span class="text-warning">{{ promoterDetail.lockRemainingHours }} 小时</span>
          </el-descriptions-item>
          <el-descriptions-item label="首次申请时间" v-if="!promoterDetail.isLocked" :span="2">
            {{ formatTime(promoterDetail.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="锁定到期时间" v-if="promoterDetail.isLocked">
            {{ formatTime(promoterDetail.lockUntil) }}
          </el-descriptions-item>
          <el-descriptions-item label="风险原因" :span="4" v-if="promoterDetail.riskFlagged">
            <span class="text-danger">{{ promoterDetail.riskReason || '存在未通过校验的风险项' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">
          <el-icon><View /></el-icon> 证件资料
        </el-divider>
        <el-row :gutter="20" v-if="promoterDetail.idCardFrontImg || promoterDetail.idCardBackImg">
          <el-col :span="8">
            <div class="id-card-img-wrapper">
              <p class="img-label">身份证人像面</p>
              <el-image
                v-if="promoterDetail.idCardFrontImg"
                :src="promoterDetail.idCardFrontImg"
                fit="cover"
                :preview-src-list="[promoterDetail.idCardFrontImg, promoterDetail.idCardBackImg].filter(Boolean) as string[]"
                class="id-card-img"
              />
              <el-empty v-else description="未上传" :image-size="60" />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="id-card-img-wrapper">
              <p class="img-label">身份证国徽面</p>
              <el-image
                v-if="promoterDetail.idCardBackImg"
                :src="promoterDetail.idCardBackImg"
                fit="cover"
                class="id-card-img"
              />
              <el-empty v-else description="未上传" :image-size="60" />
            </div>
          </el-col>
        </el-row>
        <el-empty v-else description="暂无证件资料" :image-size="80" />

        <el-divider content-position="left">
          <el-icon><EditPen /></el-icon> 审核人员信息
        </el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="初审人">
            <span v-if="promoterDetail.firstAuditor">
              {{ promoterDetail.firstAuditor.name || promoterDetail.firstAuditor.username }}
            </span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="初审时间">
            <span v-if="promoterDetail.firstAuditAt">{{ formatTime(promoterDetail.firstAuditAt) }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="初审备注" :span="2">
            <span v-if="promoterDetail.firstAuditRemark">{{ promoterDetail.firstAuditRemark }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="复审人">
            <span v-if="promoterDetail.secondAuditor">
              {{ promoterDetail.secondAuditor.name || promoterDetail.secondAuditor.username }}
            </span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="复审时间">
            <span v-if="promoterDetail.secondAuditAt">{{ formatTime(promoterDetail.secondAuditAt) }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="复审备注" :span="2">
            <span v-if="promoterDetail.secondAuditRemark">{{ promoterDetail.secondAuditRemark }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="promoterRejectRecords.length > 0" class="reject-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span><el-icon><CloseBold /></el-icon> 驳回记录（{{ promoterRejectRecords.length }} 次）</span>
          </div>
        </template>
        <el-table :data="promoterRejectRecords" size="default" border stripe>
          <el-table-column label="驳回时间" prop="createdAt" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="驳回阶段" prop="stage" width="120" align="center" />
          <el-table-column label="操作人" prop="operator" width="140" />
          <el-table-column label="标准原因" prop="reasonLabel" width="200">
            <template #default="{ row }">
              <el-tag type="danger" size="small">{{ row.reasonLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="自定义备注" prop="customRemark" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.customRemark">{{ row.customRemark }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="锁定情况" width="220">
            <template #default="{ row }">
              <template v-if="row.locked">
                <el-tag type="warning" size="small">
                  锁定 {{ row.remainingHours }} 小时
                </el-tag>
                <span class="text-muted" style="margin-left: 6px">
                  到期：{{ formatTime(row.lockUntil) }}
                </span>
              </template>
              <el-tag v-else type="success" size="small">未锁定</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="audit-timeline-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><Clock /></el-icon>
              审核全流程时间线
              <span class="text-muted" style="margin-left: 8px; font-size: 12px; font-weight: normal">
                精准匹配申请提交、审核操作、状态变更记录
              </span>
            </span>
            <el-tag v-if="hasTamperEvidence" type="danger" effect="dark">
              <el-icon><WarningFilled /></el-icon> 检测到信息篡改痕迹
            </el-tag>
          </div>
        </template>
        <div v-if="promoterLoading" style="padding: 40px 0">
          <el-skeleton :rows="5" animated />
        </div>
        <el-empty
          v-else-if="!promoterDetail && promoterAuditLogs.length === 0"
          description="请输入手机号或身份证号进行溯源检索"
          :image-size="120"
        />
        <el-timeline v-else-if="promoterAuditLogs.length > 0">
          <el-timeline-item
            v-for="(log, index) in promoterAuditLogs"
            :key="log.id"
            :timestamp="formatTime(log.createdAt)"
            :type="getTimelineType(log.action)"
            :hollow="isHollow(log.action)"
          >
            <div class="timeline-content">
              <div class="timeline-header">
                <h4>
                  <el-tag :type="getActionTagType(log.action)" size="small" effect="light">
                    {{ AUDIT_ACTION_LABELS[log.action] || log.action }}
                  </el-tag>
                  <span v-if="log.operatorName" class="operator-name">
                    操作人：{{ log.operatorName }}
                  </span>
                  <span class="log-index">#{{ index + 1 }}</span>
                </h4>
              </div>
              <div class="timeline-body">
                <div class="stage-transition">
                  <span class="stage from-stage">
                    <el-tag :type="getStageType(log.fromStage)" size="small">
                      {{ log.fromStageLabel }}
                    </el-tag>
                  </span>
                  <el-icon class="arrow-icon"><Right /></el-icon>
                  <span class="stage to-stage">
                    <el-tag :type="getStageType(log.toStage)" size="small">
                      {{ log.toStageLabel }}
                    </el-tag>
                  </span>
                </div>
                <div class="status-transition">
                  <span class="status-label">状态变更：</span>
                  <span>
                    <el-tag size="small" :type="AUDIT_STATUS_MAP[log.fromStatus]?.type || 'info'">
                      {{ log.fromStatusLabel }}
                    </el-tag>
                    <el-icon class="arrow-icon-mini"><ArrowRight /></el-icon>
                    <el-tag size="small" :type="AUDIT_STATUS_MAP[log.toStatus]?.type || 'info'">
                      {{ log.toStatusLabel }}
                    </el-tag>
                  </span>
                </div>
                <div v-if="log.rejectReasonCode" class="reject-info">
                  <el-icon><Warning /></el-icon>
                  <span>驳回原因：</span>
                  <span class="reason-code">[{{ log.rejectReasonCode }}]</span>
                  <span class="reason-text">
                    {{ REJECT_REASON_OPTIONS.find(r => r.code === log.rejectReasonCode)?.label }}
                  </span>
                </div>
                <div v-if="log.rejectCustomRemark" class="remark-info">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>自定义备注：{{ log.rejectCustomRemark }}</span>
                </div>
                <div v-if="log.remark" class="remark-info">
                  <el-icon><Document /></el-icon>
                  <span>审核备注：{{ log.remark }}</span>
                </div>
                <div v-if="log.metadata && (log.metadata as any).riskFlagged" class="risk-info">
                  <el-icon><WarningFilled /></el-icon>
                  <span>风险标记：申请信息存在篡改痕迹，已锁定账号</span>
                </div>
                <div v-if="log.metadata && (log.metadata as any).hashChanged" class="tamper-info">
                  <el-icon><WarningFilled /></el-icon>
                  <span>数据指纹不一致：检测到申请信息被篡改（Hash 值发生变化）</span>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty
          v-else
          description="未查询到审核流程记录"
          :image-size="80"
        />
      </el-card>
    </template>

    <el-dialog
      v-model="detailDialogVisible"
      title="权限变更详情"
      width="700px"
      class="zoom-in-dialog slide-down-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="操作人">{{ currentDetail!.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatTime(currentDetail!.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="目标类型">{{ CHANGE_TARGET_TYPE_MAP[currentDetail!.targetType] }}</el-descriptions-item>
          <el-descriptions-item label="目标名称">{{ currentDetail!.targetName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="(CHANGE_ACTION_MAP[currentDetail!.action]?.type as any) || 'info'">
              {{ CHANGE_ACTION_MAP[currentDetail!.action]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属模块">
            {{ currentDetail!.module ? PERMISSION_MODULE_MAP[currentDetail!.module] : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentDetail!.ip }}</el-descriptions-item>
          <el-descriptions-item label="影响账号">
            <span v-if="currentDetail!.affectedUserCount && currentDetail!.affectedUserCount > 0">
              {{ formatNumber(currentDetail!.affectedUserCount) }} 个
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="设备信息" :span="2">
            <el-tooltip :content="currentDetail!.userAgent" placement="top" :show-after="300">
              <span class="truncate-text">{{ currentDetail!.userAgent || '-' }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="变更原因" :span="2">{{ currentDetail!.reason || '未填写' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div v-if="currentDetail!.affectedUserCount && currentDetail!.affectedUserCount > 0" class="affected-section">
          <h4>受影响账号（{{ currentDetail!.affectedUserCount }} 个）</h4>
          <div class="affected-users">
            <el-tag
              v-for="userId in currentDetail!.affectedUserIds?.slice(0, 10)"
              :key="userId"
              size="small"
              style="margin-right: 6px; margin-bottom: 6px"
            >
              {{ userId }}
            </el-tag>
            <span v-if="currentDetail!.affectedUserCount! > 10" style="color: #909399; font-size: 12px">
              等 {{ currentDetail!.affectedUserCount }} 个账号
            </span>
          </div>
          <el-divider />
        </div>

        <div v-if="hasChangedFields" class="diff-section">
          <h4>变更内容对比</h4>
          <el-table :data="changedFieldsList" size="small" border class="diff-table">
            <el-table-column prop="field" label="字段" width="150" />
            <el-table-column label="变更前" min-width="220">
              <template #default="{ row }">
                <div class="diff-content before">
                  <el-tooltip :content="formatValue(row.before)" placement="top" :show-after="300">
                    <span class="truncate-text">{{ formatValue(row.before) }}</span>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="变更后" min-width="220">
              <template #default="{ row }">
                <div class="diff-content after">
                  <el-tooltip :content="formatValue(row.after)" placement="top" :show-after="300">
                    <span class="truncate-text">{{ formatValue(row.after) }}</span>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else description="无变更内容详情" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="showExportDialog"
      title="导出权限操作日志"
      width="500px"
      class="zoom-in-dialog"
    >
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出字段">
          <el-checkbox-group v-model="exportForm.fields">
            <el-checkbox
              v-for="item in EXPORT_FIELD_OPTIONS"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序字段">
          <el-select v-model="exportForm.sortBy" style="width: 100%">
            <el-option
              v-for="item in SORT_FIELD_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序方式">
          <el-radio-group v-model="exportForm.sortOrder">
            <el-radio value="desc">降序</el-radio>
            <el-radio value="asc">升序</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportForm.scope">
            <el-radio value="current">当前筛选条件</el-radio>
            <el-radio value="all">全部数据</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          导出（共 {{ formatNumber(pagination.total) }} 条）
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Download,
  Warning,
  Search,
  User,
  Lock,
  View,
  EditPen,
  Clock,
  WarningFilled,
  Right,
  ArrowRight,
  CloseBold,
  ChatDotRound,
  Document,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getPermissionChangeLogList,
  getPermissionChangeLogDetail,
  exportPermissionChangeLogs,
  detectPermissionAnomalies,
  type PermissionChangeLogItem,
  type PermissionChangeLogQueryParams,
  type AnomalyDetectionResult,
} from '@/api/permission'
import {
  getAuditDetail,
  searchAuditLogs,
  type AuditDetailItem,
  type AuditLogItem,
  type RejectRecordItem,
} from '@/api/promoter-audit'
import {
  CHANGE_TARGET_TYPE_OPTIONS,
  CHANGE_TARGET_TYPE_MAP,
  CHANGE_ACTION_OPTIONS,
  CHANGE_ACTION_MAP,
  PERMISSION_MODULE_OPTIONS,
  PERMISSION_MODULE_MAP,
  EXPORT_FIELD_OPTIONS,
  SORT_FIELD_OPTIONS,
  ANOMALY_THRESHOLD_OPTIONS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  AUDIT_STAGE_MAP,
  AUDIT_STATUS_MAP,
  AUDIT_ACTION_LABELS,
  REJECT_REASON_OPTIONS,
  PROMOTER_LEVEL_MAP,
} from '@/constants'

const activeTraceType = ref<'permission' | 'promoter'>('permission')
const promoterLoading = ref(false)
const promoterDetail = ref<AuditDetailItem | null>(null)
const promoterRejectRecords = ref<RejectRecordItem[]>([])
const promoterAuditLogs = ref<AuditLogItem[]>([])
const promoterDateRange = ref<string[]>([])
const promoterSearchForm = reactive({
  phone: '',
  idCard: '',
  promoterId: '',
})

const loading = ref(false)
const tableData = ref<PermissionChangeLogItem[]>([])
const showAnomalyPanel = ref(false)
const anomalyLoading = ref(false)
const anomalyResult = ref<AnomalyDetectionResult | null>(null)
const anomalyThreshold = ref(ANOMALY_THRESHOLD_OPTIONS[0].value)
const detailDialogVisible = ref(false)
const currentDetail = ref<PermissionChangeLogItem | null>(null)
const showExportDialog = ref(false)
const exporting = ref(false)
const dateRange = ref<string[]>([])

const searchForm = reactive<Partial<PermissionChangeLogQueryParams>>({
  operatorName: '',
  action: undefined,
  targetType: undefined,
  module: undefined,
  keyword: '',
  operatorId: undefined,
})

const pagination = reactive({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
})

const exportForm = reactive({
  fields: EXPORT_FIELD_OPTIONS.map(f => f.value),
  sortBy: 'createdAt',
  sortOrder: 'desc',
  scope: 'current',
})

const hasChangedFields = computed(() => {
  if (!currentDetail.value?.changedFields) return false
  return Object.keys(currentDetail.value.changedFields).length > 0
})

const changedFieldsList = computed(() => {
  if (!currentDetail.value?.changedFields) return []
  return Object.entries(currentDetail.value.changedFields).map(([field, value]) => ({
    field,
    before: (value as any).before,
    after: (value as any).after,
  }))
})

function formatTime(time: string | number | Date | null | undefined) {
  if (!time) return '-'
  const d = dayjs(time)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : '-'
}

function formatNumber(num: number | string | null | undefined) {
  if (num === null || num === undefined || num === '') return '0'
  const n = typeof num === 'string' ? Number(num) : num
  if (Number.isNaN(n)) return '0'
  return n.toLocaleString('zh-CN')
}

function formatValue(val: any) {
  if (val === undefined || val === null) return '-'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (Array.isArray(val)) return `[${val.join(', ')}]`
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function disabledDate(time: Date) {
  const now = dayjs()
  const ninetyDaysAgo = now.subtract(90, 'day')
  return dayjs(time).isAfter(now) || dayjs(time).isBefore(ninetyDaysAgo)
}

function handleDateChange(val: string[] | null | undefined) {
  if (!val || !Array.isArray(val) || val.length !== 2 || !val[0] || !val[1]) {
    searchForm.startTime = undefined
    searchForm.endTime = undefined
    return
  }
  const start = dayjs(val[0])
  const end = dayjs(val[1])
  if (!start.isValid() || !end.isValid()) {
    ElMessage.error('日期格式无效')
    dateRange.value = []
    searchForm.startTime = undefined
    searchForm.endTime = undefined
    return
  }
  if (end.diff(start, 'day') > 90) {
    ElMessage.error('时间区间不能超过 90 天')
    dateRange.value = []
    searchForm.startTime = undefined
    searchForm.endTime = undefined
    return
  }
  searchForm.startTime = val[0]
  searchForm.endTime = val[1]
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PermissionChangeLogQueryParams = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const res = await getPermissionChangeLogList(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.operatorName = ''
  searchForm.action = undefined
  searchForm.targetType = undefined
  searchForm.module = undefined
  searchForm.keyword = ''
  searchForm.startTime = undefined
  searchForm.endTime = undefined
  searchForm.operatorId = undefined
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const handleViewDetail = async (row: PermissionChangeLogItem) => {
  try {
    const detail = await getPermissionChangeLogDetail(row.id)
    currentDetail.value = detail
    detailDialogVisible.value = true
  } catch (err: any) {
    ElMessage.error(err.message || '加载详情失败')
  }
}

const handleExport = async () => {
  if (exportForm.fields.length === 0) {
    ElMessage.warning('请选择至少一个导出字段')
    return
  }

  exporting.value = true
  try {
    const params: any = {}
    if (exportForm.scope === 'current') {
      Object.assign(params, searchForm)
    }
    params.fields = exportForm.fields
    params.sortBy = exportForm.sortBy
    params.sortOrder = exportForm.sortOrder

    await exportPermissionChangeLogs(params)
    ElMessage.success('导出成功')
    showExportDialog.value = false
  } catch (err: any) {
    // Error handled in download function
  } finally {
    exporting.value = false
  }
}

const handleAnomalyDetect = async () => {
  anomalyLoading.value = true
  try {
    const res = await detectPermissionAnomalies({
      timeWindowMinutes: anomalyThreshold.value.window,
      frequencyThreshold: anomalyThreshold.value.threshold,
      startTime: searchForm.startTime,
      endTime: searchForm.endTime,
    })
    anomalyResult.value = res
    if (res.anomalyCount === 0 && res.highFrequencyCount === 0) {
      ElMessage.success('未检测到异常操作')
    } else {
      ElMessage.warning(`检测到 ${res.highFrequencyCount} 个高频操作簇，${res.anomalyCount} 次高风险操作`)
    }
  } catch (err: any) {
    if (err.message?.includes('正在执行')) {
      ElMessage.warning(err.message)
    } else {
      ElMessage.error(err.message || '检测失败')
    }
  } finally {
    anomalyLoading.value = false
  }
}

function maskIdCard(idCard?: string) {
  if (!idCard) return '-'
  if (idCard.length < 8) return idCard
  return idCard.slice(0, 4) + '********' + idCard.slice(-4)
}

const hasTamperEvidence = computed(() => {
  if (promoterDetail.value?.riskFlagged) return true
  return promoterAuditLogs.value.some(
    log => log.metadata && (log.metadata.riskFlagged || log.metadata.hashChanged)
  )
})

function getTimelineType(action: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    submit: 'primary',
    first_pass: 'success',
    second_pass: 'success',
    first_reject: 'danger',
    second_reject: 'danger',
    blacklist_block: 'danger',
    rollback: 'warning',
  }
  return map[action] || 'info'
}

function isHollow(action: string) {
  return action === 'rollback' || action === 'submit'
}

function getActionTagType(
  action: string
): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    submit: 'primary',
    first_pass: 'success',
    second_pass: 'success',
    first_reject: 'danger',
    second_reject: 'danger',
    blacklist_block: 'danger',
    rollback: 'warning',
  }
  return map[action] || 'info'
}

function getStageType(
  stage: number
): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  return AUDIT_STAGE_MAP[stage]?.type || 'info'
}

const handlePromoterSearch = async () => {
  if (!promoterSearchForm.phone && !promoterSearchForm.idCard && !promoterSearchForm.promoterId) {
    ElMessage.warning('请至少输入手机号、身份证号或推客编号中的一项')
    return
  }

  promoterLoading.value = true
  promoterDetail.value = null
  promoterRejectRecords.value = []
  promoterAuditLogs.value = []

  try {
    if (promoterSearchForm.promoterId) {
      try {
        const detail = await getAuditDetail(promoterSearchForm.promoterId)
        promoterDetail.value = detail
        promoterRejectRecords.value = detail.rejectRecords || []
      } catch (_err) {
        // 推客编号查不到时继续用手机号/身份证检索
      }
    }

    const logParams: any = {
      page: 1,
      pageSize: 100,
      phone: promoterSearchForm.phone || undefined,
      idCard: promoterSearchForm.idCard || undefined,
      promoterId: promoterSearchForm.promoterId || undefined,
    }
    if (promoterDateRange.value.length === 2) {
      logParams.startDate = promoterDateRange.value[0]
      logParams.endDate = promoterDateRange.value[1]
    }

    const logRes = await searchAuditLogs(logParams)
    promoterAuditLogs.value = logRes.list || []

    if (!promoterDetail.value && promoterAuditLogs.value.length > 0) {
      const firstLog = promoterAuditLogs.value[0]
      if (firstLog.promoterId) {
        try {
          const detail = await getAuditDetail(firstLog.promoterId)
          promoterDetail.value = detail
          promoterRejectRecords.value = detail.rejectRecords || []
        } catch (_err) {
          // 忽略详情查询失败
        }
      }
    }

    if (!promoterDetail.value && promoterAuditLogs.value.length === 0) {
      ElMessage.info('未查询到匹配的推客审核记录')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '检索失败')
  } finally {
    promoterLoading.value = false
  }
}

const handlePromoterReset = () => {
  promoterSearchForm.phone = ''
  promoterSearchForm.idCard = ''
  promoterSearchForm.promoterId = ''
  promoterDateRange.value = []
  promoterDetail.value = null
  promoterRejectRecords.value = []
  promoterAuditLogs.value = []
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.permission-trace-page {
  padding: 16px;

  .search-card {
    margin-bottom: 16px;

    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    .input-item {
      width: 160px;
    }

    .date-picker {
      width: 260px;
    }
  }

  .anomaly-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .danger-icon {
        color: var(--el-color-danger);
        margin-right: 6px;
      }
    }

    .anomaly-loading {
      padding: 20px 0;
    }

    .anomaly-content {
      .truncate-text {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }
    }
  }

  .table-card {
    .target-name {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .text-muted {
      color: var(--el-text-color-secondary);
    }

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .detail-content {
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .affected-section {
      .affected-users {
        margin-top: 8px;
      }
    }

    .diff-section {
      .diff-table {
        .diff-content {
          padding: 4px 8px;
          border-radius: 4px;

          &.before {
            background-color: #fef0f0;
            color: var(--el-color-danger);
          }

          &.after {
            background-color: #f0f9eb;
            color: var(--el-color-success);
          }
        }

        .truncate-text {
          display: inline-block;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }
      }
    }

    .truncate-text {
      display: inline-block;
      max-width: 500px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }
  }

  .glow-input :deep(.el-input__wrapper.is-focus) {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 0 8px 2px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;
  }

  .tabs-card {
    margin-bottom: 16px;

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }

    :deep(.el-tabs__item) {
      height: 48px;
      line-height: 48px;
      font-size: 15px;
      font-weight: 500;
    }

    .main-tabs {
      :deep(.el-tabs__item.is-active) {
        color: var(--el-color-primary);
      }
    }
  }

  .input-item-long {
    width: 220px;
  }

  .promoter-info-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.with-risk {
        .el-tag {
          vertical-align: middle;
        }
      }
    }

    .header-meta {
      font-size: 13px;
      color: var(--el-text-color-secondary);

      strong {
        color: var(--el-color-primary);
        font-size: 15px;
        margin-left: 4px;
      }
    }
  }

  .id-card-img-wrapper {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    text-align: center;

    .img-label {
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    .id-card-img {
      width: 100%;
      height: 180px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color);
    }
  }

  .reject-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .audit-timeline-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .timeline-content {
      padding: 8px 4px;

      .timeline-header {
        h4 {
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);

          .operator-name {
            font-size: 13px;
            font-weight: normal;
            color: var(--el-text-color-secondary);
            margin-left: 8px;
          }

          .log-index {
            margin-left: auto;
            font-size: 12px;
            color: var(--el-text-color-placeholder);
            font-weight: normal;
          }
        }
      }

      .timeline-body {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .stage-transition {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;

          .arrow-icon {
            color: var(--el-text-color-secondary);
            font-size: 14px;
          }
        }

        .status-transition {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--el-text-color-regular);

          .status-label {
            color: var(--el-text-color-secondary);
          }

          .arrow-icon-mini {
            color: var(--el-text-color-secondary);
            font-size: 12px;
          }
        }

        .reject-info,
        .remark-info,
        .risk-info,
        .tamper-info {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.6;
          display: flex;
          align-items: flex-start;
          gap: 6px;

          .el-icon {
            flex-shrink: 0;
            margin-top: 2px;
          }
        }

        .reject-info {
          background: #fef0f0;
          color: var(--el-color-danger);

          .reason-code {
            font-weight: 600;
            margin-right: 4px;
          }

          .reason-text {
            font-weight: 500;
          }
        }

        .remark-info {
          background: #fdf6ec;
          color: var(--el-color-warning);
        }

        .risk-info {
          background: #fef0f0;
          color: var(--el-color-danger);
          font-weight: 500;
          border-left: 3px solid var(--el-color-danger);
        }

        .tamper-info {
          background: #fef0f0;
          color: var(--el-color-danger);
          font-weight: 500;
          border-left: 3px solid var(--el-color-danger);
        }
      }

      &:hover {
        background: var(--el-fill-color-light);
        border-radius: 6px;
        margin: 0 -4px;
        padding: 8px;
        transition: all 0.2s ease;
      }
    }

    :deep(.el-timeline-item__wrapper) {
      padding-bottom: 20px;
    }

    :deep(.el-timeline-item__timestamp) {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }

  .text-danger {
    color: var(--el-color-danger) !important;
    font-weight: 500;
  }

  .text-warning {
    color: var(--el-color-warning) !important;
    font-weight: 500;
  }
}

.zoom-in-dialog :deep(.el-dialog) {
  animation: zoomIn 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-down-dialog :deep(.el-dialog) {
  animation: zoomIn 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-down-dialog :deep(.dialog-fade-enter-active),
.slide-down-dialog :deep(.dialog-fade-leave-active) {
  animation: slideDown 0.3s ease;
}

.slide-down-dialog :deep(.dialog-fade-leave-active) {
  animation: slideDownOut 0.3s ease forwards;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDownOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>
