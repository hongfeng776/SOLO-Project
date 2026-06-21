<template>
  <div class="passenger-behavior-trace">
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="出行行为溯源" name="trace">
        <div class="auto-detect-section">
          <div class="section-header">
            <h4>
              <el-icon><Monitor /></el-icon>
              自动检测
            </h4>
          </div>
          <div class="detect-cards">
            <div
              class="detect-card"
              :class="detectionResults.maliciousOrder.isAbnormal ? 'abnormal' : 'normal'"
            >
              <div class="detect-icon">
                <el-icon :class="detectionResults.maliciousOrder.isAbnormal ? 'icon-abnormal' : 'icon-normal'">
                  <component :is="detectionResults.maliciousOrder.isAbnormal ? WarningFilled : CircleCheck" />
                </el-icon>
              </div>
              <div class="detect-info">
                <div class="detect-title">恶意刷单检测</div>
                <div class="detect-status">
                  <el-tag
                    :color="detectionResults.maliciousOrder.isAbnormal ? '#f56c6c' : '#67c23a'"
                    effect="dark"
                    size="small"
                  >
                    {{ detectionResults.maliciousOrder.isAbnormal ? '异常' : '正常' }}
                  </el-tag>
                </div>
                <div class="detect-meta">
                  <span>检测次数：{{ detectionResults.maliciousOrder.checkCount }}</span>
                  <span>最近检测：{{ formatDate(detectionResults.maliciousOrder.lastCheckTime) }}</span>
                </div>
              </div>
            </div>
            <div
              class="detect-card"
              :class="detectionResults.frequentCancel.isAbnormal ? 'abnormal' : 'normal'"
            >
              <div class="detect-icon">
                <el-icon :class="detectionResults.frequentCancel.isAbnormal ? 'icon-abnormal' : 'icon-normal'">
                  <component :is="detectionResults.frequentCancel.isAbnormal ? WarningFilled : CircleCheck" />
                </el-icon>
              </div>
              <div class="detect-info">
                <div class="detect-title">频繁取消检测</div>
                <div class="detect-status">
                  <el-tag
                    :color="detectionResults.frequentCancel.isAbnormal ? '#f56c6c' : '#67c23a'"
                    effect="dark"
                    size="small"
                  >
                    {{ detectionResults.frequentCancel.isAbnormal ? '异常' : '正常' }}
                  </el-tag>
                </div>
                <div class="detect-meta">
                  <span>检测次数：{{ detectionResults.frequentCancel.checkCount }}</span>
                  <span>最近检测：{{ formatDate(detectionResults.frequentCancel.lastCheckTime) }}</span>
                </div>
              </div>
            </div>
            <div
              class="detect-card"
              :class="detectionResults.fakeComplaint.isAbnormal ? 'abnormal' : 'normal'"
            >
              <div class="detect-icon">
                <el-icon :class="detectionResults.fakeComplaint.isAbnormal ? 'icon-abnormal' : 'icon-normal'">
                  <component :is="detectionResults.fakeComplaint.isAbnormal ? WarningFilled : CircleCheck" />
                </el-icon>
              </div>
              <div class="detect-info">
                <div class="detect-title">虚假投诉检测</div>
                <div class="detect-status">
                  <el-tag
                    :color="detectionResults.fakeComplaint.isAbnormal ? '#f56c6c' : '#67c23a'"
                    effect="dark"
                    size="small"
                  >
                    {{ detectionResults.fakeComplaint.isAbnormal ? '异常' : '正常' }}
                  </el-tag>
                </div>
                <div class="detect-meta">
                  <span>检测次数：{{ detectionResults.fakeComplaint.checkCount }}</span>
                  <span>最近检测：{{ formatDate(detectionResults.fakeComplaint.lastCheckTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="travel-records-section">
          <div class="section-header">
            <h4>
              <el-icon><Van /></el-icon>
              订单溯源列表
            </h4>
          </div>
          <div v-loading="recordsLoading" class="table-container">
            <el-table
              :data="travelRecords"
              border
              stripe
              style="width: 100%"
              @expand-change="handleExpandChange"
              row-key="id"
            >
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="order-expand-content" v-loading="expandedLoading[row.id]">
                    <template v-if="expandedDetails[row.id]">
                      <div class="expand-section">
                        <h5>
                          <el-icon><Document /></el-icon>
                          订单基本信息
                        </h5>
                        <el-descriptions :column="4" border size="small">
                          <el-descriptions-item label="订单号">
                            <span class="order-no">{{ expandedDetails[row.id].order?.orderNo }}</span>
                          </el-descriptions-item>
                          <el-descriptions-item label="下单时间">
                            {{ formatDate(expandedDetails[row.id].order?.createTime) }}
                          </el-descriptions-item>
                          <el-descriptions-item label="订单状态">
                            <el-tag
                              :color="OrderStatusColorMap[expandedDetails[row.id].order?.status]"
                              effect="dark"
                              size="small"
                            >
                              {{ OrderStatusMap[expandedDetails[row.id].order?.status] }}
                            </el-tag>
                          </el-descriptions-item>
                          <el-descriptions-item label="订单金额">
                            ¥{{ (expandedDetails[row.id].order?.actualPrice || expandedDetails[row.id].order?.estimatedPrice || 0).toFixed(2) }}
                          </el-descriptions-item>
                          <el-descriptions-item label="起点" :span="2">
                            {{ expandedDetails[row.id].order?.startAddress }}
                          </el-descriptions-item>
                          <el-descriptions-item label="终点" :span="2">
                            {{ expandedDetails[row.id].order?.endAddress }}
                          </el-descriptions-item>
                          <el-descriptions-item label="司机" v-if="expandedDetails[row.id].order?.driverName">
                            {{ expandedDetails[row.id].order?.driverName }}
                          </el-descriptions-item>
                          <el-descriptions-item label="车牌号" v-if="expandedDetails[row.id].order?.vehiclePlate">
                            {{ expandedDetails[row.id].order?.vehiclePlate }}
                          </el-descriptions-item>
                          <el-descriptions-item label="距离" v-if="expandedDetails[row.id].order?.distance">
                            {{ (expandedDetails[row.id].order?.distance / 1000).toFixed(2) }}km
                          </el-descriptions-item>
                          <el-descriptions-item label="时长" v-if="expandedDetails[row.id].order?.duration">
                            {{ expandedDetails[row.id].order?.duration }}分钟
                          </el-descriptions-item>
                        </el-descriptions>
                      </div>

                      <div class="expand-section" v-if="expandedDetails[row.id].order?.statusLogs?.length > 0">
                        <h5>
                          <el-icon><Clock /></el-icon>
                          订单状态流转
                        </h5>
                        <el-timeline>
                          <el-timeline-item
                            v-for="(log, idx) in expandedDetails[row.id].order.statusLogs"
                            :key="idx"
                            :timestamp="formatDate(log.createTime)"
                            :color="OrderStatusColorMap[log.newStatus]"
                          >
                            <div class="timeline-content">
                              <el-tag
                                :color="OrderStatusColorMap[log.newStatus]"
                                effect="dark"
                                size="small"
                              >
                                {{ OrderStatusMap[log.newStatus] }}
                              </el-tag>
                              <span class="timeline-operator" v-if="log.operatorName">
                                操作人：{{ log.operatorName }}
                              </span>
                              <span class="timeline-reason" v-if="log.changeReason">
                                原因：{{ log.changeReason }}
                              </span>
                              <span class="timeline-remark" v-if="log.remark">
                                备注：{{ log.remark }}
                              </span>
                            </div>
                          </el-timeline-item>
                        </el-timeline>
                      </div>

                      <div class="expand-section" v-if="expandedDetails[row.id].abnormalDetection?.hasAbnormal">
                        <h5>
                          <el-icon><Warning /></el-icon>
                          异常检测结果
                        </h5>
                        <div class="abnormal-detection-result">
                          <div class="abnormal-warning">
                            <el-alert
                              type="error"
                              :closable="false"
                              :title="`检测到 ${expandedDetails[row.id].abnormalDetection.abnormalTypes.length} 项异常行为`"
                              show-icon
                            />
                          </div>
                          <div class="abnormal-type-tags">
                            <el-tag
                              v-for="(abnormal, idx) in expandedDetails[row.id].abnormalDetection.abnormalTypes"
                              :key="idx"
                              effect="dark"
                              size="default"
                              class="abnormal-tag"
                            >
                              {{ abnormal.name }} - {{ abnormal.level }}
                            </el-tag>
                          </div>
                          <div class="abnormal-details">
                            <span>同时段订单：{{ expandedDetails[row.id].abnormalDetection.sameTimeOrders }} 单</span>
                            <span>关联虚假投诉：{{ expandedDetails[row.id].abnormalDetection.fakeComplaints }} 次</span>
                          </div>
                        </div>
                      </div>

                      <div class="expand-section" v-if="expandedDetails[row.id].risks?.length > 0">
                        <h5>
                          <el-icon><WarningFilled /></el-icon>
                          关联风险记录
                        </h5>
                        <el-table :data="expandedDetails[row.id].risks" size="small" border>
                          <el-table-column label="风险类型" width="120">
                            <template #default="{ row: riskRow }">
                              <el-tag
                                :color="TravelRiskTypeColorMap[riskRow.riskType]"
                                effect="dark"
                                size="small"
                              >
                                {{ TravelRiskTypeMap[riskRow.riskType] }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column label="风险等级" width="100">
                            <template #default="{ row: riskRow }">
                              <el-tag
                                :color="RiskSeverityLevelColorMap[riskRow.riskLevel]"
                                effect="dark"
                                size="small"
                              >
                                {{ RiskSeverityLevelMap[riskRow.riskLevel] }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="description" label="描述" min-width="200" />
                          <el-table-column label="是否拦截" width="100" align="center">
                            <template #default="{ row: riskRow }">
                              <el-icon v-if="riskRow.isBlocked" class="text-danger">
                                <CircleClose />
                              </el-icon>
                              <el-icon v-else class="text-success">
                                <CircleCheck />
                              </el-icon>
                            </template>
                          </el-table-column>
                          <el-table-column prop="createTime" label="触发时间" width="180">
                            <template #default="{ row: riskRow }">
                              {{ formatDate(riskRow.createTime) }}
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>

                      <div class="expand-section" v-if="expandedDetails[row.id].order?.complaint || expandedDetails[row.id].order?.review">
                        <h5>
                          <el-icon><ChatDotRound /></el-icon>
                          投诉/评价记录
                        </h5>
                        <div class="complaint-review-section">
                          <div class="complaint-item" v-if="expandedDetails[row.id].order?.complaint">
                            <div class="item-header">
                              <el-icon><Warning /></el-icon>
                              <span class="item-title">投诉记录</span>
                              <el-tag
                                v-if="expandedDetails[row.id].order.complaint.isFake"
                                color="#9c27b0"
                                effect="dark"
                                size="small"
                              >
                                判定为虚假投诉
                              </el-tag>
                            </div>
                            <div class="item-content">
                              <p><strong>投诉内容：</strong>{{ expandedDetails[row.id].order.complaint.content }}</p>
                              <p v-if="expandedDetails[row.id].order.complaint.handleResult">
                                <strong>处理结果：</strong>{{ expandedDetails[row.id].order.complaint.handleResult }}
                              </p>
                              <p class="item-time">投诉时间：{{ formatDate(expandedDetails[row.id].order.complaint.createTime) }}</p>
                            </div>
                          </div>
                          <div class="review-item" v-if="expandedDetails[row.id].order?.review">
                            <div class="item-header">
                              <el-icon><Star /></el-icon>
                              <span class="item-title">评价记录</span>
                              <el-rate
                                :model-value="expandedDetails[row.id].order.review.rating"
                                disabled
                                size="small"
                              />
                            </div>
                            <div class="item-content">
                              <p v-if="expandedDetails[row.id].order.review.content">
                                <strong>评价内容：</strong>{{ expandedDetails[row.id].order.review.content }}
                              </p>
                              <p class="item-time">评价时间：{{ formatDate(expandedDetails[row.id].order.review.createTime) }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="orderNo" label="订单号" width="180">
                <template #default="{ row }">
                  <span class="order-no">{{ row.orderNo || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="下单时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="startAddress" label="起点" min-width="160" show-overflow-tooltip />
              <el-table-column prop="endAddress" label="终点" min-width="160" show-overflow-tooltip />
              <el-table-column label="金额(元)" width="110" align="right">
                <template #default="{ row }">
                  <span class="amount-text">¥{{ (row.amount || row.actualPrice || row.estimatedPrice || 0).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :color="OrderStatusColorMap[row.status]"
                    effect="dark"
                    size="small"
                  >
                    {{ OrderStatusMap[row.status] || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="异常标签" width="160">
                <template #default="{ row }">
                  <div class="abnormal-tags-row">
                    <el-tag
                      v-if="row.abnormalType"
                      :color="TravelRiskTypeColorMap[row.abnormalType] || '#f56c6c'"
                      effect="dark"
                      size="small"
                      class="abnormal-tag-mini"
                    >
                      {{ row.abnormalLabel || TravelRiskTypeMap[row.abnormalType] || '异常' }}
                    </el-tag>
                    <span v-if="!row.abnormalType" class="text-muted">-</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="110" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link @click="handleToggleExpand(row)">
                    溯源详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-container">
              <el-pagination
                v-model:current-page="recordsPagination.page"
                v-model:page-size="recordsPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="recordsPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleRecordsSizeChange"
                @current-change="handleRecordsPageChange"
              />
            </div>
          </div>
        </div>

        <div class="abnormal-timeline-section">
          <div class="section-header">
            <h4>
              <el-icon><TimeLine /></el-icon>
              异常行为时间线
            </h4>
          </div>
          <div v-loading="risksLoading" class="timeline-container">
            <el-timeline v-if="travelRisks.length > 0">
              <el-timeline-item
                v-for="(risk, idx) in travelRisks"
                :key="risk.id"
                :timestamp="formatDate(risk.createTime)"
                :color="TravelRiskTypeColorMap[risk.riskType]"
                placement="top"
              >
                <el-card class="timeline-card" shadow="hover">
                  <div class="timeline-card-header">
                    <div class="risk-type-icon" :style="{ background: TravelRiskTypeColorMap[risk.riskType] }">
                      <el-icon>
                        <component :is="getRiskIcon(risk.riskType)" />
                      </el-icon>
                    </div>
                    <div class="risk-info">
                      <div class="risk-title">
                        <el-tag
                          :color="TravelRiskTypeColorMap[risk.riskType]"
                          effect="dark"
                          size="small"
                        >
                          {{ TravelRiskTypeMap[risk.riskType] }}
                        </el-tag>
                        <el-tag
                          :color="RiskSeverityLevelColorMap[risk.riskLevel]"
                          effect="dark"
                          size="small"
                          class="risk-level-tag"
                        >
                          {{ RiskSeverityLevelMap[risk.riskLevel] }}
                        </el-tag>
                        <el-tag
                          v-if="risk.isBlocked"
                          color="#f56c6c"
                          effect="dark"
                          size="small"
                          class="risk-block-tag"
                        >
                          已拦截
                        </el-tag>
                      </div>
                      <div class="risk-desc">{{ risk.description }}</div>
                      <div class="risk-meta" v-if="risk.orderNo">
                        关联订单：<span class="order-no">{{ risk.orderNo }}</span>
                      </div>
                      <div class="risk-meta" v-if="risk.blockReason">
                        拦截原因：{{ risk.blockReason }}
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无异常行为记录" />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="风险报告" name="report">
        <div class="report-action-section">
          <div class="action-left">
            <el-button type="primary" :loading="generatingReport" @click="generateReport">
              <el-icon><Plus /></el-icon>
              生成风险报告
            </el-button>
          </div>
          <div class="action-right">
            <span class="filter-label">报告周期：</span>
            <el-select v-model="reportPeriod" style="width: 160px" @change="loadReportList">
              <el-option label="近7天" value="7" />
              <el-option label="近30天" value="30" />
              <el-option label="近90天" value="90" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <el-date-picker
              v-if="reportPeriod === 'custom'"
              v-model="customDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
              @change="loadReportList"
            />
          </div>
        </div>

        <div class="report-list-section">
          <div v-loading="reportListLoading" class="table-container">
            <el-table :data="reportList" border stripe style="width: 100%">
              <el-table-column prop="reportNo" label="报告编号" width="180">
                <template #default="{ row }">
                  <span class="report-no">{{ row.reportNo || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="报告类型" width="120">
                <template #default="{ row }">
                  <el-tag
                    :color="ReportTypeColorMap[row.reportType]"
                    effect="dark"
                    size="small"
                  >
                    {{ ReportTypeMap[row.reportType] || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="综合风险等级" width="120">
                <template #default="{ row }">
                  <el-tag
                    :color="TravelRiskLevelColorMap[row.overallRiskLevel]"
                    effect="dark"
                    size="small"
                  >
                    {{ TravelRiskLevelMap[row.overallRiskLevel] || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="风险评分" width="120">
                <template #default="{ row }">
                  <span
                    class="risk-score"
                    :style="{ color: getRiskScoreColor(Number(row.overallRiskScore)) }"
                  >
                    {{ row.overallRiskScore || '-' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="统计周期" width="220">
                <template #default="{ row }">
                  {{ formatDate(row.periodStart, 'YYYY-MM-DD') }} 至 {{ formatDate(row.periodEnd, 'YYYY-MM-DD') }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :color="ReportStatusColorMap[row.status]"
                    effect="dark"
                    size="small"
                  >
                    {{ ReportStatusMap[row.status] || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link @click="handleViewReport(row)">
                    查看详情
                  </el-button>
                  <el-button
                    v-if="row.status === ReportStatus.PENDING_REVIEW"
                    type="warning"
                    link
                    @click="handleViewReport(row)"
                  >
                    审阅
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-container">
              <el-pagination
                v-model:current-page="reportPagination.page"
                v-model:page-size="reportPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="reportPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleReportSizeChange"
                @current-change="handleReportPageChange"
              />
            </div>
          </div>
        </div>

        <el-dialog
          v-model="reportDetailVisible"
          title="风险报告详情"
          width="1000px"
          :close-on-click-modal="false"
          destroy-on-close
        >
          <div class="report-detail-content" v-if="currentReport">
            <div class="report-stats-section">
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon primary">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ currentReport.statistics?.totalOrders || 0 }}</div>
                    <div class="stat-label">总订单数</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon danger">
                    <el-icon><CircleClose /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ currentReport.statistics?.cancelOrders || 0 }}</div>
                    <div class="stat-label">取消数</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon success">
                    <el-icon><CircleCheck /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ currentReport.statistics?.completeOrders || 0 }}</div>
                    <div class="stat-label">完成数</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon warning">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ currentReport.statistics?.cancelRate || '0%' }}</div>
                    <div class="stat-label">取消率</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon info">
                    <el-icon><Money /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">¥{{ currentReport.statistics?.totalAmount || '0.00' }}</div>
                    <div class="stat-label">总金额</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon primary-light">
                    <el-icon><Wallet /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">¥{{ currentReport.statistics?.avgAmount || '0.00' }}</div>
                    <div class="stat-label">单均金额</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon warning-light">
                    <el-icon><Warning /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ currentReport.statistics?.riskCount || 0 }}</div>
                    <div class="stat-label">风险记录数</div>
                  </div>
                </div>
              </el-card>
              <el-card class="stat-card" shadow="hover">
                <div class="stat-content">
                  <div class="stat-icon danger-light">
                    <el-icon><WarningFilled /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ currentReport.statistics?.highRiskCount || 0 }}</div>
                    <div class="stat-label">高风险数</div>
                  </div>
                </div>
              </el-card>
            </div>

            <div class="report-section">
              <div class="section-header">
                <h5>
                  <el-icon><WarningFilled /></el-icon>
                  异常行为列表
                </h5>
              </div>
              <el-table :data="currentReport.abnormalBehaviors || []" size="small" border>
                <el-table-column label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag
                      :color="TravelRiskTypeColorMap[row.type]"
                      effect="dark"
                      size="small"
                    >
                      {{ TravelRiskTypeMap[row.type] || row.name }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="等级" width="100">
                  <template #default="{ row }">
                    <el-tag
                      :color="RiskSeverityLevelColorMap[row.level]"
                      effect="dark"
                      size="small"
                    >
                      {{ RiskSeverityLevelMap[row.level] }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" />
                <el-table-column prop="time" label="时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.time) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="report-section">
              <div class="section-header">
                <h5>
                  <el-icon><TrendCharts /></el-icon>
                  风险评估
                </h5>
              </div>
              <div class="risk-assessment-grid">
                <div class="assessment-item">
                  <div class="assessment-label">取消风险</div>
                  <el-tag
                    :color="getAssessmentTagColor(currentReport.riskAssessment?.cancelRisk)"
                    effect="dark"
                    size="default"
                  >
                    {{ currentReport.riskAssessment?.cancelRisk || '-' }}
                  </el-tag>
                </div>
                <div class="assessment-item">
                  <div class="assessment-label">投诉风险</div>
                  <el-tag
                    :color="getAssessmentTagColor(currentReport.riskAssessment?.complaintRisk)"
                    effect="dark"
                    size="default"
                  >
                    {{ currentReport.riskAssessment?.complaintRisk || '-' }}
                  </el-tag>
                </div>
                <div class="assessment-gauge">
                  <div class="gauge-label">综合评分</div>
                  <svg viewBox="0 0 200 120" class="mini-gauge-svg">
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color: #67c23a" />
                        <stop offset="50%" style="stop-color: #e6a23c" />
                        <stop offset="100%" style="stop-color: #f56c6c" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#ebeef5"
                      stroke-width="12"
                      stroke-linecap="round"
                    />
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      stroke-width="12"
                      stroke-linecap="round"
                      :stroke-dasharray="getGaugeDashArray(currentReport.riskAssessment?.overallScore || 0)"
                    />
                    <text x="100" y="85" text-anchor="middle" class="gauge-value">
                      {{ currentReport.riskAssessment?.overallScore || 0 }}
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div class="report-section">
              <div class="section-header">
                <h5>
                  <el-icon><LightBulb /></el-icon>
                  处理建议
                </h5>
              </div>
              <div class="suggestions-list">
                <div
                  v-for="(suggestion, idx) in currentReport.recommendations || []"
                  :key="idx"
                  class="suggestion-item"
                >
                  <div class="suggestion-icon">
                    <el-icon><Tips /></el-icon>
                  </div>
                  <div class="suggestion-text">{{ suggestion }}</div>
                </div>
                <el-empty v-if="!currentReport.recommendations?.length" description="暂无处理建议" :image-size="80" />
              </div>
            </div>

            <div class="report-section">
              <div class="section-header">
                <h5>
                  <el-icon><Setting /></el-icon>
                  建议采取措施
                </h5>
              </div>
              <div class="actions-list">
                <div
                  v-for="(action, idx) in currentReport.suggestedActions || []"
                  :key="idx"
                  class="action-item"
                >
                  <div class="action-icon">
                    <el-icon><Operation /></el-icon>
                  </div>
                  <div class="action-text">{{ action }}</div>
                </div>
                <el-empty v-if="!currentReport.suggestedActions?.length" description="暂无建议措施" :image-size="80" />
              </div>
            </div>

            <div
              v-if="currentReport.status === ReportStatus.PENDING_REVIEW"
              class="review-section"
            >
              <el-divider />
              <div class="section-header">
                <h5>
                  <el-icon><Edit /></el-icon>
                  报告审阅
                </h5>
              </div>
              <div class="review-form">
                <el-form-item label="审阅意见" label-width="100px">
                  <el-input
                    v-model="reviewForm.remark"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入审阅意见..."
                  />
                </el-form-item>
                <el-form-item label="执行措施" label-width="100px">
                  <el-checkbox-group v-model="reviewForm.executedActions">
                    <el-checkbox label="restrict_order">限制临时下单</el-checkbox>
                    <el-checkbox label="restrict_discount">限制溢价减免</el-checkbox>
                    <el-checkbox label="ban_account">封禁账号</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <div class="review-actions">
                  <el-button
                    type="success"
                    :loading="reviewing"
                    @click="handleReview(true)"
                  >
                    <el-icon><CircleCheck /></el-icon>
                    审阅通过
                  </el-button>
                  <el-button
                    type="danger"
                    :loading="reviewing"
                    @click="handleReview(false)"
                  >
                    <el-icon><CircleClose /></el-icon>
                    审阅驳回
                  </el-button>
                </div>
              </div>
            </div>

            <div v-else-if="currentReport.reviewRemark" class="review-history-section">
              <el-divider />
              <div class="section-header">
                <h5>
                  <el-icon><Document /></el-icon>
                  审阅记录
                </h5>
              </div>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="审阅人">
                  {{ currentReport.reviewerName || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="审阅时间">
                  {{ formatDate(currentReport.reviewTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="审阅意见" :span="2">
                  {{ currentReport.reviewRemark }}
                </el-descriptions-item>
                <el-descriptions-item label="执行措施" :span="2" v-if="currentReport.executedActions?.length">
                  <el-tag
                    v-for="(action, idx) in currentReport.executedActions"
                    :key="idx"
                    size="small"
                    effect="dark"
                    style="margin-right: 8px"
                  >
                    {{ getActionLabel(action) }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Van,
  Document,
  Clock,
  Warning,
  WarningFilled,
  CircleCheck,
  CircleClose,
  ChatDotRound,
  Star,
  TimeLine,
  Plus,
  TrendCharts,
  Money,
  Wallet,
  LightBulb,
  Tips,
  Setting,
  Operation,
  Edit,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import {
  getTravelRecordsApi,
  getTravelTraceDetailApi,
  getTravelRiskListApi,
  createBehaviorReportApi,
  getBehaviorReportListApi,
  getBehaviorReportDetailApi,
  reviewBehaviorReportApi
} from '@/api/passenger'
import {
  TravelRiskTypeMap,
  TravelRiskTypeColorMap,
  TravelRiskLevelMap,
  TravelRiskLevelColorMap,
  RiskSeverityLevelMap,
  RiskSeverityLevelColorMap,
  ReportTypeMap,
  ReportTypeColorMap,
  ReportStatusMap,
  ReportStatusColorMap,
  ReportStatus,
  TravelRiskType
} from '@/enums/passenger'
import { OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { formatDate } from '@/utils/format'
import type {
  Passenger,
  PassengerTravelRisk,
  PassengerBehaviorReport,
  TravelTraceDetail
} from '@/types/passenger'

interface Props {
  passengerId: number
  passengerInfo: Passenger
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'refresh-passenger': []
}>()

const activeTab = ref('trace')

const detectionResults = reactive({
  maliciousOrder: {
    isAbnormal: false,
    checkCount: 0,
    lastCheckTime: '' as string
  },
  frequentCancel: {
    isAbnormal: false,
    checkCount: 0,
    lastCheckTime: '' as string
  },
  fakeComplaint: {
    isAbnormal: false,
    checkCount: 0,
    lastCheckTime: '' as string
  }
})

const recordsLoading = ref(false)
const travelRecords = ref<any[]>([])
const recordsPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})
const expandedDetails = ref<Record<number, TravelTraceDetail | null>>({})
const expandedLoading = ref<Record<number, boolean>>({})

const risksLoading = ref(false)
const travelRisks = ref<PassengerTravelRisk[]>([])

const generatingReport = ref(false)
const reportListLoading = ref(false)
const reportPeriod = ref('30')
const customDateRange = ref<string[]>([])
const reportList = ref<PassengerBehaviorReport[]>([])
const reportPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const reportDetailVisible = ref(false)
const currentReport = ref<PassengerBehaviorReport | null>(null)
const reviewing = ref(false)
const reviewForm = reactive({
  remark: '',
  executedActions: [] as string[]
})

const getRiskIcon = (riskType: number) => {
  switch (riskType) {
    case TravelRiskType.MALICIOUS_ORDER:
      return WarningFilled
    case TravelRiskType.FREQUENT_CANCEL:
      return CircleClose
    case TravelRiskType.FAKE_COMPLAINT:
      return Warning
    case TravelRiskType.LATE_NOSHOW:
      return Clock
    default:
      return WarningFilled
  }
}

const getRiskScoreColor = (score: number): string => {
  if (score < 30) return '#67c23a'
  if (score < 60) return '#e6a23c'
  if (score < 80) return '#f56c6c'
  return '#9c27b0'
}

const getAssessmentTagColor = (level: string): string => {
  if (!level) return '#909399'
  const levelLower = level.toLowerCase()
  if (levelLower.includes('低') || levelLower === 'low') return '#67c23a'
  if (levelLower.includes('中') || levelLower === 'medium') return '#e6a23c'
  if (levelLower.includes('高') || levelLower === 'high') return '#f56c6c'
  return '#909399'
}

const getGaugeDashArray = (score: number): string => {
  const total = 251.33
  const ratio = Math.min(Math.max(score, 0), 100) / 100
  return `${total * ratio} ${total}`
}

const getActionLabel = (action: string): string => {
  const map: Record<string, string> = {
    restrict_order: '限制临时下单',
    restrict_discount: '限制溢价减免',
    ban_account: '封禁账号'
  }
  return map[action] || action
}

const runAutoDetection = (records: any[], risks: PassengerTravelRisk[]) => {
  const now = Date.now()
  const lastCheckTime = new Date(now).toISOString()

  let maliciousOrderCount = 0
  let frequentCancelCount = 0
  let fakeComplaintCount = 0

  const fiveMinutesAgo = now - 5 * 60 * 1000
  const oneHourAgo = now - 60 * 60 * 1000

  const recentOrders = records.filter(r => {
    const orderTime = new Date(r.createTime).getTime()
    return orderTime >= fiveMinutesAgo
  })
  if (recentOrders.length >= 2) {
    maliciousOrderCount = 1
  }

  const recentCancelled = records.filter(r => {
    const orderTime = new Date(r.createTime).getTime()
    return orderTime >= oneHourAgo && r.status === 6
  })
  if (recentCancelled.length >= 3) {
    frequentCancelCount = 1
  }

  const fakeComplaints = risks.filter(r => r.riskType === TravelRiskType.FAKE_COMPLAINT)
  if (fakeComplaints.length > 0) {
    fakeComplaintCount = 1
  }

  detectionResults.maliciousOrder = {
    isAbnormal: recentOrders.length >= 2,
    checkCount: records.length > 0 ? records.length : 1,
    lastCheckTime
  }
  detectionResults.frequentCancel = {
    isAbnormal: recentCancelled.length >= 3,
    checkCount: records.length > 0 ? records.length : 1,
    lastCheckTime
  }
  detectionResults.fakeComplaint = {
    isAbnormal: fakeComplaints.length > 0,
    checkCount: risks.length > 0 ? risks.length : 1,
    lastCheckTime
  }
}

const loadTravelRecords = async () => {
  recordsLoading.value = true
  try {
    const res = await getTravelRecordsApi(props.passengerId, {
      page: recordsPagination.page,
      pageSize: recordsPagination.pageSize
    })
    const list = res.data?.list || res.data?.records || res.data || []
    travelRecords.value = Array.isArray(list) ? list : []
    recordsPagination.total = res.data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载出行记录失败')
    travelRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

const handleRecordsSizeChange = (size: number) => {
  recordsPagination.pageSize = size
  recordsPagination.page = 1
  loadTravelRecords()
}

const handleRecordsPageChange = (page: number) => {
  recordsPagination.page = page
  loadTravelRecords()
}

const handleExpandChange = async (row: any, expandedRows: any[]) => {
  const isExpanded = expandedRows.some(r => r.id === row.id)
  if (isExpanded && !expandedDetails.value[row.id]) {
    await loadOrderDetail(row.id)
  }
}

const handleToggleExpand = (row: any) => {
  const table = document.querySelector('.travel-records-section .el-table') as any
  if (table && table.toggleRowExpansion) {
    table.toggleRowExpansion(row)
  }
}

const loadOrderDetail = async (orderId: number) => {
  expandedLoading.value[orderId] = true
  try {
    const res = await getTravelTraceDetailApi(props.passengerId, orderId)
    expandedDetails.value[orderId] = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '加载订单详情失败')
    expandedDetails.value[orderId] = null
  } finally {
    expandedLoading.value[orderId] = false
  }
}

const loadTravelRisks = async () => {
  risksLoading.value = true
  try {
    const res = await getTravelRiskListApi(props.passengerId, { page: 1, pageSize: 20 })
    const list = res.data?.list || res.data?.records || res.data || []
    travelRisks.value = Array.isArray(list) ? list : []
  } catch (error: any) {
    ElMessage.error(error.message || '加载风险记录失败')
    travelRisks.value = []
  } finally {
    risksLoading.value = false
  }
}

const generateReport = async () => {
  generatingReport.value = true
  try {
    const params: any = {}
    if (reportPeriod.value === 'custom' && customDateRange.value.length === 2) {
      params.periodStart = customDateRange.value[0]
      params.periodEnd = customDateRange.value[1]
    } else {
      params.period = Number(reportPeriod.value)
    }
    const res = await createBehaviorReportApi(props.passengerId, params)
    ElMessage.success('风险报告生成成功')
    await loadReportList()
    emit('refresh-passenger')
  } catch (error: any) {
    ElMessage.error(error.message || '生成风险报告失败')
  } finally {
    generatingReport.value = false
  }
}

const loadReportList = async () => {
  reportListLoading.value = true
  try {
    const params: any = {
      page: reportPagination.page,
      pageSize: reportPagination.pageSize
    }
    if (reportPeriod.value === 'custom' && customDateRange.value.length === 2) {
      params.periodStart = customDateRange.value[0]
      params.periodEnd = customDateRange.value[1]
    } else {
      params.period = Number(reportPeriod.value)
    }
    const res = await getBehaviorReportListApi(props.passengerId, params)
    const list = res.data?.list || res.data?.records || res.data || []
    reportList.value = Array.isArray(list) ? list : []
    reportPagination.total = res.data?.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载报告列表失败')
    reportList.value = []
  } finally {
    reportListLoading.value = false
  }
}

const handleReportSizeChange = (size: number) => {
  reportPagination.pageSize = size
  reportPagination.page = 1
  loadReportList()
}

const handleReportPageChange = (page: number) => {
  reportPagination.page = page
  loadReportList()
}

const handleViewReport = async (row: PassengerBehaviorReport) => {
  try {
    const res = await getBehaviorReportDetailApi(props.passengerId, row.id)
    currentReport.value = res.data
    reviewForm.remark = ''
    reviewForm.executedActions = []
    reportDetailVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '加载报告详情失败')
  }
}

const handleReview = async (passed: boolean) => {
  if (!currentReport.value) return
  reviewing.value = true
  try {
    await reviewBehaviorReportApi(props.passengerId, currentReport.value.id, {
      passed,
      remark: reviewForm.remark,
      executedActions: reviewForm.executedActions
    })
    ElMessage.success(passed ? '审阅通过成功' : '审阅已驳回')
    reportDetailVisible.value = false
    await loadReportList()
    emit('refresh-passenger')
  } catch (error: any) {
    ElMessage.error(error.message || '审阅操作失败')
  } finally {
    reviewing.value = false
  }
}

defineExpose({
  generateReport
})

watch(() => props.passengerId, () => {
  recordsPagination.page = 1
  reportPagination.page = 1
  expandedDetails.value = {}
  loadTravelRecords()
  loadTravelRisks()
  loadReportList()
}, { immediate: false })

watch([travelRecords, travelRisks], () => {
  runAutoDetection(travelRecords.value, travelRisks.value)
}, { immediate: true, deep: true })

onMounted(() => {
  loadTravelRecords()
  loadTravelRisks()
  loadReportList()
})
</script>

<style lang="scss" scoped>
.passenger-behavior-trace {
  .main-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .section-header {
    margin-bottom: 16px;

    h4,
    h5 {
      margin: 0;
      font-size: 16px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #409eff;
      }
    }

    h5 {
      font-size: 15px;
    }
  }

  .auto-detect-section {
    margin-bottom: 24px;

    .detect-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .detect-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #ebeef5;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      &.normal {
        background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
        border-color: #e1f3d8;
      }

      &.abnormal {
        background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
        border-color: #fbc4c4;
      }

      .detect-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        flex-shrink: 0;

        .icon-normal {
          color: #67c23a;
        }

        .icon-abnormal {
          color: #f56c6c;
        }
      }

      .detect-info {
        flex: 1;
        min-width: 0;

        .detect-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }

        .detect-status {
          margin-bottom: 10px;
        }

        .detect-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .travel-records-section {
    margin-bottom: 24px;

    .table-container {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #ebeef5;

      .order-no {
        font-family: 'Courier New', monospace;
        color: #606266;
      }

      .amount-text {
        font-weight: 500;
        color: #f56c6c;
      }

      .text-muted {
        color: #c0c4cc;
      }

      .abnormal-tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .abnormal-tag-mini {
          font-size: 11px;
        }
      }
    }

    .order-expand-content {
      padding: 8px 24px 16px 48px;

      .expand-section {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 6px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ebeef5;

          .el-icon {
            color: #409eff;
            font-size: 16px;
          }
        }
      }

      .timeline-content {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #606266;

        .timeline-operator,
        .timeline-reason,
        .timeline-remark {
          color: #909399;
        }
      }

      .abnormal-detection-result {
        padding: 16px;
        background: #fef0f0;
        border-radius: 8px;
        border-left: 4px solid #f56c6c;

        .abnormal-warning {
          margin-bottom: 12px;
        }

        .abnormal-type-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;

          .abnormal-tag {
            background: #f56c6c;
            border-color: #f56c6c;
          }
        }

        .abnormal-details {
          display: flex;
          gap: 24px;
          font-size: 13px;
          color: #606266;
        }
      }

      .complaint-review-section {
        display: grid;
        gap: 12px;

        .complaint-item,
        .review-item {
          padding: 12px 16px;
          background: #f5f7fa;
          border-radius: 8px;

          .item-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            .item-title {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }

            .el-icon {
              color: #e6a23c;
            }
          }

          .item-content {
            p {
              margin: 0 0 6px 0;
              font-size: 13px;
              color: #606266;
            }

            .item-time {
              margin-top: 8px;
              font-size: 12px;
              color: #909399;
            }
          }
        }

        .review-item {
          .item-header .el-icon {
            color: #f7ba2a;
          }
        }
      }

      .text-danger {
        color: #f56c6c;
        font-size: 18px;
      }

      .text-success {
        color: #67c23a;
        font-size: 18px;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  .abnormal-timeline-section {
    .timeline-container {
      background: #fff;
      border-radius: 8px;
      padding: 24px;
      border: 1px solid #ebeef5;

      :deep(.el-timeline) {
        padding-left: 0;

        .el-timeline-item {
          padding-left: 20px;
        }
      }

      .timeline-card {
        :deep(.el-card__body) {
          padding: 16px;
        }

        .timeline-card-header {
          display: flex;
          gap: 12px;

          .risk-type-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 20px;
            flex-shrink: 0;
          }

          .risk-info {
            flex: 1;
            min-width: 0;

            .risk-title {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 8px;

              .risk-level-tag,
              .risk-block-tag {
                font-size: 11px;
              }
            }

            .risk-desc {
              font-size: 13px;
              color: #606266;
              margin-bottom: 6px;
            }

            .risk-meta {
              font-size: 12px;
              color: #909399;

              .order-no {
                font-family: 'Courier New', monospace;
                color: #606266;
              }
            }
          }
        }
      }
    }
  }

  .report-action-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;

    .action-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .filter-label {
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .report-list-section {
    .table-container {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #ebeef5;

      .report-no {
        font-family: 'Courier New', monospace;
        color: #606266;
      }

      .risk-score {
        font-size: 16px;
        font-weight: 700;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  .report-detail-content {
    .report-stats-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;

      .stat-card {
        :deep(.el-card__body) {
          padding: 16px;
        }

        .stat-content {
          display: flex;
          align-items: center;
          gap: 12px;

          .stat-icon {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            color: #fff;
            flex-shrink: 0;

            &.primary {
              background: linear-gradient(135deg, #409eff, #3498db);
            }

            &.success {
              background: linear-gradient(135deg, #67c23a, #27ae60);
            }

            &.danger {
              background: linear-gradient(135deg, #f56c6c, #e74c3c);
            }

            &.warning {
              background: linear-gradient(135deg, #e6a23c, #f39c12);
            }

            &.info {
              background: linear-gradient(135deg, #909399, #606266);
            }

            &.primary-light {
              background: linear-gradient(135deg, #64b5f6, #42a5f5);
            }

            &.warning-light {
              background: linear-gradient(135deg, #ffb74d, #ffa726);
            }

            &.danger-light {
              background: linear-gradient(135deg, #ef5350, #e53935);
            }
          }

          .stat-info {
            flex: 1;
            min-width: 0;

            .stat-value {
              font-size: 20px;
              font-weight: 700;
              color: #303133;
              line-height: 1.2;
            }

            .stat-label {
              font-size: 12px;
              color: #909399;
              margin-top: 4px;
            }
          }
        }
      }
    }

    .report-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .risk-assessment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 8px;

      .assessment-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 8px;

        .assessment-label {
          font-size: 13px;
          color: #909399;
        }
      }

      .assessment-gauge {
        display: flex;
        flex-direction: column;
        align-items: center;

        .gauge-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 4px;
        }

        .mini-gauge-svg {
          width: 160px;
          height: 100px;

          .gauge-value {
            font-size: 24px;
            font-weight: 700;
            fill: #303133;
          }
        }
      }
    }

    .suggestions-list,
    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .suggestion-item,
      .action-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .suggestion-icon,
        .action-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: linear-gradient(135deg, #409eff, #64b5f6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
          flex-shrink: 0;
        }

        .suggestion-text,
        .action-text {
          flex: 1;
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }

    .review-section,
    .review-history-section {
      .review-form {
        padding: 0 8px;

        :deep(.el-form-item) {
          margin-bottom: 20px;
        }

        .review-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .passenger-behavior-trace {
    .auto-detect-section {
      .detect-cards {
        grid-template-columns: 1fr;
      }
    }

    .report-detail-content {
      .report-stats-section {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }
}

@media (max-width: 768px) {
  .passenger-behavior-trace {
    .report-detail-content {
      .report-stats-section {
        grid-template-columns: 1fr;
      }

      .risk-assessment-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>