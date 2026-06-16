<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="名称/编码"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="位置">
          <el-select
            v-model="queryParams.position"
            placeholder="全部位置"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in positionOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in typeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="启用" :value="ResourceSlotStatus.ENABLED" />
            <el-option label="禁用" :value="ResourceSlotStatus.DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">资源位管理</span>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增资源位</el-button>
        </div>
      </template>

      <BatchActions
        :selected-ids="selectedIds"
        :total="total"
        :allow-delete="true"
        :allow-export="false"
        :always-show="true"
        :delete-api="handleBatchDelete"
        delete-tip="确认删除选中的资源位吗？此操作不可恢复。"
        @delete="fetchData"
      >
        <template #default="{ selectedIds }">
          <el-button
            type="success"
            plain
            size="small"
            :disabled="!hasSelection"
            :icon="Check"
            @click="handleBatchEnable(selectedIds)"
          >
            批量启用
          </el-button>
          <el-button
            type="warning"
            plain
            size="small"
            :disabled="!hasSelection"
            :icon="Close"
            @click="handleBatchDisable(selectedIds)"
          >
            批量禁用
          </el-button>
        </template>
      </BatchActions>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        selectable
        row-key="id"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as ResourceSlot[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column label="位置" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light">
              {{ positionOptions[row.position] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="typeColor[row.type] || 'info'" size="small" effect="light">
              {{ typeOptions[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="尺寸" width="120" align="center">
          <template #default="{ row }">
            {{ row.width || '-' }} × {{ row.height || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="ResourceSlotStatus.ENABLED"
              :inactive-value="ResourceSlotStatus.DISABLED"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openForm(row)">编辑</el-button>
            <el-button
              v-if="row.status === ResourceSlotStatus.DISABLED"
              link
              type="success"
              size="small"
              @click="handleEnable(row)"
            >
              启用
            </el-button>
            <el-button
              v-if="row.status === ResourceSlotStatus.ENABLED"
              link
              type="warning"
              size="small"
              @click="handleDisable(row)"
            >
              禁用
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑资源位' : '新增资源位'"
      width="560px"
      destroy-on-close
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资源位名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入资源位名称" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源位编码" prop="code">
              <el-input v-model="formData.code" :disabled="isEdit" placeholder="请输入资源位编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="位置" prop="position">
              <el-select v-model="formData.position" placeholder="请选择位置" style="width: 100%">
                <el-option v-for="(label, value) in positionOptions" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
                <el-option v-for="(label, value) in typeOptions" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宽度(px)" prop="width">
              <el-input-number v-model="formData.width" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="高度(px)" prop="height">
              <el-input-number v-model="formData.height" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="formData.sortOrder" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="ResourceSlotStatus.ENABLED">启用</el-radio>
                <el-radio :value="ResourceSlotStatus.DISABLED">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入资源位描述"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Check, Close } from '@element-plus/icons-vue'
import { useFetchList, useCrud, useSelection } from '@hooks/index'
import {
  getResourceSlotList,
  createResourceSlot,
  updateResourceSlot,
  deleteResourceSlot,
  updateResourceSlotStatus
} from '@/api/resource-slot'
import { ResourceSlotType, ResourceSlotPosition, ResourceSlotStatus } from '@enums/business'
import type { ResourceSlot } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const positionOptions: Record<string, string> = {
  [ResourceSlotPosition.HOME]: '首页',
  [ResourceSlotPosition.DISCOVER]: '发现页',
  [ResourceSlotPosition.SEARCH]: '搜索页',
  [ResourceSlotPosition.TOPIC]: '话题页'
}

const typeOptions: Record<string, string> = {
  [ResourceSlotType.BANNER]: 'Banner',
  [ResourceSlotType.TOPIC]: '话题',
  [ResourceSlotType.RECOMMEND]: '推荐',
  [ResourceSlotType.FLOAT]: '浮窗'
}

const typeColor: Record<string, string> = {
  [ResourceSlotType.BANNER]: 'primary',
  [ResourceSlotType.TOPIC]: 'success',
  [ResourceSlotType.RECOMMEND]: 'warning',
  [ResourceSlotType.FLOAT]: 'info'
}

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<ResourceSlot, {
  keyword?: string
  position?: string
  type?: string
  status?: number
}>({
  fetchApi: getResourceSlotList,
  defaultParams: { keyword: '', position: '', type: '', status: undefined }
})

const { selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<ResourceSlot>()

const {
  dialogVisible,
  formData,
  formLoading,
  isEdit,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSubmit,
  handleClose
} = useCrud<ResourceSlot>({
  createApi: createResourceSlot,
  updateApi: updateResourceSlot,
  deleteApi: deleteResourceSlot,
  successMessages: {
    create: '创建成功',
    update: '更新成功',
    delete: '删除成功'
  },
  onSaved: () => {
    clearSelection()
    fetchData()
  },
  onDeleted: () => {
    clearSelection()
    fetchData()
  }
})

const formRef = ref<FormInstance>()

const defaultFormData = (): Partial<ResourceSlot> => ({
  name: '',
  code: '',
  position: '',
  type: '',
  width: 0,
  height: 0,
  sortOrder: 0,
  status: ResourceSlotStatus.ENABLED,
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入资源位名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入资源位编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '编码只能包含字母、数字、下划线和中划线', trigger: 'blur' }
  ],
  position: [{ required: true, message: '请选择位置', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const openForm = (row?: ResourceSlot) => {
  if (row) {
    handleEdit(row)
  } else {
    handleAdd(defaultFormData())
  }
}

const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const success = await handleSubmit(async () => {
    if (isEdit.value && formData.value.id) {
      await updateResourceSlot(formData.value.id, formData.value)
    } else {
      await createResourceSlot(formData.value)
    }
    return true
  })

  if (success) {
    formRef.value.resetFields()
  }
}

const handleStatusChange = async (row: ResourceSlot) => {
  try {
    await updateResourceSlotStatus(row.id, row.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error(error)
    row.status = row.status === ResourceSlotStatus.ENABLED ? ResourceSlotStatus.DISABLED : ResourceSlotStatus.ENABLED
  }
}

const handleEnable = async (row: ResourceSlot) => {
  try {
    await updateResourceSlotStatus(row.id, ResourceSlotStatus.ENABLED)
    row.status = ResourceSlotStatus.ENABLED
    ElMessage.success('启用成功')
  } catch (error) {
    console.error(error)
  }
}

const handleDisable = async (row: ResourceSlot) => {
  try {
    await updateResourceSlotStatus(row.id, ResourceSlotStatus.DISABLED)
    row.status = ResourceSlotStatus.DISABLED
    ElMessage.success('禁用成功')
  } catch (error) {
    console.error(error)
  }
}

const handleBatchEnable = async (ids: number[]) => {
  if (!ids.length) return
  try {
    await Promise.all(ids.map((id) => updateResourceSlotStatus(id, ResourceSlotStatus.ENABLED)))
    ElMessage.success(`成功启用 ${ids.length} 条记录`)
    clearSelection()
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleBatchDisable = async (ids: number[]) => {
  if (!ids.length) return
  try {
    await Promise.all(ids.map((id) => updateResourceSlotStatus(id, ResourceSlotStatus.DISABLED)))
    ElMessage.success(`成功禁用 ${ids.length} 条记录`)
    clearSelection()
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleBatchDelete = async (ids: number[]) => {
  if (!ids.length) return
  await Promise.all(ids.map((id) => deleteResourceSlot(id)))
  return null
}
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }
}
</style>
