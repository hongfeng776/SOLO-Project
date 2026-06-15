<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshLeft, Plus, Edit, Delete, Check } from '@element-plus/icons-vue'
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
  studyMinutes: number
  learnedWords: number
  studyDays: number
  accuracy: number
}>({
  username: '',
  nickname: '',
  password: '',
  phone: '',
  email: '',
  avatar: '',
  status: 1,
  studyMinutes: 0,
  learnedWords: 0,
  studyDays: 0,
  accuracy: 0
})

const isEdit = ref(false)
const formRef = ref<FormInstance>()

const validatePhone = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(value)) {
    callback(new Error('手机号格式不正确'))
  } else {
    callback()
  }
}

const validateEmail = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
    return
  }
  const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!emailReg.test(value)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

const validateUsername = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入账号'))
    return
  }
  if (value.length < 3 || value.length > 20) {
    callback(new Error('账号长度需在3-20个字符之间'))
  } else {
    callback()
  }
}

const validateNickname = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入昵称'))
    return
  }
  if (value.length > 20) {
    callback(new Error('昵称长度不能超过20个字符'))
  } else {
    callback()
  }
}

const validateStudyMinutes = (_rule: any, value: number | null | undefined, callback: any) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入学习时长'))
    return
  }
  if (value < 0) {
    callback(new Error('学习时长不能为负数'))
  } else {
    callback()
  }
}

const validateLearnedWords = (_rule: any, value: number | null | undefined, callback: any) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入已学单词数'))
    return
  }
  if (value < 0) {
    callback(new Error('已学单词数不能为负数'))
  } else {
    callback()
  }
}

const validateAccuracy = (_rule: any, value: number | null | undefined, callback: any) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入正确率'))
    return
  }
  if (value < 0 || value > 100) {
    callback(new Error('正确率需在0-100之间'))
  } else {
    callback()
  }
}

