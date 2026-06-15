<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">视觉模板管理</h2>
    </div>

    <el-form :inline="true" :model="queryForm" class="filter-bar" @submit.prevent>
      <el-form-item label="名称">
        <el-input v-model="queryForm.name" placeholder="请输入模板名称" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="风格类型">
        <el-select v-model="queryForm.style_type" placeholder="全部" clearable style="width: 160px" popper-class="select-fade">
          <el-option v-for="st in styleTypeList" :key="st" :label="st" :value="st" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用场景">
        <el-input v-model="queryForm.scene" placeholder="请输入适用场景" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px" popper-class="select-fade">
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
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增模板</el-button>
        <el-button type="success" :icon="VideoPlay" :disabled="!selectedIds.length" @click="handleBatchStatus(1)">批量启用</el-button>
        <el-button type="warning" :icon="VideoPause" :disabled="!selectedIds.length" @click="handleBatchStatus(0)">批量停用</el-button>
        <el-button type="danger" :icon="Delete" :disabled="!selectedIds.length" @click="handleBatchDelete">批量删除</el-button>
      </div>
      <div class="toolbar-right">
        <span class="total-text">共 <b>{{ total }}</b> 条模板</span>
      </div>
    </div>

    <div v-loading="loading" class="table-wrapper">
      <el-table
        v-if="tableData.length > 0"
        :data="tableData"
        border
        stripe
        height="calc(100vh - 380px)"
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
            <el-tag v-if="row.style_type" size="small" type="primary" effect="plain">{{ row.style_type }}</el-tag>
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

      <EmptyState v-else description="暂无视觉模板" icon="Picture" :show-action="true" action-text="去添加" @action="handleAdd" />
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
          <div v-if="isEdit && formData.cover && !coverFile" class="cover-tip">点击图片可更换封面</div>
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
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { Search, Refresh, Plus, Delete, VideoPlay, VideoPause } from '@element-plus/icons-vue';
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
  checkTemplateNameUnique
} from '@/api/visualTemplate';
import type { VisualTemplateItem, VisualTemplateQuery } from '@/types';
import { confirmDialog, showSuccess, getImageUrl } from '@/utils';

const loading = ref(false);
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

const queryForm = reactive<VisualTemplateQuery>({
  page: 1,
  pageSize: 20,
  name: '',
  style_type: '',
  scene: '',
  status: ''
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

async function fetchList() {
  loading.value = true;
  try {
    const res = await getVisualTemplateList(queryForm);
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
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
  queryForm.page = 1;
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
  const confirmed = await confirmDialog(`确定要删除选中的 ${selectedIds.value.length} 个模板吗？删除后无法恢复。`, '批量删除确认');
  if (!confirmed) return;
  try {
    await batchDeleteVisualTemplate(selectedIds.value);
    showSuccess('批量删除成功');
    fetchList();
    fetchStyleTypes();
  } catch {
    // handled by interceptor
  }
}

async function handleToggleStatus(row: VisualTemplateItem) {
  const newStatus = statusNextMap[row.status] ?? 1;
  const label = statusNextLabelMap[row.status] ?? '启用';
  const confirmed = await confirmDialog(`确定要将模板「${row.name}」设为「${label}」吗？`, `状态变更确认`);
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
  const confirmed = await confirmDialog(`确定要将选中的 ${selectedIds.value.length} 个模板${label}吗？`, `批量${label}确认`);
  if (!confirmed) return;
  try {
    await batchUpdateVisualTemplateStatus(selectedIds.value, status);
    showSuccess(`批量${label}成功`);
    fetchList();
  } catch {
    // handled by interceptor
  }
}

onMounted(async () => {
  await fetchList();
  await fetchStyleTypes();
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
</style>
