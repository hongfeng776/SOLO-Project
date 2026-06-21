<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:visible', v)"
    :title="isCopy ? '复制新建票种' : (ticketId ? '编辑票种规则' : '新增票种规则')"
    width="760px"
    class="ticket-type-ops edit-dialog-form focus-glow"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="right">
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <el-form-item label="票种品类" prop="ticketCategory" required>
          <el-select v-model="formData.ticketCategory"
            style="width: 200px;"
            :disabled="!!ticketId"
            @change="onCategoryChange">
            <el-option v-for="c in Object.values(TicketCategoryEnum)" :key="c.value"
              :label="c.label" :value="c.value" />
          </el-select>
          <el-tag v-if="formData.ticketCategory === 'package'" size="small" type="danger" effect="light" style="margin-left: 10px;">
            特惠套票需专项权限
          </el-tag>
        </el-form-item>

        <el-form-item label="所属景点" prop="scenicSpotId" required>
          <el-select v-model="formData.scenicSpotId" filterable remote :remote-method="searchScenicSpots"
            placeholder="搜索并选择景点"
            :disabled="!!ticketId"
            style="width: 360px;"
            @change="onScenicSpotChange"
            :loading="spotSearching">
            <el-option v-for="s in scenicSpotList" :key="s.id"
              :label="s.name + ' (' + (s.city || '') + ')'" :value="s.id">
              <div style="display: flex; justify-content: space-between; width: 100%;">
                <span>{{ s.name }}</span>
                <el-tag size="small" style="margin-left: 10px;">{{ s.spotType }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <div v-if="currentSpotInfo" style="width: 100%; margin-top: 4px; font-size: 12px; color: #909399;">
            当前景点：{{ currentSpotInfo.name }} · {{ currentSpotInfo.city }} ·
            <span v-if="currentSpotInfo.businessStatus !== 'operating'" style="color: #fa8c16;">
              {{ currentSpotInfo.businessStatus }}，票种可能被暂停售卖
            </span>
            <span v-else style="color: #52c41a;">营业中</span>
          </div>
        </el-form-item>

        <el-form-item
          label="票种名称"
          prop="name"
          required
          :class="{ 'conflict-field': conflictFields.has('name') }">
          <div class="field-with-check">
            <el-input v-model="formData.name"
              placeholder="请输入票种名称（如：成人日场票）"
              maxlength="100"
              :class="{ 'shake-error': shakeField === 'name' }"
              @blur="validateField('name')"
              @input="onFieldInput('name')"
              style="flex: 1;" />
            <el-icon v-if="validFields.has('name')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="售价" prop="price" required
              :class="{ 'conflict-field': conflictFields.has('price') }">
              <div class="field-with-check">
                <el-input-number v-model="formData.price"
                  :min="0" :precision="2" :step="10"
                  @change="onPriceChange"
                  style="width: 100%;" />
                <el-icon v-if="validFields.has('price')" class="valid-check-icon">
                  <CircleCheckFilled />
                </el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number v-model="formData.originalPrice"
                :min="0" :precision="2" :step="10"
                style="width: 100%;" />
              <div v-if="formData.originalPrice && formData.originalPrice > formData.price" style="font-size: 12px; color: #eb2f96; margin-top: 4px;">
                优惠力度：{{ ((1 - formData.price / formData.originalPrice) * 100).toFixed(0) }}% OFF
              </div>
              <div v-if="formData.ticketCategory === 'package' && formData.originalPrice && Number(formData.price) > Number(formData.originalPrice)"
                style="font-size: 12px; color: #ff4d4f; margin-top: 4px;">
                ⚠ 特惠套票售价不应高于原价
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <div class="section-title">适用人群规则</div>
        <el-form-item label="人群说明" prop="audienceDescription" required>
          <div class="field-with-check">
            <el-input v-model="formData.audienceDescription"
              placeholder="如：身高1.4m以上成人（前台展示）"
              :class="{ 'shake-error': shakeField === 'audienceDescription' }"
              @blur="validateField('audienceDescription')"
              @input="onFieldInput('audienceDescription')"
              style="flex: 1;" />
            <el-icon v-if="validFields.has('audienceDescription')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="年龄下限">
              <el-input-number v-model="ageMin" :min="0" :max="120" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄上限">
              <el-input-number v-model="ageMax" :min="0" :max="120" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="证件类型">
              <el-select v-model="certTypes" multiple collapse-tags placeholder="选择" style="width: 100%;">
                <el-option label="身份证" value="idcard" />
                <el-option label="学生证" value="student" />
                <el-option label="老年证" value="elder" />
                <el-option label="残疾人证" value="disabled" />
                <el-option label="军官证" value="military" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="需实名认证">
              <el-switch v-model="formData.reservationRule.realNameRequired" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每单限购">
              <el-input-number v-model="formData.perOrderLimit" :min="1" :max="99" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <div class="section-title">使用时段规则</div>
        <el-form-item label="时段说明" prop="timeDescription">
          <div class="field-with-check">
            <el-input v-model="formData.timeDescription"
              placeholder="如：周一至周日 08:00-17:00"
              style="flex: 1;"
              @blur="syncTimeRule" />
          </div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="开始时间">
              <el-time-picker v-model="timeStart" value-format="HH:mm" placeholder="开始" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束时间">
              <el-time-picker v-model="timeEnd" value-format="HH:mm" placeholder="结束" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提前购票">
              <el-input-number v-model="advanceDays" :min="0" :max="30" style="width: 100%;" />
              <span style="font-size: 12px; color: #909399;">天</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="适用星期">
          <el-checkbox-group v-model="weekdays">
            <el-checkbox :label="1">一</el-checkbox>
            <el-checkbox :label="2">二</el-checkbox>
            <el-checkbox :label="3">三</el-checkbox>
            <el-checkbox :label="4">四</el-checkbox>
            <el-checkbox :label="5">五</el-checkbox>
            <el-checkbox :label="6">六</el-checkbox>
            <el-checkbox :label="7">日</el-checkbox>
          </el-checkbox-group>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">不选=全周适用</span>
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">预约与退改规则</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="是否需预约"
              :class="{ 'conflict-field': conflictFields.has('reservationRequired') }">
              <el-switch v-model="formData.reservationRequired" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用有效期">
              <el-input-number v-model="formData.validityDays" :min="1" :max="365" style="width: 160px;" />
              <span style="margin-left: 6px; font-size: 12px; color: #909399;">天（购票后）</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12" v-if="formData.reservationRequired">
          <el-col :span="12">
            <el-form-item label="提前预约">
              <el-input-number v-model="formData.reservationRule.advanceHours"
                :min="0" :max="720" style="width: 100%;" />
              <span style="font-size: 12px; color: #909399;">小时前</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日配额">
              <el-input-number v-model="formData.dailyQuota" :min="0" :max="99999" style="width: 100%;" />
              <span style="font-size: 12px; color: #909399;">0=不限</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left" style="margin: 0 0 14px;">退改</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="是否可退">
              <el-switch v-model="formData.refundPolicy.refundable" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否可改">
              <el-switch v-model="formData.refundPolicy.changeable" />
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="formData.refundPolicy.refundable">
            <el-form-item label="扣费比例">
              <el-input-number v-model="formData.refundPolicy.deductRate"
                :min="0" :max="100" style="width: 100%;" />
              <span style="font-size: 12px; color: #909399;">%</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12" v-if="formData.refundPolicy.refundable">
          <el-col :span="12">
            <el-form-item label="退票提前">
              <el-input-number v-model="formData.refundPolicy.beforeMinutes"
                :min="0" :max="10080" style="width: 100%;" />
              <span style="font-size: 12px; color: #909399;">分钟前（0=使用前均可）</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="退改说明" prop="refundDescription">
          <div class="field-with-check">
            <el-input v-model="formData.refundDescription"
              type="textarea" :rows="2"
              placeholder="前台展示的退改文字说明"
              style="flex: 1;" />
          </div>
        </el-form-item>
      </div>

      <div class="form-section" v-if="formData.ticketCategory === 'package'">
        <div class="section-title">特惠套票专属配置</div>
        <el-alert type="warning" show-icon :closable="false"
          title="专项权限提醒"
          description="特惠套票修改需 package_auditor 或 senior_ticket_operator 权限；虚假折扣、套票空包含项目均会被自动拦截。"
          style="margin-bottom: 14px;" />
        <el-form-item label="包含项目" prop="includeItems">
          <div style="width: 100%;">
            <div v-for="(item, idx) in includeItems" :key="idx" style="display: flex; gap: 10px; margin-bottom: 8px;">
              <el-input v-model="item.name" placeholder="项目名称" style="flex: 1;" />
              <el-input-number v-model="item.count" :min="1" :max="999" style="width: 100px;" />
              <el-button type="danger" link @click="includeItems.splice(idx, 1)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button size="small" @click="addIncludeItem">
              <el-icon><Plus /></el-icon>添加项目
            </el-button>
          </div>
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">费用说明与购买须知</div>
        <el-form-item label="费用不含">
          <el-input v-model="formData.exclusionNotes" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
        <el-form-item label="购买须知" prop="purchaseInstructions">
          <el-input v-model="formData.purchaseInstructions"
            type="textarea" :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="规则变更后本须知将同步推送至已下单用户" />
        </el-form-item>
        <el-form-item label="展示排序">
          <el-slider v-model="formData.displayOrder" :min="0" :max="150" show-input style="width: 60%;" />
        </el-form-item>
      </div>

      <div v-if="conflictList.length" class="conflict-list">
        <div v-for="(c, i) in conflictList" :key="i" class="conflict-item">
          <el-icon><WarningFilled /></el-icon>
          {{ c.message }}
        </div>
      </div>

      <div v-if="previewTexts.length" class="preview-box">
        <div class="preview-label">前台展示预览（系统自动生成）</div>
        <div v-for="(p, i) in previewTexts" :key="i" class="preview-text">· {{ p }}</div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit" v-ripple>
        {{ ticketId ? '保存修改' : '创建票种' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Delete, Plus, WarningFilled } from '@element-plus/icons-vue'
import {
  getTicketType, createTicketType, updateTicketType
} from '@/api/ticketType'
import { getScenicSpotList } from '@/api/scenicSpot'
import { TicketCategoryEnum } from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  ticketId: { type: [Number, String], default: null },
  copyFrom: { type: Object, default: null },
  ticketCategory: { type: String, default: 'adult' }
})
const emit = defineEmits(['update:visible', 'success', 'toast'])

