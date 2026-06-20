<template>
  <el-drawer
    v-model="visibleLocal"
    :title="drawerTitle"
    size="960px"
    direction="rtl"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading">
      <template v-if="detail">
        <div class="drawer-header-status">
          <el-tag :type="ProbationStatusType[detail.status]" size="default" effect="light">
            <el-icon v-if="detail.status === ProbationStatus.PROBATION"><Clock /></el-icon>
            <el-icon v-else-if="detail.status === ProbationStatus.REVIEWING"><EditPen /></el-icon>
            <el-icon v-else-if="detail.status === ProbationStatus.PASSED"><CircleCheck /></el-icon>
            <el-icon v-else-if="detail.status === ProbationStatus.FAILED"><CircleClose /></el-icon>
            <el-icon v-else-if="detail.status === ProbationStatus.EXTENDED"><Timer /></el-icon>
            {{ ProbationStatusLabel[detail.status] }}
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
                  {{ (detail.employeeName || '?').charAt(0) }}
                </el-avatar>
                <span class="name-text">{{ detail.employeeName || '-' }}</span>
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
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Calendar /></el-icon>
              <span>试用期信息</span>
            </div>
          </template>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="开始日期">{{ formatDate(detail.startDate) }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ formatDate(detail.endDate) }}</el-descriptions-item>
            <el-descriptions-item label="试用期时长">{{ detail.duration ? detail.duration + ' 个月' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="试用期薪资">{{ detail.salaryProbation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="转正薪资">{{ detail.salaryRegular || '-' }}</el-descriptions-item>
            <el-descriptions-item label="实际结束日期">{{ formatDate(detail.actualEndDate) }}</el-descriptions-item>
          </el-descriptions>

          <div class="progress-section">
            <div class="progress-label">
              <span>试用期进度</span>
              <span class="progress-percent">{{ getProgressPercent(detail) }}%</span>
            </div>
            <el-progress
              :percentage="getProgressPercent(detail)"
              :status="getProgressStatus(detail)"
              :stroke-width="14"
            />
          </div>

          <div
            class="compliance-panel"
            :class="detail.durationComplianceResult?.valid ? 'compliance-pass' : 'compliance-fail'"
          >
            <div class="compliance-title">
              <el-icon v-if="detail.durationComplianceResult?.valid"><CircleCheckFilled /></el-icon>
              <el-icon v-else><CircleCloseFilled /></el-icon>
              <span>合规性校验结果 — 时长合规</span>
            </div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="合规状态">
                <el-tag :type="detail.durationComplianceResult?.valid ? 'success' : 'danger'" size="small">
                  {{ detail.durationComplianceResult?.valid ? '合规' : '不合规' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最大允许月数">
                {{ detail.durationComplianceResult?.maxAllowedMonths ?? '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="期望月数">
                {{ detail.durationComplianceResult?.expectedMonths ?? '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="实际月数">
                {{ detail.durationComplianceResult?.actualMonths ?? '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="不合规原因" :span="2">
                {{ detail.durationComplianceResult?.reason || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>考核指标表</span>
              <el-badge
                v-if="detail.comprehensiveScore !== undefined && detail.comprehensiveScore !== null"
                :value="'综合分：' + detail.comprehensiveScore.toFixed(1)"
                :class="['score-badge', getScoreBadgeClass(detail.comprehensiveScore)]"
              >
                <span></span>
              </el-badge>
            </div>
          </template>
          <el-table
            v-if="detail.assessments?.length"
            :data="detail.assessments"
            border
            size="default"
          >
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="name" label="指标名称" min-width="160" />
            <el-table-column label="权重占比" min-width="200">
              <template #default="{ row }">
                <div class="weight-bar-wrapper">
                  <div class="weight-bar">
                    <div
                      class="weight-fill"
                      :style="{ width: (row.weight || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="weight-text">{{ row.weight || 0 }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="分数" width="120" align="center">
              <template #default="{ row }">
                <span :class="['score-text', getScoreClass(row.score)]">
                  {{ row.score !== undefined && row.score !== null ? row.score.toFixed(1) : '-' }}
                </span>
                <span v-if="row.maxScore">/{{ row.maxScore }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="考核说明" min-width="200">
              <template #default="{ row }">
                {{ row.description || '-' }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无考核指标" :image-size="80" />

          <div v-if="detail.comprehensiveScore !== undefined && detail.comprehensiveScore !== null" class="comprehensive-badge-wrap">
            <div :class="['comprehensive-badge', getScoreBadgeClass(detail.comprehensiveScore)]">
              <div class="badge-value">{{ detail.comprehensiveScore.toFixed(1) }}</div>
              <div class="badge-label">综合得分</div>
            </div>
          </div>
        </el-card>

        <el-card
          v-if="detail.status === ProbationStatus.PASSED || detail.status === ProbationStatus.FAILED || detail.isAssessed"
          class="section-card"
          shadow="never"
        >
          <template #header>
            <div class="card-header">
              <el-icon><Medal /></el-icon>
              <span>最终考核结果</span>
            </div>
          </template>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="考核结果">
              <el-tag
                v-if="detail.reviewResult === 'passed'"
                type="success"
                size="default"
                effect="dark"
              >
                PASSED 试用通过
              </el-tag>
              <el-tag
                v-else-if="detail.reviewResult === 'failed'"
                type="danger"
                size="default"
                effect="dark"
              >
                FAILED 试用不通过
              </el-tag>
              <el-tag v-else type="warning" size="default">已考核</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="考核分数">
              <span :class="['score-text-lg', getScoreClass(detail.reviewScore ?? detail.comprehensiveScore)]">
                {{ (detail.reviewScore ?? detail.comprehensiveScore) !== undefined && (detail.reviewScore ?? detail.comprehensiveScore) !== null
                  ? (detail.reviewScore ?? detail.comprehensiveScore)?.toFixed(1) : '-' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="考核日期">{{ formatDateTime(detail.reviewDate) }}</el-descriptions-item>
            <el-descriptions-item label="考核评语" :span="3">
              <div class="comment-box">{{ detail.reviewComment || '无评语' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><DocumentChecked /></el-icon>
              <span>合规校验面板</span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="check-item-card" :class="detail.durationComplianceChecked ? 'check-pass' : 'check-fail'">
                <div class="check-header">
                  <el-icon size="20"><CircleCheckFilled v-if="detail.durationComplianceChecked" /><CircleCloseFilled v-else /></el-icon>
                  <span class="check-name">时长合规</span>
                </div>
                <div class="check-desc">
                  {{ detail.durationComplianceChecked ? '试用期时长符合规定' : '时长不合规，请检查' }}
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div
                class="check-item-card"
                :class="detail.assessmentStandardCheck?.valid ? 'check-pass' : 'check-fail'"
              >
                <div class="check-header">
                  <el-icon size="20"><CircleCheckFilled v-if="detail.assessmentStandardCheck?.valid" /><CircleCloseFilled v-else /></el-icon>
                  <span class="check-name">考核标准合规</span>
                </div>
                <div class="check-desc">
                  权重总计: {{ detail.assessmentStandardCheck?.totalWeight ?? '-' }}%
                  <span v-if="detail.assessmentStandardCheck?.missingItems?.length">
                    | 缺少: {{ detail.assessmentStandardCheck.missingItems.join(',') }}
                  </span>
                </div>
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <el-descriptions :column="2" border size="default" title="微调原因历史">
            <el-descriptions-item label="记录数">
              {{ (detail as any).adjustHistory?.length || 0 }} 条
            </el-descriptions-item>
            <el-descriptions-item label="说明">
              <el-tag v-if="(detail as any).adjustHistory?.length" type="warning" size="small">存在微调</el-tag>
              <el-tag v-else type="info" size="small">无微调</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty
            v-if="!(detail as any).adjustHistory?.length"
            description="暂无微调记录"
            :image-size="60"
          />
          <el-timeline v-else class="adjust-timeline">
            <el-timeline-item
              v-for="(adj, idx) in (detail as any).adjustHistory || []"
              :key="'adj-' + idx"
              :timestamp="formatDateTime(adj.time)"
              placement="top"
              type="warning"
            >
              <div class="adjust-item">
                <strong>{{ adj.fieldName }}：</strong>
                <span class="diff-before">{{ adj.beforeValue }}</span>
                <el-icon><Right /></el-icon>
                <span class="diff-after">{{ adj.afterValue }}</span>
                <span class="reason-tag" v-if="adj.reason">（原因: {{ adj.reason }}）</span>
              </div>
            </el-timeline-item>
          </el-timeline>

          <el-divider />

          <div class="extend-header">
            <el-icon><Clock /></el-icon>
            <span>延长历史时间线</span>
            <el-tag v-if="detail.extendHistory?.length" type="warning" size="small">
              延长 {{ detail.extendHistory.length }} 次
            </el-tag>
          </div>
          <el-empty
            v-if="!detail.extendHistory?.length"
            description="暂无延长记录"
            :image-size="60"
          />
          <el-timeline v-else class="extend-timeline">
            <el-timeline-item
              v-for="(ext, idx) in detail.extendHistory"
              :key="'ext-' + idx"
              :timestamp="formatDateTime(ext.created_at)"
              placement="top"
              :type="idx === 0 ? 'warning' : ''"
            >
              <div class="extend-item">
                <div class="extend-header-row">
                  <strong>延长 {{ ext.extendDays }} 天</strong>
                  <span class="operator-tag">操作人: {{ ext.operatorName || '系统' }}</span>
                </div>
                <div class="extend-dates">
                  {{ formatDate(ext.originalEndDate) }}
                  <el-icon><Right /></el-icon>
                  {{ formatDate(ext.newEndDate) }}
                </div>
                <div v-if="ext.reason" class="extend-reason">
                  <strong>原因：</strong>{{ ext.reason }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Clock /></el-icon>
              <span>全周期操作溯源</span>
            </div>
          </template>
          <el-timeline v-if="sortedLogs.length" class="operation-timeline">
            <el-timeline-item
              v-for="log in sortedLogs"
              :key="log.id"
              :timestamp="formatDateTime(log.created_at)"
              placement="top"
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
              <el-icon><Link /></el-icon>
              <span>关联信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="入职登记ID">
              <span class="link-id" @click="jumpToOnboardDetail">
                {{ detail.onboardId }}
                <el-icon><Link /></el-icon>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="简历ID">{{ detail.resumeId }}</el-descriptions-item>
            <el-descriptions-item label="岗位ID">{{ detail.jobId }}</el-descriptions-item>
            <el-descriptions-item label="操作">
              <el-button type="primary" link size="small" @click="jumpToOnboardDetail">
                跳转入职登记详情
              </el-button>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </template>

      <el-empty v-else-if="!loading" description="未找到试用期详情数据" />
    </div>

    <template #footer>
      <div class="drawer-footer">
        <template v-if="!isStatusLocked && detail">
          <el-button @click="handleAction('set-assessments')" v-ripple>设置考核指标</el-button>
          <el-button @click="handleAction('edit-duration')" v-ripple>编辑时长</el-button>
          <el-button type="warning" @click="handleAction('extend')" v-ripple>延长试用期</el-button>
          <el-button type="danger" @click="handleAction('fail')" v-ripple>试用不通过</el-button>
          <el-button type="success" @click="handleAction('pass')" v-ripple>转正通过</el-button>
        </template>
        <template v-else>
          <el-tag type="info">当前状态已锁定，无法进行操作</el-tag>
        </template>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Clock, EditPen, CircleCheck, CircleClose, Timer, User, Calendar,
  DataAnalysis, Medal, DocumentChecked, Link, Right, CircleCheckFilled, CircleCloseFilled,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import {
  getProbationDetailApi,
  type ProbationItem,
  type ProbationOperationLogItem,
  ProbationStatus,
  ProbationStatusLabel,
  ProbationStatusType,
  ProbationOperationAction,
  ProbationOperationActionLabel,
  PROBATION_LOCKED_STATUSES,
  EXPIRING_SOON_DAYS,
} from '@/api/probation';
import { DATE_FORMAT, DATETIME_FORMAT } from '@/constants/recruitment';

interface Props {
  visible: boolean;
  probationId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'action', actionType: string, row: ProbationItem): void;
}>();

const router = useRouter();
const visibleLocal = ref(props.visible);
const loading = ref(false);
const detail = ref<ProbationItem | null>(null);

watch(
  () => props.visible,
  (val) => {
    visibleLocal.value = val;
    if (val && props.probationId) {
      fetchDetail();
    }
  },
  { immediate: true }
);

watch(visibleLocal, (val) => {
  emit('update:visible', val);
});

const drawerTitle = computed(() => {
  if (detail.value?.employeeName) {
    return `试用期详情 - ${detail.value.employeeName}`;
  }
  return '试用期详情';
});

const isStatusLocked = computed(() => {
  if (!detail.value) return true;
  return PROBATION_LOCKED_STATUSES.includes(detail.value.status);
});

const sortedLogs = computed(() => {
  if (!detail.value?.operationLogs) return [];
  return [...detail.value.operationLogs].sort(
    (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
  );
});

const fetchDetail = async () => {
  loading.value = true;
  try {
    detail.value = await getProbationDetailApi(props.probationId);
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
  const remaining = dayjs(row.endDate).diff(dayjs(), 'day');
  if (remaining <= EXPIRING_SOON_DAYS && remaining >= 0) return 'warning';
  return undefined;
};

const getScoreClass = (score?: number) => {
  if (score === undefined || score === null) return '';
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  if (score >= 40) return 'score-low';
  return 'score-danger';
};

const getScoreBadgeClass = (score?: number) => {
  if (score === undefined || score === null) return 'badge-info';
  if (score >= 80) return 'badge-high';
  if (score >= 60) return 'badge-medium';
  if (score >= 40) return 'badge-low';
  return 'badge-danger';
};

const getActionLabel = (action: ProbationOperationAction | string) => {
  return (ProbationOperationActionLabel as any)[action] || action;
};

const getFieldValue = (obj: any, key: string) => {
  if (!obj) return '-';
  const val = obj[key];
  if (val === undefined || val === null || val === '') return '-';
  return String(val);
};

const handleAction = (actionType: string) => {
  if (!detail.value) return;
  emit('action', actionType, detail.value);
};

const jumpToOnboardDetail = () => {
  if (detail.value?.onboardId) {
    router.push({ path: '/onboard', query: { id: detail.value.onboardId } });
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
      &.badge-high :deep(.el-badge__content) { background: #67c23a; }
      &.badge-medium :deep(.el-badge__content) { background: #409eff; }
      &.badge-low :deep(.el-badge__content) { background: #e6a23c; }
      &.badge-danger :deep(.el-badge__content) { background: #f56c6c; }
      &.badge-info :deep(.el-badge__content) { background: #909399; }
    }
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

.progress-section {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    color: #606266;
    font-weight: 500;

    .progress-percent {
      font-weight: 600;
      color: #303133;
    }
  }
}

.compliance-panel {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid;

  &.compliance-pass {
    background: #f0f9eb;
    border-color: #e1f3d8;
  }
  &.compliance-fail {
    background: #fef0f0;
    border-color: #fde2e2;
  }

  .compliance-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 12px;
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

  &.score-high { color: #67c23a; }
  &.score-medium { color: #409eff; }
  &.score-low { color: #e6a23c; }
  &.score-danger { color: #f56c6c; }
}

.score-text-lg {
  font-weight: 700;
  font-size: 22px;

  &.score-high { color: #67c23a; }
  &.score-medium { color: #409eff; }
  &.score-low { color: #e6a23c; }
  &.score-danger { color: #f56c6c; }
}

.comprehensive-badge-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
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

  &.badge-high { background: linear-gradient(135deg, #67c23a, #85ce61); }
  &.badge-medium { background: linear-gradient(135deg, #409eff, #66b1ff); }
  &.badge-low { background: linear-gradient(135deg, #e6a23c, #ebb563); }
  &.badge-danger { background: linear-gradient(135deg, #f56c6c, #f78989); }
  &.badge-info { background: linear-gradient(135deg, #909399, #a6a9ad); }
}

.comment-box {
  background: #f5f7fa;
  padding: 10px 12px;
  border-radius: 4px;
  line-height: 1.6;
  color: #606266;
}

.check-item-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;

  &.check-pass {
    background: #f0f9eb;
    border-color: #e1f3d8;

    .check-name { color: #529b2e; }
    :deep(.el-icon) { color: #67c23a; }
  }
  &.check-fail {
    background: #fef0f0;
    border-color: #fde2e2;

    .check-name { color: #c45656; }
    :deep(.el-icon) { color: #f56c6c; }
  }

  .check-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .check-name {
      font-weight: 600;
      font-size: 14px;
    }
  }

  .check-desc {
    font-size: 12px;
    color: #606266;
    padding-left: 28px;
  }
}

.extend-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;

  :deep(.el-tag) { margin-left: 8px; }
}

.adjust-timeline, .extend-timeline {
  padding-left: 8px;
  margin-top: 12px;
}

.adjust-item {
  font-size: 13px;
  line-height: 1.8;

  .diff-before {
    color: #f56c6c;
    text-decoration: line-through;
    margin: 0 4px;
  }
  .diff-after {
    color: #67c23a;
    font-weight: 500;
    margin: 0 4px;
  }
  .reason-tag {
    color: #909399;
    margin-left: 8px;
  }
}

.extend-item {
  font-size: 13px;
  line-height: 1.8;

  .extend-header-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;

    .operator-tag {
      color: #909399;
      font-size: 12px;
    }
  }
  .extend-dates {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;
  }
  .extend-reason {
    margin-top: 6px;
    padding: 6px 10px;
    background: #f5f7fa;
    border-radius: 4px;
    color: #606266;
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

.link-id {
  color: #409eff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
