<template>
  <div class="probation-page">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="statusTab" size="default" @change="reload">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button :value="ProbationStatus.PROBATION">试用期内</el-radio-button>
          <el-radio-button :value="'expiring_soon'">即将到期</el-radio-button>
          <el-radio-button :value="ProbationStatus.PASSED">试用通过</el-radio-button>
          <el-radio-button :value="ProbationStatus.FAILED">试用不通过</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" v-ripple @click="openForm('create')">
          试用期登记
        </el-button>
        <el-button type="success" :icon="SetUp" v-ripple @click="openBatchDialog('set-assessments')">
          批量设置考核指标
        </el-button>
        <el-button
          v-if="isAdmin"
          type="warning"
          :icon="RefreshRight"
          v-ripple
          @click="openBatchDialog('update-status')"
        >
          批量更新状态
        </el-button>
        <el-button type="info" :icon="Refresh" v-ripple @click="handleSyncExpiring" :loading="syncLoading">
          手动同步即将到期
        </el-button>
        <el-button type="primary" plain :icon="DataAnalysis" v-ripple @click="statsDrawerVisible = true">
          通过率统计
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
          <el-option v-for="(label, key) in ProbationStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始日期">
        <el-date-picker
          v-model="searchForm.startDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" v-ripple @click="handleSearch">搜索</el-button>
        <el-button :icon="RefreshLeft" v-ripple @click="handleReset">重置</el-button>
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" fixed="left" />
        <el-table-column label="员工信息" width="200" fixed="left">
          <template #default="{ row }">
            <div class="employee-cell">
              <el-avatar :size="40" :src="row.avatar" class="employee-avatar">
                {{ (row.employeeName || '?').charAt(0) }}
              </el-avatar>
              <div class="employee-info">
                <div class="employee-name">{{ row.employeeName || '-' }}</div>
                <div class="employee-no">{{ row.employeeNo || '工号未分配' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="部门-岗位-职级" width="200">
          <template #default="{ row }">
            <div class="dept-card">
              <div class="dept-line">{{ row.department || '-' }}</div>
              <div class="pos-line">{{ row.position || '-' }}</div>
              <el-tag v-if="row.jobLevel" size="small" type="info">{{ row.jobLevel }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="导师/入职批次" width="150">
          <template #default="{ row }">
            <div class="mentor-cell">
              <div class="mentor-name">
                <el-icon><User /></el-icon>
                {{ row.mentor || '-' }}
              </div>
              <div class="batch-tag">{{ row.entryBatch || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="试用期进度" width="240">
          <template #default="{ row }">
            <div class="progress-cell">
              <div class="date-range">
                {{ formatDate(row.startDate) }} ~ {{ formatDate(row.endDate) }}
              </div>
              <el-progress
                :percentage="getProgressPercent(row)"
                :status="getProgressStatus(row)"
                :stroke-width="8"
                :text-inside="true"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余天数" width="120" align="center">
          <template #default="{ row }">
            <span
              :class="{
                'remaining-days': true,
                'expiring-soon': isExpiringSoon(row),
              }"
            >
              {{ getRemainingDays(row) }}天
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag
                :type="getStatusTagType(row)"
                size="default"
                effect="light"
                class="status-tag"
              >
                <el-icon v-if="row.status === ProbationStatus.PROBATION"><Clock /></el-icon>
                <el-icon v-else-if="row.status === ProbationStatus.REVIEWING"><EditPen /></el-icon>
                <el-icon v-else-if="row.status === ProbationStatus.PASSED"><CircleCheck /></el-icon>
                <el-icon v-else-if="row.status === ProbationStatus.FAILED"><CircleClose /></el-icon>
                <el-icon v-else-if="row.status === ProbationStatus.EXTENDED"><Timer /></el-icon>
                {{ getStatusLabel(row) }}
              </el-tag>
              <el-icon
                v-if="isExpiringSoon(row) && row.status === ProbationStatus.PROBATION"
                class="bell-icon"
              >
                <Bell />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="考核综合分" width="160" align="center">
          <template #default="{ row }">
            <div class="score-cell">
              <div class="comprehensive-score" :class="getScoreClass(row.comprehensiveScore)">
                {{ row.comprehensiveScore !== undefined && row.comprehensiveScore !== null ? row.comprehensiveScore.toFixed(1) : '-' }}
              </div>
              <div class="assess-badge-wrap">
                <el-tag
                  v-if="row.isAssessed && row.reviewResult === 'passed'"
                  type="success"
                  size="small"
                  effect="dark"
                >
                  PASSED
                </el-tag>
                <el-tag
                  v-else-if="row.isAssessed && row.reviewResult === 'failed'"
                  type="danger"
                  size="small"
                  effect="dark"
                >
                  FAILED
                </el-tag>
                <el-tag v-else-if="row.isAssessed" type="warning" size="small">已考核</el-tag>
                <el-tag v-else type="info" size="small">未考核</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="合规性" width="140" align="center">
          <template #default="{ row }">
            <div class="compliance-cell">
              <el-tooltip
                :content="row.durationComplianceResult?.reason || (row.durationComplianceChecked ? '时长合规' : '时长未校验')"
                placement="top"
              >
                <span class="compliance-item">
                  <el-icon v-if="row.durationComplianceChecked" class="check-pass"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="check-fail"><CircleCloseFilled /></el-icon>
                  <span>时长</span>
                </span>
              </el-tooltip>
              <el-tooltip
                :content="getAssessmentCheckTip(row)"
                placement="top"
              >
                <span class="compliance-item">
                  <el-icon v-if="row.assessmentStandardCheck?.valid" class="check-pass"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="check-fail"><CircleCloseFilled /></el-icon>
                  <span>考核标准</span>
                </span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
            <el-button
              type="success"
              link
              size="small"
              :disabled="isOperationLocked(row)"
              @click="handleSetAssessments(row)"
            >
              设置考核
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              :disabled="isOperationLocked(row)"
              @click="handlePass(row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              :disabled="isOperationLocked(row)"
              @click="handleFail(row)"
            >
              不通过
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              :disabled="isOperationLocked(row)"
              @click="handleExtend(row)"
            >
              延长
            </el-button>
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
        <span class="summary-label">本月批次通过率</span>
        <span class="summary-value" :class="getRateClass(statsData.currentMonthBatch.passRate)">
          {{ statsData.currentMonthBatch.passRate.toFixed(1) }}%
        </span>
        <span class="summary-count">
          ({{ statsData.currentMonthBatch.passed }}/{{ statsData.currentMonthBatch.total }})
        </span>
      </div>
    </div>

    <ProbationForm
      v-model:visible="formVisible"
      :mode="formMode"
      :initial-data="formInitialData"
      @success="handleFormSuccess"
    />

    <ProbationDetail
      v-model:visible="detailVisible"
      :probation-id="detailProbationId"
      @action="handleDetailAction"
    />

    <ProbationBatchDialog
      v-model:visible="batchDialogVisible"
      :mode="batchDialogMode"
      :selected-items="selectedRows"
      :is-admin="isAdmin"
      @success="handleBatchSuccess"
    />

    <el-drawer
      v-model="statsDrawerVisible"
      title="通过率统计分析"
      size="960px"
      direction="rtl"
      destroy-on-close
    >
      <div class="stats-drawer" v-loading="statsLoading">
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

        <el-card class="stats-card" shadow="never">
          <template #header>
            <span class="card-title">📊 按岗位类别统计</span>
          </template>
          <div class="bar-chart-wrapper">
            <div v-for="(item, index) in statsData?.byJobCategory || []" :key="'cat-' + index" class="bar-row">
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
            <el-empty v-if="!statsData?.byJobCategory?.length" description="暂无数据" :image-size="80" />
          </div>
        </el-card>

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
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  ElMessage, ElMessageBox, ElNotification,
} from 'element-plus';
import {
  Plus, SetUp, RefreshRight, Refresh, DataAnalysis,
  Search, RefreshLeft, Clock, EditPen, CircleCheck, CircleClose,
  Timer, Bell, User, CircleCheckFilled, CircleCloseFilled,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import {
  getProbationListApi,
  getProbationDetailApi,
  passProbationApi,
  failProbationApi,
  extendProbationApi,
  syncProbationStatusApi,
  getProbationStatsApi,
  startProbationReviewApi,
  type ProbationItem,
  type ProbationListParams,
  ProbationStatus,
  ProbationStatusLabel,
  ProbationStatusType,
  PROBATION_LOCKED_STATUSES,
  EXPIRING_SOON_DAYS,
  type ProbationStatsData,
} from '@/api/probation';
import { DATE_FORMAT, UserRole } from '@/constants/recruitment';
import { useUserStore } from '@/store/modules/user';
import ProbationForm from './ProbationForm.vue';
import ProbationDetail from './ProbationDetail.vue';
import ProbationBatchDialog from './ProbationBatchDialog.vue';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);

const loading = ref(false);
const syncLoading = ref(false);
const statsLoading = ref(false);
const tableData = ref<ProbationItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<ProbationItem[]>([]);
const statusTab = ref<string>('');
const statsData = ref<ProbationStatsData | null>(null);

const tableRef = ref();

const searchForm = reactive({
  name: '',
  employeeNo: '',
  department: '',
  position: '',
  entryBatch: '' as string,
  status: '' as ProbationStatus | '',
  startDateRange: [] as string[],
});

let pollTimer: ReturnType<typeof setInterval> | null = null;

const formatDate = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATE_FORMAT);
};

const isExpiringSoon = (row: ProbationItem) => {
  if (row.status !== ProbationStatus.PROBATION && row.status !== ProbationStatus.EXTENDED) return false;
  const remaining = dayjs(row.endDate).diff(dayjs(), 'day');
  return remaining <= EXPIRING_SOON_DAYS && remaining >= 0;
};

const getRemainingDays = (row: ProbationItem) => {
  const remaining = dayjs(row.endDate).diff(dayjs(), 'day');
  if (row.status === ProbationStatus.PASSED || row.status === ProbationStatus.FAILED) return 0;
  return Math.max(remaining, 0);
};

const getProgressPercent = (row: ProbationItem) => {
  const start = dayjs(row.startDate);
  const end = dayjs(row.endDate);
  const total = end.diff(start, 'day');
  if (total <= 0) return 0;
  const elapsed = dayjs().diff(start, 'day');
  const percent = Math.round((elapsed / total) * 100);
  return Math.min(Math.max(percent, 0), 100);
};

const getProgressStatus = (row: ProbationItem) => {
  if (row.status === ProbationStatus.PASSED) return 'success';
  if (row.status === ProbationStatus.FAILED) return 'exception';
  const percent = getProgressPercent(row);
  if (percent >= 100) return 'exception';
  if (isExpiringSoon(row)) return 'warning';
  return undefined;
};

const getStatusLabel = (row: ProbationItem) => {
  return ProbationStatusLabel[row.status] || row.status;
};

const getStatusTagType = (row: ProbationItem) => {
  return (ProbationStatusType[row.status] as any) || 'info';
};

const getScoreClass = (score?: number) => {
  if (score === undefined || score === null) return '';
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  if (score >= 40) return 'score-low';
  return 'score-danger';
};

const getRateClass = (rate: number) => {
  if (rate >= 80) return 'rate-high';
  if (rate >= 60) return 'rate-medium';
  return 'rate-low';
};

const getAssessmentCheckTip = (row: ProbationItem) => {
  const check = row.assessmentStandardCheck;
  if (!check) return '未校验';
  if (check.valid) return '考核标准合规';
  const msgs: string[] = [];
  if (check.missingItems?.length) msgs.push(`缺少: ${check.missingItems.join(',')}`);
  if (check.overWeighted?.length) msgs.push(`权重超限: ${check.overWeighted.join(',')}`);
  msgs.push(`权重总计: ${check.totalWeight}%`);
  return msgs.join('；');
};

const getBarColor = (rate: number) => {
  if (rate >= 80) return '#67c23a';
  if (rate >= 60) return '#409eff';
  if (rate >= 40) return '#e6a23c';
  return '#f56c6c';
};

const isOperationLocked = (row: ProbationItem) => {
  return PROBATION_LOCKED_STATUSES.includes(row.status);
};

const tableRowClassName = ({ row }: { row: ProbationItem }) => {
  return selectedIds.value.includes(row.id) ? 'selected-row' : '';
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: ProbationListParams = {
      page: page.value,
      pageSize: pageSize.value,
      name: searchForm.name || undefined,
      employeeNo: searchForm.employeeNo || undefined,
      department: searchForm.department || undefined,
      position: searchForm.position || undefined,
      entryBatch: searchForm.entryBatch || undefined,
      status: searchForm.status || statusTab.value || undefined,
    };
    if (statusTab.value === 'expiring_soon') {
      (params as any).expiringSoon = true;
      params.status = undefined;
    }
    if (searchForm.startDateRange?.length === 2) {
      params.startDateStart = searchForm.startDateRange[0];
      params.startDateEnd = searchForm.startDateRange[1];
    }
    Object.keys(params).forEach(k => {
      if ((params as any)[k] === undefined || (params as any)[k] === '' || (params as any)[k] === null) {
        delete (params as any)[k];
      }
    });
    const res = await getProbationListApi(params);
    tableData.value = (res as any).list || [];
    total.value = (res as any).total || 0;
  } finally {
    loading.value = false;
  }
};

