<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">视觉模板管理</h2>
      <div class="header-actions">
        <el-button type="success" :icon="Download" :loading="exportLoading" @click="handleExport">
          导出 Excel
        </el-button>
      </div>
    </div>

    <el-form :inline="true" :model="queryForm" class="filter-bar" @submit.prevent>
      <el-form-item label="名称">
        <el-input
          v-model="queryForm.name"
          placeholder="请输入模板名称"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="风格类型">
        <el-select
          v-model="queryForm.style_type"
          placeholder="全部"
          clearable
          filterable
          style="width: 140px"
          popper-class="select-fade"
        >
          <el-option v-for="st in styleTypeList" :key="st" :label="st" :value="st" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用场景">
        <el-input
          v-model="queryForm.scene"
          placeholder="请输入适用场景"
          clearable
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="queryForm.status"
          placeholder="全部"
          clearable
          style="width: 120px"
          popper-class="select-fade"
        >
          <el-option label="已启用" :value="1">
            <span class="status-option">
              <span class="status-dot status-dot-success"></span>
              已启用
            </span>
          </el-option>
          <el-option label="已停用" :value="0">
            <span class="status-option">
              <span class="status-dot status-dot-info"></span>
              已停用
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 340px"
        />
      </el-form-item>
      <el-form-item label="使用次数">
        <div class="use-count-range">
          <el-input-number
            v-model="queryForm.use_count_min"
            :min="0"
            :max="999999"
            placeholder="最小"
            controls-position="right"
            size="default"
            style="width: 110px"
          />
          <span class="range-separator">至</span>
          <el-input-number
            v-model="queryForm.use_count_max"
            :min="0"
            :max="999999"
            placeholder="最大"
            controls-position="right"
            size="default"
            style="width: 110px"
          />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" :loading="listLoading" @click="handleAdd">
          新增模板
        </el-button>
        <el-button
          type="success"
          :icon="VideoPlay"
          :disabled="!selectedIds.length"
          :loading="batchStatusLoading"
          @click="handleBatchStatus(1)"
        >
          批量启用
        </el-button>
        <el-button
          type="warning"
          :icon="VideoPause"
          :disabled="!selectedIds.length"
          :loading="batchStatusLoading"
          @click="handleBatchStatus(0)"
        >
          批量停用
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!selectedIds.length"
          :loading="batchDeleteLoading"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <span class="total-text">共 <b>{{ total }}</b> 条模板</span>
      </div>
    </div>

    <div class="table-wrapper">
      <template v-if="listLoading && tableData.length === 0">
        <div class="skeleton-wrapper">
          <el-skeleton :rows="8" animated />
        </div>
      </template>

      <template v-else-if="tableData.length > 0">
        <el-table
          :data="tableData"
          border
          stripe
          height="calc(100vh - 430px)"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleEdit"
        >
          <el-table-column type="selection" width="50" align="center" fixed="left" />
          <el-table-column prop="id" label="ID" width="70" align="center" fixed="left" />
          <el-table-column label="封面" width="100" align="center" fixed="left">
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
          <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="style_type" label="风格类型" width="130" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.style_type" size="small" type="primary" effect="plain">
                {{ row.style_type }}
              </el-tag>
              <span v-else style="color: #c0c4cc">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="scene" label="适用场景" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.scene || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="use_count" label="使用次数" width="100" align="center">
            <template #default="{ row }">
              <span class="use-count">{{ row.use_count }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170">
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
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button
                :type="toggleStatusBtnType(row.status)"
                link
                @click="handleToggleStatus(row)"
              >
                {{ toggleStatusBtnText(row.status) }}
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <EmptyState
        v-else
        description="暂无视觉模板"
        icon="Grid"
        :show-action="true"
        action-text="去添加"
        @action="handleAdd"
      />
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        :disabled="listLoading"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模板' : '新增模板'"
      width="560px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" status-icon>
        <el-form-item label="模板名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入模板名称"
            maxlength="100"
            show-word-limit
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
          <div v-if="isEdit && formData.cover && !coverFile" class="cover-tip">
            点击图片可更换封面
          </div>
        </el-form-item>
        <el-form-item label="风格类型" prop="style_type">
          <el-select
            v-model="formData.style_type"
            placeholder="请选择或输入风格类型"
            clearable
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option v-for="st in styleTypeList" :key="st" :label="st" :value="st" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用场景" prop="scene">
          <el-input
            v-model="formData.scene"
            type="textarea"
            :rows="3"
            placeholder="请输入适用场景"
            maxlength="200"
            show-word-limit
            resize="none"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportDialogVisible" title="导出模板" width="420px" :close-on-click-modal="false">
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
        <el-button @click="exportDialogVisible = false" :disabled="exportLoading">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <transition name="fade">
      <div v-show="showBackTop" class="back-top" @click="scrollToTop">
        <el-icon :size="20">
          <Top />
        </el-icon>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  Search,
  Refresh,
  Plus,
  Delete,
  VideoPlay,
  VideoPause,
  Download,
  Top
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import FormattedDate from '@/components/FormattedDate.vue';
import EmptyState from '@/components/EmptyState.vue';
import {
  getVisualTemplateList,
  getVisualTemplateStyleTypeList,
  createVisualTemplate,
  updateVisualTemplate,
  deleteVisualTemplate,
  batchDeleteVisualTemplate,
  updateVisualTemplateStatus,
  batchUpdateVisualTemplateStatus,
  checkTemplateNameUnique,
  exportVisualTemplate
} from '@/api/visualTemplate';
import type { VisualTemplateItem, VisualTemplateQuery } from '@/types';
import { confirmDialog, showSuccess, getImageUrl } from '@/utils';
import * as XLSX from 'xlsx';

const listLoading = ref(false);
const tableData = ref<VisualTemplateItem[]>([]);
const total = ref(0);
const styleTypeList = ref<string[]>([]);
const selectedIds = ref<number[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number>(0);
const submitLoading = ref(false);
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const formRef = ref<FormInstance>();

const exportDialogVisible = ref(false);
const exportLoading = ref(false);
const exportProgress = ref(0);
const exportTipText = ref('准备导出...');

const batchDeleteLoading = ref(false);
const batchStatusLoading = ref(false);

const dateRange = ref<string[]>([]);
const showBackTop = ref(false);

const queryForm = reactive<VisualTemplateQuery>({
  page: 1,
  pageSize: 20,
  name: '',
  style_type: '',
  scene: '',
  status: '',
  start_time: '',
  end_time: '',
  use_count_min: '',
  use_count_max: ''
});

const formData = reactive({
  name: '',
  cover: '',
  style_type: '',
  scene: '',
  status: 1
});

const validateNameUnique = async (_rule: any, value: any, callback: any) => {
  if (!value || !value.trim()) {
    callback();
    return;
  }
  try {
    const res = await checkTemplateNameUnique(value.trim(), isEdit.value ? editId.value : undefined);
    if (res.unique) {
      callback();
    } else {
      callback(new Error('模板名称已存在'));
    }
  } catch {
    callback();
  }
};

const validateScene = (_rule: any, value: any, callback: any) => {
  if (value && value.length > 200) {
    callback(new Error('适用场景不能超过200个字符'));
  } else {
    callback();
  }
};

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 1, max: 100, message: '模板名称长度在 1 到 100 个字符', trigger: 'blur' },
    { validator: validateNameUnique, trigger: 'blur' }
  ],
  style_type: [
    { max: 50, message: '风格类型不能超过50个字符', trigger: 'change' }
  ],
  scene: [
    { validator: validateScene, trigger: 'blur' }
  ]
});

