<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑客房' : '新增客房'"
    width="900px"
    class="edit-dialog"
    destroy-on-close
    @close="handleClose"
  >
    <el-alert
      v-if="verifyErrors.length || verifyWarnings.length"
      :title="verifyErrors.length ? '存在参数冲突，保存将被拦截' : '存在合理性警告，建议确认后保存'"
      :type="verifyErrors.length ? 'error' : 'warning'"
      show-icon
      class="verify-alert"
    >
      <ul v-if="verifyErrors.length" class="warnings-list" style="color:#f5222d">
        <li v-for="(msg, i) in verifyErrors" :key="`e${i}`">{{ msg }}</li>
      </ul>
      <ul v-if="verifyWarnings.length" class="warnings-list" style="color:#d46b08">
        <li v-for="(msg, i) in verifyWarnings" :key="`w${i}`">{{ msg }}</li>
      </ul>
    </el-alert>

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <div class="section-title">基础信息</div>
      <div class="field-row">
        <el-form-item label="所属门店" prop="hotelId" :class="getFieldClass('hotelId')">
          <el-select v-model="formData.hotelId" placeholder="请选择所属酒店" style="width:100%" @change="runVerify">
            <el-option v-for="h in hotelList" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
          <el-icon v-if="validMap.hotelId" class="field-check"><CircleCheckFilled /></el-icon>
        </el-form-item>
        <el-form-item label="房型分类" prop="roomType" :class="getFieldClass('roomType')">
          <el-select v-model="formData.roomType" style="width:100%" @change="handleTypeChange">
            <el-option v-for="(item, key) in HotelRoomTypeEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
          <el-icon v-if="validMap.roomType" class="field-check"><CircleCheckFilled /></el-icon>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="客房名称" prop="roomName" :class="getFieldClass('roomName')">
          <el-input v-model="formData.roomName" placeholder="如：高级大床房" @blur="validateField('roomName')" />
          <el-icon v-if="validMap.roomName" class="field-check"><CircleCheckFilled /></el-icon>
        </el-form-item>
        <el-form-item label="房号" prop="roomNo">
          <el-input v-model="formData.roomNo" placeholder="可空，按房型管理时不填" />
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="楼层" prop="floor">
          <el-input v-model="formData.floor" placeholder="如：3-5层" />
        </el-form-item>
        <el-form-item label="展示排序" prop="displayOrder">
          <el-input-number v-model="formData.displayOrder" :min="0" :max="9999" controls-position="right" style="width:100%" />
        </el-form-item>
      </div>

      <div class="section-title">房型参数</div>
      <div class="field-row">
        <el-form-item label="房型面积" prop="area" :class="getFieldClass('area')">
          <el-input-number v-model="formData.area" :min="5" :max="500" :precision="2" :step="1" controls-position="right" style="width:100%" @change="runVerify" />
          <span style="color:#909399;margin-left:4px">㎡</span>
          <el-icon v-if="validMap.area" class="field-check"><CircleCheckFilled /></el-icon>
        </el-form-item>
        <el-form-item label="容纳人数" prop="capacity" :class="getFieldClass('capacity')">
          <el-input-number v-model="formData.capacity" :min="1" :max="20" controls-position="right" style="width:100%" @change="runVerify" />
          <span style="color:#909399;margin-left:4px">人</span>
          <el-icon v-if="validMap.capacity" class="field-check"><CircleCheckFilled /></el-icon>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="最大人数" prop="maxCapacity">
          <el-input-number v-model="formData.maxCapacity" :min="1" :max="30" controls-position="right" style="width:100%" @change="runVerify" />
        </el-form-item>
        <el-form-item label="床型" prop="bedType">
          <el-select v-model="formData.bedType" style="width:100%">
            <el-option v-for="(item, key) in HotelRoomBedTypeEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="床数量" prop="bedCount">
          <el-input-number v-model="formData.bedCount" :min="1" :max="6" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="适配人群" prop="targetGuest">
          <el-select v-model="formData.targetGuest" multiple collapse-tags collapse-tags-tooltip style="width:100%" @change="runVerify">
            <el-option v-for="item in HotelRoomTargetGuestOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>

      <div class="section-title">价格与库存</div>
      <div class="field-row">
        <el-form-item label="基准价" prop="basePrice" :class="getFieldClass('basePrice')">
          <el-input-number v-model="formData.basePrice" :min="0" :max="99999" :precision="2" :step="10" controls-position="right" style="width:100%" @change="runVerify" />
          <span style="color:#909399;margin-left:4px">元</span>
          <el-icon v-if="validMap.basePrice" class="field-check"><CircleCheckFilled /></el-icon>
        </el-form-item>
        <el-form-item label="周末价" prop="weekendPrice">
          <el-input-number v-model="formData.weekendPrice" :min="0" :max="99999" :precision="2" :step="10" controls-position="right" style="width:100%" @change="runVerify" />
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="节假日价" prop="holidayPrice">
          <el-input-number v-model="formData.holidayPrice" :min="0" :max="99999" :precision="2" :step="10" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="加床价格" prop="extraBedPrice">
          <el-input-number v-model="formData.extraBedPrice" :min="0" :max="9999" :precision="2" :step="10" controls-position="right" style="width:100%" />
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="早餐" prop="breakfast">
          <el-select v-model="formData.breakfast" style="width:100%">
            <el-option v-for="(item, key) in HotelRoomBreakfastEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="取消政策" prop="cancelPolicy">
          <el-select v-model="formData.cancelPolicy" style="width:100%">
            <el-option v-for="(item, key) in HotelRoomCancelPolicyEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field-row">
        <el-form-item label="总房量" prop="totalCount">
          <el-input-number v-model="formData.totalCount" :min="1" :max="9999" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="可售房量" prop="availableCount">
          <el-input-number v-model="formData.availableCount" :min="0" :max="9999" controls-position="right" style="width:100%" />
        </el-form-item>
      </div>

      <div class="section-title">设施配置</div>
      <el-form-item label="设施标签" prop="facilities">
        <el-checkbox-group v-model="formData.facilities" style="display:flex;flex-wrap:wrap;gap:10px">
          <el-checkbox v-for="item in HotelRoomFacilityOptions" :key="item.value" :label="item.value" border />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="展示描述" prop="facilityText">
        <el-input v-model="formData.facilityText" type="textarea" :rows="2" placeholder="前台展示设施汇总文案" />
      </el-form-item>
      <el-form-item label="房型介绍" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="房型详细介绍" />
      </el-form-item>

      <div v-if="isEdit" class="section-title">状态维护</div>
      <div v-if="isEdit" class="field-row">
        <el-form-item label="销售状态" prop="status">
          <el-select v-model="formData.status" style="width:100%">
            <el-option v-for="(item, key) in HotelRoomStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护状态" prop="maintainStatus">
          <el-select v-model="formData.maintainStatus" style="width:100%">
            <el-option v-for="(item, key) in HotelRoomMaintainStatusEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item v-if="isEdit" label="是否首页展示" prop="displayOnHome">
        <el-switch v-model="formData.displayOnHome" />
      </el-form-item>

      <div class="section-title">操作原因</div>
      <el-form-item label="变更原因" prop="operationReason" required>
        <el-input v-model="formData.operationReason" type="textarea" :rows="2" placeholder="请填写本次操作原因，将记录在操作日志中" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="verifyErrors.length > 0" @click="handleSubmit">
        {{ verifyErrors.length ? '参数冲突，无法保存' : '保存' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import {
  HotelRoomTypeEnum, HotelRoomStatusEnum, HotelRoomMaintainStatusEnum,
  HotelRoomBedTypeEnum, HotelRoomBreakfastEnum, HotelRoomCancelPolicyEnum,
  HotelRoomFacilityOptions, HotelRoomTargetGuestOptions
} from '@/utils/enums'
import { createHotelRoom, updateHotelRoom, verifyHotelRoomParams, getHotelList } from '@/api/hotel'

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

const defaultForm = () => ({
  hotelId: null,
  roomType: 'standard',
  roomName: '',
  roomNo: '',
  floor: '',
  displayOrder: 0,
  area: 25,
  capacity: 2,
  maxCapacity: 2,
  bedType: 'double',
  bedCount: 1,
  targetGuest: [],
  basePrice: 300,
  weekendPrice: null,
  holidayPrice: null,
  extraBedPrice: null,
  breakfast: 'none',
  cancelPolicy: 'free_before_24h',
  totalCount: 10,
  availableCount: 10,
  facilities: [],
  facilityText: '',
  description: '',
  status: 'on_sale',
  maintainStatus: 'normal',
  displayOnHome: true,
  operationReason: ''
})

const formData = reactive(defaultForm())
const validMap = reactive({})
const verifyErrors = ref([])
const verifyWarnings = ref([])

const rules = {
  hotelId: [{ required: true, message: '请选择所属门店', trigger: 'change' }],
  roomType: [{ required: true, message: '请选择房型分类', trigger: 'change' }],
  roomName: [
    { required: true, message: '请输入客房名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度2-50字符', trigger: 'blur' }
  ],
  area: [{ required: true, message: '请输入面积', trigger: 'change' }],
  capacity: [{ required: true, message: '请输入容纳人数', trigger: 'change' }],
  basePrice: [{ required: true, message: '请输入基准价', trigger: 'change' }]
}

const getFieldClass = (field) => {
  if (verifyErrors.value.some(e => e.includes(labelMap[field] || field))) return 'form-field field-error'
  if (validMap[field]) return 'form-field field-valid'
  return 'form-field'
}

const labelMap = {
  hotelId: '所属酒店', roomType: '房型', roomName: '客房名称', area: '面积',
  capacity: '容纳人数', basePrice: '基准价'
}

const handleTypeChange = () => {
  const def = HotelRoomTypeEnum[formData.roomType]
  if (def) {
    if (!formData.area || formData.area < def.minArea) formData.area = def.minArea
  }
  runVerify()
}

const validateField = async (field) => {
  try {
    await formRef.value?.validateField(field)
    validMap[field] = true
  } catch {
    validMap[field] = false
  }
  runVerify()
}

const runVerify = async () => {
  try {
    const payload = { ...formData, targetGuest: formData.targetGuest.join(',') }
    const res = await verifyHotelRoomParams(isEdit.value ? props.editData.id : 0, payload)
    verifyErrors.value = res?.data?.errors || []
    verifyWarnings.value = (res?.data?.warnings || []).concat(res?.data?.fakeWarnings || [])
  } catch {
    verifyErrors.value = []
    verifyWarnings.value = []
  }
}

const loadHotels = async () => {
  try {
    const res = await getHotelList({ pageSize: 200 })
    hotelList.value = res?.data?.list || []
  } catch {
    hotelList.value = [
      { id: 1, name: '上海外滩示范酒店' },
      { id: 2, name: '北京王府井精选酒店' },
      { id: 3, name: '东京银座花园酒店' }
    ]
  }
}

watch(visible, (v) => {
  if (v) {
    Object.assign(formData, defaultForm(), props.editData || {})
    if (!Array.isArray(formData.facilities)) formData.facilities = []
    if (typeof formData.targetGuest === 'string') formData.targetGuest = formData.targetGuest.split(',').filter(Boolean)
    Object.keys(validMap).forEach(k => delete validMap[k])
    verifyErrors.value = []
    verifyWarnings.value = []
    loadHotels()
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
    ElMessage.error('存在参数冲突，请修正后保存')
    return
  }
  if (!formData.operationReason || !formData.operationReason.trim()) {
    ElMessage.warning('请填写操作原因')
    return
  }
  try {
    const payload = { ...formData, targetGuest: formData.targetGuest.join(',') }
    if (isEdit.value) {
      await updateHotelRoom(props.editData.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createHotelRoom(payload)
      ElMessage.success('创建成功')
    }
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-room.scss';
</style>