const refreshLocal = (newData: ProbationItem, op: 'create' | 'update' | 'replace' = 'update') => {
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
  searchForm.startDateRange = [];
  statusTab.value = '';
  page.value = 1;
  fetchList();
};

const handleSelectionChange = (selection: ProbationItem[]) => {
  selectedRows.value = selection;
  selectedIds.value = selection.map(s => s.id);
};

const handleSyncExpiring = async () => {
  syncLoading.value = true;
  try {
    const res = await syncProbationStatusApi();
    fetchList();
    ElNotification({
      title: '同步完成',
      message: `已更新 ${res.updated || 0} 条即将到期记录，当前即将到期共 ${res.expiringSoon?.length || 0} 人`,
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
    statsData.value = await getProbationStatsApi();
  } catch {
    statsData.value = null;
  } finally {
    statsLoading.value = false;
  }
};

const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formInitialData = ref<ProbationItem>({} as ProbationItem);

const openForm = (mode: 'create' | 'edit', row?: ProbationItem) => {
  formMode.value = mode;
  formInitialData.value = row ? { ...row } : ({} as ProbationItem);
  formVisible.value = true;
};

const handleFormSuccess = (data: ProbationItem) => {
  ElMessage.success('操作成功');
  if (formMode.value === 'create') {
    reload();
  } else {
    refreshLocal(data, 'update');
  }
};

const detailVisible = ref(false);
const detailProbationId = ref<number>(0);

const openDetail = (row: ProbationItem) => {
  detailProbationId.value = row.id;
  detailVisible.value = true;
};

const handleDetailAction = async (action: string, row: ProbationItem) => {
  detailVisible.value = false;
  switch (action) {
    case 'edit':
      openForm('edit', row);
      break;
    case 'set-assessments':
      handleSetAssessments(row);
      break;
    case 'pass':
      handlePass(row);
      break;
    case 'fail':
      handleFail(row);
      break;
    case 'extend':
      handleExtend(row);
      break;
  }
};

const batchDialogVisible = ref(false);
const batchDialogMode = ref<'set-assessments' | 'update-status'>('set-assessments');

const openBatchDialog = (mode: 'set-assessments' | 'update-status') => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择试用期记录');
    return;
  }
  batchDialogMode.value = mode;
  batchDialogVisible.value = true;
};

