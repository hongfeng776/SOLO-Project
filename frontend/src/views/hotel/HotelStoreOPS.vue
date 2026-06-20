<template>
  <div class="hotel-store-ops">
    <div class="page-header">
      <div>
        <h2>酒店门店资源运维</h2>
        <div style="color: #909399; font-size: 13px; margin-top: 4px;">
          分类型精细化管理酒店门店资源，确保合规运营与展示权重
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="查看全局操作记录">
          <el-button :icon="Clock" @click="openAllTrace" v-ripple>
            全流程溯源
          </el-button>
        </el-tooltip>
        <el-tooltip :content="canAdd ? '新增门店' : '无权限'">
          <el-button
            type="primary"
            :icon="Plus"
            :disabled="!canAdd"
            @click="handleAdd"
            v-ripple
          >
            新增门店
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <el-alert
      v-if="!hasPermission"
      type="error"
      show-icon
      class="permission-alert"
      title="权限不足"
      description="您当前角色没有访问酒店门店资源运维模块的权限，请联系管理员开通。"
      :closable="false"
    />

    <template v-else>
      <div class="tab-section">
        <el-tabs v-model="activeType" type="card" @tab-change="onTypeChange">
          <el-tab-pane
            v-for="item in typeTabList"
            :key="item.value"
            :label="item.label"
            :name="item.value"
          >
            <template #label>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
              <el-badge
                v-if="getTypeCount(item.value) > 0"
                :value="getTypeCount(item.value)"
                class="tab-badge"
                :style="{ background: item.color }"
              />
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="stats-overview">
        <div class="stat-card stat-total">
          <div class="stat-label">门店总数</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-sub">当前分类</div>
        </div>
        <div class="stat-card stat-compliant">
          <div class="stat-label">资质合规</div>
          <div class="stat-value">{{ stats.compliant }}</div>
          <div class="stat-sub">合规门店数量</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-label">预警门店</div>
          <div class="stat-value">{{ stats.warning }}</div>
          <div class="stat-sub">资质过期/待审核</div>
        </div>
        <div class="stat-card stat-frozen">
          <div class="stat-label">订单冻结</div>
          <div class="stat-value">{{ stats.frozen }}</div>
          <div class="stat-sub">停业/整改/关闭</div>
        </div>
      </div>

      <div class="search-form">
        <el-form :inline="true" :model="searchForm" @submit.prevent size="default">
          <el-form-item label="门店名称">
            <el-input
              v-model="searchForm.name"
              placeholder="门店名称/营业执照号"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="城市">
            <el-input
              v-model="searchForm.city"
              placeholder="所在城市"
              clearable
              style="width: 160px"
            />
          </el-form-item>
          <el-form-item label="星级">
            <el-select v-model="searchForm.star" placeholder="全部星级" clearable style="width: 140px">
              <el-option label="一星级" :value="1" />
              <el-option label="二星级" :value="2" />
              <el-option label="三星级" :value="3" />
              <el-option label="四星级" :value="4" />
              <el-option label="五星级" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="经营状态">
            <el-select v-model="searchForm.businessStatus" placeholder="全部状态" clearable style="width: 140px">
              <el-option
                v-for="item in Object.values(HotelBusinessStatusEnum)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="资质状态">
            <el-select v-model="searchForm.qualificationStatus" placeholder="全部" clearable style="width: 140px">
              <el-option
                v-for="item in Object.values(HotelQualificationStatusEnum)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" v-ripple>
              搜索
            </el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <HotelStoreBatchToolbar
        :selectedIds="Array.from(selectedIds)"
        :selectedStores="selectedStores"
        @clear="clearSelection"
        @success="onBatchSuccess"
      />

      <div class="store-list-area" v-loading="loading">
        <div class="store-card-grid" v-if="tableData.length > 0">
          <div
            v-for="store in tableData"
            :key="store.id"
            class="store-card"
            :class="{
              selected: selectedIds.has(store.id),
              'partial-refresh': refreshId === store.id
            }"
            @dblclick="openDetail(store)"
          >
            <div class="card-checkbox" @click.stop="toggleSelect(store)">
              <el-checkbox v-model="store._checked" :checked="selectedIds.has(store.id)" />
            </div>

            <div class="card-header">
              <el-tooltip :content="store.name" placement="top">
                <div class="store-name">{{ store.name }}</div>
              </el-tooltip>
              <div class="store-id">ID: {{ store.id }}</div>
            </div>

            <div class="card-tags">
              <el-tag
                size="small"
                class="status-tag"
                :class="getHotelTypeTagClass(store.hotelType)"
              >
                {{ getHotelTypeLabel(store.hotelType) }}
              </el-tag>
              <el-tag
                size="small"
                class="status-tag"
                :class="getBusinessStatusTagClass(store.businessStatus)"
              >
                {{ getBusinessStatusLabel(store.businessStatus) }}
              </el-tag>
              <el-tag
                size="small"
                class="status-tag"
                :class="getQualStatusTagClass(store.qualificationStatus)"
              >
                {{ getQualStatusLabel(store.qualificationStatus) }}
              </el-tag>
              <el-tag
                v-if="store.status === 1"
                size="small"
                type="success"
                effect="plain"
              >
                已上架
              </el-tag>
              <el-tag v-else size="small" type="info" effect="plain">已下架</el-tag>
              <el-tag v-if="store.isFake" size="small" class="status-tag tag-fake">
                <el-icon><WarningFilled /></el-icon>
                虚假门店
              </el-tag>
              <el-tag v-if="store.isDuplicate" size="small" class="status-tag tag-duplicate">
                <el-icon><DocumentCopy /></el-icon>
                重复门店
              </el-tag>
              <el-tag
                v-if="starText(store.star)"
                size="small"
                effect="dark"
                color="#faad14"
              >
                {{ starText(store.star) }}
              </el-tag>
            </div>

            <div class="card-info">
              <div class="info-row">
                <span class="info-label">位置：</span>
                <el-tooltip
                  :content="`${store.country} ${store.city} ${store.address}`"
                  placement="top"
                >
                  <span class="info-value">
                    {{ store.country }} {{ store.city }} {{ store.address }}
                  </span>
                </el-tooltip>
              </div>
              <div class="info-row">
                <span class="info-label">价格：</span>
                <span class="info-value" style="color: #ff4d4f; font-weight: 500;">
                  ¥{{ Number(store.price || 0).toFixed(0) }} 起
                </span>
                <span style="color: #909399; margin-left: 12px;">
                  共{{ store.rooms || 0 }}间 / 可用{{ store.availableRooms || 0 }}间
                </span>
              </div>
              <div class="info-row" v-if="store.phone || store.email">
                <span class="info-label">联系：</span>
                <span class="info-value">
                  {{ store.phone ? `📞 ${store.phone}` : '' }}
                  {{ store.phone && store.email ? '  /  ' : '' }}
                  {{ store.email ? `✉️ ${store.email}` : '' }}
                </span>
              </div>
              <div class="info-row" v-if="store.merchant">
                <span class="info-label">商家：</span>
                <span class="info-value">{{ store.merchant.name }}</span>
              </div>
              <div class="info-row" v-if="store.orderFreezeFlag || ['suspended','rectification','closed'].includes(store.businessStatus)">
                <span class="info-label">订单：</span>
                <span class="info-value" style="color: #ff4d4f; font-weight: 500;">
                  <el-icon><Lock /></el-icon>
                  预订功能已冻结
                </span>
              </div>
            </div>

            <div class="card-footer">
              <div class="weight-display">
                <span class="weight-label">展示权重</span>
                <div class="weight-bar">
                  <div
                    class="weight-fill"
                    :style="{ width: (store.displayWeight || 0) + '%' }"
                  />
                </div>
                <span class="weight-value">{{ store.displayWeight || 0 }}</span>
              </div>

              <div class="card-actions">
                <el-tooltip content="查看详情（双击卡片也可展开）">
                  <el-button link size="small" type="primary" :icon="View" @click.stop="openDetail(store)" />
                </el-tooltip>
                <el-tooltip content="溯源记录">
                  <el-button link size="small" type="primary" :icon="Clock" @click.stop="openTrace(store)" />
                </el-tooltip>
                <el-tooltip content="编辑信息">
                  <el-button link size="small" :icon="Edit" @click.stop="handleEdit(store)" />
                </el-tooltip>
                <el-dropdown trigger="click" @command="(cmd) => onStatusCommand(cmd, store)" @click.stop>
                  <el-button link size="small" type="primary">
                    更多<el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        command="on_shelf"
                        :disabled="store.businessStatus !== 'operating' || store.qualificationStatus === 'invalid'"
                      >
                        <el-icon><Upload /></el-icon>
                        上架门店
                      </el-dropdown-item>
                      <el-dropdown-item command="suspend" :disabled="store.businessStatus === 'suspended'">
                        <el-icon><Warning /></el-icon>
                        停业处理
                      </el-dropdown-item>
                      <el-dropdown-item command="rectification" :disabled="store.businessStatus === 'rectification'">
                        <el-icon><WarningFilled /></el-icon>
                        标记整改
                      </el-dropdown-item>
                      <el-dropdown-item command="off_shelf" :disabled="store.businessStatus === 'closed'">
                        <el-icon><Download /></el-icon>
                        下架关闭
                      </el-dropdown-item>
                      <el-dropdown-item command="resume_operation" :disabled="store.businessStatus === 'operating'">
                        <el-icon><CircleCheck /></el-icon>
                        恢复营业
                      </el-dropdown-item>
                      <el-dropdown-item divided command="verify_pass">
                        <el-icon><Stamp /></el-icon>
                        标记资质合规
                      </el-dropdown-item>
                      <el-dropdown-item command="verify_invalid">
                        <el-icon><CircleCloseFilled /></el-icon>
                        标记资质无效
                      </el-dropdown-item>
                      <el-dropdown-item command="mark_fake">
                        <el-icon><WarningFilled /></el-icon>
                        标记虚假门店
                      </el-dropdown-item>
                      <el-dropdown-item command="mark_duplicate">
                        <el-icon><DocumentCopy /></el-icon>
                        标记重复门店
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else-if="!loading" description="暂无门店数据，点击右上角新增门店" />

        <div class="pagination-container" style="margin-top: 20px; text-align: right;">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[8, 12, 24, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchData"
            @current-change="fetchData"
          />
        </div>
      </div>
    </template>

    <HotelStoreEditDialog
      v-model="editDialog.visible"
      :hotelId="editDialog.id"
      :defaultType="activeType"
      @success="onEditSuccess"
    />

    <HotelStoreTracePanel
      v-model="tracePanel.visible"
      :hotelId="tracePanel.id"
      :hotelName="tracePanel.name"
    />

    <el-dialog
      v-model="detailDialog.visible"
      :title="`门店详情 - ${detailDialog.store?.name || ''}`"
      width="880px"
      class="store-detail-dialog"
      append-to-body
      destroy-on-close
    >
      <template v-if="detailDialog.store">
        <div class="detail-section">
          <div class="section-title">
            <el-icon class="title-icon"><OfficeBuilding /></el-icon>
            基础信息
            <el-tag
              v-if="detailDialog.store.status === 1"
              style="margin-left: auto;"
              size="small"
              type="success"
              effect="dark"
            >
              已上架 / {{ getBusinessStatusLabel(detailDialog.store.businessStatus) }}
            </el-tag>
            <el-tag
              v-else
              style="margin-left: auto;"
              size="small"
              type="info"
              effect="dark"
            >
              已下架 / {{ getBusinessStatusLabel(detailDialog.store.businessStatus) }}
            </el-tag>
          </div>
          <div class="info-grid">
            <div class="info-item"><span class="item-label">门店ID</span><span class="item-value">{{ detailDialog.store.id }}</span></div>
            <div class="info-item"><span class="item-label">酒店类型</span><span class="item-value">{{ getHotelTypeLabel(detailDialog.store.hotelType) }}</span></div>
            <div class="info-item"><span class="item-label">所属国家</span><span class="item-value">{{ detailDialog.store.country }}</span></div>
            <div class="info-item"><span class="item-label">所在城市</span><span class="item-value">{{ detailDialog.store.city }}</span></div>
            <div class="info-item" style="grid-column: span 2;"><span class="item-label">详细地址</span><span class="item-value">{{ detailDialog.store.address }}</span></div>
            <div class="info-item"><span class="item-label">星级</span><span class="item-value">{{ starText(detailDialog.store.star) || '未评级' }}</span></div>
            <div class="info-item"><span class="item-label">评级类型</span><span class="item-value">{{ getStarLevelLabel(detailDialog.store.starLevel) }}</span></div>
            <div class="info-item"><span class="item-label">起步价格</span><span class="item-value" style="color: #ff4d4f; font-weight: 600;">¥{{ Number(detailDialog.store.price || 0).toFixed(2) }}</span></div>
            <div class="info-item"><span class="item-label">展示权重</span><span class="item-value" style="color: #1890ff; font-weight: 600;">{{ detailDialog.store.displayWeight || 0 }}</span></div>
            <div class="info-item"><span class="item-label">总房间数</span><span class="item-value">{{ detailDialog.store.rooms || 0 }} 间</span></div>
            <div class="info-item"><span class="item-label">可用房间</span><span class="item-value">{{ detailDialog.store.availableRooms || 0 }} 间</span></div>
            <div class="info-item" style="grid-column: span 2;"><span class="item-label">客房适配</span><span class="item-value">{{ detailDialog.store.roomTypeRange || '（未设置）' }}</span></div>
            <div class="info-item"><span class="item-label">联系电话</span>
              <span class="item-value">
                <el-tooltip :content="detailDialog.store.phone" placement="top"><a>{{ detailDialog.store.phone }}</a></el-tooltip>
              </span>
            </div>
            <div class="info-item"><span class="item-label">联系邮箱</span><span class="item-value">{{ detailDialog.store.email || '（未设置）' }}</span></div>
            <div class="info-item"><span class="item-label">入住时间</span><span class="item-value">{{ detailDialog.store.checkInTime }}</span></div>
            <div class="info-item"><span class="item-label">退房时间</span><span class="item-value">{{ detailDialog.store.checkOutTime }}</span></div>
            <div class="info-item" style="grid-column: span 2;"><span class="item-label">商家信息</span><span class="item-value">{{ detailDialog.store.merchant?.name || '（未绑定）' }}</span></div>
          </div>
        </div>

        <div class="detail-section" v-if="detailExpanded">
          <Transition name="detail-expand">
            <div v-show="detailExpanded">
              <div class="section-title">
                <el-icon class="title-icon"><Document /></el-icon>
                酒店描述
              </div>
              <div style="font-size: 13px; line-height: 1.8; color: #606266; white-space: pre-wrap;">
                {{ detailDialog.store.description || '（暂无描述）' }}
              </div>

              <div class="section-title" style="margin-top: 24px;">
                <el-icon class="title-icon"><Stamp /></el-icon>
                经营资质详情
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="item-label">营业执照号</span>
                  <span class="item-value">
                    {{ detailDialog.store.businessLicenseNo || '（未填）' }}
                    <span v-if="isExpired(detailDialog.store.businessLicenseExpire)" class="danger-text"> ⚠ 已过期</span>
                    <span v-else-if="isExpiringSoon(detailDialog.store.businessLicenseExpire)" class="warn-text"> 即将过期</span>
                  </span>
                </div>
                <div class="info-item"><span class="item-label">有效期至</span><span class="item-value">{{ formatDate(detailDialog.store.businessLicenseExpire) }}</span></div>
                <div class="info-item">
                  <span class="item-label">特种许可证</span>
                  <span class="item-value">
                    {{ detailDialog.store.specialLicenseNo || '（未填）' }}
                    <span v-if="isExpired(detailDialog.store.specialLicenseExpire)" class="danger-text"> ⚠ 已过期</span>
                  </span>
                </div>
                <div class="info-item"><span class="item-label">有效期至</span><span class="item-value">{{ formatDate(detailDialog.store.specialLicenseExpire) }}</span></div>
                <div class="info-item">
                  <span class="item-label">卫生许可证</span>
                  <span class="item-value">
                    {{ detailDialog.store.hygieneLicenseNo || '（未填）' }}
                    <span v-if="isExpired(detailDialog.store.hygieneLicenseExpire)" class="danger-text"> ⚠ 已过期</span>
                  </span>
                </div>
                <div class="info-item"><span class="item-label">有效期至</span><span class="item-value">{{ formatDate(detailDialog.store.hygieneLicenseExpire) }}</span></div>
                <div class="info-item">
                  <span class="item-label">消防合格证</span>
                  <span class="item-value">
                    {{ detailDialog.store.fireSafetyLicenseNo || '（未填）' }}
                    <span v-if="isExpired(detailDialog.store.fireSafetyLicenseExpire)" class="danger-text"> ⚠ 已过期</span>
                  </span>
                </div>
                <div class="info-item"><span class="item-label">有效期至</span><span class="item-value">{{ formatDate(detailDialog.store.fireSafetyLicenseExpire) }}</span></div>
                <template v-if="detailDialog.store.hotelType === 'overseas'">
                  <div class="info-item">
                    <span class="item-label">跨境许可证</span>
                    <span class="item-value">
                      {{ detailDialog.store.crossBorderLicense || '（未填）' }}
                      <span v-if="isExpired(detailDialog.store.crossBorderLicenseExpire)" class="danger-text"> ⚠ 已过期</span>
                    </span>
                  </div>
                  <div class="info-item"><span class="item-label">有效期至</span><span class="item-value">{{ formatDate(detailDialog.store.crossBorderLicenseExpire) }}</span></div>
                </template>
                <div class="info-item"><span class="item-label">资质状态</span><span class="item-value" :class="getQualStatusClass(detailDialog.store.qualificationStatus)">{{ getQualStatusLabel(detailDialog.store.qualificationStatus) }}</span></div>
                <div class="info-item"><span class="item-label">最后审核</span><span class="item-value">{{ detailDialog.store.qualificationAuditor || '（未审核）' }} / {{ formatDate(detailDialog.store.qualificationAuditTime) }}</span></div>
              </div>

              <div class="section-title" style="margin-top: 24px;">
                <el-icon class="title-icon"><DataLine /></el-icon>
                操作人信息
              </div>
              <div class="info-grid">
                <div class="info-item"><span class="item-label">创建人</span><span class="item-value">{{ detailDialog.store.createdBy || '（未知）' }}</span></div>
                <div class="info-item"><span class="item-label">创建时间</span><span class="item-value">{{ formatDate(detailDialog.store.createdAt) }}</span></div>
                <div class="info-item"><span class="item-label">最后更新人</span><span class="item-value">{{ detailDialog.store.updatedBy || '（未知）' }}</span></div>
                <div class="info-item"><span class="item-label">更新时间</span><span class="item-value">{{ formatDate(detailDialog.store.updatedAt) }}</span></div>
              </div>

              <div class="section-title" style="margin-top: 24px;" v-if="detailDialog.store.isFake || detailDialog.store.isDuplicate">
                <el-icon class="title-icon" style="color: #f5222d;"><WarningFilled /></el-icon>
                风控标记
              </div>
              <div class="info-grid" v-if="detailDialog.store.isFake || detailDialog.store.isDuplicate">
                <div class="info-item" v-if="detailDialog.store.isFake"><span class="item-label">虚假门店</span><span class="item-value danger-text">⚠ 标记为虚假门店</span></div>
                <div class="info-item" v-if="detailDialog.store.isDuplicate"><span class="item-label">重复门店</span><span class="item-value danger-text">⚠ 标记为重复门店</span></div>
              </div>
            </div>
          </Transition>
        </div>
      </template>
      <template #footer>
        <el-button v-if="!detailExpanded" :icon="ArrowDown" @click="detailExpanded = !detailExpanded">展开完整信息</el-button>
        <el-button v-else :icon="ArrowUp" @click="detailExpanded = !detailExpanded">收起详情</el-button>
        <el-button :icon="Clock" @click="openTrace(detailDialog.store)">查看溯源</el-button>
        <el-button :icon="Edit" type="primary" @click="handleEdit(detailDialog.store); detailDialog.visible = false">编辑门店</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  View,
  Edit,
  ArrowDown,
  ArrowUp,
  Clock,
  Upload,
  Download,
  Warning,
  WarningFilled,
  CircleCheck,
  CircleCloseFilled,
  Stamp,
  DocumentCopy,
  Lock,
  OfficeBuilding,
  Document,
  DataLine,
  Global,
  House,
  MagicStick
} from '@element-plus/icons-vue'
import vRipple from '@/utils/ripple'
import '@/styles/hotel-store.scss'