const formRules: FormRules = {
  username: [{ validator: validateUsername, trigger: 'blur' }],
  nickname: [{ validator: validateNickname, trigger: 'blur' }],
  password: [
    {
      validator: (_rule: any, value: string, cb: any) => {
        if (!isEdit.value && !value) {
          cb(new Error('请输入密码'))
        } else if (value && value.length < 6) {
          cb(new Error('密码长度不能少于6位'))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [{ validator: validatePhone, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  studyMinutes: [{ validator: validateStudyMinutes, trigger: 'blur' }],
  learnedWords: [{ validator: validateLearnedWords, trigger: 'blur' }],
  accuracy: [{ validator: validateAccuracy, trigger: 'blur' }]
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
    status: row.status,
    studyMinutes: row.studyMinutes,
    learnedWords: row.learnedWords,
    studyDays: row.studyDays,
    accuracy: row.accuracy
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
  const ok = await confirmDelete(`确定要删除用户「${row.nickname}」吗？删除后数据将无法恢复。`)
  if (!ok) return
  await deleteUser([row.id])
  ElMessage.success('删除成功')
  handleRefresh()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条用户数据吗？删除后数据将无法恢复。`)
  if (!ok) return
  await deleteUser(selectedIds.value)
  ElMessage.success('批量删除成功')
  handleRefresh()
}

async function handleStatusChange(row: UserVO, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  const ok = await confirm(`确定要${action}用户「${row.nickname}」吗？`, '状态确认')
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

function formatStudyTime(minutes: number): string {
  if (!minutes) return '0分钟'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
  }
  return `${mins}分钟`
}

const tableHeight = computed(() => {
  return 'calc(100vh - 320px)'
})
</script>

<template>
  <div class="page-container user-management">
    <el-card shadow="never" class="search-card">
      <el-form
        :model="queryForm"
        label-width="80px"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="账号">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入账号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部状态"
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
            placeholder="昵称/手机号搜索"
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

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="table-title">用户列表</span>
          <span class="table-total">共 {{ total }} 条记录</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
        </div>
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
        <el-button type="danger" plain class="delete-btn" @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="10" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <div v-else class="table-wrapper">
          <el-table
            :data="list"
            v-loading="loading"
            :height="tableHeight"
            stripe
            border
            class="user-table sticky-header-table"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" :reserve-selection="false" />
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="nickname" label="昵称" width="120" show-overflow-tooltip />
            <el-table-column prop="username" label="账号" width="140" show-overflow-tooltip />
            <el-table-column prop="phone" label="手机号" width="140" />
            <el-table-column label="学习数据" width="200">
              <template #default="{ row }">
                <div class="study-data">
                  <div class="study-item">
                    <span class="study-label">已学单词</span>
                    <span class="study-value">{{ (row as UserVO).learnedWords }}</span>
                  </div>
                  <div class="study-item">
                    <span class="study-label">学习时长</span>
                    <span class="study-value">{{ formatStudyTime((row as UserVO).studyMinutes) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="学习天数" width="100">
              <template #default="{ row }">
                {{ (row as UserVO).studyDays }} 天
              </template>
            </el-table-column>
            <el-table-column label="正确率" width="100">
              <template #default="{ row }">
                <span :class="['accuracy-tag', (row as UserVO).accuracy >= 80 ? 'high' : (row as UserVO).accuracy >= 60 ? 'medium' : 'low']">
                  {{ (row as UserVO).accuracy }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="注册时间" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="(row as UserVO).status === 1 ? 'success' : 'danger'"
                  effect="light"
                  round
                >
                  {{ (row as UserVO).status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link :icon="Edit" @click="handleEdit(row as UserVO)">
                  编辑
                </el-button>
                <el-button
                  :type="(row as UserVO).status === 1 ? 'warning' : 'success'"
                  link
                  @click="handleStatusChange(row as UserVO, (row as UserVO).status === 1 ? 0 : 1)"
                >
                  {{ (row as UserVO).status === 1 ? '禁用' : '启用' }}
                </el-button>
                <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  class="delete-btn delete-link-btn"
                  @click="handleDelete(row as UserVO)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

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
      width="640px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="100px"
        :disabled="submitLoading"
        class="user-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号" prop="username">
              <el-input
                v-model="modal.formData.username"
                placeholder="请输入账号"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="modal.formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="modal.formData.password"
                type="password"
                :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="modal.formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="modal.formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">学习数据配置</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="已学单词" prop="learnedWords">
              <el-input-number
                v-model="modal.formData.learnedWords"
                :min="0"
                :max="99999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学习时长(分)" prop="studyMinutes">
              <el-input-number
                v-model="modal.formData.studyMinutes"
                :min="0"
                :max="99999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学习天数">
              <el-input-number
                v-model="modal.formData.studyDays"
                :min="0"
                :max="9999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="正确率(%)" prop="accuracy">
              <el-input-number
                v-model="modal.formData.accuracy"
                :min="0"
                :max="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="账号状态">
              <el-radio-group v-model="modal.formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ModalDialog>
  </div>
</template>

<style lang="scss" scoped>
.user-management {
  .search-card {
    border-radius: 8px;
  }

  .table-card {
    margin-top: 16px;
    border-radius: 8px;
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .table-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .table-total {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .table-wrapper {
    overflow: hidden;
    border-radius: 4px;
  }

  .user-table {
    :deep(.el-table__header-wrapper) {
      th {
        background-color: #fafafa;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .study-data {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .study-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;

      .study-label {
        color: #909399;
      }

      .study-value {
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .accuracy-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;

    &.high {
      background-color: #f0f9eb;
      color: #67c23a;
    }

    &.medium {
      background-color: #fdf6ec;
      color: #e6a23c;
    }

    &.low {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }

  .delete-link-btn {
    &:hover {
      transform: scale(1.05);
    }
  }

  .user-form {
    .el-divider {
      margin: 10px 0 20px 0;

      --el-divider-text-color: #303133;
      --el-divider-text-font-size: 14px;
      --el-divider-text-font-weight: 600;
    }

    .el-input-number {
      :deep(.el-input__wrapper) {
        box-shadow: none;
      }
    }
  }
}
</style>
