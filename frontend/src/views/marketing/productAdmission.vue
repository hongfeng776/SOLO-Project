<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="选择活动">
          <el-select
            v-model="filterForm.marketingId"
            placeholder="请选择活动"
            style="width: 260px"
            @change="handleMarketingChange"
          >
            <el-option
              v-for="item in marketingList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <ProTable
      ref="proTableRef"
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchList"
      :stripe="true"
      :highlight-current-row="true"
      :show-batch-delete="false"
      :actions-width="220"
      @add="handleAdd"
    >
      <template #toolbar-left>
        <el-button type="primary" @click="handleAdd" :disabled="!filterForm.marketingId">
          <el-icon><Plus /></el-icon>商品报名
        </el-button>
        <el-button type="success" @click="handleBatchAddCompliant" :disabled="!filterForm.marketingId">
          <el-icon><Goods /></el-icon>批量补充合规商品
        </el-button>
      </template>

      <template #batch-actions="{ rows }">
        <el-button link type="success" @click="handleBatchAuditPass(rows)" :disabled="!canBatchAuditPass(rows)">
          <el-icon><Check /></el-icon>批量审核通过
        </el-button>
        <el-button link type="danger" @click="handleBatchAuditReject(rows)" :disabled="!canBatchAuditReject(rows)">
          <el-icon><Close /></el-icon>批量审核驳回
        </el-button>
        <el-button link type="warning" @click="handleBatchOffline(rows)" :disabled="!canBatchOffline(rows)">
          <el-icon><VideoPause /></el-icon>批量下架
        </el-button>
        <el-button link type="success" @click="handleBatchOnline(rows)" :disabled="!canBatchOnline(rows)">
          <el-icon><VideoPlay /></el-icon>批量上架
        </el-button>
        <el-button link type="danger" @click="handleBatchRemove(rows)">
          <el-icon><Delete /></el-icon>批量移除
        </el-button>
      </template>

      <template #goodsName="{ row }">
        <div class="goods-name-cell">
          <span :class="{ 'text-red': row.admissionStatus === 2 || row.admissionStatus === 3 }">
            {{ row.goodsName }}
          </span>
          <el-tag
            v-if="row.complianceRating && row.complianceRating >= 4"
            size="small"
            type="danger"
            class="ml-8"
          >
            低评级
          </el-tag>
          <el-tag
            v-if="row.stock !== undefined && row.stock < 100"
            size="small"
            type="warning"
            class="ml-8"
          >
            库存不足
          </el-tag>
        </div>
      </template>

      <template #admissionStatus="{ row }">
        <el-tag :type="admissionStatusMap[row.admissionStatus ?? 0]?.type">
          {{ admissionStatusMap[row.admissionStatus ?? 0]?.label }}
        </el-tag>
      </template>

      <template #originalPrice="{ row }">
        ¥{{ row.originalPrice?.toFixed(2) || '-' }}
      </template>

      <template #activityPrice="{ row }">
        <span class="activity-price">¥{{ row.activityPrice?.toFixed(2) || '-' }}</span>
      </template>

      <template #stock="{ row }">
        <span :class="{ 'text-red': row.stock !== undefined && row.stock < 100 }">
          {{ row.stock ?? '-' }}
        </span>
      </template>

      <template #complianceRating="{ row }">
        <el-tag :type="getRatingType(row.complianceRating)">
          {{ getRatingLabel(row.complianceRating) }}
        </el-tag>
      </template>

      <template #merchantCreditScore="{ row }">
        <span :class="{ 'text-red': row.merchantCreditScore !== undefined && row.merchantCreditScore < 60 }">
          {{ row.merchantCreditScore ?? '-' }}
        </span>
      </template>

      <template #applyTime="{ row }">
        {{ row.applyTime ? formatDateTime(row.applyTime) : '-' }}
      </template>

      <template #actions="{ row }">
        <el-button link type="primary" @click="handleTrace(row)">溯源</el-button>
        <el-button
          v-if="row.admissionStatus === 0"
          link
          type="success"
          @click="handleAuditPass(row)"
        >通过</el-button>
        <el-button
          v-if="row.admissionStatus === 0"
          link
          type="danger"
          @click="handleAuditReject(row)"
        >驳回</el-button>
        <el-button
          v-if="row.admissionStatus === 1"
          link
          type="warning"
          @click="handleOffline(row)"
        >下架</el-button>
        <el-button
          v-if="row.admissionStatus === 3"
          link
          type="success"
          @click="handleOnline(row)"
        >上架</el-button>
        <el-button link type="danger" @click="handleRemove(row)">移除</el-button>
      </template>
    </ProTable>

    <ProductApplyDialog
      v-model="applyDialogVisible"
      :marketing-id="filterForm.marketingId || 0"
      @success="handleApplySuccess"
    />

    <ProductTraceDialog
      v-model="traceDialogVisible"
      :product-id="currentProductId"
    />

    <el-dialog v-model="rejectDialogVisible" title="审核驳回" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确定驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Check,
  Close,
  VideoPlay,
  VideoPause,
  Delete,
  Goods
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import ProductApplyDialog from './components/ProductApplyDialog.vue'
import ProductTraceDialog from './components/ProductTraceDialog.vue'
import {
  MarketingProductAdmissionStatus,
  MarketingProductAdmissionStatusMap
} from '@/types/business'
import type { MarketingProduct } from '@/types/business'
import {
  getMarketingProductList,
  auditPassProduct,
  auditRejectProduct,
  offlineProduct,
  onlineProduct,
  removeProduct,
  batchAuditPassProducts,
  batchAuditRejectProducts,
  batchOfflineProducts,
  batchOnlineProducts,
  batchRemoveProducts,
  batchAddCompliantGoods,
  getMarketingList,
  type MarketingProductQueryParams
} from '@/api/marketing'
import type { PageResult } from '@/types/api'
import { formatDateTime } from '@/utils/date'

