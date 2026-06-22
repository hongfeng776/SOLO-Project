<template>
  <div class="inventory-batch-toolbar">
    <span class="selected-count">
      <el-icon><Select /></el-icon>
      已选 {{ props.selectedCount }} 条
    </span>

    <template v-for="op in batchOps" :key="op.value">
      <el-tooltip v-if="op.needsReview" content="该操作包含需人工复核的展演场次">
        <el-tag type="warning" size="small" effect="dark" style="margin-right: -4px;">
          <el-icon style="margin-right: 2px;"><Warning /></el-icon>需复核
        </el-tag>
      </el-tooltip>
      <el-button
        :type="op.type || 'default'"
        :icon="op.icon"
        @click="openOp(op)"
        :loading="loadingOp === op.value"
        v-ripple
      >
        {{ op.label }}
      </el-button>
    </template>

    <div class="progress-wrap" v-if="progressPct > 0 && progressPct < 100">
      <div class="progress-track">
        <div class="progress-inner" :style="{ width: progressPct + '%' }"></div>
      </div>
      <div class="progress-text">
        正在处理 {{ progressCurrent }} / {{ progressTotal }} 条，{{ Math.round(progressPct) }}%
      </div>
    </div>

    <el-button link style="margin-left: auto;" @click="emit('refresh')">
      <el-icon><Refresh /></el-icon>
      刷新
    </el-button>
  </div>

  <el-dialog v-model="opDialogVisible" :title="'批量操作 - ' + currentOp?.label" width="520px">
    <div v-if="currentOp?.needsReview" style="margin-bottom: 16px;">
      <el-alert type="warning" :closable="false" show-icon title="重要提示">
        <div>
          <div>本次操作包含<span style="font-weight: 600; color: #faad14;">需人工复核</span>的专属展演场次。</div>
          <div>操作将由运营主管复核后正式生效，复核通过前不会影响前台展示。</div>
          <div style="margin-top: 8px; color: #8c8c8c; font-size: 12px;">
            <el-icon><InfoFilled /></el-icon>
            您当前角色：{{ userRole }}
          </div>
        </div>
      </el-alert>
    </div>

    <div v-if="currentOp?.value === 'increase_holiday'">
      <el-form label-width="100px">
        <el-form-item label="增加库存" required>
          <el-input-number v-model="formQuota.addQuota" :min="1" :max="5000" :step="50"
            controls-position="right" style="width: 200px;" />
          <span style="margin-left: 8px; color: #8c8c8c;">张</span>
        </el-form-item>
        <el-form-item label="生效时段">
          <el-radio-group v-model="formQuota.scope">
            <el-radio value="local">仅选中场次</el-radio>
            <el-radio value="global">同景点同类型节假日场次</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作原因">
          <el-input v-model="formQuota.reason" type="textarea" :rows="2" maxlength="200" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
    </div>

    <div v-else-if="currentOp?.value === 'set_status'">
      <el-form label-width="100px">
        <el-form-item label="目标状态" required>
          <el-select v-model="formStatus.status" placeholder="选择状态" style="width: 200px;">
            <el-option label="开放预约" value="active" />
            <el-option label="已锁定" value="locked" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作原因">
          <el-input v-model="formStatus.reason" type="textarea" :rows="2" maxlength="200" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
    </div>

    <div v-else-if="currentOp?.value === 'adjust_quota'">
      <el-form label-width="100px">
        <el-form-item label="新配额" required>
          <el-input-number v-model="formAdjustQuota.totalQuota" :min="0" :max="10000" :step="50"
            controls-position="right" style="width: 200px;" />
          <span style="margin-left: 8px; color: #8c8c8c;">张</span>
        </el-form-item>
        <el-form-item label="操作原因">
          <el-input v-model="formAdjustQuota.reason" type="textarea" :rows="2" maxlength="200" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
    </div>

    <div v-else-if="currentOp?.value === 'adjust_limit'">
      <el-form label-width="100px">
        <el-form-item label="单次限购" required>
          <el-input-number v-model="formAdjustLimit.perOrderLimit" :min="1" :max="100"
            controls-position="right" style="width: 200px;" />
          <span style="margin-left: 8px; color: #8c8c8c;">张</span>
        </el-form-item>
        <el-form-item label="操作原因">
          <el-input v-model="formAdjustLimit.reason" type="textarea" :rows="2" maxlength="200" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
    </div>

    <div v-else-if="currentOp?.value === 'adjust_advance'">
      <el-form label-width="120px">
        <el-form-item label="最少提前(小时)">
          <el-input-number v-model="formAdvance.minAdvanceHours" :min="0" :max="720"
            controls-position="right" style="width: 180px;" />
        </el-form-item>
        <el-form-item label="最大提前(天)">
          <el-input-number v-model="formAdvance.maxAdvanceDays" :min="1" :max="365"
            controls-position="right" style="width: 180px;" />
        </el-form-item>
        <el-form-item label="开场前关闭(分钟)">
          <el-input-number v-model="formAdvance.autoCloseMinutes" :min="0" :max="300" :step="5"
            controls-position="right" style="width: 180px;" />
        </el-form-item>
        <el-form-item label="操作原因">
          <el-input v-model="formAdvance.reason" type="textarea" :rows="2" maxlength="200" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
    </div>

    <div v-else>
      <el-alert type="info" :closable="false" show-icon>
        <div>
          <div>即将 <b style="color: #1890ff;">{{ currentOp?.label }}</b> 选中的 {{ props.selectedCount }} 条场次。</div>
          <div style="margin-top: 6px; color: #595959;">操作生效后将自动联动前台展示与预约权限。</div>
        </div>
      </el-alert>
      <el-form label-width="100px" style="margin-top: 16px;">
        <el-form-item label="操作原因">
          <el-input v-model="reasonText" type="textarea" :rows="2" maxlength="200" placeholder="请填写操作原因（选填）" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="opDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmOp">确定执行</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Lock, Delete, SwitchButton, Edit, Key, Clock,
  Select, Refresh, Warning, InfoFilled
} from '@element-plus/icons-vue'
import { batchInventoryOperation, checkInventoryPermission } from '@/api/ticketInventory'
import { InventoryBatchOperationEnum } from '@/utils/enums'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 },
  sessionType: { type: String, default: 'daily' }
})
const emit = defineEmits(['success', 'refresh'])

