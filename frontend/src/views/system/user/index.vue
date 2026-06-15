<template>
  <div class="user-manage-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入账号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <div class="custom-select-wrapper" @click.stop>
            <div
              class="custom-select-trigger"
              @click="toggleStatusDropdown"
              :class="{ 'is-focused': statusDropdownVisible }"
            >
              <span :class="{ 'placeholder': searchForm.status === null }">
                {{ statusLabel }}
              </span>
              <el-icon class="select-arrow" :class="{ 'is-open': statusDropdownVisible }"><ArrowDown /></el-icon>
            </div>
            <Transition name="dropdown-fade">
              <div v-show="statusDropdownVisible" class="custom-select-dropdown" @click.stop>
                <div
                  class="select-option"
                  :class="{ 'is-active': searchForm.status === null }"
                  @click="selectStatus(null)"
                >
                  全部状态
                </div>
                <div
                  class="select-option"
                  :class="{ 'is-active': searchForm.status === 1 }"
                  @click="selectStatus(1)"
                >
                  <span class="status-dot status-normal"></span>
                  正常
                </div>
                <div
                  class="select-option"
                  :class="{ 'is-active': searchForm.status === 0 }"
                  @click="selectStatus(0)"
                >
                  <span class="status-dot status-banned"></span>
                  已封禁
                </div>
              </div>
            </Transition>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" v-ripple @click="handleSearch">搜索</el-button>
          <el-button v-ripple @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <el-button
          type="primary"
          v-ripple
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button
          type="warning"
          v-ripple
          :disabled="selectedRows.length === 0 || !hasNormalUsers"
          class="ban-btn"
          @click="handleBatchBan"
        >
          <el-icon><Lock /></el-icon>
          批量封禁
        </el-button>
        <el-button
          type="success"
          v-ripple
          :disabled="selectedRows.length === 0 || !hasBannedUsers"
          class="unban-btn"
          @click="handleBatchUnban"
        >
          <el-icon><Unlock /></el-icon>
          批量解封
        </el-button>
        <div class="toolbar-right">
          <div v-if="exporting" class="export-progress-wrapper">
            <el-progress
              :percentage="exportProgress"
              :stroke-width="8"
              :show-text="true"
              color="#4080FF"
              style="width: 180px"
            />
          </div>
          <el-button
            type="success"
            v-ripple
            :loading="exporting"
            class="export-btn"
            @click="handleExport"
          >
            <el-icon><Download /></el-icon>
            {{ exporting ? '导出中...' : '导出数据' }}
          </el-button>
        </div>
      </div>

      <Transition name="batch-bar-slide">
        <div v-if="selectedRows.length > 0" class="batch-action-bar">
          <div class="batch-info">
            已选择 <span class="batch-count">{{ selectedRows.length }}</span> 项
          </div>
          <div class="batch-actions">
            <el-button
              type="warning"
              v-ripple
              :disabled="!hasNormalUsers"
              class="ban-btn"
              @click="handleBatchBan"
            >
              <el-icon><Lock /></el-icon>
              封禁
            </el-button>
            <el-button
              type="success"
              v-ripple
              :disabled="!hasBannedUsers"
              class="unban-btn"
              @click="handleBatchUnban"
            >
              <el-icon><Unlock /></el-icon>
              解封
            </el-button>
            <el-button v-ripple @click="handleClearSelection">取消选择</el-button>
          </div>
        </div>
      </Transition>

      <div v-if="loading" class="skeleton-wrapper">
        <div class="skeleton-table">
          <div class="skeleton-header">
            <div v-for="i in 8" :key="i" class="skeleton-header-item"></div>
          </div>
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div v-for="j in 8" :key="j" class="skeleton-cell"></div>
          </div>
        </div>
      </div>

      <div v-else class="table-container">
        <HTable
          ref="tableRef"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :total="total"
          :show-selection="true"
          :selected-row-id="selectedRowId"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleRowDblclick"
          @row-click="handleRowClick"
        >
          <template #status="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : 'danger'"
              size="small"
              effect="light"
              :class="{ 'tag-banned': row.status === 0 }"
            >
              {{ row.status === 1 ? '正常' : '已封禁' }}
            </el-tag>
          </template>
          <template #action="{ row }">
            <el-button
              link
              type="primary"
              v-ripple
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="warning"
              v-ripple
              class="action-ban-btn"
              @click="handleBan(row)"
            >
              封禁
            </el-button>
            <el-button
              v-else
              link
              type="success"
              v-ripple
              class="action-unban-btn"
              @click="handleUnban(row)"
            >
              解封
            </el-button>
            <el-button
              link
              type="danger"
              v-ripple
              @mousedown="handleDeleteBtnMouseDown(row.id)"
              @mouseup="handleDeleteBtnMouseUp"
              @mouseleave="handleDeleteBtnMouseUp"
              @touchstart="handleDeleteBtnMouseDown(row.id)"
              @touchend="handleDeleteBtnMouseUp"
              :class="{ 'delete-btn-active': deleteBtnActiveId === row.id }"
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </HTable>
      </div>
    </el-card>

    <Teleport to="body">
      <Transition name="user-modal-scale">
        <div v-if="dialogVisible" class="user-modal-overlay" @click.self="handleOverlayClick">
          <div class="user-modal-wrapper" :style="{ width: dialogWidth }">
            <div class="user-modal-header">
              <span class="user-modal-title">{{ dialogTitle }}</span>
              <span class="user-modal-close" @click.stop="handleCancel">
                <el-icon :size="20"><Close /></el-icon>
              </span>
            </div>
            <div class="user-modal-body">
              <el-form
                ref="formRef"
                :model="formData"
                label-width="80px"
                class="user-form"
              >
                <el-form-item label="账号" prop="username">
                  <HInput
                    v-model="formData.username"
                    placeholder="请输入账号"
                    :rules="formRules.username"
                  />
                </el-form-item>
                <el-form-item label="昵称" prop="nickname">
                  <HInput
                    v-model="formData.nickname"
                    placeholder="请输入昵称"
                    :rules="formRules.nickname"
                  />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <HInput
                    v-model="formData.email"
                    type="email"
                    placeholder="请输入邮箱"
                    :rules="formRules.email"
                  />
                </el-form-item>
                <el-form-item v-if="!isEdit" label="密码" prop="password">
                  <HInput
                    v-model="formData.password"
                    type="password"
                    placeholder="请输入密码"
                    :rules="formRules.password"
                  />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                  <el-radio-group v-model="formData.status">
                    <el-radio :value="1">正常</el-radio>
                    <el-radio :value="0">已封禁</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>
            <div class="user-modal-footer">
              <el-button v-ripple @click.stop="handleCancel">取消</el-button>
              <el-button type="primary" v-ripple @click.stop="handleSubmit">确定</el-button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="toastVisible" class="success-toast" :class="{ 'toast-enter': toastVisible }">
          <div class="toast-icon">
            <el-icon :size="24"><CircleCheckFilled /></el-icon>
          </div>
          <div class="toast-content">
            <div class="toast-title">操作成功</div>
            <div class="toast-message">{{ toastMessage }}</div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus, Close, Lock, Unlock, Download, ArrowDown,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import type { TableColumn, PaginationConfig, ValidationRule, UserFormData } from '@/types'
