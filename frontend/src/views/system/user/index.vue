<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="用户名/昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户管理</span>
          <Permission :role="'admin'">
            <el-button type="primary" :icon="Plus" @click="openForm()">新增用户</el-button>
          </Permission>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
      >
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
              <div class="info-text">
                <div class="user-name">
                  {{ row.nickname }}
                  <el-tag v-if="row.username === 'admin'" size="small" type="danger" effect="light">超级管理员</el-tag>
                </div>
                <div class="username">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles?.slice(0, 3)"
              :key="role.id"
              size="small"
              effect="plain"
              class="mr-5"
            >
              {{ role.name }}
            </el-tag>
            <el-tag v-if="row.roles?.length > 3" size="small" type="info" effect="plain">
              +{{ row.roles.length - 3 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              :disabled="row.username === 'admin'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openForm(row)">编辑</el-button>
            <el-button
              v-if="row.username !== 'admin'"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="560px"
      destroy-on-close
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" :disabled="isEdit" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="!isEdit" label="密码" prop="password">
              <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="分配角色" prop="roleIds">
              <el-select
                v-model="formData.roleIds"
                multiple
                placeholder="请选择角色"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="role in allRoles"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getUserList, createUser, updateUser, deleteUser, getAllRoles } from '@api/system'
import type { SystemUser, Role } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import Permission from '@components/Permission/index.vue'

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<SystemUser, { username?: string; status?: number }>({
  fetchApi: getUserList,
  defaultParams: { username: '', status: undefined }
})

const allRoles = ref<Role[]>([])

onMounted(async () => {
  try {
    allRoles.value = await getAllRoles()
  } catch (error) {
    console.error(error)
  }
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()

const defaultFormData = (): Partial<SystemUser> & { password?: string; roleIds: number[] } => ({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  status: 1,
  roleIds: []
})

const formData = reactive(defaultFormData())

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  roleIds: [{ required: true, type: 'array', message: '请选择角色', trigger: 'change' }]
}

const openForm = (row?: SystemUser) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, {
      ...row,
      password: '',
      roleIds: row.roleIds || row.roles?.map((r) => r.id) || []
    })
  } else {
    Object.assign(formData, defaultFormData())
  }
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
}

const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateUser(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createUser(formData as Partial<SystemUser> & { password: string; roleIds: number[] })
      ElMessage.success('创建成功')
    }
    handleClose()
    fetchData()
  } finally {
    formLoading.value = false
  }
}

const handleStatusChange = async (row: SystemUser) => {
  try {
    await updateUser(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error(error)
    row.status = row.status === 1 ? 0 : 1
  }
}

const handleDelete = async (row: SystemUser) => {
  try {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .info-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-name {
    font-weight: 600;
    color: $text-primary;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .username {
    font-size: 12px;
    color: $text-secondary;
  }

  .mr-5 {
    margin-right: 5px;
    margin-bottom: 2px;
  }
}
</style>
