<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑房价套餐' : '新增房价套餐'"
    width="900px"
    class="edit-dialog"
    destroy-on-close
    @close="handleClose"
  >
    <el-alert
      v-if="verifyErrors.length || verifyWarnings.length"
      :title="verifyErrors.length ? '存在规则冲突，配置将被拦截' : '存在合理性警告，建议确认后保存'"
      :type="verifyErrors.length ? 'error' : 'warning'"
      show-icon
      class="verify-alert"
      :closable="false"
    >
      <ul v-if="verifyErrors.length" class="warnings-list" style="color:#f5222d">
        <li v-for="(msg, i) in verifyErrors" :key="`e${i}`">{{ msg }}</li>
      </ul>
      <ul v-if="verifyWarnings.length" class="warnings-list" style="color:#d46b08">
        <li v-for="(msg, i) in verifyWarnings" :key="`w${i}`">{{ msg }}</li>
      </ul>
    </el-alert>

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
      <div class="section-title">基础信息</div>
      <div class="field-row">
        <el-form-item label="所属门店" prop="hotelId" required>
          <el-select v-model="formData.hotelId" placeholder="请选择" filterable style="width:100%" @change="onHotelChange">
            <el-option v-for="h in hotelList" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属房型" prop="roomId" required>
          <el-select v-model="formData.roomId" placeholder="请选择" filterable style="width:100%" @change="runVerify">
            <el-option v-for="r in roomList" :key="r.id" :label="r.roomName" :value="r.id" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="价格类型" prop="priceType" required>
          <el-select v-model="formData.priceType" style="width:100%" @change="handleTypeChange">
            <el-option v-for="(item, key) in HotelPriceTypeEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐名称" prop="packageName" :required="formData.priceType === 'exclusive'">
          <el-input v-model="formData.packageName" placeholder="专属套餐必填" @blur="runVerify" />
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="套餐编码" prop="packageCode">
          <el-input v-model="formData.packageCode" placeholder="系统生成可自定义" />
        </el-form-item>
        <el-form-item label="展示优先级" prop="displayPriority">
          <el-input-number v-model="formData.displayPriority" :min="0" :max="9999" controls-position="right" style="width:100%" />
        </el-form-item>
      </div>

      <div class="section-title">价格设置</div>
      <div class="field-row">
        <el-form-item label="基准售价" prop="basePrice" class="price-focus-zoom" required>
          <div class="price-field">
            <el-input-number
              v-model="formData.basePrice"
              :min="0" :max="999999"
              :precision="2" :step="10"
              controls-position="right"
              style="width:100%"
              @change="handlePriceChange"
            />
            <span class="price-unit">元/晚</span>
          </div>
          <div v-if="priceErrors.basePrice" class="real-time-error">{{ priceErrors.basePrice }}</div>
        </el-form-item>
        <el-form-item label="原价（划线）" prop="originalPrice" class="price-focus-zoom">
          <div class="price-field">
            <el-input-number
              v-model="formData.originalPrice"
              :min="0" :max="999999"
              :precision="2" :step="10"
              controls-position="right"
              style="width:100%"
              @change="handlePriceChange"
            />
            <span class="price-unit">元/晚</span>
          </div>
          <div v-if="priceErrors.originalPrice" class="real-time-error">{{ priceErrors.originalPrice }}</div>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="折扣比例" prop="discountRatio" class="price-focus-zoom">
          <el-input-number
            v-model="formData.discountRatio"
            :min="3" :max="10" :step="0.1"
            :precision="1"
            controls-position="right"
            style="width:100%"
            placeholder="3-10折"
            @change="handleDiscountChange"
          />
          <div v-if="priceErrors.discountRatio" class="real-time-error">{{ priceErrors.discountRatio }}</div>
        </el-form-item>
        <el-form-item label="会员价" prop="memberPrice" class="price-focus-zoom">
          <div class="price-field">
            <el-input-number v-model="formData.memberPrice" :min="0" :max="999999" :precision="2" :step="10" controls-position="right" style="width:100%" />
            <span class="price-unit">元/晚</span>
          </div>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="协议企业价" prop="corporatePrice" class="price-focus-zoom">
          <div class="price-field">
            <el-input-number v-model="formData.corporatePrice" :min="0" :max="999999" :precision="2" :step="10" controls-position="right" style="width:100%" />
            <span class="price-unit">元/晚</span>
          </div>
        </el-form-item>
        <el-form-item label="专属特价" prop="isExclusive">
          <el-switch v-model="formData.isExclusive" />
          <span style="margin-left:8px;color:#909399;font-size:12px">（禁止批量修改）</span>
        </el-form-item>
      </div>

      <div class="section-title">生效日期与预订规则</div>
      <div class="field-row">
        <el-form-item label="生效日期" prop="startDate" required>
          <el-date-picker
            v-model="dateRange" type="daterange"
            start-placeholder="开始日期" end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:100%"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="适用星期" prop="weekDays">
          <div class="weekday-picker">
            <div
              v-for="(d, i) in weekDays"
              :key="i"
              :class="['weekday-item', { active: formData.weekDays.includes(d.value) }]"
              @click="toggleWeekday(d.value)"
            >{{ d.label }}</div>
          </div>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="提前预订">
          <el-input-number v-model="formData.minAdvanceDays" :min="0" :max="365" style="width:45%" />
          <span style="margin:0 8px">至</span>
          <el-input-number v-model="formData.maxAdvanceDays" :min="0" :max="365" style="width:45%" />
          <span style="margin-left:8px;color:#909399">天</span>
        </el-form-item>
        <el-form-item label="连住要求">
          <el-input-number v-model="formData.minNights" :min="1" :max="30" style="width:45%" />
          <span style="margin:0 8px">至</span>
          <el-input-number v-model="formData.maxNights" :min="1" :max="30" style="width:45%" />
          <span style="margin-left:8px;color:#909399">晚</span>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="退改规则" prop="cancelPolicy" required>
          <el-select v-model="formData.cancelPolicy" style="width:100%" @change="runVerify">
            <el-option v-for="(item, key) in HotelRoomCancelPolicyEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="违约金额">
          <el-input-number v-model="formData.penaltyAmount" :min="0" :precision="2" style="width:48%" placeholder="固定金额" />
          <span style="margin:0 6px">或</span>
          <el-input-number v-model="formData.penaltyPercent" :min="0" :max="100" :precision="2" style="width:48%" placeholder="比例%" />
        </el-form-item>
      </div>

      <div class="section-title">包含服务与客群</div>
      <el-form-item label="包含服务" prop="includedServices">
        <el-checkbox-group v-model="formData.includedServices" style="display:flex;flex-wrap:wrap;gap:10px">
          <el-checkbox v-for="s in HotelPriceIncludedServiceOptions" :key="s.value" :label="s.value" border>{{ s.label }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="服务展示" prop="servicesText">
        <el-input v-model="formData.servicesText" type="textarea" :rows="2" placeholder="前台展示的包含服务汇总文本" />
      </el-form-item>
      <div class="field-row">
        <el-form-item label="目标客群" prop="targetGuestTags">
          <el-select v-model="formData.targetGuestTags" multiple collapse-tags collapse-tags-tooltip style="width:100%" @change="runVerify">
            <el-option v-for="g in HotelPriceTargetGuestOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用会员">
          <el-select v-model="formData.targetMemberLevels" multiple collapse-tags placeholder="不限制则留空" style="width:100%">
            <el-option label="普卡会员" value="basic" />
            <el-option label="银卡会员" value="silver" />
            <el-option label="金卡会员" value="gold" />
            <el-option label="铂金会员" value="platinum" />
            <el-option label="钻石会员" value="diamond" />
          </el-select>
        </el-form-item>
      </div>

      <div class="section-title">库存与闪购</div>
      <div class="field-row">
        <el-form-item label="库存类型" prop="stockType" required>
          <el-select v-model="formData.stockType" style="width:100%">
            <el-option label="无限库存" value="unlimited" />
            <el-option label="限量" value="limited" />
            <el-option label="每日限量" value="daily_limit" />
          </el-select>
        </el-form-item>
        <el-form-item label="总库存" prop="totalStock" v-if="formData.stockType === 'limited'">
          <el-input-number v-model="formData.totalStock" :min="1" :max="9999" controls-position="right" style="width:100%" />
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="每日限量" prop="dailyLimit" v-if="formData.stockType === 'daily_limit'">
          <el-input-number v-model="formData.dailyLimit" :min="1" :max="999" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="每单限购" prop="perOrderLimit">
          <el-input-number v-model="formData.perOrderLimit" :min="1" :max="99" controls-position="right" style="width:100%" />
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="每人限购" prop="perUserLimit">
          <el-input-number v-model="formData.perUserLimit" :min="0" :max="99" controls-position="right" style="width:100%" />
          <span style="margin-left:6px;color:#909399;font-size:12px">0不限</span>
        </el-form-item>
        <el-form-item label="限时闪购" prop="isFlashSale">
          <el-switch v-model="formData.isFlashSale" />
        </el-form-item>
      </div>
      <div class="field-row" v-if="formData.isFlashSale">
        <el-form-item label="闪购开始" prop="flashSaleStartTime">
          <el-date-picker v-model="formData.flashSaleStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="闪购结束" prop="flashSaleEndTime">
          <el-date-picker v-model="formData.flashSaleEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
      </div>

      <el-form-item label="套餐描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="套餐详细描述" />
      </el-form-item>
      <el-form-item label="使用须知" prop="useInstructions">
        <el-input v-model="formData.useInstructions" type="textarea" :rows="2" placeholder="使用注意事项" />
      </el-form-item>

      <div v-if="isEdit" class="section-title">状态设置</div>
      <div class="field-row" v-if="isEdit">
        <el-form-item label="套餐状态" prop="status">
          <el-select v-model="formData.status" style="width:100%">
            <el-option v-for="(item, key) in HotelPriceStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="首页展示" prop="displayOnHome">
          <el-switch v-model="formData.displayOnHome" />
        </el-form-item>
      </div>

      <div class="section-title">操作原因</div>
      <el-form-item label="变更原因" prop="operationReason" required>
        <el-input v-model="formData.operationReason" type="textarea" :rows="2" placeholder="请填写本次操作原因，将记录在操作日志中" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="verifyErrors.length > 0" @click="handleSubmit">
        {{ verifyErrors.length ? '规则冲突，无法保存' : '保存' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  HotelPriceTypeEnum, HotelPriceStatusEnum,
  HotelPriceIncludedServiceOptions, HotelPriceTargetGuestOptions,
  HotelRoomCancelPolicyEnum
} from '@/utils/enums'
import {
  getHotelList, getHotelRoomList,
  createHotelRoomPrice, updateHotelRoomPrice, verifyHotelRoomPriceParams
} from '@/api/hotel'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editData: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const isEdit = computed(() => !!props.editData?.id)
const formRef = ref(null)
const hotelList = ref([])
const roomList = ref([])

const weekDays = [
  { value: '1', label: '周一' }, { value: '2', label: '周二' },
  { value: '3', label: '周三' }, { value: '4', label: '周四' },
  { value: '5', label: '周五' }, { value: '6', label: '周六' },
  { value: '7', label: '周日' }
]

const defaultForm = () => ({
  hotelId: null,
  roomId: null,
  priceType: 'daily',
  packageName: '',
  packageCode: '',
  basePrice: 0,
  originalPrice: null,
  discountRatio: null,
  memberPrice: null,
  corporatePrice: null,
  startDate: '',
  endDate: '',
  weekDays: ['1', '2', '3', '4', '5', '6', '7'],
  minAdvanceDays: 0,
  maxAdvanceDays: 30,
  minNights: 1,
  maxNights: 30,
  cancelPolicy: 'free_before_24h',
  penaltyAmount: null,
  penaltyPercent: null,
  includedServices: [],
  servicesText: '',
  targetGuestTags: [],
  targetMemberLevels: [],
  targetCorporateIds: [],
  stockType: 'unlimited',
  totalStock: 0,
  soldCount: 0,
  dailyLimit: 0,
  perOrderLimit: 9,
  perUserLimit: 0,
  status: 'draft',
  displayOnHome: false,
  displayPriority: 0,
  isExclusive: false,
  isFlashSale: false,
  flashSaleStartTime: '',
  flashSaleEndTime: '',
  description: '',
  images: [],
  useInstructions: '',
  operationReason: ''
})

const formData = reactive(defaultForm())
const dateRange = ref([])
const verifyErrors = ref([])
const verifyWarnings = ref([])
const priceErrors = reactive({})

const rules = {
  hotelId: [{ required: true, message: '请选择所属门店', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择所属房型', trigger: 'change' }],
  priceType: [{ required: true, message: '请选择价格类型', trigger: 'change' }],
  basePrice: [{ required: true, message: '请输入基准售价', trigger: 'blur' }],
  cancelPolicy: [{ required: true, message: '请选择退改规则', trigger: 'change' }]
}

const loadHotels = async () => {
  try {
    const res = await getHotelList({ pageSize: 200 })
    hotelList.value = res?.data?.list || []
  } catch {
    hotelList.value = [
      { id: 1, name: '上海外滩示范酒店' },
      { id: 2, name: '北京王府井精选酒店' }
    ]
  }
}

const onHotelChange = async () => {
  roomList.value = []
  if (!formData.hotelId) return
  try {
    const res = await getHotelRoomList({ hotelId: formData.hotelId, status: 'on_sale', pageSize: 200 })
    roomList.value = res?.data?.list || []
  } catch {
    roomList.value = [
      { id: 101, roomName: '标准大床房' },
      { id: 103, roomName: '豪华大床房' },
      { id: 104, roomName: '行政套房' }
    ]
  }
  runVerify()
}

const handleTypeChange = () => {
  formData.isExclusive = formData.priceType === 'exclusive'
  if (formData.priceType === 'exclusive' && !formData.packageName) {
    const h = hotelList.value.find(x => x.id === formData.hotelId)
    formData.packageName = `${h?.name || ''}${HotelPriceTypeEnum[formData.priceType]?.label}套餐`
  }
  if (!formData.packageCode) formData.packageCode = `PKG${Date.now()}`
  runVerify()
}

const handlePriceChange = () => {
  priceErrors.basePrice = ''
  priceErrors.originalPrice = ''
  if (formData.originalPrice && formData.basePrice > formData.originalPrice) {
    priceErrors.basePrice = '售价不得高于原价'
  }
  if (formData.basePrice && formData.basePrice < 30) {
    priceErrors.basePrice = '售价过低，不符合行业规范'
  }
  runVerify()
}

const handleDiscountChange = () => {
  priceErrors.discountRatio = ''
  if (formData.discountRatio && formData.discountRatio < 3) {
    priceErrors.discountRatio = '折扣不得低于3折（行业规范）'
  }
  if (formData.discountRatio && formData.originalPrice) {
    const expected = parseFloat((formData.originalPrice * formData.discountRatio / 10).toFixed(2))
    if (Math.abs(expected - formData.basePrice) > 1) {
      priceErrors.discountRatio = `当前${formData.discountRatio}折对应价格应为¥${expected}`
    }
  }
  runVerify()
}

const handleDateChange = (val) => {
  if (val?.length === 2) {
    formData.startDate = val[0]
    formData.endDate = val[1]
  } else {
    formData.startDate = ''
    formData.endDate = ''
  }
  runVerify()
}

const toggleWeekday = (v) => {
  const idx = formData.weekDays.indexOf(v)
  if (idx > -1) formData.weekDays.splice(idx, 1)
  else formData.weekDays.push(v)
  runVerify()
}

const runVerify = async () => {
  try {
    const payload = {
      ...formData,
      weekDays: formData.weekDays.join(','),
      includedServices: formData.includedServices,
      targetGuestTags: formData.targetGuestTags.join(','),
      targetMemberLevels: formData.targetMemberLevels.join(',')
    }
    const res = await verifyHotelRoomPriceParams(isEdit.value ? props.editData.id : 0, payload)
    verifyErrors.value = res?.data?.errors || []
    verifyWarnings.value = (res?.data?.warnings || []).concat(res?.data?.fakeWarnings || [])
  } catch {
    verifyErrors.value = []
    verifyWarnings.value = []
  }
}

watch(visible, (v) => {
  if (v) {
    Object.assign(formData, defaultForm(), props.editData || {})
    if (!Array.isArray(formData.includedServices)) formData.includedServices = []
    if (typeof formData.weekDays === 'string') formData.weekDays = formData.weekDays.split(',').filter(Boolean)
    if (typeof formData.targetGuestTags === 'string') formData.targetGuestTags = formData.targetGuestTags.split(',').filter(Boolean)
    if (typeof formData.targetMemberLevels === 'string') formData.targetMemberLevels = formData.targetMemberLevels.split(',').filter(Boolean)
    dateRange.value = formData.startDate && formData.endDate ? [formData.startDate, formData.endDate] : []
    Object.keys(priceErrors).forEach(k => priceErrors[k] = '')
    verifyErrors.value = []
    verifyWarnings.value = []
    loadHotels()
    if (formData.hotelId) onHotelChange()
    if (isEdit.value) runVerify()
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请检查必填字段')
    return
  }
  if (verifyErrors.value.length) {
    ElMessage.error('存在规则冲突，请修正后保存')
    return
  }
  if (!formData.operationReason?.trim()) {
    ElMessage.warning('请填写操作原因')
    return
  }
  try {
    const payload = {
      ...formData,
      weekDays: formData.weekDays.join(','),
      targetGuestTags: formData.targetGuestTags.join(','),
      targetMemberLevels: formData.targetMemberLevels.join(',')
    }
    if (isEdit.value) {
      await updateHotelRoomPrice(props.editData.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createHotelRoomPrice(payload)
      ElMessage.success('创建成功')
    }
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

const handleClose = () => { visible.value = false }
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-price.scss';
</style>
