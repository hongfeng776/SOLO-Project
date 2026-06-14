<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-title">简历管理</div>
    </div>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="求职者姓名">
        <el-input v-model="queryParams.seekerName" placeholder="请输入求职者姓名" clearable />
      </el-form-item>
      <el-form-item label="岗位">
        <el-select v-model="queryParams.positionId" placeholder="请选择岗位" clearable filterable>
          <el-option
            v-for="item in positionList"
            :key="item.id"
            :label="item.title"
            :value="item.id"
          />
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
        <el-button type="primary" v-debounce="handleAdd">新增简历</el-button>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="6">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无简历数据" />
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          show-index
          @pagination-change="handlePaginationChange"
        >
          <el-table-column prop="seekerName" label="求职者姓名" width="120" />
          <el-table-column prop="positionName" label="应聘岗位" min-width="160" show-overflow-tooltip />
          <el-table-column prop="enterpriseName" label="企业名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getResumeStatusType(row.status)" size="small">
                {{ getResumeStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column prop="createTime" label="投递时间" width="170" />
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
        <el-form-item label="求职者" prop="seekerId">
          <el-select v-model="formData.seekerId" placeholder="请选择求职者" filterable>
            <el-option
              v-for="item in seekerList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="应聘岗位" prop="positionId">
          <el-select v-model="formData.positionId" placeholder="请选择岗位" filterable>
            <el-option
              v-for="item in positionList"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="4" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ProTable, ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getResumeList,
  getResumeDetail,
  createResume,
  updateResume,
  removeResume,
  type ResumeForm,
  type ResumeRecord
} from '@/api/resume'
import { getSeekerList, type SeekerRecord } from '@/api/seeker'
import { getPositionList, type PositionRecord } from '@/api/position'
import type { FormInstance, FormRules } from 'element-plus'

const { confirmDelete, success } = useConfirm()

const statusOptions = [
  { label: '待筛选', value: 1 },
  { label: '已筛选', value: 2 },
  { label: '面试中', value: 3 },
  { label: '已录用', value: 4 },
  { label: '已淘汰', value: 5 }
]

function getResumeStatusType(status: number) {
  const map: Record<number, string> = { 1: 'info', 2: 'primary', 3: 'warning', 4: 'success', 5: 'danger' }
  return map[status] || 'info'
}

function getResumeStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '待筛选', 2: '已筛选', 3: '面试中', 4: '已录用', 5: '已淘汰' }
  return map[status] || '未知'
}

const loading = ref(false)
const tableData = ref<ResumeRecord[]>([])
const total = ref(0)
const seekerList = ref<SeekerRecord[]>([])
const positionList = ref<PositionRecord[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  seekerName: '',
  positionId: '' as number | string,
  status: '' as number | string
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getResumeList(queryParams)
    tableData.value = res.records
    total.value = res.total
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchSeekerList() {
  try {
    const res = await getSeekerList({ pageNum: 1, pageSize: 1000 })
    seekerList.value = res.records
  } catch {
    seekerList.value = []
  }
}

async function fetchPositionList() {
  try {
    const res = await getPositionList({ pageNum: 1, pageSize: 1000 })
    positionList.value = res.records
  } catch {
    positionList.value = []
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  fetchList()
}

function handleReset() {
  queryParams.seekerName = ''
  queryParams.positionId = ''
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

const dialogTitle = computed(() => (isEdit.value ? '编辑简历' : '新增简历'))

const initFormData = (): ResumeForm => ({
  seekerId: '',
  positionId: '',
  status: 1,
  remark: ''
})

const formData = reactive<ResumeForm>(initFormData())

const formRules = reactive<FormRules>({
  seekerId: [{ required: true, message: '请选择求职者', trigger: 'change' }],
  positionId: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
  fetchSeekerList()
  fetchPositionList()
}

async function handleEdit(row: ResumeRecord) {
  isEdit.value = true
  fetchSeekerList()
  fetchPositionList()
  try {
    const detail = await getResumeDetail(row.id)
    Object.assign(formData, detail)
    dialogVisible.value = true
  } catch {}
}

function handleDelete(row: ResumeRecord) {
  confirmDelete(`确定要删除「${row.seekerName}」的简历记录吗？`).then(async (ok) => {
    if (ok) {
      await removeResume(row.id)
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
      await updateResume(formData)
      success('编辑成功')
    } else {
      await createResume(formData)
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
fetchPositionList()
</script>
