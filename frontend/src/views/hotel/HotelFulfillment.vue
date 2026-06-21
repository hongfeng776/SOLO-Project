<template>
  <div class="hotel-fulfillment">
    <div class="page-header">
      <div class="header-left">
        <h2>酒店入住履约管控</h2>
        <p class="page-desc">入住核验、状态联动、批量履约、全流程溯源</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="openTraceGlobal">
          <el-icon style="margin-right:4px"><Clock /></el-icon>全流程溯源
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!canOps"
      type="error"
      show-icon
      title="权限不足：当前账号无履约审核权限，请联系管理员"
      style="margin-bottom:14px"
    />

    <div class="stat-cards">
      <div class="stat-card stat-total">
        <div class="stat-label">履约总数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card stat-checked-in">
        <div class="stat-label">已入住</div>
        <div class="stat-value">{{ stats.checkedIn }}</div>
      </div>
      <div class="stat-card stat-no-show">
        <div class="stat-label">未到异常</div>
        <div class="stat-value">{{ stats.noShow }}</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-label">风险预警</div>
        <div class="stat-value">{{ stats.warning }}</div>
      </div>
    </div>

    <el-tabs v-model="activeType" class="fulfillment-tabs" @tab-change="handleTypeChange">
      <el-tab-pane v-for="(item, key) in HotelFulfillmentTypeEnum" :key="key" :name="key">
        <template #label>
          <span>
            <el-icon style="vertical-align:middle;margin-right:4px"><component :is="item.icon" /></el-icon>
            {{ item.label }}
          </span>
          <el-badge :value="typeCounts[key] || 0" :hidden="!typeCounts[key]" class="tab-badge" />
        </template>
      </el-tab-pane>
    </el-tabs>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="所属门店">
          <el-select v-model="searchForm.hotelId" placeholder="全部" clearable filterable style="width:200px" @change="onHotelChange">
            <el-option v-for="h in hotelList" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="入住人/身份证/房号" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="核验状态">
          <el-select v-model="searchForm.verifyStatus" placeholder="全部" clearable style="width:140px">
            <el-option v-for="(item, key) in HotelFulfillmentVerifyStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="入住日期">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="入住日" end-placeholder="退房日" value-format="YYYY-MM-DD" style="width:260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <HotelFulfillBatchPanel
      :selected-ids="selectedIds"
      :selected-rows="selectedRows"
      @success="handleBatchSuccess"
      @clear-selection="clearSelection"
    />

    <div class="table-wrapper" :class="{ 'partial-fade-refresh': isRefreshing }">
      <el-table
        :data="list"
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="openDetail"
        style="width:100%"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="id" label="履约ID" width="80" />
        <el-table-column prop="orderId" label="订单ID" width="90" />
        <el-table-column label="入住人" min-width="120">
          <template #default="{ row }">
            <span :class="{ 'abnormal-cell': !row.guestName || row.guestName.length < 2 }">{{ row.guestName }}</span>
            <div class="sub-text">{{ maskIdCard(row.guestIdCard) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="房型/房号" min-width="130">
          <template #default="{ row }">
            <div>{{ row.roomTypeName || row.room?.roomName || '-' }}</div>
            <div class="sub-text">{{ row.roomNo || '待分配' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="入住日期" min-width="160">
          <template #default="{ row }">
            {{ row.checkInDate }} ~ {{ row.checkOutDate }}
            <div v-if="row.actualNights && row.actualNights !== row.nights" class="sub-text warning-text">
              实际{{ row.actualNights }}晚
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatPrice(row.settlementAmount || row.totalAmount) }}</span>
            <div v-if="row.extraCharge > 0" class="sub-text warning-text">+{{ formatPrice(row.extraCharge) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="履约状态" width="110">
          <template #default="{ row }">
            <el-tag
              :class="[HotelFulfillmentStatusEnum[row.status]?.tagClass, { 'status-transition': refreshId === row.id }]"
              size="small"
            >
              {{ HotelFulfillmentStatusEnum[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核验" width="100">
          <template #default="{ row }">
            <el-tag :class="HotelFulfillmentVerifyStatusEnum[row.verifyStatus]?.tagClass" size="small">
              {{ HotelFulfillmentVerifyStatusEnum[row.verifyStatus]?.label }}
            </el-tag>
            <span v-if="row.isFakeCheckIn" style="color:#f5222d;margin-left:4px">
              <el-icon style="vertical-align:middle"><Warning /></el-icon>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending_checkin' && row.verifyStatus !== 'verified'"
              type="primary"
              link
              class="verify-btn"
              @click="openVerify(row)"
            >核验</el-button>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleRowAction(cmd, row)">
              <el-button type="primary" link>更多<el-icon style="margin-left:3px"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status === 'checked_in' || row.status === 'delayed'" command="checkout">退房</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'checked_in' || row.status === 'delayed'" command="extend">续住</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'pending_checkin'" command="noshow">标记未到</el-dropdown-item>
                  <el-dropdown-item command="trace">溯源</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <HotelFulfillVerifyDialog
      v-model="verifyDialogVisible"
      :fulfill-data="currentRow"
      @success="handleVerifySuccess"
    />

    <HotelFulfillTracePanel
      v-model="traceDialogVisible"
      :fulfill-id="traceFulfillId"
      :global-mode="traceGlobalMode"
    />

    <el-dialog v-model="detailDialogVisible" title="履约详情" width="720px" class="detail-dialog" destroy-on-close>
      <el-descriptions v-if="currentRow" :column="2" border>
        <el-descriptions-item label="履约ID">{{ currentRow.id }}</el-descriptions-item>
        <el-descriptions-item label="订单ID">{{ currentRow.orderId }}</el-descriptions-item>
        <el-descriptions-item label="入住人">{{ currentRow.guestName }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentRow.guestIdCard }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentRow.guestPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入住人数">{{ currentRow.guestCount }}</el-descriptions-item>
        <el-descriptions-item label="房型">{{ currentRow.roomTypeName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="房号">{{ currentRow.roomNo || '待分配' }}</el-descriptions-item>
        <el-descriptions-item label="计划入住">{{ currentRow.checkInDate }}</el-descriptions-item>
        <el-descriptions-item label="计划退房">{{ currentRow.checkOutDate }}</el-descriptions-item>
        <el-descriptions-item label="实际入住">{{ currentRow.actualCheckInTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实际退房">{{ currentRow.actualCheckOutTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划晚数">{{ currentRow.nights }}</el-descriptions-item>
        <el-descriptions-item label="实际晚数">{{ currentRow.actualNights || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ formatPrice(currentRow.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="已付金额">{{ formatPrice(currentRow.paidAmount) }}</el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span :class="{ 'abnormal-cell': currentRow.settlementAmount && currentRow.settlementAmount !== currentRow.totalAmount }">
            {{ formatPrice(currentRow.settlementAmount) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="额外费用">{{ currentRow.extraCharge > 0 ? formatPrice(currentRow.extraCharge) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">{{ currentRow.refundAmount > 0 ? formatPrice(currentRow.refundAmount) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="履约状态">
          <el-tag :class="HotelFulfillmentStatusEnum[currentRow.status]?.tagClass" size="small">
            {{ HotelFulfillmentStatusEnum[currentRow.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="核验状态">
          <el-tag :class="HotelFulfillmentVerifyStatusEnum[currentRow.verifyStatus]?.tagClass" size="small">
            {{ HotelFulfillmentVerifyStatusEnum[currentRow.verifyStatus]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="核验时间">{{ currentRow.verifyTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="核验人">{{ currentRow.verifyOperator || '-' }}</el-descriptions-item>
        <el-descriptions-item label="核验备注" :span="2">{{ currentRow.verifyRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="延迟原因" v-if="currentRow.delayReason" :span="2">{{ currentRow.delayReason }}</el-descriptions-item>
        <el-descriptions-item label="取消原因" v-if="currentRow.cancelReason" :span="2">{{ currentRow.cancelReason }}</el-descriptions-item>
        <el-descriptions-item label="提前退房原因" v-if="currentRow.earlyCheckoutReason" :span="2">{{ currentRow.earlyCheckoutReason }}</el-descriptions-item>
        <el-descriptions-item label="身份证核验">
          <el-icon v-if="currentRow.idCardValid" style="color:#52c41a"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="currentRow.idCardValid === false" style="color:#f5222d"><CircleCloseFilled /></el-icon>
          <span v-else>未核验</span>
        </el-descriptions-item>
        <el-descriptions-item label="时效核验">
          <el-icon v-if="currentRow.timelinessValid" style="color:#52c41a"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="currentRow.timelinessValid === false" style="color:#f5222d"><CircleCloseFilled /></el-icon>
          <span v-else>未核验</span>
        </el-descriptions-item>
        <el-descriptions-item label="房型匹配">
          <el-icon v-if="currentRow.roomMatchValid" style="color:#52c41a"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="currentRow.roomMatchValid === false" style="color:#f5222d"><CircleCloseFilled /></el-icon>
          <span v-else>未核验</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-icon v-if="currentRow.orderStatusValid" style="color:#52c41a"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="currentRow.orderStatusValid === false" style="color:#f5222d"><CircleCloseFilled /></el-icon>
          <span v-else>未核验</span>
        </el-descriptions-item>
        <el-descriptions-item label="高端套房">
          <el-tag v-if="currentRow.isSuite" type="warning" size="small">是</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
        <el-descriptions-item label="虚假入住">
          <el-tag v-if="currentRow.isFakeCheckIn" type="danger" size="small">是</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openTraceFromDetail">查看溯源</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="checkoutDialogVisible" title="退房操作" width="500px" destroy-on-close>
      <el-form :model="checkoutForm" label-width="100px">
        <el-form-item label="提前退房">
          <el-switch v-model="checkoutForm.earlyCheckout" />
        </el-form-item>
        <el-form-item label="退房原因">
          <el-input v-model="checkoutForm.reason" type="textarea" :rows="3" placeholder="请输入退房原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkoutDialogVisible = false">取消</el-button>
        <el-button type="primary" :class="{ submitting: isSubmitting }" @click="handleCheckout">确认退房</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="extendDialogVisible" title="续住操作" width="500px" destroy-on-close>
      <el-form :model="extendForm" label-width="100px">
        <el-form-item label="续住晚数">
          <el-input-number v-model="extendForm.extendNights" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="续住原因">
          <el-input v-model="extendForm.reason" type="textarea" :rows="3" placeholder="请输入续住原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="extendDialogVisible = false">取消</el-button>
        <el-button type="primary" :class="{ submitting: isSubmitting }" @click="handleExtend">确认续住</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="noshowDialogVisible" title="标记未到" width="500px" destroy-on-close>
      <el-form :model="noshowForm" label-width="100px">
        <el-form-item label="未到原因">
          <el-input v-model="noshowForm.reason" type="textarea" :rows="3" placeholder="请输入未到原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noshowDialogVisible = false">取消</el-button>
        <el-button type="danger" :class="{ submitting: isSubmitting }" @click="handleNoshow">确认标记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, ArrowDown, Warning, CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  HotelFulfillmentTypeEnum,
  HotelFulfillmentStatusEnum,
  HotelFulfillmentVerifyStatusEnum,
  formatPriceThousandth
} from '@/utils/enums'
import {
  getHotelFulfillmentList,
  getHotelFulfillment,
  verifyHotelFulfillment,
  checkoutHotelFulfillment,
  extendHotelFulfillment,
  markNoShowHotelFulfillment,
  checkHotelFulfillmentPermission
} from '@/api/hotel'
import { getHotelList } from '@/api/hotel'
import HotelFulfillVerifyDialog from '@/components/Hotel/HotelFulfillVerifyDialog.vue'
import HotelFulfillBatchPanel from '@/components/Hotel/HotelFulfillBatchPanel.vue'
import HotelFulfillTracePanel from '@/components/Hotel/HotelFulfillTracePanel.vue'

const canOps = ref(true)
const activeType = ref('pending')
const list = ref([])
const selectedIds = ref([])
const selectedRows = ref([])
const currentRow = ref(null)
const refreshId = ref(null)
const isRefreshing = ref(false)
const isSubmitting = ref(false)

const searchForm = reactive({
  hotelId: null,
  keyword: '',
  verifyStatus: null
})
const dateRange = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  total: 0,
  checkedIn: 0,
  noShow: 0,
  warning: 0
})

const typeCounts = reactive({
  pending: 0,
  normal: 0,
  delayed: 0,
  cancelled: 0
})

const verifyDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const traceFulfillId = ref(null)
const traceGlobalMode = ref(false)
const detailDialogVisible = ref(false)
const checkoutDialogVisible = ref(false)
const extendDialogVisible = ref(false)
const noshowDialogVisible = ref(false)

const checkoutForm = reactive({ earlyCheckout: false, reason: '' })
const extendForm = reactive({ extendNights: 1, reason: '' })
const noshowForm = reactive({ reason: '' })

const hotelList = ref([])

const formatPrice = (val) => formatPriceThousandth(val)

const maskIdCard = (id) => {
  if (!id || id.length < 8) return id || '-'
  return id.slice(0, 4) + '****' + id.slice(-4)
}

const mockData = [
  { id: 1001, orderId: 5001, hotelId: 1, roomId: 1, fulfillmentType: 'pending', status: 'pending_checkin', verifyStatus: 'unverified', guestName: '张三', guestIdCard: '110101199001011234', guestPhone: '13800138001', guestCount: 2, checkInDate: '2026-06-20', checkOutDate: '2026-06-22', nights: 2, roomTypeName: '豪华大床房', roomNo: '808', roomPrice: 588, totalAmount: 1176, paidAmount: 1176, isSuite: false, isFakeCheckIn: false, isDuplicateVerify: false, isIllegalCheckout: false, roomOccupancySynced: false, orderProgressSynced: false, voucherGenerated: false, ledgerSynced: false, idCardValid: null, timelinessValid: null, roomMatchValid: null, orderStatusValid: null, warningFlags: [], room: { id: 1, roomName: '豪华大床房', roomType: 'big_bed', basePrice: 588 } },
  { id: 1002, orderId: 5002, hotelId: 1, roomId: 2, fulfillmentType: 'normal', status: 'checked_in', verifyStatus: 'verified', guestName: '李四', guestIdCard: '310101198805052345', guestPhone: '13900139002', guestCount: 1, checkInDate: '2026-06-19', checkOutDate: '2026-06-21', nights: 2, actualNights: 2, roomTypeName: '标准双床房', roomNo: '512', roomPrice: 398, totalAmount: 796, paidAmount: 796, settlementAmount: 796, actualCheckInTime: '2026-06-19 14:30', isSuite: false, isFakeCheckIn: false, idCardValid: true, timelinessValid: true, roomMatchValid: true, orderStatusValid: true, roomOccupancySynced: true, orderProgressSynced: true, voucherGenerated: true, ledgerSynced: false, warningFlags: [], room: { id: 2, roomName: '标准双床房', roomType: 'twin_bed', basePrice: 398 } },
  { id: 1003, orderId: 5003, hotelId: 2, roomId: 3, fulfillmentType: 'delayed', status: 'delayed', verifyStatus: 'verified', guestName: '王五', guestIdCard: '440101199203033456', guestPhone: '15000150003', guestCount: 3, checkInDate: '2026-06-18', checkOutDate: '2026-06-20', nights: 2, actualNights: 2, roomTypeName: '家庭套房', roomNo: '1201', roomPrice: 888, totalAmount: 1776, paidAmount: 1776, settlementAmount: 1776, actualCheckInTime: '2026-06-19 10:00', delayReason: '航班延误', isSuite: true, isFakeCheckIn: false, idCardValid: true, timelinessValid: false, roomMatchValid: true, orderStatusValid: true, roomOccupancySynced: true, orderProgressSynced: true, voucherGenerated: true, ledgerSynced: true, warningFlags: ['入住时间已延迟'], room: { id: 3, roomName: '家庭套房', roomType: 'suite', basePrice: 888 } },
  { id: 1004, orderId: 5004, hotelId: 1, roomId: 1, fulfillmentType: 'pending', status: 'pending_checkin', verifyStatus: 'rejected', guestName: '赵', guestIdCard: '50010119900', guestPhone: '13800138004', guestCount: 7, checkInDate: '2026-06-21', checkOutDate: '2026-06-23', nights: 2, roomTypeName: '豪华大床房', roomPrice: 588, totalAmount: 0, paidAmount: 0, isSuite: false, isFakeCheckIn: true, isDuplicateVerify: false, idCardValid: false, timelinessValid: true, roomMatchValid: true, orderStatusValid: true, roomOccupancySynced: false, orderProgressSynced: false, voucherGenerated: false, warningFlags: ['入住人姓名异常', '身份证号异常', '入住人数过多', '订单金额异常'], room: { id: 1, roomName: '豪华大床房', roomType: 'big_bed', basePrice: 588 } },
  { id: 1005, orderId: 5005, hotelId: 2, roomId: 4, fulfillmentType: 'cancelled', status: 'no_show', verifyStatus: 'rejected', guestName: '孙六', guestIdCard: '330101198706064567', guestPhone: '13700137005', guestCount: 1, checkInDate: '2026-06-17', checkOutDate: '2026-06-18', nights: 1, roomTypeName: '商务单间', roomPrice: 328, totalAmount: 328, paidAmount: 328, isSuite: false, isFakeCheckIn: false, idCardValid: true, timelinessValid: false, roomMatchValid: true, orderStatusValid: true, cancelReason: '逾期未到店', roomOccupancySynced: true, orderProgressSynced: true, voucherGenerated: false, ledgerSynced: true, warningFlags: [], room: { id: 4, roomName: '商务单间', roomType: 'single', basePrice: 328 } },
  { id: 1006, orderId: 5006, hotelId: 1, roomId: 2, fulfillmentType: 'normal', status: 'checked_out', verifyStatus: 'verified', guestName: '周七', guestIdCard: '320101199104045678', guestPhone: '13600136006', guestCount: 2, checkInDate: '2026-06-15', checkOutDate: '2026-06-17', nights: 2, actualNights: 2, roomTypeName: '标准双床房', roomNo: '618', roomPrice: 398, totalAmount: 796, paidAmount: 796, settlementAmount: 796, actualCheckInTime: '2026-06-15 16:00', actualCheckOutTime: '2026-06-17 11:00', isSuite: false, isFakeCheckIn: false, idCardValid: true, timelinessValid: true, roomMatchValid: true, orderStatusValid: true, roomOccupancySynced: true, orderProgressSynced: true, voucherGenerated: true, ledgerSynced: true, warningFlags: [], room: { id: 2, roomName: '标准双床房', roomType: 'twin_bed', basePrice: 398 } }
]

const fetchData = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm,
      fulfillmentType: activeType.value === 'pending' ? undefined : activeType.value
    }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getHotelFulfillmentList(params)
    if (res.data?.list) {
      list.value = res.data.list
      pagination.total = res.data.total
    } else {
      throw new Error('mock')
    }
  } catch {
    list.value = mockData.filter(d => {
      if (activeType.value === 'pending') return d.fulfillmentType === 'pending'
      return d.fulfillmentType === activeType.value
    })
    pagination.total = list.value.length
    computeStats(mockData)
    computeTypeCounts(mockData)
  }
}

const computeStats = (data) => {
  stats.total = data.length
  stats.checkedIn = data.filter(d => d.status === 'checked_in' || d.status === 'delayed').length
  stats.noShow = data.filter(d => d.status === 'no_show').length
  stats.warning = data.filter(d => d.isFakeCheckIn || d.isIllegalCheckout || d.isDuplicateVerify || (d.warningFlags && d.warningFlags.length > 0)).length
}

const computeTypeCounts = (data) => {
  typeCounts.pending = data.filter(d => d.fulfillmentType === 'pending').length
  typeCounts.normal = data.filter(d => d.fulfillmentType === 'normal').length
  typeCounts.delayed = data.filter(d => d.fulfillmentType === 'delayed').length
  typeCounts.cancelled = data.filter(d => d.fulfillmentType === 'cancelled').length
}

const handleTypeChange = () => {
  selectedIds.value = []
  selectedRows.value = []
  pagination.page = 1
  fetchData()
}

const onHotelChange = () => fetchData()

const resetSearch = () => {
  searchForm.hotelId = null
  searchForm.keyword = ''
  searchForm.verifyStatus = null
  dateRange.value = null
  fetchData()
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const clearSelection = () => {
  selectedIds.value = []
  selectedRows.value = []
}

const triggerPartialRefresh = () => {
  isRefreshing.value = true
  setTimeout(() => { isRefreshing.value = false }, 300)
}

const openVerify = (row) => {
  currentRow.value = row
  verifyDialogVisible.value = true
}

const openDetail = (row) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

const openTrace = (row) => {
  traceFulfillId.value = row.id
  traceGlobalMode.value = false
  traceDialogVisible.value = true
}

const openTraceGlobal = () => {
  traceFulfillId.value = null
  traceGlobalMode.value = true
  traceDialogVisible.value = true
}

const openTraceFromDetail = () => {
  if (currentRow.value) {
    openTrace(currentRow.value)
  }
}

const handleRowAction = (command, row) => {
  currentRow.value = row
  if (command === 'checkout') {
    checkoutForm.earlyCheckout = false
    checkoutForm.reason = ''
    checkoutDialogVisible.value = true
  } else if (command === 'extend') {
    extendForm.extendNights = 1
    extendForm.reason = ''
    extendDialogVisible.value = true
  } else if (command === 'noshow') {
    noshowForm.reason = ''
    noshowDialogVisible.value = true
  } else if (command === 'trace') {
    openTrace(row)
  }
}

const withAntiDuplicate = async (fn) => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  await new Promise(r => setTimeout(r, 300))
  try {
    await fn()
  } finally {
    isSubmitting.value = false
  }
}

const handleCheckout = () => {
  withAntiDuplicate(async () => {
    try {
      await checkoutHotelFulfillment(currentRow.value.id, checkoutForm)
      ElMessage.success('退房操作成功')
      checkoutDialogVisible.value = false
      triggerPartialRefresh()
      fetchData()
    } catch (e) {
      ElMessage.error(e.message || '退房操作失败')
    }
  })
}

const handleExtend = () => {
  withAntiDuplicate(async () => {
    try {
      await extendHotelFulfillment(currentRow.value.id, extendForm)
      ElMessage.success('续住操作成功')
      extendDialogVisible.value = false
      triggerPartialRefresh()
      fetchData()
    } catch (e) {
      ElMessage.error(e.message || '续住操作失败')
    }
  })
}

const handleNoshow = () => {
  withAntiDuplicate(async () => {
    try {
      await markNoShowHotelFulfillment(currentRow.value.id, noshowForm.reason)
      ElMessage.success('标记未到成功')
      noshowDialogVisible.value = false
      triggerPartialRefresh()
      fetchData()
    } catch (e) {
      ElMessage.error(e.message || '标记未到失败')
    }
  })
}

const handleVerifySuccess = () => {
  verifyDialogVisible.value = false
  triggerPartialRefresh()
  fetchData()
}

const handleBatchSuccess = () => {
  triggerPartialRefresh()
  fetchData()
}

const loadPermission = async () => {
  try {
    const res = await checkHotelFulfillmentPermission()
    if (res.data) canOps.value = res.data.canOps
  } catch {}
}

const loadHotels = async () => {
  try {
    const res = await getHotelList({ pageSize: 200 })
    if (res.data?.list) hotelList.value = res.data.list
  } catch {}
}

onMounted(() => {
  loadPermission()
  loadHotels()
  fetchData()
  computeStats(mockData)
  computeTypeCounts(mockData)
})
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-fulfillment.scss';

.hotel-fulfillment {
  .sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
  .warning-text {
    color: #faad14;
  }
  .amount-text {
    font-weight: 600;
    color: #1890ff;
    font-variant-numeric: tabular-nums;
  }
}
</style>
