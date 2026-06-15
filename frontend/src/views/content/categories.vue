<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { categoryApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { CategoryInfo, TableColumn, ApiResponse } from '@/types';
import { sleep, formatThousand } from '@/utils/common';

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

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<(CategoryInfo & { contentCount?: number }) | null>(null);

const form = reactive({
  name: '',
  sort: 0,
  description: '',
  status: 1 as number,
});

const nameChecking = ref(false);
const sortShake = ref(false);
const sortError = ref('');
const switchingStatusIds = ref<Set<number>>(new Set());

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

const validateSort = (_rule: any, value: number, callback: (error?: Error) => void) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入排序序号'));
    return;
  }
  if (isNaN(value) || value < 0 || value > 9999) {
    sortError.value = '排序序号必须在 0 - 9999 范围内';
    sortShake.value = true;
    setTimeout(() => (sortShake.value = false), 400);
    setTimeout(() => (sortError.value = ''), 2500);
    callback(new Error('排序序号超出范围：0 - 9999'));
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
  { prop: 'sort', label: '排序序号', width: 110, align: 'center', sortable: true },
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
  openDetail(row);
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
  sortError.value = '';
  Object.assign(form, {
    name: '',
    sort: 0,
    description: '',
    status: 1,
  });
  nextTick(() => {
    formRef.value?.clearValidate?.();
  });
  modalVisible.value = true;
};

const openEdit = (row: CategoryInfo) => {
  modalMode.value = 'edit';
  editingId.value = row.id;
  sortError.value = '';
  Object.assign(form, {
    name: row.name,
    sort: row.sort,
    description: row.description || '',
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

const handleStatusChange = async (row: CategoryInfo, newStatus: number) => {
  if (switchingStatusIds.value.has(row.id)) return;
  const oldStatus = row.status;
  switchingStatusIds.value.add(row.id);
  try {
    const res = await categoryApi.update(row.id, { status: newStatus });
    if (res.code === 0) {
      ElMessage.success(`已${newStatus === 1 ? '开启' : '关闭'}展示：${row.name}`);
      const target = list.value.find(c => c.id === row.id);
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

const handleDelete = async (row: CategoryInfo) => {
  try {
    const detailRes = await categoryApi.detail(row.id);
    const boundCount = detailRes.code === 0 && detailRes.data ? (detailRes.data as any).contentCount || 0 : 0;
    if (boundCount > 0) {
      ElMessageBox.alert(
        `分类 "${row.name}" 下关联了 ${boundCount} 条内容，请先解绑或删除关联内容后再操作。`,
        '删除受限',
        {
          confirmButtonText: '我知道了',
          type: 'warning',
          customClass: 'confirm-dialog',
        },
      );
      return;
    }
    await ElMessageBox.confirm(
      `确定删除分类 "${row.name}" 吗？\n删除后不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'confirm-dialog',
      },
    );
    const res = await categoryApi.remove(row.id);
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
    ElMessage.warning('请先选择要删除的分类');
    return;
  }
  try {
    const details = await Promise.all(
      selected.value.map(async (r) => {
        const d = await categoryApi.detail(r.id);
        return { row: r, count: d.code === 0 && d.data ? (d.data as any).contentCount || 0 : 0 };
      }),
    );
    const withContent = details.filter(d => d.count > 0);
    if (withContent.length > 0) {
      const names = withContent.map(d => `「${d.row.name}」(${d.count}条)`).join('、');
      ElMessageBox.alert(
        `以下分类存在关联内容，无法删除：\n${names}\n\n请先处理关联内容后再操作。`,
        '批量删除受限',
        {
          confirmButtonText: '我知道了',
          type: 'warning',
        },
      );
      return;
    }
    await ElMessageBox.confirm(
      `确定删除选中的 ${selected.value.length} 个分类吗？\n删除后不可恢复！`,
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
  } catch (err: any) {
    if (err?.message) {
      ElMessage.error(err.message);
    }
    /* cancel */
  }
};

const openDetail = async (row: CategoryInfo) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detailInfo.value = null;
  try {
    const res = await categoryApi.detail(row.id);
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
          <div class="status-cell">
            <el-switch
              :model-value="row.status === 1"
              :loading="switchingStatusIds.has(row.id)"
              :disabled="switchingStatusIds.has(row.id)"
              inline-prompt
              active-text="显示"
              inactive-text="隐藏"
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
            <el-form-item label="排序序号" prop="sort" :class="{ shake: sortShake }">
              <el-input-number
                v-model="form.sort"
                :min="0"
                :max="9999"
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

    <BaseModal
      v-model:visible="detailVisible"
      title="分类详情"
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
            <el-icon :size="22" class="title-icon"><Menu /></el-icon>
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
          <div class="metric-card">
            <div class="metric-value primary">
              {{ formatThousand((detailInfo as any).contentCount ?? 0) }}
            </div>
            <div class="metric-label">关联内容数</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ detailInfo.sort }}</div>
            <div class="metric-label">排序序号</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" :class="detailInfo.status === 1 ? 'success' : 'muted'">
              {{ detailInfo.status === 1 ? '✓' : '✕' }}
            </div>
            <div class="metric-label">展示状态</div>
          </div>
        </div>

        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="分类 ID">
            #{{ detailInfo.id }}
          </el-descriptions-item>
          <el-descriptions-item label="分类简介">
            <span v-if="detailInfo.description">{{ detailInfo.description }}</span>
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
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(22, 119, 255, 0.12);
    border-color: rgba(22, 119, 255, 0.3);
  }
}

.metric-value {
  font-size: 22px;
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
