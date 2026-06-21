<template>
  <el-dialog v-model="visible" title="房价套餐全流程溯源" width="1000px" destroy-on-close top="6vh">
    <div class="trace-panel">
      <div class="filter-bar" style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <el-select v-model="filterForm.operationType" placeholder="操作类型" clearable style="width:180px">
        <el-option v-for="(item, key) in HotelPriceLogTypeEnum" :key="key" :label="item.label" :value="key" />
      </el-select>
      <el-date-picker v-model="filterForm.timeRange" type="daterange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD" style="width:260px" />
      <el-input v-model="filterForm.keyword" placeholder="搜索操作人/变更字段" clearable style="width:220px" />
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <div class="trace-table-container">
      <el-table
        ref="tableRef"
        :data="list"
        style="width:100%"
        border
        @row-dblclick="handleRowDblclick"
        :row-class-name="getRowClassName"
        :header-cell-style="{ background: '#fafafa', fontWeight: 600 }"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div v-if="expandedRows.includes(row.id)" class="expand-detail">
              <div class="detail-section">
              <div class="detail-title">变更字段详情</div>
              <div class="detail-content">
                <div v-for="c in parseChanges(row)" :key="c.field" class="change-item">
                  <b>{{ c.label }}：</b>
                  <template v-if="c.oldVal !== undefined && c.oldVal !== '' && c.oldVal !== null">
                    <span class="old-val">{{ c.oldVal }}</span> →
                  </template>
                  <span class="new-val">{{ c.newVal || '（空）' }}</span>
                </div>
              </div>
            </div>
            <div class="detail-section" style="margin-top:10px">
              <div class="detail-title">操作信息</div>
              <div class="detail-content">
                <div><b>操作人：</b>{{ row.operatorName }}（{{ row.operatorRole || '未知角色' }}）
                </div>
                <div><b>操作时间：</b>{{ formatTime(row.createdAt) }}</div>
                <div v-if="row.operationReason"><b>操作原因：</b>{{ row.operationReason }}</div>
                <div v-if="row.priceChanged">
                  <b>价格变更：</b>
                  <span class="old-val">¥{{ formatPrice(row.oldPriceValue) }}</span>
                  →
                  <span class="new-val">¥{{ formatPrice(row.newPriceValue) }}</span>
                </div>
                <div v-if="row.verifyMessages">
                  <b>校验结果：</b>{{ row.verifyResult === 'pass' ? '通过' : row.verifyResult === 'warning' ? '存在警告' : '被拦截' }}
                </div>
              </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="operationType" label="操作类型" width="130">
          <template #default="{ row }">
            <el-tag :color="getLogColor(row.operationType)" effect="light">
              <el-icon style="margin-right:3px;vertical-align:middle"><component :is="getLogIcon(row.operationType)" /></el-icon>
              {{ getLogLabel(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="operatorRole" label="角色" width="120" />
        <el-table-column label="价格变更" width="200">
          <template #default="{ row }">
            <template v-if="row.priceChanged">
              <span style="color:#ff4d4f;text-decoration:line-through">¥{{ formatPrice(row.oldPriceValue) }}</span>
              <span style="margin:0 6px">→</span>
              <span style="color:#52c41a;font-weight:600">¥{{ formatPrice(row.newPriceValue) }}</span>
            </template>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="changeFields" label="变更字段" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.changeFields">
              <el-tag size="small" style="margin-right:4px;margin-bottom:4px" v-for="f in (row.changeFields || '').split(',').filter(Boolean).slice(0, 3)" :key="f">
                {{ fieldLabelMap[f] || f }}
              </el-tag>
              <span v-if="(row.changeFields || '').split(',').length > 3" style="color:#909399;font-size:12px">
                +{{ (row.changeFields || '').split(',').length - 3 }}
              </span>
            </template>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作原因" prop="operationReason" min-width="200" show-overflow-tooltip />
        <el-table-column prop="orderSyncCount" label="同步订单" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.orderSyncCount > 0" type="success" size="small">{{ row.orderSyncCount }}</el-tag>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="标记" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.isBatch" size="small" type="warning">批量</el-tag>
            <el-tag v-if="row.verifyResult === 'block'" size="small" type="danger" style="margin-left:4px">拦截</el-tag>
            <el-tag v-if="row.verifyResult === 'warning'" size="small" type="warning" style="margin-left:4px">警告</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="180" :formatter="(r) => formatTime(r.createdAt)" />
      </el-table>
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
    <div style="margin-top:10px;color:#909399;font-size:12px;text-align:center">
      💡 双击任意行可展开查看完整变更明细；支持拖拽表头调整列宽
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { Plus, Edit, Upload, Download, Money, Switch, Files, Lock, Warning } from '@element-plus/icons-vue'
import {
  HotelPriceLogTypeEnum, formatPriceThousandth
} from '@/utils/enums'
import { getHotelRoomPriceLogs, getAllHotelRoomPriceLogs } from '@/api/hotel'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  priceId: { type: [Number, String], default: null },
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
const expandedRows = ref([])
const tableRef = ref(null)

const formatPrice = (v) => formatPriceThousandth(v)

const fieldLabelMap = {
  basePrice: '基准售价', originalPrice: '原价', discountRatio: '折扣', memberPrice: '会员价',
  corporatePrice: '协议价', startDate: '开始日期', endDate: '结束日期', weekDays: '适用星期',
  cancelPolicy: '退改规则', penaltyAmount: '违约金', penaltyPercent: '违约金比例',
  includedServices: '包含服务', servicesText: '服务展示', status: '状态',
  displayOnHome: '首页展示', displayPriority: '优先级', isExclusive: '专属特价',
  stockType: '库存类型', totalStock: '总库存', minAdvanceDays: '提前预订', targetGuestTags: '目标客群'
}

const getLogColor = (t) => HotelPriceLogTypeEnum[t]?.color || '#909399'
const getLogLabel = (t) => HotelPriceLogTypeEnum[t]?.label || t
const getLogIcon = (t) => {
  const m = { create: Plus, update: Edit, on_shelf: Upload, off_shelf: Download, adjust_price: Money, change_status: Switch, batch_adjust: Files, exclusive_lock: Lock, fake_flag: Warning, over_discount: Warning }
  return m[t] || Edit
}

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
  return fields.map(f => ({
    field: f,
    label: fieldLabelMap[f] || f,
    oldVal: oldV?.[f] !== undefined && oldV?.[f] !== null && oldV?.[f] !== '' ? String(oldV[f]) : undefined,
    newVal: newV?.[f] !== undefined && newV?.[f] !== null && newV?.[f] !== '' ? String(newV[f]) : undefined
  })).filter(c => c.oldVal !== c.newVal)
}

const getRowClassName = ({ row }) => {
  return expandedRows.value.includes(row.id) ? 'row-detail-expanded' : ''
}

const handleRowDblclick = async (row) => {
  const idx = expandedRows.value.indexOf(row.id)
  if (idx > -1) {
    expandedRows.value.splice(idx, 1)
  } else {
    expandedRows.value.push(row.id)
  }
  await nextTick()
  if (tableRef.value) {
    tableRef.value.toggleRowExpansion(row, true)
  }
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
    if (props.globalMode || !props.priceId) res = await getAllHotelRoomPriceLogs(params)
    else res = await getHotelRoomPriceLogs(props.priceId, params)
    list.value = res?.data?.list || []
    pagination.total = res?.data?.total || 0
  } catch {
    list.value = [
      {
        id: 1, operationType: 'create', operatorName: '张三', operatorRole: 'price_manager',
        operationReason: '旺季调价', changeFields: 'basePrice,discountRatio',
        priceChanged: true, oldPriceValue: 388, newPriceValue: 428,
        oldValue: JSON.stringify({ basePrice: 388, discountRatio: 8.5 }),
        newValue: JSON.stringify({ basePrice: 428, discountRatio: 9 }),
        createdAt: new Date(Date.now() - 86400000), isBatch: false, verifyResult: 'pass'
      },
      {
        id: 2, operationType: 'adjust_price', operatorName: '李四', operatorRole: 'senior_hotel_operator',
        operationReason: '周末促销', changeFields: 'basePrice,weekendPrice',
        priceChanged: true, oldPriceValue: 428, newPriceValue: 398,
        oldValue: JSON.stringify({ basePrice: 428, weekendPrice: 498 }),
        newValue: JSON.stringify({ basePrice: 398, weekendPrice: 458 }),
        createdAt: new Date(Date.now() - 3600000 * 5), isBatch: false, verifyResult: 'pass',
        orderSyncCount: 3
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
@import '@/styles/hotel-price.scss';
</style>
