<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
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
  type UserQuery
} from '@/api/user'

const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<UserQuery> = {
  username: '',
  status: undefined,
  keyword: ''
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
  handleReset,
  handleRefresh,
  handlePageChange,
  handleSelectionChange
} = useTable<UserVO, UserQuery>(getUserList, initialQuery)

const modal = useModal<{
  id?: number
  username: string
  nickname: string
  password: string
  phone: string
  email: string
  avatar: string
  status: number
}>({
  username: '',
  nickname: '',
  password: '',
  phone: '',
  email: '',
  avatar: '',
  status: 1
})

const isEdit = ref(false)
const formRef = ref<FormInstance>()

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [
    { validator: (_rule, value, cb) => {
      if (!isEdit.value && !value) {
        cb(new Error('请输入密码'))
      } else {
        cb()
      }
    }, trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }]
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
    status: row.status
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
  const ok = await confirmDelete()
  if (!ok) return
  await deleteUser([row.id])
  ElMessage.success('删除成功')
  handleRefresh()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条用户数据吗？`)
  if (!ok) return
  await deleteUser(selectedIds.value)
  ElMessage.success('批量删除成功')
  handleRefresh()
}

async function handleStatusChange(row: UserVO, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  const ok = await confirm(`确定要${action}用户「${row.username}」吗？`, '状态确认')
  if (!ok) {
    row.status = row.status === 1 ? 0 : 1
    return
  }
  await updateUserStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  handleRefresh()
}

async function handleBatchStatus(status: number) {
  if (selectedIds.value.length === 0) return
  const action = status === 1 ? '启用' : '禁用'
  const ok = await confirm(`确定要${action}选中的 ${selectedIds.value.length} 个用户吗？`, '批量操作确认')
  if (!ok) return
  await batchUpdateUserStatus(selectedIds.value, status)
  ElMessage.success(`批量${action}成功`)
  handleRefresh()
}
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form
        :model="queryForm"
        label-width="80px"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
      </div>

      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="primary" plain @click="handleBatchStatus(1)">
          批量启用
        </el-button>
        <el-button type="warning" plain @click="handleBatchStatus(0)">
          批量禁用
        </el-button>
        <el-button type="danger" plain @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="10" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <el-table
          v-else
          :data="list"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" :reserve-selection="false" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="nickname" label="昵称" width="120" />
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :size="36" :src="row.avatar" />
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机" width="140" />
          <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-switch
                :model-value="(row as UserVO).status === 1"
                active-text="启用"
                inactive-text="禁用"
                @change="(val: string | number | boolean) => handleStatusChange(row as UserVO, val ? 1 : 0)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="publishCount" label="发布数" width="100" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row as UserVO)">编辑</el-button>
              <el-button
                :type="(row as UserVO).status === 1 ? 'warning' : 'success'"
                link
                @click="handleStatusChange(row as UserVO, (row as UserVO).status === 1 ? 0 : 1)"
              >
                {{ (row as UserVO).status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" link @click="handleDelete(row as UserVO)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <Pagination
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>
    </el-card>

    <ModalDialog
      v-model="modal.visible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :loading="submitLoading"
      width="560px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="80px"
        :disabled="submitLoading"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="modal.formData.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="modal.formData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="modal.formData.password"
            type="password"
            :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="modal.formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="modal.formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="头像URL" prop="avatar">
          <el-input v-model="modal.formData.avatar" placeholder="请输入头像URL" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="modal.formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </ModalDialog>
  </div>
</template>

<style lang="scss" scoped>
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
</style>
