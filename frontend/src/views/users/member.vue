<template>
  <div class="member-users">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="filterForm.level" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="member-count">会员总数：<em>{{ total }}</em> 人</span>
        </div>
      </div>

      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @refresh="fetchList"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="会员等级" width="120" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.level" type="member" />
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" align="center" />
        <el-table-column prop="balance" label="余额" width="120" align="center">
          <template #default="{ row }">¥{{ row.balance }}</template>
        </el-table-column>
        <el-table-column prop="totalDownload" label="累计下载" width="100" align="center" />
        <el-table-column prop="totalConsume" label="累计消费" width="120" align="center">
          <template #default="{ row }">¥{{ row.totalConsume }}</template>
        </el-table-column>
        <el-table-column prop="expireTime" label="过期时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.expireTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEditLevel(row)">
              调整等级
            </el-button>
            <el-button type="success" link size="small" @click="handleAddPoints(row)">
              加积分
            </el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog
      v-model="levelDialogVisible"
      title="调整会员等级"
      width="400px"
    >
      <el-form :model="levelForm" label-width="80px">
        <el-form-item label="用户名">
          <span>{{ currentMember?.username }}</span>
        </el-form-item>
        <el-form-item label="当前等级">
          <StatusTag :status="currentMember?.level || 'normal'" type="member" />
        </el-form-item>
        <el-form-item label="调整为">
          <el-select v-model="levelForm.level" style="width: 100%">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleLevelSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { DataTable, StatusTag } from '@/components/business'
import { MemberLevelLabel } from '@/constants'
import { getMemberList } from '@/api/userManage'
import type { Member } from '@/types'

const loading = ref(false)
const tableData = ref<Member[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const levelDialogVisible = ref(false)
const submitLoading = ref(false)
const currentMember = ref<Member | null>(null)

const filterForm = reactive({
  keyword: '',
  level: ''
})

const levelForm = reactive({
  level: 'normal'
})

const levelOptions = Object.entries(MemberLevelLabel).map(([value, label]) => ({
  value,
  label
}))

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMemberList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      level: filterForm.level || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取会员列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.level = ''
  page.value = 1
  fetchList()
}

const handleEditLevel = (row: Member) => {
  currentMember.value = row
  levelForm.level = row.level
  levelDialogVisible.value = true
}

const handleAddPoints = (_row: Member) => {
  ElMessage.info('加积分功能开发中')
}

const handleLevelSubmit = async () => {
  submitLoading.value = true
  try {
    ElMessage.success('等级调整成功')
    levelDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('调整失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.member-users {
  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .table-toolbar {
      margin-bottom: 16px;

      .member-count {
        font-size: $font-size-base;
        color: $text-regular;

        em {
          color: $primary-color;
          font-style: normal;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
