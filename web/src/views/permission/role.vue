<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="角色名称/编码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
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
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleResetClick">重置</el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto">
          <el-popover
            placement="bottom-end"
            :width="560"
            trigger="click"
            popper-class="deletion-logs-popover"
          >
            <template #reference>
              <el-button :icon="Clock">查看删除日志</el-button>
            </template>
            <div class="deletion-logs-container">
              <div class="deletion-logs-header">
                <h4>角色删除历史</h4>
                <div class="deletion-logs-search">
                  <el-input
                    v-model="deletionLogKeyword"
                    placeholder="搜索角色名称/编码"
                    size="small"
                    clearable
                    style="width: 180px"
                  />
                  <el-date-picker
                    v-model="deletionLogDateRange"
                    type="daterange"
                    size="small"
                    range-separator="至"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    value-format="YYYY-MM-DD"
                    style="width: 240px"
                  />
                  <el-button type="primary" size="small" @click="fetchDeletionLogs">查询</el-button>
                </div>
              </div>
              <div class="deletion-logs" v-loading="deletionLogsLoading">
                <el-table :data="deletionLogs" size="small" max-height="360">
                  <el-table-column prop="roleName" label="角色名称" min-width="120" />
                  <el-table-column prop="roleCode" label="角色编码" min-width="120" />
                  <el-table-column prop="deletedByName" label="删除人" width="100" />
                  <el-table-column prop="boundUsers" label="绑定用户数" width="90" align="center" />
                  <el-table-column prop="deletedAt" label="删除时间" width="160" />
                </el-table>
                <el-empty v-if="deletionLogs.length === 0 && !deletionLogsLoading" description="暂无删除记录" />
              </div>
            </div>
          </el-popover>
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
        :show-selection="true"
        :row-class-name="tableRowClassName"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
        @refresh="handleRefresh"
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
            <el-button :icon="CopyDocument" :disabled="!hasValidSelection" @click="handleBatchCopy">批量复制</el-button>
            <el-button type="success" :icon="CircleCheck" :disabled="!hasValidSelection" @click="handleBatchEnable">批量启用</el-button>
            <el-button type="warning" :icon="CircleClose" :disabled="!hasValidSelection" @click="handleBatchDisable">批量禁用</el-button>
          </div>
          <BaseBatchOperation
            v-if="selectedIds.length > 0"
            :selected-count="selectedIds.length"
            @clear="handleClearSelection"
          >
            <template #operations />
          </BaseBatchOperation>
        </template>
        <el-table-column type="selection" width="50" align="center" :selectable="isSelectable" />
        <el-table-column prop="name" label="角色名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="role-name">
              {{ row.name }}
              <el-tag v-if="row.isSystem" size="small" type="info" effect="plain" style="margin-left: 6px">系统内置</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="角色编码" min-width="130" />
        <el-table-column label="适用场景" min-width="110">
          <template #default="{ row }">
            {{ ROLE_SCENARIO_MAP[row.scenario as keyof typeof ROLE_SCENARIO_MAP] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="层级" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.level && ROLE_LEVEL_MAP[row.level]" :type="ROLE_LEVEL_MAP[row.level].color as any" effect="light" size="small">
              {{ ROLE_LEVEL_MAP[row.level].label }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="用户数" width="80" align="center">
          <template #default="{ row }">
            {{ row.userCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="STATUS_MAP[row.status]?.type || 'info'" size="small">
              {{ STATUS_MAP[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdByName" label="创建人" width="100" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Key"
              :disabled="row.isSystem"
              @click="handleAssignPermission(row as RoleItem)"
            >
              分配权限
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Edit"
              :disabled="row.isSystem"
              @click="handleEdit(row as RoleItem)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              :disabled="row.isSystem"
              @click="handleDeleteCheck(row as RoleItem)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :loading="dialogLoading"
      width="720px"
      @confirm="handleSubmit"
    >
      <div v-if="!isEdit" class="create-progress">
        <el-progress :percentage="createProgress" :stroke-width="6" status="success" />
      </div>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="formData.name"
            class="glow-input"
            placeholder="请输入角色名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" placeholder="自动生成" readonly />
        </el-form-item>
        <el-form-item label="适用场景" prop="scenario">
          <el-select v-model="formData.scenario" placeholder="请选择适用场景" style="width: 100%">
            <el-option
              v-for="item in ROLE_SCENARIO_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-input-number
            v-model="formData.level"
            :min="minAllowedLevel"
            :max="9"
            :step="2"
            :disabled="isEdit && formData.isSystem"
          />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary); font-size: 12px">
            数值越小权限越高
          </span>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="status">
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
        <el-divider content-position="left">权限配置</el-divider>
        <el-form-item>
          <div class="permission-section" style="width: 100%">
            <el-alert
              v-if="isEdit && formData.userCount > 0"
              type="warning"
              show-icon
              :closable="false"
              style="margin-bottom: 12px"
            >
              <template #title>
                当前角色已绑定 <strong>{{ formData.userCount }}</strong> 个账号，核心权限已锁定
              </template>
            </el-alert>
            <div
              v-if="permissionConflicts.length > 0"
              class="conflict-alert"
              :class="{ 'shake-animation': shakeTrigger }"
            >
              <el-alert type="error" show-icon :closable="false">
                <template #title>
                  <div>检测到 <strong>{{ permissionConflicts.length }}</strong> 个权限冲突：</div>
                  <ul style="margin-top: 6px; padding-left: 20px">
                    <li v-for="(c, idx) in permissionConflicts" :key="idx">
                      <span class="conflict-permission">{{ c.code }}</span> 与
                      <span class="conflict-permission">{{ c.conflictCode }}</span>
                      互斥：{{ c.reason }}
                    </li>
                  </ul>
                </template>
              </el-alert>
            </div>
            <el-tree
              ref="permissionTreeRef"
              :data="permissionTree"
              :props="{ label: 'label', children: 'children' }"
              show-checkbox
              node-key="id"
              :default-checked-keys="checkedPermissionIds"
              :expand-on-click-node="false"
              class="permission-tree"
              @check="handlePermissionCheck"
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
                  <el-tag
                    v-if="isPermissionInConflict(data.code)"
                    size="small"
                    type="danger"
                    effect="dark"
                    class="ml-2"
                  >
                    冲突
                  </el-tag>
                </span>
              </template>
            </el-tree>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="ripple-btn"
          :loading="dialogLoading"
          :disabled="permissionConflicts.length > 0"
          @click="handleRippleSubmit"
        >
          确定
        </el-button>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="permissionVisible"
      :title="`分配权限 - ${currentRole?.name || ''}`"
      :loading="permissionLoading"
      width="560px"
      @confirm="handleAssignPermissionSubmit"
    >
      <div class="permission-section">
        <el-alert
          v-if="currentRole && (currentRole.userCount || 0) > 0"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        >
          <template #title>
            当前角色已绑定 <strong>{{ currentRole.userCount }}</strong> 个账号，核心权限已锁定
          </template>
        </el-alert>
        <div
          v-if="permissionConflicts.length > 0"
          class="conflict-alert"
          :class="{ 'shake-animation': shakeTrigger }"
        >
          <el-alert type="error" show-icon :closable="false">
            <template #title>
              <div>检测到 <strong>{{ permissionConflicts.length }}</strong> 个权限冲突：</div>
              <ul style="margin-top: 6px; padding-left: 20px">
                <li v-for="(c, idx) in permissionConflicts" :key="idx">
                  <span class="conflict-permission">{{ c.code }}</span> 与
                  <span class="conflict-permission">{{ c.conflictCode }}</span>
                  互斥：{{ c.reason }}
                </li>
              </ul>
            </template>
          </el-alert>
        </div>
        <el-tree
          ref="assignPermissionTreeRef"
          v-loading="permissionLoading"
          :data="permissionTree"
          :props="{ label: 'label', children: 'children' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissionIds"
          :expand-on-click-node="false"
          class="permission-tree"
          @check="handlePermissionCheck"
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
      <template #footer>
        <el-button @click="permissionVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="ripple-btn"
          :loading="permissionLoading"
          :disabled="permissionConflicts.length > 0"
          @click="handleAssignPermissionRipple"
        >
          确定
        </el-button>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="batchCopyVisible"
      title="批量复制角色"
      :loading="batchCopyLoading"
      width="600px"
      @confirm="handleBatchCopySubmit"
    >
      <el-form ref="batchCopyFormRef" :model="batchCopyForm" :rules="batchCopyRules" label-width="120px">
        <el-form-item label="源角色" prop="sourceRoleIds">
          <el-select
            v-model="batchCopyForm.sourceRoleIds"
            multiple
            filterable
            placeholder="请选择要复制的角色（系统内置除外）"
            style="width: 100%"
          >
            <el-option
              v-for="role in nonSystemRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称前缀" prop="newNamePrefix">
          <el-input v-model="batchCopyForm.newNamePrefix" placeholder="请输入新角色名称前缀" maxlength="20" show-word-limit />
          <div style="color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px">
            复制后的名称格式：前缀_原角色名
          </div>
        </el-form-item>
        <el-form-item label="适用场景">
          <el-select v-model="batchCopyForm.scenario" placeholder="不填则继承原角色场景" clearable style="width: 100%">
            <el-option
              v-for="item in ROLE_SCENARIO_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">差异化权限调整（可选）</el-divider>
        <el-form-item label="新增权限">
          <el-select
            v-model="batchCopyForm.permissionDelta.add"
            multiple
            filterable
            placeholder="选择需要额外添加的权限"
            style="width: 100%"
          >
            <el-option
              v-for="p in flatPermissions"
              :key="p.id"
              :label="p.label"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="移除权限">
          <el-select
            v-model="batchCopyForm.permissionDelta.remove"
            multiple
            filterable
            placeholder="选择需要移除的权限"
            style="width: 100%"
          >
            <el-option
              v-for="p in flatPermissions"
              :key="p.id"
              :label="p.label"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="batchResultVisible"
      title="批量操作结果"
      width="560px"
    >
      <el-result
        v-if="batchResult"
        :icon="batchResult.failed.length === 0 ? 'success' : 'warning'"
        :title="batchResult.failed.length === 0 ? '全部操作成功' : `部分操作失败`"
        :sub-title="`成功 ${batchResult.success.length} 条，失败 ${batchResult.failed.length} 条`"
      />
      <div v-if="batchResult && batchResult.failed.length > 0" style="margin-top: 16px">
        <h4 style="margin-bottom: 8px">失败明细：</h4>
        <el-table :data="batchResult.failed" size="small" max-height="260">
          <el-table-column prop="id" label="ID" width="100" />
          <el-table-column prop="reason" label="失败原因" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="batchResultVisible = false">我知道了</el-button>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="deleteCheckVisible"
      title="删除确认"
      :loading="deleteCheckLoading"
      width="500px"
      @confirm="handleDeleteConfirm"
    >
      <div v-loading="deleteCheckLoading">
        <div v-if="roleDependencies">
          <el-result
            v-if="!roleDependencies.canDelete"
            icon="error"
            title="无法删除"
            sub-title="该角色存在依赖数据"
          />
          <div v-else>
            <el-alert
              v-if="roleDependencies.hasDependencies"
              type="warning"
              show-icon
              :closable="false"
              style="margin-bottom: 16px"
            >
              <template #title>
                该角色存在以下关联数据，删除后将同时解除关联：
              </template>
            </el-alert>
            <el-table :data="roleDependencies.dependencies" size="small" style="margin-bottom: 16px">
              <el-table-column prop="type" label="关联类型" width="120" />
              <el-table-column prop="count" label="数量" width="80" align="center" />
              <el-table-column prop="description" label="说明" />
            </el-table>
            <el-alert type="info" show-icon :closable="false">
              <template #title>
                确定要删除角色 <strong>{{ currentDeleteRole?.name }}</strong> 吗？此操作不可恢复。
              </template>
            </el-alert>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteCheckVisible = false">取消</el-button>
        <el-button
          v-if="roleDependencies?.canDelete"
          type="danger"
          class="ripple-btn"
          :loading="deleteCheckLoading"
          @click="handleDeleteRipple"
        >
          确认删除
        </el-button>
      </template>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, nextTick, watch } from 'vue'
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
  CopyDocument,
  CircleCheck,
  CircleClose,
  Clock,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import {
  STATUS_OPTIONS,
  STATUS_MAP,
  ROLE_LEVEL_MAP,
  ROLE_SCENARIO_OPTIONS,
  ROLE_SCENARIO_MAP,
} from '@/constants'
import { useUserStore } from '@/stores/user'
import {
  getRoleList,
  createRole,
  deleteRole,
  getPermissionList,
  getRolePermissions,
  assignRolePermissions,
  updateRoleWithPermissions,
  batchCopyRoles,
  batchUpdateRoleStatus,
  checkRoleDependencies,
  getRoleDeletionLogs,
  getPermissionExclusions,
  checkRoleNameExists,
  type RoleItem,
  type RoleQueryParams,
  type PermissionItem,
  type BatchOperateResult,
  type RoleDependencies,
  type PermissionConflict,
  type RoleDeletionLog,
} from '@/api/permission'

const userStore = useUserStore()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const {
  loading,
  dataList,
  total,
  selectedIds,
  pagination,
  queryParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  handleRefresh,
  clearSelection,
} = useTable<RoleItem, RoleQueryParams>({
  fetchApi: getRoleList,
  deleteApi: deleteRole,
})

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

function handleResetClick() {
  dateRange.value = []
  handleReset()
}

function tableRowClassName({ rowIndex }: { rowIndex: number }) {
  return rowIndex % 2 === 0 ? '' : 'row-alt'
}

function isSelectable(row: RoleItem) {
  return !row.isSystem
}

const hasValidSelection = computed(() => {
  return selectedIds.value.some((id) => {
    const role = dataList.value.find((r) => r.id === id)
    return role && !role.isSystem
  })
})

function getValidIds(ids: (string | number)[]) {
  return ids.filter((id) => {
    const role = dataList.value.find((r) => r.id === id)
    return role && !role.isSystem
  })
}

function handleClearSelection() {
  clearSelection()
}

const nonSystemRoles = computed(() => dataList.value.filter((r) => !r.isSystem))

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => (isEdit.value ? '编辑角色' : '新增角色'))
const createProgress = ref(0)

const currentUserLevel = computed(() => {
  return (userStore.userInfo as any)?.positionLevel || 9
})

const minAllowedLevel = computed(() => currentUserLevel.value)

const formData = reactive<any>({
  name: '',
  code: '',
  description: '',
  sort: 0,
  status: 1,
  level: 9,
  scenario: '',
  userCount: 0,
  isSystem: false,
})

const permissionTreeRef = ref<InstanceType<typeof ElTree>>()
const assignPermissionTreeRef = ref<InstanceType<typeof ElTree>>()
const permissionTree = ref<PermissionItem[]>([])
const flatPermissions = ref<PermissionItem[]>([])
const checkedPermissionIds = ref<(string | number)[]>([])
const boundPermissionIds = ref<(string | number)[]>([])
const permissionConflicts = ref<PermissionConflict[]>([])
const permissionExclusions = ref<Array<{ codes: [string, string]; reason: string }>>([])
const shakeTrigger = ref(false)

function flattenPermissions(list: PermissionItem[]): PermissionItem[] {
  const result: PermissionItem[] = []
  const walk = (items: PermissionItem[]) => {
    items.forEach((item) => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        walk(item.children as PermissionItem[])
      }
    })
  }
  walk(list)
  return result
}

async function fetchPermissionTree() {
  try {
    const list = await getPermissionList()
    permissionTree.value = list
    flatPermissions.value = flattenPermissions(list)
  } catch (error) {
    console.error('Fetch permissions error:', error)
  }
}

async function fetchPermissionExclusions() {
  try {
    permissionExclusions.value = await getPermissionExclusions()
  } catch (error) {
    console.error('Fetch permission exclusions error:', error)
  }
}

function detectConflicts(checkedKeys: (string | number)[]): PermissionConflict[] {
  const conflicts: PermissionConflict[] = []
  const checkedCodes = new Set<string>()
  flatPermissions.value.forEach((p) => {
    if (checkedKeys.includes(p.id)) {
      checkedCodes.add(p.code)
    }
  })
  permissionExclusions.value.forEach((rule) => {
    const [codeA, codeB] = rule.codes
    if (checkedCodes.has(codeA) && checkedCodes.has(codeB)) {
      conflicts.push({
        code: codeA,
        conflictCode: codeB,
        reason: rule.reason,
      })
    }
  })
  return conflicts
}

function isPermissionInConflict(code: string): boolean {
  return permissionConflicts.value.some(
    (c) => c.code === code || c.conflictCode === code
  )
}

function triggerShake() {
  shakeTrigger.value = false
  nextTick(() => {
    shakeTrigger.value = true
    setTimeout(() => {
      shakeTrigger.value = false
    }, 500)
  })
}

function handlePermissionCheck() {
  const treeRef = permissionVisible.value ? assignPermissionTreeRef.value : permissionTreeRef.value
  const checkedKeys = treeRef?.getCheckedKeys(true) || []
  permissionConflicts.value = detectConflicts(checkedKeys)
  if (permissionConflicts.value.length > 0) {
    triggerShake()
  }
}

const validateRoleName = debounce(async (_rule: any, value: string, callback: any) => {
  if (!value) return callback(new Error('请输入角色名称'))
  if (isEdit.value && value === dialogData.name) return callback()
  try {
    const exists = await checkRoleNameExists(value, isEdit.value ? dialogData.id : undefined)
    if (exists) return callback(new Error('角色名称已存在'))
    callback()
  } catch {
    callback()
  }
}, 300)

function validateLevel(val: number) {
  if (val && val < currentUserLevel.value) {
    return '禁止创建高于当前账号层级的角色'
  }
  return true
}

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { validator: validateRoleName, trigger: 'blur' },
  ],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  level: [{ validator: (_r, v, cb) => { const res = validateLevel(v); if (res !== true) cb(new Error(res)); else cb() }, trigger: 'change' }],
}

function generateRoleCode(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const timestamp = Date.now().toString(36)
  return `role_${base}_${timestamp}`
}

watch(
  () => formData.name,
  (val) => {
    if (!isEdit.value && val) {
      formData.code = generateRoleCode(val)
    }
  }
)

watch(dialogVisible, async (val) => {
  if (val && !isEdit.value) {
    createProgress.value = 0
    const steps = [25, 50, 75, 100]
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 150))
      createProgress.value = step
    }
  }
})

