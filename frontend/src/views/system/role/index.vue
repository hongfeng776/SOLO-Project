<template>
  <div class="ccb-system-role">
    <CcbPageHeader
      title="角色管理"
      description="管理系统角色与权限分配"
      icon="UserFilled"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </template>
    </CcbPageHeader>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="角色编码" prop="roleCode">
        <el-input v-model="searchForm.roleCode" placeholder="请输入角色编码" clearable />
      </el-form-item>
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="searchForm.roleName" placeholder="请输入角色名称" clearable />
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
      <el-table-column prop="roleCode" label="角色编码" width="150" />
      <el-table-column prop="roleName" label="角色名称" width="150" />
      <el-table-column prop="dataScope" label="数据权限" width="120">
        <template #default="{ row }">
          <el-tag :type="getDataScopeTagType(row.dataScope)" effect="light" size="small">
            {{ getDataScopeLabel(row.dataScope) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" align="center" />
      <el-table-column prop="userCount" label="用户数" width="90" align="center" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="角色描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link size="small" @click="handlePermission(row)">权限</el-button>
          <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleDisable(row)">禁用</el-button>
          <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'add' ? '新增角色' : '编辑角色'"
      width="560px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleFormRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="角色编码" prop="roleCode">
              <el-input
                v-model="roleForm.roleCode"
                placeholder="请输入角色编码（英文大写）"
                :disabled="formMode === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据权限" prop="dataScope">
              <el-select v-model="roleForm.dataScope" placeholder="请选择数据权限" style="width: 100%">
                <el-option label="全部数据" :value="1" />
                <el-option label="所在机构及以下" :value="2" />
                <el-option label="仅所在机构" :value="3" />
                <el-option label="仅本人" :value="4" />
                <el-option label="自定义" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="roleForm.sort"
                :min="0"
                :max="999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="roleForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="permissionDialogVisible"
      :title="`分配权限 - ${currentRole?.roleName || ''}`"
      width="520px"
      destroy-on-close
    >
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        :props="treeProps"
        show-checkbox
        node-key="id"
        default-expand-all
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePermissionSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, TreeInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@utils'

interface Role {
  id: number
  roleCode: string
  roleName: string
  dataScope: number
  sort: number
  userCount: number
  status: number
  description: string
  createdAt: string
  updatedAt: string
}

interface TreeNode {
  id: number
  label: string
  children?: TreeNode[]
}

const loading = ref<boolean>(false)
const tableData = ref<Role[]>([])
const total = ref<number>(0)
const selectedRows = ref<Role[]>([])

const formDialogVisible = ref<boolean>(false)
const permissionDialogVisible = ref<boolean>(false)
const formMode = ref<'add' | 'edit'>('add')
const formLoading = ref<boolean>(false)
const roleFormRef = ref<FormInstance>()
const permissionTreeRef = ref<TreeInstance>()
const currentRole = ref<Role | null>(null)

const searchForm = reactive({
  roleCode: '',
  roleName: '',
  status: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const roleForm = reactive({
  id: 0,
  roleCode: '',
  roleName: '',
  dataScope: 2,
  sort: 100,
  status: 1,
  description: ''
})

const roleFormRules: FormRules = {
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '仅支持大写字母、数字和下划线', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 32, message: '名称长度在 2 到 32 个字符', trigger: 'blur' }
  ],
  dataScope: [
    { required: true, message: '请选择数据权限', trigger: 'change' }
  ]
}

const treeProps = {
  children: 'children',
  label: 'label'
}

const permissionTree: TreeNode[] = [
  {
    id: 1,
    label: '首页',
    children: [
      { id: 11, label: '运营概览' }
    ]
  },
  {
    id: 2,
    label: '业务管理',
    children: [
      { id: 21, label: '交易流水' },
      { id: 22, label: '渠道管理' },
      { id: 23, label: '产品管理' }
    ]
  },
  {
    id: 3,
    label: '审核管理',
    children: [
      { id: 31, label: '待审核' },
      { id: 32, label: '审计历史' },
      { id: 33, label: '审核规则' }
    ]
  },
  {
    id: 4,
    label: '系统管理',
    children: [
      { id: 41, label: '用户管理' },
      { id: 42, label: '角色管理' },
      { id: 43, label: '权限管理' },
      { id: 44, label: '机构管理' },
      { id: 45, label: '操作日志' }
    ]
  }
]

const getDataScopeLabel = (scope: number): string => {
  const labels: Record<number, string> = {
    1: '全部数据',
    2: '所在机构及以下',
    3: '仅所在机构',
    4: '仅本人',
    5: '自定义'
  }
  return labels[scope] || '未知'
}

const getDataScopeTagType = (scope: number): string => {
  const types: Record<number, string> = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'info',
    5: 'success'
  }
  return types[scope] || 'info'
}

const mockRoles: Role[] = [
  {
    id: 1,
    roleCode: 'SUPER_ADMIN',
    roleName: '超级管理员',
    dataScope: 1,
    sort: 1,
    userCount: 2,
    status: 1,
    description: '拥有系统所有权限，可管理全部数据',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    roleCode: 'ADMIN',
    roleName: '系统管理员',
    dataScope: 1,
    sort: 10,
    userCount: 5,
    status: 1,
    description: '系统配置与用户管理权限',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-06-01 12:00:00'
  },
  {
    id: 3,
    roleCode: 'OP_MANAGER',
    roleName: '运营主管',
    dataScope: 2,
    sort: 20,
    userCount: 12,
    status: 1,
    description: '负责机构业务运营管理',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-03-15 10:00:00'
  },
  {
    id: 4,
    roleCode: 'AUDITOR_LEVEL1',
    roleName: '一级审核员',
    dataScope: 2,
    sort: 30,
    userCount: 20,
    status: 1,
    description: '一级业务审核权限',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-02-20 09:00:00'
  },
  {
    id: 5,
    roleCode: 'AUDITOR_LEVEL2',
    roleName: '二级审核员',
    dataScope: 2,
    sort: 31,
    userCount: 8,
    status: 1,
    description: '二级业务审核权限',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-02-20 09:00:00'
  },
  {
    id: 6,
    roleCode: 'AUDITOR_LEVEL3',
    roleName: '三级审核员',
    dataScope: 1,
    sort: 32,
    userCount: 3,
    status: 1,
    description: '三级/终审业务审核权限',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-02-20 09:00:00'
  },
  {
    id: 7,
    roleCode: 'OPERATOR',
    roleName: '业务操作员',
    dataScope: 3,
    sort: 50,
    userCount: 56,
    status: 1,
    description: '日常业务办理操作',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-04-10 14:00:00'
  },
  {
    id: 8,
    roleCode: 'RISK_OFFICER',
    roleName: '风控专员',
    dataScope: 1,
    sort: 40,
    userCount: 6,
    status: 1,
    description: '风险监测与异常交易处理',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-05-01 16:00:00'
  },
  {
    id: 9,
    roleCode: 'PRODUCT_MANAGER',
    roleName: '产品经理',
    dataScope: 2,
    sort: 45,
    userCount: 4,
    status: 1,
    description: '金融产品上架与管理',
    createdAt: '2024-02-01 10:00:00',
    updatedAt: '2024-05-20 11:00:00'
  },
  {
    id: 10,
    roleCode: 'CHANNEL_MANAGER',
    roleName: '渠道经理',
    dataScope: 2,
    sort: 46,
    userCount: 3,
    status: 1,
    description: '业务渠道接入与维护',
    createdAt: '2024-02-01 10:00:00',
    updatedAt: '2024-05-20 11:00:00'
  },
  {
    id: 11,
    roleCode: 'FINANCE_AUDIT',
    roleName: '财务稽核',
    dataScope: 1,
    sort: 60,
    userCount: 2,
    status: 0,
    description: '财务数据核对与审计',
    createdAt: '2024-03-01 10:00:00',
    updatedAt: '2024-06-10 10:00:00'
  },
  {
    id: 12,
    roleCode: 'CUSTOMER_SERVICE',
    roleName: '客服专员',
    dataScope: 4,
    sort: 80,
    userCount: 15,
    status: 1,
    description: '客户咨询与业务查询',
    createdAt: '2024-03-15 10:00:00',
    updatedAt: '2024-06-01 10:00:00'
  }
]

const resetRoleForm = (): void => {
  roleForm.id = 0
  roleForm.roleCode = ''
  roleForm.roleName = ''
  roleForm.dataScope = 2
  roleForm.sort = 100
  roleForm.status = 1
  roleForm.description = ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockRoles.slice(start, end)
    total.value = mockRoles.length
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
  selectedRows.value = val as Role[]
}

const handleAdd = (): void => {
  formMode.value = 'add'
  resetRoleForm()
  formDialogVisible.value = true
}

const handleView = (row: Role): void => {
  ElMessage.info(`查看角色详情：${row.roleName}`)
}

const handleEdit = (row: Role): void => {
  formMode.value = 'edit'
  Object.assign(roleForm, {
    id: row.id,
    roleCode: row.roleCode,
    roleName: row.roleName,
    dataScope: row.dataScope,
    sort: row.sort,
    status: row.status,
    description: row.description
  })
  formDialogVisible.value = true
}

const handlePermission = (row: Role): void => {
  currentRole.value = row
  permissionDialogVisible.value = true
}

const handlePermissionSubmit = (): void => {
  ElMessage.success('权限分配成功')
  permissionDialogVisible.value = false
}

const handleEnable = async (row: Role): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要启用角色 "${row.roleName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('启用成功')
    fetchData()
  } catch {}
}

const handleDisable = async (row: Role): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要禁用角色 "${row.roleName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('禁用成功')
    fetchData()
  } catch {}
}

const handleDelete = async (row: Role): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${row.roleName}" 吗？此操作不可恢复。`, '警告', {
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
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个角色吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    ElMessage.success('批量删除成功')
    fetchData()
  } catch {}
}

const handleDialogClosed = (): void => {
  roleFormRef.value?.resetFields()
  resetRoleForm()
}

const handleSubmit = async (): Promise<void> => {
  const valid = await roleFormRef.value?.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  setTimeout(() => {
    ElMessage.success(formMode.value === 'add' ? '新增成功' : '编辑成功')
    formLoading.value = false
    formDialogVisible.value = false
    fetchData()
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-system-role {
}
</style>
