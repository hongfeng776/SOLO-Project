<template>
  <div class="capacity-type">
    <CommonTable
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="false"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增运力类型
        </el-button>
      </template>

      <el-table-column prop="name" label="类型名称" width="120" />
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="basePrice" label="起步价" width="100" align="right">
        <template #default="{ row }">¥{{ row.basePrice }}</template>
      </el-table-column>
      <el-table-column prop="perKmPrice" label="每公里价格" width="120" align="right">
        <template #default="{ row }">¥{{ row.perKmPrice }}</template>
      </el-table-column>
      <el-table-column prop="perMinPrice" label="每分钟价格" width="120" align="right">
        <template #default="{ row }">¥{{ row.perMinPrice }}</template>
      </el-table-column>
      <el-table-column prop="minCharge" label="最低消费" width="100" align="right">
        <template #default="{ row }">¥{{ row.minCharge }}</template>
      </el-table-column>
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small">编辑</el-button>
          <el-button type="warning" link size="small">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import { getCapacityTypeListApi } from '@/api/capacity'
import type { CapacityType } from '@/types/capacity'

const loading = ref(false)
const tableData = ref<CapacityType[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const getList = async () => {
  loading.value = true
  try {
    const res = await getCapacityTypeListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取运力类型列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleAdd = () => {
  ElMessage.info('新增运力类型功能开发中')
}

onMounted(() => {
  getList()
})
</script>
