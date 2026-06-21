<template>
  <div class="scene-rules-config">
    <div class="scene-tabs">
      <div
        v-for="scene in sceneList"
        :key="scene.value"
        class="scene-tab"
        :class="{ active: currentScene === scene.value }"
        @click="handleSceneChange(scene.value)"
      >
        <div class="scene-icon" :style="{ background: scene.gradient }">
          <el-icon><component :is="scene.icon" /></el-icon>
        </div>
        <div class="scene-info">
          <span class="scene-name">{{ scene.label }}</span>
          <span class="scene-desc">{{ scene.desc }}</span>
        </div>
        <el-tag v-if="currentScene === scene.value" type="success" size="small">
          <el-icon><Check /></el-icon>
          已选中
        </el-tag>
      </div>
    </div>

    <el-divider content-position="left">
      <span class="section-title">
        <el-icon><Setting /></el-icon>
        {{ currentSceneName }}场景专属配置
      </span>
    </el-divider>

    <div class="rules-grid">
      <div class="rule-card">
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>参与人群规则</span>
        </div>
        <div class="card-body">
          <el-form :model="formData" label-width="120px" size="default">
            <el-form-item label="目标人群">
              <el-select v-model="formData.targetUser" style="width: 100%">
                <el-option
                  v-for="item in targetUserOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :disabled="isTargetUserDisabled(item.value)"
                />
              </el-select>
              <div class="tip" v-if="sceneTips.targetUser">
                <el-icon><InfoFilled /></el-icon>
                {{ sceneTips.targetUser }}
              </div>
            </el-form-item>

            <el-form-item label="最低等级">
              <el-select v-model="formData.userLevelMin" style="width: 100%">
                <el-option label="不限制" :value="0" />
                <el-option label="V1及以上" :value="1" />
                <el-option label="V2及以上" :value="2" />
                <el-option label="V3及以上" :value="3" />
                <el-option label="V4及以上" :value="4" />
                <el-option label="V5及以上" :value="5" />
              </el-select>
            </el-form-item>

            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="注册天数(≥)">
                  <el-input-number
                    v-model="formData.registerDaysMin"
                    :min="0"
                    :max="3650"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="注册天数(≤)">
                  <el-input-number
                    v-model="formData.registerDaysMax"
                    :min="0"
                    :max="3650"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item v-if="currentScene === 4" label="流失天数">
              <el-input-number
                v-model="formData.inactiveDays"
                :min="7"
                :max="365"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">天以上未活跃</span>
              <div class="tip">
                <el-icon><InfoFilled /></el-icon>
                召回福利要求用户至少7天未产生出行行为
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="rule-card">
        <div class="card-header">
          <el-icon><Wallet /></el-icon>
          <span>权益内容配置</span>
        </div>
        <div class="card-body">
          <el-form :model="formData" label-width="120px" size="default">
            <el-form-item label="补贴金额">
              <el-input-number
                v-model="formData.subsidyAmount"
                :min="0"
                :max="maxSubsidy"
                :precision="2"
                :step="1"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">元</span>
              <div class="tip" :class="{ warning: formData.subsidyAmount > maxSubsidy * 0.8 }">
                <el-icon><InfoFilled /></el-icon>
                {{ currentSceneName }}单笔补贴上限{{ maxSubsidy }}元
                <span v-if="formData.subsidyAmount > maxSubsidy * 0.8" class="warn-text">
                  （当前设置接近上限）
                </span>
              </div>
            </el-form-item>

            <el-form-item label="单笔最高补贴">
              <el-input-number
                v-model="formData.maxSubsidyPerOrder"
                :min="0"
                :max="maxSubsidy * 1.5"
                :precision="2"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">元</span>
            </el-form-item>

            <el-form-item label="折扣率">
              <el-slider
                v-model="formData.discountRate"
                :min="0"
                :max="10"
                :step="0.5"
                show-input
                :marks="{ 1: '1折', 5: '5折', 8: '8折', 10: '10折' }"
                style="width: 80%"
              />
              <span v-if="formData.discountRate" class="unit">
                {{ formData.discountRate }}折
              </span>
            </el-form-item>

            <el-form-item label="使用门槛">
              <el-input-number
                v-model="formData.minOrderAmount"
                :min="0"
                :max="500"
                :precision="2"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">元起</span>
            </el-form-item>

            <el-form-item label="关联优惠券">
              <el-select v-model="formData.couponId" clearable style="width: 100%" placeholder="可选">
                <el-option label="无（直接补贴）" :value="null" />
                <el-option label="新用户立减10元券" :value="1" />
                <el-option label="满50减8元券" :value="2" />
                <el-option label="8折折扣券" :value="3" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="rule-card">
        <div class="card-header">
          <el-icon><Tickets /></el-icon>
          <span>领取频次规则</span>
        </div>
        <div class="card-body">
          <el-form :model="formData" label-width="120px" size="default">
            <el-form-item label="每人限领">
              <el-input-number
                v-model="formData.perUserLimit"
                :min="1"
                :max="100"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">次</span>
            </el-form-item>

            <el-form-item label="每日限领">
              <el-input-number
                v-model="formData.perDayLimit"
                :min="0"
                :max="20"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">次（0为不限）</span>
            </el-form-item>

            <el-form-item label="活动总名额">
              <el-input-number
                v-model="formData.totalCount"
                :min="0"
                :max="1000000"
                :step="1000"
                controls-position="right"
                style="width: 50%"
              />
              <span class="unit">份（0为不限）</span>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="rule-card">
        <div class="card-header">
          <el-icon><Promotion /></el-icon>
          <span>城市圈层差异化</span>
        </div>
        <div class="card-body">
          <el-form label-width="100px" size="small">
            <el-form-item label="适用城市">
              <el-select
                v-model="selectedCities"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="不选则为全部城市"
                style="width: 100%"
                @change="handleCitiesChange"
              >
                <el-optgroup label="一线城市">
                  <el-option v-for="c in tier1Cities" :key="c" :label="c" :value="c" />
                </el-optgroup>
                <el-optgroup label="二线城市">
                  <el-option v-for="c in tier2Cities" :key="c" :label="c" :value="c" />
                </el-optgroup>
                <el-optgroup label="三线城市">
                  <el-option v-for="c in tier3Cities" :key="c" :label="c" :value="c" />
                </el-optgroup>
              </el-select>
            </el-form-item>

            <div class="tier-configs">
              <div
                v-for="tier in tierList"
                :key="tier.value"
                class="tier-config-item"
              >
                <div class="tier-header" :class="`tier-${tier.value}`">
                  <el-icon><LocationFilled /></el-icon>
                  <span>{{ tier.label }}</span>
                </div>
                <div class="tier-fields">
                  <div class="tier-field">
                    <label>补贴</label>
                    <el-input-number
                      v-model="tierConfigs[tier.value].subsidyAmount"
                      :min="0"
                      :max="100"
                      :precision="2"
                      size="small"
                      controls-position="right"
                    />
                    <span class="unit-sm">元</span>
                  </div>
                  <div class="tier-field">
                    <label>封顶</label>
                    <el-input-number
                      v-model="tierConfigs[tier.value].maxSubsidyPerOrder"
                      :min="0"
                      :max="200"
                      :precision="2"
                      size="small"
                      controls-position="right"
                    />
                    <span class="unit-sm">元</span>
                  </div>
                  <div class="tier-field">
                    <label>折扣</label>
                    <el-input-number
                      v-model="tierConfigs[tier.value].discountRate"
                      :min="0"
                      :max="10"
                      :precision="1"
                      :step="0.5"
                      size="small"
                      controls-position="right"
                    />
                    <span class="unit-sm">折</span>
                  </div>
                </div>
              </div>
            </div>
          </el-form>
        </div>
      </div>

      <div class="rule-card full-width">
        <div class="card-header">
          <el-icon><Medal /></el-icon>
          <span>权益互斥规则</span>
          <el-tag v-if="formData.mutuallyExclusive === 1" type="danger" size="small">
            <el-icon><Lock /></el-icon>
            已开启互斥
          </el-tag>
          <el-tag v-else type="info" size="small">
            <el-icon><Unlock /></el-icon>
            允许叠加
          </el-tag>
        </div>
        <div class="card-body">
          <el-form :model="formData" label-width="140px" size="default">
            <el-form-item label="启用权益互斥">
              <el-switch
                v-model="formData.mutuallyExclusive"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="关闭"
              />
              <div class="tip">
                <el-icon><WarningFilled v-if="formData.mutuallyExclusive === 0" class="warn" /></el-icon>
                <el-icon><InfoFilled v-else /></el-icon>
                {{ formData.mutuallyExclusive === 1
                  ? '用户仅能领取互斥场景中的一项权益，防止重复薅羊毛'
                  : '已关闭互斥，用户可能叠加领取多个活动权益，请谨慎操作'
                }}
              </div>
            </el-form-item>

            <el-form-item label="互斥场景列表">
              <el-checkbox-group v-model="exclusiveScenes">
                <el-checkbox
                  v-for="scene in sceneList"
                  :key="scene.value"
                  :label="scene.value"
                  :disabled="scene.value === currentScene"
                >
                  <span :style="{ color: scene.color }">{{ scene.label }}</span>
                </el-checkbox>
              </el-checkbox-group>
              <div class="tip">
                <el-icon><InfoFilled /></el-icon>
                当前{{ currentSceneName }}默认与所有场景互斥，确保权益不叠加
              </div>
            </el-form-item>

            <el-form-item label="适用车型">
              <el-select
                v-model="selectedVehicleTypes"
                multiple
                placeholder="不选则为全部车型"
                style="width: 100%"
                @change="handleVehicleTypesChange"
              >
                <el-option label="快车" :value="1" />
                <el-option label="专车" :value="2" />
                <el-option label="豪华车" :value="3" />
                <el-option label="拼车" :value="4" />
                <el-option label="出租车" :value="5" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import {
  User, Wallet, Tickets, Promotion, Medal, Check, Setting,
  InfoFilled, WarningFilled, LocationFilled, Lock, Unlock
} from '@element-plus/icons-vue'
import {
  CampaignScene,
  CampaignSceneMap,
  CampaignSceneColorMap,
  CampaignSceneGradientMap,
  SceneDefaultConfig,
  TargetUser,
  AllCities,
  Tier1Cities,
  Tier2Cities,
  Tier3Cities
} from '@/enums/marketing'
import type { CityTierConfig, MarketingCampaign } from '@/types/marketing'

