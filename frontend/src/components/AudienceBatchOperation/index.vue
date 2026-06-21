<template>
  <div class="audience-batch-operation">
    <el-steps :active="step" finish-status="success" align-center style="margin-bottom: 24px">
      <el-step title="选择操作" />
      <el-step title="配置参数" />
      <el-step title="确认执行" />
    </el-steps>

    <div v-if="step === 1" class="operation-select">
      <div
        v-for="op in operations"
        :key="op.value"
        class="op-card"
        :class="{ active: selectedOp === op.value }"
        @click="selectedOp = op.value"
      >
        <div class="op-icon" :style="{ background: op.gradient }">
          <el-icon><component :is="op.icon" /></el-icon>
        </div>
        <div class="op-text">
          <h4>{{ op.label }}</h4>
          <p>{{ op.desc }}</p>
        </div>
        <el-radio :model-value="selectedOp" :value="op.value" />
      </div>
    </div>

    <div v-if="step === 2" class="config-area">
      <template v-if="selectedOp === 'import'">
        <h4 class="step-title">导入定向用户</h4>
        <el-radio-group v-model="importMode" style="margin-bottom: 16px">
          <el-radio value="phone">按手机号导入</el-radio>
          <el-radio value="userId">按用户ID导入</el-radio>
        </el-radio-group>

        <el-input
          v-model="importContent"
          type="textarea"
          :rows="8"
          :placeholder="importMode === 'phone'
            ? '请输入手机号列表，每行1个或用逗号分隔。\n示例：\n13800138000\n13800138001'
            : '请输入用户ID列表，每行1个或用逗号分隔'"
          resize="none"
        />
        <div class="config-tip">
          <el-icon color="#e6a23c"><InfoFilled /></el-icon>
          <span>系统将自动排除高风险账号、封禁用户及重复用户。</span>
          <b>共识别 {{ importParsed.length }} 条数据</b>
        </div>
      </template>

      <template v-if="selectedOp === 'exclude'">
        <h4 class="step-title">剔除无效用户</h4>
        <el-form label-width="90px">
          <el-form-item label="剔除原因">
            <el-select v-model="excludeReason" placeholder="选择或输入原因">
              <el-option label="非定向用户参与" value="非定向用户参与" />
              <el-option label="恶意刷活动嫌疑" value="恶意刷活动嫌疑" />
              <el-option label="用户主动申请退款" value="用户主动申请退款" />
              <el-option label="账号风控异常" value="账号风控异常" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户范围">
            <el-radio-group v-model="excludeMode">
              <el-radio value="phone">按手机号</el-radio>
              <el-radio value="userId">按用户ID</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="用户列表">
            <el-input
              v-model="excludeContent"
              type="textarea"
              :rows="8"
              :placeholder="excludeMode === 'phone' ? '请输入手机号' : '请输入用户ID'"
              resize="none"
            />
          </el-form-item>
        </el-form>
      </template>

      <template v-if="selectedOp === 'tags'">
        <h4 class="step-title">批量更新用户标签</h4>
        <el-form label-width="100px">
          <el-form-item label="操作类型">
            <el-radio-group v-model="tagMode">
              <el-radio value="add">新增标签</el-radio>
              <el-radio value="remove">移除标签</el-radio>
              <el-radio value="both">同时新增和移除</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="tagMode !== 'remove'" label="新增标签">
            <el-select
              v-model="addTagList"
              multiple
              filterable
              placeholder="请选择要新增的用户标签"
              style="width: 100%"
            >
              <el-option
                v-for="t in audienceTags"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="tagMode !== 'add'" label="移除标签">
            <el-select
              v-model="removeTagList"
              multiple
              filterable
              placeholder="请选择要移除的用户标签"
              style="width: 100%"
            >
              <el-option
                v-for="t in audienceTags"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="影响范围">
            <el-radio-group v-model="tagScope">
              <el-radio value="targeted">活动已定向用户</el-radio>
              <el-radio value="all">全量匹配用户</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>

      <template v-if="selectedOp === 'weights'">
        <h4 class="step-title">参与权重差异化配置</h4>
        <p class="config-desc">设置不同用户属性的参与权重，权重越高中奖/获得权益概率越大（1.0为默认）</p>

        <div class="weight-section">
          <h5><el-icon><Medal /></el-icon>按用户等级设置</h5>
          <el-table :data="levelWeights" border size="small">
            <el-table-column prop="label" label="等级" width="120" />
            <el-table-column label="参与权重">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.weight"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  size="small"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="weight-section">
          <h5><el-icon><PriceTag /></el-icon>按用户标签设置</h5>
          <el-table :data="tagWeights" border size="small">
            <el-table-column prop="label" label="用户标签" width="150" />
            <el-table-column label="参与权重">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.weight"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  size="small"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </div>

    <div v-if="step === 3" class="confirm-area">
      <el-result
        :icon="currentOp?.iconType || 'info'"
        :title="confirmTitle"
        :sub-title="confirmSubtitle"
      >
        <template #extra>
          <div v-if="selectedOp === 'import'" class="confirm-stats">
            <div class="stat-row">
              <span>识别用户数</span>
              <b>{{ importParsed.length }}</b>
            </div>
            <div class="stat-row">
              <span>将自动排除风险/封禁</span>
              <b class="text-warning">是</b>
            </div>
          </div>
          <div v-if="selectedOp === 'exclude'" class="confirm-stats">
            <div class="stat-row">
              <span>剔除用户数</span>
              <b class="text-danger">{{ excludeParsed.length }}</b>
            </div>
            <div class="stat-row">
              <span>剔除原因</span>
              <b>{{ excludeReason }}</b>
            </div>
          </div>
          <div v-if="selectedOp === 'tags'" class="confirm-stats">
            <div class="stat-row" v-if="addTagList.length">
              <span>新增标签</span>
              <b class="text-success">{{ addTagList.join('、') }}</b>
            </div>
            <div class="stat-row" v-if="removeTagList.length">
              <span>移除标签</span>
              <b class="text-danger">{{ removeTagList.join('、') }}</b>
            </div>
          </div>
        </template>
      </el-result>
    </div>

    <div v-if="resultVisible" class="result-dialog">
      <el-result
        :icon="execResult?.success ? 'success' : 'warning'"
        :title="execResult?.success ? '操作成功' : '操作部分失败'"
      >
        <template #extra>
          <div class="result-stats">
            <div class="result-item success">
              <h4>{{ execResult?.successCount || 0 }}</h4>
              <span>成功</span>
            </div>
            <div class="result-item warning">
              <h4>{{ execResult?.warningCount || 0 }}</h4>
              <span>被排除</span>
            </div>
            <div class="result-item danger">
              <h4>{{ execResult?.failCount || 0 }}</h4>
              <span>失败</span>
            </div>
          </div>
          <div v-if="execResult?.sampleList?.length" class="result-sample">
            <div class="sample-title">部分结果示例：</div>
            <el-table :data="execResult.sampleList" size="small" border>
              <el-table-column prop="phone" label="手机号" width="140" />
              <el-table-column prop="nickname" label="昵称" />
              <el-table-column prop="levelLabel" label="等级" width="100" />
              <el-table-column prop="status" label="结果" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.status === 'success'" type="success" size="small">成功</el-tag>
                  <el-tag v-else-if="row.status === 'excluded'" type="warning" size="small">风险排除</el-tag>
                  <el-tag v-else type="danger" size="small">失败</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-button type="primary" @click="closeResult" style="margin-top: 16px">
            完成
          </el-button>
        </template>
      </el-result>
    </div>

    <div class="footer-actions" v-if="step < 3 && !resultVisible">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button v-if="step > 1" @click="step--">上一步</el-button>
      <el-button
        v-if="step < 3"
        type="primary"
        :disabled="!canNext"
        @click="handleNext"
      >{{ step === 2 ? '执行操作' : '下一步' }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UploadFilled, DeleteFilled, PriceTag, Histogram,
  Medal, InfoFilled
} from '@element-plus/icons-vue'
import {
  getAudienceConfigApi,
  batchImportAudienceApi,
  batchExcludeAudienceApi,
  batchUpdateAudienceTagsApi,
  updateAudienceWeightsApi
} from '@/api/marketing'

