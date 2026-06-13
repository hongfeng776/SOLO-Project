<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useConfirm } from '@/components/ConfirmDialog'
import type { MaterialVO } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getMaterialList,
  createMaterial,
  updateMaterial,
  removeMaterial,
  updateMaterialStatus,
  batchUpdateMaterialStatus,
  type MaterialQuery
} from '@/api/material'

const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<MaterialQuery> = {
  title: '',
  vocabularyId: undefined,
  materialType: undefined,
  difficulty: undefined,
  status: undefined
}

const {
  list,
  loading,
  pageNum,
  pageSize,
  total,
  queryForm,
  selectedIds,
  handleSearch,
  handleReset,
  handleRefresh,
  handlePageChange,
  handleSelectionChange
} = useTable<MaterialVO, MaterialQuery>(getMaterialList, initialQuery)

const modal = useModal<{
  id?: number
  vocabularyId: number | undefined
  title: string
  content: string
  materialType: string
  source: string
  difficulty: number
  status: number
}>({
  vocabularyId: undefined,
  title: '',
  content: '',
  materialType: '',
  source: '',
  difficulty: 1,
  status: 1
})

const isEdit = ref(false)
const formRef = ref<FormInstance>()

const formRules: FormRules = {
  vocabularyId: [{ required: true, message: '请输入关联词汇ID', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  materialType: [{ required: true, message: '请选择素材类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const submitLoading = ref(false)

const materialTypeOptions = [
  { label: '文章', value: 'article' },
  { label: '对话', value: 'dialogue' },
  { label: '故事', value: 'story' },
  { label: '新闻', value: 'news' },
  { label: '诗歌', value: 'poem' },
  { label: '其他', value: 'other' }
]

const difficultyOptions = [
  { label: '入门', value: 1 },
  { label: '初级', value: 2 },
  { label: '中级', value: 3 },
  { label: '高级', value: 4 },
  { label: '专家', value: 5 }
]

function handleAdd() {
  isEdit.value = false
  modal.open()
}

async function handleEdit(row: MaterialVO) {
  isEdit.value = true
  modal.open({
    id: row.id,
    vocabularyId: row.vocabularyId,
    title: row.title,
    content: row.content,
    materialType: row.materialType,
    source: row.source,
    difficulty: row.difficulty,
    status: row.status
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      submitLoading.value = true
      if (isEdit.value) {
        await updateMaterial(modal.formData)
        ElMessage.success('修改成功')
      } else {
        await createMaterial(modal.formData)
        ElMessage.success('新增成功')
      }
      modal.close()
      handleRefresh()
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleDelete(row: MaterialVO) {
  const ok = await confirmDelete()
  if (!ok) return
  await removeMaterial([row.id])
  ElMessage.success('删除成功')
  handleRefresh()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条素材吗？`)
  if (!ok) return
  await removeMaterial(selectedIds.value)
  ElMessage.success('批量删除成功')
  handleRefresh()
}

async function handleStatusChange(row: MaterialVO, status: number) {
  const action = status === 1 ? '上架' : '下架'
  const ok = await confirm(`确定要${action}素材「${row.title}」吗？`, '状态确认')
  if (!ok) return
  await updateMaterialStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  handleRefresh()
}

async function handleBatchStatus(status: number) {
  if (selectedIds.value.length === 0) return
  const action = status === 1 ? '上架' : '下架'
  const ok = await confirm(`确定要${action}选中的 ${selectedIds.value.length} 条素材吗？`, '批量操作确认')
  if (!ok) return
  await batchUpdateMaterialStatus(selectedIds.value, status)
  ElMessage.success(`批量${action}成功`)
  handleRefresh()
}

function formatDifficulty(val: number) {
  return difficultyOptions.find((o) => o.value === val)?.label || val
}

function formatMaterialType(val: string) {
  return materialTypeOptions.find((o) => o.value === val)?.label || val
}
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form
        :model="queryForm"
        label-width="80px"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="标题">
          <el-input
            v-model="queryForm.title"
            placeholder="请输入标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="关联词汇ID">
          <el-input
            v-model="queryForm.vocabularyId"
            placeholder="请输入词汇ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryForm.materialType"
            placeholder="请选择类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="opt in materialTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select
            v-model="queryForm.difficulty"
            placeholder="请选择难度"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="opt in difficultyOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="已上架" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增素材
        </el-button>
      </div>

      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="success" plain @click="handleBatchStatus(1)">
          批量上架
        </el-button>
        <el-button type="warning" plain @click="handleBatchStatus(0)">
          批量下架
        </el-button>
        <el-button type="danger" plain @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="12" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <el-table
          v-else
          :data="list"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" :reserve-selection="false" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="vocabularyWord" label="关联词汇" width="140" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ formatMaterialType(row.materialType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="难度" width="100">
            <template #default="{ row }">
              <el-tag :type="row.difficulty <= 2 ? 'success' : row.difficulty <= 3 ? 'warning' : 'danger'" size="small">
                {{ formatDifficulty(row.difficulty) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="来源" width="140" show-overflow-tooltip />
          <el-table-column prop="creatorName" label="创建人" width="120" />
          <el-table-column prop="commentCount" label="评论数" width="80" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '已上架' : '已下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row as MaterialVO)">编辑</el-button>
              <el-button
                :type="(row as MaterialVO).status === 1 ? 'warning' : 'success'"
                link
                @click="handleStatusChange(row as MaterialVO, (row as MaterialVO).status === 1 ? 0 : 1)"
              >
                {{ (row as MaterialVO).status === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button type="danger" link @click="handleDelete(row as MaterialVO)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <Pagination
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>
    </el-card>

    <ModalDialog
      v-model="modal.visible"
      :title="isEdit ? '编辑素材' : '新增素材'"
      :loading="submitLoading"
      width="600px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="100px"
        :disabled="submitLoading"
      >
        <el-form-item label="关联词汇ID" prop="vocabularyId">
          <el-input v-model="modal.formData.vocabularyId" placeholder="请输入关联词汇ID" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="modal.formData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="素材类型" prop="materialType">
          <el-select v-model="modal.formData.materialType" placeholder="请选择素材类型" style="width: 100%">
            <el-option
              v-for="opt in materialTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-radio-group v-model="modal.formData.difficulty">
            <el-radio v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="modal.formData.source" placeholder="请输入来源" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="modal.formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入素材内容"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="modal.formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </ModalDialog>
  </div>
</template>

<style lang="scss" scoped>
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
</style>
