<template>
  <div class="onboard-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="入职状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in OnboardStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="招聘岗位" prop="jobId">
        <el-input-number v-model="searchForm.jobId" :min="1" placeholder="岗位ID" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="入职部门" prop="department">
        <el-input v-model="searchForm.department" placeholder="请输入" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="候选人" prop="name">
        <el-input v-model="searchForm.name" placeholder="姓名" clearable style="width: 120px" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="searchForm.phone" placeholder="手机号" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="预计入职" prop="expectOnboardDate">
        <el-date-picker
          v-model="searchForm.expectOnboardDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </el-form-item>
    </SearchForm>

    <ProTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      row-key="id"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-button
            type="primary"
            :icon="Plus"
            v-ripple
            @click="openForm('create')"
          >
            入职登记
          </el-button>
          <el-button
            type="success"
            :icon="Upload"
            v-ripple
            @click="openBatch('create')"
          >
            批量录入
          </el-button>
          <el-button
            type="warning"
            :icon="Check"
            v-ripple
            :disabled="!canBatchSubmit"
            @click="openBatch('submit')"
          >
            批量提审
          </el-button>
          <el-button
            type="primary"
            plain
            :icon="CircleCheck"
            v-ripple
            :disabled="!canBatchApprove"
            v-if="isAdmin"
            @click="openBatch('approve')"
          >
            批量审核
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-radio-group v-model="statusTab" size="default" @change="handleStatusTabChange">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button :value="OnboardStatus.PENDING_AUDIT">待审核</el-radio-button>
            <el-radio-button :value="OnboardStatus.AUDIT_PASSED">审核通过</el-radio-button>
            <el-radio-button :value="OnboardStatus.AUDIT_REJECTED">审核驳回</el-radio-button>
            <el-radio-button :value="OnboardStatus.ONBOARDED">已入职</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table-column label="候选人" width="100">
        <template #default="{ row }">
          <div class="candidate-cell">
            <div class="candidate-name">{{ row.name || row.resume?.name || '-' }}</div>
            <div class="candidate-phone" v-if="row.phone || row.resume?.phone">{{ row.phone || row.resume?.phone }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="应聘岗位" width="140">
        <template #default="{ row }">
          <div>
            <div class="job-title">{{ row.job?.title || row.position || '-' }}</div>
            <div class="job-dept" v-if="row.department">{{ row.department }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="jobLevel" label="职级" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.jobLevel" size="small">{{ row.jobLevel }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="薪资" width="130">
        <template #default="{ row }">
          <div class="salary-cell">
            <span :class="{ 'salary-mismatch': row.salaryMismatchWarning }">
              {{ row.offerSalary || (row.salaryMin ? `${row.salaryMin}-${row.salaryMax}K` : '-') }}
            </span>
            <el-tooltip v-if="row.salaryMismatchWarning" content="薪资职级不匹配" placement="top">
              <el-icon class="warning-icon"><WarningFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="预计入职" width="110">
        <template #default="{ row }">
          {{ formatDate(row.expectOnboardDate) }}
        </template>
      </el-table-column>
      <el-table-column label="实际入职" width="110">
        <template #default="{ row }">
          {{ formatDate(row.actualOnboardDate || row.onboardDate) }}
        </template>
      </el-table-column>
      <el-table-column label="对接HR" width="90">
        <template #default="{ row }">{{ row.hrOperatorName || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="OnboardStatusType[row.status]" size="small" effect="light">
            {{ OnboardStatusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip v-if="row.rejectReason" :content="row.rejectReason" placement="top">
            <span class="reject-tip">{{ row.rejectReason }}</span>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
          <template v-if="canEdit(row)">
            <el-button type="primary" link size="small" @click="openForm('edit', row)">编辑</el-button>
          </template>
          <template v-else>
            <el-button type="info" link size="small" disabled>已锁定</el-button>
          </template>
          <el-dropdown @command="(cmd) => handleAction(row, cmd)">
            <el-button type="success" link size="small">更多</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="submit"
                  :disabled="row.status !== OnboardStatus.PENDING_AUDIT || !canOperateOwn(row)"
                >
                  提交审核
                </el-dropdown-item>
                <el-dropdown-item
                  command="approve"
                  v-if="isAdmin"
                  :disabled="row.status !== OnboardStatus.PENDING_AUDIT"
                >
                  审核通过
                </el-dropdown-item>
                <el-dropdown-item
                  command="reject"
                  v-if="isAdmin"
                  :disabled="row.status !== OnboardStatus.PENDING_AUDIT"
                >
                  审核驳回
                </el-dropdown-item>
                <el-dropdown-item
                  command="resubmit"
                  :disabled="row.status !== OnboardStatus.AUDIT_REJECTED || !canOperateOwn(row)"
                >
                  重新提交
                </el-dropdown-item>
                <el-dropdown-item
                  command="onboarded"
                  :disabled="row.status !== OnboardStatus.AUDIT_PASSED"
                >
                  标记入职
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            type="danger"
            link
            size="small"
            :disabled="isLocked(row)"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </ProTable>

    <OnboardForm
      v-model:visible="formVisible"
      :mode="formMode"
      :initial-data="formInitialData"
      @success="handleFormSuccess"
    />

    <OnboardDetail
      v-model:visible="detailVisible"
      :data="detailData"
      @action="handleDetailAction"
    />

    <OnboardBatchDialog
      v-model:visible="batchVisible"
      :mode="batchMode"
      :selected-ids="selectedIds"
      :is-admin="isAdmin"
      :current-user-id="currentUserId"
      @success="handleBatchSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, nextTick } from 'vue';
import {
  ElMessage, ElMessageBox, ElNotification, type FormRules,
} from 'element-plus';
import {
  Plus, Upload, Check, CircleCheck, WarningFilled,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { SearchForm, ProTable } from '@/components';
import OnboardForm from './OnboardForm.vue';
import OnboardDetail from './OnboardDetail.vue';
import OnboardBatchDialog from './OnboardBatchDialog.vue';
import {
  getOnboardListApi,
  deleteOnboardApi,
  submitOnboardAuditApi,
  approveOnboardApi,
  rejectOnboardApi,
  markOnboardedApi,
  getOnboardDetailApi,
  type OnboardItem,
} from '@/api/onboard';
import {
  OnboardStatus,
  OnboardStatusLabel,
  OnboardStatusType,
  OnboardOperationAction,
  DATE_FORMAT,
  UserRole,
} from '@/constants/recruitment';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);
const currentUserId = computed(() => userStore.userInfo?.id || 0);

const loading = ref(false);
const tableData = ref<OnboardItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<OnboardItem[]>([]);
const statusTab = ref<string>('');

const searchForm = reactive({
  status: '',
  jobId: undefined as number | undefined,
  department: '',
  name: '',
  phone: '',
  expectOnboardDate: [] as string[],
});

const canBatchSubmit = computed(() =>
  selectedRows.value.some(r =>
    (r.status === OnboardStatus.PENDING_AUDIT || r.status === OnboardStatus.AUDIT_REJECTED)
    && canOperateOwn(r)
  )
);
const canBatchApprove = computed(() =>
  isAdmin.value && selectedRows.value.some(r => r.status === OnboardStatus.PENDING_AUDIT)
);

const isLocked = (row: OnboardItem) =>
  [OnboardStatus.AUDIT_PASSED, OnboardStatus.ONBOARDED].includes(row.status as any);

const canEdit = (row: OnboardItem) => {
  if (isLocked(row)) return false;
  if (row.status === OnboardStatus.AUDIT_REJECTED) return canOperateOwn(row);
  if (row.status === OnboardStatus.PENDING_AUDIT) return canOperateOwn(row);
  return true;
};

const canOperateOwn = (row: OnboardItem) => {
  if (isAdmin.value) return true;
  return !row.hrOperatorId || row.hrOperatorId === currentUserId.value;
};

const formatDate = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATE_FORMAT);
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      status: searchForm.status || statusTab.value || undefined,
      jobId: searchForm.jobId,
      department: searchForm.department || undefined,
      name: searchForm.name || undefined,
      phone: searchForm.phone || undefined,
    };
    if (searchForm.expectOnboardDate?.length === 2) {
      params.expectOnboardDateStart = searchForm.expectOnboardDate[0];
      params.expectOnboardDateEnd = searchForm.expectOnboardDate[1];
    }
    Object.keys(params).forEach(k => {
      if (params[k] === undefined || params[k] === '' || params[k] === null) delete params[k];
    });
    const res = await getOnboardListApi(params);
    tableData.value = (res as any).list || [];
    total.value = (res as any).total || 0;
  } finally {
    loading.value = false;
  }
};

