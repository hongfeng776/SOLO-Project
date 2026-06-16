<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { ACTIVITY_STATUS, ACTIVITY_TYPE, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getActivityListApi,
  createActivityApi,
  updateActivityApi,
  deleteActivityApi,
} from '@/api/activity'
import type { ActivityItem } from '@/types'
import { formatDate, formatNumber } from '@/utils'

const loading = ref(false)
const listData = ref<ActivityItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: null as number | null,
  status: null as number | null,
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getActivityListApi({ ...queryParams })
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

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()

const formData = reactive<Partial<ActivityItem>>({
  name: '',
  code: '',
  type: 1,
  theme: '',
  image: '',
  banner: '',
  description: '',
  rules: '',
  startTime: '',
  endTime: '',
  totalBudget: 0,
  participantLimit: 0,
  status: 0,
  isHot: 0,
  isTop: 0,
  sortOrder: 0,
  redirectUrl: '',
  remark: '',
})

const formRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入活动编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const openDialog = (mode: 'create' | 'edit' | 'view', row?: ActivityItem) => {
  dialogMode.value = mode
  if (row) {
    Object.assign(formData, row)
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      type: 1,
      theme: '',
      image: '',
      banner: '',
      description: '',
      rules: '',
      startTime: '',
      endTime: '',
      totalBudget: 0,
      participantLimit: 0,
      status: 0,
      isHot: 0,
      isTop: 0,
      sortOrder: 0,
      redirectUrl: '',
      remark: '',
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createActivityApi(formData)
      ElMessage.success('创建成功')
    } else {
      await updateActivityApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: ActivityItem) => {
  await ElMessageBox.confirm('确定要删除该活动吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteActivityApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const tableColumns = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'name', label: '活动名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'code', label: '活动编码', width: 130 },
  {
    prop: 'type',
    label: '活动类型',
    width: 110,
    align: 'center',
    slot: 'type',
  },
  {
    label: '活动周期',
    width: 260,
    align: 'center',
    slot: 'period',
  },
  {
    prop: 'participantCount',
    label: '参与人数',
    width: 100,
    align: 'center',
    slot: 'participant',
  },
  {
    prop: 'pageView',
    label: '浏览量',
    width: 100,
    align: 'center',
    slot: 'pageview',
  },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    slot: 'status',
  },
  { label: '操作', width: 200, fixed: 'right', align: 'center', slot: 'actions' },
]

const activityTypeOptions = computed(() => getEnumOptions(ACTIVITY_TYPE))
const activityStatusOptions = computed(() => getEnumOptions(ACTIVITY_STATUS))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="activity-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="名称/编码/主题"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in activityTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in activityStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-batch-actions="false"
        @create="openDialog('create')"
        @refresh="loadData"
        create-text="新增活动"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :index="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #type="{ row }">
          <el-tag size="small">{{ getEnumLabel(ACTIVITY_TYPE, row.type) }}</el-tag>
        </template>

        <template #period="{ row }">
          <div style="font-size: 12px; line-height: 1.6">
            <div>开始: {{ formatDate(row.startTime, 'YYYY-MM-DD') }}</div>
            <div style="color: #909399">结束: {{ formatDate(row.endTime, 'YYYY-MM-DD') }}</div>
          </div>
        </template>

        <template #participant="{ row }">
          {{ formatNumber(row.participantCount) }}
        </template>

        <template #pageview="{ row }">
          {{ formatNumber(row.pageView) }}
        </template>

        <template #status="{ row }">
          <el-tag
            :type="getEnumItem(ACTIVITY_STATUS, row.status)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(ACTIVITY_STATUS, row.status) }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openDialog('view', row)">查看</el-button>
          <el-button type="primary" link :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
          <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增活动' : dialogMode === 'edit' ? '编辑活动' : '活动详情'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="活动名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入活动名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动编码" prop="code">
              <el-input v-model="formData.code" placeholder="请输入活动编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in activityTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动主题">
              <el-input v-model="formData.theme" placeholder="请输入活动主题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="formData.startTime"
                type="datetime"
                placeholder="选择开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="formData.endTime"
                type="datetime"
                placeholder="选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算金额">
              <el-input-number v-model="formData.totalBudget" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参与人数上限">
              <el-input-number v-model="formData.participantLimit" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="活动状态">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option
                  v-for="item in activityStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="热门标记">
              <el-switch v-model="formData.isHot" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置顶">
              <el-switch v-model="formData.isTop" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动详情">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入活动详情"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动规则">
              <el-input
                v-model="formData.rules"
                type="textarea"
                :rows="3"
                placeholder="请输入活动规则"
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
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.activity-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
