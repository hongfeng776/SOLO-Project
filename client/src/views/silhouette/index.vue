<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">剪影素材</h2>
      <div class="header-actions">
        <el-button type="success" :icon="Download" @click="handleExport">导出 Excel</el-button>
      </div>
    </div>

    <el-form :inline="true" :model="queryForm" class="filter-bar" @submit.prevent>
      <el-form-item label="名称">
        <el-input v-model="queryForm.name" placeholder="请输入素材名称" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="queryForm.category" placeholder="全部" clearable style="width: 140px" popper-class="select-fade">
          <el-option v-for="cat in categoryList" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px" popper-class="select-fade">
          <el-option label="已上架" :value="1">
            <span class="status-option">
              <span class="status-dot status-dot-success"></span>
              已上架
            </span>
          </el-option>
          <el-option label="已下架" :value="0">
            <span class="status-option">
              <span class="status-dot status-dot-info"></span>
              已下架
            </span>
          </el-option>
          <el-option label="待审核" :value="2">
            <span class="status-option">
              <span class="status-dot status-dot-warning"></span>
              待审核
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增素材</el-button>
        <el-button type="success" :icon="Top" :disabled="!selectedIds.length" @click="handleBatchStatus(1)">批量上架</el-button>
        <el-button type="warning" :icon="Bottom" :disabled="!selectedIds.length" @click="handleBatchStatus(0)">批量下架</el-button>
        <el-button type="danger" :icon="Delete" :disabled="!selectedIds.length" @click="handleBatchDelete">批量删除</el-button>
      </div>
      <div class="toolbar-right">
        <span class="total-text">共 <b>{{ total }}</b> 条素材</span>
      </div>
    </div>

    <div v-loading="loading" class="table-wrapper">
      <el-table
        v-if="tableData.length > 0"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleEdit"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.cover"
              :src="getImageUrl(row.cover)"
              :preview-src-list="[getImageUrl(row.cover)]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
              preview-teleported
              @click.stop
            />
            <span v-else style="color: #c0c4cc">暂无</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="尺寸" width="130" align="center">
          <template #default="{ row }">
            <span v-if="row.width && row.height">{{ row.width }} × {{ row.height }}</span>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="scene" label="适配场景" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.scene || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small" type="primary" effect="plain">{{ row.category }}</el-tag>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="use_count" label="使用次数" width="100" align="center">
          <template #default="{ row }">
            <span class="use-count">{{ row.use_count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" width="170">
          <template #default="{ row }">
            <FormattedDate :value="row.created_at" format="YYYY-MM-DD HH:mm:ss" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" round>
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              link
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <EmptyState v-else description="暂无剪影素材" icon="Picture" :show-action="true" action-text="去添加" @action="handleAdd" />
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑素材' : '新增素材'"
      width="560px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="素材名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入素材名称"
            maxlength="100"
            @blur="validateNameUnique"
          />
        </el-form-item>
        <el-form-item label="封面图片" prop="cover">
          <el-upload
            class="cover-uploader"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleCoverChange"
          >
            <el-image
              v-if="coverPreview"
              :src="coverPreview"
              fit="cover"
              style="width: 120px; height: 120px; border-radius: 6px"
            />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div v-if="isEdit && formData.cover && !coverFile" class="cover-tip">点击图片可更换封面</div>
        </el-form-item>
        <el-form-item label="宽度(px)">
          <el-input-number v-model="formData.width" :min="0" :max="10000" placeholder="宽度" controls-position="right" />
        </el-form-item>
        <el-form-item label="高度(px)">
          <el-input-number v-model="formData.height" :min="0" :max="10000" placeholder="高度" controls-position="right" />
        </el-form-item>
        <el-form-item label="适配场景">
          <el-input v-model="formData.scene" placeholder="请输入适配场景" maxlength="200" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="formData.category" placeholder="请选择分类" clearable filterable allow-create style="width: 100%">
            <el-option v-for="cat in categoryList" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="2">待审核</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportDialogVisible" title="导出素材" width="420px" :close-on-click-modal="false">
      <div class="export-content">
        <div class="export-info">
          <p>导出范围：<span class="export-highlight">当前筛选结果</span></p>
          <p>预计条数：<span class="export-highlight">{{ total }} 条</span></p>
        </div>
        <div class="export-progress">
          <el-progress :percentage="exportProgress" :stroke-width="12" :text-inside="true" />
        </div>
        <div class="export-tip">{{ exportTipText }}</div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false" :disabled="exportLoading">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Plus, Delete, Top, Bottom, Download } from '@element-plus/icons-vue';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import FormattedDate from '@/components/FormattedDate.vue';
import EmptyState from '@/components/EmptyState.vue';
import {
  getSilhouetteList,
  getSilhouetteCategoryList,
  createSilhouette,
  updateSilhouette,
  deleteSilhouette,
  batchDeleteSilhouette,
  updateSilhouetteStatus,
  batchUpdateSilhouetteStatus,
  checkNameUnique,
  exportSilhouette
} from '@/api/silhouette';
import type { SilhouetteMaterialItem, SilhouetteMaterialQuery } from '@/types';
import { confirmDialog, showSuccess, getImageUrl } from '@/utils';
import * as XLSX from 'xlsx';

const router = useRouter();

const loading = ref(false);
const tableData = ref<SilhouetteMaterialItem[]>([]);
const total = ref(0);
const categoryList = ref<string[]>([]);
const selectedIds = ref<number[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number>(0);
const submitLoading = ref(false);
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const formRef = ref<FormInstance>();
const nameValidating = ref(false);

const exportDialogVisible = ref(false);
const exportLoading = ref(false);
const exportProgress = ref(0);
const exportTipText = ref('准备导出...');

const queryForm = reactive<SilhouetteMaterialQuery>({
  page: 1,
  pageSize: 20,
  name: '',
  category: '',
  status: ''
});

const formData = reactive({
  name: '',
  cover: '',
  width: null as number | null,
  height: null as number | null,
  scene: '',
  category: '',
  status: 2
});

const validateNameUnique = async (_rule: any, value: any, callback: any) => {
  if (!value || !value.trim()) {
    callback();
    return;
  }
  try {
    nameValidating.value = true;
    const res = await checkNameUnique(value.trim(), isEdit.value ? editId.value : undefined);
    if (res.unique) {
      callback();
    } else {
      callback(new Error('素材名称已存在'));
    }
  } catch {
    callback();
  } finally {
    nameValidating.value = false;
  }
};

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入素材名称', trigger: 'blur' },
    { validator: validateNameUnique, trigger: 'blur' }
  ]
});

