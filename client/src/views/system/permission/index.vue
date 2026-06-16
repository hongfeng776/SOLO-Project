<template>
  <div class="system-permission-page">
    <div class="table-wrapper">
      <div class="toolbar">
        <el-button
          v-permission="'system:permission:add'"
          type="primary"
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增权限
        </el-button>
      </div>

      <div class="permission-table">
        <el-table
          v-loading="loading"
          :data="tableData"
          :border="true"
          :stripe="true"
          row-key="id"
          :default-expand-all="true"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          highlight-current-row
        >
          <el-table-column
            type="index"
            label="序号"
            width="70"
            align="center"
            fixed="left"
          >
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column
            prop="permName"
            label="权限名称"
            min-width="180"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            prop="permCode"
            label="权限编码"
            min-width="200"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            prop="permType"
            label="权限类型"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="getPermTypeTagType(row.permType)">
                {{ PERM_TYPE_LABELS[row.permType] || row.permType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="path"
            label="路径"
            min-width="200"
            :show-overflow-tooltip="true"
          >
            <template #default="{ row }">
              {{ row.path || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="icon"
            label="图标"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="sortOrder"
            label="排序"
            width="80"
            align="center"
          />
          <el-table-column
            prop="status"
            label="状态"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="PERMISSION_STATUS_COLORS[row.status]">
                {{ PERMISSION_STATUS_LABELS[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="220"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                v-permission="'system:permission:add'"
                type="primary"
                link
                @click="handleAddChild(row)"
              >
                新增子权限
              </el-button>
              <el-button type="primary" link @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button
                v-permission="'system:permission:delete'"
                type="danger"
                link
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <FinDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :loading="dialogLoading"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="上级权限" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="permissionTree"
            :props="{ label: 'permName', value: 'id', children: 'children' }"
            :disabled="dialogType === 'edit' && isTopLevel"
            check-strictly
            :clearable="!isTopLevel"
            placeholder="请选择上级权限"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="permName">
          <el-input
            v-model="formData.permName"
            :disabled="dialogType === 'view'"
            placeholder="请输入权限名称"
          />
        </el-form-item>
        <el-form-item label="权限编码" prop="permCode">
          <el-input
            v-model="formData.permCode"
            :disabled="dialogType === 'view'"
            placeholder="请输入权限编码，如 system:user:add"
          />
        </el-form-item>
        <el-form-item label="权限类型" prop="permType">
          <el-select
            v-model="formData.permType"
            :disabled="dialogType === 'view'"
            placeholder="请选择权限类型"
            style="width: 100%"
          >
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.permType === 'menu'" label="路径" prop="path">
          <el-input
            v-model="formData.path"
            :disabled="dialogType === 'view'"
            placeholder="请输入路由路径，如 /system/user"
          />
        </el-form-item>
        <el-form-item v-if="formData.permType === 'menu'" label="图标" prop="icon">
          <el-input
            v-model="formData.icon"
            :disabled="dialogType === 'view'"
            placeholder="请输入图标名称，如 User"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :disabled="dialogType === 'view'"
            :min="0"
            :max="999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status" :disabled="dialogType === 'view'">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/hooks/usePermission'
import { PERM_TYPE_LABELS, PERMISSION_STATUS_LABELS, PERMISSION_STATUS_COLORS } from '@/constants/dictionaries'
import * as permissionApi from '@/api/permission'
import type { IPermission } from '@/types/api'

const { hasPerm } = usePermission()

const formRef = ref<FormInstance>()

const loading = ref(false)
const tableData = ref<IPermission[]>([])
const permissionTree = ref<IPermission[]>([])

const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogType = ref<'add' | 'edit' | 'view'>('add')
const currentPermission = ref<IPermission | null>(null)
const parentPermission = ref<IPermission | null>(null)

const isTopLevel = computed(() => {
  return dialogType.value === 'edit' && currentPermission.value?.parentId === null
})

const dialogTitle = computed(() => {
  if (dialogType.value === 'add' && parentPermission.value) {
    return `新增【${parentPermission.value.permName}】的子权限`
  }
  const titles: Record<string, string> = {
    add: '新增权限',
    edit: '编辑权限',
    view: '查看权限'
  }
  return titles[dialogType.value]
})

const formData = reactive<Partial<IPermission>>({
  parentId: null,
  permName: '',
  permCode: '',
  permType: 'menu',
  path: '',
  icon: '',
  sortOrder: 0,
  status: 1
})

const formRules: FormRules = {
  permName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  permCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permType: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

function getPermTypeTagType(type: string): string {
  const typeMap: Record<string, string> = {
    menu: 'primary',
    button: 'success',
    api: 'warning'
  }
  return typeMap[type] || 'info'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await permissionApi.getTree()
    tableData.value = res.data
    permissionTree.value = [{ id: 0, permName: '顶级权限', permCode: '', permType: 'menu', parentId: null, path: '', icon: '', sortOrder: 0, status: 1, children: res.data, createdAt: '', updatedAt: '' }]
  } catch (error) {
    console.error('获取权限列表失败:', error)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    parentId: null,
    permName: '',
    permCode: '',
    permType: 'menu',
    path: '',
    icon: '',
    sortOrder: 0,
    status: 1
  })
  formRef.value?.clearValidate()
}

function handleAdd() {
  dialogType.value = 'add'
  parentPermission.value = null
  resetForm()
  dialogVisible.value = true
}

function handleAddChild(row: IPermission) {
  dialogType.value = 'add'
  parentPermission.value = row
  resetForm()
  formData.parentId = row.id
  dialogVisible.value = true
}

async function handleEdit(row: IPermission) {
  dialogType.value = 'edit'
  currentPermission.value = row
  parentPermission.value = null
  const res = await permissionApi.getById(row.id)
  Object.assign(formData, res.data)
  dialogVisible.value = true
}

async function handleDelete(row: IPermission) {
  try {
    await ElMessageBox.confirm('确定要删除该权限吗？删除后子权限也将被删除。', '提示', {
      type: 'warning'
    })
    await permissionApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleDialogConfirm() {
  await formRef.value?.validate()
  dialogLoading.value = true
  try {
    if (dialogType.value === 'add') {
      const data = { ...formData }
      if (!data.parentId) {
        delete data.parentId
      }
      await permissionApi.create(data)
      ElMessage.success('新增成功')
    } else if (dialogType.value === 'edit') {
      const { parentId, ...data } = formData
      await permissionApi.update(currentPermission.value!.id, data)
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    dialogLoading.value = false
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
.system-permission-page {
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

  .permission-table {
    :deep(.el-table) {
      font-size: 13px;
    }

    :deep(.el-table__header th) {
      background-color: #F8FAFC;
      color: var(--fin-text-regular);
      font-weight: 600;
    }

    :deep(.el-table__cell) {
      padding: 8px 12px;
    }
  }
}
</style>
