<script setup lang="ts">
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { userApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { UserInfo, TableColumn, PaginatedData, ApiResponse } from '@/types';
import { sleep, formatThousand } from '@/utils/common';

const tableRef = ref<InstanceType<typeof BaseTable>>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const list = ref<UserInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const searchUsername = ref('');
const searchNickname = ref('');
const searchError = ref('');
const searchShake = ref(false);
const selected = ref<UserInfo[]>([]);
const showBackTop = ref(false);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);
const submitDisabled = ref(false);

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  phone: '',
  role: 'user',
  createdAt: '',
});

const rules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号 3-20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '账号只能包含字母、数字、下划线', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '昵称最多 20 字符', trigger: 'blur' },
  ],
  password: [
    { required: () => modalMode.value === 'create', message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码 6-32 个字符', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$|^$/, message: '手机号格式错误', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择用户类型', trigger: 'change' },
  ],
};

const columns: TableColumn<UserInfo>[] = [
  { prop: 'username', label: '账号', width: 140, ellipsis: true, sortable: true },
  { prop: 'nickname', label: '昵称', width: 140, sortable: true },
  { prop: 'phone', label: '手机号', width: 140, sortable: true },
  {
    prop: 'fansCount',
    label: '粉丝数',
    width: 120,
    align: 'right',
    sortable: true,
    formatter: (_r, _c, val) => formatThousand(val),
  },
  {
    prop: 'visits',
    label: '访问量',
    width: 120,
    align: 'right',
    sortable: true,
    formatter: (_r, _c, val) => formatThousand(val),
  },
  {
    prop: 'role',
    label: '用户类型',
    width: 120,
    align: 'center',
    sortable: true,
    slot: 'role',
  },
  {
    prop: 'createdAt',
    label: '注册时间',
    width: 180,
    align: 'center',
    sortable: true,
    formatter: (_r, _c, val) => (val ? new Date(val).toLocaleString('zh-CN') : '-'),
  },
  {
    prop: 'actions',
    label: '操作',
    width: 160,
    fixed: 'right',
    align: 'center',
    slot: 'actions',
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (searchUsername.value) params.username = searchUsername.value;
    if (searchNickname.value) params.nickname = searchNickname.value;
    const sort = tableRef.value?.getSortState?.() || { prop: '', order: null };
    if (sort.prop && sort.order) {
      params.orderBy = sort.prop;
      params.orderDir = sort.order === 'ascending' ? 'ASC' : 'DESC';
    }

    const res = await userApi.list(params);
    if (res.code === 0 && res.data) {
      list.value = res.data.list;
      total.value = res.data.total;
    }
  } catch {
    /* error handled by axios interceptor */
  } finally {
    loading.value = false;
  }
};

const validateSearch = (): boolean => {
  if (searchUsername.value && !/^[a-zA-Z0-9_]{1,20}$/.test(searchUsername.value)) {
    searchError.value = '账号格式不正确（字母、数字、下划线，1-20字符）';
    searchShake.value = true;
    setTimeout(() => (searchShake.value = false), 300);
    return false;
  }
  if (searchNickname.value && searchNickname.value.length > 20) {
    searchError.value = '昵称长度不能超过 20 字符';
    searchShake.value = true;
    setTimeout(() => (searchShake.value = false), 300);
    return false;
  }
  searchError.value = '';
  return true;
};

const handleSearch = () => {
  if (!validateSearch()) return;
  page.value = 1;
  fetchData();
};

const handleSearchReset = () => {
  searchUsername.value = '';
  searchNickname.value = '';
  searchError.value = '';
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

const handleRowDblClick = (row: UserInfo) => {
  openEdit(row);
};

const handleSortChange = () => {
  fetchData();
};

const handleScroll = () => {
  showBackTop.value = window.scrollY > 500;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openCreate = () => {
  modalMode.value = 'create';
  editingId.value = null;
  Object.assign(form, {
    username: '',
    nickname: '',
    password: '',
    phone: '',
    role: 'user',
    createdAt: new Date().toISOString().slice(0, 10),
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
    phone: row.phone || '',
    role: row.role,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : '',
  });
  modalVisible.value = true;
};

const handleModalOk = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitDisabled.value = true;
  modalLoading.value = true;
  try {
    let res: ApiResponse<UserInfo>;
    const payload = { ...form } as any;
    if (!payload.password) delete payload.password;
    if (modalMode.value === 'create') {
      res = await userApi.create({ ...payload, password: form.password });
    } else if (editingId.value) {
      delete payload.username;
      delete payload.createdAt;
      res = await userApi.update(editingId.value, payload);
    } else return;

    if (res.code === 0) {
      ElMessage.success(modalMode.value === 'create' ? '创建成功' : '更新成功');
      modalVisible.value = false;
      fetchData();
    }
  } catch {
    /* error handled by axios interceptor */
  } finally {
    await sleep(300);
    submitDisabled.value = false;
    modalLoading.value = false;
  }
};

const handleDelete = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${row.nickname}"（${row.username}）吗？`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'confirm-dialog',
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
    ElMessage.warning('请先选择要删除的用户');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selected.value.length} 个用户吗？\n此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await Promise.all(selected.value.map((r) => userApi.remove(r.id)));
    ElMessage.success(`成功删除 ${selected.value.length} 个用户`);
    tableRef.value?.clearSelection?.();
    selected.value = [];
    fetchData();
  } catch {
    /* cancel */
  }
};

