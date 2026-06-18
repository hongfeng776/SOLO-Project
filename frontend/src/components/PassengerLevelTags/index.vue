<template>
  <div class="passenger-level-tags">
    <div class="level-header">
      <div class="level-badge-section">
        <div class="level-badge" :class="{ 'diamond-level': passenger.level === 5 }" :style="{ background: getLevelGradient(passenger.level) }">
          <el-icon class="badge-icon"><Medal /></el-icon>
          <span class="badge-text">{{ PassengerLevelMap[passenger.level] || '未知' }}</span>
        </div>
        <div class="level-info">
          <div class="level-name">{{ PassengerLevelMap[passenger.level] || '普通' }}会员</div>
          <div class="level-score">当前积分：{{ passenger.levelScore || 0 }} 分</div>
        </div>
      </div>

      <div class="reputation-section">
        <div class="reputation-gauge">
          <svg viewBox="0 0 120 120" class="gauge-svg">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#ebeef5" stroke-width="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              :stroke="getReputationColor(passenger.reputationScore)"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="getStrokeDasharray(passenger.reputationScore)"
              stroke-dashoffset="78.5"
              transform="rotate(-90 60 60)"
              class="gauge-progress"
            />
            <text x="60" y="55" text-anchor="middle" class="gauge-score">{{ passenger.reputationScore || 0 }}</text>
            <text x="60" y="75" text-anchor="middle" class="gauge-label">信誉分</text>
          </svg>
        </div>
        <div class="reputation-level">{{ getReputationLevel(passenger.reputationScore) }}</div>
      </div>
    </div>

    <el-divider />

    <div class="level-progress-section">
      <div class="progress-header">
        <span>升级进度</span>
        <span class="progress-text">{{ passenger.levelScore || 0 }} / {{ getNextLevelScore(passenger.level) }} 分</span>
      </div>
      <el-progress
        :percentage="getLevelProgress(passenger.levelScore, passenger.level)"
        :color="PassengerLevelColorMap[passenger.level] || '#909399'"
        :stroke-width="12"
      />
      <div class="progress-tip" v-if="passenger.level < 5">
        再获取 {{ getNextLevelScore(passenger.level) - (passenger.levelScore || 0) }} 积分即可升级为
        <el-tag :type="getTagType(PassengerLevelColorMap[passenger.level + 1])" size="small">
          {{ PassengerLevelMap[passenger.level + 1] }}
        </el-tag>
      </div>
      <div class="progress-tip text-success" v-else>
        <el-icon><Crown /></el-icon>
        已达最高等级，尊享专属特权
      </div>
    </div>

    <el-divider />

    <div class="tags-section">
      <div class="section-header">
        <span class="section-title">
          <el-icon><PriceTag /></el-icon>
          用户标签
        </span>
        <el-popover
          v-model:visible="tagEditorVisible"
          placement="bottom"
          width="300"
          trigger="click"
        >
          <template #reference>
            <el-button type="primary" size="small" :loading="updatingTags">
              <el-icon><Edit /></el-icon>
              编辑标签
            </el-button>
          </template>
          <div class="tag-editor">
            <div class="editor-title">选择标签</div>
            <div class="tag-options">
              <el-tag
                v-for="(label, key) in PassengerTagTypeMap"
                :key="key"
                :type="getTagType(PassengerTagTypeColorMap[key])"
                :effect="editingTags.includes(key) ? 'dark' : 'plain'"
                class="tag-option"
                @click="toggleTag(key)"
              >
                {{ label }}
              </el-tag>
            </div>
            <div class="editor-actions">
              <el-button size="small" @click="tagEditorVisible = false">取消</el-button>
              <el-button size="small" type="primary" @click="handleUpdateTags" :loading="updatingTags">
                确定
              </el-button>
            </div>
          </div>
        </el-popover>
      </div>
      <div class="tags-list">
        <el-tooltip
          v-for="(tag, index) in displayTags"
          :key="index"
          content="点击移除标签"
          placement="top"
        >
          <el-tag
            :type="getTagType(PassengerTagTypeColorMap[tag])"
            size="small"
            closable
            @close="handleRemoveTag(tag)"
          >
            {{ PassengerTagTypeMap[tag] || tag }}
          </el-tag>
        </el-tooltip>
        <el-tag v-if="displayTags.length === 0" type="info" size="small">暂无标签</el-tag>
      </div>
    </div>

    <el-divider />

    <div class="benefits-section">
      <div class="section-header">
        <span class="section-title">
          <el-icon><Gift /></el-icon>
          等级权益
        </span>
        <el-button type="primary" size="small" :loading="calculatingLevel" @click="handleCalculateLevel">
          <el-icon><Refresh /></el-icon>
          重新计算等级
        </el-button>
      </div>
      <div class="benefits-grid">
        <div class="benefit-card" v-for="benefit in levelBenefits" :key="benefit.title">
          <div class="benefit-icon" :style="{ color: PassengerLevelColorMap[passenger.level] }">
            <el-icon><component :is="benefit.icon" /></el-icon>
          </div>
          <div class="benefit-info">
            <div class="benefit-title">{{ benefit.title }}</div>
            <div class="benefit-value">{{ benefit.value }}</div>
            <div class="benefit-desc">{{ benefit.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="level-history-section">
      <div class="section-header">
        <span class="section-title">
          <el-icon><Clock /></el-icon>
          等级变更记录
        </span>
      </div>
      <div v-if="loadingHistory" class="loading-container">
        <el-icon class="is-loading" :size="20"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <el-timeline v-else-if="levelHistory.length > 0">
        <el-timeline-item
          v-for="log in levelHistory"
          :key="log.id"
          :timestamp="formatDate(log.createTime)"
          :color="PassengerLevelColorMap[log.afterData?.level || log.afterLevel] || '#909399'"
        >
          <div class="history-card">
            <div class="history-operation">
              <el-tag size="small" :type="getTagType(AuditOperationTypeColorMap[AuditOperationType.LEVEL_CHANGE])">
                {{ AuditOperationTypeMap[AuditOperationType.LEVEL_CHANGE] }}
              </el-tag>
              <span class="history-operator">{{ log.operatorName || '系统' }}</span>
            </div>
            <div class="history-level-change">
              <el-tag
                :type="getTagType(PassengerLevelColorMap[log.beforeData?.level || log.beforeLevel])"
                size="small"
              >
                {{ PassengerLevelMap[log.beforeData?.level || log.beforeLevel] || '未知' }}
              </el-tag>
              <el-icon class="arrow"><Right /></el-icon>
              <el-tag
                :type="getTagType(PassengerLevelColorMap[log.afterData?.level || log.afterLevel])"
                size="small"
                effect="dark"
              >
                {{ PassengerLevelMap[log.afterData?.level || log.afterLevel] || '未知' }}
              </el-tag>
            </div>
            <div v-if="log.changeReason" class="history-reason">
              <span class="reason-label">变更原因：</span>
              <span>{{ log.changeReason }}</span>
            </div>
            <div v-if="log.afterData?.benefitsChanged || log.benefitsChanged" class="benefits-changed">
              <span class="benefits-label">权益变更：</span>
              <el-tag
                v-for="(benefit, idx) in (log.afterData?.benefitsChanged || log.benefitsChanged)"
                :key="idx"
                type="success"
                size="small"
                effect="plain"
              >
                {{ benefit }}
              </el-tag>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无等级变更记录" :image-size="80" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Medal,
  Crown,
  PriceTag,
  Edit,
  Gift,
  Refresh,
  Clock,
  Loading,
  Right,
  Scissor,
  Lightning,
  Headset
} from '@element-plus/icons-vue'
import { calculateLevelApi, updateTagsApi, getAuditLogsApi } from '@/api/passenger'
import {
  PassengerLevel,
  PassengerLevelMap,
  PassengerLevelColorMap,
  PassengerTagTypeMap,
  PassengerTagTypeColorMap,
  AuditOperationType,
  AuditOperationTypeMap,
  AuditOperationTypeColorMap
} from '@/enums/passenger'
import { formatDate } from '@/utils/format'
import type { Passenger, PassengerAuditLog, LevelCalculateResult } from '@/types/passenger'

interface Props {
  passenger: Passenger
}

const props = defineProps<Props>()

const emit = defineEmits(['level-updated', 'tags-updated'])

const calculatingLevel = ref(false)
const updatingTags = ref(false)
const loadingHistory = ref(false)
const tagEditorVisible = ref(false)
const editingTags = ref<string[]>([])
const levelHistory = ref<PassengerAuditLog[]>([])

const levelScoreThresholds: Record<number, number> = {
  [PassengerLevel.NORMAL]: 0,
  [PassengerLevel.SILVER]: 100,
  [PassengerLevel.GOLD]: 500,
  [PassengerLevel.PLATINUM]: 2000,
  [PassengerLevel.DIAMOND]: 5000
}

const displayTags = computed(() => {
  return props.passenger.tags || []
})

const levelBenefits = computed(() => {
  const level = props.passenger.level || PassengerLevel.NORMAL
  const benefitsConfig: Record<number, Array<{ icon: string; title: string; value: string; description: string }>> = {
    [PassengerLevel.NORMAL]: [
      { icon: 'Scissor', title: '优惠券权益', value: '9.5折优惠', description: '普通用户专属折扣' },
      { icon: 'Lightning', title: '下单优先级', value: '普通队列', description: '标准派单顺序' },
      { icon: 'Headset', title: '客服响应', value: '5分钟内', description: '人工客服响应时间' }
    ],
    [PassengerLevel.SILVER]: [
      { icon: 'Scissor', title: '优惠券权益', value: '9折优惠 + 专属券', description: '银卡会员额外优惠券' },
      { icon: 'Lightning', title: '下单优先级', value: '优先1.2x', description: '派单权重提升20%' },
      { icon: 'Headset', title: '客服响应', value: '3分钟内', description: 'VIP客服快速响应' }
    ],
    [PassengerLevel.GOLD]: [
      { icon: 'Scissor', title: '优惠券权益', value: '8.5折 + 生日礼包', description: '金卡专属生日福利' },
      { icon: 'Lightning', title: '下单优先级', value: '优先1.5x', description: '派单权重提升50%' },
      { icon: 'Headset', title: '客服响应', value: '2分钟内', description: '专属客服经理' }
    ],
    [PassengerLevel.PLATINUM]: [
      { icon: 'Scissor', title: '优惠券权益', value: '8折 + 月度礼包', description: '铂金会员每月福利' },
      { icon: 'Lightning', title: '下单优先级', value: '优先2x', description: '派单权重提升100%' },
      { icon: 'Headset', title: '客服响应', value: '1分钟内', description: '7x24小时专属客服' }
    ],
    [PassengerLevel.DIAMOND]: [
      { icon: 'Scissor', title: '优惠券权益', value: '7.5折 + 年度旅行礼包', description: '钻石至尊专属礼遇' },
      { icon: 'Lightning', title: '下单优先级', value: '优先3x + 预约保障', description: '最高优先级派单' },
      { icon: 'Headset', title: '客服响应', value: '30秒内', description: '1对1专属管家服务' }
    ]
  }
  return benefitsConfig[level] || benefitsConfig[PassengerLevel.NORMAL]
})

const getTagType = (color: string) => {
  if (!color) return 'info'
  if (color === '#67c23a') return 'success'
  if (color === '#f56c6c') return 'danger'
  if (color === '#e6a23c') return 'warning'
  if (color === '#409eff') return 'primary'
  if (color === '#26c6da') return 'success'
  if (color === '#c0c4cc') return 'info'
  if (color === '#ff9800') return 'warning'
  return 'info'
}

const getLevelGradient = (level: number) => {
  const color = PassengerLevelColorMap[level] || '#909399'
  if (level === PassengerLevel.DIAMOND) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
  }
  return `linear-gradient(135deg, ${color} 0%, ${lightenColor(color, 20)} 100%)`
}

