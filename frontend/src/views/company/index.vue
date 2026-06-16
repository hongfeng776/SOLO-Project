<template>
  <div class="company-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="企业名称" prop="name">
        <el-input v-model="searchForm.name" placeholder="请输入企业名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增企业</el-button>
          <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </template>

      <el-table-column prop="name" label="企业名称" min-width="180" />
      <el-table-column prop="shortName" label="简称" width="120" />
      <el-table-column prop="industry" label="行业" width="120" />
      <el-table-column prop="scale" label="规模" width="100" />
      <el-table-column prop="contactPerson" label="联系人" width="100" />
      <el-table-column prop="contactPhone" label="联系电话" width="130" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" align="center" />
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
      width="600px"
      @submit="handleSubmit"
    >
      <el-form-item label="企业名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入企业名称" />
      </el-form-item>
      <el-form-item label="企业简称" prop="shortName">
        <el-input v-model="formData.shortName" placeholder="请输入企业简称" />
      </el-form-item>
      <el-form-item label="所属行业" prop="industry">
        <el-input v-model="formData.industry" placeholder="请输入所属行业" />
      </el-form-item>
      <el-form-item label="企业规模" prop="scale">
        <el-select v-model="formData.scale" placeholder="请选择" style="width: 100%">
          <el-option label="少于50人" value="少于50人" />
          <el-option label="50-100人" value="50-100人" />
          <el-option label="100-500人" value="100-500人" />
          <el-option label="500-1000人" value="500-1000人" />
          <el-option label="1000人以上" value="1000人以上" />
        </el-select>
      </el-form-item>
      <el-form-item label="企业性质" prop="nature">
        <el-select v-model="formData.nature" placeholder="请选择" style="width: 100%">
          <el-option label="国企" value="国企" />
          <el-option label="民营企业" value="民营企业" />
          <el-option label="外资企业" value="外资企业" />
          <el-option label="合资企业" value="合资企业" />
          <el-option label="上市公司" value="上市公司" />
          <el-option label="创业公司" value="创业公司" />
        </el-select>
      </el-form-item>
      <el-form-item label="企业地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入企业地址" />
      </el-form-item>
      <el-form-item label="联系人" prop="contactPerson">
        <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="contactPhone">
        <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="联系邮箱" prop="contactEmail">
        <el-input v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="999" />
      </el-form-item>
      <el-form-item label="企业简介" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入企业简介" />
      </el-form-item>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="企业详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="企业简称">{{ detailData.shortName }}</el-descriptions-item>
        <el-descriptions-item label="所属行业">{{ detailData.industry }}</el-descriptions-item>
        <el-descriptions-item label="企业规模">{{ detailData.scale }}</el-descriptions-item>
        <el-descriptions-item label="企业性质">{{ detailData.nature }}</el-descriptions-item>
        <el-descriptions-item label="企业地址">{{ detailData.address }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailData.contactPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="联系邮箱">{{ detailData.contactEmail }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
            {{ detailData.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="企业简介" :span="2">
          {{ detailData.description || '-' }}
        </el-descriptions-item>
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
  getCompanyListApi,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
  batchDeleteCompanyApi,
  getCompanyDetailApi,
  type CompanyItem,
} from '@/api/company';

const loading = ref(false);
const tableData = ref<CompanyItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);

const searchForm = reactive({
  name: '',
  status: undefined as number | undefined,
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<Partial<CompanyItem>>({
  name: '',
  shortName: '',
  industry: '',
  scale: '',
  nature: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  status: 1,
  sort: 0,
  description: '',
});

const formRules: FormRules = {
  name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
};

const detailVisible = ref(false);
const detailData = ref<CompanyItem>({} as CompanyItem);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getCompanyListApi({
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    });
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
  dialogTitle.value = '新增企业';
  Object.assign(formData, {
    name: '',
    shortName: '',
    industry: '',
    scale: '',
    nature: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    status: 1,
    sort: 0,
    description: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: CompanyItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑企业';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleView = async (row: CompanyItem) => {
  try {
    const res = await getCompanyDetailApi(row.id);
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
      await updateCompanyApi(formData.id!, formData);
      ElMessage.success('更新成功');
    } else {
      await createCompanyApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: CompanyItem) => {
  ElMessageBox.confirm('确定要删除该企业吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteCompanyApi(row.id);
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
      await batchDeleteCompanyApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.company-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