const refreshLocal = (newData: OnboardItem, op: 'create' | 'update' | 'replace') => {
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

const handleSearch = () => {
  page.value = 1;
  fetchList();
};
const handleReset = () => {
  page.value = 1;
  statusTab.value = '';
};
const handleStatusTabChange = () => {
  searchForm.status = '';
  page.value = 1;
  fetchList();
};
const handlePageChange = (p: number, ps: number) => {
  page.value = p;
  pageSize.value = ps;
  fetchList();
};
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
  selectedIds.value = selection.map(s => s.id);
};

const formVisible = ref(false);
const formMode = ref<'create' | 'edit' | 'resubmit'>('create');
const formInitialData = ref<OnboardItem>({} as OnboardItem);

const openForm = (mode: 'create' | 'edit' | 'resubmit', row?: OnboardItem) => {
  formMode.value = mode;
  formInitialData.value = row ? { ...row } : ({} as OnboardItem);
  formVisible.value = true;
};

const handleFormSuccess = () => {
  ElMessage.success('操作成功');
  fetchList();
};

const detailVisible = ref(false);
const detailData = ref<OnboardItem>({} as OnboardItem);

const openDetail = async (row: OnboardItem) => {
  try {
    const res = await getOnboardDetailApi(row.id) as any;
    detailData.value = res || row;
    detailVisible.value = true;
  } catch (e) {
    detailData.value = row;
    detailVisible.value = true;
  }
};