const isCopy = computed(() => !!props.copyFrom)
const submitting = ref(false)
const shakeField = ref('')
const validFields = ref(new Set())
const conflictFields = ref(new Set())
const conflictList = ref([])
const formRef = ref(null)

const scenicSpotList = ref([])
const spotSearching = ref(false)
const currentSpotInfo = ref(null)

const ageMin = ref(null)
const ageMax = ref(null)
const certTypes = ref([])
const timeStart = ref('')
const timeEnd = ref('')
const weekdays = ref([])
const advanceDays = ref(0)
const includeItems = ref([])

const formData = reactive({
  ticketCategory: 'adult',
  scenicSpotId: null,
  name: '',
  price: 0,
  originalPrice: 0,
  audienceDescription: '',
  applicableAudience: {},
  timeDescription: '',
  useTimeRule: {},
  reservationRequired: 0,
  reservationRule: { realNameRequired: false, advanceHours: 0, maxPerOrder: 5, verifyMethod: 'idcard', idCardSlots: null },
  refundPolicy: { refundable: true, changeable: false, beforeMinutes: 0, deductRate: 0, noShowFee: 0 },
  refundDescription: '',
  dailyQuota: 0,
  perOrderLimit: 5,
  validityDays: 1,
  includeItems: [],
  exclusionNotes: '',
  purchaseInstructions: '',
  displayOrder: 50
})

