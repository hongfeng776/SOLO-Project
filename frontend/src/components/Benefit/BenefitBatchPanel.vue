<template>
  <el-dialog
    v-model="visible"
    title="批量权益运维"
    width="720px"
    :close-on-click-modal="false"
    custom-class="benefit-dialog-pop"
    append-to-body
  >
    <div class="batch-benefit-panel">
      <div class="mode-switch">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="selected-count-badge">{{ realCount }}</span>
          <div>
            <div style="font-size: 14px; font-weight: 500;">待处理用户</div>
            <div style="font-size: 12px; color: #909399;">
              共 {{ realCount }} 人，VIP {{ vipCount }} 人，高危 {{ riskCount }} 人
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <el-radio-group v-model="applyScope">
            <el-radio-button label="global">全局生效</el-radio-button>
            <el-radio-button label="partial">局部生效</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="批量发放权益" name="grant">
          <div v-if="grantLoading" class="benefit-skeleton">
            <el-skeleton :rows="6" animated />
          </div>

          <div v-else>
            <div class="diff-config-card">
              <div style="font-size: 13px; color: #1890ff; font-weight: 500; margin-bottom: 8px;">
                <el-icon style="vertical-align: middle; margin-right: 4px;"><MagicStick /></el-icon>
                差异化参数配置（按等级自动适配）
              </div>
              <el-row :gutter="16">
                <el-col :span="8">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">普通用户发放</div>
                  <el-input-number v-model="diffMap.normal.qty" :min="1" :max="100" controls-position="right" style="width: 100%;" />
                </el-col>
                <el-col :span="8">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">商旅用户发放</div>
                  <el-input-number v-model="diffMap.business.qty" :min="1" :max="100" controls-position="right" style="width: 100%;" />
                </el-col>
                <el-col :span="8">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">VIP用户发放</div>
                  <el-input-number v-model="diffMap.vip.qty" :min="1" :max="100" controls-position="right" style="width: 100%;" />
                </el-col>
              </el-row>
            </div>

            <el-form :model="grantForm" label-width="100px" style="margin-top: 14px;">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="权益类型" required>
                    <el-select v-model="grantForm.benefitType" @change="handleTypeChange" style="width: 100%;">
                      <el-option label="出行优惠券" :value="1" />
                      <el-option label="积分权益" :value="2" />
                      <el-option label="贵宾权益" :value="3" />
                      <el-option label="商旅专属" :value="4" />
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
                  <el-form-item label="权益编码" required>
                    <el-input v-model="grantForm.benefitKey" placeholder="如 travel_coupon_100" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="权益名称" required>
                    <el-input v-model="grantForm.benefitName" placeholder="如 商旅满1000减100券" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="面额">
                    <el-input-number v-model="grantForm.amountValue" :min="0" :step="10" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="门槛">
                    <el-input-number v-model="grantForm.minAmount" :min="0" :step="50" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="有效期">
                    <el-select v-model="grantForm.days" style="width: 100%;">
                      <el-option label="7天" :value="7" />
                      <el-option label="15天" :value="15" />
                      <el-option label="30天" :value="30" />
                      <el-option label="60天" :value="60" />
                      <el-option label="90天" :value="90" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="执行模式">
                    <el-select v-model="grantForm.mode" style="width: 100%;">
                      <el-option label="严格模式（超半数失败中止）" value="strict" />
                      <el-option label="容错模式（继续执行）" value="soft" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="发放原因">
                    <el-input v-model="grantForm.remark" type="textarea" :rows="2" placeholder="请描述发放原因，如：春节营销活动补偿" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>

            <el-alert
              v-if="riskCount > 0"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 8px;"
              :title="`共排除 ${riskCount} 位高危风险用户，将不参与本次发放`"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="批量延期" name="extend">
          <el-form :model="extendForm" label-width="100px">
            <el-form-item label="延期方式">
              <el-radio-group v-model="extendForm.mode">
                <el-radio label="days">延长天数</el-radio>
                <el-radio label="date">统一失效日期</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="extendForm.mode === 'days'" label="延长天数">
              <el-select v-model="extendForm.days" style="width: 200px;">
                <el-option label="7天" :value="7" />
                <el-option label="15天" :value="15" />
                <el-option label="30天" :value="30" />
                <el-option label="60天" :value="60" />
                <el-option label="90天" :value="90" />
                <el-option label="180天" :value="180" />
              </el-select>
            </el-form-item>
            <el-form-item v-else label="统一失效日">
              <el-date-picker v-model="extendForm.validTo" type="date" value-format="YYYY-MM-DD" style="width: 240px;" />
            </el-form-item>
            <el-form-item label="处理范围">
              <el-radio-group v-model="extendForm.scope">
                <el-radio label="selected">选中用户所有未过期权益</el-radio>
                <el-radio label="benefit">仅指定类型权益</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="extendForm.scope === 'benefit'" label="指定权益类型">
              <el-select v-model="extendForm.benefitType" style="width: 200px;">
                <el-option label="出行优惠券" :value="1" />
                <el-option label="积分权益" :value="2" />
                <el-option label="贵宾权益" :value="3" />
                <el-option label="商旅专属" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="说明">
              <el-input v-model="extendForm.reason" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="批量回收" name="recycle">
          <el-alert
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;"
            title="此操作将回收用户可用权益额度，不可逆，请谨慎操作"
          />
          <el-form :model="recycleForm" label-width="100px">
            <el-form-item label="回收范围">
              <el-radio-group v-model="recycleForm.scope">
                <el-radio label="all">回收全部可用权益</el-radio>
                <el-radio label="partial">指定类型回收</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="recycleForm.scope === 'partial'" label="指定类型">
              <el-select v-model="recycleForm.benefitType" style="width: 200px;">
                <el-option label="出行优惠券" :value="1" />
                <el-option label="积分权益" :value="2" />
                <el-option label="贵宾权益" :value="3" />
                <el-option label="商旅专属" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="回收原因" required>
              <el-input v-model="recycleForm.recycleReason" type="textarea" :rows="2" placeholder="必须填写回收原因" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div v-if="processing" style="margin-top: 16px; padding: 16px; background: #f0f7ff; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 500;">执行进度：{{ progressText }}</span>
          <span style="color: #1890ff; font-weight: 600;">{{ progressPercent }}%</span>
        </div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="14"
          :status="progressPercent >= 100 ? (hasFailed ? 'warning' : 'success') : ''"
        />
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #606266;">
          <span>成功: <b style="color: #52c41a;">{{ progressSuccess }}</b> &nbsp; 失败: <b style="color: #ff4d4f;">{{ progressFailed }}</b></span>
          <span v-if="batchNo">批次号: {{ batchNo }}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; align-items: center; padding-top: 20px; border-top: 1px solid #ebeef5; margin-top: 16px;">
        <div style="flex: 1; font-size: 12px; color: #909399;" v-if="applyScope === 'partial'">
          当前为局部生效模式，部分用户失败不影响整体继续执行
        </div>
        <div>
          <el-button :disabled="processing" @click="$emit('cancel')">取消</el-button>
          <el-button
            :type="submitType"
            :loading="processing"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            {{ submitText }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { BenefitTemplateOptions } from '@/utils/enums'
import {
  batchGrantBenefit,
  batchExtendBenefit,
  batchRecycleBenefit
} from '@/api/benefit'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedRows: { type: Array, default: () => [] }
})

