<template>
  <FinDialog
    v-model:visible="visible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="archive-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="建档类型">
            <el-radio-group v-model="formData.archiveStatus" @change="handleArchiveTypeChange">
              <el-radio value="temporary">临时建档</el-radio>
              <el-radio value="formal">正式建档</el-radio>
            </el-radio-group>
            <el-tooltip content="临时建档7天内未完善信息将自动失效" placement="top">
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户类型" prop="customerType">
            <el-radio-group v-model="formData.customerType">
              <el-radio :value="CustomerType.INDIVIDUAL">个人客户</el-radio>
              <el-radio :value="CustomerType.INSTITUTION">机构客户</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">基础信息</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="客户名称"
            prop="customerName"
            :class="{ 'shake-error': shakeFields.includes('customerName') }"
          >
            <el-input
              v-model="formData.customerName"
              placeholder="请输入客户名称"
              @blur="validateField('customerName')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="证件号码"
            prop="idCard"
            :class="{ 'shake-error': shakeFields.includes('idCard') }"
          >
            <el-input
              v-model="formData.idCard"
              placeholder="请输入身份证号"
              @blur="validateField('idCard')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="联系电话"
            prop="phone"
            :class="{ 'shake-error': shakeFields.includes('phone') }"
          >
            <el-input
              v-model="formData.phone"
              placeholder="请输入手机号码"
              @blur="validateField('phone')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="电子邮箱"
            prop="email"
            :class="{ 'shake-error': shakeFields.includes('email') }"
          >
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱（选填）"
              @blur="validateField('email')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="联系地址" prop="address">
            <el-input v-model="formData.address" placeholder="请输入联系地址（选填）" />
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="formData.customerType === CustomerType.INDIVIDUAL">
        <el-divider content-position="left">个人信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio value="male">男</el-radio>
                <el-radio value="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出生日期" prop="birthday">
              <el-date-picker
                v-model="formData.birthday"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学历" prop="education">
              <el-select v-model="formData.education" placeholder="请选择" style="width: 100%">
                <el-option label="小学" value="primary" />
                <el-option label="初中" value="junior" />
                <el-option label="高中" value="senior" />
                <el-option label="大专" value="college" />
                <el-option label="本科" value="bachelor" />
                <el-option label="硕士" value="master" />
                <el-option label="博士" value="doctor" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="婚姻状况" prop="maritalStatus">
              <el-select v-model="formData.maritalStatus" placeholder="请选择" style="width: 100%">
                <el-option label="未婚" value="single" />
                <el-option label="已婚" value="married" />
                <el-option label="离异" value="divorced" />
                <el-option label="丧偶" value="widowed" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="职业" prop="occupation">
              <el-input v-model="formData.occupation" placeholder="请输入职业" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工作单位" prop="workUnit">
              <el-input v-model="formData.workUnit" placeholder="请输入工作单位" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-if="formData.customerType === CustomerType.INSTITUTION">
        <el-divider content-position="left">机构信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="机构名称"
              prop="institutionName"
              :class="{ 'shake-error': shakeFields.includes('institutionName') }"
            >
              <el-input
                v-model="formData.institutionName"
                placeholder="请输入机构名称"
                @blur="validateField('institutionName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构代码" prop="institutionCode">
              <el-input v-model="formData.institutionCode" placeholder="请输入机构代码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="统一社会信用代码"
              prop="unifiedSocialCredit"
              :class="{ 'shake-error': shakeFields.includes('unifiedSocialCredit') }"
            >
              <el-input
                v-model="formData.unifiedSocialCredit"
                placeholder="请输入18位统一社会信用代码"
                @blur="validateField('unifiedSocialCredit')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照号" prop="businessLicense">
              <el-input v-model="formData.businessLicense" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="法人代表"
              prop="legalRepresentative"
              :class="{ 'shake-error': shakeFields.includes('legalRepresentative') }"
            >
              <el-input
                v-model="formData.legalRepresentative"
                placeholder="请输入法人代表姓名"
                @blur="validateField('legalRepresentative')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="法人身份证"
              prop="legalRepIdCard"
              :class="{ 'shake-error': shakeFields.includes('legalRepIdCard') }"
            >
              <el-input
                v-model="formData.legalRepIdCard"
                placeholder="请输入法人代表身份证号"
                @blur="validateField('legalRepIdCard')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-divider content-position="left">账户信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="备案状态"
            prop="filingStatus"
            :class="{ 'shake-error': shakeFields.includes('filingStatus') }"
          >
            <el-select v-model="formData.filingStatus" style="width: 100%">
              <el-option label="未备案" value="not_filed" />
              <el-option label="备案中" value="filing" />
              <el-option label="已备案" value="filed" />
              <el-option label="备案驳回" value="rejected" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="账户开通状态"
            prop="accountStatus"
            :class="{ 'shake-error': shakeFields.includes('accountStatus') }"
          >
            <el-select v-model="formData.accountStatus" style="width: 100%">
              <el-option label="未开户" value="not_opened" />
              <el-option label="开户中" value="opening" />
              <el-option label="已开户" value="opened" />
              <el-option label="已销户" value="closed" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item
            label="风险等级"
            prop="riskLevel"
            :required="formData.archiveStatus === 'formal'"
            :class="{ 'shake-error': shakeFields.includes('riskLevel') }"
          >
            <el-select v-model="formData.riskLevel" placeholder="请选择风险等级" style="width: 100%">
              <el-option label="R1-低风险" value="R1" />
              <el-option label="R2-中低风险" value="R2" />
              <el-option label="R3-中风险" value="R3" />
              <el-option label="R4-中高风险" value="R4" />
              <el-option label="R5-高风险" value="R5" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item
            label="初始存款(元)"
            prop="initialDeposit"
            :required="formData.archiveStatus === 'formal'"
            :class="{ 'shake-error': shakeFields.includes('initialDeposit') }"
          >
            <el-input-number
              v-model="formData.initialDeposit"
              :min="0"
              :precision="2"
              :step="1000"
              style="width: 100%"
              @change="validateField('initialDeposit')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="开户日期" prop="accountOpenDate">
            <el-date-picker
              v-model="formData.accountOpenDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="总资产(元)" prop="totalAsset">
            <el-input-number
              v-model="formData.totalAsset"
              :min="0"
              :precision="2"
              :step="1000"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '确认提交' }}
      </el-button>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { CustomerType, ArchiveStatus } from '@/enums'
