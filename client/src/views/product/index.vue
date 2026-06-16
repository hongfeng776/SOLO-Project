<template>
  <div class="product-page">
    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button
        v-if="hasPerm('product:add')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增
      </el-button>
      <el-button
        v-if="hasPerm('product:batchDelete')"
        type="danger"
        :icon="Delete"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
    </div>

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="hasPerm('product:batchDelete')"
      :showIndex="true"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #productType="{ row }">
        {{ PRODUCT_TYPE_LABELS[row.productType as keyof typeof PRODUCT_TYPE_LABELS] || row.productType }}
      </template>

      <template #riskLevel="{ row }">
        <el-tag
          :color="RISK_LEVEL_COLORS[row.riskLevel as keyof typeof RISK_LEVEL_COLORS] || '#909399'"
          effect="dark"
        >
          {{ RISK_LEVEL_LABELS[row.riskLevel as keyof typeof RISK_LEVEL_LABELS] || row.riskLevel }}
        </el-tag>
      </template>

      <template #productStatus="{ row }">
        <el-tag
          :type="PRODUCT_STATUS_COLORS[row.productStatus as keyof typeof PRODUCT_STATUS_COLORS] || 'info'"
          effect="light"
        >
          {{ PRODUCT_STATUS_LABELS[row.productStatus as keyof typeof PRODUCT_STATUS_LABELS] || row.productStatus }}
        </el-tag>
      </template>

      <template #minAmount="{ row }">
        {{ formatMoney(row.minAmount, 2) }}
      </template>

      <template #maxAmount="{ row }">
        {{ formatMoney(row.maxAmount, 2) }}
      </template>

      <template #action="{ row }">
        <el-button type="primary" link :icon="View" @click="handleView(row)">
          查看
        </el-button>
        <el-button
          v-if="hasPerm('product:edit')"
          type="primary"
          link
          :icon="Edit"
          @click="handleEdit(row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="hasPerm('product:delete')"
          type="danger"
          link
          :icon="Delete"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      :loading="dialogLoading"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="isView"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品代码" prop="productCode">
              <el-input v-model="formData.productCode" placeholder="请输入产品代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="formData.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品类型" prop="productType">
              <el-select v-model="formData.productType" placeholder="请选择产品类型" style="width: 100%">
                <el-option
                  v-for="(label, value) in PRODUCT_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险等级" prop="riskLevel">
              <el-select v-model="formData.riskLevel" placeholder="请选择风险等级" style="width: 100%">
                <el-option
                  v-for="(label, value) in RISK_LEVEL_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品状态" prop="productStatus">
              <el-select v-model="formData.productStatus" placeholder="请选择产品状态" style="width: 100%">
                <el-option
                  v-for="(label, value) in PRODUCT_STATUS_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位净值" prop="nav">
              <el-input-number
                v-model="formData.nav"
                :min="0"
                :precision="4"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="累计净值" prop="accNav">
              <el-input-number
                v-model="formData.accNav"
                :min="0"
                :precision="4"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日收益率(%)" prop="dailyYield">
              <el-input-number
                v-model="formData.dailyYield"
                :precision="4"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年收益率(%)" prop="annualYield">
              <el-input-number
                v-model="formData.annualYield"
                :precision="4"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起购金额" prop="minAmount">
              <el-input-number
                v-model="formData.minAmount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高限额" prop="maxAmount">
              <el-input-number
                v-model="formData.maxAmount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="管理人" prop="manager">
              <el-input v-model="formData.manager" placeholder="请输入管理人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="托管人" prop="custodian">
              <el-input v-model="formData.custodian" placeholder="请输入托管人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="募集开始日" prop="raiseStartDate">
              <el-date-picker
                v-model="formData.raiseStartDate"
                type="date"
                placeholder="请选择募集开始日"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="募集结束日" prop="raiseEndDate">
              <el-date-picker
                v-model="formData.raiseEndDate"
                type="date"
                placeholder="请选择募集结束日"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日" prop="maturityDate">
              <el-date-picker
                v-model="formData.maturityDate"
                type="date"
                placeholder="请选择到期日"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="产品描述" prop="productDesc">
              <el-input
                v-model="formData.productDesc"
                type="textarea"
                :rows="3"
                placeholder="请输入产品描述"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete, View, Edit } from '@element-plus/icons-vue'
import { usePermission } from '@/hooks/usePermission'
import {
  PRODUCT_TYPE_LABELS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS
} from '@/constants/dictionaries'
import { formatMoney, formatRate } from '@/utils/format'
import * as productApi from '@/api/assetProduct'
import type { IAssetProduct, IPaginatedData } from '@/types/api'

const { hasPerm } = usePermission()

const loading = ref(false)
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const isView = ref(false)
const selectedIds = ref<number[]>([])

const tableData = ref<IAssetProduct[]>([])
const pagination = reactive({
  show: true,
  page: 1,
  pageSize: 10,
  total: 0
})

const searchParams = reactive<Record<string, any>>({})

