<template>
  <div class="page-container" ref="pageContainerRef">
    <div class="page-header">
      <div class="page-header-title">求职者管理</div>
      <div class="page-header-subtitle">平台求职者账号基础信息的统一管控</div>
    </div>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="姓名">
        <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="queryParams.gender" placeholder="请选择性别" clearable style="width: 120px" @clear="handleGenderClear">
          <el-option label="男" :value="1" />
          <el-option label="女" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="学历">
        <el-select v-model="queryParams.education" placeholder="请选择学历" clearable style="width: 120px">
          <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px" @clear="handleStatusClear">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="注册时间">
        <el-date-picker
          v-model="registerTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 240px"
          @change="handleDateRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" v-debounce="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="table-toolbar-left">
        <el-button type="primary" v-debounce="handleAdd">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>
          新增求职者
        </el-button>
        <el-button type="warning" :disabled="selectedIds.length === 0" :loading="batchBanLoading" @click="handleBatchBan">
          <el-icon style="margin-right: 4px"><Lock /></el-icon>
          批量冻结
        </el-button>
        <el-button type="success" :disabled="selectedIds.length === 0" :loading="batchUnbanLoading" @click="handleBatchUnban">
          <el-icon style="margin-right: 4px"><Unlock /></el-icon>
          批量解封
        </el-button>
        <el-button type="danger" :disabled="selectedIds.length === 0" :loading="batchDeleteLoading" @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-button type="info" :loading="exportLoading" @click="handleExport">
          <el-icon style="margin-right: 4px"><Download /></el-icon>
          导出数据
        </el-button>
      </div>
      <div class="table-toolbar-right">
        <span class="selected-tip" v-show="selectedIds.length > 0">
          已选择 <em>{{ selectedIds.length }}</em> 项
        </span>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="8">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无求职者数据" />
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          show-selection
          show-index
          height="calc(100vh - 320px)"
          @selection-change="handleSelectionChange"
          @pagination-change="handlePaginationChange"
          @row-dblclick="handleRowDblclick"
        >
          <el-table-column prop="name" label="姓名" width="100" show-overflow-tooltip />
          <el-table-column prop="gender" label="性别" width="70" align="center">
            <template #default="{ row }">
              {{ getGenderLabel(row.gender) }}
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" width="70" align="center" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
          <el-table-column prop="education" label="学历" width="90" />
          <el-table-column prop="workYears" label="工作年限" width="100" align="center">
            <template #default="{ row }">
              {{ row.workYears ?? 0 }}年
            </template>
          </el-table-column>
          <el-table-column prop="jobIntention" label="求职意向" min-width="140" show-overflow-tooltip />
          <el-table-column prop="createTime" label="注册时间" width="170" />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" v-debounce="() => handleEdit(row)">编辑</el-button>
              <el-button
                v-if="row.status === 1"
                type="warning"
                link
                size="small"
                :disabled="rowBanLoading[row.id]"
                @click="() => handleBanSingle(row)"
              >
                冻结
              </el-button>
              <el-button
                v-else
                type="success"
                link
                size="small"
                :disabled="rowBanLoading[row.id]"
                @click="() => handleUnbanSingle(row)"
              >
                解封
              </el-button>
              <el-button type="danger" link size="small" v-debounce="() => handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </ProTable>
      </template>
    </ProSkeleton>

    <transition name="zoom-center">
      <div class="batch-confirm-mask" v-if="batchConfirmVisible" @click.self="closeBatchConfirm">
        <div class="batch-confirm-dialog">
          <div class="batch-confirm-header">
            <div class="batch-confirm-title">{{ batchConfirmTitle }}</div>
            <el-icon class="batch-confirm-close" @click="closeBatchConfirm"><Close /></el-icon>
          </div>
          <div class="batch-confirm-body">
            <el-icon class="batch-confirm-icon" :class="batchConfirmType">
              <component :is="batchConfirmIcon" />
            </el-icon>
            <div class="batch-confirm-content">
              <div class="batch-confirm-message">{{ batchConfirmMessage }}</div>
              <div class="batch-confirm-count">
                本次操作共涉及 <em>{{ selectedIds.length }}</em> 位求职者
              </div>
            </div>
          </div>
          <div class="batch-confirm-footer">
            <el-button @click="closeBatchConfirm">取消</el-button>
            <el-button :type="batchConfirmType" :loading="batchActionLoading" @click="confirmBatchAction">
              确认{{ batchConfirmActionText }}
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="zoom-center">
      <div class="export-progress-mask" v-if="exportProgressVisible">
        <div class="export-progress-dialog">
          <div class="export-progress-header">
            <div class="export-progress-title">数据导出</div>
            <el-icon class="export-progress-close" @click="closeExportProgress"><Close /></el-icon>
          </div>
          <div class="export-progress-body">
            <el-icon class="export-progress-icon"><Document /></el-icon>
            <div class="export-progress-info">
              <div class="export-progress-text">{{ exportProgressText }}</div>
              <el-progress
                :percentage="exportProgress"
                :stroke-width="8"
                :show-text="false"
                class="export-progress-bar"
              />
              <div class="export-progress-percent">{{ exportProgress }}%</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-up">
      <div class="back-to-top" v-show="showBackToTop" @click="scrollToTop">
        <el-icon><Top /></el-icon>
      </div>
    </transition>

    <ProDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      width="680px"
      :confirm-loading="submitLoading"
      @confirm="handleSubmit"
      @cancel="handleDialogCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio :value="1">男</el-radio>
                <el-radio :value="0">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="formData.age" :min="16" :max="70" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学历" prop="education">
              <el-select v-model="formData.education" placeholder="请选择学历" clearable style="width: 100%">
                <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" maxlength="11" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="工作年限" prop="workYears">
              <el-input-number v-model="formData.workYears" :min="0" :max="50" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">求职意向</el-divider>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="求职意向" prop="jobIntention">
              <el-input
                v-model="formData.jobIntention"
                type="textarea"
                :rows="3"
                placeholder="请输入求职意向，如：Java后端开发、前端开发工程师等"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="期望薪资" prop="expectedSalary">
              <el-input v-model="formData.expectedSalary" placeholder="如：15-25K" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望城市" prop="expectedCity">
              <el-input v-model="formData.expectedCity" placeholder="如：北京、上海、深圳" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { Plus, Lock, Unlock, Download, Close, Document, Top, Warning, SuccessFilled } from '@element-plus/icons-vue'
