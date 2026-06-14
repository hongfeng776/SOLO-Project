<template>
  <div class="silhouette-detail page-container">
    <div class="detail-header">
      <el-button :icon="ArrowLeft" link @click="goBack">返回列表</el-button>
      <h2 class="detail-title">素材详情</h2>
    </div>

    <el-skeleton v-loading="loading" :rows="10" animated>
      <div v-if="detail" class="detail-content">
        <div class="detail-image-section">
          <div class="image-wrapper">
            <el-image
              :src="getImageUrl(detail.cover)"
              :preview-src-list="[getImageUrl(detail.cover)]"
              fit="contain"
              style="width: 100%; height: 100%"
              preview-teleported
            />
          </div>
          <div class="image-info">
            <el-tag :type="statusTagType" size="large" effect="dark">
              {{ statusText }}
            </el-tag>
          </div>
        </div>

        <div class="detail-info-section">
          <el-descriptions :column="1" border size="default">
            <el-descriptions-item label="素材名称">
              <span class="info-value">{{ detail.name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="素材尺寸">
              <span v-if="detail.width && detail.height" class="info-value">
                {{ detail.width }} × {{ detail.height }} px
              </span>
              <span v-else class="info-muted">未设置</span>
            </el-descriptions-item>
            <el-descriptions-item label="适配场景">
              <span v-if="detail.scene" class="info-value">{{ detail.scene }}</span>
              <span v-else class="info-muted">未设置</span>
            </el-descriptions-item>
            <el-descriptions-item label="素材分类">
              <el-tag v-if="detail.category" type="primary" size="default">{{ detail.category }}</el-tag>
              <span v-else class="info-muted">未分类</span>
            </el-descriptions-item>
            <el-descriptions-item label="使用次数">
              <span class="info-value highlight">{{ detail.use_count }} 次</span>
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              <FormattedDate :value="detail.created_at" format="YYYY-MM-DD HH:mm:ss" />
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              <FormattedDate :value="detail.updated_at" format="YYYY-MM-DD HH:mm:ss" />
            </el-descriptions-item>
          </el-descriptions>

          <div class="detail-actions">
            <el-button type="primary" :icon="Edit" @click="handleEdit">编辑素材</el-button>
            <el-button :type="toggleStatusBtnType" :icon="SwitchButton" @click="handleToggleStatus">
              {{ toggleStatusBtnText }}
            </el-button>
            <el-button type="danger" :icon="Delete" @click="handleDelete">删除素材</el-button>
          </div>
        </div>
      </div>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Edit, Delete, SwitchButton } from '@element-plus/icons-vue';
import { getSilhouetteDetail, deleteSilhouette, updateSilhouetteStatus } from '@/api/silhouette';
import type { SilhouetteMaterialItem } from '@/types';
import { confirmDialog, showSuccess, getImageUrl } from '@/utils';
import FormattedDate from '@/components/FormattedDate.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const detail = ref<SilhouetteMaterialItem | null>(null);

const statusText = computed(() => {
  const map: Record<number, string> = { 0: '已下架', 1: '已上架', 2: '待审核' };
  return map[detail.value?.status ?? -1] || '未知';
});

const statusTagType = computed(() => {
  const map: Record<number, 'success' | 'info' | 'warning' | 'danger'> = {
    0: 'info',
    1: 'success',
    2: 'warning'
  };
  return map[detail.value?.status ?? -1] || 'info';
});

const statusNextMap: Record<number, number> = { 2: 1, 1: 0, 0: 2 };

const statusNextLabelMap: Record<number, string> = { 2: '上架', 1: '下架', 0: '待审核' };

const statusNextBtnTypeMap: Record<number, 'success' | 'warning' | 'primary'> = {
  2: 'success',
  1: 'warning',
  0: 'primary'
};

const toggleStatusBtnText = computed(() => {
  const cur = detail.value?.status ?? 1;
  return statusNextLabelMap[cur] ?? '上架';
});

const toggleStatusBtnType = computed(() => {
  const cur = detail.value?.status ?? 1;
  return statusNextBtnTypeMap[cur] ?? 'success';
});

async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    const res = await getSilhouetteDetail(id);
    detail.value = res;
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

function handleEdit() {
  router.push({ path: '/silhouettes', query: { editId: detail.value?.id } });
}

async function handleToggleStatus() {
  if (!detail.value) return;
  const cur = detail.value.status;
  const newStatus = statusNextMap[cur] ?? 1;
  const label = statusNextLabelMap[cur] ?? '上架';
  const confirmed = await confirmDialog(`确定要将素材「${detail.value.name}」设为「${label}」吗？`, `状态变更确认`);
  if (!confirmed) return;
  try {
    await updateSilhouetteStatus(detail.value.id, newStatus);
    showSuccess(`已设为「${label}」`);
    detail.value.status = newStatus;
  } catch {
    // handled by interceptor
  }
}

async function handleDelete() {
  if (!detail.value) return;
  const confirmed = await confirmDialog(
    `确定要删除素材「${detail.value.name}」吗？关联的图片资源也将被删除。`,
    '删除确认'
  );
  if (!confirmed) return;
  try {
    await deleteSilhouette(detail.value.id);
    showSuccess('删除成功');
    router.push('/silhouettes');
  } catch {
    // handled by interceptor
  }
}

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.silhouette-detail {
  min-height: calc(100vh - 140px);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #1d2129);
  margin: 0;
}

.detail-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.detail-image-section {
  flex-shrink: 0;
  width: 360px;
}

.image-wrapper {
  width: 360px;
  height: 360px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.image-info {
  margin-top: 16px;
  text-align: center;
}

.detail-info-section {
  flex: 1;
  min-width: 0;
}

.info-value {
  font-weight: 500;
  color: var(--color-text-primary, #1d2129);
}

.info-muted {
  color: #909399;
}

.info-value.highlight {
  color: var(--color-primary, #409eff);
  font-weight: 600;
  font-size: 16px;
}

.detail-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

@media (max-width: 900px) {
  .detail-content {
    flex-direction: column;
  }
  .detail-image-section {
    width: 100%;
  }
  .image-wrapper {
    width: 100%;
    height: auto;
    max-height: 360px;
  }
}
</style>
