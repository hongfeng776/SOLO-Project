<template>
  <div class="risk-control-page">
    <el-card shadow="never" class="tabs-card">
      <el-tabs v-model="activeTab" class="risk-tabs" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in PROMOTER_RISK_TABS"
          :key="tab.value"
          :name="tab.value"
        >
          <template #label>
            <el-icon><component :is="tab.icon" /></el-icon>
            {{ tab.label }}
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <div v-show="activeTab === 'control'" style="margin-top: 16px;">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon><UserFilled /></el-icon>
                推客选择
              </div>
            </template>
            <el-input
              v-model="promoterSearchKeyword"
              placeholder="搜索推客姓名/手机号/编号"
              clearable
              :prefix-icon="Search"
              style="width: 100%"
              @keyup.enter="searchPromoter"
              @clear="clearPromoterSearch"
            />
            <el-button
              type="primary"
              :icon="Search"
              class="scale-btn"
              style="width: 100%; margin-top: 12px;"
              @click="searchPromoter"
            >
              搜索
            </el-button>

            <div v-if="searchedPromoterList.length > 0" class="promoter-list">
              <div
                v-for="p in searchedPromoterList"
                :key="p.id"
                class="promoter-item"
                :class="{ active: selectedPromoter?.id === p.id }"
                @click="selectPromoter(p)"
              >
                <el-avatar :size="36" :src="p.avatar || undefined">
                  {{ p.name?.charAt(0) || 'U' }}
                </el-avatar>
                <div class="promoter-info">
                  <div class="promoter-name">{{ p.name }}</div>
                  <div class="promoter-sub">{{ p.phone }} | {{ (p as any).code || p.id }}</div>
                </div>
              </div>
            </div>

            <div v-if="selectedPromoter" class="profile-section">
              <el-divider content-position="left">
                <span class="section-title"><el-icon><WarningFilled /></el-icon> 风险画像</span>
              </el-divider>

              <div class="risk-score-section">
                <div class="risk-score-label">风险评分</div>
                <el-progress
                  type="dashboard"
                  :percentage="riskProfile?.riskScore || 0"
                  :color="getRiskScoreColor(riskProfile?.riskScore || 0)"
                  :stroke-width="12"
                  :width="140"
                />
                <div class="risk-score-value" :style="{ color: getRiskScoreColor(riskProfile?.riskScore || 0) }">
                  {{ riskProfile?.riskScore || 0 }} 分
                </div>
              </div>

              <div class="risk-status-section">
                <div class="status-label">当前风控状态</div>
                <el-tag
                  :type="(RISK_CONTROL_STATUS_MAP[riskProfile?.riskControlStatus ?? 0]?.type as any) || 'success'"
                  size="large"
                  effect="dark"
                  :style="{ background: getRiskStatusGradient(riskProfile?.riskControlStatus ?? 0) }"
                >
                  {{ RISK_CONTROL_STATUS_MAP[riskProfile?.riskControlStatus ?? 0]?.label || '正常' }}
                </el-tag>
              </div>

              <div class="permission-matrix">
                <div class="matrix-title">权限矩阵</div>
                <el-row :gutter="8">
                  <el-col :span="12" v-for="(label, key) in RISK_PERMISSION_LABELS" :key="key">
                    <div class="permission-item" :class="{ disabled: !(riskProfile?.permissions as any)?.[key] }">
                      <el-icon :size="16">{{ (riskProfile?.permissions as any)?.[key] ? 'Check' : 'CloseBold' }}</el-icon>
                      <span>{{ label }}</span>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <div class="behavior-stats">
                <div class="stats-title">近30天行为统计</div>
                <el-row :gutter="8">
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-value">{{ riskProfile?.behaviorCount30Days || 0 }}</div>
                      <div class="stat-label">行为总数</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item warning">
                      <div class="stat-value">{{ riskProfile?.recentWarnings?.length || 0 }}</div>
                      <div class="stat-label">预警数</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item danger">
                      <div class="stat-value">{{ (riskProfile?.riskControlStatus ?? 0) > 0 ? 1 : 0 }}</div>
                      <div class="stat-label">风控次数</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>

            <el-empty v-else-if="promoterSearched && searchedPromoterList.length === 0" description="未找到匹配的推客" />
            <el-empty v-else description="请搜索并选择推客查看风险画像" />
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card shadow="never">
            <template #header>
              <div class="card-header-with-actions">
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  风控记录
                  <span v-if="selectedPromoter" class="header-sub"> - {{ selectedPromoter.name }}</span>
                </div>
                <el-button
                  type="primary"
                  :icon="Plus"
                  class="scale-btn"
                  :disabled="!selectedPromoter || (riskProfile?.riskControlStatus ?? 0) > 0"
                  @click="openMarkRiskDialog"
                >
                  标记风控
                </el-button>
              </div>
            </template>

            <el-alert
              v-if="(riskProfile?.riskControlStatus ?? 0) > 0"
              title="当前用户处于风控状态，禁止叠加新的风控标记"
              type="warning"
              :closable="false"
              style="margin-bottom: 16px;"
            />

            <BaseTable
              :data="riskRecordList"
              :loading="riskRecordLoading"
              :total="riskRecordTotal"
              :page="riskRecordPagination.page"
              :page-size="riskRecordPagination.pageSize"
              stripe
              @page-change="handleRiskRecordPageChange"
              @size-change="handleRiskRecordSizeChange"
              @row-dblclick="handleRiskRecordDblClick"
            >
              <el-table-column prop="id" label="编号" width="80" align="center" />
              <el-table-column label="风险等级" width="110" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="(RISK_LEVEL_MAP[(row as any).riskLevel]?.type as any) || 'info'"
                    size="small"
                    effect="dark"
                    :style="{ background: RISK_LEVEL_MAP[(row as any).riskLevel]?.color || '' }"
                  >
                    {{ RISK_LEVEL_MAP[(row as any).riskLevel]?.label || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="风险类型" width="110" align="center">
                <template #default="{ row }">
                  {{ RISK_TYPE_MAP[(row as any).riskType] || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="riskTitle" label="标题" min-width="150" show-overflow-tooltip />
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="(row as any).isActive ? 'danger' : 'success'" size="small">
                    {{ (row as any).isActive ? '生效中' : '已解除' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operatorName" label="操作人" width="100" />
              <el-table-column prop="createdAt" label="标记时间" width="170">
                <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
              </el-table-column>
              <el-table-column prop="expireAt" label="到期时间" width="170">
                <template #default="{ row }">{{ (row as any).expireAt ? formatDateTime((row as any).expireAt) : '永久' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    class="scale-btn"
                    :icon="Edit"
                    :disabled="!(row as any).isActive"
                    @click="openEditRiskDialog(row as any)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    class="scale-btn"
                    :icon="CloseBold"
                    :disabled="!(row as any).isActive"
                    @click="handleCancelRisk(row as any)"
                  >
                    解除
                  </el-button>
                </template>
              </el-table-column>
            </BaseTable>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div v-show="activeTab === 'release'" style="margin-top: 16px;">
      <el-card shadow="never">
        <template #header>
          <div class="card-header-with-actions">
            <div class="card-header">
              <el-icon><WarningFilled /></el-icon>
              待解除风控列表（生效中）
            </div>
            <el-button :icon="Refresh" class="scale-btn" @click="fetchActiveRiskList">刷新</el-button>
          </div>
        </template>

        <BaseTable
          :data="activeRiskList"
          :loading="activeRiskLoading"
          :total="activeRiskTotal"
          :page="activeRiskPagination.page"
          :page-size="activeRiskPagination.pageSize"
          stripe
          @page-change="handleActiveRiskPageChange"
          @size-change="handleActiveRiskSizeChange"
          @row-dblclick="handleActiveRiskDblClick"
        >
          <el-table-column prop="id" label="编号" width="80" align="center" />
          <el-table-column label="推客信息" min-width="180">
            <template #default="{ row }">
              <div class="promoter-mini-info">
                <el-avatar :size="32">{{ (row as any).promoter?.name?.charAt(0) || 'U' }}</el-avatar>
                <div style="margin-left: 8px;">
                  <div>{{ (row as any).promoter?.name || '-' }}</div>
                  <div class="text-secondary" style="font-size: 12px;">
                    {{ (row as any).promoter?.phone || '-' }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag
                :type="(RISK_LEVEL_MAP[(row as any).riskLevel]?.type as any) || 'info'"
                size="small"
                effect="dark"
                :style="{ background: RISK_LEVEL_MAP[(row as any).riskLevel]?.color || '' }"
              >
                {{ RISK_LEVEL_MAP[(row as any).riskLevel]?.label || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险类型" width="110" align="center">
            <template #default="{ row }">
              {{ RISK_TYPE_MAP[(row as any).riskType] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="riskTitle" label="标题" min-width="150" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="标记时间" width="170">
            <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
          </el-table-column>
          <el-table-column label="异常数据" width="180" align="center">
            <template #default="{ row }">
              <div class="abnormal-badges">
                <el-tag v-if="(row as any).abnormalOrders7Days > 0" type="danger" size="small">
                  7天异常单 {{ (row as any).abnormalOrders7Days }}
                </el-tag>
                <el-tag v-if="(row as any).complaints30Days > 0" type="warning" size="small">
                  30天投诉 {{ (row as any).complaints30Days }}
                </el-tag>
                <el-tag v-if="!(row as any).abnormalOrders7Days && !(row as any).complaints30Days" type="success" size="small">
                  已清零
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="success"
                link
                size="small"
                class="scale-btn"
                :icon="CircleCheck"
                @click="openReleaseDialog(row as any)"
              >
                申请解除
              </el-button>
            </template>
          </el-table-column>
        </BaseTable>
      </el-card>

      <el-card shadow="never" style="margin-top: 16px;">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            待审核解除申请
          </div>
        </template>

        <BaseTable
          :data="pendingReleaseList"
          :loading="pendingReleaseLoading"
          :total="pendingReleaseTotal"
          :page="pendingReleasePagination.page"
          :page-size="pendingReleasePagination.pageSize"
          stripe
          @page-change="handlePendingReleasePageChange"
          @size-change="handlePendingReleaseSizeChange"
          @row-dblclick="handlePendingReleaseDblClick"
        >
          <el-table-column prop="id" label="编号" width="80" align="center" />
          <el-table-column label="申请人" width="100">
            <template #default="{ row }">{{ (row as any).applicantName || '-' }}</template>
          </el-table-column>
          <el-table-column label="风险等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag
                :type="(RISK_LEVEL_MAP[(row as any).riskRecord?.riskLevel]?.type as any) || 'info'"
                size="small"
                effect="dark"
                :style="{ background: RISK_LEVEL_MAP[(row as any).riskRecord?.riskLevel]?.color || '' }"
              >
                {{ RISK_LEVEL_MAP[(row as any).riskRecord?.riskLevel]?.label || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="releaseReason" label="解除理由" min-width="150" show-overflow-tooltip />
          <el-table-column label="异常数据" width="180" align="center">
            <template #default="{ row }">
              <el-tag :type="(row as any).abnormalDataCleared ? 'success' : 'warning'" size="small">
                {{ (row as any).abnormalDataCleared ? '已清零' : '未清零' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="恢复阶段" width="120" align="center">
            <template #default="{ row }">
              {{ RISK_RELEASE_STAGES[(row as any).restoreStage] || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="申请时间" width="170">
            <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                class="scale-btn"
                :icon="View"
                @click="openReviewDialog(row as any)"
              >
                审核
              </el-button>
            </template>
          </el-table-column>
        </BaseTable>
      </el-card>
    </div>

    <div v-show="activeTab === 'batch'" style="margin-top: 16px;">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Operation /></el-icon>
            批量风控处理
          </div>
        </template>

        <el-form :inline="true" :model="batchQueryParams" class="search-form">
          <el-form-item label="风险等级">
            <el-select
              v-model="batchQueryParams.riskLevel"
              placeholder="全部"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in RISK_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="风险类型">
            <el-select
              v-model="batchQueryParams.riskType"
              placeholder="全部"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in RISK_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="风控状态">
            <el-select
              v-model="batchQueryParams.controlStatus"
              placeholder="全部"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in RISK_CONTROL_STATUS_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="batchQueryParams.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 280px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" class="scale-btn" @click="handleBatchSearch">搜索</el-button>
            <el-button :icon="RefreshRight" class="scale-btn" @click="handleBatchReset">重置</el-button>
          </el-form-item>
        </el-form>

        <BaseBatchOperation
          :selected-count="batchSelectedIds.length"
          @clear="handleBatchClearSelection"
          style="margin-top: 16px;"
        >
          <el-button
            type="primary"
            size="small"
            class="scale-btn"
            :icon="Plus"
            :disabled="batchSelectedIds.length === 0"
            @click="openBatchMarkDialog"
          >
            批量标记风控
          </el-button>
          <el-button
            type="danger"
            size="small"
            class="scale-btn"
            :icon="CloseBold"
            :disabled="batchSelectedIds.length === 0"
            @click="handleBatchCancelRisk"
          >
            批量解除风控
          </el-button>
        </BaseBatchOperation>

        <BaseTable
          :data="batchList"
          :loading="batchLoading"
          :total="batchTotal"
          :page="batchPagination.page"
          :page-size="batchPagination.pageSize"
          show-selection
          stripe
          @selection-change="handleBatchSelectionChange"
          @page-change="handleBatchPageChange"
          @size-change="handleBatchSizeChange"
          @row-dblclick="handleBatchRowDblClick"
        >
          <el-table-column prop="promoterCode" label="推客编号" width="100" align="center" />
          <el-table-column label="推客信息" min-width="180">
            <template #default="{ row }">
              <div class="promoter-mini-info">
                <el-avatar :size="32">{{ (row as any).promoterName?.charAt(0) || 'U' }}</el-avatar>
                <div style="margin-left: 8px;">
                  <div>{{ (row as any).promoterName || '-' }}</div>
                  <div class="text-secondary" style="font-size: 12px;">
                    {{ (row as any).promoterPhone || '-' }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="当前风控状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="(RISK_CONTROL_STATUS_MAP[(row as any).controlStatus ?? 0]?.type as any) || 'success'" size="small">
                {{ RISK_CONTROL_STATUS_MAP[(row as any).controlStatus ?? 0]?.label || '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险类型" width="110" align="center">
            <template #default="{ row }">
              {{ (row as any).riskType ? RISK_TYPE_MAP[(row as any).riskType] : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="异常订单数" width="110" align="center">
            <template #default="{ row }">
              <span :class="{ 'text-danger': (row as any).abnormalOrderCount > 0 }">
                {{ (row as any).abnormalOrderCount || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="投诉数" width="90" align="center">
            <template #default="{ row }">
              <span :class="{ 'text-warning': (row as any).complaintCount > 0 }">
                {{ (row as any).complaintCount || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="是否核心推客" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="(row as any).isCorePromoter" type="warning" size="small" effect="dark">核心推客</el-tag>
              <span v-else class="text-secondary">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                class="scale-btn"
                :icon="Edit"
                @click="openEditRiskDialog((row as any).activeRiskRecord || { promoterId: (row as any).promoterId })"
              >
                编辑
              </el-button>
            </template>
          </el-table-column>
        </BaseTable>
      </el-card>
    </div>

    <div v-show="activeTab === 'trace'" style="margin-top: 16px;">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Connection /></el-icon>
            行为溯源
          </div>
        </template>

        <div class="trace-search-bar">
          <el-input
            v-model="traceSearchPhone"
            placeholder="手机号精准检索"
            clearable
            :prefix-icon="Iphone"
            style="width: 200px"
            @keyup.enter="handleTraceSearch"
          />
          <el-input
            v-model="traceSearchIdCard"
            placeholder="身份证号精准检索"
            clearable
            :prefix-icon="Postcard"
            style="width: 240px; margin-left: 8px;"
            @keyup.enter="handleTraceSearch"
          />
          <el-input
            v-model="traceSearchCode"
            placeholder="推客编号精准检索"
            clearable
            :prefix-icon="Reading"
            style="width: 200px; margin-left: 8px;"
            @keyup.enter="handleTraceSearch"
          />
          <el-button type="primary" class="scale-btn" style="margin-left: 8px;" :icon="Search" @click="handleTraceSearch">
            搜索
          </el-button>
        </div>

        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="18">
            <div v-if="traceSelectedPromoter">
              <el-card shadow="never" class="trace-info-card">
                <div class="trace-promoter-header">
                  <el-avatar :size="56" :src="traceSelectedPromoter.avatar || undefined">
                    {{ traceSelectedPromoter.name?.charAt(0) || 'U' }}
                  </el-avatar>
                  <div style="margin-left: 16px; flex: 1;">
                    <div class="trace-promoter-name">
                      {{ traceSelectedPromoter.name }}
                      <el-tag
                        v-if="(traceProfile?.riskControlStatus ?? 0) > 0"
                        :type="(RISK_CONTROL_STATUS_MAP[traceProfile?.riskControlStatus ?? 0]?.type as any) || 'warning'"
                        size="small"
                        effect="dark"
                        style="margin-left: 8px;"
                        :style="{ background: getRiskStatusGradient(traceProfile?.riskControlStatus ?? 0) }"
                      >
                        {{ RISK_CONTROL_STATUS_MAP[traceProfile?.riskControlStatus ?? 0]?.label }}
                      </el-tag>
                      <el-tag v-else type="success" size="small" effect="dark" style="margin-left: 8px;">
                        正常
                      </el-tag>
                    </div>
                    <div class="trace-promoter-sub">
                      编号: {{ (traceSelectedPromoter as any).code || traceSelectedPromoter.id }} | 手机号: {{ traceSelectedPromoter.phone }}
                    </div>
                  </div>
                  <el-button :icon="Document" class="scale-btn" @click="openFullTraceDialog">
                    完整溯源档案
                  </el-button>
                </div>
                <el-row :gutter="16" style="margin-top: 16px;">
                  <el-col :span="6">
                    <div class="trace-stat-item">
                      <div class="trace-stat-label">风险评分</div>
                      <div class="trace-stat-value" :style="{ color: getRiskScoreColor(traceProfile?.riskScore || 0) }">
                        {{ traceProfile?.riskScore || 0 }}
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="trace-stat-item">
                      <div class="trace-stat-label">近30天行为数</div>
                      <div class="trace-stat-value">{{ traceProfile?.behaviorCount30Days || 0 }}</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="trace-stat-item warning">
                      <div class="trace-stat-label">预警数</div>
                      <div class="trace-stat-value">{{ traceProfile?.recentWarnings?.length || 0 }}</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="trace-stat-item danger">
                      <div class="trace-stat-label">风控次数</div>
                      <div class="trace-stat-value">{{ traceRiskCount }}</div>
                    </div>
                  </el-col>
                </el-row>
              </el-card>

              <el-card shadow="never" style="margin-top: 16px;">
                <template #header>
                  <div class="card-header">
                    <el-icon><DataLine /></el-icon>
                    行为轨迹
                  </div>
                </template>

                <BaseTable
                  :data="behaviorList"
                  :loading="behaviorLoading"
                  :total="behaviorTotal"
                  :page="behaviorPagination.page"
                  :page-size="behaviorPagination.pageSize"
                  stripe
                  @page-change="handleBehaviorPageChange"
                  @size-change="handleBehaviorSizeChange"
                >
                  <el-table-column prop="createdAt" label="时间" width="170">
                    <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
                  </el-table-column>
                  <el-table-column label="行为类型" width="120" align="center">
                    <template #default="{ row }">
                      <el-tag
                        :type="(row as any).riskFlagged ? 'danger' : 'info'"
                        size="small"
                        :class="{ 'risk-tag': (row as any).riskFlagged }"
                      >
                        <el-icon v-if="(row as any).riskFlagged"><WarningFilled /></el-icon>
                        {{ getBehaviorTypeLabel((row as any).behaviorType) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="ipAddress" label="IP地址" width="130" />
                  <el-table-column prop="deviceId" label="设备ID" width="130" show-overflow-tooltip />
                  <el-table-column prop="location" label="位置" width="150" show-overflow-tooltip />
                  <el-table-column prop="orderId" label="关联订单" width="120" />
                  <el-table-column label="金额" width="100" align="right">
                    <template #default="{ row }">
                      <span v-if="(row as any).amount">¥{{ formatMoney((row as any).amount) }}</span>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="风险标记" width="110" align="center">
                    <template #default="{ row }">
                      <span v-if="(row as any).riskFlagged" class="risk-flag">
                        <el-icon><WarningFilled /></el-icon>
                        {{ RISK_TYPE_MAP[(row as any).riskType] || '风险' }}
                      </span>
                      <span v-else class="text-secondary">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="风险分数" width="90" align="center">
                    <template #default="{ row }">
                      <span
                        :class="{
                          'text-danger': (row as any).riskScore >= 70,
                          'text-warning': (row as any).riskScore >= 40 && (row as any).riskScore < 70,
                        }"
                      >
                        {{ (row as any).riskScore || 0 }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="违规场景" width="150" align="center">
                    <template #default="{ row }">
                      <div v-if="(row as any).violationTags?.length > 0" class="violation-tags">
                        <el-tag
                          v-for="tag in (row as any).violationTags"
                          :key="tag"
                          type="danger"
                          size="small"
                          effect="dark"
                          style="margin-right: 4px; margin-bottom: 4px;"
                        >
                          {{ getViolationTagLabel(tag) }}
                        </el-tag>
                      </div>
                      <span v-else class="text-secondary">-</span>
                    </template>
                  </el-table-column>
                </BaseTable>
              </el-card>
            </div>

            <el-empty v-else description="请搜索并选择推客查看行为轨迹" />
          </el-col>

          <el-col :span="6">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><BellFilled /></el-icon>
                  高频风险预警
                  <el-tag type="danger" size="small" effect="dark" style="margin-left: 8px;">TOP 10</el-tag>
                </div>
              </template>

              <div class="high-frequency-list">
                <div
                  v-for="(item, index) in highFrequencyList"
                  :key="item.promoterId"
                  class="high-frequency-item"
                  @click="selectHighFrequencyPromoter(item)"
                >
                  <div class="rank-badge" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
                  <el-avatar :size="36">{{ item.promoterName?.charAt(0) || 'U' }}</el-avatar>
                  <div class="hf-info">
                    <div class="hf-name">{{ item.promoterName }}</div>
                    <div class="hf-phone">{{ item.promoterPhone }}</div>
                  </div>
                  <div class="hf-stats">
                    <div class="hf-stat danger">
                      <el-icon><WarningFilled /></el-icon>
                      {{ item.riskCount }} 风控
                    </div>
                    <div class="hf-stat warning">
                      <el-icon><Warning /></el-icon>
                      {{ item.abnormalOrderCount }} 异常单
                    </div>
                    <div class="hf-stat info">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ item.complaintCount }} 投诉
                    </div>
                  </div>
                </div>
              </div>

              <el-empty v-if="highFrequencyList.length === 0" description="暂无高频风险用户" :image-size="80" />
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <el-dialog
      v-model="markRiskDialogVisible"
      :title="editingRiskRecord ? '编辑风控' : '标记风控'"
      width="650px"
      custom-class="zoom-fade-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="markRiskFormRef" :model="markRiskForm" :rules="markRiskRules" label-width="100px">
        <el-form-item label="风险等级" prop="riskLevel">
          <el-radio-group v-model="markRiskForm.riskLevel" @change="handleRiskLevelChange">
            <el-radio-button
              v-for="item in RISK_LEVEL_OPTIONS"
              :key="item.value"
              :value="item.value"
              :style="{ borderColor: item.color }"
            >
              <span :style="{ color: item.color }">{{ item.label }}</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-if="markRiskForm.riskLevel" class="permission-preview">
          <div class="preview-title">
            <el-icon><View /></el-icon>
            该等级管控权限预览
          </div>
          <el-row :gutter="8">
            <el-col :span="12" v-for="(label, key) in RISK_PERMISSION_LABELS" :key="key">
              <div
                class="permission-item"
                :class="{ disabled: !getLevelPermission(markRiskForm.riskLevel, key as string) }"
              >
                <el-icon :size="16">
                  {{ getLevelPermission(markRiskForm.riskLevel, key as string) ? 'Check' : 'CloseBold' }}
                </el-icon>
                <span>{{ label }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <el-form-item label="风险类型" prop="riskType">
          <el-select v-model="markRiskForm.riskType" placeholder="请选择风险类型" style="width: 100%">
            <el-option
              v-for="item in RISK_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="riskTitle">
          <el-input v-model="markRiskForm.riskTitle" placeholder="请输入风控标题" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="描述" prop="riskDescription">
          <el-input
            v-model="markRiskForm.riskDescription"
            type="textarea"
            :rows="3"
            placeholder="请详细描述风险情况"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="证据上传">
          <el-upload
            v-model:file-list="evidenceFileList"
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="9"
            :on-success="handleEvidenceUploadSuccess"
            :on-remove="handleEvidenceUploadRemove"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="到期时间">
          <el-date-picker
            v-model="markRiskForm.expireAt"
            type="datetime"
            placeholder="选择到期时间（不选则永久）"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="markRiskDialogVisible = false">取消</el-button>
        <el-button type="primary" class="scale-btn" :loading="markRiskSubmitting" @click="submitMarkRisk">
          {{ editingRiskRecord ? '保存修改' : '确认标记' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="releaseDialogVisible"
      title="申请解除风控"
      width="600px"
      custom-class="zoom-fade-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="releaseTargetRisk" class="release-risk-info">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="推客姓名">
            {{ releaseTargetRisk.promoter?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag
              :type="(RISK_LEVEL_MAP[releaseTargetRisk.riskLevel]?.type as any) || 'info'"
              size="small"
              effect="dark"
              :style="{ background: RISK_LEVEL_MAP[releaseTargetRisk.riskLevel]?.color || '' }"
            >
              {{ RISK_LEVEL_MAP[releaseTargetRisk.riskLevel]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险类型">
            {{ RISK_TYPE_MAP[releaseTargetRisk.riskType] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="风险标题">{{ releaseTargetRisk.riskTitle }}</el-descriptions-item>
          <el-descriptions-item label="标记时间">{{ formatDateTime(releaseTargetRisk.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="!releaseAbnormalDataCleared"
          title="异常数据未清零，需选择部分恢复阶段"
          type="warning"
          :closable="false"
          style="margin-top: 16px;"
        />
      </div>

      <el-form ref="releaseFormRef" :model="releaseForm" :rules="releaseRules" label-width="100px" style="margin-top: 16px;">
        <el-form-item label="解除理由" prop="releaseReason">
          <el-input
            v-model="releaseForm.releaseReason"
            type="textarea"
            :rows="3"
            placeholder="请输入解除理由（至少10字）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="证明材料">
          <el-upload
            v-model:file-list="proofFileList"
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="9"
            :on-success="handleProofUploadSuccess"
            :on-remove="handleProofUploadRemove"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="整改说明" prop="rectificationDesc">
          <el-input
            v-model="releaseForm.rectificationDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入整改说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item
          v-if="!releaseAbnormalDataCleared"
          label="恢复阶段"
          prop="restoreStage"
        >
          <el-select v-model="releaseForm.restoreStage" placeholder="请选择恢复阶段" style="width: 100%">
            <el-option
              v-for="(stage, index) in RISK_RELEASE_STAGES"
              :key="index"
              :label="stage"
              :value="index"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="releaseDialogVisible = false">取消</el-button>
        <el-button type="primary" class="scale-btn" :loading="releaseSubmitting" @click="submitRelease">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      title="审核解除申请"
      width="700px"
      custom-class="zoom-fade-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="reviewTarget">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申请人">{{ reviewTarget.applicantName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDateTime(reviewTarget.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="解除理由" :span="2">
            {{ reviewTarget.releaseReason }}
          </el-descriptions-item>
          <el-descriptions-item label="整改说明" :span="2">
            {{ reviewTarget.rectificationDesc || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="异常数据清零">
            <el-tag :type="reviewTarget.abnormalDataCleared ? 'success' : 'warning'" size="small">
              {{ reviewTarget.abnormalDataCleared ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="恢复阶段">
            {{ RISK_RELEASE_STAGES[reviewTarget.restoreStage] || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>恢复阶段进度</el-divider>

        <div class="restore-stages">
          <div
            v-for="(stage, index) in RISK_RELEASE_STAGES"
            :key="index"
            class="stage-item"
            :class="{
              completed: index < reviewTarget.restoreStage,
              current: index === reviewTarget.restoreStage,
            }"
          >
            <div class="stage-circle">
              <el-icon v-if="index < reviewTarget.restoreStage"><Check /></el-icon>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="stage-label">{{ stage }}</div>
            <div v-if="index < RISK_RELEASE_STAGES.length - 1" class="stage-line" />
          </div>
        </div>

        <el-divider>整改数据校验结果</el-divider>

        <div class="verify-results">
          <div class="verify-item">
            <el-icon :class="(reviewTarget as any).verify7DayOrders ? 'success' : 'warning'">
              <component :is="(reviewTarget as any).verify7DayOrders ? CircleCheck : WarningFilled" />
            </el-icon>
            <span>近7天异常订单：{{ (reviewTarget as any).verify7DayOrders ? '已清零' : '仍有异常' }}</span>
          </div>
          <div class="verify-item">
            <el-icon :class="(reviewTarget as any).verify30DayComplaints ? 'success' : 'warning'">
              <component :is="(reviewTarget as any).verify30DayComplaints ? CircleCheck : WarningFilled" />
            </el-icon>
            <span>近30天投诉：{{ (reviewTarget as any).verify30DayComplaints ? '已清零' : '仍有投诉' }}</span>
          </div>
          <div class="verify-item">
            <el-icon :class="(reviewTarget as any).verifyRectification ? 'success' : 'info'">
              <component :is="(reviewTarget as any).verifyRectification ? CircleCheck : InfoFilled" />
            </el-icon>
            <span>整改措施：{{ (reviewTarget as any).verifyRectification ? '已完成' : '待确认' }}</span>
          </div>
        </div>

        <el-form ref="reviewFormRef" :model="reviewForm" label-width="100px" style="margin-top: 16px;">
          <el-form-item label="审核备注">
            <el-input
              v-model="reviewForm.verifyRemark"
              type="textarea"
              :rows="2"
              placeholder="请输入审核备注（驳回时必填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="danger" class="scale-btn" :loading="reviewSubmitting" @click="submitReview(false)">
          驳回
        </el-button>
        <el-button type="success" class="scale-btn" :loading="reviewSubmitting" @click="submitReview(true)">
          通过
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchMarkDialogVisible"
      title="批量标记风控"
      width="600px"
      custom-class="zoom-fade-dialog"
      :close-on-click-modal="false"
    >
      <div class="batch-mark-info">
        <el-alert
          :title="`已选择 ${batchSelectedIds.length} 个推客，系统将自动识别风险类型`"
          type="info"
          :closable="false"
        />
        <el-alert
          v-if="corePromoterInBatch > 0"
          :title="`其中 ${corePromoterInBatch} 个核心推客将被跳过，禁止批量打标`"
          type="warning"
          :closable="false"
          style="margin-top: 8px;"
        />
      </div>

      <el-form ref="batchMarkFormRef" :model="batchMarkForm" :rules="batchMarkRules" label-width="100px" style="margin-top: 16px;">
        <el-form-item label="风险等级" prop="riskLevel">
          <el-radio-group v-model="batchMarkForm.riskLevel">
            <el-radio-button
              v-for="item in RISK_LEVEL_OPTIONS"
              :key="item.value"
              :value="item.value"
              :style="{ borderColor: item.color }"
            >
              <span :style="{ color: item.color }">{{ item.label }}</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="风险类型" prop="riskType">
          <el-select v-model="batchMarkForm.riskType" placeholder="请选择风险类型（选OTHER时将自动归类）" style="width: 100%">
            <el-option
              v-for="item in RISK_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label + (item.value === 'other' ? '（自动归类）' : '')"
              :value="item.value"
            />
          </el-select>
          <div v-if="batchMarkForm.riskType === 'other'" class="auto-classify-tip">
            <el-icon><InfoFilled /></el-icon>
            选择OTHER时，系统将根据异常订单数/投诉数自动归类风险类型
          </div>
        </el-form-item>

        <el-form-item label="标题" prop="riskTitle">
          <el-input v-model="batchMarkForm.riskTitle" placeholder="请输入风控标题" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="batchMarkForm.riskDescription"
            type="textarea"
            :rows="2"
            placeholder="请详细描述风险情况"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="到期时间">
          <el-date-picker
            v-model="batchMarkForm.expireAt"
            type="datetime"
            placeholder="选择到期时间（不选则永久）"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchMarkDialogVisible = false">取消</el-button>
        <el-button type="primary" class="scale-btn" :loading="batchMarkSubmitting" @click="submitBatchMark">
          确认批量标记
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchResultDialogVisible"
      title="批量处理结果"
      width="700px"
      custom-class="zoom-fade-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="batchResult">
        <el-row :gutter="12" class="batch-result-stats">
          <el-col :span="6">
            <div class="result-stat total">
              <div class="result-stat-value">{{ batchResult.total }}</div>
              <div class="result-stat-label">总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat success">
              <div class="result-stat-value">{{ batchResult.success }}</div>
              <div class="result-stat-label">成功</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat skipped">
              <div class="result-stat-value">{{ batchResult.skipped }}</div>
              <div class="result-stat-label">跳过</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat failed">
              <div class="result-stat-value">{{ batchResult.failed }}</div>
              <div class="result-stat-label">失败</div>
            </div>
          </el-col>
        </el-row>

        <div class="batch-result-detail">
          <div class="detail-title">处理明细</div>
          <el-table :data="batchResult.details" border stripe max-height="350">
            <el-table-column prop="name" label="推客姓名" width="100" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  v-if="(row as any).status === 'success'"
                  type="success"
                  size="small"
                >成功</el-tag>
                <el-tag
                  v-else-if="(row as any).status === 'skipped'"
                  type="warning"
                  size="small"
                >跳过</el-tag>
                <el-tag
                  v-else
                  type="danger"
                  size="small"
                >失败</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="说明" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>

        <div class="batch-result-actions">
          <el-button :icon="Download" class="scale-btn" @click="downloadBatchReport">
            下载风控处理报表
          </el-button>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" class="scale-btn" @click="confirmBatchResult">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="fullTraceDialogVisible"
      title="完整风控溯源档案"
      width="900px"
      custom-class="zoom-fade-dialog"
    >
      <div v-if="traceSelectedPromoter">
        <el-tabs v-model="fullTraceActiveTab">
          <el-tab-pane label="风控记录" name="risk">
            <el-table
              :data="fullTraceRiskList"
              v-loading="fullTraceRiskLoading"
              border
              stripe
              max-height="500"
            >
              <el-table-column label="风险等级" width="110" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="(RISK_LEVEL_MAP[(row as any).riskLevel]?.type as any) || 'info'"
                    size="small"
                    effect="dark"
                    :style="{ background: RISK_LEVEL_MAP[(row as any).riskLevel]?.color || '' }"
                  >
                    {{ RISK_LEVEL_MAP[(row as any).riskLevel]?.label || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="风险类型" width="110" align="center">
                <template #default="{ row }">
                  {{ RISK_TYPE_MAP[(row as any).riskType] || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="riskTitle" label="标题" min-width="150" />
              <el-table-column prop="operatorName" label="操作人" width="100" />
              <el-table-column prop="createdAt" label="标记时间" width="170">
                <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="(row as any).isActive ? 'danger' : 'success'" size="small">
                    {{ (row as any).isActive ? '生效中' : '已解除' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="行为轨迹" name="behavior">
            <el-table
              :data="fullTraceBehaviorList"
              v-loading="fullTraceBehaviorLoading"
              border
              stripe
              max-height="500"
            >
              <el-table-column prop="createdAt" label="时间" width="170">
                <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
              </el-table-column>
              <el-table-column label="行为类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="(row as any).riskFlagged ? 'danger' : 'info'" size="small">
                    {{ getBehaviorTypeLabel((row as any).behaviorType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="ipAddress" label="IP" width="130" />
              <el-table-column prop="location" label="位置" width="150" />
              <el-table-column label="风险标记" width="100" align="center">
                <template #default="{ row }">
                  <el-icon v-if="(row as any).riskFlagged" class="text-danger"><WarningFilled /></el-icon>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="预警记录" name="warning">
            <el-timeline v-loading="fullTraceWarningLoading">
              <el-timeline-item
                v-for="item in fullTraceWarningList"
                :key="item.id"
                :timestamp="formatDateTime(item.createdAt)"
                :type="(RISK_WARNING_LEVEL_MAP[item.warningLevel]?.type as any) || 'info'"
              >
                <el-card shadow="never" class="warning-card">
                  <div class="warning-header">
                    <el-tag
                      :type="(RISK_WARNING_LEVEL_MAP[item.warningLevel]?.type as any) || 'info'"
                      size="small"
                      effect="dark"
                    >
                      {{ RISK_WARNING_LEVEL_MAP[item.warningLevel]?.label || '-' }}
                    </el-tag>
                    <span class="warning-title">{{ item.warningTitle }}</span>
                    <el-tag
                      v-if="item.isHandled"
                      type="success"
                      size="small"
                      style="margin-left: auto;"
                    >已处理</el-tag>
                    <el-tag v-else type="warning" size="small" style="margin-left: auto;">待处理</el-tag>
                  </div>
                  <div class="warning-desc">{{ item.warningDesc || '-' }}</div>
                  <div v-if="item.handleRemark" class="warning-handle">
                    <span class="handle-label">处理备注：</span>
                    {{ item.handleRemark }}
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="fullTraceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadFile } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Download,
  View,
  Check,
  CloseBold,
  Document,
  Operation,
  Connection,
  UserFilled,
  WarningFilled,
  Refresh,
  CircleCheck,
  Clock,
  DataLine,
  BellFilled,
  Warning,
  ChatDotRound,
  InfoFilled,

  Iphone,
  Postcard,
  Reading,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import {
  RISK_LEVEL_OPTIONS,
  RISK_LEVEL_MAP,
  RISK_TYPE_OPTIONS,
  RISK_TYPE_MAP,
  RISK_CONTROL_STATUS_OPTIONS,
  RISK_CONTROL_STATUS_MAP,

  RISK_WARNING_LEVEL_MAP,
  RISK_RELEASE_STAGES,
  RISK_PERMISSION_LABELS,
  PROMOTER_RISK_TABS,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import Storage from '@/utils/storage'
import {
  getRiskList,
  getRiskDetail,
  markRisk,
  updateRisk,
  cancelRisk,
  getRiskProfile,
  getReleaseList,
  submitRelease as apiSubmitRelease,
  reviewRelease,
  batchMarkRisk,
  batchCancelRisk,
  getBehaviorTrace,
  getWarningList,
  getRiskStatistics,
  type RiskRecordItem,
  type RiskProfile,
  type RiskReleaseItem,
  type RiskBehaviorItem,
  type RiskWarningItem,
  type MarkRiskSubmit,
  type BatchRiskResult,
} from '@/api/promoter-risk'
import { getPromoterList, type PromoterItem } from '@/api/promoter'

const activeTab = ref<string>('control')

function handleTabChange(tab: string) {
  activeTab.value = tab
  if (tab === 'release') {
    fetchActiveRiskList()
    fetchPendingReleaseList()
  } else if (tab === 'batch') {
    fetchBatchList()
  } else if (tab === 'trace') {
    fetchHighFrequencyList()
  }
}

const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${Storage.get('token') || ''}`,
}))

function getRiskScoreColor(score: number): string {
  if (score >= 70) return '#c0392b'
  if (score >= 40) return '#f56c6c'
  if (score >= 20) return '#e6a23c'
  return '#67c23a'
}

function getRiskStatusGradient(status: number): string {
  if (status === 1) return 'linear-gradient(135deg, #e6a23c, #f39c12)'
  if (status === 2) return 'linear-gradient(135deg, #f56c6c, #e74c3c)'
  if (status === 3) return 'linear-gradient(135deg, #c0392b, #922b21)'
  return 'linear-gradient(135deg, #67c23a, #27ae60)'
}

function getLevelPermission(level: string, permission: string): boolean {
  const permissions: Record<string, Record<string, boolean>> = {
    mild: { canPromote: true, canJoinActivity: false, canWithdraw: true, canLogin: true },
    moderate: { canPromote: false, canJoinActivity: false, canWithdraw: false, canLogin: true },
    severe: { canPromote: false, canJoinActivity: false, canWithdraw: false, canLogin: false },
  }
  return permissions[level]?.[permission] ?? true
}

function getBehaviorTypeLabel(type: string): string {
  const map: Record<string, string> = {
    login: '登录',
    promote: '推广',
    order_create: '下单',
    order_cancel: '取消订单',
    withdraw: '提现',
    profile_update: '资料修改',
    activity_join: '参与活动',
    api_call: 'API调用',
  }
  return map[type] || type
}

function getViolationTagLabel(tag: string): string {
  const map: Record<string, string> = {
    brush_order: '刷单',
    fake_order: '虚假订单',
    abnormal_promotion: '异常推广',
    complaint: '投诉',
    fraud: '欺诈',
  }
  return map[tag] || tag
}

const promoterSearchKeyword = ref('')
const promoterSearched = ref(false)
const searchedPromoterList = ref<PromoterItem[]>([])
const selectedPromoter = ref<PromoterItem | null>(null)
const riskProfile = ref<RiskProfile | null>(null)

async function searchPromoter() {
  if (!promoterSearchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  promoterSearched.value = true
  try {
    const res = await getPromoterList({
      keyword: promoterSearchKeyword.value,
      page: 1,
      pageSize: 20,
    } as any)
    searchedPromoterList.value = res.list
  } catch (error) {
    console.error('Search promoter error:', error)
    ElMessage.error('搜索失败')
  }
}

function clearPromoterSearch() {
  promoterSearched.value = false
  searchedPromoterList.value = []
  selectedPromoter.value = null
  riskProfile.value = null
}

async function selectPromoter(promoter: PromoterItem) {
  selectedPromoter.value = promoter
  try {
    riskProfile.value = await getRiskProfile(String(promoter.id))
  } catch (error) {
    console.error('Get risk profile error:', error)
    ElMessage.error('获取风险画像失败')
  }
  fetchRiskRecordList()
}

const {
  loading: riskRecordLoading,
  dataList: riskRecordList,
  total: riskRecordTotal,
  pagination: riskRecordPagination,
  fetchData: fetchRiskRecordList,
  handlePageChange: handleRiskRecordPageChange,
  handleSizeChange: handleRiskRecordSizeChange,
} = useTable<RiskRecordItem, any>({
  fetchApi: (params) => getRiskList({
    ...params,
    promoterId: selectedPromoter.value?.id,
  }),
  immediate: false,
})

function handleRiskRecordDblClick(row: any) {
  if (row.isActive) {
    openEditRiskDialog(row)
  }
}

const editingRiskRecord = ref<RiskRecordItem | null>(null)
const markRiskDialogVisible = ref(false)
const markRiskSubmitting = ref(false)
const markRiskFormRef = ref<FormInstance>()
const evidenceFileList = ref<UploadFile[]>([])
const markRiskForm = reactive<MarkRiskSubmit>({
  promoterId: '',
  riskLevel: '',
  riskType: '',
  riskTitle: '',
  riskDescription: '',
  riskEvidence: [],
  expireAt: undefined,
})

const markRiskRules = {
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  riskType: [{ required: true, message: '请选择风险类型', trigger: 'change' }],
  riskTitle: [{ required: true, message: '请输入风控标题', trigger: 'blur' }],
}

function handleRiskLevelChange() {
}

function handleEvidenceUploadSuccess(response: any) {
  if (response?.url) {
    markRiskForm.riskEvidence?.push(response.url)
  }
}

function handleEvidenceUploadRemove(file: UploadFile) {
  const fileResponse = file.response as { url?: string }
  if (fileResponse?.url) {
    const index = markRiskForm.riskEvidence?.indexOf(fileResponse.url)
    if (index !== undefined && index > -1) {
      markRiskForm.riskEvidence?.splice(index, 1)
    }
  }
}

function openMarkRiskDialog() {
  if (!selectedPromoter.value) return
  editingRiskRecord.value = null
  Object.assign(markRiskForm, {
    promoterId: String(selectedPromoter.value.id),
    riskLevel: '',
    riskType: '',
    riskTitle: '',
    riskDescription: '',
    riskEvidence: [],
    expireAt: undefined,
  })
  evidenceFileList.value = []
  markRiskDialogVisible.value = true
}

async function openEditRiskDialog(row: RiskRecordItem) {
  try {
    const detail = row.id ? await getRiskDetail(String(row.id)) : row
    editingRiskRecord.value = detail
    Object.assign(markRiskForm, {
      promoterId: detail.promoterId,
      riskLevel: detail.riskLevel,
      riskType: detail.riskType,
      riskTitle: detail.riskTitle,
      riskDescription: detail.riskDescription || '',
      riskEvidence: detail.riskEvidence || [],
      expireAt: detail.expireAt,
    })
    evidenceFileList.value = (detail.riskEvidence || []).map((url, index) => ({
      uid: index,
      name: `证据${index + 1}`,
      url,
      status: 'success',
    })) as any
    markRiskDialogVisible.value = true
  } catch (error) {
    console.error('Get risk detail error:', error)
    ElMessage.error('获取风控详情失败')
  }
}

async function submitMarkRisk() {
  if (!markRiskFormRef.value) return
  try {
    await markRiskFormRef.value.validate()
  } catch {
    return
  }
  markRiskSubmitting.value = true
  try {
    if (editingRiskRecord.value?.id) {
      await updateRisk(String(editingRiskRecord.value.id), markRiskForm)
      ElMessage.success('修改成功')
    } else {
      await markRisk(markRiskForm)
      ElMessage.success('标记成功')
    }
    markRiskDialogVisible.value = false
    if (selectedPromoter.value) {
      riskProfile.value = await getRiskProfile(String(selectedPromoter.value.id))
    }
    fetchRiskRecordList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    markRiskSubmitting.value = false
  }
}

async function handleCancelRisk(row: RiskRecordItem) {
  try {
    await ElMessageBox.confirm('确定要解除该风控标记吗？', '确认解除', {
      type: 'warning',
    })
    await cancelRisk(String(row.id))
    ElMessage.success('解除成功')
    if (selectedPromoter.value) {
      riskProfile.value = await getRiskProfile(String(selectedPromoter.value.id))
    }
    fetchRiskRecordList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel risk error:', error)
      ElMessage.error('解除失败')
    }
  }
}

const {
  loading: activeRiskLoading,
  dataList: activeRiskList,
  total: activeRiskTotal,
  pagination: activeRiskPagination,
  fetchData: fetchActiveRiskList,
  handlePageChange: handleActiveRiskPageChange,
  handleSizeChange: handleActiveRiskSizeChange,
} = useTable<RiskRecordItem, any>({
  fetchApi: (params) => getRiskList({
    ...params,
    isActive: true,
  }),
  immediate: false,
})

function handleActiveRiskDblClick(row: any) {
  openReleaseDialog(row)
}

const releaseTargetRisk = ref<RiskRecordItem | null>(null)
const releaseDialogVisible = ref(false)
const releaseSubmitting = ref(false)
const releaseFormRef = ref<FormInstance>()
const proofFileList = ref<UploadFile[]>([])
const releaseAbnormalDataCleared = ref(true)
const releaseForm = reactive({
  promoterId: '',
  riskRecordId: '',
  releaseReason: '',
  proofMaterials: [] as string[],
  rectificationDesc: '',
  restoreStage: 0,
})

const releaseRules = {
  releaseReason: [
    { required: true, message: '请输入解除理由', trigger: 'blur' },
    { min: 10, message: '解除理由至少10个字', trigger: 'blur' },
  ],
  rectificationDesc: [{ required: true, message: '请输入整改说明', trigger: 'blur' }],
  restoreStage: [{ required: true, message: '请选择恢复阶段', trigger: 'change' }],
}

function openReleaseDialog(row: RiskRecordItem) {
  releaseTargetRisk.value = row
  releaseAbnormalDataCleared.value = !(row as any).abnormalOrders7Days && !(row as any).complaints30Days
  Object.assign(releaseForm, {
    promoterId: row.promoterId,
    riskRecordId: row.id,
    releaseReason: '',
    proofMaterials: [],
    rectificationDesc: '',
    restoreStage: releaseAbnormalDataCleared.value ? 5 : 0,
  })
  proofFileList.value = []
  releaseDialogVisible.value = true
}

function handleProofUploadSuccess(response: any) {
  if (response?.url) {
    releaseForm.proofMaterials.push(response.url)
  }
}

function handleProofUploadRemove(file: UploadFile) {
  const fileResponse = file.response as { url?: string }
  if (fileResponse?.url) {
    const index = releaseForm.proofMaterials.indexOf(fileResponse.url)
    if (index > -1) {
      releaseForm.proofMaterials.splice(index, 1)
    }
  }
}

async function submitRelease() {
  if (!releaseFormRef.value) return
  try {
    await releaseFormRef.value.validate()
  } catch {
    return
  }
  if (!releaseAbnormalDataCleared.value && releaseForm.restoreStage === 0) {
    ElMessage.warning('异常数据未清零，请选择恢复阶段')
    return
  }
  releaseSubmitting.value = true
  try {
    await apiSubmitRelease(releaseForm)
    ElMessage.success('申请已提交')
    releaseDialogVisible.value = false
    fetchActiveRiskList()
    fetchPendingReleaseList()
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败')
  } finally {
    releaseSubmitting.value = false
  }
}

const {
  loading: pendingReleaseLoading,
  dataList: pendingReleaseList,
  total: pendingReleaseTotal,
  pagination: pendingReleasePagination,
  fetchData: fetchPendingReleaseList,
  handlePageChange: handlePendingReleasePageChange,
  handleSizeChange: handlePendingReleaseSizeChange,
} = useTable<RiskReleaseItem, any>({
  fetchApi: (params) => getReleaseList({
    ...params,
    verifyStatus: 0,
  }),
  immediate: false,
})

function handlePendingReleaseDblClick(row: any) {
  openReviewDialog(row)
}

const reviewTarget = ref<RiskReleaseItem | null>(null)
const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewFormRef = ref<FormInstance>()
const reviewForm = reactive({
  verifyRemark: '',
})

function openReviewDialog(row: RiskReleaseItem) {
  reviewTarget.value = {
    ...row,
    verify7DayOrders: !(row as any).abnormalOrders7Days,
    verify30DayComplaints: !(row as any).complaints30Days,
    verifyRectification: !!row.rectificationDesc,
  } as any
  reviewForm.verifyRemark = ''
  reviewDialogVisible.value = true
}

async function submitReview(passed: boolean) {
  if (!reviewTarget.value) return
  if (!passed && !reviewForm.verifyRemark.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  reviewSubmitting.value = true
  try {
    await reviewRelease(String(reviewTarget.value.id), {
      passed,
      verifyRemark: reviewForm.verifyRemark,
      restoreStage: passed ? reviewTarget.value.restoreStage : undefined,
    })
    ElMessage.success(passed ? '审核通过' : '已驳回')
    reviewDialogVisible.value = false
    fetchActiveRiskList()
    fetchPendingReleaseList()
    if (selectedPromoter.value) {
      riskProfile.value = await getRiskProfile(String(selectedPromoter.value.id))
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    reviewSubmitting.value = false
  }
}

const batchQueryParams = reactive({
  riskLevel: undefined as string | undefined,
  riskType: undefined as string | undefined,
  controlStatus: undefined as number | undefined,
  dateRange: undefined as string[] | undefined,
})

const {
  loading: batchLoading,
  dataList: batchList,
  total: batchTotal,
  selectedIds: batchSelectedIds,
  pagination: batchPagination,
  fetchData: fetchBatchList,
  handleSearch: handleBatchSearch,
  handleReset: handleBatchReset,
  handlePageChange: handleBatchPageChange,
  handleSizeChange: handleBatchSizeChange,
  handleSelectionChange: handleBatchSelectionChange,
  clearSelection: handleBatchClearSelection,
} = useTable<any, any>({
  fetchApi: (params) => getRiskList({
    ...params,
    riskLevel: batchQueryParams.riskLevel,
    riskType: batchQueryParams.riskType,
    controlStatus: batchQueryParams.controlStatus,
    startDate: batchQueryParams.dateRange?.[0],
    endDate: batchQueryParams.dateRange?.[1],
  } as any),
  immediate: false,
})

const corePromoterInBatch = computed(() => {
  return batchList.value.filter((item: any) =>
    batchSelectedIds.value.includes(item.promoterId || item.id) && item.isCorePromoter
  ).length
})

function handleBatchRowDblClick(row: any) {
  openEditRiskDialog(row.activeRiskRecord || { promoterId: row.promoterId })
}

const batchMarkDialogVisible = ref(false)
const batchMarkSubmitting = ref(false)
const batchMarkFormRef = ref<FormInstance>()
const batchMarkForm = reactive({
  riskLevel: '',
  riskType: '',
  riskTitle: '',
  riskDescription: '',
  expireAt: undefined as string | undefined,
})

const batchMarkRules = {
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  riskType: [{ required: true, message: '请选择风险类型', trigger: 'change' }],
  riskTitle: [{ required: true, message: '请输入风控标题', trigger: 'blur' }],
}

function openBatchMarkDialog() {
  if (batchSelectedIds.value.length === 0) return
  Object.assign(batchMarkForm, {
    riskLevel: '',
    riskType: '',
    riskTitle: '',
    riskDescription: '',
    expireAt: undefined,
  })
  batchMarkDialogVisible.value = true
}

async function submitBatchMark() {
  if (!batchMarkFormRef.value) return
  try {
    await batchMarkFormRef.value.validate()
  } catch {
    return
  }
  batchMarkSubmitting.value = true
  try {
    const result = await batchMarkRisk({
      ids: batchSelectedIds.value as string[],
      ...batchMarkForm,
    })
    batchResult.value = result
    batchMarkDialogVisible.value = false
    batchResultDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    batchMarkSubmitting.value = false
  }
}

async function handleBatchCancelRisk() {
  if (batchSelectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要批量解除选中的 ${batchSelectedIds.value.length} 个风控标记吗？`,
      '确认批量解除',
      { type: 'warning' }
    )
    const result = await batchCancelRisk(batchSelectedIds.value as string[])
    batchResult.value = result
    batchResultDialogVisible.value = true
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch cancel risk error:', error)
      ElMessage.error('批量解除失败')
    }
  }
}

const batchResultDialogVisible = ref(false)
const batchResult = ref<BatchRiskResult | null>(null)

function downloadBatchReport() {
  ElMessage.info('报表下载功能开发中')
}

function confirmBatchResult() {
  batchResultDialogVisible.value = false
  handleBatchClearSelection()
  fetchBatchList()
}

const traceSearchPhone = ref('')
const traceSearchIdCard = ref('')
const traceSearchCode = ref('')
const traceSelectedPromoter = ref<PromoterItem | null>(null)
const traceProfile = ref<RiskProfile | null>(null)
const traceRiskCount = ref(0)

async function handleTraceSearch() {
  const keyword = traceSearchPhone.value || traceSearchIdCard.value || traceSearchCode.value
  if (!keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  try {
    const res = await getPromoterList({
      keyword,
      page: 1,
      pageSize: 1,
    } as any)
    if (res.list.length > 0) {
      traceSelectedPromoter.value = res.list[0]
      traceProfile.value = await getRiskProfile(String(res.list[0].id))
      const riskRes = await getRiskList({
        promoterId: res.list[0].id,
        page: 1,
        pageSize: 1,
      } as any)
      traceRiskCount.value = riskRes.total
      fetchBehaviorList()
    } else {
      ElMessage.warning('未找到匹配的推客')
      traceSelectedPromoter.value = null
      traceProfile.value = null
    }
  } catch (error) {
    console.error('Trace search error:', error)
    ElMessage.error('搜索失败')
  }
}

const {
  loading: behaviorLoading,
  dataList: behaviorList,
  total: behaviorTotal,
  pagination: behaviorPagination,
  fetchData: fetchBehaviorList,
  handlePageChange: handleBehaviorPageChange,
  handleSizeChange: handleBehaviorSizeChange,
} = useTable<RiskBehaviorItem, any>({
  fetchApi: (params) => getBehaviorTrace(
    String(traceSelectedPromoter.value?.id || ''),
    params
  ),
  immediate: false,
})

const highFrequencyList = ref<any[]>([])

async function fetchHighFrequencyList() {
  try {
    const res = await getRiskStatistics()
    highFrequencyList.value = res.highFrequencyList || []
  } catch (error) {
    console.error('Fetch high frequency error:', error)
  }
}

async function selectHighFrequencyPromoter(item: any) {
  try {
    const res = await getPromoterList({
      keyword: item.promoterPhone,
      page: 1,
      pageSize: 1,
    } as any)
    if (res.list.length > 0) {
      traceSearchPhone.value = item.promoterPhone
      traceSearchIdCard.value = ''
      traceSearchCode.value = ''
      traceSelectedPromoter.value = res.list[0]
      traceProfile.value = await getRiskProfile(String(res.list[0].id))
      const riskRes = await getRiskList({
        promoterId: res.list[0].id,
        page: 1,
        pageSize: 1,
      } as any)
      traceRiskCount.value = riskRes.total
      fetchBehaviorList()
    }
  } catch (error) {
    console.error('Select high frequency promoter error:', error)
    ElMessage.error('查询失败')
  }
}

const fullTraceDialogVisible = ref(false)
const fullTraceActiveTab = ref('risk')
const fullTraceRiskList = ref<RiskRecordItem[]>([])
const fullTraceRiskLoading = ref(false)
const fullTraceBehaviorList = ref<RiskBehaviorItem[]>([])
const fullTraceBehaviorLoading = ref(false)
const fullTraceWarningList = ref<RiskWarningItem[]>([])
const fullTraceWarningLoading = ref(false)

async function openFullTraceDialog() {
  if (!traceSelectedPromoter.value) return
  fullTraceDialogVisible.value = true
  fullTraceActiveTab.value = 'risk'
  fetchFullTraceData()
}

async function fetchFullTraceData() {
  if (!traceSelectedPromoter.value) return
  const promoterId = String(traceSelectedPromoter.value.id)
  
  fullTraceRiskLoading.value = true
  try {
    const res = await getRiskList({ promoterId, page: 1, pageSize: 100 } as any)
    fullTraceRiskList.value = res.list
  } finally {
    fullTraceRiskLoading.value = false
  }

  fullTraceBehaviorLoading.value = true
  try {
    const res = await getBehaviorTrace(promoterId, { page: 1, pageSize: 100 })
    fullTraceBehaviorList.value = res.list
  } finally {
    fullTraceBehaviorLoading.value = false
  }

  fullTraceWarningLoading.value = true
  try {
    const res = await getWarningList({ promoterId, page: 1, pageSize: 100 } as any)
    fullTraceWarningList.value = res.list
  } finally {
    fullTraceWarningLoading.value = false
  }
}

onMounted(() => {
  fetchHighFrequencyList()
})
</script>

<style lang="scss" scoped>
.risk-control-page {
  .tabs-card {
    border-radius: 8px;
  }

  .risk-tabs {
    :deep(.el-tabs__item) {
      font-size: 15px;
      padding: 0 24px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 15px;
    color: $text-primary;

    .el-icon {
      margin-right: 6px;
      color: $primary-color;
    }

    .header-sub {
      font-weight: normal;
      font-size: 14px;
      color: $text-regular;
    }
  }

  .card-header-with-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-weight: 600;
    color: $text-primary;

    .el-icon {
      margin-right: 4px;
    }
  }

  .scale-btn {
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .search-form {
    .el-form-item {
      margin-bottom: 12px;
    }
  }

  .promoter-list {
    margin-top: 16px;
    max-height: 240px;
    overflow-y: auto;
  }

  .promoter-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
    border: 1px solid transparent;

    &:hover {
      background-color: $bg-color;
    }

    &.active {
      background-color: rgba(64, 158, 255, 0.1);
      border-color: $primary-color;
    }

    .promoter-info {
      margin-left: 12px;
      flex: 1;

      .promoter-name {
        font-weight: 500;
        color: $text-primary;
      }

      .promoter-sub {
        font-size: 12px;
        color: $text-secondary;
        margin-top: 2px;
      }
    }
  }

  .profile-section {
    margin-top: 16px;
  }

  .risk-score-section {
    text-align: center;
    padding: 16px 0;

    .risk-score-label {
      font-size: 14px;
      color: $text-regular;
      margin-bottom: 8px;
    }

    .risk-score-value {
      font-size: 24px;
      font-weight: 600;
      margin-top: 8px;
    }
  }

  .risk-status-section {
    text-align: center;
    margin-top: 16px;

    .status-label {
      font-size: 14px;
      color: $text-regular;
      margin-bottom: 8px;
    }
  }

  .permission-matrix {
    margin-top: 20px;

    .matrix-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 12px;
    }
  }

  .permission-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: $bg-color;
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 13px;
    transition: all 0.2s;

    .el-icon {
      margin-right: 6px;
      color: $success-color;
    }

    &.disabled {
      opacity: 0.5;

      .el-icon {
        color: $danger-color;
      }
    }
  }

  .behavior-stats {
    margin-top: 20px;

    .stats-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 12px;
    }
  }

  .stat-item {
    text-align: center;
    padding: 12px 8px;
    background-color: $bg-color;
    border-radius: 8px;

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: $primary-color;
    }

    .stat-label {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 4px;
    }

    &.warning {
      .stat-value {
        color: $warning-color;
      }
    }

    &.danger {
      .stat-value {
        color: $danger-color;
      }
    }
  }

  .promoter-mini-info {
    display: flex;
    align-items: center;
  }

  .text-secondary {
    color: $text-secondary;
  }

  .text-danger {
    color: $danger-color;
  }

  .text-warning {
    color: $warning-color;
  }

  .text-success {
    color: $success-color;
  }

  .abnormal-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
  }

  .trace-search-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .trace-info-card {
    .trace-promoter-header {
      display: flex;
      align-items: center;
    }

    .trace-promoter-name {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }

    .trace-promoter-sub {
      font-size: 13px;
      color: $text-secondary;
      margin-top: 4px;
    }
  }

  .trace-stat-item {
    text-align: center;
    padding: 16px;
    background-color: $bg-color;
    border-radius: 8px;

    .trace-stat-label {
      font-size: 13px;
      color: $text-secondary;
    }

    .trace-stat-value {
      font-size: 24px;
      font-weight: 600;
      margin-top: 8px;
      color: $primary-color;
    }

    &.warning {
      .trace-stat-value {
        color: $warning-color;
      }
    }

    &.danger {
      .trace-stat-value {
        color: $danger-color;
      }
    }
  }

  .risk-tag {
    .el-icon {
      margin-right: 4px;
    }
  }

  .risk-flag {
    color: $danger-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;

    .el-icon {
      margin-right: 2px;
    }
  }

  .violation-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  .high-frequency-list {
    .high-frequency-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid $border-color-lighter;

      &:hover {
        background-color: $bg-color;
        transform: translateX(4px);
      }

      .rank-badge {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: $info-color;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        margin-right: 8px;

        &.rank-1 {
          background: linear-gradient(135deg, #f56c6c, #c0392b);
        }

        &.rank-2 {
          background: linear-gradient(135deg, #e6a23c, #d35400);
        }

        &.rank-3 {
          background: linear-gradient(135deg, #67c23a, #27ae60);
        }
      }

      .hf-info {
        flex: 1;
        margin-left: 8px;

        .hf-name {
          font-weight: 500;
          color: $text-primary;
          font-size: 14px;
        }

        .hf-phone {
          font-size: 12px;
          color: $text-secondary;
          margin-top: 2px;
        }
      }

      .hf-stats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;

        .hf-stat {
          font-size: 11px;
          display: flex;
          align-items: center;
          color: $text-regular;

          .el-icon {
            margin-right: 2px;
          }

          &.danger {
            color: $danger-color;
          }

          &.warning {
            color: $warning-color;
          }

          &.info {
            color: $info-color;
          }
        }
      }
    }
  }

  .permission-preview {
    padding: 16px;
    background-color: $bg-color;
    border-radius: 8px;
    margin-bottom: 16px;

    .preview-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 12px;
      display: flex;
      align-items: center;

      .el-icon {
        margin-right: 4px;
        color: $primary-color;
      }
    }
  }

  .release-risk-info {
    .el-descriptions {
      margin-bottom: 16px;
    }
  }

  .auto-classify-tip {
    font-size: 12px;
    color: $warning-color;
    margin-top: 6px;
    display: flex;
    align-items: center;

    .el-icon {
      margin-right: 4px;
    }
  }

  .restore-stages {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 0;

    .stage-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;

      .stage-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: $border-color-light;
        color: $text-secondary;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        z-index: 1;
        border: 2px solid $border-color;

        .el-icon {
          font-size: 18px;
        }
      }

      .stage-label {
        font-size: 12px;
        color: $text-secondary;
        margin-top: 8px;
        text-align: center;
        max-width: 80px;
      }

      .stage-line {
        position: absolute;
        top: 18px;
        left: 50%;
        width: 100%;
        height: 2px;
        background-color: $border-color-light;
      }

      &.completed {
        .stage-circle {
          background-color: $success-color;
          border-color: $success-color;
          color: white;
        }

        .stage-line {
          background-color: $success-color;
        }

        .stage-label {
          color: $success-color;
        }
      }

      &.current {
        .stage-circle {
          background-color: $primary-color;
          border-color: $primary-color;
          color: white;
          animation: pulse 1.5s infinite;
        }

        .stage-label {
          color: $primary-color;
          font-weight: 500;
        }
      }
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
    }
  }

  .verify-results {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .verify-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      background-color: $bg-color;
      border-radius: 6px;

      .el-icon {
        margin-right: 8px;
        font-size: 18px;

        &.success {
          color: $success-color;
        }

        &.warning {
          color: $warning-color;
        }

        &.info {
          color: $info-color;
        }
      }
    }
  }

  .batch-mark-info {
    .el-alert {
      margin-bottom: 0;
    }
  }

  .batch-result-stats {
    margin-bottom: 16px;

    .result-stat {
      text-align: center;
      padding: 20px;
      border-radius: 8px;

      .result-stat-value {
        font-size: 32px;
        font-weight: 600;
      }

      .result-stat-label {
        font-size: 14px;
        color: $text-secondary;
        margin-top: 4px;
      }

      &.total {
        background-color: rgba(64, 158, 255, 0.1);

        .result-stat-value {
          color: $primary-color;
        }
      }

      &.success {
        background-color: rgba(103, 194, 58, 0.1);

        .result-stat-value {
          color: $success-color;
        }
      }

      &.skipped {
        background-color: rgba(230, 162, 60, 0.1);

        .result-stat-value {
          color: $warning-color;
        }
      }

      &.failed {
        background-color: rgba(245, 108, 108, 0.1);

        .result-stat-value {
          color: $danger-color;
        }
      }
    }
  }

  .batch-result-detail {
    .detail-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 12px;
    }
  }

  .batch-result-actions {
    margin-top: 16px;
    text-align: right;
  }

  .warning-card {
    margin-bottom: 8px;
    border: none;
    background-color: $bg-color;

    .warning-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .warning-title {
        margin-left: 8px;
        font-weight: 500;
        color: $text-primary;
      }
    }

    .warning-desc {
      color: $text-regular;
      font-size: 13px;
    }

    .warning-handle {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed $border-color-light;
      font-size: 12px;
      color: $text-secondary;

      .handle-label {
        color: $text-regular;
        font-weight: 500;
      }
    }
  }

  :deep(.el-table) {
    .el-table__row {
      cursor: pointer;

      &.risk-row {
        background-color: rgba(245, 108, 108, 0.05);
      }
    }
  }
}
</style>
