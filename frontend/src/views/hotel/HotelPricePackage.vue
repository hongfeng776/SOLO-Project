<template>
  <div class="hotel-price-package">
    <div class="page-header">
      <div class="header-left">
        <h2>酒店房价套餐管理</h2>
        <p class="page-desc">房价套餐全生命周期管理：定价配置、合规校验、批量调整、全流程溯源</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="openTraceGlobal">
          <el-icon style="margin-right:4px"><Clock /></el-icon>全流程溯源
        </el-button>
        <el-button type="success" @click="openCreate">
          <el-icon style="margin-right:4px"><Plus /></el-icon>新增套餐
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!canOps"
      type="error"
      show-icon
      title="权限不足：当前账号无价格配置权限，请联系管理员"
      style="margin-bottom:14px"
    />

    <div class="stat-cards">
      <div class="stat-card stat-total">
        <div class="stat-label">套餐总数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card stat-active">
        <div class="stat-label">生效中</div>
        <div class="stat-value stat-active">{{ stats.active }}</div>
      </div>
      <div class="stat-card stat-expired">
        <div class="stat-label">已过期</div>
        <div class="stat-value stat-expired">{{ stats.expired }}</div>
      </div>
      <div class="stat-card stat-exclusive">
        <div class="stat-label">专属特价</div>
        <div class="stat-value stat-exclusive">{{ stats.exclusive }}</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-label">风险预警</div>
        <div class="stat-value stat-warning">{{ stats.warning }}</div>
      </div>
    </div>

    <el-tabs v-model="activeType" class="price-tabs" @tab-change="handleTypeChange">
      <el-tab-pane v-for="(item, key) in HotelPriceTypeEnum" :key="key" :name="key">
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
        <el-form-item label="所属房型">
          <el-select v-model="searchForm.roomId" placeholder="全部" clearable filterable style="width:200px" @change="fetchData">
            <el-option v-for="r in roomList" :key="r.id" :label="r.roomName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="套餐名称/编码" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:140px">
            <el-option v-for="(item, key) in HotelPriceStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="生效日" end-placeholder="失效日" value-format="YYYY-MM-DD" style="width:260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <HotelPriceBatchPanel
      :selected-ids="selectedIds"
      :selected-rows="selectedRows"
      @success="handleBatchSuccess"
      @clear-selection="clearSelection"
    />

    <div v-if="list.length > 0" class="package-card-grid">
      <div
        v-for="item in list"
        :key="item.id"
        :class="['package-card', { 'card-selected': selectedIds.includes(item.id), 'card-exclusive': item.isExclusive }]"
        @dblclick="openDetail(item)"
      >
        <div class="card-selector" @click.stop="toggleSelect(item)">
          <el-checkbox v-model="selectedIds" :value="item.id" />
        </div>
        <el-tag v-if="item.isExclusive" class="card-exclusive-badge" type="danger" effect="dark" size="small">专属特价</el-tag>

        <div class="card-header">
          <div class="package-name">
            {{ item.packageName || (item.room?.roomName + ' - ' + HotelPriceTypeEnum[item.priceType]?.label) }}
            <span class="package-code">#{{ item.packageCode || item.id }}</span>
          </div>
          <div class="package-meta">
            <el-tag :class="HotelPriceTypeEnum[item.priceType]?.tagClass" size="small">
              {{ HotelPriceTypeEnum[item.priceType]?.label }}
            </el-tag>
            <el-tag
              :class="HotelPriceStatusEnum[item.status]?.tagClass"
              size="small"
              :class="{ 'status-transition': refreshId === item.id }"
            >
              {{ HotelPriceStatusEnum[item.status]?.label }}
            </el-tag>
            <el-tag v-if="item.isFlashSale" type="danger" size="small" effect="dark" style="animation:blinkWarn 1.2s infinite">
              ⚡ 限时闪购
            </el-tag>
          </div>
        </div>

        <div class="card-price">
          <span class="price-current price-thousandth">
            <span class="price-symbol">¥</span>
            {{ formatPrice(item.basePrice) }}
          </span>
          <span v-if="item.originalPrice" class="price-original price-thousandth">¥{{ formatPrice(item.originalPrice) }}</span>
          <el-tag v-if="item.discountRatio" class="price-discount" size="small">
            {{ item.discountRatio }}折
          </el-tag>
        </div>

        <div class="card-info">
          <div class="info-row">
            <span class="info-label">有效期</span>
            <span class="info-value">{{ item.startDate }} ~ {{ item.endDate }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">适用星期</span>
            <span class="info-value">{{ formatWeekDays(item.weekDays) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">退改政策</span>
            <span class="info-value">{{ HotelRoomCancelPolicyEnum[item.cancelPolicy]?.label }}</span>
          </div>
          <div v-if="item.minNights > 1 || item.maxAdvanceDays > 0" class="info-row">
            <span class="info-label">预订规则</span>
            <span class="info-value">
              连住{{ item.minNights }}晚起 · 提前{{ item.minAdvanceDays }}-{{ item.maxAdvanceDays }}天
            </span>
          </div>
          <div class="services-row">
            <span
              v-for="(s, i) in parseServices(item.includedServices).slice(0, 5)"
              :key="i"
              class="service-tag"
            >{{ s }}</span>
            <el-tooltip v-if="parseServices(item.includedServices).length > 5" placement="top">
              <template #content>
                <div>{{ parseServices(item.includedServices).join('、') }}</div>
              </template>
              <span class="service-tag">+{{ parseServices(item.includedServices).length - 5 }}</span>
            </el-tooltip>
          </div>
        </div>

        <div class="card-footer">
          <div class="footer-left">
            <template v-if="item.stockType === 'limited'">
              已售{{ item.soldCount || 0 }}/{{ item.totalStock }}
            </template>
            <template v-else-if="item.stockType === 'daily_limit'">
              每日限{{ item.dailyLimit }}
            </template>
            <template v-else>
              无限库存
            </template>
            <span v-if="item.isFake || item.isOverDiscount" style="margin-left:8px;color:#f5222d">
              <el-icon style="vertical-align:middle"><Warning /></el-icon>
              {{ item.isFake ? '虚假' : '超优惠' }}
            </span>
          </div>
          <div class="footer-right">
            <el-button type="primary" link @click="openDetail(item)">详情</el-button>
            <el-button type="primary" link @click="openTrace(item)">溯源</el-button>
            <el-button type="primary" link @click="openEdit(item)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleRowAction(cmd, item)">
              <el-button type="primary" link>更多<el-icon style="margin-left:3px"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="on_shelf" :disabled="item.status === 'active'">上架生效</el-dropdown-item>
                  <el-dropdown-item command="off_shelf" :disabled="item.status === 'inactive'">暂停使用</el-dropdown-item>
                  <el-dropdown-item command="expired" :disabled="item.status === 'expired'">标记过期</el-dropdown-item>
                  <el-dropdown-item command="fake_flag" divided>标记虚假</el-dropdown-item>
                  <el-dropdown-item command="over_discount">标记超优惠</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无套餐数据" style="padding:60px 0" />

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <HotelPriceEditDialog
      v-model="editDialogVisible"
      :edit-data="currentEdit"
      @success="handleEditSuccess"
    />

    <HotelPriceTracePanel
      v-model="traceVisible"
      :price-id="currentTraceId"
      :global-mode="traceGlobal"
    />

    <el-dialog v-model="detailVisible" title="套餐详情" width="760px" destroy-on-close>
      <template v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="套餐名称" :span="2">
            {{ currentDetail.packageName || (currentDetail.room?.roomName + ' - ' + HotelPriceTypeEnum[currentDetail.priceType]?.label) }}
            <el-tag v-if="currentDetail.isExclusive" style="margin-left:8px" type="danger" effect="dark" size="small">专属特价</el-tag>
            <el-tag v-if="currentDetail.isFlashSale" style="margin-left:8px" type="warning" effect="dark" size="small">限时闪购</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="套餐编码">{{ currentDetail.packageCode || currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="价格类型">
            <el-tag :class="HotelPriceTypeEnum[currentDetail.priceType]?.tagClass">
              {{ HotelPriceTypeEnum[currentDetail.priceType]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属门店">{{ currentDetail.hotel?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属房型">{{ currentDetail.room?.roomName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :class="HotelPriceStatusEnum[currentDetail.status]?.tagClass">
              {{ HotelPriceStatusEnum[currentDetail.status]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="基准售价" :span="2">
            <span style="font-size:28px;font-weight:700;color:#f5222d" class="price-thousandth">
              ¥{{ formatPrice(currentDetail.basePrice) }}
            </span>
            <span v-if="currentDetail.originalPrice" style="margin-left:12px;text-decoration:line-through;color:#909399">
              ¥{{ formatPrice(currentDetail.originalPrice) }}
            </span>
            <el-tag v-if="currentDetail.discountRatio" type="danger" style="margin-left:12px">
              {{ currentDetail.discountRatio }}折
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="会员价">¥{{ formatPrice(currentDetail.memberPrice) }}</el-descriptions-item>
          <el-descriptions-item label="协议价">¥{{ formatPrice(currentDetail.corporatePrice) }}</el-descriptions-item>
          <el-descriptions-item label="生效日期" :span="2">{{ currentDetail.startDate }} ~ {{ currentDetail.endDate }}</el-descriptions-item>
          <el-descriptions-item label="适用星期">{{ formatWeekDays(currentDetail.weekDays) }}</el-descriptions-item>
          <el-descriptions-item label="预订规则">
            提前{{ currentDetail.minAdvanceDays }}-{{ currentDetail.maxAdvanceDays }}天 · 连住{{ currentDetail.minNights }}-{{ currentDetail.maxNights }}晚
          </el-descriptions-item>
          <el-descriptions-item label="退改政策">{{ HotelRoomCancelPolicyEnum[currentDetail.cancelPolicy]?.label }}</el-descriptions-item>
          <el-descriptions-item label="违约金额">
            {{ currentDetail.penaltyAmount ? '¥' + formatPrice(currentDetail.penaltyAmount) : '' }}
            {{ currentDetail.penaltyPercent ? currentDetail.penaltyPercent + '%' : '' }}
            {{ !currentDetail.penaltyAmount && !currentDetail.penaltyPercent ? '-' : '' }}
          </el-descriptions-item>
          <el-descriptions-item label="包含服务" :span="2">
            <div class="services-row">
              <span v-for="(s, i) in parseServices(currentDetail.includedServices)" :key="i" class="service-tag">{{ s }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="目标客群" :span="2">
            {{ (currentDetail.targetGuestTags || '').split(',').filter(Boolean).join('、') || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="库存类型">{{ currentDetail.stockType === 'unlimited' ? '无限' : currentDetail.stockType === 'limited' ? `限量${currentDetail.totalStock}，已售${currentDetail.soldCount}` : `每日限${currentDetail.dailyLimit}` }}</el-descriptions-item>
          <el-descriptions-item label="限购">每单{{ currentDetail.perOrderLimit }}间 · 每人{{ currentDetail.perUserLimit || '不限' }}间</el-descriptions-item>
          <el-descriptions-item label="使用须知" :span="2">{{ currentDetail.useInstructions || '-' }}</el-descriptions-item>
          <el-descriptions-item label="风控标记" :span="2">
            <el-tag v-if="currentDetail.isFake" type="danger" style="margin-right:6px">虚假套餐</el-tag>
            <el-tag v-if="currentDetail.isOverDiscount" type="warning" style="margin-right:6px">超范围优惠</el-tag>
            <span v-if="!currentDetail.isFake && !currentDetail.isOverDiscount" style="color:#52c41a">正常</span>
          </el-descriptions-item>
          <el-descriptions-item label="展示优先级">{{ currentDetail.displayPriority }}</el-descriptions-item>
          <el-descriptions-item label="首页展示">{{ currentDetail.displayOnHome ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentDetail.createdBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新人">{{ currentDetail.updatedBy || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Clock, Warning, ArrowDown, Sunny, Moon, Calendar, Present } from '@element-plus/icons-vue'
import {
  HotelPriceTypeEnum, HotelPriceStatusEnum, HotelRoomCancelPolicyEnum,
  formatPriceThousandth
} from '@/utils/enums'
import {
  getHotelRoomPriceList, getHotelRoomPrice, checkHotelRoomPricePermission,
  changeHotelRoomPriceStatus, getHotelList, getHotelRoomList
} from '@/api/hotel'
import HotelPriceEditDialog from '@/components/Hotel/HotelPriceEditDialog.vue'
import HotelPriceBatchPanel from '@/components/Hotel/HotelPriceBatchPanel.vue'
import HotelPriceTracePanel from '@/components/Hotel/HotelPriceTracePanel.vue'

const list = ref([])
const pagination = reactive({ page: 1, pageSize: 12, total: 0 })
const activeType = ref('daily')
const searchForm = reactive({ hotelId: null, roomId: null, keyword: '', status: '' })
const dateRange = ref([])
const hotelList = ref([])
const roomList = ref([])
const canOps = ref(true)
const selectedIds = ref([])
const selectedRows = ref([])
const refreshId = ref(null)

const typeCounts = reactive({})
const stats = reactive({ total: 0, active: 0, expired: 0, exclusive: 0, warning: 0 })

const editDialogVisible = ref(false)
const currentEdit = ref(null)
const detailVisible = ref(false)
const currentDetail = ref(null)
const traceVisible = ref(false)
const currentTraceId = ref(null)
const traceGlobal = ref(false)

const formatPrice = (v) => formatPriceThousandth(v)

const formatWeekDays = (wd) => {
  if (!wd) return '每天'
  const wdArr = typeof wd === 'string' ? wd.split(',').filter(Boolean) : wd
  if (wdArr.length === 7) return '每天'
  const names = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return wdArr.map(d => names[parseInt(d)] || d).join('、')
}

const parseServices = (s) => {
  if (!s) return []
  if (typeof s === 'string') {
    try { return JSON.parse(s) } catch { return [s] }
  }
  return Array.isArray(s) ? s : []
}

const calcStats = (data) => {
  stats.total = data.length || pagination.total
  stats.active = data.filter(r => r.status === 'active').length
  stats.expired = data.filter(r => r.status === 'expired').length
  stats.exclusive = data.filter(r => r.isExclusive).length
  stats.warning = data.filter(r => r.isFake || r.isOverDiscount).length
  for (const k of Object.keys(HotelPriceTypeEnum)) typeCounts[k] = 0
  data.forEach(r => { if (typeCounts[r.priceType] !== undefined) typeCounts[r.priceType]++ })
}

const initMockData = () => {
  const mock = [
    {
      id: 1001, hotelId: 1, roomId: 101, priceType: 'daily',
      packageName: '标准大床房-日常价', packageCode: 'PKG202601001',
      basePrice: 328, originalPrice: 398, discountRatio: 8.2, memberPrice: 308, corporatePrice: 288,
      startDate: '2026-01-01', endDate: '2026-12-31', weekDays: '1,2,3,4,5,6,7',
      minAdvanceDays: 0, maxAdvanceDays: 30, minNights: 1, maxNights: 30,
      cancelPolicy: 'free_before_24h', penaltyAmount: null, penaltyPercent: null,
      includedServices: JSON.stringify(['免费WiFi', '双人早餐', '免费停车', '延迟退房']),
      servicesText: '含双早+免费停车+延迟退房',
      targetGuestTags: '商务旅客,休闲游客', targetMemberLevels: '',
      stockType: 'unlimited', totalStock: 0, soldCount: 0, dailyLimit: 0,
      perOrderLimit: 9, perUserLimit: 0, status: 'active', displayOnHome: true,
      displayPriority: 10, isExclusive: false, isFlashSale: false,
      description: '标准大床房日常优惠价', isFake: false, isOverDiscount: false,
      hotel: { name: '上海外滩示范酒店' }, room: { roomName: '标准大床房' }
    },
    {
      id: 1002, hotelId: 1, roomId: 101, priceType: 'weekend',
      packageName: '标准大床房-周末特惠', packageCode: 'PKG202601002',
      basePrice: 368, originalPrice: 428, discountRatio: 8.6, memberPrice: 348,
      startDate: '2026-01-01', endDate: '2026-12-31', weekDays: '6,7',
      minAdvanceDays: 1, maxAdvanceDays: 30, minNights: 1, maxNights: 15,
      cancelPolicy: 'free_before_24h',
      includedServices: JSON.stringify(['免费WiFi', '双人早餐', '免费停车', '欢迎水果']),
      targetGuestTags: '休闲游客,家庭出游', stockType: 'daily_limit', dailyLimit: 5,
      status: 'active', displayOnHome: true, displayPriority: 20,
      isExclusive: false, isFlashSale: false, isFake: false, isOverDiscount: false,
      hotel: { name: '上海外滩示范酒店' }, room: { roomName: '标准大床房' }
    },
    {
      id: 1003, hotelId: 1, roomId: 103, priceType: 'holiday',
      packageName: '豪华大床房-五一假期', packageCode: 'PKG202605001',
      basePrice: 888, originalPrice: 1088, discountRatio: 8.2, memberPrice: 858,
      startDate: '2026-05-01', endDate: '2026-05-05', weekDays: '1,2,3,4,5,6,7',
      minAdvanceDays: 3, maxAdvanceDays: 30, minNights: 2, maxNights: 5,
      cancelPolicy: 'non_refundable', penaltyPercent: 30,
      includedServices: JSON.stringify(['免费WiFi', '双人早餐', '行政酒廊', '延迟退房', '欢迎水果']),
      targetGuestTags: '家庭出游,情侣度假', stockType: 'limited', totalStock: 20, soldCount: 12,
      status: 'active', displayOnHome: true, displayPriority: 50,
      isExclusive: false, isFlashSale: true, isFake: false, isOverDiscount: false,
      hotel: { name: '上海外滩示范酒店' }, room: { roomName: '豪华大床房' }
    },
    {
      id: 1004, hotelId: 1, roomId: 104, priceType: 'exclusive',
      packageName: '行政套房-VIP专属', packageCode: 'PKG2026VIP001',
      basePrice: 1288, originalPrice: 1688, discountRatio: 7.6, memberPrice: 1188,
      startDate: '2026-01-01', endDate: '2026-03-31', weekDays: '1,2,3,4,5,6,7',
      minAdvanceDays: 1, maxAdvanceDays: 60, minNights: 1, maxNights: 15,
      cancelPolicy: 'free_before_48h',
      includedServices: JSON.stringify(['免费WiFi', '双人早餐', '行政酒廊', '机场接送', '迷你吧', 'SPA优惠券']),
      targetGuestTags: '协议企业,会员专享', stockType: 'limited', totalStock: 10, soldCount: 3,
      status: 'active', displayOnHome: false, displayPriority: 100,
      isExclusive: true, isFlashSale: false, isFake: false, isOverDiscount: false,
      hotel: { name: '上海外滩示范酒店' }, room: { roomName: '行政套房' }
    },
    {
      id: 1005, hotelId: 2, roomId: 201, priceType: 'daily',
      packageName: '商务间-企业协议', packageCode: 'PKG2026CORP001',
      basePrice: 458, originalPrice: 598, discountRatio: 7.7, corporatePrice: 428,
      startDate: '2026-01-01', endDate: '2026-06-30', weekDays: '1,2,3,4,5',
      minAdvanceDays: 0, maxAdvanceDays: 15, minNights: 1, maxNights: 30,
      cancelPolicy: 'flexible',
      includedServices: JSON.stringify(['免费WiFi', '单人早餐', '免费停车', '会议室2小时']),
      targetGuestTags: '协议企业,会展参会', stockType: 'unlimited',
      status: 'active', displayOnHome: false, displayPriority: 30,
      isExclusive: true, isFlashSale: false, isFake: false, isOverDiscount: true,
      hotel: { name: '北京王府井精选酒店' }, room: { roomName: '豪华商务间' }
    },
    {
      id: 1006, hotelId: 1, roomId: 101, priceType: 'daily',
      packageName: '标准大床房-促销价', packageCode: 'PKG2026PROMO001',
      basePrice: 99, originalPrice: 328, discountRatio: 3, memberPrice: 89,
      startDate: '2026-02-01', endDate: '2026-02-08', weekDays: '1,2,3,4,5,6,7',
      minAdvanceDays: 7, maxAdvanceDays: 30, minNights: 2, maxNights: 5,
      cancelPolicy: 'non_refundable', penaltyPercent: 50,
      includedServices: JSON.stringify(['免费WiFi', '单人早餐']),
      targetGuestTags: '新用户专享,休闲游客', stockType: 'limited', totalStock: 50, soldCount: 48,
      status: 'expired', displayOnHome: true, displayPriority: 200,
      isExclusive: false, isFlashSale: true, isFake: true, isOverDiscount: true,
      hotel: { name: '上海外滩示范酒店' }, room: { roomName: '标准大床房' }
    }
  ]
  return mock.filter(m => !activeType.value || m.priceType === activeType.value)
}

const loadPermission = async () => {
  try {
    const res = await checkHotelRoomPricePermission()
    canOps.value = res?.data?.canOps || false
  } catch { canOps.value = true }
}

const loadHotels = async () => {
  try {
    const res = await getHotelList({ pageSize: 200 })
    hotelList.value = res?.data?.list || []
  } catch {
    hotelList.value = [{ id: 1, name: '上海外滩示范酒店' }, { id: 2, name: '北京王府井精选酒店' }]
  }
}

const onHotelChange = async () => {
  roomList.value = []
  searchForm.roomId = null
  if (!searchForm.hotelId) { fetchData(); return }
  try {
    const res = await getHotelRoomList({ hotelId: searchForm.hotelId, status: 'on_sale', pageSize: 200 })
    roomList.value = res?.data?.list || []
  } catch {
    roomList.value = [{ id: 101, roomName: '标准大床房' }, { id: 103, roomName: '豪华大床房' }, { id: 104, roomName: '行政套房' }]
  }
  fetchData()
}

const fetchData = async () => {
  try {
    const params = { ...searchForm, priceType: activeType.value, page: pagination.page, pageSize: pagination.pageSize }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getHotelRoomPriceList(params)
    list.value = res?.data?.list || []
    pagination.total = res?.data?.total || 0
    calcStats(list.value)
  } catch {
    list.value = initMockData()
    pagination.total = list.value.length
    calcStats(list.value)
  }
}

const handleTypeChange = () => {
  pagination.page = 1
  clearSelection()
  fetchData()
}

const resetSearch = () => {
  searchForm.hotelId = null
  searchForm.roomId = null
  searchForm.keyword = ''
  searchForm.status = ''
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

const toggleSelect = (row) => {
  const idx = selectedIds.value.indexOf(row.id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(row.id)
  selectedRows.value = list.value.filter(r => selectedIds.value.includes(r.id))
}

const clearSelection = () => {
  selectedIds.value = []
  selectedRows.value = []
}

const openCreate = () => {
  if (!canOps.value) { ElMessage.warning('权限不足'); return }
  currentEdit.value = null
  editDialogVisible.value = true
}

const openEdit = (row) => {
  if (!canOps.value) { ElMessage.warning('权限不足'); return }
  currentEdit.value = { ...row }
  editDialogVisible.value = true
}

const openDetail = async (row) => {
  try {
    const res = await getHotelRoomPrice(row.id)
    currentDetail.value = res?.data || row
  } catch { currentDetail.value = row }
  detailVisible.value = true
}

const openTrace = (row) => {
  currentTraceId.value = row.id
  traceGlobal.value = false
  traceVisible.value = true
}

const openTraceGlobal = () => {
  currentTraceId.value = null
  traceGlobal.value = true
  traceVisible.value = true
}

const handleEditSuccess = async () => {
  ElMessage.success('操作成功')
  await fetchData()
}

const handleBatchSuccess = async () => {
  clearSelection()
  await fetchData()
}

const handleRowAction = async (cmd, row) => {
  if (!canOps.value) { ElMessage.warning('权限不足'); return }
  if (row.isExclusive && ['on_shelf', 'off_shelf'].includes(cmd) === false) {
    ElMessage.warning('专属特价套餐需专项权限')
    return
  }
  const statusMap = { on_shelf: 'active', off_shelf: 'inactive', expired: 'expired' }
  try {
    await ElMessageBox.prompt('请填写操作原因', '操作确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入操作原因',
      inputValidator: (v) => !!v?.trim() || '请填写操作原因'
    }).then(async ({ value }) => {
      if (['on_shelf', 'off_shelf', 'expired'].includes(cmd)) {
        await changeHotelRoomPriceStatus(row.id, statusMap[cmd], value)
        row.status = statusMap[cmd]
      } else {
        await changeHotelRoomPriceStatus(row.id, row.status, value)
        if (cmd === 'fake_flag') row.isFake = true
        if (cmd === 'over_discount') row.isOverDiscount = true
      }
      refreshId.value = row.id
      ElMessage.success('操作成功')
      await nextTick()
      refreshId.value = null
      await fetchData()
    }).catch(() => {})
  } catch (e) { ElMessage.error(e.message || '操作失败') }
}

onMounted(() => {
  loadPermission()
  loadHotels()
  fetchData()
})
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-price.scss';
</style>
