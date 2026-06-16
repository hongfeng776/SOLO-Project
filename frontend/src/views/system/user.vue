<template>
  <div class="system-user">
    <CommonTable
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      :show-selection="true"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </template>

      <el-table-column label="用户信息" width="200">
        <template #default="{ row }">
          <div class="user-info">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.nickname?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ row.nickname }}</div>
              <div class="username">{{ row.username }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="roleName" label="角色" width="120" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small">编辑</el-button>
          <el-button type="warning" link size="small">重置密码</el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import { getUserListApi } from '@/api/user'
import { formatDate } from '@/utils/format'
import type { User } from '@/types/user'

const loading = ref(false)
const tableData = ref<User[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  username: '',
  nickname: '',
  status: undefined as number | undefined
})

const searchFields = [
  { prop: 'username', label: '用户名', type: 'input' },
  { prop: 'nickname', label: '昵称', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 1, label: '启用' },
    { value: 0, label: '禁用' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getUserListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  getList()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleAdd = () => {
  ElMessage.info('新增用户功能开发中')
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.system-user {
  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .info {
      .name {
        font-weight: 500;
        color: #303133;
      }

      .username {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}
</style>