const props = defineProps<{
  modelValue: Partial<MarketingCampaign>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<MarketingCampaign>): void
  (e: 'scene-change', scene: number): void
}>()

const currentScene = ref(props.modelValue.scene || CampaignScene.NEW_USER_GIFT)
const formData = reactive<Partial<MarketingCampaign>>({ ...props.modelValue })

const sceneList = [
  {
    value: CampaignScene.NEW_USER_GIFT,
    label: '新人礼',
    desc: '新用户注册专享',
    icon: 'StarFilled',
    color: CampaignSceneColorMap[CampaignScene.NEW_USER_GIFT],
    gradient: CampaignSceneGradientMap[CampaignScene.NEW_USER_GIFT]
  },
  {
    value: CampaignScene.HOLIDAY_GIFT,
    label: '节日礼',
    desc: '节假日限定福利',
    icon: 'Present',
    color: CampaignSceneColorMap[CampaignScene.HOLIDAY_GIFT],
    gradient: CampaignSceneGradientMap[CampaignScene.HOLIDAY_GIFT]
  },
  {
    value: CampaignScene.TRAVEL_SUBSIDY,
    label: '出行补贴',
    desc: '日常普惠补贴',
    icon: 'Van',
    color: CampaignSceneColorMap[CampaignScene.TRAVEL_SUBSIDY],
    gradient: CampaignSceneGradientMap[CampaignScene.TRAVEL_SUBSIDY]
  },
  {
    value: CampaignScene.RECALL_WELFARE,
    label: '召回福利',
    desc: '流失用户回归',
    icon: 'UserFilled',
    color: CampaignSceneColorMap[CampaignScene.RECALL_WELFARE],
    gradient: CampaignSceneGradientMap[CampaignScene.RECALL_WELFARE]
  }
]

