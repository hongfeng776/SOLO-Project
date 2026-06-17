<template>
  <div class="driver-audit">
    <div class="dashboard-section">
      <el-row :gutter="16">
        <el-col :span="3" v-for="item in dashboardCards" :key="item.key">
          <el-card class="dashboard-card" shadow="hover" :class="item.key">
            <div class="card-icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ item.value }}</div>
              <div class="card-label">{{ item.label }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <CommonTable
      ref="tableRef"
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      :row-class-name="getRowClassName"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button type="success" :disabled="!canBatchApprove" @click="handleBatchAudit(1)">
          <el-icon><Check /></el-icon>
          批量通过
        </el-button>
        <el-button type="danger" :disabled="!canBatchReject" @click="handleBatchAudit(2)">
          <el-icon><Close /></el-icon>
          批量驳回
        </el-button>
        <el-button type="warning" :disabled="selectedRows.length === 0" @click="handleBatchReview">
          <el-icon><Refresh /></el-icon>
          批量复核
        </el-button>
        <el-button type="info" :disabled="selectedRows.length === 0" @click="handleBatchRemind">
          <el-icon><Bell /></el-icon>
          批量提醒
        </el-button>
        <el-button type="primary" :disabled="!canBatchUrgent" @click="handleBatchUrgent">
          <el-icon><Lightning /></el-icon>
          批量加急
          <el-tag size="small" type="danger" effect="dark">仅高信誉</el-tag>
        </el-button>
        <el-button type="primary" @click="refreshDashboard">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </template>

      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center" />

      <el-table-column label="司机信息" width="220" fixed="left">
        <template #default="{ row, $index }">
          <div class="driver-info">
            <el-avatar :size="40" :src="row.avatar" :class="getAvatarClass(row)">
              {{ row.name?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">
                {{ row.name }}
                <el-tag v-if="row.isUrgent" size="small" type="danger" effect="dark" class="urgent-tag">
                  加急
                </el-tag>
              </div>
              <div class="phone">{{ formatPhone(row.phone) }}</div>
              <div class="tags">
                <el-tag size="small" :type="row.driverLevel === 1 ? 'warning' : 'success'">
                  {{ DriverLevelMap[row.driverLevel] }}
                </el-tag>
                <el-tag size="small" :type="getReputationTagType(row.reputationLevel)" effect="dark">
                  {{ ReputationLevelMap[row.reputationLevel] }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="idCard" label="身份证号" width="180">
        <template #default="{ row }">{{ formatIdCard(row.idCard) }}</template>
      </el-table-column>

      <el-table-column prop="city" label="入驻城市" width="100">
        <template #default="{ row }">{{ CityMap[row.city] || row.city || '-' }}</template>
      </el-table-column>

      <el-table-column prop="vehicleType" label="车型" width="100">
        <template #default="{ row }">{{ VehicleTypeMap[row.vehicleType] || row.vehicleType || '-' }}</template>
      </el-table-column>

      <el-table-column label="资质照片" width="240">
        <template #default="{ row }">
          <div class="license-images">
            <div class="img-item" v-if="row.driverLicenseImg">
              <el-image
                :src="row.driverLicenseImg"
                :preview-src-list="[row.driverLicenseImg]"
                style="width: 60px; height: 40px"
                fit="cover"
              />
              <span class="img-label">驾驶证</span>
            </div>
            <div class="img-item" v-if="row.vehicleLicenseImg">
              <el-image
                :src="row.vehicleLicenseImg"
                :preview-src-list="[row.vehicleLicenseImg]"
                style="width: 60px; height: 40px"
                fit="cover"
              />
              <span class="img-label">行驶证</span>
            </div>
            <div class="img-item" v-if="row.idCardImg">
              <el-image
                :src="row.idCardImg"
                :preview-src-list="[row.idCardImg]"
                style="width: 60px; height: 40px"
                fit="cover"
              />
              <span class="img-label">身份证</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="人脸核验" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="row.faceImg"
            :type="row.faceVerifyResult === 1 ? 'success' : row.faceVerifyResult === 2 ? 'danger' : 'warning'"
            size="small"
          >
            {{ FaceVerifyResultMap[row.faceVerifyResult] }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="资质状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.qualificationStatus === 1 ? 'success' : row.qualificationStatus === 2 ? 'danger' : 'info'"
            size="small"
          >
            {{ QualificationStatusMap[row.qualificationStatus] }}
          </el-tag>
          <div v-if="row.uploadProgress > 0 && row.uploadProgress < 100" class="upload-progress">
            <el-progress :percentage="row.uploadProgress" :stroke-width="4" :show-text="false" />
            <span>{{ row.uploadProgress }}%</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getAuditStatusTagType(row.auditStatus)"
            size="small"
            effect="dark"
          >
            {{ DriverAuditStatusMap[row.auditStatus] }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="reputationScore" label="信誉分" width="100" align="center">
        <template #default="{ row }">
          <div class="reputation-score">
            <el-progress
              type="dashboard"
              :percentage="row.reputationScore"
              :width="50"
              :stroke-width="8"
              :color="getReputationColor(row.reputationScore)"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="申请时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>

      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            @click="handleCheckQualification(row)"
          >
            资质校验
          </el-button>
          <el-button
            type="success"
            link
            size="small"
            @click="handleViewDetail(row)"
          >
            详情
          </el-button>
          <el-button
            type="info"
            link
            size="small"
            @click="handleViewTrace(row)"
          >
            审核记录
          </el-button>
          <el-button
            v-if="row.reputationLevel === 1"
            type="danger"
            link
            size="small"
            @click="handleAudit(row)"
          >
            精细核验
          </el-button>
          <el-button
            v-else
            type="success"
            link
            size="small"
            @click="handleAudit(row, 1)"
          >
            通过
          </el-button>
          <el-button
            v-else
            type="danger"
            link
            size="small"
            @click="handleAudit(row, 2)"
          >
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <el-dialog
      v-model="qualificationDialogVisible"
      title="资质校验详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <QualificationCheckDetail
        v-if="currentDriver"
        :driver-id="currentDriver.id"
        :checks="currentDriver.qualificationResult || []"
        :violation-points="currentDriver.violationPoints || []"
        :overall-passed="currentDriver.qualificationStatus === 1"
        @rechecked="handleQualificationRechecked"
      />
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="司机详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <DetailDialog
        v-if="currentDriver"
        v-model="detailDialogVisible"
        :data="currentDriver"
        :fields="detailFields"
      />
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="审核记录溯源"
      width="700px"
      :close-on-click-modal="false"
    >
      <DriverAuditTrace
        v-if="currentDriver"
        :driver-id="currentDriver.id"
      />
    </el-dialog>

    <AuditDialog
      v-model="auditVisible"
      :title="auditTitle"
      :loading="auditLoading"
      @submit="handleAuditSubmit"
    />

    <el-dialog
      v-model="batchRemarkVisible"
      :title="batchRemarkTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchForm" label-width="80px">
        <el-form-item label="备注">
          <el-input
            v-model="batchForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRemarkVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchOperating" @click="handleBatchSubmit">
          确定
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
  Refresh,
  Bell,
  Lightning,
  User,
  CircleCheck,
  CircleClose,
  Warning,
  Clock,
  Document,
  Star,
  Rank
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import AuditDialog from '@/components/AuditDialog/index.vue'
import DetailDialog from '@/components/DetailDialog/index.vue'
import QualificationCheckDetail from '@/components/QualificationCheckDetail/index.vue'
import DriverAuditTrace from '@/components/DriverAuditTrace/index.vue'
import {
  getDriverListApi,
  auditDriverApi,
  getAuditDashboardApi,
  batchAuditApi,
  batchReviewApi,
  batchRemindApi,
  batchUrgentApi,
  checkQualificationApi,
  getDriverDetailApi
} from '@/api/driver'
import {
  DriverAuditStatusMap,
  DriverAuditStatusColorMap,
  DriverLevelMap,
  ReputationLevelMap,
  ReputationLevelColorMap,
  QualificationStatusMap,
  FaceVerifyResultMap,
  CityMap,
  VehicleTypeMap,
  DriverAuditStatus
} from '@/enums/driver'
import { formatDate, formatPhone, formatIdCard } from '@/utils/format'
import type { Driver, AuditDashboard } from '@/types/driver'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Driver[]>([])
const total = ref(0)
const selectedRows = ref<Driver[]>([])
const dashboard = ref<AuditDashboard | null>(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  phone: '',
  auditStatus: undefined as number | undefined,
  city: '',
  vehicleType: '',
  reputationLevel: undefined as number | undefined,
  qualificationStatus: undefined as number | undefined,
  isUrgent: undefined as number | undefined,
  driverLevel: undefined as number | undefined
})

const searchFields = [
  { prop: 'name', label: '司机姓名', type: 'input' },
  { prop: 'phone', label: '手机号码', type: 'input' },
  { prop: 'auditStatus', label: '审核状态', type: 'select', options: [
    { value: '', label: '全部' },
    { value: 0, label: '待审核' },
    { value: 1, label: '已通过' },
    { value: 2, label: '已拒绝' },
    { value: 3, label: '审核异常' },
    { value: 4, label: '资质过期' },
    { value: 5, label: '待复核' }
  ]},
  { prop: 'city', label: '入驻城市', type: 'select', options: [
    { value: '', label: '全部' },
    { value: 'beijing', label: '北京' },
    { value: 'shanghai', label: '上海' },
    { value: 'guangzhou', label: '广州' },
    { value: 'shenzhen', label: '深圳' },
    { value: 'default', label: '其他城市' }
  ]},
  { prop: 'vehicleType', label: '车型类别', type: 'select', options: [
    { value: '', label: '全部' },
    { value: 'luxury', label: '豪华型' },
    { value: 'comfort', label: '舒适型' },
    { value: 'economy', label: '经济型' },
    { value: 'default', label: '标准型' }
  ]},
  { prop: 'reputationLevel', label: '信誉等级', type: 'select', options: [
    { value: '', label: '全部' },
    { value: 1, label: '低信誉' },
    { value: 2, label: '中信誉' },
    { value: 3, label: '高信誉' }
  ]},
  { prop: 'driverLevel', label: '司机等级', type: 'select', options: [
    { value: '', label: '全部' },
    { value: 1, label: '新手司机' },
    { value: 2, label: '老司机' }
  ]}
]

const detailFields = [
  { prop: 'name', label: '司机姓名' },
  { prop: 'phone', label: '手机号码', format: formatPhone },
  { prop: 'idCard', label: '身份证号', format: formatIdCard },
  { prop: 'city', label: '入驻城市', format: (val: string) => CityMap[val] || val },
  { prop: 'vehicleType', label: '车型类别', format: (val: string) => VehicleTypeMap[val] || val },
  { prop: 'driverLevel', label: '司机等级', format: (val: number) => DriverLevelMap[val] },
  { prop: 'reputationScore', label: '信誉分数' },
  { prop: 'reputationLevel', label: '信誉等级', format: (val: number) => ReputationLevelMap[val] },
  { prop: 'auditStatus', label: '审核状态', format: (val: number) => DriverAuditStatusMap[val] },
  { prop: 'auditRemark', label: '审核备注' },
  { prop: 'createTime', label: '申请时间', format: formatDate }
]

const qualificationDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const auditVisible = ref(false)
const auditLoading = ref(false)
const currentAuditId = ref<number | null>(null)
const currentDriver = ref<Driver | null>(null)
const auditTitle = ref('司机资质审核')

const batchRemarkVisible = ref(false)
const batchRemarkTitle = ref('批量操作')
const batchOperating = ref(false)
const batchActionType = ref('')
const batchForm = reactive({
  remark: '',
  auditStatus: 1
})

const dashboardCards = computed(() => [
  { key: 'pending', label: '待审核', value: dashboard.value?.pendingCount || 0, icon: Clock, color: '#e6a23c' },
  { key: 'approved', label: '今日通过', value: dashboard.value?.approvedCount || 0, icon: CircleCheck, color: '#67c23a' },
  { key: 'rejected', label: '今日驳回', value: dashboard.value?.rejectedCount || 0, icon: CircleClose, color: '#f56c6c' },
  { key: 'exception', label: '审核异常', value: dashboard.value?.exceptionCount || 0, icon: Warning, color: '#909399' },
  { key: 'expired', label: '资质过期', value: dashboard.value?.expiredCount || 0, icon: Document, color: '#f56c6c' },
  { key: 'urgent', label: '加急审核', value: dashboard.value?.urgentCount || 0, icon: Lightning, color: '#409eff' },
  { key: 'lowReputation', label: '低信誉待审', value: dashboard.value?.lowReputationCount || 0, icon: User, color: '#e6a23c' },
  { key: 'total', label: '司机总数', value: total.value, icon: Rank, color: '#409eff' }
])

const canBatchApprove = computed(() => {
  return selectedRows.value.length > 0 &&
         selectedRows.value.every(r => r.reputationLevel !== 1) &&
         selectedRows.value.every(r => r.auditStatus === DriverAuditStatus.PENDING || r.auditStatus === DriverAuditStatus.REVIEW)
})

const canBatchReject = computed(() => {
  return selectedRows.value.length > 0 &&
         selectedRows.value.every(r => r.auditStatus === DriverAuditStatus.PENDING || r.auditStatus === DriverAuditStatus.REVIEW)
})

const canBatchUrgent = computed(() => {
  return selectedRows.value.length > 0 &&
         selectedRows.value.every(r => r.reputationLevel === 3 && r.auditStatus === DriverAuditStatus.PENDING)
})

const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 1 ? 'row-striped' : ''
}

const getAvatarClass = (row: Driver) => {
  if (row.isUrgent) return 'avatar-urgent'
  if (row.reputationLevel === 1) return 'avatar-low-reputation'
  if (row.reputationLevel === 3) return 'avatar-high-reputation'
  return ''
}

const getReputationTagType = (level: number) => {
  if (level === 1) return 'danger'
  if (level === 3) return 'success'
  return 'warning'
}

const getAuditStatusTagType = (status: number) => {
  const color = DriverAuditStatusColorMap[status]
  if (color === '#67c23a') return 'success'
  if (color === '#f56c6c') return 'danger'
  if (color === '#e6a23c') return 'warning'
  if (color === '#409eff') return 'primary'
  return 'info'
}

const getReputationColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 75) return '#e6a23c'
  return '#f56c6c'
}

const getList = async () => {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (params.auditStatus === undefined) delete params.auditStatus
    if (params.reputationLevel === undefined) delete params.reputationLevel
    if (params.qualificationStatus === undefined) delete params.qualificationStatus
    if (params.isUrgent === undefined) delete params.isUrgent
    if (params.driverLevel === undefined) delete params.driverLevel

    const res = await getDriverListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取审核列表失败')
  } finally {
    loading.value = false
  }
}

const loadDashboard = async () => {
  try {
    const res = await getAuditDashboardApi()
    dashboard.value = res.data
  } catch (error: any) {
    console.error('加载数据看板失败', error)
  }
}

const refreshDashboard = () => {
  loadDashboard()
  getList()
  ElMessage.success('数据已刷新')
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  queryParams.page = 1
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.name = ''
  queryParams.phone = ''
  queryParams.auditStatus = undefined
  queryParams.city = ''
  queryParams.vehicleType = ''
  queryParams.reputationLevel = undefined
  queryParams.qualificationStatus = undefined
  queryParams.isUrgent = undefined
  queryParams.driverLevel = undefined
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

const handleSelectionChange = (selection: Driver[]) => {
  selectedRows.value = selection
}

const handleCheckQualification = async (row: Driver) => {
  currentDriver.value = row
  qualificationDialogVisible.value = true

  if (!row.qualificationResult || row.qualificationResult.length === 0) {
    try {
      const res = await checkQualificationApi(row.id)
      currentDriver.value = {
        ...row,
        qualificationResult: res.data.checks,
        violationPoints: res.data.violationPoints,
        qualificationStatus: res.data.overallPassed ? 1 : 2
      }
    } catch (error: any) {
      ElMessage.error(error.message || '资质校验失败')
    }
  }
}

const handleQualificationRechecked = (data: any) => {
  if (currentDriver.value) {
    currentDriver.value.qualificationResult = data.checks
    currentDriver.value.violationPoints = data.violationPoints
    currentDriver.value.qualificationStatus = data.overallPassed ? 1 : 2
  }
  getList()
}

const handleViewDetail = async (row: Driver) => {
  try {
    const res = await getDriverDetailApi(row.id)
    currentDriver.value = res.data
    detailDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

const handleViewTrace = (row: Driver) => {
  currentDriver.value = row
  traceDialogVisible.value = true
}

const handleAudit = (row: Driver, status?: number) => {
  currentAuditId.value = row.id
  currentDriver.value = row

  if (row.reputationLevel === 1) {
    auditTitle.value = `精细核验 - ${row.name}`
    auditVisible.value = true
  } else if (status !== undefined) {
    if (status === 1) {
      ElMessageBox.confirm(
        `确定要通过司机【${row.name}】的资质审核吗？`,
        '审核确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        }
      ).then(async () => {
        try {
          await auditDriverApi(row.id, status, '')
          ElMessage.success('审核通过')
          getList()
          loadDashboard()
        } catch (error: any) {
          ElMessage.error(error.message || '审核失败')
        }
      }).catch(() => {})
    } else {
      auditTitle.value = `审核驳回 - ${row.name}`
      batchForm.auditStatus = status
      batchRemarkTitle.value = '审核驳回'
      batchActionType.value = 'singleReject'
      batchRemarkVisible.value = true
    }
  }
}

const handleAuditSubmit = async (form: any) => {
  if (!currentAuditId.value) return
  auditLoading.value = true
  try {
    await auditDriverApi(currentAuditId.value, form.auditStatus, form.remark)
    ElMessage.success('审核成功')
    auditVisible.value = false
    getList()
    loadDashboard()
  } catch (error: any) {
    ElMessage.error(error.message || '审核失败')
  } finally {
    auditLoading.value = false
  }
}

const handleBatchAudit = (status: number) => {
  const count = selectedRows.value.length
  const action = status === 1 ? '通过' : '驳回'

  if (status === 1 && !canBatchApprove.value) {
    ElMessage.warning('包含低信誉司机，不可批量通过，请单独精细核验')
    return
  }

  if (status === 1) {
    ElMessageBox.confirm(
      `确定要批量${action}选中的 ${count} 条记录吗？`,
      '批量审核确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: status === 1 ? 'success' : 'warning'
      }
    ).then(async () => {
      batchOperating.value = true
      try {
        const ids = selectedRows.value.map(r => r.id)
        await batchAuditApi(ids, status, '')
        ElMessage.success(`批量${action}成功`)
        getList()
        loadDashboard()
        tableRef.value?.clearSelection()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        batchOperating.value = false
      }
    }).catch(() => {})
  } else {
    batchForm.auditStatus = status
    batchRemarkTitle.value = `批量${action}`
    batchActionType.value = 'batchAudit'
    batchRemarkVisible.value = true
  }
}

const handleBatchReview = () => {
  batchRemarkTitle.value = '批量复核'
  batchActionType.value = 'batchReview'
  batchForm.remark = ''
  batchRemarkVisible.value = true
}

const handleBatchRemind = () => {
  batchRemarkTitle.value = '批量提醒补全'
  batchActionType.value = 'batchRemind'
  batchForm.remark = ''
  batchRemarkVisible.value = true
}

const handleBatchUrgent = () => {
  const count = selectedRows.value.filter(r => r.reputationLevel === 3).length
  ElMessageBox.confirm(
    `确定要为选中的 ${count} 名高信誉司机设置加急审核吗？`,
    '批量加急确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'primary'
    }
  ).then(async () => {
    batchOperating.value = true
    try {
      const ids = selectedRows.value.map(r => r.id)
      await batchUrgentApi(ids)
      ElMessage.success('批量加急成功')
      getList()
      loadDashboard()
      tableRef.value?.clearSelection()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      batchOperating.value = false
    }
  }).catch(() => {})
}

const handleBatchSubmit = async () => {
  batchOperating.value = true
  try {
    const ids = selectedRows.value.map(r => r.id)

    switch (batchActionType.value) {
      case 'batchAudit':
        await batchAuditApi(ids, batchForm.auditStatus, batchForm.remark)
        break
      case 'batchReview':
        await batchReviewApi(ids, batchForm.remark)
        break
      case 'batchRemind':
        await batchRemindApi(ids, batchForm.remark)
        break
      case 'singleReject':
        if (currentAuditId.value) {
          await auditDriverApi(currentAuditId.value, 2, batchForm.remark)
        }
        break
    }

    ElMessage.success('操作成功')
    batchRemarkVisible.value = false
    auditVisible.value = false
    getList()
    loadDashboard()
    tableRef.value?.clearSelection()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    batchOperating.value = false
  }
}

onMounted(() => {
  getList()
  loadDashboard()
})
</script>

<style lang="scss" scoped>
.driver-audit {
  .dashboard-section {
    margin-bottom: 20px;

    .dashboard-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      &.pending {
        background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
        .card-icon { background: #e6a23c; }
      }
      &.approved {
        background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
        .card-icon { background: #67c23a; }
      }
      &.rejected, &.expired {
        background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
        .card-icon { background: #f56c6c; }
      }
      &.exception, &.lowReputation {
        background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
        .card-icon { background: #909399; }
      }
      &.urgent, &.total {
        background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
        .card-icon { background: #409eff; }
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
      }

      .card-info {
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          line-height: 1.2;
        }
        .card-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }

      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        width: 100%;
      }
    }
  }

  :deep(.el-table) {
    .row-striped {
      --el-table-tr-bg-color: #fafafa;
    }

    .driver-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .avatar-urgent {
        border: 2px solid #f56c6c;
        animation: pulse 1.5s infinite;
      }
      .avatar-low-reputation {
        border: 2px solid #e6a23c;
      }
      .avatar-high-reputation {
        border: 2px solid #67c23a;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .info {
        .name {
          font-weight: 500;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 6px;

          .urgent-tag {
            animation: blink 1s infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        }

        .phone {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }

        .tags {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
      }
    }

    .license-images {
      display: flex;
      gap: 6px;

      .img-item {
        position: relative;

        .img-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 10px;
          text-align: center;
          padding: 1px 0;
        }
      }
    }

    .upload-progress {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;

      .el-progress {
        width: 60px;
      }

      span {
        font-size: 11px;
        color: #409eff;
      }
    }

    .reputation-score {
      display: flex;
      justify-content: center;
    }
  }
}
</style>
