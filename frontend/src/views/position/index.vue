<template>
  <div class="page-container position-page">
    <div class="page-header">
      <div class="page-header-title">岗位管理</div>
      <div class="page-header-sub">共 {{ total }} 条岗位记录</div>
    </div>

    <el-tabs v-model="activeTab" class="status-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane :label="`招聘中(${statusCounts[1] || 0})`" name="1" />
      <el-tab-pane :label="`已下架(${statusCounts[0] || 0})`" name="0" />
      <el-tab-pane :label="`已过期(${statusCounts[4] || 0})`" name="4" />
      <el-tab-pane :label="`待审核(${statusCounts[3] || 0})`" name="3" />
    </el-tabs>

    <el-form :model="queryParams" inline class="search-form">
      <el-form-item label="岗位名称">
        <el-input v-model="queryParams.title" placeholder="请输入岗位名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="岗位分类">
        <el-select v-model="queryParams.category" placeholder="请选择分类" clearable style="width: 160px">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属企业">
        <el-select v-model="queryParams.enterpriseId" placeholder="请选择企业" clearable filterable style="width: 200px">
          <el-option
            v-for="item in enterpriseList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="工作地点">
        <el-input v-model="queryParams.city" placeholder="请输入城市" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" v-ripple v-debounce="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="table-toolbar-left">
        <el-button type="primary" v-ripple v-debounce="handleAdd">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>
          新增岗位
        </el-button>
        <el-button
          type="danger"
          v-ripple
          :disabled="selectedIds.length === 0 || actionLoading.batchDelete"
          :loading="actionLoading.batchDelete"
          @click="handleBatchDelete"
        >
          <el-icon style="margin-right: 4px"><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
      <div class="table-toolbar-right">
        <span class="selected-tip" v-show="selectedIds.length > 0">
          已选择 <em>{{ selectedIds.length }}</em> 项
        </span>
      </div>
    </div>

    <ProSkeleton :loading="loading" type="table" :rows="6">
      <template v-if="!loading">
        <ProEmpty v-if="tableData.length === 0" description="暂无岗位数据，点击「新增岗位」创建第一条记录">
          <el-button type="primary" v-ripple @click="handleAdd">新增岗位</el-button>
        </ProEmpty>
        <ProTable
          v-else
          :data="tableData"
          :total="total"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          show-selection
          show-index
          highlight-current-row
          :row-class-name="getRowClassName"
          @selection-change="handleSelectionChange"
          @pagination-change="handlePaginationChange"
          @row-dblclick="handleEdit"
        >
          <el-table-column
            prop="title"
            label="岗位名称"
            min-width="180"
            resizable
            fixed="left"
          >
            <template #default="{ row }">
              <el-tooltip :content="row.title" placement="top" :disabled="!row.title || row.title.length <= 10">
                <span class="position-title" :class="{ 'is-closed': row.status === 0 }">
                  {{ row.title }}
                </span>
              </el-tooltip>
              <el-tag v-if="row.category" size="small" class="category-tag" effect="plain">
                {{ row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="enterpriseName"
            label="所属企业"
            min-width="160"
            resizable
          >
            <template #default="{ row }">
              <el-tooltip :content="row.enterpriseName" placement="top" :disabled="!row.enterpriseName || row.enterpriseName.length <= 10">
                <span>{{ row.enterpriseName }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column
            label="薪资范围(K)"
            width="130"
            align="center"
            resizable
            sortable
          >
            <template #default="{ row }">
              <span class="salary-text">{{ row.salaryMin }}K-{{ row.salaryMax }}K</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="city"
            label="工作地点"
            width="110"
            align="center"
            resizable
          />
          <el-table-column
            prop="education"
            label="学历要求"
            width="100"
            align="center"
            resizable
          />
          <el-table-column
            prop="experience"
            label="经验要求"
            width="100"
            align="center"
            resizable
          />
          <el-table-column
            prop="viewCount"
            label="浏览量"
            width="90"
            align="center"
            resizable
            sortable
          />
          <el-table-column
            prop="applyCount"
            label="投递量"
            width="90"
            align="center"
            resizable
            sortable
          />
          <el-table-column
            prop="expireTime"
            label="过期时间"
            width="160"
            align="center"
            resizable
            sortable
          />
          <el-table-column
            prop="status"
            label="状态"
            width="100"
            align="center"
            resizable
          >
            <template #default="{ row }">
              <el-tag
                :type="getPositionStatusType(row.status)"
                size="small"
                effect="light"
                :style="row.status === 3 ? 'background: #f0e6ff; color: #722ed1; border-color: #d3adf7' : ''"
              >
                {{ getPositionStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="createTime"
            label="发布时间"
            width="160"
            align="center"
            resizable
            sortable
          />
          <el-table-column
            label="操作"
            width="220"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleView(row as PositionRecord)">详情</el-button>
              <el-button
                type="info"
                link
                size="small"
                :loading="actionLoading.edit === row.id"
                :disabled="actionLoading.edit === row.id"
                v-debounce="() => handleEdit(row as PositionRecord)"
              >
                编辑
              </el-button>
              <template v-if="canShowOnlineButton(row.status)">
                <el-button
                  type="success"
                  link
                  size="small"
                  :loading="actionLoading.online === row.id"
                  :disabled="actionLoading.online === row.id"
                  v-debounce="() => handleOnline(row as PositionRecord)"
                >
                  上架
                </el-button>
              </template>
              <template v-if="canShowOfflineButton(row.status)">
                <el-button
                  type="warning"
                  link
                  size="small"
                  :loading="actionLoading.offline === row.id"
                  :disabled="actionLoading.offline === row.id"
                  v-debounce="() => handleOffline(row as PositionRecord)"
                >
                  下架
                </el-button>
              </template>
              <el-button
                type="danger"
                link
                size="small"
                :loading="actionLoading.delete === row.id"
                :disabled="actionLoading.delete === row.id"
                v-debounce="() => handleDelete(row as PositionRecord)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </ProTable>
      </template>
    </ProSkeleton>

    <ProDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :confirm-loading="actionLoading.submit"
      @confirm="handleSubmit"
      @cancel="handleDialogCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="position-form">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="岗位名称" prop="title">
              <el-input
                v-model="formData.title"
                placeholder="请输入岗位名称，如：Java高级工程师"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属企业" prop="enterpriseId">
              <el-select
                v-model="formData.enterpriseId"
                placeholder="请选择企业"
                filterable
                style="width: 100%"
                @change="handleEnterpriseChange"
              >
                <el-option
                  v-for="item in enterpriseList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位分类" prop="category">
              <el-select
                v-model="formData.category"
                placeholder="请选择岗位分类"
                style="width: 100%"
              >
                <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最低薪资" prop="salaryMin">
              <el-input-number v-model="formData.salaryMin" :min="1" :max="500" controls-position="right" style="width: 100%" />
              <span class="unit-text">K</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最高薪资" prop="salaryMax">
              <el-input-number v-model="formData.salaryMax" :min="1" :max="500" controls-position="right" style="width: 100%" />
              <span class="unit-text">K</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工作地点" prop="city">
              <el-input v-model="formData.city" placeholder="如：北京" maxlength="32" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学历要求" prop="education">
              <el-select v-model="formData.education" placeholder="请选择学历" clearable style="width: 100%">
                <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经验要求" prop="experience">
              <el-select v-model="formData.experience" placeholder="请选择经验要求" clearable style="width: 100%">
                <el-option v-for="item in experienceOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">招聘中</el-radio>
                <el-radio :value="2">已暂停</el-radio>
                <el-radio :value="0">已关闭</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expireTime">
              <el-date-picker
                v-model="formData.expireTime"
                type="datetime"
                placeholder="请选择过期时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">岗位详情</el-divider>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="岗位职责" prop="responsibility">
              <el-input
                v-model="formData.responsibility"
                type="textarea"
                :rows="4"
                placeholder="请输入岗位职责，每行一条，如：1. 负责核心业务系统的设计与开发"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="任职要求" prop="requirement">
              <el-input
                v-model="formData.requirement"
                type="textarea"
                :rows="4"
                placeholder="请输入任职要求，每行一条，如：1. 本科及以上学历，计算机相关专业"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ProDialog>

    <ProDialog
      v-model:visible="detailVisible"
      title="岗位详情"
      width="680px"
      :show-confirm="false"
      cancel-text="关闭"
    >
      <div class="position-detail" v-if="detailData">
        <div class="detail-header">
          <h3 class="detail-title">{{ detailData.title }}</h3>
          <el-tag
            :type="getPositionStatusType(detailData.status)"
            size="large"
            effect="light"
            :style="detailData.status === 3 ? 'background: #f0e6ff; color: #722ed1; border-color: #d3adf7' : ''"
          >
            {{ getPositionStatusLabel(detailData.status) }}
          </el-tag>
        </div>
        <div class="detail-meta">
          <span class="meta-item"><el-icon><OfficeBuilding /></el-icon> {{ detailData.enterpriseName }}</span>
          <span class="meta-item"><el-icon><Location /></el-icon> {{ detailData.city }}</span>
          <span class="meta-item salary"><el-icon><Money /></el-icon> {{ detailData.salaryMin }}K-{{ detailData.salaryMax }}K</span>
          <span class="meta-item" v-if="detailData.education"><el-icon><Reading /></el-icon> {{ detailData.education }}</span>
          <span class="meta-item" v-if="detailData.experience"><el-icon><Clock /></el-icon> {{ detailData.experience }}</span>
          <span class="meta-item" v-if="detailData.category"><el-icon><Collection /></el-icon> {{ detailData.category }}</span>
        </div>
        <el-descriptions :column="2" border size="default" class="detail-desc">
          <el-descriptions-item label="浏览量">{{ detailData.viewCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="投递量">{{ detailData.applyCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ detailData.createTime }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">{{ detailData.expireTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detailData.updateTime || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-section">
          <div class="section-title">
            <el-icon><List /></el-icon> 岗位职责
          </div>
          <div class="section-content">{{ detailData.responsibility || '暂无' }}</div>
        </div>
        <div class="detail-section">
          <div class="section-title">
            <el-icon><Medal /></el-icon> 任职要求
          </div>
          <div class="section-content">{{ detailData.requirement || '暂无' }}</div>
        </div>
      </div>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Delete,
  OfficeBuilding,
  Location,
  Money,
  Reading,
  Clock,
  Collection,
  List,
  Medal
} from '@element-plus/icons-vue'
import { ProTable, ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getPositionList,
  getPositionDetail,
  createPosition,
  updatePosition,
  removePosition,
  removePositionBatch,
  onlinePosition,
  offlinePosition,
  updatePositionStatus,
  type PositionForm,
  type PositionRecord
} from '@/api/position'
import { getEnterpriseList, type EnterpriseRecord } from '@/api/enterprise'
import type { FormInstance, FormRules } from 'element-plus'
import type { TabPaneName } from 'element-plus'

const router = useRouter()
const { confirmDelete, confirm, success, error } = useConfirm()

const categoryOptions = ['技术开发', '产品运营', '市场营销', '设计创意', '数据分析', '人力资源', '财务金融', '行政支持', '其他']
const educationOptions = ['不限', '高中', '大专', '本科', '硕士', '博士']
const experienceOptions = ['不限', '应届生', '1-3年', '3-5年', '5-10年', '10年以上']
const statusOptions = [
  { label: '招聘中', value: 1 },
  { label: '已下架', value: 0 },
  { label: '已暂停', value: 2 },
  { label: '待审核', value: 3 },
  { label: '已过期', value: 4 }
]

function getPositionStatusType(status: number): 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    1: 'success',
    0: 'info',
    2: 'warning',
    3: undefined,
    4: 'info'
  }
  return map[status] ?? 'info'
}

function getPositionStatusLabel(status: number) {
  const map: Record<number, string> = {
    1: '招聘中',
    0: '已下架',
    2: '已暂停',
    3: '待审核',
    4: '已过期'
  }
  return map[status] ?? '未知'
}

function canShowOnlineButton(status: number): boolean {
  return [0, 2, 3, 4].includes(status)
}

function canShowOfflineButton(status: number): boolean {
  return [1, 2, 3].includes(status)
}

function getRowClassName({ row }: { row: PositionRecord }) {
  return row.status === 0 ? 'row-closed' : ''
}

const loading = ref(false)
const tableData = ref<PositionRecord[]>([])
const total = ref(0)
const enterpriseList = ref<EnterpriseRecord[]>([])
const selectedIds = ref<number[]>([])
const activeTab = ref('')
const statusCounts = reactive<Record<number, number>>({})

const actionLoading = reactive({
  online: null as number | null,
  offline: null as number | null,
  delete: null as number | null,
  batchDelete: false,
  edit: null as number | null,
  submit: false
})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  category: '',
  enterpriseId: '' as number | string,
  city: '',
  status: '' as number | string
})

async function fetchList() {
  loading.value = true
  selectedIds.value = []
  try {
    const res = await getPositionList(queryParams)
    tableData.value = res.records
    total.value = res.total
    calculateStatusCounts()
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function calculateStatusCounts() {
  try {
    const countRes = await getPositionList({ pageNum: 1, pageSize: 1000 })
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
    countRes.records.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })
    Object.assign(statusCounts, counts)
  } catch {}
}

async function fetchEnterpriseList() {
  try {
    const res = await getEnterpriseList({ pageNum: 1, pageSize: 1000 })
    enterpriseList.value = res.records
  } catch {
    enterpriseList.value = []
  }
}

function handleTabChange(tabName: TabPaneName) {
  queryParams.status = tabName as number | string
  queryParams.pageNum = 1
  fetchList()
}

function handleQuery() {
  queryParams.pageNum = 1
  activeTab.value = String(queryParams.status || '')
  fetchList()
}

function handleReset() {
  queryParams.title = ''
  queryParams.category = ''
  queryParams.enterpriseId = ''
  queryParams.city = ''
  queryParams.status = ''
  activeTab.value = ''
  handleQuery()
}

function handlePaginationChange({ page, pageSize }: { page: number; pageSize: number }) {
  queryParams.pageNum = page
  queryParams.pageSize = pageSize
  fetchList()
}

function handleSelectionChange(selection: PositionRecord[]) {
  selectedIds.value = selection.map((item) => item.id)
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const dialogTitle = computed(() => (isEdit.value ? '编辑岗位' : '新增岗位'))

const initFormData = (): PositionForm => ({
  title: '',
  enterpriseId: '',
  category: '',
  salaryMin: 10,
  salaryMax: 20,
  city: '',
  education: '不限',
  experience: '不限',
  responsibility: '',
  requirement: '',
  status: 1,
  expireTime: ''
})

const formData = reactive<PositionForm>(initFormData())

const salaryMaxValidator = (_rule: any, value: number, callback: (err?: Error) => void) => {
  if (value <= formData.salaryMin) {
    callback(new Error('最高薪资必须大于最低薪资'))
  } else {
    callback()
  }
}

const formRules = reactive<FormRules>({
  title: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  enterpriseId: [
    { required: true, message: '请选择所属企业', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择岗位分类', trigger: 'change' }
  ],
  salaryMin: [
    { required: true, message: '请输入最低薪资', trigger: 'blur' }
  ],
  salaryMax: [
    { required: true, message: '请输入最高薪资', trigger: 'blur' },
    { validator: salaryMaxValidator, trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入工作地点', trigger: 'blur' }
  ]
})

function handleEnterpriseChange(val: number | string) {
  const selected = enterpriseList.value.find((e) => String(e.id) === String(val))
}

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, initFormData())
  dialogVisible.value = true
  if (enterpriseList.value.length === 0) {
    fetchEnterpriseList()
  }
}

const positionFormKeys = [
  'id', 'title', 'enterpriseId', 'category', 'salaryMin', 'salaryMax',
  'city', 'education', 'experience', 'responsibility', 'requirement', 'status', 'expireTime'
] as const

async function handleEdit(row: PositionRecord) {
  isEdit.value = true
  actionLoading.edit = row.id
  if (enterpriseList.value.length === 0) {
    await fetchEnterpriseList()
  }
  try {
    const detail = await getPositionDetail(row.id)
    positionFormKeys.forEach((key) => {
      ;(formData as any)[key] = (detail as any)[key]
    })
    dialogVisible.value = true
  } catch {
  } finally {
    actionLoading.edit = null
  }
}

async function handleDelete(row: PositionRecord) {
  const ok = await confirmDelete(
    `确定要删除岗位「${row.title}」吗？此操作不可恢复，将永久删除该岗位的所有数据。`,
    '删除确认'
  )
  if (ok) {
    actionLoading.delete = row.id
    try {
      await removePosition(row.id)
      success('删除成功')
      fetchList()
    } catch {
      error('删除失败，请稍后重试')
    } finally {
      actionLoading.delete = null
    }
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirm(
    `确定要删除选中的 ${selectedIds.value.length} 条岗位记录吗？此操作不可恢复，将永久删除这些数据。`,
    '批量删除确认',
    { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
  )
  if (!ok) return
  actionLoading.batchDelete = true
  try {
    await removePositionBatch(selectedIds.value)
    success('批量删除成功')
    fetchList()
  } catch {
    error('批量删除失败，请稍后重试')
  } finally {
    actionLoading.batchDelete = false
  }
}

async function handleOnline(row: PositionRecord) {
  const ok = await confirm(
    `确定要上架岗位「${row.title}」吗？`,
    '上架确认',
    { type: 'info', confirmButtonText: '确认上架', cancelButtonText: '取消' }
  )
  if (!ok) return
  actionLoading.online = row.id
  try {
    await onlinePosition(row.id)
    success('上架成功')
    fetchList()
  } catch {
    error('上架失败，请稍后重试')
  } finally {
    actionLoading.online = null
  }
}

async function handleOffline(row: PositionRecord) {
  const ok = await confirm(
    `确定要下架岗位「${row.title}」吗？`,
    '下架确认',
    { type: 'warning', confirmButtonText: '确认下架', cancelButtonText: '取消' }
  )
  if (!ok) return
  actionLoading.offline = row.id
  try {
    await offlinePosition(row.id)
    success('下架成功')
    fetchList()
  } catch {
    error('下架失败，请稍后重试')
  } finally {
    actionLoading.offline = null
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  actionLoading.submit = true
  try {
    if (isEdit.value) {
      await updatePosition(formData)
      success('编辑成功')
    } else {
      await createPosition(formData)
      success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    error(isEdit.value ? '编辑失败，请稍后重试' : '新增失败，请稍后重试')
  } finally {
    setTimeout(() => {
      actionLoading.submit = false
    }, 300)
  }
}

function handleDialogCancel() {
  formRef.value?.resetFields()
}

const detailVisible = ref(false)
const detailData = ref<PositionRecord | null>(null)

async function handleView(row: PositionRecord) {
  router.push(`/position/detail/${row.id}`)
}

onMounted(() => {
  fetchList()
  fetchEnterpriseList()
})
</script>

<style lang="scss" scoped>
.position-page {
  .page-header {
    display: flex;
    align-items: baseline;
    gap: 12px;

    &-sub {
      font-size: 13px;
      color: $text-secondary;
    }
  }

  .status-tabs {
    margin-bottom: 16px;

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }
  }

  .selected-tip {
    font-size: 14px;
    color: $text-regular;

    em {
      color: $primary-color;
      font-style: normal;
      font-weight: 600;
      margin: 0 2px;
    }
  }

  .position-title {
    font-weight: 500;
    color: $text-primary;
    transition: color 0.2s;

    &.is-closed {
      color: $text-placeholder;
      text-decoration: line-through;
    }
  }

  .category-tag {
    margin-left: 8px;
    color: $primary-color;
    border-color: rgba($primary-color, 0.3);
    background: rgba($primary-color, 0.06);
  }

  .salary-text {
    font-weight: 600;
    color: $danger-color;
    font-size: 14px;
  }

  :deep(.el-table) {
    .current-row,
    tr.current-row > td {
      background-color: #E8F3FF !important;
    }

    .el-table__body tr:hover > td.el-table__cell {
      background-color: #F5F9FF !important;
    }

    .row-closed {
      > td {
        background-color: #FAFAFA;
      }

      &:hover > td {
        background-color: #F0F0F0 !important;
      }
    }
  }

  .position-form {
    .unit-text {
      margin-left: 8px;
      color: $text-secondary;
      font-size: 13px;
    }
  }

  .position-detail {
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid $border-color-lighter;
      margin-bottom: 16px;

      .detail-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .detail-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      color: $text-regular;
      font-size: 14px;

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &.salary {
          color: $danger-color;
          font-weight: 600;
        }

        .el-icon {
          color: $text-secondary;
        }
      }
    }

    .detail-desc {
      margin-bottom: 20px;
    }

    .detail-section {
      margin-bottom: 20px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 10px;
        padding-left: 8px;
        border-left: 3px solid $primary-color;

        .el-icon {
          color: $primary-color;
        }
      }

      .section-content {
        padding: 12px 16px;
        background: $bg-color;
        border-radius: $border-radius-small;
        line-height: 1.8;
        color: $text-regular;
        white-space: pre-wrap;
      }
    }
  }
}
</style>