function initFormData() {
  Object.assign(formData, {
    name: '',
    code: '',
    description: '',
    sort: 0,
    status: 1,
    level: Math.max(5, currentUserLevel.value),
    scenario: '',
    userCount: 0,
    isSystem: false,
  })
  checkedPermissionIds.value = []
  boundPermissionIds.value = []
  permissionConflicts.value = []
}

async function handleAdd() {
  initFormData()
  openDialog()
}

async function handleEdit(row: RoleItem) {
  initFormData()
  Object.assign(formData, row)
  checkedPermissionIds.value = row.permissionIds || []
  boundPermissionIds.value = row.boundPermissionIds || []
  try {
    if (row.id) {
      checkedPermissionIds.value = await getRolePermissions(row.id)
    }
  } catch (error) {
    console.error(error)
  }
  permissionConflicts.value = detectConflicts(checkedPermissionIds.value)
  openDialog(row)
}

function handleRippleSubmit(e: MouseEvent) {
  createRipple(e)
  handleSubmit()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (permissionConflicts.value.length > 0) {
      ElMessage.error('存在权限冲突，请先解决')
      return
    }
    dialogLoading.value = true
    try {
      const treeRef = permissionTreeRef.value
      const checkedKeys = treeRef?.getCheckedKeys(true) || []
      const halfCheckedKeys = treeRef?.getHalfCheckedKeys() || []
      const allPermissionIds = [...new Set([...checkedKeys, ...halfCheckedKeys, ...boundPermissionIds.value])]

      if (isEdit.value) {
        await updateRoleWithPermissions(dialogData.id, {
          name: formData.name,
          description: formData.description,
          sort: formData.sort,
          status: formData.status,
          level: formData.level,
          scenario: formData.scenario,
          permissionIds: allPermissionIds,
        })
        ElMessage.success('编辑成功')
      } else {
        await createRole({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          sort: formData.sort,
          level: formData.level,
          scenario: formData.scenario,
          permissionIds: allPermissionIds,
        })
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

function createRipple(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  const ripple = document.createElement('span')
  ripple.className = 'ripple-effect'
  const size = Math.max(rect.width, rect.height)
  ripple.style.width = ripple.style.height = size + 'px'
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px'
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px'
  target.appendChild(ripple)
  setTimeout(() => ripple.remove(), 600)
}

const permissionVisible = ref(false)
const permissionLoading = ref(false)
const currentRole = ref<RoleItem | null>(null)

async function handleAssignPermission(row: RoleItem) {
  currentRole.value = row
  checkedPermissionIds.value = []
  boundPermissionIds.value = row.boundPermissionIds || []
  permissionConflicts.value = []
  permissionVisible.value = true
  try {
    permissionLoading.value = true
    checkedPermissionIds.value = await getRolePermissions(row.id)
    permissionConflicts.value = detectConflicts(checkedPermissionIds.value)
  } catch (error) {
    console.error(error)
  } finally {
    permissionLoading.value = false
  }
}

function handleAssignPermissionRipple(e: MouseEvent) {
  createRipple(e)
  handleAssignPermissionSubmit()
}

async function handleAssignPermissionSubmit() {
  if (!currentRole.value) return
  if (permissionConflicts.value.length > 0) {
    ElMessage.error('存在权限冲突，请先解决')
    return
  }
  const treeRef = assignPermissionTreeRef.value
  const checkedKeys = treeRef?.getCheckedKeys(true) || []
  const halfCheckedKeys = treeRef?.getHalfCheckedKeys() || []
  const allIds = [...new Set([...checkedKeys, ...halfCheckedKeys, ...boundPermissionIds.value])]

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
    api: 'API',
  }
  return map[type] || ''
}

function getPermissionTypeTag(type: string): 'primary' | 'success' | 'warning' | 'danger' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
    directory: 'primary',
    menu: 'success',
    button: 'warning',
    api: 'danger',
  }
  return map[type] || 'primary'
}

