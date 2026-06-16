<template>
  <div class="ccb-system-permission">
    <CcbPageHeader
      title="权限管理"
      description="管理系统菜单与操作权限配置"
      icon="Key"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增权限</el-button>
      </template>
    </CcbPageHeader>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="权限名称" prop="permissionName">
        <el-input v-model="searchForm.permissionName" placeholder="请输入权限名称" clearable />
      </el-form-item>
      <el-form-item label="权限编码" prop="permissionCode">
        <el-input v-model="searchForm.permissionCode" placeholder="请输入权限编码" clearable />
      </el-form-item>
      <el-form-item label="权限类型" prop="permissionType">
        <el-select v-model="searchForm.permissionType" placeholder="请选择类型" clearable>
          <el-option label="目录" :value="1" />
          <el-option label="菜单" :value="2" />
          <el-option label="按钮" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Expand" @click="expandAll(true)">全部展开</el-button>
        <el-button type="primary" :icon="Fold" @click="expandAll(false)">全部折叠</el-button>
        <el-button type="danger" :icon="Delete" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>

    <el-card class="ccb-permission-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        border
        stripe
        :default-expand-all="false"
        :tree-props="{ children: 'children' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="permissionName" label="权限名称" min-width="200">
          <template #default="{ row }">
            <el-icon v-if="row.permissionType === 1" style="color: #004098; margin-right: 6px;">
              <Folder />
            </el-icon>
            <el-icon v-else-if="row.permissionType === 2" style="color: #1e63c4; margin-right: 6px;">
              <Menu />
            </el-icon>
            <el-icon v-else style="color: #c9a961; margin-right: 6px;">
              <Coin />
            </el-icon>
            {{ row.permissionName }}
          </template>
        </el-table-column>
        <el-table-column prop="permissionCode" label="权限编码" width="200" />
        <el-table-column prop="permissionType" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.permissionType)" effect="light" size="small">
              {{ getTypeLabel(row.permissionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="180" show-overflow-tooltip />
        <el-table-column prop="component" label="组件路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.permissionType !== 3" type="primary" link size="small" @click="handleAddChild(row)">添加子项</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleDisable(row)">禁用</el-button>
            <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="formDialogVisible"
      :title="formTitle"
      width="600px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionFormRules"
        label-width="100px"
      >
        <el-form-item v-if="formMode !== 'addRoot'" label="上级权限" prop="parentId">
          <el-tree-select
            v-model="permissionForm.parentId"
            :data="permissionTree"
            :props="treeProps"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            placeholder="请选择上级权限"
            style="width: 100%"
            check-on-click-node
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="权限类型" prop="permissionType">
              <el-select v-model="permissionForm.permissionType" placeholder="请选择类型" style="width: 100%">
                <el-option label="目录" :value="1" />
                <el-option label="菜单" :value="2" />
                <el-option label="按钮" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="permissionForm.icon" placeholder="Element Plus图标名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="权限名称" prop="permissionName">
              <el-input v-model="permissionForm.permissionName" placeholder="请输入权限名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限编码" prop="permissionCode">
              <el-input
                v-model="permissionForm.permissionCode"
                placeholder="如：system:user:add"
                :disabled="formMode === 'edit'"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="路由路径" prop="path">
              <el-input v-model="permissionForm.path" placeholder="如：/system/user" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件路径" prop="component">
              <el-input v-model="permissionForm.component" placeholder="如：system/user/index" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="permissionForm.sort"
                :min="0"
                :max="999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否缓存">
              <el-switch v-model="permissionForm.noCache" :active-value="0" :inactive-value="1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-switch v-model="permissionForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="权限说明" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入权限说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Delete, Expand, Fold, Folder, Menu, Coin } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Permission {
  id: number
  parentId: number
  permissionName: string
  permissionCode: string
  permissionType: number
  path: string
  component: string
  icon: string
  sort: number
  noCache: number
  status: number
  description: string
  children?: Permission[]
}

const loading = ref<boolean>(false)
const tableData = ref<Permission[]>([])
const selectedRows = ref<Permission[]>([])

const formDialogVisible = ref<boolean>(false)
const formMode = ref<'addRoot' | 'add' | 'edit'>('addRoot')
const formLoading = ref<boolean>(false)
const permissionFormRef = ref<FormInstance>()

const formTitle = computed<string>(() => {
  const titles: Record<string, string> = {
    addRoot: '新增根权限',
    add: '新增子权限',
    edit: '编辑权限'
  }
  return titles[formMode.value]
})

const searchForm = reactive({
  permissionName: '',
  permissionCode: '',
  permissionType: null as number | null,
  status: null as number | null
})

const permissionForm = reactive({
  id: 0,
  parentId: 0,
  permissionName: '',
  permissionCode: '',
  permissionType: 2,
  path: '',
  component: '',
  icon: '',
  sort: 100,
  noCache: 0,
  status: 1,
  description: ''
})

const permissionFormRules: FormRules = {
  permissionName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 32, message: '名称长度在 2 到 32 个字符', trigger: 'blur' }
  ],
  permissionCode: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-z:]+$/, message: '仅支持小写字母和冒号', trigger: 'blur' }
  ],
  permissionType: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ]
}

