<template>
  <div class="passenger-list">
    <PassengerBatchOperation
      v-if="selectedRows.length > 0"
      :selected-rows="selectedRows"
      @success="handleBatchSuccess"
      @filter-change="handleBatchFilterChange"
    />

    <CommonTable
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      :show-selection="true"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增乘客
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </template>

      <el-table-column type="selection" width="55" align="center" />

      <el-table-column label="乘客信息" width="220">
        <template #default="{ row }">
          <div
            class="passenger-info"
            @mouseenter="handleRowMouseEnter($event, row)"
            @mouseleave="handleRowMouseLeave"
          >
            <el-avatar :size="44" :src="row.avatar" :style="{ border: row.isRisk ? '2px solid #f56c6c' : 'none' }">
              {{ row.nickname?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name-row">
                <span class="name">{{ row.nickname }}</span>
                <el-tag
                  v-if="row.isRisk"
                  type="danger"
                  size="small"
                  effect="dark"
                  class="risk-tag"
                >
                  <el-icon><Warning /></el-icon>
                  风险
                </el-tag>
              </div>
              <div class="phone">{{ formatPhone(row.phone) }}</div>
              <div class="tags-row">
                <el-tag
                  v-for="tag in (row.tags || []).slice(0, 2)"
                  :key="tag"
                  :type="getTagType(PassengerTagTypeColorMap[tag])"
                  size="small"
                  effect="plain"
                >
                  {{ PassengerTagTypeMap[tag] || tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="realNameStatus" label="实名状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :style="{ backgroundColor: RealNameStatusColorMap[row.realNameStatus || 0], color: '#fff' }"
            size="small"
          >
            {{ RealNameStatusMap[row.realNameStatus || 0] }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="level" label="用户等级" width="100" align="center">
        <template #default="{ row }">
          <div class="level-badge" :style="{ background: getLevelGradient(row.level) }">
            <el-icon><Medal /></el-icon>
            <span>{{ PassengerLevelMap[row.level] || '普通' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="reputationScore" label="信誉评分" width="120" align="center">
        <template #default="{ row }">
          <div class="reputation-score">
            <el-rate
              :model-value="Math.round((row.reputationScore || 0) / 20)"
              disabled
              size="small"
              colors="['#f56c6c', '#e6a23c', '#67c23a']"
            />
            <span class="score-text">{{ row.reputationScore || 0 }}分</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="securityLevel" label="安全等级" width="90" align="center">
        <template #default="{ row }">
          <el-tag
            :color="SecurityLevelColorMap[row.securityLevel || 2]"
            effect="dark"
            size="small"
          >
            {{ SecurityLevelMap[row.securityLevel || 2] }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="orderFrequency" label="近30天订单" width="110" align="right">
        <template #default="{ row }">
          <span :class="{ 'text-high': row.orderFrequency >= 10, 'text-low': row.orderFrequency === 0 }">
            {{ row.orderFrequency || 0 }}单
          </span>
        </template>
      </el-table-column>

      <el-table-column prop="totalOrders" label="总订单数" width="100" align="right" />
      <el-table-column prop="totalSpend" label="总消费" width="110" align="right">
        <template #default="{ row }">¥{{ row.totalSpend || 0 }}</template>
      </el-table-column>

      <el-table-column prop="status" label="账号状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '封禁' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="registerTime" label="注册时间" width="170">
        <template #default="{ row }">{{ formatDate(row.registerTime || row.createTime) }}</template>
      </el-table-column>

      <el-table-column label="操作" width="260" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link size="small" @click="handleTrace(row)">溯源</el-button>
          <el-button :type="row.status === 1 ? 'danger' : 'success'" link size="small" @click="handleToggleStatus(row)">
            {{ row.status === 1 ? '封禁' : '解封' }}
          </el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <PassengerEditDialog
      v-model="editDialogVisible"
      :passenger-data="currentPassenger"
      @success="handleEditSuccess"
    />

    <el-dialog
      v-model="detailDialogVisible"
      title="乘客详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="detailLoading" class="loading-container">
        <el-icon class="is-loading" size="32"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <el-tabs v-else v-model="detailActiveTab" class="detail-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <DetailDialog
            :model-value="true"
            :show-close="false"
            :title="''"
            :fields="detailFields"
            :detail-data="currentPassenger"
            :loading="false"
            :column="2"
          >
            <template #extra>
              <PassengerLevelTags
                v-if="currentPassenger"
                :passenger="currentPassenger"
                @level-updated="handleLevelUpdated"
                @tags-updated="handleTagsUpdated"
              />
            </template>
          </DetailDialog>
        </el-tab-pane>
        <el-tab-pane label="操作溯源" name="trace">
          <PassengerOperationTrace
            v-if="currentPassenger?.id"
            :passenger-id="currentPassenger.id"
            :passenger="currentPassenger"
          />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(currentPassenger)">编辑信息</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="乘客账号溯源"
      width="1100px"
      :close-on-click-modal="false"
    >
      <PassengerOperationTrace
        v-if="currentPassenger?.id"
        :passenger-id="currentPassenger.id"
        :passenger="currentPassenger"
      />
      <template #footer>
        <el-button @click="traceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <div
      ref="riskOverviewCard"
      class="risk-overview-popover"
      :style="{ left: popoverPosition.x + 'px', top: popoverPosition.y + 'px', display: popoverVisible ? 'block' : 'none' }"
    >
      <el-card shadow="always" class="popover-card">
        <div class="popover-header">
          <el-icon><User /></el-icon>
          <span>账号风险概况</span>
        </div>
        <div class="popover-content" v-loading="riskOverviewLoading">
          <div class="info-row" v-if="hoveredPassenger">
            <span class="info-label">风险标记：</span>
            <el-tag :type="hoveredPassenger.isRisk ? 'danger' : 'success'" size="small">
              {{ hoveredPassenger.isRisk ? '有风险' : '正常' }}
            </el-tag>
          </div>
          <div class="info-row" v-if="hoveredPassenger">
            <span class="info-label">安全等级：</span>
            <el-tag :color="SecurityLevelColorMap[hoveredPassenger.securityLevel || 2]" effect="dark" size="small">
              {{ SecurityLevelMap[hoveredPassenger.securityLevel || 2] }}
            </el-tag>
          </div>
          <div class="info-row" v-if="hoveredPassenger">
            <span class="info-label">信誉评分：</span>
            <el-rate
              :model-value="Math.round((hoveredPassenger.reputationScore || 0) / 20)"
              disabled
              size="small"
            />
            <span class="score-text">{{ hoveredPassenger.reputationScore || 0 }}分</span>
          </div>
          <div class="info-row" v-if="riskOverview">
            <span class="info-label">待处理风险：</span>
            <span class="info-value pending">{{ riskOverview.riskSummary?.pendingCount || 0 }} 项</span>
          </div>
          <div class="info-row" v-if="riskOverview">
            <span class="info-label">最近异常操作：</span>
            <span class="info-value">{{ riskOverview.operationAbnormal?.abnormalOpsCount || 0 }} 次</span>
          </div>
          <div class="detection-summary" v-if="riskOverview">
            <div class="detection-item" :class="{ 'has-risk': riskOverview.hasDuplicateRealName }">
              <el-icon><CircleCheck v-if="!riskOverview.hasDuplicateRealName" /><CircleClose v-else /></el-icon>
              <span>重复实名</span>
            </div>
            <div class="detection-item" :class="{ 'has-risk': riskOverview.hasFakeRealName }">
              <el-icon><CircleCheck v-if="!riskOverview.hasFakeRealName" /><CircleClose v-else /></el-icon>
              <span>虚假实名</span>
            </div>
            <div class="detection-item" :class="{ 'has-risk': riskOverview.hasMaliciousPhoneChange }">
              <el-icon><CircleCheck v-if="!riskOverview.hasMaliciousPhoneChange" /><CircleClose v-else /></el-icon>
              <span>恶意改号</span>
            </div>
          </div>
          <div class="suggestions" v-if="riskOverview?.suggestions?.length">
            <div class="suggestions-title">
              <el-icon><Lightbulb /></el-icon>
              风险建议
            </div>
            <ul class="suggestions-list">
              <li v-for="(s, i) in riskOverview.suggestions.slice(0, 3)" :key="i">{{ s }}</li>
            </ul>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Download,
  Warning,
  Medal,
  Loading,
  User,
  CircleCheck,
  CircleClose,
  Lightbulb
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import DetailDialog from '@/components/DetailDialog/index.vue'
import PassengerEditDialog from '@/components/PassengerEditDialog/index.vue'
import PassengerLevelTags from '@/components/PassengerLevelTags/index.vue'
import PassengerBatchOperation from '@/components/PassengerBatchOperation/index.vue'
import PassengerOperationTrace from '@/components/PassengerOperationTrace/index.vue'
import {
  getPassengerListApi,
  getPassengerDetailApi,
  updatePassengerStatusApi,
  getRiskOverviewApi
} from '@/api/passenger'
import { formatDate, formatPhone } from '@/utils/format'
import {
  RealNameStatusMap,
  RealNameStatusColorMap,
  PassengerLevelMap,
  PassengerLevelColorMap,
  SecurityLevelMap,
  SecurityLevelColorMap,
  PassengerTagTypeMap,
  PassengerTagTypeColorMap,
  PassengerTagType
} from '@/enums/passenger'
import type { Passenger, PassengerQueryParams, RiskOverview } from '@/types/passenger'

const loading = ref(false)
const tableData = ref<Passenger[]>([])
const total = ref(0)
const selectedRows = ref<Passenger[]>([])
const queryParams = reactive<PassengerQueryParams>({
  page: 1,
  pageSize: 10,
  nickname: '',
  phone: '',
  status: undefined,
  realNameStatus: undefined,
  level: undefined,
  minReputationScore: undefined,
  maxReputationScore: undefined,
  isRisk: undefined,
  registerChannel: undefined,
  tag: undefined,
  registerStartDate: undefined,
  registerEndDate: undefined,
  minOrderFrequency: undefined,
  maxOrderFrequency: undefined,
  minTotalOrders: undefined,
  maxTotalOrders: undefined
})

const searchFields = [
  { prop: 'nickname', label: '昵称', type: 'input' },
  { prop: 'phone', label: '手机号', type: 'input' },
  { prop: 'realNameStatus', label: '实名状态', type: 'select', options: [
    { value: 0, label: '未实名' },
    { value: 1, label: '审核中' },
    { value: 2, label: '已实名' },
    { value: 3, label: '实名失败' }
  ]},
  { prop: 'level', label: '用户等级', type: 'select', options: [
    { value: 1, label: '普通' },
    { value: 2, label: '银卡' },
    { value: 3, label: '金卡' },
    { value: 4, label: '铂金' },
    { value: 5, label: '钻石' }
  ]},
  { prop: 'isRisk', label: '风险账号', type: 'select', options: [
    { value: true, label: '是' },
    { value: false, label: '否' }
  ]},
  { prop: 'tag', label: '用户标签', type: 'select', options: [
    { value: PassengerTagType.NEW_REGISTER, label: '新注册' },
    { value: PassengerTagType.HIGH_FREQUENCY, label: '高频下单' },
    { value: PassengerTagType.LOW_FREQUENCY, label: '低频沉睡' },
    { value: PassengerTagType.HIGH_RISK, label: '高风险' },
    { value: PassengerTagType.VIP, label: 'VIP用户' },
    { value: PassengerTagType.FIRST_ORDER, label: '首单用户' }
  ]},
  { prop: 'status', label: '账号状态', type: 'select', options: [
    { value: 1, label: '正常' },
    { value: 0, label: '封禁' }
  ]},
  { prop: 'minOrderFrequency', label: '最小下单频次', type: 'input' },
  { prop: 'maxOrderFrequency', label: '最大下单频次', type: 'input' },
  { prop: 'minReputationScore', label: '最小信誉分', type: 'input' },
  { prop: 'maxReputationScore', label: '最大信誉分', type: 'input' }
]

const detailFields = [
  { prop: 'nickname', label: '昵称' },
  { prop: 'phone', label: '手机号' },
  { prop: 'gender', label: '性别' },
  { prop: 'realName', label: '真实姓名' },
  { prop: 'idCard', label: '身份证号' },
  { prop: 'realNameStatus', label: '实名状态', type: 'status', statusMap: RealNameStatusMap, colorMap: RealNameStatusColorMap },
  { prop: 'realNameTime', label: '实名时间', type: 'date' },
  { prop: 'province', label: '省份' },
  { prop: 'city', label: '城市' },
  { prop: 'district', label: '区县' },
  { prop: 'address', label: '详细地址' },
  { prop: 'zipCode', label: '邮编' },
  { prop: 'totalOrders', label: '总订单数' },
  { prop: 'totalSpend', label: '总消费', type: 'money' },
  { prop: 'balance', label: '账户余额', type: 'money' },
  { prop: 'registerChannel', label: '注册渠道' },
  { prop: 'registerTime', label: '注册时间', type: 'date' },
  { prop: 'lastLoginTime', label: '最后登录时间', type: 'date' },
  { prop: 'lastLoginIp', label: '最后登录IP' },
  { prop: 'createTime', label: '创建时间', type: 'date' }
]

const editDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const detailLoading = ref(false)
const detailActiveTab = ref('basic')
const currentPassenger = ref<Passenger | null>(null)
const riskOverviewLoading = ref(false)
const riskOverview = ref<RiskOverview | null>(null)

const popoverVisible = ref(false)
const popoverPosition = reactive({ x: 0, y: 0 })
const hoveredPassenger = ref<Passenger | null>(null)
const riskOverviewCard = ref<HTMLElement | null>(null)

let popoverTimeout: ReturnType<typeof setTimeout> | null = null

const getList = async () => {
  loading.value = true
  try {
    const res = await getPassengerListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取乘客列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  queryParams.page = 1
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.nickname = ''
  queryParams.phone = ''
  queryParams.status = undefined
  queryParams.realNameStatus = undefined
  queryParams.level = undefined
  queryParams.minReputationScore = undefined
  queryParams.maxReputationScore = undefined
  queryParams.isRisk = undefined
  queryParams.registerChannel = undefined
  queryParams.tag = undefined
  queryParams.registerStartDate = undefined
  queryParams.registerEndDate = undefined
  queryParams.minOrderFrequency = undefined
  queryParams.maxOrderFrequency = undefined
  queryParams.minTotalOrders = undefined
  queryParams.maxTotalOrders = undefined
  getList()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleSelectionChange = (selection: Passenger[]) => {
  selectedRows.value = selection
}

const handleBatchFilterChange = (tag: string | null) => {
  if (tag) {
    queryParams.tag = tag
  } else {
    queryParams.tag = undefined
  }
  queryParams.page = 1
  getList()
}

const handleBatchSuccess = () => {
  getList()
  selectedRows.value = []
}

const getTagType = (color: string) => {
  if (!color) return 'info'
  if (color === '#67c23a') return 'success'
  if (color === '#f56c6c') return 'danger'
  if (color === '#e6a23c') return 'warning'
  if (color === '#409eff') return 'primary'
  if (color === '#26c6da') return 'success'
  if (color === '#c0c4cc') return 'info'
  if (color === '#ff9800') return 'warning'
  return 'info'
}

const getLevelGradient = (level: number) => {
  const color = PassengerLevelColorMap[level] || '#909399'
  return `linear-gradient(135deg, ${color} 0%, ${lightenColor(color, 20)} 100%)`
}

const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
  const B = Math.min(255, (num & 0x0000ff) + amt)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

const handleAdd = () => {
  currentPassenger.value = null
  editDialogVisible.value = true
}

const handleEdit = (row: Passenger) => {
  currentPassenger.value = { ...row }
  editDialogVisible.value = true
}

const handleEditSuccess = () => {
  getList()
  if (detailDialogVisible.value) {
    loadDetail(currentPassenger.value?.id!)
  }
}

const handleDetail = async (row: Passenger) => {
  currentPassenger.value = { ...row }
  detailActiveTab.value = 'basic'
  detailDialogVisible.value = true
  await loadDetail(row.id)
}

const loadDetail = async (id: number) => {
  detailLoading.value = true
  try {
    const res = await getPassengerDetailApi(id)
    currentPassenger.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取乘客详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleTrace = (row: Passenger) => {
  currentPassenger.value = { ...row }
  traceDialogVisible.value = true
}

const handleLevelUpdated = () => {
  getList()
  if (currentPassenger.value?.id) {
    loadDetail(currentPassenger.value.id)
  }
}

const handleTagsUpdated = () => {
  getList()
  if (currentPassenger.value?.id) {
    loadDetail(currentPassenger.value.id)
  }
}

const handleToggleStatus = async (row: Passenger) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '解封' : '封禁'
  try {
    await ElMessageBox.confirm(
      `确定要${action}该乘客账号吗？`,
      `${action}确认`,
      {
        confirmButtonText: `确定${action}`,
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await updatePassengerStatusApi(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    getList()
  } catch {
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleRowMouseEnter = async (event: MouseEvent, row: Passenger) => {
  if (popoverTimeout) {
    clearTimeout(popoverTimeout)
  }
  hoveredPassenger.value = row
  popoverPosition.x = event.clientX + 10
  popoverPosition.y = event.clientY + 10

  popoverTimeout = setTimeout(async () => {
    popoverVisible.value = true
    riskOverviewLoading.value = true
    try {
      const res = await getRiskOverviewApi(row.id)
      riskOverview.value = res.data
    } catch {
      riskOverview.value = null
    } finally {
      riskOverviewLoading.value = false
    }
  }, 500)
}

const handleRowMouseLeave = () => {
  if (popoverTimeout) {
    clearTimeout(popoverTimeout)
    popoverTimeout = null
  }
  popoverVisible.value = false
  hoveredPassenger.value = null
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.passenger-list {
  .passenger-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: help;

    :deep(.el-avatar) {
      flex-shrink: 0;
    }

    .info {
      flex: 1;
      min-width: 0;

      .name-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;

        .name {
          font-weight: 500;
          color: #303133;
          font-size: 14px;
        }

        .risk-tag {
          display: flex;
          align-items: center;
          gap: 2px;
          animation: pulse 2s ease-in-out infinite;
        }
      }

      .phone {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .tags-row {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
    }
  }

  .level-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;

    .el-icon {
      font-size: 14px;
    }
  }

  .reputation-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .score-text {
      font-size: 12px;
      color: #606266;
    }
  }

  .text-high {
    color: #67c23a;
    font-weight: 500;
  }

  .text-low {
    color: #909399;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 10px;
    color: #909399;
  }

  .detail-tabs {
    :deep(.el-tabs__header) {
      margin: 0 0 20px 0;
    }
  }

  .risk-overview-popover {
    position: fixed;
    z-index: 3000;
    pointer-events: none;

    .popover-card {
      width: 320px;

      :deep(.el-card__body) {
        padding: 0;
      }

      .popover-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
        font-weight: 600;
        border-radius: 8px 8px 0 0;
      }

      .popover-content {
        padding: 16px;

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .info-label {
            font-size: 13px;
            color: #909399;
            min-width: 90px;
            flex-shrink: 0;
          }

          .info-value {
            font-size: 14px;
            font-weight: 500;
            color: #303133;

            &.pending {
              color: #e6a23c;
            }
          }

          .score-text {
            margin-left: 8px;
            font-size: 13px;
            color: #606266;
          }
        }

        .detection-summary {
          display: flex;
          justify-content: space-around;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #ebeef5;

          .detection-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #67c23a;

            .el-icon {
              font-size: 20px;
            }

            &.has-risk {
              color: #f56c6c;
            }
          }
        }

        .suggestions {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #ebeef5;

          .suggestions-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            color: #e6a23c;
            margin-bottom: 8px;

            .el-icon {
              font-size: 16px;
            }
          }

          .suggestions-list {
            margin: 0;
            padding-left: 20px;

            li {
              font-size: 12px;
              color: #606266;
              line-height: 1.6;
              margin-bottom: 4px;

              &:last-child {
                margin-bottom: 0;
              }
            }
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