const proTableRef = ref<InstanceType<typeof ProTable>>()
const applyDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentProductId = ref<number>(0)
const marketingList = ref<any[]>([])

const filterForm = reactive({
  marketingId: 0
})

const rejectForm = reactive({
  remark: '',
  targetIds: [] as number[],
  isBatch: false
})

const admissionStatusMap = MarketingProductAdmissionStatusMap

const searchColumns = [
  { prop: 'keyword', label: '商品名称', type: 'input' as const },
  { prop: 'admissionStatus', label: '准入状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '审核中', value: 0 },
    { label: '准入通过', value: 1 },
    { label: '准入驳回', value: 2 },
    { label: '活动下架', value: 3 }
  ]},
  { prop: 'categoryId', label: '商品类目', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '电子产品', value: 1 },
    { label: '服装鞋帽', value: 2 },
    { label: '食品饮料', value: 3 },
    { label: '家居用品', value: 4 },
    { label: '美妆个护', value: 5 }
  ]},
  { prop: 'merchantId', label: '所属商家', type: 'input' as const },
  { prop: 'minStock', label: '最小库存', type: 'number' as const, min: 0, precision: 0 },
  { prop: 'maxStock', label: '最大库存', type: 'number' as const, min: 0, precision: 0 }
] as const

const tableColumns = [
  { prop: 'goodsName', label: '商品名称', minWidth: 200, slot: 'goodsName' },
  { prop: 'admissionStatus', label: '准入状态', width: 100, align: 'center', slot: 'admissionStatus' },
  { prop: 'originalPrice', label: '原价', width: 100, align: 'right', slot: 'originalPrice' },
  { prop: 'activityPrice', label: '活动价', width: 110, align: 'right', slot: 'activityPrice' },
  { prop: 'stock', label: '活动库存', width: 100, align: 'center', slot: 'stock' },
  { prop: 'soldCount', label: '已售', width: 80, align: 'center' },
  { prop: 'complianceRating', label: '商品评级', width: 90, align: 'center', slot: 'complianceRating' },
  { prop: 'merchantCreditScore', label: '商家信用分', width: 100, align: 'center', slot: 'merchantCreditScore' },
  { prop: 'applyTime', label: '报名时间', width: 160, align: 'center', slot: 'applyTime' }
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<MarketingProduct>> => {
  if (!filterForm.marketingId) {
    return { list: [], total: 0, pageNum: 1, pageSize: 20 }
  }

  const queryParams = {
    ...params,
    marketingId: filterForm.marketingId
  } as MarketingProductQueryParams

  const res = await getMarketingProductList(queryParams)
  return res.data
}

const loadMarketingList = async () => {
  const res = await getMarketingList({ pageNum: 1, pageSize: 100 })
  marketingList.value = res.data.list
  if (res.data.list.length > 0 && !filterForm.marketingId) {
    filterForm.marketingId = res.data.list[0].id
  }
}

const handleMarketingChange = () => {
  proTableRef.value?.fetchData()
}

const handleAdd = () => {
  if (!filterForm.marketingId) {
    ElMessage.warning('请先选择活动')
    return
  }
  applyDialogVisible.value = true
}

const handleApplySuccess = () => {
  proTableRef.value?.fetchData()
}

const handleTrace = (row: Record<string, unknown>) => {
  currentProductId.value = row.id as number
  traceDialogVisible.value = true
}

const handleAuditPass = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要审核通过该商品吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await auditPassProduct(row.id as number)
    ElMessage.success('审核通过成功')
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleAuditReject = (row: Record<string, unknown>) => {
  rejectForm.targetIds = [row.id as number]
  rejectForm.remark = ''
  rejectForm.isBatch = false
  rejectDialogVisible.value = true
}

const handleOffline = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要下架该商品吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await offlineProduct(row.id as number)
    ElMessage.success('下架成功')
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleOnline = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要上架该商品吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await onlineProduct(row.id as number)
    ElMessage.success('上架成功')
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleRemove = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要移除该商品吗？移除后不可恢复。', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await removeProduct(row.id as number)
    ElMessage.success('移除成功')
    proTableRef.value?.fetchData()
  } catch {
  }
}