const userRole = ref('ticket_operator')
const loadingOp = ref('')
const opDialogVisible = ref(false)
const currentOp = ref(null)
const reasonText = ref('')
const progressPct = ref(0)
const progressCurrent = ref(0)
const progressTotal = ref(0)

const formQuota = reactive({ addQuota: 100, scope: 'local', reason: '' })
const formStatus = reactive({ status: 'locked', reason: '' })
const formAdjustQuota = reactive({ totalQuota: 200, reason: '' })
const formAdjustLimit = reactive({ perOrderLimit: 5, reason: '' })
const formAdvance = reactive({ minAdvanceHours: 0, maxAdvanceDays: 30, autoCloseMinutes: 30, reason: '' })

const batchOps = computed(() => [
  { ...InventoryBatchOperationEnum.increase_holiday, type: 'warning', icon: Plus },
  { ...InventoryBatchOperationEnum.lock_full, type: 'default', icon: Lock },
  { ...InventoryBatchOperationEnum.clear_expired, type: 'danger', icon: Delete },
  { ...InventoryBatchOperationEnum.set_status, type: 'primary', icon: SwitchButton },
  { ...InventoryBatchOperationEnum.adjust_quota, type: 'success', icon: Edit },
  { ...InventoryBatchOperationEnum.adjust_limit, type: 'default', icon: Key },
  { ...InventoryBatchOperationEnum.adjust_advance, type: 'info', icon: Clock }
])

const mockProgress = (total) => {
  progressTotal.value = total
  progressCurrent.value = 0
  progressPct.value = 0
  const step = total / 20
  const timer = setInterval(() => {
    progressCurrent.value = Math.min(progressCurrent.value + step, total)
    progressPct.value = Math.min((progressCurrent.value / total) * 100, 100)
    if (progressPct.value >= 100) {
      clearInterval(timer)
      setTimeout(() => { progressPct.value = 0 }, 600)
    }
  }, 120)
}

const openOp = async (op) => {
  try {
    const r = await checkInventoryPermission('batch')
    if (!r.data?.allowed) {
      ElMessage.error('无批量操作权限')
      return
    }
  } catch (e) { /* ignore */ }

  currentOp.value = op
  if (op.value === 'increase_holiday' || op.value === 'set_status' ||
      op.value === 'adjust_quota' || op.value === 'adjust_limit' ||
      op.value === 'adjust_advance') {
    opDialogVisible.value = true
  } else {
    try {
      await ElMessageBox.confirm(
        `确定执行"${op.label}"操作吗？选中 ${props.selectedCount} 条记录`,
        '提示', { type: 'warning' }
      )
      confirmOp()
    } catch (e) { /* ignore cancel */ }
  }
}

const confirmOp = async () => {
  const op = currentOp.value
  if (!op) return

  loadingOp.value = op.value
  mockProgress(props.selectedCount)

  try {
    const payload = {
      ids: props.selectedIds,
      operation: op.value,
      reason: reasonText.value,
      scope: 'local',
      applyTo: {},
      updateFields: {}
    }

    switch (op.value) {
      case 'increase_holiday':
        payload.reason = formQuota.reason
        payload.scope = formQuota.scope
        payload.updateFields.addQuota = formQuota.addQuota
        if (formQuota.scope === 'global') {
          payload.applyTo.sessionType = 'holiday'
        }
        break
      case 'set_status':
        payload.reason = formStatus.reason
        payload.updateFields.status = formStatus.status
        break
      case 'adjust_quota':
        payload.reason = formAdjustQuota.reason
        payload.updateFields.totalQuota = formAdjustQuota.totalQuota
        break
      case 'adjust_limit':
        payload.reason = formAdjustLimit.reason
        payload.updateFields.perOrderLimit = formAdjustLimit.perOrderLimit
        break
      case 'adjust_advance':
        payload.reason = formAdvance.reason
        payload.updateFields.minAdvanceHours = formAdvance.minAdvanceHours
        payload.updateFields.maxAdvanceDays = formAdvance.maxAdvanceDays
        payload.updateFields.autoCloseMinutes = formAdvance.autoCloseMinutes
        break
      case 'lock_full':
        payload.reason = reasonText.value || '批量锁定满员场次'
        break
      case 'clear_expired':
        payload.reason = reasonText.value || '批量清空过期场次'
        break
    }

    const r = await batchInventoryOperation(payload)
    emit('success', r.data)
    ElMessage.success(r.message || '批量操作完成')
    opDialogVisible.value = false
    reasonText.value = ''
  } finally {
    loadingOp.value = ''
  }
}
</script>