const formRules = computed(() => ({
  ticketCategory: [{ required: true, message: '请选择票种品类', trigger: 'change' }],
  scenicSpotId: [{ required: true, message: '请选择所属景点', trigger: 'change' }],
  name: [
    { required: true, message: '请输入票种名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度 2-100 字符', trigger: 'blur' }
  ],
  price: [{ required: true, validator: (r, v, cb) => {
    if (v === null || v === undefined || Number(v) < 0) cb(new Error('售价不能为负数'))
    else cb()
  }, trigger: 'change' }],
  audienceDescription: [{ required: true, message: '请填写适用人群说明', trigger: 'blur' }]
}))

const previewTexts = computed(() => {
  const items = []
  if (formData.price !== undefined) items.push(`售价 ¥${Number(formData.price).toFixed(2)}${formData.originalPrice ? '（原价¥' + Number(formData.originalPrice).toFixed(2) + '）' : ''}`)
  if (formData.audienceDescription) items.push(`适用人群：${formData.audienceDescription}`)
  if (formData.timeDescription) items.push(`使用时段：${formData.timeDescription}`)
  if (formData.reservationRequired) items.push(formData.reservationRule.advanceHours > 0 ? `需提前${formData.reservationRule.advanceHours}小时预约` : '需预约')
  if (formData.refundPolicy) {
    if (formData.refundPolicy.refundable) {
      items.push(`退款：${formData.refundPolicy.beforeMinutes ? '使用前' + Math.round(formData.refundPolicy.beforeMinutes / 60) + '小时前可退' : '使用前可退'}${formData.refundPolicy.deductRate ? `（扣费${formData.refundPolicy.deductRate}%）` : '（免费）'}`)
    } else {
      items.push('退款：不可退')
    }
  }
  if (formData.validityDays > 1) items.push(`购票后${formData.validityDays}天内有效`)
  return items
})

