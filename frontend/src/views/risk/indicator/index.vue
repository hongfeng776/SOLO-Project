<template>
  <div class="ccb-risk-indicator">
    <CcbPageHeader
      title="风险指标管理"
      description="风险评估指标的配置与管理"
      icon="DataAnalysis"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="指标编码" prop="indicator_code">
        <el-input v-model="searchForm.indicator_code" placeholder="请输入指标编码" clearable />
      </el-form-item>
      <el-form-item label="指标名称" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="请输入指标名称" clearable />
      </el-form-item>
      <el-form-item label="指标类别" prop="category">
        <el-select v-model="searchForm.category" placeholder="请选择指标类别" clearable>
          <el-option v-for="item in IndicatorCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增指标</el-button>
        <el-button type="success" :icon="Refresh" @click="handleRefresh">刷新</el-button>
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
      <el-table-column prop="indicator_code" label="指标编码" width="160" />
      <el-table-column prop="indicator_name" label="指标名称" width="180" show-overflow-tooltip />
      <el-table-column prop="category_text" label="指标类别" width="120" />
      <el-table-column prop="weight" label="权重(%)" width="100" align="center" />
      <el-table-column prop="max_score" label="最高分" width="100" align="center" />
      <el-table-column prop="is_required" label="是否必填" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_required === 1" type="success" effect="light" size="small">是</el-tag>
          <el-tag v-else type="info" effect="light" size="small">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" align="center" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === 1"
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
      :title="isEdit ? '编辑指标' : '新增指标'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="indicatorForm" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="指标编码" prop="indicator_code">
          <el-input v-model="indicatorForm.indicator_code" placeholder="请输入指标编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="指标名称" prop="indicator_name">
          <el-input v-model="indicatorForm.indicator_name" placeholder="请输入指标名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="指标类别" prop="category">
          <el-select v-model="indicatorForm.category" placeholder="请选择指标类别" style="width: 100%">
            <el-option v-for="item in IndicatorCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="权重(%)" prop="weight">
          <el-input-number v-model="indicatorForm.weight" :min="0" :max="100" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最高分" prop="max_score">
          <el-input-number v-model="indicatorForm.max_score" :min="0" :max="100" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否必填" prop="is_required">
          <el-radio-group v-model="indicatorForm.is_required">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="indicatorForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="indicatorForm.sort_order" :min="0" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="indicatorForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入指标描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="评分规则" prop="scoring_rule">
          <el-input
            v-model="scoringRuleText"
            type="textarea"
            :rows="4"
            placeholder="请输入评分规则，JSON格式"
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
import { Plus, Refresh, DataAnalysis } from '@element-plus/icons-vue'
import {
  IndicatorCategoryOptions,
  type RiskIndicator,
  type RiskIndicatorQueryParams,
  type CreateRiskIndicatorRequest,
  type UpdateRiskIndicatorRequest,
  getRiskIndicatorListApi,
  createRiskIndicatorApi,
  updateRiskIndicatorApi,
  deleteRiskIndicatorApi
} from '@api/riskAssessment'

const loading = ref(false)
const tableData = ref<RiskIndicator[]>([])
const total = ref(0)
const submitting = ref(false)

const searchForm = reactive({
  keyword: '',
  indicator_code: '',
  category: undefined as number | undefined,
  status: undefined as number | undefined
})

const pageParams = reactive({ page: 1, pageSize: 20 })

const formDialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const formRef = ref<FormInstance>()
const scoringRuleText = ref('')

const indicatorForm = reactive({
  indicator_code: '',
  indicator_name: '',
  category: undefined as number | undefined,
  weight: 0,
  max_score: 100,
  is_required: 1,
  status: 1,
  sort_order: 0,
  description: ''
})

const formRules: FormRules = {
  indicator_code: [{ required: true, message: '请输入指标编码', trigger: 'blur' }],
  indicator_name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择指标类别', trigger: 'change' }],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }]
}

async function loadList() {
  loading.value = true
  try {
    const params: RiskIndicatorQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      indicator_code: searchForm.indicator_code || undefined,
      category: searchForm.category,
      status: searchForm.status
    }

    const result = await getRiskIndicatorListApi(params)
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
  searchForm.indicator_code = ''
  searchForm.category = undefined
  searchForm.status = undefined
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
  indicatorForm.indicator_code = ''
  indicatorForm.indicator_name = ''
  indicatorForm.category = undefined
  indicatorForm.weight = 0
  indicatorForm.max_score = 100
  indicatorForm.is_required = 1
  indicatorForm.status = 1
  indicatorForm.sort_order = 0
  indicatorForm.description = ''
  scoringRuleText.value = ''
}

function handleCreate() {
  isEdit.value = false
  currentId.value = ''
  resetForm()
  formDialogVisible.value = true
}

function handleEdit(row: RiskIndicator) {
  isEdit.value = true
  currentId.value = row.id
  indicatorForm.indicator_code = row.indicator_code
  indicatorForm.indicator_name = row.indicator_name
  indicatorForm.category = row.category
  indicatorForm.weight = row.weight
  indicatorForm.max_score = row.max_score
  indicatorForm.is_required = row.is_required
  indicatorForm.status = row.status
  indicatorForm.sort_order = row.sort_order
  indicatorForm.description = row.description || ''
  scoringRuleText.value = row.scoring_rule ? JSON.stringify(row.scoring_rule, null, 2) : ''
  formDialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  let scoringRule: any = undefined
  if (scoringRuleText.value.trim()) {
    try {
      scoringRule = JSON.parse(scoringRuleText.value)
    } catch (e) {
      ElMessage.error('评分规则格式错误，请输入正确的JSON格式')
      return
    }
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      const request: UpdateRiskIndicatorRequest = {
        indicator_name: indicatorForm.indicator_name,
        category: indicatorForm.category,
        weight: indicatorForm.weight,
        max_score: indicatorForm.max_score,
        is_required: indicatorForm.is_required,
        status: indicatorForm.status,
        sort_order: indicatorForm.sort_order,
        description: indicatorForm.description || undefined,
        scoring_rule: scoringRule
      }
      await updateRiskIndicatorApi(currentId.value, request)
      ElMessage.success('更新成功')
    } else {
      const request: CreateRiskIndicatorRequest = {
        indicator_code: indicatorForm.indicator_code,
        indicator_name: indicatorForm.indicator_name,
        category: indicatorForm.category!,
        weight: indicatorForm.weight,
        max_score: indicatorForm.max_score,
        is_required: indicatorForm.is_required,
        status: indicatorForm.status,
        sort_order: indicatorForm.sort_order,
        description: indicatorForm.description || undefined,
        scoring_rule: scoringRule
      }
      await createRiskIndicatorApi(request)
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

function handleToggleStatus(row: RiskIndicator, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(
    `确定要${action}该指标吗？`,
    `${action}确认`,
    {
      confirmButtonText: `确认${action}`,
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await updateRiskIndicatorApi(row.id, { status })
      ElMessage.success(`${action}成功`)
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || `${action}失败`)
    }
  }).catch(() => {})
}

function handleDelete(row: RiskIndicator) {
  ElMessageBox.confirm(
    `确定要删除指标"${row.indicator_name}"吗？删除后不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      await deleteRiskIndicatorApi(row.id)
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
.ccb-risk-indicator {
}
</style>