import { ProTable, ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getSeekerList,
  getSeekerDetail,
  createSeeker,
  updateSeeker,
  removeSeeker,
  batchRemoveSeeker,
  batchUpdateStatus,
  exportSeeker,
  type SeekerForm,
  type SeekerRecord
} from '@/api/seeker'
import type { FormInstance, FormRules } from 'element-plus'

const { confirmDelete, confirm, success, error } = useConfirm()

const educationOptions = ['高中', '大专', '本科', '硕士', '博士']
const statusOptions = [
  { label: '正常', value: 1 },
  { label: '禁用', value: 0 }
]

function getGenderLabel(gender: number) {
  const map: Record<number, string> = { 1: '男', 0: '女' }
  return map[gender] ?? '未知'
}

function getStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '正常', 0: '禁用' }
  return map[status] ?? '未知'
}

function getStatusTagType(status: number): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<number, 'success' | 'danger' | 'warning' | 'info'> = { 1: 'success', 0: 'info' }
  return map[status] ?? 'info'
}

const pageContainerRef = shallowRef<HTMLElement>()
const loading = ref(false)
const tableData = ref<SeekerRecord[]>([])
const total = ref(0)
const registerTimeRange = ref<[string, string] | null>(null)
const selectedIds = ref<number[]>([])
const batchDeleteLoading = ref(false)
const batchBanLoading = ref(false)
const batchUnbanLoading = ref(false)
const rowBanLoading = reactive<Record<number, boolean>>({})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  gender: undefined as number | undefined,
  education: '',
  status: undefined as number | undefined,
  startTime: '',
  endTime: ''
})

