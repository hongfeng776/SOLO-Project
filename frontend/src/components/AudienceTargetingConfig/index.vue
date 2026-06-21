<template>
  <div class="audience-targeting-config">
    <div class="strategy-switcher">
      <div class="section-title">
        <el-icon><UserFilled /></el-icon>
        <span>人群定向策略</span>
        <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">
          版本 {{ modelValue.audienceVersion || 0 }}
        </el-tag>
      </div>
      <div class="strategy-tabs">
        <div
          v-for="cfg in purposeConfigs"
          :key="cfg.purpose"
          class="strategy-card"
          :class="{ active: (modelValue.audiencePurpose || 0) === cfg.purpose }"
          :style="(modelValue.audiencePurpose || 0) === cfg.purpose ? { background: gradientMap[cfg.purpose] } : {}"
          @click="handleSwitchPurpose(cfg.purpose)"
        >
          <div class="strategy-icon">
            <el-icon><component :is="cfg.icon" /></el-icon>
          </div>
          <div class="strategy-text">
            <h4>{{ cfg.name }}</h4>
            <p>{{ cfg.desc }}</p>
          </div>
          <div v-if="(modelValue.audiencePurpose || 0) === cfg.purpose" class="strategy-check">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="preview-panel" v-if="previewData">
      <div class="preview-header">
        <h4><el-icon><DataLine /></el-icon>人群覆盖实时预览</h4>
        <el-button link size="small" @click="refreshPreview">
          <el-icon><Refresh /></el-icon>
          刷新预览
        </el-button>
      </div>
      <div class="preview-stats">
        <div class="stat-item valid">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-text">
            <h4>{{ previewData.valid.toLocaleString() }}</h4>
            <span>有效用户</span>
          </div>
        </div>
        <div class="stat-item total">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-text">
            <h4>{{ previewData.total.toLocaleString() }}</h4>
            <span>原始覆盖</span>
          </div>
        </div>
        <div class="stat-item risk">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-text">
            <h4>{{ previewData.riskExcluded.toLocaleString() }}</h4>
            <span>自动排除风险</span>
          </div>
        </div>
        <div class="stat-item blocked">
          <div class="stat-icon"><el-icon><CircleClose /></el-icon></div>
          <div class="stat-text">
            <h4>{{ previewData.blockedExcluded.toLocaleString() }}</h4>
            <span>自动排除封禁</span>
          </div>
        </div>
      </div>
      <div v-if="previewData.byCity?.length" class="city-breakdown">
        <span class="breakdown-label">TOP城市分布：</span>
        <el-tag
          v-for="c in previewData.byCity.slice(0, 6)"
          :key="c.city"
          size="small"
          type="info"
          effect="plain"
        >
          {{ c.city }} {{ c.count.toLocaleString() }}
        </el-tag>
      </div>
    </div>

    <el-divider content-position="left">
      <span class="divider-title">多维度用户筛选</span>
    </el-divider>

    <div class="dimension-grid">
      <div class="dimension-card">
        <div class="card-header">
          <el-icon><PriceTag /></el-icon>
          <h5>用户标签</h5>
          <el-tag size="small" v-if="modelValue.userTags?.length">{{ modelValue.userTags.length }}个选中</el-tag>
        </div>
        <div class="tag-list">
          <el-tag
            v-for="t in audienceConfig.userTags"
            :key="t.value"
            class="tag-option"
            :class="{ selected: (modelValue.userTags || []).includes(t.value) }"
            :color="(modelValue.userTags || []).includes(t.value) ? t.color : ''"
            effect="light"
            @click="toggleTag('userTags', t.value)"
          >
            {{ t.label }}
          </el-tag>
        </div>
      </div>

      <div class="dimension-card">
        <div class="card-header">
          <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
          <h5>排除用户标签</h5>
          <el-tag size="small" type="danger" v-if="modelValue.excludeUserTags?.length">{{ modelValue.excludeUserTags.length }}个选中</el-tag>
        </div>
        <div class="tag-list">
          <el-tag
            v-for="t in audienceConfig.excludeTags"
            :key="t.value"
            class="tag-option"
            :class="{ selected: (modelValue.excludeUserTags || []).includes(t.value) }"
            :color="(modelValue.excludeUserTags || []).includes(t.value) ? t.color : ''"
            effect="dark"
            @click="toggleTag('excludeUserTags', t.value)"
          >
            {{ t.label }}
          </el-tag>
        </div>
      </div>

      <div class="dimension-card">
        <div class="card-header">
          <el-icon color="#409eff"><Histogram /></el-icon>
          <h5>活跃度分层</h5>
        </div>
        <el-checkbox-group v-model="activityLevelsModel">
          <el-checkbox v-for="a in audienceConfig.activityLevels" :key="a.value" :value="a.value" border>
            {{ a.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="dimension-card">
        <div class="card-header">
          <el-icon color="#e6a23c"><Wallet /></el-icon>
          <h5>消费能力分层</h5>
        </div>
        <el-checkbox-group v-model="consumptionLevelsModel">
          <el-checkbox v-for="c in audienceConfig.consumptionLevels" :key="c.value" :value="c.value" border>
            {{ c.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="dimension-card">
        <div class="card-header">
          <el-icon color="#f56c6c"><Medal /></el-icon>
          <h5>用户等级</h5>
        </div>
        <el-checkbox-group v-model="userLevelsModel">
          <el-checkbox v-for="u in audienceConfig.userLevels" :key="u.value" :value="u.value" border>
            {{ u.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="dimension-card switches-card">
        <div class="card-header">
          <el-icon color="#67c23a"><Shield /></el-icon>
          <h5>智能排除（推荐开启）</h5>
        </div>
        <div class="switch-list">
          <div class="switch-row">
            <div class="switch-info">
              <h6>排除高风险账号</h6>
              <p>自动拦截风控等级≥4级、已标记风险用户</p>
            </div>
            <el-switch v-model="excludeHighRiskModel" active-color="#67c23a" />
          </div>
          <div class="switch-row">
            <div class="switch-info">
              <h6>排除封禁账号</h6>
              <p>自动过滤账号状态为禁用/封禁的用户</p>
            </div>
            <el-switch v-model="excludeBlockedModel" active-color="#67c23a" />
          </div>
          <div class="switch-row">
            <div class="switch-info">
              <h6>排除超90天未登录</h6>
              <p>避免营销资源浪费在流失用户上</p>
            </div>
            <el-switch v-model="excludeInactiveModel" active-color="#e6a23c" />
          </div>
        </div>
      </div>
    </div>

    <el-alert
      v-if="conflictWarnings.length"
      type="warning"
      :closable="false"
      show-icon
      title="检测到人群规则冲突"
    >
      <div slot>
        <p v-for="(w, i) in conflictWarnings" :key="i" class="warning-item">
          <el-icon><WarningFilled /></el-icon>
          {{ w }}
        </p>
      </div>
    </el-alert>

    <el-alert
      v-if="passedHints.length"
      type="success"
      :closable="false"
      show-icon
      title="校验通过项"
    >
      <div slot>
        <p v-for="(p, i) in passedHints" :key="i" class="passed-item">
          <el-icon><CircleCheckFilled /></el-icon>
          {{ p }}
        </p>
      </div>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserFilled, CircleCheckFilled, DataLine, Refresh, User, Warning,
  CircleClose, PriceTag, Histogram, Wallet, Medal, Shield, WarningFilled
} from '@element-plus/icons-vue'
import {
  getAudienceConfigApi,
  applyAudienceStrategyApi,
  previewAudienceApi
} from '@/api/marketing'
import {
  AudiencePurpose,
  AudiencePurposeGradientMap
} from '@/types/marketing'
import type {
  MarketingCampaign,
  AudiencePreview,
  AudiencePurposeConfig
} from '@/types/marketing'

const props = defineProps<{
  modelValue: Partial<MarketingCampaign>;
  campaignId?: number;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Partial<MarketingCampaign>): void;
  (e: 'change', v: Partial<MarketingCampaign>): void;
  (e: 'warnings', v: string[]): void;
}>()

const loading = ref(false)
const previewLoading = ref(false)
const audienceConfig = reactive<{
  userTags: { value: string; label: string; color: string }[];
  excludeTags: { value: string; label: string; color: string }[];
  activityLevels: { value: number; label: string }[];
  consumptionLevels: { value: number; label: string }[];
  userLevels: { value: number; label: string }[];
  audiencePurposes: AudiencePurposeConfig[];
}>({
  userTags: [],
  excludeTags: [],
  activityLevels: [],
  consumptionLevels: [],
  userLevels: [],
  audiencePurposes: []
})

const purposeIcons: Record<number, any> = {
  [AudiencePurpose.CUSTOM]: 'Setting',
  [AudiencePurpose.ACQUISITION]: 'UserFilled',
  [AudiencePurpose.ACTIVATION]: 'Promotion',
  [AudiencePurpose.RETENTION]: 'Crown'
}

const purposeConfigs = computed(() => audienceConfig.audiencePurposes.map(p => ({
  ...p,
  icon: purposeIcons[p.purpose] || 'Setting'
})))

const gradientMap = AudiencePurposeGradientMap

const previewData = ref<AudiencePreview | null>(null)

const activityLevelsModel = computed({
  get: () => props.modelValue.activityLevels || [],
  set: (v) => emitUpdate({ activityLevels: v })
})

const consumptionLevelsModel = computed({
  get: () => props.modelValue.consumptionLevels || [],
  set: (v) => emitUpdate({ consumptionLevels: v })
})

const userLevelsModel = computed({
  get: () => props.modelValue.userLevels || [],
  set: (v) => emitUpdate({ userLevels: v })
})

const excludeHighRiskModel = computed({
  get: () => !!props.modelValue.excludeHighRisk,
  set: (v) => emitUpdate({ excludeHighRisk: v ? 1 : 0 })
})

const excludeBlockedModel = computed({
  get: () => !!props.modelValue.excludeBlocked,
  set: (v) => emitUpdate({ excludeBlocked: v ? 1 : 0 })
})

const excludeInactiveModel = computed({
  get: () => !!props.modelValue.excludeInactive,
  set: (v) => emitUpdate({ excludeInactive: v ? 1 : 0 })
})

const conflictWarnings = computed<string[]>(() => {
  const w: string[] = []
  const tags = props.modelValue.userTags || []
  if (tags.includes('dormant_user') && tags.includes('new_register')) {
    w.push('"沉睡用户"与"新注册用户"标签互斥，建议二选一')
  }
  if (props.modelValue.targetedUserIds?.length && props.modelValue.excludedUserIds?.length) {
    const overlap = (props.modelValue.targetedUserIds || []).filter(id =>
      (props.modelValue.excludedUserIds || []).includes(id)
    )
    if (overlap.length > 0) {
      w.push(`检测到 ${overlap.length} 个用户同时存在于「定向名单」和「排除名单」中`)
    }
  }
  const al = props.modelValue.activityLevels || []
  if ((al.includes(1) || al.includes(2)) && (al.includes(4) || al.includes(5))) {
    w.push('同时选中「沉睡/低活」与「高活/核心」用户，建议拆分为不同活动')
  }
  if (props.modelValue.targetUser === 2 && (props.modelValue.registerDaysMax || 30) <= 0) {
    w.push('新用户定向需设置最大注册天数')
  }
  return w
})

const passedHints = computed<string[]>(() => {
  const p: string[] = []
  if (props.modelValue.excludeHighRisk) p.push('已开启高风险用户自动排除')
  if (props.modelValue.excludeBlocked) p.push('已开启封禁用户自动排除')
  if ((props.modelValue.userTags || []).length > 0 ||
      (props.modelValue.activityLevels || []).length > 0 ||
      (props.modelValue.userLevels || []).length > 0 ||
      (props.modelValue.cities || []).length > 0 ||
      (props.modelValue.targetedUserIds || []).length > 0) {
    p.push('已配置精细化人群定向，可提升营销资源利用率')
  }
  return p
})

const emitUpdate = (patch: Partial<MarketingCampaign>) => {
  const merged = { ...props.modelValue, ...patch }
  emit('update:modelValue', merged)
  emit('change', merged)
  schedulePreview(merged)
}

const toggleTag = (field: 'userTags' | 'excludeUserTags', value: string) => {
  const cur = (props.modelValue[field] || []) as string[]
  const next = cur.includes(value)
    ? cur.filter(v => v !== value)
    : [...cur, value]
  emitUpdate({ [field]: next } as any)
}

let previewTimer: any = null
const schedulePreview = (data: Partial<MarketingCampaign>) => {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => doPreview(data), 600)
}

const doPreview = async (data?: Partial<MarketingCampaign>) => {
  previewLoading.value = true
  try {
    const payload = { ...(data || props.modelValue), id: props.campaignId }
    const res = await previewAudienceApi(payload)
    previewData.value = res.data as AudiencePreview
  } catch (e: any) {
    console.warn('preview error', e)
  } finally {
    previewLoading.value = false
  }
}

const refreshPreview = () => doPreview()

const handleSwitchPurpose = async (purpose: number) => {
  loading.value = true
  try {
    const res = await applyAudienceStrategyApi(purpose, {
      ...props.modelValue,
      id: props.campaignId
    })
    emitUpdate(res.data as MarketingCampaign)
    ElMessage.success(`已适配${AudiencePurposeGradientMap ? '' : ''}人群策略`)
  } catch (e: any) {
    ElMessage.error(e.message || '策略适配失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getAudienceConfigApi()
    const d: any = res.data
    Object.assign(audienceConfig, d)
  } catch (e) {}
  doPreview()
})

watch(conflictWarnings, (w) => emit('warnings', w), { immediate: true })
</script>

<style lang="scss" scoped>
.audience-targeting-config {
  .strategy-switcher {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 14px;

      .el-icon { color: #409eff; }
    }

    .strategy-tabs {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .strategy-card {
        background: #fff;
        border: 1.5px solid #ebeef5;
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        &.active {
          color: #fff;
          border-color: transparent;

          .strategy-text { h4, p { color: #fff; } }
        }

        .strategy-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(64, 158, 255, 0.1);
          color: #409eff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        &.active .strategy-icon {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        .strategy-text {
          flex: 1;
          h4 { margin: 0 0 3px 0; font-size: 14px; font-weight: 600; color: #303133; }
          p { margin: 0; font-size: 12px; color: #909399; }
        }

        .strategy-check {
          color: #fff;
          font-size: 22px;
        }
      }
    }
  }

  .preview-panel {
    margin-top: 18px;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
    border-radius: 12px;
    padding: 18px;
    border: 1px solid #d9ecff;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #409eff;

        .el-icon { font-size: 18px; }
      }
    }

    .preview-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 12px;

      .stat-item {
        background: #fff;
        border-radius: 10px;
        padding: 14px;
        display: flex;
        align-items: center;
        gap: 10px;

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
        }

        &.valid .stat-icon { background: linear-gradient(135deg, #67c23a, #85ce61); }
        &.total .stat-icon { background: linear-gradient(135deg, #409eff, #66b1ff); }
        &.risk .stat-icon { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
        &.blocked .stat-icon { background: linear-gradient(135deg, #f56c6c, #f78989); }

        .stat-text {
          h4 { margin: 0 0 2px 0; font-size: 20px; font-weight: 700; color: #303133; }
          span { font-size: 12px; color: #909399; }
        }
      }
    }

    .city-breakdown {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #d9ecff;

      .breakdown-label {
        font-size: 12px;
        color: #606266;
        margin-right: 8px;
      }

      .el-tag + .el-tag { margin-left: 6px; }
    }
  }

  .divider-title {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
  }

  .dimension-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 16px;

    .dimension-card {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 16px;

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          flex: 1;
        }

        .el-icon { font-size: 18px; }
      }

      &.switches-card {
        grid-column: span 2;

        .switch-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;

          .switch-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f5f7fa;
            border-radius: 8px;
            padding: 12px 14px;

            .switch-info {
              h6 { margin: 0 0 2px 0; font-size: 13px; font-weight: 600; color: #303133; }
              p { margin: 0; font-size: 11px; color: #909399; }
            }
          }
        }
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag-option {
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;

          &.selected {
            transform: scale(1.05);
          }

          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  }

  .warning-item, .passed-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0;
    font-size: 13px;
  }
}
</style>
