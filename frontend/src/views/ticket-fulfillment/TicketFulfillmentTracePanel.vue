<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:modelValue', v)"
    :title="isGlobal ? '全局履约流程溯源' : '单票履约溯源'"
    width="1000px"
    top="8vh"
    class="fulfillment-trace-panel"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <div class="sticky-filter">
      <el-form :inline="true" :model="filterForm" @submit.prevent size="default">
        <el-form-item label="操作类型">
          <el-select v-model="filterForm.opType" placeholder="全部" clearable style="width: 180px;" @change="fetchList">
            <el-option v-for="o in opTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filterForm.range" type="datetimerange"
            range-separator="至" start-placeholder="开始" end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss" clearable style="width: 360px;" />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filterForm.keyword" placeholder="票号/订单/操作人" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList" v-ripple>查询</el-button>
          <el-button :icon="Refresh" @click="resetFilter" v-ripple>重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-loading="loading" style="max-height: 60vh; overflow: auto; padding: 0 8px 16px;">
      <template v-if="isGlobal">
        <div v-for="group in groupedLogs" :key="group.type" class="sticky-header">
          <el-icon :style="{ color: getOpGroupColor(group.type) }">
            <component :is="getOpGroupIcon(group.type)" />
          </el-icon>
          {{ group.label }}（{{ group.total }}条）
          <el-tag style="margin-left: 12px;" size="small" :type="group.abnormalCount > 0 ? 'danger' : 'success'">
            {{ group.abnormalCount > 0 ? group.abnormalCount + ' 条异常' : '无异常' }}
          </el-tag>
        </div>

        <el-table v-for="group in groupedLogs" :key="'tbl-' + group.type"
          :data="group.items" size="small" border style="margin-bottom: 12px;"
          class="zebra-table"
        >
          <el-table-column prop="time" label="操作时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作类型" width="130">
            <template #default="{ row }">
              <el-tag :type="getOpTypeTag(row.operationType)" size="small" effect="plain">
                {{ getOpTypeLabel(row.operationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="履约阶段" width="200">
            <template #default="{ row }">
              <span v-if="row.stageFrom" style="color: #8c8c8c;">{{ getStageLabel(row.stageFrom) }}</span>
              <el-icon style="margin: 0 4px; color: #1890ff;"><Right /></el-icon>
              <span style="color: #1890ff; font-weight: 600;">{{ getStageLabel(row.stageTo || row.stageFrom) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="票号" width="180">
            <template #default="{ row }">
              <span v-if="row.ticketCode" style="font-family: 'Courier New', monospace; color: #1890ff;">
                <el-icon><QRCode /></el-icon> {{ row.ticketCode }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="关联订单" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.orderId || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作人" width="100">
            <template #default="{ row }">{{ row.operatorName || row.operatorId || '系统' }}</template>
          </el-table-column>
          <el-table-column label="校验结果" width="100">
            <template #default="{ row }">
              <template v-if="row.verifyResult">
                <el-icon v-if="row.verifyResult === 'PASS'" style="color: #52c41a;"><CircleCheckFilled /></el-icon>
                <el-icon v-else style="color: #ff4d4f;"><CircleCloseFilled /></el-icon>
                <span style="margin-left: 4px;">{{ row.verifyResult === 'PASS' ? '通过' : '失败' }}</span>
              </template>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="异常标记" width="100" align="center">
            <template #default="{ row }">
              <el-tooltip v-if="row.abnormalType" :content="getAbnormalLabel(row.abnormalType)" placement="top">
                <el-icon color="#ff4d4f" style="font-size: 16px;"><WarningFilled /></el-icon>
              </el-tooltip>
              <span v-else style="color: #d9d9d9;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="详情" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip effect="light" placement="top">
                <template #content>
                  <div style="max-width: 420px; line-height: 1.8; font-size: 12px;">
                    <div v-if="row.remark"><strong>备注：</strong>{{ row.remark }}</div>
                    <div v-if="row.verifyLocation"><strong>位置：</strong>{{ row.verifyLocation }}</div>
                    <div v-if="row.verifyDevice || row.verifyGateway">
                      <strong>设备：</strong>{{ row.verifyGateway || '-' }} / {{ row.verifyDevice || '-' }}
                    </div>
                    <div v-if="row.ip"><strong>IP：</strong>{{ row.ip }}</div>
                    <div v-if="row.changes">
                      <strong>变更：</strong>{{ JSON.stringify(row.changes).slice(0, 200) }}
                    </div>
                    <div v-if="row.dataIntegrity">
                      <strong>一致性：</strong>{{ JSON.stringify(row.dataIntegrity) }}
                    </div>
                  </div>
                </template>
                <div style="font-size: 12px; color: #595959; cursor: help;">
                  <span v-if="row.remark">{{ row.remark }}</span>
                  <span v-else-if="row.abnormalReason">异常：{{ row.abnormalReason }}</span>
                  <span v-else>悬停查看完整信息</span>
                </div>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else>
        <el-empty v-if="logList.length === 0 && !loading" description="暂无履约轨迹数据" />
        <el-steps v-else direction="vertical" :active="logList.length + 1" :finish-status="'success'">
          <el-step v-for="(log, idx) in logList" :key="idx"
            :title="`${getOpTypeLabel(log.operationType)} · ${formatTime(log.createdAt)}`"
            :description="logItemDescription(log)"
            :status="log.abnormalType ? 'error' : 'success'"
            :icon="getStepIcon(log.operationType, !!log.abnormalType)"
            style="padding-bottom: 14px;"
          >
            <div class="step-detail">
              <el-descriptions :column="2" border size="small" style="margin-top: 8px;">
                <el-descriptions-item label="阶段流转" :span="2">
                  <span v-if="log.stageFrom" style="color: #8c8c8c;">{{ getStageLabel(log.stageFrom) }}</span>
                  <el-icon style="margin: 0 4px;"><Right /></el-icon>
                  <span style="color: #1890ff; font-weight: 600;">{{ getStageLabel(log.stageTo || log.stageFrom) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="操作人" v-if="log.operatorName">
                  {{ log.operatorName }} <span v-if="log.ip" style="color: #8c8c8c;">· {{ log.ip }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="设备/闸口" v-if="log.verifyDevice || log.verifyGateway">
                  {{ log.verifyGateway || '-' }} / {{ log.verifyDevice || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="校验结果" v-if="log.verifyResult">
                  <el-tag :type="log.verifyResult === 'PASS' ? 'success' : 'danger'" size="small" effect="plain">
                    {{ log.verifyResult === 'PASS' ? '校验通过' : '校验失败' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="批次" v-if="log.batchId">
                  <el-tag size="small" type="info">#{{ log.batchId }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="备注" :span="2" v-if="log.remark">
                  {{ log.remark }}
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="log.changes && Object.keys(log.changes).length > 0" style="margin-top: 8px;">
                <div style="font-size: 12px; color: #8c8c8c; margin-bottom: 6px;">变更详情：</div>
                <el-table :data="Object.entries(log.changes).map(([k, v]) => ({ key: k, ...v }))" size="mini" border>
                  <el-table-column prop="key" label="字段" width="130" />
                  <el-table-column prop="old" label="旧值" show-overflow-tooltip />
                  <el-table-column prop="new" label="新值" show-overflow-tooltip />
                </el-table>
              </div>
            </div>
          </el-step>
        </el-steps>
      </template>

      <div v-if="logList.length === 0 && !loading && isGlobal" style="padding: 40px 0; text-align: center;">
        <el-empty description="暂无日志数据" />
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Search, Refresh, QRCode, Right, WarningFilled, CircleCheckFilled, CircleCloseFilled,
  CircleCheck, ShoppingCart, Money, Timer, Clock, Location, Setting, RefreshLeft,
  Document, CircleClose, User
} from '@element-plus/icons-vue'
import {
  getTicketFulfillmentLogs, getAllTicketFulfillmentLogs
} from '@/api/ticketFulfillment'
import { FulfillLogTypeEnum, FulfillStatusEnum, FulfillAbnormalTypeEnum } from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  fulfillmentId: [Number, String, null],
  isGlobal: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const logList = ref([])
const filterForm = reactive({
  opType: '',
  range: [],
  keyword: ''
})

const opTypeOptions = computed(() => Object.values(FulfillLogTypeEnum))

const getOpTypeLabel = (t) => FulfillLogTypeEnum[t]?.label || t
const getOpTypeTag = (t) => {
  const m = {
    VERIFY: 'success', VERIFY_FAIL: 'danger', REPEAT_VERIFY: 'danger',
    EXPIRE: 'info', REFUND: 'warning', CANCEL: 'info',
    CREATE: '', UPDATE: 'primary', BATCH: 'warning', INTEGRITY_CHECK: 'info', MANUAL_ADJUST: 'danger'
  }
  return m[t] || 'info'
}
const getStageLabel = (s) => FulfillStatusEnum[s]?.label || s
const getAbnormalLabel = (t) => FulfillAbnormalTypeEnum[t]?.label || '异常'

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const logItemDescription = (log) => {
  const parts = []
  if (log.ticketCode) parts.push('票号：' + log.ticketCode)
  if (log.operatorName) parts.push('操作人：' + log.operatorName)
  if (log.verifyGateway) parts.push('闸口：' + log.verifyGateway)
  if (log.abnormalType) parts.push('【异常】' + getAbnormalLabel(log.abnormalType))
  if (log.remark) parts.push(log.remark)
  return parts.join(' · ')
}

const getStepIcon = (opType, abnormal) => {
  if (abnormal) return WarningFilled
  const m = {
    CREATE: ShoppingCart, UPDATE: Setting, VERIFY: CircleCheckFilled,
    VERIFY_FAIL: CircleCloseFilled, REPEAT_VERIFY: WarningFilled,
    EXPIRE: CircleClose, REFUND: RefreshLeft, CANCEL: CircleClose,
    BATCH: Document, INTEGRITY_CHECK: CircleCheck, MANUAL_ADJUST: Tools
  }
  return m[opType] || Timer
}

const groupedLogs = computed(() => {
  const raw = logList.value
  const groups = [
    { type: 'verify', label: '核销操作', icon: CircleCheck, items: [], total: 0, abnormalCount: 0 },
    { type: 'abnormal', label: '异常/拦截', icon: WarningFilled, items: [], total: 0, abnormalCount: 0 },
    { type: 'order', label: '订单履约', icon: ShoppingCart, items: [], total: 0, abnormalCount: 0 },
    { type: 'batch', label: '批量操作', icon: Document, items: [], total: 0, abnormalCount: 0 },
    { type: 'system', label: '系统处理', icon: Timer, items: [], total: 0, abnormalCount: 0 }
  ]
  raw.forEach(log => {
    let gtype = 'system'
    const op = (log.operationType || '').toUpperCase()
    if (op === 'VERIFY' || op === 'VERIFY_FAIL' || op === 'REPEAT_VERIFY') gtype = 'verify'
    else if (log.abnormalType || op === 'INTEGRITY_CHECK' || op === 'MANUAL_ADJUST') gtype = 'abnormal'
    else if (op === 'CREATE' || op === 'UPDATE' || op === 'CANCEL' || op === 'REFUND') gtype = 'order'
    else if (op === 'BATCH') gtype = 'batch'
    const g = groups.find(x => x.type === gtype)
    if (g) {
      g.items.push(log)
      g.total++
      if (log.abnormalType) g.abnormalCount++
    }
  })
  return groups.filter(g => g.total > 0)
})

const getOpGroupIcon = (t) => {
  const m = {
    verify: CircleCheck, abnormal: WarningFilled, order: ShoppingCart,
    batch: Document, system: Timer
  }
  return m[t] || Clock
}
const getOpGroupColor = (t) => {
  const m = {
    verify: '#52c41a', abnormal: '#ff4d4f', order: '#1890ff',
    batch: '#fa8c16', system: '#8c8c8c'
  }
  return m[t] || '#8c8c8c'
}

const fetchList = async () => {
  if (!props.visible) return
  loading.value = true
  try {
    const params = { pageSize: 500 }
    if (filterForm.opType) params.operationType = filterForm.opType
    if (filterForm.keyword) params.keyword = filterForm.keyword
    if (filterForm.range && filterForm.range.length === 2) {
      params.from = filterForm.range[0]
      params.to = filterForm.range[1]
    }
    const r = props.isGlobal
      ? await getAllTicketFulfillmentLogs(params)
      : (props.fulfillmentId ? await getTicketFulfillmentLogs(props.fulfillmentId, params) : { data: [] })
    logList.value = r.data?.list || r.data || []
  } finally { loading.value = false }
}

const resetFilter = () => {
  Object.assign(filterForm, { opType: '', range: [], keyword: '' })
  fetchList()
}

const onOpen = () => {
  logList.value = []
  fetchList()
}

watch(() => props.visible, (v) => { if (v) fetchList() })
watch(() => props.fulfillmentId, () => { if (props.visible) fetchList() })
watch(() => props.isGlobal, () => { if (props.visible) fetchList() })
</script>
