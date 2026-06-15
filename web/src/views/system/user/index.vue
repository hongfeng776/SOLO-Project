<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshLeft,
  Plus,
  Edit,
  Delete,
  Download,
  Lock,
  Unlock,
  ArrowUp,
  Filter,
  Close
} from '@element-plus/icons-vue'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useConfirm } from '@/components/ConfirmDialog'
import type { UserVO } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  batchUpdateUserStatus,
  exportUserList,
  type UserQuery
} from '@/api/user'

type DateRange = [string, string] | null | undefined

const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<UserQuery> = {
  username: '',
  status: undefined,
  keyword: '',
  createTimeStart: undefined,
  createTimeEnd: undefined,
  learnedWordsMin: undefined,
  learnedWordsMax: undefined,
  studyDaysMin: undefined,
  studyDaysMax: undefined,
  activityLevel: undefined
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
  handleReset: originalReset,
  handleRefresh,
  handlePageChange,
  handleSelectionChange
} = useTable<UserVO, UserQuery>(getUserList, initialQuery)

const createTimeRange = ref<DateRange>()
const showAdvancedFilter = ref(false)
const showBackTop = ref(false)
const pageContainerRef = ref<HTMLElement>()

function onScroll(e: Event) {
  const target = e.target as HTMLElement
  showBackTop.value = target.scrollTop > 500
}

function scrollToTop() {
  if (pageContainerRef.value) {
    pageContainerRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function toggleAdvancedFilter() {
  showAdvancedFilter.value = !showAdvancedFilter.value
}

function applyAdvancedSearch() {
  if (createTimeRange.value && createTimeRange.value.length === 2) {
    const [start, end] = createTimeRange.value
    queryForm.createTimeStart = start ? new Date(start).toISOString() : undefined
    queryForm.createTimeEnd = end ? new Date(end).toISOString() : undefined
  } else {
    queryForm.createTimeStart = undefined
    queryForm.createTimeEnd = undefined
  }
  handleSearch()
}

function handleReset() {
  createTimeRange.value = undefined
  originalReset()
}

const batchModal = reactive({
  visible: false,
  action: 'freeze' as 'freeze' | 'unfreeze',
  count: 0
})

function openBatchFreeze() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  batchModal.action = 'freeze'
  batchModal.count = selectedIds.value.length
  batchModal.visible = true
}

function openBatchUnfreeze() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  batchModal.action = 'unfreeze'
  batchModal.count = selectedIds.value.length
  batchModal.visible = true
}

async function confirmBatchAction() {
  const status = batchModal.action === 'freeze' ? 0 : 1
  const actionText = batchModal.action === 'freeze' ? '冻结' : '解封'
  try {
    await batchUpdateUserStatus(selectedIds.value, status)
    ElMessage.success(`批量${actionText}成功`)
    batchModal.visible = false
    handleRefresh()
  } catch {
    // error handled
  }
}

const exportState = reactive({
  visible: false,
  progress: 0,
  percent: 0,
  exporting: false
})

function openExportDialog() {
  exportState.visible = true
  exportState.progress = 0
  exportState.percent = 0
  exportState.exporting = false
}

function closeExportDialog() {
  if (exportState.exporting) {
    ElMessageBox.confirm('正在导出中，确定要取消吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      exportState.visible = false
    }).catch(() => {})
    return
  }
  exportState.visible = false
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

async function startExport() {
  exportState.exporting = true
  exportState.progress = 0
  exportState.percent = 0

  const exportParams: UserQuery = { ...queryForm }
  delete (exportParams as any).pageNum
  delete (exportParams as any).pageSize

  try {
    const blob = await exportUserList(exportParams, (loaded, total) => {
      if (total > 0) {
        exportState.progress = (loaded / total) * 100
        exportState.percent = Math.min(Math.round(exportState.progress), 99)
      } else {
        exportState.progress = Math.min(exportState.progress + 10, 90)
        exportState.percent = Math.round(exportState.progress)
      }
    })
    exportState.progress = 100
    exportState.percent = 100
    const timestamp = new Date()
    const filename = `用户数据_${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}.xlsx`
    downloadBlob(blob, filename)
    ElMessage.success('导出成功')
    setTimeout(() => {
      exportState.visible = false
      exportState.exporting = false
    }, 800)
  } catch (e: any) {
    ElMessage.error(e.message || '导出失败')
  } finally {
    exportState.exporting = false
  }
}

