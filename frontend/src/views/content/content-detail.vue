<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contentApi } from '@/api';
import { ElMessage } from 'element-plus';
import type { ContentInfo, TagInfo, CategoryInfo } from '@/types';
import { formatThousand } from '@/utils/common';

const route = useRoute();
const router = useRouter();

const content = ref<ContentInfo | null>(null);
const loading = ref(false);
const loadProgress = ref(0);
const progressTimer = ref<number | null>(null);
const pageVisible = ref(false);

const statusOptions = [
  { value: 'draft', label: '草稿', type: 'info' },
  { value: 'pending', label: '待审核', type: 'warning' },
  { value: 'published', label: '已发布', type: 'success' },
  { value: 'offline', label: '已下线', type: 'danger' },
];

const statusTagType = computed(() => {
  const opt = statusOptions.find(o => o.value === content.value?.status);
  return opt?.type || 'info';
});

const statusLabel = computed(() => {
  const opt = statusOptions.find(o => o.value === content.value?.status);
  return opt?.label || '-';
});

const formatDateTime = (val?: string) => (val ? new Date(val).toLocaleString('zh-CN') : '-');

const startProgress = () => {
  loadProgress.value = 0;
  const target = 90;
  const step = 3;
  const interval = 100;
  progressTimer.value = window.setInterval(() => {
    if (loadProgress.value >= target) {
      loadProgress.value = target;
      return;
    }
    const remaining = target - loadProgress.value;
    const increment = Math.max(step, Math.ceil(remaining / 15));
    loadProgress.value = Math.min(target, loadProgress.value + increment);
  }, interval);
};

const stopProgress = (success = true) => {
  if (progressTimer.value !== null) {
    clearInterval(progressTimer.value);
    progressTimer.value = null;
  }
  loadProgress.value = success ? 100 : 0;
  setTimeout(() => {
    pageVisible.value = true;
  }, 220);
};