import {
  HotelTypeEnum,
  HotelBusinessStatusEnum,
  HotelQualificationStatusEnum,
  HotelStarLevelEnum
} from '@/utils/enums'

import {
  getHotelList,
  changeHotelStatus,
  checkHotelPermission,
  verifyHotel
} from '@/api/hotel'

import HotelStoreEditDialog from '@/components/Hotel/HotelStoreEditDialog.vue'
import HotelStoreBatchToolbar from '@/components/Hotel/HotelStoreBatchToolbar.vue'
import HotelStoreTracePanel from '@/components/Hotel/HotelStoreTracePanel.vue'

const typeTabList = [
  { value: 'domestic', label: '国内酒店', icon: OfficeBuilding, color: '#1890ff' },
  { value: 'overseas', label: '海外酒店', icon: Global, color: '#722ed1' },
  { value: 'apartment', label: '民宿公寓', icon: House, color: '#fa541c' },
  { value: 'featured', label: '特色酒店', icon: MagicStick, color: '#13c2c2' }
]

const hasPermission = ref(false)
const canAdd = ref(false)
const canCrossBorder = ref(false)
const canAudit = ref(false)
const loading = ref(false)
const activeType = ref('domestic')
const refreshId = ref(null)
const detailExpanded = ref(false)

const searchForm = reactive({
  name: '',
  city: '',
  star: null,
  businessStatus: '',
  qualificationStatus: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

const tableData = ref([])
const selectedIds = ref(new Set())
const selectedStores = computed(() =>
  tableData.value.filter(s => selectedIds.value.has(s.id))
)

const stats = reactive({
  total: 0,
  compliant: 0,
  warning: 0,
  frozen: 0
})

const editDialog = reactive({ visible: false, id: null })
const tracePanel = reactive({ visible: false, id: null, name: '' })
const detailDialog = reactive({ visible: false, store: null })

const getHotelTypeLabel = (t) => HotelTypeEnum[t]?.label || '未知'
const getHotelTypeTagClass = (t) => HotelTypeEnum[t]?.tagClass || ''
const getBusinessStatusLabel = (t) => HotelBusinessStatusEnum[t]?.label || t
const getBusinessStatusTagClass = (t) => HotelBusinessStatusEnum[t]?.tagClass || ''
const getQualStatusLabel = (t) => HotelQualificationStatusEnum[t]?.label || t
const getQualStatusTagClass = (t) => HotelQualificationStatusEnum[t]?.tagClass || ''
const getQualStatusClass = (t) => {
  if (t === 'compliant') return 'success-text'
  if (t === 'invalid') return 'danger-text'
  return 'warn-text'
}
const getStarLevelLabel = (l) => HotelStarLevelEnum[l]?.label || '（未设置）'

const starText = (s) => (s ? `${s}星级` : '')

const formatDate = (d) => {
  if (!d) return '（未设置）'
  return new Date(d).toLocaleString('zh-CN', { hour12: false })
}

const isExpired = (d) => {
  if (!d) return false
  return new Date(d) < new Date()
}

const isExpiringSoon = (d) => {
  if (!d) return false
  const now = new Date()
  const diff = Math.ceil((new Date(d) - now) / (1000 * 60 * 60 * 24))
  return diff >= 0 && diff < 30
}

const getTypeCount = (type) => {
  return tableData.value.filter(s => s.hotelType === type).length
}

const toggleSelect = (store) => {
  if (selectedIds.value.has(store.id)) {
    selectedIds.value.delete(store.id)
    store._checked = false
  } else {
    selectedIds.value.add(store.id)
    store._checked = true
  }
  selectedIds.value = new Set(selectedIds.value)
}

const clearSelection = () => {
  tableData.value.forEach(s => (s._checked = false))
  selectedIds.value.clear()
  selectedIds.value = new Set()
}

const onTypeChange = () => {
  pagination.page = 1
  clearSelection()
  fetchData()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    city: '',
    star: null,
    businessStatus: '',
    qualificationStatus: ''
  })
  pagination.page = 1
  fetchData()
}

