<template>
  <div class="onboard-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="入职状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in OnboardStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="部门" prop="department">
        <el-input v-model="searchForm.department" placeholder="请输入" clearable style="width: 140px" />
      </el-form-item>
    </SearchForm>

    <ProTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加入职</el-button>
        </div>
      </template>

      <el-table-column label="候选人" width="100">
        <template #default="{ row }">{{ row.resume?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="岗位" width="120">
        <template #default="{ row }">{{ row.job?.title || '-' }}</template>
      </el-table-column>
      <el-table-column prop="department" label="入职部门" width="100" />
      <el-table-column prop="position" label="入职职位" width="120" />
      <el-table-column prop="offerSalary" label="Offer薪资" width="100" />
      <el-table-column label="预计入职" width="110">
        <template #default="{ row }">
          {{ formatDate(row.expectOnboardDate) }}
        </template>
      </el-table-column>
      <el-table-column label="实际入职" width="110">
        <template #default="{ row }">
          {{ formatDate(row.actualOnboardDate) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="OnboardStatusType[row.status]" size="small">
            {{ OnboardStatusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-dropdown @command="(cmd) => handleAction(row, cmd)">
            <el-button type="success" link size="small">更多操作</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="confirm" :disabled="row.status === OnboardStatus.CONFIRMED">
                  确认入职
                </el-dropdown-item>
                <el-dropdown-item command="onboarded" :disabled="row.status === OnboardStatus.ONBOARDED">
                  标记入职
                </el-dropdown-item>
                <el-dropdown-item command="cancel" :disabled="row.status === OnboardStatus.CANCELLED">
                  取消入职
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <ModalForm
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :rules="formRules"
      :loading="submitLoading"
      width="650px"
      @submit="handleSubmit"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="简历ID" prop="resumeId">
            <el-input-number v-model="formData.resumeId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位ID" prop="jobId">
            <el-input-number v-model="formData.jobId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="入职部门" prop="department">
            <el-input v-model="formData.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入职职位" prop="position">
            <el-input v-model="formData.position" placeholder="请输入职位" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Offer薪资" prop="offerSalary">
            <el-input v-model="formData.offerSalary" placeholder="请输入薪资" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="试用期(月)" prop="probationPeriod">
            <el-input-number v-model="formData.probationPeriod" :min="0" :max="6" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Offer发放" prop="offerTime">
            <el-date-picker v-model="formData.offerTime" type="date" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计入职" prop="expectOnboardDate">
            <el-date-picker
              v-model="formData.expectOnboardDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="实际入职" prop="actualOnboardDate">
            <el-date-picker
              v-model="formData.actualOnboardDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" style="width: 100%">
              <el-option v-for="(label, key) in OnboardStatusLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="是否签合同" prop="contractSigned">
            <el-switch v-model="formData.contractSigned" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="材料齐全" prop="materialsComplete">
            <el-switch v-model="formData.materialsComplete" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="入职详情" width="650px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="候选人">{{ detailData.resume?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ detailData.job?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入职部门">{{ detailData.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入职职位">{{ detailData.position || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Offer薪资">{{ detailData.offerSalary || '-' }}</el-descriptions-item>
        <el-descriptions-item label="试用期">{{ detailData.probationPeriod || 3 }}个月</el-descriptions-item>
        <el-descriptions-item label="Offer发放">{{ formatDate(detailData.offerTime) }}</el-descriptions-item>
        <el-descriptions-item label="预计入职">{{ formatDate(detailData.expectOnboardDate) }}</el-descriptions-item>
        <el-descriptions-item label="实际入职">{{ formatDate(detailData.actualOnboardDate) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="OnboardStatusType[detailData.status]">{{ OnboardStatusLabel[detailData.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否签合同">{{ detailData.contractSigned ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="材料齐全">{{ detailData.materialsComplete ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { SearchForm, ProTable, ModalForm } from '@/components';
import {
  getOnboardListApi,
  createOnboardApi,
  updateOnboardApi,
  deleteOnboardApi,
  getOnboardDetailApi,
  confirmOnboardApi,
  markOnboardedApi,
  cancelOnboardApi,
  type OnboardItem,
} from '@/api/onboard';
import {
  OnboardStatus,
  OnboardStatusLabel,
  OnboardStatusType,
  DATE_FORMAT,
} from '@/constants/recruitment';

const loading = ref(false);
const tableData = ref<OnboardItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);

const searchForm = reactive({
  status: '',
  department: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<Partial<OnboardItem>>({
  resumeId: 1,
  jobId: 1,
  department: '',
  position: '',
  offerSalary: '',
  probationPeriod: 3,
  offerTime: undefined,
  expectOnboardDate: undefined,
  actualOnboardDate: undefined,
  status: OnboardStatus.PENDING,
  contractSigned: false,
  materialsComplete: false,
  remark: '',
});

const formRules: FormRules = {
  resumeId: [{ required: true, message: '请输入简历ID', trigger: 'blur' }],
  jobId: [{ required: true, message: '请输入岗位ID', trigger: 'blur' }],
};

const detailVisible = ref(false);
const detailData = ref<OnboardItem>({} as OnboardItem);

const formatDate = (val: string | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATE_FORMAT);
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    };
    if (!params.status) delete (params as any).status;
    const res = await getOnboardListApi(params);
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchList();
};

const handleReset = () => {
  page.value = 1;
};

const handlePageChange = (p: number, ps: number) => {
  page.value = p;
  pageSize.value = ps;
  fetchList();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '添加入职';
  Object.assign(formData, {
    resumeId: 1,
    jobId: 1,
    department: '',
    position: '',
    offerSalary: '',
    probationPeriod: 3,
    offerTime: undefined,
    expectOnboardDate: undefined,
    actualOnboardDate: undefined,
    status: OnboardStatus.PENDING,
    contractSigned: false,
    materialsComplete: false,
    remark: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: OnboardItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑入职';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleView = async (row: OnboardItem) => {
  try {
    const res = await getOnboardDetailApi(row.id);
    detailData.value = res;
    detailVisible.value = true;
  } catch (error) {
    console.error(error);
  }
};

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateOnboardApi(formData.id!, formData);
      ElMessage.success('更新成功');
    } else {
      await createOnboardApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: OnboardItem) => {
  ElMessageBox.confirm('确定要删除该入职记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteOnboardApi(row.id);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleAction = (row: OnboardItem, action: string) => {
  const actionMap: Record<string, { api: any; msg: string }> = {
    confirm: { api: confirmOnboardApi, msg: '确认成功' },
    onboarded: { api: markOnboardedApi, msg: '已标记入职' },
    cancel: { api: cancelOnboardApi, msg: '已取消' },
  };

  const actionItem = actionMap[action];
  if (!actionItem) return;

  ElMessageBox.confirm(`确定要执行该操作吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await actionItem.api(row.id);
      ElMessage.success(actionItem.msg);
      fetchList();
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.onboard-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