const fetchDetail = async () => {
  const id = parseInt(route.params.id as string);
  if (!id) {
    ElMessage.error('内容 ID 无效');
    router.back();
    return;
  }
  loading.value = true;
  startProgress();
  try {
    const res = await contentApi.detail(id);
    if (res.code === 0 && res.data) {
      content.value = res.data;
      stopProgress(true);
    } else {
      throw new Error(res.msg || '加载失败');
    }
  } catch (err: any) {
    stopProgress(false);
    ElMessage.error(err?.message || '内容加载失败');
    setTimeout(() => router.back(), 800);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <div class="detail-page">
    <div class="progress-wrap">
      <div class="progress-track">
        <div
          class="progress-bar"
          :style="{ width: loadProgress + '%', opacity: pageVisible ? 0 : 1 }"
        />
      </div>
      <span class="progress-text" v-show="!pageVisible">{{ loadProgress }}%</span>
    </div>

    <transition name="fade-in">
      <div v-if="pageVisible && content" class="detail-content">
        <div class="nav-bar">
          <el-button link type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回列表</span>
          </el-button>
          <div class="nav-title">
            <el-icon><Document /></el-icon>
            <span>内容详情</span>
          </div>
          <el-tag :type="statusTagType" effect="light" size="large" round>
            {{ statusLabel }}
          </el-tag>
        </div>

        <div class="detail-header">
          <h1 class="content-title">{{ content.title }}</h1>
          <div class="meta-row">
            <div class="meta-item">
              <el-icon><Collection /></el-icon>
              <span>{{ content.category?.name || '未分类' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>发布：{{ formatDateTime(content.publishTime) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Calendar /></el-icon>
              <span>创建：{{ formatDateTime(content.createdAt) }}</span>
            </div>
          </div>
          <div class="tag-row" v-if="content.tags && content.tags.length > 0">
            <el-tag
              v-for="tag in content.tags"
              :key="tag.id"
              effect="plain"
              size="default"
              class="content-tag"
              :style="{
                backgroundColor: tag.color + '20',
                borderColor: tag.color,
                color: tag.color,
              }"
            >
              {{ tag.name }}
            </el-tag>
          </div>
          <div class="stat-row">
            <div class="stat-card">
              <div class="stat-icon views">
                <el-icon><View /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatThousand(content.views) }}</div>
                <div class="stat-label">浏览量</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon likes">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatThousand(content.likes ?? 0) }}</div>
                <div class="stat-label">点赞量</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon words">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatThousand(content.content.length) }}</div>
                <div class="stat-label">字数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon id">
                <el-icon><Key /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">#{{ content.id }}</div>
                <div class="stat-label">内容ID</div>
              </div>
            </div>
          </div>
        </div>

        <div class="cover-section" v-if="content.coverImage">
          <el-image
            :src="content.coverImage"
            fit="cover"
            class="cover-img"
            :preview-src-list="[content.coverImage]"
            :preview-teleported="true"
            lazy
          >
            <template #placeholder>
              <div class="cover-placeholder">
                <el-icon class="placeholder-icon" :size="48"><PictureFilled /></el-icon>
                <span>加载中...</span>
              </div>
            </template>
            <template #error>
              <div class="cover-placeholder">
                <el-icon class="placeholder-icon error" :size="48"><Warning /></el-icon>
                <span>封面加载失败</span>
              </div>
            </template>
          </el-image>
        </div>

        <div class="detail-body">
          <div class="body-label">正文内容</div>
          <div class="body-content">
            <p
              v-for="(para, idx) in content.content.split('\n').filter(p => p.trim())"
              :key="idx"
              class="body-paragraph"
            >{{ para }}</p>
          </div>
        </div>

        <div class="detail-footer">
          <span>最后更新：{{ formatDateTime(content.updatedAt) }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fa 0%, #ffffff 200px);
  position: relative;
}

.progress-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #ebeef5;
  padding: 12px 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: background 0.3s ease;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #4096ff, #69b1ff);
  border-radius: 2px;
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.3s ease;
}

.detail-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 40px 80px;
}

.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding: 12px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1d1e20;
  :deep(svg) { color: #1677ff; }
}

.detail-header {
  background: #fff;
  border-radius: 16px;
  padding: 36px 40px;
  margin-bottom: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.35;
  color: #1d1e20;
  margin: 0 0 20px 0;
  letter-spacing: 0.2px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px dashed #ebeef5;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  :deep(svg) { color: #909399; font-size: 14px; }
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.content-tag {
  border-width: 1px;
  border-style: solid;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fafcff 0%, #f4f7ff 100%);
  border: 1px solid #e8edff;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  animation: fadeUp 0.5s ease both;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(22, 119, 255, 0.1);
    border-color: #c6d9ff;
  }
  &:nth-child(1) { animation-delay: 0.05s; }
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.15s; }
  &:nth-child(4) { animation-delay: 0.2s; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
  &.views {
    background: linear-gradient(135deg, #1677ff, #69b1ff);
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
  }
  &.likes {
    background: linear-gradient(135deg, #f5a623, #ffd666);
    box-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);
  }
  &.words {
    background: linear-gradient(135deg, #52c41a, #95de64);
    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
  }
  &.id {
    background: linear-gradient(135deg, #722ed1, #b37feb);
    box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1d1e20;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.cover-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 320px;
  border-radius: 10px;
  display: block;
  cursor: zoom-in;
}

.cover-placeholder {
  width: 100%;
  height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #f5f7fa;
  border-radius: 10px;
  color: #c0c4cc;
  font-size: 14px;
  .placeholder-icon.error { color: #f56c6c; }
}

.detail-body {
  background: #fff;
  border-radius: 16px;
  padding: 36px 40px;
  margin-bottom: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
}

.body-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d1e20;
  padding-bottom: 14px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 64px;
    height: 2px;
    background: linear-gradient(90deg, #1677ff, #69b1ff);
    border-radius: 1px;
  }
}

.body-content {
  font-size: 15px;
  line-height: 1.9;
  color: #303133;
}

.body-paragraph {
  margin: 0 0 18px 0;
  text-align: justify;
  text-justify: inter-ideograph;
  animation: paragraphIn 0.6s ease both;
  @for $i from 1 through 30 {
    &:nth-child(#{$i}) { animation-delay: #{$i * 0.04}s; }
  }
}

@keyframes paragraphIn {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

.detail-footer {
  text-align: right;
  padding: 16px 4px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .detail-content { padding: 20px 16px 60px; }
  .detail-header { padding: 24px 20px; }
  .detail-body { padding: 24px 20px; }
  .content-title { font-size: 24px; }
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .cover-img,
  .cover-placeholder { height: 200px; }
  .progress-wrap { padding: 10px 16px; }
}
</style>
