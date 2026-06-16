<template>
  <div class="ccb-business-channel">
    <CcbPageHeader
      title="渠道管理"
      description="管理全渠道业务接入与配置"
      icon="Connection"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增渠道</el-button>
      </template>
    </CcbPageHeader>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="渠道编码" prop="channelCode">
        <el-input v-model="searchForm.channelCode" placeholder="请输入渠道编码" clearable />
      </el-form-item>
      <el-form-item label="渠道名称" prop="channelName">
        <el-input v-model="searchForm.channelName" placeholder="请输入渠道名称" clearable />
      </el-form-item>
      <el-form-item label="渠道类型" prop="channelType">
        <el-select v-model="searchForm.channelType" placeholder="请选择渠道类型" clearable>
          <el-option label="线下渠道" :value="1" />
          <el-option label="线上渠道" :value="2" />
          <el-option label="电子渠道" :value="3" />
          <el-option label="第三方渠道" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="正常" :value="1" />
          <el-option label="维护中" :value="2" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="success" :icon="Refresh" @click="handleSync">同步配置</el-button>
        <el-button type="danger" :icon="Delete" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量停用</el-button>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="channelCode" label="渠道编码" width="120" />
      <el-table-column prop="channelName" label="渠道名称" width="140" />
      <el-table-column prop="channelType" label="渠道类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getChannelTypeTagType(row.channelType)" effect="light" size="small">
            {{ getChannelTypeLabel(row.channelType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="providerName" label="供应商" width="140" />
      <el-table-column prop="apiUrl" label="接口地址" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.apiUrl" placement="top">
            <span class="truncate-text">{{ row.apiUrl }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="dailyLimit" label="日交易限额(万)" width="130" align="right">
        <template #default="{ row }">
          {{ formatMoneyWithComma(row.dailyLimit) }}
        </template>
      </el-table-column>
      <el-table-column prop="singleLimit" label="单笔限额(万)" width="120" align="right">
        <template #default="{ row }">
          {{ formatMoneyWithComma(row.singleLimit) }}
        </template>
      </el-table-column>
      <el-table-column prop="todayTransactionAmount" label="今日交易额(万)" width="140" align="right">
        <template #default="{ row }">
          <span class="ccb-amount-primary">¥{{ formatMoneyWithComma(row.todayTransactionAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="todayTransactionCount" label="今日交易笔数" width="120" align="center" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" effect="light">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link size="small" @click="handleConfig(row)">配置</el-button>
          <el-button v-if="row.status === 1" type="danger" link size="small" @click="handleStop(row)">停用</el-button>
          <el-button v-else type="success" link size="small" @click="handleStart(row)">启用</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'add' ? '新增渠道' : '编辑渠道'"
      width="680px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="channelFormRef"
        :model="channelForm"
        :rules="channelFormRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="渠道编码" prop="channelCode">
              <el-input
                v-model="channelForm.channelCode"
                placeholder="请输入渠道编码（英文大写）"
                :disabled="formMode === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道名称" prop="channelName">
              <el-input v-model="channelForm.channelName" placeholder="请输入渠道名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="渠道类型" prop="channelType">
              <el-select v-model="channelForm.channelType" placeholder="请选择渠道类型" style="width: 100%">
                <el-option label="线下渠道" :value="1" />
                <el-option label="线上渠道" :value="2" />
                <el-option label="电子渠道" :value="3" />
                <el-option label="第三方渠道" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商" prop="providerName">
              <el-input v-model="channelForm.providerName" placeholder="请输入供应商名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="接口地址" prop="apiUrl">
          <el-input v-model="channelForm.apiUrl" placeholder="请输入接口服务地址" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日交易限额(万)" prop="dailyLimit">
              <el-input-number
                v-model="channelForm.dailyLimit"
                :min="0"
                :precision="2"
                :step="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔限额(万)" prop="singleLimit">
              <el-input-number
                v-model="channelForm.singleLimit"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="AppID" prop="appId">
              <el-input v-model="channelForm.appId" placeholder="请输入渠道AppID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密钥" prop="appSecret">
              <el-input
                v-model="channelForm.appSecret"
                type="password"
                placeholder="请输入渠道密钥"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="渠道描述" prop="description">
          <el-input
            v-model="channelForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入渠道功能描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="channelForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatMoneyWithComma, formatDateTime } from '@utils'

interface Channel {
  id: number
  channelCode: string
  channelName: string
  channelType: number
  providerName: string
  apiUrl: string
  dailyLimit: number
  singleLimit: number
  appId: string
  appSecret: string
  todayTransactionAmount: number
  todayTransactionCount: number
  status: number
  description: string
  createdAt: string
  updatedAt: string
}

const loading = ref<boolean>(false)
const tableData = ref<Channel[]>([])
const total = ref<number>(0)
const selectedRows = ref<Channel[]>([])

const formDialogVisible = ref<boolean>(false)
const formMode = ref<'add' | 'edit'>('add')
const formLoading = ref<boolean>(false)
const channelFormRef = ref<FormInstance>()

const searchForm = reactive({
  channelCode: '',
  channelName: '',
  channelType: null as number | null,
  status: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const channelForm = reactive({
  id: 0,
  channelCode: '',
  channelName: '',
  channelType: null as number | null,
  providerName: '',
  apiUrl: '',
  dailyLimit: 10000,
  singleLimit: 500,
  appId: '',
  appSecret: '',
  status: 1,
  description: ''
})

const channelFormRules: FormRules = {
  channelCode: [
    { required: true, message: '请输入渠道编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '仅支持大写字母、数字和下划线', trigger: 'blur' }
  ],
  channelName: [
    { required: true, message: '请输入渠道名称', trigger: 'blur' },
    { min: 2, max: 32, message: '名称长度在 2 到 32 个字符', trigger: 'blur' }
  ],
  channelType: [
    { required: true, message: '请选择渠道类型', trigger: 'change' }
  ],
  providerName: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' }
  ],
  apiUrl: [
    { required: true, message: '请输入接口地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  dailyLimit: [
    { required: true, message: '请输入日交易限额', trigger: 'blur' }
  ],
  singleLimit: [
    { required: true, message: '请输入单笔限额', trigger: 'blur' }
  ],
  appId: [
    { required: true, message: '请输入AppID', trigger: 'blur' }
  ]
}

const getChannelTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    1: '线下渠道',
    2: '线上渠道',
    3: '电子渠道',
    4: '第三方渠道'
  }
  return labels[type] || '未知'
}

const getChannelTypeTagType = (type: number): string => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'primary',
    3: 'success',
    4: 'warning'
  }
  return types[type] || 'info'
}

const getStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    0: '停用',
    1: '正常',
    2: '维护中'
  }
  return labels[status] || '未知'
}

const getStatusTagType = (status: number): string => {
  const types: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'warning'
  }
  return types[status] || 'info'
}

const mockChannels: Channel[] = [
  {
    id: 1,
    channelCode: 'COUNTER',
    channelName: '柜面渠道',
    channelType: 1,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/counter',
    dailyLimit: 50000,
    singleLimit: 5000,
    appId: 'CCB_APP_001',
    appSecret: '******',
    todayTransactionAmount: 5860,
    todayTransactionCount: 1256,
    status: 1,
    description: '银行网点柜面业务办理渠道',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 2,
    channelCode: 'MOBILE',
    channelName: '手机银行',
    channelType: 3,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/mobile',
    dailyLimit: 100000,
    singleLimit: 500,
    appId: 'CCB_APP_002',
    appSecret: '******',
    todayTransactionAmount: 4230,
    todayTransactionCount: 986,
    status: 1,
    description: '手机APP移动银行渠道',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 3,
    channelCode: 'EBANK',
    channelName: '网上银行',
    channelType: 3,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/ebank',
    dailyLimit: 80000,
    singleLimit: 1000,
    appId: 'CCB_APP_003',
    appSecret: '******',
    todayTransactionAmount: 1580,
    todayTransactionCount: 520,
    status: 1,
    description: 'PC端网上银行渠道',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 4,
    channelCode: 'ATM',
    channelName: '自助终端',
    channelType: 1,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/atm',
    dailyLimit: 20000,
    singleLimit: 5,
    appId: 'CCB_APP_004',
    appSecret: '******',
    todayTransactionAmount: 720,
    todayTransactionCount: 356,
    status: 1,
    description: 'ATM/CRS自助设备渠道',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 5,
    channelCode: 'PHONE',
    channelName: '电话银行',
    channelType: 3,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/phone',
    dailyLimit: 10000,
    singleLimit: 50,
    appId: 'CCB_APP_005',
    appSecret: '******',
    todayTransactionAmount: 190.6,
    todayTransactionCount: 138,
    status: 1,
    description: '95533电话银行渠道',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 6,
    channelCode: 'WECHAT',
    channelName: '微信银行',
    channelType: 4,
    providerName: '腾讯科技',
    apiUrl: 'https://api.ccb.com/channel/wechat',
    dailyLimit: 30000,
    singleLimit: 200,
    appId: 'CCB_APP_006',
    appSecret: '******',
    todayTransactionAmount: 2560,
    todayTransactionCount: 856,
    status: 1,
    description: '微信公众号/小程序渠道',
    createdAt: '2024-02-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 7,
    channelCode: 'ALIPAY',
    channelName: '支付宝',
    channelType: 4,
    providerName: '蚂蚁科技',
    apiUrl: 'https://api.ccb.com/channel/alipay',
    dailyLimit: 25000,
    singleLimit: 100,
    appId: 'CCB_APP_007',
    appSecret: '******',
    todayTransactionAmount: 1890,
    todayTransactionCount: 624,
    status: 1,
    description: '支付宝生活号渠道',
    createdAt: '2024-02-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 8,
    channelCode: 'POS',
    channelName: 'POS收单',
    channelType: 2,
    providerName: '建银科技',
    apiUrl: 'https://api.ccb.com/channel/pos',
    dailyLimit: 100000,
    singleLimit: 2000,
    appId: 'CCB_APP_008',
    appSecret: '******',
    todayTransactionAmount: 3200,
    todayTransactionCount: 1056,
    status: 2,
    description: '商户POS收单业务渠道',
    createdAt: '2024-03-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 9,
    channelCode: 'OPENAPI',
    channelName: '开放平台',
    channelType: 4,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/openapi',
    dailyLimit: 500000,
    singleLimit: 5000,
    appId: 'CCB_APP_009',
    appSecret: '******',
    todayTransactionAmount: 8500,
    todayTransactionCount: 2368,
    status: 1,
    description: '开放银行API对接渠道',
    createdAt: '2024-03-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 10,
    channelCode: 'SMART',
    channelName: '智慧柜员机',
    channelType: 1,
    providerName: '建银科技',
    apiUrl: 'https://api.ccb.com/channel/smart',
    dailyLimit: 30000,
    singleLimit: 500,
    appId: 'CCB_APP_010',
    appSecret: '******',
    todayTransactionAmount: 680,
    todayTransactionCount: 232,
    status: 0,
    description: '网点智慧柜员机STM渠道',
    createdAt: '2024-04-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  },
  {
    id: 11,
    channelCode: 'VIDEO',
    channelName: '视频银行',
    channelType: 3,
    providerName: '中国建设银行',
    apiUrl: 'https://api.ccb.com/channel/video',
    dailyLimit: 10000,
    singleLimit: 100,
    appId: 'CCB_APP_011',
    appSecret: '******',
    todayTransactionAmount: 120,
    todayTransactionCount: 42,
    status: 1,
    description: '远程视频柜员VTM渠道',
    createdAt: '2024-05-01 10:00:00',
    updatedAt: '2024-06-16 12:00:00'
  }
]

const resetChannelForm = (): void => {
  channelForm.id = 0
  channelForm.channelCode = ''
  channelForm.channelName = ''
  channelForm.channelType = null
  channelForm.providerName = ''
  channelForm.apiUrl = ''
  channelForm.dailyLimit = 10000
  channelForm.singleLimit = 500
  channelForm.appId = ''
  channelForm.appSecret = ''
  channelForm.status = 1
  channelForm.description = ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockChannels.slice(start, end)
    total.value = mockChannels.length
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as Channel[]
}

const handleAdd = (): void => {
  formMode.value = 'add'
  resetChannelForm()
  formDialogVisible.value = true
}

const handleView = (row: Channel): void => {
  ElMessage.info(`查看渠道详情：${row.channelName}`)
}

const handleEdit = (row: Channel): void => {
  formMode.value = 'edit'
  Object.assign(channelForm, {
    id: row.id,
    channelCode: row.channelCode,
    channelName: row.channelName,
    channelType: row.channelType,
    providerName: row.providerName,
    apiUrl: row.apiUrl,
    dailyLimit: row.dailyLimit,
    singleLimit: row.singleLimit,
    appId: row.appId,
    appSecret: '******',
    status: row.status,
    description: row.description
  })
  formDialogVisible.value = true
}

const handleConfig = (row: Channel): void => {
  ElMessage.info(`配置渠道参数：${row.channelName}`)
}

const handleStart = async (row: Channel): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要启用渠道 "${row.channelName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('启用成功')
    fetchData()
  } catch {}
}

const handleStop = async (row: Channel): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要停用渠道 "${row.channelName}" 吗？停用后相关业务将无法办理。`, '提示', {
      confirmButtonText: '确定停用',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('停用成功')
    fetchData()
  } catch {}
}

const handleDelete = async (row: Channel): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确定要删除渠道 "${row.channelName}" 吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

const handleBatchDelete = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要批量停用选中的 ${selectedRows.value.length} 个渠道吗？`,
      '提示',
      {
        confirmButtonText: '确定停用',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('批量停用成功')
    fetchData()
  } catch {}
}

const handleSync = (): void => {
  ElMessage.success('渠道配置同步任务已提交')
}

const handleDialogClosed = (): void => {
  channelFormRef.value?.resetFields()
  resetChannelForm()
}

const handleSubmit = async (): Promise<void> => {
  const valid = await channelFormRef.value?.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  setTimeout(() => {
    ElMessage.success(formMode.value === 'add' ? '新增成功' : '编辑成功')
    formLoading.value = false
    formDialogVisible.value = false
    fetchData()
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-business-channel {
  .ccb-amount-primary {
    font-weight: 600;
    color: #004098;
  }

  .truncate-text {
    display: inline-block;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }
}
</style>