function statusText(status: number) {
  const map: Record<number, string> = { 0: '已下架', 1: '已上架', 2: '待审核' };
  return map[status] || '未知';
}

function statusTagType(status: number) {
  const map: Record<number, 'success' | 'info' | 'warning' | 'danger' | 'primary'> = {
    0: 'info',
    1: 'success',
    2: 'warning'
  };
  return map[status] || 'info';
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getSilhouetteList(queryForm);
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}

async function fetchCategories() {
  try {
    const res = await getSilhouetteCategoryList();
    categoryList.value = res;
  } catch {
    // handled by interceptor
  }
}

function handleSearch() {
  queryForm.page = 1;
  fetchList();
}

function handleReset() {
  queryForm.name = '';
  queryForm.category = '';
  queryForm.status = '';
  queryForm.page = 1;
  fetchList();
}

function handleSelectionChange(rows: SilhouetteMaterialItem[]) {
  selectedIds.value = rows.map(r => r.id);
}

function handleAdd() {
  isEdit.value = false;
  editId.value = 0;
  formData.status = 2;
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

function handleEdit(row: SilhouetteMaterialItem) {
  isEdit.value = true;
  editId.value = row.id;
  formData.name = row.name;
  formData.cover = row.cover || '';
  formData.width = row.width;
  formData.height = row.height;
  formData.scene = row.scene || '';
  formData.category = row.category || '';
  formData.status = row.status;
  coverPreview.value = getImageUrl(row.cover) || '';
  coverFile.value = null;
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

function handleViewDetail(row: SilhouetteMaterialItem) {
  router.push(`/silhouettes/${row.id}`);
}

function handleCoverChange(file: UploadFile) {
  if (file.raw) {
    coverFile.value = file.raw;
    coverPreview.value = URL.createObjectURL(file.raw);
  }
}

function resetForm() {
  formData.name = '';
  formData.cover = '';
  formData.width = null;
  formData.height = null;
  formData.scene = '';
  formData.category = '';
  formData.status = 2;
  coverFile.value = null;
  coverPreview.value = '';
  formRef.value?.resetFields();
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    const fd = new FormData();
    fd.append('name', formData.name);
    if (formData.width !== null && formData.width !== undefined) fd.append('width', String(formData.width));
    if (formData.height !== null && formData.height !== undefined) fd.append('height', String(formData.height));
    if (formData.scene) fd.append('scene', formData.scene);
    if (formData.category) fd.append('category', formData.category);
    fd.append('status', String(formData.status));
    if (coverFile.value) {
      fd.append('cover', coverFile.value);
    } else if (isEdit.value && formData.cover) {
      fd.append('cover', formData.cover);
    }

    if (isEdit.value) {
      await updateSilhouette(editId.value, fd);
      showSuccess('更新成功');
    } else {
      await createSilhouette(fd);
      showSuccess('创建成功');
    }

    dialogVisible.value = false;
    fetchList();
    fetchCategories();
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row: SilhouetteMaterialItem) {
  const confirmed = await confirmDialog(`确定要删除素材「${row.name}」吗？关联的图片资源也将被删除。`, '删除确认');
  if (!confirmed) return;
  try {
    await deleteSilhouette(row.id);
    showSuccess('删除成功');
    fetchList();
    fetchCategories();
  } catch {
    // handled by interceptor
  }
}

async function handleBatchDelete() {
  const confirmed = await confirmDialog(`确定要删除选中的 ${selectedIds.value.length} 个素材吗？关联的图片资源也将被删除。`, '批量删除确认');
  if (!confirmed) return;
  try {
    await batchDeleteSilhouette(selectedIds.value);
    showSuccess('批量删除成功');
    fetchList();
    fetchCategories();
  } catch {
    // handled by interceptor
  }
}

async function handleToggleStatus(row: SilhouetteMaterialItem) {
  const newStatus = row.status === 1 ? 0 : 1;
  const label = newStatus === 1 ? '上架' : '下架';
  const confirmed = await confirmDialog(`确定要将素材「${row.name}」${label}吗？`, `${label}确认`);
  if (!confirmed) return;
  try {
    await updateSilhouetteStatus(row.id, newStatus);
    showSuccess(`${label}成功`);
    fetchList();
  } catch {
    // handled by interceptor
  }
}

async function handleBatchStatus(status: number) {
  const label = status === 1 ? '上架' : '下架';
  const confirmed = await confirmDialog(`确定要将选中的 ${selectedIds.value.length} 个素材${label}吗？`, `批量${label}确认`);
  if (!confirmed) return;
  try {
    await batchUpdateSilhouetteStatus(selectedIds.value, status);
    showSuccess(`批量${label}成功`);
    fetchList();
  } catch {
    // handled by interceptor
  }
}

async function handleExport() {
  exportDialogVisible.value = true;
  exportLoading.value = true;
  exportProgress.value = 0;
  exportTipText.value = '正在获取数据...';

  try {
    exportProgress.value = 20;
    exportTipText.value = '正在获取数据...';

    const params: SilhouetteMaterialQuery = { ...queryForm };
    delete (params as any).page;
    delete (params as any).pageSize;

    const list = await exportSilhouette(params);

    exportProgress.value = 60;
    exportTipText.value = '正在生成 Excel 文件...';

    await new Promise(resolve => setTimeout(resolve, 300));

    const exportData = list.map(item => ({
      ID: item.id,
      '素材名称': item.name,
      '宽度(px)': item.width || '',
      '高度(px)': item.height || '',
      '适配场景': item.scene || '',
      '分类': item.category || '',
      '使用次数': item.use_count,
      '状态': statusText(item.status),
      '上传时间': item.created_at,
      '更新时间': item.updated_at
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '剪影素材');

    ws['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 }
    ];

    exportProgress.value = 90;
    exportTipText.value = '正在下载...';

    await new Promise(resolve => setTimeout(resolve, 200));

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `剪影素材清单_${timestamp}.xlsx`);

    exportProgress.value = 100;
    exportTipText.value = '导出完成！';

    showSuccess('导出成功');
  } catch {
    exportTipText.value = '导出失败';
    exportProgress.value = 0;
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  fetchList();
  fetchCategories();
});
</script>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.total-text {
  font-size: 13px;
  color: #606266;
}

.total-text b {
  color: var(--color-primary, #409eff);
  font-weight: 600;
  margin: 0 2px;
}

.table-wrapper {
  position: relative;
  min-height: 300px;
}

.use-count {
  font-weight: 600;
  color: var(--color-primary, #409eff);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.cover-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.cover-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.export-content {
  padding: 10px 0;
}

.export-info {
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
  line-height: 2;
}

.export-highlight {
  color: var(--color-primary, #409eff);
  font-weight: 600;
}

.export-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot-success {
  background-color: #67c23a;
}

.status-dot-info {
  background-color: #909399;
}

.status-dot-warning {
  background-color: #e6a23c;
}
</style>

<style>
.select-fade {
  animation: select-fade-in 0.3s ease;
}

@keyframes select-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
