<template>
  <div class="regularization-page">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="statusTab" size="default" @change="reload">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button :value="RegularizationStatus.PENDING_APPLY">待申请</el-radio-button>
          <el-radio-button :value="RegularizationStatus.APPROVING">审批中</el-radio-button>
          <el-radio-button :value="RegularizationStatus.APPROVED">转正通过</el-radio-button>
          <el-radio-button :value="RegularizationStatus.REJECTED">转正驳回</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" v-ripple @click="handleClick(openForm, 'create')">
          发起转正申请
        </el-button>
        <el-button type="success" :icon="Filter" v-ripple @click="handleClick(openBatchDialog, 'filter')">
          批量筛选到期人员
        </el-button>
        <el-button
          type="warning"
          :icon="Promotion"
          v-ripple
          @click="handleClick(openBatchDialog, 'apply')"
        >
          批量发起申请
        </el-button>
        <el-button
          v-if="isAdmin"
          type="danger"
          :icon="CircleCheck"
          v-ripple
          @click="handleClick(openBatchDialog, 'approve')"
        >
          批量审批
        </el-button>
        <el-button type="primary" plain :icon="DataAnalysis" v-ripple @click="handleClick(openStatsDrawer)">
          通过率统计
        </el-button>
        <el-button type="info" :icon="Refresh" v-ripple :loading="syncLoading" @click="handleClick(handleSyncPending)">
          同步待申请
        </el-button>
      </div>
    </div>

    <el-form :model="searchForm" inline class="search-form" label-width="70px">
      <el-form-item label="姓名">
        <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="工号">
        <el-input v-model="searchForm.employeeNo" placeholder="请输入工号" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="部门">
        <el-input v-model="searchForm.department" placeholder="请输入部门" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="岗位">
        <el-input v-model="searchForm.position" placeholder="请输入岗位" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="入职批次">
        <el-date-picker
          v-model="searchForm.entryBatch"
          type="month"
          placeholder="选择月份"
          value-format="YYYY-MM"
          style="width: 140px"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in RegularizationStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请时间">
        <el-date-picker
          v-model="searchForm.applyTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" v-ripple @click="handleClick(handleSearch)">搜索</el-button>
        <el-button :icon="RefreshLeft" v-ripple @click="handleClick(handleReset)">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-wrapper">
      <el-table
        ref="tableRef"
        :data="tableData"
        :loading="loading"
        :row-class-name="tableRowClassName"
        :header-cell-style="{ height: '60px', background: '#fafafa' }"
        height="600"
        stripe
        border
        class="resizable-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" fixed="left" />
        <el-table-column label="员工信息" min-width="220" fixed="left">
          <template #default="{ row }">
            <div class="employee-cell">
              <el-avatar :size="40" :src="row.avatar" class="employee-avatar">
                {{ (row.employeeName || row.name || '?').charAt(0) }}
              </el-avatar>
              <div class="employee-info">
                <div class="employee-name">{{ row.employeeName || row.name || '-' }}</div>
                <div class="employee-sub">
                  <span>{{ row.employeeNo || '工号未分配' }}</span>
                  <span class="divider">|</span>
                  <span>{{ row.department || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="岗位-职级-批次" min-width="180">
          <template #default="{ row }">
            <div class="dept-card">
              <div class="pos-line">
                <span class="pos-name">{{ row.position || '-' }}</span>
                <el-tag v-if="row.jobLevel" size="small" type="info" class="level-tag">{{ row.jobLevel }}</el-tag>
              </div>
              <div class="batch-line">
                <el-icon><Tickets /></el-icon>
                <span>{{ row.entryBatch || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="试用期进度" min-width="240">
          <template #default="{ row }">
            <div class="probation-cell">
              <div class="date-range">
                {{ formatDate(row.probationStartDate) }} ~ {{ formatDate(row.probationEndDate) }}
              </div>
              <div class="remaining-wrap">
                <el-progress
                  :percentage="getProgressPercent(row)"
                  :status="getProgressStatus(row)"
                  :stroke-width="8"
                  :text-inside="false"
                  style="flex: 1"
                />
                <span
                  class="remaining-days"
                  :class="{ 'expiring-soon': isExpiringSoon(row) }"
                >
                  {{ getRemainingDays(row) }}天
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="考核综合分" min-width="140" align="center">
          <template #default="{ row }">
            <div class="score-cell">
              <div class="comprehensive-score" :class="getScoreClass(row.comprehensiveScore)">
                {{ row.comprehensiveScore !== undefined && row.comprehensiveScore !== null ? row.comprehensiveScore.toFixed(1) : '-' }}
              </div>
              <div v-if="row.recruitmentMatchLevel" class="match-level" :class="'level-' + row.recruitmentMatchLevel">
                适配度 {{ row.recruitmentMatchLevel }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审批进度" min-width="200" align="center">
          <template #default="{ row }">
            <div class="approval-progress">
              <el-steps :active="getApprovalStepIndex(row)" finish-status="success" simple size="small">
                <el-step
                  v-for="(node, idx) in (row.approvalNodes || defaultApprovalNodes)"
                  :key="idx"
                  :status="getStepStatus(row, idx)"
                />
              </el-steps>
              <div class="progress-percent">{{ getApprovalPercent(row) }}%</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" min-width="140" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.currentNode"
              :type="getNodeTagType(row.status)"
              size="default"
              effect="light"
            >
              {{ getCurrentNodeLabel(row) }}
            </el-tag>
            <span v-else class="no-node">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="130" align="center">
          <template #default="{ row }">
            <el-tag
              :type="RegularizationStatusType[row.status as RegularizationStatus]"
              size="default"
              effect="light"
              class="status-tag"
            >
              <el-icon v-if="row.status === RegularizationStatus.PENDING_APPLY"><Clock /></el-icon>
              <el-icon v-else-if="row.status === RegularizationStatus.APPROVING"><Loading /></el-icon>
              <el-icon v-else-if="row.status === RegularizationStatus.APPROVED"><CircleCheckFilled /></el-icon>
              <el-icon v-else-if="row.status === RegularizationStatus.REJECTED"><CircleCloseFilled /></el-icon>
              {{ RegularizationStatusLabel[row.status as RegularizationStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请/审批时间" min-width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-item">
                <span class="time-label">申请:</span>
                <span>{{ formatDateTime(row.applyTime) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">审批:</span>
                <span>{{ formatDateTime(row.finalApproveTime) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="合规性" min-width="110" align="center">
          <template #default="{ row }">
            <el-tooltip
              :content="getComplianceTip(row)"
              placement="top"
            >
              <div class="compliance-cell">
                <el-icon
                  class="compliance-icon"
                  :class="row.complianceChecked ? 'check-pass' : 'check-fail'"
                  size="24"
                >
                  <CircleCheckFilled v-if="row.complianceChecked" />
                  <CircleCloseFilled v-else />
                </el-icon>
                <span class="compliance-label">{{ row.complianceChecked ? '合规' : '待校验' }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleClick(openDetail, row)">详情</el-button>
            <el-button
              v-if="canApprove(row)"
              type="success"
              link
              size="small"
              @click="handleClick(handleApprove, row)"
            >
              审批
            </el-button>
            <el-button
              v-if="row.status === RegularizationStatus.REJECTED"
              type="warning"
              link
              size="small"
              @click="handleClick(handleResubmit, row)"
            >
              重新提交
            </el-button>
            <el-button
              v-if="canReject(row)"
              type="danger"
              link
              size="small"
              @click="handleClick(handleReject, row)"
            >
              驳回
            </el-button>
            <el-button type="info" link size="small" @click="handleClick(openDetail, row)">查看流程</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <div class="summary-card" v-if="statsData">
      <div class="summary-item">
        <span class="summary-label">总体通过率</span>
        <span class="summary-value" :class="getRateClass(statsData.overall.passRate)">
          {{ statsData.overall.passRate.toFixed(1) }}%
        </span>
        <span class="summary-count">
          ({{ statsData.overall.passed }}/{{ statsData.overall.total }})
        </span>
      </div>
      <el-divider direction="vertical" />
      <div class="summary-item">
        <span class="summary-label">审批中</span>
        <span class="summary-value value-blue">
          {{ statsData.overall.approving }}
        </span>
        <span class="summary-count">人</span>
      </div>
      <el-divider direction="vertical" />
      <div class="summary-item">
        <span class="summary-label">已选中</span>
        <span class="summary-value value-orange">
          {{ selectedIds.length }}
        </span>
        <span class="summary-count">人</span>
      </div>
    </div>

    <RegularizationBatchDialog
      v-model:visible="batchDialogVisible"
      :mode="batchDialogMode"
      :selected-items="selectedRows"
      :is-admin="isAdmin"
      @success="handleBatchSuccess"
    />

    <RegularizationDetail
      v-model:visible="detailVisible"
      :regularization-id="detailRegularizationId"
      @action="handleDetailAction"
    />

    <el-drawer
      v-model="statsDrawerVisible"
      title="通过率统计分析"
      size="960px"
      direction="rtl"
      destroy-on-close
    >
      <div class="stats-drawer" v-loading="statsLoading">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span class="card-title">📊 按部门统计</span>
              </template>
              <div class="bar-chart-wrapper">
                <div v-for="(item, index) in statsData?.byDepartment || []" :key="'dept-' + index" class="bar-row">
                  <div class="bar-label" :title="item.name">{{ item.name }}</div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: item.passRate + '%', background: getBarColor(item.passRate) }"
                    ></div>
                    <span class="bar-value">{{ item.passRate.toFixed(1) }}%</span>
                  </div>
                  <div class="bar-count">{{ item.passed }}/{{ item.total }}</div>
                </div>
                <el-empty v-if="!statsData?.byDepartment?.length" description="暂无数据" :image-size="80" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span class="card-title">📊 按岗位统计</span>
              </template>
              <div class="bar-chart-wrapper">
                <div v-for="(item, index) in statsData?.byPosition || []" :key="'pos-' + index" class="bar-row">
                  <div class="bar-label" :title="item.name">{{ item.name || '未分类' }}</div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: item.passRate + '%', background: getBarColor(item.passRate) }"
                    ></div>
                    <span class="bar-value">{{ item.passRate.toFixed(1) }}%</span>
                  </div>
                  <div class="bar-count">{{ item.passed }}/{{ item.total }}</div>
                </div>
                <el-empty v-if="!statsData?.byPosition?.length" description="暂无数据" :image-size="80" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span class="card-title">📊 按入职批次统计</span>
              </template>
              <div class="bar-chart-wrapper">
                <div v-for="(item, index) in statsData?.byEntryBatch || []" :key="'batch-' + index" class="bar-row">
                  <div class="bar-label" :title="item.name">{{ item.name }}</div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: item.passRate + '%', background: getBarColor(item.passRate) }"
                    ></div>
                    <span class="bar-value">{{ item.passRate.toFixed(1) }}%</span>
                  </div>
                  <div class="bar-count">{{ item.passed }}/{{ item.total }}</div>
                </div>
                <el-empty v-if="!statsData?.byEntryBatch?.length" description="暂无数据" :image-size="80" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span class="card-title">📊 按招聘HR统计</span>
              </template>
              <div class="bar-chart-wrapper">
                <div v-for="(item, index) in statsData?.byRecruitmentHr || []" :key="'hr-' + index" class="bar-row">
                  <div class="bar-label" :title="item.name">{{ item.name || '未分配' }}</div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: item.passRate + '%', background: getBarColor(item.passRate) }"
                    ></div>
                    <span class="bar-value">{{ item.passRate.toFixed(1) }}%</span>
                  </div>
                  <div class="bar-count">{{ item.passed }}/{{ item.total }}</div>
                </div>
                <el-empty v-if="!statsData?.byRecruitmentHr?.length" description="暂无数据" :image-size="80" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="24">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span class="card-title">🎯 招聘适配度分布（ABCD等级）</span>
              </template>
              <div class="match-distribution">
                <div
                  v-for="item in statsData?.recruitmentMatchDistribution || []"
                  :key="item.level"
                  class="match-item"
                  :class="'match-' + item.level.toLowerCase()"
                >
                  <div class="match-level-badge">{{ item.level }}</div>
                  <div class="match-bar">
                    <div class="match-bar-fill" :style="{ width: item.percent + '%' }"></div>
                  </div>
                  <div class="match-info">
                    <span class="match-count">{{ item.count }}人</span>
                    <span class="match-percent">{{ item.percent.toFixed(1) }}%</span>
                  </div>
                </div>
                <el-empty v-if="!statsData?.recruitmentMatchDistribution?.length" description="暂无数据" :image-size="60" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import {
  ElMessage, ElMessageBox, ElNotification,
} from 'element-plus';
import {
  Plus, Filter, Promotion, CircleCheck, DataAnalysis, Refresh,
  Search, RefreshLeft, Clock, Loading, CircleCheckFilled, CircleCloseFilled,
  Tickets,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import {
  getRegularizationListApi,
  getRegularizationFullDetailApi,
  approveRegularizationApi,
  rejectRegularizationApi,
  resubmitRegularizationApi,
  syncRegularizationPendingApi,
  getRegularizationStatsApi,
  createRegularizationApi,
  type RegularizationItem,
  type RegularizationListParams,
  RegularizationStatus,
  RegularizationStatusLabel,
  RegularizationStatusType,
  REGULARIZATION_LOCKED_STATUSES,
  EXPIRING_SOON_DAYS,
  type RegularizationStatsData,
  ApprovalNodeType,
  ApprovalNodeTypeLabel,
} from '@/api/regularization';
import { DATE_FORMAT, DATETIME_FORMAT, UserRole } from '@/constants/recruitment';
import { useUserStore } from '@/store/modules/user';
import RegularizationBatchDialog from './RegularizationBatchDialog.vue';
import RegularizationDetail from './RegularizationDetail.vue';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);
const currentUserId = computed(() => userStore.userInfo?.id || 0);

const loading = ref(false);
const syncLoading = ref(false);
const statsLoading = ref(false);
const tableData = ref<RegularizationItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<RegularizationItem[]>([]);
const statusTab = ref<string>('');
const statsData = ref<RegularizationStatsData | null>(null);

const tableRef = ref();

const searchForm = reactive({
  name: '',
  employeeNo: '',
  department: '',
  position: '',
  entryBatch: '' as string,
  status: '' as RegularizationStatus | '',
  applyTimeRange: [] as string[],
});

const clicked = ref(false);

const handleClick = (fn: (...args: any[]) => any, ...args: any[]) => {
  if (clicked.value) return;
  clicked.value = true;
  fn(...args);
  setTimeout(() => {
    clicked.value = false;
  }, 300);
};

const defaultApprovalNodes = [
  { nodeType: ApprovalNodeType.DEPT_HEAD, status: 'pending' },
  { nodeType: ApprovalNodeType.HR, status: 'pending' },
  { nodeType: ApprovalNodeType.HR_DIRECTOR, status: 'pending' },
  { nodeType: ApprovalNodeType.GENERAL_MANAGER, status: 'pending' },
];

const formatDate = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATE_FORMAT);
};

const formatDateTime = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATETIME_FORMAT);
};

const isExpiringSoon = (row: RegularizationItem) => {
  if (!row.probationEndDate) return false;
  if (row.status === RegularizationStatus.APPROVED || row.status === RegularizationStatus.REJECTED) return false;
  const remaining = dayjs(row.probationEndDate).diff(dayjs(), 'day');
  return remaining <= EXPIRING_SOON_DAYS && remaining >= 0;
};

const getRemainingDays = (row: RegularizationItem) => {
  if (!row.probationEndDate) return 0;
  if (row.status === RegularizationStatus.APPROVED || row.status === RegularizationStatus.REJECTED) return 0;
  const remaining = dayjs(row.probationEndDate).diff(dayjs(), 'day');
  return Math.max(remaining, 0);
};

const getProgressPercent = (row: RegularizationItem) => {
  if (!row.probationStartDate || !row.probationEndDate) return 0;
  const start = dayjs(row.probationStartDate);
  const end = dayjs(row.probationEndDate);
  const total = end.diff(start, 'day');
  if (total <= 0) return 0;
  const elapsed = dayjs().diff(start, 'day');
  const percent = Math.round((elapsed / total) * 100);
  return Math.min(Math.max(percent, 0), 100);
};

const getProgressStatus = (row: RegularizationItem) => {
  if (row.status === RegularizationStatus.APPROVED) return 'success';
  if (row.status === RegularizationStatus.REJECTED) return 'exception';
  const percent = getProgressPercent(row);
  if (percent >= 100) return 'exception';
  if (isExpiringSoon(row)) return 'warning';
  return undefined;
};

const getScoreClass = (score?: number) => {
  if (score === undefined || score === null) return '';
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-danger';
};

const getRateClass = (rate: number) => {
  if (rate >= 80) return 'rate-high';
  if (rate >= 60) return 'rate-medium';
  return 'rate-low';
};

const getBarColor = (rate: number) => {
  if (rate >= 80) return '#67c23a';
  if (rate >= 60) return '#409eff';
  if (rate >= 40) return '#e6a23c';
  return '#f56c6c';
};

const getComplianceTip = (row: RegularizationItem) => {
  if (!row.complianceIssues || row.complianceIssues.length === 0) {
    return row.complianceChecked ? '所有合规项已通过' : '未进行合规性校验';
  }
  const failed = row.complianceIssues.filter(i => !i.passed);
  if (failed.length === 0) return '所有合规项已通过';
  return failed.map(f => `${f.label}: ${f.reason || '不通过'}`).join('；');
};

const getApprovalStepIndex = (row: RegularizationItem) => {
  const nodes = row.approvalNodes || defaultApprovalNodes;
  if (row.status === RegularizationStatus.APPROVED) return nodes.length;
  if (row.status === RegularizationStatus.PENDING_APPLY) return 0;
  const currentIdx = nodes.findIndex(n => n.status === 'current');
  if (currentIdx > -1) return currentIdx;
  const approvedCount = nodes.filter(n => n.status === 'approved').length;
  return approvedCount;
};

const getStepStatus = (row: RegularizationItem, idx: number) => {
  const nodes = row.approvalNodes || defaultApprovalNodes;
  const node = nodes[idx];
  if (!node) return '';
  if (node.status === 'approved') return 'success';
  if (node.status === 'rejected') return 'error';
  if (node.status === 'current') return 'process';
  return 'wait';
};

const getApprovalPercent = (row: RegularizationItem) => {
  const nodes = row.approvalNodes || defaultApprovalNodes;
  if (nodes.length === 0) return 0;
  const approved = nodes.filter(n => n.status === 'approved').length;
  return Math.round((approved / nodes.length) * 100);
};

const getCurrentNodeLabel = (row: RegularizationItem) => {
  if (!row.currentNode) return '-';
  return (ApprovalNodeTypeLabel as any)[row.currentNode] || row.currentNodeName || row.currentNode;
};

const getNodeTagType = (status: string) => {
  if (status === RegularizationStatus.APPROVING) return 'warning';
  if (status === RegularizationStatus.APPROVED) return 'success';
  if (status === RegularizationStatus.REJECTED) return 'danger';
  return 'info';
};

const canApprove = (row: RegularizationItem) => {
  if (row.status !== RegularizationStatus.APPROVING) return false;
  if (isAdmin.value) return true;
  return row.currentApproverId === currentUserId.value;
};

const canReject = (row: RegularizationItem) => {
  return canApprove(row);
};

const tableRowClassName = ({ row }: { row: RegularizationItem }) => {
  return selectedIds.value.includes(row.id) ? 'regularization-selected-row' : '';
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: RegularizationListParams = {
      page: page.value,
      pageSize: pageSize.value,
      name: searchForm.name || undefined,
      employeeNo: searchForm.employeeNo || undefined,
      department: searchForm.department || undefined,
      position: searchForm.position || undefined,
      entryBatch: searchForm.entryBatch || undefined,
      status: searchForm.status || statusTab.value || undefined,
    };
    if (searchForm.applyTimeRange?.length === 2) {
      params.applyTimeStart = searchForm.applyTimeRange[0];
      params.applyTimeEnd = searchForm.applyTimeRange[1];
    }
    Object.keys(params).forEach(k => {
      if ((params as any)[k] === undefined || (params as any)[k] === '' || (params as any)[k] === null) {
        delete (params as any)[k];
      }
    });
    const res = await getRegularizationListApi(params);
    tableData.value = (res as any).list || [];
    total.value = (res as any).total || 0;
  } finally {
    loading.value = false;
  }
};

const refreshLocal = (newData: RegularizationItem, op: 'create' | 'update' | 'replace' = 'update') => {
  const idx = tableData.value.findIndex(r => r.id === newData.id);
  if (op === 'create' && idx === -1) {
    tableData.value = [newData, ...tableData.value].slice(0, pageSize.value);
    total.value += 1;
  } else if (idx > -1) {
    if (op === 'replace') {
      tableData.value.splice(idx, 1);
      total.value -= 1;
    } else {
      tableData.value[idx] = { ...tableData.value[idx], ...newData };
    }
  }
};

const reload = () => {
  page.value = 1;
  fetchList();
  fetchStats();
};

const handleSearch = () => {
  page.value = 1;
  fetchList();
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.employeeNo = '';
  searchForm.department = '';
  searchForm.position = '';
  searchForm.entryBatch = '';
  searchForm.status = '';
  searchForm.applyTimeRange = [];
  statusTab.value = '';
  page.value = 1;
  fetchList();
};

const handleSelectionChange = (selection: RegularizationItem[]) => {
  selectedRows.value = selection;
  selectedIds.value = selection.map(s => s.id);
};

const handleSyncPending = async () => {
  syncLoading.value = true;
  try {
    const res = await syncRegularizationPendingApi();
    fetchList();
    ElNotification({
      title: '同步完成',
      message: `已同步 ${res.syncedCount || 0} 条待申请记录`,
      type: 'success',
    });
  } catch (e: any) {
    ElMessage.error(e?.message || '同步失败');
  } finally {
    syncLoading.value = false;
  }
};

const fetchStats = async () => {
  statsLoading.value = true;
  try {
    statsData.value = await getRegularizationStatsApi();
  } catch {
    statsData.value = null;
  } finally {
    statsLoading.value = false;
  }
};

const openForm = async (mode: 'create') => {
  if (mode === 'create') {
    try {
      const { value } = await ElMessageBox.prompt(
        '请输入关联的试用期记录ID以发起转正申请',
        '发起转正申请',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /^\d+$/,
          inputErrorMessage: '请输入有效的数字ID',
          inputPlaceholder: '请输入试用期记录ID',
          type: 'info',
        }
      );
      const probationId = parseInt(value);
      const res = await createRegularizationApi({ probationId });
      ElMessage.success('申请创建成功');
      reload();
      openDetail(res);
    } catch { /* cancel */ }
  }
};

const detailVisible = ref(false);
const detailRegularizationId = ref<number>(0);

const openDetail = (row: RegularizationItem) => {
  detailRegularizationId.value = row.id;
  detailVisible.value = true;
};

const handleDetailAction = async (action: string, row: RegularizationItem) => {
  detailVisible.value = false;
  switch (action) {
    case 'approve':
      handleApprove(row);
      break;
    case 'reject':
      handleReject(row);
      break;
    case 'resubmit':
      handleResubmit(row);
      break;
  }
};

const batchDialogVisible = ref(false);
const batchDialogMode = ref<'filter' | 'apply' | 'approve'>('filter');

const openBatchDialog = (mode: 'filter' | 'apply' | 'approve') => {
  if (mode !== 'filter' && selectedIds.value.length === 0) {
    ElMessage.warning('请先选择转正记录');
    return;
  }
  batchDialogMode.value = mode;
  batchDialogVisible.value = true;
};

const handleBatchSuccess = (msg?: string) => {
  ElNotification({ title: '批量操作完成', message: msg || '操作成功', type: 'success' });
  reload();
};

const handleApprove = async (row: RegularizationItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `确定要通过「${row.employeeName || row.name || '该员工'}」的转正申请吗？`,
      '审批通过',
      {
        confirmButtonText: '确定通过',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入审批意见（可选）',
        type: 'success',
      }
    );
    const res = await approveRegularizationApi(row.id, { comment: value });
    ElMessage.success('审批通过');
    refreshLocal(res as any, 'update');
  } catch { /* cancel */ }
};

const handleReject = async (row: RegularizationItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `确定要驳回「${row.employeeName || row.name || '该员工'}」的转正申请吗？`,
      '审批驳回',
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入驳回原因（必填）',
        type: 'warning',
        inputValidator: (v: string) => !!v?.trim() || '请填写驳回原因',
      }
    );
    const res = await rejectRegularizationApi(row.id, { reason: value });
    ElMessage.success('已驳回');
    refreshLocal(res as any, 'update');
  } catch { /* cancel */ }
};