const modal = useModal<{
  id?: number
  username: string
  nickname: string
  password: string
  phone: string
  email: string
  avatar: string
  status: number
  studyMinutes: number
  learnedWords: number
  studyDays: number
  accuracy: number
}>({
  username: '',
  nickname: '',
  password: '',
  phone: '',
  email: '',
  avatar: '',
  status: 1,
  studyMinutes: 0,
  learnedWords: 0,
  studyDays: 0,
  accuracy: 0
})

const isEdit = ref(false)
const formRef = ref<FormInstance>()

const validatePhone = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(value)) {
    callback(new Error('手机号格式不正确'))
  } else {
    callback()
  }
}

const validateEmail = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
    return
  }
  const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!emailReg.test(value)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

const validateUsername = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入账号'))
    return
  }
  if (value.length < 3 || value.length > 20) {
    callback(new Error('账号长度需在3-20个字符之间'))
  } else {
    callback()
  }
}

const validateNickname = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入昵称'))
    return
  }
  if (value.length > 20) {
    callback(new Error('昵称长度不能超过20个字符'))
  } else {
    callback()
  }
}

const validateStudyMinutes = (_rule: any, value: number | null | undefined, callback: any) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入学习时长'))
    return
  }
  if (value < 0) {
    callback(new Error('学习时长不能为负数'))
  } else {
    callback()
  }
}

const validateLearnedWords = (_rule: any, value: number | null | undefined, callback: any) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入已学单词数'))
    return
  }
  if (value < 0) {
    callback(new Error('已学单词数不能为负数'))
  } else {
    callback()
  }
}

const validateAccuracy = (_rule: any, value: number | null | undefined, callback: any) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入正确率'))
    return
  }
  if (value < 0 || value > 100) {
    callback(new Error('正确率需在0-100之间'))
  } else {
    callback()
  }
}

