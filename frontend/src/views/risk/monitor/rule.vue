<template>
  <div class="ccb-monitor-rule">
    <CcbPageHeader
      title="监控规则管理"
      description="异常交易监控规则的配置与管理"
      icon="SetUp"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="规则名称" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="请输入规则名称" clearable />
      </el-form-item>
      <el-form-item label="规则类型" prop="rule_type">
        <el-select v-model="searchForm.rule_type" placeholder="请选择规则类型" clearable>
          <el-option v-for="item in RuleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="监控维度" prop="monitor_dimension">
        <el-select v-model="searchForm.monitor_dimension" placeholder="请选择监控维度" clearable>
          <el-option v-for="item in MonitorDimensionOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="is_enabled">
        <el-select v-model="searchForm.is_enabled" placeholder="请选择状态" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton
          label="新增规则"
          type="primary"
          :icon="Plus"
          @click="handleCreate"
        />
        <CcbPermissionButton
          label="刷新"
          type="success"
          :icon="Refresh"
          @click="handleRefresh"
        />
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="false"
      :show-index="true"
      @change="handlePageChange"
    >
      <el-table-column prop="rule_code" label="规则编码" width="160" />
      <el-table-column prop="rule_name" label="规则名称" width="180" show-overflow-tooltip />
      <el-table-column prop="rule_type_text" label="规则类型" width="100" />
      <el-table-column prop="monitor_dimension_text" label="监控维度" width="120" />
      <el-table-column prop="threshold_value" label="阈值" width="100" align="center" />
      <el-table-column prop="time_window" label="时间窗口(分)" width="120" align="center">
        <template #default="{ row }">
          {{ row.time_window || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" align="center" />
      <el-table-column prop="match_count" label="匹配次数" width="100" align="center" />
      <el-table-column prop="alert_count" label="告警次数" width="100" align="center" />
      <el-table-column prop="is_enabled" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_enabled === 1 ? 'success' : 'info'" effect="light" size="small">
            {{ row.is_enabled === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.is_enabled === 1"
            type="warning"
            link
            size="small"
            @click="handleToggleStatus(row, 0)"
          >
            禁用
          </el-button>
          <el-button
            v-else
            type="success"
            link
            size="small"
            @click="handleToggleStatus(row, 1)"
          >
            启用
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑规则' : '新增规则'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="ruleForm" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="规则编码" prop="rule_code">
          <el-input v-model="ruleForm.rule_code" placeholder="请输入规则编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="规则名称" prop="rule_name">
          <el-input v-model="ruleForm.rule_name" placeholder="请输入规则名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="规则类型" prop="rule_type">
          <el-select v-model="ruleForm.rule_type" placeholder="请选择规则类型" style="width: 100%">
            <el-option v-for="item in RuleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="监控维度" prop="monitor_dimension">
          <el-select v-model="ruleForm.monitor_dimension" placeholder="请选择监控维度" style="width: 100%">
            <el-option v-for="item in MonitorDimensionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold_value">
          <el-input-number v-model="ruleForm.threshold_value" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时间窗口(分)" prop="time_window">
          <el-input-number v-model="ruleForm.time_window" :min="0" :max="99999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="ruleForm.priority" :min="0" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否启用" prop="is_enabled">
          <el-radio-group v-model="ruleForm.is_enabled">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  RuleTypeOptions,
  MonitorDimensionOptions,
  type MonitorRule,
  type MonitorRuleQueryParams,
  type CreateMonitorRuleRequest,
  type UpdateMonitorRuleRequest,
  getRuleListApi,
  createRuleApi,
  updateRuleApi,
  deleteRuleApi
} from '@api/abnormalMonitor'

const loading = ref(false)
const tableData = ref<MonitorRule[]>([])
const total = ref(0)
const submitting = ref(false)

const searchForm = reactive({
  keyword: '',
  rule_type: undefined as number | undefined,
  monitor_dimension: undefined as number | undefined,
  is_enabled: undefined as number | undefined
})

const pageParams = reactive({ page: 1, pageSize: 20 })

const formDialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const formRef = ref<FormInstance>()

const ruleForm = reactive({
  rule_code: '',
  rule_name: '',
  rule_type: undefined as number | undefined,
  monitor_dimension: undefined as number | undefined,
  threshold_value: 0,
  time_window: 0,
  priority: 0,
  is_enabled: 1,
  description: ''
})

const formRules: FormRules = {
  rule_code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  rule_name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  rule_type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  monitor_dimension: [{ required: true, message: '请选择监控维度', trigger: 'change' }],
  threshold_value: [{ required: true, message: '请输入阈值', trigger: 'blur' }]
}

async function loadList() {
  loading.value = true
  try {
    const params: MonitorRuleQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      rule_type: searchForm.rule_type,
      monitor_dimension: searchForm.monitor_dimension,
      is_enabled: searchForm.is_enabled
    }

    const result = await getRuleListApi(params)
    tableData.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.rule_type = undefined
  searchForm.monitor_dimension = undefined
  searchForm.is_enabled = undefined
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

function handleRefresh() {
  loadList()
  ElMessage.success('刷新成功')
}

function resetForm() {
  ruleForm.rule_code = ''
  ruleForm.rule_name = ''
  ruleForm.rule_type = undefined
  ruleForm.monitor_dimension = undefined
  ruleForm.threshold_value = 0
  ruleForm.time_window = 0
  ruleForm.priority = 0
  ruleForm.is_enabled = 1
  ruleForm.description = ''
}

function handleCreate() {
  isEdit.value = false
  currentId.value = ''
  resetForm()
  formDialogVisible.value = true
}

function handleEdit(row: MonitorRule) {
  isEdit.value = true
  currentId.value = row.id
  ruleForm.rule_code = row.rule_code
  ruleForm.rule_name = row.rule_name
  ruleForm.rule_type = row.rule_type
  ruleForm.monitor_dimension = row.monitor_dimension
  ruleForm.threshold_value = row.threshold_value
  ruleForm.time_window = row.time_window || 0
  ruleForm.priority = row.priority
  ruleForm.is_enabled = row.is_enabled
  ruleForm.description = row.description || ''
  formDialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      const request: UpdateMonitorRuleRequest = {
        rule_name: ruleForm.rule_name,
        rule_type: ruleForm.rule_type,
        monitor_dimension: ruleForm.monitor_dimension,
        threshold_value: ruleForm.threshold_value,
        time_window: ruleForm.time_window || undefined,
        priority: ruleForm.priority,
        is_enabled: ruleForm.is_enabled,
        description: ruleForm.description || undefined
      }
      await updateRuleApi(currentId.value, request)
      ElMessage.success('更新成功')
    } else {
      const request: CreateMonitorRuleRequest = {
        rule_code: ruleForm.rule_code,
        rule_name: ruleForm.rule_name,
        rule_type: ruleForm.rule_type!,
        monitor_dimension: ruleForm.monitor_dimension!,
        threshold_value: ruleForm.threshold_value,
        time_window: ruleForm.time_window || undefined,
        priority: ruleForm.priority,
        is_enabled: ruleForm.is_enabled,
        description: ruleForm.description || undefined
      }
      await createRuleApi(request)
      ElMessage.success('创建成功')
    }
    formDialogVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleToggleStatus(row: MonitorRule, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(
    `确定要${action}该规则吗？`,
    `${action}确认`,
    {
      confirmButtonText: `确认${action}`,
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await updateRuleApi(row.id, { is_enabled: status })
      ElMessage.success(`${action}成功`)
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || `${action}失败`)
    }
  }).catch(() => {})
}

function handleDelete(row: MonitorRule) {
  ElMessageBox.confirm(
    `确定要删除规则"${row.rule_name}"吗？删除后不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      await deleteRuleApi(row.id)
      ElMessage.success('删除成功')
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || '删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadList()
})
</script>

<style lang="scss" scoped>
.ccb-monitor-rule {
}
</style>
