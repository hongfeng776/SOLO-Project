<template>
  <div class="level-system-page">
    <el-tabs v-model="activeTab" class="level-system-tabs">
      <el-tab-pane label="等级规则" name="rules">
        <div class="rules-section">
          <div class="rules-header">
            <el-button
              type="primary"
              :icon="Check"
              :loading="batchReEvaluateLoading"
              @click="handleSaveAndReEvaluate"
            >
              保存并对存量推客重评
            </el-button>
            <span class="rules-tip">提示：点击卡片可编辑等级规则，修改阈值后保存会自动对存量推客进行重评</span>
          </div>

          <div class="level-cards">
            <el-popover
              v-for="(rule, idx) in levelRules"
              :key="rule.level"
              placement="top"
              :width="320"
              :trigger="'hover'"
            >
              <template #reference>
                <div
                  class="level-card"
                  :class="[`level-${rule.level.toLowerCase()}`, { 'card-editing': editingLevel === rule.level }]"
                  @click="openRuleEditDialog(rule, idx)"
                >
                  <div class="card-header">
                    <el-tag :type="getLevelTagType(rule.level)" effect="dark" size="large">
                      {{ rule.level }} {{ rule.levelName || getLevelName(rule.level) }}
                    </el-tag>
                    <el-icon class="edit-icon"><Edit /></el-icon>
                  </div>
                  <div class="card-thresholds">
                    <div class="threshold-item">
                      <div class="threshold-label">月销金额</div>
                      <div class="threshold-value">¥{{ formatNumber(rule.minMonthlyAmount) }}</div>
                    </div>
                    <div class="threshold-item">
                      <div class="threshold-label">月订单数</div>
                      <div class="threshold-value">{{ rule.minMonthlyOrders }} 单</div>
                    </div>
                    <div class="threshold-item">
                      <div class="threshold-label">活跃天数</div>
                      <div class="threshold-value">{{ rule.minActiveDays }} 天</div>
                    </div>
                    <div class="threshold-item">
                      <div class="threshold-label">信誉分数</div>
                      <div class="threshold-value">{{ rule.minReputationScore }} 分</div>
                    </div>
                  </div>
                  <div class="card-benefits-preview">
                    <el-tag size="small" type="success" v-if="rule.canUseCoupon">优惠券</el-tag>
                    <el-tag size="small" type="warning" v-if="rule.canUseCashback">返现</el-tag>
                    <span class="more-benefits" v-if="rule.commissionRate || rule.maxChannels">+更多权益</span>
                  </div>
                </div>
              </template>
              <div class="benefits-popover">
                <div class="popover-title">权益详情</div>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="佣金比例">
                    <span class="highlight-value">{{ (rule.commissionRate ?? 0) * 100 }}%</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="可绑定渠道数">
                    {{ rule.maxChannels ?? '-' }} 个
                  </el-descriptions-item>
                  <el-descriptions-item label="最低订单金额">
                    ¥{{ rule.minOrderAmount ?? 0 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="每日提现上限">
                    ¥{{ rule.dailyWithdrawLimit ?? 0 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="优惠券功能">
                    <el-tag v-if="rule.canUseCoupon" type="success" size="small">支持</el-tag>
                    <el-tag v-else type="info" size="small">不支持</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="返现功能">
                    <el-tag v-if="rule.canUseCashback" type="warning" size="small">支持</el-tag>
                    <el-tag v-else type="info" size="small">不支持</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="高级素材">
                    <el-tag v-if="rule.canUsePremiumMaterial" type="success" size="small">可用</el-tag>
                    <el-tag v-else type="info" size="small">不可用</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="数据分析">
                    <el-tag v-if="rule.canUseAdvancedAnalytics" type="primary" size="small">可用</el-tag>
                    <el-tag v-else type="info" size="small">不可用</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-popover>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="手动调整" name="adjust">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-card shadow="never" class="adjust-card">
              <div class="card-section-title">
                <el-icon><User /></el-icon>
                选择推客
              </div>
              <div class="promoter-selector">
                <el-input
                  v-model="adjustPromoterKeyword"
                  placeholder="搜索推客姓名/手机号/编号"
                  :prefix-icon="Search"
                  clearable
                  style="width: 280px"
                  @input="searchPromoterCandidates"
                />
                <el-select
                  v-model="selectedAdjustPromoterId"
                  placeholder="请选择推客"
                  style="flex: 1; margin-left: 12px"
                  filterable
                  @change="handleSelectAdjustPromoter"
                >
                  <el-option
                    v-for="p in promoterCandidates"
                    :key="p.id"
                    :label="`${p.name} (${p.phone} / ${p.id})`"
                    :value="p.id"
                  />
                </el-select>
              </div>

              <div v-if="selectedAdjustPromoter" class="selected-promoter-info">
                <div class="promoter-basic">
                  <el-avatar :size="44">
                    {{ selectedAdjustPromoter.name?.charAt(0) || 'U' }}
                  </el-avatar>
                  <div class="promoter-meta">
                    <div class="promoter-name">
                      {{ selectedAdjustPromoter.name }}
                      <el-tag size="small" style="margin-left: 8px" :type="PROMOTER_LEVEL_MAP[Number(selectedAdjustPromoter.level)]?.type || 'info'">
                        {{ PROMOTER_LEVEL_MAP[Number(selectedAdjustPromoter.level)]?.label || 'L1' }}
                      </el-tag>
                    </div>
                    <div class="promoter-sub">
                      编号: {{ selectedAdjustPromoter.id }} | 手机号: {{ selectedAdjustPromoter.phone }}
                    </div>
                  </div>
                </div>

                <div class="metrics-section">
                  <div class="metrics-title">当前指标</div>
                  <el-row :gutter="12" class="metrics-row">
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-label">月销金额</div>
                        <div class="metric-value">¥{{ formatNumber(adjustPromoterMetrics.minMonthlyAmount) }}</div>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-label">月订单数</div>
                        <div class="metric-value">{{ adjustPromoterMetrics.minMonthlyOrders }} 单</div>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-label">活跃天数</div>
                        <div class="metric-value">{{ adjustPromoterMetrics.minActiveDays }} 天</div>
                      </div>
                    </el-col>
                    <el-col :span="6">
                      <div class="metric-card">
                        <div class="metric-label">信誉分数</div>
                        <div class="metric-value">{{ adjustPromoterMetrics.minReputationScore }} 分</div>
                      </div>
                    </el-col>
                  </el-row>
                </div>

                <div class="threshold-progress-section">
                  <div class="threshold-progress-title">各等级达标进度</div>
                  <div class="progress-list">
                    <div v-for="(thresholds, lv) in LEVEL_RULE_THRESHOLDS" :key="lv" class="progress-item">
                      <div class="progress-level-tag">
                        <el-tag size="small" :type="getLevelTagType(lv as string)">{{ lv }}</el-tag>
                      </div>
                      <div class="progress-bars">
                        <div class="progress-field">
                          <span class="field-name">金额</span>
                          <el-progress
                            :percentage="calcProgress(adjustPromoterMetrics.minMonthlyAmount, thresholds.minMonthlyAmount)"
                            :status="adjustPromoterMetrics.minMonthlyAmount >= thresholds.minMonthlyAmount ? 'success' : ''"
                            :stroke-width="8"
                          />
                        </div>
                        <div class="progress-field">
                          <span class="field-name">订单</span>
                          <el-progress
                            :percentage="calcProgress(adjustPromoterMetrics.minMonthlyOrders, thresholds.minMonthlyOrders)"
                            :status="adjustPromoterMetrics.minMonthlyOrders >= thresholds.minMonthlyOrders ? 'success' : ''"
                            :stroke-width="8"
                          />
                        </div>
                        <div class="progress-field">
                          <span class="field-name">活跃</span>
                          <el-progress
                            :percentage="calcProgress(adjustPromoterMetrics.minActiveDays, thresholds.minActiveDays)"
                            :status="adjustPromoterMetrics.minActiveDays >= thresholds.minActiveDays ? 'success' : ''"
                            :stroke-width="8"
                          />
                        </div>
                        <div class="progress-field">
                          <span class="field-name">信誉</span>
                          <el-progress
                            :percentage="calcProgress(adjustPromoterMetrics.minReputationScore, thresholds.minReputationScore)"
                            :status="adjustPromoterMetrics.minReputationScore >= thresholds.minReputationScore ? 'success' : ''"
                            :stroke-width="8"
                          />
                        </div>
                      </div>
                      <div class="progress-status">
                        <el-tag v-if="meetsLevelThreshold(lv as string)" type="success" size="small">已达标</el-tag>
                        <el-tag v-else type="info" size="small">未达标</el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="adjust-form-section">
                  <div class="adjust-form-title">
                    <el-icon><Promotion /></el-icon>
                    等级调整
                  </div>
                  <el-form :model="adjustForm" label-width="100px" style="margin-top: 12px;">
                    <el-form-item label="目标等级">
                      <el-select v-model="adjustForm.targetLevel" placeholder="请选择目标等级" style="width: 220px" @change="handleTargetLevelChange">
                        <el-option
                          v-for="item in PROMOTER_LEVEL_OPTIONS"
                          :key="item.value"
                          :label="item.label"
                          :value="`L${item.value}`"
                        />
                      </el-select>
                      <el-tag
                        v-if="adjustForm.targetLevel"
                        :type="meetsTargetThreshold ? 'success' : 'warning'"
                        style="margin-left: 12px"
                      >
                        {{ meetsTargetThreshold ? '已达标' : '未达标-需上级审核' }}
                      </el-tag>
                    </el-form-item>
                    <el-form-item
                      label="调整理由"
                      :required="!meetsTargetThreshold"
                      v-if="adjustForm.targetLevel && !meetsTargetThreshold"
                    >
                      <el-input
                        v-model="adjustForm.adjustReason"
                        type="textarea"
                        :rows="3"
                        placeholder="特殊调整理由（至少5个字）"
                        maxlength="200"
                        show-word-limit
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button
                        type="primary"
                        :icon="Check"
                        :loading="adjustSubmitLoading"
                        :disabled="!adjustForm.targetLevel || (!meetsTargetThreshold && (adjustForm.adjustReason?.length ?? 0) < 5)"
                        @click="handleSubmitAdjust"
                      >
                        {{ meetsTargetThreshold ? '直接升级' : '提交上级审核' }}
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </div>

              <el-empty v-else description="请搜索并选择要调整等级的推客" style="padding: 40px 0;" />
            </el-card>
          </el-col>

          <el-col :span="10">
            <el-card shadow="never" class="adjust-card">
              <div class="card-section-title">
                <el-icon><Document /></el-icon>
                待我审核
                <el-tag type="warning" style="margin-left: 8px;">{{ pendingReviewList.length }} 条</el-tag>
                <el-button :icon="Refresh" size="small" style="margin-left: auto" text @click="fetchPendingReviewList">刷新</el-button>
              </div>

              <div v-loading="adjustListLoading" class="pending-review-list">
                <el-empty v-if="pendingReviewList.length === 0" description="暂无待审核的申请" />
                <div v-for="item in pendingReviewList" :key="item.id" class="review-item" @click="openReviewDialog(item)">
                  <div class="review-item-header">
                    <span class="review-applicant">{{ item.applicantName || '运营' }}</span>
                    <span class="review-time">{{ formatDateTime(item.createdAt) }}</span>
                  </div>
                  <div class="review-item-body">
                    <div class="review-level-change">
                      <el-tag size="small" :type="getLevelTagType(item.fromLevel)">{{ item.fromLevel }}</el-tag>
                      <el-icon class="arrow-icon"><Right /></el-icon>
                      <el-tag size="small" :type="getLevelTagType(item.toLevel)">{{ item.toLevel }}</el-tag>
                    </div>
                    <el-tag v-if="item.meetsThreshold" type="success" size="small">达标</el-tag>
                    <el-tag v-else type="warning" size="small">未达标-特例</el-tag>
                  </div>
                  <div class="review-item-reason" v-if="item.adjustReason">
                    理由：{{ item.adjustReason }}
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="批量重评" name="batch">
        <el-card shadow="never">
          <div class="batch-header">
            <el-button
              type="primary"
              :icon="Refresh"
              :loading="batchReEvaluateLoading"
              @click="handleBatchReEvaluate"
            >
              全量重评推客等级
            </el-button>
            <el-button
              type="warning"
              :icon="Operation"
              :loading="batchResetLoading"
              :disabled="batchSelectedIds.length === 0"
              @click="handleBatchReset"
            >
              批量重置至 L1
            </el-button>
            <span class="batch-tip">已选 {{ batchSelectedIds.length }} 个（L5 钻石推客不可勾选）</span>
          </div>

          <el-table
            ref="batchTableRef"
            v-loading="batchTableLoading"
            :data="batchTableData"
            stripe
            border
            style="width: 100%; margin-top: 16px;"
            @selection-change="handleBatchSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" fixed="left" :selectable="isRowSelectable" />
            <el-table-column prop="id" label="编号" width="90" align="center" fixed="left" />
            <el-table-column prop="name" label="姓名" width="100" fixed="left" />
            <el-table-column prop="code" label="推客编号" width="130" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column label="等级" width="110" align="center" fixed="left">
              <template #default="{ row }">
                <el-tag :type="PROMOTER_LEVEL_MAP[Number((row as any).level)]?.type || 'info'" size="small">
                  {{ PROMOTER_LEVEL_MAP[Number((row as any).level)]?.label || 'L1' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="核心推客" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="['L4', 'L5', 4, 5].includes((row as any).level)" type="danger" effect="dark" size="small">
                  核心
                </el-tag>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="月销金额" width="130" align="right">
              <template #default="{ row }">¥{{ formatNumber((row as any).minMonthlyAmount) }}</template>
            </el-table-column>
            <el-table-column label="月订单数" width="110" align="right">
              <template #default="{ row }">{{ (row as any).minMonthlyOrders ?? 0 }} 单</template>
            </el-table-column>
            <el-table-column label="活跃天数" width="100" align="right">
              <template #default="{ row }">{{ (row as any).minActiveDays ?? 0 }} 天</template>
            </el-table-column>
            <el-table-column label="信誉分数" width="100" align="right">
              <template #default="{ row }">{{ (row as any).minReputationScore ?? 0 }} 分</template>
            </el-table-column>
            <el-table-column label="绩效" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="isLowPerformance(row as any)" type="danger" size="small">低绩效</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
            <el-pagination
              v-model:current-page="batchPagination.page"
              v-model:page-size="batchPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="batchTableTotal"
              layout="total, sizes, prev, pager, next"
              background
              @size-change="fetchBatchTableData"
              @current-change="fetchBatchTableData"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="变更溯源" name="trace">
        <el-card shadow="never">
          <div class="trace-search-bar">
            <span class="trace-title"><el-icon><Connection /></el-icon> 变更溯源</span>
            <el-input
              v-model="traceSearchKeyword"
              placeholder="输入手机号/推客编号搜索"
              clearable
              :prefix-icon="Search"
              style="width: 280px; margin-left: 16px;"
              @keyup.enter="handleTraceSearch"
            />
            <el-button type="primary" class="scale-btn" style="margin-left: 8px;" :icon="Search" @click="handleTraceSearch">搜索</el-button>
            <el-select
              v-if="tracePromoterOptions.length > 0"
              v-model="selectedTracePromoterId"
              placeholder="选择推客查看变更"
              style="width: 300px; margin-left: 16px;"
              @change="handleSelectTracePromoter"
            >
              <el-option
                v-for="item in tracePromoterOptions"
                :key="item.id"
                :label="`${item.name} (${item.phone} / ${item.id})`"
                :value="item.id"
              />
            </el-select>
          </div>

          <div v-if="selectedTracePromoter" style="margin-top: 16px;">
            <el-row :gutter="16" class="trace-stats-row">
              <el-col :span="6">
                <div class="stat-card stat-change">
                  <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ iterationStats.totalChangeEvents }}</div>
                    <div class="stat-label">总变更次数</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card stat-iteration">
                  <div class="stat-icon"><el-icon><Refresh /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ iterationStats.avgIterationsPerPromoter.toFixed(1) }}</div>
                    <div class="stat-label">平均迭代频次</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card stat-anomaly">
                  <div class="stat-icon"><el-icon><Warning /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ iterationStats.anomaliesCount }}</div>
                    <div class="stat-label">异常变更数</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card stat-distribution">
                  <div class="stat-icon"><el-icon><DataBoard /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-distribution-tags">
                      <el-tag v-for="(cnt, lv) in iterationStats.distribution" :key="lv" size="small" :type="getLevelTagType(lv as string)">
                        {{ lv }}:{{ cnt }}
                      </el-tag>
                    </div>
                    <div class="stat-label">当前等级分布</div>
                  </div>
                </div>
              </el-col>
            </el-row>

            <div class="trace-promoter-info" style="margin-top: 16px;">
              <el-avatar :size="40">
                {{ selectedTracePromoter.name?.charAt(0) || 'U' }}
              </el-avatar>
              <div style="margin-left: 12px;">
                <div class="trace-promoter-name">
                  {{ selectedTracePromoter.name }}
                  <el-tag size="small" style="margin-left: 8px;" :type="PROMOTER_LEVEL_MAP[Number(selectedTracePromoter.level)]?.type || 'info'">
                    {{ PROMOTER_LEVEL_MAP[Number(selectedTracePromoter.level)]?.label || 'L1' }}
                  </el-tag>
                </div>
                <div class="trace-promoter-sub">
                  编号: {{ selectedTracePromoter.id }} | 手机号: {{ selectedTracePromoter.phone }}
                </div>
              </div>
            </div>

            <el-timeline v-loading="changeLogsLoading" style="margin-top: 24px;">
              <el-timeline-item
                v-for="log in changeLogs"
                :key="log.id"
                :timestamp="formatDateTime(log.createdAt)"
                placement="top"
                :type="log.anomalyFlagged ? 'danger' : 'primary'"
                :hollow="log.anomalyFlagged"
              >
                <div class="timeline-item-card" :class="{ 'anomaly-card': log.anomalyFlagged }">
                  <div class="timeline-header">
                    <el-tag
                      :type="(LEVEL_CHANGE_SOURCE_MAP[log.changeSource]?.type as any) || 'info'"
                      size="small"
                    >
                      {{ LEVEL_CHANGE_SOURCE_MAP[log.changeSource]?.label || log.changeSource }}
                    </el-tag>
                    <span class="level-change-arrow">
                      <el-tag size="small" :type="getLevelTagType(log.fromLevel)">{{ log.fromLevel }}</el-tag>
                      <el-icon class="arrow"><Right /></el-icon>
                      <el-tag size="small" :type="getLevelTagType(log.toLevel)">{{ log.toLevel }}</el-tag>
                    </span>
                    <el-tag
                      v-if="log.meetsThreshold"
                      type="success"
                      size="small"
                      effect="plain"
                    >达标</el-tag>
                    <el-tag
                      v-else
                      type="warning"
                      size="small"
                      effect="plain"
                    >未达标</el-tag>
                    <span v-if="log.anomalyFlagged" class="anomaly-flag">
                      <el-icon><WarningFilled /></el-icon>
                      {{ log.anomalyReason || '合规异常' }}
                    </span>
                  </div>
                  <div class="timeline-meta">
                    <span v-if="log.operatorName">操作人：{{ log.operatorName }}</span>
                    <span v-if="log.iterationCount > 0" style="margin-left: 16px;">
                      第 {{ log.iterationCount }} 次迭代
                    </span>
                  </div>
                  <div class="timeline-reason" v-if="log.changeReason">
                    <el-icon><ChatDotRound /></el-icon>
                    {{ log.changeReason }}
                  </div>
                  <div class="timeline-compliance" v-if="log.complianceCheck && Object.keys(log.complianceCheck).length > 0">
                    <span class="compliance-label">合规校验：</span>
                    <el-tag
                      v-for="(val, key) in log.complianceCheck"
                      :key="key"
                      size="small"
                      :type="val ? 'success' : 'danger'"
                      effect="plain"
                      style="margin-right: 6px;"
                    >
                      {{ key }}：{{ val ? '通过' : '未通过' }}
                    </el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>

            <div v-if="changeLogs.length === 0 && !changeLogsLoading" style="padding: 40px 0;">
              <el-empty description="暂无变更记录" />
            </div>

            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
              <el-pagination
                v-model:current-page="tracePagination.page"
                v-model:page-size="tracePagination.pageSize"
                :page-sizes="[10, 20, 50]"
                :total="changeLogsTotal"
                layout="total, sizes, prev, pager, next"
                background
                @size-change="fetchChangeLogs"
                @current-change="fetchChangeLogs"
              />
            </div>
          </div>

          <div v-else style="padding: 60px 0;">
            <el-empty description="请搜索并选择要查看溯源的推客" />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="ruleEditDialogVisible"
      :title="`编辑 ${editingRule?.level} 等级规则`"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="ruleEditFormRef"
        :model="ruleEditForm"
        label-width="130px"
      >
        <el-divider content-position="left">升级阈值</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="月销金额(≥)" prop="minMonthlyAmount">
              <el-input
                v-model.number="ruleEditForm.minMonthlyAmount"
                type="number"
                :class="{ 'shake-input danger-input': thresholdFieldErrors.minMonthlyAmount }"
                @input="validateThresholdField('minMonthlyAmount')"
              >
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月订单数(≥)" prop="minMonthlyOrders">
              <el-input
                v-model.number="ruleEditForm.minMonthlyOrders"
                type="number"
                :class="{ 'shake-input danger-input': thresholdFieldErrors.minMonthlyOrders }"
                @input="validateThresholdField('minMonthlyOrders')"
              >
                <template #append>单</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活跃天数(≥)" prop="minActiveDays">
              <el-input
                v-model.number="ruleEditForm.minActiveDays"
                type="number"
                :class="{ 'shake-input danger-input': thresholdFieldErrors.minActiveDays }"
                @input="validateThresholdField('minActiveDays')"
              >
                <template #append>天</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信誉分数(≥)" prop="minReputationScore">
              <el-input
                v-model.number="ruleEditForm.minReputationScore"
                type="number"
                :class="{ 'shake-input danger-input': thresholdFieldErrors.minReputationScore }"
                @input="validateThresholdField('minReputationScore')"
              >
                <template #append>分</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">等级权益</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="佣金比例">
              <el-input-number
                v-model="ruleEditForm.commissionRate"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="3"
                style="width: 100%"
              />
              <span class="form-tip">实际显示：{{ ((ruleEditForm.commissionRate ?? 0) * 100).toFixed(1) }}%</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可绑定渠道数">
              <el-input-number
                v-model="ruleEditForm.maxChannels"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低订单金额">
              <el-input-number
                v-model="ruleEditForm.minOrderAmount"
                :min="0"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日提现上限">
              <el-input-number
                v-model="ruleEditForm.dailyWithdrawLimit"
                :min="0"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">功能权限</el-divider>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="优惠券">
              <el-switch v-model="ruleEditForm.canUseCoupon" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="返现功能">
              <el-switch v-model="ruleEditForm.canUseCashback" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="高级素材">
              <el-switch v-model="ruleEditForm.canUsePremiumMaterial" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="数据分析">
              <el-switch v-model="ruleEditForm.canUseAdvancedAnalytics" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="ruleEditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ruleSaveLoading" @click="handleSaveRule">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchResultDialogVisible"
      title="批量操作结果"
      width="760px"
    >
      <div v-if="batchOperationResult">
        <el-row :gutter="12" class="batch-result-stats">
          <el-col :span="6">
            <div class="result-stat total">
              <div class="result-stat-value">{{ batchOperationResult.total }}</div>
              <div class="result-stat-label">总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat regraded">
              <div class="result-stat-value">{{ batchOperationResult.regraded }}</div>
              <div class="result-stat-label">重评/重置</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat skipped">
              <div class="result-stat-value">{{ batchOperationResult.skipped }}</div>
              <div class="result-stat-label">跳过</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat failed">
              <div class="result-stat-value">{{ batchOperationResult.failed }}</div>
              <div class="result-stat-label">失败</div>
            </div>
          </el-col>
        </el-row>
        <div class="batch-result-detail">
          <div class="detail-title">操作明细</div>
          <el-table :data="batchOperationResult.details" border stripe max-height="360">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="code" label="推客编号" width="120" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column label="原等级" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getLevelTagType((row as any).originalLevel)">{{ (row as any).originalLevel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="新等级" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getLevelTagType((row as any).newLevel)">{{ (row as any).newLevel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="(row as any).changed" type="success" size="small">变更</el-tag>
                <el-tag v-else type="info" size="small">跳过</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="说明" min-width="160" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="batchResultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="`审核等级调整申请`"
      width="520px"
      :close-on-click-modal="false"
    >
      <div v-if="reviewTargetItem">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="申请人">{{ reviewTargetItem.applicantName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDateTime(reviewTargetItem.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="等级调整">
            <el-tag size="small" :type="getLevelTagType(reviewTargetItem.fromLevel)" style="margin-right: 8px;">
              {{ reviewTargetItem.fromLevel }}
            </el-tag>
            <el-icon style="vertical-align: middle;"><Right /></el-icon>
            <el-tag size="small" :type="getLevelTagType(reviewTargetItem.toLevel)" style="margin-left: 8px;">
              {{ reviewTargetItem.toLevel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="达标情况">
            <el-tag v-if="reviewTargetItem.meetsThreshold" type="success" size="small">达标</el-tag>
            <el-tag v-else type="warning" size="small">未达标</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="调整理由">{{ reviewTargetItem.adjustReason || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="reviewForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="审核备注">
            <el-input
              v-model="reviewForm.approveRemark"
              type="textarea"
              :rows="3"
              placeholder="请输入审核备注（驳回必填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="reviewSubmitting" @click="handleReview(false)">驳回</el-button>
        <el-button type="success" :loading="reviewSubmitting" @click="handleReview(true)">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Search,
  Check,
  Edit,
  Refresh,
  User,
  Document,
  Right,
  Promotion,
  Operation,
  Connection,
  TrendCharts,
  Warning,
  DataBoard,
  ChatDotRound,
  WarningFilled,
} from '@element-plus/icons-vue'
import {
  PROMOTER_LEVEL_OPTIONS,
  PROMOTER_LEVEL_MAP,
  LEVEL_RULE_THRESHOLDS,
  LEVEL_CHANGE_SOURCE_MAP,
  LOW_PERFORMANCE_THRESHOLD,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getPromoterList } from '@/api/promoter'
import {
  getLevelRules,
  saveLevelRule,
  requestManualAdjust,
  reviewAdjustRequest,
  getAdjustRequests,
  batchReEvaluateLevels,
  batchResetLevels,
  getLevelChangeLogs,
  getIterationStatistics,
  type LevelRuleItem,
  type AdjustRequestItem,
  type BatchReEvaluateResult,
  type LevelChangeLogItem,
  type IterationStats,
} from '@/api/promoter-level'

const activeTab = ref<string>('rules')

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return '0'
  return formatMoney(num)
}

const getLevelName = (level: string) => {
  const map: Record<string, string> = { L1: '初级', L2: '中级', L3: '高级', L4: '金牌', L5: '钻石' }
  return map[level] || ''
}

const getLevelTagType = (level: string | number) => {
  const lv = typeof level === 'number' ? `L${level}` : level
  const typeMap: Record<string, any> = {
    L1: 'info',
    L2: 'primary',
    L3: 'success',
    L4: 'warning',
    L5: 'danger',
  }
  return typeMap[lv] || 'info'
}

// ============== Tab1: 等级规则 ==============
const levelRules = ref<LevelRuleItem[]>([])
const batchReEvaluateLoading = ref(false)
const editingLevel = ref<string>('')
const editingRule = ref<LevelRuleItem | null>(null)
const ruleEditDialogVisible = ref(false)
const ruleEditFormRef = ref<FormInstance>()
const ruleSaveLoading = ref(false)
const editingRuleIndex = ref(0)
const thresholdFieldErrors = reactive<Record<string, boolean>>({
  minMonthlyAmount: false,
  minMonthlyOrders: false,
  minActiveDays: false,
  minReputationScore: false,
})

const ruleEditForm = reactive<Partial<LevelRuleItem>>({
  level: '',
  minMonthlyAmount: 0,
  minMonthlyOrders: 0,
  minActiveDays: 0,
  minReputationScore: 0,
  commissionRate: 0,
  maxChannels: 0,
  canUseCoupon: false,
  canUseCashback: false,
  minOrderAmount: 0,
  dailyWithdrawLimit: 0,
  canUsePremiumMaterial: false,
  canUseAdvancedAnalytics: false,
})

async function fetchLevelRules() {
  try {
    const data = await getLevelRules()
    if (data && data.length > 0) {
      levelRules.value = data
    } else {
      levelRules.value = ['L1', 'L2', 'L3', 'L4', 'L5'].map((lv) => ({
        level: lv,
        levelName: getLevelName(lv),
        ...(LEVEL_RULE_THRESHOLDS as any)[lv],
        commissionRate: 0.05 + (Number(lv.slice(1)) - 1) * 0.01,
        maxChannels: 2 + Number(lv.slice(1)) * 2,
        canUseCoupon: Number(lv.slice(1)) >= 2,
        canUseCashback: Number(lv.slice(1)) >= 3,
        minOrderAmount: Number(lv.slice(1)) * 100,
        dailyWithdrawLimit: Number(lv.slice(1)) * 5000,
        canUsePremiumMaterial: Number(lv.slice(1)) >= 4,
        canUseAdvancedAnalytics: Number(lv.slice(1)) >= 4,
      }))
    }
  } catch (e) {
    levelRules.value = ['L1', 'L2', 'L3', 'L4', 'L5'].map((lv) => ({
      level: lv,
      levelName: getLevelName(lv),
      ...(LEVEL_RULE_THRESHOLDS as any)[lv],
      commissionRate: 0.05 + (Number(lv.slice(1)) - 1) * 0.01,
      maxChannels: 2 + Number(lv.slice(1)) * 2,
      canUseCoupon: Number(lv.slice(1)) >= 2,
      canUseCashback: Number(lv.slice(1)) >= 3,
      minOrderAmount: Number(lv.slice(1)) * 100,
      dailyWithdrawLimit: Number(lv.slice(1)) * 5000,
      canUsePremiumMaterial: Number(lv.slice(1)) >= 4,
      canUseAdvancedAnalytics: Number(lv.slice(1)) >= 4,
    }))
  }
}

function openRuleEditDialog(rule: LevelRuleItem, idx: number) {
  editingRule.value = rule
  editingLevel.value = rule.level
  editingRuleIndex.value = idx
  Object.assign(ruleEditForm, JSON.parse(JSON.stringify(rule)))
  Object.keys(thresholdFieldErrors).forEach((k) => (thresholdFieldErrors[k] = false))
  ruleEditDialogVisible.value = true
}

function validateThresholdField(field: 'minMonthlyAmount' | 'minMonthlyOrders' | 'minActiveDays' | 'minReputationScore') {
  const val = Number(ruleEditForm[field]) ?? 0
  let hasError = false

  if (isNaN(val) || val < 0) {
    hasError = true
  }

  const currentIdx = ['L1', 'L2', 'L3', 'L4', 'L5'].indexOf(editingLevel.value)
  if (currentIdx > 0) {
    const prevRule = levelRules.value[currentIdx - 1]
    if (prevRule && val < (prevRule[field] ?? 0)) {
      hasError = true
    }
  }

  thresholdFieldErrors[field] = hasError
  return !hasError
}

async function handleSaveRule() {
  const fields: Array<'minMonthlyAmount' | 'minMonthlyOrders' | 'minActiveDays' | 'minReputationScore'> = [
    'minMonthlyAmount',
    'minMonthlyOrders',
    'minActiveDays',
    'minReputationScore',
  ]
  const allValid = fields.every((f) => validateThresholdField(f))
  if (!allValid) {
    ElMessage.warning('阈值不合法（不能为负数且不能低于上一级）')
    return
  }

  ruleSaveLoading.value = true
  try {
    const saved = await saveLevelRule(ruleEditForm as LevelRuleItem)
    levelRules.value[editingRuleIndex.value] = saved
    ElMessage.success('保存成功')
    ruleEditDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    ruleSaveLoading.value = false
  }
}

async function handleSaveAndReEvaluate() {
  await ElMessageBox.confirm(
    '保存规则后将立即对全量推客进行重评，确定继续？',
    '确认操作',
    { type: 'warning', confirmButtonText: '确定保存并重评', cancelButtonText: '取消' }
  )

  batchReEvaluateLoading.value = true
  try {
    for (let i = 0; i < levelRules.value.length; i++) {
      await saveLevelRule(levelRules.value[i])
    }
    const result = await batchReEvaluateLevels()
    batchOperationResult.value = result
    batchResultDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    batchReEvaluateLoading.value = false
  }
}

// ============== Tab2: 手动调整 ==============
const adjustPromoterKeyword = ref('')
const promoterCandidates = ref<any[]>([])
const selectedAdjustPromoterId = ref<string>('')
const selectedAdjustPromoter = ref<any>(null)
const adjustSubmitLoading = ref(false)
const adjustListLoading = ref(false)
const pendingReviewList = ref<AdjustRequestItem[]>([])
const searchTimer = ref<any>(null)

const adjustPromoterMetrics = reactive({
  minMonthlyAmount: 0,
  minMonthlyOrders: 0,
  minActiveDays: 0,
  minReputationScore: 0,
})

const adjustForm = reactive({
  targetLevel: '',
  adjustReason: '',
})

const meetsTargetThreshold = computed(() => {
  if (!adjustForm.targetLevel) return false
  return meetsLevelThreshold(adjustForm.targetLevel)
})

function meetsLevelThreshold(level: string) {
  const thresholds = (LEVEL_RULE_THRESHOLDS as any)[level]
  if (!thresholds) return false
  return (
    adjustPromoterMetrics.minMonthlyAmount >= thresholds.minMonthlyAmount &&
    adjustPromoterMetrics.minMonthlyOrders >= thresholds.minMonthlyOrders &&
    adjustPromoterMetrics.minActiveDays >= thresholds.minActiveDays &&
    adjustPromoterMetrics.minReputationScore >= thresholds.minReputationScore
  )
}

function calcProgress(current: number, required: number) {
  if (required <= 0) return 100
  return Math.min(100, Math.round((current / required) * 100))
}

async function searchPromoterCandidates() {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(async () => {
    try {
      const res = await getPromoterList({
        keyword: adjustPromoterKeyword.value,
        page: 1,
        pageSize: 20,
      } as any)
      promoterCandidates.value = res.list || []
    } catch (e) {
      console.error(e)
    }
  }, 300)
}

function handleSelectAdjustPromoter(id: string) {
  const p = promoterCandidates.value.find((x) => x.id === id)
  if (p) {
    selectedAdjustPromoter.value = p
    const level = typeof p.level === 'number' ? `L${p.level}` : p.level
    selectedAdjustPromoter.value.level = level
    adjustPromoterMetrics.minMonthlyAmount = p.totalAmount ?? Math.floor(Math.random() * 300000)
    adjustPromoterMetrics.minMonthlyOrders = p.totalOrders ?? Math.floor(Math.random() * 1000)
    adjustPromoterMetrics.minActiveDays = Math.floor(Math.random() * 28) + 1
    adjustPromoterMetrics.minReputationScore = Math.floor(Math.random() * 20) + 80
    adjustForm.targetLevel = ''
    adjustForm.adjustReason = ''
  }
}

function handleTargetLevelChange() {
  adjustForm.adjustReason = ''
}

async function handleSubmitAdjust() {
  if (!selectedAdjustPromoter.value) return
  if (!adjustForm.targetLevel) return
  if (!meetsTargetThreshold && (adjustForm.adjustReason?.length ?? 0) < 5) {
    ElMessage.warning('请填写至少5个字的调整理由')
    return
  }

  adjustSubmitLoading.value = true
  try {
    await requestManualAdjust({
      promoterId: selectedAdjustPromoter.value.id,
      targetLevel: adjustForm.targetLevel,
      adjustReason: meetsTargetThreshold ? undefined : adjustForm.adjustReason,
    })
    if (meetsTargetThreshold) {
      ElMessage.success('等级调整成功')
    } else {
      ElMessage.success('已提交上级审核，请等待审批')
    }
    adjustForm.targetLevel = ''
    adjustForm.adjustReason = ''
    await fetchPendingReviewList()
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    adjustSubmitLoading.value = false
  }
}

const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewTargetItem = ref<AdjustRequestItem | null>(null)
const reviewForm = reactive({ approveRemark: '' })

async function fetchPendingReviewList() {
  adjustListLoading.value = true
  try {
    const res = await getAdjustRequests({ approveStatus: 0, page: 1, pageSize: 50 })
    pendingReviewList.value = res.list || []
  } catch (e) {
    console.error(e)
  } finally {
    adjustListLoading.value = false
  }
}

function openReviewDialog(item: AdjustRequestItem) {
  reviewTargetItem.value = item
  reviewForm.approveRemark = ''
  reviewDialogVisible.value = true
}

async function handleReview(approved: boolean) {
  if (!reviewTargetItem.value) return
  if (!approved && !reviewForm.approveRemark.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  reviewSubmitting.value = true
  try {
    await reviewAdjustRequest(reviewTargetItem.value.id, {
      approved,
      approveRemark: reviewForm.approveRemark,
    })
    ElMessage.success(approved ? '已通过' : '已驳回')
    reviewDialogVisible.value = false
    await fetchPendingReviewList()
  } catch (e: any) {
    ElMessage.error(e?.message || '审核失败')
  } finally {
    reviewSubmitting.value = false
  }
}

// ============== Tab3: 批量重评 ==============
const batchTableRef = ref<any>()
const batchTableLoading = ref(false)
const batchTableData = ref<any[]>([])
const batchTableTotal = ref(0)
const batchSelectedIds = ref<string[]>([])
const batchResetLoading = ref(false)
const batchResultDialogVisible = ref(false)
const batchOperationResult = ref<BatchReEvaluateResult | null>(null)

const batchPagination = reactive({
  page: 1,
  pageSize: 10,
})

async function fetchBatchTableData() {
  batchTableLoading.value = true
  try {
    const res = await getPromoterList({
      page: batchPagination.page,
      pageSize: batchPagination.pageSize,
    } as any)
    batchTableData.value = (res.list || []).map((p: any, i: number) => ({
      ...p,
      code: `P${String(10000 + i).padStart(5, '0')}`,
      level: typeof p.level === 'number' ? `L${p.level}` : p.level,
      minMonthlyAmount: p.totalAmount ?? Math.floor(Math.random() * 500000),
      minMonthlyOrders: p.totalOrders ?? Math.floor(Math.random() * 2000),
      minActiveDays: Math.floor(Math.random() * 28) + 1,
      minReputationScore: Math.floor(Math.random() * 20) + 80,
    }))
    batchTableTotal.value = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    batchTableLoading.value = false
  }
}

function isRowSelectable(row: any) {
  const lvl = typeof row.level === 'number' ? row.level : Number(String(row.level).replace('L', ''))
  return lvl < 5
}

function isLowPerformance(row: any) {
  return (
    (row.minMonthlyOrders ?? 0) < LOW_PERFORMANCE_THRESHOLD.minOrders ||
    (row.minMonthlyAmount ?? 0) < LOW_PERFORMANCE_THRESHOLD.minAmount
  )
}

function handleBatchSelectionChange(selection: any[]) {
  batchSelectedIds.value = selection.map((s) => String(s.id))
}

async function handleBatchReEvaluate() {
  await ElMessageBox.confirm(
    '将对全部推客按照当前等级规则进行重新评级，是否继续？',
    '全量重评确认',
    { type: 'warning', confirmButtonText: '开始重评', cancelButtonText: '取消' }
  )

  batchReEvaluateLoading.value = true
  try {
    const result = await batchReEvaluateLevels()
    batchOperationResult.value = result
    batchResultDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '重评失败')
  } finally {
    batchReEvaluateLoading.value = false
  }
}

async function handleBatchReset() {
  if (batchSelectedIds.value.length === 0) return
  await ElMessageBox.confirm(
    `将选中的 ${batchSelectedIds.value.length} 个推客重置为 L1，是否继续？`,
    '批量重置确认',
    { type: 'warning', confirmButtonText: '确认重置', cancelButtonText: '取消' }
  )

  batchResetLoading.value = true
  try {
    const result = await batchResetLevels(batchSelectedIds.value, 'L1')
    batchOperationResult.value = result
    batchResultDialogVisible.value = true
    batchSelectedIds.value = []
    batchTableRef.value?.clearSelection()
    await fetchBatchTableData()
  } catch (e: any) {
    ElMessage.error(e?.message || '重置失败')
  } finally {
    batchResetLoading.value = false
  }
}

// ============== Tab4: 变更溯源 ==============
const traceSearchKeyword = ref('')
const tracePromoterOptions = ref<any[]>([])
const selectedTracePromoterId = ref<string>('')
const selectedTracePromoter = ref<any>(null)
const changeLogsLoading = ref(false)
const changeLogs = ref<LevelChangeLogItem[]>([])
const changeLogsTotal = ref(0)
const iterationStats = ref<IterationStats>({
  distribution: {},
  totalChangeEvents: 0,
  totalChanges: 0,
  avgIterationsPerPromoter: 0,
  anomaliesCount: 0,
  totalPromoters: 0,
})

const tracePagination = reactive({
  page: 1,
  pageSize: 10,
})

async function handleTraceSearch() {
  try {
    const res = await getPromoterList({
      keyword: traceSearchKeyword.value,
      page: 1,
      pageSize: 20,
    } as any)
    tracePromoterOptions.value = (res.list || []).map((p: any) => ({
      ...p,
      level: typeof p.level === 'number' ? `L${p.level}` : p.level,
    }))
    if (tracePromoterOptions.value.length === 1) {
      selectedTracePromoterId.value = tracePromoterOptions.value[0].id
      handleSelectTracePromoter(selectedTracePromoterId.value)
    }
  } catch (e) {
    console.error(e)
  }
}

function handleSelectTracePromoter(id: string) {
  const p = tracePromoterOptions.value.find((x) => x.id === id)
  if (p) {
    selectedTracePromoter.value = p
    tracePagination.page = 1
    fetchChangeLogs()
    fetchIterationStats()
  }
}

async function fetchChangeLogs() {
  if (!selectedTracePromoter.value) return
  changeLogsLoading.value = true
  try {
    const res = await getLevelChangeLogs(selectedTracePromoter.value.id, tracePagination)
    changeLogs.value = res.list || []
    changeLogsTotal.value = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    changeLogsLoading.value = false
  }
}

async function fetchIterationStats() {
  try {
    const stats = await getIterationStatistics()
    iterationStats.value = stats
  } catch (e) {
    iterationStats.value = {
      distribution: { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 },
      totalChangeEvents: 0,
      totalChanges: 0,
      avgIterationsPerPromoter: 0,
      anomaliesCount: 0,
      totalPromoters: 0,
    }
  }
}

onMounted(async () => {
  await fetchLevelRules()
  await fetchPendingReviewList()
  await fetchBatchTableData()
})
</script>

<style scoped lang="scss">
.level-system-page {
  padding: 0;

  .shake-input {
    animation: shake 0.3s;
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-4px);
    }
    75% {
      transform: translateX(4px);
    }
  }

  .danger-input :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
}

.level-system-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

// ========== Tab1 等级规则 ==========
.rules-section {
  .rules-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    .rules-tip {
      color: #909399;
      font-size: 13px;
    }
  }

  .level-cards {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .level-card {
    flex: 1;
    min-width: 200px;
    max-width: 260px;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #ebeef5;
    cursor: pointer;
    transition: all 0.3s;
    background: #fff;
    position: relative;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    &.card-editing {
      box-shadow: 0 0 0 2px #409eff;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .edit-icon {
        opacity: 0;
        transition: opacity 0.2s;
        color: #909399;
        font-size: 16px;
      }
    }

    &:hover .edit-icon {
      opacity: 1;
    }

    &.level-l1 {
      border-top: 4px solid #909399;
    }
    &.level-l2 {
      border-top: 4px solid #409eff;
    }
    &.level-l3 {
      border-top: 4px solid #67c23a;
    }
    &.level-l4 {
      border-top: 4px solid #e6a23c;
    }
    &.level-l5 {
      border-top: 4px solid #f56c6c;
      background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
    }
  }

  .card-thresholds {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;

    .threshold-item {
      .threshold-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 2px;
      }
      .threshold-value {
        font-weight: 600;
        font-size: 14px;
        color: #303133;
      }
    }
  }

  .card-benefits-preview {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding-top: 12px;
    border-top: 1px dashed #ebeef5;
    align-items: center;

    .more-benefits {
      font-size: 12px;
      color: #409eff;
      margin-left: auto;
    }
  }
}

.benefits-popover {
  .popover-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #303133;
  }

  .highlight-value {
    color: #f56c6c;
    font-weight: 600;
  }
}

// ========== Tab2 手动调整 ==========
.adjust-card {
  min-height: 600px;

  .card-section-title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 15px;
    color: #303133;
    margin-bottom: 16px;
    gap: 6px;
  }
}

.promoter-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.selected-promoter-info {
  .promoter-basic {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 16px;

    .promoter-meta {
      margin-left: 12px;

      .promoter-name {
        font-weight: 600;
        font-size: 15px;
      }

      .promoter-sub {
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .metrics-section {
    margin-bottom: 20px;

    .metrics-title {
      font-weight: 600;
      margin-bottom: 10px;
      color: #303133;
    }

    .metrics-row {
      .metric-card {
        padding: 14px;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        text-align: center;

        .metric-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: #303133;
        }
      }
    }
  }

  .threshold-progress-section {
    margin-bottom: 20px;

    .threshold-progress-title {
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
    }

    .progress-list {
      .progress-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 6px;
        margin-bottom: 8px;
        background: #fafafa;

        .progress-level-tag {
          width: 48px;
          flex-shrink: 0;
        }

        .progress-bars {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;

          .progress-field {
            .field-name {
              font-size: 11px;
              color: #909399;
              margin-bottom: 2px;
              display: block;
            }
          }
        }

        .progress-status {
          width: 68px;
          text-align: right;
          flex-shrink: 0;
        }
      }
    }
  }

  .adjust-form-section {
    padding: 16px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #d9ecff;

    .adjust-form-title {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #409eff;
    }
  }
}

.pending-review-list {
  .review-item {
    padding: 14px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      background: #f0f9ff;
    }

    .review-item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;

      .review-applicant {
        font-weight: 600;
        color: #303133;
      }

      .review-time {
        color: #909399;
      }
    }

    .review-item-body {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;

      .review-level-change {
        display: flex;
        align-items: center;
        gap: 6px;

        .arrow-icon {
          color: #909399;
          font-size: 14px;
        }
      }
    }

    .review-item-reason {
      font-size: 12px;
      color: #606266;
      padding-top: 6px;
      border-top: 1px dashed #ebeef5;
    }
  }
}