const formRules: FormRules = {
  username: [{ validator: validateUsername, trigger: 'blur' }],
  nickname: [{ validator: validateNickname, trigger: 'blur' }],
  password: [
    {
      validator: (_rule: any, value: string, cb: any) => {
        if (!isEdit.value && !value) {
          cb(new Error('请输入密码'))
        } else if (value && value.length < 6) {
          cb(new Error('密码长度不能少于6位'))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [{ validator: validatePhone, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  studyMinutes: [{ validator: validateStudyMinutes, trigger: 'blur' }],
  learnedWords: [{ validator: validateLearnedWords, trigger: 'blur' }],
  accuracy: [{ validator: validateAccuracy, trigger: 'blur' }]
}

const submitLoading = ref(false)

function handleAdd() {
  isEdit.value = false
  modal.open()
}

async function handleEdit(row: UserVO) {
  isEdit.value = true
  modal.open({
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    password: '',
    phone: row.phone,
    email: row.email,
    avatar: row.avatar,
    status: row.status,
    studyMinutes: row.studyMinutes,
    learnedWords: row.learnedWords,
    studyDays: row.studyDays,
    accuracy: row.accuracy
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      submitLoading.value = true
      if (isEdit.value) {
        await updateUser(modal.formData)
        ElMessage.success('修改成功')
      } else {
        await createUser(modal.formData)
        ElMessage.success('新增成功')
      }
      modal.close()
      handleRefresh()
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleDelete(row: UserVO) {
  const ok = await confirmDelete(`确定要删除用户「${row.nickname}」吗？删除后数据将无法恢复。`)
  if (!ok) return
  await deleteUser([row.id])
  ElMessage.success('删除成功')
  handleRefresh()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条用户数据吗？删除后数据将无法恢复。`)
  if (!ok) return
  await deleteUser(selectedIds.value)
  ElMessage.success('批量删除成功')
  handleRefresh()
}

async function handleStatusChange(row: UserVO, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  const ok = await confirm(`确定要${action}用户「${row.nickname}」吗？`, '状态确认')
  if (!ok) {
    row.status = row.status === 1 ? 0 : 1
    return
  }
  await updateUserStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  handleRefresh()
}

function formatStudyTime(minutes: number): string {
  if (!minutes) return '0分钟'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
  }
  return `${mins}分钟`
}

const tableHeight = computed(() => {
  return 'calc(100vh - 360px)'
})

const activityOptions = [
  { label: '低活跃 (< 5天)', value: 1 },
  { label: '中低活跃 (5-14天)', value: 2 },
  { label: '中高活跃 (15-29天)', value: 3 },
  { label: '高活跃 (≥ 30天)', value: 4 }
]
</script>

<template>
  <div
    ref="pageContainerRef"
    class="page-container user-management"
    @scroll="onScroll"
  >
    <el-card shadow="never" class="search-card">
      <el-form
        :model="queryForm"
        label-width="80px"
        inline
        class="search-form"
        @submit.prevent="applyAdvancedSearch"
      >
        <el-form-item label="账号">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入账号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="已冻结" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="昵称/手机号搜索"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyAdvancedSearch">
            <el-icon><Search /></el-icon>筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
          <el-button @click="toggleAdvancedFilter" :type="showAdvancedFilter ? 'primary' : 'default'">
            <el-icon><Filter /></el-icon>高级筛选
          </el-button>
        </el-form-item>

        <div v-show="showAdvancedFilter" class="advanced-filter">
          <el-row :gutter="16" style="width: 100%">
            <el-col :span="8">
              <el-form-item label="注册时间">
                <el-date-picker
                  v-model="createTimeRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="累计背词">
                <div style="display: flex; gap: 8px; width: 100%">
                  <el-input-number
                    v-model="queryForm.learnedWordsMin"
                    :min="0"
                    placeholder="最小"
                    controls-position="right"
                    style="flex: 1"
                  />
                  <span style="padding: 0 4px; align-self: center">-</span>
                  <el-input-number
                    v-model="queryForm.learnedWordsMax"
                    :min="0"
                    placeholder="最大"
                    controls-position="right"
                    style="flex: 1"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="活跃度">
                <el-select
                  v-model="queryForm.activityLevel"
                  placeholder="选择活跃度等级"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="opt in activityOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="width: 100%">
            <el-col :span="8">
              <el-form-item label="学习天数">
                <div style="display: flex; gap: 8px; width: 100%">
                  <el-input-number
                    v-model="queryForm.studyDaysMin"
                    :min="0"
                    placeholder="最小"
                    controls-position="right"
                    style="flex: 1"
                  />
                  <span style="padding: 0 4px; align-self: center">-</span>
                  <el-input-number
                    v-model="queryForm.studyDaysMax"
                    :min="0"
                    placeholder="最大"
                    controls-position="right"
                    style="flex: 1"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="table-title">用户列表</span>
          <span class="table-total">共 {{ total }} 条记录</span>
        </div>
        <div class="toolbar-right">
          <el-button type="success" :icon="Download" @click="openExportDialog">
            导出数据
          </el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增用户
          </el-button>
        </div>
      </div>

      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="success" plain :icon="Unlock" @click="openBatchUnfreeze">
          批量解封
        </el-button>
        <el-button type="warning" plain :icon="Lock" @click="openBatchFreeze">
          批量冻结
        </el-button>
        <el-button type="danger" plain class="delete-btn" @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="10" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <div v-else class="table-wrapper">
          <el-table
            :data="list"
            v-loading="loading"
            :height="tableHeight"
            stripe
            border
            class="user-table sticky-header-table"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" :reserve-selection="false" />
            <el-table-column prop="id" label="ID" width="70" fixed />
            <el-table-column prop="nickname" label="昵称" width="120" show-overflow-tooltip />
            <el-table-column prop="username" label="账号" width="140" show-overflow-tooltip />
            <el-table-column prop="phone" label="手机号" width="140" />
            <el-table-column label="学习数据" width="200">
              <template #default="{ row }">
                <div class="study-data">
                  <div class="study-item">
                    <span class="study-label">已学单词</span>
                    <span class="study-value">{{ (row as UserVO).learnedWords }}</span>
                  </div>
                  <div class="study-item">
                    <span class="study-label">学习时长</span>
                    <span class="study-value">{{ formatStudyTime((row as UserVO).studyMinutes) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="学习天数" width="100">
              <template #default="{ row }">
                {{ (row as UserVO).studyDays }} 天
              </template>
            </el-table-column>
            <el-table-column label="正确率" width="100">
              <template #default="{ row }">
                <span :class="['accuracy-tag', (row as UserVO).accuracy >= 80 ? 'high' : (row as UserVO).accuracy >= 60 ? 'medium' : 'low']">
                  {{ (row as UserVO).accuracy }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="注册时间" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="(row as UserVO).status === 1 ? 'success' : 'danger'"
                  effect="light"
                  round
                >
                  {{ (row as UserVO).status === 1 ? '正常' : '已冻结' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link :icon="Edit" @click="handleEdit(row as UserVO)">
                  编辑
                </el-button>
                <el-button
                  :type="(row as UserVO).status === 1 ? 'warning' : 'success'"
                  link
                  :icon="(row as UserVO).status === 1 ? Lock : Unlock"
                  @click="handleStatusChange(row as UserVO, (row as UserVO).status === 1 ? 0 : 1)"
                >
                  {{ (row as UserVO).status === 1 ? '冻结' : '解封' }}
                </el-button>
                <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  class="delete-btn delete-link-btn"
                  @click="handleDelete(row as UserVO)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <Pagination
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>
    </el-card>

    <transition name="backtop-fade">
      <div
        v-show="showBackTop"
        class="back-to-top"
        @click="scrollToTop"
        title="返回顶部"
      >
        <el-icon :size="20"><ArrowUp /></el-icon>
      </div>
    </transition>

    <ModalDialog
      v-model="modal.visible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :loading="submitLoading"
      width="640px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="100px"
        :disabled="submitLoading"
        class="user-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号" prop="username">
              <el-input
                v-model="modal.formData.username"
                placeholder="请输入账号"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="modal.formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="modal.formData.password"
                type="password"
                :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="modal.formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="modal.formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">学习数据配置</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="已学单词" prop="learnedWords">
              <el-input-number
                v-model="modal.formData.learnedWords"
                :min="0"
                :max="99999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学习时长(分)" prop="studyMinutes">
              <el-input-number
                v-model="modal.formData.studyMinutes"
                :min="0"
                :max="99999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学习天数">
              <el-input-number
                v-model="modal.formData.studyDays"
                :min="0"
                :max="9999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="正确率(%)" prop="accuracy">
              <el-input-number
                v-model="modal.formData.accuracy"
                :min="0"
                :max="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="账号状态">
              <el-radio-group v-model="modal.formData.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">已冻结</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ModalDialog>

    <el-dialog
      v-model="batchModal.visible"
      :title="batchModal.action === 'freeze' ? '批量冻结账号' : '批量解封账号'"
      width="440px"
      :close-on-click-modal="false"
      custom-class="batch-status-dialog"
      append-to-body
    >
      <div class="batch-dialog-content">
        <el-alert
          :title="batchModal.action === 'freeze'
            ? `确定要冻结选中的 ${batchModal.count} 个用户账号吗？`
            : `确定要解封选中的 ${batchModal.count} 个用户账号吗？`"
          :type="batchModal.action === 'freeze' ? 'warning' : 'info'"
          :closable="false"
          show-icon
        />
        <div v-if="batchModal.action === 'freeze'" class="batch-tips">
          <p><strong>冻结后将产生以下影响：</strong></p>
          <ul>
            <li>用户无法登录系统</li>
            <li>用户发布的内容将被隐藏</li>
            <li>可后续执行「解封」操作恢复</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchModal.visible = false">取消</el-button>
        <el-button
          :type="batchModal.action === 'freeze' ? 'warning' : 'success'"
          @click="confirmBatchAction"
        >
          确认{{ batchModal.action === 'freeze' ? '冻结' : '解封' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="exportState.visible"
      title="导出用户数据"
      width="480px"
      :close-on-click-modal="false"
      custom-class="export-dialog"
      append-to-body
      @close="closeExportDialog"
    >
      <div class="export-content">
        <div class="export-info">
          <el-icon :size="40" color="#409eff"><Download /></el-icon>
          <div class="export-desc">
            <h4>导出当前筛选结果</h4>
            <p>将导出符合当前筛选条件的全部用户数据为 Excel 文件</p>
          </div>
        </div>
        <div v-if="exportState.exporting" class="progress-wrapper">
          <el-progress
            :percentage="exportState.percent"
            :stroke-width="12"
            :text-inside="true"
            status="success"
          />
          <p class="progress-hint">
            {{ exportState.percent < 100 ? '正在导出，请稍候...' : '导出完成！' }}
          </p>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeExportDialog" :disabled="exportState.exporting">
          {{ exportState.exporting ? '导出中...' : '取消' }}
        </el-button>
        <el-button
          type="primary"
          :icon="Download"
          :loading="exportState.exporting"
          :disabled="exportState.exporting"
          @click="startExport"
        >
          {{ exportState.exporting ? '导出中' : '开始导出' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-management {
  position: relative;

  .search-card {
    border-radius: 8px;
  }

  .table-card {
    margin-top: 16px;
    border-radius: 8px;
  }

  .advanced-filter {
    width: 100%;
    padding-top: 12px;
    border-top: 1px dashed #e4e7ed;
    margin-top: 4px;

    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item__label) {
      width: 80px !important;
    }
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .table-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .table-total {
        font-size: 13px;
        color: #909399;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .table-wrapper {
    overflow: hidden;
    border-radius: 4px;
  }

  .user-table {
    :deep(.el-table__header-wrapper) {
      th {
        background-color: #fafafa;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .study-data {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .study-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;

      .study-label {
        color: #909399;
      }

      .study-value {
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .accuracy-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;

    &.high {
      background-color: #f0f9eb;
      color: #67c23a;
    }

    &.medium {
      background-color: #fdf6ec;
      color: #e6a23c;
    }

    &.low {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }

  .delete-link-btn {
    &:hover {
      transform: scale(1.05);
    }
  }

  .user-form {
    .el-divider {
      margin: 10px 0 20px 0;

      --el-divider-text-color: #303133;
      --el-divider-text-font-size: 14px;
      --el-divider-text-font-weight: 600;
    }

    .el-input-number {
      :deep(.el-input__wrapper) {
        box-shadow: none;
      }
    }
  }

  .back-to-top {
    position: fixed;
    right: 30px;
    bottom: 50px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #409eff;
    z-index: 1000;
    transition: all 0.3s ease;
    border: 1px solid #ebeef5;

    &:hover {
      background: #409eff;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    }
  }

  .backtop-fade-enter-active,
  .backtop-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .backtop-fade-enter-from,
  .backtop-fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }

  .batch-dialog-content {
    padding: 10px 0;

    .batch-tips {
      margin-top: 16px;
      padding: 12px 16px;
      background: #fafafa;
      border-radius: 6px;

      p {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #606266;
      }

      ul {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        color: #606266;

        li {
          line-height: 1.8;
        }
      }
    }
  }

  .export-content {
    padding: 10px 0;

    .export-info {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;

      .export-desc {
        flex: 1;

        h4 {
          margin: 0 0 6px 0;
          font-size: 15px;
          color: #303133;
          font-weight: 600;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }

    .progress-wrapper {
      margin-top: 20px;

      .progress-hint {
        text-align: center;
        margin: 10px 0 0 0;
        font-size: 13px;
        color: #909399;
      }
    }
  }
}

:deep(.batch-status-dialog) {
  animation: zoomFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

:deep(.export-dialog) {
  animation: zoomFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes zoomFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
