<template>
  <div class="system-user-page">
    <FinFilter
      ref="filterRef"
      :filters="filterConfig"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="table-wrapper">
      <div class="toolbar">
        <el-button
          v-permission="'system:user:add'"
          type="primary"
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button
          v-permission="'system:user:batchDelete'"
          type="danger"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>

      <FinTable
        :columns="tableColumns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :selection="true"
        :show-index="true"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #status="{ row }">
          <el-tag :type="USER_STATUS_COLORS[row.status]">
            {{ USER_STATUS_LABELS[row.status] }}
          </el-tag>
        </template>

        <template #lastLoginTime="{ row }">
          {{ row.lastLoginTime || '-' }}
        </template>

        <template #lastLoginIp="{ row }">
          {{ row.lastLoginIp || '-' }}
        </template>

        <template #action="{ row }">
          <el-button type="primary" link @click="handleView(row)">
            查看
          </el-button>
          <el-button type="primary" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button
            v-permission="'system:user:assignRole'"
            type="primary"
            link
            @click="handleAssignRole(row)"
          >
            分配角色
          </el-button>
          <el-button
            v-permission="'system:user:resetPassword'"
            type="warning"
            link
            @click="handleResetPassword(row)"
          >
            重置密码
          </el-button>
          <el-button
            v-permission="'system:user:toggleStatus'"
            :type="row.status === 1 ? 'danger' : 'success'"
            link
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </FinTable>
    </div>

    <FinDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      :loading="dialogLoading"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    >
      <el-form
        v-if="dialogType === 'add' || dialogType === 'edit' || dialogType === 'view'"
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            :disabled="dialogType === 'view' || dialogType === 'edit'"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input
            v-model="formData.realName"
            :disabled="dialogType === 'view'"
            placeholder="请输入姓名"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="formData.phone"
            :disabled="dialogType === 'view'"
            placeholder="请输入手机号"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            :disabled="dialogType === 'view'"
            placeholder="请输入邮箱"
          />
        </el-form-item>
        <el-form-item v-if="dialogType === 'add'" label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status" :disabled="dialogType === 'view'">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div v-if="dialogType === 'assignRole'" class="assign-role-content">
        <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAllChange"
        >
          全选
        </el-checkbox>
        <el-divider />
        <el-checkbox-group
          v-model="checkedRoles"
          @change="handleCheckedRolesChange"
        >
          <el-checkbox
            v-for="role in roleList"
            :key="role.id"
            :value="role.id"
            class="role-checkbox"
          >
            {{ role.roleName }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <el-form
        v-if="dialogType === 'resetPassword'"
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/hooks/usePermission'
import { USER_STATUS_LABELS, USER_STATUS_COLORS } from '@/constants/dictionaries'
import * as userApi from '@/api/user'
import * as roleApi from '@/api/role'
import type { IUserInfo, IRole } from '@/types/api'

const { hasPerm } = usePermission()

const filterRef = ref()
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const loading = ref(false)
const tableData = ref<IUserInfo[]>([])
const selectedIds = ref<number[]>([])

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: 20,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

const filterConfig = [
  {
    prop: 'keyword',
    label: '关键字',
    type: 'input',
    placeholder: '用户名/姓名/手机号'
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 }
    ]
  }
]

const tableColumns = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'realName', label: '姓名', minWidth: 100 },
  { prop: 'phone', label: '手机号', minWidth: 130 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' },
  { prop: 'lastLoginTime', label: '最后登录时间', minWidth: 180, slot: 'lastLoginTime' },
  { prop: 'lastLoginIp', label: '最后登录IP', minWidth: 130, slot: 'lastLoginIp' },
  { prop: 'createdAt', label: '创建时间', minWidth: 180, type: 'datetime' }
]

const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogType = ref<'add' | 'edit' | 'view' | 'assignRole' | 'resetPassword'>('add')
const currentUser = ref<IUserInfo | null>(null)

const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    add: '新增用户',
    edit: '编辑用户',
    view: '查看用户',
    assignRole: '分配角色',
    resetPassword: '重置密码'
  }
  return titles[dialogType.value]
})

const dialogWidth = computed(() => {
  return dialogType.value === 'assignRole' ? '600px' : '500px'
})

