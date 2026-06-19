<template>
  <el-dialog
    v-model="visible"
    title="动态定价规则配置"
    width="680px"
    class="flight-price-rule-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <el-icon color="#faad14"><Setting /></el-icon>
        <span class="title">动态定价规则配置</span>
      </div>
    </template>

    <div class="rule-content">
      <div class="rule-intro">
        <el-alert
          title="智能动态定价"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            根据节假日、出行高峰、周末等因素自动调整机票价格，实现收益最大化。
            所有调整均受溢价上限和最低折扣限制保护。
          </template>
        </el-alert>
      </div>

      <div class="rule-section">
        <div class="section-header">
          <el-icon color="#faad14"><Calendar /></el-icon>
          <span class="section-title">节假日价格上浮</span>
          <el-tag size="small" type="warning">春节/国庆/五一等法定节假日</el-tag>
        </div>
        <div class="rule-card">
          <div class="rule-item">
            <div class="rule-label">上浮比例</div>
            <div class="rule-input">
              <el-slider
                v-model="rules.holidaySurcharge"
                :min="0"
                :max="50"
                :step="1"
                :marks="{ 0: '0%', 10: '10%', 20: '20%', 30: '30%', 40: '40%', 50: '50%' }"
                show-input
              />
            </div>
          </div>
          <div class="rule-preview">
            <el-icon color="#1890ff"><TrendCharts /></el-icon>
            <span>节假日期间票价将在基准价基础上上浮 <strong>{{ rules.holidaySurcharge }}%</strong></span>
          </div>
        </div>
      </div>

      <div class="rule-section">
        <div class="section-header">
          <el-icon color="#eb2f96"><Van /></el-icon>
          <span class="section-title">出行高峰上浮</span>
          <el-tag size="small" type="danger">寒暑假/春运时段</el-tag>
        </div>
        <div class="rule-card">
          <div class="rule-item">
            <div class="rule-label">上浮比例</div>
            <div class="rule-input">
              <el-slider
                v-model="rules.peakSeasonSurcharge"
                :min="0"
                :max="40"
                :step="1"
                :marks="{ 0: '0%', 10: '10%', 20: '20%', 30: '30%', 40: '40%' }"
                show-input
              />
            </div>
          </div>
          <div class="rule-preview">
            <el-icon color="#1890ff"><TrendCharts /></el-icon>
            <span>出行高峰期间票价将在基准价基础上上浮 <strong>{{ rules.peakSeasonSurcharge }}%</strong></span>
          </div>
        </div>
      </div>

      <div class="rule-section">
        <div class="section-header">
          <el-icon color="#1890ff"><Sunny /></el-icon>
          <span class="section-title">周末价格上浮</span>
          <el-tag size="small" type="primary">周五/周六/周日</el-tag>
        </div>
        <div class="rule-card">
          <div class="rule-item">
            <div class="rule-label">上浮比例</div>
            <div class="rule-input">
              <el-slider
                v-model="rules.weekendSurcharge"
                :min="0"
                :max="30"
                :step="1"
                :marks="{ 0: '0%', 5: '5%', 10: '10%', 15: '15%', 20: '20%', 25: '25%', 30: '30%' }"
                show-input
              />
            </div>
          </div>
          <div class="rule-preview">
            <el-icon color="#1890ff"><TrendCharts /></el-icon>
            <span>周末期间票价将在基准价基础上上浮 <strong>{{ rules.weekendSurcharge }}%</strong></span>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="rule-section">
        <div class="section-header">
          <el-icon color="#52c41a"><Present /></el-icon>
          <span class="section-title">早鸟优惠折扣</span>
          <el-tag size="small" type="success">提前30天以上购票</el-tag>
        </div>
        <div class="rule-card">
          <div class="rule-item">
            <div class="rule-label">折扣比例</div>
            <div class="rule-input">
              <el-slider
                v-model="rules.earlyBirdDiscount"
                :min="0"
                :max="30"
                :step="1"
                :marks="{ 0: '0%', 5: '5%', 10: '10%', 15: '15%', 20: '20%', 25: '25%', 30: '30%' }"
                show-input
              />
            </div>
          </div>
          <div class="rule-preview">
            <el-icon color="#52c41a"><Discount /></el-icon>
            <span>提前30天以上购票可享受 <strong>{{ rules.earlyBirdDiscount }}%</strong> 折扣优惠</span>
          </div>
        </div>
      </div>

      <div class="rule-section">
        <div class="section-header">
          <el-icon color="#13c2c2"><Clock /></el-icon>
          <span class="section-title">临期折扣优惠</span>
          <el-tag size="small" type="info">航班起飞前3天内</el-tag>
        </div>
        <div class="rule-card">
          <div class="rule-item">
            <div class="rule-label">折扣比例</div>
            <div class="rule-input">
              <el-slider
                v-model="rules.lastMinuteDiscount"
                :min="0"
                :max="40"
                :step="1"
                :marks="{ 0: '0%', 10: '10%', 20: '20%', 30: '30%', 40: '40%' }"
                show-input
              />
            </div>
          </div>
          <div class="rule-preview">
            <el-icon color="#13c2c2"><Discount /></el-icon>
            <span>航班起飞前3天内购票可享受 <strong>{{ rules.lastMinuteDiscount }}%</strong> 折扣优惠</span>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="price-protection">
        <div class="section-header">
          <el-icon color="#ff4d4f"><ShieldCheck /></el-icon>
          <span class="section-title">价格保护机制</span>
        </div>
        <div class="protection-cards">
          <div class="protection-card">
            <div class="protection-icon" style="background: linear-gradient(135deg, #faad14, #ffd666);">
              <el-icon><Top /></el-icon>
            </div>
            <div class="protection-info">
              <div class="protection-label">溢价上限</div>
              <div class="protection-value">基准价 + ¥{{ cabinConfig.premiumLimit }}</div>
            </div>
          </div>
          <div class="protection-card">
            <div class="protection-icon" style="background: linear-gradient(135deg, #52c41a, #95de64);">
              <el-icon><Bottom /></el-icon>
            </div>
            <div class="protection-info">
              <div class="protection-label">最低折扣</div>
              <div class="protection-value">{{ cabinConfig.minDiscount }}% 基准价</div>
            </div>
          </div>
        </div>
        <div class="protection-desc">
          动态定价后的最终价格不会超出上述限制，确保价格合规合理。
        </div>
      </div>

      <div class="rule-preview-section">
        <el-divider content-position="left">规则预览</el-divider>
        <div class="preview-table">
          <el-table :data="previewData" border size="small">
            <el-table-column prop="scenario" label="适用场景" width="180" />
            <el-table-column prop="adjustment" label="价格调整" width="150" />
            <el-table-column prop="effect" label="效果预览">
              <template #default="{ row }">
                <div class="effect-bar">
                  <div class="bar-base"></div>
                  <div
                    class="bar-adjust"
                    :class="row.type"
                    :style="{ width: Math.abs(row.percent) + '%' }"
                  ></div>
                  <span class="bar-label" :class="row.type">
                    {{ row.percent > 0 ? '+' : '' }}{{ row.percent }}%
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="resetRules">重置默认</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        <el-icon v-if="!saving"><Check /></el-icon>
        保存规则
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Setting, Calendar, Van, Sunny, Present, Clock, ShieldCheck,
  TrendCharts, Discount, Top, Bottom, Check
} from '@element-plus/icons-vue'
import { CabinClassEnum } from '@/utils/enums'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cabinClass: { type: String, default: 'economy' },
  initialRules: { type: Object, default: () => null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const saving = ref(false)

const rules = reactive({
  holidaySurcharge: 10,
  peakSeasonSurcharge: 15,
  weekendSurcharge: 5,
  earlyBirdDiscount: 10,
  lastMinuteDiscount: 20
})

const cabinConfig = computed(() => {
  const config = Object.values(CabinClassEnum).find(c => c.value === props.cabinClass)
  return config ? {
    premiumLimit: config.minPrice > 1000 ? 500 : config.minPrice > 500 ? 200 : 100,
    minDiscount: config.minPrice > 1000 ? 50 : config.minPrice > 500 ? 60 : 70
  } : { premiumLimit: 200, minDiscount: 70 }
})

const previewData = computed(() => [
  { scenario: '正常时段', adjustment: '基准价格', percent: 0, type: 'base' },
  { scenario: '周末出行', adjustment: `上浮 ${rules.weekendSurcharge}%`, percent: rules.weekendSurcharge, type: 'up' },
  { scenario: '节假日', adjustment: `上浮 ${rules.holidaySurcharge}%`, percent: rules.holidaySurcharge, type: 'up' },
  { scenario: '出行高峰', adjustment: `上浮 ${rules.peakSeasonSurcharge}%`, percent: rules.peakSeasonSurcharge, type: 'up' },
  { scenario: '提前30天购票', adjustment: `优惠 ${rules.earlyBirdDiscount}%`, percent: -rules.earlyBirdDiscount, type: 'down' },
  { scenario: '临期购票(3天内)', adjustment: `优惠 ${rules.lastMinuteDiscount}%`, percent: -rules.lastMinuteDiscount, type: 'down' }
])

const resetRules = () => {
  rules.holidaySurcharge = 10
  rules.peakSeasonSurcharge = 15
  rules.weekendSurcharge = 5
  rules.earlyBirdDiscount = 10
  rules.lastMinuteDiscount = 20
}

const handleSave = async () => {
  saving.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('动态定价规则保存成功')
    emit('success', { ...rules })
    visible.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

watch(() => props.initialRules, (val) => {
  if (val) {
    Object.assign(rules, val)
  }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
  if (val && props.initialRules) {
    Object.assign(rules, props.initialRules)
  }
})
</script>

<style lang="scss" scoped>
.flight-price-rule-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .rule-content {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;
    }
  }

  .rule-intro {
    margin-bottom: 24px;
  }

  .rule-section {
    margin-bottom: 20px;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .section-title {
        font-size: 15px;
        font-weight: 600;
        flex: 1;
      }
    }

    .rule-card {
      background: #fafafa;
      border-radius: 8px;
      padding: 16px 20px;

      .rule-item {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;

        .rule-label {
          width: 80px;
          color: #606266;
          font-weight: 500;
        }

        .rule-input {
          flex: 1;
        }
      }

      .rule-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
        border-radius: 6px;
        color: #1890ff;
        font-size: 13px;

        strong {
          color: #1890ff;
          font-size: 14px;
        }
      }
    }
  }

  .price-protection {
    .protection-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;

      .protection-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .protection-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
        }

        .protection-info {
          .protection-label {
            font-size: 13px;
            color: #909399;
            margin-bottom: 4px;
          }
          .protection-value {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }

    .protection-desc {
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
  }

  .rule-preview-section {
    margin-top: 24px;

    .effect-bar {
      position: relative;
      height: 24px;
      display: flex;
      align-items: center;

      .bar-base {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 100%;
        background: #d9d9d9;
      }

      .bar-adjust {
        height: 16px;
        border-radius: 4px;
        position: absolute;
        left: 50%;

        &.base {
          width: 40% !important;
          left: 30%;
          background: linear-gradient(90deg, #d9d9d9, #bfbfbf);
        }

        &.up {
          background: linear-gradient(90deg, #ffd666, #faad14);
        }

        &.down {
          background: linear-gradient(90deg, #95de64, #52c41a);
          transform: translateX(-100%);
        }
      }

      .bar-label {
        position: absolute;
        left: 50%;
        font-size: 12px;
        font-weight: 600;
        transform: translateX(-50%);

        &.up {
          color: #faad14;
        }
        &.down {
          color: #52c41a;
        }
        &.base {
          color: #909399;
        }
      }
    }
  }
}
</style>
