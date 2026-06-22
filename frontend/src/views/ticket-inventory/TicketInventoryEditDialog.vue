<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:modelValue', v)"
    :title="isEdit ? '调整库存' : '新增库存'"
    width="880px"
    class="inventory-edit-dialog"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <el-form :model="form" ref="formRef" :rules="rules" label-width="110px" label-position="right">
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          基本信息
        </div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属景点" prop="scenicSpotId">
              <el-select v-model="form.scenicSpotId" placeholder="选择景点"
                filterable remote :remote-method="searchScenicSpots"
                @change="onScenicSpotChange" clearable style="width: 100%;">
                <el-option v-for="s in scenicOptions" :key="s.id" :label="s.name" :value="s.id">
                  <span>{{ s.name }}</span>
                  <span style="float: right; color: #8c8c8c; font-size: 12px;">{{ s.city }} · {{ getSpotTypeLabel(s.spotType) }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联票种" prop="ticketTypeId">
              <el-select v-model="form.ticketTypeId" placeholder="选择票种"
                filterable :disabled="!form.scenicSpotId" clearable style="width: 100%;">
                <el-option v-for="t in ticketTypeOptions" :key="t.id" :label="t.name" :value="t.id">
                  <span>{{ t.name }}</span>
                  <span style="float: right; color: #8c8c8c; font-size: 12px;">¥{{ t.price }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="场次类型" prop="sessionType">
              <el-select v-model="form.sessionType" style="width: 100%;">
                <el-option v-for="c in sessionTypeOptions" :key="c.value" :label="c.label" :value="c.value">
                  <span :style="{ color: c.color }">●</span> {{ c.label }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="场次日期" prop="sessionDate">
              <el-date-picker v-model="form.sessionDate" type="date" placeholder="选择日期"
                value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="场次名称" prop="sessionName">
              <el-input v-model="form.sessionName" placeholder="如：上午场、下午场" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="时段范围" required>
              <div class="time-range-row">
                <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" placeholder="开始时间" style="width: 45%;" />
                <el-icon class="arrow-icon"><Right /></el-icon>
                <el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" placeholder="结束时间" style="width: 45%;" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="需人工复核">
              <el-switch v-model="form.requiresReview" active-text="是" inactive-text="否" />
              <el-tooltip v-if="form.requiresReview" content="展演类热门场次需运营主管复核后生效">
                <el-icon style="color: #faad14; margin-left: 6px;"><Warning /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <div class="form-section">
        <div class="section-title">
          <el-icon><Tickets /></el-icon>
          库存配额
        </div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="总配额" prop="totalQuota" :class="{ 'over-quota': quotaOverLimit }">
              <div class="quota-item" :class="{ 'over-quota': quotaOverLimit }">
                <el-input-number v-model="form.totalQuota" :min="0" :max="maxQuotaLimit" :step="10"
                  controls-position="right" style="width: 100%;" @change="checkQuotaValidation" />
                <span v-if="quotaValid && form.totalQuota > 0" class="valid-badge">
                  <el-icon><CircleCheckFilled /></el-icon>
                </span>
              </div>
              <div v-if="maxQuotaLimit" style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
                景点最大限制：{{ maxQuotaLimit }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="锁定数量" prop="lockedCount">
              <div class="quota-item">
                <el-input-number v-model="form.lockedCount" :min="0" :max="form.totalQuota || 999999" :step="10"
                  controls-position="right" style="width: 100%;" @change="checkQuotaValidation" />
                <span v-if="lockedValid && form.lockedCount > 0" class="valid-badge">
                  <el-icon><CircleCheckFilled /></el-icon>
                </span>
              </div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
                锁定后不参与售卖
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单次限购" prop="perOrderLimit">
              <div class="quota-item">
                <el-input-number v-model="form.perOrderLimit" :min="1" :max="100"
                  controls-position="right" style="width: 100%;" />
                <span v-if="form.perOrderLimit >= 1 && form.perOrderLimit <= 10" class="valid-badge">
                  <el-icon><CircleCheckFilled /></el-icon>
                </span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <div v-if="form.totalQuota >= 0" class="quota-preview">
              <span>可用库存：<b :class="{ 'over-quota': availableCount < 10 }">{{ availableCount }}</b></span>
              <el-tooltip v-if="availableCount < 10 && form.totalQuota > 0" content="可用库存较少，建议增加配额">
                <el-icon style="color: #faad14; margin-left: 6px;"><Warning /></el-icon>
              </el-tooltip>
              <span style="margin-left: 24px;">已预约：{{ form.reservedCount || 0 }}</span>
              <span style="margin-left: 24px;">已核销：{{ form.usedCount || 0 }}</span>
              <span style="margin-left: 24px;">售卖率：{{ sellRate }}%</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <div class="form-section">
        <div class="section-title">
          <el-icon><Clock /></el-icon>
          预约规则
        </div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最少提前">
              <el-input-number v-model="form.minAdvanceHours" :min="0" :max="720" :step="1"
                controls-position="right" style="width: 100%;" />
              <span style="font-size: 12px; color: #8c8c8c;">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大提前">
              <el-input-number v-model="form.maxAdvanceDays" :min="1" :max="365" :step="1"
                controls-position="right" style="width: 100%;" />
              <span style="font-size: 12px; color: #8c8c8c;">天</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开场关闭">
              <el-input-number v-model="form.autoCloseMinutes" :min="0" :max="300" :step="5"
                controls-position="right" style="width: 100%;" />
              <span style="font-size: 12px; color: #8c8c8c;">分钟前</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <div v-if="conflictList.length" class="conflict-alert">
        <el-alert title="检测到规则冲突" type="error" :closable="false" show-icon>
          <div class="conflict-item" v-for="(c, i) in conflictList" :key="i">
            <span class="field-tag">{{ c.field }}</span>
            <span>{{ c.message }}</span>
          </div>
        </el-alert>
      </div>

      <div v-if="warningList.length" style="margin-bottom: 16px;">
        <el-alert title="校验警告" type="warning" :closable="false" show-icon>
          <div v-for="(w, i) in warningList" :key="i" style="padding: 2px 0;">· {{ w }}</div>
        </el-alert>
      </div>

      <div class="preview-box">
        <div class="preview-title">
          <el-icon><View /></el-icon>
          前台展示预览
        </div>
        <div v-for="(line, i) in previewTexts" :key="i" class="preview-line">
          <span class="label">{{ line.label }}</span>
          <span class="value">{{ line.value }}</span>
        </div>
      </div>

      <el-form-item label="备注" style="margin-top: 20px;">
        <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" placeholder="选填，仅内部可见" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : (isEdit ? '保存调整' : '创建库存') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  InfoFilled, Tickets, Clock, Right, Warning, CircleCheckFilled, View
} from '@element-plus/icons-vue'
import { searchScenicSpots as searchSpots, getTicketTypeList } from '@/api/ticketType'
import { createTicketInventory, updateTicketInventory } from '@/api/ticketInventory'
import {
  InventorySessionTypeEnum, ScenicSpotTypeEnum
} from '@/utils/enums'

const props = defineProps({
  modelValue: Boolean,
  editData: Object,
  sessionType: { type: String, default: 'daily' }
})
const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed(() => props.modelValue)
const isEdit = computed(() => !!props.editData)

const formRef = ref(null)
const submitting = ref(false)
const scenicOptions = ref([])
const ticketTypeOptions = ref([])
const conflictList = ref([])
const warningList = ref([])
const quotaValid = ref(false)
const lockedValid = ref(false)
const maxQuotaLimit = ref(2000)

const SPOT_TYPE_QUOTA = {
  natural: 2000, cultural: 1500, theme: 5000, performance: 1000
}

const form = reactive({
  scenicSpotId: null,
  ticketTypeId: null,
  sessionType: 'daily',
  sessionDate: '',
  sessionName: '',
  startTime: '09:00',
  endTime: '17:00',
  totalQuota: 100,
  reservedCount: 0,
  usedCount: 0,
  lockedCount: 0,
  perOrderLimit: 5,
  minAdvanceHours: 0,
  maxAdvanceDays: 30,
  autoCloseMinutes: 30,
  requiresReview: 0,
  remark: ''
})

const rules = {
  scenicSpotId: [{ required: true, message: '请选择景点', trigger: 'change' }],
  ticketTypeId: [{ required: true, message: '请选择票种', trigger: 'change' }],
  sessionType: [{ required: true, message: '请选择场次类型', trigger: 'change' }],
  sessionDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  sessionName: [{ required: true, message: '请输入场次名称', trigger: 'blur' }],
  totalQuota: [{ required: true, message: '请输入总配额', trigger: 'blur' }]
}

const sessionTypeOptions = computed(() => Object.values(InventorySessionTypeEnum))
const availableCount = computed(() => Math.max(0, (form.totalQuota || 0) - (form.reservedCount || 0) - (form.usedCount || 0) - (form.lockedCount || 0)))
const sellRate = computed(() => {
  const t = form.totalQuota || 0
  if (t === 0) return 0
  return Math.round(((form.reservedCount || 0) + (form.usedCount || 0)) / t * 100)
})
const quotaOverLimit = computed(() => form.totalQuota > maxQuotaLimit.value)

const getSpotTypeLabel = (t) => ScenicSpotTypeEnum[t]?.label || t

const searchScenicSpots = async (kw) => {
  try {
    const r = await searchSpots({ keyword: kw, pageSize: 20 })
    scenicOptions.value = r.data?.list || []
  } catch (e) { /* ignore */ }
}

const onScenicSpotChange = async (spotId) => {
  const spot = scenicOptions.value.find(s => s.id === spotId)
  if (spot) {
    maxQuotaLimit.value = SPOT_TYPE_QUOTA[spot.spotType] || 2000
    if (spot.spotType === 'performance') {
      form.requiresReview = 1
    }
    try {
      const r = await getTicketTypeList({ scenicSpotId: spotId, status: 1, enabled: 1, pageSize: 100 })
      ticketTypeOptions.value = r.data?.list || []
    } catch (e) { /* ignore */ }
  } else {
    ticketTypeOptions.value = []
  }
  checkQuotaValidation()
}

const checkQuotaValidation = () => {
  quotaValid.value = false
  lockedValid.value = false
  conflictList.value = []
  warningList.value = []

  if (form.totalQuota < 0) {
    conflictList.value.push({ field: 'totalQuota', message: '库存配额不能为负数' })
  } else if (form.totalQuota > maxQuotaLimit.value) {
    conflictList.value.push({ field: 'totalQuota', message: `单场次配额不能超过景点限制 ${maxQuotaLimit.value}` })
  } else if (form.totalQuota > 0) {
    quotaValid.value = true
  }

  if (form.lockedCount < 0) {
    conflictList.value.push({ field: 'lockedCount', message: '锁定数量不能为负数' })
  } else if (form.lockedCount > form.totalQuota) {
    conflictList.value.push({ field: 'lockedCount', message: '锁定数量不能超过总配额' })
  } else if (form.lockedCount > 0) {
    lockedValid.value = true
  }

  if (availableCount.value < 0) {
    conflictList.value.push({ field: 'available', message: '可用库存不足，总配额小于已占用+锁定数量' })
  }

  if (form.totalQuota > 0 && form.totalQuota <= 50) {
    warningList.value.push('库存配额较小，建议关注库存不足情况')
  }
  if (form.lockedCount > form.totalQuota * 0.3) {
    warningList.value.push('锁定数量超过总配额30%，建议释放部分库存')
  }

  if (form.startTime && form.endTime) {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    if (toMin(form.startTime) >= toMin(form.endTime)) {
      conflictList.value.push({ field: 'timeRange', message: '结束时间必须晚于开始时间' })
    }
  }
}

const previewTexts = computed(() => {
  const spot = scenicOptions.value.find(s => s.id === form.scenicSpotId)
  const tt = ticketTypeOptions.value.find(t => t.id === form.ticketTypeId)
  const lines = [
    { label: '场次名称', value: form.sessionName || '未设置' },
    { label: '场次信息', value: `${form.sessionDate || '未选择'} ${form.startTime || '--:--'} - ${form.endTime || '--:--'}` },
    { label: '所属景点', value: spot?.name || '未选择' },
    { label: '关联票种', value: tt ? `${tt.name} (¥${tt.price})` : '未选择' },
    { label: '可售数量', value: availableCount.value + ` / ${form.totalQuota || 0}（已售 ${sellRate.value}%）` },
    { label: '购买限制', value: `单订单限${form.perOrderLimit}张` },
    { label: '预约规则', value: `提前${form.minAdvanceHours}小时预约，开场前${form.autoCloseMinutes}分钟关闭` }
  ]
  return lines
})

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  if (conflictList.value.length) {
    ElMessage.error('存在规则冲突，请先修复')
    return
  }

  submitting.value = true
  try {
    const payload = { ...form }
    payload.requiresReview = payload.requiresReview ? 1 : 0
    if (isEdit.value) {
      const r = await updateTicketInventory(props.editData.id, payload)
      emit('success', r.data)
      ElMessage.success(r.data?.blocked ? '调整已提交，待审核后生效' : '库存调整成功')
    } else {
      const r = await createTicketInventory(payload)
      emit('success', r.data)
      ElMessage.success(r.data?.blocked ? '创建已提交，待审核后生效' : '库存创建成功')
    }
    emit('update:modelValue', false)
  } finally { submitting.value = false }
}

const onOpen = () => {
  scenicOptions.value = []
  ticketTypeOptions.value = []
  conflictList.value = []
  warningList.value = []
  quotaValid.value = false
  lockedValid.value = false

  if (isEdit.value) {
    Object.assign(form, props.editData)
    maxQuotaLimit.value = props.editData.scenicSpot?.spotType ? SPOT_TYPE_QUOTA[props.editData.scenicSpot.spotType] : 2000
    if (props.editData.scenicSpot) {
      scenicOptions.value = [props.editData.scenicSpot]
    }
    if (props.editData.ticketType) {
      ticketTypeOptions.value = [props.editData.ticketType]
    }
  } else {
    Object.assign(form, {
      scenicSpotId: null, ticketTypeId: null,
      sessionType: props.sessionType || 'daily',
      sessionDate: '', sessionName: '',
      startTime: '09:00', endTime: '17:00',
      totalQuota: 100, reservedCount: 0, usedCount: 0, lockedCount: 0,
      perOrderLimit: 5, minAdvanceHours: 0, maxAdvanceDays: 30,
      autoCloseMinutes: 30, requiresReview: 0, remark: ''
    })
  }
  checkQuotaValidation()
}

watch([() => form.totalQuota, () => form.lockedCount, () => form.startTime, () => form.endTime], () => {
  checkQuotaValidation()
})
</script>
