<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-title">企业管理</div>
    </div>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="企业名称">
        <el-input v-model="queryParams.name" placeholder="请输入企业名称" clearable />
      </el-form-item>
      <el-form-item label="行业类型">
        <el-select v-model="queryParams.industry" placeholder="请选择行业" clearable>
          <el-option v-for="item in industryOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="入驻时间">
        <el-date-picker
          v-model="entryTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          clearable
          @change="handleDateRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" v-debounce="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="table-toolbar-left">
        <el-button type="primary" v-debounce="handleAdd">新增企业</el-button>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="6">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无企业数据" />
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          show-index
          @pagination-change="handlePaginationChange"
          @row-dblclick="handleRowDblclick"
        >
          <el-table-column prop="name" label="企业名称" min-width="160" show-overflow-tooltip resizable />
          <el-table-column prop="industry" label="行业" width="110" resizable />
          <el-table-column prop="scale" label="规模" width="120" resizable />
          <el-table-column prop="contactName" label="联系人" width="100" resizable />
          <el-table-column prop="contactPhone" label="联系电话" width="130" resizable />
          <el-table-column prop="entryTime" label="入驻时间" width="170" resizable />
          <el-table-column prop="status" label="状态" width="80" align="center" resizable>
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" v-debounce="() => handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" v-debounce="() => handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </ProTable>
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
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
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
import { ref, reactive, computed } from 'vue'
import { ProTable, ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getEnterpriseList,
  getEnterpriseDetail,
  createEnterprise,
  updateEnterprise,
  removeEnterprise,
  type EnterpriseForm,
  type EnterpriseRecord
} from '@/api/enterprise'
import type { FormInstance, FormRules } from 'element-plus'

const { confirmDelete, success, error } = useConfirm()

const industryOptions = ['互联网', '金融', '教育', '医疗', '制造', '房地产', '零售', '物流', '其他']
const scaleOptions = ['0-50人', '50-150人', '150-500人', '500-1000人', '1000人以上']
const licenseTypeOptions = ['普通营业执照', '多证合一营业执照', '个体工商户营业执照']

const loading = ref(false)
const tableData = ref<EnterpriseRecord[]>([])
const total = ref(0)
const entryTimeRange = ref<[string, string] | null>(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  industry: '',
  entryTimeStart: '',
  entryTimeEnd: ''
})

function handleDateRangeChange(val: [string, string] | null) {
  if (val) {
    queryParams.entryTimeStart = val[0]
    queryParams.entryTimeEnd = val[1]
  } else {
    queryParams.entryTimeStart = ''
    queryParams.entryTimeEnd = ''
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getEnterpriseList(queryParams)
    tableData.value = res.records
    total.value = res.total
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  fetchList()
}

function handleReset() {
  queryParams.name = ''
  queryParams.industry = ''
  queryParams.entryTimeStart = ''
  queryParams.entryTimeEnd = ''
  entryTimeRange.value = null
  handleQuery()
}

function handlePaginationChange({ page, pageSize }: { page: number; pageSize: number }) {
  queryParams.pageNum = page
  queryParams.pageSize = pageSize
  fetchList()
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const dialogTitle = computed(() => (isEdit.value ? '编辑企业' : '新增企业'))

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

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
}

async function handleEdit(row: EnterpriseRecord) {
  isEdit.value = true
  try {
    const detail = await getEnterpriseDetail(row.id)
    Object.assign(formData, detail)
    dialogVisible.value = true
  } catch {}
}

function handleRowDblclick(row: EnterpriseRecord) {
  handleEdit(row)
}

function handleDelete(row: EnterpriseRecord) {
  confirmDelete(`确定要删除企业「${row.name}」吗？`).then(async (ok: boolean) => {
    if (ok) {
      try {
        await removeEnterprise(row.id)
        success('删除成功')
        fetchList()
      } catch {
        error('删除失败，请稍后重试')
      }
    }
  })
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateEnterprise(formData)
      success('编辑成功')
    } else {
      await createEnterprise(formData)
      success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function handleDialogCancel() {
  formRef.value?.resetFields()
}

fetchList()
</script>
