<template>
  <div class="system-role-page">
    <FinFilter
      ref="filterRef"
      :filters="filterConfig"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="table-wrapper">
      <div class="toolbar">
        <el-button
          v-permission="'system:role:add'"
          type="primary"
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
        <el-button
          v-permission="'system:role:batchDelete'"
          type="danger"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>

      <FinTable
        :columns="tableColumns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :selection="true"
        :show-index="true"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #status="{ row }">
          <el-tag :type="ROLE_STATUS_COLORS[row.status]">
            {{ ROLE_STATUS_LABELS[row.status] }}
          </el-tag>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link @click="handleView(row)">
            查看
          </el-button>
          <el-button type="primary" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button
            v-permission="'system:role:assignPermission'"
            type="primary"
            link
            @click="handleAssignPermission(row)"
          >
            分配权限
          </el-button>
          <el-button
            v-permission="'system:role:delete'"
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </FinTable>
    </div>

    <FinDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      :loading="dialogLoading"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    >
      <el-form
        v-if="dialogType === 'add' || dialogType === 'edit' || dialogType === 'view'"
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="formData.roleCode"
            :disabled="dialogType === 'view' || dialogType === 'edit'"
            placeholder="请输入角色编码"
          />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="formData.roleName"
            :disabled="dialogType === 'view'"
            placeholder="请输入角色名称"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            :disabled="dialogType === 'view'"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status" :disabled="dialogType === 'view'">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div v-if="dialogType === 'assignPermission'" class="assign-permission-content">
        <el-tree
          ref="treeRef"
          :data="permissionTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          :default-expanded-keys="expandedKeys"
        />
      </div>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules, TreeInstance } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/hooks/usePermission'
import { ROLE_STATUS_LABELS, ROLE_STATUS_COLORS } from '@/constants/dictionaries'
import * as roleApi from '@/api/role'
import * as permissionApi from '@/api/permission'
import type { IRole, IPermission } from '@/types/api'

const { hasPerm } = usePermission()

const filterRef = ref()
const formRef = ref<FormInstance>()
const treeRef = ref<TreeInstance>()

const loading = ref(false)
const tableData = ref<IRole[]>([])
const selectedIds = ref<number[]>([])

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: 20,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

const filterConfig = [
  {
    prop: 'keyword',
    label: '关键字',
    type: 'input',
    placeholder: '角色名称/编码'
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 }
    ]
  }
]

const tableColumns = [
  { prop: 'roleCode', label: '角色编码', minWidth: 150 },
  { prop: 'roleName', label: '角色名称', minWidth: 150 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' },
  { prop: 'createdAt', label: '创建时间', minWidth: 180, type: 'datetime' }
]

const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogType = ref<'add' | 'edit' | 'view' | 'assignPermission'>('add')
const currentRole = ref<IRole | null>(null)

const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    add: '新增角色',
    edit: '编辑角色',
    view: '查看角色',
    assignPermission: '分配权限'
  }
  return titles[dialogType.value]
})

const dialogWidth = computed(() => {
  return dialogType.value === 'assignPermission' ? '600px' : '500px'
})

const formData = reactive<Partial<IRole>>({
  roleCode: '',
  roleName: '',
  description: '',
  status: 1
})

const formRules: FormRules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const permissionTree = ref<IPermission[]>([])
const checkedPermissions = ref<number[]>([])
const expandedKeys = ref<number[]>([])

const treeProps = {
  children: 'children',
  label: 'permName'
}

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterRef.value?.formData
    }
    const res = await roleApi.getList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function fetchPermissionTree() {
  try {
    const res = await permissionApi.getTree()
    permissionTree.value = res.data
    expandedKeys.value = res.data.map((item) => item.id)
  } catch (error) {
    console.error('获取权限树失败:', error)
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  pagination.page = 1
  fetchList()
}

function handleSelectionChange(selection: IRole[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchList()
}

function resetForm() {
  Object.assign(formData, {
    roleCode: '',
    roleName: '',
    description: '',
    status: 1
  })
  formRef.value?.clearValidate()
}

function handleAdd() {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

async function handleView(row: IRole) {
  dialogType.value = 'view'
  currentRole.value = row
  const res = await roleApi.getById(row.id)
  Object.assign(formData, res.data)
  dialogVisible.value = true
}

async function handleEdit(row: IRole) {
  dialogType.value = 'edit'
  currentRole.value = row
  const res = await roleApi.getById(row.id)
  Object.assign(formData, res.data)
  dialogVisible.value = true
}

async function handleAssignPermission(row: IRole) {
  dialogType.value = 'assignPermission'
  currentRole.value = row
  await fetchPermissionTree()
  const res = await roleApi.getRolePermissions(row.id)
  checkedPermissions.value = res.data
  dialogVisible.value = true
}

async function handleDelete(row: IRole) {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning'
    })
    await roleApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个角色吗？`, '提示', {
      type: 'warning'
    })
    await roleApi.batchRemove(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

async function handleDialogConfirm() {
  if (dialogType.value === 'add') {
    await formRef.value?.validate()
    dialogLoading.value = true
    try {
      await roleApi.create(formData)
      ElMessage.success('新增成功')
      dialogVisible.value = false
      fetchList()
    } catch (error) {
      console.error('新增失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else if (dialogType.value === 'edit') {
    await formRef.value?.validate()
    dialogLoading.value = true
    try {
      await roleApi.update(currentRole.value!.id, formData)
      ElMessage.success('编辑成功')
      dialogVisible.value = false
      fetchList()
    } catch (error) {
      console.error('编辑失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else if (dialogType.value === 'assignPermission') {
    dialogLoading.value = true
    try {
      const checkedNodes = treeRef.value?.getCheckedKeys(false) as number[]
      const halfCheckedNodes = treeRef.value?.getHalfCheckedKeys() as number[]
      const allChecked = [...checkedNodes, ...halfCheckedNodes]
      await roleApi.assignPermissions(currentRole.value!.id, allChecked)
      ElMessage.success('分配权限成功')
      dialogVisible.value = false
    } catch (error) {
      console.error('分配权限失败:', error)
    } finally {
      dialogLoading.value = false
    }
  } else {
    dialogVisible.value = false
  }
}

function handleDialogCancel() {
  dialogVisible.value = false
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.system-role-page {
  padding: 20px;

  .table-wrapper {
    background-color: #fff;
    border-radius: 4px;
    padding: 20px;

    .toolbar {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
    }
  }

  .assign-permission-content {
    :deep(.el-tree) {
      max-height: 50vh;
      overflow-y: auto;
    }
  }
}
</style>
