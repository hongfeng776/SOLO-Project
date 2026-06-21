<template>
  <FinDialog
    v-model:visible="visible"
    title="产品分类调整"
    width="960px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="classData" class="adjust-container">
      <div class="adjust-header" :class="{ 'status-transition': headerTransitioning }">
        <div class="class-code-section">
          <span class="code-label">分类编码</span>
          <span class="code-value">{{ classData.classCode }}</span>
          <el-tag
            :key="classData.classStatus"
            :type="STOCK_CLASS_STATUS_TAG_TYPES[classData.classStatus as StockClassStatus] || 'info'"
            effect="dark"
            size="small"
            class="status-tag-animate"
          >
            {{ STOCK_CLASS_STATUS_LABELS[classData.classStatus as StockClassStatus] || classData.classStatus }}
          </el-tag>
        </div>
        <div class="header-actions">
          <div class="status-change-section">
            <span class="change-label">变更分类状态：</span>
            <el-dropdown trigger="click" @command="handleStatusChange">
              <el-button type="primary" size="small">
                {{ STOCK_CLASS_STATUS_LABELS[classData.classStatus as StockClassStatus] || '当前状态' }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="(label, value) in STOCK_CLASS_STATUS_LABELS"
                    :key="value"
                    :command="value"
                    :disabled="value === classData.classStatus"
                  >
                    <el-tag
                      :type="STOCK_CLASS_STATUS_TAG_TYPES[value as StockClassStatus]"
                      effect="light"
                      size="small"
                      style="margin-right: 8px"
                    >
                      {{ label }}
                    </el-tag>
                    {{ value === classData.classStatus ? '（当前）' : '' }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <el-button type="danger" size="small" plain @click="handleDeleteCheck">
            <el-icon style="margin-right: 4px"><Delete /></el-icon>
            删除分类
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="分类名称">
              {{ classData.className }}
            </el-descriptions-item>
            <el-descriptions-item label="分类层级">
              <el-tag
                :color="STOCK_CLASS_LEVEL_COLORS[classData.classLevel as StockClassLevel]"
                effect="dark"
                size="small"
              >
                {{ STOCK_CLASS_LEVEL_LABELS[classData.classLevel as StockClassLevel] || classData.classLevel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="上级分类">
              {{ classData.parentName || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="关联产品数">
              <span class="count-highlight">{{ classData.productCount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="风险标签">
              {{ classData.riskTag || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="市值区间">
              {{ classData.marketCapRange || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="行业代码">
              {{ classData.industryCode || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="排序号">
              {{ classData.sortOrder }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ classData.description || '--' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="联动信息" name="linkage">
          <el-alert
            title="分类调整后，已自动联动更新所有关联股票的分类标签、筛选维度、统计口径"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
          />
          <el-descriptions :column="2" border>
            <el-descriptions-item label="关联产品数">
              <span class="count-highlight">{{ classData.productCount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="分类状态">
              <el-tag
                :type="STOCK_CLASS_STATUS_TAG_TYPES[classData.classStatus as StockClassStatus] || 'info'"
                effect="light"
              >
                {{ STOCK_CLASS_STATUS_LABELS[classData.classStatus as StockClassStatus] || classData.classStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分类层级">
              {{ STOCK_CLASS_LEVEL_LABELS[classData.classLevel as StockClassLevel] || classData.classLevel }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDateTime(classData.updatedAt || classData.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>
          <div class="linkage-stats">
            <h4>联动统计</h4>
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">分类标签更新</span>
                <span class="stat-value">{{ classData.productCount }} 条</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">筛选维度同步</span>
                <span class="stat-value">{{ classData.productCount }} 条</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">统计口径调整</span>
                <span class="stat-value">{{ classData.productCount }} 条</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="关联产品" name="products">
          <el-table :data="relatedProducts" border size="small" max-height="400">
            <el-table-column prop="stockCode" label="股票代码" width="120">
              <template #default="{ row }">
                <span class="code-text">{{ row.stockCode }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="stockName" label="股票名称" min-width="140" />
            <el-table-column prop="productType" label="产品类型" width="120">
              <template #default="{ row }">
                {{ row.productType || '--' }}
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!relatedProducts.length" class="empty-products">
            暂无关联产品
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, ArrowDown, Delete } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockClassApi from '@/api/stockClassification'
import { formatDateTime } from '@/utils/format'
import {
  STOCK_CLASS_LEVEL_LABELS,
  STOCK_CLASS_LEVEL_COLORS,
  STOCK_CLASS_STATUS_LABELS,
  STOCK_CLASS_STATUS_TAG_TYPES,
} from '@/constants/dictionaries'
import { StockClassLevel, StockClassStatus } from '@/enums'
import type { IStockClassification, IStockClassDeleteCheck } from '@/types/api'

interface Props {
  visible: boolean
  classId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  classId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'refresh': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('basic')
const classData = ref<IStockClassification | null>(null)
const headerTransitioning = ref(false)
const relatedProducts = ref<Array<{ id: number; stockCode: string; stockName: string; productType?: string }>>([])

async function fetchData() {
  if (!props.classId) return
  loading.value = true
  try {
    const res = await stockClassApi.getById(props.classId)
    if (res.code === 0) {
      classData.value = res.data
      relatedProducts.value = []
    }
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(status: string) {
  if (!classData.value || status === classData.value.classStatus) return

  const statusLabel = STOCK_CLASS_STATUS_LABELS[status as StockClassStatus]
  try {
    await ElMessageBox.confirm(
      `确定将分类状态变更为"${statusLabel}"吗？状态变更将联动更新分类标签、筛选维度、统计口径。`,
      '状态变更确认',
      { type: 'warning' },
    )
    const res = await stockClassApi.updateStatus(classData.value.id, status)
    if (res.code === 0) {
      headerTransitioning.value = true
      classData.value = { ...classData.value, classStatus: status }
      ElMessage.success(`分类状态已变更为"${statusLabel}"，分类标签、筛选维度、统计口径已联动更新`)
      emit('refresh')
      nextTick(() => {
        setTimeout(() => {
          headerTransitioning.value = false
        }, 300)
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('状态变更失败')
    }
  }
}

async function handleDeleteCheck() {
  if (!classData.value) return
  try {
    const res = await stockClassApi.checkDelete(classData.value.id)
    if (res.code === 0) {
      const checkData: IStockClassDeleteCheck = res.data
      if (!checkData.canDelete) {
        const productRows = checkData.relatedProducts
          .map(p => `<tr><td style="padding:4px 12px">${p.stockCode}</td><td style="padding:4px 12px">${p.stockName}</td></tr>`)
          .join('')
        await ElMessageBox.alert(
          `<p>该分类下存在 <strong>${checkData.relatedProductCount}</strong> 个关联产品，禁止直接删除。请先将关联产品迁移至其他分类。</p>
          <table style="margin-top:12px;border-collapse:collapse;border:1px solid #ebeef5;width:100%">
            <thead><tr style="background:#f5f7fa"><th style="padding:4px 12px;text-align:left">股票代码</th><th style="padding:4px 12px;text-align:left">股票名称</th></tr></thead>
            <tbody>${productRows}</tbody>
          </table>`,
          '删除校验失败',
          {
            dangerouslyUseHTMLString: true,
            type: 'warning',
            confirmButtonText: '知道了',
          },
        )
      } else {
        await ElMessageBox.confirm(
          '确定要删除该分类吗？删除后不可恢复。',
          '删除确认',
          { type: 'warning' },
        )
        const deleteRes = await stockClassApi.deleteFn(classData.value.id)
        if (deleteRes.code === 0) {
          ElMessage.success('分类删除成功')
          emit('update:visible', false)
          emit('refresh')
        }
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

watch(
  () => [props.visible, props.classId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      activeTab.value = 'basic'
      fetchData()
    }
  },
)
</script>

<style lang="scss" scoped>
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 8px;
  color: #909399;
}

.adjust-container {
  .adjust-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #e4e9f2;

    &.status-transition {
      transition: all 0.3s ease;
    }

    .class-code-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .code-label {
        font-size: 13px;
        color: #909399;
        font-weight: 500;
      }

      .code-value {
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 20px;
        font-weight: 700;
        color: #409EFF;
        letter-spacing: 1px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;

      .status-change-section {
        display: flex;
        align-items: center;
        gap: 8px;

        .change-label {
          font-size: 13px;
          color: #606266;
          font-weight: 500;
        }
      }
    }
  }

  .status-tag-animate {
    animation: statusFadeIn 0.3s ease;
  }

  .code-text {
    font-family: monospace;
    color: #409eff;
  }

  .count-highlight {
    font-weight: 700;
    color: #409EFF;
    font-size: 16px;
  }

  .linkage-stats {
    margin-top: 20px;

    h4 {
      margin-bottom: 12px;
      font-size: 14px;
      color: #303133;
    }

    .stats-row {
      display: flex;
      gap: 24px;

      .stat-item {
        flex: 1;
        padding: 12px 16px;
        background: #f5f7fa;
        border-radius: 6px;
        text-align: center;

        .stat-label {
          display: block;
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: #67C23A;
        }
      }
    }
  }

  .empty-products {
    text-align: center;
    padding: 40px 0;
    color: #909399;
    font-size: 14px;
  }
}

@keyframes statusFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