const dialogType = ref<'add' | 'edit' | 'view'>('add')
const dialogTitle = computed(() => {
  const titles = { add: '新增产品', edit: '编辑产品', view: '查看产品' }
  return titles[dialogType.value]
})
const dialogWidth = '900px'

const formRef = ref<FormInstance>()
const formData = reactive<Partial<IAssetProduct>>({
  productCode: '',
  productName: '',
  productType: '',
  riskLevel: '',
  nav: 0,
  accNav: 0,
  dailyYield: 0,
  annualYield: 0,
  productStatus: '',
  minAmount: 0,
  maxAmount: 0,
  manager: '',
  custodian: '',
  raiseStartDate: '',
  raiseEndDate: '',
  maturityDate: '',
  productDesc: ''
})

const formRules: FormRules = {
  productCode: [{ required: true, message: '请输入产品代码', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  productStatus: [{ required: true, message: '请选择产品状态', trigger: 'change' }],
  nav: [{ required: true, message: '请输入单位净值', trigger: 'blur' }]
}

const filterConfig = [
  {
    prop: 'keyword',
    label: '产品代码/名称',
    type: 'input' as const,
    placeholder: '请输入产品代码或名称'
  },
  {
    prop: 'productType',
    label: '产品类型',
    type: 'select' as const,
    options: Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  },
  {
    prop: 'riskLevel',
    label: '风险等级',
    type: 'select' as const,
    options: Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => ({ value, label }))
  },
  {
    prop: 'productStatus',
    label: '产品状态',
    type: 'select' as const,
    options: Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  }
]

const tableColumns = [
  { prop: 'productCode', label: '产品代码', width: 140, fixed: 'left' as const },
  { prop: 'productName', label: '产品名称', width: 180, fixed: 'left' as const },
  { prop: 'productType', label: '产品类型', width: 100, slot: 'productType' },
  { prop: 'riskLevel', label: '风险等级', width: 130, slot: 'riskLevel' },
  { prop: 'nav', label: '单位净值', width: 120, type: 'money' as const, precision: 4 },
  { prop: 'accNav', label: '累计净值', width: 120, type: 'money' as const, precision: 4 },
  { prop: 'dailyYield', label: '日收益率', width: 110, type: 'change' as const, sortable: true },
  { prop: 'annualYield', label: '年收益率', width: 110, type: 'change' as const, sortable: true },
  { prop: 'productStatus', label: '产品状态', width: 100, slot: 'productStatus' },
  { prop: 'minAmount', label: '起购金额', width: 120, slot: 'minAmount' },
  { prop: 'maxAmount', label: '最高限额', width: 120, slot: 'maxAmount' },
  { prop: 'manager', label: '管理人', width: 120 },
  { prop: 'custodian', label: '托管人', width: 120 },
  { prop: 'raiseStartDate', label: '募集开始日', width: 120, type: 'date' as const },
  { prop: 'raiseEndDate', label: '募集结束日', width: 120, type: 'date' as const },
  { prop: 'maturityDate', label: '到期日', width: 120, type: 'date' as const },
  { prop: 'action', label: '操作', width: 180, fixed: 'right' as const, slot: 'action' }
]

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    const res = await productApi.getList(params)
    const data = res.data as IPaginatedData<IAssetProduct>
    tableData.value = data.list
    pagination.total = data.total
  } catch (error) {
    console.error('获取产品列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete searchParams[key]
  })
  pagination.page = 1
  fetchData()
}

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map(item => item.id)
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

function handleAdd() {
  dialogType.value = 'add'
  isView.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: IAssetProduct) {
  dialogType.value = 'edit'
  isView.value = false
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleView(row: IAssetProduct) {
  dialogType.value = 'view'
  isView.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleDelete(row: IAssetProduct) {
  try {
    await ElMessageBox.confirm(`确定要删除产品"${row.productName}"吗？`, '删除确认', {
      type: 'warning'
    })
    await productApi.delete(row.id as number)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条产品数据吗？`,
      '批量删除确认',
      { type: 'warning' }
    )
    await productApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

async function handleDialogConfirm() {
  if (!formRef.value) return
  if (isView.value) {
    dialogVisible.value = false
    return
  }

  try {
    await formRef.value.validate()
    dialogLoading.value = true

    if (dialogType.value === 'add') {
      await productApi.create(formData)
      ElMessage.success('新增成功')
    } else {
      await productApi.update(formData.id as number, formData)
      ElMessage.success('编辑成功')
    }

    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    dialogLoading.value = false
  }
}

function handleDialogCancel() {
  dialogVisible.value = false
  resetForm()
}

function resetForm() {
  Object.assign(formData, {
    productCode: '',
    productName: '',
    productType: '',
    riskLevel: '',
    nav: 0,
    accNav: 0,
    dailyYield: 0,
    annualYield: 0,
    productStatus: '',
    minAmount: 0,
    maxAmount: 0,
    manager: '',
    custodian: '',
    raiseStartDate: '',
    raiseEndDate: '',
    maturityDate: '',
    productDesc: ''
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.product-page {
  padding: 20px;

  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }
}
</style>
