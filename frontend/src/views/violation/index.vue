<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-title">违规管理</div>
    </div>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="对象名称">
        <el-input v-model="queryParams.targetName" placeholder="请输入对象名称" clearable />
      </el-form-item>
      <el-form-item label="对象类型">
        <el-select v-model="queryParams.targetType" placeholder="请选择对象类型" clearable>
          <el-option label="企业" :value="1" />
          <el-option label="求职者" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="违规类型">
        <el-select v-model="queryParams.type" placeholder="请选择违规类型" clearable>
          <el-option v-for="item in violationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态">
        <el-select v-model="queryParams.handleStatus" placeholder="请选择处理状态" clearable>
          <el-option v-for="item in handleStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" v-debounce="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="table-toolbar-left">
        <el-button type="primary" v-debounce="handleAdd">新增违规记录</el-button>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="6">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无违规数据" />
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          show-index
          @pagination-change="handlePaginationChange"
        >
          <el-table-column prop="targetName" label="对象名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="targetType" label="对象类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.targetType === 1 ? 'primary' : 'success'" size="small">
                {{ row.targetType === 1 ? '企业' : '求职者' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="违规类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getViolationTypeTagType(row.type)" size="small">
                {{ getViolationTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="违规描述" min-width="160" show-overflow-tooltip />
          <el-table-column prop="handleStatus" label="处理状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getHandleStatusType(row.handleStatus)" size="small">
                {{ getHandleStatusLabel(row.handleStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handleResult" label="处理结果" min-width="140" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="170" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" v-debounce="() => handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" v-debounce="() => handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </ProTable>
      </template>
    </ProSkeleton>

    <ProDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :confirm-loading="submitLoading"
      @confirm="handleSubmit"
      @cancel="handleDialogCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="对象类型" prop="targetType">
          <el-select v-model="formData.targetType" placeholder="请选择对象类型">
            <el-option label="企业" :value="1" />
            <el-option label="求职者" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象ID" prop="targetId">
          <el-input v-model="formData.targetId" placeholder="请输入对象ID" />
        </el-form-item>
        <el-form-item label="对象名称" prop="targetName">
          <el-input v-model="formData.targetName" placeholder="请输入对象名称" />
        </el-form-item>
        <el-form-item label="违规类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择违规类型">
            <el-option v-for="item in violationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="请输入违规描述" />
        </el-form-item>
        <el-form-item label="处理状态" prop="handleStatus">
          <el-select v-model="formData.handleStatus" placeholder="请选择处理状态">
            <el-option v-for="item in handleStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-input v-model="formData.handleResult" type="textarea" :rows="3" placeholder="请输入处理结果" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ProTable, ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getViolationList,
  getViolationDetail,
  createViolation,
  updateViolation,
  removeViolation,
  type ViolationForm,
  type ViolationRecord
} from '@/api/violation'
import type { FormInstance, FormRules } from 'element-plus'

const { confirmDelete, success } = useConfirm()

const violationTypeOptions = [
  { label: '虚假信息', value: 1 },
  { label: '违规操作', value: 2 },
  { label: '投诉举报', value: 3 }
]

const handleStatusOptions = [
  { label: '待处理', value: 1 },
  { label: '处理中', value: 2 },
  { label: '已处理', value: 3 }
]

function getViolationTypeLabel(type: number) {
  const map: Record<number, string> = { 1: '虚假信息', 2: '违规操作', 3: '投诉举报' }
  return map[type] || '未知'
}

function getViolationTypeTagType(type: number) {
  const map: Record<number, string> = { 1: 'danger', 2: 'warning', 3: 'info' }
  return map[type] || 'info'
}

function getHandleStatusType(status: number) {
  const map: Record<number, string> = { 1: 'danger', 2: 'warning', 3: 'success' }
  return map[status] || 'info'
}

function getHandleStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '待处理', 2: '处理中', 3: '已处理' }
  return map[status] || '未知'
}

const loading = ref(false)
const tableData = ref<ViolationRecord[]>([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  targetName: '',
  targetType: '' as number | string,
  type: '' as number | string,
  handleStatus: '' as number | string
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getViolationList(queryParams)
    tableData.value = res.records
    total.value = res.total
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  fetchList()
}

function handleReset() {
  queryParams.targetName = ''
  queryParams.targetType = ''
  queryParams.type = ''
  queryParams.handleStatus = ''
  handleQuery()
}

function handlePaginationChange({ page, pageSize }: { page: number; pageSize: number }) {
  queryParams.pageNum = page
  queryParams.pageSize = pageSize
  fetchList()
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const dialogTitle = computed(() => (isEdit.value ? '编辑违规记录' : '新增违规记录'))

const initFormData = (): ViolationForm => ({
  targetType: '',
  targetId: '',
  targetName: '',
  type: '',
  description: '',
  handleStatus: 1,
  handleResult: ''
})

const formData = reactive<ViolationForm>(initFormData())

const formRules = reactive<FormRules>({
  targetType: [{ required: true, message: '请选择对象类型', trigger: 'change' }],
  targetId: [{ required: true, message: '请输入对象ID', trigger: 'blur' }],
  targetName: [{ required: true, message: '请输入对象名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入违规描述', trigger: 'blur' }]
})

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
}

async function handleEdit(row: ViolationRecord) {
  isEdit.value = true
  try {
    const detail = await getViolationDetail(row.id)
    Object.assign(formData, detail)
    dialogVisible.value = true
  } catch {}
}

function handleDelete(row: ViolationRecord) {
  confirmDelete(`确定要删除「${row.targetName}」的违规记录吗？`).then(async (ok) => {
    if (ok) {
      await removeViolation(row.id)
      success('删除成功')
      fetchList()
    }
  })
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateViolation(formData)
      success('编辑成功')
    } else {
      await createViolation(formData)
      success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function handleDialogCancel() {
  formRef.value?.resetFields()
}

fetchList()
</script>
