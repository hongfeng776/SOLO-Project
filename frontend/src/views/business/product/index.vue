<template>
  <div class="ccb-business-product">
    <CcbPageHeader
      title="产品管理"
      description="管理金融产品上架与销售配置"
      icon="Goods"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增产品</el-button>
      </template>
    </CcbPageHeader>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="产品编码" prop="productCode">
        <el-input v-model="searchForm.productCode" placeholder="请输入产品编码" clearable />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
      </el-form-item>
      <el-form-item label="产品类型" prop="productType">
        <el-select v-model="searchForm.productType" placeholder="请选择产品类型" clearable>
          <el-option label="理财产品" :value="1" />
          <el-option label="基金产品" :value="2" />
          <el-option label="保险产品" :value="3" />
          <el-option label="贷款产品" :value="4" />
          <el-option label="存款产品" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
          <el-option label="R1低风险" :value="1" />
          <el-option label="R2中低风险" :value="2" />
          <el-option label="R3中风险" :value="3" />
          <el-option label="R4中高风险" :value="4" />
          <el-option label="R5高风险" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="上架状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="待上架" :value="0" />
          <el-option label="已上架" :value="1" />
          <el-option label="已下架" :value="2" />
          <el-option label="已售罄" :value="3" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="success" :icon="Upload" @click="handleUpload">批量上架</el-button>
        <el-button type="warning" :icon="Download" @click="handleOffShelf">批量下架</el-button>
        <el-button type="primary" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          在架产品：<el-tag type="success" effect="dark">{{ onShelfCount }}</el-tag>
          今日销量：<el-tag type="primary" effect="dark">¥{{ formatMoneyWithComma(todaySalesAmount) }}万</el-tag>
        </el-text>
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
      <el-table-column prop="productCode" label="产品编码" width="130" />
      <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="productType" label="产品类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getProductTypeTagType(row.productType)" effect="light" size="small">
            {{ getProductTypeLabel(row.productType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskLevelTagType(row.riskLevel)" effect="light" size="small">
            {{ getRiskLevelLabel(row.riskLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="expectedYield" label="预期收益率" width="110" align="right">
        <template #default="{ row }">
          <span class="ccb-yield">{{ row.expectedYield }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="term" label="投资期限" width="100" align="center">
        <template #default="{ row }">
          {{ row.term }}{{ row.termUnit }}
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="起购金额" width="120" align="right">
        <template #default="{ row }">
          ¥{{ formatMoneyWithComma(row.minAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="totalQuota" label="发行规模(万)" width="120" align="right">
        <template #default="{ row }">
          {{ formatMoneyWithComma(row.totalQuota) }}
        </template>
      </el-table-column>
      <el-table-column prop="remainingQuota" label="剩余额度(万)" width="120" align="right">
        <template #default="{ row }">
          <span :class="{ 'ccb-quota-warn': row.remainingQuota / row.totalQuota < 0.1 }">
            {{ formatMoneyWithComma(row.remainingQuota) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" effect="light">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 0" type="success" link size="small" @click="handleOnShelf(row)">上架</el-button>
          <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleOffShelf(row)">下架</el-button>
          <el-button type="info" link size="small" @click="handleQuota(row)">调额</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'add' ? '新增产品' : '编辑产品'"
      width="720px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productFormRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品编码" prop="productCode">
              <el-input
                v-model="productForm.productCode"
                placeholder="请输入产品编码"
                :disabled="formMode === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="productForm.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品类型" prop="productType">
              <el-select v-model="productForm.productType" placeholder="请选择产品类型" style="width: 100%">
                <el-option label="理财产品" :value="1" />
                <el-option label="基金产品" :value="2" />
                <el-option label="保险产品" :value="3" />
                <el-option label="贷款产品" :value="4" />
                <el-option label="存款产品" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险等级" prop="riskLevel">
              <el-select v-model="productForm.riskLevel" placeholder="请选择风险等级" style="width: 100%">
                <el-option label="R1低风险" :value="1" />
                <el-option label="R2中低风险" :value="2" />
                <el-option label="R3中风险" :value="3" />
                <el-option label="R4中高风险" :value="4" />
                <el-option label="R5高风险" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="预期收益率(%)" prop="expectedYield">
              <el-input-number
                v-model="productForm.expectedYield"
                :min="0"
                :max="100"
                :precision="2"
                :step="0.1"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="投资期限" prop="term">
              <el-input-number
                v-model="productForm.term"
                :min="1"
                :precision="0"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期限单位" prop="termUnit">
              <el-select v-model="productForm.termUnit" style="width: 100%">
                <el-option label="天" value="天" />
                <el-option label="月" value="个月" />
                <el-option label="年" value="年" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="起购金额" prop="minAmount">
              <el-input-number
                v-model="productForm.minAmount"
                :min="0"
                :precision="2"
                :step="10000"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发行规模(万)" prop="totalQuota">
              <el-input-number
                v-model="productForm.totalQuota"
                :min="0"
                :precision="2"
                :step="1000"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单人限额(万)" prop="perLimit">
              <el-input-number
                v-model="productForm.perLimit"
                :min="0"
                :precision="2"
                :step="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开售时间" prop="startTime">
              <el-date-picker
                v-model="productForm.startTime"
                type="datetime"
                placeholder="选择开售时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止时间" prop="endTime">
              <el-date-picker
                v-model="productForm.endTime"
                type="datetime"
                placeholder="选择截止时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="产品简介" prop="summary">
          <el-input
            v-model="productForm.summary"
            type="textarea"
            :rows="2"
            placeholder="请输入产品简介（展示在产品列表）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="详细说明" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入产品详细说明、风险提示等"
          />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-radio-group v-model="productForm.status">
            <el-radio :value="0">待上架</el-radio>
            <el-radio :value="1">立即上架</el-radio>
          </el-radio-group>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatMoneyWithComma, formatDateTime } from '@utils'

interface Product {
  id: number
  productCode: string
  productName: string
  productType: number
  riskLevel: number
  expectedYield: number
  term: number
  termUnit: string
  minAmount: number
  totalQuota: number
  remainingQuota: number
  perLimit: number
  startTime: string
  endTime: string
  todaySalesAmount: number
  todaySalesCount: number
  status: number
  summary: string
  description: string
  createdAt: string
  updatedAt: string
}

const loading = ref<boolean>(false)
const tableData = ref<Product[]>([])
const total = ref<number>(0)
const selectedRows = ref<Product[]>([])

const formDialogVisible = ref<boolean>(false)
const formMode = ref<'add' | 'edit'>('add')
const formLoading = ref<boolean>(false)
const productFormRef = ref<FormInstance>()

const searchForm = reactive({
  productCode: '',
  productName: '',
  productType: null as number | null,
  riskLevel: null as number | null,
  status: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const productForm = reactive({
  id: 0,
  productCode: '',
  productName: '',
  productType: null as number | null,
  riskLevel: null as number | null,
  expectedYield: 3.5,
  term: 90,
  termUnit: '天',
  minAmount: 10000,
  totalQuota: 10000,
  remainingQuota: 10000,
  perLimit: 500,
  startTime: '',
  endTime: '',
  status: 0,
  summary: '',
  description: ''
})

const productFormRules: FormRules = {
  productCode: [
    { required: true, message: '请输入产品编码', trigger: 'blur' }
  ],
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 64, message: '名称长度在 2 到 64 个字符', trigger: 'blur' }
  ],
  productType: [
    { required: true, message: '请选择产品类型', trigger: 'change' }
  ],
  riskLevel: [
    { required: true, message: '请选择风险等级', trigger: 'change' }
  ],
  expectedYield: [
    { required: true, message: '请输入预期收益率', trigger: 'blur' }
  ],
  term: [
    { required: true, message: '请输入投资期限', trigger: 'blur' }
  ],
  minAmount: [
    { required: true, message: '请输入起购金额', trigger: 'blur' }
  ],
  totalQuota: [
    { required: true, message: '请输入发行规模', trigger: 'blur' }
  ],
  summary: [
    { required: true, message: '请输入产品简介', trigger: 'blur' }
  ]
}

const onShelfCount = computed<number>(() => {
  return tableData.value.filter((item) => item.status === 1).length
})

const todaySalesAmount = computed<number>(() => {
  return tableData.value.reduce((sum, item) => sum + item.todaySalesAmount, 0)
})

const getProductTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    1: '理财产品',
    2: '基金产品',
    3: '保险产品',
    4: '贷款产品',
    5: '存款产品'
  }
  return labels[type] || '未知'
}

const getProductTypeTagType = (type: number): string => {
  const types: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'danger',
    5: 'info'
  }
  return types[type] || 'info'
}

const getRiskLevelLabel = (level: number): string => {
  const labels: Record<number, string> = {
    1: 'R1低风险',
    2: 'R2中低风险',
    3: 'R3中风险',
    4: 'R4中高风险',
    5: 'R5高风险'
  }
  return labels[level] || '未知'
}

const getRiskLevelTagType = (level: number): string => {
  const types: Record<number, string> = {
    1: 'success',
    2: 'primary',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  }
  return types[level] || 'info'
}

const getStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    0: '待上架',
    1: '已上架',
    2: '已下架',
    3: '已售罄'
  }
  return labels[status] || '未知'
}

const getStatusTagType = (status: number): string => {
  const types: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return types[status] || 'info'
}

const mockProducts: Product[] = Array.from({ length: 16 }, (_, i) => {
  const productTypes = [1, 1, 2, 1, 3, 4, 5, 1, 2, 1, 3, 1, 5, 4, 1, 2]
  const riskLevels = [2, 1, 3, 2, 2, 3, 1, 3, 4, 1, 3, 2, 1, 4, 2, 3]
  const names = [
    '稳盈系列A款90天', '安享存7天通知', '建行优选混合基金', '稳盈系列B款180天',
    '鑫福年年保险', '快e贷消费贷款', '定期存款3年期', '恒盈系列365天',
    '建行成长股票基金', '稳盈系列C款360天', '康享人生重疾险', '尊享系列730天',
    '大额存单1年期', '抵押经营贷款', '稳盈系列D款270天', '平衡配置FOF基金'
  ]
  const totalQuotas = [50000, 30000, 100000, 80000, 20000, 150000, 500000, 100000, 80000, 60000, 30000, 120000, 300000, 200000, 70000, 50000]
  const remainingPercents = [0.35, 0.68, 0.52, 0.12, 0.45, 0.28, 0.85, 0.05, 0.42, 0.58, 0.78, 0.22, 0.92, 0.15, 0.48, 0.36]

  return {
    id: i + 1,
    productCode: `PRD${String(i + 1).padStart(6, '0')}`,
    productName: names[i],
    productType: productTypes[i],
    riskLevel: riskLevels[i],
    expectedYield: [2.85, 1.85, 6.5, 3.45, 4.2, 5.6, 2.65, 4.0, 12.8, 2.95, 3.5, 4.5, 2.3, 4.8, 3.85, 5.8][i],
    term: [90, 7, 0, 180, 0, 12, 36, 365, 0, 360, 0, 730, 12, 24, 270, 0][i],
    termUnit: [0, 0, 1, 0, 2, 2, 3, 0, 1, 0, 2, 0, 2, 2, 0, 1].map((u) => ['天', '', '年', '个月'][u])[i],
    minAmount: [10000, 50000, 1000, 10000, 10000, 1000, 200000, 10000, 1000, 50000, 5000, 100000, 1000000, 10000, 20000, 1000][i],
    totalQuota: totalQuotas[i],
    remainingQuota: Math.round(totalQuotas[i] * remainingPercents[i]),
    perLimit: [500, 1000, 200, 500, 300, 1000, 5000, 1000, 100, 800, 500, 2000, 10000, 2000, 600, 500][i],
    startTime: '2024-06-01 09:00:00',
    endTime: '2024-12-31 18:00:00',
    todaySalesAmount: Math.round(totalQuotas[i] * (1 - remainingPercents[i]) * 0.08),
    todaySalesCount: Math.floor(Math.random() * 200) + 20,
    status: [1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 0, 1, 1, 2, 1, 1][i],
    summary: '本产品为固定收益类产品，适合稳健型投资者',
    description: '本产品募集资金主要投资于高评级信用债、同业存单等固定收益类资产，风险可控，收益稳定。产品不保本，投资者需自行承担投资风险。',
    createdAt: `2024-05-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`,
    updatedAt: `2024-06-1${i % 6} 12:00:00`
  }
})

const resetProductForm = (): void => {
  productForm.id = 0
  productForm.productCode = ''
  productForm.productName = ''
  productForm.productType = null
  productForm.riskLevel = null
  productForm.expectedYield = 3.5
  productForm.term = 90
  productForm.termUnit = '天'
  productForm.minAmount = 10000
  productForm.totalQuota = 10000
  productForm.remainingQuota = 10000
  productForm.perLimit = 500
  productForm.startTime = ''
  productForm.endTime = ''
  productForm.status = 0
  productForm.summary = ''
  productForm.description = ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockProducts.slice(start, end)
    total.value = mockProducts.length
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
  selectedRows.value = val as Product[]
}

const handleAdd = (): void => {
  formMode.value = 'add'
  resetProductForm()
  formDialogVisible.value = true
}

const handleView = (row: Product): void => {
  ElMessage.info(`查看产品详情：${row.productName}`)
}

const handleEdit = (row: Product): void => {
  formMode.value = 'edit'
  Object.assign(productForm, {
    id: row.id,
    productCode: row.productCode,
    productName: row.productName,
    productType: row.productType,
    riskLevel: row.riskLevel,
    expectedYield: row.expectedYield,
    term: row.term,
    termUnit: row.termUnit,
    minAmount: row.minAmount,
    totalQuota: row.totalQuota,
    remainingQuota: row.remainingQuota,
    perLimit: row.perLimit,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    summary: row.summary,
    description: row.description
  })
  formDialogVisible.value = true
}

const handleOnShelf = async (row?: Product): Promise<void> => {
  const count = row ? 1 : selectedRows.value.length
  const name = row ? row.productName : `${count}个产品`
  try {
    await ElMessageBox.confirm(`确定要上架 ${name} 吗？`, '提示', {
      confirmButtonText: '确定上架',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('上架成功')
    fetchData()
  } catch {}
}

const handleOffShelf = async (row?: Product): Promise<void> => {
  const count = row ? 1 : selectedRows.value.length
  const name = row ? row.productName : `${count}个产品`
  try {
    await ElMessageBox.confirm(`确定要下架 ${name} 吗？下架后用户将无法购买。`, '提示', {
      confirmButtonText: '确定下架',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('下架成功')
    fetchData()
  } catch {}
}

const handleQuota = (row: Product): void => {
  ElMessage.info(`调整产品额度：${row.productName}`)
}

const handleDelete = async (row: Product): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除产品 "${row.productName}" 吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

const handleUpload = (): void => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要上架的产品')
    return
  }
  handleOnShelf()
}

const handleExport = (): void => {
  ElMessage.success('导出任务已提交，请在任务中心查看')
}

const handleDialogClosed = (): void => {
  productFormRef.value?.resetFields()
  resetProductForm()
}

const handleSubmit = async (): Promise<void> => {
  const valid = await productFormRef.value?.validate().catch(() => false)
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
.ccb-business-product {
  .ccb-yield {
    font-weight: 600;
    color: #f5222d;
  }

  .ccb-quota-warn {
    color: #faad14;
    font-weight: 600;
  }

  .ccb-table-toolbar-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}
</style>
