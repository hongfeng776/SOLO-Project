<template>
  <el-dialog
    v-model="visibleLocal"
    :title="dialogTitle"
    width="960px"
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template v-if="mode === 'set-assessments'">
      <el-alert
        title="批量设置考核指标 —— 可为选中人员统一设置考核指标模板"
        type="info"
        show-icon
        :closable="false"
        class="mode-alert"
      />

      <div class="normalize-section">
        <div class="normalize-label">规整方式（可选）：</div>
        <el-checkbox-group v-model="normalizeBy">
          <el-checkbox value="entry_batch">按入职批次</el-checkbox>
          <el-checkbox value="job_category">按岗位类别</el-checkbox>
          <el-checkbox value="all">全部</el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="section-title">考核指标模板设置：</div>
      <div class="assessments-toolbar">
        <el-button type="primary" plain size="small" @click="addAssessment" v-ripple>
          <el-icon><Plus /></el-icon>
          添加指标
        </el-button>
        <span class="weight-tip" :class="{ 'text-danger': totalWeight !== 100 }">
          权重总计: {{ totalWeight }}%{{ totalWeight !== 100 ? '（建议100%）' : ' ✓' }}
        </span>
      </div>

      <el-table
        :data="assessmentTemplate"
        border
        size="small"
        class="assessments-table"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column label="指标名称" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.name" size="small" placeholder="请输入指标名称" />
          </template>
        </el-table-column>
        <el-table-column label="权重(%)" width="130">
          <template #default="{ row }">
            <el-input-number
              v-model="row.weight"
              :min="0"
              :max="100"
              size="small"
              :step="5"
              style="width: 100%"
              :controls="false"
            />
          </template>
        </el-table-column>
        <el-table-column label="满分" width="110">
          <template #default="{ row }">
            <el-input-number
              v-model="row.maxScore"
              :min="0"
              :max="100"
              size="small"
              style="width: 100%"
              :controls="false"
            />
          </template>
        </el-table-column>
        <el-table-column label="描述说明" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.description" size="small" placeholder="可选：考核标准说明" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button
              type="danger"
              link
              size="small"
              :disabled="assessmentTemplate.length <= 1"
              @click="removeAssessment($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="section-title">待处理预览列表：</div>
      <div v-if="filteredCount < selectedItems.length" class="filter-notice">
        <el-tag type="info" size="small">
          已过滤 {{ selectedItems.length - filteredCount }} 条非本人负责的记录
        </el-tag>
      </div>
      <el-table
        v-if="filteredItems.length"
        :data="filteredItems"
        border
        size="small"
        max-height="280"
        class="preview-table"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column prop="employeeName" label="姓名" width="100">
          <template #default="{ row }">
            {{ row.employeeName || row.resume?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="employeeNo" label="工号" width="110" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="130" />
        <el-table-column prop="jobLevel" label="职级" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.jobLevel" size="small">{{ row.jobLevel }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="mentor" label="导师" width="90" />
        <el-table-column prop="entryBatch" label="入职批次" width="100" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ProbationStatusType[row.status]" size="small">
              {{ ProbationStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无可处理的记录" style="margin-top: 16px" />

      <div v-if="executionResults.length" class="execution-results">
        <el-divider content-position="left">执行结果</el-divider>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="总数">{{ executionSummary.total }}</el-descriptions-item>
          <el-descriptions-item label="成功" type="success">
            <span class="text-success">{{ executionSummary.success }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败" type="danger">
            <span class="text-danger">{{ executionSummary.failed }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-table
          v-if="executionResults.length"
          :data="executionResults"
          border
          size="small"
          max-height="200"
          style="margin-top: 12px"
        >
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column label="员工" width="120">
            <template #default="{ row }">
              {{ row.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="结果" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.success" class="icon-success"><CircleCheckFilled /></el-icon>
              <el-icon v-else class="icon-fail"><CircleCloseFilled /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="失败原因" prop="reason">
            <template #default="{ row }">
              <span v-if="row.success">-</span>
              <span v-else class="text-danger">{{ row.reason }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <template v-else-if="mode === 'update-status'">
      <el-alert
        title="仅管理员可执行批量状态更新操作"
        type="warning"
        show-icon
        :closable="false"
        class="mode-alert"
      />

      <el-form label-width="100px" style="margin-top: 16px">
        <el-form-item label="操作类型" required>
          <el-radio-group v-model="updateAction" size="default">
            <el-radio value="pass" border>批量通过</el-radio>
            <el-radio value="fail" border>批量不通过</el-radio>
            <el-radio value="extend" border>批量延长</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="updateAction === 'extend'">
          <el-form-item label="延长天数" required>
            <el-input-number
              v-model="extendDays"
              :min="1"
              :max="90"
              :step="1"
              placeholder="1-90天"
              style="width: 200px"
            />
            <span class="form-tip">天</span>
          </el-form-item>
          <el-form-item label="延长原因" required>
            <el-input
              v-model="extendReason"
              type="textarea"
              :rows="3"
              placeholder="请统一填写延长原因（必填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="统一评语" :required="updateAction === 'fail'">
            <el-input
              v-model="reviewComment"
              type="textarea"
              :rows="3"
              :placeholder="updateAction === 'fail' ? '请填写不通过原因（必填）' : '请填写考核评语（可选）'"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </template>
      </el-form>

      <div class="section-title">待处理预览列表：</div>
      <el-table
        v-if="selectedItems.length"
        :data="selectedItems"
        border
        size="small"
        max-height="320"
        class="preview-table"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">
            {{ row.employeeName || row.resume?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="employeeNo" label="工号" width="110" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="130" />
        <el-table-column label="试用期" width="220">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }} ~ {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ProbationStatusType[row.status]" size="small">
              {{ ProbationStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="executionResults.length" class="execution-results">
        <el-divider content-position="left">执行结果</el-divider>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="总数">{{ executionSummary.total }}</el-descriptions-item>
          <el-descriptions-item label="成功" type="success">
            <span class="text-success">{{ executionSummary.success }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败" type="danger">
            <span class="text-danger">{{ executionSummary.failed }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-table
          v-if="executionResults.length"
          :data="executionResults"
          border
          size="small"
          max-height="200"
          style="margin-top: 12px"
        >
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column label="员工" width="120">
            <template #default="{ row }">
              {{ row.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="结果" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.success" class="icon-success"><CircleCheckFilled /></el-icon>
              <el-icon v-else class="icon-fail"><CircleCloseFilled /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="失败原因" prop="reason">
            <template #default="{ row }">
              <span v-if="row.success">-</span>
              <span v-else class="text-danger">{{ row.reason }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <template #footer>
      <el-button @click="handleClose" v-ripple>取消</el-button>
      <el-button
        v-if="mode === 'set-assessments'"
        type="primary"
        :loading="submitting"
        :disabled="!filteredItems.length || !isAssessmentValid"
        @click="handleSetAssessments"
        v-ripple
      >
        开始执行（{{ filteredCount }}条）
      </el-button>
      <el-button
        v-else-if="mode === 'update-status'"
        :type="updateAction === 'fail' ? 'danger' : 'success'"
        :loading="submitting"
        :disabled="!isUpdateActionValid"
        @click="handleUpdateStatus"
        v-ripple
      >
        确认执行（{{ selectedItems.length }}条）
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="permissionDialogVisible"
    title="权限不足"
    width="400px"
    :close-on-click-modal="false"
    align-center
  >
    <div class="permission-denied">
      <el-icon class="lock-icon" size="64" color="#e6a23c"><Lock /></el-icon>
      <div class="denied-text">
        <h3>权限不足</h3>
        <p>当前操作仅管理员可执行，请联系系统管理员获取权限。</p>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="permissionDialogVisible = false" v-ripple>
        我知道了
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Plus, Lock, CircleCheckFilled, CircleCloseFilled,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/modules/user';
import {
  batchSetAssessmentsApi,
  passProbationApi,
  failProbationApi,
  extendProbationApi,
  startProbationReviewApi,
  type ProbationItem,
  type AssessmentItem,
  ProbationStatus,
  ProbationStatusLabel,
  ProbationStatusType,
  PROBATION_LOCKED_STATUSES,
} from '@/api/probation';
import { DATE_FORMAT, UserRole } from '@/constants/recruitment';

interface Props {
  visible: boolean;
  mode: 'set-assessments' | 'update-status';
  selectedItems?: ProbationItem[];
  isAdmin?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedItems: () => [],
  isAdmin: false,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', msg?: string): void;
}>();

const userStore = useUserStore();
const visibleLocal = ref(props.visible);
const permissionDialogVisible = ref(false);
const submitting = ref(false);

watch(
  () => props.visible,
  (val) => {
    visibleLocal.value = val;
    if (val) {
      initData();
    }
  }
);

watch(visibleLocal, (val) => {
  emit('update:visible', val);
});

const dialogTitle = computed(() => {
  switch (props.mode) {
    case 'set-assessments':
      return '批量设置考核指标';
    case 'update-status':
      return '批量更新状态';
    default:
      return '批量操作';
  }
});

const effectiveIsAdmin = computed(() => {
  return props.isAdmin || userStore.userInfo?.role === UserRole.ADMIN;
});

const effectiveCurrentUserId = computed(() => {
  return userStore.userInfo?.id || 0;
});

const normalizeBy = ref<string[]>([]);

const defaultAssessmentTemplate = (): AssessmentItem[] => [
  { name: '工作能力', weight: 30, maxScore: 100, description: '专业技能、解决问题能力' },
  { name: '工作态度', weight: 25, maxScore: 100, description: '责任心、积极性、团队协作' },
  { name: '学习能力', weight: 20, maxScore: 100, description: '新知识吸收、适应能力' },
  { name: '出勤纪律', weight: 15, maxScore: 100, description: '考勤情况、遵守制度' },
  { name: '沟通表达', weight: 10, maxScore: 100, description: '沟通能力、表达清晰度' },
];

const assessmentTemplate = ref<AssessmentItem[]>(defaultAssessmentTemplate());

const totalWeight = computed(() => {
  return assessmentTemplate.value.reduce((sum, item) => sum + (item.weight || 0), 0);
});

const isAssessmentValid = computed(() => {
  return assessmentTemplate.value.some(a => a.name && a.name.trim());
});

const createEmptyAssessment = (): AssessmentItem => ({
  name: '',
  weight: 20,
  maxScore: 100,
  description: '',
});

const addAssessment = () => {
  assessmentTemplate.value.push(createEmptyAssessment());
};

const removeAssessment = (index: number) => {
  if (assessmentTemplate.value.length <= 1) return;
  assessmentTemplate.value.splice(index, 1);
};

const canOperateItem = (row: ProbationItem) => {
  if (effectiveIsAdmin.value) return true;
  if (PROBATION_LOCKED_STATUSES.includes(row.status)) return false;
  return !row.hrOperatorId || row.hrOperatorId === effectiveCurrentUserId.value;
};

const filteredItems = computed(() => {
  if (effectiveIsAdmin.value) {
    return props.selectedItems.filter(r => !PROBATION_LOCKED_STATUSES.includes(r.status));
  }
  return props.selectedItems.filter(r => canOperateItem(r));
});

const filteredCount = computed(() => filteredItems.value.length);

const updateAction = ref<'pass' | 'fail' | 'extend'>('pass');
const extendDays = ref<number>(30);
const extendReason = ref('');
const reviewComment = ref('');

const isUpdateActionValid = computed(() => {
  if (!effectiveIsAdmin.value) return false;
  if (props.selectedItems.length === 0) return false;
  if (updateAction.value === 'extend') {
    return extendDays.value >= 1 && extendDays.value <= 90 && !!extendReason.value.trim();
  }
  if (updateAction.value === 'fail') {
    return !!reviewComment.value.trim();
  }
  return true;
});

interface ExecutionResultItem {
  id: number;
  name: string;
  success: boolean;
  reason?: string;
}

const executionResults = ref<ExecutionResultItem[]>([]);

const executionSummary = computed(() => {
  const total = executionResults.value.length;
  const success = executionResults.value.filter(r => r.success).length;
  return {
    total,
    success,
    failed: total - success,
  };
});

const formatDate = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATE_FORMAT);
};

const initData = () => {
  executionResults.value = [];
  assessmentTemplate.value = defaultAssessmentTemplate();
  normalizeBy.value = [];
  updateAction.value = 'pass';
  extendDays.value = 30;
  extendReason.value = '';
  reviewComment.value = '';

  if (props.mode === 'set-assessments') {
    const filteredOut = props.selectedItems.length - filteredCount.value;
    if (filteredOut > 0) {
      ElMessage.info(`已过滤 ${filteredOut} 条非本人负责的记录`);
    }
  }
};

const checkAdminPermission = () => {
  if (!effectiveIsAdmin.value) {
    permissionDialogVisible.value = true;
    return false;
  }
  return true;
};

const handleSetAssessments = async () => {
  if (filteredItems.value.length === 0) {
    ElMessage.warning('暂无可处理的记录');
    return;
  }

  const validAssessments = assessmentTemplate.value.filter(a => a.name && a.name.trim());
  if (validAssessments.length === 0) {
    ElMessage.warning('请至少填写一项考核指标');
    return;
  }

  submitting.value = true;
  executionResults.value = [];

  try {
    const ids = filteredItems.value.map(r => r.id);
    let normalizeParam: 'entry_batch' | 'job_category' | 'all' | undefined;
    if (normalizeBy.value.includes('all')) {
      normalizeParam = 'all';
    } else if (normalizeBy.value.includes('entry_batch') && normalizeBy.value.includes('job_category')) {
      normalizeParam = 'all';
    } else if (normalizeBy.value.includes('entry_batch')) {
      normalizeParam = 'entry_batch';
    } else if (normalizeBy.value.includes('job_category')) {
      normalizeParam = 'job_category';
    }

    const result = await batchSetAssessmentsApi({
      ids,
      assessments: validAssessments,
      normalizeBy: normalizeParam,
    });

    executionResults.value = filteredItems.value.map(item => {
      const failedItem = result.failedList?.find(f => f.id === item.id);
      return {
        id: item.id,
        name: item.employeeName || (item as any).resume?.name || '-',
        success: !failedItem,
        reason: failedItem?.reason,
      };
    });

    if (result.success > 0) {
      emit('success', `批量设置考核指标完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
    } else {
      ElMessage.warning('批量设置全部失败，请检查错误详情');
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '批量设置失败');
  } finally {
    submitting.value = false;
  }
};

const handleUpdateStatus = async () => {
  if (!checkAdminPermission()) return;
  if (props.selectedItems.length === 0) {
    ElMessage.warning('暂无可处理的记录');
    return;
  }

  submitting.value = true;
  executionResults.value = [];

  const results: ExecutionResultItem[] = [];
  let successCount = 0;

  for (const item of props.selectedItems) {
    try {
      if (PROBATION_LOCKED_STATUSES.includes(item.status)) {
        results.push({
          id: item.id,
          name: item.employeeName || (item as any).resume?.name || '-',
          success: false,
          reason: '当前状态已锁定，无法修改',
        });
        continue;
      }

      await startProbationReviewApi(item.id).catch(() => {});

      if (updateAction.value === 'pass') {
        await passProbationApi(item.id, reviewComment.value || undefined);
      } else if (updateAction.value === 'fail') {
        await failProbationApi(item.id, reviewComment.value);
      } else {
        await extendProbationApi(item.id, extendDays.value, extendReason.value);
      }

      successCount += 1;
      results.push({
        id: item.id,
        name: item.employeeName || (item as any).resume?.name || '-',
        success: true,
      });
    } catch (e: any) {
      results.push({
        id: item.id,
        name: item.employeeName || (item as any).resume?.name || '-',
        success: false,
        reason: e?.message || '操作失败',
      });
    }
  }

  executionResults.value = results;

  if (successCount > 0) {
    const actionLabel = {
      pass: '批量通过',
      fail: '批量不通过',
      extend: '批量延长',
    }[updateAction.value];
    emit('success', `${actionLabel}完成：成功 ${successCount} 条，失败 ${results.length - successCount} 条`);
  } else {
    ElMessage.warning('批量操作全部失败，请检查错误详情');
  }

  submitting.value = false;
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style lang="scss" scoped>
.mode-alert {
  margin-bottom: 16px;
}

.normalize-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;

  .normalize-label {
    font-weight: 500;
    color: #606266;
    flex-shrink: 0;
  }
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin: 16px 0 10px;
  font-size: 14px;
}

.assessments-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  .weight-tip {
    font-size: 13px;
    color: #909399;

    &.text-danger {
      color: #f56c6c;
      font-weight: 500;
    }
  }
}

.assessments-table {
  margin-bottom: 8px;
}

.preview-table {
  margin-bottom: 8px;
}

.filter-notice {
  text-align: right;
  margin-bottom: 8px;
}

.execution-results {
  margin-top: 20px;

  .text-success {
    color: #67c23a;
    font-weight: 600;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .icon-success {
    color: #67c23a;
    font-size: 18px;
  }

  .icon-fail {
    color: #f56c6c;
    font-size: 18px;
  }
}

.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;

  .lock-icon {
    margin-bottom: 20px;
  }

  .denied-text {
    text-align: center;

    h3 {
      margin: 0 0 12px;
      color: #303133;
      font-size: 18px;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.6;
    }
  }
}
</style>