import { isIdCard, isPhone } from '@/utils/validate'
import * as customerApi from '@/api/customerAsset'
import type { ICustomerAsset, IValidationError } from '@/types/api'

interface Props {
  visible: boolean
  editData?: ICustomerAsset | null
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const shakeFields = ref<string[]>([])

const defaultFormData: Partial<ICustomerAsset> = {
  archiveStatus: ArchiveStatus.TEMPORARY,
  customerType: CustomerType.INDIVIDUAL,
  customerName: '',
  idCard: '',
  phone: '',
  email: '',
  address: '',
  filingStatus: 'not_filed',
  accountStatus: 'not_opened',
  riskLevel: 'R1',
  initialDeposit: 0,
  totalAsset: 0,
  gender: 'male',
  education: '',
  maritalStatus: '',
  occupation: '',
  workUnit: '',
  institutionName: '',
  institutionCode: '',
  unifiedSocialCredit: '',
  businessLicense: '',
  legalRepresentative: '',
  legalRepIdCard: '',
  remark: '',
}

const formData = ref<Partial<ICustomerAsset>>({ ...defaultFormData })

const dialogTitle = computed(() => (props.editData ? '编辑客户建档' : '新增客户建档'))

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    customerName: [
      { required: true, message: '请输入客户名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    ],
    idCard: [
      { required: true, message: '请输入身份证号', trigger: 'blur' },
      { validator: (_rule: any, value: string, callback: any) => {
        if (!value) return callback()
        if (!isIdCard(value)) {
          callback(new Error('身份证号码格式不正确'))
        } else {
          callback()
        }
      }, trigger: 'blur' },
    ],
    phone: [
      { required: true, message: '请输入手机号码', trigger: 'blur' },
      { validator: (_rule: any, value: string, callback: any) => {
        if (!value) return callback()
        if (!isPhone(value)) {
          callback(new Error('手机号码格式不正确'))
        } else {
          callback()
        }
      }, trigger: 'blur' },
    ],
    email: [
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
    ],
  }
  if (formData.value.customerType === CustomerType.INSTITUTION) {
    rules.institutionName = [{ required: true, message: '请输入机构名称', trigger: 'blur' }]
    rules.unifiedSocialCredit = [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }]
    rules.legalRepresentative = [{ required: true, message: '请输入法人代表姓名', trigger: 'blur' }]
    rules.legalRepIdCard = [
      { required: true, message: '请输入法人代表身份证号', trigger: 'blur' },
      { validator: (_rule: any, value: string, callback: any) => {
        if (!value) return callback()
        if (!isIdCard(value)) {
          callback(new Error('身份证号码格式不正确'))
        } else {
          callback()
        }
      }, trigger: 'blur' },
    ]
  }
  if (formData.value.archiveStatus === ArchiveStatus.FORMAL) {
    rules.riskLevel = [{ required: true, message: '正式建档请选择风险等级', trigger: 'change' }]
    rules.initialDeposit = [{ required: true, message: '正式建档请填写初始存款', trigger: 'change' }]
  }
  return rules
})

function triggerShake(fields: string[]) {
  shakeFields.value = fields
  setTimeout(() => {
    shakeFields.value = []
  }, 500)
}

function handleArchiveTypeChange() {
  nextTick(() => {
    formRef.value?.validateField('riskLevel')
    formRef.value?.validateField('initialDeposit')
  })
}

async function validateField(field: string) {
  try {
    await formRef.value?.validateField(field)
  } catch {
    triggerShake([field])
  }
}

function handleClosed() {
  formData.value = { ...defaultFormData }
  shakeFields.value = []
  formRef.value?.clearValidate()
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.editData) {
      formData.value = { ...defaultFormData, ...props.editData }
    } else if (val) {
      formData.value = { ...defaultFormData }
    }
  },
)

async function handleSubmit() {
  if (submitting.value) return

  try {
    await formRef.value?.validate()
  } catch (err: any) {
    const fields = Object.keys(err || {})
    triggerShake(fields)
    ElMessage.warning('请检查表单填写是否正确')
    return
  }

  submitting.value = true
  try {
    if (props.editData) {
      const res = await customerApi.update(props.editData.id, formData.value)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    } else {
      const res = await customerApi.create(formData.value)
      if (res.code === 0) {
        ElMessage.success(`建档成功，资产账户编号：${res.data.assetAccountNo}`)
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    }
  } catch (err: any) {
    handleSubmitError(err.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleSubmitError(message: string) {
  try {
    const errors: IValidationError[] = JSON.parse(message)
    if (Array.isArray(errors) && errors.length > 0) {
      const fields = errors.map((e) => toCamelCase(e.field))
      triggerShake(fields)
      ElMessage.error(errors[0].message)
    } else {
      ElMessage.error(message)
    }
  } catch {
    ElMessage.error(message)
  }
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
</script>

<style lang="scss" scoped>
.archive-form {
  .tip-icon {
    margin-left: 8px;
    color: #909399;
    cursor: help;
  }

  :deep(.el-form-item.shake-error .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-select .el-select__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-input-number .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
