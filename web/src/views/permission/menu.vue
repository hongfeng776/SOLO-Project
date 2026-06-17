<template>
  <div class="page-container menu-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 140px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
            <el-option label="闲置未使用" value="idle" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属模块">
          <el-select v-model="queryParams.module" placeholder="请选择" clearable style="width: 140px">
            <el-option v-for="item in PERMISSION_MODULE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="层级">
          <el-select v-model="queryParams.level" placeholder="请选择" clearable style="width: 130px">
            <el-option v-for="item in PERMISSION_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="菜单名称/编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button type="info" :icon="Filter" @click="showIdleOnly = !showIdleOnly">
            {{ showIdleOnly ? '显示全部' : '仅看闲置' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseTable
        ref="tableRef"
        :data="tableData"
        :loading="loading"
        row-key="id"
        :show-pagination="false"
        :show-index="false"
        :tree-props="{ children: 'children' }"
        :row-class-name="getRowClass"
        @selection-change="handleSelectionChange"
        default-expand-all
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAdd()">新增菜单</el-button>
            <el-button type="success" :icon="Expand" @click="expandAll">展开全部</el-button>
            <el-button :icon="Fold" @click="collapseAll">收起全部</el-button>
            <el-button type="warning" :icon="Sort" @click="handleSaveBatchSort" :disabled="!hasSortChanged">
              保存排序调整
            </el-button>
          </div>
          <div v-if="selectedIds.length > 0" class="batch-operation-bar">
            <span class="selected-count">已选择 <em>{{ selectedIds.length }}</em> 条</span>
            <el-button :disabled="selectedIds.length === 0" @click="handleBatchStatus(1)">批量启用</el-button>
            <el-button :disabled="selectedIds.length === 0" @click="handleBatchStatus(0)">批量禁用</el-button>
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
            <el-button size="small" text @click="clearSelection">取消选择</el-button>
          </div>
        </template>

        <el-table-column type="selection" width="50" align="center" :selectable="(row) => !(row as PermissionItem).isSystem" />
        <el-table-column label="模块" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="moduleTagType((row as PermissionItem).module)">
              {{ PERMISSION_MODULE_MAP[(row as PermissionItem).module || ''] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="菜单名称" min-width="200">
          <template #default="{ row }">
            <div class="menu-name-cell">
              <el-icon v-if="(row as PermissionItem).icon" class="menu-icon" :class="{ 'system-menu': (row as PermissionItem).isSystem }">
                <component :is="getIcon((row as PermissionItem).icon as string)" />
              </el-icon>
              <span class="menu-name" :class="{ 'system-menu': (row as PermissionItem).isSystem }">
                {{ (row as PermissionItem).label }}
              </span>
              <el-tag v-if="(row as PermissionItem).isSystem" type="danger" size="small" class="ml-1">内置</el-tag>
            </div>
          </template>
        </el-table-column>
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
        <el-table-column label="层级" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="(row as PermissionItem).level" size="small" :type="(row as PermissionItem).level === 1 ? 'danger' : (row as PermissionItem).level === 2 ? 'warning' : 'success'">
              L{{ (row as PermissionItem).level }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="100" align="center">
          <template #default="{ row }">
            <el-input-number
              :model-value="(row as PermissionItem).sort"
              size="small"
              :min="0"
              :max="999"
              controls-position="right"
              :disabled="(row as PermissionItem).isSystem"
              @update:model-value="(val) => handleSortChange((row as PermissionItem).id, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ (row as PermissionItem).createdByName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="(row as PermissionItem).status === 1"
              :disabled="(row as PermissionItem).isSystem"
              @change="(val) => handleStatusChange(row as PermissionItem, val ? 1 : 0)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(val: string) => handleAdd(row as PermissionItem, val)" :disabled="(row as PermissionItem).isSystem">
              <el-button type="primary" link size="small" :icon="Plus">
                新增 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="'directory'">新增目录</el-dropdown-item>
                  <el-dropdown-item :command="'menu'">新增菜单</el-dropdown-item>
                  <el-dropdown-item :command="'button'">新增按钮</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as PermissionItem)" :disabled="(row as PermissionItem).isSystem">编辑</el-button>
            <el-button type="danger" link :icon="Delete" :disabled="(row as PermissionItem).isSystem" @click="triggerDelete(row as PermissionItem)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <BaseEmpty description="暂无菜单数据" />
        </template>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :loading="dialogLoading"
      width="720px"
      class="zoom-in-dialog"
      @confirm="handleSubmit"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" class="glow-input" :disabled="isEdit && isSystemMenu">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="上级菜单">
              <el-tree-select v-model="formData.parentId" :data="parentOptions" :props="{ label: 'label', children: 'children' }" value-key="id" check-strictly clearable placeholder="顶级菜单" style="width: 100%" />
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
            <el-form-item label="所属模块" prop="module">
              <el-select v-model="formData.module" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in PERMISSION_MODULE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="层级">
              <el-tag :type="formLevelTagType" size="small">
                {{ formData.level ? `L${formData.level}` : '自动判断' }}
              </el-tag>
              <span v-if="formData.level && formData.level > 3" class="text-danger" style="margin-left: 8px">
                最多支持三级菜单
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="label">
              <el-input
                v-model="formData.label"
                placeholder="请输入"
                maxlength="50"
                show-word-limit
                @blur="validateField('label')"
                :class="{ 'shake-animation': shakeFields.label }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限编码" prop="code">
              <el-input
                v-model="formData.code"
                placeholder="如 system:user:list"
                maxlength="100"
                show-word-limit
                :class="{ 'shake-animation': shakeFields.code }"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.type !== 'button'" :span="12">
            <el-form-item label="路由路径" prop="path">
              <el-input
                v-model="formData.path"
                placeholder="如：/system/user"
                @blur="validatePath"
                :class="{ 'shake-animation': shakeFields.path }"
              />
              <div v-if="pathError" class="text-danger form-error-tip">{{ pathError }}</div>
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
              <el-select v-model="formData.icon" placeholder="请选择" filterable clearable style="width: 100%">
                <el-option v-for="icon in iconOptions" :key="icon.value" :value="icon.value" :label="icon.label">
                  <span style="display: flex; align-items: center; gap: 8px">
                    <el-icon><component :is="getIcon(icon.value)" /></el-icon>{{ icon.label }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可见范围" prop="visibleRange">
              <el-select v-model="visibleRangeValue" placeholder="请选择" style="width: 100%" @change="handleVisibleRangeChange">
                <el-option v-for="item in VISIBLE_RANGE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-alert v-if="isEdit && isSystemMenu" type="warning" :closable="false" show-icon title="系统内置菜单仅可查看，禁止修改" />
      </el-form>
    </BaseDialog>

    <BaseDialog v-model="dependencyVisible" title="删除依赖检查" width="480px" :hide-footer="true">
      <div class="dependency-check">
        <template v-if="deleteDependencies">
          <div v-if="deleteDependencies.dependencies && deleteDependencies.dependencies.length > 0">
            <el-alert :title="deleteDependencies.canDelete ? '存在使用记录，删除后可能影响业务' : '存在绑定数据，禁止删除'" :type="deleteDependencies.canDelete ? 'warning' : 'error'" show-icon :closable="false" />
            <div class="dependency-list">
              <div v-for="(dep, idx) in deleteDependencies.dependencies" :key="idx" class="dependency-item">
                <el-icon><WarningFilled /></el-icon>
                <span class="dep-desc">{{ dep.description }}</span>
                <el-tag size="small" :type="dep.type === 'access_log' ? 'info' : 'danger'">{{ dep.count }} 条</el-tag>
              </div>
            </div>
            <div style="margin-top: 16px; text-align: right">
              <el-button @click="dependencyVisible = false">取消</el-button>
              <el-button v-if="deleteDependencies.canDelete" type="danger" @click="confirmDeleteForce">确认删除</el-button>
            </div>
          </div>
          <div v-else>
            <el-alert title="未检测到关联数据，可安全删除" type="success" show-icon :closable="false" />
            <div style="margin-top: 16px; text-align: right">
              <el-button @click="dependencyVisible = false">取消</el-button>
              <el-button type="danger" @click="confirmDeleteForce">确认删除</el-button>
            </div>
          </div>
        </template>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted, nextTick } from 'vue'
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
  Sort,
  Filter,
  WarningFilled,
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
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { useDialog } from '@/composables/useDialog'
import {
  STATUS_OPTIONS,
  PERMISSION_TYPE_MAP,
  PERMISSION_MODULE_OPTIONS,
  PERMISSION_MODULE_MAP,
  PERMISSION_LEVEL_OPTIONS,
  VISIBLE_RANGE_OPTIONS,
} from '@/constants'
import {
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission,
  checkPermissionDependencies,
  batchUpdatePermissionStatus,
  batchSortPermissions,
  getIdlePermissions,
  type PermissionItem,
  type PermissionDependencies,
  type BatchSortItem,
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

function moduleTagType(module?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    dashboard: 'success',
    system: 'danger',
    channel: 'primary',
    promoter: 'warning',
    order: 'info',
    commission: 'success',
    marketing: 'warning',
    withdraw: 'primary',
    log: 'info',
  }
  return map[module || ''] || 'info'
}

const loading = ref(false)
const tableRef = ref<any>()
const menuList = ref<PermissionItem[]>([])
const idleList = ref<PermissionItem[]>([])
const showIdleOnly = ref(false)
const dateRange = ref<[string, string] | null>(null)
const selectedIds = ref<(string | number)[]>([])
const sortChanges = ref<Map<string | number, number>>(new Map())
const hasSortChanged = computed(() => sortChanges.value.size > 0)

const shakeFields = reactive<Record<string, boolean>>({
  label: false,
  code: false,
  path: false,
})
const pathError = ref('')
let pathValidateTimer: ReturnType<typeof setTimeout> | null = null

const queryParams = reactive({
  keyword: '',
  status: undefined as number | string | undefined,
  module: undefined as string | undefined,
  level: undefined as number | undefined,
})

const tableData = computed(() => {
  let result = showIdleOnly.value ? idleList.value : menuList.value
  if (queryParams.module) {
    result = filterTree(result, (item) => item.module === queryParams.module)
  }
  if (queryParams.level) {
    result = filterTree(result, (item) => item.level === queryParams.level)
  }
  if (queryParams.keyword) {
    const keyword = queryParams.keyword.toLowerCase()
    result = filterTree(result, (item) =>
      item.label?.toLowerCase().includes(keyword) ||
      item.code?.toLowerCase().includes(keyword)
    )
  }
  if (queryParams.status !== undefined && queryParams.status !== '' && queryParams.status !== 'idle') {
    const statusVal = Number(queryParams.status)
    result = filterTree(result, (item) => {
      const itemStatus = typeof item.status === 'string'
        ? (item.status === 'enable' ? 1 : 0)
        : item.status
      return itemStatus === statusVal
    })
  }
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime()
    result = filterTree(result, (item) => {
      if (!item.createdAt) return false
      const t = new Date(item.createdAt).getTime()
      return t >= start && t <= end
    })
  }
  return result
})

function filterTree(list: any[], predicate: (item: any) => boolean): any[] {
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
    idleList.value = await getIdlePermissions({}).catch(() => [])
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
  queryParams.module = undefined
  queryParams.level = undefined
  dateRange.value = null
  showIdleOnly.value = false
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

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection
    .filter((item) => !item.isSystem)
    .map((item) => item.id)
}

function clearSelection() {
  const table = tableRef.value as any
  table?.tableRef?.clearSelection?.()
  selectedIds.value = []
}

function getRowClass({ rowIndex }: { row: any; rowIndex: number }) {
  const classes: string[] = []
  if (rowIndex % 2 === 1) {
    classes.push('row-alt')
  }
  return classes.join(' ')
}

function handleSortChange(id: string | number, val: number | undefined) {
  if (val === undefined) return
  sortChanges.value.set(id, val)
  const updateInTree = (list: any[]): boolean => {
    for (const item of list) {
      if (item.id === id) {
        item.sort = val
        return true
      }
      if (item.children?.length && updateInTree(item.children)) return true
    }
    return false
  }
  updateInTree(menuList.value)
}

async function handleSaveBatchSort() {
  if (!hasSortChanged.value) return
  try {
    const items: BatchSortItem[] = []
    sortChanges.value.forEach((sort, id) => {
      items.push({ id, sort })
    })
    await batchSortPermissions(items)
    ElMessage.success('排序保存成功')
    sortChanges.value.clear()
    fetchMenuList()
  } catch (error) {
    console.error(error)
    ElMessage.error('排序保存失败')
  }
}

async function handleBatchStatus(status: number) {
  if (selectedIds.value.length === 0) return
  try {
    const res = await batchUpdatePermissionStatus(selectedIds.value, status)
    ElMessage.success(`批量${status === 1 ? '启用' : '禁用'}成功 ${res.success.length} 条`)
    clearSelection()
    fetchMenuList()
  } catch (error) {
    console.error(error)
    ElMessage.error('批量操作失败')
  }
}

function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  ElMessage.info(`批量删除 ${selectedIds.value.length} 条菜单（功能需结合依赖校验）`)
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
  close: closeDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const isSystemMenu = computed(() => !!dialogData.isSystem)
const dialogTitle = computed(() => {
  if (isEdit.value) return '编辑菜单'
  const typeMap: Record<string, string> = {
    directory: '新增目录',
    menu: '新增菜单',
    button: '新增按钮',
  }
  return typeMap[formData.type] || '新增菜单'
})

const formLevelTagType = computed<'primary' | 'success' | 'warning' | 'danger' | 'info'>(() => {
  const level = formData.level
  if (!level) return 'info'
  if (level === 1) return 'danger'
  if (level === 2) return 'warning'
  if (level === 3) return 'success'
  return 'danger'
})

const visibleRangeValue = ref<string>('all')

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
  module: undefined,
  level: undefined,
  visibleRange: ['all'],
  isSystem: false,
})

const formRules: FormRules = {
  label: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_:]+$/, message: '只能包含字母、数字、下划线和冒号', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  module: [{ required: true, message: '请选择所属模块', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function triggerShake(field: string) {
  shakeFields[field] = true
  setTimeout(() => {
    shakeFields[field] = false
  }, 500)
}

function validateField(field: string) {
  nextTick(() => {
    formRef.value?.validateField(field, (err) => {
      if (err) triggerShake(field)
    })
  })
}

function validatePath() {
  pathError.value = ''
  if (!formData.path || formData.type === 'button') return
  if (pathValidateTimer) clearTimeout(pathValidateTimer)
  pathValidateTimer = setTimeout(() => {
    const exists = (list: any[]): boolean => {
      for (const item of list) {
        if (item.id !== formData.id && item.path === formData.path) return true
        if (item.children?.length && exists(item.children)) return true
      }
      return false
    }
    if (exists(menuList.value)) {
      pathError.value = '该路径已存在，请更换'
      triggerShake('path')
    }
  }, 300)
}

function calculateLevel() {
  if (!formData.parentId) {
    formData.level = 1
    return
  }
  const findParent = (list: any[]): any => {
    for (const item of list) {
      if (item.id === formData.parentId) return item
      if (item.children?.length) {
        const found = findParent(item.children)
        if (found) return found
      }
    }
    return null
  }
  const parent = findParent(menuList.value)
  formData.level = parent ? (parent.level || 1) + 1 : 1
  if (formData.level > 3) {
    ElMessage.warning('最多支持三级菜单')
  }
}

function handleVisibleRangeChange(val: string) {
  if (val === 'custom') {
    formData.visibleRange = []
  } else {
    formData.visibleRange = [val]
  }
  if (formData.type === 'button' && !formData.visibleRange?.includes('all')) {
    formData.visibleRange = [...(formData.visibleRange || []), 'manager']
  }
}

function handleAdd(row?: PermissionItem, type: string = 'menu') {
  pathError.value = ''
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
    module: row?.module,
    level: undefined,
    visibleRange: ['all'],
    isSystem: false,
  })
  visibleRangeValue.value = 'all'
  calculateLevel()
  openDialog()
}

function handleEdit(row: PermissionItem) {
  pathError.value = ''
  Object.assign(formData, row, {
    parentId: row.parentId || undefined,
    visibleRange: row.visibleRange || ['all'],
  })
  visibleRangeValue.value = row.visibleRange?.includes('custom')
    ? 'custom'
    : (row.visibleRange?.[0] || 'all')
  calculateLevel()
  openDialog(row)
}

const dependencyVisible = ref(false)
const deleteDependencies = ref<PermissionDependencies | null>(null)
const pendingDeleteId = ref<string | number | null>(null)

async function triggerDelete(row: PermissionItem) {
  pendingDeleteId.value = row.id
  try {
    deleteDependencies.value = await checkPermissionDependencies(row.id)
  } catch (error) {
    console.error(error)
    deleteDependencies.value = { hasDependencies: false, canDelete: true, dependencies: [] }
  }
  dependencyVisible.value = true
}

async function confirmDeleteForce() {
  if (pendingDeleteId.value === null) return
  try {
    await deletePermission(pendingDeleteId.value)
    ElMessage.success('删除成功')
    dependencyVisible.value = false
    pendingDeleteId.value = null
    deleteDependencies.value = null
    fetchMenuList()
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败')
  }
}

async function handleStatusChange(row: PermissionItem, status: number) {
  try {
    await updatePermission(row.id, { status })
    ElMessage.success(`${status === 1 ? '启用' : '禁用'}成功`)
    fetchMenuList()
  } catch (error) {
    console.error(error)
    ElMessage.error('操作失败')
    fetchMenuList()
  }
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

watch(
  () => formData.parentId,
  () => {
    calculateLevel()
  }
)

async function handleSubmit() {
  if (isEdit.value && isSystemMenu.value) {
    closeDialog()
    return
  }
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      Object.keys(shakeFields).forEach((k) => triggerShake(k))
      return
    }
    if (formData.level && formData.level > 3) {
      ElMessage.warning('最多支持三级菜单')
      return
    }
    dialogLoading.value = true
    try {
      const payload: Partial<PermissionItem> = {
        ...formData,
      }
      if (isEdit.value) {
        await updatePermission(formData.id, payload)
        ElMessage.success('编辑成功')
      } else {
        await createPermission(payload)
        ElMessage.success('新增成功')
      }
      closeDialog()
      fetchMenuList()
    } catch (error) {
      console.error(error)
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    } finally {
      dialogLoading.value = false
    }
  })
}

