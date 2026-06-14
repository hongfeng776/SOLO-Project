<template>
  <div class="page-container enterprise-detail">
    <div class="detail-header">
      <div class="detail-header-left">
        <el-button link @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <h2 class="enterprise-name">{{ detail?.name || '-' }}</h2>
        <el-tag :type="getStatusTagType(detail?.status ?? 0)" size="large" class="status-tag">
          {{ getStatusLabel(detail?.status ?? 0) }}
        </el-tag>
      </div>
      <div class="detail-header-right">
        <el-button type="primary" @click="handleEdit">编辑企业</el-button>
        <el-button v-if="detail?.status === 1" type="warning" @click="handleBan">封禁企业</el-button>
        <el-button v-else type="success" @click="handleUnban">解封企业</el-button>
      </div>
    </div>

    <ProSkeleton :loading="loading" :rows="8">
      <template v-if="!loading && detail">
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-card-label">发布岗位</div>
            <div class="stat-card-value">{{ detail.positionCount }}</div>
            <div class="stat-card-footer">累计发布</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">在招岗位</div>
            <div class="stat-card-value text-primary">{{ detail.activePositionCount }}</div>
            <div class="stat-card-footer">当前招聘中</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">收到简历</div>
            <div class="stat-card-value text-success">{{ detail.resumeCount }}</div>
            <div class="stat-card-footer">累计收到</div>
          </div>
        </div>

        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">基础信息</span>
              <span class="card-subtitle">入驻时间：{{ detail.entryTime }}</span>
            </div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="企业名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="统一社会信用代码">{{ detail.unifiedCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="法定代表人">{{ detail.legalPerson || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册资本">{{ detail.registeredCapital ? detail.registeredCapital + ' 万元' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="成立日期">{{ detail.establishedDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="行业">{{ detail.industry || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业规模">{{ detail.scale || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detail.contactName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.contactPhone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detail.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ detail.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经营范围" :span="3">
              <div class="business-scope">{{ detail.businessScope || '-' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">资质信息</span>
            </div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="营业执照号">{{ detail.licenseNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执照类型">{{ detail.licenseType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="资质名称">{{ detail.qualificationName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="资质编号">{{ detail.qualificationNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="资质到期日">
              <span :class="{ 'text-warning': isExpiringSoon(detail.qualificationExpiry) }">
                {{ detail.qualificationExpiry || '-' }}
                <el-tag v-if="isExpiringSoon(detail.qualificationExpiry)" size="small" type="warning" class="expiry-tag">即将到期</el-tag>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </template>
    </ProSkeleton>

    <ProDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :confirm-loading="submitLoading"
      @confirm="handleSubmit"
      @cancel="handleDialogCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入企业名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="unifiedCode">
              <el-input v-model="formData.unifiedCode" placeholder="请输入统一社会信用代码" maxlength="18" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="法定代表人" prop="legalPerson">
              <el-input v-model="formData.legalPerson" placeholder="请输入法定代表人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册资本" prop="registeredCapital">
              <el-input v-model="formData.registeredCapital" placeholder="请输入注册资本（万元）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="成立日期" prop="establishedDate">
              <el-date-picker
                v-model="formData.establishedDate"
                type="date"
                placeholder="请选择成立日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行业" prop="industry">
              <el-select v-model="formData.industry" placeholder="请选择行业" clearable style="width: 100%">
                <el-option v-for="item in industryOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规模" prop="scale">
              <el-select v-model="formData.scale" placeholder="请选择规模" clearable style="width: 100%">
                <el-option v-for="item in scaleOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" :value="1" />
                <el-option label="封禁" :value="0" />
                <el-option label="待审核" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="formData.contactName" placeholder="请输入联系人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="经营范围" prop="businessScope">
              <el-input v-model="formData.businessScope" type="textarea" :rows="3" placeholder="请输入经营范围" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">资质信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="营业执照号" prop="licenseNo">
              <el-input v-model="formData.licenseNo" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执照类型" prop="licenseType">
              <el-select v-model="formData.licenseType" placeholder="请选择执照类型" clearable style="width: 100%">
                <el-option v-for="item in licenseTypeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资质名称" prop="qualificationName">
              <el-input v-model="formData.qualificationName" placeholder="请输入资质名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资质编号" prop="qualificationNo">
              <el-input v-model="formData.qualificationNo" placeholder="请输入资质编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资质到期日" prop="qualificationExpiry">
              <el-date-picker
                v-model="formData.qualificationExpiry"
                type="date"
                placeholder="请选择资质到期日"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ProDialog, ProSkeleton, useConfirm } from '@/components'
import {
  getEnterpriseDetailVO,
  updateEnterprise,
  batchUpdateStatus,
  type EnterpriseForm,
  type EnterpriseDetailVO
} from '@/api/enterprise'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const { confirm, success, error } = useConfirm()

const industryOptions = ['互联网', '金融', '教育', '医疗', '制造', '房地产', '零售', '物流', '其他']
const scaleOptions = ['0-50人', '50-150人', '150-500人', '500-1000人', '1000人以上']
const licenseTypeOptions = ['普通营业执照', '多证合一营业执照', '个体工商户营业执照']

const loading = ref(false)
const detail = ref<EnterpriseDetailVO | null>(null)

function getStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '正常', 0: '已封禁', 2: '待审核' }
  return map[status] ?? '未知'
}

function getStatusTagType(status: number): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<number, 'success' | 'danger' | 'warning' | 'info'> = { 1: 'success', 0: 'danger', 2: 'warning' }
  return map[status] ?? 'info'
}

function isExpiringSoon(dateStr: string) {
  if (!dateStr) return false
  const expiry = dayjs(dateStr)
  const now = dayjs()
  return expiry.diff(now, 'day') <= 90 && expiry.diff(now, 'day') >= 0
}

async function fetchDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    detail.value = await getEnterpriseDetailVO(id)
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/enterprise')
}

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const dialogTitle = computed(() => '编辑企业')

const initFormData = (): EnterpriseForm => ({
  name: '',
  unifiedCode: '',
  contactName: '',
  contactPhone: '',
  email: '',
  address: '',
  industry: '',
  scale: '',
  licenseNo: '',
  licenseType: '',
  legalPerson: '',
  registeredCapital: '',
  establishedDate: '',
  businessScope: '',
  qualificationName: '',
  qualificationNo: '',
  qualificationExpiry: '',
  status: 1
})

const formData = reactive<EnterpriseForm>(initFormData())

const phoneValidator = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的11位手机号'))
  } else {
    callback()
  }
}

const emailValidator = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

const unifiedCodeValidator = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (value && !/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(value)) {
    callback(new Error('请输入正确的18位统一社会信用代码'))
  } else {
    callback()
  }
}

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  unifiedCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { validator: unifiedCodeValidator, trigger: 'blur' }
  ],
  contactName: [
    { required: true, message: '请输入联系人', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { validator: phoneValidator, trigger: 'blur' }
  ],
  legalPerson: [
    { required: true, message: '请输入法定代表人', trigger: 'blur' }
  ],
  email: [{ validator: emailValidator, trigger: 'blur' }]
})