const props = defineProps<{
  campaignId: number;
}>()

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success'): void;
}>()

const step = ref(1)
const selectedOp = ref<string>('')
const resultVisible = ref(false)
const execResult = ref<any>(null)

const operations = [
  {
    value: 'import',
    label: '批量导入定向用户',
    desc: '导入手机号或用户ID，自动排除风险账号',
    icon: 'UploadFilled',
    gradient: 'linear-gradient(135deg, #67c23a, #85ce61)',
    iconType: 'success'
  },
  {
    value: 'exclude',
    label: '批量剔除无效用户',
    desc: '剔除已参与的非目标用户、羊毛党',
    icon: 'DeleteFilled',
    gradient: 'linear-gradient(135deg, #f56c6c, #f78989)',
    iconType: 'warning'
  },
  {
    value: 'tags',
    label: '批量更新用户标签',
    desc: '为定向用户批量增删标签属性',
    icon: 'PriceTag',
    gradient: 'linear-gradient(135deg, #e6a23c, #f0c78a)',
    iconType: 'info'
  },
  {
    value: 'weights',
    label: '差异化参与权重',
    desc: '按用户等级/标签设置权益获取概率',
    icon: 'Histogram',
    gradient: 'linear-gradient(135deg, #8e44ad, #bb6bd9)',
    iconType: 'info'
  }
]

