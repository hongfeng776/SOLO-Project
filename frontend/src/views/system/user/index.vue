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
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
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
          v-permission="'system:user:add'"
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button
          type="danger"
          v-ripple
          v-permission="'system:user:delete'"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>

      <HTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :total="total"
        :show-selection="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
      >
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button
            link
            type="primary"
            v-ripple
            v-permission="'system:user:view'"
            @click="handleView(row)"
          >
            查看
          </el-button>
          <el-button
            link
            type="primary"
            v-ripple
            v-permission="'system:user:edit'"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            v-ripple
            v-permission="'system:user:delete'"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </HTable>
    </el-card>

    <HModal
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="formData"
        label-width="80px"
        class="user-form"
      >
        <el-form-item label="用户名" prop="username">
          <HInput
            v-model="formData.username"
            placeholder="请输入用户名"
            :rules="formRules.username"
            :disabled="isView"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <HInput
            v-model="formData.nickname"
            placeholder="请输入昵称"
            :rules="formRules.nickname"
            :disabled="isView"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <HInput
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            :rules="formRules.email"
            :disabled="isView"
          />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <HInput
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            :rules="formRules.password"
            :disabled="isView"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status" :disabled="isView">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </HModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { TableColumn, PaginationConfig, ValidationRule, UserFormData } from '@/types'
import type { UserItem } from '@/api/user'

interface SearchForm {
  username: string
  nickname: string
  status: number | null
}

const loading = ref(false)
const tableData = ref<UserItem[]>([])
const total = ref(0)
const selectedRows = ref<UserItem[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isView = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)

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
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'created_at', label: '创建时间', minWidth: 180 },
  { prop: 'action', label: '操作', width: 200, fixed: 'right', slot: 'action' }
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
    { required: true, message: '请输入用户名' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符' }
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
  { id: 10, username: 'user009', nickname: '郑十一', email: 'zheng11@hongjing.com', status: 1, role: 'user', created_at: '2026-06-10 11:55:00' }
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
    await new Promise(resolve => setTimeout(resolve, 500))
    
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

function resetForm() {
  formData.username = ''
  formData.nickname = ''
  formData.email = ''
  formData.password = ''
  formData.status = 1
}

function handleAdd() {
  dialogTitle.value = '新增用户'
  isView.value = false
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

function handleView(row: UserItem) {
  dialogTitle.value = '查看用户'
  isView.value = true
  isEdit.value = false
  editId.value = row.id
  Object.assign(formData, {
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    password: '',
    status: row.status
  })
  dialogVisible.value = true
}

function handleEdit(row: UserItem) {
  dialogTitle.value = '编辑用户'
  isView.value = false
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    password: '',
    status: row.status
  })
  dialogVisible.value = true
}

async function handleDelete(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('删除成功')
    loadData()
  } catch {
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个用户吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('批量删除成功')
    loadData()
  } catch {
  }
}

async function handleSubmit() {
  if (isView.value) {
    dialogVisible.value = false
    return
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isEdit.value) {
      ElMessage.success('编辑成功')
    } else {
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
}
</style>