const batchCopyVisible = ref(false)
const batchCopyLoading = ref(false)
const batchCopyFormRef = ref<FormInstance>()
const batchCopyForm = reactive<{
  sourceRoleIds: (string | number)[]
  newNamePrefix: string
  scenario: string
  permissionDelta: { add: (string | number)[]; remove: (string | number)[] }
}>({
  sourceRoleIds: [],
  newNamePrefix: '',
  scenario: '',
  permissionDelta: { add: [], remove: [] },
})

const batchCopyRules: FormRules = {
  sourceRoleIds: [{ required: true, message: '请选择源角色', trigger: 'change' }],
  newNamePrefix: [{ required: true, message: '请输入名称前缀', trigger: 'blur' }],
}

function handleBatchCopy() {
  batchCopyForm.sourceRoleIds = getValidIds(selectedIds.value)
  batchCopyForm.newNamePrefix = ''
  batchCopyForm.scenario = ''
  batchCopyForm.permissionDelta = { add: [], remove: [] }
  batchCopyVisible.value = true
}

async function handleBatchCopySubmit() {
  if (!batchCopyFormRef.value) return
  await batchCopyFormRef.value.validate(async (valid) => {
    if (!valid) return
    batchCopyLoading.value = true
    try {
      const result = await batchCopyRoles({
        sourceRoleIds: batchCopyForm.sourceRoleIds,
        newNamePrefix: batchCopyForm.newNamePrefix,
        scenario: batchCopyForm.scenario || undefined,
        permissionDelta: {
          add: batchCopyForm.permissionDelta.add.length > 0 ? batchCopyForm.permissionDelta.add : undefined,
          remove: batchCopyForm.permissionDelta.remove.length > 0 ? batchCopyForm.permissionDelta.remove : undefined,
        },
      })
      batchCopyVisible.value = false
      showBatchResult(result)
      handleSearch()
    } catch (error) {
      console.error(error)
    } finally {
      batchCopyLoading.value = false
    }
  })
}