import type { UserItem } from '@/api/user'
import HInput from '@/components/HInput/index.vue'
import HTable from '@/components/HTable/index.vue'
import BackToTop from '@/components/BackToTop/index.vue'

const router = useRouter()

interface SearchForm {
  username: string
  nickname: string
  status: number | null
}

const loading = ref(false)
const tableRef = ref()
const tableData = ref<UserItem[]>([])
const total = ref(0)
const selectedRows = ref<UserItem[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const dialogWidth = ref('520px')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const deleteBtnActiveId = ref<number | null>(null)
const selectedRowId = ref<number | null>(null)

const statusDropdownVisible = ref(false)
const exporting = ref(false)
const exportProgress = ref(0)

const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const searchForm = reactive<SearchForm>({
  username: '',
  nickname: '',
  status: null
})

const pagination = reactive<PaginationConfig>({
  page: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50, 100]
})

const columns: TableColumn[] = [
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { prop: 'username', label: '账号', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'role', label: '角色', width: 120, align: 'center' },
  { prop: 'created_at', label: '创建时间', width: 180, align: 'center' },
  { prop: 'action', label: '操作', width: 240, fixed: 'right', slot: 'action' }
]

const formData = reactive<UserFormData>({
  username: '',
  nickname: '',
  email: '',
  password: '',
  status: 1
})

