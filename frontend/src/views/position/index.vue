<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-title">岗位管理</div>
    </div>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="岗位名称">
        <el-input v-model="queryParams.title" placeholder="请输入岗位名称" clearable />
      </el-form-item>
      <el-form-item label="城市">
        <el-input v-model="queryParams.city" placeholder="请输入城市" clearable />
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
        <el-button type="primary" v-debounce="handleAdd">新增岗位</el-button>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="6">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无岗位数据" />
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          show-index
          @pagination-change="handlePaginationChange"
        >
          <el-table-column prop="title" label="岗位名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="enterpriseName" label="企业名称" min-width="140" show-overflow-tooltip />
          <el-table-column label="薪资范围" width="120" align="center">
            <template #default="{ row }">
              {{ row.salaryMin }}K-{{ row.salaryMax }}K
            </template>
          </el-table-column>
          <el-table-column prop="city" label="城市" width="100" />
          <el-table-column prop="education" label="学历要求" width="100" />
          <el-table-column prop="experience" label="经验要求" width="100" />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getPositionStatusType(row.status)" size="small">
                {{ getPositionStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
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
      width="650px"
      :confirm-loading="submitLoading"
      @confirm="handleSubmit"
      @cancel="handleDialogCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="岗位名称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入岗位名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="所属企业" prop="enterpriseId">
          <el-select v-model="formData.enterpriseId" placeholder="请选择企业" filterable>
            <el-option
              v-for="item in enterpriseList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="最低薪资(K)" prop="salaryMin">
          <el-input-number v-model="formData.salaryMin" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="最高薪资(K)" prop="salaryMax">
          <el-input-number v-model="formData.salaryMax" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="formData.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="学历要求" prop="education">
          <el-select v-model="formData.education" placeholder="请选择学历" clearable>
            <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="经验要求" prop="experience">
          <el-select v-model="formData.experience" placeholder="请选择经验要求" clearable>
            <el-option v-for="item in experienceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="请输入岗位描述" />
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
  getPositionList,
  getPositionDetail,
  createPosition,
  updatePosition,
  removePosition,
  type PositionForm,
  type PositionRecord
} from '@/api/position'
import { getEnterpriseList, type EnterpriseRecord } from '@/api/enterprise'
import type { FormInstance, FormRules } from 'element-plus'

const { confirmDelete, success } = useConfirm()

const educationOptions = ['不限', '高中', '大专', '本科', '硕士', '博士']
const experienceOptions = ['不限', '1-3年', '3-5年', '5-10年', '10年以上']
const statusOptions = [
  { label: '招聘中', value: 1 },
  { label: '已暂停', value: 2 },
  { label: '已关闭', value: 3 }
]

function getPositionStatusType(status: number) {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'info' }
  return map[status] || 'info'
}

function getPositionStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '招聘中', 2: '已暂停', 3: '已关闭' }
  return map[status] || '未知'
}

const loading = ref(false)
const tableData = ref<PositionRecord[]>([])
const total = ref(0)
const enterpriseList = ref<EnterpriseRecord[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  city: '',
  status: '' as number | string
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getPositionList(queryParams)
    tableData.value = res.records
    total.value = res.total
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchEnterpriseList() {
  try {
    const res = await getEnterpriseList({ pageNum: 1, pageSize: 1000 })
    enterpriseList.value = res.records
  } catch {
    enterpriseList.value = []
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  fetchList()
}

function handleReset() {
  queryParams.title = ''
  queryParams.city = ''
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

const dialogTitle = computed(() => (isEdit.value ? '编辑岗位' : '新增岗位'))

const initFormData = (): PositionForm => ({
  title: '',
  enterpriseId: '',
  salaryMin: 1,
  salaryMax: 1,
  city: '',
  education: '',
  experience: '',
  description: '',
  status: 1
})

const formData = reactive<PositionForm>(initFormData())

const salaryMaxValidator = (_rule: any, value: number, callback: (err?: Error) => void) => {
  if (value <= formData.salaryMin) {
    callback(new Error('最高薪资必须大于最低薪资'))
  } else {
    callback()
  }
}

const formRules = reactive<FormRules>({
  title: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  enterpriseId: [{ required: true, message: '请选择企业', trigger: 'change' }],
  salaryMin: [{ required: true, message: '请输入最低薪资', trigger: 'blur' }],
  salaryMax: [
    { required: true, message: '请输入最高薪资', trigger: 'blur' },
    { validator: salaryMaxValidator, trigger: 'blur' }
  ],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }]
})

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
  fetchEnterpriseList()
}

async function handleEdit(row: PositionRecord) {
  isEdit.value = true
  fetchEnterpriseList()
  try {
    const detail = await getPositionDetail(row.id)
    Object.assign(formData, detail)
    dialogVisible.value = true
  } catch {}
}

function handleDelete(row: PositionRecord) {
  confirmDelete(`确定要删除岗位「${row.title}」吗？`).then(async (ok) => {
    if (ok) {
      await removePosition(row.id)
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
      await updatePosition(formData)
      success('编辑成功')
    } else {
      await createPosition(formData)
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
