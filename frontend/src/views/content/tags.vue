<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { tagApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import TableSkeleton from '@/components/TableSkeleton';
import type { TagInfo, TableColumn, ApiResponse } from '@/types';
import { sleep, formatThousand } from '@/utils/common';

const tableRef = ref<InstanceType<typeof BaseTable>>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const batchLoading = ref(false);
const list = ref<TagInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchKeyword = ref('');
const statusFilter = ref('');
const selected = ref<TagInfo[]>([]);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);
const submitDisabled = ref(false);
const createBtnDisabled = ref(false);

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<(TagInfo & { contentCount?: number }) | null>(null);

const form = reactive({
  name: '',
  remark: '',
  sort: 0,
  status: 1 as number,
});

const nameChecking = ref(false);
const sortShake = ref(false);
const sortError = ref('');
const switchingStatusIds = ref<Set<number>>(new Set());

const statusFilterOptions = [
  { value: '', label: '全部' },
  { value: '1', label: '启用' },
  { value: '0', label: '禁用' },
];

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
    width: 130,
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
    width: 220,
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
    if (statusFilter.value !== '') params.status = statusFilter.value;
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
  statusFilter.value = '';
  page.value = 1;
  fetchData();
};

const handleStatusFilterChange = (val: string) => {
  statusFilter.value = val;
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

const handleStatusChange = async (row: TagInfo, newStatus: number) => {
  if (switchingStatusIds.value.has(row.id)) return;
  const oldStatus = row.status;
  switchingStatusIds.value.add(row.id);
  try {
    const res = await tagApi.update(row.id, { status: newStatus });
    if (res.code === 0) {
      ElMessage.success(`已${newStatus === 1 ? '启用' : '禁用'}标签：${row.name}`);
      const target = list.value.find(t => t.id === row.id);
      if (target) target.status = newStatus;
    } else {
      row.status = oldStatus;
    }
  } catch {
    row.status = oldStatus;
  } finally {
    switchingStatusIds.value.delete(row.id);
  }
};

const handleDelete = async (row: TagInfo) => {
  try {
    const detailRes = await tagApi.detail(row.id);
    const boundCount = detailRes.code === 0 && detailRes.data ? (detailRes.data as any).contentCount || 0 : 0;
    if (boundCount > 0) {
      ElMessageBox.alert(
        `标签 "${row.name}" 下关联了 ${formatThousand(boundCount)} 条内容，删除将自动解除关联关系。`,
        '删除提示',
        {
          confirmButtonText: '继续删除',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'confirm-dialog',
          showCancelButton: true,
        },
      );
    } else {
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
    }
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
    batchLoading.value = true;
    await sleep(500);
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
  } finally {
    batchLoading.value = false;
  }
};

const handleBatchEnable = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning('请先选择要启用的标签');
    return;
  }
  try {
    batchLoading.value = true;
    await sleep(300);
    await Promise.all(selected.value.map((r) => tagApi.update(r.id, { status: 1 })));
    ElMessage.success(`成功启用 ${selected.value.length} 个标签`);
    tableRef.value?.clearSelection?.();
    selected.value = [];
    fetchData();
  } catch {
    /* error handled */
  } finally {
    batchLoading.value = false;
  }
};

const handleBatchDisable = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning('请先选择要禁用的标签');
    return;
  }
  try {
    batchLoading.value = true;
    await sleep(300);
    await Promise.all(selected.value.map((r) => tagApi.update(r.id, { status: 0 })));
    ElMessage.success(`成功禁用 ${selected.value.length} 个标签`);
    tableRef.value?.clearSelection?.();
    selected.value = [];
    fetchData();
  } catch {
    /* error handled */
  } finally {
    batchLoading.value = false;
  }
};

const openDetail = async (row: TagInfo) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detailInfo.value = null;
  try {
    const res = await tagApi.detail(row.id);
    if (res.code === 0 && res.data) {
      detailInfo.value = res.data;
    }
  } catch {
    /* error handled */
  } finally {
    detailLoading.value = false;
  }
};

