<template>
  <div class="coupon-manage">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增优惠券</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="券名称">
          <el-input v-model="searchForm.name" placeholder="请输入券名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option v-for="item in getEnumOptions(CouponTypeEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用品类">
          <el-select v-model="searchForm.category" placeholder="请选择品类" clearable>
            <el-option v-for="item in getEnumOptions(TravelCategoryEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in getEnumOptions(CouponStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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
        <el-table-column prop="name" label="券名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="code" label="券码" width="140" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ getEnumLabel(CouponTypeEnum, row.type) }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="面额" width="100">
          <template #default="{ row }">
            <span v-if="row.type === 2">{{ row.discount }}折</span>
            <span v-else>¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存(总/已用/剩余)" width="160">
          <template #default="{ row }">
            {{ row.totalStock }} / <span style="color: #1890ff">{{ row.usedStock }}</span> / <span :style="{ color: row.totalStock - row.usedStock < 10 ? '#ff4d4f' : '#52c41a' }">{{ row.totalStock - row.usedStock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="validPeriod" label="有效期" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnumType(CouponStatusEnum, row.status)" size="small">
              {{ getEnumLabel(CouponStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" type="success" link size="small" @click="handleIssue(row)">发放</el-button>
            <el-button type="warning" link size="small" @click="handleBatchIssue(row)">批量发放</el-button>
            <el-button v-if="row.status !== 3" type="danger" link size="small" @click="handleRevoke(row)">作废</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="券名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入券名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
                <el-option v-for="item in getEnumOptions(CouponTypeEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用品类" prop="category">
              <el-select v-model="form.category" placeholder="请选择品类" style="width: 100%">
                <el-option v-for="item in getEnumOptions(TravelCategoryEnum)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item v-if="form.type !== 2" label="面额" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
            <el-form-item v-else label="折扣" prop="discount">
              <el-input-number v-model="form.discount" :min="0.1" :max="9.9" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.type === 1" label="满减门槛" prop="minAmount">
              <el-input-number v-model="form.minAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总库存" prop="totalStock">
              <el-input-number v-model="form.totalStock" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每人限领" prop="limitPerUser">
              <el-input-number v-model="form.limitPerUser" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="有效期" prop="validPeriod">
          <el-date-picker
            v-model="form.validPeriod"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueDialogVisible" title="发放优惠券" width="450px" destroy-on-close>
      <el-form ref="issueFormRef" :model="issueForm" :rules="issueRules" label-width="100px">
        <el-form-item label="发放数量" prop="count">
          <el-input-number v-model="issueForm.count" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发放对象" prop="target">
          <el-select v-model="issueForm.target" placeholder="请选择" style="width: 100%">
            <el-option label="全部用户" value="all" />
            <el-option label="新用户" value="new" />
            <el-option label="指定用户" value="specific" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleIssueSubmit">确定发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import {
  CouponTypeEnum,
  CouponStatusEnum,
  TravelCategoryEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions
} from '@/utils/enums'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增优惠券')
const issueDialogVisible = ref(false)
const formRef = ref(null)
const issueFormRef = ref(null)
const currentCoupon = ref(null)

const searchForm = reactive({
  name: '',
  type: null,
  category: null,
  status: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, name: '新春满减券', code: 'CPN20240101001', type: 1, amount: 50, discount: 0, minAmount: 300, totalStock: 1000, usedStock: 650, validPeriod: '2024-01-01 ~ 2024-03-31', status: 1, category: 1 },
  { id: 2, name: '酒店折扣券', code: 'CPN20240101002', type: 2, amount: 0, discount: 8.5, minAmount: 0, totalStock: 500, usedStock: 200, validPeriod: '2024-01-15 ~ 2024-06-30', status: 1, category: 2 },
  { id: 3, name: '立减现金券', code: 'CPN20240101003', type: 3, amount: 30, discount: 0, minAmount: 0, totalStock: 2000, usedStock: 2000, validPeriod: '2024-01-01 ~ 2024-01-31', status: 2, category: 3 }
])

const defaultForm = {
  name: '',
  type: null,
  category: null,
  amount: 0,
  discount: 9.0,
  minAmount: 0,
  totalStock: 100,
  limitPerUser: 1,
  validPeriod: []
}

const form = reactive({ ...defaultForm })

const rules = {
  name: [{ required: true, message: '请输入券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  totalStock: [{ required: true, message: '请输入总库存', trigger: 'blur' }]
}

const issueForm = reactive({
  count: 1,
  target: 'all'
})

const issueRules = {
  count: [{ required: true, message: '请输入发放数量', trigger: 'blur' }],
  target: [{ required: true, message: '请选择发放对象', trigger: 'change' }]
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.type = null
  searchForm.category = null
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  dialogTitle.value = '新增优惠券'
  Object.assign(form, defaultForm)
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑优惠券'
  Object.assign(form, { ...row, validPeriod: [] })
  dialogVisible.value = true
}

const handleIssue = (row) => {
  currentCoupon.value = row
  issueForm.count = 1
  issueForm.target = 'all'
  issueDialogVisible.value = true
}

const handleBatchIssue = (row) => {
  currentCoupon.value = row
  issueForm.count = 100
  issueForm.target = 'all'
  issueDialogVisible.value = true
}

const handleRevoke = (row) => {
  ElMessageBox.confirm(`确定要作废优惠券 "${row.name}" 吗？作废后不可恢复。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('已作废')
    fetchData()
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(dialogTitle.value === '新增优惠券' ? '创建成功' : '更新成功')
      dialogVisible.value = false
      fetchData()
    }
  })
}

const handleIssueSubmit = async () => {
  if (!issueFormRef.value) return
  await issueFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('发放成功')
      issueDialogVisible.value = false
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
