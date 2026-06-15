<template>
  <div class="page-container position-detail-page">
    <el-page-header class="detail-page-header" icon="ArrowLeft" :content="detailData?.title || '岗位详情'" @back="handleBack">
      <template #extra>
        <el-space>
          <el-button v-if="canOffline" v-ripple :loading="actionLoading.offline" v-debounce="handleOffline">
            <el-icon><Bottom /></el-icon> 下架岗位
          </el-button>
          <el-button v-if="canOnline" v-ripple type="success" :loading="actionLoading.online" v-debounce="handleOnline">
            <el-icon><Top /></el-icon> 重新上架
          </el-button>
          <el-button v-ripple type="primary" :loading="actionLoading.edit" @click="handleEdit">
            <el-icon><Edit /></el-icon> 编辑岗位
          </el-button>
        </el-space>
      </template>
    </el-page-header>

    <ProSkeleton :loading="loading" :rows="10">
      <div v-if="detailData" class="detail-content">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="info-card base-info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><OfficeBuilding /></el-icon> 基础信息
                  </span>
                  <el-tag :type="statusType" size="large" effect="light" class="status-tag">
                    {{ statusLabel }}
                  </el-tag>
                </div>
              </template>
              <div class="position-header">
                <h2 class="position-title">
                  {{ detailData.title }}
                  <el-tag v-if="detailData.category" size="small" class="category-tag" effect="plain">
                    {{ detailData.category }}
                  </el-tag>
                </h2>
                <div class="salary-info">
                  <span class="salary-num">{{ detailData.salaryMin }}K-{{ detailData.salaryMax }}K</span>
                  <span class="salary-tip">月薪</span>
                </div>
              </div>
              <el-descriptions :column="3" border size="default" class="info-desc">
                <el-descriptions-item label="所属企业">
                  <el-tooltip :content="detailData.enterpriseName" placement="top">
                    <span class="ellipsis-text">{{ detailData.enterpriseName }}</span>
                  </el-tooltip>
                </el-descriptions-item>
                <el-descriptions-item label="工作地点">
                  <el-tooltip :content="detailData.city" placement="top">
                    <span class="ellipsis-text">{{ detailData.city }}</span>
                  </el-tooltip>
                </el-descriptions-item>
                <el-descriptions-item label="学历要求">
                  {{ detailData.education || '不限' }}
                </el-descriptions-item>
                <el-descriptions-item label="经验要求">
                  {{ detailData.experience || '不限' }}
                </el-descriptions-item>
                <el-descriptions-item label="发布时间">
                  {{ detailData.createTime }}
                </el-descriptions-item>
                <el-descriptions-item label="过期时间">
                  {{ detailData.expireTime || '长期有效' }}
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                  {{ detailData.updateTime || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><List /></el-icon> 岗位职责
                  </span>
                </div>
              </template>
              <div class="content-block">
                <pre class="content-text" :class="{ 'is-empty': !detailData.responsibility }">
{{ detailData.responsibility || '暂无岗位职责信息' }}</pre>
              </div>
            </el-card>

            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><Medal /></el-icon> 任职要求
                  </span>
                </div>
              </template>
              <div class="content-block">
                <pre class="content-text" :class="{ 'is-empty': !detailData.requirement }">
{{ detailData.requirement || '暂无任职要求信息' }}</pre>
              </div>
            </el-card>

            <el-card class="info-card resume-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><Document /></el-icon> 投递记录
                  </span>
                  <span class="card-subtitle">共 {{ detailData.applyCount }} 条投递记录</span>
                </div>
              </template>
              <ProEmpty
                v-if="detailData.resumeList.length === 0"
                description="暂无投递记录"
                :image-size="80"
              />
              <el-table
                v-else
                :data="detailData.resumeList"
                stripe
                highlight-current-row
                style="width: 100%"
              >
                <el-table-column prop="seekerName" label="求职者" width="120" />
                <el-table-column prop="positionTitle" label="投递岗位" min-width="180" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-tooltip :content="row.positionTitle" placement="top">
                      <span>{{ row.positionTitle }}</span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column prop="statusText" label="处理状态" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getResumeStatusType(row.status)" size="small">
                      {{ row.statusText }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="applyTime" label="投递时间" width="160" align="center" />
                <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-tooltip
                      v-if="row.remark"
                      :content="row.remark"
                      placement="top"
                      :show-after="300"
                    >
                      <span class="ellipsis-text">{{ row.remark }}</span>
                    </el-tooltip>
                    <span v-else class="text-placeholder">暂无</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="info-card stats-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><DataAnalysis /></el-icon> 数据概览
                  </span>
                </div>
              </template>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value view">{{ detailData.viewCount }}</div>
                  <div class="stat-label">浏览次数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value apply">{{ detailData.applyCount }}</div>
                  <div class="stat-label">投递数量</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value rate">
                    {{ applyRate }}<small>%</small>
                  </div>
                  <div class="stat-label">投递转化率</div>
                </div>
              </div>
            </el-card>

            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><Clock /></el-icon> 生命周期
                  </span>
                </div>
              </template>
              <el-steps :active="activeStep" finish-status="success" direction="vertical" :active-icon="activeIcon">
                <el-step title="创建发布" :description="detailData.createTime" />
                <el-step title="审核通过" description="系统自动审核" />
                <el-step :title="stepTitle" :description="stepDesc" />
                <el-step title="关闭下架" :description="offlineDesc" />
              </el-steps>
            </el-card>

            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><Operation /></el-icon> 快捷操作
                  </span>
                </div>
              </template>
              <div class="action-list">
                <el-button
                  v-if="canOffline"
                  type="warning"
                  block
                  v-ripple
                  :loading="actionLoading.offline"
                  v-debounce="handleOffline"
                >
                  <el-icon><Bottom /></el-icon> 下架岗位
                </el-button>
                <el-button
                  v-if="canOnline"
                  type="success"
                  block
                  v-ripple
                  :loading="actionLoading.online"
                  v-debounce="handleOnline"
                >
                  <el-icon><Top /></el-icon> 重新上架
                </el-button>
                <el-button
                  type="primary"
                  block
                  v-ripple
                  :loading="actionLoading.edit"
                  @click="handleEdit"
                >
                  <el-icon><Edit /></el-icon> 编辑信息
                </el-button>
                <el-button
                  type="danger"
                  block
                  v-ripple
                  :loading="actionLoading.delete"
                  v-debounce="handleDelete"
                >
                  <el-icon><Delete /></el-icon> 删除岗位
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </ProSkeleton>

    <ProDialog
      v-model:visible="editDialogVisible"
      title="编辑岗位"
      width="720px"
      :confirm-loading="submitLoading"
      @confirm="handleEditSubmit"
      @cancel="handleEditCancel"
    >
      <el-form ref="editFormRef" :model="editFormData" :rules="editFormRules" label-width="100px" class="position-form">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="岗位名称" prop="title">
              <el-input v-model="editFormData.title" placeholder="请输入岗位名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属企业" prop="enterpriseId">
              <el-select
                v-model="editFormData.enterpriseId"
                placeholder="请选择企业"
                filterable
                style="width: 100%"
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
              <el-select v-model="editFormData.category" placeholder="请选择岗位分类" style="width: 100%">
                <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最低薪资" prop="salaryMin">
              <el-input-number
                v-model="editFormData.salaryMin"
                :min="1"
                :max="500"
                controls-position="right"
                style="width: 100%"
              />
              <span class="unit-text">K</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最高薪资" prop="salaryMax">
              <el-input-number
                v-model="editFormData.salaryMax"
                :min="1"
                :max="500"
                controls-position="right"
                style="width: 100%"
              />
              <span class="unit-text">K</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工作地点" prop="city">
              <el-input v-model="editFormData.city" placeholder="如：北京" maxlength="32" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学历要求" prop="education">
              <el-select v-model="editFormData.education" placeholder="请选择学历" clearable style="width: 100%">
                <el-option v-for="item in educationOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经验要求" prop="experience">
              <el-select v-model="editFormData.experience" placeholder="请选择经验要求" clearable style="width: 100%">
                <el-option v-for="item in experienceOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expireTime">
              <el-date-picker
                v-model="editFormData.expireTime"
                type="datetime"
                placeholder="请选择过期时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位状态" prop="status">
              <el-radio-group v-model="editFormData.status">
                <el-radio :value="1">招聘中</el-radio>
                <el-radio :value="2">已暂停</el-radio>
                <el-radio :value="0">已下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">岗位详情</el-divider>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="岗位职责" prop="responsibility">
              <el-input
                v-model="editFormData.responsibility"
                type="textarea"
                :rows="4"
                placeholder="请输入岗位职责，每行一条"
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
                v-model="editFormData.requirement"
                type="textarea"
                :rows="4"
                placeholder="请输入任职要求，每行一条"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ProDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Edit,
  Delete,
  Top,
  Bottom,
  OfficeBuilding,
  List,
  Medal,
  Document,
  DataAnalysis,
  Clock,
  Operation
} from '@element-plus/icons-vue'
import { ProDialog, ProSkeleton, ProEmpty, useConfirm } from '@/components'
import {
  getPositionDetailVO,
  updatePosition,
  onlinePosition,
  offlinePosition,
  removePosition,
  type PositionDetailVO,
  type PositionForm
} from '@/api/position'
import { getEnterpriseList, type EnterpriseRecord } from '@/api/enterprise'
import type { FormInstance, FormRules } from 'element-plus'
import type { Component } from 'vue'

const route = useRoute()
const router = useRouter()
const { confirmDelete, confirm, success, error } = useConfirm()

const categoryOptions = ['技术开发', '产品运营', '市场营销', '设计创意', '数据分析', '人力资源', '财务金融', '行政支持', '其他']
const educationOptions = ['不限', '高中', '大专', '本科', '硕士', '博士']
const experienceOptions = ['不限', '应届生', '1-3年', '3-5年', '5-10年', '10年以上']

function getPositionStatusType(status: number): 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    1: 'success',
    2: 'warning',
    3: undefined,
    4: 'info',
    0: 'info'
  }
  return map[status] ?? 'info'
}