const formRules: Record<string, ValidationRule[]> = {
  username: [
    { required: true, message: '请输入账号' },
    { min: 2, max: 20, message: '账号长度在 2 到 20 个字符' }
  ],
  nickname: [
    { required: true, message: '请输入昵称' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符' }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入正确的邮箱格式' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符' }
  ]
}

const mockData: UserItem[] = [
  { id: 1, username: 'admin', nickname: '系统管理员', email: 'admin@hongjing.com', status: 1, role: 'admin', created_at: '2026-06-01 10:00:00' },
  { id: 2, username: 'user001', nickname: '张三', email: 'zhangsan@hongjing.com', status: 1, role: 'user', created_at: '2026-06-02 11:30:00' },
  { id: 3, username: 'user002', nickname: '李四', email: 'lisi@hongjing.com', status: 1, role: 'user', created_at: '2026-06-03 09:15:00' },
  { id: 4, username: 'user003', nickname: '王五', email: 'wangwu@hongjing.com', status: 0, role: 'user', created_at: '2026-06-04 14:20:00' },
  { id: 5, username: 'user004', nickname: '赵六', email: 'zhaoliu@hongjing.com', status: 1, role: 'user', created_at: '2026-06-05 16:45:00' },
  { id: 6, username: 'user005', nickname: '钱七', email: 'qianqi@hongjing.com', status: 1, role: 'user', created_at: '2026-06-06 08:30:00' },
  { id: 7, username: 'user006', nickname: '孙八', email: 'sunba@hongjing.com', status: 1, role: 'user', created_at: '2026-06-07 13:10:00' },
  { id: 8, username: 'user007', nickname: '周九', email: 'zhoujiu@hongjing.com', status: 0, role: 'user', created_at: '2026-06-08 17:00:00' },
  { id: 9, username: 'user008', nickname: '吴十', email: 'wushi@hongjing.com', status: 1, role: 'user', created_at: '2026-06-09 10:25:00' },
  { id: 10, username: 'user009', nickname: '郑十一', email: 'zheng11@hongjing.com', status: 1, role: 'user', created_at: '2026-06-10 11:55:00' },
  { id: 11, username: 'user010', nickname: '王十二', email: 'wang12@hongjing.com', status: 1, role: 'user', created_at: '2026-06-11 09:00:00' },
  { id: 12, username: 'user011', nickname: '李十三', email: 'li13@hongjing.com', status: 0, role: 'user', created_at: '2026-06-12 14:30:00' }
]

const statusLabel = computed(() => {
  if (searchForm.status === null) return '全部状态'
  if (searchForm.status === 1) return '正常'
  return '已封禁'
})

const hasNormalUsers = computed(() => {
  return selectedRows.value.some(item => item.status === 1)
})

const hasBannedUsers = computed(() => {
  return selectedRows.value.some(item => item.status === 0)
})

function showSuccessToast(message: string) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

function handleDocumentClick() {
  if (statusDropdownVisible.value) {
    statusDropdownVisible.value = false
  }
}

function toggleStatusDropdown() {
  statusDropdownVisible.value = !statusDropdownVisible.value
}

function selectStatus(status: number | null) {
  searchForm.status = status
  statusDropdownVisible.value = false
  handleSearch()
}

function getFilteredData() {
  let result = [...mockData]
  
  if (searchForm.username) {
    result = result.filter(item => 
      item.username.toLowerCase().includes(searchForm.username.toLowerCase())
    )
  }
  
  if (searchForm.nickname) {
    result = result.filter(item => 
      item.nickname.toLowerCase().includes(searchForm.nickname.toLowerCase())
    )
  }
  
  if (searchForm.status !== null) {
    result = result.filter(item => item.status === searchForm.status)
  }
  
  return result
}

async function loadData() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const filteredData = getFilteredData()
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    
    tableData.value = filteredData.slice(start, end)
    total.value = filteredData.length
  } catch (error) {
    console.error('Load user list error:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.username = ''
  searchForm.nickname = ''
  searchForm.status = null
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

function handleSelectionChange(selection: any[]) {
  selectedRows.value = selection
}

function handleClearSelection() {
  tableRef.value?.clearSelection()
}

function handleRowClick(row: UserItem) {
  selectedRowId.value = row.id
}

function handleRowDblclick(row: UserItem) {
  selectedRowId.value = row.id
  router.push(`/system/user/${row.id}`)
}

function resetForm() {
  formData.username = ''
  formData.nickname = ''
  formData.email = ''
  formData.password = ''
  formData.status = 1
}

function handleAdd() {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: UserItem) {
  router.push(`/system/user/${row.id}`)
}

function handleDeleteBtnMouseDown(id: number) {
  deleteBtnActiveId.value = id
}

function handleDeleteBtnMouseUp() {
  deleteBtnActiveId.value = null
}

async function handleDelete(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = mockData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockData.splice(index, 1)
    }
    
    showSuccessToast(`已成功删除用户「${row.username}」`)
    loadData()
  } catch {
    deleteBtnActiveId.value = null
  }
}