const computeStats = () => {
  stats.total = tableData.value.length
  stats.compliant = tableData.value.filter(s => s.qualificationStatus === 'compliant').length
  stats.warning = tableData.value.filter(
    s => ['expired', 'pending'].includes(s.qualificationStatus) || s.isFake || s.isDuplicate
  ).length
  stats.frozen = tableData.value.filter(
    s => ['suspended', 'rectification', 'closed'].includes(s.businessStatus) || s.status === 0
  ).length
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      hotelType: activeType.value,
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.name || undefined,
      city: searchForm.city || undefined,
      star: searchForm.star || undefined,
      businessStatus: searchForm.businessStatus || undefined,
      qualificationStatus: searchForm.qualificationStatus || undefined
    }
    const res = await getHotelList(params)
    const list = (res.rows || res.list || []).map(item => ({
      ...item,
      _checked: selectedIds.value.has(item.id)
    }))
    tableData.value = list
    pagination.total = res.total || 0
    computeStats()
  } catch (e) {
    // 统一处理
  } finally {
    loading.value = false
  }
}

const checkUserPermission = async () => {
  try {
    const [ops, cross, audit] = await Promise.all([
      checkHotelPermission('ops').catch(() => ({ data: { allowed: false } })),
      checkHotelPermission('cross_border').catch(() => ({ data: { allowed: false } })),
      checkHotelPermission('audit').catch(() => ({ data: { allowed: false } }))
    ])
    hasPermission.value = ops.data?.allowed !== false
    canAdd.value = hasPermission.value
    canCrossBorder.value = cross.data?.allowed === true
    canAudit.value = audit.data?.allowed === true
  } catch (e) {
    hasPermission.value = true
    canAdd.value = true
  }
}

