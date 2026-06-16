<template>
  <div class="ccb-system-user">
    <CcbPageHeader
      title="用户管理"
      description="管理系统用户账号、角色分配与状态"
      icon="User"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
      </el-form-item>
      <el-form-item label="姓名" prop="realName">
        <el-input v-model="searchForm.realName" placeholder="请输入姓名" clearable />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
        <el-button type="danger" :icon="Delete" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="姓名" width="100" />
      <el-table-column prop="orgName" label="所属机构" min-width="150" />
      <el-table-column prop="roleNames" label="角色" min-width="150">
        <template #default="{ row }">
          <el-tag
            v-for="(role, idx) in (row.roleNames || '').split(',')"
            :key="idx"
            type="primary"
            effect="light"
            size="small"
            style="margin-right: 4px"
          >
            {{ role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="手机号" width="130">
        <template #default="{ row }">
          {{ maskPhone(row.phone) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginTime" label="最后登录" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.lastLoginTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleDisable(row)">禁用</el-button>
          <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CcbTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { maskPhone, formatDateTime } from '@utils'
import type { User } from '@types/business'

const loading = ref<boolean>(false)
const tableData = ref<User[]>([])
const total = ref<number>(0)
const selectedRows = ref<User[]>([])

const searchForm = reactive({
  username: '',
  realName: '',
  status: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const mockUsers: User[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  username: `user${i + 1}`,
  realName: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][i % 8],
  avatar: '',
  email: `user${i + 1}@ccb.com`,
  phone: `138${String(10000000 + i).padStart(8, '0')}`,
  orgId: i % 4 + 1,
  orgName: ['总行营业部', '北京分行', '上海分行', '深圳分行'][i % 4],
  roleIds: [i % 3 + 1],
  roleNames: ['管理员,运营主管', '运营主管,审核员', '操作员', '审核员'][i % 4],
  status: i % 3 === 0 ? 0 : 1,
  lastLoginTime: '2024-06-16 09:30:00',
  remark: '',
  createdAt: '2024-01-01 00:00:00',
  updatedAt: '2024-06-16 00:00:00'
}))

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockUsers.slice(start, end)
    total.value = mockUsers.length
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as User[]
}

const handleAdd = (): void => {
  ElMessage.info('新增用户功能')
}

const handleView = (row: User): void => {
  ElMessage.info(`查看用户：${row.username}`)
}

const handleEdit = (row: User): void => {
  ElMessage.info(`编辑用户：${row.username}`)
}

const handleDisable = async (row: User): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要禁用用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('禁用成功')
    fetchData()
  } catch {}
}

const handleEnable = async (row: User): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要启用用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('启用成功')
    fetchData()
  } catch {}
}

const handleDelete = async (row: User): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

const handleBatchDelete = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个用户吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    ElMessage.success('批量删除成功')
    fetchData()
  } catch {}
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-system-user {
}
</style>