function statusText(status: number) {
  const map: Record<number, string> = { 0: '已停用', 1: '已启用' };
  return map[status] || '未知';
}

function statusTagType(status: number) {
  const map: Record<number, 'success' | 'info' | 'warning' | 'danger' | 'primary'> = {
    0: 'info',
    1: 'success'
  };
  return map[status] || 'info';
}

const statusNextMap: Record<number, number> = { 1: 0, 0: 1 };
const statusNextLabelMap: Record<number, string> = { 1: '停用', 0: '启用' };
const statusNextBtnTypeMap: Record<number, 'success' | 'warning' | 'primary'> = {
  1: 'warning',
  0: 'success'
};

function toggleStatusBtnText(status: number) {
  return statusNextLabelMap[status] ?? '启用';
}

function toggleStatusBtnType(status: number) {
  return statusNextBtnTypeMap[status] ?? 'success';
}

function buildQueryParams(): VisualTemplateQuery {
  const params: VisualTemplateQuery = { ...queryForm };
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_time = dateRange.value[0];
    params.end_time = dateRange.value[1];
  }
  return params;
}

async function fetchList() {
  listLoading.value = true;
  try {
    const params = buildQueryParams();
    const res = await getVisualTemplateList(params);
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    // handled by interceptor
  } finally {
    listLoading.value = false;
  }
}