const handleResubmit = async (row: RegularizationItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `重新提交「${row.employeeName || row.name || '该员工'}」的转正申请`,
      '重新提交',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入申请备注（可选）',
        type: 'info',
      }
    );
    const res = await resubmitRegularizationApi(row.id, { applicationRemark: value });
    ElMessage.success('已重新提交');
    refreshLocal(res as any, 'update');
  } catch { /* cancel */ }
};

const statsDrawerVisible = ref(false);
const openStatsDrawer = () => {
  statsDrawerVisible.value = true;
};

watch(statsDrawerVisible, (val) => {
  if (val) {
    fetchStats();
  }
});

let pollTimer: ReturnType<typeof setInterval> | null = null;

const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const params: RegularizationListParams = {
        page: page.value,
        pageSize: pageSize.value,
        name: searchForm.name || undefined,
        employeeNo: searchForm.employeeNo || undefined,
        department: searchForm.department || undefined,
        position: searchForm.position || undefined,
        entryBatch: searchForm.entryBatch || undefined,
        status: searchForm.status || statusTab.value || undefined,
      };
      if (searchForm.applyTimeRange?.length === 2) {
        params.applyTimeStart = searchForm.applyTimeRange[0];
        params.applyTimeEnd = searchForm.applyTimeRange[1];
      }
      Object.keys(params).forEach(k => {
        if ((params as any)[k] === undefined || (params as any)[k] === '' || (params as any)[k] === null) {
          delete (params as any)[k];
        }
      });
      const res = await getRegularizationListApi(params);
      tableData.value = (res as any).list || [];
      total.value = (res as any).total || 0;
    } catch { /* silent */ }
  }, 60000);
};

