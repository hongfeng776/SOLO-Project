<template>
  <div class="work-detail-page">
    <div class="detail-header">
      <el-button v-ripple @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <div class="header-actions">
        <el-button type="primary" v-ripple @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑作品
        </el-button>
        <el-button :type="workInfo?.status === 1 ? 'warning' : 'success'" v-ripple @click="handleToggleStatus">
          <el-icon><component :is="workInfo?.status === 1 ? 'Bottom' : 'Top'" /></el-icon>
          {{ workInfo?.status === 1 ? '下架' : '上架' }}
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-content">
      <div class="detail-left">
        <el-card class="cover-card" shadow="never">
          <div class="cover-wrapper">
            <img v-if="workInfo?.cover_image" :src="workInfo.cover_image" alt="作品封面" class="cover-image" />
            <div v-else class="cover-placeholder">
              <el-icon :size="80" color="#c0c4cc"><Picture /></el-icon>
              <span>暂无封面</span>
            </div>
          </div>
          <div class="cover-info">
            <h2 class="work-title">{{ workInfo?.title }}</h2>
            <div class="work-meta">
              <el-tag :type="workInfo?.status === 1 ? 'success' : 'info'" size="small" effect="light">
                {{ workInfo?.status === 1 ? '已公开' : '已下架' }}
              </el-tag>
              <span class="category-tag">{{ getCategoryName(workInfo?.category) }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card" shadow="never">
          <div class="stats-grid">
            <div class="stat-item">
              <el-icon :size="24" color="#409EFF"><View /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ workInfo?.view_count || 0 }}</span>
                <span class="stat-label">浏览量</span>
              </div>
            </div>
            <div class="stat-item">
              <el-icon :size="24" color="#F56C6C"><Star /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ workInfo?.like_count || 0 }}</span>
                <span class="stat-label">点赞数</span>
              </div>
            </div>
            <div class="stat-item">
              <el-icon :size="24" color="#67C23A"><ChatDotRound /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ workInfo?.comment_count || 0 }}</span>
                <span class="stat-label">评论数</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="detail-right">
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>基础信息</span>
            </div>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">作品ID</span>
              <span class="info-value">{{ workInfo?.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作者</span>
              <span class="info-value">{{ workInfo?.author_nickname }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作者ID</span>
              <span class="info-value">{{ workInfo?.author_id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作品分类</span>
              <span class="info-value">{{ getCategoryName(workInfo?.category) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ workInfo?.created_at }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ workInfo?.updated_at }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="desc-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>作品描述</span>
            </div>
          </template>
          <div class="description-content">
            {{ workInfo?.description || '暂无描述' }}
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Picture, View, Star, ChatDotRound, InfoFilled, Document } from '@element-plus/icons-vue'
import type { WorkItem } from '@/api/work'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const workInfo = ref<WorkItem | null>(null)
const statusBtnDisabled = ref(false)

const mockData: WorkItem[] = [
  { id: 1, title: '晨曦中的森林', description: '一幅描绘清晨森林的插画作品，运用细腻的笔触和柔和的色彩，展现了大自然在晨光中的宁静与美好。画面中薄雾缭绕，阳光透过树叶洒下斑驳的光影，给人以无限遐想。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%99%A8%E6%9B%A6%E4%B8%AD%E7%9A%84%E6%A3%AE%E6%9E%97%20%E6%8F%92%E7%94%BB%20%E8%87%AA%E7%84%B6%E9%A3%8E%E5%85%89&image_size=landscape_16_9', author_id: 2, author_nickname: '张三', category: 'illustration', status: 1, view_count: 1256, like_count: 328, comment_count: 45, created_at: '2026-06-01 10:00:00', updated_at: '2026-06-01 10:00:00' },
  { id: 2, title: '星际旅行者', description: '科幻题材的短篇漫画，讲述了一位孤独的宇航员在浩瀚宇宙中的冒险故事。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%98%9F%E9%99%85%E6%97%85%E8%A1%8C%E8%80%85%20%E7%A7%91%E5%B9%BB%20%E5%AE%87%E8%88%AA%E5%91%98%20%E6%BC%AB%E7%94%BB&image_size=landscape_16_9', author_id: 3, author_nickname: '李四', category: 'comic', status: 1, view_count: 2341, like_count: 567, comment_count: 89, created_at: '2026-06-02 11:30:00', updated_at: '2026-06-03 09:15:00' },
  { id: 3, title: '像素冒险', description: '复古风格的像素游戏，让玩家重温经典游戏时代的乐趣。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%83%8F%E7%B4%A0%E5%86%92%E9%99%A9%20%E5%A4%8D%E5%8F%A4%E9%A3%8E%E6%A0%BC%20%E6%B8%B8%E6%88%8F&image_size=landscape_16_9', author_id: 4, author_nickname: '王五', category: 'game', status: 0, view_count: 876, like_count: 234, comment_count: 32, created_at: '2026-06-03 09:15:00', updated_at: '2026-06-03 09:15:00' },
  { id: 4, title: '城市夜景', description: '都市夜景摄影作品集，捕捉了城市夜晚的璀璨与繁华。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%9F%8E%E5%B8%82%E5%A4%9C%E6%99%AF%20%E6%91%84%E5%BD%B1%20%E9%83%BD%E5%B8%82%E7%B3%9A%E7%82%8A&image_size=landscape_16_9', author_id: 5, author_nickname: '赵六', category: 'photography', status: 1, view_count: 3456, like_count: 890, comment_count: 156, created_at: '2026-06-04 14:20:00', updated_at: '2026-06-05 16:45:00' },
  { id: 5, title: '梦境守护者', description: '奇幻动画短片，讲述了守护人们梦境的精灵的故事。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%A2%A6%E5%A2%83%E5%AE%88%E6%8A%A4%E8%80%85%20%E5%A5%87%E5%B9%BB%20%E5%8A%A8%E7%94%BB%20%E7%B2%BE%E7%81%B5&image_size=landscape_16_9', author_id: 2, author_nickname: '张三', category: 'animation', status: 1, view_count: 5678, like_count: 1234, comment_count: 234, created_at: '2026-06-05 16:45:00', updated_at: '2026-06-06 08:30:00' },
  { id: 6, title: '玄幻之巅', description: '长篇玄幻小说，讲述了一个少年从平凡到巅峰的修炼之路。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E7%8E%84%E5%B9%BB%E4%B9%8B%E5%B7%85%20%E5%B0%8F%E8%AF%B4%20%E4%BF%AE%E7%82%BC%20%E5%B0%91%E5%B9%B4&image_size=landscape_16_9', author_id: 6, author_nickname: '钱七', category: 'novel', status: 1, view_count: 8901, like_count: 2345, comment_count: 456, created_at: '2026-06-06 08:30:00', updated_at: '2026-06-07 13:10:00' },
  { id: 7, title: '海底世界', description: '深海探索插画系列，展现了神秘的海底生物和景观。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%B5%B7%E5%BA%95%E4%B8%96%E7%95%8C%20%E6%B7%B1%E6%B5%B7%20%E6%8F%92%E7%94%BB%20%E7%94%9F%E7%89%A9&image_size=landscape_16_9', author_id: 7, author_nickname: '孙八', category: 'illustration', status: 0, view_count: 456, like_count: 123, comment_count: 18, created_at: '2026-06-07 13:10:00', updated_at: '2026-06-07 13:10:00' },
  { id: 8, title: '机械纪元', description: '蒸汽朋克风格漫画，描绘了一个机械与人类共存的世界。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%9C%BA%E6%A2%B0%E7%BA%AA%E5%85%83%20%E8%92%B8%E6%B1%BD%E6%9C%8B%E5%85%8B%20%E6%BC%AB%E7%94%BB%20%E6%9C%BA%E6%A2%B0&image_size=landscape_16_9', author_id: 3, author_nickname: '李四', category: 'comic', status: 1, view_count: 2134, like_count: 567, comment_count: 78, created_at: '2026-06-08 17:00:00', updated_at: '2026-06-09 10:25:00' },
  { id: 9, title: '和风物语', description: '日式风格的休闲游戏，让玩家体验日本传统风情。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%92%8C%E9%A3%8E%E7%89%A9%E8%AF%AD%20%E6%97%A5%E5%BC%8F%E9%A3%8E%E6%A0%BC%20%E4%BC%91%E9%97%B2%E6%B8%B8%E6%88%8F&image_size=landscape_16_9', author_id: 8, author_nickname: '周九', category: 'game', status: 1, view_count: 1567, like_count: 345, comment_count: 56, created_at: '2026-06-09 10:25:00', updated_at: '2026-06-10 11:55:00' },
  { id: 10, title: '山水之间', description: '中国风山水画摄影，展现了祖国大好河山的壮丽景色。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%B1%B1%E6%B0%B4%E4%B9%8B%E9%97%B4%20%E4%B8%AD%E5%9B%BD%E9%A3%8E%20%E5%B1%B1%E6%B0%B4%E7%94%BB%20%E6%91%84%E5%BD%B1&image_size=landscape_16_9', author_id: 9, author_nickname: '吴十', category: 'photography', status: 1, view_count: 4321, like_count: 987, comment_count: 123, created_at: '2026-06-10 11:55:00', updated_at: '2026-06-11 09:00:00' },
  { id: 11, title: '魔法学院', description: '校园魔法题材动画，讲述了魔法学院里学生们的成长故事。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%AD%94%E6%B3%95%E5%AD%A6%E9%99%A2%20%E6%A0%A1%E5%9B%AD%20%E5%8A%A8%E7%94%BB%20%E9%AD%94%E6%B3%95&image_size=landscape_16_9', author_id: 5, author_nickname: '赵六', category: 'animation', status: 0, view_count: 234, like_count: 67, comment_count: 12, created_at: '2026-06-11 09:00:00', updated_at: '2026-06-11 09:00:00' },
  { id: 12, title: '末世求生', description: '末日题材网络小说，描绘了人类在末世中的挣扎与希望。', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%9C%AB%E4%B8%96%E6%B1%82%E7%94%9F%20%E6%9C%AB%E6%97%A5%20%E5%B0%8F%E8%AF%B4%20%E4%BA%BA%E7%B1%BB&image_size=landscape_16_9', author_id: 6, author_nickname: '钱七', category: 'novel', status: 1, view_count: 6789, like_count: 1567, comment_count: 345, created_at: '2026-06-12 14:30:00', updated_at: '2026-06-13 16:20:00' }
]

const categoryMap: Record<string, string> = {
  illustration: '插画',
  comic: '漫画',
  animation: '动画',
  game: '游戏',
  novel: '小说',
  photography: '摄影'
}

function getCategoryName(key?: string) {
  if (!key) return '-'
  return categoryMap[key] || key
}

async function loadDetail() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const id = Number(route.params.id)
    workInfo.value = mockData.find(item => item.id === id) || null
    
    if (!workInfo.value) {
      ElMessage.error('作品不存在')
      router.back()
    }
  } catch (error) {
    console.error('Load work detail error:', error)
    ElMessage.error('加载作品详情失败')
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.back()
}

function handleEdit() {
  ElMessage.info('编辑功能待开发')
}

async function handleToggleStatus() {
  if (statusBtnDisabled.value || !workInfo.value) return
  
  try {
    const action = workInfo.value.status === 1 ? '下架' : '上架'
    await ElMessageBox.confirm(`确定要${action}作品 "${workInfo.value.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    statusBtnDisabled.value = true
    await new Promise(resolve => setTimeout(resolve, 500))
    
    workInfo.value.status = workInfo.value.status === 1 ? 0 : 1
    ElMessage.success(`${action}成功`)
    
    setTimeout(() => {
      statusBtnDisabled.value = false
    }, 300)
  } catch {
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="scss">
.work-detail-page {
  min-height: 100%;
  padding: 20px;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .detail-content {
    display: flex;
    gap: 20px;
    min-height: calc(100vh - 120px);
  }

  .detail-left {
    flex: 0 0 380px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .cover-card {
      .cover-wrapper {
        width: 100%;
        height: 240px;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #909399;
        }
      }

      .cover-info {
        .work-title {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 12px 0;
        }

        .work-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .category-tag {
            font-size: 13px;
            color: #606266;
          }
        }
      }
    }

    .stats-card {
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 0;
        border-radius: 8px;
        background: #fafafa;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;

          .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: #303133;
          }

          .stat-label {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .detail-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
    }

    .info-card {
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px 32px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .info-label {
          font-size: 13px;
          color: #909399;
        }

        .info-value {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }
    }

    .desc-card {
      flex: 1;

      .description-content {
        font-size: 14px;
        line-height: 1.8;
        color: #606266;
        white-space: pre-wrap;
      }
    }
  }
}
</style>