const batchResultVisible = ref(false)
const batchResult = ref<BatchOperateResult | null>(null)

function showBatchResult(result: BatchOperateResult) {
  batchResult.value = result
  batchResultVisible.value = true
}

async function handleBatchEnable() {
  const validIds = getValidIds(selectedIds.value)
  if (validIds.length === 0) {
    ElMessage.warning('请选择有效的角色')
    return
  }
  try {
    const result = await batchUpdateRoleStatus(validIds, 1)
    showBatchResult(result)
    handleSearch()
    clearSelection()
  } catch (error) {
    console.error(error)
  }
}

async function handleBatchDisable() {
  const validIds = getValidIds(selectedIds.value)
  if (validIds.length === 0) {
    ElMessage.warning('请选择有效的角色')
    return
  }
  try {
    const result = await batchUpdateRoleStatus(validIds, 0)
    showBatchResult(result)
    handleSearch()
    clearSelection()
  } catch (error) {
    console.error(error)
  }
}

const deleteCheckVisible = ref(false)
const deleteCheckLoading = ref(false)
const currentDeleteRole = ref<RoleItem | null>(null)
const roleDependencies = ref<RoleDependencies | null>(null)

async function handleDeleteCheck(row: RoleItem) {
  currentDeleteRole.value = row
  roleDependencies.value = null
  deleteCheckVisible.value = true
  try {
    deleteCheckLoading.value = true
    roleDependencies.value = await checkRoleDependencies(row.id)
  } catch (error) {
    console.error(error)
  } finally {
    deleteCheckLoading.value = false
  }
}