const handleAdd = () => {
  if (activeType.value === 'overseas' && !canCrossBorder.value) {
    ElMessage.warning('无跨境酒店运营权限，无法新增海外酒店')
    return
  }
  editDialog.id = null
  editDialog.visible = true
}

const handleEdit = (row) => {
  if (row.hotelType === 'overseas' && !canCrossBorder.value) {
    ElMessage.warning('无跨境酒店运营权限，无法编辑海外酒店')
    return
  }
  editDialog.id = row.id
  editDialog.visible = true
}

const openDetail = (store) => {
  detailDialog.store = store
  detailExpanded.value = false
  detailDialog.visible = true
}

const openTrace = (store) => {
  tracePanel.id = store.id
  tracePanel.name = store.name
  tracePanel.visible = true
}

const openAllTrace = () => {
  tracePanel.id = null
  tracePanel.name = ''
  tracePanel.visible = true
}

const onEditSuccess = (data) => {
  if (data && data.id) {
    const idx = tableData.value.findIndex(s => s.id === data.id)
    if (idx >= 0) {
      refreshId.value = data.id
      setTimeout(() => (refreshId.value = null), 600)
    }
  }
  fetchData()
  ElNotification.success({
    title: '操作成功',
    message: '门店信息已保存，前台展示权重、上下架状态已联动更新'
  })
}

