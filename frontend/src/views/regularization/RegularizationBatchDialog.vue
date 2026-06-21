<template>
  <el-dialog
    v-model="visibleLocal"
    :title="dialogTitle"
    width="960px"
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template v-if="mode === 'filter'">
      <el-alert
        title="批量筛选到期人员 —— 根据条件筛选符合转正申请条件的人员"
        type="info"
        show-icon
        :closable="false"
        class="mode-alert"
      />

      <el-form :model="filterForm" inline class="filter-form" label-width="100px">
        <el-form-item label="入职批次">
          <el-select
            v-model="filterForm.entryBatches"
            multiple
            placeholder="请选择入职批次"
            clearable
            style="width: 260px"
          >
            <el-option
              v-for="batch in entryBatchOptions"
              :key="batch"
              :label="batch"
              :value="batch"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位类别">
          <el-select
            v-model="filterForm.jobCategories"
            multiple
            placeholder="请选择岗位类别"
            clearable
            style="width: 260px"
          >
            <el-option
              v-for="(label, value) in JobCategoryLabel"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="checkbox-group">
        <span class="group-label">考核完成度：</span>
        <el-checkbox v-model="filterForm.hasEnoughIndicators">≥5项考核指标</el-checkbox>
        <el-checkbox v-model="filterForm.hasScored">已完成评分</el-checkbox>
        <el-checkbox v-model="filterForm.minScore80">综合分≥80分</el-checkbox>
      </div>

      <div class="action-bar">
        <el-button
          type="primary"
          :icon="Search"
          :loading="filterLoading"
          @click="handleClick(handleFilter)"
          v-ripple
        >
          开始筛选
        </el-button>
        <span v-if="filteredList.length" class="filter-count">
          共筛选出 <strong class="highlight">{{ filteredList.length }}</strong> 名符合条件人员
        </span>
      </div>

      <div class="section-title" v-if="filteredList.length">筛选结果列表（可勾选后一键发起申请）：</div>
      <el-table
        v-if="filteredList.length"
        ref="filterTableRef"
        :data="filteredList"
        border
        size="small"
        max-height="320"
        class="preview-table"
        @selection-change="handleFilterSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">
            {{ row.employeeName || row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="employeeNo" label="工号" width="110" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="130" />
        <el-table-column prop="entryBatch" label="入职批次" width="100" />
        <el-table-column label="试用期" width="220">
          <template #default="{ row }">
            {{ formatDate(row.probationStartDate) }} ~ {{ formatDate(row.probationEndDate) }}
          </template>
        </el-table-column>
        <el-table-column label="综合分" width="100" align="center">
          <template #default="{ row }">
            <span :class="getScoreClass(row.comprehensiveScore)">
              {{ row.comprehensiveScore !== undefined && row.comprehensiveScore !== null ? row.comprehensiveScore.toFixed(1) : '-' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!filterLoading" description="暂无筛选结果，请调整筛选条件" style="margin-top: 16px" />

      <div v-if="selectedFilterIds.length" class="apply-from-filter">
        <el-divider content-position="left">一键发起申请</el-divider>
        <el-form label-width="100px">
          <el-form-item label="申请备注">
            <el-input
              v-model="applyRemarkFromFilter"
              type="textarea"
              :rows="2"
              placeholder="请输入统一申请备注（可选）"
              maxlength="500"
              show-word-limit
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

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

    <template v-else-if="mode === 'apply'">
      <el-alert
        title="批量发起转正申请 —— 将为选中人员统一发起转正申请"
        type="success"
        show-icon
        :closable="false"
        class="mode-alert"
      />

      <div v-if="filteredCount < selectedItems.length" class="filter-notice">
        <el-tag type="info" size="default">
          已过滤 {{ selectedItems.length - filteredCount }} 条非本人负责或状态不允许的记录
        </el-tag>
      </div>

      <el-form label-width="100px" style="margin-top: 16px">
        <el-form-item label="申请备注">
          <el-input
            v-model="applyRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入统一申请备注（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <div class="section-title">待处理预览列表：</div>
      <el-table
        v-if="filteredItems.length"
        :data="filteredItems"
        border
        size="small"
        max-height="320"
        class="preview-table"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">
            {{ row.employeeName || row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="employeeNo" label="工号" width="110" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="130" />
        <el-table-column prop="entryBatch" label="入职批次" width="100" />
        <el-table-column label="试用期" width="220">
          <template #default="{ row }">
            {{ formatDate(row.probationStartDate) }} ~ {{ formatDate(row.probationEndDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="RegularizationStatusType[row.status as RegularizationStatus]" size="small">
              {{ RegularizationStatusLabel[row.status as RegularizationStatus] }}
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

    <template v-else-if="mode === 'approve'">
      <template v-if="!effectiveIsAdmin">
        <el-alert
          title="仅超级管理员可执行批量审批"
          type="error"
          show-icon
          :closable="false"
          class="mode-alert"
        />
        <div class="permission-denied">
          <el-icon class="lock-icon" size="64" color="#f56c6c"><Lock /></el-icon>
          <div class="denied-text">
            <h3>权限不足</h3>
            <p>批量审批操作仅超级管理员可执行，请联系系统管理员获取权限。</p>
          </div>
        </div>
      </template>

      <template v-else>
        <el-alert
          title="批量审批通过 —— 将为选中人员统一审批通过转正申请"
          type="warning"
          show-icon
          :closable="false"
          class="mode-alert"
        />

        <el-form label-width="100px" style="margin-top: 16px">
          <el-form-item label="审批意见" required>
            <el-input
              v-model="approveComment"
              type="textarea"
              :rows="3"
              placeholder="请输入统一审批意见（必填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div class="section-title">待审批预览列表：</div>
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
              {{ row.employeeName || row.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="employeeNo" label="工号" width="110" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="position" label="岗位" width="130" />
          <el-table-column prop="entryBatch" label="入职批次" width="100" />
          <el-table-column label="当前节点" width="130">
            <template #default="{ row }">
              {{ getCurrentNodeLabel(row) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="RegularizationStatusType[row.status as RegularizationStatus]" size="small">
                {{ RegularizationStatusLabel[row.status as RegularizationStatus] }}
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
    </template>

    <template #footer>
      <el-button @click="handleClick(handleClose)" v-ripple>取消</el-button>
      <el-button
        v-if="mode === 'filter' && selectedFilterIds.length"
        type="success"
        :loading="submitting"
        :disabled="!selectedFilterIds.length"
        @click="handleClick(handleApplyFromFilter)"
        v-ripple
      >
        一键发起申请（{{ selectedFilterIds.length }}条）
      </el-button>
      <el-button
        v-else-if="mode === 'apply'"
        type="success"
        :loading="submitting"
        :disabled="!filteredItems.length"
        @click="handleClick(handleBatchApply)"
        v-ripple
      >
        批量发起（{{ filteredCount }}条）
      </el-button>
      <el-button
        v-else-if="mode === 'approve' && effectiveIsAdmin"
        type="primary"
        :loading="submitting"
        :disabled="!selectedItems.length || !approveComment.trim()"
        @click="handleClick(handleBatchApprove)"
        v-ripple
      >
        批量审批通过（{{ selectedItems.length }}条）
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Search, Lock, CircleCheckFilled, CircleCloseFilled,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/modules/user';
import { JobCategoryLabel, DATE_FORMAT, UserRole } from '@/constants/recruitment';
import {
  batchFilterRegularizationApi,
  batchApplyRegularizationApi,
  batchApproveRegularizationApi,
  type RegularizationItem,
  type BatchFilterParams,
  RegularizationStatus,
  RegularizationStatusLabel,
  RegularizationStatusType,
  REGULARIZATION_LOCKED_STATUSES,
  ApprovalNodeTypeLabel,
} from '@/api/regularization';

interface Props {
  visible: boolean;
  mode: 'filter' | 'apply' | 'approve';
  selectedItems?: RegularizationItem[];
  isAdmin?: boolean;
  userDepartment?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedItems: () => [],
  isAdmin: false,
  userDepartment: '',
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', msg?: string): void;
}>();

const userStore = useUserStore();
const visibleLocal = ref(props.visible);
const submitting = ref(false);
const filterLoading = ref(false);
const clicked = ref(false);

const handleClick = (fn: (...args: any[]) => any, ...args: any[]) => {
  if (clicked.value) return;
  clicked.value = true;
  fn(...args);
  setTimeout(() => {
    clicked.value = false;
  }, 300);
};

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
    case 'filter':
      return '批量筛选到期人员';
    case 'apply':
      return '批量发起转正申请';
    case 'approve':
      return '批量审批';
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

const entryBatchOptions = computed(() => {
  const batches = new Set<string>();
  props.selectedItems.forEach(item => {
    if (item.entryBatch) batches.add(item.entryBatch);
  });
  filteredItems.value.forEach(item => {
    if (item.entryBatch) batches.add(item.entryBatch);
  });
  filteredList.value.forEach(item => {
    if (item.entryBatch) batches.add(item.entryBatch);
  });
  return Array.from(batches).sort().reverse();
});

const filterForm = reactive<BatchFilterParams>({
  entryBatches: [],
  jobCategories: [],
  hasEnoughIndicators: false,
  hasScored: false,
  minScore: undefined,
});

const filterTableRef = ref();
const filteredList = ref<RegularizationItem[]>([]);
const selectedFilterIds = ref<number[]>([]);
const selectedFilterRows = ref<RegularizationItem[]>([]);
const applyRemarkFromFilter = ref('');

const filteredCount = computed(() => filteredItems.value.length);

const canOperateItem = (row: RegularizationItem) => {
  if (REGULARIZATION_LOCKED_STATUSES.includes(row.status as RegularizationStatus)) return false;
  if (effectiveIsAdmin.value) return true;
  return !row.hrOperatorId || row.hrOperatorId === effectiveCurrentUserId.value;
};

const filteredItems = computed(() => {
  if (effectiveIsAdmin.value) {
    return props.selectedItems.filter(r => !REGULARIZATION_LOCKED_STATUSES.includes(r.status as RegularizationStatus));
  }
  return props.selectedItems.filter(r => canOperateItem(r));
});

const applyRemark = ref('');
const approveComment = ref('');

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

const getScoreClass = (score?: number) => {
  if (score === undefined || score === null) return '';
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-high';
  if (score >= 70) return 'score-medium';
  return 'score-danger';
};

const getCurrentNodeLabel = (row: RegularizationItem) => {
  if (!row.currentNode) return '-';
  return (ApprovalNodeTypeLabel as any)[row.currentNode] || row.currentNodeName || row.currentNode;
};

const handleFilterSelectionChange = (selection: RegularizationItem[]) => {
  selectedFilterRows.value = selection;
  selectedFilterIds.value = selection.map(s => s.id);
};

const initData = () => {
  executionResults.value = [];
  applyRemark.value = '';
  applyRemarkFromFilter.value = '';
  approveComment.value = '';
  filteredList.value = [];
  selectedFilterIds.value = [];
  selectedFilterRows.value = [];
  filterForm.entryBatches = [];
  filterForm.jobCategories = [];
  filterForm.hasEnoughIndicators = false;
  filterForm.hasScored = false;
  filterForm.minScore = undefined;
};

const handleFilter = async () => {
  filterLoading.value = true;
  executionResults.value = [];
  try {
    const params: BatchFilterParams = {
      entryBatches: filterForm.entryBatches?.length ? filterForm.entryBatches : undefined,
      jobCategories: filterForm.jobCategories?.length ? filterForm.jobCategories : undefined,
      hasEnoughIndicators: filterForm.hasEnoughIndicators || undefined,
      hasScored: filterForm.hasScored || undefined,
      minScore: (filterForm as any).minScore80 ? 80 : undefined,
    };
    filteredList.value = await batchFilterRegularizationApi(params);
    ElMessage.success(`筛选完成，共找到 ${filteredList.value.length} 条记录`);
  } catch (e: any) {
    ElMessage.error(e?.message || '筛选失败');
    filteredList.value = [];
  } finally {
    filterLoading.value = false;
  }
};

const handleApplyFromFilter = async () => {
  if (selectedFilterIds.value.length === 0) {
    ElMessage.warning('请先勾选要发起申请的人员');
    return;
  }
  submitting.value = true;
  executionResults.value = [];
  try {
    const result = await batchApplyRegularizationApi({
      ids: selectedFilterIds.value,
      applicationRemark: applyRemarkFromFilter.value || undefined,
    });
    executionResults.value = selectedFilterRows.value.map(item => {
      const failedItem = result.failedList?.find(f => f.id === item.id);
      return {
        id: item.id,
        name: item.employeeName || item.name || '-',
        success: !failedItem,
        reason: failedItem?.reason,
      };
    });
    if (result.success > 0) {
      emit('success', `批量发起申请完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
    } else {
      ElMessage.warning('批量发起全部失败，请检查错误详情');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '批量发起失败');
  } finally {
    submitting.value = false;
  }
};

const handleBatchApply = async () => {
  if (filteredItems.value.length === 0) {
    ElMessage.warning('暂无可处理的记录');
    return;
  }
  submitting.value = true;
  executionResults.value = [];
  try {
    const ids = filteredItems.value.map(r => r.id);
    const result = await batchApplyRegularizationApi({
      ids,
      applicationRemark: applyRemark.value || undefined,
    });
    executionResults.value = filteredItems.value.map(item => {
      const failedItem = result.failedList?.find(f => f.id === item.id);
      return {
        id: item.id,
        name: item.employeeName || item.name || '-',
        success: !failedItem,
        reason: failedItem?.reason,
      };
    });
    if (result.success > 0) {
      emit('success', `批量发起申请完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
    } else {
      ElMessage.warning('批量发起全部失败，请检查错误详情');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '批量发起失败');
  } finally {
    submitting.value = false;
  }
};

const handleBatchApprove = async () => {
  if (!effectiveIsAdmin.value) {
    ElMessage.error('无权限执行批量审批');
    return;
  }
  if (props.selectedItems.length === 0) {
    ElMessage.warning('暂无可处理的记录');
    return;
  }
  if (!approveComment.value.trim()) {
    ElMessage.warning('请填写审批意见');
    return;
  }
  submitting.value = true;
  executionResults.value = [];
  try {
    const ids = props.selectedItems.map(r => r.id);
    const result = await batchApproveRegularizationApi({
      ids,
      comment: approveComment.value,
    });
    executionResults.value = props.selectedItems.map(item => {
      const failedItem = result.failedList?.find(f => f.id === item.id);
      return {
        id: item.id,
        name: item.employeeName || item.name || '-',
        success: !failedItem,
        reason: failedItem?.reason,
      };
    });
    if (result.success > 0) {
      emit('success', `批量审批完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
    } else {
      ElMessage.warning('批量审批全部失败，请检查错误详情');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '批量审批失败');
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style lang="scss" scoped>
.mode-alert {
  margin-bottom: 16px;
}

.filter-form {
  margin-bottom: 12px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;

  .group-label {
    font-weight: 500;
    color: #606266;
    flex-shrink: 0;
  }
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .filter-count {
    font-size: 14px;
    color: #606266;

    .highlight {
      color: #409eff;
      font-size: 16px;
    }
  }
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin: 16px 0 10px;
  font-size: 14px;
}

.preview-table {
  margin-bottom: 8px;
}

.filter-notice {
  text-align: right;
  margin: 12px 0;
}

.apply-from-filter {
  margin-top: 16px;
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

  :deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
    padding: 8px 12px;
  }
}

.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;

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

.score-excellent { color: #67c23a; font-weight: 600; }
.score-high { color: #409eff; font-weight: 600; }
.score-medium { color: #e6a23c; font-weight: 600; }
.score-danger { color: #f56c6c; font-weight: 600; }
</style>
