<template>
  <Teleport to="body">
    <Transition name="dialog-scale">
      <el-dialog
        v-model="innerVisible"
        title="创建内容推送任务"
        :width="680"
        destroy-on-close
        @closed="handleClosed"
      >
        <div class="push-create-dialog">
          <el-form :model="formData" :rules="formRules" ref="formRef" label-width="110px">
            <el-form-item label="选择笔记" prop="noteId">
              <el-select
                v-model="formData.noteId"
                placeholder="请选择要推送的笔记（仅展示已发布笔记）"
                filterable
                remote
                :remote-method="searchNotes"
                :loading="noteLoading"
                clearable
                @change="handleNoteChange"
                style="width: 100%"
              >
                <el-option
                  v-for="note in noteOptions"
                  :key="note.id"
                  :label="note.title + ' (ID:' + note.id + ')'"
                  :value="note.id"
                >
                  <span>{{ note.title }}</span>
                  <span style="float: right; color: #8492a6; font-size: 12px">
                    等级:{{ note.flowLevel }} | 作者:{{ note.authorName }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="目标流量池" prop="poolId">
              <el-select
                v-model="formData.poolId"
                placeholder="请选择推送所属流量池"
                clearable
                style="width: 100%"
                @change="runValidation"
              >
                <el-option
                  v-for="pool in poolOptions"
                  :key="pool.id"
                  :label="pool.poolName + ' (L' + pool.poolLevel + ')'"
                  :value="pool.id"
                >
                  <div class="pool-option">
                    <el-tag size="small" :color="TRAFFIC_POOL_LEVEL_COLORS[pool.poolLevel]" effect="dark">
                      {{ TRAFFIC_POOL_LEVEL_NAMES[pool.poolLevel] }}
                    </el-tag>
                    <span class="option-name">{{ pool.poolName }}</span>
                    <span class="option-quota">剩余:{{ formatNumber(pool.remainingQuota) }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="推送力度" prop="pushStrength">
              <el-radio-group v-model="formData.pushStrength" @change="runValidation">
                <el-radio-button :label="1">
                  <el-icon><Lightning /></el-icon> 标准
                </el-radio-button>
                <el-radio-button :label="2">
                  <el-icon><Cpu /></el-icon> 加强
                </el-radio-button>
                <el-radio-button :label="3">
                  <el-icon><Odometer /></el-icon> 激进
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="预计完成">
              <el-date-picker
                v-model="formData.expectedEndTime"
                type="datetime"
                placeholder="选择预计完成时间（可选）"
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-form>

          <el-divider v-if="validationResult">匹配度校验结果</el-divider>

          <div v-if="validationResult && !validationResult.valid" class="validation-block error">
            <div class="validation-header">
              <el-icon class="icon-error" :size="18"><CircleCloseFilled /></el-icon>
              <span class="title">前置校验未通过，推送被拦截</span>
            </div>
            <div class="validation-errors">
              <div v-for="(e, i) in validationResult.errors" :key="'e'+i" class="error-item">
                <el-icon><Warning /></el-icon> {{ e }}
              </div>
            </div>
            <div v-if="validationResult.warnings?.length" class="validation-warnings">
              <div v-for="(w, i) in validationResult.warnings" :key="'w'+i" class="warn-item">
                <el-icon><InfoFilled /></el-icon> {{ w }}
              </div>
            </div>
            <div v-if="validationResult.blockDetail" class="block-detail">
              <span>拦截说明：</span>{{ validationResult.blockDetail }}
            </div>
            <div v-if="validationResult.matchScore" class="match-result-failed">
              <div class="score-grid">
                <div class="score-item">
                  <div class="label">内容标签匹配</div>
                  <div class="val">{{ validationResult.matchScore.tagScore }}</div>
                </div>
                <div class="score-item">
                  <div class="label">用户兴趣匹配</div>
                  <div class="val">{{ validationResult.matchScore.interestScore }}</div>
                </div>
                <div class="score-item">
                  <div class="label">用户画像匹配</div>
                  <div class="val">{{ validationResult.matchScore.profileScore }}</div>
                </div>
                <div class="score-item total">
                  <div class="label">综合匹配度</div>
                  <div class="val">{{ validationResult.matchScore.totalScore }} / {{ validationResult.matchScore.minScore }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="validationResult && validationResult.valid" class="validation-block success">
            <div class="validation-header">
              <el-icon class="icon-success" :size="18"><CircleCheckFilled /></el-icon>
              <span class="title">前置校验通过，符合推送条件</span>
            </div>
            <div v-if="validationResult.warnings?.length" class="validation-warnings">
              <div v-for="(w, i) in validationResult.warnings" :key="'w'+i" class="warn-item">
                <el-icon><InfoFilled /></el-icon> {{ w }}
              </div>
            </div>
            <div v-if="validationResult.matchScore" class="match-result">
              <div class="score-grid">
                <div class="score-item">
                  <div class="label">内容标签匹配</div>
                  <div class="val ok">{{ validationResult.matchScore.tagScore }}</div>
                </div>
                <div class="score-item">
                  <div class="label">用户兴趣匹配</div>
                  <div class="val ok">{{ validationResult.matchScore.interestScore }}</div>
                </div>
                <div class="score-item">
                  <div class="label">用户画像匹配</div>
                  <div class="val ok">{{ validationResult.matchScore.profileScore }}</div>
                </div>
                <div class="score-item total">
                  <div class="label">综合匹配度</div>
                  <div class="val ok big">{{ validationResult.matchScore.totalScore }}</div>
                </div>
              </div>
            </div>
            <div v-if="validationResult.estimateTarget" class="estimate-info">
              <el-icon><TrendCharts /></el-icon>
              预估目标曝光量：
              <span class="estimate-val">{{ formatNumber(validationResult.estimateTarget) }}</span>
            </div>
            <div v-if="validationResult.contentTags?.length" class="content-tags">
              <div class="tags-label">内容标签：</div>
              <el-tag
                v-for="t in validationResult.contentTags"
                :key="t.id"
                size="small"
                :type="t.isCore === 1 ? 'danger' : 'info'"
                effect="light"
                class="ct"
              >
                {{ t.name }}<span v-if="t.isCore === 1" class="core-badge">核心</span>
              </el-tag>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button @click="innerVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="creating"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <el-icon><Promotion /></el-icon> 创建推送任务
          </el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  CircleCheckFilled, CircleCloseFilled, Warning, InfoFilled,
  Lightning, Cpu, Odometer, TrendCharts, Promotion
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { formatNumber } from '@hooks/index'
import {
  validateContentPushCreate,
  createContentPush
} from '@api/content-push'
import { getTrafficPoolList } from '@api/traffic-pool'
import type { PushCreateValidationResult } from '@/types/business'
import {
  TRAFFIC_POOL_LEVEL_NAMES,
  TRAFFIC_POOL_LEVEL_COLORS
} from '@/enums/business'

const props = defineProps<{
  modelValue: boolean
  defaultNoteId?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'created': []
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const formRef = ref<FormInstance>()
const creating = ref(false)
const noteLoading = ref(false)
const noteOptions = ref<any[]>([])
const poolOptions = ref<any[]>([])
const validationResult = ref<PushCreateValidationResult | null>(null)

const formData = ref({
  noteId: undefined as number | undefined,
  poolId: undefined as number | undefined,
  pushStrength: 1,
  expectedEndTime: undefined as string | undefined
})

const canSubmit = computed(() => {
  return validationResult.value?.valid === true
})

const formRules: FormRules = {
  noteId: [{ required: true, message: '请选择要推送的笔记', trigger: 'change' }],
  poolId: [{ required: true, message: '请选择目标流量池', trigger: 'change' }]
}

const searchNotes = async (keyword: string) => {
  if (!keyword) return
  noteLoading.value = true
  try {
    const { getNoteList } = await import('@api/content')
    const result = await getNoteList({ page: 1, pageSize: 20, keyword, status: 2 })
    noteOptions.value = result.list.map((n: any) => ({
      id: n.id, title: n.title, authorName: n.authorName, flowLevel: n.flowLevel
    }))
  } catch (e) {
    console.error(e)
  } finally {
    noteLoading.value = false
  }
}

const loadPools = async () => {
  try {
    const result = await getTrafficPoolList({ page: 1, pageSize: 100, status: 1 })
    poolOptions.value = result.list
  } catch (e) {
    console.error(e)
  }
}

const runValidation = async () => {
  if (!formData.value.noteId || !formData.value.poolId) {
    validationResult.value = null
    return
  }
  try {
    validationResult.value = await validateContentPushCreate({
      noteId: formData.value.noteId,
      poolId: formData.value.poolId,
      pushStrength: formData.value.pushStrength
    })
  } catch (e: any) {
    validationResult.value = null
  }
}

const handleNoteChange = () => {
  if (formData.value.poolId) runValidation()
}

watch(() => props.modelValue, (v) => {
  if (v) {
    loadPools()
    if (props.defaultNoteId) {
      formData.value.noteId = props.defaultNoteId
    }
  }
})

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    creating.value = true
    const res = await createContentPush({
      noteId: formData.value.noteId!,
      poolId: formData.value.poolId!,
      pushStrength: formData.value.pushStrength,
      expectedEndTime: formData.value.expectedEndTime
    })
    if (res.blocked) {
      ElMessage.warning('任务已创建但被系统拦截：' + (res.reason || res.detail || '请查看拦截记录'))
    } else {
      ElMessage.success('推送任务创建成功，任务编号：' + res.taskNo)
    }
    emit('created')
    innerVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

const handleClosed = () => {
  formData.value = { noteId: undefined, poolId: undefined, pushStrength: 1, expectedEndTime: undefined }
  validationResult.value = null
  noteOptions.value = []
}
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

.push-create-dialog {
  .pool-option {
    display: flex;
    align-items: center;
    gap: 10px;

    .option-name {
      flex: 1;
    }

    .option-quota {
      font-size: 12px;
      color: $text-secondary;
      font-family: 'DIN', monospace;
    }
  }

  .validation-block {
    padding: 16px;
    border-radius: 8px;

    .validation-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      margin-bottom: 12px;

      .title {
        font-size: 14px;
      }
    }

    &.error {
      background: rgba(245, 108, 108, 0.06);
      border: 1px solid rgba(245, 108, 108, 0.2);

      .icon-error { color: #f56c6c; }
      .title { color: #f56c6c; }
    }

    &.success {
      background: rgba(103, 194, 58, 0.06);
      border: 1px solid rgba(103, 194, 58, 0.2);

      .icon-success { color: #67c23a; }
      .title { color: #67c23a; }
    }

    .validation-errors {
      margin-bottom: 10px;
      .error-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #f56c6c;
        margin-bottom: 4px;
      }
    }

    .validation-warnings {
      margin-bottom: 10px;
      .warn-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #e6a23c;
        margin-bottom: 4px;
      }
    }

    .block-detail {
      font-size: 12px;
      color: $text-secondary;
      padding: 8px;
      background: rgba(0,0,0,0.03);
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .score-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 12px;

      .score-item {
        padding: 10px;
        background: #fff;
        border-radius: 6px;
        text-align: center;

        .label {
          font-size: 12px;
          color: $text-secondary;
          margin-bottom: 6px;
        }
        .val {
          font-size: 22px;
          font-weight: 600;
          color: #f56c6c;
          font-family: 'DIN', monospace;

          &.ok {
            color: #67c23a;

            &.big {
              font-size: 26px;
            }
          }
        }

        &.total {
          background: linear-gradient(135deg, rgba(103,194,58,0.08), rgba(64,158,255,0.08));
        }
      }
    }

    .estimate-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: $text-primary;
      padding: 10px 12px;
      background: rgba(64, 158, 255, 0.06);
      border-radius: 6px;

      .estimate-val {
        font-weight: 600;
        color: #409eff;
        font-family: 'DIN', monospace;
        font-size: 16px;
      }
    }

    .content-tags {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;

      .tags-label {
        font-size: 13px;
        color: $text-secondary;
        line-height: 22px;
      }

      .ct {
        .core-badge {
          margin-left: 4px;
          font-size: 10px;
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