function getPositionStatusLabel(status: number): string {
  const map: Record<number, string> = {
    1: '招聘中',
    2: '已暂停',
    3: '待审核',
    4: '已过期',
    0: '已下架'
  }
  return map[status] ?? '未知'
}

function getResumeStatusType(status: number): 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map: Record<number, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    0: 'info',
    1: 'warning',
    2: undefined,
    3: 'success',
    4: 'danger'
  }
  return map[status] ?? 'info'
}

const loading = ref(false)
const detailData = ref<PositionDetailVO | null>(null)
const enterpriseList = ref<EnterpriseRecord[]>([])

const actionLoading = reactive({
  online: false,
  offline: false,
  edit: false,
  delete: false
})

const statusType = computed(() => getPositionStatusType(detailData.value?.status ?? 0))
const statusLabel = computed(() => getPositionStatusLabel(detailData.value?.status ?? 0))

const canOnline = computed(() => {
  const s = detailData.value?.status
  return s === 0 || s === 2 || s === 4
})

const canOffline = computed(() => {
  const s = detailData.value?.status
  return s === 1 || s === 2 || s === 3
})

const applyRate = computed(() => {
  const v = detailData.value?.viewCount ?? 0
  const a = detailData.value?.applyCount ?? 0
  return v > 0 ? ((a / v) * 100).toFixed(1) : '0.0'
})