const targetUserOptions = [
  { value: TargetUser.ALL, label: '全部用户' },
  { value: TargetUser.NEW_USER, label: '新用户' },
  { value: TargetUser.OLD_USER, label: '老用户' },
  { value: TargetUser.INACTIVE_USER, label: '流失用户' },
  { value: TargetUser.HIGH_VALUE_USER, label: '高价值用户' }
]

const tierList = [
  { value: 'tier1', label: '一线城市' },
  { value: 'tier2', label: '二线城市' },
  { value: 'tier3', label: '三线城市' },
  { value: 'tier4', label: '四线及以下' }
]

const tier1Cities = Tier1Cities
const tier2Cities = Tier2Cities
const tier3Cities = Tier3Cities

const sceneTips: Record<number, Record<string, string>> = {
  [CampaignScene.NEW_USER_GIFT]: {
    targetUser: '新人礼仅限新用户参与，此选项已锁定'
  },
  [CampaignScene.RECALL_WELFARE]: {
    targetUser: '召回福利仅限流失用户参与，此选项已锁定'
  },
  [CampaignScene.HOLIDAY_GIFT]: {},
  [CampaignScene.TRAVEL_SUBSIDY]: {}
}

const selectedCities = ref<string[]>(formData.cities || [])
const selectedVehicleTypes = ref<number[]>(formData.vehicleTypes || [])
const exclusiveScenes = ref<number[]>(formData.exclusiveScenes || [1, 2, 3, 4].filter(s => s !== currentScene.value))

