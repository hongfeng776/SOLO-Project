<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="标签名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入标签名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in tagTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
          <span class="card-title">流量标签管理</span>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增标签</el-button>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="标签名称" width="180" />
        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="tagTypeColorMap[row.type] || 'info'" size="small" effect="light">
              {{ tagTypeOptions[row.type] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新增标签'"
      width="480px"
      destroy-on-close
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入标签名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option v-for="(label, value) in tagTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getTagList, createTag, updateTag, deleteTag } from '@api/content'
import { TagType } from '@enums/business'
import type { Tag } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'

const tagTypeOptions: Record<string, string> = {
  [TagType.CONTENT]: '内容标签',
  [TagType.PRODUCT]: '商品标签',
  [TagType.ACTIVITY]: '活动标签'
}

const tagTypeColorMap: Record<string, string> = {
  [TagType.CONTENT]: 'primary',
  [TagType.PRODUCT]: 'success',
  [TagType.ACTIVITY]: 'warning'
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
} = useFetchList<Tag, { name?: string; type?: string; status?: number }>({
  fetchApi: getTagList,
  defaultParams: { name: '', type: '', status: undefined }
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()

const defaultFormData = (): Partial<Tag> => ({
  name: '',
  type: TagType.CONTENT,
  sort: 0,
  status: 1
})

const formData = reactive<Partial<Tag>>(defaultFormData())

const rules: FormRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const openForm = (row?: Tag) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, { ...row })
  } else {
    Object.assign(formData, defaultFormData())
  }
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
}

const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateTag(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createTag(formData)
      ElMessage.success('创建成功')
    }
    handleClose()
    fetchData()
  } finally {
    formLoading.value = false
  }
}

const handleStatusChange = async (row: Tag) => {
  try {
    await updateTag(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error(error)
    row.status = row.status === 1 ? 0 : 1
  }
}

const handleDelete = async (row: Tag) => {
  try {
    await deleteTag(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
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