async function handleBan(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定要封禁用户 "${row.username}" 吗？封禁后该用户将无法登录系统。`, '封禁确认', {
      confirmButtonText: '确认封禁',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = mockData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockData[index].status = 0
    }
    
    showSuccessToast(`已成功封禁用户「${row.username}」`)
    loadData()
  } catch {
  }
}

async function handleUnban(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定要解封用户 "${row.username}" 吗？`, '解封确认', {
      confirmButtonText: '确认解封',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = mockData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockData[index].status = 1
    }
    
    showSuccessToast(`已成功解封用户「${row.username}」`)
    loadData()
  } catch {
  }
}

async function handleBatchBan() {
  const normalUsers = selectedRows.value.filter(item => item.status === 1)
  if (normalUsers.length === 0) {
    ElMessage.warning('请选择正常状态的用户进行封禁')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要封禁选中的 ${normalUsers.length} 个用户吗？封禁后这些用户将无法登录系统。`,
      '批量封禁确认',
      {
        confirmButtonText: '确认封禁',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    normalUsers.forEach(user => {
      const index = mockData.findIndex(item => item.id === user.id)
      if (index > -1) {
        mockData[index].status = 0
      }
    })
    
    showSuccessToast(`已成功封禁 ${normalUsers.length} 个用户`)
    handleClearSelection()
    loadData()
  } catch {
  }
}

async function handleBatchUnban() {
  const bannedUsers = selectedRows.value.filter(item => item.status === 0)
  if (bannedUsers.length === 0) {
    ElMessage.warning('请选择已封禁状态的用户进行解封')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要解封选中的 ${bannedUsers.length} 个用户吗？`,
      '批量解封确认',
      {
        confirmButtonText: '确认解封',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    bannedUsers.forEach(user => {
      const index = mockData.findIndex(item => item.id === user.id)
      if (index > -1) {
        mockData[index].status = 1
      }
    })
    
    showSuccessToast(`已成功解封 ${bannedUsers.length} 个用户`)
    handleClearSelection()
    loadData()
  } catch {
  }
}

function handleOverlayClick() {
  handleCancel()
}

function handleCancel() {
  dialogVisible.value = false
}

function validateForm(): boolean {
  let isValid = true
  
  for (const key of Object.keys(formRules)) {
    if (isEdit.value && key === 'password') continue
    
    const value = (formData as any)[key]
    const rules = formRules[key]
    
    for (const rule of rules) {
      if (rule.required && !value) {
        ElMessage.error(rule.message || '请填写必填项')
        isValid = false
        break
      }
      
      if (value && rule.min !== undefined && String(value).length < rule.min) {
        ElMessage.error(rule.message || `最少输入 ${rule.min} 个字符`)
        isValid = false
        break
      }
      
      if (value && rule.max !== undefined && String(value).length > rule.max) {
        ElMessage.error(rule.message || `最多输入 ${rule.max} 个字符`)
        isValid = false
        break
      }
      
      if (value && rule.pattern && !rule.pattern.test(String(value))) {
        ElMessage.error(rule.message || '格式不正确')
        isValid = false
        break
      }
    }
    
    if (!isValid) break
  }
  
  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isEdit.value && editId.value) {
      const index = mockData.findIndex(item => item.id === editId.value)
      if (index > -1) {
        mockData[index] = {
          ...mockData[index],
          nickname: formData.nickname,
          email: formData.email,
          status: formData.status
        }
      }
      showSuccessToast('编辑成功')
    } else {
      const newId = Math.max(...mockData.map(item => item.id)) + 1
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      mockData.unshift({
        id: newId,
        username: formData.username,
        nickname: formData.nickname,
        email: formData.email,
        status: formData.status,
        role: 'user',
        created_at: now
      })
      showSuccessToast('新增成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('Submit error:', error)
    ElMessage.error('操作失败')
  }
}

async function handleExport() {
  const filteredData = getFilteredData()
  if (filteredData.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  
  exporting.value = true
  exportProgress.value = 0
  
  try {
    const totalSteps = 10
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      exportProgress.value = Math.round((i / totalSteps) * 100)
    }
    
    const headers = ['ID', '账号', '昵称', '邮箱', '状态', '角色', '创建时间']
    const roleMap: Record<string, string> = { admin: '超级管理员', user: '普通用户' }
    const statusMap: Record<number, string> = { 0: '已封禁', 1: '正常' }
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.id,
        item.username,
        item.nickname,
        item.email,
        statusMap[item.status] || item.status,
        roleMap[item.role] || item.role,
        item.created_at
      ].map(val => `"${val}"`).join(','))
    ].join('\n')
    
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `用户数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    showSuccessToast(`已成功导出 ${filteredData.length} 条用户数据`)
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败')
  } finally {
    setTimeout(() => {
      exporting.value = false
      exportProgress.value = 0
    }, 500)
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})
</script>

<style scoped lang="scss">
.user-manage-page {
  position: relative;

  .search-card {
    margin-bottom: 16px;

    .search-form {
      margin: 0;
    }
  }

  .custom-select-wrapper {
    position: relative;
    width: 150px;
  }

  .custom-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    font-size: 14px;
    color: #606266;
    transition: all 0.3s ease;

    &:hover {
      border-color: #c0c4cc;
    }

    &.is-focused {
      border-color: #4080FF;
      box-shadow: 0 0 0 2px rgba(64, 128, 255, 0.2);
    }

    .placeholder {
      color: #c0c4cc;
    }

    .select-arrow {
      transition: transform 0.3s ease;
      font-size: 12px;

      &.is-open {
        transform: rotate(180deg);
      }
    }
  }

  .custom-select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 3000;
    background-color: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    padding: 4px 0;
    max-height: 240px;
    overflow-y: auto;

    .select-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 14px;
      color: #606266;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f5f7fa;
      }

      &.is-active {
        color: #4080FF;
        font-weight: 500;
        background-color: #ecf5ff;
      }

      .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.status-normal {
          background-color: #00B42A;
        }

        &.status-banned {
          background-color: #F53F3F;
        }
      }
    }
  }

  .dropdown-fade-enter-active,
  .dropdown-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .dropdown-fade-enter-from,
  .dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  .table-card {
    .table-toolbar {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .toolbar-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .export-progress-wrapper {
        display: flex;
        align-items: center;
      }

      .ban-btn,
      .unban-btn,
      .export-btn {
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          transform: scale(1.03);
          box-shadow: 0 0 0 2px rgba(64, 128, 255, 0.3);
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }
      }

      .ban-btn:hover:not(:disabled) {
        box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.4);
      }

      .unban-btn:hover:not(:disabled) {
        box-shadow: 0 0 0 2px rgba(0, 180, 42, 0.4);
      }

      .export-btn:hover:not(:disabled) {
        box-shadow: 0 0 0 2px rgba(0, 180, 42, 0.4);
      }
    }
  }

  .batch-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 16px;
    background: linear-gradient(90deg, #ECF5FF 0%, #F0F7FF 100%);
    border-radius: 6px;
    border: 1px solid #D9ECFF;

    .batch-info {
      font-size: 14px;
      color: #606266;

      .batch-count {
        font-size: 18px;
        font-weight: 600;
        color: #4080FF;
        margin: 0 4px;
      }
    }

    .batch-actions {
      display: flex;
      gap: 8px;

      .ban-btn,
      .unban-btn {
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          transform: scale(1.03);
          box-shadow: 0 0 0 2px rgba(64, 128, 255, 0.3);
        }
      }

      .ban-btn:hover:not(:disabled) {
        box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.4);
      }

      .unban-btn:hover:not(:disabled) {
        box-shadow: 0 0 0 2px rgba(0, 180, 42, 0.4);
      }
    }
  }

  .batch-bar-slide-enter-active,
  .batch-bar-slide-leave-active {
    transition: all 0.3s ease;
  }

  .batch-bar-slide-enter-from,
  .batch-bar-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .skeleton-wrapper {
    width: 100%;
  }

  .skeleton-table {
    width: 100%;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .skeleton-header {
      display: flex;
      background-color: #fafafa;

      .skeleton-header-item {
        flex: 1;
        height: 48px;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 14px;
          left: 12px;
          right: 12px;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 2px;
        }
      }
    }

    .skeleton-row {
      display: flex;
      border-top: 1px solid #ebeef5;

      .skeleton-cell {
        flex: 1;
        height: 48px;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 14px;
          left: 12px;
          right: 12px;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 2px;
        }
      }
    }
  }

  .table-container {
    width: 100%;

    :deep(.el-table) {
      width: 100%;

      th.el-table__cell {
        background-color: #fafafa;
        color: #303133;
        font-weight: 600;
      }

      tr.el-table__row:hover > td {
        background-color: #E8F3FF !important;
      }

      tr.el-table__row--striped td {
        background-color: #fafafa;
      }

      tr.el-table__row--striped:hover > td {
        background-color: #E8F3FF !important;
      }

      .el-table__empty-block {
        min-height: 200px;
      }
    }

    :deep(.el-tag.tag-banned) {
      --el-tag-border-color: #F53F3F;
      --el-tag-text-color: #F53F3F;
      --el-tag-bg-color: rgba(245, 63, 63, 0.1);
      font-weight: 500;
    }

    :deep(.el-button--text.action-ban-btn) {
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.08);
        filter: drop-shadow(0 0 3px rgba(230, 162, 60, 0.6));
      }
    }

    :deep(.el-button--text.action-unban-btn) {
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.08);
        filter: drop-shadow(0 0 3px rgba(0, 180, 42, 0.6));
      }
    }

    :deep(.el-button--text.delete-btn-active) {
      transform: translateY(2px) !important;
      color: #E5E6EB !important;
    }
  }

  :deep(.el-button--text) {
    transition: all 0.15s ease;
  }
}

.user-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.user-modal-wrapper {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.user-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;

  .user-modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .user-modal-close {
    cursor: pointer;
    color: #909399;
    transition: color 0.3s;
    line-height: 1;

    &:hover {
      color: #4080FF;
    }
  }
}

.user-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.user-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
}

.user-modal-scale-enter-active,
.user-modal-scale-leave-active {
  transition: opacity 0.3s ease;

  .user-modal-wrapper {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.user-modal-scale-enter-from,
.user-modal-scale-leave-to {
  opacity: 0;

  .user-modal-wrapper {
    transform: scale(0.9);
    opacity: 0;
  }
}

.success-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #00B42A 0%, #00A870 100%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 180, 42, 0.35);
  color: #fff;
  min-width: 300px;
  max-width: 480px;

  .toast-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-content {
    flex: 1;
    overflow: hidden;

    .toast-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 13px;
      opacity: 0.95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.toast-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
