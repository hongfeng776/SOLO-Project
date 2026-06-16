<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="角色名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入角色名称"
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
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
          </div>
        </template>
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="code" label="角色编码" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="用户数" width="80" align="center">
          <template #default="{ row }">
            {{ (row as RoleItem).userCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="STATUS_MAP[(row as RoleItem).status as any]?.type || 'info'">
              {{ STATUS_MAP[(row as RoleItem).status as any]?.label || (row as RoleItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Key"
              @click="handleAssignPermission(row as RoleItem)"
            >
              分配权限
            </el-button>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as RoleItem)">编辑</el-button>
            <BaseConfirm @confirm="handleDelete((row as RoleItem).id)">
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
      width="550px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入角色编码，如 admin、user" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="permissionVisible"
      :title="`分配权限 - ${currentRole?.name || ''}`"
      :loading="permissionLoading"
      width="500px"
      @confirm="handleAssignPermissionSubmit"
    >
      <div class="permission-tree-wrapper">
        <el-tree
          ref="permissionTreeRef"
          v-loading="permissionLoading"
          :data="permissionTree"
          :props="{ label: 'label', children: 'children' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissionIds"
          :expand-on-click-node="false"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-icon v-if="data.type === 'directory'" class="mr-1"><Folder /></el-icon>
              <el-icon v-else-if="data.type === 'menu'" class="mr-1"><Document /></el-icon>
              <el-icon v-else class="mr-1"><Pointer /></el-icon>
              <span>{{ node.label }}</span>
              <el-tag v-if="data.type" size="small" class="ml-2" :type="getPermissionTypeTag(data.type)">
                {{ getPermissionTypeLabel(data.type) }}
              </el-tag>
            </span>
          </template>
        </el-tree>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { ElTree } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Delete,
  Key,
  Folder,
  Document,
  Pointer,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseConfirm from '@/components/common/BaseConfirm.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { STATUS_OPTIONS, STATUS_MAP } from '@/constants'
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getPermissionList,
  getRolePermissions,
  assignRolePermissions,
  type RoleItem,
  type RoleQueryParams,
  type PermissionItem,
} from '@/api/permission'

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
  handleDelete: doDelete,
} = useTable<RoleItem, RoleQueryParams>({
  fetchApi: getRoleList,
  deleteApi: deleteRole,
})

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => (isEdit.value ? '编辑角色' : '新增角色'))

const formData = reactive<any>({
  name: '',
  code: '',
  description: '',
  sort: 0,
  status: 1,
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字、下划线', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function handleAdd() {
  Object.assign(formData, {
    name: '',
    code: '',
    description: '',
    sort: 0,
    status: 1,
  })
  openDialog()
}

function handleEdit(row: RoleItem) {
  Object.assign(formData, row)
  openDialog(row)
}

function handleDelete(id: string | number) {
  doDelete(id)
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    dialogLoading.value = true
    try {
      if (isEdit.value) {
        await updateRole(dialogData.id, formData)
        ElMessage.success('编辑成功')
      } else {
        await createRole(formData)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      handleSearch()
    } catch (error) {
      console.error(error)
    } finally {
      dialogLoading.value = false
    }
  })
}

const permissionVisible = ref(false)
const permissionLoading = ref(false)
const permissionTreeRef = ref<InstanceType<typeof ElTree>>()
const permissionTree = ref<PermissionItem[]>([])
const currentRole = ref<RoleItem | null>(null)
const checkedPermissionIds = ref<(string | number)[]>([])

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

onMounted(() => {
  fetchPermissionTree()
})

async function handleAssignPermission(row: RoleItem) {
  currentRole.value = row
  checkedPermissionIds.value = []
  permissionVisible.value = true
  try {
    permissionLoading.value = true
    checkedPermissionIds.value = await getRolePermissions(row.id)
  } catch (error) {
    console.error(error)
  } finally {
    permissionLoading.value = false
  }
}

async function handleAssignPermissionSubmit() {
  if (!currentRole.value) return
  const checkedKeys = permissionTreeRef.value?.getCheckedKeys(true) || []
  const halfCheckedKeys = permissionTreeRef.value?.getHalfCheckedKeys() || []
  const allIds = [...checkedKeys, ...halfCheckedKeys]

  permissionLoading.value = true
  try {
    await assignRolePermissions(currentRole.value.id, allIds)
    ElMessage.success('权限分配成功')
    permissionVisible.value = false
  } catch (error) {
    console.error(error)
  } finally {
    permissionLoading.value = false
  }
}

function getPermissionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    directory: '目录',
    menu: '菜单',
    button: '按钮',
  }
  return map[type] || ''
}

function getPermissionTypeTag(type: string): 'primary' | 'success' | 'warning' {
  const map: Record<string, 'primary' | 'success' | 'warning'> = {
    directory: 'primary',
    menu: 'success',
    button: 'warning',
  }
  return map[type] || 'primary'
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

.permission-tree-wrapper {
  max-height: 500px;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  font-size: 14px;

  .mr-1 {
    margin-right: 4px;
  }

  .ml-2 {
    margin-left: 8px;
  }
}
</style>
