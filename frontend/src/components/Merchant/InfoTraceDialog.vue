<template>
  <el-dialog
    :model-value="modelValue"
    title="商家信息溯源"
    width="1100px"
    :close-on-click-modal="false"
    @update:modelValue="val => emit('update:modelValue', val)"
    class="center-zoom-dialog info-trace-dialog"
  >
    <div v-loading="loading" class="trace-dialog-content">
      <div class="merchant-header" v-if="traceData">
        <div class="merchant-basic">
          <el-avatar :size="64" :src="traceData.merchant?.logoUrl" class="merchant-avatar-large">
            {{ traceData.merchant?.name?.charAt(0) }}
          </el-avatar>
          <div class="merchant-info">
            <h3 class="merchant-name">
              {{ traceData.merchant?.name }}
              <el-tag v-if="traceData.merchant?.merchantCategory === 2" type="danger" effect="dark" size="small">高危</el-tag>
              <el-tag :style="{ background: getEnumColor(MerchantBusinessTypeEnum, traceData.merchant?.businessType) }" effect="dark" size="small">
                {{ getEnumLabel(MerchantBusinessTypeEnum, traceData.merchant?.businessType) }}
              </el-tag>
            </h3>
            <div class="merchant-meta">
              <span class="meta-item">
                <el-icon><StarFilled /></el-icon>
                <span v-for="n in traceData.merchant?.merchantLevel" :key="n" class="star-icon">★</span>
                <span v-for="n in (5 - (traceData.merchant?.merchantLevel || 0))" :key="'e'+n" class="star-empty">☆</span>
              </span>
              <span class="meta-item">
                <el-tag :type="getEnumType(OperationStatusEnum, traceData.merchant?.operationStatus)" size="small">
                  {{ getEnumLabel(OperationStatusEnum, traceData.merchant?.operationStatus) }}
                </el-tag>
              </span>
              <span class="meta-item">
                <el-tag :type="getEnumType(BusinessStatusEnum, traceData.merchant?.businessStatus)" size="small">
                  {{ getEnumLabel(BusinessStatusEnum, traceData.merchant?.businessStatus) }}
                </el-tag>
              </span>
            </div>
            <div class="merchant-contact">
              <span><el-icon><Phone /></el-icon> {{ traceData.merchant?.phone || '-' }}</span>
              <span><el-icon><User /></el-icon> {{ traceData.merchant?.contact || '-' }}</span>
              <span class="long-text-cell" v-tooltip:top="traceData.merchant?.email">
                <el-icon><Message /></el-icon> {{ traceData.merchant?.email || '-' }}
              </span>
            </div>
          </div>
        </div>
        <div class="info-score-cards">
          <div class="score-card" :style="{ borderColor: getCompletenessColor(traceData.infoCompleteness?.score) }">
            <div class="score-value" :style="{ color: getCompletenessColor(traceData.infoCompleteness?.score) }">
              {{ traceData.infoCompleteness?.score || 0 }}
            </div>
            <div class="score-label">信息完整度</div>
            <div class="score-detail">
              必填 {{ traceData.infoCompleteness?.requiredFilled || 0 }}/{{ traceData.infoCompleteness?.requiredTotal || 0 }}
            </div>
          </div>
          <div class="score-card" :style="{ borderColor: getTimelinessColor(traceData.infoTimeliness?.score) }">
            <div class="score-value" :style="{ color: getTimelinessColor(traceData.infoTimeliness?.score) }">
              {{ traceData.infoTimeliness?.score || 0 }}
            </div>
            <div class="score-label">信息时效性</div>
            <div class="score-detail">
              异常 {{ traceData.infoTimeliness?.issues?.length || 0 }} 项
            </div>
          </div>
          <div class="score-card" :style="{ borderColor: getComplianceColor(traceData.infoCompliance?.score) }">
            <div class="score-value" :style="{ color: getComplianceColor(traceData.infoCompliance?.score) }">
              {{ traceData.infoCompliance?.score || 0 }}
            </div>
            <div class="score-label">信息合规性</div>
            <div class="score-detail">
              问题 {{ traceData.infoCompliance?.issues?.length || 0 }} 项
            </div>
          </div>
        </div>
      </div>

      <div class="timeliness-alert" v-if="traceData?.infoTimeliness?.issues?.length > 0">
        <el-alert
          v-for="(issue, idx) in traceData.infoTimeliness.issues"
          :key="idx"
          :title="issue.message"
          :type="issue.type === 'expired' ? 'error' : 'warning'"
          show-icon
          :closable="false"
        >
          <template #default>
            <span v-if="issue.days">{{ issue.type === 'expired' ? '已过期' : '剩余' }} {{ issue.days }} 天</span>
          </template>
        </el-alert>
      </div>

      <div class="compliance-alert" v-if="traceData?.infoCompliance?.issues?.length > 0">
        <el-alert
          v-for="(issue, idx) in traceData.infoCompliance.issues"
          :key="idx"
          :title="issue.message"
          :type="issue.type === 'error' ? 'error' : 'warning'"
          show-icon
          :closable="false"
        />
      </div>

      <el-tabs v-model="activeTab" class="trace-tabs">
        <el-tab-pane label="变更履历" name="changelog">
          <div class="log-filter-bar">
            <el-form :inline="true" :model="logFilter">
              <el-form-item label="变更类型">
                <el-select v-model="logFilter.changeType" placeholder="全部" clearable style="width: 160px">
                  <el-option
                    v-for="item in getEnumOptions(ChangeTypeEnum)"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="风险等级">
                <el-select v-model="logFilter.riskLevel" placeholder="全部" clearable style="width: 120px">
                  <el-option
                    v-for="item in getEnumOptions(RiskLevelEnum)"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="logFilter.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 280px"
                />
              </el-form-item>
            </el-form>
          </div>
          <el-table
            :data="changeLogList"
            v-loading="logsLoading"
            @row-dblclick="handleLogRowDblclick"
            border
            class="draggable-table"
            :row-class-name="logRowClassName"
          >
            <el-table-column type="expand" width="50">
              <template #default="{ row }">
                <div class="log-expand-panel">
                  <h5>变更详情</h5>
                  <el-table :data="formatChangeContent(row.changeContent)" border size="small">
                    <el-table-column prop="label" label="字段" width="150" />
                    <el-table-column prop="oldValue" label="变更前">
                      <template #default="{ row }">
                        <span class="long-text-cell" v-tooltip:top="formatValue(row.oldValue)">
                          {{ formatValue(row.oldValue) }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="newValue" label="变更后">
                      <template #default="{ row }">
                        <span class="long-text-cell" v-tooltip:top="formatValue(row.newValue)">
                          {{ formatValue(row.newValue) }}
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div v-if="row.detectInfo?.violations?.length > 0" class="violations-section">
                    <h5>违规检测</h5>
                    <el-tag
                      v-for="(v, idx) in row.detectInfo.violations"
                      :key="idx"
                      type="danger"
                      size="small"
                      effect="dark"
                    >{{ v }}</el-tag>
                  </div>
                  <div v-if="row.detectInfo?.warnings?.length > 0" class="warnings-section">
                    <h5>风险预警</h5>
                    <el-tag
                      v-for="(w, idx) in row.detectInfo.warnings"
                      :key="idx"
                      type="warning"
                      size="small"
                    >{{ w }}</el-tag>
                  </div>
                  <div v-if="row.detectInfo?.duplicates?.length > 0" class="duplicates-section">
                    <h5>重复检测</h5>
                    <el-tag
                      v-for="(d, idx) in row.detectInfo.duplicates"
                      :key="idx"
                      type="danger"
                      size="small"
                      effect="dark"
                    >{{ d }}</el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="changeTypeName" label="变更类型" width="140" resizable>
              <template #default="{ row }">
                <el-tag :style="{ background: getEnumColor(ChangeTypeEnum, row.changeType) }" effect="dark" size="small">
                  {{ row.changeTypeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="100" resizable />
            <el-table-column prop="operatorRole" label="角色" width="100" resizable />
            <el-table-column prop="riskLevel" label="风险等级" width="100" resizable>
              <template #default="{ row }">
                <el-tag :type="getEnumType(RiskLevelEnum, row.riskLevel)" size="small">
                  {{ getEnumLabel(RiskLevelEnum, row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="verifyStatus" label="校验状态" width="100" resizable>
              <template #default="{ row }">
                <el-tag :type="getEnumType(VerifyStatusEnum, row.verifyStatus)" size="small">
                  {{ getEnumLabel(VerifyStatusEnum, row.verifyStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="changeReason" label="变更原因" min-width="150" resizable show-overflow-tooltip />
            <el-table-column prop="ipAddress" label="操作IP" width="120" resizable />
            <el-table-column prop="createdAt" label="操作时间" width="180" resizable>
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="logPagination.page"
              v-model:page-size="logPagination.pageSize"
              :total="logPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchChangeLogs"
              @current-change="fetchChangeLogs"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="审核轨迹" name="auditlog">
          <el-table
            :data="traceData?.auditLogs || []"
            border
            class="draggable-table"
          >
            <el-table-column prop="action" label="操作类型" width="160" resizable>
              <template #default="{ row }">
                <el-tag :style="{ background: getEnumColor(AuditActionEnum, row.action) }" effect="dark" size="small">
                  {{ getEnumLabel(AuditActionEnum, row.action) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="oldStatus" label="原状态" width="120" resizable>
              <template #default="{ row }">
                <span v-if="row.oldStatus !== null && row.oldStatus !== undefined">
                  {{ getEnumLabel(MerchantAuditStatusEnum, row.oldStatus) }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="newStatus" label="新状态" width="120" resizable>
              <template #default="{ row }">
                <span v-if="row.newStatus !== null && row.newStatus !== undefined">
                  <el-tag :type="getEnumType(MerchantAuditStatusEnum, row.newStatus)" size="small">
                    {{ getEnumLabel(MerchantAuditStatusEnum, row.newStatus) }}
                  </el-tag>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="审核人" width="100" resizable />
            <el-table-column prop="remark" label="备注" min-width="200" resizable show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="180" resizable>
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="完整信息" name="fulldata">
          <el-descriptions :column="2" border class="full-data-desc">
            <template v-for="section in infoSections" :key="section.title">
              <el-descriptions-item :label="section.title" :span="2" class="section-title">
                <strong>{{ section.title }}</strong>
              </el-descriptions-item>
              <el-descriptions-item
                v-for="field in section.fields"
                :key="field.key"
                :label="field.label"
                :span="field.span || 1"
              >
                <template v-if="field.type === 'tag'">
                  <el-tag v-if="traceData.merchant?.[field.key] !== undefined">
                    {{ getEnumLabel(field.enum, traceData.merchant[field.key]) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
                <template v-else-if="field.type === 'colorTag'">
                  <el-tag
                    v-if="traceData.merchant?.[field.key] !== undefined"
                    :style="{ background: getEnumColor(field.enum, traceData.merchant[field.key]) }"
                    effect="dark"
                    size="small"
                  >
                    {{ getEnumLabel(field.enum, traceData.merchant[field.key]) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
                <template v-else-if="field.type === 'date'">
                  {{ formatDate(traceData.merchant?.[field.key]) }}
                </template>
                <template v-else-if="field.type === 'money'">
                  ¥{{ traceData.merchant?.[field.key]?.toFixed(2) || '0.00' }}
                </template>
                <template v-else-if="field.type === 'percent'">
                  {{ ((traceData.merchant?.[field.key] || 0) * 100).toFixed(2) }}%
                </template>
                <template v-else-if="field.type === 'stars'">
                  <span v-for="n in (traceData.merchant?.[field.key] || 0)" :key="n" class="star-icon">★</span>
                  <span v-for="n in (5 - (traceData.merchant?.[field.key] || 0))" :key="'e'+n" class="star-empty">☆</span>
                </template>
                <template v-else-if="field.type === 'tags'">
                  <el-tag
                    v-for="tag in (traceData.merchant?.[field.key] || [])"
                    :key="tag"
                    size="small"
                    style="margin-right: 5px"
                  >{{ getTagLabel(tag) }}</el-tag>
                </template>
                <template v-else-if="field.type === 'array'">
                  <div v-if="traceData.merchant?.[field.key]?.length > 0">
                    <div v-for="(item, idx) in traceData.merchant[field.key]" :key="idx" class="array-item">
                      {{ getEnumLabel(field.enum, item) }}
                    </div>
                  </div>
                  <span v-else>-</span>
                </template>
                <template v-else>
                  <span
                    v-if="traceData.merchant?.[field.key]"
                    class="long-text-cell"
                    :v-tooltip:top="String(traceData.merchant[field.key])"
                  >
                    {{ traceData.merchant[field.key] }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { getCompleteTrace, getChangeLogs } from '@/api/merchant'
import {
  MerchantBusinessTypeEnum,
  MerchantAuditStatusEnum,
  OperationStatusEnum,
  BusinessStatusEnum,
  ChangeTypeEnum,
  RiskLevelEnum,
  VerifyStatusEnum,
  AuditActionEnum,
  SettleCycleEnum,
  DepositStatusEnum,
  OperationModeEnum,
  MerchantCategoryEnum,
  MerchantTagOptions,
  CompletenessStatusEnum
} from '@/utils/enums'
import { getEnumLabel, getEnumOptions, getEnumColor, getEnumType } from '@/utils/enums'
import { ElMessage } from 'element-plus'
import { Phone, User, Message, StarFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  merchantId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const logsLoading = ref(false)
const traceData = ref(null)
const changeLogList = ref([])
const activeTab = ref('changelog')

const logFilter = reactive({
  changeType: '',
  riskLevel: '',
  dateRange: []
})

const logPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const infoSections = computed(() => [
  {
    title: '基础工商信息',
    fields: [
      { key: 'name', label: '商家名称' },
      { key: 'shortName', label: '商家简称' },
      { key: 'englishName', label: '英文名称' },
      { key: 'brandName', label: '品牌名称' },
      { key: 'unifiedCreditCode', label: '统一社会信用代码' },
      { key: 'legalPersonName', label: '法人姓名' },
      { key: 'legalPersonIdCard', label: '法人身份证号' },
      { key: 'registeredCapital', label: '注册资本', type: 'money' },
      { key: 'establishDate', label: '成立日期', type: 'date' },
      { key: 'businessTermStart', label: '营业期限开始', type: 'date' },
      { key: 'businessTermEnd', label: '营业期限结束', type: 'date' },
      { key: 'scope', label: '经营范围', span: 2 }
    ]
  },
  {
    title: '经营品类信息',
    fields: [
      { key: 'businessType', label: '主营品类', type: 'colorTag', enum: MerchantBusinessTypeEnum },
      { key: 'secondaryBusinessTypes', label: '兼营品类', type: 'array', enum: MerchantBusinessTypeEnum },
      { key: 'merchantLevel', label: '商家星级', type: 'stars' },
      { key: 'merchantTags', label: '商家标签', type: 'tags' },
      { key: 'merchantCategory', label: '商家类型', type: 'tag', enum: MerchantCategoryEnum },
      { key: 'operationMode', label: '运营模式', type: 'tag', enum: OperationModeEnum },
      { key: 'businessStartTime', label: '营业开始时间' },
      { key: 'businessEndTime', label: '营业结束时间' },
      { key: 'cooperationStartDate', label: '合作开始日期', type: 'date' },
      { key: 'cooperationEndDate', label: '合作到期日期', type: 'date' },
      { key: 'contractNo', label: '合同编号' },
      { key: 'publicIntroduction', label: '商家简介', span: 2 },
      { key: 'publicNotice', label: '公示公告', span: 2 }
    ]
  },
  {
    title: '联系方式',
    fields: [
      { key: 'contact', label: '联系人' },
      { key: 'contactPosition', label: '职位' },
      { key: 'phone', label: '联系电话' },
      { key: 'backupPhone', label: '备用电话' },
      { key: 'serviceHotline', label: '客服热线' },
      { key: 'complaintHotline', label: '投诉热线' },
      { key: 'email', label: '邮箱' },
      { key: 'officialWebsite', label: '官方网站' },
      { key: 'contactWechat', label: '微信' },
      { key: 'contactQq', label: 'QQ' },
      { key: 'province', label: '省份' },
      { key: 'city', label: '城市' },
      { key: 'district', label: '区县' },
      { key: 'addressDetail', label: '详细地址', span: 2 },
      { key: 'longitude', label: '经度' },
      { key: 'latitude', label: '纬度' }
    ]
  },
  {
    title: '结算信息',
    fields: [
      { key: 'settleAccountName', label: '结算账户名称' },
      { key: 'settleBankName', label: '开户银行' },
      { key: 'settleBankAccount', label: '银行账号' },
      { key: 'settleBankBranch', label: '开户支行' },
      { key: 'settleBankCode', label: '银行联行号' },
      { key: 'settleAlipayAccount', label: '支付宝账号' },
      { key: 'settleWechatAccount', label: '微信账号' },
      { key: 'settleCycle', label: '结算周期', type: 'tag', enum: SettleCycleEnum },
      { key: 'settleThreshold', label: '起付金额', type: 'money' },
      { key: 'commissionRate', label: '佣金比例', type: 'percent' },
      { key: 'depositAmount', label: '保证金金额', type: 'money' },
      { key: 'depositStatus', label: '保证金状态', type: 'tag', enum: DepositStatusEnum }
    ]
  },
  {
    title: '状态信息',
    fields: [
      { key: 'businessStatus', label: '经营状态', type: 'colorTag', enum: BusinessStatusEnum },
      { key: 'operationStatus', label: '运营状态', type: 'colorTag', enum: OperationStatusEnum },
      { key: 'auditStatus', label: '审核状态', type: 'tag', enum: MerchantAuditStatusEnum },
      { key: 'settleStatus', label: '入驻状态', type: 'tag' },
      { key: 'lockReason', label: '锁定原因', span: 2 },
      { key: 'lockTime', label: '锁定时间', type: 'date' },
      { key: 'unlockTime', label: '预计解锁时间', type: 'date' },
      { key: 'settledAt', label: '入驻时间', type: 'date' },
      { key: 'infoUpdateTime', label: '信息更新时间', type: 'date' }
    ]
  }
])

const loadData = async () => {
  if (!props.merchantId) return
  loading.value = true
  try {
    const res = await getCompleteTrace(props.merchantId)
    traceData.value = res.data
    fetchChangeLogs()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const fetchChangeLogs = async () => {
  if (!props.merchantId) return
  logsLoading.value = true
  try {
    const params = {
      page: logPagination.page,
      pageSize: logPagination.pageSize,
      changeType: logFilter.changeType || undefined,
      riskLevel: logFilter.riskLevel !== '' ? logFilter.riskLevel : undefined
    }
    if (logFilter.dateRange?.length === 2) {
      params.startDate = logFilter.dateRange[0]
      params.endDate = logFilter.dateRange[1]
    }
    const res = await getChangeLogs(props.merchantId, params)
    changeLogList.value = res.rows || res.data?.list || []
    logPagination.total = res.total || res.data?.total || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    logsLoading.value = false
  }
}

const logRowClassName = ({ row }) => {
  if (row.riskLevel === 3) return 'log-row-high-risk'
  if (row.riskLevel === 2) return 'log-row-medium-risk'
  if (row.verifyStatus === 0) return 'log-row-failed'
  return ''
}

const handleLogRowDblclick = (row, expandedRows) => {
  const index = expandedRows.findIndex(r => r.id === row.id)
  if (index > -1) {
    expandedRows.splice(index, 1)
  } else {
    expandedRows.push(row)
  }
}

const formatChangeContent = (content) => {
  if (!content || typeof content !== 'object') return []
  return Object.entries(content).map(([key, val]) => ({
    key,
    label: val.label || key,
    oldValue: val.oldValue,
    newValue: val.newValue
  }))
}

const formatValue = (val) => {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const getCompletenessColor = (score) => {
  if (score >= 90) return '#52c41a'
  if (score >= 70) return '#1890ff'
  if (score >= 50) return '#faad14'
  return '#ff4d4f'
}

const getTimelinessColor = (score) => {
  if (score >= 90) return '#52c41a'
  if (score >= 70) return '#1890ff'
  if (score >= 50) return '#faad14'
  return '#ff4d4f'
}

const getComplianceColor = (score) => {
  if (score >= 90) return '#52c41a'
  if (score >= 70) return '#1890ff'
  if (score >= 50) return '#faad14'
  return '#ff4d4f'
}

const getTagLabel = (value) => {
  const tag = MerchantTagOptions.find(t => t.value === value)
  return tag ? tag.label : value
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { hour12: false })
}

watch(() => props.modelValue, (val) => {
  if (val && props.merchantId) {
    loadData()
  }
})

watch(() => logFilter.changeType, () => { logPagination.page = 1; fetchChangeLogs() })
watch(() => logFilter.riskLevel, () => { logPagination.page = 1; fetchChangeLogs() })
watch(() => logFilter.dateRange, () => { logPagination.page = 1; fetchChangeLogs() })
</script>

<style lang="scss">
.long-text-cell {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
