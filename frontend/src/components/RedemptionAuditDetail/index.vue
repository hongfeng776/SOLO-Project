<template>
  <div class="redemption-audit-detail">
    <div v-if="skeletonLoading" class="skeleton-wrap">
      <div class="status-skeleton">
        <el-skeleton :rows="1" animated />
      </div>
      <div class="stats-skeleton">
        <el-skeleton :rows="3" animated />
      </div>
      <div class="form-skeleton">
        <el-skeleton :rows="4" animated />
      </div>
      <div class="table-skeleton">
        <el-skeleton :rows="6" animated />
      </div>
    </div>

    <template v-else>
      <div v-if="preCheckResult" class="pre-check-bar" :class="preCheckResult.canProceed ? 'success' : 'warning'">
        <el-icon v-if="preCheckResult.canProceed"><CircleCheckFilled /></el-icon>
        <el-icon v-else><WarningFilled /></el-icon>
        <span v-if="preCheckResult.canProceed">
          活动状态正常，可进行核销操作
          <el-tag size="small" effect="plain" style="margin-left: 8px">
            状态：{{ CampaignStatusMap[preCheckResult.campaignStatus ?? 2] || '进行中' }}
          </el-tag>
        </span>
        <span v-else>{{ preCheckResult.reason || '当前活动不可进行核销操作' }}</span>
      </div>

      <div class="stats-grid">
        <div
          v-for="(card, idx) in statsCards"
          :key="card.key"
          class="stat-card"
          :class="{ highlight: idx === 0 }"
          :style="idx === 0 ? { background: card.gradient } : {}"
        >
          <div class="stat-label">
            <el-icon v-if="card.icon && idx === 0" style="color: #fff"><component :is="card.icon" /></el-icon>
            <el-icon v-else-if="card.icon" :style="{ color: card.iconColor }"><component :is="card.icon" /></el-icon>
            <span :class="{ white: idx === 0 }">{{ card.label }}</span>
          </div>
          <div class="stat-value" :class="{ white: idx === 0 }">
            {{ card.formatted }}
            <span class="unit" v-if="card.unit">{{ card.unit }}</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <h4 class="section-title">
          <el-icon color="#409eff"><EditPen /></el-icon>
          提交核销
        </h4>
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          size="default"
          :disabled="!preCheckResult?.canProceed"
        >
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="用户ID" prop="userId">
                <el-input v-model="formData.userId" placeholder="请输入用户ID" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="手机号" prop="userPhone">
                <el-input v-model="formData.userPhone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="用户等级" prop="userLevel">
                <el-input-number v-model="formData.userLevel" :min="1" :max="10" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="订单ID" prop="orderId">
                <el-input v-model="formData.orderId" placeholder="请输入订单ID" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="订单编号" prop="orderNo">
                <el-input v-model="formData.orderNo" placeholder="请输入订单编号" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="核销码" prop="redemptionCode">
                <el-input v-model="formData.redemptionCode" placeholder="请输入核销码" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="城市" prop="city">
                <el-input v-model="formData.city" placeholder="请输入城市" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="车型" prop="vehicleType">
                <el-input v-model="formData.vehicleType" placeholder="请输入车型" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="订单金额" prop="orderAmount">
                <el-input-number v-model="formData.orderAmount" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="核销金额" prop="redemptionAmount">
                <el-input-number v-model="formData.redemptionAmount" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">
                  提交核销
                </el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div v-if="submitResult" class="submit-result">
          <el-alert
            :title="submitResult.autoPassed ? '自动审核通过' : '进入人工复核'"
            :type="submitResult.autoPassed ? 'success' : 'warning'"
            show-icon
            :closable="false"
          >
            <template #default>
              <div class="result-detail">
                <span>合规分数：{{ submitResult.complianceScore }}</span>
                <el-divider direction="vertical" />
                <span>审核路径：{{ AuditLevelMap[submitResult.auditLevel] }}</span>
                <el-divider direction="vertical" />
                <span>违规类型：{{ ViolationTypeMap[submitResult.violationType] || '无' }}</span>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <div class="section-card">
        <h4 class="section-title">
          <el-icon color="#67c23a"><List /></el-icon>
          核销记录
        </h4>
        <div class="table-filter">
          <el-select v-model="queryParams.status" placeholder="核销状态" clearable size="default" style="width: 140px" @change="loadRecords">
            <el-option
              v-for="(label, val) in RedemptionStatusMap"
              :key="val"
              :label="label"
              :value="Number(val)"
            />
          </el-select>
          <el-select v-model="queryParams.violationType" placeholder="违规类型" clearable size="default" style="width: 140px; margin-left: 10px" @change="loadRecords">
            <el-option
              v-for="(label, val) in ViolationTypeMap"
              :key="val"
              :label="label"
              :value="val"
            />
          </el-select>
        </div>
        <el-table :data="recordList" border stripe size="default" v-loading="tableLoading">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="userPhone" label="手机号" width="130" />
          <el-table-column prop="userLevel" label="等级" width="70" align="center" />
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="RedemptionStatusTagType[row.status]">
                {{ RedemptionStatusMap[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="审核层级" width="110" align="center">
            <template #default="{ row }">
              <span :style="{ color: AuditLevelColorMap[row.auditLevel] }">
                {{ AuditLevelMap[row.auditLevel] }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="违规类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.violationType && row.violationType !== 'none'"
                size="small"
                :type="ViolationTypeTagType[row.violationType]"
              >
                {{ ViolationTypeMap[row.violationType] }}
              </el-tag>
              <span v-else style="color: #67c23a">{{ ViolationTypeMap[row.violationType] || '无违规' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="complianceScore" label="合规分" width="80" align="center" />
          <el-table-column prop="redemptionAmount" label="核销金额" width="100" align="right">
            <template #default="{ row }">
              ¥{{ row.redemptionAmount?.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="redemptionTime" label="核销时间" width="170" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === RedemptionStatus.MANUAL_REVIEW"
                type="primary"
                link
                size="small"
                @click="openReviewDialog(row)"
              >
                复核
              </el-button>
              <el-button
                v-if="row.isRevocable === 1 && (row.status === RedemptionStatus.VERIFIED || row.status === RedemptionStatus.AUTO_PASSED)"
                type="danger"
                link
                size="small"
                @click="handleRevoke(row)"
              >
                撤销
              </el-button>
              <el-button type="info" link size="small" @click="handleTrace(row)">
                追溯
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="queryParams.total > 0">
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.pageSize"
            :total="queryParams.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadRecords"
            @current-change="loadRecords"
          />
        </div>
      </div>

      <el-dialog
        v-model="reviewDialogVisible"
        title="人工复核"
        width="500px"
        destroy-on-close
      >
        <div class="review-record-info" v-if="reviewRecord">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="记录ID">{{ reviewRecord.id }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ reviewRecord.userPhone }}</el-descriptions-item>
            <el-descriptions-item label="合规分数">{{ reviewRecord.complianceScore }}</el-descriptions-item>
            <el-descriptions-item label="违规类型">{{ ViolationTypeMap[reviewRecord.violationType] || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <el-form :model="reviewForm" label-width="80px" size="default" style="margin-top: 16px">
          <el-form-item label="审核动作">
            <el-radio-group v-model="reviewForm.action">
              <el-radio label="approve">通过</el-radio>
              <el-radio label="reject">驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="reviewForm.remark" type="textarea" :rows="3" placeholder="请输入审核备注" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="reviewing" @click="handleReview">确认提交</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  CircleCheckFilled, WarningFilled, EditPen, List, DataLine, User, Tickets, Warning, Refresh
} from '@element-plus/icons-vue'
import {
  preCheckRedemptionApi,
  submitRedemptionApi,
  getRedemptionListApi,
  getRedemptionStatsApi,
  manualReviewRedemptionApi,
  revokeRedemptionApi
} from '@/api/marketing'
import {
  RedemptionStatus,
  RedemptionStatusMap,
  RedemptionStatusTagType,
  AuditLevelMap,
  AuditLevelColorMap,
  ViolationTypeMap,
  ViolationTypeTagType,
  CampaignStatusMap
} from '@/enums/marketing'
import type { RedemptionRecord, PreCheckResult, RedemptionStats } from '@/types/marketing'

const props = defineProps<{
  campaignId: number
}>()

const emit = defineEmits<{
  (e: 'trace', record: RedemptionRecord): void
}>()

const skeletonLoading = ref(true)
const preCheckResult = ref<PreCheckResult | null>(null)
const statsData = ref<RedemptionStats | null>(null)
const recordList = ref<RedemptionRecord[]>([])
const tableLoading = ref(false)
const submitting = ref(false)
const submitResult = ref<any>(null)
const reviewing = ref(false)
const reviewDialogVisible = ref(false)
const reviewRecord = ref<RedemptionRecord | null>(null)
const formRef = ref<FormInstance>()

const formData = reactive({
  userId: '',
  userPhone: '',
  userLevel: 1,
  orderId: '',
  orderNo: '',
  redemptionCode: '',
  city: '',
  vehicleType: '',
  orderAmount: 0,
  redemptionAmount: 0
})

const formRules: FormRules = {
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  userPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  orderNo: [{ required: true, message: '请输入订单编号', trigger: 'blur' }],
  redemptionCode: [{ required: true, message: '请输入核销码', trigger: 'blur' }],
  orderAmount: [{ required: true, message: '请输入订单金额', trigger: 'blur' }],
  redemptionAmount: [{ required: true, message: '请输入核销金额', trigger: 'blur' }]
}

const reviewForm = reactive({
  action: 'approve' as 'approve' | 'reject',
  remark: ''
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  status: undefined as number | undefined,
  violationType: undefined as string | undefined
})

const statsCards = computed(() => {
  const s = statsData.value
  if (!s) return []
  return [
    {
      key: 'total',
      label: '核销总量',
      formatted: (s.total || 0).toLocaleString(),
      unit: '笔',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
      icon: DataLine,
      iconColor: '#764ba2'
    },
    {
      key: 'autoPassCount',
      label: '自动通过',
      formatted: (s.autoPassCount || 0).toLocaleString(),
      unit: '笔',
      icon: CircleCheckFilled,
      iconColor: '#67c23a'
    },
    {
      key: 'manualReviewCount',
      label: '人工复核',
      formatted: (s.manualReviewCount || 0).toLocaleString(),
      unit: '笔',
      icon: User,
      iconColor: '#e6a23c'
    },
    {
      key: 'violationRate',
      label: '违规率',
      formatted: ((s.violationRate || 0) * 100).toFixed(1) + '%',
      icon: Warning,
      iconColor: '#f56c6c'
    },
    {
      key: 'avgComplianceScore',
      label: '平均合规分',
      formatted: (s.avgComplianceScore || 0).toFixed(1),
      icon: Tickets,
      iconColor: '#409eff'
    }
  ]
})

const loadPreCheck = async () => {
  try {
    const res = await preCheckRedemptionApi(props.campaignId, {})
    preCheckResult.value = res.data as PreCheckResult
  } catch (e: any) {
    ElMessage.error(e.message || '预检查失败')
    preCheckResult.value = { canProceed: false, reason: '预检查请求失败' }
  }
}

const loadStats = async () => {
  try {
    const res = await getRedemptionStatsApi(props.campaignId)
    statsData.value = res.data as RedemptionStats
  } catch (e: any) {
    ElMessage.error(e.message || '加载统计失败')
  }
}

const loadRecords = async () => {
  tableLoading.value = true
  try {
    const params: Record<string, any> = {
      page: queryParams.page,
      pageSize: queryParams.pageSize
    }
    if (queryParams.status !== undefined && queryParams.status !== null) params.status = queryParams.status
    if (queryParams.violationType) params.violationType = queryParams.violationType
    const res = await getRedemptionListApi(props.campaignId, params)
    const data = res.data as any
    recordList.value = data.list || []
    queryParams.total = data.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载记录失败')
  } finally {
    tableLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await ElMessageBox.confirm(
      '确认提交核销？提交后将进入审核流程。',
      '二次确认',
      { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  submitting.value = true
  try {
    const res = await submitRedemptionApi(props.campaignId, { ...formData })
    submitResult.value = res.data
    ElMessage.success(submitResult.value.autoPassed ? '自动审核通过' : '已进入人工复核')
    loadRecords()
    loadStats()
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  submitResult.value = null
}

const openReviewDialog = (row: RedemptionRecord) => {
  reviewRecord.value = row
  reviewForm.action = 'approve'
  reviewForm.remark = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  if (!reviewRecord.value) return
  try {
    await ElMessageBox.confirm(
      `确认${reviewForm.action === 'approve' ? '通过' : '驳回'}该核销记录？`,
      '二次确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  reviewing.value = true
  try {
    await manualReviewRedemptionApi(reviewRecord.value.id, {
      action: reviewForm.action,
      remark: reviewForm.remark
    })
    ElMessage.success(reviewForm.action === 'approve' ? '已通过' : '已驳回')
    reviewDialogVisible.value = false
    loadRecords()
    loadStats()
  } catch (e: any) {
    ElMessage.error(e.message || '审核失败')
  } finally {
    reviewing.value = false
  }
}

const handleRevoke = async (row: RedemptionRecord) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入撤销原因',
      '撤销确认',
      {
        confirmButtonText: '确认撤销',
        cancelButtonText: '取消',
        type: 'warning',
        inputPattern: /.+/,
        inputErrorMessage: '撤销原因不能为空'
      }
    )
    await ElMessageBox.confirm(
      `确认撤销核销记录 #${row.id}？此操作不可逆。`,
      '二次确认',
      { confirmButtonText: '确认撤销', cancelButtonText: '取消', type: 'danger' }
    )
    await revokeRedemptionApi(row.id, { reason })
    ElMessage.success('已撤销')
    loadRecords()
    loadStats()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.message || '撤销失败')
    }
  }
}

const handleTrace = (row: RedemptionRecord) => {
  emit('trace', row)
}

const initLoad = async () => {
  skeletonLoading.value = true
  try {
    await Promise.all([loadPreCheck(), loadStats(), loadRecords()])
  } finally {
    skeletonLoading.value = false
  }
}

onMounted(initLoad)
watch(() => props.campaignId, initLoad)
</script>

<style lang="scss" scoped>
.redemption-audit-detail {
  .skeleton-wrap {
    padding: 20px;
  }

  .pre-check-bar {
    padding: 12px 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 13px;

    &.warning {
      background: #fdf6ec;
      color: #b88230;
      .el-icon { color: #e6a23c; }
    }
    &.success {
      background: #ecf5ff;
      color: #409eff;
      .el-icon { color: #67c23a; }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 18px;

    .stat-card {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 14px 16px;
      transition: all 0.2s;

      &.highlight {
        color: #fff;
        border-color: transparent;
      }
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
      }

      .stat-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
        .el-icon { font-size: 16px; }
        &.white { color: rgba(255, 255, 255, 0.85); }
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #303133;
        .unit {
          font-size: 12px;
          font-weight: 400;
          margin-left: 2px;
          opacity: 0.7;
        }
        &.white { color: #fff; }
      }
    }
  }

  .section-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 18px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .submit-result {
    margin-top: 16px;

    .result-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-top: 4px;
    }
  }

  .table-filter {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .review-record-info {
    margin-bottom: 12px;
  }
}
</style>
