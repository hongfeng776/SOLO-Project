<template>
  <div class="user-behavior-trace" ref="traceScrollRef">
    <div class="sticky-header">
      <div class="trace-header">
        <div class="user-info">
          <div class="avatar">
            <el-avatar :size="56" :src="userInfo.avatar">
              {{ userInfo.nickname?.charAt(0) || userInfo.username?.charAt(0) || 'U' }}
            </el-avatar>
          </div>
          <div class="info-body">
            <div class="name">
              {{ userInfo.nickname || userInfo.username }}
              <el-tag
                v-if="userInfo.userLevel"
                size="small"
                :style="{ marginLeft: '8px', background: getLevelColor(userInfo.userLevel) + '20', color: getLevelColor(userInfo.userLevel), borderColor: 'transparent' }"
              >
                {{ getLevelLabel(userInfo.userLevel) }}
              </el-tag>
              <el-tag
                v-if="riskLevel > 0"
                size="small"
                :style="{ marginLeft: '8px', background: getRiskColor(riskLevel) + '20', color: getRiskColor(riskLevel), borderColor: 'transparent' }"
              >
                风险: {{ getRiskLabel(riskLevel) }}
              </el-tag>
            </div>
            <div class="meta">
              <span>用户ID: {{ userInfo.id }}</span>
              <span v-if="userInfo.phone">手机: {{ userInfo.phone }}</span>
              <span>行为总数: <b class="abnormal">{{ totalCount }}</b> 次</span>
              <span>异常: <b class="abnormal">{{ abnormalCount }}</b> 次</span>
            </div>
          </div>
        </div>

        <div v-if="detectedIssues.length > 0" class="detected-issues">
          <div
            v-for="(issue, idx) in detectedIssues"
            :key="idx"
            :class="['issue-item', `level-${issue.level}`]"
          >
            <el-icon><WarningFilled /></el-icon>
            <span>{{ issue.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-loading="loading">
      <template v-for="typeKey in groupOrder" :key="typeKey">
        <div v-if="groupedData[typeKey]?.length > 0" class="behavior-group">
          <div :class="['group-title', `group-${typeKey}`]">
            <el-icon><component :is="getTypeIcon(typeKey)" /></el-icon>
            <span>{{ getTypeLabel(typeKey) }}</span>
            <span class="count-badge">{{ groupedData[typeKey].length }} 条</span>
          </div>

          <div
            v-for="(b, bIdx) in groupedData[typeKey]"
            :key="b.id || bIdx"
            :class="['behavior-item', { 'is-abnormal': b.isAbnormal }]"
          >
            <div class="item-left">
              <div class="item-title">
                {{ b.behaviorName }}
                <template v-if="b.targetName">
                  <span style="color: #909399; font-weight: normal; margin-left: 8px;">→</span>
                  <span style="font-weight: normal; margin-left: 8px;">{{ b.targetName }}</span>
                </template>
              </div>
              <div class="item-meta">
                <span v-if="b.scene">场景: {{ b.scene }}</span>
                <span v-if="b.ip">IP: {{ b.ip }}</span>
                <span v-if="b.amount > 0">金额: ¥{{ b.amount }}</span>
                <span v-if="b.abnormalLevel >= 2" class="abnormal-tag">
                  ⚠ {{ getAbnormalLabel(b.abnormalType) }}
                </span>
              </div>
              <div v-if="b.content" style="font-size: 12px; color: #606266; margin-top: 4px;">
                {{ formatContent(b.content) }}
              </div>
            </div>
            <div class="item-right">
              <div class="item-time">{{ formatTime(b.createdAt) }}</div>
              <div v-if="b.abnormalScore > 0" class="item-score">
                异常分: {{ b.abnormalScore }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <el-empty v-if="totalCount === 0" description="该时间段内暂无行为记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  View,
  ShoppingCart,
  Service,
  Present,
  WarningFilled
} from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  RiskLevelEnum,
  BehaviorTypeEnum,
  AbnormalTypeEnum,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { getUserBehaviorTrace } from '@/api/behavior'

const props = defineProps({
  userId: [Number, String],
  startTime: String,
  endTime: String
})

const emit = defineEmits([])

const loading = ref(false)
const traceData = ref(null)

const userInfo = computed(() => traceData.value?.userInfo || {})
const groupedData = computed(() => traceData.value?.grouped || {})
const totalCount = computed(() => traceData.value?.totalCount || 0)
const abnormalCount = computed(() => traceData.value?.abnormalCount || 0)
const riskLevel = computed(() => traceData.value?.riskLevel || 0)
const detectedIssues = computed(() => traceData.value?.detectedIssues || [])

const groupOrder = ['browse', 'order', 'aftersale', 'marketing']

const getLevelLabel = (lv) => getEnumLabel(UserLevelEnum, lv)
const getLevelColor = (lv) => getEnumColor(UserLevelEnum, lv)
const getRiskLabel = (lv) => getEnumLabel(RiskLevelEnum, lv)
const getRiskColor = (lv) => getEnumColor(RiskLevelEnum, lv)
const getTypeLabel = (t) => getEnumLabel(BehaviorTypeEnum, t) || t
const getAbnormalLabel = (t) => getEnumLabel(AbnormalTypeEnum, t) || t

const getTypeIcon = (type) => {
  const map = { browse: View, order: ShoppingCart, aftersale: Service, marketing: Present }
  return map[type] || View
}

const formatTime = (t) => {
  if (!t) return '-'
  return typeof t === 'string' ? t.replace('T', ' ').substring(0, 19) : String(t)
}

const formatContent = (c) => {
  if (!c) return ''
  try {
    const obj = typeof c === 'string' ? JSON.parse(c) : c
    return Object.keys(obj).map(k => `${k}: ${obj[k]}`).join(' | ')
  } catch (e) {
    return String(c)
  }
}

const fetchData = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const params = {}
    if (props.startTime) params.startTime = props.startTime
    if (props.endTime) params.endTime = props.endTime
    const res = await getUserBehaviorTrace(props.userId, params)
    traceData.value = res.data
  } catch (e) {
    traceData.value = null
  } finally {
    loading.value = false
  }
}

watch(() => [props.userId, props.startTime, props.endTime], () => {
  if (props.userId) fetchData()
})

onMounted(() => {
  if (props.userId) fetchData()
})
</script>