const treeProps = {
  children: 'children',
  label: 'permissionName'
}

const getTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    1: '目录',
    2: '菜单',
    3: '按钮'
  }
  return labels[type] || '未知'
}

const getTypeTagType = (type: number): string => {
  const types: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }
  return types[type] || 'info'
}

const mockPermissions: Permission[] = [
  {
    id: 1,
    parentId: 0,
    permissionName: '首页',
    permissionCode: 'dashboard',
    permissionType: 1,
    path: '/dashboard',
    component: '',
    icon: 'DataAnalysis',
    sort: 1,
    noCache: 0,
    status: 1,
    description: '',
    children: [
      {
        id: 11,
        parentId: 1,
        permissionName: '运营概览',
        permissionCode: 'dashboard:view',
        permissionType: 2,
        path: 'index',
        component: 'dashboard/index',
        icon: '',
        sort: 1,
        noCache: 0,
        status: 1,
        description: ''
      }
    ]
  },
  {
    id: 2,
    parentId: 0,
    permissionName: '业务管理',
    permissionCode: 'business',
    permissionType: 1,
    path: '/business',
    component: '',
    icon: 'Goods',
    sort: 2,
    noCache: 0,
    status: 1,
    description: '',
    children: [
      {
        id: 21,
        parentId: 2,
        permissionName: '交易流水',
        permissionCode: 'business:transaction:view',
        permissionType: 2,
        path: 'transaction',
        component: 'business/transaction/index',
        icon: '',
        sort: 1,
        noCache: 0,
        status: 1,
        description: '',
        children: [
          {
            id: 211,
            parentId: 21,
            permissionName: '导出交易',
            permissionCode: 'business:transaction:export',
            permissionType: 3,
            path: '',
            component: '',
            icon: '',
            sort: 1,
            noCache: 0,
            status: 1,
            description: ''
          },
          {
            id: 212,
            parentId: 21,
            permissionName: '审核交易',
            permissionCode: 'business:transaction:audit',
            permissionType: 3,
            path: '',
            component: '',
            icon: '',
            sort: 2,
            noCache: 0,
            status: 1,
            description: ''
          }
        ]
      },
      {
        id: 22,
        parentId: 2,
        permissionName: '渠道管理',
        permissionCode: 'business:channel:view',
        permissionType: 2,
        path: 'channel',
        component: 'business/channel/index',
        icon: '',
        sort: 2,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 23,
        parentId: 2,
        permissionName: '产品管理',
        permissionCode: 'business:product:view',
        permissionType: 2,
        path: 'product',
        component: 'business/product/index',
        icon: '',
        sort: 3,
        noCache: 0,
        status: 1,
        description: ''
      }
    ]
  },
  {
    id: 3,
    parentId: 0,
    permissionName: '审核管理',
    permissionCode: 'audit',
    permissionType: 1,
    path: '/audit',
    component: '',
    icon: 'Clock',
    sort: 3,
    noCache: 0,
    status: 1,
    description: '',
    children: [
      {
        id: 31,
        parentId: 3,
        permissionName: '待审核',
        permissionCode: 'audit:pending:view',
        permissionType: 2,
        path: 'pending',
        component: 'audit/pending/index',
        icon: '',
        sort: 1,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 32,
        parentId: 3,
        permissionName: '审计历史',
        permissionCode: 'audit:history:view',
        permissionType: 2,
        path: 'history',
        component: 'audit/history/index',
        icon: '',
        sort: 2,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 33,
        parentId: 3,
        permissionName: '审核规则',
        permissionCode: 'audit:rule:view',
        permissionType: 2,
        path: 'rule',
        component: 'audit/rule/index',
        icon: '',
        sort: 3,
        noCache: 0,
        status: 1,
        description: ''
      }
    ]
  },
  {
    id: 4,
    parentId: 0,
    permissionName: '系统管理',
    permissionCode: 'system',
    permissionType: 1,
    path: '/system',
    component: '',
    icon: 'Setting',
    sort: 4,
    noCache: 0,
    status: 1,
    description: '',
    children: [
      {
        id: 41,
        parentId: 4,
        permissionName: '用户管理',
        permissionCode: 'system:user:view',
        permissionType: 2,
        path: 'user',
        component: 'system/user/index',
        icon: '',
        sort: 1,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 42,
        parentId: 4,
        permissionName: '角色管理',
        permissionCode: 'system:role:view',
        permissionType: 2,
        path: 'role',
        component: 'system/role/index',
        icon: '',
        sort: 2,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 43,
        parentId: 4,
        permissionName: '权限管理',
        permissionCode: 'system:permission:view',
        permissionType: 2,
        path: 'permission',
        component: 'system/permission/index',
        icon: '',
        sort: 3,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 44,
        parentId: 4,
        permissionName: '机构管理',
        permissionCode: 'system:org:view',
        permissionType: 2,
        path: 'org',
        component: 'system/org/index',
        icon: '',
        sort: 4,
        noCache: 0,
        status: 1,
        description: ''
      },
      {
        id: 45,
        parentId: 4,
        permissionName: '操作日志',
        permissionCode: 'system:log:view',
        permissionType: 2,
        path: 'log',
        component: 'system/log/index',
        icon: '',
        sort: 5,
        noCache: 0,
        status: 1,
        description: ''
      }
    ]
  }
]

