<template>
  <div class="page-container admin-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="用户名/昵称/邮箱/手机号" clearable />
        </el-form-item>
        <el-form-item label="岗位角色">
          <el-select v-model="queryParams.role" placeholder="请选择" clearable>
            <el-option v-for="item in USER_ROLE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位层级">
          <el-select v-model="queryParams.positionLevel" placeholder="请选择" clearable>
            <el-option v-for="item in POSITION_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable>
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" :disabled="!canCreateAdmin" @click="handleAdd">新增管理员</el-button>
          </div>
          <BaseBatchOperation :selected-count="selectedIds.length" @clear="handleClearSelection">
            <el-button :disabled="selectedIds.length === 0" @click="handleBatchStatusChange(1)">批量启用</el-button>
            <el-button :disabled="selectedIds.length === 0" @click="handleBatchStatusChange(0)">批量禁用</el-button>
            <el-button :disabled="selectedIds.length === 0" @click="handleBatchResetPermissions">批量重置权限</el-button>
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
          </BaseBatchOperation>
        </template>

        <el-table-column type="selection" width="50" align="center" :selectable="isSelectable" />
        <el-table-column label="账号信息" min-width="180">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :size="32" style="margin-right: 12px">{{ (row as AdminItem).nickname?.charAt(0) || 'U' }}</el-avatar>
              <div>
                <div class="username">{{ (row as AdminItem).username }}</div>
                <div class="nickname text-muted">{{ (row as AdminItem).nickname }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="(row as AdminItem).role === 'admin' ? 'danger' : (row as AdminItem).role === 'user' ? 'primary' : 'info'">
              {{ USER_ROLE_MAP[(row as AdminItem).role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="岗位层级" width="120">
          <template #default="{ row }">
            <el-tag v-if="(row as AdminItem).positionLevel" :type="POSITION_LEVEL_MAP[(row as AdminItem).positionLevel!]?.color || 'info'">
              {{ POSITION_LEVEL_MAP[(row as AdminItem).positionLevel!]?.label || '-' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="position" label="岗位" width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="(row as AdminItem).status === 1"
              :disabled="isSuperAdmin(row as AdminItem)"
              @change="(val) => handleStatusChange(row as AdminItem, val ? 1 : 0)"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDateTime((row as AdminItem).lastLoginAt) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ (row as AdminItem).createdByName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime((row as AdminItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-popover
              placement="left"
              :width="280"
              trigger="hover"
              popper-class="trace-popover"
            >
              <template #reference>
                <el-button type="info" link :icon="Clock">溯源</el-button>
              </template>
              <div class="trace-info">
                <div class="trace-title">账号溯源信息</div>
                <div class="trace-row"><span class="trace-label">创建人：</span>{{ (row as AdminItem).createdByName || '系统' }}</div>
                <div class="trace-row"><span class="trace-label">创建时间：</span>{{ formatDateTime((row as AdminItem).createdAt) }}</div>
                <div class="trace-row"><span class="trace-label">激活时间：</span>{{ formatDateTime((row as AdminItem).activatedAt) || '-' }}</div>
                <div class="trace-row"><span class="trace-label">最后登录：</span>{{ formatDateTime((row as AdminItem).lastLoginAt) || '-' }}</div>
              </div>
            </el-popover>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as AdminItem)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" :disabled="isSuperAdmin(row as AdminItem)" @click="handleDeleteClick(row as AdminItem)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <BaseEmpty description="暂无管理员数据" />
        </template>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :loading="dialogLoading"
      width="720px"
      @confirm="handleSubmit"
    >
      <el-progress v-if="!isEdit && createProgress > 0" :percentage="createProgress" :status="createProgress === 100 ? 'success' : undefined" style="margin-bottom: 20px" />
      
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" :disabled="isEdit" placeholder="登录用户名" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="显示名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!isEdit">
            <el-form-item label="初始密码" prop="password">
              <el-input v-model="formData.password" type="password" placeholder="至少6位" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="11位手机号" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号角色" prop="role">
              <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%" @change="handleRoleChange">
                <el-option v-for="item in USER_ROLE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位角色" prop="roleId">
              <el-select v-model="formData.roleId" placeholder="请选择岗位角色" style="width: 100%" filterable @change="handlePositionRoleChange">
                <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位层级" prop="positionLevel">
              <el-select v-model="formData.positionLevel" placeholder="请选择层级" style="width: 100%">
                <el-option v-for="item in POSITION_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="position">
              <el-input v-model="formData.position" placeholder="如：渠道运营" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isEdit">
            <el-form-item label="账号状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <span class="divider-title">权限配置</span>
          <el-tag v-if="permissionConflicts.length > 0" type="danger" size="small" style="margin-left: 10px">
            检测到 {{ permissionConflicts.length }} 组权限冲突
          </el-tag>
        </el-divider>

        <div class="permission-section">
          <div class="permission-tip" v-if="isEdit && isDisabledAccount">
            <el-alert type="warning" :closable="false" show-icon>
              当前账号已禁用，仅可编辑基础信息，无法修改权限配置
            </el-alert>
          </div>
          <el-alert
            v-for="(conflict, idx) in permissionConflicts"
            :key="idx"
            :title="`权限冲突：${conflict.reason}`"
            type="error"
            show-icon
            :closable="false"
            style="margin-bottom: 8px"
          >
            <template #default>
              <span class="conflict-code conflict-highlight">{{ conflict.code }}</span>
              <span style="margin: 0 8px">↔</span>
              <span class="conflict-code conflict-highlight">{{ conflict.conflictCode }}</span>
            </template>
          </el-alert>

          <div class="role-permissions" v-if="rolePermissions.length > 0">
            <div class="role-permissions-title">
              <el-icon><Key /></el-icon>
              角色默认权限（已自动勾选）
            </div>
          </div>

          <el-tree
            ref="permissionTreeRef"
            v-loading="permissionLoading"
            :data="permissionTree"
            :props="{ label: 'label', children: 'children' }"
            show-checkbox
            node-key="id"
            :default-checked-keys="defaultCheckedKeys"
            :expand-on-click-node="false"
            :disabled="isEdit && isDisabledAccount"
            style="max-height: 360px; overflow: auto; padding: 8px; border: 1px solid var(--el-border-color-light); border-radius: 4px"
            @check="handlePermissionCheck"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node" :class="{ 'conflict-permission': isConflictPermission(data.code) }">
                <el-icon v-if="data.type === 'menu'" class="mr-1"><Document /></el-icon>
                <el-icon v-else class="mr-1"><Pointer /></el-icon>
                <span>{{ node.label }}</span>
                <el-tag v-if="data.type" size="small" class="ml-2" :type="data.type === 'menu' ? 'success' : 'warning'">
                  {{ data.type === 'menu' ? '菜单' : '按钮' }}
                </el-tag>
                <el-tag v-if="isConflictPermission(data.code)" type="danger" size="small" class="ml-2">
                  冲突
                </el-tag>
              </span>
            </template>
          </el-tree>
        </div>
      </el-form>
    </BaseDialog>

    <el-dialog v-model="batchResultVisible" title="批量操作结果" width="520px" :close-on-click-modal="false">
      <div class="batch-result">
        <el-alert
          :title="`操作成功：${batchResult.success.length} 条`"
          type="success"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-alert
          v-if="batchResult.failed.length > 0"
          :title="`操作失败：${batchResult.failed.length} 条`"
          type="error"
          show-icon
          :closable="false"
        >
          <template #default>
            <div class="failed-list">
              <div v-for="(item, idx) in batchResult.failed" :key="idx" class="failed-item">
                <span class="failed-id">{{ item.id.substring(0, 8) }}...</span>
                <span class="failed-reason">{{ item.reason }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button type="primary" @click="batchResultVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dependencyVisible" title="删除依赖检查" width="480px" :close-on-click-modal="false">
      <div class="dependency-check">
        <div v-if="deleteDependencies.length > 0">
          <el-alert title="该账号存在关联数据，请确认后再操作" type="warning" show-icon :closable="false" />
          <div class="dependency-list">
            <div v-for="(dep, idx) in deleteDependencies" :key="idx" class="dependency-item">
              <el-icon><Warning /></el-icon>
              <span class="dep-desc">{{ dep.description }}（共 {{ dep.count }} 条）</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dependencyVisible = false">取消</el-button>
        <el-button type="danger" :disabled="!canDeleteAdmin" @click="confirmDeleteForce">强制删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { ElTree } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Delete,
  Clock,
  Key,
  Document,
  Pointer,
  Warning,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { useUserStore } from '@/stores/user'
import { STATUS_OPTIONS, POSITION_LEVEL_OPTIONS, POSITION_LEVEL_MAP, USER_ROLE_OPTIONS, USER_ROLE_MAP } from '@/constants'
import {
  getAdminList,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  batchUpdateAdminStatus,
  batchResetAdminPermissions,
  checkAdminDeleteDependencies,
  getPermissionExclusionRules,
  type AdminItem,
  type AdminQueryParams,
  type CreateAdminParams,
  type UpdateAdminParams,
  type BatchOperateResult,
  type PermissionConflict,
  type DeleteDependency,
} from '@/api/admin'
import {
  getRoleList,
  getPermissionList,
  getRolePermissions,
  type RoleItem,
  type PermissionItem,
} from '@/api/permission'

const userStore = useUserStore()

const {
  loading,
  dataList,
  total,
  pagination,
  queryParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  selectedIds,
  handleSelectionChange: baseHandleSelectionChange,
} = useTable<AdminItem, AdminQueryParams>({
  fetchApi: getAdminList,
  deleteApi: (id: string | number) => deleteAdmin(String(id)),
})

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const dateRange = ref<string[]>([])

watch(dateRange, (val) => {
  if (val && val.length === 2) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = undefined
    queryParams.endTime = undefined
  }
})

function handleSelectionChange(selection: AdminItem[]) {
  baseHandleSelectionChange(selection)
}

function handleClearSelection() {
  selectedIds.value = []
}

function isSelectable(row: AdminItem) {
  return !isSuperAdmin(row)
}

function isSuperAdmin(row: AdminItem) {
  return row.role === 'admin' && row.positionLevel === 1
}

const canCreateAdmin = computed(() => {
  if (!userStore.userInfo) return false
  return userStore.userInfo.role === 'admin' || userStore.userInfo.permissions.includes('admin:create')
})

function formatDateTime(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const roleList = ref<RoleItem[]>([])
const permissionTree = ref<PermissionItem[]>([])
const permissionLoading = ref(false)
const permissionTreeRef = ref<InstanceType<typeof ElTree>>()
const rolePermissions = ref<(string | number)[]>([])
const defaultCheckedKeys = ref<(string | number)[]>([])
const permissionExclusionRules = ref<Array<{ codes: [string, string]; reason: string }>>([])
const permissionConflicts = ref<PermissionConflict[]>([])
const selectedPermissionCodes = ref<string[]>([])

async function fetchRoleList() {
  try {
    const res = await getRoleList({ page: 1, pageSize: 999, status: 'enable' })
    roleList.value = res.list
  } catch (error) {
    console.error('Fetch role list error:', error)
  }
}

async function fetchPermissionTree() {
  try {
    permissionLoading.value = true
    const list = await getPermissionList()
    permissionTree.value = list
  } catch (error) {
    console.error('Fetch permissions error:', error)
  } finally {
    permissionLoading.value = false
  }
}

async function fetchPermissionExclusionRules() {
  try {
    permissionExclusionRules.value = await getPermissionExclusionRules()
  } catch (error) {
    console.error('Fetch permission exclusion rules error:', error)
  }
}

onMounted(() => {
  fetchRoleList()
  fetchPermissionTree()
  fetchPermissionExclusionRules()
})

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => (isEdit.value ? '编辑管理员' : '新增管理员'))
const isDisabledAccount = computed(() => isEdit.value && formData.status === 0)
const createProgress = ref(0)

const formData = reactive<Partial<CreateAdminParams & UpdateAdminParams & { status: number }>>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  role: 'user',
  roleId: '',
  permissionIds: [],
  position: '',
  positionLevel: undefined,
  status: 1,
})

const validatePhone = (_rule: any, value: string, callback: any) => {
  if (!value) {
    return callback(new Error('请输入手机号'))
  }
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(value)) {
    return callback(new Error('请输入正确的11位手机号'))
  }
  callback()
}

const validateEmail = (_rule: any, value: string, callback: any) => {
  if (!value) {
    return callback(new Error('请输入邮箱'))
  }
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(value)) {
    return callback(new Error('请输入正确的邮箱地址'))
  }
  callback()
}

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度为6-50个字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称不能超过50个字符', trigger: 'blur' },
  ],
  phone: [{ validator: validatePhone, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  role: [{ required: true, message: '请选择账号角色', trigger: 'change' }],
  roleId: [{ required: true, message: '请选择岗位角色', trigger: 'change' }],
  positionLevel: [{ required: false, message: '请选择岗位层级', trigger: 'change' }],
}

let submitting = false

function handleAdd() {
  Object.assign(formData, {
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    role: 'user',
    roleId: '',
    permissionIds: [],
    position: '',
    positionLevel: undefined,
    status: 1,
  })
  defaultCheckedKeys.value = []
  rolePermissions.value = []
  permissionConflicts.value = []
  createProgress.value = 0
  openDialog()
}

function handleEdit(row: AdminItem) {
  Object.assign(formData, {
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    phone: row.phone,
    role: row.role,
    roleId: row.roleId || '',
    permissionIds: row.permissionIds || [],
    position: row.position || '',
    positionLevel: row.positionLevel,
    status: row.status,
  })
  defaultCheckedKeys.value = row.permissionIds || []
  permissionConflicts.value = []
  createProgress.value = 0
  if (row.roleId) {
    handlePositionRoleChange(row.roleId)
  }
  openDialog(row)
}

async function handleRoleChange(role: string) {
  if (role === 'admin') {
    formData.positionLevel = 1
  } else if (role === 'user') {
    formData.positionLevel = 5
  } else {
    formData.positionLevel = 9
  }
}

async function handlePositionRoleChange(roleId: string) {
  if (!roleId) {
    rolePermissions.value = []
    return
  }
  try {
    rolePermissions.value = await getRolePermissions(roleId)
    const currentKeys = permissionTreeRef.value?.getCheckedKeys(true) || []
    const halfCheckedKeys = permissionTreeRef.value?.getHalfCheckedKeys() || []
    const allCurrentKeys = [...currentKeys, ...halfCheckedKeys]
    const mergedKeys = [...new Set([...rolePermissions.value, ...allCurrentKeys])]
    permissionTreeRef.value?.setCheckedKeys(mergedKeys)
    checkPermissionConflicts()
  } catch (error) {
    console.error('Fetch role permissions error:', error)
  }
}

function handlePermissionCheck() {
  checkPermissionConflicts()
}

function checkPermissionConflicts() {
  const checkedKeys = permissionTreeRef.value?.getCheckedKeys(true) || []
  const allCheckedCodes: string[] = []

  function collectCodes(nodes: PermissionItem[], keys: (string | number)[]) {
    nodes.forEach((node) => {
      if (keys.includes(node.id) && node.code) {
        allCheckedCodes.push(node.code)
      }
      if (node.children) {
        collectCodes(node.children as PermissionItem[], keys)
      }
    })
  }

  collectCodes(permissionTree.value, checkedKeys)
  selectedPermissionCodes.value = allCheckedCodes

  const conflicts: PermissionConflict[] = []
  permissionExclusionRules.value.forEach((rule) => {
    const [codeA, codeB] = rule.codes
    if (allCheckedCodes.includes(codeA) && allCheckedCodes.includes(codeB)) {
      conflicts.push({
        code: codeA,
        conflictCode: codeB,
        reason: rule.reason,
      })
    }
  })
  permissionConflicts.value = conflicts
}

function isConflictPermission(code?: string) {
  if (!code) return false
  return permissionConflicts.value.some(
    (c) => c.code === code || c.conflictCode === code
  )
}

async function handleSubmit() {
  if (submitting) return
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting = true
    dialogLoading.value = true
    try {
      const checkedKeys = permissionTreeRef.value?.getCheckedKeys(true) || []
      const halfCheckedKeys = permissionTreeRef.value?.getHalfCheckedKeys() || []
      const allPermissionIds = [...checkedKeys, ...halfCheckedKeys]

      if (isEdit.value) {
        const updateParams: UpdateAdminParams = {
          nickname: formData.nickname,
          email: formData.email,
          phone: formData.phone,
          role: formData.role as 'admin' | 'user' | 'guest',
          roleId: formData.roleId,
          position: formData.position,
          positionLevel: formData.positionLevel,
          status: formData.status,
        }
        if (!isDisabledAccount.value) {
          updateParams.permissionIds = allPermissionIds
        }
        await updateAdmin(dialogData.id, updateParams)
        ElMessage.success('编辑成功')
      } else {
        createProgress.value = 30
        await new Promise((resolve) => setTimeout(resolve, 200))
        createProgress.value = 60

        const createParams: CreateAdminParams = {
          username: formData.username!,
          password: formData.password!,
          nickname: formData.nickname!,
          email: formData.email!,
          phone: formData.phone!,
          role: formData.role as 'admin' | 'user' | 'guest',
          roleId: formData.roleId!,
          permissionIds: allPermissionIds,
          position: formData.position,
          positionLevel: formData.positionLevel,
        }
        await createAdmin(createParams)
        createProgress.value = 80
        await new Promise((resolve) => setTimeout(resolve, 200))
        createProgress.value = 100
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      handleSearch()
    } catch (error) {
      console.error(error)
    } finally {
      dialogLoading.value = false
      submitting = false
      setTimeout(() => {
        createProgress.value = 0
      }, 500)
    }
  })
}

let statusChanging = false

async function handleStatusChange(row: AdminItem, status: number) {
  if (statusChanging) return
  statusChanging = true
  try {
    await updateAdmin(String(row.id), { status })
    ElMessage.success(status === 1 ? '启用成功' : '禁用成功')
    handleSearch()
  } catch (error) {
    console.error(error)
  } finally {
    statusChanging = false
  }
}

const batchResultVisible = ref(false)
const batchResult = reactive<BatchOperateResult>({
  success: [],
  failed: [],
})

async function handleBatchStatusChange(status: number) {
  if (selectedIds.value.length === 0) return
  const filterIds = selectedIds.value.filter((id) => {
    const row = dataList.value.find((item) => item.id === id)
    return row && !isSuperAdmin(row)
  })
  if (filterIds.length === 0) {
    ElMessage.warning('没有可操作的选中项')
    return
  }
  try {
    const result = await batchUpdateAdminStatus(filterIds as string[], status)
    batchResult.success = result.success
    batchResult.failed = result.failed
    batchResultVisible.value = true
    handleSearch()
  } catch (error) {
    console.error(error)
  }
}

async function handleBatchResetPermissions() {
  if (selectedIds.value.length === 0) return
  const filterIds = selectedIds.value.filter((id) => {
    const row = dataList.value.find((item) => item.id === id)
    return row && !isSuperAdmin(row)
  })
  if (filterIds.length === 0) {
    ElMessage.warning('没有可操作的选中项')
    return
  }
  try {
    const result = await batchResetAdminPermissions(filterIds as string[])
    batchResult.success = result.success
    batchResult.failed = result.failed
    batchResultVisible.value = true
    handleSearch()
  } catch (error) {
    console.error(error)
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const filterIds = selectedIds.value.filter((id) => {
    const row = dataList.value.find((item) => item.id === id)
    return row && !isSuperAdmin(row)
  })
  if (filterIds.length === 0) {
    ElMessage.warning('没有可删除的选中项')
    return
  }
  const { batchDelConfirm } = await import('@/components/common/BaseConfirm.vue')
  const confirmed = await batchDelConfirm(filterIds.length)
  if (!confirmed) return
  try {
    const successIds: string[] = []
    const failedIds: Array<{ id: string; reason: string }> = []
    for (const id of filterIds) {
      try {
        await deleteAdmin(id as string)
        successIds.push(id as string)
      } catch (err: any) {
        failedIds.push({ id: id as string, reason: err.message || '删除失败' })
      }
    }
    batchResult.success = successIds
    batchResult.failed = failedIds
    batchResultVisible.value = true
    handleSearch()
  } catch (error) {
    console.error(error)
  }
}

const dependencyVisible = ref(false)
const deleteDependencies = ref<DeleteDependency[]>([])
const canDeleteAdmin = ref(true)
let pendingDeleteId: string | number | null = null

async function handleDeleteClick(row: AdminItem) {
  pendingDeleteId = row.id
  try {
    const result = await checkAdminDeleteDependencies(row.id as string)
    if (result.hasDependencies) {
      deleteDependencies.value = result.dependencies
      canDeleteAdmin.value = result.canDelete
      dependencyVisible.value = true
    } else {
      const { delConfirm } = await import('@/components/common/BaseConfirm.vue')
      const confirmed = await delConfirm(`删除管理员账号 - ${row.username}，删除后该账号将无法登录系统，相关权限配置将被清除。确定要删除吗？`)
      if (confirmed) {
        await doDelete(row.id)
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function confirmDeleteForce() {
  if (!pendingDeleteId) return
  try {
    await doDelete(pendingDeleteId)
    dependencyVisible.value = false
    pendingDeleteId = null
  } catch (error) {
    console.error(error)
  }
}

async function doDelete(id: string | number) {
  try {
    await deleteAdmin(id as string)
    ElMessage.success('删除成功')
    handleSearch()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped lang="scss">
.admin-page {
  .search-form {
    margin-bottom: 0;
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
  }

  .user-info-cell {
    display: flex;
    align-items: center;

    .username {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .nickname {
      font-size: 12px;
      margin-top: 2px;
    }
  }

  .text-muted {
    color: var(--el-text-color-secondary);
  }
}

.trace-info {
  .trace-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
  }

  .trace-row {
    font-size: 13px;
    line-height: 1.8;
    color: var(--el-text-color-regular);

    .trace-label {
      color: var(--el-text-color-secondary);
    }
  }
}

.permission-section {
  .permission-tip {
    margin-bottom: 16px;
  }

  .role-permissions {
    margin-bottom: 12px;

    .role-permissions-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }

  .conflict-highlight {
    font-weight: 600;
    font-family: monospace;
  }
}

.custom-tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  font-size: 14px;

  &.conflict-permission {
    color: var(--el-color-danger);
  }

  .mr-1 {
    margin-right: 4px;
  }

  .ml-2 {
    margin-left: 8px;
  }
}

.batch-result {
  .failed-list {
    margin-top: 8px;
    max-height: 200px;
    overflow-y: auto;

    .failed-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
      font-size: 13px;

      .failed-id {
        font-family: monospace;
        color: var(--el-text-color-secondary);
        min-width: 80px;
      }

      .failed-reason {
        color: var(--el-text-color-primary);
      }
    }
  }
}

.dependency-check {
  .dependency-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .dependency-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;

      .dep-desc {
        flex: 1;
      }
    }
  }
}

.divider-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>

<style>
.trace-popover {
  padding: 16px !important;
}
</style>
