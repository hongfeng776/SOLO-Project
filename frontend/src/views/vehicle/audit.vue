<template>
  <div class="vehicle-audit">
    <VehicleBatchOperation
      v-if="selectedRows.length > 0"
      :selected-rows="selectedRows"
      @success="handleBatchSuccess"
    />

    <CommonTable
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :show-selection="true"
      :search-fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button type="success" :disabled="validSelectedCount === 0" @click="handleBatchReview(1)">
          <el-icon><Check /></el-icon>
          批量通过
        </el-button>
        <el-button type="danger" :disabled="validSelectedCount === 0" @click="openBatchRejectDialog">
          <el-icon><Close /></el-icon>
          批量驳回
        </el-button>
        <el-button type="info" @click="handleMarkExpired">
          <el-icon><Clock /></el-icon>
          标记过期车辆
        </el-button>
      </template>

      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column prop="plateNumber" label="车牌号" width="130" fixed="left">
        <template #default="{ row }">
          <div class="plate-cell">
            <span class="plate-text">{{ row.plateNumber }}</span>
            <el-tag
              v-if="row.isLocked === 1"
              type="danger"
              size="small"
              effect="dark"
              class="lock-tag"
            >
              <el-icon><Lock /></el-icon>
              锁定
            </el-tag>
            <el-tag
              v-if="row.riskLevel === 3"
              type="danger"
              size="small"
              effect="dark"
              class="risk-tag"
            >
              <el-icon><WarningFilled /></el-icon>
              高风险
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="车辆信息" width="200">
        <template #default="{ row }">
          <div class="vehicle-info">
            <div class="main-info">{{ row.brand }} {{ row.model }}</div>
            <div class="sub-info">
              <span>{{ row.color }}</span>
              <span class="divider">/</span>
              <span>{{ row.seats }}座</span>
              <span class="divider">/</span>
              <span>{{ getEmissionText(row.emissionStandard) }}</span>
            </div>
            <div class="vin-info" v-if="row.vin">
              <span class="vin-label">VIN:</span>
              <span class="vin-value" :class="{ 'invalid-vin': !isVinValid(row.vin) }">{{ row.vin }}</span>
              <el-icon v-if="!isVinValid(row.vin)" class="vin-warning" color="#f56c6c"><Warning /></el-icon>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="运营等级" width="120" align="center">
        <template #default="{ row }">
          <div class="level-cell">
            <span :class="['level-tag', `level-${getLevelChar(row.operationLevel)}`]">
              {{ getLevelText(row.operationLevel) }}
            </span>
            <div class="level-score" v-if="row.totalScore !== undefined">
              {{ row.totalScore }}分
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="运力类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.capacityType"
            :status-map="CapacityTypeMap"
            :color-map="CapacityTypeColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column label="备案城市" prop="city" width="100" />
      <el-table-column label="证件校验" width="200">
        <template #default="{ row }">
          <div class="doc-status">
            <div class="doc-item" :class="{ expired: isExpired(row.drivingLicenseExpiry) }">
              <span class="doc-label">行驶证</span>
              <span class="doc-date">{{ formatShortDate(row.drivingLicenseExpiry) }}</span>
              <el-icon v-if="isExpired(row.drivingLicenseExpiry)" class="doc-warning"><Warning /></el-icon>
            </div>
            <div class="doc-item" :class="{ expired: isExpired(row.inspectionExpiry) }">
              <span class="doc-label">年检</span>
              <span class="doc-date">{{ formatShortDate(row.inspectionExpiry) }}</span>
              <el-icon v-if="isExpired(row.inspectionExpiry)" class="doc-warning"><Warning /></el-icon>
            </div>
            <div class="doc-item" :class="{ expired: isExpired(row.insuranceExpiry) }">
              <span class="doc-label">保险</span>
              <span class="doc-date">{{ formatShortDate(row.insuranceExpiry) }}</span>
              <el-icon v-if="isExpired(row.insuranceExpiry)" class="doc-warning"><Warning /></el-icon>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="交管数据" width="100" align="center">
        <template #default="{ row }">
          <el-tooltip :content="row.trafficDataVerified === 1 ? '与交管数据一致' : row.trafficDataVerified === 2 ? '与交管数据不一致' : '待核验'" placement="top">
            <el-tag
              :type="row.trafficDataVerified === 1 ? 'success' : row.trafficDataVerified === 2 ? 'danger' : 'warning'"
              size="small"
            >
              <el-icon v-if="row.trafficDataVerified === 1"><Check /></el-icon>
              <el-icon v-else-if="row.trafficDataVerified === 2"><Close /></el-icon>
              <el-icon v-else><Clock /></el-icon>
              {{ row.trafficDataVerified === 1 ? '一致' : row.trafficDataVerified === 2 ? '不一致' : '待核验' }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="车辆照片" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.vehicleImg"
            :src="row.vehicleImg"
            :preview-src-list="[row.vehicleImg, row.drivingLicenseImg, row.insuranceImg, row.inspectionImg].filter(Boolean)"
            style="width: 60px; height: 40px"
            fit="cover"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : row.auditStatus === 3 ? 'info' : 'warning'"
            size="small"
          >
            {{ VehicleAuditStatusMap[row.auditStatus as keyof typeof VehicleAuditStatusMap] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewDetail(row)">
            <el-icon><Document /></el-icon>
            详情
          </el-button>
          <el-button type="primary" link size="small" @click="handleViewTrace(row)">
            <el-icon><TimeLine /></el-icon>
            溯源
          </el-button>
          <el-button
            v-if="row.auditStatus === 0 && row.isLocked !== 1"
            type="success"
            link
            size="small"
            @click="handleApprove(row)"
          >
            <el-icon><Check /></el-icon>
            通过
          </el-button>
          <el-button
            v-if="row.auditStatus === 0 && row.isLocked !== 1"
            type="danger"
            link
            size="small"
            @click="handleReject(row)"
          >
            <el-icon><Close /></el-icon>
            驳回
          </el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <el-dialog
      v-model="detailDialogVisible"
      :title="`车辆审核详情 - ${currentVehicle?.plateNumber || ''}`"
      width="900px"
      :close-on-click-modal="false"
      v-if="detailDialogVisible && currentVehicle"
    >
      <div class="audit-detail">
        <div class="detail-header">
          <div class="header-left">
            <div class="plate-big">{{ currentVehicle.plateNumber }}</div>
            <div class="vehicle-sub">{{ currentVehicle.brand }} {{ currentVehicle.model }} / {{ currentVehicle.seats }}座</div>
          </div>
          <div class="header-right">
            <div class="status-badge" :class="`status-${currentVehicle.auditStatus}`">
              {{ VehicleAuditStatusMap[currentVehicle.auditStatus as keyof typeof VehicleAuditStatusMap] }}
            </div>
            <div class="level-badge" :class="`level-${getLevelChar(currentVehicle.operationLevel)}`">
              {{ getLevelText(currentVehicle.operationLevel) }}
            </div>
          </div>
        </div>

        <el-tabs v-model="detailTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="车架号">
                <span :class="{ 'text-danger': !isVinValid(currentVehicle.vin) }">{{ currentVehicle.vin }}</span>
                <el-tag v-if="!isVinValid(currentVehicle.vin)" type="danger" size="small">校验失败</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="发动机号">{{ currentVehicle.engineNo }}</el-descriptions-item>
              <el-descriptions-item label="车身颜色">{{ currentVehicle.color }}</el-descriptions-item>
              <el-descriptions-item label="车辆类型">{{ getVehicleTypeText(currentVehicle.vehicleType) }}</el-descriptions-item>
              <el-descriptions-item label="排放标准">{{ getEmissionText(currentVehicle.emissionStandard) }}</el-descriptions-item>
              <el-descriptions-item label="备案城市">{{ currentVehicle.city }}</el-descriptions-item>
              <el-descriptions-item label="运力类型">
                <StatusTag
                  :status="currentVehicle.capacityType"
                  :status-map="CapacityTypeMap"
                  :color-map="CapacityTypeColorMap"
                />
              </el-descriptions-item>
              <el-descriptions-item label="车龄">
                {{ currentVehicle.manufactureDate ? calculateVehicleAge(currentVehicle.manufactureDate) + '年' : '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="所有人信息" name="owner">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="所有人姓名">{{ currentVehicle.ownerName }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ currentVehicle.ownerIdCard }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ currentVehicle.ownerPhone }}</el-descriptions-item>
              <el-descriptions-item label="联系地址">{{ currentVehicle.ownerAddress }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="证件信息" name="documents">
            <div class="doc-check-list">
              <div class="check-item" :class="{ valid: !isExpired(currentVehicle.drivingLicenseExpiry), invalid: isExpired(currentVehicle.drivingLicenseExpiry) }">
                <div class="check-header">
                  <el-icon class="check-icon"><CircleCheck v-if="!isExpired(currentVehicle.drivingLicenseExpiry)" /><CircleClose v-else /></el-icon>
                  <span class="check-title">行驶证有效期</span>
                  <el-tag :type="isExpired(currentVehicle.drivingLicenseExpiry) ? 'danger' : 'success'" size="small">
                    {{ isExpired(currentVehicle.drivingLicenseExpiry) ? '已过期' : '有效' }}
                  </el-tag>
                </div>
                <div class="check-content">
                  <span>有效期至：{{ formatDate(currentVehicle.drivingLicenseExpiry) }}</span>
                  <span class="days-remaining" :class="{ danger: getDaysRemaining(currentVehicle.drivingLicenseExpiry) < 30 }">
                    {{ getDaysRemaining(currentVehicle.drivingLicenseExpiry) > 0 ? `剩余 ${getDaysRemaining(currentVehicle.drivingLicenseExpiry)} 天` : '已过期' }}
                  </span>
                </div>
              </div>

              <div class="check-item" :class="{ valid: !isExpired(currentVehicle.inspectionExpiry), invalid: isExpired(currentVehicle.inspectionExpiry) }">
                <div class="check-header">
                  <el-icon class="check-icon"><CircleCheck v-if="!isExpired(currentVehicle.inspectionExpiry)" /><CircleClose v-else /></el-icon>
                  <span class="check-title">年检有效期</span>
                  <el-tag :type="isExpired(currentVehicle.inspectionExpiry) ? 'danger' : 'success'" size="small">
                    {{ isExpired(currentVehicle.inspectionExpiry) ? '已过期' : '有效' }}
                  </el-tag>
                </div>
                <div class="check-content">
                  <span>有效期至：{{ formatDate(currentVehicle.inspectionExpiry) }}</span>
                  <span class="days-remaining" :class="{ danger: getDaysRemaining(currentVehicle.inspectionExpiry) < 30 }">
                    {{ getDaysRemaining(currentVehicle.inspectionExpiry) > 0 ? `剩余 ${getDaysRemaining(currentVehicle.inspectionExpiry)} 天` : '已过期' }}
                  </span>
                </div>
              </div>

              <div class="check-item" :class="{ valid: !isExpired(currentVehicle.insuranceExpiry), invalid: isExpired(currentVehicle.insuranceExpiry) }">
                <div class="check-header">
                  <el-icon class="check-icon"><CircleCheck v-if="!isExpired(currentVehicle.insuranceExpiry)" /><CircleClose v-else /></el-icon>
                  <span class="check-title">保险有效期</span>
                  <el-tag :type="isExpired(currentVehicle.insuranceExpiry) ? 'danger' : 'success'" size="small">
                    {{ isExpired(currentVehicle.insuranceExpiry) ? '已过期' : '有效' }}
                  </el-tag>
                </div>
                <div class="check-content">
                  <span>有效期至：{{ formatDate(currentVehicle.insuranceExpiry) }}</span>
                  <span class="days-remaining" :class="{ danger: getDaysRemaining(currentVehicle.insuranceExpiry) < 30 }">
                    {{ getDaysRemaining(currentVehicle.insuranceExpiry) > 0 ? `剩余 ${getDaysRemaining(currentVehicle.insuranceExpiry)} 天` : '已过期' }}
                  </span>
                </div>
              </div>

              <div class="check-item" :class="{ valid: currentVehicle.trafficDataVerified === 1, warning: currentVehicle.trafficDataVerified !== 1 }">
                <div class="check-header">
                  <el-icon class="check-icon"><CircleCheck v-if="currentVehicle.trafficDataVerified === 1" /><Warning v-else /></el-icon>
                  <span class="check-title">交管数据核验</span>
                  <el-tag :type="currentVehicle.trafficDataVerified === 1 ? 'success' : currentVehicle.trafficDataVerified === 2 ? 'danger' : 'warning'" size="small">
                    {{ currentVehicle.trafficDataVerified === 1 ? '一致' : currentVehicle.trafficDataVerified === 2 ? '不一致' : '待核验' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="运营等级" name="level" v-if="currentVehicle.levelResult">
            <div class="level-detail">
              <div class="level-summary">
                <div class="level-badge-lg" :class="`level-${getLevelChar(currentVehicle.operationLevel)}`">
                  {{ getLevelText(currentVehicle.operationLevel) }}
                </div>
                <div class="score-info">
                  <div class="score-value">{{ currentVehicle.levelResult.totalScore }}</div>
                  <div class="score-label">综合评分</div>
                </div>
              </div>
              <div class="level-privileges">
                <div class="privilege-card">
                  <el-icon class="privilege-icon"><Position /></el-icon>
                  <div class="privilege-name">接单范围</div>
                  <div class="privilege-value">{{ currentVehicle.levelResult.orderScope?.maxRadius || '-' }}km</div>
                </div>
                <div class="privilege-card">
                  <el-icon class="privilege-icon"><Money /></el-icon>
                  <div class="privilege-name">溢价权限</div>
                  <div class="privilege-value">+{{ currentVehicle.levelResult.premiumPermission || 0 }}%</div>
                </div>
                <div class="privilege-card">
                  <el-icon class="privilege-icon"><Clock /></el-icon>
                  <div class="privilege-name">运营时效</div>
                  <div class="privilege-value">{{ currentVehicle.levelResult.operationTimeLimit || '-' }}小时/天</div>
                </div>
              </div>
              <div v-if="currentVehicle.levelResult.breakdown" class="score-breakdown">
                <div class="breakdown-title">评分明细</div>
                <div v-for="(item, idx) in currentVehicle.levelResult.breakdown" :key="idx" class="breakdown-item">
                  <span class="breakdown-label">{{ item.factor }}</span>
                  <div class="breakdown-bar">
                    <div class="bar-fill" :style="{ width: `${(item.score / item.maxScore) * 100}%` }"></div>
                  </div>
                  <span class="breakdown-score">{{ item.score }}/{{ item.maxScore }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="证件照片" name="images">
            <div class="image-gallery">
              <div class="image-item" v-if="currentVehicle.drivingLicenseImg">
                <div class="image-label">行驶证照片</div>
                <el-image
                  :src="currentVehicle.drivingLicenseImg"
                  :preview-src-list="[currentVehicle.drivingLicenseImg, currentVehicle.insuranceImg, currentVehicle.inspectionImg, currentVehicle.vehicleImg].filter(Boolean)"
                  fit="cover"
                  class="gallery-image"
                />
              </div>
              <div class="image-item" v-if="currentVehicle.insuranceImg">
                <div class="image-label">保险保单</div>
                <el-image
                  :src="currentVehicle.insuranceImg"
                  :preview-src-list="[currentVehicle.drivingLicenseImg, currentVehicle.insuranceImg, currentVehicle.inspectionImg, currentVehicle.vehicleImg].filter(Boolean)"
                  fit="cover"
                  class="gallery-image"
                />
              </div>
              <div class="image-item" v-if="currentVehicle.inspectionImg">
                <div class="image-label">年检标志</div>
                <el-image
                  :src="currentVehicle.inspectionImg"
                  :preview-src-list="[currentVehicle.drivingLicenseImg, currentVehicle.insuranceImg, currentVehicle.inspectionImg, currentVehicle.vehicleImg].filter(Boolean)"
                  fit="cover"
                  class="gallery-image"
                />
              </div>
              <div class="image-item" v-if="currentVehicle.vehicleImg">
                <div class="image-label">车辆照片</div>
                <el-image
                  :src="currentVehicle.vehicleImg"
                  :preview-src-list="[currentVehicle.drivingLicenseImg, currentVehicle.insuranceImg, currentVehicle.inspectionImg, currentVehicle.vehicleImg].filter(Boolean)"
                  fit="cover"
                  class="gallery-image"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div v-if="currentVehicle.auditStatus === 0 && currentVehicle.isLocked !== 1" class="audit-actions">
          <el-form :model="auditForm" label-width="80px">
            <el-form-item label="审核备注">
              <el-input
                v-model="auditForm.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入审核备注（可选）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
          <div class="action-buttons">
            <el-button size="large" @click="detailDialogVisible = false">取消</el-button>
            <el-button type="danger" size="large" @click="handleRejectFromDetail">
              <el-icon><Close /></el-icon>
              驳回申请
            </el-button>
            <el-button type="success" size="large" @click="handleApproveFromDetail">
              <el-icon><Check /></el-icon>
              通过审核
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      :title="`车辆溯源 - ${currentVehicle?.plateNumber || ''}`"
      width="1200px"
      :close-on-click-modal="false"
      v-if="traceDialogVisible && currentVehicle"
    >
      <VehicleOperationTrace
        :vehicle-id="currentVehicleId"
        :vehicle="currentVehicle"
      />
    </el-dialog>

    <el-dialog
      v-model="rejectDialogVisible"
      title="驳回申请"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="操作说明">
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>将对 <strong class="text-primary">{{ rejectTargetCount }}</strong> 辆车辆进行驳回</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false" :disabled="operating">取消</el-button>
        <el-button type="danger" :loading="operating" @click="executeBatchReject">
          确认驳回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  Close,
  Clock,
  Lock,
  Document,
  TimeLine,
  Warning,
  WarningFilled,
  CircleCheck,
  CircleClose,
  InfoFilled,
  Position,
  Money
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import VehicleBatchOperation from '@/components/VehicleBatchOperation/index.vue'
import VehicleOperationTrace from '@/components/VehicleOperationTrace/index.vue'
import {
  getVehicleListApi,
  batchReviewApi,
  batchMarkExpiredApi
} from '@/api/vehicle'
import {
  VehicleAuditStatusMap,
  OperationLevelMap,
  EmissionStandardMap,
  VehicleTypeMap
} from '@/enums/vehicle'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import { formatDate } from '@/utils/format'
import type { Vehicle } from '@/types/vehicle'

const loading = ref(false)
const tableData = ref<Vehicle[]>([])
const total = ref(0)
const selectedRows = ref<Vehicle[]>([])
const operating = ref(false)

const detailDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const detailTab = ref('basic')
const currentVehicleId = ref<number | null>(null)
const currentVehicle = ref<Vehicle | null>(null)

const auditForm = reactive({
  remark: ''
})

const rejectForm = reactive({
  remark: ''
})

const rejectTargetCount = computed(() => {
  return validSelectedCount.value
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  plateNumber: '',
  vin: '',
  auditStatus: 0,
  city: '',
  capacityType: undefined as number | undefined,
  isLocked: undefined as number | undefined,
  hasExpiredDocs: undefined as boolean | undefined
})

const searchFields = [
  { prop: 'plateNumber', label: '车牌号', type: 'input' },
  { prop: 'vin', label: '车架号', type: 'input' },
  { prop: 'city', label: '备案城市', type: 'input' },
  { prop: 'capacityType', label: '运力类型', type: 'select', options: [
    { value: 1, label: '快车' },
    { value: 2, label: '专车' },
    { value: 3, label: '豪华车' },
    { value: 4, label: '拼车' },
    { value: 5, label: '出租车' }
  ]},
  { prop: 'auditStatus', label: '审核状态', type: 'select', options: [
    { value: 0, label: '待审核' },
    { value: 1, label: '已备案' },
    { value: 2, label: '已驳回' },
    { value: 3, label: '已过期' }
  ]},
  { prop: 'isLocked', label: '锁定状态', type: 'select', options: [
    { value: 0, label: '未锁定' },
    { value: 1, label: '已锁定' }
  ]},
  { prop: 'hasExpiredDocs', label: '证件状态', type: 'select', options: [
    { value: true, label: '有过期证件' },
    { value: false, label: '证件全部有效' }
  ]}
]

const validSelectedCount = computed(() => {
  return selectedRows.value.filter(row => row.isLocked !== 1 && row.auditStatus === 0).length
})

const getList = async () => {
  loading.value = true
  try {
    const res = await getVehicleListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取审核列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  queryParams.page = 1
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.auditStatus = 0
  getList()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleSelectionChange = (rows: Vehicle[]) => {
  selectedRows.value = rows
}

const handleViewDetail = (row: Vehicle) => {
  currentVehicleId.value = row.id
  currentVehicle.value = row
  detailTab.value = 'basic'
  auditForm.remark = ''
  detailDialogVisible.value = true
}

const handleViewTrace = (row: Vehicle) => {
  currentVehicleId.value = row.id
  currentVehicle.value = row
  traceDialogVisible.value = true
}

const handleApprove = async (row: Vehicle) => {
  try {
    await ElMessageBox.confirm(
      `确定通过车辆 ${row.plateNumber} 的备案审核吗？`,
      '审核通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    operating.value = true
    await batchReviewApi([row.id], 1, '')
    ElMessage.success('审核通过')
    getList()
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleReject = async (row: Vehicle) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入驳回原因',
      `驳回 ${row.plateNumber}`,
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入驳回原因',
        inputValidator: (value) => {
          if (!value || value.length < 2) {
            return '请输入至少2个字符的驳回原因'
          }
          return true
        }
      }
    )
    
    operating.value = true
    await batchReviewApi([row.id], 2, reason)
    ElMessage.success('已驳回')
    getList()
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleApproveFromDetail = async () => {
  if (!currentVehicle.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定通过车辆 ${currentVehicle.value.plateNumber} 的备案审核吗？`,
      '审核通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    operating.value = true
    await batchReviewApi([currentVehicle.value.id], 1, auditForm.remark)
    detailDialogVisible.value = false
    ElMessage.success('审核通过')
    getList()
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleRejectFromDetail = async () => {
  if (!currentVehicle.value) return
  
  if (!auditForm.remark || auditForm.remark.length < 2) {
    ElMessage.warning('请输入至少2个字符的驳回原因')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定驳回车辆 ${currentVehicle.value.plateNumber} 的备案申请吗？`,
      '驳回申请',
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    operating.value = true
    await batchReviewApi([currentVehicle.value.id], 2, auditForm.remark)
    detailDialogVisible.value = false
    ElMessage.success('已驳回')
    getList()
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleBatchReview = async (auditStatus: number) => {
  if (validSelectedCount.value === 0) {
    ElMessage.warning('请选择待审核且未锁定的车辆')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定通过 ${validSelectedCount.value} 辆车辆的备案审核吗？`,
      '批量通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    const ids = selectedRows.value.filter(row => row.isLocked !== 1 && row.auditStatus === 0).map(row => row.id)
    
    operating.value = true
    await batchReviewApi(ids, auditStatus, '')
    ElMessage.success('批量审核完成')
    getList()
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const openBatchRejectDialog = () => {
  if (validSelectedCount.value === 0) {
    ElMessage.warning('请选择待审核且未锁定的车辆')
    return
  }
  rejectForm.remark = ''
  rejectDialogVisible.value = true
}

const executeBatchReject = async () => {
  if (!rejectForm.remark || rejectForm.remark.length < 2) {
    ElMessage.warning('请输入至少2个字符的驳回原因')
    return
  }
  
  try {
    const ids = selectedRows.value.filter(row => row.isLocked !== 1 && row.auditStatus === 0).map(row => row.id)
    
    operating.value = true
    await batchReviewApi(ids, 2, rejectForm.remark)
    rejectDialogVisible.value = false
    ElMessage.success('批量驳回完成')
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    operating.value = false
  }
}

const handleMarkExpired = async () => {
  try {
    await ElMessageBox.confirm(
      '确定扫描并标记证件已过期的车辆吗？',
      '标记过期车辆',
      {
        confirmButtonText: '确定标记',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    operating.value = true
    const filter = {
      city: queryParams.city || undefined,
      capacityType: queryParams.capacityType
    }
    await batchMarkExpiredApi(filter, '证件已过期，系统自动标记')
    ElMessage.success('标记完成')
    getList()
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleBatchSuccess = () => {
  selectedRows.value = []
  getList()
}

const isExpired = (dateStr: string) => {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  return expiry < today
}

const getDaysRemaining = (dateStr: string) => {
  if (!dateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

const getLevelText = (level: number) => {
  return OperationLevelMap[level as keyof typeof OperationLevelMap] || '-'
}

const getLevelChar = (level: number) => {
  const text = getLevelText(level)
  return text.charAt(0)
}

const getEmissionText = (standard: number) => {
  return EmissionStandardMap[standard as keyof typeof EmissionStandardMap] || '-'
}

const getVehicleTypeText = (type: number) => {
  return VehicleTypeMap[type as keyof typeof VehicleTypeMap] || '-'
}

const isVinValid = (vin: string) => {
  if (!vin) return true
  const cleanVIN = vin.toUpperCase().replace(/[IOQ]/g, '')
  if (cleanVIN.length !== 17) return false
  return true
}

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const calculateVehicleAge = (dateStr: string) => {
  if (!dateStr) return 0
  const manufacture = new Date(dateStr)
  const now = new Date()
  let age = now.getFullYear() - manufacture.getFullYear()
  if (now.getMonth() < manufacture.getMonth() || 
      (now.getMonth() === manufacture.getMonth() && now.getDate() < manufacture.getDate())) {
    age--
  }
  return Math.max(0, age)
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.vehicle-audit {
  padding: 20px;

  .plate-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    .plate-text {
      font-weight: 600;
      color: #303133;
    }
  }

  .vehicle-info {
    .main-info {
      font-weight: 500;
      color: #303133;
    }

    .sub-info {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;

      .divider {
        margin: 0 4px;
        color: #dcdfe6;
      }
    }

    .vin-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      margin-top: 2px;

      .vin-label {
        color: #c0c4cc;
      }

      .vin-value {
        font-family: 'Courier New', monospace;
        color: #909399;

        &.invalid-vin {
          color: #f56c6c;
        }
      }

      .vin-warning {
        font-size: 12px;
      }
    }
  }

  .level-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .level-score {
      font-size: 11px;
      color: #909399;
    }
  }

  .level-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;

    &.level-S {
      background: linear-gradient(135deg, #ffd700, #ffb300);
      color: #fff;
      box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
    }

    &.level-A {
      background: linear-gradient(135deg, #409eff, #2b85e4);
      color: #fff;
    }

    &.level-B {
      background: linear-gradient(135deg, #67c23a, #529b2e);
      color: #fff;
    }

    &.level-C {
      background: linear-gradient(135deg, #909399, #73767a);
      color: #fff;
    }
  }

  .doc-status {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .doc-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      background: #f0f9eb;

      &.expired {
        background: #fef0f0;

        .doc-date {
          color: #f56c6c;
        }
      }

      .doc-label {
        color: #606266;
        min-width: 50px;
      }

      .doc-date {
        color: #67c23a;
        font-family: 'Courier New', monospace;
      }

      .doc-warning {
        color: #f56c6c;
        font-size: 12px;
      }
    }
  }

  .audit-detail {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: #fff;
      margin-bottom: 20px;

      .header-left {
        .plate-big {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 4px;
          margin-bottom: 8px;
        }

        .vehicle-sub {
          font-size: 14px;
          opacity: 0.9;
        }
      }

      .header-right {
        display: flex;
        gap: 12px;

        .status-badge,
        .level-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .status-badge {
          &.status-0 { background: #e6a23c; }
          &.status-1 { background: #67c23a; }
          &.status-2 { background: #f56c6c; }
          &.status-3 { background: #909399; }
        }

        .level-badge {
          &.level-S { background: linear-gradient(135deg, #ffd700, #ffb300); }
          &.level-A { background: linear-gradient(135deg, #409eff, #2b85e4); }
          &.level-B { background: linear-gradient(135deg, #67c23a, #529b2e); }
          &.level-C { background: linear-gradient(135deg, #909399, #73767a); }
        }
      }
    }

    .detail-tabs {
      margin-bottom: 20px;
    }

    .doc-check-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .check-item {
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #ebeef5;

        &.valid {
          background: #f0f9eb;
          border-color: #c2e7b0;

          .check-icon {
            color: #67c23a;
          }
        }

        &.invalid {
          background: #fef0f0;
          border-color: #fbc4c4;

          .check-icon {
            color: #f56c6c;
          }
        }

        &.warning {
          background: #fdf6ec;
          border-color: #f5dab1;

          .check-icon {
            color: #e6a23c;
          }
        }

        .check-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .check-icon {
            font-size: 20px;
          }

          .check-title {
            flex: 1;
            font-weight: 600;
            color: #303133;
          }
        }

        .check-content {
          display: flex;
          justify-content: space-between;
          padding-left: 28px;
          font-size: 13px;
          color: #606266;

          .days-remaining {
            &.danger {
              color: #f56c6c;
              font-weight: 600;
            }
          }
        }
      }
    }

    .level-detail {
      .level-summary {
        display: flex;
        align-items: center;
        gap: 40px;
        padding: 30px;
        background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
        border-radius: 12px;
        margin-bottom: 20px;

        .level-badge-lg {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          color: #fff;
        }

        .level-badge-lg.level-S { background: linear-gradient(135deg, #ffd700, #ffb300); box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4); }
        .level-badge-lg.level-A { background: linear-gradient(135deg, #409eff, #2b85e4); box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4); }
        .level-badge-lg.level-B { background: linear-gradient(135deg, #67c23a, #529b2e); box-shadow: 0 8px 24px rgba(103, 194, 58, 0.4); }
        .level-badge-lg.level-C { background: linear-gradient(135deg, #909399, #73767a); box-shadow: 0 8px 24px rgba(144, 147, 153, 0.4); }

        .score-info {
          .score-value {
            font-size: 48px;
            font-weight: 700;
            color: #409eff;
            line-height: 1;
          }

          .score-label {
            font-size: 14px;
            color: #909399;
            margin-top: 8px;
          }
        }
      }

      .level-privileges {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;

        .privilege-card {
          padding: 20px;
          background: #fff;
          border: 1px solid #ebeef5;
          border-radius: 8px;
          text-align: center;

          .privilege-icon {
            font-size: 28px;
            color: #409eff;
            margin-bottom: 8px;
          }

          .privilege-name {
            font-size: 13px;
            color: #909399;
            margin-bottom: 4px;
          }

          .privilege-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }
        }
      }

      .score-breakdown {
        .breakdown-title {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .breakdown-label {
            width: 120px;
            font-size: 13px;
            color: #606266;
          }

          .breakdown-bar {
            flex: 1;
            height: 10px;
            background: #f0f2f5;
            border-radius: 5px;
            overflow: hidden;

            .bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #409eff, #667eea);
              border-radius: 5px;
              transition: width 0.3s;
            }
          }

          .breakdown-score {
            width: 70px;
            text-align: right;
            font-size: 13px;
            font-weight: 600;
            color: #409eff;
          }
        }
      }
    }

    .image-gallery {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .image-item {
        .image-label {
          font-size: 13px;
          color: #606266;
          margin-bottom: 8px;
        }

        .gallery-image {
          width: 100%;
          height: 200px;
          border-radius: 8px;
          cursor: zoom-in;
        }
      }
    }

    .audit-actions {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
      }
    }
  }

  .form-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #909399;

    .text-primary {
      color: #409eff;
      font-weight: 600;
    }
  }
}
</style>
