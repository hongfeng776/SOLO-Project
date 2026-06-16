<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="达人名称">
          <el-input
            v-model="queryParams.name"
            placeholder="昵称/真实姓名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="平台">
          <el-select
            v-model="queryParams.platform"
            placeholder="全部平台"
            clearable
            style="width: 140px"
          >
            <el-option label="小红书" value="小红书" />
            <el-option label="抖音" value="抖音" />
            <el-option label="微博" value="微博" />
            <el-option label="B站" value="B站" />
            <el-option label="视频号" value="视频号" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-select
            v-model="queryParams.level"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option label="S级达人" :value="5" />
            <el-option label="A级达人" :value="4" />
            <el-option label="B级达人" :value="3" />
            <el-option label="C级达人" :value="2" />
            <el-option label="素人" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="资质状态">
          <el-select
            v-model="queryParams.qualificationStatus"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in qualificationOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">达人列表</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="openForm()">新增达人</el-button>
            <el-button :icon="Download" plain>导出</el-button>
          </div>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
      >
        <el-table-column label="达人信息" min-width="220">
          <template #default="{ row }">
            <div class="creator-info">
              <el-avatar :size="48" :src="row.avatar" shape="square">{{ row.name?.charAt(0) }}</el-avatar>
              <div class="info-text">
                <div class="creator-name">{{ row.name }}</div>
                <div class="creator-meta">
                  <el-tag size="small" type="info" effect="plain">{{ row.platform }}</el-tag>
                  <el-tag size="small" :type="levelColorMap[row.level] || 'info'" effect="light">{{ levelMap[row.level] || '-' }}</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="类目" width="120" />
        <el-table-column label="粉丝量" width="120" align="right">
          <template #default="{ row }">
            <span class="num-text">{{ formatCompact(row.followers) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总获赞" width="120" align="right">
          <template #default="{ row }">
            <span class="num-text">{{ formatCompact(row.likes) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="资质状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="qualificationTagMap[row.qualificationStatus] || 'info'" size="small">
              {{ qualificationOptions[row.qualificationStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" width="160">
          <template #default="{ row }">
            <div class="contact">
              <div>{{ row.contactName || '-' }}</div>
              <div class="phone">{{ row.contactPhone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openForm(row)">编辑</el-button>
            <el-button
              v-if="row.qualificationStatus === 1"
              link
              type="warning"
              size="small"
              @click="handleAudit(row)"
            >
              资质审核
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑达人' : '新增达人'"
      width="640px"
      destroy-on-close
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="昵称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入达人昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台" prop="platform">
              <el-select v-model="formData.platform" placeholder="请选择平台" style="width: 100%">
                <el-option label="小红书" value="小红书" />
                <el-option label="抖音" value="抖音" />
                <el-option label="微博" value="微博" />
                <el-option label="B站" value="B站" />
                <el-option label="视频号" value="视频号" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="头像" prop="avatar">
              <Uploader v-model="formData.avatar" :limit="1" accept-types="image/*" tip="支持 jpg/png 格式，大小不超过 10MB" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类目" prop="category">
              <el-input v-model="formData.category" placeholder="如：美妆、美食、旅行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="粉丝数" prop="followers">
              <el-input-number v-model="formData.followers" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="获赞数" prop="likes">
              <el-input-number v-model="formData.likes" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级" prop="level">
              <el-select v-model="formData.level" placeholder="请选择等级" style="width: 100%">
                <el-option label="S级达人" :value="5" />
                <el-option label="A级达人" :value="4" />
                <el-option label="B级达人" :value="3" />
                <el-option label="C级达人" :value="2" />
                <el-option label="素人" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资质状态" prop="qualificationStatus">
              <el-select v-model="formData.qualificationStatus" placeholder="请选择" style="width: 100%">
                <el-option v-for="(label, value) in qualificationOptions" :key="value" :label="label" :value="Number(value)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="formData.contactName" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import { getCreatorList, createCreator, updateCreator, deleteCreator, auditQualification } from '@api/creator'
import { MerchantQualificationStatus } from '@enums/business'
import type { Creator } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import Uploader from '@components/Uploader/index.vue'

const { formatCompact } = useNumberFormat()

const qualificationOptions: Record<number, string> = {
  [MerchantQualificationStatus.PENDING_SUBMIT]: '未提交',
  [MerchantQualificationStatus.UNDER_REVIEW]: '审核中',
  [MerchantQualificationStatus.APPROVED]: '已通过',
  [MerchantQualificationStatus.REJECTED]: '已拒绝'
}

const qualificationTagMap: Record<number, string> = {
  [MerchantQualificationStatus.PENDING_SUBMIT]: 'info',
  [MerchantQualificationStatus.UNDER_REVIEW]: 'warning',
  [MerchantQualificationStatus.APPROVED]: 'success',
  [MerchantQualificationStatus.REJECTED]: 'danger'
}

const levelMap: Record<number, string> = {
  5: 'S级',
  4: 'A级',
  3: 'B级',
  2: 'C级',
  1: '素人'
}

const levelColorMap: Record<number, string> = {
  5: 'danger',
  4: 'warning',
  3: 'primary',
  2: 'success',
  1: 'info'
}

void formatDateTime

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Creator, { name?: string; platform?: string; level?: number; qualificationStatus?: number }>({
  fetchApi: getCreatorList,
  defaultParams: { name: '', platform: '', level: undefined, qualificationStatus: undefined }
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()

const defaultFormData = (): Partial<Creator> => ({
  name: '',
  avatar: '',
  platform: '小红书',
  followers: 0,
  likes: 0,
  category: '',
  level: 1,
  qualificationStatus: MerchantQualificationStatus.PENDING_SUBMIT,
  contactName: '',
  contactPhone: ''
})

const formData = reactive<Partial<Creator>>(defaultFormData())

const rules: FormRules = {
  name: [{ required: true, message: '请输入达人昵称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }]
}

const openForm = (row?: Creator) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, { ...row })
  } else {
    Object.assign(formData, defaultFormData())
  }
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
}

const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateCreator(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createCreator(formData)
      ElMessage.success('创建成功')
    }
    handleClose()
    fetchData()
  } finally {
    formLoading.value = false
  }
}

const handleAudit = async (row: Creator) => {
  try {
    await auditQualification(row.id, MerchantQualificationStatus.APPROVED)
    ElMessage.success('资质审核通过')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row: Creator) => {
  try {
    await deleteCreator(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .creator-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .info-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .creator-name {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }

  .creator-meta {
    display: flex;
    gap: 6px;
  }

  .num-text {
    font-weight: 600;
    color: $text-primary;
  }

  .contact {
    font-size: 13px;
    color: $text-regular;
    line-height: 1.5;
  }

  .phone {
    color: $text-secondary;
    font-size: 12px;
  }
}
</style>
