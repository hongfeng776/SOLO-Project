<template>
  <div class="hotel-room-manage">
    <div class="page-header">
      <div class="header-left">
        <h2>酒店客房资源管控</h2>
        <p class="page-desc">客房资源全生命周期运维：参数校验、状态联动、批量管理、全流程溯源</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="openTraceGlobal">
          <el-icon style="margin-right:4px"><Clock /></el-icon>全流程溯源
        </el-button>
        <el-button type="success" @click="openCreate">
          <el-icon style="margin-right:4px"><Plus /></el-icon>新增客房
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!canOps"
      type="error"
      show-icon
      title="权限不足：当前账号无客房运维权限，请联系管理员分配 admin / hotel_operator / senior_hotel_operator 角色"
      style="margin-bottom:14px"
    />

    <div class="stat-cards">
      <div class="stat-card stat-total">
        <div class="stat-label">客房总数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card stat-onsale">
        <div class="stat-label">在售可订</div>
        <div class="stat-value stat-onsale">{{ stats.onSale }}</div>
      </div>
      <div class="stat-card stat-maintain">
        <div class="stat-label">维护/清洁</div>
        <div class="stat-value stat-maintain">{{ stats.maintain }}</div>
      </div>
      <div class="stat-card stat-locked">
        <div class="stat-label">已锁定预订</div>
        <div class="stat-value stat-locked">{{ stats.locked }}</div>
      </div>
    </div>

    <el-tabs v-model="activeType" class="room-tabs" @tab-change="handleTypeChange">
      <el-tab-pane
        v-for="(item, key) in HotelRoomTypeEnum"
        :key="key"
        :name="key"
      >
        <template #label>
          <span>
            <el-icon style="vertical-align:middle;margin-right:4px"><component :is="item.icon" /></el-icon>
            {{ item.label }}
          </span>
          <el-badge :value="typeCounts[key] || 0" :hidden="!typeCounts[key]" class="tab-badge" />
          <el-tag v-if="item.noBatch" size="small" style="margin-left:6px;background:#fff7e6;color:#fa8c16;border-color:#ffd591">单独运维</el-tag>
        </template>
      </el-tab-pane>
    </el-tabs>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="所属门店">
          <el-select v-model="searchForm.hotelId" placeholder="请选择" clearable filterable style="width:220px" @change="fetchData">
            <el-option v-for="h in hotelList" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="房名/房号/设施" clearable style="width:200px" @clear="fetchData" />
        </el-form-item>
        <el-form-item label="销售状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:140px">
            <el-option v-for="(item, key) in HotelRoomStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护状态">
          <el-select v-model="searchForm.maintainStatus" placeholder="全部" clearable style="width:140px">
            <el-option v-for="(item, key) in HotelRoomMaintainStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <HotelRoomBatchPanel
      :selected-ids="selectedIds"
      :selected-rows="selectedRows"
      :hotel-id="searchForm.hotelId"
      @success="handleBatchSuccess"
      @clear-selection="clearSelection"
    />

    <div class="table-container">
      <el-table
        ref="tableRef"
        :data="list"
        class="room-table"
        height="560"
        border
        stripe
        @selection-change="handleSelectionChange"
        :row-class-name="rowClassName"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="房型名称" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="room-name-cell">
              <el-icon class="room-icon" :style="{ color: HotelRoomTypeEnum[row.roomType]?.color }">
                <component :is="HotelRoomTypeEnum[row.roomType]?.icon" />
              </el-icon>
              <div>
                <div style="font-weight:600;color:#1f2d3d">{{ row.roomName }}</div>
                <div style="font-size:12px;color:#909399">{{ row.roomNo ? `房号: ${row.roomNo} · ` : '' }}楼层: {{ row.floor || '-' }}</div>
              </div>
              <el-tag v-if="row.isFake" size="small" class="tag-fake-room" style="margin-left:6px">虚假</el-tag>
              <el-tag v-if="row.isDuplicate" size="small" class="tag-duplicate-room" style="margin-left:6px">重复</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="房型分类" width="110">
          <template #default="{ row }">
            <el-tag :class="HotelRoomTypeEnum[row.roomType]?.tagClass">{{ HotelRoomTypeEnum[row.roomType]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="销售状态" width="100">
          <template #default="{ row }">
            <el-tag :class="HotelRoomStatusEnum[row.status]?.tagClass">{{ HotelRoomStatusEnum[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="维护状态" width="100">
          <template #default="{ row }">
            <el-tag :class="HotelRoomMaintainStatusEnum[row.maintainStatus]?.tagClass">
              {{ HotelRoomMaintainStatusEnum[row.maintainStatus]?.label }}
              <el-icon v-if="HotelRoomMaintainStatusEnum[row.maintainStatus]?.lockBooking" style="margin-left:3px;vertical-align:middle"><Lock /></el-icon>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数规格" min-width="160">
          <template #default="{ row }">
            <div class="capacity-cell">
              <el-icon><Aim /></el-icon>{{ row.area }}㎡
              <el-icon style="margin-left:10px"><User /></el-icon>{{ row.capacity }}人
              <el-icon style="margin-left:10px"><Bed /></el-icon>{{ HotelRoomBedTypeEnum[row.bedType]?.label || row.bedType }}×{{ row.bedCount }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="基准价" width="120">
          <template #default="{ row }">
            <div class="price-cell">
              ¥{{ row.basePrice }}
              <small>/晚</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100" align="center">
          <template #default="{ row }">
            <span style="color:#52c41a;font-weight:600">{{ row.availableCount }}</span>
            <span style="color:#909399"> / {{ row.totalCount }}</span>
            <div v-if="row.maintainCount > 0" style="font-size:12px;color:#faad14">维护中 {{ row.maintainCount }}</div>
          </template>
        </el-table-column>
        <el-table-column label="早餐/取消" width="140">
          <template #default="{ row }">
            <div style="font-size:12px;color:#606266">
              <div>早餐：{{ HotelRoomBreakfastEnum[row.breakfast]?.label || '-' }}</div>
              <div>取消：{{ (HotelRoomCancelPolicyEnum[row.cancelPolicy]?.label || '').slice(0, 8) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="设施标签" min-width="200">
          <template #default="{ row }">
            <div class="facility-tags">
              <span
                v-for="(f, i) in (parseFacilities(row.facilities).slice(0, 5))"
                :key="i"
                class="facility-tag"
              >{{ f }}</span>
              <el-tooltip v-if="parseFacilities(row.facilities).length > 5" placement="top">
                <template #content>
                  <div>{{ parseFacilities(row.facilities).join('、') }}</div>
                </template>
                <span class="facility-tag">+{{ parseFacilities(row.facilities).length - 5 }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="ops-cell">
              <el-button type="primary" link @click="openDetail(row)">详情</el-button>
              <el-button type="primary" link @click="openTrace(row)">溯源</el-button>
              <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleRowAction(cmd, row)">
                <el-button type="primary" link>更多<el-icon style="margin-left:3px"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="on_shelf" :disabled="row.status === 'on_sale'">上架</el-dropdown-item>
                    <el-dropdown-item command="off_shelf" :disabled="row.status === 'off_sale'">下架</el-dropdown-item>
                    <el-dropdown-item command="maintenance" :disabled="row.maintainStatus === 'maintenance'">标记维护</el-dropdown-item>
                    <el-dropdown-item command="resume" :disabled="row.maintainStatus === 'normal'">恢复正常</el-dropdown-item>
                    <el-dropdown-item command="cleaning" :disabled="row.maintainStatus === 'cleaning'">清洁中</el-dropdown-item>
                    <el-dropdown-item command="closed">停用</el-dropdown-item>
                    <el-dropdown-item command="sold_out" :disabled="row.status === 'sold_out'">标满房</el-dropdown-item>
                    <el-dropdown-item command="restock" :disabled="row.status !== 'sold_out'">恢复库存</el-dropdown-item>
                    <el-dropdown-item command="fake_flag" :divided="true">标记虚假</el-dropdown-item>
                    <el-dropdown-item command="duplicate_flag">标记重复</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div style="padding:14px 10px;text-align:right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <HotelRoomEditDialog
      v-model="editDialogVisible"
      :edit-data="currentEdit"
      @success="handleEditSuccess"
    />

    <HotelRoomTracePanel v-model="traceVisible" :room-id="currentTraceId" :global-mode="traceGlobal" />

    <el-dialog v-model="detailVisible" title="客房详情" width="720px" destroy-on-close>
      <template v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="客房名称">{{ currentDetail.roomName }}</el-descriptions-item>
          <el-descriptions-item label="所属门店">{{ currentDetail.hotel?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="房型分类">
            <el-tag :class="HotelRoomTypeEnum[currentDetail.roomType]?.tagClass">{{ HotelRoomTypeEnum[currentDetail.roomType]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="房号/楼层">{{ currentDetail.roomNo || '-' }} / {{ currentDetail.floor || '-' }}</el-descriptions-item>
          <el-descriptions-item label="销售状态">
            <el-tag :class="HotelRoomStatusEnum[currentDetail.status]?.tagClass">{{ HotelRoomStatusEnum[currentDetail.status]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维护状态">
            <el-tag :class="HotelRoomMaintainStatusEnum[currentDetail.maintainStatus]?.tagClass">{{ HotelRoomMaintainStatusEnum[currentDetail.maintainStatus]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="房型参数">{{ currentDetail.area }}㎡ · {{ currentDetail.capacity }}人 · {{ HotelRoomBedTypeEnum[currentDetail.bedType]?.label }}×{{ currentDetail.bedCount }}</el-descriptions-item>
          <el-descriptions-item label="可预订状态">
            <el-tag v-if="currentDetail.isBookable" type="success">可预订</el-tag>
            <el-tag v-else type="danger">已锁定预订</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="基准价" :span="2">
            <span style="color:#f5222d;font-weight:600;font-size:18px">¥{{ currentDetail.basePrice }}</span>
            <span v-if="currentDetail.weekendPrice" style="margin-left:12px;color:#909399">周末价 ¥{{ currentDetail.weekendPrice }}</span>
            <span v-if="currentDetail.holidayPrice" style="margin-left:12px;color:#909399">节假日 ¥{{ currentDetail.holidayPrice }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="早餐/取消" :span="2">
            {{ HotelRoomBreakfastEnum[currentDetail.breakfast]?.label }} · {{ HotelRoomCancelPolicyEnum[currentDetail.cancelPolicy]?.label }}
          </el-descriptions-item>
          <el-descriptions-item label="库存信息" :span="2">
            总房量 {{ currentDetail.totalCount }} · 可售 {{ currentDetail.availableCount }}
            <span v-if="currentDetail.maintainCount > 0" style="color:#faad14"> · 维护中 {{ currentDetail.maintainCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="适配人群">{{ (currentDetail.targetGuest || '').split(',').filter(Boolean).join('、') || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设施展示">{{ currentDetail.facilityText || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设施标签" :span="2">
            <div class="facility-tags">
              <span v-for="(f, i) in parseFacilities(currentDetail.facilities)" :key="i" class="facility-tag">{{ f }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="房型介绍" :span="2">{{ currentDetail.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="风控标记" :span="2">
            <el-tag v-if="currentDetail.isFake" class="tag-fake-room" style="margin-right:6px">虚假房型</el-tag>
            <el-tag v-if="currentDetail.isDuplicate" class="tag-duplicate-room">重复房型</el-tag>
            <span v-if="!currentDetail.isFake && !currentDetail.isDuplicate" style="color:#52c41a">正常</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentDetail.createdBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新人">{{ currentDetail.updatedBy || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <div v-if="statusToastVisible" :class="['status-fade-toast', 'toast-' + statusToastType]">{{ statusToastText }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Clock, Lock, Aim, User, Bed, ArrowDown
} from '@element-plus/icons-vue'
import {
  HotelRoomTypeEnum, HotelRoomStatusEnum, HotelRoomMaintainStatusEnum,
  HotelRoomBedTypeEnum, HotelRoomBreakfastEnum, HotelRoomCancelPolicyEnum
} from '@/utils/enums'
import {
  getHotelRoomList, getHotelRoom, checkHotelRoomPermission,
  changeHotelRoomMaintainStatus, getHotelList
} from '@/api/hotel'
import HotelRoomEditDialog from '@/components/Hotel/HotelRoomEditDialog.vue'
import HotelRoomBatchPanel from '@/components/Hotel/HotelRoomBatchPanel.vue'
import HotelRoomTracePanel from '@/components/Hotel/HotelRoomTracePanel.vue'

const list = ref([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const activeType = ref('standard')
const searchForm = reactive({ hotelId: null, keyword: '', status: '', maintainStatus: '' })
const hotelList = ref([])
const canOps = ref(true)
const selectedIds = ref([])
const selectedRows = ref([])
const tableRef = ref(null)
const refreshId = ref(null)

const typeCounts = reactive({})
const stats = reactive({ total: 0, onSale: 0, maintain: 0, locked: 0 })

const editDialogVisible = ref(false)
const currentEdit = ref(null)
const detailVisible = ref(false)
const currentDetail = ref(null)
const traceVisible = ref(false)
const currentTraceId = ref(null)
const traceGlobal = ref(false)

const statusToastVisible = ref(false)
const statusToastType = ref('success')
const statusToastText = ref('')

const parseFacilities = (f) => {
  if (!f) return []
  if (typeof f === 'string') {
    try { return JSON.parse(f) } catch { return [f] }
  }
  return Array.isArray(f) ? f : []
}

const rowClassName = ({ row }) => {
  if (selectedIds.value.includes(row.id)) return `row-selected partial-refresh-${row.id === refreshId.value ? 'row partial-refresh' : ''}`
  if (row.id === refreshId.value) return 'partial-refresh'
  return ''
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

const showToast = (text, type = 'success') => {
  statusToastText.value = text
  statusToastType.value = type
  statusToastVisible.value = true
  setTimeout(() => { statusToastVisible.value = false }, 2200)
}

const loadPermission = async () => {
  try {
    const res = await checkHotelRoomPermission()
    canOps.value = res?.data?.canOps || false
  } catch { canOps.value = true }
}

const loadHotels = async () => {
  try {
    const res = await getHotelList({ pageSize: 200 })
    hotelList.value = res?.data?.list || []
  } catch {
    hotelList.value = [
      { id: 1, name: '上海外滩示范酒店' },
      { id: 2, name: '北京王府井精选酒店' }
    ]
  }
}

const calcStats = (data) => {
  stats.total = data.length || pagination.total
  stats.onSale = data.filter(r => r.status === 'on_sale' && r.maintainStatus === 'normal').length
  stats.maintain = data.filter(r => ['maintenance', 'cleaning'].includes(r.maintainStatus)).length
  stats.locked = data.filter(r => r.isBookable === false).length
  for (const k of Object.keys(HotelRoomTypeEnum)) typeCounts[k] = 0
  data.forEach(r => { if (typeCounts[r.roomType] !== undefined) typeCounts[r.roomType]++ })
}

const initMockData = () => {
  const mock = [
    { id: 101, hotelId: 1, roomType: 'standard', roomName: '标准大床房', roomNo: '301-308', floor: '3F', area: 25, capacity: 2, bedType: 'double', bedCount: 1, basePrice: 328, weekendPrice: 388, holidayPrice: 428, extraBedPrice: 80, breakfast: 'double', cancelPolicy: 'free_before_24h', totalCount: 8, availableCount: 6, maintainCount: 2, status: 'on_sale', maintainStatus: 'normal', isBookable: true, displayOnHome: true, displayOrder: 0, facilities: JSON.stringify(['WiFi','空调','独立卫生间','淋浴','电视','书桌']), facilityText: '免费WiFi · 高清电视 · 商务书桌', targetGuest: '商务出行,单人出行', description: '宽敞舒适，适合商务差旅' },
    { id: 102, hotelId: 1, roomType: 'standard', roomName: '标准双床房', roomNo: '401-410', floor: '4F', area: 28, capacity: 2, bedType: 'twin', bedCount: 2, basePrice: 348, weekendPrice: 408, holidayPrice: 448, extraBedPrice: 80, breakfast: 'double', cancelPolicy: 'free_before_24h', totalCount: 10, availableCount: 8, maintainCount: 2, status: 'on_sale', maintainStatus: 'cleaning', isBookable: false, displayOnHome: true, displayOrder: 1, facilities: JSON.stringify(['WiFi','空调','独立卫生间','双床','电视']), facilityText: '双床配置 · 适合朋友同行', targetGuest: '朋友聚会,商务出行', description: '标准双床，适合朋友同行或双人差旅' },
    { id: 103, hotelId: 1, roomType: 'deluxe', roomName: '豪华大床房', roomNo: '501-506', floor: '5F', area: 40, capacity: 2, maxCapacity: 3, bedType: 'king', bedCount: 1, basePrice: 688, weekendPrice: 788, holidayPrice: 888, extraBedPrice: 150, breakfast: 'double', cancelPolicy: 'free_before_48h', totalCount: 6, availableCount: 6, maintainCount: 0, status: 'on_sale', maintainStatus: 'normal', isBookable: true, displayOnHome: true, displayOrder: 2, facilities: JSON.stringify(['WiFi','空调','独立卫生间','浴缸','特大床','迷你吧','保险箱','沙发']), facilityText: '特大床 · 浴缸 · 迷你吧 · 保险箱', targetGuest: '情侣度假,商务出行', description: '豪华配置，配有独立浴缸和迷你吧' },
    { id: 104, hotelId: 1, roomType: 'suite', roomName: '行政套房', roomNo: '801', floor: '8F', area: 80, capacity: 2, maxCapacity: 4, bedType: 'king', bedCount: 1, basePrice: 1688, weekendPrice: 1888, holidayPrice: 2288, extraBedPrice: 280, breakfast: 'double', cancelPolicy: 'flexible', totalCount: 2, availableCount: 1, maintainCount: 1, status: 'on_sale', maintainStatus: 'maintenance', isBookable: false, displayOnHome: true, displayOrder: 5, facilities: JSON.stringify(['WiFi','空调','独立客厅','独立卫生间','浴缸','特大床','迷你吧','保险箱','海景','沙发','书桌']), facilityText: '独立客厅 · 海景 · 1.8m特大床', targetGuest: '商务出行,情侣度假', description: '高端行政套房，独立会客厅及全海景视角' },
    { id: 105, hotelId: 1, roomType: 'featured', roomName: '亲子主题房', roomNo: '601-602', floor: '6F', area: 45, capacity: 3, maxCapacity: 4, bedType: 'king', bedCount: 1, basePrice: 888, weekendPrice: 988, holidayPrice: 1188, extraBedPrice: 150, breakfast: 'extra', cancelPolicy: 'free_before_48h', totalCount: 2, availableCount: 0, maintainCount: 0, status: 'sold_out', maintainStatus: 'normal', isBookable: false, displayOnHome: true, displayOrder: 4, facilities: JSON.stringify(['WiFi','空调','儿童设施','独立卫生间','特大床','沙发','浴缸']), facilityText: '儿童主题装饰 · 专属儿童设施', targetGuest: '亲子出行,家庭出游', description: '主题房布置，儿童设施齐全' },
    { id: 106, hotelId: 2, roomType: 'deluxe', roomName: '豪华商务间', roomNo: '701-710', floor: '7F', area: 36, capacity: 2, bedType: 'king', bedCount: 1, basePrice: 598, weekendPrice: 698, holidayPrice: 768, extraBedPrice: 120, breakfast: 'single', cancelPolicy: 'free_before_24h', totalCount: 10, availableCount: 9, maintainCount: 1, status: 'off_sale', maintainStatus: 'normal', isBookable: false, displayOnHome: false, displayOrder: 3, facilities: JSON.stringify(['WiFi','空调','独立卫生间','特大床','书桌','保险箱','电视']), facilityText: '商务大床 · 独立办公区', targetGuest: '商务出行', description: '专为商务出行人士打造' }
  ]
  return mock.filter(m => !activeType.value || m.roomType === activeType.value)
}

const fetchData = async () => {
  try {
    const res = await getHotelRoomList({ ...searchForm, roomType: activeType.value, page: pagination.page, pageSize: pagination.pageSize })
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
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.maintainStatus = ''
  pagination.page = 1
  fetchData()
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
    const res = await getHotelRoom(row.id)
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
  showToast('客房数据已更新', 'success')
  await fetchData()
}

const handleBatchSuccess = async () => {
  showToast('批量操作执行完成', 'success')
  clearSelection()
  await fetchData()
}

const handleRowAction = async (cmd, row) => {
  if (!canOps.value) { ElMessage.warning('权限不足'); return }
  if (row.roomType === 'suite' && ['on_shelf', 'off_shelf', 'maintenance', 'cleaning', 'closed', 'sold_out'].includes(cmd)) {
    ElMessage.warning('高端套房需单独运维，请使用编辑功能')
    return
  }
  try {
    if (['on_shelf', 'off_shelf', 'sold_out', 'restock', 'fake_flag', 'duplicate_flag'].includes(cmd)) {
      await ElMessageBox.prompt('请填写操作原因', `操作确认：${cmd}`, {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入操作原因',
        inputValidator: (v) => !!v?.trim() || '请填写操作原因'
      }).then(async ({ value }) => {
        const statusMap = { on_shelf: 'on_sale', off_shelf: 'off_sale', sold_out: 'sold_out', restock: 'on_sale' }
        if (statusMap[cmd]) {
          await changeHotelRoomMaintainStatus(row.id, row.maintainStatus, value)
          row.status = statusMap[cmd]
          if (cmd === 'restock') row.availableCount = Math.min(row.totalCount, (row.availableCount || 0) + 1)
        } else {
          await changeHotelRoomMaintainStatus(row.id, row.maintainStatus, value)
          if (cmd === 'fake_flag') row.isFake = true
          if (cmd === 'duplicate_flag') row.isDuplicate = true
        }
        refreshId.value = row.id
        showToast('操作成功', 'success')
        await nextTick()
        refreshId.value = null
        await fetchData()
      }).catch(() => {})
    } else {
      const map = { maintenance: 'maintenance', resume: 'normal', cleaning: 'cleaning', closed: 'closed' }
      await ElMessageBox.prompt('请填写操作原因', '状态变更确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入操作原因',
        inputValidator: (v) => !!v?.trim() || '请填写操作原因'
      }).then(async ({ value }) => {
        await changeHotelRoomMaintainStatus(row.id, map[cmd], value)
        refreshId.value = row.id
        showToast(`已变更为 ${HotelRoomMaintainStatusEnum[map[cmd]]?.label}`, HotelRoomMaintainStatusEnum[map[cmd]]?.lockBooking ? 'danger' : 'success')
        await nextTick()
        refreshId.value = null
        await fetchData()
      }).catch(() => {})
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(() => {
  loadPermission()
  loadHotels()
  fetchData()
})
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-room.scss';
</style>