function handleDeleteRipple(e: MouseEvent) {
  createRipple(e)
  handleDeleteConfirm()
}

async function handleDeleteConfirm() {
  if (!currentDeleteRole.value) return
  if (!roleDependencies.value?.canDelete) return
  deleteCheckLoading.value = true
  try {
    await deleteRole(currentDeleteRole.value.id)
    ElMessage.success('删除成功')
    deleteCheckVisible.value = false
    handleSearch()
  } catch (error) {
    console.error(error)
  } finally {
    deleteCheckLoading.value = false
  }
}

const deletionLogs = ref<RoleDeletionLog[]>([])
const deletionLogsLoading = ref(false)
const deletionLogKeyword = ref('')
const deletionLogDateRange = ref<string[]>([])

async function fetchDeletionLogs() {
  try {
    deletionLogsLoading.value = true
    const params: { keyword?: string; startTime?: string; endTime?: string } = {
      keyword: deletionLogKeyword.value || undefined,
    }
    if (deletionLogDateRange.value && deletionLogDateRange.value.length === 2) {
      params.startTime = deletionLogDateRange.value[0]
      params.endTime = deletionLogDateRange.value[1]
    }
    deletionLogs.value = await getRoleDeletionLogs(params)
  } catch (error) {
    console.error(error)
  } finally {
    deletionLogsLoading.value = false
  }
}

onMounted(() => {
  fetchPermissionTree()
  fetchPermissionExclusions()
  fetchDeletionLogs()
})
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }
}

.glow-input {
  :deep(.el-input__wrapper) {
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  :deep(.el-input__wrapper.is-focus) {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 8px 2px rgba(64, 158, 255, 0.3);
  }
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

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
  z-index: 1;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

:deep(.el-table__row.row-alt) {
  background-color: var(--el-fill-color-light);
  &:hover {
    background-color: var(--el-fill-color);
  }
}

.conflict-permission {
  color: var(--el-color-danger);
  font-weight: 600;
}

.permission-section {
  margin-top: 12px;
  width: 100%;

  .permission-tree {
    max-height: 360px;
    overflow: auto;
    padding: 8px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }

  .conflict-alert {
    margin-bottom: 8px;
  }
}

.create-progress {
  margin-bottom: 20px;
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

.role-name {
  display: inline-flex;
  align-items: center;
}

.deletion-logs-container {
  .deletion-logs-header {
    margin-bottom: 12px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
    }
  }

  .deletion-logs-search {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.deletion-logs {
  max-height: 400px;
  overflow: auto;
}
</style>
