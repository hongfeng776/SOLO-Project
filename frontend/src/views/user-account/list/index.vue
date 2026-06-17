<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="queryParams.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="注册来源">
          <el-select
            v-model="queryParams.registerSource"
            placeholder="全部来源"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in REGISTER_SOURCE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实名状态">
          <el-select
            v-model="queryParams.realNameVerified"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in REAL_NAME_STATUS_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="手机绑定">
          <el-select
            v-model="queryParams.phoneVerified"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="已绑定" :value="1" />
            <el-option label="未绑定" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="快速筛选">
          <el-select
            v-model="queryParams.filterType"
            placeholder="选择筛选条件"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in USER_FILTER_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-tooltip
            v-if="!canQuery"
            content="无权限查询用户信息，请联系管理员"
            placement="top"
          >
            <el-button type="primary" :icon="Search" disabled>查询</el-button>
          </el-tooltip>
          <el-button
            v-else
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户账号列表</span>
          <div class="header-actions">
            <el-tag v-if="permission.canViewPrivate" type="success" effect="light">高级运营 - 可查看隐私信息</el-tag>
            <el-tag v-else type="info" effect="light">普通运营 - 仅可查看基础信息</el-tag>
          </div>
        </div>
      </template>

      <div v-if="!canQuery" class="permission-denied">
        <el-empty description="无权限查询用户信息，请联系管理员开通权限">
          <template #image>
            <el-icon :size="80" color="#c0c4cc"><Lock /></el-icon>
          </template>
        </el-empty>
      </div>

      <HtTable
        v-else
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
        @row-dblclick="handleRowDoubleClick"
      >
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-info">
              <div class="avatar-wrapper">
                <el-avatar :size="44" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
                <el-tag
                  v-if="row.isAbnormal === 1"
                  class="abnormal-tag"
                  type="danger"
                  effect="dark"
                  size="small"
                >
                  异常
                </el-tag>
              </div>
              <div class="info-text">
                <div class="user-name">
                  {{ row.nickname }}
                  <span class="user-uid">UID: {{ row.id }}</span>
                </div>
                <div class="user-extra">
                  <span>{{ row.username }}</span>
                  <el-tag
                    v-if="permission.canViewPrivate"
                    size="small"
                    :type="row.phoneVerified === 1 ? 'success' : 'info'"
                    effect="plain"
                  >
                    {{ row.phoneVerified === 1 ? '已绑定手机' : '未绑定手机' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="注册信息" min-width="180">
          <template #default="{ row }">
            <div class="info-column">
              <div class="info-item">
                <span class="label">来源：</span>
                <span class="value">{{ REGISTER_SOURCE_NAMES[row.registerSource] || row.registerSource || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">注册：</span>
                <span class="value">{{ formatDateTime(row.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">活跃：</span>
                <span class="value">{{ row.lastActiveTime ? formatDateTime(row.lastActiveTime) : '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" min-width="160">
          <template #default="{ row }">
            <div class="status-column">
              <div class="status-item">
                <el-tag
                  :type="row.realNameVerified === 2 ? 'success' : row.realNameVerified === 1 ? 'warning' : 'info'"
                  effect="light"
                  size="small"
                >
                  {{ REAL_NAME_STATUS_NAMES[row.realNameVerified] || '未知' }}
                </el-tag>
              </div>
              <div class="status-item">
                <span class="label">信息完整度：</span>
                <el-progress
                  :percentage="row.infoCompleteness || 0"
                  :stroke-width="8"
                  :color="row.infoCompleteness >= 80 ? '#67c23a' : row.infoCompleteness >= 60 ? '#e6a23c' : '#f56c6c'"
                  style="width: 80px"
                />
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column v-if="permission.canViewPrivate" label="隐私信息" min-width="200">
          <template #default="{ row }">
            <div class="private-column">
              <div class="info-item">
                <span class="label">手机：</span>
                <span class="value">{{ row.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">邮箱：</span>
                <span class="value">{{ row.email || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">实名：</span>
                <span class="value">{{ row.realName || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-tooltip
              v-if="!permission.canEdit"
              content="无权限编辑，请联系高级运营"
              placement="top"
            >
              <el-button link type="info" size="small" disabled>编辑</el-button>
            </el-tooltip>
            <el-button
              v-else
              link
              type="success"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              @click="handleTrace(row)"
            >
              溯源
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <UserDetailDialog
      v-model="detailDialogVisible"
      :user-id="currentUserId"
      :permission="permission"
      @updated="handleDataUpdated"
    />

    <UserEditDialog
      v-model="editDialogVisible"
      :user-id="currentUserId"
      @updated="handleDataUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Refresh, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { queryUsers } from '@api/user-account'
import type { UserAccount, UserAccountPermission } from '@/types/business'
import { REGISTER_SOURCE_NAMES, REAL_NAME_STATUS_NAMES, USER_FILTER_TYPE_NAMES } from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import UserDetailDialog from './components/UserDetailDialog.vue'
import UserEditDialog from './components/UserEditDialog.vue'

const userStore = useUserStore()

const canQuery = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('user:account:view_basic')
})

const permission = ref<UserAccountPermission>({
  canViewPrivate: false,
  canEdit: false
})

const dateRange = ref<string[]>([])

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<UserAccount, Record<string, unknown>>({
  fetchApi: async (params) => {
    const result = await queryUsers(params)
    permission.value = result.permission
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: undefined,
    phone: '',
    nickname: '',
    registerSource: '',
    realNameVerified: undefined,
    phoneVerified: undefined,
    registerStartDate: '',
    registerEndDate: '',
    filterType: ''
  }
})

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.registerStartDate = newVal[0]
    queryParams.registerEndDate = newVal[1]
  } else {
    queryParams.registerStartDate = ''
    queryParams.registerEndDate = ''
  }
})

const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const currentUserId = ref<number | null>(null)

const handleReset = () => {
  dateRange.value = []
  baseHandleReset()
}

const handleViewDetail = (row: UserAccount) => {
  currentUserId.value = row.id
  detailDialogVisible.value = true
}

const handleEdit = (row: UserAccount) => {
  currentUserId.value = row.id
  editDialogVisible.value = true
}

const handleTrace = (row: UserAccount) => {
  window.open(`/user-account/trace?id=${row.id}`, '_blank')
}

const handleRowDoubleClick = (row: UserAccount) => {
  handleViewDetail(row)
}

const handleDataUpdated = () => {
  fetchData()
}

onMounted(() => {
  if (canQuery.value) {
    fetchData()
  }
})
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .permission-denied {
    padding: 60px 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-wrapper {
      position: relative;

      .abnormal-tag {
        position: absolute;
        top: -6px;
        right: -6px;
        animation: glow 1.5s ease-in-out infinite;
      }

      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 5px rgba(245, 108, 108, 0.5);
        }
        50% {
          box-shadow: 0 0 15px rgba(245, 108, 108, 0.8);
        }
      }
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .user-name {
        font-weight: 600;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px;

        .user-uid {
          font-size: 12px;
          color: $text-secondary;
          font-weight: normal;
        }
      }

      .user-extra {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .info-column {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .info-item {
      font-size: 12px;
      color: $text-secondary;

      .label {
        color: $text-placeholder;
      }

      .value {
        color: $text-primary;
      }
    }
  }

  .status-column {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .label {
        font-size: 12px;
        color: $text-placeholder;
      }
    }
  }

  .private-column {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .info-item {
      font-size: 12px;
      color: $text-secondary;

      .label {
        color: $text-placeholder;
      }

      .value {
        color: $text-primary;
      }
    }
  }
}
</style>