const handleDetailAction = async (action: string, row: OnboardItem) => {
  detailVisible.value = false;
  switch (action) {
    case 'edit': openForm('edit', row); break;
    case 'resubmit': openForm('resubmit', row); break;
    default: handleAction(row, action);
  }
};

const batchVisible = ref(false);
const batchMode = ref<'create' | 'submit' | 'approve'>('create');
const openBatch = (mode: 'create' | 'submit' | 'approve') => {
  if ((mode === 'submit' || mode === 'approve') && selectedIds.value.length === 0) {
    ElMessage.warning('请先选择入职记录');
    return;
  }
  batchMode.value = mode;
  batchVisible.value = true;
};

const handleBatchSuccess = (msg?: string) => {
  ElNotification({ title: '批量操作完成', message: msg || '操作成功', type: 'success' });
  fetchList();
};

const handleAction = async (row: OnboardItem, action: string) => {
  const confirmMap: Record<string, { msg: string; api: any; success: string }> = {
    submit: {
      msg: '确定要提交该入职登记进入审核流程吗？',
      api: submitOnboardAuditApi,
      success: '已提交审核',
    },
    approve: {
      msg: '确定要审核通过该入职登记吗？通过后将自动生成入职台账。',
      api: (id: number) => approveOnboardApi(id),
      success: '审核通过',
    },
    onboarded: {
      msg: '确定要标记该候选人已入职吗？',
      api: (id: number) => markOnboardedApi(id, dayjs().format('YYYY-MM-DD')),
      success: '已标记入职',
    },
  };

  if (action === 'reject') {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回原因', '审核驳回', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请填写驳回原因',
        inputValidator: (v: string) => !!v?.trim() || '驳回原因不能为空',
      });
      await rejectOnboardApi(row.id, value);
      ElMessage.success('已驳回');
      fetchList();
    } catch { /* cancel */ }
    return;
  }

  const item = confirmMap[action];
  if (!item) return;

  try {
    await ElMessageBox.confirm(item.msg, '提示', { type: 'warning' });
    await item.api(row.id);
    ElMessage.success(item.success);
    fetchList();
  } catch { /* cancel */ }
};

const handleDelete = (row: OnboardItem) => {
  ElMessageBox.confirm('确定要删除该入职记录吗？此操作不可恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteOnboardApi(row.id);
      ElMessage.success('删除成功');
      refreshLocal(row, 'replace');
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.onboard-page {
  .toolbar-left { display: flex; gap: $spacing-sm; }
  .toolbar-right { margin-left: auto; }

  .candidate-cell {
    .candidate-name { font-weight: 600; color: #303133; }
    .candidate-phone { font-size: 12px; color: #909399; margin-top: 2px; }
  }
  .job-title { font-weight: 500; color: #303133; }
  .job-dept { font-size: 12px; color: #909399; margin-top: 2px; }

  .salary-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    .salary-mismatch { color: #f56c6c; font-weight: 600; }
    .warning-icon { color: #f56c6c; font-size: 14px; }
  }
  .reject-tip { color: #f56c6c; font-size: 12px; }
}
</style>
