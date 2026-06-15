<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/components/ConfirmDialog'
import { getVocabularyDetail, updateVocabularyStatus, removeVocabulary } from '@/api/vocabulary'
import type { VocabularyVO } from '@/types/api'

const route = useRoute()
const router = useRouter()
const { confirm, confirmDelete } = useConfirm()

const loading = ref(true)
const detail = ref<VocabularyVO | null>(null)

const statusOptions = [
  { label: '已上架', value: 1, type: 'success' },
  { label: '待审核', value: 2, type: 'warning' },
  { label: '已下架', value: 0, type: 'info' }
]

const difficultyOptions = [
  { label: '★ 入门', value: 1, type: 'success' },
  { label: '★★ 简单', value: 2, type: 'info' },
  { label: '★★★ 中等', value: 3, type: 'warning' },
  { label: '★★★★ 困难', value: 4, type: 'danger' },
  { label: '★★★★★ 专家', value: 5, type: 'primary' }
]

function getStatusInfo(status: number) {
  return statusOptions.find((o) => o.value === status) || { label: '未知', type: 'info' }
}

function getDifficultyInfo(level: number) {
  return difficultyOptions.find((o) => o.value === level) || { label: '未知', type: 'info' }
}

async function fetchDetail() {
  const id = Number(route.query.id)
  if (!id) {
    ElMessage.error('参数错误')
    router.back()
    return
  }
  try {
    loading.value = true
    const res = await getVocabularyDetail(id)
    if (res.code === 0 && res.data) {
      detail.value = res.data
    } else {
      ElMessage.error(res.message || '获取详情失败')
    }
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(status: number) {
  if (!detail.value || detail.value.status === status) return
  const statusInfo = getStatusInfo(status)
  const ok = await confirm(`确定要将词汇「${detail.value.word}」${statusInfo.label}吗？`, '状态确认')
  if (!ok) return
  await updateVocabularyStatus(detail.value.id, status)
  ElMessage.success(`${statusInfo.label}成功`)
  detail.value.status = status
}

async function handleDelete() {
  if (!detail.value) return
  const ok = await confirmDelete(`确定要删除词汇「${detail.value.word}」吗？此操作不可恢复。`)
  if (!ok) return
  await removeVocabulary([detail.value.id])
  ElMessage.success('删除成功')
  router.back()
}

function handleEdit() {
  if (!detail.value) return
  router.push({
    path: '/biz/vocabulary',
    query: { editId: detail.value.id }
  })
}

function handleBack() {
  router.back()
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="page-container vocabulary-detail-page">
    <div class="detail-header">
      <el-button text @click="handleBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h2 class="detail-title" v-if="detail">词汇详情 - {{ detail.word }}</h2>
    </div>

    <el-skeleton v-if="loading" :rows="10" animated />

    <template v-else-if="detail">
      <el-card shadow="never" class="info-card">
        <div class="card-header">
          <div class="word-section">
            <h1 class="word">{{ detail.word }}</h1>
            <span class="phonetic" v-if="detail.phonetic">{{ detail.phonetic }}</span>
          </div>
          <div class="status-section">
            <el-tag
              :type="getStatusInfo(detail.status).type as any"
              size="large"
              effect="light"
            >
              {{ getStatusInfo(detail.status).label }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <el-form label-width="100px" class="info-form">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="词性">
                <span class="form-value">{{ detail.partOfSpeech || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="难度">
                <el-tag
                  :type="getDifficultyInfo(detail.difficulty).type as any"
                  size="small"
                >
                  {{ getDifficultyInfo(detail.difficulty).label }}
                </el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属词书">
                <span class="form-value highlight">{{ detail.bookName || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建人">
                <span class="form-value">{{ detail.creatorName || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">
                <span class="form-value">{{ formatDate(detail.createTime) }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关联素材">
                <span class="form-value">{{ detail.materialCount || 0 }} 个</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">英文释义</el-divider>
          <div class="definition-box">
            <p>{{ detail.definition }}</p>
          </div>

          <el-divider content-position="left">中文翻译</el-divider>
          <div class="translation-box">
            <p>{{ detail.translation }}</p>
          </div>

          <el-divider content-position="left" v-if="detail.example">例句</el-divider>
          <div class="example-box" v-if="detail.example">
            <p class="example-en">{{ detail.example }}</p>
          </div>
        </el-form>
      </el-card>

      <el-card shadow="never" class="action-card">
        <h3 class="section-title">快捷操作</h3>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="handleEdit">
            <el-icon><Edit /></el-icon>
            编辑词汇
          </el-button>
          <el-dropdown trigger="click" @command="(cmd: number) => handleStatusChange(cmd)">
            <el-button size="large">
              <el-icon><RefreshRight /></el-icon>
              变更状态
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :command="opt.value"
                  :disabled="detail.status === opt.value"
                >
                  <span :class="`text-${opt.type}`">{{ opt.label }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="danger" size="large" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除词汇
          </el-button>
        </div>
      </el-card>
    </template>

    <template v-else>
      <EmptyState description="词汇不存在或已被删除" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.vocabulary-detail-page {
  padding: 16px;

  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .back-btn {
      font-size: 14px;
      color: #909399;

      &:hover {
        color: #409eff;
      }
    }

    .detail-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .info-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 24px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .word-section {
      display: flex;
      align-items: baseline;
      gap: 16px;

      .word {
        font-size: 36px;
        font-weight: 700;
        color: #303133;
        margin: 0;
        letter-spacing: 0.5px;
      }

      .phonetic {
        font-size: 18px;
        color: #606266;
        font-family: 'Lucida Sans Unicode', 'Arial Unicode MS', sans-serif;
      }
    }

    .status-section {
      .el-tag {
        font-size: 14px;
        padding: 8px 16px;
        height: auto;
      }
    }
  }

  .info-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    :deep(.el-form-item__label) {
      color: #909399;
      font-weight: 500;
    }

    .form-value {
      font-size: 14px;
      color: #303133;

      &.highlight {
        color: #409eff;
        font-weight: 500;
      }
    }
  }

  .definition-box,
  .translation-box,
  .example-box {
    padding: 16px 20px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 8px;

    p {
      margin: 0;
      font-size: 15px;
      line-height: 1.8;
      color: #303133;
    }
  }

  .translation-box {
    background: #ecf5ff;

    p {
      color: #409eff;
      font-weight: 500;
    }
  }

  .example-box {
    background: #fdf6ec;

    .example-en {
      color: #e6a23c;
      font-style: italic;
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px;
  }

  .action-card {
    :deep(.el-card__body) {
      padding: 20px 24px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }

  .text-success {
    color: #67c23a;
  }

  .text-warning {
    color: #e6a23c;
  }

  .text-info {
    color: #909399;
  }

  .text-danger {
    color: #f56c6c;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.slide-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}
</style>
