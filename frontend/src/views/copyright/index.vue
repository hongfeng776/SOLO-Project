<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import type { FormInstance, UploadUserFile, UploadProps } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { useUserStore } from '@/stores'
import {
  COPYRIGHT_TYPE,
  COPYRIGHT_CONTENT_TYPE,
  COPYRIGHT_BIND_STATUS,
  COPYRIGHT_OWNERSHIP_STATUS,
  COPYRIGHT_COMPLIANCE_STATUS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getCopyrightListApi,
  getCopyrightDetailApi,
  createCopyrightApi,
  updateCopyrightApi,
  deleteCopyrightApi,
  checkCopyrightConflictApi,
  verifyQualificationFilesApi,
  syncCopyrightToModulesApi,
} from '@/api/copyright'
import type { CopyrightItem, CopyrightDetail, CopyrightFormData } from '@/types'
import { formatDate } from '@/utils'
import {
  Plus, UploadFilled, Check, Close, Refresh, View, Edit, Delete, Search,
  Document, Bell, WarningFilled, CircleCheck, CircleClose,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const getAuthToken = () => userStore.accessToken

const loading = ref(false)
const listData = ref<CopyrightItem[]>([])
const total = ref(0)
const selectedRows = ref<CopyrightItem[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: null as number | null,
  status: null as number | null,
  contentType: null as number | null,
  ownershipStatus: null as number | null,
  complianceStatus: null as number | null,
  bindStatus: null as number | null,
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getCopyrightListApi({ ...queryParams })
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.type = null
  queryParams.status = null
  queryParams.contentType = null
  queryParams.ownershipStatus = null
  queryParams.complianceStatus = null
  queryParams.bindStatus = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const handleSelectionChange = (rows: CopyrightItem[]) => {
  selectedRows.value = rows
}

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const currentDetail = ref<CopyrightDetail | null>(null)

const formData = reactive<CopyrightFormData>({
  code: '',
  name: '',
  type: 1,
  contentType: 1,
  supplierName: '',
  supplierContact: '',
  supplierPhone: '',
  contractNo: '',
  startDate: '',
  endDate: '',
  territories: '',
  licenseScope: [],
  licenseFee: 0,
  paymentStatus: 0,
  ownershipStatus: 1,
  description: '',
  remark: '',
  status: 1,
  copyrightCertificate: '',
  authorizationAgreement: '',
  ownershipProof: '',
  contentIds: [],
  qualificationFiles: [],
})

const isBoundPublished = computed(() => {
  return currentDetail.value?.bindStatus === 2
})

const needsReVerification = computed(() => {
  if (dialogMode.value !== 'edit') return false
  return isBoundPublished.value
})

const certificateFile = reactive({
  fileList: [] as UploadUserFile[],
  isUploading: false,
  isVerified: false,
  verifyStatus: '' as '' | 'success' | 'error' | 'warning',
  verifyMessage: '',
})
const agreementFile = reactive({
  fileList: [] as UploadUserFile[],
  isUploading: false,
  isVerified: false,
  verifyStatus: '' as '' | 'success' | 'error' | 'warning',
  verifyMessage: '',
})
const ownershipFile = reactive({
  fileList: [] as UploadUserFile[],
  isUploading: false,
  isVerified: false,
  verifyStatus: '' as '' | 'success' | 'error' | 'warning',
  verifyMessage: '',
})

const resetFileStates = () => {
  certificateFile.fileList = []
  agreementFile.fileList = []
  ownershipFile.fileList = []
  certificateFile.isUploading = false
  agreementFile.isUploading = false
  ownershipFile.isUploading = false
  certificateFile.isVerified = false
  agreementFile.isVerified = false
  ownershipFile.isVerified = false
  certificateFile.verifyStatus = ''
  agreementFile.verifyStatus = ''
  ownershipFile.verifyStatus = ''
  certificateFile.verifyMessage = ''
  agreementFile.verifyMessage = ''
  ownershipFile.verifyMessage = ''
}

const createFileUploadHandler = (fileObj: any, fieldKey: 'copyrightCertificate' | 'authorizationAgreement' | 'ownershipProof'): Partial<UploadProps> => {
  return {
    beforeUpload: (file: File) => {
      const isLt20M = file.size / 1024 / 1024 < 20
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      const isTypeOk = allowedTypes.includes(file.type)
      if (!isTypeOk) {
        ElMessage.error('仅支持 PDF、JPG、PNG 格式的文件!')
        return false
      }
      if (!isLt20M) {
        ElMessage.error('文件大小不能超过 20MB!')
        return false
      }
      fileObj.isUploading = true
      fileObj.verifyStatus = ''
      fileObj.isVerified = false
      return true
    },
    onSuccess: (response: any) => {
      const url = response.data?.url || response.data
      if (url) {
        ;(formData as any)[fieldKey] = url
        fileObj.isVerified = true
        fileObj.verifyStatus = 'success'
        fileObj.verifyMessage = '文件上传成功'
        ElMessage.success('文件上传成功')
      }
      fileObj.isUploading = false
    },
    onError: () => {
      fileObj.isUploading = false
      fileObj.verifyStatus = 'error'
      fileObj.verifyMessage = '文件上传失败，请重试'
      ElMessage.error('文件上传失败')
    },
    onRemove: () => {
      ;(formData as any)[fieldKey] = ''
      fileObj.isVerified = false
      fileObj.verifyStatus = ''
      fileObj.verifyMessage = ''
      if (needsReVerification.value) {
        fileObj.verifyStatus = 'warning'
        fileObj.verifyMessage = '已上架绑定内容需重新上传资质文件核验'
      }
    },
  }
}

const certificateHandlers = createFileUploadHandler(certificateFile, 'copyrightCertificate')
const agreementHandlers = createFileUploadHandler(agreementFile, 'authorizationAgreement')
const ownershipHandlers = createFileUploadHandler(ownershipFile, 'ownershipProof')

const formRules = {
  code: [{ required: true, message: '请输入版权编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入版权名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择版权类型', trigger: 'change' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  supplierName: [{ required: true, message: '请输入供应方名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择授权开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择授权结束日期', trigger: 'change' }],
}

const contentTypeOptions = computed(() => getEnumOptions(COPYRIGHT_CONTENT_TYPE))
const typeOptions = computed(() => getEnumOptions(COPYRIGHT_TYPE))
const licenseScopeOptions = computed(() => {
  const ct = getEnumItem(COPYRIGHT_CONTENT_TYPE, formData.contentType) as any
  return ct?.scopeOptions || []
})

const openDialog = async (mode: 'create' | 'edit' | 'view', row?: CopyrightItem) => {
  dialogMode.value = mode
  resetFileStates()
  currentDetail.value = null

  if (row && row.id) {
    const detail = await getCopyrightDetailApi(row.id)
    currentDetail.value = detail
    Object.assign(formData, {
      id: detail.id,
      code: detail.code,
      name: detail.name,
      type: detail.type,
      contentType: detail.contentType || 1,
      supplierName: detail.supplierName,
      supplierContact: detail.supplierContact || '',
      supplierPhone: detail.supplierPhone || '',
      contractNo: detail.contractNo || '',
      startDate: detail.startDate,
      endDate: detail.endDate,
      territories: detail.territories || '',
      licenseScope: detail.licenseScope || [],
      licenseFee: detail.licenseFee || 0,
      paymentStatus: detail.paymentStatus || 0,
      ownershipStatus: detail.ownershipStatus || 1,
      description: detail.description || '',
      remark: detail.remark || '',
      status: detail.status,
      copyrightCertificate: detail.copyrightCertificate || '',
      authorizationAgreement: detail.authorizationAgreement || '',
      ownershipProof: detail.ownershipProof || '',
      contentIds: detail.relatedContents?.map((c) => c.id) || [],
      qualificationFiles: detail.qualificationFiles || [],
    })
    if (detail.copyrightCertificate) {
      certificateFile.fileList = [{ name: '版权证书', url: detail.copyrightCertificate, status: 'success' }]
      certificateFile.isVerified = true
      certificateFile.verifyStatus = needsReVerification.value ? 'warning' : 'success'
      certificateFile.verifyMessage = needsReVerification.value
        ? '已上架绑定内容，建议重新上传核验'
        : '资质文件已核验'
    }
    if (detail.authorizationAgreement) {
      agreementFile.fileList = [{ name: '授权协议', url: detail.authorizationAgreement, status: 'success' }]
      agreementFile.isVerified = true
      agreementFile.verifyStatus = needsReVerification.value ? 'warning' : 'success'
      agreementFile.verifyMessage = needsReVerification.value
        ? '已上架绑定内容，建议重新上传核验'
        : '资质文件已核验'
    }
    if (detail.ownershipProof) {
      ownershipFile.fileList = [{ name: '权属证明', url: detail.ownershipProof, status: 'success' }]
      ownershipFile.isVerified = true
      ownershipFile.verifyStatus = needsReVerification.value ? 'warning' : 'success'
      ownershipFile.verifyMessage = needsReVerification.value
        ? '已上架绑定内容，建议重新上传核验'
        : '资质文件已核验'
    }
  } else {
    Object.assign(formData, {
      code: '',
      name: '',
      type: 1,
      contentType: 1,
      supplierName: '',
      supplierContact: '',
      supplierPhone: '',
      contractNo: '',
      startDate: '',
      endDate: '',
      territories: '',
      licenseScope: [],
      licenseFee: 0,
      paymentStatus: 0,
      ownershipStatus: 1,
      description: '',
      remark: '',
      status: 1,
      copyrightCertificate: '',
      authorizationAgreement: '',
      ownershipProof: '',
      contentIds: [],
      qualificationFiles: [],
    })
  }

  await nextTick()
  dialogVisible.value = true
}

const canSubmitEdit = computed(() => {
  if (dialogMode.value !== 'edit') return true
  if (!needsReVerification.value) return true
  return formData.copyrightCertificate !== '' && formData.authorizationAgreement !== '' && formData.ownershipProof !== ''
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  if (!canSubmitEdit.value) {
    ElMessage.warning('已上架绑定内容修改版权信息需重新上传并核验全部资质文件')
    return
  }
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await createCopyrightApi({ ...formData, status: formData.status ?? 1 })
      ElMessage.success('创建成功，已同步至内容审核与风控模块')
    } else {
      await updateCopyrightApi(formData.id!, { ...formData })
      ElMessage.success('更新成功，合规状态已同步更新至内容审核与风控模块')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: CopyrightItem) => {
  await ElMessageBox.confirm('确定要删除该版权信息吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteCopyrightApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const handleManualSync = async (row: CopyrightItem) => {
  loading.value = true
  try {
    await syncCopyrightToModulesApi(row.id, 'update')
    ElMessage.success('已手动同步至内容审核与风控模块')
  } finally {
    loading.value = false
  }
}

const tableColumns = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'code', label: '版权编号', width: 140 },
  { prop: 'name', label: '版权名称', minWidth: 180, showOverflowTooltip: true },
  {
    prop: 'type',
    label: '版权类型',
    width: 110,
    align: 'center',
    slot: 'type',
  },
  {
    prop: 'contentType',
    label: '内容类型',
    width: 100,
    align: 'center',
    slot: 'contentType',
  },
  { prop: 'supplierName', label: '供应方', minWidth: 130, showOverflowTooltip: true },
  {
    label: '授权期限',
    width: 220,
    align: 'center',
    slot: 'period',
  },
  {
    prop: 'ownershipStatus',
    label: '权属状态',
    width: 110,
    align: 'center',
    slot: 'ownershipStatus',
  },
  {
    prop: 'complianceStatus',
    label: '合规状态',
    width: 100,
    align: 'center',
    slot: 'complianceStatus',
  },
  {
    prop: 'bindStatus',
    label: '绑定状态',
    width: 120,
    align: 'center',
    slot: 'bindStatus',
  },
  {
    prop: 'contentCount',
    label: '关联内容',
    width: 90,
    align: 'center',
  },
  {
    prop: 'status',
    label: '版权状态',
    width: 90,
    align: 'center',
    slot: 'status',
  },
  { label: '操作', width: 240, fixed: 'right', align: 'center', slot: 'actions' },
]

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="copyright-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="编号/名称/供应方/合同号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="版权类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select
            v-model="queryParams.contentType"
            placeholder="全部"
            clearable
            style="width: 110px"
          >
            <el-option
              v-for="item in contentTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="合规状态">
          <el-select
            v-model="queryParams.complianceStatus"
            placeholder="全部"
            clearable
            style="width: 110px"
          >
            <el-option label="合规" :value="1" />
            <el-option label="合规预警" :value="2" />
            <el-option label="已过期" :value="3" />
            <el-option label="资料不完整" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定状态">
          <el-select
            v-model="queryParams.bindStatus"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option label="未绑定内容" :value="0" />
            <el-option label="已绑定(待上架)" :value="1" />
            <el-option label="已绑定(已上架)" :value="2" />
            <el-option label="已绑定(已下架)" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="版权状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 110px"
          >
            <el-option label="生效中" :value="1" />
            <el-option label="已失效" :value="0" />
            <el-option label="即将到期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :selected-count="selectedRows.length"
        @create="openDialog('create')"
        @refresh="loadData"
        create-text="新增版权"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :index="true"
        :selection="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
      >
        <template #type="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_TYPE, row.type)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COPYRIGHT_TYPE, row.type) }}
          </el-tag>
        </template>

        <template #contentType="{ row }">
          <el-tag size="small" type="info" effect="plain">
            {{ getEnumLabel(COPYRIGHT_CONTENT_TYPE, row.contentType) || '-' }}
          </el-tag>
        </template>

        <template #period="{ row }">
          <div style="font-size: 12px; line-height: 1.4;">
            <div>{{ formatDate(row.startDate, 'YYYY-MM-DD') }}</div>
            <div style="color: #909399">至 {{ formatDate(row.endDate, 'YYYY-MM-DD') }}</div>
          </div>
        </template>

        <template #ownershipStatus="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_OWNERSHIP_STATUS, row.ownershipStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COPYRIGHT_OWNERSHIP_STATUS, row.ownershipStatus) || '-' }}
          </el-tag>
        </template>

        <template #complianceStatus="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_COMPLIANCE_STATUS, row.complianceStatus)?.type || 'info'"
            size="small"
          >
            <el-icon v-if="row.complianceStatus === 1" style="margin-right: 2px;"><CircleCheck /></el-icon>
            <el-icon v-else-if="row.complianceStatus === 2" style="margin-right: 2px;"><Bell /></el-icon>
            <el-icon v-else style="margin-right: 2px;"><CircleClose /></el-icon>
            {{ getEnumLabel(COPYRIGHT_COMPLIANCE_STATUS, row.complianceStatus) || '-' }}
          </el-tag>
        </template>

        <template #bindStatus="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_BIND_STATUS, row.bindStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COPYRIGHT_BIND_STATUS, row.bindStatus) || '未绑定' }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'info'"
            size="small"
          >
            {{ row.status === 1 ? '生效中' : row.status === 2 ? '即将到期' : '已失效' }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openDialog('view', row)">查看</el-button>
          <el-button type="primary" link :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
          <el-button type="info" link @click="handleManualSync(row)">同步</el-button>
          <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增版权' : dialogMode === 'edit' ? '编辑版权' : '版权详情'"
      width="780px"
      :close-on-click-modal="false"
      class="copyright-dialog"
    >
      <el-alert
        v-if="dialogMode === 'edit' && needsReVerification"
        title="已上架绑定内容，修改后需重新核验资质文件"
        type="warning"
        :closable="false"
        show-icon
        class="reverify-alert"
      >
        <template #icon>
          <el-icon><WarningFilled /></el-icon>
        </template>
        由于该版权已绑定已上架的内容，编辑后需重新上传并核验全部三类资质文件，确保版权合规性。系统将自动同步更新至内容审核与风控模块。
      </el-alert>

      <el-alert
        v-if="dialogMode === 'edit' && currentDetail?.bindStatus === 0"
        title="未绑定内容状态，可直接编辑保存"
        type="info"
        :closable="false"
        show-icon
        class="reverify-alert"
      >
        <template #icon>
          <el-icon><CircleCheck /></el-icon>
        </template>
        当前版权未绑定任何内容，可直接编辑保存，无需重新核验资质文件。保存后系统将自动更新版权合规状态。
      </el-alert>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
        class="copyright-form"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="版权编号" prop="code">
              <el-input v-model="formData.code" placeholder="请输入版权编号" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版权名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入版权名称" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版权类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in typeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容类型" prop="contentType">
              <el-select v-model="formData.contentType" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in contentTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权属状态">
              <el-select v-model="formData.ownershipStatus" placeholder="请选择" style="width: 100%">
                <el-option label="权属清晰" :value="1" />
                <el-option label="权属争议中" :value="2" />
                <el-option label="权属待核实" :value="3" />
                <el-option label="已转让" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应方名称" prop="supplierName">
              <el-input v-model="formData.supplierName" placeholder="请输入供应方名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系人">
              <el-input v-model="formData.supplierContact" placeholder="联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系电话">
              <el-input v-model="formData.supplierPhone" placeholder="电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同编号">
              <el-input v-model="formData.contractNo" placeholder="请输入合同编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权地区">
              <el-input v-model="formData.territories" placeholder="如：中国大陆、港澳台" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权开始" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权结束" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="授权范围">
              <el-checkbox-group v-model="formData.licenseScope">
                <el-checkbox
                  v-for="scope in licenseScopeOptions"
                  :key="scope"
                  :value="scope"
                  :label="scope"
                />
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权费用">
              <el-input-number v-model="formData.licenseFee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="付款状态">
              <el-select v-model="formData.paymentStatus" style="width: 100%">
                <el-option label="未支付" :value="0" />
                <el-option label="部分支付" :value="1" />
                <el-option label="已支付" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="版权状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">生效</el-radio>
                <el-radio :value="0">失效</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left" class="form-divider">资质文件</el-divider>

        <el-row :gutter="16">
          <el-col :span="8">
            <div class="form-upload-section" :class="{ 'needs-reverify': needsReVerification && !certificateFile.fileList.length }">
              <div class="upload-section-title">
                <span class="required-mark">*</span>版权证书
                <el-tag v-if="certificateFile.verifyStatus === 'success'" size="small" type="success" effect="light">
                  <el-icon><Check /></el-icon> 已核验
                </el-tag>
                <el-tag v-else-if="certificateFile.verifyStatus === 'warning'" size="small" type="warning" effect="light">
                  <el-icon><WarningFilled /></el-icon> 建议重传
                </el-tag>
              </div>
              <el-upload
                v-model:file-list="certificateFile.fileList"
                action="/api/v1/upload"
                :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
                :limit="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :before-upload="certificateHandlers.beforeUpload"
                :on-success="certificateHandlers.onSuccess"
                :on-error="certificateHandlers.onError"
                :on-remove="certificateHandlers.onRemove"
                list-type="text"
              >
                <el-button type="primary" :icon="UploadFilled" :loading="certificateFile.isUploading" size="small">
                  上传/更换
                </el-button>
              </el-upload>
              <div v-if="certificateFile.verifyMessage" class="verify-tip" :class="certificateFile.verifyStatus">
                {{ certificateFile.verifyMessage }}
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="form-upload-section" :class="{ 'needs-reverify': needsReVerification && !agreementFile.fileList.length }">
              <div class="upload-section-title">
                <span class="required-mark">*</span>授权协议
                <el-tag v-if="agreementFile.verifyStatus === 'success'" size="small" type="success" effect="light">
                  <el-icon><Check /></el-icon> 已核验
                </el-tag>
                <el-tag v-else-if="agreementFile.verifyStatus === 'warning'" size="small" type="warning" effect="light">
                  <el-icon><WarningFilled /></el-icon> 建议重传
                </el-tag>
              </div>
              <el-upload
                v-model:file-list="agreementFile.fileList"
                action="/api/v1/upload"
                :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
                :limit="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :before-upload="agreementHandlers.beforeUpload"
                :on-success="agreementHandlers.onSuccess"
                :on-error="agreementHandlers.onError"
                :on-remove="agreementHandlers.onRemove"
                list-type="text"
              >
                <el-button type="primary" :icon="UploadFilled" :loading="agreementFile.isUploading" size="small">
                  上传/更换
                </el-button>
              </el-upload>
              <div v-if="agreementFile.verifyMessage" class="verify-tip" :class="agreementFile.verifyStatus">
                {{ agreementFile.verifyMessage }}
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="form-upload-section" :class="{ 'needs-reverify': needsReVerification && !ownershipFile.fileList.length }">
              <div class="upload-section-title">
                <span class="required-mark">*</span>权属证明
                <el-tag v-if="ownershipFile.verifyStatus === 'success'" size="small" type="success" effect="light">
                  <el-icon><Check /></el-icon> 已核验
                </el-tag>
                <el-tag v-else-if="ownershipFile.verifyStatus === 'warning'" size="small" type="warning" effect="light">
                  <el-icon><WarningFilled /></el-icon> 建议重传
                </el-tag>
              </div>
              <el-upload
                v-model:file-list="ownershipFile.fileList"
                action="/api/v1/upload"
                :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
                :limit="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :before-upload="ownershipHandlers.beforeUpload"
                :on-success="ownershipHandlers.onSuccess"
                :on-error="ownershipHandlers.onError"
                :on-remove="ownershipHandlers.onRemove"
                list-type="text"
              >
                <el-button type="primary" :icon="UploadFilled" :loading="ownershipFile.isUploading" size="small">
                  上传/更换
                </el-button>
              </el-upload>
              <div v-if="ownershipFile.verifyMessage" class="verify-tip" :class="ownershipFile.verifyStatus">
                {{ ownershipFile.verifyMessage }}
              </div>
            </div>
          </el-col>
        </el-row>

        <el-divider content-position="left" class="form-divider">关联内容</el-divider>

        <div v-if="currentDetail?.relatedContents?.length" class="related-contents">
          <el-tag
            v-for="content in currentDetail.relatedContents"
            :key="content.id"
            :type="content.status === 1 && content.auditStatus === 2 ? 'success' : 'info'"
            effect="light"
            style="margin: 4px"
            closable
          >
            [ID:{{ content.id }}] {{ content.title }}
            <span style="margin-left: 4px; opacity: 0.7;">
              {{ content.status === 1 ? (content.auditStatus === 2 ? '已上架' : '待上架') : '已下架' }}
            </span>
          </el-tag>
        </div>
        <div v-else class="empty-related">暂无关联内容</div>

        <el-divider content-position="left" class="form-divider">补充信息</el-divider>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="版权说明">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入版权说明"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" placeholder="备注信息" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          :loading="submitting"
          :disabled="!canSubmitEdit"
          @click="handleSubmit"
        >
          <template v-if="submitting">提交中...</template>
          <template v-else>确定</template>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.copyright-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.copyright-dialog {
  :deep(.el-dialog) {
    animation: dialogZoomFadeIn 0.3s ease-out;
    border-radius: 10px;
    overflow: hidden;
  }

  .reverify-alert {
    margin-bottom: 16px;
  }
}

@keyframes dialogZoomFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.copyright-form {
  .form-divider {
    margin: 16px 0 8px 0;
    :deep(.el-divider__text) {
      font-weight: 600;
      color: $text-primary;
    }
  }

  .form-upload-section {
    background: #FAFBFC;
    border-radius: 6px;
    padding: 12px;
    border: 1px solid $border-color-lighter;
    transition: all 0.3s;

    &.needs-reverify {
      border-color: $warning-color;
      background: rgba(230, 162, 60, 0.05);
    }

    .upload-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      font-size: $font-sm;
      font-weight: 500;

      .required-mark {
        color: #F56C6C;
      }
    }

    .verify-tip {
      margin-top: 8px;
      font-size: $font-xs;
      padding: 4px 8px;
      border-radius: 4px;

      &.success {
        background: rgba(103, 194, 58, 0.1);
        color: $success-color;
      }
      &.warning {
        background: rgba(230, 162, 60, 0.1);
        color: $warning-color;
      }
      &.error {
        background: rgba(245, 108, 108, 0.1);
        color: $danger-color;
      }
    }
  }

  .related-contents {
    padding: 8px 0;
  }

  .empty-related {
    color: $text-secondary;
    font-size: $font-sm;
    padding: 12px 0;
    text-align: center;
    background: #FAFBFC;
    border-radius: 4px;
  }
}
</style>
