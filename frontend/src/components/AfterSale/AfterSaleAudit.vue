<template>
  <div class="after-sale-audit">
    <h4 class="audit-title">
      <el-icon><Timer /></el-icon>
      审核时间轴
    </h4>
    <el-timeline v-if="timelineData && timelineData.length > 0">
      <el-timeline-item
        v-for="(item, index) in timelineData"
        :key="index"
        :timestamp="item.time"
        placement="top"
        :color="item.color"
        class="refund-timeline-item"
        :class="{ animate: showAnimate }"
      >
        <div class="audit-item">
          <div class="audit-header">
            <el-tag
              :style="{ background: item.color, borderColor: item.color }"
              effect="dark"
              size="small"
            >
              {{ item.actionLabel || item.statusLabel }}
            </el-tag>
            <span class="audit-operator">操作人：{{ item.operator }}</span>
          </div>
          <div v-if="item.remark" class="audit-remark">
            {{ item.remark }}
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无审核记录" :image-size="80" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import { formatRefundTimeline } from '@/utils/refund'

const props = defineProps({
  auditLogs: {
    type: Array,
    default: () => []
  }
})

const showAnimate = ref(false)

const timelineData = computed(() => {
  return formatRefundTimeline(props.auditLogs)
})

onMounted(() => {
  setTimeout(() => {
    showAnimate.value = true
  }, 100)
})
</script>

<style lang="scss" scoped>
.after-sale-audit {
  .audit-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }

  .audit-item {
    .audit-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;

      .audit-operator {
        font-size: 13px;
        color: #909399;
      }
    }

    .audit-remark {
      font-size: 13px;
      color: #606266;
      padding: 6px 10px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }
}
</style>