const resetForm = () => {
  Object.assign(formData, {
    ticketCategory: props.ticketCategory || 'adult',
    scenicSpotId: null,
    name: '', price: 0, originalPrice: 0,
    audienceDescription: '', applicableAudience: {},
    timeDescription: '', useTimeRule: {},
    reservationRequired: 0,
    reservationRule: { realNameRequired: false, advanceHours: 0, maxPerOrder: 5, verifyMethod: 'idcard' },
    refundPolicy: { refundable: true, changeable: false, beforeMinutes: 0, deductRate: 0, noShowFee: 0 },
    refundDescription: '',
    dailyQuota: 0, perOrderLimit: 5, validityDays: 1,
    includeItems: [], exclusionNotes: '', purchaseInstructions: '', displayOrder: 50
  })
  ageMin.value = null; ageMax.value = null; certTypes.value = []
  timeStart.value = ''; timeEnd.value = ''; weekdays.value = []
  advanceDays.value = 0; includeItems.value = []
  validFields.value = new Set()
  conflictFields.value = new Set()
  conflictList.value = []
  shakeField.value = ''
  currentSpotInfo.value = null
  formRef.value?.clearValidate()
}

const onOpen = async () => {
  resetForm()
  if (props.ticketId) {
    try {
      const res = await getTicketType(props.ticketId)
      if (res.data) {
        Object.assign(formData, res.data)
        formData.applicableAudience = res.data.applicableAudience || {}
        formData.useTimeRule = res.data.useTimeRule || {}
        formData.reservationRule = res.data.reservationRule || { realNameRequired: false, advanceHours: 0, maxPerOrder: 5 }
        formData.refundPolicy = res.data.refundPolicy || { refundable: true, changeable: false, beforeMinutes: 0, deductRate: 0 }
        ageMin.value = formData.applicableAudience.ageRange?.[0] ?? null
        ageMax.value = formData.applicableAudience.ageRange?.[1] ?? null
        certTypes.value = formData.applicableAudience.certType || []
        timeStart.value = formData.useTimeRule.timeRange?.[0] || ''
        timeEnd.value = formData.useTimeRule.timeRange?.[1] || ''
        weekdays.value = formData.useTimeRule.weekdays || []
        advanceDays.value = formData.useTimeRule.advanceDays || 0
        includeItems.value = formData.includeItems ? JSON.parse(JSON.stringify(formData.includeItems)) : []
        if (formData.scenicSpotId) {
          currentSpotInfo.value = {
            id: formData.scenicSpotId,
            name: res.data.scenicSpotNameCache,
            businessStatus: res.data.scenicSpot?.businessStatus || 'operating'
          }
        }
      }
    } catch (e) { ElMessage.error('加载票种失败') }
  } else if (props.copyFrom) {
    Object.assign(formData, props.copyFrom)
    formData.name = (props.copyFrom.name || '') + '（副本）'
    formData.id = undefined
    includeItems.value = formData.includeItems ? JSON.parse(JSON.stringify(formData.includeItems)) : []
  }
}

const searchScenicSpots = async (q) => {
  spotSearching.value = true
  try {
    const res = await getScenicSpotList({ name: q, page: 1, pageSize: 20 })
    scenicSpotList.value = res.data?.list || []
  } finally { spotSearching.value = false }
}

