<template>
  <div class="benefit-manage-page">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>用户权益运维管理</h2>
      <div style="display: flex; gap: 10px;">
        <el-button type="primary" :icon="Plus" @click="grantDialogVisible = true">发放权益</el-button>
        <el-button type="warning" :icon="Histogram" :disabled="selectedIds.length === 0" @click="batchDialogVisible = true">批量操作</el-button>
        <el-button :icon="Refresh" @click="fetchAll">刷新数据</el-button>
      </div>
    </div>

    <div :class="['benefit-stats', 'fade-refresh']" :key="statsRefreshKey" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 20px;">
      <div
        v-for="(type, typeKey) in typeStatList"
        :key="typeKey"
        :class="['benefit-stats-card', `type-${type.value}`]"
        style="background: #fff; border-radius: 10px; padding: 18px 20px; border: 1px solid #ebeef5;"
      >
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 14px; color: #606266;">{{ type.label }}</span>
          <el-icon :size="24" :color="type.color">
            <component :is="getTypeIcon(type.value)" />
          </el-icon>
        </div>
        <div class="value-text" :style="{ color: type.color }">{{ stats.byType?.[type.value]?.count || 0 }}</div>
        <div style="margin-top: 6px; font-size: 12px; color: #909399;">
          可用 {{ getRemain(type.value) }} &nbsp;·&nbsp; 已发 {{ getUsed(type.value) }}
        </div>
      </div>
    </div>

    <div class="filter-section" style="background: #fff; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px;">
      <el-tabs v-model="filterForm.benefitType" class="benefit-tabs">
        <el-tab-pane label="全部" :name="null"><span>全部权益</span></el-tab-pane>
        <el-tab-pane :label="benefitTypeLabel(1)" :name="1" />
        <el-tab-pane :label="benefitTypeLabel(2)" :name="2" />
        <el-tab-pane :label="benefitTypeLabel(3)" :name="3" />
        <el-tab-pane :label="benefitTypeLabel(4)" :name="4" />
      </el-tabs>

      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;">
        <div style="flex: 1; min-width: 240px;">
          <div style="font-size: 12px; color: #606266; margin-bottom: 4px;">关键词（权益名/编码/用户）</div>
          <el-input v-model="filterForm.keyword" placeholder="搜索" clearable />
        </div>
        <div style="min-width: 140px;">
          <div style="font-size: 12px; color: #606266; margin-bottom: 4px;">状态</div>
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div style="min-width: 140px;">
          <div style="font-size: 12px; color: #606266; margin-bottom: 4px;">用户等级</div>
          <el-select v-model="filterForm.userLevel" placeholder="全部等级" clearable style="width: 140px;">
            <el-option v-for="item in userLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div style="min-width: 300px;">
          <div style="font-size: 12px; color: #606266; margin-bottom: 4px;">发放时间</div>
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="table-card" style="background: #fff; border-radius: 8px; padding: 20px;">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        @selection-change="handleSelectionChange"
        size="default"
        style="width: 100%;"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="所属用户" width="160">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="30">{{ row.user?.nickname?.charAt?.(0) || 'U' }}</el-avatar>
              <div>
                <div style="font-size: 13px; font-weight: 500;">{{ row.user?.nickname || '-' }}</div>
                <div style="font-size: 11px; color: #909399;">Lv.{{ row.user?.userLevel || '-' }} {{ row.user?.phone || '' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="权益类型" width="120">
          <template #default="{ row }">
            <el-tag :color="benefitTypeColor(row.benefitType)" effect="dark" size="small">
              {{ benefitTypeLabel(row.benefitType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权益名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.benefitName }}</span>
            <div style="font-size: 11px; color: #909399;">
              编码：{{ row.benefitKey }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数量/面额" width="130">
          <template #default="{ row }">
            <div>
              <span style="color: #303133;">
                {{ row.remainQuantity }} / {{ row.totalQuantity }}
                {{ unitLabel(row.unitType) }}
              </span>
              <div style="font-size: 11px; color: #1890ff; margin-top: 2px;" v-if="row.amountValue > 0">
                面额 ¥{{ row.amountValue }} {{ row.unitType === 'discount' ? '折' : '' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            <span class="text-ellipsis-narrow" :title="formatRange(row.validFrom, row.validTo)">
              {{ formatRange(row.validFrom, row.validTo) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <span :style="{ color: sourceColor(row.source) }">{{ sourceLabel(row.source) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" type="primary" class="action-btn" @click="handleReissue(row)">补发</el-button>
            <el-button link size="small" type="warning" class="action-btn warning-btn" @click="handleExtend(row)">延期</el-button>
            <el-button link size="small" type="danger" class="action-btn danger-btn" :disabled="row.status === 0" @click="handleVoid(row)">作废</el-button>
            <el-button link size="small" type="success" @click="handleTrace(row)">溯源</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog
      v-model="grantDialogVisible"
      title="发放权益"
      width="640px"
      :close-on-click-modal="false"
      custom-class="benefit-dialog-pop"
    >
      <el-form :model="grantForm" label-width="110px" ref="grantFormRef" :rules="grantRules">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="用户">
              <el-input v-model="grantForm.username" placeholder="手机号/用户ID搜索用户" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权益类型" prop="benefitType">
              <el-select v-model="grantForm.benefitType" placeholder="请选择" @change="handleTypeChange" style="width: 100%;">
                <el-option v-for="t in typeStatList" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="快捷模板">
              <el-select v-model="grantForm.template" placeholder="选择模板" clearable @change="handleTemplateSelect" style="width: 100%;">
                <el-option
                  v-for="t in matchedTemplates"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权益编码" prop="benefitKey">
              <el-input v-model="grantForm.benefitKey" placeholder="如 coupon_flight_50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权益名称" prop="benefitName">
              <el-input v-model="grantForm.benefitName" placeholder="如 机票满500减50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发放数量" prop="totalQuantity">
              <el-input-number v-model="grantForm.totalQuantity" :min="1" :max="1000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面额/面值">
              <el-input-number v-model="grantForm.amountValue" :min="0" :step="10" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用门槛">
              <el-input-number v-model="grantForm.minAmount" :min="0" :step="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级要求">
              <el-select v-model="grantForm.levelRequired" style="width: 100%;">
                <el-option label="不限（普通+）" :value="1" />
                <el-option label="商旅用户及以上" :value="2" />
                <el-option label="VIP用户专属" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="生效周期">
              <el-date-picker
                v-model="grantForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="生效日"
                end-placeholder="失效日"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="权益说明">
              <el-input v-model="grantForm.benefitDesc" type="textarea" :rows="2" placeholder="补充说明" />
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="validateIssues.length > 0" style="padding: 10px 14px; background: #fff2f0; border-radius: 6px; border: 1px solid #ffccc7; margin-bottom: 12px;">
          <div
            v-for="(issue, idx) in validateIssues"
            :key="idx"
            class="field-error"
          >
            <el-icon style="vertical-align: middle; margin-right: 4px;"><Warning /></el-icon>
            {{ issue.message }}
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="grantDialogVisible = false">取消</el-button>
        <el-button @click="handleValidateOnly">仅校验</el-button>
        <el-button type="primary" :loading="grantLoading" @click="handleGrant">确认发放</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reissueDialogVisible" title="补发权益" width="460px" custom-class="benefit-dialog-pop">
      <el-form :model="reissueForm" label-width="100px">
        <el-form-item label="原权益">
          <el-input v-model="reissueForm.displayName" disabled />
        </el-form-item>
        <el-form-item label="补发数量">
          <el-input-number v-model="reissueForm.totalQuantity" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="新有效期">
          <el-date-picker
            v-model="reissueForm.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="生效日"
            end-placeholder="失效日"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="补发原因">
          <el-input v-model="reissueForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reissueDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReissueSubmit">确认补发</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="extendDialogVisible" title="延期权益" width="440px" custom-class="benefit-dialog-pop">
      <el-form :model="extendForm" label-width="100px">
        <el-form-item label="当前失效">
          <el-input :value="extendForm.originTo" disabled />
        </el-form-item>
        <el-form-item label="新失效时间" prop="validTo">
          <el-date-picker v-model="extendForm.validTo" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="延期说明">
          <el-input v-model="extendForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="extendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExtendSubmit">确认延期</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="用户权益全流程溯源"
      width="860px"
      :close-on-click-modal="false"
    >
      <BenefitTracePanel
        v-if="traceUserId"
        :user-id="traceUserId"
        :benefit-id="traceBenefitId"
      />
    </el-dialog>

    <BenefitBatchPanel
      v-if="batchDialogVisible"
      :selected-ids="selectedIds"
      :selected-rows="selectedRows"
      @success="handleBatchSuccess"
      @cancel="batchDialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Histogram,
  Refresh,
  Warning,
  Present,
  Medal,
  StarFilled,
  OfficeBuilding,
  Ticket
} from '@element-plus/icons-vue'
import {
  BenefitTypeEnum,
  BenefitStatusEnum,
  BenefitUnitEnum,
  BenefitSourceEnum,
  BenefitTemplateOptions,
  UserLevelEnum,
  getEnumLabel,
  getEnumColor,
  getEnumOptions
} from '@/utils/enums'
import {
  getBenefitList,
  getBenefitStats,
  grantBenefit,
  validateBenefit,
  reissueBenefit,
  voidBenefit,
  extendBenefit
} from '@/api/benefit'
import BenefitTracePanel from '@/components/Benefit/BenefitTracePanel.vue'
import BenefitBatchPanel from '@/components/Benefit/BenefitBatchPanel.vue'

const loading = ref(false)
const grantLoading = ref(false)
const statsRefreshKey = ref(0)
const grantDialogVisible = ref(false)
const reissueDialogVisible = ref(false)
const extendDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const traceUserId = ref(null)
const traceBenefitId = ref(null)
const selectedIds = ref([])
const selectedRows = ref([])
const grantFormRef = ref(null)
const validateIssues = ref([])

const filterForm = reactive({
  benefitType: null,
  keyword: '',
  status: null,
  userLevel: null,
  dateRange: []
})

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const stats = reactive({
  totalCount: 0,
  validCount: 0,
  todayNew: 0,
  byType: {},
  byStatus: {}
})

const tableData = ref([])

const typeStatList = Object.keys(BenefitTypeEnum).map(k => ({
  key: k,
  value: BenefitTypeEnum[k].value,
  label: BenefitTypeEnum[k].label,
  color: BenefitTypeEnum[k].color
}))

const statusOptions = getEnumOptions(BenefitStatusEnum)
const userLevelOptions = getEnumOptions(UserLevelEnum)

const matchedTemplates = computed(() => {
  const bt = grantForm.benefitType
  return BenefitTemplateOptions.filter(t => !bt || Number(t.benefitType) === Number(bt))
})

const grantForm = reactive({
  username: '',
  benefitType: 1,
  template: '',
  benefitKey: '',
  benefitName: '',
  totalQuantity: 1,
  amountValue: 0,
  minAmount: 0,
  unitType: 'count',
  levelRequired: 1,
  dateRange: [],
  benefitDesc: ''
})

const grantRules = {
  benefitType: [{ required: true, message: '请选择权益类型', trigger: 'change' }],
  benefitKey: [{ required: true, message: '请输入权益编码', trigger: 'blur' }],
  benefitName: [{ required: true, message: '请输入权益名称', trigger: 'blur' }],
  totalQuantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

const reissueForm = reactive({
  id: null,
  displayName: '',
  totalQuantity: 1,
  dateRange: [],
  reason: ''
})

const extendForm = reactive({
  id: null,
  originTo: '',
  validTo: '',
  reason: ''
})

const benefitTypeLabel = (v) => getEnumLabel(BenefitTypeEnum, v) || v
const benefitTypeColor = (v) => getEnumColor(BenefitTypeEnum, v)
const statusLabel = (v) => getEnumLabel(BenefitStatusEnum, v)
const statusType = (v) => BenefitStatusEnum[Object.keys(BenefitStatusEnum).find(k => BenefitStatusEnum[k].value === v)]?.type || ''
const sourceLabel = (v) => getEnumLabel(BenefitSourceEnum, v)
const sourceColor = (v) => getEnumColor(BenefitSourceEnum, v)
const unitLabel = (v) => getEnumLabel(BenefitUnitEnum, v) || v

const getTypeIcon = (t) => {
  const map = { 1: Present, 2: Medal, 3: StarFilled, 4: OfficeBuilding }
  return map[t] || Ticket
}

const getRemain = (t) => stats.byType?.[t]?.remain || 0
const getUsed = (t) => {
  const cnt = stats.byType?.[t]?.count || 0
  return cnt - getRemain(t)
}

const formatRange = (f, t) => {
  const fmt = (d) => d ? String(d).substring(0, 10) : '-'
  return `${fmt(f)} 至 ${fmt(t)}`
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.userId || r.user?.id)
}

const handleSearch = () => { pagination.page = 1; fetchAll() }
const handleReset = () => {
  filterForm.benefitType = null
  filterForm.keyword = ''
  filterForm.status = null
  filterForm.userLevel = null
  filterForm.dateRange = []
  pagination.page = 1
  fetchAll()
}

const handleTypeChange = () => { grantForm.template = '' }
const handleTemplateSelect = (v) => {
  const tpl = BenefitTemplateOptions.find(t => t.value === v)
  if (tpl) {
    grantForm.benefitKey = tpl.value
    grantForm.benefitName = tpl.label
    grantForm.amountValue = tpl.amountValue || 0
    grantForm.minAmount = tpl.minAmount || 0
    grantForm.totalQuantity = tpl.totalQuantity || 1
    grantForm.unitType = tpl.unitType || 'count'
    grantForm.levelRequired = tpl.levelRequired || 1
    grantForm.applyScenes = tpl.scenes || ''
    grantForm.benefitDesc = tpl.desc || ''
  }
}

const buildPayload = (form) => {
  const dt = new Date()
  const plusDays = (n) => {
    const d = new Date(dt); d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  let validFrom = plusDays(0), validTo = plusDays(30)
  if (form.dateRange && form.dateRange.length === 2) {
    validFrom = form.dateRange[0]; validTo = form.dateRange[1]
  }
  return {
    userId: Number(form.username) || 2,
    benefitType: Number(form.benefitType),
    benefitKey: form.benefitKey,
    benefitName: form.benefitName,
    benefitDesc: form.benefitDesc,
    totalQuantity: Number(form.totalQuantity) || 1,
    amountValue: Number(form.amountValue) || 0,
    unitType: form.unitType || 'count',
    minAmount: Number(form.minAmount) || 0,
    levelRequired: Number(form.levelRequired) || 1,
    validFrom,
    validTo,
    applyScenes: form.applyScenes || ''
  }
}

const handleValidateOnly = async () => {
  try {
    const res = await validateBenefit(buildPayload(grantForm))
    validateIssues.value = res.data?.issues || []
    if (res.data?.valid) ElMessage.success('参数校验通过')
    else ElMessage.warning('存在校验问题，请检查后重试')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleGrant = async () => {
  if (!grantFormRef.value) return
  try {
    await grantFormRef.value.validate()
  } catch (e) { return }
  grantLoading.value = true
  try {
    await grantBenefit(buildPayload(grantForm))
    ElMessage.success('权益发放成功')
    grantDialogVisible.value = false
    nextTick(() => { grantFormRef.value?.resetFields() })
    fetchAll()
  } catch (e) {
    validateIssues.value = [{ field: 'submit', message: e.message }]
    ElMessage.error(e.message)
  } finally {
    grantLoading.value = false
  }
}

const handleReissue = (row) => {
  reissueForm.id = row.id
  reissueForm.displayName = `${row.benefitName}（${row.user?.nickname || '未知'}）`
  reissueForm.totalQuantity = 1
  reissueForm.dateRange = []
  reissueForm.reason = ''
  reissueDialogVisible.value = true
}

const handleReissueSubmit = async () => {
  if (!reissueForm.id) return
  try {
    await reissueBenefit(reissueForm.id, {
      totalQuantity: reissueForm.totalQuantity,
      validFrom: reissueForm.dateRange?.[0],
      validTo: reissueForm.dateRange?.[1],
      remark: reissueForm.reason
    })
    ElMessage.success('补发成功')
    reissueDialogVisible.value = false
    fetchAll()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleExtend = (row) => {
  extendForm.id = row.id
  extendForm.originTo = row.validTo ? String(row.validTo).substring(0, 10) : '无限制'
  extendForm.validTo = ''
  extendForm.reason = ''
  extendDialogVisible.value = true
}

const handleExtendSubmit = async () => {
  if (!extendForm.validTo) {
    ElMessage.warning('请选择新的失效时间')
    return
  }
  try {
    await extendBenefit(extendForm.id, { validTo: extendForm.validTo, reason: extendForm.reason })
    ElMessage.success('延期成功')
    extendDialogVisible.value = false
    fetchAll()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleVoid = async (row) => {
  try {
    await ElMessageBox.confirm(`确认作废【${row.benefitName}】？该操作不可恢复`, '作废确认', {
      type: 'warning'
    })
  } catch (e) { return }
  try {
    await voidBenefit(row.id, { reason: '人工作废' })
    ElMessage.success('作废成功')
    fetchAll()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleTrace = (row) => {
  traceUserId.value = row.userId || row.user?.id
  traceBenefitId.value = row.id
  traceDialogVisible.value = true
}

const handleBatchSuccess = () => {
  batchDialogVisible.value = false
  selectedIds.value = []
  selectedRows.value = []
  fetchAll()
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.benefitType) params.benefitType = filterForm.benefitType
    if (filterForm.keyword) params.keyword = filterForm.keyword
    if (filterForm.status !== null && filterForm.status !== undefined && filterForm.status !== '') params.status = filterForm.status
    if (filterForm.userLevel) params.userLevel = filterForm.userLevel
    if (filterForm.dateRange?.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }
    const res = await getBenefitList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const params = {}
    if (filterForm.benefitType) params.benefitType = filterForm.benefitType
    if (filterForm.dateRange?.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }
    const res = await getBenefitStats(params)
    Object.assign(stats, res.data || {})
    statsRefreshKey.value++
  } catch (e) {}
}

const fetchAll = () => {
  fetchStats()
  fetchList()
}

onMounted(fetchAll)
</script>
