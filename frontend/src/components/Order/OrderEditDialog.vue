<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading" class="order-edit-dialog">
      <div v-if="orderDetail" :class="formContainerClass">
        <el-alert
          v-if="isAbnormalOrder"
          type="warning"
          :title="'异常订单：' + (orderDetail.abnormalReason || '未知原因')"
          show-icon
          class="mb-20"
        />
        <el-alert
          v-if="isInvalidOrder"
          type="error"
          title="作废订单，仅可查看不可编辑"
          show-icon
          class="mb-20"
        />
        <el-alert
          v-if="isLocked"
          type="error"
          title="订单已锁定，核心字段不可修改"
          show-icon
          class="mb-20"
        />

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          :disabled="isInvalidOrder"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单号">
                <span class="form-text">{{ orderDetail.orderNo }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="订单来源">
                <span class="form-text">{{ getEnumLabel(OrderSourceEnum, orderDetail.source) }}</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单状态">
                <el-tag :type="getEnumType(OrderStatusEnum, orderDetail.status)" size="small">
                  {{ getEnumLabel(OrderStatusEnum, orderDetail.status) }}
                </el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="订单金额" prop="amount">
                <div class="amount-input-wrapper">
                  <el-input
                    v-model="formData.amount"
                    type="number"
                    :class="{ 'input-error-shake': errorFields.includes('amount') }"
                    class="input-glow-focus"
                    :disabled="isLocked || isInvalidOrder"
                    @blur="validateAmount"
                    @change="handleAmountChange"
                  >
                    <template #append>元</template>
                  </el-input>
                  <span v-if="amountChanged" class="amount-change">
                    原: ¥{{ originalAmount }} → 现: ¥{{ formData.amount }}
                    <span :class="formData.amount > originalAmount ? 'increase' : 'decrease'">
                      {{ formData.amount > originalAmount ? '+' : '' }}{{ (formData.amount - originalAmount).toFixed(2) }}
                    </span>
                  </span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="出行品类" prop="category">
                <el-select
                  v-model="formData.category"
                  :class="{ 'input-error-shake': errorFields.includes('category') }"
                  class="input-glow-focus w-full"
                  :disabled="isLocked || isInvalidOrder"
                  @change="handleCoreFieldChange('category')"
                >
                  <el-option
                    v-for="item in getEnumOptions(TravelCategoryEnum)"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="商品名称" prop="productId">
                <el-select
                  v-model="formData.productId"
                  filterable
                  :class="{ 'input-error-shake': errorFields.includes('productId') }"
                  class="input-glow-focus w-full"
                  :disabled="isLocked || isInvalidOrder"
                  @change="handleCoreFieldChange('productId')"
                >
                  <el-option
                    v-for="item in productOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">出行日期</el-divider>

          <template v-if="formData.category === TravelCategoryEnum.FLIGHT.value">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="出发时间" prop="departureTime">
                  <el-date-picker
                    v-model="formData.departureTime"
                    type="datetime"
                    class="input-glow-focus w-full"
                    :disabled="isLocked || isInvalidOrder"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="到达时间" prop="arrivalTime">
                  <el-date-picker
                    v-model="formData.arrivalTime"
                    type="datetime"
                    class="input-glow-focus w-full"
                    :disabled="isLocked || isInvalidOrder"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-else-if="formData.category === TravelCategoryEnum.HOTEL.value">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="入住时间" prop="checkInTime">
                  <el-date-picker
                    v-model="formData.checkInTime"
                    type="date"
                    class="input-glow-focus w-full"
                    :disabled="isLocked || isInvalidOrder"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="离店时间" prop="checkOutTime">
                  <el-date-picker
                    v-model="formData.checkOutTime"
                    type="date"
                    class="input-glow-focus w-full"
                    :disabled="isLocked || isInvalidOrder"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-else>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="使用时间" prop="useTime">
                  <el-date-picker
                    v-model="formData.useTime"
                    type="datetime"
                    class="input-glow-focus w-full"
                    :disabled="isLocked || isInvalidOrder"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <el-divider content-position="left">用户信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择用户" prop="userId">
                <el-select
                  v-model="formData.userId"
                  filterable
                  class="input-glow-focus w-full"
                  :disabled="isInvalidOrder"
                  @change="handleUserChange"
                >
                  <el-option
                    v-for="item in userOptions"
                    :key="item.id"
                    :label="`${item.username} (${item.phone})`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input
                  v-model="formData.phone"
                  :class="{ 'input-error-shake': errorFields.includes('phone') }"
                  class="input-glow-focus"
                  :disabled="isInvalidOrder"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-collapse v-if="selectedUser" class="mb-20">
            <el-collapse-item title="用户详情" name="user">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="用户名">{{ selectedUser.username }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ selectedUser.phone }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ selectedUser.email || '-' }}</el-descriptions-item>
                <el-descriptions-item label="会员等级">{{ selectedUser.level || '普通会员' }}</el-descriptions-item>
              </el-descriptions>
            </el-collapse-item>
          </el-collapse>

          <el-divider content-position="left">商家信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择商家" prop="merchantId">
                <el-select
                  v-model="formData.merchantId"
                  filterable
                  :class="{ 'input-error-shake': errorFields.includes('merchantId') }"
                  class="input-glow-focus w-full"
                  :disabled="isLocked || isInvalidOrder"
                  @change="handleCoreFieldChange('merchantId')"
                >
                  <el-option
                    v-for="item in merchantOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-collapse v-if="selectedMerchant" class="mb-20">
            <el-collapse-item title="商家详情" name="merchant">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="商家名称">{{ selectedMerchant.name }}</el-descriptions-item>
                <el-descriptions-item label="联系人">{{ selectedMerchant.contact || '-' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ selectedMerchant.phone || '-' }}</el-descriptions-item>
                <el-descriptions-item label="地址">{{ selectedMerchant.address || '-' }}</el-descriptions-item>
              </el-descriptions>
            </el-collapse-item>
          </el-collapse>

          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              class="input-glow-focus"
              :disabled="isInvalidOrder"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="isInvalidOrder"
        @click="handleSubmit"
      >保存修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOrderEditDetail,
  validateOrderEdit,
  updateOrderInfo
} from '@/api/order'
import {
  OrderStatusEnum,
  OrderSourceEnum,
  OrderAbnormalEnum,
  OrderLockEnum,
  TravelCategoryEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions
} from '@/utils/enums'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const errorFields = ref([])
const amountChanged = ref(false)

