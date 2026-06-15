<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import { categoryApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { CategoryInfo, TableColumn, ApiResponse } from '@/types';
import { sleep } from '@/utils/common';

const tableRef = ref<InstanceType<typeof BaseTable>>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const list = ref<CategoryInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchKeyword = ref('');
const selected = ref<CategoryInfo[]>([]);
const showBackTop = ref(false);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);
const submitDisabled = ref(false);

const form = reactive({
  name: '',
  sort: 0,
  description: '',
  status: 1 as number,
});

const nameChecking = ref(false);

const validateName = async (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value || !value.trim()) {
    callback(new Error('请输入分类名称'));
    return;
  }
  if (value.trim().length < 2 || value.trim().length > 20) {
    callback(new Error('分类名称 2-20 个字符'));
    return;
  }
  if (modalMode.value === 'edit' && editingId.value) {
    const current = list.value.find(c => c.id === editingId.value);
    if (current && current.name === value.trim()) {
      callback();
      return;
    }
  }
  nameChecking.value = true;
  try {
    const res = await categoryApi.list({ keyword: value.trim() });
    if (res.code === 0 && res.data) {
      const exists = res.data.list.some(c => c.name === value.trim() && c.id !== editingId.value);
      if (exists) {
        callback(new Error('分类名称已存在'));
      } else {
        callback();
      }
    } else {
      callback();
    }
  } catch {
    callback();
  } finally {
    nameChecking.value = false;
  }
};

const rules: FormRules = {
  name: [
    { required: true, validator: validateName, trigger: 'blur' },
  ],
  sort: [
    { required: true, message: '请输入排序序号', trigger: 'blur' },
    { type: 'number', min: 0, max: 9999, message: '排序序号 0-9999', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择展示状态', trigger: 'change' },
  ],
};

const statusOptions = [
  { value: 1, label: '显示', type: 'success' },
  { value: 0, label: '隐藏', type: 'info' },
];

const statusTagType = computed(() => (status: number) => {
  const opt = statusOptions.find(o => o.value === status);
  return opt?.type || 'info';
});

const statusLabel = computed(() => (status: number) => {
  const opt = statusOptions.find(o => o.value === status);
  return opt?.label || '未知';
});

const columns: TableColumn<CategoryInfo>[] = [
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { prop: 'name', label: '分类名称', minWidth: 180, ellipsis: true, sortable: true },
  { prop: 'sort', label: '排序', width: 100, align: 'center', sortable: true },
  {
    prop: 'status',
    label: '展示状态',
    width: 120,
    align: 'center',
    slot: 'status',
  },
  {
    prop: 'description',
    label: '分类简介',
    minWidth: 200,
    ellipsis: true,
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    width: 180,
    align: 'center',
    sortable: true,
    formatter: (_r, _c, val) => (val ? new Date(val).toLocaleString('zh-CN') : '-'),
  },
  {
    prop: 'updatedAt',
    label: '更新时间',
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
    const params: Record<string, any> = {};
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    const sort = tableRef.value?.getSortState?.() || { prop: '', order: null };
    if (sort.prop && sort.order) {
      params.orderBy = sort.prop;
      params.orderDir = sort.order === 'ascending' ? 'ASC' : 'DESC';
    }
    const res = await categoryApi.list(params);
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

const handleSearch = () => {
  page.value = 1;
  fetchData();
};

const handleSearchReset = () => {
  searchKeyword.value = '';
  page.value = 1;
  fetchData();
};

const handlePageChange = (p: number, s: number) => {
  page.value = p;
  pageSize.value = s;
  fetchData();
};

const handleRowSelect = (rows: CategoryInfo[]) => {
  selected.value = rows;
};

const handleRowDblClick = (row: CategoryInfo) => {
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
    name: '',
    sort: 0,
    description: '',
    status: 1,
  });
  modalVisible.value = true;
};

const openEdit = (row: CategoryInfo) => {
  modalMode.value = 'edit';
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    sort: row.sort,
    description: row.description || '',
    status: row.status,
  });
  modalVisible.value = true;
};

const handleModalOk = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitDisabled.value = true;
  modalLoading.value = true;
  try {
    let res: ApiResponse<CategoryInfo>;
    const payload = { ...form, name: form.name.trim() } as any;
    if (modalMode.value === 'create') {
      res = await categoryApi.create(payload);
    } else if (editingId.value) {
      res = await categoryApi.update(editingId.value, payload);
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

const handleDelete = async (row: CategoryInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除分类 "${row.name}" 吗？\n删除后不可恢复，关联内容将失去分类归属！`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'confirm-dialog',
    });
    const res = await categoryApi.remove(row.id);
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
    ElMessage.warning('请先选择要删除的分类');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selected.value.length} 个分类吗？\n删除后不可恢复，关联内容将失去分类归属！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await Promise.all(selected.value.map((r) => categoryApi.remove(r.id)));
    ElMessage.success(`成功删除 ${selected.value.length} 个分类`);
    tableRef.value?.clearSelection?.();
    selected.value = [];
    fetchData();
  } catch {
    /* cancel */
  }
};

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
      <div class="filter-row">
        <div class="filter-item">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入分类名称"
            clearable
            class="filter-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
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
          <el-icon><Plus /></el-icon>新增分类
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
        table-key="content-categories"
        empty-text="暂无分类数据，请先新增分类"
        @pageChange="handlePageChange"
        @selectionChange="handleRowSelect"
        @rowDoubleClick="handleRowDblClick"
        @sortChange="handleSortChange"
      >
        <template #status="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small" effect="light">
            {{ statusLabel(row.status) }}
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
      :title="modalMode === 'create' ? '新增分类' : '编辑分类'"
      width="560px"
      :confirm-loading="modalLoading || submitDisabled"
      @ok="handleModalOk"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称（2-20字符）"
            maxlength="20"
            show-word-limit
          >
            <template #suffix>
              <el-icon v-if="nameChecking" class="is-loading"><Loading /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序序号" prop="sort">
              <el-input-number
                v-model="form.sort"
                :min="0"
                :max="9999"
                :step="1"
                controls-position="right"
                style="width: 100%"
                placeholder="数值越小越靠前"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="展示状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">显示</el-radio>
                <el-radio :value="0">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分类简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类简介（选填）"
            maxlength="200"
            show-word-limit
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
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-input {
  width: 260px;
  transition:
    box-shadow $duration-fast $ease-in-out,
    transform $duration-fast $ease-in-out;
  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18) !important;
    transform: scale(1.018);
    border-color: #1677ff !important;
  }
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
