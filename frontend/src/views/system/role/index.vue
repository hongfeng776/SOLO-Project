<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="角色名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">角色管理</span>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增角色</el-button>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
      >
        <el-table-column prop="name" label="角色名称" width="140" />
        <el-table-column prop="code" label="角色编码" width="140" />
        <el-table-column prop="description" label="角色描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="权限数" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary" effect="light">
              {{ row.permissions?.length || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              :disabled="row.code === 'admin'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openForm(row)">编辑</el-button>
            <el-button
              v-if="row.code !== 'admin'"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="600px"
      destroy-on-close
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入角色名称" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色编码" prop="code">
              <el-input v-model="formData.code" :disabled="isEdit" placeholder="请输入角色编码" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="2"
                placeholder="请输入角色描述"
                maxlength="200"
              />
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
            <el-form-item label="分配权限" prop="permissions">
              <el-tree
                ref="permissionTreeRef"
                v-model:checked-keys="checkedKeys"
                :data="permissionTree"
                :props="{ label: 'label', children: 'children' }"
                show-checkbox
                node-key="key"
                default-expand-all
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getRoleList, createRole, updateRole, deleteRole } from '@api/system'
import type { Role } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'

const permissionTree = [
  {
    key: 'content',
    label: '内容管理',
    children: [
      { key: 'content:note:view', label: '查看内容' },
      { key: 'content:note:create', label: '创建内容' },
      { key: 'content:note:edit', label: '编辑内容' },
      { key: 'content:note:delete', label: '删除内容' },
      { key: 'content:review', label: '内容审核' }
    ]
  },
  {
    key: 'creator',
    label: '达人运维',
    children: [
      { key: 'creator:view', label: '查看达人' },
      { key: 'creator:create', label: '新增达人' },
      { key: 'creator:edit', label: '编辑达人' },
      { key: 'creator:qualification', label: '资质审核' }
    ]
  },
  {
    key: 'activity',
    label: '活动运营',
    children: [
      { key: 'activity:view', label: '查看活动' },
      { key: 'activity:create', label: '创建活动' },
      { key: 'activity:edit', label: '编辑活动' },
      { key: 'activity:order', label: '订单管理' }
    ]
  },
  {
    key: 'system',
    label: '系统设置',
    children: [
      { key: 'system:user', label: '用户管理' },
      { key: 'system:role', label: '角色管理' }
    ]
  }
]

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Role, { name?: string; status?: number }>({
  fetchApi: getRoleList,
  defaultParams: { name: '', status: undefined }
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const permissionTreeRef = ref()
const checkedKeys = ref<string[]>([])

const defaultFormData = (): Partial<Role> & { permissions: string[] } => ({
  name: '',
  code: '',
  description: '',
  status: 1,
  permissions: []
})

const formData = reactive(defaultFormData())

watch(checkedKeys, (val) => {
  formData.permissions = val
}, { deep: true })

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

const openForm = (row?: Role) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, { ...row })
    checkedKeys.value = row.permissions || []
  } else {
    Object.assign(formData, defaultFormData())
    checkedKeys.value = []
  }
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
  checkedKeys.value = []
}

const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateRole(formData.id, { ...formData, permissions: checkedKeys.value })
      ElMessage.success('更新成功')
    } else {
      await createRole({ ...formData, permissions: checkedKeys.value })
      ElMessage.success('创建成功')
    }
    handleClose()
    fetchData()
  } finally {
    formLoading.value = false
  }
}

const handleStatusChange = async (row: Role) => {
  try {
    await updateRole(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error(error)
    row.status = row.status === 1 ? 0 : 1
  }
}

const handleDelete = async (row: Role) => {
  try {
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}
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
}
</style>