const emit = defineEmits(['success', 'cancel'])

const visible = ref(true)
const activeTab = ref('grant')
const applyScope = ref('soft')
const processing = ref(false)
const grantLoading = ref(false)
const progressPercent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)
const hasFailed = ref(false)
const batchNo = ref('')

const realCount = computed(() => props.selectedIds.length)
const vipCount = computed(() => props.selectedRows.filter(r => r.userLevel === 3 || r.user?.userLevel === 3).length)
const riskCount = computed(() => props.selectedRows.filter(r => r.riskLevel >= 3 || r.user?.riskLevel >= 3).length)

const diffMap = reactive({
  normal: { qty: 1 },
  business: { qty: 2 },
  vip: { qty: 3 }
})

const grantForm = reactive({
  benefitType: 1,
  template: '',
  benefitKey: '',
  benefitName: '',
  amountValue: 50,
  minAmount: 500,
  days: 30,
  mode: 'soft',
  remark: ''
})

const extendForm = reactive({
  mode: 'days',
  days: 30,
  validTo: '',
  scope: 'selected',
  benefitType: 1,
  reason: ''
})

const recycleForm = reactive({
  scope: 'all',
  benefitType: 1,
  recycleReason: ''
})

const matchedTemplates = computed(() => {
  const bt = grantForm.benefitType
  return BenefitTemplateOptions.filter(t => !bt || Number(t.benefitType) === Number(bt))
})

const submitType = computed(() => {
  if (activeTab.value === 'recycle') return 'danger'
  if (activeTab.value === 'extend') return 'warning'
  return 'primary'
})

const submitText = computed(() => {
  const n = realCount.value
  if (activeTab.value === 'grant') return `向${n}位用户发放权益`
  if (activeTab.value === 'extend') return `批量延期${n}位用户权益`
  return `批量回收${n}位用户权益`
})