const canBatchAuditPass = (rows: Record<string, unknown>[]) => {
  return rows.some(r => r.admissionStatus === MarketingProductAdmissionStatus.PENDING)
}

const canBatchAuditReject = (rows: Record<string, unknown>[]) => {
  return rows.some(r => r.admissionStatus === MarketingProductAdmissionStatus.PENDING)
}

const canBatchOffline = (rows: Record<string, unknown>[]) => {
  return rows.some(r => r.admissionStatus === MarketingProductAdmissionStatus.APPROVED)
}

const canBatchOnline = (rows: Record<string, unknown>[]) => {
  return rows.some(r => r.admissionStatus === MarketingProductAdmissionStatus.OFFLINE)
}

const handleBatchAuditPass = async (rows: Record<string, unknown>[]) => {
  const pendingRows = rows.filter(r => r.admissionStatus === MarketingProductAdmissionStatus.PENDING)
  const ids = pendingRows.map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择待审核的商品')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要审核通过选中的 ${ids.length} 个商品吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchAuditPassProducts(ids)
    ElMessage.success(`批量审核通过：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchAuditReject = (rows: Record<string, unknown>[]) => {
  const pendingRows = rows.filter(r => r.admissionStatus === MarketingProductAdmissionStatus.PENDING)
  const ids = pendingRows.map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择待审核的商品')
    return
  }
  rejectForm.targetIds = ids
  rejectForm.remark = ''
  rejectForm.isBatch = true
  rejectDialogVisible.value = true
}

const handleBatchOffline = async (rows: Record<string, unknown>[]) => {
  const approvedRows = rows.filter(r => r.admissionStatus === MarketingProductAdmissionStatus.APPROVED)
  const ids = approvedRows.map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择准入通过的商品')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要下架选中的 ${ids.length} 个商品吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchOfflineProducts(ids)
    ElMessage.success(`批量下架：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchOnline = async (rows: Record<string, unknown>[]) => {
  const offlineRows = rows.filter(r => r.admissionStatus === MarketingProductAdmissionStatus.OFFLINE)
  const ids = offlineRows.map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择已下架的商品')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要上架选中的 ${ids.length} 个商品吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchOnlineProducts(ids)
    ElMessage.success(`批量上架：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchRemove = async (rows: Record<string, unknown>[]) => {
  const ids = rows.map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择要移除的商品')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要移除选中的 ${ids.length} 个商品吗？移除后不可恢复。`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchRemoveProducts(ids)
    ElMessage.success(`批量移除：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchAddCompliant = async () => {
  if (!filterForm.marketingId) {
    ElMessage.warning('请先选择活动')
    return
  }
  try {
    await ElMessageBox.confirm('确定要批量补充合规商品吗？系统会自动筛选符合条件的商品加入活动。', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchAddCompliantGoods({ marketingId: filterForm.marketingId, limit: 100 })
    ElMessage.success(`批量补充完成：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.fetchData()
  } catch {
  }
}

const confirmReject = async () => {
  if (!rejectForm.remark.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }

  try {
    if (rejectForm.isBatch) {
      const res = await batchAuditRejectProducts(rejectForm.targetIds, rejectForm.remark)
      ElMessage.success(`批量驳回：${res.data.success}个成功，${res.data.failed}个失败`)
    } else {
      await auditRejectProduct(rejectForm.targetIds[0], rejectForm.remark)
      ElMessage.success('驳回成功')
    }
    rejectDialogVisible.value = false
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  } catch (err) {
    ElMessage.error((err as Error).message || '操作失败')
  }
}

const getRatingLabel = (rating?: number) => {
  const labels: Record<number, string> = { 1: 'A级', 2: 'B级', 3: 'C级', 4: 'D级' }
  return labels[rating ?? 4] || '未知'
}

const getRatingType = (rating?: number): 'success' | 'primary' | 'warning' | 'danger' => {
  const types: Record<number, 'success' | 'primary' | 'warning' | 'danger'> = {
    1: 'success',
    2: 'primary',
    3: 'warning',
    4: 'danger'
  }
  return types[rating ?? 4] || 'info' as any
}

onMounted(() => {
  loadMarketingList()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 4px;
}

.goods-name-cell {
  display: flex;
  align-items: center;

  .text-red {
    color: var(--el-color-danger);
  }

  .ml-8 {
    margin-left: 8px;
  }
}

.activity-price {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-red {
  color: var(--el-color-danger);
}
</style>