const orderDetail = ref(null)
const originalAmount = ref(0)
const isLocked = ref(false)

const formData = reactive({
  amount: 0,
  category: null,
  productId: null,
  userId: null,
  merchantId: null,
  phone: '',
  remark: '',
  departureTime: '',
  arrivalTime: '',
  checkInTime: '',
  checkOutTime: '',
  useTime: ''
})

const productOptions = ref([
  { id: 1, name: '北京-上海 经济舱' },
  { id: 2, name: '上海-深圳 商务舱' },
  { id: 3, name: '希尔顿酒店 豪华房' },
  { id: 4, name: '万豪酒店 行政套房' },
  { id: 5, name: '丰田凯美瑞 舒适版' },
  { id: 6, name: '故宫博物院 门票' }
])

const userOptions = ref([
  { id: 1, username: '张三', phone: '13800138000', email: 'zhangsan@example.com', level: '黄金会员' },
  { id: 2, username: '李四', phone: '13800138001', email: 'lisi@example.com', level: '普通会员' },
  { id: 3, username: '王五', phone: '13800138002', email: 'wangwu@example.com', level: '铂金会员' }
])

const merchantOptions = ref([
  { id: 1, name: '中国国航旗舰店', contact: '李经理', phone: '400-888-9999', address: '北京市朝阳区' },
  { id: 2, name: '希尔顿酒店旗舰店', contact: '王经理', phone: '400-888-7777', address: '上海市浦东新区' },
  { id: 3, name: '神州租车', contact: '张经理', phone: '400-616-6666', address: '广州市天河区' },
  { id: 4, name: '故宫博物院', contact: '刘经理', phone: '010-85007421', address: '北京市东城区' }
])

const selectedUser = computed(() => {
  return userOptions.value.find(u => u.id === formData.userId)
})

const selectedMerchant = computed(() => {
  return merchantOptions.value.find(m => m.id === formData.merchantId)
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  if (!orderDetail.value) return '编辑订单'
  return `编辑订单 - ${orderDetail.value.orderNo}`
})

const isAbnormalOrder = computed(() => {
  return orderDetail.value?.abnormal === OrderAbnormalEnum.ABNORMAL.value
})

const isInvalidOrder = computed(() => {
  return orderDetail.value?.abnormal === OrderAbnormalEnum.INVALID.value
})

const formContainerClass = computed(() => {
  return {
    'abnormal-form': isAbnormalOrder.value,
    'invalid-form': isInvalidOrder.value
  }
})

