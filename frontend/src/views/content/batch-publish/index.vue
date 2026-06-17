<template>
  <div class="page-container">
    <el-row :gutter="16" class="stats-row mb-20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon total">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总批次数</div>
            <div class="stat-value">{{ stats.total }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">成功完成</div>
            <div class="stat-value">{{ stats.completed }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon processing">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">处理中</div>
            <div class="stat-value">{{ stats.processing }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon failed">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">失败批次</div>
            <div class="stat-value">{{ stats.failed }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入批次号或操作人"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
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
          <el-tabs v-model="activeTab" class="status-tabs" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="处理中" name="processing" />
            <el-tab-pane label="已完成" name="completed" />
            <el-tab-pane label="失败" name="failed" />
          </el-tabs>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="openDialog">新建批量发布</el-button>
          </div>
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
        <el-table-column label="批次号" prop="batchNo" width="200">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">
              {{ row.batchNo }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="userName" width="120" />
        <el-table-column label="处理进度" width="260">
          <template #default="{ row }">
            <div class="progress-cell">
              <div class="progress-counts">
                <span class="total">总数: {{ row.totalCount }}</span>
                <span class="success">成功: {{ row.successCount }}</span>
                <span class="fail">失败: {{ row.failCount }}</span>
                <span class="pending">待处理: {{ row.pendingCount }}</span>
              </div>
              <el-progress
                :percentage="getProgressPercent(row)"
                :stroke-width="6"
                :show-text="false"
                style="margin-top: 6px"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status]" size="small">
              {{ statusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">查看详情</el-button>
            <el-button
              link
              type="warning"
              size="small"
              :disabled="row.failCount === 0"
              @click="handleRetryBatch(row)"
            >
              重试失败项
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-drawer
      v-model="detailVisible"
      title="批次详情"
      direction="rtl"
      size="600px"
      :with-header="true"
    >
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="currentDetail">
          <el-descriptions :column="2" border size="small" class="mb-20">
            <el-descriptions-item label="批次号">{{ currentDetail.batchNo }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{ currentDetail.userName }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTagMap[currentDetail.status]" size="small">
                {{ statusOptions[currentDetail.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentDetail.createTime) }}</el-descriptions-item>
          </el-descriptions>

          <el-row :gutter="16" class="detail-stats mb-20">
            <el-col :span="6">
              <div class="detail-stat total">
                <div class="detail-stat-label">总数</div>
                <div class="detail-stat-value">{{ currentDetail.totalCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="detail-stat success">
                <div class="detail-stat-label">成功</div>
                <div class="detail-stat-value">{{ currentDetail.successCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="detail-stat fail">
                <div class="detail-stat-label">失败</div>
                <div class="detail-stat-value">{{ currentDetail.failCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="detail-stat pending">
                <div class="detail-stat-label">待处理</div>
                <div class="detail-stat-value">{{ currentDetail.pendingCount }}</div>
              </div>
            </el-col>
          </el-row>

          <div v-if="failDetailList.length > 0" class="fail-detail-section">
            <div class="section-header">
              <span class="section-title">失败项列表 ({{ failDetailList.length }})</span>
              <div class="section-actions">
                <el-button
                  v-if="currentDetail.failCount > 0"
                  size="small"
                  type="primary"
                  :icon="Refresh"
                  :loading="retrying"
                  @click="handleRetryBatch(currentDetail)"
                >
                  全部重试
                </el-button>
              </div>
            </div>
            <div class="fail-items">
              <div v-for="item in failDetailList" :key="item.index" class="fail-item">
                <div class="fail-item-header">
                  <span class="fail-item-index">第 {{ item.index + 1 }} 条</span>
                  <el-button
                    link
                    type="primary"
                    size="small"
                    :icon="RefreshRight"
                    @click="handleRetrySingle(item.index)"
                  >
                    重试
                  </el-button>
                </div>
                <div class="fail-item-error">{{ item.error }}</div>
              </div>
            </div>
          </div>

          <HtEmpty v-else description="暂无失败项" min-height="200px" />
        </template>

        <div v-if="!currentDetail && !detailLoading" class="data-skeleton">
          <div v-for="i in 8" :key="i" class="skeleton-row"></div>
        </div>
      </div>
    </el-drawer>

    <BatchPublishDialog
      v-model="dialogVisible"
      :creator-level="currentLevel"
      @complete="handlePublishComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Collection,
  CircleCheckFilled,
  CircleCloseFilled,
  Loading,
  RefreshRight
} from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getBatchList, getBatchDetail, retryBatch } from '@/api/note-batch'
import { BatchStatus } from '@enums/business'
import type { NoteBatchRecord, BatchPublishResult } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import HtEmpty from '@components/HtEmpty/index.vue'
import BatchPublishDialog from '@components/BatchPublishDialog/index.vue'

const statusOptions: Record<number, string> = {
  [BatchStatus.PROCESSING]: '处理中',
  [BatchStatus.COMPLETED]: '已完成',
  [BatchStatus.FAILED]: '失败'
}

const statusTagMap: Record<number, string> = {
  [BatchStatus.PROCESSING]: 'warning',
  [BatchStatus.COMPLETED]: 'success',
  [BatchStatus.FAILED]: 'danger'
}

const activeTab = ref('all')
const dialogVisible = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const retrying = ref(false)
const currentLevel = ref(3)
const currentDetail = ref<(NoteBatchRecord & { failDetails?: BatchPublishResult }) | null>(null)

const stats = reactive({
  total: 0,
  completed: 0,
  processing: 0,
  failed: 0
})

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<NoteBatchRecord, { keyword?: string; status?: number }>({
  fetchApi: getBatchList,
  defaultParams: { keyword: '', status: undefined },
  onSuccess: updateStats
})

const failDetailList = computed(() => {
  const details = currentDetail.value?.failDetails
  if (!details) return []
  return details.results.filter((r) => !r.success)
})

function updateStats(res: { list: NoteBatchRecord[]; total: number }) {
  stats.total = res.total
  stats.completed = res.list.filter((r) => r.status === BatchStatus.COMPLETED).length
  stats.processing = res.list.filter((r) => r.status === BatchStatus.PROCESSING).length
  stats.failed = res.list.filter((r) => r.status === BatchStatus.FAILED).length
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'all') {
    queryParams.status = undefined
  } else if (tab === 'processing') {
    queryParams.status = BatchStatus.PROCESSING
  } else if (tab === 'completed') {
    queryParams.status = BatchStatus.COMPLETED
  } else if (tab === 'failed') {
    queryParams.status = BatchStatus.FAILED
  }
  queryParams.page = 1
  fetchData()
}

const getProgressPercent = (row: NoteBatchRecord) => {
  if (row.totalCount === 0) return 0
  return Math.round(((row.successCount + row.failCount) / row.totalCount) * 100)
}

const openDialog = () => {
  dialogVisible.value = true
}

const handlePublishComplete = (_result: BatchPublishResult) => {
  fetchData()
}

const openDetail = async (row: NoteBatchRecord) => {
  detailVisible.value = true
  detailLoading.value = true
  currentDetail.value = null
  try {
    const detail = await getBatchDetail(row.id)
    currentDetail.value = detail
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleRetryBatch = async (row: NoteBatchRecord) => {
  if (row.failCount === 0) {
    ElMessage.info('没有需要重试的失败项')
    return
  }
  retrying.value = true
  try {
    await retryBatch(row.id)
    ElMessage.success('已发起重试')
    fetchData()
    if (detailVisible.value && currentDetail.value?.id === row.id) {
      openDetail(row)
    }
  } catch (error) {
    console.error(error)
  } finally {
    retrying.value = false
  }
}

const handleRetrySingle = (_index: number) => {
  ElMessage.success('已发起重试')
}

watch(detailVisible, (val) => {
  if (!val) {
    currentDetail.value = null
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  .stats-row {
    .stat-card {
      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;

        .el-icon {
          font-size: 24px;
          color: #fff;
        }

        &.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        &.processing {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.failed {
          background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        }
      }

      .stat-content {
        flex: 1;

        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #303133;
        }
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .status-tabs {
    :deep(.el-tabs__item) {
      height: 32px;
      line-height: 32px;
    }
  }

  .progress-cell {
    .progress-counts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;

      .total {
        color: #606266;
      }

      .success {
        color: #67c23a;
      }

      .fail {
        color: #f56c6c;
      }

      .pending {
        color: #909399;
      }
    }
  }

  .mb-20 {
    margin-bottom: 20px;
  }
}

.detail-content {
  padding: 0 4px;

  .detail-stats {
    .detail-stat {
      text-align: center;
      padding: 16px;
      border-radius: 6px;

      .detail-stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 6px;
      }

      .detail-stat-value {
        font-size: 22px;
        font-weight: 700;
      }

      &.total {
        background: #ecf5ff;
        .detail-stat-value { color: #409eff; }
      }

      &.success {
        background: #f0f9eb;
        .detail-stat-value { color: #67c23a; }
      }

      &.fail {
        background: #fef0f0;
        .detail-stat-value { color: #f56c6c; }
      }

      &.pending {
        background: #f4f4f5;
        .detail-stat-value { color: #909399; }
      }
    }
  }

  .fail-detail-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .fail-items {
      max-height: 400px;
      overflow-y: auto;
    }

    .fail-item {
      padding: 12px;
      background: #fef0f0;
      border-radius: 4px;
      margin-bottom: 10px;

      .fail-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;

        .fail-item-index {
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }
      }

      .fail-item-error {
        font-size: 13px;
        color: #f56c6c;
        line-height: 1.5;
      }
    }
  }
}

.data-skeleton {
  .skeleton-row {
    height: 40px;
    background: linear-gradient(90deg, #f0f2f5 25%, #e6e8eb 37%, #f0f2f5 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  @keyframes skeleton-loading {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
}
</style>
