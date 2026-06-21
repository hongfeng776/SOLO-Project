<template>
  <div v-if="selectedIds.length > 0" class="ticket-type-ops batch-toolbar">
    <div class="batch-info">
      <el-icon style="color: #1890ff; font-size: 18px;"><Files /></el-icon>
      <span>
        已选中 <span class="batch-count">{{ selectedIds.length }}</span> 个票种
      </span>
      <span v-if="pkgCount > 0" class="package-alert">
        <el-icon style="margin-right: 4px;"><Warning /></el-icon>
        含 {{ pkgCount }} 个特惠套票（修改规则需专项权限）
      </span>
    </div>

    <div v-if="running" class="batch-progress">
      <div class="progress-bar-wrap">
        <div class="progress-inner" :style="{ width: progressPct + '%' }" />
      </div>
      <span class="progress-text">{{ completed }} / {{ total }} 处理中</span>
    </div>

    <div class="batch-actions" v-show="!running">
      <el-button v-for="op in availableOps" :key="op.value"
        @click="handleOp(op)"
        v-ripple
        :style="op.color ? { borderColor: op.color, color: op.color } : {}"
        :type="!op.color ? 'primary' : ''">
        <el-icon><component :is="op.icon" /></el-icon>
        {{ op.label }}
      </el-button>
      <el-button link type="danger" @click="$emit('clear')">取消选择</el-button>
    </div>

    <el-dialog v-model="opDialogVisible" :title="currentOp?.label + ' 配置'" width="520px">
      <template v-if="currentOp?.value === 'adjust_refund'">
        <el-form :model="formRefund" label-width="110px">
          <el-form-item label="是否可退" required>
            <el-switch v-model="formRefund.refundable" />
          </el-form-item>
          <el-form-item label="是否可改" v-if="formRefund.refundable">
            <el-switch v-model="formRefund.changeable" />
          </el-form-item>
          <el-form-item label="退票提前" v-if="formRefund.refundable">
            <el-input-number v-model="formRefund.beforeMinutes" :min="0" :max="10080" />
            <span style="color: #909399; font-size: 12px; margin-left: 6px;">分钟前</span>
          </el-form-item>
          <el-form-item label="扣费比例" v-if="formRefund.refundable">
            <el-input-number v-model="formRefund.deductRate" :min="0" :max="100" /> %
          </el-form-item>
          <el-form-item label="退改说明">
            <el-input v-model="formRefund.refundDescription" type="textarea" :rows="2" />
          </el-form-item>
          <el-alert type="info" :closable="false" show-icon title="生效范围">
            含特惠套票的批量修改需 package_auditor 或 senior_ticket_operator 权限，否则套票会被跳过。
          </el-alert>
        </el-form>
      </template>

      <template v-else-if="currentOp?.value === 'adjust_audience'">
        <el-form :model="formAudience" label-width="110px">
          <el-form-item label="适用人群说明" required>
            <el-input v-model="formAudience.audienceDescription" placeholder="如：统一调整为 18-60 岁成人" />
          </el-form-item>
          <el-form-item label="年龄下限">
            <el-input-number v-model="formAudience.ageMin" :min="0" :max="120" />
          </el-form-item>
          <el-form-item label="年龄上限">
            <el-input-number v-model="formAudience.ageMax" :min="0" :max="120" />
          </el-form-item>
          <el-form-item label="需实名认证">
            <el-switch v-model="formAudience.realNameRequired" />
          </el-form-item>
        </el-form>
      </template>

      <template v-else-if="currentOp?.value === 'adjust_time'">
        <el-form :model="formTime" label-width="110px">
          <el-form-item label="时段说明" required>
            <el-input v-model="formTime.timeDescription" placeholder="如：周一至周日 09:00-18:00" />
          </el-form-item>
          <el-form-item label="生效范围">
            <el-radio-group v-model="formTime.scope">
              <el-radio value="global">所有选中票种</el-radio>
              <el-radio value="local">仅同景点内票种</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-alert v-if="formTime.scope === 'local'" type="warning" :closable="false" show-icon
            title="局部生效">
            若选中跨景点票种，将按各自景点分组，同一景点内的票种批量统一时段。
          </el-alert>
        </el-form>
      </template>

      <template v-else>
        <div style="padding: 20px 0;">
          <el-alert :type="['disable','off_shelf'].includes(currentOp?.value) ? 'warning' : 'success'"
            show-icon :closable="false"
            :title="`将对选中的 ${selectedIds.length} 个票种执行【${currentOp?.label}】操作`" />
          <el-form label-width="100px" style="margin-top: 16px;">
            <el-form-item label="操作原因">
              <el-input v-model="reason" type="textarea" :rows="2" placeholder="请填写操作原因（记录日志）" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <template #footer>
        <el-button @click="opDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmOp" v-ripple>确认执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Files, Warning, CircleCheck, CircleClose, Upload, Download,
  RefreshLeft, UserFilled, Clock
} from '@element-plus/icons-vue'
import { batchTicketTypeOperation, checkTicketTypePermission } from '@/api/ticketType'
import { TicketBatchOperationEnum } from '@/utils/enums'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedTickets: { type: Array, default: () => [] },
  activeCategory: { type: String, default: 'adult' }
})
const emit = defineEmits(['clear', 'success', 'toast'])

