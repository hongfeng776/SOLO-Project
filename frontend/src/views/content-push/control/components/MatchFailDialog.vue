<template>
  <Teleport to="body">
    <Transition name="dialog-scale">
      <el-dialog
        v-model="innerVisible"
        title="匹配度不足/推送拦截"
        :width="560"
        destroy-on-close
      >
        <div v-if="validationResult" class="match-fail-dialog">
          <div class="fail-header">
            <div class="fail-icon">
              <el-icon :size="42" color="#f56c6c"><CircleCloseFilled /></el-icon>
            </div>
            <div class="fail-title-wrap">
              <div class="fail-title">前置校验未通过，推送被拦截</div>
              <div class="fail-sub">请优化相关条件后再尝试推送</div>
            </div>
          </div>

          <el-divider />

          <div class="errors-section" v-if="validationResult.errors?.length">
            <div class="section-label">
              <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
              <span>错误问题</span>
            </div>
            <ul class="error-list">
              <li v-for="(e, i) in validationResult.errors" :key="i">
                {{ e }}
              </li>
            </ul>
          </div>

          <div class="warnings-section" v-if="validationResult.warnings?.length">
            <div class="section-label">
              <el-icon color="#e6a23c"><WarningFilled /></el-icon>
              <span>警告提示</span>
            </div>
            <ul class="warn-list">
              <li v-for="(w, i) in validationResult.warnings" :key="i">
                {{ w }}
              </li>
            </ul>
          </div>

          <div v-if="validationResult.matchScore" class="match-section">
            <div class="section-label">
              <el-icon color="#409eff"><Histogram /></el-icon>
              <span>匹配度分析</span>
            </div>
            <div class="match-grid">
              <div class="match-item">
                <div class="m-label">内容标签匹配</div>
                <div class="m-val fail">{{ validationResult.matchScore.tagScore }}</div>
                <el-progress :percentage="Number(validationResult.matchScore.tagScore)" color="#f56c6c" :stroke-width="6" :show-text="false" />
              </div>
              <div class="match-item">
                <div class="m-label">用户兴趣匹配</div>
                <div class="m-val fail">{{ validationResult.matchScore.interestScore }}</div>
                <el-progress :percentage="Number(validationResult.matchScore.interestScore)" color="#f56c6c" :stroke-width="6" :show-text="false" />
              </div>
              <div class="match-item">
                <div class="m-label">用户画像匹配</div>
                <div class="m-val fail">{{ validationResult.matchScore.profileScore }}</div>
                <el-progress :percentage="Number(validationResult.matchScore.profileScore)" color="#f56c6c" :stroke-width="6" :show-text="false" />
              </div>
              <div class="match-item total">
                <div class="m-label">综合匹配度</div>
                <div class="m-val big">
                  <span class="fail">{{ validationResult.matchScore.totalScore }}</span>
                  <span class="threshold"> / {{ validationResult.matchScore.minScore }}</span>
                </div>
                <el-progress :percentage="Number(validationResult.matchScore.totalScore)" color="#f56c6c" :stroke-width="8" :show-text="false" />
              </div>
            </div>
          </div>

          <div v-if="validationResult.blockDetail" class="block-section">
            <div class="section-label">
              <el-icon color="#9c27b0"><InfoFilled /></el-icon>
              <span>拦截详细说明</span>
            </div>
            <div class="block-detail">{{ validationResult.blockDetail }}</div>
          </div>

          <div class="suggestion-section">
            <div class="section-label">
              <el-icon color="#67c23a"><Finished /></el-icon>
              <span>优化建议</span>
            </div>
            <ul class="suggestion-list">
              <li v-if="validationResult.matchScore && validationResult.matchScore.tagScore < 60">
                为笔记添加更多精准的<strong>内容标签</strong>（尤其是核心标签），可大幅提升标签匹配分
              </li>
              <li v-if="validationResult.matchScore && validationResult.matchScore.profileScore < 60">
                提升作者等级、笔记流量等级，可增强<strong>用户画像匹配</strong>度
              </li>
              <li v-if="validationResult.blockReason === 'pool_not_match'">
                选择与笔记流量等级匹配的流量池，或先提升笔记等级再准入更高等级池
              </li>
              <li v-if="validationResult.blockReason === 'not_reviewed'">
                确保笔记已通过审核并处于「已发布」状态
              </li>
              <li v-if="validationResult.blockReason === 'violation'">
                处理笔记违规记录后再尝试推送
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <el-button @click="innerVisible = false">我知道了</el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CircleCloseFilled, WarningFilled, Histogram, InfoFilled, Finished
} from '@element-plus/icons-vue'
import type { PushCreateValidationResult } from '@/types/business'

const props = defineProps<{
  modelValue: boolean
  validationResult: PushCreateValidationResult | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
</script>

<style lang="scss" scoped>
.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.match-fail-dialog {
  .fail-header {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 8px 0;

    .fail-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(245, 108, 108, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: shake-icon 0.5s ease;
    }

    .fail-title {
      font-size: 18px;
      font-weight: 600;
      color: #f56c6c;
      margin-bottom: 4px;
    }
    .fail-sub {
      font-size: 13px;
      color: $text-secondary;
    }
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: $text-primary;
    margin-bottom: 10px;
  }

  .errors-section,
  .warnings-section,
  .match-section,
  .block-section,
  .suggestion-section {
    margin-bottom: 18px;
  }

  .error-list,
  .warn-list,
  .suggestion-list {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.6;
    }
  }

  .error-list {
    color: #f56c6c;
    li::marker { color: #f56c6c; }
  }
  .warn-list {
    color: #e6a23c;
    li::marker { color: #e6a23c; }
  }
  .suggestion-list {
    color: $text-primary;
    li::marker { color: #67c23a; }
    strong { color: #67c23a; }
  }

  .match-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 12px;
    background: rgba(245, 108, 108, 0.04);
    border-radius: 8px;

    .match-item {
      text-align: center;

      .m-label {
        font-size: 11px;
        color: $text-secondary;
        margin-bottom: 4px;
      }
      .m-val {
        font-size: 20px;
        font-weight: 700;
        font-family: 'DIN', monospace;
        margin-bottom: 6px;

        &.fail { color: #f56c6c; }

        &.big {
          font-size: 24px;
          .threshold {
            font-size: 14px;
            color: $text-secondary;
            font-weight: 500;
          }
        }
      }

      &.total {
        padding: 8px;
        background: #fff;
        border-radius: 6px;
        border: 1px solid rgba(245, 108, 108, 0.2);
      }
    }
  }

  .block-detail {
    padding: 10px 12px;
    background: rgba(156, 39, 176, 0.06);
    border: 1px solid rgba(156, 39, 176, 0.2);
    border-radius: 6px;
    font-size: 13px;
    color: #9c27b0;
    line-height: 1.6;
  }
}

@keyframes shake-icon {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
</style>
