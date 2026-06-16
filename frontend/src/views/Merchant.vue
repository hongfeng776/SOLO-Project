<template>
  <div class="merchant-manage">
    <div class="page-header">
      <h2>商家管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增商家</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="商家名称">
          <el-input v-model="searchForm.name" placeholder="请输入商家名称" clearable />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="searchForm.contact" placeholder="请输入联系人" clearable />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.auditStatus" placeholder="请选择审核状态" clearable>
            <el-option v-for="item in getEnumOptions(AuditStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规等级">
          <el-select v-model="searchForm.violationLevel" placeholder="请选择违规等级" clearable>
            <el-option v-for="item in getEnumOptions(ViolationLevelEnum)" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-table-column prop="name" label="商家名称" />
        <el-table-column prop="contact" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="businessType" label="业务类型">
          <template #default="{ row }">{{ getBusinessType(row.businessType) }}</template>
        </el-table-column>
        <el-table-column prop="violationLevel" label="违规等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnumType(ViolationLevelEnum, row.violationLevel)" size="small">
              {{ getEnumLabel(ViolationLevelEnum, row.violationLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditStatus" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnumType(AuditStatusEnum, row.auditStatus)" size="small">
              {{ getEnumLabel(AuditStatusEnum, row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.auditStatus === 1"
              type="success"
              link
              size="small"
              @click="handleAudit(row, 2)"
            >通过</el-button>
            <el-button
              v-if="row.auditStatus === 1"
              type="danger"
              link
              size="small"
              @click="handleAudit(row, 3)"
            >拒绝</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleViolation(row)">违规标记</el-button>
            <el-button type="info" link size="small" @click="handleViewOrders(row)">关联订单</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="auditDialogVisible" :title="auditTitle" width="450px" destroy-on-close>
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="商家名称">
          <span>{{ auditTargetMerchant?.name }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-tag :type="auditAction === 2 ? 'success' : 'danger'" size="large">
            {{ auditAction === 2 ? '通过' : '拒绝' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核备注" prop="remark">
          <el-input v-model="auditForm.remark" type="textarea" :rows="3" :placeholder="auditAction === 2 ? '请输入审核备注（可选）' : '请输入拒绝原因（必填）'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button :type="auditAction === 2 ? 'success' : 'danger'" @click="handleAuditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="violationDialogVisible" title="违规标记" width="450px" destroy-on-close>
      <el-form ref="violationFormRef" :model="violationForm" :rules="violationRules" label-width="100px">
        <el-form-item label="商家名称">
          <span>{{ violationTargetMerchant?.name }}</span>
        </el-form-item>
        <el-form-item label="违规等级" prop="level">
          <el-select v-model="violationForm.level" placeholder="请选择违规等级" style="width: 100%">
            <el-option v-for="item in getEnumOptions(ViolationLevelEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规原因" prop="reason">
          <el-input v-model="violationForm.reason" type="textarea" :rows="3" placeholder="请输入违规原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="violationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleViolationSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="orderDrawerVisible" title="商家关联订单" size="700px" destroy-on-close>
      <div v-if="currentMerchant" class="merchant-order-info mb-20">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="商家名称">{{ currentMerchant.name }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentMerchant.contact }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-table :data="merchantOrders" border stripe size="small">
        <el-table-column prop="orderNo" label="订单号" min-width="140" />
        <el-table-column prop="productName" label="商品名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)" size="small">{{ getOrderStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import {
  AuditStatusEnum,
  ViolationLevelEnum,
  OrderStatusEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions
} from '@/utils/enums'

const loading = ref(false)
const auditDialogVisible = ref(false)
const violationDialogVisible = ref(false)
const orderDrawerVisible = ref(false)
const auditTargetMerchant = ref(null)
const auditAction = ref(2)
const auditTitle = ref('审核通过')
const violationTargetMerchant = ref(null)
const currentMerchant = ref(null)
const auditFormRef = ref(null)
const violationFormRef = ref(null)

const searchForm = reactive({
  name: '',
  contact: '',
  auditStatus: null,
  violationLevel: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, name: '中国国航旗舰店', contact: '王经理', phone: '13800138000', email: 'airchina@example.com', businessType: 1, auditStatus: 2, status: 1, violationLevel: 0, createTime: '2024-01-01 00:00:00' },
  { id: 2, name: '希尔顿酒店旗舰店', contact: '李经理', phone: '13800138001', email: 'hilton@example.com', businessType: 2, auditStatus: 1, status: 1, violationLevel: 0, createTime: '2024-01-10 10:00:00' },
  { id: 3, name: '神州租车', contact: '张经理', phone: '13800138002', email: 'shenzhou@example.com', businessType: 3, auditStatus: 2, status: 1, violationLevel: 1, createTime: '2024-01-05 09:00:00' }
])

const merchantOrders = ref([])

const merchantOrdersMap = {
  1: [
    { orderNo: 'ORD202401150001', productName: '北京-上海 机票', amount: 1280, status: 2, createTime: '2024-01-15 14:30:00' },
    { orderNo: 'ORD202401150004', productName: '上海-深圳 机票', amount: 980, status: 5, createTime: '2024-01-14 16:00:00' }
  ],
  2: [
    { orderNo: 'ORD202401150002', productName: '希尔顿酒店 豪华房', amount: 888, status: 3, createTime: '2024-01-15 12:15:00' }
  ],
  3: [
    { orderNo: 'ORD202401150003', productName: '租车 丰田凯美瑞', amount: 399, status: 1, createTime: '2024-01-15 10:20:00' }
  ]
}

const auditForm = reactive({ remark: '' })
const auditRules = computed(() => {
  if (auditAction.value === 3) {
    return { remark: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }] }
  }
  return { remark: [] }
})

const violationForm = reactive({ level: null, reason: '' })
const violationRules = {
  level: [{ required: true, message: '请选择违规等级', trigger: 'change' }],
  reason: [{ required: true, message: '请输入违规原因', trigger: 'blur' }]
}

const getBusinessType = (type) => {
  const map = { 1: '机票', 2: '酒店', 3: '租车', 4: '文旅票务' }
  return map[type] || '未知'
}

const getOrderStatusLabel = (status) => getEnumLabel(OrderStatusEnum, status)
const getOrderStatusType = (status) => getEnumType(OrderStatusEnum, status)

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.contact = ''
  searchForm.auditStatus = null
  searchForm.violationLevel = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增商家功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑商家: ${row.name}`)
}

const handleAudit = (row, action) => {
  auditTargetMerchant.value = row
  auditAction.value = action
  auditTitle.value = action === 2 ? '审核通过' : '审核拒绝'
  auditForm.remark = ''
  auditDialogVisible.value = true
}

const handleAuditSubmit = async () => {
  if (!auditFormRef.value) return
  await auditFormRef.value.validate((valid) => {
    if (valid) {
      const actionText = auditAction.value === 2 ? '通过' : '拒绝'
      ElMessage.success(`审核${actionText}成功`)
      auditDialogVisible.value = false
      fetchData()
    }
  })
}

const handleViolation = (row) => {
  violationTargetMerchant.value = row
  violationForm.level = row.violationLevel
  violationForm.reason = ''
  violationDialogVisible.value = true
}

const handleViolationSubmit = async () => {
  if (!violationFormRef.value) return
  await violationFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('违规标记成功')
      violationDialogVisible.value = false
      fetchData()
    }
  })
}

const handleViewOrders = (row) => {
  currentMerchant.value = row
  merchantOrders.value = merchantOrdersMap[row.id] || []
  orderDrawerVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除商家 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    fetchData()
  }).catch(() => {})
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
