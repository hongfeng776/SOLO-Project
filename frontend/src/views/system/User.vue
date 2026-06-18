<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>用户基础信息管控</h2>
      <div>
        <el-button type="success" :icon="Key" :disabled="selectedIds.length === 0" @click="batchPermDialogVisible = true">
          批量权限配置
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名/手机号/身份证/姓名"
            clearable
            style="width: 220px;"
          />
        </el-form-item>
        <el-form-item label="用户等级">
          <el-select v-model="searchForm.userLevel" placeholder="全部等级" clearable style="width: 140px;">
            <el-option
              v-for="item in userLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="注册渠道">
          <el-select v-model="searchForm.registerChannel" placeholder="全部渠道" clearable style="width: 140px;">
            <el-option
              v-for="item in registerChannelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px;">
            <el-option
              v-for="item in userStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="异常用户">
          <el-select v-model="searchForm.isAbnormal" placeholder="全部" clearable style="width: 120px;">
            <el-option label="正常用户" :value="0" />
            <el-option label="异常用户" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Search" @click="handleTrace">溯源查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <UserBatchToolbar
      :selected-ids="selectedIds"
      :selected-rows="selectedRows"
      @success="fetchData"
      @clear="handleClearSelection"
    />

    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        @selection-change="handleSelectionChange"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="110" />
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column label="等级" width="100">
          <template #default="{ row }">
            <span :class="['user-level-tag', `level-${getLevelClass(row.userLevel)}`]">
              {{ getLevelLabel(row.userLevel) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['user-status-tag', `status-${getStatusClass(row.status)}`]">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="注册渠道" width="100">
          <template #default="{ row }">
            {{ getChannelLabel(row.registerChannel) }}
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <div class="tag-list">
              <el-tag
                v-for="tag in getRowTags(row)"
                :key="tag.value"
                size="small"
                :style="{ borderColor: tag.color + '50', color: tag.color, background: tag.color + '10' }"
                class="user-tag"
              >
                {{ tag.label }}
              </el-tag>
              <span v-if="row.isAbnormal" class="abnormal-badge">
                <el-icon><Warning /></el-icon>
                异常
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170" />
        <el-table-column label="操作" width="320" fixed="right" class-name="action-buttons">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="success" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="handlePermission(row)">权限配置</el-button>
            <el-button
              v-if="row.status !== 2"
              type="warning"
              link
              size="small"
              @click="handleFreeze(row)"
            >
              冻结
            </el-button>
            <el-button
              v-else
              type="info"
              link
              size="small"
              @click="handleUnfreeze(row)"
            >
              解冻
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <UserEditDialog
      v-model="editDialogVisible"
      :user-data="currentUser"
      :role-options="roleOptions"
      @success="fetchData"
    />

    <UserDetailDialog
      v-model="detailDialogVisible"
      :user-id="currentUserId"
    />

    <PermissionConfigDialog
      v-model="permissionDialogVisible"
      :user-id="currentPermissionUserId"
      :user-data="currentPermissionUser"
      @success="handlePermissionSuccess"
    />

    <el-dialog
      v-model="batchPermDialogVisible"
      title="批量权限配置"
      width="720px"
      :close-on-click-modal="false"
    >
      <PermissionBatchPanel
        :selected-ids="selectedIds"
        :selected-rows="selectedRows"
        @success="handleBatchPermSuccess"
        @cancel="batchPermDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Warning, Key } from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  UserStatusEnum,
  RegisterChannelEnum,
  UserTagOptions,
  getEnumOptions,
  getEnumLabel
} from '@/utils/enums'
import {
  getUserList,
  deleteUser,
  updateUserStatus,
  traceUser
} from '@/api/user'
import UserEditDialog from '@/components/User/UserEditDialog.vue'
import UserDetailDialog from '@/components/User/UserDetailDialog.vue'
import UserBatchToolbar from '@/components/User/UserBatchToolbar.vue'
import PermissionConfigDialog from '@/components/Permission/PermissionConfigDialog.vue'
import PermissionBatchPanel from '@/components/Permission/PermissionBatchPanel.vue'

const loading = ref(false)
const editDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const batchPermDialogVisible = ref(false)
const currentUser = ref(null)
const currentUserId = ref(null)
const currentPermissionUserId = ref(null)
const currentPermissionUser = ref(null)
const selectedIds = ref([])
const selectedRows = ref([])
const listFadeKey = ref(0)

const searchForm = reactive({
  keyword: '',
  userLevel: null,
  registerChannel: '',
  status: null,
  isAbnormal: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const userLevelOptions = getEnumOptions(UserLevelEnum)
const registerChannelOptions = getEnumOptions(RegisterChannelEnum)
const userStatusOptions = getEnumOptions(UserStatusEnum)

const roleOptions = ref([
  { id: 1, name: '管理员', code: 'admin' },
  { id: 2, name: '普通用户', code: 'user' },
  { id: 3, name: '风控操作员', code: 'risk_operator' }
])

const getLevelClass = (level) => ({ 1: 'normal', 2: 'business', 3: 'vip' }[level] || 'normal')
const getLevelLabel = (level) => getEnumLabel(UserLevelEnum, level) || '-'
const getStatusClass = (status) => ({ 1: 'enabled', 0: 'disabled', 2: 'frozen' }[status] || 'enabled')
const getStatusLabel = (status) => getEnumLabel(UserStatusEnum, status) || '-'
const getChannelLabel = (channel) => getEnumLabel(RegisterChannelEnum, channel) || '-'

const getRowTags = (row) => {
  let tags = []
  try {
    tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
  } catch (e) {}
  return tags
    .map(t => {
      const opt = UserTagOptions.find(o => o.value === t)
      return opt || { value: t, label: t, color: '#909399' }
    })
}

const getRowClassName = ({ row }) => {
  const classes = []
  if (row.isAbnormal) classes.push('abnormal-row')
  if (selectedIds.value.includes(row.id)) classes.push('selected-row')
  return classes.join(' ')
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const handleClearSelection = () => {
  selectedIds.value = []
  selectedRows.value = []
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.userLevel = null
  searchForm.registerChannel = ''
  searchForm.status = null
  searchForm.isAbnormal = ''
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleTrace = async () => {
  if (!searchForm.keyword && !searchForm.userLevel && !searchForm.registerChannel) {
    ElMessage.warning('请输入至少一个溯源条件（关键词/等级/渠道）')
    return
  }
  const params = {}
  if (searchForm.keyword) {
    if (/^1[3-9]\d{9}$/.test(searchForm.keyword)) {
      params.phone = searchForm.keyword
    } else if (/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(searchForm.keyword)) {
      params.idCard = searchForm.keyword
    } else if (/^\d+$/.test(searchForm.keyword)) {
      params.userId = searchForm.keyword
    } else {
      params.userId = ''
    }
  }
  if (searchForm.registerChannel) params.registerChannel = searchForm.registerChannel

  loading.value = true
  try {
    const res = await traceUser(params)
    tableData.value = res.data || []
    pagination.total = (res.data || []).length
    ElMessage.success(`溯源查询完成，共找到 ${(res.data || []).length} 条记录`)
  } catch (e) {
    ElMessage.error(e.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  currentUser.value = null
  editDialogVisible.value = true
}

const handleEdit = (row) => {
  currentUser.value = { ...row }
  editDialogVisible.value = true
}

const handleView = (row) => {
  currentUserId.value = row.id
  detailDialogVisible.value = true
}

const handlePermission = (row) => {
  currentPermissionUserId.value = row.id
  currentPermissionUser.value = row
  permissionDialogVisible.value = true
}

const handlePermissionSuccess = () => {
  listFadeKey.value++
  fetchData()
}

const handleBatchPermSuccess = () => {
  batchPermDialogVisible.value = false
  listFadeKey.value++
  fetchData()
  handleClearSelection()
}

const handleFreeze = async (row) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `请输入冻结用户 "${row.username}" 的原因`,
      '冻结用户',
      {
        confirmButtonText: '确认冻结',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入冻结原因',
        inputValidator: (val) => !!val?.trim() || '请输入冻结原因',
        type: 'warning'
      }
    )
    await updateUserStatus(row.id, 2, reason)
    ElMessage.success('冻结成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const handleUnfreeze = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要解冻用户 "${row.username}" 吗？`,
      '提示',
      { type: 'warning' }
    )
    await updateUserStatus(row.id, 1)
    ElMessage.success('解冻成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${row.username}" 吗？此操作不可恢复！`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  )
    .then(async () => {
      try {
        await deleteUser(row.id)
        ElMessage.success('删除成功')
        fetchData()
      } catch (e) {
        ElMessage.error(e.message || '删除失败')
      }
    })
    .catch(() => {})
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.userLevel) params.userLevel = searchForm.userLevel
    if (searchForm.registerChannel) params.registerChannel = searchForm.registerChannel
    if (searchForm.status !== null && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.isAbnormal !== '' && searchForm.isAbnormal !== undefined) {
      params.isAbnormal = searchForm.isAbnormal
    }
    if (searchForm.dateRange?.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }

    const res = await getUserList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