void STATUS_OPTIONS
</script>

<style scoped lang="scss">
.menu-page {
  .search-form {
    margin-bottom: 0;
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .batch-operation-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
    margin-bottom: 16px;

    .selected-count {
      font-size: 14px;
      color: var(--el-text-color-primary);
      flex-shrink: 0;

      em {
        color: var(--el-color-primary);
        font-weight: 600;
        font-style: normal;
        margin: 0 2px;
      }
    }
  }

  .menu-name-cell {
    display: flex;
    align-items: center;
  }

  .menu-icon {
    margin-right: 8px;
    color: var(--el-color-primary);
  }

  .menu-icon.system-menu {
    color: var(--el-color-danger);
  }

  .menu-name.system-menu {
    color: var(--el-color-danger);
    font-weight: 500;
  }

  .ml-1 {
    margin-left: 8px;
  }

  .text-danger {
    color: var(--el-color-danger);
    font-size: 12px;
  }

  .form-error-tip {
    margin-top: 4px;
    line-height: 1.2;
  }

  :deep(.row-alt) {
    background-color: var(--el-fill-color-lighter);
  }

  .glow-input :deep(.el-input__wrapper.is-focus) {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 0 8px 2px rgba(64, 158, 255, 0.3);
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }

  .shake-animation {
    animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
  }

  @keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-4px); }
    40%, 60% { transform: translateX(4px); }
  }

  .zoom-in-dialog :deep(.el-dialog) {
    animation: zoomIn 0.25s cubic-bezier(0.23, 1, 0.32, 1);
    transform-origin: center center;
  }

  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  .dependency-check {
    .dependency-list {
      margin-top: 16px;
    }

    .dependency-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      margin-bottom: 8px;

      .dep-desc {
        flex: 1;
      }
    }
  }
}
</style>
