<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useConfirm } from '@/components/ConfirmDialog'
import type { ViolationVO } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getViolationList,
  handleViolation,
  removeViolation,
  type ViolationQuery
} from '@/api/violation'

const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<ViolationQuery> = {
  userId: undefined,
  targetType: undefined,
  status: undefined,
  handlerId: undefined
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
} = useTable<ViolationVO, ViolationQuery>(getViolationList, initialQuery)

const modal = useModal<{
  id?: number
  status: number
  handleResult: string
}>({
  status: 1,
  handleResult: ''
})

const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const batchLoading = ref(false)
const handleBatchLoading = ref(false)

const formRules: FormRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  handleResult: [{ required: true, message: '请填写处理结果', trigger: 'blur' }]
}

const targetTypeOptions = [
  { label: '词汇', value: 'vocabulary' },
  { label: '素材', value: 'material' },
  { label: '评论', value: 'comment' }
]

const statusOptions = [
  { label: '待处理', value: 0, type: 'warning' as const },
  { label: '已处理', value: 1, type: 'success' as const },
  { label: '已驳回', value: 2, type: 'info' as const }
]

function handleTargetType(val: string) {
  return targetTypeOptions.find((o) => o.value === val)?.label || val
}

function handleStatusInfo(val: number) {
  return statusOptions.find((o) => o.value === val) || { label: val, type: 'info' as const }
}

function openHandleModal(row: ViolationVO) {
  modal.open({
    id: row.id,
    status: 1,
    handleResult: ''
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      submitLoading.value = true
      await handleViolation({
        id: modal.formData.id!,
        status: modal.formData.status,
        handleResult: modal.formData.handleResult
      })
      ElMessage.success('处理成功')
      modal.close()
      handleRefresh()
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleDelete(row: ViolationVO) {
  const ok = await confirmDelete()
  if (!ok) return
  try {
    batchLoading.value = true
    await removeViolation([row.id])
    ElMessage.success('删除成功')
    handleRefresh()
  } finally {
    batchLoading.value = false
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条违规记录吗？`)
  if (!ok) return
  try {
    batchLoading.value = true
    await removeViolation(selectedIds.value)
    ElMessage.success('批量删除成功')
    handleRefresh()
  } finally {
    batchLoading.value = false
  }
}

const batchHandleForm = reactive({
  status: 1,
  handleResult: ''
})

const batchHandleVisible = ref(false)
const batchHandleFormRef = ref<FormInstance>()

const batchHandleRules: FormRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  handleResult: [{ required: true, message: '请填写处理结果', trigger: 'blur' }]
}

function openBatchHandleModal() {
  batchHandleForm.status = 1
  batchHandleForm.handleResult = ''
  batchHandleVisible.value = true
}

async function handleBatchSubmit() {
  if (!batchHandleFormRef.value) return
  await batchHandleFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      handleBatchLoading.value = true
      const promises = selectedIds.value.map((id) =>
        handleViolation({
          id,
          status: batchHandleForm.status,
          handleResult: batchHandleForm.handleResult
        })
      )
      await Promise.all(promises)
      ElMessage.success('批量处理成功')
      batchHandleVisible.value = false
      handleRefresh()
    } finally {
      handleBatchLoading.value = false
    }
  })
}
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form
        :model="queryForm"
        label-width="90px"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="违规用户ID">
          <el-input
            v-model="queryForm.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select
            v-model="queryForm.targetType"
            placeholder="请选择类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="opt in targetTypeOptions"
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
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人ID">
          <el-input
            v-model="queryForm.handlerId"
            placeholder="请输入处理人ID"
            clearable
            style="width: 160px"
          />
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
      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="primary" plain @click="openBatchHandleModal">
          批量处理
        </el-button>
        <el-button type="danger" plain :loading="batchLoading" @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="11" />
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
          <el-table-column prop="userName" label="违规用户" width="120" />
          <el-table-column label="对象类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ handleTargetType(row.targetType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetId" label="对象ID" width="100" />
          <el-table-column prop="reason" label="违规原因" width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="handleStatusInfo(row.status).type" size="small">
                {{ handleStatusInfo(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handlerName" label="处理人" width="100" />
          <el-table-column prop="handleResult" label="处理结果" min-width="200" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :disabled="(row as ViolationVO).status !== 0"
                @click="openHandleModal(row as ViolationVO)"
              >
                处理
              </el-button>
              <el-button type="danger" link :loading="batchLoading" @click="handleDelete(row as ViolationVO)">
                删除
              </el-button>
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
      title="处理违规"
      :loading="submitLoading"
      width="500px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="90px"
        :disabled="submitLoading"
      >
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="modal.formData.status" placeholder="请选择处理状态" style="width: 100%">
            <el-option label="已处理" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-input
            v-model="modal.formData.handleResult"
            type="textarea"
            :rows="4"
            placeholder="请填写处理结果说明"
          />
        </el-form-item>
      </el-form>
    </ModalDialog>

    <ModalDialog
      v-model="batchHandleVisible"
      title="批量处理违规"
      :loading="handleBatchLoading"
      width="500px"
      @confirm="handleBatchSubmit"
    >
      <el-form
        ref="batchHandleFormRef"
        :model="batchHandleForm"
        :rules="batchHandleRules"
        label-width="90px"
        :disabled="handleBatchLoading"
      >
        <el-form-item label="处理数量">
          <el-tag type="warning" size="large">共 {{ selectedIds.length }} 条</el-tag>
        </el-form-item>
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="batchHandleForm.status" placeholder="请选择处理状态" style="width: 100%">
            <el-option label="已处理" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-input
            v-model="batchHandleForm.handleResult"
            type="textarea"
            :rows="4"
            placeholder="请填写处理结果说明"
          />
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
</style>
