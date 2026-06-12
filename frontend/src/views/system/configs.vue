<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { configApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { SystemConfig, TableColumn, ApiResponse } from '@/types';

const formRef = ref<FormInstance>();
const loading = ref(false);
const list = ref<SystemConfig[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);

const form = reactive({
  configKey: '',
  configValue: '',
  description: '',
});

const rules: FormRules = {
  configKey: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    { max: 100, message: '最长 100 字符', trigger: 'blur' },
  ],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  description: [{ max: 255, message: '最长 255 字符', trigger: 'blur' }],
};

const columns: TableColumn<SystemConfig>[] = [
  { prop: 'configKey', label: '配置键', width: 200, ellipsis: true },
  { prop: 'configValue', label: '配置值', minWidth: 240, ellipsis: true, slot: 'value' },
  { prop: 'description', label: '描述', minWidth: 200, ellipsis: true },
  {
    prop: 'updatedAt',
    label: '更新时间',
    width: 170,
    align: 'center',
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
    const res = await configApi.list({ page: page.value, pageSize: pageSize.value, keyword: keyword.value });
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

const openCreate = () => {
  modalMode.value = 'create';
  editingId.value = null;
  Object.assign(form, { configKey: '', configValue: '', description: '' });
  modalVisible.value = true;
};

const openEdit = (row: SystemConfig) => {
  modalMode.value = 'edit';
  editingId.value = row.id;
  Object.assign(form, { configKey: row.configKey, configValue: row.configValue, description: row.description || '' });
  modalVisible.value = true;
};

const handleModalOk = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  modalLoading.value = true;
  try {
    let res: ApiResponse<SystemConfig>;
    if (modalMode.value === 'create') {
      res = await configApi.create({ ...form });
    } else if (editingId.value) {
      res = await configApi.update(editingId.value, { ...form });
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

const handleDelete = async (row: SystemConfig) => {
  try {
    await ElMessageBox.confirm(`确定删除配置 "${row.configKey}" 吗？`, '删除确认', { type: 'warning' });
    const res = await configApi.remove(row.id);
    if (res.code === 0) {
      ElMessage.success('删除成功');
      fetchData();
    }
  } catch {
    /* cancel */
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
          placeholder="搜索配置键/描述"
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
          <el-icon><Plus /></el-icon>新增配置
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <BaseTable
        :columns="columns"
        :data="list"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @pageChange="handlePageChange"
      >
        <template #value="{ value }">
          <el-tooltip :content="value" placement="top" :disabled="!value || String(value).length < 40">
            <code class="val-code">{{ value }}</code>
          </el-tooltip>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </BaseTable>
    </el-card>

    <BaseModal
      v-model:visible="modalVisible"
      :title="modalMode === 'create' ? '新增系统配置' : '编辑系统配置'"
      width="520px"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="配置键" prop="configKey">
          <el-input v-model="form.configKey" :disabled="modalMode === 'edit'" placeholder="如: site.title" />
        </el-form-item>
        <el-form-item label="配置值" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" :rows="4" placeholder="配置值内容" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="配置说明（选填）" />
        </el-form-item>
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
.filter-card { padding: $spacing-md $spacing-lg !important; border-radius: $radius-lg; }
.filter-row {
  display: flex; align-items: center; gap: $spacing-sm; flex-wrap: wrap;
}
.spacer { flex: 1; }
.table-card { padding: $spacing-md !important; border-radius: $radius-lg; }
.val-code {
  display: inline-block;
  max-width: 100%;
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  color: #86909c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