const tierConfigs = reactive<Record<string, {
  subsidyAmount: number
  maxSubsidyPerOrder: number
  discountRate: number
}>>({
  tier1: { subsidyAmount: 0, maxSubsidyPerOrder: 0, discountRate: 0 },
  tier2: { subsidyAmount: 0, maxSubsidyPerOrder: 0, discountRate: 0 },
  tier3: { subsidyAmount: 0, maxSubsidyPerOrder: 0, discountRate: 0 },
  tier4: { subsidyAmount: 0, maxSubsidyPerOrder: 0, discountRate: 0 }
})

const currentSceneName = computed(() => CampaignSceneMap[currentScene.value] || '')

const maxSubsidy = computed(() => {
  const maxMap: Record<number, number> = {
    [CampaignScene.NEW_USER_GIFT]: 30,
    [CampaignScene.HOLIDAY_GIFT]: 50,
    [CampaignScene.TRAVEL_SUBSIDY]: 20,
    [CampaignScene.RECALL_WELFARE]: 40
  }
  return maxMap[currentScene.value] || 50
})

const isTargetUserDisabled = (value: number) => {
  if (currentScene.value === CampaignScene.NEW_USER_GIFT) {
    return value !== TargetUser.NEW_USER
  }
  if (currentScene.value === CampaignScene.RECALL_WELFARE) {
    return value !== TargetUser.INACTIVE_USER
  }
  return false
}

const handleSceneChange = (scene: number) => {
  currentScene.value = scene
  const defaults = SceneDefaultConfig[scene] || {}
  Object.keys(defaults).forEach(key => {
    (formData as any)[key] = defaults[key]
  })
  exclusiveScenes.value = [1, 2, 3, 4].filter(s => s !== scene)
  emit('scene-change', scene)
}

const handleCitiesChange = (val: string[]) => {
  formData.cities = val.length > 0 ? val : null
}

const handleVehicleTypesChange = (val: number[]) => {
  formData.vehicleTypes = val.length > 0 ? val : null
}

watch(() => exclusiveScenes.value, (val) => {
  formData.exclusiveScenes = val.length > 0 ? val : null
}, { deep: true })

watch(() => tierConfigs, (val) => {
  formData.cityTierConfig = JSON.parse(JSON.stringify(val)) as CityTierConfig
}, { deep: true })

watch(formData, (val) => {
  val.scene = currentScene.value
  emit('update:modelValue', { ...val })
}, { deep: true })

watch(() => props.modelValue, (val) => {
  Object.assign(formData, val)
  if (val.scene) currentScene.value = val.scene
}, { deep: true })
</script>

<style lang="scss" scoped>
.scene-rules-config {
  .scene-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 8px;

    .scene-tab {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff;
      border-radius: 10px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #e4e7ed;
        transform: translateY(-2px);
      }

      &.active {
        border-color: #409eff;
        background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }

      .scene-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
        flex-shrink: 0;
      }

      .scene-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .scene-name {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .scene-desc {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .rules-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .rule-card {
      background: #fff;
      border-radius: 10px;
      border: 1px solid #ebeef5;
      overflow: hidden;

      &.full-width {
        grid-column: span 2;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 18px;
        background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
        border-bottom: 1px solid #ebeef5;
        font-size: 14px;
        font-weight: 600;
        color: #303133;

        .el-icon {
          color: #409eff;
          font-size: 16px;
        }

        .el-tag {
          margin-left: auto;
        }
      }

      .card-body {
        padding: 18px;

        .tip {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #ecf5ff;
          border-radius: 6px;
          font-size: 12px;
          color: #409eff;

          .el-icon {
            flex-shrink: 0;
            margin-top: 1px;
          }

          &.warning {
            background: #fdf6ec;
            color: #e6a23c;

            .warn-text {
              color: #f56c6c;
              font-weight: 500;
            }
          }

          .warn {
            color: #f56c6c;
          }
        }

        .unit {
          margin-left: 8px;
          color: #909399;
          font-size: 13px;
        }

        .unit-sm {
          margin-left: 4px;
          color: #909399;
          font-size: 12px;
        }
      }
    }
  }

  .tier-configs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 4px;

    .tier-config-item {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      overflow: hidden;

      .tier-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        color: #fff;

        &.tier-tier1 { background: linear-gradient(135deg, #f56c6c, #f78989); }
        &.tier-tier2 { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
        &.tier-tier3 { background: linear-gradient(135deg, #409eff, #66b1ff); }
        &.tier-tier4 { background: linear-gradient(135deg, #909399, #a6a9ad); }
      }

      .tier-fields {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .tier-field {
          display: flex;
          align-items: center;
          gap: 8px;

          label {
            width: 36px;
            font-size: 12px;
            color: #606266;
          }

          :deep(.el-input-number) {
            flex: 1;
          }
        }
      }
    }
  }
}
</style>