const handleBatchSuccess = (msg?: string) => {
  ElNotification({ title: '批量操作完成', message: msg || '操作成功', type: 'success' });
  reload();
};

const handleSetAssessments = async (row: ProbationItem) => {
  try {
    const detail = await getProbationDetailApi(row.id);
    openForm('edit', detail);
  } catch {
    openForm('edit', row);
  }
};

const handlePass = async (row: ProbationItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `确定要将「${row.employeeName || '该员工'}」标记为试用通过吗？`,
      '转正通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入考核评语（可选）',
        type: 'success',
      }
    );
    await startProbationReviewApi(row.id).catch(() => {});
    const res = await passProbationApi(row.id, value);
    ElMessage.success('已通过转正');
    refreshLocal(res as any, 'update');
  } catch { /* cancel */ }
};

const handleFail = async (row: ProbationItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `确定要将「${row.employeeName || '该员工'}」标记为试用不通过吗？`,
      '试用不通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入不通过原因（必填）',
        type: 'warning',
        inputValidator: (v: string) => !!v?.trim() || '请填写不通过原因',
      }
    );
    await startProbationReviewApi(row.id).catch(() => {});
    const res = await failProbationApi(row.id, value);
    ElMessage.success('已标记未通过');
    refreshLocal(res as any, 'update');
  } catch { /* cancel */ }
};

