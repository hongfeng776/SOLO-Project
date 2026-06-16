<template>
  <div class="stock-page">
    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button
        v-if="hasPerm('stock:add')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增
      </el-button>
      <el-button
        v-if="hasPerm('stock:batchDelete')"
        type="danger"
        :icon="Delete"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
      <el-button :icon="Download" @click="handleExport">
        导出
      </el-button>
    </div>

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="hasPerm('stock:batchDelete')"
      :showIndex="true"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #market="{ row }">
        {{ MARKET_LABELS[row.market as keyof typeof MARKET_LABELS] || row.market }}
      </template>

      <template #changeAmount="{ row }">
        <span :class="getChangeClass(row.changeAmount)">
          {{ formatMoney(row.changeAmount, 2) }}
        </span>
      </template>

      <template #volume="{ row }">
        {{ formatVolume(row.volume) }}
      </template>

      <template #turnover="{ row }">
        {{ formatVolume(row.turnover) }}
      </template>

      <template #totalMarketCap="{ row }">
        {{ formatMarketCap(row.totalMarketCap) }}
      </template>

      <template #action="{ row }">
        <el-button type="primary" link :icon="View" @click="handleView(row)">
          查看
        </el-button>
        <el-button
          v-if="hasPerm('stock:edit')"
          type="primary"
          link
          :icon="Edit"
          @click="handleEdit(row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="hasPerm('stock:delete')"
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
            <el-form-item label="股票代码" prop="stockCode">
              <el-input v-model="formData.stockCode" placeholder="请输入股票代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="股票名称" prop="stockName">
              <el-input v-model="formData.stockName" placeholder="请输入股票名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市场" prop="market">
              <el-select v-model="formData.market" placeholder="请选择市场" style="width: 100%">
                <el-option
                  v-for="(label, value) in MARKET_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交易日期" prop="tradeDate">
              <el-date-picker
                v-model="formData.tradeDate"
                type="date"
                placeholder="请选择交易日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现价" prop="currentPrice">
              <el-input-number
                v-model="formData.currentPrice"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="涨跌额" prop="changeAmount">
              <el-input-number
                v-model="formData.changeAmount"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="涨跌幅(%)" prop="changeRate">
              <el-input-number
                v-model="formData.changeRate"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开盘价" prop="openPrice">
              <el-input-number
                v-model="formData.openPrice"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收盘价" prop="closePrice">
              <el-input-number
                v-model="formData.closePrice"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高价" prop="highPrice">
              <el-input-number
                v-model="formData.highPrice"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低价" prop="lowPrice">
              <el-input-number
                v-model="formData.lowPrice"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成交量" prop="volume">
              <el-input-number
                v-model="formData.volume"
                :min="0"
                :precision="0"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成交额" prop="turnover">
              <el-input-number
                v-model="formData.turnover"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市盈率" prop="peRatio">
              <el-input-number
                v-model="formData.peRatio"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市净率" prop="pbRatio">
              <el-input-number
                v-model="formData.pbRatio"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总市值" prop="totalMarketCap">
              <el-input-number
                v-model="formData.totalMarketCap"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
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
import { Plus, Delete, Download, View, Edit } from '@element-plus/icons-vue'
import { usePermission } from '@/hooks/usePermission'
import { MARKET_LABELS } from '@/constants/dictionaries'
import { formatMoney, formatVolume, formatMarketCap } from '@/utils/format'
import * as stockApi from '@/api/stockQuote'
import type { IStockQuote, IPaginatedData } from '@/types/api'

const { hasPerm } = usePermission()

const loading = ref(false)
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const isView = ref(false)
const selectedIds = ref<number[]>([])

const tableData = ref<IStockQuote[]>([])
const pagination = reactive({
  show: true,
  page: 1,
  pageSize: 10,
  total: 0
})

const searchParams = reactive<Record<string, any>>({})

const dialogType = ref<'add' | 'edit' | 'view'>('add')
const dialogTitle = computed(() => {
  const titles = { add: '新增股票', edit: '编辑股票', view: '查看股票' }
  return titles[dialogType.value]
})
const dialogWidth = '900px'

const formRef = ref<FormInstance>()
const formData = reactive<Partial<IStockQuote>>({
  stockCode: '',
  stockName: '',
  market: '',
  tradeDate: '',
  currentPrice: 0,
  changeAmount: 0,
  changeRate: 0,
  openPrice: 0,
  closePrice: 0,
  highPrice: 0,
  lowPrice: 0,
  volume: 0,
  turnover: 0,
  peRatio: 0,
  pbRatio: 0,
  totalMarketCap: 0
})