const onBatchSuccess = () => {
  fetchData()
  ElNotification.success({
    title: '批量操作完成',
    message: '门店列表已局部刷新，无整页重载'
  })
}

const onStatusCommand = async (cmd, store) => {
  let status = null
  let operation = ''
  let needReason = true
  let isVerify = false
  let verifyType = ''

  switch (cmd) {
    case 'on_shelf':
      status = 'operating'; operation = '恢复门店上架'; break
    case 'off_shelf':
      status = 'closed'; operation = '关闭下架门店'; break
    case 'suspend':
      status = 'suspended'; operation = '执行门店停业'; break
    case 'rectification':
      status = 'rectification'; operation = '标记整改中'; break
    case 'resume_operation':
      status = 'operating'; operation = '恢复门店营业'; break
    case 'verify_pass':
      isVerify = true; verifyType = 'pass'; operation = '标记资质合规'; break
    case 'verify_invalid':
      isVerify = true; verifyType = 'invalid'; operation = '标记资质无效'; break
    case 'mark_fake':
      isVerify = true; verifyType = 'fake'; operation = '标记为虚假门店'; needReason = true; break
    case 'mark_duplicate':
      isVerify = true; verifyType = 'duplicate'; operation = '标记为重复门店'; needReason = true; break
  }

  const confirmText = isVerify
    ? `确认对「${store.name}」${operation}？`
    : `确认对「${store.name}」执行「${operation}」吗？\n\n状态变更后将自动联动更新前台展示权重、上下架状态，\n停业/整改/关闭状态将实时冻结对应订单预订功能。`

  try {
    let inputValue = ''
    if (needReason) {
      const { value } = await ElMessageBox.prompt(
        confirmText,
        '操作确认',
        {
          confirmButtonText: '确认执行',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入操作原因（可选）',
          inputValidator: () => true,
          type: ['off_shelf', 'suspend', 'rectification', 'verify_invalid', 'mark_fake', 'mark_duplicate'].includes(cmd) ? 'warning' : 'info'
        }
      )
      inputValue = value || operation
    } else {
      await ElMessageBox.confirm(confirmText, '操作确认', {
        confirmButtonText: '确认执行',
        cancelButtonText: '取消',
        type: 'warning'
      })
    }

    if (isVerify) {
      if (!canAudit.value) {
        ElMessage.warning('无资质审核权限')
        return
      }
      await verifyHotel(store.id, verifyType)
    } else {
      await changeHotelStatus(store.id, status, inputValue || operation)
    }

    refreshId.value = store.id
    nextTick(() => {
      setTimeout(() => (refreshId.value = null), 600)
    })

    fetchData()
    ElNotification.success({
      title: '操作成功',
      message: `「${store.name}」已${operation}，状态已联动更新`
    })
  } catch (e) {
    if (e !== 'cancel') {
      // 其他错误统一处理
    }
  }
}