const handleExtend = async (row: ProbationItem) => {
  try {
    const extendDays = await ElMessageBox.prompt(
      `为「${row.employeeName || '该员工'}」延长试用期`,
      '延长试用期',
      {
        confirmButtonText: '继续填写原因',
        cancelButtonText: '取消',
        inputPattern: /^[1-9]\d?$|^90$/,
        inputErrorMessage: '延长期限需在1-90天之间',
        inputPlaceholder: '请输入延长天数（1-90）',
        type: 'warning',
      }
    );
    const days = parseInt(extendDays.value);
    const { value: reason } = await ElMessageBox.prompt(
      `确认延长 ${days} 天`,
      '延长原因',
      {
        confirmButtonText: '确认延长',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入延长原因（必填）',
        type: 'warning',
        inputValidator: (v: string) => !!v?.trim() || '请填写延长原因',
      }
    );
    const res = await extendProbationApi(row.id, days, reason);
    ElMessage.success('已延长试用期');
    refreshLocal(res as any, 'update');
  } catch { /* cancel */ }
};

const statsDrawerVisible = ref(false);
watch(statsDrawerVisible, (val) => {
  if (val) {
    fetchStats();
  }
});

const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      await syncProbationStatusApi();
      const selectedPage = page.value;
      const selectedPageSize = pageSize.value;
      const params: ProbationListParams = {
        page: selectedPage,
        pageSize: selectedPageSize,
        name: searchForm.name || undefined,
        employeeNo: searchForm.employeeNo || undefined,
        department: searchForm.department || undefined,
        position: searchForm.position || undefined,
        entryBatch: searchForm.entryBatch || undefined,
        status: searchForm.status || statusTab.value || undefined,
      };
      if (statusTab.value === 'expiring_soon') {
        (params as any).expiringSoon = true;
        params.status = undefined;
      }
      if (searchForm.startDateRange?.length === 2) {
        params.startDateStart = searchForm.startDateRange[0];
        params.startDateEnd = searchForm.startDateRange[1];
      }
      Object.keys(params).forEach(k => {
        if ((params as any)[k] === undefined || (params as any)[k] === '' || (params as any)[k] === null) {
          delete (params as any)[k];
        }
      });
      const res = await getProbationListApi(params);
      tableData.value = (res as any).list || [];
      total.value = (res as any).total || 0;
    } catch { /* silent */ }
  }, 30000);
};