const availableOps = computed(() => Object.values(TicketBatchOperationEnum))
const pkgCount = computed(() => props.selectedTickets.filter(t => t.ticketCategory === 'package').length)

const opDialogVisible = ref(false)
const currentOp = ref(null)
const submitting = ref(false)
const running = ref(false)
const total = ref(0)
const completed = ref(0)
const progressPct = computed(() => total.value ? Math.round((completed.value / total.value) * 100) : 0)

const reason = ref('')
const formRefund = reactive({
  refundable: true,
  changeable: false,
  beforeMinutes: 0,
  deductRate: 0,
  refundDescription: ''
})
const formAudience = reactive({
  audienceDescription: '',
  ageMin: null,
  ageMax: null,
  realNameRequired: false
})
const formTime = reactive({
  timeDescription: '',
  scope: 'global'
})

const resetForms = () => {
  reason.value = ''
  Object.assign(formRefund, { refundable: true, changeable: false, beforeMinutes: 0, deductRate: 0, refundDescription: '' })
  Object.assign(formAudience, { audienceDescription: '', ageMin: null, ageMax: null, realNameRequired: false })
  Object.assign(formTime, { timeDescription: '', scope: 'global' })
}

const handleOp = async (op) => {
  if (pkgCount.value > 0 && ['adjust_refund', 'adjust_audience'].includes(op.value)) {
    try {
      const r = await checkTicketTypePermission('package')
      if (!r.data?.canEdit) {
        ElMessage.warning('选中包含特惠套票，您无权修改套票规则。请申请专项权限后再试')
        return
      }
    } catch (e) { /* ignore */ }
  }
  if (['enable', 'disable', 'on_shelf', 'off_shelf'].includes(op.value)) {
    try {
      await ElMessageBox.confirm(
        `确定对 ${props.selectedIds.length} 个票种执行「${op.label}」吗？`,
        '确认批量操作', { type: 'warning' }
      )
    } catch (e) { return }
  }
  currentOp.value = op
  resetForms()
  opDialogVisible.value = true
}

const mockProgress = () => {
  running.value = true
  total.value = props.selectedIds.length
  completed.value = 0
  const timer = setInterval(() => {
    completed.value = Math.min(total.value, completed.value + Math.max(1, Math.ceil(total.value / 10)))
    if (completed.value >= total.value) {
      clearInterval(timer)
      running.value = false
    }
  }, 120)
}

const confirmOp = async () => {
  const op = currentOp.value
  const payload = {
    ids: props.selectedIds,
    operation: op.value,
    reason: reason.value,
    scope: 'global',
    applyTo: {},
    updateFields: {}
  }

  if (op.value === 'adjust_refund') {
    if (!formRefund.refundable && formRefund.changeable) {
      ElMessage.warning('不可退款票种不建议开启改签，请确认')
    }
    payload.updateFields = {
      refundPolicy: {
        refundable: formRefund.refundable,
        changeable: formRefund.changeable,
        beforeMinutes: formRefund.beforeMinutes,
        deductRate: formRefund.deductRate
      },
      refundDescription: formRefund.refundDescription
    }
  } else if (op.value === 'adjust_audience') {
    if (!formAudience.audienceDescription) {
      ElMessage.warning('请填写适用人群说明')
      return
    }
    const aa = {}
    if (formAudience.ageMin !== null || formAudience.ageMax !== null) {
      aa.ageRange = [formAudience.ageMin ?? 0, formAudience.ageMax ?? 999]
    }
    payload.updateFields = {
      applicableAudience: aa,
      audienceDescription: formAudience.audienceDescription
    }
    if (formAudience.realNameRequired) {
      payload.updateFields.reservationRule = { realNameRequired: true }
    }
  } else if (op.value === 'adjust_time') {
    if (!formTime.timeDescription) {
      ElMessage.warning('请填写使用时段说明')
      return
    }
    payload.scope = formTime.scope
    payload.applyTo = { scope: formTime.scope }
    payload.updateFields = { timeDescription: formTime.timeDescription }
  }

  submitting.value = true
  mockProgress()
  try {
    await batchTicketTypeOperation(payload)
    ElMessage.success('批量操作完成')
    opDialogVisible.value = false
    emit('success')
    emit('toast', '批量票种规则已同步生效')
  } catch (err) {
    const msg = err?.response?.data?.message || '批量操作失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
    setTimeout(() => { running.value = false; completed.value = 0 }, 600)
  }
}
</script>
