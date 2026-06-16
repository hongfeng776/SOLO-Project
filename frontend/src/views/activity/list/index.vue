<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="活动名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入活动名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in activityTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in activityStatusOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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
          <span class="card-title">活动列表</span>
          <el-button type="primary" :icon="Plus" @click="openForm()">创建活动</el-button>
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
        <el-table-column label="活动信息" min-width="280">
          <template #default="{ row }">
            <div class="activity-info">
              <el-image
                v-if="row.coverImage"
                :src="row.coverImage"
                fit="cover"
                style="width: 80px; height: 60px; border-radius: 4px; flex-shrink: 0"
                :preview-src-list="[row.coverImage]"
              />
              <div class="info-text">
                <div class="activity-name">{{ row.name }}</div>
                <div class="activity-desc text-line-2">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="activityTypeColor[row.type] || 'info'" size="small" effect="light">
              {{ activityTypeOptions[row.type] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="280">
          <template #default="{ row }">
            <div class="time-range">
              <div class="time-item">
                <span class="time-label">开始：</span>
                <span>{{ formatDateTime(row.startTime) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">结束：</span>
                <span>{{ formatDateTime(row.endTime) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="参与人数" width="130" align="center">
          <template #default="{ row }">
            <div class="participant">
              <span class="num">{{ row.participantCount }}</span>
              <span v-if="row.maxParticipants > 0" class="total"> / {{ row.maxParticipants }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="activityStatusColor[row.status] || 'info'" size="small">
              {{ activityStatusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑活动' : '创建活动'"
      width="720px"
      destroy-on-close
      @close="handleClose"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入活动名称" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="活动封面" prop="coverImage">
          <Uploader v-model="formData.coverImage" :limit="1" accept-types="image/*" tip="建议尺寸 750×420，支持 jpg/png 格式" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择活动类型" style="width: 300px">
            <el-option v-for="(label, value) in activityTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最大人数" prop="maxParticipants">
          <el-input-number
            v-model="formData.maxParticipants"
            :min="0"
            placeholder="0为不限制"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入活动描述"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getActivityList, createActivity, updateActivity, deleteActivity } from '@api/activity'
import { OrderType } from '@enums/business'
import type { Activity } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import Uploader from '@components/Uploader/index.vue'

const activityTypeOptions: Record<string, string> = {
  [OrderType.PROMOTION]: '推广活动',
  [OrderType.DELIVERY]: '带货活动',
  [OrderType.CUSTOM]: '定制活动'
}

const activityTypeColor: Record<string, string> = {
  [OrderType.PROMOTION]: 'primary',
  [OrderType.DELIVERY]: 'success',
  [OrderType.CUSTOM]: 'warning'
}

const activityStatusOptions: Record<number, string> = {
  0: '未开始',
  1: '进行中',
  2: '已结束',
  3: '已取消'
}

const activityStatusColor: Record<number, string> = {
  0: 'info',
  1: 'success',
  2: 'primary',
  3: 'danger'
}

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Activity, { name?: string; type?: string; status?: number; dateRange?: string[] }>({
  fetchApi: getActivityList,
  defaultParams: { name: '', type: '', status: undefined, dateRange: [] }
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const timeRange = ref<[string, string] | null>(null)

const defaultFormData = (): Partial<Activity> => ({
  name: '',
  description: '',
  coverImage: '',
  type: OrderType.PROMOTION,
  startTime: '',
  endTime: '',
  status: 0,
  participantCount: 0,
  maxParticipants: 0
})

const formData = reactive<Partial<Activity>>(defaultFormData())

const rules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  timeRange: [
    {
      validator: (_r, _v, callback) => {
        if (!timeRange.value || timeRange.value.length < 2) {
          callback(new Error('请选择活动时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

watch(timeRange, (val) => {
  if (val && val.length === 2) {
    formData.startTime = val[0]
    formData.endTime = val[1]
  }
})

const openForm = (row?: Activity) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, { ...row })
    timeRange.value = [formatDateTime(row.startTime), formatDateTime(row.endTime)]
  } else {
    Object.assign(formData, defaultFormData())
    timeRange.value = null
  }
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
  timeRange.value = null
}

const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateActivity(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createActivity(formData)
      ElMessage.success('创建成功')
    }
    handleClose()
    fetchData()
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (row: Activity) => {
  try {
    await deleteActivity(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

// Suppress unused
void computed
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

  .activity-info {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .info-text {
    flex: 1;
    min-width: 0;
  }

  .activity-name {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 4px;
  }

  .activity-desc {
    font-size: 12px;
    color: $text-secondary;
    line-height: 1.5;
  }

  .time-range {
    font-size: 12px;
    color: $text-regular;
    line-height: 1.8;
  }

  .time-label {
    color: $text-secondary;
  }

  .participant {
    font-weight: 600;
    color: $text-primary;

    .num {
      color: $color-primary;
    }

    .total {
      color: $text-secondary;
      font-weight: normal;
    }
  }
}
</style>
