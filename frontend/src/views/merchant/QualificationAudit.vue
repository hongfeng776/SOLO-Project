<template>
  <div class="qualification-audit-page">
    <div class="page-header">
      <h2>商家入驻资质审核</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshStats">刷新统计</el-button>
        <el-button type="warning" :icon="Clock" @click="handleCheckExpired">过期检查重置</el-button>
      </div>
    </div>

    <div class="stats-cards mb-20">
      <div class="stat-card">
        <div class="stat-label">待审核总数</div>
        <div class="stat-value" style="color: #faad14">{{ stats.pending || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已通过</div>
        <div class="stat-value" style="color: #52c41a">{{ stats.approved || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已驳回</div>
        <div class="stat-value" style="color: #ff4d4f">{{ stats.rejected || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已过期</div>
        <div class="stat-value" style="color: #909399">{{ stats.expired || 0 }}</div>
      </div>
      <div class="stat-card high-risk-card">
        <div class="stat-label">
          <el-icon><WarningFilled /></el-icon>
          高危行业待审
        </div>
        <div class="stat-value" style="color: #f5222d">{{ stats.highRisk || 0 }}</div>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="商家名称">
          <el-input v-model="searchForm.keyword" placeholder="商家名称/联系人/统一信用代码" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="业务品类">
          <el-select v-model="searchForm.businessType" placeholder="全部品类" clearable style="width: 140px">
            <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.auditStatus" placeholder="全部状态" clearable style="width: 140px">
            <el-option v-for="item in auditStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核层级">
          <el-select v-model="searchForm.auditLevel" placeholder="全部层级" clearable style="width: 120px">
            <el-option v-for="item in auditLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="商家类型">
          <el-select v-model="searchForm.merchantCategory" placeholder="全部类型" clearable style="width: 120px">
            <el-option v-for="item in merchantCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div v-if="selectedRows.length > 0" class="batch-action-bar ripple-bar">
        <div class="batch-info">
          已选择 <b>{{ selectedRows.length }}</b> 家商家
          <span v-if="hasHighRiskSelected" class="high-risk-tip">
            <el-icon><WarningFilled /></el-icon>
            含高危行业商家，禁止批量审核
          </span>
        </div>
        <div class="batch-actions">
          <el-button
            type="success"
            :icon="Check"
            :disabled="submitDisabled || hasHighRiskSelected"
            @click="handleBatchPass"
            v-ripple
          >批量通过</el-button>
          <el-button
            type="danger"
            :icon="Close"
            :disabled="submitDisabled || hasHighRiskSelected"
            @click="handleBatchReject"
            v-ripple
          >批量驳回</el-button>
          <el-button
            type="warning"
            :icon="Clock"
            :disabled="submitDisabled || hasHighRiskSelected"
            @click="handleBatchTemporary"
            v-ripple
          >批量暂存</el-button>
          <el-button @click="clearSelection">取消选择</el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        border
        stripe
        class="audit-table"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
        :row-class-name="getRowClassName"
        highlight-current-row
      >
        <el-table-column type="selection" width="50" :selectable="checkRowSelectable" />
        <el-table-column prop="id" label="ID" width="70" fixed="left" />
        <el-table-column label="商家信息" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="merchant-info-cell">
              <div class="merchant-name">{{ row.name }}</div>
              <div class="merchant-sub">
                <el-tag size="small" :color="getBusinessTypeColor(row.businessType)" effect="dark" style="border: none">
                  {{ getBusinessTypeLabel(row.businessType) }}
                </el-tag>
                <span v-if="row.merchantCategory === 2" class="high-risk-badge">
                  <el-icon><WarningFilled /></el-icon>高危
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="统一信用代码" width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.unifiedCreditCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)" size="small" effect="light">
              {{ getAuditStatusLabel(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入驻状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getSettleStatusType(row.settleStatus)" size="small">
              {{ getSettleStatusLabel(row.settleStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核层级" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.auditLevel === 2" type="danger" size="small">终审</el-tag>
            <el-tag v-else type="primary" size="small">初审</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资质完整度" width="130">
          <template #default="{ row }">
            <el-progress
              :percentage="calcQualificationRate(row)"
              :color="qualificationProgressColor(row)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="auditSubmitTime" label="提交时间" width="170" />
        <el-table-column prop="auditExpireTime" label="过期时间" width="170">
          <template #default="{ row }">
            <span v-if="row.auditExpireTime" :class="{ 'expired-text': isExpired(row.auditExpireTime) }">
              {{ row.auditExpireTime }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openAuditPanel(row)">资质审核</el-button>
            <el-button type="success" link size="small" @click="openTracePanel(row)">流程溯源</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <QualificationAuditPanel
      v-model="auditPanelVisible"
      :merchant="currentMerchant"
      @success="handleAuditSuccess"
      @submitting="handleSubmitting"
    />

    <AuditTracePanel
      v-model="tracePanelVisible"
      :merchant="currentMerchant"
    />

    <ResultDialog v-model="resultDialogVisible" :result="auditResult" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, Close, Clock, WarningFilled } from '@element-plus/icons-vue'
import {
  MerchantAuditStatusEnum,
  MerchantBusinessTypeEnum,
  MerchantCategoryEnum,
  SettleStatusEnum,
  AuditLevelEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions,
  getEnumColor
} from '@/utils/enums'
import {
  getAuditStats,
  getPendingAuditList,
  batchAuditPass,
  batchAuditReject,
  batchAuditTemporary,
  checkExpiredAudits
} from '@/api/merchant'
import QualificationAuditPanel from '@/components/Merchant/QualificationAuditPanel.vue'
import AuditTracePanel from '@/components/Merchant/AuditTracePanel.vue'
import ResultDialog from '@/components/Merchant/ResultDialog.vue'

const loading = ref(false)
const submitDisabled = ref(false)
const tableRef = ref(null)
const stats = reactive({ total: 0, pending: 0, approved: 0, rejected: 0, expired: 0, highRisk: 0 })
const selectedRows = ref([])
const auditPanelVisible = ref(false)
const tracePanelVisible = ref(false)
const currentMerchant = ref(null)
const resultDialogVisible = ref(false)
const auditResult = ref(null)

const searchForm = reactive({
  keyword: '',
  businessType: '',
  auditStatus: '',
  auditLevel: '',
  merchantCategory: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  {
    id: 1001, name: '中国国际航空官方旗舰店', contact: '王建国', phone: '13800138001',
    unifiedCreditCode: '9111000071093123XX', businessType: 'flight', auditStatus: 0, settleStatus: 2,
    auditLevel: 1, merchantCategory: 1, qualifications: [
      { category: 'business_license', auditResult: 0 }, { category: 'operation_permit', auditResult: 0 },
      { category: 'authorization', auditResult: 0 }, { category: 'legal_person', auditResult: 0 },
      { category: 'flight_permit', auditResult: 0 }
    ], auditSubmitTime: '2024-06-15 09:30:00', auditExpireTime: '2024-07-15 09:30:00'
  },
  {
    id: 1002, name: '希尔顿酒店集团旗舰店', contact: '李明华', phone: '13800138002',
    unifiedCreditCode: '9131000060738123XX', businessType: 'hotel', auditStatus: 0, settleStatus: 2,
    auditLevel: 1, merchantCategory: 1, qualifications: [
      { category: 'business_license', auditResult: 0 }, { category: 'operation_permit', auditResult: 0 },
      { category: 'authorization', auditResult: 0 }, { category: 'legal_person', auditResult: 0 },
      { category: 'hotel_permit', auditResult: 2 }
    ], auditSubmitTime: '2024-06-16 10:15:00', auditExpireTime: '2024-07-16 10:15:00'
  },
  {
    id: 1003, name: '神州租车官方旗舰店', contact: '张志强', phone: '13800138003',
    unifiedCreditCode: '9111010810118876XX', businessType: 'car', auditStatus: 7, settleStatus: 2,
    auditLevel: 1, merchantCategory: 1, qualifications: [
      { category: 'business_license', auditResult: 1 }, { category: 'operation_permit', auditResult: 1 },
      { category: 'authorization', auditResult: 1 }, { category: 'legal_person', auditResult: 0 },
      { category: 'car_permit', auditResult: 1 }
    ], auditSubmitTime: '2024-06-12 14:20:00', auditExpireTime: '2024-07-12 14:20:00'
  },
  {
    id: 1004, name: '同程文旅景区专营店', contact: '赵文博', phone: '13800138004',
    unifiedCreditCode: '9132050013478234XX', businessType: 'tourism', auditStatus: 6, settleStatus: 3,
    auditLevel: 2, merchantCategory: 1, qualifications: [
      { category: 'business_license', auditResult: 1 }, { category: 'operation_permit', auditResult: 1 },
      { category: 'authorization', auditResult: 1 }, { category: 'legal_person', auditResult: 1 },
      { category: 'ticket_permit', auditResult: 1 }
    ], auditSubmitTime: '2024-06-10 08:45:00', auditExpireTime: '2024-07-10 08:45:00'
  },
  {
    id: 1005, name: '深圳华强北金融租赁', contact: '钱伟明', phone: '13800138005',
    unifiedCreditCode: '91440300MA6X1234XX', businessType: 'car', auditStatus: 0, settleStatus: 2,
    auditLevel: 1, merchantCategory: 2, qualifications: [
      { category: 'business_license', auditResult: 0 }, { category: 'operation_permit', auditResult: 0 }
    ], auditSubmitTime: '2024-06-17 16:00:00', auditExpireTime: '2024-07-17 16:00:00'
  }
])

const businessTypeOptions = computed(() => getEnumOptions(MerchantBusinessTypeEnum))
const auditStatusOptions = computed(() => getEnumOptions(MerchantAuditStatusEnum))
const auditLevelOptions = computed(() => getEnumOptions(AuditLevelEnum))
const merchantCategoryOptions = computed(() => getEnumOptions(MerchantCategoryEnum))

const hasHighRiskSelected = computed(() => selectedRows.value.some(r => r.merchantCategory === 2))

const getBusinessTypeLabel = (v) => getEnumLabel(MerchantBusinessTypeEnum, v) || '未知'
const getBusinessTypeColor = (v) => getEnumColor(MerchantBusinessTypeEnum, v)
const getAuditStatusLabel = (v) => getEnumLabel(MerchantAuditStatusEnum, v) || '未知'
const getAuditStatusType = (v) => getEnumType(MerchantAuditStatusEnum, v) || 'info'
const getSettleStatusLabel = (v) => getEnumLabel(SettleStatusEnum, v) || '未知'
const getSettleStatusType = (v) => getEnumType(SettleStatusEnum, v) || 'info'

const calcQualificationRate = (row) => {
  const qs = row.qualifications || []
  if (qs.length === 0) return 0
  const passed = qs.filter(q => q.auditResult === 1).length
  return Math.round((passed / qs.length) * 100)
}

const qualificationProgressColor = (row) => {
  const rate = calcQualificationRate(row)
  const hasFailed = (row.qualifications || []).some(q => q.auditResult === 2)
  if (hasFailed) return '#ff4d4f'
  if (rate === 100) return '#52c41a'
  if (rate >= 60) return '#faad14'
  return '#909399'
}

const isExpired = (time) => {
  if (!time) return false
  return new Date(time) < new Date()
}

const checkRowSelectable = (row) => {
  return [0, 3, 4, 7].includes(row.auditStatus)
}

const getRowClassName = ({ row }) => {
  const classes = []
  if (selectedRows.value.find(s => s.id === row.id)) {
    classes.push('row-selected-highlight')
  }
  if (row.merchantCategory === 2) {
    classes.push('row-high-risk')
  }
  if ([1, 2].includes(row.auditStatus)) {
    classes.push('row-disabled')
  }
  return classes.join(' ')
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
  nextTick(() => {
    tableRef.value?.store?.states?.data?.forEach((row, i) => {
      const el = tableRef.value?.$el?.querySelectorAll('.el-table__body-wrapper tbody tr')[i]
      if (el) {
        if (val.find(s => s.id === row.id)) {
          el.classList.add('row-selected-anim')
        } else {
          el.classList.remove('row-selected-anim')
        }
      }
    })
  })
}

const handleRowDblclick = (row) => {
  openAuditPanel(row)
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

const refreshStats = async () => {
  try {
    const res = await getAuditStats()
    if (res?.code === 200 && res?.data) {
      Object.assign(stats, res.data)
    }
  } catch (e) {}
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.businessType = ''
  searchForm.auditStatus = ''
  searchForm.auditLevel = ''
  searchForm.merchantCategory = ''
  pagination.page = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await getPendingAuditList(params)
    if (res?.code === 200) {
      tableData.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const openAuditPanel = (row) => {
  currentMerchant.value = row
  auditPanelVisible.value = true
}

const openTracePanel = (row) => {
  currentMerchant.value = row
  tracePanelVisible.value = true
}

const handleSubmitting = (val) => {
  submitDisabled.value = val
}

const handleAuditSuccess = (result) => {
  auditResult.value = result
  resultDialogVisible.value = true
  clearSelection()
  fetchData()
  refreshStats()
}

const handleBatchPass = async () => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定批量通过选中的 ${selectedRows.value.length} 家商家审核吗？`,
      '批量审核通过确认',
      { type: 'warning', confirmButtonText: '确认通过', cancelButtonText: '取消' }
    )
    submitDisabled.value = true
    setTimeout(() => { submitDisabled.value = false }, 300)
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchAuditPass({ ids, remark: '批量审核通过' })
    if (res?.code === 200) {
      ElMessage.success(res.message || '批量审核通过完成')
      clearSelection()
      fetchData()
      refreshStats()
    }
  } catch (e) {}
}

const handleBatchReject = async () => {
  if (selectedRows.value.length === 0) return
  try {
    const { value: remark } = await ElMessageBox.prompt(
      `请输入批量驳回原因（将应用于 ${selectedRows.value.length} 家商家）`,
      '批量审核驳回',
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入驳回原因，如：资质材料缺失/信息不符等',
        inputValidator: v => !!v?.trim() || '驳回原因不能为空'
      }
    )
    submitDisabled.value = true
    setTimeout(() => { submitDisabled.value = false }, 300)
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchAuditReject({ ids, remark })
    if (res?.code === 200) {
      ElMessage.success(res.message || '批量驳回完成')
      clearSelection()
      fetchData()
      refreshStats()
    }
  } catch (e) {}
}

const handleBatchTemporary = async () => {
  if (selectedRows.value.length === 0) return
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入暂存备注（可选），共 ${selectedRows.value.length} 家商家`,
      '批量暂存',
      {
        confirmButtonText: '确认暂存',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入暂存备注（可选）'
      }
    )
    submitDisabled.value = true
    setTimeout(() => { submitDisabled.value = false }, 300)
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchAuditTemporary({ ids, remark: value || '' })
    if (res?.code === 200) {
      ElMessage.success(res.message || '批量暂存完成')
      clearSelection()
      fetchData()
      refreshStats()
    }
  } catch (e) {}
}

const handleCheckExpired = async () => {
  try {
    await ElMessageBox.confirm('确定执行审核过期检查？将重置超过期限未处理的商家审核状态。', '过期检查确认', { type: 'warning' })
    const res = await checkExpiredAudits()
    if (res?.code === 200) {
      ElMessage.success(res.message || '过期检查完成')
      fetchData()
      refreshStats()
    }
  } catch (e) {}
}

onMounted(() => {
  refreshStats()
  fetchData()
})
</script>