const currentOp = computed(() => operations.find(o => o.value === selectedOp.value))

const audienceTags = ref<{ value: string; label: string; color: string }[]>([])

const importMode = ref('phone')
const importContent = ref('')
const excludeReason = ref('非定向用户参与')
const excludeMode = ref('phone')
const excludeContent = ref('')
const tagMode = ref('add')
const addTagList = ref<string[]>([])
const removeTagList = ref<string[]>([])
const tagScope = ref('targeted')

const levelWeights = ref([
  { level: 1, label: '普通用户', weight: 1.0 },
  { level: 2, label: '银卡', weight: 1.2 },
  { level: 3, label: '金卡', weight: 1.5 },
  { level: 4, label: '铂金', weight: 2.0 },
  { level: 5, label: '钻石', weight: 3.0 }
])
const tagWeights = ref<any[]>([])

const importParsed = computed(() => parseList(importContent.value))
const excludeParsed = computed(() => parseList(excludeContent.value))

const confirmTitle = computed(() => {
  if (!currentOp.value) return ''
  const map: Record<string, string> = {
    import: '确认批量导入定向用户？',
    exclude: '确认批量剔除这些用户？',
    tags: '确认批量更新用户标签？',
    weights: '确认保存参与权重配置？'
  }
  return map[selectedOp.value] || ''
})

const confirmSubtitle = computed(() => {
  const map: Record<string, string> = {
    import: `共 ${importParsed.value.length} 条数据，系统将自动校验风控`,
    exclude: `共 ${excludeParsed.value.length} 个用户将从活动中剔除`,
    tags: `新增[${addTagList.value.join(',') || '无'}]，移除[${removeTagList.value.join(',') || '无'}]`,
    weights: '差异化权重将应用于权益分配逻辑'
  }
  return map[selectedOp.value] || ''
})

const canNext = computed(() => {
  if (!selectedOp.value && step.value === 1) return false
  if (step.value === 2) {
    if (selectedOp.value === 'import') return importParsed.value.length > 0
    if (selectedOp.value === 'exclude') return excludeParsed.value.length > 0 && !!excludeReason.value
    if (selectedOp.value === 'tags') return (addTagList.value.length > 0 || removeTagList.value.length > 0)
  }
  return true
})

const parseList = (str: string) =>
  str
    .split(/[\n,，\s;；]+/)
    .map(s => s.trim())
    .filter(Boolean)

const handleNext = async () => {
  if (step.value === 2) {
    try {
      await ElMessageBox.confirm(confirmTitle.value, '操作确认', {
        type: currentOp.value?.iconType === 'warning' ? 'warning' : 'info',
        confirmButtonText: '确认执行'
      })
      await doExecute()
    } catch (e) { return }
  }
  step.value++
}

