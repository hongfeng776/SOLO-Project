<template>
  <div class="job-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="岗位名称" prop="title">
        <el-input v-model="searchForm.title" placeholder="请输入岗位名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in JobStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="工作城市" prop="city">
        <el-input v-model="searchForm.city" placeholder="请输入城市" clearable style="width: 140px" />
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增岗位</el-button>
          <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </template>

      <el-table-column prop="title" label="岗位名称" min-width="150" />
      <el-table-column label="所属企业" width="140">
        <template #default="{ row }">{{ row.company?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="薪资范围" width="120">
        <template #default="{ row }">
          {{ row.salaryMin ? row.salaryMin + '-' + (row.salaryMax || '') + row.salaryUnit : '面议' }}
        </template>
      </el-table-column>
      <el-table-column prop="city" label="工作城市" width="100" />
      <el-table-column prop="experience" label="经验要求" width="100" />
      <el-table-column prop="education" label="学历要求" width="100" />
      <el-table-column prop="recruitNum" label="招聘人数" width="90" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="JobStatusType[row.status]" size="small">
            {{ JobStatusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === JobStatus.DRAFT" type="success" link size="small" @click="handlePublish(row)">
            发布
          </el-button>
          <el-button v-if="row.status === JobStatus.PUBLISHED" type="warning" link size="small" @click="handleClose(row)">
            关闭
          </el-button>
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
          <el-form-item label="岗位名称" prop="title">
            <el-input v-model="formData.title" placeholder="请输入岗位名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属企业" prop="companyId">
            <el-input-number v-model="formData.companyId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所属部门" prop="department">
            <el-input v-model="formData.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工作类型" prop="jobType">
            <el-select v-model="formData.jobType" placeholder="请选择" style="width: 100%">
              <el-option label="全职" value="全职" />
              <el-option label="兼职" value="兼职" />
              <el-option label="实习" value="实习" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="最低薪资" prop="salaryMin">
            <el-input-number v-model="formData.salaryMin" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="最高薪资" prop="salaryMax">
            <el-input-number v-model="formData.salaryMax" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="薪资单位" prop="salaryUnit">
            <el-select v-model="formData.salaryUnit" style="width: 100%">
              <el-option label="K" value="K" />
              <el-option label="万" value="万" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="工作城市" prop="city">
            <el-input v-model="formData.city" placeholder="请输入城市" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="招聘人数" prop="recruitNum">
            <el-input-number v-model="formData.recruitNum" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="经验要求" prop="experience">
            <el-select v-model="formData.experience" placeholder="请选择" style="width: 100%">
              <el-option label="不限" value="不限" />
              <el-option label="应届生" value="应届生" />
              <el-option label="1年以内" value="1年以内" />
              <el-option label="1-3年" value="1-3年" />
              <el-option label="3-5年" value="3-5年" />
              <el-option label="5-10年" value="5-10年" />
              <el-option label="10年以上" value="10年以上" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学历要求" prop="education">
            <el-select v-model="formData.education" placeholder="请选择" style="width: 100%">
              <el-option label="不限" value="不限" />
              <el-option label="大专" value="大专" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士" value="硕士" />
              <el-option label="博士" value="博士" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="工作地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入工作地址" />
      </el-form-item>
      <el-form-item label="岗位职责" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入岗位职责" />
      </el-form-item>
      <el-form-item label="任职要求" prop="requirements">
        <el-input v-model="formData.requirements" type="textarea" :rows="3" placeholder="请输入任职要求" />
      </el-form-item>
      <el-form-item label="福利待遇" prop="benefits">
        <el-input v-model="formData.benefits" type="textarea" :rows="2" placeholder="请输入福利待遇" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" style="width: 100%">
              <el-option v-for="(label, key) in JobStatusLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="岗位详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="岗位名称">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="所属企业">{{ detailData.company?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="薪资范围">
          {{ detailData.salaryMin ? detailData.salaryMin + '-' + (detailData.salaryMax || '') + detailData.salaryUnit : '面议' }}
        </el-descriptions-item>
        <el-descriptions-item label="招聘人数">{{ detailData.recruitNum }}人</el-descriptions-item>
        <el-descriptions-item label="工作城市">{{ detailData.city || '-' }}</el-descriptions-item>
        <el-descriptions-item label="经验要求">{{ detailData.experience || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学历要求">{{ detailData.education || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="JobStatusType[detailData.status]">{{ JobStatusLabel[detailData.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="岗位职责" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任职要求" :span="2">{{ detailData.requirements || '-' }}</el-descriptions-item>
        <el-descriptions-item label="福利待遇" :span="2">{{ detailData.benefits || '-' }}</el-descriptions-item>
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
  getJobListApi,
  createJobApi,
  updateJobApi,
  deleteJobApi,
  batchDeleteJobApi,
  getJobDetailApi,
  publishJobApi,
  closeJobApi,
  type JobItem,
} from '@/api/job';
import { JobStatus, JobStatusLabel, JobStatusType } from '@/constants/recruitment';

const loading = ref(false);
const tableData = ref<JobItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);

const searchForm = reactive({
  title: '',
  status: '',
  city: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<Partial<JobItem>>({
  companyId: 1,
  title: '',
  department: '',
  jobType: '全职',
  salaryMin: undefined,
  salaryMax: undefined,
  salaryUnit: 'K',
  city: '',
  address: '',
  experience: '不限',
  education: '不限',
  recruitNum: 1,
  description: '',
  requirements: '',
  benefits: '',
  status: JobStatus.DRAFT,
  sort: 0,
});

const formRules: FormRules = {
  title: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  companyId: [{ required: true, message: '请选择企业', trigger: 'change' }],
};

const detailVisible = ref(false);
const detailData = ref<JobItem>({} as JobItem);

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    };
    if (!params.status) delete (params as any).status;
    const res = await getJobListApi(params);
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
  dialogTitle.value = '新增岗位';
  Object.assign(formData, {
    companyId: 1,
    title: '',
    department: '',
    jobType: '全职',
    salaryMin: undefined,
    salaryMax: undefined,
    salaryUnit: 'K',
    city: '',
    address: '',
    experience: '不限',
    education: '不限',
    recruitNum: 1,
    description: '',
    requirements: '',
    benefits: '',
    status: JobStatus.DRAFT,
    sort: 0,
  });
  dialogVisible.value = true;
};

const handleEdit = (row: JobItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑岗位';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleView = async (row: JobItem) => {
  try {
    const res = await getJobDetailApi(row.id);
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
      await updateJobApi(formData.id!, formData);
      ElMessage.success('更新成功');
    } else {
      await createJobApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: JobItem) => {
  ElMessageBox.confirm('确定要删除该岗位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteJobApi(row.id);
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
      await batchDeleteJobApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handlePublish = (row: JobItem) => {
  ElMessageBox.confirm('确定要发布该岗位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
  })
    .then(async () => {
      await publishJobApi(row.id);
      ElMessage.success('发布成功');
      fetchList();
    })
    .catch(() => {});
};

const handleClose = (row: JobItem) => {
  ElMessageBox.confirm('确定要关闭该岗位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await closeJobApi(row.id);
      ElMessage.success('已关闭');
      fetchList();
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.job-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
