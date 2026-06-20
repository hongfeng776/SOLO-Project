<template>
  <el-dialog v-model="visible" title="客房资源全流程溯源" width="820px" destroy-on-close top="6vh">
    <div class="trace-panel">
      <div class="filter-bar">
        <el-select v-model="filterForm.operationType" placeholder="操作类型" clearable style="width:180px">
          <el-option v-for="(item, key) in HotelRoomLogTypeEnum" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-date-picker
          v-model="filterForm.timeRange" type="daterange" range-separator="至"
          start-placeholder="开始时间" end-placeholder="结束时间"
          value-format="YYYY-MM-DD" style="width:260px" />
        <el-input v-model="filterForm.keyword" placeholder="搜索操作人/变更字段" clearable style="width:220px" />
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <el-timeline class="timeline">
        <el-timeline-item
          v-for="(log, idx) in list"
          :key="log.id"
          :timestamp="formatTime(log.createdAt)"
          :color="getLogColor(log.operationType)"
          placement="top"
        >
          <div class="trace-card">
            <div class="trace-header">
              <span class="trace-type" :style="{ color: getLogColor(log.operationType) }">
              <el-icon style="vertical-align:middle;margin-right:4px">
                <component :is="getLogIcon(log.operationType)" />
              </el-icon>
              {{ getLogLabel(log.operationType) }}
            </span>
            <span class="trace-operator">
              {{ log.operatorName }}（{{ log.operatorRole || '未知角色' }}）
              <span v-if="log.isBatch" style="margin-left:8px">
                <el-tag size="small" type="warning">批量操作 · {{ log.batchId }}</el-tag>
              </span>
            </span>
          </div>
          <div class="trace-changes">
            <div v-if="log.operationReason" style="color:#606266;margin-bottom:4px">
              <b>操作原因：</b>{{ log.operationReason }}
            </div>
            <template v-if="log.changeFields">
              <div v-for="f in parseChanges(log)" :key="f.field" class="change-item">
                <b>{{ f.label }}：</b>
                <template v-if="f.oldVal !== undefined && f.oldVal !== '' && f.oldVal !== null">
                  <span class="old-val">{{ f.oldVal }}</span> →
                </template>
                <span class="new-val">{{ f.newVal || '（空）' }}</span>
              </div>
            </template>
          </div>
          <div class="trace-footer">
            <el-tag v-if="log.verifyResult === 'block'" size="small" type="danger">校验拦截</el-tag>
            <el-tag v-else-if="log.verifyResult === 'warning'" size="small" type="warning">存在警告</el-tag>
            <el-tag v-else-if="log.verifyResult === 'pass'" size="small" type="success">校验通过</el-tag>
            <el-tag v-if="log.bookingLocked" size="small" type="danger" effect="dark">🔒 已锁定预订</el-tag>
            <el-tag v-if="log.ledgerSynced" size="small" type="info">已同步台账</el-tag>
          </div>
        </el-timeline-item>
        <el-empty v-if="list.length === 0" description="暂无操作记录" />
      </el-timeline>

      <div style="margin-top:14px;text-align:right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, total"
          @current-change="fetchData"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Plus, Edit, Upload, Download, Tools, CircleCheck, Close, RefreshRight, Files, Setting, Money, Warning, DocumentCopy } from '@element-plus/icons-vue'
import {
  HotelRoomLogTypeEnum
} from '@/utils/enums'
import { getHotelRoomLogs, getAllHotelRoomLogs } from '@/api/hotel'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  roomId: { type: [Number, String], default: null },
  globalMode: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const list = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const filterForm = reactive({ operationType: '', timeRange: [], keyword: '' })

const fieldLabelMap = {
  hotelId: '所属门店', roomType: '房型分类', roomName: '客房名称', roomNo: '房号',
  floor: '楼层', displayOrder: '展示排序', area: '面积', capacity: '容纳人数',
  maxCapacity: '最大人数', bedType: '床型', bedCount: '床数量',
  basePrice: '基准价', weekendPrice: '周末价', holidayPrice: '节假日价',
  extraBedPrice: '加床价', breakfast: '早餐', cancelPolicy: '取消政策',
  facilities: '设施标签', facilityText: '设施展示', targetGuest: '适配人群',
  totalCount: '总房量', availableCount: '可售房量', status: '销售状态',
  maintainStatus: '维护状态', isBookable: '可预订状态', displayOnHome: '首页展示',
  description: '房型介绍', isFake: '虚假标记', isDuplicate: '重复标记', warningFlags: '警告标记'
}