const doExecute = async () => {
  try {
    let data: any = null
    if (selectedOp.value === 'import') {
      const params = importMode.value === 'phone'
        ? { phones: importParsed.value as string[], tagSource: 'manual_import' }
        : { userIds: importParsed.value.map(Number), tagSource: 'manual_import' }
      const res = await batchImportAudienceApi(props.campaignId, params)
      data = res.data
    } else if (selectedOp.value === 'exclude') {
      const params = excludeMode.value === 'phone'
        ? { phones: excludeParsed.value as string[], reason: excludeReason.value }
        : { userIds: excludeParsed.value.map(Number), reason: excludeReason.value }
      const res = await batchExcludeAudienceApi(props.campaignId, params)
      data = res.data
    } else if (selectedOp.value === 'tags') {
      const res = await batchUpdateAudienceTagsApi(props.campaignId, {
        addTags: addTagList.value,
        removeTags: removeTagList.value,
        scope: tagScope.value
      })
      data = res.data
    } else if (selectedOp.value === 'weights') {
      const weightConfig = {
        byLevel: Object.fromEntries(levelWeights.value.map(i => [i.level, i.weight])),
        byTag: Object.fromEntries(tagWeights.value.filter(i => i.weight !== 1).map(i => [i.value, i.weight]))
      }
      await updateAudienceWeightsApi(props.campaignId, weightConfig)
      data = { success: true }
    }

    execResult.value = {
      success: true,
      successCount: data?.validCount || data?.affectedCount || 1,
      warningCount: data?.excludedRisk || 0,
      failCount: (data?.totalImported || 0) - (data?.validCount || 0),
      sampleList: data?.sampleUsers?.map((u: any) => ({
        ...u,
        levelLabel: ['', '普通', '银卡', '金卡', '铂金', '钻石'][u.level] || '',
        status: 'success'
      })) || []
    }

    resultVisible.value = true
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const closeResult = () => {
  emit('success')
}

onMounted(async () => {
  try {
    const res = await getAudienceConfigApi()
    audienceTags.value = (res.data as any).userTags || []
    tagWeights.value = audienceTags.value.map(t => ({ ...t, weight: 1.0 }))
  } catch (e) {}
})
</script>

<style lang="scss" scoped>
.audience-batch-operation {
  .operation-select {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;

    .op-card {
      background: #fff;
      border: 1.5px solid #ebeef5;
      border-radius: 12px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover, &.active {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        border-color: #409eff;
      }

      &.active {
        border-color: #409eff;
        background: #ecf5ff;
      }

      .op-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .op-text {
        flex: 1;
        h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #303133; }
        p { margin: 0; font-size: 12px; color: #909399; }
      }
    }
  }

  .config-area {
    .step-title {
      margin: 0 0 18px 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
    .config-desc {
      font-size: 13px;
      color: #909399;
      margin-bottom: 16px;
    }
    .config-tip {
      margin-top: 10px;
      padding: 10px 12px;
      background: #fdf6ec;
      border-radius: 6px;
      font-size: 12px;
      color: #e6a23c;
      display: flex;
      align-items: center;
      gap: 6px;

      b { color: #303133; margin-left: auto; }
    }

    .weight-section {
      margin-bottom: 18px;
      h5 {
        margin: 0 0 10px 0;
        font-size: 13px;
        font-weight: 600;
        color: #606266;
        display: flex;
        align-items: center;
        gap: 6px;

        .el-icon { color: #409eff; }
      }
    }
  }

  .confirm-area {
    .confirm-stats {
      max-width: 400px;
      margin: 0 auto;
      text-align: left;

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px dashed #ebeef5;

        span { color: #606266; }
        b { color: #303133; font-size: 14px; }
        .text-warning { color: #e6a23c; }
        .text-danger { color: #f56c6c; }
        .text-success { color: #67c23a; }
      }
    }
  }

  .result-dialog {
    .result-stats {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 16px;

      .result-item {
        text-align: center;
        h4 {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: 700;
        }
        span { font-size: 12px; color: #909399; }

        &.success h4 { color: #67c23a; }
        &.warning h4 { color: #e6a23c; }
        &.danger h4 { color: #f56c6c; }
      }
    }
  }

  .footer-actions {
    margin-top: 24px;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>
