<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-title">求职者管理</div>
    </div>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="姓名">
        <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="queryParams.gender" placeholder="请选择性别" clearable>
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="学历">
        <el-select v-model="queryParams.education" placeholder="请选择学历" clearable>
          <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" v-debounce="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="table-toolbar-left">
        <el-button type="primary" v-debounce="handleAdd">新增求职者</el-button>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="6">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无求职者数据" />
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          show-index
          @pagination-change="handlePaginationChange"
        >
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="70" align="center">
            <template #default="{ row }">
              {{ row.gender === 1 ? '男' : '女' }}
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" width="70" align="center" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
          <el-table-column prop="education" label="学历" width="80" />
          <el-table-column prop="workYears" label="工作年限" width="90" align="center" />
          <el-table-column prop="jobIntention" label="求职意向" min-width="140" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getSeekerStatusType(row.status)" size="small">
                {{ getSeekerStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
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
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="formData.gender" placeholder="请选择性别">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="18" :max="65" controls-position="right" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入电话" maxlength="11" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="学历" prop="education">
          <el-select v-model="formData.education" placeholder="请选择学历" clearable>
            <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="工作年限" prop="workYears">
          <el-input-number v-model="formData.workYears" :min="0" :max="50" controls-position="right" />
        </el-form-item>
        <el-form-item label="求职意向" prop="jobIntention">
          <el-input v-model="formData.jobIntention" placeholder="请输入求职意向" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ProTable, ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getSeekerList,
  getSeekerDetail,
  createSeeker,
  updateSeeker,
  removeSeeker,
  type SeekerForm,
  type SeekerRecord
} from '@/api/seeker'
import type { FormInstance, FormRules } from 'element-plus'

const { confirmDelete, success } = useConfirm()

const educationOptions = ['高中', '大专', '本科', '硕士', '博士']
const statusOptions = [
  { label: '求职中', value: 1 },
  { label: '已就业', value: 2 },
  { label: '已冻结', value: 3 }
]

function getSeekerStatusType(status: number) {
  const map: Record<number, string> = { 1: 'primary', 2: 'success', 3: 'info' }
  return map[status] || 'info'
}

function getSeekerStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '求职中', 2: '已就业', 3: '已冻结' }
  return map[status] || '未知'
}

const loading = ref(false)
const tableData = ref<SeekerRecord[]>([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  gender: '' as number | string,
  education: '',
  status: '' as number | string
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getSeekerList(queryParams)
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
  queryParams.name = ''
  queryParams.gender = ''
  queryParams.education = ''
  queryParams.status = ''
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

const dialogTitle = computed(() => (isEdit.value ? '编辑求职者' : '新增求职者'))

const initFormData = (): SeekerForm => ({
  name: '',
  gender: '',
  age: 18,
  phone: '',
  email: '',
  education: '',
  workYears: 0,
  jobIntention: '',
  status: 1
})

const formData = reactive<SeekerForm>(initFormData())

const phoneValidator = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的11位手机号'))
  } else {
    callback()
  }
}

const emailValidator = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 18, max: 65, message: '年龄范围18-65', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { validator: phoneValidator, trigger: 'blur' }
  ],
  email: [{ validator: emailValidator, trigger: 'blur' }],
  education: [{ required: true, message: '请选择学历', trigger: 'change' }]
})

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
}

async function handleEdit(row: SeekerRecord) {
  isEdit.value = true
  try {
    const detail = await getSeekerDetail(row.id)
    Object.assign(formData, detail)
    dialogVisible.value = true
  } catch {}
}

function handleDelete(row: SeekerRecord) {
  confirmDelete(`确定要删除求职者「${row.name}」吗？`).then(async (ok) => {
    if (ok) {
      await removeSeeker(row.id)
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
      await updateSeeker(formData)
      success('编辑成功')
    } else {
      await createSeeker(formData)
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