const onCategoryChange = () => {
  if (formData.ticketCategory === 'child') {
    ageMin.value = 3; ageMax.value = 12
  } else if (formData.ticketCategory === 'student') {
    if (!certTypes.value.includes('student')) certTypes.value.push('student')
  } else if (formData.ticketCategory === 'adult') {
    ageMin.value = 18; ageMax.value = 65
  }
  if (formData.ticketCategory !== 'package') includeItems.value = []
}

const onScenicSpotChange = async (id) => {
  try {
    const res = await getScenicSpotList({ page: 1, pageSize: 1 })
    // 简化处理，直接从 search 列表匹配
    const found = scenicSpotList.value.find(s => s.id === id)
    currentSpotInfo.value = found ? {
      id: found.id, name: found.name, city: found.city, businessStatus: found.businessStatus
    } : { id, name: '景点 #' + id, city: '', businessStatus: 'operating' }
    if (found && SPOT_TYPE_RESERVE_REQUIRED[found.spotType]) {
      formData.reservationRequired = 1
    }
  } catch (e) { /* ignore */ }
}

const SPOT_TYPE_RESERVE_REQUIRED = { theme: true, performance: true }

const onFieldInput = (f) => { if (shakeField.value === f) shakeField.value = ''; conflictFields.value.delete(f) }
const validateField = async (field) => {
  try {
    await formRef.value?.validateField(field)
    validFields.value.add(field)
    return true
  } catch (e) {
    shakeField.value = field
    validFields.value.delete(field)
    return false
  }
}

const syncApplicableAudience = () => {
  const aa = {}
  if (ageMin.value !== null || ageMax.value !== null) {
    aa.ageRange = [ageMin.value ?? 0, ageMax.value ?? 999]
  }
  if (certTypes.value.length) aa.certType = certTypes.value
  if (Object.keys(aa).length) formData.applicableAudience = aa
}
const syncTimeRule = () => {
  const tr = {}
  if (timeStart.value && timeEnd.value) tr.timeRange = [timeStart.value, timeEnd.value]
  if (weekdays.value && weekdays.value.length > 0 && weekdays.value.length < 7) tr.weekdays = weekdays.value
  if (advanceDays.value > 0) tr.advanceDays = advanceDays.value
  if (Object.keys(tr).length) formData.useTimeRule = tr
}

const onPriceChange = () => {
  validFields.value.add('price')
  conflictFields.value.delete('price')
  if (formData.ticketCategory === 'package' && formData.originalPrice && Number(formData.price) > Number(formData.originalPrice)) {
    conflictFields.value.add('price')
    conflictList.value = [{ message: '特惠套票售价高于原价，可能被标记为虚假折扣' }]
  } else {
    conflictList.value = conflictList.value.filter(c => !/原价|折扣/.test(c.message))
  }
}

const addIncludeItem = () => {
  includeItems.value.push({ name: '', count: 1, desc: '' })
}

const close = () => { if (!submitting.value) emit('update:visible', false) }

const buildPayload = () => {
  syncApplicableAudience()
  syncTimeRule()
  const payload = { ...formData }
  if (includeItems.value.length) {
    payload.includeItems = includeItems.value.filter(i => i.name && i.name.trim())
  }
  return payload
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.error('请完善带红色星号的必填项')
    return
  }
  if (formData.ticketCategory === 'package' && (!includeItems.value || includeItems.value.filter(i => i.name).length === 0)) {
    ElMessage.warning('特惠套票至少需配置1个包含项目')
    return
  }
  syncApplicableAudience(); syncTimeRule()

  submitting.value = true
  try {
    const payload = buildPayload()
    if (props.ticketId && !props.copyFrom) {
      const r = await updateTicketType(props.ticketId, payload)
      ElMessage.success('票种规则更新成功')
      emit('success', props.ticketId, '票种规则已更新')
    } else {
      const r = await createTicketType(payload)
      ElMessage.success('票种创建成功')
      emit('success', r.data?.id || null, '新票种规则已生效')
    }
    emit('update:visible', false)
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '提交失败'
    ElMessage.error(msg)
    if (/校验未通过|冲突/.test(msg)) {
      conflictList.value.push({ message: msg })
    }
  } finally { submitting.value = false }
}

watch(() => props.visible, v => { if (v) onOpen() })
</script>