const enterpriseFormKeys = [
  'id', 'name', 'unifiedCode', 'contactName', 'contactPhone', 'email', 'address',
  'industry', 'scale', 'licenseNo', 'licenseType', 'legalPerson', 'registeredCapital',
  'establishedDate', 'businessScope', 'qualificationName', 'qualificationNo',
  'qualificationExpiry', 'status'
] as const

function handleEdit() {
  if (!detail.value) return
  enterpriseFormKeys.forEach((key) => {
    ;(formData as any)[key] = (detail.value as any)[key]
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await updateEnterprise(formData)
    success('编辑成功')
    dialogVisible.value = false
    fetchDetail()
  } finally {
    submitLoading.value = false
  }
}

function handleDialogCancel() {
  formRef.value?.resetFields()
}

async function handleBan() {
  if (!detail.value) return
  const ok = await confirm(`确定要封禁企业「${detail.value.name}」吗？封禁后该企业发布的岗位将全部下架。`, '封禁确认', {
    type: 'warning'
  })
  if (!ok) return
  try {
    await batchUpdateStatus([detail.value.id], 0)
    success('封禁成功')
    detail.value.status = 0
    fetchDetail()
  } catch {
    error('封禁失败，请稍后重试')
  }
}

async function handleUnban() {
  if (!detail.value) return
  const ok = await confirm(`确定要解封企业「${detail.value.name}」吗？`, '解封确认', {
    type: 'success'
  })
  if (!ok) return
  try {
    await batchUpdateStatus([detail.value.id], 1)
    success('解封成功')
    detail.value.status = 1
    fetchDetail()
  } catch {
    error('解封失败，请稍后重试')
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.enterprise-detail {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid $border-color-lighter;

    &-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    &-right {
      display: flex;
      gap: 10px;
    }
  }

  .back-btn {
    font-size: 14px;
    color: $text-regular;
    padding: 0;

    .el-icon {
      margin-right: 4px;
    }
  }

  .enterprise-name {
    font-size: 22px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  .status-tag {
    margin-left: 8px;
  }

  .stat-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .info-card {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .card-subtitle {
    font-size: 13px;
    color: $text-secondary;
  }

  .business-scope {
    line-height: 1.6;
    color: $text-regular;
  }

  .expiry-tag {
    margin-left: 8px;
  }
}
</style>