const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
  const B = Math.min(255, (num & 0x0000ff) + amt)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

const getNextLevelScore = (level: number) => {
  if (level >= 5) return levelScoreThresholds[5]
  return levelScoreThresholds[level + 1] || 0
}

const getLevelProgress = (currentScore: number | undefined, level: number) => {
  if (!currentScore || level >= 5) return 100
  const currentLevelScore = levelScoreThresholds[level] || 0
  const nextLevelScore = levelScoreThresholds[level + 1] || 0
  if (nextLevelScore <= currentLevelScore) return 100
  const progress = ((currentScore - currentLevelScore) / (nextLevelScore - currentLevelScore)) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

const getReputationColor = (score: number | undefined) => {
  const s = score || 0
  if (s >= 90) return '#67c23a'
  if (s >= 70) return '#409eff'
  if (s >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getReputationLevel = (score: number | undefined) => {
  const s = score || 0
  if (s >= 90) return '优秀'
  if (s >= 80) return '良好'
  if (s >= 70) return '中等'
  if (s >= 60) return '及格'
  return '较差'
}

const getStrokeDasharray = (score: number | undefined) => {
  const s = Math.min(100, Math.max(0, score || 0))
  const circumference = 314
  const dashLength = (s / 100) * circumference
  return `${dashLength} ${circumference}`
}

const toggleTag = (tag: string) => {
  const index = editingTags.value.indexOf(tag)
  if (index > -1) {
    editingTags.value.splice(index, 1)
  } else {
    editingTags.value.push(tag)
  }
}

const handleRemoveTag = async (tag: string) => {
  const newTags = displayTags.value.filter(t => t !== tag)
  updatingTags.value = true
  try {
    await updateTagsApi(props.passenger.id, newTags)
    ElMessage.success('标签移除成功')
    emit('tags-updated', newTags)
  } catch (error: any) {
    ElMessage.error(error.message || '标签移除失败')
  } finally {
    updatingTags.value = false
  }
}

const handleUpdateTags = async () => {
  updatingTags.value = true
  try {
    await updateTagsApi(props.passenger.id, editingTags.value)
    ElMessage.success('标签更新成功')
    tagEditorVisible.value = false
    emit('tags-updated', editingTags.value)
  } catch (error: any) {
    ElMessage.error(error.message || '标签更新失败')
  } finally {
    updatingTags.value = false
  }
}

const handleCalculateLevel = async () => {
  calculatingLevel.value = true
  try {
    const res = await calculateLevelApi(props.passenger.id)
    const result = res.data as LevelCalculateResult
    if (result.oldLevel !== result.newLevel) {
      ElMessage.success(`等级已从${PassengerLevelMap[result.oldLevel]}升级为${PassengerLevelMap[result.newLevel]}`)
    } else {
      ElMessage.success('等级计算完成，当前等级保持不变')
    }
    emit('level-updated', result)
    loadLevelHistory()
  } catch (error: any) {
    ElMessage.error(error.message || '等级计算失败')
  } finally {
    calculatingLevel.value = false
  }
}

const loadLevelHistory = async () => {
  if (!props.passenger.id) return
  loadingHistory.value = true
  try {
    const res = await getAuditLogsApi(props.passenger.id, { operationType: AuditOperationType.LEVEL_CHANGE, pageSize: 5 })
    levelHistory.value = res.data.list || res.data || []
  } catch (error) {
    levelHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

watch(() => props.passenger.tags, (newTags) => {
  editingTags.value = [...(newTags || [])]
}, { immediate: true })

watch(() => tagEditorVisible.value, (visible) => {
  if (visible) {
    editingTags.value = [...(props.passenger.tags || [])]
  }
})

onMounted(() => {
  loadLevelHistory()
})

defineExpose({
  loadLevelHistory,
  handleCalculateLevel
})
</script>

<style lang="scss" scoped>
.passenger-level-tags {
  background: #fff;
  border-radius: 12px;
  padding: 20px;

  .level-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;

    .level-badge-section {
      display: flex;
      align-items: center;
      gap: 16px;

      .level-badge {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.05);
        }

        &.diamond-level {
          position: relative;
          animation: diamond-shine 2s ease-in-out infinite;

          &::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b);
            border-radius: 50%;
            z-index: -1;
            background-size: 400% 400%;
            animation: gradient-rotate 3s ease infinite;
          }
        }

        .badge-icon {
          font-size: 28px;
          margin-bottom: 2px;
        }

        .badge-text {
          font-size: 12px;
          font-weight: 600;
        }
      }

      .level-info {
        .level-name {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .level-score {
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .reputation-section {
      display: flex;
      flex-direction: column;
      align-items: center;

      .reputation-gauge {
        width: 100px;
        height: 100px;

        .gauge-svg {
          width: 100%;
          height: 100%;

          .gauge-progress {
            transition: stroke-dasharray 0.8s ease;
          }

          .gauge-score {
            font-size: 24px;
            font-weight: 700;
            fill: #303133;
          }

          .gauge-label {
            font-size: 10px;
            fill: #909399;
          }
        }
      }

      .reputation-level {
        font-size: 12px;
        color: #606266;
        margin-top: 4px;
      }
    }
  }

  .level-progress-section {
    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #606266;

      .progress-text {
        color: #909399;
      }
    }

    .progress-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 4px;

      &.text-success {
        color: #67c23a;
      }
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .tags-section {
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      :deep(.el-tag) {
        cursor: pointer;
      }
    }

    .tag-editor {
      .editor-title {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 12px;
      }

      .tag-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;

        .tag-option {
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            transform: translateY(-1px);
          }
        }
      }

      .editor-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  }

  .benefits-section {
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .benefit-card {
        display: flex;
        gap: 12px;
        padding: 14px;
        background: #f5f7fa;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          background: #ecf5ff;
          transform: translateY(-2px);
        }

        .benefit-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .benefit-info {
          flex: 1;
          min-width: 0;

          .benefit-title {
            font-size: 12px;
            color: #909399;
            margin-bottom: 2px;
          }

          .benefit-value {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 2px;
          }

          .benefit-desc {
            font-size: 11px;
            color: #c0c4cc;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  .level-history-section {
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
      gap: 8px;
      color: #909399;
      font-size: 13px;
    }

    :deep(.el-timeline) {
      margin-bottom: 0;

      .el-timeline-item__timestamp {
        color: #909399;
        font-size: 12px;
      }

      .history-card {
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 12px;
        margin-left: 8px;

        .history-operation {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .history-operator {
            font-size: 12px;
            color: #909399;
          }
        }

        .history-level-change {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .arrow {
            color: #c0c4cc;
            font-size: 14px;
          }
        }

        .history-reason {
          font-size: 12px;
          color: #606266;
          margin-bottom: 8px;

          .reason-label {
            color: #909399;
          }
        }

        .benefits-changed {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          flex-wrap: wrap;

          .benefits-label {
            font-size: 12px;
            color: #909399;
          }

          :deep(.el-tag) {
            margin-right: 4px;
          }
        }
      }
    }
  }
}

@keyframes diamond-shine {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 4px 24px rgba(102, 126, 234, 0.8), 0 0 40px rgba(240, 147, 251, 0.4);
  }
}

@keyframes gradient-rotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@media (max-width: 768px) {
  .passenger-level-tags {
    .level-header {
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }

    .benefits-section {
      .benefits-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
