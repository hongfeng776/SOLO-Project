<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:modelValue', v)"
    :title="isGlobal ? '库存全流程溯源' : '库存操作溯源记录'"
    width="1000px"
    class="inventory-trace-panel"
    @open="onOpen"
  >
    <div v-loading="loading" style="max-height: 680px; overflow-y: auto;">
      <div class="trace-filter-bar">
        <el-form :inline="true" :model="filterForm" size="default" @submit.prevent>
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.operationType" placeholder="全部" clearable style="width: 160px;">
              <el-option v-for="lt in Object.values(InventoryLogTypeEnum)" :key="lt.value"
                :label="lt.label" :value="lt.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="isGlobal" label="场次类型">
            <el-select v-model="filterForm.sessionType" placeholder="全部" clearable style="width: 140px;">
              <el-option v-for="c in Object.values(InventorySessionTypeEnum)" :key="c.value"
                :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="filterForm.operatorName" placeholder="姓名/ID" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item v-if="isGlobal" label="景点名称">
            <el-input v-model="filterForm.scenicSpotName" placeholder="景点名称" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="fetchLogs">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div style="padding: 0 24px;">
        <div v-for="(group, gIdx) in groupedLogs" :key="gIdx">
          <div class="trace-section-header" v-if="isGlobal">
            <el-icon><component :is="getLogIcon(group.type)" /></el-icon>
            {{ getLogLabel(group.type) }}
            <el-tag size="small" style="margin-left: 8px;">共 {{ group.list.length }} 条</el-tag>
          </div>

          <el-table :data="group.list"
            :key="'t'+gIdx"
            v-loading="loading"
            border
            stripe
            style="width: 100%; margin-bottom: 16px;"
            :header-cell-style="{ background: '#fafafa', fontWeight: 600 }"
            @row-click="handleRowClick"
            :row-class-name="getRowClassName"
          >
            <el-table-column type="expand" v-if="!isGlobal">
              <template #default="{ row }">
                <div class="expand-detail">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="票种品类">{{ getSessionTypeLabel(row.sessionTypeCache) }}</el-descriptions-item>
                    <el-descriptions-item label="操作时间">{{ formatTime(row.createdAt) }}</el-descriptions-item>
                    <el-descriptions-item label="操作人">{{ row.operatorName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="操作角色">{{ row.operatorRole || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="校验结果">
                      <span :style="{ color: getVerifyColor(row.verifyResult) }">
                        {{ getVerifyLabel(row.verifyResult) }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="复核状态" v-if="row.reviewRequired">
                      <span :style="{ color: getReviewColor(row.reviewStatus) }">
                        {{ getReviewLabel(row.reviewStatus) }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="关联订单" v-if="row.orderId">{{ row.orderId }}</el-descriptions-item>
                    <el-descriptions-item label="批次号" v-if="row.batchId">{{ row.batchId }}</el-descriptions-item>
                    <el-descriptions-item label="IP / UA" :span="2" v-if="row.ip">
                      <div>{{ row.ip }}</div>
                      <div v-if="row.userAgent" style="font-size: 11px; color: #909399; margin-top: 4px; word-break: break-all;">
                        UA: {{ row.userAgent }}
                      </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="变更字段" :span="2" v-if="row.oldValue !== null || row.newValue !== null">
                      <div style="display: flex; gap: 12px; align-items: center;">
                      <span style="color: #ff4d4f; text-decoration: line-through;">
                        {{ getFieldLabel(row.changeType) }}: {{ formatVal(row.oldValue) }}
                      </span>
                      <el-icon style="color: #8c8c8c;"><Right /></el-icon>
                      <span style="color: #52c41a; font-weight: 500;">
                        {{ formatVal(row.newValue) }}
                      </span>
                      <el-tag v-if="row.diffValue" size="small" :type="row.diffValue > 0 ? 'success' : 'danger'">
                        {{ row.diffValue > 0 ? '+' : '' }}{{ row.diffValue }}
                      </el-tag>
                    </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="校验不通过原因" :span="2" v-if="row.verifyMessage">
                      <div style="color: #ff4d4f; line-height: 1.6;">{{ row.verifyMessage }}</div>
                    </el-descriptions-item>
                    <el-descriptions-item label="冲突规则" :span="2" v-if="row.conflictRules && row.conflictRules.length">
                      <div v-for="(c, i) in row.conflictRules" :key="i" style="color: #fa8c16; line-height: 1.8;">
                        · [{{ c.field }}] {{ c.message }}
                      </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="操作原因" :span="2" v-if="row.reason">
                      <div style="line-height: 1.6;">{{ row.reason }}</div>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
            </el-table-column>
            <el-table-column type="index" label="#" width="55" fixed="left" align="center" />
            <el-table-column prop="operationType" label="操作类型" width="130" fixed="left">
              <template #default="{ row }">
                <el-tag size="small" effect="light" :color="getLogColor(row.operationType)" style="color: #fff; border: none;">
                  <el-icon style="margin-right: 4px;"><component :is="getLogIcon(row.operationType)" /></el-icon>
                  {{ getLogLabel(row.operationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="isGlobal" prop="scenicSpotNameCache" label="景点" width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="trace-cell" @click.stop="showCellTooltip(row.scenicSpotNameCache, $event)">
                  {{ row.scenicSpotNameCache || '-' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="isGlobal" prop="sessionNameCache" label="场次" width="150">
              <template #default="{ row }">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <el-tag size="small" :class="getSessionTypeTag(row.sessionTypeCache)" effect="plain" style="flex-shrink: 0;">
                    {{ getSessionTypeLabel(row.sessionTypeCache) }}
                  </el-tag>
                  <span class="trace-cell" @click.stop="showCellTooltip(row.sessionNameCache || row.sessionDateCache, $event)">
                    {{ row.sessionNameCache || row.sessionDateCache || '-' }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="isGlobal" prop="sessionDateCache" label="日期" width="120" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column prop="operatorRole" label="角色" width="110" />
            <el-table-column prop="changeType" label="变更字段" width="110">
              <template #default="{ row }">
                <span v-if="row.changeType">{{ getFieldLabel(row.changeType) }}</span>
                <span v-else style="color: #bfbfbf;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="oldValue" label="变更前" width="100">
              <template #default="{ row }">
                <span v-if="row.oldValue !== null && row.oldValue !== undefined" style="color: #ff4d4f; text-decoration: line-through;">
                  {{ formatVal(row.oldValue) }}
                </span>
                <span v-else style="color: #bfbfbf;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="newValue" label="变更后" width="100">
              <template #default="{ row }">
                <span v-if="row.newValue !== null && row.newValue !== undefined" style="color: #52c41a; font-weight: 500;">
                  {{ formatVal(row.newValue) }}
                </span>
                <span v-else style="color: #bfbfbf;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="verifyResult" label="校验" width="80" align="center">
              <template #default="{ row }">
                <span v-if="row.verifyResult === 'pass'" style="color: #52c41a;">
                  <el-icon><CircleCheckFilled /></el-icon>
                </span>
                <span v-else-if="row.verifyResult === 'warning'" style="color: #faad14;">
                  <el-icon><Warning /></el-icon>
                </span>
                <span v-else-if="row.verifyResult === 'block'" style="color: #ff4d4f;">
                  <el-icon><CircleCloseFilled /></el-icon>
                </span>
                <span v-else style="color: #bfbfbf;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reviewStatus" label="复核" width="80" align="center">
              <template #default="{ row }">
                <el-tooltip v-if="row.reviewStatus === 'pending'" content="待复核" placement="top">
                  <el-tag size="small" type="warning">待复</el-tag>
                </el-tooltip>
                <el-tooltip v-else-if="row.reviewStatus === 'approved'" content="已通过" placement="top">
                  <el-tag size="small" type="success">通过</el-tag>
                </el-tooltip>
                <el-tooltip v-else-if="row.reviewStatus === 'rejected'" content="已驳回" placement="top">
                  <el-tag size="small" type="danger">驳回</el-tag>
                </el-tooltip>
                <span v-else style="color: #bfbfbf;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因/备注" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="trace-cell" @click.stop="showCellTooltip(row.reason, $event)">
                  {{ row.reason || '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="操作时间" width="170" fixed="right" />
          </el-table>
        </div>
      </div>

      <div v-if="total > pageSize" style="padding: 16px 24px 20px; text-align: right;">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" layout="prev, pager, next" @current-change="fetchLogs" />
      </div>

      <el-empty v-if="!loading && logList.length === 0" description="暂无操作记录" />
    </div>

    <teleport to="body">
      <el-tooltip
        v-model:visible="tooltipVisible"
        :content="tooltipContent"
        placement="top"
        :offset="8"
        popper-class="cell-tooltip"
      >
        <div ref="tooltipTrigger" style="position: fixed; visibility: hidden;"></div>
      </el-tooltip>
    </teleport>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import {
  Search, Refresh, Right, Warning, CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import { getInventoryLogs, getAllInventoryLogs } from '@/api/ticketInventory'
import {
  InventoryLogTypeEnum, InventorySessionTypeEnum, InventoryVerifyResultEnum,
  InventoryReviewStatusEnum
} from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  inventoryId: { type: [Number, String], default: null },
  isGlobal: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible'])

const loading = ref(false)
const logList = ref([])
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)

const filterForm = reactive({
  operationType: '',
  sessionType: '',
  operatorName: '',
  scenicSpotName: ''
})

const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipTrigger = ref(null)

const FIELD_LABELS = {
  total: '总配额',
  locked: '锁定数量',
  per_order: '单次限购',
  advance: '预约规则',
  status: '状态',
  totalQuota: '总配额',
  lockedCount: '锁定数量',
  perOrderLimit: '单次限购',
  minAdvanceHours: '最少提前小时',
  maxAdvanceDays: '最大预约天数',
  autoCloseMinutes: '自动关闭分钟',
  remark: '备注'
}

const groupedLogs = computed(() => {
  if (!props.isGlobal) return [{ type: 'all', list: logList.value }]
  const groups = {}
  const order = ['occupy', 'release', 'use', 'adjust', 'create', 'lock', 'unlock', 'expire', 'close', 'batch', 'verify']
  for (const item of logList.value) {
    const type = item.operationType || 'other'
    if (!groups[type]) groups[type] = []
    groups[type].push(item)
  }
  return order.filter(t => groups[t]?.length).map(t => ({ type: t, list: groups[t] }))
})

const getLogLabel = (t) => InventoryLogTypeEnum[t]?.label || t
const getLogColor = (t) => InventoryLogTypeEnum[t]?.color || '#909399'
const getLogIcon = (t) => InventoryLogTypeEnum[t]?.icon || 'InfoFilled'
const getSessionTypeLabel = (c) => InventorySessionTypeEnum[c]?.label || c
const getSessionTypeTag = (c) => InventorySessionTypeEnum[c]?.tagClass || ''
const getVerifyLabel = (r) => InventoryVerifyResultEnum[r]?.label || '-'
const getVerifyColor = (r) => InventoryVerifyResultEnum[r] === 'pass' ? '#52c41a'
  : (r === 'warning' ? '#faad14' : (r === 'block' ? '#ff4d4f' : '#bfbfbf')
const getReviewLabel = (r) => InventoryReviewStatusEnum[r]?.label || '-'
const getReviewColor = (r) => InventoryReviewStatusEnum[r]?.color || '#bfbfbf'
const getFieldLabel = (f) => FIELD_LABELS[f] || f

const getRowClassName = ({ row }) => 'trace-row'

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const formatVal = (v) => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (typeof v === 'object') return JSON.stringify(v, null, 0)
  return String(v)
}

const showCellTooltip = (content, event) => {
  if (!content || content === '-') return
  tooltipContent.value = content
  const trigger = tooltipTrigger.value
  if (trigger) {
    trigger.style.left = event.clientX + 'px'
    trigger.style.top = event.clientY + 'px'
  }
  nextTick(() => { tooltipVisible.value = true })
  clearTimeout(showCellTooltip._t)
  showCellTooltip._t = setTimeout(() => { tooltipVisible.value = false }, 2000)
}

const handleRowClick = (row) => {
  // 行点击已通过 expand 列支持展开
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...filterForm }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
    })
    const r = props.isGlobal
      ? await getAllInventoryLogs(params)
      : await getInventoryLogs(props.inventoryId, params)
    logList.value = r.data?.list || []
    total.value = r.data?.total || 0
  } finally { loading.value = false }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    operationType: '', sessionType: '',
    operatorName: '', scenicSpotName: ''
  })
  page.value = 1
  fetchLogs()
}

const onOpen = () => {
  page.value = 1
  logList.value = []
  fetchLogs()
}
</script>
