<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    size="960px"
    destroy-on-close
    class="qualification-audit-drawer"
    @close="handleClose"
  >
    <div v-loading="detailLoading" class="audit-panel-content">
      <div v-if="!merchant" class="empty-loading">加载中...</div>
      <template v-else>
        <div class="merchant-summary mb-20">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="商家名称" :span="2">
              <b>{{ merchant.name }}</b>
              <el-tag
                v-if="merchant.merchantCategory === 2"
                type="danger"
                size="small"
                effect="dark"
                style="margin-left: 10px"
              >
                <el-icon><WarningFilled /></el-icon>高危行业-需专项核验
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="ID">{{ merchant.id }}</el-descriptions-item>
            <el-descriptions-item label="业务品类">
              <el-tag :color="getBusinessTypeColor(merchant.businessType)" effect="dark" size="small" style="border: none">
                {{ getBusinessTypeLabel(merchant.businessType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="getAuditStatusType(merchant.auditStatus)" size="small">
                {{ getAuditStatusLabel(merchant.auditStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核层级">
              <el-tag :type="merchant.auditLevel === 2 ? 'danger' : 'primary'" size="small">
                {{ merchant.auditLevel === 2 ? '终审' : '初审' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="联系人">{{ merchant.contact }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ merchant.phone }}</el-descriptions-item>
            <el-descriptions-item label="统一信用代码">{{ merchant.unifiedCreditCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="法人姓名">{{ merchant.legalPersonName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经营范围" :span="3">{{ merchant.scope || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="preCheckResult" class="pre-check-section mb-20">
          <el-alert
            :type="preCheckAlertType"
            :closable="false"
            show-icon
            class="pre-check-alert"
          >
            <template #title>
              <span class="pre-check-title">前置校验结果</span>
              <el-tag v-if="preCheckResult.completeness?.complete" type="success" size="small" style="margin-left: 8px">材料完整</el-tag>
              <el-tag v-else type="danger" size="small" style="margin-left: 8px">材料不完整</el-tag>
              <el-tag v-if="preCheckResult.violations?.hasViolation" type="warning" size="small" style="margin-left: 8px">
                检测到违规项({{ preCheckResult.violations.violations?.length || 0 }})
              </el-tag>
            </template>
            <div v-if="preCheckResult.completeness?.missingCategories?.length" class="check-detail">
              <div class="check-label missing">缺失资质类别：</div>
              <div class="check-items">
                <el-tag
                  v-for="item in preCheckResult.completeness.missingCategories"
                  :key="item.category"
                  type="danger"
                  effect="plain"
                  size="small"
                >{{ item.name }}</el-tag>
              </div>
            </div>
            <div v-if="preCheckResult.violations?.violations?.length" class="check-detail">
              <div class="check-label violation">违规 / 风险项：</div>
              <div class="violation-list">
                <div
                  v-for="(v, i) in preCheckResult.violations.violations"
                  :key="i"
                  class="violation-item"
                  :class="`level-${v.level}`"
                >
                  <el-tag size="small" :type="v.level === 'high' ? 'danger' : (v.level === 'medium' ? 'warning' : 'info')">
                    {{ v.level === 'high' ? '高风险' : (v.level === 'medium' ? '中风险' : '低风险') }}
                  </el-tag>
                  <span class="violation-reason">{{ v.reason }}</span>
                </div>
              </div>
            </div>
          </el-alert>
        </div>

        <div class="section-title mb-10">
          <el-icon><Document /></el-icon>
          资质材料审核 - {{ getBusinessTypeLabel(merchant.businessType) }}专属审核分支
        </div>

        <div v-if="branchAudit" class="branch-tabs mb-15">
          <div
            v-for="tab in auditTabs"
            :key="tab.key"
            class="branch-tab"
            :class="{ active: activeTab === tab.key, failed: tab.failed, passed: tab.allPassed }"
            @click="activeTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <el-tag v-if="tab.failed" type="danger" size="small">{{ tab.failCount }}项不合格</el-tag>
            <el-tag v-else-if="tab.allPassed" type="success" size="small">全部通过</el-tag>
            <el-tag v-else type="warning" size="small">{{ tab.pendingCount }}项待审</el-tag>
          </div>
        </div>

        <div class="qualification-list">
          <div
            v-for="(item, idx) in currentBranchItems"
            :key="item.category + idx"
            class="qualification-card"
            :class="{
              'card-failed': item.auditResult === 2 || (qualificationResults[item.id] === 2),
              'card-passed': qualificationResults[item.id] === 1,
              'card-pending': !item.passed && qualificationResults[item.id] === undefined
            }"
          >
            <div class="card-header">
              <div class="card-title">
                <el-icon class="required-icon" v-if="item.provided !== false"><StarFilled /></el-icon>
                <span>{{ item.name }}</span>
                <el-tag
                  v-if="item.auditResult === 2 || qualificationResults[item.id] === 2"
                  type="danger"
                  size="small"
                  effect="dark"
                >不合格</el-tag>
                <el-tag v-else-if="qualificationResults[item.id] === 1" type="success" size="small" effect="dark">审核通过</el-tag>
                <el-tag v-else-if="!item.passed && item.provided" type="warning" size="small">自动校验不通过</el-tag>
              </div>
              <div class="card-actions">
                <el-radio-group
                  v-model="qualificationResults[item.id]"
                  size="small"
                  :disabled="!item.provided"
                >
                  <el-radio-button :value="1">通过</el-radio-button>
                  <el-radio-button :value="2">不合格</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <div class="card-body">
              <div v-if="!item.provided" class="missing-tip">
                <el-icon><WarningFilled /></el-icon>
                未提交该类资质材料
              </div>
              <div v-else class="material-grid">
                <div
                  v-if="item.fileUrl"
                  class="file-preview-wrapper"
                  @mouseenter="hoveredFile = item.id"
                  @mouseleave="hoveredFile = null"
                >
                  <div class="file-preview" :class="{ 'preview-zoom': hoveredFile === item.id }">
                    <el-image
                      :src="item.fileUrl"
                      fit="cover"
                      :preview-src-list="[item.fileUrl]"
                      preview-teleported
                    >
                      <template #error>
                        <div class="image-placeholder">
                          <el-icon :size="32"><Picture /></el-icon>
                          <span>点击预览文件</span>
                        </div>
                      </template>
                    </el-image>
                  </div>
                  <div class="preview-tip">Hover放大 / 点击预览</div>
                </div>
                <div v-if="!item.fileUrl" class="file-preview-wrapper">
                  <div class="image-placeholder no-file">
                    <el-icon :size="28"><Document /></el-icon>
                    <span>未上传文件</span>
                  </div>
                </div>

                <div class="info-grid">
                  <div class="info-item" v-if="item.licenseNo">
                    <span class="info-label">证照编号</span>
                    <span class="info-value">{{ item.licenseNo }}</span>
                  </div>
                  <div class="info-item" v-if="item.legalPerson">
                    <span class="info-label">法人</span>
                    <span class="info-value">{{ item.legalPerson }}</span>
                  </div>
                  <div class="info-item" v-if="item.legalPersonIdCard">
                    <span class="info-label">身份证号</span>
                    <span class="info-value">{{ maskIdCard(item.legalPersonIdCard) }}</span>
                  </div>
                  <div class="info-item" v-if="item.scope">
                    <span class="info-label">范围</span>
                    <span class="info-value">{{ item.scope }}</span>
                  </div>
                  <div class="info-item" v-if="item.effectiveDate">
                    <span class="info-label">生效日期</span>
                    <span class="info-value">{{ formatDate(item.effectiveDate) }}</span>
                  </div>
                  <div class="info-item" :class="{ 'info-expired': isExpired(item.expiryDate) }">
                    <span class="info-label">到期日期</span>
                    <span class="info-value">
                      {{ item.expiryDate ? formatDate(item.expiryDate) : '-' }}
                      <el-tag v-if="isExpired(item.expiryDate)" type="danger" size="small" effect="dark" style="margin-left: 4px">已过期</el-tag>
                      <el-tag v-else-if="isNearExpire(item.expiryDate)" type="warning" size="small" style="margin-left: 4px">即将到期</el-tag>
                    </span>
                  </div>
                </div>

                <div v-if="item.issues?.length || item.qualificationId && hasDetectIssues(item)" class="issues-box">
                  <div class="issues-title">
                    <el-icon><WarningFilled /></el-icon> 检测 / 校验问题：
                  </div>
                  <ul class="issues-list">
                    <li v-for="(issue, i) in getAllIssues(item)" :key="i">
                      {{ issue }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="remark-section mt-30 mb-20">
          <el-form :model="remarkForm" label-width="100px">
            <el-form-item :label="rejectMode ? '驳回原因' : '审核备注'">
              <el-input
                v-model="remarkForm.remark"
                type="textarea"
                :rows="3"
                :placeholder="rejectMode ? '请详细填写驳回原因（必填）' : '请输入审核备注（可选）'"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          type="warning"
          :icon="Clock"
          :disabled="submitBtnDisabled"
          @click="handleSubmitTemporary"
          v-ripple
        >暂存审核</el-button>
        <el-button
          type="danger"
          :icon="Close"
          :disabled="submitBtnDisabled || !canReject"
          @click="handleSubmitReject"
          v-ripple
        >审核驳回</el-button>
        <el-button
          type="success"
          :icon="Check"
          :disabled="submitBtnDisabled || !canPass"
          @click="handleSubmitPass"
          v-ripple
        >
          {{ merchant?.auditLevel === 2 ? '终审通过' : '审核通过' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check, Close, Clock, WarningFilled, Document, StarFilled, Picture
} from '@element-plus/icons-vue'
import {
  MerchantBusinessTypeEnum,
  MerchantAuditStatusEnum,
  getEnumLabel,
  getEnumColor,
  getEnumType
} from '@/utils/enums'
import {
  getAuditDetail,
  preAuditCheck,
  submitAuditPass,
  submitAuditReject,
  submitAuditTemporary
} from '@/api/merchant'

const props = defineProps({
  modelValue: Boolean,
  merchant: Object
})

const emit = defineEmits(['update:modelValue', 'success', 'submitting'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const detailLoading = ref(false)
const detail = ref(null)
const preCheckResult = ref(null)
const hoveredFile = ref(null)
const activeTab = ref('all')
const qualificationResults = reactive({})
const remarkForm = reactive({ remark: '' })
const submitBtnDisabled = ref(false)
const rejectMode = ref(false)

const auditTabBaseConfig = {
  flight: [
    { key: 'business_license', label: '营业执照' },
    { key: 'operation_permit', label: '经营资质' },
    { key: 'flight_permit', label: '航司专属资质' },
    { key: 'authorization', label: '品牌授权' },
    { key: 'legal_person', label: '法人信息' }
  ],
  hotel: [
    { key: 'business_license', label: '营业执照' },
    { key: 'operation_permit', label: '经营资质' },
    { key: 'hotel_permit', label: '酒店专属资质' },
    { key: 'authorization', label: '品牌授权' },
    { key: 'legal_person', label: '法人信息' }
  ],
  tourism: [
    { key: 'business_license', label: '营业执照' },
    { key: 'operation_permit', label: '经营资质' },
    { key: 'ticket_permit', label: '文旅专属资质' },
    { key: 'authorization', label: '品牌授权' },
    { key: 'legal_person', label: '法人信息' }
  ],
  car: [
    { key: 'business_license', label: '营业执照' },
    { key: 'operation_permit', label: '经营资质' },
    { key: 'car_permit', label: '租车专属资质' },
    { key: 'authorization', label: '品牌授权' },
    { key: 'legal_person', label: '法人信息' }
  ]
}

const drawerTitle = computed(() => {
  if (!props.merchant) return '资质审核'
  return `资质审核 - ${props.merchant.name}（${getBusinessTypeLabel(props.merchant.businessType)}）`
})

const getBusinessTypeLabel = v => getEnumLabel(MerchantBusinessTypeEnum, v) || '未知'
const getBusinessTypeColor = v => getEnumColor(MerchantBusinessTypeEnum, v)
const getAuditStatusLabel = v => getEnumLabel(MerchantAuditStatusEnum, v)
const getAuditStatusType = v => getEnumType(MerchantAuditStatusEnum, v)

const branchAudit = computed(() => detail.value?.branchAudit)

const allAuditItems = computed(() => {
  if (!branchAudit.value?.auditDetails) return []
  const qMap = {}
  ;(detail.value?.qualifications || []).forEach(q => { qMap[q.category] = q })
  return branchAudit.value.auditDetails.map(d => ({
    ...d,
    ...(qMap[d.category] || {}),
    id: d.qualificationId || `${d.category}_${Date.now()}_${Math.random()}`
  }))
})

const auditTabs = computed(() => {
  const type = props.merchant?.businessType || 'flight'
  const config = auditTabBaseConfig[type] || []
  const tabs = [{ key: 'all', label: '全部' }].concat(config)

  const calcStats = (key) => {
    const items = key === 'all' ? allAuditItems.value : allAuditItems.value.filter(i => i.category === key)
    const failCount = items.filter(i => !i.passed || qualificationResults[i.id] === 2).length
    const passedCount = items.filter(i => i.passed && qualificationResults[i.id] === 1).length
    return {
      failCount,
      allPassed: items.length > 0 && passedCount === items.length && failCount === 0,
      failed: failCount > 0,
      pendingCount: items.length - passedCount - failCount
    }
  }
  return tabs.map(t => ({ ...t, ...calcStats(t.key) }))
})

const currentBranchItems = computed(() => {
  if (activeTab.value === 'all') return allAuditItems.value
  return allAuditItems.value.filter(i => i.category === activeTab.value)
})

const preCheckAlertType = computed(() => {
  if (!preCheckResult.value) return 'info'
  const v = preCheckResult.value
  if (v.violations?.hasViolation && v.violations.highRiskCount > 0) return 'error'
  if (!v.completeness?.complete || v.violations?.hasViolation) return 'warning'
  return 'success'
})

const hasUnapproved = computed(() => {
  return allAuditItems.value.some(i => qualificationResults[i.id] !== 1)
})

const canPass = computed(() => {
  if (!props.merchant) return false
  if (preCheckResult.value?.violations?.hasViolation && preCheckResult.value.violations.highRiskCount > 0) return false
  if (preCheckResult.value?.completeness && !preCheckResult.value.completeness.complete) return false
  if (allAuditItems.value.length === 0) return false
  return allAuditItems.value.every(i => qualificationResults[i.id] === 1)
})

const canReject = computed(() => {
  if (!props.merchant) return false
  return true
})

const hasDetectIssues = (item) => {
  return (preCheckResult.value?.completeness?.expiredItems || [])
    .some(e => e.id === item.qualificationId || e.category === item.category) ||
    (preCheckResult.value?.completeness?.incompleteItems || [])
    .some(e => e.id === item.qualificationId || e.category === item.category)
}

const getAllIssues = (item) => {
  const issues = item.issues ? [...item.issues] : []
  ;(preCheckResult.value?.completeness?.expiredItems || []).forEach(e => {
    if (e.id === item.qualificationId || e.category === item.category) {
      issues.push(e.reason)
    }
  })
  ;(preCheckResult.value?.completeness?.incompleteItems || []).forEach(e => {
    if (e.id === item.qualificationId || e.category === item.category) {
      (e.issues || []).forEach(i => issues.push(i))
    }
  })
  ;(preCheckResult.value?.violations?.violations || []).forEach(v => {
    if (v.qualificationId && (v.qualificationId === item.qualificationId || v.qualificationId === item.id)) {
      issues.push(v.reason)
    }
  })
  return issues
}

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

const maskIdCard = (id) => {
  if (!id || id.length < 8) return id
  return id.slice(0, 4) + '**********' + id.slice(-4)
}

const isExpired = (d) => {
  if (!d) return false
  return new Date(d) < new Date()
}

const isNearExpire = (d) => {
  if (!d) return false
  const diff = new Date(d) - new Date()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

const doSubmit = async (type) => {
  if (submitBtnDisabled.value) return
  submitBtnDisabled.value = true
  emit('submitting', true)
  setTimeout(() => { submitBtnDisabled.value = false; emit('submitting', false) }, 300)

  try {
    let res
    const data = { qualificationResults: { ...qualificationResults }, remark: remarkForm.remark }
    if (type === 'pass') {
      res = await submitAuditPass(props.merchant.id, data)
    } else if (type === 'reject') {
      if (!remarkForm.remark.trim()) {
        ElMessage.warning('请填写驳回原因')
        return
      }
      res = await submitAuditReject(props.merchant.id, data)
    } else {
      res = await submitAuditTemporary(props.merchant.id, data)
    }
    if (res?.code === 200) {
      emit('success', { type, merchant: props.merchant, message: res.message })
      ElMessage.success(res.message || '操作成功')
      handleClose()
    }
  } catch (e) {
    if (e?.message) {
      ElMessageBox.alert(e.message, '审核拦截提示', {
        type: 'error',
        confirmButtonText: '我知道了',
        dangerouslyUseHTMLString: true
      })
    }
  } finally {
    submitBtnDisabled.value = false
    emit('submitting', false)
  }
}

const handleSubmitPass = async () => {
  try {
    const tip = props.merchant?.auditLevel === 2
      ? `确定对「${props.merchant.name}」执行终审通过？通过后将自动开通经营权限和资源上架权限。`
      : `确定对「${props.merchant.name}」执行审核通过？`
    await ElMessageBox.confirm(tip, '审核通过确认', { type: 'success' })
    rejectMode.value = false
    await doSubmit('pass')
  } catch (e) {}
}

const handleSubmitReject = async () => {
  rejectMode.value = true
  if (!remarkForm.remark.trim()) {
    ElMessage.warning('请先填写驳回原因')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定驳回「${props.merchant.name}」的入驻申请？将锁定入驻流程。`,
      '审核驳回确认',
      { type: 'warning' }
    )
    await doSubmit('reject')
  } catch (e) {}
}

const handleSubmitTemporary = async () => {
  await doSubmit('temporary')
}

const handleClose = () => {
  visible.value = false
}

const loadDetail = async () => {
  if (!props.merchant?.id) return
  detailLoading.value = true
  try {
    const [dRes, pRes] = await Promise.all([
      getAuditDetail(props.merchant.id),
      preAuditCheck(props.merchant.id)
    ])
    if (dRes?.code === 200 && dRes.data) {
      detail.value = dRes.data
      ;(dRes.data.qualifications || []).forEach(q => {
        if (q.auditResult && q.auditResult !== 0) {
          qualificationResults[q.id] = q.auditResult
        }
      })
      ;(dRes.data.branchAudit?.auditDetails || []).forEach(d => {
        if (d.qualificationId) {
          const q = dRes.data.qualifications.find(x => x.id === d.qualificationId)
          if (q?.auditResult && q.auditResult !== 0) {
            qualificationResults[q.id] = q.auditResult
          }
        }
      })
    }
    if (pRes?.code === 200 && pRes.data) {
      preCheckResult.value = pRes.data
    }
  } catch (e) {
  } finally {
    detailLoading.value = false
  }
}

watch(
  () => [props.modelValue, props.merchant],
  ([v, m]) => {
    if (v && m) {
      Object.keys(qualificationResults).forEach(k => delete qualificationResults[k])
      remarkForm.remark = ''
      rejectMode.value = false
      activeTab.value = 'all'
      loadDetail()
    }
  },
  { immediate: true }
)
</script>