const roleLabel = computed(() => (row: UserInfo) => {
  return row.role === 'admin' ? '管理员' : '普通用户';
});

const roleTagType = computed(() => (row: UserInfo) => {
  return row.role === 'admin' ? 'primary' : 'success';
});

onMounted(() => {
  fetchData();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="page-wrap">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row" :class="{ shake: searchShake }">
        <div class="filter-item">
          <el-input
            v-model="searchUsername"
            placeholder="请输入用户账号"
            clearable
            class="filter-input"
            :class="{ 'is-search-error': !!searchError }"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </div>
        <div class="filter-item">
          <el-input
            v-model="searchNickname"
            placeholder="请输入用户昵称"
            clearable
            class="filter-input"
            :class="{ 'is-search-error': !!searchError }"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Avatar /></el-icon></template>
          </el-input>
        </div>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button @click="handleSearchReset">
          <el-icon><RefreshRight /></el-icon>重置
        </el-button>
        <div class="spacer" />
        <el-button type="success" plain @click="openCreate">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
        <el-button type="danger" plain :disabled="selected.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
      <div v-if="searchError" class="search-error-tip">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ searchError }}</span>
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
        table-key="sys-users"
        @pageChange="handlePageChange"
        @selectionChange="handleRowSelect"
        @rowDoubleClick="handleRowDblClick"
        @sortChange="handleSortChange"
      >
        <template #role="{ row }">
          <el-tag :type="roleTagType(row)" size="small" effect="light">
            {{ roleLabel(row) }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <div class="row-actions">
            <el-button link type="primary" size="small" @click="openEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </template>
      </BaseTable>
    </el-card>

    <BaseModal
      v-model:visible="modalVisible"
      :title="modalMode === 'create' ? '新增用户' : '编辑用户'"
      width="580px"
      :confirm-loading="modalLoading || submitDisabled"
      @ok="handleModalOk"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" :disabled="modalMode === 'edit'" placeholder="请输入账号（字母、数字、下划线）" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="选填，11位手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册时间" prop="createdAt">
              <el-date-picker
                v-model="form.createdAt"
                type="date"
                placeholder="选择注册日期"
                style="width: 100%"
                :disabled="modalMode === 'edit'"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用户类型" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio value="user">普通用户</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="modalMode === 'create' ? '登录密码' : '重置密码'" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="modalMode === 'create' ? '请输入密码，6-32字符' : '留空不修改密码'"
          />
        </el-form-item>
      </el-form>
      <template #footer="{ ok, cancel, loading }">
        <el-button @click="cancel">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="loading || submitDisabled"
          @click="ok"
          class="submit-btn"
        >
          {{ modalMode === 'create' ? '确认新增' : '保存修改' }}
        </el-button>
      </template>
    </BaseModal>

    <transition name="fade">
      <div v-show="showBackTop" class="back-to-top" @click="scrollToTop" title="返回顶部">
        <el-icon :size="22"><Top /></el-icon>
      </div>
    </transition>
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
  &.shake {
    animation: shake-animation $duration-base $ease-in-out;
  }
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-input {
  width: 220px;
  transition:
    box-shadow $duration-fast $ease-in-out,
    transform $duration-fast $ease-in-out;
  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18) !important;
    transform: scale(1.018);
    border-color: #1677ff !important;
  }
  &.is-search-error :deep(.el-input__wrapper) {
    animation: shake-animation $duration-base $ease-in-out;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.18) !important;
    border-color: #ff4d4f !important;
  }
}

.search-error-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: $spacing-sm;
  padding: 8px 12px;
  background: rgba(255, 77, 79, 0.08);
  border: 1px solid rgba(255, 77, 79, 0.3);
  border-radius: $radius-md;
  color: #ff4d4f;
  font-size: $font-size-sm;
  animation: shake-animation $duration-base $ease-in-out;
}

.spacer {
  flex: 1;
}

.table-card {
  padding: $spacing-md !important;
  border-radius: $radius-lg;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.submit-btn {
  &:active:not(:disabled) {
    background: #1677ff !important;
    border-color: #1677ff !important;
  }
}

.back-to-top {
  position: fixed;
  right: 40px;
  bottom: 60px;
  width: 48px;
  height: 48px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  cursor: pointer;
  transition:
    all $duration-fast $ease-in-out,
    color $duration-fast $ease-in-out;
  z-index: $z-index-backtop;
  &:hover {
    color: $color-primary;
    border-color: $color-primary;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.2);
  }
  &:active {
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity $duration-base $ease-in-out,
    transform $duration-base $ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
