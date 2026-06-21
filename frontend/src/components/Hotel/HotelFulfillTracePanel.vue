<template>
  <el-dialog
    v-model="visible"
    title="履约全流程溯源"
    width="960px"
    class="hotel-fulfill-trace-panel"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="trace-filter">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="操作类型">
          <el-select
            v-model="filterForm.operationType"
            placeholder="全部"
            clearable
            style="width: 160px"
            @change="fetchData"
          >
            <el-option
              v-for="item in Object.values(HotelFulfillmentLogTypeEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <span :style="{ color: item.color }">●</span>
              <span style="margin-left: 6px">{{ item.label }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="fetchData"
          />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="操作人/内容"
            clearable
            style="width: 160px"
            @clear="fetchData"
            @keyup.enter="fetchData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" size="small" @click="fetchData">搜索</el-button>
          <el-button size="small" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="trace-timeline" v-loading="loading">
      <el-empty v-if="logs.length === 0 && !loading" description="暂无履约操作记录" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="formatTime(log.createdAt)"
          placement="top"
          :color="getLogColor(log.operationType)"
          class="timeline-item-wrap"
        >
          <div class="trace-card">
            <div class="trace-header">
              <div class="header-left">
                <el-icon :size="16" :color="getLogColor(log.operationType)">
                  <component :is="getLogIcon(log.operationType)" />
                </el-icon>
                <el-tag
                  size="small"
                  class="op-type-tag"
                  :style="{
                    borderColor: getLogColor(log.operationType),
                    color: getLogColor(log.operationType),
                    backgroundColor: getLogColor(log.operationType) + '15'
                  }"
                >
                  {{ getLogLabel(log.operationType) }}
                </el-tag>

                <el-tag
                  v-if="log.isBatch"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  <el-icon><Files /></el-icon>
                  批量操作
                </el-tag>
              </div>

              <div class="op-meta">
                <span>
                  <el-icon :size="12"><User /></el-icon>
                  {{ log.operatorName || '系统' }}
                </span>
                <el-tag v-if="log.operatorRole" size="small" type="info" effect="plain" style="margin-left: 4px">
                  {{ log.operatorRole }}
                </el-tag>
              </div>
            </div>

            <div class="trace-changes" v-if="log.oldValue || log.newValue">
              <template v-for="(row, idx) in parseChanges(log)" :key="idx">
                <div class="change-row" v-if="row">
                  <span class="change-field">{{ getFieldLabel(row.field) }}：</span>
                  <template v-if="row.newVal !== undefined && row.oldVal !== undefined">
                    <span class="change-old">{{ row.oldVal }}</span>
                    <span class="change-arrow">→</span>
                    <span class="change-new">{{ row.newVal }}</span>
                  </template>
                  <template v-else>
                    <span class="change-new">{{ row.newVal || row.oldVal }}</span>
                  </template>
                </div>
              </template>
            </div>

            <div class="trace-reason" v-if="log.operationReason">
              <el-icon :size="12"><EditPen /></el-icon>
              操作原因：{{ log.operationReason }}
            </div>

            <div class="trace-footer" v-if="hasFooterTags(log)">
              <el-tag
                v-if="log.roomOccupancyUpdated"
                size="small"
                effect="plain"
                type="warning"
              >
                房态已更新
              </el-tag>
              <el-tag
                v-if="log.orderProgressUpdated"
                size="small"
                effect="plain"
                type="primary"
              >
                订单进度已更新
              </el-tag>
              <el-tag
                v-if="log.voucherUpdated"
                size="small"
                effect="plain"
                type="success"
              >
                凭证已更新
              </el-tag>
              <el-tag
                v-if="log.ledgerUpdated"
                size="small"
                effect="plain"
                type="info"
              >
                台账已同步
              </el-tag>
              <el-tag
                v-if="log.settlementChanged"
                size="small"
                effect="plain"
                type="danger"
              >
                结算已变更
              </el-tag>
            </div>

            <div class="trace-detail-link">
              <el-button type="primary" link size="small" @click="handleViewDetail(log)">
                查看详情
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <div v-if="logs.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="履约操作详情"
      width="700px"
      class="log-detail-dialog zoomFadeIn"
      append-to-body
      :close-on-click-modal="false"
    >
      <div v-if="currentLog" class="log-detail-content">
        <el-descriptions :column="2" border size="small" class="detail-descriptions">
          <el-descriptions-item label="操作类型">
            <div class="detail-type" :style="{ color: getLogColor(currentLog.operationType) }">
              <el-icon><component :is="getLogIcon(currentLog.operationType)" /></el-icon>
              <span>{{ getLogLabel(currentLog.operationType) }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="操作状态">
            <el-tag :type="currentLog.operationStatus === 1 ? 'success' : 'danger'" size="small">
              {{ currentLog.operationStatus === 1 ? '成功' : '失败' }}
            </el-tag>
            <span v-if="currentLog.failReason" style="color: #ff4d4f; margin-left: 8px">
              {{ currentLog.failReason }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ currentLog.operatorName || '系统' }}
            <el-tag v-if="currentLog.operatorRole" size="small" type="info" style="margin-left: 4px">
              {{ currentLog.operatorRole }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ formatTime(currentLog.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作IP">
            {{ currentLog.operationIp || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="是否批量">
            <el-tag v-if="currentLog.isBatch" size="small" type="warning">批量操作</el-tag>
            <span v-else>单条操作</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作备注" v-if="currentLog.operationRemark" :span="2">
            {{ currentLog.operationRemark }}
          </el-descriptions-item>
          <el-descriptions-item label="变更字段" v-if="parseChanges(currentLog).length > 0" :span="2">
            <div class="change-fields">
              <el-tag
                v-for="(row, idx) in parseChanges(currentLog)"
                :key="idx"
                size="small"
                type="primary"
                effect="plain"
              >
                {{ getFieldLabel(row.field) }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="parseChanges(currentLog).length > 0" class="detail-changes">
          <div class="section-title">变更明细</div>
          <el-table
            :data="parseChanges(currentLog)"
            border
            size="small"
            class="change-table"
          >
            <el-table-column label="字段" prop="field" width="140">
              <template #default="{ row }">
                {{ getFieldLabel(row.field) }}
              </template>
            </el-table-column>
            <el-table-column label="旧值" min-width="160">
              <template #default="{ row }">
                <span class="change-old">{{ row.oldVal || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="新值" min-width="160">
              <template #default="{ row }">
                <span class="change-new">{{ row.newVal || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  User,
  Files,
  EditPen,
  Plus,
  Check,
  SwitchButton,
  Warning,
  Close,
  Timer,
  CircleCheck,
  CircleClose,
  DocumentCopy
} from '@element-plus/icons-vue'
import { HotelFulfillmentLogTypeEnum } from '@/utils/enums'
import { getHotelFulfillmentLogs, getAllHotelFulfillmentLogs } from '@/api/hotel'

const props = defineProps({
  modelValue: Boolean,
  fulfillId: {
    type: [Number, String],
    default: null
  },
  globalMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const loading = ref(false)
const logs = ref([])
const detailVisible = ref(false)
const currentLog = ref(null)

const filterForm = reactive({
  operationType: '',
  dateRange: null,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const iconMap = {
  verify: CircleCheck,
  checkin: Check,
  checkout: SwitchButton,
  delay: Warning,
  early_checkout: SwitchButton,
  extend: Timer,
  cancel: CircleClose,
  no_show: Close,
  batch_verify: Files,
  batch_noshow: Files,
  batch_delay: Files,
  fake_flag: Warning,
  duplicate_flag: DocumentCopy,
  illegal_checkout: Warning
}

const fieldLabelMap = {
  guestName: '入住人',
  guestPhone: '入住人电话',
  guestIdType: '证件类型',
  guestIdNumber: '证件号码',
  status: '状态',
  verifyStatus: '核验状态',
  actualCheckInTime: '实际入住时间',
  actualCheckOutTime: '实际退房时间',
  actualNights: '实际晚数',
  bookedNights: '预订晚数',
  settlementAmount: '结算金额',
  settlementStatus: '结算状态',
  roomOccupancy: '入住房间数',
  roomOccupancyUpdated: '房态更新',
  orderProgressUpdated: '订单进度更新',
  voucherUpdated: '凭证更新',
  ledgerUpdated: '台账同步',
  settlementChanged: '结算变更',
  hotelName: '酒店名称',
  roomTypeName: '房型名称',
  roomNumber: '房间号',
  checkInDate: '入住日期',
  checkOutDate: '退房日期',
  orderNo: '订单编号',
  fulfillmentType: '履约类型',
  fulfillmentStatus: '履约状态',
  earlyCheckoutReason: '提前退房原因',
  delayReason: '延迟入住原因',
  cancelReason: '取消原因',
  noShowReason: '未到原因',
  extendNights: '续住晚数',
  isFake: '虚假标记',
  isDuplicate: '重复标记',
  operationRemark: '操作备注',
  operatorName: '操作人'
}

const getLogColor = (type) => {
  const key = Object.keys(HotelFulfillmentLogTypeEnum).find(k => HotelFulfillmentLogTypeEnum[k].value === type)
  return HotelFulfillmentLogTypeEnum[key]?.color || '#909399'
}

const getLogLabel = (type) => {
  const key = Object.keys(HotelFulfillmentLogTypeEnum).find(k => HotelFulfillmentLogTypeEnum[k].value === type)
  return HotelFulfillmentLogTypeEnum[key]?.label || type
}

const getLogIcon = (type) => {
  const key = Object.keys(HotelFulfillmentLogTypeEnum).find(k => HotelFulfillmentLogTypeEnum[k].value === type)
  const iconName = key ? HotelFulfillmentLogTypeEnum[key].icon : null
  return iconMap[key] || iconMap[iconName] || Check
}

const getFieldLabel = (f) => {
  return fieldLabelMap[f] || f
}

const parseValue = (val) => {
  if (val === null || val === undefined || val === '') return '（空）'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (val === 'pending_checkin') return '待入住'
  if (val === 'checked_in') return '已入住'
  if (val === 'checked_out') return '已退房'
  if (val === 'delayed') return '延迟入住'
  if (val === 'early_checkout') return '提前退房'
  if (val === 'no_show') return '未到'
  if (val === 'cancelled') return '已取消'
  if (val === 'unverified') return '未核验'
  if (val === 'verified') return '已核验'
  if (val === 'rejected') return '核验不通过'
  if (val === 'fake') return '虚假入住'
  if (val === 'pending') return '待入住'
  if (val === 'normal') return '正常入住'
  return String(val)
}

const safeParse = (s) => {
  if (!s) return null
  try {
    return typeof s === 'string' ? JSON.parse(s) : s
  } catch {
    return null
  }
}

const parseChanges = (log) => {
  const fields = log.changeFields ? log.changeFields.split(',') : []
  const oldObj = safeParse(log.oldValue) || {}
  const newObj = safeParse(log.newValue) || {}

  if (fields.length > 0) {
    return fields.map(f => {
      if (!f) return null
      return {
        field: f.trim(),
        oldVal: parseValue(oldObj[f.trim()]),
        newVal: parseValue(newObj[f.trim()])
      }
    }).filter(Boolean)
  }

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
  return allKeys.map(k => ({
    field: k,
    oldVal: parseValue(oldObj[k]),
    newVal: parseValue(newObj[k])
  }))
}

const formatTime = (d) => {
  if (!d) return '-'
  const date = new Date(d)
  return date.toLocaleString('zh-CN', { hour12: false })
}

const hasFooterTags = (log) => {
  return log.roomOccupancyUpdated || log.orderProgressUpdated || log.voucherUpdated || log.ledgerUpdated || log.settlementChanged
}

const handleViewDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.operationType) {
      params.operationType = filterForm.operationType
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }
    if (filterForm.keyword) {
      params.keyword = filterForm.keyword
    }

    let res
    if (props.globalMode || !props.fulfillId) {
      res = await getAllHotelFulfillmentLogs(params)
    } else {
      res = await getHotelFulfillmentLogs(props.fulfillId, params)
    }

    logs.value = res.rows || res.list || []
    pagination.total = res.total || 0
  } catch (e) {
    logs.value = getMockData()
    pagination.total = logs.value.length
    ElMessage.warning('接口加载失败，已使用模拟数据')
  } finally {
    loading.value = false
  }
}

const getMockData = () => {
  return [
    {
      id: 1,
      operationType: 'checkin',
      operatorName: '张经理',
      operatorRole: '前台主管',
      operationStatus: 1,
      createdAt: '2026-06-20 14:30:00',
      oldValue: JSON.stringify({ status: 'pending_checkin', verifyStatus: 'verified', actualCheckInTime: null, actualNights: null, settlementAmount: null }),
      newValue: JSON.stringify({ status: 'checked_in', verifyStatus: 'verified', actualCheckInTime: '2026-06-20 14:30', actualNights: 3, settlementAmount: 1680 }),
      changeFields: 'status,actualCheckInTime,actualNights,settlementAmount',
      roomOccupancyUpdated: true,
      orderProgressUpdated: true,
      voucherUpdated: true,
      ledgerUpdated: false,
      settlementChanged: false
    },
    {
      id: 2,
      operationType: 'checkout',
      operatorName: '李前台',
      operatorRole: '前台',
      operationStatus: 1,
      createdAt: '2026-06-23 11:00:00',
      oldValue: JSON.stringify({ status: 'checked_in', actualCheckOutTime: null, actualNights: 3, settlementAmount: 1680 }),
      newValue: JSON.stringify({ status: 'checked_out', actualCheckOutTime: '2026-06-23 11:00', actualNights: 3, settlementAmount: 1680 }),
      changeFields: 'status,actualCheckOutTime',
      roomOccupancyUpdated: true,
      orderProgressUpdated: true,
      voucherUpdated: false,
      ledgerUpdated: true,
      settlementChanged: true
    }
  ]
}

const resetFilter = () => {
  filterForm.operationType = ''
  filterForm.dateRange = null
  filterForm.keyword = ''
  pagination.page = 1
  fetchData()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      pagination.page = 1
      nextTick(() => fetchData())
    }
  }
)
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-fulfillment.scss';

.hotel-fulfill-trace-panel {
  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 75vh;
    overflow-y: auto;
  }

  .trace-filter {
    padding: 16px 20px 0 20px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 4px;
  }

  .trace-timeline {
    padding: 20px 24px;

    .timeline-item-wrap {
      padding-bottom: 4px;
    }

    .trace-card {
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 12px 14px;
      margin-top: 8px;
      background: #f0f2f5;

      .trace-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        flex-wrap: wrap;
        gap: 8px;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .op-type-tag {
          font-weight: 500;
        }

        .op-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #c0c4cc;
        }
      }

      .trace-changes {
        font-size: 12px;
        margin-bottom: 8px;

        .change-row {
          display: flex;
          gap: 8px;
          padding: 3px 0;
          line-height: 1.5;

          .change-field {
            width: 120px;
            flex-shrink: 0;
            color: #c0c4cc;
          }

          .change-old {
            color: #ff4d4f;
            text-decoration: line-through;
            max-width: 200px;
            word-break: break-all;
          }

          .change-arrow {
            color: #c0c4cc;
          }

          .change-new {
            color: #52c41a;
            font-weight: 500;
            max-width: 200px;
            word-break: break-all;
          }
        }
      }

      .trace-reason {
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
        padding: 6px 10px;
        background: rgba(250, 173, 20, 0.08);
        border-radius: 2px;
      }

      .trace-footer {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #ebeef5;
      }

      .trace-detail-link {
        margin-top: 6px;
      }
    }
  }

  .pagination-container {
    padding: 16px 0;
    text-align: center;
  }
}

.log-detail-dialog.zoomFadeIn {
  :deep(.el-dialog) {
    animation: zoomFadeIn 0.3s ease;
  }

  .log-detail-content {
    .detail-type {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .change-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .detail-changes {
      margin-top: 16px;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
        padding-left: 10px;
        border-left: 3px solid #1890ff;
      }
    }

    .change-table {
      :deep(.el-table__row:nth-child(even)) {
        background: #fafcff;
      }
    }
  }
}

@keyframes zoomFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
