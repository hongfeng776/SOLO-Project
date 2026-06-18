<template>
  <div class="risk-batch-panel">
    <div class="stats-info">
      <div class="info-row">
        <span class="info-label">已选用户数量</span>
        <span class="info-value">{{ selectedCount }} 人</span>
      </div>
      <div class="info-row">
        <span class="info-label">其中重度高危</span>
        <span class="info-value danger">{{ heavyRiskCount }} 人</span>
      </div>
      <div class="info-row">
        <span class="info-label">VIP用户数量</span>
        <span class="info-value" :class="{ danger: vipCount > 0 }">{{ vipCount }} 人</span>
      </div>
      <div class="info-row">
        <span class="info-label">累计异常行为</span>
        <span class="info-value">{{ totalAbnormal }} 次</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" style="margin-bottom: 16px;">
      <el-tab-pane label="标记风险等级" name="mark" />
      <el-tab-pane label="发送风险提醒" name="warning" />
      <el-tab-pane label="限制高危操作" name="restrict" />
    </el-tabs>

    <div class="action-section" v-show="activeTab === 'mark'">
      <div class="section-title">选择风险等级（轻度→重度，管控力度递增）</div>
      <div class="mark-options">
        <div
          v-for="item in riskLevelOptions"
          :key="item.value"
          :class="['mark-card', { 'is-active': selectedRiskLevel === item.value }]"
          @click="selectedRiskLevel = item.value"
        >
          <div>
            <span class="level-dot" :style="{ background: item.color }"></span>
            <span class="level-label">{{ item.label }}</span>
          </div>
          <div class="level-desc">{{ getLevelDesc(item.value) }}</div>
        </div>
      </div>
      <div class="reason-input">
        <el-form label-width="90px">
          <el-form-item label="标记原因">
            <el-input v-model="markRemark" type="textarea" :rows="2" placeholder="请输入标记原因（选填）" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="action-section" v-show="activeTab === 'warning'">
      <div class="section-title">风险提醒内容</div>
      <el-form label-width="90px">
        <el-form-item label="提醒模板">
          <el-select v-model="warningTemplate" style="width: 100%;" @change="handleTemplateChange">
            <el-option label="通用违规提醒" value="general" />
            <el-option label="刷单行为警告" value="fraud" />
            <el-option label="恶意售后警告" value="abuse" />
            <el-option label="薅权益行为提醒" value="wool" />
            <el-option label="自定义内容" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒内容">
          <el-input v-model="warningContent" type="textarea" :rows="4" placeholder="请输入发送给用户的风险提醒内容" />
        </el-form-item>
      </el-form>
    </div>

    <div class="action-section" v-show="activeTab === 'restrict'">
      <div class="section-title">选择限制类型</div>
      <div class="restrict-options">
        <label
          v-for="item in restrictOptions"
          :key="item.value"
          class="restrict-card"
        >
          <el-checkbox v-model="selectedRestrictMap[item.value]">
            <span :style="{ color: '#ff4d4f' }">{{ item.label }}</span>
          </el-checkbox>
          <div class="desc">{{ item.desc }}</div>
        </label>
      </div>
      <div class="reason-input">
        <el-form label-width="90px">
          <el-form-item label="限制原因">
            <el-input v-model="restrictReason" type="textarea" :rows="2" placeholder="请输入限制原因（必填）" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-if="processing" class="progress-section">
      <div class="progress-header">
        <span>批量处理中...</span>
        <span class="progress-percent">{{ progressPercent }}%</span>
      </div>
      <el-progress
        :percentage="progressPercent"
        :stroke-width="14"
        :status="progressPercent >= 100 ? (hasFailed ? 'warning' : 'success') : ''"
      />
      <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #909399;">
        <span>已完成: {{ progressDone }}/{{ selectedCount }}</span>
        <span v-if="hasFailed">失败: {{ progressFailed }}</span>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #ebeef5; margin-top: 16px;">
      <el-alert
        v-if="activeTab === 'restrict' && vipCount > 0"
        type="warning"
        :closable="false"
        show-icon
        style="flex: 1; margin-right: 12px;"
        title="VIP用户限制需管理员权限"
      />
      <div v-else style="flex: 1;"></div>
      <div>
        <el-button :disabled="processing" @click="$emit('cancel')">取消</el-button>
        <el-button
          type="primary"
          :type="activeTab === 'restrict' ? 'danger' : (activeTab === 'mark' ? 'warning' : 'primary')"
          :loading="processing"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitText }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  RiskLevelEnum,
  RestrictTypeEnum,
  getEnumOptions,
  getEnumColor
} from '@/utils/enums'
import {
  batchMarkRiskUser,
  batchSendRiskWarning,
  batchRestrictUser
} from '@/api/behavior'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedRows: { type: Array, default: () => [] }
})

const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('mark')
const selectedRiskLevel = ref(1)
const markRemark = ref('')
const warningTemplate = ref('general')
const warningContent = ref('')
const selectedRestrictMap = reactive({ order: false, aftersale: false, all: false })
const restrictReason = ref('')

const processing = ref(false)
const progressPercent = ref(0)
const progressDone = ref(0)
const progressFailed = ref(0)
const hasFailed = ref(false)

