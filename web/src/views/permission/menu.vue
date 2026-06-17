<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="菜单名称">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入菜单名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseTable
        :data="tableData"
        :loading="loading"
        row-key="id"
        :show-pagination="false"
        :show-index="false"
        :tree-props="{ children: 'children' }"
        default-expand-all
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAdd()">新增菜单</el-button>
            <el-button type="success" :icon="Expand" @click="expandAll">展开全部</el-button>
            <el-button :icon="Fold" @click="collapseAll">收起全部</el-button>
          </div>
        </template>
        <el-table-column prop="label" label="菜单名称" min-width="220" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="PERMISSION_TYPE_MAP[(row as PermissionItem).type]?.type || 'info'">
              {{ PERMISSION_TYPE_MAP[(row as PermissionItem).type]?.label || (row as PermissionItem).type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="权限编码" min-width="180" />
        <el-table-column label="路由/路径" min-width="180">
          <template #default="{ row }">
            {{ (row as PermissionItem).path || (row as PermissionItem).apiUrl || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="请求方法" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="(row as PermissionItem).apiMethod"
              size="small"
              :type="getMethodType((row as PermissionItem).apiMethod as string)"
            >
              {{ ((row as PermissionItem).apiMethod as string).toUpperCase() }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="(row as PermissionItem).icon"><component :is="getIcon((row as PermissionItem).icon as string)" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="(row as PermissionItem).status === 1"
              @change="(val: string | number | boolean) => handleStatusChange(row as PermissionItem, Boolean(val))"
              :width="44"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown
              trigger="click"
              @command="(val: string) => handleAdd(row as PermissionItem, val)"
            >
              <el-button type="primary" link size="small" :icon="Plus">
                新增
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="'directory'">新增目录</el-dropdown-item>
                  <el-dropdown-item :command="'menu'">新增菜单</el-dropdown-item>
                  <el-dropdown-item :command="'button'">新增按钮</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as PermissionItem)">编辑</el-button>
            <BaseConfirm @confirm="handleDelete(row as PermissionItem)">
              <el-button type="danger" link :icon="Delete">删除</el-button>
            </BaseConfirm>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :loading="dialogLoading"
      width="650px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="上级菜单">
              <el-tree-select
                v-model="formData.parentId"
                :data="parentOptions"
                :props="{ label: 'label', children: 'children' }"
                value-key="id"
                check-strictly
                clearable
                placeholder="顶级菜单"
                style="width: 100%"
                :render-after-expand="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="type">
              <el-radio-group v-model="formData.type">
                <el-radio value="directory">目录</el-radio>
                <el-radio value="menu">菜单</el-radio>
                <el-radio value="button">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="label">
              <el-input v-model="formData.label" placeholder="请输入菜单名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限编码" prop="code">
              <el-input v-model="formData.code" placeholder="如：system:user:list" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.type === 'menu' || formData.type === 'directory'" :span="12">
            <el-form-item label="路由路径">
              <el-input v-model="formData.path" placeholder="如：/system/user" />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.type === 'menu'" :span="12">
            <el-form-item label="组件路径">
              <el-input v-model="formData.component" placeholder="如：system/user/index" />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.type === 'button'" :span="12">
            <el-form-item label="接口地址">
              <el-input v-model="formData.apiUrl" placeholder="如：/api/system/users" />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.type === 'button'" :span="12">
            <el-form-item label="请求方法">
              <el-select v-model="formData.apiMethod" placeholder="请选择" clearable style="width: 100%">
                <el-option label="GET" value="get" />
                <el-option label="POST" value="post" />
                <el-option label="PUT" value="put" />
                <el-option label="DELETE" value="delete" />
                <el-option label="PATCH" value="patch" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="formData.type !== 'button'" :span="12">
            <el-form-item label="图标">
              <el-select
                v-model="formData.icon"
                placeholder="请选择图标"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="icon in iconOptions"
                  :key="icon.value"
                  :value="icon.value"
                  :label="icon.label"
                >
                  <div style="display: flex; align-items: center; gap: 8px">
                    <el-icon><component :is="getIcon(icon.value)" /></el-icon>
                    <span>{{ icon.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" />
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
            <el-form-item label="备注">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Delete,
  ArrowDown,
  Expand,
  Fold,
  DataAnalysis,
  Connection,
  User,
  List,
  Money,
  Promotion,
  Wallet,
  Lock,
  Menu,
  UserFilled,
  Setting,
  HomeFilled,
  Document,
  Goods,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseConfirm from '@/components/common/BaseConfirm.vue'
import { useDialog } from '@/composables/useDialog'
import { STATUS_OPTIONS, PERMISSION_TYPE_MAP } from '@/constants'
import {
  getPermissionList,
  type PermissionItem,
} from '@/api/permission'

const iconOptions = [
  { label: '仪表盘', value: 'DataAnalysis' },
  { label: '渠道', value: 'Connection' },
  { label: '用户', value: 'User' },
  { label: '列表', value: 'List' },
  { label: '金额', value: 'Money' },
  { label: '营销', value: 'Promotion' },
  { label: '钱包', value: 'Wallet' },
  { label: '锁', value: 'Lock' },
  { label: '菜单', value: 'Menu' },
  { label: '用户组', value: 'UserFilled' },
  { label: '设置', value: 'Setting' },
  { label: '首页', value: 'HomeFilled' },
  { label: '文档', value: 'Document' },
  { label: '商品', value: 'Goods' },
]

const iconComponentMap: Record<string, any> = {
  DataAnalysis,
  Connection,
  User,
  List,
  Money,
  Promotion,
  Wallet,
  Lock,
  Menu,
  UserFilled,
  Setting,
  HomeFilled,
  Document,
  Goods,
}

function getIcon(name: string) {
  return iconComponentMap[name] || Menu
}

const loading = ref(false)
const tableRef = ref<any>()
const menuList = ref<PermissionItem[]>([])
const queryParams = reactive({
  keyword: '',
  status: undefined as number | string | undefined,
})

const tableData = computed(() => {
  let result = menuList.value
  if (queryParams.keyword) {
    const keyword = queryParams.keyword.toLowerCase()
    result = filterTree(result, (item) =>
      item.label?.toLowerCase().includes(keyword) ||
      item.code?.toLowerCase().includes(keyword)
    )
  }
  if (queryParams.status !== undefined && queryParams.status !== '') {
    const statusVal = Number(queryParams.status)
    result = filterTree(result, (item) => {
      const itemStatus = typeof item.status === 'string'
        ? (item.status === 'enable' ? 1 : 0)
        : item.status
      return itemStatus === statusVal
    })
  }
  return result
})

function filterTree(
  list: any[],
  predicate: (item: any) => boolean
): any[] {
  const result: any[] = []
  for (const item of list) {
    const children = item.children ? filterTree(item.children, predicate) : []
    if (predicate(item) || children.length > 0) {
      result.push({
        ...item,
        children: children.length > 0 ? children : item.children,
      })
    }
  }
  return result
}

async function fetchMenuList() {
  try {
    loading.value = true
    menuList.value = await getPermissionList()
  } catch (error) {
    console.error('Fetch menu list error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMenuList()
})

function handleSearch() {
  fetchMenuList()
}

function handleReset() {
  queryParams.keyword = ''
  queryParams.status = undefined
  handleSearch()
}

function expandAll() {
  toggleExpandAll(true)
}

function collapseAll() {
  toggleExpandAll(false)
}

function toggleExpandAll(expand: boolean) {
  const table = tableRef.value as any
  if (!table?.tableRef?.store?.states) return
  const { treeData } = table.tableRef.store.states
  const traverse = (rows: any[]) => {
    for (const row of rows) {
      table.tableRef.toggleRowExpansion(row, expand)
      if (row.children?.length) {
        traverse(row.children)
      }
    }
  }
  traverse(treeData)
}

const parentOptions = computed(() => {
  const cloneList = (list: any[]): any[] => {
    return list.map((item) => ({
      ...item,
      children: item.children ? cloneList(item.children) : undefined,
    }))
  }
  const options = cloneList(menuList.value)
  if (formData.id) {
    return filterExclude(options, formData.id as any)
  }
  return options
})

function filterExclude(list: any[], excludeId: string | number): any[] {
  const result: any[] = []
  for (const item of list) {
    if (item.id === excludeId) continue
    const children = item.children ? filterExclude(item.children, excludeId) : undefined
    result.push({
      ...item,
      children: children?.length ? children : undefined,
    })
  }
  return result
}

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => {
  if (isEdit.value) return '编辑菜单'
  const typeMap: Record<string, string> = {
    directory: '新增目录',
    menu: '新增菜单',
    button: '新增按钮',
  }
  return typeMap[formData.type] || '新增菜单'
})

const formData = reactive<any>({
  id: undefined,
  parentId: undefined,
  type: 'menu',
  label: '',
  code: '',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1,
  remark: '',
  apiUrl: '',
  apiMethod: undefined,
})

const formRules: FormRules = {
  label: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_:]+$/, message: '只能包含字母、数字、下划线和冒号', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function handleAdd(row?: PermissionItem, type: string = 'menu') {
  Object.assign(formData, {
    id: undefined,
    parentId: row?.id,
    type,
    label: '',
    code: row?.code ? `${row.code}:` : '',
    path: row?.path && type !== 'button' ? `${row.path}/` : '',
    component: '',
    icon: '',
    sort: 0,
    status: 1,
    remark: '',
    apiUrl: '',
    apiMethod: undefined,
  })
  openDialog()
}

function handleEdit(row: PermissionItem) {
  Object.assign(formData, row, {
    parentId: row.parentId || undefined,
  })
  openDialog(row)
}

async function handleDelete(_row: PermissionItem) {
  ElMessage.success('删除操作开发中')
  fetchMenuList()
}

async function handleStatusChange(row: PermissionItem, val: boolean) {
  try {
    ElMessage.info(`状态切换：${row.label} -> ${val ? '启用' : '禁用'}`)
    fetchMenuList()
  } catch (error) {
    console.error(error)
  }
}

function getMethodType(method: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    get: 'success',
    post: 'primary',
    put: 'warning',
    delete: 'danger',
    patch: 'info',
  }
  return map[method.toLowerCase()] || 'info'
}

watch(
  () => formData.type,
  () => {
    if (formData.type === 'button') {
      formData.path = ''
      formData.component = ''
      formData.icon = ''
    } else if (formData.type === 'directory') {
      formData.component = ''
      formData.apiUrl = ''
      formData.apiMethod = undefined
    } else {
      formData.apiUrl = ''
      formData.apiMethod = undefined
    }
  }
)

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    dialogLoading.value = true
    try {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchMenuList()
    } catch (error) {
      console.error(error)
    } finally {
      dialogLoading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
  }
}
</style>