const initMockData = () => {
  const mockStores = [
    {
      id: 1001, name: '北京王府井希尔顿酒店', hotelType: 'domestic', city: '北京', country: '中国',
      address: '北京市东城区王府井东大街8号', star: 5, starLevel: 'national',
      price: 1288, rooms: 380, availableRooms: 156, roomTypeRange: '标准间,大床房,套房,行政房,总统套房',
      businessStatus: 'operating', status: 1, displayWeight: 92,
      phone: '010-58128888', email: 'booking@hilton-wangfujing.com',
      checkInTime: '14:00', checkOutTime: '12:00',
      description: '北京王府井希尔顿酒店位于市中心王府井商业区，交通便利，步行可达故宫、天安门等著名景点。酒店设有380间豪华客房，配备游泳池、健身房、中西餐厅等完善设施。',
      businessLicenseNo: '91110101MA1234567X', businessLicenseExpire: '2030-12-31',
      specialLicenseNo: '京特旅许字第00123号', specialLicenseExpire: '2027-06-30',
      hygieneLicenseNo: '京卫公证字(2022)第01234号', hygieneLicenseExpire: '2026-05-20',
      fireSafetyLicenseNo: '京消安检字(2023)第00876号', fireSafetyLicenseExpire: '2028-03-15',
      qualificationStatus: 'compliant', qualificationAuditTime: '2025-12-01 10:30:00', qualificationAuditor: '李审核',
      isFake: false, isDuplicate: false,
      merchant: { id: 1, name: '希尔顿酒店集团北京公司' },
      merchantId: 1, createdBy: 'admin', updatedBy: '张运营',
      createdAt: '2024-01-15 09:00:00', updatedAt: '2026-06-18 14:22:00'
    },
    {
      id: 1002, name: '上海外滩华尔道夫酒店', hotelType: 'domestic', city: '上海', country: '中国',
      address: '上海市黄浦区中山东一路2号', star: 5, starLevel: 'national',
      price: 2588, rooms: 260, availableRooms: 89, roomTypeRange: '豪华客房,江景套房,总统套房',
      businessStatus: 'operating', status: 1, displayWeight: 95,
      phone: '021-63229988', email: 'reservation@waldorfshanghai.com',
      checkInTime: '15:00', checkOutTime: '12:00',
      description: '华尔道夫上海外滩酒店，坐拥外滩历史建筑与绝美金江景景，是奢华酒店的代表。',
      businessLicenseNo: '91310101MA8888888X', businessLicenseExpire: '2032-06-30',
      specialLicenseNo: '沪特旅许字第00098号', specialLicenseExpire: '2026-10-15',
      hygieneLicenseNo: '沪卫公证字(2023)第05678号', hygieneLicenseExpire: '2026-10-01',
      fireSafetyLicenseNo: '沪消安检字(2022)第01122号', fireSafetyLicenseExpire: '2027-08-20',
      qualificationStatus: 'expired', qualificationAuditTime: '2025-11-15 09:00:00', qualificationAuditor: '王审核',
      isFake: false, isDuplicate: false,
      merchant: { id: 2, name: '希尔顿集团上海分公司' },
      merchantId: 2, createdBy: 'admin', updatedBy: 'admin',
      createdAt: '2023-08-20 10:15:00', updatedAt: '2026-06-20 09:10:00'
    },
    {
      id: 1003, name: '杭州西湖四季酒店', hotelType: 'featured', city: '杭州', country: '中国',
      address: '浙江省杭州市西湖区灵隐路5号', star: 5, starLevel: 'national',
      price: 3200, rooms: 88, availableRooms: 23, roomTypeRange: '园景房,湖景套房,泳池别墅',
      businessStatus: 'operating', status: 1, displayWeight: 88,
      phone: '0571-88298888', email: 'info@fourseasons-hz.com',
      checkInTime: '15:00', checkOutTime: '12:00',
      description: '杭州西子湖四季酒店依湖而建，将江南园林与奢华住宿完美融合，是度假首选。',
      businessLicenseNo: '91330106MA9999999X', businessLicenseExpire: '2030-01-01',
      specialLicenseNo: '浙特旅许杭字第00066号', specialLicenseExpire: '2027-03-31',
      hygieneLicenseNo: '浙卫公证字(2023)第09876号', hygieneLicenseExpire: '2026-12-31',
      fireSafetyLicenseNo: '浙消安检字(2022)第00555号', fireSafetyLicenseExpire: '2027-09-10',
      qualificationStatus: 'compliant', qualificationAuditTime: '2025-10-20 11:00:00', qualificationAuditor: '赵审核',
      isFake: false, isDuplicate: false,
      merchant: { id: 3, name: '四季酒店集团中国区' },
      merchantId: 3, createdBy: 'admin', updatedBy: '陈运营',
      createdAt: '2024-03-10 08:30:00', updatedAt: '2026-06-10 16:00:00'
    },
    {
      id: 1004, name: '成都锦里古巷民宿', hotelType: 'apartment', city: '成都', country: '中国',
      address: '四川省成都市武侯区锦里古街旁', star: 3, starLevel: 'user',
      price: 328, rooms: 12, availableRooms: 4, roomTypeRange: '标准大床房,复式套房',
      businessStatus: 'operating', status: 1, displayWeight: 70,
      phone: '13800138000', email: 'jinli-minsu@qq.com',
      checkInTime: '14:00', checkOutTime: '12:00',
      description: '特色川蜀风情民宿，步行3分钟即达锦里古街，感受老成都烟火气息。',
      businessLicenseNo: '91510107MA56789012', businessLicenseExpire: '2028-08-15',
      specialLicenseNo: '川特旅许成字第01234号', specialLicenseExpire: '2026-07-20',
      hygieneLicenseNo: '川卫公证字(2023)第01111号', hygieneLicenseExpire: '2026-06-30',
      fireSafetyLicenseNo: '川消安检字(2022)第00333号', fireSafetyLicenseExpire: '2026-10-01',
      qualificationStatus: 'expired', qualificationAuditTime: '2025-09-05 14:00:00', qualificationAuditor: '周审核',
      isFake: false, isDuplicate: false,
      merchant: { id: 4, name: '成都锦城民宿合作社' },
      merchantId: 4, createdBy: '钱运营', updatedBy: '钱运营',
      createdAt: '2024-11-01 13:20:00', updatedAt: '2026-06-19 10:00:00'
    },
    {
      id: 1005, name: '东京新宿柏悦酒店', hotelType: 'overseas', city: '东京', country: '日本',
      address: '东京都新宿区西新宿3-7-1-2', star: 5, starLevel: 'chain',
      price: 3800, rooms: 200, availableRooms: 67, roomTypeRange: '豪华房,景观套房,公寓套房',
      businessStatus: 'operating', status: 1, displayWeight: 85,
      phone: '+81-3-5322-1234', email: 'tokyo-park@hyatt.com',
      checkInTime: '15:00', checkOutTime: '11:00',
      description: 'Park Hyatt Tokyo位于新宿中心，是都市中的绿洲，拥有一流的餐饮和服务。',
      businessLicenseNo: 'TOKYO-HOTEL-8812345', businessLicenseExpire: '2030-05-20',
      specialLicenseNo: 'JP-TRAVEL-556677', specialLicenseExpire: '2028-11-30',
      hygieneLicenseNo: 'JP-HEALTH-990011', hygieneLicenseExpire: '2027-04-15',
      fireSafetyLicenseNo: 'JP-FIRE-112233', fireSafetyLicenseExpire: '2029-02-28',
      crossBorderLicense: 'CB-INT-HOTEL-2025001', crossBorderLicenseExpire: '2027-12-31',
      qualificationStatus: 'compliant', qualificationAuditTime: '2026-01-10 10:00:00', qualificationAuditor: '高级审核-吴总',
      isFake: false, isDuplicate: false,
      merchant: { id: 5, name: 'Hyatt Hotels International' },
      merchantId: 5, createdBy: '跨境运营-Sam', updatedBy: '跨境运营-Sam',
      createdAt: '2024-06-15 10:00:00', updatedAt: '2026-06-15 15:00:00'
    },
    {
      id: 1006, name: '三亚海棠湾红树林度假酒店', hotelType: 'domestic', city: '三亚', country: '中国',
      address: '海南省三亚市海棠湾北路10号', star: 5, starLevel: 'national',
      price: 1588, rooms: 500, availableRooms: 220, roomTypeRange: '标准间,海景房,独栋别墅,总统套房',
      businessStatus: 'rectification', status: 0, displayWeight: 45,
      phone: '0898-88888888', email: 'sanya-mangrove@example.com',
      checkInTime: '15:00', checkOutTime: '12:00',
      description: '三亚海棠湾红树林度假酒店，拥有私家海滩和无边泳池。',
      businessLicenseNo: '91460200MAABCDEFGH', businessLicenseExpire: '2029-09-30',
      specialLicenseNo: '琼特旅许三字第00099号', specialLicenseExpire: '2025-12-31',
      hygieneLicenseNo: '琼卫公证字(2022)第08888号', hygieneLicenseExpire: '2026-02-15',
      fireSafetyLicenseNo: '琼消安检字(2021)第00777号', fireSafetyLicenseExpire: '2026-05-10',
      qualificationStatus: 'invalid', qualificationAuditTime: '2026-06-18 09:00:00', qualificationAuditor: '高级审核-王总',
      isFake: false, isDuplicate: false,
      merchant: { id: 6, name: '红树林酒店集团' },
      merchantId: 6, createdBy: 'admin', updatedBy: '李运营',
      createdAt: '2023-12-01 08:00:00', updatedAt: '2026-06-18 09:30:00'
    }
  ]

  const activeList = mockStores.filter(s => s.hotelType === activeType.value)

  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  tableData.value = activeList.slice(start, end).map(item => ({
    ...item,
    _checked: selectedIds.value.has(item.id)
  }))
  pagination.total = activeList.length
  computeStats()
}

onMounted(async () => {
  await checkUserPermission()
  if (hasPermission.value) {
    try {
      await fetchData()
    } catch (e) {
      initMockData()
    }
    if (tableData.value.length === 0) {
      initMockData()
    }
  }
})
</script>
