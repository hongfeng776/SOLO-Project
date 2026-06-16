<template>
  <div class="ccb-audit-rule">
    <CcbPageHeader
      title="审核规则配置"
      description="管理业务审核流程与规则设置"
      icon="Setting"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
      </template>
    </CcbPageHeader>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="searchForm.ruleName" placeholder="请输入规则名称" clearable />
      </el-form-item>
      <el-form-item label="业务类型" prop="businessType">
        <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable>
          <el-option label="转账汇款" :value="1" />
          <el-option label="活期存款" :value="2" />
          <el-option label="定期存款" :value="3" />
          <el-option label="理财产品" :value="4" />
          <el-option label="贷款业务" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="danger" :icon="Delete" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="ruleCode" label="规则编码" width="160" />
      <el-table-column prop="ruleName" label="规则名称" min-width="180" />
      <el-table-column prop="businessTypeName" label="适用业务类型" width="120" />
      <el-table-column label="触发条件" min-width="240">
        <template #default="{ row }">
          <el-tooltip :content="row.conditionDesc" placement="top">
            <span class="truncate-text">{{ row.conditionDesc }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="auditLevel" label="审核级别" width="100">
        <template #default="{ row }">
          <el-tag type="primary" effect="light" size="small">{{ row.auditLevel }}级</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="thresholdAmount" label="金额阈值" width="140" align="right">
        <template #default="{ row }">
          <span class="ccb-amount">¥{{ formatMoneyWithComma(row.thresholdAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)" effect="light" size="small">
            {{ getPriorityLabel(row.priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === 1"
            type="warning"
            link
            size="small"
            @click="handleDisable(row)"
          >
            禁用
          </el-button>
          <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'add' ? '新增审核规则' : '编辑审核规则'"
      width="640px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规则编码" prop="ruleCode">
              <el-input v-model="ruleForm.ruleCode" placeholder="请输入规则编码" :disabled="formMode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="ruleForm.businessType" placeholder="请选择业务类型" style="width: 100%">
                <el-option label="转账汇款" :value="1" />
                <el-option label="活期存款" :value="2" />
                <el-option label="定期存款" :value="3" />
                <el-option label="理财产品" :value="4" />
                <el-option label="贷款业务" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核级别" prop="auditLevel">
              <el-select v-model="ruleForm.auditLevel" placeholder="请选择审核级别" style="width: 100%">
                <el-option label="1级审核" :value="1" />
                <el-option label="2级审核" :value="2" />
                <el-option label="3级审核" :value="3" />
                <el-option label="4级审核" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="金额阈值" prop="thresholdAmount">
              <el-input-number
                v-model="ruleForm.thresholdAmount"
                :min="0"
                :precision="2"
                :step="10000"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="ruleForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="低" :value="1" />
                <el-option label="中" :value="2" />
                <el-option label="高" :value="3" />
                <el-option label="最高" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="触发条件" prop="conditionDesc">
          <el-input
            v-model="ruleForm.conditionDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入规则触发条件描述，例如：单笔转账金额超过阈值且为跨行转账"
          />
        </el-form-item>
        <el-form-item label="规则说明" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则详细说明"
          />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="ruleForm.status" :active-value="1" :inactive-value="0" />
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
import { ref, reactive, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime, formatMoneyWithComma } from '@utils'

interface AuditRule {
  id: number
  ruleCode: string
  ruleName: string
  businessType: number
  businessTypeName: string
  conditionDesc: string
  auditLevel: number
  thresholdAmount: number
  priority: number
  status: number
  description: string
  createdAt: string
  updatedAt: string
}

const loading = ref<boolean>(false)
const tableData = ref<AuditRule[]>([])
const total = ref<number>(0)
const selectedRows = ref<AuditRule[]>([])

const formDialogVisible = ref<boolean>(false)
const formMode = ref<'add' | 'edit'>('add')
const formLoading = ref<boolean>(false)
const ruleFormRef = ref<FormInstance>()

const searchForm = reactive({
  ruleName: '',
  businessType: null as number | null,
  status: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const ruleForm = reactive({
  id: 0,
  ruleCode: '',
  ruleName: '',
  businessType: null as number | null,
  conditionDesc: '',
  auditLevel: 1,
  thresholdAmount: 0,
  priority: 2,
  status: 1,
  description: ''
})

const ruleFormRules: FormRules = {
  ruleCode: [
    { required: true, message: '请输入规则编码', trigger: 'blur' },
    { min: 3, max: 32, message: '规则编码长度在 3 到 32 个字符', trigger: 'blur' }
  ],
  ruleName: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 64, message: '规则名称长度在 2 到 64 个字符', trigger: 'blur' }
  ],
  businessType: [
    { required: true, message: '请选择业务类型', trigger: 'change' }
  ],
  auditLevel: [
    { required: true, message: '请选择审核级别', trigger: 'change' }
  ],
  thresholdAmount: [
    { required: true, message: '请输入金额阈值', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  conditionDesc: [
    { required: true, message: '请输入触发条件', trigger: 'blur' }
  ]
}

const getPriorityType = (priority: number): string => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'warning',
    3: 'danger',
    4: 'danger'
  }
  return types[priority] || 'info'
}

const getPriorityLabel = (priority: number): string => {
  const labels: Record<number, string> = {
    1: '低',
    2: '中',
    3: '高',
    4: '最高'
  }
  return labels[priority] || '低'
}

const mockAuditRules: AuditRule[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  ruleCode: `RULE${String(i + 1).padStart(4, '0')}`,
  ruleName: [
    '大额转账一级审核',
    '跨行转账二级审核',
    '理财产品购买审核',
    '贷款发放审核',
    '定期存款提前支取审核',
    '外汇业务审核',
    '代发工资审核',
    '大额现金支取审核',
    '账户开立审核',
    '网银限额调整审核',
    '密码重置审核',
    '手机银行开通审核',
    '信用卡申请审核',
    '商户收单审核'
  ][i],
  businessType: i % 5 + 1,
  businessTypeName: ['转账汇款', '活期存款', '定期存款', '理财产品', '贷款业务'][i % 5],
  conditionDesc: [
    '单笔转账金额超过50万元',
    '跨行转账且金额超过20万元',
    '理财产品购买金额超过100万元',
    '贷款发放金额超过500万元',
    '定期存款提前支取金额超过30万元',
    '外汇兑换金额超过等值10万美元',
    '代发工资批次金额超过500万元',
    '单笔现金支取超过20万元',
    '对公账户开立',
    '网银单笔限额调整超过50万元',
    '密码重置且账户余额超过50万元',
    '手机银行开通且申请额度超过20万元',
    '信用卡申请额度超过10万元',
    '商户收单日限额超过100万元'
  ][i],
  auditLevel: [1, 2, 2, 3, 2, 2, 3, 1, 3, 2, 1, 1, 2, 2][i],
  thresholdAmount: [500000, 200000, 1000000, 5000000, 300000, 100000, 5000000, 200000, 0, 500000, 500000, 200000, 100000, 1000000][i],
  priority: (i % 4) + 1,
  status: i % 5 === 0 ? 0 : 1,
  description: '系统默认审核规则配置',
  createdAt: `2024-01-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`,
  updatedAt: `2024-06-1${i % 6} 12:00:00`
}))

const resetRuleForm = (): void => {
  ruleForm.id = 0
  ruleForm.ruleCode = ''
  ruleForm.ruleName = ''
  ruleForm.businessType = null
  ruleForm.conditionDesc = ''
  ruleForm.auditLevel = 1
  ruleForm.thresholdAmount = 0
  ruleForm.priority = 2
  ruleForm.status = 1
  ruleForm.description = ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockAuditRules.slice(start, end)
    total.value = mockAuditRules.length
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as AuditRule[]
}

const handleAdd = (): void => {
  formMode.value = 'add'
  resetRuleForm()
  formDialogVisible.value = true
}

const handleView = (row: AuditRule): void => {
  ElMessage.info(`查看规则：${row.ruleName}`)
}

const handleEdit = (row: AuditRule): void => {
  formMode.value = 'edit'
  Object.assign(ruleForm, {
    id: row.id,
    ruleCode: row.ruleCode,
    ruleName: row.ruleName,
    businessType: row.businessType,
    conditionDesc: row.conditionDesc,
    auditLevel: row.auditLevel,
    thresholdAmount: row.thresholdAmount,
    priority: row.priority,
    status: row.status,
    description: row.description
  })
  formDialogVisible.value = true
}

const handleEnable = async (row: AuditRule): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要启用规则 "${row.ruleName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('启用成功')
    fetchData()
  } catch {}
}

const handleDisable = async (row: AuditRule): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要禁用规则 "${row.ruleName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('禁用成功')
    fetchData()
  } catch {}
}

const handleDelete = async (row: AuditRule): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除规则 "${row.ruleName}" 吗？此操作不可恢复。`, '警告', {
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
      `确定要删除选中的 ${selectedRows.value.length} 条规则吗？此操作不可恢复。`,
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
  ruleFormRef.value?.resetFields()
  resetRuleForm()
}

const handleSubmit = async (): Promise<void> => {
  const valid = await ruleFormRef.value?.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  setTimeout(() => {
    ElMessage.success(formMode.value === 'add' ? '新增成功' : '编辑成功')
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
.ccb-audit-rule {
  .ccb-amount {
    font-weight: 600;
    color: #004098;
  }

  .truncate-text {
    display: inline-block;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }
}
</style>
