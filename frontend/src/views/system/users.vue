<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { userApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { UserInfo, TableColumn, PaginatedData, ApiResponse } from '@/types';

const tableRef = ref<InstanceType<typeof BaseTable>>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const list = ref<UserInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const selected = ref<UserInfo[]>([]);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  email: '',
  phone: '',
  role: 'user',
  status: 1,
});

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '3-20 字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '最多 20 字符', trigger: 'blur' },
  ],
  password: [
    { required: () => modalMode.value === 'create', message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '6-32 字符', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '邮箱格式错误', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$|^$/, message: '手机号格式错误', trigger: 'blur' },
  ],
};

const columns: TableColumn<UserInfo>[] = [
  { prop: 'username', label: '用户名', width: 140, ellipsis: true },
  { prop: 'nickname', label: '昵称', width: 120 },
  { prop: 'email', label: '邮箱', minWidth: 180, ellipsis: true },
  { prop: 'phone', label: '手机号', width: 140 },
  {
    prop: 'role',
    label: '角色',
    width: 110,
    align: 'center',
    slot: 'role',
  },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    align: 'center',
    slot: 'status',
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    width: 170,
    align: 'center',
    formatter: (_r, _c, val) => (val ? new Date(val).toLocaleString('zh-CN') : '-'),
  },
  {
    prop: 'actions',
    label: '操作',
    width: 180,
    fixed: 'right',
    align: 'center',
    slot: 'actions',
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await userApi.list({ page: page.value, pageSize: pageSize.value, keyword: keyword.value });
    if (res.code === 0 && res.data) {
      list.value = res.data.list;
      total.value = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchData();
};

const handlePageChange = (p: number, s: number) => {
  page.value = p;
  pageSize.value = s;
  fetchData();
};

const handleRowSelect = (rows: UserInfo[]) => {
  selected.value = rows;
};

const openCreate = () => {
  modalMode.value = 'create';
  editingId.value = null;
  Object.assign(form, {
    username: '',
    nickname: '',
    password: '',
    email: '',
    phone: '',
    role: 'user',
    status: 1,
  });
  modalVisible.value = true;
};

const openEdit = (row: UserInfo) => {
  modalMode.value = 'edit';
  editingId.value = row.id;
  Object.assign(form, {
    username: row.username,
    nickname: row.nickname,
    password: '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role,
    status: row.status,
  });
  modalVisible.value = true;
};

const handleModalOk = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  modalLoading.value = true;
  try {
    let res: ApiResponse<UserInfo>;
    const payload = { ...form } as any;
    if (!payload.password) delete payload.password;
    if (modalMode.value === 'create') {
      res = await userApi.create({ ...payload, password: form.password });
    } else if (editingId.value) {
      res = await userApi.update(editingId.value, payload);
    } else return;
    if (res.code === 0) {
      ElMessage.success(modalMode.value === 'create' ? '创建成功' : '更新成功');
      modalVisible.value = false;
      fetchData();
    }
  } finally {
    modalLoading.value = false;
  }
};

const handleDelete = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${row.nickname}" 吗？`, '删除确认', {
      type: 'warning',
    });
    const res = await userApi.remove(row.id);
    if (res.code === 0) {
      ElMessage.success('删除成功');
      fetchData();
    }
  } catch {
    /* cancel */
  }
};

const handleBatchDelete = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning('请先选择要删除的行');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selected.value.length} 个用户吗？`, '批量删除', { type: 'warning' });
    await Promise.all(selected.value.map((r) => userApi.remove(r.id)));
    ElMessage.success('批量删除成功');
    tableRef.value?.clearSelection?.();
    fetchData();
  } catch {
    /* cancel */
  }
};

const toggleStatus = async (row: UserInfo) => {
  const newStatus = row.status === 1 ? 0 : 1;
  const res = await userApi.update(row.id, { status: newStatus });
  if (res.code === 0) {
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用');
    fetchData();
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="page-wrap">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名/昵称/邮箱"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button @click="keyword = ''; handleSearch()">重置</el-button>
        <div class="spacer" />
        <el-button type="success" plain @click="openCreate">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
        <el-button type="danger" plain :disabled="selected.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <BaseTable
        ref="tableRef"
        :columns="columns"
        :data="list"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        :show-selection="true"
        :highlight-current-row="true"
        @pageChange="handlePageChange"
        @selectionChange="handleRowSelect"
      >
        <template #role="{ row }">
          <el-tag :type="row.role === 'admin' ? 'primary' : 'success'" size="small" effect="light">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-switch
            :model-value="row.status === 1"
            size="small"
            active-text="启用"
            inactive-text="禁用"
            @change="() => toggleStatus(row)"
          />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </BaseTable>
    </el-card>

    <BaseModal
      v-model:visible="modalVisible"
      :title="modalMode === 'create' ? '新增用户' : '编辑用户'"
      width="560px"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="86px" label-position="right">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="modalMode === 'edit'" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item :label="modalMode === 'create' ? '密码' : '新密码'" prop="password">
          <el-input v-model="form.password" type="password" show-password :placeholder="modalMode === 'create' ? '请输入密码' : '留空不修改'" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="选填" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role">
                <el-option label="普通用户" value="user" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </BaseModal>
  </div>
</template>

<style lang="scss" scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
.filter-card {
  padding: $spacing-md $spacing-lg !important;
  border-radius: $radius-lg;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}
.spacer {
  flex: 1;
}
.table-card {
  padding: $spacing-md !important;
  border-radius: $radius-lg;
}
</style>
