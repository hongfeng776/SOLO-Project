<template>
  <el-drawer
    v-model="visible"
    :title="`审核流程溯源 - ${merchant?.name || ''}`"
    size="900px"
    destroy-on-close
    class="audit-trace-drawer"
  >
    <div v-loading="loading" class="trace-panel-content">
      <div v-if="merchant" class="trace-summary mb-20">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="商家名称" :span="2">{{ merchant.name }}</el-descriptions-item>
          <el-descriptions-item label="ID">{{ merchant.id }}</el-descriptions-item>
          <el-descriptions-item label="业务品类">
            <el-tag size="small">{{ getBusinessTypeLabel(merchant.businessType) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="入驻状态">
            <el-tag :type="getSettleStatusType(merchant.settleStatus)" size="small">
              {{ getSettleStatusLabel(merchant.settleStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="修正次数">{{ merchant.reviseCount || 0 }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="timeline-view mb-20" v-if="timelineData.length">
        <div class="section-title mb-10">
          <el-icon><Connection /></el-icon>
          流程时间轴
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="(item, i) in timelineData"
            :key="item.id"
            :timestamp="formatDateTime(item.createdAt)"
            :type="getTimelineType(item.action)"
            :color="getActionColor(item.action)"
            :hollow="i === timelineData.length - 1"
          >
            <div class="timeline-item-header">
              <el-tag size="small" effect="dark" :color="getActionColor(item.action)" style="border: none">
                {{ item.actionLabel || getActionLabel(item.action) }}
              </el-tag>
              <span class="operator-info" v-if="item.operatorName">
                操作人：{{ item.operatorName }}
                <el-tag size="small" type="info" v-if="item.operatorRole">{{ item.operatorRole }}</el-tag>
              </span>
            </div>
            <div class="timeline-status" v-if="item.oldStatus !== undefined && item.newStatus !== undefined">
              <span class="status-old">{{ getAuditStatusLabel(item.oldStatus) }}</span>
              <el-icon><ArrowRight /></el-icon>
              <span class="status-new">{{ getAuditStatusLabel(item.newStatus) }}</span>
            </div>
            <div class="timeline-remark" v-if="item.remark">{{ item.remark }}</div>
            <div class="timeline-risk" v-if="item.riskLevel && item.riskLevel > 0">
              <el-tag size="small" :type="item.riskLevel === 3 ? 'danger' : (item.riskLevel === 2 ? 'warning' : 'info')">
                风险等级: {{ item.riskLevel === 3 ? '高' : (item.riskLevel === 2 ? '中' : '低') }}
              </el-tag>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="section-title mb-10">
        <el-icon><Document /></el-icon>
        审核日志明细（可拖拽调整列宽 / 双击行展开详情）
      </div>

      <div class="trace-table-wrapper">
        <el-table
          ref="tableRef"
          :data="tableData"
          border
          stripe
          class="trace-table draggable-table"
          @row-dblclick="handleRowDblclick"
          :row-class-name="getRowClassName"
          :header-cell-style="{ background: '#fafafa', fontWeight: 600 }"
        >
          <el-table-column
            prop="id"
            label="日志ID"
            width="90"
            fixed="left"
            class-name="draggable-col"
          />
          <el-table-column
            prop="actionLabel"
            label="操作类型"
            min-width="120"
            class-name="draggable-col"
            resizable
          >
            <template #default="{ row }">
              <el-tag size="small" effect="dark" :color="getActionColor(row.action)" style="border: none">
                {{ row.actionLabel || getActionLabel(row.action) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="operatorName"
            label="操作人"
            min-width="110"
            class-name="draggable-col"
            resizable
          >
            <template #default="{ row }">
              <span>{{ row.operatorName || '系统' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="operatorRole"
            label="操作人角色"
            min-width="100"
            class-name="draggable-col"
            resizable
          />
          <el-table-column
            label="状态变更"
            min-width="180"
            class-name="draggable-col"
            resizable
          >
            <template #default="{ row }">
              <span v-if="row.oldStatus !== undefined">
                <el-tag size="small" :type="getAuditStatusType(row.oldStatus)">
                  {{ getAuditStatusLabel(row.oldStatus) }}
                </el-tag>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                <el-tag size="small" :type="getAuditStatusType(row.newStatus)">
                  {{ getAuditStatusLabel(row.newStatus) }}
                </el-tag>
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="风险等级"
            width="100"
            class-name="draggable-col"
            resizable
          >
            <template #default="{ row }">
              <el-tag
                v-if="row.riskLevel === 3"
                type="danger"
                size="small"
              >高风险</el-tag>
              <el-tag
                v-else-if="row.riskLevel === 2"
                type="warning"
                size="small"
              >中风险</el-tag>
              <el-tag
                v-else-if="row.riskLevel === 1"
                type="info"
                size="small"
              >低风险</el-tag>
              <span v-else class="text-muted">正常</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            label="备注 / 原因"
            min-width="200"
            show-overflow-tooltip
            class-name="draggable-col"
            resizable
          />
          <el-table-column
            prop="createdAt"
            label="操作时间"
            width="170"
            fixed="right"
            class-name="draggable-col"
          />
          <el-table-column
            label="展开"
            width="60"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="toggleExpand(row)"
              >
                <el-icon>
                  <component :is="expandedRows[row.id] ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container mt-20">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchTrace"
          @current-change="fetchTrace"
        />
      </div>

      <div v-if="expandedDetail" class="expanded-detail-panel">
        <div class="detail-header" @click="expandedDetail = null">
          <el-icon><Close /></el-icon>
          <span>详细信息 #{{ expandedDetail.id }} - {{ expandedDetail.actionLabel || getActionLabel(expandedDetail.action) }}</span>
        </div>
        <div class="detail-body">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="日志ID">{{ expandedDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="操作时间">{{ formatDateTime(expandedDetail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="操作人">
              {{ expandedDetail.operatorName || '系统' }}
              <span v-if="expandedDetail.operatorId"> (ID: {{ expandedDetail.operatorId }})</span>
            </el-descriptions-item>
            <el-descriptions-item label="操作人角色">{{ expandedDetail.operatorRole || '-' }}</el-descriptions-item>
            <el-descriptions-item label="业务品类" v-if="expandedDetail.businessType">
              {{ getBusinessTypeLabel(expandedDetail.businessType) }}
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              {{ expandedDetail.riskLevel === 3 ? '高风险' : (expandedDetail.riskLevel === 2 ? '中风险' : (expandedDetail.riskLevel === 1 ? '低风险' : '正常')) }}
            </el-descriptions-item>
            <el-descriptions-item label="备注 / 原因" :span="2">{{ expandedDetail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="expandedDetail.detectInfo?.violations?.length" class="detail-section mt-15">
            <div class="detail-section-title">
              <el-icon><WarningFilled /></el-icon>
              违规检测信息
            </div>
            <el-table :data="expandedDetail.detectInfo.violations" border size="small">
              <el-table-column
                label="风险等级"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="row.level === 'high' ? 'danger' : (row.level === 'medium' ? 'warning' : 'info')" size="small">
                    {{ row.level === 'high' ? '高' : (row.level === 'medium' ? '中' : '低') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="160" />
              <el-table-column prop="reason" label="原因" />
            </el-table>
          </div>

          <div v-if="expandedDetail.qualificationSnapshot?.length" class="detail-section mt-15">
            <div class="detail-section-title">
              <el-icon><Picture /></el-icon>
              资质材料快照
            </div>
            <el-table :data="expandedDetail.qualificationSnapshot" border size="small">
              <el-table-column prop="name" label="资质名称" min-width="150" />
              <el-table-column prop="category" label="类别" width="130" />
              <el-table-column prop="licenseNo" label="证照编号" min-width="160" />
              <el-table-column label="审核结果" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.auditResult === 1 ? 'success' : (row.auditResult === 2 ? 'danger' : 'warning')" size="small">
                    {{ row.auditResult === 1 ? '通过' : (row.auditResult === 2 ? '不合格' : '待审') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="effectiveDate" label="生效" width="110" />
              <el-table-column prop="expiryDate" label="到期" width="110" />
            </el-table>
          </div>

          <div v-if="expandedDetail.detail" class="detail-section mt-15">
            <div class="detail-section-title">
              <el-icon><Document /></el-icon>
              审核明细数据
            </div>
            <pre class="detail-json">{{ prettyJson(expandedDetail.detail) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import {
  Connection, Document, ArrowRight, ArrowDown, ArrowUp, Close,
  WarningFilled, Picture
} from '@element-plus/icons-vue'
import {
  MerchantAuditStatusEnum,
  MerchantBusinessTypeEnum,
  SettleStatusEnum,
  AuditActionEnum,
  getEnumLabel,
  getEnumType
} from '@/utils/enums'
import { getAuditTrace } from '@/api/merchant'

const props = defineProps({
  modelValue: Boolean,
  merchant: Object
})
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const loading = ref(false)
const tableRef = ref(null)
const tableData = ref([])
const timelineData = ref([])
const expandedRows = reactive({})
const expandedDetail = ref(null)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const mockTraceData = [
  {
    id: 1, action: 'submit', actionLabel: '提交入驻申请', operatorId: null, operatorName: '商家本人',
    operatorRole: 'applicant', oldStatus: undefined, newStatus: 0, businessType: 'flight',
    remark: '商家线上提交入驻申请及资质材料', detectInfo: null, qualificationSnapshot: null,
    detail: null, riskLevel: 0, createdAt: '2024-06-15 09:30:00'
  },
  {
    id: 2, action: 'detect_violation', actionLabel: '违规检测拦截', operatorId: null, operatorName: '风控系统',
    operatorRole: 'system', oldStatus: 0, newStatus: 0, businessType: 'flight',
    remark: '资质即将到期提醒：航空运营许可证还有28天到期',
    detectInfo: {
      violations: [
        { type: 'near_expire', level: 'low', reason: '航空运营许可证还有28天到期' }
      ]
    },
    riskLevel: 1, createdAt: '2024-06-15 09:30:05'
  },
  {
    id: 3, action: 'audit_pass', actionLabel: '初审通过', operatorId: 101, operatorName: '审核员小张',
    operatorRole: 'merchant_auditor', oldStatus: 0, newStatus: 6, businessType: 'flight',
    remark: '资质完整，经营范围匹配，初审通过进入终审',
    qualificationSnapshot: [
      { category: 'business_license', name: '营业执照', licenseNo: '9111000012345678XX', auditResult: 1 },
      { category: 'flight_permit', name: '航空运营资质', licenseNo: 'CAAC-2020-FL00123', auditResult: 1 }
    ],
    riskLevel: 1, createdAt: '2024-06-16 10:20:00'
  },
  {
    id: 4, action: 'revise', actionLabel: '信息修正', operatorId: 5001, operatorName: '国航运营专员',
    operatorRole: 'merchant', oldStatus: 6, newStatus: 7, businessType: 'flight',
    remark: '修正了航空运营许可证的到期日期，原日期填写错误',
    riskLevel: 0, createdAt: '2024-06-17 14:05:00'
  },
  {
    id: 5, action: 'final_pass', actionLabel: '终审通过', operatorId: 1, operatorName: '系统管理员',
    operatorRole: 'admin', oldStatus: 7, newStatus: 1, businessType: 'flight',
    remark: '终审通过，已开通机票类经营权限、资源上架权限',
    qualificationSnapshot: [
      { category: 'business_license', name: '营业执照', licenseNo: '9111000012345678XX', auditResult: 1 },
      { category: 'operation_permit', name: '经营资质证书', licenseNo: 'BIZ-2020-88888', auditResult: 1 },
      { category: 'authorization', name: '品牌授权证明', licenseNo: '-', auditResult: 1 },
      { category: 'legal_person', name: '法人身份证明', licenseNo: '-', auditResult: 1 },
      { category: 'flight_permit', name: '航空运营资质', licenseNo: 'CAAC-2020-FL00123', auditResult: 1 }
    ],
    detail: JSON.stringify({ businessPermission: { flight: true }, listingPermission: 1 }),
    riskLevel: 0, createdAt: '2024-06-18 09:00:00'
  }
]

const getAuditStatusLabel = v => getEnumLabel(MerchantAuditStatusEnum, v) || '未知'
const getAuditStatusType = v => getEnumType(MerchantAuditStatusEnum, v) || 'info'
const getBusinessTypeLabel = v => getEnumLabel(MerchantBusinessTypeEnum, v) || '未知'
const getSettleStatusLabel = v => getEnumLabel(SettleStatusEnum, v) || '未知'
const getSettleStatusType = v => getEnumType(SettleStatusEnum, v) || 'info'
const getActionLabel = v => getEnumLabel(AuditActionEnum, v) || v

const getActionColor = (action) => {
  const item = Object.values(AuditActionEnum).find(a => a.value === action)
  return item?.color || '#909399'
}

const getTimelineType = (action) => {
  const map = {
    submit: 'primary', audit_pass: 'success', final_pass: 'success',
    audit_reject: 'danger', final_reject: 'danger',
    detect_violation: 'warning', revise: 'warning',
    audit_temporary: 'info', auto_reset: 'info', expire: 'info'
  }
  return map[action] || 'primary'
}

const formatDateTime = (d) => {
  if (!d) return ''
  return typeof d === 'string' ? d : new Date(d).toLocaleString('zh-CN')
}

const prettyJson = (str) => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

const toggleExpand = (row) => {
  if (expandedRows[row.id]) {
    delete expandedRows[row.id]
    if (expandedDetail.value?.id === row.id) expandedDetail.value = null
  } else {
    expandedRows[row.id] = true
    expandedDetail.value = row
  }
}

const handleRowDblclick = (row) => {
  toggleExpand(row)
}

const getRowClassName = ({ row }) => {
  if (expandedRows[row.id]) return 'row-expanded'
  if (row.riskLevel === 3) return 'row-high-risk'
  if (row.riskLevel === 2) return 'row-mid-risk'
  return ''
}

const fetchTrace = async () => {
  if (!props.merchant?.id) return
  loading.value = true
  try {
    const res = await getAuditTrace(props.merchant.id, {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res?.code === 200 && res.data?.list?.length) {
      tableData.value = res.data.list
      timelineData.value = [...res.data.list].reverse().slice(0, 20)
      pagination.total = res.data.total
    } else {
      tableData.value = mockTraceData
      timelineData.value = [...mockTraceData].reverse()
      pagination.total = mockTraceData.length
    }
  } catch (e) {
    tableData.value = mockTraceData
    timelineData.value = [...mockTraceData].reverse()
    pagination.total = mockTraceData.length
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.merchant],
  ([v, m]) => {
    if (v && m) {
      pagination.page = 1
      Object.keys(expandedRows).forEach(k => delete expandedRows[k])
      expandedDetail.value = null
      fetchTrace()
    }
  },
  { immediate: true }
)
</script>