function handleDateRangeChange(val: [string, string] | null) {
  if (val) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
}

async function fetchList() {
  loading.value = true
  selectedIds.value = []
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

function handleGenderClear() {
  queryParams.gender = undefined
}

function handleStatusClear() {
  queryParams.status = undefined
}

function handleReset() {
  queryParams.name = ''
  queryParams.gender = undefined
  queryParams.education = ''
  queryParams.status = undefined
  queryParams.startTime = ''
  queryParams.endTime = ''
  registerTimeRange.value = null
  handleQuery()
}

function handlePaginationChange({ page, pageSize }: { page: number; pageSize: number }) {
  queryParams.pageNum = page
  queryParams.pageSize = pageSize
  fetchList()
}

function handleSelectionChange(selection: SeekerRecord[]) {
  selectedIds.value = selection.map((item) => item.id)
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const dialogTitle = computed(() => (isEdit.value ? '编辑求职者' : '新增求职者'))

const initFormData = (): SeekerForm => ({
  name: '',
  gender: 1,
  age: 25,
  phone: '',
  email: '',
  education: '',
  workYears: 0,
  jobIntention: '',
  expectedSalary: '',
  expectedCity: '',
  status: 1
})

const formData = reactive<SeekerForm>(initFormData())

const phoneValidator = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
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
    { type: 'number', min: 16, max: 70, message: '年龄范围16-70岁', trigger: 'blur' }
  ],
  phone: [{ validator: phoneValidator, trigger: 'blur' }],
  email: [{ validator: emailValidator, trigger: 'blur' }],
  education: [{ required: true, message: '请选择学历', trigger: 'change' }],
  workYears: [
    { required: true, message: '请输入工作年限', trigger: 'blur' },
    { type: 'number', min: 0, max: 50, message: '工作年限范围0-50年', trigger: 'blur' }
  ],
  jobIntention: [
    { required: true, message: '请输入求职意向', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在2到200个字符', trigger: 'blur' }
  ]
})

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
}

const seekerFormKeys = [
  'id', 'name', 'gender', 'age', 'phone', 'email', 'education',
  'workYears', 'jobIntention', 'expectedSalary', 'expectedCity', 'status'
] as const

async function handleEdit(row: SeekerRecord) {
  isEdit.value = true
  try {
    const detail = await getSeekerDetail(row.id)
    seekerFormKeys.forEach((key) => {
      ;(formData as any)[key] = (detail as any)[key] ?? ''
    })
    dialogVisible.value = true
  } catch {}
}

function handleRowDblclick(row: SeekerRecord) {
  handleEdit(row)
}

