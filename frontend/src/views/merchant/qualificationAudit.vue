<template>
  <div class="qualification-audit-page">
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="header-icon"><DataAnalysis /></el-icon>
            商家资质审核管理
          </span>
          <div class="header-actions">
            <el-button type="primary" :icon="Refresh" size="small" @click="refreshList">刷新</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商家名称">
          <el-input v-model="searchForm.name" placeholder="请输入商家名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="信用代码">
          <el-input v-model="searchForm.credit_code" placeholder="请输入信用代码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="入驻状态">
          <el-select v-model="searchForm.settle_status" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="opt in SETTLE_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="多状态筛选">
          <el-select v-model="searchForm.settle_status_list" multiple collapse-tags collapse-tags-tooltip placeholder="多选状态" clearable style="width: 240px">
            <el-option v-for="opt in SETTLE_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="String(opt.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="行业类型">
          <el-select v-model="searchForm.industry_type" placeholder="全部" clearable style="width: 130px">
            <el-option label="食品餐饮" value="食品餐饮" />
            <el-option label="服装鞋帽" value="服装鞋帽" />
            <el-option label="数码电器" value="数码电器" />
            <el-option label="美妆个护" value="美妆个护" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="执照到期">
          <el-date-picker
            v-model="searchForm.expire_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="入驻时间">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="stats-row">
        <div v-for="stat in statusStats" :key="stat.value" class="stat-item" :class="{ active: activeStatus === stat.value }" @click="toggleStatusFilter(stat.value)">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-count" :class="stat.type">{{ stat.count }}</div>
        </div>
      </div>

      <div v-if="selectedIds.length > 0" class="batch-action-bar">
        <span class="selected-info">
          <el-icon><Checked /></el-icon>
          已选择 <b>{{ selectedIds.length }}</b> 项
        </span>
        <el-button
          type="success"
          size="small"
          :icon="CircleCheck"
          :disabled="!canBatchApprove"
          @click="handleBatchApprove"
        >批量审核通过</el-button>
        <el-button
          type="danger"
          size="small"
          :icon="CircleClose"
          :disabled="!canBatchReject"
          @click="handleBatchReject"
        >批量驳回</el-button>
        <el-button
          type="warning"
          size="small"
          :icon="RefreshRight"
          @click="handleBatchReview"
        >批量发起复核</el-button>
        <el-button
          size="small"
          :icon="Bell"
          @click="handleBatchRemind"
        >批量发送提醒</el-button>
        <el-button
          type="danger"
          plain
          size="small"
          :icon="Lock"
          @click="handleBatchFreeze"
        >批量冻结权限</el-button>
        <el-button link type="primary" size="small" @click="clearSelection">取消选择</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="isSelectable" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="商家信息" min-width="220">
          <template #default="{ row }">
            <div class="merchant-info">
              <div class="name">{{ row.name }}</div>
              <div class="sub">
                <el-icon><User /></el-icon> {{ row.legal_person || '-' }}
                <el-icon style="margin-left: 10px"><Phone /></el-icon> {{ row.phone || '-' }}
              </div>
              <div class="sub credit">
                <el-icon><Tickets /></el-icon> {{ row.credit_code || row.business_license_no || '-' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="执照有效期" width="190" align="center">
          <template #default="{ row }">
            <div v-if="row.license_valid_from || row.license_valid_to" class="date-range">
              <span>{{ row.license_valid_from || '-' }}</span>
              <span class="sep">~</span>
              <span :class="{ 'expired-text': row.has_expired_qualification }">{{ row.license_valid_to || '-' }}</span>
            </div>
            <span v-else class="empty-text">未填写</span>
          </template>
        </el-table-column>
        <el-table-column prop="industry_type" label="行业" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.industry_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入驻状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.settle_status)" effect="light">
              {{ getStatusLabel(row.settle_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限状态" width="120" align="center">
          <template #default="{ row }">
            <div class="permission-status">
              <el-tag size="small" :type="row.shop_open_status === 1 ? 'success' : 'info'" effect="plain">
                店铺: {{ row.shop_open_status === 1 ? '开' : '关' }}
              </el-tag>
              <el-tag size="small" :type="row.goods_publish_permission === 1 ? 'success' : 'info'" effect="plain" style="margin-top: 4px">
                上架: {{ row.goods_publish_permission === 1 ? '允' : '禁' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资质备注" min-width="180">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.qualification_remark && row.qualification_remark.length > 40"
              effect="dark"
              placement="top"
            >
              <template #content>
                <div class="long-remark-tip">{{ row.qualification_remark }}</div>
              </template>
              <div class="remark-cell">
                {{ row.qualification_remark.slice(0, 40) }}...
                <el-icon class="more-icon"><View /></el-icon>
              </div>
            </el-tooltip>
            <span v-else>{{ row.qualification_remark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后审核" width="160" align="center">
          <template #default="{ row }">
            <div class="audit-time">
              <div>{{ row.last_audit_time || '暂无审核' }}</div>
              <el-tooltip v-if="row.audit_reason" effect="light" placement="top">
                <template #content>
                  <div style="max-width: 300px">{{ row.audit_reason }}</div>
                </template>
                <div class="reason-preview">
                  <el-icon><InfoFilled /></el-icon> 查看原因
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon> 溯源
            </el-button>
            <el-button link type="primary" size="small" @click="handleQualificationSubmit(row)">
              <el-icon><Edit /></el-icon> 补传
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              :disabled="row.settle_status !== 1"
              @click="handleApprove(row)"
            >
              <el-icon><CircleCheck /></el-icon> 通过
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              :disabled="row.settle_status !== 1"
              @click="handleReject(row)"
            >
              <el-icon><CircleClose /></el-icon> 驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog
      v-model="auditDialogVisible"
      :title="auditDialogTitle"
      width="780px"
      class="audit-dialog"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <div v-if="currentAuditRow" class="audit-dialog-content">
        <div class="merchant-banner">
          <div class="banner-main">
            <div class="m-name">{{ currentAuditRow.name }}</div>
            <div class="m-meta">
              <el-tag :type="getStatusTagType(currentAuditRow.settle_status)" size="small">
                {{ getStatusLabel(currentAuditRow.settle_status) }}
              </el-tag>
              <span>法人：{{ currentAuditRow.legal_person || '-' }}</span>
              <span>电话：{{ currentAuditRow.phone || '-' }}</span>
            </div>
          </div>
          <div class="banner-stats">
            <div class="stat"><span>执照有效期</span><b>{{ currentAuditRow.license_valid_from }} ~ {{ currentAuditRow.license_valid_to }}</b></div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="audit-tabs">
          <el-tab-pane label="资质材料列表" name="materials">
            <el-table :data="qualificationList" size="small" border>
              <el-table-column label="类型" width="130">
                <template #default="{ row }">
                  <el-tag size="small" type="primary">{{ getQualTypeLabel(row.qualification_type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="证件编号" min-width="150">
                <template #default="{ row }">{{ row.certificate_no || '-' }}</template>
              </el-table-column>
              <el-table-column label="有效期" width="180">
                <template #default="{ row }">
                  <span>{{ row.valid_from || '-' }} ~ {{ row.expire_date || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="核验" width="90" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.verification_status === 1" type="success" size="small">通过</el-tag>
                  <el-tag v-else-if="row.verification_status === 2" type="danger" size="small">不通过</el-tag>
                  <el-tag v-else-if="row.verification_status === 3" type="warning" size="small">异常</el-tag>
                  <el-tag v-else type="info" size="small">未核验</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="文件" width="100" align="center">
                <template #default="{ row }">
                  <el-link v-if="row.file_url" type="primary" :href="row.file_url" target="_blank" :icon="View">查看</el-link>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column v-if="isRejectMode || isApproveMode" label="审核意见" min-width="200">
                <template #default="{ row }">
                  <el-input
                    v-model="row._audit_opinion"
                    type="textarea"
                    :rows="1"
                    placeholder="填写单项意见"
                  />
                  <div class="flags-row">
                    <el-checkbox v-model="row._missing_flag">缺失</el-checkbox>
                    <el-checkbox v-model="row._violation_flag">违规</el-checkbox>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="审核操作" name="action">
            <div v-if="isRejectMode" class="reject-panel">
              <el-form :model="rejectForm" label-width="120px">
                <el-form-item label="驳回原因" required>
                  <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请详细填写驳回原因" maxlength="1000" show-word-limit />
                </el-form-item>
                <el-form-item label="缺失材料">
                  <el-select
                    v-model="rejectForm.missing_materials"
                    multiple
                    filterable
                    allow-create
                    placeholder="选择或输入缺失的材料"
                    style="width: 100%"
                  >
                    <el-option label="营业执照原件" value="营业执照原件" />
                    <el-option label="法人身份证正面" value="法人身份证正面" />
                    <el-option label="法人身份证反面" value="法人身份证反面" />
                    <el-option label="行业资质证书" value="行业资质证书" />
                    <el-option label="品牌授权书" value="品牌授权书" />
                  </el-select>
                </el-form-item>
                <el-form-item label="违规点">
                  <el-select
                    v-model="rejectForm.violation_points"
                    multiple
                    filterable
                    allow-create
                    placeholder="选择或输入违规点"
                    style="width: 100%"
                  >
                    <el-option label="证件信息与工商不符" value="证件信息与工商不符" />
                    <el-option label="材料PS伪造痕迹" value="材料PS伪造痕迹" />
                    <el-option label="资质已过期" value="资质已过期" />
                    <el-option label="营业执照经营范围不符" value="营业执照经营范围不符" />
                    <el-option label="品牌授权未覆盖商品类目" value="品牌授权未覆盖商品类目" />
                  </el-select>
                </el-form-item>
                <el-form-item label="需要补传">
                  <el-switch v-model="rejectForm.need_resubmit" />
                </el-form-item>
                <el-form-item v-if="rejectForm.need_resubmit" label="补传截止">
                  <el-date-picker v-model="rejectForm.resubmit_deadline" type="date" value-format="YYYY-MM-DD" style="width: 260px" />
                </el-form-item>
              </el-form>
            </div>

            <div v-else-if="isApproveMode" class="approve-panel">
              <el-alert type="success" show-icon :closable="false" class="approve-tip">
                审核通过后将自动开通店铺权限和商品上架权限
              </el-alert>
              <el-form :model="approveForm" label-width="120px" style="margin-top: 20px">
                <el-form-item label="审核说明">
                  <el-input v-model="approveForm.reason" type="textarea" :rows="3" placeholder="可填写审核通过意见（选填）" maxlength="1000" show-word-limit />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button v-if="isApproveMode" type="success" :icon="Check" :loading="auditSubmitting" @click="submitApprove">确认通过</el-button>
        <el-button v-else-if="isRejectMode" type="danger" :icon="Close" :loading="auditSubmitting" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="remindDialogVisible"
      title="批量发送提醒"
      width="480px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="remindForm" label-width="100px">
        <el-form-item label="提醒类型">
          <el-radio-group v-model="remindForm.reminder_type">
            <el-radio value="expire">资质即将过期</el-radio>
            <el-radio value="resubmit">补传材料</el-radio>
            <el-radio value="review">资质复核</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提醒内容">
          <el-input v-model="remindForm.message" type="textarea" :rows="3" placeholder="自定义提醒内容，选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remindDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchOperating" @click="submitRemind">确认发送</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="freezeDialogVisible"
      title="批量冻结权限"
      width="480px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="freezeForm" label-width="100px">
        <el-form-item label="冻结权限">
          <el-checkbox-group v-model="freezeForm.freeze_permissions">
            <el-checkbox value="shop">店铺访问权限</el-checkbox>
            <el-checkbox value="goods">商品上架权限</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="冻结原因">
          <el-input v-model="freezeForm.reason" type="textarea" :rows="3" placeholder="请填写冻结原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="freezeDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="batchOperating" @click="submitFreeze">确认冻结</el-button>
      </template>
    </el-dialog>

    <QualificationTraceDialog
      v-model="traceDialogVisible"
      :merchant-id="traceMerchantId"
    />

    <QualificationSubmitDialog
      v-model="submitDialogVisible"
      :merchant-id="submitMerchantId"
      :initial-data="submitInitialData"
      :is-resubmit="true"
      @submitted="onQualSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis, Refresh, Search, RefreshLeft, Checked, CircleCheck, CircleClose,
  RefreshRight, Bell, Lock, User, Phone, Tickets, View, Edit, InfoFilled, Close, Check
} from '@element-plus/icons-vue'
import type { ElTable, ElMessageBoxOptions } from 'element-plus'
import {
  SETTLE_STATUS_OPTIONS, QUALIFICATION_TYPE_OPTIONS,
  getSettleMerchantList, approveMerchantAudit, rejectMerchantAudit,
  reviewMerchantQualification, getAuditDetail,
  batchApproveMerchant, batchRejectMerchant, batchReviewQualification,
  batchRemindMerchant, batchFreezeMerchant,
  type MerchantAuditSettleItem
} from '@/api/merchantQualification'
import QualificationTraceDialog from './components/QualificationTraceDialog.vue'
import QualificationSubmitDialog from './components/QualificationSubmitDialog.vue'

const loading = ref(false)
const tableRef = ref<any>()
const selectedIds = ref<number[]>([])
const selectedRows = ref<MerchantAuditSettleItem[]>([])
const tableData = ref<MerchantAuditSettleItem[]>([])
const statusStats = ref<any[]>([])

const searchForm = reactive({
  name: '',
  phone: '',
  credit_code: '',
  settle_status: undefined as number | undefined,
  settle_status_list: [] as string[],
  industry_type: '',
  expire_range: [] as string[],
  date_range: [] as string[],
})

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const activeStatus = ref<number | undefined>(undefined)

const auditDialogVisible = ref(false)
const auditMode = ref<'approve' | 'reject'>('approve')
const currentAuditRow = ref<MerchantAuditSettleItem | null>(null)
const auditDialogTitle = computed(() => auditMode.value === 'approve' ? '审核通过' : '审核驳回')
const isApproveMode = computed(() => auditMode.value === 'approve')
const isRejectMode = computed(() => auditMode.value === 'reject')
const activeTab = ref('materials')
const auditSubmitting = ref(false)
const qualificationList = ref<any[]>([])

const approveForm = reactive({ reason: '' })
const rejectForm = reactive({
  reason: '',
  missing_materials: [] as string[],
  violation_points: [] as string[],
  need_resubmit: true,
  resubmit_deadline: '',
})

const remindDialogVisible = ref(false)
const remindForm = reactive({ reminder_type: 'resubmit' as 'expire' | 'resubmit' | 'review', message: '' })
const freezeDialogVisible = ref(false)
const freezeForm = reactive({ reason: '', freeze_permissions: ['shop', 'goods'] as Array<'shop' | 'goods' | 'all'> })
const batchOperating = ref(false)

const traceDialogVisible = ref(false)
const traceMerchantId = ref<number | undefined>(undefined)

const submitDialogVisible = ref(false)
const submitMerchantId = ref<number | undefined>(undefined)
const submitInitialData = ref<MerchantAuditSettleItem | null>(null)

const canBatchApprove = computed(() => selectedRows.value.every(r => r.settle_status === 1))
const canBatchReject = computed(() => selectedRows.value.every(r => r.settle_status === 1))

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined;
const getStatusTagType = (status?: number): TagType => {
  const opt = SETTLE_STATUS_OPTIONS.find(o => o.value === status)
  return (opt?.type as TagType) || 'info'
}
const getStatusLabel = (status?: number) => {
  const opt = SETTLE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}
const getQualTypeLabel = (type: string) => {
  const opt = QUALIFICATION_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || type
}
const isSelectable = (row: MerchantAuditSettleItem) => [1, 3, 4, 5].includes(row.settle_status ?? -1)

const fetchList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      phone: searchForm.phone || undefined,
      credit_code: searchForm.credit_code || undefined,
      settle_status: searchForm.settle_status,
      settle_status_list: searchForm.settle_status_list.length > 0 ? searchForm.settle_status_list.join(',') : undefined,
      industry_type: searchForm.industry_type || undefined,
      license_expire_start: searchForm.expire_range?.[0],
      license_expire_end: searchForm.expire_range?.[1],
      startDate: searchForm.date_range?.[0],
      endDate: searchForm.date_range?.[1],
    }
    const res = await getSettleMerchantList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
    computeStats()
  } finally {
    loading.value = false
  }
}

const computeStats = () => {
  const allList = tableData.value
  const counts: Record<number, number> = {}
  for (const opt of SETTLE_STATUS_OPTIONS) counts[opt.value] = 0
  for (const row of allList) counts[row.settle_status ?? -1] = (counts[row.settle_status ?? -1] || 0) + 1
  statusStats.value = SETTLE_STATUS_OPTIONS.slice(0, 6).map(opt => ({
    ...opt, count: counts[opt.value] || 0,
  }))
}

const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '', phone: '', credit_code: '', settle_status: undefined,
    settle_status_list: [], industry_type: '', expire_range: [], date_range: [],
  })
  activeStatus.value = undefined
  pagination.page = 1
  fetchList()
}

const refreshList = () => fetchList()

const toggleStatusFilter = (val: number) => {
  activeStatus.value = activeStatus.value === val ? undefined : val
  searchForm.settle_status = activeStatus.value
  pagination.page = 1
  fetchList()
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

const openAuditDialog = async (row: MerchantAuditSettleItem, mode: 'approve' | 'reject') => {
  auditMode.value = mode
  currentAuditRow.value = row
  qualificationList.value = []
  Object.assign(approveForm, { reason: '' })
  Object.assign(rejectForm, { reason: '', missing_materials: [], violation_points: [], need_resubmit: true, resubmit_deadline: '' })
  auditDialogVisible.value = true
  activeTab.value = 'materials'
  try {
    const detailRes = await getAuditDetail(row.id)
    const quals = (detailRes.data?.qualifications || []).map((q: any) => ({
      ...q,
      _audit_opinion: q.audit_opinion || '',
      _missing_flag: !!q.missing_flag,
      _violation_flag: !!q.violation_flag,
    }))
    qualificationList.value = quals
  } catch (_e) {}
}

const handleApprove = (row: any) => openAuditDialog(row as MerchantAuditSettleItem, 'approve')
const handleReject = (row: any) => openAuditDialog(row as MerchantAuditSettleItem, 'reject')
const handleViewDetail = (row: any) => {
  traceMerchantId.value = (row as MerchantAuditSettleItem).id
  traceDialogVisible.value = true
}
const handleQualificationSubmit = (row: any) => {
  submitMerchantId.value = (row as MerchantAuditSettleItem).id
  submitInitialData.value = row as MerchantAuditSettleItem
  submitDialogVisible.value = true
}
const onQualSubmitted = () => {
  submitDialogVisible.value = false
  fetchList()
  ElMessage.success('补传材料提交成功')
}

const handleDialogClosed = () => {
  currentAuditRow.value = null
  qualificationList.value = []
}

const submitApprove = async () => {
  if (!currentAuditRow.value) return
  const qualification_opinions = qualificationList.value
    .filter(q => q._audit_opinion || q._missing_flag || q._violation_flag)
    .map(q => ({
      qualification_id: q.id,
      audit_opinion: q._audit_opinion || undefined,
      missing_flag: q._missing_flag ? 1 : 0,
      violation_flag: q._violation_flag ? 1 : 0,
      status: 1,
    }))
  auditSubmitting.value = true
  try {
    await approveMerchantAudit({
      merchant_id: currentAuditRow.value.id,
      reason: approveForm.reason,
      qualification_opinions,
    })
    ElMessage.success('审核通过成功，已开通店铺及商品上架权限')
    auditDialogVisible.value = false
    fetchList()
  } catch (e: any) {
    ElMessage.error(e?.message || '审核失败')
  } finally {
    auditSubmitting.value = false
  }
}

const submitReject = async () => {
  if (!currentAuditRow.value) return
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const qualification_opinions = qualificationList.value
    .filter(q => q._audit_opinion || q._missing_flag || q._violation_flag)
    .map(q => ({
      qualification_id: q.id,
      audit_opinion: q._audit_opinion || undefined,
      missing_flag: q._missing_flag ? 1 : 0,
      violation_flag: q._violation_flag ? 1 : 0,
      status: 2,
    }))
  auditSubmitting.value = true
  try {
    await rejectMerchantAudit({
      merchant_id: currentAuditRow.value.id,
      reason: rejectForm.reason,
      missing_materials: rejectForm.missing_materials,
      violation_points: rejectForm.violation_points,
      need_resubmit: rejectForm.need_resubmit ? 1 : 0,
      resubmit_deadline: rejectForm.resubmit_deadline,
      qualification_opinions,
    })
    ElMessage.success('审核驳回成功')
    auditDialogVisible.value = false
    fetchList()
  } catch (e: any) {
    ElMessage.error(e?.message || '审核失败')
  } finally {
    auditSubmitting.value = false
  }
}

const confirmAction = async (msg: string, opts: Partial<ElMessageBoxOptions> = {}) => {
  return ElMessageBox.confirm(msg, '操作确认', {
    type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
    ...opts,
  })
}

const handleBatchApprove = async () => {
  try {
    await confirmAction(`确定要审核通过选中的 ${selectedIds.value.length} 个商家吗？`)
    batchOperating.value = true
    const res = await batchApproveMerchant({ merchant_ids: selectedIds.value })
    ElMessage.success(`批量通过：成功 ${res.data?.success} 失败 ${res.data?.failed}`)
    fetchList()
    clearSelection()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  } finally { batchOperating.value = false }
}

const handleBatchReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请填写批量驳回原因', '批量驳回', {
      confirmButtonText: '确认驳回', cancelButtonText: '取消', inputPlaceholder: '必填：批量驳回原因',
      inputType: 'textarea', inputValidator: (v) => !!v?.trim() || '驳回原因不能为空',
    })
    batchOperating.value = true
    const res = await batchRejectMerchant({ merchant_ids: selectedIds.value, reason })
    ElMessage.success(`批量驳回：成功 ${res.data?.success} 失败 ${res.data?.failed}`)
    fetchList()
    clearSelection()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  } finally { batchOperating.value = false }
}

const handleBatchReview = async () => {
  try {
    await confirmAction(`确定要对选中的 ${selectedIds.value.length} 个商家发起资质复核吗？`)
    batchOperating.value = true
    const res = await batchReviewQualification({ merchant_ids: selectedIds.value })
    ElMessage.success(`批量复核：成功 ${res.data?.success} 失败 ${res.data?.failed}`)
    fetchList()
    clearSelection()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  } finally { batchOperating.value = false }
}

const handleBatchRemind = () => { remindDialogVisible.value = true }
const submitRemind = async () => {
  try {
    batchOperating.value = true
    const res = await batchRemindMerchant({
      merchant_ids: selectedIds.value,
      reminder_type: remindForm.reminder_type,
      message: remindForm.message,
    })
    ElMessage.success(`批量提醒：成功 ${res.data?.success} 失败 ${res.data?.failed}`)
    remindDialogVisible.value = false
    clearSelection()
  } catch (e: any) { ElMessage.error(e?.message || '操作失败') }
  finally { batchOperating.value = false }
}

const handleBatchFreeze = () => { freezeDialogVisible.value = true }
const submitFreeze = async () => {
  if (freezeForm.freeze_permissions.length === 0) {
    ElMessage.warning('请选择要冻结的权限')
    return
  }
  if (!freezeForm.reason.trim()) {
    ElMessage.warning('请填写冻结原因')
    return
  }
  try {
    batchOperating.value = true
    const res = await batchFreezeMerchant({
      merchant_ids: selectedIds.value,
      reason: freezeForm.reason,
      freeze_permissions: freezeForm.freeze_permissions,
    })
    ElMessage.success(`批量冻结：成功 ${res.data?.success} 失败 ${res.data?.failed}`)
    freezeDialogVisible.value = false
    fetchList()
    clearSelection()
  } catch (e: any) { ElMessage.error(e?.message || '操作失败') }
  finally { batchOperating.value = false }
}

onMounted(() => { fetchList() })
</script>

<style lang="scss" scoped>
.qualification-audit-page {
  .section-card { margin-bottom: 20px; }
  .card-header {
    display: flex; justify-content: space-between; align-items: center;
    .title {
      display: flex; align-items: center; font-size: 16px; font-weight: 600;
      .header-icon { margin-right: 8px; color: var(--el-color-primary); }
    }
  }
  .search-form { margin-bottom: 16px; }
  .stats-row {
    display: flex; gap: 12px; margin-bottom: 16px; padding: 12px;
    background: #f5f7fa; border-radius: 8px;
    .stat-item {
      flex: 1; padding: 12px; background: #fff; border-radius: 6px;
      cursor: pointer; transition: all .2s; border: 2px solid transparent;
      &.active { border-color: var(--el-color-primary); background: #ecf5ff; }
      .stat-label { font-size: 12px; color: var(--el-text-color-secondary); }
      .stat-count { font-size: 22px; font-weight: 600; margin-top: 4px;
        &.success { color: var(--el-color-success); }
        &.warning { color: var(--el-color-warning); }
        &.danger { color: var(--el-color-danger); }
        &.info { color: var(--el-color-info); }
      }
    }
  }
  .batch-action-bar {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: #fff7e6; border: 1px solid #ffd591; border-radius: 6px; margin-bottom: 12px;
    .selected-info { margin-right: 12px; display: flex; align-items: center; gap: 4px; b { color: var(--el-color-primary); } }
  }
  .merchant-info {
    .name { font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 4px; }
    .sub { display: flex; align-items: center; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
    .credit { margin-top: 2px; }
  }
  .date-range { display: flex; flex-direction: column; align-items: center; font-size: 12px;
    .sep { margin: 2px 0; color: var(--el-text-color-placeholder); }
    .expired-text { color: var(--el-color-danger); font-weight: 600; }
  }
  .empty-text { color: var(--el-text-color-placeholder); }
  .permission-status { display: flex; flex-direction: column; align-items: center; }
  .remark-cell { cursor: help; color: var(--el-text-color-regular);
    .more-icon { color: var(--el-color-primary); }
  }
  .long-remark-tip { max-width: 420px; white-space: pre-wrap; }
  .audit-time { font-size: 12px;
    .reason-preview { margin-top: 2px; color: var(--el-color-primary); cursor: help; display: inline-flex; align-items: center; gap: 2px; }
  }
  .pagination { margin-top: 20px; justify-content: flex-end; display: flex; }

  .audit-dialog {
    .merchant-banner {
      display: flex; justify-content: space-between; padding: 16px;
      background: linear-gradient(135deg, #ecf5ff, #f0f9eb); border-radius: 8px; margin-bottom: 16px;
      .m-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
      .m-meta { display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--el-text-color-secondary); }
      .stat { text-align: right; span { display: block; font-size: 12px; color: var(--el-text-color-secondary); } }
    }
    .flags-row { display: flex; gap: 12px; margin-top: 4px; }
    .approve-tip { margin-bottom: 4px; }
  }
}
</style>