onMounted(() => {
  fetchList();
  fetchStats();
  startPolling();
});

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style lang="scss" scoped>
.probation-page {
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
  }

  :deep(.el-table .selected-row) {
    --el-table-tr-bg-color: #ecf5ff !important;
    td {
      background-color: #ecf5ff !important;
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
    }

    .employee-info {
      .employee-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
      .employee-no {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }

  .dept-card {
    background: #f5f7fa;
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;

    .dept-line {
      font-weight: 600;
      color: #303133;
    }
    .pos-line {
      color: #606266;
    }
  }

  .mentor-cell {
    font-size: 12px;
    line-height: 1.8;

    .mentor-name {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #303133;
    }
    .batch-tag {
      color: #909399;
    }
  }

  .progress-cell {
    font-size: 12px;

    .date-range {
      color: #606266;
      margin-bottom: 6px;
    }
  }

  .remaining-days {
    font-weight: 600;
    font-size: 15px;
    color: #303133;

    &.expiring-soon {
      color: #f56c6c;
      animation: blink 1s ease-in-out infinite;
    }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .bell-icon {
      color: #e6a23c;
      animation: bellShake 1.5s ease-in-out infinite;
      font-size: 16px;
    }
  }

  @keyframes bellShake {
    0%, 100% { transform: rotate(0); }
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-15deg); }
    60% { transform: rotate(10deg); }
    80% { transform: rotate(-10deg); }
  }

  .score-cell {
    .comprehensive-score {
      font-size: 20px;
      font-weight: 700;

      &.score-high { color: #67c23a; }
      &.score-medium { color: #409eff; }
      &.score-low { color: #e6a23c; }
      &.score-danger { color: #f56c6c; }
    }
    .assess-badge-wrap {
      margin-top: 4px;
    }
  }

  .compliance-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    .compliance-item {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
    }
    .check-pass {
      color: #67c23a;
    }
    .check-fail {
      color: #f56c6c;
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
      .card-title {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .bar-chart-wrapper {
      max-height: 320px;
      overflow-y: auto;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .bar-label {
        width: 120px;
        flex-shrink: 0;
        font-size: 13px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bar-container {
        flex: 1;
        height: 28px;
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
        width: 80px;
        text-align: right;
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
      }
    }
  }
}
</style>