const formRules = {
  amount: [
    { required: true, message: '请输入订单金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '订单金额必须大于0', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择出行品类', trigger: 'change' }
  ],
  productId: [
    { required: true, message: '请选择商品', trigger: 'change' }
  ],
  userId: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  merchantId: [
    { required: true, message: '请选择商家', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const validateAmount = () => {
  if (formData.amount <= 0) {
    triggerError('amount')
  }
}

const triggerError = (field) => {
  errorFields.value.push(field)
  setTimeout(() => {
    errorFields.value = errorFields.value.filter(f => f !== field)
  }, 500)
}

const handleAmountChange = () => {
  amountChanged.value = Math.abs(formData.amount - originalAmount.value) > 0.01
  if (formData.amount > 0 && !isLocked.value) {
    checkCoreFieldChange('amount', formData.amount)
  }
}

const handleCoreFieldChange = (field) => {
  if (isLocked.value) return
  checkCoreFieldChange(field, formData[field])
}

const checkCoreFieldChange = async (field, newValue) => {
  try {
    await ElMessageBox.confirm(
      `修改${getFieldLabel(field)}后，订单将被锁定，确认修改吗？`,
      '重要提示',
      {
        confirmButtonText: '确认修改',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    isLocked.value = true
  } catch {
    const originalValue = orderDetail.value[field]
    formData[field] = originalValue
  }
}

const getFieldLabel = (field) => {
  const labels = {
    amount: '订单金额',
    productId: '商品',
    category: '出行品类',
    merchantId: '商家'
  }
  return labels[field] || field
}

const handleUserChange = (userId) => {
  const user = userOptions.value.find(u => u.id === userId)
  if (user) {
    formData.phone = user.phone
  }
}

const validatePermission = () => {
  const roles = userStore.roles
  if (!roles.includes('admin') && !roles.includes('operator')) {
    ElMessage.error('您没有编辑订单的权限')
    return false
  }
  return true
}

const validateSource = () => {
  const allowedSources = [
    OrderSourceEnum.APP.value,
    OrderSourceEnum.WEB.value,
    OrderSourceEnum.WECHAT.value
  ]
  if (!allowedSources.includes(orderDetail.value.source)) {
    ElMessage.error('线下门店及第三方渠道订单不可编辑')
    return false
  }
  return true
}

const validateStatus = () => {
  const allowedStatus = [
    OrderStatusEnum.PENDING_PAYMENT.value,
    OrderStatusEnum.PAID.value
  ]
  if (!allowedStatus.includes(orderDetail.value.status)) {
    ElMessage.error('当前订单状态不支持编辑')
    return false
  }
  return true
}

const loadOrderDetail = async () => {
  if (!props.orderId) return
  loading.value = true
  try {
    const data = await getOrderEditDetail(props.orderId)
    orderDetail.value = data
    isLocked.value = data.isLocked === OrderLockEnum.LOCKED.value
    originalAmount.value = data.amount
    Object.assign(formData, {
      amount: data.amount,
      category: data.category,
      productId: data.productId,
      userId: data.userId,
      merchantId: data.merchantId,
      phone: data.phone,
      remark: data.remark || '',
      departureTime: data.departureTime || '',
      arrivalTime: data.arrivalTime || '',
      checkInTime: data.checkInTime || '',
      checkOutTime: data.checkOutTime || '',
      useTime: data.useTime || ''
    })

    if (!validatePermission()) {
      handleClose()
      return
    }
    if (!validateSource()) {
      handleClose()
      return
    }
    if (!validateStatus()) {
      handleClose()
      return
    }

    try {
      await validateOrderEdit(props.orderId, formData)
    } catch (err) {
      ElMessage.error(err.message || '订单校验失败')
      handleClose()
    }
  } catch (err) {
    ElMessage.error(err.message || '获取订单详情失败')
    handleClose()
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写是否正确')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确认保存订单修改吗？保存后订单状态将更新。',
      '确认提交',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    await updateOrderInfo(props.orderId, formData)
    ElMessage.success('订单更新成功')
    emit('success')
    handleClose()
  } catch (err) {
    ElMessage.error(err.message || '订单更新失败')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  orderDetail.value = null
  isLocked.value = false
  amountChanged.value = false
  errorFields.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

watch(() => props.modelValue, (val) => {
  if (val && props.orderId) {
    loadOrderDetail()
  }
})
</script>

<style lang="scss" scoped>
.order-edit-dialog {
  .form-text {
    color: #606266;
    line-height: 32px;
  }

  .amount-input-wrapper {
    width: 100%;

    .amount-change {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #909399;

      .increase {
        color: #f56c6c;
        margin-left: 4px;
      }

      .decrease {
        color: #67c23a;
        margin-left: 4px;
      }
    }
  }

  .abnormal-form {
    border: 2px solid #ff4d4f;
    border-radius: 8px;
    padding: 16px;
    background: rgba(255, 77, 79, 0.02);
  }

  .invalid-form {
    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper),
    :deep(.el-textarea__inner) {
      background: #f5f7fa !important;
      color: #909399 !important;
    }
  }
}
</style>
