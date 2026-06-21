<template>
  <el-drawer
    v-model="visibleLocal"
    :title="drawerTitle"
    size="1000px"
    direction="rtl"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading">
      <template v-if="detail">
        <div class="drawer-header-status">
          <el-tag :type="RegularizationStatusType[detail.status as RegularizationStatus]" size="default" effect="light">
            <el-icon v-if="detail.status === RegularizationStatus.PENDING_APPLY"><Clock /></el-icon>
            <el-icon v-else-if="detail.status === RegularizationStatus.APPROVING"><Loading /></el-icon>
            <el-icon v-else-if="detail.status === RegularizationStatus.APPROVED"><CircleCheckFilled /></el-icon>
            <el-icon v-else-if="detail.status === RegularizationStatus.REJECTED"><CircleCloseFilled /></el-icon>
            {{ RegularizationStatusLabel[detail.status as RegularizationStatus] }}
          </el-tag>
        </div>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="员工姓名">
              <div class="employee-line">
                <el-avatar :size="32" :src="detail.avatar" class="inline-avatar">
                  {{ (detail.employeeName || detail.name || '?').charAt(0) }}
                </el-avatar>
                <span class="name-text">{{ detail.employeeName || detail.name || '-' }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="工号">{{ detail.employeeNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ detail.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detail.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ detail.department || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ detail.position || '-' }}</el-descriptions-item>
            <el-descriptions-item label="职级">
              <el-tag v-if="detail.jobLevel" size="small">{{ detail.jobLevel }}</el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="岗位类别">{{ detail.jobCategory || '-' }}</el-descriptions-item>
            <el-descriptions-item label="导师">{{ detail.mentor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="入职批次">{{ detail.entryBatch || '-' }}</el-descriptions-item>
            <el-descriptions-item label="对接HR">{{ detail.hrOperatorName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="招聘HR">{{ detail.recruitmentHrName || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="probation-info">
            <div class="probation-label">
              <span class="label-text">试用期：</span>
              <span class="date-text">{{ formatDate(detail.probationStartDate) }} ~ {{ formatDate(detail.probationEndDate) }}</span>
            </div>
            <el-progress
              :percentage="getProgressPercent(detail)"
              :status="getProgressStatus(detail)"
              :stroke-width="14"
            />
            <div class="remaining-info">
              剩余 <strong :class="{ 'expiring-soon': isExpiringSoon(detail) }">{{ getRemainingDays(detail) }}</strong> 天
              <el-tag v-if="isExpiringSoon(detail)" type="danger" size="small" class="expire-tag">即将到期</el-tag>
            </div>
          </div>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>考核信息</span>
              <el-badge
                v-if="detail.comprehensiveScore !== undefined && detail.comprehensiveScore !== null"
                :value="'综合分：' + detail.comprehensiveScore.toFixed(1)"
                :class="['score-badge', getScoreBadgeClass(detail.comprehensiveScore)]"
              >
                <span></span>
              </el-badge>
            </div>
          </template>

          <div class="score-header">
            <div :class="['comprehensive-badge', getScoreBadgeClass(detail.comprehensiveScore)]">
              <div class="badge-value">
                {{ detail.comprehensiveScore !== undefined && detail.comprehensiveScore !== null ? detail.comprehensiveScore.toFixed(1) : '-' }}
              </div>
              <div class="badge-label">综合得分</div>
            </div>

            <div v-if="detail.recruitmentMatchLevel" class="match-level-card" :class="'match-card-' + detail.recruitmentMatchLevel">
              <div class="match-title">招聘适配度</div>
              <div class="match-level-value">{{ detail.recruitmentMatchLevel }}</div>
              <div class="match-desc">
                {{ getMatchLevelDesc(detail.recruitmentMatchLevel) }}
              </div>
            </div>
          </div>

          <el-table
            v-if="detail.assessments?.length"
            :data="detail.assessments"
            border
            size="default"
            style="margin-top: 16px"
          >
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="indicatorName" label="指标名称" min-width="160" />
            <el-table-column label="权重占比" min-width="200">
              <template #default="{ row }">
                <div class="weight-bar-wrapper">
                  <div class="weight-bar">
                    <div
                      class="weight-fill"
                      :style="{ width: (row.indicatorWeight || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="weight-text">{{ row.indicatorWeight || 0 }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="分数" width="120" align="center">
              <template #default="{ row }">
                <span :class="['score-text', getScoreClass(row.score)]">
                  {{ row.score !== undefined && row.score !== null ? row.score.toFixed(1) : '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="indicatorDesc" label="考核说明" min-width="200">
              <template #default="{ row }">
                {{ row.indicatorDesc || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="评分人" width="110">
              <template #default="{ row }">
                {{ row.evaluatorName || '-' }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无考核指标" :image-size="80" style="margin-top: 16px" />
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>申请信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="申请时间">{{ formatDateTime(detail.applyTime) }}</el-descriptions-item>
            <el-descriptions-item label="最终审批时间">{{ formatDateTime(detail.finalApproveTime) }}</el-descriptions-item>
            <el-descriptions-item label="申请备注" :span="2">
              <div class="remark-box">{{ detail.applicationRemark || '无备注' }}</div>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="detail.attachments?.length" class="attachments-section">
            <div class="attachments-title">
              <el-icon><Paperclip /></el-icon>
              <span>申请附件</span>
            </div>
            <div class="attachments-list">
              <div
                v-for="(att, idx) in detail.attachments"
                :key="idx"
                class="attachment-item"
                @click="handleDownload(att)"
              >
                <el-icon><Document /></el-icon>
                <span class="attachment-name">{{ getFileName(att) }}</span>
                <el-icon class="download-icon"><Download /></el-icon>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Guide /></el-icon>
              <span>审批流程进度</span>
            </div>
          </template>
          <el-steps
            :active="getApprovalStepIndex(detail)"
            finish-status="success"
            direction="vertical"
          >
            <el-step
              v-for="(node, idx) in (detail.approvalNodes || defaultApprovalNodes)"
              :key="idx"
              :status="getStepStatus(detail, idx)"
              :title="getNodeTitle(node)"
            >
              <template #description>
                <div class="step-description">
                  <el-tooltip
                    v-if="node.approverName || node.approvedAt || node.rejectedAt || node.comment"
                    placement="top"
                  >
                    <template #content>
                      <div class="tooltip-content">
                        <div v-if="node.approverName">审批人：{{ node.approverName }}</div>
                        <div v-if="node.approverRole">角色：{{ node.approverRole }}</div>
                        <div v-if="node.approvedAt">通过时间：{{ formatDateTime(node.approvedAt) }}</div>
                        <div v-if="node.rejectedAt">驳回时间：{{ formatDateTime(node.rejectedAt) }}</div>
                        <div v-if="node.comment">意见：{{ node.comment }}</div>
                      </div>
                    </template>
                    <div class="step-info">
                      <span v-if="node.status === 'approved'" class="text-success">✓ {{ node.approverName || '已通过' }}</span>
                      <span v-else-if="node.status === 'rejected'" class="text-danger">✗ {{ node.approverName || '已驳回' }}</span>
                      <span v-else-if="node.status === 'current'" class="text-primary">● 待 {{ node.approverName || '审批' }}</span>
                      <span v-else class="text-gray">○ 待审批</span>
                    </div>
                  </el-tooltip>
                  <span v-else class="text-gray">待审批</span>
                </div>
              </template>
            </el-step>
          </el-steps>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Wallet /></el-icon>
              <span>薪资福利调整</span>
              <el-tag v-if="detail.status === RegularizationStatus.APPROVED" type="success" size="small">已生效</el-tag>
              <el-tag v-else type="info" size="small">预调整</el-tag>
            </div>
          </template>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="调整前薪资">
              <span class="salary-before">{{ detail.salaryBefore || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="调整后薪资">
              <span class="salary-after">{{ detail.salaryAfter || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="调整幅度">
              <span v-if="detail.salaryAdjustPercent" :class="detail.salaryAdjustPercent > 0 ? 'text-success' : 'text-danger'">
                {{ detail.salaryAdjustPercent > 0 ? '+' : '' }}{{ detail.salaryAdjustPercent }}%
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><DocumentChecked /></el-icon>
              <span>合规性校验面板</span>
              <el-tag
                v-if="detail.complianceChecked"
                type="success"
                size="small"
              >
                <el-icon><CircleCheckFilled /></el-icon>
                已通过
              </el-tag>
              <el-tag v-else type="warning" size="small">待校验</el-tag>
            </div>
          </template>
          <div v-if="detail.complianceIssues?.length" class="compliance-list">
            <div
              v-for="(issue, idx) in detail.complianceIssues"
              :key="idx"
              class="compliance-item"
              :class="issue.passed ? 'compliance-pass' : 'compliance-fail'"
            >
              <div class="compliance-icon">
                <el-icon size="18" v-if="issue.passed"><CircleCheckFilled /></el-icon>
                <el-icon size="18" v-else><CircleCloseFilled /></el-icon>
              </div>
              <div class="compliance-content">
                <div class="compliance-label">
                  <strong>{{ issue.label }}</strong>
                  <span v-if="!issue.passed" class="fail-tag">不通过</span>
                </div>
                <div v-if="issue.reason || issue.detail" class="compliance-reason">
                  {{ issue.reason || issue.detail }}
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无合规校验记录" :image-size="60" />
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Clock /></el-icon>
              <span>全流程溯源时间线</span>
            </div>
          </template>
          <el-timeline v-if="sortedLogs.length" class="operation-timeline">
            <el-timeline-item
              v-for="log in sortedLogs"
              :key="log.id"
              :timestamp="formatDateTime(log.created_at)"
              placement="top"
              :type="getLogType(log.action)"
            >
              <div class="timeline-item-header">
                <span class="action-title">
                  {{ getActionLabel(log.action) }}
                </span>
                <span class="operator-info">
                  - {{ log.operatorName }}（{{ log.operatorRole }}）
                </span>
              </div>
              <div class="timeline-item-content">
                <div v-if="log.remark" class="remark-text">
                  <strong>备注：</strong>{{ log.remark }}
                </div>
                <div v-if="log.changedFields && log.changedFields.length" class="changed-fields">
                  <strong>变更字段：</strong>
                  <el-tag
                    v-for="field in log.changedFields"
                    :key="field"
                    type="warning"
                    size="small"
                    style="margin-right: 4px; margin-bottom: 4px"
                  >
                    {{ field }}
                  </el-tag>
                </div>
                <div
                  v-if="log.beforeData && log.afterData && (log.changedFields?.length)"
                  class="update-diff"
                >
                  <el-descriptions :column="2" border size="small">
                    <template v-for="field in (log.changedFields || [])" :key="field">
                      <el-descriptions-item :label="`变更前 - ${field}`">
                        <span class="diff-before">{{ getFieldValue(log.beforeData, field) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item :label="`变更后 - ${field}`">
                        <span class="diff-after">{{ getFieldValue(log.afterData, field) }}</span>
                      </el-descriptions-item>
                    </template>
                  </el-descriptions>
                </div>
                <div v-if="log.ipAddress" class="ip-address">
                  IP地址：{{ log.ipAddress }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无操作记录" />
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Tickets /></el-icon>
              <span>审批记录详情</span>
            </div>
          </template>
          <el-table
            v-if="detail.approvalNodes?.length"
            :data="detail.approvalNodes"
            border
            size="default"
          >
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="节点名称" min-width="140">
              <template #default="{ row }">
                {{ getNodeTitle(row) }}
              </template>
            </el-table-column>
            <el-table-column label="审批人" width="110">
              <template #default="{ row }">
                {{ row.approverName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="角色" width="110">
              <template #default="{ row }">
                {{ row.approverRole || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
                <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
                <el-tag v-else-if="row.status === 'current'" type="warning" size="small">审批中</el-tag>
                <el-tag v-else type="info" size="small">待审批</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="170">
              <template #default="{ row }">
                {{ formatDateTime(row.approvedAt || row.rejectedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="审批意见" min-width="200">
              <template #default="{ row }">
                {{ row.comment || '-' }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无审批记录" :image-size="60" />
        </el-card>
      </template>

      <el-empty v-else-if="!loading" description="未找到转正申请详情数据" />
    </div>

    <template #footer>
      <div class="drawer-footer">
        <template v-if="!isStatusLocked && detail">
          <template v-if="canApprove">
            <el-tooltip
              v-if="isButtonDisabled('approve')"
              content="当前状态不可执行此操作"
              placement="top"
            >
              <el-button type="success" disabled @click="handleAction('approve')" v-ripple>审批通过</el-button>
            </el-tooltip>
            <el-button
              v-else
              type="success"
              @click="handleClick(handleAction, 'approve')"
              v-ripple
            >
              审批通过
            </el-button>

            <el-tooltip
              v-if="isButtonDisabled('reject')"
              content="当前状态不可执行此操作"
              placement="top"
            >
              <el-button type="danger" disabled @click="handleAction('reject')" v-ripple>审批驳回</el-button>
            </el-tooltip>
            <el-button
              v-else
              type="danger"
              @click="handleClick(handleAction, 'reject')"
              v-ripple
            >
              审批驳回
            </el-button>
          </template>

          <el-tooltip
            v-if="detail.status === RegularizationStatus.REJECTED && isButtonDisabled('resubmit')"
            content="当前状态不可执行此操作"
            placement="top"
          >
            <el-button type="warning" disabled @click="handleAction('resubmit')" v-ripple>重新提交</el-button>
          </el-tooltip>
          <el-button
            v-else-if="detail.status === RegularizationStatus.REJECTED"
            type="warning"
            @click="handleClick(handleAction, 'resubmit')"
            v-ripple
          >
            重新提交
          </el-button>

          <el-button @click="handleClick(handleClose)" v-ripple>关闭</el-button>
        </template>
        <template v-else>
          <el-tag type="info">当前状态已锁定，无法进行操作</el-tag>
          <el-button @click="handleClick(handleClose)" v-ripple>关闭</el-button>
        </template>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ElMessage, ElMessageBox, ElTooltip,
} from 'element-plus';
import {
  Clock, Loading, CircleCheckFilled, CircleCloseFilled, User, DataAnalysis,
  Document, Guide, Wallet, DocumentChecked, Tickets, Paperclip, Download,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import {
  getRegularizationFullDetailApi,
  approveRegularizationApi,
  rejectRegularizationApi,
  resubmitRegularizationApi,
  type RegularizationItem,
  type RegularizationOperationLog,
  type RegularizationApprovalNode,
  RegularizationStatus,
  RegularizationStatusLabel,
  RegularizationStatusType,
  REGULARIZATION_LOCKED_STATUSES,
  EXPIRING_SOON_DAYS,
  ApprovalNodeType,
  ApprovalNodeTypeLabel,
  RegularizationOperationAction,
  RegularizationOperationActionLabel,
} from '@/api/regularization';
import { DATE_FORMAT, DATETIME_FORMAT, UserRole } from '@/constants/recruitment';
import { useUserStore } from '@/store/modules/user';

interface Props {
  visible: boolean;
  regularizationId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'action', actionType: string, row: RegularizationItem): void;
}>();

const userStore = useUserStore();
const visibleLocal = ref(props.visible);
const loading = ref(false);
const detail = ref<RegularizationItem | null>(null);
const clicked = ref(false);

const handleClick = (fn: (...args: any[]) => any, ...args: any[]) => {
  if (clicked.value) return;
  clicked.value = true;
  fn(...args);
  setTimeout(() => {
    clicked.value = false;
  }, 300);
};

const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);
const currentUserId = computed(() => userStore.userInfo?.id || 0);

watch(
  () => props.visible,
  (val) => {
    visibleLocal.value = val;
    if (val && props.regularizationId) {
      fetchDetail();
    }
  },
  { immediate: true }
);

watch(visibleLocal, (val) => {
  emit('update:visible', val);
});

const defaultApprovalNodes: RegularizationApprovalNode[] = [
  { nodeType: ApprovalNodeType.DEPT_HEAD, status: 'pending' },
  { nodeType: ApprovalNodeType.HR, status: 'pending' },
  { nodeType: ApprovalNodeType.HR_DIRECTOR, status: 'pending' },
  { nodeType: ApprovalNodeType.GENERAL_MANAGER, status: 'pending' },
];

const drawerTitle = computed(() => {
  if (detail.value?.employeeName || detail.value?.name) {
    return `转正详情 - ${detail.value.employeeName || detail.value.name}`;
  }
  return '转正申请详情';
});

const isStatusLocked = computed(() => {
  if (!detail.value) return true;
  return REGULARIZATION_LOCKED_STATUSES.includes(detail.value.status as RegularizationStatus);
});

const canApprove = computed(() => {
  if (!detail.value) return false;
  if (detail.value.status !== RegularizationStatus.APPROVING) return false;
  if (isAdmin.value) return true;
  return detail.value.currentApproverId === currentUserId.value;
});

const isButtonDisabled = (action: string) => {
  if (!detail.value) return true;
  if (isStatusLocked.value) return true;
  if (action === 'approve' || action === 'reject') {
    return !canApprove.value;
  }
  if (action === 'resubmit') {
    return detail.value.status !== RegularizationStatus.REJECTED;
  }
  return false;
};

const sortedLogs = computed(() => {
  if (!detail.value?.operationLogs) return [];
  return [...detail.value.operationLogs].sort(
    (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
  );
});

const fetchDetail = async () => {
  loading.value = true;
  try {
    detail.value = await getRegularizationFullDetailApi(props.regularizationId);
  } catch (e: any) {
    ElMessage.error(e?.message || '获取详情失败');
    detail.value = null;
  } finally {
    loading.value = false;
  }
};

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

const getScoreBadgeClass = (score?: number) => {
  if (score === undefined || score === null) return 'badge-info';
  if (score >= 90) return 'badge-excellent';
  if (score >= 80) return 'badge-high';
  if (score >= 70) return 'badge-medium';
  return 'badge-danger';
};

const getMatchLevelDesc = (level: string) => {
  const map: Record<string, string> = {
    A: '高度适配，非常优秀',
    B: '良好适配，符合预期',
    C: '基本适配，有待提升',
    D: '适配度较低，需重点关注',
  };
  return map[level] || '未评级';
};

const getNodeTitle = (node: RegularizationApprovalNode) => {
  if (node.nodeName) return node.nodeName;
  return (ApprovalNodeTypeLabel as any)[node.nodeType] || node.nodeType || '审批节点';
};

const getApprovalStepIndex = (row: RegularizationItem) => {
  const nodes = row.approvalNodes || defaultApprovalNodes;
  if (row.status === RegularizationStatus.APPROVED) return nodes.length;
  if (row.status === RegularizationStatus.PENDING_APPLY) return 0;
  if (row.status === RegularizationStatus.REJECTED) {
    const rejectedIdx = nodes.findIndex(n => n.status === 'rejected');
    return rejectedIdx > -1 ? rejectedIdx + 1 : 0;
  }
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

const getLogType = (action: string) => {
  if (
    action === RegularizationOperationAction.APPROVE ||
    action === RegularizationOperationAction.BATCH_APPROVE
  ) return 'success';
  if (
    action === RegularizationOperationAction.REJECT
  ) return 'danger';
  if (
    action === RegularizationOperationAction.RESUBMIT ||
    action === RegularizationOperationAction.SUBMIT
  ) return 'warning';
  return 'primary';
};

const getActionLabel = (action: RegularizationOperationAction | string) => {
  return (RegularizationOperationActionLabel as any)[action] || action;
};

const getFieldValue = (obj: any, key: string) => {
  if (!obj) return '-';
  const val = obj[key];
  if (val === undefined || val === null || val === '') return '-';
  return String(val);
};

const getFileName = (url: string) => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
};

const handleDownload = (url: string) => {
  if (!url) return;
  window.open(url, '_blank');
};

const handleAction = async (actionType: string) => {
  if (!detail.value) return;
  if (actionType === 'approve') {
    try {
      const { value } = await ElMessageBox.prompt(
        `确定要通过「${detail.value.employeeName || detail.value.name || '该员工'}」的转正申请吗？`,
        '审批通过',
        {
          confirmButtonText: '确定通过',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPlaceholder: '请输入审批意见（可选）',
          type: 'success',
        }
      );
      const res = await approveRegularizationApi(detail.value.id, { comment: value });
      ElMessage.success('审批通过');
      detail.value = res;
      emit('action', 'approve', res);
    } catch { /* cancel */ }
  } else if (actionType === 'reject') {
    try {
      const { value } = await ElMessageBox.prompt(
        `确定要驳回「${detail.value.employeeName || detail.value.name || '该员工'}」的转正申请吗？`,
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
      const res = await rejectRegularizationApi(detail.value.id, { reason: value });
      ElMessage.success('已驳回');
      detail.value = res;
      emit('action', 'reject', res);
    } catch { /* cancel */ }
  } else if (actionType === 'resubmit') {
    try {
      const { value } = await ElMessageBox.prompt(
        `重新提交「${detail.value.employeeName || detail.value.name || '该员工'}」的转正申请`,
        '重新提交',
        {
          confirmButtonText: '确认提交',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPlaceholder: '请输入申请备注（可选）',
          type: 'info',
        }
      );
      const res = await resubmitRegularizationApi(detail.value.id, { applicationRemark: value });
      ElMessage.success('已重新提交');
      detail.value = res;
      emit('action', 'resubmit', res);
    } catch { /* cancel */ }
  }
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style lang="scss" scoped>
.drawer-header-status {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  margin-top: -8px;
}

.section-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 15px;
    position: relative;

    .score-badge {
      margin-left: auto;
      :deep(.el-badge__content) {
        font-size: 12px;
        padding: 0 10px;
        height: 24px;
        line-height: 24px;
        border-radius: 12px;
      }
      &.badge-excellent :deep(.el-badge__content) { background: #67c23a; }
      &.badge-high :deep(.el-badge__content) { background: #409eff; }
      &.badge-medium :deep(.el-badge__content) { background: #e6a23c; }
      &.badge-danger :deep(.el-badge__content) { background: #f56c6c; }
      &.badge-info :deep(.el-badge__content) { background: #909399; }
    }

    :deep(.el-tag) { margin-left: auto; }
  }
}

.employee-line {
  display: flex;
  align-items: center;
  gap: 8px;

  .inline-avatar {
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
    font-weight: 600;
  }
  .name-text {
    font-weight: 600;
    color: #303133;
  }
}

.probation-info {
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;

  .probation-label {
    display: flex;
    align-items: baseline;
    margin-bottom: 10px;

    .label-text {
      color: #606266;
      font-size: 13px;
    }
    .date-text {
      font-weight: 600;
      color: #303133;
    }
  }

  .remaining-info {
    margin-top: 10px;
    font-size: 13px;
    color: #606266;
    display: flex;
    align-items: center;
    gap: 8px;

    strong {
      font-size: 18px;
      color: #303133;

      &.expiring-soon {
        color: #f56c6c;
        animation: blink 1s ease-in-out infinite;
      }
    }

    .expire-tag {
      animation: blink 1s ease-in-out infinite;
    }
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.score-header {
  display: flex;
  gap: 32px;
  align-items: center;
  padding: 8px 0;
}

.comprehensive-badge {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  color: #fff;
  flex-shrink: 0;

  .badge-value {
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
  }
  .badge-label {
    font-size: 12px;
    margin-top: 6px;
    opacity: 0.9;
  }

  &.badge-excellent { background: linear-gradient(135deg, #67c23a, #85ce61); }
  &.badge-high { background: linear-gradient(135deg, #409eff, #66b1ff); }
  &.badge-medium { background: linear-gradient(135deg, #e6a23c, #ebb563); }
  &.badge-danger { background: linear-gradient(135deg, #f56c6c, #f78989); }
  &.badge-info { background: linear-gradient(135deg, #909399, #a6a9ad); }
}

.match-level-card {
  flex: 1;
  padding: 16px 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid;

  .match-title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
  }
  .match-level-value {
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 6px;
  }
  .match-desc {
    font-size: 12px;
    color: #606266;
  }

  &.match-card-A {
    background: #f0f9eb;
    border-color: #e1f3d8;
    .match-level-value { color: #67c23a; }
  }
  &.match-card-B {
    background: #ecf5ff;
    border-color: #d9ecff;
    .match-level-value { color: #409eff; }
  }
  &.match-card-C {
    background: #fdf6ec;
    border-color: #faecd8;
    .match-level-value { color: #e6a23c; }
  }
  &.match-card-D {
    background: #fef0f0;
    border-color: #fde2e2;
    .match-level-value { color: #f56c6c; }
  }
}

.weight-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;

  .weight-bar {
    flex: 1;
    height: 10px;
    background: #f0f2f5;
    border-radius: 5px;
    overflow: hidden;

    .weight-fill {
      height: 100%;
      background: linear-gradient(90deg, #409eff, #66b1ff);
      border-radius: 5px;
      transition: width 0.3s ease;
    }
  }
  .weight-text {
    font-weight: 600;
    color: #303133;
    width: 50px;
    text-align: right;
    font-size: 13px;
  }
}

.score-text {
  font-weight: 700;
  font-size: 15px;

  &.score-excellent { color: #67c23a; }
  &.score-high { color: #409eff; }
  &.score-medium { color: #e6a23c; }
  &.score-danger { color: #f56c6c; }
}

.remark-box {
  background: #f5f7fa;
  padding: 10px 12px;
  border-radius: 4px;
  line-height: 1.6;
  color: #606266;
  min-height: 40px;
}

.attachments-section {
  margin-top: 16px;

  .attachments-title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .attachments-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;

    &:hover {
      background: #ecf5ff;
      color: #409eff;
    }

    .attachment-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .download-icon {
      font-size: 14px;
      color: #909399;
    }
  }
}

.step-description {
  font-size: 13px;

  .step-info {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .text-success { color: #67c23a; font-weight: 500; }
  .text-danger { color: #f56c6c; font-weight: 500; }
  .text-primary { color: #409eff; font-weight: 500; }
  .text-gray { color: #909399; }
}

.tooltip-content {
  font-size: 12px;
  line-height: 1.8;

  > div {
    white-space: nowrap;
  }
}

.salary-before {
  color: #909399;
  font-weight: 500;
  text-decoration: line-through;
  font-size: 14px;
}

.salary-after {
  color: #67c23a;
  font-weight: 700;
  font-size: 18px;
}

.compliance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compliance-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 6px;
  border: 1px solid;

  &.compliance-pass {
    background: #f0f9eb;
    border-color: #e1f3d8;
    .compliance-icon { color: #67c23a; }
  }
  &.compliance-fail {
    background: #fef0f0;
    border-color: #fde2e2;
    .compliance-icon { color: #f56c6c; }
  }

  .compliance-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .compliance-content {
    flex: 1;
    min-width: 0;

    .compliance-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .fail-tag {
        font-size: 11px;
        padding: 0 6px;
        background: #f56c6c;
        color: #fff;
        border-radius: 10px;
      }
    }

    .compliance-reason {
      font-size: 12px;
      color: #606266;
      line-height: 1.6;
    }
  }
}

.operation-timeline {
  padding-left: 8px;

  :deep(.el-timeline-item__timestamp) {
    color: #909399;
    font-size: 12px;
  }
}

.timeline-item-header {
  margin-bottom: 8px;

  .action-title {
    font-weight: 600;
    color: #303133;
  }

  .operator-info {
    color: #606266;
    font-size: 13px;
  }
}

.timeline-item-content {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;

  .remark-text {
    margin-bottom: 6px;
    color: #606266;
  }

  .changed-fields {
    margin-bottom: 6px;
    color: #606266;
  }

  .update-diff {
    margin: 8px 0;

    .diff-before {
      color: #f56c6c;
      text-decoration: line-through;
    }

    .diff-after {
      color: #67c23a;
      font-weight: 500;
    }
  }

  .ip-address {
    color: #909399;
    font-size: 12px;
    margin-top: 6px;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}
</style>