async function fetchStyleTypes() {
  try {
    const res = await getVisualTemplateStyleTypeList();
    styleTypeList.value = res;
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
  queryForm.style_type = '';
  queryForm.scene = '';
  queryForm.status = '';
  queryForm.start_time = '';
  queryForm.end_time = '';
  queryForm.use_count_min = '';
  queryForm.use_count_max = '';
  queryForm.page = 1;
  dateRange.value = [];
  fetchList();
}

function handleSelectionChange(rows: VisualTemplateItem[]) {
  selectedIds.value = rows.map(r => r.id);
}

function handleAdd() {
  isEdit.value = false;
  editId.value = 0;
  formData.status = 1;
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

function handleEdit(row: VisualTemplateItem) {
  isEdit.value = true;
  editId.value = row.id;
  formData.name = row.name;
  formData.cover = row.cover || '';
  formData.style_type = row.style_type || '';
  formData.scene = row.scene || '';
  formData.status = row.status;
  coverPreview.value = getImageUrl(row.cover) || '';
  coverFile.value = null;
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
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
  formData.style_type = '';
  formData.scene = '';
  formData.status = 1;
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
    fd.append('name', formData.name.trim());
    if (formData.style_type) fd.append('style_type', formData.style_type.trim());
    if (formData.scene) fd.append('scene', formData.scene.trim());
    fd.append('status', String(formData.status));
    if (coverFile.value) {
      fd.append('cover', coverFile.value);
    } else if (isEdit.value && formData.cover) {
      fd.append('cover', formData.cover);
    }

    if (isEdit.value) {
      await updateVisualTemplate(editId.value, fd);
      showSuccess('更新成功');
    } else {
      await createVisualTemplate(fd);
      showSuccess('创建成功');
    }

    dialogVisible.value = false;
    fetchList();
    fetchStyleTypes();
  } catch {
    // handled by interceptor
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row: VisualTemplateItem) {
  const confirmed = await confirmDialog(
    `确定要删除模板「${row.name}」吗？${row.use_count > 0 ? `该模板已被使用 ${row.use_count} 次，` : ''}删除后无法恢复。`,
    '删除确认'
  );
  if (!confirmed) return;
  try {
    await deleteVisualTemplate(row.id);
    showSuccess('删除成功');
    fetchList();
    fetchStyleTypes();
  } catch {
    // handled by interceptor
  }
}

async function handleBatchDelete() {
  const confirmed = await confirmDialog(
    `确定要删除选中的 ${selectedIds.value.length} 个模板吗？删除后无法恢复。`,
    '批量删除确认'
  );
  if (!confirmed) return;
  batchDeleteLoading.value = true;
  try {
    await batchDeleteVisualTemplate(selectedIds.value);
    showSuccess('批量删除成功');
    fetchList();
    fetchStyleTypes();
  } catch {
    // handled by interceptor
  } finally {
    batchDeleteLoading.value = false;
  }
}

async function handleToggleStatus(row: VisualTemplateItem) {
  const newStatus = statusNextMap[row.status] ?? 1;
  const label = statusNextLabelMap[row.status] ?? '启用';
  const confirmed = await confirmDialog(
    `确定要将模板「${row.name}」设为「${label}」吗？`,
    '状态变更确认'
  );
  if (!confirmed) return;
  try {
    await updateVisualTemplateStatus(row.id, newStatus);
    showSuccess(`已设为「${label}」`);
    fetchList();
  } catch {
    // handled by interceptor
  }
}

async function handleBatchStatus(status: number) {
  const label = status === 1 ? '启用' : '停用';
  const confirmed = await confirmDialog(
    `确定要将选中的 ${selectedIds.value.length} 个模板${label}吗？`,
    `批量${label}确认`
  );
  if (!confirmed) return;
  batchStatusLoading.value = true;
  try {
    await batchUpdateVisualTemplateStatus(selectedIds.value, status);
    showSuccess(`批量${label}成功`);
    fetchList();
  } catch {
    // handled by interceptor
  } finally {
    batchStatusLoading.value = false;
  }
}

async function handleExport() {
  if (total.value === 0) {
    showSuccess('暂无数据可导出');
    return;
  }

  exportDialogVisible.value = true;
  exportLoading.value = true;
  exportProgress.value = 0;
  exportTipText.value = '正在获取数据...';

  try {
    exportProgress.value = 20;
    exportTipText.value = '正在获取数据...';

    const params = buildQueryParams();
    delete (params as any).page;
    delete (params as any).pageSize;

    const list = await exportVisualTemplate(params);

    exportProgress.value = 60;
    exportTipText.value = '正在生成 Excel 文件...';

    await new Promise(resolve => setTimeout(resolve, 300));

    const exportData = list.map(item => ({
      ID: item.id,
      '模板名称': item.name,
      '风格类型': item.style_type || '',
      '适用场景': item.scene || '',
      '使用次数': item.use_count,
      '状态': statusText(item.status),
      '创建时间': item.created_at,
      '更新时间': item.updated_at
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '视觉模板');

    ws['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 14 },
      { wch: 28 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 }
    ];

    exportProgress.value = 90;
    exportTipText.value = '正在下载...';

    await new Promise(resolve => setTimeout(resolve, 200));

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `视觉模板清单_${timestamp}.xlsx`);

    exportProgress.value = 100;
    exportTipText.value = '导出完成！';

    showSuccess('导出成功');

    setTimeout(() => {
      exportDialogVisible.value = false;
    }, 1500);
  } catch {
    exportTipText.value = '导出失败';
    exportProgress.value = 0;
  } finally {
    exportLoading.value = false;
  }
}

function handleScroll() {
  const container = document.querySelector('.main-content');
  if (!container) return;
  const scrollTop = container.scrollTop;
  showBackTop.value = scrollTop > 500;
}

function scrollToTop() {
  const container = document.querySelector('.main-content');
  if (!container) return;
  container.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(async () => {
  await fetchList();
  await fetchStyleTypes();

  const container = document.querySelector('.main-content');
  if (container) {
    container.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  const container = document.querySelector('.main-content');
  if (container) {
    container.removeEventListener('scroll', handleScroll);
  }
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
  flex-wrap: wrap;
}

.toolbar-right {
  flex-shrink: 0;
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

.use-count-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-separator {
  color: #909399;
  font-size: 13px;
}

.skeleton-wrapper {
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
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

.back-top {
  position: fixed;
  right: 40px;
  bottom: 60px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-primary, #409eff);
  transition: all 0.3s ease;
  z-index: 1000;
}

.back-top:hover {
  background: var(--color-primary, #409eff);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(64, 158, 255, 0.3);
}

.header-actions {
  display: flex;
  gap: 8px;
}
</style>