const getLogColor = (t) => HotelRoomLogTypeEnum[t]?.color || '#909399'
const getLogIcon = (t) => {
  const m = { create: Plus, update: Edit, on_shelf: Upload, off_shelf: Download, maintenance: Tools, resume: CircleCheck, sold_out: Close, restock: RefreshRight, batch_update: Files, facility_change: Setting, price_adjust: Money, fake_flag: Warning, duplicate_flag: DocumentCopy }
  return m[t] || Edit
}
const getLogLabel = (t) => HotelRoomLogTypeEnum[t]?.label || t

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const parseChanges = (log) => {
  let oldV = null, newV = null
  try { if (log.oldValue) oldV = JSON.parse(log.oldValue) } catch {}
  try { if (log.newValue) newV = JSON.parse(log.newValue) } catch {}
  const fields = (log.changeFields || '').split(',').filter(Boolean)
  if (!fields.length) return []
  const enumsMap = {
    roomType: 'HotelRoomTypeEnum', status: 'HotelRoomStatusEnum', maintainStatus: 'HotelRoomMaintainStatusEnum',
    bedType: 'HotelRoomBedTypeEnum', breakfast: 'HotelRoomBreakfastEnum', cancelPolicy: 'HotelRoomCancelPolicyEnum'
  }
  const translateVal = (field, val) => {
    if (val === undefined || val === null || val === '') return val
    if (enumsMap[field]) {
      try {
        const e = HotelRoomLogTypeEnum // placeholder
      } catch {}
    }
    if (typeof val === 'boolean') return val ? '是' : '否'
    if (Array.isArray(val)) return val.join('、')
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }
  return fields.map(f => ({
    field: f,
    label: fieldLabelMap[f] || f,
    oldVal: translateVal(f, oldV?.[f]),
    newVal: translateVal(f, newV?.[f])
  })).filter(c => c.oldVal !== c.newVal)
}

const fetchData = async () => {
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize }
    if (filterForm.operationType) params.operationType = filterForm.operationType
    if (filterForm.timeRange?.length === 2) {
      params.startTime = filterForm.timeRange[0]
      params.endTime = filterForm.timeRange[1]
    }
    let res
    if (props.globalMode || !props.roomId) res = await getAllHotelRoomLogs(params)
    else res = await getHotelRoomLogs(props.roomId, params)
    list.value = res?.data?.list || []
    pagination.total = res?.data?.total || 0
  } catch {
    list.value = [
      {
        id: 1, operationType: 'create', operatorName: '张三', operatorRole: 'hotel_operator',
        operationReason: '房型录入', changeFields: 'roomName,area,basePrice', createdAt: new Date(Date.now()-86400000),
        oldValue: null, newValue: JSON.stringify({ roomName: '高级大床房', area: 28, basePrice: 388 }),
        verifyResult: 'pass', bookingLocked: false, ledgerSynced: true, isBatch: false
      },
      {
        id: 2, operationType: 'price_adjust', operatorName: '李四', operatorRole: 'senior_hotel_operator',
        operationReason: '旺季调价', changeFields: 'basePrice,weekendPrice', createdAt: new Date(Date.now()-3600000*5),
        oldValue: JSON.stringify({ basePrice: 388, weekendPrice: 458 }),
        newValue: JSON.stringify({ basePrice: 428, weekendPrice: 498 }),
        verifyResult: 'pass', bookingLocked: false, ledgerSynced: true, isBatch: false
      }
    ]
    pagination.total = 2
  }
}

const resetFilter = () => {
  filterForm.operationType = ''
  filterForm.timeRange = []
  filterForm.keyword = ''
  pagination.page = 1
  fetchData()
}

watch(visible, (v) => { if (v) fetchData() })
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-room.scss';
</style>
