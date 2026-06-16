<template>
  <div class="approval-center">
    <div class="page-header">
      <h2>审批中心</h2>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="审批类型">
          <el-select v-model="searchForm.type" placeholder="请选择审批类型" clearable>
            <el-option label="商家审核" value="merchant" />
            <el-option label="商旅方案" value="business_travel" />
            <el-option label="退款审批" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in getEnumOptions(ApprovalStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="searchForm.applicant" placeholder="请输入申请人" clearable />
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
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待审批" name="pending" />
        <el-tab-pane label="已审批" name="approved" />
        <el-tab-pane label="我发起的" name="mine" />
      </el-tabs>

      <el-table :data="filteredData" v-loading="loading" border stripe>
        <el-table-column prop="approvalNo" label="审批编号" width="160" />
        <el-table-column prop="type" label="审批类型" width="120">
          <template #default="{ row }">{{ typeMap[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="applicant" label="申请人" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnumType(ApprovalStatusEnum, row.status)" size="small">
              {{ getEnumLabel(ApprovalStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="success" link size="small" @click="handleApprove(row)">通过</el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
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

    <el-dialog v-model="actionDialogVisible" :title="actionTitle" width="450px" destroy-on-close>
      <el-form ref="actionFormRef" :model="actionForm" :rules="actionRules" label-width="80px">
        <el-form-item label="审批结果">
          <el-tag :type="actionType === 'approve' ? 'success' : 'danger'" size="large">
            {{ actionType === 'approve' ? '通过' : '拒绝' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="actionForm.remark" type="textarea" :rows="3" :placeholder="actionType === 'approve' ? '请输入审批备注（可选）' : '请输入拒绝原因（必填）'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button :type="actionType === 'approve' ? 'success' : 'danger'" @click="handleActionSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ApprovalStatusEnum, getEnumLabel, getEnumType, getEnumOptions } from '@/utils/enums'

const loading = ref(false)
const activeTab = ref('pending')
const actionDialogVisible = ref(false)
const actionTitle = ref('')
const actionType = ref('approve')
const actionFormRef = ref(null)
const currentApproval = ref(null)

const typeMap = { merchant: '商家审核', business_travel: '商旅方案', refund: '退款审批' }

const searchForm = reactive({
  type: '',
  status: null,
  applicant: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, approvalNo: 'APR202401150001', type: 'merchant', title: '希尔顿酒店旗舰店入驻审核', applicant: '李经理', status: 0, createTime: '2024-01-15 10:00:00' },
  { id: 2, approvalNo: 'APR202401150002', type: 'business_travel', title: '2024年度商务考察团方案审批', applicant: '王专员', status: 0, createTime: '2024-01-15 11:30:00' },
  { id: 3, approvalNo: 'APR202401140001', type: 'refund', title: '订单ORD202401140003退款审批', applicant: '张三', status: 1, createTime: '2024-01-14 16:00:00' },
  { id: 4, approvalNo: 'APR202401130001', type: 'merchant', title: '七天连锁酒店入驻审核', applicant: '赵经理', status: 2, createTime: '2024-01-13 09:20:00' }
])

const filteredData = computed(() => {
  return tableData.value.filter((row) => {
    if (activeTab.value === 'pending') return row.status === 0
    if (activeTab.value === 'approved') return row.status === 1 || row.status === 2
    return true
  })
})

const actionForm = reactive({ remark: '' })

const actionRules = computed(() => {
  if (actionType.value === 'reject') {
    return { remark: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }] }
  }
  return { remark: [] }
})

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.type = ''
  searchForm.status = null
  searchForm.applicant = ''
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleTabChange = () => {
  pagination.page = 1
  fetchData()
}

const handleApprove = (row) => {
  currentApproval.value = row
  actionType.value = 'approve'
  actionTitle.value = '审批通过'
  actionForm.remark = ''
  actionDialogVisible.value = true
}

const handleReject = (row) => {
  currentApproval.value = row
  actionType.value = 'reject'
  actionTitle.value = '审批拒绝'
  actionForm.remark = ''
  actionDialogVisible.value = true
}

const handleDetail = (row) => {
  ElMessage.info(`查看审批详情: ${row.approvalNo}`)
}

const handleActionSubmit = async () => {
  if (!actionFormRef.value) return
  await actionFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(actionType.value === 'approve' ? '审批通过' : '审批拒绝')
      actionDialogVisible.value = false
      fetchData()
    }
  })
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    pagination.total = 4
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>
