<template>
  <el-dialog
    v-model="visibleLocal"
    :title="dialogTitle"
    width="960px"
    destroy-on-close
    @close="handleClose"
  >
    <template v-if="mode === 'create'">
      <div class="normalize-options">
        <div class="options-label">规整方式：</div>
        <el-checkbox-group v-model="normalizeBy">
          <el-checkbox value="date">按入职日期统一格式</el-checkbox>
          <el-checkbox value="job">按招聘岗位补全默认部门/职级</el-checkbox>
          <el-checkbox value="both">全部规整</el-checkbox>
        </el-checkbox-group>
      </div>

      <el-table
        :data="createList"
        border
        class="batch-edit-table"
        style="margin-top: 12px"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column label="简历ID" width="100" required>
          <template #default="{ row, $index }">
            <el-input-number
              v-model="row.resumeId"
              :min="1"
              size="small"
              style="width: 100%"
              :controls="false"
              placeholder="必填"
            />
            <div v-if="!row.resumeId" class="field-error">必填</div>
          </template>
        </el-table-column>
        <el-table-column label="姓名" width="110" required>
          <template #default="{ row }">
            <el-input v-model="row.name" size="small" placeholder="必填" />
            <div v-if="!row.name" class="field-error">必填</div>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="140" required>
          <template #default="{ row }">
            <el-input v-model="row.phone" size="small" placeholder="必填" />
            <div v-if="!row.phone" class="field-error">必填</div>
          </template>
        </el-table-column>
        <el-table-column label="岗位ID" width="100" required>
          <template #default="{ row }">
            <el-input-number
              v-model="row.jobId"
              :min="1"
              size="small"
              style="width: 100%"
              :controls="false"
              placeholder="必填"
            />
            <div v-if="!row.jobId" class="field-error">必填</div>
          </template>
        </el-table-column>
        <el-table-column label="部门" width="120">
          <template #default="{ row }">
            <el-input v-model="row.department" size="small" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="职位" width="120">
          <template #default="{ row }">
            <el-input v-model="row.position" size="small" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="职级" width="90">
          <template #default="{ row }">
            <el-select v-model="row.jobLevel" size="small" placeholder="可选" clearable style="width: 100%">
              <el-option
                v-for="opt in JOB_LEVEL_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="预计入职日期" width="160" required>
          <template #default="{ row }">
            <el-date-picker
              v-model="row.onboardDate"
              type="date"
              size="small"
              placeholder="必填"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
            <div v-if="!row.onboardDate" class="field-error">必填</div>
          </template>
        </el-table-column>
        <el-table-column label="Offer薪资" width="110">
          <template #default="{ row }">
            <el-input v-model="row.offerSalary" size="small" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="备注" width="150">
          <template #default="{ row }">
            <el-input v-model="row.remark" size="small" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button
              type="danger"
              link
              size="small"
              :disabled="createList.length <= 1"
              @click="removeRow($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="add-row-wrapper">
        <el-button type="primary" plain @click="addRow">
          <el-icon><Plus /></el-icon>
          新增一行
        </el-button>
        <span class="row-count">共 {{ createList.length }} 行数据</span>
      </div>

      <div v-if="batchCreateResult" class="batch-result">
        <el-divider content-position="left">批量创建结果</el-divider>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="总数">{{ batchCreateResult.total }}</el-descriptions-item>
          <el-descriptions-item label="成功" type="success">
            <span class="text-success">{{ batchCreateResult.success }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败" type="danger">
            <span class="text-danger">{{ batchCreateResult.failed }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-table
          v-if="batchCreateResult.failedList?.length"
          :data="batchCreateResult.failedList"
          border
          size="small"
          style="margin-top: 12px"
          max-height="200"
        >
          <el-table-column label="行号" prop="index" width="70" align="center" />
          <el-table-column label="姓名">
            <template #default="{ row }">
              {{ row.data?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="手机号">
            <template #default="{ row }">
              {{ row.data?.phone || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="失败原因" prop="reason" />
        </el-table>
      </div>
    </template>

    <template v-else-if="mode === 'submit'">
      <el-alert
        :title="submitAlertText"
        type="warning"
        show-icon
        :closable="false"
        class="mode-alert"
      />

      <el-table
        v-if="filteredSubmitList.length"
        :data="filteredSubmitList"
        border
        style="margin-top: 12px"
        max-height="400"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="140" />
        <el-table-column prop="jobLevel" label="职级" width="90" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="OnboardStatusType[row.status]" size="small">
              {{ OnboardStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对接HR" prop="hrOperatorName" width="110" />
      </el-table>

      <div v-if="filteredOutIds.length" class="filtered-notice" style="margin-top: 8px">
        <el-tag type="info" size="small">
          已自动过滤 {{ filteredOutIds.length }} 条非本人对接的记录
        </el-tag>
      </div>

      <el-empty v-else description="暂无可提交的记录" style="margin-top: 24px" />
    </template>

    <template v-else-if="mode === 'approve'">
      <el-alert
        title="仅管理员可执行批量审核操作"
        type="info"
        show-icon
        :closable="false"
        class="mode-alert"
      />

      <el-table
        :data="approvePreviewList"
        border
        style="margin-top: 12px"
        max-height="360"
      >
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="140" />
        <el-table-column prop="jobLevel" label="职级" width="90" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="OnboardStatusType[row.status]" size="small">
              {{ OnboardStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对接HR" prop="hrOperatorName" width="110" />
        <el-table-column label="提审时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime) }}
          </template>
        </el-table-column>
      </el-table>

      <el-form :model="approveForm" label-width="80px" style="margin-top: 16px">
        <el-form-item label="审核备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        v-if="mode === 'create'"
        type="primary"
        :loading="submitting"
        :disabled="!isCreateListValid"
        @click="handleBatchCreate"
      >
        提交创建
      </el-button>
      <el-button
        v-else-if="mode === 'submit'"
        type="primary"
        :loading="submitting"
        :disabled="!filteredSubmitList.length"
        @click="handleBatchSubmit"
      >
        确认提交（{{ filteredSubmitList.length }}条）
      </el-button>
      <el-button
        v-else-if="mode === 'approve'"
        type="success"
        :loading="submitting"
        :disabled="!isAdmin || !approvePreviewList.length"
        @click="handleBatchApprove"
      >
        确认审核通过（{{ approvePreviewList.length }}条）
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/modules/user';
import {
  batchCreateOnboardApi,
  batchSubmitOnboardApi,
  batchApproveOnboardApi,
  getOnboardList,
  type OnboardItem,
  type OnboardCreateData,
  type BatchCreateResult,
} from '@/api/onboard';
import {
  OnboardStatus,
  OnboardStatusLabel,
  OnboardStatusType,
  JOB_LEVEL_OPTIONS,
  DATETIME_FORMAT,
} from '@/constants/recruitment';

interface Props {
  visible: boolean;
  mode: 'create' | 'submit' | 'approve';
  selectedIds: number[];
  isAdmin?: boolean;
  currentUserId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  currentUserId: 0,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

const userStore = useUserStore();
const visibleLocal = ref(props.visible);

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

const submitting = ref(false);

const dialogTitle = computed(() => {
  switch (props.mode) {
    case 'create':
      return '批量录入入职登记';
    case 'submit':
      return '批量提交审核';
    case 'approve':
      return '批量审核通过';
    default:
      return '批量操作';
  }
});

const normalizeBy = ref<string[]>(['both']);

const createEmptyRow = (): OnboardCreateData & { offerSalary?: string } => ({
  resumeId: 0,
  jobId: 0,
  name: '',
  phone: '',
  department: '',
  position: '',
  jobLevel: '',
  onboardDate: '',
  offerSalary: '',
  remark: '',
});

const createList = ref<Array<OnboardCreateData & { offerSalary?: string }>>([]);

const batchCreateResult = ref<BatchCreateResult | null>(null);

const isCreateListValid = computed(() => {
  if (createList.value.length === 0) return false;
  return createList.value.every(
    (row) => row.resumeId && row.jobId && row.name && row.phone && row.onboardDate
  );
});

const submitPreviewList = ref<OnboardItem[]>([]);
const approvePreviewList = ref<OnboardItem[]>([]);

const filteredSubmitList = computed(() => {
  if (props.isAdmin) return submitPreviewList.value;
  const userId = props.currentUserId || userStore.userInfo?.id;
  return submitPreviewList.value.filter(
    (item) => item.hrOperatorId === userId
  );
});

const filteredOutIds = computed(() => {
  if (props.isAdmin) return [];
  const userId = props.currentUserId || userStore.userInfo?.id;
  return submitPreviewList.value
    .filter((item) => item.hrOperatorId !== userId)
    .map((item) => item.id);
});

const submitAlertText = computed(() => {
  const total = submitPreviewList.value.length;
  if (props.isAdmin) {
    return `将提交 ${total} 条入职登记进入审核流程`;
  }
  const userId = props.currentUserId || userStore.userInfo?.id;
  const myCount = submitPreviewList.value.filter(
    (item) => item.hrOperatorId === userId
  ).length;
  const otherCount = total - myCount;
  if (otherCount > 0) {
    return `将提交 ${myCount} 条本人对接的入职登记（已自动过滤 ${otherCount} 条非本人对接的记录）`;
  }
  return `将提交 ${myCount} 条本人对接的入职登记进入审核流程`;
});

const approveForm = reactive({
  remark: '',
});

const initData = () => {
  batchCreateResult.value = null;
  if (props.mode === 'create') {
    createList.value = Array.from({ length: 5 }, () => createEmptyRow());
    normalizeBy.value = ['both'];
  } else if (props.mode === 'submit') {
    fetchSubmitPreview();
  } else if (props.mode === 'approve') {
    fetchApprovePreview();
    approveForm.remark = '';
  }
};

const fetchSubmitPreview = async () => {
  if (!props.selectedIds.length) {
    submitPreviewList.value = [];
    return;
  }
  try {
    const res = await getOnboardList({
      page: 1,
      pageSize: props.selectedIds.length,
      ids: props.selectedIds.join(','),
    });
    submitPreviewList.value = res.list.filter(
      (item) =>
        item.status === OnboardStatus.PENDING_AUDIT ||
        item.status === OnboardStatus.AUDIT_REJECTED
    );
  } catch (error) {
    console.error('获取提交预览失败:', error);
    submitPreviewList.value = [];
  }
};

const fetchApprovePreview = async () => {
  if (!props.selectedIds.length) {
    approvePreviewList.value = [];
    return;
  }
  try {
    const res = await getOnboardList({
      page: 1,
      pageSize: props.selectedIds.length,
      ids: props.selectedIds.join(','),
    });
    approvePreviewList.value = res.list.filter(
      (item) => item.status === OnboardStatus.PENDING_AUDIT
    );
  } catch (error) {
    console.error('获取审核预览失败:', error);
    approvePreviewList.value = [];
  }
};

const addRow = () => {
  createList.value.push(createEmptyRow());
};

const removeRow = (index: number) => {
  if (createList.value.length <= 1) return;
  createList.value.splice(index, 1);
};

const formatDateTime = (val?: string) => {
  if (!val) return '-';
  return dayjs(val).format(DATETIME_FORMAT);
};

const handleBatchCreate = async () => {
  if (!isCreateListValid.value) {
    ElMessage.warning('请填写所有必填字段');
    return;
  }
  submitting.value = true;
  try {
    const list = createList.value.map((row) => {
      const { offerSalary, ...rest } = row;
      const data: OnboardCreateData = { ...rest };
      if (offerSalary) {
        const match = String(offerSalary).match(/(\d+(?:\.\d+)?)/);
        if (match) {
          data.salaryMin = parseFloat(match[1]);
          data.salaryMax = parseFloat(match[1]);
        }
      }
      return data;
    });
    const normalizeParam = normalizeBy.value.includes('both')
      ? 'both'
      : normalizeBy.value.includes('date')
        ? 'date'
        : normalizeBy.value.includes('job')
          ? 'job'
          : undefined;
    const res = await batchCreateOnboardApi(list, normalizeParam);
    batchCreateResult.value = res;
    ElMessage.success(`批量创建完成：成功 ${res.success} 条，失败 ${res.failed} 条`);
    if (res.success > 0) {
      emit('success');
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '批量创建失败');
  } finally {
    submitting.value = false;
  }
};

const handleBatchSubmit = async () => {
  if (!filteredSubmitList.value.length) {
    ElMessage.warning('没有可提交的记录');
    return;
  }
  submitting.value = true;
  try {
    const ids = filteredSubmitList.value.map((item) => item.id);
    await batchSubmitOnboardApi(ids);
    ElMessage.success(`成功提交 ${ids.length} 条记录`);
    emit('success');
    handleClose();
  } catch (error: any) {
    ElMessage.error(error?.message || '批量提交失败');
  } finally {
    submitting.value = false;
  }
};

const handleBatchApprove = async () => {
  if (!props.isAdmin) {
    ElMessage.warning('仅管理员可执行批量审核操作');
    return;
  }
  if (!approvePreviewList.value.length) {
    ElMessage.warning('没有待审核的记录');
    return;
  }
  submitting.value = true;
  try {
    const ids = approvePreviewList.value.map((item) => item.id);
    await batchApproveOnboardApi(ids, approveForm.remark || undefined);
    ElMessage.success(`成功审核通过 ${ids.length} 条记录`);
    emit('success');
    handleClose();
  } catch (error: any) {
    ElMessage.error(error?.message || '批量审核失败');
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style lang="scss" scoped>
.normalize-options {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;

  .options-label {
    font-weight: 500;
    color: #606266;
    flex-shrink: 0;
  }
}

.batch-edit-table {
  .field-error {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 2px;
  }
}

.add-row-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 4px;

  .row-count {
    color: #909399;
    font-size: 13px;
  }
}

.batch-result {
  margin-top: 20px;

  .text-success {
    color: #67c23a;
    font-weight: 600;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 600;
  }
}

.mode-alert {
  margin-bottom: 8px;
}

.filtered-notice {
  text-align: right;
}
</style>