const formatDate = (val: string | Date | undefined) => {
  if (!val) return '-';
  return new Date(val).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
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
        <div class="status-filter-wrap">
          <div
            v-for="opt in statusFilterOptions"
            :key="opt.value"
            class="status-filter-tag"
            :class="{ active: statusFilter === opt.value }"
            @click="handleStatusFilterChange(opt.value)"
          >
            {{ opt.label }}
          </div>
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
      </div>

      <transition name="slide-down">
        <div v-if="selected.length > 0" class="batch-bar">
          <div class="batch-info">
            <el-icon class="check-icon"><CircleCheckFilled /></el-icon>
            <span>已选中 <strong>{{ selected.length }}</strong> 项</span>
          </div>
          <div class="batch-actions">
            <el-button type="success" plain :loading="batchLoading" @click="handleBatchEnable">
              <el-icon><CircleCheck /></el-icon>批量启用
            </el-button>
            <el-button type="info" plain :loading="batchLoading" @click="handleBatchDisable">
              <el-icon><CircleClose /></el-icon>批量禁用
            </el-button>
            <el-button type="danger" plain :loading="batchLoading" @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>批量删除
            </el-button>
            <el-button link @click="tableRef?.clearSelection?.()">
              取消选择
            </el-button>
          </div>
        </div>
      </transition>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div v-if="batchLoading" class="skeleton-overlay">
        <TableSkeleton :columns="8" :rows="8" />
      </div>
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
          <div class="status-cell">
            <el-switch
              :model-value="row.status === 1"
              :loading="switchingStatusIds.has(row.id)"
              :disabled="switchingStatusIds.has(row.id)"
              inline-prompt
              active-text="启用"
              inactive-text="禁用"
              :before-change="() => !switchingStatusIds.has(row.id)"
              @change="(v: boolean) => handleStatusChange(row, v ? 1 : 0)"
              class="status-switch"
            />
          </div>
        </template>
        <template #actions="{ row }">
          <div class="row-actions">
            <el-button link type="primary" size="small" @click="openDetail(row)">
              <el-icon><View /></el-icon>详情
            </el-button>
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

    <BaseModal
      v-model:visible="detailVisible"
      title="标签详情"
      width="520px"
      :show-footer="false"
    >
      <div v-if="detailLoading" class="detail-loading">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="detailInfo" class="detail-wrap">
        <div class="detail-header">
          <div class="detail-title">
            <el-icon :size="22" class="title-icon"><PriceTag /></el-icon>
            <span>{{ detailInfo.name }}</span>
          </div>
          <el-tag
            :type="statusTagType(detailInfo.status)"
            effect="light"
            class="status-tag"
          >
            {{ statusLabel(detailInfo.status) }}
          </el-tag>
        </div>

        <div class="detail-metrics">
          <div class="metric-card highlight">
            <div class="metric-value primary">
              {{ formatThousand((detailInfo as any).contentCount ?? 0) }}
            </div>
            <div class="metric-label">关联内容数</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ detailInfo.sort }}</div>
            <div class="metric-label">排序权重</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" :class="detailInfo.status === 1 ? 'success' : 'muted'">
              {{ detailInfo.status === 1 ? '✓' : '✕' }}
            </div>
            <div class="metric-label">状态</div>
          </div>
        </div>

        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="标签 ID">
            #{{ detailInfo.id }}
          </el-descriptions-item>
          <el-descriptions-item label="标签备注">
            <span v-if="detailInfo.remark">{{ detailInfo.remark }}</span>
            <span v-else class="empty-val">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            <span class="date-text">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(detailInfo.createdAt) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">
            <span class="date-text">
              <el-icon><Clock /></el-icon>
              {{ formatDate(detailInfo.updatedAt) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
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

.status-filter-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 $spacing-xs;
}

.status-filter-tag {
  padding: 4px 16px;
  border-radius: $radius-round;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  background: $color-border-light;
  cursor: pointer;
  transition: all $duration-fast $ease-in-out;
  border: 1px solid transparent;

  &:hover {
    color: $color-primary;
    background: rgba(22, 119, 255, 0.08);
  }

  &.active {
    color: #fff;
    background: $color-primary;
    border-color: $color-primary;
    font-weight: 500;
  }
}

.spacer {
  flex: 1;
}

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%);
  border: 1px solid rgba(22, 119, 255, 0.2);
  border-radius: $radius-md;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $color-text-regular;
  font-size: $font-size-sm;

  .check-icon {
    color: $color-primary;
    font-size: 18px;
  }

  strong {
    color: $color-primary;
    font-size: $font-size-md;
    margin: 0 2px;
  }
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all $duration-base $ease-in-out;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.table-card {
  padding: $spacing-md !important;
  border-radius: $radius-lg;
  position: relative;
}

.skeleton-overlay {
  position: relative;
  z-index: 10;
  padding: 0 $spacing-sm $spacing-sm;
  background: #fff;
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

.status-cell {
  display: flex;
  justify-content: center;
}

.status-switch {
  --el-switch-on-color: #52c41a;
  --el-switch-off-color: #c0c4cc;
  transition:
    background-color 0.3s $ease-in-out,
    transform 0.2s $ease-in-out;
  :deep(.el-switch__core) {
    transition: background-color 0.3s $ease-in-out;
  }
  :deep(.el-switch__action) {
    transition:
      left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.2s $ease-in-out;
  }
  &:hover :deep(.el-switch__core) {
    filter: brightness(1.05);
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

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-xxl 0;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $color-border-light;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-xl;
  font-weight: 600;
  color: $color-text-primary;
  .title-icon {
    color: $color-primary;
  }
}

.status-tag {
  font-size: $font-size-sm;
}

.detail-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: $spacing-md $spacing-sm;
  background: linear-gradient(135deg, #f7faff 0%, #ffffff 100%);
  border: 1px solid $color-border-light;
  border-radius: $radius-md;
  transition: all 0.25s $ease-in-out;

  &.highlight {
    background: linear-gradient(135deg, #e6f4ff 0%, #f0f7ff 100%);
    border-color: rgba(22, 119, 255, 0.3);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(22, 119, 255, 0.12);
    border-color: rgba(22, 119, 255, 0.3);
  }
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: $color-text-primary;
  font-variant-numeric: tabular-nums;
  &.primary {
    color: $color-primary;
  }
  &.success {
    color: $color-success;
  }
  &.muted {
    color: $color-text-placeholder;
  }
}

.metric-label {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.detail-desc {
  :deep(.el-descriptions__label) {
    width: 110px;
    background: #fafbfc;
    color: $color-text-secondary;
    font-weight: 500;
  }
  :deep(.el-descriptions__content) {
    color: $color-text-primary;
  }
}

.date-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  :deep(svg) {
    color: $color-primary;
    flex-shrink: 0;
  }
}

.empty-val {
  color: $color-text-placeholder;
}

@keyframes shake-animation {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}
</style>
