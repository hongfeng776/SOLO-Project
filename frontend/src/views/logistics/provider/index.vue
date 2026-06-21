<template>
  <div class="logistics-provider-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="3" v-for="card in statCards" :key="card.key">
          <div class="stat-card" :class="'stat-' + card.type">
            <div class="stat-icon"><el-icon :size="28"><component :is="card.icon" /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics[card.key] ?? '--' }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card stat-quality">
            <div class="stat-header">
              <span class="stat-label">服务质量概览</span>
              <span class="stat-trend">月环比 <el-tag size="small" type="success">+2.3%</el-tag></span>
            </div>
            <div class="quality-bars">
              <div class="quality-item">
                <span>平均评分</span>
                <div class="bar-wrap"><el-progress :percentage="Math.round((statistics.avgServiceScore ?? 0) * 20)" :color="'#409EFF'" :stroke-width="10" :show-text="false" /></div>
                <span class="bar-val">{{ statistics.avgServiceScore?.toFixed(1) ?? '--' }}</span>
              </div>
              <div class="quality-item">
                <span>平均准时率</span>
                <div class="bar-wrap"><el-progress :percentage="Math.round((statistics.avgOnTimeRate ?? 0) * 100)" :color="'#67C23A'" :stroke-width="10" :show-text="false" /></div>
                <span class="bar-val">{{ ((statistics.avgOnTimeRate ?? 0) * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <el-card shadow="never">
        <el-form :inline="true" :model="searchForm" @submit.prevent>
          <el-form-item label="关键字">
            <el-input v-model="searchForm.keyword" placeholder="编码/名称/联系人/电话" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="服务商等级">
            <el-select v-model="searchForm.level" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="(item, key) in ProviderLevelMap" :key="key" :label="item.label" :value="Number(key)" />
            </el-select>
          </el-form-item>
          <el-form-item label="启用状态">
            <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="(item, key) in ProviderStatusMap" :key="key" :label="item.label" :value="Number(key)" />
            </el-select>
          </el-form-item>
          <el-form-item label="合作状态">
            <el-select v-model="searchForm.cooperationStatus" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="(item, key) in CooperationStatusMap" :key="key" :label="item.label" :value="Number(key)" />
            </el-select>
          </el-form-item>
          <el-form-item label="覆盖省份">
            <el-select v-model="searchForm.province" placeholder="全部省份" clearable filterable style="width: 130px">
              <el-option v-for="p in provinceOptions" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>
          <el-form-item label="城市">
            <el-input v-model="searchForm.city" placeholder="城市" clearable style="width: 110px" />
          </el-form-item>
          <el-form-item label="服务能力">
            <el-select v-model="searchForm.serviceCapability" placeholder="全部" clearable style="width: 130px">
              <el-option label="支持COD" value="cod" />
              <el-option label="支持冷链" value="coldChain" />
              <el-option label="支持大件" value="oversized" />
              <el-option label="上门取件" value="pickup" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 查询</el-button>
            <el-button @click="handleReset"><el-icon><RefreshLeft /></el-icon> 重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 工具栏 + 表格 -->
    <div class="table-section">
      <el-card shadow="never">
        <!-- 工具栏 -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon> 新增服务商</el-button>
            <el-button v-if="selectedIds.length > 0" type="success" :disabled="selectedIds.length === 0" @click="openBatchDialog('enable')">
              <el-icon><CircleCheck /></el-icon> 批量启用({{ selectedIds.length }})
            </el-button>
            <el-button v-if="selectedIds.length > 0" type="warning" :disabled="selectedIds.length === 0" @click="openBatchDialog('disable')">
              <el-icon><CircleClose /></el-icon> 批量禁用({{ selectedIds.length }})
            </el-button>
            <el-button v-if="selectedIds.length > 0" :disabled="selectedIds.length === 0" @click="openBatchDialog('fee')">
              <el-icon><Money /></el-icon> 批量更新资费
            </el-button>
            <el-button v-if="selectedIds.length > 0" :disabled="selectedIds.length === 0" @click="openBatchDialog('priority')">
              <el-icon><Sort /></el-icon> 批量调整优先级
            </el-button>
            <el-button v-if="selectedIds.length > 0" :disabled="selectedIds.length === 0" @click="openBatchDialog('level')">
              <el-icon><Medal /></el-icon> 批量调整等级
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-button @click="loadStatistics">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
            <el-button>
              <el-icon><Download /></el-icon> 导出
            </el-button>
          </div>
        </div>

        <!-- 表格 -->
        <el-table ref="tableRef" :data="tableData" v-loading="tableLoading" border stripe
          @selection-change="handleSelectionChange" @sort-change="handleSortChange"
          style="width: 100%">
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="providerCode" label="服务商编码" width="110" align="center" fixed>
            <template #default="{ row }">
              <span class="code-text">{{ row.providerCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="providerName" label="服务商名称" min-width="170" fixed show-overflow-tooltip>
            <template #default="{ row }">
              <div class="provider-cell">
                <el-avatar :size="28" :src="row.logo" shape="square">
                  {{ row.providerName?.charAt(0) }}
                </el-avatar>
                <span class="name">{{ row.providerName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.level)" effect="light" size="small">
                {{ ProviderLevelMap[row.level]?.label || '--' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="启用状态" width="90" align="center">
            <template #default="{ row }">
              <el-switch v-model="row._statusValue" :disabled="canToggleStatus(row)"
                @change="handleStatusChange(row, $event)" inline-prompt
                active-text="启用" inactive-text="禁用" />
            </template>
          </el-table-column>
          <el-table-column prop="cooperationStatus" label="合作状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getCoopTagType(row.cooperationStatus)" size="small">
                {{ CooperationStatusMap[row.cooperationStatus]?.label || '--' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="serviceProvince" label="覆盖区域" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="coverage-cell">
                <el-tag v-for="p in parseTags(row.serviceProvince)" :key="p" size="small" class="coverage-tag" type="info" effect="plain">
                  {{ p }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="branchCount" label="网点数" width="85" align="center" sortable>
            <template #default="{ row }">
              <span :class="row.branchCount < 10 ? 'text-danger' : ''">{{ row.branchCount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="feeInfo" label="资费参考" width="140" align="center">
            <template #default="{ row }">
              <div class="fee-cell">
                <span>首重¥{{ row.firstWeightFee?.toFixed(2) }}</span>
                <span class="fee-divider">/</span>
                <span>续重¥{{ row.additionalWeightFee?.toFixed(2) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="timeliness" label="时效承诺" width="120" align="center">
            <template #default="{ row }">
              <div class="timeliness-cell">
                <div><el-icon><Promotion /></el-icon> 跨省 {{ row.crossProvinceTimeliness || '--' }}h</div>
                <div><el-icon><Van /></el-icon> 省内 {{ row.intraProvinceTimeliness || '--' }}h</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="serviceScore" label="服务评分" width="95" align="center" sortable>
            <template #default="{ row }">
              <div class="score-cell">
                <el-rate v-model="row._rateDisplay" disabled size="small" :max="5" />
                <span class="score-val">{{ row.serviceScore?.toFixed(1) || '--' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="complianceScore" label="合规分" width="90" align="center">
            <template #default="{ row }">
              <span class="compliance-score">{{ row._complianceScore || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="onTimeRate" label="准时率" width="85" align="center" sortable>
            <template #default="{ row }">
              <span :class="onTimeRateClass(row.onTimeRate)">
                {{ row.onTimeRate ? (row.onTimeRate * 100).toFixed(1) + '%' : '--' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
            <template #default="{ row }">
              <span>{{ formatDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button link type="success" @click="openSecondConfirmIfNeeded(row)">
                <el-icon><Setting /></el-icon> 参数维护
              </el-button>
              <el-button link type="warning" @click="handleViewDetail(row)">
                <el-icon><View /></el-icon> 详情
              </el-button>
              <el-button link type="info" @click="handleOpenTrace(row)">
                <el-icon><Files /></el-icon> 溯源
              </el-button>
              <el-popconfirm title="确定删除此服务商？" confirm-button-text="删除" cancel-button-text="取消"
                @confirm="handleDelete(row)">
                <template #reference>
                  <el-button link type="danger">
                    <el-icon><Delete /></el-icon> 删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination v-model:current-page="pagination.pageNum" v-model:page-size="pagination.pageSize"
            :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            background @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>

    <!-- 弹窗组件 -->
    <ProviderFormDialog v-model="formDialogVisible" :mode="formDialogMode" :initial-data="currentProvider"
      @submitted="onFormSubmitted" @core-change-detected="handleCoreChangeFromForm" />

    <SecondConfirmDialog v-model="secondConfirmVisible" :original-data="originalDataForConfirm"
      :new-data="newDataForConfirm" :core-fields="coreFieldsList" :provider-id="currentProviderId"
      @confirmed="onSecondConfirmConfirmed" />

    <ProviderTraceDialog v-model="traceDialogVisible" :provider-id="currentProviderId" />

    <BatchOperationDialog v-model="batchDialogVisible" :operation-type="batchOpType" :selected-ids="selectedIds"
      @submitted="onBatchSubmitted" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, RefreshLeft, CircleCheck, CircleClose, Money, Sort, Medal, Refresh, Download,
  Edit, Setting, View, Files, Delete, Promotion, Van, DataAnalysis, User, CircleCheckFilled,
  Warning, Finished, SwitchFilled, Medal as MedalIcon
} from '@element-plus/icons-vue'
import type { LogisticsProvider, ProviderStatistics } from '@/types/business'
import type { PageParams, PageResult } from '@/types/api'
import {
  ProviderLevelMap, ProviderStatusMap, CooperationStatusMap,
  type ProviderQueryParams
} from '@/api/logisticsProvider'
import {
  getProviderList, getStatistics, updateProviderStatus, deleteProvider, updateCooperationStatus
} from '@/api/logisticsProvider'
import { batchEnable, batchDisable, getRefreshListData } from '@/api/logisticsProviderBatch'
import { runProviderPreCheck } from '@/api/logisticsProviderValidate'
import ProviderFormDialog from './components/ProviderFormDialog.vue'
import SecondConfirmDialog from './components/SecondConfirmDialog.vue'
import ProviderTraceDialog from './components/ProviderTraceDialog.vue'
import BatchOperationDialog from './components/BatchOperationDialog.vue'
import type { Ref } from 'vue'

// ============= 响应式状态 =============
const statistics = ref<Partial<ProviderStatistics>>({})
const tableData = ref<any[]>([])
const tableLoading = ref(false)
const selectedIds = ref<number[]>([])
const tableRef = ref()
const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const sortField = ref('')
const sortOrder = ref<'ascending' | 'descending' | ''>('')

const searchForm = reactive<ProviderQueryParams>({
  keyword: '', level: undefined as any, status: undefined as any,
  cooperationStatus: undefined as any, province: '', city: '',
  serviceCapability: '', startDate: '', endDate: ''
})
const dateRange = ref<string[]>([])

const statCards = [
  { key: 'totalCount', label: '服务商总数', icon: User, type: 'primary' },
  { key: 'enabledCount', label: '已启用', icon: CircleCheckFilled, type: 'success' },
  { key: 'pendingReviewCount', label: '待审核', icon: Warning, type: 'warning' },
  { key: 'disabledCount', label: '已禁用', icon: SwitchFilled, type: 'info' },
  { key: 'cooperatingCount', label: '合作中', icon: Finished, type: 'primary2' },
  { key: 'archivedCount', label: '已归档', icon: DataAnalysis, type: 'archived' },
]

const provinceOptions = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '陕西', '山东', '福建', '河南', '湖南', '安徽', '河北', '辽宁', '吉林', '黑龙江', '江西', '山西', '云南', '贵州', '广西', '甘肃', '海南', '重庆', '天津', '内蒙古', '新疆', '宁夏', '青海', '西藏']

// ============= 弹窗控制 =============
const formDialogVisible = ref(false)
const formDialogMode = ref<'add' | 'edit'>('add')
const currentProvider = ref<Partial<LogisticsProvider>>({})
const currentProviderId = ref<number>(0)

const secondConfirmVisible = ref(false)
const originalDataForConfirm = ref<any>({})
const newDataForConfirm = ref<any>({})
const coreFieldsList = ref<string[]>([])

const traceDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const batchOpType = ref<'enable' | 'disable' | 'fee' | 'priority' | 'level'>('enable')

// ============= 计算属性 =============
const _complianceScoresMap = reactive<Record<number, number>>({})

// ============= 方法 =============
const getLevelTagType = (level: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<number, any> = { 1: 'info', 2: 'warning', 3: 'info', 4: 'warning', 5: 'danger' }
  return map[level] || 'info'
}

const getCoopTagType = (s: number): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<number, any> = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[s] || 'info'
}

const parseTags = (str?: string): string[] => {
  if (!str) return []
  return str.split(',').filter(Boolean).slice(0, 3)
}

const onTimeRateClass = (rate?: number): string => {
  if (rate == null) return ''
  if (rate >= 0.98) return 'text-success'
  if (rate >= 0.95) return 'text-primary'
  if (rate >= 0.90) return 'text-warning'
  return 'text-danger'
}

const formatDateTime = (val?: string): string => {
  if (!val) return '--'
  return val.replace('T', ' ').slice(0, 16)
}

const canToggleStatus = (row: any): boolean => {
  return row.cooperationStatus === 1 && row.status === 1
}

// 加载统计
const loadStatistics = async () => {
  try {
    const res = await getStatistics()
    statistics.value = res.data || {}
  } catch (e) {
    console.error('loadStatistics error', e)
  }
}

// 加载表格
const loadTableData = async () => {
  tableLoading.value = true
  try {
    const params: ProviderQueryParams & PageParams = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      startDate: dateRange.value?.[0] || '',
      endDate: dateRange.value?.[1] || '',
    }
    const res = await getProviderList(params)
    const list: any[] = res.data.list || []
    // 增强字段
    tableData.value = list.map(item => {
      const row = { ...item }
      row._statusValue = item.status === 1
      row._rateDisplay = item.serviceScore || 0
      // 模拟合规分
      row._complianceScore = mockComplianceScore(item)
      return row
    })
    pagination.total = res.data.total || 0
  } catch (e) {
    console.error('loadTableData error', e)
  } finally {
    tableLoading.value = false
  }
}

const mockComplianceScore = (item: any): number => {
  let score = 100
  if (item.branchCount < 10) score -= 15
  if ((item.onTimeRate ?? 1) < 0.95) score -= 10
  if (item.status !== 1) score -= 5
  if (!item.creditCode) score -= 10
  return Math.max(40, score)
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadTableData()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => { (searchForm as any)[k] = typeof (searchForm as any)[k] === 'number' ? undefined : '' })
  dateRange.value = []
  pagination.pageNum = 1
  loadTableData()
}

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const handleSortChange = ({ prop, order }: { prop: string; order: any }) => {
  sortField.value = prop
  sortOrder.value = order
}

const handleSizeChange = () => { pagination.pageNum = 1; loadTableData() }
const handleCurrentChange = () => { loadTableData() }

const handleAdd = () => {
  formDialogMode.value = 'add'
  currentProvider.value = {
    status: 2, cooperationStatus: 0, supportCod: 0, supportColdChain: 0,
    supportOversized: 0, supportPickup: 1, firstWeightFee: 10,
    additionalWeightFee: 4, baseServiceFee: 1, dailyOrderLimit: 1000,
    matchPriority: 0, level: 1, branchCount: 0, totalOrders: 0, totalAmount: 0
  }
  formDialogVisible.value = true
}

const handleEdit = (row: any) => {
  formDialogMode.value = 'edit'
  currentProviderId.value = row.id
  currentProvider.value = { ...row }
  formDialogVisible.value = true
}

const handleViewDetail = (row: any) => {
  currentProviderId.value = row.id
  handleOpenTrace(row, true)
}

const handleOpenTrace = (row: any, _initial = false) => {
  currentProviderId.value = row.id
  traceDialogVisible.value = true
}

const handleStatusChange = async (row: any, enabled: boolean) => {
  try {
    if (enabled) {
      // 启用前先前置校验
      const preCheck = await runProviderPreCheck(row.id)
      if (!preCheck.data.passed || preCheck.data.blockEnabled) {
        row._statusValue = false
        ElMessageBox.confirm(
          `前置校验未通过，是否仍要启用？\n\n问题：${preCheck.data.blockItems?.map(i => i.message).join('\n') || '存在多项不合规项'}`,
          '启用风险提示',
          { type: 'warning', confirmButtonText: '仍要启用', cancelButtonText: '取消' }
        ).then(async () => {
          await updateProviderStatus(row.id, { status: 1 })
          ElMessage.success('已启用')
          refreshRow(row.id)
        }).catch(() => {})
        return
      }
    }
    await updateProviderStatus(row.id, { status: enabled ? 1 : 0 })
    ElMessage.success(enabled ? '启用成功' : '禁用成功')
    refreshRow(row.id)
  } catch (e: any) {
    row._statusValue = !enabled
    ElMessage.error(e?.message || '操作失败')
  }
}

const openSecondConfirmIfNeeded = (row: any) => {
  handleEdit(row)
}

const handleCoreChangeFromForm = ({ original, newData, coreFields }: any) => {
  currentProviderId.value = original.id
  originalDataForConfirm.value = original
  newDataForConfirm.value = newData
  coreFieldsList.value = coreFields
  formDialogVisible.value = false
  secondConfirmVisible.value = true
}

const onSecondConfirmConfirmed = async () => {
  ElMessage.success('核心参数变更已确认，正在同步更新物流匹配规则...')
  await nextTick()
  loadTableData()
  loadStatistics()
}

const handleDelete = async (row: any) => {
  try {
    await deleteProvider(row.id)
    ElMessage.success('删除成功')
    loadTableData()
    loadStatistics()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败，该服务商可能存在合作数据')
  }
}

const onFormSubmitted = () => {
  loadTableData()
  loadStatistics()
}

// 批量操作
const openBatchDialog = (type: 'enable' | 'disable' | 'fee' | 'priority' | 'level') => {
  batchOpType.value = type
  batchDialogVisible.value = true
}

const onBatchSubmitted = async ({ type, result, idsNeedRefresh }: any) => {
  if (result) {
    ElMessage.success(`批量${type === 'enable' ? '启用' : type === 'disable' ? '禁用' : '操作'}完成`)
  }
  batchDialogVisible.value = false
  // 局部刷新
  if (idsNeedRefresh?.length) {
    await partialRefresh(idsNeedRefresh)
  }
  selectedIds.value = []
  tableRef.value?.clearSelection?.()
  loadStatistics()
}

const partialRefresh = async (ids: number[]) => {
  try {
    const res = await getRefreshListData(ids)
    const newList = res.data || []
    const updatedMap: Record<number, any> = {}
    newList.forEach((item: any) => { updatedMap[item.id] = item })
    tableData.value = tableData.value.map(row => {
      if (updatedMap[row.id]) {
        return {
          ...row, ...updatedMap[row.id],
          _statusValue: updatedMap[row.id].status === 1,
          _rateDisplay: updatedMap[row.id].serviceScore || 0,
          _complianceScore: mockComplianceScore(updatedMap[row.id])
        }
      }
      return row
    })
  } catch (e) {
    loadTableData()
  }
}

const refreshRow = (id: number) => partialRefresh([id])

onMounted(() => {
  loadStatistics()
  loadTableData()
})
</script>

<style lang="scss" scoped>
.logistics-provider-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: 100%;

  .stats-section {
    margin-bottom: 16px;
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;

    &.stat-primary::after {
      content: ''; position: absolute; right: -20px; top: -20px; width: 80px; height: 80px;
      background: radial-gradient(circle, rgba(64,158,255,0.15), transparent 70%); border-radius: 50%;
    }
    &.stat-success::after {
      content: ''; position: absolute; right: -20px; top: -20px; width: 80px; height: 80px;
      background: radial-gradient(circle, rgba(103,194,58,0.15), transparent 70%); border-radius: 50%;
    }
    &.stat-warning::after {
      content: ''; position: absolute; right: -20px; top: -20px; width: 80px; height: 80px;
      background: radial-gradient(circle, rgba(230,162,60,0.15), transparent 70%); border-radius: 50%;
    }
    &.stat-info::after {
      content: ''; position: absolute; right: -20px; top: -20px; width: 80px; height: 80px;
      background: radial-gradient(circle, rgba(144,147,153,0.15), transparent 70%); border-radius: 50%;
    }
    &.stat-primary2::after {
      content: ''; position: absolute; right: -20px; top: -20px; width: 80px; height: 80px;
      background: radial-gradient(circle, rgba(115,77,255,0.15), transparent 70%); border-radius: 50%;
    }
    &.stat-archived::after {
      content: ''; position: absolute; right: -20px; top: -20px; width: 80px; height: 80px;
      background: radial-gradient(circle, rgba(103,194,58,0.15), transparent 70%); border-radius: 50%;
    }

    .stat-icon {
      width: 48px; height: 48px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(64,158,255,0.1), rgba(64,158,255,0.02));
      color: #409EFF;
    }
    .stat-content { flex: 1; min-width: 0; z-index: 1; }
    .stat-value {
      font-size: 22px; font-weight: 700; color: #303133; line-height: 1.3;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
    }
    .stat-label { font-size: 12px; color: #909399; margin-top: 2px; }

    &.stat-quality {
      flex-direction: column; align-items: flex-start; gap: 8px; min-height: 76px;
      .stat-header { width: 100%; display: flex; justify-content: space-between; align-items: center;
        .stat-label { font-size: 14px; font-weight: 600; color: #303133; }
        .stat-trend { font-size: 12px; color: #909399; }
      }
      .quality-bars { width: 100%; display: flex; flex-direction: column; gap: 6px; }
      .quality-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #606266;
        .bar-wrap { flex: 1; }
        .bar-val { width: 50px; text-align: right; font-weight: 600; color: #303133; }
      }
    }
  }

  .search-section { margin-bottom: 16px; }
  .table-section {
    :deep(.el-card__body) { padding: 0; }
  }

  .table-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px 12px; flex-wrap: wrap; gap: 8px;
    .toolbar-left, .toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }
  }

  .code-text {
    font-family: "SF Mono", Consolas, Monaco, monospace;
    font-size: 13px;
    color: #409EFF;
    font-weight: 600;
    background: #ecf5ff;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .provider-cell {
    display: flex; align-items: center; gap: 8px;
    .name { font-weight: 500; color: #303133; }
  }

  .coverage-cell { display: flex; gap: 4px; flex-wrap: wrap;
    .coverage-tag { font-size: 11px; }
  }

  .fee-cell {
    display: flex; flex-direction: column; gap: 2px; font-size: 12px;
    .fee-divider { color: #c0c4cc; }
    > div { display: flex; align-items: center; gap: 4px; }
  }

  .timeliness-cell {
    display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: #606266;
    align-items: center;
    > div { display: flex; align-items: center; gap: 4px; }
  }

  .score-cell {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    .score-val { font-size: 12px; color: #f59e0b; font-weight: 600; }
  }

  .compliance-score {
    display: inline-block;
    font-weight: 700;
    font-family: "SF Mono", Consolas, monospace;
    &:not(.text-danger) { color: #67c23a; }
  }

  .text-success { color: #67c23a; font-weight: 600; }
  .text-primary { color: #409EFF; font-weight: 600; }
  .text-warning { color: #e6a23c; font-weight: 600; }
  .text-danger { color: #f56c6c; font-weight: 600; }

  .pagination-wrap { padding: 16px 20px; display: flex; justify-content: flex-end; }
}
</style>
