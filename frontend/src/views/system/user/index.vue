<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { USER_STATUS, getEnumOptions, getEnumLabel, getEnumItem, ROLE_CODE } from '@/constants/enums'
import {
  getUserListApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  batchDeleteUsersApi,
  updateUserStatusApi,
} from '@/api/user'
import { getAllRolesApi } from '@/api/role'
import type { UserItem, RoleItem } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<UserItem[]>([])
const total = ref(0)
const roleList = ref<Array<{ id: number; code: string; name: string }>>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  roleId: null as number | null,
  status: null as number | null,
})

const loadRoles = async () => {
  try {
    roleList.value = await getAllRolesApi()
  } catch {
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const result = await getUserListApi({ ...queryParams })
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.roleId = null
  queryParams.status = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()

const formData = reactive<Partial<UserItem>>({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  avatar: '',
  roleId: undefined,
  department: '',
  status: 1,
  remark: '',
})

const formRules = computed(() => {
  const rules: any = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 50, message: '用户名长度3-50位', trigger: 'blur' },
    ],
    roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  }
  if (dialogMode.value === 'create') {
    rules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 50, message: '密码长度6-50位', trigger: 'blur' },
    ]
  }
  return rules
})

const openDialog = (mode: 'create' | 'edit' | 'view', row?: UserItem) => {
  dialogMode.value = mode
  if (row) {
    Object.assign(formData, row)
  } else {
    Object.assign(formData, {
      username: '',
      password: '',
      realName: '',
      email: '',
      phone: '',
      avatar: '',
      roleId: undefined,
      department: '',
      status: 1,
      remark: '',
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createUserApi(formData)
      ElMessage.success('创建成功')
    } else {
      await updateUserApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: UserItem) => {
  await ElMessageBox.confirm('确定要删除该用户吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteUserApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const selectedRows = ref<UserItem[]>([])
const handleSelectionChange = (rows: UserItem[]) => {
  selectedRows.value = rows
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个用户吗？`, '提示', { type: 'warning' })
  loading.value = true
  try {
    await batchDeleteUsersApi(selectedRows.value.map((r) => r.id))
    ElMessage.success('批量删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (row: UserItem, status: number) => {
  loading.value = true
  try {
    await updateUserStatusApi(row.id, status)
    ElMessage.success('状态更新成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'username', label: '用户名', width: 130 },
  { prop: 'realName', label: '姓名', width: 110 },
  {
    label: '角色',
    width: 130,
    align: 'center',
    slot: 'role',
  },
  { prop: 'department', label: '部门', width: 120 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'email', label: '邮箱', width: 180, showOverflowTooltip: true },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    slot: 'status',
  },
  {
    prop: 'lastLoginAt',
    label: '最后登录',
    width: 170,
    align: 'center',
    slot: 'lastLogin',
  },
  { label: '操作', width: 180, fixed: 'right', align: 'center', slot: 'actions' },
]

const userStatusOptions = computed(() => getEnumOptions(USER_STATUS))

onMounted(() => {
  loadRoles()
  loadData()
})
</script>

<template>
  <div class="user-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="用户名/姓名/邮箱/手机号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="queryParams.roleId"
            placeholder="全部角色"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in userStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-batch-actions="true"
        :selected-count="selectedRows.length"
        @create="openDialog('create')"
        @refresh="loadData"
        @batch-delete="handleBatchDelete"
        create-text="新增用户"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :selection="true"
        :index="true"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #role="{ row }">
          <el-tag size="small" :type="row.role?.code === ROLE_CODE.SUPER_ADMIN ? 'danger' : 'primary'">
            {{ row.role?.name }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="getEnumItem(USER_STATUS, row.status)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(USER_STATUS, row.status) }}
          </el-tag>
        </template>

        <template #lastLogin="{ row }">
          <div style="font-size: 12px; line-height: 1.5">
            <div v-if="row.lastLoginAt">{{ formatDate(row.lastLoginAt, 'YYYY-MM-DD HH:mm') }}</div>
            <div style="color: #909399" v-else>从未登录</div>
            <div style="color: #909399" v-if="row.lastLoginIp">IP: {{ row.lastLoginIp }}</div>
          </div>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
          <el-dropdown
            trigger="click"
            @command="(cmd: number) => handleStatusChange(row, cmd)"
          >
            <el-button type="primary" link>
              状态
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in userStatusOptions"
                  :key="item.value"
                  :command="item.value"
                >
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增用户' : dialogMode === 'edit' ? '编辑用户' : '用户详情'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formData.username"
                :disabled="dialogMode !== 'create'"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                show-password
                :placeholder="dialogMode === 'create' ? '请输入密码' : '留空则不修改'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleId">
              <el-select v-model="formData.roleId" placeholder="请选择角色" style="width: 100%">
                <el-option
                  v-for="role in roleList"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门">
              <el-input v-model="formData.department" placeholder="请输入部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="备注信息" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