const activeStep = computed(() => {
  const s = detailData.value?.status
  if (s === 0 || s === 4) return 4
  if (s === 1) return 3
  if (s === 2) return 2
  if (s === 3) return 1
  return 0
})

const activeIcon: Component = computed(() => {
  const s = detailData.value?.status
  if (s === 0 || s === 4) return 'Close'
  if (s === 1) return 'Check'
  if (s === 2) return 'VideoPause'
  if (s === 3) return 'Clock'
  return ''
})

const stepTitle = computed(() => {
  const s = detailData.value?.status
  if (s === 1) return '招聘中'
  if (s === 2) return '已暂停'
  if (s === 3) return '审核中'
  return '招聘中'
})

const stepDesc = computed(() => {
  const s = detailData.value?.status
  if (s === 1) return '正在对外展示'
  if (s === 2) return '暂时停止招聘'
  if (s === 3) return '等待运营审核'
  return '正在对外展示'
})

const offlineDesc = computed(() => {
  const s = detailData.value?.status
  if (s === 4) return '已过期自动下架'
  if (s === 0) return '已手动下架'
  return '未下架'
})

async function fetchDetail() {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    detailData.value = await getPositionDetailVO(id)
  } catch {
    detailData.value = null
  } finally {
    loading.value = false
  }
}

