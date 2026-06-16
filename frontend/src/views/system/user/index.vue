<template>
  <div class="system-page">
    <PageContainer title="用户管理">
      <div class="user-toolbar mb-base">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
      </div>

      <ProTable
        :data="tableData"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        show-index
        @page-change="handlePageChange"
      >
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">{{ UserRoleLabel[row.role] }}</template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">
            {{ row.lastLoginTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </ProTable>
    </PageContainer>

    <ModalForm
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :rules="formRules"
      :loading="submitLoading"
      width="550px"
      @submit="handleSubmit"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="角色" prop="role">
            <el-select v-model="formData.role" style="width: 100%">
              <el-option v-for="(label, key) in UserRoleLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="formData.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职位" prop="position">
            <el-input v-model="formData.position" placeholder="请输入职位" />
          </el-form-item>
        </el-col>
      </el-row>
    </ModalForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { PageContainer, ProTable, ModalForm } from '@/components';
import {
  getUserListApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from '@/api/auth';
import { UserRoleLabel } from '@/constants/recruitment';

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<any>({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  role: 'hr',
  status: 1,
  department: '',
  position: '',
});

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getUserListApi({
      page: page.value,
      pageSize: pageSize.value,
    });
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (p: number, ps: number) => {
  page.value = p;
  pageSize.value = ps;
  fetchList();
};

const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '新增用户';
  Object.assign(formData, {
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    role: 'hr',
    status: 1,
    department: '',
    position: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  dialogTitle.value = '编辑用户';
  Object.assign(formData, row);
  formData.password = '';
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateUserApi(formData.id, formData);
      ElMessage.success('更新成功');
    } else {
      await createUserApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteUserApi(row.id);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.system-page {
  .user-toolbar {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