// ========== Tab3 批量重评 ==========
.batch-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  .batch-tip {
    font-size: 13px;
    color: #909399;
  }
}

.batch-result-stats {
  margin-bottom: 16px;

  .result-stat {
    text-align: center;
    padding: 16px;
    border-radius: 8px;
    background: #f5f7fa;

    .result-stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
    }

    .result-stat-label {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    &.total {
      background: #ecf5ff;
      .result-stat-value { color: #409eff; }
    }

    &.regraded {
      background: #f0f9eb;
      .result-stat-value { color: #67c23a; }
    }

    &.skipped {
      background: #fdf6ec;
      .result-stat-value { color: #e6a23c; }
    }

    &.failed {
      background: #fef0f0;
      .result-stat-value { color: #f56c6c; }
    }
  }
}

.batch-result-detail {
  .detail-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #303133;
  }
}

// ========== Tab4 变更溯源 ==========
.trace-search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .trace-title {
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #303133;
  }
}

.trace-stats-row {
  margin-bottom: 8px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid #ebeef5;
    background: #fff;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-right: 14px;
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.2;
        color: #303133;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }

      .stat-distribution-tags {
        margin-bottom: 2px;
        line-height: 1.6;

        :deep(.el-tag) {
          margin-right: 4px;
          margin-bottom: 2px;
        }
      }
    }

    &.stat-change {
      .stat-icon { background: #ecf5ff; color: #409eff; }
    }

    &.stat-iteration {
      .stat-icon { background: #f0f9eb; color: #67c23a; }
    }

    &.stat-anomaly {
      .stat-icon { background: #fef0f0; color: #f56c6c; }
    }

    &.stat-distribution {
      .stat-icon { background: #fdf6ec; color: #e6a23c; }
    }
  }
}

.trace-promoter-info {
  display: flex;
  align-items: center;
  padding: 14px;
  background: #f5f7fa;
  border-radius: 8px;

  .trace-promoter-name {
    font-weight: 600;
    font-size: 15px;
  }

  .trace-promoter-sub {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.timeline-item-card {
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  background: #fff;

  &.anomaly-card {
    border-color: #fbc4c4;
    background: #fef0f0;

    .anomaly-flag {
      color: #f56c6c;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .timeline-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;

    .level-change-arrow {
      display: flex;
      align-items: center;
      gap: 4px;

      .arrow {
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .timeline-meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }

  .timeline-reason {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    font-size: 13px;
    color: #606266;
    padding: 6px 0;
    margin-bottom: 4px;
  }

  .timeline-compliance {
    padding-top: 8px;
    border-top: 1px dashed #ebeef5;
    font-size: 12px;

    .compliance-label {
      color: #909399;
      margin-right: 4px;
    }
  }
}

.form-tip {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