async function fetchEnterpriseList() {
  try {
    const res = await getEnterpriseList({ pageNum: 1, pageSize: 1000 })
    enterpriseList.value = res.records
  } catch {
    enterpriseList.value = []
  }
}

function handleBack() {
  router.push('/position')
}

async function handleOffline() {
  if (!detailData.value) return
  const ok = await confirm(
    `确定要下架岗位「${detailData.value.title}」吗？下架后该岗位将停止对外展示。`,
    '下架确认',
    { type: 'warning', confirmButtonText: '确认下架' }
  )
  if (!ok) return

  actionLoading.offline = true
  try {
    await offlinePosition(detailData.value.id)
    success('下架成功')
    fetchDetail()
  } catch {
    error('下架失败，请稍后重试')
  } finally {
    actionLoading.offline = false
  }
}

async function handleOnline() {
  if (!detailData.value) return
  const ok = await confirm(
    `确定要重新上架岗位「${detailData.value.title}」吗？上架后该岗位将恢复对外展示。`,
    '上架确认',
    { type: 'success', confirmButtonText: '确认上架' }
  )
  if (!ok) return

  actionLoading.online = true
  try {
    await onlinePosition(detailData.value.id)
    success('上架成功')
    fetchDetail()
  } catch {
    error('上架失败，请稍后重试')
  } finally {
    actionLoading.online = false
  }
}

const editDialogVisible = ref(false)
const submitLoading = ref(false)
const editFormRef = ref<FormInstance>()

const positionFormKeys = [
  'id', 'title', 'enterpriseId', 'category', 'salaryMin', 'salaryMax',
  'city', 'education', 'experience', 'responsibility', 'requirement', 'expireTime', 'status'
] as const

const initEditFormData = (): PositionForm => ({
  id: undefined,
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
  expireTime: '',
  status: 1
})

const editFormData = reactive<PositionForm>(initEditFormData())

const salaryMaxValidator = (_rule: any, value: number, callback: (err?: Error) => void) => {
  if (value <= editFormData.salaryMin) {
    callback(new Error('最高薪资必须大于最低薪资'))
  } else {
    callback()
  }
}

const editFormRules = reactive<FormRules>({
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

async function handleEdit() {
  if (!detailData.value) return
  if (enterpriseList.value.length === 0) {
    await fetchEnterpriseList()
  }
  positionFormKeys.forEach((key) => {
    ;(editFormData as any)[key] = (detailData.value as any)[key]
  })
  editDialogVisible.value = true
}

async function handleDelete() {
  if (!detailData.value) return
  const ok = await confirmDelete(
    `确定要删除岗位「${detailData.value.title}」吗？此操作不可恢复，将永久删除该岗位的所有数据。`,
    '删除确认'
  )
  if (!ok) return

  actionLoading.delete = true
  try {
    await removePosition(detailData.value.id)
    success('删除成功')
    handleBack()
  } catch {
    error('删除失败，请稍后重试')
  } finally {
    actionLoading.delete = false
  }
}

async function handleEditSubmit() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await updatePosition(editFormData)
    success('编辑成功')
    editDialogVisible.value = false
    fetchDetail()
  } catch {
    error('编辑失败，请稍后重试')
  } finally {
    setTimeout(() => {
      submitLoading.value = false
    }, 300)
  }
}