const riskLevelOptions = getEnumOptions(RiskLevelEnum).filter(o => o.value > 0)
const restrictOptions = Object.keys(RestrictTypeEnum).map(k => ({
  value: RestrictTypeEnum[k].value,
  label: RestrictTypeEnum[k].label,
  desc: RestrictTypeEnum[k].desc
}))

const selectedCount = computed(() => props.selectedIds.length)
const heavyRiskCount = computed(() => props.selectedRows.filter(r => r.riskLevel >= 3 || r.abnormalLevel >= 3).length)
const vipCount = computed(() => props.selectedRows.filter(r => r.userLevel === 3 || r.user?.userLevel === 3).length)
const totalAbnormal = computed(() => props.selectedRows.reduce((sum, r) => sum + (r.abnormalCount || 0), 0))

const getLevelDesc = (lv) => ({
  1: '轻度异常预警，系统持续观察',
  2: '中度重点关注，限制部分营销权益',
  3: '重度高危状态，人工介入审核处理'
}[lv] || '')

const getLevelColor = (lv) => getEnumColor(RiskLevelEnum, lv)

const handleTemplateChange = () => {
  const templates = {
    general: '【风控系统】您的账号存在异常操作行为，请规范使用，否则将影响账号权限。',
    fraud: '【风控系统】检测到您存在疑似刷单行为，系统已记录，请立即停止违规操作。',
    abuse: '【风控系统】您的售后申请频率异常，请合理行使权益，否则将被限制售后。',
    wool: '【风控系统】检测到您存在批量薅取权益行为，请遵守平台规则。',
    custom: ''
  }
  warningContent.value = templates[warningTemplate.value] || ''
}

watch(() => warningTemplate.value, handleTemplateChange, { immediate: true })

watch(selectedRestrictMap, (val) => {
  if (val.all) {
    selectedRestrictMap.order = false
    selectedRestrictMap.aftersale = false
  }
}, { deep: true })

const canSubmit = computed(() => {
  if (selectedCount.value === 0) return false
  if (activeTab.value === 'mark') return selectedRiskLevel.value > 0
  if (activeTab.value === 'warning') return !!warningContent.value.trim()
  if (activeTab.value === 'restrict') {
    const anySelected = Object.values(selectedRestrictMap).some(v => v)
    return anySelected && !!restrictReason.value.trim()
  }
  return false
})

const submitText = computed(() => {
  if (activeTab.value === 'mark') return `批量标记为${riskLevelOptions.find(o => o.value === selectedRiskLevel.value)?.label}`
  if (activeTab.value === 'warning') return '批量发送提醒'
  return '批量执行限制'
})

const mockProgress = () => {
  processing.value = true
  progressPercent.value = 0
  progressDone.value = 0
  progressFailed.value = 0
  hasFailed.value = false
}

const simulateProgress = (apiFn, doneText) => {
  mockProgress()
  const timer = setInterval(() => {
    progressPercent.value = Math.min(progressPercent.value + 8, 95)
  }, 80)
  return {
    finalize: (successCount, failCount) => {
      clearInterval(timer)
      progressDone.value = successCount
      progressFailed.value = failCount
      hasFailed.value = failCount > 0
      progressPercent.value = 100
      processing.value = false
    }
  }
}

const handleSubmit = async () => {
  if (activeTab.value === 'mark') {
    const prog = simulateProgress()
    try {
      const res = await batchMarkRiskUser(props.selectedIds, selectedRiskLevel.value, markRemark.value)
      prog.finalize(res.data?.success || 0, res.data?.failed || 0)
      ElMessage.success(`标记完成：成功${res.data?.success || 0}，失败${res.data?.failed || 0}`)
      setTimeout(() => emit('success'), 600)
    } catch (e) {
      prog.finalize(0, selectedCount.value)
      ElMessage.error(e.message || '操作失败')
    }
  } else if (activeTab.value === 'warning') {
    const prog = simulateProgress()
    try {
      const res = await batchSendRiskWarning(props.selectedIds, warningContent.value)
      prog.finalize(res.data?.success || 0, res.data?.failed || 0)
      ElMessage.success(`发送完成：成功${res.data?.success || 0}，失败${res.data?.failed || 0}`)
      setTimeout(() => emit('success'), 600)
    } catch (e) {
      prog.finalize(0, selectedCount.value)
      ElMessage.error(e.message || '操作失败')
    }
  } else {
    if (vipCount.value > 0) {
      ElMessage.warning('VIP用户限制操作已拦截，仅管理员可处理')
    }
    const types = []
    if (selectedRestrictMap.order) types.push('order')
    if (selectedRestrictMap.aftersale) types.push('aftersale')
    if (selectedRestrictMap.all) types.push('all')
    const prog = simulateProgress()
    try {
      let totalSuc = 0, totalFail = 0
      for (const t of types) {
        const res = await batchRestrictUser(props.selectedIds, t, restrictReason.value)
        totalSuc = Math.max(totalSuc, res.data?.success || 0)
        totalFail = Math.max(totalFail, res.data?.failed || 0)
      }
      prog.finalize(totalSuc, totalFail)
      ElMessage.success(`限制完成：成功${totalSuc}，失败${totalFail}`)
      setTimeout(() => emit('success'), 600)
    } catch (e) {
      prog.finalize(0, selectedCount.value)
      ElMessage.error(e.message || '操作失败')
    }
  }
}
</script>
