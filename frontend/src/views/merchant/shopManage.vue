<template>
  <div class="shop-manage page-container">
    <el-card shadow="never" class="mb16">
      <el-form :inline="true" :model="searchForm" class="search-bar">
        <el-form-item label="店铺名称">
          <el-input v-model="searchForm.shop_name" placeholder="请输入店铺名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="店铺状态">
          <el-select
            v-model="searchForm.shop_status" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option v-for="s in SHOP_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺等级">
          <el-select
            v-model="searchForm.shop_level" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option v-for="lv in SHOP_LEVEL_OPTIONS" :key="lv.value" :label="lv.label" :value="lv.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="经营类目">
          <el-select
            v-model="searchForm.shop_category" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option v-for="c in SHOP_CATEGORY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开店时长(天)">
          <el-input-number v-model="searchForm.open_duration_min" :min="0" size="default" placeholder="最小" />
          <span class="mx6">~</span>
          <el-input-number v-model="searchForm.open_duration_max" :min="0" size="default" placeholder="最大" />
        </el-form-item>
        <el-form-item label="入驻状态">
          <el-select
            v-model="searchForm.settle_status" placeholder="全部" clearable style="width: 140px"
            @change="handleSearch">
            <el-option v-for="s in SETTLE_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开店日期">
          <el-date-picker
            v-model="searchForm.dateRange" type="daterange" start-placeholder="开始" end-placeholder="结束"
            value-format="YYYY-MM-DD" style="width: 260px" @change="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="12" class="status-quick-cards">
        <el-col v-for="(s, idx) in statusCounts" :key="idx" :span="4">
          <div
            :class="['status-card', { active: activeStatusFilter === s.status }]"
            @click="toggleStatusFilter(s.status)">
            <div class="status-num">{{ s.count }}</div>
            <div class="status-label">
              <el-tag :type="s.type as any" effect="plain" size="small">{{ s.label }}</el-tag>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <div>
            <el-checkbox v-model="isAllSelected" :indeterminate="isIndeterminate" @change="(v: any) => toggleAllSelect(Boolean(v))">全选</el-checkbox>
            <span class="ml16">已选 <b>{{ selectedIds.length }}</b> 项</span>
          </div>
          <div class="toolbar-right">
            <el-tooltip content="批量修改标签" placement="top">
              <el-button type="primary" size="default" :disabled="selectedIds.length === 0" @click="openBatchTagDialog">
                <el-icon><CollectionTag /></el-icon>批量改标签
              </el-button>
            </el-tooltip>
            <el-tooltip content="批量调整店铺等级" placement="top">
              <el-button type="warning" size="default" :disabled="selectedIds.length === 0" @click="openBatchLevelDialog">
                <el-icon><Rank /></el-icon>批量调等级
              </el-button>
            </el-tooltip>
            <el-tooltip content="批量暂停运营（违规整改）" placement="top">
              <el-button type="danger" size="default" :disabled="selectedIds.length === 0" @click="openBatchSuspendDialog">
                <el-icon><VideoPause /></el-icon>批量暂停
              </el-button>
            </el-tooltip>
            <el-tooltip content="批量恢复合规店铺" placement="top">
              <el-button type="success" size="default" :disabled="selectedIds.length === 0" @click="openBatchResumeDialog">
                <el-icon><VideoPlay /></el-icon>批量恢复
              </el-button>
            </el-tooltip>
            <el-button @click="refreshTable">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="onSelectionChange"
        @header-dragend="onHeaderDragend"
        style="width: 100%">
        <el-table-column type="selection" width="50" align="center" :reserve-selection="true" />
        <el-table-column prop="shop_name" label="店铺名称" min-width="180" sortable>
          <template #default="{ row }">
            <div class="shop-name-cell">
              <el-avatar :size="36" :src="row.shop_logo">{{ (row.shop_name || row.name || '').slice(0, 1) }}</el-avatar>
              <div class="shop-info">
                <div class="shop-name">{{ row.shop_name || '未设置' }}</div>
                <div class="shop-merchant">{{ row.name }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100" align="center" sortable prop="shop_level">
          <template #default="{ row }">
            <el-tag
              v-if="row.shop_level"
              :style="{ borderColor: getLevelColor(row.shop_level), color: getLevelColor(row.shop_level), backgroundColor: getLevelColor(row.shop_level) + '22' }">
              {{ getLevelLabel(row.shop_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center" sortable prop="shop_status">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.shop_status)">{{ getStatusLabel(row.shop_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="经营类目" min-width="120" prop="shop_category" sortable>
          <template #default="{ row }">
            <span>{{ row.shop_category || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="店铺标签" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-for="t in (row.shop_tags ? row.shop_tags.split(',').filter(Boolean) : [])" :key="t" size="small" class="mr4">{{ t }}</el-tag>
            <span v-if="!row.shop_tags" class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="开店时长" width="110" align="center" sortable prop="shop_operation_duration_days">
          <template #default="{ row }">
            <span>{{ row.shop_operation_duration_days || 0 }} 天</span>
          </template>
        </el-table-column>
        <el-table-column label="入驻状态" width="110" align="center" sortable prop="settle_status">
          <template #default="{ row }">
            <el-tag :type="getSettleTagType(row.settle_status)">{{ getSettleLabel(row.settle_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客服电话" width="140" prop="customer_service_phone">
          <template #default="{ row }">
            <span>{{ row.customer_service_phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="店铺简介" min-width="220" show-overflow-tooltip prop="shop_intro">
          <template #default="{ row }">
            <div class="intro-cell">
              <el-tooltip :content="row.shop_intro as any" :show-after="300" placement="top">
                <span>{{ (row.shop_intro || '').length > 40 ? (row.shop_intro || '').slice(0, 40) + '...' : (row.shop_intro || '-') }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openInfoEdit(row as any)">编辑</el-button>
            <el-button link type="warning" @click="openStatusDialog(row as any)">状态</el-button>
            <el-button link type="success" @click="openTraceDialog(row as any)">溯源</el-button>
            <el-button link type="danger" @click="openSingleSuspend(row as any)" v-if="(row as any).shop_status === 1">暂停</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="mt16 paginator"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="p => { pagination.page = p; fetchData() }"
        @size-change="s => { pagination.pageSize = s; pagination.page = 1; fetchData() }"
      />
    </el-card>

    <shop-info-dialog v-model="infoDialogVisible" :merchant-id="currentMerchantId" @saved="onInfoSaved" />

    <ShopTraceDialog v-model="traceDialogVisible" :merchant-id="currentMerchantId" />

    <el-dialog v-model="statusDialogVisible" title="店铺状态变更" width="620px" :close-on-click-modal="false">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="商家名称">
          <el-input v-model="statusForm.merchant_name" disabled />
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="getStatusTagType(statusForm.current_status)">{{ getStatusLabel(statusForm.current_status) }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态" required>
          <el-radio-group v-model="statusForm.target_status">
            <el-radio v-for="s in SHOP_STATUS_OPTIONS" :key="s.value" :label="s.value" :disabled="s.value === statusForm.current_status">
              {{ s.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="变更来源" required>
          <el-select v-model="statusForm.change_source" style="width: 100%">
            <el-option v-for="s in SHOP_STATUS_SOURCE_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因" required>
          <el-input
            v-model="statusForm.change_reason" type="textarea" :rows="3"
            placeholder="请详细说明变更原因（不少于2个字符）" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStatusChange">确认变更</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchTagDialogVisible" title="批量修改店铺标签" width="500px">
      <el-form label-width="100px">
        <el-form-item label="店铺标签" required>
          <el-select v-model="batchForm.tags" multiple filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="t in SHOP_TAG_PRESET" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="追加模式">
          <el-switch v-model="batchForm.append_mode" active-text="在原有基础上追加" inactive-text="覆盖原有标签" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchTag">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchLevelDialogVisible" title="批量调整店铺等级" width="500px">
      <el-form label-width="100px">
        <el-form-item label="目标等级" required>
          <el-select v-model="batchForm.level" style="width: 100%">
            <el-option v-for="lv in SHOP_LEVEL_OPTIONS" :key="lv.value" :label="lv.label" :value="lv.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因" required>
          <el-input v-model="batchForm.level_reason" type="textarea" :rows="3" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchLevelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchLevel">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchSuspendDialogVisible" title="批量暂停运营" width="500px">
      <el-form label-width="100px">
        <el-form-item label="目标状态" required>
          <el-radio-group v-model="batchForm.suspend_target">
            <el-radio :label="3">违规整改</el-radio>
            <el-radio :label="4">平台封禁</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="暂停原因" required>
          <el-input v-model="batchForm.suspend_reason" type="textarea" :rows="3" placeholder="请详细说明暂停原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSuspendDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitBatchSuspend">确认暂停</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchResumeDialogVisible" title="批量恢复合规店铺" width="500px">
      <el-form label-width="100px">
        <el-form-item label="恢复原因" required>
          <el-input v-model="batchForm.resume_reason" type="textarea" :rows="3" placeholder="请输入恢复原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchResumeDialogVisible = false">取消</el-button>
        <el-button type="success" @click="submitBatchResume">确认恢复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CollectionTag, Rank, VideoPause, VideoPlay
} from '@element-plus/icons-vue'
import type { ElTable } from 'element-plus'
import {
  getShopList, changeShopStatus, batchUpdateShopTags, batchSuspendShops, batchResumeShops, batchChangeShopLevel,
  SHOP_STATUS_OPTIONS, SHOP_LEVEL_OPTIONS, SHOP_CATEGORY_OPTIONS, SHOP_TAG_PRESET, SHOP_STATUS_SOURCE_OPTIONS,
  type ShopInfoItem
} from '@/api/shopInfo'
import { SETTLE_STATUS_OPTIONS } from '@/api/merchantQualification'
import ShopInfoDialog from './components/ShopInfoDialog.vue'
import ShopTraceDialog from './components/ShopTraceDialog.vue'

const tableRef = ref<any>()
const loading = ref(false)
const tableData = ref<ShopInfoItem[]>([])
const selectedIds = ref<number[]>([])
const selectedRows = ref<ShopInfoItem[]>([])

const searchForm = reactive<any>({
  shop_name: '', shop_status: undefined, shop_level: undefined, shop_category: '',
  open_duration_min: undefined, open_duration_max: undefined, settle_status: undefined, dateRange: [] as string[],
})

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const activeStatusFilter = ref<number | null>(null)
const isAllSelected = ref(false)
const isIndeterminate = ref(false)
const colWidths = ref<Record<string, number>>({})

const infoDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const batchTagDialogVisible = ref(false)
const batchLevelDialogVisible = ref(false)
const batchSuspendDialogVisible = ref(false)
const batchResumeDialogVisible = ref(false)
const currentMerchantId = ref<number>(0)

const statusForm = reactive({
  merchant_id: 0, merchant_name: '', current_status: 1, target_status: 1,
  change_source: 'platform', change_reason: '',
})

const batchForm = reactive<any>({
  tags: [] as string[], append_mode: true,
  level: 3, level_reason: '',
  suspend_target: 3, suspend_reason: '',
  resume_reason: '',
})

const statusCounts = ref<Array<{ status: number | null; label: string; type: string; count: number }>>([
  { status: null, label: '全部', type: 'info', count: 0 },
  { status: 1, label: '正常营业', type: 'success', count: 0 },
  { status: 2, label: '停业整顿', type: 'warning', count: 0 },
  { status: 3, label: '违规整改', type: 'warning', count: 0 },
  { status: 4, label: '平台封禁', type: 'danger', count: 0 },
  { status: 5, label: '未设置', type: 'info', count: 0 },
])

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getStatusLabel = (s?: number) => SHOP_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getStatusTagType = (s?: number): TagType => {
  const o = SHOP_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getSettleLabel = (s?: number) => SETTLE_STATUS_OPTIONS.find(o => o.value === s)?.label || '未知'
const getSettleTagType = (s?: number): TagType => {
  const o = SETTLE_STATUS_OPTIONS.find(x => x.value === s)
  return (o?.type as TagType) || 'info'
}
const getLevelLabel = (lv?: number) => SHOP_LEVEL_OPTIONS.find(o => o.value === lv)?.label || '-'
const getLevelColor = (lv?: number) => SHOP_LEVEL_OPTIONS.find(o => o.value === lv)?.color || '#909399'

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.shop_name = ''
  searchForm.shop_status = undefined
  searchForm.shop_level = undefined
  searchForm.shop_category = ''
  searchForm.open_duration_min = undefined
  searchForm.open_duration_max = undefined
  searchForm.settle_status = undefined
  searchForm.dateRange = []
  activeStatusFilter.value = null
  handleSearch()
}

const toggleStatusFilter = (s: number | null) => {
  activeStatusFilter.value = activeStatusFilter.value === s ? null : s
  searchForm.shop_status = activeStatusFilter.value ?? undefined
  pagination.page = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      shop_name: searchForm.shop_name || undefined,
      shop_status: searchForm.shop_status,
      shop_level: searchForm.shop_level,
      shop_category: searchForm.shop_category || undefined,
      open_duration_min: searchForm.open_duration_min,
      open_duration_max: searchForm.open_duration_max,
      settle_status: searchForm.settle_status,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1],
    }
    const res = await getShopList(params)
    tableData.value = res.data.data.list as any
    pagination.total = res.data.data.total
    await nextTick()
    applyColWidths()
  } finally {
    loading.value = false
  }
}

const applyColWidths = () => {
  if (!tableRef.value) return
  const columns = (tableRef.value as any).store?.states?.columns || []
  for (const col of columns) {
    if (col.property && colWidths.value[col.property]) {
      col.width = colWidths.value[col.property]
    }
  }
}

const onHeaderDragend = (newWidth: number, _oldWidth: number, column: any) => {
  if (column?.property) colWidths.value[column.property] = newWidth
}

const onSelectionChange = (rows: any[]) => {
  selectedRows.value = rows as ShopInfoItem[]
  selectedIds.value = (rows as any[]).map((r: any) => r.id)
  if (rows.length === 0) {
    isAllSelected.value = false
    isIndeterminate.value = false
  } else if (rows.length === tableData.value.length) {
    isAllSelected.value = true
    isIndeterminate.value = false
  } else {
    isAllSelected.value = false
    isIndeterminate.value = true
  }
}

const toggleAllSelect = (val: boolean) => {
  if (!tableRef.value) return
  if (val) tableRef.value.toggleAllSelection()
  else tableRef.value.clearSelection()
}

const refreshTable = () => fetchData()

const openInfoEdit = (row: ShopInfoItem) => {
  currentMerchantId.value = row.id
  infoDialogVisible.value = true
}

const openTraceDialog = (row: ShopInfoItem) => {
  currentMerchantId.value = row.id
  traceDialogVisible.value = true
}

const openStatusDialog = (row: ShopInfoItem) => {
  statusForm.merchant_id = row.id
  statusForm.merchant_name = row.shop_name || row.name
  statusForm.current_status = row.shop_status || 1
  statusForm.target_status = row.shop_status === 1 ? 3 : 1
  statusForm.change_reason = ''
  statusDialogVisible.value = true
}

const openSingleSuspend = (row: ShopInfoItem) => {
  statusForm.merchant_id = row.id
  statusForm.merchant_name = row.shop_name || row.name
  statusForm.current_status = 1
  statusForm.target_status = 3
  statusForm.change_source = 'platform'
  statusForm.change_reason = ''
  statusDialogVisible.value = true
}

const submitStatusChange = async () => {
  if (!statusForm.change_reason || statusForm.change_reason.trim().length < 2) {
    ElMessage.warning('请填写详细的变更原因（不少于2个字符）')
    return
  }
  const res = await changeShopStatus(statusForm as any)
  ElMessage.success(res.data.data.message || '状态变更成功')
  statusDialogVisible.value = false
  fetchData()
}

const onInfoSaved = () => {
  fetchData()
}

const openBatchTagDialog = () => { batchForm.tags = []; batchTagDialogVisible.value = true }
const openBatchLevelDialog = () => { batchForm.level = 3; batchForm.level_reason = ''; batchLevelDialogVisible.value = true }
const openBatchSuspendDialog = () => { batchForm.suspend_target = 3; batchForm.suspend_reason = ''; batchSuspendDialogVisible.value = true }
const openBatchResumeDialog = () => { batchForm.resume_reason = ''; batchResumeDialogVisible.value = true }

const submitBatchTag = async () => {
  if (batchForm.tags.length === 0) { ElMessage.warning('请选择要设置的标签'); return }
  await ElMessageBox.confirm(`确定对已选 ${selectedIds.value.length} 个店铺${batchForm.append_mode ? '追加' : '覆盖'}标签？`, '批量操作', { type: 'warning' })
  const res = await batchUpdateShopTags({ merchant_ids: selectedIds.value, tags: batchForm.tags, append_mode: batchForm.append_mode })
  ElMessage.success(`批量修改成功：${res.data.data.success}个，失败：${res.data.data.failed}个`)
  batchTagDialogVisible.value = false
  fetchData()
}

const submitBatchLevel = async () => {
  if (!batchForm.level_reason) { ElMessage.warning('请填写调整原因'); return }
  await ElMessageBox.confirm(`确定将已选 ${selectedIds.value.length} 个店铺等级调整为「${getLevelLabel(batchForm.level)}」？`, '批量操作', { type: 'warning' })
  const res = await batchChangeShopLevel({ merchant_ids: selectedIds.value, target_level: batchForm.level, reason: batchForm.level_reason })
  ElMessage.success(`批量调整成功：${res.data.data.success}个，失败：${res.data.data.failed}个`)
  batchLevelDialogVisible.value = false
  fetchData()
}

const submitBatchSuspend = async () => {
  if (!batchForm.suspend_reason) { ElMessage.warning('请填写暂停原因'); return }
  await ElMessageBox.confirm(`确定暂停已选 ${selectedIds.value.length} 个店铺运营？`, '批量操作', { type: 'warning', confirmButtonText: '确认暂停', confirmButtonClass: 'el-button--danger' })
  const res = await batchSuspendShops({ merchant_ids: selectedIds.value, reason: batchForm.suspend_reason, target_status: batchForm.suspend_target })
  ElMessage.success(`批量暂停成功：${res.data.data.success}个，失败：${res.data.data.failed}个`)
  batchSuspendDialogVisible.value = false
  fetchData()
}

const submitBatchResume = async () => {
  if (!batchForm.resume_reason) { ElMessage.warning('请填写恢复原因'); return }
  await ElMessageBox.confirm(`确定恢复已选 ${selectedIds.value.length} 个店铺？`, '批量操作', { type: 'warning' })
  const res = await batchResumeShops({ merchant_ids: selectedIds.value, reason: batchForm.resume_reason })
  ElMessage.success(`批量恢复成功：${res.data.data.success}个，失败：${res.data.data.failed}个`)
  batchResumeDialogVisible.value = false
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.page-container { padding: 16px; }
.mb16 { margin-bottom: 16px; }
.mt16 { margin-top: 16px; }
.ml6 { margin-left: 6px; }
.ml16 { margin-left: 16px; }
.mr4 { margin-right: 4px; }
.mx6 { margin: 0 6px; }
.search-bar { margin-bottom: 0; }
.status-quick-cards { margin-top: 8px; }
.status-card {
  padding: 12px 16px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color);
  transition: all 0.2s;
  &:hover, &.active {
    border-color: var(--el-color-primary); background: var(--el-color-primary-light-9);
    .status-num { color: var(--el-color-primary); }
  }
  .status-num { font-size: 24px; font-weight: 700; line-height: 1.2; color: var(--el-text-color-primary); }
  .status-label { margin-top: 6px; }
}
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.toolbar-right { display: flex; gap: 8px; }
.shop-name-cell { display: flex; align-items: center; gap: 10px; }
.shop-info { .shop-name { font-weight: 600; color: var(--el-text-color-primary); } .shop-merchant { font-size: 12px; color: var(--el-text-color-regular); margin-top: 2px; } }
.paginator { display: flex; justify-content: flex-end; }
.text-muted { color: var(--el-text-color-secondary); }
.intro-cell { line-height: 1.5; }
</style>