const formRules: FormRules = {
  stockCode: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  stockName: [{ required: true, message: '请输入股票名称', trigger: 'blur' }],
  market: [{ required: true, message: '请选择市场', trigger: 'change' }],
  tradeDate: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  currentPrice: [{ required: true, message: '请输入现价', trigger: 'blur' }]
}

const filterConfig = [
  {
    prop: 'keyword',
    label: '股票代码/名称',
    type: 'input' as const,
    placeholder: '请输入股票代码或名称'
  },
  {
    prop: 'market',
    label: '市场',
    type: 'select' as const,
    options: Object.entries(MARKET_LABELS).map(([value, label]) => ({ value, label }))
  },
  {
    prop: 'tradeDate',
    label: '交易日期',
    type: 'date' as const
  }
]

const tableColumns = [
  { prop: 'stockCode', label: '股票代码', width: 120, fixed: 'left' as const },
  { prop: 'stockName', label: '股票名称', width: 140, fixed: 'left' as const },
  { prop: 'market', label: '市场', width: 100, slot: 'market' },
  { prop: 'currentPrice', label: '现价', width: 100, type: 'money' as const, sortable: true },
  { prop: 'changeAmount', label: '涨跌额', width: 100, slot: 'changeAmount', sortable: true },
  { prop: 'changeRate', label: '涨跌幅', width: 100, type: 'change' as const, sortable: true },
  { prop: 'openPrice', label: '开盘价', width: 100, type: 'money' as const },
  { prop: 'closePrice', label: '收盘价', width: 100, type: 'money' as const },
  { prop: 'highPrice', label: '最高价', width: 100, type: 'money' as const },
  { prop: 'lowPrice', label: '最低价', width: 100, type: 'money' as const },
  { prop: 'volume', label: '成交量', width: 120, slot: 'volume', sortable: true },
  { prop: 'turnover', label: '成交额', width: 120, slot: 'turnover', sortable: true },
  { prop: 'peRatio', label: '市盈率', width: 100, type: 'money' as const, precision: 2 },
  { prop: 'pbRatio', label: '市净率', width: 100, type: 'money' as const, precision: 2 },
  { prop: 'totalMarketCap', label: '总市值', width: 130, slot: 'totalMarketCap', sortable: true },
  { prop: 'tradeDate', label: '交易日期', width: 120, type: 'date' as const },
  { prop: 'action', label: '操作', width: 180, fixed: 'right' as const, slot: 'action' }
]

function getChangeClass(value: number): string {
  if (value > 0) return 'fin-rise'
  if (value < 0) return 'fin-fall'
  return ''
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    const res = await stockApi.getList(params)
    const data = res.data as IPaginatedData<IStockQuote>
    tableData.value = data.list
    pagination.total = data.total
  } catch (error) {
    console.error('获取股票列表失败:', error)
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

function handleEdit(row: IStockQuote) {
  dialogType.value = 'edit'
  isView.value = false
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleView(row: IStockQuote) {
  dialogType.value = 'view'
  isView.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleDelete(row: IStockQuote) {
  try {
    await ElMessageBox.confirm(`确定要删除股票"${row.stockName}"吗？`, '删除确认', {
      type: 'warning'
    })
    await stockApi.delete(row.id as number)
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
      `确定要删除选中的 ${selectedIds.value.length} 条股票数据吗？`,
      '批量删除确认',
      { type: 'warning' }
    )
    await stockApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

async function handleExport() {
  try {
    const params = { ...searchParams }
    const res = await stockApi.exportStock(params)
    const blob = new Blob([res.data as BlobPart], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `股票行情数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
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
      await stockApi.create(formData)
      ElMessage.success('新增成功')
    } else {
      await stockApi.update(formData.id as number, formData)
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
    stockCode: '',
    stockName: '',
    market: '',
    tradeDate: '',
    currentPrice: 0,
    changeAmount: 0,
    changeRate: 0,
    openPrice: 0,
    closePrice: 0,
    highPrice: 0,
    lowPrice: 0,
    volume: 0,
    turnover: 0,
    peRatio: 0,
    pbRatio: 0,
    totalMarketCap: 0
  })
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stock-page {
  padding: 20px;

  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }
}

.fin-rise {
  color: var(--fin-danger);
}

.fin-fall {
  color: var(--fin-success);
}
</style>