const permissionTree = computed(() => {
  const buildTree = (items: Permission[]): Permission[] => {
    return items.map((item) => ({
      ...item,
      children: item.children ? buildTree(item.children) : undefined
    }))
  }
  return buildTree(mockPermissions)
})

const resetPermissionForm = (): void => {
  permissionForm.id = 0
  permissionForm.parentId = 0
  permissionForm.permissionName = ''
  permissionForm.permissionCode = ''
  permissionForm.permissionType = 2
  permissionForm.path = ''
  permissionForm.component = ''
  permissionForm.icon = ''
  permissionForm.sort = 100
  permissionForm.noCache = 0
  permissionForm.status = 1
  permissionForm.description = ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    tableData.value = mockPermissions
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  fetchData()
}

const handleReset = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as Permission[]
}

const expandAll = (expand: boolean): void => {
  ElMessage.info(expand ? '已全部展开' : '已全部折叠')
}

const handleAdd = (): void => {
  formMode.value = 'addRoot'
  permissionForm.parentId = 0
  permissionForm.permissionType = 1
  resetPermissionForm()
  formDialogVisible.value = true
}

const handleAddChild = (row: Permission): void => {
  formMode.value = 'add'
  resetPermissionForm()
  permissionForm.parentId = row.id
  permissionForm.permissionType = row.permissionType === 1 ? 2 : 3
  formDialogVisible.value = true
}

const handleEdit = (row: Permission): void => {
  formMode.value = 'edit'
  Object.assign(permissionForm, {
    id: row.id,
    parentId: row.parentId,
    permissionName: row.permissionName,
    permissionCode: row.permissionCode,
    permissionType: row.permissionType,
    path: row.path,
    component: row.component,
    icon: row.icon,
    sort: row.sort,
    noCache: row.noCache,
    status: row.status,
    description: row.description
  })
  formDialogVisible.value = true
}

const handleEnable = async (row: Permission): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要启用权限 "${row.permissionName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('启用成功')
    fetchData()
  } catch {}
}

const handleDisable = async (row: Permission): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要禁用权限 "${row.permissionName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('禁用成功')
    fetchData()
  } catch {}
}

const handleDelete = async (row: Permission): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除权限 "${row.permissionName}" 吗？此操作不可恢复。`, '警告', {
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
      `确定要删除选中的 ${selectedRows.value.length} 个权限吗？此操作不可恢复。`,
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
  permissionFormRef.value?.resetFields()
  resetPermissionForm()
}

const handleSubmit = async (): Promise<void> => {
  const valid = await permissionFormRef.value?.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  setTimeout(() => {
    ElMessage.success(
      formMode.value === 'edit' ? '编辑成功' : '新增成功'
    )
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
.ccb-system-permission {
  .ccb-permission-card {
    border-radius: 4px;
  }
}
</style>