const initColumnResize = () => {
  nextTick(() => {
    const ths = document.querySelectorAll('.resizable-table .el-table__header th');
    ths.forEach((th) => {
      const existingHandle = th.querySelector('.resize-handle');
      if (existingHandle) return;
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      th.style.position = 'relative';
      th.appendChild(handle);

      let startX = 0;
      let startWidth = 0;
      let colIndex = -1;

      handle.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        colIndex = Array.from(ths).indexOf(th as HTMLElement);
        const rect = th.getBoundingClientRect();
        startWidth = rect.width;
        handle.classList.add('active');

        const onMouseMove = (moveEvent: MouseEvent) => {
          const diff = moveEvent.clientX - startX;
          const newWidth = Math.max(80, startWidth + diff);
          const colgroup = document.querySelector('.resizable-table colgroup');
          if (colgroup && colIndex >= 0) {
            const cols = colgroup.querySelectorAll('col');
            if (cols[colIndex]) {
              (cols[colIndex] as HTMLElement).style.width = newWidth + 'px';
            }
          }
          (th as HTMLElement).style.width = newWidth + 'px';
        };

        const onMouseUp = () => {
          handle.classList.remove('active');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  });
};

onMounted(() => {
  fetchList();
  fetchStats();
  startPolling();
  initColumnResize();
});

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style lang="scss" scoped>
.regularization-page {
  position: relative;
  padding-bottom: 80px;

  .page-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-left, .toolbar-right {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .search-form {
    margin-bottom: 16px;
  }

  .table-wrapper {
    background: #fff;
    border-radius: 4px;
    padding: 8px;
  }

  :deep(.el-table .regularization-selected-row) {
    --el-table-tr-bg-color: #e6f7ff !important;
    td {
      background-color: #e6f7ff !important;
    }
  }

  :deep(.el-table th) {
    position: relative;
    .resize-handle {
      position: absolute;
      top: 0;
      right: 0;
      width: 6px;
      height: 100%;
      cursor: col-resize;
      z-index: 10;
      background: transparent;
      transition: background 0.2s;

      &:hover, &.active {
        background: #409eff;
      }
    }
  }

  .employee-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .employee-avatar {
      background: linear-gradient(135deg, #409eff, #66b1ff);
      color: #fff;
      font-weight: 600;
      flex-shrink: 0;
    }

    .employee-info {
      min-width: 0;
      .employee-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
      .employee-sub {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 6px;
        .divider {
          color: #dcdfe6;
        }
      }
    }
  }

  .dept-card {
    background: #f5f7fa;
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.8;

    .pos-line {
      display: flex;
      align-items: center;
      gap: 6px;
      .pos-name {
        font-weight: 600;
        color: #303133;
      }
      .level-tag {
        flex-shrink: 0;
      }
    }
    .batch-line {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #909399;
    }
  }

  .probation-cell {
    font-size: 12px;

    .date-range {
      color: #606266;
      margin-bottom: 8px;
    }

    .remaining-wrap {
      display: flex;
      align-items: center;
      gap: 10px;

      .remaining-days {
        font-weight: 600;
        font-size: 14px;
        color: #303133;
        flex-shrink: 0;

        &.expiring-soon {
          color: #f56c6c;
          animation: blink 1s ease-in-out infinite;
        }
      }
    }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .score-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .comprehensive-score {
      font-size: 22px;
      font-weight: 700;

      &.score-excellent { color: #67c23a; }
      &.score-high { color: #409eff; }
      &.score-medium { color: #e6a23c; }
      &.score-danger { color: #f56c6c; }
    }

    .match-level {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 600;

      &.level-A { background: #f0f9eb; color: #67c23a; }
      &.level-B { background: #ecf5ff; color: #409eff; }
      &.level-C { background: #fdf6ec; color: #e6a23c; }
      &.level-D { background: #fef0f0; color: #f56c6c; }
    }
  }

  .approval-progress {
    padding: 0 8px;

    :deep(.el-steps) {
      margin-bottom: 4px;
    }

    .progress-percent {
      font-size: 12px;
      color: #909399;
      font-weight: 500;
    }
  }

  .no-node {
    color: #c0c4cc;
    font-size: 13px;
  }

  .status-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .time-cell {
    font-size: 12px;
    line-height: 1.8;

    .time-item {
      display: flex;
      gap: 4px;
      color: #606266;

      .time-label {
        color: #909399;
        flex-shrink: 0;
      }
    }
  }

  .compliance-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .compliance-icon {
      &.check-pass { color: #67c23a; }
      &.check-fail { color: #f56c6c; }
    }

    .compliance-label {
      font-size: 12px;
      color: #606266;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding: 0 4px;
  }

  .summary-card {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    border-radius: 12px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    z-index: 100;
    border: 1px solid #ebeef5;

    .summary-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .summary-label {
      color: #606266;
      font-size: 13px;
    }
    .summary-value {
      font-size: 20px;
      font-weight: 700;

      &.rate-high { color: #67c23a; }
      &.rate-medium { color: #409eff; }
      &.rate-low { color: #f56c6c; }
      &.value-blue { color: #409eff; }
      &.value-orange { color: #e6a23c; }
    }
    .summary-count {
      color: #909399;
      font-size: 12px;
    }
  }

  .stats-drawer {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .stats-card {
      margin-bottom: 16px;
      .card-title {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .bar-chart-wrapper {
      max-height: 280px;
      overflow-y: auto;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .bar-label {
        width: 100px;
        flex-shrink: 0;
        font-size: 13px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bar-container {
        flex: 1;
        height: 24px;
        background: #f5f7fa;
        border-radius: 4px;
        position: relative;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }

        .bar-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 600;
          color: #303133;
        }
      }

      .bar-count {
        width: 70px;
        text-align: right;
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
      }
    }

    .match-distribution {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;

      .match-item {
        display: flex;
        align-items: center;
        gap: 16px;

        .match-level-badge {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        &.match-a .match-level-badge { background: linear-gradient(135deg, #67c23a, #85ce61); }
        &.match-b .match-level-badge { background: linear-gradient(135deg, #409eff, #66b1ff); }
        &.match-c .match-level-badge { background: linear-gradient(135deg, #e6a23c, #ebb563); }
        &.match-d .match-level-badge { background: linear-gradient(135deg, #f56c6c, #f78989); }

        .match-bar {
          flex: 1;
          height: 20px;
          background: #f5f7fa;
          border-radius: 10px;
          overflow: hidden;

          .match-bar-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.4s ease;
          }
        }

        &.match-a .match-bar-fill { background: linear-gradient(90deg, #67c23a, #85ce61); }
        &.match-b .match-bar-fill { background: linear-gradient(90deg, #409eff, #66b1ff); }
        &.match-c .match-bar-fill { background: linear-gradient(90deg, #e6a23c, #ebb563); }
        &.match-d .match-bar-fill { background: linear-gradient(90deg, #f56c6c, #f78989); }

        .match-info {
          width: 120px;
          display: flex;
          justify-content: space-between;
          flex-shrink: 0;
          font-size: 13px;

          .match-count {
            color: #606266;
          }

          .match-percent {
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }
  }
}
</style>
