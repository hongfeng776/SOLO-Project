<template>
  <div class="scenic-spot-ops">
    <div class="page-header">
      <div>
        <h2>景区资源管控</h2>
        <div style="color: #909399; font-size: 13px; margin-top: 4px;">
          依托文旅票务管理体系，统筹全品类文旅经营主体标准化资源运维
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="查看全局操作记录">
          <el-button :icon="Clock" @click="openAllTrace" v-ripple>
            全流程溯源
          </el-button>
        </el-tooltip>
        <el-tooltip :content="canAdd ? '新增景点' : '无权限'">
          <el-button
            type="primary"
            :icon="Plus"
            :disabled="!canAdd"
            @click="handleAdd"
            v-ripple
          >
            新增景点
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
      description="您当前角色没有访问景区资源管控模块的权限，请联系管理员开通。"
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
          <div class="stat-label">景点总数</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-sub">当前分类</div>
        </div>
        <div class="stat-card stat-compliant">
          <div class="stat-label">资质合规</div>
          <div class="stat-value">{{ stats.compliant }}</div>
          <div class="stat-sub">合规景点数量</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-label">预警景点</div>
          <div class="stat-value">{{ stats.warning }}</div>
          <div class="stat-sub">资质过期/待审核</div>
        </div>
        <div class="stat-card stat-frozen">
          <div class="stat-label">票务冻结</div>
          <div class="stat-value">{{ stats.frozen }}</div>
          <div class="stat-sub">闭园/整改/暂停</div>
        </div>
      </div>

      <div class="search-form focus-glow">
        <el-form :inline="true" :model="searchForm" @submit.prevent size="default">
          <el-form-item label="景点名称">
            <el-input
              v-model="searchForm.name"
              placeholder="景点名称/资质编号"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="省份">
            <el-input
              v-model="searchForm.province"
              placeholder="所在省份"
              clearable
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item label="城市">
            <el-input
              v-model="searchForm.city"
              placeholder="所在城市"
              clearable
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item label="等级">
            <el-select v-model="searchForm.level" placeholder="全部等级" clearable style="width: 140px">
              <el-option
                v-for="item in Object.values(ScenicSpotLevelEnum)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="经营状态">
            <el-select v-model="searchForm.businessStatus" placeholder="全部状态" clearable style="width: 140px">
              <el-option
                v-for="item in Object.values(ScenicSpotBusinessStatusEnum)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="资质状态">
            <el-select v-model="searchForm.qualificationStatus" placeholder="全部" clearable style="width: 140px">
              <el-option
                v-for="item in Object.values(ScenicSpotQualificationStatusEnum)"
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

      <ScenicSpotBatchToolbar
        :selectedIds="Array.from(selectedIds)"
        :selectedSpots="selectedSpots"
        :activeType="activeType"
        @clear="clearSelection"
        @success="onBatchSuccess"
      />

      <div class="spot-list-area" v-loading="loading">
        <div class="spot-card-grid" v-if="tableData.length > 0">
          <div
            v-for="spot in tableData"
            :key="spot.id"
            :class="['spot-card', 'spot-' + spot.spotType, {
              selected: selectedIds.has(spot.id),
              'partial-refresh': refreshId === spot.id
            }]"
            @dblclick="openDetail(spot)"
          >
            <div class="card-checkbox" @click.stop="toggleSelect(spot)">
              <el-checkbox v-model="spot._checked" :checked="selectedIds.has(spot.id)" />
            </div>

            <div class="card-header">
              <el-tooltip effect="dark" placement="top" :show-after="200">
                <template #content>
                  <div style="max-width: 320px; line-height: 1.6;">
                    <div style="font-weight: 600; margin-bottom: 6px;">{{ spot.name }}</div>
                    <div>类型：{{ getSpotTypeLabel(spot.spotType) }}</div>
                    <div>地址：{{ spot.province }}{{ spot.city }}{{ spot.district }}{{ spot.address }}</div>
                    <div>营业时间：{{ spot.openingHours }}</div>
                    <div>限流规则：{{ spot.limitRule || '无' }}</div>
                    <div>日承载量：{{ spot.dailyCapacity || '-' }}</div>
                  </div>
                </template>
                <div class="spot-name">{{ spot.name }}</div>
              </el-tooltip>
              <div class="spot-id">ID: {{ spot.id }}</div>
            </div>

            <div class="card-tags">
              <el-tag size="small" class="status-tag" :class="getSpotTypeTagClass(spot.spotType)">
                {{ getSpotTypeLabel(spot.spotType) }}
              </el-tag>
              <el-tag size="small" class="status-tag" :class="getBusinessStatusTagClass(spot.businessStatus)">
                {{ getBusinessStatusLabel(spot.businessStatus) }}
              </el-tag>
              <el-tag size="small" class="status-tag" :class="getQualStatusTagClass(spot.qualificationStatus)">
                {{ getQualStatusLabel(spot.qualificationStatus) }}
              </el-tag>
              <el-tag
                v-if="spot.status === 1"
                size="small"
                type="success"
                effect="plain"
              >
                已上架
              </el-tag>
              <el-tag
                v-else
                size="small"
                type="info"
                effect="plain"
              >
                已下架
              </el-tag>
              <el-tag
                v-if="spot.isFake"
                size="small"
                class="status-tag tag-fake"
                effect="dark"
              >
                <el-icon><Warning /></el-icon>
                疑似虚假
              </el-tag>
              <el-tag
                v-if="spot.isDuplicate"
                size="small"
                class="status-tag tag-duplicate"
              >
                重复资源
              </el-tag>
              <el-tag
                v-if="spot.ticketFrozen"
                size="small"
                class="status-tag tag-ticket-frozen"
              >
                票务冻结
              </el-tag>
            </div>

            <div class="card-info">
              <div class="info-row">
                <span class="info-label">位置</span>
                <span class="info-value">{{ spot.province }} {{ spot.city }}</span>
              </div>
              <div class="info-row" v-if="spot.level">
                <span class="info-label">等级</span>
                <span class="info-value">{{ getLevelLabel(spot.level) }}</span>
              </div>
              <div class="info-row" v-if="spot.openingHours">
                <span class="info-label">营业时间</span>
                <span class="info-value">{{ spot.openingHours }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">参考票价</span>
                <span class="info-value">
                  <template v-if="spot.ticketPrice">¥{{ spot.ticketPrice }}</template>
                  <template v-else>-</template>
                </span>
              </div>
            </div>

            <div class="card-footer">
              <div class="weight-display">
                <span class="weight-label">展示权重</span>
                <div class="weight-bar">
                  <div class="weight-fill" :style="{ width: getWeightPercent(spot.displayWeight) + '%' }" />
                </div>
                <span class="weight-value">{{ spot.displayWeight }}</span>
              </div>
              <div class="card-actions">
                <el-button size="small" type="primary" link @click.stop="handleEdit(spot)">
                  编辑
                </el-button>
                <el-button size="small" type="primary" link @click.stop="handleStatusChange(spot)">
                  状态
                </el-button>
                <el-button size="small" type="primary" link @click.stop="openSpotTrace(spot)">
                  溯源
                </el-button>
                <el-dropdown trigger="click" @command="(cmd) => onCardAction(cmd, spot)">
                  <el-button size="small" link>
                    更多
                    <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="verify">
                        <el-icon><Stamp /></el-icon>
                        资质审核
                      </el-dropdown-item>
                      <el-dropdown-item command="detail">
                        <el-icon><View /></el-icon>
                        详细信息
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" :disabled="!canDelete">
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无景点数据" />
      </div>

      <div class="pagination-area" v-if="total > 0" style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </template>

    <ScenicSpotEditDialog
      v-model:visible="editDialogVisible"
      :spotId="currentSpotId"
      :spotType="activeType"
      @success="onEditSuccess"
    />

    <ScenicSpotTracePanel
      v-model:visible="traceDialogVisible"
      :spotId="currentTraceSpotId"
      :isGlobal="isGlobalTrace"
    />

    <el-dialog
      v-model="statusDialogVisible"
      title="变更经营状态"
      width="480px"
      class="focus-glow"
    >
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag size="small" :class="getBusinessStatusTagClass(currentSpot?.businessStatus)">
            {{ getBusinessStatusLabel(currentSpot?.businessStatus) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标状态" prop="status" required>
          <el-select v-model="statusForm.status" style="width: 100%;">
            <el-option
              v-for="item in Object.values(ScenicSpotBusinessStatusEnum)"
              :key="item.value"
              :label="item.label + (item.freezeTicket ? '（票务冻结）' : '')"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因" prop="reason">
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入状态变更原因（将记录到日志）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-alert
          v-if="statusForm.status && ScenicSpotBusinessStatusEnum[statusForm.status]?.freezeTicket"
          type="warning"
          show-icon
          :closable="false"
          title="状态变更提醒"
          description="该状态将自动冻结对应票务售卖，并推送用户通知。"
          style="margin-bottom: 10px;"
        />
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusSubmitting" @click="confirmStatusChange" v-ripple>
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="verifyDialogVisible"
      title="资质审核"
      width="520px"
    >
      <el-form label-width="110px">
        <el-form-item label="景点名称">
          {{ currentSpot?.name }}
        </el-form-item>
        <el-form-item label="资质状态">
          <el-tag size="small" :class="getQualStatusTagClass(currentSpot?.qualificationStatus)">
            {{ getQualStatusLabel(currentSpot?.qualificationStatus) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="营业执照">
          <div>编号：{{ currentSpot?.businessLicense || '-' }}</div>
          <div>到期日：{{ currentSpot?.licenseExpiryDate || '-' }}</div>
        </el-form-item>
        <el-form-item label="文旅许可">
          <div>编号：{{ currentSpot?.tourismLicense || '-' }}</div>
          <div>到期日：{{ currentSpot?.tourismLicenseExpiry || '-' }}</div>
        </el-form-item>
        <el-form-item label="审核结论" required>
          <el-radio-group v-model="verifyType">
            <el-radio value="pass">合规通过</el-radio>
            <el-radio value="warning">存疑标记</el-radio>
            <el-radio value="block">违规拦截</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifySubmitting" @click="confirmVerify" v-ripple>
          提交审核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="景点详细信息"
      width="800px"
      class="scenic-spot-ops spot-detail-dialog"
    >
      <div v-if="currentSpot" class="detail-section">
        <div class="section-title">
          <el-icon class="title-icon"><InfoFilled /></el-icon>
          基础信息
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="item-label">景点名称</span>
            <span class="item-value">{{ currentSpot.name }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">景点类型</span>
            <span class="item-value">
              <el-tag size="small" :class="getSpotTypeTagClass(currentSpot.spotType)">
                {{ getSpotTypeLabel(currentSpot.spotType) }}
              </el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">经营状态</span>
            <span class="item-value">
              <el-tag size="small" :class="getBusinessStatusTagClass(currentSpot.businessStatus)">
                {{ getBusinessStatusLabel(currentSpot.businessStatus) }}
              </el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">资质状态</span>
            <span class="item-value" :class="{
              'warn-text': currentSpot.qualificationStatus === 'expired' || currentSpot.qualificationStatus === 'pending',
              'danger-text': currentSpot.qualificationStatus === 'invalid',
              'success-text': currentSpot.qualificationStatus === 'compliant'
            }">
              <el-tag size="small" :class="getQualStatusTagClass(currentSpot.qualificationStatus)">
                {{ getQualStatusLabel(currentSpot.qualificationStatus) }}
              </el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">完整地址</span>
            <span class="item-value">{{ currentSpot.province }}{{ currentSpot.city }}{{ currentSpot.district }}{{ currentSpot.address }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">景区等级</span>
            <span class="item-value">{{ getLevelLabel(currentSpot.level) || '-' }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentSpot" class="detail-section">
        <div class="section-title">
          <el-icon class="title-icon"><Management /></el-icon>
          运营与限流
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="item-label">营业时间</span>
            <span class="item-value">{{ currentSpot.openingHours || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">日承载量</span>
            <span class="item-value">{{ currentSpot.dailyCapacity || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">限流规则</span>
            <span class="item-value">{{ currentSpot.limitRule || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">参考票价</span>
            <span class="item-value">{{ currentSpot.ticketPrice ? '¥' + currentSpot.ticketPrice : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">展示权重</span>
            <span class="item-value">{{ currentSpot.displayWeight || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">上下架状态</span>
            <span class="item-value">
              <el-tag v-if="currentSpot.status === 1" size="small" type="success">已上架</el-tag>
              <el-tag v-else size="small" type="info">已下架</el-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">票务冻结</span>
            <span class="item-value" :class="{ 'danger-text': currentSpot.ticketFrozen }">
              {{ currentSpot.ticketFrozen ? '是 - 已暂停售卖' : '否 - 正常售卖' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="currentSpot" class="detail-section">
        <div class="section-title">
          <el-icon class="title-icon"><Stamp /></el-icon>
          资质信息
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="item-label">营业执照</span>
            <span class="item-value">
              {{ currentSpot.businessLicense || '-' }}
              <div v-if="currentSpot.licenseExpiryDate">到期日：{{ currentSpot.licenseExpiryDate }}</div>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">文旅经营许可</span>
            <span class="item-value">
              {{ currentSpot.tourismLicense || '-' }}
              <div v-if="currentSpot.tourismLicenseExpiry">到期日：{{ currentSpot.tourismLicenseExpiry }}</div>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">安全许可</span>
            <span class="item-value">
              {{ currentSpot.safetyLicense || '-' }}
              <div v-if="currentSpot.safetyLicenseExpiry">到期日：{{ currentSpot.safetyLicenseExpiry }}</div>
            </span>
          </div>
          <div class="info-item">
            <span class="item-label">消防许可</span>
            <span class="item-value">
              {{ currentSpot.fireLicense || '-' }}
              <div v-if="currentSpot.fireLicenseExpiry">到期日：{{ currentSpot.fireLicenseExpiry }}</div>
            </span>
          </div>
          <div class="info-item" v-if="currentSpot.spotType === 'performance'">
            <span class="item-label">演出许可</span>
            <span class="item-value">
              {{ currentSpot.performanceLicense || '-' }}
              <div v-if="currentSpot.performanceLicenseExpiry">到期日：{{ currentSpot.performanceLicenseExpiry }}</div>
            </span>
          </div>
        </div>
      </div>

      <div v-if="currentSpot && currentSpot.spotType === 'performance'" class="detail-section">
        <div class="section-title">
          <el-icon class="title-icon"><Tickets /></el-icon>
          展演场次
        </div>
        <div class="info-grid">
          <div class="info-item" style="grid-column: 1 / -1;">
            <span class="item-label">场次安排</span>
            <span class="item-value">{{ currentSpot.performanceSchedule || '暂无安排' }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentSpot && (currentSpot.isFake || currentSpot.isDuplicate)" class="detail-section">
        <div class="section-title" style="border-left-color: #f5222d; color: #cf1322;">
          <el-icon class="title-icon" style="color: #f5222d;"><Warning /></el-icon>
          风险标记
        </div>
        <div class="info-grid">
          <div class="info-item" v-if="currentSpot.isFake">
            <span class="item-label">虚假景点</span>
            <span class="item-value danger-text">
              <el-tag size="small" class="status-tag tag-fake">疑似虚假</el-tag>
              <div>已自动拦截违规上线</div>
            </span>
          </div>
          <div class="info-item" v-if="currentSpot.isDuplicate">
            <span class="item-label">重复资源</span>
            <span class="item-value">
              <el-tag size="small" class="status-tag tag-duplicate">重复资源</el-tag>
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false" v-ripple>关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Clock, Search, Refresh, ArrowDown, Delete, View, Stamp, Warning,
  Mountain, OfficeBuilding, MagicStick, Tickets, InfoFilled, Management
} from '@element-plus/icons-vue'
import {
  getScenicSpotList, updateScenicSpot, deleteScenicSpot,
  changeScenicSpotStatus, verifyScenicSpot, checkScenicSpotPermission
} from '@/api/scenicSpot'
import {
  ScenicSpotTypeEnum, ScenicSpotBusinessStatusEnum,
  ScenicSpotQualificationStatusEnum, ScenicSpotLevelEnum
} from '@/utils/enums'
import ScenicSpotEditDialog from './ScenicSpotEditDialog.vue'
import ScenicSpotBatchToolbar from './ScenicSpotBatchToolbar.vue'
import ScenicSpotTracePanel from './ScenicSpotTracePanel.vue'

const loading = ref(false)
const hasPermission = ref(true)
const canAdd = ref(true)
const canDelete = ref(true)

const activeType = ref('natural')
const typeTabList = computed(() => Object.values(ScenicSpotTypeEnum))

const searchForm = reactive({
  name: '',
  province: '',
  city: '',
  level: '',
  businessStatus: '',
  qualificationStatus: ''
})

const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const tableData = ref([])

const selectedIds = ref(new Set())
const selectedSpots = computed(() => tableData.value.filter(s => selectedIds.value.has(s.id)))

const refreshId = ref(null)
const stats = reactive({
  total: 0,
  compliant: 0,
  warning: 0,
  frozen: 0
})

const editDialogVisible = ref(false)
const currentSpotId = ref(null)

const traceDialogVisible = ref(false)
const currentTraceSpotId = ref(null)
const isGlobalTrace = ref(false)

const statusDialogVisible = ref(false)
const currentSpot = ref(null)
const statusForm = reactive({ status: '', reason: '' })
const statusSubmitting = ref(false)

const verifyDialogVisible = ref(false)
const verifyType = ref('pass')
const verifySubmitting = ref(false)

const detailDialogVisible = ref(false)

const getSpotTypeLabel = (t) => ScenicSpotTypeEnum[t]?.label || t
const getSpotTypeTagClass = (t) => ScenicSpotTypeEnum[t]?.tagClass || ''
const getBusinessStatusLabel = (s) => ScenicSpotBusinessStatusEnum[s]?.label || s
const getBusinessStatusTagClass = (s) => ScenicSpotBusinessStatusEnum[s]?.tagClass || ''
const getQualStatusLabel = (s) => ScenicSpotQualificationStatusEnum[s]?.label || s
const getQualStatusTagClass = (s) => ScenicSpotQualificationStatusEnum[s]?.tagClass || ''
const getLevelLabel = (l) => ScenicSpotLevelEnum[l]?.label || l

const getTypeCount = (type) => tableData.value.filter(s => s.spotType === type).length

const getWeightPercent = (w) => {
  const max = 100
  const min = 0
  return Math.max(0, Math.min(100, ((w || 0) - min) / (max - min) * 100))
}

const toggleSelect = (spot) => {
  if (selectedIds.value.has(spot.id)) {
    selectedIds.value.delete(spot.id)
  } else {
    selectedIds.value.add(spot.id)
  }
  spot._checked = selectedIds.value.has(spot.id)
}

const clearSelection = () => {
  selectedIds.value = new Set()
  tableData.value.forEach(s => (s._checked = false))
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      spotType: activeType.value,
      ...searchForm
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === undefined || params[k] === null) delete params[k]
    })
    const res = await getScenicSpotList(params)
    tableData.value = (res.data?.list || []).map(s => ({
      ...s,
      _checked: selectedIds.value.has(s.id)
    }))
    total.value = res.data?.total || 0
    stats.total = tableData.value.length
    stats.compliant = tableData.value.filter(s => s.qualificationStatus === 'compliant').length
    stats.warning = tableData.value.filter(s => ['expired', 'pending'].includes(s.qualificationStatus)).length
    stats.frozen = tableData.value.filter(s => s.ticketFrozen || ['closed', 'rectification', 'suspended'].includes(s.businessStatus)).length
  } finally {
    loading.value = false
  }
}

const checkPermission = async () => {
  try {
    const res = await checkScenicSpotPermission('scenic_ops')
    hasPermission.value = true
    canAdd.value = res.data?.canCreate !== false
    canDelete.value = res.data?.canDelete !== false
  } catch (e) {
    hasPermission.value = false
  }
}

const onTypeChange = () => {
  page.value = 1
  clearSelection()
  fetchList()
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  Object.assign(searchForm, { name: '', province: '', city: '', level: '', businessStatus: '', qualificationStatus: '' })
  handleSearch()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  page.value = 1
  fetchList()
}

const handlePageChange = (p) => {
  page.value = p
  fetchList()
}

const triggerRefresh = (id) => {
  refreshId.value = id
  setTimeout(() => (refreshId.value = null), 600)
}

const handleAdd = () => {
  currentSpotId.value = null
  editDialogVisible.value = true
}

const handleEdit = (spot) => {
  currentSpotId.value = spot.id
  editDialogVisible.value = true
}

const onEditSuccess = (id) => {
  triggerRefresh(id)
  fetchList()
}

const handleStatusChange = (spot) => {
  currentSpot.value = spot
  statusForm.status = spot.businessStatus
  statusForm.reason = ''
  statusDialogVisible.value = true
}

const confirmStatusChange = async () => {
  if (!statusForm.status) {
    ElMessage.warning('请选择目标状态')
    return
  }
  statusSubmitting.value = true
  try {
    await changeScenicSpotStatus(currentSpot.value.id, statusForm.status, statusForm.reason)
    ElMessage.success('状态变更成功，已联动更新票务与通知')
    statusDialogVisible.value = false
    triggerRefresh(currentSpot.value.id)
    fetchList()
  } finally {
    statusSubmitting.value = false
  }
}

const openSpotTrace = (spot) => {
  currentTraceSpotId.value = spot.id
  isGlobalTrace.value = false
  traceDialogVisible.value = true
}

const openAllTrace = () => {
  currentTraceSpotId.value = null
  isGlobalTrace.value = true
  traceDialogVisible.value = true
}

const onBatchSuccess = () => {
  clearSelection()
  fetchList()
}

const handleDelete = async (spot) => {
  try {
    await ElMessageBox.confirm(`确定要删除景点「${spot.name}」吗？`, '确认删除', { type: 'warning' })
    await deleteScenicSpot(spot.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') { /* ignore */ }
  }
}

const openDetail = (spot) => {
  currentSpot.value = spot
  detailDialogVisible.value = true
}

const openVerify = (spot) => {
  currentSpot.value = spot
  verifyType.value = spot.qualificationStatus === 'compliant' ? 'pass' : (spot.qualificationStatus === 'invalid' ? 'block' : 'warning')
  verifyDialogVisible.value = true
}

const confirmVerify = async () => {
  verifySubmitting.value = true
  try {
    await verifyScenicSpot(currentSpot.value.id, verifyType.value)
    ElMessage.success('资质审核完成')
    verifyDialogVisible.value = false
    triggerRefresh(currentSpot.value.id)
    fetchList()
  } finally {
    verifySubmitting.value = false
  }
}

const onCardAction = (cmd, spot) => {
  switch (cmd) {
    case 'verify':
      openVerify(spot)
      break
    case 'detail':
      openDetail(spot)
      break
    case 'delete':
      handleDelete(spot)
      break
  }
}

watch(activeType, () => {
  clearSelection()
  page.value = 1
  fetchList()
})

onMounted(() => {
  checkPermission()
  fetchList()
})
</script>