function handleDelete(row: SeekerRecord) {
  confirmDelete(`确定要删除求职者「${row.name}」吗？删除后数据将无法恢复。`).then(async (ok: boolean) => {
    if (ok) {
      try {
        await removeSeeker(row.id)
        success('删除成功')
        fetchList()
      } catch {
        error('删除失败，请稍后重试')
      }
    }
  })
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirm(
    `确定要删除选中的 ${selectedIds.value.length} 位求职者吗？删除后数据将无法恢复。`,
    '批量删除确认',
    {
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  )
  if (!ok) return
  batchDeleteLoading.value = true
  try {
    await batchRemoveSeeker(selectedIds.value)
    success('批量删除成功')
    fetchList()
  } catch {
    error('批量删除失败，请稍后重试')
  } finally {
    setTimeout(() => {
      batchDeleteLoading.value = false
    }, 300)
  }
}

const batchConfirmVisible = ref(false)
const batchConfirmType = ref<'warning' | 'success'>('warning')
const batchConfirmTitle = ref('')
const batchConfirmMessage = ref('')
const batchConfirmActionText = ref('')
const batchConfirmIcon = ref(Warning)
const batchActionLoading = ref(false)
const pendingBatchAction = ref<(() => Promise<void>) | null>(null)

function openBatchConfirm(options: {
  type: 'warning' | 'success'
  title: string
  message: string
  actionText: string
  icon: any
  action: () => Promise<void>
}) {
  batchConfirmType.value = options.type
  batchConfirmTitle.value = options.title
  batchConfirmMessage.value = options.message
  batchConfirmActionText.value = options.actionText
  batchConfirmIcon.value = options.icon
  pendingBatchAction.value = options.action
  batchConfirmVisible.value = true
}

function closeBatchConfirm() {
  batchConfirmVisible.value = false
  pendingBatchAction.value = null
}

async function confirmBatchAction() {
  if (!pendingBatchAction.value) return
  batchActionLoading.value = true
  try {
    await pendingBatchAction.value()
    closeBatchConfirm()
  } finally {
    batchActionLoading.value = false
  }
}

async function handleBanSingle(row: SeekerRecord) {
  const ok = await confirm(`确定要冻结求职者「${row.name}」吗？冻结后该账号将无法登录。`, '冻结确认', { type: 'warning' })
  if (!ok) return
  rowBanLoading[row.id] = true
  try {
    await batchUpdateStatus([row.id], 0)
    success('冻结成功')
    fetchList()
  } catch {
    error('冻结失败，请稍后重试')
  } finally {
    setTimeout(() => {
      rowBanLoading[row.id] = false
    }, 300)
  }
}

async function handleUnbanSingle(row: SeekerRecord) {
  const ok = await confirm(`确定要解封求职者「${row.name}」吗？`, '解封确认', { type: 'success' })
  if (!ok) return
  rowBanLoading[row.id] = true
  try {
    await batchUpdateStatus([row.id], 1)
    success('解封成功')
    fetchList()
  } catch {
    error('解封失败，请稍后重试')
  } finally {
    setTimeout(() => {
      rowBanLoading[row.id] = false
    }, 300)
  }
}

function handleBatchBan() {
  if (selectedIds.value.length === 0) return
  openBatchConfirm({
    type: 'warning',
    title: '批量冻结确认',
    message: `确定要冻结选中的 ${selectedIds.value.length} 位求职者吗？冻结后这些账号将无法登录。`,
    actionText: '冻结',
    icon: Warning,
    action: async () => {
      batchBanLoading.value = true
      try {
        await batchUpdateStatus(selectedIds.value, 0)
        success('批量冻结成功')
        fetchList()
      } catch {
        error('批量冻结失败，请稍后重试')
      } finally {
        setTimeout(() => {
          batchBanLoading.value = false
        }, 300)
      }
    }
  })
}

function handleBatchUnban() {
  if (selectedIds.value.length === 0) return
  openBatchConfirm({
    type: 'success',
    title: '批量解封确认',
    message: `确定要解封选中的 ${selectedIds.value.length} 位求职者吗？`,
    actionText: '解封',
    icon: SuccessFilled,
    action: async () => {
      batchUnbanLoading.value = true
      try {
        await batchUpdateStatus(selectedIds.value, 1)
        success('批量解封成功')
        fetchList()
      } catch {
        error('批量解封失败，请稍后重试')
      } finally {
        setTimeout(() => {
          batchUnbanLoading.value = false
        }, 300)
      }
    }
  })
}

const exportLoading = ref(false)
const exportProgressVisible = ref(false)
const exportProgress = ref(0)
const exportProgressText = ref('正在准备导出数据...')
const exportProgressTimer = ref<number | null>(null)

function startExportProgress() {
  exportProgress.value = 0
  exportProgressText.value = '正在准备导出数据...'
  exportProgressVisible.value = true
  exportProgressTimer.value = window.setInterval(() => {
    if (exportProgress.value < 90) {
      exportProgress.value += Math.floor(Math.random() * 8) + 3
      if (exportProgress.value > 90) exportProgress.value = 90
      if (exportProgress.value < 30) {
        exportProgressText.value = '正在查询筛选后的数据...'
      } else if (exportProgress.value < 60) {
        exportProgressText.value = '正在生成 Excel 文件...'
      } else if (exportProgress.value < 90) {
        exportProgressText.value = '正在处理文件下载...'
      }
    }
  }, 200)
}

function stopExportProgress() {
  if (exportProgressTimer.value) {
    clearInterval(exportProgressTimer.value)
    exportProgressTimer.value = null
  }
  exportProgress.value = 100
  exportProgressText.value = '导出完成，正在下载文件...'
  setTimeout(() => {
    exportProgressVisible.value = false
  }, 800)
}

function closeExportProgress() {
  if (exportProgress.value >= 100) {
    exportProgressVisible.value = false
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function handleExport() {
  exportLoading.value = true
  startExportProgress()
  try {
    const blob = await exportSeeker(queryParams)
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const fileName = `求职者数据_${dateStr}.xlsx`
    downloadBlob(blob, fileName)
    stopExportProgress()
    success('导出成功')
  } catch {
    stopExportProgress()
    error('导出失败，请稍后重试')
  } finally {
    exportLoading.value = false
  }
}

const showBackToTop = ref(false)

function handleScroll() {
  if (!pageContainerRef.value) return
  const container = pageContainerRef.value
  showBackToTop.value = container.scrollTop > 500
}

function scrollToTop() {
  pageContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  pageContainerRef.value?.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  pageContainerRef.value?.removeEventListener('scroll', handleScroll)
  if (exportProgressTimer.value) {
    clearInterval(exportProgressTimer.value)
  }
})

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

<style lang="scss" scoped>
.page-container {
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.page-header-subtitle {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.selected-tip {
  font-size: 14px;
  color: #606266;

  em {
    color: #409eff;
    font-style: normal;
    font-weight: 600;
    margin: 0 2px;
  }
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}

.batch-confirm-mask,
.export-progress-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.batch-confirm-dialog,
.export-progress-dialog {
  background: #fff;
  border-radius: 8px;
  width: 420px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.batch-confirm-header,
.export-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.batch-confirm-title,
.export-progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.batch-confirm-close,
.export-progress-close {
  font-size: 18px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}

.batch-confirm-body {
  padding: 24px 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.batch-confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;

  &.warning {
    background: #fdf6ec;
    color: #e6a23c;
  }

  &.success {
    background: #f0f9eb;
    color: #67c23a;
  }
}

.batch-confirm-content {
  flex: 1;
}

.batch-confirm-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.batch-confirm-count {
  font-size: 13px;
  color: #909399;

  em {
    color: #409eff;
    font-style: normal;
    font-weight: 600;
    margin: 0 2px;
  }
}

.batch-confirm-footer {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.export-progress-body {
  padding: 28px 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.export-progress-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.export-progress-info {
  flex: 1;
}

.export-progress-text {
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
}

.export-progress-bar {
  margin-bottom: 8px;
}

.export-progress-percent {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.back-to-top {
  position: fixed;
  right: 40px;
  bottom: 60px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2000;
  transition: all 0.3s;
  color: #606266;
  font-size: 18px;

  &:hover {
    background: #409eff;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
  }
}

.zoom-center-enter-active,
.zoom-center-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.zoom-center-enter-from,
.zoom-center-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.zoom-center-enter-active .batch-confirm-dialog,
.zoom-center-enter-active .export-progress-dialog,
.zoom-center-leave-active .batch-confirm-dialog,
.zoom-center-leave-active .export-progress-dialog {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoom-center-enter-from .batch-confirm-dialog,
.zoom-center-enter-from .export-progress-dialog,
.zoom-center-leave-to .batch-confirm-dialog,
.zoom-center-leave-to .export-progress-dialog {
  transform: scale(0.9) translateY(-20px);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
