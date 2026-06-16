<template>
  <div class="resume-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in ResumeStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable style="width: 160px" />
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加简历</el-button>
          <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </template>

      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column label="性别" width="60" align="center">
        <template #default="{ row }">{{ GenderLabel[row.gender] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" width="60" align="center" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column label="应聘岗位" width="140">
        <template #default="{ row }">{{ row.job?.title || '-' }}</template>
      </el-table-column>
      <el-table-column label="学历" width="80" align="center">
        <template #default="{ row }">{{ EducationLabel[row.education] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="experience" label="经验(年)" width="80" align="center" />
      <el-table-column prop="currentPosition" label="当前职位" min-width="120" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="ResumeStatusType[row.status]" size="small">
            {{ ResumeStatusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-dropdown @command="(cmd) => handleStatusChange(row, cmd)">
            <el-button type="success" link size="small">状态变更</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(label, key) in ResumeStatusLabel"
                  :key="key"
                  :command="key"
                  :disabled="row.status === key"
                >
                  {{ label }}
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
      width="700px"
      @submit="handleSubmit"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="formData.gender" placeholder="请选择" style="width: 100%">
              <el-option v-for="(label, key) in GenderLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="年龄" prop="age">
            <el-input-number v-model="formData.age" :min="16" :max="65" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="应聘岗位" prop="jobId">
            <el-input-number v-model="formData.jobId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学历" prop="education">
            <el-select v-model="formData.education" placeholder="请选择" style="width: 100%">
              <el-option v-for="(label, key) in EducationLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="毕业院校" prop="school">
            <el-input v-model="formData.school" placeholder="请输入毕业院校" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="专业" prop="major">
            <el-input v-model="formData.major" placeholder="请输入专业" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="工作年限" prop="experience">
            <el-input-number v-model="formData.experience" :min="0" :precision="1" :step="0.5" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="期望薪资" prop="expectedSalary">
            <el-input v-model="formData.expectedSalary" placeholder="请输入期望薪资" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="当前公司" prop="currentCompany">
            <el-input v-model="formData.currentCompany" placeholder="请输入当前公司" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="当前职位" prop="currentPosition">
            <el-input v-model="formData.currentPosition" placeholder="请输入当前职位" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所在城市" prop="city">
            <el-input v-model="formData.city" placeholder="请输入城市" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="简历来源" prop="source">
            <el-input v-model="formData.source" placeholder="请输入来源" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" style="width: 50%">
          <el-option v-for="(label, key) in ResumeStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="自我评价" prop="selfEvaluation">
        <el-input v-model="formData.selfEvaluation" type="textarea" :rows="3" placeholder="请输入自我评价" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="简历详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ GenderLabel[detailData.gender] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ detailData.age || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="应聘岗位">{{ detailData.job?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学历">{{ EducationLabel[detailData.education] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作年限">{{ detailData.experience || '-' }}年</el-descriptions-item>
        <el-descriptions-item label="毕业院校">{{ detailData.school || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ detailData.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前公司">{{ detailData.currentCompany || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前职位">{{ detailData.currentPosition || '-' }}</el-descriptions-item>
        <el-descriptions-item label="期望薪资">{{ detailData.expectedSalary || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在城市">{{ detailData.city || '-' }}</el-descriptions-item>
        <el-descriptions-item label="简历来源">{{ detailData.source || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="ResumeStatusType[detailData.status]">{{ ResumeStatusLabel[detailData.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="自我评价" :span="2">{{ detailData.selfEvaluation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { SearchForm, ProTable, ModalForm } from '@/components';
import {
  getResumeListApi,
  createResumeApi,
  updateResumeApi,
  deleteResumeApi,
  batchDeleteResumeApi,
  getResumeDetailApi,
  updateResumeStatusApi,
  type ResumeItem,
} from '@/api/resume';
import {
  ResumeStatus,
  ResumeStatusLabel,
  ResumeStatusType,
  GenderLabel,
  EducationLabel,
} from '@/constants/recruitment';

const loading = ref(false);
const tableData = ref<ResumeItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);

const searchForm = reactive({
  name: '',
  status: '',
  phone: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<Partial<ResumeItem>>({
  jobId: 1,
  name: '',
  gender: undefined,
  age: undefined,
  phone: '',
  email: '',
  education: undefined,
  school: '',
  major: '',
  experience: undefined,
  currentCompany: '',
  currentPosition: '',
  expectedSalary: '',
  city: '',
  selfEvaluation: '',
  status: ResumeStatus.NEW,
  source: '',
  remark: '',
});

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  jobId: [{ required: true, message: '请选择应聘岗位', trigger: 'change' }],
};

const detailVisible = ref(false);
const detailData = ref<ResumeItem>({} as ResumeItem);

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    };
    if (!params.status) delete (params as any).status;
    const res = await getResumeListApi(params);
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
  dialogTitle.value = '添加简历';
  Object.assign(formData, {
    jobId: 1,
    name: '',
    gender: undefined,
    age: undefined,
    phone: '',
    email: '',
    education: undefined,
    school: '',
    major: '',
    experience: undefined,
    currentCompany: '',
    currentPosition: '',
    expectedSalary: '',
    city: '',
    selfEvaluation: '',
    status: ResumeStatus.NEW,
    source: '',
    remark: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: ResumeItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑简历';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleView = async (row: ResumeItem) => {
  try {
    const res = await getResumeDetailApi(row.id);
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
      await updateResumeApi(formData.id!, formData);
      ElMessage.success('更新成功');
    } else {
      await createResumeApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: ResumeItem) => {
  ElMessageBox.confirm('确定要删除该简历吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteResumeApi(row.id);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteResumeApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleStatusChange = (row: ResumeItem, status: string) => {
  ElMessageBox.confirm(`确定要将状态变更为"${ResumeStatusLabel[status as ResumeStatus]}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await updateResumeStatusApi(row.id, status as ResumeStatus);
      ElMessage.success('状态更新成功');
      fetchList();
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.resume-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
