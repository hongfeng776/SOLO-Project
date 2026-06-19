<template>
  <div class="page-container">
    <el-card shadow="never" class="mb16">
      <template #header>
        <div class="header-bar">
          <div>
            <h3>店铺信息管控</h3>
            <el-tag :type="merchantInfo.shop_status === 1 ? 'success' : 'warning'" class="ml8">
              {{ shopStatusText }}
            </el-tag>
          </div>
          <div v-if="merchantInfo.id" class="header-right">
            <el-button @click="loadData">刷新</el-button>
            <el-button type="warning" @click="traceDialogVisible = true">
              <el-icon><View /></el-icon>溯源
            </el-button>
            <el-button type="primary" @click="handleSave" :disabled="!canEdit">保存修改</el-button>
          </div>
        </div>
      </template>

      <el-alert v-if="editPermissionError" type="error" :closable="false" show-icon class="mb16" :title="editPermissionError" />

      <el-alert v-if="warnings.length > 0" type="warning" :closable="false" show-icon class="mb16">
        <div>
          <p class="warn-title">合规风险提示（共 {{ warnings.length }} 项）：</p>
          <ul>
            <li v-for="(w, i) in warnings" :key="i">
              {{ getFieldLabel(w.field) }}：{{ w.message }}
              <el-tag type="danger" size="small" class="ml6" v-if="w.sensitive_words && w.sensitive_words.length">
                敏感词：{{ w.sensitive_words.join('、') }}
              </el-tag>
            </li>
          </ul>
        </div>
      </el-alert>

      <el-form ref="shopFormRef" :model="shopForm" :rules="formRules" label-width="120px" label-position="right">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="商家名称">
              <el-input v-model="merchantInfo.name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="店铺名称" prop="shop_name" :class="{ 'shake-error': fieldShake.shop_name }">
              <el-input
                v-model="shopForm.shop_name"
                :disabled="!canEditCoreInfo"
                :class="{ 'error-input': fieldErrors.shop_name }"
                placeholder="2-30个字符，支持中英文数字"
                maxlength="30"
                @blur="onShopNameBlur"
              />
              <div class="error-text" v-if="fieldErrors.shop_name">{{ fieldErrors.shop_name }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="店铺等级">
              <el-select v-model="shopForm.shop_level" style="width: 100%">
                <el-option v-for="lv in SHOP_LEVEL_OPTIONS" :key="lv.value" :label="lv.label" :value="lv.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="店铺主营类目" prop="shop_category" :class="{ 'shake-error': fieldShake.shop_category }">
              <el-select
                v-model="shopForm.shop_category" :disabled="!canEditCoreInfo" style="width: 100%">
                <el-option v-for="c in SHOP_CATEGORY_OPTIONS" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二级类目">
              <el-input v-model="shopForm.shop_sub_category" :disabled="!canEditCoreInfo" placeholder="请输入二级类目" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="店铺标签">
              <el-select
                v-model="shopForm.tags_arr" multiple filterable allow-create default-first-option style="width: 100%">
                <el-option v-for="t in SHOP_TAG_PRESET" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="店铺简介" :class="{ 'shake-error': fieldShake.shop_intro }">
              <el-input
                v-model="shopForm.shop_intro"
                :class="{ 'error-input': fieldErrors.shop_intro }"
                :disabled="!canEditCoreInfo"
                type="textarea" :rows="4" maxlength="500" show-word-limit
                placeholder="建议不少于20字"
                @blur="onIntroBlur"
              />
              <div class="error-text" v-if="fieldErrors.shop_intro">{{ fieldErrors.shop_intro }}</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">客服信息</el-divider>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="客服电话" prop="customer_service_phone" :class="{ 'shake-error': fieldShake.customer_service_phone }">
              <el-input
                v-model="shopForm.customer_service_phone"
                :class="{ 'error-input': fieldErrors.customer_service_phone }"
                placeholder="支持手机或固定电话"
                @blur="onPhoneBlur"
              />
              <div class="error-text" v-if="fieldErrors.customer_service_phone">{{ fieldErrors.customer_service_phone }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客服工作时间">
              <el-input v-model="shopForm.customer_service_hours" placeholder="如 9:00-21:00" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">所在地区</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="省份">
              <el-input v-model="shopForm.shop_province" placeholder="省份" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市">
              <el-input v-model="shopForm.shop_city" placeholder="城市" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县">
              <el-input v-model="shopForm.shop_district" placeholder="区县" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细地址">
              <el-input v-model="shopForm.shop_address" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <ShopTraceDialog v-model="traceDialogVisible" :merchant-id="currentMerchantId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getShopInfo, updateShopInfo, validateShopName as apiValidateShopName,
  validateCustomerServicePhone as apiValidatePhone, validateAllShopInfo,
  SHOP_LEVEL_OPTIONS, SHOP_CATEGORY_OPTIONS, SHOP_TAG_PRESET, SHOP_STATUS_OPTIONS,
  type ShopInfoItem
} from '@/api/shopInfo'
import ShopTraceDialog from './components/ShopTraceDialog.vue'

const props = defineProps<{ merchantId?: number }>()
const emit = defineEmits(['saved'])

const shopFormRef = ref<FormInstance>()
const currentMerchantId = ref<number>(props.merchantId || 0)
const merchantInfo = ref<ShopInfoItem>({ id: 0, name: '', shop_status: 1 })
const shopForm = ref<any>({
  shop_name: '', shop_level: 1, shop_category: '', shop_sub_category: '',
  tags_arr: [] as string[], shop_logo: '', shop_intro: '', customer_service_phone: '',
  customer_service_hours: '', shop_province: '', shop_city: '', shop_district: '', shop_address: '',
})

const fieldErrors = ref<Record<string, string>>({})
const fieldShake = ref<Record<string, boolean>>({})
const warnings = ref<any[]>([])
const editPermissionError = ref('')
const traceDialogVisible = ref(false)

const shopStatusText = computed(() => SHOP_STATUS_OPTIONS.find(o => o.value === merchantInfo.value.shop_status)?.label || '待创建')

const formRules: FormRules = {
  shop_name: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  shop_category: [{ required: true, message: '请选择主营类目', trigger: 'change' }],
}

const canEditCoreInfo = computed(() => merchantInfo.value.settle_status === 2 && [1, 2].includes(merchantInfo.value.shop_status ?? 1))
const canEdit = computed(() => !!merchantInfo.value.id)

const getFieldLabel = (field: string) => {
  const map: Record<string, string> = {
    shop_name: '店铺名称', shop_category: '主营类目', shop_intro: '店铺简介',
    shop_tags: '店铺标签', customer_service_phone: '客服电话'
  }
  return map[field] || field
}

const triggerShake = (field: string) => {
  fieldShake.value[field] = true
  setTimeout(() => { fieldShake.value[field] = false }, 600)
}

const onShopNameBlur = async () => {
  if (!shopForm.value.shop_name) return
  const res = await apiValidateShopName(shopForm.value.shop_name, merchantInfo.value.id)
  if (!res.data.data.valid) {
    fieldErrors.value.shop_name = res.data.data.message || '店铺名称不合规'
    triggerShake('shop_name')
  } else {
    fieldErrors.value.shop_name = ''
  }
}

const onPhoneBlur = async () => {
  if (!shopForm.value.customer_service_phone) return
  const res = await apiValidatePhone(shopForm.value.customer_service_phone)
  if (!res.data.data.valid) {
    fieldErrors.value.customer_service_phone = res.data.data.message || '电话格式不正确'
    triggerShake('customer_service_phone')
  } else {
    fieldErrors.value.customer_service_phone = ''
  }
}

const onIntroBlur = () => {
  const txt = (shopForm.value.shop_intro || '').trim()
  if (txt && txt.length < 20) {
    fieldErrors.value.shop_intro = '店铺简介建议不少于20个字符'
    triggerShake('shop_intro')
  } else {
    fieldErrors.value.shop_intro = ''
  }
}

const loadData = async () => {
  if (!currentMerchantId.value) return
  const res = await getShopInfo(currentMerchantId.value)
  const info = res.data.data
  merchantInfo.value = info
  shopForm.value = {
    shop_name: info.shop_name || '',
    shop_level: info.shop_level || 1,
    shop_category: info.shop_category || '',
    shop_sub_category: info.shop_sub_category || '',
    tags_arr: info.shop_tags ? info.shop_tags.split(',').filter(Boolean) : [],
    shop_logo: info.shop_logo || '',
    shop_intro: info.shop_intro || '',
    customer_service_phone: info.customer_service_phone || '',
    customer_service_hours: info.customer_service_hours || '',
    shop_province: info.shop_province || '',
    shop_city: info.shop_city || '',
    shop_district: info.shop_district || '',
    shop_address: info.shop_address || '',
  }
  if (info.settle_status !== 2) {
    editPermissionError.value = '商家未通过资质审核，暂不支持修改店铺核心信息（名称、类目、简介）'
  } else {
    editPermissionError.value = ''
  }
}

const handleSave = async () => {
  if (!shopFormRef.value) return
  try {
    await shopFormRef.value.validate()
  } catch {
    return
  }
  const payload: any = {
    merchant_id: currentMerchantId.value,
    shop_name: shopForm.value.shop_name,
    shop_category: shopForm.value.shop_category,
    shop_sub_category: shopForm.value.shop_sub_category,
    shop_tags: shopForm.value.tags_arr.join(','),
    shop_logo: shopForm.value.shop_logo,
    shop_intro: shopForm.value.shop_intro,
    customer_service_phone: shopForm.value.customer_service_phone,
    customer_service_hours: shopForm.value.customer_service_hours,
    shop_province: shopForm.value.shop_province,
    shop_city: shopForm.value.shop_city,
    shop_district: shopForm.value.shop_district,
    shop_address: shopForm.value.shop_address,
    shop_level: shopForm.value.shop_level,
  }
  const validateRes = await validateAllShopInfo(payload)
  if (!validateRes.data.data.valid) {
    for (const err of validateRes.data.data.errors) {
      fieldErrors.value[err.field] = err.message
      triggerShake(err.field)
    }
    ElMessage.error('表单校验失败，请检查标红字段')
    return
  }
  warnings.value = validateRes.data.data.warnings || []
  if (warnings.value.length > 0) {
    try {
      await ElMessageBox.confirm(
        `检测到 ${warnings.value.length} 项合规风险，是否仍保存？`,
        '合规风险提示',
        { type: 'warning', confirmButtonText: '确认保存', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }
  const saveRes = await updateShopInfo(payload)
  if (saveRes.data.data.changed) {
    ElMessage.success(saveRes.data.data.message || '保存成功')
    emit('saved')
    loadData()
  } else {
    ElMessage.info(saveRes.data.data.message || '没有需要更新的内容')
  }
}

watch(() => props.merchantId, (v) => {
  if (v) {
    currentMerchantId.value = v
    loadData()
  }
})

onMounted(() => {
  if (props.merchantId) loadData()
})
</script>

<style scoped lang="scss">
.page-container { padding: 16px; }
.mb16 { margin-bottom: 16px; }
.ml6 { margin-left: 6px; }
.ml8 { margin-left: 8px; }
.header-bar { display: flex; align-items: center; justify-content: space-between; h3 { margin: 0; display: inline-block; } }
.header-right { display: flex; gap: 8px; }
.error-input { :deep(.el-input__wrapper, .el-textarea__inner) { border-color: var(--el-color-danger) !important; box-shadow: 0 0 0 1px var(--el-color-danger) inset; } }
.shake-error { animation: shake 0.4s ease-in-out 0s 2; }
.error-text { color: var(--el-color-danger); font-size: 12px; line-height: 1.5; margin-top: 4px; }
.warn-title { font-weight: 600; margin-bottom: 4px; }
ul { padding-left: 18px; margin: 6px 0; }
li { line-height: 1.8; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}
</style>