const canSubmit = computed(() => {
  if (processing.value || realCount.value === 0) return false
  if (activeTab.value === 'grant') {
    return grantForm.benefitKey && grantForm.benefitName
  }
  if (activeTab.value === 'extend') {
    return extendForm.mode === 'days' ? !!extendForm.days : !!extendForm.validTo
  }
  return !!recycleForm.recycleReason.trim()
})

const progressText = computed(() => {
  const total = realCount.value || 1
  const done = progressSuccess.value + progressFailed.value
  return `${done}/${total}`
})

const handleTypeChange = () => { grantForm.template = '' }

const handleTemplateSelect = (v) => {
  const tpl = BenefitTemplateOptions.find(t => t.value === v)
  if (tpl) {
    grantForm.benefitKey = tpl.value
    grantForm.benefitName = tpl.label
    grantForm.amountValue = tpl.amountValue || 0
    grantForm.minAmount = tpl.minAmount || 0
  }
}

const startProgress = () => {
  processing.value = true
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0
  hasFailed.value = false
  batchNo.value = ''
  const total = realCount.value || 1
  const timer = setInterval(() => {
    progressPercent.value = Math.min(progressPercent.value + 5, 94)
    progressSuccess.value = Math.round((progressPercent.value / 100) * total)
  }, 120)
  return {
    done: (suc, fail, bn = '') => {
      clearInterval(timer)
      progressSuccess.value = suc
      progressFailed.value = fail
      hasFailed.value = fail > 0
      progressPercent.value = 100
      batchNo.value = bn || ''
      processing.value = false
    }
  }
}

const handleSubmit = async () => {
  const userIds = props.selectedIds.length > 0 ? props.selectedIds : props.selectedRows.map(r => r.userId || r.user?.id)
  if (userIds.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  if (activeTab.value === 'grant') {
    const dt = new Date()
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const plusDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return fmt(x) }
    const validFrom = fmt(dt)
    const validTo = plusDays(dt, Number(grantForm.days) || 30)

    const conditions = { mode: applyScope.value }
    const handler = startProgress()
    const payload = {
      userIds,
      userConditions: conditions,
      benefitType: grantForm.benefitType,
      benefitKey: grantForm.benefitKey,
      benefitName: grantForm.benefitName,
      totalQuantity: 1,
      diffQuantities: {
        1: diffMap.normal.qty,
        2: diffMap.business.qty,
        3: diffMap.vip.qty
      },
      amountValue: grantForm.amountValue,
      minAmount: grantForm.minAmount,
      validFrom,
      validTo,
      mode: applyScope.value === 'global' ? 'strict' : grantForm.mode,
      remark: grantForm.remark
    }
    try {
      const res = await batchGrantBenefit(payload)
      handler.done(res.data?.success || 0, res.data?.failed || 0, res.data?.batchNo)
      ElMessage.success(`发放完成：成功${res.data?.success || 0}，失败${res.data?.failed || 0}`)
      setTimeout(() => emit('success'), 500)
    } catch (e) {
      handler.done(0, userIds.length)
      ElMessage.error(e.message || '操作失败')
    }
  } else if (activeTab.value === 'extend') {
    const payload = {
      ids: [],
      userLevel: extendForm.scope === 'benefit' ? null : null,
      benefitType: extendForm.scope === 'benefit' ? extendForm.benefitType : null,
      validTo: extendForm.mode === 'date' ? extendForm.validTo : null,
      days: extendForm.mode === 'days' ? extendForm.days : null,
      reason: extendForm.reason
    }
    const handler = startProgress()
    try {
      const res = await batchExtendBenefit(payload)
      handler.done(res.data?.success || 0, res.data?.failed || 0)
      ElMessage.success(`延期完成：成功${res.data?.success || 0}，失败${res.data?.failed || 0}`)
      setTimeout(() => emit('success'), 500)
    } catch (e) {
      handler.done(0, userIds.length)
      ElMessage.error(e.message || '操作失败')
    }
  } else {
    const payload = {
      ids: props.selectedRows.filter(r => !r.userId || r.status === 1 || r.status === 2).map(r => r.id),
      recycleReason: recycleForm.recycleReason
    }
    if (!payload.ids.length) {
      ElMessage.warning('暂无可回收的有效权益')
      return
    }
    const handler = startProgress()
    try {
      const res = await batchRecycleBenefit(payload)
      handler.done(res.data?.success || 0, res.data?.failed || 0)
      ElMessage.success(`回收完成：成功${res.data?.success || 0}，失败${res.data?.failed || 0}`)
      setTimeout(() => emit('success'), 500)
    } catch (e) {
      handler.done(0, payload.ids.length)
      ElMessage.error(e.message || '操作失败')
    }
  }
}

watch(visible, val => {
  if (!val) emit('cancel')
})
</script>
