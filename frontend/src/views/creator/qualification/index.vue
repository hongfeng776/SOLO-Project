<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="达人名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入达人名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="资质状态">
          <el-select
            v-model="queryParams.qualificationStatus"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="未提交" :value="0" />
            <el-option label="审核中" :value="1" />
            <el-option label="已通过" :value="2" />
            <el-option label="已拒绝" :value="3" />
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
          <span class="card-title">商家资质审核</span>
          <div class="stats">
            <el-tag type="warning" effect="light" class="stat-tag">
              待审核：<b>{{ pendingCount }}</b>
            </el-tag>
            <el-tag type="success" effect="light" class="stat-tag">
              已通过：<b>{{ approvedCount }}</b>
            </el-tag>
          </div>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        selectable
        show-index
        row-key="id"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Creator[])"
        @paginate="handlePaginate"
      >
        <el-table-column label="达人信息" min-width="220">
          <template #default="{ row }">
            <div class="creator-info">
              <el-avatar :size="48" :src="row.avatar" shape="square">{{ row.name?.charAt(0) }}</el-avatar>
              <div class="info-text">
                <div class="creator-name">{{ row.name }}</div>
                <div class="creator-meta">
                  <span class="meta-item">{{ row.platform }}</span>
                  <span class="meta-item">{{ formatCompact(row.followers) }} 粉丝</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类目" width="120" prop="category" />
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
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.qualificationStatus === 1"
              link
              type="success"
              size="small"
              @click="handleAudit(row, 2)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.qualificationStatus === 1"
              link
              type="danger"
              size="small"
              @click="handleAudit(row, 3)"
            >
              拒绝
            </el-button>
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import { getCreatorList, auditQualification } from '@api/creator'
import { MerchantQualificationStatus } from '@enums/business'
import type { Creator } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'

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

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Creator, { name?: string; qualificationStatus?: number }>({
  fetchApi: getCreatorList,
  defaultParams: { name: '', qualificationStatus: undefined }
})

const { handleSelectionChange } = useSelection<Creator>()

const pendingCount = computed(() => dataList.value.filter((d) => d.qualificationStatus === MerchantQualificationStatus.UNDER_REVIEW).length)
const approvedCount = computed(() => dataList.value.filter((d) => d.qualificationStatus === MerchantQualificationStatus.APPROVED).length)

const handleAudit = async (row: Creator, status: number) => {
  try {
    await auditQualification(row.id, status)
    ElMessage.success(status === 2 ? '资质审核通过' : '已拒绝')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const openDetail = (row: Creator) => {
  console.log('查看详情', row)
  ElMessage.info('详情页开发中')
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

  .stats {
    display: flex;
    gap: 12px;
  }

  .stat-tag {
    :deep(.el-tag__content) {
      b {
        margin-left: 4px;
        font-weight: 600;
      }
    }
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
    font-size: 12px;
    color: $text-secondary;
    display: flex;
    gap: 10px;
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