function handleEditCancel() {
  editFormRef.value?.resetFields()
}

onMounted(() => {
  fetchDetail()
  fetchEnterpriseList()
})

watch(
  () => route.params.id,
  () => {
    fetchDetail()
  }
)
</script>

<style lang="scss" scoped>
.position-detail-page {
  .detail-page-header {
    margin-bottom: $spacing-lg;
    padding: $spacing-md 0;

    :deep(.el-page-header__content) {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .info-card {
    margin-bottom: $spacing-lg;
    border-radius: $border-radius;

    &:last-child {
      margin-bottom: 0;
    }

    :deep(.el-card__header) {
      padding: $spacing-md $spacing-lg;
      border-bottom: 1px solid $border-color-lighter;

      &.is-always-shadow,
      &.is-hover-shadow {
        box-shadow: none;
      }
    }

    :deep(.el-card__body) {
      padding: $spacing-lg;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;

      .el-icon {
        color: $primary-color;
      }
    }

    .card-subtitle {
      font-size: 13px;
      color: $text-secondary;
    }

    .status-tag {
      font-size: 13px;
      padding: 4px 12px;
    }
  }

  .base-info-card {
    .position-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-md;
      border-bottom: 1px dashed $border-color-lighter;

      .position-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
      }

      .category-tag {
        margin-left: 10px;
        color: $primary-color;
        border-color: rgba($primary-color, 0.3);
        background: rgba($primary-color, 0.06);
        font-size: 12px;
      }

      .salary-info {
        display: flex;
        align-items: baseline;
        gap: 6px;

        .salary-num {
          font-size: 24px;
          font-weight: 700;
          color: $danger-color;
        }

        .salary-tip {
          font-size: 13px;
          color: $text-secondary;
        }
      }
    }

    .info-desc {
      :deep(.el-descriptions__cell) {
        padding: 12px 16px;
      }

      .ellipsis-text {
        display: inline-block;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: bottom;
      }
    }
  }

  .content-block {
    padding: 16px 20px;
    background: $bg-color;
    border-radius: $border-radius-small;

    .content-text {
      margin: 0;
      line-height: 2;
      color: $text-regular;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
      font-size: 14px;
      background: transparent;
      border: none;
      padding: 0;

      &.is-empty {
        color: $text-placeholder;
        font-style: italic;
      }
    }
  }

  .resume-card {
    :deep(.el-table) {
      .current-row,
      tr.current-row > td {
        background-color: #E8F3FF !important;
      }
    }

    .ellipsis-text {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }

    .text-placeholder {
      color: $text-placeholder;
    }
  }

  .stats-card {
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-md;
    }

    .stat-item {
      text-align: center;
      padding: $spacing-lg 0;
      background: linear-gradient(135deg, $primary-light 0%, #ffffff 100%);
      border-radius: $border-radius;

      &:nth-child(2) {
        background: linear-gradient(135deg, $success-light 0%, #ffffff 100%);
      }

      &:nth-child(3) {
        background: linear-gradient(135deg, $warning-light 0%, #ffffff 100%);
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 4px;

        &.view {
          color: $primary-color;
        }

        &.apply {
          color: $success-color;
        }

        &.rate {
          color: $warning-color;

          small {
            font-size: 16px;
            font-weight: 500;
            margin-left: 2px;
          }
        }
      }

      .stat-label {
        font-size: 13px;
        color: $text-secondary;
      }
    }
  }

  .action-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;

    .el-button {
      .el-icon {
        margin-right: 4px;
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
}
</style>
