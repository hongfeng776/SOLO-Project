<template>
  <div class="page-container">
    <ProTable
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchUserList"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
    >
      <template #avatar="{ row }">
        <el-avatar :src="row.avatar" :size="36" />
      </template>
      <template #status="{ row }">
        <el-tag :type="UserStatusMap[row.status]?.type">
          {{ UserStatusMap[row.status]?.label }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="primary" @click="handleResetPwd(row)">重置密码</el-button>
        <el-button link type="danger" @click="handleToggleStatus(row)">
          {{ row.status === 1 ? '禁用' : '启用' }}
        </el-button>
      </template>
    </ProTable>

    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :mode="dialogMode"
      :form-items="formItems"
      :initial-data="currentRow"
      :rules="formRules"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormRules } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import FormDialog from '@/components/FormDialog/index.vue'
import { UserStatusMap } from '@/types/business'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUser,
  updateUserStatus,
  resetUserPassword,
  type User
} from '@/api/user'
import type { PageResult } from '@/types/api'

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<User>>({})

const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增用户' : '编辑用户')

const searchColumns = [
  { prop: 'username', label: '用户名', type: 'input' as const },
  { prop: 'phone', label: '手机号', type: 'input' as const },
  { prop: 'status', label: '用户状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ]}
] as const

const tableColumns = [
  { prop: 'avatar', label: '头像', width: 80, align: 'center', slot: 'avatar' },
  { prop: 'username', label: '用户名', width: 120 },
  { prop: 'nickname', label: '昵称', width: 120 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'email', label: '邮箱', width: 180 },
  { prop: 'levelName', label: '等级', width: 100 },
  { prop: 'totalOrders', label: '订单数', width: 90, align: 'center' },
  { prop: 'totalAmount', label: '累计消费', width: 120, align: 'right', type: 'amount' as const },
  { prop: 'status', label: '状态', width: 80, align: 'center', slot: 'status' },
  { prop: 'createdAt', label: '注册时间', width: 180, align: 'center', type: 'datetime' as const }
] as const

const formItems = [
  { prop: 'username', label: '用户名', placeholder: '请输入用户名' },
  { prop: 'password', label: '密码', type: 'input' as const, inputType: 'password', placeholder: '请输入密码' },
  { prop: 'nickname', label: '昵称', placeholder: '请输入昵称' },
  { prop: 'phone', label: '手机号', placeholder: '请输入手机号' },
  { prop: 'email', label: '邮箱', placeholder: '请输入邮箱' },
  { prop: 'status', label: '用户状态', type: 'radio' as const, options: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ]}
] as const

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

const fetchUserList = async (params: Record<string, unknown>): Promise<PageResult<User>> => {
  const res = await getUserList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = {}
  dialogVisible.value = true
}

const handleEdit = (row: Record<string, unknown>) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row } as unknown as User
  dialogVisible.value = true
}

const handleDelete = async (row: Record<string, unknown>) => {
  await deleteUser(row.id as number)
}

const handleBatchDelete = async (ids: (string | number)[]) => {
  await batchDeleteUser(ids as number[])
}

const handleToggleStatus = async (row: Record<string, unknown>) => {
  const newStatus = row.status === 1 ? 0 : 1
  await updateUserStatus(row.id as number, newStatus)
  ElMessage.success(newStatus === 1 ? '已启用' : '已禁用')
}

const handleResetPwd = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm(`确定要重置用户 ${row.username} 的密码吗？`, '提示', { type: 'warning' })
    await resetUserPassword(row.id as number, '123456')
    ElMessage.success('密码已重置为 123456')
  } catch {
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  if (dialogMode.value === 'add') {
    await createUser(data as Partial<User> & { password: string })
  } else {
    await updateUser(currentRow.value.id!, data as Partial<User>)
  }
}
</script>
