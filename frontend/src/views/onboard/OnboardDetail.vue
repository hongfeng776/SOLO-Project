<template>
  <el-drawer
    v-model="visibleLocal"
    :title="`入职详情 - ${data?.name || '-'}`"
    size="900px"
    direction="rtl"
    destroy-on-close
    @close="handleClose"
  >
    <template v-if="data">
      <div class="drawer-header-status">
        <el-tag :type="OnboardStatusType[data.status]" size="default">
          {{ OnboardStatusLabel[data.status] }}
        </el-tag>
      </div>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>👤 基本信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="default">
          <el-descriptions-item label="候选人姓名">{{ data.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ data.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ data.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ formatGender(data.gender) }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ data.age || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ data.idCard || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学历">{{ formatEducation(data.education) }}</el-descriptions-item>
          <el-descriptions-item label="毕业院校">{{ data.school || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ data.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ data.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ data.position || '-' }}</el-descriptions-item>
          <el-descriptions-item label="职级">{{ data.jobLevel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="汇报对象">{{ data.reportTo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工作性质">{{ formatWorkType(data.workType) }}</el-descriptions-item>
          <el-descriptions-item label="工作地点">{{ data.workLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="对接HR">{{ data.hrOperatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提审时间">{{ formatDateTime(data.submitTime) }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ formatDateTime(data.auditTime) }}</el-descriptions-item>
          <el-descriptions-item label="审核人" :span="3">{{ data.auditUserName || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>💰 薪资待遇</span>
          </div>
        </template>
        <el-alert
          v-if="salaryMismatchWarning"
          type="warning"
          show-icon
          title="⚠️ 该薪资与岗位职级匹配度存在偏差"
          class="salary-warning"
        />
        <el-descriptions :column="3" border size="default">
          <el-descriptions-item label="Offer薪资">
            <span class="highlight-salary">
              {{ formatSalary(data.salaryMin, data.salaryMax) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="基本工资">{{ data.salaryBase || '-' }}</el-descriptions-item>
          <el-descriptions-item label="绩效工资">{{ data.salaryPerformance || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年终奖">{{ data.salaryBonus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="试用期(月)">{{ data.probationPeriod || '-' }}</el-descriptions-item>
          <el-descriptions-item label="试用期薪资">{{ data.probationSalary || '-' }}</el-descriptions-item>
          <el-descriptions-item label="薪资单位" :span="3">{{ data.salaryUnit || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>📄 合同与入职日期</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="default">
          <el-descriptions-item label="合同类型">{{ formatContractType(data.contractType) }}</el-descriptions-item>
          <el-descriptions-item label="合同期限(年)">{{ data.contractTerm || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计入职日期">{{ formatDate(data.onboardDate) }}</el-descriptions-item>
          <el-descriptions-item label="实际入职日期">{{ formatDate(data.actualOnboardDate) }}</el-descriptions-item>
          <el-descriptions-item label="合同签订状态">
            <el-tag v-if="data.contractSigned" type="success" size="small">已签订</el-tag>
            <el-tag v-else type="info" size="small">未签订</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签订时间">{{ formatDateTime(data.contractSignTime) }}</el-descriptions-item>
          <el-descriptions-item label="材料齐全状态">
            <el-tag v-if="data.materialsComplete" type="success" size="small">已齐全</el-tag>
            <el-tag v-else type="info" size="small">不齐全</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="核验时间">{{ formatDateTime(data.materialsVerifyTime) }}</el-descriptions-item>
          <el-descriptions-item label="社保/公积金开户" :span="3">
            <div class="social-security-status">
              <div class="status-item">
                <el-icon v-if="data.socialSecurityOpened" :color="'#67c23a'" size="16"><CircleCheckFilled /></el-icon>
                <el-icon v-else :color="'#909399'" size="16"><CircleCloseFilled /></el-icon>
                <span>社保：{{ data.socialSecurityOpened ? '已开户' : '未开户' }}</span>
              </div>
              <div class="status-item">
                <el-icon v-if="data.providentFundOpened" :color="'#67c23a'" size="16"><CircleCheckFilled /></el-icon>
                <el-icon v-else :color="'#909399'" size="16"><CircleCloseFilled /></el-icon>
                <span>公积金：{{ data.providentFundOpened ? '已开户' : '未开户' }}</span>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="data.ledger" class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>📋 台账信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="default">
          <el-descriptions-item label="台账编号">{{ data.ledger.ledgerNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工号">{{ data.ledger.employeeNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="台账生成人">{{ data.ledger.creatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生成时间" :span="2">{{ formatDateTime(data.ledger.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="操作">
            <el-button type="primary" link @click="handleAction('view-ledger', data)">
              查看台账详情
            </el-button>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>📋 简历原始信息 vs 入职登记信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="compare-column-title">简历原始信息</div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item
                v-for="field in compareFields"
                :key="'resume-' + field.key"
                :label="field.label"
                :class="{ 'field-mismatch': isFieldMismatch(field.key) }"
              >
                <template v-if="isFieldMismatch(field.key)">
                  <span class="mismatch-text">{{ getFieldValue(data.resume, field.key) }}</span>
                  <el-tag type="danger" size="small" class="mismatch-tag">⚠️ 不一致</el-tag>
                </template>
                <span v-else>{{ getFieldValue(data.resume, field.key) }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <div class="compare-column-title">入职登记信息</div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item
                v-for="field in compareFields"
                :key="'onboard-' + field.key"
                :label="field.label"
                :class="{ 'field-mismatch': isFieldMismatch(field.key) }"
              >
                <template v-if="isFieldMismatch(field.key)">
                  <span class="mismatch-text">{{ getOnboardFieldValue(field.key) }}</span>
                </template>
                <span v-else>{{ getOnboardFieldValue(field.key) }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        <div v-if="data.consistencyCheckResult" class="consistency-result">
          <el-divider content-position="left">一致性检测结果</el-divider>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="一致性得分">
              <span :class="getScoreClass(data.consistencyCheckResult.score)">
                {{ data.consistencyCheckResult.score }} 分
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="检测字段数">{{ data.consistencyCheckResult.totalFields }}</el-descriptions-item>
            <el-descriptions-item label="一致字段数" type="success">
              {{ data.consistencyCheckResult.matchFields }}
            </el-descriptions-item>
            <el-descriptions-item label="不一致字段数" type="danger">
              {{ data.consistencyCheckResult.mismatchFields }}
            </el-descriptions-item>
            <el-descriptions-item label="不一致字段列表" :span="2">
              <el-tag
                v-for="field in (data.consistencyCheckResult.mismatchFieldList || [])"
                :key="field"
                type="danger"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ getFieldLabel(field) }}
              </el-tag>
              <span v-if="!data.consistencyCheckResult.mismatchFieldList?.length">-</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>🕒 操作溯源记录</span>
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
                {{ OnboardOperationActionLabel[log.action] }}
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
                  {{ getFieldLabel(field) }}
                </el-tag>
              </div>
              <div v-if="log.action === OnboardOperationAction.APPROVE && log.remark" class="audit-remark">
                <el-tag type="success" size="small">审核通过备注</el-tag>
                <span class="remark-content">{{ log.remark }}</span>
              </div>
              <div v-if="log.action === OnboardOperationAction.REJECT && log.remark" class="audit-remark">
                <el-tag type="danger" size="small">审核驳回原因</el-tag>
                <span class="remark-content">{{ log.remark }}</span>
              </div>
              <div v-if="log.action === OnboardOperationAction.UPDATE && log.beforeData && log.afterData" class="update-diff">
                <div class="diff-item">
                  <el-descriptions :column="2" border size="small">
                    <template v-for="field in (log.changedFields || [])" :key="field">
                      <el-descriptions-item :label="`变更前 - ${getFieldLabel(field)}`">
                        <span class="diff-before">{{ getFieldValue(log.beforeData, field) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item :label="`变更后 - ${getFieldLabel(field)}`">
                        <span class="diff-after">{{ getFieldValue(log.afterData, field) }}</span>
                      </el-descriptions-item>
                    </template>
                  </el-descriptions>
                </div>
              </div>
              <div v-if="log.ipAddress" class="ip-address">
                IP地址：{{ log.ipAddress }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无操作记录" />
      </el-card>
    </template>

    <template #footer>
      <div class="drawer-footer">
        <template v-if="data.status === OnboardStatus.PENDING_AUDIT">
          <el-button @click="handleAction('edit', data)">编辑</el-button>
          <el-button type="primary" @click="handleAction('submit', data)">提审</el-button>
          <el-button type="danger" plain @click="handleAction('delete', data)">删除</el-button>
          <template v-if="isAdmin">
            <el-button type="success" @click="handleAction('approve', data)">审核通过</el-button>
            <el-button type="warning" @click="handleAction('reject', data)">审核驳回</el-button>
          </template>
        </template>
        <template v-else-if="data.status === OnboardStatus.AUDIT_REJECTED">
          <el-button @click="handleAction('edit', data)">编辑</el-button>
          <el-button type="primary" @click="handleAction('resubmit', data)">重新提交</el-button>
        </template>
        <template v-else-if="data.status === OnboardStatus.AUDIT_PASSED">
          <el-button type="primary" @click="handleAction('mark-onboarded', data)">标记已入职</el-button>
          <el-button v-if="data.ledger" @click="handleAction('view-ledger', data)">查看台账</el-button>
        </template>
        <template v-else-if="data.status === OnboardStatus.ONBOARDED">
          <el-button v-if="data.ledger" @click="handleAction('view-ledger', data)">查看台账</el-button>
        </template>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/modules/user';
import { type OnboardItem } from '@/api/onboard';
import {
  OnboardStatus,
  OnboardStatusLabel,
  OnboardStatusType,
  OnboardOperationAction,
  OnboardOperationActionLabel,
  DATE_FORMAT,
  DATETIME_FORMAT,
  GenderLabel,
  EducationLabel,
  WorkTypeLabel,
  CONTRACT_TYPE_OPTIONS,
} from '@/constants/recruitment';

interface Props {
  visible: boolean;
  data: OnboardItem;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'action', actionType: string, row: OnboardItem): void;
}>();

const userStore = useUserStore();
const visibleLocal = ref(props.visible);

watch(
  () => props.visible,
  (val) => {
    visibleLocal.value = val;
  }
);

watch(visibleLocal, (val) => {
  emit('update:visible', val);
});

const isAdmin = computed(() => userStore.userInfo?.role === 'admin');

const sortedLogs = computed(() => {
  if (!props.data?.operationLogs) return [];
  return [...props.data.operationLogs].sort(
    (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
  );
});

const salaryMismatchWarning = computed(() => {
  return (props.data as any).salaryMismatchWarning === true;
});

const compareFields = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手机号' },
  { key: 'email', label: '邮箱' },
  { key: 'gender', label: '性别' },
  { key: 'education', label: '学历' },
  { key: 'school', label: '毕业院校' },
  { key: 'major', label: '专业' },
];

const formatGender = (val?: string) => {
  if (!val) return '-';
  return (GenderLabel as any)[val] || val;
};

const formatEducation = (val?: string) => {
  if (!val) return '-';
  return (EducationLabel as any)[val] || val;
};

const formatWorkType = (val?: string) => {
  if (!val) return '-';
  return (WorkTypeLabel as any)[val] || val;
};

const formatContractType = (val?: string) => {
  if (!val) return '-';
  const option = CONTRACT_TYPE_OPTIONS.find((o) => o.value === val);
  return option?.label || val;
};

const formatDate = (val?: string) => {
  if (!val) return '-';
  return dayjs(val).format(DATE_FORMAT);
};

const formatDateTime = (val?: string) => {
  if (!val) return '-';
  return dayjs(val).format(DATETIME_FORMAT);
};

const formatSalary = (min?: number, max?: number) => {
  if (!min && !max) return '-';
  if (min && max) return `${min} - ${max}K`;
  return min ? `${min}K` : `${max}K`;
};

const getFieldValue = (obj: any, key: string) => {
  if (!obj) return '-';
  const val = obj[key];
  if (val === undefined || val === null || val === '') return '-';
  return val;
};

const getOnboardFieldValue = (key: string) => {
  const val = (props.data as any)[key];
  if (val === undefined || val === null || val === '') return '-';
  if (key === 'gender') return formatGender(val);
  if (key === 'education') return formatEducation(val);
  return val;
};

const isFieldMismatch = (key: string) => {
  const resumeVal = props.data?.resume?.[key];
  const onboardVal = (props.data as any)?.[key];
  if (resumeVal === undefined || resumeVal === null || resumeVal === '') return false;
  if (onboardVal === undefined || onboardVal === null || onboardVal === '') return false;
  return String(resumeVal) !== String(onboardVal);
};

const getFieldLabel = (key: string) => {
  const field = compareFields.find((f) => f.key === key);
  return field?.label || key;
};

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-high';
  if (score >= 70) return 'score-medium';
  if (score >= 50) return 'score-low';
  return 'score-danger';
};

const handleClose = () => {
  emit('update:visible', false);
};

const handleAction = (actionType: string, row: OnboardItem) => {
  emit('action', actionType, row);
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
    font-weight: 600;
    font-size: 15px;
  }
}

.salary-warning {
  margin-bottom: 12px;
}

.highlight-salary {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.social-security-status {
  display: flex;
  gap: 24px;

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.compare-column-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.field-mismatch {
  :deep(.el-descriptions__label),
  :deep(.el-descriptions__content) {
    background-color: #fef0f0 !important;
  }
}

.mismatch-text {
  color: #f56c6c;
  font-weight: 500;
}

.mismatch-tag {
  margin-left: 4px;
}

.consistency-result {
  margin-top: 16px;
}

.score-high {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.score-medium {
  color: #409eff;
  font-weight: 600;
  font-size: 16px;
}

.score-low {
  color: #e6a23c;
  font-weight: 600;
  font-size: 16px;
}

.score-danger {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
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

  .audit-remark {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;

    .remark-content {
      color: #606266;
    }
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
}
</style>
