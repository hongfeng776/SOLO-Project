<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { ROLE_CODE } from '@/constants/enums'
import {
  getRoleListApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
} from '@/api/role'
import type { RoleItem } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<RoleItem[]>([])
const total = ref(0)

const allPermissions = [
  { group: '用户管理', options: [
    { value: 'user:view', label: '查看用户' },
    { value: 'user:create', label: '创建用户' },
    { value: 'user:update', label: '编辑用户' },
    { value: 'user:delete', label: '删除用户' },
  ]},
  { group: '角色管理', options: [
    { value: 'role:view', label: '查看角色' },
    { value: 'role:create', label: '创建角色' },
    { value: 'role:update', label: '编辑角色' },
    { value: 'role:delete', label: '删除角色' },
  ]},
  { group: '内容管理', options: [
    { value: 'content:view', label: '查看内容' },
    { value: 'content:create', label: '创建内容' },
    { value: 'content:update', label: '编辑内容' },
    { value: 'content:delete', label: '删除内容' },
    { value: 'content:audit', label: '内容审核' },
  ]},
  { group: '版权管理', options: [
    { value: 'copyright:view', label: '查看版权' },
    { value: 'copyright:create', label: '创建版权' },
    { value: 'copyright:update', label: '编辑版权' },
    { value: 'copyright:delete', label: '删除版权' },
  ]},
  { group: '广告管理', options: [
    { value: 'ad:view', label: '查看广告' },
    { value: 'ad:create', label: '创建广告' },
    { value: 'ad:update', label: '编辑广告' },
    { value: 'ad:delete', label: '删除广告' },
  ]},
  { group: '活动管理', options: [
    { value: 'activity:view', label: '查看活动' },
    { value: 'activity:create', label: '创建活动' },
    { value: 'activity:update', label: '编辑活动' },
    { value: 'activity:delete', label: '删除活动' },
  ]},
]

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getRoleListApi({ ...queryParams })
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.keyword = ''
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()

const formData = reactive<Partial<RoleItem>>({
  code: '',
  name: '',
  description: '',
  permissions: [],
  sortOrder: 0,
  status: 1,
})

const isAllSelected = (group: any[]) => {
  return group.every((p) => formData.permissions?.includes(p.value))
}

const isIndeterminate = (group: any[]) => {
  const selected = group.filter((p) => formData.permissions?.includes(p.value)).length
  return selected > 0 && selected < group.length
}

const handleGroupChange = (group: any[], checked: boolean) => {
  const current = new Set(formData.permissions)
  if (checked) {
    group.forEach((p) => current.add(p.value))
  } else {
    group.forEach((p) => current.delete(p.value))
  }
  formData.permissions = Array.from(current)
}

const handlePermChange = () => {}

const formRules = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { max: 50, message: '编码长度不超过50', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 50, message: '名称长度不超过50', trigger: 'blur' },
  ],
}

const openDialog = (mode: 'create' | 'edit' | 'view', row?: RoleItem) => {
  dialogMode.value = mode
  if (row) {
    Object.assign(formData, {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      permissions: [...row.permissions],
      sortOrder: row.sortOrder,
      status: row.status,
    })
  } else {
    Object.assign(formData, {
      code: '',
      name: '',
      description: '',
      permissions: [],
      sortOrder: 0,
      status: 1,
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createRoleApi(formData)
      ElMessage.success('创建成功')
    } else {
      await updateRoleApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: RoleItem) => {
  await ElMessageBox.confirm('确定要删除该角色吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteRoleApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const isSuperAdmin = (code: string) => code === ROLE_CODE.SUPER_ADMIN

const tableColumns = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'code', label: '角色编码', width: 180 },
  { prop: 'name', label: '角色名称', width: 150 },
  { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
  {
    label: '权限数量',
    width: 100,
    align: 'center',
    slot: 'permCount',
  },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    align: 'center',
    slot: 'status',
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    width: 170,
    align: 'center',
    slot: 'createdAt',
  },
  { label: '操作', width: 200, fixed: 'right', align: 'center', slot: 'actions' },
]

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="role-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="编码/名称/描述"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-batch-actions="false"
        @create="openDialog('create')"
        @refresh="loadData"
        create-text="新增角色"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :index="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #permCount="{ row }">
          <el-tag type="primary" size="small" effect="light">
            {{ row.code === ROLE_CODE.SUPER_ADMIN ? '全部' : row.permissions?.length || 0 }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openDialog('view', row)">查看</el-button>
          <el-button
            type="primary"
            link
            :icon="Edit"
            :disabled="isSuperAdmin(row.code)"
            @click="openDialog('edit', row)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            link
            :icon="Delete"
            :disabled="isSuperAdmin(row.code)"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增角色' : dialogMode === 'edit' ? '编辑角色' : '角色详情'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="角色编码" prop="code">
              <el-input
                v-model="formData.code"
                :disabled="dialogMode !== 'create' || isSuperAdmin(formData.code!)"
                placeholder="请输入角色编码"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色描述">
              <el-input v-model="formData.description" placeholder="请输入角色描述" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="权限配置">
              <div
                class="perm-config"
                :style="{ opacity: isSuperAdmin(formData.code!) ? 0.5 : 1 }"
              >
                <el-alert
                  v-if="isSuperAdmin(formData.code!)"
                  type="info"
                  show-icon
                  :closable="false"
                  title="超级管理员拥有全部权限，无需配置"
                  style="margin-bottom: 12px"
                />
                <div v-for="(group, gi) in allPermissions" :key="gi" class="perm-group">
                  <div class="perm-group-header">
                    <el-checkbox
                      :model-value="isAllSelected(group.options)"
                      :indeterminate="isIndeterminate(group.options)"
                      :disabled="isSuperAdmin(formData.code!)"
                      @change="(val: boolean) => handleGroupChange(group.options, val)"
                    >
                      <span class="perm-group-title">{{ group.group }}</span>
                    </el-checkbox>
                  </div>
                  <div class="perm-options">
                    <el-checkbox-group
                      v-model="formData.permissions"
                      :disabled="isSuperAdmin(formData.code!)"
                      @change="handlePermChange"
                    >
                      <el-checkbox
                        v-for="perm in group.options"
                        :key="perm.value"
                        :value="perm.value"
                        style="margin-bottom: 8px"
                      >
                        {{ perm.label }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.perm-config {
  width: 100%;
  border: 1px solid $border-lighter;
  border-radius: $radius-md;
  padding: 16px;
  background: $bg-color;
}

.perm-group {
  padding: 12px 0;
  border-bottom: 1px dashed $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.perm-group-header {
  margin-bottom: 12px;
}

.perm-group-title {
  font-weight: 600;
  color: $text-primary;
}

.perm-options {
  padding-left: 24px;
}
</style>