const formData = reactive<Partial<IUserInfo>>({
  username: '',
  realName: '',
  phone: '',
  email: '',
  password: '',
  status: 1
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const roleList = ref<IRole[]>([])
const checkedRoles = ref<number[]>([])
const checkAll = ref(false)
const isIndeterminate = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterRef.value?.formData
    }
    const res = await userApi.getList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function fetchRoleList() {
  try {
    const res = await roleApi.getList({ page: 1, pageSize: 1000 })
    roleList.value = res.data.list
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  pagination.page = 1
  fetchList()
}

function handleSelectionChange(selection: IUserInfo[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchList()
}

function resetForm() {
  Object.assign(formData, {
    username: '',
    realName: '',
    phone: '',
    email: '',
    password: '',
    status: 1
  })
  formRef.value?.clearValidate()
}

function handleAdd() {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

async function handleView(row: IUserInfo) {
  dialogType.value = 'view'
  currentUser.value = row
  const res = await userApi.getById(row.id)
  Object.assign(formData, res.data)
  dialogVisible.value = true
}

async function handleEdit(row: IUserInfo) {
  dialogType.value = 'edit'
  currentUser.value = row
  const res = await userApi.getById(row.id)
  Object.assign(formData, res.data)
  formData.password = ''
  dialogVisible.value = true
}

async function handleAssignRole(row: IUserInfo) {
  dialogType.value = 'assignRole'
  currentUser.value = row
  await fetchRoleList()
  const res = await userApi.getUserRoles(row.id)
  checkedRoles.value = res.data
  updateCheckAllStatus()
  dialogVisible.value = true
}

function handleResetPassword(row: IUserInfo) {
  dialogType.value = 'resetPassword'
  currentUser.value = row
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleToggleStatus(row: IUserInfo) {
  const action = row.status === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
      type: 'warning'
    })
    await userApi.toggleStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success(`${action}成功`)
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}失败:`, error)
    }
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个用户吗？`, '提示', {
      type: 'warning'
    })
    await userApi.batchRemove(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

function handleCheckAllChange(val: boolean) {
  checkedRoles.value = val ? roleList.value.map((r) => r.id) : []
  isIndeterminate.value = false
}

function handleCheckedRolesChange() {
  updateCheckAllStatus()
}

function updateCheckAllStatus() {
  const checkedCount = checkedRoles.value.length
  const totalCount = roleList.value.length
  checkAll.value = checkedCount === totalCount && totalCount > 0
  isIndeterminate.value = checkedCount > 0 && checkedCount < totalCount
}

async function handleDialogConfirm() {
  if (dialogType.value === 'add') {
    await formRef.value?.validate()
    dialogLoading.value = true
    try {
      await userApi.create(formData)
      ElMessage.success('新增成功')
      dialogVisible.value = false
      fetchList()
    } catch (error) {
      console.error('新增失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else if (dialogType.value === 'edit') {
    await formRef.value?.validate()
    dialogLoading.value = true
    try {
      const { password, ...data } = formData
      await userApi.update(currentUser.value!.id, data)
      ElMessage.success('编辑成功')
      dialogVisible.value = false
      fetchList()
    } catch (error) {
      console.error('编辑失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else if (dialogType.value === 'assignRole') {
    dialogLoading.value = true
    try {
      await userApi.assignRoles(currentUser.value!.id, checkedRoles.value)
      ElMessage.success('分配角色成功')
      dialogVisible.value = false
    } catch (error) {
      console.error('分配角色失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else if (dialogType.value === 'resetPassword') {
    await passwordFormRef.value?.validate()
    dialogLoading.value = true
    try {
      await userApi.resetPassword(currentUser.value!.id, passwordForm.password)
      ElMessage.success('重置密码成功')
      dialogVisible.value = false
    } catch (error) {
      console.error('重置密码失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else {
    dialogVisible.value = false
  }
}

function handleDialogCancel() {
  dialogVisible.value = false
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.system-user-page {
  padding: 20px;

  .table-wrapper {
    background-color: #fff;
    border-radius: 4px;
    padding: 20px;

    .toolbar {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
    }
  }

  .assign-role-content {
    .role-checkbox {
      width: 30%;
      margin-bottom: 12px;
    }
  }
}
</style>
