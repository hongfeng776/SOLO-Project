<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { tagApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { TagInfo, TableColumn, ApiResponse } from '@/types';
import { sleep } from '@/utils/common';

const tableRef = ref<InstanceType<typeof BaseTable>>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const list = ref<TagInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchKeyword = ref('');
const selected = ref<TagInfo[]>([]);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);
const submitDisabled = ref(false);
const createBtnDisabled = ref(false);

const form = reactive({
  name: '',
  remark: '',
  sort: 0,
  status: 1 as number,
});

const nameChecking = ref(false);
const sortShake = ref(false);
const sortError = ref('');

const validateName = async (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value || !value.trim()) {
    callback(new Error('请输入标签名称'));
    return;
  }
  if (value.trim().length < 1 || value.trim().length > 30) {
    callback(new Error('标签名称 1-30 个字符'));
    return;
  }
  if (modalMode.value === 'edit' && editingId.value) {
    const current = list.value.find(t => t.id === editingId.value);
    if (current && current.name === value.trim()) {
      callback();
      return;
    }
  }
  nameChecking.value = true;
  try {
    const res = await tagApi.list({ keyword: value.trim(), pageSize: 100 });
    if (res.code === 0 && res.data) {
      const exists = res.data.list.some(t => t.name === value.trim() && t.id !== editingId.value);
      if (exists) {
        callback(new Error('标签名称已存在'));
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

const validateSort = (_rule: any, value: number, callback: (error?: Error) => void) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入排序权重'));
    return;
  }
  if (isNaN(value) || value < 0 || value > 99999) {
    sortError.value = '排序权重必须在 0 - 99999 范围内';
    sortShake.value = true;
    setTimeout(() => (sortShake.value = false), 400);
    setTimeout(() => (sortError.value = ''), 2500);
    callback(new Error('排序权重超出范围：0 - 99999'));
    return;
  }
  sortError.value = '';
  callback();
};

const rules: FormRules = {
  name: [
    { required: true, validator: validateName, trigger: 'blur' },
  ],
  sort: [
    { required: true, validator: validateSort, trigger: 'change' },
  ],
};

const statusOptions = [
  { value: 1, label: '启用', type: 'success' },
  { value: 0, label: '禁用', type: 'info' },
];

const statusTagType = computed(() => (status: number) => {
  const opt = statusOptions.find(o => o.value === status);
  return opt?.type || 'info';
});

const statusLabel = computed(() => (status: number) => {
  const opt = statusOptions.find(o => o.value === status);
  return opt?.label || '未知';
});

const columns: TableColumn<TagInfo>[] = [
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { prop: 'name', label: '标签名称', minWidth: 160, ellipsis: true, sortable: true },
  { prop: 'sort', label: '排序权重', width: 110, align: 'center', sortable: true },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    slot: 'status',
  },
  {
    prop: 'remark',
    label: '标签备注',
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
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    const sort = tableRef.value?.getSortState?.() || { prop: '', order: null };
    if (sort.prop && sort.order) {
      params.orderBy = sort.prop;
      params.orderDir = sort.order === 'ascending' ? 'ASC' : 'DESC';
    }
    const res = await tagApi.list(params);
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

const handleRowSelect = (rows: TagInfo[]) => {
  selected.value = rows;
};

const handleSortChange = () => {
  fetchData();
};

const openCreate = () => {
  if (createBtnDisabled.value) return;
  createBtnDisabled.value = true;
  setTimeout(() => {
    createBtnDisabled.value = false;
  }, 300);

  modalMode.value = 'create';
  editingId.value = null;
  sortError.value = '';
  Object.assign(form, {
    name: '',
    remark: '',
    sort: 0,
    status: 1,
  });
  nextTick(() => {
    formRef.value?.clearValidate?.();
  });
  modalVisible.value = true;
};

const openEdit = (row: TagInfo) => {
  modalMode.value = 'edit';
  editingId.value = row.id;
  sortError.value = '';
  Object.assign(form, {
    name: row.name,
    remark: row.remark || '',
    sort: row.sort,
    status: row.status,
  });
  nextTick(() => {
    formRef.value?.clearValidate?.();
  });
  modalVisible.value = true;
};

const handleModalOk = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitDisabled.value = true;
  modalLoading.value = true;
  try {
    let res: ApiResponse<TagInfo>;
    const payload = { ...form, name: form.name.trim() } as any;
    if (modalMode.value === 'create') {
      res = await tagApi.create(payload);
    } else if (editingId.value) {
      res = await tagApi.update(editingId.value, payload);
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

const handleDelete = async (row: TagInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定删除标签 "${row.name}" 吗？\n删除后不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'confirm-dialog',
      },
    );
    const res = await tagApi.remove(row.id);
    if (res.code === 0) {
      ElMessage.success('删除成功');
      fetchData();
    }
  } catch (err: any) {
    if (err?.message) {
      ElMessage.error(err.message);
    }
    /* cancel */
  }
};

const handleBatchDelete = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning('请先选择要删除的标签');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selected.value.length} 个标签吗？\n删除后不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await Promise.all(selected.value.map((r) => tagApi.remove(r.id)));
    ElMessage.success(`成功删除 ${selected.value.length} 个标签`);
    tableRef.value?.clearSelection?.();
    selected.value = [];
    fetchData();
  } catch (err: any) {
    if (err?.message) {
      ElMessage.error(err.message);
    }
    /* cancel */
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="page-wrap">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-item">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入标签名称"
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
        <el-button type="success" plain :disabled="createBtnDisabled" @click="openCreate">
          <el-icon><Plus /></el-icon>新增标签
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
        table-key="content-tags"
        empty-text="暂无标签数据，请先新增标签"
        @pageChange="handlePageChange"
        @selectionChange="handleRowSelect"
        @sortChange="handleSortChange"
        class="tag-table"
      >
        <template #status="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
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
      :title="modalMode === 'create' ? '新增标签' : '编辑标签'"
      width="560px"
      :confirm-loading="modalLoading || submitDisabled"
      @ok="handleModalOk"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入标签名称（1-30字符）"
            maxlength="30"
            show-word-limit
            class="form-input"
          >
            <template #suffix>
              <el-icon v-if="nameChecking" class="is-loading"><Loading /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序权重" prop="sort" :class="{ shake: sortShake }">
              <el-input-number
                v-model="form.sort"
                :min="0"
                :max="99999"
                :step="1"
                controls-position="right"
                style="width: 100%"
                placeholder="数值越小越靠前"
              />
              <transition name="slide-fade">
                <div v-if="sortError" class="sort-error-tip">
                  <el-icon><WarningFilled /></el-icon>
                  <span>{{ sortError }}</span>
                </div>
              </transition>
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
        <el-form-item label="标签备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入标签备注（选填）"
            maxlength="200"
            show-word-limit
            class="form-input"
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

.tag-table {
  :deep(.el-table__body tr) {
    transition:
      transform $duration-base $ease-in-out,
      box-shadow $duration-base $ease-in-out;
  }
  :deep(.el-table__body tr:hover) {
    transform: scale(1.004);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    z-index: 1;
    position: relative;
  }
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.form-input {
  transition:
    box-shadow $duration-fast $ease-in-out,
    transform $duration-fast $ease-in-out;
  :deep(.el-input__wrapper.is-focus),
  :deep(.el-textarea__inner:focus) {
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18) !important;
    transform: scale(1.01);
    border-color: #1677ff !important;
  }
  :deep(.el-textarea__inner) {
    transition:
      box-shadow $duration-fast $ease-in-out,
      transform $duration-fast $ease-in-out,
      border-color $duration-fast $ease-in-out;
  }
}

.shake {
  animation: shake-animation 0.4s $ease-in-out;
  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase),
  :deep(.el-input__wrapper) {
    border-color: #ff4d4f !important;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.18) !important;
  }
}

.sort-error-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(255, 77, 79, 0.08);
  border: 1px solid rgba(255, 77, 79, 0.3);
  border-radius: 4px;
  color: #ff4d4f;
  font-size: $font-size-xs;
  line-height: 1.5;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.submit-btn {
  &:active:not(:disabled) {
    background: #1677ff !important;
    border-color: #1677ff !important;
  }
}

@keyframes shake-animation {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}
</style>
