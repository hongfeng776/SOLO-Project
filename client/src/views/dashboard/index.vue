<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in statsCards" :key="card.title">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">{{ card.title }}</p>
              <p class="stat-value">{{ card.value }}</p>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: card.color }">
              <el-icon :size="28" color="#fff">
                <component :is="card.icon" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" style="margin-top: 20px">
      <template #header>
        <span>欢迎使用</span>
      </template>
      <div class="welcome-content">
        <h2>您好，{{ userInfo?.nickname || userInfo?.username }}！</h2>
        <p>欢迎来到影集视觉素材管理平台，您可以在这里管理视觉素材、进行标注作业等。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { formatDate } from '@/utils';
import {
  Picture,
  Folder,
  User,
  Document
} from '@element-plus/icons-vue';

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

const statsCards = [
  { title: '素材总数', value: '0', icon: 'Picture', color: '#409EFF' },
  { title: '项目数量', value: '0', icon: 'Folder', color: '#67C23A' },
  { title: '用户数量', value: '0', icon: 'User', color: '#E6A23C' },
  { title: '标注任务', value: '0', icon: 'Document', color: '#F56C6C' }
];
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-card .welcome-content {
  text-align: center;
  padding: 20px 0;
}

.welcome-card h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 12px;
}

.welcome-card p {
  color: #909399;
  font-size: 14px;
}
</style>
