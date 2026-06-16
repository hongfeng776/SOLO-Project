<template>
  <div class="business-travel-manage">
    <div class="page-header">
      <h2>商旅定制管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增方案</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="方案标题">
          <el-input v-model="searchForm.title" placeholder="请输入方案标题" clearable />
        </el-form-item>
        <el-form-item label="差旅类型">
          <el-select v-model="searchForm.type" placeholder="请选择差旅类型" clearable>
            <el-option v-for="item in getEnumOptions(BusinessTravelTypeEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in getEnumOptions(BusinessTravelStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
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
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="方案标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customer" label="客户" />
        <el-table-column prop="type" label="差旅类型">
          <template #default="{ row }">{{ getEnumLabel(BusinessTravelTypeEnum, row.type) }}</template>
        </el-table-column>
        <el-table-column prop="departureCity" label="出发城市" />
        <el-table-column prop="destinationCity" label="目的城市" />
        <el-table-column prop="budget" label="预算">
          <template #default="{ row }">¥{{ row.budget }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getEnumType(BusinessTravelStatusEnum, row.status)" size="small">
              {{ getEnumLabel(BusinessTravelStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 0" type="success" link size="small" @click="handleConfirm(row)">确认方案</el-button>
            <el-button v-if="row.status === 0 || row.status === 1" type="danger" link size="small" @click="handleCancel(row)">取消</el-button>
            <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleSubmitApproval(row)">提交审批</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="方案标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入方案标题" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer">
              <el-input v-model="form.customer" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="差旅类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择差旅类型" style="width: 100%">
                <el-option v-for="item in getEnumOptions(BusinessTravelTypeEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发城市" prop="departureCity">
              <el-input v-model="form.departureCity" placeholder="请输入出发城市" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的城市" prop="destinationCity">
              <el-input v-model="form.destinationCity" placeholder="请输入目的城市" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算金额" prop="budget">
              <el-input-number v-model="form.budget" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出行人数" prop="travelers">
              <el-input-number v-model="form.travelers" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="出行日期" prop="travelDate">
          <el-date-picker v-model="form.travelDate" type="date" placeholder="请选择出行日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="方案描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入方案描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import {
  BusinessTravelStatusEnum,
  BusinessTravelTypeEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions
} from '@/utils/enums'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增方案')
const formRef = ref(null)

const searchForm = reactive({
  title: '',
  type: null,
  status: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, title: '2024年度商务考察团', customer: '华为技术有限公司', type: 1, departureCity: '深圳', destinationCity: '东京', budget: 158000, status: 0, travelers: 15, createTime: '2024-01-10 09:00:00' },
  { id: 2, title: '团队建设-三亚行', customer: '腾讯科技', type: 2, departureCity: '深圳', destinationCity: '三亚', budget: 88000, status: 1, travelers: 30, createTime: '2024-01-12 14:30:00' },
  { id: 3, title: '行业峰会考察', customer: '阿里巴巴', type: 3, departureCity: '杭州', destinationCity: '新加坡', budget: 220000, status: 3, travelers: 8, createTime: '2024-01-08 11:20:00' }
])

const defaultForm = {
  title: '',
  customer: '',
  type: null,
  departureCity: '',
  destinationCity: '',
  budget: 0,
  travelers: 1,
  travelDate: '',
  description: ''
}

const form = reactive({ ...defaultForm })

const rules = {
  title: [{ required: true, message: '请输入方案标题', trigger: 'blur' }],
  customer: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择差旅类型', trigger: 'change' }],
  departureCity: [{ required: true, message: '请输入出发城市', trigger: 'blur' }],
  destinationCity: [{ required: true, message: '请输入目的城市', trigger: 'blur' }],
  budget: [{ required: true, message: '请输入预算金额', trigger: 'blur' }]
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.type = null
  searchForm.status = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  dialogTitle.value = '新增方案'
  Object.assign(form, defaultForm)
  dialogVisible.value = true
}

const handleDetail = (row) => {
  ElMessage.info(`查看方案详情: ${row.title}`)
}

const handleConfirm = (row) => {
  ElMessageBox.confirm(`确定要确认方案 "${row.title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('确认成功')
    fetchData()
  }).catch(() => {})
}

const handleCancel = (row) => {
  ElMessageBox.confirm(`确定要取消方案 "${row.title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('取消成功')
    fetchData()
  }).catch(() => {})
}

const handleSubmitApproval = (row) => {
  ElMessageBox.confirm(`确定要提交方案 "${row.title}" 审批吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('已提交审批')
    fetchData()
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(dialogTitle.value === '新增方案' ? '创建成功' : '更新成功')
      dialogVisible.value = false
      fetchData()
    }
  })
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    pagination.total = 3
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>
