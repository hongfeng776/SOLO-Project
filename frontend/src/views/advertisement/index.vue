<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { AD_STATUS, AD_TYPE, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getAdListApi,
  createAdApi,
  updateAdApi,
  deleteAdApi,
  batchDeleteAdsApi,
} from '@/api/advertisement'
import type { AdvertisementItem } from '@/types'
import { formatDate, formatNumber } from '@/utils'

const loading = ref(false)
const listData = ref<AdvertisementItem[]>([])
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
    const result = await getAdListApi({ ...queryParams })
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

const formData = reactive<Partial<AdvertisementItem>>({
  name: '',
  code: '',
  type: 1,
  position: '',
  title: '',
  subtitle: '',
  image: '',
  redirectUrl: '',
  redirectType: 1,
  advertiserName: '',
  startTime: '',
  endTime: '',
  budgetAmount: 0,
  status: 0,
  sortOrder: 0,
  remark: '',
})

const formRules = {
  name: [{ required: true, message: '请输入广告名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入广告编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择广告类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const openDialog = (mode: 'create' | 'edit' | 'view', row?: AdvertisementItem) => {
  dialogMode.value = mode
  if (row) {
    Object.assign(formData, row)
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      type: 1,
      position: '',
      title: '',
      subtitle: '',
      image: '',
      redirectUrl: '',
      redirectType: 1,
      advertiserName: '',
      startTime: '',
      endTime: '',
      budgetAmount: 0,
      status: 0,
      sortOrder: 0,
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
      await createAdApi(formData)
      ElMessage.success('创建成功')
    } else {
      await updateAdApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: AdvertisementItem) => {
  await ElMessageBox.confirm('确定要删除该广告吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteAdApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const selectedRows = ref<AdvertisementItem[]>([])
const handleSelectionChange = (rows: AdvertisementItem[]) => {
  selectedRows.value = rows
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条广告吗？`, '提示', { type: 'warning' })
  loading.value = true
  try {
    await batchDeleteAdsApi(selectedRows.value.map((r) => r.id))
    ElMessage.success('批量删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'name', label: '广告名称', minWidth: 160, showOverflowTooltip: true },
  { prop: 'code', label: '广告编码', width: 130 },
  {
    prop: 'type',
    label: '广告类型',
    width: 120,
    align: 'center',
    slot: 'type',
  },
  { prop: 'advertiserName', label: '广告主', minWidth: 140, showOverflowTooltip: true },
  {
    label: '投放周期',
    width: 260,
    align: 'center',
    slot: 'period',
  },
  {
    prop: 'impressionCount',
    label: '曝光量',
    width: 100,
    align: 'center',
    slot: 'impression',
  },
  {
    prop: 'clickCount',
    label: '点击量',
    width: 100,
    align: 'center',
    slot: 'click',
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

const adTypeOptions = computed(() => getEnumOptions(AD_TYPE))
const adStatusOptions = computed(() => getEnumOptions(AD_STATUS))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="ad-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="名称/编码/标题/广告主"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="广告类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in adTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="投放状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in adStatusOptions"
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
        :show-batch-actions="true"
        :selected-count="selectedRows.length"
        @create="openDialog('create')"
        @refresh="loadData"
        @batch-delete="handleBatchDelete"
        create-text="新增广告"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :selection="true"
        :index="true"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #type="{ row }">
          <el-tag size="small">{{ getEnumLabel(AD_TYPE, row.type) }}</el-tag>
        </template>

        <template #period="{ row }">
          <div style="font-size: 12px; line-height: 1.6">
            <div>开始: {{ formatDate(row.startTime, 'YYYY-MM-DD') }}</div>
            <div style="color: #909399">结束: {{ formatDate(row.endTime, 'YYYY-MM-DD') }}</div>
          </div>
        </template>

        <template #impression="{ row }">
          {{ formatNumber(row.impressionCount) }}
        </template>

        <template #click="{ row }">
          {{ formatNumber(row.clickCount) }}
        </template>

        <template #status="{ row }">
          <el-tag
            :type="getEnumItem(AD_STATUS, row.status)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(AD_STATUS, row.status) }}
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
      :title="dialogMode === 'create' ? '新增广告' : dialogMode === 'edit' ? '编辑广告' : '广告详情'"
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
            <el-form-item label="广告名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入广告名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告编码" prop="code">
              <el-input v-model="formData.code" placeholder="请输入广告编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in adTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="投放位置">
              <el-input v-model="formData.position" placeholder="请输入投放位置" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告标题">
              <el-input v-model="formData.title" placeholder="请输入广告标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="副标题">
              <el-input v-model="formData.subtitle" placeholder="请输入副标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告主">
              <el-input v-model="formData.advertiserName" placeholder="请输入广告主名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跳转类型">
              <el-select v-model="formData.redirectType" style="width: 100%">
                <el-option label="外链" :value="1" />
                <el-option label="站内内容" :value="2" />
                <el-option label="小程序" :value="3" />
                <el-option label="应用下载" :value="4" />
              </el-select>
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
              <el-input-number v-model="formData.budgetAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告状态">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option
                  v-for="item in adStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="图片URL">
              <el-input v-model="formData.image" placeholder="请输入广告图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="跳转链接">
              <el-input v-model="formData.redirectUrl" placeholder="请输入跳转链接" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="备注信息" maxlength="500" show-word-limit />
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
.ad-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
