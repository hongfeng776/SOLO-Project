<template>
  <div class="user-manage-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
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
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
          class="action-btn"
        >
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>

      <div v-if="loading" class="skeleton-wrapper">
        <div class="skeleton-table">
          <div class="skeleton-header">
            <div v-for="i in 7" :key="i" class="skeleton-header-item"></div>
          </div>
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div v-for="j in 7" :key="j" class="skeleton-cell"></div>
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
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small" effect="light">
              {{ row.status === 1 ? '启用' : '禁用' }}
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
                    <el-radio :value="1">启用</el-radio>
                    <el-radio :value="0">禁用</el-radio>
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

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Close, Delete } from '@element-plus/icons-vue'
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
  { prop: 'created_at', label: '创建时间', width: 180, align: 'center' },
  { prop: 'action', label: '操作', width: 160, fixed: 'right', slot: 'action' }
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
    await new Promise(resolve => setTimeout(resolve, 600))
    
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
    
    ElMessage.success('删除成功')
    loadData()
  } catch {
    deleteBtnActiveId.value = null
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
      ElMessage.success('编辑成功')
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
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('Submit error:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.user-manage-page {
  .search-card {
    margin-bottom: 16px;

    .search-form {
      margin: 0;
    }
  }

  .table-card {
    .table-toolbar {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
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

    :deep(.el-button--text.delete-btn-active) {
      transform: translateY(2px);
      color: #E5E6EB !important;
    }
  }

  :deep(.el-button--text) {
    transition: all 0.1s ease;
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

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
